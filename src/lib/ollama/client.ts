/**
 * Ollama Client
 *
 * HTTP client for interacting with local Ollama for vision analysis.
 *
 * @module lib/ollama/client
 */

import type { ConcernLevel } from '../../types/index.js';

// =============================================================================
// Types
// =============================================================================

export interface OllamaConfig {
  baseUrl: string;
  timeoutMs: number;
  triageModel: string;
  analysisModel: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modifiedAt: string;
  details?: {
    family: string;
    parameterSize: string;
    quantizationLevel: string;
  };
}

export interface TriageResult {
  needsDetailedAnalysis: boolean;
  concernLevel: ConcernLevel;
  summary: string;
}

export interface AnalysisResult {
  concernLevel: ConcernLevel;
  description: string;
  issues: string[];
  recommendations: string[];
  confidence: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: process.env['OLLAMA_HOST'] || 'http://localhost:11434',
  timeoutMs: 60000,
  triageModel: 'moondream',
  analysisModel: 'llava:7b',
};

const REQUIRED_MODELS = ['moondream', 'llava:7b'];

// =============================================================================
// OllamaClient Class
// =============================================================================

export class OllamaClient {
  private config: OllamaConfig;
  private healthCache: { healthy: boolean; checkedAt: number } | null = null;
  private modelCache: { models: OllamaModel[]; checkedAt: number } | null = null;
  private readonly cacheMs = 30000; // 30 seconds

  // Stats
  private stats = {
    totalRequests: 0,
    triageRequests: 0,
    analysisRequests: 0,
    failures: 0,
    avgLatencyMs: 0,
  };

  constructor(config?: Partial<OllamaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // Health & Model Management
  // ---------------------------------------------------------------------------

  /**
   * Check if Ollama is healthy
   */
  async isHealthy(): Promise<boolean> {
    // Check cache
    if (this.healthCache && Date.now() - this.healthCache.checkedAt < this.cacheMs) {
      return this.healthCache.healthy;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/version`, {
        signal: AbortSignal.timeout(5000),
      });

      const healthy = response.ok;
      this.healthCache = { healthy, checkedAt: Date.now() };
      return healthy;
    } catch {
      this.healthCache = { healthy: false, checkedAt: Date.now() };
      return false;
    }
  }

  /**
   * Get Ollama version
   */
  async getVersion(): Promise<string | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/version`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.version;
    } catch {
      return null;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<OllamaModel[]> {
    // Check cache
    if (this.modelCache && Date.now() - this.modelCache.checkedAt < this.cacheMs) {
      return this.modelCache.models;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = await response.json();
      const models: OllamaModel[] = (data.models || []).map((m: any) => ({
        name: m.name,
        size: m.size,
        digest: m.digest,
        modifiedAt: m.modified_at,
        details: m.details,
      }));

      this.modelCache = { models, checkedAt: Date.now() };
      return models;
    } catch {
      return [];
    }
  }

  /**
   * Check if a specific model is available
   */
  async hasModel(name: string): Promise<boolean> {
    const models = await this.listModels();
    return models.some((m) => m.name === name || m.name.startsWith(name + ':'));
  }

  /**
   * Ensure required models are installed
   */
  async ensureModels(): Promise<{ available: string[]; missing: string[]; pulled: string[] }> {
    const models = await this.listModels();
    const available: string[] = [];
    const missing: string[] = [];
    const pulled: string[] = [];

    for (const required of REQUIRED_MODELS) {
      const found = models.some(
        (m) => m.name === required || m.name.startsWith(required.split(':')[0] + ':')
      );

      if (found) {
        available.push(required);
      } else {
        missing.push(required);
      }
    }

    // Try to pull missing models
    for (const model of missing) {
      try {
        await this.pullModel(model);
        pulled.push(model);
      } catch (error) {
        console.error(`Failed to pull model ${model}:`, error);
      }
    }

    return { available, missing: missing.filter((m) => !pulled.includes(m)), pulled };
  }

  /**
   * Pull a model
   */
  async pullModel(name: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    // Stream the response to wait for completion
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }

    // Clear cache
    this.modelCache = null;
  }

  // ---------------------------------------------------------------------------
  // Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate text from an image
   */
  async generate(
    model: string,
    prompt: string,
    imageBase64?: string
  ): Promise<string> {
    this.stats.totalRequests++;
    const startTime = Date.now();

    try {
      const body: any = {
        model,
        prompt,
        stream: false,
      };

      if (imageBase64) {
        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        body.images = [base64Data];
      }

      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Ollama generate failed: ${response.statusText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      this.updateAvgLatency(latencyMs);

      return data.response || '';
    } catch (error) {
      this.stats.failures++;
      throw error;
    }
  }

  /**
   * Analyze an image with a prompt
   */
  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    return this.generate(this.config.analysisModel, prompt, imageBase64);
  }

  // ---------------------------------------------------------------------------
  // High-Level API
  // ---------------------------------------------------------------------------

  /**
   * Quick triage of an image
   */
  async triage(imageBase64: string, prompt: string): Promise<TriageResult> {
    this.stats.triageRequests++;

    const response = await this.generate(this.config.triageModel, prompt, imageBase64);

    // Try to parse JSON
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          needsDetailedAnalysis: parsed.needsDetailedAnalysis ?? true,
          concernLevel: this.normalizeConcernLevel(parsed.concernLevel),
          summary: parsed.summary || response.slice(0, 200),
        };
      }
    } catch {
      // Fall through to default parsing
    }

    // Default: if any concerning keywords, need analysis
    const needsAnalysis =
      response.toLowerCase().includes('concern') ||
      response.toLowerCase().includes('unsafe') ||
      response.toLowerCase().includes('danger') ||
      response.toLowerCase().includes('distress');

    return {
      needsDetailedAnalysis: needsAnalysis,
      concernLevel: needsAnalysis ? 'medium' : 'none',
      summary: response.slice(0, 200),
    };
  }

  /**
   * Detailed analysis of an image
   */
  async analyze(imageBase64: string, prompt: string): Promise<AnalysisResult> {
    this.stats.analysisRequests++;

    const response = await this.generate(this.config.analysisModel, prompt, imageBase64);

    // Try to parse JSON
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          concernLevel: this.normalizeConcernLevel(parsed.concernLevel),
          description: parsed.description || response,
          issues: parsed.issues || [],
          recommendations: parsed.recommendations || [],
          confidence: parsed.confidence || 0.7,
        };
      }
    } catch {
      // Fall through
    }

    // Parse from natural language
    return {
      concernLevel: this.extractConcernLevel(response),
      description: response.slice(0, 500),
      issues: this.extractIssues(response),
      recommendations: this.extractRecommendations(response),
      confidence: 0.5,
    };
  }

  /**
   * Get stats
   */
  getStats() {
    return { ...this.stats };
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private normalizeConcernLevel(level: string | undefined): ConcernLevel {
    if (!level) return 'none';
    const lower = level.toLowerCase();
    if (lower.includes('critical')) return 'critical';
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium') || lower.includes('moderate')) return 'medium';
    if (lower.includes('low')) return 'low';
    return 'none';
  }

  private extractConcernLevel(text: string): ConcernLevel {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency')) return 'critical';
    if (lower.includes('high concern') || lower.includes('urgent')) return 'high';
    if (lower.includes('moderate') || lower.includes('some concern')) return 'medium';
    if (lower.includes('low concern') || lower.includes('minor')) return 'low';
    return 'none';
  }

  private extractIssues(text: string): string[] {
    const issues: string[] = [];
    const patterns = [/concern[s]?:?\s*([^.]+)/gi, /issue[s]?:?\s*([^.]+)/gi];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) issues.push(match[1].trim());
      }
    }

    return issues.slice(0, 5);
  }

  private extractRecommendations(text: string): string[] {
    const recs: string[] = [];
    const patterns = [/recommend[s]?:?\s*([^.]+)/gi, /should\s+([^.]+)/gi];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) recs.push(match[1].trim());
      }
    }

    return recs.slice(0, 5);
  }

  private updateAvgLatency(latencyMs: number): void {
    const total = this.stats.totalRequests;
    this.stats.avgLatencyMs = (this.stats.avgLatencyMs * (total - 1) + latencyMs) / total;
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultClient: OllamaClient | null = null;

export function getDefaultOllamaClient(): OllamaClient {
  if (!defaultClient) {
    defaultClient = new OllamaClient();
  }
  return defaultClient;
}

export function createOllamaClient(config?: Partial<OllamaConfig>): OllamaClient {
  return new OllamaClient(config);
}
