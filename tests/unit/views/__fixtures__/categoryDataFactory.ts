/**
 * Shared test fixture: CategoryData factory
 * Story 15-TD-25: Extracted from TD-21 test files
 * Story 15-TD-28: Added makeCategoryDataPartial for overrides pattern
 *
 * Used by: navigationHelpers, drillDownHelpers, helpers, DonutChart
 */
import type { CategoryData } from '@/views/TrendsView/types';

export function makeCategoryData(name: string, value: number, percent = 50): CategoryData {
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

/**
 * Overrides-based factory for component rendering tests.
 * Provides rich defaults suitable for visual components like DonutChart.
 */
export function makeCategoryDataPartial(overrides: Partial<CategoryData> = {}): CategoryData {
  return {
    name: 'Supermercado',
    value: 50000,
    count: 10,
    itemCount: 25,
    color: '#4CAF50',
    fgColor: '#ffffff',
    percent: 50,
    ...overrides,
  };
}
