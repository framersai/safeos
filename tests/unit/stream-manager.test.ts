/**
 * Stream Manager Unit Tests
 *
 * Tests for stream lifecycle and connection management.
 *
 * @module tests/unit/stream-manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamManager, createStreamManager } from '../../src/lib/streams/manager.js';

// Mock database with unique ID generation
let idCounter = 0;
vi.mock('../../src/db/index.js', () => ({
  getSafeOSDatabase: vi.fn().mockResolvedValue({
    run: vi.fn().mockResolvedValue({ changes: 1 }),
    all: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
  }),
  generateId: vi.fn().mockImplementation(() => `test-id-${++idCounter}`),
  now: vi.fn().mockReturnValue(new Date().toISOString()),
}));

// =============================================================================
// Test Suite
// =============================================================================

describe('StreamManager', () => {
  let manager: StreamManager;

  beforeEach(() => {
    vi.clearAllMocks();
    idCounter = 0; // Reset ID counter
    manager = createStreamManager();
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  // ===========================================================================
  // Stream Creation Tests
  // ===========================================================================

  describe('createStream', () => {
    it('should create a new stream with unique ID', async () => {
      const stream = await manager.createStream({
        scenario: 'pet',
      });

      expect(stream).toBeDefined();
      expect(stream.id).toBe('test-id-1');
      expect(stream.scenario).toBe('pet');
    });

    it('should set stream status to active', async () => {
      const stream = await manager.createStream({
        scenario: 'baby',
      });

      expect(stream.status).toBe('active');
    });

    it('should initialize frame and alert counts to zero', async () => {
      const stream = await manager.createStream({
        scenario: 'elderly',
      });

      expect(stream.frameCount).toBe(0);
      expect(stream.alertCount).toBe(0);
    });

    it('should accept optional userId', async () => {
      const stream = await manager.createStream({
        scenario: 'pet',
        userId: 'user-123',
      });

      expect(stream.userId).toBe('user-123');
    });
  });

  // ===========================================================================
  // Stream Retrieval Tests
  // ===========================================================================

  describe('getStream', () => {
    it('should return undefined for non-existent stream', () => {
      const stream = manager.getStream('non-existent-id');

      expect(stream).toBeUndefined();
    });

    it('should return stream by ID after creation', async () => {
      const created = await manager.createStream({ scenario: 'elderly' });

      const retrieved = manager.getStream(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });
  });

  // ===========================================================================
  // Active Streams Tests
  // ===========================================================================

  describe('getActiveStreams', () => {
    it('should return empty array when no streams', () => {
      const active = manager.getActiveStreams();

      expect(active).toEqual([]);
    });

    it('should return all active streams', async () => {
      await manager.createStream({ scenario: 'pet' });
      await manager.createStream({ scenario: 'baby' });

      const active = manager.getActiveStreams();

      expect(active.length).toBe(2);
    });
  });

  describe('getStreamsByScenario', () => {
    it('should return only streams matching scenario', async () => {
      await manager.createStream({ scenario: 'pet' });
      await manager.createStream({ scenario: 'pet' });
      await manager.createStream({ scenario: 'baby' });

      const petStreams = manager.getStreamsByScenario('pet');
      const babyStreams = manager.getStreamsByScenario('baby');

      expect(petStreams.length).toBe(2);
      expect(babyStreams.length).toBe(1);
    });
  });

  // ===========================================================================
  // Socket Attachment Tests
  // ===========================================================================

  describe('attachSocket', () => {
    it('should attach socket to existing stream', async () => {
      const stream = await manager.createStream({ scenario: 'pet' });
      const mockWs = { readyState: 1, close: vi.fn() } as any;

      const result = manager.attachSocket(stream.id, mockWs);

      expect(result).toBe(true);
      const updated = manager.getStream(stream.id);
      expect(updated?.socket).toBe(mockWs);
    });

    it('should return false for non-existent stream', () => {
      const mockWs = { readyState: 1, close: vi.fn() } as any;

      const result = manager.attachSocket('non-existent', mockWs);

      expect(result).toBe(false);
    });

    it('should set lastPing when attaching socket', async () => {
      const stream = await manager.createStream({ scenario: 'pet' });
      const mockWs = { readyState: 1, close: vi.fn() } as any;

      manager.attachSocket(stream.id, mockWs);

      const updated = manager.getStream(stream.id);
      expect(updated?.lastPing).toBeDefined();
    });
  });

  // ===========================================================================
  // Counter Tests
  // ===========================================================================

  describe('incrementFrameCount', () => {
    it('should increment frame count', async () => {
      const stream = await manager.createStream({ scenario: 'pet' });

      manager.incrementFrameCount(stream.id);
      manager.incrementFrameCount(stream.id);
      manager.incrementFrameCount(stream.id);

      const updated = manager.getStream(stream.id);
      expect(updated?.frameCount).toBe(3);
    });
  });

  describe('incrementAlertCount', () => {
    it('should increment alert count', async () => {
      const stream = await manager.createStream({ scenario: 'baby' });

      manager.incrementAlertCount(stream.id);
      manager.incrementAlertCount(stream.id);

      const updated = manager.getStream(stream.id);
      expect(updated?.alertCount).toBe(2);
    });
  });

  describe('updatePing', () => {
    it('should update lastPing timestamp', async () => {
      const stream = await manager.createStream({ scenario: 'pet' });
      const mockWs = { readyState: 1, close: vi.fn() } as any;
      manager.attachSocket(stream.id, mockWs);

      const firstPing = manager.getStream(stream.id)?.lastPing;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      manager.updatePing(stream.id);

      const secondPing = manager.getStream(stream.id)?.lastPing;
      expect(secondPing?.getTime()).toBeGreaterThanOrEqual(firstPing?.getTime() || 0);
    });
  });

  // ===========================================================================
  // Stream End Tests
  // ===========================================================================

  describe('endStream', () => {
    it('should remove stream from active streams', async () => {
      const stream = await manager.createStream({ scenario: 'pet' });

      await manager.endStream(stream.id);

      const retrieved = manager.getStream(stream.id);
      expect(retrieved).toBeUndefined();
    });

    it('should handle ending non-existent stream gracefully', async () => {
      await expect(manager.endStream('non-existent')).resolves.not.toThrow();
    });
  });

  describe('endAllStreams', () => {
    it('should end all active streams', async () => {
      await manager.createStream({ scenario: 'pet' });
      await manager.createStream({ scenario: 'baby' });
      await manager.createStream({ scenario: 'elderly' });

      await manager.endAllStreams();

      expect(manager.getStreamCount()).toBe(0);
    });
  });

  // ===========================================================================
  // Stats Tests
  // ===========================================================================

  describe('getStreamCount', () => {
    it('should return zero when no streams', () => {
      expect(manager.getStreamCount()).toBe(0);
    });

    it('should return correct count after creating streams', async () => {
      await manager.createStream({ scenario: 'pet' });
      await manager.createStream({ scenario: 'baby' });

      expect(manager.getStreamCount()).toBe(2);
    });
  });

  describe('getSummary', () => {
    it('should return summary of all streams', async () => {
      const stream1 = await manager.createStream({ scenario: 'pet' });
      await manager.createStream({ scenario: 'baby' });

      manager.incrementFrameCount(stream1.id);
      manager.incrementAlertCount(stream1.id);

      const summary = manager.getSummary();

      expect(summary.totalActive).toBe(2);
      expect(summary.byScenario.pet).toBe(1);
      expect(summary.byScenario.baby).toBe(1);
      expect(summary.totalFramesProcessed).toBe(1);
      expect(summary.totalAlertsGenerated).toBe(1);
    });
  });
});
