/**
 * Stream Routes
 *
 * API routes for stream management.
 *
 * @module api/routes/streams
 */

import { Router, Request, Response } from 'express';
import { getSafeOSDatabase, generateId, now } from '../../db';
import { requireAuth, getProfileId } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateStreamSchema, UpdateStreamSchema } from '../schemas/index.js';

// =============================================================================
// Router
// =============================================================================

export const streamRoutes = Router();

// Apply auth middleware to all stream routes
streamRoutes.use(requireAuth);

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/streams - List all streams
 */
streamRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const status = req.query.status as string | undefined;

    let query = 'SELECT * FROM streams ORDER BY created_at DESC';
    const params: any[] = [];

    if (status) {
      query = 'SELECT * FROM streams WHERE status = ? ORDER BY created_at DESC';
      params.push(status);
    }

    const streams = await db.all(query, params);
    res.json({ streams });
  } catch (error) {
    console.error('Failed to list streams:', error);
    res.status(500).json({ error: 'Failed to list streams' });
  }
});

/**
 * GET /api/streams/:id - Get stream by ID
 */
streamRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const stream = await db.get('SELECT * FROM streams WHERE id = ?', [id]);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Get alert count
    const alertResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM alerts WHERE stream_id = ? AND acknowledged = 0',
      [id]
    );

    res.json({
      stream: {
        ...(stream as Record<string, unknown>),
        alertCount: alertResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('Failed to get stream:', error);
    res.status(500).json({ error: 'Failed to get stream' });
  }
});

/**
 * POST /api/streams - Create new stream
 */
streamRoutes.post('/', validate(CreateStreamSchema), async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { scenario } = req.body;
    const profileId = getProfileId(req);

    const id = generateId();
    const timestamp = now();

    await db.run(
      `INSERT INTO streams (id, user_id, scenario, status, started_at, created_at)
       VALUES (?, ?, ?, 'active', ?, ?)`,
      [id, profileId, scenario, timestamp, timestamp]
    );

    const stream = await db.get('SELECT * FROM streams WHERE id = ?', [id]);

    res.status(201).json({ stream });
  } catch (error) {
    console.error('Failed to create stream:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
});

/**
 * PATCH /api/streams/:id - Update stream
 */
streamRoutes.patch('/:id', validate(UpdateStreamSchema), async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;
    const { status } = req.body;

    const stream = await db.get('SELECT * FROM streams WHERE id = ?', [id]);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (status) {
      const updates: any = { status };
      if (status === 'ended') {
        updates.ended_at = now();
      }

      await db.run(
        `UPDATE streams SET status = ?, ended_at = ? WHERE id = ?`,
        [status, updates.ended_at || null, id]
      );
    }

    const updated = await db.get('SELECT * FROM streams WHERE id = ?', [id]);
    res.json({ stream: updated });
  } catch (error) {
    console.error('Failed to update stream:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
});

/**
 * DELETE /api/streams/:id - End/delete stream
 */
streamRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const stream = await db.get('SELECT * FROM streams WHERE id = ?', [id]);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Mark as ended instead of deleting
    await db.run(
      `UPDATE streams SET status = 'ended', ended_at = ? WHERE id = ?`,
      [now(), id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete stream:', error);
    res.status(500).json({ error: 'Failed to delete stream' });
  }
});

/**
 * GET /api/streams/:id/stats - Get stream statistics
 */
streamRoutes.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    // Get alert counts by severity
    const alerts = await db.all<{ severity: string; count: number }>(
      `SELECT severity, COUNT(*) as count FROM alerts
       WHERE stream_id = ? GROUP BY severity`,
      [id]
    );

    // Get analysis count
    const analysisResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM analysis_results WHERE stream_id = ?',
      [id]
    );

    // Get frame count
    const frameResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM frame_buffer WHERE stream_id = ?',
      [id]
    );

    res.json({
      stats: {
        alerts: Object.fromEntries(alerts.map((a) => [a.severity, a.count])),
        totalAlerts: alerts.reduce((sum, a) => sum + a.count, 0),
        analysisCount: analysisResult?.count || 0,
        frameCount: frameResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('Failed to get stream stats:', error);
    res.status(500).json({ error: 'Failed to get stream stats' });
  }
});

export default streamRoutes;
