/**
 * Playwright Global Setup for Authenticated E2E Tests
 *
 * This setup runs ONCE before all E2E tests to:
 * 1. Authenticate via the "Test Login" button in the UI
 * 2. Inject Firebase auth state into localStorage for persistence
 * 3. Save the browser state for reuse in tests
 *
 * Mode Selection:
 * - Emulator mode (default): Uses Firebase Auth Emulator
 * - Production mode: Set E2E_USE_PRODUCTION=true to use real Firebase
 *
 * @see https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import {
  ensureTestUserAuthenticated,
  getTestUser,
  USE_PRODUCTION_AUTH,
  createFirebaseAuthUser,
  getFirebaseAuthStorageKey,
} from './helpers/firebase-auth.js';

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to save authenticated state
const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

// Firebase API key from environment
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || '';

/**
 * Global setup function executed before all tests.
 */
async function globalSetup(config: FullConfig) {
  const mode = USE_PRODUCTION_AUTH ? 'PRODUCTION' : 'EMULATOR';
  console.log(`\n🔐 [E2E Global Setup] Starting authentication setup (${mode} mode)...\n`);

  // Ensure .auth directory exists
  const authDir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`📁 Created auth directory: ${authDir}`);
  }

  // Get base URL from config
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5174';
  console.log(`🌐 Base URL: ${baseURL}`);

  // Get test user based on mode
  const testUser = getTestUser();

  try {
    // Step 1: Get auth tokens via API (needed for localStorage injection)
    console.log(`👤 Authenticating test user: ${testUser.email}`);
    const authResponse = await ensureTestUserAuthenticated(testUser);
    console.log(`✅ Test user authenticated via API`);

    // Step 2: Create browser context
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Step 3: Navigate to app
    console.log('🌐 Loading app...');
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

    // Step 4: Click the "Test Login" button to open user selection menu
    console.log('🔑 Looking for Test Login button...');
    const testLoginButton = page.locator('[data-testid="test-login-button"]');

    if (await testLoginButton.isVisible({ timeout: 10000 })) {
      console.log('✅ Found Test Login button - clicking to open menu...');
      await testLoginButton.click();

      // Wait for menu to appear and select the Default user
      console.log('📋 Selecting Default test user from menu...');
      const defaultUserButton = page.locator('[data-testid="test-user-default"]');
      await defaultUserButton.waitFor({ state: 'visible', timeout: 5000 });
      await defaultUserButton.click();

      // Wait for authentication to complete
      console.log('⏳ Waiting for authentication...');
      await page.waitForSelector('[data-testid="bottom-nav"], nav button, [data-testid="dashboard-view"]', {
        timeout: 20000,
      });
      console.log('✅ Successfully authenticated in browser!');

      // Step 5: Inject Firebase auth state into localStorage
      // This ensures the auth persists when Playwright restores storage state
      console.log('💉 Injecting Firebase auth state into localStorage for persistence...');
      const authUser = createFirebaseAuthUser(authResponse);
      const authKey = getFirebaseAuthStorageKey(FIREBASE_API_KEY);

      await page.evaluate(
        ({ key, value }) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        { key: authKey, value: authUser }
      );
      console.log(`✅ Injected auth state with key: ${authKey.substring(0, 30)}...`);

      // Step 6: Save storage state for reuse in tests
      await context.storageState({ path: AUTH_STATE_PATH });
      console.log(`💾 Saved browser state to: ${AUTH_STATE_PATH}`);
    } else {
      console.warn('⚠️ Test Login button not found');
      console.warn('   Make sure the app is running in dev mode');

      // Take a screenshot for debugging
      const screenshotPath = path.join(authDir, 'auth-setup-debug.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.warn(`   Screenshot saved to: ${screenshotPath}`);
    }

    await browser.close();

    console.log(`\n✅ [E2E Global Setup] Setup complete (${mode} mode)!\n`);
  } catch (error) {
    console.error(`\n❌ [E2E Global Setup] Setup failed (${mode} mode)!\n`);
    console.error('   Error:', error);

    if (USE_PRODUCTION_AUTH) {
      console.error('\n   Production mode troubleshooting (VITE_E2E_MODE=production):');
      console.error('   1. Check VITE_PROD_TEST_USER_EMAIL is set');
      console.error('   2. Check VITE_PROD_TEST_USER_PASSWORD is correct');
      console.error('   3. Ensure the test account has email/password auth enabled');
      console.error('   4. Dev server is accessible: npm run dev\n');
    } else {
      console.error('\n   Emulator mode troubleshooting (VITE_E2E_MODE=emulator):');
      console.error('   1. Firebase emulators are running: npm run emulators');
      console.error('   2. Test user can be created in emulator');
      console.error('   3. Dev server is accessible: npm run dev\n');
    }

    // Don't throw - allow tests to run (they may handle auth themselves)
    console.warn('   Continuing without auth state. Authenticated tests may need manual login.\n');
  }
}

export default globalSetup;
