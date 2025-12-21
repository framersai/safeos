/**
 * Profiles API Routes
 *
 * Endpoints for managing monitoring profiles.
 *
 * @module api/routes/profiles
 */

import { Router, type Request, type Response } from 'express';
import { getSafeOSDatabase, generateId, now } from '../../db/index.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/profiles
 * List all monitoring profiles
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const profiles = await db.all('SELECT * FROM monitoring_profiles ORDER BY created_at DESC');

    res.json({
      success: true,
      data: profiles.map((p) => ({
        ...p,
        settings: typeof p.settings === 'string' ? JSON.parse(p.settings) : p.settings,
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
 * GET /api/profiles/:id
 * Get a specific profile
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSafeOSDatabase();

    const profile = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...profile,
        settings: typeof profile.settings === 'string' ? JSON.parse(profile.settings) : profile.settings,
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
 * POST /api/profiles
 * Create a new profile
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, scenario, settings } = req.body;

    if (!name || !scenario) {
      return res.status(400).json({
        success: false,
        error: 'Name and scenario are required',
      });
    }

    if (!['pet', 'baby', 'elderly'].includes(scenario)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scenario. Must be pet, baby, or elderly.',
      });
    }

    const id = generateId();
    const db = await getSafeOSDatabase();

    const defaultSettings = {
      motionSensitivity: 50,
      audioSensitivity: 50,
      analysisInterval: 30,
      ...settings,
    };

    await db.run(
      `INSERT INTO monitoring_profiles (id, name, scenario, settings, is_active, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [id, name, scenario, JSON.stringify(defaultSettings), now()]
    );

    res.status(201).json({
      success: true,
      data: {
        id,
        name,
        scenario,
        settings: defaultSettings,
        is_active: 0,
        created_at: now(),
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
 * PUT /api/profiles/:id
 * Update a profile
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, settings } = req.body;
    const db = await getSafeOSDatabase();

    // Check exists
    const existing = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    // Merge settings
    const existingSettings = typeof existing.settings === 'string'
      ? JSON.parse(existing.settings)
      : existing.settings;
    const mergedSettings = { ...existingSettings, ...settings };

    await db.run(
      'UPDATE monitoring_profiles SET name = ?, settings = ? WHERE id = ?',
      [name || existing.name, JSON.stringify(mergedSettings), id]
    );

    res.json({
      success: true,
      data: {
        ...existing,
        name: name || existing.name,
        settings: mergedSettings,
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
 * POST /api/profiles/:id/activate
 * Set a profile as active
 */
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSafeOSDatabase();

    // Deactivate all profiles
    await db.run('UPDATE monitoring_profiles SET is_active = 0');

    // Activate the selected one
    await db.run('UPDATE monitoring_profiles SET is_active = 1 WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Profile activated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * DELETE /api/profiles/:id
 * Delete a profile
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getSafeOSDatabase();

    await db.run('DELETE FROM monitoring_profiles WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Profile deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;
