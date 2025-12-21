/**
 * Motion Detection
 *
 * Client-side motion detection using frame differencing.
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
  intensity: number;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Motion thresholds per scenario (percentage of changed pixels)
 */
export const MOTION_THRESHOLDS = {
  pet: {
    low: 5, // Subtle movement
    medium: 15, // Moderate activity
    high: 30, // Significant movement
  },
  baby: {
    low: 3, // Very sensitive for infant monitoring
    medium: 10, // Normal movement
    high: 25, // Active movement
  },
  elderly: {
    low: 2, // Very sensitive for fall detection
    medium: 8, // Normal activity
    high: 20, // Significant movement
  },
  security: {
    low: 10, // Detect subtle intrusion attempts
    medium: 20, // Normal motion trigger
    high: 40, // Significant movement only
  },
};

// Pixel difference threshold (0-255)
const PIXEL_THRESHOLD = 30;

// Downsampling factor for performance
const DOWNSAMPLE = 4;

// =============================================================================
// Core Detection Functions
// =============================================================================

/**
 * Detect motion between two frames
 *
 * @param previousFrame - Previous frame ImageData
 * @param currentFrame - Current frame ImageData
 * @returns Motion score between 0 and 1
 */
export function detectMotion(
  previousFrame: ImageData,
  currentFrame: ImageData
): number {
  const prev = previousFrame.data;
  const curr = currentFrame.data;
  const width = previousFrame.width;
  const height = previousFrame.height;

  let changedPixels = 0;
  let totalPixels = 0;

  // Iterate over pixels with downsampling
  for (let y = 0; y < height; y += DOWNSAMPLE) {
    for (let x = 0; x < width; x += DOWNSAMPLE) {
      const i = (y * width + x) * 4;

      // Calculate grayscale for comparison
      const prevGray = (prev[i] + prev[i + 1] + prev[i + 2]) / 3;
      const currGray = (curr[i] + curr[i + 1] + curr[i + 2]) / 3;

      // Check if pixel changed significantly
      if (Math.abs(prevGray - currGray) > PIXEL_THRESHOLD) {
        changedPixels++;
      }
      totalPixels++;
    }
  }

  return totalPixels > 0 ? changedPixels / totalPixels : 0;
}

/**
 * Calculate motion score with weighted regions
 *
 * @param previousFrame - Previous frame ImageData
 * @param currentFrame - Current frame ImageData
 * @param weights - Optional weight map (0-1 for each region)
 * @returns Weighted motion score
 */
export function calculateMotionScore(
  previousFrame: ImageData,
  currentFrame: ImageData,
  weights?: number[][]
): number {
  const prev = previousFrame.data;
  const curr = currentFrame.data;
  const width = previousFrame.width;
  const height = previousFrame.height;

  const gridX = 8;
  const gridY = 6;
  const cellWidth = Math.floor(width / gridX);
  const cellHeight = Math.floor(height / gridY);

  let weightedScore = 0;
  let totalWeight = 0;

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      const weight = weights?.[gy]?.[gx] ?? 1;
      const startX = gx * cellWidth;
      const startY = gy * cellHeight;

      let changedPixels = 0;
      let cellPixels = 0;

      for (let y = startY; y < startY + cellHeight; y += DOWNSAMPLE) {
        for (let x = startX; x < startX + cellWidth; x += DOWNSAMPLE) {
          const i = (y * width + x) * 4;

          const prevGray = (prev[i] + prev[i + 1] + prev[i + 2]) / 3;
          const currGray = (curr[i] + curr[i + 1] + curr[i + 2]) / 3;

          if (Math.abs(prevGray - currGray) > PIXEL_THRESHOLD) {
            changedPixels++;
          }
          cellPixels++;
        }
      }

      const cellScore = cellPixels > 0 ? changedPixels / cellPixels : 0;
      weightedScore += cellScore * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * Detect motion regions (areas with significant change)
 *
 * @param previousFrame - Previous frame ImageData
 * @param currentFrame - Current frame ImageData
 * @param minIntensity - Minimum intensity threshold (0-1)
 * @returns Array of motion regions
 */
export function detectRegionalMotion(
  previousFrame: ImageData,
  currentFrame: ImageData,
  minIntensity: number = 0.1
): MotionRegion[] {
  const prev = previousFrame.data;
  const curr = currentFrame.data;
  const width = previousFrame.width;
  const height = previousFrame.height;

  const gridX = 16;
  const gridY = 12;
  const cellWidth = Math.floor(width / gridX);
  const cellHeight = Math.floor(height / gridY);

  const regions: MotionRegion[] = [];

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      const startX = gx * cellWidth;
      const startY = gy * cellHeight;

      let changedPixels = 0;
      let cellPixels = 0;

      for (let y = startY; y < startY + cellHeight; y += DOWNSAMPLE) {
        for (let x = startX; x < startX + cellWidth; x += DOWNSAMPLE) {
          const i = (y * width + x) * 4;

          const prevGray = (prev[i] + prev[i + 1] + prev[i + 2]) / 3;
          const currGray = (curr[i] + curr[i + 1] + curr[i + 2]) / 3;

          if (Math.abs(prevGray - currGray) > PIXEL_THRESHOLD) {
            changedPixels++;
          }
          cellPixels++;
        }
      }

      const intensity = cellPixels > 0 ? changedPixels / cellPixels : 0;

      if (intensity >= minIntensity) {
        regions.push({
          x: startX,
          y: startY,
          width: cellWidth,
          height: cellHeight,
          intensity,
        });
      }
    }
  }

  return regions;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get motion threshold for a scenario
 */
export function getThresholdForScenario(
  scenario: 'pet' | 'baby' | 'elderly' | 'security'
): number {
  return MOTION_THRESHOLDS[scenario]?.medium || 10;
}

/**
 * Check if motion exceeds threshold for alert
 */
export function shouldTriggerMotionAlert(
  score: number,
  scenario: 'pet' | 'baby' | 'elderly' | 'security',
  level: 'low' | 'medium' | 'high' = 'medium'
): boolean {
  const threshold = MOTION_THRESHOLDS[scenario]?.[level] || 10;
  return score * 100 >= threshold;
}

/**
 * Normalize motion score to 0-100 scale
 */
export function normalizeMotionScore(score: number): number {
  return Math.round(Math.min(score * 100, 100));
}

/**
 * Create motion heatmap from regional data
 */
export function createMotionHeatmap(
  regions: MotionRegion[],
  width: number,
  height: number
): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  for (const region of regions) {
    const color = intensityToColor(region.intensity);

    for (let y = region.y; y < region.y + region.height; y++) {
      for (let x = region.x; x < region.x + region.width; x++) {
        const i = (y * width + x) * 4;
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        data[i + 3] = Math.round(color.a * 255);
      }
    }
  }

  return imageData;
}

/**
 * Convert intensity to color (green → yellow → red)
 */
function intensityToColor(
  intensity: number
): { r: number; g: number; b: number; a: number } {
  const clamped = Math.max(0, Math.min(1, intensity));

  if (clamped < 0.5) {
    // Green to yellow
    return {
      r: Math.round(clamped * 2 * 255),
      g: 255,
      b: 0,
      a: 0.5,
    };
  } else {
    // Yellow to red
    return {
      r: 255,
      g: Math.round((1 - (clamped - 0.5) * 2) * 255),
      b: 0,
      a: 0.5,
    };
  }
}

export default {
  detectMotion,
  calculateMotionScore,
  detectRegionalMotion,
  getThresholdForScenario,
  shouldTriggerMotionAlert,
  normalizeMotionScore,
  createMotionHeatmap,
  MOTION_THRESHOLDS,
};
