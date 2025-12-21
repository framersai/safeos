/**
 * Quick Settings Panel Component
 *
 * Floating panel with quick access to monitoring controls.
 * Collapsible, positioned at bottom-right of monitor page.
 *
 * @module components/QuickSettingsPanel
 */

'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore, DEFAULT_PRESETS, PresetId } from '../stores/settings-store';
import { useSoundManager } from '../lib/sound-manager';
import { useNotifications } from '../lib/notification-manager';
import {
  IconSettings,
  IconVolume2,
  IconVolumeX,
  IconShield,
  IconCamera,
  IconMicrophone,
  IconBell,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronUp,
  IconChevronDown,
} from './icons';

// =============================================================================
// QuickSettingsPanel Component
// =============================================================================

interface QuickSettingsPanelProps {
  className?: string;
}

export function QuickSettingsPanel({ className = '' }: QuickSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const {
    activePresetId,
    globalSettings,
    globalMute,
    emergencyModeActive,
    setActivePreset,
    updateGlobalSettings,
    toggleGlobalMute,
    activateEmergencyMode,
    deactivateEmergencyMode,
  } = useSettingsStore();
  
  const soundManager = useSoundManager();
  const notifications = useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const presets = Object.values(DEFAULT_PRESETS);

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Collapsed Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 
                     rounded-xl px-4 py-3 shadow-lg hover:bg-slate-700/90 transition-all"
        >
          <IconSettings size={20} className="text-emerald-500 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-white font-medium">Quick Settings</span>
          <IconChevronUp size={16} className="text-slate-400" />
        </button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl 
                        w-80 overflow-hidden animate-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <IconSettings size={18} className="text-emerald-500" />
              <span className="text-white font-semibold">Quick Settings</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            >
              <IconChevronDown size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Preset Selector */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                Security Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setActivePreset(preset.id as PresetId)}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      activePresetId === preset.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="grid grid-cols-3 gap-2">
              {/* Motion Detection */}
              <QuickToggle
                icon={<IconCamera size={18} />}
                label="Motion"
                active={globalSettings.motionDetectionEnabled}
                onChange={(enabled) => updateGlobalSettings({ motionDetectionEnabled: enabled })}
              />
              
              {/* Audio Detection */}
              <QuickToggle
                icon={<IconMicrophone size={18} />}
                label="Audio"
                active={globalSettings.audioDetectionEnabled}
                onChange={(enabled) => updateGlobalSettings({ audioDetectionEnabled: enabled })}
              />
              
              {/* Pixel Detection */}
              <QuickToggle
                icon={<IconShield size={18} />}
                label="Pixel"
                active={globalSettings.pixelDetectionEnabled}
                onChange={(enabled) => updateGlobalSettings({ pixelDetectionEnabled: enabled })}
              />
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider">
                  Alert Volume
                </label>
                <span className="text-xs text-emerald-500 font-mono">
                  {globalSettings.alertVolume}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleGlobalMute}
                  className={`p-2 rounded-lg transition-colors ${
                    globalMute
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {globalMute ? <IconVolumeX size={18} /> : <IconVolume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={globalSettings.alertVolume}
                  onChange={(e) => updateGlobalSettings({ alertVolume: parseInt(e.target.value) })}
                  className="flex-1 h-2 rounded-full appearance-none bg-slate-700 
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                             [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                             [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>

            {/* Sensitivity Sliders */}
            <div className="space-y-3">
              <SensitivitySlider
                label="Motion Sensitivity"
                value={globalSettings.motionSensitivity}
                onChange={(value) => updateGlobalSettings({ motionSensitivity: value })}
              />
              <SensitivitySlider
                label="Audio Sensitivity"
                value={globalSettings.audioSensitivity}
                onChange={(value) => updateGlobalSettings({ audioSensitivity: value })}
              />
            </div>

            {/* Emergency Mode Toggle */}
            <div className="pt-2 border-t border-slate-700/50">
              <button
                onClick={() => {
                  if (emergencyModeActive) {
                    deactivateEmergencyMode();
                  } else {
                    activateEmergencyMode('manual');
                  }
                }}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  emergencyModeActive
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                }`}
              >
                <IconAlertTriangle size={18} />
                {emergencyModeActive ? 'EMERGENCY MODE ACTIVE' : 'Enable Emergency Mode'}
              </button>
            </div>

            {/* Test Sounds */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                Test Sounds
              </label>
              <div className="flex gap-2">
                <TestSoundButton 
                  label="Notification" 
                  onClick={() => soundManager.test('notification')} 
                />
                <TestSoundButton 
                  label="Alert" 
                  onClick={() => soundManager.test('alert')} 
                />
                <TestSoundButton 
                  label="Warning" 
                  onClick={() => soundManager.test('warning')} 
                />
                <TestSoundButton 
                  label="Alarm" 
                  onClick={() => soundManager.test('alarm')} 
                />
              </div>
            </div>

            {/* Notification Permission */}
            {!notifications.isGranted && (
              <button
                onClick={notifications.requestPermission}
                className="w-full py-2 px-4 bg-blue-500/20 text-blue-400 rounded-lg text-sm 
                           flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-colors"
              >
                <IconBell size={16} />
                Enable Browser Notifications
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface QuickToggleProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onChange: (active: boolean) => void;
}

function QuickToggle({ icon, label, active, onChange }: QuickToggleProps) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
        active
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-700/50 text-slate-400 border border-transparent hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
      <div className={`w-3 h-3 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-600'}`} />
    </button>
  );
}

interface SensitivitySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function SensitivitySlider({ label, value, onChange }: SensitivitySliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-slate-400">{label}</label>
        <span className="text-xs text-emerald-500 font-mono">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-slate-700 
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                   [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

interface TestSoundButtonProps {
  label: string;
  onClick: () => void;
}

function TestSoundButton({ label, onClick }: TestSoundButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-1.5 px-2 bg-slate-700/50 rounded text-xs text-slate-300 
                 hover:bg-slate-700 hover:text-white transition-colors"
    >
      {label}
    </button>
  );
}

export default QuickSettingsPanel;

