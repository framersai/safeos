/**
 * Content Filter
 *
 * 4-tier content moderation system for abuse detection.
 *
 * @module lib/safety/content-filter
 */

import { getSafeOSDatabase, generateId, now } from '../../db';
import { OllamaClient } from '../ollama/client';

// =============================================================================
// Types
// =============================================================================

export interface ModerationResult {
  tier: 0 | 1 | 2 | 3 | 4;
  action: 'allow' | 'blur' | 'block' | 'escalate';
  categories: string[];
  confidence: number;
  reason?: string;
}

export interface ContentFlag {
  id: string;
  streamId: string;
  analysisId?: string;
  category: string;
  tier: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'banned';
  metadata?: Record<string, any>;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Content categories for moderation
 */
const CONTENT_CATEGORIES = [
  'violence',
  'nudity',
  'abuse',
  'neglect',
  'gore',
  'weapons',
  'drugs',
  'self_harm',
  'child_safety',
  'elder_abuse',
  'animal_abuse',
];

/**
 * Moderation tiers:
 * - Tier 0: Safe - no concerns
 * - Tier 1: Minor - blur and continue
 * - Tier 2: Moderate - flag for review
 * - Tier 3: Severe - block and alert
 * - Tier 4: Critical - block, alert, and report
 */
const TIER_ACTIONS: Record<number, 'allow' | 'blur' | 'block' | 'escalate'> = {
  0: 'allow',
  1: 'blur',
  2: 'block',
  3: 'escalate',
  4: 'escalate',
};

const MODERATION_PROMPT = `You are a content safety moderator. Analyze this image for concerning content.

Categories to check:
- violence: Physical harm or threats
- nudity: Inappropriate exposure
- abuse: Child, elder, or animal abuse
- neglect: Signs of neglect (especially for dependents)
- gore: Graphic injuries or blood
- weapons: Dangerous weapons
- drugs: Drug use or paraphernalia
- self_harm: Signs of self-harm
- child_safety: Unsafe situations for children
- elder_abuse: Abuse or neglect of elderly
- animal_abuse: Abuse or neglect of animals

Respond in this format:
TIER: [0-4]
CATEGORIES: [comma-separated list or "none"]
CONFIDENCE: [0-100]
REASON: [brief explanation]

Tier definitions:
0 = Safe, no concerns
1 = Minor concern, may blur
2 = Moderate, needs review
3 = Severe, block content
4 = Critical, report to authorities

Be conservative - when in doubt, flag for review.`;

// =============================================================================
// ContentFilter Class
// =============================================================================

export class ContentFilter {
  private ollamaClient: OllamaClient;

  constructor() {
    this.ollamaClient = new OllamaClient();
  }

  /**
   * Moderate content
   */
  async moderate(
    streamId: string,
    imageBase64: string,
    analysisText?: string
  ): Promise<ModerationResult> {
    // Try local AI moderation first
    const ollamaAvailable = await this.ollamaClient.isHealthy();

    if (ollamaAvailable) {
      try {
        const result = await this.localModeration(imageBase64);

        // Create flag if needed
        if (result.tier > 0) {
          await this.createFlag(streamId, result);
        }

        return result;
      } catch (error) {
        console.error('Local moderation failed:', error);
        // Fall through to rule-based
      }
    }

    // Fallback to rule-based moderation
    const result = this.ruleBasedModeration(analysisText || '');

    if (result.tier > 0) {
      await this.createFlag(streamId, result);
    }

    return result;
  }

  /**
   * Local AI moderation using Ollama
   */
  private async localModeration(imageBase64: string): Promise<ModerationResult> {
    const response = await this.ollamaClient.analyze(
      imageBase64,
      MODERATION_PROMPT
    );

    return this.parseModeration(response);
  }

  /**
   * Rule-based moderation (fallback)
   */
  private ruleBasedModeration(text: string): ModerationResult {
    const lowerText = text.toLowerCase();
    const categories: string[] = [];
    let maxTier = 0;

    // Check for concerning keywords
    const checks: Array<{ keywords: string[]; category: string; tier: number }> = [
      { keywords: ['blood', 'bleeding', 'injury', 'wound'], category: 'gore', tier: 2 },
      { keywords: ['weapon', 'knife', 'gun', 'firearm'], category: 'weapons', tier: 2 },
      { keywords: ['abuse', 'hit', 'strike', 'beat'], category: 'abuse', tier: 3 },
      { keywords: ['neglect', 'abandoned', 'alone', 'unattended'], category: 'neglect', tier: 2 },
      { keywords: ['danger', 'hazard', 'unsafe', 'risk'], category: 'child_safety', tier: 2 },
      { keywords: ['fall', 'fallen', 'collapsed', 'unconscious'], category: 'violence', tier: 2 },
    ];

    for (const check of checks) {
      if (check.keywords.some((kw) => lowerText.includes(kw))) {
        categories.push(check.category);
        maxTier = Math.max(maxTier, check.tier);
      }
    }

    return {
      tier: maxTier as 0 | 1 | 2 | 3 | 4,
      action: TIER_ACTIONS[maxTier],
      categories,
      confidence: 0.5, // Low confidence for rule-based
      reason: categories.length > 0
        ? `Detected keywords in categories: ${categories.join(', ')}`
        : 'No concerning content detected',
    };
  }

  /**
   * Parse moderation response
   */
  private parseModeration(response: string): ModerationResult {
    let tier: 0 | 1 | 2 | 3 | 4 = 0;
    let categories: string[] = [];
    let confidence = 0;
    let reason = '';

    // Parse tier
    const tierMatch = response.match(/TIER:\s*(\d)/i);
    if (tierMatch) {
      const parsedTier = parseInt(tierMatch[1], 10);
      if (parsedTier >= 0 && parsedTier <= 4) {
        tier = parsedTier as 0 | 1 | 2 | 3 | 4;
      }
    }

    // Parse categories
    const categoriesMatch = response.match(/CATEGORIES:\s*(.+?)(?=\n|$)/i);
    if (categoriesMatch) {
      const catStr = categoriesMatch[1].toLowerCase();
      if (catStr !== 'none') {
        categories = catStr
          .split(/[,\s]+/)
          .map((c) => c.trim())
          .filter((c) => CONTENT_CATEGORIES.includes(c));
      }
    }

    // Parse confidence
    const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
    if (confidenceMatch) {
      confidence = parseInt(confidenceMatch[1], 10) / 100;
    }

    // Parse reason
    const reasonMatch = response.match(/REASON:\s*(.+?)(?=\n\n|$)/is);
    if (reasonMatch) {
      reason = reasonMatch[1].trim();
    }

    return {
      tier,
      action: TIER_ACTIONS[tier],
      categories,
      confidence,
      reason,
    };
  }

  /**
   * Create content flag for review
   */
  async createFlag(
    streamId: string,
    result: ModerationResult,
    analysisId?: string
  ): Promise<ContentFlag> {
    const db = await getSafeOSDatabase();

    const flag: ContentFlag = {
      id: generateId(),
      streamId,
      analysisId,
      category: result.categories.join(',') || 'unknown',
      tier: result.tier,
      reason: result.reason || 'Flagged by content filter',
      status: result.tier >= 3 ? 'escalated' : 'pending',
      metadata: {
        confidence: result.confidence,
        categories: result.categories,
      },
    };

    await db.run(
      `INSERT INTO content_flags 
       (id, stream_id, analysis_id, category, tier, reason, status, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        flag.id,
        flag.streamId,
        flag.analysisId || null,
        flag.category,
        flag.tier,
        flag.reason,
        flag.status,
        JSON.stringify(flag.metadata),
        now(),
      ]
    );

    console.log(`Content flag created: ${flag.id} (tier ${flag.tier})`);

    return flag;
  }

  /**
   * Get pending flags for review
   */
  async getPendingFlags(limit: number = 20): Promise<ContentFlag[]> {
    const db = await getSafeOSDatabase();

    const flags = await db.all<any>(
      `SELECT * FROM content_flags 
       WHERE status IN ('pending', 'escalated')
       ORDER BY tier DESC, created_at ASC
       LIMIT ?`,
      [limit]
    );

    return flags.map((f) => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : {},
    }));
  }

  /**
   * Review a flag
   */
  async reviewFlag(
    flagId: string,
    action: 'approved' | 'rejected' | 'escalated' | 'banned',
    notes?: string
  ): Promise<void> {
    const db = await getSafeOSDatabase();

    await db.run(
      `UPDATE content_flags 
       SET status = ?, reviewed_at = ?, reviewer_notes = ?
       WHERE id = ?`,
      [action, now(), notes || null, flagId]
    );

    // If banned, also ban the stream
    if (action === 'banned') {
      const flag = await db.get<any>(
        'SELECT stream_id FROM content_flags WHERE id = ?',
        [flagId]
      );
      if (flag) {
        await db.run(
          'UPDATE streams SET status = ? WHERE id = ?',
          ['banned', flag.stream_id]
        );
      }
    }
  }
}

export default ContentFilter;
