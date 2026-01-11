/**
 * Ollama Client Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaClient, getDefaultOllamaClient } from '../src/lib/ollama/client.js';

describe('OllamaClient', () => {
  let client: OllamaClient;

  beforeEach(() => {
    client = new OllamaClient('http://localhost:11434');
  });

  describe('configuration', () => {
    it('should use provided host', () => {
      const host = client.getHost();
      expect(host).toBe('http://localhost:11434');
    });

    it('should use default host when not provided', () => {
      const defaultClient = new OllamaClient();
      const host = defaultClient.getHost();
      expect(host).toBe('http://localhost:11434');
    });
  });

  describe('health check', () => {
    it('should return false when Ollama is not running', async () => {
      // Mock fetch to simulate Ollama not running
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

      const healthy = await client.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  describe('model management', () => {
    it('should check for required models', async () => {
      // Mock listModels first, then checkRequiredModels uses hasModel which calls listModels
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            { name: 'moondream', size: 830000000, modified_at: '', digest: '' },
            { name: 'llava:7b', size: 4500000000, modified_at: '', digest: '' },
          ],
        }),
      } as Response);

      const result = await client.checkRequiredModels();
      expect(result.triageModel).toBe(true);
      expect(result.analysisModel).toBe(true);
    });

    it('should report missing models', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'other-model', size: 1000000000, modified_at: '', digest: '' }],
        }),
      } as Response);

      const result = await client.checkRequiredModels();
      expect(result.triageModel).toBe(false);
      expect(result.analysisModel).toBe(false);
    });
  });

  describe('singleton', () => {
    it('should return singleton instance', () => {
      const instance1 = getDefaultOllamaClient();
      const instance2 = getDefaultOllamaClient();
      expect(instance1).toBe(instance2);
    });
  });
});
