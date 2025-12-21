/**
 * Analysis API Routes
 *
 * Endpoints for analysis results.
 *
 * @module api/routes/analysis
 */

import { Router, type Request, type Response } from 'express';
import { getSafeOSDatabase } from '../../db/index.js';
import { getDefaultAnalysisQueue } from '../../queues/analysis-queue.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/analysis
 * List analysis results
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      limit = '50',
      offset = '0',
      streamId,
      concernLevel,
    } = req.query;

    const db = await getSafeOSDatabase();

    let query = 'SELECT * FROM analysis_results WHERE 1=1';
    const params: (string | number)[] = [];

    if (streamId) {
      query += ' AND stream_id = ?';
      params.push(streamId as string);
    }

    if (concernLevel) {
      query += ' AND concern_level = ?';
      params.push(concernLevel as string);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string, 10));
    params.push(parseInt(offset as string, 10));

    const results = await db.all(query, params);

    res.json({
      success: true,
      data: results.map((r) => ({
        ...r,
        detected_issues:
          typeof r.detected_issues === 'string'
            ? JSON.parse(r.detected_issues)
            : r.detected_issues,
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
 * GET /api/analysis/:id
 * Get a specific analysis result
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSafeOSDatabase();

    const result = await db.get('SELECT * FROM analysis_results WHERE id = ?', [id]);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Analysis result not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...result,
        detected_issues:
          typeof result.detected_issues === 'string'
            ? JSON.parse(result.detected_issues)
            : result.detected_issues,
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
 * GET /api/analysis/queue/status
 * Get analysis queue status
 */
router.get('/queue/status', async (_req: Request, res: Response) => {
  try {
    const queue = getDefaultAnalysisQueue();
    const status = queue.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/analysis/queue/start
 * Start the analysis queue
 */
router.post('/queue/start', async (_req: Request, res: Response) => {
  try {
    const queue = getDefaultAnalysisQueue();
    queue.start();

    res.json({
      success: true,
      message: 'Analysis queue started',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/analysis/queue/stop
 * Stop the analysis queue
 */
router.post('/queue/stop', async (_req: Request, res: Response) => {
  try {
    const queue = getDefaultAnalysisQueue();
    queue.stop();

    res.json({
      success: true,
      message: 'Analysis queue stopped',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/analysis/stats
 * Get analysis statistics
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { period = '24h' } = req.query;
    const db = await getSafeOSDatabase();

    const periodMs: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };
    const threshold = new Date(
      Date.now() - (periodMs[period as string] || periodMs['24h'])
    ).toISOString();

    const totalRow = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM analysis_results WHERE created_at >= ?',
      [threshold]
    );

    const byConcern = await db.all<{ concern_level: string; count: number }[]>(
      `SELECT concern_level, COUNT(*) as count FROM analysis_results
       WHERE created_at >= ?
       GROUP BY concern_level`,
      [threshold]
    );

    const avgTime = await db.get<{ avg: number }>(
      'SELECT AVG(processing_time_ms) as avg FROM analysis_results WHERE created_at >= ?',
      [threshold]
    );

    const cloudFallbackCount = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM analysis_results WHERE created_at >= ? AND is_cloud_fallback = 1',
      [threshold]
    );

    res.json({
      success: true,
      data: {
        totalAnalyses: totalRow?.count || 0,
        byConcernLevel: Object.fromEntries(
          byConcern.map((r) => [r.concern_level, r.count])
        ),
        avgProcessingTimeMs: avgTime?.avg || 0,
        cloudFallbackCount: cloudFallbackCount?.count || 0,
        cloudFallbackRate:
          totalRow?.count && cloudFallbackCount?.count
            ? cloudFallbackCount.count / totalRow.count
            : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;
