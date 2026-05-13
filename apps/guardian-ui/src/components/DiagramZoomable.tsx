/**
 * Diagram Zoomable
 *
 * Click-to-zoom modal for inline SVG diagrams. Ported from
 * apps/agentos-live-docs/src/mermaid-zoom.js to React + a11y conventions.
 *
 * Features:
 * - Click the diagram to open a fullscreen modal.
 * - Toolbar: zoom −, percentage label, zoom +, reset, close.
 * - Mouse-wheel zoom (50–400% range, 10% steps).
 * - Click-and-drag panning.
 * - Keyboard: Esc closes, +/=/-/_ zoom, 0 resets.
 * - role="dialog", aria-modal="true", aria-labelledby for screen readers.
 * - Focus trap: tab/shift-tab cycle within the modal while open.
 * - Body scroll lock while open.
 * - "Click to expand" corner badge.
 *
 * @module components/DiagramZoomable
 */

'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

interface DiagramZoomableProps {
  /** Public path to the SVG (e.g. `/diagrams/how-it-works.svg`). */
  src: string;
  /** Alt text shown by the inline image and announced by screen readers. */
  alt: string;
  /** Optional caption rendered below the diagram. */
  caption?: React.ReactNode;
  /** Optional className for the outer figure. */
  className?: string;
  /** Optional zoom-modal title (defaults to alt). */
  modalTitle?: string;
}

// =============================================================================
// Constants
// =============================================================================

const MIN_ZOOM = 50;
const MAX_ZOOM = 400;
const DEFAULT_ZOOM = 100;
const ZOOM_STEP = 10;

// =============================================================================
// Component
// =============================================================================

export function DiagramZoomable({ src, alt, caption, className = '', modalTitle }: DiagramZoomableProps) {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const heading = modalTitle ?? alt;

  // ---------------------------------------------------------------------------
  // Open / close
  // ---------------------------------------------------------------------------

  const open = useCallback(() => {
    setZoomLevel(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Zoom helpers
  // ---------------------------------------------------------------------------

  const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
  const zoomIn = useCallback(() => setZoomLevel((z) => clampZoom(z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoomLevel((z) => clampZoom(z - ZOOM_STEP)), []);
  const resetZoom = useCallback(() => {
    setZoomLevel(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
  }, []);

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomIn();
        return;
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomOut();
        return;
      }
      if (event.key === '0') {
        event.preventDefault();
        resetZoom();
        return;
      }
      // Focus trap — keep tabbing inside the modal.
      if (event.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, zoomIn, zoomOut, resetZoom]);

  // ---------------------------------------------------------------------------
  // Body scroll lock + initial focus on close button + return focus on close
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the close button so screen-reader users land somewhere useful and
    // keyboard users can dismiss with Enter/Space immediately.
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(t);
      // Return focus to the trigger that opened the modal.
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Pan
  // ---------------------------------------------------------------------------

  const handlePanStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      panStartRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
      setIsPanning(true);
    },
    [pan.x, pan.y],
  );

  useEffect(() => {
    if (!isPanning) return;

    const handleMove = (event: MouseEvent) => {
      if (!panStartRef.current) return;
      const dx = event.clientX - panStartRef.current.x;
      const dy = event.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    };
    const handleUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isPanning]);

  // ---------------------------------------------------------------------------
  // Wheel zoom (passive: false so we can preventDefault)
  // ---------------------------------------------------------------------------

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const node = containerRef.current;
    if (!node) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoomLevel((z) => clampZoom(z + delta));
    };
    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => node.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const transform = useMemo(
    () => `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
    [pan.x, pan.y, zoom],
  );

  return (
    <figure className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-label={`Open zoomable view of ${alt}`}
        className="group relative block w-full overflow-hidden rounded-xl border border-emerald-500/15 bg-slate-950/40
                   transition-all hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.10)]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
                   focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block w-full h-auto select-none pointer-events-none"
          draggable={false}
        />

        {/* "Click to expand" badge */}
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide
                     text-emerald-50 bg-emerald-600/85 backdrop-blur-sm rounded-md shadow-md
                     opacity-85 group-hover:opacity-100 group-hover:scale-[1.04] transition-all"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          Click to expand
        </span>
      </button>

      {caption && (
        <figcaption className="mt-3 text-center text-sm text-slate-400">{caption}</figcaption>
      )}

      {isOpen && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/92 backdrop-blur"
        >
          <h2 id={titleId} className="sr-only">{heading}</h2>

          {/* Toolbar */}
          <div
            className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.08] backdrop-blur-sm select-none"
            role="toolbar"
            aria-label="Diagram zoom controls"
          >
            <button
              type="button"
              onClick={zoomOut}
              aria-label="Zoom out (minus key)"
              title="Zoom out (-)"
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-white bg-white/10 hover:bg-white/20
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60
                         disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={zoom <= MIN_ZOOM}
            >
              −
            </button>
            <span
              className="min-w-[3.5rem] text-center font-mono text-xs text-white"
              aria-live="polite"
              aria-label={`Zoom ${zoom}%`}
            >
              {zoom}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              aria-label="Zoom in (plus key)"
              title="Zoom in (+)"
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-white bg-white/10 hover:bg-white/20
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60
                         disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={zoom >= MAX_ZOOM}
            >
              +
            </button>
            <button
              type="button"
              onClick={resetZoom}
              aria-label="Reset zoom and pan (zero key)"
              title="Reset (0)"
              className="ml-1 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-white/10 hover:bg-white/20
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              Reset
            </button>
            <span aria-hidden="true" className="mx-1 inline-block h-5 w-px bg-white/20" />
            <button
              ref={closeBtnRef}
              type="button"
              onClick={close}
              aria-label="Close zoomable view (escape key)"
              title="Close (Esc)"
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-white/10 hover:bg-white/20
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              ✕ Close
            </button>
          </div>

          {/* Image canvas */}
          <div
            ref={containerRef}
            onMouseDown={handlePanStart}
            className="relative w-full max-w-[95vw] max-h-[calc(90vh-4rem)] overflow-hidden rounded-xl bg-slate-950"
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          >
            <div
              className="origin-top-left transition-transform duration-100 ease-out p-8"
              style={{ transform }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="block w-full h-auto select-none pointer-events-none"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400 text-center">
            Scroll to zoom · drag to pan · keys <kbd className="px-1 py-0.5 bg-white/10 rounded">+</kbd>{' '}
            <kbd className="px-1 py-0.5 bg-white/10 rounded">−</kbd>{' '}
            <kbd className="px-1 py-0.5 bg-white/10 rounded">0</kbd>{' '}
            <kbd className="px-1 py-0.5 bg-white/10 rounded">Esc</kbd>
          </p>
        </div>
      )}
    </figure>
  );
}

export default DiagramZoomable;
