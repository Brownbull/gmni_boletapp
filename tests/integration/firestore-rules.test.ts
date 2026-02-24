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
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

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

/**
 * TD-15b-11: Transaction write validation — catch-all bypass closed
 *
 * Verifies that `isValidTransactionWrite` is actually enforced for transaction writes,
 * i.e., the catch-all `{document=**}` rule does NOT bypass field validation.
 *
 * Before the fix: the catch-all granted write without calling isValidTransactionWrite,
 * so invalid writes (merchant >200 chars, non-numeric total) were silently accepted.
 * After the fix: catch-all also requires isValidTransactionWrite, closing the bypass.
 */
describe('Transaction write validation (TD-15b-11: catch-all bypass closed)', () => {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });

    /**
     * Test 6: Oversized merchant field rejected via both transaction rule AND catch-all
     *
     * If the catch-all bypass were open, this addDoc would SUCCEED (only auth required).
     * After the fix, both rules require isValidTransactionWrite, so this FAILS.
     */
    it('should reject transaction write with merchant field exceeding 200 chars', async () => {
        const userFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const txnCollection = collection(
            userFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        await assertFails(
            addDoc(txnCollection, {
                merchant: 'x'.repeat(201),
                date: '2026-02-24',
                total: 50.00,
                category: 'Groceries',
                items: [],
            })
        );
    });

    /**
     * Test 7: Non-numeric total field rejected
     *
     * total must be a number when present. A string value is rejected.
     */
    it('should reject transaction write with non-numeric total field', async () => {
        const userFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const txnCollection = collection(
            userFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        await assertFails(
            addDoc(txnCollection, {
                merchant: 'Valid Merchant',
                date: '2026-02-24',
                total: 'not-a-number',
                category: 'Groceries',
                items: [],
            })
        );
    });

    /**
     * Test 8: Valid transaction write accepted
     *
     * Confirms the fix doesn't break normal transaction writes.
     */
    it('should allow valid transaction write within field limits', async () => {
        const userFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const txnCollection = collection(
            userFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        await assertSucceeds(
            addDoc(txnCollection, {
                merchant: 'Jumbo',
                date: '2026-02-24',
                total: 9990,
                category: 'Groceries',
                items: [{ name: 'Leche', quantity: 2, price: 4995 }],
            })
        );
    });

    /**
     * Test 9: Non-transaction subcollection write still allowed
     *
     * isValidTransactionWrite returns true for documents without merchant/total fields.
     * Preferences, credits, and other subcollections are not blocked by the updated catch-all.
     */
    it('should allow non-transaction subcollection write (preferences) after catch-all update', async () => {
        const userFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const preferencesDoc = doc(
            userFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/preferences/settings`
        );

        await assertSucceeds(
            setDoc(preferencesDoc, {
                language: 'es',
                currency: 'CLP',
                theme: 'dark',
            })
        );
    });

    /**
     * Test 10: Transaction with exactly 200-char merchant accepted (boundary condition)
     *
     * Validates that the boundary is inclusive (<=200, not <200).
     */
    it('should allow transaction write with merchant field at exactly 200 chars', async () => {
        const userFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const txnCollection = collection(
            userFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
        );

        await assertSucceeds(
            addDoc(txnCollection, {
                merchant: 'x'.repeat(200),
                date: '2026-02-24',
                total: 100,
                category: 'Other',
                items: [],
            })
        );
    });

    /**
     * Test 11: Delete on non-transaction subcollection still allowed (catch-all delete guard)
     *
     * After TD-15b-11, catch-all uses `allow create, update` (not `allow write`) for the
     * isValidTransactionWrite guard. Delete is auth-only so it does not attempt to access
     * request.resource.data (which is null on delete and would deny). This test confirms
     * the regression is not present.
     */
    it('should allow delete on non-transaction subcollection (preferences) after catch-all update', async () => {
        const userFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const preferencesDoc = doc(
            userFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/preferences/settings`
        );

        // First create the document
        await assertSucceeds(
            setDoc(preferencesDoc, { language: 'es', currency: 'CLP', theme: 'dark' })
        );

        // Then delete it — must also be allowed
        await assertSucceeds(deleteDoc(preferencesDoc));
    });

    /**
     * Test 12: Non-transaction subcollection (credits) write still allowed
     *
     * Verifies the catch-all isValidTransactionWrite guard does not block credits
     * subcollection writes (no merchant/total fields → function returns true).
     */
    it('should allow non-transaction subcollection write (credits) after catch-all update', async () => {
        const userFirestore = getAuthedFirestore(TEST_USERS.USER_1);
        const creditsDoc = doc(
            userFirestore,
            `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/credits/balance`
        );

        await assertSucceeds(
            setDoc(creditsDoc, { amount: 100, currency: 'CLP' })
        );
    });
});

/**
 * TD-15b-12: Schema bounds — non-empty merchant and non-negative total
 *
 * Verifies that isValidTransactionWrite enforces:
 * - merchant (when present) is a non-empty string (size >= 1)
 * - total (when present) is non-negative (>= 0), with zero explicitly accepted
 *
 * AC4 (optional-field guard preserved) is covered by TD-15b-11 Tests 9 and 12
 * (preferences and credits subcollection writes without merchant/total still pass).
 */
describe('Transaction schema bounds (TD-15b-12)', () => {
    // Shared helper — creates a fresh collection reference for USER_1 transactions each call.
    const getTxnCollection = () => collection(
        getAuthedFirestore(TEST_USERS.USER_1),
        `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
    );

    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });

    it('should reject transaction write with empty merchant field (AC1)', async () => {
        await assertFails(
            addDoc(getTxnCollection(), { merchant: '', date: '2026-02-24', total: 50, category: 'Groceries', items: [] })
        );
    });

    it('should reject transaction write with negative total field (AC2)', async () => {
        await assertFails(
            addDoc(getTxnCollection(), { merchant: 'Jumbo', date: '2026-02-24', total: -1, category: 'Groceries', items: [] })
        );
    });

    it('should allow transaction write with zero total — free item (AC3)', async () => {
        await assertSucceeds(
            addDoc(getTxnCollection(), { merchant: 'Jumbo', date: '2026-02-24', total: 0, category: 'Groceries', items: [] })
        );
    });

    it('should allow transaction write with fractional total (AC3 extension)', async () => {
        await assertSucceeds(
            addDoc(getTxnCollection(), { merchant: 'Jumbo', date: '2026-02-24', total: 99.99, category: 'Groceries', items: [] })
        );
    });
});
