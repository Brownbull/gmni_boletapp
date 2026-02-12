/**
 * Firestore Mutation Transaction Tests
 *
 * Story 15-TD-15: Verify deleteTransaction and updateTransaction use
 * runTransaction for TOCTOU safety.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    addDoc: vi.fn(),
    doc: vi.fn(() => 'mock-doc-ref'),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
    getDocs: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    increment: vi.fn((n: number) => `increment(${n})`),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    runTransaction: vi.fn((_db, fn) => fn(mockTransaction)),
}));

vi.mock('@/lib/firestorePaths', () => ({
    transactionsPath: vi.fn(() => 'test/transactions/path'),
}));

vi.mock('@/utils/timestamp', () => ({
    toMillis: vi.fn((ts: unknown) => ts),
}));

vi.mock('../../../src/utils/date', () => ({
    computePeriods: vi.fn(() => ({ month: '2026-01', year: '2026' })),
}));

vi.mock('../../../src/utils/transactionUtils', () => ({
    ensureTransactionsDefaults: vi.fn((txs: unknown[]) => txs),
}));

vi.mock('@/lib/firestoreBatch', () => ({
    batchDelete: vi.fn(),
    batchWrite: vi.fn(),
}));

import { runTransaction, deleteDoc, updateDoc, type Firestore } from 'firebase/firestore';
import {
    deleteTransaction,
    updateTransaction,
} from '../../../src/services/firestore';

const mockRunTransaction = vi.mocked(runTransaction);
const mockDeleteDoc = vi.mocked(deleteDoc);
const mockUpdateDoc = vi.mocked(updateDoc);

// --- Test helpers ---

function mockExistingDoc(overrides: Record<string, unknown> = {}) {
    mockTransaction.get.mockResolvedValueOnce({
        exists: () => true,
        id: 'tx-123',
        data: () => ({
            merchant: 'Jumbo',
            total: 1000,
            version: 3,
            ...overrides,
        }),
    });
}

function mockMissingDoc() {
    mockTransaction.get.mockResolvedValueOnce({
        exists: () => false,
        id: 'nonexistent',
    });
}

// --- Shared setup ---

const mockDb = {} as Firestore;
const userId = 'test-user';
const appId = 'test-app';

beforeEach(() => {
    vi.resetAllMocks();
    mockRunTransaction.mockImplementation((_db, fn) => fn(mockTransaction));
});

// --- deleteTransaction Tests ---

describe('deleteTransaction - TOCTOU transaction safety', () => {
    it('should use runTransaction instead of standalone deleteDoc', async () => {
        mockExistingDoc();

        await deleteTransaction(mockDb, userId, appId, 'tx-123');

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-doc-ref');
        expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('should call transaction.delete inside the transaction', async () => {
        mockExistingDoc();

        await deleteTransaction(mockDb, userId, appId, 'tx-123');

        expect(mockTransaction.delete).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('should throw if transaction doc does not exist', async () => {
        mockMissingDoc();

        await expect(
            deleteTransaction(mockDb, userId, appId, 'nonexistent')
        ).rejects.toThrow('Transaction not found: nonexistent');
    });

    it('should not call transaction.delete when doc is missing', async () => {
        mockMissingDoc();

        try {
            await deleteTransaction(mockDb, userId, appId, 'nonexistent');
        } catch {
            // expected
        }

        expect(mockTransaction.delete).not.toHaveBeenCalled();
    });
});

// --- updateTransaction Tests ---

describe('updateTransaction - TOCTOU transaction safety', () => {
    it('should use runTransaction instead of standalone updateDoc', async () => {
        mockExistingDoc({ version: 5 });

        await updateTransaction(mockDb, userId, appId, 'tx-123', {
            merchant: 'Updated Merchant',
        });

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-doc-ref');
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should increment version manually from current value', async () => {
        mockExistingDoc({ version: 5 });

        await updateTransaction(mockDb, userId, appId, 'tx-123', {
            merchant: 'Updated Merchant',
        });

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                version: 6,
                updatedAt: 'mock-server-timestamp',
            })
        );
    });

    it('should handle legacy docs without version field (defaults to 0)', async () => {
        mockExistingDoc({ version: undefined });

        await updateTransaction(mockDb, userId, appId, 'tx-123', {
            merchant: 'Updated Merchant',
        });

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                version: 1,
            })
        );
    });

    it('should pass cleaned updates through to transaction.update', async () => {
        mockExistingDoc({ version: 2 });

        await updateTransaction(mockDb, userId, appId, 'tx-123', {
            merchant: 'New Merchant',
            total: 5000,
        });

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                merchant: 'New Merchant',
                total: 5000,
            })
        );
    });

    it('should include computed periods when date is updated', async () => {
        mockExistingDoc({ version: 1 });

        await updateTransaction(mockDb, userId, appId, 'tx-123', {
            date: '2026-01-15',
        });

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                periods: { month: '2026-01', year: '2026' },
            })
        );
    });

    it('should throw if transaction doc does not exist', async () => {
        mockMissingDoc();

        await expect(
            updateTransaction(mockDb, userId, appId, 'nonexistent', {
                merchant: 'X',
            })
        ).rejects.toThrow('Transaction not found: nonexistent');
    });

    it('should not call transaction.update when doc is missing', async () => {
        mockMissingDoc();

        try {
            await updateTransaction(mockDb, userId, appId, 'nonexistent', {
                merchant: 'X',
            });
        } catch {
            // expected
        }

        expect(mockTransaction.update).not.toHaveBeenCalled();
    });
});
