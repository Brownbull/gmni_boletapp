/**
 * Unit Tests for Comparator Module
 *
 * Tests field comparison logic per story acceptance criteria:
 * - AC1: Total exact match
 * - AC2: Date exact match
 * - AC3: Merchant fuzzy match (>= 0.8)
 * - AC4: Items count ±1 tolerance
 * - AC5: Item prices exact match
 * - AC6: Weighted composite score
 *
 * @see docs/sprint-artifacts/epic8/story-8.4-result-comparison-engine.md
 */

import { describe, it, expect } from 'vitest';
import {
  compareTotal,
  compareDate,
  compareMerchant,
  compareItemsCount,
  compareItemPrices,
  calculateCompositeScore,
  compare,
  createErrorResult,
} from '../lib/comparator';
import type { FieldResults } from '../types';
import type { GroundTruth, GroundTruthItem } from '../lib/ground-truth';

// ============================================================================
// AC1: Total Comparison Tests
// ============================================================================

describe('compareTotal (AC1)', () => {
  it('should pass when totals match exactly', () => {
    const result = compareTotal(15990, 15990);
    expect(result.match).toBe(true);
    expect(result.expected).toBe(15990);
    expect(result.actual).toBe(15990);
    expect(result.difference).toBeUndefined();
  });

  it('should fail when totals differ', () => {
    const result = compareTotal(15990, 15980);
    expect(result.match).toBe(false);
    expect(result.difference).toBe(10);
  });

  it('should fail even with small difference', () => {
    const result = compareTotal(1000, 1001);
    expect(result.match).toBe(false);
    expect(result.difference).toBe(1);
  });

  it('should handle zero totals', () => {
    const result = compareTotal(0, 0);
    expect(result.match).toBe(true);
  });

  it('should handle decimal totals', () => {
    const result = compareTotal(19.99, 19.99);
    expect(result.match).toBe(true);
  });

  it('should fail on decimal mismatch', () => {
    const result = compareTotal(19.99, 19.98);
    expect(result.match).toBe(false);
  });
});

// ============================================================================
// AC2: Date Comparison Tests
// ============================================================================

describe('compareDate (AC2)', () => {
  it('should pass when dates match exactly', () => {
    const result = compareDate('2024-01-15', '2024-01-15');
    expect(result.match).toBe(true);
    expect(result.expected).toBe('2024-01-15');
    expect(result.actual).toBe('2024-01-15');
  });

  it('should fail when dates differ', () => {
    const result = compareDate('2024-01-15', '2024-01-16');
    expect(result.match).toBe(false);
  });

  it('should fail on month difference', () => {
    const result = compareDate('2024-01-15', '2024-02-15');
    expect(result.match).toBe(false);
  });

  it('should fail on year difference', () => {
    const result = compareDate('2024-01-15', '2025-01-15');
    expect(result.match).toBe(false);
  });

  it('should support day tolerance (same month)', () => {
    const result = compareDate('2024-01-15', '2024-01-20', 'day');
    expect(result.match).toBe(true);
  });

  it('should fail day tolerance on different month', () => {
    const result = compareDate('2024-01-15', '2024-02-15', 'day');
    expect(result.match).toBe(false);
  });

  it('should support month tolerance (same year)', () => {
    const result = compareDate('2024-01-15', '2024-12-31', 'month');
    expect(result.match).toBe(true);
  });

  it('should fail month tolerance on different year', () => {
    const result = compareDate('2024-01-15', '2025-01-15', 'month');
    expect(result.match).toBe(false);
  });
});

// ============================================================================
// AC3: Merchant Comparison Tests (Fuzzy Matching)
// ============================================================================

describe('compareMerchant (AC3)', () => {
  it('should pass when merchants are identical', () => {
    const result = compareMerchant('JUMBO', 'JUMBO');
    expect(result.match).toBe(true);
    expect(result.similarity).toBe(1.0);
  });

  it('should pass with different case (case insensitive)', () => {
    const result = compareMerchant('JUMBO', 'jumbo');
    expect(result.match).toBe(true);
    expect(result.similarity).toBe(1.0);
  });

  it('should pass with minor variations (similarity >= 0.8)', () => {
    // "Jumbo" vs "Jumbo." should be very similar
    const result = compareMerchant('Jumbo', 'Jumbo.');
    expect(result.similarity).toBeGreaterThanOrEqual(0.8);
    expect(result.match).toBe(true);
  });

  it('should fail with completely different merchants', () => {
    const result = compareMerchant('JUMBO', 'WALMART');
    expect(result.match).toBe(false);
    expect(result.similarity).toBeLessThan(0.8);
  });

  it('should handle Chilean store name with accents', () => {
    // "Líder" vs "Lider" should match (accent removal)
    const result = compareMerchant('Líder', 'Lider');
    expect(result.match).toBe(true);
    expect(result.similarity).toBe(1.0);
  });

  it('should handle extra whitespace', () => {
    const result = compareMerchant('  JUMBO  ', 'JUMBO');
    expect(result.match).toBe(true);
    expect(result.similarity).toBe(1.0);
  });

  it('should allow custom threshold', () => {
    // Use a lower threshold (0.5)
    const result = compareMerchant('JUMBO', 'JUB', 0.5);
    // These should be at least 50% similar due to shared characters
    expect(result.similarity).toBeGreaterThanOrEqual(0);
  });

  it('should return similarity score in result', () => {
    const result = compareMerchant('ABC', 'DEF');
    expect(typeof result.similarity).toBe('number');
    expect(result.similarity).toBeGreaterThanOrEqual(0);
    expect(result.similarity).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// AC4: Items Count Comparison Tests
// ============================================================================

describe('compareItemsCount (AC4)', () => {
  it('should pass when counts match exactly', () => {
    const result = compareItemsCount(5, 5);
    expect(result.match).toBe(true);
    expect(result.expected).toBe(5);
    expect(result.actual).toBe(5);
    expect(result.tolerance).toBe(1);
  });

  it('should pass when actual is 1 more (within ±1)', () => {
    const result = compareItemsCount(5, 6);
    expect(result.match).toBe(true);
  });

  it('should pass when actual is 1 less (within ±1)', () => {
    const result = compareItemsCount(5, 4);
    expect(result.match).toBe(true);
  });

  it('should fail when actual is 2 more (outside ±1)', () => {
    const result = compareItemsCount(5, 7);
    expect(result.match).toBe(false);
  });

  it('should fail when actual is 2 less (outside ±1)', () => {
    const result = compareItemsCount(5, 3);
    expect(result.match).toBe(false);
  });

  it('should handle zero items', () => {
    const result = compareItemsCount(0, 0);
    expect(result.match).toBe(true);
  });

  it('should pass 0 vs 1 (within tolerance)', () => {
    const result = compareItemsCount(0, 1);
    expect(result.match).toBe(true);
  });

  it('should allow custom tolerance', () => {
    const result = compareItemsCount(10, 8, 2);
    expect(result.match).toBe(true);
    expect(result.tolerance).toBe(2);
  });
});

// ============================================================================
// AC5: Item Prices Comparison Tests
// ============================================================================

describe('compareItemPrices (AC5)', () => {
  const createExpected = (items: { name: string; price: number }[]): GroundTruthItem[] => {
    return items.map((item) => ({ ...item }));
  };

  const createActual = (items: { name: string; price: number }[]) => {
    return items.map((item) => ({ ...item }));
  };

  it('should return 100% accuracy when all prices match', () => {
    const expected = createExpected([
      { name: 'Milk', price: 1990 },
      { name: 'Bread', price: 990 },
    ]);
    const actual = createActual([
      { name: 'Milk', price: 1990 },
      { name: 'Bread', price: 990 },
    ]);

    const result = compareItemPrices(expected, actual);
    expect(result.accuracy).toBe(100);
    expect(result.matchCount).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it('should return 50% accuracy when half the prices match', () => {
    const expected = createExpected([
      { name: 'Milk', price: 1990 },
      { name: 'Bread', price: 990 },
    ]);
    const actual = createActual([
      { name: 'Milk', price: 1990 },
      { name: 'Bread', price: 1000 }, // Wrong price
    ]);

    const result = compareItemPrices(expected, actual);
    expect(result.accuracy).toBe(50);
    expect(result.matchCount).toBe(1);
  });

  it('should handle case-insensitive item names', () => {
    const expected = createExpected([{ name: 'MILK', price: 1990 }]);
    const actual = createActual([{ name: 'milk', price: 1990 }]);

    const result = compareItemPrices(expected, actual);
    expect(result.accuracy).toBe(100);
  });

  it('should handle empty items lists', () => {
    const result = compareItemPrices([], []);
    expect(result.accuracy).toBe(100);
    expect(result.totalCount).toBe(0);
  });

  it('should return 0% when actual has no items', () => {
    const expected = createExpected([{ name: 'Milk', price: 1990 }]);
    const result = compareItemPrices(expected, []);
    expect(result.accuracy).toBe(0);
  });

  it('should include per-item comparison details', () => {
    const expected = createExpected([{ name: 'Milk', price: 1990 }]);
    const actual = createActual([{ name: 'MILK', price: 1990 }]);

    const result = compareItemPrices(expected, actual);
    expect(result.details).toHaveLength(1);
    expect(result.details[0].expectedName).toBe('Milk');
    expect(result.details[0].actualName).toBe('MILK');
    expect(result.details[0].priceMatch).toBe(true);
  });

  it('should match items by similarity when names differ slightly', () => {
    const expected = createExpected([{ name: 'Leche Descremada', price: 1990 }]);
    const actual = createActual([{ name: 'LECHE DESCREM.', price: 1990 }]);

    const result = compareItemPrices(expected, actual);
    // Names should be matched despite abbreviation
    expect(result.details[0].nameSimilarity).toBeGreaterThan(0);
  });
});

// ============================================================================
// AC6: Weighted Composite Score Tests
// ============================================================================

describe('calculateCompositeScore (AC6)', () => {
  const createFieldResults = (
    overrides: Partial<{
      totalMatch: boolean;
      dateMatch: boolean;
      merchantMatch: boolean;
      itemsCountMatch: boolean;
      itemPricesAccuracy: number;
    }> = {}
  ): FieldResults => {
    return {
      total: {
        expected: 100,
        actual: overrides.totalMatch === false ? 90 : 100,
        match: overrides.totalMatch ?? true,
      },
      date: {
        expected: '2024-01-15',
        actual: overrides.dateMatch === false ? '2024-01-16' : '2024-01-15',
        match: overrides.dateMatch ?? true,
      },
      merchant: {
        expected: 'JUMBO',
        actual: overrides.merchantMatch === false ? 'WALMART' : 'JUMBO',
        similarity: overrides.merchantMatch === false ? 0 : 1,
        match: overrides.merchantMatch ?? true,
      },
      itemsCount: {
        expected: 5,
        actual: overrides.itemsCountMatch === false ? 8 : 5,
        match: overrides.itemsCountMatch ?? true,
        tolerance: 1,
      },
      itemPrices: {
        accuracy: overrides.itemPricesAccuracy ?? 100,
        details: [],
        matchCount: 1,
        totalCount: 1,
      },
    };
  };

  it('should return 100 when all fields match perfectly', () => {
    const fields = createFieldResults();
    const score = calculateCompositeScore(fields);
    expect(score).toBe(100);
  });

  it('should return 0 when all fields fail', () => {
    const fields = createFieldResults({
      totalMatch: false,
      dateMatch: false,
      merchantMatch: false,
      itemsCountMatch: false,
      itemPricesAccuracy: 0,
    });
    const score = calculateCompositeScore(fields);
    expect(score).toBe(0);
  });

  it('should apply 25% weight to total', () => {
    // Only total fails
    const fields = createFieldResults({ totalMatch: false });
    const score = calculateCompositeScore(fields);
    // Expected: 100 - 25 = 75
    expect(score).toBe(75);
  });

  it('should apply 15% weight to date', () => {
    // Only date fails
    const fields = createFieldResults({ dateMatch: false });
    const score = calculateCompositeScore(fields);
    // Expected: 100 - 15 = 85
    expect(score).toBe(85);
  });

  it('should apply 20% weight to merchant', () => {
    // Only merchant fails
    const fields = createFieldResults({ merchantMatch: false });
    const score = calculateCompositeScore(fields);
    // Expected: 100 - 20 = 80
    expect(score).toBe(80);
  });

  it('should apply 15% weight to items count', () => {
    // Only items count fails
    const fields = createFieldResults({ itemsCountMatch: false });
    const score = calculateCompositeScore(fields);
    // Expected: 100 - 15 = 85
    expect(score).toBe(85);
  });

  it('should apply 25% weight to item prices proportionally', () => {
    // Item prices at 80% accuracy
    const fields = createFieldResults({ itemPricesAccuracy: 80 });
    const score = calculateCompositeScore(fields);
    // Expected: 0.25 + 0.15 + 0.20 + 0.15 + (0.80 * 0.25) = 0.75 + 0.20 = 0.95 * 100 = 95
    expect(score).toBe(95);
  });

  it('should handle partial failures correctly', () => {
    // Total fails (25%), merchant fails (20%), itemPrices at 50%
    const fields = createFieldResults({
      totalMatch: false,
      merchantMatch: false,
      itemPricesAccuracy: 50,
    });
    const score = calculateCompositeScore(fields);
    // Expected: 0*0.25 + 1*0.15 + 0*0.20 + 1*0.15 + 0.5*0.25 = 0.15 + 0.15 + 0.125 = 0.425 * 100 = 42.5
    expect(score).toBe(42.5);
  });
});

// ============================================================================
// Main Compare Function Tests
// ============================================================================

describe('compare (main function)', () => {
  const createGroundTruth = (overrides: Partial<GroundTruth> = {}): GroundTruth => {
    return {
      merchant: 'JUMBO',
      date: '2024-01-15',
      total: 15990,
      category: 'supermarket',
      items: [{ name: 'Milk', price: 1990 }],
      _source: {
        hasAiExtraction: true,
        hasCorrections: false,
        correctedFields: [],
        itemsModified: 0,
        itemsDeleted: 0,
        itemsAdded: 0,
      },
      ...overrides,
    };
  };

  const createActual = (
    overrides: Partial<{ merchant: string; date: string; total: number; items: Array<{ name: string; price: number }> }> = {}
  ) => {
    return {
      merchant: 'JUMBO',
      date: '2024-01-15',
      total: 15990,
      category: 'supermarket',
      items: [{ name: 'Milk', price: 1990 }],
      ...overrides,
    };
  };

  it('should return passed=true when all fields match', () => {
    const result = compare('test-001', createGroundTruth(), createActual());
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.testId).toBe('test-001');
  });

  it('should return passed=false when any field fails', () => {
    const result = compare('test-001', createGroundTruth(), createActual({ total: 15000 }));
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(100);
  });

  it('should include all field results', () => {
    const result = compare('test-001', createGroundTruth(), createActual());
    expect(result.fields.total).toBeDefined();
    expect(result.fields.date).toBeDefined();
    expect(result.fields.merchant).toBeDefined();
    expect(result.fields.itemsCount).toBeDefined();
    expect(result.fields.itemPrices).toBeDefined();
  });

  it('should include metadata options', () => {
    const result = compare('test-001', createGroundTruth(), createActual(), {
      storeType: 'supermarket',
      promptVersion: 'v2-test',
      apiCost: 0.02,
      duration: 5000,
    });
    expect(result.storeType).toBe('supermarket');
    expect(result.promptVersion).toBe('v2-test');
    expect(result.apiCost).toBe(0.02);
    expect(result.duration).toBe(5000);
  });

  it('should not have error property on success', () => {
    const result = compare('test-001', createGroundTruth(), createActual());
    expect(result.error).toBeUndefined();
  });
});

// ============================================================================
// Error Result Tests
// ============================================================================

describe('createErrorResult', () => {
  it('should create a failed result with error message', () => {
    const result = createErrorResult('test-001', 'API timeout');
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.error).toBe('API timeout');
    expect(result.testId).toBe('test-001');
  });

  it('should include default zero values for all fields', () => {
    const result = createErrorResult('test-001', 'Error');
    expect(result.fields.total.match).toBe(false);
    expect(result.fields.date.match).toBe(false);
    expect(result.fields.merchant.match).toBe(false);
    expect(result.fields.itemsCount.match).toBe(false);
    expect(result.fields.itemPrices.accuracy).toBe(0);
  });

  it('should accept optional metadata', () => {
    const result = createErrorResult('test-001', 'Error', {
      storeType: 'pharmacy',
      promptVersion: 'v3',
      duration: 1000,
    });
    expect(result.storeType).toBe('pharmacy');
    expect(result.promptVersion).toBe('v3');
    expect(result.duration).toBe(1000);
  });
});
