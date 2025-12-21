'use client';

/**
 * History Page
 *
 * Alert history and past events.
 *
 * @module app/history/page
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useMonitoringStore, type Alert } from '../../stores/monitoring-store';

// =============================================================================
// Component
// =============================================================================

export default function HistoryPage() {
  const { alerts, clearAlerts } = useMonitoringStore();
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical'>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unacknowledged') return !alert.acknowledged;
    if (filter === 'critical') return alert.severity === 'critical';
    return true;
  });

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all alert history?')) {
      clearAlerts();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl hover:scale-110 transition-transform">
                🛡️
              </Link>
              <h1 className="text-xl font-bold text-white">Alert History</h1>
            </div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All ({alerts.length})
            </FilterButton>
            <FilterButton
              active={filter === 'unacknowledged'}
              onClick={() => setFilter('unacknowledged')}
            >
              Unacknowledged ({alerts.filter((a) => !a.acknowledged).length})
            </FilterButton>
            <FilterButton
              active={filter === 'critical'}
              onClick={() => setFilter('critical')}
            >
              Critical ({alerts.filter((a) => a.severity === 'critical').length})
            </FilterButton>
          </div>

          {alerts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Alert List */}
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-white mb-2">No Alerts</h2>
            <p className="text-gray-400">
              {filter === 'all'
                ? "You don't have any alerts yet"
                : 'No alerts match this filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const severityColors = {
    info: 'border-blue-500 bg-blue-500/10',
    low: 'border-green-500 bg-green-500/10',
    medium: 'border-yellow-500 bg-yellow-500/10',
    high: 'border-orange-500 bg-orange-500/10',
    critical: 'border-red-500 bg-red-500/10',
  };

  const severityIcons = {
    info: 'ℹ️',
    low: '📢',
    medium: '⚠️',
    high: '🔔',
    critical: '🚨',
  };

  const timestamp = new Date(alert.timestamp);
  const dateStr = timestamp.toLocaleDateString();
  const timeStr = timestamp.toLocaleTimeString();

  return (
    <div
      className={`p-4 rounded-xl border ${severityColors[alert.severity]} ${
        alert.acknowledged ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl">{severityIcons[alert.severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-white capitalize">
              {alert.severity} Alert
            </span>
            <span className="text-sm text-gray-400">
              {dateStr} {timeStr}
            </span>
          </div>
          <p className="text-gray-300">{alert.message}</p>
          {alert.acknowledged && (
            <span className="inline-block mt-2 text-xs text-gray-500">
              ✓ Acknowledged
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
