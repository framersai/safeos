/**
 * Notification Routes
 *
 * API routes for notification management.
 *
 * @module api/routes/notifications
 */

import { Router, Request, Response } from 'express';

// =============================================================================
// Router
// =============================================================================

export const notificationRoutes = Router();

// In-memory storage for subscriptions (would use DB in production)
const pushSubscriptions: Map<string, any> = new Map();
const telegramChatIds: Set<string> = new Set();

// =============================================================================
// Routes
// =============================================================================

/**
 * POST /api/notifications/subscribe - Subscribe to browser push
 */
notificationRoutes.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription required' });
    }

    const id = userId || `user-${Date.now()}`;
    pushSubscriptions.set(id, subscription);

    res.json({ success: true, id });
  } catch (error) {
    console.error('Failed to subscribe:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * DELETE /api/notifications/subscribe - Unsubscribe from browser push
 */
notificationRoutes.delete('/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (userId) {
      pushSubscriptions.delete(userId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * POST /api/notifications/telegram/register - Register Telegram chat ID
 */
notificationRoutes.post('/telegram/register', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID required' });
    }

    telegramChatIds.add(chatId);

    res.json({ success: true, chatId });
  } catch (error) {
    console.error('Failed to register Telegram:', error);
    res.status(500).json({ error: 'Failed to register Telegram' });
  }
});

/**
 * DELETE /api/notifications/telegram/register - Unregister Telegram chat ID
 */
notificationRoutes.delete('/telegram/register', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body;

    if (chatId) {
      telegramChatIds.delete(chatId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to unregister Telegram:', error);
    res.status(500).json({ error: 'Failed to unregister Telegram' });
  }
});

/**
 * GET /api/notifications/status - Get notification status
 */
notificationRoutes.get('/status', async (_req: Request, res: Response) => {
  try {
    res.json({
      status: {
        pushSubscriptions: pushSubscriptions.size,
        telegramChats: telegramChatIds.size,
        smsEnabled: !!process.env['TWILIO_ACCOUNT_SID'],
        telegramEnabled: !!process.env['TELEGRAM_BOT_TOKEN'],
      },
    });
  } catch (error) {
    console.error('Failed to get notification status:', error);
    res.status(500).json({ error: 'Failed to get notification status' });
  }
});

/**
 * POST /api/notifications/test - Send test notification
 */
notificationRoutes.post('/test', async (req: Request, res: Response) => {
  try {
    const { channel, target } = req.body;

    // Simulate sending a test notification
    const testMessage = 'This is a test notification from SafeOS Guardian';

    res.json({
      success: true,
      message: `Test notification sent via ${channel}`,
      target,
      content: testMessage,
    });
  } catch (error) {
    console.error('Failed to send test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Export subscriptions for use by notification manager
export function getPushSubscriptions(): Map<string, any> {
  return pushSubscriptions;
}

export function getTelegramChatIds(): Set<string> {
  return telegramChatIds;
}

export default notificationRoutes;
