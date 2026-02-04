/**
 * Add Current Month Transactions
 *
 * Adds transactions for the current month to each test user in staging.
 * This allows Playwright tests to see transactions without needing to navigate to past months.
 *
 * IDEMPOTENT: Safe to run multiple times - checks for existing current month transactions.
 *
 * Usage: npm run staging:add-current
 */

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

// Minimum transactions needed for idempotency check
const MIN_CURRENT_MONTH_TRANSACTIONS = 5;

const CURRENT_MONTH_TRANSACTIONS = [
    { merchant: 'Líder Express', category: 'Supermarket', total: 45230 },
    { merchant: 'Starbucks', category: 'Restaurant', total: 7850 },
    { merchant: 'Copec', category: 'Transport', total: 32000 },
    { merchant: 'Cruz Verde', category: 'Healthcare', total: 15600 },
    { merchant: 'Metro de Santiago', category: 'Transport', total: 2500 },
];

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
    log('║     Add Current Month Transactions to Staging                  ║', 'cyan');
    log('║     IDEMPOTENT: Safe to run multiple times                     ║', 'cyan');
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

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    log(`📅 Current period: ${currentPeriod}\n`, 'blue');

    for (const [name, user] of Object.entries(STAGING_USERS)) {
        try {
            const userRecord = await auth.getUserByEmail(user.email);
            // Use correct path: artifacts/{appId}/users/{userId}/transactions/
            const userTransactionsRef = db
                .collection('artifacts')
                .doc(STAGING_APP_ID)
                .collection('users')
                .doc(userRecord.uid)
                .collection('transactions');

            // IDEMPOTENCY CHECK: Skip if user already has enough current month transactions
            const existingCurrentMonth = await userTransactionsRef
                .where('period', '==', currentPeriod)
                .count()
                .get();

            if (existingCurrentMonth.data().count >= MIN_CURRENT_MONTH_TRANSACTIONS) {
                log(`✓ ${name}: Already has ${existingCurrentMonth.data().count} transactions in ${currentPeriod} (skipping)`, 'green');
                continue;
            }

            log(`  ${name}: Has ${existingCurrentMonth.data().count} transactions, adding more...`, 'blue');

            // Add transactions for current month
            const batch = db.batch();
            const transactionsToAdd = CURRENT_MONTH_TRANSACTIONS.slice(0, 3 + Math.floor(Math.random() * 3));

            for (let i = 0; i < transactionsToAdd.length; i++) {
                const tx = transactionsToAdd[i];
                const date = new Date();
                date.setDate(date.getDate() - i); // Spread over recent days
                // Convert to ISO string format - Transaction type expects string, not Date
                const dateString = date.toISOString().split('T')[0];

                const docRef = userTransactionsRef.doc();
                batch.set(docRef, {
                    // Use correct field names matching Transaction type
                    merchant: tx.merchant,
                    category: tx.category,
                    total: tx.total + Math.floor(Math.random() * 5000 - 2500), // Slight variation
                    date: dateString, // Must be string, not Date object!
                    items: [],
                    type: 'personal',
                    period: currentPeriod,
                    currency: 'CLP',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }

            await batch.commit();
            log(`✅ ${name}: Added ${transactionsToAdd.length} transactions for ${currentPeriod}`, 'green');
        } catch (error) {
            log(`❌ ${name}: Error - ${(error as Error).message}`, 'red');
        }
    }

    log('\n════════════════════════════════════════════════════════════════', 'cyan');
    log('✅ Done! Current month transactions added.', 'green');
    log('════════════════════════════════════════════════════════════════\n', 'cyan');
}

main().catch(console.error);
