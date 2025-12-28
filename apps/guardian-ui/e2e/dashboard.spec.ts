/**
 * Dashboard E2E Tests
 *
 * Tests the main dashboard functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set up completed onboarding state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: {
          disclaimerAccepted: true,
          scenarioSelected: true,
          selectedScenario: 'pet',
          permissionsGranted: true,
          onboardingComplete: true,
        },
      }));
    });
    await page.goto('/');
  });

  test('should display dashboard header', async ({ page }) => {
    await expect(page.getByText('SafeOS Guardian')).toBeVisible();
    await expect(page.getByText('Humanitarian AI Monitoring')).toBeVisible();
  });

  test('should show system status section', async ({ page }) => {
    await expect(page.getByText('System Status')).toBeVisible();
    await expect(page.getByText(/Local AI|Ollama/i)).toBeVisible();
  });

  test('should show quick actions', async ({ page }) => {
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByText('Start Monitoring')).toBeVisible();
    await expect(page.getByText('Setup Wizard')).toBeVisible();
    await expect(page.getByText('Alert History')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('should navigate to monitor page from quick actions', async ({ page }) => {
    await page.getByText('Start Monitoring').click();
    await expect(page).toHaveURL(/\/monitor/);
  });

  test('should navigate to settings from quick actions', async ({ page }) => {
    await page.getByText('Settings').click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should navigate to history from quick actions', async ({ page }) => {
    await page.getByText('Alert History').click();
    await expect(page).toHaveURL(/\/history/);
  });

  test('should show active streams section', async ({ page }) => {
    await expect(page.getByText('Active Streams')).toBeVisible();
  });

  test('should show footer with disclaimer', async ({ page }) => {
    await expect(page.getByText(/Not a replacement for direct care/i)).toBeVisible();
  });
});

test.describe('Dashboard Responsiveness', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: {
          disclaimerAccepted: true,
          scenarioSelected: true,
          onboardingComplete: true,
        },
      }));
    });
    
    await page.goto('/');
    
    // Header should still be visible
    await expect(page.getByText('SafeOS Guardian')).toBeVisible();
    
    // Quick actions should stack
    await expect(page.getByText('Start Monitoring')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: {
          disclaimerAccepted: true,
          scenarioSelected: true,
          onboardingComplete: true,
        },
      }));
    });
    
    await page.goto('/');
    
    await expect(page.getByText('SafeOS Guardian')).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });
});







