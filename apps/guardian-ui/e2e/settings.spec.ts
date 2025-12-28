/**
 * Settings Page E2E Tests
 *
 * Tests settings and preferences functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: {
          disclaimerAccepted: true,
          scenarioSelected: true,
          onboardingComplete: true,
        },
      }));
      localStorage.setItem('safeos-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          isGuest: true,
          sessionToken: 'test-token',
          profile: {
            id: 'test-profile',
            displayName: 'Test User',
            preferences: {
              defaultScenario: 'pet',
              motionSensitivity: 0.5,
              audioSensitivity: 0.5,
              alertVolume: 0.7,
              theme: 'dark',
            },
            notificationSettings: {
              browserPush: true,
              sms: false,
              telegram: false,
              emailDigest: false,
            },
          },
        },
      }));
    });
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('should show profile section', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Profile Information')).toBeVisible();
    await expect(page.getByText('Display Name')).toBeVisible();
  });

  test('should show preferences section', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Preferences')).toBeVisible();
    await expect(page.getByText('Motion Sensitivity')).toBeVisible();
    await expect(page.getByText('Audio Sensitivity')).toBeVisible();
  });

  test('should show notification settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Notification Settings')).toBeVisible();
    await expect(page.getByText('Browser Push Notifications')).toBeVisible();
  });

  test('should have save buttons for each section', async ({ page }) => {
    await page.goto('/settings');
    
    const saveButtons = page.getByRole('button', { name: /Save/i });
    const count = await saveButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have logout button', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: /Log Out/i })).toBeVisible();
  });

  test('should update display name', async ({ page }) => {
    await page.goto('/settings');
    
    const nameInput = page.getByLabel('Display Name');
    await nameInput.fill('New Test Name');
    
    // Value should be updated
    await expect(nameInput).toHaveValue('New Test Name');
  });

  test('should adjust sensitivity sliders', async ({ page }) => {
    await page.goto('/settings');
    
    const motionSlider = page.locator('input[type="range"]').first();
    if (await motionSlider.isVisible()) {
      await motionSlider.fill('0.8');
    }
  });
});

test.describe('Settings Theme', () => {
  test('should have theme selector', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { onboardingComplete: true },
      }));
      localStorage.setItem('safeos-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          profile: { preferences: { theme: 'dark' } },
        },
      }));
    });
    
    await page.goto('/settings');
    await expect(page.getByText('Theme')).toBeVisible();
  });
});







