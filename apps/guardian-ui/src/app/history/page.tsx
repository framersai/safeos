/**
 * Alert History Page
 *
 * View past alerts and analysis results.
 *
 * @module app/history/page
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isStaticMode } from '@/lib/env';

// =============================================================================
// Types
// =============================================================================

interface Alert {
  id: string;
  stream_id: string;
  alert_type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

interface AnalysisResult {
  id: string;
  stream_id: string;
  concern_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  model_used: string;
  processing_time_ms: number;
  created_at: string;
}

type ViewMode = 'alerts' | 'analysis';
type FilterSeverity = 'all' | 'info' | 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// Helpers
// =============================================================================

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  none: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60 * 1000) return 'Just now';

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / (60 * 1000));
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Otherwise show full date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// Component
// =============================================================================

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('alerts');
  const [filter, setFilter] = useState<FilterSeverity>('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    // Skip API calls in static mode (GitHub Pages deployment)
    if (isStaticMode()) {
      setAlerts([]);
      setAnalysisResults([]);
      setIsLoading(false);
      return;
    }

    try {
      if (viewMode === 'alerts') {
        const response = await fetch('/api/alerts?limit=100');
        const data = await response.json();
        if (data.success) {
          setAlerts(data.data);
        }
      } else {
        const response = await fetch('/api/analysis?limit=100');
        const data = await response.json();
        if (data.success) {
          setAnalysisResults(data.data);
        }
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter((a) => a.severity === filter);

  const filteredAnalysis = filter === 'all'
    ? analysisResults
    : analysisResults.filter((a) => a.concern_level === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors" aria-label="Go back to dashboard">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-white">History</h1>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Tabs & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* View Mode Tabs */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('alerts')}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'alerts'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Alerts
            </button>
            <button
              onClick={() => setViewMode('analysis')}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'analysis'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Analysis Results
            </button>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterSeverity)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : viewMode === 'alerts' ? (
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-slate-400">No alerts yet</p>
                <p className="text-sm text-slate-500 mt-1">Alerts will appear here when detected</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const colors = severityColors[alert.severity];

                const handleAcknowledge = async () => {
                  try {
                    await fetch(`/api/alerts/${alert.id}/acknowledge`, { method: 'POST' });
                    setAlerts(prev => prev.map(a =>
                      a.id === alert.id ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a
                    ));
                  } catch (err) {
                    console.error('Failed to acknowledge:', err);
                  }
                };

                const handleDelete = async () => {
                  try {
                    await fetch(`/api/alerts/${alert.id}`, { method: 'DELETE' });
                    setAlerts(prev => prev.filter(a => a.id !== alert.id));
                  } catch (err) {
                    console.error('Failed to delete:', err);
                  }
                };

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${colors.border} ${colors.bg} group`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.text} ${colors.bg}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">{alert.alert_type}</span>
                        </div>
                        <p className="text-white">{alert.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(alert.created_at)}
                          {alert.acknowledged && (
                            <span className="ml-2 text-emerald-400">
                              ✓ Acknowledged
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!alert.acknowledged && (
                          <button
                            onClick={handleAcknowledge}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={handleDelete}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                          aria-label="Delete alert"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnalysis.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-400">No analysis results yet</p>
                <p className="text-sm text-slate-500 mt-1">Start monitoring to see AI analysis</p>
              </div>
            ) : (
              filteredAnalysis.map((result) => {
                const colors = severityColors[result.concern_level];
                return (
                  <div
                    key={result.id}
                    className="p-4 rounded-xl border border-slate-700 bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.text} ${colors.bg}`}>
                            {result.concern_level.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">
                            {result.model_used} • {result.processing_time_ms}ms
                          </span>
                        </div>
                        <p className="text-white">{result.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(result.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Stats */}
        {!isLoading && !error && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
              <p className="text-2xl font-bold text-white">
                {viewMode === 'alerts' ? alerts.length : analysisResults.length}
              </p>
              <p className="text-sm text-slate-400">Total</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30 text-center">
              <p className="text-2xl font-bold text-red-400">
                {viewMode === 'alerts'
                  ? alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length
                  : analysisResults.filter((a) => a.concern_level === 'critical' || a.concern_level === 'high').length}
              </p>
              <p className="text-sm text-red-400/70">Critical/High</p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {viewMode === 'alerts'
                  ? alerts.filter((a) => a.severity === 'medium').length
                  : analysisResults.filter((a) => a.concern_level === 'medium').length}
              </p>
              <p className="text-sm text-yellow-400/70">Medium</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30 text-center">
              <p className="text-2xl font-bold text-green-400">
                {viewMode === 'alerts'
                  ? alerts.filter((a) => !a.acknowledged).length
                  : analysisResults.filter((a) => a.concern_level === 'none' || a.concern_level === 'low').length}
              </p>
              <p className="text-sm text-green-400/70">
                {viewMode === 'alerts' ? 'Pending' : 'Low/None'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
