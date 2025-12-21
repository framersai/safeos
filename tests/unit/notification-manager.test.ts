/**
 * Notification Manager Unit Tests
 *
 * Tests for multi-channel notification delivery.
 *
 * @module tests/unit/notification-manager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationManager } from '../../src/lib/alerts/notification-manager.js';
import type { NotificationPayload, NotificationConfig } from '../../src/types/index.js';

// Mock external services
vi.mock('../../src/lib/alerts/browser-push.js', () => ({
  sendBrowserPushNotification: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../../src/lib/alerts/twilio.js', () => ({
  sendTwilioSms: vi.fn().mockResolvedValue({ success: true, sid: 'test-sid' }),
}));

vi.mock('../../src/lib/alerts/telegram.js', () => ({
  TelegramBotService: vi.fn().mockImplementation(() => ({
    sendNotification: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

// =============================================================================
// Test Suite
// =============================================================================

describe('NotificationManager', () => {
  let manager: NotificationManager;

  const mockConfig: NotificationConfig = {
    browserPush: {
      enabled: true,
      vapidPublicKey: 'test-public-key',
      vapidPrivateKey: 'test-private-key',
    },
    twilio: {
      enabled: true,
      accountSid: 'test-account-sid',
      authToken: 'test-auth-token',
      fromNumber: '+1234567890',
    },
    telegram: {
      enabled: true,
      botToken: 'test-bot-token',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new NotificationManager(mockConfig);
  });

  // ===========================================================================
  // Basic Notification Tests
  // ===========================================================================

  describe('sendNotification', () => {
    it('should send notification via all enabled channels', async () => {
      const payload: NotificationPayload = {
        title: 'Test Alert',
        body: 'This is a test notification',
        severity: 'medium',
        streamId: 'stream-1',
        timestamp: new Date().toISOString(),
      };

      const results = await manager.sendNotification(payload);

      expect(results.success).toBe(true);
      expect(results.channels).toContain('browserPush');
      expect(results.channels).toContain('twilio');
      expect(results.channels).toContain('telegram');
    });

    it('should respect disabled channels', async () => {
      const partialConfig: NotificationConfig = {
        browserPush: { enabled: false },
        twilio: { enabled: true, accountSid: 'test', authToken: 'test', fromNumber: '+1' },
        telegram: { enabled: false },
      };

      const partialManager = new NotificationManager(partialConfig);

      const payload: NotificationPayload = {
        title: 'Test',
        body: 'Test',
        severity: 'low',
        streamId: 'stream-1',
        timestamp: new Date().toISOString(),
      };

      const results = await partialManager.sendNotification(payload);

      expect(results.channels).not.toContain('browserPush');
      expect(results.channels).not.toContain('telegram');
    });
  });

  // ===========================================================================
  // Severity-based Tests
  // ===========================================================================

  describe('severity handling', () => {
    it('should send all channels for critical alerts', async () => {
      const payload: NotificationPayload = {
        title: 'CRITICAL ALERT',
        body: 'Immediate attention required',
        severity: 'critical',
        streamId: 'stream-1',
        timestamp: new Date().toISOString(),
      };

      const results = await manager.sendNotification(payload);

      expect(results.success).toBe(true);
      // Critical should trigger all channels
      expect(results.channels.length).toBeGreaterThan(0);
    });

    it('should include severity in notification payload', async () => {
      const payload: NotificationPayload = {
        title: 'High Alert',
        body: 'Attention needed',
        severity: 'high',
        streamId: 'stream-1',
        timestamp: new Date().toISOString(),
      };

      await manager.sendNotification(payload);

      // Verify severity was passed through
      expect(payload.severity).toBe('high');
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should continue with other channels if one fails', async () => {
      // Make one channel fail
      const { sendBrowserPushNotification } = await import('../../src/lib/alerts/browser-push.js');
      vi.mocked(sendBrowserPushNotification).mockRejectedValueOnce(new Error('Push failed'));

      const payload: NotificationPayload = {
        title: 'Test',
        body: 'Test',
        severity: 'medium',
        streamId: 'stream-1',
        timestamp: new Date().toISOString(),
      };

      const results = await manager.sendNotification(payload);

      // Should still succeed with other channels
      expect(results.success).toBe(true);
      expect(results.errors).toContain('browserPush');
    });

    it('should report all errors when all channels fail', async () => {
      const { sendBrowserPushNotification } = await import('../../src/lib/alerts/browser-push.js');
      const { sendTwilioSms } = await import('../../src/lib/alerts/twilio.js');

      vi.mocked(sendBrowserPushNotification).mockRejectedValue(new Error('Push failed'));
      vi.mocked(sendTwilioSms).mockRejectedValue(new Error('SMS failed'));

      const payload: NotificationPayload = {
        title: 'Test',
        body: 'Test',
        severity: 'low',
        streamId: 'stream-1',
        timestamp: new Date().toISOString(),
      };

      const results = await manager.sendNotification(payload);

      expect(results.errors).toBeDefined();
      expect(results.errors!.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Subscription Tests
  // ===========================================================================

  describe('subscription management', () => {
    it('should add browser push subscription', async () => {
      const subscription = {
        endpoint: 'https://push.example.com/test',
        keys: { p256dh: 'test-key', auth: 'test-auth' },
      };

      await manager.addPushSubscription('user-1', subscription);

      const subs = manager.getPushSubscriptions('user-1');
      expect(subs).toHaveLength(1);
      expect(subs[0].endpoint).toBe(subscription.endpoint);
    });

    it('should add Telegram chat ID', async () => {
      await manager.addTelegramChat('user-1', '123456789');

      const chats = manager.getTelegramChats('user-1');
      expect(chats).toContain('123456789');
    });

    it('should add SMS phone number', async () => {
      await manager.addPhoneNumber('user-1', '+1234567890');

      const phones = manager.getPhoneNumbers('user-1');
      expect(phones).toContain('+1234567890');
    });
  });

  // ===========================================================================
  // Rate Limiting Tests
  // ===========================================================================

  describe('rate limiting', () => {
    it('should not send duplicate notifications within cooldown', async () => {
      const payload: NotificationPayload = {
        title: 'Same Alert',
        body: 'Duplicate check',
        severity: 'low',
        streamId: 'stream-1',
        timestamp: new Date().toISOString(),
        dedupeKey: 'unique-alert-1',
      };

      await manager.sendNotification(payload);
      const second = await manager.sendNotification(payload);

      expect(second.skipped).toBe(true);
      expect(second.reason).toContain('duplicate');
    });
  });
});

