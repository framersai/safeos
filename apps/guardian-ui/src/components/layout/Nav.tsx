/**
 * Navigation Component
 *
 * Industrial, utilitarian top navigation bar.
 * Consistent across all pages.
 *
 * @module components/layout/Nav
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';
import {
  IconHome,
  IconCamera,
  IconHistory,
  IconSettings,
  IconBell,
  IconMenu,
  IconX,
  IconHelp,
  IconExternalLink,
} from '../icons';

// =============================================================================
// Types
// =============================================================================

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// =============================================================================
// Navigation Links
// =============================================================================

const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: IconHome },
  { href: '/monitor', label: 'Monitor', icon: IconCamera },
  { href: '/history', label: 'History', icon: IconHistory },
  { href: '/settings', label: 'Settings', icon: IconSettings },
];

// =============================================================================
// Component
// =============================================================================

export function Nav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null during SSR to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(10,12,15,0.95)] backdrop-blur-xl border-b border-emerald-500/15">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Logo size="sm" showSuperCloud={false} />
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links-desktop">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || 
              (link.href !== '/' && pathname?.startsWith(link.href));
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                  transition-all duration-150 font-[family-name:var(--font-space-grotesk)]
                  ${isActive 
                    ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15' 
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                  }
                `}
              >
                <Icon size={18} className="opacity-80" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* SuperCloud CTA - Desktop */}
          <a
            href="https://frame.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors group"
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 text-emerald-500 group-hover:text-emerald-400 transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
              <path strokeLinecap="round" d="M12 19v-7m0 0l-2 2m2-2l2 2" />
            </svg>
            <span className="font-[family-name:var(--font-space-grotesk)] text-xs tracking-wide">
              <span className="text-zinc-500">Superintelligence for All</span>
              <span className="text-emerald-500 font-medium ml-1.5">frame.dev</span>
            </span>
            <IconExternalLink size={12} className="opacity-40 group-hover:opacity-70 transition-opacity" />
          </a>

          <div className="hidden lg:block w-px h-6 bg-white/10 mx-1" />

          <button 
            className="relative flex items-center justify-center w-10 h-10 rounded-lg
                       text-zinc-400 hover:text-zinc-100 hover:bg-white/5 
                       border border-transparent hover:border-white/10 transition-all"
            aria-label="Notifications"
          >
            <IconBell size={20} />
            <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full
                           bg-red-500 text-white text-[10px] font-semibold
                           flex items-center justify-center">
              3
            </span>
          </button>
          <button 
            className="flex items-center justify-center w-10 h-10 rounded-lg
                       text-zinc-400 hover:text-zinc-100 hover:bg-white/5 
                       border border-transparent hover:border-white/10 transition-all"
            aria-label="Help"
          >
            <IconHelp size={20} />
          </button>
          
          {/* Mobile Menu Toggle */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IconX size={24} /> : <IconMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== '/' && pathname?.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium
                  transition-all duration-150
                  ${isActive 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                  }
                `}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} className="opacity-80" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* SuperCloud CTA - Mobile */}
          <div className="border-t border-white/5 mt-3 pt-3">
            <a
              href="https://frame.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-5 h-5 text-emerald-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                <path strokeLinecap="round" d="M12 19v-7m0 0l-2 2m2-2l2 2" />
              </svg>
              <span className="flex flex-col">
                <span className="text-xs text-zinc-500">Superintelligence for All</span>
                <span className="text-sm font-medium text-emerald-500">frame.dev</span>
              </span>
              <IconExternalLink size={14} className="ml-auto opacity-40" />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
