/**
 * Fixture Pipeline Smoke Test (Plan B)
 *
 * Verifies the fixture system works end-to-end on staging:
 * login -> scan -> upload -> queueReceiptScan -> processReceiptScan (fixture) -> UI result
 *
 * Prerequisites:
 * - npm run dev:staging running on localhost:5174
 * - Staging CFs deployed with SCAN_FIXTURE_MODE=true
 * - Fixtures seeded: npm run fixtures:seed
 * - Alice has credits on staging
 *
 * Run: STAGING_URL=http://localhost:5174 npx playwright test tests/e2e/staging/fixture-pipeline-smoke.spec.ts --project=staging
 */
import { test, expect } from '@playwright/test'
import { resolve } from 'path'

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 360, height: 780 },
  actionTimeout: 15000,
})

const STAGING_URL = process.env.STAGING_URL || 'http://localhost:5174'
const TEST_IMAGE = resolve('prompt-testing/test-cases/convenience/dobler.jpg')

test.describe('Fixture Pipeline Smoke Test', () => {
  test('scan with fixture: dobler.jpg returns DOBLE R data', async ({ page }) => {
    test.setTimeout(120000)

    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // 1. Login as alice
    await page.goto(STAGING_URL)
    await page.waitForSelector('[data-testid="test-login-button"]', { timeout: 15000 })
    await page.click('[data-testid="test-login-button"]')
    await page.click('[data-testid="test-user-alice"]')

    // Wait for app to load after login
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 15000 }).catch(() =>
      page.waitForTimeout(3000)
    )

    // 2. Navigate to scan
    const scanButton = page.locator('[data-testid="scan-button"], [data-testid="fab-scan"], [aria-label*="scan" i], [aria-label*="escanear" i]').first()
    if (await scanButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await scanButton.click()
    } else {
      await page.goto(`${STAGING_URL}/scan`)
    }
    await page.waitForTimeout(1000)

    // 3. Select test image
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(TEST_IMAGE)
    await page.waitForTimeout(1500)

    // 4. Press Escanear (force: animation may not settle)
    await page.waitForTimeout(2000)
    await page.locator('button[aria-label="Escanear"]').first().click({ force: true })

    // 5. Wait for fixture data to appear — should be fast (<15s, no Gemini)
    await expect(page.getByText('DOBLE R')).toBeVisible({ timeout: 30000 })

    // 6. Verify fixture data details
    const pageContent = await page.textContent('body') ?? ''
    expect(pageContent).toContain('DOBLE R')
    expect(pageContent).toContain('23.660')

    await page.screenshot({ path: 'test-results/fixture-smoke/result.png', fullPage: true })

    // Log any scan-related errors for debugging (don't fail on Firestore internal errors)
    const scanErrors = errors.filter(e =>
      e.includes('queueReceiptScan') || e.includes('No fixture found')
    )
    if (scanErrors.length > 0) {
      console.log('Scan errors:', scanErrors)
    }
    expect(scanErrors).toHaveLength(0)
  })
})
