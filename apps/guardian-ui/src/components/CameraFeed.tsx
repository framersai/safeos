/**
 * Camera Feed Component
 *
 * Displays camera feed with motion/audio detection.
 *
 * @module components/CameraFeed
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { detectMotion, MOTION_THRESHOLDS, getThresholdForScenario } from '../lib/motion-detection';
import { getAudioLevel, detectCryingPattern, AUDIO_THRESHOLDS } from '../lib/audio-levels';

// =============================================================================
// Types
// =============================================================================

interface CameraFeedProps {
  onFrame?: (data: FrameData) => void;
  onMotion?: (score: number) => void;
  onAudio?: (level: number) => void;
  onError?: (error: Error) => void;
  scenario?: 'pet' | 'baby' | 'elderly' | 'security';
  enabled?: boolean;
  showDebug?: boolean;
  className?: string;
}

export interface FrameData {
  imageData: string;
  motionScore: number;
  audioLevel: number;
  timestamp: number;
  hasCrying?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const FRAME_INTERVAL = 1000; // Check every second
const MOTION_INTERVAL = 200; // Motion detection every 200ms
const AUDIO_INTERVAL = 100; // Audio level every 100ms

// =============================================================================
// CameraFeed Component
// =============================================================================

export function CameraFeed({
  onFrame,
  onMotion,
  onAudio,
  onError,
  scenario = 'baby',
  enabled = true,
  showDebug = false,
  className,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [motionScore, setMotionScore] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasCrying, setHasCrying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Motion threshold for this scenario
  const motionThreshold = getThresholdForScenario(scenario);
  const audioThreshold = AUDIO_THRESHOLDS[scenario]?.ambient || 15;

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment',
        },
        audio: true,
      });

      streamRef.current = stream;

      // Set up video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      setCameraActive(true);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (enabled) {
      initCamera();
    }
    return () => {
      stopCamera();
    };
  }, [enabled, initCamera, stopCamera]);

  // Motion detection loop
  useEffect(() => {
    if (!cameraActive || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const interval = setInterval(() => {
      if (!videoRef.current) return;

      // Draw current frame
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      ctx.drawImage(videoRef.current, 0, 0);

      // Get current frame data
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Compare with previous frame
      if (previousFrameRef.current) {
        const score = detectMotion(previousFrameRef.current, currentFrame);
        const motionPercent = Math.round(score * 100);
        setMotionScore(motionPercent);
        onMotion?.(motionPercent);
      }

      // Store current frame for next comparison
      previousFrameRef.current = currentFrame;
    }, MOTION_INTERVAL);

    return () => clearInterval(interval);
  }, [cameraActive]);

  // Audio analysis loop
  useEffect(() => {
    if (!cameraActive || !analyserRef.current) return;

    const interval = setInterval(() => {
      if (!analyserRef.current) return;

      const level = getAudioLevel(analyserRef.current);
      const audioPercent = Math.round(level * 100);
      setAudioLevel(audioPercent);
      onAudio?.(audioPercent);

      // Detect crying for baby monitoring
      if (scenario === 'baby' && analyserRef.current) {
        const crying = detectCryingPattern(analyserRef.current);
        setHasCrying(crying);
      }
    }, AUDIO_INTERVAL);

    return () => clearInterval(interval);
  }, [cameraActive, scenario]);

  // Frame capture for analysis
  useEffect(() => {
    if (!cameraActive || !canvasRef.current) return;

    const interval = setInterval(() => {
      // Only send frames when there's significant activity
      if (motionScore < motionThreshold && audioLevel < audioThreshold) {
        return;
      }

      // Capture and send frame
      if (canvasRef.current && onFrame) {
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7);
        onFrame({
          imageData,
          motionScore,
          audioLevel,
          timestamp: Date.now(),
          hasCrying,
        });
      }
    }, FRAME_INTERVAL);

    return () => clearInterval(interval);
  }, [cameraActive, motionScore, audioLevel, motionThreshold, audioThreshold, hasCrying, onFrame]);

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden">
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4 text-sm">Initializing camera...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-red-400 mt-4 text-sm font-medium">Camera Error</p>
            <p className="text-slate-500 mt-1 text-xs max-w-xs">{error}</p>
            <button
              onClick={initCamera}
              className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Status indicators */}
      {cameraActive && !error && (
        <>
          {/* Recording indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white">LIVE</span>
          </div>

          {/* Motion indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <MotionIndicator score={motionScore} threshold={motionThreshold} />
            <AudioIndicator level={audioLevel} threshold={audioThreshold} hasCrying={hasCrying} />
          </div>

          {/* Debug overlay */}
          {showDebug && (
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-900/80 rounded-lg backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Motion:</span>
                  <span className="text-white ml-2">{motionScore}%</span>
                </div>
                <div>
                  <span className="text-slate-500">Audio:</span>
                  <span className="text-white ml-2">{audioLevel}%</span>
                </div>
                <div>
                  <span className="text-slate-500">Threshold:</span>
                  <span className="text-white ml-2">{motionThreshold}%</span>
                </div>
                {scenario === 'baby' && (
                  <div className="col-span-3">
                    <span className="text-slate-500">Cry Detection:</span>
                    <span className={`ml-2 ${hasCrying ? 'text-red-400' : 'text-slate-300'}`}>
                      {hasCrying ? 'DETECTED' : 'None'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface MotionIndicatorProps {
  score: number;
  threshold: number;
}

function MotionIndicator({ score, threshold }: MotionIndicatorProps) {
  const isActive = score >= threshold;
  const color = isActive
    ? 'bg-orange-500/80'
    : score > threshold / 2
      ? 'bg-yellow-500/80'
      : 'bg-slate-700/80';

  return (
    <div className={`px-3 py-1.5 ${color} rounded-full backdrop-blur-sm flex items-center gap-2`}>
      <span className="text-lg">👁️</span>
      <div className="w-16 h-1.5 bg-slate-600 rounded-full overflow-hidden">
        <div
          className={`h-full ${isActive ? 'bg-orange-400' : 'bg-emerald-400'} transition-all duration-200`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface AudioIndicatorProps {
  level: number;
  threshold: number;
  hasCrying: boolean;
}

function AudioIndicator({ level, threshold, hasCrying }: AudioIndicatorProps) {
  const isActive = level >= threshold || hasCrying;
  const color = hasCrying
    ? 'bg-red-500/80 animate-pulse'
    : isActive
      ? 'bg-orange-500/80'
      : 'bg-slate-700/80';

  return (
    <div className={`px-3 py-1.5 ${color} rounded-full backdrop-blur-sm flex items-center gap-2`}>
      <span className="text-lg">{hasCrying ? '😢' : '🔊'}</span>
      <div className="w-12 h-1.5 bg-slate-600 rounded-full overflow-hidden">
        <div
          className={`h-full ${hasCrying ? 'bg-red-400' : isActive ? 'bg-orange-400' : 'bg-emerald-400'} transition-all duration-100`}
          style={{ width: `${Math.min(level, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default CameraFeed;
