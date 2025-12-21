/**
 * Alert Escalation Manager
 *
 * Progressive volume ramping and escalation for alerts.
 *
 * @module lib/alerts/escalation
 */

// =============================================================================
// Types
// =============================================================================

export interface EscalationLevel {
  level: number;
  delay: number; // ms from alert creation
  volume: number; // 0-1
  sound: string;
  notifyChannels: string[];
}

export interface AlertEscalation {
  alertId: string;
  streamId: string;
  severity: string;
  startedAt: number;
  currentLevel: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
}

// =============================================================================
// Constants
// =============================================================================

export const ESCALATION_LEVELS: EscalationLevel[] = [
  {
    level: 1,
    delay: 0,
    volume: 0.3,
    sound: 'notification',
    notifyChannels: ['browser'],
  },
  {
    level: 2,
    delay: 30000, // 30 seconds
    volume: 0.5,
    sound: 'alert',
    notifyChannels: ['browser', 'telegram'],
  },
  {
    level: 3,
    delay: 60000, // 1 minute
    volume: 0.7,
    sound: 'warning',
    notifyChannels: ['browser', 'telegram'],
  },
  {
    level: 4,
    delay: 120000, // 2 minutes
    volume: 0.9,
    sound: 'alarm',
    notifyChannels: ['browser', 'telegram', 'sms'],
  },
  {
    level: 5,
    delay: 180000, // 3 minutes
    volume: 1.0,
    sound: 'emergency',
    notifyChannels: ['browser', 'telegram', 'sms'],
  },
];

// Map severity to starting level
const SEVERITY_START_LEVELS: Record<string, number> = {
  info: 1,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

// =============================================================================
// AlertEscalationManager Class
// =============================================================================

export class AlertEscalationManager {
  private activeAlerts: Map<string, AlertEscalation> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start escalation for an alert
   */
  startAlert(
    alertId: string,
    streamId: string,
    severity: string
  ): AlertEscalation {
    const startLevel = SEVERITY_START_LEVELS[severity] || 1;

    const escalation: AlertEscalation = {
      alertId,
      streamId,
      severity,
      startedAt: Date.now(),
      currentLevel: startLevel,
      acknowledged: false,
    };

    this.activeAlerts.set(alertId, escalation);
    this.scheduleNextEscalation(alertId);

    return escalation;
  }

  /**
   * Acknowledge an alert (stops escalation)
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = Date.now();

    // Clear timer
    const timer = this.timers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(alertId);
    }

    return true;
  }

  /**
   * Get current alert level
   */
  getAlertLevel(alertId: string): number {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return 0;

    return this.calculateCurrentLevel(alert);
  }

  /**
   * Get current volume for an alert
   */
  getVolume(alertId: string): number {
    const level = this.getAlertLevel(alertId);
    const levelConfig = ESCALATION_LEVELS.find((l) => l.level === level);
    return levelConfig?.volume || 0.3;
  }

  /**
   * Get current sound for an alert
   */
  getSound(alertId: string): string {
    const level = this.getAlertLevel(alertId);
    const levelConfig = ESCALATION_LEVELS.find((l) => l.level === level);
    return levelConfig?.sound || 'notification';
  }

  /**
   * Get escalation info for an alert
   */
  getEscalation(alertId: string): AlertEscalation | undefined {
    return this.activeAlerts.get(alertId);
  }

  /**
   * Get all active (unacknowledged) alerts
   */
  getActiveAlerts(): AlertEscalation[] {
    return Array.from(this.activeAlerts.values()).filter(
      (a) => !a.acknowledged
    );
  }

  /**
   * Clear an alert (remove from tracking)
   */
  clearAlert(alertId: string): void {
    const timer = this.timers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(alertId);
    }
    this.activeAlerts.delete(alertId);
  }

  /**
   * Clear all alerts
   */
  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.activeAlerts.clear();
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private calculateCurrentLevel(alert: AlertEscalation): number {
    if (alert.acknowledged) return alert.currentLevel;

    const elapsed = Date.now() - alert.startedAt;
    let level = alert.currentLevel;

    for (const escalation of ESCALATION_LEVELS) {
      if (escalation.level > level && elapsed >= escalation.delay) {
        level = escalation.level;
      }
    }

    return Math.min(level, 5);
  }

  private scheduleNextEscalation(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.acknowledged) return;

    const currentLevel = this.calculateCurrentLevel(alert);
    if (currentLevel >= 5) return; // Max level reached

    // Find next level
    const nextLevel = ESCALATION_LEVELS.find((l) => l.level === currentLevel + 1);
    if (!nextLevel) return;

    // Calculate time until next escalation
    const elapsed = Date.now() - alert.startedAt;
    const timeUntilNext = nextLevel.delay - elapsed;

    if (timeUntilNext <= 0) {
      // Already should have escalated
      alert.currentLevel = nextLevel.level;
      this.scheduleNextEscalation(alertId);
    } else {
      // Schedule escalation
      const timer = setTimeout(() => {
        const currentAlert = this.activeAlerts.get(alertId);
        if (currentAlert && !currentAlert.acknowledged) {
          currentAlert.currentLevel = nextLevel.level;
          this.onEscalate(currentAlert, nextLevel);
          this.scheduleNextEscalation(alertId);
        }
      }, timeUntilNext);

      this.timers.set(alertId, timer);
    }
  }

  private onEscalate(alert: AlertEscalation, level: EscalationLevel): void {
    console.log(
      `Alert ${alert.alertId} escalated to level ${level.level} ` +
        `(volume: ${level.volume}, sound: ${level.sound})`
    );

    // Emit escalation event (would integrate with notification manager)
    // notificationManager.notify({...}, level.notifyChannels);
  }
}

// Singleton instance
let escalationManager: AlertEscalationManager | null = null;

export function getEscalationManager(): AlertEscalationManager {
  if (!escalationManager) {
    escalationManager = new AlertEscalationManager();
  }
  return escalationManager;
}

export default AlertEscalationManager;
