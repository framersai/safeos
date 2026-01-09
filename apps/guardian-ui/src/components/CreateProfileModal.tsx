/**
 * Create Profile Modal Component
 *
 * Modal for creating new monitoring profiles.
 *
 * @module components/CreateProfileModal
 */

'use client';

import React, { useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ProfileFormData {
  name: string;
  scenario: 'pet' | 'baby' | 'elderly' | 'security';
  settings: {
    motionSensitivity: number;
    audioSensitivity: number;
    analysisInterval: number;
    cryDetection?: boolean;
    sleepMonitoring?: boolean;
    inactivityAlert?: boolean;
    barkDetection?: boolean;
    fallDetection?: boolean;
    helpDetection?: boolean;
  };
}

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

// =============================================================================
// Scenario Presets
// =============================================================================

const scenarioDefaults: Record<string, ProfileFormData['settings']> = {
  pet: {
    motionSensitivity: 70,
    audioSensitivity: 60,
    analysisInterval: 5,
    barkDetection: true,
    inactivityAlert: true,
  },
  baby: {
    motionSensitivity: 85,
    audioSensitivity: 80,
    analysisInterval: 3,
    cryDetection: true,
    sleepMonitoring: true,
  },
  elderly: {
    motionSensitivity: 75,
    audioSensitivity: 70,
    analysisInterval: 5,
    fallDetection: true,
    helpDetection: true,
    inactivityAlert: true,
  },
  security: {
    motionSensitivity: 90,
    audioSensitivity: 85,
    analysisInterval: 2,
    inactivityAlert: false,
  },
};

const scenarioLabels: Record<string, { name: string; icon: string; description: string }> = {
  pet: {
    name: 'Pet Monitoring',
    icon: '🐾',
    description: 'Monitor pets for activity, distress, and health indicators',
  },
  baby: {
    name: 'Baby Monitoring',
    icon: '👶',
    description: 'Watch for crying, movement, and sleep patterns',
  },
  elderly: {
    name: 'Elderly Care',
    icon: '👵',
    description: 'Detect falls, calls for help, and inactivity',
  },
  security: {
    name: 'Security',
    icon: '🔒',
    description: 'General motion and intrusion detection',
  },
};

// =============================================================================
// Component
// =============================================================================

export function CreateProfileModal({ isOpen, onClose, onSubmit }: CreateProfileModalProps) {
  const [name, setName] = useState('');
  const [scenario, setScenario] = useState<ProfileFormData['scenario']>('baby');
  const [settings, setSettings] = useState(scenarioDefaults.baby);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update settings when scenario changes
  const handleScenarioChange = (newScenario: ProfileFormData['scenario']) => {
    setScenario(newScenario);
    setSettings(scenarioDefaults[newScenario]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Profile name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        scenario,
        settings,
      });
      // Reset form
      setName('');
      setScenario('baby');
      setSettings(scenarioDefaults.baby);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-lg bg-slate-800 rounded-xl shadow-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 id="modal-title" className="text-xl font-semibold text-white">
            Create New Profile
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Profile Name */}
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-slate-300 mb-2">
                Profile Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Living Room Camera"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isSubmitting}
                maxLength={100}
              />
            </div>

            {/* Scenario Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Monitoring Scenario
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(scenarioLabels) as ProfileFormData['scenario'][]).map((key) => {
                  const info = scenarioLabels[key];
                  const isSelected = scenario === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleScenarioChange(key)}
                      disabled={isSubmitting}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/20'
                          : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                      } disabled:opacity-50`}
                    >
                      <span className="text-2xl mb-2 block">{info.icon}</span>
                      <span className="text-sm font-medium text-white block">{info.name}</span>
                      <span className="text-xs text-slate-400 line-clamp-2">{info.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sensitivity Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300">Sensitivity Settings</h3>

              {/* Motion Sensitivity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="motion-sensitivity" className="text-sm text-slate-400">
                    Motion Sensitivity
                  </label>
                  <span className="text-sm text-white">{settings.motionSensitivity}%</span>
                </div>
                <input
                  id="motion-sensitivity"
                  type="range"
                  min="10"
                  max="100"
                  value={settings.motionSensitivity}
                  onChange={(e) => setSettings({ ...settings, motionSensitivity: Number(e.target.value) })}
                  disabled={isSubmitting}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Audio Sensitivity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="audio-sensitivity" className="text-sm text-slate-400">
                    Audio Sensitivity
                  </label>
                  <span className="text-sm text-white">{settings.audioSensitivity}%</span>
                </div>
                <input
                  id="audio-sensitivity"
                  type="range"
                  min="10"
                  max="100"
                  value={settings.audioSensitivity}
                  onChange={(e) => setSettings({ ...settings, audioSensitivity: Number(e.target.value) })}
                  disabled={isSubmitting}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Analysis Interval */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="analysis-interval" className="text-sm text-slate-400">
                    Analysis Interval
                  </label>
                  <span className="text-sm text-white">{settings.analysisInterval}s</span>
                </div>
                <input
                  id="analysis-interval"
                  type="range"
                  min="1"
                  max="30"
                  value={settings.analysisInterval}
                  onChange={(e) => setSettings({ ...settings, analysisInterval: Number(e.target.value) })}
                  disabled={isSubmitting}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-300">Detection Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {scenario === 'baby' && (
                  <>
                    <FeatureToggle
                      label="Cry Detection"
                      checked={settings.cryDetection ?? false}
                      onChange={(checked) => setSettings({ ...settings, cryDetection: checked })}
                      disabled={isSubmitting}
                    />
                    <FeatureToggle
                      label="Sleep Monitoring"
                      checked={settings.sleepMonitoring ?? false}
                      onChange={(checked) => setSettings({ ...settings, sleepMonitoring: checked })}
                      disabled={isSubmitting}
                    />
                  </>
                )}
                {scenario === 'pet' && (
                  <>
                    <FeatureToggle
                      label="Bark Detection"
                      checked={settings.barkDetection ?? false}
                      onChange={(checked) => setSettings({ ...settings, barkDetection: checked })}
                      disabled={isSubmitting}
                    />
                    <FeatureToggle
                      label="Inactivity Alert"
                      checked={settings.inactivityAlert ?? false}
                      onChange={(checked) => setSettings({ ...settings, inactivityAlert: checked })}
                      disabled={isSubmitting}
                    />
                  </>
                )}
                {scenario === 'elderly' && (
                  <>
                    <FeatureToggle
                      label="Fall Detection"
                      checked={settings.fallDetection ?? false}
                      onChange={(checked) => setSettings({ ...settings, fallDetection: checked })}
                      disabled={isSubmitting}
                    />
                    <FeatureToggle
                      label="Help Detection"
                      checked={settings.helpDetection ?? false}
                      onChange={(checked) => setSettings({ ...settings, helpDetection: checked })}
                      disabled={isSubmitting}
                    />
                    <FeatureToggle
                      label="Inactivity Alert"
                      checked={settings.inactivityAlert ?? false}
                      onChange={(checked) => setSettings({ ...settings, inactivityAlert: checked })}
                      disabled={isSubmitting}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface FeatureToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function FeatureToggle({ label, checked, onChange, disabled }: FeatureToggleProps) {
  return (
    <label className={`flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-slate-500 bg-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
      />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}

export default CreateProfileModal;
