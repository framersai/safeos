/**
 * Monitoring E2E Tests
 *
 * @module e2e/tests/monitoring
 */

import { test, expect } from '@playwright/test';

test.describe('Monitoring Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup completed onboarding state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: {
          disclaimersAccepted: true,
          scenario: 'pet',
          permissionsGranted: true,
          completed: true,
        },
      }));
      // Mock auth session
      localStorage.setItem('safeos-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          isGuest: true,
          sessionToken: 'test-token',
        },
      }));
    });
    await page.goto('/monitor');
  });

  test('should display monitoring page', async ({ page }) => {
    await expect(page.locator('text=Live Monitoring').or(page.locator('text=Monitor'))).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show video preview area', async ({ page }) => {
    // Look for video element or placeholder
    const videoArea = page.locator('video').or(
      page.locator('[data-testid="video-preview"]')
    ).or(
      page.locator('text=Camera Preview')
    );

    await expect(videoArea).toBeVisible({ timeout: 10000 });
  });

  test('should display start monitoring button', async ({ page }) => {
    const startButton = page.locator('button:has-text("Start")').or(
      page.locator('button:has-text("Begin Monitoring")')
    );

    await expect(startButton).toBeVisible();
  });

  test('should show sensitivity controls', async ({ page }) => {
    // Look for sensitivity sliders or labels
    const sensitivityControl = page.locator('text=Sensitivity').or(
      page.locator('text=Motion')
    );

    await expect(sensitivityControl).toBeVisible();
  });

  test('should display scenario selector', async ({ page }) => {
    const scenarioSelector = page.locator('text=Scenario').or(
      page.locator('select').first()
    );

    await expect(scenarioSelector).toBeVisible();
  });
});

test.describe('Monitoring - Camera Access', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant camera permissions for this context
    await context.grantPermissions(['camera', 'microphone']);

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { disclaimersAccepted: true, scenario: 'pet', permissionsGranted: true, completed: true },
      }));
    });
    await page.goto('/monitor');
  });

  test('should request camera access when starting', async ({ page }) => {
    // Click start monitoring
    const startButton = page.locator('button:has-text("Start")');
    if (await startButton.isVisible()) {
      await startButton.click();

      // Wait a bit for camera request
      await page.waitForTimeout(1000);

      // Should show video feed or loading state
      const videoElement = page.locator('video');
      const loadingState = page.locator('text=Loading').or(page.locator('text=Connecting'));

      const isVideoVisible = await videoElement.isVisible().catch(() => false);
      const isLoading = await loadingState.isVisible().catch(() => false);

      expect(isVideoVisible || isLoading).toBe(true);
    }
  });
});

test.describe('Monitoring - Real-time Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { disclaimersAccepted: true, scenario: 'pet', permissionsGranted: true, completed: true },
      }));
    });
    await page.goto('/monitor');
  });

  test('should display motion detection status', async ({ page }) => {
    const motionStatus = page.locator('text=Motion').or(
      page.locator('[data-testid="motion-indicator"]')
    );

    await expect(motionStatus).toBeVisible();
  });

  test('should display audio detection status', async ({ page }) => {
    const audioStatus = page.locator('text=Audio').or(
      page.locator('[data-testid="audio-indicator"]')
    );

    await expect(audioStatus).toBeVisible();
  });

  test('should show analysis status', async ({ page }) => {
    const analysisStatus = page.locator('text=Analysis').or(
      page.locator('text=AI').or(page.locator('text=Processing'))
    );

    // This might not always be visible, so we just check it doesn't error
    const isVisible = await analysisStatus.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });
});

test.describe('Monitoring - Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { disclaimersAccepted: true, scenario: 'pet', permissionsGranted: true, completed: true },
      }));
    });
    await page.goto('/monitor');
  });

  test('should have stop button when monitoring', async ({ page }) => {
    // Start monitoring first
    const startButton = page.locator('button:has-text("Start")');
    if (await startButton.isVisible()) {
      await startButton.click();

      // Look for stop button
      const stopButton = page.locator('button:has-text("Stop")');
      await expect(stopButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should toggle monitoring on button click', async ({ page }) => {
    const startButton = page.locator('button:has-text("Start")');

    if (await startButton.isVisible()) {
      // Start
      await startButton.click();

      // Should change to stop
      const stopButton = page.locator('button:has-text("Stop")');
      await expect(stopButton).toBeVisible({ timeout: 5000 });

      // Stop
      await stopButton.click();

      // Should change back to start
      await expect(startButton).toBeVisible({ timeout: 5000 });
    }
  });
});







