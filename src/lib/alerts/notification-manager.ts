/**
 * Notification Manager
 *
 * Orchestrates multi-channel notifications (Browser Push, SMS, Telegram).
 *
 * @module lib/alerts/notification-manager
 */

import { AlertEscalationManager, type EscalationLevel } from './escalation.js';
import { sendTwilioSms, isTwilioConfigured } from './twilio.js';
import {
  TelegramBotService,
  getDefaultTelegramBot,
  isTelegramConfigured,
} from './telegram.js';
import { sendBrowserPushNotification } from './browser-push.js';
import type { Alert, NotificationPayload } from '../../types/index.js';

// =============================================================================
// Types
// =============================================================================

export interface NotificationSettings {
  enabled: boolean;
  channels: {
    browser: boolean;
    sms: boolean;
    telegram: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    allowCritical: boolean;
  };
  escalationDelayMs: number;
}

export interface BrowserSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  streamId?: string;
}

export interface ChannelStatus {
  browser: {
    enabled: boolean;
    subscriptionCount: number;
  };
  sms: {
    enabled: boolean;
    configured: boolean;
    registeredNumbers: number;
  };
  telegram: {
    enabled: boolean;
    configured: boolean;
    registeredChats: number;
  };
}

// =============================================================================
// NotificationManager Class
// =============================================================================

export class NotificationManager {
  private settings: NotificationSettings;
  private escalationManager: AlertEscalationManager;
  private browserSubscriptions: Map<string, BrowserSubscription[]> = new Map();
  private phoneNumbers: Map<string, string[]> = new Map(); // streamId -> phones
  private telegramChatIds: Set<string> = new Set();

  // Stats
  private stats = {
    browserSent: 0,
    smsSent: 0,
    telegramSent: 0,
    failed: 0,
  };

  constructor(settings?: Partial<NotificationSettings>) {
    this.settings = {
      enabled: true,
      channels: {
        browser: true,
        sms: true,
        telegram: true,
      },
      escalationDelayMs: 30000,
      ...settings,
    };

    this.escalationManager = new AlertEscalationManager();
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Process an alert and send notifications based on severity
   */
  async processAlert(alert: Alert): Promise<void> {
    if (!this.settings.enabled) return;
    if (this.isInQuietHours() && alert.severity !== 'critical') return;

    const payload: NotificationPayload = {
      alertId: alert.id,
      title: this.getAlertTitle(alert),
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.created_at,
      streamId: alert.stream_id,
      imageUrl: alert.thumbnail_url,
    };

    // Start escalation tracking
    this.escalationManager.startAlert(alert.id, alert.severity);

    // Send to all enabled channels
    await this.sendToAllChannels(payload);
  }

  /**
   * Send to all enabled channels
   */
  async sendToAllChannels(payload: NotificationPayload): Promise<void> {
    const promises: Promise<boolean>[] = [];

    if (this.settings.channels.browser) {
      promises.push(this.sendBrowserPush(payload));
    }

    if (this.settings.channels.sms && isTwilioConfigured()) {
      promises.push(this.sendSmsToAll(payload));
    }

    if (this.settings.channels.telegram && isTelegramConfigured()) {
      promises.push(this.sendTelegramToAll(payload));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send browser push notification
   */
  async sendBrowserPush(
    payload: NotificationPayload,
    endpoint?: string
  ): Promise<boolean> {
    try {
      const subscriptions = endpoint
        ? [
            Array.from(this.browserSubscriptions.values())
              .flat()
              .find((s) => s.endpoint === endpoint),
          ].filter(Boolean)
        : this.getSubscriptionsForStream(payload.streamId);

      if (subscriptions.length === 0) return false;

      for (const sub of subscriptions) {
        if (sub) {
          await sendBrowserPushNotification(sub, payload);
          this.stats.browserSent++;
        }
      }

      return true;
    } catch (error) {
      this.stats.failed++;
      console.error('Browser push failed:', error);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSms(payload: NotificationPayload, phoneNumber: string): Promise<boolean> {
    try {
      const message = this.formatSmsMessage(payload);
      await sendTwilioSms(phoneNumber, message);
      this.stats.smsSent++;
      return true;
    } catch (error) {
      this.stats.failed++;
      console.error('SMS failed:', error);
      return false;
    }
  }

  /**
   * Send SMS to all registered numbers
   */
  async sendSmsToAll(payload: NotificationPayload): Promise<boolean> {
    const phones = payload.streamId
      ? this.phoneNumbers.get(payload.streamId) || []
      : Array.from(this.phoneNumbers.values()).flat();

    if (phones.length === 0) return false;

    let success = false;
    for (const phone of phones) {
      const result = await this.sendSms(payload, phone);
      if (result) success = true;
    }

    return success;
  }

  /**
   * Send Telegram notification
   */
  async sendTelegram(payload: NotificationPayload, chatId: string): Promise<boolean> {
    try {
      const bot = getDefaultTelegramBot();
      if (!bot) return false;

      await bot.sendNotification(payload, chatId);
      this.stats.telegramSent++;
      return true;
    } catch (error) {
      this.stats.failed++;
      console.error('Telegram failed:', error);
      return false;
    }
  }

  /**
   * Send Telegram to all registered chats
   */
  async sendTelegramToAll(payload: NotificationPayload): Promise<boolean> {
    const bot = getDefaultTelegramBot();
    if (!bot) return false;

    let success = false;
    for (const chatId of this.telegramChatIds) {
      const result = await this.sendTelegram(payload, chatId);
      if (result) success = true;
    }

    return success;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    this.escalationManager.acknowledgeAlert(alertId);
  }

  /**
   * Get current escalation level for an alert
   */
  getAlertEscalation(alertId: string): EscalationLevel | undefined {
    return this.escalationManager.getCurrentLevel(alertId);
  }

  // ---------------------------------------------------------------------------
  // Registration Methods
  // ---------------------------------------------------------------------------

  registerBrowserSubscription(subscription: BrowserSubscription, streamId?: string): void {
    const key = streamId || 'global';
    const existing = this.browserSubscriptions.get(key) || [];
    if (!existing.find((s) => s.endpoint === subscription.endpoint)) {
      existing.push(subscription);
      this.browserSubscriptions.set(key, existing);
    }
  }

  unregisterBrowserSubscription(subscription: BrowserSubscription): void {
    for (const [key, subs] of this.browserSubscriptions.entries()) {
      const filtered = subs.filter((s) => s.endpoint !== subscription.endpoint);
      if (filtered.length !== subs.length) {
        this.browserSubscriptions.set(key, filtered);
      }
    }
  }

  registerPhoneNumber(phone: string, streamId?: string): void {
    const key = streamId || 'global';
    const existing = this.phoneNumbers.get(key) || [];
    if (!existing.includes(phone)) {
      existing.push(phone);
      this.phoneNumbers.set(key, existing);
    }
  }

  unregisterPhoneNumber(phone: string): void {
    for (const [key, phones] of this.phoneNumbers.entries()) {
      const filtered = phones.filter((p) => p !== phone);
      if (filtered.length !== phones.length) {
        this.phoneNumbers.set(key, filtered);
      }
    }
  }

  registerTelegramChatId(chatId: string): void {
    this.telegramChatIds.add(chatId);
    const bot = getDefaultTelegramBot();
    if (bot) {
      bot.registerChatId(chatId);
    }
  }

  unregisterTelegramChatId(chatId: string): void {
    this.telegramChatIds.delete(chatId);
    const bot = getDefaultTelegramBot();
    if (bot) {
      bot.unregisterChatId(chatId);
    }
  }

  // ---------------------------------------------------------------------------
  // Settings Methods
  // ---------------------------------------------------------------------------

  updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  getChannelStatus(): ChannelStatus {
    return {
      browser: {
        enabled: this.settings.channels.browser,
        subscriptionCount: Array.from(this.browserSubscriptions.values()).flat().length,
      },
      sms: {
        enabled: this.settings.channels.sms,
        configured: isTwilioConfigured(),
        registeredNumbers: Array.from(this.phoneNumbers.values()).flat().length,
      },
      telegram: {
        enabled: this.settings.channels.telegram,
        configured: isTelegramConfigured(),
        registeredChats: this.telegramChatIds.size,
      },
    };
  }

  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private getSubscriptionsForStream(
    streamId?: string
  ): BrowserSubscription[] {
    const global = this.browserSubscriptions.get('global') || [];
    if (!streamId) return global;
    const specific = this.browserSubscriptions.get(streamId) || [];
    return [...global, ...specific];
  }

  private isInQuietHours(): boolean {
    if (!this.settings.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const { start, end } = this.settings.quietHours;

    if (start < end) {
      return currentTime >= start && currentTime < end;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 07:00)
      return currentTime >= start || currentTime < end;
    }
  }

  private getAlertTitle(alert: Alert): string {
    const severityEmoji: Record<string, string> = {
      critical: '🚨',
      high: '⚠️',
      medium: '📢',
      low: 'ℹ️',
      info: 'ℹ️',
    };
    return `${severityEmoji[alert.severity] || '📢'} SafeOS Alert: ${alert.alert_type}`;
  }

  private formatSmsMessage(payload: NotificationPayload): string {
    const maxLength = 160;
    const base = `SafeOS ${payload.severity.toUpperCase()}: ${payload.message}`;
    return base.length > maxLength ? base.slice(0, maxLength - 3) + '...' : base;
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultManager: NotificationManager | null = null;

export function getDefaultNotificationManager(): NotificationManager {
  if (!defaultManager) {
    defaultManager = new NotificationManager();
  }
  return defaultManager;
}

export function createNotificationManager(
  settings?: Partial<NotificationSettings>
): NotificationManager {
  return new NotificationManager(settings);
}
