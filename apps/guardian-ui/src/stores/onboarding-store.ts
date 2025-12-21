/**
 * Onboarding Store
 *
 * Zustand store for onboarding and setup state.
 *
 * @module stores/onboarding-store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// Types
// =============================================================================

export type SetupStep =
  | 'welcome'
  | 'disclaimer'
  | 'scenario'
  | 'permissions'
  | 'notifications'
  | 'complete';

export type MonitoringScenario = 'pet' | 'baby' | 'elderly';

export interface OnboardingState {
  // Progress
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  isComplete: boolean;

  // Disclaimers
  hasAcceptedMainDisclaimer: boolean;
  hasAcceptedScenarioDisclaimer: boolean;
  disclaimerAcceptedAt: string | null;

  // Selections
  selectedScenario: MonitoringScenario | null;
  profileName: string;

  // Permissions
  hasCameraPermission: boolean;
  hasMicrophonePermission: boolean;
  hasNotificationPermission: boolean;

  // Notifications
  notificationChannels: {
    browser: boolean;
    sms: boolean;
    telegram: boolean;
  };
  phoneNumber: string | null;
  telegramChatId: string | null;

  // Actions
  setStep: (step: SetupStep) => void;
  completeStep: (step: SetupStep) => void;
  acceptMainDisclaimer: () => void;
  acceptScenarioDisclaimer: () => void;
  selectScenario: (scenario: MonitoringScenario) => void;
  setProfileName: (name: string) => void;
  setCameraPermission: (granted: boolean) => void;
  setMicrophonePermission: (granted: boolean) => void;
  setNotificationPermission: (granted: boolean) => void;
  setNotificationChannel: (channel: 'browser' | 'sms' | 'telegram', enabled: boolean) => void;
  setPhoneNumber: (phone: string) => void;
  setTelegramChatId: (chatId: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState = {
  currentStep: 'welcome' as SetupStep,
  completedSteps: [] as SetupStep[],
  isComplete: false,
  hasAcceptedMainDisclaimer: false,
  hasAcceptedScenarioDisclaimer: false,
  disclaimerAcceptedAt: null as string | null,
  selectedScenario: null as MonitoringScenario | null,
  profileName: '',
  hasCameraPermission: false,
  hasMicrophonePermission: false,
  hasNotificationPermission: false,
  notificationChannels: {
    browser: true,
    sms: false,
    telegram: false,
  },
  phoneNumber: null as string | null,
  telegramChatId: null as string | null,
};

// =============================================================================
// Store
// =============================================================================

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      completeStep: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),

      acceptMainDisclaimer: () =>
        set({
          hasAcceptedMainDisclaimer: true,
          disclaimerAcceptedAt: new Date().toISOString(),
        }),

      acceptScenarioDisclaimer: () =>
        set({ hasAcceptedScenarioDisclaimer: true }),

      selectScenario: (scenario) =>
        set({
          selectedScenario: scenario,
          hasAcceptedScenarioDisclaimer: false, // Reset when changing scenario
        }),

      setProfileName: (name) => set({ profileName: name }),

      setCameraPermission: (granted) =>
        set({ hasCameraPermission: granted }),

      setMicrophonePermission: (granted) =>
        set({ hasMicrophonePermission: granted }),

      setNotificationPermission: (granted) =>
        set({ hasNotificationPermission: granted }),

      setNotificationChannel: (channel, enabled) =>
        set((state) => ({
          notificationChannels: {
            ...state.notificationChannels,
            [channel]: enabled,
          },
        })),

      setPhoneNumber: (phone) => set({ phoneNumber: phone }),

      setTelegramChatId: (chatId) => set({ telegramChatId: chatId }),

      completeOnboarding: () =>
        set({
          isComplete: true,
          currentStep: 'complete',
          completedSteps: [
            'welcome',
            'disclaimer',
            'scenario',
            'permissions',
            'notifications',
            'complete',
          ],
        }),

      resetOnboarding: () => set(initialState),
    }),
    {
      name: 'safeos-onboarding',
    }
  )
);
