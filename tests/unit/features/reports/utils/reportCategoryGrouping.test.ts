/**
 * Tests for Report Category Grouping — Edge Cases
 *
 * Story TD-15b-14: trendPercent reverse-calculation guards
 * Verifies no Infinity/NaN propagation in group-level trend output.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CategoryBreakdown } from '@/types/report';
import {
  groupCategoriesByStoreGroup,
  groupItemsByItemCategory,
} from '@features/reports/utils/reportUtils';
import { formatCategoryName } from '@features/reports/utils/reportCategoryGrouping';
import { translateStoreCategory } from '@/utils/categoryTranslations';
import type { StoreCategory } from '../../../../../shared/schema/categories';
import type { Transaction } from '@/types/transaction';
import type { Language } from '@/utils/translations';

// TD-17-2: Mock getSettingsState for locale-aware grouping tests
let mockLang: Language = 'es';
vi.mock('@shared/stores/useSettingsStore', () => ({
  getSettingsState: () => ({ lang: mockLang }),
  useSettingsStore: { getState: () => ({ lang: mockLang }) },
}));

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
// TD-17-2: groupCategoriesByStoreGroup — i18n count labels
// ============================================================================

describe('groupCategoriesByStoreGroup — i18n count labels (TD-17-2)', () => {
  beforeEach(() => {
    mockLang = 'es';
  });

  it('should use translated purchase singular in Spanish', () => {
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({ transactionCount: 1 }),
    ];
    const groups = groupCategoriesByStoreGroup(categories);
    const cat = groups[0].categories[0];
    expect(cat.count).toBe('1 compra');
  });

  it('should use translated purchase plural in Spanish', () => {
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({ transactionCount: 3 }),
    ];
    const groups = groupCategoriesByStoreGroup(categories);
    const cat = groups[0].categories[0];
    expect(cat.count).toBe('3 compras');
  });

  it('should use English purchase labels when lang=en', () => {
    mockLang = 'en';
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({ transactionCount: 1 }),
    ];
    const groups = groupCategoriesByStoreGroup(categories);
    const cat = groups[0].categories[0];
    expect(cat.count).toBe('1 purchase');
  });

  it('should use English purchase plural when lang=en', () => {
    mockLang = 'en';
    const categories: CategoryBreakdown[] = [
      makeCategoryBreakdown({ transactionCount: 5 }),
    ];
    const groups = groupCategoriesByStoreGroup(categories);
    const cat = groups[0].categories[0];
    expect(cat.count).toBe('5 purchases');
  });
});

// ============================================================================
// TD-17-2: groupItemsByItemCategory — i18n count labels
// ============================================================================

describe('groupItemsByItemCategory — i18n count labels (TD-17-2)', () => {
  beforeEach(() => {
    mockLang = 'es';
  });

  it('should use translated item singular in Spanish', () => {
    const txs: Transaction[] = [
      makeTx({ items: [{ name: 'Apple', category: 'Produce', totalPrice: 500, qty: 1 }] }),
    ];
    const groups = groupItemsByItemCategory(txs);
    const item = groups[0].items[0];
    expect(item.count).toBe('1 ítem');
  });

  it('should use translated item plural in Spanish', () => {
    const txs: Transaction[] = [
      makeTx({ items: [{ name: 'Apple', category: 'Produce', totalPrice: 500, qty: 3 }] }),
    ];
    const groups = groupItemsByItemCategory(txs);
    const item = groups[0].items[0];
    expect(item.count).toBe('3 ítems');
  });

  it('should use English item labels when lang=en', () => {
    mockLang = 'en';
    const txs: Transaction[] = [
      makeTx({ items: [{ name: 'Apple', category: 'Produce', totalPrice: 500, qty: 1 }] }),
    ];
    const groups = groupItemsByItemCategory(txs);
    const item = groups[0].items[0];
    expect(item.count).toBe('1 item');
  });

  it('should use English item plural when lang=en', () => {
    mockLang = 'en';
    const txs: Transaction[] = [
      makeTx({ items: [{ name: 'Apple', category: 'Produce', totalPrice: 500, qty: 4 }] }),
    ];
    const groups = groupItemsByItemCategory(txs);
    const item = groups[0].items[0];
    expect(item.count).toBe('4 items');
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
        items: [{ name: 'Apple', category: 'Produce', totalPrice: 100, qty: 1 }],
      }),
    ];
    // Previous period had much higher amounts → trend will be "down" with high %
    const previous: Transaction[] = [
      makeTx({
        id: 'tx-prev',
        total: 10000,
        items: [{ name: 'Apple', category: 'Produce', totalPrice: 10000, qty: 1 }],
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
        items: [{ name: 'Apple', category: 'Produce', totalPrice: 1, qty: 1 }],
      }),
    ];
    const previous: Transaction[] = [
      makeTx({
        id: 'tx-prev',
        total: 100000,
        items: [{ name: 'Apple', category: 'Produce', totalPrice: 100000, qty: 1 }],
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
        items: [{ name: 'Bread', category: 'Bakery', totalPrice: 5000, qty: 1 }],
      }),
    ];

    const groups = groupItemsByItemCategory(current, []);

    for (const group of groups) {
      expect(Number.isFinite(group.rawTotalAmount)).toBe(true);
      expect(group.trend).toBeUndefined();
    }
  });
});

// ============================================================================
// formatCategoryName — Delegation to translateStoreCategory (Story 17-4)
// ============================================================================

describe('formatCategoryName — delegates to translateStoreCategory', () => {
  beforeEach(() => {
    mockLang = 'es';
  });

  it('should delegate to translateStoreCategory for Supermarket', () => {
    const result = formatCategoryName('Supermarket' as StoreCategory);
    expect(result).toBe(translateStoreCategory('Supermarket', 'es'));
  });

  it('should delegate to translateStoreCategory for Medical (not old "Salud")', () => {
    const result = formatCategoryName('Medical' as StoreCategory);
    expect(result).toBe(translateStoreCategory('Medical', 'es'));
  });

  it('should delegate to translateStoreCategory for Restaurant (not old "Restaurantes")', () => {
    const result = formatCategoryName('Restaurant' as StoreCategory);
    expect(result).toBe(translateStoreCategory('Restaurant', 'es'));
  });

  it('should delegate to translateStoreCategory for HealthBeauty', () => {
    const result = formatCategoryName('HealthBeauty' as StoreCategory);
    expect(result).toBe(translateStoreCategory('HealthBeauty', 'es'));
  });

  it('should delegate to translateStoreCategory for ClothingStore', () => {
    const result = formatCategoryName('ClothingStore' as StoreCategory);
    expect(result).toBe(translateStoreCategory('ClothingStore', 'es'));
  });

  it('should delegate to translateStoreCategory for Other', () => {
    const result = formatCategoryName('Other' as StoreCategory);
    expect(result).toBe(translateStoreCategory('Other', 'es'));
  });

  it('should delegate to translateStoreCategory for Veterinary (not old "Veterinaria")', () => {
    const result = formatCategoryName('Veterinary' as StoreCategory);
    expect(result).toBe(translateStoreCategory('Veterinary', 'es'));
  });

  it('should delegate to translateStoreCategory for GasStation', () => {
    const result = formatCategoryName('GasStation' as StoreCategory);
    expect(result).toBe(translateStoreCategory('GasStation', 'es'));
  });

  it('should delegate to translateStoreCategory for FurnitureStore (not old "Muebles")', () => {
    const result = formatCategoryName('FurnitureStore' as StoreCategory);
    expect(result).toBe(translateStoreCategory('FurnitureStore', 'es'));
  });

  it('should fall back to original key for unknown category', () => {
    // translateStoreCategory returns original key if not found
    const result = formatCategoryName('UnknownCategory' as StoreCategory);
    expect(result).toBe('UnknownCategory');
  });

  // TD-17-2: AC-1 — explicit lang parameter
  it('should use English translation when lang=en is passed explicitly', () => {
    const result = formatCategoryName('Supermarket' as StoreCategory, 'en');
    expect(result).toBe(translateStoreCategory('Supermarket', 'en'));
  });

  it('should use Spanish translation when lang=es is passed explicitly', () => {
    const result = formatCategoryName('Restaurant' as StoreCategory, 'es');
    expect(result).toBe(translateStoreCategory('Restaurant', 'es'));
  });
});
