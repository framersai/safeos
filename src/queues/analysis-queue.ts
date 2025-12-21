/**
 * Analysis Queue
 *
 * Queue-based system for processing frames with local AI and cloud fallback.
 *
 * @module queues/analysis-queue
 */

import { getSafeOSDatabase, generateId, now } from '../db/index.js';
import { getDefaultOllamaClient } from '../lib/ollama/client.js';
import { getDefaultCloudFallback } from '../lib/analysis/cloud-fallback.js';
import { getDefaultContentFilter } from '../lib/safety/content-filter.js';
import { getDefaultNotificationManager } from '../lib/alerts/notification-manager.js';
import { getProfile } from '../lib/analysis/profiles/index.js';
import type {
  AnalysisJob,
  AnalysisResult,
  ConcernLevel,
  MonitoringScenario,
  Alert,
} from '../types/index.js';

// =============================================================================
// Types
// =============================================================================

export interface QueueConfig {
  maxConcurrency: number;
  maxRetries: number;
  retryDelayMs: number;
  processingTimeoutMs: number;
  priorityBoost: {
    highMotion: number;
    highAudio: number;
    recentConcern: number;
  };
  cloudFallbackThreshold: number; // Concern level to trigger cloud
}

export interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  isRunning: boolean;
}

export interface QueueJob {
  id: string;
  streamId: string;
  scenario: MonitoringScenario;
  frameData: string; // base64
  motionScore: number;
  audioLevel: number;
  priority: number;
  retries: number;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrency: 2,
  maxRetries: 2,
  retryDelayMs: 1000,
  processingTimeoutMs: 60000,
  priorityBoost: {
    highMotion: 5,
    highAudio: 5,
    recentConcern: 10,
  },
  cloudFallbackThreshold: 2, // medium or higher
};

const CONCERN_TO_SEVERITY: Record<ConcernLevel, 'info' | 'low' | 'medium' | 'high' | 'critical'> = {
  none: 'info',
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

// =============================================================================
// AnalysisQueue Class
// =============================================================================

export class AnalysisQueue {
  private config: QueueConfig;
  private queue: QueueJob[] = [];
  private processing: Map<string, QueueJob> = new Map();
  private isRunning = false;
  private processInterval: NodeJS.Timeout | null = null;

  // Dependencies
  private ollama = getDefaultOllamaClient();
  private cloudFallback = getDefaultCloudFallback();
  private contentFilter = getDefaultContentFilter();
  private notificationManager = getDefaultNotificationManager();

  // Stats
  private stats = {
    totalProcessed: 0,
    totalFailed: 0,
    avgProcessingTimeMs: 0,
    cloudFallbacks: 0,
    alertsCreated: 0,
  };

  constructor(config?: Partial<QueueConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Add a job to the queue
   */
  enqueue(job: Omit<QueueJob, 'id' | 'priority' | 'retries' | 'createdAt' | 'status'>): string {
    const id = generateId();
    const priority = this.calculatePriority(job);

    const queueJob: QueueJob = {
      ...job,
      id,
      priority,
      retries: 0,
      createdAt: now(),
      status: 'pending',
    };

    // Insert in priority order
    const insertIndex = this.queue.findIndex((j) => j.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(queueJob);
    } else {
      this.queue.splice(insertIndex, 0, queueJob);
    }

    // Store in database
    this.storeJob(queueJob).catch(console.error);

    return id;
  }

  /**
   * Start processing the queue
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.processInterval = setInterval(() => {
      this.processNext();
    }, 100);
  }

  /**
   * Stop processing
   */
  stop(): void {
    this.isRunning = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Get queue status
   */
  getStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      processing: this.processing.size,
      completed: this.stats.totalProcessed,
      failed: this.stats.totalFailed,
      isRunning: this.isRunning,
    };
  }

  /**
   * Get config
   */
  getConfig(): QueueConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<QueueConfig>): void {
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

  private calculatePriority(job: Omit<QueueJob, 'id' | 'priority' | 'retries' | 'createdAt' | 'status'>): number {
    let priority = 0;

    // High motion boost
    if (job.motionScore > 50) {
      priority += this.config.priorityBoost.highMotion;
    }

    // High audio boost
    if (job.audioLevel > 50) {
      priority += this.config.priorityBoost.highAudio;
    }

    // Baby scenario gets priority
    if (job.scenario === 'baby') {
      priority += 3;
    }

    // Elderly gets medium priority
    if (job.scenario === 'elderly') {
      priority += 2;
    }

    return priority;
  }

  private async processNext(): Promise<void> {
    if (!this.isRunning) return;
    if (this.processing.size >= this.config.maxConcurrency) return;
    if (this.queue.length === 0) return;

    const job = this.queue.shift();
    if (!job) return;

    job.status = 'processing';
    this.processing.set(job.id, job);

    try {
      await this.processJob(job);
      this.stats.totalProcessed++;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await this.handleJobFailure(job, error);
    } finally {
      this.processing.delete(job.id);
    }
  }

  private async processJob(job: QueueJob): Promise<void> {
    const startTime = Date.now();
    const profile = getProfile(job.scenario);

    // First, run content filter
    const filterResult = await this.contentFilter.filter(
      job.frameData,
      job.streamId
    );

    if (filterResult.action === 'block') {
      // Content blocked - don't analyze further
      await this.updateJobStatus(job.id, 'completed');
      return;
    }

    // Run local analysis
    let concernLevel: ConcernLevel = 'none';
    let description = '';
    let issues: string[] = [];
    let isCloudFallback = false;
    let model = '';

    try {
      if (await this.ollama.isHealthy()) {
        // Triage first
        const triageResult = await this.ollama.triage(job.frameData, profile.triagePrompt);

        if (triageResult.needsDetailedAnalysis) {
          // Full analysis
          const analysisResult = await this.ollama.analyze(job.frameData, profile.analysisPrompt);
          concernLevel = analysisResult.concernLevel;
          description = analysisResult.description;
          issues = analysisResult.issues;
          model = 'llava:7b';
        } else {
          concernLevel = triageResult.concernLevel;
          description = triageResult.summary;
          model = 'moondream';
        }
      } else {
        throw new Error('Ollama not available');
      }
    } catch (error) {
      // Fall back to cloud
      if (this.cloudFallback.isAvailable()) {
        const cloudResult = await this.cloudFallback.analyze(job.frameData, job.scenario);
        concernLevel = cloudResult.concernLevel;
        description = cloudResult.description;
        issues = cloudResult.issues;
        isCloudFallback = true;
        model = cloudResult.model;
        this.stats.cloudFallbacks++;
      } else {
        throw error;
      }
    }

    const processingTimeMs = Date.now() - startTime;
    this.updateAvgProcessingTime(processingTimeMs);

    // Store analysis result
    const resultId = await this.storeResult({
      id: generateId(),
      stream_id: job.streamId,
      frame_id: job.id,
      concern_level: concernLevel,
      description,
      detected_issues: issues,
      processing_time_ms: processingTimeMs,
      model_used: model,
      is_cloud_fallback: isCloudFallback,
      created_at: now(),
    });

    // Create alert if needed
    if (concernLevel !== 'none' && concernLevel !== 'low') {
      await this.createAlert(job, concernLevel, description, resultId);
    }

    await this.updateJobStatus(job.id, 'completed');
  }

  private async handleJobFailure(job: QueueJob, error: unknown): Promise<void> {
    job.retries++;

    if (job.retries < this.config.maxRetries) {
      // Re-queue with delay
      job.status = 'pending';
      setTimeout(() => {
        this.queue.unshift(job);
      }, this.config.retryDelayMs);
    } else {
      job.status = 'failed';
      this.stats.totalFailed++;
      await this.updateJobStatus(job.id, 'failed');
    }
  }

  private async createAlert(
    job: QueueJob,
    concernLevel: ConcernLevel,
    description: string,
    analysisId: string
  ): Promise<void> {
    const id = generateId();
    const db = await getSafeOSDatabase();
    const timestamp = now();

    const alert: Alert = {
      id,
      stream_id: job.streamId,
      alert_type: 'analysis',
      severity: CONCERN_TO_SEVERITY[concernLevel],
      message: description,
      metadata: { analysisId, scenario: job.scenario },
      acknowledged: false,
      acknowledged_at: null,
      created_at: timestamp,
    };

    await db.run(
      `INSERT INTO alerts (id, stream_id, alert_type, severity, message, metadata, acknowledged, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        alert.id,
        alert.stream_id,
        alert.alert_type,
        alert.severity,
        alert.message,
        JSON.stringify(alert.metadata),
        alert.created_at,
      ]
    );

    this.stats.alertsCreated++;

    // Send notifications
    await this.notificationManager.processAlert(alert);
  }

  private async storeJob(job: QueueJob): Promise<void> {
    const db = await getSafeOSDatabase();
    await db.run(
      `INSERT INTO analysis_queue (id, stream_id, scenario, priority, status, retries, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [job.id, job.streamId, job.scenario, job.priority, job.status, job.retries, job.createdAt]
    );
  }

  private async updateJobStatus(jobId: string, status: 'completed' | 'failed'): Promise<void> {
    const db = await getSafeOSDatabase();
    await db.run('UPDATE analysis_queue SET status = ? WHERE id = ?', [status, jobId]);
  }

  private async storeResult(result: AnalysisResult): Promise<string> {
    const db = await getSafeOSDatabase();
    await db.run(
      `INSERT INTO analysis_results (id, stream_id, frame_id, concern_level, description, detected_issues, processing_time_ms, model_used, is_cloud_fallback, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.id,
        result.stream_id,
        result.frame_id,
        result.concern_level,
        result.description,
        JSON.stringify(result.detected_issues),
        result.processing_time_ms,
        result.model_used,
        result.is_cloud_fallback ? 1 : 0,
        result.created_at,
      ]
    );
    return result.id;
  }

  private updateAvgProcessingTime(timeMs: number): void {
    const total = this.stats.totalProcessed + 1;
    this.stats.avgProcessingTimeMs =
      (this.stats.avgProcessingTimeMs * this.stats.totalProcessed + timeMs) / total;
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultQueue: AnalysisQueue | null = null;

export function getDefaultAnalysisQueue(): AnalysisQueue {
  if (!defaultQueue) {
    defaultQueue = new AnalysisQueue();
  }
  return defaultQueue;
}

export function createAnalysisQueue(config?: Partial<QueueConfig>): AnalysisQueue {
  return new AnalysisQueue(config);
}
