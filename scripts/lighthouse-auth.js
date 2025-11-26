/**
 * Lighthouse Puppeteer Script for Authentication
 *
 * This script handles Firebase Auth login before Lighthouse audits.
 * Used by Lighthouse CI to scan authenticated views.
 *
 * Usage: Configured in lighthouserc.json as puppeteerScript
 *
 * References:
 * - Story 3.5: Test authentication bypass pattern
 * - Story 3.6: Lighthouse CI for authenticated views
 */

const TEST_USER_EMAIL = 'khujta@gmail.com';
const TEST_USER_PASSWORD = 'password.123';

/**
 * Wait for page navigation and network to settle
 */
async function waitForNavigation(page, timeout = 10000) {
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout });
  } catch {
    // Navigation may have already completed
  }
}

/**
 * Main puppeteer script for Lighthouse CI
 * @param {import('puppeteer').Browser} browser - Puppeteer browser instance
 * @param {object} context - Lighthouse context
 * @param {object} context.options - Lighthouse options
 */
async function setup(browser, context) {
  const page = await browser.newPage();

  // Navigate to the app
  await page.goto(context.url || 'http://localhost:5173/');
  await page.waitForSelector('[data-testid="test-login-button"]', {
    timeout: 10000,
    visible: true
  });

  // Click the test login button to trigger email/password auth
  await page.click('[data-testid="test-login-button"]');

  // Wait for authentication to complete (dashboard to load)
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || '';
      return text.includes('Dashboard') || text.includes('Inicio');
    },
    { timeout: 15000 }
  );

  // Wait for network to settle
  await page.waitForNetworkIdle({ idleTime: 1000 });

  // Close the page - Lighthouse will create its own
  await page.close();
}

module.exports = setup;
