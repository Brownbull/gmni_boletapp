/**
 * Migration Script: Add sharedGroupIds field to all transactions
 *
 * Story 14c.5: Security Enhancement
 *
 * This script adds `sharedGroupIds: []` to all transactions that don't have
 * the field. This enables proper Firestore security rules for collection
 * group queries by ensuring all transactions have the field defined.
 *
 * WHY THIS IS NEEDED:
 * Firestore security rules can only evaluate `resource.data.sharedGroupIds.size() > 0`
 * for collection group queries if ALL documents in the collection have the field.
 * Without this, Firestore can't guarantee the rule will pass for all potential results.
 *
 * USAGE:
 * npx ts-node scripts/add-sharedGroupIds-field.ts
 *
 * OPTIONS:
 * --dry-run    Show what would be updated without making changes
 * --user=ID    Only process a specific user ID
 * --limit=N    Process only N transactions per user (for testing)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, WriteBatch } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESM compatibility for loading JSON
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const APP_ID = 'boletapp-d609f';
const BATCH_SIZE = 500; // Firestore batch limit

// Parse command line args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const USER_ARG = args.find(a => a.startsWith('--user='));
const SPECIFIC_USER = USER_ARG ? USER_ARG.split('=')[1] : null;
const LIMIT_ARG = args.find(a => a.startsWith('--limit='));
const LIMIT_PER_USER = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : undefined;

async function main() {
    console.log('=== Add sharedGroupIds Field Migration ===');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
    if (SPECIFIC_USER) console.log(`User filter: ${SPECIFIC_USER}`);
    if (LIMIT_PER_USER) console.log(`Limit per user: ${LIMIT_PER_USER}`);
    console.log('');

    // Initialize Firebase Admin - load service account key using createRequire for ESM
    const require = createRequire(import.meta.url);
    const serviceAccount = require('./serviceAccountKey.json');
    initializeApp({
        credential: cert(serviceAccount),
    });

    const db = getFirestore();
    db.settings({ ignoreUndefinedProperties: true });

    // Get all users - use listDocuments() to find users that only have subcollections (no top-level fields)
    const usersRef = db.collection('artifacts').doc(APP_ID).collection('users');
    let userDocRefs: FirebaseFirestore.DocumentReference[];

    if (SPECIFIC_USER) {
        // Use specific user
        userDocRefs = [usersRef.doc(SPECIFIC_USER)];
    } else {
        // listDocuments() finds docs even if they only have subcollections
        userDocRefs = await usersRef.listDocuments();
    }

    console.log(`Found ${userDocRefs.length} user(s) to process\n`);

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalAlreadyHasField = 0;

    for (const userDocRef of userDocRefs) {
        const userId = userDocRef.id;
        console.log(`Processing user: ${userId}`);

        // Get all transactions for this user
        let transactionsQuery = userDocRef.collection('transactions');

        if (LIMIT_PER_USER) {
            transactionsQuery = transactionsQuery.limit(LIMIT_PER_USER) as any;
        }

        const transactionsSnapshot = await transactionsQuery.get();
        console.log(`  Found ${transactionsSnapshot.size} transactions`);

        // Filter transactions that need updating
        const needsUpdate: FirebaseFirestore.QueryDocumentSnapshot[] = [];
        let alreadyHasField = 0;

        for (const doc of transactionsSnapshot.docs) {
            const data = doc.data();
            if (data.sharedGroupIds === undefined) {
                needsUpdate.push(doc);
            } else {
                alreadyHasField++;
            }
        }

        console.log(`  ${needsUpdate.length} need sharedGroupIds field`);
        console.log(`  ${alreadyHasField} already have the field`);

        totalAlreadyHasField += alreadyHasField;
        totalProcessed += transactionsSnapshot.size;

        if (needsUpdate.length === 0) {
            console.log(`  ✓ No updates needed for this user\n`);
            continue;
        }

        if (DRY_RUN) {
            console.log(`  [DRY RUN] Would update ${needsUpdate.length} transactions\n`);
            totalUpdated += needsUpdate.length;
            continue;
        }

        // Batch update in chunks of 500
        let batch: WriteBatch = db.batch();
        let batchCount = 0;
        let userUpdated = 0;

        for (const doc of needsUpdate) {
            batch.update(doc.ref, { sharedGroupIds: [] });
            batchCount++;

            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                userUpdated += batchCount;
                console.log(`  Committed batch of ${batchCount} updates (${userUpdated}/${needsUpdate.length})`);
                batch = db.batch();
                batchCount = 0;
            }
        }

        // Commit remaining
        if (batchCount > 0) {
            await batch.commit();
            userUpdated += batchCount;
            console.log(`  Committed final batch of ${batchCount} updates`);
        }

        console.log(`  ✓ Updated ${userUpdated} transactions\n`);
        totalUpdated += userUpdated;
    }

    console.log('=== Migration Complete ===');
    console.log(`Total transactions processed: ${totalProcessed}`);
    console.log(`Already had sharedGroupIds: ${totalAlreadyHasField}`);
    console.log(`${DRY_RUN ? 'Would update' : 'Updated'}: ${totalUpdated}`);
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
