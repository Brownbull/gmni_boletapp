/**
 * Category Mapping Service Unit Tests
 *
 * Tests for the categoryMappingService.ts functions.
 * These are pure unit tests for the normalizeItemName function and
 * integration tests using Firebase emulator for CRUD operations.
 *
 * Story 6.1 - Category Mapping Infrastructure
 * AC #4: Unit tests cover all service functions with emulator
 */

import { describe, it, expect } from 'vitest';
import {
    getAuthedFirestore,
    getUnauthFirestore,
    TEST_USERS,
    TEST_COLLECTION_PATH,
    assertSucceeds,
    assertFails,
} from '../setup/firebase-emulator';
import { useFirebaseEmulatorLifecycle } from '../helpers';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import {
    normalizeItemName,
    saveCategoryMapping,
    getCategoryMappings,
    deleteCategoryMapping,
    incrementMappingUsage,
} from '../../src/services/categoryMappingService';
import { NewCategoryMapping } from '../../src/types/categoryMapping';

describe('normalizeItemName', () => {
    it('should convert to lowercase', () => {
        expect(normalizeItemName('UBER EATS')).toBe('uber eats');
        expect(normalizeItemName('Walmart')).toBe('walmart');
    });

    it('should trim whitespace', () => {
        expect(normalizeItemName('  uber  ')).toBe('uber');
        expect(normalizeItemName('\ttaxi\n')).toBe('taxi');
    });

    it('should remove special characters', () => {
        expect(normalizeItemName("Café 50%")).toBe('caf 50');
        expect(normalizeItemName('Uber-Eats!')).toBe('ubereats');
        expect(normalizeItemName('#1 Store')).toBe('1 store');
    });

    it('should collapse multiple spaces', () => {
        expect(normalizeItemName('uber   eats')).toBe('uber eats');
        expect(normalizeItemName('my    store   name')).toBe('my store name');
    });

    it('should handle empty strings', () => {
        expect(normalizeItemName('')).toBe('');
        expect(normalizeItemName('   ')).toBe('');
    });

    it('should handle unicode', () => {
        expect(normalizeItemName('Tienda España')).toBe('tienda espaa');
        expect(normalizeItemName('Café Ñoño')).toBe('caf oo');
    });
});

describe('Category Mapping Service with Emulator', () => {
    const APP_ID = 'boletapp-d609f';

    useFirebaseEmulatorLifecycle();

    describe('saveCategoryMapping', () => {
        it('should create a new mapping', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);
            const mapping: NewCategoryMapping = {
                originalItem: 'UBER EATS',
                normalizedItem: 'uber eats',
                targetCategory: 'Transport',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            };

            const docId = await saveCategoryMapping(
                db as any,
                TEST_USERS.USER_1,
                APP_ID,
                mapping
            );

            expect(docId).toBeTruthy();

            // Verify the document was created
            const mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );

            expect(mappings).toHaveLength(1);
            expect(mappings[0].originalItem).toBe('UBER EATS');
            expect(mappings[0].normalizedItem).toBe('uber eats');
            expect(mappings[0].targetCategory).toBe('Transport');
            expect(mappings[0].confidence).toBe(1.0);
            expect(mappings[0].source).toBe('user');
            expect(mappings[0].usageCount).toBe(0);
        });

        it('should update existing mapping with same normalizedItem', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);

            // Create initial mapping
            const mapping1: NewCategoryMapping = {
                originalItem: 'UBER EATS',
                normalizedItem: 'uber eats',
                targetCategory: 'Transport',
                confidence: 1.0,
                source: 'user',
                usageCount: 5,
            };

            const docId1 = await saveCategoryMapping(
                db as any,
                TEST_USERS.USER_1,
                APP_ID,
                mapping1
            );

            // Update with same normalizedItem but different category
            const mapping2: NewCategoryMapping = {
                originalItem: 'Uber Eats',
                normalizedItem: 'uber eats', // Same normalized item
                targetCategory: 'Restaurant', // Different category
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            };

            const docId2 = await saveCategoryMapping(
                db as any,
                TEST_USERS.USER_1,
                APP_ID,
                mapping2
            );

            // Should return same doc ID (updated, not created new)
            expect(docId2).toBe(docId1);

            // Verify only one mapping exists with updated category
            const mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );

            expect(mappings).toHaveLength(1);
            expect(mappings[0].targetCategory).toBe('Restaurant');
        });

        it('should create separate mappings for different items', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);

            const mapping1: NewCategoryMapping = {
                originalItem: 'Uber',
                normalizedItem: 'uber',
                targetCategory: 'Transport',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            };

            const mapping2: NewCategoryMapping = {
                originalItem: 'Walmart',
                normalizedItem: 'walmart',
                targetCategory: 'Supermarket',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            };

            await saveCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, mapping1);
            await saveCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, mapping2);

            const mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );

            expect(mappings).toHaveLength(2);
        });
    });

    describe('getCategoryMappings', () => {
        it('should return empty array when no mappings exist', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);

            const mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );

            expect(mappings).toEqual([]);
        });

        it('should return all mappings for a user', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);

            // Create multiple mappings
            const items = ['uber', 'walmart', 'costco'];
            for (const item of items) {
                await saveCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                    originalItem: item,
                    normalizedItem: item,
                    targetCategory: 'Other',
                    confidence: 1.0,
                    source: 'user',
                    usageCount: 0,
                });
            }

            const mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );

            expect(mappings).toHaveLength(3);
            const normalizedItems = mappings.map(m => m.normalizedItem);
            expect(normalizedItems).toContain('uber');
            expect(normalizedItems).toContain('walmart');
            expect(normalizedItems).toContain('costco');
        });

        it('should include document ID in returned mappings', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);

            const docId = await saveCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalItem: 'Test',
                normalizedItem: 'test',
                targetCategory: 'Other',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            });

            const mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );

            expect(mappings[0].id).toBe(docId);
        });
    });

    describe('deleteCategoryMapping', () => {
        it('should delete a mapping', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);

            // Create a mapping
            const docId = await saveCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalItem: 'ToDelete',
                normalizedItem: 'todelete',
                targetCategory: 'Other',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            });

            // Verify it exists
            let mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );
            expect(mappings).toHaveLength(1);

            // Delete it
            await deleteCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, docId);

            // Verify it's gone
            mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );
            expect(mappings).toHaveLength(0);
        });

        it('should not affect other mappings when deleting', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);

            // Create two mappings
            const docId1 = await saveCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalItem: 'Keep',
                normalizedItem: 'keep',
                targetCategory: 'Other',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            });

            const docId2 = await saveCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalItem: 'Delete',
                normalizedItem: 'delete',
                targetCategory: 'Other',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            });

            // Delete second mapping
            await deleteCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, docId2);

            // Verify first mapping still exists
            const mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );
            expect(mappings).toHaveLength(1);
            expect(mappings[0].normalizedItem).toBe('keep');
        });
    });

    describe('incrementMappingUsage', () => {
        it('should increment usage count', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1);

            // Create a mapping with usageCount 0
            const docId = await saveCategoryMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalItem: 'Test',
                normalizedItem: 'test',
                targetCategory: 'Other',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            });

            // Increment usage
            await incrementMappingUsage(db as any, TEST_USERS.USER_1, APP_ID, docId);

            // Verify usage count increased
            const mappings = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );
            expect(mappings[0].usageCount).toBe(1);

            // Increment again
            await incrementMappingUsage(db as any, TEST_USERS.USER_1, APP_ID, docId);

            const mappings2 = await getCategoryMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            );
            expect(mappings2[0].usageCount).toBe(2);
        });
    });

    describe('User Isolation', () => {
        it('should not allow users to access other users mappings', async () => {
            const user1Db = getAuthedFirestore(TEST_USERS.USER_1);
            const user2Db = getAuthedFirestore(TEST_USERS.USER_2);

            // User 1 creates a mapping
            await saveCategoryMapping(user1Db as any, TEST_USERS.USER_1, APP_ID, {
                originalItem: 'User1Only',
                normalizedItem: 'user1only',
                targetCategory: 'Other',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            });

            // User 2 creates a mapping
            await saveCategoryMapping(user2Db as any, TEST_USERS.USER_2, APP_ID, {
                originalItem: 'User2Only',
                normalizedItem: 'user2only',
                targetCategory: 'Other',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            });

            // User 1 can only see their own mapping
            const user1Mappings = await getCategoryMappings(
                user1Db as any,
                TEST_USERS.USER_1,
                APP_ID
            );
            expect(user1Mappings).toHaveLength(1);
            expect(user1Mappings[0].normalizedItem).toBe('user1only');

            // User 2 can only see their own mapping
            const user2Mappings = await getCategoryMappings(
                user2Db as any,
                TEST_USERS.USER_2,
                APP_ID
            );
            expect(user2Mappings).toHaveLength(1);
            expect(user2Mappings[0].normalizedItem).toBe('user2only');

            // User 1 trying to access User 2's mappings should fail (via security rules)
            const user2CollectionAsUser1 = collection(
                user1Db,
                `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/category_mappings`
            );
            await assertFails(getDocs(user2CollectionAsUser1));
        });

        it('should not allow unauthenticated access to mappings', async () => {
            const authedDb = getAuthedFirestore(TEST_USERS.USER_1);
            const unauthDb = getUnauthFirestore();

            // Create a mapping as authenticated user
            await saveCategoryMapping(authedDb as any, TEST_USERS.USER_1, APP_ID, {
                originalItem: 'Secret',
                normalizedItem: 'secret',
                targetCategory: 'Other',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            });

            // Unauthenticated user should not be able to read
            const unauthCollection = collection(
                unauthDb,
                `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/category_mappings`
            );
            await assertFails(getDocs(unauthCollection));
        });
    });
});
