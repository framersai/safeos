/**
 * Language Store
 *
 * Zustand store for managing application language/locale settings.
 * Persists language preference to localStorage.
 *
 * @module stores/language-store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Locale, locales, defaultLocale, isRtl } from '@/i18n/config';
import { getMessages, type Messages } from '@/i18n/messages';

// =============================================================================
// Types
// =============================================================================

interface LanguageState {
  locale: Locale;
  messages: Messages;
  isRtl: boolean;
  isLoaded: boolean;
}

interface LanguageActions {
  setLocale: (locale: Locale) => void;
  detectLocale: () => void;
  reset: () => void;
}

type LanguageStore = LanguageState & LanguageActions;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Detect browser's preferred locale
 */
function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  // Check navigator.language
  const browserLang = navigator.language.split('-')[0];

  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  // Check navigator.languages array
  for (const lang of navigator.languages) {
    const shortLang = lang.split('-')[0];
    if (locales.includes(shortLang as Locale)) {
      return shortLang as Locale;
    }
  }

  return defaultLocale;
}

// =============================================================================
// Store
// =============================================================================

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      // Initial state
      locale: defaultLocale,
      messages: getMessages(defaultLocale),
      isRtl: isRtl(defaultLocale),
      isLoaded: false,

      // Set locale
      setLocale: (locale: Locale) => {
        // Validate locale
        if (!locales.includes(locale)) {
          console.warn(`Invalid locale: ${locale}, falling back to ${defaultLocale}`);
          locale = defaultLocale;
        }

        const messages = getMessages(locale);
        const rtl = isRtl(locale);

        // Update document direction for RTL languages
        if (typeof document !== 'undefined') {
          document.documentElement.dir = rtl ? 'rtl' : 'ltr';
          document.documentElement.lang = locale;
        }

        set({
          locale,
          messages,
          isRtl: rtl,
          isLoaded: true,
        });
      },

      // Auto-detect locale from browser
      detectLocale: () => {
        const detected = detectBrowserLocale();
        const messages = getMessages(detected);
        const rtl = isRtl(detected);

        if (typeof document !== 'undefined') {
          document.documentElement.dir = rtl ? 'rtl' : 'ltr';
          document.documentElement.lang = detected;
        }

        set({
          locale: detected,
          messages,
          isRtl: rtl,
          isLoaded: true,
        });
      },

      // Reset to default
      reset: () => {
        const messages = getMessages(defaultLocale);
        const rtl = isRtl(defaultLocale);

        if (typeof document !== 'undefined') {
          document.documentElement.dir = rtl ? 'rtl' : 'ltr';
          document.documentElement.lang = defaultLocale;
        }

        set({
          locale: defaultLocale,
          messages,
          isRtl: rtl,
          isLoaded: true,
        });
      },
    }),
    {
      name: 'safeos-language',
      // Only persist the locale, not the full messages
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Rehydrate messages after loading persisted locale
          const messages = getMessages(state.locale);
          const rtl = isRtl(state.locale);

          if (typeof document !== 'undefined') {
            document.documentElement.dir = rtl ? 'rtl' : 'ltr';
            document.documentElement.lang = state.locale;
          }

          state.messages = messages;
          state.isRtl = rtl;
          state.isLoaded = true;
        }
      },
    }
  )
);

// =============================================================================
// Selectors
// =============================================================================

export const selectLocale = (state: LanguageStore) => state.locale;
export const selectMessages = (state: LanguageStore) => state.messages;
export const selectIsRtl = (state: LanguageStore) => state.isRtl;
export const selectIsLoaded = (state: LanguageStore) => state.isLoaded;

