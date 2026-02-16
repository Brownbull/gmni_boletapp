/**
 * IconCategoryFilter (CategoryFilterDropdownMenu) Unit Tests
 *
 * Story 15-TD-4 Task 3: Basic render tests for IconCategoryFilter
 *
 * Tests only basic rendering: 3-tab layout, filter chips, clear button.
 * Does NOT test full filter application flows or drill-down state management
 * (IconCategoryFilter is 1,107 lines — deep tests deferred to dedicated story).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../setup/test-utils';
import { CategoryFilterDropdownMenu } from '../../../../../src/features/history/components/IconCategoryFilter';
import type { CategoryFilterDropdownMenuProps } from '../../../../../src/features/history/components/IconCategoryFilter';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('../../../../../src/config/categoryColors', () => ({
  getCategoryBackgroundAuto: () => '#f0f0f0',
  getStoreGroupColors: () => ({ bg: '#f0f0f0', fg: '#333', border: '#ccc' }),
  getItemGroupColors: () => ({ bg: '#f0f0f0', fg: '#333', border: '#ccc' }),
  ALL_STORE_CATEGORY_GROUPS: ['Essential', 'Lifestyle'],
  ALL_ITEM_CATEGORY_GROUPS: ['Fresh Food', 'Packaged Food'],
  expandStoreCategoryGroup: (g: string) => {
    const map: Record<string, string[]> = {
      Essential: ['Supermercado', 'Farmacia'],
      Lifestyle: ['Restaurante', 'Entretenimiento'],
    };
    return map[g] || [g];
  },
  expandItemCategoryGroup: (g: string) => {
    const map: Record<string, string[]> = {
      'Fresh Food': ['Carnes y Mariscos', 'Frutas y Verduras'],
      'Packaged Food': ['Snacks', 'Bebidas'],
    };
    return map[g] || [g];
  },
  getCurrentTheme: () => 'default',
  getCurrentMode: () => 'light',
}));

vi.mock('../../../../../src/utils/categoryEmoji', () => ({
  getCategoryEmoji: () => '🛒',
}));

vi.mock('../../../../../src/utils/categoryTranslations', () => ({
  translateStoreCategory: (cat: string) => cat,
  translateItemGroup: (g: string) => g,
  translateStoreCategoryGroup: (g: string) => g,
  translateItemCategoryGroup: (g: string) => g,
  getStoreCategoryGroupEmoji: () => '🏪',
  getItemCategoryGroupEmoji: () => '🍎',
}));

vi.mock('../../../../../src/hooks/useLocations', () => ({
  useLocationDisplay: () => ({
    getCountryName: (code: string) => code,
    getCityName: (code: string) => code,
  }),
}));

vi.mock('@features/history/components/CountryFlag', () => ({
  CountryFlag: ({ country }: { country: string }) => (
    <span data-testid={`flag-${country}`}>{country}</span>
  ),
}));

// =============================================================================
// Test Helpers
// =============================================================================

const baseState: CategoryFilterDropdownMenuProps['state'] = {
  level: 'all',
  selectedCategories: [],
  selectedItems: [],
};

const baseAvailableFilters: CategoryFilterDropdownMenuProps['availableFilters'] = {
  categories: ['Supermercado', 'Farmacia', 'Restaurante'],
  merchants: ['Lider', 'Jumbo'],
  countries: ['CL'],
  citiesByCountry: { CL: ['Santiago', 'Valparaiso'] },
};

function makeProps(overrides: Partial<CategoryFilterDropdownMenuProps> = {}): CategoryFilterDropdownMenuProps {
  return {
    state: baseState,
    dispatch: vi.fn(),
    availableFilters: baseAvailableFilters,
    t: (key: string) => key,
    onClose: vi.fn(),
    locale: 'es',
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('CategoryFilterDropdownMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<CategoryFilterDropdownMenu {...makeProps()} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders 3 tab buttons (Purchases, Products, Location)', () => {
      render(<CategoryFilterDropdownMenu {...makeProps()} />);

      // Tabs have aria-labels in Spanish by default
      expect(screen.getByLabelText('Filtrar por compras')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por productos')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por ubicación')).toBeInTheDocument();
    });

    it('renders tabs with English labels when locale is en', () => {
      render(<CategoryFilterDropdownMenu {...makeProps({ locale: 'en' })} />);

      expect(screen.getByLabelText('Filter by purchases')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by products')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by location')).toBeInTheDocument();
    });

    it('renders store category groups on first tab (default)', () => {
      render(<CategoryFilterDropdownMenu {...makeProps()} />);

      // Store groups should be rendered (Essential, Lifestyle from mock)
      // The groups are rendered as expandable sections with group names
      expect(screen.getByText('Essential')).toBeInTheDocument();
      expect(screen.getByText('Lifestyle')).toBeInTheDocument();
    });

    it('does not render clear button when no filter is active', () => {
      render(<CategoryFilterDropdownMenu {...makeProps()} />);

      // Clear button only shows when hasFilter is true (committedTransactions/Items/Locations > 0)
      expect(screen.queryByTitle('Limpiar filtros')).not.toBeInTheDocument();
    });

    it('renders clear button when a filter is active', () => {
      const activeState: CategoryFilterDropdownMenuProps['state'] = {
        level: 'category',
        category: 'Supermercado',
        selectedCategories: ['Supermercado'],
        selectedItems: [],
        drillDownPath: { storeCategory: 'Supermercado' },
      };

      render(<CategoryFilterDropdownMenu {...makeProps({ state: activeState })} />);

      const clearBtn = screen.getByTitle('Limpiar filtros');
      expect(clearBtn).toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('switches to products tab on click', () => {
      render(<CategoryFilterDropdownMenu {...makeProps()} />);

      const productsTab = screen.getByLabelText('Filtrar por productos');
      fireEvent.click(productsTab);

      // After switching to products tab, item groups appear (toSentenceCase applied)
      expect(screen.getByText('Fresh food')).toBeInTheDocument();
      expect(screen.getByText('Packaged food')).toBeInTheDocument();
    });

    it('switches to location tab on click', () => {
      render(<CategoryFilterDropdownMenu {...makeProps({ hasLocationFilter: false })} />);

      const locationTab = screen.getByLabelText('Filtrar por ubicación');
      fireEvent.click(locationTab);

      // After switching to location tab, countries should appear
      // CountryFlag mock renders flag-CL testid, country name also shows 'CL'
      expect(screen.getByTestId('flag-CL')).toBeInTheDocument();
    });
  });

  describe('clear action', () => {
    it('calls dispatch and onClose when clear button is clicked', () => {
      const dispatch = vi.fn();
      const onClose = vi.fn();

      const activeState: CategoryFilterDropdownMenuProps['state'] = {
        level: 'category',
        category: 'Supermercado',
        selectedCategories: ['Supermercado'],
        selectedItems: [],
        drillDownPath: { storeCategory: 'Supermercado' },
      };

      render(
        <CategoryFilterDropdownMenu
          {...makeProps({ state: activeState, dispatch, onClose })}
        />
      );

      const clearBtn = screen.getByTitle('Limpiar filtros');
      fireEvent.click(clearBtn);

      expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_CATEGORY' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_LOCATION' });
      expect(onClose).toHaveBeenCalledWith();
    });
  });
});
