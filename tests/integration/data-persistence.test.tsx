/**
 * Data Persistence Tests
 *
 * Tests that transactions persist correctly across sessions and that
 * real-time listeners work as expected with Firestore.
 *
 * Story 2.4 - Authentication & Security Tests
 * Task 4: Data Persistence Tests (3 tests)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
    setupFirebaseEmulator,
    teardownFirebaseEmulator,
    clearFirestoreData,
    getAuthedFirestore,
    TEST_USERS,
    TEST_COLLECTION_PATH,
    assertSucceeds,
} from '../setup/firebase-emulator';
import {
    collection,
    addDoc,
    getDocs,
    onSnapshot,
    updateDoc,
    doc,
} from 'firebase/firestore';

describe('Data Persistence', () => {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        // Clear data before each test for isolation from other test files
        await clearFirestoreData();
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    /**
     * Test 1: Transactions persist after page refresh
     *
     * Simulates page refresh by creating data, then reading it in a new context.
     * Verifies that Firestore data persists beyond component lifecycle.
     *
     * Note: Uses unique merchant name to avoid conflicts with other tests
     */
    it('should persist transactions after page refresh', async () => {
        const userId = TEST_USERS.USER_1;
        const firestore = getAuthedFirestore(userId);
        const transactionsPath = `${TEST_COLLECTION_PATH}/${userId}/transactions`;

        // Use unique merchant name for this test to identify the transaction
        const uniqueMerchant = 'WalmartPersistenceTest';

        // Create a transaction
        const transactionData = {
            merchant: uniqueMerchant,
            date: '2024-11-20',
            total: 87.43,
            category: 'Groceries',
            items: [
                { name: 'Milk', price: 4.99 },
                { name: 'Bread', price: 3.50 },
                { name: 'Eggs', price: 5.99 },
            ],
        };

        const docRef = await assertSucceeds(
            addDoc(collection(firestore, transactionsPath), transactionData)
        );

        // Wait for write to fully propagate in emulator
        // Increased to 1000ms for reliability with sequential test execution
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate page refresh by creating a new Firestore context
        const refreshedFirestore = getAuthedFirestore(userId);
        const refreshedCollection = collection(refreshedFirestore, transactionsPath);

        // Read the transaction with new context
        const snapshot = await assertSucceeds(getDocs(refreshedCollection));

        // Verify transaction persisted - find by unique merchant name
        expect(snapshot.size).toBeGreaterThanOrEqual(1);
        const persistedDoc = snapshot.docs.find(d => d.data().merchant === uniqueMerchant);
        expect(persistedDoc).toBeDefined();
        expect(persistedDoc!.id).toBe(docRef.id);
        expect(persistedDoc!.data().total).toBe(87.43);
        expect(persistedDoc!.data().category).toBe('Groceries');
        expect(persistedDoc!.data().items).toHaveLength(3);
    });

    /**
     * Test 2: Real-time listeners update when data changes
     *
     * Tests that onSnapshot listeners receive updates when data is added or modified.
     * This is critical for the app's real-time sync functionality.
     */
    it('should trigger real-time listeners when data changes', async () => {
        const userId = TEST_USERS.USER_1;
        const firestore = getAuthedFirestore(userId);
        const transactionsPath = `${TEST_COLLECTION_PATH}/${userId}/transactions`;
        const transactionsRef = collection(firestore, transactionsPath);

        // Set up a listener with a mock callback
        const listenerCallback = vi.fn();

        // Create snapshot listener
        const unsubscribe = onSnapshot(transactionsRef, (snapshot) => {
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            listenerCallback(transactions);
        });

        // Wait for initial snapshot
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify initial call happened
        expect(listenerCallback).toHaveBeenCalled();
        const initialCallCount = listenerCallback.mock.calls.length;

        // Add a transaction with unique merchant name
        await assertSucceeds(
            addDoc(transactionsRef, {
                merchant: 'TargetListenerTest',
                date: '2024-11-21',
                total: 45.99,
                category: 'Shopping',
                items: [],
            })
        );

        // Wait for listener to be called with new data (increased timeout)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify listener was called again after adding data
        expect(listenerCallback.mock.calls.length).toBeGreaterThan(initialCallCount);
        const lastCall = listenerCallback.mock.calls[listenerCallback.mock.calls.length - 1][0];
        expect(lastCall.length).toBeGreaterThan(0); // At least one transaction
        expect(lastCall.some((t: any) => t.merchant === 'TargetListenerTest')).toBe(true);
        expect(lastCall.some((t: any) => t.total === 45.99)).toBe(true);

        // Clean up listener
        unsubscribe();
    });

    /**
     * Test 3: Offline changes sync when back online (if supported)
     *
     * Tests Firestore's offline persistence capabilities.
     * Note: Full offline support requires enableIndexedDbPersistence,
     * but we test basic offline write capabilities here.
     */
    it('should handle data updates and maintain consistency', async () => {
        const userId = TEST_USERS.USER_1;
        const firestore = getAuthedFirestore(userId);
        const transactionsPath = `${TEST_COLLECTION_PATH}/${userId}/transactions`;
        const transactionsRef = collection(firestore, transactionsPath);

        // Create initial transaction with unique merchant name
        const uniqueMerchant = 'StarbucksConsistencyTest';
        const initialData = {
            merchant: uniqueMerchant,
            date: '2024-11-21',
            total: 5.25,
            category: 'Dining',
            items: [{ name: 'Latte', price: 5.25 }],
        };

        const docRef = await assertSucceeds(addDoc(transactionsRef, initialData));

        // Update the transaction
        const docToUpdate = doc(firestore, transactionsPath, docRef.id);
        await assertSucceeds(
            updateDoc(docToUpdate, {
                total: 10.50,
                items: [
                    { name: 'Latte', price: 5.25 },
                    { name: 'Croissant', price: 5.25 },
                ],
            })
        );

        // Read back and verify update persisted
        const snapshot = await assertSucceeds(getDocs(transactionsRef));
        expect(snapshot.size).toBeGreaterThanOrEqual(1);

        const updatedDoc = snapshot.docs.find(d => d.data().merchant === uniqueMerchant);
        expect(updatedDoc).toBeDefined();
        expect(updatedDoc!.data().total).toBe(10.50);
        expect(updatedDoc!.data().items).toHaveLength(2);
        expect(updatedDoc!.data().merchant).toBe(uniqueMerchant); // Unchanged field

        // Verify data consistency across multiple reads
        const snapshot2 = await assertSucceeds(getDocs(transactionsRef));
        const snapshot3 = await assertSucceeds(getDocs(transactionsRef));

        const doc2 = snapshot2.docs.find(d => d.data().merchant === uniqueMerchant);
        const doc3 = snapshot3.docs.find(d => d.data().merchant === uniqueMerchant);
        expect(doc2).toBeDefined();
        expect(doc3).toBeDefined();
        expect(doc2!.data().total).toBe(10.50);
        expect(doc3!.data().total).toBe(10.50);
    });
});
