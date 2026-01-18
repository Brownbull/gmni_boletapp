/**
 * Debug script to explore Firestore collection structure
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
    console.log('=== Exploring Firestore Structure ===\n');

    // Check top-level collections
    const collections = await db.listCollections();
    console.log('Top-level collections:');
    for (const col of collections) {
        console.log(`  - ${col.id}`);
    }

    // Check artifacts collection
    console.log('\n--- Artifacts collection ---');
    const artifactsRef = db.collection('artifacts');
    const artifactsDocs = await artifactsRef.listDocuments();
    console.log('Documents in artifacts:');
    for (const docRef of artifactsDocs) {
        console.log(`  - ${docRef.id}`);

        // Check subcollections
        const subCols = await docRef.listCollections();
        for (const subCol of subCols) {
            console.log(`    - subcollection: ${subCol.id}`);

            // If it's 'users', list documents (even without fields)
            if (subCol.id === 'users') {
                const userDocRefs = await subCol.listDocuments();
                console.log(`      (${userDocRefs.length} user documents)`);
                for (const userDocRef of userDocRefs.slice(0, 5)) {
                    console.log(`      - user: ${userDocRef.id}`);

                    // Check for transactions subcollection
                    const txCols = await userDocRef.listCollections();
                    for (const txCol of txCols) {
                        const txCount = await txCol.count().get();
                        console.log(`        - ${txCol.id}: ${txCount.data().count} docs`);
                    }
                }
                if (userDocRefs.length > 5) {
                    console.log(`      ... and ${userDocRefs.length - 5} more`);
                }
            }
        }
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
