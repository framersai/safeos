/**
 * Mobile Bottom Navigation Component
 *
 * Fixed bottom navigation bar for mobile devices.
 * Hidden on desktop (md+ screens).
 * Meets 44px minimum touch target requirements.
 *
 * @module components/layout/MobileBottomNav
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconHome,
  IconCamera,
  IconHistory,
  IconSettings,
} from '../icons';

// =============================================================================
// Types
// =============================================================================

interface NavItem {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

// =============================================================================
// Navigation Items
// =============================================================================

const navItems: NavItem[] = [
  { href: '/dashboard', icon: IconHome, label: 'Home' },
  { href: '/monitor', icon: IconCamera, label: 'Monitor' },
  { href: '/history', icon: IconHistory, label: 'History' },
  { href: '/settings', icon: IconSettings, label: 'Settings' },
];

// =============================================================================
// MobileBottomNav Component
// =============================================================================

export function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Don't show on landing page or setup flow
  if (pathname === '/' || pathname?.startsWith('/setup')) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50
                 safe-area-bottom"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1
                         min-w-[64px] min-h-[56px] py-2 px-3
                         transition-colors ${
                           isActive
                             ? 'text-emerald-500'
                             : 'text-slate-400 hover:text-white active:text-emerald-400'
                         }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={24} className={isActive ? 'text-emerald-500' : ''} />
              <span className={`text-xs font-medium ${isActive ? 'text-emerald-500' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
