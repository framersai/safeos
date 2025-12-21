/**
 * Monitoring Store
 *
 * Zustand store for monitoring state.
 *
 * @module stores/monitoring-store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// Types
// =============================================================================

export type MonitoringScenario = 'pet' | 'baby' | 'elderly';

export interface Alert {
  id: string;
  streamId: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface MonitoringState {
  // Connection state
  isConnected: boolean;
  isStreaming: boolean;
  streamId: string | null;
  peerId: string | null;

  // Current readings
  motionScore: number;
  audioLevel: number;
  lastFrameTime: number | null;

  // Alerts
  alerts: Alert[];
  unacknowledgedCount: number;

  // Settings
  scenario: MonitoringScenario;
  motionSensitivity: number;
  audioSensitivity: number;

  // Actions
  setConnected: (connected: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamId: (streamId: string | null) => void;
  setPeerId: (peerId: string | null) => void;
  setMotionScore: (score: number) => void;
  setAudioLevel: (level: number) => void;
  updateLastFrameTime: () => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  setScenario: (scenario: MonitoringScenario) => void;
  setMotionSensitivity: (sensitivity: number) => void;
  setAudioSensitivity: (sensitivity: number) => void;
  reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState = {
  isConnected: false,
  isStreaming: false,
  streamId: null,
  peerId: null,
  motionScore: 0,
  audioLevel: 0,
  lastFrameTime: null,
  alerts: [] as Alert[],
  unacknowledgedCount: 0,
  scenario: 'baby' as MonitoringScenario,
  motionSensitivity: 50,
  audioSensitivity: 50,
};

// =============================================================================
// Store
// =============================================================================

export const useMonitoringStore = create<MonitoringState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setConnected: (connected) => set({ isConnected: connected }),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      setStreamId: (streamId) => set({ streamId }),

      setPeerId: (peerId) => set({ peerId }),

      setMotionScore: (score) => set({ motionScore: score }),

      setAudioLevel: (level) => set({ audioLevel: level }),

      updateLastFrameTime: () => set({ lastFrameTime: Date.now() }),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [alert, ...state.alerts].slice(0, 100), // Keep last 100
          unacknowledgedCount: state.unacknowledgedCount + 1,
        })),

      acknowledgeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, acknowledged: true } : a
          ),
          unacknowledgedCount: Math.max(0, state.unacknowledgedCount - 1),
        })),

      clearAlerts: () => set({ alerts: [], unacknowledgedCount: 0 }),

      setScenario: (scenario) => set({ scenario }),

      setMotionSensitivity: (sensitivity) =>
        set({ motionSensitivity: sensitivity }),

      setAudioSensitivity: (sensitivity) =>
        set({ audioSensitivity: sensitivity }),

      reset: () => set(initialState),
    }),
    {
      name: 'safeos-monitoring',
      partialize: (state) => ({
        scenario: state.scenario,
        motionSensitivity: state.motionSensitivity,
        audioSensitivity: state.audioSensitivity,
      }),
    }
  )
);
