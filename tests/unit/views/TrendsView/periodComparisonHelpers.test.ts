/**
 * Tests for TrendsView/periodComparisonHelpers.ts
 * Story 15-TD-21: Test coverage for TD-16 extracted helpers
 *
 * Pure computation functions:
 * - computePreviousPeriodTotals: Aggregates spending by category from previous period
 * - computeDailySparkline: Cumulative daily sparkline data for a category
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from '@/types/transaction';
import type { DonutViewMode, CurrentPeriod } from '@/views/TrendsView/types';
import { makeTx } from '../__fixtures__/transactionFactory';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/utils/categoryNormalizer', () => ({
  normalizeItemCategory: vi.fn((cat: string) => cat),
}));

vi.mock('@/config/categoryColors', async () => {
  const fixtures = await import('../__fixtures__/categoryColorsMock');
  return {
    STORE_CATEGORY_GROUPS: fixtures.MOCK_STORE_CATEGORY_GROUPS,
    ITEM_CATEGORY_GROUPS: fixtures.MOCK_ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_TO_KEY: fixtures.MOCK_ITEM_CATEGORY_TO_KEY,
  };
});

import {
  computePreviousPeriodTotals,
  computeDailySparkline,
} from '@/views/TrendsView/periodComparisonHelpers';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// computePreviousPeriodTotals
// ============================================================================

describe('computePreviousPeriodTotals', () => {
  describe('store-categories mode', () => {
    it('aggregates by transaction category', () => {
      const txs = [
        makeTx({ date: '2026-01-01', total: 1000, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-02', total: 500, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-03', total: 300, category: 'Restaurante' as Transaction['category'] }),
      ];

      const result = computePreviousPeriodTotals(txs, 'store-categories');
      expect(result.get('Supermercado')).toBe(1500);
      expect(result.get('Restaurante')).toBe(300);
    });

    it('defaults missing category to "Unknown"', () => {
      const txs = [
        makeTx({ date: '2026-01-01', total: 100, category: '' as Transaction['category'] }),
      ];

      const result = computePreviousPeriodTotals(txs, 'store-categories');
      expect(result.get('Unknown')).toBe(100);
    });

    it('returns empty map for empty transactions', () => {
      const result = computePreviousPeriodTotals([], 'store-categories');
      expect(result.size).toBe(0);
    });
  });

  describe('store-groups mode', () => {
    it('maps store categories to their groups', () => {
      const txs = [
        makeTx({ date: '2026-01-01', total: 1000, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-02', total: 500, category: 'Restaurante' as Transaction['category'] }),
        makeTx({ date: '2026-01-03', total: 300, category: 'Farmacia' as Transaction['category'] }),
      ];

      const result = computePreviousPeriodTotals(txs, 'store-groups');
      expect(result.get('food-dining')).toBe(1500); // Supermercado + Restaurante
      expect(result.get('health-wellness')).toBe(300);
    });

    it('maps unknown categories to "other" group', () => {
      const txs = [
        makeTx({ date: '2026-01-01', total: 200, category: 'UnknownStore' as Transaction['category'] }),
      ];

      const result = computePreviousPeriodTotals(txs, 'store-groups');
      expect(result.get('other')).toBe(200);
    });
  });

  describe('item-categories mode', () => {
    it('aggregates by item category using item price * qty', () => {
      const txs = [
        makeTx({
          date: '2026-01-01',
          total: 1000,
          items: [
            { name: 'Milk', price: 300, category: 'Lácteos', qty: 2 },
            { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
          ],
        }),
      ];

      const result = computePreviousPeriodTotals(txs, 'item-categories');
      expect(result.get('Lácteos')).toBe(600); // 300 * 2
      expect(result.get('Frutas y Verduras')).toBe(200); // 200 * 1 (default qty)
    });

    it('defaults missing item category to "Unknown"', () => {
      const txs = [
        makeTx({
          date: '2026-01-01',
          total: 100,
          items: [{ name: 'Mystery', price: 100 }],
        }),
      ];

      const result = computePreviousPeriodTotals(txs, 'item-categories');
      expect(result.get('Unknown')).toBe(100);
    });

    it('skips transactions with no items', () => {
      const txs = [makeTx({ date: '2026-01-01', total: 500 })];
      const result = computePreviousPeriodTotals(txs, 'item-categories');
      expect(result.size).toBe(0);
    });
  });

  describe('item-groups mode', () => {
    it('maps item categories to their groups', () => {
      const txs = [
        makeTx({
          date: '2026-01-01',
          total: 1000,
          items: [
            { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
            { name: 'Steak', price: 500, category: 'Carnes y Mariscos' },
            { name: 'Milk', price: 300, category: 'Lácteos' },
          ],
        }),
      ];

      const result = computePreviousPeriodTotals(txs, 'item-groups');
      expect(result.get('food-fresh')).toBe(700); // Frutas + Carnes
      expect(result.get('food-packaged')).toBe(300); // Lácteos
    });

    it('skips items with unmapped categories', () => {
      const txs = [
        makeTx({
          date: '2026-01-01',
          total: 100,
          items: [{ name: 'Widget', price: 100, category: 'UnmappedCat' }],
        }),
      ];

      const result = computePreviousPeriodTotals(txs, 'item-groups');
      // UnmappedCat has no ITEM_CATEGORY_TO_KEY entry → skipped
      expect(result.size).toBe(0);
    });
  });

  describe('default mode', () => {
    it('falls into item-based else branch for unknown mode', () => {
      // Exercises the else branch in the switch statement: any mode not matching
      // 'store-categories' or 'item-categories' falls through to item-based aggregation.
      // Transactions with no items produce empty results in this branch.
      const txs = [
        makeTx({ date: '2026-01-01', total: 500, category: 'Supermercado' as Transaction['category'] }),
      ];

      const result = computePreviousPeriodTotals(txs, 'unknown-mode' as DonutViewMode);
      // No items → nothing aggregated in item-based branch
      expect(result.size).toBe(0);
    });
  });
});

// ============================================================================
// computeDailySparkline
// ============================================================================

describe('computeDailySparkline', () => {
  const basePeriod: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };

  describe('week period', () => {
    it('returns 7-point cumulative sparkline', () => {
      const txs = [
        makeTx({ date: '2026-01-05', total: 100, category: 'Supermercado' as Transaction['category'] }), // Monday=1
        makeTx({ date: '2026-01-07', total: 200, category: 'Supermercado' as Transaction['category'] }), // Wednesday=3
      ];

      const result = computeDailySparkline('Supermercado', txs, 'store-categories', 'week', basePeriod);
      expect(result).toHaveLength(7);
      // Cumulative data, last value should be total
      expect(result[result.length - 1]).toBe(300);
    });
  });

  describe('month period', () => {
    it('returns correct number of days for January', () => {
      const result = computeDailySparkline('Supermercado', [], 'store-categories', 'month', basePeriod);
      expect(result).toHaveLength(20); // 31 days > 20 max → downsampled to 20
    });

    it('returns correct number of days for February (non-leap)', () => {
      const febPeriod: CurrentPeriod = { year: 2025, month: 2, quarter: 1, week: 1 };
      const result = computeDailySparkline('Supermercado', [], 'store-categories', 'month', febPeriod);
      expect(result).toHaveLength(20); // 28 days > 20 max → downsampled to 20
    });

    it('accumulates daily totals cumulatively', () => {
      // Use mid-month dates to avoid UTC/local timezone day-boundary issues
      const txs = [
        makeTx({ date: '2026-01-10T12:00:00', total: 100, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-10T14:00:00', total: 50, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-20T12:00:00', total: 200, category: 'Supermercado' as Transaction['category'] }),
      ];

      const result = computeDailySparkline('Supermercado', txs, 'store-categories', 'month', basePeriod);
      // Last value should be cumulative total of all matching transactions
      expect(result[result.length - 1]).toBe(350);
      // Values should be non-decreasing (cumulative)
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
      }
    });
  });

  describe('quarter period', () => {
    it('computes days across 3 months', () => {
      const q1Period: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
      const result = computeDailySparkline('Supermercado', [], 'store-categories', 'quarter', q1Period);
      // Q1 = Jan(31) + Feb(28) + Mar(31) = 90 days → downsampled to 20
      expect(result).toHaveLength(20);
    });
  });

  describe('year period', () => {
    it('returns 20 downsampled points for 365-day period', () => {
      const result = computeDailySparkline('Supermercado', [], 'store-categories', 'year', basePeriod);
      expect(result).toHaveLength(20);
    });
  });

  describe('category matching', () => {
    it('only includes matching store-categories transactions', () => {
      const txs = [
        makeTx({ date: '2026-01-05', total: 100, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-05', total: 200, category: 'Restaurante' as Transaction['category'] }),
      ];

      const result = computeDailySparkline('Supermercado', txs, 'store-categories', 'week', basePeriod);
      expect(result[result.length - 1]).toBe(100); // Only Supermercado
    });

    it('matches item-categories by item category', () => {
      const txs = [
        makeTx({
          date: '2026-01-05',
          total: 500,
          items: [
            { name: 'Milk', price: 300, category: 'Lácteos' },
            { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
          ],
        }),
      ];

      const result = computeDailySparkline('Lácteos', txs, 'item-categories', 'week', basePeriod);
      expect(result[result.length - 1]).toBe(300); // Only Lácteos items
    });

    it('returns all zeros for non-matching category', () => {
      const txs = [
        makeTx({ date: '2026-01-05', total: 100, category: 'Supermercado' as Transaction['category'] }),
      ];

      const result = computeDailySparkline('Farmacia', txs, 'store-categories', 'week', basePeriod);
      expect(result.every(v => v === 0)).toBe(true);
    });
  });

  describe('store-groups mode', () => {
    // Fixed in 15-TD-26: replaced String.includes loop with direct key lookup
    it('matches store categories to their groups via direct lookup', () => {
      const txs = [
        makeTx({ date: '2026-01-05', total: 500, category: 'Supermercado' as Transaction['category'] }),
      ];

      // STORE_CATEGORY_GROUPS['Supermercado'] === 'food-dining' → direct lookup
      const result = computeDailySparkline('food-dining', txs, 'store-groups', 'week', basePeriod);
      expect(result[result.length - 1]).toBe(500);
    });

    it('returns zeros when category does not belong to requested group', () => {
      const txs = [
        makeTx({ date: '2026-01-05', total: 500, category: 'Supermercado' as Transaction['category'] }),
      ];

      const result = computeDailySparkline('health-wellness', txs, 'store-groups', 'week', basePeriod);
      expect(result.every(v => v === 0)).toBe(true);
    });
  });

  describe('item-groups mode', () => {
    // Fixed in 15-TD-26: replaced String.includes loop with direct key lookup
    it('matches item categories to their groups via direct lookup', () => {
      const txs = [
        makeTx({
          date: '2026-01-05',
          total: 500,
          items: [
            { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
            { name: 'Steak', price: 300, category: 'Carnes y Mariscos' },
          ],
        }),
      ];

      // Both map to 'food-fresh' via ITEM_CATEGORY_TO_KEY → ITEM_CATEGORY_GROUPS
      const result = computeDailySparkline('food-fresh', txs, 'item-groups', 'week', basePeriod);
      expect(result[result.length - 1]).toBe(500); // 200 + 300
    });

    it('returns zeros for non-matching item group', () => {
      const txs = [
        makeTx({
          date: '2026-01-05',
          total: 300,
          items: [{ name: 'Milk', price: 300, category: 'Lácteos' }],
        }),
      ];

      // Lácteos maps to 'food-packaged', not 'food-fresh'
      const result = computeDailySparkline('food-fresh', txs, 'item-groups', 'week', basePeriod);
      expect(result.every(v => v === 0)).toBe(true);
    });
  });

  describe('downsampling', () => {
    it('preserves cumulative shape by sampling evenly', () => {
      // Month with 31 days → downsampled to 20 points
      // Use mid-month dates to avoid UTC/local timezone day-boundary issues
      const txs = [
        makeTx({ date: '2026-01-10T12:00:00', total: 100, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-25T12:00:00', total: 100, category: 'Supermercado' as Transaction['category'] }),
      ];

      const result = computeDailySparkline('Supermercado', txs, 'store-categories', 'month', basePeriod);
      expect(result).toHaveLength(20);
      // Last sampled point includes cumulative total
      expect(result[result.length - 1]).toBe(200);
      // Values should be non-decreasing (cumulative)
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
      }
    });

    it('does not downsample when ≤20 points', () => {
      // Week = 7 days → no downsampling
      const result = computeDailySparkline('Supermercado', [], 'store-categories', 'week', basePeriod);
      expect(result).toHaveLength(7);
    });
  });

  describe('edge cases', () => {
    it('handles empty transactions', () => {
      const result = computeDailySparkline('Supermercado', [], 'store-categories', 'week', basePeriod);
      expect(result).toHaveLength(7);
      expect(result.every(v => v === 0)).toBe(true);
    });

    it('clamps day index within bounds', () => {
      // Transaction with date far outside the period shouldn't crash
      const txs = [
        makeTx({ date: '2026-12-31', total: 100, category: 'Supermercado' as Transaction['category'] }),
      ];

      const result = computeDailySparkline('Supermercado', txs, 'store-categories', 'week', basePeriod);
      expect(result).toHaveLength(7);
      // Value should be placed at clamped boundary
      expect(result[result.length - 1]).toBe(100);
    });
  });
});
