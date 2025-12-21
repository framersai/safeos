/**
 * Twilio SMS Service
 *
 * Send SMS alerts via Twilio.
 *
 * @module lib/alerts/twilio
 */

import twilio from 'twilio';

// =============================================================================
// Types
// =============================================================================

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

// =============================================================================
// Client
// =============================================================================

let twilioClient: twilio.Twilio | null = null;
let twilioConfig: TwilioConfig | null = null;

function getTwilioClient(): twilio.Twilio | null {
  if (!twilioClient) {
    const accountSid = process.env['TWILIO_ACCOUNT_SID'];
    const authToken = process.env['TWILIO_AUTH_TOKEN'];
    const fromNumber = process.env['TWILIO_PHONE_NUMBER'];

    if (accountSid && authToken && fromNumber) {
      twilioClient = twilio(accountSid, authToken);
      twilioConfig = { accountSid, authToken, fromNumber };
    }
  }
  return twilioClient;
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Send SMS via Twilio
 */
export async function sendTwilioSms(
  to: string,
  message: string
): Promise<void> {
  const client = getTwilioClient();

  if (!client || !twilioConfig) {
    throw new Error('Twilio not configured');
  }

  await client.messages.create({
    body: message,
    from: twilioConfig.fromNumber,
    to,
  });
}

/**
 * Send alert SMS
 */
export async function sendAlertSms(
  to: string,
  severity: string,
  title: string,
  message: string
): Promise<void> {
  const formattedMessage = `[SafeOS ${severity.toUpperCase()}] ${title}: ${message}`;

  // Truncate to SMS limit (160 chars for single SMS)
  const truncated =
    formattedMessage.length > 155
      ? formattedMessage.slice(0, 152) + '...'
      : formattedMessage;

  await sendTwilioSms(to, truncated);
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    process.env['TWILIO_ACCOUNT_SID'] &&
    process.env['TWILIO_AUTH_TOKEN'] &&
    process.env['TWILIO_PHONE_NUMBER']
  );
}

export default {
  sendTwilioSms,
  sendAlertSms,
  isTwilioConfigured,
};
