/**
 * Tests for useCategoryStatistics hook
 *
 * Story 14.40: Category Statistics Popup
 * Tests category filtering logic and statistics aggregation.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCategoryStatistics } from '@features/analytics/hooks/useCategoryStatistics';
import type { Transaction } from '../../../src/types/transaction';

// Mock transaction data
const createTransaction = (
  overrides: Partial<Transaction> & { id: string }
): Transaction => ({
  id: overrides.id,
  userId: 'test-user',
  merchant: overrides.merchant || 'Test Store',
  total: overrides.total || 10000,
  category: overrides.category || 'Supermarket', // Uses English StoreCategory enum
  date: overrides.date || new Date().toISOString(),
  currency: 'CLP',
  items: overrides.items || [],
  createdAt: new Date(),
  ...overrides,
});

const mockTransactions: Transaction[] = [
  createTransaction({
    id: 'tx-1',
    merchant: 'Walmart',
    total: 15000,
    category: 'Supermarket',
    items: [
      { name: 'Apples', price: 5000, qty: 1, category: 'Frutas y Verduras' },
      { name: 'Bread', price: 3000, qty: 1, category: 'Panadería' },
      { name: 'Milk', price: 7000, qty: 1, category: 'Lácteos y Huevos' },
    ],
  }),
  createTransaction({
    id: 'tx-2',
    merchant: 'Walmart',
    total: 25000,
    category: 'Supermarket',
    items: [
      { name: 'Chicken', price: 12000, qty: 1, category: 'Carnes y Mariscos' },
      { name: 'Rice', price: 8000, qty: 1, category: 'Despensa' },
      { name: 'Cheese', price: 5000, qty: 1, category: 'Lácteos y Huevos' },
    ],
  }),
  createTransaction({
    id: 'tx-3',
    merchant: 'McDonalds',
    total: 8000,
    category: 'Restaurant',
    items: [
      { name: 'Burger', price: 5000, qty: 1, category: 'Comida Preparada' },
      { name: 'Fries', price: 3000, qty: 1, category: 'Comida Preparada' },
    ],
  }),
  createTransaction({
    id: 'tx-4',
    merchant: 'Lider',
    total: 20000,
    category: 'Supermarket',
    items: [
      { name: 'Beef', price: 15000, qty: 1, category: 'Carnes y Mariscos' },
      { name: 'Vegetables', price: 5000, qty: 1, category: 'Frutas y Verduras' },
    ],
  }),
];

const totalSpentAllCategories = mockTransactions.reduce((sum, tx) => sum + tx.total, 0);

describe('useCategoryStatistics', () => {
  describe('store-category filtering', () => {
    it('returns null for empty category name', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: '',
          categoryType: 'store-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).toBeNull();
    });

    it('returns null when no transactions match', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Farmacia',
          categoryType: 'store-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).toBeNull();
    });

    it('calculates correct transaction statistics for store category', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current!.transactionCount).toBe(3);
      expect(result.current!.totalSpent).toBe(60000); // 15000 + 25000 + 20000
      expect(result.current!.minTransaction).toBe(15000);
      expect(result.current!.maxTransaction).toBe(25000);
      expect(result.current!.avgTransaction).toBe(20000);
      expect(result.current!.medianTransaction).toBe(20000);
    });

    it('calculates correct item statistics for store category', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).not.toBeNull();
      // 8 items across 3 Supermercado transactions
      expect(result.current!.itemCount).toBe(8);
      expect(result.current!.minItemPrice).toBe(3000); // Bread
      expect(result.current!.maxItemPrice).toBe(15000); // Beef
    });

    it('identifies top merchant correctly', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current!.topMerchant).toBe('Walmart');
      expect(result.current!.topMerchantCount).toBe(2);
    });

    it('calculates percentage of total correctly', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).not.toBeNull();
      // Supermercado: 60000 / 68000 total = ~88.24%
      expect(result.current!.percentageOfTotal).toBeCloseTo(88.24, 1);
    });
  });

  describe('store-group filtering', () => {
    it('filters by store group correctly', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'food-dining',
          categoryType: 'store-group',
          totalSpentAllCategories,
        })
      );

      // 'food-dining' group includes Supermercado and Restaurante
      expect(result.current).not.toBeNull();
      expect(result.current!.transactionCount).toBe(4); // All 4 transactions
    });
  });

  describe('item-category filtering', () => {
    // Story 14.44: categoryName must be in English (matching computeItemCategoryData output)
    // Items are stored with Spanish names, but normalizeItemCategory converts them to English
    it('filters transactions containing matching item category', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Meat & Seafood', // English - normalized from 'Carnes y Mariscos'
          categoryType: 'item-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).not.toBeNull();
      // 2 transactions have items normalized to "Meat & Seafood": tx-2 and tx-4
      expect(result.current!.transactionCount).toBe(2);
    });

    it('only counts items matching the item category', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Meat & Seafood', // English - normalized from 'Carnes y Mariscos'
          categoryType: 'item-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).not.toBeNull();
      // 2 items: Chicken (12000) and Beef (15000) - both stored as 'Carnes y Mariscos'
      expect(result.current!.itemCount).toBe(2);
      expect(result.current!.minItemPrice).toBe(12000);
      expect(result.current!.maxItemPrice).toBe(15000);
    });

    // Story 14.44: Verify normalization handles Spanish item categories correctly
    it('normalizes Spanish item categories to English for matching', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Prepared Food', // English for 'Comida Preparada'
          categoryType: 'item-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).not.toBeNull();
      // tx-3 has 2 items with 'Comida Preparada' (Burger and Fries)
      expect(result.current!.transactionCount).toBe(1);
      expect(result.current!.itemCount).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('handles transactions without items', () => {
      const transactionsNoItems: Transaction[] = [
        createTransaction({
          id: 'tx-no-items',
          total: 5000,
          category: 'Supermarket',
          items: [],
        }),
      ];

      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: transactionsNoItems,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories: 5000,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current!.transactionCount).toBe(1);
      expect(result.current!.itemCount).toBeUndefined();
    });

    it('handles items with zero or missing prices', () => {
      const transactionsZeroPrice: Transaction[] = [
        createTransaction({
          id: 'tx-zero',
          total: 5000,
          category: 'Supermarket',
          items: [
            { name: 'Free Sample', price: 0, qty: 1, category: 'Otro' },
            { name: 'Paid Item', price: 5000, qty: 1, category: 'Otro' },
          ],
        }),
      ];

      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: transactionsZeroPrice,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories: 5000,
        })
      );

      expect(result.current).not.toBeNull();
      // Only counts items with price > 0
      expect(result.current!.itemCount).toBe(1);
    });

    it('prefers alias over merchant name for top merchant', () => {
      const transactionsWithAlias: Transaction[] = [
        createTransaction({
          id: 'tx-alias-1',
          merchant: 'WALMART SUPERCENTER #1234',
          alias: 'Walmart',
          total: 10000,
          category: 'Supermarket',
        }),
        createTransaction({
          id: 'tx-alias-2',
          merchant: 'WALMART SUPERCENTER #5678',
          alias: 'Walmart',
          total: 15000,
          category: 'Supermarket',
        }),
      ];

      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: transactionsWithAlias,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories: 25000,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current!.topMerchant).toBe('Walmart');
      expect(result.current!.topMerchantCount).toBe(2);
    });

    it('handles single transaction correctly', () => {
      const singleTransaction: Transaction[] = [
        createTransaction({
          id: 'tx-single',
          total: 10000,
          category: 'Supermarket',
          items: [{ name: 'Item', price: 10000, qty: 1, category: 'Otro' }],
        }),
      ];

      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: singleTransaction,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories: 10000,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current!.transactionCount).toBe(1);
      expect(result.current!.minTransaction).toBe(10000);
      expect(result.current!.maxTransaction).toBe(10000);
      expect(result.current!.avgTransaction).toBe(10000);
      expect(result.current!.medianTransaction).toBe(10000);
      expect(result.current!.percentageOfTotal).toBe(100);
    });

    it('returns periodComparison as null (not yet implemented)', () => {
      const { result } = renderHook(() =>
        useCategoryStatistics({
          transactions: mockTransactions,
          categoryName: 'Supermarket',
          categoryType: 'store-category',
          totalSpentAllCategories,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current!.periodComparison).toBeNull();
    });
  });
});
