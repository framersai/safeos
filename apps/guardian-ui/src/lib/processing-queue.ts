/**
 * Processing Queue Service
 * 
 * Manages the queue for AI-enhanced analysis requests.
 * Provides estimated wait times and resource commitment promises.
 * 
 * NOTE: This is a frontend stub - the actual queue is managed server-side.
 * This module provides UI state and mock data for development.
 * 
 * @module lib/processing-queue
 */

import { create } from 'zustand';

// =============================================================================
// Types
// =============================================================================

export type QueueRequestType = 
  | 'ai_analysis'           // Full AI analysis of scene
  | 'complex_detection'     // Complex pattern detection
  | 'audio_analysis'        // Audio pattern recognition
  | 'behavior_prediction';  // Behavior prediction model

export type QueueStatus = 
  | 'queued'       // Waiting in queue
  | 'processing'   // Currently being processed
  | 'completed'    // Finished successfully
  | 'failed'       // Failed to process
  | 'cancelled';   // Cancelled by user

export interface QueuedRequest {
  id: string;
  type: QueueRequestType;
  estimatedTimeSeconds: number;
  position: number;
  status: QueueStatus;
  resourceCommitted: boolean;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  priority: 'low' | 'normal' | 'high' | 'emergency';
}

export interface QueueStats {
  totalQueued: number;
  averageWaitSeconds: number;
  currentLoad: 'low' | 'medium' | 'high' | 'critical';
  estimatedClearTime: number; // seconds until queue is empty
  serverStatus: 'online' | 'degraded' | 'offline';
}

export interface ResourceCommitment {
  isCommitted: boolean;
  commitThresholdSeconds: number;
  message: string;
}

// =============================================================================
// Queue State Store
// =============================================================================

interface QueueState {
  // Current requests from this client
  requests: QueuedRequest[];
  
  // Queue statistics
  stats: QueueStats;
  
  // Whether queue updates are being received
  isConnected: boolean;
  
  // Last update timestamp
  lastUpdate: number;
  
  // Actions
  addRequest: (type: QueueRequestType, priority?: QueuedRequest['priority']) => string;
  cancelRequest: (id: string) => void;
  updateRequest: (id: string, updates: Partial<QueuedRequest>) => void;
  clearCompleted: () => void;
  
  // Mock actions (for development)
  simulateProgress: (id: string) => void;
  setStats: (stats: Partial<QueueStats>) => void;
  setConnected: (connected: boolean) => void;
}

// =============================================================================
// Default Stats (mock data for development)
// =============================================================================

const DEFAULT_STATS: QueueStats = {
  totalQueued: 0,
  averageWaitSeconds: 15,
  currentLoad: 'low',
  estimatedClearTime: 0,
  serverStatus: 'online',
};

// =============================================================================
// Queue Store
// =============================================================================

export const useQueueStore = create<QueueState>((set, get) => ({
  requests: [],
  stats: { ...DEFAULT_STATS },
  isConnected: true,
  lastUpdate: Date.now(),
  
  addRequest: (type, priority = 'normal') => {
    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const stats = get().stats;
    
    // Estimate wait time based on queue position and load
    const position = get().requests.filter(r => 
      r.status === 'queued' || r.status === 'processing'
    ).length + 1;
    
    const baseTime = getBaseTimeForType(type);
    const loadMultiplier = getLoadMultiplier(stats.currentLoad);
    const estimatedTimeSeconds = Math.round(baseTime * loadMultiplier * position);
    
    const request: QueuedRequest = {
      id,
      type,
      estimatedTimeSeconds,
      position,
      status: 'queued',
      resourceCommitted: false,
      createdAt: Date.now(),
      priority,
    };
    
    set(state => ({
      requests: [...state.requests, request],
      stats: {
        ...state.stats,
        totalQueued: state.stats.totalQueued + 1,
      },
    }));
    
    return id;
  },
  
  cancelRequest: (id) => {
    set(state => ({
      requests: state.requests.map(r => 
        r.id === id ? { ...r, status: 'cancelled' as QueueStatus } : r
      ),
    }));
  },
  
  updateRequest: (id, updates) => {
    set(state => ({
      requests: state.requests.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
      lastUpdate: Date.now(),
    }));
  },
  
  clearCompleted: () => {
    set(state => ({
      requests: state.requests.filter(r => 
        r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'failed'
      ),
    }));
  },
  
  // Development helpers
  simulateProgress: (id) => {
    const request = get().requests.find(r => r.id === id);
    if (!request || request.status !== 'queued') return;
    
    // Start processing
    get().updateRequest(id, { 
      status: 'processing',
      startedAt: Date.now(),
    });
    
    // Complete after estimated time
    setTimeout(() => {
      get().updateRequest(id, {
        status: 'completed',
        completedAt: Date.now(),
      });
    }, request.estimatedTimeSeconds * 1000);
  },
  
  setStats: (stats) => {
    set(state => ({
      stats: { ...state.stats, ...stats },
      lastUpdate: Date.now(),
    }));
  },
  
  setConnected: (connected) => {
    set({ isConnected: connected });
  },
}));

// =============================================================================
// Helper Functions
// =============================================================================

function getBaseTimeForType(type: QueueRequestType): number {
  switch (type) {
    case 'ai_analysis': return 10;
    case 'complex_detection': return 5;
    case 'audio_analysis': return 8;
    case 'behavior_prediction': return 15;
    default: return 10;
  }
}

function getLoadMultiplier(load: QueueStats['currentLoad']): number {
  switch (load) {
    case 'low': return 1;
    case 'medium': return 1.5;
    case 'high': return 2.5;
    case 'critical': return 5;
    default: return 1;
  }
}

/**
 * Get resource commitment info for a request
 */
export function getResourceCommitment(request: QueuedRequest): ResourceCommitment {
  const COMMIT_THRESHOLD = 30; // seconds
  
  if (request.estimatedTimeSeconds > COMMIT_THRESHOLD && !request.resourceCommitted) {
    return {
      isCommitted: false,
      commitThresholdSeconds: COMMIT_THRESHOLD,
      message: `If wait exceeds ${COMMIT_THRESHOLD}s, we commit dedicated resources to prioritize your request.`,
    };
  }
  
  if (request.resourceCommitted) {
    return {
      isCommitted: true,
      commitThresholdSeconds: COMMIT_THRESHOLD,
      message: 'Dedicated resources allocated. Your request is prioritized.',
    };
  }
  
  return {
    isCommitted: false,
    commitThresholdSeconds: COMMIT_THRESHOLD,
    message: 'Processing with shared resources.',
  };
}

/**
 * Format estimated time for display
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 5) return 'Almost instant';
  if (seconds < 60) return `~${seconds}s`;
  if (seconds < 3600) return `~${Math.round(seconds / 60)}min`;
  return `~${Math.round(seconds / 3600)}hr`;
}

/**
 * Get queue load description
 */
export function getLoadDescription(load: QueueStats['currentLoad']): {
  label: string;
  description: string;
  color: string;
} {
  switch (load) {
    case 'low':
      return {
        label: 'Low',
        description: 'Requests processed quickly',
        color: 'green',
      };
    case 'medium':
      return {
        label: 'Medium',
        description: 'Normal wait times',
        color: 'yellow',
      };
    case 'high':
      return {
        label: 'High',
        description: 'Longer wait expected',
        color: 'orange',
      };
    case 'critical':
      return {
        label: 'Critical',
        description: 'Very long wait, consider local-only mode',
        color: 'red',
      };
  }
}

/**
 * Get type description
 */
export function getTypeDescription(type: QueueRequestType): {
  label: string;
  description: string;
} {
  switch (type) {
    case 'ai_analysis':
      return {
        label: 'AI Analysis',
        description: 'Full scene analysis using AI models',
      };
    case 'complex_detection':
      return {
        label: 'Complex Detection',
        description: 'Advanced pattern and behavior detection',
      };
    case 'audio_analysis':
      return {
        label: 'Audio Analysis',
        description: 'Sound pattern recognition (crying, alerts)',
      };
    case 'behavior_prediction':
      return {
        label: 'Behavior Prediction',
        description: 'Predict potential issues before they occur',
      };
  }
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to get active requests count
 */
export function useActiveRequestCount(): number {
  return useQueueStore(state => 
    state.requests.filter(r => r.status === 'queued' || r.status === 'processing').length
  );
}

/**
 * Hook to get current queue stats
 */
export function useQueueStats(): QueueStats {
  return useQueueStore(state => state.stats);
}

/**
 * Hook to check if a request type would be instant (local) or queued
 */
export function useIsLocalProcessing(processingMode: 'local' | 'ai_enhanced' | 'hybrid'): boolean {
  return processingMode === 'local';
}

