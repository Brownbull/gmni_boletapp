/**
 * Script to create E2E test users in Firebase Auth Emulator
 *
 * Creates test users for automated E2E testing without requiring OAuth popup flow.
 * Users persist across emulator restarts when using --import/--export-on-exit.
 *
 * Usage:
 *   npm run emulators          # Start emulators first (in one terminal)
 *   tsx scripts/testing/setup-e2e-users.ts  # Run this script (in another terminal)
 *
 * Or add to package.json:
 *   "test:e2e:setup": "tsx scripts/testing/setup-e2e-users.ts"
 */

import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  updateProfile,
  Auth,
} from 'firebase/auth';

// =============================================================================
// E2E Test Users Configuration
// =============================================================================

interface TestUser {
  email: string;
  password: string;
  displayName: string;
  description: string;
}

/**
 * Test users for E2E testing.
 * These match the users defined in tests/e2e/helpers/firebase-auth.ts
 */
const E2E_TEST_USERS: TestUser[] = [
  {
    email: 'e2e-test@example.com',
    password: 'e2e-test-password-123',
    displayName: 'E2E Test User',
    description: 'Primary E2E test user (used by Playwright global setup)',
  },
  {
    email: 'e2e-owner@example.com',
    password: 'e2e-owner-password-123',
    displayName: 'E2E Group Owner',
    description: 'Group owner for shared groups E2E tests',
  },
  {
    email: 'e2e-member@example.com',
    password: 'e2e-member-password-123',
    displayName: 'E2E Group Member',
    description: 'Group member for shared groups E2E tests',
  },
];

// =============================================================================
// Firebase Configuration
// =============================================================================

const FIREBASE_CONFIG = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'boletapp-d609f',
};

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';

// =============================================================================
// Main Script
// =============================================================================

async function createUser(auth: Auth, user: TestUser): Promise<boolean> {
  try {
    console.log(`\n👤 Creating: ${user.email}`);
    console.log(`   Description: ${user.description}`);

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      user.email,
      user.password
    );

    // Update display name
    await updateProfile(userCredential.user, {
      displayName: user.displayName,
    });

    console.log(`   ✅ Created successfully (uid: ${userCredential.user.uid})`);
    return true;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };

    if (firebaseError.code === 'auth/email-already-in-use') {
      console.log(`   ℹ️  Already exists - skipping`);
      return true;
    }

    console.error(`   ❌ Error: ${firebaseError.message}`);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        E2E Test User Setup for Firebase Auth Emulator          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  console.log(`\n🔧 Connecting to Firebase Auth Emulator at ${AUTH_EMULATOR_URL}...`);

  let app: FirebaseApp | null = null;

  try {
    // Initialize Firebase
    app = initializeApp(FIREBASE_CONFIG, 'e2e-setup');
    const auth = getAuth(app);

    // Connect to emulator
    connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });

    console.log('   ✅ Connected to emulator');

    // Create all test users
    let successCount = 0;
    for (const user of E2E_TEST_USERS) {
      const success = await createUser(auth, user);
      if (success) successCount++;
    }

    // Summary
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`✅ Setup complete: ${successCount}/${E2E_TEST_USERS.length} users ready`);
    console.log('════════════════════════════════════════════════════════════════');

    console.log('\n📋 Test Credentials:');
    console.log('────────────────────────────────────────────────────────────────');
    for (const user of E2E_TEST_USERS) {
      console.log(`   ${user.displayName}:`);
      console.log(`     Email:    ${user.email}`);
      console.log(`     Password: ${user.password}`);
      console.log('');
    }

    console.log('💡 Tips:');
    console.log('   • Users persist when emulators run with --export-on-exit');
    console.log('   • View users at: http://localhost:4000/auth');
    console.log('   • Run E2E tests: npm run test:e2e');
    console.log('');

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('\n❌ Setup failed:', err.message);
    console.error('\nMake sure Firebase emulators are running:');
    console.error('   npm run emulators');
    process.exit(1);
  } finally {
    // Clean up Firebase app
    if (app) {
      await deleteApp(app);
    }
  }

  process.exit(0);
}

main();
