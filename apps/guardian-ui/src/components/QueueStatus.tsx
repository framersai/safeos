/**
 * Queue Status Component
 * 
 * Displays the current API queue status with:
 * - Queue position and estimated wait time
 * - Resource commitment promises
 * - Server load indicators
 * - Real-time updates
 * 
 * @module components/QueueStatus
 */

'use client';

import React from 'react';
import {
  useQueueStore,
  useQueueStats,
  useActiveRequestCount,
  formatEstimatedTime,
  getLoadDescription,
  getResourceCommitment,
  getTypeDescription,
  type QueuedRequest,
} from '../lib/processing-queue';
import {
  IconClock,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconRefresh,
} from './icons';

// =============================================================================
// Processing Badge Component
// =============================================================================

interface ProcessingBadgeProps {
  mode: 'local' | 'ai_enhanced' | 'hybrid';
  size?: 'sm' | 'md';
  showDescription?: boolean;
}

export function ProcessingBadge({ mode, size = 'md', showDescription = false }: ProcessingBadgeProps) {
  const config = {
    local: {
      label: 'LOCAL INSTANT',
      description: '100% on-device. No internet required. Zero latency.',
      bgClass: 'bg-emerald-500/20',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30',
      dotClass: 'bg-emerald-400',
    },
    ai_enhanced: {
      label: 'AI QUEUE',
      description: 'Advanced AI analysis. May be queued based on server load.',
      bgClass: 'bg-amber-500/20',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30',
      dotClass: 'bg-amber-400',
    },
    hybrid: {
      label: 'HYBRID',
      description: 'Instant local detection + AI enhancement in background.',
      bgClass: 'bg-blue-500/20',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/30',
      dotClass: 'bg-blue-400',
    },
  }[mode];
  
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2 py-1';
  
  return (
    <div className="inline-flex flex-col gap-1">
      <span 
        className={`inline-flex items-center gap-1.5 ${sizeClasses} ${config.bgClass} ${config.textClass} border ${config.borderClass} rounded font-mono font-medium uppercase tracking-wider`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} animate-pulse`} />
        {config.label}
      </span>
      {showDescription && (
        <span className="text-xs text-slate-500">{config.description}</span>
      )}
    </div>
  );
}

// =============================================================================
// Queue Status Indicator
// =============================================================================

interface QueueStatusIndicatorProps {
  compact?: boolean;
}

export function QueueStatusIndicator({ compact = false }: QueueStatusIndicatorProps) {
  const stats = useQueueStats();
  const activeCount = useActiveRequestCount();
  const loadInfo = getLoadDescription(stats.currentLoad);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {activeCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <IconClock size={12} />
            {activeCount} queued
          </span>
        )}
        <span className={`w-2 h-2 rounded-full ${getLoadDotColor(stats.currentLoad)}`} />
      </div>
    );
  }
  
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">API Queue Status</span>
        <span className={`text-xs px-2 py-0.5 rounded ${getLoadBadgeClasses(stats.currentLoad)}`}>
          {loadInfo.label}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-500">Queued</span>
          <p className="text-white font-medium">{stats.totalQueued}</p>
        </div>
        <div>
          <span className="text-slate-500">Avg Wait</span>
          <p className="text-white font-medium">{formatEstimatedTime(stats.averageWaitSeconds)}</p>
        </div>
      </div>
      
      <p className="mt-2 text-xs text-slate-400">{loadInfo.description}</p>
    </div>
  );
}

// =============================================================================
// Active Requests Panel
// =============================================================================

export function ActiveRequestsPanel() {
  const requests = useQueueStore(state => state.requests);
  const activeRequests = requests.filter(r => 
    r.status === 'queued' || r.status === 'processing'
  );
  const cancelRequest = useQueueStore(state => state.cancelRequest);
  const clearCompleted = useQueueStore(state => state.clearCompleted);
  
  if (requests.length === 0) {
    return (
      <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30 text-center">
        <IconCheck size={24} className="mx-auto text-slate-500 mb-2" />
        <p className="text-sm text-slate-400">No pending requests</p>
        <p className="text-xs text-slate-500 mt-1">All processing is local and instant</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Active Requests */}
      {activeRequests.map(request => (
        <RequestCard 
          key={request.id} 
          request={request}
          onCancel={() => cancelRequest(request.id)}
        />
      ))}
      
      {/* Clear completed */}
      {requests.some(r => r.status === 'completed' || r.status === 'cancelled') && (
        <button
          onClick={clearCompleted}
          className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Clear completed
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Request Card
// =============================================================================

interface RequestCardProps {
  request: QueuedRequest;
  onCancel: () => void;
}

function RequestCard({ request, onCancel }: RequestCardProps) {
  const typeInfo = getTypeDescription(request.type);
  const commitment = getResourceCommitment(request);
  
  return (
    <div className={`p-3 rounded-lg border ${getStatusBorderClass(request.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(request.status)}
          <span className="text-sm font-medium text-white">{typeInfo.label}</span>
        </div>
        
        {request.status === 'queued' && (
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Cancel request"
          >
            <IconX size={14} />
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        <span className="text-slate-400">
          Position: <span className="text-white">{request.position}</span>
        </span>
        <span className="text-slate-400">
          ETA: <span className="text-white">{formatEstimatedTime(request.estimatedTimeSeconds)}</span>
        </span>
      </div>
      
      {/* Resource Commitment */}
      {commitment.isCommitted && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <IconCheck size={12} />
          <span>{commitment.message}</span>
        </div>
      )}
      
      {/* Progress bar for processing */}
      {request.status === 'processing' && (
        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Processing Mode Explainer
// =============================================================================

export function ProcessingModeExplainer() {
  return (
    <div className="space-y-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
      <h3 className="text-sm font-semibold text-white">Processing Modes</h3>
      
      <div className="space-y-3">
        {/* Local */}
        <div className="flex items-start gap-3">
          <ProcessingBadge mode="local" size="sm" />
          <div className="flex-1">
            <p className="text-xs text-slate-300">100% on-device processing</p>
            <p className="text-xs text-slate-500">No internet required. Zero latency. Pixel detection, motion, basic audio.</p>
          </div>
        </div>
        
        {/* AI Queue */}
        <div className="flex items-start gap-3">
          <ProcessingBadge mode="ai_enhanced" size="sm" />
          <div className="flex-1">
            <p className="text-xs text-slate-300">Cloud AI analysis</p>
            <p className="text-xs text-slate-500">Advanced pattern recognition, behavior prediction. May be queued.</p>
          </div>
        </div>
        
        {/* Hybrid */}
        <div className="flex items-start gap-3">
          <ProcessingBadge mode="hybrid" size="sm" />
          <div className="flex-1">
            <p className="text-xs text-slate-300">Best of both</p>
            <p className="text-xs text-slate-500">Instant local alerts + AI enhancement in background.</p>
          </div>
        </div>
      </div>
      
      {/* Coming Soon Notice */}
      <div className="mt-4 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <div className="flex items-center gap-2 text-amber-400">
          <IconAlertTriangle size={14} />
          <span className="text-xs font-medium">AI Features Coming Soon</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          AI-enhanced processing is in development. All current features use instant local processing.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Resource Commitment Banner
// =============================================================================

interface ResourceCommitmentBannerProps {
  show: boolean;
}

export function ResourceCommitmentBanner({ show }: ResourceCommitmentBannerProps) {
  if (!show) return null;
  
  return (
    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
      <div className="flex items-center gap-2">
        <IconCheck size={16} className="text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-emerald-400">Dedicated Resources Allocated</p>
          <p className="text-xs text-slate-400">
            Your request is being prioritized. We&apos;ve committed dedicated server resources to reduce your wait time.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getLoadDotColor(load: string): string {
  switch (load) {
    case 'low': return 'bg-emerald-400';
    case 'medium': return 'bg-yellow-400';
    case 'high': return 'bg-orange-400';
    case 'critical': return 'bg-red-400';
    default: return 'bg-slate-400';
  }
}

function getLoadBadgeClasses(load: string): string {
  switch (load) {
    case 'low': return 'bg-emerald-500/20 text-emerald-400';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400';
    case 'high': return 'bg-orange-500/20 text-orange-400';
    case 'critical': return 'bg-red-500/20 text-red-400';
    default: return 'bg-slate-500/20 text-slate-400';
  }
}

function getStatusBorderClass(status: string): string {
  switch (status) {
    case 'queued': return 'border-slate-600/50 bg-slate-800/30';
    case 'processing': return 'border-blue-500/50 bg-blue-500/10';
    case 'completed': return 'border-emerald-500/50 bg-emerald-500/10';
    case 'failed': return 'border-red-500/50 bg-red-500/10';
    case 'cancelled': return 'border-slate-600/30 bg-slate-800/20 opacity-50';
    default: return 'border-slate-600/50 bg-slate-800/30';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'queued':
      return <IconClock size={14} className="text-slate-400" />;
    case 'processing':
      return <IconRefresh size={14} className="text-blue-400 animate-spin" />;
    case 'completed':
      return <IconCheck size={14} className="text-emerald-400" />;
    case 'failed':
      return <IconX size={14} className="text-red-400" />;
    case 'cancelled':
      return <IconX size={14} className="text-slate-500" />;
    default:
      return <IconClock size={14} className="text-slate-400" />;
  }
}

