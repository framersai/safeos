/**
 * Appearance Settings Page
 *
 * Theme and accessibility settings for the Guardian UI.
 *
 * @module app/settings/appearance/page
 */

'use client';

import React from 'react';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconSun,
  IconMoon,
  IconComputer,
  IconEye,
} from '@/components/icons';
import { useTheme, useAccessibility } from '@/lib/theme-manager';

// =============================================================================
// Types
// =============================================================================

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

// =============================================================================
// Constants
// =============================================================================

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Light background with dark text',
    icon: IconSun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dark background with light text',
    icon: IconMoon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your device settings',
    icon: IconComputer,
  },
];

// =============================================================================
// Component
// =============================================================================

export default function AppearanceSettingsPage() {
  const { themeMode, setThemeMode, theme: resolvedTheme } = useTheme();
  const {
    reducedMotion,
    highContrast,
    largeText,
    toggleReducedMotion,
    toggleHighContrast,
    toggleLargeText,
    resetAccessibility,
  } = useAccessibility();

  return (
    <div className="container py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <IconArrowLeft size={20} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-heading-lg">Appearance</h1>
          <p className="text-sm text-slate-400 mt-1">
            Customize theme and accessibility settings
          </p>
        </div>
      </div>

      {/* Theme Selection */}
      <section className="panel">
        <div className="panel-header">
          <h2 className="text-heading-sm">THEME</h2>
          <span className="text-xs text-slate-500 font-mono">
            Current: {resolvedTheme}
          </span>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = themeMode === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setThemeMode(option.value)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${isActive
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}
                      `}
                    >
                      <Icon size={20} />
                    </div>
                    <span className={`font-medium ${isActive ? 'text-green-400' : 'text-slate-200'}`}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accessibility Settings */}
      <section className="panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <IconEye size={20} className="text-slate-400" />
            <h2 className="text-heading-sm">ACCESSIBILITY</h2>
          </div>
          <button
            onClick={resetAccessibility}
            className="text-xs text-slate-500 hover:text-slate-400 font-mono"
          >
            Reset to defaults
          </button>
        </div>
        <div className="panel-body space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between py-3 border-b border-slate-800">
            <div>
              <h3 className="font-medium text-slate-200">Reduce Motion</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Minimize animations throughout the interface
              </p>
            </div>
            <button
              onClick={toggleReducedMotion}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${reducedMotion ? 'bg-green-500' : 'bg-slate-700'}
              `}
              role="switch"
              aria-checked={reducedMotion}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${reducedMotion ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between py-3 border-b border-slate-800">
            <div>
              <h3 className="font-medium text-slate-200">High Contrast</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Increase contrast for better visibility
              </p>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${highContrast ? 'bg-green-500' : 'bg-slate-700'}
              `}
              role="switch"
              aria-checked={highContrast}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${highContrast ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Large Text */}
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-slate-200">Large Text</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Increase font sizes for easier reading
              </p>
            </div>
            <button
              onClick={toggleLargeText}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${largeText ? 'bg-green-500' : 'bg-slate-700'}
              `}
              role="switch"
              aria-checked={largeText}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${largeText ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="panel">
        <div className="panel-header">
          <h2 className="text-heading-sm">PREVIEW</h2>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-800 rounded-lg text-center">
              <div className="w-8 h-8 rounded-full bg-green-500 mx-auto mb-2" />
              <span className="text-sm text-slate-300">Success</span>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg text-center">
              <div className="w-8 h-8 rounded-full bg-amber-500 mx-auto mb-2" />
              <span className="text-sm text-slate-300">Warning</span>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg text-center">
              <div className="w-8 h-8 rounded-full bg-red-500 mx-auto mb-2" />
              <span className="text-sm text-slate-300">Error</span>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg text-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 mx-auto mb-2" />
              <span className="text-sm text-slate-300">Info</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm text-slate-400">
              Sample text at normal size. This helps you preview how content will appear.
            </p>
            <p className="text-xs text-slate-500 font-mono">
              MONO_LABEL: Sample monospace text for data display
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary">Primary</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-ghost">Ghost</button>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcut Hint */}
      <div className="text-center text-sm text-slate-500">
        <span className="font-mono bg-slate-800 px-2 py-1 rounded text-xs">?</span>
        {' '}to view keyboard shortcuts
      </div>
    </div>
  );
}
