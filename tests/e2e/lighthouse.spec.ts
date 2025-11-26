/**
 * E2E Tests: Lighthouse Performance Audits
 *
 * Story 3.6: Performance Baselines & Lighthouse CI
 *
 * This test suite uses playwright-lighthouse to run Lighthouse audits on
 * authenticated views. It covers all 5 major views as required by AC #7.
 *
 * Test Strategy:
 * --------------
 * 1. Authenticate using test login bypass (from Story 3.5)
 * 2. Navigate to each view
 * 3. Run Lighthouse audit using playwright-lighthouse
 * 4. Validate performance thresholds
 * 5. Save reports to lighthouse-reports/
 *
 * Acceptance Criteria Coverage:
 * ------------------------------
 * AC#1: Lighthouse CI installed ✅ (via playwright-lighthouse)
 * AC#2: GitHub Actions integration ✅ (runs in CI via npm run test:e2e)
 * AC#3: Performance baselines documented (in performance-baselines.md)
 * AC#6: Performance monitoring operational ✅ (runs on every PR)
 * AC#7: 5+ major views scanned ✅ (Dashboard, Scan, Trends, History, Settings)
 *
 * Performance Targets (from Tech Spec):
 * -------------------------------------
 * - Performance: 80+ (warn if below)
 * - Accessibility: 90+ (warn if below)
 * - Best Practices: 90+ (warn if below)
 * - SEO: 90+ (warn if below)
 *
 * References:
 * -----------
 * - Tech Spec: docs/sprint-artifacts/epic3/epic-3-tech-spec.md § Phase 4
 * - playwright-lighthouse: https://github.com/nicholasio/playwright-lighthouse
 */

import { test, expect, chromium } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import * as fs from 'fs';
import * as path from 'path';

// Lighthouse thresholds (warn mode - don't fail, just report)
const THRESHOLDS = {
  performance: 70, // Lower threshold for CI environment (80 target, 70 warn)
  accessibility: 85, // 90 target, 85 warn
  'best-practices': 85, // 90 target, 85 warn
  seo: 85 // 90 target, 85 warn
};

// Output directory for reports
const REPORTS_DIR = path.join(process.cwd(), 'lighthouse-reports');

// Ensure reports directory exists
function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

// Lighthouse configuration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1
    },
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    skipAudits: ['uses-http2', 'is-on-https']
  }
};

test.describe('Lighthouse Performance Audits', () => {
  test.setTimeout(120000); // 2 minute timeout for Lighthouse audits

  /**
   * Helper to authenticate before tests
   */
  async function authenticate(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click test login button to authenticate
    const testLoginButton = page.getByTestId('test-login-button');
    await expect(testLoginButton).toBeVisible({ timeout: 10000 });
    await testLoginButton.click();

    // Wait for authentication and dashboard to load
    await page.waitForSelector('text=/Dashboard|Inicio/i', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  }

  test.beforeAll(() => {
    ensureReportsDir();
  });

  /**
   * TEST 1: Login View Performance Audit
   * Scans the unauthenticated login page
   */
  test('Login view should meet performance thresholds', async () => {
    // Launch browser with remote debugging port for Lighthouse
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9222']
    });
    const page = await browser.newPage();

    try {
      await page.goto('http://localhost:5173/');
      await page.waitForLoadState('networkidle');

      const result = await playAudit({
        page,
        port: 9222,
        thresholds: THRESHOLDS,
        reports: {
          formats: { html: true, json: true },
          name: 'lighthouse-login',
          directory: REPORTS_DIR
        },
        config: lighthouseConfig
      });

      // Log scores for visibility
      console.log('\n📊 Login View Lighthouse Scores:');
      console.log(`  Performance: ${Math.round(result.lhr.categories.performance.score * 100)}`);
      console.log(`  Accessibility: ${Math.round(result.lhr.categories.accessibility.score * 100)}`);
      console.log(`  Best Practices: ${Math.round(result.lhr.categories['best-practices'].score * 100)}`);
      console.log(`  SEO: ${Math.round(result.lhr.categories.seo.score * 100)}`);

      // Assertions (soft - warn only)
      expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(THRESHOLDS.performance);
    } finally {
      await browser.close();
    }
  });

  /**
   * TEST 2: Dashboard View Performance Audit
   * Scans the authenticated dashboard view
   */
  test('Dashboard view should meet performance thresholds', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9223']
    });
    const page = await browser.newPage();

    try {
      await authenticate(page);

      // Already on dashboard after authentication
      await page.waitForLoadState('networkidle');

      const result = await playAudit({
        page,
        port: 9223,
        thresholds: THRESHOLDS,
        reports: {
          formats: { html: true, json: true },
          name: 'lighthouse-dashboard',
          directory: REPORTS_DIR
        },
        config: lighthouseConfig
      });

      console.log('\n📊 Dashboard View Lighthouse Scores:');
      console.log(`  Performance: ${Math.round(result.lhr.categories.performance.score * 100)}`);
      console.log(`  Accessibility: ${Math.round(result.lhr.categories.accessibility.score * 100)}`);
      console.log(`  Best Practices: ${Math.round(result.lhr.categories['best-practices'].score * 100)}`);
      console.log(`  SEO: ${Math.round(result.lhr.categories.seo.score * 100)}`);

      expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(THRESHOLDS.performance);
    } finally {
      await browser.close();
    }
  });

  /**
   * TEST 3: Scan View Performance Audit
   */
  test('Scan view should meet performance thresholds', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9224']
    });
    const page = await browser.newPage();

    try {
      await authenticate(page);

      // Navigate to Scan view
      await page.getByLabel(/^(Scan|Escanear)$/i).click();
      await page.waitForLoadState('networkidle');

      const result = await playAudit({
        page,
        port: 9224,
        thresholds: THRESHOLDS,
        reports: {
          formats: { html: true, json: true },
          name: 'lighthouse-scan',
          directory: REPORTS_DIR
        },
        config: lighthouseConfig
      });

      console.log('\n📊 Scan View Lighthouse Scores:');
      console.log(`  Performance: ${Math.round(result.lhr.categories.performance.score * 100)}`);
      console.log(`  Accessibility: ${Math.round(result.lhr.categories.accessibility.score * 100)}`);
      console.log(`  Best Practices: ${Math.round(result.lhr.categories['best-practices'].score * 100)}`);
      console.log(`  SEO: ${Math.round(result.lhr.categories.seo.score * 100)}`);

      expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(THRESHOLDS.performance);
    } finally {
      await browser.close();
    }
  });

  /**
   * TEST 4: Trends View Performance Audit
   */
  test('Trends view should meet performance thresholds', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9225']
    });
    const page = await browser.newPage();

    try {
      await authenticate(page);

      // Navigate to Trends view
      await page.getByRole('button', { name: /Trends|Tendencias/i }).click();
      await page.waitForLoadState('networkidle');

      const result = await playAudit({
        page,
        port: 9225,
        thresholds: THRESHOLDS,
        reports: {
          formats: { html: true, json: true },
          name: 'lighthouse-trends',
          directory: REPORTS_DIR
        },
        config: lighthouseConfig
      });

      console.log('\n📊 Trends View Lighthouse Scores:');
      console.log(`  Performance: ${Math.round(result.lhr.categories.performance.score * 100)}`);
      console.log(`  Accessibility: ${Math.round(result.lhr.categories.accessibility.score * 100)}`);
      console.log(`  Best Practices: ${Math.round(result.lhr.categories['best-practices'].score * 100)}`);
      console.log(`  SEO: ${Math.round(result.lhr.categories.seo.score * 100)}`);

      expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(THRESHOLDS.performance);
    } finally {
      await browser.close();
    }
  });

  /**
   * TEST 5: History View Performance Audit
   */
  test('History view should meet performance thresholds', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9226']
    });
    const page = await browser.newPage();

    try {
      await authenticate(page);

      // Navigate to History view
      await page.getByRole('button', { name: /History|Historial/i }).click();
      await page.waitForLoadState('networkidle');

      const result = await playAudit({
        page,
        port: 9226,
        thresholds: THRESHOLDS,
        reports: {
          formats: { html: true, json: true },
          name: 'lighthouse-history',
          directory: REPORTS_DIR
        },
        config: lighthouseConfig
      });

      console.log('\n📊 History View Lighthouse Scores:');
      console.log(`  Performance: ${Math.round(result.lhr.categories.performance.score * 100)}`);
      console.log(`  Accessibility: ${Math.round(result.lhr.categories.accessibility.score * 100)}`);
      console.log(`  Best Practices: ${Math.round(result.lhr.categories['best-practices'].score * 100)}`);
      console.log(`  SEO: ${Math.round(result.lhr.categories.seo.score * 100)}`);

      expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(THRESHOLDS.performance);
    } finally {
      await browser.close();
    }
  });

  /**
   * TEST 6: Settings View Performance Audit
   */
  test('Settings view should meet performance thresholds', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9227']
    });
    const page = await browser.newPage();

    try {
      await authenticate(page);

      // Navigate to Settings view
      await page.getByRole('button', { name: /Settings|Ajustes/i }).click();
      await page.waitForLoadState('networkidle');

      const result = await playAudit({
        page,
        port: 9227,
        thresholds: THRESHOLDS,
        reports: {
          formats: { html: true, json: true },
          name: 'lighthouse-settings',
          directory: REPORTS_DIR
        },
        config: lighthouseConfig
      });

      console.log('\n📊 Settings View Lighthouse Scores:');
      console.log(`  Performance: ${Math.round(result.lhr.categories.performance.score * 100)}`);
      console.log(`  Accessibility: ${Math.round(result.lhr.categories.accessibility.score * 100)}`);
      console.log(`  Best Practices: ${Math.round(result.lhr.categories['best-practices'].score * 100)}`);
      console.log(`  SEO: ${Math.round(result.lhr.categories.seo.score * 100)}`);

      expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(THRESHOLDS.performance);
    } finally {
      await browser.close();
    }
  });
});
