/**
 * Alert Routes
 *
 * API routes for alert management.
 *
 * @module api/routes/alerts
 */

import { Router, Request, Response } from 'express';
import { getSafeOSDatabase, now } from '../../db';
import { requireAuth } from '../middleware/auth.js';

// =============================================================================
// Router
// =============================================================================

export const alertRoutes = Router();

// Apply auth middleware to all alert routes
alertRoutes.use(requireAuth);

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/alerts - List alerts
 */
alertRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { streamId, acknowledged, severity, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params: any[] = [];

    if (streamId) {
      query += ' AND stream_id = ?';
      params.push(streamId);
    }

    if (acknowledged !== undefined) {
      query += ' AND acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const alerts = await db.all(query, params);

    // Get total count
    const countResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM alerts WHERE 1=1' +
        (streamId ? ' AND stream_id = ?' : '') +
        (acknowledged !== undefined ? ' AND acknowledged = ?' : '') +
        (severity ? ' AND severity = ?' : ''),
      params.slice(0, -2)
    );

    res.json({
      alerts,
      total: countResult?.count || 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Failed to list alerts:', error);
    res.status(500).json({ error: 'Failed to list alerts' });
  }
});

/**
 * GET /api/alerts/:id - Get alert by ID
 */
alertRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const alert = await db.get('SELECT * FROM alerts WHERE id = ?', [id]);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ alert });
  } catch (error) {
    console.error('Failed to get alert:', error);
    res.status(500).json({ error: 'Failed to get alert' });
  }
});

/**
 * POST /api/alerts/:id/acknowledge - Acknowledge alert
 */
alertRoutes.post('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const alert = await db.get('SELECT * FROM alerts WHERE id = ?', [id]);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await db.run(
      'UPDATE alerts SET acknowledged = 1, acknowledged_at = ? WHERE id = ?',
      [now(), id]
    );

    const updated = await db.get('SELECT * FROM alerts WHERE id = ?', [id]);
    res.json({ alert: updated });
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

/**
 * POST /api/alerts/:id/acknowledge/all - Acknowledge all alerts for a stream
 */
alertRoutes.post('/acknowledge/all', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { streamId } = req.body;

    let query = 'UPDATE alerts SET acknowledged = 1, acknowledged_at = ? WHERE acknowledged = 0';
    const params: any[] = [now()];

    if (streamId) {
      query += ' AND stream_id = ?';
      params.push(streamId);
    }

    const result = await db.run(query, params);

    res.json({
      success: true,
      acknowledgedCount: result.changes || 0,
    });
  } catch (error) {
    console.error('Failed to acknowledge alerts:', error);
    res.status(500).json({ error: 'Failed to acknowledge alerts' });
  }
});

/**
 * GET /api/alerts/summary - Get alert summary
 */
alertRoutes.get('/summary/stats', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { streamId, since } = req.query;

    let whereClause = '1=1';
    const params: any[] = [];

    if (streamId) {
      whereClause += ' AND stream_id = ?';
      params.push(streamId);
    }

    if (since) {
      whereClause += ' AND created_at >= ?';
      params.push(since);
    }

    // Get counts by severity
    const bySeverity = await db.all<{ severity: string; count: number }>(
      `SELECT severity, COUNT(*) as count FROM alerts
       WHERE ${whereClause} GROUP BY severity`,
      params
    );

    // Get counts by type
    const byType = await db.all<{ alert_type: string; count: number }>(
      `SELECT alert_type, COUNT(*) as count FROM alerts
       WHERE ${whereClause} GROUP BY alert_type`,
      params
    );

    // Get unacknowledged count
    const unacknowledged = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM alerts
       WHERE ${whereClause} AND acknowledged = 0`,
      params
    );

    // Get total
    const total = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM alerts WHERE ${whereClause}`,
      params
    );

    res.json({
      summary: {
        total: total?.count || 0,
        unacknowledged: unacknowledged?.count || 0,
        bySeverity: Object.fromEntries(bySeverity.map((s) => [s.severity, s.count])),
        byType: Object.fromEntries(byType.map((t) => [t.alert_type, t.count])),
      },
    });
  } catch (error) {
    console.error('Failed to get alert summary:', error);
    res.status(500).json({ error: 'Failed to get alert summary' });
  }
});

export default alertRoutes;
