/**
 * Keyboard Shortcuts Help Modal
 *
 * Displays all available keyboard shortcuts grouped by category.
 * Press '?' to toggle this modal from anywhere in the app.
 *
 * @module components/KeyboardShortcutsModal
 */

'use client';

import React, { useEffect, useRef } from 'react';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  formatShortcutKey,
} from '../lib/keyboard-shortcuts';

// =============================================================================
// Types
// =============================================================================

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and escape handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = DEFAULT_SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof DEFAULT_SHORTCUTS>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <KeyboardIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(SHORTCUT_CATEGORIES).map(([categoryKey, category]) => {
              const shortcuts = groupedShortcuts[categoryKey];
              if (!shortcuts || shortcuts.length === 0) return null;

              return (
                <div key={categoryKey} className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </h3>
                  <div className="space-y-1">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                      >
                        <span className="text-sm text-slate-300">{shortcut.description}</span>
                        <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded shadow-sm">
                          {formatShortcutKey(shortcut.key, shortcut.modifiers)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-700 rounded">?</kbd> anytime to toggle this help
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function KeyboardIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm2 4h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"
      />
    </svg>
  );
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default KeyboardShortcutsModal;
