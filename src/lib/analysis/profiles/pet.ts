/**
 * Pet Monitoring Profile
 *
 * Prompts and thresholds for pet monitoring.
 *
 * @module lib/analysis/profiles/pet
 */

import type { MonitoringProfile } from './index.js';

export const petProfile: MonitoringProfile = {
  scenario: 'pet',
  name: 'Pet Monitoring',
  description: 'Monitor pets for safety, health, and behavioral concerns',

  alertThresholds: {
    motion: 40,
    audio: 50,
    inactivityMinutes: 60,
  },

  concerns: [
    'Pet not moving (potential illness/injury)',
    'Pet in distress (vocalizing, pacing)',
    'Pet eating non-food items',
    'Pet attempting escape',
    'Pet in dangerous area',
    'Signs of injury or illness',
    'Unusual behavior patterns',
  ],

  triagePrompt: `You are a pet safety AI assistant. Quickly analyze this image to determine if it needs detailed review.

Look for:
1. Is a pet visible in the image?
2. Does the pet appear healthy and in a normal state?
3. Are there any obvious signs of distress, danger, or concern?

Respond with a JSON object:
{
  "petVisible": true/false,
  "concernLevel": "none" | "low" | "medium" | "high" | "critical",
  "needsDetailedAnalysis": true/false,
  "summary": "Brief one-line summary"
}

Be conservative - if unsure, recommend detailed analysis.`,

  analysisPrompt: `You are an expert pet health and safety AI. Analyze this image thoroughly for any concerns about the pet's wellbeing.

## Analysis Checklist:
1. **Pet Identification**: What type of pet? Visible identifying features?
2. **Physical State**: Posture, movement, breathing (if visible)
3. **Behavioral Indicators**: Alert, relaxed, stressed, lethargic?
4. **Environment Assessment**: Safe environment? Any hazards visible?
5. **Health Signs**: Any visible injuries, abnormal positions, or concerning symptoms?

## Concern Levels:
- **none**: Pet appears healthy, active, and in a safe environment
- **low**: Minor observations worth noting (unusual sleeping position, etc.)
- **medium**: Concerning signs that should be monitored (lethargy, not eating)
- **high**: Significant concern requiring attention (signs of distress, potential injury)
- **critical**: Immediate attention needed (visible injury, severe distress, danger)

## Response Format (JSON):
{
  "concernLevel": "none" | "low" | "medium" | "high" | "critical",
  "description": "Detailed description of what you observe",
  "issues": ["List of specific concerns"],
  "recommendations": ["Suggested actions if any"],
  "petType": "cat" | "dog" | "bird" | "other" | "unknown",
  "confidence": 0.0-1.0
}

Be thorough but avoid false alarms. Pets often sleep in unusual positions - this alone is not concerning unless combined with other signs.`,
};
