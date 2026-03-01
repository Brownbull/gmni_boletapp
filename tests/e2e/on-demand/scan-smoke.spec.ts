/**
 * Story 15b-5a: On-demand E2E scan smoke test
 *
 * Exercises the full scan flow against staging:
 *   upload receipt image → AI analysis → transaction fields populated
 *
 * Run command:
 *   npm run dev:staging  # in one terminal
 *   npx playwright test tests/e2e/on-demand/scan-smoke.spec.ts --project=staging --headed
 *
 * NOT included in any CI suite — on-demand only.
 * Excluded via playwright.config.ts testIgnore + CI guard below.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Guard: skip in CI — defense-in-depth alongside playwright.config.ts testIgnore
const isCI = !!process.env.CI;
test.skip(isCI, 'On-demand only — run manually against staging');

test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 360, height: 780 },
});

const STAGING_URL = 'http://localhost:5174';
const TEST_RECEIPT = path.resolve(__dirname, '../../../prompt-testing/test-cases/smb/charcuteria.jpg');

// Staging test user from staging-test-users.json
const TEST_USER = 'alice';

// Pre-flight: verify test receipt exists before running
if (!fs.existsSync(TEST_RECEIPT)) {
    throw new Error(
        `Test receipt not found: ${TEST_RECEIPT}\n` +
        'Ensure prompt-testing/test-cases/smb/charcuteria.jpg exists.'
    );
}

test.describe('Scan Smoke Test', () => {
    test('full scan flow: upload receipt → AI analysis → transaction populated', async ({ page }) => {
        // 120s timeout: Gemini cold-start + image upload + AI processing can take 30-60s
        test.setTimeout(120_000);

        // =====================================================================
        // Step 1: Login as staging test user via TestUserMenu
        // =====================================================================
        await page.goto(STAGING_URL);
        await page.waitForSelector('[data-testid="test-login-button"]', { timeout: 15000 });
        await page.click('[data-testid="test-login-button"]');

        const userBtn = page.locator(`[data-testid="test-user-${TEST_USER}"]`);
        await userBtn.waitFor({ state: 'visible', timeout: 5000 });
        await userBtn.click();

        // Wait for auth to complete — dashboard should be visible
        await page.waitForSelector('[data-testid="scan-button"], [data-testid="camera-button"]', { timeout: 15000 });
        expect(page.url()).not.toContain('login');

        // =====================================================================
        // Step 2: Navigate to scan / open file picker
        // =====================================================================
        const scanButton = page.locator('[data-testid="scan-button"], [data-testid="camera-button"]');
        await scanButton.first().click();

        // Wait for scan UI to be ready (file input available)
        const fileInput = page.locator('input[type="file"]');
        await fileInput.waitFor({ state: 'attached', timeout: 10000 });

        // =====================================================================
        // Step 3: Upload test receipt image via file input
        // =====================================================================
        await fileInput.setInputFiles(TEST_RECEIPT);

        // =====================================================================
        // Step 4: Wait for AI analysis to complete
        // =====================================================================
        // The scan overlay shows processing state, then transitions to editor
        await page.waitForSelector(
            '[data-testid="transaction-editor"], [data-testid="scan-complete-modal"], [data-testid="edit-view"]',
            { timeout: 90_000 }
        );

        // =====================================================================
        // Step 5: Verify transaction fields are populated
        // =====================================================================
        // Verify merchant name is populated (any non-empty value)
        const merchantField = page.locator(
            '[data-testid="merchant-field"], [data-testid="merchant-input"], input[name="merchant"]'
        );

        if (await merchantField.isVisible({ timeout: 5000 }).catch(() => false)) {
            const merchantValue = await merchantField.inputValue().catch(() =>
                merchantField.textContent().then(t => t || '')
            );
            expect(merchantValue.length).toBeGreaterThan(0);
        }

        // Verify total is populated and reasonable for charcuteria receipt (~17,928 CLP)
        const totalField = page.locator(
            '[data-testid="total-field"], [data-testid="total-input"], input[name="total"]'
        );
        if (await totalField.isVisible({ timeout: 3000 }).catch(() => false)) {
            const totalValue = await totalField.inputValue().catch(() =>
                totalField.textContent().then(t => t || '0')
            );
            const numericTotal = parseFloat(totalValue.replace(/[^0-9.]/g, ''));
            // Expect total between 10,000 and 25,000 CLP (reasonable range for this receipt)
            expect(numericTotal).toBeGreaterThan(10000);
            expect(numericTotal).toBeLessThan(25000);
        }

        // Verify items exist (prefer data-testid selectors)
        const itemRows = page.locator(
            '[data-testid^="item-row"], [data-testid^="transaction-item"]'
        );
        const itemCount = await itemRows.count();
        expect(itemCount).toBeGreaterThanOrEqual(1);
    });
});
