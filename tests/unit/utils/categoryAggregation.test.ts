/**
 * Tests for categoryAggregation.ts
 * Story 15-5a: Shared category aggregation utilities
 */
import { describe, it, expect } from 'vitest';
import {
  applyMasGrouping,
  applyTreemapGrouping,
  mergeTransactionIds,
  buildProductKey,
  type MasGroupable,
} from '@/utils/categoryAggregation';

// ============================================================================
// Test Helpers
// ============================================================================

/** Create a test category entry */
function makeCategory(
  name: string,
  amount: number,
  percent: number,
  opts?: { count?: number; itemCount?: number; transactionIds?: Set<string> }
): MasGroupable {
  return {
    name,
    amount,
    count: opts?.count ?? 1,
    itemCount: opts?.itemCount ?? 0,
    percent,
    transactionIds: opts?.transactionIds,
  };
}

/** Factory for creating "Más" entries in tests */
const testMasFactory = (stats: {
  amount: number;
  count: number;
  itemCount: number;
  percent: number;
  categoryCount: number;
  transactionIds: Set<string>;
}): MasGroupable => ({
  name: 'Más',
  amount: stats.amount,
  count: stats.count,
  itemCount: stats.itemCount,
  percent: stats.percent,
  categoryCount: stats.categoryCount,
  transactionIds: stats.transactionIds,
});

// ============================================================================
// buildProductKey
// ============================================================================

describe('buildProductKey', () => {
  it('normalizes name and merchant to lowercase trimmed key', () => {
    expect(buildProductKey('  Apple  ', '  Walmart  ')).toBe('apple::walmart');
  });

  it('collapses multiple spaces', () => {
    expect(buildProductKey('Organic   Apple', 'Super   Market')).toBe('organic apple::super market');
  });

  it('handles empty strings with defaults', () => {
    expect(buildProductKey('', '')).toBe('unknown::unknown');
  });

  it('handles undefined-like inputs', () => {
    // The function signature takes strings, but callers often pass item.name || ''
    expect(buildProductKey('Unknown', 'unknown')).toBe('unknown::unknown');
  });
});

// ============================================================================
// mergeTransactionIds
// ============================================================================

describe('mergeTransactionIds', () => {
  it('merges Sets from multiple categories', () => {
    const cats = [
      { name: 'A', count: 2, transactionIds: new Set(['tx1', 'tx2']) },
      { name: 'B', count: 1, transactionIds: new Set(['tx2', 'tx3']) },
    ];
    const merged = mergeTransactionIds(cats);
    expect(merged.size).toBe(3);
    expect(merged).toContain('tx1');
    expect(merged).toContain('tx2');
    expect(merged).toContain('tx3');
  });

  it('deduplicates shared transaction IDs', () => {
    const cats = [
      { name: 'A', count: 1, transactionIds: new Set(['tx1']) },
      { name: 'B', count: 1, transactionIds: new Set(['tx1']) },
    ];
    expect(mergeTransactionIds(cats).size).toBe(1);
  });

  it('falls back to synthetic IDs when transactionIds is undefined', () => {
    const cats = [
      { name: 'A', count: 3, transactionIds: undefined },
    ];
    const merged = mergeTransactionIds(cats);
    expect(merged.size).toBe(3);
    expect(merged).toContain('A-0');
    expect(merged).toContain('A-1');
    expect(merged).toContain('A-2');
  });

  it('handles mix of Set and undefined', () => {
    const cats = [
      { name: 'A', count: 2, transactionIds: new Set(['tx1', 'tx2']) },
      { name: 'B', count: 1, transactionIds: undefined },
    ];
    const merged = mergeTransactionIds(cats);
    expect(merged.size).toBe(3);
  });

  it('handles empty array', () => {
    expect(mergeTransactionIds([]).size).toBe(0);
  });
});

// ============================================================================
// applyMasGrouping
// ============================================================================

describe('applyMasGrouping', () => {
  it('keeps all categories above 10% threshold', () => {
    const sorted = [
      makeCategory('Big', 500, 50),
      makeCategory('Medium', 300, 30),
      makeCategory('Small', 200, 20),
    ];
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    expect(result.displayCategories).toHaveLength(3);
    expect(result.otroCategories).toHaveLength(0);
  });

  it('shows first category below 10% threshold', () => {
    const sorted = [
      makeCategory('Big', 800, 80),
      makeCategory('Small1', 80, 8),
      makeCategory('Small2', 70, 7),
      makeCategory('Small3', 50, 5),
    ];
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    // Big (80%) + Small1 (8%, first below) + "Más" (Small2+Small3)
    expect(result.displayCategories).toHaveLength(3);
    expect(result.displayCategories[0].name).toBe('Big');
    expect(result.displayCategories[1].name).toBe('Small1');
    expect(result.displayCategories[2].name).toBe('Más');
  });

  it('shows single remaining category directly instead of "Más"', () => {
    const sorted = [
      makeCategory('Big', 800, 80),
      makeCategory('Small1', 120, 12),
      makeCategory('Small2', 80, 8),
    ];
    // Big (80%) above, Small1 (12%) above, Small2 (8%) is first below
    // No remaining → no "Más"
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    expect(result.displayCategories).toHaveLength(3);
    expect(result.displayCategories.every(c => c.name !== 'Más')).toBe(true);
  });

  it('shows single remaining directly when only 1 would go to "Más"', () => {
    const sorted = [
      makeCategory('Big', 700, 70),
      makeCategory('Med', 150, 15),
      makeCategory('Small1', 90, 9),
      makeCategory('Small2', 60, 6),
    ];
    // Big + Med above 10%, Small1 is first below, Small2 is the only remaining
    // Since exactly 1 remaining, show directly
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    expect(result.displayCategories).toHaveLength(4);
    expect(result.displayCategories.every(c => c.name !== 'Más')).toBe(true);
  });

  it('aggregates "Más" group correctly', () => {
    const sorted = [
      makeCategory('Big', 700, 70, { count: 10, itemCount: 20, transactionIds: new Set(['t1', 't2']) }),
      makeCategory('Small1', 90, 9, { count: 5, itemCount: 8, transactionIds: new Set(['t3', 't4']) }),
      makeCategory('Small2', 60, 6, { count: 3, itemCount: 5, transactionIds: new Set(['t5']) }),
      makeCategory('Small3', 50, 5, { count: 2, itemCount: 3, transactionIds: new Set(['t6']) }),
    ];
    const result = applyMasGrouping(sorted, 1000, testMasFactory);

    const mas = result.displayCategories.find(c => c.name === 'Más');
    expect(mas).toBeDefined();
    // Small2 (60) + Small3 (50) = 110
    expect(mas!.amount).toBe(110);
    // 5 + 3 = 8 item count
    expect(mas!.itemCount).toBe(8);
    // transactionIds merged: t5, t6 = 2 unique
    expect(mas!.count).toBe(2);
    expect((mas as MasGroupable & { categoryCount?: number }).categoryCount).toBe(2);
  });

  it('calculates percent for "Más" group', () => {
    const sorted = [
      makeCategory('Big', 800, 80),
      makeCategory('Small1', 80, 8),
      makeCategory('Small2', 70, 7),
      makeCategory('Small3', 50, 5),
    ];
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    const mas = result.displayCategories.find(c => c.name === 'Más');
    // (70 + 50) / 1000 * 100 = 12%
    expect(mas!.percent).toBe(12);
  });

  it('returns otroCategories for expansion reference', () => {
    const sorted = [
      makeCategory('Big', 800, 80),
      makeCategory('Small1', 80, 8),
      makeCategory('Small2', 70, 7),
      makeCategory('Small3', 50, 5),
    ];
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    expect(result.otroCategories).toHaveLength(2);
    expect(result.otroCategories[0].name).toBe('Small2');
    expect(result.otroCategories[1].name).toBe('Small3');
  });

  it('excludes existing "Más" entries from threshold check', () => {
    const sorted = [
      makeCategory('Big', 800, 80),
      makeCategory('Más', 100, 10), // pre-existing aggregated group
      makeCategory('Small1', 60, 6),
      makeCategory('Small2', 40, 4),
    ];
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    // "Más" from input should be excluded from above/below threshold logic
    const displayNames = result.displayCategories.map(c => c.name);
    expect(displayNames).toContain('Big');
    expect(displayNames).toContain('Small1');
  });

  it('handles empty array', () => {
    const result = applyMasGrouping([], 0, testMasFactory);
    expect(result.displayCategories).toHaveLength(0);
    expect(result.otroCategories).toHaveLength(0);
  });

  it('handles all categories below 10%', () => {
    const sorted = [
      makeCategory('A', 50, 5),
      makeCategory('B', 30, 3),
      makeCategory('C', 20, 2),
    ];
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    // A is first below threshold, B+C go to "Más"
    expect(result.displayCategories).toHaveLength(2);
    expect(result.displayCategories[0].name).toBe('A');
    expect(result.displayCategories[1].name).toBe('Más');
  });

  it('handles single category', () => {
    const sorted = [makeCategory('Only', 1000, 100)];
    const result = applyMasGrouping(sorted, 1000, testMasFactory);
    expect(result.displayCategories).toHaveLength(1);
    expect(result.otroCategories).toHaveLength(0);
  });
});

// ============================================================================
// applyTreemapGrouping
// ============================================================================

describe('applyTreemapGrouping', () => {
  it('returns empty result for empty input', () => {
    const result = applyTreemapGrouping([], 0, testMasFactory);
    expect(result.displayCategories).toHaveLength(0);
    expect(result.canExpand).toBe(false);
    expect(result.canCollapse).toBe(false);
  });

  it('applies same threshold logic as applyMasGrouping', () => {
    const categories = [
      makeCategory('Big', 800, 80),
      makeCategory('Small1', 80, 8),
      makeCategory('Small2', 70, 7),
      makeCategory('Small3', 50, 5),
    ];
    const result = applyTreemapGrouping(categories, 0, testMasFactory);
    expect(result.displayCategories).toHaveLength(3); // Big + Small1 + Más
    expect(result.displayCategories[2].name).toBe('Más');
    expect(result.canExpand).toBe(true);
    expect(result.canCollapse).toBe(false);
  });

  it('reveals expanded categories from "Más"', () => {
    const categories = [
      makeCategory('Big', 800, 80),
      makeCategory('Small1', 80, 8),
      makeCategory('Small2', 70, 7),
      makeCategory('Small3', 50, 5),
    ];
    const result = applyTreemapGrouping(categories, 1, testMasFactory);
    // Big + Small1 + Small2 (expanded) + Small3 (only 1 left → shown directly)
    expect(result.displayCategories).toHaveLength(4);
    expect(result.displayCategories.every(c => c.name !== 'Más')).toBe(true);
    expect(result.canExpand).toBe(false); // only 1 was left, shown directly
    expect(result.canCollapse).toBe(true);
  });

  it('handles expandedCount beyond available categories', () => {
    const categories = [
      makeCategory('Big', 800, 80),
      makeCategory('Small1', 80, 8),
      makeCategory('Small2', 70, 7),
      makeCategory('Small3', 50, 5),
    ];
    const result = applyTreemapGrouping(categories, 10, testMasFactory);
    // All categories shown
    expect(result.displayCategories).toHaveLength(4);
    expect(result.canExpand).toBe(false);
    expect(result.canCollapse).toBe(true);
  });

  it('calculates correct "Más" amount from remaining after expansion', () => {
    const categories = [
      makeCategory('Big', 500, 50),
      makeCategory('Small1', 90, 9),
      makeCategory('Small2', 80, 8),
      makeCategory('Small3', 70, 7),
      makeCategory('Small4', 60, 6),
    ];
    // expandedCount=1: Small2 is expanded, Small3+Small4 go to "Más"
    const result = applyTreemapGrouping(categories, 1, testMasFactory);
    const mas = result.displayCategories.find(c => c.name === 'Más');
    expect(mas).toBeDefined();
    expect(mas!.amount).toBe(130); // 70 + 60
  });
});
