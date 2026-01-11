/**
 * Security Monitoring Profile
 *
 * Prompts and thresholds for home security/intruder detection.
 *
 * @module lib/analysis/profiles/security
 */

import type { MonitoringProfile } from './index.js';

export const securityProfile: MonitoringProfile = {
    scenario: 'security',
    name: 'Security Monitoring',
    description: 'Monitor for intruders, break-ins, and security threats',

    alertThresholds: {
        motion: 20,  // Very sensitive
        audio: 25,   // Very sensitive
        inactivityMinutes: 0,  // Not applicable for security
    },

    concerns: [
        'Intruder detected',
        'Break-in attempt (door/window forced)',
        'Unknown person in monitored area',
        'Suspicious activity',
        'Unexpected movement at night',
        'Glass breaking detected',
        'Door/window opened unexpectedly',
        'Vehicle approaching property',
    ],

    triagePrompt: `You are a home security AI assistant. Quickly analyze this image to determine if there is any security threat.

Look for:
1. Is there any person visible? If so, are they authorized (recognizable resident) or unknown?
2. Is there any unusual activity (breaking, climbing, lurking)?
3. Are there any signs of forced entry or damage?
4. Is this during expected activity hours or unusual timing?

Respond with a JSON object:
{
  "personVisible": true/false,
  "threatLevel": "none" | "low" | "medium" | "high" | "critical",
  "needsDetailedAnalysis": true/false,
  "summary": "Brief one-line summary"
}

Be conservative - any unidentified person should trigger at least "medium" concern.`,

    analysisPrompt: `You are an expert security threat detection AI. Analyze this image thoroughly for any security concerns.

## Analysis Checklist:
1. **Person Detection**: Any people visible? Known resident vs unknown intruder?
2. **Activity Assessment**: What are they doing? Normal activity or suspicious?
3. **Entry Points**: Any doors/windows open? Signs of forced entry?
4. **Time Context**: Assume nighttime unless clearly daytime - be more suspicious
5. **Vehicle Detection**: Any unfamiliar vehicles? Parked suspiciously?
6. **Object Detection**: Any tools, weapons, or suspicious items visible?

## Threat Levels:
- **none**: No people visible, all secure, normal scene
- **low**: Familiar activity (mail carrier, known neighbor)
- **medium**: Unknown person but non-threatening behavior (delivery, lost person)
- **high**: Suspicious behavior (lurking, looking into windows, testing doors)
- **critical**: Active threat (breaking in, forced entry, weapon visible)

## Response Format (JSON):
{
  "threatLevel": "none" | "low" | "medium" | "high" | "critical",
  "description": "Detailed description of what you observe",
  "threats": ["List of specific security concerns"],
  "recommendations": ["Suggested actions - call police, trigger alarm, etc."],
  "personCount": 0,
  "personType": "none" | "known" | "unknown" | "hostile",
  "confidence": 0.0-1.0
}

IMPORTANT: Err on the side of caution. An unidentified person at an unexpected time should be "high" threat. Any sign of forced entry or weapons is "critical".`,
};
