/**
 * Twilio SMS Service
 *
 * Send SMS alerts via Twilio. Falls back to server-level env vars
 * (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER) if no
 * per-user override is supplied — mirrors the BYO pattern used for Resend
 * in src/lib/alerts/email.ts.
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

export interface SendSmsOptions {
  /** Override server-level Twilio config (e.g. user supplied their own creds). */
  override?: Partial<TwilioConfig>;
}

// =============================================================================
// Server-level config (fallback)
// =============================================================================

function getServerConfig(): TwilioConfig | null {
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken = process.env['TWILIO_AUTH_TOKEN'];
  const fromNumber = process.env['TWILIO_PHONE_NUMBER'];
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

/**
 * Whether the server has Twilio creds configured (for /api/notifications/status).
 */
export function isTwilioConfigured(): boolean {
  return getServerConfig() !== null;
}

// =============================================================================
// Client cache — one Twilio client per accountSid+authToken pair
// =============================================================================

const clientCache = new Map<string, twilio.Twilio>();

function getClient(accountSid: string, authToken: string): twilio.Twilio {
  const cacheKey = `${accountSid}:${authToken}`;
  let client = clientCache.get(cacheKey);
  if (!client) {
    client = twilio(accountSid, authToken);
    clientCache.set(cacheKey, client);
  }
  return client;
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Resolve effective Twilio config from optional override + server env.
 * Throws if neither path yields a complete config.
 */
function resolveConfig(override?: Partial<TwilioConfig>): TwilioConfig {
  const server = getServerConfig();
  const config: TwilioConfig = {
    accountSid: override?.accountSid ?? server?.accountSid ?? '',
    authToken: override?.authToken ?? server?.authToken ?? '',
    fromNumber: override?.fromNumber ?? server?.fromNumber ?? '',
  };

  if (!config.accountSid || !config.authToken || !config.fromNumber) {
    throw new TwilioNotConfiguredError(
      'Twilio is not configured. Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER on the server, or provide an override.',
    );
  }
  return config;
}

/**
 * Send a raw SMS via Twilio.
 */
export async function sendTwilioSms(
  to: string,
  message: string,
  options: SendSmsOptions = {},
): Promise<{ sid: string; to: string; from: string }> {
  const config = resolveConfig(options.override);
  const client = getClient(config.accountSid, config.authToken);

  const result = await client.messages.create({
    body: message,
    from: config.fromNumber,
    to,
  });

  return { sid: result.sid, to, from: config.fromNumber };
}

/**
 * Send a severity-tagged alert SMS, truncated to single-SMS length.
 */
export async function sendAlertSms(
  to: string,
  severity: string,
  title: string,
  message: string,
  options: SendSmsOptions = {},
): Promise<{ sid: string; to: string; from: string }> {
  const formattedMessage = `[SafeOS ${severity.toUpperCase()}] ${title}: ${message}`;
  const truncated =
    formattedMessage.length > 155 ? formattedMessage.slice(0, 152) + '...' : formattedMessage;
  return sendTwilioSms(to, truncated, options);
}

/**
 * Send a one-off test SMS so users can verify their Twilio config works.
 */
export async function sendTestSms(
  to: string,
  options: SendSmsOptions = {},
): Promise<{ sid: string; to: string; from: string }> {
  return sendTwilioSms(
    to,
    'SafeOS Guardian — SMS is working. Real alerts will arrive at high or critical severity.',
    options,
  );
}

// =============================================================================
// Errors
// =============================================================================

export class TwilioNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TwilioNotConfiguredError';
  }
}

export default {
  sendTwilioSms,
  sendAlertSms,
  sendTestSms,
  isTwilioConfigured,
  TwilioNotConfiguredError,
};
