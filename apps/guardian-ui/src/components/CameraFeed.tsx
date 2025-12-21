'use client';

/**
 * Camera Feed Component
 *
 * Captures video/audio and performs client-side motion/audio detection.
 *
 * @module components/CameraFeed
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { detectMotion, MOTION_THRESHOLDS } from '../lib/motion-detection';
import { getAudioLevel, AUDIO_THRESHOLDS } from '../lib/audio-levels';
import type { MonitoringScenario } from '../stores/monitoring-store';

// =============================================================================
// Types
// =============================================================================

interface CameraFeedProps {
  onFrame?: (frame: string, motionScore: number, audioLevel: number) => void;
  onMotion?: (score: number) => void;
  onAudio?: (level: number) => void;
  onError?: (error: Error) => void;
  scenario?: MonitoringScenario;
  captureInterval?: number; // ms
  showDebug?: boolean;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function CameraFeed({
  onFrame,
  onMotion,
  onAudio,
  onError,
  scenario = 'baby',
  captureInterval = 1000,
  showDebug = false,
  className = '',
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [motionScore, setMotionScore] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // Get thresholds for scenario
  const motionThreshold = MOTION_THRESHOLDS[scenario]?.alert || 30;
  const audioThreshold = AUDIO_THRESHOLDS[scenario]?.alert || 30;

  // ---------------------------------------------------------------------------
  // Camera Setup
  // ---------------------------------------------------------------------------

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Set up audio analyzer
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setHasPermission(true);
      setIsActive(true);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setHasPermission(false);
      onError?.(error);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsActive(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Frame Capture & Analysis
  // ---------------------------------------------------------------------------

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    ctx.drawImage(video, 0, 0);

    // Get current frame data
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Calculate motion score
    let motion = 0;
    if (previousFrameRef.current) {
      motion = detectMotion(previousFrameRef.current, currentFrame);
    }
    previousFrameRef.current = currentFrame;

    setMotionScore(motion);
    onMotion?.(motion);

    // Calculate audio level
    let audio = 0;
    if (analyserRef.current) {
      audio = getAudioLevel(analyserRef.current);
    }
    setAudioLevel(audio);
    onAudio?.(audio);

    // Send frame if motion or audio above threshold
    if (motion > motionThreshold || audio > audioThreshold) {
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      onFrame?.(base64, motion, audio);
    }
  }, [motionThreshold, audioThreshold, onFrame, onMotion, onAudio]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Capture loop
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(captureFrame, captureInterval);
    return () => clearInterval(interval);
  }, [isActive, captureInterval, captureFrame]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (hasPermission === false) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-900 text-white p-8 rounded-lg ${className}`}
      >
        <svg
          className="w-16 h-16 mb-4 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-xl font-bold mb-2">Camera Access Required</h3>
        <p className="text-gray-400 text-center mb-4">
          Please allow camera and microphone access to enable monitoring.
        </p>
        <button
          onClick={startCamera}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Grant Permission
        </button>
        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 text-white ${className}`}
      >
        <div className="animate-pulse">Requesting camera access...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-lg"
      />

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Debug overlay */}
      {showDebug && (
        <div className="absolute top-2 left-2 bg-black/70 text-white p-2 rounded text-sm font-mono">
          <div
            className={`${motionScore > motionThreshold ? 'text-yellow-400' : 'text-green-400'}`}
          >
            Motion: {motionScore.toFixed(1)}%
          </div>
          <div
            className={`${audioLevel > audioThreshold ? 'text-yellow-400' : 'text-green-400'}`}
          >
            Audio: {audioLevel.toFixed(1)}%
          </div>
          <div className="text-gray-400">Scenario: {scenario}</div>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
        />
        <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
          {isActive ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Motion/Audio bars */}
      <div className="absolute bottom-2 left-2 right-2 flex gap-2">
        {/* Motion bar */}
        <div className="flex-1 bg-black/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              motionScore > motionThreshold ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, motionScore)}%` }}
          />
        </div>
        {/* Audio bar */}
        <div className="flex-1 bg-black/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              audioLevel > audioThreshold ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, audioLevel)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default CameraFeed;
