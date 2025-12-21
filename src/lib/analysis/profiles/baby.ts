/**
 * Baby Monitoring Profile
 *
 * Prompts and thresholds for baby/toddler monitoring.
 *
 * @module lib/analysis/profiles/baby
 */

import type { MonitoringProfile } from './index.js';

export const babyProfile: MonitoringProfile = {
  scenario: 'baby',
  name: 'Baby & Toddler Monitoring',
  description: 'Monitor infants and toddlers for safety and wellbeing',

  alertThresholds: {
    motion: 35, // More sensitive
    audio: 40, // Cry detection threshold
    inactivityMinutes: 30, // Shorter window for babies
  },

  concerns: [
    'Baby in unsafe sleeping position',
    'Baby crying or in distress',
    'Baby climbing or in dangerous position',
    'Objects near face (suffocation risk)',
    'Temperature indicators (too hot/cold)',
    'Baby awake when should be sleeping',
    'Unusual stillness or positioning',
    'Baby attempting to climb out of crib',
  ],

  triagePrompt: `You are a baby safety AI assistant. Quickly analyze this nursery/baby monitor image.

CRITICAL SAFETY FIRST - Check for:
1. Is a baby/toddler visible?
2. Any immediate safety hazards?
3. Baby's general state (sleeping, awake, crying)?
4. Safe sleeping position if asleep?

Respond with JSON:
{
  "babyVisible": true/false,
  "state": "sleeping" | "awake" | "crying" | "unknown",
  "concernLevel": "none" | "low" | "medium" | "high" | "critical",
  "needsDetailedAnalysis": true/false,
  "summary": "Brief one-line summary"
}

ALWAYS recommend detailed analysis if:
- Baby appears in distress
- Unsafe sleeping position (face down, covered)
- Any objects near baby's face
- Baby in unusual position`,

  analysisPrompt: `You are an expert infant and toddler safety AI. Analyze this image with EXTREME care for baby safety.

## CRITICAL SAFETY CHECKS (Prioritize):
1. **Sleeping Position**: Back-to-sleep? Face clear? No blankets over face?
2. **Airway**: Nothing near face that could obstruct breathing?
3. **Crib Safety**: Proper crib? No loose bedding, pillows, or toys?
4. **Position**: Safe position? Not stuck or wedged?
5. **Distress Signs**: Crying? Discomfort? Unusual color?

## Additional Assessment:
6. **Alertness**: Awake, drowsy, sleeping deeply?
7. **Temperature Clues**: Appropriate clothing? Sweating? Shivering?
8. **Movement**: Normal movements or concerning stillness?
9. **Environment**: Safe room temperature indicators? Clean environment?

## Concern Levels:
- **none**: Baby appears safe, comfortable, in appropriate position
- **low**: Minor note (baby awake when expected to sleep, etc.)
- **medium**: Should be checked (unusual position, fussing)
- **high**: Requires prompt attention (distress signs, concerning position)
- **critical**: IMMEDIATE attention (unsafe sleeping, airway concern, visible distress)

## Response Format (JSON):
{
  "concernLevel": "none" | "low" | "medium" | "high" | "critical",
  "description": "Detailed description of baby and environment",
  "issues": ["List of specific concerns"],
  "recommendations": ["Immediate actions needed"],
  "babyState": "sleeping" | "awake" | "crying" | "drowsy",
  "sleepingSafe": true/false/null,
  "confidence": 0.0-1.0
}

⚠️ IMPORTANT: Err on the side of caution. It's better to alert for a false positive than miss a genuine safety concern. This is an AI supplement - caregivers should ALWAYS physically check.`,
};
