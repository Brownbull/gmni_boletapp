/**
 * Story 15b-2d: Unit tests for itemsViewFilters pure functions
 */

import { describe, it, expect } from 'vitest';
import {
    computeTemporalDateRange,
    applyDrillDownFilters,
    applyLegacyCategoryFilters,
    applyAllItemsFilters,
} from '@features/items/views/ItemsView/itemsViewFilters';
import type { FlattenedItem } from '@/types/item';
import type { TemporalFilterState, CategoryFilterState } from '@/types/historyFilters';

// Test data factory
function makeItem(overrides: Partial<FlattenedItem> = {}): FlattenedItem {
    return {
        id: 'item-1',
        name: 'Milk',
        totalPrice: 1000,
        qty: 1,
        category: 'Dairy',
        subcategory: 'Milk',
        transactionId: 'tx-1',
        transactionDate: '2025-06-15',
        merchantName: 'Lider',
        merchantCategory: 'Supermarket',
        ...overrides,
    };
}

describe('computeTemporalDateRange', () => {
    it('returns undefined for level=all', () => {
        expect(computeTemporalDateRange({ level: 'all' })).toBeUndefined();
    });

    it('handles explicit dateRange', () => {
        const result = computeTemporalDateRange({
            level: 'all',
            dateRange: { start: '2025-01-01', end: '2025-01-07' },
        });
        expect(result).toEqual({ start: '2025-01-01', end: '2025-01-07' });
    });

    it('handles year filter', () => {
        const result = computeTemporalDateRange({ level: 'year', year: '2025' });
        expect(result).toEqual({ start: '2025-01-01', end: '2025-12-31' });
    });

    it('handles quarter filter (Q1)', () => {
        const result = computeTemporalDateRange({ level: 'quarter', year: '2025', quarter: 'Q1' });
        expect(result).toEqual({ start: '2025-01-01', end: '2025-03-31' });
    });

    it('handles quarter filter (Q4)', () => {
        const result = computeTemporalDateRange({ level: 'quarter', year: '2025', quarter: 'Q4' });
        expect(result).toEqual({ start: '2025-10-01', end: '2025-12-31' });
    });

    it('handles month filter', () => {
        const result = computeTemporalDateRange({ level: 'month', month: '2025-02' });
        expect(result).toEqual({ start: '2025-02-01', end: '2025-02-28' });
    });

    it('handles month filter with 31-day month', () => {
        const result = computeTemporalDateRange({ level: 'month', month: '2025-01' });
        expect(result).toEqual({ start: '2025-01-01', end: '2025-01-31' });
    });

    it('handles week filter', () => {
        const result = computeTemporalDateRange({ level: 'week', month: '2025-06', week: 2 });
        expect(result).toEqual({ start: '2025-06-08', end: '2025-06-14' });
    });

    it('handles day filter', () => {
        const result = computeTemporalDateRange({ level: 'day', day: '2025-06-15' });
        expect(result).toEqual({ start: '2025-06-15', end: '2025-06-15' });
    });

    it('returns undefined for year level without year value', () => {
        expect(computeTemporalDateRange({ level: 'year' })).toBeUndefined();
    });
});

describe('applyDrillDownFilters', () => {
    const items: FlattenedItem[] = [
        makeItem({ id: '1', merchantCategory: 'Supermarket', category: 'Dairy', subcategory: 'Milk' }),
        makeItem({ id: '2', merchantCategory: 'Pharmacy', category: 'Health', subcategory: 'Vitamins' }),
        makeItem({ id: '3', merchantCategory: 'Supermarket', category: 'Meat & Seafood', subcategory: 'Beef' }),
    ];

    it('filters by storeCategory', () => {
        const result = applyDrillDownFilters(items, { storeCategory: 'Supermarket' });
        expect(result).toHaveLength(2);
        expect(result.every(i => i.merchantCategory === 'Supermarket')).toBe(true);
    });

    it('filters by storeCategory case-insensitive', () => {
        const result = applyDrillDownFilters(items, { storeCategory: 'supermarket' });
        expect(result).toHaveLength(2);
    });

    it('filters by comma-separated storeCategory', () => {
        const result = applyDrillDownFilters(items, { storeCategory: 'Supermarket, Pharmacy' });
        expect(result).toHaveLength(3);
    });

    it('filters by itemCategory (uses normalized name)', () => {
        // 'Dairy' normalizes to 'DairyEggs' via normalizeItemCategory (V4)
        const result = applyDrillDownFilters(items, { itemCategory: 'DairyEggs' });
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('Dairy');
    });

    it('filters by subcategory', () => {
        const result = applyDrillDownFilters(items, { subcategory: 'Beef' });
        expect(result).toHaveLength(1);
        expect(result[0].subcategory).toBe('Beef');
    });

    it('returns all items when drillDownPath is empty', () => {
        const result = applyDrillDownFilters(items, {});
        expect(result).toHaveLength(3);
    });
});

describe('applyLegacyCategoryFilters', () => {
    const items: FlattenedItem[] = [
        makeItem({ id: '1', category: 'Dairy', merchantCategory: 'Supermarket' }),
        makeItem({ id: '2', category: 'Meat & Seafood', merchantCategory: 'Pharmacy' }),
    ];

    it('filters by group level', () => {
        // 'Dairy' normalizes to 'Dairy & Eggs', 'dairy' partial-matches via includes()
        const state: CategoryFilterState = { level: 'group', group: 'dairy' };
        const result = applyLegacyCategoryFilters(items, state);
        // 'dairy & eggs' includes 'dairy' → matches
        expect(result).toHaveLength(1);
    });

    it('filters by category level (store category)', () => {
        const state: CategoryFilterState = { level: 'category', category: 'Supermarket' };
        const result = applyLegacyCategoryFilters(items, state);
        expect(result).toHaveLength(1);
        expect(result[0].merchantCategory).toBe('Supermarket');
    });

    it('returns all items for level=all', () => {
        const state: CategoryFilterState = { level: 'all' };
        const result = applyLegacyCategoryFilters(items, state);
        expect(result).toHaveLength(2);
    });
});

describe('applyAllItemsFilters', () => {
    const items: FlattenedItem[] = [
        makeItem({ id: '1', transactionDate: '2025-06-15', category: 'Dairy' }),
        makeItem({ id: '2', transactionDate: '2025-07-01', category: 'Meat & Seafood' }),
        makeItem({ id: '3', transactionDate: '2025-06-20', category: 'Dairy' }),
    ];

    it('applies temporal + category filters together', () => {
        const temporal: TemporalFilterState = { level: 'month', month: '2025-06' };
        const category: CategoryFilterState = { level: 'group', group: 'dairy' };
        const result = applyAllItemsFilters(items, temporal, category);
        expect(result).toHaveLength(2);
        expect(result.every(i => i.transactionDate.startsWith('2025-06'))).toBe(true);
    });

    it('returns all items when no filters active', () => {
        const temporal: TemporalFilterState = { level: 'all' };
        const category: CategoryFilterState = { level: 'all' };
        const result = applyAllItemsFilters(items, temporal, category);
        expect(result).toHaveLength(3);
    });

    it('applies only temporal filter when category is all', () => {
        const temporal: TemporalFilterState = { level: 'month', month: '2025-06' };
        const category: CategoryFilterState = { level: 'all' };
        const result = applyAllItemsFilters(items, temporal, category);
        expect(result).toHaveLength(2);
    });

    it('uses drillDownPath when present', () => {
        const temporal: TemporalFilterState = { level: 'all' };
        const category: CategoryFilterState = {
            level: 'all',
            // 'Dairy' normalizes to 'DairyEggs' (V4), so use normalized name
            drillDownPath: { itemCategory: 'DairyEggs' },
        };
        const result = applyAllItemsFilters(items, temporal, category);
        expect(result).toHaveLength(2);
        expect(result.every(i => i.category === 'Dairy')).toBe(true);
    });
});
