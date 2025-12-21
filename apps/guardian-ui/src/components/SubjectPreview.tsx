/**
 * Subject Preview Component
 * 
 * Displays the active subject being watched with
 * real-time confidence meter and match indicators.
 * 
 * @module components/SubjectPreview
 */

'use client';

import { useMemo } from 'react';
import { IconPaw, IconUser, IconSearch, IconX, IconCheck } from './icons';
import { useLostFoundStore, getSubjectTypeIcon } from '../stores/lost-found-store';
import { getMatchQuality } from '../lib/subject-matcher';

// =============================================================================
// Types
// =============================================================================

interface SubjectPreviewProps {
  /** Display mode: 'compact' for overlay, 'full' for standalone */
  mode?: 'compact' | 'full';
  /** Show close button */
  showClose?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Click handler */
  onClick?: () => void;
}

// =============================================================================
// SubjectPreview Component
// =============================================================================

export function SubjectPreview({
  mode = 'compact',
  showClose = true,
  onClose,
  onClick,
}: SubjectPreviewProps) {
  const {
    activeSubject,
    isWatching,
    currentConfidence,
    consecutiveMatches,
    recentMatches,
    stopWatching,
  } = useLostFoundStore();

  const quality = useMemo(() => {
    return currentConfidence > 0 ? getMatchQuality(currentConfidence) : null;
  }, [currentConfidence]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pet':
        return <IconPaw size={mode === 'compact' ? 16 : 24} />;
      case 'person':
        return <IconUser size={mode === 'compact' ? 16 : 24} />;
      default:
        return <IconSearch size={mode === 'compact' ? 16 : 24} />;
    }
  };

  if (!activeSubject) {
    return null;
  }

  if (mode === 'compact') {
    return (
      <div
        className={`
          bg-[var(--color-steel-900)]/95 backdrop-blur-sm
          border border-[var(--color-steel-700)] rounded-xl
          p-3 min-w-[200px] max-w-[280px]
          ${onClick ? 'cursor-pointer hover:border-[var(--color-steel-600)]' : ''}
          transition-all
        `}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          {/* Subject thumbnail */}
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-steel-800)] flex-shrink-0">
            {activeSubject.referenceImages[0] ? (
              <img
                src={activeSubject.referenceImages[0]}
                alt={activeSubject.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-steel-500)]">
                {getTypeIcon(activeSubject.type)}
              </div>
            )}
          </div>
          
          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-white truncate">
                {activeSubject.name}
              </span>
              {isWatching && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-[var(--color-steel-400)]">
              {isWatching ? 'Watching...' : 'Paused'}
            </p>
          </div>
          
          {/* Close button */}
          {showClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                stopWatching();
                onClose?.();
              }}
              className="p-1 text-[var(--color-steel-400)] hover:text-white transition-colors"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
        
        {/* Confidence meter */}
        {isWatching && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-steel-400)]">Confidence</span>
              <span className={quality ? `text-${quality.color}-400` : 'text-[var(--color-steel-500)]'}>
                {currentConfidence > 0 ? `${currentConfidence}%` : 'Scanning...'}
              </span>
            </div>
            <div className="h-1.5 bg-[var(--color-steel-700)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  quality
                    ? quality.color === 'green'
                      ? 'bg-green-500'
                      : quality.color === 'emerald'
                        ? 'bg-emerald-500'
                        : quality.color === 'yellow'
                          ? 'bg-yellow-500'
                          : quality.color === 'orange'
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                    : 'bg-[var(--color-steel-600)]'
                }`}
                style={{ width: `${Math.max(currentConfidence, 0)}%` }}
              />
            </div>
            
            {/* Match indicator */}
            {consecutiveMatches > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <IconCheck size={12} className="text-emerald-400" />
                <span className="text-xs text-emerald-400">
                  {consecutiveMatches} consecutive match{consecutiveMatches !== 1 ? 'es' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className="bg-[var(--color-steel-900)] border border-[var(--color-steel-700)] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Subject image */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--color-steel-800)] flex-shrink-0">
          {activeSubject.referenceImages[0] ? (
            <img
              src={activeSubject.referenceImages[0]}
              alt={activeSubject.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-steel-500)]">
              {getTypeIcon(activeSubject.type)}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-semibold text-white">
              {activeSubject.name}
            </h3>
            {isWatching && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-[var(--color-steel-400)]">
            <span className="capitalize">{activeSubject.type}</span>
            <span>•</span>
            <span>{activeSubject.matchCount} matches found</span>
          </div>
          
          {activeSubject.description && (
            <p className="text-sm text-[var(--color-steel-400)] mt-2">
              {activeSubject.description}
            </p>
          )}
        </div>
        
        {/* Close button */}
        {showClose && (
          <button
            onClick={() => {
              stopWatching();
              onClose?.();
            }}
            className="p-2 text-[var(--color-steel-400)] hover:text-white transition-colors"
          >
            <IconX size={20} />
          </button>
        )}
      </div>
      
      {/* Confidence display */}
      {isWatching && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--color-steel-300)]">
              Current Match Confidence
            </span>
            <span className={`text-2xl font-bold ${
              quality
                ? quality.color === 'green'
                  ? 'text-green-400'
                  : quality.color === 'emerald'
                    ? 'text-emerald-400'
                    : quality.color === 'yellow'
                      ? 'text-yellow-400'
                      : quality.color === 'orange'
                        ? 'text-orange-400'
                        : 'text-red-400'
                : 'text-[var(--color-steel-500)]'
            }`}>
              {currentConfidence > 0 ? `${currentConfidence}%` : '—'}
            </span>
          </div>
          
          <div className="h-3 bg-[var(--color-steel-700)] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                quality
                  ? quality.color === 'green'
                    ? 'bg-green-500'
                    : quality.color === 'emerald'
                      ? 'bg-emerald-500'
                      : quality.color === 'yellow'
                        ? 'bg-yellow-500'
                        : quality.color === 'orange'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                  : 'bg-[var(--color-steel-600)]'
              }`}
              style={{ width: `${Math.max(currentConfidence, 0)}%` }}
            />
          </div>
          
          {quality && (
            <p className="text-sm text-[var(--color-steel-400)] mt-2">
              {quality.description}
            </p>
          )}
        </div>
      )}
      
      {/* Recent matches */}
      {recentMatches.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--color-steel-300)] mb-3">
            Recent Matches
          </h4>
          <div className="space-y-2">
            {recentMatches.slice(0, 5).map((match) => {
              const matchQuality = getMatchQuality(match.confidence);
              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-2 bg-[var(--color-steel-800)] rounded-lg"
                >
                  <span className="text-sm text-[var(--color-steel-300)]">
                    {new Date(match.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-sm font-medium text-${matchQuality.color}-400`}>
                    {match.confidence}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Reference images */}
      {activeSubject.referenceImages.length > 1 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-[var(--color-steel-300)] mb-3">
            Reference Images
          </h4>
          <div className="flex gap-2">
            {activeSubject.referenceImages.map((img, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-steel-800)]"
              >
                <img
                  src={img}
                  alt={`Reference ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Compact Overlay Version
// =============================================================================

export function SubjectPreviewOverlay() {
  const { activeSubject, isWatching } = useLostFoundStore();

  if (!activeSubject || !isWatching) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-10">
      <SubjectPreview mode="compact" />
    </div>
  );
}

export default SubjectPreview;

