/**
 * Root Layout
 *
 * Root layout for the SafeOS Guardian UI.
 *
 * @module app/layout
 */

import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

// =============================================================================
// Fonts
// =============================================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

// =============================================================================
// Metadata
// =============================================================================

export const metadata: Metadata = {
  title: 'SafeOS Guardian - Humanitarian AI Monitoring',
  description:
    'Free AI-powered monitoring service for pets, babies, and elderly care. Part of SuperCloud\'s 10% for Humanity initiative.',
  keywords: [
    'baby monitor',
    'pet monitor',
    'elderly care',
    'AI monitoring',
    'free monitoring',
    'humanitarian',
  ],
  authors: [{ name: 'SuperCloud' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// =============================================================================
// Layout
// =============================================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-900 font-sans antialiased">
        {/* Skip to main content */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-emerald-500 focus:text-white"
        >
          Skip to main content
        </a>

        {/* Main content */}
        <main id="main">{children}</main>

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(e) {
                    console.log('ServiceWorker registration failed: ', e);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
