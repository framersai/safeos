'use client';

/**
 * Profile Selector Component
 *
 * Select monitoring scenario/profile.
 *
 * @module components/ProfileSelector
 */

import React from 'react';
import type { MonitoringScenario } from '../stores/monitoring-store';

// =============================================================================
// Types
// =============================================================================

interface ProfileSelectorProps {
  selected: MonitoringScenario | null;
  onSelect: (scenario: MonitoringScenario) => void;
  className?: string;
}

// =============================================================================
// Profile Data
// =============================================================================

const PROFILES = [
  {
    id: 'baby' as const,
    name: 'Baby & Toddler',
    emoji: '👶',
    description: 'Monitor infants and toddlers for safety',
    features: [
      'Sleep position monitoring',
      'Cry detection',
      'Movement alerts',
      'Safe sleep reminders',
    ],
    color: 'from-pink-500 to-rose-500',
    borderColor: 'border-pink-500',
  },
  {
    id: 'pet' as const,
    name: 'Pet Monitoring',
    emoji: '🐕',
    description: 'Keep an eye on your furry friends',
    features: [
      'Activity monitoring',
      'Distress detection',
      'Inactivity alerts',
      'Behavior tracking',
    ],
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500',
  },
  {
    id: 'elderly' as const,
    name: 'Elderly Care',
    emoji: '👴',
    description: 'Support senior safety and wellbeing',
    features: [
      'Fall detection',
      'Activity monitoring',
      'Emergency alerts',
      'Routine tracking',
    ],
    color: 'from-blue-500 to-indigo-500',
    borderColor: 'border-blue-500',
  },
];

// =============================================================================
// Component
// =============================================================================

export function ProfileSelector({
  selected,
  onSelect,
  className = '',
}: ProfileSelectorProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {PROFILES.map((profile) => (
        <button
          key={profile.id}
          onClick={() => onSelect(profile.id)}
          className={`relative p-6 rounded-xl text-left transition-all duration-200 ${
            selected === profile.id
              ? `ring-2 ${profile.borderColor} bg-gray-800`
              : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
          }`}
        >
          {/* Selected indicator */}
          {selected === profile.id && (
            <div
              className={`absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r ${profile.color} flex items-center justify-center`}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {/* Emoji */}
          <div className="text-5xl mb-4">{profile.emoji}</div>

          {/* Title */}
          <h3
            className={`text-xl font-bold mb-2 ${
              selected === profile.id ? 'text-white' : 'text-gray-200'
            }`}
          >
            {profile.name}
          </h3>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-4">{profile.description}</p>

          {/* Features */}
          <ul className="space-y-2">
            {profile.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${profile.color}`}
                />
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
}

export default ProfileSelector;
