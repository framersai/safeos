/**
 * Detection Timeline Component
 *
 * Visual timeline showing detection events over time.
 * Allows scrubbing through history and viewing event details.
 *
 * @module components/DetectionTimeline
 */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface TimelineEvent {
  id: string;
  type: 'motion' | 'audio' | 'person' | 'pet' | 'object' | 'inactivity' | 'emergency';
  timestamp: Date;
  duration?: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
}

interface DetectionTimelineProps {
  events: TimelineEvent[];
  currentTime?: Date;
  startTime?: Date;
  endTime?: Date;
  onEventClick?: (event: TimelineEvent) => void;
  onTimeChange?: (time: Date) => void;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const EVENT_COLORS: Record<TimelineEvent['type'], string> = {
  motion: 'bg-blue-500',
  audio: 'bg-purple-500',
  person: 'bg-amber-500',
  pet: 'bg-emerald-500',
  object: 'bg-cyan-500',
  inactivity: 'bg-slate-500',
  emergency: 'bg-red-500',
};

const EVENT_ICONS: Record<TimelineEvent['type'], React.ReactNode> = {
  motion: <MotionIcon />,
  audio: <AudioIcon />,
  person: <PersonIcon />,
  pet: <PetIcon />,
  object: <ObjectIcon />,
  inactivity: <InactivityIcon />,
  emergency: <EmergencyIcon />,
};

const SEVERITY_OPACITY: Record<TimelineEvent['severity'], string> = {
  low: 'opacity-40',
  medium: 'opacity-60',
  high: 'opacity-80',
  critical: 'opacity-100',
};

// =============================================================================
// Main Component
// =============================================================================

export function DetectionTimeline({
  events,
  currentTime,
  startTime,
  endTime,
  onEventClick,
  onTimeChange,
  className = '',
}: DetectionTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate time range
  const timeRange = useMemo(() => {
    const start = startTime || (events.length > 0
      ? new Date(Math.min(...events.map(e => e.timestamp.getTime())))
      : new Date(Date.now() - 3600000)); // 1 hour ago
    const end = endTime || new Date();
    return { start, end, duration: end.getTime() - start.getTime() };
  }, [events, startTime, endTime]);

  // Group events by hour for display
  const hourMarkers = useMemo(() => {
    const markers: Date[] = [];
    const start = new Date(timeRange.start);
    start.setMinutes(0, 0, 0);

    while (start <= timeRange.end) {
      markers.push(new Date(start));
      start.setHours(start.getHours() + 1);
    }

    return markers;
  }, [timeRange]);

  // Calculate event position on timeline
  const getEventPosition = (event: TimelineEvent): number => {
    const offset = event.timestamp.getTime() - timeRange.start.getTime();
    return (offset / timeRange.duration) * 100;
  };

  // Handle timeline click/drag
  const handleTimelineInteraction = (clientX: number) => {
    if (!containerRef.current || !onTimeChange) return;

    const rect = containerRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = new Date(timeRange.start.getTime() + percentage * timeRange.duration);
    onTimeChange(time);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleTimelineInteraction(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleTimelineInteraction(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  // Current time indicator position
  const currentTimePosition = currentTime
    ? ((currentTime.getTime() - timeRange.start.getTime()) / timeRange.duration) * 100
    : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <TimelineIcon className="w-4 h-4 text-slate-400" />
          Detection Timeline
        </h3>
        <div className="flex items-center gap-4">
          {/* Event type legend */}
          <div className="hidden sm:flex items-center gap-3">
            {Object.entries(EVENT_COLORS).slice(0, 4).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-slate-500 capitalize">{type}</span>
              </div>
            ))}
          </div>
          {/* Time range */}
          <span className="text-xs text-slate-500 font-mono">
            {formatTimeRange(timeRange.start, timeRange.end)}
          </span>
        </div>
      </div>

      {/* Timeline container */}
      <div
        ref={containerRef}
        className="relative h-24 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden cursor-crosshair select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Hour markers */}
        <div className="absolute inset-0">
          {hourMarkers.map((marker, i) => {
            const position = ((marker.getTime() - timeRange.start.getTime()) / timeRange.duration) * 100;
            if (position < 0 || position > 100) return null;

            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-slate-700"
                style={{ left: `${position}%` }}
              >
                <span className="absolute top-1 left-1 text-[10px] text-slate-600 font-mono">
                  {marker.getHours().toString().padStart(2, '0')}:00
                </span>
              </div>
            );
          })}
        </div>

        {/* Events */}
        <div className="absolute inset-x-0 top-8 bottom-2">
          {events.map((event) => {
            const position = getEventPosition(event);
            if (position < 0 || position > 100) return null;

            return (
              <button
                key={event.id}
                className={`absolute transform -translate-x-1/2 transition-all ${
                  hoveredEvent?.id === event.id ? 'z-20 scale-125' : 'z-10'
                }`}
                style={{ left: `${position}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <div
                  className={`w-3 h-3 rounded-full ${EVENT_COLORS[event.type]} ${
                    SEVERITY_OPACITY[event.severity]
                  } ring-2 ring-offset-1 ring-offset-slate-800 ${
                    event.severity === 'critical'
                      ? 'ring-red-400 animate-pulse'
                      : 'ring-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Current time indicator */}
        {currentTimePosition !== null && currentTimePosition >= 0 && currentTimePosition <= 100 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-30"
            style={{ left: `${currentTimePosition}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredEvent && (
          <EventTooltip
            event={hoveredEvent}
            position={getEventPosition(hoveredEvent)}
          />
        )}
      </div>

      {/* Event details panel */}
      {hoveredEvent && (
        <EventDetailPanel event={hoveredEvent} />
      )}

      {/* Mini event list */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(EVENT_COLORS).map(([type, color]) => {
          const count = events.filter(e => e.type === type).length;
          return (
            <div
              key={type}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"
            >
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-slate-400 capitalize flex-1">{type}</span>
              <span className="text-xs font-mono text-slate-300">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Event Tooltip
// =============================================================================

interface EventTooltipProps {
  event: TimelineEvent;
  position: number;
}

function EventTooltip({ event, position }: EventTooltipProps) {
  const adjustedPosition = Math.max(10, Math.min(90, position));

  return (
    <div
      className="absolute bottom-full mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-40 whitespace-nowrap transform -translate-x-1/2 pointer-events-none"
      style={{ left: `${adjustedPosition}%` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[event.type]}`} />
        <span className="text-sm font-medium text-white capitalize">{event.type}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          event.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
          event.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
          event.severity === 'medium' ? 'bg-blue-500/20 text-blue-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>
          {event.severity}
        </span>
      </div>
      <p className="text-xs text-slate-400">{event.description}</p>
      <p className="text-xs text-slate-500 font-mono mt-1">
        {event.timestamp.toLocaleTimeString()}
      </p>
    </div>
  );
}

// =============================================================================
// Event Detail Panel
// =============================================================================

function EventDetailPanel({ event }: { event: TimelineEvent }) {
  return (
    <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg ${EVENT_COLORS[event.type]} bg-opacity-20 flex items-center justify-center`}>
          <div className="w-6 h-6 text-white">
            {EVENT_ICONS[event.type]}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white capitalize">{event.type} Detected</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              event.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
              event.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
              event.severity === 'medium' ? 'bg-blue-500/20 text-blue-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {event.severity}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-2">{event.description}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="font-mono">{event.timestamp.toLocaleString()}</span>
            {event.duration && <span>{event.duration}s duration</span>}
          </div>
        </div>

        {/* Thumbnail */}
        {event.thumbnail && (
          <div className="w-24 h-16 rounded overflow-hidden bg-slate-900">
            <img
              src={event.thumbnail}
              alt="Event thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatTimeRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

// =============================================================================
// Icons
// =============================================================================

function TimelineIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MotionIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PetIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ObjectIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function InactivityIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function EmergencyIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export default DetectionTimeline;
