/**
 * useFeatureGate Hook
 *
 * React hook for checking feature availability based on backend connection status.
 * Provides graceful degradation for features that require backend services.
 *
 * @module hooks/useFeatureGate
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useBackendStatus } from '@/contexts/BackendStatusContext';

// =============================================================================
// Types
// =============================================================================

/** Features that can be gated */
export type GatedFeature =
  // Backend-required features
  | 'semantic-analysis'      // Ollama vision analysis
  | 'account-sync'           // Multi-device sync
  | 'sms-alerts'            // Twilio SMS
  | 'telegram-alerts'       // Telegram notifications
  | 'email-digest'          // Email summaries
  | 'cloud-history'         // Server-side alert history
  | 'multi-device'          // Multiple device support
  // Local-only features (always available)
  | 'camera-streaming'
  | 'motion-detection'
  | 'audio-detection'
  | 'person-detection'
  | 'animal-detection'
  | 'local-alerts'
  | 'web-push'
  | 'browser-vision'        // Transformers.js
  | 'local-history';        // IndexedDB

export interface FeatureGateResult {
  /** Whether the feature is currently available */
  available: boolean;
  /** Reason why the feature is unavailable */
  reason?: string;
  /** Whether the feature requires backend connection */
  requiresBackend: boolean;
  /** Whether there's a local fallback available */
  hasFallback: boolean;
  /** Name of the fallback feature if available */
  fallbackFeature?: string;
}

export interface UseFeatureGateReturn {
  /** Check if a specific feature is available */
  isAvailable: (feature: GatedFeature) => boolean;
  /** Get detailed information about a feature's availability */
  getFeatureGate: (feature: GatedFeature) => FeatureGateResult;
  /** Check multiple features at once */
  checkFeatures: (features: GatedFeature[]) => Record<GatedFeature, FeatureGateResult>;
  /** Whether we're in local-only mode */
  isLocalOnly: boolean;
  /** Whether all backend services are connected */
  isFullyConnected: boolean;
  /** List of currently disabled features */
  disabledFeatures: string[];
}

// =============================================================================
// Feature Configuration
// =============================================================================

interface FeatureConfig {
  requiresBackend: boolean;
  fallbackFeature?: GatedFeature;
  unavailableReason: string;
}

const FEATURE_CONFIG: Record<GatedFeature, FeatureConfig> = {
  // Backend-required features
  'semantic-analysis': {
    requiresBackend: true,
    fallbackFeature: 'browser-vision',
    unavailableReason: 'Semantic analysis requires Ollama (monitoring server). Using browser-based vision instead.',
  },
  'account-sync': {
    requiresBackend: true,
    unavailableReason: 'Account sync requires a monitoring server connection.',
  },
  'sms-alerts': {
    requiresBackend: true,
    fallbackFeature: 'web-push',
    unavailableReason: 'SMS alerts require a monitoring server (and provider credentials). Using browser notifications instead.',
  },
  'telegram-alerts': {
    requiresBackend: true,
    fallbackFeature: 'web-push',
    unavailableReason: 'Telegram alerts require a monitoring server (and bot credentials). Using browser notifications instead.',
  },
  'email-digest': {
    requiresBackend: true,
    unavailableReason: 'Email digests require a monitoring server connection.',
  },
  'cloud-history': {
    requiresBackend: true,
    fallbackFeature: 'local-history',
    unavailableReason: 'Cloud history requires a monitoring server. Using local storage instead.',
  },
  'multi-device': {
    requiresBackend: true,
    unavailableReason: 'Multi-device sync requires a monitoring server connection.',
  },

  // Local-only features (always available)
  'camera-streaming': {
    requiresBackend: false,
    unavailableReason: '',
  },
  'motion-detection': {
    requiresBackend: false,
    unavailableReason: '',
  },
  'audio-detection': {
    requiresBackend: false,
    unavailableReason: '',
  },
  'person-detection': {
    requiresBackend: false,
    unavailableReason: '',
  },
  'animal-detection': {
    requiresBackend: false,
    unavailableReason: '',
  },
  'local-alerts': {
    requiresBackend: false,
    unavailableReason: '',
  },
  'web-push': {
    requiresBackend: false,
    unavailableReason: '',
  },
  'browser-vision': {
    requiresBackend: false,
    unavailableReason: '',
  },
  'local-history': {
    requiresBackend: false,
    unavailableReason: '',
  },
};

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for checking feature availability based on backend connection
 *
 * @example
 * const { isAvailable, getFeatureGate, isLocalOnly } = useFeatureGate();
 *
 * // Simple availability check
 * if (isAvailable('semantic-analysis')) {
 *   // Use Ollama for vision
 * }
 *
 * // Detailed feature gate info
 * const gate = getFeatureGate('sms-alerts');
 * if (!gate.available && gate.hasFallback) {
 *   // Use fallback feature
 *   showNotification(gate.reason);
 * }
 */
export function useFeatureGate(): UseFeatureGateReturn {
  const { status, isLocalOnly, isConnected, isFeatureAvailable } = useBackendStatus();

  /**
   * Check if a specific feature is available
   */
  const isAvailable = useCallback(
    (feature: GatedFeature): boolean => {
      return isFeatureAvailable(feature);
    },
    [isFeatureAvailable]
  );

  /**
   * Get detailed information about a feature's availability
   */
  const getFeatureGate = useCallback(
    (feature: GatedFeature): FeatureGateResult => {
      const config = FEATURE_CONFIG[feature];
      const available = isFeatureAvailable(feature);

      return {
        available,
        reason: available ? undefined : config.unavailableReason,
        requiresBackend: config.requiresBackend,
        hasFallback: !!config.fallbackFeature,
        fallbackFeature: config.fallbackFeature,
      };
    },
    [isFeatureAvailable]
  );

  /**
   * Check multiple features at once
   */
  const checkFeatures = useCallback(
    (features: GatedFeature[]): Record<GatedFeature, FeatureGateResult> => {
      const results = {} as Record<GatedFeature, FeatureGateResult>;

      for (const feature of features) {
        results[feature] = getFeatureGate(feature);
      }

      return results;
    },
    [getFeatureGate]
  );

  /**
   * Memoized disabled features list
   */
  const disabledFeatures = useMemo(
    () => status.disabledFeatures,
    [status.disabledFeatures]
  );

  return {
    isAvailable,
    getFeatureGate,
    checkFeatures,
    isLocalOnly,
    isFullyConnected: isConnected,
    disabledFeatures,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the fallback feature for a given feature
 */
export function getFallbackFeature(feature: GatedFeature): GatedFeature | undefined {
  return FEATURE_CONFIG[feature]?.fallbackFeature;
}

/**
 * Check if a feature requires backend connection
 */
export function requiresBackend(feature: GatedFeature): boolean {
  return FEATURE_CONFIG[feature]?.requiresBackend ?? false;
}

/**
 * Get all features that require backend
 */
export function getBackendRequiredFeatures(): GatedFeature[] {
  return Object.entries(FEATURE_CONFIG)
    .filter(([, config]) => config.requiresBackend)
    .map(([feature]) => feature as GatedFeature);
}

/**
 * Get all features that work locally
 */
export function getLocalFeatures(): GatedFeature[] {
  return Object.entries(FEATURE_CONFIG)
    .filter(([, config]) => !config.requiresBackend)
    .map(([feature]) => feature as GatedFeature);
}

export default useFeatureGate;
