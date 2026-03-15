/**
 * Tests for migrateCategories Cloud Function + categoryMigrationMap
 *
 * Story 17-5: Build and Execute Category Batch Migration
 *
 * Test coverage:
 * - Mapping completeness (all legacy keys map to valid V4 values)
 * - Helper function correctness
 * - Idempotency (double-migration produces zero writes)
 * - Auth check
 * - Dry-run mode
 * - Batch chunking at 500
 * - Item field preservation during migration
 */

import { STORE_CATEGORIES, ITEM_CATEGORIES } from '../shared/schema/categories';
import {
    STORE_CATEGORY_MIGRATION_MAP,
    ITEM_CATEGORY_MIGRATION_MAP,
    migrateStoreCategory,
    migrateItemCategory,
    isCanonicalStoreCategory,
    isCanonicalItemCategory,
} from '../categoryMigrationMap';

// ============================================================================
// Migration Map Tests
// ============================================================================

describe('categoryMigrationMap', () => {
    describe('STORE_CATEGORY_MIGRATION_MAP', () => {
        it('maps all values to valid V4 store categories', () => {
            const v4Set = new Set<string>(STORE_CATEGORIES);
            for (const [, value] of Object.entries(STORE_CATEGORY_MIGRATION_MAP)) {
                expect(v4Set.has(value)).toBe(true);
            }
        });

        it('contains all legacy V1/V2 store mappings', () => {
            expect(STORE_CATEGORY_MIGRATION_MAP['Beauty']).toBe('HealthBeauty');
            expect(STORE_CATEGORY_MIGRATION_MAP['Pet Store']).toBe('PetShop');
            expect(STORE_CATEGORY_MIGRATION_MAP['Parking']).toBe('Transport');
            expect(STORE_CATEGORY_MIGRATION_MAP['Hotel']).toBe('Lodging');
            expect(STORE_CATEGORY_MIGRATION_MAP['Bank']).toBe('BankingFinance');
        });

        it('contains all V3->V4 store renames', () => {
            expect(STORE_CATEGORY_MIGRATION_MAP['Clothing']).toBe('ClothingStore');
            expect(STORE_CATEGORY_MIGRATION_MAP['Electronics']).toBe('ElectronicsStore');
            expect(STORE_CATEGORY_MIGRATION_MAP['Gambling']).toBe('Casino');
            expect(STORE_CATEGORY_MIGRATION_MAP['Services']).toBe('GeneralServices');
            expect(STORE_CATEGORY_MIGRATION_MAP['Subscription']).toBe('SubscriptionService');
        });

        it('contains Spanish reverse mappings for store categories', () => {
            expect(STORE_CATEGORY_MIGRATION_MAP['Supermercado']).toBe('Supermarket');
            expect(STORE_CATEGORY_MIGRATION_MAP['Restaurante']).toBe('Restaurant');
            expect(STORE_CATEGORY_MIGRATION_MAP['Tienda de Ropa']).toBe('ClothingStore');
            expect(STORE_CATEGORY_MIGRATION_MAP['Bencinera']).toBe('GasStation');
        });
    });

    describe('ITEM_CATEGORY_MIGRATION_MAP', () => {
        it('maps all values to valid V4 item categories', () => {
            const v4Set = new Set<string>(ITEM_CATEGORIES);
            for (const [, value] of Object.entries(ITEM_CATEGORY_MIGRATION_MAP)) {
                expect(v4Set.has(value)).toBe(true);
            }
        });

        it('contains all legacy V1/V2 item mappings', () => {
            expect(ITEM_CATEGORY_MIGRATION_MAP['Fresh Food']).toBe('Produce');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Drinks']).toBe('Beverages');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Meat']).toBe('MeatSeafood');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Dairy']).toBe('DairyEggs');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Tech']).toBe('Technology');
        });

        it('contains all V3->V4 item renames', () => {
            expect(ITEM_CATEGORY_MIGRATION_MAP['Bakery']).toBe('BreadPastry');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Meat & Seafood']).toBe('MeatSeafood');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Health & Beauty']).toBe('BeautyCosmetics');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Pharmacy']).toBe('Medications');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Household']).toBe('HomeEssentials');
        });

        it('contains Spanish reverse mappings for item categories', () => {
            expect(ITEM_CATEGORY_MIGRATION_MAP['Frutas y Verduras']).toBe('Produce');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Carnes y Mariscos']).toBe('MeatSeafood');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Bebidas']).toBe('Beverages');
            expect(ITEM_CATEGORY_MIGRATION_MAP['Otro Producto']).toBe('OtherItem');
        });
    });

    describe('migrateStoreCategory', () => {
        it('maps legacy V3 values to V4', () => {
            expect(migrateStoreCategory('Clothing')).toBe('ClothingStore');
            expect(migrateStoreCategory('Gambling')).toBe('Casino');
        });

        it('maps legacy V1/V2 values to V4', () => {
            expect(migrateStoreCategory('Pet Store')).toBe('PetShop');
            expect(migrateStoreCategory('Taxi')).toBe('Transport');
        });

        it('passes through V4 canonical values unchanged', () => {
            expect(migrateStoreCategory('Supermarket')).toBe('Supermarket');
            expect(migrateStoreCategory('Restaurant')).toBe('Restaurant');
            expect(migrateStoreCategory('GasStation')).toBe('GasStation');
        });

        it('passes through unknown values unchanged', () => {
            expect(migrateStoreCategory('UnknownStore')).toBe('UnknownStore');
        });

        it('handles empty string', () => {
            expect(migrateStoreCategory('')).toBe('');
        });
    });

    describe('migrateItemCategory', () => {
        it('maps legacy V3 values to V4', () => {
            expect(migrateItemCategory('Bakery')).toBe('BreadPastry');
            expect(migrateItemCategory('Pharmacy')).toBe('Medications');
        });

        it('maps legacy V1/V2 values to V4', () => {
            expect(migrateItemCategory('Fresh Food')).toBe('Produce');
            expect(migrateItemCategory('Drinks')).toBe('Beverages');
        });

        it('passes through V4 canonical values unchanged', () => {
            expect(migrateItemCategory('Produce')).toBe('Produce');
            expect(migrateItemCategory('MeatSeafood')).toBe('MeatSeafood');
            expect(migrateItemCategory('BreadPastry')).toBe('BreadPastry');
        });

        it('passes through unknown values unchanged', () => {
            expect(migrateItemCategory('SomeUnknownCategory')).toBe('SomeUnknownCategory');
        });

        it('handles empty string', () => {
            expect(migrateItemCategory('')).toBe('');
        });

        it('maps Spanish item categories to V4', () => {
            expect(migrateItemCategory('Frutas y Verduras')).toBe('Produce');
            expect(migrateItemCategory('Medicamentos')).toBe('Medications');
        });
    });

    describe('isCanonicalStoreCategory', () => {
        it('returns true for V4 store categories', () => {
            expect(isCanonicalStoreCategory('Supermarket')).toBe(true);
            expect(isCanonicalStoreCategory('ClothingStore')).toBe(true);
            expect(isCanonicalStoreCategory('Casino')).toBe(true);
        });

        it('returns false for legacy store categories', () => {
            expect(isCanonicalStoreCategory('Clothing')).toBe(false);
            expect(isCanonicalStoreCategory('Gambling')).toBe(false);
            expect(isCanonicalStoreCategory('Pet Store')).toBe(false);
        });
    });

    describe('isCanonicalItemCategory', () => {
        it('returns true for V4 item categories', () => {
            expect(isCanonicalItemCategory('Produce')).toBe(true);
            expect(isCanonicalItemCategory('BreadPastry')).toBe(true);
            expect(isCanonicalItemCategory('OtherItem')).toBe(true);
        });

        it('returns false for legacy item categories', () => {
            expect(isCanonicalItemCategory('Bakery')).toBe(false);
            expect(isCanonicalItemCategory('Fresh Food')).toBe(false);
        });
    });
});

// ============================================================================
// Idempotency Tests
// ============================================================================

describe('idempotency', () => {
    it('migrating a V4 value returns itself (store)', () => {
        for (const cat of STORE_CATEGORIES) {
            expect(migrateStoreCategory(cat)).toBe(cat);
        }
    });

    it('migrating a V4 value returns itself (item)', () => {
        for (const cat of ITEM_CATEGORIES) {
            expect(migrateItemCategory(cat)).toBe(cat);
        }
    });

    it('double-migration produces same result (store)', () => {
        for (const [legacy, v4] of Object.entries(STORE_CATEGORY_MIGRATION_MAP)) {
            const first = migrateStoreCategory(legacy);
            const second = migrateStoreCategory(first);
            expect(second).toBe(first);
            expect(second).toBe(v4);
        }
    });

    it('double-migration produces same result (item)', () => {
        for (const [legacy, v4] of Object.entries(ITEM_CATEGORY_MIGRATION_MAP)) {
            const first = migrateItemCategory(legacy);
            const second = migrateItemCategory(first);
            expect(second).toBe(first);
            expect(second).toBe(v4);
        }
    });
});

// ============================================================================
// Cloud Function Tests (mocked Firestore)
// ============================================================================

// Mock firebase-admin before importing the function
const mockBatchUpdate = jest.fn();
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
const mockBatch = jest.fn(() => ({
    update: mockBatchUpdate,
    commit: mockBatchCommit,
}));

const mockCollection = jest.fn();

jest.mock('firebase-admin', () => {
    const actualAdmin = jest.requireActual('firebase-admin');
    return {
        ...actualAdmin,
        apps: [{}], // Pretend already initialized
        initializeApp: jest.fn(),
        firestore: jest.fn(() => ({
            batch: mockBatch,
            collection: mockCollection,
        })),
    };
});

jest.mock('firebase-functions', () => ({
    https: {
        onCall: (handler: Function) => handler,
        HttpsError: class HttpsError extends Error {
            constructor(public code: string, message: string) {
                super(message);
            }
        },
    },
}));

// Import after mocks
import { migrateCategories } from '../migrateCategories';

function makeDocSnapshot(
    id: string,
    data: Record<string, unknown>,
    refPath = `artifacts/boletapp-d609f/users/user1/transactions/${id}`
): { id: string; ref: { path: string }; data: () => Record<string, unknown> } {
    return {
        id,
        ref: { path: refPath },
        data: () => data,
    };
}

describe('migrateCategories Cloud Function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects unauthenticated requests', async () => {
        const handler = migrateCategories as unknown as Function;
        await expect(handler({}, { auth: null })).rejects.toThrow(
            'Authentication required'
        );
    });

    it('rejects non-admin users', async () => {
        const handler = migrateCategories as unknown as Function;
        await expect(
            handler({ appId: 'boletapp-d609f' }, { auth: { uid: 'user1', token: {} } })
        ).rejects.toThrow('Admin privileges required');
    });

    it('rejects missing appId', async () => {
        const handler = migrateCategories as unknown as Function;
        await expect(
            handler({}, { auth: { uid: 'admin', token: { admin: true } } })
        ).rejects.toThrow('appId is required');
    });

    it('defaults to dryRun=true', async () => {
        mockCollection.mockImplementation(() => ({
            get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
        }));

        const handler = migrateCategories as unknown as Function;
        const result = await handler(
            { appId: 'boletapp-d609f' },
            { auth: { uid: 'admin', token: { admin: true } } }
        );
        expect(result.dryRun).toBe(true);
    });

    it('dry run does not call batch.commit', async () => {
        const userDoc = { id: 'user1' };
        const txDoc = makeDocSnapshot('tx1', {
            category: 'Clothing', // Legacy V3
            items: [{ name: 'Shirt', category: 'Clothing', totalPrice: 100 }],
        });

        mockCollection.mockImplementation((path: string) => {
            if (path.endsWith('/users')) {
                return { get: jest.fn().mockResolvedValue({ size: 1, docs: [userDoc] }) };
            }
            return { get: jest.fn().mockResolvedValue({ size: 1, docs: [txDoc] }) };
        });

        const handler = migrateCategories as unknown as Function;
        const result = await handler({ dryRun: true, appId: 'boletapp-d609f' }, { auth: { uid: 'admin', token: { admin: true } } });

        expect(result.totalMigrated).toBe(1);
        expect(mockBatchCommit).not.toHaveBeenCalled();
    });

    it('real run commits batch updates', async () => {
        const userDoc = { id: 'user1' };
        const txDoc = makeDocSnapshot('tx1', {
            category: 'Clothing', // Legacy V3 -> ClothingStore
            items: [],
        });

        mockCollection.mockImplementation((path: string) => {
            if (path.endsWith('/users')) {
                return { get: jest.fn().mockResolvedValue({ size: 1, docs: [userDoc] }) };
            }
            return { get: jest.fn().mockResolvedValue({ size: 1, docs: [txDoc] }) };
        });

        const handler = migrateCategories as unknown as Function;
        const result = await handler({ dryRun: false, appId: 'boletapp-d609f' }, { auth: { uid: 'admin', token: { admin: true } } });

        expect(result.totalMigrated).toBe(1);
        expect(mockBatchCommit).toHaveBeenCalledTimes(1);
        expect(mockBatchUpdate).toHaveBeenCalledWith(
            txDoc.ref,
            expect.objectContaining({ category: 'ClothingStore' })
        );
    });

    it('skips already-migrated transactions (idempotent)', async () => {
        const userDoc = { id: 'user1' };
        const txDoc = makeDocSnapshot('tx1', {
            category: 'Supermarket', // Already V4
            items: [
                { name: 'Apple', category: 'Produce', totalPrice: 500 }, // Already V4
            ],
        });

        mockCollection.mockImplementation((path: string) => {
            if (path.endsWith('/users')) {
                return { get: jest.fn().mockResolvedValue({ size: 1, docs: [userDoc] }) };
            }
            return { get: jest.fn().mockResolvedValue({ size: 1, docs: [txDoc] }) };
        });

        const handler = migrateCategories as unknown as Function;
        const result = await handler({ dryRun: false, appId: 'boletapp-d609f' }, { auth: { uid: 'admin', token: { admin: true } } });

        expect(result.totalMigrated).toBe(0);
        expect(result.totalSkipped).toBe(1);
        expect(mockBatchCommit).not.toHaveBeenCalled();
    });

    it('migrates item-level categories while preserving all fields', async () => {
        const userDoc = { id: 'user1' };
        const txDoc = makeDocSnapshot('tx1', {
            category: 'Supermarket', // Already V4
            items: [
                {
                    name: 'Bread',
                    category: 'Bakery',
                    subcategory: 'Bread',
                    totalPrice: 1500,
                    qty: 2,
                    categorySource: 'scan',
                },
            ],
        });

        mockCollection.mockImplementation((path: string) => {
            if (path.endsWith('/users')) {
                return { get: jest.fn().mockResolvedValue({ size: 1, docs: [userDoc] }) };
            }
            return { get: jest.fn().mockResolvedValue({ size: 1, docs: [txDoc] }) };
        });

        const handler = migrateCategories as unknown as Function;
        const result = await handler({ dryRun: false, appId: 'boletapp-d609f' }, { auth: { uid: 'admin', token: { admin: true } } });

        expect(result.totalMigrated).toBe(1);
        expect(mockBatchUpdate).toHaveBeenCalledWith(
            txDoc.ref,
            expect.objectContaining({
                items: [
                    expect.objectContaining({
                        name: 'Bread',
                        category: 'BreadPastry', // Migrated
                        subcategory: 'Bread', // Preserved
                        totalPrice: 1500, // Preserved
                        qty: 2, // Preserved
                        categorySource: 'scan', // Preserved
                    }),
                ],
            })
        );
    });

    it('handles transactions with no items gracefully', async () => {
        const userDoc = { id: 'user1' };
        const txDoc = makeDocSnapshot('tx1', {
            category: 'Clothing', // Needs migration
        });

        mockCollection.mockImplementation((path: string) => {
            if (path.endsWith('/users')) {
                return { get: jest.fn().mockResolvedValue({ size: 1, docs: [userDoc] }) };
            }
            return { get: jest.fn().mockResolvedValue({ size: 1, docs: [txDoc] }) };
        });

        const handler = migrateCategories as unknown as Function;
        const result = await handler({ dryRun: false, appId: 'boletapp-d609f' }, { auth: { uid: 'admin', token: { admin: true } } });

        expect(result.totalMigrated).toBe(1);
        expect(mockBatchUpdate).toHaveBeenCalledWith(txDoc.ref, { category: 'ClothingStore' });
    });

    it('chunks batch operations at 500', async () => {
        const userDoc = { id: 'user1' };
        // Create 501 transactions that need migration
        const txDocs = Array.from({ length: 501 }, (_, i) =>
            makeDocSnapshot(`tx${i}`, {
                category: 'Clothing', // Legacy
                items: [],
            })
        );

        mockCollection.mockImplementation((path: string) => {
            if (path.endsWith('/users')) {
                return { get: jest.fn().mockResolvedValue({ size: 1, docs: [userDoc] }) };
            }
            return { get: jest.fn().mockResolvedValue({ size: 501, docs: txDocs }) };
        });

        const handler = migrateCategories as unknown as Function;
        const result = await handler({ dryRun: false, appId: 'boletapp-d609f' }, { auth: { uid: 'admin', token: { admin: true } } });

        // 501 docs -> 2 batches (500 + 1)
        expect(mockBatchCommit).toHaveBeenCalledTimes(2);
        expect(result.totalMigrated).toBe(501);
    });

    it('migrates mixed old and new categories in same transaction', async () => {
        const userDoc = { id: 'user1' };
        const txDoc = makeDocSnapshot('tx1', {
            category: 'Clothing', // Legacy store -> ClothingStore
            items: [
                { name: 'Apple', category: 'Produce', totalPrice: 500 }, // Already V4
                { name: 'Bread', category: 'Bakery', totalPrice: 1000 }, // Legacy -> BreadPastry
                { name: 'Milk', category: 'DairyEggs', totalPrice: 800 }, // Already V4
            ],
        });

        mockCollection.mockImplementation((path: string) => {
            if (path.endsWith('/users')) {
                return { get: jest.fn().mockResolvedValue({ size: 1, docs: [userDoc] }) };
            }
            return { get: jest.fn().mockResolvedValue({ size: 1, docs: [txDoc] }) };
        });

        const handler = migrateCategories as unknown as Function;
        await handler({ dryRun: false, appId: 'boletapp-d609f' }, { auth: { uid: 'admin', token: { admin: true } } });

        expect(mockBatchUpdate).toHaveBeenCalledWith(
            txDoc.ref,
            expect.objectContaining({
                category: 'ClothingStore',
                items: [
                    expect.objectContaining({ category: 'Produce' }), // Unchanged
                    expect.objectContaining({ category: 'BreadPastry' }), // Migrated
                    expect.objectContaining({ category: 'DairyEggs' }), // Unchanged
                ],
            })
        );
    });

    it('reports stats for multiple users', async () => {
        const userDocs = [{ id: 'user1' }, { id: 'user2' }];
        const txDoc1 = makeDocSnapshot('tx1', { category: 'Clothing', items: [] });
        const txDoc2 = makeDocSnapshot('tx2', { category: 'Supermarket', items: [] });

        let callCount = 0;
        mockCollection.mockImplementation((path: string) => {
            if (path.endsWith('/users')) {
                return {
                    get: jest.fn().mockResolvedValue({ size: 2, docs: userDocs }),
                };
            }
            callCount++;
            if (callCount === 1) {
                // user1: 1 tx needs migration
                return {
                    get: jest.fn().mockResolvedValue({ size: 1, docs: [txDoc1] }),
                };
            }
            // user2: 1 tx already V4
            return {
                get: jest.fn().mockResolvedValue({ size: 1, docs: [txDoc2] }),
            };
        });

        const handler = migrateCategories as unknown as Function;
        const result = await handler({ dryRun: false, appId: 'boletapp-d609f' }, { auth: { uid: 'admin', token: { admin: true } } });

        expect(result.totalUsers).toBe(2);
        expect(result.totalTransactions).toBe(2);
        expect(result.totalMigrated).toBe(1);
        expect(result.totalSkipped).toBe(1);
        expect(result.userStats).toHaveLength(2);
    });

    it('accepts custom appId for staging', async () => {
        mockCollection.mockImplementation((path: string) => {
            // Verify correct path is used
            expect(path).toContain('boletapp-staging');
            return {
                get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
            };
        });

        const handler = migrateCategories as unknown as Function;
        await handler(
            { appId: 'boletapp-staging' },
            { auth: { uid: 'admin', token: { admin: true } } }
        );

        expect(mockCollection).toHaveBeenCalledWith(
            'artifacts/boletapp-staging/users'
        );
    });
});
