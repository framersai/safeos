/**
 * Audio Analyzer Unit Tests
 *
 * Tests for server-side audio analysis including cry detection.
 *
 * @module tests/unit/audio-analyzer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AudioAnalyzer } from '../../src/lib/audio/analyzer.js';

// =============================================================================
// Test Suite
// =============================================================================

describe('AudioAnalyzer', () => {
  let analyzer: AudioAnalyzer;

  beforeEach(() => {
    analyzer = new AudioAnalyzer();
  });

  // ===========================================================================
  // Basic Analysis Tests
  // ===========================================================================

  describe('analyzeAudioChunk', () => {
    it('should analyze audio data and return metrics', async () => {
      const mockAudioData = new Float32Array(1024).fill(0.5);

      const result = await analyzer.analyzeAudioChunk(mockAudioData);

      expect(result).toBeDefined();
      expect(typeof result.level).toBe('number');
      expect(result.level).toBeGreaterThanOrEqual(0);
      expect(result.level).toBeLessThanOrEqual(1);
    });

    it('should detect silence for zero audio', async () => {
      const silentAudio = new Float32Array(1024).fill(0);

      const result = await analyzer.analyzeAudioChunk(silentAudio);

      expect(result.level).toBe(0);
      expect(result.isSilent).toBe(true);
    });

    it('should detect loud audio', async () => {
      const loudAudio = new Float32Array(1024).fill(0.9);

      const result = await analyzer.analyzeAudioChunk(loudAudio);

      expect(result.level).toBeGreaterThan(0.5);
      expect(result.isSilent).toBe(false);
    });
  });

  // ===========================================================================
  // Cry Detection Tests
  // ===========================================================================

  describe('detectCryingPattern', () => {
    it('should not detect crying in silence', async () => {
      const silentAudio = new Float32Array(1024).fill(0);

      const result = await analyzer.detectCryingPattern(silentAudio);

      expect(result.isCrying).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should analyze frequency patterns for crying', async () => {
      // Simulate crying frequency pattern (300-600 Hz range)
      const sampleRate = 16000;
      const cryingFreq = 450;
      const cryingAudio = new Float32Array(sampleRate);

      for (let i = 0; i < sampleRate; i++) {
        cryingAudio[i] = Math.sin((2 * Math.PI * cryingFreq * i) / sampleRate) * 0.7;
      }

      const result = await analyzer.detectCryingPattern(cryingAudio);

      expect(result).toBeDefined();
      expect(typeof result.isCrying).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
    });

    it('should return intensity level', async () => {
      const mockAudio = new Float32Array(1024).fill(0.6);

      const result = await analyzer.detectCryingPattern(mockAudio);

      expect(result.intensity).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(result.intensity);
    });
  });

  // ===========================================================================
  // Distress Sound Detection Tests
  // ===========================================================================

  describe('detectDistressSound', () => {
    it('should analyze for distress patterns in elderly monitoring', async () => {
      const mockAudio = new Float32Array(1024).fill(0.5);

      const result = await analyzer.detectDistressSound(mockAudio, 'elderly');

      expect(result).toBeDefined();
      expect(typeof result.isDistress).toBe('boolean');
    });

    it('should analyze for pet distress sounds', async () => {
      const mockAudio = new Float32Array(1024).fill(0.4);

      const result = await analyzer.detectDistressSound(mockAudio, 'pet');

      expect(result).toBeDefined();
      expect(typeof result.isDistress).toBe('boolean');
    });
  });

  // ===========================================================================
  // Rolling Buffer Tests
  // ===========================================================================

  describe('rolling audio buffer', () => {
    it('should maintain rolling buffer of audio samples', async () => {
      const chunk1 = new Float32Array(512).fill(0.3);
      const chunk2 = new Float32Array(512).fill(0.6);

      await analyzer.addToBuffer(chunk1);
      await analyzer.addToBuffer(chunk2);

      const bufferStats = analyzer.getBufferStats();

      expect(bufferStats.sampleCount).toBeGreaterThan(0);
    });

    it('should limit buffer size to prevent memory issues', async () => {
      // Add many chunks
      for (let i = 0; i < 100; i++) {
        const chunk = new Float32Array(1024).fill(Math.random());
        await analyzer.addToBuffer(chunk);
      }

      const bufferStats = analyzer.getBufferStats();

      // Should not exceed max buffer size (e.g., 5 minutes at 16kHz)
      const maxSamples = 5 * 60 * 16000;
      expect(bufferStats.sampleCount).toBeLessThanOrEqual(maxSamples);
    });
  });

  // ===========================================================================
  // Threshold Tests
  // ===========================================================================

  describe('configurable thresholds', () => {
    it('should respect custom silence threshold', async () => {
      const customAnalyzer = new AudioAnalyzer({ silenceThreshold: 0.1 });
      const quietAudio = new Float32Array(1024).fill(0.05);

      const result = await customAnalyzer.analyzeAudioChunk(quietAudio);

      expect(result.isSilent).toBe(true);
    });

    it('should respect custom cry detection sensitivity', async () => {
      const sensitiveAnalyzer = new AudioAnalyzer({ crySensitivity: 0.9 });
      const mockAudio = new Float32Array(1024).fill(0.3);

      const result = await sensitiveAnalyzer.detectCryingPattern(mockAudio);

      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // Scenario-specific Tests
  // ===========================================================================

  describe('scenario-specific analysis', () => {
    it('should use baby-specific parameters for baby scenario', async () => {
      const mockAudio = new Float32Array(1024).fill(0.5);

      const result = await analyzer.analyzeForScenario(mockAudio, 'baby');

      expect(result.scenario).toBe('baby');
      expect(result.analysis.cryingDetection).toBeDefined();
    });

    it('should use pet-specific parameters for pet scenario', async () => {
      const mockAudio = new Float32Array(1024).fill(0.5);

      const result = await analyzer.analyzeForScenario(mockAudio, 'pet');

      expect(result.scenario).toBe('pet');
      expect(result.analysis.barkingDetection).toBeDefined();
    });

    it('should use elderly-specific parameters for elderly scenario', async () => {
      const mockAudio = new Float32Array(1024).fill(0.5);

      const result = await analyzer.analyzeForScenario(mockAudio, 'elderly');

      expect(result.scenario).toBe('elderly');
      expect(result.analysis.distressDetection).toBeDefined();
    });
  });
});








