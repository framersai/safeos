/**
 * Quiet Hours Settings Page
 *
 * Configure quiet hours scheduling, per-day settings, and notification modes.
 *
 * @module app/settings/schedule/page
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSettingsStore, type QuietHoursSettings } from '../../../stores/settings-store';

// =============================================================================
// Constants
// =============================================================================

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

const QUIET_MODES = [
  {
    value: 'silent' as const,
    label: 'Silent',
    description: 'All alerts muted completely',
    icon: '🔇',
  },
  {
    value: 'reduced' as const,
    label: 'Reduced Volume',
    description: 'Alerts at lower volume',
    icon: '🔉',
  },
  {
    value: 'emergency_only' as const,
    label: 'Emergency Only',
    description: 'Only critical alerts sound',
    icon: '🚨',
  },
];

// =============================================================================
// Quiet Hours Settings Page
// =============================================================================

export default function ScheduleSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { quietHoursSettings, updateQuietHoursSettings, isQuietHoursActive } = useSettingsStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const toggleDay = (day: number) => {
    const currentDays = quietHoursSettings.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    updateQuietHoursSettings({ days: newDays });
  };

  const isCurrentlyActive = isQuietHoursActive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 text-slate-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Go back to settings"
            >
              <ChevronLeftIcon />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Quiet Hours</h1>
              <p className="text-sm text-slate-400">
                Schedule when to mute or reduce alert sounds
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
              isCurrentlyActive
                ? 'bg-indigo-500/20 text-indigo-400'
                : quietHoursSettings.enabled
                  ? 'bg-slate-700/50 text-slate-400'
                  : 'bg-slate-700/30 text-slate-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCurrentlyActive ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            {isCurrentlyActive ? 'Active Now' : quietHoursSettings.enabled ? 'Scheduled' : 'Off'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Enable Toggle */}
        <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Enable Quiet Hours</h3>
              <p className="text-sm text-slate-400 mt-1">
                Automatically reduce or mute alerts during specified times
              </p>
            </div>
            <button
              onClick={() => updateQuietHoursSettings({ enabled: !quietHoursSettings.enabled })}
              className={`relative w-14 h-7 rounded-full transition-colors min-w-[56px] ${
                quietHoursSettings.enabled ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={quietHoursSettings.enabled}
              aria-label="Enable quiet hours"
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  quietHoursSettings.enabled ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Time Settings */}
        <section
          className={`bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 transition-opacity ${
            !quietHoursSettings.enabled ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Time Window</h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start-time" className="block text-sm font-medium text-slate-300 mb-2">
                Start Time
              </label>
              <input
                id="start-time"
                type="time"
                value={quietHoursSettings.startTime}
                onChange={(e) => updateQuietHoursSettings({ startTime: e.target.value })}
                className="w-full px-4 py-3 min-h-[44px] bg-slate-900 border border-slate-600 rounded-lg text-white text-lg font-mono
                           focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">When quiet hours begin</p>
            </div>

            <div>
              <label htmlFor="end-time" className="block text-sm font-medium text-slate-300 mb-2">
                End Time
              </label>
              <input
                id="end-time"
                type="time"
                value={quietHoursSettings.endTime}
                onChange={(e) => updateQuietHoursSettings({ endTime: e.target.value })}
                className="w-full px-4 py-3 min-h-[44px] bg-slate-900 border border-slate-600 rounded-lg text-white text-lg font-mono
                           focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">When normal alerts resume</p>
            </div>
          </div>

          {/* Overnight indicator */}
          {quietHoursSettings.startTime > quietHoursSettings.endTime && (
            <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400">
              <MoonIcon />
              <span>Overnight schedule: {quietHoursSettings.startTime} to {quietHoursSettings.endTime} (next day)</span>
            </div>
          )}
        </section>

        {/* Days Selection */}
        <section
          className={`bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 transition-opacity ${
            !quietHoursSettings.enabled ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Active Days</h2>
          <p className="text-sm text-slate-400 mb-4">Select which days quiet hours should be active</p>

          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`px-4 py-2.5 min-w-[52px] min-h-[44px] rounded-lg font-medium text-sm transition-all ${
                  quietHoursSettings.days.includes(day.value)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                }`}
                aria-pressed={quietHoursSettings.days.includes(day.value)}
                aria-label={`${day.fullLabel} ${quietHoursSettings.days.includes(day.value) ? 'enabled' : 'disabled'}`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Quick select buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => updateQuietHoursSettings({ days: [0, 1, 2, 3, 4, 5, 6] })}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => updateQuietHoursSettings({ days: [1, 2, 3, 4, 5] })}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Weekdays
            </button>
            <button
              onClick={() => updateQuietHoursSettings({ days: [0, 6] })}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Weekends
            </button>
            <button
              onClick={() => updateQuietHoursSettings({ days: [] })}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Mode Selection */}
        <section
          className={`bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 transition-opacity ${
            !quietHoursSettings.enabled ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Quiet Mode</h2>
          <p className="text-sm text-slate-400 mb-4">How alerts should behave during quiet hours</p>

          <div className="grid gap-3">
            {QUIET_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => updateQuietHoursSettings({ mode: mode.value })}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all text-left min-h-[64px] ${
                  quietHoursSettings.mode === mode.value
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-900'
                }`}
                aria-pressed={quietHoursSettings.mode === mode.value}
              >
                <span className="text-2xl" aria-hidden="true">{mode.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white">{mode.label}</div>
                  <div className="text-sm text-slate-400">{mode.description}</div>
                </div>
                {quietHoursSettings.mode === mode.value && (
                  <CheckIcon className="w-5 h-5 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Reduced Volume Slider (only for 'reduced' mode) */}
        {quietHoursSettings.mode === 'reduced' && quietHoursSettings.enabled && (
          <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Reduced Volume Level</h2>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Volume during quiet hours</span>
                <span className="text-emerald-400 font-medium">{quietHoursSettings.reducedVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={quietHoursSettings.reducedVolume}
                onChange={(e) => updateQuietHoursSettings({ reducedVolume: Number(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-emerald-500
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                aria-label="Reduced volume percentage"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Mute</span>
                <span>Full</span>
              </div>
            </div>
          </section>
        )}

        {/* Info Box */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
            <InfoIcon />
            Important
          </h3>
          <p className="text-sm text-slate-400">
            Emergency alerts will always sound at full volume, regardless of quiet hours settings.
            This ensures critical situations are never missed.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function ChevronLeftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
