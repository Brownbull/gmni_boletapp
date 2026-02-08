/**
 * Multi-User E2E Tests: Verify Seeded Transactions
 *
 * This test verifies that the seeded transactions are visible in the UI for each test user.
 * Run this after seeding data with: npm run test:seed-multi-users
 *
 * Prerequisites:
 * - Firebase emulators running: npm run emulators
 * - Data seeded: npm run test:seed-multi-users
 * - Dev server running: npm run dev
 * - .env has VITE_E2E_MODE=emulator
 *
 * Run this test:
 *   npx playwright test tests/e2e/multi-user/verify-transactions.spec.ts --project=multi-user
 */

import { test, expect, Page } from '../fixtures/multi-user.js';
import { TestUserName } from '../helpers/firebase-auth.js';

// Expected transaction ranges based on seeding script logic
// With randomness in day selection, actual counts vary:
// Alice: ~25-35, Bob: ~25-55 (frequency 2 + 20% extra), Charlie: ~15-22, Diana: ~28-40
const EXPECTED_RANGES: Record<TestUserName, { min: number; max: number }> = {
  alice: { min: 20, max: 40 },
  bob: { min: 25, max: 60 }, // Bob can vary more due to 20% double-transaction chance
  charlie: { min: 12, max: 25 },
  diana: { min: 25, max: 45 },
};

/**
 * Navigate from Dashboard to Recent Scans view and extract the transaction count from the UI
 * The count is displayed as "{count} transacciones" or "{count} transactions" in Recent Scans view
 *
 * Navigation flow:
 * 1. App lands on Dashboard on "Últimos Escaneados" slide (default)
 * 2. Click "Ver todo" link (data-testid="view-all-link") to go to RecentScansView
 * 3. Read the transaction count from the view (no date filtering, shows ALL transactions)
 */
async function getTransactionCountFromUI(page: Page): Promise<number | null> {
  // Step 1: Stay on "Últimos Escaneados" slide (it's the default, no need to switch)
  // This slide's "Ver todo" goes to RecentScansView which shows ALL transactions without date filters

  // Step 2: Click "Ver todo" link to navigate to Recent Scans view
  const viewAllLink = page.getByTestId('view-all-link');
  const isLinkVisible = await viewAllLink.isVisible({ timeout: 10000 }).catch(() => false);

  if (!isLinkVisible) {
    console.log('  ⚠️  "Ver todo" link not visible on Dashboard');
    // Try alternative: look for any button/link with "Ver todo" text
    const altLink = page.getByText(/ver todo/i);
    const isAltVisible = await altLink.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (isAltVisible) {
      await altLink.first().click();
    } else {
      console.log('  ⚠️  No navigation link found');
      return null;
    }
  } else {
    await viewAllLink.click();
  }

  // Step 3: Wait for Recent Scans view to load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Step 4: Look for the transaction count text pattern
  // RecentScansView shows: "{count} transacciones" (es) or "{count} transactions" (en)
  const countLocator = page.locator('text=/\\d+\\s*(transacciones?|transactions?)/i');

  // Wait for the count to appear (might need time to load from Firestore)
  const isVisible = await countLocator.first().isVisible({ timeout: 10000 }).catch(() => false);

  if (!isVisible) {
    // Check if empty state is shown
    const emptyState = page.getByText(/sin transacciones|no transactions/i);
    const isEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    if (isEmpty) {
      console.log('  ⚠️  Empty state visible - no transactions found');
      return 0;
    }
    console.log('  ⚠️  Transaction count not found in History view');
    return null;
  }

  // Extract the number from the text
  const countText = await countLocator.first().textContent();
  const match = countText?.match(/(\d+)/);

  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Verify the user is authenticated (not on login page)
 */
async function verifyAuthenticated(page: Page, userName: string): Promise<boolean> {
  const loginButton = page.getByRole('button', {
    name: /sign in with google|entrar con google/i,
  });
  const isOnLogin = await loginButton.isVisible({ timeout: 3000 }).catch(() => false);

  if (isOnLogin) {
    console.log(`  ❌ ${userName} is NOT authenticated - on login page`);
    return false;
  }

  console.log(`  ✅ ${userName} is authenticated`);
  return true;
}

test.describe('Verify Seeded Transactions', () => {
  test('Alice: can see seeded transactions in History view', async ({ alicePage }) => {
    const userName: TestUserName = 'alice';
    console.log(`\n🧪 Testing ${userName.toUpperCase()}...`);

    // Navigate to app (lands on Dashboard)
    await alicePage.goto('/');
    await alicePage.waitForLoadState('domcontentloaded');
    await alicePage.waitForTimeout(3000); // Wait for Dashboard data to load

    // Verify authenticated
    const isAuth = await verifyAuthenticated(alicePage, userName);
    expect(isAuth, `${userName} should be authenticated`).toBe(true);

    // Get transaction count from History view (navigates via "Ver todo" link)
    const uiCount = await getTransactionCountFromUI(alicePage);
    console.log(`  📊 UI displays: ${uiCount} transactions`);

    // Take screenshot showing transactions in Recent Scans view
    await alicePage.screenshot({ path: 'test-results/verify-transactions/alice-transactions.png', fullPage: true });

    // Verify count is not null (UI found the count)
    expect(uiCount, 'Transaction count should be visible in UI').not.toBeNull();

    // Verify count is greater than 0
    expect(uiCount).toBeGreaterThan(0);

    // Verify count is within expected range
    expect(uiCount).toBeGreaterThanOrEqual(EXPECTED_RANGES[userName].min);
    expect(uiCount).toBeLessThanOrEqual(EXPECTED_RANGES[userName].max);

    console.log(
      `  ✅ ${userName}: ${uiCount} transactions (expected ${EXPECTED_RANGES[userName].min}-${EXPECTED_RANGES[userName].max})`
    );
  });

  test('Bob: can see seeded transactions in History view', async ({ bobPage }) => {
    const userName: TestUserName = 'bob';
    console.log(`\n🧪 Testing ${userName.toUpperCase()}...`);

    await bobPage.goto('/');
    await bobPage.waitForLoadState('domcontentloaded');
    await bobPage.waitForTimeout(3000);

    const isAuth = await verifyAuthenticated(bobPage, userName);
    expect(isAuth, `${userName} should be authenticated`).toBe(true);

    const uiCount = await getTransactionCountFromUI(bobPage);
    console.log(`  📊 UI displays: ${uiCount} transactions`);

    await bobPage.screenshot({ path: 'test-results/verify-transactions/bob-transactions.png', fullPage: true });

    expect(uiCount, 'Transaction count should be visible in UI').not.toBeNull();
    expect(uiCount).toBeGreaterThan(0);
    expect(uiCount).toBeGreaterThanOrEqual(EXPECTED_RANGES[userName].min);
    expect(uiCount).toBeLessThanOrEqual(EXPECTED_RANGES[userName].max);

    console.log(
      `  ✅ ${userName}: ${uiCount} transactions (expected ${EXPECTED_RANGES[userName].min}-${EXPECTED_RANGES[userName].max})`
    );
  });

  test('Charlie: can see seeded transactions in History view', async ({ charliePage }) => {
    const userName: TestUserName = 'charlie';
    console.log(`\n🧪 Testing ${userName.toUpperCase()}...`);

    await charliePage.goto('/');
    await charliePage.waitForLoadState('domcontentloaded');
    await charliePage.waitForTimeout(3000);

    const isAuth = await verifyAuthenticated(charliePage, userName);
    expect(isAuth, `${userName} should be authenticated`).toBe(true);

    const uiCount = await getTransactionCountFromUI(charliePage);
    console.log(`  📊 UI displays: ${uiCount} transactions`);

    await charliePage.screenshot({ path: 'test-results/verify-transactions/charlie-transactions.png', fullPage: true });

    expect(uiCount, 'Transaction count should be visible in UI').not.toBeNull();
    expect(uiCount).toBeGreaterThan(0);
    expect(uiCount).toBeGreaterThanOrEqual(EXPECTED_RANGES[userName].min);
    expect(uiCount).toBeLessThanOrEqual(EXPECTED_RANGES[userName].max);

    console.log(
      `  ✅ ${userName}: ${uiCount} transactions (expected ${EXPECTED_RANGES[userName].min}-${EXPECTED_RANGES[userName].max})`
    );
  });

  test('Diana: can see seeded transactions in History view', async ({ dianaPage }) => {
    const userName: TestUserName = 'diana';
    console.log(`\n🧪 Testing ${userName.toUpperCase()}...`);

    await dianaPage.goto('/');
    await dianaPage.waitForLoadState('domcontentloaded');
    await dianaPage.waitForTimeout(3000);

    const isAuth = await verifyAuthenticated(dianaPage, userName);
    expect(isAuth, `${userName} should be authenticated`).toBe(true);

    const uiCount = await getTransactionCountFromUI(dianaPage);
    console.log(`  📊 UI displays: ${uiCount} transactions`);

    await dianaPage.screenshot({ path: 'test-results/verify-transactions/diana-transactions.png', fullPage: true });

    expect(uiCount, 'Transaction count should be visible in UI').not.toBeNull();
    expect(uiCount).toBeGreaterThan(0);
    expect(uiCount).toBeGreaterThanOrEqual(EXPECTED_RANGES[userName].min);
    expect(uiCount).toBeLessThanOrEqual(EXPECTED_RANGES[userName].max);

    console.log(
      `  ✅ ${userName}: ${uiCount} transactions (expected ${EXPECTED_RANGES[userName].min}-${EXPECTED_RANGES[userName].max})`
    );
  });

  test('Summary: All users see their transactions in the UI', async ({
    alicePage,
    bobPage,
    charliePage,
    dianaPage,
  }) => {
    console.log('\n📊 MULTI-USER TRANSACTION SUMMARY\n');
    console.log('User      | UI Count | Expected Range | Status');
    console.log('----------|----------|----------------|-------');

    const pages: Record<TestUserName, Page> = {
      alice: alicePage,
      bob: bobPage,
      charlie: charliePage,
      diana: dianaPage,
    };

    const results: { name: string; count: number | null; expected: string; passed: boolean }[] = [];

    for (const [name, page] of Object.entries(pages)) {
      const userName = name as TestUserName;

      // Navigate to Dashboard
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const isAuth = await verifyAuthenticated(page, userName);
      if (!isAuth) {
        results.push({
          name: userName,
          count: null,
          expected: `${EXPECTED_RANGES[userName].min}-${EXPECTED_RANGES[userName].max}`,
          passed: false,
        });
        continue;
      }

      // Get count from History view (via "Ver todo" navigation)
      const uiCount = await getTransactionCountFromUI(page);
      const range = EXPECTED_RANGES[userName];
      const passed =
        uiCount !== null && uiCount > 0 && uiCount >= range.min && uiCount <= range.max;

      results.push({
        name: userName,
        count: uiCount,
        expected: `${range.min}-${range.max}`,
        passed,
      });
    }

    // Print summary table
    for (const result of results) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const countStr = result.count !== null ? String(result.count).padStart(8) : '    NULL';
      console.log(
        `${result.name.padEnd(9)} | ${countStr} | ${result.expected.padEnd(14)} | ${status}`
      );
    }

    console.log('');

    // Assert all passed
    const allPassed = results.every((r) => r.passed);
    expect(allPassed, 'All users should see their transactions within expected range').toBe(true);
  });
});
