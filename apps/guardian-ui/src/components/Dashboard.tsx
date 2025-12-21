'use client';

/**
 * Dashboard Component
 *
 * Main monitoring dashboard with industrial, utilitarian design.
 * No emojis. Custom SVG icons. Monospace data displays.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useMonitoringStore } from '../stores/monitoring-store';
import { useWebSocket } from '../lib/websocket';
import {
  IconShieldCheck,
  IconCamera,
  IconAlertTriangle,
  IconActivity,
  IconServer,
  IconCpu,
  IconWifi,
  IconWifiOff,
  IconSettings,
  IconHistory,
  IconPlay,
  IconBell,
  IconChevronRight,
  IconPulse,
  IconRefresh,
} from './icons';
import { SafeOSLogo, SuperCloudLogo } from './Logo';

// =============================================================================
// Types
// =============================================================================

interface SystemStats {
  ollamaStatus: 'online' | 'offline';
  analysisQueueSize: number;
  activeStreams: number;
  cloudFallbackRate: number;
  systemHealth: 'healthy' | 'degraded' | 'offline';
  framesAnalyzedToday: number;
  alertsToday: number;
  avgResponseTime: number;
}

// =============================================================================
// Dashboard Component
// =============================================================================

export function Dashboard() {
  const [stats, setStats] = useState<SystemStats>({
    ollamaStatus: 'offline',
    analysisQueueSize: 0,
    activeStreams: 0,
    cloudFallbackRate: 0,
    systemHealth: 'offline',
    framesAnalyzedToday: 0,
    alertsToday: 0,
    avgResponseTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { isStreaming, alerts, addAlert } = useMonitoringStore();

  const { sendMessage, isConnected } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    {
      onMessage: (message) => {
        if (message.type === 'alert') {
          addAlert(message.payload);
        } else if (message.type === 'stats') {
          setStats(message.payload);
          setLastUpdate(new Date());
        }
      },
    }
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/system/status`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (isConnected) {
      sendMessage({ type: 'subscribe', channel: 'stats' });
    }
  }, [isConnected, sendMessage]);

  return (
    <div className="min-h-screen bg-[var(--color-steel-950)]">
      {/* Header */}
      <Header isConnected={isConnected} systemHealth={stats.systemHealth} />

      {/* Main Content */}
      <main className="container py-6">
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid gap-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Active Streams"
                value={stats.activeStreams}
                icon={<IconCamera size={20} />}
                status={stats.activeStreams > 0 ? 'active' : 'inactive'}
              />
              <StatCard
                label="Alerts Today"
                value={stats.alertsToday}
                icon={<IconBell size={20} />}
                status={stats.alertsToday > 0 ? 'warning' : 'inactive'}
              />
              <StatCard
                label="Queue Depth"
                value={stats.analysisQueueSize}
                icon={<IconActivity size={20} />}
                status={stats.analysisQueueSize > 10 ? 'warning' : 'active'}
              />
              <StatCard
                label="Avg Response"
                value={`${stats.avgResponseTime}ms`}
                icon={<IconCpu size={20} />}
              />
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Actions & Streams */}
              <div className="lg:col-span-2 space-y-6">
                <QuickActionsPanel isStreaming={isStreaming} />
                <ActiveStreamsPanel streamCount={stats.activeStreams} />
              </div>

              {/* Right Column - Status & Alerts */}
              <div className="space-y-6">
                <SystemStatusPanel stats={stats} />
                <RecentAlertsPanel alerts={alerts.slice(0, 5)} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-steel-800)] py-4 mt-auto">
        <div className="container flex items-center justify-between text-[var(--color-steel-500)]">
          <span className="font-mono text-xs uppercase tracking-wider">
            SafeOS Guardian v1.0
          </span>
          <span className="font-mono text-xs">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </footer>
    </div>
  );
}

// =============================================================================
// Header Component
// =============================================================================

interface HeaderProps {
  isConnected: boolean;
  systemHealth: 'healthy' | 'degraded' | 'offline';
}

function Header({ isConnected, systemHealth }: HeaderProps) {
  return (
    <header className="border-b border-[var(--color-steel-800)] bg-[var(--color-steel-900)]">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <SafeOSLogo size={40} className="text-[var(--color-accent-500)]" />
            <div>
              <h1 className="font-mono text-sm font-semibold text-[var(--color-steel-100)] uppercase tracking-wider">
                SafeOS Guardian
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-[var(--color-steel-600)]">by</span>
                <SuperCloudLogo size={14} className="text-[#3B82F6]" />
                <span className="font-mono text-[10px] text-[var(--color-steel-500)]">SuperCloud</span>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--color-steel-850)] border border-[var(--color-steel-700)]">
              {isConnected ? (
                <>
                  <IconWifi size={14} className="text-[var(--color-status-online)]" />
                  <span className="font-mono text-xs text-[var(--color-steel-300)]">CONNECTED</span>
                </>
              ) : (
                <>
                  <IconWifiOff size={14} className="text-[var(--color-status-offline)]" />
                  <span className="font-mono text-xs text-[var(--color-steel-500)]">OFFLINE</span>
                </>
              )}
            </div>

            {/* System Health */}
            <div className="flex items-center gap-2">
              <div
                className={`status-dot ${
                  systemHealth === 'healthy'
                    ? 'status-dot--online'
                    : systemHealth === 'degraded'
                    ? 'status-dot--warning'
                    : 'status-dot--offline'
                } ${systemHealth === 'healthy' ? 'status-dot--pulse' : ''}`}
              />
              <span className="font-mono text-xs text-[var(--color-steel-400)] uppercase">
                {systemHealth}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// Stat Card Component
// =============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  status?: 'active' | 'warning' | 'inactive';
}

function StatCard({ label, value, icon, status = 'inactive' }: StatCardProps) {
  const statusColors = {
    active: 'border-[var(--color-accent-600)]',
    warning: 'border-[var(--color-status-warning)]',
    inactive: 'border-[var(--color-steel-700)]',
  };

  return (
    <div className={`card border-l-2 ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-label">{label}</span>
        <span className="text-[var(--color-steel-500)]">{icon}</span>
      </div>
      <div className="font-mono text-2xl font-semibold text-[var(--color-steel-100)]">
        {value}
      </div>
    </div>
  );
}

// =============================================================================
// Quick Actions Panel
// =============================================================================

interface QuickActionsPanelProps {
  isStreaming: boolean;
}

function QuickActionsPanel({ isStreaming }: QuickActionsPanelProps) {
  const actions = [
    {
      id: 'monitor',
      label: isStreaming ? 'View Stream' : 'Start Monitor',
      description: 'Begin surveillance session',
      href: '/monitor',
      icon: <IconPlay size={20} />,
      primary: true,
    },
    {
      id: 'history',
      label: 'Alert History',
      description: 'View past events',
      href: '/history',
      icon: <IconHistory size={20} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Configure system',
      href: '/settings',
      icon: <IconSettings size={20} />,
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="text-heading-sm">Quick Actions</h2>
      </div>
      <div className="panel-body">
        <div className="grid sm:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className={`card flex items-center gap-3 transition-colors hover:border-[var(--color-steel-500)] ${
                action.primary
                  ? 'border-[var(--color-accent-700)] bg-[var(--color-accent-900)]/30'
                  : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded flex items-center justify-center ${
                  action.primary
                    ? 'bg-[var(--color-accent-600)] text-white'
                    : 'bg-[var(--color-steel-800)] text-[var(--color-steel-400)]'
                }`}
              >
                {action.icon}
              </div>
              <div>
                <div className="font-mono text-sm font-medium text-[var(--color-steel-100)]">
                  {action.label}
                </div>
                <div className="text-xs text-[var(--color-steel-500)]">
                  {action.description}
                </div>
              </div>
              <IconChevronRight size={16} className="ml-auto text-[var(--color-steel-600)]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Active Streams Panel
// =============================================================================

interface ActiveStreamsPanelProps {
  streamCount: number;
}

function ActiveStreamsPanel({ streamCount }: ActiveStreamsPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="text-heading-sm flex items-center gap-2">
          <IconCamera size={16} className="text-[var(--color-steel-500)]" />
          Active Streams
        </h2>
        <Link
          href="/monitor"
          className="font-mono text-xs text-[var(--color-accent-500)] hover:text-[var(--color-accent-400)]"
        >
          + NEW
        </Link>
      </div>
      <div className="panel-body">
        {streamCount === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-[var(--color-steel-850)] border border-[var(--color-steel-700)] flex items-center justify-center">
              <IconCamera size={32} className="text-[var(--color-steel-600)]" />
            </div>
            <p className="font-mono text-sm text-[var(--color-steel-500)] mb-4">
              No active monitoring sessions
            </p>
            <Link href="/monitor" className="btn btn-primary">
              Start Monitoring
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Placeholder for stream cards */}
            <div className="text-sm text-[var(--color-steel-400)]">
              {streamCount} stream(s) active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// System Status Panel
// =============================================================================

interface SystemStatusPanelProps {
  stats: SystemStats;
}

function SystemStatusPanel({ stats }: SystemStatusPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="text-heading-sm flex items-center gap-2">
          <IconServer size={16} className="text-[var(--color-steel-500)]" />
          System Status
        </h2>
      </div>
      <div className="panel-body space-y-4">
        {/* Ollama Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCpu size={16} className="text-[var(--color-steel-500)]" />
            <span className="text-sm text-[var(--color-steel-300)]">Local AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`status-dot ${
                stats.ollamaStatus === 'online' ? 'status-dot--online' : 'status-dot--offline'
              }`}
            />
            <span className="font-mono text-xs text-[var(--color-steel-400)] uppercase">
              {stats.ollamaStatus}
            </span>
          </div>
        </div>

        {/* Cloud Fallback */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-steel-300)]">Cloud Fallback</span>
          <span className="font-mono text-sm text-[var(--color-steel-100)]">
            {stats.cloudFallbackRate.toFixed(1)}%
          </span>
        </div>

        {/* Progress bar for cloud usage */}
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{
              width: `${100 - stats.cloudFallbackRate}%`,
              backgroundColor:
                stats.cloudFallbackRate > 50
                  ? 'var(--color-status-warning)'
                  : 'var(--color-accent-500)',
            }}
          />
        </div>

        {/* Frames Analyzed */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-steel-800)]">
          <span className="text-sm text-[var(--color-steel-300)]">Frames Analyzed</span>
          <span className="font-mono text-sm text-[var(--color-steel-100)]">
            {stats.framesAnalyzedToday.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Recent Alerts Panel
// =============================================================================

interface Alert {
  id: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  createdAt?: string;
  timestamp?: string;
}

interface RecentAlertsPanelProps {
  alerts: Alert[];
}

function RecentAlertsPanel({ alerts }: RecentAlertsPanelProps) {
  const severityColors = {
    critical: 'text-[var(--color-alert-critical)]',
    high: 'text-[var(--color-alert-high)]',
    medium: 'text-[var(--color-alert-medium)]',
    low: 'text-[var(--color-alert-low)]',
    info: 'text-[var(--color-steel-500)]',
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="text-heading-sm flex items-center gap-2">
          <IconAlertTriangle size={16} className="text-[var(--color-steel-500)]" />
          Recent Alerts
        </h2>
        <Link
          href="/history"
          className="font-mono text-xs text-[var(--color-accent-500)] hover:text-[var(--color-accent-400)]"
        >
          VIEW ALL
        </Link>
      </div>
      <div className="panel-body">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-steel-500)]">
            <IconBell size={24} className="mx-auto mb-2 opacity-50" />
            <p className="font-mono text-xs">No recent alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-2 rounded bg-[var(--color-steel-850)] border border-[var(--color-steel-800)]"
              >
                <IconAlertTriangle
                  size={16}
                  className={`mt-0.5 flex-shrink-0 ${severityColors[alert.severity]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-steel-200)] truncate">
                    {alert.message}
                  </p>
                  <p className="font-mono text-xs text-[var(--color-steel-500)]">
                    {new Date(alert.createdAt || alert.timestamp || new Date()).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Loading State
// =============================================================================

function LoadingState() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton h-4 w-20 mb-3" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="panel">
            <div className="panel-body">
              <div className="skeleton h-32 w-full" />
            </div>
          </div>
        </div>
        <div>
          <div className="panel">
            <div className="panel-body">
              <div className="skeleton h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
