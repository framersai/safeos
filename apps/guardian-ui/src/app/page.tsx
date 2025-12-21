/**
 * SafeOS Guardian - Home Page
 *
 * Main dashboard landing page.
 *
 * @module app/page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '../components/Dashboard';
import { useOnboardingStore, canSkipOnboarding } from '../stores/onboarding-store';

export default function HomePage() {
  const router = useRouter();
  const onboardingState = useOnboardingStore();
  const [loading, setLoading] = useState(true);

  // Check if onboarding is needed
  useEffect(() => {
    // Small delay to ensure hydration
    const timer = setTimeout(() => {
      if (!canSkipOnboarding(onboardingState)) {
        router.push('/setup');
      } else {
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [onboardingState, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading SafeOS Guardian...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
