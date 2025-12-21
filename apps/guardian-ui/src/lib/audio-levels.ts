/**
 * Audio Level Analysis
 *
 * Client-side audio analysis for detecting sound levels,
 * cry patterns, and distress sounds.
 *
 * @module lib/audio-levels
 */

// =============================================================================
// Types
// =============================================================================

export interface AudioThresholds {
  silenceLevel: number;
  lowLevel: number;
  moderateLevel: number;
  loudLevel: number;
  criticalLevel: number;
}

export interface FrequencyBands {
  bass: number;    // 20-250 Hz
  lowMid: number;  // 250-500 Hz
  mid: number;     // 500-2000 Hz
  highMid: number; // 2000-4000 Hz
  high: number;    // 4000-20000 Hz
}

// =============================================================================
// Configuration
// =============================================================================

export const AUDIO_THRESHOLDS: Record<string, AudioThresholds> = {
  pet: {
    silenceLevel: 0.01,
    lowLevel: 0.1,
    moderateLevel: 0.3,
    loudLevel: 0.6,
    criticalLevel: 0.85,
  },
  baby: {
    silenceLevel: 0.005, // More sensitive for baby monitoring
    lowLevel: 0.05,
    moderateLevel: 0.2,
    loudLevel: 0.5,
    criticalLevel: 0.75,
  },
  elderly: {
    silenceLevel: 0.01,
    lowLevel: 0.15,
    moderateLevel: 0.35,
    loudLevel: 0.6,
    criticalLevel: 0.8,
  },
  default: {
    silenceLevel: 0.01,
    lowLevel: 0.1,
    moderateLevel: 0.3,
    loudLevel: 0.6,
    criticalLevel: 0.85,
  },
};

// Crying frequency characteristics
const CRY_FREQUENCY_RANGE = {
  min: 300,
  max: 600,
  harmonicPeaks: [350, 450, 530],
};

// =============================================================================
// Audio Level Detection
// =============================================================================

/**
 * Get overall audio level (RMS) from analyser
 *
 * @param analyser - Web Audio AnalyserNode
 * @returns Audio level between 0 and 1
 */
export function getAudioLevel(analyser: AnalyserNode): number {
  const dataArray = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(dataArray);

  // Calculate RMS (Root Mean Square)
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const sample = (dataArray[i] - 128) / 128;
    sum += sample * sample;
  }

  const rms = Math.sqrt(sum / dataArray.length);

  // Normalize to 0-1 range with some headroom
  return Math.min(1, rms * 2);
}

/**
 * Get frequency band levels
 *
 * @param analyser - Web Audio AnalyserNode
 * @returns Object with frequency band levels
 */
export function getFrequencyLevels(analyser: AnalyserNode): FrequencyBands {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const sampleRate = analyser.context.sampleRate;
  const binWidth = sampleRate / (bufferLength * 2);

  // Calculate bin ranges for each frequency band
  const getBandEnergy = (lowHz: number, highHz: number): number => {
    const lowBin = Math.floor(lowHz / binWidth);
    const highBin = Math.min(bufferLength - 1, Math.ceil(highHz / binWidth));

    let sum = 0;
    for (let i = lowBin; i <= highBin; i++) {
      sum += dataArray[i] / 255;
    }

    return sum / (highBin - lowBin + 1);
  };

  return {
    bass: getBandEnergy(20, 250),
    lowMid: getBandEnergy(250, 500),
    mid: getBandEnergy(500, 2000),
    highMid: getBandEnergy(2000, 4000),
    high: getBandEnergy(4000, 20000),
  };
}

/**
 * Detect crying pattern (for baby monitoring)
 *
 * Analyzes frequency content to detect patterns typical of infant crying:
 * - Fundamental frequency between 300-600 Hz
 * - Harmonic structure
 * - Rhythmic pattern
 *
 * @param analyser - Web Audio AnalyserNode
 * @returns True if crying pattern detected
 */
export function detectCryingPattern(analyser: AnalyserNode): boolean {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const sampleRate = analyser.context.sampleRate;
  const binWidth = sampleRate / (bufferLength * 2);

  // Get bins for cry frequency range
  const lowBin = Math.floor(CRY_FREQUENCY_RANGE.min / binWidth);
  const highBin = Math.min(bufferLength - 1, Math.ceil(CRY_FREQUENCY_RANGE.max / binWidth));

  // Calculate energy in cry frequency range
  let cryRangeEnergy = 0;
  let peakBin = lowBin;
  let peakValue = 0;

  for (let i = lowBin; i <= highBin; i++) {
    cryRangeEnergy += dataArray[i];
    if (dataArray[i] > peakValue) {
      peakValue = dataArray[i];
      peakBin = i;
    }
  }

  cryRangeEnergy /= (highBin - lowBin + 1);

  // Calculate total energy for comparison
  let totalEnergy = 0;
  for (let i = 0; i < bufferLength; i++) {
    totalEnergy += dataArray[i];
  }
  totalEnergy /= bufferLength;

  // Check if cry range has dominant energy
  const cryRangeRatio = totalEnergy > 0 ? cryRangeEnergy / totalEnergy : 0;

  // Check for harmonics (2nd and 3rd)
  const peakFreq = peakBin * binWidth;
  const secondHarmonicBin = Math.round((peakFreq * 2) / binWidth);
  const thirdHarmonicBin = Math.round((peakFreq * 3) / binWidth);

  let harmonicsPresent = false;
  if (secondHarmonicBin < bufferLength && thirdHarmonicBin < bufferLength) {
    const secondHarmonic = dataArray[secondHarmonicBin] / 255;
    const thirdHarmonic = dataArray[thirdHarmonicBin] / 255;
    const peakNormalized = peakValue / 255;

    // Harmonics should be present but lower than fundamental
    harmonicsPresent =
      secondHarmonic > peakNormalized * 0.2 &&
      secondHarmonic < peakNormalized * 0.8;
  }

  // Crying detected if:
  // 1. Significant energy in cry range
  // 2. Cry range is dominant
  // 3. Harmonics present
  return cryRangeEnergy > 40 && cryRangeRatio > 1.5 && harmonicsPresent;
}

/**
 * Classify audio event type
 */
export function classifyAudio(
  analyser: AnalyserNode
): 'silence' | 'ambient' | 'voice' | 'cry' | 'loud' | 'unknown' {
  const level = getAudioLevel(analyser);
  const frequencies = getFrequencyLevels(analyser);

  // Silence
  if (level < 0.02) {
    return 'silence';
  }

  // Very loud
  if (level > 0.8) {
    return 'loud';
  }

  // Check for voice/cry frequencies
  const voiceFrequencyRatio =
    (frequencies.lowMid + frequencies.mid) / (frequencies.bass + frequencies.high + 0.01);

  if (voiceFrequencyRatio > 2 && level > 0.2) {
    // Could be voice or cry
    if (detectCryingPattern(analyser)) {
      return 'cry';
    }
    return 'voice';
  }

  if (level > 0.1) {
    return 'ambient';
  }

  return 'unknown';
}

/**
 * Audio level smoother for reducing noise
 */
export class AudioSmoother {
  private values: number[] = [];
  private maxValues: number;

  constructor(windowSize: number = 10) {
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

  getPeak(): number {
    if (this.values.length === 0) return 0;
    return Math.max(...this.values);
  }

  getAverage(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  reset(): void {
    this.values = [];
  }
}

/**
 * Detect sudden audio spikes (could indicate distress)
 */
export function detectSuddenSound(
  audioHistory: number[],
  spikeThreshold: number = 4
): boolean {
  if (audioHistory.length < 10) return false;

  const recent = audioHistory.slice(-10);
  const baseline = recent.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  const current = (recent[8] + recent[9]) / 2;

  // Check if current audio is significantly higher than baseline
  return baseline < 0.1 && current > baseline * spikeThreshold;
}
