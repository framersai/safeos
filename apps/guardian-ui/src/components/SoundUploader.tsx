/**
 * Sound Uploader Component
 *
 * Upload audio files or record from microphone to create custom alert sounds.
 * Supports volume, looping, repeat controls, and trigger configuration.
 *
 * USE CASES:
 * - Record a voice message to call your pet home when detected
 * - Upload a custom alarm for person detection
 * - Create specific sounds for different alert types
 * - Record messages for Lost & Found matches
 *
 * @module components/SoundUploader
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  createSoundFromFile,
  createSoundFromRecording,
  TRIGGER_DESCRIPTIONS,
  DEFAULT_CUSTOM_SOUND,
  type CustomSound,
  type SoundTrigger,
} from '../lib/custom-sounds-db';

// =============================================================================
// Types
// =============================================================================

interface SoundUploaderProps {
  /** Callback when sound is successfully created */
  onSoundCreated?: (sound: CustomSound) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Pre-selected triggers */
  defaultTriggers?: SoundTrigger[];
  /** Custom class name */
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  mediaRecorder: MediaRecorder | null;
  chunks: Blob[];
  stream: MediaStream | null;
}

// =============================================================================
// Trigger Icon Helper (converts data emoji to accessible SVG)
// =============================================================================

const getTriggerIcon = (trigger: SoundTrigger): React.ReactNode => {
  const icons: Record<SoundTrigger, React.ReactNode> = {
    person_detected: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    pet_detected: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <ellipse cx="4.5" cy="9" rx="2.5" ry="3" />
        <ellipse cx="19.5" cy="9" rx="2.5" ry="3" />
        <ellipse cx="8" cy="5" rx="2" ry="2.5" />
        <ellipse cx="16" cy="5" rx="2" ry="2.5" />
        <path d="M12 14c-3 0-5.5 2.5-5.5 5.5 0 1.5 1.5 2.5 3 2.5h5c1.5 0 3-1 3-2.5 0-3-2.5-5.5-5.5-5.5z" />
      </svg>
    ),
    motion_detected: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    video_activity: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="4" width="14" height="12" rx="2" />
        <path d="m22 8-4 3 4 3V8z" />
      </svg>
    ),
    sound_detected: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
    idle_timeout: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    emergency: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        <line x1="12" y1="2" x2="12" y2="4" />
      </svg>
    ),
    system_event: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    object_found: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
    audio_detected: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
    inactivity_alert: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    custom: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M3 12h18" />
      </svg>
    ),
  };
  return icons[trigger] || null;
};

// =============================================================================
// Component
// =============================================================================

export function SoundUploader({
  onSoundCreated,
  onError,
  defaultTriggers = [],
  className = '',
}: SoundUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'record'>('upload');
  const [step, setStep] = useState<'source' | 'configure'>('source');

  // Recording state
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    mediaRecorder: null,
    chunks: [],
    stream: null,
  });
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio preview
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Configuration
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [volume, setVolume] = useState(80);
  const [loop, setLoop] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);
  const [repeatDelayMs, setRepeatDelayMs] = useState(1000);
  const [triggers, setTriggers] = useState<SoundTrigger[]>(defaultTriggers);
  const [priority, setPriority] = useState(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recording.stream) {
        recording.stream.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // File Upload
  // ==========================================================================

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'File too large. Maximum size is 10MB.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Create preview URL
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioBlob(file);
    setName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    setStep('configure');
  }, [audioUrl, onError]);

  // ==========================================================================
  // Microphone Recording
  // ==========================================================================

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        setStep('configure');

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Start duration timer
      const startTime = Date.now();
      recordingTimerRef.current = setInterval(() => {
        setRecording(prev => ({
          ...prev,
          duration: (Date.now() - startTime) / 1000,
        }));
      }, 100);

      setRecording({
        isRecording: true,
        isPaused: false,
        duration: 0,
        mediaRecorder,
        chunks,
        stream,
      });
    } catch (err) {
      const errorMsg = 'Microphone access denied. Please allow microphone access to record.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [audioUrl, onError]);

  const stopRecording = useCallback(() => {
    if (recording.mediaRecorder && recording.mediaRecorder.state !== 'inactive') {
      recording.mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecording(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
    }));
    setName(`Recording ${new Date().toLocaleDateString()}`);
  }, [recording.mediaRecorder]);

  const pauseRecording = useCallback(() => {
    if (recording.mediaRecorder && recording.mediaRecorder.state === 'recording') {
      recording.mediaRecorder.pause();
      setRecording(prev => ({ ...prev, isPaused: true }));
    }
  }, [recording.mediaRecorder]);

  const resumeRecording = useCallback(() => {
    if (recording.mediaRecorder && recording.mediaRecorder.state === 'paused') {
      recording.mediaRecorder.resume();
      setRecording(prev => ({ ...prev, isPaused: false }));
    }
  }, [recording.mediaRecorder]);

  // ==========================================================================
  // Audio Preview
  // ==========================================================================

  const togglePreview = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl || undefined);
      audioRef.current.volume = volume / 100;
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, volume, isPlaying]);

  // Update preview volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // ==========================================================================
  // Trigger Selection
  // ==========================================================================

  const toggleTrigger = useCallback((trigger: SoundTrigger) => {
    setTriggers(prev =>
      prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  }, []);

  // ==========================================================================
  // Save Sound
  // ==========================================================================

  const handleSave = useCallback(async () => {
    if (!audioBlob || !name.trim()) {
      setError('Please provide a name for your sound.');
      return;
    }

    if (triggers.length === 0) {
      setError('Please select at least one trigger for this sound.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const options = {
        description,
        volume,
        loop,
        repeatCount,
        repeatDelayMs,
        triggers,
        priority,
        enabled: true,
      };

      let sound: CustomSound;

      if (mode === 'upload') {
        sound = await createSoundFromFile(audioBlob as File, name.trim(), options);
      } else {
        sound = await createSoundFromRecording(audioBlob, name.trim(), options);
      }

      onSoundCreated?.(sound);

      // Reset form
      setStep('source');
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setName('');
      setDescription('');
      setVolume(80);
      setLoop(false);
      setRepeatCount(0);
      setRepeatDelayMs(1000);
      setTriggers(defaultTriggers);
      setPriority(5);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save sound';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [audioBlob, name, description, volume, loop, repeatCount, repeatDelayMs, triggers, priority, mode, audioUrl, defaultTriggers, onSoundCreated, onError]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          Custom Sound
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          {step === 'source'
            ? 'Upload an audio file or record from your microphone'
            : 'Configure playback settings and triggers'}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {step === 'source' && (
          <>
            {/* Mode Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode('upload')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'upload'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Upload File
              </button>
              <button
                onClick={() => setMode('record')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'record'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Record
              </button>
            </div>

            {mode === 'upload' ? (
              /* File Upload */
              <div className="space-y-3">
                <div className="text-xs text-slate-500 p-3 bg-slate-900/50 rounded-lg">
                  <p className="font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M9 18h6M10 22h4M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Tips:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Supported formats: MP3, WAV, OGG, WebM, M4A</li>
                    <li>Maximum file size: 10MB</li>
                    <li>Short sounds (5-30 seconds) work best for alerts</li>
                  </ul>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-slate-600 rounded-lg
                             text-slate-400 hover:text-white hover:border-blue-500/50
                             transition-colors flex flex-col items-center gap-2"
                  aria-label="Click to select audio file or drag and drop"
                >
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Click to select audio file</span>
                  <span className="text-xs text-slate-500">or drag and drop</span>
                </button>
              </div>
            ) : (
              /* Microphone Recording */
              <div className="space-y-3">
                <div className="text-xs text-slate-500 p-3 bg-slate-900/50 rounded-lg">
                  <p className="font-medium text-slate-400 mb-1 flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M9 18h6M10 22h4M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Recording Tips:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Record a voice message to call your pet home</li>
                    <li>Create custom verbal alerts for specific situations</li>
                    <li>Speak clearly and at a consistent volume</li>
                    <li>Keep recordings short (5-60 seconds) for best results</li>
                  </ul>
                </div>

                <div className="flex flex-col items-center gap-4 py-6">
                  {/* Recording indicator */}
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                      recording.isRecording
                        ? recording.isPaused
                          ? 'bg-yellow-500/20 border-2 border-yellow-500/50'
                          : 'bg-red-500/20 border-2 border-red-500/50 animate-pulse'
                        : 'bg-slate-700/50 border-2 border-slate-600'
                    }`}
                    role="status"
                    aria-label={recording.isRecording ? (recording.isPaused ? 'Recording paused' : 'Recording in progress') : 'Ready to record'}
                  >
                    {recording.isRecording ? (
                      recording.isPaused ? (
                        <svg className="w-8 h-8 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                      )
                    ) : (
                      <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="text-2xl font-mono text-white">
                    {formatDuration(recording.duration)}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    {!recording.isRecording ? (
                      <button
                        onClick={startRecording}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg
                                   font-medium transition-colors flex items-center gap-2"
                        aria-label="Start Recording"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                        Start Recording
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={recording.isPaused ? resumeRecording : pauseRecording}
                          className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg
                                     font-medium transition-colors flex items-center gap-1"
                          aria-label={recording.isPaused ? 'Resume recording' : 'Pause recording'}
                        >
                          {recording.isPaused ? (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                              Resume
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                              Pause
                            </>
                          )}
                        </button>
                        <button
                          onClick={stopRecording}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg
                                     font-medium transition-colors flex items-center gap-1"
                          aria-label="Stop recording"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                          </svg>
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === 'configure' && (
          <>
            {/* Preview */}
            <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
              <button
                onClick={togglePreview}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isPlaying
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
                aria-label={isPlaying ? 'Stop preview' : 'Play preview'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">
                  {mode === 'upload' ? 'Uploaded file' : 'Recording'}
                </div>
                <div className="text-xs text-slate-500">
                  Click to preview at current volume ({volume}%)
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Sound Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Call Buddy Home"
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg
                           text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this sound for?"
                rows={2}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg
                           text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Volume */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-slate-400">Volume</label>
                <span className="text-emerald-400 font-mono">{volume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Loop & Repeat */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loop}
                    onChange={(e) => {
                      setLoop(e.target.checked);
                      if (e.target.checked) setRepeatCount(0);
                    }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500
                               focus:ring-emerald-500 focus:ring-offset-slate-800"
                  />
                  <span className="text-sm text-slate-400">Loop continuously</span>
                </label>
              </div>

              {!loop && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Repeat</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded-lg
                                 text-white text-center focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">times</span>
                  </div>
                </div>
              )}
            </div>

            {repeatCount > 0 && !loop && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Delay between repeats</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    step={100}
                    value={repeatDelayMs}
                    onChange={(e) => setRepeatDelayMs(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded-lg
                               text-white text-center focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">ms</span>
                </div>
              </div>
            )}

            {/* Priority */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-slate-400">Priority</label>
                <span className="text-blue-400 font-mono">{priority}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Higher priority sounds will interrupt lower priority ones
              </p>
            </div>

            {/* Triggers */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                When should this sound play? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TRIGGER_DESCRIPTIONS) as [SoundTrigger, typeof TRIGGER_DESCRIPTIONS[SoundTrigger]][]).map(
                  ([trigger, info]) => (
                    <button
                      key={trigger}
                      onClick={() => toggleTrigger(trigger)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        triggers.includes(trigger)
                          ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-900/50 border border-slate-600 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex-shrink-0">{getTriggerIcon(trigger)}</span>
                        <span className="text-sm font-medium">{info.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{info.description}</p>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-700/50">
              <button
                onClick={() => {
                  setStep('source');
                  if (audioUrl) URL.revokeObjectURL(audioUrl);
                  setAudioUrl(null);
                  setAudioBlob(null);
                }}
                className="flex-1 py-2 bg-slate-700/50 text-slate-300 rounded-lg
                           font-medium hover:bg-slate-700 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting || !name.trim() || triggers.length === 0}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-lg
                           font-medium hover:bg-emerald-600 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {isSubmitting ? 'Saving...' : 'Save Sound'}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export default SoundUploader;
