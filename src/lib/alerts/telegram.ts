/**
 * Telegram Bot Integration
 *
 * Telegram notifications via bot API.
 *
 * @module lib/alerts/telegram
 */

import TelegramBot from 'node-telegram-bot-api';
import type { NotificationPayload } from '../../types/index.js';

// =============================================================================
// Types
// =============================================================================

export interface TelegramConfig {
  botToken: string;
  polling?: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

const CONFIG: TelegramConfig = {
  botToken: process.env['TELEGRAM_BOT_TOKEN'] || '',
  polling: false, // Don't poll by default (saves resources)
};

// =============================================================================
// TelegramBotService Class
// =============================================================================

export class TelegramBotService {
  private bot: TelegramBot | null = null;
  private registeredChatIds: Set<string> = new Set();
  private isConfigured: boolean;

  // Stats
  private stats = {
    messagesSent: 0,
    photosSent: 0,
    failures: 0,
  };

  constructor(config?: Partial<TelegramConfig>) {
    const finalConfig = { ...CONFIG, ...config };
    this.isConfigured = !!finalConfig.botToken;

    if (this.isConfigured) {
      this.bot = new TelegramBot(finalConfig.botToken, {
        polling: finalConfig.polling,
      });

      if (finalConfig.polling) {
        this.setupHandlers();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------------------

  /**
   * Check if configured
   */
  configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Register a chat ID for notifications
   */
  registerChatId(chatId: string): void {
    this.registeredChatIds.add(chatId);
  }

  /**
   * Unregister a chat ID
   */
  unregisterChatId(chatId: string): void {
    this.registeredChatIds.delete(chatId);
  }

  /**
   * Get registered chat IDs
   */
  getRegisteredChatIds(): string[] {
    return Array.from(this.registeredChatIds);
  }

  /**
   * Send a text message
   */
  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.bot) return false;

    try {
      await this.bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
      this.stats.messagesSent++;
      return true;
    } catch (error) {
      console.error('Telegram message failed:', error);
      this.stats.failures++;
      return false;
    }
  }

  /**
   * Send a photo with caption
   */
  async sendPhoto(
    chatId: string,
    photo: string | Buffer,
    caption?: string
  ): Promise<boolean> {
    if (!this.bot) return false;

    try {
      await this.bot.sendPhoto(chatId, photo, {
        caption,
        parse_mode: 'HTML',
      });
      this.stats.photosSent++;
      return true;
    } catch (error) {
      console.error('Telegram photo failed:', error);
      this.stats.failures++;
      return false;
    }
  }

  /**
   * Send a notification payload
   */
  async sendNotification(
    payload: NotificationPayload,
    chatId?: string
  ): Promise<boolean> {
    if (!this.bot) return false;

    const message = this.formatNotification(payload);
    const targetChatIds = chatId ? [chatId] : Array.from(this.registeredChatIds);

    let success = false;
    for (const id of targetChatIds) {
      if (payload.imageUrl) {
        // Send photo with caption
        const result = await this.sendPhoto(id, payload.imageUrl, message);
        if (result) success = true;
      } else {
        // Send text only
        const result = await this.sendMessage(id, message);
        if (result) success = true;
      }
    }

    return success;
  }

  /**
   * Broadcast to all registered chats
   */
  async broadcast(text: string): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const chatId of this.registeredChatIds) {
      const result = await this.sendMessage(chatId, text);
      if (result) sent++;
      else failed++;
    }

    return { sent, failed };
  }

  /**
   * Get stats
   */
  getStats() {
    return { ...this.stats };
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private setupHandlers(): void {
    if (!this.bot) return;

    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id.toString();
      this.registeredChatIds.add(chatId);

      await this.sendMessage(
        chatId,
        `🛡️ <b>Welcome to SafeOS Guardian!</b>\n\n` +
          `You'll receive alerts here when monitoring detects something.\n\n` +
          `Commands:\n` +
          `/status - Check monitoring status\n` +
          `/stop - Stop receiving alerts\n` +
          `/help - Get help`
      );
    });

    // Handle /stop command
    this.bot.onText(/\/stop/, async (msg) => {
      const chatId = msg.chat.id.toString();
      this.registeredChatIds.delete(chatId);

      await this.sendMessage(
        chatId,
        `👋 You've been unsubscribed from SafeOS alerts.\n` +
          `Send /start to subscribe again.`
      );
    });

    // Handle /status command
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id.toString();
      const isSubscribed = this.registeredChatIds.has(chatId);

      await this.sendMessage(
        chatId,
        `📊 <b>Status</b>\n\n` +
          `Subscribed: ${isSubscribed ? '✅ Yes' : '❌ No'}\n` +
          `Messages sent: ${this.stats.messagesSent}\n`
      );
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id.toString();

      await this.sendMessage(
        chatId,
        `🆘 <b>SafeOS Guardian Help</b>\n\n` +
          `This bot sends you alerts from your SafeOS monitoring system.\n\n` +
          `<b>Alert Levels:</b>\n` +
          `🚨 Critical - Immediate attention needed\n` +
          `⚠️ High - Should check soon\n` +
          `📢 Medium - Worth noting\n` +
          `ℹ️ Low/Info - For your awareness\n\n` +
          `<b>Commands:</b>\n` +
          `/start - Subscribe to alerts\n` +
          `/stop - Unsubscribe\n` +
          `/status - Check status`
      );
    });
  }

  private formatNotification(payload: NotificationPayload): string {
    const severityEmoji: Record<string, string> = {
      critical: '🚨',
      high: '⚠️',
      medium: '📢',
      low: 'ℹ️',
      info: 'ℹ️',
    };

    const emoji = severityEmoji[payload.severity] || '📢';

    return (
      `${emoji} <b>${payload.title}</b>\n\n` +
      `${payload.message}\n\n` +
      `<i>Severity: ${payload.severity.toUpperCase()}</i>\n` +
      `<i>Time: ${new Date(payload.timestamp).toLocaleString()}</i>`
    );
  }
}

// =============================================================================
// Singleton
// =============================================================================

let defaultBot: TelegramBotService | null = null;

export function isTelegramConfigured(): boolean {
  return !!CONFIG.botToken;
}

export function getDefaultTelegramBot(): TelegramBotService | null {
  if (!isTelegramConfigured()) return null;

  if (!defaultBot) {
    defaultBot = new TelegramBotService();
  }
  return defaultBot;
}

export function createTelegramBot(config?: Partial<TelegramConfig>): TelegramBotService {
  return new TelegramBotService(config);
}
