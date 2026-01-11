/**
 * Alert Escalation Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AlertEscalationManager,
  ESCALATION_LEVELS,
} from '../src/lib/alerts/escalation.js';

describe('AlertEscalationManager', () => {
  let manager: AlertEscalationManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new AlertEscalationManager();
  });

  afterEach(() => {
    manager.clearAll();
    vi.useRealTimers();
  });

  describe('escalation levels', () => {
    it('should have 5 escalation levels', () => {
      expect(ESCALATION_LEVELS).toHaveLength(5);
    });

    it('should have increasing delays', () => {
      for (let i = 1; i < ESCALATION_LEVELS.length; i++) {
        expect(ESCALATION_LEVELS[i].delay).toBeGreaterThan(
          ESCALATION_LEVELS[i - 1].delay
        );
      }
    });

    it('should have increasing volumes', () => {
      for (let i = 1; i < ESCALATION_LEVELS.length; i++) {
        expect(ESCALATION_LEVELS[i].volume).toBeGreaterThanOrEqual(
          ESCALATION_LEVELS[i - 1].volume
        );
      }
    });
  });

  describe('alert tracking', () => {
    it('should start tracking a new alert', () => {
      manager.startAlert('alert-1', 'stream-1', 'medium');

      const level = manager.getAlertLevel('alert-1');
      expect(level).toBe(2); // Medium starts at level 2
    });

    it('should acknowledge an alert', () => {
      manager.startAlert('alert-1', 'stream-1', 'medium');

      const result = manager.acknowledgeAlert('alert-1');
      expect(result).toBe(true);

      const escalation = manager.getEscalation('alert-1');
      expect(escalation?.acknowledged).toBe(true);
    });

    it('should return false when acknowledging non-existent alert', () => {
      const result = manager.acknowledgeAlert('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('severity to level mapping', () => {
    it('should start info alerts at level 1', () => {
      manager.startAlert('alert-1', 'stream-1', 'info');
      expect(manager.getAlertLevel('alert-1')).toBe(1);
    });

    it('should start low alerts at level 1', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');
      expect(manager.getAlertLevel('alert-1')).toBe(1);
    });

    it('should start medium alerts at level 2', () => {
      manager.startAlert('alert-1', 'stream-1', 'medium');
      expect(manager.getAlertLevel('alert-1')).toBe(2);
    });

    it('should start high alerts at level 3', () => {
      manager.startAlert('alert-1', 'stream-1', 'high');
      expect(manager.getAlertLevel('alert-1')).toBe(3);
    });

    it('should start critical alerts at level 4', () => {
      manager.startAlert('alert-1', 'stream-1', 'critical');
      expect(manager.getAlertLevel('alert-1')).toBe(4);
    });
  });

  describe('volume calculation', () => {
    it('should return fallback volume for unknown alerts', () => {
      expect(manager.getVolume('unknown')).toBe(0.3);
    });

    it('should return appropriate volume for level', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');

      const volume = manager.getVolume('alert-1');
      expect(volume).toBeGreaterThanOrEqual(0);
      expect(volume).toBeLessThanOrEqual(1);
    });
  });

  describe('sound selection', () => {
    it('should return fallback sound for unknown alerts', () => {
      expect(manager.getSound('unknown')).toBe('notification');
    });

    it('should return appropriate sound for level', () => {
      manager.startAlert('alert-1', 'stream-1', 'critical');

      const sound = manager.getSound('alert-1');
      expect(['notification', 'alert', 'warning', 'alarm', 'emergency']).toContain(sound);
    });
  });

  describe('active alerts', () => {
    it('should track active alerts', () => {
      manager.startAlert('alert-1', 'stream-1', 'info');
      manager.startAlert('alert-2', 'stream-1', 'medium');
      manager.startAlert('alert-3', 'stream-1', 'high');

      const active = manager.getActiveAlerts();
      expect(active).toHaveLength(3);
    });

    it('should exclude acknowledged alerts from active list', () => {
      manager.startAlert('alert-1', 'stream-1', 'low');
      manager.startAlert('alert-2', 'stream-1', 'high');
      manager.acknowledgeAlert('alert-1');

      const active = manager.getActiveAlerts();
      expect(active).toHaveLength(1);
      expect(active[0].alertId).toBe('alert-2');
    });
  });

  describe('cleanup', () => {
    it('should clear all alerts', () => {
      manager.startAlert('alert-1', 'stream-1', 'info');
      manager.startAlert('alert-2', 'stream-1', 'medium');
      manager.startAlert('alert-3', 'stream-1', 'high');

      manager.clearAll();

      const active = manager.getActiveAlerts();
      expect(active).toHaveLength(0);
    });
  });
});
