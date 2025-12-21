/**
 * Motion Detection
 *
 * Client-side motion detection using pixel comparison.
 * Runs in the browser to minimize server load and latency.
 *
 * @module lib/motion-detection
 */

// =============================================================================
// Types
// =============================================================================

export interface MotionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

export interface MotionThresholds {
  pixelDifferenceThreshold: number;
  overallMotionThreshold: number;
  regionSize: number;
}

// =============================================================================
// Configuration
// =============================================================================

export const MOTION_THRESHOLDS: Record<string, MotionThresholds> = {
  pet: {
    pixelDifferenceThreshold: 30,
    overallMotionThreshold: 0.05,
    regionSize: 32,
  },
  baby: {
    pixelDifferenceThreshold: 25,
    overallMotionThreshold: 0.03, // More sensitive for babies
    regionSize: 24,
  },
  elderly: {
    pixelDifferenceThreshold: 35,
    overallMotionThreshold: 0.04,
    regionSize: 32,
  },
  default: {
    pixelDifferenceThreshold: 30,
    overallMotionThreshold: 0.05,
    regionSize: 32,
  },
};

// =============================================================================
// Motion Detection
// =============================================================================

/**
 * Detect motion between two frames
 *
 * @param previousFrame - Previous frame ImageData
 * @param currentFrame - Current frame ImageData
 * @param thresholds - Optional custom thresholds
 * @returns Motion score between 0 and 1
 */
export function detectMotion(
  previousFrame: ImageData,
  currentFrame: ImageData,
  thresholds: Partial<MotionThresholds> = {}
): number {
  const config = { ...MOTION_THRESHOLDS.default, ...thresholds };

  if (
    previousFrame.width !== currentFrame.width ||
    previousFrame.height !== currentFrame.height
  ) {
    return 0;
  }

  const prevData = previousFrame.data;
  const currData = currentFrame.data;
  const pixelCount = prevData.length / 4;

  let changedPixels = 0;

  for (let i = 0; i < prevData.length; i += 4) {
    // Calculate luminance difference (more efficient than full RGB)
    const prevLum = prevData[i] * 0.299 + prevData[i + 1] * 0.587 + prevData[i + 2] * 0.114;
    const currLum = currData[i] * 0.299 + currData[i + 1] * 0.587 + currData[i + 2] * 0.114;

    const diff = Math.abs(currLum - prevLum);

    if (diff > config.pixelDifferenceThreshold) {
      changedPixels++;
    }
  }

  return changedPixels / pixelCount;
}

/**
 * Calculate motion score with weighted regions
 * (Center of frame weighted higher)
 */
export function calculateMotionScore(
  previousFrame: ImageData,
  currentFrame: ImageData,
  centerWeight: number = 1.5
): number {
  const width = currentFrame.width;
  const height = currentFrame.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  const prevData = previousFrame.data;
  const currData = currentFrame.data;

  let totalWeight = 0;
  let weightedChange = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Calculate luminance difference
      const prevLum =
        prevData[i] * 0.299 + prevData[i + 1] * 0.587 + prevData[i + 2] * 0.114;
      const currLum =
        currData[i] * 0.299 + currData[i + 1] * 0.587 + currData[i + 2] * 0.114;

      const diff = Math.abs(currLum - prevLum) / 255;

      // Weight based on distance from center
      const distX = x - centerX;
      const distY = y - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      const weight = 1 + (1 - distance / maxDistance) * (centerWeight - 1);

      totalWeight += weight;
      weightedChange += diff * weight;
    }
  }

  return totalWeight > 0 ? weightedChange / totalWeight : 0;
}

/**
 * Detect motion in specific regions
 * Returns array of regions with motion scores
 */
export function detectRegionalMotion(
  previousFrame: ImageData,
  currentFrame: ImageData,
  gridSize: number = 4
): MotionRegion[] {
  const width = currentFrame.width;
  const height = currentFrame.height;
  const regionWidth = Math.floor(width / gridSize);
  const regionHeight = Math.floor(height / gridSize);

  const regions: MotionRegion[] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const startX = gx * regionWidth;
      const startY = gy * regionHeight;

      let changedPixels = 0;
      let totalPixels = 0;

      for (let y = startY; y < startY + regionHeight && y < height; y++) {
        for (let x = startX; x < startX + regionWidth && x < width; x++) {
          const i = (y * width + x) * 4;

          const prevLum =
            previousFrame.data[i] * 0.299 +
            previousFrame.data[i + 1] * 0.587 +
            previousFrame.data[i + 2] * 0.114;
          const currLum =
            currentFrame.data[i] * 0.299 +
            currentFrame.data[i + 1] * 0.587 +
            currentFrame.data[i + 2] * 0.114;

          if (Math.abs(currLum - prevLum) > 30) {
            changedPixels++;
          }
          totalPixels++;
        }
      }

      const score = totalPixels > 0 ? changedPixels / totalPixels : 0;

      if (score > 0.01) {
        regions.push({
          x: startX,
          y: startY,
          width: regionWidth,
          height: regionHeight,
          score,
        });
      }
    }
  }

  // Sort by score descending
  return regions.sort((a, b) => b.score - a.score);
}

/**
 * Get threshold for a specific scenario
 */
export function getThresholdForScenario(scenario: string): number {
  const thresholds = MOTION_THRESHOLDS[scenario] || MOTION_THRESHOLDS.default;
  return thresholds.overallMotionThreshold;
}

/**
 * Smooth motion values to reduce noise
 */
export class MotionSmoother {
  private values: number[] = [];
  private maxValues: number;

  constructor(windowSize: number = 5) {
    this.maxValues = windowSize;
  }

  add(value: number): number {
    this.values.push(value);
    if (this.values.length > this.maxValues) {
      this.values.shift();
    }

    // Return average
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  reset(): void {
    this.values = [];
  }

  getAverage(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  getPeak(): number {
    if (this.values.length === 0) return 0;
    return Math.max(...this.values);
  }
}

/**
 * Detect sudden motion spikes (could indicate fall)
 */
export function detectSuddenMotion(
  motionHistory: number[],
  spikeThreshold: number = 3
): boolean {
  if (motionHistory.length < 5) return false;

  const recent = motionHistory.slice(-5);
  const average = recent.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  const current = recent[4];

  // Check if current motion is significantly higher than average
  return average > 0.01 && current > average * spikeThreshold;
}
