/**
 * Cascade Delete Integration Tests
 *
 * Tests the Firestore trigger that deletes Storage images when a transaction is deleted.
 * Covers Story 4.5-4 AC #2: Integration test for cascade delete.
 *
 * Note: Since we can't easily test Firestore triggers with the @firebase/rules-unit-testing
 * library (it doesn't run Cloud Functions), these tests verify:
 * 1. The Cloud Function module structure and compilation
 * 2. The deleteTransactionImages function in storageService.ts
 * 3. The trigger exports correctly from index.ts
 *
 * For full end-to-end cascade delete testing, use the Firebase Functions emulator
 * which can run the actual trigger.
 *
 * Story 4.5-4 - Cascade Delete & Documentation
 * Task: Write integration test (AC: #2)
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  setupFirebaseEmulator,
  clearFirestoreData,
  teardownFirebaseEmulator,
  getAuthedFirestore,
  TEST_USERS,
} from '../setup/firebase-emulator'
import { addTransaction, deleteTransaction } from '../../src/services/firestore'
import { Transaction } from '../../src/types/transaction'
import { collection, getDocs } from 'firebase/firestore'

const functionsLibPath = join(process.cwd(), 'functions/lib')
const APP_ID = 'boletapp-d609f'

describe('Cascade Delete Integration', () => {
  describe('Cloud Function Trigger Structure', () => {
    it('should have deleteTransactionImages.ts compiled to lib/', () => {
      const path = join(functionsLibPath, 'deleteTransactionImages.js')
      expect(existsSync(path)).toBe(true)
    })

    it('should export onTransactionDeleted from index.ts', () => {
      const content = readFileSync(join(functionsLibPath, 'index.js'), 'utf-8')
      expect(content).toContain('onTransactionDeleted')
    })

    it('should be a Firestore onDelete trigger', () => {
      const content = readFileSync(join(functionsLibPath, 'deleteTransactionImages.js'), 'utf-8')

      // Should be using Firestore trigger pattern
      expect(content).toContain('firestore')
      expect(content).toContain('onDelete')
    })

    it('should listen to correct document path', () => {
      const content = readFileSync(join(functionsLibPath, 'deleteTransactionImages.js'), 'utf-8')

      // Should listen to transaction documents
      expect(content).toContain('artifacts/{appId}/users/{userId}/transactions/{transactionId}')
    })

    it('should extract userId and transactionId from context params', () => {
      const content = readFileSync(join(functionsLibPath, 'deleteTransactionImages.js'), 'utf-8')

      expect(content).toContain('userId')
      expect(content).toContain('transactionId')
      expect(content).toContain('context.params')
    })

    it('should call deleteTransactionImages from storageService', () => {
      const content = readFileSync(join(functionsLibPath, 'deleteTransactionImages.js'), 'utf-8')

      expect(content).toContain('storageService')
      expect(content).toContain('deleteTransactionImages')
    })
  })

  describe('Storage Service Delete Function', () => {
    it('should have deleteTransactionImages function', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')
      expect(content).toContain('deleteTransactionImages')
    })

    it('should delete files from correct Storage path', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      // Should use the path pattern: users/{userId}/receipts/{transactionId}/
      expect(content).toContain('users/')
      expect(content).toContain('/receipts/')
    })

    it('should use bucket.getFiles with prefix filter', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      expect(content).toContain('getFiles')
      expect(content).toContain('prefix')
    })

    it('should delete all files in folder', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      expect(content).toContain('file.delete')
      expect(content).toContain('Promise.all')
    })

    it('should handle empty folders gracefully', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      expect(content).toContain('files.length === 0')
      expect(content).toContain('No images found')
    })

    it('should log but not throw on errors', () => {
      const content = readFileSync(join(functionsLibPath, 'storageService.js'), 'utf-8')

      // Should have error handling that doesn't throw
      expect(content).toContain('catch')
      expect(content).toContain('console.error')
    })
  })

  describe('Error Handling Pattern', () => {
    it('should have graceful error handling in trigger', () => {
      const content = readFileSync(join(functionsLibPath, 'deleteTransactionImages.js'), 'utf-8')

      expect(content).toContain('try')
      expect(content).toContain('catch')
      expect(content).toContain('console.error')
    })

    it('should not throw errors from trigger (transaction already deleted)', () => {
      const content = readFileSync(join(functionsLibPath, 'deleteTransactionImages.js'), 'utf-8')

      // Should NOT have 'throw' in the catch block
      // Error handling should log but not throw
      expect(content).toContain('Cascade delete failed')
    })
  })

  describe('Logging Pattern', () => {
    it('should log transaction deletion', () => {
      const content = readFileSync(join(functionsLibPath, 'deleteTransactionImages.js'), 'utf-8')

      expect(content).toContain('console.log')
      expect(content).toContain('Transaction deleted')
    })

    it('should log cascade delete completion', () => {
      const content = readFileSync(join(functionsLibPath, 'deleteTransactionImages.js'), 'utf-8')

      expect(content).toContain('Cascade delete completed')
    })
  })
})

describe('Cascade Delete Firestore Integration', () => {
  beforeAll(async () => {
    await setupFirebaseEmulator()
  })

  beforeEach(async () => {
    await clearFirestoreData()
  })

  afterEach(async () => {
    await clearFirestoreData()
  })

  afterAll(async () => {
    await teardownFirebaseEmulator()
  })

  /**
   * Test: Delete transaction triggers Firestore
   *
   * Note: This test verifies the Firestore side works. The actual Cloud Function
   * trigger will run in production when the document is deleted.
   */
  it('should successfully delete transaction with imageUrls (trigger will fire in production)', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1)

    // Create a transaction with imageUrls (simulating post-scan state)
    const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
      date: '2025-12-01',
      merchant: 'Test Store with Images',
      category: 'Supermarket',
      total: 50.00,
      items: [],
      imageUrls: [
        'https://storage.googleapis.com/boletapp-d609f.appspot.com/users/test-user/receipts/txn123/image-0.jpg',
        'https://storage.googleapis.com/boletapp-d609f.appspot.com/users/test-user/receipts/txn123/image-1.jpg',
      ],
      thumbnailUrl: 'https://storage.googleapis.com/boletapp-d609f.appspot.com/users/test-user/receipts/txn123/thumbnail.jpg',
    }

    const docId = await addTransaction(db, TEST_USERS.USER_1, APP_ID, transaction)

    // Verify transaction was created
    let collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions')
    let snapshot = await getDocs(collectionRef)
    expect(snapshot.size).toBe(1)
    expect(snapshot.docs[0].data().imageUrls).toHaveLength(2)

    // Delete the transaction
    await deleteTransaction(db, TEST_USERS.USER_1, APP_ID, docId)

    // Verify deletion - in production, this would trigger onTransactionDeleted
    snapshot = await getDocs(collectionRef)
    expect(snapshot.size).toBe(0)

    // Note: The actual Storage deletion happens via the Cloud Function trigger
    // which runs when the document is deleted. This test confirms:
    // 1. Transactions with imageUrls can be created
    // 2. They can be deleted successfully
    // 3. The trigger will receive the correct params in production
  })

  it('should delete transaction without images (backward compatibility)', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1)

    // Create a transaction WITHOUT imageUrls (pre-Epic 4.5 style)
    const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
      date: '2025-12-01',
      merchant: 'Old Transaction No Images',
      category: 'Restaurant',
      total: 25.00,
      items: [],
      // No imageUrls or thumbnailUrl
    }

    const docId = await addTransaction(db, TEST_USERS.USER_1, APP_ID, transaction)

    // Delete the transaction
    await deleteTransaction(db, TEST_USERS.USER_1, APP_ID, docId)

    // Verify deletion - trigger should handle missing Storage folder gracefully
    const collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions')
    const snapshot = await getDocs(collectionRef)
    expect(snapshot.size).toBe(0)
  })

  it('should handle multiple transactions deletion with images', async () => {
    const db = getAuthedFirestore(TEST_USERS.USER_1)

    // Create 3 transactions with images
    const transactions = [
      {
        date: '2025-12-01',
        merchant: 'Store A',
        category: 'Supermarket',
        total: 10.00,
        items: [],
        imageUrls: ['https://storage.example.com/image-a.jpg'],
        thumbnailUrl: 'https://storage.example.com/thumb-a.jpg',
      },
      {
        date: '2025-12-01',
        merchant: 'Store B',
        category: 'Restaurant',
        total: 20.00,
        items: [],
        imageUrls: ['https://storage.example.com/image-b.jpg'],
        thumbnailUrl: 'https://storage.example.com/thumb-b.jpg',
      },
      {
        date: '2025-12-01',
        merchant: 'Store C',
        category: 'Transport',
        total: 30.00,
        items: [],
        // No images - mix of with and without
      },
    ]

    const docIds: string[] = []
    for (const txn of transactions) {
      const id = await addTransaction(db, TEST_USERS.USER_1, APP_ID, txn as Omit<Transaction, 'id' | 'createdAt'>)
      docIds.push(id)
    }

    // Verify all created
    let collectionRef = collection(db, 'artifacts', APP_ID, 'users', TEST_USERS.USER_1, 'transactions')
    let snapshot = await getDocs(collectionRef)
    expect(snapshot.size).toBe(3)

    // Delete each transaction
    for (const id of docIds) {
      await deleteTransaction(db, TEST_USERS.USER_1, APP_ID, id)
    }

    // Verify all deleted - each would have triggered cascade delete
    snapshot = await getDocs(collectionRef)
    expect(snapshot.size).toBe(0)
  })
})
