/**
 * Unit tests for useTransactions hook
 *
 * Story TD-15b-26: DAL-layer test coverage for subscription hooks.
 * Tests subscription lifecycle, sanitization, sorting, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Transaction } from '../../../src/types/transaction';

// Capture the subscribeFn passed to useFirestoreSubscription
let capturedSubscribeFn: ((callback: (data: Transaction[]) => void) => (() => void)) | null = null;
let capturedOptions: { enabled?: boolean } | undefined;

vi.mock('../../../src/hooks/useFirestoreSubscription', () => ({
    useFirestoreSubscription: vi.fn((
        _queryKey: unknown[],
        subscribeFn: (callback: (data: Transaction[]) => void) => (() => void),
        options?: { enabled?: boolean }
    ) => {
        capturedSubscribeFn = subscribeFn;
        capturedOptions = options;
        return { data: undefined, isLoading: false, error: null };
    }),
}));

const mockUnsubscribe = vi.fn();
const mockSubscribe = vi.fn(() => mockUnsubscribe);
const mockRepo = {
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    subscribe: mockSubscribe,
    subscribeRecentScans: vi.fn(),
    wipeAll: vi.fn(),
    getPage: vi.fn(),
    deleteBatch: vi.fn(),
    updateBatch: vi.fn(),
};
vi.mock('@/repositories/transactionRepository', () => ({
    createTransactionRepository: vi.fn(() => mockRepo),
}));

vi.mock('@/repositories/utils', () => ({
    sanitizeTransactions: vi.fn((docs: Transaction[]) => docs),
}));

vi.mock('../../../src/lib/queryKeys', () => ({
    QUERY_KEYS: {
        transactions: (uid: string, appId: string) => ['transactions', uid, appId],
        recentScans: (uid: string, appId: string) => ['transactions', 'recentScans', uid, appId],
    },
}));

import { useTransactions } from '../../../src/hooks/useTransactions';
import { sanitizeTransactions } from '@/repositories/utils';

describe('useTransactions', () => {
    const mockUser = { uid: 'test-user-123' } as User;
    const mockDb = {} as Firestore;
    const mockServices = { db: mockDb, appId: 'test-app-id' };

    beforeEach(() => {
        vi.clearAllMocks();
        capturedSubscribeFn = null;
        capturedOptions = undefined;
    });

    it('returns empty array when user is null', () => {
        const { result } = renderHook(() => useTransactions(null, mockServices));

        expect(result.current).toEqual([]);
        expect(capturedOptions?.enabled).toBe(false);
    });

    it('returns empty array when services is null', () => {
        const { result } = renderHook(() => useTransactions(mockUser, null));

        expect(result.current).toEqual([]);
        expect(capturedOptions?.enabled).toBe(false);
    });

    it('enables subscription when user and services are provided', () => {
        renderHook(() => useTransactions(mockUser, mockServices));

        expect(capturedOptions?.enabled).toBe(true);
    });

    it('subscribeFn creates repo and calls repo.subscribe', () => {
        renderHook(() => useTransactions(mockUser, mockServices));

        expect(capturedSubscribeFn).not.toBeNull();

        const callback = vi.fn();
        capturedSubscribeFn!(callback);

        expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('subscribeFn returns unsubscribe function', () => {
        renderHook(() => useTransactions(mockUser, mockServices));

        const callback = vi.fn();
        const unsub = capturedSubscribeFn!(callback);

        expect(typeof unsub).toBe('function');
        unsub();
        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('subscribeFn sanitizes and sorts data before callback', () => {
        renderHook(() => useTransactions(mockUser, mockServices));

        const outerCallback = vi.fn();
        capturedSubscribeFn!(outerCallback);

        // Get the inner callback passed to repo.subscribe
        const innerCallback = mockSubscribe.mock.calls[0][0];
        const testDocs: Transaction[] = [
            { id: 'tx-1', merchant: 'A', date: '2026-01-01', total: 100, category: 'Food', items: [], country: 'Chile', city: 'Santiago', currency: 'CLP' },
            { id: 'tx-2', merchant: 'B', date: '2026-01-15', total: 200, category: 'Food', items: [], country: 'Chile', city: 'Santiago', currency: 'CLP' },
        ];

        innerCallback(testDocs);

        // sanitizeTransactions should have been called
        expect(sanitizeTransactions).toHaveBeenCalledWith(testDocs);

        // Callback should receive sorted data (newest first — strict order check)
        const received = outerCallback.mock.calls[0][0];
        expect(received[0].id).toBe('tx-2');
        expect(received[1].id).toBe('tx-1');
    });

    it('subscribeFn returns no-op when services is null', () => {
        renderHook(() => useTransactions(mockUser, null));

        // subscribeFn is captured even when disabled
        if (capturedSubscribeFn) {
            const callback = vi.fn();
            const unsub = capturedSubscribeFn(callback);

            // Should return a no-op unsubscribe (guard path)
            expect(typeof unsub).toBe('function');
            unsub(); // no-op, doesn't throw
            // repo.subscribe should NOT have been called
            expect(mockSubscribe).not.toHaveBeenCalled();
        }
    });

    it('cancelled guard prevents stale callback execution', () => {
        renderHook(() => useTransactions(mockUser, mockServices));

        const outerCallback = vi.fn();
        const unsub = capturedSubscribeFn!(outerCallback);

        const innerCallback = mockSubscribe.mock.calls[0][0];

        // Unsubscribe (sets cancelled = true)
        unsub();

        // Simulate late-arriving Firestore data
        innerCallback([{ id: 'late-tx', merchant: 'Late', date: '2026-01-01', total: 0, category: 'Food', items: [], country: 'Chile', city: 'Santiago', currency: 'CLP' }]);

        // Callback should NOT have been called (guarded by cancelled flag)
        expect(outerCallback).not.toHaveBeenCalled();
    });
});
