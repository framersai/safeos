/**
 * Escalation Tests
 *
 * Unit tests for alert escalation logic.
 *
 * @module tests/unit/escalation.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AlertEscalationManager,
  ESCALATION_LEVELS,
} from '../../src/lib/alerts/escalation';

describe('AlertEscalationManager', () => {
  let manager: AlertEscalationManager;

  beforeEach(() => {
    manager = new AlertEscalationManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    manager.clearAll();
    vi.useRealTimers();
  });

  describe('startAlert', () => {
    it('should create an escalation for info severity at level 1', () => {
      const escalation = manager.startAlert('alert-1', 'stream-1', 'info');

      expect(escalation.alertId).toBe('alert-1');
      expect(escalation.streamId).toBe('stream-1');
      expect(escalation.currentLevel).toBe(1);
      expect(escalation.acknowledged).toBe(false);
    });

    it('should create an escalation for high severity at level 3', () => {
      const escalation = manager.startAlert('alert-2', 'stream-1', 'high');

      expect(escalation.currentLevel).toBe(3);
    });

    it('should create an escalation for critical severity at level 4', () => {
      const escalation = manager.startAlert('alert-3', 'stream-1', 'critical');

      expect(escalation.currentLevel).toBe(4);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', () => {
      manager.startAlert('alert-1', 'stream-1', 'medium');

      const result = manager.acknowledgeAlert('alert-1');

      expect(result).toBe(true);

      const escalation = manager.getEscalation('alert-1');
      expect(escalation?.acknowledged).toBe(true);
      expect(escalation?.acknowledgedAt).toBeDefined();
    });

    it('should return false for non-existent alert', () => {
      const result = manager.acknowledgeAlert('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getAlertLevel', () => {
    it('should return current level', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');

      const level = manager.getAlertLevel('alert-1');
      expect(level).toBe(1);
    });

    it('should return 0 for non-existent alert', () => {
      const level = manager.getAlertLevel('non-existent');
      expect(level).toBe(0);
    });

    it('should escalate after delay', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');

      // Advance time by 31 seconds (past level 2 threshold)
      vi.advanceTimersByTime(31000);

      const level = manager.getAlertLevel('alert-1');
      expect(level).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getVolume', () => {
    it('should return appropriate volume for level', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');

      const volume = manager.getVolume('alert-1');
      expect(volume).toBe(0.3); // Level 1 volume

      // Advance to level 2
      vi.advanceTimersByTime(31000);

      const volume2 = manager.getVolume('alert-1');
      expect(volume2).toBe(0.5); // Level 2 volume
    });
  });

  describe('getSound', () => {
    it('should return appropriate sound for level', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');

      const sound = manager.getSound('alert-1');
      expect(sound).toBe('notification');
    });
  });

  describe('getActiveAlerts', () => {
    it('should return unacknowledged alerts', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');
      manager.startAlert('alert-2', 'stream-1', 'medium');
      manager.startAlert('alert-3', 'stream-1', 'high');

      manager.acknowledgeAlert('alert-2');

      const active = manager.getActiveAlerts();
      expect(active.length).toBe(2);
      expect(active.map((a) => a.alertId)).toContain('alert-1');
      expect(active.map((a) => a.alertId)).toContain('alert-3');
    });
  });

  describe('clearAlert', () => {
    it('should remove alert from tracking', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');
      manager.clearAlert('alert-1');

      const escalation = manager.getEscalation('alert-1');
      expect(escalation).toBeUndefined();
    });
  });

  describe('ESCALATION_LEVELS', () => {
    it('should have 5 levels', () => {
      expect(ESCALATION_LEVELS.length).toBe(5);
    });

    it('should have increasing volumes', () => {
      for (let i = 1; i < ESCALATION_LEVELS.length; i++) {
        expect(ESCALATION_LEVELS[i].volume).toBeGreaterThan(
          ESCALATION_LEVELS[i - 1].volume
        );
      }
    });

    it('should have increasing delays', () => {
      for (let i = 1; i < ESCALATION_LEVELS.length; i++) {
        expect(ESCALATION_LEVELS[i].delay).toBeGreaterThan(
          ESCALATION_LEVELS[i - 1].delay
        );
      }
    });
  });
});

