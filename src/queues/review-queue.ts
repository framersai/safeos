/**
 * Human Review Queue
 *
 * Queue infrastructure for flagged content that requires human review.
 * Implements anonymization and escalation tiers.
 *
 * @module queues/review-queue
 */

import type { ContentFlag, ModerationTier } from '../types/index.js';
import { getSafeOSDatabase, generateId, now } from '../db/index.js';
import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export type ReviewStatus = 'pending' | 'assigned' | 'reviewed' | 'escalated' | 'dismissed';

export interface ReviewItem {
  id: string;
  flagId: string;
  streamId: string;
  frameId?: string;
  tier: ModerationTier;
  categories: string[];
  status: ReviewStatus;
  assignedTo?: string;
  assignedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  decision?: 'safe' | 'block' | 'escalate' | 'ban';
  notes?: string;
  anonymized: boolean;
  blurLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewerStats {
  reviewerId: string;
  reviewCount: number;
  avgReviewTimeMs: number;
  accuracyScore?: number;
}

// =============================================================================
// Anonymization Helpers
// =============================================================================

/**
 * Blur levels for anonymization
 */
export const BLUR_LEVELS: Record<ModerationTier, number> = {
  0: 0, // Tier 0: No concern
  1: 0, // Tier 1: No blur (automated only)
  2: 10, // Tier 2: Light blur
  3: 30, // Tier 3: Heavy blur for human review
  4: 50, // Tier 4: Maximum blur for law enforcement
};

/**
 * Get blur level for a tier
 */
export function getBlurLevel(tier: ModerationTier): number {
  return BLUR_LEVELS[tier] || 30;
}

// =============================================================================
// Review Queue Class
// =============================================================================

export class ReviewQueue extends EventEmitter {
  private reviewerPool: Set<string> = new Set();

  constructor() {
    super();
  }

  // ===========================================================================
  // Queue Operations
  // ===========================================================================

  /**
   * Add a flagged item to the review queue
   */
  async enqueue(flag: ContentFlag): Promise<string> {
    const db = await getSafeOSDatabase();
    const id = generateId();
    const timestamp = now();

    const tier = flag.tier as ModerationTier;
    const reviewItem: ReviewItem = {
      id,
      flagId: flag.id,
      streamId: flag.streamId,
      frameId: flag.analysisId,
      tier: tier,
      categories: [flag.category],
      status: 'pending',
      anonymized: tier >= 3,
      blurLevel: getBlurLevel(tier),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.run(
      `INSERT INTO review_queue 
       (id, flag_id, stream_id, frame_id, tier, categories, status, anonymized, blur_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        id,
        flag.id,
        flag.streamId,
        flag.analysisId || null,
        tier,
        JSON.stringify([flag.category]),
        reviewItem.anonymized ? 1 : 0,
        reviewItem.blurLevel,
        timestamp,
        timestamp,
      ]
    );

    this.emit('item:queued', { itemId: id, tier: flag.tier });
    console.log(`[ReviewQueue] Item ${id} queued (tier ${flag.tier})`);

    return id;
  }

  /**
   * Get the next item for a reviewer
   */
  async getNextItem(reviewerId: string): Promise<ReviewItem | null> {
    const db = await getSafeOSDatabase();

    // Get highest priority pending item
    const item = await db.get<{
      id: string;
      flag_id: string;
      stream_id: string;
      frame_id: string | null;
      tier: number;
      categories: string;
      status: string;
      anonymized: number;
      blur_level: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM review_queue 
       WHERE status = 'pending'
       ORDER BY tier DESC, created_at ASC
       LIMIT 1`
    );

    if (!item) {
      return null;
    }

    const timestamp = now();

    // Assign to reviewer
    await db.run(
      `UPDATE review_queue 
       SET status = 'assigned', assigned_to = ?, assigned_at = ?, updated_at = ?
       WHERE id = ?`,
      [reviewerId, timestamp, timestamp, item.id]
    );

    this.emit('item:assigned', { itemId: item.id, reviewerId });

    return {
      id: item.id,
      flagId: item.flag_id,
      streamId: item.stream_id,
      frameId: item.frame_id || undefined,
      tier: item.tier as ModerationTier,
      categories: JSON.parse(item.categories) as string[],
      status: 'assigned',
      assignedTo: reviewerId,
      assignedAt: timestamp,
      anonymized: item.anonymized === 1,
      blurLevel: item.blur_level,
      createdAt: item.created_at,
      updatedAt: timestamp,
    };
  }

  /**
   * Submit a review decision
   */
  async submitReview(
    itemId: string,
    reviewerId: string,
    decision: 'safe' | 'block' | 'escalate' | 'ban',
    notes?: string
  ): Promise<void> {
    const db = await getSafeOSDatabase();
    const timestamp = now();

    const newStatus: ReviewStatus = decision === 'escalate' ? 'escalated' : 'reviewed';

    await db.run(
      `UPDATE review_queue 
       SET status = ?, reviewed_by = ?, reviewed_at = ?, decision = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [newStatus, reviewerId, timestamp, decision, notes || null, timestamp, itemId]
    );

    // Update the original content flag
    await db.run(
      `UPDATE content_flags 
       SET status = ?, reviewed_by = ?, reviewed_at = ?, notes = ?
       WHERE id = (SELECT flag_id FROM review_queue WHERE id = ?)`,
      [newStatus, reviewerId, timestamp, notes || null, itemId]
    );

    this.emit('item:reviewed', { itemId, reviewerId, decision });
    console.log(`[ReviewQueue] Item ${itemId} reviewed: ${decision}`);

    // Handle escalation to tier 4 (law enforcement)
    if (decision === 'escalate') {
      await this.escalateToTier4(itemId);
    }

    // Handle user bans
    if (decision === 'ban') {
      await this.handleUserBan(itemId);
    }
  }

  /**
   * Dismiss an item (false positive)
   */
  async dismiss(itemId: string, reviewerId: string, reason?: string): Promise<void> {
    const db = await getSafeOSDatabase();
    const timestamp = now();

    await db.run(
      `UPDATE review_queue 
       SET status = 'dismissed', reviewed_by = ?, reviewed_at = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [reviewerId, timestamp, reason || 'False positive', timestamp, itemId]
    );

    await db.run(
      `UPDATE content_flags 
       SET status = 'dismissed', reviewed_by = ?, reviewed_at = ?, notes = ?
       WHERE id = (SELECT flag_id FROM review_queue WHERE id = ?)`,
      [reviewerId, timestamp, reason || 'False positive', itemId]
    );

    this.emit('item:dismissed', { itemId, reviewerId });
  }

  // ===========================================================================
  // Escalation
  // ===========================================================================

  /**
   * Escalate an item to Tier 4 (law enforcement)
   */
  private async escalateToTier4(itemId: string): Promise<void> {
    const db = await getSafeOSDatabase();

    await db.run(
      `UPDATE review_queue SET tier = 4, updated_at = ? WHERE id = ?`,
      [now(), itemId]
    );

    // Log IP and metadata for potential law enforcement referral
    console.warn(`[ReviewQueue] TIER 4 ESCALATION: Item ${itemId} flagged for law enforcement review`);
    this.emit('item:tier4', { itemId });

    // In production, this would:
    // 1. Preserve all metadata (IP, timestamps, etc.)
    // 2. Lock the content from deletion
    // 3. Notify appropriate authorities if required by law
  }

  /**
   * Handle user ban for severe violations
   */
  private async handleUserBan(_itemId: string): Promise<void> {
    // In production, this would:
    // 1. Look up the user/session associated with the stream
    // 2. Add to ban list
    // 3. Terminate active sessions
    // 4. Log for audit trail
    console.warn(`[ReviewQueue] User ban initiated for item ${_itemId}`);
  }

  // ===========================================================================
  // Reviewer Management
  // ===========================================================================

  /**
   * Register a reviewer
   */
  registerReviewer(reviewerId: string): void {
    this.reviewerPool.add(reviewerId);
    console.log(`[ReviewQueue] Reviewer ${reviewerId} registered`);
  }

  /**
   * Unregister a reviewer
   */
  unregisterReviewer(reviewerId: string): void {
    this.reviewerPool.delete(reviewerId);
    console.log(`[ReviewQueue] Reviewer ${reviewerId} unregistered`);
  }

  /**
   * Get reviewer count
   */
  getReviewerCount(): number {
    return this.reviewerPool.size;
  }

  // ===========================================================================
  // Statistics
  // ===========================================================================

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    assigned: number;
    reviewed: number;
    escalated: number;
    dismissed: number;
    byTier: Record<ModerationTier, number>;
    reviewerCount: number;
  }> {
    const db = await getSafeOSDatabase();

    const statusCounts = await db.all<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count FROM review_queue GROUP BY status`
    );

    const tierCounts = await db.all<{ tier: number; count: number }>(
      `SELECT tier, COUNT(*) as count FROM review_queue WHERE status = 'pending' GROUP BY tier`
    );

    const stats = {
      pending: 0,
      assigned: 0,
      reviewed: 0,
      escalated: 0,
      dismissed: 0,
      byTier: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 } as Record<ModerationTier, number>,
      reviewerCount: this.reviewerPool.size,
    };

    for (const row of statusCounts) {
      const status = row.status as keyof typeof stats;
      if (status in stats && status !== 'byTier' && status !== 'reviewerCount') {
        stats[status] = row.count;
      }
    }

    for (const row of tierCounts) {
      if (row.tier in stats.byTier) {
        stats.byTier[row.tier as ModerationTier] = row.count;
      }
    }

    return stats;
  }
}

// =============================================================================
// Database Schema Extension
// =============================================================================

export const REVIEW_QUEUE_SCHEMA = `
-- Human review queue
CREATE TABLE IF NOT EXISTS review_queue (
  id TEXT PRIMARY KEY,
  flag_id TEXT NOT NULL,
  stream_id TEXT NOT NULL,
  frame_id TEXT,
  tier INTEGER NOT NULL,
  categories TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  assigned_at TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  decision TEXT,
  notes TEXT,
  anonymized INTEGER DEFAULT 0,
  blur_level INTEGER DEFAULT 30,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (flag_id) REFERENCES content_flags(id)
);

CREATE INDEX IF NOT EXISTS idx_review_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_tier ON review_queue(tier);
CREATE INDEX IF NOT EXISTS idx_review_assigned ON review_queue(assigned_to);
`;

// =============================================================================
// Singleton
// =============================================================================

let defaultQueue: ReviewQueue | null = null;

export function getDefaultReviewQueue(): ReviewQueue {
  if (!defaultQueue) {
    defaultQueue = new ReviewQueue();
  }
  return defaultQueue;
}

