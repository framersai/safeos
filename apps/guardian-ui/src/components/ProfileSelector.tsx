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
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
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
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="4" r="2" />
        <circle cx="18" cy="8" r="2" />
        <circle cx="20" cy="16" r="2" />
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
      </svg>
    ),
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
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="5" r="3" />
        <path d="M12 8v4m0 0-2 8m2-8 2 8" />
        <path d="M6 13h4m4 0h4" />
      </svg>
    ),
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

          {/* Icon */}
          <div className="mb-4 text-current">{profile.icon}</div>

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
