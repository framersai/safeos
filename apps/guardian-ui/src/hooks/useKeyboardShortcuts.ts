/**
 * Keyboard Shortcuts Hook
 *
 * Global keyboard shortcuts for SafeOS Guardian.
 *
 * @module hooks/useKeyboardShortcuts
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useSettingsStore, DEFAULT_PRESETS, PresetId } from '@/stores/settings-store';
import { useMonitoringStore } from '@/stores/monitoring-store';

// =============================================================================
// Types
// =============================================================================

interface ShortcutHandler {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  handler: () => void;
  description: string;
}

interface KeyboardShortcutsOptions {
  /** Enable/disable all shortcuts */
  enabled?: boolean;
  /** Callback when shortcut is triggered (for toast notifications) */
  onShortcutTriggered?: (description: string) => void;
}

// =============================================================================
// Preset Shortcuts Mapping
// =============================================================================

const PRESET_SHORTCUTS: Record<string, PresetId> = {
  '1': 'silent',
  '2': 'night',
  '3': 'maximum',
  '4': 'ultimate',
  '5': 'infant_sleep',
};

// =============================================================================
// Hook
// =============================================================================

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { enabled = true, onShortcutTriggered } = options;

  const {
    setActivePreset,
    toggleGlobalMute,
    globalMute,
    activePresetId,
  } = useSettingsStore();

  const {
    alerts,
    acknowledgeAlert,
  } = useMonitoringStore();

  // Acknowledge current/latest unacknowledged alert
  const acknowledgeCurrentAlert = useCallback(() => {
    const unacknowledged = alerts.filter(a => !a.acknowledged);
    if (unacknowledged.length > 0) {
      acknowledgeAlert(unacknowledged[0].id);
      onShortcutTriggered?.('Alert acknowledged');
    }
  }, [alerts, acknowledgeAlert, onShortcutTriggered]);

  // Toggle mute
  const handleMuteToggle = useCallback(() => {
    toggleGlobalMute();
    onShortcutTriggered?.(globalMute ? 'Sound unmuted' : 'Sound muted');
  }, [toggleGlobalMute, globalMute, onShortcutTriggered]);

  // Switch preset
  const handlePresetSwitch = useCallback((presetId: PresetId) => {
    setActivePreset(presetId);
    const preset = DEFAULT_PRESETS[presetId];
    onShortcutTriggered?.(`Preset: ${preset.name}`);
  }, [setActivePreset, onShortcutTriggered]);

  // Main keyboard handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in an input field
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    // Escape - Close modals/panels (handled by individual components, but we can trigger a custom event)
    if (event.key === 'Escape') {
      // Dispatch custom event for modal close
      window.dispatchEvent(new CustomEvent('safeos:close-modals'));
      return;
    }

    // Space - Acknowledge current alert
    if (event.key === ' ' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      acknowledgeCurrentAlert();
      return;
    }

    // M - Toggle mute
    if (event.key === 'm' || event.key === 'M') {
      event.preventDefault();
      handleMuteToggle();
      return;
    }

    // 1-5 - Quick switch sensitivity presets
    if (PRESET_SHORTCUTS[event.key]) {
      event.preventDefault();
      handlePresetSwitch(PRESET_SHORTCUTS[event.key]);
      return;
    }

    // Ctrl+E / Cmd+E - Emergency mode toggle
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
      event.preventDefault();
      if (activePresetId === 'ultimate') {
        setActivePreset('maximum');
        onShortcutTriggered?.('Emergency mode OFF');
      } else {
        setActivePreset('ultimate');
        onShortcutTriggered?.('Emergency mode ON');
      }
      return;
    }

    // ? or Shift+/ - Show keyboard shortcuts help
    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('safeos:show-shortcuts-help'));
      return;
    }
  }, [
    acknowledgeCurrentAlert,
    handleMuteToggle,
    handlePresetSwitch,
    activePresetId,
    setActivePreset,
    onShortcutTriggered,
  ]);

  // Attach/detach event listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Return shortcut list for help display
  return {
    shortcuts: [
      { key: 'Space', description: 'Acknowledge current alert' },
      { key: 'M', description: 'Toggle mute' },
      { key: '1', description: 'Silent mode' },
      { key: '2', description: 'Night mode' },
      { key: '3', description: 'Maximum alert mode' },
      { key: '4', description: 'Ultimate secure mode' },
      { key: '5', description: 'Infant sleep monitor' },
      { key: 'Ctrl/Cmd + E', description: 'Toggle emergency mode' },
      { key: 'Esc', description: 'Close modals/panels' },
      { key: '?', description: 'Show keyboard shortcuts' },
    ] as const,
  };
}

// =============================================================================
// Helper Hook for Modal Close
// =============================================================================

/**
 * Hook to listen for modal close events from keyboard shortcuts
 */
export function useModalCloseShortcut(onClose: () => void) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('safeos:close-modals', handler);
    return () => window.removeEventListener('safeos:close-modals', handler);
  }, [onClose]);
}

/**
 * Hook to listen for shortcuts help display event
 */
export function useShortcutsHelpTrigger(onShow: () => void) {
  useEffect(() => {
    const handler = () => onShow();
    window.addEventListener('safeos:show-shortcuts-help', handler);
    return () => window.removeEventListener('safeos:show-shortcuts-help', handler);
  }, [onShow]);
}

export default useKeyboardShortcuts;
