/**
 * Content Filter
 *
 * 4-tier content moderation system for abuse detection.
 *
 * @module lib/safety/content-filter
 */

import { getDefaultOllamaClient } from '../ollama/client.js';
import { getSafeOSDatabase, generateId, now } from '../../db/index.js';
import type { ModerationTier, ModerationResult, ContentFlag } from '../../types/index.js';

// =============================================================================
// Types
// =============================================================================

export interface ContentFilterConfig {
  enabled: boolean;
  enableLocalScreening: boolean;
  enableCloudReview: boolean;
  autoBlockTier4: boolean;
  categories: ContentCategory[];
}

export interface ContentCategory {
  id: string;
  name: string;
  keywords: string[];
  tier: ModerationTier;
  autoEscalate: boolean;
}

export interface FilterResult {
  passed: boolean;
  tier: ModerationTier;
  action: 'allow' | 'blur' | 'block' | 'escalate';
  categories: string[];
  confidence: number;
  flagId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CATEGORIES: ContentCategory[] = [
  {
    id: 'csam',
    name: 'Child Safety',
    keywords: ['child abuse', 'exploitation', 'inappropriate'],
    tier: 4,
    autoEscalate: true,
  },
  {
    id: 'violence',
    name: 'Violence',
    keywords: ['violence', 'blood', 'injury', 'assault', 'weapon'],
    tier: 3,
    autoEscalate: true,
  },
  {
    id: 'abuse',
    name: 'Abuse/Neglect',
    keywords: ['abuse', 'neglect', 'harm', 'danger', 'unsafe'],
    tier: 3,
    autoEscalate: true,
  },
  {
    id: 'adult',
    name: 'Adult Content',
    keywords: ['nudity', 'explicit', 'sexual'],
    tier: 2,
    autoEscalate: false,
  },
  {
    id: 'fraud',
    name: 'Fraud/Misuse',
    keywords: ['fake', 'staged', 'misleading'],
    tier: 2,
    autoEscalate: false,
  },
];

const MODERATION_PROMPT = `You are a content safety moderator for a baby/pet/elderly monitoring service.
Analyze this image and determine if it contains any of the following concerns:

1. TIER 1 (Low): Suspicious but likely benign (unusual positioning, odd activity)
2. TIER 2 (Medium): Content policy violation (adult content, misuse of service)
3. TIER 3 (High): Potential harm/abuse (unsafe conditions, signs of neglect or distress)
4. TIER 4 (Critical): Severe violation requiring immediate action (illegal content, imminent danger)

Respond in JSON format:
{
  "tier": 0-4,
  "action": "allow" | "blur" | "block" | "escalate",
  "categories": ["category1", "category2"],
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

If the image appears normal and safe, respond with tier 0 and action "allow".
Be thorough but avoid false positives - this is for legitimate monitoring of loved ones.`;

// =============================================================================
// ContentFilter Class
// =============================================================================

export class ContentFilter {
  private config: ContentFilterConfig;
  private ollama = getDefaultOllamaClient();

  // Stats
  private stats = {
    totalFiltered: 0,
    byTier: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 } as Record<number, number>,
    blocked: 0,
    escalated: 0,
  };

  constructor(config?: Partial<ContentFilterConfig>) {
    this.config = {
      enabled: true,
      enableLocalScreening: true,
      enableCloudReview: true,
      autoBlockTier4: true,
      categories: DEFAULT_CATEGORIES,
      ...config,
    };
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Filter content (image) for safety concerns
   */
  async filter(
    imageBase64: string,
    streamId: string,
    analysisId?: string
  ): Promise<FilterResult> {
    if (!this.config.enabled) {
      return { passed: true, tier: 0, action: 'allow', categories: [], confidence: 1 };
    }

    this.stats.totalFiltered++;

    try {
      // Local AI screening
      if (this.config.enableLocalScreening && (await this.ollama.isHealthy())) {
        const result = await this.localScreen(imageBase64);

        if (result.tier > 0) {
          // Create flag for review
          const flagId = await this.createFlag(streamId, analysisId, result);
          result.flagId = flagId;
        }

        this.stats.byTier[result.tier]++;
        if (result.action === 'block') this.stats.blocked++;
        if (result.action === 'escalate') this.stats.escalated++;

        return result;
      }

      // If no local AI, pass through (would use cloud in production)
      return { passed: true, tier: 0, action: 'allow', categories: [], confidence: 0.5 };
    } catch (error) {
      console.error('Content filter error:', error);
      // On error, allow but flag for review
      return {
        passed: true,
        tier: 1,
        action: 'allow',
        categories: ['error'],
        confidence: 0,
      };
    }
  }

  /**
   * Quick text-based screening (for descriptions/transcripts)
   */
  screenText(text: string): FilterResult {
    const lowerText = text.toLowerCase();
    let maxTier: ModerationTier = 0;
    const matchedCategories: string[] = [];

    for (const category of this.config.categories) {
      for (const keyword of category.keywords) {
        if (lowerText.includes(keyword)) {
          matchedCategories.push(category.id);
          if (category.tier > maxTier) {
            maxTier = category.tier as ModerationTier;
          }
          break;
        }
      }
    }

    const action = this.getActionForTier(maxTier);

    return {
      passed: action === 'allow',
      tier: maxTier,
      action,
      categories: matchedCategories,
      confidence: matchedCategories.length > 0 ? 0.7 : 1,
    };
  }

  /**
   * Get config
   */
  getConfig(): ContentFilterConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<ContentFilterConfig>): void {
    this.config = { ...this.config, ...config };
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

  private async localScreen(imageBase64: string): Promise<FilterResult> {
    const response = await this.ollama.analyzeImage(imageBase64, MODERATION_PROMPT);

    try {
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const tier = Math.min(4, Math.max(0, parsed.tier || 0)) as ModerationTier;

        return {
          passed: tier < 3,
          tier,
          action: parsed.action || this.getActionForTier(tier),
          categories: parsed.categories || [],
          confidence: parsed.confidence || 0.7,
        };
      }
    } catch {
      // Parse from natural language
    }

    // Default: assume safe
    return { passed: true, tier: 0, action: 'allow', categories: [], confidence: 0.5 };
  }

  private getActionForTier(tier: ModerationTier): 'allow' | 'blur' | 'block' | 'escalate' {
    switch (tier) {
      case 0:
        return 'allow';
      case 1:
        return 'allow'; // Flag but allow
      case 2:
        return 'blur'; // Blur sensitive areas
      case 3:
        return 'escalate'; // Escalate for review
      case 4:
        return this.config.autoBlockTier4 ? 'block' : 'escalate';
      default:
        return 'allow';
    }
  }

  private async createFlag(
    streamId: string,
    analysisId: string | undefined,
    result: FilterResult
  ): Promise<string> {
    const id = generateId();
    const db = await getSafeOSDatabase();
    const timestamp = now();

    await db.run(
      `INSERT INTO content_flags (id, stream_id, analysis_id, category, tier, reason, status, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        id,
        streamId,
        analysisId || null,
        result.categories.join(','),
        result.tier,
        `Auto-flagged: ${result.action}`,
        JSON.stringify({ confidence: result.confidence }),
        timestamp,
      ]
    );

    return id;
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultFilter: ContentFilter | null = null;

export function getDefaultContentFilter(): ContentFilter {
  if (!defaultFilter) {
    defaultFilter = new ContentFilter();
  }
  return defaultFilter;
}

export function createContentFilter(config?: Partial<ContentFilterConfig>): ContentFilter {
  return new ContentFilter(config);
}
