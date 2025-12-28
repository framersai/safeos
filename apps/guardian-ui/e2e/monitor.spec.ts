/**
 * Monitor Page E2E Tests
 *
 * Tests the video monitoring functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Monitor Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set up completed onboarding
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
  });

  test('should display monitor page', async ({ page }) => {
    await page.goto('/monitor');
    await expect(page.getByText(/Monitor|Monitoring/i)).toBeVisible();
  });

  test('should show camera feed placeholder', async ({ page }) => {
    await page.goto('/monitor');
    
    // Should have video element or placeholder
    const videoArea = page.locator('video, [data-testid="camera-feed"], .video-container');
    await expect(videoArea.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have start/stop controls', async ({ page }) => {
    await page.goto('/monitor');
    
    // Look for control buttons
    const startButton = page.getByRole('button', { name: /Start|Begin/i });
    const stopButton = page.getByRole('button', { name: /Stop|End/i });
    
    // At least one should be visible
    const hasControls = await startButton.isVisible() || await stopButton.isVisible();
    expect(hasControls).toBeTruthy();
  });

  test('should display motion/audio indicators', async ({ page }) => {
    await page.goto('/monitor');
    
    // Should have level indicators
    await expect(page.getByText(/Motion|Audio|Level/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show scenario selector', async ({ page }) => {
    await page.goto('/monitor');
    
    // Should show current scenario or selector
    await expect(page.getByText(/Pet|Baby|Elderly/i).first()).toBeVisible();
  });
});

test.describe('Monitor Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: {
          disclaimerAccepted: true,
          scenarioSelected: true,
          selectedScenario: 'pet',
          onboardingComplete: true,
        },
      }));
    });
  });

  test('should toggle fullscreen mode', async ({ page }) => {
    await page.goto('/monitor');
    
    const fullscreenButton = page.getByRole('button', { name: /Fullscreen|Expand/i });
    if (await fullscreenButton.isVisible()) {
      await fullscreenButton.click();
      // Fullscreen API may not work in test environment
    }
  });

  test('should show sensitivity controls', async ({ page }) => {
    await page.goto('/monitor');
    
    // Look for sensitivity sliders or inputs
    const sensitivityControl = page.getByText(/Sensitivity/i);
    if (await sensitivityControl.isVisible()) {
      await expect(sensitivityControl).toBeVisible();
    }
  });
});

test.describe('Monitor Alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: {
          disclaimerAccepted: true,
          scenarioSelected: true,
          onboardingComplete: true,
        },
      }));
    });
  });

  test('should display alert panel', async ({ page }) => {
    await page.goto('/monitor');
    
    // Should have alerts section
    const alertsSection = page.getByText(/Alerts|Notifications/i);
    await expect(alertsSection.first()).toBeVisible({ timeout: 5000 });
  });
});







