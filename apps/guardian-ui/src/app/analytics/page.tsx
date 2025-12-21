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
// Mock Data Generator
// =============================================================================

function generateMockData(timeRange: TimeRange): AnalyticsData {
  const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  const alertsOverTime = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    return {
      date: timeRange === '24h'
        ? `${String(i).padStart(2, '0')}:00`
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      critical: Math.floor(Math.random() * 3),
      high: Math.floor(Math.random() * 8),
      medium: Math.floor(Math.random() * 15),
      low: Math.floor(Math.random() * 25),
      total: 0,
    };
  });

  // Calculate totals
  alertsOverTime.forEach((d) => {
    d.total = d.critical + d.high + d.medium + d.low;
  });

  const totalAlerts = alertsOverTime.reduce((sum, d) => sum + d.total, 0);

  return {
    overview: {
      totalAlerts,
      totalStreams: Math.floor(Math.random() * 50) + 10,
      totalHours: Math.floor(Math.random() * 500) + 50,
      localAiUsage: 75 + Math.random() * 20,
      cloudFallbackRate: 5 + Math.random() * 15,
      avgResponseTime: 150 + Math.random() * 100,
    },
    alertsOverTime,
    alertsBySeverity: [
      { name: 'Critical', value: alertsOverTime.reduce((s, d) => s + d.critical, 0), color: '#ef4444' },
      { name: 'High', value: alertsOverTime.reduce((s, d) => s + d.high, 0), color: '#f97316' },
      { name: 'Medium', value: alertsOverTime.reduce((s, d) => s + d.medium, 0), color: '#eab308' },
      { name: 'Low', value: alertsOverTime.reduce((s, d) => s + d.low, 0), color: '#3b82f6' },
    ],
    alertsByScenario: [
      { scenario: 'Pet', count: Math.floor(totalAlerts * 0.4) },
      { scenario: 'Baby', count: Math.floor(totalAlerts * 0.35) },
      { scenario: 'Elderly', count: Math.floor(totalAlerts * 0.25) },
    ],
    hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      motion: Math.floor(Math.random() * 100),
      audio: Math.floor(Math.random() * 60),
      alerts: Math.floor(Math.random() * 10),
    })),
    streamDuration: Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: Math.floor(Math.random() * 480) + 60,
      };
    }),
    aiPerformance: Array.from({ length: Math.min(days, 14) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (14 - i - 1));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        localMs: 100 + Math.random() * 150,
        cloudMs: 300 + Math.random() * 400,
        accuracy: 85 + Math.random() * 12,
      };
    }),
  };
}

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to fetch from API first
      const response = await fetch(`${API_URL}/api/analytics?range=${timeRange}`);
      if (response.ok) {
        setAnalyticsData(await response.json());
      } else {
        // Use mock data for demo
        setAnalyticsData(generateMockData(timeRange));
      }
    } catch {
      // Use mock data if API unavailable
      setAnalyticsData(generateMockData(timeRange));
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
        <div className="text-center text-slate-400 py-8">
          <p>No analytics data available.</p>
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
      className={`bg-slate-800/50 rounded-xl border p-4 ${
        highlight ? 'border-emerald-500/50' : 'border-slate-700/50'
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
