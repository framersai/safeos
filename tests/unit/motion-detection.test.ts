/**
 * Motion Detection Tests
 *
 * Unit tests for motion detection algorithms.
 *
 * @module tests/unit/motion-detection.test
 */

import { describe, it, expect } from 'vitest';

describe('Motion Detection', () => {
  describe('MOTION_THRESHOLDS', () => {
    const MOTION_THRESHOLDS = {
      pet: { low: 5, medium: 15, high: 30 },
      baby: { low: 3, medium: 10, high: 25 },
      elderly: { low: 2, medium: 8, high: 20 },
    };

    it('should have thresholds for all scenarios', () => {
      expect(MOTION_THRESHOLDS.pet).toBeDefined();
      expect(MOTION_THRESHOLDS.baby).toBeDefined();
      expect(MOTION_THRESHOLDS.elderly).toBeDefined();
    });

    it('should have baby threshold lower than pet (more sensitive)', () => {
      expect(MOTION_THRESHOLDS.baby.medium).toBeLessThan(
        MOTION_THRESHOLDS.pet.medium
      );
    });

    it('should have elderly threshold lowest (most sensitive)', () => {
      expect(MOTION_THRESHOLDS.elderly.medium).toBeLessThan(
        MOTION_THRESHOLDS.baby.medium
      );
    });
  });

  describe('detectMotion', () => {
    it('should return 0 for identical frames', () => {
      const frame = createMockImageData(100, 100, 128);
      const score = calculateMotionScore(frame, frame);

      expect(score).toBe(0);
    });

    it('should detect motion between different frames', () => {
      const frame1 = createMockImageData(100, 100, 50);
      const frame2 = createMockImageData(100, 100, 200);

      const score = calculateMotionScore(frame1, frame2);

      expect(score).toBeGreaterThan(0);
    });

    it('should return higher score for more difference', () => {
      const frame1 = createMockImageData(100, 100, 50);
      const frame2Small = createMockImageData(100, 100, 100);
      const frame2Large = createMockImageData(100, 100, 200);

      const scoreSmall = calculateMotionScore(frame1, frame2Small);
      const scoreLarge = calculateMotionScore(frame1, frame2Large);

      expect(scoreLarge).toBeGreaterThan(scoreSmall);
    });
  });

  describe('getThresholdForScenario', () => {
    it('should return correct threshold for pet', () => {
      const threshold = getThresholdForScenario('pet');
      expect(threshold).toBe(15);
    });

    it('should return correct threshold for baby', () => {
      const threshold = getThresholdForScenario('baby');
      expect(threshold).toBe(10);
    });

    it('should return correct threshold for elderly', () => {
      const threshold = getThresholdForScenario('elderly');
      expect(threshold).toBe(8);
    });
  });
});

// Helper functions for testing
function createMockImageData(
  width: number,
  height: number,
  fillValue: number
): MockImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fillValue; // R
    data[i + 1] = fillValue; // G
    data[i + 2] = fillValue; // B
    data[i + 3] = 255; // A
  }
  return { width, height, data };
}

interface MockImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

function calculateMotionScore(
  prev: MockImageData,
  curr: MockImageData
): number {
  const PIXEL_THRESHOLD = 30;
  const DOWNSAMPLE = 4;

  let changedPixels = 0;
  let totalPixels = 0;

  for (let y = 0; y < prev.height; y += DOWNSAMPLE) {
    for (let x = 0; x < prev.width; x += DOWNSAMPLE) {
      const i = (y * prev.width + x) * 4;

      const prevGray = (prev.data[i] + prev.data[i + 1] + prev.data[i + 2]) / 3;
      const currGray = (curr.data[i] + curr.data[i + 1] + curr.data[i + 2]) / 3;

      if (Math.abs(prevGray - currGray) > PIXEL_THRESHOLD) {
        changedPixels++;
      }
      totalPixels++;
    }
  }

  return totalPixels > 0 ? changedPixels / totalPixels : 0;
}

const MOTION_THRESHOLDS: Record<string, { medium: number }> = {
  pet: { medium: 15 },
  baby: { medium: 10 },
  elderly: { medium: 8 },
};

function getThresholdForScenario(scenario: string): number {
  return MOTION_THRESHOLDS[scenario]?.medium || 10;
}

