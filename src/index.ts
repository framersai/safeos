/**
 * SafeOS Package Index
 *
 * Main entry point for the SafeOS package.
 *
 * @module safeos
 */

// =============================================================================
// Types
// =============================================================================

export * from './types';

// =============================================================================
// Database
// =============================================================================

export {
  createSafeOSDatabase,
  getSafeOSDatabase,
  runMigrations,
  cleanupOldFrames,
  generateId,
  now,
  closeDatabase,
} from './db';

// =============================================================================
// API Server
// =============================================================================

export { SafeOSServer } from './api/server';

// =============================================================================
// Queues
// =============================================================================

export { AnalysisQueue } from './queues/analysis-queue';

// =============================================================================
// Ollama Client
// =============================================================================

export { OllamaClient } from './lib/ollama/client';

// =============================================================================
// Analysis
// =============================================================================

export { cloudFallbackAnalysis, getAvailableProviders } from './lib/analysis/cloud-fallback';

// =============================================================================
// Alerts
// =============================================================================

export {
  AlertEscalationManager,
  getEscalationManager,
  ESCALATION_LEVELS,
} from './lib/alerts/escalation';

export { NotificationManager, getNotificationManager } from './lib/alerts/notification-manager';

export { TelegramBotService } from './lib/alerts/telegram';

export { sendTwilioSms, isTwilioConfigured } from './lib/alerts/twilio';

export {
  sendBrowserPushNotification,
  isVapidConfigured,
} from './lib/alerts/browser-push';

// =============================================================================
// Safety
// =============================================================================

export { ContentFilter } from './lib/safety/content-filter';

export {
  CRITICAL_DISCLAIMER,
  BABY_MONITORING_DISCLAIMER,
  ELDERLY_MONITORING_DISCLAIMER,
  PET_MONITORING_DISCLAIMER,
  ACKNOWLEDGMENT_TEXT,
  getScenarioDisclaimer,
  getFullDisclaimer,
} from './lib/safety/disclaimers';

// =============================================================================
// Version
// =============================================================================

export const VERSION = '0.1.0';
