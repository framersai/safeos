/**
 * Share Utilities
 *
 * Utilities for sharing detection clips and alerts.
 * Supports Web Share API, clipboard, and download.
 *
 * @module lib/share-utils
 */

'use client';

import { create } from 'zustand';

// =============================================================================
// Types
// =============================================================================

export interface ShareableClip {
  id: string;
  timestamp: Date;
  type: 'motion' | 'audio' | 'person' | 'pet' | 'alert';
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number;
}

export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

export type ShareMethod = 'native' | 'clipboard' | 'download' | 'email';

export interface ShareState {
  isSharing: boolean;
  shareMethod: ShareMethod | null;
  error: string | null;
  lastShared: ShareableClip | null;

  // Actions
  setSharing: (isSharing: boolean) => void;
  setError: (error: string | null) => void;
  setLastShared: (clip: ShareableClip | null) => void;
}

// =============================================================================
// Store
// =============================================================================

export const useShareStore = create<ShareState>((set) => ({
  isSharing: false,
  shareMethod: null,
  error: null,
  lastShared: null,

  setSharing: (isSharing) => set({ isSharing }),
  setError: (error) => set({ error }),
  setLastShared: (clip) => set({ lastShared: clip }),
}));

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'share' in navigator;
}

/**
 * Check if sharing files is supported
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'canShare' in navigator;
}

/**
 * Generate a shareable link for a clip
 */
export function generateShareLink(clipId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/shared/${clipId}`;
}

/**
 * Format clip for sharing
 */
export function formatClipForShare(clip: ShareableClip): ShareOptions {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return {
    title: clip.title,
    text: clip.description || `Detection at ${clip.timestamp.toLocaleString()}`,
    url: `${baseUrl}/history?clip=${clip.id}`,
  };
}

/**
 * Share using the native Web Share API
 */
export async function shareNative(options: ShareOptions): Promise<boolean> {
  if (!isWebShareSupported()) {
    throw new Error('Web Share API not supported');
  }

  try {
    await navigator.share({
      title: options.title,
      text: options.text,
      url: options.url,
      files: options.files,
    });
    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled - not an error
      return false;
    }
    throw error;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download clip as image or video
 */
export async function downloadClip(
  clip: ShareableClip,
  format: 'image' | 'video' = 'image'
): Promise<boolean> {
  try {
    const url = format === 'video' ? clip.videoUrl : clip.imageUrl;
    if (!url) {
      throw new Error(`No ${format} URL available`);
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');

    const blob = await response.blob();
    const ext = format === 'video' ? 'mp4' : 'jpg';
    const filename = `safeos-clip-${clip.id}-${Date.now()}.${ext}`;

    downloadBlob(blob, filename);
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
}

/**
 * Create email share link
 */
export function createEmailShareLink(clip: ShareableClip): string {
  const subject = encodeURIComponent(`SafeOS Guardian - ${clip.title}`);
  const body = encodeURIComponent(
    `${clip.description || 'Detection alert'}\n\n` +
    `Time: ${clip.timestamp.toLocaleString()}\n` +
    `View: ${generateShareLink(clip.id)}`
  );

  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Share a clip using the best available method
 */
export async function shareClip(
  clip: ShareableClip,
  preferredMethod?: ShareMethod
): Promise<{ success: boolean; method: ShareMethod }> {
  const store = useShareStore.getState();
  store.setSharing(true);
  store.setError(null);

  try {
    // Try native share if preferred or as default on mobile
    if (preferredMethod === 'native' || (!preferredMethod && isWebShareSupported())) {
      const options = formatClipForShare(clip);
      const success = await shareNative(options);
      if (success) {
        store.setLastShared(clip);
        return { success: true, method: 'native' };
      }
    }

    // Clipboard fallback
    if (preferredMethod === 'clipboard' || !preferredMethod) {
      const shareText = `${clip.title}\n${clip.description || ''}\n${generateShareLink(clip.id)}`;
      const success = await copyToClipboard(shareText);
      if (success) {
        store.setLastShared(clip);
        return { success: true, method: 'clipboard' };
      }
    }

    // Download fallback
    if (preferredMethod === 'download') {
      const success = await downloadClip(clip, clip.videoUrl ? 'video' : 'image');
      if (success) {
        store.setLastShared(clip);
        return { success: true, method: 'download' };
      }
    }

    // Email fallback
    if (preferredMethod === 'email') {
      const emailLink = createEmailShareLink(clip);
      window.location.href = emailLink;
      store.setLastShared(clip);
      return { success: true, method: 'email' };
    }

    throw new Error('No sharing method available');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Share failed';
    store.setError(message);
    return { success: false, method: preferredMethod || 'native' };
  } finally {
    store.setSharing(false);
  }
}

// =============================================================================
// Export Report Generation
// =============================================================================

export interface ClipExportOptions {
  format: 'pdf' | 'json' | 'csv';
  includeMetadata: boolean;
  includeImage: boolean;
  dateRange?: { start: Date; end: Date };
}

export function generateClipReport(
  clips: ShareableClip[],
  options: ClipExportOptions
): string {
  if (options.format === 'json') {
    const exportData = clips.map((clip) => ({
      id: clip.id,
      timestamp: clip.timestamp.toISOString(),
      type: clip.type,
      title: clip.title,
      description: clip.description,
      duration: clip.duration,
      ...(options.includeImage && { imageUrl: clip.imageUrl }),
    }));

    return JSON.stringify(exportData, null, 2);
  }

  if (options.format === 'csv') {
    const headers = ['ID', 'Timestamp', 'Type', 'Title', 'Description', 'Duration'];
    const rows = clips.map((clip) => [
      clip.id,
      clip.timestamp.toISOString(),
      clip.type,
      `"${clip.title.replace(/"/g, '""')}"`,
      `"${(clip.description || '').replace(/"/g, '""')}"`,
      clip.duration?.toString() || '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // PDF would require a library - return placeholder
  return 'PDF export requires additional setup';
}

/**
 * Export clips to file
 */
export function exportClipsToFile(
  clips: ShareableClip[],
  options: ClipExportOptions
): void {
  const content = generateClipReport(clips, options);
  const mimeType =
    options.format === 'json'
      ? 'application/json'
      : options.format === 'csv'
        ? 'text/csv'
        : 'text/plain';

  const blob = new Blob([content], { type: mimeType });
  const filename = `safeos-clips-${new Date().toISOString().split('T')[0]}.${options.format}`;

  downloadBlob(blob, filename);
}
