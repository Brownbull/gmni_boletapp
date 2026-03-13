/**
 * Bug reproduction: scan succeeds on backend but UI fails to transition
 *
 * Reported behavior:
 *   upload receipt → AI succeeds → brief message flashes → UI stuck, no editor
 *   Backend logs show 200 OK + transaction created, but frontend doesn't proceed.
 *
 * This test uploads a real receipt, waits for the scan overlay to appear,
 * then checks whether the transaction editor becomes visible afterward.
 *
 * Run:
 *   npm run dev:staging  # in one terminal
 *   npx playwright test tests/e2e/staging/scan-post-success-transition.spec.ts --project=staging --headed
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

const SCREENSHOT_DIR = 'test-results/scan-post-success-transition';
const VALID_RECEIPT = path.resolve(
  __dirname, '../../../prompt-testing/test-cases/smb/charcuteria.jpg'
);

// Gallery file input selector (ScanFeature.tsx renders this with [multiple])
const GALLERY_INPUT = 'input[type="file"][multiple]';

// Pre-flight checks
test.beforeAll(() => {
  if (!fs.existsSync(VALID_RECEIPT)) {
    throw new Error(
      `Test receipt not found: ${VALID_RECEIPT}\n` +
      'Ensure prompt-testing/test-cases/smb/charcuteria.jpg exists.'
    );
  }
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Scan Post-Success Transition (Bug Reproduction)', () => {
  test('scan success should transition to transaction editor', async ({ page }) => {
    // 120s: Gemini cold-start + image upload + AI processing
    test.setTimeout(120_000);

    // =================================================================
    // Step 1: Login as staging test user
    // =================================================================
    await loginAsUser(page, 'alice');
    await page.waitForSelector('[data-testid="scan-fab"]', { timeout: 15000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-ready.png`,
      fullPage: true,
    });

    // =================================================================
    // Step 2: Start scan via FAB + upload receipt
    // =================================================================
    const scanFab = page.locator('[data-testid="scan-fab"]');
    await scanFab.click();

    const galleryInput = page.locator(GALLERY_INPUT);
    await galleryInput.waitFor({ state: 'attached', timeout: 10000 });
    await galleryInput.setInputFiles(VALID_RECEIPT);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-scan-started.png`,
      fullPage: true,
    });

    // =================================================================
    // Step 3: Wait for scan overlay (processing state)
    // =================================================================
    const overlayBackdrop = page.locator('[data-testid="scan-overlay-backdrop"]');

    // Overlay should appear during processing (may be brief)
    const overlayAppeared = await overlayBackdrop
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (overlayAppeared) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-overlay-processing.png`,
        fullPage: true,
      });
    }

    // =================================================================
    // Step 4: THE KEY CHECK — scan result UI should appear
    // =================================================================
    // After scan succeeds, either QuickSaveCard (high confidence) or
    // transaction editor (low confidence) should render. If this times
    // out, the bug is confirmed: scan succeeds but UI is stuck.
    const editorSelector = [
      '[data-testid="transaction-editor"]',
      '[data-testid="edit-view"]',
      '[data-testid="scan-complete-modal"]',
      '[data-testid="quick-save-button"]',
      '[data-testid="quick-save-edit-button"]',
    ].join(', ');

    try {
      await page.waitForSelector(editorSelector, { timeout: 90_000 });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-editor-visible-SUCCESS.png`,
        fullPage: true,
      });

      // Verify merchant field is populated
      const merchantField = page.locator(
        '[data-testid="merchant-field"], [data-testid="merchant-input"], input[name="merchant"]'
      ).first();
      const merchantVisible = await merchantField
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

      if (merchantVisible) {
        const merchantValue = await merchantField.inputValue().catch(() =>
          merchantField.textContent().then(t => t || '')
        );
        expect(merchantValue.length).toBeGreaterThan(0);
      }
    } catch {
      // Bug reproduced: editor never appeared
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-editor-MISSING-BUG-CONFIRMED.png`,
        fullPage: true,
      });

      // Capture current scan store state via console for debugging
      const storeState = await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = (window as Record<string, unknown>).__scanStore as { getState?: () => Record<string, unknown> } | undefined;
        if (store?.getState) {
          const s = store.getState();
          return {
            phase: s.phase,
            overlayState: s.overlayState,
            error: s.error,
            mode: s.mode,
          };
        }
        return 'store not exposed on window';
      }).catch(() => 'could not access store');

      // Fail with clear diagnostic
      expect.soft(false,
        `BUG CONFIRMED: Transaction editor did not appear after successful scan.\n` +
        `Scan store state: ${JSON.stringify(storeState)}\n` +
        `Screenshot saved: ${SCREENSHOT_DIR}/04-editor-MISSING-BUG-CONFIRMED.png`
      ).toBeTruthy();
    }
  });
});
