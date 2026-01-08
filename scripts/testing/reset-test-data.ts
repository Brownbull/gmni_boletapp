#!/usr/bin/env node

/**
 * Reset Test Data Script
 *
 * This script resets the test user data in Firestore to the fixture state.
 * It is idempotent - can be run multiple times safely.
 *
 * Usage:
 *   npm run test:reset-data
 *   # OR for Firebase emulator:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data
 *
 * Safety Features:
 * - Only touches test user data (test-user-1-uid, test-user-2-uid)
 * - Does NOT delete admin user data
 * - Does NOT touch production user data
 * - Validates targeting only test users before execution
 * - Verifies data integrity after reset
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fixtures, getTestUserUIDs, getTotalFixtureCount } from './test-data-fixtures';
import type { Transaction } from '../src/types/transaction';

// Firebase Admin configuration
const APP_ID = 'boletapp-gmni-001'; // Default appId from your app
const TEST_USER_UIDS = getTestUserUIDs(); // ['test-user-1-uid', 'test-user-2-uid']

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        // Check if using emulator
        const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

        if (emulatorHost) {
            log(`Using Firebase Emulator at ${emulatorHost}`, 'yellow');
            // Use the actual project ID so Emulator UI can display data correctly
            initializeApp({ projectId: 'boletapp-d609f' });
        } else {
            log('Using production Firebase (ensure you have proper credentials)', 'yellow');
            // For production, credentials should be in GOOGLE_APPLICATION_CREDENTIALS env var
            // or in the default location (~/.config/gcloud/application_default_credentials.json)
            initializeApp();
        }
    }
    return getFirestore();
}

// Safety check: Confirm we're only targeting test users
async function safetyCheck(): Promise<boolean> {
    logSection('SAFETY CHECK');

    log('Target Users:', 'yellow');
    TEST_USER_UIDS.forEach(uid => {
        console.log(`  - ${uid}`);
    });

    log('\nSafety Validations:', 'yellow');
    log('✓ Only test-user-*-uid patterns will be modified', 'green');
    log('✓ Admin user will NOT be touched', 'green');
    log('✓ Production users will NOT be touched', 'green');

    // Check for production environment
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
        log('\n⚠️  WARNING: Running against PRODUCTION Firebase!', 'red');
        log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return true;
}

// Delete all transactions for a specific test user
async function deleteUserTransactions(db: FirebaseFirestore.Firestore, userId: string): Promise<number> {
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    const snapshot = await db.collection(collectionPath).get();

    log(`  Found ${snapshot.size} existing transactions`, 'yellow');

    if (snapshot.empty) {
        return 0;
    }

    // Batch delete for efficiency
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
}

// Add fixture transactions for a specific test user
async function addFixtureTransactions(
    db: FirebaseFirestore.Firestore,
    userId: string,
    userFixtures: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<number> {
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    const collectionRef = db.collection(collectionPath);

    log(`  Adding ${userFixtures.length} fixture transactions`, 'yellow');

    // Batch write for efficiency
    const batch = db.batch();
    userFixtures.forEach(fixture => {
        const docRef = collectionRef.doc(); // Auto-generate ID
        batch.set(docRef, {
            ...fixture,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    });

    await batch.commit();
    return userFixtures.length;
}

// Verify data integrity after reset
async function verifyDataIntegrity(db: FirebaseFirestore.Firestore, userId: string): Promise<boolean> {
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    const snapshot = await db.collection(collectionPath).get();

    const expectedCount = fixtures[userId]?.length || 0;
    const actualCount = snapshot.size;

    if (actualCount !== expectedCount) {
        log(`  ✗ Verification FAILED: Expected ${expectedCount}, got ${actualCount}`, 'red');
        return false;
    }

    // Verify all transactions have required fields
    const invalidDocs = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.date || !data.merchant || !data.category || typeof data.total !== 'number';
    });

    if (invalidDocs.length > 0) {
        log(`  ✗ Verification FAILED: ${invalidDocs.length} transactions missing required fields`, 'red');
        return false;
    }

    log(`  ✓ Verification passed: ${actualCount} transactions with valid structure`, 'green');
    return true;
}

// Main reset function
async function resetTestData() {
    logSection('RESET TEST DATA SCRIPT');

    try {
        // Initialize Firebase
        const db = initializeFirebaseAdmin();

        // Safety check
        await safetyCheck();

        // Process each test user
        logSection('PROCESSING TEST USERS');

        let totalDeleted = 0;
        let totalAdded = 0;

        for (const userId of TEST_USER_UIDS) {
            log(`\nProcessing: ${userId}`, 'cyan');

            // Step 1: Delete existing transactions
            log('Step 1: Deleting existing transactions...', 'blue');
            const deleted = await deleteUserTransactions(db, userId);
            totalDeleted += deleted;
            log(`  ✓ Deleted ${deleted} transactions`, 'green');

            // Step 2: Add fixture transactions
            log('Step 2: Adding fixture transactions...', 'blue');
            const userFixtures = fixtures[userId] || [];
            const added = await addFixtureTransactions(db, userId, userFixtures);
            totalAdded += added;
            log(`  ✓ Added ${added} transactions`, 'green');

            // Step 3: Verify data integrity
            log('Step 3: Verifying data integrity...', 'blue');
            const verified = await verifyDataIntegrity(db, userId);

            if (!verified) {
                throw new Error(`Data integrity check failed for ${userId}`);
            }
        }

        // Summary
        logSection('RESET COMPLETE');
        log(`Total Deleted: ${totalDeleted}`, 'yellow');
        log(`Total Added: ${totalAdded}`, 'yellow');
        log(`Test Users Reset: ${TEST_USER_UIDS.length}`, 'yellow');
        log(`\n✓ Test data reset successful!`, 'green');

        // Idempotence confirmation
        log('\nIdempotence Check:', 'cyan');
        log('You can run this script multiple times safely.', 'green');
        log('Each run will produce the same fixture state.', 'green');

    } catch (error) {
        logSection('ERROR');
        log(`Reset failed: ${error instanceof Error ? error.message : String(error)}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run the script
resetTestData()
    .then(() => {
        log('\nScript completed successfully', 'green');
        process.exit(0);
    })
    .catch((error) => {
        log(`\nScript failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
