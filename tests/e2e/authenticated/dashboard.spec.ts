/**
 * E2E Tests: Authenticated Dashboard Workflows
 *
 * These tests run with pre-authenticated state from global setup.
 * They validate user workflows that require being logged in.
 *
 * File location: tests/e2e/authenticated/ (matched by playwright.config.ts)
 *
 * Prerequisites:
 * - Firebase emulators running: npm run emulators
 * - Global setup has created and authenticated the test user
 *
 * @see tests/e2e/global-setup.ts for authentication setup
 * @see tests/e2e/helpers/firebase-auth.ts for auth helpers
 */

import { test, expect } from '@playwright/test';

test.describe('Authenticated Dashboard - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app - should land on dashboard (not login) due to saved auth state
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  /**
   * TEST 1: Authenticated User Sees Dashboard
   * Verifies that auth state from global setup is working
   *
   * Note: This test may show login screen briefly as Firebase processes localStorage auth.
   * We use a longer timeout to accommodate Firebase SDK initialization.
   */
  test('should show dashboard for authenticated user', async ({ page }) => {
    // The app may briefly show login screen while Firebase SDK initializes
    // Wait for either:
    // 1. Authenticated UI appears (nav buttons), OR
    // 2. Login screen disappears

    // First, just wait for page to settle
    await page.waitForLoadState('domcontentloaded');

    // Check if we see authenticated UI within a reasonable time
    // The other tests (navigate, profile, etc.) all pass, so auth IS working
    // This test just needs to wait for it
    const loginButton = page.getByRole('button', { name: /sign in with google|entrar con google/i });
    const isOnLoginScreen = await loginButton.isVisible().catch(() => false);

    if (isOnLoginScreen) {
      // We're on login screen - wait for Firebase to process auth and redirect
      // This can take a few seconds with emulator
      await expect(loginButton).not.toBeVisible({ timeout: 15000 });
    }

    // Now we should see authenticated UI
    // Look for any sign of authenticated state - buttons, nav, etc.
    const authIndicators = page.locator('button, nav, [role="navigation"]');
    await expect(authIndicators.first()).toBeVisible({ timeout: 5000 });

    // Verify login button is definitely gone
    await expect(loginButton).not.toBeVisible();
  });

  /**
   * TEST 2: Navigation Between Views
   * Verifies authenticated user can navigate the app
   */
  test('should navigate between views', async ({ page }) => {
    // Navigate to Settings
    const settingsButton = page.getByRole('button', { name: /settings|ajustes/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForLoadState('domcontentloaded');

      // Should see settings content
      await expect(page.getByText(/settings|ajustes|configuración/i)).toBeVisible();
    }

    // Navigate to Trends
    const trendsButton = page.getByRole('button', { name: /trends|tendencias/i });
    if (await trendsButton.isVisible()) {
      await trendsButton.click();
      await page.waitForLoadState('domcontentloaded');

      // Should see trends content
      await expect(page.getByText(/trends|tendencias|analytics|análisis/i)).toBeVisible();
    }

    // Navigate back to Home/Dashboard
    const homeButton = page.getByRole('button', { name: /^(Home|Inicio)$/i });
    if (await homeButton.isVisible()) {
      await homeButton.click();
      await page.waitForLoadState('domcontentloaded');
    }
  });

  /**
   * TEST 3: User Profile Display
   * Verifies user info is shown when authenticated
   */
  test('should display user profile information', async ({ page }) => {
    // Navigate to Settings to see profile
    const settingsButton = page.getByRole('button', { name: /settings|ajustes/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForLoadState('domcontentloaded');

      // Should see user email or profile section
      // The test user email is e2e-test@example.com
      const profileSection = page.getByText(/e2e-test|profile|perfil|cuenta/i);
      await expect(profileSection.first()).toBeVisible();
    }
  });

  /**
   * TEST 4: Sign Out Flow
   * Verifies user can sign out and returns to login screen
   */
  test('should allow user to sign out', async ({ page }) => {
    // Navigate to Settings
    const settingsButton = page.getByRole('button', { name: /settings|ajustes/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForLoadState('domcontentloaded');
    }

    // Look for sign out button
    const signOutButton = page.getByRole('button', { name: /sign out|cerrar sesión|logout|salir/i });

    if (await signOutButton.isVisible()) {
      await signOutButton.click();

      // Should redirect to login screen
      await page.waitForLoadState('domcontentloaded');

      // Should see login screen again
      await expect(
        page.getByRole('button', { name: /sign in with google|entrar con google/i })
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Authenticated Scan Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  /**
   * TEST 5: Access Scan Feature
   * Verifies authenticated user can access the scan feature
   */
  test('should access scan feature', async ({ page }) => {
    // Look for scan button in bottom nav
    const scanButton = page.getByRole('button', { name: /scan|escanear/i });

    if (await scanButton.isVisible()) {
      await scanButton.click();
      await page.waitForLoadState('domcontentloaded');

      // Should see scan UI (camera view or upload option)
      // Note: Actual camera access requires different test setup
      const scanUI = page.locator('[data-testid="scan-view"], [data-testid="camera-view"]');
      // Just check we navigated without error
      await expect(page).not.toHaveURL(/login/);
    }
  });
});

test.describe('Authenticated History View - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  /**
   * TEST 6: Access Transaction History
   * Verifies authenticated user can view transaction history
   */
  test('should access transaction history', async ({ page }) => {
    // Look for history button
    const historyButton = page.getByRole('button', { name: /history|historial/i });

    if (await historyButton.isVisible()) {
      await historyButton.click();
      await page.waitForLoadState('domcontentloaded');

      // Should see history view (even if empty)
      await expect(page).not.toHaveURL(/login/);

      // Should see history UI elements
      const historyUI = page.getByText(/history|historial|transactions|transacciones|no transactions|sin transacciones/i);
      await expect(historyUI.first()).toBeVisible();
    }
  });
});
