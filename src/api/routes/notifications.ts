/**
 * Notifications API Routes
 *
 * Endpoints for managing notification settings.
 *
 * @module api/routes/notifications
 */

import { Router, type Request, type Response } from 'express';
import { getDefaultNotificationManager } from '../../lib/alerts/notification-manager.js';
import { getDefaultTelegramBot } from '../../lib/alerts/telegram.js';

const router = Router();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/notifications/status
 * Get notification channel status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const notificationManager = getDefaultNotificationManager();
    const status = notificationManager.getChannelStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/notifications/subscribe
 * Subscribe to browser push notifications
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { subscription, streamId } = req.body;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is required',
      });
    }

    const notificationManager = getDefaultNotificationManager();
    notificationManager.registerBrowserSubscription(subscription, streamId);

    res.json({
      success: true,
      message: 'Subscribed to push notifications',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe from browser push notifications
 */
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        error: 'Subscription is required',
      });
    }

    const notificationManager = getDefaultNotificationManager();
    notificationManager.unregisterBrowserSubscription(subscription);

    res.json({
      success: true,
      message: 'Unsubscribed from push notifications',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/notifications/telegram/register
 * Register a Telegram chat ID
 */
router.post('/telegram/register', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    const telegramBot = getDefaultTelegramBot();
    if (!telegramBot) {
      return res.status(503).json({
        success: false,
        error: 'Telegram bot is not configured',
      });
    }

    telegramBot.registerChatId(String(chatId));

    res.json({
      success: true,
      message: 'Telegram chat ID registered',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * DELETE /api/notifications/telegram/:chatId
 * Unregister a Telegram chat ID
 */
router.delete('/telegram/:chatId', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    const telegramBot = getDefaultTelegramBot();
    if (!telegramBot) {
      return res.status(503).json({
        success: false,
        error: 'Telegram bot is not configured',
      });
    }

    telegramBot.unregisterChatId(chatId);

    res.json({
      success: true,
      message: 'Telegram chat ID unregistered',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/notifications/sms/register
 * Register a phone number for SMS
 */
router.post('/sms/register', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, streamId } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    const notificationManager = getDefaultNotificationManager();
    notificationManager.registerPhoneNumber(phoneNumber, streamId);

    res.json({
      success: true,
      message: 'Phone number registered',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * DELETE /api/notifications/sms/:phoneNumber
 * Unregister a phone number
 */
router.delete('/sms/:phoneNumber', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.params;

    const notificationManager = getDefaultNotificationManager();
    notificationManager.unregisterPhoneNumber(phoneNumber);

    res.json({
      success: true,
      message: 'Phone number unregistered',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/notifications/test
 * Send a test notification
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { channel, target } = req.body;

    if (!channel) {
      return res.status(400).json({
        success: false,
        error: 'Channel is required (browser, sms, telegram)',
      });
    }

    const notificationManager = getDefaultNotificationManager();

    const testPayload = {
      alertId: 'test-alert',
      title: 'Test Notification',
      message: 'This is a test notification from SafeOS',
      severity: 'info' as const,
      timestamp: new Date().toISOString(),
    };

    let result;
    switch (channel) {
      case 'browser':
        result = await notificationManager.sendBrowserPush(testPayload, target);
        break;
      case 'sms':
        if (!target) {
          return res.status(400).json({
            success: false,
            error: 'Phone number is required for SMS test',
          });
        }
        result = await notificationManager.sendSms(testPayload, target);
        break;
      case 'telegram':
        if (!target) {
          return res.status(400).json({
            success: false,
            error: 'Chat ID is required for Telegram test',
          });
        }
        result = await notificationManager.sendTelegram(testPayload, target);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid channel',
        });
    }

    res.json({
      success: true,
      data: { sent: result },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * PUT /api/notifications/settings
 * Update notification settings
 */
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'Settings are required',
      });
    }

    const notificationManager = getDefaultNotificationManager();
    notificationManager.updateSettings(settings);

    res.json({
      success: true,
      message: 'Settings updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;
