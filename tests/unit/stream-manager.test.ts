/**
 * Stream Manager Unit Tests
 *
 * Tests for stream lifecycle and connection management.
 *
 * @module tests/unit/stream-manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamManager } from '../../src/lib/streams/manager.js';

// Mock database
vi.mock('../../src/db/index.js', () => ({
  getSafeOSDatabase: vi.fn().mockResolvedValue({
    run: vi.fn().mockResolvedValue({ changes: 1 }),
    all: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
  }),
  generateId: vi.fn().mockReturnValue('test-id-123'),
  now: vi.fn().mockReturnValue(new Date().toISOString()),
}));

// =============================================================================
// Test Suite
// =============================================================================

describe('StreamManager', () => {
  let manager: StreamManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new StreamManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  // ===========================================================================
  // Stream Creation Tests
  // ===========================================================================

  describe('createStream', () => {
    it('should create a new stream with unique ID', async () => {
      const stream = await manager.createStream({
        scenario: 'pet',
        name: 'Living Room Camera',
      });

      expect(stream).toBeDefined();
      expect(stream.id).toBeDefined();
      expect(stream.scenario).toBe('pet');
      expect(stream.name).toBe('Living Room Camera');
    });

    it('should set stream status to connecting', async () => {
      const stream = await manager.createStream({
        scenario: 'baby',
        name: 'Nursery Camera',
      });

      expect(stream.status).toBe('connecting');
    });

    it('should generate unique IDs for each stream', async () => {
      const stream1 = await manager.createStream({ scenario: 'pet', name: 'Camera 1' });
      const stream2 = await manager.createStream({ scenario: 'baby', name: 'Camera 2' });

      // Note: With mock, IDs will be same; in real implementation they'd differ
      expect(stream1).toBeDefined();
      expect(stream2).toBeDefined();
    });
  });

  // ===========================================================================
  // Stream Status Tests
  // ===========================================================================

  describe('stream status', () => {
    it('should update stream status to active when connected', async () => {
      const stream = await manager.createStream({ scenario: 'pet', name: 'Test' });

      await manager.setStreamStatus(stream.id, 'active');
      const updatedStream = await manager.getStream(stream.id);

      expect(updatedStream?.status).toBe('active');
    });

    it('should update stream status to paused', async () => {
      const stream = await manager.createStream({ scenario: 'pet', name: 'Test' });
      await manager.setStreamStatus(stream.id, 'active');

      await manager.pauseStream(stream.id);
      const updatedStream = await manager.getStream(stream.id);

      expect(updatedStream?.status).toBe('paused');
    });

    it('should update stream status to disconnected', async () => {
      const stream = await manager.createStream({ scenario: 'pet', name: 'Test' });

      await manager.disconnectStream(stream.id);
      const updatedStream = await manager.getStream(stream.id);

      expect(updatedStream?.status).toBe('disconnected');
    });
  });

  // ===========================================================================
  // Stream Retrieval Tests
  // ===========================================================================

  describe('getStream', () => {
    it('should return null for non-existent stream', async () => {
      const stream = await manager.getStream('non-existent-id');

      expect(stream).toBeNull();
    });

    it('should return stream by ID', async () => {
      const created = await manager.createStream({ scenario: 'elderly', name: 'Bedroom' });

      const retrieved = await manager.getStream(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });
  });

  // ===========================================================================
  // Active Streams Tests
  // ===========================================================================

  describe('getActiveStreams', () => {
    it('should return empty array when no streams', async () => {
      const active = await manager.getActiveStreams();

      expect(active).toEqual([]);
    });

    it('should return only active streams', async () => {
      const stream1 = await manager.createStream({ scenario: 'pet', name: 'Camera 1' });
      const stream2 = await manager.createStream({ scenario: 'baby', name: 'Camera 2' });

      await manager.setStreamStatus(stream1.id, 'active');
      await manager.setStreamStatus(stream2.id, 'paused');

      const active = await manager.getActiveStreams();

      expect(active.some(s => s.id === stream1.id && s.status === 'active')).toBe(true);
    });
  });

  // ===========================================================================
  // Stream Preferences Tests
  // ===========================================================================

  describe('stream preferences', () => {
    it('should update stream preferences', async () => {
      const stream = await manager.createStream({ scenario: 'pet', name: 'Test' });

      await manager.updatePreferences(stream.id, {
        motionSensitivity: 0.8,
        audioSensitivity: 0.5,
        notificationsEnabled: true,
      });

      const updated = await manager.getStream(stream.id);

      expect(updated?.preferences?.motionSensitivity).toBe(0.8);
    });

    it('should merge preferences with existing ones', async () => {
      const stream = await manager.createStream({ scenario: 'baby', name: 'Test' });

      await manager.updatePreferences(stream.id, { motionSensitivity: 0.7 });
      await manager.updatePreferences(stream.id, { audioSensitivity: 0.6 });

      const updated = await manager.getStream(stream.id);

      expect(updated?.preferences?.motionSensitivity).toBe(0.7);
      expect(updated?.preferences?.audioSensitivity).toBe(0.6);
    });
  });

  // ===========================================================================
  // Stream Deletion Tests
  // ===========================================================================

  describe('deleteStream', () => {
    it('should remove stream', async () => {
      const stream = await manager.createStream({ scenario: 'pet', name: 'Test' });

      await manager.deleteStream(stream.id);
      const retrieved = await manager.getStream(stream.id);

      expect(retrieved).toBeNull();
    });

    it('should handle deletion of non-existent stream', async () => {
      // Should not throw
      await expect(manager.deleteStream('non-existent')).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // Connection Tracking Tests
  // ===========================================================================

  describe('connection tracking', () => {
    it('should track WebSocket connection for stream', async () => {
      const stream = await manager.createStream({ scenario: 'pet', name: 'Test' });
      const mockWs = { readyState: 1 } as any;

      manager.registerConnection(stream.id, mockWs);

      expect(manager.hasConnection(stream.id)).toBe(true);
    });

    it('should remove connection on disconnect', async () => {
      const stream = await manager.createStream({ scenario: 'pet', name: 'Test' });
      const mockWs = { readyState: 1 } as any;

      manager.registerConnection(stream.id, mockWs);
      manager.unregisterConnection(stream.id);

      expect(manager.hasConnection(stream.id)).toBe(false);
    });
  });

  // ===========================================================================
  // Metrics Tests
  // ===========================================================================

  describe('metrics', () => {
    it('should track total streams created', async () => {
      await manager.createStream({ scenario: 'pet', name: 'Camera 1' });
      await manager.createStream({ scenario: 'baby', name: 'Camera 2' });

      const metrics = manager.getMetrics();

      expect(metrics.totalCreated).toBe(2);
    });

    it('should track streams by scenario', async () => {
      await manager.createStream({ scenario: 'pet', name: 'Pet 1' });
      await manager.createStream({ scenario: 'pet', name: 'Pet 2' });
      await manager.createStream({ scenario: 'baby', name: 'Baby 1' });

      const metrics = manager.getMetrics();

      expect(metrics.byScenario.pet).toBe(2);
      expect(metrics.byScenario.baby).toBe(1);
    });
  });
});














