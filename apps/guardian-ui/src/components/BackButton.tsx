'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevronLeft } from '@/components/icons';

export interface BackButtonProps {
  /** Where to go if there is no in-app history to go back to. */
  fallbackHref?: string;
  ariaLabel?: string;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({
  fallbackHref = '/settings',
  ariaLabel = 'Go back',
  title = 'Back',
  className = '',
  children,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : null;

    router.back();

    if (typeof window === 'undefined') return;

    window.setTimeout(() => {
      if (currentPath && window.location.pathname === currentPath) {
        router.push(fallbackHref);
      }
    }, 120);
  }, [router, fallbackHref]);

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={ariaLabel}
      title={title}
      className={[
        'inline-flex items-center justify-center gap-2',
        'min-w-[44px] min-h-[44px]',
        'rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        className,
      ].join(' ')}
    >
      {children ?? <IconChevronLeft size={20} aria-hidden="true" />}
    </button>
  );
}

export default BackButton;
