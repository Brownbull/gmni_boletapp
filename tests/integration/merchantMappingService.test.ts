/**
 * Merchant Mapping Service Integration Tests
 *
 * Tests for the merchantMappingService.ts CRUD operations.
 * Uses Firebase emulator for Firestore operations.
 *
 * Story 9.4 - Merchant Mapping Infrastructure
 * AC #2: merchantMappingService.ts created following categoryMappingService pattern
 * AC #5: Upsert behavior prevents duplicate mappings for same normalizedMerchant
 * AC #7: Integration tests for Firestore operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
    setupFirebaseEmulator,
    teardownFirebaseEmulator,
    clearFirestoreData,
    getAuthedFirestore,
    getUnauthFirestore,
    TEST_USERS,
    TEST_COLLECTION_PATH,
    assertSucceeds,
    assertFails,
} from '../setup/firebase-emulator'
import { collection, getDocs } from 'firebase/firestore'
import {
    normalizeMerchantName,
    saveMerchantMapping,
    getMerchantMappings,
    deleteMerchantMapping,
    incrementMerchantMappingUsage,
} from '../../src/services/merchantMappingService'
import { NewMerchantMapping } from '../../src/types/merchantMapping'

describe('Merchant Mapping Service with Emulator', () => {
    const APP_ID = 'boletapp-d609f'

    beforeAll(async () => {
        await setupFirebaseEmulator()
    })

    afterAll(async () => {
        await teardownFirebaseEmulator()
    })

    beforeEach(async () => {
        await clearFirestoreData()
    })

    describe('saveMerchantMapping', () => {
        it('should create a new mapping', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)
            const mapping: NewMerchantMapping = {
                originalMerchant: 'UBER EATS',
                normalizedMerchant: 'uber eats',
                targetMerchant: 'Uber Eats',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            }

            const docId = await saveMerchantMapping(
                db as any,
                TEST_USERS.USER_1,
                APP_ID,
                mapping
            )

            expect(docId).toBeTruthy()

            // Verify the document was created
            const mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )

            expect(mappings).toHaveLength(1)
            expect(mappings[0].originalMerchant).toBe('UBER EATS')
            expect(mappings[0].normalizedMerchant).toBe('uber eats')
            expect(mappings[0].targetMerchant).toBe('Uber Eats')
            expect(mappings[0].confidence).toBe(1.0)
            expect(mappings[0].source).toBe('user')
            expect(mappings[0].usageCount).toBe(0)
        })

        it('should update existing mapping with same normalizedMerchant (upsert)', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)

            // Create initial mapping
            const mapping1: NewMerchantMapping = {
                originalMerchant: 'UBER EATS',
                normalizedMerchant: 'uber eats',
                targetMerchant: 'Uber Eats',
                confidence: 1.0,
                source: 'user',
                usageCount: 5,
            }

            const docId1 = await saveMerchantMapping(
                db as any,
                TEST_USERS.USER_1,
                APP_ID,
                mapping1
            )

            // Update with same normalizedMerchant but different target
            const mapping2: NewMerchantMapping = {
                originalMerchant: 'Uber Eats',
                normalizedMerchant: 'uber eats', // Same normalized merchant
                targetMerchant: 'UberEats', // Different target name
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            }

            const docId2 = await saveMerchantMapping(
                db as any,
                TEST_USERS.USER_1,
                APP_ID,
                mapping2
            )

            // Should return same doc ID (updated, not created new)
            expect(docId2).toBe(docId1)

            // Verify only one mapping exists with updated target
            const mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )

            expect(mappings).toHaveLength(1)
            expect(mappings[0].targetMerchant).toBe('UberEats')
        })

        it('should create separate mappings for different merchants', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)

            const mapping1: NewMerchantMapping = {
                originalMerchant: 'Uber',
                normalizedMerchant: 'uber',
                targetMerchant: 'Uber',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            }

            const mapping2: NewMerchantMapping = {
                originalMerchant: 'Walmart',
                normalizedMerchant: 'walmart',
                targetMerchant: 'Walmart',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            }

            await saveMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, mapping1)
            await saveMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, mapping2)

            const mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )

            expect(mappings).toHaveLength(2)
        })
    })

    describe('getMerchantMappings', () => {
        it('should return empty array when no mappings exist', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)

            const mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )

            expect(mappings).toEqual([])
        })

        it('should return all mappings for a user', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)

            // Create multiple mappings
            const merchants = ['uber', 'walmart', 'costco']
            for (const merchant of merchants) {
                await saveMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                    originalMerchant: merchant,
                    normalizedMerchant: merchant,
                    targetMerchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
                    confidence: 1.0,
                    source: 'user',
                    usageCount: 0,
                })
            }

            const mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )

            expect(mappings).toHaveLength(3)
            const normalizedMerchants = mappings.map(m => m.normalizedMerchant)
            expect(normalizedMerchants).toContain('uber')
            expect(normalizedMerchants).toContain('walmart')
            expect(normalizedMerchants).toContain('costco')
        })

        it('should include document ID in returned mappings', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)

            const docId = await saveMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalMerchant: 'Test',
                normalizedMerchant: 'test',
                targetMerchant: 'Test Store',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            })

            const mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )

            expect(mappings[0].id).toBe(docId)
        })
    })

    describe('deleteMerchantMapping', () => {
        it('should delete a mapping', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)

            // Create a mapping
            const docId = await saveMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalMerchant: 'ToDelete',
                normalizedMerchant: 'todelete',
                targetMerchant: 'To Delete Store',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            })

            // Verify it exists
            let mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )
            expect(mappings).toHaveLength(1)

            // Delete it
            await deleteMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, docId)

            // Verify it's gone
            mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )
            expect(mappings).toHaveLength(0)
        })

        it('should not affect other mappings when deleting', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)

            // Create two mappings
            const docId1 = await saveMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalMerchant: 'Keep',
                normalizedMerchant: 'keep',
                targetMerchant: 'Keep Store',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            })

            const docId2 = await saveMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalMerchant: 'Delete',
                normalizedMerchant: 'delete',
                targetMerchant: 'Delete Store',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            })

            // Delete second mapping
            await deleteMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, docId2)

            // Verify first mapping still exists
            const mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )
            expect(mappings).toHaveLength(1)
            expect(mappings[0].normalizedMerchant).toBe('keep')
        })
    })

    describe('incrementMerchantMappingUsage', () => {
        it('should increment usage count', async () => {
            const db = getAuthedFirestore(TEST_USERS.USER_1)

            // Create a mapping with usageCount 0
            const docId = await saveMerchantMapping(db as any, TEST_USERS.USER_1, APP_ID, {
                originalMerchant: 'Test',
                normalizedMerchant: 'test',
                targetMerchant: 'Test Store',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            })

            // Increment usage
            await incrementMerchantMappingUsage(db as any, TEST_USERS.USER_1, APP_ID, docId)

            // Verify usage count increased
            const mappings = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )
            expect(mappings[0].usageCount).toBe(1)

            // Increment again
            await incrementMerchantMappingUsage(db as any, TEST_USERS.USER_1, APP_ID, docId)

            const mappings2 = await getMerchantMappings(
                db as any,
                TEST_USERS.USER_1,
                APP_ID
            )
            expect(mappings2[0].usageCount).toBe(2)
        })
    })

    describe('User Isolation', () => {
        it('should not allow users to access other users mappings', async () => {
            const user1Db = getAuthedFirestore(TEST_USERS.USER_1)
            const user2Db = getAuthedFirestore(TEST_USERS.USER_2)

            // User 1 creates a mapping
            await saveMerchantMapping(user1Db as any, TEST_USERS.USER_1, APP_ID, {
                originalMerchant: 'User1Only',
                normalizedMerchant: 'user1only',
                targetMerchant: 'User 1 Store',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            })

            // User 2 creates a mapping
            await saveMerchantMapping(user2Db as any, TEST_USERS.USER_2, APP_ID, {
                originalMerchant: 'User2Only',
                normalizedMerchant: 'user2only',
                targetMerchant: 'User 2 Store',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            })

            // User 1 can only see their own mapping
            const user1Mappings = await getMerchantMappings(
                user1Db as any,
                TEST_USERS.USER_1,
                APP_ID
            )
            expect(user1Mappings).toHaveLength(1)
            expect(user1Mappings[0].normalizedMerchant).toBe('user1only')

            // User 2 can only see their own mapping
            const user2Mappings = await getMerchantMappings(
                user2Db as any,
                TEST_USERS.USER_2,
                APP_ID
            )
            expect(user2Mappings).toHaveLength(1)
            expect(user2Mappings[0].normalizedMerchant).toBe('user2only')

            // User 1 trying to access User 2's mappings should fail (via security rules)
            const user2CollectionAsUser1 = collection(
                user1Db,
                `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/merchant_mappings`
            )
            await assertFails(getDocs(user2CollectionAsUser1))
        })

        it('should not allow unauthenticated access to mappings', async () => {
            const authedDb = getAuthedFirestore(TEST_USERS.USER_1)
            const unauthDb = getUnauthFirestore()

            // Create a mapping as authenticated user
            await saveMerchantMapping(authedDb as any, TEST_USERS.USER_1, APP_ID, {
                originalMerchant: 'Secret',
                normalizedMerchant: 'secret',
                targetMerchant: 'Secret Store',
                confidence: 1.0,
                source: 'user',
                usageCount: 0,
            })

            // Unauthenticated user should not be able to read
            const unauthCollection = collection(
                unauthDb,
                `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/merchant_mappings`
            )
            await assertFails(getDocs(unauthCollection))
        })
    })
})
