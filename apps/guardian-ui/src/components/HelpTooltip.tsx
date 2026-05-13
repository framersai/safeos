/**
 * Help Tooltip
 *
 * Accessible inline help: small "?" trigger button that opens a small popover
 * with explanatory text. Closes on Escape, click-outside, or losing focus.
 *
 * Pattern (per WAI-ARIA APG disclosure widget — not a true tooltip because the
 * popover content is interactive: it can contain links):
 * - Button has aria-expanded + aria-controls pointing at the popover.
 * - Popover has role="region" + aria-label.
 * - Focus stays put — clicking the button toggles, doesn't move focus.
 *
 * @module components/HelpTooltip
 */

'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

interface HelpTooltipProps {
  /** Plain-text or rich-content help body. */
  children: React.ReactNode;
  /** Short label for screen readers (e.g. "Help: Resend API key"). */
  label: string;
  /** Optional className for the inline trigger. */
  className?: string;
}

export function HelpTooltip({ children, label, className = '' }: HelpTooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  // Click outside + Escape close
  useEffect(() => {
    if (!open) return;
    const handleDocClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) close();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close]);

  return (
    <span ref={containerRef} className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        title={label}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full
                   text-[10px] font-bold leading-none
                   bg-slate-700 text-slate-200 hover:bg-emerald-600 hover:text-white
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60
                   transition-colors"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="region"
          aria-label={label}
          className="absolute left-0 top-6 z-30 w-72 max-w-[80vw] p-3 rounded-lg
                     bg-slate-950 border border-emerald-500/30 shadow-xl
                     text-xs leading-relaxed text-slate-200 whitespace-normal"
        >
          {children}
        </span>
      )}
    </span>
  );
}

export default HelpTooltip;
