/**
 * GroupedCategoriesSection Unit Tests
 *
 * Story 15b-2p: Original tests for Store/Item variants
 * Story TD-15b-25: Updated for consolidated generic component with config
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../setup/test-utils';
import {
  GroupedCategoriesSection,
  storeGroupConfig,
  itemGroupConfig,
} from '../../../../../src/features/history/components/GroupedCategoriesSection';
import type {
  GroupedCategoriesSectionProps,
  GroupedCategoriesSectionConfig,
} from '../../../../../src/features/history/components/GroupedCategoriesSection';

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

// =============================================================================
// Helpers
// =============================================================================

function makeProps<TGroup extends string>(
  config: GroupedCategoriesSectionConfig<TGroup>,
  overrides: Partial<GroupedCategoriesSectionProps<TGroup>> = {},
): GroupedCategoriesSectionProps<TGroup> {
  return {
    config,
    selectedCategories: new Set<string>(),
    onCategoryToggle: vi.fn(),
    onGroupToggle: vi.fn(),
    lang: 'es',
    ...overrides,
  };
}

// =============================================================================
// Store config tests
// =============================================================================

describe('GroupedCategoriesSection with storeGroupConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all store category groups with sentence-case headers', () => {
    render(<GroupedCategoriesSection {...makeProps(storeGroupConfig)} />);

    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.getByText('Lifestyle')).toBeInTheDocument();
  });

  it('renders categories within expanded groups', () => {
    render(<GroupedCategoriesSection {...makeProps(storeGroupConfig)} />);

    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.getByText('Farmacia')).toBeInTheDocument();
    expect(screen.getByText('Restaurante')).toBeInTheDocument();
    expect(screen.getByText('Entretenimiento')).toBeInTheDocument();
  });

  it('collapses a group when its header is clicked', () => {
    render(<GroupedCategoriesSection {...makeProps(storeGroupConfig)} />);

    fireEvent.click(screen.getByText('Essential'));

    expect(screen.queryByText('Supermercado')).not.toBeInTheDocument();
    expect(screen.queryByText('Farmacia')).not.toBeInTheDocument();
    expect(screen.getByText('Restaurante')).toBeInTheDocument();
  });

  it('calls onCategoryToggle when a category button is clicked', () => {
    const onCategoryToggle = vi.fn();
    render(<GroupedCategoriesSection {...makeProps(storeGroupConfig, { onCategoryToggle })} />);

    fireEvent.click(screen.getByText('Supermercado'));
    expect(onCategoryToggle).toHaveBeenCalledWith('Supermercado');
  });

  it('calls onGroupToggle when the group checkbox is clicked', () => {
    const onGroupToggle = vi.fn();
    render(<GroupedCategoriesSection {...makeProps(storeGroupConfig, { onGroupToggle })} />);

    const essentialToggle = screen.getByLabelText('Toggle Essential');
    fireEvent.click(essentialToggle);
    expect(onGroupToggle).toHaveBeenCalledWith(
      'Essential',
      ['Supermercado', 'Farmacia'],
      false,
    );
  });

  it('handles empty group gracefully (zero categories)', () => {
    const emptyConfig = {
      ...storeGroupConfig,
      expandGroup: () => [] as string[],
    };
    render(<GroupedCategoriesSection {...makeProps(emptyConfig)} />);

    // Group headers render but no category buttons inside
    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.queryByText('Supermercado')).not.toBeInTheDocument();
  });

  it('shows selected state for categories in selectedCategories', () => {
    const selected = new Set(['Supermercado']);
    const { container } = render(
      <GroupedCategoriesSection {...makeProps(storeGroupConfig, { selectedCategories: selected })} />,
    );

    const buttons = container.querySelectorAll('button');
    const supermercadoBtn = Array.from(buttons).find(
      btn => btn.textContent?.includes('Supermercado'),
    );
    expect(supermercadoBtn).toBeDefined();
    expect(supermercadoBtn?.style.border).toContain('2px solid');
  });
});

// =============================================================================
// Item config tests
// =============================================================================

describe('GroupedCategoriesSection with itemGroupConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all item category groups with sentence-case headers', () => {
    render(<GroupedCategoriesSection {...makeProps(itemGroupConfig)} />);

    expect(screen.getByText('Fresh Food')).toBeInTheDocument();
    expect(screen.getByText('Packaged Food')).toBeInTheDocument();
  });

  it('renders categories within expanded groups', () => {
    render(<GroupedCategoriesSection {...makeProps(itemGroupConfig)} />);

    expect(screen.getByText('Carnes y Mariscos')).toBeInTheDocument();
    expect(screen.getByText('Frutas y Verduras')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
    expect(screen.getByText('Bebidas')).toBeInTheDocument();
  });

  it('collapses a group when its header is clicked', () => {
    render(<GroupedCategoriesSection {...makeProps(itemGroupConfig)} />);

    fireEvent.click(screen.getByText('Fresh Food'));

    expect(screen.queryByText('Carnes y Mariscos')).not.toBeInTheDocument();
    expect(screen.queryByText('Frutas y Verduras')).not.toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
  });

  it('calls onCategoryToggle when a category button is clicked', () => {
    const onCategoryToggle = vi.fn();
    render(<GroupedCategoriesSection {...makeProps(itemGroupConfig, { onCategoryToggle })} />);

    fireEvent.click(screen.getByText('Snacks'));
    expect(onCategoryToggle).toHaveBeenCalledWith('Snacks');
  });

  it('calls onGroupToggle when the group checkbox is clicked', () => {
    const onGroupToggle = vi.fn();
    render(<GroupedCategoriesSection {...makeProps(itemGroupConfig, { onGroupToggle })} />);

    const freshFoodToggle = screen.getByLabelText('Toggle Fresh Food');
    fireEvent.click(freshFoodToggle);
    expect(onGroupToggle).toHaveBeenCalledWith(
      'Fresh Food',
      ['Carnes y Mariscos', 'Frutas y Verduras'],
      false,
    );
  });
});
