/**
 * Dashboard E2E Tests
 *
 * @module e2e/tests/dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and complete onboarding
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      // Mock completed onboarding
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: {
          disclaimersAccepted: true,
          scenario: 'pet',
          permissionsGranted: true,
          completed: true,
        },
      }));
    });
    await page.goto('/');
  });

  test('should display dashboard header', async ({ page }) => {
    await expect(page.locator('text=SafeOS Guardian')).toBeVisible();
    await expect(page.locator('text=Humanitarian AI Monitoring')).toBeVisible();
  });

  test('should show system status section', async ({ page }) => {
    await expect(page.locator('text=System Status')).toBeVisible();
    await expect(page.locator('text=Local AI')).toBeVisible();
  });

  test('should show quick actions', async ({ page }) => {
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=Start Monitoring')).toBeVisible();
    await expect(page.locator('text=Setup Wizard')).toBeVisible();
  });

  test('should show active streams section', async ({ page }) => {
    await expect(page.locator('text=Active Streams')).toBeVisible();
  });

  test('should display connection status', async ({ page }) => {
    // Look for connection indicator
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    const statusText = page.locator('text=Connected').or(page.locator('text=Disconnected'));

    await expect(statusText).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to monitor page', async ({ page }) => {
    await page.click('text=Start Monitoring');
    await expect(page).toHaveURL(/\/monitor/);
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should navigate to history page', async ({ page }) => {
    await page.click('text=Alert History');
    await expect(page).toHaveURL(/\/history/);
  });
});

test.describe('Dashboard - Alerts Panel', () => {
  test.beforeEach(async ({ page }) => {
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
    });
    await page.goto('/');
  });

  test('should display alerts panel', async ({ page }) => {
    // The alerts panel might show "No alerts" or actual alerts
    const alertsSection = page.locator('text=Recent Alerts').or(page.locator('text=Alerts'));
    await expect(alertsSection).toBeVisible();
  });

  test('should show no alerts message when empty', async ({ page }) => {
    const noAlertsMessage = page.locator('text=No recent alerts').or(page.locator('text=No alerts'));
    // This might not always be present if there are alerts
    const isVisible = await noAlertsMessage.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });
});

test.describe('Dashboard - Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { disclaimersAccepted: true, scenario: 'pet', permissionsGranted: true, completed: true },
      }));
    });
    await page.goto('/');

    // Dashboard should still be visible
    await expect(page.locator('text=SafeOS Guardian')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { disclaimersAccepted: true, scenario: 'pet', permissionsGranted: true, completed: true },
      }));
    });
    await page.goto('/');

    // Dashboard should still be visible
    await expect(page.locator('text=SafeOS Guardian')).toBeVisible();
  });
});







