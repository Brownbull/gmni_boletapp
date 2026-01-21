/**
 * Cleanup Script: Remove all shared group data from Firestore
 *
 * Story 14c-refactor.6: Firestore Data Cleanup Script
 *
 * This script cleans up all shared group related data to prepare for Epic 14d:
 * - Deletes all documents in /sharedGroups collection
 * - Deletes all documents in /pendingInvitations collection
 * - Clears sharedGroupIds to [] for all user transactions (preserves field for schema)
 *
 * USAGE:
 * npx ts-node scripts/cleanup-shared-groups.ts --dry-run  # Preview changes (safe)
 * npx ts-node scripts/cleanup-shared-groups.ts            # Execute with confirmation
 * npx ts-node scripts/cleanup-shared-groups.ts --force    # Execute without confirmation
 * npx ts-node scripts/cleanup-shared-groups.ts --help     # Show help
 *
 * OPTIONS:
 * --dry-run    Preview changes without executing
 * --force      Skip confirmation prompt (for CI/automation)
 * --help       Show this help message
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, WriteBatch } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import * as readline from 'readline';

// Configuration
const APP_ID = 'boletapp-d609f';
const BATCH_SIZE = 500; // Firestore batch limit

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const HELP = args.includes('--help') || args.includes('-h');

// Stats tracking
interface CleanupStats {
    sharedGroupsCount: number;
    pendingInvitationsCount: number;
    usersProcessed: number;
    transactionsCleared: number;
}

function showHelp(): void {
    console.log(`
Cleanup Script: Remove all shared group data from Firestore

USAGE:
  npx ts-node scripts/cleanup-shared-groups.ts [OPTIONS]

OPTIONS:
  --dry-run    Preview changes without executing (safe)
  --force      Skip confirmation prompt (for CI/automation)
  --help, -h   Show this help message

EXAMPLES:
  # Preview what would be deleted (recommended first step)
  npx ts-node scripts/cleanup-shared-groups.ts --dry-run

  # Execute with confirmation prompt
  npx ts-node scripts/cleanup-shared-groups.ts

  # Execute without confirmation (for automation)
  npx ts-node scripts/cleanup-shared-groups.ts --force

WHAT THIS SCRIPT DOES:
  1. Deletes all documents in /sharedGroups collection
  2. Deletes all documents in /pendingInvitations collection
  3. Sets sharedGroupIds=[] for all user transactions (preserves field)

NOTE: This is a destructive operation. Use --dry-run first to preview changes.
`);
}

async function askConfirmation(stats: CleanupStats): Promise<boolean> {
    console.log('\n=== CONFIRMATION REQUIRED ===');
    console.log('The following changes will be made:');
    console.log(`  - DELETE ${stats.sharedGroupsCount} documents from /sharedGroups`);
    console.log(`  - DELETE ${stats.pendingInvitationsCount} documents from /pendingInvitations`);
    console.log(`  - CLEAR sharedGroupIds for ${stats.transactionsCleared} transactions across ${stats.usersProcessed} users`);
    console.log('\nThis operation is IRREVERSIBLE.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('\nProceed with cleanup? (y/N): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function countCollection(
    db: FirebaseFirestore.Firestore,
    collectionPath: string
): Promise<number> {
    const snapshot = await db.collection(collectionPath).count().get();
    return snapshot.data().count;
}

// Retry configuration for batch commits
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

async function commitBatchWithRetry(batch: WriteBatch, context: string): Promise<void> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            await batch.commit();
            return;
        } catch (error) {
            lastError = error as Error;
            if (attempt < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
                console.log(`    Retry ${attempt + 1}/${MAX_RETRIES} for ${context} after ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`Failed to commit batch for ${context} after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

async function deleteCollection(
    db: FirebaseFirestore.Firestore,
    collectionPath: string,
    dryRun: boolean
): Promise<number> {
    // In dry-run mode, just count and return - don't attempt to loop/delete
    if (dryRun) {
        const count = await countCollection(db, collectionPath);
        console.log(`  [DRY RUN] Would delete ${count} documents from ${collectionPath}`);
        return count;
    }

    // Live mode: process in batches until collection is empty
    const collectionRef = db.collection(collectionPath);
    let totalDeleted = 0;

    let snapshot = await collectionRef.limit(BATCH_SIZE).get();

    while (snapshot.size > 0) {
        const batch: WriteBatch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await commitBatchWithRetry(batch, `${collectionPath} deletion`);
        totalDeleted += snapshot.size;
        console.log(`  Deleted ${totalDeleted} documents from ${collectionPath}...`);

        // Get next batch (after deletion, limit query returns next documents)
        snapshot = await collectionRef.limit(BATCH_SIZE).get();
    }

    return totalDeleted;
}

async function countTransactionsWithSharedGroupIds(
    db: FirebaseFirestore.Firestore
): Promise<{ usersCount: number; transactionsCount: number }> {
    const usersRef = db.collection('artifacts').doc(APP_ID).collection('users');
    const userDocRefs = await usersRef.listDocuments();

    let usersWithTransactions = 0;
    let totalTransactions = 0;

    for (const userDocRef of userDocRefs) {
        // Query transactions with non-empty sharedGroupIds
        const transactionsQuery = userDocRef
            .collection('transactions')
            .where('sharedGroupIds', '!=', []);

        const snapshot = await transactionsQuery.get();
        if (snapshot.size > 0) {
            usersWithTransactions++;
            totalTransactions += snapshot.size;
        }
    }

    return { usersCount: usersWithTransactions, transactionsCount: totalTransactions };
}

async function clearTransactionSharedGroupIds(
    db: FirebaseFirestore.Firestore,
    dryRun: boolean
): Promise<{ usersProcessed: number; transactionsCleared: number }> {
    const usersRef = db.collection('artifacts').doc(APP_ID).collection('users');
    const userDocRefs = await usersRef.listDocuments();

    console.log(`\nProcessing ${userDocRefs.length} user(s) for transaction cleanup...`);

    let totalUsersProcessed = 0;
    let totalTransactionsCleared = 0;

    for (const userDocRef of userDocRefs) {
        const userId = userDocRef.id;

        // Query transactions with non-empty sharedGroupIds
        const transactionsQuery = userDocRef
            .collection('transactions')
            .where('sharedGroupIds', '!=', []);

        const snapshot = await transactionsQuery.get();

        if (snapshot.size === 0) {
            continue;
        }

        totalUsersProcessed++;
        console.log(`\n  User ${userId}: ${snapshot.size} transactions to clear`);

        if (dryRun) {
            console.log(`    [DRY RUN] Would clear sharedGroupIds for ${snapshot.size} transactions`);
            totalTransactionsCleared += snapshot.size;
            continue;
        }

        // Batch update in chunks of 500
        let batch: WriteBatch = db.batch();
        let batchCount = 0;
        let userCleared = 0;

        for (const doc of snapshot.docs) {
            batch.update(doc.ref, { sharedGroupIds: [] });
            batchCount++;

            if (batchCount >= BATCH_SIZE) {
                await commitBatchWithRetry(batch, `user ${userId} transactions`);
                userCleared += batchCount;
                console.log(`    Cleared ${userCleared}/${snapshot.size} transactions...`);
                batch = db.batch();
                batchCount = 0;
            }
        }

        // Commit remaining
        if (batchCount > 0) {
            await commitBatchWithRetry(batch, `user ${userId} transactions`);
            userCleared += batchCount;
            console.log(`    Cleared ${userCleared}/${snapshot.size} transactions`);
        }

        totalTransactionsCleared += userCleared;
    }

    return { usersProcessed: totalUsersProcessed, transactionsCleared: totalTransactionsCleared };
}

async function gatherStats(db: FirebaseFirestore.Firestore): Promise<CleanupStats> {
    console.log('Gathering cleanup statistics...\n');

    // Count sharedGroups
    const sharedGroupsCount = await countCollection(db, 'sharedGroups');
    console.log(`  /sharedGroups: ${sharedGroupsCount} documents`);

    // Count pendingInvitations
    const pendingInvitationsCount = await countCollection(db, 'pendingInvitations');
    console.log(`  /pendingInvitations: ${pendingInvitationsCount} documents`);

    // Count transactions with sharedGroupIds
    const { usersCount, transactionsCount } = await countTransactionsWithSharedGroupIds(db);
    console.log(`  Transactions with sharedGroupIds: ${transactionsCount} across ${usersCount} users`);

    return {
        sharedGroupsCount,
        pendingInvitationsCount,
        usersProcessed: usersCount,
        transactionsCleared: transactionsCount,
    };
}

async function main() {
    if (HELP) {
        showHelp();
        process.exit(0);
    }

    console.log('=== Shared Groups Cleanup Script ===');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE'}`);
    console.log(`Confirmation: ${FORCE ? 'SKIPPED (--force)' : 'REQUIRED'}`);
    console.log('');

    // Initialize Firebase Admin
    const require = createRequire(import.meta.url);
    const serviceAccount = require('./serviceAccountKey.json');
    initializeApp({
        credential: cert(serviceAccount),
    });

    const db = getFirestore();
    db.settings({ ignoreUndefinedProperties: true });

    // Gather statistics first
    const stats = await gatherStats(db);

    // Check if there's anything to clean up
    if (stats.sharedGroupsCount === 0 && stats.pendingInvitationsCount === 0 && stats.transactionsCleared === 0) {
        console.log('\n=== Nothing to Clean Up ===');
        console.log('All shared group data has already been removed.');
        process.exit(0);
    }

    // In dry-run mode, just show what would happen
    if (DRY_RUN) {
        console.log('\n=== DRY RUN Summary ===');
        console.log(`Would DELETE ${stats.sharedGroupsCount} documents from /sharedGroups`);
        console.log(`Would DELETE ${stats.pendingInvitationsCount} documents from /pendingInvitations`);
        console.log(`Would CLEAR sharedGroupIds for ${stats.transactionsCleared} transactions`);
        console.log('\nRun without --dry-run to execute these changes.');
        process.exit(0);
    }

    // Confirmation prompt (unless --force)
    if (!FORCE) {
        const confirmed = await askConfirmation(stats);
        if (!confirmed) {
            console.log('\nCleanup cancelled by user.');
            process.exit(0);
        }
    }

    // Execute cleanup
    console.log('\n=== Starting Cleanup ===\n');

    // 1. Delete /sharedGroups
    console.log('Step 1: Deleting /sharedGroups collection...');
    const sharedGroupsDeleted = await deleteCollection(db, 'sharedGroups', false);
    console.log(`  Deleted ${sharedGroupsDeleted} shared groups\n`);

    // 2. Delete /pendingInvitations
    console.log('Step 2: Deleting /pendingInvitations collection...');
    const invitationsDeleted = await deleteCollection(db, 'pendingInvitations', false);
    console.log(`  Deleted ${invitationsDeleted} pending invitations\n`);

    // 3. Clear transaction sharedGroupIds
    console.log('Step 3: Clearing transaction sharedGroupIds...');
    const { usersProcessed, transactionsCleared } = await clearTransactionSharedGroupIds(db, false);

    // Final summary
    console.log('\n=== Cleanup Complete ===');
    console.log(`Shared groups deleted: ${sharedGroupsDeleted}`);
    console.log(`Pending invitations deleted: ${invitationsDeleted}`);
    console.log(`Transactions cleared: ${transactionsCleared} across ${usersProcessed} users`);
    console.log('\nDatabase is now ready for Epic 14d.');
}

main().catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
