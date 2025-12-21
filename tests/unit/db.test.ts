/**
 * Database Tests
 *
 * Unit tests for SafeOS database operations.
 *
 * @module tests/unit/db.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDatabase, type Database } from '@framers/sql-storage-adapter';

describe('SafeOS Database', () => {
  let db: Database;

  beforeAll(async () => {
    // Use in-memory database for tests
    db = await createDatabase({
      type: 'memory',
      performance: { tier: 'fast' },
    });

    // Run migrations
    await db.exec(`
      CREATE TABLE IF NOT EXISTS streams (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        scenario TEXT NOT NULL CHECK (scenario IN ('pet', 'baby', 'elderly')),
        status TEXT NOT NULL DEFAULT 'active',
        started_at TEXT NOT NULL,
        ended_at TEXT,
        created_at TEXT NOT NULL
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        stream_id TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        acknowledged INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Streams', () => {
    it('should create a stream', async () => {
      const id = 'test-stream-1';
      const timestamp = new Date().toISOString();

      await db.run(
        `INSERT INTO streams (id, scenario, status, started_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, 'baby', 'active', timestamp, timestamp]
      );

      const stream = await db.get<any>('SELECT * FROM streams WHERE id = ?', [id]);

      expect(stream).toBeDefined();
      expect(stream.id).toBe(id);
      expect(stream.scenario).toBe('baby');
      expect(stream.status).toBe('active');
    });

    it('should update stream status', async () => {
      const id = 'test-stream-2';
      const timestamp = new Date().toISOString();

      await db.run(
        `INSERT INTO streams (id, scenario, status, started_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, 'pet', 'active', timestamp, timestamp]
      );

      await db.run(
        `UPDATE streams SET status = ? WHERE id = ?`,
        ['ended', id]
      );

      const stream = await db.get<any>('SELECT * FROM streams WHERE id = ?', [id]);
      expect(stream.status).toBe('ended');
    });

    it('should list active streams', async () => {
      const streams = await db.all<any>(
        "SELECT * FROM streams WHERE status = 'active'"
      );

      expect(Array.isArray(streams)).toBe(true);
    });
  });

  describe('Alerts', () => {
    it('should create an alert', async () => {
      const id = 'test-alert-1';
      const streamId = 'test-stream-1';
      const timestamp = new Date().toISOString();

      await db.run(
        `INSERT INTO alerts (id, stream_id, alert_type, severity, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, streamId, 'analysis', 'medium', 'Test alert message', timestamp]
      );

      const alert = await db.get<any>('SELECT * FROM alerts WHERE id = ?', [id]);

      expect(alert).toBeDefined();
      expect(alert.id).toBe(id);
      expect(alert.severity).toBe('medium');
      expect(alert.acknowledged).toBe(0);
    });

    it('should acknowledge an alert', async () => {
      const id = 'test-alert-2';
      const streamId = 'test-stream-1';
      const timestamp = new Date().toISOString();

      await db.run(
        `INSERT INTO alerts (id, stream_id, alert_type, severity, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, streamId, 'analysis', 'high', 'Another test alert', timestamp]
      );

      await db.run(
        `UPDATE alerts SET acknowledged = 1 WHERE id = ?`,
        [id]
      );

      const alert = await db.get<any>('SELECT * FROM alerts WHERE id = ?', [id]);
      expect(alert.acknowledged).toBe(1);
    });

    it('should count unacknowledged alerts', async () => {
      const result = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0'
      );

      expect(result).toBeDefined();
      expect(typeof result?.count).toBe('number');
    });
  });
});








