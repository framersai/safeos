/**
 * Quick Settings Panel Component
 *
 * Floating panel with quick access to monitoring controls.
 * Collapsible, positioned at bottom-right of monitor page.
 *
 * @module components/QuickSettingsPanel
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore, DEFAULT_PRESETS, PresetId, isSleepPreset } from '../stores/settings-store';
import { useSoundManager } from '../lib/sound-manager';
import { PresetInfoModal } from './PresetInfoModal';
import {
  IconSettings,
  IconVolume2,
  IconVolumeX,
  IconShield,
  IconCamera,
  IconMicrophone,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronUp,
  IconInfo,
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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Close panel handler
  const closePanel = useCallback(() => {
    setIsExpanded(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key to close
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, closePanel]);

  // Click outside to close
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, closePanel]);

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
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Quick Settings"
          className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl
                     w-full max-w-[288px] sm:w-72 max-h-[70vh] overflow-hidden animate-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/50 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <IconSettings size={16} className="text-emerald-500" />
              <span className="text-white font-semibold text-sm">Quick Settings</span>
            </div>
            <button
              onClick={closePanel}
              className="p-1 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              aria-label="Close settings (Escape)"
            >
              <IconX size={16} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-3 space-y-2.5 overflow-y-auto max-h-[calc(70vh-44px)]">
            {/* Preset Selector - Dropdown (compact) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs sm:text-[10px] text-slate-400 uppercase tracking-wider">
                  Mode
                </label>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="text-xs sm:text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5"
                  aria-label="Learn about monitoring modes"
                >
                  <IconInfo size={12} />
                  <span>Info</span>
                </button>
              </div>
              <select
                value={activePresetId}
                onChange={(e) => setActivePreset(e.target.value as PresetId)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-700 text-white text-sm
                           border border-slate-600 focus:border-emerald-500 focus:outline-none
                           appearance-none cursor-pointer"
                style={{ minHeight: '44px' }}
                aria-label="Select monitoring mode"
              >
                {presets.map((preset) => {
                  const presetId = preset.id as PresetId;
                  const isSleep = isSleepPreset(presetId);
                  return (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {isSleep ? '(Sleep)' : ''} {preset.useAbsoluteThreshold ? `[${preset.absolutePixelThreshold}px]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Toggles */}
            <div className="grid grid-cols-3 gap-1.5">
              <QuickToggle
                icon={<IconCamera size={14} />}
                label="Motion"
                active={globalSettings.motionDetectionEnabled}
                onChange={(enabled) => updateGlobalSettings({ motionDetectionEnabled: enabled })}
              />
              <QuickToggle
                icon={<IconMicrophone size={14} />}
                label="Audio"
                active={globalSettings.audioDetectionEnabled}
                onChange={(enabled) => updateGlobalSettings({ audioDetectionEnabled: enabled })}
              />
              <QuickToggle
                icon={<IconShield size={14} />}
                label="Pixel"
                active={globalSettings.pixelDetectionEnabled}
                onChange={(enabled) => updateGlobalSettings({ pixelDetectionEnabled: enabled })}
              />
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs sm:text-[10px] text-slate-400 uppercase tracking-wider">Volume</label>
                <span className="text-xs sm:text-[10px] text-emerald-500 font-mono">{globalSettings.alertVolume}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleGlobalMute}
                  className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
                    globalMute ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                  aria-label={globalMute ? 'Unmute' : 'Mute'}
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
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                             [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2
                             [&::-webkit-slider-thumb]:border-white/20"
                  aria-label="Alert volume"
                />
              </div>
            </div>

            {/* Emergency Mode Toggle */}
            <button
              onClick={() => {
                if (emergencyModeActive) {
                  deactivateEmergencyMode();
                } else {
                  activateEmergencyMode('manual');
                }
              }}
              className={`w-full py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                emergencyModeActive
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400 border border-slate-600/50'
              }`}
            >
              <IconAlertTriangle size={14} />
              {emergencyModeActive ? 'EMERGENCY ACTIVE' : 'Emergency Mode'}
            </button>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
              aria-expanded={showAdvanced}
              aria-controls="advanced-settings"
            >
              <IconChevronUp
                size={12}
                className={`transition-transform ${showAdvanced ? '' : 'rotate-180'}`}
              />
              {showAdvanced ? 'Less options' : 'More options'}
            </button>

            {/* Advanced Section - Collapsible */}
            {showAdvanced && (
              <div id="advanced-settings" className="space-y-2.5 pt-2 border-t border-slate-700/50">
                {/* Sensitivity Sliders */}
                <div className="space-y-2">
                  <SensitivitySlider
                    label="Motion"
                    value={globalSettings.motionSensitivity}
                    onChange={(value) => updateGlobalSettings({ motionSensitivity: value })}
                  />
                  <SensitivitySlider
                    label="Audio"
                    value={globalSettings.audioSensitivity}
                    onChange={(value) => updateGlobalSettings({ audioSensitivity: value })}
                  />
                </div>

                {/* Test Sounds */}
                <div>
                  <label className="text-xs sm:text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Test Sounds</label>
                  <div className="flex gap-1">
                    <TestSoundButton label="🔔" onClick={() => soundManager.test('notification')} title="Notification" />
                    <TestSoundButton label="⚠️" onClick={() => soundManager.test('alert')} title="Alert" />
                    <TestSoundButton label="🚨" onClick={() => soundManager.test('warning')} title="Warning" />
                    <TestSoundButton label="🔊" onClick={() => soundManager.test('alarm')} title="Alarm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preset Info Modal */}
      <PresetInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
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
      className={`flex flex-col items-center justify-center gap-1 py-3 px-2 min-h-[56px] rounded-lg transition-all ${
        active
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-slate-700/30 text-slate-400 border border-transparent hover:bg-slate-700/50'
      }`}
      aria-pressed={active}
      aria-label={`${label} detection`}
    >
      {icon}
      <span className="text-xs sm:text-[10px]">{label}</span>
      <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-600'}`} />
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
    <div className="flex items-center gap-2 min-h-[44px]">
      <label className="text-xs sm:text-[10px] text-slate-400 w-14">{label}</label>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none bg-slate-700
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2
                   [&::-webkit-slider-thumb]:border-white/20"
        aria-label={`${label} sensitivity`}
      />
      <span className="text-xs sm:text-[10px] text-emerald-500 font-mono w-10 text-right">{value}%</span>
    </div>
  );
}

interface TestSoundButtonProps {
  label: string;
  onClick: () => void;
  title?: string;
}

function TestSoundButton({ label, onClick, title }: TestSoundButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex-1 py-2.5 px-2 min-h-[44px] bg-slate-700/30 rounded-lg text-base
                 hover:bg-slate-700/50 active:bg-slate-600/50 transition-colors
                 flex items-center justify-center"
      aria-label={`Test ${title || label} sound`}
    >
      {label}
    </button>
  );
}

export default QuickSettingsPanel;

