/**
 * Firebase Emulator Testing Utilities
 *
 * This file provides utilities for connecting to and managing Firebase emulators during tests.
 * It includes helpers for:
 * - Connecting to Auth and Firestore emulators
 * - Clearing emulator data between tests
 * - Creating test users and data
 */

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { setLogLevel } from 'firebase/firestore';

// Emulator configuration
const PROJECT_ID = 'boletapp-d609f';
const FIRESTORE_HOST = 'localhost';
const FIRESTORE_PORT = 8080;
const AUTH_HOST = 'localhost';
const AUTH_PORT = 9099;

let testEnv: RulesTestEnvironment | null = null;

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

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: FIRESTORE_HOST,
      port: FIRESTORE_PORT,
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // User isolation pattern (matching production rules)
            match /artifacts/{appId}/users/{userId}/{document=**} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }

            // Story 14c.1: Shared Groups (top-level collection)
            match /sharedGroups/{groupId} {
              function isAuthenticated() {
                return request.auth != null;
              }

              function isGroupMember() {
                return isAuthenticated()
                    && request.auth.uid in resource.data.members;
              }

              function isGroupOwner() {
                return isAuthenticated()
                    && request.auth.uid == resource.data.ownerId;
              }

              function isValidNewGroup() {
                return isAuthenticated()
                    && request.resource.data.ownerId == request.auth.uid
                    && request.resource.data.members.hasOnly([request.auth.uid])
                    && request.resource.data.members.size() == 1;
              }

              function isJoiningGroup() {
                return isAuthenticated()
                    && !(request.auth.uid in resource.data.members)
                    && request.auth.uid in request.resource.data.members
                    && request.resource.data.members.size() == resource.data.members.size() + 1
                    && resource.data.members.size() < 10;
              }

              allow create: if isValidNewGroup();
              allow read: if isGroupMember();
              allow update: if isGroupOwner() || isJoiningGroup();
              allow delete: if isGroupOwner();
            }

            // Story 14c.2: Pending Invitations (top-level collection)
            match /pendingInvitations/{invitationId} {
              function isAuthenticated() {
                return request.auth != null;
              }

              function isInvitedUser() {
                return isAuthenticated()
                    && request.auth.token.email != null
                    && resource.data.invitedEmail == request.auth.token.email.lower();
              }

              function isStatusUpdateOnly() {
                return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
                    && request.resource.data.status in ['accepted', 'declined'];
              }

              allow create: if isAuthenticated()
                  && request.resource.data.invitedByUserId == request.auth.uid;
              allow read: if isInvitedUser();
              allow update: if isInvitedUser() && isStatusUpdateOnly();
              allow delete: if false;
            }

            // Deny all other paths
            match /{document=**} {
              allow read, write: if false;
            }
          }
        }
      `,
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
 */
export const TEST_USERS = {
  ADMIN: 'test-admin-uid',
  USER_1: 'test-user-1-uid',
  USER_2: 'test-user-2-uid',
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
