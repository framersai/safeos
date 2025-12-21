/**
 * Session Timer
 * 
 * Manages mandatory session timers for monitoring modes.
 * Users must re-arm monitoring at least once every 24 hours.
 * 
 * @module lib/session-timer
 */

// =============================================================================
// Types
// =============================================================================

export interface SessionTimerConfig {
  /** Duration in hours (1-24) */
  durationHours: number;
  /** Warning thresholds in minutes */
  warningThresholds: number[];
  /** Callback when session expires */
  onExpire?: () => void;
  /** Callback for warning notifications */
  onWarning?: (minutesRemaining: number) => void;
  /** Callback for tick updates */
  onTick?: (remainingMs: number) => void;
}

export interface SessionTimerState {
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  expiresAt: number | null;
  remainingMs: number;
  pausedAt: number | null;
  warningsTriggered: number[];
}

export const DEFAULT_SESSION_CONFIG: SessionTimerConfig = {
  durationHours: 24,
  warningThresholds: [60, 15, 5, 1], // Minutes before expiry
};

const MAX_DURATION_HOURS = 24;
const MIN_DURATION_HOURS = 1;
const STORAGE_KEY = 'safeos-session-timer';
const TICK_INTERVAL = 1000; // 1 second

// =============================================================================
// Session Timer Class
// =============================================================================

export class SessionTimer {
  private config: SessionTimerConfig;
  private state: SessionTimerState;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;

  constructor(config: Partial<SessionTimerConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.state = this.loadState() || this.getInitialState();
    
    // Clamp duration
    this.config.durationHours = Math.max(
      MIN_DURATION_HOURS,
      Math.min(MAX_DURATION_HOURS, this.config.durationHours)
    );
  }

  private getInitialState(): SessionTimerState {
    return {
      isActive: false,
      isPaused: false,
      startTime: null,
      expiresAt: null,
      remainingMs: 0,
      pausedAt: null,
      warningsTriggered: [],
    };
  }

  private loadState(): SessionTimerState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const state = JSON.parse(stored) as SessionTimerState;
      
      // Check if session has expired while away
      if (state.expiresAt && Date.now() >= state.expiresAt) {
        return this.getInitialState();
      }
      
      // Recalculate remaining time
      if (state.expiresAt && state.isActive && !state.isPaused) {
        state.remainingMs = Math.max(0, state.expiresAt - Date.now());
      }
      
      return state;
    } catch {
      return null;
    }
  }

  private saveState(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage might be full or unavailable
    }
  }

  private clearState(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Start a new session
   */
  start(durationHours?: number): void {
    if (durationHours !== undefined) {
      this.config.durationHours = Math.max(
        MIN_DURATION_HOURS,
        Math.min(MAX_DURATION_HOURS, durationHours)
      );
    }

    const now = Date.now();
    const durationMs = this.config.durationHours * 60 * 60 * 1000;

    this.state = {
      isActive: true,
      isPaused: false,
      startTime: now,
      expiresAt: now + durationMs,
      remainingMs: durationMs,
      pausedAt: null,
      warningsTriggered: [],
    };

    this.saveState();
    this.startTicking();
    this.setupVisibilityHandler();
  }

  /**
   * Stop the session
   */
  stop(): void {
    this.stopTicking();
    this.removeVisibilityHandler();
    this.state = this.getInitialState();
    this.clearState();
  }

  /**
   * Pause the session (e.g., when tab is hidden)
   */
  pause(): void {
    if (!this.state.isActive || this.state.isPaused) return;

    this.state.isPaused = true;
    this.state.pausedAt = Date.now();
    this.state.remainingMs = Math.max(0, this.state.expiresAt! - Date.now());
    this.stopTicking();
    this.saveState();
  }

  /**
   * Resume the session
   */
  resume(): void {
    if (!this.state.isActive || !this.state.isPaused) return;

    const now = Date.now();
    this.state.isPaused = false;
    this.state.expiresAt = now + this.state.remainingMs;
    this.state.pausedAt = null;
    this.saveState();
    this.startTicking();
  }

  /**
   * Extend the session by additional hours
   */
  extend(additionalHours: number): void {
    if (!this.state.isActive) return;

    const additionalMs = additionalHours * 60 * 60 * 1000;
    const maxDurationMs = MAX_DURATION_HOURS * 60 * 60 * 1000;
    
    // Calculate new expiry, capping at max duration from now
    const now = Date.now();
    const currentRemaining = this.state.expiresAt! - now;
    const newRemaining = Math.min(maxDurationMs, currentRemaining + additionalMs);
    
    this.state.expiresAt = now + newRemaining;
    this.state.remainingMs = newRemaining;
    this.state.warningsTriggered = []; // Reset warnings
    this.saveState();
  }

  /**
   * Get current state
   */
  getState(): SessionTimerState {
    return { ...this.state };
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    if (!this.state.isActive) return false;
    return this.state.remainingMs <= 0;
  }

  /**
   * Get remaining time formatted
   */
  getFormattedRemaining(): string {
    const ms = this.state.remainingMs;
    if (ms <= 0) return '00:00:00';

    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get remaining minutes
   */
  getRemainingMinutes(): number {
    return Math.ceil(this.state.remainingMs / (60 * 1000));
  }

  /**
   * Get remaining hours
   */
  getRemainingHours(): number {
    return Math.ceil(this.state.remainingMs / (60 * 60 * 1000));
  }

  private startTicking(): void {
    if (this.tickInterval) return;

    this.tickInterval = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL);
  }

  private stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private tick(): void {
    if (!this.state.isActive || this.state.isPaused) return;

    const now = Date.now();
    this.state.remainingMs = Math.max(0, this.state.expiresAt! - now);

    // Check for expiry
    if (this.state.remainingMs <= 0) {
      this.state.isActive = false;
      this.stopTicking();
      this.saveState();
      this.config.onExpire?.();
      return;
    }

    // Check for warnings
    const remainingMinutes = this.getRemainingMinutes();
    for (const threshold of this.config.warningThresholds) {
      if (
        remainingMinutes <= threshold &&
        !this.state.warningsTriggered.includes(threshold)
      ) {
        this.state.warningsTriggered.push(threshold);
        this.config.onWarning?.(remainingMinutes);
      }
    }

    // Tick callback
    this.config.onTick?.(this.state.remainingMs);
    
    // Save state periodically (every 10 seconds)
    if (Math.floor(this.state.remainingMs / 1000) % 10 === 0) {
      this.saveState();
    }
  }

  private setupVisibilityHandler(): void {
    if (typeof document === 'undefined') return;

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private removeVisibilityHandler(): void {
    if (typeof document === 'undefined' || !this.visibilityHandler) return;
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.visibilityHandler = null;
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<SessionTimerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopTicking();
    this.removeVisibilityHandler();
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let timerInstance: SessionTimer | null = null;

/**
 * Get or create the singleton session timer
 */
export function getSessionTimer(config?: Partial<SessionTimerConfig>): SessionTimer {
  if (!timerInstance) {
    timerInstance = new SessionTimer(config);
  } else if (config) {
    timerInstance.updateConfig(config);
  }
  return timerInstance;
}

/**
 * Reset the session timer
 */
export function resetSessionTimer(): void {
  if (timerInstance) {
    timerInstance.dispose();
    timerInstance = null;
  }
}

// =============================================================================
// React Hook
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

export interface UseSessionTimerReturn {
  isActive: boolean;
  isPaused: boolean;
  isExpired: boolean;
  remainingMs: number;
  formattedRemaining: string;
  remainingMinutes: number;
  remainingHours: number;
  start: (durationHours?: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  extend: (hours: number) => void;
}

export function useSessionTimer(
  config?: Partial<SessionTimerConfig>
): UseSessionTimerReturn {
  const [state, setState] = useState<SessionTimerState>(() => {
    const timer = getSessionTimer(config);
    return timer.getState();
  });

  useEffect(() => {
    const timer = getSessionTimer(config);
    
    // Update config with callbacks
    timer.updateConfig({
      ...config,
      onTick: (remainingMs) => {
        setState(timer.getState());
        config?.onTick?.(remainingMs);
      },
      onExpire: () => {
        setState(timer.getState());
        config?.onExpire?.();
      },
      onWarning: (minutes) => {
        config?.onWarning?.(minutes);
      },
    });

    // Sync initial state
    setState(timer.getState());

    return () => {
      // Don't dispose on unmount - timer should persist
    };
  }, [config]);

  const start = useCallback((durationHours?: number) => {
    const timer = getSessionTimer();
    timer.start(durationHours);
    setState(timer.getState());
  }, []);

  const stop = useCallback(() => {
    const timer = getSessionTimer();
    timer.stop();
    setState(timer.getState());
  }, []);

  const pause = useCallback(() => {
    const timer = getSessionTimer();
    timer.pause();
    setState(timer.getState());
  }, []);

  const resume = useCallback(() => {
    const timer = getSessionTimer();
    timer.resume();
    setState(timer.getState());
  }, []);

  const extend = useCallback((hours: number) => {
    const timer = getSessionTimer();
    timer.extend(hours);
    setState(timer.getState());
  }, []);

  const timer = getSessionTimer();

  return {
    isActive: state.isActive,
    isPaused: state.isPaused,
    isExpired: timer.isExpired(),
    remainingMs: state.remainingMs,
    formattedRemaining: timer.getFormattedRemaining(),
    remainingMinutes: timer.getRemainingMinutes(),
    remainingHours: timer.getRemainingHours(),
    start,
    stop,
    pause,
    resume,
    extend,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format duration in hours to readable string
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  }
  if (hours === 1) {
    return '1 hour';
  }
  if (hours === 24) {
    return '24 hours (1 day)';
  }
  return `${hours} hours`;
}

/**
 * Get urgency level based on remaining time
 */
export function getUrgencyLevel(remainingMinutes: number): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (remainingMinutes <= 1) return 'critical';
  if (remainingMinutes <= 5) return 'high';
  if (remainingMinutes <= 15) return 'medium';
  if (remainingMinutes <= 60) return 'low';
  return 'none';
}

/**
 * Get urgency color
 */
export function getUrgencyColor(level: ReturnType<typeof getUrgencyLevel>): string {
  switch (level) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'blue';
    default: return 'green';
  }
}

