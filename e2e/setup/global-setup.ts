/**
 * Global E2E Test Setup
 *
 * Runs once before all tests.
 *
 * @module e2e/setup/global-setup
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting E2E test setup...\n');

  // Environment setup
  process.env.NODE_ENV = 'test';
  process.env.E2E_TESTING = 'true';

  // Wait for services to be ready
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
  const apiURL = process.env.E2E_API_URL || 'http://localhost:3001';

  console.log(`📍 Frontend URL: ${baseURL}`);
  console.log(`📍 API URL: ${apiURL}\n`);

  // Health check with retries
  const maxRetries = 30;
  const retryInterval = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check API health
      const apiResponse = await fetch(`${apiURL}/api/health`);
      if (apiResponse.ok) {
        console.log('✅ API server is ready');
        break;
      }
    } catch {
      if (i === maxRetries - 1) {
        console.error('❌ API server failed to start');
        throw new Error('API server not available');
      }
      await new Promise((r) => setTimeout(r, retryInterval));
    }
  }

  console.log('\n✨ E2E test setup complete!\n');
}

export default globalSetup;







