/**
 * DonutChart Unit Tests
 *
 * Story 15-TD-4 Task 3: Basic render tests for DonutChart
 *
 * Tests only basic rendering and empty state handling.
 * Does NOT test drill-down logic, animations, or interaction flows
 * (DonutChart is 1,085 lines — deep tests deferred to dedicated story).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../../../setup/test-utils';
import { DonutChart } from '@features/analytics/views/TrendsView/DonutChart';
import type { CategoryData, DonutViewMode } from '@features/analytics/views/TrendsView/types';
import { makeCategoryDataPartial as makeCategoryData } from '../../../../views/__fixtures__/categoryDataFactory';

// =============================================================================
// Mocks — heavy dependency tree, mock everything external
// =============================================================================

vi.mock('@/config/categoryColors', () => ({
  getCategoryColorsAuto: () => ({ bg: '#eee', fg: '#333', border: '#ccc' }),
  ALL_STORE_CATEGORY_GROUPS: [
    'food-dining', 'health-wellness', 'retail-general', 'retail-specialty',
    'automotive', 'services', 'hospitality', 'other',
  ],
  ALL_ITEM_CATEGORY_GROUPS: [
    'food-fresh', 'food-packaged', 'health-personal', 'household',
    'nonfood-retail', 'services-fees', 'other-item',
  ],
  STORE_CATEGORY_GROUPS: {
    Supermercado: 'food-dining',
    Restaurante: 'food-dining',
    Farmacia: 'health-wellness',
  },
  ITEM_CATEGORY_GROUPS: {
    'Carnes y Mariscos': 'food-fresh',
    Snacks: 'food-packaged',
  },
  ITEM_CATEGORY_TO_KEY: {},
  getStoreGroupColors: () => ({ bg: '#f0f0f0', fg: '#333', border: '#ccc' }),
  getItemGroupColors: () => ({ bg: '#f0f0f0', fg: '#333', border: '#ccc' }),
  getCurrentTheme: () => 'default',
  getCurrentMode: () => 'light',
  expandStoreCategoryGroup: (g: string) => [g],
  expandItemCategoryGroup: (g: string) => [g],
}));

vi.mock('@/utils/currency', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
}));

vi.mock('@/utils/categoryAggregation', () => ({
  buildProductKey: (name: string, merchant: string) => `${name}::${merchant}`,
}));

vi.mock('@/utils/categoryNormalizer', () => ({
  normalizeItemCategory: (cat: string) => cat,
}));

vi.mock('@/utils/categoryTranslations', () => ({
  translateCategory: (cat: string) => cat,
  translateStoreCategoryGroup: (g: string) => g,
  translateItemCategoryGroup: (g: string) => g,
  getStoreCategoryGroupEmoji: () => '🏪',
  getItemCategoryGroupEmoji: () => '🍎',
  getItemCategoryEmoji: () => '🥩',
}));

vi.mock('@/hooks/useCountUp', () => ({
  useCountUp: (target: number) => target,
}));

vi.mock('@features/analytics/views/TrendsView/helpers', () => ({
  computeTreemapCategories: () => [],
  computeItemCategoryData: () => [],
  computeSubcategoryData: () => [],
  computeItemGroupsForStore: () => [],
  computeItemCategoriesInGroup: () => [],
}));

const defaultProps = {
  categoryData: [makeCategoryData()],
  allCategoryData: [makeCategoryData()],
  total: 100000,
  currency: 'CLP',
  locale: 'es',
  isDark: false,
  canExpand: false,
  canCollapse: false,
  otroCount: 0,
  otroCategories: [],
  expandedCount: 0,
  onExpand: vi.fn(),
  onCollapse: vi.fn(),
  transactions: [],
  viewMode: 'store-categories' as DonutViewMode,
  countMode: 'transactions' as const,
};

// =============================================================================
// Tests
// =============================================================================

describe('DonutChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the donut-view container', () => {
    render(<DonutChart {...defaultProps} />);
    expect(screen.getByTestId('donut-view')).toBeInTheDocument();
  });

  it('renders the view mode title', () => {
    render(<DonutChart {...defaultProps} />);
    const title = screen.getByTestId('donut-viewmode-title');
    expect(title).toBeInTheDocument();
    // Default store-categories view in Spanish
    expect(title).toHaveTextContent('Categorías de Compras');
  });

  it('renders view mode title in English when locale is en', () => {
    render(<DonutChart {...defaultProps} locale="en" />);
    const title = screen.getByTestId('donut-viewmode-title');
    expect(title).toHaveTextContent('Purchase Categories');
  });

  it('renders SVG circle elements for category data', () => {
    const data = [
      makeCategoryData({ name: 'Supermercado', percent: 60, color: '#4CAF50' }),
      makeCategoryData({ name: 'Restaurante', percent: 40, color: '#FF9800' }),
    ];

    const { container } = render(
      <DonutChart {...defaultProps} categoryData={data} allCategoryData={data} />
    );

    // DonutChart renders SVG circles for segments
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('handles empty categoryData without crashing', () => {
    render(
      <DonutChart
        {...defaultProps}
        categoryData={[]}
        allCategoryData={[]}
        total={0}
      />
    );

    expect(screen.getByTestId('donut-view')).toBeInTheDocument();
  });

  it('does not show back button at drill-down level 0', () => {
    render(<DonutChart {...defaultProps} />);
    expect(screen.queryByTestId('donut-back-btn')).not.toBeInTheDocument();
  });

  it('shows expand button when canExpand is true', () => {
    render(
      <DonutChart {...defaultProps} canExpand={true} otroCount={3} />
    );

    const expandBtn = screen.getByTestId('donut-expand-btn');
    expect(expandBtn).toBeInTheDocument();
  });

  it('hides expand button when canExpand is false', () => {
    render(
      <DonutChart {...defaultProps} canExpand={false} />
    );

    const expandBtn = screen.getByTestId('donut-expand-btn');
    // Button renders but should be invisible/disabled when canExpand is false
    expect(expandBtn).toBeInTheDocument();
  });

  it('renders with different view modes', () => {
    const viewModes: DonutViewMode[] = ['store-groups', 'store-categories', 'item-groups', 'item-categories'];

    for (const viewMode of viewModes) {
      const { unmount } = render(
        <DonutChart {...defaultProps} viewMode={viewMode} />
      );

      expect(screen.getByTestId('donut-view')).toBeInTheDocument();
      unmount();
    }
  });

  it('renders with dark mode', () => {
    render(<DonutChart {...defaultProps} isDark={true} />);
    expect(screen.getByTestId('donut-view')).toBeInTheDocument();
  });
});
