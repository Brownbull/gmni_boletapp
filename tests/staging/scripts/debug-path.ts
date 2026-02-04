/**
 * Debug: Show exact Firestore path for Alice's transactions
 *
 * Usage: npm run staging:debug-path
 */

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Service account key path (relative to project root)
const SERVICE_ACCOUNT_PATH = 'scripts/keys/serviceAccountKey.staging.json';

async function main() {
    const serviceAccountPath = join(process.cwd(), SERVICE_ACCOUNT_PATH);

    if (!existsSync(serviceAccountPath)) {
        console.log(`Service account key not found at: ${SERVICE_ACCOUNT_PATH}`);
        process.exit(1);
    }

    if (getApps().length === 0) {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;
        initializeApp({
            credential: cert(serviceAccount),
            projectId: 'boletapp-staging',
        });
    }

    const db = getFirestore();
    const auth = getAuth();

    // Get Alice's UID
    const aliceRecord = await auth.getUserByEmail('alice@boletapp.test');
    console.log(`\nAlice's UID: ${aliceRecord.uid}`);

    // Path structure the app uses
    const appId = 'boletapp-staging'; // From firebaseConfig.projectId
    const userId = aliceRecord.uid;

    console.log(`\nApp queries this path:`);
    console.log(`  artifacts/${appId}/users/${userId}/transactions`);

    // Check if transactions exist at this path
    const txRef = db
        .collection('artifacts')
        .doc(appId)
        .collection('users')
        .doc(userId)
        .collection('transactions');

    const snapshot = await txRef.limit(3).get();
    console.log(`\nDocuments found: ${snapshot.size}`);

    if (snapshot.size > 0) {
        console.log('\nFirst 3 transactions:');
        snapshot.docs.forEach((doc, i) => {
            const data = doc.data();
            const dateValue = data.date?.toDate ? data.date.toDate().toISOString() : data.date;
            console.log(`  ${i + 1}. ${data.merchant || data.storeName || 'Unknown'} - $${data.total} (${dateValue})`);
        });
    } else {
        console.log('\nNo documents found at this path!');

        // Check alternative paths
        console.log('\nChecking alternative paths...');

        // Old path (users/{userId}/transactions)
        const oldPath = await db.collection('users').doc(userId).collection('transactions').limit(1).get();
        console.log(`  users/${userId}/transactions: ${oldPath.size} docs`);

        // Wrong appId path
        const wrongAppId = '1:660389690821:web:44df423653740399e39fac';
        const wrongPath = await db.collection('artifacts').doc(wrongAppId).collection('users').doc(userId).collection('transactions').limit(1).get();
        console.log(`  artifacts/${wrongAppId}/users/${userId}/transactions: ${wrongPath.size} docs`);
    }
}

main().catch(console.error);
