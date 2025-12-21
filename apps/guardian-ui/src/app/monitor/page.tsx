'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useMonitoringStore } from '@/stores/monitoring-store';
import { useWebSocket } from '@/lib/websocket';
import CameraFeed from '@/components/CameraFeed';
import AlertPanel from '@/components/AlertPanel';

// =============================================================================
// Monitor Page
// =============================================================================

export default function MonitorPage() {
  const router = useRouter();
  const { isOnboardingComplete, primaryScenario, selectedScenarios } =
    useOnboardingStore();
  const {
    isStreaming,
    streamId,
    motionScore,
    audioLevel,
    startStream,
    stopStream,
    updateStreamStatus,
  } = useMonitoringStore();

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState(primaryScenario || 'pet');

  // WebSocket connection
  const { isConnected, sendFrame, connect } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'analysis') {
        console.log('[Monitor] Analysis result:', message.payload);
      }
    },
    onConnect: () => {
      if (streamId) {
        updateStreamStatus('active');
      }
    },
    onDisconnect: () => {
      if (isStreaming) {
        updateStreamStatus('disconnected');
      }
    },
  });

  // Check onboarding
  useEffect(() => {
    if (!isOnboardingComplete) {
      router.push('/setup');
    }
  }, [isOnboardingComplete, router]);

  // Start monitoring
  const handleStart = async () => {
    setIsStarting(true);
    setError(null);

    try {
      // Create stream on backend
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: activeScenario }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create stream');
      }

      // Update local state
      startStream(data.data.id, activeScenario as 'pet' | 'baby' | 'elderly');
      updateStreamStatus('active');

      // Ensure WebSocket connected
      if (!isConnected) {
        connect();
      }
    } catch (err) {
      console.error('Failed to start monitoring:', err);
      setError(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setIsStarting(false);
    }
  };

  // Stop monitoring
  const handleStop = async () => {
    if (!streamId) return;

    try {
      // End stream on backend
      await fetch(`/api/streams/${streamId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to stop stream:', err);
    }

    stopStream();
  };

  // Handle frame from camera
  const handleFrame = useCallback(
    (data: {
      frameBase64: string;
      motionScore: number;
      audioLevel: number;
      cryingDetected?: boolean;
    }) => {
      if (!streamId || !isConnected) return;

      sendFrame({
        streamId,
        ...data,
      });
    },
    [streamId, isConnected, sendFrame]
  );

  const scenarioIcons: Record<string, string> = {
    pet: '🐾',
    baby: '👶',
    elderly: '🧓',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white/60 hover:text-white">
                ← Dashboard
              </Link>
              <h1 className="text-lg font-semibold">Live Monitor</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection status */}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                  isConnected
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>

              {/* Settings */}
              <Link
                href="/settings"
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                ⚙️
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera Feed - Main Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Scenario Selector */}
            {!isStreaming && (
              <div className="flex gap-2">
                {selectedScenarios.map((scenario) => (
                  <button
                    key={scenario}
                    onClick={() => setActiveScenario(scenario)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      activeScenario === scenario
                        ? 'bg-safeos-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    <span>{scenarioIcons[scenario]}</span>
                    <span className="capitalize">{scenario}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Camera Feed */}
            <div className="relative">
              {isStreaming ? (
                <CameraFeed
                  scenario={activeScenario as 'pet' | 'baby' | 'elderly'}
                  onFrame={handleFrame}
                  className="aspect-video"
                />
              ) : (
                <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{scenarioIcons[activeScenario]}</div>
                    <p className="text-white/60 mb-2">
                      Ready to monitor: <span className="capitalize">{activeScenario}</span>
                    </p>
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isStreaming && (
                  <>
                    {/* Motion Score */}
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-sm">Motion</span>
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            motionScore > 0.1 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, motionScore * 100)}%` }}
                        />
                      </div>
                      <span className="text-white/60 text-xs w-10">
                        {Math.round(motionScore * 100)}%
                      </span>
                    </div>

                    {/* Audio Level */}
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-sm">Audio</span>
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            audioLevel > 0.2 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
                        />
                      </div>
                      <span className="text-white/60 text-xs w-10">
                        {Math.round(audioLevel * 100)}%
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Start/Stop Button */}
              {isStreaming ? (
                <button
                  onClick={handleStop}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium flex items-center gap-2"
                >
                  <span>⏹</span>
                  Stop Monitoring
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="px-6 py-3 bg-gradient-to-r from-safeos-500 to-cyan-500 hover:from-safeos-600 hover:to-cyan-600 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {isStarting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <span>▶️</span>
                      Start Monitoring
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar - Alerts & Status */}
          <div className="space-y-6">
            {/* Alert Panel */}
            <AlertPanel maxAlerts={5} showControls={true} />

            {/* Stream Info */}
            {isStreaming && streamId && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold mb-3">Stream Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Stream ID</span>
                    <span className="font-mono text-xs">{streamId.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Scenario</span>
                    <span className="capitalize">{activeScenario}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">WebSocket</span>
                    <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-semibold mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li>• Position camera with clear view of subject</li>
                <li>• Good lighting improves detection accuracy</li>
                <li>• Alerts appear when motion/sound detected</li>
                <li>• Configure notifications in Settings</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
