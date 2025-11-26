/**
 * Script to create test user in Firebase Auth Emulator for E2E testing
 *
 * This creates a test user with email/password authentication that can be used
 * for automated E2E accessibility testing without requiring OAuth popup flow.
 *
 * Usage: tsx scripts/create-test-user.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';

const TEST_USER_EMAIL = 'khujta@gmail.com';
const TEST_USER_PASSWORD = 'password.123';

async function createTestUser() {
  console.log('🔧 Initializing Firebase Auth Emulator connection...');

  // Initialize Firebase with emulator
  const app = initializeApp({
    apiKey: 'test-api-key',
    authDomain: 'localhost',
    projectId: 'boletapp-d609f',
  });

  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

  try {
    console.log(`👤 Creating test user: ${TEST_USER_EMAIL}...`);

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      TEST_USER_EMAIL,
      TEST_USER_PASSWORD
    );

    console.log('✅ Test user created successfully!');
    console.log(`   UID: ${userCredential.user.uid}`);
    console.log(`   Email: ${userCredential.user.email}`);
    console.log('\n🧪 You can now use this account for E2E accessibility testing');
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: ${TEST_USER_PASSWORD}`);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Test user already exists - no action needed');
      console.log(`   Email: ${TEST_USER_EMAIL}`);
    } else {
      console.error('❌ Error creating test user:', error.message);
      process.exit(1);
    }
  }

  process.exit(0);
}

createTestUser();
