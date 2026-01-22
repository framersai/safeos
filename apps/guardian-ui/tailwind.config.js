/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        safeos: {
          primary: '#10B981', // emerald-500
          secondary: '#06B6D4', // cyan-500
          dark: '#0F172A', // slate-900
          muted: '#64748B', // slate-500
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      // Accessibility: Focus ring utilities for keyboard navigation
      ringWidth: {
        DEFAULT: '2px',
      },
      ringColor: {
        DEFAULT: '#10B981', // safeos-primary (emerald-500)
      },
      ringOffsetWidth: {
        DEFAULT: '2px',
      },
      ringOffsetColor: {
        DEFAULT: '#0F172A', // safeos-dark (slate-900)
      },
    },
  },
  plugins: [
    // Accessibility: Add focus-visible utilities for keyboard-only focus
    function({ addUtilities }) {
      addUtilities({
        '.focus-ring': {
          '@apply focus:outline-none focus-visible:ring-2 focus-visible:ring-safeos-primary focus-visible:ring-offset-2 focus-visible:ring-offset-safeos-dark': {},
        },
        '.focus-ring-inset': {
          '@apply focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-safeos-primary': {},
        },
        // Minimum touch target size (44x44px per WCAG)
        '.touch-target': {
          '@apply min-w-[44px] min-h-[44px]': {},
        },
      });
    },
  ],
};
