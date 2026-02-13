/**
 * Shared test fixture: Category color mock data
 * Story 15-TD-25: Extracted from 4 TD-21 test files
 *
 * Used by: periodComparisonHelpers, drillDownHelpers, categoryDataHelpers, chartDataHelpers
 *
 * Usage in test files:
 *   vi.mock('@/config/categoryColors', async () => {
 *     const fixtures = await import('../__fixtures__/categoryColorsMock');
 *     return { STORE_CATEGORY_GROUPS: fixtures.MOCK_STORE_CATEGORY_GROUPS, ... };
 *   });
 */

export const MOCK_STORE_CATEGORY_GROUPS: Record<string, string> = {
  Supermercado: 'food-dining',
  Restaurante: 'food-dining',
  Farmacia: 'health-wellness',
  Ferretería: 'retail-general',
};

export const MOCK_ITEM_CATEGORY_GROUPS: Record<string, string> = {
  'Frutas y Verduras': 'food-fresh',
  'Carnes y Mariscos': 'food-fresh',
  Lácteos: 'food-packaged',
  Bebidas: 'food-packaged',
  Snacks: 'food-packaged',
};

export const MOCK_ITEM_CATEGORY_TO_KEY: Record<string, string> = {
  'Frutas y Verduras': 'Frutas y Verduras',
  'Carnes y Mariscos': 'Carnes y Mariscos',
  Lácteos: 'Lácteos',
  Bebidas: 'Bebidas',
  Snacks: 'Snacks',
};

export const MOCK_ALL_STORE_CATEGORY_GROUPS = [
  'food-dining', 'health-wellness', 'retail-general',
  'retail-specialty', 'automotive', 'services', 'hospitality', 'other',
];

export const MOCK_ALL_ITEM_CATEGORY_GROUPS = [
  'food-fresh', 'food-packaged', 'health-personal',
  'household', 'nonfood-retail', 'services-fees', 'other-item',
];
