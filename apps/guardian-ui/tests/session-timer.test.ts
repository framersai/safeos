/**
 * Session Timer Tests
 * 
 * Unit tests for the session timer system.
 * 
 * @module tests/session-timer.test
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => localStorageMock.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  }),
};

// Setup global mocks
(global as any).localStorage = localStorageMock;
(global as any).window = { localStorage: localStorageMock };
(global as any).document = {
  hidden: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

import {
  SessionTimer,
  getSessionTimer,
  resetSessionTimer,
  formatDuration,
  getUrgencyLevel,
  getUrgencyColor,
  DEFAULT_SESSION_CONFIG,
} from '../src/lib/session-timer';

describe('SessionTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorageMock.clear();
    resetSessionTimer();
  });

  afterEach(() => {
    jest.useRealTimers();
    resetSessionTimer();
  });

  describe('initialization', () => {
    it('should create timer with default config', () => {
      const timer = new SessionTimer();
      const state = timer.getState();

      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.startTime).toBeNull();
      expect(state.expiresAt).toBeNull();
    });

    it('should accept custom config', () => {
      const timer = new SessionTimer({ durationHours: 12 });
      timer.start();
      const state = timer.getState();

      expect(state.isActive).toBe(true);
      // Duration should be 12 hours
      const expectedMs = 12 * 60 * 60 * 1000;
      expect(state.remainingMs).toBeCloseTo(expectedMs, -3);
    });

    it('should clamp duration to max 24 hours', () => {
      const timer = new SessionTimer({ durationHours: 48 });
      timer.start();
      const state = timer.getState();

      // Should be clamped to 24 hours
      const expectedMs = 24 * 60 * 60 * 1000;
      expect(state.remainingMs).toBeCloseTo(expectedMs, -3);
    });

    it('should clamp duration to min 1 hour', () => {
      const timer = new SessionTimer({ durationHours: 0.5 });
      timer.start();
      const state = timer.getState();

      // Should be clamped to 1 hour
      const expectedMs = 1 * 60 * 60 * 1000;
      expect(state.remainingMs).toBeCloseTo(expectedMs, -3);
    });
  });

  describe('start', () => {
    it('should start the timer', () => {
      const timer = new SessionTimer();
      timer.start();
      const state = timer.getState();

      expect(state.isActive).toBe(true);
      expect(state.startTime).not.toBeNull();
      expect(state.expiresAt).not.toBeNull();
    });

    it('should allow custom duration on start', () => {
      const timer = new SessionTimer();
      timer.start(8);
      const state = timer.getState();

      const expectedMs = 8 * 60 * 60 * 1000;
      expect(state.remainingMs).toBeCloseTo(expectedMs, -3);
    });

    it('should save state to localStorage', () => {
      const timer = new SessionTimer();
      timer.start();

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the timer', () => {
      const timer = new SessionTimer();
      timer.start();
      timer.stop();
      const state = timer.getState();

      expect(state.isActive).toBe(false);
      expect(state.startTime).toBeNull();
      expect(state.expiresAt).toBeNull();
    });

    it('should clear localStorage', () => {
      const timer = new SessionTimer();
      timer.start();
      timer.stop();

      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('pause and resume', () => {
    it('should pause the timer', () => {
      const timer = new SessionTimer();
      timer.start();
      timer.pause();
      const state = timer.getState();

      expect(state.isPaused).toBe(true);
    });

    it('should resume the timer', () => {
      const timer = new SessionTimer();
      timer.start();
      timer.pause();
      timer.resume();
      const state = timer.getState();

      expect(state.isPaused).toBe(false);
      expect(state.isActive).toBe(true);
    });

    it('should not pause if not active', () => {
      const timer = new SessionTimer();
      timer.pause();
      const state = timer.getState();

      expect(state.isPaused).toBe(false);
    });
  });

  describe('extend', () => {
    it('should extend the session', () => {
      const timer = new SessionTimer({ durationHours: 1 });
      timer.start();
      
      const initialRemaining = timer.getState().remainingMs;
      timer.extend(2);
      const extendedRemaining = timer.getState().remainingMs;

      // Should be extended by 2 hours
      const expectedIncrease = 2 * 60 * 60 * 1000;
      expect(extendedRemaining).toBeCloseTo(initialRemaining + expectedIncrease, -3);
    });

    it('should cap extension at 24 hours max', () => {
      const timer = new SessionTimer({ durationHours: 20 });
      timer.start();
      timer.extend(10); // Try to extend to 30 hours
      
      const state = timer.getState();
      const maxMs = 24 * 60 * 60 * 1000;
      
      expect(state.remainingMs).toBeLessThanOrEqual(maxMs);
    });

    it('should not extend if not active', () => {
      const timer = new SessionTimer();
      timer.extend(2);
      const state = timer.getState();

      expect(state.remainingMs).toBe(0);
    });
  });

  describe('isExpired', () => {
    it('should return false when not started', () => {
      const timer = new SessionTimer();
      expect(timer.isExpired()).toBe(false);
    });

    it('should return false when active and time remaining', () => {
      const timer = new SessionTimer({ durationHours: 1 });
      timer.start();
      expect(timer.isExpired()).toBe(false);
    });
  });

  describe('formatted time', () => {
    it('should return formatted time', () => {
      const timer = new SessionTimer({ durationHours: 1 });
      timer.start();
      
      const formatted = timer.getFormattedRemaining();
      expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should return 00:00:00 when not started', () => {
      const timer = new SessionTimer();
      expect(timer.getFormattedRemaining()).toBe('00:00:00');
    });
  });

  describe('callbacks', () => {
    it('should call onExpire when session expires', () => {
      const onExpire = jest.fn();
      const timer = new SessionTimer({
        durationHours: 1,
        onExpire,
      });
      
      timer.start();
      
      // Fast forward past expiry
      jest.advanceTimersByTime(60 * 60 * 1000 + 1000);
      
      expect(onExpire).toHaveBeenCalled();
    });

    it('should call onWarning at warning thresholds', () => {
      const onWarning = jest.fn();
      const timer = new SessionTimer({
        durationHours: 1,
        warningThresholds: [60], // Warn at 60 minutes
        onWarning,
      });
      
      timer.start();
      
      // Timer ticks every second, should trigger 60-minute warning immediately
      jest.advanceTimersByTime(1000);
      
      // The warning should have been triggered
      expect(onWarning).toHaveBeenCalled();
    });
  });
});

describe('Singleton Functions', () => {
  beforeEach(() => {
    localStorageMock.clear();
    resetSessionTimer();
  });

  afterEach(() => {
    resetSessionTimer();
  });

  it('should return same instance', () => {
    const timer1 = getSessionTimer();
    const timer2 = getSessionTimer();
    
    expect(timer1).toBe(timer2);
  });

  it('should update config on existing instance', () => {
    const timer1 = getSessionTimer({ durationHours: 12 });
    timer1.start();
    
    const timer2 = getSessionTimer({ durationHours: 6 });
    timer2.start(6);
    
    expect(timer2.getState().remainingMs).toBeCloseTo(6 * 60 * 60 * 1000, -3);
  });
});

describe('Utility Functions', () => {
  describe('formatDuration', () => {
    it('should format hours correctly', () => {
      expect(formatDuration(1)).toBe('1 hour');
      expect(formatDuration(2)).toBe('2 hours');
      expect(formatDuration(24)).toBe('24 hours (1 day)');
    });

    it('should format sub-hour durations', () => {
      expect(formatDuration(0.5)).toBe('30 minutes');
    });
  });

  describe('getUrgencyLevel', () => {
    it('should return correct urgency levels', () => {
      expect(getUrgencyLevel(120)).toBe('none');
      expect(getUrgencyLevel(30)).toBe('low');
      expect(getUrgencyLevel(10)).toBe('medium');
      expect(getUrgencyLevel(3)).toBe('high');
      expect(getUrgencyLevel(0.5)).toBe('critical');
    });
  });

  describe('getUrgencyColor', () => {
    it('should return correct colors', () => {
      expect(getUrgencyColor('critical')).toBe('red');
      expect(getUrgencyColor('high')).toBe('orange');
      expect(getUrgencyColor('medium')).toBe('yellow');
      expect(getUrgencyColor('low')).toBe('blue');
      expect(getUrgencyColor('none')).toBe('green');
    });
  });
});






