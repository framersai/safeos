import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =============================================================================
// Types
// =============================================================================

/**
 * Processing mode determines how detection is handled:
 * - 'local': 100% on-device, instant response, no internet required
 * - 'ai_enhanced': Uses AI for advanced analysis, may be queued
 * - 'hybrid': Local first for instant response, AI enhancement queued
 */
export type ProcessingMode = 'local' | 'ai_enhanced' | 'hybrid';

export interface SecurityPreset {
  id: string;
  name: string;
  description: string;
  motionSensitivity: number;      // 0-100
  audioSensitivity: number;       // 0-100
  pixelThreshold: number;         // 0-100 (lower = more sensitive)
  absolutePixelThreshold: number; // 1-1000 pixels (absolute count, not percentage)
  analysisInterval: number;       // seconds (1-60)
  alertDelay: number;             // seconds before escalation (0-300)
  alertVolume: number;            // 0-100
  emergencyMode: boolean;         // Auto-escalate to emergency
  pixelDetectionEnabled: boolean; // Enable pixel-by-pixel detection
  motionDetectionEnabled: boolean;
  audioDetectionEnabled: boolean;
  processingMode: ProcessingMode; // How detection is processed
  useAbsoluteThreshold: boolean;  // Use absolute pixel count vs percentage
}

export interface ScenarioOverrides {
  pet?: Partial<SecurityPreset>;
  baby?: Partial<SecurityPreset>;
  elderly?: Partial<SecurityPreset>;
  security?: Partial<SecurityPreset>;
}

export interface DetectionZone {
  id: string;
  name: string;
  enabled: boolean;
  x: number;      // 0-100 percentage
  y: number;      // 0-100 percentage
  width: number;  // 0-100 percentage
  height: number; // 0-100 percentage
}

export interface AudioSettings {
  frequencyRange: 'all' | 'baby_cry' | 'pet_sounds' | 'elderly_fall' | 'custom';
  backgroundNoiseFilter: boolean;
  customLowFreq: number;   // Hz
  customHighFreq: number;  // Hz
}

export interface TimingSettings {
  cooldownPeriod: number;         // seconds between alerts (10-300)
  minimumMotionDuration: number;  // ms to prevent false positives
  emergencyEscalationDelay: number; // seconds before auto-emergency (0 = disabled)
}

export type PresetId = 'silent' | 'night' | 'maximum' | 'ultimate' | 'infant_sleep' | 'pet_sleep' | 'deep_sleep_minimal' | 'custom';
export type SleepPresetId = 'infant_sleep' | 'pet_sleep' | 'deep_sleep_minimal';
export type ScenarioType = 'pet' | 'baby' | 'elderly' | 'security';

/**
 * Check if a preset is a sleep monitoring preset
 */
export function isSleepPreset(presetId: PresetId): presetId is SleepPresetId {
  return ['infant_sleep', 'pet_sleep', 'deep_sleep_minimal'].includes(presetId);
}

/**
 * Get the processing mode badge info
 */
export function getProcessingModeInfo(mode: ProcessingMode): {
  mode: ProcessingMode;
  label: string;
  description: string;
  color: 'green' | 'amber' | 'blue';
  isInstant: boolean;
} {
  switch (mode) {
    case 'local':
      return {
        mode,
        label: 'LOCAL INSTANT',
        description: '100% on-device processing. No internet required. Zero latency.',
        color: 'green',
        isInstant: true,
      };
    case 'ai_enhanced':
      return {
        mode,
        label: 'AI QUEUE',
        description: 'Advanced AI analysis. May be queued based on server load.',
        color: 'amber',
        isInstant: false,
      };
    case 'hybrid':
      return {
        mode,
        label: 'HYBRID',
        description: 'Instant local detection + AI enhancement queued in background.',
        color: 'blue',
        isInstant: true,
      };
  }
}

// =============================================================================
// Default Presets
// =============================================================================

export const DEFAULT_PRESETS: Record<PresetId, SecurityPreset> = {
  silent: {
    id: 'silent',
    name: 'Silent Mode',
    description: 'All sounds off, visual alerts only. Perfect for quiet environments.',
    motionSensitivity: 50,
    audioSensitivity: 50,
    pixelThreshold: 30,
    absolutePixelThreshold: 100,
    analysisInterval: 10,
    alertDelay: 60,
    alertVolume: 0,
    emergencyMode: false,
    pixelDetectionEnabled: false,
    motionDetectionEnabled: true,
    audioDetectionEnabled: true,
    processingMode: 'local',
    useAbsoluteThreshold: false,
  },
  night: {
    id: 'night',
    name: 'Night Mode',
    description: 'Reduced sensitivity, lower volume (50%), longer intervals for sleeping.',
    motionSensitivity: 40,
    audioSensitivity: 60,
    pixelThreshold: 40,
    absolutePixelThreshold: 150,
    analysisInterval: 15,
    alertDelay: 120,
    alertVolume: 50,
    emergencyMode: false,
    pixelDetectionEnabled: false,
    motionDetectionEnabled: true,
    audioDetectionEnabled: true,
    processingMode: 'local',
    useAbsoluteThreshold: false,
  },
  maximum: {
    id: 'maximum',
    name: 'Maximum Alert',
    description: 'High sensitivity (80%), max volume, 5-second intervals.',
    motionSensitivity: 80,
    audioSensitivity: 80,
    pixelThreshold: 20,
    absolutePixelThreshold: 50,
    analysisInterval: 5,
    alertDelay: 30,
    alertVolume: 100,
    emergencyMode: false,
    pixelDetectionEnabled: true,
    motionDetectionEnabled: true,
    audioDetectionEnabled: true,
    processingMode: 'hybrid',
    useAbsoluteThreshold: false,
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate Secure',
    description: 'Emergency mode ON, max everything (100%), 2-second intervals, all detection enabled.',
    motionSensitivity: 100,
    audioSensitivity: 100,
    pixelThreshold: 10,
    absolutePixelThreshold: 20,
    analysisInterval: 2,
    alertDelay: 10,
    alertVolume: 100,
    emergencyMode: true,
    pixelDetectionEnabled: true,
    motionDetectionEnabled: true,
    audioDetectionEnabled: true,
    processingMode: 'hybrid',
    useAbsoluteThreshold: true,
  },
  
  // ==========================================================================
  // Sleep Monitoring Presets - Ultra-sensitive, 100% local processing
  // ==========================================================================
  
  infant_sleep: {
    id: 'infant_sleep',
    name: 'Infant Sleep Monitor',
    description: 'Ultra-sensitive: 5px movement triggers alert. 100% local, instant response. For co-sleeping or nearby infant monitoring.',
    motionSensitivity: 98,
    audioSensitivity: 95,
    pixelThreshold: 2, // Very low percentage threshold
    absolutePixelThreshold: 5, // Just 5 pixels of movement = alert
    analysisInterval: 1, // Check every second
    alertDelay: 0, // Immediate alert
    alertVolume: 100,
    emergencyMode: false,
    pixelDetectionEnabled: true,
    motionDetectionEnabled: true,
    audioDetectionEnabled: true, // Listen for baby sounds
    processingMode: 'local', // 100% on-device, instant
    useAbsoluteThreshold: true, // Use absolute pixel count
  },
  
  pet_sleep: {
    id: 'pet_sleep',
    name: 'Pet Sleep Monitor',
    description: 'Sensitive: 10px movement triggers alert. For monitoring sleeping pets. 100% local processing.',
    motionSensitivity: 90,
    audioSensitivity: 70,
    pixelThreshold: 5,
    absolutePixelThreshold: 10, // 10 pixels of movement = alert
    analysisInterval: 2,
    alertDelay: 5, // Small delay to reduce false positives from pet breathing
    alertVolume: 80,
    emergencyMode: false,
    pixelDetectionEnabled: true,
    motionDetectionEnabled: true,
    audioDetectionEnabled: false, // Pets make sounds while sleeping
    processingMode: 'local',
    useAbsoluteThreshold: true,
  },
  
  deep_sleep_minimal: {
    id: 'deep_sleep_minimal',
    name: 'Deep Sleep Ultra-Sensitive',
    description: 'Maximum sensitivity: 3px triggers alert. For critical monitoring where any movement matters. Zero latency.',
    motionSensitivity: 100,
    audioSensitivity: 100,
    pixelThreshold: 1,
    absolutePixelThreshold: 3, // Just 3 pixels = alert
    analysisInterval: 1,
    alertDelay: 0,
    alertVolume: 100,
    emergencyMode: true, // Auto-escalate to emergency
    pixelDetectionEnabled: true,
    motionDetectionEnabled: true,
    audioDetectionEnabled: true,
    processingMode: 'local', // Always local for instant response
    useAbsoluteThreshold: true,
  },
  
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Your personalized settings.',
    motionSensitivity: 50,
    audioSensitivity: 50,
    pixelThreshold: 30,
    absolutePixelThreshold: 100,
    analysisInterval: 10,
    alertDelay: 60,
    alertVolume: 70,
    emergencyMode: false,
    pixelDetectionEnabled: false,
    motionDetectionEnabled: true,
    audioDetectionEnabled: true,
    processingMode: 'local',
    useAbsoluteThreshold: false,
  },
};

// =============================================================================
// Sleep Presets (convenience export)
// =============================================================================

export const SLEEP_PRESETS: Record<SleepPresetId, SecurityPreset> = {
  infant_sleep: DEFAULT_PRESETS.infant_sleep,
  pet_sleep: DEFAULT_PRESETS.pet_sleep,
  deep_sleep_minimal: DEFAULT_PRESETS.deep_sleep_minimal,
};

// =============================================================================
// Default Detection Zones
// =============================================================================

export const DEFAULT_DETECTION_ZONES: DetectionZone[] = [
  {
    id: 'full',
    name: 'Full Screen',
    enabled: true,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  },
  {
    id: 'center',
    name: 'Center Focus',
    enabled: false,
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  },
  {
    id: 'left',
    name: 'Left Side',
    enabled: false,
    x: 0,
    y: 0,
    width: 50,
    height: 100,
  },
  {
    id: 'right',
    name: 'Right Side',
    enabled: false,
    x: 50,
    y: 0,
    width: 50,
    height: 100,
  },
];

// =============================================================================
// Store State
// =============================================================================

interface SettingsState {
  // Current active preset
  activePresetId: PresetId;
  
  // Active sleep preset (null if not using sleep mode)
  activeSleepPreset: SleepPresetId | null;
  
  // Global settings (derived from preset or custom)
  globalSettings: SecurityPreset;
  
  // Per-scenario overrides
  scenarioOverrides: ScenarioOverrides;
  
  // Detection zones
  detectionZones: DetectionZone[];
  
  // Audio settings
  audioSettings: AudioSettings;
  
  // Timing settings
  timingSettings: TimingSettings;
  
  // Emergency mode state
  emergencyModeActive: boolean;
  emergencyAlertId: string | null;
  
  // Mute state (except emergency)
  globalMute: boolean;
  
  // Custom presets created by user
  customPresets: SecurityPreset[];
  
  // Actions
  setActivePreset: (presetId: PresetId) => void;
  activateSleepMode: (sleepPresetId: SleepPresetId) => void;
  deactivateSleepMode: () => void;
  updateGlobalSettings: (settings: Partial<SecurityPreset>) => void;
  setScenarioOverride: (scenario: ScenarioType, overrides: Partial<SecurityPreset> | null) => void;
  getEffectiveSettings: (scenario?: ScenarioType) => SecurityPreset;
  
  // Detection zone actions
  updateDetectionZone: (zoneId: string, updates: Partial<DetectionZone>) => void;
  addDetectionZone: (zone: Omit<DetectionZone, 'id'>) => void;
  removeDetectionZone: (zoneId: string) => void;
  
  // Audio settings actions
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  
  // Timing settings actions
  updateTimingSettings: (settings: Partial<TimingSettings>) => void;
  
  // Emergency mode actions
  activateEmergencyMode: (alertId: string) => void;
  deactivateEmergencyMode: () => void;
  
  // Mute actions
  toggleGlobalMute: () => void;
  setGlobalMute: (muted: boolean) => void;
  
  // Custom preset actions
  saveCustomPreset: (name: string, description: string) => void;
  loadCustomPreset: (presetId: string) => void;
  deleteCustomPreset: (presetId: string) => void;
  
  // Import/Export
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
  
  // Reset
  resetToDefaults: () => void;
}

// =============================================================================
// Store
// =============================================================================

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      activePresetId: 'maximum',
      activeSleepPreset: null,
      globalSettings: { ...DEFAULT_PRESETS.maximum },
      scenarioOverrides: {},
      detectionZones: [...DEFAULT_DETECTION_ZONES],
      audioSettings: {
        frequencyRange: 'all',
        backgroundNoiseFilter: true,
        customLowFreq: 20,
        customHighFreq: 20000,
      },
      timingSettings: {
        cooldownPeriod: 30,
        minimumMotionDuration: 500,
        emergencyEscalationDelay: 300, // 5 minutes
      },
      emergencyModeActive: false,
      emergencyAlertId: null,
      globalMute: false,
      customPresets: [],
      
      // Actions
      setActivePreset: (presetId) => {
        const preset = presetId === 'custom' 
          ? get().globalSettings 
          : DEFAULT_PRESETS[presetId];
        
        // Track if this is a sleep preset
        const sleepPreset = isSleepPreset(presetId) ? presetId : null;
        
        set({
          activePresetId: presetId,
          activeSleepPreset: sleepPreset,
          globalSettings: { ...preset, id: presetId },
        });
      },
      
      // Activate a sleep preset (convenience method)
      activateSleepMode: (sleepPresetId: SleepPresetId) => {
        const preset = SLEEP_PRESETS[sleepPresetId];
        set({
          activePresetId: sleepPresetId,
          activeSleepPreset: sleepPresetId,
          globalSettings: { ...preset },
        });
      },
      
      // Deactivate sleep mode and return to previous preset
      deactivateSleepMode: () => {
        set({
          activePresetId: 'maximum',
          activeSleepPreset: null,
          globalSettings: { ...DEFAULT_PRESETS.maximum },
        });
      },
      
      updateGlobalSettings: (settings) => {
        set((state) => ({
          activePresetId: 'custom',
          globalSettings: {
            ...state.globalSettings,
            ...settings,
            id: 'custom',
          },
        }));
      },
      
      setScenarioOverride: (scenario, overrides) => {
        set((state) => ({
          scenarioOverrides: {
            ...state.scenarioOverrides,
            [scenario]: overrides,
          },
        }));
      },
      
      getEffectiveSettings: (scenario) => {
        const state = get();
        const base = state.globalSettings;
        
        if (!scenario || !state.scenarioOverrides[scenario]) {
          return base;
        }
        
        return {
          ...base,
          ...state.scenarioOverrides[scenario],
        } as SecurityPreset;
      },
      
      // Detection zone actions
      updateDetectionZone: (zoneId, updates) => {
        set((state) => ({
          detectionZones: state.detectionZones.map((zone) =>
            zone.id === zoneId ? { ...zone, ...updates } : zone
          ),
        }));
      },
      
      addDetectionZone: (zone) => {
        const id = `custom-${Date.now()}`;
        set((state) => ({
          detectionZones: [...state.detectionZones, { ...zone, id }],
        }));
      },
      
      removeDetectionZone: (zoneId) => {
        set((state) => ({
          detectionZones: state.detectionZones.filter((z) => z.id !== zoneId),
        }));
      },
      
      // Audio settings actions
      updateAudioSettings: (settings) => {
        set((state) => ({
          audioSettings: { ...state.audioSettings, ...settings },
        }));
      },
      
      // Timing settings actions
      updateTimingSettings: (settings) => {
        set((state) => ({
          timingSettings: { ...state.timingSettings, ...settings },
        }));
      },
      
      // Emergency mode actions
      activateEmergencyMode: (alertId) => {
        set({
          emergencyModeActive: true,
          emergencyAlertId: alertId,
        });
      },
      
      deactivateEmergencyMode: () => {
        set({
          emergencyModeActive: false,
          emergencyAlertId: null,
        });
      },
      
      // Mute actions
      toggleGlobalMute: () => {
        set((state) => ({ globalMute: !state.globalMute }));
      },
      
      setGlobalMute: (muted) => {
        set({ globalMute: muted });
      },
      
      // Custom preset actions
      saveCustomPreset: (name, description) => {
        const state = get();
        const preset: SecurityPreset = {
          ...state.globalSettings,
          id: `custom-${Date.now()}`,
          name,
          description,
        };
        
        set((state) => ({
          customPresets: [...state.customPresets, preset],
        }));
      },
      
      loadCustomPreset: (presetId) => {
        const state = get();
        const preset = state.customPresets.find((p) => p.id === presetId);
        
        if (preset) {
          set({
            activePresetId: 'custom',
            globalSettings: { ...preset },
          });
        }
      },
      
      deleteCustomPreset: (presetId) => {
        set((state) => ({
          customPresets: state.customPresets.filter((p) => p.id !== presetId),
        }));
      },
      
      // Import/Export
      exportSettings: () => {
        const state = get();
        return JSON.stringify({
          activePresetId: state.activePresetId,
          globalSettings: state.globalSettings,
          scenarioOverrides: state.scenarioOverrides,
          detectionZones: state.detectionZones,
          audioSettings: state.audioSettings,
          timingSettings: state.timingSettings,
          customPresets: state.customPresets,
        }, null, 2);
      },
      
      importSettings: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            activePresetId: data.activePresetId || 'maximum',
            globalSettings: data.globalSettings || DEFAULT_PRESETS.maximum,
            scenarioOverrides: data.scenarioOverrides || {},
            detectionZones: data.detectionZones || DEFAULT_DETECTION_ZONES,
            audioSettings: data.audioSettings || get().audioSettings,
            timingSettings: data.timingSettings || get().timingSettings,
            customPresets: data.customPresets || [],
          });
          return true;
        } catch {
          return false;
        }
      },
      
      // Reset
      resetToDefaults: () => {
        set({
          activePresetId: 'maximum',
          globalSettings: { ...DEFAULT_PRESETS.maximum },
          activeSleepPreset: null,
          scenarioOverrides: {},
          detectionZones: [...DEFAULT_DETECTION_ZONES],
          audioSettings: {
            frequencyRange: 'all',
            backgroundNoiseFilter: true,
            customLowFreq: 20,
            customHighFreq: 20000,
          },
          timingSettings: {
            cooldownPeriod: 30,
            minimumMotionDuration: 500,
            emergencyEscalationDelay: 300,
          },
          emergencyModeActive: false,
          emergencyAlertId: null,
          globalMute: false,
          customPresets: [],
        });
      },
    }),
    {
      name: 'safeos-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activePresetId: state.activePresetId,
        activeSleepPreset: state.activeSleepPreset,
        globalSettings: state.globalSettings,
        scenarioOverrides: state.scenarioOverrides,
        detectionZones: state.detectionZones,
        audioSettings: state.audioSettings,
        timingSettings: state.timingSettings,
        globalMute: state.globalMute,
        customPresets: state.customPresets,
      }),
    }
  )
);

// =============================================================================
// Helper Hooks
// =============================================================================

export function useCurrentPreset(): SecurityPreset {
  return useSettingsStore((state) => state.globalSettings);
}

export function useEmergencyMode(): { active: boolean; alertId: string | null } {
  return useSettingsStore((state) => ({
    active: state.emergencyModeActive,
    alertId: state.emergencyAlertId,
  }));
}

export function useVolumeOverride(): number {
  const { globalSettings, emergencyModeActive, globalMute } = useSettingsStore();
  
  // Emergency mode always overrides to max
  if (emergencyModeActive) return 100;
  
  // Global mute (except emergency)
  if (globalMute) return 0;
  
  return globalSettings.alertVolume;
}

/**
 * Hook for sleep mode status
 */
export function useSleepMode(): {
  isActive: boolean;
  presetId: SleepPresetId | null;
  preset: SecurityPreset | null;
  activate: (presetId: SleepPresetId) => void;
  deactivate: () => void;
} {
  const { activeSleepPreset, activateSleepMode, deactivateSleepMode } = useSettingsStore();
  
  return {
    isActive: activeSleepPreset !== null,
    presetId: activeSleepPreset,
    preset: activeSleepPreset ? SLEEP_PRESETS[activeSleepPreset] : null,
    activate: activateSleepMode,
    deactivate: deactivateSleepMode,
  };
}

/**
 * Hook for processing mode info
 */
export function useProcessingModeInfo(): {
  mode: ProcessingMode;
  label: string;
  description: string;
  color: 'green' | 'amber' | 'blue';
  isInstant: boolean;
} {
  const { globalSettings } = useSettingsStore();
  return getProcessingModeInfo(globalSettings.processingMode);
}

