/**
 * getTransactionPage Service Tests
 *
 * Story 14.27: Transaction Pagination & Lazy Loading
 *
 * Tests the Firestore cursor-based pagination function for loading
 * older transactions beyond the real-time listener limit.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firestore before importing the module
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    getDocs: vi.fn(),
}));

import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
} from 'firebase/firestore';
import {
    getTransactionPage,
    PAGINATION_PAGE_SIZE,
    LISTENER_LIMITS,
    type TransactionPage,
} from '../../../src/services/firestore';

const mockCollection = vi.mocked(collection);
const mockQuery = vi.mocked(query);
const mockOrderBy = vi.mocked(orderBy);
const mockLimit = vi.mocked(limit);
const mockStartAfter = vi.mocked(startAfter);
const mockGetDocs = vi.mocked(getDocs);

// Helper to create mock document snapshots
function createMockDoc(id: string, data: Record<string, unknown>) {
    return {
        id,
        data: () => data,
        ref: { id },
    };
}

describe('getTransactionPage', () => {
    const mockDb = {} as any;
    const userId = 'test-user-123';
    const appId = 'test-app';

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        mockCollection.mockReturnValue({} as any);
        mockQuery.mockReturnValue({} as any);
        mockOrderBy.mockReturnValue({} as any);
        mockLimit.mockReturnValue({} as any);
        mockStartAfter.mockReturnValue({} as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constants', () => {
        it('exports PAGINATION_PAGE_SIZE constant', () => {
            expect(PAGINATION_PAGE_SIZE).toBe(50);
        });

        it('exports LISTENER_LIMITS constant', () => {
            expect(LISTENER_LIMITS).toBeDefined();
            expect(LISTENER_LIMITS.TRANSACTIONS).toBe(100);
        });
    });

    describe('first page (no cursor)', () => {
        it('fetches first page without cursor', async () => {
            const mockDocs = [
                createMockDoc('1', { merchant: 'Store A', date: '2026-01-01', total: 1000 }),
                createMockDoc('2', { merchant: 'Store B', date: '2026-01-02', total: 2000 }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 2,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            // Should not use startAfter for first page
            expect(mockStartAfter).not.toHaveBeenCalled();

            // Should return transactions
            expect(result.transactions).toHaveLength(2);
            expect(result.transactions[0].id).toBe('1');
            expect(result.transactions[0].merchant).toBe('Store A');
        });

        it('requests pageSize + 1 to check hasMore', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getTransactionPage(mockDb, userId, appId);

            // Should request pageSize + 1 (51 by default) to check if more exist
            expect(mockLimit).toHaveBeenCalledWith(PAGINATION_PAGE_SIZE + 1);
        });

        it('orders by date descending', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getTransactionPage(mockDb, userId, appId);

            expect(mockOrderBy).toHaveBeenCalledWith('date', 'desc');
        });
    });

    describe('subsequent pages (with cursor)', () => {
        it('uses startAfter with cursor for subsequent pages', async () => {
            const mockCursor = { id: 'cursor-doc' } as any;

            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getTransactionPage(mockDb, userId, appId, mockCursor);

            expect(mockStartAfter).toHaveBeenCalledWith(mockCursor);
        });
    });

    describe('hasMore detection', () => {
        it('sets hasMore=true when more documents than pageSize returned', async () => {
            // Return 51 docs (more than page size of 50)
            const mockDocs = Array.from({ length: 51 }, (_, i) =>
                createMockDoc(String(i + 1), { merchant: `Store ${i}`, date: '2026-01-01', total: 1000 })
            );

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 51,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            expect(result.hasMore).toBe(true);
            // Should return only pageSize items (exclude the extra one)
            expect(result.transactions).toHaveLength(50);
        });

        it('sets hasMore=false when fewer documents than pageSize + 1', async () => {
            const mockDocs = Array.from({ length: 30 }, (_, i) =>
                createMockDoc(String(i + 1), { merchant: `Store ${i}`, date: '2026-01-01', total: 1000 })
            );

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 30,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            expect(result.hasMore).toBe(false);
            expect(result.transactions).toHaveLength(30);
        });

        it('sets hasMore=false when exactly pageSize documents', async () => {
            const mockDocs = Array.from({ length: 50 }, (_, i) =>
                createMockDoc(String(i + 1), { merchant: `Store ${i}`, date: '2026-01-01', total: 1000 })
            );

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 50,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            expect(result.hasMore).toBe(false);
            expect(result.transactions).toHaveLength(50);
        });
    });

    describe('lastDoc cursor', () => {
        it('returns lastDoc for next page cursor', async () => {
            const mockDocs = [
                createMockDoc('1', { merchant: 'Store A', date: '2026-01-01', total: 1000 }),
                createMockDoc('2', { merchant: 'Store B', date: '2026-01-02', total: 2000 }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 2,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            expect(result.lastDoc).toBeDefined();
            expect(result.lastDoc?.id).toBe('2');
        });

        it('returns null lastDoc when no documents', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            expect(result.lastDoc).toBeNull();
            expect(result.hasMore).toBe(false);
        });
    });

    describe('collection path', () => {
        it('uses correct Firestore path', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getTransactionPage(mockDb, userId, appId);

            expect(mockCollection).toHaveBeenCalledWith(
                mockDb,
                'artifacts',
                appId,
                'users',
                userId,
                'transactions'
            );
        });
    });

    describe('custom page size', () => {
        it('accepts custom page size parameter', async () => {
            const customPageSize = 25;

            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getTransactionPage(mockDb, userId, appId, undefined, customPageSize);

            expect(mockLimit).toHaveBeenCalledWith(customPageSize + 1);
        });
    });

    describe('TransactionPage return type', () => {
        it('returns correct TransactionPage structure', async () => {
            const mockDocs = [
                createMockDoc('1', { merchant: 'Store A', date: '2026-01-01', total: 1000 }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 1,
            } as any);

            const result: TransactionPage = await getTransactionPage(mockDb, userId, appId);

            expect(result).toHaveProperty('transactions');
            expect(result).toHaveProperty('lastDoc');
            expect(result).toHaveProperty('hasMore');
            expect(Array.isArray(result.transactions)).toBe(true);
        });
    });

    // Story 14d-v2-1-2c: Soft-delete filtering tests
    describe('soft-delete filtering', () => {
        it('excludes soft-deleted transactions (deletedAt is set)', async () => {
            const mockTimestamp = { seconds: 1706745600, nanoseconds: 0 };
            const mockDocs = [
                createMockDoc('1', {
                    merchant: 'Active Store',
                    date: '2026-01-01',
                    total: 1000,
                    deletedAt: null, // Not deleted
                }),
                createMockDoc('2', {
                    merchant: 'Deleted Store',
                    date: '2026-01-02',
                    total: 2000,
                    deletedAt: mockTimestamp, // Soft-deleted
                }),
                createMockDoc('3', {
                    merchant: 'Another Active',
                    date: '2026-01-03',
                    total: 3000,
                    deletedAt: null, // Not deleted
                }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 3,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            // Should only return active transactions (deletedAt: null)
            expect(result.transactions).toHaveLength(2);
            expect(result.transactions.map(tx => tx.merchant)).toEqual([
                'Active Store',
                'Another Active',
            ]);
            expect(result.transactions.every(tx => tx.deletedAt === null)).toBe(true);
        });

        it('includes legacy transactions without deletedAt field (normalized to null)', async () => {
            const mockDocs = [
                createMockDoc('1', {
                    merchant: 'Legacy Store',
                    date: '2025-06-15',
                    total: 500,
                    // No deletedAt field (legacy transaction)
                }),
                createMockDoc('2', {
                    merchant: 'New Store',
                    date: '2026-01-20',
                    total: 1500,
                    deletedAt: null,
                }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 2,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            // Both should be included (legacy gets deletedAt: null after normalization)
            expect(result.transactions).toHaveLength(2);
            expect(result.transactions[0].deletedAt).toBe(null);
            expect(result.transactions[1].deletedAt).toBe(null);
        });

        it('returns empty array when all transactions are soft-deleted', async () => {
            const mockTimestamp = { seconds: 1706745600, nanoseconds: 0 };
            const mockDocs = [
                createMockDoc('1', {
                    merchant: 'Deleted 1',
                    date: '2026-01-01',
                    total: 1000,
                    deletedAt: mockTimestamp,
                }),
                createMockDoc('2', {
                    merchant: 'Deleted 2',
                    date: '2026-01-02',
                    total: 2000,
                    deletedAt: mockTimestamp,
                }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 2,
            } as any);

            const result = await getTransactionPage(mockDb, userId, appId);

            expect(result.transactions).toHaveLength(0);
        });
    });
});
