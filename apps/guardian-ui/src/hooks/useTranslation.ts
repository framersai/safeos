/**
 * useTranslation Hook
 *
 * React hook for accessing translations with interpolation support.
 *
 * @module hooks/useTranslation
 */

'use client';

import { useCallback } from 'react';
import { useLanguageStore } from '@/stores/language-store';
import { getNestedValue, type Messages } from '@/i18n/messages';

// =============================================================================
// Types
// =============================================================================

type InterpolationValues = Record<string, string | number>;

interface UseTranslationReturn {
  t: (key: string, values?: InterpolationValues) => string;
  locale: string;
  isRtl: boolean;
  messages: Messages;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for accessing translations
 *
 * @example
 * const { t, locale } = useTranslation();
 * const title = t('landing.title');
 * const greeting = t('greeting', { name: 'John' });
 */
export function useTranslation(): UseTranslationReturn {
  const { locale, messages, isRtl } = useLanguageStore();

  const t = useCallback(
    (key: string, values?: InterpolationValues): string => {
      // Get the translation string
      const translation = getNestedValue(messages as unknown as Record<string, unknown>, key);

      if (typeof translation !== 'string') {
        // Return key if translation not found (helps identify missing translations)
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }

      // If no values to interpolate, return as-is
      if (!values) {
        return translation;
      }

      // Interpolate values using {key} syntax
      return translation.replace(/\{(\w+)\}/g, (match, key) => {
        const value = values[key];
        return value !== undefined ? String(value) : match;
      });
    },
    [messages]
  );

  return { t, locale, isRtl, messages };
}

export default useTranslation;

