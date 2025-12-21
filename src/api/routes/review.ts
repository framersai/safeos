/**
 * Review Routes
 *
 * API routes for human review of flagged content.
 *
 * @module api/routes/review
 */

import { Router, Request, Response } from 'express';
import { getSafeOSDatabase, now } from '../../db';

// =============================================================================
// Router
// =============================================================================

export const reviewRoutes = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/review/flags - List content flags
 */
reviewRoutes.get('/flags', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { status, tier, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM content_flags WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (tier !== undefined) {
      query += ' AND tier = ?';
      params.push(Number(tier));
    }

    query += ' ORDER BY tier DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const flags = await db.all(query, params);

    // Parse metadata JSON
    const parsed = flags.map((f: any) => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : {},
    }));

    // Get total count
    const countResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM content_flags WHERE 1=1' +
        (status ? ' AND status = ?' : '') +
        (tier !== undefined ? ' AND tier = ?' : ''),
      params.slice(0, -2)
    );

    res.json({
      flags: parsed,
      total: countResult?.count || 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Failed to list content flags:', error);
    res.status(500).json({ error: 'Failed to list content flags' });
  }
});

/**
 * GET /api/review/flags/:id - Get flag by ID
 */
reviewRoutes.get('/flags/:id', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const flag = await db.get('SELECT * FROM content_flags WHERE id = ?', [id]);

    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    res.json({
      flag: {
        ...flag,
        metadata: (flag as any).metadata ? JSON.parse((flag as any).metadata) : {},
      },
    });
  } catch (error) {
    console.error('Failed to get flag:', error);
    res.status(500).json({ error: 'Failed to get flag' });
  }
});

/**
 * POST /api/review/flags/:id/action - Take action on a flag
 */
reviewRoutes.post('/flags/:id/action', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;
    const { action, notes } = req.body;

    const flag = await db.get('SELECT * FROM content_flags WHERE id = ?', [id]);
    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const validActions = ['approved', 'rejected', 'escalated', 'banned'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await db.run(
      `UPDATE content_flags SET status = ?, reviewed_at = ?, reviewer_notes = ? WHERE id = ?`,
      [action, now(), notes || null, id]
    );

    // If banned, also ban the stream
    if (action === 'banned') {
      await db.run(
        'UPDATE streams SET status = ? WHERE id = ?',
        ['banned', (flag as any).stream_id]
      );
    }

    const updated = await db.get('SELECT * FROM content_flags WHERE id = ?', [id]);

    res.json({
      flag: {
        ...updated,
        metadata: (updated as any).metadata ? JSON.parse((updated as any).metadata) : {},
      },
    });
  } catch (error) {
    console.error('Failed to action flag:', error);
    res.status(500).json({ error: 'Failed to action flag' });
  }
});

/**
 * GET /api/review/stats - Get review statistics
 */
reviewRoutes.get('/stats', async (_req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();

    // Get counts by status
    const byStatus = await db.all<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM content_flags GROUP BY status'
    );

    // Get counts by tier
    const byTier = await db.all<{ tier: number; count: number }>(
      'SELECT tier, COUNT(*) as count FROM content_flags GROUP BY tier'
    );

    // Get pending count
    const pending = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM content_flags WHERE status = 'pending'"
    );

    // Get escalated count
    const escalated = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM content_flags WHERE status = 'escalated'"
    );

    res.json({
      stats: {
        pending: pending?.count || 0,
        escalated: escalated?.count || 0,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s.count])),
        byTier: Object.fromEntries(byTier.map((t) => [`tier${t.tier}`, t.count])),
      },
    });
  } catch (error) {
    console.error('Failed to get review stats:', error);
    res.status(500).json({ error: 'Failed to get review stats' });
  }
});

/**
 * GET /api/review/queue - Get review queue (pending flags sorted by priority)
 */
reviewRoutes.get('/queue', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { limit = 20 } = req.query;

    const queue = await db.all(
      `SELECT * FROM content_flags 
       WHERE status IN ('pending', 'escalated')
       ORDER BY 
         CASE status WHEN 'escalated' THEN 0 ELSE 1 END,
         tier DESC,
         created_at ASC
       LIMIT ?`,
      [Number(limit)]
    );

    // Parse metadata JSON
    const parsed = queue.map((f: any) => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : {},
    }));

    res.json({ queue: parsed });
  } catch (error) {
    console.error('Failed to get review queue:', error);
    res.status(500).json({ error: 'Failed to get review queue' });
  }
});

export default reviewRoutes;
