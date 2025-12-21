/**
 * Twilio SMS Integration
 *
 * SMS notifications via Twilio.
 *
 * @module lib/alerts/twilio
 */

import twilio from 'twilio';

// =============================================================================
// Types
// =============================================================================

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// Configuration
// =============================================================================

const CONFIG: TwilioConfig = {
  accountSid: process.env['TWILIO_ACCOUNT_SID'] || '',
  authToken: process.env['TWILIO_AUTH_TOKEN'] || '',
  fromNumber: process.env['TWILIO_FROM_NUMBER'] || '',
};

// Initialize client if configured
let client: twilio.Twilio | null = null;
if (CONFIG.accountSid && CONFIG.authToken) {
  client = twilio(CONFIG.accountSid, CONFIG.authToken);
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(CONFIG.accountSid && CONFIG.authToken && CONFIG.fromNumber);
}

/**
 * Send an SMS message
 */
export async function sendTwilioSms(
  to: string,
  message: string
): Promise<SmsResult> {
  if (!client) {
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Normalize phone number
    const normalizedTo = normalizePhoneNumber(to);

    const result = await client.messages.create({
      body: message,
      from: CONFIG.fromNumber,
      to: normalizedTo,
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('Twilio SMS failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Send SMS to multiple numbers
 */
export async function sendToMultipleNumbers(
  numbers: string[],
  message: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  await Promise.all(
    numbers.map(async (number) => {
      const result = await sendTwilioSms(number, message);
      if (result.success) sent++;
      else failed++;
    })
  );

  return { sent, failed };
}

/**
 * Verify a phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic E.164 format validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  const normalized = normalizePhoneNumber(phone);
  return e164Regex.test(normalized);
}

/**
 * Normalize a phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If no country code, assume US (+1)
  if (!normalized.startsWith('+')) {
    if (normalized.length === 10) {
      normalized = '+1' + normalized;
    } else if (normalized.length === 11 && normalized.startsWith('1')) {
      normalized = '+' + normalized;
    }
  }

  return normalized;
}

/**
 * Format message for SMS (truncate if needed)
 */
export function formatSmsMessage(
  title: string,
  body: string,
  maxLength: number = 160
): string {
  const message = `${title}: ${body}`;
  if (message.length <= maxLength) {
    return message;
  }
  return message.slice(0, maxLength - 3) + '...';
}

/**
 * Get account balance (for monitoring)
 */
export async function getAccountBalance(): Promise<{ balance: string; currency: string } | null> {
  if (!client) return null;

  try {
    const account = await client.api.accounts(CONFIG.accountSid).fetch();
    // Note: Balance is not directly on account, would need separate API call
    return { balance: 'N/A', currency: 'USD' };
  } catch {
    return null;
  }
}
