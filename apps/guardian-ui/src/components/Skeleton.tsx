/**
 * Skeleton Loader Components
 *
 * Reusable skeleton loading states for better perceived performance.
 * Use these while content is loading to prevent layout shift.
 *
 * @module components/Skeleton
 */

'use client';

import React from 'react';

// =============================================================================
// Base Skeleton
// =============================================================================

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-800 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// Text Skeleton
// =============================================================================

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Card Skeleton
// =============================================================================

interface SkeletonCardProps {
  className?: string;
  hasHeader?: boolean;
  hasImage?: boolean;
}

export function SkeletonCard({ className = '', hasHeader = true, hasImage = false }: SkeletonCardProps) {
  return (
    <div className={`p-4 bg-slate-900 border border-slate-800 rounded-xl ${className}`} aria-hidden="true">
      {hasImage && <Skeleton className="h-40 w-full mb-4 rounded-lg" />}
      {hasHeader && (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      )}
      <SkeletonText lines={2} />
    </div>
  );
}

// =============================================================================
// Stat Card Skeleton
// =============================================================================

export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 bg-slate-900 border border-slate-800 rounded-xl ${className}`} aria-hidden="true">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="w-5 h-5 rounded" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// =============================================================================
// Video Skeleton
// =============================================================================

export function SkeletonVideo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${className}`} aria-hidden="true">
      <div className="aspect-video flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-lg" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
      {/* Fake controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950/80 to-transparent">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="flex-1 h-1 rounded" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// List Skeleton
// =============================================================================

interface SkeletonListProps {
  items?: number;
  className?: string;
}

export function SkeletonList({ items = 5, className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Timeline Skeleton
// =============================================================================

export function SkeletonTimeline({ items = 5, className = '' }: SkeletonListProps) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-800" />

      <div className="space-y-6">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="relative pl-10">
            {/* Timeline dot */}
            <Skeleton className="absolute left-2 top-1 w-4 h-4 rounded-full" />

            {/* Content */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Dashboard Skeleton
// =============================================================================

export function SkeletonDashboard() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard hasHeader={false} />
          <SkeletonVideo />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonList items={4} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Monitor Page Skeleton
// =============================================================================

export function SkeletonMonitor() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Video area */}
      <SkeletonVideo className="aspect-video max-h-[60vh]" />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Skeleton className="w-24 h-10 rounded-lg" />
          <Skeleton className="w-24 h-10 rounded-lg" />
          <Skeleton className="w-24 h-10 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
      </div>

      {/* Panels */}
      <div className="grid md:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

// =============================================================================
// Settings Skeleton
// =============================================================================

export function SkeletonSettings() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="w-24 h-10 rounded-lg" />
      </div>

      {/* Settings groups */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="w-12 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
