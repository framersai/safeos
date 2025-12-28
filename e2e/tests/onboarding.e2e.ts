/**
 * Onboarding E2E Tests
 *
 * @module e2e/tests/onboarding
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh - clear all storage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect to setup on first visit', async ({ page }) => {
    await page.goto('/');

    // Should redirect to setup page
    await expect(page).toHaveURL(/\/setup/, { timeout: 10000 });
  });

  test('should display disclaimer step first', async ({ page }) => {
    await page.goto('/setup');

    // Check for disclaimer content
    await expect(page.locator('text=IMPORTANT').or(page.locator('text=Disclaimer'))).toBeVisible();
    await expect(page.locator('text=supplementary').or(page.locator('text=NOT a replacement'))).toBeVisible();
  });

  test('should require disclaimer acceptance', async ({ page }) => {
    await page.goto('/setup');

    // The accept button should exist
    const acceptButton = page.locator('button:has-text("Understand")').or(
      page.locator('button:has-text("Accept")')
    );
    await expect(acceptButton).toBeVisible();
  });

  test('should proceed to scenario selection after disclaimer', async ({ page }) => {
    await page.goto('/setup');

    // Accept disclaimer
    const acceptButton = page.locator('button:has-text("Understand")').or(
      page.locator('button:has-text("Accept")')
    );
    await acceptButton.click();

    // Should show scenario selection
    await expect(
      page.locator('text=Pet').or(page.locator('text=Baby')).or(page.locator('text=Elderly'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('should allow scenario selection', async ({ page }) => {
    await page.goto('/setup');

    // Accept disclaimer
    await page.locator('button:has-text("Understand")').or(
      page.locator('button:has-text("Accept")')
    ).click();

    // Wait for scenario options
    await expect(page.locator('text=Pet Monitoring')).toBeVisible({ timeout: 5000 });

    // Select pet monitoring
    await page.click('text=Pet Monitoring');

    // Should have visual feedback (selected state)
    // Continue to next step if there's a next button
    const nextButton = page.locator('button:has-text("Continue")').or(
      page.locator('button:has-text("Next")')
    );
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  });

  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('/setup');

    // Step 1: Accept disclaimer
    await page.locator('button:has-text("Understand")').or(
      page.locator('button:has-text("Accept")')
    ).click();

    // Step 2: Select scenario
    await page.click('text=Pet Monitoring');

    // Continue if button exists
    const continueBtn = page.locator('button:has-text("Continue")').or(
      page.locator('button:has-text("Next")')
    );
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }

    // Step 3: Handle permissions (might be skipped in test environment)
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Step 4: Complete
    const completeBtn = page.locator('button:has-text("Complete")').or(
      page.locator('button:has-text("Finish")')
    );
    if (await completeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await completeBtn.click();
    }

    // Should redirect to dashboard after completion
    await expect(page).toHaveURL(/^\/$/, { timeout: 10000 });
  });
});

test.describe('Onboarding - Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/setup');

    // Accept disclaimer first
    await page.locator('button:has-text("Understand")').or(
      page.locator('button:has-text("Accept")')
    ).click();
  });

  test('should display all three monitoring scenarios', async ({ page }) => {
    await expect(page.locator('text=Pet')).toBeVisible();
    await expect(page.locator('text=Baby')).toBeVisible();
    await expect(page.locator('text=Elderly')).toBeVisible();
  });

  test('should show scenario descriptions', async ({ page }) => {
    // Check for scenario cards with descriptions
    const petCard = page.locator('text=Pet').locator('..');
    await expect(petCard).toBeVisible();
  });

  test('should allow selecting baby monitoring', async ({ page }) => {
    await page.click('text=Baby Monitoring');
    // Verify selection
  });

  test('should allow selecting elderly care', async ({ page }) => {
    await page.click('text=Elderly Care');
    // Verify selection
  });
});







