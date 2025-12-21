'use client';

/**
 * Settings Page
 *
 * User settings and configuration.
 *
 * @module app/settings/page
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useMonitoringStore } from '../../stores/monitoring-store';
import { useOnboardingStore } from '../../stores/onboarding-store';

// =============================================================================
// Component
// =============================================================================

export default function SettingsPage() {
  const {
    motionSensitivity,
    audioSensitivity,
    setMotionSensitivity,
    setAudioSensitivity,
    reset: resetMonitoring,
  } = useMonitoringStore();

  const { resetOnboarding } = useOnboardingStore();

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('This will reset all settings and require you to go through setup again. Continue?')) {
      resetMonitoring();
      resetOnboarding();
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl hover:scale-110 transition-transform">
                🛡️
              </Link>
              <h1 className="text-xl font-bold text-white">Settings</h1>
            </div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sensitivity Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Detection Sensitivity
          </h2>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-6">
            {/* Motion Sensitivity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-white">Motion Sensitivity</label>
                <span className="text-gray-400">{motionSensitivity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={motionSensitivity}
                onChange={(e) => setMotionSensitivity(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Less Sensitive</span>
                <span>More Sensitive</span>
              </div>
            </div>

            {/* Audio Sensitivity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-white">Audio Sensitivity</label>
                <span className="text-gray-400">{audioSensitivity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={audioSensitivity}
                onChange={(e) => setAudioSensitivity(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Less Sensitive</span>
                <span>More Sensitive</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-4">
            <SettingToggle
              label="Browser Push Notifications"
              description="Receive alerts in your browser"
              defaultChecked={true}
            />
            <SettingToggle
              label="Sound Alerts"
              description="Play sound when alerts occur"
              defaultChecked={true}
            />
            <SettingToggle
              label="Desktop Notifications"
              description="Show system notifications"
              defaultChecked={false}
            />
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Privacy</h2>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-4">
            <SettingToggle
              label="Local Processing Only"
              description="Prefer local AI when available"
              defaultChecked={true}
            />
            <SettingToggle
              label="Auto-Delete Footage"
              description="Automatically delete footage after 10 minutes"
              defaultChecked={true}
            />
            <SettingToggle
              label="Anonymize for Cloud"
              description="Blur faces before cloud processing"
              defaultChecked={true}
            />
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-wrap gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 font-semibold rounded-lg transition-colors"
          >
            Reset All Settings
          </button>
        </section>
      </main>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function SettingToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-white">{label}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-500' : 'bg-gray-600'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
