/**
 * Firebase Emulator Testing Utilities
 *
 * This file provides utilities for connecting to and managing Firebase emulators during tests.
 * It includes helpers for:
 * - Connecting to Auth and Firestore emulators
 * - Clearing emulator data between tests
 * - Creating test users and data
 *
 * Note: Security rules are read from firestore.rules file to avoid duplication.
 * This ensures tests always validate against the production rules.
 */

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { setLogLevel } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Emulator configuration
const PROJECT_ID = 'boletapp-d609f';
const FIRESTORE_HOST = 'localhost';
const FIRESTORE_PORT = 8080;

let testEnv: RulesTestEnvironment | null = null;

/**
 * Read Firestore security rules from the project's firestore.rules file.
 * This ensures tests always validate against production rules (no duplication).
 */
function readFirestoreRules(): string {
  // Resolve path relative to project root (tests/setup -> project root)
  const rulesPath = resolve(__dirname, '../../firestore.rules');
  return readFileSync(rulesPath, 'utf-8');
}

/**
 * Initialize Firebase test environment with emulators
 *
 * Call this in beforeAll() or at the start of your tests
 */
export async function setupFirebaseEmulator(): Promise<RulesTestEnvironment> {
  if (testEnv) {
    return testEnv;
  }

  // Suppress Firestore warnings during tests
  setLogLevel('error');

  // Read rules from the actual firestore.rules file to avoid duplication
  const rules = readFirestoreRules();

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: FIRESTORE_HOST,
      port: FIRESTORE_PORT,
      rules,
    },
  });

  return testEnv;
}

/**
 * Clear all data from Firestore emulator
 *
 * Call this in afterEach() to ensure test isolation
 */
export async function clearFirestoreData(): Promise<void> {
  if (!testEnv) {
    throw new Error('Test environment not initialized. Call setupFirebaseEmulator() first.');
  }

  await testEnv.clearFirestore();
}

/**
 * Clean up and shut down Firebase test environment
 *
 * Call this in afterAll()
 */
export async function teardownFirebaseEmulator(): Promise<void> {
  if (testEnv) {
    await testEnv.cleanup();
    testEnv = null;
  }
}

/**
 * Get authenticated Firestore context for a user
 *
 * @param userId - The UID of the user
 * @returns Firestore context authenticated as the user
 */
export function getAuthedFirestore(userId: string) {
  if (!testEnv) {
    throw new Error('Test environment not initialized. Call setupFirebaseEmulator() first.');
  }

  return testEnv.authenticatedContext(userId).firestore();
}

/**
 * Get unauthenticated Firestore context
 *
 * @returns Firestore context without authentication
 */
export function getUnauthFirestore() {
  if (!testEnv) {
    throw new Error('Test environment not initialized. Call setupFirebaseEmulator() first.');
  }

  return testEnv.unauthenticatedContext().firestore();
}

/**
 * Helper to assert that a Firestore operation succeeds
 */
export { assertSucceeds };

/**
 * Helper to assert that a Firestore operation fails
 */
export { assertFails };

/**
 * Test user IDs (matching test-environment-setup.md)
 * ECC Review: Added USER_3 for multi-member group scenarios
 */
export const TEST_USERS = {
  ADMIN: 'test-admin-uid',
  USER_1: 'test-user-1-uid',
  USER_2: 'test-user-2-uid',
  USER_3: 'test-user-3-uid',
} as const;

/**
 * Test user emails for pendingInvitations tests
 */
export const TEST_EMAILS = {
  USER_1: 'user1@test.com',
  USER_2: 'user2@test.com',
} as const;

/**
 * Get authenticated Firestore context for a user with email in token
 *
 * @param userId - The UID of the user
 * @param email - The email of the user (for pendingInvitations rules)
 * @returns Firestore context authenticated as the user
 */
export function getAuthedFirestoreWithEmail(userId: string, email: string) {
  if (!testEnv) {
    throw new Error('Test environment not initialized. Call setupFirebaseEmulator() first.');
  }

  return testEnv.authenticatedContext(userId, { email }).firestore();
}

/**
 * Test data collection path
 */
export const TEST_COLLECTION_PATH = 'artifacts/boletapp-d609f/users';

/**
 * Run a callback with security rules disabled to set up test data.
 * Use this to create documents that the test user doesn't have permission to create.
 *
 * @param callback - Async function that receives a rules-disabled Firestore instance
 */
export async function withSecurityRulesDisabled(
  callback: (firestore: ReturnType<typeof getAuthedFirestore>) => Promise<void>
): Promise<void> {
  if (!testEnv) {
    throw new Error('Test environment not initialized. Call setupFirebaseEmulator() first.');
  }

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await callback(context.firestore() as unknown as ReturnType<typeof getAuthedFirestore>);
  });
}
