'use client';

/**
 * Monitor Page
 *
 * Live monitoring interface.
 *
 * @module app/monitor/page
 */

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CameraFeed } from '../../components/CameraFeed';
import { AlertPanel } from '../../components/AlertPanel';
import { useMonitoringStore } from '../../stores/monitoring-store';
import { useOnboardingStore } from '../../stores/onboarding-store';
import { useWebSocket, type WSMessage } from '../../lib/websocket';

// =============================================================================
// Constants
// =============================================================================

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

// =============================================================================
// Component
// =============================================================================

export default function MonitorPage() {
  const {
    isConnected,
    isStreaming,
    streamId,
    scenario,
    motionScore,
    audioLevel,
    setConnected,
    setStreaming,
    setStreamId,
    setMotionScore,
    setAudioLevel,
    addAlert,
  } = useMonitoringStore();

  const { selectedScenario } = useOnboardingStore();

  // ---------------------------------------------------------------------------
  // WebSocket
  // ---------------------------------------------------------------------------

  const handleMessage = useCallback(
    (message: WSMessage) => {
      switch (message.type) {
        case 'stream-started':
          setStreaming(true);
          setStreamId(message.payload?.streamId);
          break;
        case 'stream-stopped':
          setStreaming(false);
          setStreamId(null);
          break;
        case 'alert':
          addAlert({
            id: message.payload?.id || Date.now().toString(),
            streamId: message.payload?.streamId || '',
            severity: message.payload?.severity || 'medium',
            message: message.payload?.message || 'Alert detected',
            timestamp: message.payload?.timestamp || new Date().toISOString(),
            acknowledged: false,
          });
          break;
        case 'pong':
          // Heartbeat received
          break;
      }
    },
    [setStreaming, setStreamId, addAlert]
  );

  const { send, isConnected: wsConnected, reconnect } = useWebSocket({
    url: WS_URL,
    onMessage: handleMessage,
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const startStream = () => {
    send({
      type: 'start-stream',
      payload: { scenario: selectedScenario || scenario },
    });
  };

  const stopStream = () => {
    send({ type: 'stop-stream' });
  };

  const handleFrame = (frame: string, motion: number, audio: number) => {
    if (!isStreaming) return;

    send({
      type: 'frame',
      payload: {
        frame,
        motionScore: motion,
        audioLevel: audio,
      },
    });
  };

  const handleMotion = (score: number) => {
    setMotionScore(score);
  };

  const handleAudio = (level: number) => {
    setAudioLevel(level);
  };

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Heartbeat
  useEffect(() => {
    if (!wsConnected) return;

    const interval = setInterval(() => {
      send({ type: 'ping' });
    }, 30000);

    return () => clearInterval(interval);
  }, [wsConnected, send]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl hover:scale-110 transition-transform">
                🛡️
              </Link>
              <h1 className="text-xl font-bold text-white">Live Monitor</h1>

              {/* Connection status */}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  wsConnected
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    wsConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                {wsConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!wsConnected && (
                <button
                  onClick={reconnect}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Reconnect
                </button>
              )}

              {wsConnected && !isStreaming && (
                <button
                  onClick={startStream}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Start Monitoring
                </button>
              )}

              {isStreaming && (
                <button
                  onClick={stopStream}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Stop Monitoring
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="font-semibold text-white">Camera Feed</h2>
              </div>
              <CameraFeed
                scenario={selectedScenario || scenario}
                onFrame={handleFrame}
                onMotion={handleMotion}
                onAudio={handleAudio}
                showDebug={true}
                className="aspect-video"
              />
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Motion"
                value={motionScore.toFixed(1)}
                unit="%"
                color={motionScore > 30 ? 'yellow' : 'green'}
              />
              <StatCard
                label="Audio"
                value={audioLevel.toFixed(1)}
                unit="%"
                color={audioLevel > 30 ? 'yellow' : 'green'}
              />
              <StatCard
                label="Stream"
                value={isStreaming ? 'Active' : 'Inactive'}
                color={isStreaming ? 'green' : 'gray'}
              />
              <StatCard
                label="Mode"
                value={selectedScenario || scenario}
                color="blue"
              />
            </div>
          </div>

          {/* Alert Panel */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden min-h-[400px]">
            <AlertPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
}) {
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
    blue: 'bg-blue-500/20 text-blue-400',
    gray: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div
      className={`p-4 rounded-lg ${colorClasses[color]} border border-current/20`}
    >
      <div className="text-xs uppercase mb-1">{label}</div>
      <div className="text-xl font-bold capitalize">
        {value}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
    </div>
  );
}
