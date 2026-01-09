/**
 * Data Export Page
 *
 * Export alerts, analysis, and user data.
 *
 * @module app/export/page
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../stores/auth-store';

// =============================================================================
// Types
// =============================================================================

type ExportType = 'alerts' | 'analysis' | 'streams' | 'profile' | 'all';
type ExportFormat = 'json' | 'csv';

interface ExportOption {
  id: ExportType;
  label: string;
  description: string;
  icon: string;
  formats: ExportFormat[];
}

// =============================================================================
// Data
// =============================================================================

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'alerts',
    label: 'Alerts',
    description: 'All alerts with timestamps, severity, and messages',
    icon: '🔔',
    formats: ['json', 'csv'],
  },
  {
    id: 'analysis',
    label: 'AI Analysis Results',
    description: 'Analysis results, concern levels, and processing times',
    icon: '🔍',
    formats: ['json', 'csv'],
  },
  {
    id: 'streams',
    label: 'Stream History',
    description: 'All monitoring sessions with stats',
    icon: '📹',
    formats: ['json', 'csv'],
  },
  {
    id: 'profile',
    label: 'Profile & Settings',
    description: 'Your profile, preferences, and notification settings',
    icon: '👤',
    formats: ['json'],
  },
  {
    id: 'all',
    label: 'Full Data Export',
    description: 'Complete data export (GDPR compliant)',
    icon: '📦',
    formats: ['json'],
  },
];

// =============================================================================
// Component
// =============================================================================

export default function ExportPage() {
  const { sessionToken, isAuthenticated, isInitialized } = useAuthStore();

  const [selectedType, setSelectedType] = useState<ExportType>('alerts');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage({ type: 'info', text: 'Preparing export...' });

    try {
      const params = new URLSearchParams();
      params.append('format', selectedFormat);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const res = await fetch(`${API_URL}/api/export/${selectedType}?${params.toString()}`, {
        headers: { 'X-Session-Token': sessionToken || '' },
      });

      if (!res.ok) {
        throw new Error('Export failed');
      }

      // Get filename from header or generate one
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `safeos-${selectedType}-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({ type: 'success', text: `Downloaded ${filename}` });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Export failed. Please try again later.' });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedOption = EXPORT_OPTIONS.find((o) => o.id === selectedType);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Link href="/" className="text-emerald-400 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-700/50">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/settings" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Export Data</h1>
            <p className="text-xs text-slate-400">Download your monitoring data</p>
          </div>
        </div>
      </header>

      {/* Status Message */}
      {statusMessage && (
        <div className={`max-w-3xl mx-auto mt-4 mx-4 sm:mx-auto p-4 rounded-xl border ${statusMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
            statusMessage.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
              'bg-blue-500/20 border-blue-500/50 text-blue-300'
          }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Export Type Selection */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">What to Export</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {EXPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setSelectedType(option.id);
                  if (!option.formats.includes(selectedFormat)) {
                    setSelectedFormat(option.formats[0]);
                  }
                }}
                className={`p-4 rounded-lg border text-left transition-colors ${selectedType === option.id
                  ? 'bg-emerald-500/20 border-emerald-500/50'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                  }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium text-white">{option.label}</span>
                </div>
                <p className="text-sm text-slate-400">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Format & Options */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Export Options</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
              <div className="flex gap-2">
                {selectedOption?.formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFormat === format
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range (for applicable types) */}
            {['alerts', 'analysis'].includes(selectedType) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Export
              </>
            )}
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-400">ℹ️</span>
            <div>
              <h3 className="font-medium text-blue-300 mb-1">Your Data, Your Control</h3>
              <p className="text-sm text-slate-400">
                Exports include all data associated with your account. The "Full Data Export"
                option provides a complete download of all your information as required by
                GDPR and CCPA regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


