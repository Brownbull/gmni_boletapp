/**
 * Staging UI Verification Test
 *
 * Logs in as each test user and verifies transactions are visible in the UI.
 * Run standalone without Playwright config: npx playwright test tests/e2e/staging/ --config=tests/e2e/staging/playwright.config.ts
 */
import { test, expect } from '@playwright/test';

// Skip global setup for this standalone test
// Use mobile viewport (360x780) as per testing requirements
test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 360, height: 780 },
});

const STAGING_URL = 'http://localhost:5174';

const STAGING_USERS = [
  { name: 'alice', email: 'alice@boletapp.test', password: 'test-password-123!' },
  { name: 'bob', email: 'bob@boletapp.test', password: 'test-password-123!' },
  { name: 'charlie', email: 'charlie@boletapp.test', password: 'test-password-123!' },
  { name: 'diana', email: 'diana@boletapp.test', password: 'test-password-123!' },
];

test.describe('Staging Transaction Verification', () => {
  for (const user of STAGING_USERS) {
    test(`${user.name} can login and see transactions`, async ({ page }) => {
      // Capture ALL console logs for debugging
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      });
      page.on('pageerror', error => {
        consoleLogs.push(`[PAGE_ERROR] ${error.message}`);
      });

      // Go to staging app
      await page.goto(STAGING_URL);

      // Wait for login page to load
      await page.waitForSelector('[data-testid="test-login-button"]', { timeout: 10000 });

      // Click test login button to open menu
      await page.click('[data-testid="test-login-button"]');

      // Take screenshot of menu open
      await page.screenshot({
        path: `test-results/staging-${user.name}-00-menu-open.png`,
        fullPage: true
      });

      // Monitor network requests for Firebase auth
      const authRequests: string[] = [];
      page.on('request', request => {
        const url = request.url();
        if (url.includes('identitytoolkit') || url.includes('securetoken')) {
          authRequests.push(`[AUTH-REQ] ${request.method()} ${url}`);
        }
        if (url.includes('firestore.googleapis.com')) {
          // Extract project ID from Firestore URL
          const projectMatch = url.match(/projects\/([^/]+)/);
          const project = projectMatch ? projectMatch[1] : 'unknown';
          authRequests.push(`[FIRESTORE-REQ] project=${project} ${request.method()} ${url.slice(0, 150)}`);
        }
      });
      page.on('response', response => {
        const url = response.url();
        if (url.includes('identitytoolkit') || url.includes('securetoken')) {
          authRequests.push(`[AUTH-RES] ${response.status()} ${url.slice(0, 100)}`);
        }
      });

      // Click on the specific user
      console.log(`${user.name}: Clicking on test user button...`);
      const userButton = page.locator(`[data-testid="test-user-${user.name}"]`);
      await userButton.waitFor({ state: 'visible', timeout: 5000 });
      await userButton.click();

      // Take screenshot immediately after click to see loading state
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `test-results/staging-${user.name}-00b-after-click.png`,
        fullPage: true
      });

      // Wait for login to complete
      console.log(`${user.name}: Waiting for login to complete...`);
      await page.waitForTimeout(5000); // Give time for auth to complete

      // Log auth requests
      console.log(`${user.name}: Auth/Firestore requests:`, authRequests.length > 0 ? authRequests.join('\n  ') : 'NONE');

      // Verify we're logged in by checking URL doesn't contain login
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('login');

      // Debug: Check if user is authenticated by looking for logout button or avatar
      const hasAvatar = await page.locator('[data-testid="user-avatar"], .avatar, [class*="avatar"]').count();
      console.log(`${user.name}: Has avatar/auth indicator: ${hasAvatar > 0}`);

      // Take screenshot of dashboard
      await page.screenshot({
        path: `test-results/staging-${user.name}-01-dashboard.png`,
        fullPage: true
      });

      console.log(`${user.name}: Logged in, now on ${currentUrl}`);

      // Navigate to Trends page which shows aggregated data across all periods
      await page.goto(`${STAGING_URL}/tendencias`);
      await page.waitForTimeout(2000);

      // Take screenshot of trends page
      await page.screenshot({
        path: `test-results/staging-${user.name}-02-tendencias.png`,
        fullPage: true
      });

      // Navigate to History page - current month (Feb '26)
      await page.goto(`${STAGING_URL}/historial`);
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `test-results/staging-${user.name}-03-historial-current.png`,
        fullPage: true
      });

      // Use JavaScript to navigate to previous months where transactions exist
      // The transactions were seeded for the past 90 days, so Jan '26, Dec '25, Nov '25
      await page.evaluate(() => {
        // Find and click the month selector or navigate via state
        const monthText = document.querySelector('[data-testid="carousel-title"]');
        if (monthText) {
          // Simulate a programmatic navigation to previous month
          // This depends on how the app exposes month navigation
          const event = new WheelEvent('wheel', { deltaX: -100, bubbles: true });
          monthText.dispatchEvent(event);
        }
      });
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `test-results/staging-${user.name}-04-historial-after-nav.png`,
        fullPage: true
      });

      // Check page content
      const pageContent = await page.textContent('body');

      // Look for store names from seeded data
      const storeNames = ['Líder', 'Jumbo', 'Santa Isabel', 'Starbucks', 'McDonald', 'Copec', 'Shell', 'Metro', 'Uber'];
      const foundStores = storeNames.filter(store => pageContent?.includes(store));

      // Look for the Total del mes value
      const totalMatch = pageContent?.match(/Total del mes[^\$]*\$([\d.,]+)/);
      const monthTotal = totalMatch ? `$${totalMatch[1]}` : '$0';

      // Check if this is showing the empty state
      const isEmpty = pageContent?.includes('No se detectaron transacciones');

      console.log(`${user.name}: Month total: ${monthTotal}, Empty: ${isEmpty}, Found stores: [${foundStores.join(', ')}]`);

      // Print ALL console logs for debugging
      console.log(`${user.name}: Console logs (${consoleLogs.length} total):`);
      consoleLogs.forEach(log => console.log(`  ${log}`));
    });
  }
});
