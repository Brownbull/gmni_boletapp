/**
 * Inspect Transactions - Debug script to check transaction data format
 *
 * Usage: npm run staging:inspect
 */

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// App ID for Firestore paths - must match firebaseConfig.projectId
const STAGING_APP_ID = 'boletapp-staging';

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
    console.log(`\nAlice UID: ${aliceRecord.uid}`);

    // Get Alice's transactions using correct path: artifacts/{appId}/users/{userId}/transactions/
    const txSnapshot = await db
        .collection('artifacts')
        .doc(STAGING_APP_ID)
        .collection('users')
        .doc(aliceRecord.uid)
        .collection('transactions')
        .orderBy('date', 'desc')
        .limit(5)
        .get();

    console.log(`\nAlice's 5 most recent transactions:\n`);

    txSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`--- Transaction ${index + 1} ---`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Merchant: ${data.merchant}`);
        console.log(`  Total: ${data.total}`);
        console.log(`  Period: ${data.period}`);
        console.log(`  Type: ${data.type}`);
        // Handle both string dates and Timestamp dates
        const dateValue = data.date?.toDate ? data.date.toDate().toISOString() : data.date;
        console.log(`  Date: ${dateValue || 'N/A'}`);
        console.log(`  CreatedAt: ${data.createdAt ? data.createdAt.toDate().toISOString() : 'N/A'}`);
        console.log('');
    });

    // Check current month transactions specifically
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthTx = await db
        .collection('artifacts')
        .doc(STAGING_APP_ID)
        .collection('users')
        .doc(aliceRecord.uid)
        .collection('transactions')
        .where('period', '==', currentPeriod)
        .get();

    console.log(`\nAlice's ${currentPeriod} transactions: ${currentMonthTx.docs.length}`);

    if (currentMonthTx.docs.length > 0) {
        currentMonthTx.docs.forEach((doc) => {
            const data = doc.data();
            const dateValue = data.date?.toDate ? data.date.toDate().toISOString() : data.date;
            console.log(`  - ${data.merchant}: $${data.total} (${dateValue})`);
        });
    }
}

main().catch(console.error);
