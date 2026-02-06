/**
 * Verify Staging Transactions
 *
 * Quick script to verify that transactions exist for test users in staging.
 * Uses Firebase Admin SDK to directly query Firestore.
 *
 * Usage: npm run staging:verify
 */

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const STAGING_USERS = {
    'staging-test': { email: 'staging-test@boletapp.test' },
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
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
    log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║     Verify Staging Transactions for boletapp-staging          ║', 'cyan');
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

    log('📊 Transaction counts per user:\n', 'blue');
    log('┌─────────────────┬──────────────────────────────┬───────────────┬─────────────┐', 'cyan');
    log('│ User            │ Email                        │ Transactions  │ Status      │', 'cyan');
    log('├─────────────────┼──────────────────────────────┼───────────────┼─────────────┤', 'cyan');

    for (const [name, user] of Object.entries(STAGING_USERS)) {
        try {
            const userRecord = await auth.getUserByEmail(user.email);
            // Use correct path: artifacts/{appId}/users/{userId}/transactions/
            const txSnapshot = await db
                .collection('artifacts')
                .doc(STAGING_APP_ID)
                .collection('users')
                .doc(userRecord.uid)
                .collection('transactions')
                .count()
                .get();

            const count = txSnapshot.data().count;
            const status = count > 0 ? '✅ OK' : '⚠️  Empty';
            const statusColor = count > 0 ? 'green' : 'yellow';

            const namePad = name.padEnd(15);
            const emailPad = user.email.padEnd(28);
            const countPad = String(count).padStart(11);

            log(`│ ${namePad} │ ${emailPad} │ ${countPad}   │ ${status}      │`, statusColor);
        } catch (error) {
            const namePad = name.padEnd(15);
            const emailPad = user.email.padEnd(28);
            log(`│ ${namePad} │ ${emailPad} │      N/A    │ ❌ Not found │`, 'red');
        }
    }

    log('└─────────────────┴──────────────────────────────┴───────────────┴─────────────┘', 'cyan');
    log('', 'reset');
}

main().catch(console.error);
