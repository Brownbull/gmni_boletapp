/**
 * Total Validation Tests
 *
 * Tests for the total validation utility that detects OCR errors
 * where the extracted total doesn't match the sum of items.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateItemsSum,
  calculateDiscrepancy,
  validateTotal,
  needsTotalValidation,
  TOTAL_DISCREPANCY_THRESHOLD,
} from '@features/scan/utils/totalValidation';
import { Transaction, TransactionItem } from '../../../src/types/transaction';

// Helper to create a minimal transaction
function createTransaction(
  total: number,
  items: Array<{ name: string; price: number; qty?: number }>
): Transaction {
  return {
    date: '2026-01-07',
    merchant: 'Test Store',
    category: 'Supermarket',
    total,
    items: items.map((item) => ({
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
  };
}

describe('calculateItemsSum', () => {
  it('calculates sum correctly for items with default quantity', () => {
    const items: TransactionItem[] = [
      { name: 'Item 1', price: 1000 },
      { name: 'Item 2', price: 2000 },
      { name: 'Item 3', price: 3000 },
    ];
    expect(calculateItemsSum(items)).toBe(6000);
  });

  it('calculates sum correctly for items with explicit quantities (price is line total)', () => {
    // NOTE: AI returns price as line total (already multiplied by qty)
    // So 2 items at $500/each = $1000 line total
    // And 3 items at $500/each = $1500 line total
    const items: TransactionItem[] = [
      { name: 'Item 1', price: 1000, qty: 2 }, // $1000 is the line total
      { name: 'Item 2', price: 1500, qty: 3 }, // $1500 is the line total
    ];
    expect(calculateItemsSum(items)).toBe(2500); // Sum of line totals: 1000 + 1500
  });

  it('handles empty items array', () => {
    expect(calculateItemsSum([])).toBe(0);
  });

  it('handles null/undefined items', () => {
    expect(calculateItemsSum(null as any)).toBe(0);
    expect(calculateItemsSum(undefined as any)).toBe(0);
  });

  it('ignores qty when summing (price is already line total)', () => {
    // qty is informational only - price is the line total
    const items: TransactionItem[] = [{ name: 'Item', price: 1000, qty: 0 }];
    expect(calculateItemsSum(items)).toBe(1000);
  });

  it('handles negative prices gracefully', () => {
    const items: TransactionItem[] = [
      { name: 'Item', price: 1000 },
      { name: 'Discount', price: -200 },
    ];
    expect(calculateItemsSum(items)).toBe(800);
  });
});

describe('calculateDiscrepancy', () => {
  it('returns 0 for equal values', () => {
    expect(calculateDiscrepancy(1000, 1000)).toBe(0);
  });

  it('calculates discrepancy correctly when total is higher', () => {
    // 1200 vs 1000 = 200 difference / 1200 max = 0.1667
    const result = calculateDiscrepancy(1200, 1000);
    expect(result).toBeCloseTo(0.167, 2);
  });

  it('calculates discrepancy correctly when items sum is higher', () => {
    // 1000 vs 1500 = 500 difference / 1500 max = 0.333
    const result = calculateDiscrepancy(1000, 1500);
    expect(result).toBeCloseTo(0.333, 2);
  });

  it('handles 10x difference (missing digit scenario)', () => {
    // 10205 vs 102052 = ~0.9 discrepancy
    const result = calculateDiscrepancy(10205, 102052);
    expect(result).toBeCloseTo(0.9, 1);
  });

  it('handles zero values', () => {
    expect(calculateDiscrepancy(0, 0)).toBe(0);
    expect(calculateDiscrepancy(100, 0)).toBe(1); // 100% discrepancy
    expect(calculateDiscrepancy(0, 100)).toBe(1); // 100% discrepancy
  });
});

describe('validateTotal', () => {
  it('returns valid for matching total and items sum', () => {
    const transaction = createTransaction(6000, [
      { name: 'Item 1', price: 2000 },
      { name: 'Item 2', price: 4000 },
    ]);

    const result = validateTotal(transaction);

    expect(result.isValid).toBe(true);
    expect(result.extractedTotal).toBe(6000);
    expect(result.itemsSum).toBe(6000);
    expect(result.discrepancy).toBe(0);
    expect(result.errorType).toBe('none');
    expect(result.suggestedTotal).toBeNull();
  });

  it('returns valid for small discrepancy (within 40%)', () => {
    // 5000 total but items sum to 6000 = 17% discrepancy (valid)
    const transaction = createTransaction(5000, [
      { name: 'Item 1', price: 2000 },
      { name: 'Item 2', price: 4000 },
    ]);

    const result = validateTotal(transaction);

    expect(result.isValid).toBe(true);
    expect(result.discrepancyPercent).toBeLessThanOrEqual(40);
  });

  it('detects missing digit error (10x discrepancy)', () => {
    // Real case: super_lider receipt
    // Total extracted as 10205 but should be 102052
    const transaction = createTransaction(10205, [
      { name: 'Item 1', price: 50000 },
      { name: 'Item 2', price: 52052 },
    ]);

    const result = validateTotal(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errorType).toBe('missing_digit');
    expect(result.suggestedTotal).toBe(102052);
    expect(result.discrepancyPercent).toBeGreaterThan(40);
  });

  it('detects extra digit error (0.1x discrepancy)', () => {
    // Total extracted as 102050 but should be 10205
    const transaction = createTransaction(102050, [
      { name: 'Item 1', price: 5000 },
      { name: 'Item 2', price: 5205 },
    ]);

    const result = validateTotal(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errorType).toBe('extra_digit');
    expect(result.suggestedTotal).toBe(10205);
  });

  it('returns unknown error type for non-digit pattern discrepancy', () => {
    // 2.5x discrepancy - not a 10x digit error pattern
    // 10000 total vs 4000 items sum = 60% discrepancy, ratio 0.4 (outside 0.05-0.2 and 5-20)
    const transaction = createTransaction(10000, [
      { name: 'Item 1', price: 2000 },
      { name: 'Item 2', price: 2000 },
    ]);

    const result = validateTotal(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errorType).toBe('unknown');
    expect(result.suggestedTotal).toBe(4000); // suggests items sum
  });

  it('handles transaction with quantities (price is line total)', () => {
    // AI returns price as line total, qty is just informational
    const transaction = createTransaction(10000, [
      { name: 'Item 1', price: 5000, qty: 2 }, // $5000 line total (2 × $2500)
      { name: 'Item 2', price: 5000, qty: 1 }, // $5000 line total
    ]);

    const result = validateTotal(transaction);

    expect(result.isValid).toBe(true);
    expect(result.itemsSum).toBe(10000); // Sum of line totals: 5000 + 5000
  });
});

describe('needsTotalValidation', () => {
  it('returns false for matching totals', () => {
    const transaction = createTransaction(6000, [
      { name: 'Item 1', price: 3000 },
      { name: 'Item 2', price: 3000 },
    ]);

    expect(needsTotalValidation(transaction)).toBe(false);
  });

  it('returns false for small discrepancy', () => {
    const transaction = createTransaction(5500, [
      { name: 'Item 1', price: 3000 },
      { name: 'Item 2', price: 3000 },
    ]);

    expect(needsTotalValidation(transaction)).toBe(false);
  });

  it('returns true for large discrepancy', () => {
    const transaction = createTransaction(10205, [
      { name: 'Item 1', price: 50000 },
      { name: 'Item 2', price: 52052 },
    ]);

    expect(needsTotalValidation(transaction)).toBe(true);
  });
});

describe('TOTAL_DISCREPANCY_THRESHOLD', () => {
  it('is set to 40%', () => {
    expect(TOTAL_DISCREPANCY_THRESHOLD).toBe(0.4);
  });
});

describe('super_lider receipt scenario', () => {
  it('correctly identifies the missing digit in the real receipt', () => {
    // This is the actual scenario from the super_lider.expected.json
    // AI extracted total: 10205 (missing last digit, should be ~102,052)
    // NOTE: prices are LINE TOTALS (already multiplied by qty)
    const transaction = createTransaction(10205, [
      { name: 'SUPER8 HALLO', price: 1890 },
      { name: 'PAN CIA RUST', price: 3125 },
      { name: 'GALL DONUTS ORANGE', price: 3960, qty: 2 },  // Line total for 2 items
      { name: 'GALL DONUTS COCO', price: 8910, qty: 3 },    // Line total for 3 items
      { name: 'PACK SALSA T', price: 3890 },
      { name: 'PAN DULCE', price: 2390 },
      { name: 'PIZZA JAMON', price: 7250 },
      { name: 'R CEBOLLIN GRANEL', price: 3560, qty: 2 },   // Line total for 2 items
      { name: 'JAMON ACARA', price: 2693 },
      { name: 'V POSTA NECRA ESCA', price: 25560, qty: 2 }, // Line total for 2 items
      { name: 'NATUR MAIZ N', price: 430 },
      { name: 'NIK BLCK', price: 1490 },
      { name: 'PLATANO', price: 3844 },
      { name: 'QUESO RALLADO SOBR', price: 28640, qty: 4 }, // Line total for 4 items
      { name: 'PIMIENTO VERDE 2UN', price: 4760, qty: 2 },  // Line total for 2 items
      { name: 'PATO DISCO F', price: 4190 },
      { name: 'ROLLITOS ACE', price: 1790 },
      { name: 'MANZ VERDE', price: 1890 },
      { name: 'LYSO 2X495', price: 7490 },
      { name: 'CEPILLO WC', price: 10200, qty: 2 },         // Line total for 2 items
      { name: 'SDY EXTRA FRESH 90', price: 21160, qty: 2 }, // Line total for 2 items
      { name: 'ESPONJA ACAN', price: 2150 },
      { name: 'PAPEL HIG', price: 12690 },
      { name: 'CONFORT X12', price: 10750 },
      { name: 'KINDER BUENO', price: 2190 },
    ]);

    const result = validateTotal(transaction);

    // Calculate what the items sum should be (sum of line totals)
    const expectedItemsSum = calculateItemsSum(transaction.items);
    // Sum = 1890+3125+3960+8910+3890+2390+7250+3560+2693+25560+430+1490+3844+28640+4760+4190+1790+1890+7490+10200+21160+2150+12690+10750+2190 = 176,892

    expect(result.isValid).toBe(false);
    expect(result.extractedTotal).toBe(10205);
    expect(result.itemsSum).toBe(expectedItemsSum);
    expect(result.errorType).toBe('missing_digit');
    expect(result.suggestedTotal).toBe(expectedItemsSum);
    expect(result.discrepancyPercent).toBeGreaterThan(40);
  });
});
