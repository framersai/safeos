/**
 * Review API Routes
 *
 * Endpoints for human review of flagged content.
 *
 * @module api/routes/review
 */

import { Router, type Request, type Response } from 'express';
import { getSafeOSDatabase, now } from '../../db/index.js';
import { getDefaultHumanReviewService } from '../../lib/review/human-review.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/review/flags
 * List content flags for review
 */
router.get('/flags', async (req: Request, res: Response) => {
  try {
    const {
      limit = '50',
      offset = '0',
      status,
      tier,
    } = req.query;

    const db = await getSafeOSDatabase();

    let query = 'SELECT * FROM content_flags WHERE 1=1';
    const params: (string | number)[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status as string);
    }

    if (tier) {
      query += ' AND tier = ?';
      params.push(parseInt(tier as string, 10));
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string, 10));
    params.push(parseInt(offset as string, 10));

    const flags = await db.all(query, params);

    res.json({
      success: true,
      data: flags.map((f) => ({
        ...f,
        metadata:
          typeof f.metadata === 'string' ? JSON.parse(f.metadata) : f.metadata,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/review/flags/:id
 * Get a specific flag with anonymized content
 */
router.get('/flags/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviewService = getDefaultHumanReviewService();

    const flag = await reviewService.getFlagForReview(id);

    if (!flag) {
      return res.status(404).json({
        success: false,
        error: 'Flag not found',
      });
    }

    res.json({
      success: true,
      data: flag,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/review/flags/:id/action
 * Take action on a content flag
 */
router.post('/flags/:id/action', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason, reviewerNotes } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required (approve, reject, escalate, ban)',
      });
    }

    const validActions = ['approve', 'reject', 'escalate', 'ban'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      });
    }

    const reviewService = getDefaultHumanReviewService();
    const result = await reviewService.processAction(id, {
      action,
      reason,
      reviewerNotes,
      reviewedAt: now(),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/review/queue/stats
 * Get review queue statistics
 */
router.get('/queue/stats', async (_req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();

    // Total pending
    const pendingRow = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM content_flags WHERE status = 'pending'"
    );

    // By tier
    const byTier = await db.all<{ tier: number; count: number }[]>(
      `SELECT tier, COUNT(*) as count FROM content_flags
       WHERE status = 'pending'
       GROUP BY tier
       ORDER BY tier`
    );

    // Processed today
    const processedToday = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM content_flags
       WHERE reviewed_at >= date('now')
       AND status != 'pending'`
    );

    // Average review time
    const avgReviewTime = await db.get<{ avg: number }>(
      `SELECT AVG(
        CAST((julianday(reviewed_at) - julianday(created_at)) * 86400000 AS INTEGER)
      ) as avg
      FROM content_flags
      WHERE status != 'pending' AND reviewed_at IS NOT NULL`
    );

    res.json({
      success: true,
      data: {
        totalPending: pendingRow?.count || 0,
        byTier: Object.fromEntries(byTier.map((r) => [r.tier, r.count])),
        processedToday: processedToday?.count || 0,
        avgReviewTimeMs: avgReviewTime?.avg || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/review/reports
 * Get abuse reports
 */
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const db = await getSafeOSDatabase();

    const reports = await db.all(
      `SELECT cf.*, s.user_id, s.scenario
       FROM content_flags cf
       LEFT JOIN streams s ON cf.stream_id = s.id
       WHERE cf.tier >= 3
       ORDER BY cf.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit as string, 10), parseInt(offset as string, 10)]
    );

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/review/reports/:id/law-enforcement
 * Create law enforcement package for a report
 */
router.post('/reports/:id/law-enforcement', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, caseNumber } = req.body;

    const reviewService = getDefaultHumanReviewService();
    const result = await reviewService.createLawEnforcementPackage(id, {
      reason,
      caseNumber,
      createdAt: now(),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;
