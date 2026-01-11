/**
 * Analytics Dashboard Page
 *
 * Comprehensive analytics with real-time charts and metrics.
 *
 * @module app/analytics/page
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { useRouter } from 'next/navigation';
import { AreaChart, BarChart, PieChart, LineChart } from '../../components/charts';
import { showToast } from '../../components/Toast';

// =============================================================================
// Types
// =============================================================================

interface AnalyticsData {
  overview: {
    totalAlerts: number;
    totalStreams: number;
    totalHours: number;
    localAiUsage: number;
    cloudFallbackRate: number;
    avgResponseTime: number;
  };
  alertsOverTime: {
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  }[];
  alertsBySeverity: {
    name: string;
    value: number;
    color: string;
  }[];
  alertsByScenario: {
    scenario: string;
    count: number;
  }[];
  hourlyActivity: {
    hour: string;
    motion: number;
    audio: number;
    alerts: number;
  }[];
  streamDuration: {
    date: string;
    minutes: number;
  }[];
  aiPerformance: {
    date: string;
    localMs: number;
    cloudMs: number;
    accuracy: number;
  }[];
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

// =============================================================================
// Empty State Helper (no mock data - real data only)
// =============================================================================

// No mock data generator - we only show real data from the API

// =============================================================================
// Component
// =============================================================================

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [noDataAvailable, setNoDataAvailable] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoDataAvailable(false);
    try {
      const response = await fetch(`${API_URL}/api/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        // Check if there's actually data
        if (data.overview?.totalAlerts === 0 && data.overview?.totalStreams === 0) {
          setNoDataAvailable(true);
          setAnalyticsData(null);
        } else {
          setAnalyticsData(data);
        }
      } else {
        // API returned error - show placeholder instead of mock data
        setNoDataAvailable(true);
        setAnalyticsData(null);
      }
    } catch {
      // API unavailable - show placeholder instead of mock data
      setNoDataAvailable(true);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL, timeRange]);

  useEffect(() => {
    if (!isLoading && isInitialized && !isAuthenticated) {
      router.push('/');
    } else if (isAuthenticated) {
      fetchAnalyticsData();
    }
  }, [isAuthenticated, isLoading, isInitialized, router, fetchAnalyticsData]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Error</h1>
        <p className="text-lg text-red-400">Failed to load analytics: {error}</p>
        <button
          onClick={fetchAnalyticsData}
          className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-1">Insights and trends from your monitoring sessions</p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : analyticsData ? (
        <div className="space-y-8">
          {/* Overview Stats */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                label="Total Alerts"
                value={analyticsData.overview.totalAlerts}
                icon="🚨"
              />
              <StatCard
                label="Active Streams"
                value={analyticsData.overview.totalStreams}
                icon="📹"
              />
              <StatCard
                label="Hours Monitored"
                value={`${analyticsData.overview.totalHours}h`}
                icon="⏱️"
              />
              <StatCard
                label="Local AI Usage"
                value={`${analyticsData.overview.localAiUsage.toFixed(1)}%`}
                icon="🤖"
                highlight={analyticsData.overview.localAiUsage > 80}
              />
              <StatCard
                label="Cloud Fallback"
                value={`${analyticsData.overview.cloudFallbackRate.toFixed(1)}%`}
                icon="☁️"
                highlight={analyticsData.overview.cloudFallbackRate < 10}
              />
              <StatCard
                label="Avg Response"
                value={`${analyticsData.overview.avgResponseTime.toFixed(0)}ms`}
                icon="⚡"
              />
            </div>
          </section>

          {/* Alerts Over Time */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Alerts Over Time</h3>
              <AreaChart
                data={analyticsData.alertsOverTime}
                dataKeys={[
                  { key: 'critical', name: 'Critical', color: '#ef4444' },
                  { key: 'high', name: 'High', color: '#f97316' },
                  { key: 'medium', name: 'Medium', color: '#eab308' },
                  { key: 'low', name: 'Low', color: '#3b82f6' },
                ]}
                xAxisKey="date"
                height={300}
              />
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Alerts by Severity</h3>
              <PieChart
                data={analyticsData.alertsBySeverity}
                height={300}
                donut
              />
            </div>
          </section>

          {/* Hourly Activity */}
          <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold mb-4">Hourly Activity Pattern</h3>
            <LineChart
              data={analyticsData.hourlyActivity}
              lines={[
                { key: 'motion', name: 'Motion Events', color: '#10b981' },
                { key: 'audio', name: 'Audio Events', color: '#06b6d4' },
                { key: 'alerts', name: 'Alerts', color: '#ef4444', dashed: true },
              ]}
              xAxisKey="hour"
              height={250}
            />
          </section>

          {/* Alerts by Scenario & Stream Duration */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Alerts by Scenario</h3>
              <BarChart
                data={analyticsData.alertsByScenario}
                dataKey="count"
                nameKey="scenario"
                height={250}
                colors={['#f59e0b', '#ec4899', '#8b5cf6']}
              />
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Stream Duration (minutes)</h3>
              <BarChart
                data={analyticsData.streamDuration}
                dataKey="minutes"
                nameKey="date"
                height={250}
                defaultColor="#10b981"
              />
            </div>
          </section>

          {/* AI Performance */}
          <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold mb-4">AI Performance</h3>
            <LineChart
              data={analyticsData.aiPerformance}
              lines={[
                { key: 'localMs', name: 'Local AI (ms)', color: '#10b981' },
                { key: 'cloudMs', name: 'Cloud AI (ms)', color: '#f97316' },
              ]}
              xAxisKey="date"
              height={250}
            />
            <p className="text-xs text-slate-500 mt-2">
              Lower response times indicate better performance. Local AI is typically 2-3x faster than cloud.
            </p>
          </section>

          {/* Export Options */}
          <section className="flex justify-end gap-4">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(analyticsData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `safeos-analytics-${timeRange}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast({ title: 'Export Complete', message: 'Analytics exported!', type: 'success' });
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📥</span>
              Export JSON
            </button>
          </section>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data Yet</h3>
          <p className="text-slate-400 max-w-md mb-6">
            {noDataAvailable
              ? 'Start monitoring your pet, baby, or elderly loved one to see analytics here. Your monitoring sessions will generate data that appears in these charts.'
              : 'Unable to load analytics data. Please try again later.'}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/monitor')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors font-medium"
            >
              Start Monitoring
            </button>
            <button
              onClick={fetchAnalyticsData}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}

function StatCard({ label, value, icon, highlight = false }: StatCardProps) {
  return (
    <div
      className={`bg-slate-800/50 rounded-xl border p-4 ${highlight ? 'border-emerald-500/50' : 'border-slate-700/50'
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {highlight && <span className="text-emerald-400 text-xs">✓ Good</span>}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
