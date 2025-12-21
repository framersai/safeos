/**
 * SafeOS Types
 *
 * Shared TypeScript types for the SafeOS package.
 *
 * @module types
 */

// =============================================================================
// Monitoring Types
// =============================================================================

export type MonitoringScenario = 'pet' | 'baby' | 'elderly';

export interface MonitoringProfile {
  id: string;
  name: string;
  scenario: MonitoringScenario;
  settings: MonitoringSettings;
  isActive: boolean;
  createdAt: string;
}

export interface MonitoringSettings {
  motionSensitivity: number; // 0-100
  audioSensitivity: number; // 0-100
  analysisInterval: number; // seconds
  cryDetection?: boolean;
  sleepMonitoring?: boolean;
  barkDetection?: boolean;
  inactivityAlert?: boolean;
  fallDetection?: boolean;
  helpDetection?: boolean;
}

// =============================================================================
// Stream Types
// =============================================================================

export type StreamStatus = 'active' | 'paused' | 'ended' | 'banned';

export interface Stream {
  id: string;
  userId?: string;
  scenario: MonitoringScenario;
  status: StreamStatus;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

export interface FrameData {
  id: string;
  streamId: string;
  frameData: string; // base64
  motionScore: number;
  audioLevel: number;
  createdAt: string;
}

export interface FrameBuffer extends FrameData {
  // Same as FrameData for now
}

// =============================================================================
// Analysis Types
// =============================================================================

export type ConcernLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface AnalysisResult {
  id: string;
  streamId: string;
  frameId?: string;
  concernLevel: ConcernLevel;
  description: string;
  detectedIssues: string[];
  processingTimeMs: number;
  modelUsed: string;
  isCloudFallback: boolean;
  createdAt: string;
}

export interface AnalysisJob {
  id: string;
  streamId: string;
  frameId?: string;
  imageData: string;
  motionScore: number;
  audioLevel: number;
  scenario: MonitoringScenario;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries?: number;
  createdAt: string;
}

// =============================================================================
// Alert Types
// =============================================================================

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  streamId: string;
  alertType: string;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface AlertEscalation {
  alertId: string;
  streamId: string;
  severity: string;
  startedAt: number;
  currentLevel: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
}

// =============================================================================
// Ollama Types
// =============================================================================

export interface OllamaModelInfo {
  name: string;
  size: number;
  modifiedAt: string;
  digest: string;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  images?: string[];
  stream?: boolean;
  options?: {
    temperature?: number;
    numPredict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  createdAt: string;
  response: string;
  done: boolean;
  totalDuration?: number;
}

// =============================================================================
// WebSocket Types
// =============================================================================

export interface WSMessage {
  type: string;
  streamId?: string;
  channel?: string;
  payload?: any;
  timestamp?: number;
}

export interface WSFrameMessage extends WSMessage {
  type: 'frame';
  payload: {
    imageData: string;
    motionScore: number;
    audioLevel: number;
  };
}

export interface WSAlertMessage extends WSMessage {
  type: 'alert';
  payload: Alert;
}

// =============================================================================
// Notification Types
// =============================================================================

export interface NotificationConfig {
  browserPush: boolean;
  sms: boolean;
  telegram: boolean;
  smsNumber?: string;
  telegramChatId?: string;
}

export interface NotificationPayload {
  streamId: string;
  alertId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  thumbnailUrl?: string;
  timestamp: string;
}

// =============================================================================
// Content Moderation Types
// =============================================================================

export type ModerationTier = 0 | 1 | 2 | 3 | 4;
export type ModerationAction = 'allow' | 'blur' | 'block' | 'escalate';

export interface ModerationResult {
  tier: ModerationTier;
  action: ModerationAction;
  categories: string[];
  confidence: number;
  reason?: string;
}

export interface ContentFlag {
  id: string;
  streamId: string;
  analysisId?: string;
  category: string;
  tier: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'banned';
  metadata?: Record<string, any>;
  reviewedAt?: string;
  reviewerNotes?: string;
  createdAt: string;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface SafeOSConfig {
  bufferMinutes: number;
  motionThreshold: number;
  audioThreshold: number;
  analysisInterval: number;
  maxConcurrentAnalysis: number;
  ollamaEndpoint: string;
  cloudFallbackEnabled: boolean;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
