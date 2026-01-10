/**
 * Theme Provider
 *
 * Provides theme context and applies theme/accessibility settings to the app.
 * Must be placed inside Providers but before any themed content.
 *
 * @module components/ThemeProvider
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '../lib/theme-manager';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Use the theme hook to apply theme classes
  useTheme();

  // Prevent flash of wrong theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render children immediately but with opacity transition
  // This prevents layout shift while avoiding theme flash
  return (
    <div
      className={`transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}

export default ThemeProvider;
