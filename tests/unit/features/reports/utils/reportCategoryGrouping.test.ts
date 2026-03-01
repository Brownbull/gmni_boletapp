/**
 * Tests for Report Category Grouping — Edge Cases
 *
 * Story TD-15b-14: trendPercent reverse-calculation guards
 * Verifies no Infinity/NaN propagation in group-level trend output.
 */

import { describe, it, expect } from 'vitest';
import type { CategoryBreakdown } from '@/types/report';
import {
  groupCategoriesByStoreGroup,
  groupItemsByItemCategory,
} from '@features/reports/utils/reportUtils';
import type { Transaction } from '@/types/transaction';

// ============================================================================
// Helpers
// ============================================================================

function makeCategoryBreakdown(
  overrides: Partial<CategoryBreakdown> = {}
): CategoryBreakdown {
  return {
    category: 'Supermarket',
    icon: '🛒',
    amount: 10000,
    percent: 100,
    transactionCount: 1,
    ...overrides,
  };
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    date: '2025-01-06',
    merchant: 'Test',
    category: 'Supermarket',
    total: 10000,
    items: [],
    ...overrides,
  };
}

// ============================================================================
// groupCategoriesByStoreGroup — Trend Edge Cases
// ============================================================================

describe('groupCategoriesByStoreGroup — trend edge cases', () => {
  it('should not produce Infinity when trendPercent is 100 and trend is down', () => {
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({
        amount: 5000,
        trend: 'down',
        trendPercent: 100,
      }),
    ];

    const groups = groupCategoriesByStoreGroup(categories);

    for (const group of groups) {
      expect(Number.isFinite(group.rawTotalAmount)).toBe(true);
      if (group.trendPercent !== undefined) {
        expect(Number.isFinite(group.trendPercent)).toBe(true);
      }
    }
  });

  it('should skip reverse-calculation when trendPercent causes near-zero multiplier', () => {
    // trendPercent=99.5 + down → multiplier = 0.005 → below 0.01 threshold
    // Without guard: prevAmount = 5000/0.005 = 1,000,000 → inflated group trend
    // With guard: skip → group has no prevTotal → group trend undefined
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({
        amount: 5000,
        trend: 'down',
        trendPercent: 99.5,
      }),
    ];

    const groups = groupCategoriesByStoreGroup(categories);

    // The sole category has a near-zero multiplier, so its reverse-calculated
    // previous amount should be skipped. With no other categories contributing,
    // the group's previous total is 0, so group trend should be undefined.
    for (const group of groups) {
      expect(group.trend).toBeUndefined();
      expect(group.trendPercent).toBeUndefined();
    }
  });

  it('should handle normal trend percentages correctly', () => {
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({
        amount: 12000,
        trend: 'up',
        trendPercent: 20,
      }),
    ];

    const groups = groupCategoriesByStoreGroup(categories);

    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      if (group.trendPercent !== undefined) {
        expect(Number.isFinite(group.trendPercent)).toBe(true);
      }
    }
  });

  it('should perform reverse-calculation at exact boundary (trendPercent 99, multiplier 0.01)', () => {
    // trendPercent=99 + down → multiplier = 1 - 99/100 = 0.01 → exactly at threshold
    // The guard is >= 0.01, so this should proceed (not skip)
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({
        amount: 5000,
        trend: 'down',
        trendPercent: 99,
      }),
    ];

    const groups = groupCategoriesByStoreGroup(categories);

    // Multiplier 0.01 passes the >= 0.01 guard, so prevAmount is calculated
    // → group gets a valid trend (not undefined)
    for (const group of groups) {
      expect(group.trend).toBeDefined();
      expect(group.trendPercent).toBeDefined();
      expect(Number.isFinite(group.trendPercent!)).toBe(true);
    }
  });

  it('should skip reverse-calculation when trendPercent is 0', () => {
    // trendPercent=0 → guard `cat.trendPercent > 0` is false → skip block entirely
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({
        amount: 8000,
        trend: 'neutral',
        trendPercent: 0,
      }),
    ];

    const groups = groupCategoriesByStoreGroup(categories);

    // No previous total contributed → group trend is undefined
    for (const group of groups) {
      expect(group.trend).toBeUndefined();
      expect(group.trendPercent).toBeUndefined();
    }
  });
});

// ============================================================================
// groupItemsByItemCategory — Trend Edge Cases
// ============================================================================

describe('groupItemsByItemCategory — trend edge cases', () => {
  it('should not produce Infinity with extreme trend in item data', () => {
    // Create transactions with items that would produce extreme trends
    const current: Transaction[] = [
      makeTx({
        id: 'tx-curr',
        total: 100,
        items: [{ name: 'Apple', category: 'Produce', price: 100, qty: 1 }],
      }),
    ];
    // Previous period had much higher amounts → trend will be "down" with high %
    const previous: Transaction[] = [
      makeTx({
        id: 'tx-prev',
        total: 10000,
        items: [{ name: 'Apple', category: 'Produce', price: 10000, qty: 1 }],
      }),
    ];

    const groups = groupItemsByItemCategory(current, previous);

    for (const group of groups) {
      expect(Number.isFinite(group.rawTotalAmount)).toBe(true);
      if (group.trendPercent !== undefined) {
        expect(Number.isFinite(group.trendPercent)).toBe(true);
      }
    }
  });

  it('should skip reverse-calculation when item trendPercent causes near-zero multiplier', () => {
    // Current period: tiny amount. Previous: much larger → produces high down trend.
    // The trend is calculated by getItemBreakdown via calculateTrend.
    // If trendPercent is very high (e.g., 99%+), the reverse-calculation multiplier
    // approaches zero. The guard at line 366 should skip it.
    // We use real transactions here — a 99%+ drop triggers the guard.
    const current: Transaction[] = [
      makeTx({
        id: 'tx-curr',
        total: 1,
        items: [{ name: 'Apple', category: 'Produce', price: 1, qty: 1 }],
      }),
    ];
    const previous: Transaction[] = [
      makeTx({
        id: 'tx-prev',
        total: 100000,
        items: [{ name: 'Apple', category: 'Produce', price: 100000, qty: 1 }],
      }),
    ];

    const groups = groupItemsByItemCategory(current, previous);

    for (const group of groups) {
      expect(Number.isFinite(group.rawTotalAmount)).toBe(true);
      if (group.trendPercent !== undefined) {
        expect(Number.isFinite(group.trendPercent)).toBe(true);
      }
    }
  });

  it('should handle zero previous amount gracefully', () => {
    const current: Transaction[] = [
      makeTx({
        id: 'tx-1',
        total: 5000,
        items: [{ name: 'Bread', category: 'Bakery', price: 5000, qty: 1 }],
      }),
    ];

    const groups = groupItemsByItemCategory(current, []);

    for (const group of groups) {
      expect(Number.isFinite(group.rawTotalAmount)).toBe(true);
      expect(group.trend).toBeUndefined();
    }
  });
});
