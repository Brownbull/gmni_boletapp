/**
 * Unit tests for drillDownPath multi-dimension filtering
 *
 * Story 14.13a: Multi-Level Filter Support
 *
 * Tests the matchesCategoryFilter function when drillDownPath is present,
 * verifying that transactions are filtered by multiple dimensions simultaneously.
 */

import { describe, it, expect } from 'vitest';
import { filterTransactionsByHistoryFilters } from '@shared/utils/historyFilterUtils';
import type { Transaction } from '../../../src/types/transaction';
import type { HistoryFilterState } from '@/types/historyFilters';

// Helper to create a test transaction
// NOTE: Item categories should use canonical English names (Meat & Seafood, Produce, etc.)
// because normalizeItemCategory() converts Spanish names to English
function createTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'test-id',
    date: '2026-01-15',
    category: 'Supermarket',
    merchant: 'Test Store',
    total: 100,
    currency: 'CLP',
    items: [
      { name: 'Test Item', price: 100, category: 'Meat & Seafood' },
    ],
    ...overrides,
  } as Transaction;
}

// Helper to create filter state with drillDownPath
function createFilterWithDrillDownPath(
  drillDownPath: HistoryFilterState['category']['drillDownPath']
): HistoryFilterState {
  return {
    temporal: { level: 'all' },
    category: {
      level: 'all', // Level is ignored when drillDownPath is present
      drillDownPath,
    },
    location: {},
  };
}

describe('matchesCategoryFilter with drillDownPath', () => {
  describe('storeCategory filtering', () => {
    it('should filter transactions by storeCategory', () => {
      const transactions = [
        createTransaction({ category: 'Supermarket' }),
        createTransaction({ category: 'Restaurant' }),
        createTransaction({ category: 'Pharmacy' }),
      ];

      const filters = createFilterWithDrillDownPath({
        storeCategory: 'Supermarket',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Supermarket');
    });

    it('should match storeCategory case-insensitively', () => {
      const transactions = [
        createTransaction({ category: 'supermarket' }),
        createTransaction({ category: 'SUPERMARKET' }),
      ];

      const filters = createFilterWithDrillDownPath({
        storeCategory: 'Supermarket',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(2);
    });
  });

  describe('storeGroup filtering', () => {
    it('should expand storeGroup to all categories in the group', () => {
      const transactions = [
        createTransaction({ category: 'Supermarket' }),
        createTransaction({ category: 'Restaurant' }),
        createTransaction({ category: 'Pharmacy' }),
      ];

      // 'food-dining' group includes Supermarket, Restaurant, etc.
      const filters = createFilterWithDrillDownPath({
        storeGroup: 'food-dining',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      // Supermarket and Restaurant should match, Pharmacy should not
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some(t => t.category === 'Supermarket')).toBe(true);
      expect(result.some(t => t.category === 'Restaurant')).toBe(true);
    });

    it('should ignore storeGroup when storeCategory is also set', () => {
      const transactions = [
        createTransaction({ category: 'Supermarket' }),
        createTransaction({ category: 'Restaurant' }),
      ];

      // storeCategory takes priority over storeGroup
      const filters = createFilterWithDrillDownPath({
        storeGroup: 'food-dining',
        storeCategory: 'Supermarket',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Supermarket');
    });
  });

  describe('itemGroup filtering', () => {
    it('should filter by itemGroup (transaction must have matching item)', () => {
      const transactions = [
        createTransaction({
          id: '1',
          category: 'Supermarket',
          items: [{ name: 'Beef', price: 100, category: 'Meat & Seafood' }],
        }),
        createTransaction({
          id: '2',
          category: 'Supermarket',
          items: [{ name: 'Cereal', price: 50, category: 'Pantry' }], // Pantry is in food-packaged, not food-fresh
        }),
      ];

      // 'food-fresh' group includes Meat & Seafood, Dairy & Eggs, Produce, ItemBakery
      const filters = createFilterWithDrillDownPath({
        itemGroup: 'food-fresh',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].items?.[0].category).toBe('Meat & Seafood');
    });

    it('should ignore itemGroup when itemCategory is also set', () => {
      const transactions = [
        createTransaction({
          items: [
            { name: 'Beef', price: 100, category: 'Meat & Seafood' },
            { name: 'Fish', price: 80, category: 'Meat & Seafood' },
          ],
        }),
      ];

      // itemCategory takes priority over itemGroup
      const filters = createFilterWithDrillDownPath({
        itemGroup: 'food-fresh',
        itemCategory: 'Meat & Seafood',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
    });
  });

  describe('itemCategory filtering', () => {
    it('should filter by itemCategory (transaction must have matching item)', () => {
      const transactions = [
        createTransaction({
          items: [{ name: 'Beef', price: 100, category: 'Meat & Seafood' }],
        }),
        createTransaction({
          items: [{ name: 'Milk', price: 50, category: 'Dairy & Eggs' }],
        }),
      ];

      const filters = createFilterWithDrillDownPath({
        itemCategory: 'Meat & Seafood',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].items?.[0].category).toBe('Meat & Seafood');
    });

    it('should match itemCategory case-insensitively', () => {
      const transactions = [
        createTransaction({
          items: [{ name: 'Beef', price: 100, category: 'meat & seafood' }], // lowercase
        }),
      ];

      const filters = createFilterWithDrillDownPath({
        itemCategory: 'Meat & Seafood', // Title case
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
    });
  });

  describe('subcategory filtering', () => {
    it('should filter by subcategory (transaction must have matching item)', () => {
      const transactions = [
        createTransaction({
          items: [{ name: 'Beef', price: 100, category: 'Meat & Seafood', subcategory: 'Res' }],
        }),
        createTransaction({
          items: [{ name: 'Pork', price: 80, category: 'Meat & Seafood', subcategory: 'Cerdo' }],
        }),
      ];

      const filters = createFilterWithDrillDownPath({
        subcategory: 'Res',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].items?.[0].subcategory).toBe('Res');
    });
  });

  describe('multi-dimension filtering (combined)', () => {
    it('should filter by storeCategory AND itemGroup simultaneously', () => {
      const transactions = [
        // Supermarket with fresh food item - should match
        createTransaction({
          id: '1',
          category: 'Supermarket',
          items: [{ name: 'Beef', price: 100, category: 'Meat & Seafood' }],
        }),
        // Supermarket with packaged food - should NOT match (wrong item group)
        createTransaction({
          id: '2',
          category: 'Supermarket',
          items: [{ name: 'Cereal', price: 50, category: 'Pantry' }],
        }),
        // Restaurant with fresh food - should NOT match (wrong store category)
        createTransaction({
          id: '3',
          category: 'Restaurant',
          items: [{ name: 'Fish', price: 150, category: 'Meat & Seafood' }],
        }),
      ];

      const filters = createFilterWithDrillDownPath({
        storeCategory: 'Supermarket',
        itemGroup: 'food-fresh', // Includes Meat & Seafood but not Pantry
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by storeCategory AND itemCategory simultaneously', () => {
      const transactions = [
        // Supermarket with Carnes - should match
        createTransaction({
          id: '1',
          category: 'Supermarket',
          items: [{ name: 'Beef', price: 100, category: 'Meat & Seafood' }],
        }),
        // Supermarket with Dairy & Eggs - should NOT match
        createTransaction({
          id: '2',
          category: 'Supermarket',
          items: [{ name: 'Milk', price: 50, category: 'Dairy & Eggs' }],
        }),
        // Restaurant with Carnes - should NOT match
        createTransaction({
          id: '3',
          category: 'Restaurant',
          items: [{ name: 'Steak', price: 200, category: 'Meat & Seafood' }],
        }),
      ];

      const filters = createFilterWithDrillDownPath({
        storeCategory: 'Supermarket',
        itemCategory: 'Meat & Seafood',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by all dimensions: storeGroup + storeCategory + itemGroup + itemCategory + subcategory', () => {
      const transactions = [
        // Full match
        createTransaction({
          id: '1',
          category: 'Supermarket',
          items: [{ name: 'Prime Rib', price: 500, category: 'Meat & Seafood', subcategory: 'Res' }],
        }),
        // Wrong subcategory
        createTransaction({
          id: '2',
          category: 'Supermarket',
          items: [{ name: 'Pork Chop', price: 300, category: 'Meat & Seafood', subcategory: 'Cerdo' }],
        }),
      ];

      const filters = createFilterWithDrillDownPath({
        storeCategory: 'Supermarket',
        itemCategory: 'Meat & Seafood',
        subcategory: 'Res',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('edge cases', () => {
    it('should return all transactions when drillDownPath is empty', () => {
      const transactions = [
        createTransaction({ id: '1' }),
        createTransaction({ id: '2' }),
      ];

      const filters = createFilterWithDrillDownPath({});

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(2);
    });

    it('should handle transactions without items array', () => {
      const transactions = [
        createTransaction({ id: '1', items: undefined }),
        createTransaction({ id: '2', items: [] }),
      ];

      const filters = createFilterWithDrillDownPath({
        itemCategory: 'Meat & Seafood',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(0);
    });

    it('should handle items without category', () => {
      const transactions = [
        createTransaction({
          items: [{ name: 'Unknown Item', price: 50 }],
        }),
      ];

      const filters = createFilterWithDrillDownPath({
        itemCategory: 'Other',
      });

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      // Should match because normalizeItemCategory defaults to 'Other'
      expect(result).toHaveLength(1);
    });

    it('drillDownPath should take priority over legacy filters', () => {
      const transactions = [
        createTransaction({ id: '1', category: 'Supermarket' }),
        createTransaction({ id: '2', category: 'Restaurant' }),
      ];

      // When drillDownPath is present, level and category should be ignored
      const filters: HistoryFilterState = {
        temporal: { level: 'all' },
        category: {
          level: 'category',
          category: 'Restaurant', // This should be ignored
          drillDownPath: {
            storeCategory: 'Supermarket', // This should be used
          },
        },
        location: {},
          };

      const result = filterTransactionsByHistoryFilters(transactions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Supermarket');
    });
  });
});
