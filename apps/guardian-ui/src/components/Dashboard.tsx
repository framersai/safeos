/**
 * Dashboard Component
 *
 * Main dashboard with real-time status and alerts.
 *
 * @module components/Dashboard
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMonitoringStore } from '../stores/monitoring-store';
import { useWebSocket } from '../lib/websocket';
import { SystemStatus } from './SystemStatus';
import { AlertPanel } from './AlertPanel';
import { StreamGrid } from './StreamGrid';
import { QuickActions } from './QuickActions';

// =============================================================================
// Types
// =============================================================================

interface DashboardStats {
  activeStreams: number;
  totalAlerts: number;
  pendingAlerts: number;
  systemHealth: 'healthy' | 'degraded' | 'offline';
  ollamaStatus: 'online' | 'offline';
  analysisQueueSize: number;
  cloudFallbackRate: number;
}

// =============================================================================
// Dashboard Component
// =============================================================================

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeStreams: 0,
    totalAlerts: 0,
    pendingAlerts: 0,
    systemHealth: 'healthy',
    ollamaStatus: 'offline',
    analysisQueueSize: 0,
    cloudFallbackRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isStreaming, alerts, addAlert } = useMonitoringStore();

  // WebSocket for real-time updates
  const { sendMessage, lastMessage, isConnected } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    {
      onMessage: (message) => {
        if (message.type === 'alert') {
          addAlert(message.payload);
        } else if (message.type === 'stats') {
          setStats(message.payload);
        }
      },
    }
  );

  // Fetch initial stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/status`
      );
      if (response.ok) {
        const data = await response.json();
        setStats({
          activeStreams: data.stats?.activeStreams || 0,
          totalAlerts: data.stats?.totalAlerts || 0,
          pendingAlerts: data.stats?.pendingAlerts || 0,
          systemHealth: data.healthy ? 'healthy' : 'degraded',
          ollamaStatus: data.ollama?.available ? 'online' : 'offline',
          analysisQueueSize: data.stats?.queueSize || 0,
          cloudFallbackRate: data.stats?.cloudFallbackRate || 0,
        });
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch system status');
      setStats((prev) => ({ ...prev, systemHealth: 'offline' }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Subscribe to stats updates
  useEffect(() => {
    if (isConnected) {
      sendMessage({ type: 'subscribe', channel: 'stats' });
    }
  }, [isConnected, sendMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <span className="text-xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SafeOS Guardian</h1>
                <p className="text-xs text-slate-400">Humanitarian AI Monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ConnectionStatus connected={isConnected} />
              <HealthIndicator health={stats.systemHealth} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStats} />
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Stats Row */}
            <div className="col-span-12">
              <StatsGrid stats={stats} />
            </div>

            {/* Main Grid */}
            <div className="col-span-12 lg:col-span-8">
              <div className="space-y-6">
                {/* Quick Actions */}
                <QuickActions />

                {/* Active Streams */}
                <StreamGrid />
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-4">
              <div className="space-y-6">
                {/* System Status */}
                <SystemStatus stats={stats} />

                {/* Alerts Panel */}
                <AlertPanel alerts={alerts} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-800/30 py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">
            SafeOS Guardian • Part of SuperCloud's 10% for Humanity Initiative
          </p>
          <p className="text-xs text-slate-600 mt-1">
            This is a supplementary monitoring tool. Not a replacement for direct care.
          </p>
        </div>
      </footer>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50">
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
        }`}
      />
      <span className="text-xs text-slate-300">
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

function HealthIndicator({
  health,
}: {
  health: 'healthy' | 'degraded' | 'offline';
}) {
  const colors = {
    healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    degraded: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    offline: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const labels = {
    healthy: 'All Systems Go',
    degraded: 'Degraded',
    offline: 'Offline',
  };

  return (
    <div
      className={`px-3 py-1.5 rounded-lg border ${colors[health]} text-xs font-medium`}
    >
      {labels[health]}
    </div>
  );
}

function StatsGrid({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      label: 'Active Streams',
      value: stats.activeStreams,
      icon: '📹',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Pending Alerts',
      value: stats.pendingAlerts,
      icon: '🔔',
      color:
        stats.pendingAlerts > 0
          ? 'from-orange-500 to-red-500'
          : 'from-slate-600 to-slate-700',
    },
    {
      label: 'Queue Size',
      value: stats.analysisQueueSize,
      icon: '⏳',
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Ollama Status',
      value: stats.ollamaStatus === 'online' ? '✓ Online' : '✗ Offline',
      icon: '🤖',
      color:
        stats.ollamaStatus === 'online'
          ? 'from-emerald-500 to-teal-500'
          : 'from-red-500 to-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}
            >
              <span className="text-lg">{item.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 mt-4">Loading dashboard...</p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
          <span className="text-3xl">⚠️</span>
        </div>
        <p className="text-red-400 mt-4">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default Dashboard;








