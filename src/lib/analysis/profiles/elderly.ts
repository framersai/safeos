/**
 * Elderly Care Monitoring Profile
 *
 * Prompts and thresholds for elderly/senior monitoring.
 *
 * @module lib/analysis/profiles/elderly
 */

import type { MonitoringProfile } from './index.js';

export const elderlyProfile: MonitoringProfile = {
  scenario: 'elderly',
  name: 'Elderly Care Monitoring',
  description: 'Monitor seniors for falls, medical emergencies, and wellbeing',

  alertThresholds: {
    motion: 30, // Detect even small falls
    audio: 35, // Detect calls for help
    inactivityMinutes: 45, // Longer acceptable but still monitored
  },

  concerns: [
    'Fall detected or person on floor',
    'Person unresponsive or not moving',
    'Signs of medical distress',
    'Wandering at unusual hours',
    'Person attempting unsafe activity',
    'Confusion or disorientation indicators',
    'Not following usual routine patterns',
    'Calls for help or distress vocalizations',
  ],

  triagePrompt: `You are an elderly care safety AI. Quickly assess this image for senior wellbeing.

PRIORITY CHECKS:
1. Is an elderly person visible?
2. Are they in a normal position (sitting, standing, lying in bed)?
3. Any signs of a fall or person on the floor?
4. Do they appear in distress or calling for help?

Respond with JSON:
{
  "personVisible": true/false,
  "position": "standing" | "sitting" | "lying_bed" | "lying_floor" | "unknown",
  "concernLevel": "none" | "low" | "medium" | "high" | "critical",
  "needsDetailedAnalysis": true/false,
  "summary": "Brief one-line summary"
}

ALWAYS flag for detailed analysis if:
- Person appears to be on the floor
- Unusual positioning
- Signs of distress or confusion
- Reaching for phone/alert device`,

  analysisPrompt: `You are an expert elderly care AI assistant. Analyze this image carefully for senior safety and wellbeing.

## CRITICAL SAFETY CHECKS:
1. **Fall Detection**: Is the person on the floor? Signs of a recent fall?
2. **Responsiveness**: Do they appear alert and responsive?
3. **Mobility**: Are they moving normally or struggling?
4. **Medical Distress**: Signs of pain, difficulty breathing, or emergency?
5. **Position Safety**: Are they in a safe, stable position?

## Additional Assessment:
6. **Time-Appropriate Activity**: Is this normal for the time of day?
7. **Environment Safety**: Trip hazards? Accessible walkways?
8. **Assistance Devices**: Using walker/cane correctly if visible?
9. **General Wellbeing**: Dressed appropriately? Appear groomed and cared for?
10. **Confusion Indicators**: Lost, disoriented, or confused behavior?

## Concern Levels:
- **none**: Person appears comfortable, safe, and engaged in normal activity
- **low**: Minor observation (unusual time for activity, etc.)
- **medium**: Should be checked on (seems uncomfortable, unusual location)
- **high**: Requires prompt attention (difficulty moving, appears confused)
- **critical**: EMERGENCY - Potential fall, medical emergency, or unresponsive

## Response Format (JSON):
{
  "concernLevel": "none" | "low" | "medium" | "high" | "critical",
  "description": "Detailed description of person and situation",
  "issues": ["List of specific concerns"],
  "recommendations": ["Suggested actions"],
  "personState": "active" | "resting" | "sleeping" | "distressed" | "on_floor",
  "mobilityObserved": "normal" | "impaired" | "immobile" | "unknown",
  "potentialFall": true/false,
  "confidence": 0.0-1.0
}

⚠️ CRITICAL: Falls in elderly can be life-threatening. Any indication of a person on the floor or having fallen should trigger a CRITICAL alert. This is a supplement to - not replacement for - proper care and medical alert systems.`,
};
