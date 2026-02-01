/**
 * Transaction Reconciliation Utility Tests
 *
 * Tests for reconcileItemsTotal function that reconciles item totals
 * with receipt total by adding adjustment items when needed.
 *
 * Story 14e-41: Extract reconcileItemsTotal to entity
 * Migrated from: subhandlers.test.ts
 */

import { describe, it, expect } from 'vitest';
import type { TransactionItem } from '@entities/transaction';
import { reconcileItemsTotal } from '@/entities/transaction/utils/reconciliation';

describe('reconcileItemsTotal', () => {
  // =========================================================================
  // No Discrepancy Cases
  // =========================================================================

  it('should return unchanged items when totals match', () => {
    const items: TransactionItem[] = [
      { name: 'Item 1', price: 5000, qty: 1 },
      { name: 'Item 2', price: 5000, qty: 1 },
    ];

    const result = reconcileItemsTotal(items, 10000, 'en');

    expect(result.items).toEqual(items);
    expect(result.hasDiscrepancy).toBe(false);
    expect(result.discrepancyAmount).toBe(0);
  });

  it('should allow small discrepancies (< $1)', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 9999.5, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'en');

    expect(result.items).toEqual(items);
    expect(result.hasDiscrepancy).toBe(false);
  });

  it('should handle floating point rounding correctly', () => {
    const items: TransactionItem[] = [
      { name: 'Item 1', price: 33.33, qty: 1 },
      { name: 'Item 2', price: 33.33, qty: 1 },
      { name: 'Item 3', price: 33.33, qty: 1 },
    ];

    // Total is 99.99, items sum is 99.99
    const result = reconcileItemsTotal(items, 99.99, 'en');

    expect(result.hasDiscrepancy).toBe(false);
  });

  // =========================================================================
  // Surplus Cases (Receipt > Items)
  // =========================================================================

  it('should add surplus item when receipt > items', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 8000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'en');

    expect(result.items.length).toBe(2);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyAmount).toBe(2000);

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.name).toBe('Unitemized charge');
    expect(adjustmentItem.price).toBe(2000);
  });

  it('should use Spanish translations when lang is es', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 8000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'es');

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.name).toBe('Cargo sin detallar');
  });

  // =========================================================================
  // Discount Cases (Items > Receipt)
  // =========================================================================

  it('should add discount item when items > receipt', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 12000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'en');

    expect(result.items.length).toBe(2);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyAmount).toBe(-2000);

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.name).toBe('Discount/Adjustment');
    expect(adjustmentItem.price).toBe(-2000);
  });

  it('should use Spanish discount translation for negative discrepancy', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 12000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'es');

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.name).toBe('Descuento/Ajuste');
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  it('should handle empty items array', () => {
    const result = reconcileItemsTotal([], 10000, 'en');

    expect(result.items.length).toBe(1);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.items[0].name).toBe('Unitemized charge');
    expect(result.items[0].price).toBe(10000);
  });

  it('should handle zero receipt total', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 5000, qty: 1 }];

    const result = reconcileItemsTotal(items, 0, 'en');

    expect(result.items.length).toBe(2);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyAmount).toBe(-5000);
  });

  it('should set adjustment item category to Other', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 8000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'en');

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.category).toBe('Other');
    expect(adjustmentItem.qty).toBe(1);
  });

  it('should treat non-number prices as zero', () => {
    // Items with invalid prices should be treated as 0
    const items = [
      { name: 'Valid Item', price: 5000, qty: 1 },
      { name: 'Invalid Item', price: undefined as unknown as number, qty: 1 },
      { name: 'Null Item', price: null as unknown as number, qty: 1 },
    ];

    const result = reconcileItemsTotal(items, 10000, 'en');

    // Only 5000 counted, so 5000 discrepancy
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyAmount).toBe(5000);
    expect(result.items[3].name).toBe('Unitemized charge');
  });
});
