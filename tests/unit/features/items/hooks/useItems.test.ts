/**
 * useItems Hook Tests
 *
 * Story 14.31: Items History View
 * Tests for flattening, filtering, sorting, and grouping items from transactions.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useItems,
    flattenTransactionItems,
    filterItems,
    sortItemsByDate,
    sortItemsByPrice,
    sortItemsByName,
    groupItemsByDate,
    groupItemsByCategory,
    calculateItemsTotal,
    extractAvailableItemFilters,
} from '../../../src/hooks/useItems';
import type { Transaction } from '../../../src/types/transaction';
import type { FlattenedItem, ItemFilters } from '../../../src/types/item';

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
        country: 'Chile',
        currency: 'CLP',
        items: [
            { name: 'Milk', price: 3000, category: 'Dairy & Eggs' },
            { name: 'Bread', price: 2000, category: 'Bakery' },
            { name: 'Apples', price: 5000, category: 'Produce', qty: 5 },
        ],
    }),
    createMockTransaction({
        id: 'tx-2',
        merchant: 'Lider',
        date: '2026-01-07',
        total: 8000,
        category: 'Supermarket',
        city: 'Viña del Mar',
        items: [
            { name: 'Chicken', price: 6000, category: 'Meat & Seafood' },
            { name: 'Rice', price: 2000, category: 'Pantry' },
        ],
    }),
    createMockTransaction({
        id: 'tx-3',
        merchant: 'Santa Isabel',
        date: '2026-01-06',
        total: 4000,
        category: 'Supermarket',
        city: 'Santiago',
        items: [
            { name: 'Milk', price: 3000, category: 'Dairy & Eggs' },
            { name: 'Cookies', price: 1000, category: 'Snacks' },
        ],
    }),
];

// ============================================================================
// Flattening Tests
// ============================================================================

describe('flattenTransactionItems', () => {
    it('flattens items from multiple transactions', () => {
        const items = flattenTransactionItems(mockTransactions);

        expect(items).toHaveLength(7); // 3 + 2 + 2 items
    });

    it('generates unique IDs for each flattened item', () => {
        const items = flattenTransactionItems(mockTransactions);
        const ids = items.map((item) => item.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(items.length);
    });

    it('preserves parent transaction context', () => {
        const items = flattenTransactionItems(mockTransactions);
        const milkItem = items.find((item) => item.name === 'Milk' && item.transactionId === 'tx-1');

        expect(milkItem).toBeDefined();
        expect(milkItem!.merchantName).toBe('Jumbo');
        expect(milkItem!.merchantAlias).toBe('Jumbo Mall');
        expect(milkItem!.transactionDate).toBe('2026-01-08');
        expect(milkItem!.city).toBe('Santiago');
        expect(milkItem!.currency).toBe('CLP');
    });

    it('handles transactions without items', () => {
        const txWithNoItems: Transaction[] = [
            createMockTransaction({ id: 'tx-no-items', items: [] }),
            createMockTransaction({ id: 'tx-undefined-items', items: undefined }),
        ];

        const items = flattenTransactionItems(txWithNoItems);

        expect(items).toHaveLength(0);
    });

    it('handles transactions without ID gracefully', () => {
        const txWithoutId: Transaction[] = [
            { ...createMockTransaction(), id: '' },
            { ...createMockTransaction(), id: undefined as any },
        ];

        const items = flattenTransactionItems(txWithoutId);

        // Should skip transactions without ID
        expect(items).toHaveLength(0);
    });

    it('preserves item quantity', () => {
        const items = flattenTransactionItems(mockTransactions);
        const applesItem = items.find((item) => item.name === 'Apples');

        expect(applesItem).toBeDefined();
        expect(applesItem!.qty).toBe(5);
    });

    it('defaults quantity to 1 if not specified', () => {
        const items = flattenTransactionItems(mockTransactions);
        const milkItem = items.find((item) => item.name === 'Milk');

        expect(milkItem).toBeDefined();
        expect(milkItem!.qty).toBe(1);
    });
});

// ============================================================================
// Filtering Tests
// ============================================================================

describe('filterItems', () => {
    let allItems: FlattenedItem[];

    beforeAll(() => {
        allItems = flattenTransactionItems(mockTransactions);
    });

    describe('category filter', () => {
        it('filters by single category', () => {
            const filters: ItemFilters = { category: 'Dairy & Eggs' };
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(2); // Two milk items
            expect(filtered.every((item) => item.category === 'Dairy & Eggs')).toBe(true);
        });

        it('filters by multiple categories (comma-separated)', () => {
            const filters: ItemFilters = { category: 'Dairy & Eggs,Bakery' };
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(3); // 2 milk + 1 bread
        });

        it('returns all items when no category filter', () => {
            const filters: ItemFilters = {};
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(7);
        });
    });

    describe('date range filter', () => {
        it('filters by date range', () => {
            const filters: ItemFilters = {
                dateRange: { start: '2026-01-07', end: '2026-01-08' },
            };
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(5); // tx-1 (3 items) + tx-2 (2 items)
        });

        it('includes boundary dates', () => {
            const filters: ItemFilters = {
                dateRange: { start: '2026-01-06', end: '2026-01-06' },
            };
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(2); // tx-3 only
        });
    });

    describe('search term filter', () => {
        it('filters by item name (case insensitive)', () => {
            const filtered = filterItems(allItems, {}, 'MILK');

            expect(filtered).toHaveLength(2);
            expect(filtered.every((item) => item.name.toLowerCase().includes('milk'))).toBe(true);
        });

        it('filters by partial name match', () => {
            const filtered = filterItems(allItems, {}, 'chi');

            expect(filtered).toHaveLength(1);
            expect(filtered[0].name).toBe('Chicken');
        });

        it('returns all items when search term is empty', () => {
            const filtered = filterItems(allItems, {}, '');

            expect(filtered).toHaveLength(7);
        });

        it('returns all items when search term is whitespace', () => {
            const filtered = filterItems(allItems, {}, '   ');

            expect(filtered).toHaveLength(7);
        });
    });

    describe('merchant filter', () => {
        it('filters by merchant name', () => {
            const filters: ItemFilters = { merchantName: 'Jumbo' };
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(3);
            expect(filtered.every((item) => item.merchantName === 'Jumbo')).toBe(true);
        });

        it('filters by merchant alias', () => {
            const filters: ItemFilters = { merchantName: 'Mall' };
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(3); // Jumbo Mall
        });
    });

    describe('city filter', () => {
        it('filters by city', () => {
            const filters: ItemFilters = { city: 'Santiago' };
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(5); // tx-1 (3) + tx-3 (2)
        });

        it('city filter is case insensitive', () => {
            const filters: ItemFilters = { city: 'SANTIAGO' };
            const filtered = filterItems(allItems, filters, '');

            expect(filtered).toHaveLength(5);
        });
    });

    describe('combined filters', () => {
        it('applies all filters together', () => {
            const filters: ItemFilters = {
                category: 'Dairy & Eggs',
                city: 'Santiago',
            };
            const filtered = filterItems(allItems, filters, 'milk');

            // Both milk items are in Santiago with Dairy & Eggs category
            expect(filtered).toHaveLength(2);
        });
    });
});

// ============================================================================
// Sorting Tests
// ============================================================================

describe('sorting functions', () => {
    let allItems: FlattenedItem[];

    beforeAll(() => {
        allItems = flattenTransactionItems(mockTransactions);
    });

    describe('sortItemsByDate', () => {
        it('sorts by date descending (newest first)', () => {
            const sorted = sortItemsByDate(allItems, 'desc');

            expect(sorted[0].transactionDate).toBe('2026-01-08');
            expect(sorted[sorted.length - 1].transactionDate).toBe('2026-01-06');
        });

        it('sorts by date ascending (oldest first)', () => {
            const sorted = sortItemsByDate(allItems, 'asc');

            expect(sorted[0].transactionDate).toBe('2026-01-06');
            expect(sorted[sorted.length - 1].transactionDate).toBe('2026-01-08');
        });
    });

    describe('sortItemsByPrice', () => {
        it('sorts by price descending (highest first)', () => {
            const sorted = sortItemsByPrice(allItems, 'desc');

            expect(sorted[0].price).toBeGreaterThanOrEqual(sorted[sorted.length - 1].price);
        });

        it('sorts by price ascending (lowest first)', () => {
            const sorted = sortItemsByPrice(allItems, 'asc');

            expect(sorted[0].price).toBeLessThanOrEqual(sorted[sorted.length - 1].price);
        });
    });

    describe('sortItemsByName', () => {
        it('sorts alphabetically ascending', () => {
            const sorted = sortItemsByName(allItems, 'asc');
            const names = sorted.map((item) => item.name);

            const sortedNames = [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            expect(names).toEqual(sortedNames);
        });

        it('sorts alphabetically descending', () => {
            const sorted = sortItemsByName(allItems, 'desc');
            const names = sorted.map((item) => item.name);

            const sortedNames = [...names].sort((a, b) => b.toLowerCase().localeCompare(a.toLowerCase()));
            expect(names).toEqual(sortedNames);
        });
    });
});

// ============================================================================
// Grouping Tests
// ============================================================================

describe('grouping functions', () => {
    let allItems: FlattenedItem[];

    beforeAll(() => {
        allItems = flattenTransactionItems(mockTransactions);
    });

    describe('groupItemsByDate', () => {
        it('groups items by transaction date', () => {
            const groups = groupItemsByDate(allItems);

            expect(groups.size).toBe(3); // 3 different dates
            expect(groups.get('2026-01-08')).toHaveLength(3);
            expect(groups.get('2026-01-07')).toHaveLength(2);
            expect(groups.get('2026-01-06')).toHaveLength(2);
        });
    });

    describe('groupItemsByCategory', () => {
        it('groups items by category', () => {
            const groups = groupItemsByCategory(allItems);

            expect(groups.get('Dairy & Eggs')).toHaveLength(2);
            expect(groups.get('Bakery')).toHaveLength(1);
            expect(groups.get('Produce')).toHaveLength(1);
        });

        it('normalizes categories', () => {
            const groups = groupItemsByCategory(allItems);

            // Should not have undefined or null categories
            expect(groups.has('undefined')).toBe(false);
            expect(groups.has('null')).toBe(false);
        });
    });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('utility functions', () => {
    let allItems: FlattenedItem[];

    beforeAll(() => {
        allItems = flattenTransactionItems(mockTransactions);
    });

    describe('calculateItemsTotal', () => {
        it('calculates total price of all items', () => {
            const total = calculateItemsTotal(allItems);

            // 3000 + 2000 + 5000 + 6000 + 2000 + 3000 + 1000 = 22000
            expect(total).toBe(22000);
        });

        it('returns 0 for empty array', () => {
            const total = calculateItemsTotal([]);

            expect(total).toBe(0);
        });
    });

    describe('extractAvailableItemFilters', () => {
        it('extracts unique categories', () => {
            const available = extractAvailableItemFilters(allItems);

            expect(available.categories).toContain('Dairy & Eggs');
            expect(available.categories).toContain('Bakery');
            expect(available.categories).toContain('Produce');
            expect(available.categories).toContain('Meat & Seafood');
        });

        it('extracts unique merchants', () => {
            const available = extractAvailableItemFilters(allItems);

            // Should use alias if available
            expect(available.merchants).toContain('Jumbo Mall');
            expect(available.merchants).toContain('Lider');
            expect(available.merchants).toContain('Santa Isabel');
        });

        it('extracts unique cities', () => {
            const available = extractAvailableItemFilters(allItems);

            expect(available.cities).toContain('Santiago');
            expect(available.cities).toContain('Viña del Mar');
        });

        it('extracts date range', () => {
            const available = extractAvailableItemFilters(allItems);

            expect(available.dateRange).toBeDefined();
            expect(available.dateRange!.earliest).toBe('2026-01-06');
            expect(available.dateRange!.latest).toBe('2026-01-08');
        });

        it('returns null date range for empty items', () => {
            const available = extractAvailableItemFilters([]);

            expect(available.dateRange).toBeNull();
        });
    });
});

// ============================================================================
// Hook Tests
// ============================================================================

describe('useItems hook', () => {
    it('flattens and sorts items on initialization', () => {
        const { result } = renderHook(() => useItems(mockTransactions));

        expect(result.current.items).toHaveLength(7);
        expect(result.current.totalCount).toBe(7);
        // Should be sorted by date (newest first)
        expect(result.current.items[0].transactionDate).toBe('2026-01-08');
    });

    it('filters items when setFilters is called', () => {
        const { result } = renderHook(() => useItems(mockTransactions));

        act(() => {
            result.current.setFilters({ category: 'Dairy & Eggs' });
        });

        expect(result.current.filteredCount).toBe(2);
        expect(result.current.filteredItems).toHaveLength(2);
    });

    it('filters items when setSearchTerm is called', () => {
        const { result } = renderHook(() => useItems(mockTransactions));

        act(() => {
            result.current.setSearchTerm('milk');
        });

        expect(result.current.filteredCount).toBe(2);
    });

    it('clears all filters when clearFilters is called', () => {
        const { result } = renderHook(() => useItems(mockTransactions));

        act(() => {
            result.current.setFilters({ category: 'Dairy & Eggs' });
            result.current.setSearchTerm('milk');
        });

        expect(result.current.filteredCount).toBeLessThan(7);

        act(() => {
            result.current.clearFilters();
        });

        expect(result.current.filteredCount).toBe(7);
        expect(result.current.searchTerm).toBe('');
    });

    it('passes through loading state', () => {
        const { result: loadingResult } = renderHook(() => useItems(mockTransactions, true));
        const { result: notLoadingResult } = renderHook(() => useItems(mockTransactions, false));

        expect(loadingResult.current.isLoading).toBe(true);
        expect(notLoadingResult.current.isLoading).toBe(false);
    });

    it('handles empty transactions', () => {
        const { result } = renderHook(() => useItems([]));

        expect(result.current.items).toHaveLength(0);
        expect(result.current.filteredItems).toHaveLength(0);
        expect(result.current.totalCount).toBe(0);
    });
});
