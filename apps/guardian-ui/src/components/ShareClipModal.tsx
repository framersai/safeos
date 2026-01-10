/**
 * Share Clip Modal
 *
 * Modal for sharing detection clips via various methods.
 * Supports Web Share API, clipboard, download, and email.
 *
 * @module components/ShareClipModal
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  IconX,
  IconCheck,
  IconDownload,
  IconExternalLink,
} from './icons';
import {
  type ShareableClip,
  type ShareMethod,
  shareClip,
  copyToClipboard,
  downloadClip,
  generateShareLink,
  createEmailShareLink,
  isWebShareSupported,
  exportClipsToFile,
} from '../lib/share-utils';

// =============================================================================
// Types
// =============================================================================

interface ShareClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: ShareableClip | null;
  clips?: ShareableClip[]; // For bulk export
}

interface ShareOptionConfig {
  id: ShareMethod | 'export';
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ShareClipModal({ isOpen, onClose, clip, clips }: ShareClipModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setMessage('');
      setCopiedLink(false);
      setShowExportOptions(false);
    }
  }, [isOpen]);

  if (!isOpen || !clip) return null;

  const shareLink = generateShareLink(clip.id);

  const shareOptions: ShareOptionConfig[] = [
    {
      id: 'native',
      label: 'Share',
      description: 'Share via apps on your device',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      available: isWebShareSupported(),
    },
    {
      id: 'clipboard',
      label: 'Copy Link',
      description: 'Copy shareable link to clipboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      ),
      available: true,
    },
    {
      id: 'download',
      label: 'Download',
      description: 'Save clip to your device',
      icon: <IconDownload size={20} />,
      available: !!(clip.imageUrl || clip.videoUrl),
    },
    {
      id: 'email',
      label: 'Email',
      description: 'Share via email',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      available: true,
    },
    {
      id: 'export',
      label: 'Export',
      description: 'Export as JSON or CSV',
      icon: <IconExternalLink size={20} />,
      available: true,
    },
  ];

  const handleShare = async (method: ShareMethod | 'export') => {
    if (method === 'export') {
      setShowExportOptions(true);
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      if (method === 'clipboard') {
        const success = await copyToClipboard(shareLink);
        if (success) {
          setCopiedLink(true);
          setStatus('success');
          setMessage('Link copied to clipboard');
          setTimeout(() => setCopiedLink(false), 3000);
        } else {
          throw new Error('Failed to copy');
        }
        return;
      }

      if (method === 'download') {
        setMessage('Downloading...');
        const success = await downloadClip(clip, clip.videoUrl ? 'video' : 'image');
        if (success) {
          setStatus('success');
          setMessage('Downloaded successfully');
        } else {
          throw new Error('Download failed');
        }
        return;
      }

      if (method === 'email') {
        window.location.href = createEmailShareLink(clip);
        setStatus('success');
        setMessage('Opening email client...');
        return;
      }

      // Native share
      const result = await shareClip(clip, method);
      if (result.success) {
        setStatus('success');
        setMessage('Shared successfully');
      } else {
        throw new Error('Share cancelled');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Share failed');
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    const clipsToExport = clips || [clip];
    exportClipsToFile(clipsToExport, {
      format,
      includeMetadata: true,
      includeImage: false,
    });
    setStatus('success');
    setMessage(`Exported as ${format.toUpperCase()}`);
    setShowExportOptions(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Share Clip</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Clip Preview */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex gap-4">
            {clip.imageUrl && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                <img
                  src={clip.imageUrl}
                  alt={clip.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{clip.title}</h3>
              <p className="text-sm text-slate-400 mt-1">
                {clip.timestamp.toLocaleString()}
              </p>
              {clip.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {clip.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Share Options or Export Options */}
        <div className="p-4">
          {showExportOptions ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-400 mb-4">Choose export format:</p>
              <button
                onClick={() => handleExport('json')}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors"
              >
                <div className="font-medium text-white">JSON</div>
                <div className="text-sm text-slate-400">Full data with metadata</div>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors"
              >
                <div className="font-medium text-white">CSV</div>
                <div className="text-sm text-slate-400">Spreadsheet compatible</div>
              </button>
              <button
                onClick={() => setShowExportOptions(false)}
                className="w-full p-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Back to share options
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shareOptions
                .filter((opt) => opt.available)
                .map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleShare(option.id as ShareMethod | 'export')}
                    disabled={status === 'loading'}
                    className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-center mb-2 text-slate-400">
                      {option.id === 'clipboard' && copiedLink ? (
                        <IconCheck size={20} className="text-green-400" />
                      ) : (
                        option.icon
                      )}
                    </div>
                    <div className="text-sm font-medium text-white">{option.label}</div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Link Input */}
        {!showExportOptions && (
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono"
              />
              <button
                onClick={() => handleShare('clipboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copiedLink
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`mx-4 mb-4 p-3 rounded-lg text-sm ${
            status === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : status === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareClipModal;
