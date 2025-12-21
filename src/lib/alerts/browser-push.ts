/**
 * Browser Push Notifications
 *
 * Web Push API integration for browser notifications.
 *
 * @module lib/alerts/browser-push
 */

import webpush from 'web-push';
import type { NotificationPayload } from '../../types/index.js';

// =============================================================================
// Types
// =============================================================================

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, unknown>;
  vibrate?: number[];
}

// =============================================================================
// Configuration
// =============================================================================

const VAPID_KEYS = {
  publicKey: process.env['VAPID_PUBLIC_KEY'] || '',
  privateKey: process.env['VAPID_PRIVATE_KEY'] || '',
  subject: process.env['VAPID_SUBJECT'] || 'mailto:admin@safeos.app',
};

// Configure web-push if keys are available
if (VAPID_KEYS.publicKey && VAPID_KEYS.privateKey) {
  webpush.setVapidDetails(
    VAPID_KEYS.subject,
    VAPID_KEYS.publicKey,
    VAPID_KEYS.privateKey
  );
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Check if push is configured
 */
export function isPushConfigured(): boolean {
  return !!(VAPID_KEYS.publicKey && VAPID_KEYS.privateKey);
}

/**
 * Get VAPID public key for client subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_KEYS.publicKey;
}

/**
 * Send a push notification
 */
export async function sendBrowserPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  if (!isPushConfigured()) {
    console.warn('Push notifications not configured - missing VAPID keys');
    return false;
  }

  const options = buildNotificationOptions(payload);

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(options)
    );
    return true;
  } catch (error: any) {
    // Handle expired subscriptions
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('Push subscription expired:', subscription.endpoint);
      // Should remove from database
    } else {
      console.error('Push notification failed:', error);
    }
    return false;
  }
}

/**
 * Send notification to multiple subscriptions
 */
export async function sendToMultiple(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const success = await sendBrowserPushNotification(sub, payload);
      if (success) sent++;
      else failed++;
    })
  );

  return { sent, failed };
}

/**
 * Build notification options from payload
 */
function buildNotificationOptions(payload: NotificationPayload): PushNotificationOptions {
  const severityIcons: Record<string, string> = {
    critical: '🚨',
    high: '⚠️',
    medium: '📢',
    low: 'ℹ️',
    info: 'ℹ️',
  };

  const options: PushNotificationOptions = {
    title: payload.title,
    body: payload.message,
    tag: payload.alertId, // Prevents duplicate notifications
    requireInteraction: payload.severity === 'critical' || payload.severity === 'high',
    data: {
      alertId: payload.alertId,
      streamId: payload.streamId,
      severity: payload.severity,
      url: `/alerts/${payload.alertId}`,
    },
  };

  // Add icon
  if (payload.imageUrl) {
    options.icon = payload.imageUrl;
  }

  // Add actions for high priority alerts
  if (payload.severity === 'critical' || payload.severity === 'high') {
    options.actions = [
      { action: 'view', title: 'View' },
      { action: 'acknowledge', title: 'Acknowledge' },
    ];

    // Vibration pattern for critical alerts
    options.vibrate = [200, 100, 200, 100, 200];
  }

  return options;
}

/**
 * Generate VAPID keys (one-time setup)
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}
