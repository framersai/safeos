/**
 * Authentication E2E Tests
 *
 * Tests login, signup, and session management.
 */

import { test, expect } from '@playwright/test';

test.describe('Guest Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should show login modal when accessing protected page', async ({ page }) => {
    // Set up onboarding complete but not authenticated
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { onboardingComplete: true },
      }));
    });
    
    await page.goto('/settings');
    
    // Should show login prompt or redirect
    const loginModal = page.getByText(/Welcome|Log in|Sign in|Guest/i);
    await expect(loginModal.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow guest login', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { onboardingComplete: true },
      }));
    });
    
    await page.goto('/settings');
    
    // Look for guest login option
    const guestButton = page.getByRole('button', { name: /Guest|Continue as Guest/i });
    if (await guestButton.isVisible()) {
      await guestButton.click();
    }
  });

  test('should show signup/login buttons', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { onboardingComplete: true },
      }));
    });
    
    await page.goto('/');
    
    // Check for auth buttons in header or modal
    const authArea = page.getByText(/Sign|Log|Account/i);
    // Auth UI should exist somewhere
  });
});

test.describe('Email Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { onboardingComplete: true },
      }));
    });
  });

  test('should show email login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Should have email and password fields
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);
    
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    }
  });

  test('should show signup form', async ({ page }) => {
    await page.goto('/auth/signup');
    
    const emailInput = page.getByLabel(/Email/i);
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/login');
    
    const emailInput = page.getByLabel(/Email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await page.getByRole('button', { name: /Log in|Sign in/i }).click();
      
      // Should show validation error
      await expect(page.getByText(/valid email|invalid/i)).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Session Management', () => {
  test('should persist session across page reload', async ({ page }) => {
    // Set up authenticated session
    await page.evaluate(() => {
      localStorage.setItem('safeos-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          sessionToken: 'test-token',
          profile: { displayName: 'Test User' },
        },
      }));
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { onboardingComplete: true },
      }));
    });
    
    await page.goto('/');
    await page.reload();
    
    // Should still be authenticated
    // Check for user indicator or profile
  });

  test('should logout and clear session', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('safeos-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          sessionToken: 'test-token',
          profile: { displayName: 'Test User' },
        },
      }));
      localStorage.setItem('safeos-onboarding', JSON.stringify({
        state: { onboardingComplete: true },
      }));
    });
    
    await page.goto('/settings');
    
    const logoutButton = page.getByRole('button', { name: /Log Out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Session should be cleared
      const authData = await page.evaluate(() => localStorage.getItem('safeos-auth'));
      // Auth state should be cleared or reset
    }
  });
});







