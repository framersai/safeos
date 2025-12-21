/**
 * Streams API Routes
 *
 * Endpoints for managing monitoring streams.
 *
 * @module api/routes/streams
 */

import { Router, type Request, type Response } from 'express';
import { getDefaultStreamManager } from '../../lib/streams/manager.js';
import { getSafeOSDatabase } from '../../db/index.js';

const router = Router();
const streamManager = getDefaultStreamManager();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/streams
 * List all active streams
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const streams = streamManager.getActiveStreams();
    const summary = streamManager.getSummary();

    res.json({
      success: true,
      data: streams,
      meta: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/streams/:id
 * Get a specific stream
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stream = streamManager.getStream(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    const stats = streamManager.getStreamStats(id);

    res.json({
      success: true,
      data: {
        ...stream,
        stats,
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
 * POST /api/streams
 * Create a new stream
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { scenario, profileId, motionThreshold, audioThreshold } = req.body;

    if (!scenario || !['pet', 'baby', 'elderly'].includes(scenario)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scenario. Must be pet, baby, or elderly.',
      });
    }

    const stream = await streamManager.createStream({
      scenario,
      profileId,
      motionThreshold,
      audioThreshold,
    });

    res.status(201).json({
      success: true,
      data: stream,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/streams/:id/start
 * Start a stream
 */
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!streamManager.hasStream(id)) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    await streamManager.startStream(id);

    res.json({
      success: true,
      message: 'Stream started',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/streams/:id/pause
 * Pause a stream
 */
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!streamManager.hasStream(id)) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    await streamManager.pauseStream(id);

    res.json({
      success: true,
      message: 'Stream paused',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/streams/:id/resume
 * Resume a paused stream
 */
router.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!streamManager.hasStream(id)) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    await streamManager.resumeStream(id);

    res.json({
      success: true,
      message: 'Stream resumed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * DELETE /api/streams/:id
 * End/disconnect a stream
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await streamManager.endStream(id);

    res.json({
      success: true,
      message: 'Stream ended',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * PATCH /api/streams/:id/config
 * Update stream configuration
 */
router.patch('/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = req.body;

    if (!streamManager.hasStream(id)) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found',
      });
    }

    await streamManager.updateStreamConfig(id, config);

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
 * GET /api/streams/history
 * Get stream history from database
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', scenario } = req.query;

    const db = await getSafeOSDatabase();

    let query = 'SELECT * FROM streams WHERE status = ?';
    const params: (string | number)[] = ['disconnected'];

    if (scenario) {
      query += ' AND scenario = ?';
      params.push(scenario as string);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string, 10));
    params.push(parseInt(offset as string, 10));

    const streams = await db.all(query, params);

    res.json({
      success: true,
      data: streams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;
