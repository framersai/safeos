/**
 * Profile Routes
 *
 * API routes for monitoring profiles.
 *
 * @module api/routes/profiles
 */

import { Router, Request, Response } from 'express';
import { getSafeOSDatabase, generateId, now } from '../../db';

// =============================================================================
// Router
// =============================================================================

export const profileRoutes = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/profiles - List all profiles
 */
profileRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { scenario } = req.query;

    let query = 'SELECT * FROM monitoring_profiles';
    const params: any[] = [];

    if (scenario) {
      query += ' WHERE scenario = ?';
      params.push(scenario);
    }

    query += ' ORDER BY is_active DESC, created_at DESC';

    const profiles = await db.all(query, params);

    // Parse settings JSON
    const parsed = profiles.map((p: any) => ({
      ...p,
      settings: JSON.parse(p.settings || '{}'),
    }));

    res.json({ profiles: parsed });
  } catch (error) {
    console.error('Failed to list profiles:', error);
    res.status(500).json({ error: 'Failed to list profiles' });
  }
});

/**
 * GET /api/profiles/:id - Get profile by ID
 */
profileRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const profile = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      profile: {
        ...profile,
        settings: JSON.parse((profile as any).settings || '{}'),
      },
    });
  } catch (error) {
    console.error('Failed to get profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * POST /api/profiles - Create new profile
 */
profileRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { name, scenario, settings } = req.body;

    if (!name || !scenario) {
      return res.status(400).json({ error: 'Name and scenario are required' });
    }

    if (!['pet', 'baby', 'elderly'].includes(scenario)) {
      return res.status(400).json({ error: 'Invalid scenario' });
    }

    const id = generateId();
    const timestamp = now();

    await db.run(
      `INSERT INTO monitoring_profiles (id, name, scenario, settings, is_active, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [id, name, scenario, JSON.stringify(settings || {}), timestamp]
    );

    const profile = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);

    res.status(201).json({
      profile: {
        ...profile,
        settings: JSON.parse((profile as any).settings || '{}'),
      },
    });
  } catch (error) {
    console.error('Failed to create profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

/**
 * PATCH /api/profiles/:id - Update profile
 */
profileRoutes.patch('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;
    const { name, settings, isActive } = req.body;

    const profile = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (settings !== undefined) {
      updates.push('settings = ?');
      params.push(JSON.stringify(settings));
    }

    if (isActive !== undefined) {
      // If activating, deactivate other profiles of same scenario
      if (isActive) {
        await db.run(
          'UPDATE monitoring_profiles SET is_active = 0 WHERE scenario = ?',
          [(profile as any).scenario]
        );
      }
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.run(
        `UPDATE monitoring_profiles SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const updated = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);

    res.json({
      profile: {
        ...updated,
        settings: JSON.parse((updated as any).settings || '{}'),
      },
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * DELETE /api/profiles/:id - Delete profile
 */
profileRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const profile = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Don't delete default profiles
    if (id.startsWith('profile-') && id.endsWith('-default')) {
      return res.status(400).json({ error: 'Cannot delete default profiles' });
    }

    await db.run('DELETE FROM monitoring_profiles WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete profile:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

/**
 * POST /api/profiles/:id/activate - Activate profile
 */
profileRoutes.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const db = await getSafeOSDatabase();
    const { id } = req.params;

    const profile = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Deactivate other profiles of same scenario
    await db.run(
      'UPDATE monitoring_profiles SET is_active = 0 WHERE scenario = ?',
      [(profile as any).scenario]
    );

    // Activate this profile
    await db.run(
      'UPDATE monitoring_profiles SET is_active = 1 WHERE id = ?',
      [id]
    );

    const updated = await db.get('SELECT * FROM monitoring_profiles WHERE id = ?', [id]);

    res.json({
      profile: {
        ...updated,
        settings: JSON.parse((updated as any).settings || '{}'),
      },
    });
  } catch (error) {
    console.error('Failed to activate profile:', error);
    res.status(500).json({ error: 'Failed to activate profile' });
  }
});

export default profileRoutes;
