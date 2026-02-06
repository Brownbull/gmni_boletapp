/**
 * Firestore Subscription Tests
 *
 * Story 14d-v2-1-2c: Transaction Queries & Test Updates
 *
 * Tests for subscribeToTransactions and subscribeToRecentScans
 * with focus on soft-delete filtering behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firestore before importing the module
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
}));

import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
} from 'firebase/firestore';
import {
    subscribeToTransactions,
    subscribeToRecentScans,
    LISTENER_LIMITS,
} from '../../../src/services/firestore';
import type { Transaction } from '../../../src/types/transaction';

const mockCollection = vi.mocked(collection);
const mockQuery = vi.mocked(query);
const mockOrderBy = vi.mocked(orderBy);
const mockLimit = vi.mocked(limit);
const mockOnSnapshot = vi.mocked(onSnapshot);

// Helper to create mock document snapshots
function createMockDoc(id: string, data: Record<string, unknown>) {
    return {
        id,
        data: () => data,
        ref: { id },
    };
}

// Helper to create mock Firestore Timestamp
function createMockTimestamp(date: Date = new Date()) {
    return {
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
        toDate: () => date,
    };
}

describe('subscribeToTransactions', () => {
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
        mockOnSnapshot.mockReturnValue(vi.fn()); // Returns unsubscribe function
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('query configuration', () => {
        it('uses correct Firestore collection path', () => {
            const callback = vi.fn();
            subscribeToTransactions(mockDb, userId, appId, callback);

            expect(mockCollection).toHaveBeenCalledWith(
                mockDb,
                'artifacts',
                appId,
                'users',
                userId,
                'transactions'
            );
        });

        it('orders by date descending', () => {
            const callback = vi.fn();
            subscribeToTransactions(mockDb, userId, appId, callback);

            expect(mockOrderBy).toHaveBeenCalledWith('date', 'desc');
        });

        it('limits results to LISTENER_LIMITS.TRANSACTIONS', () => {
            const callback = vi.fn();
            subscribeToTransactions(mockDb, userId, appId, callback);

            expect(mockLimit).toHaveBeenCalledWith(LISTENER_LIMITS.TRANSACTIONS);
        });

        it('returns unsubscribe function', () => {
            const mockUnsubscribe = vi.fn();
            mockOnSnapshot.mockReturnValue(mockUnsubscribe);

            const callback = vi.fn();
            const unsubscribe = subscribeToTransactions(mockDb, userId, appId, callback);

            expect(unsubscribe).toBe(mockUnsubscribe);
        });
    });

    // Story 14d-v2-1-2c: Soft-delete filtering tests
    describe('soft-delete filtering', () => {
        it('excludes soft-deleted transactions from callback', () => {
            let snapshotCallback: (snapshot: any) => void = () => {};
            mockOnSnapshot.mockImplementation((_, callback) => {
                snapshotCallback = callback as any;
                return vi.fn();
            });

            const callback = vi.fn();
            subscribeToTransactions(mockDb, userId, appId, callback);

            // Simulate snapshot with mix of active and deleted transactions
            const mockDeletedTimestamp = createMockTimestamp();
            snapshotCallback({
                docs: [
                    createMockDoc('1', {
                        merchant: 'Active Store',
                        date: '2026-01-01',
                        total: 1000,
                        category: 'Supermercado',
                        items: [],
                        deletedAt: null,
                    }),
                    createMockDoc('2', {
                        merchant: 'Deleted Store',
                        date: '2026-01-02',
                        total: 2000,
                        category: 'Restaurante',
                        items: [],
                        deletedAt: mockDeletedTimestamp,
                    }),
                ],
                size: 2,
            });

            expect(callback).toHaveBeenCalledTimes(1);
            const transactions = callback.mock.calls[0][0] as Transaction[];
            expect(transactions).toHaveLength(1);
            expect(transactions[0].merchant).toBe('Active Store');
        });

        it('includes legacy transactions without deletedAt field', () => {
            let snapshotCallback: (snapshot: any) => void = () => {};
            mockOnSnapshot.mockImplementation((_, callback) => {
                snapshotCallback = callback as any;
                return vi.fn();
            });

            const callback = vi.fn();
            subscribeToTransactions(mockDb, userId, appId, callback);

            // Legacy transaction (no deletedAt field)
            snapshotCallback({
                docs: [
                    createMockDoc('1', {
                        merchant: 'Legacy Store',
                        date: '2025-06-15',
                        total: 500,
                        category: 'Tienda',
                        items: [],
                        // No deletedAt field
                    }),
                ],
                size: 1,
            });

            expect(callback).toHaveBeenCalledTimes(1);
            const transactions = callback.mock.calls[0][0] as Transaction[];
            expect(transactions).toHaveLength(1);
            expect(transactions[0].merchant).toBe('Legacy Store');
            // Should be normalized to null
            expect(transactions[0].deletedAt).toBe(null);
        });

        it('returns empty array when all transactions are soft-deleted', () => {
            let snapshotCallback: (snapshot: any) => void = () => {};
            mockOnSnapshot.mockImplementation((_, callback) => {
                snapshotCallback = callback as any;
                return vi.fn();
            });

            const callback = vi.fn();
            subscribeToTransactions(mockDb, userId, appId, callback);

            const mockDeletedTimestamp = createMockTimestamp();
            snapshotCallback({
                docs: [
                    createMockDoc('1', {
                        merchant: 'Deleted 1',
                        date: '2026-01-01',
                        total: 1000,
                        category: 'Tienda',
                        items: [],
                        deletedAt: mockDeletedTimestamp,
                    }),
                    createMockDoc('2', {
                        merchant: 'Deleted 2',
                        date: '2026-01-02',
                        total: 2000,
                        category: 'Tienda',
                        items: [],
                        deletedAt: mockDeletedTimestamp,
                    }),
                ],
                size: 2,
            });

            const transactions = callback.mock.calls[0][0] as Transaction[];
            expect(transactions).toHaveLength(0);
        });
    });

    describe('normalization', () => {
        it('applies Epic 14d-v2 defaults to transactions', () => {
            let snapshotCallback: (snapshot: any) => void = () => {};
            mockOnSnapshot.mockImplementation((_, callback) => {
                snapshotCallback = callback as any;
                return vi.fn();
            });

            const callback = vi.fn();
            subscribeToTransactions(mockDb, userId, appId, callback);

            // Transaction without Epic 14d-v2 fields
            snapshotCallback({
                docs: [
                    createMockDoc('1', {
                        merchant: 'Test Store',
                        date: '2026-01-01',
                        total: 1000,
                        category: 'Supermercado',
                        items: [],
                        // Missing: sharedGroupId, deletedAt, deletedBy, version, periods
                    }),
                ],
                size: 1,
            });

            const transactions = callback.mock.calls[0][0] as Transaction[];
            expect(transactions[0].sharedGroupId).toBe(null);
            expect(transactions[0].deletedAt).toBe(null);
            expect(transactions[0].deletedBy).toBe(null);
            expect(transactions[0].version).toBe(1);
            expect(transactions[0].periods).toBeDefined();
        });
    });
});

describe('subscribeToRecentScans', () => {
    const mockDb = {} as any;
    const userId = 'test-user-123';
    const appId = 'test-app';

    beforeEach(() => {
        vi.clearAllMocks();

        mockCollection.mockReturnValue({} as any);
        mockQuery.mockReturnValue({} as any);
        mockOrderBy.mockReturnValue({} as any);
        mockLimit.mockReturnValue({} as any);
        mockOnSnapshot.mockReturnValue(vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('query configuration', () => {
        it('orders by createdAt descending', () => {
            const callback = vi.fn();
            subscribeToRecentScans(mockDb, userId, appId, callback);

            expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
        });

        it('limits results to LISTENER_LIMITS.RECENT_SCANS', () => {
            const callback = vi.fn();
            subscribeToRecentScans(mockDb, userId, appId, callback);

            expect(mockLimit).toHaveBeenCalledWith(LISTENER_LIMITS.RECENT_SCANS);
        });
    });

    // Story 14d-v2-1-2c: Soft-delete filtering tests
    describe('soft-delete filtering', () => {
        it('excludes soft-deleted transactions from recent scans', () => {
            let snapshotCallback: (snapshot: any) => void = () => {};
            mockOnSnapshot.mockImplementation((_, callback) => {
                snapshotCallback = callback as any;
                return vi.fn();
            });

            const callback = vi.fn();
            subscribeToRecentScans(mockDb, userId, appId, callback);

            const mockDeletedTimestamp = createMockTimestamp();
            const mockCreatedTimestamp = createMockTimestamp(new Date('2026-01-15'));

            snapshotCallback({
                docs: [
                    createMockDoc('1', {
                        merchant: 'Active Scan',
                        date: '2026-01-14',
                        total: 1000,
                        category: 'Supermercado',
                        items: [],
                        createdAt: mockCreatedTimestamp,
                        deletedAt: null,
                    }),
                    createMockDoc('2', {
                        merchant: 'Deleted Scan',
                        date: '2026-01-13',
                        total: 2000,
                        category: 'Restaurante',
                        items: [],
                        createdAt: createMockTimestamp(new Date('2026-01-14')),
                        deletedAt: mockDeletedTimestamp,
                    }),
                ],
                size: 2,
            });

            const transactions = callback.mock.calls[0][0] as Transaction[];
            expect(transactions).toHaveLength(1);
            expect(transactions[0].merchant).toBe('Active Scan');
        });

        it('includes legacy transactions in recent scans', () => {
            let snapshotCallback: (snapshot: any) => void = () => {};
            mockOnSnapshot.mockImplementation((_, callback) => {
                snapshotCallback = callback as any;
                return vi.fn();
            });

            const callback = vi.fn();
            subscribeToRecentScans(mockDb, userId, appId, callback);

            snapshotCallback({
                docs: [
                    createMockDoc('1', {
                        merchant: 'Legacy Scan',
                        date: '2025-12-01',
                        total: 800,
                        category: 'Tienda',
                        items: [],
                        createdAt: createMockTimestamp(new Date('2025-12-01')),
                        // No deletedAt field
                    }),
                ],
                size: 1,
            });

            const transactions = callback.mock.calls[0][0] as Transaction[];
            expect(transactions).toHaveLength(1);
            expect(transactions[0].merchant).toBe('Legacy Scan');
        });
    });

    describe('error handling', () => {
        it('returns empty array on error', () => {
            let errorCallback: (error: any) => void = () => {};
            mockOnSnapshot.mockImplementation((_, __, onError) => {
                errorCallback = onError as any;
                return vi.fn();
            });

            const callback = vi.fn();
            subscribeToRecentScans(mockDb, userId, appId, callback);

            // Simulate Firestore error
            errorCallback(new Error('Missing index'));

            expect(callback).toHaveBeenCalledWith([]);
        });
    });
});
