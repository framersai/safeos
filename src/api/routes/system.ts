/**
 * System Routes
 *
 * API routes for system status and configuration.
 *
 * @module api/routes/system
 */

import { Router, Request, Response } from 'express';
import { getSafeOSDatabase } from '../../db';
import { OllamaClient } from '../../lib/ollama/client';

// =============================================================================
// Router
// =============================================================================

export const systemRoutes = Router();
const ollamaClient = new OllamaClient();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/status - Get system status
 */
systemRoutes.get('/status', async (_req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();

    // Get stats
    const activeStreams = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM streams WHERE status = 'active'"
    );

    const pendingAlerts = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0'
    );

    const totalAlerts = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM alerts'
    );

    const queueSize = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM analysis_queue WHERE status = 'pending'"
    );

    // Check Ollama
    const ollamaAvailable = await ollamaClient.isHealthy();
    const ollamaModels = ollamaAvailable ? await ollamaClient.listModels() : [];

    // Get cloud fallback rate
    const cloudStats = await db.get<{ total: number; cloud: number }>(
      `SELECT COUNT(*) as total, SUM(is_cloud_fallback) as cloud FROM analysis_results
       WHERE created_at >= datetime('now', '-1 hour')`
    );

    const cloudFallbackRate =
      cloudStats && cloudStats.total > 0
        ? ((cloudStats.cloud || 0) / cloudStats.total) * 100
        : 0;

    res.json({
      healthy: true,
      timestamp: new Date().toISOString(),
      stats: {
        activeStreams: activeStreams?.count || 0,
        pendingAlerts: pendingAlerts?.count || 0,
        totalAlerts: totalAlerts?.count || 0,
        queueSize: queueSize?.count || 0,
        cloudFallbackRate,
      },
      ollama: {
        available: ollamaAvailable,
        models: ollamaModels.map((m: any) => ({
          name: m.name,
          size: formatBytes(m.size || 0),
        })),
      },
    });
  } catch (error) {
    console.error('Failed to get status:', error);
    res.status(500).json({
      healthy: false,
      error: 'Failed to get status',
    });
  }
});

/**
 * GET /api/config - Get system configuration
 */
systemRoutes.get('/config', async (_req: Request, res: Response) => {
  try {
    res.json({
      config: {
        bufferMinutes: 10,
        motionThreshold: 10,
        audioThreshold: 15,
        analysisInterval: 30,
        maxConcurrentAnalysis: 2,
        ollamaEndpoint: process.env['OLLAMA_HOST'] || 'http://localhost:11434',
        cloudFallbackEnabled: true,
      },
    });
  } catch (error) {
    console.error('Failed to get config:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

/**
 * PUT /api/config - Update system configuration
 */
systemRoutes.put('/config', async (req: Request, res: Response) => {
  try {
    const { motionThreshold, audioThreshold, analysisInterval } = req.body;

    // TODO: Persist configuration
    // For now, just acknowledge the update
    res.json({
      success: true,
      config: {
        motionThreshold: motionThreshold || 10,
        audioThreshold: audioThreshold || 15,
        analysisInterval: analysisInterval || 30,
      },
    });
  } catch (error) {
    console.error('Failed to update config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

/**
 * GET /api/queue - Get queue status
 */
systemRoutes.get('/queue', async (_req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();

    const pending = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM analysis_queue WHERE status = 'pending'"
    );

    const processing = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM analysis_queue WHERE status = 'processing'"
    );

    const completed = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM analysis_queue WHERE status = 'completed'"
    );

    const failed = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM analysis_queue WHERE status = 'failed'"
    );

    res.json({
      queue: {
        pending: pending?.count || 0,
        processing: processing?.count || 0,
        completed: completed?.count || 0,
        failed: failed?.count || 0,
      },
    });
  } catch (error) {
    console.error('Failed to get queue status:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// =============================================================================
// Helpers
// =============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default systemRoutes;
