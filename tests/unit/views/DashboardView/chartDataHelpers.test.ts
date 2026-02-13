/**
 * Tests for DashboardView/chartDataHelpers.ts
 * Story 15-TD-21: Test coverage for TD-16 extracted helpers
 *
 * 2 exported functions:
 * - computeRadarChartData: Radar chart for "Mes a Mes" view
 * - computeBumpChartData: Bump chart for "Ultimos 4 Meses" view
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from '@/types/transaction';
import type { TreemapViewMode } from '@/views/DashboardView/types';
import { makeTx } from '../__fixtures__/transactionFactory';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/config/categoryColors', async () => {
  const fixtures = await import('../__fixtures__/categoryColorsMock');
  return {
    getCategoryBackgroundAuto: vi.fn((name: string) => `${name}-auto-bg`),
    getCategoryPillColors: vi.fn((name: string) => ({ bg: `${name}-bg`, fg: `${name}-fg` })),
    getStoreGroupColors: vi.fn((_group: string) => ({ bg: 'sgroup-bg', fg: 'sgroup-fg' })),
    getItemGroupColors: vi.fn((_group: string) => ({ bg: 'igroup-bg', fg: 'igroup-fg' })),
    getCurrentTheme: vi.fn(() => 'light'),
    getCurrentMode: vi.fn(() => 'default'),
    STORE_CATEGORY_GROUPS: fixtures.MOCK_STORE_CATEGORY_GROUPS,
    ITEM_CATEGORY_GROUPS: fixtures.MOCK_ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_TO_KEY: fixtures.MOCK_ITEM_CATEGORY_TO_KEY,
  };
});

vi.mock('@/utils/categoryEmoji', () => ({
  getCategoryEmoji: vi.fn(() => '🛒'),
}));

vi.mock('@/utils/categoryTranslations', () => ({
  getStoreCategoryGroupEmoji: vi.fn(() => '🏪'),
  getItemCategoryGroupEmoji: vi.fn(() => '📦'),
  getItemCategoryEmoji: vi.fn(() => '🏷️'),
}));

vi.mock('@/utils/categoryNormalizer', () => ({
  normalizeItemCategory: vi.fn((cat: string) => cat),
}));

import {
  computeRadarChartData,
  computeBumpChartData,
} from '@/views/DashboardView/chartDataHelpers';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// computeRadarChartData
// ============================================================================

describe('computeRadarChartData', () => {
  const selectedMonth = { year: 2026, month: 0 }; // January (0-indexed)

  describe('basic structure', () => {
    it('returns radar data with correct structure', () => {
      const currTxs = [
        makeTx({ date: '2026-01-10', total: 1000, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-15', total: 500, category: 'Restaurante' as Transaction['category'] }),
        makeTx({ date: '2026-01-20', total: 200, category: 'Farmacia' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-categories');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('maxValue');
      expect(result).toHaveProperty('sides');
      expect(result).toHaveProperty('polygonType');
      expect(result).toHaveProperty('currentMonthIdx');
      expect(result).toHaveProperty('prevMonthIdx');
    });

    it('sets currentMonthIdx and prevMonthIdx correctly', () => {
      const result = computeRadarChartData([], [], selectedMonth, 'store-categories');
      expect(result.currentMonthIdx).toBe(0); // January
      expect(result.prevMonthIdx).toBe(11); // December (wrapped)
    });

    it('handles March → February correctly (non-wrapped)', () => {
      const marchMonth = { year: 2026, month: 2 }; // March
      const result = computeRadarChartData([], [], marchMonth, 'store-categories');
      expect(result.currentMonthIdx).toBe(2);
      expect(result.prevMonthIdx).toBe(1); // February
    });
  });

  describe('category selection', () => {
    it('includes categories >10% and first ≤10%', () => {
      const currTxs = [
        makeTx({ date: '2026-01-01', total: 600, category: 'Big1' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 300, category: 'Big2' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 50, category: 'Small1' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 30, category: 'Small2' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 20, category: 'Small3' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-categories');
      const names = result.categories.map(c => c.name);

      // Big1 (60%) and Big2 (30%) are >10%
      expect(names).toContain('Big1');
      expect(names).toContain('Big2');
      // Small1 is first ≤10%
      expect(names).toContain('Small1');
    });

    it('aggregates remaining into "Otro" catch-all', () => {
      const currTxs = [
        makeTx({ date: '2026-01-01', total: 800, category: 'Big' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 80, category: 'Small1' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 60, category: 'Small2' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 60, category: 'Small3' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-categories');
      const otro = result.categories.find(c => c.name === 'Otro');
      expect(otro).toBeDefined();
      // Small2 (60) + Small3 (60) = 120 (Small1 is shown as first ≤10%)
      expect(otro!.currAmount).toBe(120);
    });

    it('caps at 6 categories maximum (hexagon)', () => {
      const currTxs = Array.from({ length: 10 }, (_, i) =>
        makeTx({
          date: '2026-01-01',
          total: 200 - i * 10,
          category: `Cat${i}` as Transaction['category'],
        })
      );

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-categories');
      expect(result.categories.length).toBeLessThanOrEqual(6);
    });
  });

  describe('polygon type', () => {
    it('returns "triangle" for 3 categories', () => {
      const currTxs = [
        makeTx({ date: '2026-01-01', total: 500, category: 'A' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 300, category: 'B' as Transaction['category'] }),
        makeTx({ date: '2026-01-01', total: 200, category: 'C' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-categories');
      // 3 distinct categories → exactly 3 sides → triangle
      expect(result.sides).toBe(3);
      expect(result.polygonType).toBe('triangle');
    });

    it('returns correct polygon names', () => {
      // 4 = diamond, 5 = pentagon, 6 = hexagon
      const currTxs = Array.from({ length: 5 }, (_, i) =>
        makeTx({
          date: '2026-01-01',
          total: 300 - i * 20,
          category: `Cat${i}` as Transaction['category'],
        })
      );

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-categories');
      const validTypes = ['triangle', 'diamond', 'pentagon', 'hexagon'];
      expect(validTypes).toContain(result.polygonType);
    });
  });

  describe('previous month comparison', () => {
    it('includes previous month amounts', () => {
      const currTxs = [
        makeTx({ date: '2026-01-10', total: 500, category: 'Supermercado' as Transaction['category'] }),
      ];
      const allTxs = [
        ...currTxs,
        makeTx({ date: '2025-12-15', total: 300, category: 'Supermercado' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, allTxs, selectedMonth, 'store-categories');
      const supermercado = result.categories.find(c => c.name === 'Supermercado');
      expect(supermercado).toBeDefined();
      expect(supermercado!.currAmount).toBe(500);
      expect(supermercado!.prevAmount).toBe(300);
    });

    it('sets prevAmount to 0 for categories not in previous month', () => {
      const currTxs = [
        makeTx({ date: '2026-01-10', total: 500, category: 'NewCategory' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-categories');
      const cat = result.categories.find(c => c.name === 'NewCategory');
      expect(cat!.prevAmount).toBe(0);
    });
  });

  describe('maxValue', () => {
    it('calculates max from both current and previous amounts', () => {
      const currTxs = [
        makeTx({ date: '2026-01-10', total: 100, category: 'A' as Transaction['category'] }),
      ];
      const allTxs = [
        ...currTxs,
        makeTx({ date: '2025-12-15', total: 500, category: 'A' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, allTxs, selectedMonth, 'store-categories');
      expect(result.maxValue).toBeGreaterThanOrEqual(500);
    });

    it('has minimum maxValue of 1', () => {
      const result = computeRadarChartData([], [], selectedMonth, 'store-categories');
      expect(result.maxValue).toBe(1);
    });
  });

  describe('view mode support', () => {
    it('aggregates by store-groups', () => {
      const currTxs = [
        makeTx({ date: '2026-01-10', total: 500, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-01-10', total: 300, category: 'Restaurante' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-groups');
      const foodDining = result.categories.find(c => c.name === 'food-dining');
      expect(foodDining).toBeDefined();
      expect(foodDining!.currAmount).toBe(800);
    });

    it('aggregates by item-categories', () => {
      const currTxs = [
        makeTx({
          date: '2026-01-10',
          total: 500,
          items: [
            { name: 'Milk', price: 300, category: 'Lácteos' },
            { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
          ],
        }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'item-categories');
      const lacteos = result.categories.find(c => c.name === 'Lácteos');
      expect(lacteos).toBeDefined();
      expect(lacteos!.currAmount).toBe(300);
    });

    it('aggregates by item-groups', () => {
      const currTxs = [
        makeTx({
          date: '2026-01-10',
          total: 500,
          items: [
            { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
            { name: 'Steak', price: 300, category: 'Carnes y Mariscos' },
          ],
        }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'item-groups');
      const foodFresh = result.categories.find(c => c.name === 'food-fresh');
      expect(foodFresh).toBeDefined();
      expect(foodFresh!.currAmount).toBe(500);
    });
  });

  describe('edge cases', () => {
    it('handles empty transactions', () => {
      const result = computeRadarChartData([], [], selectedMonth, 'store-categories');
      expect(result.categories).toHaveLength(0);
    });

    it('handles single category', () => {
      const currTxs = [
        makeTx({ date: '2026-01-10', total: 1000, category: 'OnlyOne' as Transaction['category'] }),
      ];

      const result = computeRadarChartData(currTxs, currTxs, selectedMonth, 'store-categories');
      // Should pad to at least attempt 3 categories
      expect(result.categories.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ============================================================================
// computeBumpChartData
// ============================================================================

describe('computeBumpChartData', () => {
  const selectedMonth = { year: 2026, month: 3 }; // April (0-indexed)

  describe('basic structure', () => {
    it('returns bump chart data with 4 months', () => {
      const result = computeBumpChartData([], selectedMonth, 'store-categories');
      expect(result.monthData).toHaveLength(4);
      expect(result).toHaveProperty('categories');
    });

    it('month data spans backwards from selected month', () => {
      const result = computeBumpChartData([], selectedMonth, 'store-categories');
      // April (3), March (2), February (1), January (0)
      expect(result.monthData[3].month).toBe(3); // Current (April)
      expect(result.monthData[3].isCurrentMonth).toBe(true);
      expect(result.monthData[2].month).toBe(2); // March
      expect(result.monthData[0].month).toBe(0); // January
    });

    it('wraps year boundary correctly', () => {
      const janMonth = { year: 2026, month: 0 }; // January
      const result = computeBumpChartData([], janMonth, 'store-categories');
      // Jan(0), Dec(11/2025), Nov(10/2025), Oct(9/2025)
      expect(result.monthData[3].month).toBe(0);
      expect(result.monthData[3].year).toBe(2026);
      expect(result.monthData[2].month).toBe(11);
      expect(result.monthData[2].year).toBe(2025);
    });
  });

  describe('category ranking', () => {
    it('returns top 4 categories + "Otro" aggregation', () => {
      const allTxs = [
        makeTx({ date: '2026-04-01', total: 500, category: 'Cat1' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 400, category: 'Cat2' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 300, category: 'Cat3' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 200, category: 'Cat4' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 100, category: 'Cat5' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 50, category: 'Cat6' as Transaction['category'] }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'store-categories');
      expect(result.categories.length).toBeLessThanOrEqual(5); // max 4 + Otro
    });

    it('calculates ranks per month (1 = highest)', () => {
      const allTxs = [
        // April: Cat1 > Cat2
        makeTx({ date: '2026-04-01', total: 500, category: 'Cat1' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 200, category: 'Cat2' as Transaction['category'] }),
        // March: Cat2 > Cat1
        makeTx({ date: '2026-03-01', total: 100, category: 'Cat1' as Transaction['category'] }),
        makeTx({ date: '2026-03-01', total: 400, category: 'Cat2' as Transaction['category'] }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'store-categories');
      const cat1 = result.categories.find(c => c.name === 'Cat1');
      const cat2 = result.categories.find(c => c.name === 'Cat2');
      expect(cat1).toBeDefined();
      expect(cat2).toBeDefined();

      // April (index 3): Cat1 rank 1, Cat2 rank 2
      expect(cat1!.ranks[3]).toBe(1);
      expect(cat2!.ranks[3]).toBe(2);

      // March (index 2): Cat2 rank 1, Cat1 rank 2
      expect(cat2!.ranks[2]).toBe(1);
      expect(cat1!.ranks[2]).toBe(2);
    });

    it('calculates total across all months', () => {
      const allTxs = [
        makeTx({ date: '2026-04-01', total: 500, category: 'Cat1' as Transaction['category'] }),
        makeTx({ date: '2026-03-01', total: 300, category: 'Cat1' as Transaction['category'] }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'store-categories');
      const cat1 = result.categories.find(c => c.name === 'Cat1');
      expect(cat1!.total).toBe(800);
    });
  });

  describe('Otro aggregation', () => {
    it('aggregates remaining categories into Otro', () => {
      const allTxs = [
        makeTx({ date: '2026-04-01', total: 500, category: 'Cat1' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 400, category: 'Cat2' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 300, category: 'Cat3' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 200, category: 'Cat4' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 100, category: 'Cat5' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 50, category: 'Cat6' as Transaction['category'] }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'store-categories');
      const otro = result.categories.find(c => c.name === 'Otro');
      expect(otro).toBeDefined();
      // Cat5(100) + Cat6(50) = 150
      expect(otro!.amounts[3]).toBe(150);
    });

    it('includes existing "Otro" transactions in aggregation', () => {
      const allTxs = [
        makeTx({ date: '2026-04-01', total: 500, category: 'Cat1' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 400, category: 'Cat2' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 300, category: 'Cat3' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 200, category: 'Cat4' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 100, category: 'Cat5' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 75, category: 'Otro' as Transaction['category'] }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'store-categories');
      const otro = result.categories.find(c => c.name === 'Otro');
      expect(otro).toBeDefined();
      // Cat5(100) + existing Otro(75) = 175
      expect(otro!.amounts[3]).toBe(175);
    });
  });

  describe('view mode support', () => {
    it('aggregates by store-groups', () => {
      const allTxs = [
        makeTx({ date: '2026-04-01', total: 500, category: 'Supermercado' as Transaction['category'] }),
        makeTx({ date: '2026-04-01', total: 300, category: 'Restaurante' as Transaction['category'] }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'store-groups');
      const foodDining = result.categories.find(c => c.name === 'food-dining');
      expect(foodDining).toBeDefined();
      expect(foodDining!.amounts[3]).toBe(800);
    });

    it('aggregates by item-categories', () => {
      const allTxs = [
        makeTx({
          date: '2026-04-01',
          total: 500,
          items: [
            { name: 'Milk', price: 300, category: 'Lácteos' },
            { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
          ],
        }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'item-categories');
      const lacteos = result.categories.find(c => c.name === 'Lácteos');
      expect(lacteos).toBeDefined();
      expect(lacteos!.amounts[3]).toBe(300);
    });

    it('aggregates by item-groups', () => {
      const allTxs = [
        makeTx({
          date: '2026-04-01',
          total: 500,
          items: [
            { name: 'Apple', price: 200, category: 'Frutas y Verduras' },
            { name: 'Steak', price: 300, category: 'Carnes y Mariscos' },
          ],
        }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'item-groups');
      const foodFresh = result.categories.find(c => c.name === 'food-fresh');
      expect(foodFresh).toBeDefined();
      expect(foodFresh!.amounts[3]).toBe(500);
    });
  });

  describe('edge cases', () => {
    it('handles empty transactions', () => {
      const result = computeBumpChartData([], selectedMonth, 'store-categories');
      expect(result.monthData).toHaveLength(4);
      expect(result.categories).toHaveLength(0);
    });

    it('handles single category (no Otro needed)', () => {
      const allTxs = [
        makeTx({ date: '2026-04-01', total: 1000, category: 'OnlyOne' as Transaction['category'] }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'store-categories');
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('OnlyOne');
    });

    it('amounts array has 4 entries per category', () => {
      const allTxs = [
        makeTx({ date: '2026-04-01', total: 500, category: 'Cat1' as Transaction['category'] }),
      ];

      const result = computeBumpChartData(allTxs, selectedMonth, 'store-categories');
      expect(result.categories[0].amounts).toHaveLength(4);
      expect(result.categories[0].ranks).toHaveLength(4);
    });
  });
});
