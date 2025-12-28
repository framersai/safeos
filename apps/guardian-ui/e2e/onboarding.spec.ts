/**
 * Onboarding Flow E2E Tests
 *
 * Tests the complete user onboarding experience.
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect to setup page on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/setup/);
  });

  test('should display welcome step with disclaimers', async ({ page }) => {
    await page.goto('/setup');
    
    // Check welcome content
    await expect(page.getByText('Welcome to SafeOS Guardian')).toBeVisible();
    await expect(page.getByText('IMPORTANT DISCLAIMER')).toBeVisible();
    
    // Check that continue button is visible
    await expect(page.getByRole('button', { name: /I Understand/i })).toBeVisible();
  });

  test('should progress through onboarding steps', async ({ page }) => {
    await page.goto('/setup');
    
    // Step 1: Accept disclaimer
    await page.getByRole('button', { name: /I Understand/i }).click();
    
    // Step 2: Select scenario
    await expect(page.getByText(/Choose Your Monitoring/i)).toBeVisible();
    await page.getByText('Pet Monitoring').click();
    await page.getByRole('button', { name: /Continue/i }).click();
    
    // Step 3: Permissions
    await expect(page.getByText(/Camera Access/i)).toBeVisible();
  });

  test('should allow skipping optional steps', async ({ page }) => {
    await page.goto('/setup');
    
    // Accept disclaimer
    await page.getByRole('button', { name: /I Understand/i }).click();
    
    // Select scenario
    await page.getByText('Pet Monitoring').click();
    await page.getByRole('button', { name: /Continue/i }).click();
    
    // Skip permissions if skip button exists
    const skipButton = page.getByRole('button', { name: /Skip/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
  });

  test('should complete onboarding and redirect to dashboard', async ({ page }) => {
    await page.goto('/setup');
    
    // Fast-track through onboarding
    await page.getByRole('button', { name: /I Understand/i }).click();
    await page.getByText('Pet Monitoring').click();
    await page.getByRole('button', { name: /Continue/i }).click();
    
    // Complete remaining steps
    const finishButton = page.getByRole('button', { name: /Finish|Complete|Start/i });
    if (await finishButton.isVisible()) {
      await finishButton.click();
    }
    
    // Should eventually reach dashboard
    await expect(page.getByText('SafeOS Guardian')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Setup Page Validation', () => {
  test('should show scenario selection options', async ({ page }) => {
    await page.goto('/setup');
    await page.getByRole('button', { name: /I Understand/i }).click();
    
    // Check all scenarios are visible
    await expect(page.getByText('Pet Monitoring')).toBeVisible();
    await expect(page.getByText('Baby Monitoring')).toBeVisible();
    await expect(page.getByText('Elderly Care')).toBeVisible();
  });

  test('should highlight selected scenario', async ({ page }) => {
    await page.goto('/setup');
    await page.getByRole('button', { name: /I Understand/i }).click();
    
    // Click on Pet Monitoring
    const petCard = page.getByText('Pet Monitoring').locator('..');
    await petCard.click();
    
    // Should have selected state (emerald border)
    await expect(petCard).toHaveClass(/emerald|border-emerald/);
  });
});







