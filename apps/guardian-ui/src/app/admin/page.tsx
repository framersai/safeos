/**
 * Admin Dashboard
 *
 * System administration and human review interface.
 *
 * @module app/admin/page
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// =============================================================================
// Types
// =============================================================================

interface SystemMetrics {
  uptime: number;
  totalStreams: number;
  activeStreams: number;
  totalAlerts: number;
  pendingReviews: number;
  analysisToday: number;
  cloudFallbackRate: number;
  avgResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface ContentFlag {
  id: string;
  streamId: string;
  category: string;
  tier: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  createdAt: string;
  thumbnailUrl?: string;
}

interface RecentActivity {
  id: string;
  type: 'alert' | 'review' | 'stream' | 'system';
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error';
}

type AdminTab = 'overview' | 'reviews' | 'streams' | 'users' | 'system' | 'logs';

// =============================================================================
// Component
// =============================================================================

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, flagsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/review/flags?limit=20'),
      ]);

      if (statusRes.ok) {
        const status = await statusRes.json();
        setMetrics({
          uptime: status.uptime || 0,
          totalStreams: status.stats?.totalStreams || 0,
          activeStreams: status.stats?.activeStreams || 0,
          totalAlerts: status.stats?.totalAlerts || 0,
          pendingReviews: status.stats?.pendingReviews || 0,
          analysisToday: status.stats?.analysisToday || 0,
          cloudFallbackRate: status.stats?.cloudFallbackRate || 0,
          avgResponseTime: status.stats?.avgResponseTime || 0,
          memoryUsage: status.stats?.memoryUsage || 0,
          cpuUsage: status.stats?.cpuUsage || 0,
        });
      }

      if (flagsRes.ok) {
        const flagsData = await flagsRes.json();
        setFlags(flagsData.data || []);
      }

      // Mock activities for now
      setActivities([
        { id: '1', type: 'alert', message: 'High concern alert triggered', timestamp: new Date().toISOString(), severity: 'warning' },
        { id: '2', type: 'stream', message: 'New stream started', timestamp: new Date(Date.now() - 60000).toISOString(), severity: 'info' },
        { id: '3', type: 'review', message: 'Content flag approved', timestamp: new Date(Date.now() - 120000).toISOString(), severity: 'info' },
      ]);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlagAction = async (flagId: string, action: 'approve' | 'reject' | 'escalate') => {
    try {
      await fetch(`/api/review/flags/${flagId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to action flag:', error);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'reviews', label: 'Reviews', icon: '👁️' },
    { id: 'streams', label: 'Streams', icon: '📹' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'logs', label: 'Logs', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-slate-400">System management & human review</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Pending Reviews Badge */}
              {metrics && metrics.pendingReviews > 0 && (
                <div className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                  <span className="text-orange-400 text-sm font-medium">
                    {metrics.pendingReviews} pending reviews
                  </span>
                </div>
              )}

              {/* System Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-300">System Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="w-48 flex-shrink-0">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.id === 'reviews' && metrics && metrics.pendingReviews > 0 && (
                      <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {metrics.pendingReviews}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                {activeTab === 'overview' && (
                  <OverviewTab metrics={metrics} activities={activities} />
                )}
                {activeTab === 'reviews' && (
                  <ReviewsTab flags={flags} onAction={handleFlagAction} />
                )}
                {activeTab === 'streams' && <StreamsTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'system' && <SystemTab metrics={metrics} />}
                {activeTab === 'logs' && <LogsTab />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Tab Components
// =============================================================================

function OverviewTab({ metrics, activities }: { metrics: SystemMetrics | null; activities: RecentActivity[] }) {
  if (!metrics) return null;

  const stats = [
    { label: 'Active Streams', value: metrics.activeStreams, icon: '📹', color: 'from-blue-500 to-cyan-500' },
    { label: 'Pending Reviews', value: metrics.pendingReviews, icon: '👁️', color: 'from-orange-500 to-amber-500' },
    { label: 'Analysis Today', value: metrics.analysisToday, icon: '🔍', color: 'from-purple-500 to-pink-500' },
    { label: 'Total Alerts', value: metrics.totalAlerts, icon: '🔔', color: 'from-red-500 to-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-white font-semibold mb-4">System Performance</h3>
          <div className="space-y-4">
            <ProgressBar label="CPU Usage" value={metrics.cpuUsage} max={100} unit="%" />
            <ProgressBar label="Memory" value={metrics.memoryUsage} max={100} unit="%" />
            <ProgressBar label="Cloud Fallback" value={metrics.cloudFallbackRate} max={100} unit="%" warning={metrics.cloudFallbackRate > 20} />
            <ProgressBar label="Avg Response" value={metrics.avgResponseTime} max={5000} unit="ms" />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.severity === 'error' ? 'bg-red-500' :
                  activity.severity === 'warning' ? 'bg-yellow-500' : 'bg-emerald-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{activity.message}</p>
                  <p className="text-xs text-slate-500">{formatTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uptime */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">System Uptime</h3>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{formatUptime(metrics.uptime)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Last restart</p>
            <p className="text-sm text-slate-300">{new Date(Date.now() - metrics.uptime * 1000).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsTab({ flags, onAction }: { flags: ContentFlag[]; onAction: (id: string, action: 'approve' | 'reject' | 'escalate') => void }) {
  const pendingFlags = flags.filter((f) => f.status === 'pending');
  const resolvedFlags = flags.filter((f) => f.status !== 'pending');

  const tierLabels: Record<number, { label: string; color: string }> = {
    1: { label: 'Low', color: 'bg-green-500/20 text-green-400' },
    2: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
    3: { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
    4: { label: 'Critical', color: 'bg-red-500/20 text-red-400' },
  };

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-white font-semibold">Pending Reviews ({pendingFlags.length})</h3>
          <span className="text-xs text-slate-500">Content is anonymized for reviewer privacy</span>
        </div>

        {pendingFlags.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-slate-400">All caught up! No pending reviews.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {pendingFlags.map((flag) => {
              const tier = tierLabels[flag.tier] || tierLabels[1];
              return (
                <div key={flag.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail placeholder */}
                    <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl opacity-50">🔒</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${tier.color}`}>
                          Tier {flag.tier}: {tier.label}
                        </span>
                        <span className="text-xs text-slate-500">{flag.category}</span>
                      </div>
                      <p className="text-white mb-1">{flag.reason}</p>
                      <p className="text-xs text-slate-500">
                        Stream: {flag.streamId.slice(0, 8)}... • {formatTime(flag.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onAction(flag.id, 'approve')}
                        className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onAction(flag.id, 'reject')}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onAction(flag.id, 'escalate')}
                        className="px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Resolved */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Recently Resolved</h3>
        </div>
        <div className="p-4">
          {resolvedFlags.length === 0 ? (
            <p className="text-slate-500 text-sm">No resolved reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {resolvedFlags.slice(0, 5).map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <span className="text-sm text-white">{flag.category}</span>
                    <span className="text-xs text-slate-500 ml-2">{formatTime(flag.createdAt)}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    flag.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    flag.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {flag.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamsTab() {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-white font-semibold mb-4">Stream Management</h3>
      <p className="text-slate-400">View and manage all active and historical streams.</p>
      {/* TODO: Implement stream management table */}
      <div className="mt-4 p-8 bg-slate-700/30 rounded-lg text-center">
        <span className="text-4xl opacity-50">📹</span>
        <p className="text-slate-500 mt-2">Stream management coming soon</p>
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-white font-semibold mb-4">User Management</h3>
      <p className="text-slate-400">Manage user accounts, sessions, and permissions.</p>
      {/* TODO: Implement user management */}
      <div className="mt-4 p-8 bg-slate-700/30 rounded-lg text-center">
        <span className="text-4xl opacity-50">👥</span>
        <p className="text-slate-500 mt-2">User management coming soon</p>
      </div>
    </div>
  );
}

function SystemTab({ metrics }: { metrics: SystemMetrics | null }) {
  return (
    <div className="space-y-6">
      {/* Ollama Status */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-white font-semibold mb-4">🤖 Local AI (Ollama)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-400 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white font-medium">Online</span>
            </div>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <p className="text-sm text-slate-400 mb-1">Models Loaded</p>
            <p className="text-white font-medium">moondream, llava:7b</p>
          </div>
        </div>
      </div>

      {/* Queue Status */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-white font-semibold mb-4">📊 Queue Status</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-400">0</p>
            <p className="text-sm text-slate-400">Analysis Queue</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-purple-400">0</p>
            <p className="text-sm text-slate-400">Alert Queue</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-orange-400">{metrics?.pendingReviews || 0}</p>
            <p className="text-sm text-slate-400">Review Queue</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-white font-semibold mb-4">⚡ Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
            Clear Analysis Queue
          </button>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
            Restart Ollama
          </button>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
            Run Cleanup
          </button>
          <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm">
            Emergency Stop All
          </button>
        </div>
      </div>
    </div>
  );
}

function LogsTab() {
  const [logs] = useState([
    { timestamp: new Date().toISOString(), level: 'info', message: 'System started successfully' },
    { timestamp: new Date(Date.now() - 5000).toISOString(), level: 'info', message: 'Ollama connection established' },
    { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'warning', message: 'High memory usage detected' },
    { timestamp: new Date(Date.now() - 15000).toISOString(), level: 'info', message: 'Frame analysis completed' },
    { timestamp: new Date(Date.now() - 20000).toISOString(), level: 'error', message: 'Cloud fallback triggered' },
  ]);

  const levelColors: Record<string, string> = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-white font-semibold">System Logs</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white">
            <option>All Levels</option>
            <option>Info</option>
            <option>Warning</option>
            <option>Error</option>
          </select>
          <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
            Export
          </button>
        </div>
      </div>

      <div className="font-mono text-sm divide-y divide-slate-700/30">
        {logs.map((log, i) => (
          <div key={i} className="px-4 py-3 hover:bg-slate-700/30 transition-colors">
            <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`ml-4 ${levelColors[log.level]}`}>[{log.level.toUpperCase()}]</span>
            <span className="ml-4 text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

function ProgressBar({ label, value, max, unit, warning = false }: { label: string; value: number; max: number; unit: string; warning?: boolean }) {
  const percentage = Math.min((value / max) * 100, 100);
  const color = warning || percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{typeof value === 'number' ? value.toFixed(1) : value}{unit}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}







