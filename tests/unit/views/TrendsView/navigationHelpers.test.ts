/**
 * Tests for TrendsView/navigationHelpers.ts
 * Story 15-TD-21: Test coverage for TD-16 extracted helpers
 *
 * 5 exported functions:
 * - getDisplayModeAtDrillLevel: Resolves display mode from base view + drill level
 * - getDonutViewModeAtDrillLevel: Same but returns DonutViewMode (no 'subcategories')
 * - getMaxDrillDownLevel: Max drill depth per view mode
 * - buildTreemapNavigationPayload: Treemap cell click → HistoryNavigationPayload
 * - buildTrendNavigationPayload: Trend count click → HistoryNavigationPayload
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DonutViewMode, CategoryData } from '@/views/TrendsView/types';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/config/categoryColors', () => ({
  expandStoreCategoryGroup: vi.fn((group: string) => [`${group}-cat1`, `${group}-cat2`]),
  expandItemCategoryGroup: vi.fn((group: string) => [`${group}-item1`, `${group}-item2`]),
}));

import {
  getDisplayModeAtDrillLevel,
  getDonutViewModeAtDrillLevel,
  getMaxDrillDownLevel,
  buildTreemapNavigationPayload,
  buildTrendNavigationPayload,
  type BuildTreemapNavPayloadArgs,
  type BuildTrendNavPayloadArgs,
} from '@/views/TrendsView/navigationHelpers';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Test Helpers
// ============================================================================

function makeCategoryData(name: string, value: number, percent: number): CategoryData {
  return {
    name,
    value,
    count: 1,
    itemCount: 0,
    color: '#000',
    fgColor: '#fff',
    percent,
  };
}

const basePeriod = { year: 2026, month: 1, quarter: 1, week: 1 };

// ============================================================================
// getDisplayModeAtDrillLevel
// ============================================================================

describe('getDisplayModeAtDrillLevel', () => {
  describe.each<{ mode: DonutViewMode; levels: Array<[number, string]> }>([
    {
      mode: 'store-categories',
      levels: [
        [0, 'store-categories'],
        [1, 'item-groups'],
        [2, 'item-categories'],
        [3, 'subcategories'],
        [4, 'subcategories'], // beyond max
      ],
    },
    {
      mode: 'store-groups',
      levels: [
        [0, 'store-groups'],
        [1, 'store-categories'],
        [2, 'item-groups'],
        [3, 'item-categories'],
        [4, 'subcategories'],
      ],
    },
    {
      mode: 'item-groups',
      levels: [
        [0, 'item-groups'],
        [1, 'item-categories'],
        [2, 'subcategories'],
        [3, 'subcategories'],
      ],
    },
    {
      mode: 'item-categories',
      levels: [
        [0, 'item-categories'],
        [1, 'subcategories'],
        [2, 'subcategories'],
      ],
    },
  ])('$mode', ({ mode, levels }) => {
    it.each(levels)('level %i → %s', (level, expected) => {
      expect(getDisplayModeAtDrillLevel(mode, level)).toBe(expected);
    });
  });
});

// ============================================================================
// getDonutViewModeAtDrillLevel
// ============================================================================

describe('getDonutViewModeAtDrillLevel', () => {
  it('returns same as getDisplayModeAtDrillLevel for non-subcategory levels', () => {
    expect(getDonutViewModeAtDrillLevel('store-categories', 0)).toBe('store-categories');
    expect(getDonutViewModeAtDrillLevel('store-categories', 1)).toBe('item-groups');
    expect(getDonutViewModeAtDrillLevel('store-groups', 1)).toBe('store-categories');
  });

  it('returns "item-categories" instead of "subcategories"', () => {
    expect(getDonutViewModeAtDrillLevel('store-categories', 3)).toBe('item-categories');
    expect(getDonutViewModeAtDrillLevel('item-groups', 2)).toBe('item-categories');
    expect(getDonutViewModeAtDrillLevel('item-categories', 1)).toBe('item-categories');
  });
});

// ============================================================================
// getMaxDrillDownLevel
// ============================================================================

describe('getMaxDrillDownLevel', () => {
  it.each<[DonutViewMode, number]>([
    ['store-groups', 3],
    ['store-categories', 3],
    ['item-groups', 2],
    ['item-categories', 1],
  ])('%s → %i', (mode, expected) => {
    expect(getMaxDrillDownLevel(mode)).toBe(expected);
  });

  it('defaults to 3 for unknown mode', () => {
    expect(getMaxDrillDownLevel('unknown' as DonutViewMode)).toBe(3);
  });
});

// ============================================================================
// buildTreemapNavigationPayload
// ============================================================================

describe('buildTreemapNavigationPayload', () => {
  const baseArgs: BuildTreemapNavPayloadArgs = {
    categoryName: 'Supermercado',
    countMode: 'transactions',
    donutViewMode: 'store-categories',
    timePeriod: 'month',
    currentPeriod: basePeriod,
    treemapDrillDownLevel: 0,
    treemapDrillDownPath: [],
    otroCategories: [],
  };

  describe('targetView', () => {
    it('sets targetView to "history" for transactions countMode', () => {
      const payload = buildTreemapNavigationPayload(baseArgs);
      expect(payload.targetView).toBe('history');
    });

    it('sets targetView to "items" for items countMode', () => {
      const payload = buildTreemapNavigationPayload({ ...baseArgs, countMode: 'items' });
      expect(payload.targetView).toBe('items');
    });
  });

  describe('sourceDistributionView', () => {
    it('always sets sourceDistributionView to "treemap"', () => {
      const payload = buildTreemapNavigationPayload(baseArgs);
      expect(payload.sourceDistributionView).toBe('treemap');
    });
  });

  describe('category filters by display mode', () => {
    it('sets category for store-categories at level 0', () => {
      const payload = buildTreemapNavigationPayload(baseArgs);
      expect(payload.category).toBe('Supermercado');
      expect(payload.drillDownPath?.storeCategory).toBe('Supermercado');
    });

    it('sets storeGroup for store-groups at level 0', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        categoryName: 'food-dining',
        donutViewMode: 'store-groups',
      });
      expect(payload.storeGroup).toBe('food-dining');
      expect(payload.drillDownPath?.storeGroup).toBe('food-dining');
    });

    it('sets itemGroup for item-groups at level 0', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        categoryName: 'food-fresh',
        donutViewMode: 'item-groups',
      });
      expect(payload.itemGroup).toBe('food-fresh');
      expect(payload.drillDownPath?.itemGroup).toBe('food-fresh');
    });

    it('sets itemCategory for item-categories at level 0', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        categoryName: 'Lácteos',
        donutViewMode: 'item-categories',
      });
      expect(payload.itemCategory).toBe('Lácteos');
      expect(payload.drillDownPath?.itemCategory).toBe('Lácteos');
    });
  });

  describe('drill-down path population', () => {
    it('includes parent path when drilled down', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        categoryName: 'food-fresh',
        donutViewMode: 'store-categories',
        treemapDrillDownLevel: 1,
        treemapDrillDownPath: ['Supermercado'],
      });

      expect(payload.drillDownPath?.storeCategory).toBe('Supermercado');
      expect(payload.drillDownPath?.itemGroup).toBe('food-fresh');
    });

    it('includes multi-level parent path', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        categoryName: 'Lácteos',
        donutViewMode: 'store-groups',
        treemapDrillDownLevel: 3,
        treemapDrillDownPath: ['food-dining', 'Supermercado', 'food-packaged'],
      });

      expect(payload.drillDownPath?.storeGroup).toBe('food-dining');
      expect(payload.drillDownPath?.storeCategory).toBe('Supermercado');
      expect(payload.drillDownPath?.itemGroup).toBe('food-packaged');
      expect(payload.drillDownPath?.itemCategory).toBe('Lácteos');
    });
  });

  describe('temporal filter', () => {
    it('includes year for all periods', () => {
      const payload = buildTreemapNavigationPayload(baseArgs);
      expect(payload.temporal?.level).toBe('month');
      expect(payload.temporal?.year).toBe('2026');
    });

    it('includes month for month period', () => {
      const payload = buildTreemapNavigationPayload(baseArgs);
      expect(payload.temporal?.month).toBe('2026-01');
    });

    it('includes month for week period', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        timePeriod: 'week',
      });
      expect(payload.temporal?.month).toBe('2026-01');
    });

    it('includes quarter for quarter period', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        timePeriod: 'quarter',
      });
      expect(payload.temporal?.quarter).toBe('Q1');
    });

    it('only includes year for year period', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        timePeriod: 'year',
      });
      expect(payload.temporal?.year).toBe('2026');
      expect(payload.temporal?.month).toBeUndefined();
      expect(payload.temporal?.quarter).toBeUndefined();
    });
  });

  describe('aggregated group ("Más")', () => {
    it('joins otroCategories for store-categories Más click', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        categoryName: 'Más',
        otroCategories: [
          makeCategoryData('Kiosko', 100, 5),
          makeCategoryData('Verdulería', 80, 4),
        ],
      });
      expect(payload.category).toBe('Kiosko,Verdulería');
      expect(payload.drillDownPath).toBeUndefined(); // No drillDownPath for aggregated
    });

    it('expands store groups for store-groups Más click', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        categoryName: 'More',
        donutViewMode: 'store-groups',
        otroCategories: [
          makeCategoryData('automotive', 100, 5),
          makeCategoryData('services', 80, 4),
        ],
      });
      // expandStoreCategoryGroup returns ['groupName-cat1', 'groupName-cat2']
      expect(payload.category).toBe('automotive-cat1,automotive-cat2,services-cat1,services-cat2');
    });

    it('expands item groups for item-groups Más click', () => {
      const payload = buildTreemapNavigationPayload({
        ...baseArgs,
        categoryName: 'Más',
        donutViewMode: 'item-groups',
        otroCategories: [
          makeCategoryData('household', 100, 5),
        ],
      });
      expect(payload.itemCategory).toBe('household-item1,household-item2');
    });
  });
});

// ============================================================================
// buildTrendNavigationPayload
// ============================================================================

describe('buildTrendNavigationPayload', () => {
  const baseArgs: BuildTrendNavPayloadArgs = {
    categoryName: 'Supermercado',
    countMode: 'transactions',
    donutViewMode: 'store-categories',
    effectiveViewMode: 'store-categories',
    timePeriod: 'month',
    currentPeriod: basePeriod,
    trendDrillDownLevel: 0,
    trendDrillDownPath: [],
    otroTrendCategories: [],
  };

  it('sets targetView based on countMode', () => {
    expect(buildTrendNavigationPayload(baseArgs).targetView).toBe('history');
    expect(buildTrendNavigationPayload({ ...baseArgs, countMode: 'items' }).targetView).toBe('items');
  });

  it('sets sourceDistributionView to "treemap"', () => {
    const payload = buildTrendNavigationPayload(baseArgs);
    expect(payload.sourceDistributionView).toBe('treemap');
  });

  it('uses effectiveViewMode for category filter (not base donutViewMode)', () => {
    const payload = buildTrendNavigationPayload({
      ...baseArgs,
      donutViewMode: 'store-groups',
      effectiveViewMode: 'store-categories',
      categoryName: 'Supermercado',
    });
    // effectiveViewMode is 'store-categories' → sets category, not storeGroup
    expect(payload.category).toBe('Supermercado');
    expect(payload.storeGroup).toBeUndefined();
  });

  it('includes parent path from drill-down', () => {
    const payload = buildTrendNavigationPayload({
      ...baseArgs,
      donutViewMode: 'store-categories',
      effectiveViewMode: 'item-groups',
      categoryName: 'food-fresh',
      trendDrillDownLevel: 1,
      trendDrillDownPath: ['Supermercado'],
    });

    expect(payload.drillDownPath?.storeCategory).toBe('Supermercado');
    expect(payload.itemGroup).toBe('food-fresh');
  });

  it('includes temporal filter', () => {
    const payload = buildTrendNavigationPayload(baseArgs);
    expect(payload.temporal?.level).toBe('month');
    expect(payload.temporal?.year).toBe('2026');
    expect(payload.temporal?.month).toBe('2026-01');
  });

  it('handles aggregated group ("Más") by joining categories', () => {
    const payload = buildTrendNavigationPayload({
      ...baseArgs,
      categoryName: 'Más',
      otroTrendCategories: [
        makeCategoryData('Kiosko', 50, 3),
        makeCategoryData('Verdulería', 30, 2),
      ],
    });
    expect(payload.category).toBe('Kiosko,Verdulería');
    expect(payload.drillDownPath).toBeUndefined();
  });

  it('skips drillDownPath for empty trendPath', () => {
    const payload = buildTrendNavigationPayload(baseArgs);
    // At level 0 with no accumulated path and single category → drillDownPath has storeCategory
    expect(payload.drillDownPath?.storeCategory).toBe('Supermercado');
  });
});
