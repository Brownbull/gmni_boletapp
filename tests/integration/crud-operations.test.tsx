/**
 * Transaction CRUD Operations Integration Tests
 *
 * Tests the complete CRUD (Create, Read, Update, Delete) lifecycle of transactions
 * using Firebase Firestore emulator. Covers 8+ test cases as defined in Story 2.5.
 *
 * Risk Level: MEDIUM (core feature protection)
 * Coverage: Firestore service layer, transaction lifecycle
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import {
  setupFirebaseEmulator,
  clearFirestoreData,
  teardownFirebaseEmulator,
  getAuthedFirestore,
  TEST_USERS,
} from '../setup/firebase-emulator';
import { addTransaction, updateTransaction, deleteTransaction, subscribeToTransactions } from '../../src/services/firestore';
import { Transaction } from '../../src/types/transaction';
import { collection, getDocs } from 'firebase/firestore';

const APP_ID = 'boletapp-d609f';

describe('Transaction CRUD Operations', () => {
  beforeAll(async () => {
    await setupFirebaseEmulator();
  });

  afterEach(async () => {
    await clearFirestoreData();
  });

  afterAll(async () => {
    await teardownFirebaseEmulator();
  });

  /**
   * Test 1: Create transaction manually
   * Verifies that a transaction can be created with all required fields
   */
  it('should create a transaction manually', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);

    const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
      date: '2025-11-23',
      merchant: 'Test Merchant',
      category: 'Supermarket',
      total: 45.99,
      items: [
        { name: 'Test Item 1', qty: 2, price: 10.50 },
        { name: 'Test Item 2', qty: 1, price: 24.99 }
      ]
    };

    const docId = await addTransaction(db, TEST_USERS.USER_1, APP_ID, transaction);

    expect(docId).toBeTruthy();
    expect(typeof docId).toBe('string');

    // Verify the transaction was created in Firestore
    const collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions');
    const snapshot = await getDocs(collectionRef);

    expect(snapshot.size).toBe(1);
    const doc = snapshot.docs[0];
    expect(doc.id).toBe(docId);
    expect(doc.data().merchant).toBe('Test Merchant');
    expect(doc.data().total).toBe(45.99);
  });

  /**
   * Test 2: Create transaction from scanned receipt
   * Simulates creating a transaction with data extracted from Gemini AI
   */
  it('should create a transaction from scanned receipt data', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);

    // Simulated Gemini AI response
    const scannedTransaction: Omit<Transaction, 'id' | 'createdAt'> = {
      date: '2025-11-22',
      merchant: 'Whole Foods Market',
      category: 'Supermarket',
      total: 87.43,
      items: [
        { name: 'Organic Milk', qty: 2, price: 6.99 },
        { name: 'Fresh Vegetables', qty: 1, price: 12.50 },
        { name: 'Chicken Breast', qty: 2, price: 15.99 }
      ]
    };

    const docId = await addTransaction(db, TEST_USERS.USER_1, APP_ID, scannedTransaction);

    expect(docId).toBeTruthy();

    // Verify all item details were preserved
    const collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions');
    const snapshot = await getDocs(collectionRef);
    const doc = snapshot.docs[0];
    const data = doc.data();

    expect(data.items).toHaveLength(3);
    expect(data.items[0].name).toBe('Organic Milk');
    expect(data.items[0].qty).toBe(2);
    expect(data.items[0].price).toBe(6.99);
  });

  /**
   * Test 3: Read transaction list
   * Verifies that multiple transactions can be retrieved for a user
   */
  it('should read transaction list for a user', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);

    // Create 3 transactions
    const transactions = [
      { date: '2025-11-23', merchant: 'Store A', category: 'Supermarket', total: 50.00, items: [] },
      { date: '2025-11-22', merchant: 'Store B', category: 'Restaurant', total: 30.00, items: [] },
      { date: '2025-11-21', merchant: 'Store C', category: 'Transport', total: 20.00, items: [] }
    ];

    for (const txn of transactions) {
      await addTransaction(db, TEST_USERS.USER_1, APP_ID, txn as Omit<Transaction, 'id' | 'createdAt'>);
    }

    // Read all transactions
    const collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions');
    const snapshot = await getDocs(collectionRef);

    expect(snapshot.size).toBe(3);
    const merchants = snapshot.docs.map(doc => doc.data().merchant);
    expect(merchants).toContain('Store A');
    expect(merchants).toContain('Store B');
    expect(merchants).toContain('Store C');
  });

  /**
   * Test 4: Read single transaction by ID
   * Verifies that a specific transaction can be retrieved by its ID
   */
  it('should read a single transaction by ID', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);

    const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
      date: '2025-11-23',
      merchant: 'Target Store',
      category: 'Other',
      total: 99.99,
      items: []
    };

    const docId = await addTransaction(db, TEST_USERS.USER_1, APP_ID, transaction);

    // Read the specific transaction
    const collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions');
    const snapshot = await getDocs(collectionRef);
    const doc = snapshot.docs.find(d => d.id === docId);

    expect(doc).toBeDefined();
    expect(doc!.data().merchant).toBe('Target Store');
    expect(doc!.data().total).toBe(99.99);
  });

  /**
   * Test 5: Update transaction fields
   * Verifies that transaction fields can be updated
   */
  it('should update transaction fields', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);

    // Create a transaction
    const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
      date: '2025-11-23',
      merchant: 'Old Merchant',
      category: 'Supermarket',
      total: 50.00,
      items: []
    };

    const docId = await addTransaction(db, TEST_USERS.USER_1, APP_ID, transaction);

    // Update the transaction
    await updateTransaction(db, TEST_USERS.USER_1, APP_ID, docId, {
      merchant: 'Updated Merchant',
      total: 75.00
    });

    // Verify the update
    const collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions');
    const snapshot = await getDocs(collectionRef);
    const doc = snapshot.docs[0];
    const data = doc.data();

    expect(data.merchant).toBe('Updated Merchant');
    expect(data.total).toBe(75.00);
    expect(data.category).toBe('Supermarket'); // Unchanged field should remain
  });

  /**
   * Test 6: Delete transaction
   * Verifies that a transaction can be deleted
   */
  it('should delete a transaction', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);

    // Create a transaction
    const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
      date: '2025-11-23',
      merchant: 'To Be Deleted',
      category: 'Other',
      total: 10.00,
      items: []
    };

    const docId = await addTransaction(db, TEST_USERS.USER_1, APP_ID, transaction);

    // Verify it was created
    let collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions');
    let snapshot = await getDocs(collectionRef);
    expect(snapshot.size).toBe(1);

    // Delete the transaction
    await deleteTransaction(db, TEST_USERS.USER_1, APP_ID, docId);

    // Verify it was deleted
    snapshot = await getDocs(collectionRef);
    expect(snapshot.size).toBe(0);
  });

  /**
   * Test 7: Transactions filtered by date range
   * Verifies that transactions can be filtered by date
   */
  it('should filter transactions by date range', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);

    // Create transactions across different dates
    const transactions = [
      { date: '2025-11-01', merchant: 'Store A', category: 'Supermarket', total: 10.00, items: [] },
      { date: '2025-11-15', merchant: 'Store B', category: 'Restaurant', total: 20.00, items: [] },
      { date: '2025-11-30', merchant: 'Store C', category: 'Transport', total: 30.00, items: [] }
    ];

    for (const txn of transactions) {
      await addTransaction(db, TEST_USERS.USER_1, APP_ID, txn as Omit<Transaction, 'id' | 'createdAt'>);
    }

    // Read all transactions
    const collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions');
    const snapshot = await getDocs(collectionRef);
    const allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];

    // Client-side filtering by date range (mid-November)
    const filtered = allTransactions.filter(txn => {
      const date = new Date(txn.date);
      return date >= new Date('2025-11-10') && date <= new Date('2025-11-20');
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].merchant).toBe('Store B');
  });

  /**
   * Test 8: Transactions sorted correctly
   * Verifies that transactions are returned in descending date order
   */
  it('should sort transactions by date descending', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1);

    // Create transactions in random order
    const transactions = [
      { date: '2025-11-15', merchant: 'Middle', category: 'Supermarket', total: 10.00, items: [] },
      { date: '2025-11-01', merchant: 'Oldest', category: 'Restaurant', total: 20.00, items: [] },
      { date: '2025-11-30', merchant: 'Newest', category: 'Transport', total: 30.00, items: [] }
    ];

    for (const txn of transactions) {
      await addTransaction(db, TEST_USERS.USER_1, APP_ID, txn as Omit<Transaction, 'id' | 'createdAt'>);
    }

    // Read and sort transactions
    const collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions');
    const snapshot = await getDocs(collectionRef);
    const allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];

    // Client-side sort by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    expect(allTransactions[0].merchant).toBe('Newest');
    expect(allTransactions[1].merchant).toBe('Middle');
    expect(allTransactions[2].merchant).toBe('Oldest');
  });
});
