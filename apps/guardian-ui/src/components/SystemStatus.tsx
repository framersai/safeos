/**
 * System Status Component
 *
 * Displays system health and status information.
 *
 * @module components/SystemStatus
 */

'use client';

import { useState, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

interface SystemStats {
  activeStreams: number;
  totalAlerts: number;
  pendingAlerts: number;
  systemHealth: 'healthy' | 'degraded' | 'offline';
  ollamaStatus: 'online' | 'offline';
  analysisQueueSize: number;
  cloudFallbackRate: number;
}

interface OllamaModel {
  name: string;
  size: string;
  loaded: boolean;
}

interface SystemStatusProps {
  stats: SystemStats;
}

// =============================================================================
// SystemStatus Component
// =============================================================================

export function SystemStatus({ stats }: SystemStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Fetch Ollama models when expanded
  useEffect(() => {
    if (expanded && stats.ollamaStatus === 'online') {
      setLoadingModels(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/ollama/models`)
        .then((res) => res.json())
        .then((data) => setModels(data.models || []))
        .catch(() => setModels([]))
        .finally(() => setLoadingModels(false));
    }
  }, [expanded, stats.ollamaStatus]);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span>⚙️</span>
            System Status
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Status Items */}
      <div className="p-4 space-y-3">
        {/* Overall Health */}
        <StatusItem
          label="System Health"
          status={stats.systemHealth}
          statusColors={{
            healthy: 'bg-emerald-500',
            degraded: 'bg-yellow-500',
            offline: 'bg-red-500',
          }}
        />

        {/* Ollama */}
        <StatusItem
          label="Local AI (Ollama)"
          status={stats.ollamaStatus}
          statusColors={{
            online: 'bg-emerald-500',
            offline: 'bg-red-500',
          }}
        />

        {/* Analysis Queue */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Analysis Queue</span>
          <span
            className={`text-sm font-medium ${
              stats.analysisQueueSize > 10
                ? 'text-yellow-400'
                : stats.analysisQueueSize > 0
                  ? 'text-blue-400'
                  : 'text-slate-300'
            }`}
          >
            {stats.analysisQueueSize} pending
          </span>
        </div>

        {/* Cloud Fallback Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Cloud Fallback</span>
          <span
            className={`text-sm font-medium ${
              stats.cloudFallbackRate > 50
                ? 'text-orange-400'
                : stats.cloudFallbackRate > 20
                  ? 'text-yellow-400'
                  : 'text-emerald-400'
            }`}
          >
            {stats.cloudFallbackRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-4">
          {/* Ollama Models */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              AI Models
            </h4>
            {loadingModels ? (
              <div className="text-sm text-slate-500">Loading models...</div>
            ) : models.length > 0 ? (
              <div className="space-y-2">
                {models.map((model) => (
                  <div
                    key={model.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-300">{model.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{model.size}</span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          model.loaded ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                {stats.ollamaStatus === 'online'
                  ? 'No models loaded'
                  : 'Ollama is offline'}
              </div>
            )}
          </div>

          {/* Resource Usage */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Resource Usage
            </h4>
            <ResourceBar label="Memory" value={65} max={100} unit="%" />
            <ResourceBar label="GPU" value={45} max={100} unit="%" />
            <ResourceBar label="Storage" value={2.3} max={16} unit="GB" />
          </div>

          {/* Analysis Stats */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Today's Stats
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-lg font-bold text-white">0</div>
                <div className="text-xs text-slate-400">Frames Analyzed</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-lg font-bold text-white">0</div>
                <div className="text-xs text-slate-400">Alerts Generated</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-lg font-bold text-white">0ms</div>
                <div className="text-xs text-slate-400">Avg Response</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-lg font-bold text-white">100%</div>
                <div className="text-xs text-slate-400">Local Processing</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StatusItemProps {
  label: string;
  status: string;
  statusColors: Record<string, string>;
}

function StatusItem({ label, status, statusColors }: StatusItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColors[status] || 'bg-slate-600'}`} />
        <span className="text-sm text-slate-300 capitalize">{status}</span>
      </div>
    </div>
  );
}

interface ResourceBarProps {
  label: string;
  value: number;
  max: number;
  unit: string;
}

function ResourceBar({ label, value, max, unit }: ResourceBarProps) {
  const percentage = (value / max) * 100;
  const color =
    percentage > 80
      ? 'bg-red-500'
      : percentage > 60
        ? 'bg-yellow-500'
        : 'bg-emerald-500';

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default SystemStatus;








