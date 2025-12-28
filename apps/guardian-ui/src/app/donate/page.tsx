'use client';

/**
 * Donate Page
 * 
 * Stylized placeholder for future donation functionality.
 * Features animated SVG heart/shield and coming soon messaging.
 * 
 * @module app/donate/page
 */

import { useState } from 'react';
import Link from 'next/link';
import { IconChevronLeft } from '../../components/icons';

// =============================================================================
// Animated SVG Components
// =============================================================================

function AnimatedHeartShield() {
  return (
    <div className="relative w-48 h-48">
      {/* Outer glow rings */}
      <div className="absolute inset-0 animate-ping-slow">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="2"
            opacity="0.3"
          />
          <defs>
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Secondary ring */}
      <div className="absolute inset-4 animate-pulse-subtle">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="1"
            strokeDasharray="10 5"
            opacity="0.5"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="20s"
              repeatCount="indefinite"
            />
          </circle>
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Main shield with heart */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981">
              <animate
                attributeName="stop-color"
                values="#10b981;#3b82f6;#ec4899;#10b981"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#3b82f6">
              <animate
                attributeName="stop-color"
                values="#3b82f6;#ec4899;#10b981;#3b82f6"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#ec4899">
              <animate
                attributeName="stop-color"
                values="#ec4899;#10b981;#3b82f6;#ec4899"
                dur="6s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
          
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Shield shape */}
        <path
          d="M100 20
             C100 20 160 30 170 40
             C180 50 180 80 175 110
             C170 140 145 170 100 190
             C55 170 30 140 25 110
             C20 80 20 50 30 40
             C40 30 100 20 100 20Z"
          fill="url(#shieldGradient)"
          opacity="0.15"
          stroke="url(#shieldGradient)"
          strokeWidth="2"
          filter="url(#glow)"
        >
          <animate
            attributeName="d"
            values="
              M100 20 C100 20 160 30 170 40 C180 50 180 80 175 110 C170 140 145 170 100 190 C55 170 30 140 25 110 C20 80 20 50 30 40 C40 30 100 20 100 20Z;
              M100 18 C100 18 162 32 172 42 C182 52 182 82 177 112 C172 142 147 172 100 192 C53 172 28 142 23 112 C18 82 18 52 28 42 C38 32 100 18 100 18Z;
              M100 20 C100 20 160 30 170 40 C180 50 180 80 175 110 C170 140 145 170 100 190 C55 170 30 140 25 110 C20 80 20 50 30 40 C40 30 100 20 100 20Z"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
        
        {/* Heart shape inside shield */}
        <g transform="translate(100, 100)" filter="url(#glow)">
          <path
            d="M0 -25
               C-12 -45 -40 -40 -40 -15
               C-40 15 0 45 0 45
               C0 45 40 15 40 -15
               C40 -40 12 -45 0 -25Z"
            fill="url(#heartGradient)"
            opacity="0.9"
          >
            <animate
              attributeName="transform"
              type="scale"
              values="1;1.1;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </path>
        </g>
        
        {/* Sparkles */}
        <g opacity="0.8">
          <circle cx="50" cy="60" r="2" fill="#10b981">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0s" repeatCount="indefinite"/>
          </circle>
          <circle cx="150" cy="70" r="2" fill="#3b82f6">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="70" cy="150" r="2" fill="#ec4899">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite"/>
          </circle>
          <circle cx="130" cy="145" r="2" fill="#10b981">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>
      </svg>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function DonatePage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // In production, this would send to an API
      console.log('Subscribed:', email);
      setSubscribed(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Custom styles for animations */}
      <style jsx global>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-ping-slow {
          animation: ping-slow 4s ease-in-out infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-400 hover:text-white"
              >
                <IconChevronLeft size={20} />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💝</span>
                <h1 className="text-xl font-bold text-white">Support SafeOS</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <AnimatedHeartShield />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            Coming Soon
          </h2>
          
          <p className="text-lg text-slate-400 mb-2">
            We&apos;re working on donation options to support
          </p>
          <p className="text-lg text-slate-400">
            SafeOS Guardian&apos;s humanitarian mission.
          </p>
        </div>

        {/* Promise */}
        <div className="mb-12 p-6 bg-gradient-to-br from-emerald-500/10 to-pink-500/10 border border-emerald-500/30 rounded-2xl text-center">
          <p className="text-white font-medium mb-2">
            Our Promise
          </p>
          <p className="text-slate-300">
            10% of all donations will go directly to humanitarian organizations
            focused on child safety and missing persons recovery.
          </p>
        </div>

        {/* Features preview */}
        <div className="mb-12 space-y-4">
          <h3 className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider">
            What Your Support Will Enable
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '🚀', title: 'Faster Development', desc: 'More features, faster releases' },
              { icon: '🌍', title: 'Global Translations', desc: 'Support for more languages' },
              { icon: '🔬', title: 'Advanced AI', desc: 'Improved detection algorithms' },
              { icon: '📱', title: 'Mobile Apps', desc: 'Native iOS and Android apps' },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center"
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <h4 className="font-medium text-white mb-1">{item.title}</h4>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Email Signup */}
        <div className="mb-12 p-6 bg-slate-900 border border-slate-700 rounded-xl">
          <h3 className="text-center font-semibold text-white mb-4">
            Get Notified When Donations Open
          </h3>
          
          {subscribed ? (
            <div className="text-center">
              <span className="text-4xl mb-2 block">✉️</span>
              <p className="text-emerald-400 font-medium">Thank you!</p>
              <p className="text-sm text-slate-400">We&apos;ll notify you when donations are available.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-blue-600 transition-all"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>

        {/* Current ways to help */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
            Ways to Help Right Now
          </h3>
          <div className="space-y-3">
            <a
              href="https://github.com/super-cloud-mcps/safeos"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <span className="text-xl mr-2">⭐</span>
              <span className="text-white">Star us on GitHub</span>
            </a>
            <a
              href="https://github.com/super-cloud-mcps/safeos/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <span className="text-xl mr-2">🐛</span>
              <span className="text-white">Report bugs & request features</span>
            </a>
            <div className="block p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <span className="text-xl mr-2">📢</span>
              <span className="text-white">Share SafeOS with friends & family</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            SafeOS Guardian is and will always remain free for essential features.
            <br />
            Your support helps us go further, faster.
          </p>
        </div>

        {/* Links */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/about"
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            About Us
          </Link>
          <Link
            href="/tutorials"
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Tutorials
          </Link>
        </div>
      </main>
    </div>
  );
}






