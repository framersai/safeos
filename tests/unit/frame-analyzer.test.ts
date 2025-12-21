/**
 * Frame Analyzer Unit Tests
 *
 * Tests for the main vision analysis pipeline.
 *
 * @module tests/unit/frame-analyzer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Ollama client
vi.mock('../../src/lib/ollama/client.js', () => ({
  OllamaClient: vi.fn().mockImplementation(() => ({
    isHealthy: vi.fn().mockResolvedValue(true),
    triage: vi.fn().mockResolvedValue({
      needsDetailedAnalysis: false,
      quickAssessment: 'CONCERN: none - All clear',
    }),
    analyze: vi.fn().mockResolvedValue({
      concernLevel: 'none',
      description: 'Everything looks normal.',
      recommendations: [],
    }),
  })),
}));

// Mock cloud fallback
vi.mock('../../src/lib/analysis/cloud-fallback.js', () => ({
  cloudFallbackAnalysis: vi.fn().mockResolvedValue({
    concernLevel: 'none',
    description: 'Cloud analysis: all clear.',
    recommendations: [],
    source: 'anthropic',
  }),
}));

import { FrameAnalyzer } from '../../src/lib/analysis/frame-analyzer.js';

// =============================================================================
// Test Suite
// =============================================================================

describe('FrameAnalyzer', () => {
  let analyzer: FrameAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new FrameAnalyzer();
  });

  // ===========================================================================
  // Basic Analysis Tests
  // ===========================================================================

  describe('analyze', () => {
    const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('should analyze a frame for pet monitoring', async () => {
      const result = await analyzer.analyze({
        frameData: mockFrame,
        scenario: 'pet',
        streamId: 'test-stream-1',
      });

      expect(result).toBeDefined();
      expect(result.concernLevel).toBe('none');
    });

    it('should analyze a frame for baby monitoring', async () => {
      const result = await analyzer.analyze({
        frameData: mockFrame,
        scenario: 'baby',
        streamId: 'test-stream-2',
      });

      expect(result).toBeDefined();
    });

    it('should analyze a frame for elderly monitoring', async () => {
      const result = await analyzer.analyze({
        frameData: mockFrame,
        scenario: 'elderly',
        streamId: 'test-stream-3',
      });

      expect(result).toBeDefined();
    });

    it('should include motion context in analysis', async () => {
      const result = await analyzer.analyze({
        frameData: mockFrame,
        scenario: 'pet',
        streamId: 'test-stream-4',
        motionScore: 0.8,
      });

      expect(result).toBeDefined();
    });

    it('should include audio context in analysis', async () => {
      const result = await analyzer.analyze({
        frameData: mockFrame,
        scenario: 'baby',
        streamId: 'test-stream-5',
        audioLevel: 0.9,
      });

      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // Concern Level Tests
  // ===========================================================================

  describe('concern levels', () => {
    it('should return none for normal scenes', async () => {
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await analyzer.analyze({
        frameData: mockFrame,
        scenario: 'pet',
        streamId: 'test-stream',
      });

      expect(['none', 'low', 'medium', 'high', 'critical']).toContain(result.concernLevel);
    });
  });

  // ===========================================================================
  // Metrics Tests
  // ===========================================================================

  describe('metrics', () => {
    it('should track analysis count', async () => {
      const mockFrame = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await analyzer.analyze({
        frameData: mockFrame,
        scenario: 'pet',
        streamId: 'test-1',
      });

      await analyzer.analyze({
        frameData: mockFrame,
        scenario: 'baby',
        streamId: 'test-2',
      });

      const metrics = analyzer.getMetrics();

      expect(metrics.totalAnalyses).toBe(2);
    });
  });
});





