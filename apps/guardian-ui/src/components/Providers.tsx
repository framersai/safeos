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
import { BackendSettings } from '@/components/BackendSettings';
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
  };

  useEffect(() => {
    const handleOpen = () => setShowBackendSettings(true);

    window.addEventListener('safeos:open-backend-settings', handleOpen);
    return () => window.removeEventListener('safeos:open-backend-settings', handleOpen);
  }, []);

  useEffect(() => {
    if (!showBackendSettings) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowBackendSettings(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showBackendSettings]);

  return (
    <ToastProvider>
      <BackendStatusProvider>
        {/* Status Banner at top of page */}
        <StatusBanner onConfigureClick={handleConfigureClick} />

        {showBackendSettings && (
          <BackendSettings isModal onClose={() => setShowBackendSettings(false)} />
        )}

        {/* Main content */}
        {children}
      </BackendStatusProvider>
    </ToastProvider>
  );
}

export default Providers;
