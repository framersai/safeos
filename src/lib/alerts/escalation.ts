/**
 * Alert Escalation Manager
 *
 * Manages alert escalation with volume ramping and multi-level alerts.
 *
 * @module lib/alerts/escalation
 */

// =============================================================================
// Types
// =============================================================================

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface EscalationLevel {
  level: number;
  name: string;
  volume: number; // 0-100
  soundFile: string;
  intervalMs: number; // Time before escalating to next level
  requiresAcknowledge: boolean;
  notifyChannels: ('browser' | 'sms' | 'telegram')[];
}

export interface ActiveEscalation {
  alertId: string;
  severity: AlertSeverity;
  startedAt: Date;
  currentLevel: number;
  acknowledged: boolean;
  lastNotifiedAt: Date;
  escalationTimer?: NodeJS.Timeout;
}

// =============================================================================
// Constants
// =============================================================================

export const ESCALATION_LEVELS: EscalationLevel[] = [
  {
    level: 0,
    name: 'Initial',
    volume: 30,
    soundFile: 'alert-soft.mp3',
    intervalMs: 30000, // 30 seconds
    requiresAcknowledge: false,
    notifyChannels: ['browser'],
  },
  {
    level: 1,
    name: 'First Escalation',
    volume: 50,
    soundFile: 'alert-medium.mp3',
    intervalMs: 60000, // 1 minute
    requiresAcknowledge: false,
    notifyChannels: ['browser', 'telegram'],
  },
  {
    level: 2,
    name: 'Second Escalation',
    volume: 70,
    soundFile: 'alert-loud.mp3',
    intervalMs: 120000, // 2 minutes
    requiresAcknowledge: true,
    notifyChannels: ['browser', 'telegram', 'sms'],
  },
  {
    level: 3,
    name: 'Urgent',
    volume: 85,
    soundFile: 'alert-urgent.mp3',
    intervalMs: 180000, // 3 minutes
    requiresAcknowledge: true,
    notifyChannels: ['browser', 'telegram', 'sms'],
  },
  {
    level: 4,
    name: 'Critical',
    volume: 100,
    soundFile: 'alert-critical.mp3',
    intervalMs: 300000, // 5 minutes
    requiresAcknowledge: true,
    notifyChannels: ['browser', 'telegram', 'sms'],
  },
];

// Starting level by severity
const SEVERITY_START_LEVEL: Record<AlertSeverity, number> = {
  info: 0,
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

// =============================================================================
// AlertEscalationManager Class
// =============================================================================

export class AlertEscalationManager {
  private activeEscalations: Map<string, ActiveEscalation> = new Map();
  private onEscalate?: (alertId: string, level: EscalationLevel) => void;
  private onAcknowledge?: (alertId: string) => void;

  constructor(options?: {
    onEscalate?: (alertId: string, level: EscalationLevel) => void;
    onAcknowledge?: (alertId: string) => void;
  }) {
    this.onEscalate = options?.onEscalate;
    this.onAcknowledge = options?.onAcknowledge;
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Start escalation for an alert
   */
  startAlert(alertId: string, severity: AlertSeverity): void {
    // Don't start if already active
    if (this.activeEscalations.has(alertId)) {
      return;
    }

    const startLevel = SEVERITY_START_LEVEL[severity];

    const escalation: ActiveEscalation = {
      alertId,
      severity,
      startedAt: new Date(),
      currentLevel: startLevel,
      acknowledged: false,
      lastNotifiedAt: new Date(),
    };

    this.activeEscalations.set(alertId, escalation);

    // Start escalation timer
    this.scheduleNextEscalation(alertId);

    // Trigger initial callback
    if (this.onEscalate) {
      this.onEscalate(alertId, ESCALATION_LEVELS[startLevel]!);
    }
  }

  /**
   * Acknowledge an alert (stops escalation)
   */
  acknowledgeAlert(alertId: string): boolean {
    const escalation = this.activeEscalations.get(alertId);
    if (!escalation) {
      return false;
    }

    // Clear timer
    if (escalation.escalationTimer) {
      clearTimeout(escalation.escalationTimer);
    }

    escalation.acknowledged = true;
    this.activeEscalations.delete(alertId);

    // Trigger callback
    if (this.onAcknowledge) {
      this.onAcknowledge(alertId);
    }

    return true;
  }

  /**
   * Get current level for an alert
   */
  getCurrentLevel(alertId: string): EscalationLevel | undefined {
    const escalation = this.activeEscalations.get(alertId);
    if (!escalation) return undefined;
    return ESCALATION_LEVELS[escalation.currentLevel];
  }

  /**
   * Get current volume for an alert (0-100)
   */
  getVolume(alertId: string): number {
    const level = this.getCurrentLevel(alertId);
    return level?.volume ?? 0;
  }

  /**
   * Get sound file for an alert
   */
  getSound(alertId: string): string | undefined {
    const level = this.getCurrentLevel(alertId);
    return level?.soundFile;
  }

  /**
   * Check if alert requires acknowledgement
   */
  requiresAcknowledge(alertId: string): boolean {
    const level = this.getCurrentLevel(alertId);
    return level?.requiresAcknowledge ?? false;
  }

  /**
   * Get all active escalations
   */
  getActiveEscalations(): ActiveEscalation[] {
    return Array.from(this.activeEscalations.values());
  }

  /**
   * Get escalation status for an alert
   */
  getEscalationStatus(alertId: string): {
    active: boolean;
    level: number;
    volume: number;
    acknowledged: boolean;
    elapsedMs: number;
  } | null {
    const escalation = this.activeEscalations.get(alertId);
    if (!escalation) return null;

    return {
      active: true,
      level: escalation.currentLevel,
      volume: ESCALATION_LEVELS[escalation.currentLevel]?.volume ?? 0,
      acknowledged: escalation.acknowledged,
      elapsedMs: Date.now() - escalation.startedAt.getTime(),
    };
  }

  /**
   * Clear all escalations
   */
  clearAll(): void {
    for (const [alertId, escalation] of this.activeEscalations) {
      if (escalation.escalationTimer) {
        clearTimeout(escalation.escalationTimer);
      }
    }
    this.activeEscalations.clear();
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private scheduleNextEscalation(alertId: string): void {
    const escalation = this.activeEscalations.get(alertId);
    if (!escalation || escalation.acknowledged) return;

    const currentLevel = ESCALATION_LEVELS[escalation.currentLevel];
    if (!currentLevel) return;

    // Schedule next escalation
    escalation.escalationTimer = setTimeout(() => {
      this.escalate(alertId);
    }, currentLevel.intervalMs);
  }

  private escalate(alertId: string): void {
    const escalation = this.activeEscalations.get(alertId);
    if (!escalation || escalation.acknowledged) return;

    // Move to next level
    const nextLevel = escalation.currentLevel + 1;
    if (nextLevel >= ESCALATION_LEVELS.length) {
      // Already at max level, keep repeating
      this.scheduleNextEscalation(alertId);
      return;
    }

    escalation.currentLevel = nextLevel;
    escalation.lastNotifiedAt = new Date();

    // Trigger callback
    if (this.onEscalate) {
      this.onEscalate(alertId, ESCALATION_LEVELS[nextLevel]!);
    }

    // Schedule next
    this.scheduleNextEscalation(alertId);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get escalation level by index
 */
export function getEscalationLevel(level: number): EscalationLevel | undefined {
  return ESCALATION_LEVELS[level];
}

/**
 * Get starting level for severity
 */
export function getStartingLevel(severity: AlertSeverity): number {
  return SEVERITY_START_LEVEL[severity];
}

/**
 * Calculate volume ramp (gradual increase)
 */
export function calculateVolumeRamp(
  startVolume: number,
  endVolume: number,
  progress: number // 0-1
): number {
  // Ease-in-out curve
  const eased =
    progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  return startVolume + (endVolume - startVolume) * eased;
}
