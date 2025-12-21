/**
 * Centralized Sound Manager
 * 
 * Manages all audio playback with priority system and volume overrides.
 * Emergency mode always plays at 100% volume regardless of user settings.
 */

// =============================================================================
// Types
// =============================================================================

export type SoundType = 'notification' | 'alert' | 'warning' | 'alarm' | 'emergency';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SoundConfig {
  type: SoundType;
  path: string;
  defaultVolume: number;   // 0-100
  priority: number;        // Higher = more important
  loop: boolean;
  fadeIn: number;          // ms (0 = instant)
  fadeOut: number;         // ms (0 = instant)
}

export interface PlayOptions {
  volume?: number;          // Override default volume (0-100)
  loop?: boolean;           // Override default loop
  fadeIn?: number;          // Override default fade
  fadeOut?: number;         // Override default fade
  onEnd?: () => void;       // Callback when sound ends
  forceMaxVolume?: boolean; // Ignore user volume, play at 100%
}

interface ActiveSound {
  id: string;
  type: SoundType;
  audio: HTMLAudioElement;
  priority: number;
  startTime: number;
  loop: boolean;
  onEnd?: () => void;
}

// =============================================================================
// Sound Configurations
// =============================================================================

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  notification: {
    type: 'notification',
    path: '/sounds/notification.mp3',
    defaultVolume: 60,
    priority: 1,
    loop: false,
    fadeIn: 100,
    fadeOut: 200,
  },
  alert: {
    type: 'alert',
    path: '/sounds/alert.mp3',
    defaultVolume: 70,
    priority: 2,
    loop: false,
    fadeIn: 50,
    fadeOut: 150,
  },
  warning: {
    type: 'warning',
    path: '/sounds/warning.mp3',
    defaultVolume: 80,
    priority: 3,
    loop: false,
    fadeIn: 0,
    fadeOut: 100,
  },
  alarm: {
    type: 'alarm',
    path: '/sounds/alarm.mp3',
    defaultVolume: 90,
    priority: 4,
    loop: true,
    fadeIn: 0,
    fadeOut: 0,
  },
  emergency: {
    type: 'emergency',
    path: '/sounds/emergency.mp3',
    defaultVolume: 100,
    priority: 5,
    loop: true,
    fadeIn: 0,
    fadeOut: 0,
  },
};

// Map severity to sound type
const SEVERITY_SOUND_MAP: Record<AlertSeverity, SoundType> = {
  low: 'notification',
  medium: 'alert',
  high: 'warning',
  critical: 'alarm',
};

// Volume multipliers based on severity (applied to user volume)
const SEVERITY_VOLUME_MULTIPLIER: Record<AlertSeverity, number> = {
  low: 0.6,
  medium: 0.7,
  high: 0.9,
  critical: 1.0,
};

// =============================================================================
// Sound Manager Class
// =============================================================================

class SoundManager {
  private activeSounds: Map<string, ActiveSound> = new Map();
  private preloadedAudio: Map<SoundType, HTMLAudioElement> = new Map();
  private userVolume: number = 70;  // 0-100, user preference
  private globalMute: boolean = false;
  private emergencyModeActive: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Preload will be called on first interaction
  }

  /**
   * Initialize and preload sounds (call after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const preloadPromises = Object.values(SOUND_CONFIGS).map(async (config) => {
      try {
        const audio = new Audio(config.path);
        audio.preload = 'auto';
        audio.load();
        this.preloadedAudio.set(config.type, audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${config.type}`, error);
      }
    });

    await Promise.all(preloadPromises);
    this.isInitialized = true;
  }

  /**
   * Set user volume preference (0-100)
   */
  setUserVolume(volume: number): void {
    this.userVolume = Math.max(0, Math.min(100, volume));
    
    // Update volume of currently playing sounds (except emergency)
    this.activeSounds.forEach((sound) => {
      if (sound.type !== 'emergency' && !this.emergencyModeActive) {
        sound.audio.volume = this.calculateVolume(sound.type);
      }
    });
  }

  /**
   * Get current user volume
   */
  getUserVolume(): number {
    return this.userVolume;
  }

  /**
   * Set global mute (does not affect emergency sounds)
   */
  setGlobalMute(muted: boolean): void {
    this.globalMute = muted;
    
    // Mute/unmute active sounds (except emergency)
    this.activeSounds.forEach((sound) => {
      if (sound.type !== 'emergency') {
        sound.audio.muted = muted;
      }
    });
  }

  /**
   * Get global mute state
   */
  isGlobalMuted(): boolean {
    return this.globalMute;
  }

  /**
   * Set emergency mode (overrides all volume to 100%)
   */
  setEmergencyMode(active: boolean): void {
    this.emergencyModeActive = active;
    
    if (active) {
      // Set all active sounds to max volume
      this.activeSounds.forEach((sound) => {
        sound.audio.volume = 1.0;
        sound.audio.muted = false;
      });
    } else {
      // Restore normal volumes
      this.activeSounds.forEach((sound) => {
        sound.audio.volume = this.calculateVolume(sound.type);
        if (this.globalMute && sound.type !== 'emergency') {
          sound.audio.muted = true;
        }
      });
    }
  }

  /**
   * Check if emergency mode is active
   */
  isEmergencyModeActive(): boolean {
    return this.emergencyModeActive;
  }

  /**
   * Play a sound by type
   */
  play(type: SoundType, options: PlayOptions = {}): string {
    const config = SOUND_CONFIGS[type];
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create audio element
    const audio = new Audio(config.path);
    
    // Calculate volume
    let volume = this.calculateVolume(type, options.volume);
    if (options.forceMaxVolume || this.emergencyModeActive || type === 'emergency') {
      volume = 1.0;
    }
    audio.volume = volume;

    // Set loop
    audio.loop = options.loop !== undefined ? options.loop : config.loop;

    // Apply mute (never mute emergency)
    if (this.globalMute && type !== 'emergency' && !this.emergencyModeActive) {
      audio.muted = true;
    }

    // Stop lower priority sounds if needed
    this.handlePriority(config.priority);

    // Store active sound
    const activeSound: ActiveSound = {
      id,
      type,
      audio,
      priority: config.priority,
      startTime: Date.now(),
      loop: audio.loop,
      onEnd: options.onEnd,
    };
    this.activeSounds.set(id, activeSound);

    // Handle fade in
    const fadeIn = options.fadeIn !== undefined ? options.fadeIn : config.fadeIn;
    if (fadeIn > 0) {
      audio.volume = 0;
      this.fadeVolume(audio, 0, volume, fadeIn);
    }

    // Handle end event
    audio.addEventListener('ended', () => {
      if (!audio.loop) {
        this.activeSounds.delete(id);
        if (options.onEnd) {
          options.onEnd();
        }
      }
    });

    // Play
    audio.play().catch((error) => {
      console.warn('Failed to play sound:', error);
      this.activeSounds.delete(id);
    });

    return id;
  }

  /**
   * Play sound based on alert severity
   */
  playForSeverity(severity: AlertSeverity, options: PlayOptions = {}): string {
    const type = SEVERITY_SOUND_MAP[severity];
    const volumeMultiplier = SEVERITY_VOLUME_MULTIPLIER[severity];
    
    return this.play(type, {
      ...options,
      volume: options.volume !== undefined 
        ? options.volume 
        : this.userVolume * volumeMultiplier,
    });
  }

  /**
   * Start emergency alarm (loops continuously)
   */
  startEmergencyAlarm(): string {
    this.setEmergencyMode(true);
    return this.play('emergency', {
      loop: true,
      forceMaxVolume: true,
    });
  }

  /**
   * Stop emergency alarm
   */
  stopEmergencyAlarm(): void {
    // Stop all emergency sounds
    this.activeSounds.forEach((sound, id) => {
      if (sound.type === 'emergency') {
        this.stop(id);
      }
    });
    this.setEmergencyMode(false);
  }

  /**
   * Stop a specific sound
   */
  stop(id: string, fadeOut?: number): void {
    const sound = this.activeSounds.get(id);
    if (!sound) return;

    const config = SOUND_CONFIGS[sound.type];
    const fade = fadeOut !== undefined ? fadeOut : config.fadeOut;

    if (fade > 0) {
      this.fadeVolume(sound.audio, sound.audio.volume, 0, fade, () => {
        sound.audio.pause();
        sound.audio.currentTime = 0;
        this.activeSounds.delete(id);
      });
    } else {
      sound.audio.pause();
      sound.audio.currentTime = 0;
      this.activeSounds.delete(id);
    }
  }

  /**
   * Stop all sounds of a specific type
   */
  stopByType(type: SoundType): void {
    this.activeSounds.forEach((sound, id) => {
      if (sound.type === type) {
        this.stop(id);
      }
    });
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.activeSounds.forEach((_, id) => {
      this.stop(id, 0);
    });
  }

  /**
   * Get all currently playing sounds
   */
  getActiveSounds(): ActiveSound[] {
    return Array.from(this.activeSounds.values());
  }

  /**
   * Check if any sound is currently playing
   */
  isPlaying(): boolean {
    return this.activeSounds.size > 0;
  }

  /**
   * Check if a specific type is playing
   */
  isPlayingType(type: SoundType): boolean {
    return Array.from(this.activeSounds.values()).some((s) => s.type === type);
  }

  /**
   * Test a specific sound (plays once at current volume)
   */
  test(type: SoundType): string {
    return this.play(type, {
      loop: false,
      fadeIn: 0,
      fadeOut: 200,
    });
  }

  /**
   * Test emergency mode (plays for 2 seconds then stops)
   */
  testEmergency(): void {
    const id = this.startEmergencyAlarm();
    setTimeout(() => {
      this.stopEmergencyAlarm();
    }, 2000);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Calculate effective volume based on settings
   */
  private calculateVolume(type: SoundType, override?: number): number {
    if (this.emergencyModeActive) {
      return 1.0;
    }

    const config = SOUND_CONFIGS[type];
    const baseVolume = override !== undefined ? override : this.userVolume;
    
    // Apply priority-based minimum volumes
    const minVolumes: Record<number, number> = {
      1: 0,     // notification - can be silent
      2: 0,     // alert - can be silent
      3: 30,    // warning - minimum 30%
      4: 50,    // alarm - minimum 50%
      5: 100,   // emergency - always 100%
    };

    const minVolume = minVolumes[config.priority] || 0;
    const effectiveVolume = Math.max(baseVolume, minVolume);
    
    return effectiveVolume / 100;
  }

  /**
   * Handle priority - stop lower priority sounds if too many
   */
  private handlePriority(newPriority: number): void {
    const maxConcurrentSounds = 3;
    
    if (this.activeSounds.size >= maxConcurrentSounds) {
      // Find lowest priority sound to stop
      let lowestPriority = Infinity;
      let lowestId: string | null = null;
      
      this.activeSounds.forEach((sound, id) => {
        if (sound.priority < lowestPriority && sound.priority < newPriority) {
          lowestPriority = sound.priority;
          lowestId = id;
        }
      });
      
      if (lowestId) {
        this.stop(lowestId, 0);
      }
    }
  }

  /**
   * Fade volume smoothly
   */
  private fadeVolume(
    audio: HTMLAudioElement,
    from: number,
    to: number,
    duration: number,
    onComplete?: () => void
  ): void {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (to - from) / steps;
    let currentStep = 0;

    audio.volume = from;

    const fade = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, Math.min(1, from + volumeStep * currentStep));

      if (currentStep >= steps) {
        clearInterval(fade);
        audio.volume = to;
        if (onComplete) {
          onComplete();
        }
      }
    }, stepDuration);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let instance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!instance) {
    instance = new SoundManager();
  }
  return instance;
}

// =============================================================================
// React Hook
// =============================================================================

import { useEffect, useState, useCallback } from 'react';

export function useSoundManager() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  const manager = getSoundManager();

  useEffect(() => {
    const initManager = async () => {
      await manager.initialize();
      setIsInitialized(true);
      setVolume(manager.getUserVolume());
      setMuted(manager.isGlobalMuted());
      setEmergencyMode(manager.isEmergencyModeActive());
    };
    
    initManager();
  }, []);

  const updateVolume = useCallback((newVolume: number) => {
    manager.setUserVolume(newVolume);
    setVolume(newVolume);
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !manager.isGlobalMuted();
    manager.setGlobalMute(newMuted);
    setMuted(newMuted);
  }, []);

  const play = useCallback((type: SoundType, options?: PlayOptions) => {
    return manager.play(type, options);
  }, []);

  const playForSeverity = useCallback((severity: AlertSeverity, options?: PlayOptions) => {
    return manager.playForSeverity(severity, options);
  }, []);

  const startEmergency = useCallback(() => {
    setEmergencyMode(true);
    return manager.startEmergencyAlarm();
  }, []);

  const stopEmergency = useCallback(() => {
    setEmergencyMode(false);
    manager.stopEmergencyAlarm();
  }, []);

  const stop = useCallback((id: string) => {
    manager.stop(id);
  }, []);

  const stopAll = useCallback(() => {
    manager.stopAll();
  }, []);

  const test = useCallback((type: SoundType) => {
    return manager.test(type);
  }, []);

  const testEmergency = useCallback(() => {
    manager.testEmergency();
  }, []);

  return {
    isInitialized,
    volume,
    muted,
    emergencyMode,
    updateVolume,
    toggleMute,
    play,
    playForSeverity,
    startEmergency,
    stopEmergency,
    stop,
    stopAll,
    test,
    testEmergency,
    isPlaying: () => manager.isPlaying(),
    getActiveSounds: () => manager.getActiveSounds(),
  };
}

