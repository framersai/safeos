/**
 * Keyboard Shortcuts Hook
 *
 * Global keyboard shortcuts for power users.
 *
 * @module hooks/useKeyboardShortcuts
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// =============================================================================
// Types
// =============================================================================

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

// =============================================================================
// Shortcuts
// =============================================================================

export function useKeyboardShortcuts() {
  const router = useRouter();

  const shortcuts: ShortcutHandler[] = [
    // Navigation
    { key: 'h', meta: true, description: 'Go to Home', action: () => router.push('/') },
    { key: 'm', meta: true, description: 'Go to Monitor', action: () => router.push('/monitor') },
    { key: 's', meta: true, shift: true, description: 'Go to Settings', action: () => router.push('/settings') },
    { key: 'a', meta: true, description: 'Go to Alerts/History', action: () => router.push('/history') },
    { key: 'p', meta: true, description: 'Go to Profiles', action: () => router.push('/profiles') },
    
    // Actions
    { key: 'n', meta: true, description: 'New Stream', action: () => router.push('/monitor') },
    { key: '/', meta: true, description: 'Show Help', action: () => router.push('/help') },
    { key: 'Escape', description: 'Close Modal / Cancel', action: () => document.dispatchEvent(new CustomEvent('escape-pressed')) },
    
    // Quick actions
    { key: '1', alt: true, description: 'Quick: Pet Mode', action: () => console.log('Pet mode') },
    { key: '2', alt: true, description: 'Quick: Baby Mode', action: () => console.log('Baby mode') },
    { key: '3', alt: true, description: 'Quick: Elderly Mode', action: () => console.log('Elderly mode') },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey || shortcut.meta;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const metaMatch = shortcut.meta ? (event.metaKey || event.ctrlKey) : true;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [router, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}

// =============================================================================
// Shortcut Display Component
// =============================================================================

export function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="px-2 py-1 text-xs font-mono bg-slate-700 border border-slate-600 rounded text-slate-300">
      {children}
    </kbd>
  );
}

export function ShortcutList() {
  const { shortcuts } = useKeyboardShortcuts();

  return (
    <div className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <span className="text-slate-300">{shortcut.description}</span>
          <div className="flex items-center gap-1">
            {shortcut.meta && <ShortcutKey>⌘</ShortcutKey>}
            {shortcut.ctrl && <ShortcutKey>Ctrl</ShortcutKey>}
            {shortcut.shift && <ShortcutKey>⇧</ShortcutKey>}
            {shortcut.alt && <ShortcutKey>⌥</ShortcutKey>}
            <ShortcutKey>{shortcut.key.toUpperCase()}</ShortcutKey>
          </div>
        </div>
      ))}
    </div>
  );
}

export default useKeyboardShortcuts;


