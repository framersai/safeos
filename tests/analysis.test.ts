/**
 * Frame Analyzer Tests
 */

import { describe, it, expect } from 'vitest';
import { getPetPrompt, getBabyPrompt, getElderlyPrompt } from '../src/lib/analysis/profiles/index.js';

describe('Detection Profiles', () => {
  describe('Pet Prompts', () => {
    it('should return triage prompt', () => {
      const prompt = getPetPrompt('triage');
      expect(prompt.toLowerCase()).toContain('pet');
      expect(prompt.toLowerCase()).toContain('concern');
    });

    it('should return detailed prompt', () => {
      const prompt = getPetPrompt('detailed');
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(100);
    });
  });

  describe('Baby Prompts', () => {
    it('should return triage prompt with safety focus', () => {
      const prompt = getBabyPrompt('triage');
      expect(prompt.toLowerCase()).toContain('baby');
    });

    it('should return detailed prompt with position monitoring', () => {
      const prompt = getBabyPrompt('detailed');
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(100);
    });
  });

  describe('Elderly Prompts', () => {
    it('should return triage prompt with fall detection', () => {
      const prompt = getElderlyPrompt('triage');
      expect(prompt.toLowerCase()).toContain('floor');
      expect(prompt.toLowerCase()).toContain('fall');
    });

    it('should return detailed prompt with mobility focus', () => {
      const prompt = getElderlyPrompt('detailed');
      expect(prompt.toLowerCase()).toContain('mobility');
      expect(prompt.toLowerCase()).toContain('fall');
    });
  });
});

describe('Concern Level Parsing', () => {
  it('should have consistent concern levels across all profiles', () => {
    const petPrompt = getPetPrompt('detailed');
    const babyPrompt = getBabyPrompt('detailed');
    const elderlyPrompt = getElderlyPrompt('detailed');

    const expectedLevels = ['none', 'low', 'medium', 'high', 'critical'];

    for (const level of expectedLevels) {
      expect(petPrompt.toLowerCase()).toContain(level);
      expect(babyPrompt.toLowerCase()).toContain(level);
      expect(elderlyPrompt.toLowerCase()).toContain(level);
    }
  });
});
