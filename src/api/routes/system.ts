/**
 * System API Routes
 *
 * Endpoints for system status and configuration.
 *
 * @module api/routes/system
 */

import { Router, type Request, type Response } from 'express';
import { getSafeOSDatabase } from '../../db/index.js';
import { getDefaultOllamaClient } from '../../lib/ollama/client.js';
import { getDefaultStreamManager } from '../../lib/streams/manager.js';
import { getDefaultAnalysisQueue } from '../../queues/analysis-queue.js';
import { getDefaultNotificationManager } from '../../lib/alerts/notification-manager.js';
import { getDefaultCloudFallback } from '../../lib/analysis/cloud-fallback.js';
import { getDefaultContentFilter } from '../../lib/safety/content-filter.js';
import { getDefaultAudioAnalyzer } from '../../lib/audio/analyzer.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/system/status
 * Get comprehensive system status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const ollama = getDefaultOllamaClient();
    const streamManager = getDefaultStreamManager();
    const analysisQueue = getDefaultAnalysisQueue();
    const notificationManager = getDefaultNotificationManager();
    const cloudFallback = getDefaultCloudFallback();
    const contentFilter = getDefaultContentFilter();
    const audioAnalyzer = getDefaultAudioAnalyzer();

    // Check database
    let dbHealthy = false;
    try {
      const db = await getSafeOSDatabase();
      await db.get('SELECT 1');
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    // Check Ollama
    let ollamaStatus = null;
    try {
      const isHealthy = await ollama.isHealthy();
      const models = isHealthy ? await ollama.listModels() : [];
      ollamaStatus = {
        healthy: isHealthy,
        models: models.map((m) => ({ name: m.name, size: m.size })),
      };
    } catch {
      ollamaStatus = { healthy: false, models: [] };
    }

    // Get all statuses
    const status = {
      timestamp: new Date().toISOString(),
      database: dbHealthy,
      ollama: ollamaStatus,
      streams: streamManager.getSummary(),
      queue: analysisQueue.getStatus(),
      notifications: notificationManager.getChannelStatus(),
      cloudFallback: cloudFallback.getStats(),
      contentFilter: contentFilter.getStats(),
      audioAnalyzer: audioAnalyzer.getStats(),
      webrtc: {
        peers: 0, // Would be populated by signaling server
        rooms: 0,
      },
    };

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
 * GET /api/system/health
 * Simple health check
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const ollama = getDefaultOllamaClient();
    const isHealthy = await ollama.isHealthy();

    res.json({
      success: true,
      data: {
        status: 'ok',
        ollama: isHealthy,
        timestamp: new Date().toISOString(),
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
 * GET /api/system/config
 * Get system configuration
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const analysisQueue = getDefaultAnalysisQueue();
    const contentFilter = getDefaultContentFilter();

    res.json({
      success: true,
      data: {
        analysisQueue: analysisQueue.getConfig(),
        contentFilter: contentFilter.getConfig(),
        version: '1.0.0',
        environment: process.env['NODE_ENV'] || 'development',
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
 * PUT /api/system/config
 * Update system configuration
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const { analysisQueue: aqConfig, contentFilter: cfConfig } = req.body;
    const analysisQueue = getDefaultAnalysisQueue();
    const contentFilter = getDefaultContentFilter();

    if (aqConfig) {
      analysisQueue.updateConfig(aqConfig);
    }

    if (cfConfig) {
      contentFilter.updateConfig(cfConfig);
    }

    res.json({
      success: true,
      message: 'Configuration updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/system/stats
 * Get detailed statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const streamManager = getDefaultStreamManager();
    const analysisQueue = getDefaultAnalysisQueue();

    // Get counts from database
    const streamsTotal = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM streams'
    );
    const alertsTotal = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM alerts'
    );
    const analysisTotal = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM analysis_results'
    );
    const flagsTotal = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM content_flags'
    );

    // Get recent activity
    const recentAlerts = await db.all(
      `SELECT severity, COUNT(*) as count FROM alerts
       WHERE created_at >= datetime('now', '-1 hour')
       GROUP BY severity`
    );

    res.json({
      success: true,
      data: {
        totals: {
          streams: streamsTotal?.count || 0,
          alerts: alertsTotal?.count || 0,
          analysisResults: analysisTotal?.count || 0,
          contentFlags: flagsTotal?.count || 0,
        },
        active: {
          streams: streamManager.getStreamCount(),
          queuePending: analysisQueue.getStatus().pending,
          queueProcessing: analysisQueue.getStatus().processing,
        },
        recentHour: {
          alertsBySeverity: Object.fromEntries(
            recentAlerts.map((r: { severity: string; count: number }) => [r.severity, r.count])
          ),
        },
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
 * POST /api/system/ollama/ensure-models
 * Ensure required Ollama models are downloaded
 */
router.post('/ollama/ensure-models', async (_req: Request, res: Response) => {
  try {
    const ollama = getDefaultOllamaClient();

    const result = await ollama.ensureModels();

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
 * GET /api/system/ollama/models
 * List available Ollama models
 */
router.get('/ollama/models', async (_req: Request, res: Response) => {
  try {
    const ollama = getDefaultOllamaClient();

    if (!(await ollama.isHealthy())) {
      return res.status(503).json({
        success: false,
        error: 'Ollama is not available',
      });
    }

    const models = await ollama.listModels();

    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;
