/**
 * SafeOS Guardian - Home Page
 *
 * Landing page with big CTA for setup, or dashboard if onboarding complete.
 * Emphasizes supplemental/experimental nature and abuse prevention.
 *
 * @module app/page
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOnboardingStore, canSkipOnboarding } from '../stores/onboarding-store';
import {
  IconShield,
  IconCamera,
  IconBell,
  IconHeart,
  IconArrowRight,
  IconWarning,
  IconInfo,
} from '../components/icons';
import { UseCaseShowcase } from '../components/UseCaseShowcase';

// =============================================================================
// Animated Shield SVG Component
// =============================================================================

function AnimatedShield() {
  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32">
      {/* Outer pulse ring */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(16,185,129,0.2)"
          strokeWidth="1"
          className="animate-[ping_3s_ease-in-out_infinite]"
        />
      </svg>
      
      {/* Secondary pulse */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(16,185,129,0.15)"
          strokeWidth="1"
          className="animate-[ping_3s_ease-in-out_infinite_500ms]"
        />
      </svg>

      {/* Shield body */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        fill="none"
      >
        {/* Shield outline */}
        <path
          d="M50 10 L85 25 L85 50 C85 72 68 88 50 95 C32 88 15 72 15 50 L15 25 Z"
          fill="rgba(16,185,129,0.08)"
          stroke="rgba(16,185,129,0.6)"
          strokeWidth="1.5"
          className="animate-[pulse_4s_ease-in-out_infinite]"
        />
        
        {/* Inner circle - camera eye */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="none"
          stroke="rgba(16,185,129,0.8)"
          strokeWidth="2"
        />
        
        {/* Pupil with subtle animation */}
        <circle
          cx="50"
          cy="50"
          r="6"
          fill="rgba(16,185,129,1)"
          className="animate-[pulse_2s_ease-in-out_infinite]"
        />
        
        {/* Scan line animation */}
        <line
          x1="35"
          y1="50"
          x2="65"
          y2="50"
          stroke="rgba(16,185,129,0.4)"
          strokeWidth="1"
          strokeDasharray="4 2"
          className="animate-[pulse_1.5s_ease-in-out_infinite]"
        />
      </svg>
    </div>
  );
}

// =============================================================================
// Landing Page Component
// =============================================================================

function LandingPage() {
  const onboardingState = useOnboardingStore();
  const isSetupComplete = canSkipOnboarding(onboardingState);

  return (
    <div className="bg-[var(--color-steel-950)]">
      {/* Hero Section */}
      <main className="flex flex-col items-center px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated Shield */}
          <div className="flex justify-center mb-6">
            <AnimatedShield />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-steel-100)] mb-2
                         font-[family-name:var(--font-space-grotesk)]">
            SafeOS Guardian
          </h1>
          
          <p className="text-sm text-emerald-500/80 mb-6 tracking-wider uppercase
                        font-[family-name:var(--font-space-grotesk)]">
            Experimental Supplemental Monitoring Tool
          </p>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-[var(--color-steel-400)] mb-8 max-w-2xl mx-auto leading-relaxed">
            A free, lo-tech monitoring aid using standard{' '}
            <span className="text-emerald-400">webcams</span> and{' '}
            <span className="text-emerald-400">microphones</span>.
            <br />
            <span className="text-[var(--color-steel-500)]">
              Designed for educated, tech-savvy parents. Portable by design.
            </span>
          </p>

          {/* Critical Disclaimer Box */}
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <IconWarning size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-amber-200 font-semibold mb-1">
                  This is NOT a replacement for human supervision
                </p>
                <p className="text-xs text-amber-200/70 leading-relaxed">
                  SafeOS Guardian is a <strong>supplemental experimental tool</strong> only. 
                  It cannot and should not replace direct human care and attention. 
                  Technology can fail. Always maintain proper supervision of children, 
                  pets, and elderly family members.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          {isSetupComplete ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-4 px-10 py-5
                           bg-gradient-to-r from-emerald-600 to-emerald-500
                           hover:from-emerald-500 hover:to-emerald-400
                           text-white text-xl font-semibold rounded-xl
                           shadow-[0_0_40px_rgba(16,185,129,0.3)]
                           hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]
                           transform hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200
                           font-[family-name:var(--font-space-grotesk)]"
              >
                <IconShield size={28} />
                <span>Go to Dashboard</span>
                <IconArrowRight
                  size={24}
                  className="transform group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                href="/setup"
                className="inline-flex items-center gap-2 px-6 py-3
                           text-slate-400 hover:text-emerald-400
                           transition-colors text-sm"
              >
                <span>Redo Setup</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/setup"
              className="group inline-flex items-center gap-4 px-10 py-5
                         bg-gradient-to-r from-emerald-600 to-emerald-500
                         hover:from-emerald-500 hover:to-emerald-400
                         text-white text-xl font-semibold rounded-xl
                         shadow-[0_0_40px_rgba(16,185,129,0.3)]
                         hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]
                         transform hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-200
                         font-[family-name:var(--font-space-grotesk)]"
            >
              <IconShield size={28} />
              <span>Start Setup</span>
              <IconArrowRight
                size={24}
                className="transform group-hover:translate-x-1 transition-transform"
              />
            </Link>
          )}

          {/* Sub-text */}
          <p className="mt-4 text-sm text-[var(--color-steel-500)]">
            {isSetupComplete ? 'Your monitoring dashboard awaits' : 'Takes less than 2 minutes · No account required'}
          </p>

          {/* Open Source Badge */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/framersai/safeos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-slate-300 font-medium">Open Source</span>
              <span className="text-xs text-slate-500">MIT License</span>
            </a>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/framersai/safeos/stargazers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/30 hover:bg-slate-700/40 border border-slate-700/30 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-xs text-slate-400">Star</span>
              </a>
              <a
                href="https://github.com/framersai/safeos/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/30 hover:bg-slate-700/40 border border-slate-700/30 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 5C7 3.89543 7.89543 3 9 3C10.1046 3 11 3.89543 11 5C11 5.74028 10.5978 6.38663 10 6.73244V8H14V6.73244C13.4022 6.38663 13 5.74028 13 5C13 3.89543 13.8954 3 15 3C16.1046 3 17 3.89543 17 5C17 5.74028 16.5978 6.38663 16 6.73244V9C16 9.55228 15.5523 10 15 10H13V12.2676C13.5978 12.6134 14 13.2597 14 14C14 15.1046 13.1046 16 12 16C10.8954 16 10 15.1046 10 14C10 13.2597 10.4022 12.6134 11 12.2676V10H9C8.44772 10 8 9.55228 8 9V6.73244C7.40221 6.38663 7 5.74028 7 5Z" />
                </svg>
                <span className="text-xs text-slate-400">Fork</span>
              </a>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
          <FeatureCard
            icon={IconCamera}
            title="Lo-Tech & Portable"
            description="Uses standard webcams and microphones you already own. No special hardware required."
          />
          <FeatureCard
            icon={IconBell}
            title="Supplemental Alerts"
            description="Get notified as a backup layer—never as your primary supervision method."
          />
          <FeatureCard
            icon={IconShield}
            title="Privacy First"
            description="All processing happens locally on your device. Your data never leaves."
          />
        </div>

        {/* Use Case Showcase */}
        <div className="mt-16 w-full">
          <UseCaseShowcase />
        </div>

        {/* Abuse Prevention Notice */}
        <div className="mt-12 max-w-3xl mx-auto w-full">
          <div className="p-4 bg-[var(--color-steel-900)] border border-[var(--color-steel-700)] rounded-lg">
            <div className="flex items-start gap-3">
              <IconInfo size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-[var(--color-steel-300)] font-medium mb-2">
                  Abuse Prevention & Rate Limiting
                </p>
                <p className="text-xs text-[var(--color-steel-500)] leading-relaxed mb-2">
                  We actively monitor for misuse patterns and inappropriate behavior. Users who 
                  attempt to abuse this service or use it in ways it&apos;s not intended will receive 
                  <strong className="text-[var(--color-steel-400)]"> rate limitation warnings</strong> and 
                  may be restricted from access.
                </p>
                <p className="text-xs text-[var(--color-steel-500)] leading-relaxed">
                  <strong className="text-amber-400">Note:</strong> This service may be temporarily 
                  taken offline at times while we develop better safeguards. We are committed to 
                  responsible deployment and will not rush features that could enable harm.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Humanitarian Badge + Forever Free */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 
                          bg-emerald-500/10 border border-emerald-500/20 
                          rounded-full text-emerald-400">
            <IconHeart size={20} className="text-red-400" />
            <span className="text-sm font-medium">
              Part of Frame&apos;s 10% for Humanity initiative
            </span>
          </div>
          
          <p className="text-xs text-[var(--color-steel-500)] text-center max-w-md">
            <strong className="text-emerald-400">SafeOS Guardian will always be free.</strong> We will never 
            charge for this humanitarian service. Ever.
          </p>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// Feature Card Component
// =============================================================================

interface FeatureCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-5 bg-[var(--color-steel-900)] border border-[var(--color-steel-800)] 
                    rounded-lg hover:border-emerald-500/30 transition-colors">
      <div className="w-10 h-10 flex items-center justify-center 
                      bg-emerald-500/10 rounded-lg mb-3">
        <Icon size={20} className="text-emerald-500" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-steel-100)] mb-1
                     font-[family-name:var(--font-space-grotesk)]">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-steel-400)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--color-steel-950)] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--color-steel-700)] border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Always show landing page at /
  // Dashboard is available at /dashboard
  return <LandingPage />;
}

