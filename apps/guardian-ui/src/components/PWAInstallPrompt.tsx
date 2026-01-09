/**
 * PWA Install Prompt Component
 *
 * Handles "Add to Home Screen" prompts for both Android (native prompt)
 * and iOS (manual instructions).
 *
 * @module components/PWAInstallPrompt
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IconX, IconDownload, IconPlus } from './icons';

// =============================================================================
// Types
// =============================================================================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// =============================================================================
// Constants
// =============================================================================

const DISMISSED_KEY = 'safeos-pwa-prompt-dismissed';
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// =============================================================================
// Utility Functions
// =============================================================================

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (!dismissed) return false;
  
  const dismissedTime = parseInt(dismissed, 10);
  if (Date.now() - dismissedTime > DISMISSED_DURATION) {
    localStorage.removeItem(DISMISSED_KEY);
    return false;
  }
  return true;
}

function setDismissed(): void {
  localStorage.setItem(DISMISSED_KEY, Date.now().toString());
}

// =============================================================================
// Icons (iOS Share icon not in main set)
// =============================================================================

function IconShare({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PWAInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Handle beforeinstallprompt event (Android/Desktop)
  useEffect(() => {
    setMounted(true);

    // Don't show if already installed or dismissed
    if (isStandalone() || isDismissed()) return;

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Check for iOS
    if (isIOS() && !isStandalone()) {
      // Delay showing iOS prompt
      const timeout = setTimeout(() => {
        if (!isDismissed()) {
          setShowIOSInstructions(true);
          setShowPrompt(true);
        }
      }, 3000);
      return () => {
        clearTimeout(timeout);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
    }
    
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDeferredPrompt(null);
    setDismissed();
  }, []);

  // Don't render on server or if not showing
  if (!mounted || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:right-auto md:left-4 md:max-w-sm animate-slide-up">
      <div className="bg-[rgba(15,20,25,0.98)] backdrop-blur-xl border border-emerald-500/20 rounded-xl p-4 shadow-2xl shadow-black/50">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Dismiss"
        >
          <IconX size={16} />
        </button>

        {showIOSInstructions ? (
          // iOS Instructions
          <div className="pr-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <IconDownload size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Install SafeOS</h3>
                <p className="text-xs text-slate-400">Add to your home screen</p>
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">1</span>
                <span className="flex items-center gap-1">
                  Tap the <IconShare size={14} className="text-blue-400 inline" /> Share button
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">2</span>
                <span className="flex items-center gap-1">
                  Tap <IconPlus size={14} className="text-slate-400 inline" /> "Add to Home Screen"
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Android/Desktop Install Button
          <div className="pr-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <IconDownload size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Install SafeOS</h3>
                <p className="text-xs text-slate-400">Quick access from your device</p>
              </div>
            </div>
            
            <button
              onClick={handleInstall}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <IconDownload size={16} />
              Install App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PWAInstallPrompt;

