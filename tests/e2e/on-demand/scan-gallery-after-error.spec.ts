/**
 * Story 16-3: E2E test — gallery selection works after scan error dismissal
 *
 * Reproduces the original bug:
 *   scan -> error -> dismiss -> gallery select -> image should load
 *
 * Run command:
 *   npm run dev:staging  # in one terminal
 *   npx playwright test tests/e2e/on-demand/scan-gallery-after-error.spec.ts --project=staging --headed
 *
 * NOT included in any CI suite — on-demand only.
 * DEPENDS: 16-9 (staging deployment) for execution.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Guard: skip in CI
const isCI = !!process.env.CI;
test.skip(isCI, 'On-demand only — run manually against staging');

test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 360, height: 780 },
});

const STAGING_URL = 'http://localhost:5174';

// A tiny invalid file to trigger Gemini rejection (forces scan error)
const INVALID_IMAGE = path.resolve(__dirname, '../fixtures/invalid-receipt.txt');

// Valid test receipt for gallery re-select after error
const VALID_RECEIPT = path.resolve(
    __dirname, '../../../prompt-testing/test-cases/smb/charcuteria.jpg'
);

const TEST_USER = 'alice';

// Pre-flight: ensure fixtures exist
test.beforeAll(() => {
    // Create invalid receipt fixture if it doesn't exist
    const fixtureDir = path.resolve(__dirname, '../fixtures');
    if (!fs.existsSync(fixtureDir)) {
        fs.mkdirSync(fixtureDir, { recursive: true });
    }
    if (!fs.existsSync(INVALID_IMAGE)) {
        fs.writeFileSync(INVALID_IMAGE, 'not-an-image');
    }

    if (!fs.existsSync(VALID_RECEIPT)) {
        throw new Error(
            `Valid test receipt not found: ${VALID_RECEIPT}\n` +
            'Ensure prompt-testing/test-cases/smb/charcuteria.jpg exists.'
        );
    }
});

test.describe('Gallery Selection After Scan Error (Story 16-3)', () => {
    test('scan error -> dismiss -> gallery re-select works', async ({ page }) => {
        // 180s timeout: two scan attempts (error + success)
        test.setTimeout(180_000);

        // =================================================================
        // Step 1: Login as staging test user
        // =================================================================
        await page.goto(STAGING_URL);
        await page.waitForSelector('[data-testid="test-login-button"]', { timeout: 15000 });
        await page.click('[data-testid="test-login-button"]');

        const userBtn = page.locator(`[data-testid="test-user-${TEST_USER}"]`);
        await userBtn.waitFor({ state: 'visible', timeout: 5000 });
        await userBtn.click();

        await page.waitForSelector(
            '[data-testid="scan-button"], [data-testid="camera-button"]',
            { timeout: 15000 }
        );

        // =================================================================
        // Step 2: Start scan with invalid image to force error
        // =================================================================
        const scanButton = page.locator(
            '[data-testid="scan-button"], [data-testid="camera-button"]'
        );
        await scanButton.first().click();

        const fileInput = page.locator('input[type="file"]');
        await fileInput.waitFor({ state: 'attached', timeout: 10000 });
        await fileInput.setInputFiles(INVALID_IMAGE);

        // =================================================================
        // Step 3: Wait for error state, then dismiss/cancel
        // =================================================================
        // Error overlay should appear — look for cancel button by role
        const cancelButton = page.getByRole('button', { name: /cancel/i });
        await cancelButton.waitFor({ state: 'visible', timeout: 60_000 });
        await cancelButton.click();

        // =================================================================
        // Step 4: Verify we're back on dashboard (idle state)
        // =================================================================
        await page.waitForSelector(
            '[data-testid="scan-button"], [data-testid="camera-button"]',
            { timeout: 10000 }
        );

        // =================================================================
        // Step 5: Re-select from gallery with valid image
        // =================================================================
        await scanButton.first().click();
        const fileInput2 = page.locator('input[type="file"]');
        await fileInput2.waitFor({ state: 'attached', timeout: 10000 });
        await fileInput2.setInputFiles(VALID_RECEIPT);

        // =================================================================
        // Step 6: Verify image is processed (reaches editor/review)
        // =================================================================
        await page.waitForSelector(
            '[data-testid="transaction-editor"], [data-testid="scan-complete-modal"], [data-testid="edit-view"]',
            { timeout: 90_000 }
        );

        // Verify merchant field is populated (scan succeeded)
        const merchantField = page.locator(
            '[data-testid="merchant-field"], [data-testid="merchant-input"], input[name="merchant"]'
        ).first();
        await merchantField.waitFor({ state: 'visible', timeout: 5000 });
        const merchantValue = await merchantField.inputValue().catch(() =>
            merchantField.textContent().then(t => t || '')
        );
        expect(merchantValue.length).toBeGreaterThan(0);
    });
});
