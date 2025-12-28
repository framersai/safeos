/**
 * Authentication E2E Tests
 *
 * @module e2e/tests/auth
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display login modal on first visit', async ({ page }) => {
    await page.goto('/settings');

    // Wait for the page to load and check for login prompt
    await expect(page.locator('text=Welcome to SafeOS Guardian')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should allow guest login', async ({ page }) => {
    await page.goto('/settings');

    // Wait for login modal
    await expect(page.locator('text=Continue as Guest')).toBeVisible();

    // Enter a display name
    const nameInput = page.locator('input[placeholder*="My Pet Stream"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Guest User');
    }

    // Click guest login button
    await page.click('text=Continue as Guest');

    // Wait for dashboard or settings to load
    await expect(page.locator('text=Profile Information')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should persist guest session across page reloads', async ({ page }) => {
    // Login as guest
    await page.goto('/settings');
    await expect(page.locator('text=Continue as Guest')).toBeVisible();
    await page.click('text=Continue as Guest');
    await expect(page.locator('text=Profile Information')).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('text=Profile Information')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should allow logout', async ({ page }) => {
    // Login as guest first
    await page.goto('/settings');
    await page.click('text=Continue as Guest');
    await expect(page.locator('text=Profile Information')).toBeVisible();

    // Find and click logout button
    await page.click('text=Log Out');

    // Should show login modal again
    await expect(page.locator('text=Welcome to SafeOS Guardian')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Email Authentication', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123!';

  test.skip('should register new user with email', async ({ page }) => {
    await page.goto('/settings');

    // Click on Sign Up
    await page.click('text=Sign Up / Log In');

    // Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[placeholder*="Confirm"]', testPassword);

    // Submit
    await page.click('button:has-text("Create Account")');

    // Should show success message
    await expect(page.locator('text=verification email')).toBeVisible();
  });

  test.skip('should validate password requirements', async ({ page }) => {
    await page.goto('/settings');
    await page.click('text=Sign Up / Log In');

    // Try weak password
    await page.fill('input[type="email"]', 'weak@example.com');
    await page.fill('input[type="password"]', 'weak');

    await page.click('button:has-text("Create Account")');

    // Should show error
    await expect(page.locator('text=at least 8 characters')).toBeVisible();
  });
});







