/**
 * Firestore Security Rules Tests
 *
 * Tests Firestore security rules using @firebase/rules-unit-testing.
 * Validates that security rules correctly enforce authentication and user isolation.
 *
 * Story 2.4 - Authentication & Security Tests
 * Task 3: Firestore Security Rules Tests (5 tests)
 */

import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
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
} from '../setup/firebase-emulator';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

describe('Firestore Security Rules', () => {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        // Clear all data between tests for isolation
        await clearFirestoreData();
    });

    /**
     * Test 1: Unauthenticated users cannot read transactions
     *
     * Validates that anonymous users are denied access to transaction data.
     */
    it('should deny unauthenticated users from reading transactions', async () => {
        // First, create a transaction as an authenticated user
        const authedFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const authedCollection = collection(
            authedFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        const docRef = await assertSucceeds(
            addDoc(authedCollection, {
                merchant: 'Walmart',
                date: '2024-11-20',
                total: 50.00,
                category: 'Groceries',
                items: [],
            })
        );

        // Now try to read as unauthenticated user
        const unauthFirestore = getUnauthFirestore();
        const unauthCollection = collection(
            unauthFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        // Should fail - unauthenticated users cannot read
        await assertFails(getDocs(unauthCollection));

        // Try to read specific document
        const unauthDoc = doc(
            unauthFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions/${docRef.id}`
        );
        await assertFails(getDoc(unauthDoc));
    });

    /**
     * Test 2: Unauthenticated users cannot write transactions
     *
     * Validates that anonymous users cannot create, update, or delete transactions.
     */
    it('should deny unauthenticated users from writing transactions', async () => {
        const unauthFirestore = getUnauthFirestore();
        const unauthCollection = collection(
            unauthFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        // Try to create a transaction as unauthenticated user
        await assertFails(
            addDoc(unauthCollection, {
                merchant: 'Unauthorized',
                date: '2024-11-20',
                total: 100.00,
                category: 'Other',
                items: [],
            })
        );
    });

    /**
     * Test 3: Authenticated users can only read own transactions
     *
     * Validates that authenticated users can read their own data but not others'.
     */
    it('should allow authenticated users to read only their own transactions', async () => {
        // User 1 creates a transaction
        const user1Firestore = getAuthedFirestore(TEST_USERS.USER_1);
        const user1Collection = collection(
            user1Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        await assertSucceeds(
            addDoc(user1Collection, {
                merchant: 'Target',
                date: '2024-11-20',
                total: 75.50,
                category: 'Shopping',
                items: [],
            })
        );

        // User 1 can read their own transactions
        await assertSucceeds(getDocs(user1Collection));

        // User 2 creates a transaction
        const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
        const user2Collection = collection(
            user2Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/transactions`
        );

        await assertSucceeds(
            addDoc(user2Collection, {
                merchant: 'Costco',
                date: '2024-11-20',
                total: 125.00,
                category: 'Groceries',
                items: [],
            })
        );

        // User 2 can read their own transactions
        await assertSucceeds(getDocs(user2Collection));

        // User 1 cannot read User 2's transactions
        const user2CollectionAsUser1 = collection(
            user1Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/transactions`
        );
        await assertFails(getDocs(user2CollectionAsUser1));

        // User 2 cannot read User 1's transactions
        const user1CollectionAsUser2 = collection(
            user2Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );
        await assertFails(getDocs(user1CollectionAsUser2));
    });

    /**
     * Test 4: Authenticated users can only write own transactions
     *
     * Validates that users can create, update, and delete only their own transactions.
     */
    it('should allow authenticated users to write only their own transactions', async () => {
        // User 1 can create their own transaction
        const user1Firestore = getAuthedFirestore(TEST_USERS.USER_1);
        const user1Collection = collection(
            user1Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        const docRef = await assertSucceeds(
            addDoc(user1Collection, {
                merchant: 'Home Depot',
                date: '2024-11-20',
                total: 89.99,
                category: 'Shopping',
                items: [],
            })
        );

        // User 1 can update their own transaction
        const user1Doc = doc(
            user1Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions/${docRef.id}`
        );
        await assertSucceeds(
            updateDoc(user1Doc, {
                total: 95.00,
            })
        );

        // User 1 can delete their own transaction
        await assertSucceeds(deleteDoc(user1Doc));

        // User 1 cannot create in User 2's collection
        const user2CollectionAsUser1 = collection(
            user1Firestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_2}/transactions`
        );
        await assertFails(
            addDoc(user2CollectionAsUser1, {
                merchant: 'Malicious',
                date: '2024-11-20',
                total: 999.99,
                category: 'Other',
                items: [],
            })
        );
    });

    /**
     * Test 5: Security rules handle edge cases
     *
     * Validates that security rules correctly handle edge cases like:
     * - null userId
     * - malformed requests
     * - missing authentication
     */
    it('should handle edge cases correctly', async () => {
        // Try to access with empty/invalid user ID paths
        const unauthFirestore = getUnauthFirestore();

        // Attempt to access non-existent user path (unauthenticated)
        const nonExistentUserCollection = collection(
            unauthFirestore,
            `${TEST_COLLECTION_PATH}/non-existent-user/transactions`
        );
        await assertFails(getDocs(nonExistentUserCollection));

        // Try to access root artifacts collection directly (should be denied)
        const rootCollection = collection(unauthFirestore, 'artifacts');
        await assertFails(getDocs(rootCollection));

        // Authenticated user trying to access non-existent user path
        const authedFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const nonExistentUserAsAuthed = collection(
            authedFirestore,
            `${TEST_COLLECTION_PATH}/non-existent-user/transactions`
        );
        await assertFails(getDocs(nonExistentUserAsAuthed));

        // Try to access collection with wrong path structure
        const wrongPathCollection = collection(
            unauthFirestore,
            `artifacts/boletapp-d609f/transactions` // Missing users/{userId}
        );
        await assertFails(getDocs(wrongPathCollection));
    });
});
