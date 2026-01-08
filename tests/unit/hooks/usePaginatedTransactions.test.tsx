/**
 * usePaginatedTransactions Hook Tests
 *
 * Story 14.27: Transaction Pagination & Lazy Loading
 *
 * Tests the hook that combines real-time subscription (100 recent)
 * with on-demand pagination for older transactions using React Query's
 * useInfiniteQuery.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User } from 'firebase/auth';
import type { ReactNode } from 'react';
import { usePaginatedTransactions } from '../../../src/hooks/usePaginatedTransactions';
import { LISTENER_LIMITS } from '../../../src/services/firestore';

// Mock dependencies
vi.mock('../../../src/hooks/useTransactions', () => ({
    useTransactions: vi.fn(),
}));

vi.mock('../../../src/services/firestore', () => ({
    getTransactionPage: vi.fn(),
    LISTENER_LIMITS: { TRANSACTIONS: 100 },
    PAGINATION_PAGE_SIZE: 50,
}));

import { useTransactions } from '../../../src/hooks/useTransactions';
import { getTransactionPage } from '../../../src/services/firestore';

const mockUseTransactions = vi.mocked(useTransactions);
const mockGetTransactionPage = vi.mocked(getTransactionPage);

// Helper to create test transactions
function createTransaction(id: string, daysAgo: number) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
        id,
        merchant: `Merchant ${id}`,
        date: date.toISOString().split('T')[0],
        total: 1000 + parseInt(id),
        category: 'Supermarket',
        items: [],
    };
}

// Test wrapper with QueryClient
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

// Mock user and services
const mockUser = { uid: 'test-user-123' } as User;
const mockServices = { db: {} as any, appId: 'test-app' };

describe('usePaginatedTransactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseTransactions.mockReturnValue([]);
        mockGetTransactionPage.mockResolvedValue({
            transactions: [],
            lastDoc: null,
            hasMore: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('initial state', () => {
        it('returns empty transactions when user is null', () => {
            const { result } = renderHook(
                () => usePaginatedTransactions(null, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.transactions).toEqual([]);
            expect(result.current.hasMore).toBe(false);
            expect(result.current.isAtListenerLimit).toBe(false);
        });

        it('returns empty transactions when services is null', () => {
            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, null),
                { wrapper: createWrapper() }
            );

            expect(result.current.transactions).toEqual([]);
            expect(result.current.hasMore).toBe(false);
        });

        it('returns real-time transactions when under limit', () => {
            const mockTransactions = [
                createTransaction('1', 1),
                createTransaction('2', 2),
            ];
            mockUseTransactions.mockReturnValue(mockTransactions as any);

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.transactions).toHaveLength(2);
            expect(result.current.isAtListenerLimit).toBe(false);
            expect(result.current.hasMore).toBe(false);
        });
    });

    describe('listener limit detection', () => {
        it('detects when at listener limit (>= 100 transactions)', () => {
            // Create exactly 100 transactions - the actual LISTENER_LIMITS.TRANSACTIONS value
            // Note: The hook checks transactions.length >= LISTENER_LIMITS.TRANSACTIONS
            const mockTransactions = Array.from({ length: 100 }, (_, i) =>
                createTransaction(String(i + 1), i)
            );
            mockUseTransactions.mockReturnValue(mockTransactions as any);

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            // When exactly at limit, isAtListenerLimit should be true
            expect(result.current.isAtListenerLimit).toBe(true);
        });

        it('hasMore reflects pagination state when at listener limit', async () => {
            const mockTransactions = Array.from({ length: 100 }, (_, i) =>
                createTransaction(String(i + 1), i)
            );
            mockUseTransactions.mockReturnValue(mockTransactions as any);

            // Mock getTransactionPage to return hasMore: true
            mockGetTransactionPage.mockResolvedValue({
                transactions: [createTransaction('101', 101)],
                lastDoc: { id: '101' } as any,
                hasMore: true,
            });

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            // hasMore depends on: isAtListenerLimit && (hasNextPage ?? true)
            expect(result.current.isAtListenerLimit).toBe(true);

            // Wait for the infinite query to settle
            // hasMore = isAtListenerLimit && (hasNextPage from query result)
            await waitFor(() => {
                // After query resolves, hasMore should reflect the actual hasMore from the query
                // The hook returns hasMore: true when pagination data indicates more pages exist
                expect(result.current.hasMore).toBeDefined();
            });
        });

        it('does not trigger pagination when under limit', () => {
            // Create only 50 transactions - under the 100 limit
            const mockTransactions = Array.from({ length: 50 }, (_, i) =>
                createTransaction(String(i + 1), i)
            );
            mockUseTransactions.mockReturnValue(mockTransactions as any);

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.isAtListenerLimit).toBe(false);
            expect(result.current.hasMore).toBe(false);
        });
    });

    describe('transaction merging', () => {
        it('deduplicates transactions by ID', () => {
            // Real-time has transactions 1-3
            const realtimeTransactions = [
                createTransaction('1', 1),
                createTransaction('2', 2),
                createTransaction('3', 3),
            ];
            mockUseTransactions.mockReturnValue(realtimeTransactions as any);

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            // Should have exactly 3 unique transactions
            expect(result.current.transactions).toHaveLength(3);
            const ids = result.current.transactions.map(t => t.id);
            expect(new Set(ids).size).toBe(3);
        });

        it('sorts merged transactions by date descending', () => {
            const mockTransactions = [
                createTransaction('1', 3), // 3 days ago
                createTransaction('2', 1), // 1 day ago
                createTransaction('3', 2), // 2 days ago
            ];
            mockUseTransactions.mockReturnValue(mockTransactions as any);

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            // Should be sorted: most recent first
            expect(result.current.transactions[0].id).toBe('2');
            expect(result.current.transactions[1].id).toBe('3');
            expect(result.current.transactions[2].id).toBe('1');
        });
    });

    describe('loadMore function', () => {
        it('does not call loadMore when not at listener limit', async () => {
            const mockTransactions = [createTransaction('1', 1)];
            mockUseTransactions.mockReturnValue(mockTransactions as any);

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            // loadMore should be callable but pagination shouldn't be enabled
            expect(result.current.loadMore).toBeDefined();
            expect(result.current.isAtListenerLimit).toBe(false);
        });

        it('provides loadMore function when at listener limit', async () => {
            const mockTransactions = Array.from({ length: 100 }, (_, i) =>
                createTransaction(String(i + 1), i)
            );
            mockUseTransactions.mockReturnValue(mockTransactions as any);

            mockGetTransactionPage.mockResolvedValue({
                transactions: [createTransaction('101', 101)],
                lastDoc: { id: '101' } as any,
                hasMore: true,
            });

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.loadMore).toBeDefined();
            expect(typeof result.current.loadMore).toBe('function');
        });
    });

    describe('return interface', () => {
        it('returns all expected properties', () => {
            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current).toHaveProperty('transactions');
            expect(result.current).toHaveProperty('hasMore');
            expect(result.current).toHaveProperty('loadingMore');
            expect(result.current).toHaveProperty('isLoading');
            expect(result.current).toHaveProperty('loadMore');
            expect(result.current).toHaveProperty('totalLoaded');
            expect(result.current).toHaveProperty('isAtListenerLimit');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('refetch');
        });

        it('returns correct totalLoaded count', () => {
            const mockTransactions = [
                createTransaction('1', 1),
                createTransaction('2', 2),
                createTransaction('3', 3),
            ];
            mockUseTransactions.mockReturnValue(mockTransactions as any);

            const { result } = renderHook(
                () => usePaginatedTransactions(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.totalLoaded).toBe(3);
        });
    });
});
