'use client';

/**
 * Profiles Page
 *
 * Manage monitoring profiles.
 *
 * @module app/profiles/page
 */

import React from 'react';
import Link from 'next/link';
import { ProfileSelector } from '../../components/ProfileSelector';
import { useOnboardingStore } from '../../stores/onboarding-store';
import { useMonitoringStore } from '../../stores/monitoring-store';

// =============================================================================
// Component
// =============================================================================

export default function ProfilesPage() {
  const { selectedScenario, selectScenario, acceptScenarioDisclaimer } = useOnboardingStore();
  const { setScenario, isStreaming } = useMonitoringStore();

  const handleSelect = (scenario: 'baby' | 'pet' | 'elderly') => {
    if (isStreaming) {
      alert('Please stop the current monitoring session before changing profiles.');
      return;
    }

    selectScenario(scenario);
    acceptScenarioDisclaimer();
    setScenario(scenario);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl hover:scale-110 transition-transform">
                🛡️
              </Link>
              <h1 className="text-xl font-bold text-white">Monitoring Profiles</h1>
            </div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Choose Your Monitoring Profile
          </h2>
          <p className="text-gray-400">
            Each profile is optimized with specific settings and AI prompts
          </p>
        </div>

        <ProfileSelector
          selected={selectedScenario}
          onSelect={handleSelect}
          className="mb-8"
        />

        {/* Profile Details */}
        {selectedScenario && (
          <ProfileDetails scenario={selectedScenario} />
        )}

        {isStreaming && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-center">
            ⚠️ Stop the current monitoring session to change profiles
          </div>
        )}
      </main>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function ProfileDetails({ scenario }: { scenario: 'baby' | 'pet' | 'elderly' }) {
  const details = {
    baby: {
      title: 'Baby & Toddler Monitoring',
      description:
        'Optimized for monitoring infants and young children. Features enhanced cry detection and safe sleep monitoring.',
      features: [
        { name: 'Cry Detection', description: 'AI-powered baby cry recognition' },
        { name: 'Sleep Monitoring', description: 'Safe sleep position alerts' },
        { name: 'High Sensitivity', description: 'Lower motion thresholds' },
        { name: 'Quick Response', description: 'Faster alert escalation' },
      ],
      sensitivity: { motion: 25, audio: 30 },
    },
    pet: {
      title: 'Pet Monitoring',
      description:
        'Keep an eye on your pets when you are away. Detects unusual behavior and potential distress.',
      features: [
        { name: 'Activity Tracking', description: 'Monitor movement patterns' },
        { name: 'Distress Detection', description: 'Recognize unusual behavior' },
        { name: 'Inactivity Alerts', description: 'Alert on prolonged stillness' },
        { name: 'Sound Detection', description: 'Barking and meowing alerts' },
      ],
      sensitivity: { motion: 35, audio: 40 },
    },
    elderly: {
      title: 'Elderly Care Monitoring',
      description:
        'Support senior safety with fall detection and activity monitoring. Not a replacement for medical alert systems.',
      features: [
        { name: 'Fall Detection', description: 'Sudden movement detection' },
        { name: 'Activity Monitoring', description: 'Track daily routines' },
        { name: 'Help Detection', description: 'Recognize calls for help' },
        { name: 'Inactivity Alerts', description: 'Alert on unusual stillness' },
      ],
      sensitivity: { motion: 20, audio: 25 },
    },
  };

  const detail = details[scenario];

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
      <h3 className="text-xl font-bold text-white mb-2">{detail.title}</h3>
      <p className="text-gray-400 mb-6">{detail.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {detail.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-green-400">✓</span>
            <div>
              <div className="font-medium text-white">{feature.name}</div>
              <div className="text-sm text-gray-400">{feature.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          Default Sensitivity Settings
        </h4>
        <div className="flex gap-4">
          <div className="flex-1 bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Motion</div>
            <div className="text-lg font-bold text-white">
              {detail.sensitivity.motion}%
            </div>
          </div>
          <div className="flex-1 bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Audio</div>
            <div className="text-lg font-bold text-white">
              {detail.sensitivity.audio}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
