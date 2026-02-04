/**
 * Playwright Fixtures for Multi-User E2E Testing
 *
 * Provides fixtures for testing shared group workflows where multiple users
 * need to interact simultaneously or sequentially.
 *
 * Usage:
 * ```typescript
 * import { test } from '../fixtures/multi-user';
 *
 * test('shared group invite flow', async ({ alicePage, bobPage, authenticateUser }) => {
 *   // Alice creates a group
 *   await alicePage.goto('/');
 *   // ... create group ...
 *
 *   // Bob accepts invitation
 *   await bobPage.goto('/join/ABC123');
 *   // ... accept invitation ...
 * });
 * ```
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import {
  TEST_USERS,
  TestUserName,
  authenticateMultiUser,
  createAuthStorageEntry,
  USE_PRODUCTION_AUTH,
} from '../helpers/firebase-auth.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

/**
 * Extended test fixtures for multi-user testing
 */
export interface MultiUserFixtures {
  /** Pre-authenticated page for Alice (group owner) */
  alicePage: Page;
  /** Pre-authenticated page for Bob (group member) */
  bobPage: Page;
  /** Pre-authenticated page for Charlie (invitee) */
  charliePage: Page;
  /** Pre-authenticated page for Diana (observer) */
  dianaPage: Page;
  /** Function to create an authenticated page for any user */
  authenticateUser: (name: TestUserName) => Promise<{ page: Page; context: BrowserContext }>;
  /** Cleanup function to close all opened contexts */
  cleanupContexts: () => Promise<void>;
}

/**
 * Creates an authenticated browser context and page for a test user.
 */
async function createAuthenticatedContext(
  browser: BrowserContext['browser'],
  userName: TestUserName
): Promise<{ page: Page; context: BrowserContext }> {
  if (!browser) {
    throw new Error('Browser not available');
  }

  // Authenticate via API to get tokens
  const authResponse = await authenticateMultiUser(userName);
  const { key, value } = createAuthStorageEntry(authResponse);

  // Create new browser context with auth state
  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [
            { name: key, value: JSON.stringify(value) },
          ],
        },
      ],
    },
  });

  const page = await context.newPage();

  return { page, context };
}

/**
 * Extended Playwright test with multi-user fixtures.
 *
 * Note: Multi-user testing only works in emulator mode (VITE_E2E_MODE=emulator)
 */
export const test = base.extend<MultiUserFixtures>({
  // Skip multi-user fixtures in production mode
  alicePage: async ({ browser }, use) => {
    if (USE_PRODUCTION_AUTH) {
      throw new Error('Multi-user fixtures require emulator mode. Set VITE_E2E_MODE=emulator');
    }

    const { page, context } = await createAuthenticatedContext(browser, 'alice');

    await use(page);

    await context.close();
  },

  bobPage: async ({ browser }, use) => {
    if (USE_PRODUCTION_AUTH) {
      throw new Error('Multi-user fixtures require emulator mode. Set VITE_E2E_MODE=emulator');
    }

    const { page, context } = await createAuthenticatedContext(browser, 'bob');

    await use(page);

    await context.close();
  },

  charliePage: async ({ browser }, use) => {
    if (USE_PRODUCTION_AUTH) {
      throw new Error('Multi-user fixtures require emulator mode. Set VITE_E2E_MODE=emulator');
    }

    const { page, context } = await createAuthenticatedContext(browser, 'charlie');

    await use(page);

    await context.close();
  },

  dianaPage: async ({ browser }, use) => {
    if (USE_PRODUCTION_AUTH) {
      throw new Error('Multi-user fixtures require emulator mode. Set VITE_E2E_MODE=emulator');
    }

    const { page, context } = await createAuthenticatedContext(browser, 'diana');

    await use(page);

    await context.close();
  },

  // Dynamic user authentication function
  authenticateUser: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const authenticate = async (name: TestUserName) => {
      if (USE_PRODUCTION_AUTH) {
        throw new Error('Multi-user fixtures require emulator mode. Set VITE_E2E_MODE=emulator');
      }

      const result = await createAuthenticatedContext(browser, name);
      contexts.push(result.context);
      return result;
    };

    await use(authenticate);

    // Cleanup all created contexts
    for (const ctx of contexts) {
      await ctx.close();
    }
  },

  cleanupContexts: async ({}, use) => {
    // Placeholder - actual cleanup is handled by individual fixtures
    await use(async () => {});
  },
});

export { expect } from '@playwright/test';

/**
 * Test user information for use in test assertions
 */
export const testUsers = TEST_USERS;
