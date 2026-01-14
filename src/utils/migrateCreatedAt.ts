/**
 * Migration Utility: Standardize createdAt field
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
 * Usage (in browser console while logged in):
 *   import { migrateCreatedAt } from './utils/migrateCreatedAt';
 *   await migrateCreatedAt(db, userId, appId);
 */

import {
    Firestore,
    collection,
    getDocs,
    writeBatch,
    Timestamp,
    doc,
} from 'firebase/firestore';

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
    // Also check for toDate method (Timestamp instance)
    if (value && typeof value.toDate === 'function') {
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

export interface MigrationResult {
    total: number;
    fixed: number;
    skipped: number;
    errors: string[];
}

/**
 * Migrate all transactions for a user to have valid createdAt timestamps.
 * For transactions with invalid/missing createdAt, sets it to the transaction date.
 *
 * @param db - Firestore instance
 * @param userId - User ID
 * @param appId - App ID
 * @param dryRun - If true, only logs what would be changed without making changes
 * @returns Migration result with counts
 */
export async function migrateCreatedAt(
    db: Firestore,
    userId: string,
    appId: string,
    dryRun: boolean = false
): Promise<MigrationResult> {
    const collectionPath = `artifacts/${appId}/users/${userId}/transactions`;
    const collectionRef = collection(db, 'artifacts', appId, 'users', userId, 'transactions');

    console.log(`[migrateCreatedAt] Starting migration for: ${collectionPath}`);
    console.log(`[migrateCreatedAt] Dry run: ${dryRun}`);

    const snapshot = await getDocs(collectionRef);
    console.log(`[migrateCreatedAt] Found ${snapshot.size} transactions`);

    const result: MigrationResult = {
        total: snapshot.size,
        fixed: 0,
        skipped: 0,
        errors: [],
    };

    const batch = writeBatch(db);
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    const toFix: Array<{ id: string; merchant: string; oldValue: any; newValue: string }> = [];

    for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as TransactionDoc;
        const { createdAt, date, merchant } = data;

        // Check if createdAt needs fixing
        if (isValidTimestamp(createdAt)) {
            result.skipped++;
            continue;
        }

        // Need to fix this document
        let newCreatedAt: Timestamp;
        let dateUsed: string;

        if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // Use transaction date
            newCreatedAt = dateStringToTimestamp(date);
            dateUsed = date;
        } else {
            // No valid date, use current time as fallback
            newCreatedAt = Timestamp.now();
            dateUsed = 'now()';
        }

        toFix.push({
            id: docSnapshot.id,
            merchant: merchant || 'Unknown',
            oldValue: createdAt,
            newValue: dateUsed,
        });

        if (!dryRun) {
            const docRef = doc(db, 'artifacts', appId, 'users', userId, 'transactions', docSnapshot.id);
            batch.update(docRef, { createdAt: newCreatedAt });
            batchCount++;

            // Commit batch if we hit the limit
            if (batchCount >= BATCH_SIZE) {
                try {
                    await batch.commit();
                    console.log(`[migrateCreatedAt] Committed batch of ${batchCount} updates`);
                } catch (err: any) {
                    result.errors.push(`Batch commit error: ${err.message}`);
                }
                batchCount = 0;
            }
        }

        result.fixed++;
    }

    // Log what will be/was fixed
    console.log(`[migrateCreatedAt] Transactions to fix (${toFix.length}):`);
    for (const item of toFix) {
        console.log(`  - ${item.id} (${item.merchant}): ${JSON.stringify(item.oldValue)} -> ${item.newValue}`);
    }

    // Commit remaining updates
    if (!dryRun && batchCount > 0) {
        try {
            await batch.commit();
            console.log(`[migrateCreatedAt] Committed final batch of ${batchCount} updates`);
        } catch (err: any) {
            result.errors.push(`Final batch commit error: ${err.message}`);
        }
    }

    console.log(`[migrateCreatedAt] Migration complete!`);
    console.log(`  Total: ${result.total}`);
    console.log(`  Fixed: ${result.fixed}`);
    console.log(`  Skipped (already valid): ${result.skipped}`);
    console.log(`  Errors: ${result.errors.length}`);

    return result;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    (window as any).migrateCreatedAt = migrateCreatedAt;
}
