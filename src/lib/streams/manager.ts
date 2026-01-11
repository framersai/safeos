/**
 * Stream Manager
 *
 * Manages active streams and their lifecycle.
 *
 * @module lib/streams/manager
 */

import { getSafeOSDatabase, generateId, now } from '../../db/index.js';
import type { Stream, MonitoringScenario, MonitoringProfile } from '../../types/index.js';

// =============================================================================
// Types
// =============================================================================

export interface StreamCreateOptions {
  userId?: string;
  scenario: MonitoringScenario;
  profileId?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    screenWidth?: number;
    screenHeight?: number;
  };
}

export interface ActiveStream extends Stream {
  socket?: WebSocket;
  lastPing?: Date;
  frameCount: number;
  alertCount: number;
  profile?: MonitoringProfile;
}

export interface StreamSummary {
  totalActive: number;
  byScenario: Record<MonitoringScenario, number>;
  totalFramesProcessed: number;
  totalAlertsGenerated: number;
}

// =============================================================================
// StreamManager Class
// =============================================================================

export class StreamManager {
  private activeStreams: Map<string, ActiveStream> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private pingIntervalMs = 30000;

  constructor() {
    this.startPingMonitor();
  }

  // ---------------------------------------------------------------------------
  // Stream Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Create and register a new stream
   */
  async createStream(options: StreamCreateOptions): Promise<ActiveStream> {
    const id = generateId();
    const db = await getSafeOSDatabase();
    const timestamp = now();

    // Get profile if specified
    let profile: MonitoringProfile | undefined;
    if (options.profileId) {
      const profileRow = await db.get<MonitoringProfile>(
        'SELECT * FROM monitoring_profiles WHERE id = ?',
        [options.profileId]
      );
      if (profileRow) {
        profile = profileRow;
      }
    }

    // Insert into database
    await db.run(
      `INSERT INTO streams (id, user_id, scenario, status, started_at, created_at)
       VALUES (?, ?, ?, 'active', ?, ?)`,
      [id, options.userId || null, options.scenario, timestamp, timestamp]
    );

    const activeStream: ActiveStream = {
      id,
      userId: options.userId,
      scenario: options.scenario,
      status: 'active',
      startedAt: timestamp,
      createdAt: timestamp,
      endedAt: undefined,
      frameCount: 0,
      alertCount: 0,
      profile,
    };

    this.activeStreams.set(id, activeStream);
    return activeStream;
  }

  /**
   * Get an active stream by ID
   */
  getStream(id: string): ActiveStream | undefined {
    return this.activeStreams.get(id);
  }

  /**
   * Get all active streams
   */
  getActiveStreams(): ActiveStream[] {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Get streams by scenario
   */
  getStreamsByScenario(scenario: MonitoringScenario): ActiveStream[] {
    return this.getActiveStreams().filter((s) => s.scenario === scenario);
  }

  /**
   * Update stream with socket reference
   */
  attachSocket(id: string, socket: WebSocket): boolean {
    const stream = this.activeStreams.get(id);
    if (!stream) return false;

    stream.socket = socket;
    stream.lastPing = new Date();
    return true;
  }

  /**
   * Update last ping time
   */
  updatePing(id: string): void {
    const stream = this.activeStreams.get(id);
    if (stream) {
      stream.lastPing = new Date();
    }
  }

  /**
   * Increment frame count
   */
  incrementFrameCount(id: string): void {
    const stream = this.activeStreams.get(id);
    if (stream) {
      stream.frameCount++;
    }
  }

  /**
   * Increment alert count
   */
  incrementAlertCount(id: string): void {
    const stream = this.activeStreams.get(id);
    if (stream) {
      stream.alertCount++;
    }
  }

  /**
   * End a stream
   */
  async endStream(id: string): Promise<void> {
    const stream = this.activeStreams.get(id);
    if (!stream) return;

    const timestamp = now();
    const db = await getSafeOSDatabase();

    await db.run(
      "UPDATE streams SET status = 'ended', ended_at = ? WHERE id = ?",
      [timestamp, id]
    );

    // Close socket if still open (readyState 1 = OPEN)
    if (stream.socket && stream.socket.readyState === 1) {
      stream.socket.close();
    }

    this.activeStreams.delete(id);
  }

  /**
   * End all streams
   */
  async endAllStreams(): Promise<void> {
    const streamIds = Array.from(this.activeStreams.keys());
    await Promise.all(streamIds.map((id) => this.endStream(id)));
  }

  // ---------------------------------------------------------------------------
  // Stream Stats
  // ---------------------------------------------------------------------------

  /**
   * Get stream count
   */
  getStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Get summary of all streams
   */
  getSummary(): StreamSummary {
    const streams = this.getActiveStreams();

    const byScenario: Record<MonitoringScenario, number> = {
      pet: 0,
      baby: 0,
      elderly: 0,
    };

    let totalFrames = 0;
    let totalAlerts = 0;

    for (const stream of streams) {
      byScenario[stream.scenario]++;
      totalFrames += stream.frameCount;
      totalAlerts += stream.alertCount;
    }

    return {
      totalActive: streams.length,
      byScenario,
      totalFramesProcessed: totalFrames,
      totalAlertsGenerated: totalAlerts,
    };
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private startPingMonitor(): void {
    this.pingInterval = setInterval(() => {
      this.checkStaleStreams();
    }, this.pingIntervalMs);
  }

  private checkStaleStreams(): void {
    const staleThreshold = 2 * this.pingIntervalMs;
    const now = Date.now();

    for (const [id, stream] of this.activeStreams) {
      if (stream.lastPing) {
        const timeSinceLastPing = now - stream.lastPing.getTime();
        if (timeSinceLastPing > staleThreshold) {
          console.log(`Stream ${id} appears stale, marking as ended`);
          this.endStream(id).catch(console.error);
        }
      }
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    await this.endAllStreams();
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultManager: StreamManager | null = null;

export function getDefaultStreamManager(): StreamManager {
  if (!defaultManager) {
    defaultManager = new StreamManager();
  }
  return defaultManager;
}

export function createStreamManager(): StreamManager {
  return new StreamManager();
}
