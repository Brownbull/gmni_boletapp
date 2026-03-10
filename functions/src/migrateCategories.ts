/**
 * Cloud Function: migrateCategories
 *
 * Story 17-5: Build and Execute Category Batch Migration
 *
 * One-time callable Cloud Function that batch-migrates all stored transaction
 * category fields from legacy V1/V2/V3 values to V4 canonical PascalCase names.
 *
 * Migrates both:
 * - transaction.category (store category)
 * - items[].category (item category)
 *
 * Features:
 * - Idempotent: checks before writing, skips already-migrated docs
 * - Chunked: 500 ops per Firestore batch (hard limit)
 * - Dry-run: defaults to true, logs changes without writing
 * - Per-user stats with detailed logging
 *
 * Pattern: Same as Epic 14d-v2 periods field migration
 *
 * @see functions/src/categoryMigrationMap.ts for the migration mappings
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
    migrateStoreCategory,
    migrateItemCategory,
} from './categoryMigrationMap';

// Initialize admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// Constants
// ============================================================================

const BATCH_SIZE = 500;

// ============================================================================
// Types
// ============================================================================

interface MigrateCategoriesRequest {
    dryRun?: boolean;
    appId: string;
}

interface UserStats {
    userId: string;
    totalTransactions: number;
    migrated: number;
    skipped: number;
    errors: number;
}

interface MigrationResult {
    dryRun: boolean;
    totalUsers: number;
    totalTransactions: number;
    totalMigrated: number;
    totalSkipped: number;
    totalErrors: number;
    userStats: UserStats[];
}

interface TransactionUpdate {
    ref: admin.firestore.DocumentReference;
    updates: Record<string, unknown>;
}

// ============================================================================
// Item Migration Logic
// ============================================================================

interface ItemData {
    category?: string;
    [key: string]: unknown;
}

/**
 * Migrate categories within an items array.
 * Returns null if no changes needed, or the updated items array.
 */
function migrateItems(items: ItemData[]): ItemData[] | null {
    let changed = false;
    const migratedItems = items.map((item) => {
        if (!item.category) return item;

        const newCategory = migrateItemCategory(item.category);
        if (newCategory !== item.category) {
            changed = true;
            return { ...item, category: newCategory };
        }
        return item;
    });

    return changed ? migratedItems : null;
}

// ============================================================================
// Per-Transaction Migration
// ============================================================================

/**
 * Analyze a single transaction and determine what needs updating.
 * Returns null if no changes needed, or the update payload.
 */
function buildTransactionUpdate(
    doc: admin.firestore.DocumentSnapshot
): Record<string, unknown> | null {
    const data = doc.data();
    if (!data) return null;

    const updates: Record<string, unknown> = {};
    let hasChanges = false;

    // Migrate store category (transaction.category)
    if (data.category) {
        const newCategory = migrateStoreCategory(data.category);
        if (newCategory !== data.category) {
            updates.category = newCategory;
            hasChanges = true;
        }
    }

    // Migrate item categories (items[].category)
    if (Array.isArray(data.items) && data.items.length > 0) {
        const migratedItems = migrateItems(data.items);
        if (migratedItems) {
            updates.items = migratedItems;
            hasChanges = true;
        }
    }

    return hasChanges ? updates : null;
}

// ============================================================================
// Batch Write with Chunking
// ============================================================================

/**
 * Execute batch updates in chunks of BATCH_SIZE (500).
 * Returns the number of successfully committed documents.
 */
async function executeBatchUpdates(
    docsToUpdate: TransactionUpdate[]
): Promise<{ committed: number; errors: number }> {
    let committed = 0;
    let errors = 0;

    for (let i = 0; i < docsToUpdate.length; i += BATCH_SIZE) {
        const chunk = docsToUpdate.slice(i, i + BATCH_SIZE);
        const batch = db.batch();

        for (const { ref, updates } of chunk) {
            batch.update(ref, updates);
        }

        try {
            await batch.commit();
            committed += chunk.length;
        } catch (error) {
            console.error(
                `[migrateCategories] Batch commit failed for chunk ${i / BATCH_SIZE + 1}:`,
                error
            );
            errors += chunk.length;
        }
    }

    return { committed, errors };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Callable Cloud Function that migrates all transaction categories to V4.
 *
 * @param data.dryRun - If true (default), log changes without writing
 * @param data.appId - App ID for Firestore paths (default: 'boletapp-d609f')
 */
export const migrateCategories = functions.https.onCall(
    async (data: MigrateCategoriesRequest, context) => {
        // Auth check — admin custom claim required
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Authentication required to run migration'
            );
        }
        if (!context.auth.token?.admin) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Admin privileges required to run migration'
            );
        }

        // Require explicit appId to prevent accidental production writes
        const appId = data?.appId;
        if (!appId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'appId is required (e.g., "boletapp-d609f" or "boletapp-staging")'
            );
        }

        const dryRun = data?.dryRun !== false; // Default to true for safety

        console.log(
            `[migrateCategories] Starting migration. dryRun=${dryRun}, appId=${appId}`
        );

        const result: MigrationResult = {
            dryRun,
            totalUsers: 0,
            totalTransactions: 0,
            totalMigrated: 0,
            totalSkipped: 0,
            totalErrors: 0,
            userStats: [],
        };

        // Enumerate all users
        const usersRef = db.collection(`artifacts/${appId}/users`);
        const usersSnapshot = await usersRef.get();
        result.totalUsers = usersSnapshot.size;

        console.log(
            `[migrateCategories] Processing ${usersSnapshot.size} users...`
        );

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userStats: UserStats = {
                userId,
                totalTransactions: 0,
                migrated: 0,
                skipped: 0,
                errors: 0,
            };

            try {
                // Read all transactions for this user
                const txRef = db.collection(
                    `artifacts/${appId}/users/${userId}/transactions`
                );
                const txSnapshot = await txRef.get();
                userStats.totalTransactions = txSnapshot.size;

                // Build list of updates
                const docsToUpdate: TransactionUpdate[] = [];
                for (const txDoc of txSnapshot.docs) {
                    const updates = buildTransactionUpdate(txDoc);
                    if (updates) {
                        docsToUpdate.push({ ref: txDoc.ref, updates });
                    } else {
                        userStats.skipped++;
                    }
                }

                if (docsToUpdate.length > 0) {
                    if (dryRun) {
                        // Dry run: log what would change
                        userStats.migrated = docsToUpdate.length;
                        userStats.skipped =
                            userStats.totalTransactions - docsToUpdate.length;
                    } else {
                        // Real run: execute batch writes
                        const { committed, errors } =
                            await executeBatchUpdates(docsToUpdate);
                        userStats.migrated = committed;
                        userStats.errors = errors;
                        userStats.skipped =
                            userStats.totalTransactions -
                            committed -
                            errors;
                    }
                } else {
                    userStats.skipped = userStats.totalTransactions;
                }
            } catch (error) {
                console.error(
                    `[migrateCategories] Error processing user ${userId}:`,
                    error
                );
                userStats.errors = userStats.totalTransactions;
            }

            if (
                userStats.migrated > 0 ||
                userStats.errors > 0
            ) {
                console.log(
                    `[migrateCategories] User ${userId}: ` +
                        `${userStats.totalTransactions} txns, ` +
                        `${userStats.migrated} migrated, ` +
                        `${userStats.skipped} skipped, ` +
                        `${userStats.errors} errors`
                );
            }

            result.userStats.push(userStats);
            result.totalTransactions += userStats.totalTransactions;
            result.totalMigrated += userStats.migrated;
            result.totalSkipped += userStats.skipped;
            result.totalErrors += userStats.errors;
        }

        console.log(
            `[migrateCategories] ${dryRun ? 'DRY RUN' : 'MIGRATION'} complete. ` +
                `Users: ${result.totalUsers}, ` +
                `Transactions: ${result.totalTransactions}, ` +
                `Migrated: ${result.totalMigrated}, ` +
                `Skipped: ${result.totalSkipped}, ` +
                `Errors: ${result.totalErrors}`
        );

        return result;
    }
);
