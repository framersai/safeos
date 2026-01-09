/**
 * Browser Vision Analyzer
 *
 * Client-side vision analysis using Transformers.js (Xenova).
 * Provides enhanced image classification in the browser as a fallback
 * when Ollama backend is unavailable.
 *
 * Models are cached in IndexedDB after first download for instant loading.
 *
 * @module lib/browser-vision-analyzer
 */

'use client';

import { saveSetting, getSetting } from './client-db';

// =============================================================================
// Dynamic Import for Transformers.js
// =============================================================================

// We use dynamic import to avoid bundling Node.js-specific code
// that breaks static exports for GitHub Pages
let transformersModule: typeof import('@xenova/transformers') | null = null;
let transformersConfigured = false;

async function getTransformers() {
  if (!transformersModule) {
    transformersModule = await import('@xenova/transformers');

    // Configure Transformers.js for browser environment (only once)
    if (!transformersConfigured) {
      transformersModule.env.allowLocalModels = false;
      transformersModule.env.useBrowserCache = true;
      // Force use of onnxruntime-web instead of onnxruntime-node
      transformersModule.env.backends.onnx.wasm.proxy = true;
      transformersConfigured = true;
    }
  }
  return transformersModule;
}

// =============================================================================
// Types
// =============================================================================

export type MonitoringScenario = 'baby' | 'pet' | 'elderly' | 'security' | 'general';

export type ConcernLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ClassificationResult {
  label: string;
  score: number;
}

export interface VisionAnalysisResult {
  concernLevel: ConcernLevel;
  labels: ClassificationResult[];
  confidence: number;
  reasoning: string;
  suggestedAction?: string;
  timestamp: number;
}

export interface ModelProgress {
  status: 'idle' | 'downloading' | 'loading' | 'ready' | 'error';
  progress: number; // 0-100
  downloadedMB: number;
  totalMB: number;
  modelName: string;
  error?: string;
}

export interface BrowserVisionConfig {
  modelId: string;
  topK: number;
  scenario: MonitoringScenario;
  confidenceThreshold: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MODEL = 'Xenova/vit-base-patch16-224';
const MODEL_SIZE_MB = 89; // Approximate size for vit-base

const DEFAULT_CONFIG: BrowserVisionConfig = {
  modelId: DEFAULT_MODEL,
  topK: 10,
  scenario: 'general',
  confidenceThreshold: 0.3,
};

// Labels that indicate high concern by scenario
const CONCERN_LABELS: Record<MonitoringScenario, {
  critical: string[];
  high: string[];
  medium: string[];
  low: string[];
}> = {
  baby: {
    critical: [
      'crying', 'distressed', 'choking', 'falling', 'drowning',
      'knife', 'scissors', 'medication', 'pills', 'fire', 'flame',
    ],
    high: [
      'standing', 'climbing', 'stairs', 'edge', 'cord', 'wire',
      'plastic bag', 'small object', 'button', 'battery', 'coin',
    ],
    medium: [
      'awake', 'moving', 'crawling', 'walking', 'active',
    ],
    low: [
      'sleeping', 'lying', 'calm', 'peaceful', 'resting',
    ],
  },
  pet: {
    critical: [
      'injured', 'choking', 'bleeding', 'poison', 'toxic',
      'snake', 'scorpion', 'wild animal', 'predator',
    ],
    high: [
      'aggressive', 'fighting', 'barking', 'distressed', 'stuck',
      'escaped', 'outside', 'traffic', 'road', 'car',
    ],
    medium: [
      'playing', 'running', 'jumping', 'eating', 'drinking',
    ],
    low: [
      'sleeping', 'resting', 'calm', 'relaxed', 'sitting', 'lying down',
    ],
  },
  elderly: {
    critical: [
      'fallen', 'fall', 'collapsed', 'unconscious', 'injured',
      'fire', 'smoke', 'gas', 'flood', 'emergency',
    ],
    high: [
      'struggling', 'unsteady', 'dizzy', 'disoriented', 'confused',
      'stairs', 'wet floor', 'obstacle', 'dark',
    ],
    medium: [
      'walking', 'moving', 'standing', 'cooking', 'active',
    ],
    low: [
      'sitting', 'resting', 'reading', 'watching TV', 'eating',
    ],
  },
  security: {
    critical: [
      'intruder', 'break-in', 'burglar', 'weapon', 'gun', 'knife',
      'fire', 'smoke', 'flood', 'damage',
    ],
    high: [
      'unknown person', 'stranger', 'suspicious', 'lurking',
      'package', 'delivery', 'vehicle', 'unfamiliar',
    ],
    medium: [
      'person', 'human', 'movement', 'activity', 'visitor',
    ],
    low: [
      'empty', 'clear', 'normal', 'expected', 'familiar',
    ],
  },
  general: {
    critical: [
      'fire', 'smoke', 'flood', 'emergency', 'danger', 'accident',
    ],
    high: [
      'alert', 'warning', 'unusual', 'unexpected', 'suspicious',
    ],
    medium: [
      'activity', 'movement', 'presence', 'change',
    ],
    low: [
      'normal', 'expected', 'empty', 'clear', 'quiet',
    ],
  },
};

// Action suggestions by concern level
const SUGGESTED_ACTIONS: Record<ConcernLevel, string> = {
  critical: 'Immediate attention required! Check camera feed now.',
  high: 'Potential concern detected. Review camera feed soon.',
  medium: 'Activity detected. Monitor as needed.',
  low: 'Normal conditions. No action required.',
  none: 'All clear. No concerns detected.',
};

// =============================================================================
// Browser Vision Analyzer Class
// =============================================================================

// Image classification pipeline type (more permissive than base Pipeline)
type ImageClassifier = (
  input: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData | string,
  options?: { topk?: number }
) => Promise<ClassificationResult[]>;

class BrowserVisionAnalyzer {
  private classifier: ImageClassifier | null = null;
  private config: BrowserVisionConfig = DEFAULT_CONFIG;
  private modelProgress: ModelProgress = {
    status: 'idle',
    progress: 0,
    downloadedMB: 0,
    totalMB: MODEL_SIZE_MB,
    modelName: DEFAULT_MODEL,
  };
  private progressListeners: Set<(progress: ModelProgress) => void> = new Set();
  private initialized = false;

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async initialize(onProgress?: (progress: ModelProgress) => void): Promise<void> {
    if (this.initialized && this.classifier) {
      console.log('[BrowserVision] Already initialized');
      return;
    }

    if (typeof window === 'undefined') {
      throw new Error('BrowserVisionAnalyzer requires browser environment');
    }

    // Load saved config
    const savedConfig = await getSetting<BrowserVisionConfig>('browser_vision_config');
    if (savedConfig) {
      this.config = { ...DEFAULT_CONFIG, ...savedConfig };
    }

    // Register progress listener
    if (onProgress) {
      this.progressListeners.add(onProgress);
    }

    try {
      this.updateProgress({ status: 'downloading', progress: 0 });

      // Dynamically import Transformers.js to avoid Node.js code in static build
      const { pipeline } = await getTransformers();

      this.classifier = await pipeline(
        'image-classification',
        this.config.modelId,
        {
          progress_callback: (data: { progress?: number; loaded?: number; total?: number }) => {
            const progress = data.progress ?? (data.loaded && data.total ? (data.loaded / data.total) * 100 : 0);
            const downloadedMB = data.loaded ? data.loaded / (1024 * 1024) : 0;
            const totalMB = data.total ? data.total / (1024 * 1024) : MODEL_SIZE_MB;

            this.updateProgress({
              status: 'downloading',
              progress: Math.round(progress),
              downloadedMB: Math.round(downloadedMB * 10) / 10,
              totalMB: Math.round(totalMB * 10) / 10,
            });
          },
        }
      ) as unknown as ImageClassifier;

      this.updateProgress({ status: 'ready', progress: 100 });
      this.initialized = true;
      console.log('[BrowserVision] Initialized successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.updateProgress({ status: 'error', error: errorMsg });
      throw error;
    } finally {
      // Clean up progress listener
      if (onProgress) {
        this.progressListeners.delete(onProgress);
      }
    }
  }

  isReady(): boolean {
    return this.initialized && this.classifier !== null;
  }

  getProgress(): ModelProgress {
    return { ...this.modelProgress };
  }

  // ---------------------------------------------------------------------------
  // Analysis
  // ---------------------------------------------------------------------------

  async analyzeImage(
    imageSource: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData | string,
    scenario?: MonitoringScenario
  ): Promise<VisionAnalysisResult> {
    if (!this.classifier) {
      throw new Error('Analyzer not initialized. Call initialize() first.');
    }

    const activeScenario = scenario || this.config.scenario;

    try {
      // Run classification
      const results = await this.classifier(imageSource, {
        topk: this.config.topK,
      }) as ClassificationResult[];

      // Map to concern level
      const { concernLevel, reasoning, matchedLabels } = this.assessConcern(results, activeScenario);

      return {
        concernLevel,
        labels: results,
        confidence: results[0]?.score || 0,
        reasoning,
        suggestedAction: SUGGESTED_ACTIONS[concernLevel],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[BrowserVision] Analysis error:', error);
      throw error;
    }
  }

  async analyzeVideoFrame(
    video: HTMLVideoElement,
    scenario?: MonitoringScenario
  ): Promise<VisionAnalysisResult> {
    // Create canvas from video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return this.analyzeImage(canvas, scenario);
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  async setScenario(scenario: MonitoringScenario): Promise<void> {
    this.config.scenario = scenario;
    await saveSetting('browser_vision_config', this.config);
  }

  getScenario(): MonitoringScenario {
    return this.config.scenario;
  }

  async updateConfig(updates: Partial<BrowserVisionConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await saveSetting('browser_vision_config', this.config);
  }

  getConfig(): BrowserVisionConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Progress Events
  // ---------------------------------------------------------------------------

  onProgress(callback: (progress: ModelProgress) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  private updateProgress(updates: Partial<ModelProgress>): void {
    this.modelProgress = { ...this.modelProgress, ...updates };
    this.progressListeners.forEach((cb) => {
      try {
        cb(this.modelProgress);
      } catch (error) {
        console.error('[BrowserVision] Progress listener error:', error);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Concern Assessment
  // ---------------------------------------------------------------------------

  private assessConcern(
    results: ClassificationResult[],
    scenario: MonitoringScenario
  ): {
    concernLevel: ConcernLevel;
    reasoning: string;
    matchedLabels: string[];
  } {
    const concernLabels = CONCERN_LABELS[scenario];
    const matchedLabels: string[] = [];
    let highestConcern: ConcernLevel = 'none';
    let reasoning = 'No significant patterns detected.';

    for (const result of results) {
      if (result.score < this.config.confidenceThreshold) continue;

      const labelLower = result.label.toLowerCase();

      // Check each concern level
      for (const criticalLabel of concernLabels.critical) {
        if (labelLower.includes(criticalLabel.toLowerCase())) {
          matchedLabels.push(result.label);
          if (this.compareConcern('critical', highestConcern) > 0) {
            highestConcern = 'critical';
            reasoning = `Critical concern: "${result.label}" detected with ${Math.round(result.score * 100)}% confidence.`;
          }
        }
      }

      for (const highLabel of concernLabels.high) {
        if (labelLower.includes(highLabel.toLowerCase())) {
          matchedLabels.push(result.label);
          if (this.compareConcern('high', highestConcern) > 0) {
            highestConcern = 'high';
            reasoning = `High concern: "${result.label}" detected with ${Math.round(result.score * 100)}% confidence.`;
          }
        }
      }

      for (const mediumLabel of concernLabels.medium) {
        if (labelLower.includes(mediumLabel.toLowerCase())) {
          matchedLabels.push(result.label);
          if (this.compareConcern('medium', highestConcern) > 0) {
            highestConcern = 'medium';
            reasoning = `Activity detected: "${result.label}" with ${Math.round(result.score * 100)}% confidence.`;
          }
        }
      }

      for (const lowLabel of concernLabels.low) {
        if (labelLower.includes(lowLabel.toLowerCase())) {
          matchedLabels.push(result.label);
          if (this.compareConcern('low', highestConcern) > 0) {
            highestConcern = 'low';
            reasoning = `Normal: "${result.label}" detected with ${Math.round(result.score * 100)}% confidence.`;
          }
        }
      }
    }

    return { concernLevel: highestConcern, reasoning, matchedLabels };
  }

  private compareConcern(a: ConcernLevel, b: ConcernLevel): number {
    const order: Record<ConcernLevel, number> = {
      none: 0,
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    return order[a] - order[b];
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  async dispose(): Promise<void> {
    if (this.classifier) {
      // Transformers.js doesn't have explicit dispose, but we can clear reference
      this.classifier = null;
    }
    this.initialized = false;
    this.progressListeners.clear();
    this.updateProgress({ status: 'idle', progress: 0 });
    console.log('[BrowserVision] Disposed');
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const browserVisionAnalyzer = new BrowserVisionAnalyzer();

// =============================================================================
// React Hook
// =============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';

export interface UseBrowserVisionReturn {
  isReady: boolean;
  isLoading: boolean;
  progress: ModelProgress;
  error: string | null;
  initialize: () => Promise<void>;
  analyzeImage: (source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement) => Promise<VisionAnalysisResult | null>;
  analyzeVideoFrame: (video: HTMLVideoElement) => Promise<VisionAnalysisResult | null>;
  setScenario: (scenario: MonitoringScenario) => Promise<void>;
  scenario: MonitoringScenario;
  dispose: () => Promise<void>;
}

export function useBrowserVision(autoInitialize = false): UseBrowserVisionReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ModelProgress>(browserVisionAnalyzer.getProgress());
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenarioState] = useState<MonitoringScenario>('general');
  const initializingRef = useRef(false);

  useEffect(() => {
    // Subscribe to progress updates
    const unsubscribe = browserVisionAnalyzer.onProgress(setProgress);

    // Check if already ready
    if (browserVisionAnalyzer.isReady()) {
      setIsReady(true);
      setScenarioState(browserVisionAnalyzer.getScenario());
    } else if (autoInitialize && !initializingRef.current) {
      initializingRef.current = true;
      browserVisionAnalyzer.initialize().then(() => {
        setIsReady(true);
        setScenarioState(browserVisionAnalyzer.getScenario());
        initializingRef.current = false;
      }).catch((err) => {
        setError(err.message);
        initializingRef.current = false;
      });
    }

    return () => {
      unsubscribe();
    };
  }, [autoInitialize]);

  const initialize = useCallback(async () => {
    if (isLoading || isReady) return;

    setIsLoading(true);
    setError(null);

    try {
      await browserVisionAnalyzer.initialize((p) => setProgress(p));
      setIsReady(true);
      setScenarioState(browserVisionAnalyzer.getScenario());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize vision analyzer';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isReady]);

  const analyzeImage = useCallback(
    async (source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement): Promise<VisionAnalysisResult | null> => {
      if (!isReady) {
        console.warn('[useBrowserVision] Not ready. Call initialize() first.');
        return null;
      }

      try {
        return await browserVisionAnalyzer.analyzeImage(source);
      } catch (err) {
        console.error('[useBrowserVision] Analysis error:', err);
        return null;
      }
    },
    [isReady]
  );

  const analyzeVideoFrame = useCallback(
    async (video: HTMLVideoElement): Promise<VisionAnalysisResult | null> => {
      if (!isReady) {
        console.warn('[useBrowserVision] Not ready. Call initialize() first.');
        return null;
      }

      try {
        return await browserVisionAnalyzer.analyzeVideoFrame(video);
      } catch (err) {
        console.error('[useBrowserVision] Analysis error:', err);
        return null;
      }
    },
    [isReady]
  );

  const setScenario = useCallback(async (newScenario: MonitoringScenario) => {
    await browserVisionAnalyzer.setScenario(newScenario);
    setScenarioState(newScenario);
  }, []);

  const dispose = useCallback(async () => {
    await browserVisionAnalyzer.dispose();
    setIsReady(false);
    setProgress(browserVisionAnalyzer.getProgress());
  }, []);

  return {
    isReady,
    isLoading,
    progress,
    error,
    initialize,
    analyzeImage,
    analyzeVideoFrame,
    setScenario,
    scenario,
    dispose,
  };
}

// =============================================================================
// Fallback Chain Helper
// =============================================================================

export interface VisionFallbackChain {
  /** Try Ollama backend first (if configured) */
  tryBackend: (imageData: string) => Promise<VisionAnalysisResult | null>;
  /** Fall back to browser Transformers.js */
  tryBrowser: (source: HTMLCanvasElement | HTMLVideoElement) => Promise<VisionAnalysisResult | null>;
  /** Fall back to basic TensorFlow.js COCO-SSD + heuristics */
  tryBasic: (detections: any[]) => VisionAnalysisResult;
}

/**
 * Create a fallback chain for vision analysis
 * Priority: Backend Ollama > Browser Transformers.js > Basic COCO-SSD heuristics
 */
export function createVisionFallbackChain(
  backendUrl?: string,
  scenario: MonitoringScenario = 'general'
): VisionFallbackChain {
  return {
    tryBackend: async (imageData: string): Promise<VisionAnalysisResult | null> => {
      if (!backendUrl) return null;

      try {
        const response = await fetch(`${backendUrl}/api/vision/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData, scenario }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        return {
          concernLevel: data.concernLevel || 'none',
          labels: data.labels || [],
          confidence: data.confidence || 0,
          reasoning: data.reasoning || 'Backend analysis complete.',
          suggestedAction: data.suggestedAction,
          timestamp: Date.now(),
        };
      } catch {
        return null;
      }
    },

    tryBrowser: async (source: HTMLCanvasElement | HTMLVideoElement): Promise<VisionAnalysisResult | null> => {
      if (!browserVisionAnalyzer.isReady()) {
        await browserVisionAnalyzer.initialize();
      }

      try {
        return await browserVisionAnalyzer.analyzeImage(source, scenario);
      } catch {
        return null;
      }
    },

    tryBasic: (detections: any[]): VisionAnalysisResult => {
      // Basic heuristics based on COCO-SSD detections
      const hasPersons = detections.some((d) => d.class === 'person');
      const hasAnimals = detections.some((d) =>
        ['dog', 'cat', 'bird', 'horse', 'sheep', 'cow', 'bear'].includes(d.class)
      );
      const hasVehicles = detections.some((d) =>
        ['car', 'truck', 'bus', 'motorcycle', 'bicycle'].includes(d.class)
      );

      let concernLevel: ConcernLevel = 'none';
      let reasoning = 'No objects detected.';

      if (detections.length > 0) {
        concernLevel = 'low';
        reasoning = `Detected: ${detections.map((d) => d.class).join(', ')}`;

        if (hasPersons && scenario === 'security') {
          concernLevel = 'medium';
          reasoning = `Person detected in security mode.`;
        }

        if (hasAnimals && scenario === 'pet') {
          concernLevel = 'low';
          reasoning = `Pet activity detected.`;
        }
      }

      return {
        concernLevel,
        labels: detections.map((d) => ({ label: d.class, score: d.score })),
        confidence: detections[0]?.score || 0,
        reasoning,
        suggestedAction: SUGGESTED_ACTIONS[concernLevel],
        timestamp: Date.now(),
      };
    },
  };
}

export default browserVisionAnalyzer;
