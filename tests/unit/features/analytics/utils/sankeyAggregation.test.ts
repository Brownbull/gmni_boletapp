/**
 * Unit Tests for sankeyAggregation
 * Story 15b-2f: Tests for extracted aggregation module
 */

import { describe, it, expect } from 'vitest';
import { aggregateTransactions, type FlowAggregates } from '@features/analytics/utils/sankeyAggregation';
import type { Transaction } from '@/types/transaction';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createTransaction(
    storeCategory: string,
    items: Array<{ name: string; price: number; category: string }>
): Transaction {
    return {
        id: `tx-${Math.random().toString(36).substr(2, 9)}`,
        date: '2026-01-11',
        merchant: 'Test Merchant',
        category: storeCategory as never,
        total: items.reduce((sum, item) => sum + item.price, 0),
        items: items.map(item => ({
            name: item.name,
            price: item.price,
            category: item.category,
        })),
    };
}

// ============================================================================
// TESTS
// ============================================================================

describe('aggregateTransactions', () => {
    it('returns empty maps for empty transactions array', () => {
        const result = aggregateTransactions([]);

        expect(result.storeGroups.size).toBe(0);
        expect(result.storeCategories.size).toBe(0);
        expect(result.itemGroups.size).toBe(0);
        expect(result.itemCategories.size).toBe(0);
        expect(result.storeGroupToStoreCategory.size).toBe(0);
        expect(result.storeCategoryToItemGroup.size).toBe(0);
        expect(result.itemGroupToItemCategory.size).toBe(0);
        expect(result.storeCategoryToItemCategory.size).toBe(0);
    });

    it('skips transactions without items', () => {
        const tx: Transaction = {
            id: 'tx-1',
            date: '2026-01-11',
            merchant: 'Test',
            category: 'Supermarket' as never,
            total: 1000,
            items: [],
        };
        const result = aggregateTransactions([tx]);

        expect(result.storeCategories.size).toBe(0);
    });

    it('skips transactions with undefined items', () => {
        const tx: Transaction = {
            id: 'tx-1',
            date: '2026-01-11',
            merchant: 'Test',
            category: 'Supermarket' as never,
            total: 1000,
        } as Transaction;
        const result = aggregateTransactions([tx]);

        expect(result.storeCategories.size).toBe(0);
    });

    it('skips transactions without category', () => {
        const tx: Transaction = {
            id: 'tx-1',
            date: '2026-01-11',
            merchant: 'Test',
            category: '' as never,
            total: 1000,
            items: [{ name: 'Item', price: 1000, category: 'Produce' }],
        };
        const result = aggregateTransactions([tx]);

        expect(result.storeCategories.size).toBe(0);
    });

    it('skips items with zero or negative price', () => {
        const tx = createTransaction('Supermarket', [
            { name: 'Free', price: 0, category: 'Produce' },
            { name: 'Refund', price: -500, category: 'Produce' },
            { name: 'Valid', price: 1000, category: 'Produce' },
        ]);
        const result = aggregateTransactions([tx]);

        // Only the valid item should be counted
        const scAgg = result.storeCategories.get('Supermarket' as never);
        expect(scAgg?.count).toBe(1);
        expect(scAgg?.value).toBe(1000);
    });

    it('aggregates a single transaction with one item correctly', () => {
        const tx = createTransaction('Supermarket', [
            { name: 'Apples', price: 5000, category: 'Produce' },
        ]);
        const result = aggregateTransactions([tx]);

        // Store categories
        const scAgg = result.storeCategories.get('Supermarket' as never);
        expect(scAgg).toBeDefined();
        expect(scAgg?.value).toBe(5000);
        expect(scAgg?.count).toBe(1);

        // Item categories
        const icAgg = result.itemCategories.get('Produce' as never);
        expect(icAgg).toBeDefined();
        expect(icAgg?.value).toBe(5000);
        expect(icAgg?.count).toBe(1);

        // Store groups should be populated
        expect(result.storeGroups.size).toBeGreaterThan(0);

        // Flow links should be populated
        expect(result.storeCategoryToItemCategory.size).toBeGreaterThan(0);
    });

    it('accumulates values across multiple transactions with same store category', () => {
        const tx1 = createTransaction('Supermarket', [
            { name: 'Apples', price: 3000, category: 'Produce' },
        ]);
        const tx2 = createTransaction('Supermarket', [
            { name: 'Oranges', price: 2000, category: 'Produce' },
        ]);
        const result = aggregateTransactions([tx1, tx2]);

        const scAgg = result.storeCategories.get('Supermarket' as never);
        expect(scAgg?.value).toBe(5000);
        expect(scAgg?.count).toBe(2);
    });

    it('accumulates item categories across different transactions', () => {
        const tx1 = createTransaction('Supermarket', [
            { name: 'Apples', price: 3000, category: 'Produce' },
        ]);
        const tx2 = createTransaction('Restaurant', [
            { name: 'Salad', price: 4000, category: 'Produce' },
        ]);
        const result = aggregateTransactions([tx1, tx2]);

        const icAgg = result.itemCategories.get('Produce' as never);
        expect(icAgg?.value).toBe(7000);
        expect(icAgg?.count).toBe(2);
    });

    it('creates flow link keys with arrow separator', () => {
        const tx = createTransaction('Supermarket', [
            { name: 'Apples', price: 5000, category: 'Produce' },
        ]);
        const result = aggregateTransactions([tx]);

        // storeCategoryToItemCategory link
        const scToIcKeys = Array.from(result.storeCategoryToItemCategory.keys());
        expect(scToIcKeys.some(key => key.includes('→'))).toBe(true);
        expect(scToIcKeys.some(key => key.includes('Supermarket'))).toBe(true);
    });

    it('counts per item not per transaction', () => {
        const tx = createTransaction('Supermarket', [
            { name: 'Apples', price: 3000, category: 'Produce' },
            { name: 'Milk', price: 2000, category: 'DairyEggs' },
            { name: 'Oranges', price: 1000, category: 'Produce' },
        ]);
        const result = aggregateTransactions([tx]);

        const scAgg = result.storeCategories.get('Supermarket' as never);
        expect(scAgg?.count).toBe(3); // 3 items, not 1 transaction
        expect(scAgg?.value).toBe(6000);
    });

    it('skips items with NaN price (typeof guard)', () => {
        const tx = createTransaction('Supermarket', [
            { name: 'Bad Price', price: NaN, category: 'Produce' },
            { name: 'Valid', price: 1000, category: 'Produce' },
        ]);
        const result = aggregateTransactions([tx]);

        const scAgg = result.storeCategories.get('Supermarket' as never);
        expect(scAgg?.count).toBe(1);
        expect(scAgg?.value).toBe(1000);
    });

    it('skips items with string price (typeof guard)', () => {
        const tx = createTransaction('Supermarket', [
            { name: 'String Price', price: '1000' as unknown as number, category: 'Produce' },
            { name: 'Valid', price: 2000, category: 'Produce' },
        ]);
        const result = aggregateTransactions([tx]);

        const scAgg = result.storeCategories.get('Supermarket' as never);
        expect(scAgg?.count).toBe(1);
        expect(scAgg?.value).toBe(2000);
    });

    it('skips items with missing category', () => {
        const tx: Transaction = {
            id: 'tx-1',
            date: '2026-01-11',
            merchant: 'Test',
            category: 'Supermarket' as never,
            total: 5000,
            items: [
                { name: 'Valid', price: 3000, category: 'Produce' },
                { name: 'NoCategory', price: 2000, category: '' },
            ],
        };
        const result = aggregateTransactions([tx]);

        const scAgg = result.storeCategories.get('Supermarket' as never);
        expect(scAgg?.count).toBe(1);
        expect(scAgg?.value).toBe(3000);
    });
});
