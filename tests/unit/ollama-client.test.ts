/**
 * Ollama Client Unit Tests
 *
 * Tests for local LLM inference via Ollama.
 *
 * @module tests/unit/ollama-client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import { OllamaClient } from '../../src/lib/ollama/client.js';

// =============================================================================
// Test Suite
// =============================================================================

describe('OllamaClient', () => {
  let client: OllamaClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new OllamaClient('http://localhost:11434');
  });

  // ===========================================================================
  // Health Check Tests
  // ===========================================================================

  describe('isHealthy', () => {
    it('should return true when Ollama is running', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '0.1.0' }),
      });

      const healthy = await client.isHealthy();

      expect(healthy).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/version',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('should return false when Ollama is not running', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const healthy = await client.isHealthy();

      expect(healthy).toBe(false);
    });

    it('should return false on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const healthy = await client.isHealthy();

      expect(healthy).toBe(false);
    });
  });

  // ===========================================================================
  // Version Tests
  // ===========================================================================

  describe('getVersion', () => {
    it('should return version string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '0.3.6' }),
      });

      const version = await client.getVersion();

      expect(version).toBe('0.3.6');
    });

    it('should return null on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const version = await client.getVersion();

      expect(version).toBeNull();
    });
  });

  // ===========================================================================
  // Model Listing Tests
  // ===========================================================================

  describe('listModels', () => {
    it('should list available models', async () => {
      const mockModels = [
        { name: 'moondream:latest', size: 1_000_000_000 },
        { name: 'llava:7b', size: 4_000_000_000 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: mockModels }),
      });

      const models = await client.listModels();

      expect(models).toHaveLength(2);
      expect(models[0].name).toBe('moondream:latest');
      expect(models[1].name).toBe('llava:7b');
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const models = await client.listModels();

      expect(models).toEqual([]);
    });
  });

  // ===========================================================================
  // Model Check Tests
  // ===========================================================================

  describe('hasModel', () => {
    it('should return true if model exists', async () => {
      const mockModels = [
        { name: 'moondream:latest', size: 1_000_000_000 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: mockModels }),
      });

      const has = await client.hasModel('moondream');

      expect(has).toBe(true);
    });

    it('should return false if model does not exist', async () => {
      const mockModels = [
        { name: 'llava:7b', size: 4_000_000_000 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: mockModels }),
      });

      const has = await client.hasModel('moondream');

      expect(has).toBe(false);
    });
  });

  // ===========================================================================
  // Generation Tests
  // ===========================================================================

  describe('generate', () => {
    it('should generate text response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'This is a test response.',
          done: true,
          total_duration: 1000000000,
          prompt_eval_count: 10,
          eval_count: 20,
        }),
      });

      const response = await client.generate({
        model: 'llama2:7b',
        prompt: 'Hello, world!',
      });

      expect(response.response).toBe('This is a test response.');
      expect(response.done).toBe(true);
    });

    it('should include images in request for vision models', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'I see a cat.',
          done: true,
        }),
      });

      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await client.generate({
        model: 'llava:7b',
        prompt: 'What do you see?',
        images: [base64Image],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          body: expect.stringContaining('images'),
        })
      );
    });

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        client.generate({
          model: 'llama2:7b',
          prompt: 'Hello',
        })
      ).rejects.toThrow();
    });
  });

  // ===========================================================================
  // Image Analysis Tests
  // ===========================================================================

  describe('analyzeImage', () => {
    it('should analyze image with vision model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'The image shows a sleeping cat on a couch.',
          done: true,
        }),
      });

      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await client.analyzeImage(base64Image, 'Describe this image.');

      expect(result).toBe('The image shows a sleeping cat on a couch.');
    });
  });

  // ===========================================================================
  // Triage Tests
  // ===========================================================================

  describe('triage', () => {
    it('should triage image and return concern level', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'CONCERN: low - Everything appears normal.',
          done: true,
        }),
      });

      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await client.triage(base64Image, 'pet');

      expect(result.needsDetailedAnalysis).toBe(false);
      expect(result.quickAssessment).toContain('low');
    });

    it('should flag high concern for detailed analysis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'CONCERN: high - Pet appears to be in distress.',
          done: true,
        }),
      });

      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await client.triage(base64Image, 'pet');

      expect(result.needsDetailedAnalysis).toBe(true);
    });
  });

  // ===========================================================================
  // Metrics Tests
  // ===========================================================================

  describe('metrics', () => {
    it('should track analysis count', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          response: 'Test response',
          done: true,
        }),
      });

      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await client.analyzeImage(base64Image, 'Test');
      await client.analyzeImage(base64Image, 'Test');

      const metrics = client.getMetrics();

      expect(metrics.analysisCount).toBe(2);
    });
  });
});














