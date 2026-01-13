#!/usr/bin/env node
/**
 * Admin Migration Script: Standardize createdAt field
 *
 * Story 14.31: Fix inconsistent createdAt formats in transactions collection.
 *
 * Problem:
 * - Some transactions have Firestore Timestamp (correct)
 * - Some have date strings like "January 12, 2026 at 3:00:..."
 * - Some have null values
 * - Firestore orderBy('createdAt', 'desc') excludes null values and sorts strings alphabetically
 *
 * Solution:
 * - For transactions with invalid/missing createdAt, set it to the transaction date
 * - Convert all to proper Firestore Timestamps
 *
 * Prerequisites:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Set up authentication using one of these methods:
 *    a. GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
 *    b. gcloud CLI: gcloud auth application-default login
 *    c. Place service account JSON at ./serviceAccountKey.json
 *
 * Usage:
 *   # Dry run (default) - shows what would be changed
 *   node scripts/migrate-createdAt-admin.js
 *
 *   # Specific user dry run
 *   node scripts/migrate-createdAt-admin.js --user=USER_ID
 *
 *   # Actually run the migration
 *   node scripts/migrate-createdAt-admin.js --execute
 *
 *   # Migrate specific user
 *   node scripts/migrate-createdAt-admin.js --user=USER_ID --execute
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Configuration
const PROJECT_ID = 'boletapp-d609f';
const APP_ID = 'boletapp-d609f'; // The appId used in Firestore paths

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--execute');
const USER_ID = args.find(a => a.startsWith('--user='))?.split('=')[1];

console.log('='.repeat(60));
console.log('createdAt Migration Script');
console.log('='.repeat(60));
console.log(`Project: ${PROJECT_ID}`);
console.log(`App ID: ${APP_ID}`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'EXECUTE (will modify database)'}`);
if (USER_ID) {
    console.log(`User: ${USER_ID}`);
} else {
    console.log('User: ALL USERS');
}
console.log('='.repeat(60));
console.log('');

// Initialize Firebase Admin
function initializeFirebase() {
    // Try different authentication methods
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
        // Method 1: Service account file in scripts folder
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: PROJECT_ID,
        });
        console.log('Initialized with service account file');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Method 2: GOOGLE_APPLICATION_CREDENTIALS env var
        admin.initializeApp({
            projectId: PROJECT_ID,
        });
        console.log('Initialized with GOOGLE_APPLICATION_CREDENTIALS');
    } else {
        // Method 3: Application Default Credentials (gcloud auth)
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: PROJECT_ID,
        });
        console.log('Initialized with Application Default Credentials');
    }
}

/**
 * Check if a value is a valid Firestore Timestamp
 */
function isValidTimestamp(value) {
    if (!value) return false;
    // Firestore Timestamp has _seconds and _nanoseconds properties
    if (typeof value === 'object' &&
        (typeof value._seconds === 'number' || typeof value.seconds === 'number')) {
        return true;
    }
    // Admin SDK Timestamp instance
    if (value instanceof admin.firestore.Timestamp) {
        return true;
    }
    return false;
}

/**
 * Convert a date string (YYYY-MM-DD) to Firestore Timestamp
 */
function dateStringToTimestamp(dateStr) {
    // Parse YYYY-MM-DD format and set to noon UTC to avoid timezone issues
    const date = new Date(dateStr + 'T12:00:00Z');
    return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Migrate all transactions for a user
 */
async function migrateUserTransactions(db, userId) {
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    const collectionRef = db.collection(collectionPath);

    const snapshot = await collectionRef.get();
    console.log(`  Found ${snapshot.size} transactions`);

    const results = {
        total: snapshot.size,
        valid: 0,
        toFix: [],
        fixed: 0,
        errors: [],
    };

    // First pass: identify what needs fixing
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const { createdAt, date, merchant } = data;

        if (isValidTimestamp(createdAt)) {
            results.valid++;
            continue;
        }

        // Needs fixing
        let newCreatedAt;
        let dateUsed;

        if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            newCreatedAt = dateStringToTimestamp(date);
            dateUsed = date;
        } else {
            newCreatedAt = admin.firestore.Timestamp.now();
            dateUsed = 'now()';
        }

        results.toFix.push({
            docId: doc.id,
            merchant: merchant || 'Unknown',
            oldValue: createdAt === null ? 'null' : (typeof createdAt === 'string' ? `"${createdAt.substring(0, 30)}..."` : JSON.stringify(createdAt)),
            newValue: dateUsed,
            timestamp: newCreatedAt,
        });
    }

    console.log(`  Valid: ${results.valid}, To fix: ${results.toFix.length}`);

    // Show what will be fixed
    if (results.toFix.length > 0) {
        console.log(`  Documents to fix:`);
        for (const item of results.toFix.slice(0, 10)) {
            console.log(`    - ${item.docId.substring(0, 8)}... (${item.merchant.substring(0, 20)}): ${item.oldValue} -> ${item.newValue}`);
        }
        if (results.toFix.length > 10) {
            console.log(`    ... and ${results.toFix.length - 10} more`);
        }
    }

    // Second pass: actually fix (if not dry run)
    if (!DRY_RUN && results.toFix.length > 0) {
        console.log(`  Applying fixes...`);

        // Process in batches of 500 (Firestore limit)
        const BATCH_SIZE = 500;
        for (let i = 0; i < results.toFix.length; i += BATCH_SIZE) {
            const batch = db.batch();
            const chunk = results.toFix.slice(i, i + BATCH_SIZE);

            for (const item of chunk) {
                const docRef = db.doc(`${collectionPath}/${item.docId}`);
                batch.update(docRef, { createdAt: item.timestamp });
            }

            try {
                await batch.commit();
                results.fixed += chunk.length;
                console.log(`    Committed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} documents`);
            } catch (err) {
                results.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
                console.error(`    Batch error: ${err.message}`);
            }
        }
    }

    return results;
}

/**
 * Main migration function
 */
async function main() {
    try {
        initializeFirebase();
    } catch (err) {
        console.error('Failed to initialize Firebase:', err.message);
        console.error('');
        console.error('Please set up authentication using one of these methods:');
        console.error('1. Place serviceAccountKey.json in the scripts/ folder');
        console.error('2. Set GOOGLE_APPLICATION_CREDENTIALS env var');
        console.error('3. Run: gcloud auth application-default login');
        process.exit(1);
    }

    const db = admin.firestore();

    let userIds = [];

    if (USER_ID) {
        // Migrate specific user
        userIds = [USER_ID];
    } else {
        // Get all users
        const usersPath = `artifacts/${APP_ID}/users`;
        const usersSnapshot = await db.collection(usersPath).get();
        userIds = usersSnapshot.docs.map(doc => doc.id);
        console.log(`Found ${userIds.length} users`);
    }

    console.log('');

    let totalStats = {
        users: 0,
        totalTransactions: 0,
        valid: 0,
        toFix: 0,
        fixed: 0,
        errors: [],
    };

    for (const userId of userIds) {
        console.log(`Processing user: ${userId}`);

        try {
            const results = await migrateUserTransactions(db, userId);
            totalStats.users++;
            totalStats.totalTransactions += results.total;
            totalStats.valid += results.valid;
            totalStats.toFix += results.toFix.length;
            totalStats.fixed += results.fixed;
            totalStats.errors.push(...results.errors);
        } catch (err) {
            console.error(`  Error processing user: ${err.message}`);
            totalStats.errors.push(`User ${userId}: ${err.message}`);
        }

        console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Users processed: ${totalStats.users}`);
    console.log(`Total transactions: ${totalStats.totalTransactions}`);
    console.log(`Already valid: ${totalStats.valid}`);
    console.log(`Need fixing: ${totalStats.toFix}`);
    if (DRY_RUN) {
        console.log(`Fixed: 0 (dry run)`);
        console.log('');
        console.log('To apply changes, run with --execute flag:');
        console.log('  node scripts/migrate-createdAt-admin.js --execute');
    } else {
        console.log(`Fixed: ${totalStats.fixed}`);
    }
    if (totalStats.errors.length > 0) {
        console.log(`Errors: ${totalStats.errors.length}`);
        for (const err of totalStats.errors) {
            console.log(`  - ${err}`);
        }
    }
    console.log('='.repeat(60));

    process.exit(totalStats.errors.length > 0 ? 1 : 0);
}

// Run the migration
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
