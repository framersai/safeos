/**
 * Alerts API Routes
 *
 * Endpoints for managing alerts.
 *
 * @module api/routes/alerts
 */

import { Router, type Request, type Response } from 'express';
import { getSafeOSDatabase, now } from '../../db/index.js';
import { getDefaultNotificationManager } from '../../lib/alerts/notification-manager.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/alerts
 * List alerts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      limit = '50',
      offset = '0',
      severity,
      acknowledged,
      streamId,
    } = req.query;

    const db = await getSafeOSDatabase();

    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params: (string | number)[] = [];

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity as string);
    }

    if (acknowledged !== undefined) {
      query += ' AND acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }

    if (streamId) {
      query += ' AND stream_id = ?';
      params.push(streamId as string);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string, 10));
    params.push(parseInt(offset as string, 10));

    const alerts = await db.all(query, params);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/alerts/:id
 * Get a specific alert
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSafeOSDatabase();

    const alert = await db.get('SELECT * FROM alerts WHERE id = ?', [id]);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    // Get escalation status
    const notificationManager = getDefaultNotificationManager();
    const escalation = notificationManager.getAlertEscalation(id);

    res.json({
      success: true,
      data: {
        ...alert,
        escalation,
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
 * POST /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSafeOSDatabase();

    // Update database
    await db.run(
      'UPDATE alerts SET acknowledged = 1, acknowledged_at = ? WHERE id = ?',
      [now(), id]
    );

    // Stop escalation
    const notificationManager = getDefaultNotificationManager();
    notificationManager.acknowledgeAlert(id);

    res.json({
      success: true,
      message: 'Alert acknowledged',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/alerts/acknowledge-all
 * Acknowledge all unacknowledged alerts
 */
router.post('/acknowledge-all', async (_req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const timestamp = now();

    const result = await db.run(
      'UPDATE alerts SET acknowledged = 1, acknowledged_at = ? WHERE acknowledged = 0',
      [timestamp]
    );

    res.json({
      success: true,
      message: `Acknowledged ${result.changes} alerts`,
      count: result.changes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/alerts/stats/summary
 * Get alert statistics
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { period = '24h' } = req.query;
    const db = await getSafeOSDatabase();

    // Calculate time threshold
    const periodMs: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const threshold = new Date(
      Date.now() - (periodMs[period as string] || periodMs['24h'])
    ).toISOString();

    // Total alerts
    const totalRow = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM alerts WHERE created_at >= ?',
      [threshold]
    );

    // Unacknowledged
    const unackRow = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM alerts WHERE created_at >= ? AND acknowledged = 0',
      [threshold]
    );

    // By severity
    const bySeverity = await db.all<{ severity: string; count: number }[]>(
      `SELECT severity, COUNT(*) as count FROM alerts
       WHERE created_at >= ?
       GROUP BY severity`,
      [threshold]
    );

    // By type
    const byType = await db.all<{ alert_type: string; count: number }[]>(
      `SELECT alert_type, COUNT(*) as count FROM alerts
       WHERE created_at >= ?
       GROUP BY alert_type`,
      [threshold]
    );

    // Average response time
    const avgResponseRow = await db.get<{ avg: number }>(
      `SELECT AVG(
        CAST((julianday(acknowledged_at) - julianday(created_at)) * 86400000 AS INTEGER)
      ) as avg
      FROM alerts
      WHERE created_at >= ? AND acknowledged = 1 AND acknowledged_at IS NOT NULL`,
      [threshold]
    );

    res.json({
      success: true,
      data: {
        totalAlerts: totalRow?.count || 0,
        unacknowledgedAlerts: unackRow?.count || 0,
        bySeverity: Object.fromEntries(bySeverity.map((r) => [r.severity, r.count])),
        byType: Object.fromEntries(byType.map((r) => [r.alert_type, r.count])),
        avgResponseTimeMs: avgResponseRow?.avg || 0,
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
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSafeOSDatabase();

    await db.run('DELETE FROM alerts WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Alert deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;
