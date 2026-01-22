/**
 * Stream Grid Component
 *
 * Displays grid of active monitoring streams.
 *
 * @module components/StreamGrid
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMonitoringStore } from '../stores/monitoring-store';
import { useBackendStatus } from '@/contexts/BackendStatusContext';

// =============================================================================
// Types
// =============================================================================

interface Stream {
  id: string;
  scenario: 'pet' | 'baby' | 'elderly' | 'security';
  status: 'active' | 'paused' | 'ended';
  startedAt: string;
  lastActivity?: string;
  alertCount?: number;
}

// =============================================================================
// StreamGrid Component
// =============================================================================

export function StreamGrid() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const { streamId: activeStreamId, streams: localStreams, alerts: localAlerts } = useMonitoringStore();
  const { status: backendStatus, config: backendConfig } = useBackendStatus();

  // Fetch streams
  useEffect(() => {
    const fetchStreams = async () => {
      // Local-only: show locally tracked streams (no monitoring server configured/online)
      if (backendStatus.api !== 'connected' || !backendConfig.apiUrl) {
        const derived: Stream[] = localStreams.map((s) => ({
          id: s.id,
          scenario: s.scenario,
          status: s.status,
          startedAt: s.startedAt,
          alertCount: localAlerts.filter((a) => a.streamId === s.id).length,
        }));

        setStreams(derived);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${backendConfig.apiUrl}/api/streams`
        );
        if (response.ok) {
          const data = await response.json();
          setStreams(data.streams || []);
        }
      } catch (error) {
        console.error('Failed to fetch streams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
    if (backendStatus.api !== 'connected' || !backendConfig.apiUrl) return;

    const interval = setInterval(fetchStreams, 5000);
    return () => clearInterval(interval);
  }, [backendConfig.apiUrl, backendStatus.api, localAlerts, localStreams]);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          Active Streams
        </h3>
        <Link
          href="/monitor"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          + New Stream
        </Link>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <LoadingState />
        ) : streams.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                isActive={stream.id === activeStreamId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StreamCardProps {
  stream: Stream;
  isActive: boolean;
}

function StreamCard({ stream, isActive }: StreamCardProps) {
  // SVG icons for accessibility (screen reader compatible)
  const scenarioIcons: Record<Stream['scenario'], React.ReactNode> = {
    pet: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5" />
        <path d="M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75z" />
        <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306" />
      </svg>
    ),
    baby: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 1 0-16 0" />
        <path d="M12 11v2" />
      </svg>
    ),
    elderly: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="5" r="3" />
        <path d="M12 8v4m0 0-2 8m2-8 2 8" />
        <path d="M6 13h4m4 0h4" />
      </svg>
    ),
    security: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  };

  const scenarioColors = {
    pet: 'from-amber-500 to-orange-500',
    baby: 'from-pink-500 to-rose-500',
    elderly: 'from-blue-500 to-indigo-500',
    security: 'from-emerald-500 to-teal-500',
  };

  const statusColors = {
    active: 'bg-emerald-500',
    paused: 'bg-yellow-500',
    ended: 'bg-slate-500',
  };

  const uptime = getUptime(stream.startedAt);

  return (
    <Link href={`/monitor?stream=${stream.id}`}>
      <div
        className={`relative bg-slate-700/50 rounded-lg p-4 border transition-all cursor-pointer hover:border-emerald-500/50 ${
          isActive
            ? 'border-emerald-500 ring-1 ring-emerald-500/30'
            : 'border-slate-600/50'
        }`}
      >
        {/* Status indicator */}
        <div className="absolute top-3 right-3">
          <div className={`w-2 h-2 rounded-full ${statusColors[stream.status]} animate-pulse`} />
        </div>

        {/* Scenario icon */}
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scenarioColors[stream.scenario]} flex items-center justify-center mb-3 text-white`}
          aria-label={`${stream.scenario} monitoring`}
        >
          {scenarioIcons[stream.scenario]}
        </div>

        {/* Stream info */}
        <h4 className="font-medium text-white capitalize mb-1">
          {stream.scenario} Monitoring
        </h4>
        <p className="text-xs text-slate-400 mb-2">
          ID: {stream.id.slice(0, 8)}...
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="text-slate-300">{uptime}</span>
          </div>
          {stream.alertCount !== undefined && stream.alertCount > 0 && (
            <div className="flex items-center gap-1" role="status" aria-label={`${stream.alertCount} alerts`}>
              <svg className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="text-orange-400">{stream.alertCount}</span>
            </div>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-b-lg" />
        )}
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-slate-700/30 rounded-lg p-4 animate-pulse"
        >
          <div className="w-12 h-12 bg-slate-600 rounded-xl mb-3" />
          <div className="h-4 bg-slate-600 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-600 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </div>
      <h4 className="text-white font-medium mb-2">No Active Streams</h4>
      <p className="text-sm text-slate-400 mb-4">
        Start monitoring to create your first stream.
      </p>
      <Link
        href="/monitor"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <span>+</span>
        Start Monitoring
      </Link>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getUptime(startedAt: string): string {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default StreamGrid;








