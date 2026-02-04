/**
 * Seed Transactions for Staging Environment
 *
 * Creates test transactions for Alice, Bob, Charlie, and Diana in the staging Firebase.
 * Requires a service account key for boletapp-staging project.
 *
 * Usage:
 *   1. Download service account key from Firebase Console:
 *      https://console.firebase.google.com/project/boletapp-staging/settings/serviceaccounts/adminsdk
 *   2. Save as: scripts/keys/serviceAccountKey.staging.json (gitignored)
 *   3. Run: npm run staging:seed
 *
 * IDEMPOTENT: Safe to run multiple times - skips users who already have transactions.
 */

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

type StoreCategory =
    | 'Supermarket'
    | 'Restaurant'
    | 'Transport'
    | 'Healthcare'
    | 'Technology'
    | 'Services'
    | 'Other';

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

interface TransactionItem {
    name: string;
    qty?: number;
    price: number;
    category: ItemCategory;
}

interface ItemTemplate {
    name: string;
    category: ItemCategory;
    minPrice: number;
    maxPrice: number;
}

interface TransactionTemplate {
    storeName: string;
    category: StoreCategory;
    minAmount: number;
    maxAmount: number;
}

// ============================================================================
// Configuration
// ============================================================================

const STAGING_USERS = {
    alice: { email: 'alice@boletapp.test', displayName: 'Alice (Owner)' },
    bob: { email: 'bob@boletapp.test', displayName: 'Bob (Member)' },
    charlie: { email: 'charlie@boletapp.test', displayName: 'Charlie (Invitee)' },
    diana: { email: 'diana@boletapp.test', displayName: 'Diana (Observer)' },
};

// App ID for Firestore paths - this is the PROJECT ID, not the Firebase App ID!
// The app uses firebaseConfig.projectId as appId (see AuthContext.tsx line 140)
// Path structure: artifacts/{projectId}/users/{userId}/transactions/
const STAGING_APP_ID = 'boletapp-staging';

// Service account key path (relative to project root)
const SERVICE_ACCOUNT_PATH = 'scripts/keys/serviceAccountKey.staging.json';

// Transaction templates for realistic data
const TRANSACTION_TEMPLATES: TransactionTemplate[] = [
    // Supermarkets
    { storeName: 'Líder Express', category: 'Supermarket', minAmount: 15000, maxAmount: 85000 },
    { storeName: 'Jumbo', category: 'Supermarket', minAmount: 20000, maxAmount: 120000 },
    { storeName: 'Santa Isabel', category: 'Supermarket', minAmount: 10000, maxAmount: 60000 },
    { storeName: 'Unimarc', category: 'Supermarket', minAmount: 8000, maxAmount: 45000 },
    // Restaurants
    { storeName: 'Starbucks', category: 'Restaurant', minAmount: 3500, maxAmount: 12000 },
    { storeName: 'McDonald\'s', category: 'Restaurant', minAmount: 4000, maxAmount: 15000 },
    { storeName: 'Domino\'s Pizza', category: 'Restaurant', minAmount: 8000, maxAmount: 25000 },
    { storeName: 'Sushi Express', category: 'Restaurant', minAmount: 12000, maxAmount: 35000 },
    // Transport
    { storeName: 'Copec', category: 'Transport', minAmount: 20000, maxAmount: 60000 },
    { storeName: 'Shell', category: 'Transport', minAmount: 25000, maxAmount: 70000 },
    { storeName: 'Metro de Santiago', category: 'Transport', minAmount: 1000, maxAmount: 5000 },
    { storeName: 'Uber', category: 'Transport', minAmount: 3000, maxAmount: 15000 },
    // Healthcare
    { storeName: 'Cruz Verde', category: 'Healthcare', minAmount: 5000, maxAmount: 50000 },
    { storeName: 'Farmacias Ahumada', category: 'Healthcare', minAmount: 3000, maxAmount: 30000 },
    // Technology
    { storeName: 'PC Factory', category: 'Technology', minAmount: 30000, maxAmount: 500000 },
    { storeName: 'Falabella Tech', category: 'Technology', minAmount: 20000, maxAmount: 300000 },
    // Services
    { storeName: 'VTR', category: 'Services', minAmount: 25000, maxAmount: 45000 },
    { storeName: 'Entel', category: 'Services', minAmount: 15000, maxAmount: 35000 },
    { storeName: 'Enel', category: 'Services', minAmount: 30000, maxAmount: 80000 },
    // Other
    { storeName: 'Sodimac', category: 'Other', minAmount: 15000, maxAmount: 200000 },
    { storeName: 'Paris', category: 'Other', minAmount: 10000, maxAmount: 150000 },
];

// Item templates mapped to store categories - ensures realistic items per store type
const ITEM_TEMPLATES_BY_CATEGORY: Record<StoreCategory, ItemTemplate[]> = {
    Supermarket: [
        { name: 'Leche entera', category: 'Dairy & Eggs', minPrice: 1200, maxPrice: 2500 },
        { name: 'Pan de molde', category: 'Bakery', minPrice: 1500, maxPrice: 3000 },
        { name: 'Manzanas', category: 'Produce', minPrice: 1800, maxPrice: 4000 },
        { name: 'Plátanos', category: 'Produce', minPrice: 800, maxPrice: 2000 },
        { name: 'Pollo entero', category: 'Meat & Seafood', minPrice: 4500, maxPrice: 8000 },
        { name: 'Arroz', category: 'Pantry', minPrice: 1500, maxPrice: 3500 },
        { name: 'Fideos', category: 'Pantry', minPrice: 800, maxPrice: 1800 },
        { name: 'Aceite vegetal', category: 'Pantry', minPrice: 2500, maxPrice: 5000 },
        { name: 'Huevos docena', category: 'Dairy & Eggs', minPrice: 3000, maxPrice: 5500 },
        { name: 'Queso laminado', category: 'Dairy & Eggs', minPrice: 2500, maxPrice: 4500 },
        { name: 'Yogurt pack', category: 'Dairy & Eggs', minPrice: 2000, maxPrice: 4000 },
        { name: 'Jugo de naranja', category: 'Beverages', minPrice: 1500, maxPrice: 3500 },
        { name: 'Agua mineral 6L', category: 'Beverages', minPrice: 2500, maxPrice: 4500 },
        { name: 'Galletas', category: 'Snacks', minPrice: 1200, maxPrice: 2800 },
        { name: 'Helado 1L', category: 'Frozen Foods', minPrice: 3500, maxPrice: 6500 },
        { name: 'Pizza congelada', category: 'Frozen Foods', minPrice: 4000, maxPrice: 7000 },
        { name: 'Papel higiénico', category: 'Personal Care', minPrice: 4000, maxPrice: 8000 },
        { name: 'Detergente', category: 'Personal Care', minPrice: 3500, maxPrice: 7000 },
    ],
    Restaurant: [
        { name: 'Menú del día', category: 'Prepared Food', minPrice: 5000, maxPrice: 12000 },
        { name: 'Café latte', category: 'Beverages', minPrice: 2500, maxPrice: 4500 },
        { name: 'Sandwich', category: 'Prepared Food', minPrice: 3500, maxPrice: 7000 },
        { name: 'Hamburguesa', category: 'Prepared Food', minPrice: 5500, maxPrice: 12000 },
        { name: 'Pizza mediana', category: 'Prepared Food', minPrice: 8000, maxPrice: 15000 },
        { name: 'Sushi roll', category: 'Prepared Food', minPrice: 6000, maxPrice: 14000 },
        { name: 'Bebida gaseosa', category: 'Beverages', minPrice: 1500, maxPrice: 3000 },
        { name: 'Postre', category: 'Prepared Food', minPrice: 3000, maxPrice: 6000 },
        { name: 'Papas fritas', category: 'Prepared Food', minPrice: 2500, maxPrice: 5000 },
        { name: 'Ensalada', category: 'Prepared Food', minPrice: 4000, maxPrice: 8000 },
    ],
    Transport: [
        { name: 'Gasolina 95', category: 'Fuel', minPrice: 15000, maxPrice: 60000 },
        { name: 'Gasolina 93', category: 'Fuel', minPrice: 12000, maxPrice: 50000 },
        { name: 'Petróleo diesel', category: 'Fuel', minPrice: 18000, maxPrice: 55000 },
        { name: 'Viaje metro', category: 'Service', minPrice: 800, maxPrice: 1500 },
        { name: 'Viaje Uber', category: 'Service', minPrice: 2500, maxPrice: 12000 },
        { name: 'Lavado auto', category: 'Service', minPrice: 5000, maxPrice: 15000 },
    ],
    Healthcare: [
        { name: 'Ibuprofeno', category: 'Pharmacy', minPrice: 2000, maxPrice: 5000 },
        { name: 'Paracetamol', category: 'Pharmacy', minPrice: 1500, maxPrice: 4000 },
        { name: 'Vitaminas', category: 'Pharmacy', minPrice: 5000, maxPrice: 15000 },
        { name: 'Jarabe para tos', category: 'Pharmacy', minPrice: 4000, maxPrice: 12000 },
        { name: 'Crema hidratante', category: 'Health & Beauty', minPrice: 3500, maxPrice: 12000 },
        { name: 'Protector solar', category: 'Health & Beauty', minPrice: 6000, maxPrice: 18000 },
        { name: 'Shampoo', category: 'Personal Care', minPrice: 3000, maxPrice: 8000 },
        { name: 'Pasta dental', category: 'Personal Care', minPrice: 2000, maxPrice: 5000 },
    ],
    Technology: [
        { name: 'Auriculares bluetooth', category: 'Electronics', minPrice: 15000, maxPrice: 80000 },
        { name: 'Cable USB-C', category: 'Electronics', minPrice: 5000, maxPrice: 15000 },
        { name: 'Mouse inalámbrico', category: 'Electronics', minPrice: 12000, maxPrice: 45000 },
        { name: 'Teclado', category: 'Electronics', minPrice: 20000, maxPrice: 120000 },
        { name: 'Pendrive 64GB', category: 'Electronics', minPrice: 8000, maxPrice: 25000 },
        { name: 'Cargador rápido', category: 'Electronics', minPrice: 10000, maxPrice: 35000 },
        { name: 'Funda celular', category: 'Electronics', minPrice: 5000, maxPrice: 20000 },
        { name: 'Parlante portátil', category: 'Electronics', minPrice: 25000, maxPrice: 150000 },
    ],
    Services: [
        { name: 'Plan mensual internet', category: 'Subscription', minPrice: 20000, maxPrice: 45000 },
        { name: 'Plan celular', category: 'Subscription', minPrice: 12000, maxPrice: 35000 },
        { name: 'Cuenta eléctrica', category: 'Service', minPrice: 25000, maxPrice: 80000 },
        { name: 'Cuenta agua', category: 'Service', minPrice: 8000, maxPrice: 25000 },
        { name: 'Cuenta gas', category: 'Service', minPrice: 15000, maxPrice: 45000 },
    ],
    Other: [
        { name: 'Herramientas', category: 'Home & Garden', minPrice: 8000, maxPrice: 50000 },
        { name: 'Pintura', category: 'Home & Garden', minPrice: 12000, maxPrice: 45000 },
        { name: 'Plantas', category: 'Home & Garden', minPrice: 5000, maxPrice: 25000 },
        { name: 'Ropa', category: 'Clothing', minPrice: 15000, maxPrice: 80000 },
        { name: 'Zapatos', category: 'Clothing', minPrice: 25000, maxPrice: 120000 },
        { name: 'Accesorios', category: 'Other', minPrice: 5000, maxPrice: 35000 },
        { name: 'Decoración hogar', category: 'Home & Garden', minPrice: 10000, maxPrice: 60000 },
    ],
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
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// Transaction Generation
// ============================================================================

/**
 * Generate realistic items for a transaction based on its category.
 * Each transaction gets 1-5 items with prices that sum to approximately the total.
 */
function generateItemsForTransaction(
    category: StoreCategory,
    targetTotal: number
): TransactionItem[] {
    const itemTemplates = ITEM_TEMPLATES_BY_CATEGORY[category];
    if (!itemTemplates || itemTemplates.length === 0) {
        // Fallback: single generic item
        return [{ name: 'Producto', price: targetTotal, category: 'Other', qty: 1 }];
    }

    // Determine number of items (1-5, weighted toward 2-3)
    const numItems = Math.min(
        Math.max(1, Math.floor(Math.random() * 4) + 1),
        itemTemplates.length
    );

    // Shuffle and pick random items
    const shuffled = [...itemTemplates].sort(() => Math.random() - 0.5);
    const selectedTemplates = shuffled.slice(0, numItems);

    // Generate items with prices that approximately sum to targetTotal
    const items: TransactionItem[] = [];
    let remainingTotal = targetTotal;

    for (let i = 0; i < selectedTemplates.length; i++) {
        const template = selectedTemplates[i];
        const isLast = i === selectedTemplates.length - 1;

        let price: number;
        if (isLast) {
            // Last item gets the remaining amount (ensures total matches)
            price = Math.max(template.minPrice, remainingTotal);
        } else {
            // Random price within template range, but not more than remaining
            const maxAllowed = Math.min(template.maxPrice, remainingTotal - (selectedTemplates.length - i - 1) * 1000);
            price = Math.floor(
                Math.random() * (maxAllowed - template.minPrice) + template.minPrice
            );
            price = Math.max(template.minPrice, Math.min(price, remainingTotal - 1000));
        }

        // Random quantity (1-3, usually 1)
        const qty = Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 2) + 2;

        items.push({
            name: template.name,
            price: Math.round(price / qty), // Price per unit
            category: template.category,
            qty,
        });

        remainingTotal -= price;
    }

    return items;
}

function generateTransaction(template: TransactionTemplate, daysAgo: number) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 14) + 8); // 8am - 10pm
    date.setMinutes(Math.floor(Math.random() * 60));

    const amount = Math.floor(
        Math.random() * (template.maxAmount - template.minAmount) + template.minAmount
    );

    // Convert date to ISO string format (YYYY-MM-DD) - Transaction type expects string, not Date
    const dateString = date.toISOString().split('T')[0];

    // Generate realistic items for this transaction
    const items = generateItemsForTransaction(template.category, amount);

    // Recalculate total based on actual items (sum of price * qty)
    const actualTotal = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

    return {
        // Use correct field names matching Transaction type
        merchant: template.storeName,
        category: template.category,
        total: actualTotal,
        date: dateString, // Must be string, not Date object!
        items,
        type: 'personal' as const,
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        // Add currency for proper display
        currency: 'CLP',
    };
}

function generateUserTransactions(persona: 'alice' | 'bob' | 'charlie' | 'diana') {
    const transactions: ReturnType<typeof generateTransaction>[] = [];
    const daysIn3Months = 90;

    let frequency: number;
    let preferredCategories: StoreCategory[];

    switch (persona) {
        case 'alice':
            frequency = 3;
            preferredCategories = ['Supermarket', 'Restaurant', 'Transport', 'Services'];
            break;
        case 'bob':
            frequency = 2;
            preferredCategories = ['Restaurant', 'Supermarket', 'Transport'];
            break;
        case 'charlie':
            frequency = 5;
            preferredCategories = ['Technology', 'Other', 'Supermarket', 'Services'];
            break;
        case 'diana':
            frequency = 2.5;
            preferredCategories = ['Supermarket', 'Restaurant', 'Healthcare', 'Technology', 'Services', 'Transport', 'Other'];
            break;
    }

    for (let day = 0; day < daysIn3Months; day += frequency) {
        const actualDay = Math.floor(day + (Math.random() * 2 - 1));
        if (actualDay < 0 || actualDay >= daysIn3Months) continue;

        const eligibleTemplates = TRANSACTION_TEMPLATES.filter(t =>
            preferredCategories.includes(t.category)
        );

        if (eligibleTemplates.length === 0) continue;

        const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];
        transactions.push(generateTransaction(template, actualDay));

        if (Math.random() < 0.2 && persona === 'bob') {
            const secondTemplate = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];
            transactions.push(generateTransaction(secondTemplate, actualDay));
        }
    }

    return transactions;
}

// ============================================================================
// Firebase Admin Setup
// ============================================================================

function initializeFirebaseAdmin() {
    const serviceAccountPath = join(process.cwd(), SERVICE_ACCOUNT_PATH);

    if (!existsSync(serviceAccountPath)) {
        log('\n❌ ERROR: Service account key not found!', 'red');
        log('\nTo seed staging data, you need a service account key:', 'yellow');
        log('1. Go to: https://console.firebase.google.com/project/boletapp-staging/settings/serviceaccounts/adminsdk', 'cyan');
        log('2. Click "Generate new private key"', 'cyan');
        log(`3. Save the file as: ${SERVICE_ACCOUNT_PATH}`, 'cyan');
        log('4. Run this script again: npm run staging:seed', 'cyan');
        log('\nNote: scripts/keys/ is gitignored for security.', 'yellow');
        process.exit(1);
    }

    if (getApps().length === 0) {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;
        initializeApp({
            credential: cert(serviceAccount),
            projectId: 'boletapp-staging',
        });
        log('✅ Firebase Admin initialized for boletapp-staging', 'green');
    }

    return {
        db: getFirestore(),
        auth: getAuth(),
    };
}

// ============================================================================
// Group Cleanup Functions
// ============================================================================

/**
 * Delete all groups where user is owner or member.
 * Cleans up subcollections (changelog, analytics) and related invitations.
 */
async function deleteUserGroups(db: Firestore, userId: string): Promise<number> {
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
async function deleteUserInvitations(db: Firestore, userEmail: string): Promise<number> {
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
 * Delete all transactions for a user.
 * Used with --force flag to reseed with updated data structure.
 */
async function deleteUserTransactions(db: Firestore, userId: string): Promise<number> {
    const transactionsRef = db
        .collection('artifacts')
        .doc(STAGING_APP_ID)
        .collection('users')
        .doc(userId)
        .collection('transactions');

    const snapshot = await transactionsRef.get();

    if (snapshot.empty) {
        return 0;
    }

    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    let deleted = 0;

    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = snapshot.docs.slice(i, i + batchSize);

        for (const doc of chunk) {
            batch.delete(doc.ref);
        }

        await batch.commit();
        deleted += chunk.length;
    }

    return deleted;
}

// Check for --force flag
const FORCE_RESEED = process.argv.includes('--force');

// ============================================================================
// Main Script
// ============================================================================

async function main() {
    log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║     Staging Transaction Seeder for boletapp-staging           ║', 'cyan');
    log('║     IDEMPOTENT: Safe to run multiple times                    ║', 'cyan');
    if (FORCE_RESEED) {
        log('║     ⚠️  FORCE MODE: Will delete and recreate all data         ║', 'yellow');
    }
    log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

    const { db, auth } = initializeFirebaseAdmin();

    // Get UIDs for all staging users
    const userUids: Record<string, string> = {};

    for (const [name, user] of Object.entries(STAGING_USERS)) {
        try {
            const userRecord = await auth.getUserByEmail(user.email);
            userUids[name] = userRecord.uid;
            log(`✅ Found user: ${user.email} (${userRecord.uid})`, 'green');
        } catch (error) {
            log(`❌ User not found: ${user.email}`, 'red');
            log(`   Create this user in Firebase Console first!`, 'yellow');
        }
    }

    if (Object.keys(userUids).length === 0) {
        log('\n❌ No users found! Create test users in Firebase Console first.', 'red');
        process.exit(1);
    }

    // Clean up groups and invitations first
    log('\n🧹 Cleaning up groups & invitations...', 'blue');
    let totalGroupsDeleted = 0;
    let totalInvitationsDeleted = 0;

    for (const [name, uid] of Object.entries(userUids)) {
        const groupsDeleted = await deleteUserGroups(db, uid);
        if (groupsDeleted > 0) {
            log(`   Deleted ${groupsDeleted} groups for ${name}`, 'yellow');
        }
        totalGroupsDeleted += groupsDeleted;

        const email = STAGING_USERS[name as keyof typeof STAGING_USERS].email;
        const invitationsDeleted = await deleteUserInvitations(db, email);
        if (invitationsDeleted > 0) {
            log(`   Deleted ${invitationsDeleted} invitations for ${name}`, 'yellow');
        }
        totalInvitationsDeleted += invitationsDeleted;
    }

    if (totalGroupsDeleted > 0 || totalInvitationsDeleted > 0) {
        log(`✅ Cleaned: ${totalGroupsDeleted} groups, ${totalInvitationsDeleted} invitations`, 'green');
    } else {
        log('   No groups or invitations to clean', 'yellow');
    }

    // Seed transactions for each user
    for (const [name, uid] of Object.entries(userUids)) {
        log(`\n📝 Processing ${name}...`, 'blue');

        const transactions = generateUserTransactions(name as 'alice' | 'bob' | 'charlie' | 'diana');
        // Use the correct path structure: artifacts/{appId}/users/{userId}/transactions/
        const userTransactionsRef = db
            .collection('artifacts')
            .doc(STAGING_APP_ID)
            .collection('users')
            .doc(uid)
            .collection('transactions');

        // IDEMPOTENCY CHECK: Skip if user already has transactions (unless --force)
        const existingCount = (await userTransactionsRef.count().get()).data().count;
        if (existingCount > 0) {
            if (FORCE_RESEED) {
                log(`   🗑️  Deleting ${existingCount} existing transactions (--force)...`, 'yellow');
                await deleteUserTransactions(db, uid);
            } else {
                log(`   ✓ User already has ${existingCount} transactions. Skipping (use --force to reseed).`, 'yellow');
                continue;
            }
        }

        // Batch write transactions
        const batchSize = 500;
        let written = 0;

        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = db.batch();
            const chunk = transactions.slice(i, i + batchSize);

            for (const tx of chunk) {
                const docRef = userTransactionsRef.doc();
                batch.set(docRef, {
                    ...tx,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                });
            }

            await batch.commit();
            written += chunk.length;
            log(`   Written ${written}/${transactions.length} transactions...`, 'blue');
        }

        log(`   ✅ Seeded ${transactions.length} transactions for ${name}`, 'green');
    }

    log('\n════════════════════════════════════════════════════════════════', 'cyan');
    log('✅ Staging data seeding complete!', 'green');
    log('════════════════════════════════════════════════════════════════\n', 'cyan');

    log('You can now test with these users in staging:', 'yellow');
    for (const [name, user] of Object.entries(STAGING_USERS)) {
        if (userUids[name]) {
            log(`  • ${user.displayName}: ${user.email}`, 'cyan');
        }
    }
    log('', 'reset');
}

main().catch((error) => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
});
