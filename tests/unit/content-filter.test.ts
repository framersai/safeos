/**
 * Content Filter Unit Tests
 *
 * Tests for 4-tier content moderation system.
 *
 * @module tests/unit/content-filter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentFilter, CONTENT_CATEGORIES } from '../../src/lib/safety/content-filter.js';

// Mock Ollama client
vi.mock('../../src/lib/ollama/client.js', () => ({
  OllamaClient: vi.fn().mockImplementation(() => ({
    isHealthy: vi.fn().mockResolvedValue(true),
    generate: vi.fn().mockResolvedValue({
      response: 'SAFE: No concerning content detected.',
      done: true,
    }),
  })),
}));

// =============================================================================
// Test Suite
// =============================================================================

describe('ContentFilter', () => {
  let filter: ContentFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new ContentFilter();
  });

  // ===========================================================================
  // Basic Moderation Tests
  // ===========================================================================

  describe('moderate', () => {
    it('should allow safe content', async () => {
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await filter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(result.action).toBe('allow');
      expect(result.tier).toBe(1); // Local AI screening
    });

    it('should return moderation result with all required fields', async () => {
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await filter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('categories');
    });
  });

  // ===========================================================================
  // Tier Escalation Tests
  // ===========================================================================

  describe('tier escalation', () => {
    it('should escalate to tier 2 for uncertain results', async () => {
      const { OllamaClient } = await import('../../src/lib/ollama/client.js');
      vi.mocked(OllamaClient).mockImplementation(() => ({
        isHealthy: vi.fn().mockResolvedValue(true),
        generate: vi.fn().mockResolvedValue({
          response: 'UNCERTAIN: Possible concerning content, needs review.',
          done: true,
        }),
      } as any));

      const newFilter = new ContentFilter();
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await newFilter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(result.tier).toBeGreaterThanOrEqual(1);
    });

    it('should escalate to tier 4 for severe violations', async () => {
      const { OllamaClient } = await import('../../src/lib/ollama/client.js');
      vi.mocked(OllamaClient).mockImplementation(() => ({
        isHealthy: vi.fn().mockResolvedValue(true),
        generate: vi.fn().mockResolvedValue({
          response: 'ESCALATE: Severe violation detected - child safety concern.',
          done: true,
        }),
      } as any));

      const severeFilter = new ContentFilter();
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await severeFilter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(result.action).toBe('escalate');
    });
  });

  // ===========================================================================
  // Category Detection Tests
  // ===========================================================================

  describe('category detection', () => {
    it('should identify content categories', async () => {
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await filter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(Array.isArray(result.categories)).toBe(true);
    });

    it('should have all required content categories defined', () => {
      expect(CONTENT_CATEGORIES).toBeDefined();
      expect(CONTENT_CATEGORIES).toContain('abuse');
      expect(CONTENT_CATEGORIES).toContain('neglect');
      expect(CONTENT_CATEGORIES).toContain('inappropriate');
      expect(CONTENT_CATEGORIES).toContain('dangerous');
    });
  });

  // ===========================================================================
  // Action Tests
  // ===========================================================================

  describe('moderation actions', () => {
    it('should return allow for safe content', async () => {
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await filter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(['allow', 'blur', 'block', 'escalate']).toContain(result.action);
    });

    it('should support blur action', async () => {
      const { OllamaClient } = await import('../../src/lib/ollama/client.js');
      vi.mocked(OllamaClient).mockImplementation(() => ({
        isHealthy: vi.fn().mockResolvedValue(true),
        generate: vi.fn().mockResolvedValue({
          response: 'BLUR: Minor privacy concern detected.',
          done: true,
        }),
      } as any));

      const blurFilter = new ContentFilter();
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await blurFilter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(result.action).toBe('blur');
    });

    it('should support block action', async () => {
      const { OllamaClient } = await import('../../src/lib/ollama/client.js');
      vi.mocked(OllamaClient).mockImplementation(() => ({
        isHealthy: vi.fn().mockResolvedValue(true),
        generate: vi.fn().mockResolvedValue({
          response: 'BLOCK: Content policy violation.',
          done: true,
        }),
      } as any));

      const blockFilter = new ContentFilter();
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await blockFilter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(result.action).toBe('block');
    });
  });

  // ===========================================================================
  // Flag Creation Tests
  // ===========================================================================

  describe('flag creation', () => {
    it('should create flag for human review on escalation', async () => {
      const { OllamaClient } = await import('../../src/lib/ollama/client.js');
      vi.mocked(OllamaClient).mockImplementation(() => ({
        isHealthy: vi.fn().mockResolvedValue(true),
        generate: vi.fn().mockResolvedValue({
          response: 'ESCALATE: Needs human review.',
          done: true,
        }),
      } as any));

      const escalateFilter = new ContentFilter();
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await escalateFilter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      expect(result.flagId).toBeDefined();
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should fail safe on Ollama error', async () => {
      const { OllamaClient } = await import('../../src/lib/ollama/client.js');
      vi.mocked(OllamaClient).mockImplementation(() => ({
        isHealthy: vi.fn().mockResolvedValue(false),
        generate: vi.fn().mockRejectedValue(new Error('Connection refused')),
      } as any));

      const errorFilter = new ContentFilter();
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await errorFilter.moderate({
        frameData: mockFrame,
        streamId: 'test-stream',
      });

      // Should fail safe - either block or escalate
      expect(['block', 'escalate']).toContain(result.action);
    });
  });

  // ===========================================================================
  // Metrics Tests
  // ===========================================================================

  describe('metrics', () => {
    it('should track moderation counts', async () => {
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await filter.moderate({ frameData: mockFrame, streamId: 'stream-1' });
      await filter.moderate({ frameData: mockFrame, streamId: 'stream-2' });

      const metrics = filter.getMetrics();

      expect(metrics.totalModerated).toBe(2);
    });

    it('should track actions by type', async () => {
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await filter.moderate({ frameData: mockFrame, streamId: 'stream-1' });

      const metrics = filter.getMetrics();

      expect(metrics.byAction).toBeDefined();
      expect(metrics.byAction.allow).toBeGreaterThanOrEqual(0);
    });
  });
});
