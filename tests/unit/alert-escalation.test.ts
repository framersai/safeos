/**
 * Alert Escalation Unit Tests
 *
 * Tests for the volume-ramping escalation system.
 *
 * @module tests/unit/alert-escalation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AlertEscalationManager,
  ESCALATION_LEVELS,
  getStartingLevel,
} from '../../src/lib/alerts/escalation.js';

// =============================================================================
// Test Suite
// =============================================================================

describe('AlertEscalationManager', () => {
  let manager: AlertEscalationManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new AlertEscalationManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ===========================================================================
  // Starting Level Tests
  // ===========================================================================

  describe('getStartingLevel', () => {
    it('should return level 0 for low severity', () => {
      expect(getStartingLevel('low')).toBe(0);
    });

    it('should return level 1 for medium severity', () => {
      expect(getStartingLevel('medium')).toBe(1);
    });

    it('should return level 2 for high severity', () => {
      expect(getStartingLevel('high')).toBe(2);
    });

    it('should return level 3 for critical severity', () => {
      expect(getStartingLevel('critical')).toBe(3);
    });
  });

  // ===========================================================================
  // Alert Start Tests
  // ===========================================================================

  describe('startAlert', () => {
    it('should start an alert at the correct level', () => {
      manager.startAlert('alert-1', 'medium');

      const level = manager.getAlertLevel('alert-1');

      expect(level).toBe(1);
    });

    it('should track multiple alerts independently', () => {
      manager.startAlert('alert-1', 'low');
      manager.startAlert('alert-2', 'critical');

      expect(manager.getAlertLevel('alert-1')).toBe(0);
      expect(manager.getAlertLevel('alert-2')).toBe(3);
    });
  });

  // ===========================================================================
  // Volume Tests
  // ===========================================================================

  describe('getVolume', () => {
    it('should return correct volume for each level', () => {
      ESCALATION_LEVELS.forEach((level, index) => {
        manager.startAlert(`alert-${index}`, 'low');
        // Manually set level for testing
        (manager as any).activeAlerts.get(`alert-${index}`).currentLevel = index;

        const volume = manager.getVolume(`alert-${index}`);
        expect(volume).toBe(level.volume);
      });
    });

    it('should return 0 for unknown alert', () => {
      expect(manager.getVolume('unknown')).toBe(0);
    });
  });

  // ===========================================================================
  // Sound Tests
  // ===========================================================================

  describe('getSound', () => {
    it('should return correct sound for each level', () => {
      manager.startAlert('test-alert', 'low');

      const sound = manager.getSound('test-alert');

      expect(sound).toBe(ESCALATION_LEVELS[0].sound);
    });

    it('should return null for unknown alert', () => {
      expect(manager.getSound('unknown')).toBeNull();
    });
  });

  // ===========================================================================
  // Escalation Tests
  // ===========================================================================

  describe('escalation over time', () => {
    it('should escalate to next level after timeout', () => {
      manager.startAlert('test-alert', 'low');
      expect(manager.getAlertLevel('test-alert')).toBe(0);

      // Fast forward past first level timeout
      vi.advanceTimersByTime(ESCALATION_LEVELS[0].duration + 100);

      expect(manager.getAlertLevel('test-alert')).toBe(1);
    });

    it('should continue escalating through levels', () => {
      manager.startAlert('test-alert', 'low');

      // Escalate through all levels
      for (let i = 0; i < ESCALATION_LEVELS.length - 1; i++) {
        vi.advanceTimersByTime(ESCALATION_LEVELS[i].duration + 100);
      }

      // Should be at max level
      expect(manager.getAlertLevel('test-alert')).toBe(ESCALATION_LEVELS.length - 1);
    });

    it('should not exceed maximum level', () => {
      manager.startAlert('test-alert', 'critical');

      // Fast forward a lot
      vi.advanceTimersByTime(1000000);

      expect(manager.getAlertLevel('test-alert')).toBeLessThan(ESCALATION_LEVELS.length);
    });
  });

  // ===========================================================================
  // Acknowledge Tests
  // ===========================================================================

  describe('acknowledgeAlert', () => {
    it('should stop escalation when acknowledged', () => {
      manager.startAlert('test-alert', 'medium');

      const acknowledged = manager.acknowledgeAlert('test-alert');

      expect(acknowledged).toBe(true);
      expect(manager.getAlertLevel('test-alert')).toBe(-1); // Cleared
    });

    it('should return false for unknown alert', () => {
      const acknowledged = manager.acknowledgeAlert('unknown');

      expect(acknowledged).toBe(false);
    });

    it('should clear timers on acknowledge', () => {
      manager.startAlert('test-alert', 'low');
      manager.acknowledgeAlert('test-alert');

      // Fast forward - should not escalate
      vi.advanceTimersByTime(1000000);

      expect(manager.getAlertLevel('test-alert')).toBe(-1);
    });
  });

  // ===========================================================================
  // Active Alert Tests
  // ===========================================================================

  describe('active alerts', () => {
    it('should list all active alerts', () => {
      manager.startAlert('alert-1', 'low');
      manager.startAlert('alert-2', 'high');
      manager.startAlert('alert-3', 'medium');

      const active = manager.getActiveAlerts();

      expect(active).toHaveLength(3);
      expect(active.map(a => a.id).sort()).toEqual(['alert-1', 'alert-2', 'alert-3']);
    });

    it('should not include acknowledged alerts', () => {
      manager.startAlert('alert-1', 'low');
      manager.startAlert('alert-2', 'high');
      manager.acknowledgeAlert('alert-1');

      const active = manager.getActiveAlerts();

      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('alert-2');
    });
  });

  // ===========================================================================
  // Cleanup Tests
  // ===========================================================================

  describe('cleanup', () => {
    it('should clear all alerts on destroy', () => {
      manager.startAlert('alert-1', 'low');
      manager.startAlert('alert-2', 'high');

      manager.destroy();

      expect(manager.getActiveAlerts()).toHaveLength(0);
    });
  });
});














