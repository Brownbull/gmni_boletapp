/**
 * useDerivedItems Hook Tests
 *
 * Story 14.31: Items History View
 * Tests for React Query-based items caching and derivation.
 *
 * Note: These tests verify the hook's behavior by mocking useQueryClient.
 * The core flattening and filtering logic is tested in useItems.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Transaction } from '../../../src/types/transaction';

// Mock useQueryClient to return a mock query client
const mockGetQueryData = vi.fn();
const mockSetQueryData = vi.fn();

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        getQueryData: mockGetQueryData,
        setQueryData: mockSetQueryData,
    }),
}));

// Import after mocking
import { useDerivedItems } from '../../../src/hooks/useDerivedItems';

// ============================================================================
// Test Data
// ============================================================================

const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => ({
    id: `tx-${Math.random().toString(36).substr(2, 9)}`,
    merchant: 'Test Store',
    date: '2026-01-08',
    total: 10000,
    category: 'Supermarket',
    items: [
        { name: 'Milk', price: 3000, category: 'Dairy & Eggs' },
        { name: 'Bread', price: 2000, category: 'Bakery' },
    ],
    ...overrides,
});

const mockTransactions: Transaction[] = [
    createMockTransaction({
        id: 'tx-1',
        merchant: 'Jumbo',
        alias: 'Jumbo Mall',
        date: '2026-01-08',
        total: 15000,
        category: 'Supermarket',
        city: 'Santiago',
        items: [
            { name: 'Milk', price: 3000, category: 'Dairy & Eggs' },
            { name: 'Bread', price: 2000, category: 'Bakery' },
            { name: 'Apples', price: 5000, category: 'Produce' },
        ],
    }),
    createMockTransaction({
        id: 'tx-2',
        merchant: 'Lider',
        date: '2026-01-07',
        total: 8000,
        category: 'Supermarket',
        items: [
            { name: 'Chicken', price: 6000, category: 'Meat & Seafood' },
            { name: 'Rice', price: 2000, category: 'Pantry' },
        ],
    }),
];

// ============================================================================
// Tests
// ============================================================================

describe('useDerivedItems', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: no cached data
        mockGetQueryData.mockReturnValue(undefined);
    });

    describe('Basic Functionality', () => {
        it('returns flattened items from transactions', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            expect(result.current.items).toHaveLength(5);
            expect(result.current.totalCount).toBe(5);
        });

        it('returns empty array for empty transactions', () => {
            const { result } = renderHook(() => useDerivedItems([]));

            expect(result.current.items).toHaveLength(0);
            expect(result.current.totalCount).toBe(0);
        });

        it('passes through loading state', () => {
            const { result: loadingResult } = renderHook(
                () => useDerivedItems(mockTransactions, true)
            );
            expect(loadingResult.current.isLoading).toBe(true);

            const { result: notLoadingResult } = renderHook(
                () => useDerivedItems(mockTransactions, false)
            );
            expect(notLoadingResult.current.isLoading).toBe(false);
        });

        it('sorts items by date (newest first)', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            // Items from tx-1 (2026-01-08) should come before tx-2 (2026-01-07)
            const dates = result.current.items.map(item => item.transactionDate);
            const uniqueDates = [...new Set(dates)];

            expect(uniqueDates[0]).toBe('2026-01-08');
            expect(uniqueDates[1]).toBe('2026-01-07');
        });
    });

    describe('Filtering', () => {
        it('filters by category when setFilters is called', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            act(() => {
                result.current.setFilters({ category: 'Dairy & Eggs' });
            });

            expect(result.current.filteredCount).toBe(1);
            expect(result.current.filteredItems[0].name).toBe('Milk');
        });

        it('filters by search term when setSearchTerm is called', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            act(() => {
                result.current.setSearchTerm('chicken');
            });

            expect(result.current.filteredCount).toBe(1);
            expect(result.current.filteredItems[0].name).toBe('Chicken');
        });

        it('clears all filters when clearFilters is called', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            // Apply filters
            act(() => {
                result.current.setFilters({ category: 'Dairy & Eggs' });
                result.current.setSearchTerm('milk');
            });

            expect(result.current.filteredCount).toBeLessThan(5);

            // Clear filters
            act(() => {
                result.current.clearFilters();
            });

            expect(result.current.filteredCount).toBe(5);
            expect(result.current.searchTerm).toBe('');
        });

        it('applies multiple filters together', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            act(() => {
                result.current.setFilters({ category: 'Dairy & Eggs' });
                result.current.setSearchTerm('milk');
            });

            expect(result.current.filteredCount).toBe(1);
            expect(result.current.filteredItems[0].name).toBe('Milk');
        });
    });

    describe('React Query Caching', () => {
        it('attempts to get cached data on first render', () => {
            renderHook(() => useDerivedItems(mockTransactions));

            expect(mockGetQueryData).toHaveBeenCalled();
        });

        it('stores computed items in cache', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            // Access items to trigger computation
            expect(result.current.items).toHaveLength(5);

            // Should have called setQueryData with the computed items
            expect(mockSetQueryData).toHaveBeenCalled();
            const [, cachedItems] = mockSetQueryData.mock.calls[0];
            expect(cachedItems).toHaveLength(5);
        });

        it('uses cached items when available', () => {
            const cachedItems = [
                { id: 'cached-1', name: 'Cached Item', price: 1000, transactionDate: '2026-01-08' },
            ];
            mockGetQueryData.mockReturnValue(cachedItems);

            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            // Should return cached items instead of computing new ones
            expect(result.current.items).toBe(cachedItems);
            // Should not call setQueryData since we used cached data
            expect(mockSetQueryData).not.toHaveBeenCalled();
        });

        it('recomputes when transactions change', () => {
            const { result, rerender } = renderHook(
                ({ transactions }) => useDerivedItems(transactions),
                { initialProps: { transactions: mockTransactions } }
            );

            expect(result.current.totalCount).toBe(5);

            // Reset mocks before rerender
            vi.clearAllMocks();
            mockGetQueryData.mockReturnValue(undefined);

            // Add a new transaction
            const newTransactions = [
                ...mockTransactions,
                createMockTransaction({
                    id: 'tx-3',
                    items: [{ name: 'New Item', price: 1000, category: 'Other' }],
                }),
            ];

            rerender({ transactions: newTransactions });

            expect(result.current.totalCount).toBe(6);
        });
    });

    describe('Item Properties', () => {
        it('includes parent transaction context in flattened items', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            const milkItem = result.current.items.find(item => item.name === 'Milk');

            expect(milkItem).toBeDefined();
            expect(milkItem!.merchantName).toBe('Jumbo');
            expect(milkItem!.merchantAlias).toBe('Jumbo Mall');
            expect(milkItem!.transactionDate).toBe('2026-01-08');
            expect(milkItem!.city).toBe('Santiago');
        });

        it('generates unique IDs for each flattened item', () => {
            const { result } = renderHook(() => useDerivedItems(mockTransactions));

            const ids = result.current.items.map(item => item.id);
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).toBe(ids.length);
        });
    });
});
