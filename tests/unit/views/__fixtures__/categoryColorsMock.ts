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
  Supermarket: 'supermercados',
  Restaurant: 'restaurantes',
  Pharmacy: 'salud-bienestar',
  Hardware: 'tiendas-generales',
};

export const MOCK_ITEM_CATEGORY_GROUPS: Record<string, string> = {
  Produce: 'food-fresh',
  MeatSeafood: 'food-fresh',
  DairyEggs: 'food-packaged',
  Beverages: 'food-packaged',
  Snacks: 'food-packaged',
};

export const MOCK_ITEM_CATEGORY_TO_KEY: Record<string, string> = {
  Produce: 'Produce',
  MeatSeafood: 'MeatSeafood',
  DairyEggs: 'DairyEggs',
  Beverages: 'Beverages',
  Snacks: 'Snacks',
};

export const MOCK_ALL_STORE_CATEGORY_GROUPS = [
  'supermercados', 'restaurantes', 'comercio-barrio', 'vivienda',
  'salud-bienestar', 'tiendas-generales', 'tiendas-especializadas',
  'transporte-vehiculo', 'educacion', 'servicios-finanzas',
  'entretenimiento-hospedaje', 'otros',
];

export const MOCK_ALL_ITEM_CATEGORY_GROUPS = [
  'food-fresh', 'food-packaged', 'food-prepared',
  'salud-cuidado', 'hogar', 'productos-generales',
  'servicios-cargos', 'vicios', 'otros-item',
];
