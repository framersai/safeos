/**
 * Providers Wrapper
 *
 * Client-side provider wrapper for all React contexts.
 * Used in the root layout to provide global state management.
 *
 * @module components/Providers
 */

'use client';

import React, { useEffect, useState } from 'react';
import { BackendStatusProvider } from '@/contexts/BackendStatusContext';
import { StatusBanner } from '@/components/StatusBanner';
import { ToastProvider } from '@/components/Toast';
import { useSettingsStore } from '@/stores/settings-store';
import { getSoundManager } from '@/lib/sound-manager';

// =============================================================================
// Types
// =============================================================================

interface ProvidersProps {
  children: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function Providers({ children }: ProvidersProps) {
  const [showBackendSettings, setShowBackendSettings] = useState(false);

  // Keep SoundManager synced with user settings globally (quiet hours + emergency/mute).
  useEffect(() => {
    const manager = getSoundManager();

    const apply = () => {
      const state = useSettingsStore.getState();
      manager.setUserVolume(state.getEffectiveVolume());
      manager.setGlobalMute(state.globalMute);
      manager.setEmergencyMode(state.emergencyModeActive);
    };

    apply();

    // React to settings changes immediately, and also re-apply periodically so
    // quiet-hours transitions take effect without requiring a settings change.
    const unsubscribe = useSettingsStore.subscribe(apply);
    const interval = window.setInterval(apply, 30_000);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  const handleConfigureClick = () => {
    setShowBackendSettings(true);
    // TODO: Open settings modal or navigate to settings page
    // For now, we'll dispatch a custom event that the settings panel can listen for
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('safeos:open-backend-settings'));
    }
  };

  return (
    <ToastProvider>
      <BackendStatusProvider>
        {/* Status Banner at top of page */}
        <StatusBanner onConfigureClick={handleConfigureClick} />

        {/* Main content */}
        {children}
      </BackendStatusProvider>
    </ToastProvider>
  );
}

export default Providers;
