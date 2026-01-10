/**
 * Use Case Showcase Component
 *
 * Displays all supported monitoring use cases with:
 * - Custom SVG icons for each use case
 * - FREE labels (everything is free!)
 * - Quick action buttons that pre-configure settings via URL params
 * - Clear explanations of how each use case works
 *
 * USE CASES SUPPORTED:
 * 1. Baby Monitoring - Ultra-sensitive sleep monitoring
 * 2. Pet Care - Watch your pets, call them home when detected
 * 3. Elderly Care - Activity monitoring with inactivity alerts
 * 4. Lost & Found - Find missing pets/items with AI detection
 * 5. Security - Intruder detection and person alerts
 * 6. Wildlife - Watch backyard wildlife activity
 *
 * @module components/UseCaseShowcase
 */

'use client';

import React from 'react';
import Link from 'next/link';

// =============================================================================
// Use Case Configurations
// =============================================================================

interface UseCase {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  presetId: string;
  quickStartUrl: string;
  learnMoreUrl?: string;
}

const USE_CASES: UseCase[] = [
  {
    id: 'baby',
    name: 'Baby Monitoring',
    tagline: 'Sleep peacefully knowing your baby is safe',
    description:
      'Ultra-sensitive motion and audio detection designed for infant sleep monitoring. Alerts you to the smallest movements or sounds while your baby sleeps.',
    features: [
      '5px pixel threshold - detects tiniest movements',
      'Baby cry detection (300-600Hz optimization)',
      'Inactivity alerts for peace of mind',
      '100% local processing - your data stays private',
      'Escalating alert system with sound options',
    ],
    icon: <BabyIcon />,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    presetId: 'infant_sleep',
    quickStartUrl: '/monitor?preset=infant_sleep&scenario=baby',
  },
  {
    id: 'pet',
    name: 'Pet Care',
    tagline: 'Keep an eye on your furry friends',
    description:
      'Monitor your pets when you\'re away. Record custom voice messages that play when your pet is detected - perfect for calling them home or comforting them.',
    features: [
      'AI-powered pet detection (dogs, cats, more)',
      'Custom sound recordings for pet recall',
      'Motion tracking for activity monitoring',
      'Multi-pet household support',
      'Integrate with Lost & Found for escape alerts',
    ],
    icon: <PetIcon />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    presetId: 'pet_monitoring',
    quickStartUrl: '/monitor?preset=pet_monitoring&scenario=pet',
  },
  {
    id: 'elderly',
    name: 'Elderly Care',
    tagline: 'Non-intrusive wellness monitoring',
    description:
      'Gentle monitoring for elderly family members. Get alerts if there\'s no movement for extended periods, helping ensure their safety without invading privacy.',
    features: [
      'Inactivity monitoring with customizable thresholds',
      'Fall detection using AI pose estimation',
      'Audio monitoring for calls for help',
      'Privacy-first local processing',
      'Emergency escalation with multiple contacts',
    ],
    icon: <ElderlyIcon />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    presetId: 'elderly_care',
    quickStartUrl: '/monitor?preset=balanced&scenario=elderly',
  },
  {
    id: 'lost-found',
    name: 'Lost & Found',
    tagline: 'Never lose a pet or item again',
    description:
      'Upload a photo of your missing pet or item. The AI continuously scans camera feeds and alerts you immediately when a match is detected.',
    features: [
      'AI-powered image matching',
      'Works with pets, people, and objects',
      'Community sharing for wider coverage',
      'Instant alerts when subject is spotted',
      'Historical timeline of sightings',
    ],
    icon: <LostFoundIcon />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    presetId: 'balanced',
    quickStartUrl: '/lost-found?action=add',
  },
  {
    id: 'security',
    name: 'Security',
    tagline: 'Protect your home and property',
    description:
      'Full security monitoring with person detection, motion alerts, and emergency mode. Perfect for monitoring entry points and detecting intruders.',
    features: [
      'AI person detection with confidence scoring',
      'High-sensitivity motion detection',
      'Instant push notifications',
      'Emergency mode with maximum alerts',
      'Detection zone configuration',
    ],
    icon: <SecurityIcon />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    presetId: 'maximum_sensitivity',
    quickStartUrl: '/monitor?preset=maximum_sensitivity&scenario=security',
  },
  {
    id: 'wildlife',
    name: 'Wildlife Watching',
    tagline: 'Discover the wildlife in your backyard',
    description:
      'Set up cameras to capture wildlife activity. The AI detects animals and logs sightings, building a journal of creatures that visit your property.',
    features: [
      'Animal detection and classification',
      'Motion-triggered recording',
      'Time-lapse compilation of activity',
      'Species logging and statistics',
      'Night vision compatible',
    ],
    icon: <WildlifeIcon />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    presetId: 'balanced',
    quickStartUrl: '/wildlife?setup=true',
  },
];

// =============================================================================
// Component
// =============================================================================

interface UseCaseShowcaseProps {
  className?: string;
  compact?: boolean;
  showOnlyIds?: string[];
}

export function UseCaseShowcase({
  className = '',
  compact = false,
  showOnlyIds,
}: UseCaseShowcaseProps) {
  const displayCases = showOnlyIds
    ? USE_CASES.filter((uc) => showOnlyIds.includes(uc.id))
    : USE_CASES;

  return (
    <section className={className}>
      {!compact && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm mb-4">
            <span className="font-bold">100% FREE</span>
            <span className="text-slate-400">•</span>
            <span>Open Source</span>
            <span className="text-slate-400">•</span>
            <span>Local-First</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            What Can SafeOS Guardian Do?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From baby monitoring to security cameras, Guardian adapts to your needs.
            All features are free, and your data never leaves your device.
          </p>
        </div>
      )}

      <div className={`grid gap-4 ${compact ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {displayCases.map((useCase) => (
          <UseCaseCard key={useCase.id} useCase={useCase} compact={compact} />
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// Use Case Card Component
// =============================================================================

interface UseCaseCardProps {
  useCase: UseCase;
  compact?: boolean;
}

function UseCaseCard({ useCase, compact }: UseCaseCardProps) {
  return (
    <div
      className={`relative rounded-xl border transition-all hover:scale-[1.02] ${useCase.bgColor} ${useCase.borderColor}`}
    >
      {/* FREE Badge */}
      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-lg">
        FREE
      </div>

      <div className={compact ? 'p-4' : 'p-6'}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl ${useCase.bgColor} border ${useCase.borderColor} flex items-center justify-center`}>
            <div className={useCase.color}>{useCase.icon}</div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">{useCase.name}</h3>
            <p className={`text-xs ${useCase.color}`}>{useCase.tagline}</p>
          </div>
        </div>

        {!compact && (
          <>
            {/* Description */}
            <p className="text-sm text-slate-400 mb-4">{useCase.description}</p>

            {/* Features */}
            <ul className="space-y-1.5 mb-4">
              {useCase.features.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className={useCase.color}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
              {useCase.features.length > 3 && (
                <li className="text-xs text-slate-500">
                  +{useCase.features.length - 3} more features
                </li>
              )}
            </ul>
          </>
        )}

        {/* Quick Start Button */}
        <Link
          href={useCase.quickStartUrl}
          className={`block w-full text-center py-2 rounded-lg font-medium transition-colors ${
            compact ? 'text-xs' : 'text-sm'
          } ${useCase.bgColor} ${useCase.color} border ${useCase.borderColor} hover:bg-opacity-50`}
        >
          {compact ? 'Start' : 'Quick Start →'}
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// SVG Icons
// =============================================================================

function BabyIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Baby face */}
      <circle cx="12" cy="10" r="6" />
      {/* Eyes */}
      <circle cx="10" cy="9" r="0.5" fill="currentColor" />
      <circle cx="14" cy="9" r="0.5" fill="currentColor" />
      {/* Smile */}
      <path d="M10 12c0.5 0.5 1 0.7 2 0.7s1.5-0.2 2-0.7" />
      {/* Pacifier */}
      <ellipse cx="12" cy="14" rx="1.5" ry="1" />
      {/* Hair tuft */}
      <path d="M10 4.5c0.5-0.5 1.5-0.5 2-0.3 0.5 0.2 1.5 0.2 2 0.8" />
      {/* Blanket */}
      <path d="M6 16c1-1 4-1.5 6-1.5s5 0.5 6 1.5v4c0 1-0.5 1.5-1.5 1.5h-9c-1 0-1.5-0.5-1.5-1.5v-4z" />
    </svg>
  );
}

function PetIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Dog face shape */}
      <path d="M12 20c-4 0-7-2-7-5 0-2 1-4 3-5" />
      <path d="M12 20c4 0 7-2 7-5 0-2-1-4-3-5" />
      {/* Ears */}
      <path d="M5 10c-1-3 0-6 2-7 1 1 1 3 1 4" />
      <path d="M19 10c1-3 0-6-2-7-1 1-1 3-1 4" />
      {/* Head top */}
      <path d="M8 7c1-2 3-3 4-3s3 1 4 3" />
      {/* Eyes */}
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      {/* Nose */}
      <ellipse cx="12" cy="14" rx="2" ry="1.5" fill="currentColor" />
      {/* Mouth */}
      <path d="M12 15.5v1.5" />
      <path d="M10 17c0.5 0.5 1.3 1 2 1s1.5-0.5 2-1" />
    </svg>
  );
}

function ElderlyIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head */}
      <circle cx="12" cy="6" r="3" />
      {/* Body */}
      <path d="M12 9v5" />
      {/* Arms */}
      <path d="M8 11l4 2 4-2" />
      {/* Walking cane */}
      <path d="M16 14l2 8" />
      <path d="M16 22h4" />
      {/* Legs */}
      <path d="M12 14l-3 8" />
      <path d="M12 14l1 8" />
      {/* Glasses */}
      <circle cx="10.5" cy="5.5" r="1" />
      <circle cx="13.5" cy="5.5" r="1" />
      <path d="M11.5 5.5h1" />
    </svg>
  );
}

function LostFoundIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Magnifying glass */}
      <circle cx="10" cy="10" r="6" />
      <path d="M14.5 14.5l5 5" />
      {/* Paw print inside */}
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
      <circle cx="7" cy="11" r="0.8" fill="currentColor" />
      <circle cx="10" cy="12" r="1.2" fill="currentColor" />
      <circle cx="13" cy="11" r="0.8" fill="currentColor" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Shield */}
      <path d="M12 3l8 3v5c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V6l8-3z" />
      {/* Checkmark */}
      <path d="M8 12l3 3 5-6" strokeWidth={2} />
    </svg>
  );
}

function WildlifeIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Bird body */}
      <ellipse cx="12" cy="14" rx="5" ry="4" />
      {/* Head */}
      <circle cx="15" cy="10" r="2.5" />
      {/* Beak */}
      <path d="M17.5 10l2.5 0.5-2.5 0.5" />
      {/* Eye */}
      <circle cx="15.5" cy="9.5" r="0.5" fill="currentColor" />
      {/* Wing */}
      <path d="M8 13c2-1 4-1 5 0" />
      {/* Tail */}
      <path d="M7 15l-3 2" />
      <path d="M7 14l-4 1" />
      {/* Legs */}
      <path d="M10 18v3" />
      <path d="M14 18v3" />
      {/* Feet */}
      <path d="M9 21h2" />
      <path d="M13 21h2" />
    </svg>
  );
}

// =============================================================================
// Export Default
// =============================================================================

export default UseCaseShowcase;
