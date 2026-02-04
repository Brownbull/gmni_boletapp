#!/usr/bin/env node

/**
 * Seed Multi-User Test Transactions
 *
 * This script creates test users (Alice, Bob, Charlie, Diana) in the Firebase Auth emulator
 * and populates 3 months of realistic transaction data for each user.
 *
 * IMPORTANT: This script ONLY works with Firebase emulators.
 * It will NOT seed the Default user (user's personal local testing account).
 *
 * Prerequisites:
 * - Firebase emulators running: npm run emulators
 * - FIRESTORE_EMULATOR_HOST=localhost:8080
 * - FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
 *
 * Usage:
 *   npx ts-node scripts/testing/seed-multi-user-transactions.ts
 *   # OR
 *   npm run test:seed-multi-users  (if configured in package.json)
 *
 * Test Users Created:
 * - alice@test.local - Group Owner persona (moderate spending)
 * - bob@test.local - Group Member persona (frequent small purchases)
 * - charlie@test.local - Invitee persona (occasional large purchases)
 * - diana@test.local - Observer persona (diverse spending patterns)
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Transaction, TransactionPeriods, StoreCategory } from '../../src/types/transaction';

// ============================================================================
// Configuration
// ============================================================================

const APP_ID = 'boletapp-d609f'; // Must match VITE_FIREBASE_PROJECT_ID in .env (used by AuthContext as appId)
const MULTI_USER_PASSWORD = 'test-password-123';

interface TestUser {
    email: string;
    password: string;
    displayName: string;
    uid?: string; // Will be set after creation
}

const TEST_USERS: Record<string, TestUser> = {
    alice: {
        email: 'alice@test.local',
        password: MULTI_USER_PASSWORD,
        displayName: 'Alice (Owner)',
    },
    bob: {
        email: 'bob@test.local',
        password: MULTI_USER_PASSWORD,
        displayName: 'Bob (Member)',
    },
    charlie: {
        email: 'charlie@test.local',
        password: MULTI_USER_PASSWORD,
        displayName: 'Charlie (Invitee)',
    },
    diana: {
        email: 'diana@test.local',
        password: MULTI_USER_PASSWORD,
        displayName: 'Diana (Observer)',
    },
};

// ============================================================================
// Logging Utilities
// ============================================================================

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

// ============================================================================
// Period Calculation Utilities
// ============================================================================

/**
 * Get ISO week number for a date
 */
function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get ISO week year (may differ from calendar year at year boundaries)
 */
function getISOWeekYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    return d.getUTCFullYear();
}

/**
 * Compute TransactionPeriods from a date string
 */
function computePeriods(dateStr: string): TransactionPeriods {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    const isoWeek = getISOWeek(date);
    const isoWeekYear = getISOWeekYear(date);

    return {
        day: dateStr, // YYYY-MM-DD
        week: `${isoWeekYear}-W${String(isoWeek).padStart(2, '0')}`,
        month: `${year}-${String(month).padStart(2, '0')}`,
        quarter: `${year}-Q${quarter}`,
        year: String(year),
    };
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Generate a date N days ago
 */
function generateDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Generate random time in HH:mm format
 */
function generateTime(): string {
    const hour = Math.floor(Math.random() * 14) + 8; // 08:00 - 22:00
    const minute = Math.floor(Math.random() * 60);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ============================================================================
// Transaction Generators
// ============================================================================

type ItemCategory =
    | 'Produce'
    | 'Meat & Seafood'
    | 'Bakery'
    | 'Dairy & Eggs'
    | 'Pantry'
    | 'Frozen Foods'
    | 'Snacks'
    | 'Beverages'
    | 'Prepared Food'
    | 'Health & Beauty'
    | 'Personal Care'
    | 'Pharmacy'
    | 'Electronics'
    | 'Clothing'
    | 'Fuel'
    | 'Service'
    | 'Subscription'
    | 'Home & Garden'
    | 'Other';

interface TransactionTemplate {
    merchant: string;
    category: StoreCategory;
    alias?: string;
    minTotal: number;
    maxTotal: number;
    items: Array<{ name: string; priceRange: [number, number]; itemCategory: ItemCategory }>;
}

const TRANSACTION_TEMPLATES: TransactionTemplate[] = [
    // Supermarket
    {
        merchant: 'Whole Foods Market',
        category: 'Supermarket',
        minTotal: 45,
        maxTotal: 150,
        items: [
            { name: 'Organic Vegetables', priceRange: [8, 25], itemCategory: 'Produce' },
            { name: 'Fresh Fruits', priceRange: [6, 20], itemCategory: 'Produce' },
            { name: 'Chicken Breast', priceRange: [10, 20], itemCategory: 'Meat & Seafood' },
            { name: 'Milk', priceRange: [4, 8], itemCategory: 'Dairy & Eggs' },
            { name: 'Bread', priceRange: [3, 7], itemCategory: 'Bakery' },
            { name: 'Eggs', priceRange: [4, 8], itemCategory: 'Dairy & Eggs' },
        ],
    },
    {
        merchant: 'Trader Joes',
        category: 'Supermarket',
        minTotal: 30,
        maxTotal: 100,
        items: [
            { name: 'Frozen Meals', priceRange: [4, 10], itemCategory: 'Frozen Foods' },
            { name: 'Snacks', priceRange: [3, 8], itemCategory: 'Snacks' },
            { name: 'Coffee Beans', priceRange: [8, 15], itemCategory: 'Beverages' },
            { name: 'Orange Juice', priceRange: [3, 6], itemCategory: 'Beverages' },
            { name: 'Pasta', priceRange: [2, 5], itemCategory: 'Pantry' },
        ],
    },
    {
        merchant: 'Costco',
        category: 'Supermarket',
        minTotal: 100,
        maxTotal: 350,
        items: [
            { name: 'Bulk Rice', priceRange: [15, 30], itemCategory: 'Pantry' },
            { name: 'Paper Towels', priceRange: [20, 35], itemCategory: 'Personal Care' },
            { name: 'Frozen Fish', priceRange: [25, 45], itemCategory: 'Frozen Foods' },
            { name: 'Olive Oil', priceRange: [15, 25], itemCategory: 'Pantry' },
            { name: 'Laundry Detergent', priceRange: [18, 28], itemCategory: 'Personal Care' },
        ],
    },
    // Restaurant
    {
        merchant: 'Chipotle',
        category: 'Restaurant',
        minTotal: 12,
        maxTotal: 35,
        items: [
            { name: 'Burrito Bowl', priceRange: [10, 15], itemCategory: 'Prepared Food' },
            { name: 'Chips & Guac', priceRange: [4, 6], itemCategory: 'Prepared Food' },
            { name: 'Drink', priceRange: [2, 4], itemCategory: 'Beverages' },
        ],
    },
    {
        merchant: 'Starbucks',
        category: 'Restaurant',
        minTotal: 5,
        maxTotal: 25,
        items: [
            { name: 'Latte', priceRange: [5, 7], itemCategory: 'Beverages' },
            { name: 'Pastry', priceRange: [3, 5], itemCategory: 'Bakery' },
            { name: 'Sandwich', priceRange: [6, 9], itemCategory: 'Prepared Food' },
        ],
    },
    {
        merchant: 'Pizza Palace',
        category: 'Restaurant',
        minTotal: 25,
        maxTotal: 60,
        items: [
            { name: 'Large Pizza', priceRange: [15, 25], itemCategory: 'Prepared Food' },
            { name: 'Salad', priceRange: [8, 12], itemCategory: 'Prepared Food' },
            { name: 'Garlic Bread', priceRange: [5, 8], itemCategory: 'Prepared Food' },
            { name: 'Soft Drinks', priceRange: [3, 6], itemCategory: 'Beverages' },
        ],
    },
    {
        merchant: 'Sushi Express',
        category: 'Restaurant',
        minTotal: 30,
        maxTotal: 80,
        items: [
            { name: 'Sushi Roll Combo', priceRange: [18, 35], itemCategory: 'Prepared Food' },
            { name: 'Miso Soup', priceRange: [3, 5], itemCategory: 'Prepared Food' },
            { name: 'Edamame', priceRange: [5, 8], itemCategory: 'Prepared Food' },
            { name: 'Green Tea', priceRange: [2, 4], itemCategory: 'Beverages' },
        ],
    },
    // Transport
    {
        merchant: 'Uber',
        category: 'Transport',
        minTotal: 8,
        maxTotal: 45,
        items: [{ name: 'Ride', priceRange: [8, 45], itemCategory: 'Service' }],
    },
    {
        merchant: 'Shell Gas Station',
        category: 'Transport',
        minTotal: 35,
        maxTotal: 80,
        items: [{ name: 'Gasoline', priceRange: [35, 80], itemCategory: 'Fuel' }],
    },
    {
        merchant: 'City Parking',
        category: 'Transport',
        minTotal: 5,
        maxTotal: 25,
        items: [{ name: 'Parking Fee', priceRange: [5, 25], itemCategory: 'Service' }],
    },
    // Technology
    {
        merchant: 'Amazon',
        category: 'Technology',
        minTotal: 20,
        maxTotal: 200,
        items: [
            { name: 'USB Cable', priceRange: [10, 20], itemCategory: 'Electronics' },
            { name: 'Phone Case', priceRange: [15, 30], itemCategory: 'Electronics' },
            { name: 'Wireless Mouse', priceRange: [20, 40], itemCategory: 'Electronics' },
            { name: 'Headphones', priceRange: [30, 100], itemCategory: 'Electronics' },
        ],
    },
    {
        merchant: 'Best Buy',
        category: 'Technology',
        minTotal: 50,
        maxTotal: 500,
        items: [
            { name: 'Keyboard', priceRange: [30, 80], itemCategory: 'Electronics' },
            { name: 'Monitor Stand', priceRange: [25, 60], itemCategory: 'Electronics' },
            { name: 'External SSD', priceRange: [80, 200], itemCategory: 'Electronics' },
        ],
    },
    // Services
    {
        merchant: 'City Electric Utility',
        category: 'Services',
        alias: 'Electric Bill',
        minTotal: 80,
        maxTotal: 200,
        items: [{ name: 'Electric Service', priceRange: [80, 200], itemCategory: 'Service' }],
    },
    {
        merchant: 'Internet Provider',
        category: 'Services',
        minTotal: 50,
        maxTotal: 100,
        items: [{ name: 'Internet Service', priceRange: [50, 100], itemCategory: 'Subscription' }],
    },
    {
        merchant: 'Netflix',
        category: 'Services',
        minTotal: 15,
        maxTotal: 23,
        items: [{ name: 'Monthly Subscription', priceRange: [15, 23], itemCategory: 'Subscription' }],
    },
    // Healthcare
    {
        merchant: 'CVS Pharmacy',
        category: 'Healthcare',
        minTotal: 10,
        maxTotal: 80,
        items: [
            { name: 'Prescription', priceRange: [10, 50], itemCategory: 'Pharmacy' },
            { name: 'Vitamins', priceRange: [8, 25], itemCategory: 'Pharmacy' },
            { name: 'First Aid', priceRange: [5, 15], itemCategory: 'Pharmacy' },
        ],
    },
    // Other
    {
        merchant: 'Target',
        category: 'Other',
        minTotal: 25,
        maxTotal: 150,
        items: [
            { name: 'Home Decor', priceRange: [15, 40], itemCategory: 'Home & Garden' },
            { name: 'Clothing', priceRange: [20, 60], itemCategory: 'Clothing' },
            { name: 'Cleaning Supplies', priceRange: [8, 20], itemCategory: 'Personal Care' },
        ],
    },
];

/**
 * Generate a random transaction from a template
 */
function generateTransaction(template: TransactionTemplate, daysAgo: number): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> {
    const date = generateDate(daysAgo);

    // Select random items (1-4 items)
    const numItems = Math.floor(Math.random() * 4) + 1;
    const shuffledItems = [...template.items].sort(() => Math.random() - 0.5);
    const selectedItems = shuffledItems.slice(0, Math.min(numItems, shuffledItems.length));

    const items = selectedItems.map(item => {
        const price = Number((Math.random() * (item.priceRange[1] - item.priceRange[0]) + item.priceRange[0]).toFixed(2));
        const qty = item.name.includes('Gasoline') || item.name.includes('Service') ? 1 : Math.floor(Math.random() * 3) + 1;
        return {
            name: item.name,
            qty,
            price: Number((price * qty).toFixed(2)),
            category: item.itemCategory,
        };
    });

    // Calculate total from items
    const total = Number(items.reduce((sum, item) => sum + item.price, 0).toFixed(2));

    const transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        date,
        merchant: template.merchant,
        category: template.category,
        total,
        items,
        periods: computePeriods(date),
        time: generateTime(),
        currency: 'USD',
        version: 1,
    };

    if (template.alias) {
        transaction.alias = template.alias;
    }

    return transaction;
}

/**
 * Generate transactions for a specific user persona
 */
function generateUserTransactions(persona: 'alice' | 'bob' | 'charlie' | 'diana'): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] {
    const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const daysIn3Months = 90;

    // Different spending patterns per persona
    let frequency: number;
    let preferredCategories: StoreCategory[];

    switch (persona) {
        case 'alice':
            // Moderate spender, balanced categories
            frequency = 3; // Every ~3 days
            preferredCategories = ['Supermarket', 'Restaurant', 'Transport', 'Services'];
            break;
        case 'bob':
            // Frequent small purchases
            frequency = 2; // Every ~2 days
            preferredCategories = ['Restaurant', 'Supermarket', 'Transport'];
            break;
        case 'charlie':
            // Occasional large purchases
            frequency = 5; // Every ~5 days
            preferredCategories = ['Technology', 'Other', 'Supermarket', 'Services'];
            break;
        case 'diana':
            // Diverse spending
            frequency = 2.5;
            preferredCategories = ['Supermarket', 'Restaurant', 'Healthcare', 'Technology', 'Services', 'Transport', 'Other'];
            break;
    }

    // Generate transactions spread across 3 months
    for (let day = 0; day < daysIn3Months; day += frequency) {
        // Add some randomness to spacing
        const actualDay = Math.floor(day + (Math.random() * 2 - 1));
        if (actualDay < 0 || actualDay >= daysIn3Months) continue;

        // Pick a random template from preferred categories
        const eligibleTemplates = TRANSACTION_TEMPLATES.filter(t =>
            preferredCategories.includes(t.category)
        );

        if (eligibleTemplates.length === 0) continue;

        const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];
        transactions.push(generateTransaction(template, actualDay));

        // Sometimes add a second transaction on busy days
        if (Math.random() < 0.2 && persona === 'bob') {
            const secondTemplate = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];
            transactions.push(generateTransaction(secondTemplate, actualDay));
        }
    }

    return transactions;
}

// ============================================================================
// Firebase Admin Functions
// ============================================================================

function initializeFirebaseAdmin() {
    // Check for emulator hosts
    const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;

    if (!firestoreHost || !authHost) {
        log('\n❌ ERROR: This script requires Firebase emulators!', 'red');
        log('Please set the following environment variables:', 'yellow');
        log('  FIRESTORE_EMULATOR_HOST=localhost:8080', 'yellow');
        log('  FIREBASE_AUTH_EMULATOR_HOST=localhost:9099', 'yellow');
        log('\nOr run with: npm run emulators', 'yellow');
        process.exit(1);
    }

    if (getApps().length === 0) {
        log(`Using Firebase Emulator (Firestore: ${firestoreHost}, Auth: ${authHost})`, 'yellow');
        initializeApp({ projectId: 'boletapp-d609f' });
    }

    return {
        db: getFirestore(),
        auth: getAuth(),
    };
}

/**
 * Create or get a test user in Firebase Auth emulator
 */
async function createOrGetUser(auth: ReturnType<typeof getAuth>, user: TestUser): Promise<string> {
    try {
        // Try to get existing user
        const existingUser = await auth.getUserByEmail(user.email);
        log(`  User exists: ${user.email} (${existingUser.uid})`, 'blue');
        return existingUser.uid;
    } catch (error: unknown) {
        // User doesn't exist, create it
        if ((error as { code?: string }).code === 'auth/user-not-found') {
            const newUser = await auth.createUser({
                email: user.email,
                password: user.password,
                displayName: user.displayName,
                emailVerified: true, // Auto-verify for testing
            });
            log(`  Created user: ${user.email} (${newUser.uid})`, 'green');
            return newUser.uid;
        }
        throw error;
    }
}

/**
 * Delete all groups where user is owner or member
 * Also cleans up subcollections (changelog, analytics) and related invitations
 */
async function deleteUserGroups(db: FirebaseFirestore.Firestore, userId: string): Promise<number> {
    // Query groups where user is owner
    const ownedGroupsQuery = db.collection('sharedGroups').where('ownerId', '==', userId);
    const ownedSnapshot = await ownedGroupsQuery.get();

    // Query groups where user is a member
    const memberGroupsQuery = db.collection('sharedGroups').where('memberIds', 'array-contains', userId);
    const memberSnapshot = await memberGroupsQuery.get();

    // Combine unique group IDs
    const groupIdSet = new Set<string>();
    ownedSnapshot.docs.forEach(doc => groupIdSet.add(doc.id));
    memberSnapshot.docs.forEach(doc => groupIdSet.add(doc.id));

    const groupIds = Array.from(groupIdSet);

    if (groupIds.length === 0) {
        return 0;
    }

    let deleted = 0;

    for (const groupId of groupIds) {
        const groupRef = db.collection('sharedGroups').doc(groupId);

        // Delete changelog subcollection
        const changelogSnapshot = await groupRef.collection('changelog').get();
        for (const changelogDoc of changelogSnapshot.docs) {
            await changelogDoc.ref.delete();
        }

        // Delete analytics subcollection
        const analyticsSnapshot = await groupRef.collection('analytics').get();
        for (const analyticsDoc of analyticsSnapshot.docs) {
            await analyticsDoc.ref.delete();
        }

        // Delete the group document itself
        await groupRef.delete();
        deleted++;
    }

    return deleted;
}

/**
 * Delete all pending invitations for a user (as invitee)
 */
async function deleteUserInvitations(db: FirebaseFirestore.Firestore, userEmail: string): Promise<number> {
    const invitationsQuery = db.collection('pendingInvitations').where('inviteeEmail', '==', userEmail);
    const snapshot = await invitationsQuery.get();

    if (snapshot.empty) {
        return 0;
    }

    for (const doc of snapshot.docs) {
        await doc.ref.delete();
    }

    return snapshot.docs.length;
}

/**
 * Delete all transactions for a user
 */
async function deleteUserTransactions(db: FirebaseFirestore.Firestore, userId: string): Promise<number> {
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    const snapshot = await db.collection(collectionPath).get();

    if (snapshot.empty) {
        return 0;
    }

    // Batch delete (Firestore limits to 500 per batch)
    const batchSize = 500;
    let deleted = 0;

    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = snapshot.docs.slice(i, i + batchSize);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        deleted += chunk.length;
    }

    return deleted;
}

/**
 * Add transactions for a user
 */
async function addUserTransactions(
    db: FirebaseFirestore.Firestore,
    userId: string,
    transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<number> {
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    const collectionRef = db.collection(collectionPath);

    // Batch write (Firestore limits to 500 per batch)
    const batchSize = 500;
    let added = 0;

    for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = db.batch();
        const chunk = transactions.slice(i, i + batchSize);

        chunk.forEach(transaction => {
            const docRef = collectionRef.doc();
            batch.set(docRef, {
                ...transaction,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });

        await batch.commit();
        added += chunk.length;
    }

    return added;
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
    logSection('SEED MULTI-USER TEST TRANSACTIONS');

    log('\nThis script will create test users and seed 3 months of transactions.', 'yellow');
    log('Users: Alice, Bob, Charlie, Diana (NOT Default)', 'yellow');

    try {
        // Initialize Firebase
        const { db, auth } = initializeFirebaseAdmin();

        // Process each test user
        logSection('CREATING/VERIFYING USERS');

        const userUids: Record<string, string> = {};

        for (const [name, user] of Object.entries(TEST_USERS)) {
            log(`\nProcessing: ${user.displayName}`, 'cyan');
            const uid = await createOrGetUser(auth, user);
            userUids[name] = uid;
        }

        // Clean up groups and invitations first
        logSection('CLEANING UP GROUPS & INVITATIONS');

        let totalGroupsDeleted = 0;
        let totalInvitationsDeleted = 0;

        for (const [name, uid] of Object.entries(userUids)) {
            log(`\n${TEST_USERS[name].displayName}`, 'cyan');

            // Delete groups where user is owner or member
            log('  Cleaning up groups...', 'blue');
            const groupsDeleted = await deleteUserGroups(db, uid);
            if (groupsDeleted > 0) {
                log(`  Deleted ${groupsDeleted} groups`, 'yellow');
            }
            totalGroupsDeleted += groupsDeleted;

            // Delete pending invitations for this user's email
            const email = TEST_USERS[name].email;
            const invitationsDeleted = await deleteUserInvitations(db, email);
            if (invitationsDeleted > 0) {
                log(`  Deleted ${invitationsDeleted} pending invitations`, 'yellow');
            }
            totalInvitationsDeleted += invitationsDeleted;
        }

        log(`\n✓ Groups cleaned: ${totalGroupsDeleted}`, 'green');
        log(`✓ Invitations cleaned: ${totalInvitationsDeleted}`, 'green');

        // Seed transactions for each user
        logSection('SEEDING TRANSACTIONS');

        let totalDeleted = 0;
        let totalAdded = 0;

        for (const [name, uid] of Object.entries(userUids)) {
            log(`\n${TEST_USERS[name].displayName} (${uid})`, 'cyan');

            // Delete existing transactions
            log('  Clearing existing transactions...', 'blue');
            const deleted = await deleteUserTransactions(db, uid);
            if (deleted > 0) {
                log(`  Deleted ${deleted} existing transactions`, 'yellow');
            }
            totalDeleted += deleted;

            // Generate and add new transactions
            log('  Generating transactions (3 months)...', 'blue');
            const transactions = generateUserTransactions(name as 'alice' | 'bob' | 'charlie' | 'diana');

            log(`  Adding ${transactions.length} transactions...`, 'blue');
            const added = await addUserTransactions(db, uid, transactions);
            log(`  ✓ Added ${added} transactions`, 'green');
            totalAdded += added;
        }

        // Summary
        logSection('SEEDING COMPLETE');

        log('\nUser Summary:', 'yellow');
        for (const [name, uid] of Object.entries(userUids)) {
            log(`  ${TEST_USERS[name].displayName}: ${uid}`, 'green');
        }

        log(`\nCleanup:`, 'yellow');
        log(`  Groups Deleted: ${totalGroupsDeleted}`, 'cyan');
        log(`  Invitations Deleted: ${totalInvitationsDeleted}`, 'cyan');

        log(`\nTransactions:`, 'yellow');
        log(`  Total Deleted: ${totalDeleted}`, 'cyan');
        log(`  Total Added: ${totalAdded}`, 'cyan');

        log('\n✓ Multi-user test data seeded successfully!', 'green');
        log('\nTo test:', 'yellow');
        log('  1. Go to http://localhost:5174', 'cyan');
        log('  2. Click "Test Login" and select any user', 'cyan');
        log('  3. Each user has 3 months of unique transactions', 'cyan');

    } catch (error) {
        logSection('ERROR');
        log(`Seeding failed: ${error instanceof Error ? error.message : String(error)}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run the script
main()
    .then(() => {
        log('\nScript completed successfully', 'green');
        process.exit(0);
    })
    .catch((error) => {
        log(`\nScript failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
