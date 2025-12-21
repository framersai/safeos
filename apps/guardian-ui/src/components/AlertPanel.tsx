/**
 * Alert Panel Component
 *
 * Displays active alerts with escalation management.
 *
 * @module components/AlertPanel
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';
import { useMonitoringStore, type Alert } from '../stores/monitoring-store';

// =============================================================================
// Types
// =============================================================================

// Re-export for backwards compatibility
export type { Alert };

interface AlertPanelProps {
  alerts?: Alert[];
  onAcknowledge?: (alertId: string) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ESCALATION_LEVELS = [
  { level: 1, delay: 0, volume: 0.3, sound: 'notification' },
  { level: 2, delay: 30000, volume: 0.5, sound: 'alert' },
  { level: 3, delay: 60000, volume: 0.7, sound: 'warning' },
  { level: 4, delay: 120000, volume: 0.9, sound: 'alarm' },
  { level: 5, delay: 180000, volume: 1.0, sound: 'emergency' },
];

const SEVERITY_COLORS = {
  info: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  low: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  high: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
  critical: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
};

const SEVERITY_ICONS = {
  info: 'ℹ️',
  low: '📢',
  medium: '⚠️',
  high: '🚨',
  critical: '🆘',
};

// =============================================================================
// AlertPanel Component
// =============================================================================

export function AlertPanel({ alerts: propAlerts, onAcknowledge }: AlertPanelProps) {
  const storeAlerts = useMonitoringStore((state) => state.alerts);
  const removeAlert = useMonitoringStore((state) => state.removeAlert);
  
  const alerts = propAlerts || storeAlerts || [];
  const [escalationLevels, setEscalationLevels] = useState<Map<string, number>>(new Map());
  const [muted, setMuted] = useState(false);
  const soundsRef = useRef<Map<string, Howl>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize sounds
  useEffect(() => {
    // Pre-load sounds (using placeholder URLs - replace with actual sound files)
    const soundUrls = {
      notification: '/sounds/notification.mp3',
      alert: '/sounds/alert.mp3',
      warning: '/sounds/warning.mp3',
      alarm: '/sounds/alarm.mp3',
      emergency: '/sounds/emergency.mp3',
    };

    Object.entries(soundUrls).forEach(([name, url]) => {
      soundsRef.current.set(
        name,
        new Howl({
          src: [url],
          volume: 0.5,
          preload: true,
          html5: true,
        })
      );
    });

    return () => {
      // Cleanup sounds
      soundsRef.current.forEach((sound) => sound.unload());
      soundsRef.current.clear();
      // Cleanup timers
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  // Handle escalation for unacknowledged alerts
  useEffect(() => {
    const unacknowledged = alerts.filter((a) => !a.acknowledged);

    unacknowledged.forEach((alert) => {
      const currentLevel = escalationLevels.get(alert.id) || 1;
      const alertTime = alert.createdAt || alert.timestamp || new Date().toISOString();
      const alertAge = Date.now() - new Date(alertTime).getTime();

      // Find current escalation level based on age
      let newLevel = 1;
      for (const esc of ESCALATION_LEVELS) {
        if (alertAge >= esc.delay) {
          newLevel = esc.level;
        }
      }

      // Update level if changed
      if (newLevel !== currentLevel) {
        setEscalationLevels((prev) => new Map(prev).set(alert.id, newLevel));

        // Play sound if not muted
        if (!muted) {
          const escConfig = ESCALATION_LEVELS.find((e) => e.level === newLevel);
          if (escConfig) {
            const sound = soundsRef.current.get(escConfig.sound);
            if (sound) {
              sound.volume(escConfig.volume);
              sound.play();
            }
          }
        }
      }

      // Set timer for next escalation
      const nextLevel = ESCALATION_LEVELS.find((e) => e.level === newLevel + 1);
      if (nextLevel) {
        const timeToNext = nextLevel.delay - alertAge;
        if (timeToNext > 0) {
          const existingTimer = timersRef.current.get(alert.id);
          if (existingTimer) clearTimeout(existingTimer);

          const timer = setTimeout(() => {
            setEscalationLevels((prev) =>
              new Map(prev).set(alert.id, nextLevel.level)
            );
          }, timeToNext);

          timersRef.current.set(alert.id, timer);
        }
      }
    });
  }, [alerts, escalationLevels, muted]);

  // Handle acknowledge
  const handleAcknowledge = useCallback(
    async (alertId: string) => {
      try {
        // Clear escalation timer
        const timer = timersRef.current.get(alertId);
        if (timer) clearTimeout(timer);
        timersRef.current.delete(alertId);
        setEscalationLevels((prev) => {
          const next = new Map(prev);
          next.delete(alertId);
          return next;
        });

        // Call API to acknowledge
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/alerts/${alertId}/acknowledge`,
          { method: 'POST' }
        );

        // Update store or call callback
        if (onAcknowledge) {
          onAcknowledge(alertId);
        } else {
          removeAlert(alertId);
        }
      } catch (error) {
        console.error('Failed to acknowledge alert:', error);
      }
    },
    [onAcknowledge, removeAlert]
  );

  // Toggle mute
  const toggleMute = () => {
    setMuted(!muted);
    // Stop all playing sounds when muting
    if (!muted) {
      soundsRef.current.forEach((sound) => sound.stop());
    }
  };

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span>🔔</span>
          Alerts
          {unacknowledgedAlerts.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
              {unacknowledgedAlerts.length}
            </span>
          )}
        </h3>
        <button
          onClick={toggleMute}
          className={`p-2 rounded-lg transition-colors ${
            muted
              ? 'bg-red-500/20 text-red-400'
              : 'bg-slate-700/50 text-slate-400 hover:text-white'
          }`}
          title={muted ? 'Unmute alerts' : 'Mute alerts'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-slate-700/50">
            {/* Unacknowledged alerts */}
            {unacknowledgedAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                escalationLevel={escalationLevels.get(alert.id) || 1}
                onAcknowledge={handleAcknowledge}
              />
            ))}

            {/* Acknowledged alerts (collapsed) */}
            {acknowledgedAlerts.length > 0 && (
              <AcknowledgedSection alerts={acknowledgedAlerts} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface AlertCardProps {
  alert: Alert;
  escalationLevel: number;
  onAcknowledge: (id: string) => void;
}

function AlertCard({ alert, escalationLevel, onAcknowledge }: AlertCardProps) {
  const colors = SEVERITY_COLORS[alert.severity];
  const icon = SEVERITY_ICONS[alert.severity];
  const alertTime = alert.createdAt || alert.timestamp || new Date().toISOString();
  const timeAgo = getTimeAgo(alertTime);

  // Escalation indicator
  const escalationColor =
    escalationLevel >= 4
      ? 'bg-red-500 animate-pulse'
      : escalationLevel >= 3
        ? 'bg-orange-500'
        : escalationLevel >= 2
          ? 'bg-yellow-500'
          : 'bg-emerald-500';

  return (
    <div className={`p-4 ${colors.bg} relative`}>
      {/* Escalation indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${escalationColor}`}
      />

      <div className="flex gap-3">
        {/* Thumbnail */}
        {alert.thumbnailUrl && (
          <div className="w-16 h-16 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
            <img
              src={alert.thumbnailUrl}
              alt="Alert thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <span className={`text-sm font-medium ${colors.text} capitalize`}>
                {alert.severity}
              </span>
            </div>
            <span className="text-xs text-slate-500">{timeAgo}</span>
          </div>

          <p className="text-sm text-white mt-1 line-clamp-2">{alert.message}</p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              Level {escalationLevel}
            </span>
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium hover:bg-emerald-500/30 transition-colors"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AcknowledgedSectionProps {
  alerts: Alert[];
}

function AcknowledgedSection({ alerts }: AcknowledgedSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-700/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-slate-400 hover:text-white transition-colors"
      >
        <span className="text-sm">
          {alerts.length} acknowledged alert{alerts.length !== 1 ? 's' : ''}
        </span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="divide-y divide-slate-700/30">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="p-3 opacity-60">
              <div className="flex items-center gap-2 text-sm">
                <span>{SEVERITY_ICONS[alert.severity]}</span>
                <span className="text-slate-300 truncate">{alert.message}</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {getTimeAgo(alert.createdAt || alert.timestamp || new Date().toISOString())}
                </span>
              </div>
            </div>
          ))}
          {alerts.length > 5 && (
            <div className="p-3 text-center text-xs text-slate-500">
              + {alerts.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
        <span className="text-2xl opacity-50">✓</span>
      </div>
      <p className="text-slate-400 text-sm">No active alerts</p>
      <p className="text-slate-500 text-xs mt-1">
        Monitoring is running normally
      </p>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getTimeAgo(timestamp: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000
  );

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default AlertPanel;
