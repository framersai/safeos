/**
 * i18n Configuration
 *
 * Internationalization configuration for SafeOS Guardian.
 * Supports multiple languages with fallback to English.
 *
 * @module i18n/config
 */

export const locales = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'pt', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
  pt: 'Português',
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  zh: '🇨🇳',
  ja: '🇯🇵',
  pt: '🇧🇷',
  ar: '🇸🇦',
};

export const rtlLocales: Locale[] = ['ar'];

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}






