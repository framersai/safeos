/**
 * Monitoring Profiles Index
 *
 * Exports all monitoring profiles with their prompts.
 *
 * @module lib/analysis/profiles
 */

import type { MonitoringScenario } from '../../../types/index.js';
import { petProfile } from './pet.js';
import { babyProfile } from './baby.js';
import { elderlyProfile } from './elderly.js';

// =============================================================================
// Types
// =============================================================================

export interface MonitoringProfile {
  scenario: MonitoringScenario;
  name: string;
  description: string;
  triagePrompt: string;
  analysisPrompt: string;
  alertThresholds: {
    motion: number;
    audio: number;
    inactivityMinutes: number;
  };
  concerns: string[];
}

// =============================================================================
// Exports
// =============================================================================

export { petProfile } from './pet.js';
export { babyProfile } from './baby.js';
export { elderlyProfile } from './elderly.js';

export const profiles: Record<MonitoringScenario, MonitoringProfile> = {
  pet: petProfile,
  baby: babyProfile,
  elderly: elderlyProfile,
};

export function getProfile(scenario: MonitoringScenario): MonitoringProfile {
  return profiles[scenario];
}

export function getAllProfiles(): MonitoringProfile[] {
  return Object.values(profiles);
}
