/**
 * Tests for TrendsView/helpers.ts
 * Story 15-TD-4: Phase 5 extracted helper tests
 *
 * 10 exported functions covering period labels, currency formatting,
 * transaction filtering, and category data aggregation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from '@/types/transaction';
import type { TimePeriod, CurrentPeriod, CategoryData, TrendData } from '@features/analytics/views/TrendsView/types';
import { makeTx } from '../../../../views/__fixtures__/transactionFactory';
import { makeCategoryData } from '../../../../views/__fixtures__/categoryDataFactory';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/config/categoryColors', () => ({
  getCategoryPillColors: vi.fn((name: string) => ({
    bg: `${name}-bg`,
    fg: `${name}-fg`,
  })),
  getItemGroupColors: vi.fn((_group: string) => ({
    bg: 'group-bg',
    fg: 'group-fg',
  })),
  getCurrentTheme: vi.fn(() => 'light'),
  getCurrentMode: vi.fn(() => 'default'),
  ALL_ITEM_CATEGORY_GROUPS: [
    'food-fresh', 'food-packaged', 'health-personal',
    'household', 'nonfood-retail', 'services-fees', 'other-item',
  ],
  ITEM_CATEGORY_GROUPS: {
    'Frutas y Verduras': 'food-fresh',
    'Carnes y Mariscos': 'food-fresh',
    'Lácteos': 'food-packaged',
    'Bebidas': 'food-packaged',
    'Snacks': 'food-packaged',
  } as Record<string, string>,
  ITEM_CATEGORY_TO_KEY: {
    'Frutas y Verduras': 'Frutas y Verduras',
    'Carnes y Mariscos': 'Carnes y Mariscos',
    'Lácteos': 'Lácteos',
    'Bebidas': 'Bebidas',
    'Snacks': 'Snacks',
  } as Record<string, string>,
}));

vi.mock('@/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, _currency: string) => `$${amount.toLocaleString('en-US')}`),
}));

vi.mock('@/utils/categoryAggregation', () => ({
  applyTreemapGrouping: vi.fn(
    (categories: Array<{ percent: number; name: string }>, expandedCount: number) => {
      const above = categories.filter(c => c.percent > 10 && c.name !== 'Más');
      const below = categories.filter(c => c.percent <= 10 && c.name !== 'Más');
      const display = [...above];
      if (below.length > 0) display.push(below[0]);
      const expanded = below.slice(1, 1 + expandedCount);
      display.push(...expanded);
      const otro = below.slice(1 + expandedCount);
      return {
        displayCategories: display,
        otroCategories: otro,
        canExpand: otro.length > 1,
        canCollapse: expandedCount > 0,
      };
    }
  ),
  buildProductKey: vi.fn((name: string, merchant: string) =>
    `${(name || 'Unknown').toLowerCase().trim()}::${(merchant || 'unknown').toLowerCase().trim()}`
  ),
}));

vi.mock('@/utils/categoryNormalizer', () => ({
  normalizeItemCategory: vi.fn((cat: string) => cat),
}));

vi.mock('@features/analytics/utils/periodComparison', () => ({
  calculateChange: vi.fn((current: number, previous: number) => {
    if (previous === 0) return { percent: 0, direction: 'new' as const };
    const pct = Math.round(((current - previous) / previous) * 100);
    return {
      percent: Math.abs(pct),
      direction: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'same' as const,
    };
  }),
}));

import {
  MONTH_NAMES_ES,
  MONTH_NAMES_EN,
  CAROUSEL_TITLES_BASE,
  getPeriodLabel,
  formatShortCurrency,
  filterByPeriod,
  computeAllCategoryData,
  computeItemCategoryData,
  computeSubcategoryData,
  computeItemGroupsForStore,
  computeItemCategoriesInGroup,
  computeTreemapCategories,
  computeTrendCategories,
} from '@features/analytics/views/TrendsView/helpers';
import { normalizeItemCategory } from '@/utils/categoryNormalizer';
import { applyTreemapGrouping } from '@/utils/categoryAggregation';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Test Helpers
// ============================================================================

function makeTrendData(
  name: string,
  value: number,
  percent: number,
  opts?: Partial<TrendData>
): TrendData {
  return {
    name,
    value,
    count: opts?.count ?? 1,
    itemCount: opts?.itemCount ?? 0,
    color: opts?.color ?? `${name}-bg`,
    fgColor: opts?.fgColor ?? `${name}-fg`,
    percent,
    sparkline: opts?.sparkline ?? [100, 200, 300],
    change: opts?.change ?? 0,
    previousValue: opts?.previousValue ?? 0,
    changeDirection: opts?.changeDirection ?? 'same',
    ...opts,
  };
}

// ============================================================================
// Constants
// ============================================================================

describe('Constants', () => {
  it('MONTH_NAMES_ES has 12 Spanish month names', () => {
    expect(MONTH_NAMES_ES).toHaveLength(12);
    expect(MONTH_NAMES_ES[0]).toBe('Enero');
    expect(MONTH_NAMES_ES[11]).toBe('Diciembre');
  });

  it('MONTH_NAMES_EN has 12 English month names', () => {
    expect(MONTH_NAMES_EN).toHaveLength(12);
    expect(MONTH_NAMES_EN[0]).toBe('January');
    expect(MONTH_NAMES_EN[11]).toBe('December');
  });

  it('CAROUSEL_TITLES_BASE has Distribution and Tendencia', () => {
    expect(CAROUSEL_TITLES_BASE).toEqual(['Distribución', 'Tendencia']);
  });
});

// ============================================================================
// getPeriodLabel
// ============================================================================

describe('getPeriodLabel', () => {
  const current: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 2 };

  describe.each([
    { period: 'week' as TimePeriod, locale: 'es', expected: 'Semana 2, Mar 2026' },
    { period: 'week' as TimePeriod, locale: 'en', expected: 'Week 2, Mar 2026' },
    { period: 'month' as TimePeriod, locale: 'es', expected: 'Marzo 2026' },
    { period: 'month' as TimePeriod, locale: 'en', expected: 'March 2026' },
    { period: 'quarter' as TimePeriod, locale: 'es', expected: 'Q1 2026' },
    { period: 'quarter' as TimePeriod, locale: 'en', expected: 'Q1 2026' },
    { period: 'year' as TimePeriod, locale: 'es', expected: '2026' },
    { period: 'year' as TimePeriod, locale: 'en', expected: '2026' },
  ])('$period / $locale', ({ period, locale, expected }) => {
    it(`returns "${expected}"`, () => {
      expect(getPeriodLabel(period, current, locale)).toBe(expected);
    });
  });

  it('handles January (month=1) correctly', () => {
    const jan: CurrentPeriod = { year: 2025, month: 1, quarter: 1, week: 1 };
    expect(getPeriodLabel('month', jan, 'es')).toBe('Enero 2025');
    expect(getPeriodLabel('month', jan, 'en')).toBe('January 2025');
  });

  it('handles December (month=12) correctly', () => {
    const dec: CurrentPeriod = { year: 2026, month: 12, quarter: 4, week: 5 };
    expect(getPeriodLabel('month', dec, 'es')).toBe('Diciembre 2026');
  });
});

// ============================================================================
// formatShortCurrency
// ============================================================================

describe('formatShortCurrency', () => {
  it.each([
    { amount: 1500000, expected: '$1.5M' },
    { amount: 2000000, expected: '$2.0M' },
    { amount: 1000000, expected: '$1.0M' },
    { amount: 5000, expected: '$5k' },
    { amount: 1000, expected: '$1k' },
    { amount: 217000, expected: '$217k' },
    { amount: 1500, expected: '$2k' }, // Math.round(1500/1000) = 2
  ])('formats $amount as "$expected"', ({ amount, expected }) => {
    expect(formatShortCurrency(amount, 'CLP')).toBe(expected);
  });

  it('delegates to formatCurrency for amounts under 1000', () => {
    const result = formatShortCurrency(500, 'CLP');
    // formatCurrency mock returns `$500`
    expect(result).toBe('$500');
  });

  it('delegates to formatCurrency for zero', () => {
    const result = formatShortCurrency(0, 'CLP');
    expect(result).toBe('$0');
  });
});

// ============================================================================
// filterByPeriod
// ============================================================================

describe('filterByPeriod', () => {
  const transactions: Transaction[] = [
    makeTx({ date: '2026-01-05', total: 100 }), // Jan, Q1, Week 1
    makeTx({ date: '2026-01-15', total: 200 }), // Jan, Q1, Week 3
    makeTx({ date: '2026-03-20', total: 300 }), // Mar, Q1, Week 3
    makeTx({ date: '2026-04-10', total: 400 }), // Apr, Q2, Week 2
    makeTx({ date: '2026-07-01', total: 500 }), // Jul, Q3, Week 1
    makeTx({ date: '2025-01-05', total: 600 }), // Different year
  ];

  it('filters by year', () => {
    const current: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
    const result = filterByPeriod(transactions, 'year', current);
    expect(result).toHaveLength(5); // All 2026 transactions
  });

  it('filters by quarter', () => {
    const current: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
    const result = filterByPeriod(transactions, 'quarter', current);
    expect(result).toHaveLength(3); // Jan + Jan + Mar (Q1)
  });

  it('filters by month', () => {
    const current: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
    const result = filterByPeriod(transactions, 'month', current);
    expect(result).toHaveLength(2); // Two January transactions
  });

  it('filters by week within month', () => {
    const current: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
    const result = filterByPeriod(transactions, 'week', current);
    expect(result).toHaveLength(1); // Only Jan 5 (week 1)
  });

  it('excludes transactions from different years', () => {
    const current: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
    const result = filterByPeriod(transactions, 'year', current);
    expect(result.every(tx => new Date(tx.date).getFullYear() === 2026)).toBe(true);
  });

  it('returns empty array when no transactions match', () => {
    const current: CurrentPeriod = { year: 2030, month: 1, quarter: 1, week: 1 };
    const result = filterByPeriod(transactions, 'year', current);
    expect(result).toHaveLength(0);
  });

  it('handles empty transaction array', () => {
    const current: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
    const result = filterByPeriod([], 'month', current);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// computeAllCategoryData
// ============================================================================

describe('computeAllCategoryData', () => {
  it('aggregates transactions by category', () => {
    const txs: Transaction[] = [
      makeTx({ date: '2026-01-01', total: 1000, category: 'Supermercado' as Transaction['category'] }),
      makeTx({ date: '2026-01-02', total: 500, category: 'Supermercado' as Transaction['category'] }),
      makeTx({ date: '2026-01-03', total: 300, category: 'Restaurante' as Transaction['category'] }),
    ];

    const result = computeAllCategoryData(txs);
    expect(result).toHaveLength(2);
    // Sorted by value descending
    expect(result[0].name).toBe('Supermercado');
    expect(result[0].value).toBe(1500);
    expect(result[1].name).toBe('Restaurante');
    expect(result[1].value).toBe(300);
  });

  it('calculates percentages correctly', () => {
    const txs: Transaction[] = [
      makeTx({ date: '2026-01-01', total: 750, category: 'A' as Transaction['category'] }),
      makeTx({ date: '2026-01-01', total: 250, category: 'B' as Transaction['category'] }),
    ];
    const result = computeAllCategoryData(txs);
    expect(result[0].percent).toBe(75);
    expect(result[1].percent).toBe(25);
  });

  it('counts unique transactions using tx.id', () => {
    const txs: Transaction[] = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 100, category: 'A' as Transaction['category'] }),
      makeTx({ id: 'tx2', date: '2026-01-02', total: 200, category: 'A' as Transaction['category'] }),
    ];
    const result = computeAllCategoryData(txs);
    expect(result[0].count).toBe(2);
  });

  it('falls back to index-based ID when tx.id is undefined', () => {
    const txs: Transaction[] = [
      makeTx({ date: '2026-01-01', total: 100, category: 'A' as Transaction['category'] }),
      makeTx({ date: '2026-01-02', total: 200, category: 'A' as Transaction['category'] }),
    ];
    const result = computeAllCategoryData(txs);
    expect(result[0].count).toBe(2);
    expect(result[0].transactionIds).toBeDefined();
  });

  it('counts unique products via buildProductKey', () => {
    const txs: Transaction[] = [
      makeTx({
        date: '2026-01-01',
        total: 100,
        category: 'Supermercado' as Transaction['category'],
        items: [
          { name: 'Apple', price: 50 },
          { name: 'Banana', price: 50 },
        ],
      }),
    ];
    const result = computeAllCategoryData(txs);
    expect(result[0].itemCount).toBe(2);
  });

  it('defaults missing category to "Otro"', () => {
    const txs: Transaction[] = [
      makeTx({ date: '2026-01-01', total: 100, category: '' as Transaction['category'] }),
    ];
    const result = computeAllCategoryData(txs);
    expect(result[0].name).toBe('Otro');
  });

  it('sets colors from getCategoryPillColors', () => {
    const txs: Transaction[] = [
      makeTx({ date: '2026-01-01', total: 100, category: 'Supermercado' as Transaction['category'] }),
    ];
    const result = computeAllCategoryData(txs);
    expect(result[0].color).toBe('Supermercado-bg');
    expect(result[0].fgColor).toBe('Supermercado-fg');
  });

  it('returns empty array for no transactions', () => {
    expect(computeAllCategoryData([])).toHaveLength(0);
  });

  it('handles 0% when total is zero', () => {
    const txs: Transaction[] = [
      makeTx({ date: '2026-01-01', total: 0, category: 'A' as Transaction['category'] }),
    ];
    const result = computeAllCategoryData(txs);
    expect(result[0].percent).toBe(0);
  });
});

// ============================================================================
// computeItemCategoryData
// ============================================================================

describe('computeItemCategoryData', () => {
  it('aggregates by item category from line items', () => {
    const txs: Transaction[] = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 1000,
        items: [
          { name: 'Milk', price: 300, category: 'Lácteos' },
          { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
        ],
      }),
      makeTx({
        id: 'tx2',
        date: '2026-01-02',
        total: 500,
        items: [
          { name: 'Cheese', price: 500, category: 'Lácteos' },
        ],
      }),
    ];

    const result = computeItemCategoryData(txs);
    const lacteos = result.find(c => c.name === 'Lácteos');
    expect(lacteos).toBeDefined();
    expect(lacteos!.value).toBe(800); // 300 + 500
    expect(lacteos!.count).toBe(2); // 2 unique transactions
  });

  it('normalizes item categories via normalizeItemCategory', () => {
    const txs: Transaction[] = [
      makeTx({
        date: '2026-01-01',
        total: 100,
        items: [{ name: 'Item', price: 100, category: 'legacy-category' }],
      }),
    ];
    computeItemCategoryData(txs);
    expect(normalizeItemCategory).toHaveBeenCalledWith('legacy-category');
  });

  it('defaults missing item category to "Other"', () => {
    const txs: Transaction[] = [
      makeTx({
        date: '2026-01-01',
        total: 100,
        items: [{ name: 'Item', price: 100 }],
      }),
    ];
    const result = computeItemCategoryData(txs);
    expect(result[0].name).toBe('Other');
  });

  it('handles transactions with no items', () => {
    const txs: Transaction[] = [
      makeTx({ date: '2026-01-01', total: 100 }),
    ];
    const result = computeItemCategoryData(txs);
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// computeSubcategoryData
// ============================================================================

describe('computeSubcategoryData', () => {
  const txs: Transaction[] = [
    makeTx({
      id: 'tx1',
      date: '2026-01-01',
      total: 1000,
      items: [
        { name: 'Ribeye', price: 500, category: 'Carnes y Mariscos', subcategory: 'Beef' },
        { name: 'Salmon', price: 300, category: 'Carnes y Mariscos', subcategory: 'Fish' },
        { name: 'Apple', price: 200, category: 'Frutas y Verduras', subcategory: 'Fruits' },
      ],
    }),
    makeTx({
      id: 'tx2',
      date: '2026-01-02',
      total: 400,
      items: [
        { name: 'Chicken', price: 400, category: 'Carnes y Mariscos', subcategory: 'Poultry' },
      ],
    }),
  ];

  it('aggregates by subcategory', () => {
    const result = computeSubcategoryData(txs);
    expect(result.length).toBeGreaterThanOrEqual(3);
    const beef = result.find(c => c.name === 'Beef');
    expect(beef).toBeDefined();
    expect(beef!.value).toBe(500);
  });

  it('filters by item category when provided', () => {
    const result = computeSubcategoryData(txs, 'Carnes y Mariscos');
    // Should only include Beef, Fish, Poultry subcategories
    const names = result.map(c => c.name);
    expect(names).toContain('Beef');
    expect(names).toContain('Fish');
    expect(names).toContain('Poultry');
    expect(names).not.toContain('Fruits');
  });

  it('skips items without subcategory', () => {
    const txsNoSubcat: Transaction[] = [
      makeTx({
        date: '2026-01-01',
        total: 100,
        items: [{ name: 'Milk', price: 100, category: 'Lácteos' }], // no subcategory
      }),
    ];
    const result = computeSubcategoryData(txsNoSubcat);
    expect(result).toHaveLength(0);
  });

  it('returns empty for no matching filter', () => {
    const result = computeSubcategoryData(txs, 'NonExistentCategory');
    expect(result).toHaveLength(0);
  });
});

// ============================================================================
// computeItemGroupsForStore
// ============================================================================

describe('computeItemGroupsForStore', () => {
  it('filters transactions by store category and computes item groups', () => {
    const txs: Transaction[] = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 1000,
        category: 'Supermercado' as Transaction['category'],
        items: [
          { name: 'Milk', price: 300, category: 'Lácteos' },
          { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
        ],
      }),
      makeTx({
        id: 'tx2',
        date: '2026-01-02',
        total: 500,
        category: 'Restaurante' as Transaction['category'], // Different store
        items: [
          { name: 'Steak', price: 500, category: 'Carnes y Mariscos' },
        ],
      }),
    ];

    const result = computeItemGroupsForStore(txs, 'Supermercado');
    // Should only include items from Supermercado transactions
    expect(result.length).toBeGreaterThan(0);
    // Total should not include Restaurante items
    const totalValue = result.reduce((sum, g) => sum + g.value, 0);
    expect(totalValue).toBe(500); // 300 + 200
  });

  it('filters out empty groups', () => {
    const txs: Transaction[] = [
      makeTx({
        date: '2026-01-01',
        total: 100,
        category: 'Supermercado' as Transaction['category'],
        items: [{ name: 'Milk', price: 100, category: 'Lácteos' }],
      }),
    ];
    const result = computeItemGroupsForStore(txs, 'Supermercado');
    // Only groups with value > 0 should appear
    expect(result.every(g => g.value > 0)).toBe(true);
  });

  it('returns empty for non-matching store category', () => {
    const txs: Transaction[] = [
      makeTx({
        date: '2026-01-01',
        total: 100,
        category: 'Supermercado' as Transaction['category'],
        items: [{ name: 'Milk', price: 100, category: 'Lácteos' }],
      }),
    ];
    const result = computeItemGroupsForStore(txs, 'NonExistent');
    expect(result).toHaveLength(0);
  });

  it('sorts by value descending', () => {
    const txs: Transaction[] = [
      makeTx({
        date: '2026-01-01',
        total: 1000,
        category: 'Supermercado' as Transaction['category'],
        items: [
          { name: 'Milk', price: 100, category: 'Lácteos' },
          { name: 'Apple', price: 500, category: 'Frutas y Verduras' },
        ],
      }),
    ];
    const result = computeItemGroupsForStore(txs, 'Supermercado');
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].value).toBeGreaterThanOrEqual(result[i].value);
    }
  });
});

// ============================================================================
// computeItemCategoriesInGroup
// ============================================================================

describe('computeItemCategoriesInGroup', () => {
  const txs: Transaction[] = [
    makeTx({
      date: '2026-01-01',
      total: 1000,
      category: 'Supermercado' as Transaction['category'],
      items: [
        { name: 'Milk', price: 300, category: 'Lácteos' },
        { name: 'Cheese', price: 200, category: 'Lácteos' },
        { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
        { name: 'Steak', price: 300, category: 'Carnes y Mariscos' },
      ],
    }),
  ];

  it('returns item categories belonging to the specified group', () => {
    // 'food-fresh' group contains 'Frutas y Verduras' and 'Carnes y Mariscos'
    const result = computeItemCategoriesInGroup(txs, 'food-fresh');
    const names = result.map(c => c.name);
    expect(names).toContain('Frutas y Verduras');
    expect(names).toContain('Carnes y Mariscos');
    expect(names).not.toContain('Lácteos'); // 'food-packaged' group
  });

  it('filters by store category when provided', () => {
    const txsMultiStore: Transaction[] = [
      makeTx({
        date: '2026-01-01',
        total: 500,
        category: 'Supermercado' as Transaction['category'],
        items: [{ name: 'Apple', price: 200, category: 'Frutas y Verduras' }],
      }),
      makeTx({
        date: '2026-01-02',
        total: 300,
        category: 'Restaurante' as Transaction['category'],
        items: [{ name: 'Steak', price: 300, category: 'Carnes y Mariscos' }],
      }),
    ];
    const result = computeItemCategoriesInGroup(txsMultiStore, 'food-fresh', 'Supermercado');
    // Only Supermercado transactions → only Apple/Frutas
    const names = result.map(c => c.name);
    expect(names).toContain('Frutas y Verduras');
    expect(names).not.toContain('Carnes y Mariscos'); // Restaurante only
  });

  it('returns all stores when storeCategoryName is undefined', () => {
    const result = computeItemCategoriesInGroup(txs, 'food-fresh');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// computeTreemapCategories
// ============================================================================

describe('computeTreemapCategories', () => {
  it('delegates to applyTreemapGrouping and strips amount field', () => {
    const categories: CategoryData[] = [
      makeCategoryData('Big', 800, 80),
      makeCategoryData('Small1', 80, 8),
      makeCategoryData('Small2', 70, 7),
    ];

    const result = computeTreemapCategories(categories, 0);
    expect(result.displayCategories).toBeDefined();
    expect(result.otroCategories).toBeDefined();
    expect(result.canExpand).toBeDefined();
    expect(result.canCollapse).toBeDefined();

    // Verify 'amount' field was stripped from results
    for (const cat of result.displayCategories) {
      expect('amount' in cat).toBe(false);
    }
  });

  it('passes expandedCount through', () => {
    const categories: CategoryData[] = [
      makeCategoryData('Big', 800, 80),
      makeCategoryData('Small1', 80, 8),
      makeCategoryData('Small2', 70, 7),
      makeCategoryData('Small3', 50, 5),
    ];

    computeTreemapCategories(categories, 2);
    expect(applyTreemapGrouping).toHaveBeenCalledWith(
      expect.any(Array),
      2,
      expect.any(Function)
    );
  });

  it('returns empty result for empty input', () => {
    const result = computeTreemapCategories([], 0);
    expect(result.displayCategories).toHaveLength(0);
  });
});

// ============================================================================
// computeTrendCategories
// ============================================================================

describe('computeTrendCategories', () => {
  it('returns empty for empty input', () => {
    const result = computeTrendCategories([], 0);
    expect(result.displayTrends).toHaveLength(0);
    expect(result.otroTrends).toHaveLength(0);
    expect(result.canExpand).toBe(false);
    expect(result.canCollapse).toBe(false);
  });

  it('keeps categories above 10% and adds first below threshold', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Medium', 120, 12),
      makeTrendData('Small1', 50, 5),
      makeTrendData('Small2', 20, 2),
      makeTrendData('Small3', 10, 1),
    ];

    const result = computeTrendCategories(trends, 0);
    const names = result.displayTrends.map(t => t.name);
    expect(names).toContain('Big');
    expect(names).toContain('Medium');
    expect(names).toContain('Small1'); // First below threshold
  });

  it('aggregates remaining into "Más" when 2+ categories remain', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Small1', 50, 5),
      makeTrendData('Small2', 30, 3),
      makeTrendData('Small3', 20, 2),
    ];

    const result = computeTrendCategories(trends, 0);
    const mas = result.displayTrends.find(t => t.name === 'Más');
    expect(mas).toBeDefined();
    // Small2 (30) + Small3 (20) = 50
    expect(mas!.value).toBe(50);
  });

  it('shows single remaining category directly instead of "Más"', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Small1', 50, 5),
      makeTrendData('Small2', 30, 3),
    ];

    const result = computeTrendCategories(trends, 0);
    // Small1 = first below, Small2 = only 1 remaining → shown directly
    const names = result.displayTrends.map(t => t.name);
    expect(names).toContain('Small2');
    expect(names).not.toContain('Más');
  });

  it('reveals expanded categories from "Más"', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Small1', 50, 5),
      makeTrendData('Small2', 30, 3),
      makeTrendData('Small3', 15, 1.5),
      makeTrendData('Small4', 5, 0.5),
    ];

    const result = computeTrendCategories(trends, 1);
    // Small1 = first below, Small2 = expanded, Small3+Small4 remain
    const names = result.displayTrends.map(t => t.name);
    expect(names).toContain('Small2');
  });

  it('aggregates sparkline data for "Más" group', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Small1', 50, 5, { sparkline: [10, 20, 30] }),
      makeTrendData('Small2', 30, 3, { sparkline: [5, 10, 15] }),
      makeTrendData('Small3', 20, 2, { sparkline: [3, 6, 9] }),
    ];

    const result = computeTrendCategories(trends, 0);
    const mas = result.displayTrends.find(t => t.name === 'Más');
    expect(mas).toBeDefined();
    // Small2 + Small3 sparklines aggregated: [5+3, 10+6, 15+9] = [8, 16, 24]
    expect(mas!.sparkline).toEqual([8, 16, 24]);
  });

  it('calculates change for "Más" group via calculateChange', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Small1', 50, 5, { previousValue: 40 }),
      makeTrendData('Small2', 30, 3, { previousValue: 20 }),
      makeTrendData('Small3', 20, 2, { previousValue: 10 }),
    ];

    const result = computeTrendCategories(trends, 0);
    const mas = result.displayTrends.find(t => t.name === 'Más');
    expect(mas).toBeDefined();
    // Más previousValue = 20 + 10 = 30
    expect(mas!.previousValue).toBe(30);
  });

  it('excludes pre-existing "Más" entries from threshold check', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Más', 100, 10), // pre-existing
      makeTrendData('Small1', 60, 6),
      makeTrendData('Small2', 40, 4),
    ];

    const result = computeTrendCategories(trends, 0);
    // Pre-existing "Más" should be excluded from above/below logic
    const displayNames = result.displayTrends.map(t => t.name);
    expect(displayNames).toContain('Big');
    expect(displayNames).toContain('Small1'); // first below threshold
  });

  it('sets canExpand true only when 2+ categories would go to Más', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Small1', 50, 5),
      makeTrendData('Small2', 30, 3),
      makeTrendData('Small3', 20, 2),
    ];

    const result = computeTrendCategories(trends, 0);
    expect(result.canExpand).toBe(true);
    expect(result.canCollapse).toBe(false);
  });

  it('sets canCollapse true when expandedCount > 0', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Small1', 50, 5),
      makeTrendData('Small2', 30, 3),
      makeTrendData('Small3', 20, 2),
      makeTrendData('Small4', 10, 1),
    ];

    const result = computeTrendCategories(trends, 1);
    expect(result.canCollapse).toBe(true);
  });

  it('merges transactionIds for "Más" group', () => {
    const trends: TrendData[] = [
      makeTrendData('Big', 800, 80),
      makeTrendData('Small1', 50, 5, { transactionIds: new Set(['t1']) }),
      makeTrendData('Small2', 30, 3, { transactionIds: new Set(['t2', 't3']) }),
      makeTrendData('Small3', 20, 2, { transactionIds: new Set(['t3', 't4']) }),
    ];

    const result = computeTrendCategories(trends, 0);
    const mas = result.displayTrends.find(t => t.name === 'Más');
    expect(mas).toBeDefined();
    // t2, t3, t4 = 3 unique (Small2 + Small3 go to Más)
    expect(mas!.transactionIds?.size).toBe(3);
    expect(mas!.count).toBe(3);
  });
});
