/**
 * Tests for itemPriceDerivation utility
 * Story 18-8: Item Price Extraction — unitPrice, Quantity, and Total Accuracy
 */
import { describe, it, expect } from 'vitest';
import {
  deriveItemPrices,
  deriveItemsPrices,
  validateItemPriceConsistency,
  PRICE_TOLERANCE,
} from '@entities/transaction/utils/itemPriceDerivation';
import type { TransactionItem } from '@/types/transaction';

function makeItem(overrides: Partial<TransactionItem> = {}): TransactionItem {
  return { name: 'Test Item', totalPrice: 0, ...overrides };
}

describe('deriveItemPrices', () => {
  describe('qty defaults', () => {
    it('defaults qty to 1 when absent', () => {
      const item = makeItem({ totalPrice: 5000 });
      const result = deriveItemPrices(item);
      expect(result.qty).toBe(1);
    });

    it('defaults qty to 1 when 0', () => {
      const item = makeItem({ totalPrice: 5000, qty: 0 });
      const result = deriveItemPrices(item);
      expect(result.qty).toBe(1);
    });

    it('preserves existing qty', () => {
      const item = makeItem({ totalPrice: 8000, qty: 4 });
      const result = deriveItemPrices(item);
      expect(result.qty).toBe(4);
    });
  });

  describe('AC-3: qty absent → unitPrice = totalPrice', () => {
    it('sets unitPrice = totalPrice when qty absent', () => {
      const item = makeItem({ totalPrice: 5000 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(5000);
      expect(result.totalPrice).toBe(5000);
    });

    it('sets unitPrice = totalPrice when qty is 1', () => {
      const item = makeItem({ totalPrice: 1290, qty: 1 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(1290);
      expect(result.totalPrice).toBe(1290);
    });
  });

  describe('AC-2: both present and consistent', () => {
    it('keeps both values when consistent (exact match)', () => {
      const item = makeItem({ totalPrice: 8000, unitPrice: 2000, qty: 4 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(2000);
      expect(result.totalPrice).toBe(8000);
      expect(result.qty).toBe(4);
    });

    it('keeps both values when within 5% tolerance', () => {
      // unitPrice * qty = 2000 * 4 = 8000, totalPrice = 8300
      // deviation = |8000 - 8300| / 8300 = 0.036 = 3.6% < 5%
      const item = makeItem({ totalPrice: 8300, unitPrice: 2000, qty: 4 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(2000);
      expect(result.totalPrice).toBe(8300);
    });
  });

  describe('AC-2: both present but inconsistent → trust totalPrice', () => {
    it('recalculates unitPrice when deviation exceeds tolerance', () => {
      // unitPrice * qty = 2000 * 4 = 8000, totalPrice = 10000
      // deviation = |8000 - 10000| / 10000 = 0.2 = 20% > 5%
      const item = makeItem({ totalPrice: 10000, unitPrice: 2000, qty: 4 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(2500); // 10000 / 4
      expect(result.totalPrice).toBe(10000);
    });
  });

  describe('only totalPrice + qty > 1 → derive unitPrice', () => {
    it('derives unitPrice from totalPrice / qty', () => {
      const item = makeItem({ totalPrice: 8000, qty: 4 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(2000);
      expect(result.totalPrice).toBe(8000);
    });

    it('rounds unitPrice for CLP integer division', () => {
      // 10000 / 3 = 3333.33... → 3333
      const item = makeItem({ totalPrice: 10000, qty: 3 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(Math.round(10000 / 3));
    });
  });

  describe('only unitPrice + qty → derive totalPrice', () => {
    it('derives totalPrice from unitPrice * qty', () => {
      const item = makeItem({ totalPrice: 0, unitPrice: 2000, qty: 4 });
      const result = deriveItemPrices(item);
      expect(result.totalPrice).toBe(8000);
      expect(result.unitPrice).toBe(2000);
    });
  });

  describe('edge cases', () => {
    it('handles zero totalPrice and zero unitPrice', () => {
      const item = makeItem({ totalPrice: 0, unitPrice: 0 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(0);
      expect(result.totalPrice).toBe(0);
    });

    it('handles undefined unitPrice (backward compat)', () => {
      const item = makeItem({ totalPrice: 5000 });
      expect(item.unitPrice).toBeUndefined();
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(5000);
    });

    it('preserves non-price fields', () => {
      const item = makeItem({
        name: 'Manteca',
        totalPrice: 8000,
        qty: 4,
        category: 'DairyEggs',
        subcategory: 'Butter',
      });
      const result = deriveItemPrices(item);
      expect(result.name).toBe('Manteca');
      expect(result.category).toBe('DairyEggs');
      expect(result.subcategory).toBe('Butter');
    });

    it('handles fractional qty', () => {
      // 1.5 kg at some unit price
      const item = makeItem({ totalPrice: 3000, qty: 1.5 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(2000); // 3000 / 1.5
    });
  });

  // TD-18-14: Decimal qty scenarios (weight-based items)
  describe('decimal qty (TD-18-14)', () => {
    it('AC-6: derives unitPrice from decimal qty', () => {
      // 0.633 kg at $4,999 → unitPrice = Math.round(4999 / 0.633) = 7899
      const item = makeItem({ totalPrice: 4999, qty: 0.633 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(Math.round(4999 / 0.633));
    });

    it('AC-7: unitPrice is integer for CLP', () => {
      const item = makeItem({ totalPrice: 5000, qty: 0.633 });
      const result = deriveItemPrices(item);
      expect(Number.isInteger(result.unitPrice)).toBe(true);
      expect(result.unitPrice).toBe(7899); // Math.round(5000 / 0.633)
    });

    it('AC-8: handles very small qty (0.001)', () => {
      const item = makeItem({ totalPrice: 100, qty: 0.001 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(100000); // 100 / 0.001
    });

    it('derives totalPrice from unitPrice * decimal qty', () => {
      const item = makeItem({ totalPrice: 0, unitPrice: 2000, qty: 0.5 });
      const result = deriveItemPrices(item);
      expect(result.totalPrice).toBe(1000); // Math.round(2000 * 0.5)
    });

    it('handles 3-decimal-place qty', () => {
      const item = makeItem({ totalPrice: 7899, qty: 0.633 });
      const result = deriveItemPrices(item);
      expect(result.qty).toBe(0.633);
      expect(result.unitPrice).toBe(Math.round(7899 / 0.633));
    });

    it('recalculates unitPrice when inconsistent with decimal qty', () => {
      // unitPrice * qty = 5000 * 0.5 = 2500, totalPrice = 3000, deviation = 16.7% > 5%
      const item = makeItem({ totalPrice: 3000, unitPrice: 5000, qty: 0.5 });
      const result = deriveItemPrices(item);
      expect(result.unitPrice).toBe(6000); // recalculated: 3000 / 0.5
    });
  });
});

describe('deriveItemsPrices', () => {
  it('processes array of items', () => {
    const items: TransactionItem[] = [
      makeItem({ totalPrice: 8000, qty: 4 }),
      makeItem({ totalPrice: 1290, qty: 1 }),
      makeItem({ totalPrice: 3000 }),
    ];
    const results = deriveItemsPrices(items);
    expect(results).toHaveLength(3);
    expect(results[0].unitPrice).toBe(2000);
    expect(results[1].unitPrice).toBe(1290);
    expect(results[2].unitPrice).toBe(3000);
  });

  it('handles empty array', () => {
    expect(deriveItemsPrices([])).toEqual([]);
  });
});

describe('validateItemPriceConsistency', () => {
  it('returns consistent for matching values', () => {
    const item = makeItem({ totalPrice: 8000, unitPrice: 2000, qty: 4 });
    const result = validateItemPriceConsistency(item);
    expect(result.isConsistent).toBe(true);
    expect(result.deviation).toBe(0);
  });

  it('returns consistent within tolerance', () => {
    // 2000 * 4 = 8000 vs 8300 → 3.6%
    const item = makeItem({ totalPrice: 8300, unitPrice: 2000, qty: 4 });
    const result = validateItemPriceConsistency(item);
    expect(result.isConsistent).toBe(true);
    expect(result.deviation).toBeLessThan(PRICE_TOLERANCE);
  });

  it('returns inconsistent beyond tolerance', () => {
    // 2000 * 4 = 8000 vs 10000 → 20%
    const item = makeItem({ totalPrice: 10000, unitPrice: 2000, qty: 4 });
    const result = validateItemPriceConsistency(item);
    expect(result.isConsistent).toBe(false);
    expect(result.deviation).toBeGreaterThan(PRICE_TOLERANCE);
  });

  it('returns consistent when unitPrice missing', () => {
    const item = makeItem({ totalPrice: 5000 });
    const result = validateItemPriceConsistency(item);
    expect(result.isConsistent).toBe(true);
    expect(result.deviation).toBe(0);
  });

  it('handles boundary exactly at tolerance', () => {
    // exactly 5%: unitPrice * qty = 9500, totalPrice = 10000
    // deviation = |9500 - 10000| / 10000 = 0.05
    const item = makeItem({ totalPrice: 10000, unitPrice: 2375, qty: 4 });
    const result = validateItemPriceConsistency(item);
    // At exactly 5%, should be consistent (<=)
    expect(result.isConsistent).toBe(true);
  });
});
