/**
 * Legal Disclaimers (Frontend)
 *
 * Critical legal disclaimers for SafeOS Guardian.
 *
 * @module lib/disclaimers
 */

// =============================================================================
// Critical Disclaimer
// =============================================================================

export const CRITICAL_DISCLAIMER = `
⚠️ IMPORTANT SAFETY DISCLAIMER

SafeOS Guardian is a FREE supplementary monitoring tool offered as part of 
SuperCloud's humanitarian mission. This service is NOT a replacement for:

• Direct supervision of children, infants, or toddlers
• Professional caregiving for elderly individuals
• Veterinary care or supervision for pets
• Medical alert systems or emergency response services
• Any form of professional healthcare or monitoring

BY USING THIS SERVICE, YOU ACKNOWLEDGE AND AGREE:

1. NO GUARANTEED DETECTION: AI systems can fail. This tool may miss important 
   events, generate false alerts, or experience technical failures.

2. SUPPLEMENTARY USE ONLY: This tool supplements - never replaces - responsible 
   adult supervision and professional care.

3. NOT FOR MEDICAL EMERGENCIES: Do not rely on this service for medical 
   emergencies. Always call emergency services (911) immediately.

4. NETWORK DEPENDENCY: This service requires internet connectivity. Outages 
   or connectivity issues may prevent alerts from being sent.

5. PRIVACY & DATA: Video/audio is processed locally when possible. Content 
   requiring AI analysis may be processed through secure cloud services.

6. USER RESPONSIBILITY: Users are solely responsible for ensuring appropriate 
   care and supervision. SafeOS assumes no liability for any harm.

7. ABUSE PREVENTION: We have AI and human review systems to detect misuse. 
   Illegal content will be reported to law enforcement.

This service is provided "AS IS" without warranties of any kind.

By continuing, you confirm you understand these limitations and agree to 
use this service responsibly and in accordance with all applicable laws.
`.trim();

// =============================================================================
// Additional Disclaimers
// =============================================================================

export const BABY_MONITORING_DISCLAIMER = `
👶 BABY MONITORING ADDITIONAL NOTICE

This tool is designed to SUPPLEMENT - not replace - direct supervision.

• ALWAYS follow safe sleep guidelines (back-to-sleep, firm mattress, no loose bedding)
• NEVER leave infants unattended for extended periods
• This tool cannot detect all forms of infant distress
• Check on your baby physically and regularly
• This is not a certified medical device

The American Academy of Pediatrics recommends room-sharing without bed-sharing 
for the first 6-12 months. This tool does not replace these guidelines.
`.trim();

export const ELDERLY_MONITORING_DISCLAIMER = `
👴 ELDERLY CARE ADDITIONAL NOTICE

This tool is designed to SUPPLEMENT - not replace - proper care.

• This is NOT a medical alert system
• Cannot detect all falls or medical emergencies  
• Not a replacement for medical emergency response systems (like Life Alert)
• Should be used alongside - not instead of - regular check-ins
• Cannot provide medical advice or intervention

For seniors at risk of falls or medical emergencies, professional medical 
alert systems with 24/7 monitoring are strongly recommended.
`.trim();

export const PET_MONITORING_DISCLAIMER = `
🐕 PET MONITORING ADDITIONAL NOTICE

This tool is designed to help monitor pets when you're away.

• Cannot detect all signs of illness or distress
• Not a replacement for regular veterinary care
• May not detect subtle behavioral changes
• Pets should not be left alone for extended periods
• Always ensure pets have adequate food, water, and comfort

This tool can help alert you to obvious issues but cannot replace 
attentive pet ownership and regular veterinary check-ups.
`.trim();

// =============================================================================
// Acknowledgment Text
// =============================================================================

export const ACKNOWLEDGMENT_TEXT = `
I have read and understand the disclaimers above. I acknowledge that:

✓ SafeOS Guardian is a supplementary tool, not a replacement for proper care
✓ AI systems can fail and this tool may not detect all concerning events
✓ I remain fully responsible for the safety and wellbeing of those I monitor
✓ I will not rely solely on this tool for emergencies
✓ I will use this service responsibly and legally
`.trim();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get scenario-specific disclaimer
 */
export function getScenarioDisclaimer(
  scenario: 'baby' | 'pet' | 'elderly'
): string {
  switch (scenario) {
    case 'baby':
      return BABY_MONITORING_DISCLAIMER;
    case 'elderly':
      return ELDERLY_MONITORING_DISCLAIMER;
    case 'pet':
      return PET_MONITORING_DISCLAIMER;
    default:
      return '';
  }
}

/**
 * Get full disclaimer for a scenario
 */
export function getFullDisclaimer(
  scenario: 'baby' | 'pet' | 'elderly'
): string {
  return `${CRITICAL_DISCLAIMER}\n\n${getScenarioDisclaimer(scenario)}`;
}














