/**
 * Human Review Service
 *
 * Manages content flags, anonymization, and review workflow.
 *
 * @module lib/review/human-review
 */

import { getSafeOSDatabase, generateId, now } from '../../db/index.js';
import type { ContentFlag, ModerationTier } from '../../types/index.js';

// =============================================================================
// Types
// =============================================================================

export interface ReviewAction {
  action: 'approve' | 'reject' | 'escalate' | 'ban';
  reason?: string;
  reviewerNotes?: string;
  reviewedAt: string;
}

export interface AnonymizedFlag {
  id: string;
  tier: ModerationTier;
  category: string;
  reason: string;
  status: string;
  created_at: string;
  // Anonymized content - faces blurred, identifiers removed
  anonymizedImageUrl?: string;
  transcriptSummary?: string;
  // Context without PII
  scenarioType: string;
  timeOfDay: string;
  durationSeconds?: number;
}

export interface LawEnforcementPackage {
  id: string;
  flagId: string;
  reason: string;
  caseNumber?: string;
  createdAt: string;
  // This would include preserved evidence
  preservedData: {
    originalFlagData: boolean;
    relatedAlerts: boolean;
    streamHistory: boolean;
  };
  hash: string; // Integrity hash
}

// =============================================================================
// HumanReviewService Class
// =============================================================================

export class HumanReviewService {
  private stats = {
    flagsReviewed: 0,
    approved: 0,
    rejected: 0,
    escalated: 0,
    bans: 0,
  };

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Create a new content flag for review
   */
  async createFlag(data: {
    streamId: string;
    analysisId?: string;
    category: string;
    tier: ModerationTier;
    reason: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const id = generateId();
    const db = await getSafeOSDatabase();
    const timestamp = now();

    await db.run(
      `INSERT INTO content_flags (id, stream_id, analysis_id, category, tier, reason, status, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        id,
        data.streamId,
        data.analysisId || null,
        data.category,
        data.tier,
        data.reason,
        JSON.stringify(data.metadata || {}),
        timestamp,
      ]
    );

    return id;
  }

  /**
   * Get a flag prepared for review (anonymized)
   */
  async getFlagForReview(id: string): Promise<AnonymizedFlag | null> {
    const db = await getSafeOSDatabase();

    const flag = await db.get<ContentFlag & { scenario?: string }>(
      `SELECT cf.*, s.scenario
       FROM content_flags cf
       LEFT JOIN streams s ON cf.stream_id = s.id
       WHERE cf.id = ?`,
      [id]
    );

    if (!flag) return null;

    // Anonymize the flag
    return this.anonymizeFlag(flag);
  }

  /**
   * Get pending flags by tier
   */
  async getPendingFlags(tier?: ModerationTier): Promise<AnonymizedFlag[]> {
    const db = await getSafeOSDatabase();

    let query = `
      SELECT cf.*, s.scenario
      FROM content_flags cf
      LEFT JOIN streams s ON cf.stream_id = s.id
      WHERE cf.status = 'pending'
    `;
    const params: (number | string)[] = [];

    if (tier !== undefined) {
      query += ' AND cf.tier = ?';
      params.push(tier);
    }

    query += ' ORDER BY cf.tier DESC, cf.created_at ASC';

    const flags = await db.all<(ContentFlag & { scenario?: string })[]>(query, params);
    return flags.map((f) => this.anonymizeFlag(f));
  }

  /**
   * Process a review action
   */
  async processAction(
    flagId: string,
    action: ReviewAction
  ): Promise<{ success: boolean; message: string }> {
    const db = await getSafeOSDatabase();
    this.stats.flagsReviewed++;

    const flag = await db.get<ContentFlag>(
      'SELECT * FROM content_flags WHERE id = ?',
      [flagId]
    );

    if (!flag) {
      return { success: false, message: 'Flag not found' };
    }

    let newStatus: string;
    switch (action.action) {
      case 'approve':
        newStatus = 'approved';
        this.stats.approved++;
        break;
      case 'reject':
        newStatus = 'rejected';
        this.stats.rejected++;
        break;
      case 'escalate':
        newStatus = 'escalated';
        this.stats.escalated++;
        break;
      case 'ban':
        newStatus = 'banned';
        this.stats.bans++;
        await this.processBan(flag);
        break;
      default:
        return { success: false, message: 'Invalid action' };
    }

    await db.run(
      `UPDATE content_flags
       SET status = ?, reviewed_at = ?, reviewer_notes = ?
       WHERE id = ?`,
      [newStatus, action.reviewedAt, action.reviewerNotes || null, flagId]
    );

    return { success: true, message: `Flag ${newStatus}` };
  }

  /**
   * Create law enforcement package for serious cases
   */
  async createLawEnforcementPackage(
    flagId: string,
    options: { reason: string; caseNumber?: string; createdAt: string }
  ): Promise<LawEnforcementPackage> {
    const db = await getSafeOSDatabase();

    const flag = await db.get<ContentFlag>(
      'SELECT * FROM content_flags WHERE id = ?',
      [flagId]
    );

    if (!flag) {
      throw new Error('Flag not found');
    }

    // Check tier - only tier 4 can create LE packages
    if (flag.tier < 4) {
      throw new Error('Law enforcement packages require tier 4 flags');
    }

    // Preserve related data
    const preservedData = {
      originalFlagData: true,
      relatedAlerts: true,
      streamHistory: true,
    };

    // Create integrity hash
    const hashInput = `${flagId}:${options.createdAt}:${options.caseNumber || 'none'}`;
    const hash = await this.createHash(hashInput);

    const packageId = generateId();

    // Store package reference (actual data would be in secure storage)
    await db.run(
      `UPDATE content_flags
       SET metadata = json_set(COALESCE(metadata, '{}'), '$.lawEnforcementPackageId', ?)
       WHERE id = ?`,
      [packageId, flagId]
    );

    return {
      id: packageId,
      flagId,
      reason: options.reason,
      caseNumber: options.caseNumber,
      createdAt: options.createdAt,
      preservedData,
      hash,
    };
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private anonymizeFlag(
    flag: ContentFlag & { scenario?: string }
  ): AnonymizedFlag {
    // Extract time of day without specific date
    const createdDate = new Date(flag.created_at);
    const hour = createdDate.getHours();
    let timeOfDay: string;
    if (hour < 6) timeOfDay = 'night';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    return {
      id: flag.id,
      tier: flag.tier as ModerationTier,
      category: flag.category,
      reason: flag.reason,
      status: flag.status,
      created_at: flag.created_at,
      scenarioType: flag.scenario || 'unknown',
      timeOfDay,
      // Image would be processed through face blurring before being shown
      anonymizedImageUrl: undefined, // Would be generated if image exists
      transcriptSummary: undefined, // Would be summarized if audio exists
    };
  }

  private async processBan(flag: ContentFlag): Promise<void> {
    const db = await getSafeOSDatabase();

    // Get the stream to find user/IP info
    const stream = await db.get<{ user_id?: string }>(
      'SELECT user_id FROM streams WHERE id = ?',
      [flag.stream_id]
    );

    if (stream?.user_id) {
      // Would add to banned users list
      // For now, just update all their streams
      await db.run("UPDATE streams SET status = 'banned' WHERE user_id = ?", [
        stream.user_id,
      ]);
    }

    // End the stream
    await db.run("UPDATE streams SET status = 'banned', ended_at = ? WHERE id = ?", [
      now(),
      flag.stream_id,
    ]);
  }

  private async createHash(input: string): Promise<string> {
    // Simple hash for demo - in production use crypto.subtle or similar
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultService: HumanReviewService | null = null;

export function getDefaultHumanReviewService(): HumanReviewService {
  if (!defaultService) {
    defaultService = new HumanReviewService();
  }
  return defaultService;
}

export function createHumanReviewService(): HumanReviewService {
  return new HumanReviewService();
}
