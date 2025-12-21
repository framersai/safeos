/**
 * Setup Page
 *
 * Onboarding flow with disclaimers and configuration.
 *
 * @module app/setup/page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useOnboardingStore,
  getOnboardingSteps,
  areDisclaimersAccepted,
} from '../../stores/onboarding-store';
import {
  CRITICAL_DISCLAIMER,
  getScenarioDisclaimer,
  ACKNOWLEDGMENT_TEXT,
} from '../../lib/disclaimers';

// =============================================================================
// Types
// =============================================================================

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

// =============================================================================
// Setup Page
// =============================================================================

export default function SetupPage() {
  const router = useRouter();
  const store = useOnboardingStore();
  const steps = getOnboardingSteps();
  const [error, setError] = useState<string | null>(null);

  const currentStepConfig = steps[store.currentStep];

  const handleNext = () => {
    if (store.currentStep < steps.length - 1) {
      store.completeStep(store.currentStep);
      store.setStep(store.currentStep + 1);
    } else {
      // Complete onboarding
      store.setComplete(true);
      router.push('/');
    }
  };

  const handleBack = () => {
    if (store.currentStep > 0) {
      store.setStep(store.currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (store.currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return <DisclaimerStep onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <ScenarioStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <PermissionsStep onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <NotificationsStep onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <ReadyStep onNext={handleNext} onBack={handleBack} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
          style={{ width: `${((store.currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="container mx-auto px-4 pt-12">
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                idx === store.currentStep
                  ? 'bg-emerald-500'
                  : idx < store.currentStep
                    ? 'bg-emerald-500/50'
                    : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">{currentStepConfig?.name}</h1>
          <p className="text-slate-400 mt-2">{currentStepConfig?.description}</p>
        </div>
      </div>

      {/* Step content */}
      <div className="container mx-auto px-4 pb-12">{renderStep()}</div>

      {/* Error display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 text-center">
          {error}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Step Components
// =============================================================================

function WelcomeStep({ onNext }: StepProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Logo */}
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mx-auto mb-8">
        <span className="text-5xl">🛡️</span>
      </div>

      <h2 className="text-3xl font-bold text-white mb-4">
        Welcome to SafeOS Guardian
      </h2>

      <p className="text-slate-300 text-lg mb-6">
        A free humanitarian monitoring service brought to you by SuperCloud's
        10% for Humanity initiative.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <FeatureCard icon="🐕" title="Pet Monitoring" />
        <FeatureCard icon="👶" title="Baby Watch" />
        <FeatureCard icon="👴" title="Elderly Care" />
      </div>

      <p className="text-slate-400 text-sm mb-8">
        This service uses AI to monitor camera feeds and alert you to potential
        concerns. It's designed to supplement—never replace—proper care and
        supervision.
      </p>

      <button
        onClick={onNext}
        className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
      >
        Get Started
      </button>
    </div>
  );
}

function FeatureCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <span className="text-3xl mb-2 block">{icon}</span>
      <span className="text-sm text-slate-300">{title}</span>
    </div>
  );
}

function DisclaimerStep({ onNext, onBack }: StepProps) {
  const store = useOnboardingStore();
  const [acknowledged, setAcknowledged] = useState(false);

  const canProceed = acknowledged;

  const handleAccept = () => {
    store.acceptDisclaimer('main');
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Disclaimer content */}
      <div className="bg-slate-800/50 rounded-xl border border-red-500/30 p-6 mb-6 max-h-[400px] overflow-y-auto">
        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
          {CRITICAL_DISCLAIMER}
        </pre>
      </div>

      {/* Acknowledgment checkbox */}
      <div className="bg-slate-800/30 rounded-xl p-4 mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-300 whitespace-pre-line">
            {ACKNOWLEDGMENT_TEXT}
          </span>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleAccept}
          disabled={!canProceed}
          className={`px-8 py-3 rounded-xl font-medium transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          I Accept & Continue
        </button>
      </div>
    </div>
  );
}

function ScenarioStep({ onNext, onBack }: StepProps) {
  const store = useOnboardingStore();

  const scenarios = [
    {
      id: 'pet' as const,
      icon: '🐕',
      title: 'Pet Monitoring',
      description: 'Watch over your furry friends when you\'re away',
      features: ['Movement detection', 'Bark/sound alerts', 'Inactivity warnings'],
    },
    {
      id: 'baby' as const,
      icon: '👶',
      title: 'Baby Watch',
      description: 'Supplemental monitoring for infants and toddlers',
      features: ['Cry detection', 'Movement tracking', 'Sleep monitoring'],
    },
    {
      id: 'elderly' as const,
      icon: '👴',
      title: 'Elderly Care',
      description: 'Peace of mind for aging loved ones',
      features: ['Activity monitoring', 'Fall indicators', 'Help detection'],
    },
  ];

  const handleSelect = (scenario: 'pet' | 'baby' | 'elderly') => {
    store.setScenario(scenario);
    store.acceptDisclaimer('scenario');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleSelect(scenario.id)}
            className={`text-left p-6 rounded-xl border transition-all ${
              store.selectedScenario === scenario.id
                ? 'bg-emerald-500/20 border-emerald-500'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <span className="text-4xl mb-4 block">{scenario.icon}</span>
            <h3 className="text-lg font-semibold text-white mb-2">
              {scenario.title}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{scenario.description}</p>
            <ul className="space-y-1">
              {scenario.features.map((feature) => (
                <li key={feature} className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Scenario-specific disclaimer */}
      {store.selectedScenario && (
        <div className="bg-slate-800/30 rounded-xl p-4 mb-6">
          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans">
            {getScenarioDisclaimer(store.selectedScenario)}
          </pre>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!store.selectedScenario}
          className={`px-8 py-3 rounded-xl font-medium transition-all ${
            store.selectedScenario
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function PermissionsStep({ onNext, onBack }: StepProps) {
  const store = useOnboardingStore();
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    setRequesting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Stop tracks immediately (we just needed permission)
      stream.getTracks().forEach((track) => track.stop());

      store.setCameraPermission(true);
      store.setMicrophonePermission(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Permission denied';
      setError(message);

      // Check which permissions we have
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStream.getTracks().forEach((track) => track.stop());
        store.setCameraPermission(true);
      } catch {
        store.setCameraPermission(false);
      }

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach((track) => track.stop());
        store.setMicrophonePermission(true);
      } catch {
        store.setMicrophonePermission(false);
      }
    } finally {
      setRequesting(false);
    }
  };

  const canProceed = store.cameraPermissionGranted;

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">📷</span>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">
        Camera & Microphone Access
      </h2>

      <p className="text-slate-400 mb-8">
        SafeOS Guardian needs access to your camera and microphone to monitor
        your space. All processing happens locally on your device for privacy.
      </p>

      {/* Permission status */}
      <div className="bg-slate-800/50 rounded-xl p-6 mb-6 space-y-4">
        <PermissionItem
          icon="📷"
          title="Camera"
          granted={store.cameraPermissionGranted}
          required
        />
        <PermissionItem
          icon="🎤"
          title="Microphone"
          granted={store.microphonePermissionGranted}
          required={false}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Request button */}
      {!canProceed && (
        <button
          onClick={requestPermissions}
          disabled={requesting}
          className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 mb-8"
        >
          {requesting ? 'Requesting...' : 'Grant Permissions'}
        </button>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-8 py-3 rounded-xl font-medium transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function PermissionItem({
  icon,
  title,
  granted,
  required,
}: {
  icon: string;
  title: string;
  granted: boolean;
  required: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="text-left">
          <span className="text-white font-medium">{title}</span>
          {required && <span className="text-xs text-red-400 ml-2">Required</span>}
        </div>
      </div>
      <div
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          granted
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-slate-700 text-slate-400'
        }`}
      >
        {granted ? '✓ Granted' : 'Pending'}
      </div>
    </div>
  );
}

function NotificationsStep({ onNext, onBack }: StepProps) {
  const store = useOnboardingStore();

  const requestBrowserPush = async () => {
    try {
      const permission = await Notification.requestPermission();
      store.setNotifications({ browserPushEnabled: permission === 'granted' });
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🔔</span>
        </div>
        <p className="text-slate-400">
          Configure how you want to receive alerts when something needs attention.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Browser Push */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌐</span>
              <div>
                <h4 className="text-white font-medium">Browser Notifications</h4>
                <p className="text-xs text-slate-400">Get alerts in your browser</p>
              </div>
            </div>
            {store.browserPushEnabled ? (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                Enabled
              </span>
            ) : (
              <button
                onClick={requestBrowserPush}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* SMS (Twilio) */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h4 className="text-white font-medium">SMS Alerts</h4>
                <p className="text-xs text-slate-400">Receive text message alerts</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">Coming soon</span>
          </div>
        </div>

        {/* Telegram */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈️</span>
              <div>
                <h4 className="text-white font-medium">Telegram Bot</h4>
                <p className="text-xs text-slate-400">Get alerts via Telegram</p>
              </div>
            </div>
            <span className="text-xs text-slate-500">Configure in settings</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function ReadyStep({ onNext, onBack }: StepProps) {
  const store = useOnboardingStore();

  const scenarioLabels = {
    pet: 'Pet Monitoring',
    baby: 'Baby Watch',
    elderly: 'Elderly Care',
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mx-auto mb-8">
        <span className="text-5xl">✓</span>
      </div>

      <h2 className="text-3xl font-bold text-white mb-4">You're All Set!</h2>

      <p className="text-slate-400 text-lg mb-8">
        SafeOS Guardian is ready to help monitor your{' '}
        {store.selectedScenario === 'pet'
          ? 'pets'
          : store.selectedScenario === 'baby'
            ? 'little ones'
            : 'loved ones'}
        .
      </p>

      {/* Summary */}
      <div className="bg-slate-800/50 rounded-xl p-6 mb-8 text-left">
        <h3 className="text-white font-semibold mb-4">Configuration Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Monitoring Type</span>
            <span className="text-white">
              {store.selectedScenario ? scenarioLabels[store.selectedScenario] : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Camera Access</span>
            <span className={store.cameraPermissionGranted ? 'text-emerald-400' : 'text-red-400'}>
              {store.cameraPermissionGranted ? 'Granted' : 'Denied'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Browser Notifications</span>
            <span className={store.browserPushEnabled ? 'text-emerald-400' : 'text-slate-500'}>
              {store.browserPushEnabled ? 'Enabled' : 'Not enabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Important reminder */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8 text-left">
        <p className="text-yellow-400 text-sm">
          <strong>Remember:</strong> SafeOS Guardian is a supplementary tool. Always ensure
          proper supervision and care for your loved ones.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Start Monitoring 🚀
        </button>
      </div>
    </div>
  );
}
