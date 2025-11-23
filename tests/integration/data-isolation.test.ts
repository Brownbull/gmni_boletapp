/**
 * Data Isolation Tests
 *
 * Tests that users cannot access each other's data (tenant isolation).
 * Validates that Firestore security rules enforce user-level data boundaries.
 *
 * Story 2.4 - Authentication & Security Tests
 * Task 2: Data Isolation Tests (3 tests)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    setupFirebaseEmulator,
    teardownFirebaseEmulator,
    clearFirestoreData,
    getAuthedFirestore,
    TEST_USERS,
    TEST_COLLECTION_PATH,
    assertSucceeds,
    assertFails,
} from '../setup/firebase-emulator';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';

describe('Data Isolation', () => {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        // Clear all data between tests for isolation
        await clearFirestoreData();

        // Wait for cleanup to complete (emulator can be slow)
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    /**
     * Test 1: User 1 cannot read User 2's transactions
     *
     * Verifies that Firestore security rules prevent cross-user data access.
     */
    it('should prevent User 1 from reading User 2 transactions', async () => {
        // User 2 creates a transaction
        const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
        const user2Collection = collection(
            user2Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/transactions`
        );

        await assertSucceeds(
            addDoc(user2Collection, {
                merchant: 'Target',
                date: '2024-11-20',
                total: 45.99,
                category: 'Shopping',
                items: [],
            })
        );

        // User 1 tries to read User 2's transactions
        const user1Firestore = getAuthedFirestore(TEST_USERS.USER_1);
        const user1ReadingUser2Collection = collection(
            user1Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/transactions`
        );

        // This should fail due to security rules
        await assertFails(getDocs(user1ReadingUser2Collection));
    });

    /**
     * Test 2: User 1 cannot write to User 2's transaction collection
     *
     * Verifies that users cannot create or modify other users' data.
     */
    it('should prevent User 1 from writing to User 2 transaction collection', async () => {
        // User 1 tries to write to User 2's collection
        const user1Firestore = getAuthedFirestore(TEST_USERS.USER_1);
        const user2CollectionAsUser1 = collection(
            user1Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/transactions`
        );

        // This should fail due to security rules
        await assertFails(
            addDoc(user2CollectionAsUser1, {
                merchant: 'Malicious Transaction',
                date: '2024-11-20',
                total: 999.99,
                category: 'Other',
                items: [],
            })
        );
    });

    /**
     * Test 3: Cross-user queries return empty results
     *
     * Verifies that even if a user tries to query another user's path,
     * they get an empty result set (or permission denied) rather than data leakage.
     */
    it('should return empty/denied results for cross-user queries', async () => {
        // User 2 creates some transactions
        const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
        const user2Collection = collection(
            user2Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/transactions`
        );

        // Add 3 transactions for User 2
        await assertSucceeds(
            addDoc(user2Collection, {
                merchant: 'Walmart',
                date: '2024-11-18',
                total: 67.43,
                category: 'Groceries',
                items: [],
            })
        );

        await assertSucceeds(
            addDoc(user2Collection, {
                merchant: 'Starbucks',
                date: '2024-11-19',
                total: 5.25,
                category: 'Dining',
                items: [],
            })
        );

        await assertSucceeds(
            addDoc(user2Collection, {
                merchant: 'Shell',
                date: '2024-11-20',
                total: 42.00,
                category: 'Transportation',
                items: [],
            })
        );

        // Verify User 2 can read their own data
        const user2Docs = await assertSucceeds(getDocs(user2Collection));
        expect(user2Docs.size).toBe(3);

        // User 1 tries to query User 2's transactions
        const user1Firestore = getAuthedFirestore(TEST_USERS.USER_1);
        const user2PathAsUser1 = collection(
            user1Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/transactions`
        );

        // This should fail (permission denied)
        await assertFails(getDocs(user2PathAsUser1));
    });
});
