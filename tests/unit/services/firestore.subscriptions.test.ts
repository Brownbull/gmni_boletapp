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

// Mock Firestore Timestamp - imported from shared helpers
import { createMockTimestamp } from '../../helpers';

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


    describe('normalization', () => {
        it('applies defaults to transactions', () => {
            let snapshotCallback: (snapshot: any) => void = () => {};
            mockOnSnapshot.mockImplementation((_, callback) => {
                snapshotCallback = callback as any;
                return vi.fn();
            });

            const callback = vi.fn();
            subscribeToTransactions(mockDb, userId, appId, callback);

            // Transaction without computed fields
            snapshotCallback({
                docs: [
                    createMockDoc('1', {
                        merchant: 'Test Store',
                        date: '2026-01-01',
                        total: 1000,
                        category: 'Supermercado',
                        items: [],
                        // Missing: periods
                    }),
                ],
                size: 1,
            });

            const transactions = callback.mock.calls[0][0] as Transaction[];
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
