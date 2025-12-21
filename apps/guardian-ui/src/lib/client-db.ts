/**
 * Client-Side Database
 *
 * Uses @framers/sql-storage-adapter with IndexedDB for browser-native
 * offline-first data persistence.
 *
 * @module lib/client-db
 */

import { createDatabase, type Database, type StorageHooks } from '@framers/sql-storage-adapter';

// =============================================================================
// Configuration
// =============================================================================

const DB_NAME = 'safeos-guardian';
const DB_VERSION = 1;

// Cache settings
const FRAME_BUFFER_MINUTES = 5; // Keep 5 minutes of frames locally
const MAX_CACHED_ANALYSES = 1000;
const MAX_CACHED_ALERTS = 500;

// =============================================================================
// Database Instance
// =============================================================================

let clientDb: Database | null = null;
let initPromise: Promise<Database> | null = null;

// =============================================================================
// Lifecycle Hooks
// =============================================================================

const hooks: StorageHooks = {
  onAfterWrite: async (context) => {
    // Auto-cleanup old frames after writes
    if (context.statement?.includes('frame_cache')) {
      await cleanupOldFrames();
    }
  },

  onAfterQuery: async (context, result) => {
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - (context.startTime || Date.now());
      if (duration > 50) {
        console.warn(`[ClientDB] Slow query (${duration}ms):`, context.statement?.slice(0, 100));
      }
    }
    return result;
  },
};

// =============================================================================
// Initialization
// =============================================================================

/**
 * Get or create the client-side database
 */
export async function getClientDatabase(): Promise<Database> {
  if (clientDb) {
    return clientDb;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await createDatabase({
        priority: ['indexeddb', 'sqljs'],
        indexedDb: {
          dbName: DB_NAME,
          storeName: 'safeos_data',
          autoSave: true,
          saveIntervalMs: 3000, // Batch writes every 3 seconds
        },
        performance: {
          tier: 'efficient', // Battery-friendly for mobile
          batchWrites: true,
        },
        hooks,
      });

      await runClientMigrations(db);
      clientDb = db;
      return db;
    } catch (error) {
      console.error('[ClientDB] Failed to initialize:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

// =============================================================================
// Migrations
// =============================================================================

async function runClientMigrations(db: Database): Promise<void> {
  // Create tables for local-first storage

  // Session storage (for offline support)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS local_session (
      id TEXT PRIMARY KEY,
      token TEXT,
      device_id TEXT,
      profile_json TEXT,
      created_at TEXT,
      expires_at TEXT,
      synced_at TEXT
    )
  `);

  // User profile cache
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profile_cache (
      id TEXT PRIMARY KEY,
      display_name TEXT,
      avatar_url TEXT,
      preferences_json TEXT,
      notification_settings_json TEXT,
      updated_at TEXT
    )
  `);

  // Stream cache
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stream_cache (
      id TEXT PRIMARY KEY,
      name TEXT,
      scenario TEXT,
      status TEXT,
      preferences_json TEXT,
      created_at TEXT,
      updated_at TEXT,
      synced_at TEXT
    )
  `);

  // Local frame buffer (for offline analysis)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS frame_cache (
      id TEXT PRIMARY KEY,
      stream_id TEXT NOT NULL,
      frame_data TEXT,
      motion_score REAL,
      audio_level REAL,
      analyzed INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (stream_id) REFERENCES stream_cache(id)
    )
  `);

  // Alert cache
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alert_cache (
      id TEXT PRIMARY KEY,
      stream_id TEXT,
      severity TEXT,
      message TEXT,
      description TEXT,
      acknowledged INTEGER DEFAULT 0,
      acknowledged_at TEXT,
      created_at TEXT,
      synced_at TEXT
    )
  `);

  // Analysis cache
  await db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_cache (
      id TEXT PRIMARY KEY,
      stream_id TEXT,
      concern_level TEXT,
      description TEXT,
      recommendations_json TEXT,
      source TEXT,
      created_at TEXT
    )
  `);

  // Offline action queue (for sync when back online)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      body_json TEXT,
      created_at TEXT,
      retries INTEGER DEFAULT 0,
      last_error TEXT
    )
  `);

  // Settings cache
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings_cache (
      key TEXT PRIMARY KEY,
      value_json TEXT,
      updated_at TEXT
    )
  `);

  // Disclaimers and consent tracking
  await db.exec(`
    CREATE TABLE IF NOT EXISTS consent_log (
      id TEXT PRIMARY KEY,
      consent_type TEXT NOT NULL,
      accepted INTEGER NOT NULL,
      version TEXT,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TEXT
    )
  `);

  // Create indexes
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_frame_cache_stream ON frame_cache(stream_id);
    CREATE INDEX IF NOT EXISTS idx_frame_cache_created ON frame_cache(created_at);
    CREATE INDEX IF NOT EXISTS idx_alert_cache_stream ON alert_cache(stream_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
  `);
}

// =============================================================================
// Cleanup Functions
// =============================================================================

async function cleanupOldFrames(): Promise<void> {
  if (!clientDb) return;

  const cutoff = new Date(Date.now() - FRAME_BUFFER_MINUTES * 60 * 1000).toISOString();

  await clientDb.run(
    `DELETE FROM frame_cache WHERE created_at < ?`,
    [cutoff]
  );
}

export async function cleanupCaches(): Promise<void> {
  if (!clientDb) return;

  // Cleanup old frames
  await cleanupOldFrames();

  // Limit analyses
  await clientDb.run(`
    DELETE FROM analysis_cache 
    WHERE id NOT IN (
      SELECT id FROM analysis_cache 
      ORDER BY created_at DESC 
      LIMIT ?
    )
  `, [MAX_CACHED_ANALYSES]);

  // Limit alerts
  await clientDb.run(`
    DELETE FROM alert_cache 
    WHERE id NOT IN (
      SELECT id FROM alert_cache 
      ORDER BY created_at DESC 
      LIMIT ?
    )
  `, [MAX_CACHED_ALERTS]);
}

// =============================================================================
// Session Management
// =============================================================================

export interface LocalSession {
  id: string;
  token: string;
  deviceId: string | null;
  profile: any;
  createdAt: string;
  expiresAt: string;
  syncedAt: string | null;
}

export async function saveLocalSession(session: LocalSession): Promise<void> {
  const db = await getClientDatabase();

  await db.run(
    `INSERT OR REPLACE INTO local_session (
      id, token, device_id, profile_json, created_at, expires_at, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.token,
      session.deviceId,
      JSON.stringify(session.profile),
      session.createdAt,
      session.expiresAt,
      session.syncedAt,
    ]
  );
}

export async function getLocalSession(): Promise<LocalSession | null> {
  const db = await getClientDatabase();

  const row = await db.get<any>(
    `SELECT * FROM local_session WHERE expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`
  );

  if (!row) return null;

  return {
    id: row.id,
    token: row.token,
    deviceId: row.device_id,
    profile: JSON.parse(row.profile_json || '{}'),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    syncedAt: row.synced_at,
  };
}

export async function clearLocalSession(): Promise<void> {
  const db = await getClientDatabase();
  await db.run(`DELETE FROM local_session`);
}

// =============================================================================
// Profile Cache
// =============================================================================

export async function cacheProfile(profile: any): Promise<void> {
  const db = await getClientDatabase();

  await db.run(
    `INSERT OR REPLACE INTO profile_cache (
      id, display_name, avatar_url, preferences_json, notification_settings_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      profile.id,
      profile.displayName,
      profile.avatarUrl,
      JSON.stringify(profile.preferences || {}),
      JSON.stringify(profile.notificationSettings || {}),
      new Date().toISOString(),
    ]
  );
}

export async function getCachedProfile(id: string): Promise<any | null> {
  const db = await getClientDatabase();

  const row = await db.get<any>(
    `SELECT * FROM profile_cache WHERE id = ?`,
    [id]
  );

  if (!row) return null;

  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    preferences: JSON.parse(row.preferences_json || '{}'),
    notificationSettings: JSON.parse(row.notification_settings_json || '{}'),
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// Stream Cache
// =============================================================================

export async function cacheStream(stream: any): Promise<void> {
  const db = await getClientDatabase();

  await db.run(
    `INSERT OR REPLACE INTO stream_cache (
      id, name, scenario, status, preferences_json, created_at, updated_at, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      stream.id,
      stream.name,
      stream.scenario,
      stream.status,
      JSON.stringify(stream.preferences || {}),
      stream.createdAt,
      stream.updatedAt || new Date().toISOString(),
      new Date().toISOString(),
    ]
  );
}

export async function getCachedStreams(): Promise<any[]> {
  const db = await getClientDatabase();

  const rows = await db.all<any>(
    `SELECT * FROM stream_cache ORDER BY created_at DESC`
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    scenario: row.scenario,
    status: row.status,
    preferences: JSON.parse(row.preferences_json || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// =============================================================================
// Alert Cache
// =============================================================================

export async function cacheAlert(alert: any): Promise<void> {
  const db = await getClientDatabase();

  await db.run(
    `INSERT OR REPLACE INTO alert_cache (
      id, stream_id, severity, message, description, acknowledged, acknowledged_at, created_at, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      alert.id,
      alert.streamId,
      alert.severity,
      alert.message,
      alert.description,
      alert.acknowledged ? 1 : 0,
      alert.acknowledgedAt,
      alert.createdAt,
      new Date().toISOString(),
    ]
  );
}

export async function getCachedAlerts(streamId?: string): Promise<any[]> {
  const db = await getClientDatabase();

  let query = `SELECT * FROM alert_cache`;
  const params: any[] = [];

  if (streamId) {
    query += ` WHERE stream_id = ?`;
    params.push(streamId);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const rows = await db.all<any>(query, params);

  return rows.map(row => ({
    id: row.id,
    streamId: row.stream_id,
    severity: row.severity,
    message: row.message,
    description: row.description,
    acknowledged: row.acknowledged === 1,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  }));
}

// =============================================================================
// Offline Sync Queue
// =============================================================================

export interface SyncAction {
  id: string;
  action: string;
  endpoint: string;
  method: string;
  body: any;
  createdAt: string;
  retries: number;
  lastError: string | null;
}

export async function queueSyncAction(action: Omit<SyncAction, 'id' | 'createdAt' | 'retries' | 'lastError'>): Promise<void> {
  const db = await getClientDatabase();

  const id = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  await db.run(
    `INSERT INTO sync_queue (id, action, endpoint, method, body_json, created_at, retries, last_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      action.action,
      action.endpoint,
      action.method,
      JSON.stringify(action.body),
      new Date().toISOString(),
      0,
      null,
    ]
  );
}

export async function getPendingSyncActions(): Promise<SyncAction[]> {
  const db = await getClientDatabase();

  const rows = await db.all<any>(
    `SELECT * FROM sync_queue ORDER BY created_at ASC`
  );

  return rows.map(row => ({
    id: row.id,
    action: row.action,
    endpoint: row.endpoint,
    method: row.method,
    body: JSON.parse(row.body_json || '{}'),
    createdAt: row.created_at,
    retries: row.retries,
    lastError: row.last_error,
  }));
}

export async function removeSyncAction(id: string): Promise<void> {
  const db = await getClientDatabase();
  await db.run(`DELETE FROM sync_queue WHERE id = ?`, [id]);
}

export async function markSyncActionFailed(id: string, error: string): Promise<void> {
  const db = await getClientDatabase();
  await db.run(
    `UPDATE sync_queue SET retries = retries + 1, last_error = ? WHERE id = ?`,
    [error, id]
  );
}

// =============================================================================
// Settings
// =============================================================================

export async function saveSetting(key: string, value: any): Promise<void> {
  const db = await getClientDatabase();

  await db.run(
    `INSERT OR REPLACE INTO settings_cache (key, value_json, updated_at)
     VALUES (?, ?, ?)`,
    [key, JSON.stringify(value), new Date().toISOString()]
  );
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getClientDatabase();

  const row = await db.get<any>(
    `SELECT value_json FROM settings_cache WHERE key = ?`,
    [key]
  );

  if (!row) return null;

  return JSON.parse(row.value_json) as T;
}

// =============================================================================
// Consent Tracking
// =============================================================================

export async function logConsent(type: string, accepted: boolean, version: string): Promise<void> {
  const db = await getClientDatabase();

  const id = `consent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  await db.run(
    `INSERT INTO consent_log (id, consent_type, accepted, version, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      type,
      accepted ? 1 : 0,
      version,
      typeof navigator !== 'undefined' ? navigator.userAgent : null,
      new Date().toISOString(),
    ]
  );
}

export async function hasAcceptedConsent(type: string): Promise<boolean> {
  const db = await getClientDatabase();

  const row = await db.get<any>(
    `SELECT accepted FROM consent_log 
     WHERE consent_type = ? 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [type]
  );

  return row?.accepted === 1;
}

// =============================================================================
// Export/Import
// =============================================================================

export async function exportData(): Promise<Uint8Array> {
  const db = await getClientDatabase();
  return db.export();
}

export async function getStorageStats(): Promise<{
  frames: number;
  alerts: number;
  analyses: number;
  syncPending: number;
}> {
  const db = await getClientDatabase();

  const [frames, alerts, analyses, sync] = await Promise.all([
    db.get<{ count: number }>(`SELECT COUNT(*) as count FROM frame_cache`),
    db.get<{ count: number }>(`SELECT COUNT(*) as count FROM alert_cache`),
    db.get<{ count: number }>(`SELECT COUNT(*) as count FROM analysis_cache`),
    db.get<{ count: number }>(`SELECT COUNT(*) as count FROM sync_queue`),
  ]);

  return {
    frames: frames?.count || 0,
    alerts: alerts?.count || 0,
    analyses: analyses?.count || 0,
    syncPending: sync?.count || 0,
  };
}

