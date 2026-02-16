/**
 * Tests for DashboardView/categoryDataHelpers.ts
 * Story 15-TD-21: Test coverage for TD-16 extracted helpers
 *
 * 4 exported functions:
 * - computeStoreCategoriesData: Aggregate transactions by store category
 * - computeStoreGroupsData: Aggregate by store category group
 * - computeItemCategoriesData: Aggregate line items by item category
 * - computeItemGroupsData: Aggregate line items by item category group
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { makeTx } from '../../../../views/__fixtures__/transactionFactory';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/config/categoryColors', async () => {
  const fixtures = await import('../../../../views/__fixtures__/categoryColorsMock');
  return {
    getCategoryPillColors: vi.fn((name: string) => ({ bg: `${name}-bg`, fg: `${name}-fg` })),
    getStoreGroupColors: vi.fn((_group: string) => ({ bg: 'group-bg', fg: 'group-fg' })),
    getItemGroupColors: vi.fn((_group: string) => ({ bg: 'igroup-bg', fg: 'igroup-fg' })),
    getCurrentTheme: vi.fn(() => 'light'),
    getCurrentMode: vi.fn(() => 'default'),
    getCategoryColorsAuto: vi.fn((name: string) => ({ bg: `${name}-bg`, fg: `${name}-fg` })),
    ALL_STORE_CATEGORY_GROUPS: fixtures.MOCK_ALL_STORE_CATEGORY_GROUPS,
    ALL_ITEM_CATEGORY_GROUPS: fixtures.MOCK_ALL_ITEM_CATEGORY_GROUPS,
    STORE_CATEGORY_GROUPS: fixtures.MOCK_STORE_CATEGORY_GROUPS,
    ITEM_CATEGORY_GROUPS: fixtures.MOCK_ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_TO_KEY: fixtures.MOCK_ITEM_CATEGORY_TO_KEY,
  };
});

vi.mock('@/utils/categoryNormalizer', () => ({
  normalizeItemCategory: vi.fn((cat: string) => cat),
}));

vi.mock('@/hooks/useItems', () => ({
  normalizeItemNameForGrouping: vi.fn((name: string) => name.toLowerCase().trim()),
}));

vi.mock('@/utils/categoryAggregation', () => ({
  applyMasGrouping: vi.fn(
    <T extends { percent: number; name: string }>(
      sorted: T[],
      _total: number,
      _createMasEntry: unknown,
    ) => ({
      displayCategories: sorted,
      otroCategories: [] as T[],
      canExpand: false,
      canCollapse: false,
    })
  ),
  buildProductKey: vi.fn((name: string, merchant: string) =>
    `${(name || 'Unknown').toLowerCase().trim()}::${(merchant || 'unknown').toLowerCase().trim()}`
  ),
}));

import {
  computeStoreCategoriesData,
  computeStoreGroupsData,
  computeItemCategoriesData,
  computeItemGroupsData,
} from '@features/dashboard/views/DashboardView/categoryDataHelpers';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// computeStoreCategoriesData
// ============================================================================

describe('computeStoreCategoriesData', () => {
  it('aggregates transactions by category', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 1000, category: 'Supermercado' as Transaction['category'] }),
      makeTx({ id: 'tx2', date: '2026-01-02', total: 500, category: 'Supermercado' as Transaction['category'] }),
      makeTx({ id: 'tx3', date: '2026-01-03', total: 300, category: 'Restaurante' as Transaction['category'] }),
    ];

    const result = computeStoreCategoriesData(txs, 1800);
    const supermarket = result.displayCategories.find(c => c.name === 'Supermercado');
    expect(supermarket).toBeDefined();
    expect(supermarket!.amount).toBe(1500);
    expect(supermarket!.count).toBe(2);
  });

  it('sorts by amount descending', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 100, category: 'Small' as Transaction['category'] }),
      makeTx({ id: 'tx2', date: '2026-01-01', total: 500, category: 'Big' as Transaction['category'] }),
    ];

    const result = computeStoreCategoriesData(txs, 600);
    expect(result.displayCategories[0].name).toBe('Big');
    expect(result.displayCategories[1].name).toBe('Small');
  });

  it('calculates percentages relative to monthTotal', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 750, category: 'A' as Transaction['category'] }),
      makeTx({ id: 'tx2', date: '2026-01-01', total: 250, category: 'B' as Transaction['category'] }),
    ];

    const result = computeStoreCategoriesData(txs, 1000);
    expect(result.displayCategories[0].percent).toBe(75);
    expect(result.displayCategories[1].percent).toBe(25);
  });

  it('defaults empty category to "Otro"', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 100, category: '' as Transaction['category'] }),
    ];

    const result = computeStoreCategoriesData(txs, 100);
    expect(result.displayCategories[0].name).toBe('Otro');
  });

  it('counts unique transactions via id', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 100, category: 'A' as Transaction['category'] }),
      makeTx({ id: 'tx2', date: '2026-01-02', total: 200, category: 'A' as Transaction['category'] }),
    ];

    const result = computeStoreCategoriesData(txs, 300);
    expect(result.displayCategories[0].count).toBe(2);
  });

  it('falls back to index-based id when tx.id is undefined', () => {
    const txs = [
      makeTx({ date: '2026-01-01', total: 100, category: 'A' as Transaction['category'] }),
      makeTx({ date: '2026-01-02', total: 200, category: 'A' as Transaction['category'] }),
    ];

    const result = computeStoreCategoriesData(txs, 300);
    expect(result.displayCategories[0].count).toBe(2);
  });

  it('counts unique products per category', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 500,
        category: 'Supermercado' as Transaction['category'],
        items: [
          { name: 'Apple', price: 200 },
          { name: 'Banana', price: 300 },
        ],
      }),
    ];

    const result = computeStoreCategoriesData(txs, 500);
    expect(result.displayCategories[0].itemCount).toBe(2);
  });

  it('handles 0 monthTotal without division error', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 100, category: 'A' as Transaction['category'] }),
    ];

    const result = computeStoreCategoriesData(txs, 0);
    expect(result.displayCategories[0].percent).toBe(0);
  });

  it('returns empty for no transactions', () => {
    const result = computeStoreCategoriesData([], 0);
    expect(result.displayCategories).toHaveLength(0);
  });
});

// ============================================================================
// computeStoreGroupsData
// ============================================================================

describe('computeStoreGroupsData', () => {
  it('aggregates transactions by store group', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 1000, category: 'Supermercado' as Transaction['category'] }),
      makeTx({ id: 'tx2', date: '2026-01-02', total: 500, category: 'Restaurante' as Transaction['category'] }),
      makeTx({ id: 'tx3', date: '2026-01-03', total: 300, category: 'Farmacia' as Transaction['category'] }),
    ];

    const result = computeStoreGroupsData(txs, 1800);
    const foodDining = result.displayCategories.find(c => c.name === 'food-dining');
    expect(foodDining).toBeDefined();
    expect(foodDining!.amount).toBe(1500); // Supermercado + Restaurante
  });

  it('maps unknown categories to "other" group', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 200, category: 'UnknownStore' as Transaction['category'] }),
    ];

    const result = computeStoreGroupsData(txs, 200);
    const other = result.displayCategories.find(c => c.name === 'other');
    expect(other).toBeDefined();
    expect(other!.amount).toBe(200);
  });

  it('filters out empty groups', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 100, category: 'Supermercado' as Transaction['category'] }),
    ];

    const result = computeStoreGroupsData(txs, 100);
    // Only food-dining should have data; other groups should be filtered out
    expect(result.displayCategories.every(c => c.amount > 0)).toBe(true);
  });

  it('sorts by amount descending', () => {
    const txs = [
      makeTx({ id: 'tx1', date: '2026-01-01', total: 100, category: 'Farmacia' as Transaction['category'] }),
      makeTx({ id: 'tx2', date: '2026-01-01', total: 500, category: 'Supermercado' as Transaction['category'] }),
    ];

    const result = computeStoreGroupsData(txs, 600);
    expect(result.displayCategories[0].name).toBe('food-dining');
    expect(result.displayCategories[1].name).toBe('health-wellness');
  });

  it('returns empty for no transactions', () => {
    const result = computeStoreGroupsData([], 0);
    expect(result.displayCategories).toHaveLength(0);
  });
});

// ============================================================================
// computeItemCategoriesData
// ============================================================================

describe('computeItemCategoriesData', () => {
  it('aggregates by item category from line items', () => {
    const txs = [
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

    const result = computeItemCategoriesData(txs);
    const lacteos = result.displayCategories.find(c => c.name === 'Lácteos');
    expect(lacteos).toBeDefined();
    expect(lacteos!.amount).toBe(800); // 300 + 500
    expect(lacteos!.count).toBe(2); // 2 unique transactions
  });

  it('defaults missing item category to "Other"', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 100,
        items: [{ name: 'Mystery', price: 100 }],
      }),
    ];

    const result = computeItemCategoriesData(txs);
    expect(result.displayCategories[0].name).toBe('Other');
  });

  it('calculates total from item amounts (not tx.total)', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 9999, // Ignored for percentage calc
        items: [
          { name: 'A', price: 750, category: 'CatA' },
          { name: 'B', price: 250, category: 'CatB' },
        ],
      }),
    ];

    const result = computeItemCategoriesData(txs);
    // Total from items = 1000
    const catA = result.displayCategories.find(c => c.name === 'CatA');
    expect(catA!.percent).toBe(75);
  });

  it('sorts by amount descending', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 500,
        items: [
          { name: 'A', price: 100, category: 'Small' },
          { name: 'B', price: 400, category: 'Big' },
        ],
      }),
    ];

    const result = computeItemCategoriesData(txs);
    expect(result.displayCategories[0].name).toBe('Big');
  });

  it('handles transactions with no items', () => {
    const txs = [makeTx({ id: 'tx1', date: '2026-01-01', total: 100 })];
    const result = computeItemCategoriesData(txs);
    expect(result.displayCategories).toHaveLength(0);
  });

  it('counts unique products per category', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 500,
        items: [
          { name: 'Milk', price: 200, category: 'Lácteos' },
          { name: 'Cheese', price: 300, category: 'Lácteos' },
        ],
      }),
    ];

    const result = computeItemCategoriesData(txs);
    const lacteos = result.displayCategories.find(c => c.name === 'Lácteos');
    expect(lacteos!.itemCount).toBe(2);
  });
});

// ============================================================================
// computeItemGroupsData
// ============================================================================

describe('computeItemGroupsData', () => {
  it('aggregates line items by item category group', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 1000,
        items: [
          { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
          { name: 'Steak', price: 500, category: 'Carnes y Mariscos' },
          { name: 'Milk', price: 300, category: 'Lácteos' },
        ],
      }),
    ];

    const result = computeItemGroupsData(txs);
    const foodFresh = result.displayCategories.find(c => c.name === 'food-fresh');
    expect(foodFresh).toBeDefined();
    expect(foodFresh!.amount).toBe(700); // Frutas(200) + Carnes(500)

    const foodPackaged = result.displayCategories.find(c => c.name === 'food-packaged');
    expect(foodPackaged).toBeDefined();
    expect(foodPackaged!.amount).toBe(300); // Lácteos
  });

  it('maps unknown item categories to "other-item" group', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 100,
        items: [{ name: 'Widget', price: 100, category: 'UnmappedCat' }],
      }),
    ];

    const result = computeItemGroupsData(txs);
    const otherItem = result.displayCategories.find(c => c.name === 'other-item');
    expect(otherItem).toBeDefined();
    expect(otherItem!.amount).toBe(100);
  });

  it('filters out empty groups', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 100,
        items: [{ name: 'Apple', price: 100, category: 'Frutas y Verduras' }],
      }),
    ];

    const result = computeItemGroupsData(txs);
    expect(result.displayCategories.every(c => c.amount > 0)).toBe(true);
  });

  it('sorts by amount descending', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 500,
        items: [
          { name: 'Milk', price: 100, category: 'Lácteos' },
          { name: 'Apple', price: 400, category: 'Frutas y Verduras' },
        ],
      }),
    ];

    const result = computeItemGroupsData(txs);
    expect(result.displayCategories[0].name).toBe('food-fresh');
    expect(result.displayCategories[1].name).toBe('food-packaged');
  });

  it('calculates total from item amounts', () => {
    const txs = [
      makeTx({
        id: 'tx1',
        date: '2026-01-01',
        total: 9999, // Ignored
        items: [
          { name: 'A', price: 600, category: 'Frutas y Verduras' },
          { name: 'B', price: 400, category: 'Lácteos' },
        ],
      }),
    ];

    const result = computeItemGroupsData(txs);
    const foodFresh = result.displayCategories.find(c => c.name === 'food-fresh');
    // Total = 1000 → food-fresh = 600/1000 = 60%
    expect(foodFresh!.percent).toBe(60);
  });

  it('returns empty for no transactions', () => {
    const result = computeItemGroupsData([]);
    expect(result.displayCategories).toHaveLength(0);
  });

  it('returns empty for transactions with no items', () => {
    const txs = [makeTx({ id: 'tx1', date: '2026-01-01', total: 100 })];
    const result = computeItemGroupsData(txs);
    expect(result.displayCategories).toHaveLength(0);
  });
});
