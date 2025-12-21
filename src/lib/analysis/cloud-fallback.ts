/**
 * Cloud Fallback
 *
 * Fallback to cloud LLMs when local Ollama fails or for complex analysis.
 *
 * @module lib/analysis/cloud-fallback
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { MonitoringScenario, ConcernLevel } from '../../types/index.js';
import { getProfile } from './profiles/index.js';

// =============================================================================
// Types
// =============================================================================

export type CloudProvider = 'anthropic' | 'openai' | 'openrouter';

export interface CloudAnalysisResult {
  concernLevel: ConcernLevel;
  description: string;
  issues: string[];
  recommendations: string[];
  provider: CloudProvider;
  model: string;
  latencyMs: number;
}

export interface CloudFallbackConfig {
  providers: CloudProvider[];
  anthropicKey?: string;
  openaiKey?: string;
  openrouterKey?: string;
  maxRetries: number;
  timeoutMs: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONFIG: CloudFallbackConfig = {
  providers: ['anthropic', 'openai', 'openrouter'],
  maxRetries: 2,
  timeoutMs: 30000,
};

// Model preferences per provider
const VISION_MODELS: Record<CloudProvider, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  openrouter: 'anthropic/claude-sonnet-4-20250514',
};

// =============================================================================
// CloudFallback Class
// =============================================================================

export class CloudFallback {
  private config: CloudFallbackConfig;
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  // Stats
  private stats = {
    totalCalls: 0,
    byProvider: { anthropic: 0, openai: 0, openrouter: 0 },
    failures: 0,
    avgLatencyMs: 0,
  };

  constructor(config?: Partial<CloudFallbackConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initClients();
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Analyze an image using cloud LLMs
   */
  async analyze(
    imageBase64: string,
    scenario: MonitoringScenario,
    context?: string
  ): Promise<CloudAnalysisResult> {
    const startTime = Date.now();
    this.stats.totalCalls++;

    const profile = getProfile(scenario);
    const prompt = profile.analysisPrompt + (context ? `\n\nAdditional context: ${context}` : '');

    // Try each provider in order
    for (const provider of this.config.providers) {
      try {
        const result = await this.callProvider(provider, imageBase64, prompt);
        const latencyMs = Date.now() - startTime;

        this.stats.byProvider[provider]++;
        this.updateAvgLatency(latencyMs);

        return {
          ...result,
          provider,
          latencyMs,
        };
      } catch (error) {
        console.error(`Cloud provider ${provider} failed:`, error);
        continue;
      }
    }

    this.stats.failures++;
    throw new Error('All cloud providers failed');
  }

  /**
   * Check if any cloud provider is available
   */
  isAvailable(): boolean {
    return (
      !!this.config.anthropicKey ||
      !!this.config.openaiKey ||
      !!this.config.openrouterKey ||
      !!process.env['ANTHROPIC_API_KEY'] ||
      !!process.env['OPENAI_API_KEY'] ||
      !!process.env['OPENROUTER_API_KEY']
    );
  }

  /**
   * Get stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<CloudFallbackConfig>): void {
    this.config = { ...this.config, ...config };
    this.initClients();
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private initClients(): void {
    const anthropicKey = this.config.anthropicKey || process.env['ANTHROPIC_API_KEY'];
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }

    const openaiKey = this.config.openaiKey || process.env['OPENAI_API_KEY'];
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  private async callProvider(
    provider: CloudProvider,
    imageBase64: string,
    prompt: string
  ): Promise<Omit<CloudAnalysisResult, 'provider' | 'latencyMs'>> {
    switch (provider) {
      case 'anthropic':
        return this.callAnthropic(imageBase64, prompt);
      case 'openai':
        return this.callOpenAI(imageBase64, prompt);
      case 'openrouter':
        return this.callOpenRouter(imageBase64, prompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callAnthropic(
    imageBase64: string,
    prompt: string
  ): Promise<Omit<CloudAnalysisResult, 'provider' | 'latencyMs'>> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const response = await this.anthropic.messages.create({
      model: VISION_MODELS.anthropic,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    const text = textContent && 'text' in textContent ? textContent.text : '';

    return this.parseResponse(text, VISION_MODELS.anthropic);
  }

  private async callOpenAI(
    imageBase64: string,
    prompt: string
  ): Promise<Omit<CloudAnalysisResult, 'provider' | 'latencyMs'>> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.chat.completions.create({
      model: VISION_MODELS.openai,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content || '';
    return this.parseResponse(text, VISION_MODELS.openai);
  }

  private async callOpenRouter(
    imageBase64: string,
    prompt: string
  ): Promise<Omit<CloudAnalysisResult, 'provider' | 'latencyMs'>> {
    const apiKey = this.config.openrouterKey || process.env['OPENROUTER_API_KEY'];
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://safeos.app',
        'X-Title': 'SafeOS Guardian',
      },
      body: JSON.stringify({
        model: VISION_MODELS.openrouter,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:')
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return this.parseResponse(text, VISION_MODELS.openrouter);
  }

  private parseResponse(
    text: string,
    model: string
  ): Omit<CloudAnalysisResult, 'provider' | 'latencyMs'> {
    // Try to parse as JSON first
    try {
      const json = JSON.parse(text);
      return {
        concernLevel: this.normalizeConcernLevel(json.concernLevel || json.concern_level),
        description: json.description || json.summary || text,
        issues: json.issues || json.concerns || [],
        recommendations: json.recommendations || json.actions || [],
        model,
      };
    } catch {
      // Parse from natural language
      return {
        concernLevel: this.extractConcernLevel(text),
        description: text.slice(0, 500),
        issues: this.extractIssues(text),
        recommendations: this.extractRecommendations(text),
        model,
      };
    }
  }

  private normalizeConcernLevel(level: string | undefined): ConcernLevel {
    if (!level) return 'none';
    const lower = level.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency')) return 'critical';
    if (lower.includes('high') || lower.includes('urgent')) return 'high';
    if (lower.includes('medium') || lower.includes('moderate')) return 'medium';
    if (lower.includes('low') || lower.includes('minor')) return 'low';
    return 'none';
  }

  private extractConcernLevel(text: string): ConcernLevel {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency') || lower.includes('immediate')) {
      return 'critical';
    }
    if (lower.includes('high concern') || lower.includes('urgent') || lower.includes('serious')) {
      return 'high';
    }
    if (lower.includes('moderate') || lower.includes('some concern')) {
      return 'medium';
    }
    if (lower.includes('low concern') || lower.includes('minor')) {
      return 'low';
    }
    return 'none';
  }

  private extractIssues(text: string): string[] {
    const issues: string[] = [];
    const patterns = [
      /concern[s]?:?\s*([^.]+)/gi,
      /issue[s]?:?\s*([^.]+)/gi,
      /problem[s]?:?\s*([^.]+)/gi,
      /warning[s]?:?\s*([^.]+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          issues.push(match[1].trim());
        }
      }
    }

    return issues.slice(0, 5);
  }

  private extractRecommendations(text: string): string[] {
    const recs: string[] = [];
    const patterns = [
      /recommend[s]?:?\s*([^.]+)/gi,
      /suggest[s]?:?\s*([^.]+)/gi,
      /should\s+([^.]+)/gi,
      /action[s]?:?\s*([^.]+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          recs.push(match[1].trim());
        }
      }
    }

    return recs.slice(0, 5);
  }

  private updateAvgLatency(latencyMs: number): void {
    const total = this.stats.totalCalls;
    this.stats.avgLatencyMs =
      (this.stats.avgLatencyMs * (total - 1) + latencyMs) / total;
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultFallback: CloudFallback | null = null;

export function getDefaultCloudFallback(): CloudFallback {
  if (!defaultFallback) {
    defaultFallback = new CloudFallback();
  }
  return defaultFallback;
}

export function createCloudFallback(config?: Partial<CloudFallbackConfig>): CloudFallback {
  return new CloudFallback(config);
}
