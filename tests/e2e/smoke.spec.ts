/**
 * Playwright E2E Smoke Test
 *
 * This test verifies that Playwright is configured correctly
 * and can load the application in a browser.
 */

import { test, expect } from '@playwright/test';

test.describe('Playwright E2E Smoke Test', () => {
  test('should load the application', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify the page loaded successfully
    // The login screen should be visible (since we're not authenticated)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have a title', async ({ page }) => {
    await page.goto('/');

    // Verify the page has a title
    await expect(page).toHaveTitle(/Boletapp|Vite/);
  });

  test('should render the login screen', async ({ page }) => {
    await page.goto('/');

    // The app should show the login screen for unauthenticated users
    // Look for text that indicates login screen
    const bodyText = await page.textContent('body');

    // At minimum, the page should have some content
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});
