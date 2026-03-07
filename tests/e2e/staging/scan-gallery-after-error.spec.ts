/**
 * Story 16-3: E2E test — gallery selection works after scan error dismissal
 *
 * Reproduces the original bug:
 *   scan -> error -> dismiss -> gallery select -> image should be accepted
 *
 * Run command:
 *   npm run dev:staging  # in one terminal
 *   npx playwright test tests/e2e/staging/scan-gallery-after-error.spec.ts --project=staging --headed
 *
 * Included in staging E2E suite.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loginAsUser } from '../helpers/staging-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 360, height: 780 },
});

const SCREENSHOT_DIR = 'test-results/scan-gallery-after-error';

// A tiny invalid file to trigger Gemini rejection (forces scan error)
const INVALID_IMAGE = path.resolve(__dirname, '../fixtures/invalid-receipt.txt');

// Valid test receipt for gallery re-select after error
const VALID_RECEIPT = path.resolve(
    __dirname, '../../../prompt-testing/test-cases/smb/charcuteria.jpg'
);

// Gallery file input selector (ScanFeature.tsx renders this with [multiple])
// Camera input has [capture="environment"] — distinct from gallery
const GALLERY_INPUT = 'input[type="file"][multiple]';

// Pre-flight: ensure fixtures exist
test.beforeAll(() => {
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

    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
});

test.describe('Gallery Selection After Scan Error (Story 16-3)', () => {
    test('scan error -> dismiss -> gallery re-select works', async ({ page }) => {
        // 120s timeout: error scan + gallery reselect verification
        test.setTimeout(120_000);

        try {
            // =============================================================
            // Step 1: Login as staging test user
            // =============================================================
            await loginAsUser(page, 'alice');

            await page.waitForSelector(
                '[data-testid="scan-fab"]',
                { timeout: 15000 }
            );

            await page.screenshot({
                path: `${SCREENSHOT_DIR}/01-logged-in-dashboard.png`,
                fullPage: true,
            });

            // =============================================================
            // Step 2: Start scan with invalid image to force error
            // =============================================================
            const scanButton = page.locator('[data-testid="scan-fab"]');
            await scanButton.click();

            const galleryInput = page.locator(GALLERY_INPUT);
            await galleryInput.waitFor({ state: 'attached', timeout: 10000 });
            await galleryInput.setInputFiles(INVALID_IMAGE);

            // =============================================================
            // Step 3: Wait for error state, then dismiss/cancel
            // =============================================================
            // ScanError cancel button lives INSIDE the overlay dialog.
            // Scope to overlay to avoid hitting the editor's own cancel button.
            const scanErrorOverlay = page.locator('div[role="dialog"]:has([data-testid="scan-overlay-backdrop"])');
            await scanErrorOverlay.waitFor({ state: 'visible', timeout: 60_000 });
            const cancelButton = scanErrorOverlay.getByRole('button', { name: /cancel/i });

            await page.screenshot({
                path: `${SCREENSHOT_DIR}/02-scan-error-visible.png`,
                fullPage: true,
            });

            await cancelButton.click();

            // =============================================================
            // Step 4: Verify store reset to idle (AC-2)
            // =============================================================
            // FAB visible = navigated back to dashboard
            await page.waitForSelector(
                '[data-testid="scan-fab"]',
                { timeout: 10000 }
            );
            // Overlay absent = store is in idle phase (ScanOverlay returns
            // null when state === 'idle', removing backdrop from DOM)
            const overlayBackdrop = page.locator('[data-testid="scan-overlay-backdrop"]');
            await expect(overlayBackdrop).not.toBeVisible({ timeout: 5000 });

            await page.screenshot({
                path: `${SCREENSHOT_DIR}/03-back-to-dashboard.png`,
                fullPage: true,
            });

            // =============================================================
            // Step 5: Re-select from gallery with valid image
            // =============================================================
            await scanButton.click();
            await page.locator(GALLERY_INPUT).waitFor({ state: 'attached', timeout: 10000 });
            await page.locator(GALLERY_INPUT).setInputFiles(VALID_RECEIPT);

            // =============================================================
            // Step 6: Verify image was accepted (scan overlay appears)
            // =============================================================
            // The bug: gallery select was blocked after error dismissal
            // because the phase guard rejected setImages (not reset to idle).
            // Fix: handleScanOverlayDismiss now fully resets the store.
            //
            // Proof: scan overlay appears at all — the image was accepted
            // and the scan pipeline started. Whether the second scan succeeds
            // or errors depends on staging Cloud Functions (16-9 deployment).
            // The overlay appearing proves the fix works regardless.
            await overlayBackdrop.waitFor({ state: 'visible', timeout: 30_000 });

            await page.screenshot({
                path: `${SCREENSHOT_DIR}/04-reselect-processing.png`,
                fullPage: true,
            });
        } finally {
            // Cancel any in-flight scan to avoid orphaned transactions
            const overlay = page.locator('[data-testid="scan-overlay-backdrop"]');
            if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
                const overlayDialog = page.locator('div[role="dialog"]:has([data-testid="scan-overlay-backdrop"])');
                await overlayDialog.getByRole('button', { name: /cancel/i }).click().catch(() => {});
            }
        }
    });
});
