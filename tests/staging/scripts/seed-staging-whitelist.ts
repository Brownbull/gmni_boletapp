/**
 * Seed Staging Whitelist — allowedEmails collection
 *
 * Populates the allowedEmails collection in staging Firestore with approved test emails.
 * Story 16-9: Registration blocking via Firestore security rules.
 *
 * Usage:
 *   1. Download service account key from Firebase Console:
 *      https://console.firebase.google.com/project/boletapp-staging/settings/serviceaccounts/adminsdk
 *   2. Save as: scripts/keys/serviceAccountKey.staging.json (gitignored)
 *   3. Run: npm run staging:seed-whitelist
 *
 * IDEMPOTENT: Safe to run multiple times — uses set() with merge.
 */

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load test users from shared config
import testUsers from '../../../staging-test-users.json';

const SERVICE_ACCOUNT_PATH = join(
    process.cwd(),
    'scripts/keys/serviceAccountKey.staging.json'
);

// Emails to whitelist: developers + test users from staging-test-users.json
const WHITELISTED_EMAILS = [
    'carcamo.gabriel@gmail.com',
    'khujta.ai@gmail.com',
    'staging-test@boletapp.test',
    ...testUsers.users.map((u: { email: string }) => u.email),
];

async function seedWhitelist(): Promise<void> {
    // Initialize Firebase Admin
    if (!existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error(
            'Service account key not found at:',
            SERVICE_ACCOUNT_PATH
        );
        console.error(
            'Download from: https://console.firebase.google.com/project/boletapp-staging/settings/serviceaccounts/adminsdk'
        );
        process.exit(1);
    }

    if (getApps().length === 0) {
        const serviceAccount = JSON.parse(
            readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8')
        ) as ServiceAccount;
        initializeApp({ credential: cert(serviceAccount) });
    }

    const db = getFirestore();

    console.log('Seeding allowedEmails collection...');
    console.log(`Emails to whitelist: ${WHITELISTED_EMAILS.length}`);

    for (const email of WHITELISTED_EMAILS) {
        await db
            .collection('allowedEmails')
            .doc(email)
            .set(
                { createdAt: FieldValue.serverTimestamp() },
                { merge: true }
            );
        console.log(`  + ${email}`);
    }

    console.log('\nDone. Whitelisted emails:');
    WHITELISTED_EMAILS.forEach((e) => console.log(`  - ${e}`));
}

seedWhitelist().catch((err) => {
    console.error('Failed to seed whitelist:', err);
    process.exit(1);
});
