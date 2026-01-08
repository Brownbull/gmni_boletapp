#!/usr/bin/env node

/**
 * View Emulator Data Script
 *
 * Simple script to view test data in the Firebase emulator via CLI
 * Works around Emulator UI CORS issues in WSL
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APP_ID = 'boletapp-gmni-001';
const TEST_USERS = ['test-user-1-uid', 'test-user-2-uid'];

// Colors for output
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Initialize Firebase Admin
if (getApps().length === 0) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        log(`Connected to emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`, 'yellow');
        initializeApp({ projectId: 'boletapp-d609f' });
    } else {
        console.error('Error: FIRESTORE_EMULATOR_HOST not set. Run with:');
        console.error('FIRESTORE_EMULATOR_HOST=localhost:8080 npm run view-data');
        process.exit(1);
    }
}

const db = getFirestore();

async function viewData() {
    log('\n' + '='.repeat(60), 'cyan');
    log('EMULATOR DATA VIEWER', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');

    for (const userId of TEST_USERS) {
        log(`\nUser: ${userId}`, 'blue');
        log('-'.repeat(40), 'blue');

        const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
        const snapshot = await db.collection(collectionPath).get();

        if (snapshot.empty) {
            log('  No transactions found', 'yellow');
            continue;
        }

        log(`  Total transactions: ${snapshot.size}`, 'green');
        log('', 'reset');

        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`  ${index + 1}. ${data.merchant} - $${data.total} (${data.category})`);
            console.log(`     Date: ${data.date}`);
            console.log(`     Items: ${data.items?.length || 0}`);
            console.log('');
        });
    }

    log('='.repeat(60), 'cyan');
    log('View complete!', 'green');
    log('='.repeat(60) + '\n', 'cyan');
}

viewData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error.message);
        process.exit(1);
    });
