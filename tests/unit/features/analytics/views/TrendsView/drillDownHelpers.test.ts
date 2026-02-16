/**
 * Tests for TrendsView/drillDownHelpers.ts
 * Story 15-TD-21: Test coverage for TD-16 extracted helpers
 *
 * 1 exported function:
 * - resolveDrillDownCategories: Resolves CategoryData[] for any view mode/level/path
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { makeTx } from '../../../../views/__fixtures__/transactionFactory';
import { makeCategoryData } from '../../../../views/__fixtures__/categoryDataFactory';

// ============================================================================
// Mocks
// ============================================================================

const mockComputeItemGroupsForStore = vi.fn(() => []);
const mockComputeItemCategoriesInGroup = vi.fn(() => []);
const mockComputeSubcategoryData = vi.fn(() => []);
const mockComputeAllCategoryData = vi.fn(() => []);

vi.mock('@features/analytics/views/TrendsView/aggregationHelpers', () => ({
  computeItemGroupsForStore: (...args: unknown[]) => mockComputeItemGroupsForStore(...args),
  computeItemCategoriesInGroup: (...args: unknown[]) => mockComputeItemCategoriesInGroup(...args),
  computeSubcategoryData: (...args: unknown[]) => mockComputeSubcategoryData(...args),
  computeAllCategoryData: (...args: unknown[]) => mockComputeAllCategoryData(...args),
}));

vi.mock('@/config/categoryColors', () => ({
  STORE_CATEGORY_GROUPS: {
    Supermercado: 'food-dining',
    Restaurante: 'food-dining',
    Farmacia: 'health-wellness',
  } as Record<string, string>,
}));

import { resolveDrillDownCategories } from '@features/analytics/views/TrendsView/drillDownHelpers';

beforeEach(() => {
  vi.clearAllMocks();
});

const txs: Transaction[] = [
  makeTx({ date: '2026-01-01', total: 1000 }),
];

// ============================================================================
// resolveDrillDownCategories
// ============================================================================

describe('resolveDrillDownCategories', () => {
  it('returns empty array at level 0', () => {
    const result = resolveDrillDownCategories(txs, 'store-categories', 0, []);
    expect(result).toEqual([]);
  });

  describe('store-categories drill-down', () => {
    it('level 1 → computeItemGroupsForStore(txs, storeCat)', () => {
      const expected = [makeCategoryData('food-fresh', 500)];
      mockComputeItemGroupsForStore.mockReturnValue(expected);

      const result = resolveDrillDownCategories(txs, 'store-categories', 1, ['Supermercado']);
      expect(mockComputeItemGroupsForStore).toHaveBeenCalledWith(txs, 'Supermercado');
      expect(result).toBe(expected);
    });

    it('level 2 → computeItemCategoriesInGroup(txs, itemGroup, storeCat)', () => {
      const expected = [makeCategoryData('Lácteos', 300)];
      mockComputeItemCategoriesInGroup.mockReturnValue(expected);

      const result = resolveDrillDownCategories(txs, 'store-categories', 2, ['Supermercado', 'food-packaged']);
      expect(mockComputeItemCategoriesInGroup).toHaveBeenCalledWith(txs, 'food-packaged', 'Supermercado');
      expect(result).toBe(expected);
    });

    it('level 3 → computeSubcategoryData(txs, itemCategory)', () => {
      const expected = [makeCategoryData('Beef', 200)];
      mockComputeSubcategoryData.mockReturnValue(expected);

      const result = resolveDrillDownCategories(txs, 'store-categories', 3, ['Supermercado', 'food-fresh', 'Carnes']);
      expect(mockComputeSubcategoryData).toHaveBeenCalledWith(txs, 'Carnes');
      expect(result).toBe(expected);
    });

    it('returns empty if path[0] missing at level 1', () => {
      const result = resolveDrillDownCategories(txs, 'store-categories', 1, []);
      expect(result).toEqual([]);
    });
  });

  describe('store-groups drill-down', () => {
    it('level 1 → filters allCategoryData by STORE_CATEGORY_GROUPS match', () => {
      const allCategories = [
        makeCategoryData('Supermercado', 800),
        makeCategoryData('Restaurante', 400),
        makeCategoryData('Farmacia', 200),
      ];

      const result = resolveDrillDownCategories(txs, 'store-groups', 1, ['food-dining'], allCategories);
      // Supermercado → food-dining, Restaurante → food-dining
      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toEqual(['Supermercado', 'Restaurante']);
    });

    it('level 1 → falls back to computeAllCategoryData if allCategoryData not provided', () => {
      const computed = [
        makeCategoryData('Supermercado', 800),
        makeCategoryData('Farmacia', 200),
      ];
      mockComputeAllCategoryData.mockReturnValue(computed);

      const result = resolveDrillDownCategories(txs, 'store-groups', 1, ['food-dining']);
      expect(mockComputeAllCategoryData).toHaveBeenCalledWith(txs);
      expect(result).toHaveLength(1); // Only Supermercado maps to food-dining
    });

    it('level 2 → computeItemGroupsForStore(txs, storeCategory)', () => {
      mockComputeItemGroupsForStore.mockReturnValue([]);

      resolveDrillDownCategories(txs, 'store-groups', 2, ['food-dining', 'Supermercado']);
      expect(mockComputeItemGroupsForStore).toHaveBeenCalledWith(txs, 'Supermercado');
    });

    it('level 3 → computeItemCategoriesInGroup(txs, itemGroup, storeCat)', () => {
      mockComputeItemCategoriesInGroup.mockReturnValue([]);

      resolveDrillDownCategories(txs, 'store-groups', 3, ['food-dining', 'Supermercado', 'food-fresh']);
      expect(mockComputeItemCategoriesInGroup).toHaveBeenCalledWith(txs, 'food-fresh', 'Supermercado');
    });
  });

  describe('item-groups drill-down', () => {
    it('level 1 → computeItemCategoriesInGroup(txs, itemGroup)', () => {
      mockComputeItemCategoriesInGroup.mockReturnValue([]);

      resolveDrillDownCategories(txs, 'item-groups', 1, ['food-fresh']);
      expect(mockComputeItemCategoriesInGroup).toHaveBeenCalledWith(txs, 'food-fresh');
    });

    it('level 2 → computeSubcategoryData(txs, itemCategory)', () => {
      mockComputeSubcategoryData.mockReturnValue([]);

      resolveDrillDownCategories(txs, 'item-groups', 2, ['food-fresh', 'Carnes']);
      expect(mockComputeSubcategoryData).toHaveBeenCalledWith(txs, 'Carnes');
    });
  });

  describe('item-categories drill-down', () => {
    it('level 1 → computeSubcategoryData(txs, itemCategory)', () => {
      mockComputeSubcategoryData.mockReturnValue([]);

      resolveDrillDownCategories(txs, 'item-categories', 1, ['Carnes y Mariscos']);
      expect(mockComputeSubcategoryData).toHaveBeenCalledWith(txs, 'Carnes y Mariscos');
    });
  });

  describe('edge cases', () => {
    it('returns empty for path with falsy entries', () => {
      const result = resolveDrillDownCategories(txs, 'store-categories', 2, ['', '']);
      expect(result).toEqual([]);
    });

    it('returns empty for out-of-range drill level', () => {
      const result = resolveDrillDownCategories(txs, 'item-categories', 5, ['A', 'B', 'C', 'D', 'E']);
      expect(result).toEqual([]);
    });

    it('returns empty for empty transactions', () => {
      mockComputeItemGroupsForStore.mockReturnValue([]);

      const result = resolveDrillDownCategories([], 'store-categories', 1, ['Supermercado']);
      expect(mockComputeItemGroupsForStore).toHaveBeenCalledWith([], 'Supermercado');
      expect(result).toEqual([]);
    });
  });
});
