/**
 * Keyboard Shortcuts Provider
 *
 * Wraps the app to provide global keyboard shortcuts functionality.
 * Includes the shortcuts help modal accessible via '?' key.
 *
 * @module components/KeyboardShortcutsProvider
 */

'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import {
  useKeyboardShortcuts,
  useShortcutsHelp,
  type KeyboardShortcut,
} from '../lib/keyboard-shortcuts';
import { useSettingsStore } from '../stores/settings-store';
import { useMonitoringStore } from '../stores/monitoring-store';
import { useSoundManager } from '../lib/sound-manager';

// =============================================================================
// Types
// =============================================================================

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const { isOpen, close } = useShortcutsHelp();

  // Get settings
  const {
    emergencyModeActive,
    activateEmergencyMode,
    deactivateEmergencyMode,
    setActivePreset,
  } = useSettingsStore();

  // Get monitoring state
  const { isStreaming, setStreaming } = useMonitoringStore();

  const { toggleMute, updateVolume, test, volume } = useSoundManager();

  // Build shortcuts with current context
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    // Monitoring
    {
      key: ' ',
      description: 'Pause/Resume monitoring',
      category: 'monitoring',
      action: () => {
        setStreaming(!isStreaming);
      },
    },
    {
      key: 'e',
      description: 'Toggle emergency mode',
      category: 'monitoring',
      action: () => {
        if (emergencyModeActive) {
          deactivateEmergencyMode();
        } else {
          activateEmergencyMode('keyboard-shortcut');
        }
      },
    },
    {
      key: 'f',
      description: 'Toggle fullscreen video',
      category: 'monitoring',
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          const videoContainer = document.querySelector('[data-video-container]');
          if (videoContainer) {
            videoContainer.requestFullscreen();
          }
        }
      },
    },

    // Navigation
    {
      key: 'g',
      modifiers: ['shift'],
      description: 'Go to Dashboard',
      category: 'navigation',
      action: () => router.push('/dashboard'),
    },
    {
      key: 'm',
      modifiers: ['shift'],
      description: 'Go to Monitor',
      category: 'navigation',
      action: () => router.push('/monitor'),
    },
    {
      key: 's',
      modifiers: ['shift'],
      description: 'Go to Settings',
      category: 'navigation',
      action: () => router.push('/settings'),
    },
    {
      key: 'h',
      modifiers: ['shift'],
      description: 'Go to History',
      category: 'navigation',
      action: () => router.push('/history'),
    },

    // Audio
    {
      key: 'm',
      description: 'Toggle mute',
      category: 'audio',
      action: () => {
        toggleMute();
      },
    },
    {
      key: 'ArrowUp',
      modifiers: ['shift'],
      description: 'Volume up',
      category: 'audio',
      action: () => {
        updateVolume(Math.min(100, volume + 10));
      },
    },
    {
      key: 'ArrowDown',
      modifiers: ['shift'],
      description: 'Volume down',
      category: 'audio',
      action: () => {
        updateVolume(Math.max(0, volume - 10));
      },
    },
    {
      key: 't',
      description: 'Test alert sound',
      category: 'audio',
      action: () => {
        test('notification');
      },
    },

    // Settings - Quick presets
    {
      key: '1',
      description: 'Quick preset: Night mode (low)',
      category: 'settings',
      action: () => {
        setActivePreset('night');
      },
    },
    {
      key: '2',
      description: 'Quick preset: Silent mode',
      category: 'settings',
      action: () => {
        setActivePreset('silent');
      },
    },
    {
      key: '3',
      description: 'Quick preset: Maximum alert',
      category: 'settings',
      action: () => {
        setActivePreset('maximum');
      },
    },

    // Settings
    {
      key: ',',
      modifiers: ['ctrl'],
      description: 'Open settings',
      category: 'settings',
      action: () => router.push('/settings'),
    },

    // General
    {
      key: 'Escape',
      description: 'Close modal / Cancel action',
      category: 'general',
      action: () => {
        if (isOpen) {
          close();
        }
        // Could also cancel other modals/actions here
      },
    },
  ], [
    isStreaming,
    setStreaming,
    emergencyModeActive,
    activateEmergencyMode,
    deactivateEmergencyMode,
    router,
    toggleMute,
    updateVolume,
    volume,
    test,
    setActivePreset,
    isOpen,
    close,
  ]);

  // Register all shortcuts
  useKeyboardShortcuts(shortcuts);

  return (
    <>
      {children}
      <KeyboardShortcutsModal isOpen={isOpen} onClose={close} />
    </>
  );
}

export default KeyboardShortcutsProvider;
