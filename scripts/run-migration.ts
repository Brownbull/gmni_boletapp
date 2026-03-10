#!/usr/bin/env tsx
/**
 * Run Category Migration on Staging
 *
 * Calls the migrateCategories Cloud Function logic directly via Admin SDK.
 * This avoids the callable auth wrapper for server-side execution.
 *
 * Usage:
 *   npx tsx scripts/run-migration.ts                    # dry-run (default)
 *   npx tsx scripts/run-migration.ts --live             # actual migration
 *   npx tsx scripts/run-migration.ts --app production   # production (boletapp-d609f)
 */

import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Migration Maps (duplicated from functions/src/categoryMigrationMap.ts
// because we can't import from functions/ directly)
// ============================================================================

const STORE_CATEGORY_MIGRATION_MAP: Record<string, string> = {
    // V1/V2 -> V4
    'Beauty': 'HealthBeauty', 'Salon': 'HealthBeauty', 'Spa': 'HealthBeauty',
    'Pet Store': 'PetShop', 'Pets': 'PetShop',
    'Parking': 'Transport', 'Taxi': 'Transport', 'Ride Share': 'Transport',
    'Public Transit': 'Transport', 'Bus': 'Transport', 'Metro': 'Transport',
    'Bookstore': 'BookStore', 'Books': 'BookStore',
    'Home': 'HomeGoods', 'Home Decor': 'HomeGoods', 'Kitchenware': 'HomeGoods',
    'Garden': 'GardenCenter', 'Plant Nursery': 'GardenCenter',
    'Office': 'OfficeSupplies', 'Sports': 'SportsStore', 'Outdoors': 'SportsStore',
    'Toy Store': 'ToyStore', 'Game Shop': 'ToyStore',
    'Travel': 'TravelAgency', 'Tour Operator': 'TravelAgency',
    'Hotel': 'Lodging', 'Hostel': 'Lodging',
    'Bank': 'BankingFinance', 'Finance': 'BankingFinance', 'Insurance': 'BankingFinance',
    'Charity': 'CharityDonation', 'Donation': 'CharityDonation', 'Nonprofit': 'CharityDonation',
    // V3 -> V4
    'Clothing': 'ClothingStore', 'Electronics': 'ElectronicsStore',
    'Furniture': 'FurnitureStore', 'Automotive': 'AutoShop',
    'HotelLodging': 'Lodging', 'Gambling': 'Casino',
    'Services': 'GeneralServices', 'BooksMedia': 'BookStore',
    'SportsOutdoors': 'SportsStore', 'ToysGames': 'ToyStore',
    'Subscription': 'SubscriptionService',
    'StreetVendor': 'OpenMarket', 'MusicStore': 'Entertainment',
    'Jewelry': 'AccessoriesOptical', 'Optical': 'AccessoriesOptical',
    'Healthcare': 'Pharmacy',
    'Technology': 'ElectronicsStore',
};

const ITEM_CATEGORY_MIGRATION_MAP: Record<string, string> = {
    // V3 -> V4 (space-separated -> PascalCase)
    'Bakery': 'BreadPastry', 'Meat & Seafood': 'MeatSeafood',
    'Dairy & Eggs': 'DairyEggs', 'Frozen Foods': 'FrozenFoods',
    'Health & Beauty': 'BeautyCosmetics', 'Personal Care': 'PersonalCare',
    'Pharmacy': 'Medications', 'Prepared Food': 'PreparedFood',
    'Clothing': 'Apparel', 'Electronics': 'Technology',
    'Home & Garden': 'HomeEssentials', 'Fuel': 'CarAccessories',
    'Service': 'ServiceCharge', 'Other': 'OtherItem',
    'Subscription': 'Subscription',
    'Hardware': 'Tools', 'Automotive': 'CarAccessories',
    'Baby Products': 'BabyProducts', 'Cleaning Supplies': 'CleaningSupplies',
    'Household': 'HomeEssentials', 'Pet Supplies': 'PetSupplies',
    'Sports & Outdoors': 'SportsOutdoors', 'Toys & Games': 'ToysGames',
    'Books & Media': 'BooksMedia', 'Office & Stationery': 'OfficeStationery',
    'Crafts & Hobbies': 'Crafts', 'Furniture': 'Furnishings',
    'Tax & Fees': 'TaxFees', 'Insurance': 'Insurance',
    'Loan Payment': 'LoanPayment', 'Tickets & Events': 'TicketsEvents',
    'Tobacco': 'Tobacco', 'Gambling': 'GamesOfChance', 'Education': 'EducationFees',
};

// V4 canonical sets
const V4_STORE_CATEGORIES = new Set([
    'Supermarket', 'Wholesale', 'Restaurant', 'Almacen', 'Minimarket', 'OpenMarket',
    'Kiosk', 'LiquorStore', 'Bakery', 'Butcher', 'UtilityCompany', 'PropertyAdmin',
    'Pharmacy', 'Medical', 'Veterinary', 'HealthBeauty', 'Bazaar', 'ClothingStore',
    'ElectronicsStore', 'HomeGoods', 'FurnitureStore', 'Hardware', 'GardenCenter',
    'PetShop', 'BookStore', 'OfficeSupplies', 'SportsStore', 'ToyStore',
    'AccessoriesOptical', 'OnlineStore', 'AutoShop', 'GasStation', 'Transport',
    'GeneralServices', 'BankingFinance', 'TravelAgency', 'SubscriptionService',
    'Government', 'Education', 'Lodging', 'Entertainment', 'Casino',
    'CharityDonation', 'Other',
]);

const V4_ITEM_CATEGORIES = new Set([
    'Produce', 'MeatSeafood', 'BreadPastry', 'DairyEggs', 'Pantry', 'FrozenFoods',
    'Snacks', 'Beverages', 'PreparedFood', 'BeautyCosmetics', 'PersonalCare',
    'Medications', 'Supplements', 'BabyProducts', 'CleaningSupplies', 'HomeEssentials',
    'PetSupplies', 'PetFood', 'Furnishings', 'Apparel', 'Technology', 'Tools',
    'Garden', 'CarAccessories', 'SportsOutdoors', 'ToysGames', 'BooksMedia',
    'OfficeStationery', 'Crafts', 'ServiceCharge', 'TaxFees', 'Subscription',
    'Insurance', 'LoanPayment', 'TicketsEvents', 'HouseholdBills', 'CondoFees',
    'EducationFees', 'Alcohol', 'Tobacco', 'GamesOfChance', 'OtherItem',
]);

function migrateStore(cat: string): string {
    if (!cat || V4_STORE_CATEGORIES.has(cat)) return cat;
    return STORE_CATEGORY_MIGRATION_MAP[cat] || cat;
}

function migrateItem(cat: string): string {
    if (!cat || V4_ITEM_CATEGORIES.has(cat)) return cat;
    return ITEM_CATEGORY_MIGRATION_MAP[cat] || cat;
}

// ============================================================================
// Config
// ============================================================================

const args = process.argv.slice(2);
const dryRun = !args.includes('--live');
const isProduction = args.includes('--app') && args[args.indexOf('--app') + 1] === 'production';
const appId = isProduction ? 'boletapp-d609f' : 'boletapp-staging';
const keyPath = isProduction
    ? 'scripts/keys/serviceAccountKey.production.json'
    : 'scripts/keys/serviceAccountKey.staging.json';
const BATCH_SIZE = 500;

// ============================================================================
// Main
// ============================================================================

async function main() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log(`║  Category Migration Runner                                ║`);
    console.log(`║  App: ${appId.padEnd(50)}║`);
    console.log(`║  Mode: ${dryRun ? 'DRY RUN (no writes)' : '🔴 LIVE (will write!)'}${''.padEnd(dryRun ? 30 : 28)}║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const fullPath = join(process.cwd(), keyPath);
    if (!existsSync(fullPath)) {
        console.error(`Service account key not found: ${keyPath}`);
        process.exit(1);
    }

    if (getApps().length === 0) {
        const sa = JSON.parse(readFileSync(fullPath, 'utf8')) as ServiceAccount;
        initializeApp({ credential: cert(sa), projectId: appId.includes('staging') ? 'boletapp-staging' : 'boletapp-d609f' });
    }

    const db = getFirestore();
    const auth = getAuth();

    // Use Firebase Auth to enumerate users (user parent docs may not exist in Firestore)
    const allUsers: string[] = [];
    let pageToken: string | undefined;
    do {
        const listResult = await auth.listUsers(1000, pageToken);
        for (const user of listResult.users) {
            allUsers.push(user.uid);
        }
        pageToken = listResult.pageToken;
    } while (pageToken);

    console.log(`Found ${allUsers.length} users via Firebase Auth\n`);

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const updates: { ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }[] = [];

    for (const userId of allUsers) {
        const txSnapshot = await db
            .collection('artifacts').doc(appId)
            .collection('users').doc(userId)
            .collection('transactions').get();

        if (txSnapshot.empty) continue;

        let userMigrated = 0;
        let userSkipped = 0;

        for (const txDoc of txSnapshot.docs) {
            const tx = txDoc.data();
            const update: Record<string, unknown> = {};
            let needsUpdate = false;

            // Check store category
            if (tx.category) {
                const newCat = migrateStore(tx.category);
                if (newCat !== tx.category) {
                    update.category = newCat;
                    needsUpdate = true;
                    if (dryRun) {
                        console.log(`  [STORE] ${tx.category} → ${newCat} (${tx.merchant || 'unknown'})`);
                    }
                }
            }

            // Check item categories
            if (tx.items && Array.isArray(tx.items)) {
                let itemsChanged = false;
                const newItems = tx.items.map((item: Record<string, unknown>) => {
                    if (item.category && typeof item.category === 'string') {
                        const newItemCat = migrateItem(item.category);
                        if (newItemCat !== item.category) {
                            itemsChanged = true;
                            if (dryRun) {
                                console.log(`  [ITEM]  ${item.category} → ${newItemCat} (${item.name || 'unknown'})`);
                            }
                            return { ...item, category: newItemCat };
                        }
                    }
                    return item;
                });
                if (itemsChanged) {
                    update.items = newItems;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                updates.push({ ref: txDoc.ref, data: update });
                userMigrated++;
            } else {
                userSkipped++;
            }
        }

        const shortId = userId.substring(0, 12) + '...';
        console.log(`  User ${shortId}: ${txSnapshot.docs.length} txns, ${userMigrated} to migrate, ${userSkipped} skipped`);
        totalMigrated += userMigrated;
        totalSkipped += userSkipped;
    }

    console.log(`\n════════════════════════════════════════════════════════════`);
    console.log(`Total: ${totalMigrated} to migrate, ${totalSkipped} already V4`);

    if (!dryRun && updates.length > 0) {
        console.log(`\nCommitting ${updates.length} updates in batches of ${BATCH_SIZE}...`);

        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = db.batch();
            const chunk = updates.slice(i, i + BATCH_SIZE);
            for (const { ref, data } of chunk) {
                batch.update(ref, data);
            }
            try {
                await batch.commit();
                console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} docs updated`);
            } catch (err) {
                console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} FAILED:`, err);
                totalErrors += chunk.length;
            }
        }

        console.log(`\n✅ Migration complete: ${totalMigrated - totalErrors} migrated, ${totalErrors} errors`);
    } else if (dryRun) {
        console.log(`\n🔍 DRY RUN — no changes written. Use --live to apply.`);
    } else {
        console.log(`\n✅ Nothing to migrate — all data already V4.`);
    }
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
