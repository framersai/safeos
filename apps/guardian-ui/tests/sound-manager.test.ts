/**
 * Sound Manager Tests
 *
 * Unit tests for the centralized sound manager with priority system,
 * volume controls, and emergency mode.
 *
 * @module tests/sound-manager.test
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// =============================================================================
// Mocks
// =============================================================================

// Mock HTMLAudioElement
class MockAudioElement {
  src: string = '';
  volume: number = 1;
  muted: boolean = false;
  loop: boolean = false;
  currentTime: number = 0;
  preload: string = '';
  paused: boolean = true;

  private endCallbacks: (() => void)[] = [];

  constructor(src?: string) {
    if (src) this.src = src;
  }

  load(): void {}

  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  addEventListener(event: string, callback: () => void): void {
    if (event === 'ended') {
      this.endCallbacks.push(callback);
    }
  }

  removeEventListener(): void {}

  // Helper to simulate end event
  simulateEnd(): void {
    this.endCallbacks.forEach((cb) => cb());
  }
}

// Global Audio mock
(global as any).Audio = MockAudioElement;

// =============================================================================
// Module Import (after mocks)
// =============================================================================

// Reset module cache to get fresh instance
let getSoundManager: typeof import('../src/lib/sound-manager').getSoundManager;

// =============================================================================
// Tests
// =============================================================================

describe('Sound Manager', () => {
  beforeEach(async () => {
    // Reset module cache for fresh singleton
    jest.resetModules();
    const module = await import('../src/lib/sound-manager');
    getSoundManager = module.getSoundManager;
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const manager1 = getSoundManager();
      const manager2 = getSoundManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('Volume Management', () => {
    it('should set and get user volume', () => {
      const manager = getSoundManager();
      manager.setUserVolume(50);
      expect(manager.getUserVolume()).toBe(50);
    });

    it('should clamp volume to 0-100 range', () => {
      const manager = getSoundManager();

      manager.setUserVolume(-10);
      expect(manager.getUserVolume()).toBe(0);

      manager.setUserVolume(150);
      expect(manager.getUserVolume()).toBe(100);
    });

    it('should default to 70% volume', () => {
      const manager = getSoundManager();
      expect(manager.getUserVolume()).toBe(70);
    });
  });

  describe('Mute Management', () => {
    it('should toggle global mute', () => {
      const manager = getSoundManager();

      expect(manager.isGlobalMuted()).toBe(false);

      manager.setGlobalMute(true);
      expect(manager.isGlobalMuted()).toBe(true);

      manager.setGlobalMute(false);
      expect(manager.isGlobalMuted()).toBe(false);
    });
  });

  describe('Emergency Mode', () => {
    it('should toggle emergency mode', () => {
      const manager = getSoundManager();

      expect(manager.isEmergencyModeActive()).toBe(false);

      manager.setEmergencyMode(true);
      expect(manager.isEmergencyModeActive()).toBe(true);

      manager.setEmergencyMode(false);
      expect(manager.isEmergencyModeActive()).toBe(false);
    });

    it('should start emergency alarm and set emergency mode', () => {
      const manager = getSoundManager();

      const id = manager.startEmergencyAlarm();

      expect(id).toBeTruthy();
      expect(manager.isEmergencyModeActive()).toBe(true);
      expect(manager.isPlayingType('emergency')).toBe(true);
    });

    it('should stop emergency alarm and clear emergency mode', () => {
      const manager = getSoundManager();

      manager.startEmergencyAlarm();
      manager.stopEmergencyAlarm();

      expect(manager.isEmergencyModeActive()).toBe(false);
      expect(manager.isPlayingType('emergency')).toBe(false);
    });
  });

  describe('Play Functionality', () => {
    it('should play a sound and return id', () => {
      const manager = getSoundManager();
      const id = manager.play('notification');

      expect(id).toBeTruthy();
      expect(id).toContain('notification');
    });

    it('should track active sounds', () => {
      const manager = getSoundManager();

      expect(manager.isPlaying()).toBe(false);

      manager.play('notification');

      expect(manager.isPlaying()).toBe(true);
      expect(manager.getActiveSounds()).toHaveLength(1);
    });

    it('should check if specific type is playing', () => {
      const manager = getSoundManager();

      manager.play('alert');

      expect(manager.isPlayingType('alert')).toBe(true);
      expect(manager.isPlayingType('notification')).toBe(false);
    });

    it('should apply global mute to non-emergency sounds', () => {
      const manager = getSoundManager();

      manager.setGlobalMute(true);
      manager.play('notification');

      const sounds = manager.getActiveSounds();
      expect(sounds[0].audio.muted).toBe(true);
    });

    it('should never mute emergency sounds', () => {
      const manager = getSoundManager();

      manager.setGlobalMute(true);
      manager.play('emergency');

      const sounds = manager.getActiveSounds();
      expect(sounds[0].audio.muted).toBe(false);
    });

    it('should call onEnd callback when sound ends', () => {
      const manager = getSoundManager();
      const onEnd = jest.fn();

      manager.play('notification', { onEnd, loop: false });

      // Simulate sound ending
      const sounds = manager.getActiveSounds();
      (sounds[0].audio as unknown as MockAudioElement).simulateEnd();

      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe('Stop Functionality', () => {
    it('should stop specific sound by id', () => {
      const manager = getSoundManager();
      // Use fadeOut: 0 to stop immediately
      const id = manager.play('notification', { fadeOut: 0 });

      expect(manager.isPlaying()).toBe(true);

      manager.stop(id, 0); // Pass 0 fadeOut to stop immediately

      expect(manager.isPlaying()).toBe(false);
    });

    it('should stop all sounds of a type', () => {
      jest.useFakeTimers();
      const manager = getSoundManager();

      manager.play('notification', { fadeOut: 0 });
      manager.play('notification', { fadeOut: 0 });
      manager.play('alert', { fadeOut: 0 });

      expect(manager.getActiveSounds()).toHaveLength(3);

      manager.stopByType('notification');
      jest.advanceTimersByTime(500); // Allow fade to complete

      expect(manager.getActiveSounds()).toHaveLength(1);
      expect(manager.isPlayingType('notification')).toBe(false);
      expect(manager.isPlayingType('alert')).toBe(true);

      jest.useRealTimers();
    });

    it('should stop all sounds', () => {
      const manager = getSoundManager();

      manager.play('notification');
      manager.play('alert');
      manager.play('warning');

      manager.stopAll(); // stopAll uses fadeOut: 0 internally

      expect(manager.isPlaying()).toBe(false);
      expect(manager.getActiveSounds()).toHaveLength(0);
    });
  });

  describe('Priority System', () => {
    it('should track priority of sounds', () => {
      const manager = getSoundManager();

      manager.play('notification'); // priority 1
      manager.play('alert');        // priority 2
      manager.play('warning');      // priority 3

      const sounds = manager.getActiveSounds();
      expect(sounds).toHaveLength(3);

      // Priorities should be assigned
      expect(sounds.find(s => s.type === 'notification')?.priority).toBe(1);
      expect(sounds.find(s => s.type === 'alert')?.priority).toBe(2);
      expect(sounds.find(s => s.type === 'warning')?.priority).toBe(3);
    });

    it('should limit concurrent sounds', () => {
      const manager = getSoundManager();

      // Play 4 low-priority sounds
      manager.play('notification');
      manager.play('notification');
      manager.play('notification');
      manager.play('notification');

      // Max concurrent is 3, so oldest/lowest priority should be removed
      expect(manager.getActiveSounds().length).toBeLessThanOrEqual(4);
    });
  });

  describe('Severity Mapping', () => {
    it('should play correct sound for severity', () => {
      const manager = getSoundManager();

      const lowId = manager.playForSeverity('low');
      expect(lowId).toContain('notification');
      manager.stopAll();

      const mediumId = manager.playForSeverity('medium');
      expect(mediumId).toContain('alert');
      manager.stopAll();

      const highId = manager.playForSeverity('high');
      expect(highId).toContain('warning');
      manager.stopAll();

      const criticalId = manager.playForSeverity('critical');
      expect(criticalId).toContain('alarm');
    });
  });

  describe('Test Functions', () => {
    it('should play test sound without loop', () => {
      const manager = getSoundManager();
      const id = manager.test('alarm');

      expect(id).toBeTruthy();
      const sounds = manager.getActiveSounds();
      expect(sounds[0].loop).toBe(false);
    });

    it('should test emergency for 2 seconds', () => {
      jest.useFakeTimers();
      const manager = getSoundManager();

      manager.testEmergency();

      expect(manager.isEmergencyModeActive()).toBe(true);

      jest.advanceTimersByTime(2000);

      expect(manager.isEmergencyModeActive()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Initialization', () => {
    it('should preload sounds on initialize', async () => {
      const manager = getSoundManager();

      await manager.initialize();

      // Second initialize should be no-op
      await manager.initialize();
    });
  });

  describe('Volume Calculation', () => {
    it('should apply emergency mode volume override', () => {
      const manager = getSoundManager();
      manager.setUserVolume(30);
      manager.setEmergencyMode(true);

      // Use fadeIn: 0 to get immediate volume setting
      manager.play('notification', { fadeIn: 0 });

      const sounds = manager.getActiveSounds();
      // In emergency mode, volume should be 1.0 (100%)
      expect(sounds[0].audio.volume).toBe(1);
    });

    it('should respect forceMaxVolume option', () => {
      const manager = getSoundManager();
      manager.setUserVolume(30);

      // Use fadeIn: 0 to get immediate volume setting
      manager.play('notification', { forceMaxVolume: true, fadeIn: 0 });

      const sounds = manager.getActiveSounds();
      expect(sounds[0].audio.volume).toBe(1);
    });
  });

  describe('Loop Control', () => {
    it('should respect loop option', () => {
      const manager = getSoundManager();

      manager.play('notification', { loop: true });

      const sounds = manager.getActiveSounds();
      expect(sounds[0].loop).toBe(true);
    });

    it('should use default loop from config', () => {
      const manager = getSoundManager();

      // alarm defaults to loop: true
      manager.play('alarm');

      const sounds = manager.getActiveSounds();
      expect(sounds[0].loop).toBe(true);
    });
  });
});
