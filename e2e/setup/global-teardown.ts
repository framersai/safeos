/**
 * Global E2E Test Teardown
 *
 * Runs once after all tests.
 *
 * @module e2e/setup/global-teardown
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Running E2E test teardown...\n');

  // Cleanup test data
  const apiURL = process.env.E2E_API_URL || 'http://localhost:3001';

  try {
    // Clean up test users/sessions if needed
    await fetch(`${apiURL}/api/test/cleanup`, { method: 'POST' });
    console.log('✅ Test data cleaned up');
  } catch {
    // Cleanup endpoint might not exist, that's fine
    console.log('ℹ️  No test cleanup endpoint found');
  }

  console.log('\n✨ E2E test teardown complete!\n');
}

export default globalTeardown;







