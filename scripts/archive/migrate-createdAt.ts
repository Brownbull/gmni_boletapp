/**
 * Migration Script: Standardize createdAt field
 *
 * Story 14.31: Fix inconsistent createdAt formats in transactions collection.
 *
 * Problem:
 * - Some transactions have Firestore Timestamp (correct)
 * - Some have date strings like "January 12, 2026 at 3:00:..."
 * - Some have null values
 *
 * Solution:
 * - For transactions with invalid/missing createdAt, set it to the transaction date
 * - Convert all to proper Firestore Timestamps
 *
 * Usage:
 *   npx ts-node scripts/migrate-createdAt.ts
 *
 * Or run from Firebase Console > Extensions > Run script
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
// You'll need to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or provide a service account key
initializeApp({
    projectId: 'boletapp-d609f',
});

const db = getFirestore();

interface TransactionDoc {
    id: string;
    date?: string;
    createdAt?: any;
    merchant?: string;
}

/**
 * Check if a value is a valid Firestore Timestamp
 */
function isValidTimestamp(value: any): boolean {
    if (!value) return false;
    // Firestore Timestamp has seconds and nanoseconds as numbers
    if (typeof value === 'object' &&
        typeof value.seconds === 'number' &&
        typeof value.nanoseconds === 'number') {
        return true;
    }
    // Also check for Timestamp instance
    if (value instanceof Timestamp) {
        return true;
    }
    return false;
}

/**
 * Convert a date string (YYYY-MM-DD) to Firestore Timestamp
 */
function dateStringToTimestamp(dateStr: string): Timestamp {
    // Parse YYYY-MM-DD format and set to noon UTC to avoid timezone issues
    const date = new Date(dateStr + 'T12:00:00Z');
    return Timestamp.fromDate(date);
}

/**
 * Migrate all transactions for a user
 */
async function migrateUserTransactions(userId: string, appId: string): Promise<{fixed: number, skipped: number, errors: number}> {
    const collectionPath = `artifacts/${appId}/users/${userId}/transactions`;
    const collectionRef = db.collection(collectionPath);

    const snapshot = await collectionRef.get();
    console.log(`Found ${snapshot.size} transactions for user ${userId}`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    for (const doc of snapshot.docs) {
        const data = doc.data() as TransactionDoc;
        const { createdAt, date, merchant } = data;

        // Check if createdAt needs fixing
        if (isValidTimestamp(createdAt)) {
            skipped++;
            continue;
        }

        // Need to fix this document
        let newCreatedAt: Timestamp;

        if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // Use transaction date
            newCreatedAt = dateStringToTimestamp(date);
            console.log(`  [FIX] ${doc.id} (${merchant}): createdAt=${createdAt} -> using date=${date}`);
        } else {
            // No valid date, use current time as fallback
            newCreatedAt = Timestamp.now();
            console.log(`  [FIX] ${doc.id} (${merchant}): createdAt=${createdAt}, no valid date -> using now()`);
        }

        batch.update(doc.ref, { createdAt: newCreatedAt });
        batchCount++;
        fixed++;

        // Commit batch if we hit the limit
        if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`  Committed batch of ${batchCount} updates`);
            batchCount = 0;
        }
    }

    // Commit remaining updates
    if (batchCount > 0) {
        await batch.commit();
        console.log(`  Committed final batch of ${batchCount} updates`);
    }

    return { fixed, skipped, errors };
}

/**
 * Main migration function
 */
async function main() {
    const appId = 'boletapp-d609f';

    // Get all users
    const usersPath = `artifacts/${appId}/users`;
    const usersSnapshot = await db.collection(usersPath).get();

    console.log(`Found ${usersSnapshot.size} users`);
    console.log('---');

    let totalFixed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        console.log(`\nProcessing user: ${userId}`);

        try {
            const { fixed, skipped, errors } = await migrateUserTransactions(userId, appId);
            totalFixed += fixed;
            totalSkipped += skipped;
            totalErrors += errors;
            console.log(`  Result: fixed=${fixed}, skipped=${skipped}, errors=${errors}`);
        } catch (err) {
            console.error(`  Error processing user ${userId}:`, err);
            totalErrors++;
        }
    }

    console.log('\n---');
    console.log('Migration complete!');
    console.log(`  Total fixed: ${totalFixed}`);
    console.log(`  Total skipped (already valid): ${totalSkipped}`);
    console.log(`  Total errors: ${totalErrors}`);
}

// Run the migration
main().catch(console.error);
