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

// =============================================================================
// Types
// =============================================================================

interface Stream {
  id: string;
  scenario: 'pet' | 'baby' | 'elderly';
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
  const { streamId: activeStreamId } = useMonitoringStore();

  // Fetch streams
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/streams`
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
    const interval = setInterval(fetchStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span>📹</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  const scenarioIcons = {
    pet: '🐕',
    baby: '👶',
    elderly: '👴',
  };

  const scenarioColors = {
    pet: 'from-amber-500 to-orange-500',
    baby: 'from-pink-500 to-rose-500',
    elderly: 'from-blue-500 to-indigo-500',
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
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scenarioColors[stream.scenario]} flex items-center justify-center mb-3`}
        >
          <span className="text-2xl">{scenarioIcons[stream.scenario]}</span>
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
            <span className="text-slate-500">⏱</span>
            <span className="text-slate-300">{uptime}</span>
          </div>
          {stream.alertCount !== undefined && stream.alertCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-orange-400">🔔</span>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <span className="text-3xl opacity-50">📹</span>
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





