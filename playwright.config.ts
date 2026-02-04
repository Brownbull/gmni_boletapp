import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Playwright Configuration
 *
 * End-to-end testing configuration for Boletapp.
 * Tests run against the local development server (http://localhost:5174)
 *
 * Authentication Strategy:
 * ========================
 * - Global setup creates test user in Firebase Auth Emulator
 * - Authenticated state saved to tests/e2e/.auth/user.json
 * - Two project configurations:
 *   1. "authenticated" - Uses saved auth state for logged-in workflows
 *   2. "unauthenticated" - Clean state for login screen tests
 *
 * Prerequisites:
 * - Firebase emulators running: npm run emulators
 * - Dev server running: npm run dev (or webServer config handles it)
 *
 * See https://playwright.dev/docs/test-configuration
 */

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to authenticated storage state
const AUTH_FILE = path.join(__dirname, 'tests/e2e/.auth/user.json');

export default defineConfig({
  testDir: './tests/e2e',

  /* Global setup - creates test user and saves auth state */
  globalSetup: path.join(__dirname, 'tests/e2e/global-setup.ts'),

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'], // Show test names in console
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:5174',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure for debugging */
    video: 'on-first-retry',
  },

  /* Configure projects for different auth states */
  projects: [
    // =========================================================================
    // Setup project - runs first to establish auth
    // =========================================================================
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },

    // =========================================================================
    // Authenticated tests - use saved auth state
    // =========================================================================
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        // Reuse authenticated state from global setup
        storageState: AUTH_FILE,
      },
      // Only run files in 'authenticated' folder or with '.auth.' in name
      testMatch: [
        '**/authenticated/**/*.spec.ts',
        '**/*.auth.spec.ts',
      ],
      dependencies: ['setup'],
    },

    // =========================================================================
    // Unauthenticated tests - clean state (login screens, etc.)
    // =========================================================================
    {
      name: 'unauthenticated',
      use: {
        ...devices['Desktop Chrome'],
        // Start with clean state - no auth
        storageState: { cookies: [], origins: [] },
      },
      // Default: files without 'authenticated', 'multi-user', 'staging', or '.auth.' in path
      testIgnore: [
        '**/authenticated/**/*.spec.ts',
        '**/multi-user/**/*.spec.ts',
        '**/staging/**/*.spec.ts',
        '**/*.auth.spec.ts',
      ],
    },

    // =========================================================================
    // Multi-User tests - each test manages its own auth contexts
    // =========================================================================
    // Note: Requires VITE_E2E_MODE=emulator (Firebase emulators must be running)
    {
      name: 'multi-user',
      use: {
        ...devices['Desktop Chrome'],
        // No storageState - each test creates its own authenticated contexts
      },
      testMatch: ['**/multi-user/**/*.spec.ts'],
      // No dependency on setup - handles auth independently
    },

    // =========================================================================
    // Optional: Cross-browser testing (uncomment to enable)
    // =========================================================================
    // {
    //   name: 'firefox-authenticated',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: AUTH_FILE,
    //   },
    //   testMatch: ['**/authenticated/**/*.spec.ts', '**/*.auth.spec.ts'],
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit-authenticated',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: AUTH_FILE,
    //   },
    //   testMatch: ['**/authenticated/**/*.spec.ts', '**/*.auth.spec.ts'],
    //   dependencies: ['setup'],
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes
  },
});
