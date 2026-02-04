/**
 * Clear Staging Transactions
 *
 * Deletes all transactions for test users in staging to allow re-seeding.
 *
 * Usage: npm run staging:clear
 */

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const STAGING_USERS = {
    alice: { email: 'alice@boletapp.test' },
    bob: { email: 'bob@boletapp.test' },
    charlie: { email: 'charlie@boletapp.test' },
    diana: { email: 'diana@boletapp.test' },
};

// App ID for Firestore paths - must match firebaseConfig.projectId
const STAGING_APP_ID = 'boletapp-staging';

// Service account key path (relative to project root)
const SERVICE_ACCOUNT_PATH = 'scripts/keys/serviceAccountKey.staging.json';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
    log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║     Clear Staging Transactions                                  ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

    const serviceAccountPath = join(process.cwd(), SERVICE_ACCOUNT_PATH);

    if (!existsSync(serviceAccountPath)) {
        log(`❌ Service account key not found at: ${SERVICE_ACCOUNT_PATH}`, 'red');
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

    for (const [name, user] of Object.entries(STAGING_USERS)) {
        try {
            const userRecord = await auth.getUserByEmail(user.email);
            const txRef = db
                .collection('artifacts')
                .doc(STAGING_APP_ID)
                .collection('users')
                .doc(userRecord.uid)
                .collection('transactions');

            const snapshot = await txRef.get();

            if (snapshot.empty) {
                log(`${name}: No transactions to delete`, 'yellow');
                continue;
            }

            const batchSize = 500;
            let deleted = 0;
            const docs = snapshot.docs;

            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = db.batch();
                const chunk = docs.slice(i, i + batchSize);

                for (const doc of chunk) {
                    batch.delete(doc.ref);
                }

                await batch.commit();
                deleted += chunk.length;
            }

            log(`✅ ${name}: Deleted ${deleted} transactions`, 'green');
        } catch (error) {
            log(`❌ ${name}: Error - ${(error as Error).message}`, 'red');
        }
    }

    log('\n✅ Done! Now run staging:seed to re-seed with correct data.', 'green');
}

main().catch(console.error);
