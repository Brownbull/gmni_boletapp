/**
 * Firebase Auth Helpers for E2E Testing
 *
 * Provides programmatic authentication for Playwright E2E tests.
 * Supports two modes:
 * 1. Emulator mode (default in dev): Uses Firebase Auth Emulator REST API
 * 2. Production mode: Uses designated production test account
 *
 * @see https://firebase.google.com/docs/emulator-suite/connect_auth#admin_operations
 */

const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const AUTH_EMULATOR_URL = `http://${AUTH_EMULATOR_HOST}`;

// Firebase project ID from environment or fallback
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'boletapp-dev';
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'fake-api-key';

/**
 * Determines if E2E tests should use the emulator or production.
 * Set VITE_E2E_MODE=production to run against real Firebase.
 * Default: emulator mode
 */
export const USE_PRODUCTION_AUTH = process.env.VITE_E2E_MODE === 'production';

/**
 * Response from Firebase Auth Emulator sign-in
 */
export interface EmulatorAuthResponse {
  kind: string;
  localId: string; // User UID
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  registered?: boolean;
}

/**
 * Test user configuration
 */
export interface TestUser {
  email: string;
  password: string;
  displayName?: string;
  uid?: string;
}

/**
 * Default test user for E2E tests (emulator mode)
 */
export const DEFAULT_TEST_USER: TestUser = {
  email: process.env.VITE_TEST_USER_EMAIL || 'e2e-test@example.com',
  password: process.env.VITE_TEST_USER_PASSWORD || 'e2e-test-password-123',
  displayName: 'E2E Test User',
};

/**
 * Production test user for smoke tests against real Firebase.
 * Configure via VITE_PROD_TEST_USER_EMAIL and VITE_PROD_TEST_USER_PASSWORD.
 */
export const PRODUCTION_TEST_USER: TestUser = {
  email: process.env.VITE_PROD_TEST_USER_EMAIL || '',
  password: process.env.VITE_PROD_TEST_USER_PASSWORD || '',
  displayName: 'Production Test User',
};

// ============================================================================
// Multi-User Test Accounts (Emulator Mode Only)
// ============================================================================
// These users are for testing shared group workflows where multiple users
// need to interact (create groups, invite members, accept invitations, etc.)

/**
 * Test users for multi-user shared group testing.
 * All use the same password for simplicity in emulator mode.
 */
const MULTI_USER_PASSWORD = 'test-password-123';

export const TEST_USERS = {
  /** Primary test user - group owner/creator */
  alice: {
    email: 'alice@test.local',
    password: MULTI_USER_PASSWORD,
    displayName: 'Alice (Owner)',
  } as TestUser,

  /** Secondary test user - group member */
  bob: {
    email: 'bob@test.local',
    password: MULTI_USER_PASSWORD,
    displayName: 'Bob (Member)',
  } as TestUser,

  /** Tertiary test user - invited member / non-member */
  charlie: {
    email: 'charlie@test.local',
    password: MULTI_USER_PASSWORD,
    displayName: 'Charlie (Invitee)',
  } as TestUser,

  /** Fourth test user - for edge cases */
  diana: {
    email: 'diana@test.local',
    password: MULTI_USER_PASSWORD,
    displayName: 'Diana (Observer)',
  } as TestUser,
} as const;

export type TestUserName = keyof typeof TEST_USERS;

/**
 * Gets the appropriate test user based on mode.
 * In production mode, uses the production test account.
 * In emulator mode, uses the default emulator test user.
 */
export function getTestUser(): TestUser {
  if (USE_PRODUCTION_AUTH) {
    if (!PRODUCTION_TEST_USER.email || !PRODUCTION_TEST_USER.password) {
      throw new Error(
        '[E2E Auth] Production mode requires VITE_PROD_TEST_USER_EMAIL and VITE_PROD_TEST_USER_PASSWORD'
      );
    }
    return PRODUCTION_TEST_USER;
  }
  return DEFAULT_TEST_USER;
}

/**
 * Creates a user in the Firebase Auth Emulator.
 * If user already exists, this will fail silently.
 *
 * @param user - Test user configuration
 * @returns The created user's UID or null if creation failed
 */
export async function createTestUser(user: TestUser = DEFAULT_TEST_USER): Promise<string | null> {
  try {
    const response = await fetch(
      `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          returnSecureToken: true,
        }),
      }
    );

    if (!response.ok) {
      // User might already exist - that's okay
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.error?.message === 'EMAIL_EXISTS') {
        console.log(`[E2E Auth] User ${user.email} already exists`);
        return null; // Will be retrieved via sign-in
      }
      console.error(`[E2E Auth] Failed to create user: ${JSON.stringify(errorData)}`);
      return null;
    }

    const data: EmulatorAuthResponse = await response.json();
    console.log(`[E2E Auth] Created test user: ${user.email} (uid: ${data.localId})`);
    return data.localId;
  } catch (error) {
    console.error('[E2E Auth] Error creating test user:', error);
    return null;
  }
}

/**
 * Signs in to Firebase Auth Emulator with email/password.
 *
 * @param user - Test user configuration
 * @returns Auth response with tokens, or null on failure
 */
export async function signInWithEmulator(
  user: TestUser = DEFAULT_TEST_USER
): Promise<EmulatorAuthResponse | null> {
  try {
    const response = await fetch(
      `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          returnSecureToken: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[E2E Auth] Sign-in failed: ${JSON.stringify(errorData)}`);
      return null;
    }

    const data: EmulatorAuthResponse = await response.json();
    console.log(`[E2E Auth] Signed in as: ${user.email} (uid: ${data.localId})`);
    return data;
  } catch (error) {
    console.error('[E2E Auth] Error signing in:', error);
    return null;
  }
}

/**
 * Deletes a user from the Firebase Auth Emulator.
 * Useful for cleanup between tests.
 *
 * @param idToken - User's ID token from sign-in
 * @returns True if deleted successfully
 */
export async function deleteTestUser(idToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:delete?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[E2E Auth] Error deleting user:', error);
    return false;
  }
}

/**
 * Clears all users from the Firebase Auth Emulator.
 * Useful for test isolation.
 *
 * @returns True if cleared successfully
 */
export async function clearEmulatorUsers(): Promise<boolean> {
  try {
    const response = await fetch(
      `${AUTH_EMULATOR_URL}/emulator/v1/projects/${FIREBASE_PROJECT_ID}/accounts`,
      {
        method: 'DELETE',
      }
    );

    if (response.ok) {
      console.log('[E2E Auth] Cleared all emulator users');
    }
    return response.ok;
  } catch (error) {
    console.error('[E2E Auth] Error clearing users:', error);
    return false;
  }
}

/**
 * Generates the Firebase auth persistence key for localStorage.
 * Firebase uses a specific key format for storing auth state.
 *
 * @param apiKey - Firebase API key
 * @returns The localStorage key Firebase uses for auth persistence
 */
export function getFirebaseAuthStorageKey(apiKey: string = FIREBASE_API_KEY): string {
  return `firebase:authUser:${apiKey}:[DEFAULT]`;
}

/**
 * Creates the auth user object that Firebase expects in localStorage.
 * This matches the structure Firebase SDK uses internally.
 *
 * @param authResponse - Response from emulator sign-in
 * @returns Serializable auth user object
 */
export function createFirebaseAuthUser(authResponse: EmulatorAuthResponse) {
  const expirationTime = Date.now() + parseInt(authResponse.expiresIn) * 1000;

  return {
    uid: authResponse.localId,
    email: authResponse.email,
    emailVerified: true,
    displayName: authResponse.displayName || authResponse.email.split('@')[0],
    isAnonymous: false,
    providerData: [
      {
        providerId: 'password',
        uid: authResponse.email,
        displayName: authResponse.displayName || null,
        email: authResponse.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: authResponse.refreshToken,
      accessToken: authResponse.idToken,
      expirationTime,
    },
    createdAt: String(Date.now()),
    lastLoginAt: String(Date.now()),
    apiKey: FIREBASE_API_KEY,
    appName: '[DEFAULT]',
  };
}

/**
 * Signs in with production Firebase (not emulator).
 * Uses the Firebase REST API directly.
 *
 * @param user - Test user configuration
 * @returns Auth response with tokens, or null on failure
 */
export async function signInWithProduction(
  user: TestUser = PRODUCTION_TEST_USER
): Promise<EmulatorAuthResponse | null> {
  try {
    // Production Firebase Auth REST endpoint
    const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1';

    const response = await fetch(
      `${FIREBASE_AUTH_URL}/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          returnSecureToken: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[E2E Auth] Production sign-in failed: ${JSON.stringify(errorData)}`);
      return null;
    }

    const data: EmulatorAuthResponse = await response.json();
    console.log(`[E2E Auth] Signed in to production as: ${user.email}`);
    return data;
  } catch (error) {
    console.error('[E2E Auth] Error signing in to production:', error);
    return null;
  }
}

/**
 * Ensures a test user exists and returns auth tokens.
 * In emulator mode: Creates the user if needed, then signs in.
 * In production mode: Signs in with the designated production test account.
 *
 * @param user - Test user configuration (optional, uses appropriate default)
 * @returns Auth response with tokens
 */
export async function ensureTestUserAuthenticated(
  user?: TestUser
): Promise<EmulatorAuthResponse> {
  const testUser = user || getTestUser();

  if (USE_PRODUCTION_AUTH) {
    console.log('[E2E Auth] Using PRODUCTION mode');
    const authResponse = await signInWithProduction(testUser);

    if (!authResponse) {
      throw new Error(`[E2E Auth] Failed to authenticate production test user: ${testUser.email}`);
    }

    return authResponse;
  }

  // Emulator mode
  console.log('[E2E Auth] Using EMULATOR mode');

  // Try to create user (will fail silently if exists)
  await createTestUser(testUser);

  // Sign in to get tokens
  const authResponse = await signInWithEmulator(testUser);

  if (!authResponse) {
    throw new Error(`[E2E Auth] Failed to authenticate test user: ${testUser.email}`);
  }

  return authResponse;
}

// ============================================================================
// Multi-User Authentication Helpers
// ============================================================================

/**
 * Creates and authenticates all multi-user test accounts.
 * Call this once before running multi-user tests.
 *
 * @returns Map of user names to their auth responses
 */
export async function setupMultiUserAccounts(): Promise<Map<TestUserName, EmulatorAuthResponse>> {
  if (USE_PRODUCTION_AUTH) {
    throw new Error('[E2E Auth] Multi-user testing is only supported in emulator mode');
  }

  console.log('[E2E Auth] Setting up multi-user test accounts...');

  const authResponses = new Map<TestUserName, EmulatorAuthResponse>();

  for (const [name, user] of Object.entries(TEST_USERS)) {
    await createTestUser(user);
    const authResponse = await signInWithEmulator(user);

    if (authResponse) {
      authResponses.set(name as TestUserName, authResponse);
      console.log(`[E2E Auth] ✅ ${name}: ${user.email} (uid: ${authResponse.localId})`);
    } else {
      console.error(`[E2E Auth] ❌ Failed to authenticate ${name}`);
    }
  }

  return authResponses;
}

/**
 * Gets a specific test user by name.
 *
 * @param name - The test user name (alice, bob, charlie, diana)
 * @returns The test user configuration
 */
export function getMultiUser(name: TestUserName): TestUser {
  return TEST_USERS[name];
}

/**
 * Authenticates a specific multi-user test account.
 * Creates the user if needed (emulator mode only).
 *
 * @param name - The test user name
 * @returns Auth response with tokens
 */
export async function authenticateMultiUser(name: TestUserName): Promise<EmulatorAuthResponse> {
  if (USE_PRODUCTION_AUTH) {
    throw new Error('[E2E Auth] Multi-user testing is only supported in emulator mode');
  }

  const user = TEST_USERS[name];
  console.log(`[E2E Auth] Authenticating ${name} (${user.email})...`);

  await createTestUser(user);
  const authResponse = await signInWithEmulator(user);

  if (!authResponse) {
    throw new Error(`[E2E Auth] Failed to authenticate multi-user: ${name}`);
  }

  return authResponse;
}

/**
 * Creates localStorage auth state for a specific user.
 * Use with page.evaluate() to inject auth state into a browser context.
 *
 * @param authResponse - The auth response from sign-in
 * @returns Object with key and value for localStorage
 */
export function createAuthStorageEntry(authResponse: EmulatorAuthResponse): {
  key: string;
  value: object;
} {
  return {
    key: getFirebaseAuthStorageKey(),
    value: createFirebaseAuthUser(authResponse),
  };
}
