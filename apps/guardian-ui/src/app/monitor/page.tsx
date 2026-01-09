'use client';

/**
 * Monitor Page
 *
 * Live monitoring interface with Lost & Found detection.
 *
 * @module app/monitor/page
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { CameraFeed } from '../../components/CameraFeed';
import { AlertPanel } from '../../components/AlertPanel';
import { SubjectPreviewOverlay, SubjectPreview } from '../../components/SubjectPreview';
import { QuickSettingsPanel } from '../../components/QuickSettingsPanel';
import { IconSearch, IconFingerprint, IconRadar, IconChevronDown, IconShield } from '../../components/icons';
import { useMonitoringStore } from '../../stores/monitoring-store';
import { useOnboardingStore } from '../../stores/onboarding-store';
import { useSettingsStore, DEFAULT_PRESETS, type PresetId, isSleepPreset } from '../../stores/settings-store';
import { useLostFoundStore, createMatchFrame, getMatcherSettings } from '../../stores/lost-found-store';
import { getSubjectMatcher, type MatchResult } from '../../lib/subject-matcher';
import { saveMatchFrame, type MatchFrameDB } from '../../lib/client-db';
import { useWebSocket, type WSMessage } from '../../lib/websocket';
import { getSoundManager } from '../../lib/sound-manager';

// =============================================================================
// Constants
// =============================================================================

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
const THUMBNAIL_WIDTH = 160;
const THUMBNAIL_HEIGHT = 120;
const THUMBNAIL_QUALITY = 0.3;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a compressed thumbnail from frame data
 * @param frameData - Base64 image data URL
 * @returns Promise resolving to compressed thumbnail data URL
 */
async function createThumbnail(frameData: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = THUMBNAIL_WIDTH;
      canvas.height = THUMBNAIL_HEIGHT;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw scaled-down image
        ctx.drawImage(img, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        // Export as compressed JPEG
        resolve(canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY));
      } else {
        // Fallback to original if canvas fails
        resolve(frameData);
      }
    };
    img.onerror = () => {
      // Fallback to original on error
      resolve(frameData);
    };
    img.src = frameData;
  });
}

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
  
  const {
    activeSubject,
    isWatching: isLostFoundWatching,
    settings: lostFoundSettings,
    updateCurrentConfidence,
    updateConsecutiveMatches,
    addMatchFrame: addMatchFrameToStore,
    addRecentMatch,
    recordAlert: recordLostFoundAlert,
  } = useLostFoundStore();
  
  const [showLostFoundPanel, setShowLostFoundPanel] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const matcherRef = useRef(getSubjectMatcher());
  const modeDropdownRef = useRef<HTMLDivElement | null>(null);

  // Settings store for security modes/presets
  const { activePresetId, setActivePreset, activeSleepPreset } = useSettingsStore();
  const currentPreset = DEFAULT_PRESETS[activePresetId];

  // Close mode dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------------------------------------------------------------------------
  // Lost & Found Integration
  // ---------------------------------------------------------------------------
  
  // Update matcher when settings change
  useEffect(() => {
    if (activeSubject && isLostFoundWatching) {
      const matcher = matcherRef.current;
      matcher.setFingerprint(activeSubject.fingerprint);
      matcher.setSettings(getMatcherSettings(lostFoundSettings));
      matcher.setActive(true);
    } else {
      matcherRef.current.setActive(false);
    }
  }, [activeSubject, isLostFoundWatching, lostFoundSettings]);

  // Process frames for Lost & Found matching
  const processLostFoundFrame = useCallback((video: HTMLVideoElement) => {
    if (!isLostFoundWatching || !activeSubject) return;
    
    const matcher = matcherRef.current;
    const result = matcher.processFrame(video);
    
    if (result) {
      // Update UI
      updateCurrentConfidence(result.confidence);
      updateConsecutiveMatches(matcher.getState().consecutiveMatches);
      addRecentMatch(result);
      
      // Check if should record
      if (matcher.shouldRecord() && result.frameData) {
        // Create match frame and save to IndexedDB (async thumbnail creation)
        const frameData = result.frameData;
        createThumbnail(frameData).then((thumbnailData) => {
          const matchFrame: MatchFrameDB = {
            id: result.id,
            subjectId: activeSubject.id,
            frameData: frameData,
            thumbnailData: thumbnailData,
            confidence: result.confidence,
            timestamp: result.timestamp,
            details: result.details,
            region: result.region || null,
            acknowledged: false,
            notes: '',
            exported: false,
          };

          saveMatchFrame(matchFrame);
        });
        addMatchFrameToStore(createMatchFrame(activeSubject.id, result));
      }

      // Check if should alert
      if (matcher.shouldAlert()) {
        recordLostFoundAlert();

        // Play sound if enabled
        if (lostFoundSettings.alertSound) {
          getSoundManager().play('alert');
        }
        
        // Show notification if enabled
        if (lostFoundSettings.alertNotification && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Potential Match Detected!', {
            body: `${activeSubject.name} - ${result.confidence}% confidence`,
            icon: activeSubject.referenceImages[0],
          });
        }
      }
    } else {
      // Reset confidence when no match
      updateCurrentConfidence(0);
    }
  }, [
    isLostFoundWatching,
    activeSubject,
    lostFoundSettings,
    updateCurrentConfidence,
    updateConsecutiveMatches,
    addRecentMatch,
    addMatchFrameToStore,
    recordLostFoundAlert,
  ]);

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

  const { sendMessage, isConnected: wsConnected, connect: reconnect } = useWebSocket(
    WS_URL,
    {
      onMessage: handleMessage,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    }
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const startStream = () => {
    sendMessage({
      type: 'start-stream',
      payload: { scenario: selectedScenario || scenario },
    });
  };

  const stopStream = () => {
    sendMessage({ type: 'stop-stream' });
  };

  const handleFrame = (data: { imageData: string; motionScore: number; audioLevel: number }) => {
    if (!isStreaming) return;

    sendMessage({
      type: 'frame',
      payload: {
        frame: data.imageData,
        motionScore: data.motionScore,
        audioLevel: data.audioLevel,
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
      sendMessage({ type: 'ping' });
    }, 30000);

    return () => clearInterval(interval);
  }, [wsConnected, sendMessage]);

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
              {/* Security Mode Selector */}
              <div ref={modeDropdownRef} className="relative">
                <button
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    isSleepPreset(activePresetId)
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      : currentPreset.emergencyMode
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  aria-label="Select Security Mode"
                  aria-expanded={showModeDropdown}
                  aria-haspopup="listbox"
                >
                  <IconShield size={18} />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {currentPreset.name}
                  </span>
                  <IconChevronDown size={14} className={`transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showModeDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-xl border border-gray-700 shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-700">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Security Modes</p>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {/* Sleep Presets */}
                      <div className="p-2 border-b border-gray-700/50">
                        <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider px-2 py-1">Sleep Monitoring</p>
                        {(['infant_sleep', 'pet_sleep', 'deep_sleep_minimal'] as const).map((presetId) => {
                          const preset = DEFAULT_PRESETS[presetId];
                          const isActive = activePresetId === presetId;
                          return (
                            <button
                              key={presetId}
                              onClick={() => {
                                setActivePreset(presetId);
                                setShowModeDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{preset.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                  {preset.absolutePixelThreshold}px
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{preset.description}</p>
                            </button>
                          );
                        })}
                      </div>

                      {/* General Presets */}
                      <div className="p-2">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider px-2 py-1">General Modes</p>
                        {(['silent', 'night', 'maximum', 'ultimate'] as const).map((presetId) => {
                          const preset = DEFAULT_PRESETS[presetId];
                          const isActive = activePresetId === presetId;
                          return (
                            <button
                              key={presetId}
                              onClick={() => {
                                setActivePreset(presetId);
                                setShowModeDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                isActive
                                  ? preset.emergencyMode
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{preset.name}</span>
                                {preset.emergencyMode && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                                    EMERGENCY
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{preset.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lost & Found toggle */}
              <button
                onClick={() => setShowLostFoundPanel(!showLostFoundPanel)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isLostFoundWatching
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                aria-label="Lost & Found Mode"
                aria-expanded={showLostFoundPanel}
                aria-pressed={isLostFoundWatching}
              >
                <IconRadar size={18} />
                <span className="hidden sm:inline">
                  {isLostFoundWatching ? 'Watching' : 'Lost & Found'}
                </span>
                {isLostFoundWatching && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                )}
              </button>
              
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
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden relative">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold text-white">Camera Feed</h2>
                {isLostFoundWatching && activeSubject && (
                  <div className="flex items-center gap-2 text-sm text-purple-400">
                    <IconFingerprint size={16} />
                    <span>Matching: {activeSubject.name}</span>
                  </div>
                )}
              </div>
              
              {/* Subject preview overlay */}
              {isLostFoundWatching && <SubjectPreviewOverlay />}
              
              <CameraFeed
                scenario={selectedScenario || scenario || undefined}
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
                value={selectedScenario || scenario || 'Standard'}
                color="blue"
              />
            </div>
          </div>

          {/* Alert Panel or Lost & Found Panel */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden min-h-[400px]">
            {showLostFoundPanel ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <IconSearch size={18} />
                    Lost & Found
                  </h2>
                  <button
                    onClick={() => setShowLostFoundPanel(false)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Show Alerts
                  </button>
                </div>
                
                {activeSubject ? (
                  <SubjectPreview mode="full" showClose={false} />
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                      <IconSearch size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      No Subject Set
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Add a lost pet or person to watch for
                    </p>
                    <Link
                      href="/lost-found"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                    >
                      <IconFingerprint size={16} />
                      Set Up Lost & Found
                    </Link>
                  </div>
                )}
                
                {activeSubject && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Link
                      href="/lost-found/gallery"
                      className="block w-full text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      View Match History
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <AlertPanel />
            )}
          </div>
        </div>
      </main>

      {/* Quick Settings Panel - floating bottom-right */}
      <QuickSettingsPanel />
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
