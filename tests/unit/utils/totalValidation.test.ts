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
} from '../../../src/utils/totalValidation';
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

  it('calculates sum correctly for items with explicit quantities', () => {
    const items: TransactionItem[] = [
      { name: 'Item 1', price: 1000, qty: 2 },
      { name: 'Item 2', price: 500, qty: 3 },
    ];
    expect(calculateItemsSum(items)).toBe(3500); // 2000 + 1500
  });

  it('handles empty items array', () => {
    expect(calculateItemsSum([])).toBe(0);
  });

  it('handles null/undefined items', () => {
    expect(calculateItemsSum(null as any)).toBe(0);
    expect(calculateItemsSum(undefined as any)).toBe(0);
  });

  it('treats qty of 0 as 1 (default)', () => {
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

  it('handles transaction with quantity multipliers', () => {
    const transaction = createTransaction(10000, [
      { name: 'Item 1', price: 2500, qty: 2 }, // 5000
      { name: 'Item 2', price: 5000, qty: 1 }, // 5000
    ]);

    const result = validateTotal(transaction);

    expect(result.isValid).toBe(true);
    expect(result.itemsSum).toBe(10000);
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
    // AI extracted total: 10205
    // Items sum should be ~102,052
    const transaction = createTransaction(10205, [
      { name: 'SUPER8 HALLO', price: 1890 },
      { name: 'PAN CIA RUST', price: 3125 },
      { name: 'GALL DONUTS ORANGE', price: 1980, qty: 2 },
      { name: 'GALL DONUTS COCO', price: 2970, qty: 3 },
      { name: 'PACK SALSA T', price: 3890 },
      { name: 'PAN DULCE', price: 2390 },
      { name: 'PIZZA JAMON', price: 7250 },
      { name: 'R CEBOLLIN GRANEL', price: 1780, qty: 2 },
      { name: 'JAMON ACARA', price: 2693 },
      { name: 'V POSTA NECRA ESCA', price: 12780, qty: 2 },
      { name: 'NATUR MAIZ N', price: 430 },
      { name: 'NIK BLCK', price: 1490 },
      { name: 'PLATANO', price: 3844 },
      { name: 'QUESO RALLADO SOBR', price: 7160, qty: 4 },
      { name: 'PIMIENTO VERDE 2UN', price: 2380, qty: 2 },
      { name: 'PATO DISCO F', price: 4190 },
      { name: 'ROLLITOS ACE', price: 1790 },
      { name: 'MANZ VERDE', price: 1890 },
      { name: 'LYSO 2X495', price: 7490 },
      { name: 'CEPILLO WC', price: 5100, qty: 2 },
      { name: 'SDY EXTRA FRESH 90', price: 10580, qty: 2 },
      { name: 'ESPONJA ACAN', price: 2150 },
      { name: 'PAPEL HIG', price: 12690 },
      { name: 'CONFORT X12', price: 10750 },
      { name: 'KINDER BUENO', price: 2190 },
    ]);

    const result = validateTotal(transaction);

    // Calculate what the items sum should be
    const expectedItemsSum = calculateItemsSum(transaction.items);

    expect(result.isValid).toBe(false);
    expect(result.extractedTotal).toBe(10205);
    expect(result.itemsSum).toBe(expectedItemsSum);
    expect(result.errorType).toBe('missing_digit');
    expect(result.suggestedTotal).toBe(expectedItemsSum);
    expect(result.discrepancyPercent).toBeGreaterThan(40);
  });
});
