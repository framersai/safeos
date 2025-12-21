/**
 * Notification Manager
 *
 * Orchestrates multi-channel alert notifications.
 *
 * @module lib/alerts/notification-manager
 */

import { TelegramBotService } from './telegram';
import { sendTwilioSms } from './twilio';
import { sendBrowserPushNotification } from './browser-push';
import { getPushSubscriptions, getTelegramChatIds } from '../../api/routes/notifications';

// =============================================================================
// Types
// =============================================================================

export interface NotificationPayload {
  streamId: string;
  alertId: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  thumbnailUrl?: string;
  timestamp: string;
}

export interface NotificationConfig {
  browserPush: boolean;
  sms: boolean;
  telegram: boolean;
  smsNumber?: string;
  telegramChatId?: string;
}

export interface NotificationResult {
  channel: string;
  success: boolean;
  error?: string;
}

// =============================================================================
// Constants
// =============================================================================

const SEVERITY_CHANNELS: Record<string, string[]> = {
  info: ['browser'],
  low: ['browser'],
  medium: ['browser', 'telegram'],
  high: ['browser', 'telegram', 'sms'],
  critical: ['browser', 'telegram', 'sms'],
};

// =============================================================================
// NotificationManager Class
// =============================================================================

export class NotificationManager {
  private telegramService: TelegramBotService | null = null;
  private config: NotificationConfig;

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = {
      browserPush: config.browserPush ?? true,
      sms: config.sms ?? false,
      telegram: config.telegram ?? false,
      smsNumber: config.smsNumber,
      telegramChatId: config.telegramChatId,
    };

    if (this.config.telegram && process.env['TELEGRAM_BOT_TOKEN']) {
      this.telegramService = new TelegramBotService();
    }
  }

  // ---------------------------------------------------------------------------
  // Notification Sending
  // ---------------------------------------------------------------------------

  /**
   * Send notification through appropriate channels based on severity
   */
  async notify(payload: NotificationPayload): Promise<NotificationResult[]> {
    const channels = SEVERITY_CHANNELS[payload.severity] || ['browser'];
    const results: NotificationResult[] = [];

    for (const channel of channels) {
      try {
        await this.sendToChannel(channel, payload);
        results.push({ channel, success: true });
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        results.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(
    channel: string,
    payload: NotificationPayload
  ): Promise<void> {
    switch (channel) {
      case 'browser':
        await this.sendBrowserPush(payload);
        break;
      case 'telegram':
        await this.sendTelegram(payload);
        break;
      case 'sms':
        await this.sendSms(payload);
        break;
      default:
        console.warn(`Unknown notification channel: ${channel}`);
    }
  }

  /**
   * Send browser push notifications
   */
  private async sendBrowserPush(payload: NotificationPayload): Promise<void> {
    if (!this.config.browserPush) return;

    const subscriptions = getPushSubscriptions();

    for (const [userId, subscription] of subscriptions) {
      try {
        await sendBrowserPushNotification(subscription, {
          title: payload.title,
          body: payload.message,
          icon: '/icons/alert.png',
          badge: '/icons/badge.png',
          data: {
            streamId: payload.streamId,
            alertId: payload.alertId,
            severity: payload.severity,
          },
        });
      } catch (error) {
        console.error(`Failed to send push to ${userId}:`, error);
      }
    }
  }

  /**
   * Send Telegram notifications
   */
  private async sendTelegram(payload: NotificationPayload): Promise<void> {
    if (!this.config.telegram || !this.telegramService) return;

    const chatIds = getTelegramChatIds();

    for (const chatId of chatIds) {
      try {
        await this.telegramService.sendAlert(chatId, payload);
      } catch (error) {
        console.error(`Failed to send Telegram to ${chatId}:`, error);
      }
    }
  }

  /**
   * Send SMS notifications
   */
  private async sendSms(payload: NotificationPayload): Promise<void> {
    if (!this.config.sms || !this.config.smsNumber) return;

    const message = `[SafeOS ${payload.severity.toUpperCase()}] ${payload.title}: ${payload.message}`;

    await sendTwilioSms(this.config.smsNumber, message);
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Update notification configuration
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.telegram && !this.telegramService && process.env['TELEGRAM_BOT_TOKEN']) {
      this.telegramService = new TelegramBotService();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Check which channels are available
   */
  getAvailableChannels(): string[] {
    const channels: string[] = ['browser'];

    if (process.env['TWILIO_ACCOUNT_SID']) {
      channels.push('sms');
    }

    if (process.env['TELEGRAM_BOT_TOKEN']) {
      channels.push('telegram');
    }

    return channels;
  }
}

// Singleton instance
let notificationManager: NotificationManager | null = null;

export function getNotificationManager(): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager();
  }
  return notificationManager;
}

export default NotificationManager;
