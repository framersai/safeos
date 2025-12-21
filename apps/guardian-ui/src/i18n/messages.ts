/**
 * Message Loader
 *
 * Loads and caches translation messages for all supported locales.
 *
 * @module i18n/messages
 */

import type { Locale } from './config';

// Import all messages statically for SSR support
import en from './messages/en.json';
import es from './messages/es.json';
import fr from './messages/fr.json';
import de from './messages/de.json';
import zh from './messages/zh.json';
import ja from './messages/ja.json';
import pt from './messages/pt.json';
import ar from './messages/ar.json';

// Message type based on English translation structure
export type Messages = typeof en;

// All messages indexed by locale
const messages: Record<Locale, Messages> = {
  en,
  es,
  fr,
  de,
  zh,
  ja,
  pt,
  ar,
};

/**
 * Get messages for a specific locale
 */
export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages.en;
}

/**
 * Get a nested value from messages using dot notation
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
}

