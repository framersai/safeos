/**
 * Analysis Routes
 *
 * API routes for analysis results.
 *
 * @module api/routes/analysis
 */

import { Router, Request, Response } from 'express';
import { getSafeOSDatabase } from '../../db';

// =============================================================================
// Router
// =============================================================================

export const analysisRoutes = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/analysis - List analysis results
 */
analysisRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { streamId, concernLevel, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM analysis_results WHERE 1=1';
    const params: any[] = [];

    if (streamId) {
      query += ' AND stream_id = ?';
      params.push(streamId);
    }

    if (concernLevel) {
      query += ' AND concern_level = ?';
      params.push(concernLevel);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const results = await db.all(query, params);

    // Parse detected_issues JSON
    const parsed = results.map((r: any) => ({
      ...r,
      detectedIssues: r.detected_issues ? JSON.parse(r.detected_issues) : [],
    }));

    res.json({ results: parsed });
  } catch (error) {
    console.error('Failed to list analysis results:', error);
    res.status(500).json({ error: 'Failed to list analysis results' });
  }
});

/**
 * GET /api/analysis/:id - Get analysis by ID
 */
analysisRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const result = await db.get('SELECT * FROM analysis_results WHERE id = ?', [id]);

    if (!result) {
      return res.status(404).json({ error: 'Analysis result not found' });
    }

    res.json({
      result: {
        ...result,
        detectedIssues: (result as any).detected_issues
          ? JSON.parse((result as any).detected_issues)
          : [],
      },
    });
  } catch (error) {
    console.error('Failed to get analysis result:', error);
    res.status(500).json({ error: 'Failed to get analysis result' });
  }
});

/**
 * GET /api/analysis/stats - Get analysis statistics
 */
analysisRoutes.get('/stats/summary', async (req: Request, res: Response) => {
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

    // Get counts by concern level
    const byConcern = await db.all<{ concern_level: string; count: number }>(
      `SELECT concern_level, COUNT(*) as count FROM analysis_results
       WHERE ${whereClause} GROUP BY concern_level`,
      params
    );

    // Get average processing time
    const avgTime = await db.get<{ avg_time: number }>(
      `SELECT AVG(processing_time_ms) as avg_time FROM analysis_results
       WHERE ${whereClause}`,
      params
    );

    // Get cloud fallback rate
    const cloudFallback = await db.get<{ total: number; cloud: number }>(
      `SELECT COUNT(*) as total, SUM(is_cloud_fallback) as cloud FROM analysis_results
       WHERE ${whereClause}`,
      params
    );

    // Get total count
    const total = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM analysis_results WHERE ${whereClause}`,
      params
    );

    res.json({
      stats: {
        total: total?.count || 0,
        byConcernLevel: Object.fromEntries(byConcern.map((c) => [c.concern_level, c.count])),
        averageProcessingTime: Math.round(avgTime?.avg_time || 0),
        cloudFallbackRate:
          cloudFallback && cloudFallback.total > 0
            ? ((cloudFallback.cloud || 0) / cloudFallback.total) * 100
            : 0,
      },
    });
  } catch (error) {
    console.error('Failed to get analysis stats:', error);
    res.status(500).json({ error: 'Failed to get analysis stats' });
  }
});

export default analysisRoutes;
