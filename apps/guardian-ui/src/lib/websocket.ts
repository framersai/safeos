/**
 * WebSocket Client
 *
 * Real-time communication with the SafeOS backend.
 * Handles connection management, reconnection, and message handling.
 *
 * @module lib/websocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMonitoringStore } from '@/stores/monitoring-store';

// =============================================================================
// Types
// =============================================================================

export interface WSMessage {
  type: string;
  payload: unknown;
  timestamp?: string;
}

export interface WSFrameMessage extends WSMessage {
  type: 'frame';
  payload: {
    streamId: string;
    frameBase64: string;
    motionScore: number;
    audioLevel: number;
    cryingDetected?: boolean;
  };
}

export interface WSAlertMessage extends WSMessage {
  type: 'alert';
  payload: {
    streamId: string;
    alertType: string;
    severity: 'info' | 'warning' | 'urgent' | 'critical';
    message: string;
    analysisId?: string;
  };
}

export interface WSAnalysisMessage extends WSMessage {
  type: 'analysis';
  payload: {
    streamId: string;
    concernLevel: string;
    confidence: number;
    description: string;
    processingTimeMs: number;
  };
}

export type MessageHandler = (message: WSMessage) => void;

// =============================================================================
// WebSocket Hook
// =============================================================================

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: MessageHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = getDefaultWsUrl(),
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onMessage,
    onConnect,
    onDisconnect,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const { setWsConnected, recordPing, addAlert } = useMonitoringStore();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        setWsConnected(true);
        setLastError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();

        // Send ping periodically
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        ws.onclose = () => {
          clearInterval(pingInterval);
        };
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          // Handle pong
          if (message.type === 'pong') {
            recordPing();
            return;
          }

          // Handle alerts
          if (message.type === 'alert') {
            const alertMessage = message as WSAlertMessage;
            addAlert({
              streamId: alertMessage.payload.streamId,
              type: alertMessage.payload.alertType,
              severity: alertMessage.payload.severity,
              message: alertMessage.payload.message,
              escalationLevel: 0,
            });
          }

          // Call custom handler
          onMessage?.(message);
        } catch (error) {
          console.error('[WS] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        setLastError('Connection error');
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
        setWsConnected(false);
        onDisconnect?.();

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `[WS] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        } else {
          setLastError('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WS] Failed to connect:', error);
      setLastError('Failed to connect');
    }
  }, [
    url,
    maxReconnectAttempts,
    reconnectInterval,
    onConnect,
    onDisconnect,
    onMessage,
    setWsConnected,
    recordPing,
    addAlert,
  ]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setWsConnected(false);
  }, [setWsConnected]);

  // Send message
  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('[WS] Cannot send - not connected');
    return false;
  }, []);

  // Send frame
  const sendFrame = useCallback(
    (data: {
      streamId: string;
      frameBase64: string;
      motionScore: number;
      audioLevel: number;
      cryingDetected?: boolean;
    }) => {
      return send({
        type: 'frame',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    },
    [send]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastError,
    connect,
    disconnect,
    send,
    sendFrame,
  };
}

// =============================================================================
// WebSocket Client Class (Non-Hook)
// =============================================================================

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private isConnectedFlag = false;

  constructor(options: {
    url?: string;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
  } = {}) {
    this.url = options.url || getDefaultWsUrl();
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectInterval = options.reconnectInterval || 3000;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WSClient] Connected');
        this.isConnectedFlag = true;
        this.reconnectAttempts = 0;
        this.emit('connect', { type: 'connect', payload: {} });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.emit(message.type, message);
          this.emit('*', message); // Wildcard handler
        } catch (error) {
          console.error('[WSClient] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WSClient] Error:', error);
        this.emit('error', { type: 'error', payload: { error } });
      };

      this.ws.onclose = () => {
        console.log('[WSClient] Disconnected');
        this.isConnectedFlag = false;
        this.emit('disconnect', { type: 'disconnect', payload: {} });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WSClient] Failed to connect:', error);
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnectedFlag = false;
  }

  send(message: WSMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  off(type: string, handler?: MessageHandler): void {
    if (handler) {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.messageHandlers.delete(type);
    }
  }

  private emit(type: string, message: WSMessage): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WSClient] Handler error:', error);
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WSClient] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WSClient] Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  get isConnected(): boolean {
    return this.isConnectedFlag;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function getDefaultWsUrl(): string {
  if (typeof window === 'undefined') {
    return 'ws://localhost:3001';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = process.env.NEXT_PUBLIC_WS_PORT || '3001';

  return `${protocol}//${host}:${port}`;
}

