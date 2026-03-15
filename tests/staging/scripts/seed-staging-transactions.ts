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

// V4 canonical PascalCase categories (subset used in seed data)
// @see shared/schema/categories.ts for full list

type StoreCategory =
    | 'Supermarket'
    | 'Restaurant'
    | 'GasStation'
    | 'Transport'
    | 'Pharmacy'
    | 'ElectronicsStore'
    | 'SubscriptionService'
    | 'UtilityCompany'
    | 'Hardware'
    | 'ClothingStore'
    | 'Almacen'
    | 'Bakery'
    | 'OpenMarket'
    | 'Other';

type ItemCategory =
    | 'Produce'
    | 'MeatSeafood'
    | 'BreadPastry'
    | 'DairyEggs'
    | 'Pantry'
    | 'FrozenFoods'
    | 'Snacks'
    | 'Beverages'
    | 'PreparedFood'
    | 'BeautyCosmetics'
    | 'PersonalCare'
    | 'Medications'
    | 'Supplements'
    | 'Technology'
    | 'Apparel'
    | 'CarAccessories'
    | 'ServiceCharge'
    | 'Subscription'
    | 'HouseholdBills'
    | 'Tools'
    | 'Garden'
    | 'Furnishings'
    | 'CleaningSupplies'
    | 'HomeEssentials'
    | 'OtherItem';

interface TransactionItem {
    name: string;
    qty?: number;
    totalPrice: number;
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

// Transaction templates for realistic Chilean data (V4 categories)
const TRANSACTION_TEMPLATES: TransactionTemplate[] = [
    // Supermercados
    { storeName: 'Líder Express', category: 'Supermarket', minAmount: 15000, maxAmount: 85000 },
    { storeName: 'Jumbo', category: 'Supermarket', minAmount: 20000, maxAmount: 120000 },
    { storeName: 'Santa Isabel', category: 'Supermarket', minAmount: 10000, maxAmount: 60000 },
    { storeName: 'Unimarc', category: 'Supermarket', minAmount: 8000, maxAmount: 45000 },
    // Restaurantes
    { storeName: 'Starbucks', category: 'Restaurant', minAmount: 3500, maxAmount: 12000 },
    { storeName: 'McDonald\'s', category: 'Restaurant', minAmount: 4000, maxAmount: 15000 },
    { storeName: 'Domino\'s Pizza', category: 'Restaurant', minAmount: 8000, maxAmount: 25000 },
    { storeName: 'Sushi Express', category: 'Restaurant', minAmount: 12000, maxAmount: 35000 },
    // Bencinera (was Transport in V3)
    { storeName: 'Copec', category: 'GasStation', minAmount: 20000, maxAmount: 60000 },
    { storeName: 'Shell', category: 'GasStation', minAmount: 25000, maxAmount: 70000 },
    // Transporte
    { storeName: 'Metro de Santiago', category: 'Transport', minAmount: 1000, maxAmount: 5000 },
    { storeName: 'Uber', category: 'Transport', minAmount: 3000, maxAmount: 15000 },
    // Farmacia (was Healthcare in V3)
    { storeName: 'Cruz Verde', category: 'Pharmacy', minAmount: 5000, maxAmount: 50000 },
    { storeName: 'Farmacias Ahumada', category: 'Pharmacy', minAmount: 3000, maxAmount: 30000 },
    // Tienda de Electrónica (was Technology in V3)
    { storeName: 'PC Factory', category: 'ElectronicsStore', minAmount: 30000, maxAmount: 500000 },
    { storeName: 'Falabella Tech', category: 'ElectronicsStore', minAmount: 20000, maxAmount: 300000 },
    // Suscripciones (was Services in V3)
    { storeName: 'VTR', category: 'SubscriptionService', minAmount: 25000, maxAmount: 45000 },
    { storeName: 'Entel', category: 'SubscriptionService', minAmount: 15000, maxAmount: 35000 },
    // Servicios Básicos (was Services in V3)
    { storeName: 'Enel', category: 'UtilityCompany', minAmount: 30000, maxAmount: 80000 },
    // Ferretería (was Other in V3)
    { storeName: 'Sodimac', category: 'Hardware', minAmount: 15000, maxAmount: 200000 },
    // Tienda de Ropa (was Other in V3)
    { storeName: 'Paris', category: 'ClothingStore', minAmount: 10000, maxAmount: 150000 },
    // Comercio de Barrio (NEW V4 categories)
    { storeName: 'Almacén Don Pedro', category: 'Almacen', minAmount: 2000, maxAmount: 15000 },
    { storeName: 'Panadería La Rosa', category: 'Bakery', minAmount: 1500, maxAmount: 8000 },
    { storeName: 'Feria Libre', category: 'OpenMarket', minAmount: 5000, maxAmount: 25000 },
];

// Item templates mapped to V4 store categories - ensures realistic items per store type
const ITEM_TEMPLATES_BY_CATEGORY: Record<StoreCategory, ItemTemplate[]> = {
    Supermarket: [
        { name: 'Leche entera', category: 'DairyEggs', minPrice: 1200, maxPrice: 2500 },
        { name: 'Pan de molde', category: 'BreadPastry', minPrice: 1500, maxPrice: 3000 },
        { name: 'Manzanas', category: 'Produce', minPrice: 1800, maxPrice: 4000 },
        { name: 'Plátanos', category: 'Produce', minPrice: 800, maxPrice: 2000 },
        { name: 'Pollo entero', category: 'MeatSeafood', minPrice: 4500, maxPrice: 8000 },
        { name: 'Arroz', category: 'Pantry', minPrice: 1500, maxPrice: 3500 },
        { name: 'Fideos', category: 'Pantry', minPrice: 800, maxPrice: 1800 },
        { name: 'Aceite vegetal', category: 'Pantry', minPrice: 2500, maxPrice: 5000 },
        { name: 'Huevos docena', category: 'DairyEggs', minPrice: 3000, maxPrice: 5500 },
        { name: 'Queso laminado', category: 'DairyEggs', minPrice: 2500, maxPrice: 4500 },
        { name: 'Yogurt pack', category: 'DairyEggs', minPrice: 2000, maxPrice: 4000 },
        { name: 'Jugo de naranja', category: 'Beverages', minPrice: 1500, maxPrice: 3500 },
        { name: 'Agua mineral 6L', category: 'Beverages', minPrice: 2500, maxPrice: 4500 },
        { name: 'Galletas', category: 'Snacks', minPrice: 1200, maxPrice: 2800 },
        { name: 'Helado 1L', category: 'FrozenFoods', minPrice: 3500, maxPrice: 6500 },
        { name: 'Pizza congelada', category: 'FrozenFoods', minPrice: 4000, maxPrice: 7000 },
        { name: 'Papel higiénico', category: 'PersonalCare', minPrice: 4000, maxPrice: 8000 },
        { name: 'Detergente', category: 'CleaningSupplies', minPrice: 3500, maxPrice: 7000 },
    ],
    Restaurant: [
        { name: 'Menú del día', category: 'PreparedFood', minPrice: 5000, maxPrice: 12000 },
        { name: 'Café latte', category: 'Beverages', minPrice: 2500, maxPrice: 4500 },
        { name: 'Sandwich', category: 'PreparedFood', minPrice: 3500, maxPrice: 7000 },
        { name: 'Hamburguesa', category: 'PreparedFood', minPrice: 5500, maxPrice: 12000 },
        { name: 'Pizza mediana', category: 'PreparedFood', minPrice: 8000, maxPrice: 15000 },
        { name: 'Sushi roll', category: 'PreparedFood', minPrice: 6000, maxPrice: 14000 },
        { name: 'Bebida gaseosa', category: 'Beverages', minPrice: 1500, maxPrice: 3000 },
        { name: 'Postre', category: 'PreparedFood', minPrice: 3000, maxPrice: 6000 },
        { name: 'Papas fritas', category: 'PreparedFood', minPrice: 2500, maxPrice: 5000 },
        { name: 'Ensalada', category: 'PreparedFood', minPrice: 4000, maxPrice: 8000 },
    ],
    GasStation: [
        { name: 'Gasolina 95', category: 'CarAccessories', minPrice: 15000, maxPrice: 60000 },
        { name: 'Gasolina 93', category: 'CarAccessories', minPrice: 12000, maxPrice: 50000 },
        { name: 'Petróleo diesel', category: 'CarAccessories', minPrice: 18000, maxPrice: 55000 },
        { name: 'Lavado auto', category: 'ServiceCharge', minPrice: 5000, maxPrice: 15000 },
    ],
    Transport: [
        { name: 'Viaje metro', category: 'ServiceCharge', minPrice: 800, maxPrice: 1500 },
        { name: 'Viaje Uber', category: 'ServiceCharge', minPrice: 2500, maxPrice: 12000 },
    ],
    Pharmacy: [
        { name: 'Ibuprofeno', category: 'Medications', minPrice: 2000, maxPrice: 5000 },
        { name: 'Paracetamol', category: 'Medications', minPrice: 1500, maxPrice: 4000 },
        { name: 'Vitaminas', category: 'Supplements', minPrice: 5000, maxPrice: 15000 },
        { name: 'Jarabe para tos', category: 'Medications', minPrice: 4000, maxPrice: 12000 },
        { name: 'Crema hidratante', category: 'BeautyCosmetics', minPrice: 3500, maxPrice: 12000 },
        { name: 'Protector solar', category: 'BeautyCosmetics', minPrice: 6000, maxPrice: 18000 },
        { name: 'Shampoo', category: 'PersonalCare', minPrice: 3000, maxPrice: 8000 },
        { name: 'Pasta dental', category: 'PersonalCare', minPrice: 2000, maxPrice: 5000 },
    ],
    ElectronicsStore: [
        { name: 'Auriculares bluetooth', category: 'Technology', minPrice: 15000, maxPrice: 80000 },
        { name: 'Cable USB-C', category: 'Technology', minPrice: 5000, maxPrice: 15000 },
        { name: 'Mouse inalámbrico', category: 'Technology', minPrice: 12000, maxPrice: 45000 },
        { name: 'Teclado', category: 'Technology', minPrice: 20000, maxPrice: 120000 },
        { name: 'Pendrive 64GB', category: 'Technology', minPrice: 8000, maxPrice: 25000 },
        { name: 'Cargador rápido', category: 'Technology', minPrice: 10000, maxPrice: 35000 },
        { name: 'Funda celular', category: 'Technology', minPrice: 5000, maxPrice: 20000 },
        { name: 'Parlante portátil', category: 'Technology', minPrice: 25000, maxPrice: 150000 },
    ],
    SubscriptionService: [
        { name: 'Plan mensual internet', category: 'Subscription', minPrice: 20000, maxPrice: 45000 },
        { name: 'Plan celular', category: 'Subscription', minPrice: 12000, maxPrice: 35000 },
    ],
    UtilityCompany: [
        { name: 'Cuenta eléctrica', category: 'HouseholdBills', minPrice: 25000, maxPrice: 80000 },
        { name: 'Cuenta agua', category: 'HouseholdBills', minPrice: 8000, maxPrice: 25000 },
        { name: 'Cuenta gas', category: 'HouseholdBills', minPrice: 15000, maxPrice: 45000 },
    ],
    Hardware: [
        { name: 'Herramientas', category: 'Tools', minPrice: 8000, maxPrice: 50000 },
        { name: 'Pintura', category: 'Tools', minPrice: 12000, maxPrice: 45000 },
        { name: 'Plantas', category: 'Garden', minPrice: 5000, maxPrice: 25000 },
        { name: 'Tornillos y clavos', category: 'Tools', minPrice: 1500, maxPrice: 8000 },
        { name: 'Decoración hogar', category: 'Furnishings', minPrice: 10000, maxPrice: 60000 },
    ],
    ClothingStore: [
        { name: 'Ropa', category: 'Apparel', minPrice: 15000, maxPrice: 80000 },
        { name: 'Zapatos', category: 'Apparel', minPrice: 25000, maxPrice: 120000 },
        { name: 'Accesorios', category: 'OtherItem', minPrice: 5000, maxPrice: 35000 },
    ],
    Almacen: [
        { name: 'Pan', category: 'BreadPastry', minPrice: 500, maxPrice: 2000 },
        { name: 'Bebida', category: 'Beverages', minPrice: 800, maxPrice: 2500 },
        { name: 'Fiambre', category: 'MeatSeafood', minPrice: 1500, maxPrice: 4000 },
        { name: 'Dulces', category: 'Snacks', minPrice: 300, maxPrice: 1500 },
    ],
    Bakery: [
        { name: 'Marraqueta', category: 'BreadPastry', minPrice: 500, maxPrice: 1500 },
        { name: 'Hallullas', category: 'BreadPastry', minPrice: 500, maxPrice: 1500 },
        { name: 'Torta', category: 'BreadPastry', minPrice: 5000, maxPrice: 15000 },
        { name: 'Empanadas', category: 'PreparedFood', minPrice: 1000, maxPrice: 3000 },
    ],
    OpenMarket: [
        { name: 'Frutas de estación', category: 'Produce', minPrice: 1000, maxPrice: 5000 },
        { name: 'Verduras frescas', category: 'Produce', minPrice: 800, maxPrice: 4000 },
        { name: 'Huevos campo', category: 'DairyEggs', minPrice: 3000, maxPrice: 6000 },
        { name: 'Queso fresco', category: 'DairyEggs', minPrice: 2000, maxPrice: 5000 },
        { name: 'Pescado fresco', category: 'MeatSeafood', minPrice: 3000, maxPrice: 12000 },
    ],
    Other: [
        { name: 'Producto general', category: 'OtherItem', minPrice: 5000, maxPrice: 50000 },
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
        return [{ name: 'Producto', totalPrice: targetTotal, category: 'OtherItem', qty: 1 }];
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

        let totalPrice: number;
        if (isLast) {
            // Last item gets the remaining amount (ensures total matches)
            totalPrice = Math.max(template.minPrice, remainingTotal);
        } else {
            // Random price within template range, but not more than remaining
            const maxAllowed = Math.min(template.maxPrice, remainingTotal - (selectedTemplates.length - i - 1) * 1000);
            totalPrice = Math.floor(
                Math.random() * (maxAllowed - template.minPrice) + template.minPrice
            );
            totalPrice = Math.max(template.minPrice, Math.min(totalPrice, remainingTotal - 1000));
        }

        // Random quantity (1-3, usually 1)
        const qty = Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 2) + 2;

        items.push({
            name: template.name,
            totalPrice: Math.round(totalPrice / qty), // Price per unit
            category: template.category,
            qty,
        });

        remainingTotal -= totalPrice;
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
    const actualTotal = items.reduce((sum, item) => sum + (item.totalPrice * (item.qty || 1)), 0);

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
            // Family shopper: groceries, restaurants, gas, subscriptions, utilities
            frequency = 3;
            preferredCategories = ['Supermarket', 'Restaurant', 'GasStation', 'SubscriptionService', 'UtilityCompany', 'Bakery'];
            break;
        case 'bob':
            // Frequent eater: restaurants, supermarkets, transport, corner stores
            frequency = 2;
            preferredCategories = ['Restaurant', 'Supermarket', 'Transport', 'Almacen'];
            break;
        case 'charlie':
            // Tech + home: electronics, hardware, supermarkets, subscriptions
            frequency = 5;
            preferredCategories = ['ElectronicsStore', 'Hardware', 'Supermarket', 'SubscriptionService'];
            break;
        case 'diana':
            // Diverse spender: all categories for rich analytics data
            frequency = 2.5;
            preferredCategories = ['Supermarket', 'Restaurant', 'Pharmacy', 'ElectronicsStore', 'SubscriptionService', 'Transport', 'ClothingStore', 'OpenMarket', 'GasStation'];
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
