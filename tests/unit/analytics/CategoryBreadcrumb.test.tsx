/**
 * CategoryBreadcrumb Component Unit Tests
 *
 * Tests for the category filter navigation breadcrumb component.
 *
 * Story 7.3 - Category Breadcrumb Component
 * AC #1-#14: Complete acceptance criteria coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { CategoryBreadcrumb } from '@features/analytics/components/CategoryBreadcrumb';
import { useAnalyticsNavigation } from '@features/analytics/hooks/useAnalyticsNavigation';
import type { AnalyticsNavigationState } from '../../../src/types/analytics';

// ============================================================================
// Test Helpers
// ============================================================================

function createWrapper(initialState?: AnalyticsNavigationState) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnalyticsProvider initialState={initialState}>
        {children}
      </AnalyticsProvider>
    );
  };
}

function renderWithProvider(
  ui: React.ReactElement,
  initialState?: AnalyticsNavigationState
) {
  return render(ui, { wrapper: createWrapper(initialState) });
}

// Default states for testing
const allCategoriesState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'all' },
  chartMode: 'aggregation',
};

const categoryState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'category', category: 'Food' },
  chartMode: 'aggregation',
};

const groupState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'group', category: 'Food', group: 'Groceries' },
  chartMode: 'aggregation',
};

const subcategoryState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'subcategory', category: 'Food', group: 'Groceries', subcategory: 'Meats' },
  chartMode: 'aggregation',
};

const withTemporalFilter: AnalyticsNavigationState = {
  temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
  category: { level: 'category', category: 'Food' },
  chartMode: 'aggregation',
};

// ============================================================================
// AC #1: No Filter State Tests
// ============================================================================

describe('CategoryBreadcrumb - AC #1: No filter shows "All"', () => {
  // Story 7.18 extension: Icon-only buttons with aria-label for accessibility
  it('shows "All" in aria-label when no filter is active', () => {
    renderWithProvider(<CategoryBreadcrumb locale="en" />, allCategoriesState);

    expect(screen.getByRole('navigation', { name: 'Category filter' })).toBeInTheDocument();
    // Story 7.18: Icon-only button, label is in aria-label
    expect(screen.getByRole('button', { name: /Category filter: All/i })).toBeInTheDocument();
  });

  it('shows "Todo" in aria-label for Spanish locale', () => {
    renderWithProvider(<CategoryBreadcrumb locale="es" />, allCategoriesState);

    // Story 7.18: Icon-only button, label is in aria-label
    expect(screen.getByRole('button', { name: /Category filter: Todo/i })).toBeInTheDocument();
  });

  it('displays Tag icon', () => {
    const { container } = renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    // Lucide icons render as SVG - Story 7.18: icon-only button
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  // Story 7.18 extension: ChevronDown removed - icon-only buttons
  it('displays only Tag icon (no chevron)', () => {
    const { container } = renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    // Should have only one SVG: Tag (ChevronDown removed)
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(1);
  });
});

// ============================================================================
// AC #2: Filtered State Shows Deepest Level
// ============================================================================

describe('CategoryBreadcrumb - AC #2: Filtered state shows deepest level', () => {
  // Story 7.18 extension: Icon-only buttons with aria-label for accessibility
  it('shows category name in aria-label when at category level', () => {
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    expect(screen.getByRole('button', { name: /Category filter: Food/i })).toBeInTheDocument();
  });

  it('shows group name in aria-label when at group level', () => {
    renderWithProvider(<CategoryBreadcrumb />, groupState);

    expect(screen.getByRole('button', { name: /Category filter: Groceries/i })).toBeInTheDocument();
  });

  it('shows subcategory name in aria-label when at subcategory level', () => {
    renderWithProvider(<CategoryBreadcrumb />, subcategoryState);

    expect(screen.getByRole('button', { name: /Category filter: Meats/i })).toBeInTheDocument();
  });
});

// ============================================================================
// AC #3: Dropdown Expansion Tests
// ============================================================================

describe('CategoryBreadcrumb - AC #3: Dropdown shows full filter path', () => {
  it('shows dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows full path in dropdown: All > Food > Groceries > Meats', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4); // All, Food, Groceries, Meats
  });

  it('shows only All Categories when no filter active', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, allCategoriesState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1); // Only "All Categories"
  });
});

// ============================================================================
// AC #4: All Categories Always at Top
// ============================================================================

describe('CategoryBreadcrumb - AC #4: "All Categories" always at top', () => {
  it('first dropdown option is "All Categories"', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('All Categories');
  });

  it('first dropdown option is "Todas las Categorías" in Spanish', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="es" />, categoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('Todas las Categorías');
  });
});

// ============================================================================
// AC #5: Each Level is Tappable
// ============================================================================

describe('CategoryBreadcrumb - AC #5: Each level is tappable', () => {
  it('all dropdown items are buttons', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, subcategoryState);

    const toggleButton = screen.getByRole('button');
    await user.click(toggleButton);

    const options = screen.getAllByRole('option');
    options.forEach((option) => {
      expect(option.tagName).toBe('BUTTON');
    });
  });
});

// ============================================================================
// AC #6: Current Level Highlighting
// ============================================================================

describe('CategoryBreadcrumb - AC #6: Current level is highlighted', () => {
  it('current level has distinct styling (bold)', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, groupState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    const lastOption = options[options.length - 1]; // Current level is always last

    expect(lastOption).toHaveClass('font-semibold');
  });

  it('current level has aria-selected=true', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, groupState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    const lastOption = options[options.length - 1];

    expect(lastOption).toHaveAttribute('aria-selected', 'true');
  });

  it('ancestor levels have aria-selected=false', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    // First three options (All, Food, Groceries) should not be selected
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
  });
});

// ============================================================================
// AC #7: Tapping "All Categories" Clears Filter
// ============================================================================

describe('CategoryBreadcrumb - AC #7: "All Categories" clears filter', () => {
  it('dispatches CLEAR_CATEGORY_FILTER when tapping All Categories', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, categoryState);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);

    // Click on "All Categories" option
    const options = screen.getAllByRole('option');
    await user.click(options[0]);

    // Dropdown should close and aria-label should change to "All" - Story 7.18: icon-only buttons
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Category filter: All/i })).toBeInTheDocument();
    });
  });
});

// ============================================================================
// AC #8: Tapping Ancestor Updates Filter Preserving Temporal
// ============================================================================

describe('CategoryBreadcrumb - AC #8: Ancestor tap preserves temporal position', () => {
  it('navigating to ancestor updates category filter', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, subcategoryState);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);

    // Click on "Groceries" (group level, index 2)
    const options = screen.getAllByRole('option');
    await user.click(options[2]); // All=0, Food=1, Groceries=2

    // Should show "Groceries" in aria-label - Story 7.18: icon-only buttons
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Category filter: Groceries/i })).toBeInTheDocument();
    });
  });

  it('navigating category does not modify temporal position', async () => {
    const user = userEvent.setup();

    // Test component that displays both temporal and category state
    function TestComponentWithTemporal() {
      const { temporal, category } = useAnalyticsNavigation();
      return (
        <div>
          <CategoryBreadcrumb locale="en" />
          <span data-testid="temporal-level">{temporal.level}</span>
          <span data-testid="temporal-month">{temporal.month || 'none'}</span>
          <span data-testid="category-level">{category.level}</span>
        </div>
      );
    }

    renderWithProvider(<TestComponentWithTemporal />, withTemporalFilter);

    // Initially, temporal is at month level
    expect(screen.getByTestId('temporal-level')).toHaveTextContent('month');
    expect(screen.getByTestId('temporal-month')).toHaveTextContent('2024-10');

    // Navigate category to All
    const button = screen.getByRole('button');
    await user.click(button);
    const options = screen.getAllByRole('option');
    await user.click(options[0]); // Click "All Categories"

    // Temporal should still be at month level (dual-axis independence)
    expect(screen.getByTestId('temporal-level')).toHaveTextContent('month');
    expect(screen.getByTestId('temporal-month')).toHaveTextContent('2024-10');
    expect(screen.getByTestId('category-level')).toHaveTextContent('all');
  });
});

// ============================================================================
// AC #9: Outside Click Closes Dropdown
// ============================================================================

describe('CategoryBreadcrumb - AC #9: Outside click closes dropdown', () => {
  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click outside (on document body)
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('does not close when clicking inside dropdown', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);

    // Click inside the dropdown (on the listbox)
    const listbox = screen.getByRole('listbox');
    fireEvent.mouseDown(listbox);

    // Dropdown should still be visible
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

// ============================================================================
// AC #10: Escape Key Closes Dropdown
// ============================================================================

describe('CategoryBreadcrumb - AC #10: Escape closes dropdown', () => {
  it('closes dropdown when pressing Escape', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('returns focus to button after Escape', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(button).toHaveFocus();
    });
  });
});

// ============================================================================
// AC #11: Immediate Breadcrumb Update
// ============================================================================

describe('CategoryBreadcrumb - AC #11: Immediate state updates', () => {
  it('breadcrumb updates immediately after navigation', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, subcategoryState);

    // Initially shows "Meats" in aria-label - Story 7.18: icon-only buttons
    expect(screen.getByRole('button', { name: /Category filter: Meats/i })).toBeInTheDocument();

    // Navigate to Food level
    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    await user.click(options[1]); // Click "Food"

    // Should immediately show "Food" in aria-label
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Category filter: Food/i })).toBeInTheDocument();
    });
  });
});

// ============================================================================
// AC #12: Keyboard Accessibility Tests
// ============================================================================

describe('CategoryBreadcrumb - AC #12: Keyboard accessibility', () => {
  it('button receives focus on Tab', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    // Tab into the component
    await user.tab();

    const button = screen.getByRole('button');
    expect(button).toHaveFocus();
  });

  it('Enter opens dropdown', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('Space opens dropdown', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard(' ');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('ArrowUp navigates to previous option', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    // Focus starts at current level (Meats - index 3)
    // Press ArrowUp to go to Groceries (index 2)
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      // Story 7.18: Button is icon-only, check aria-label for current filter
      expect(screen.getByRole('button', { name: /Category filter: Groceries/i })).toBeInTheDocument();
    });
  });

  it('ArrowDown navigates to next option (capped at last)', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    // Focus starts at current level (Meats - index 3, last option)
    // ArrowDown should stay at last option
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Should still be at Meats (pressing down at last item stays at last)
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      // Story 7.18: Button is icon-only, check aria-label for current filter
      expect(screen.getByRole('button', { name: /Category filter: Meats/i })).toBeInTheDocument();
    });
  });

  it('Home key goes to first option', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    await user.keyboard('{Home}');
    await user.keyboard('{Enter}');

    // Story 7.18: Button is icon-only, check aria-label for current filter ("All" when cleared)
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Category filter: All/i })).toBeInTheDocument();
    });
  });

  it('End key goes to last option', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb locale="en" />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    // First go to a different option
    await user.keyboard('{Home}');

    // Then press End to go back to current level
    await user.keyboard('{End}');
    await user.keyboard('{Enter}');

    // Should still be at Meats level
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      // Story 7.18: Button is icon-only, check aria-label for current filter
      expect(screen.getByRole('button', { name: /Category filter: Meats/i })).toBeInTheDocument();
    });
  });
});

// ============================================================================
// AC #13: Touch Target Tests
// ============================================================================

describe('CategoryBreadcrumb - AC #13: Touch targets', () => {
  it('button has 40px dimensions (w-10 h-10) for compact layout', () => {
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    const button = screen.getByRole('button');
    // Story 7.18: Icon-only button with transparent background for compact layout
    expect(button).toHaveClass('w-10');
    expect(button).toHaveClass('h-10');
  });

  it('dropdown options have min-h-11 class', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    options.forEach((option) => {
      expect(option).toHaveClass('min-h-11');
    });
  });
});

// ============================================================================
// AC #14: ARIA Attributes Tests
// ============================================================================

describe('CategoryBreadcrumb - AC #14: ARIA attributes', () => {
  it('container has role="navigation"', () => {
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('container has aria-label="Category filter"', () => {
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    expect(screen.getByRole('navigation', { name: 'Category filter' })).toBeInTheDocument();
  });

  it('button has aria-expanded=false when collapsed', () => {
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('button has aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('button has aria-haspopup="listbox"', () => {
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('dropdown has role="listbox"', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, categoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('options have role="option"', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, subcategoryState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(4);
  });
});

// ============================================================================
// Theme Tests
// ============================================================================

describe('CategoryBreadcrumb - Theme Support', () => {
  it('applies light theme classes by default', () => {
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    const button = screen.getByRole('button');
    // Story 7.18: Transparent background with hover effect
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('text-slate-600');
  });

  it('applies dark theme classes when theme="dark"', () => {
    renderWithProvider(<CategoryBreadcrumb theme="dark" />, allCategoriesState);

    const button = screen.getByRole('button');
    // Story 7.18: Transparent background with hover effect
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('text-slate-300');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('CategoryBreadcrumb - Edge Cases', () => {
  // Story 7.18 extension: ChevronDown removed - icon-only buttons
  // This test is obsolete as there's no chevron to rotate
  it('dropdown opens on click (no chevron animation)', async () => {
    const user = userEvent.setup();
    renderWithProvider(<CategoryBreadcrumb />, allCategoriesState);

    const button = screen.getByRole('button');
    await user.click(button);

    // Dropdown should be open
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('handles all four category levels', async () => {
    const user = userEvent.setup();

    // Test subcategory state (deepest level) - Story 7.18: check aria-label
    const { rerender } = renderWithProvider(<CategoryBreadcrumb locale="en" />, subcategoryState);
    expect(screen.getByRole('button', { name: /Category filter: Meats/i })).toBeInTheDocument();

    // Open and verify all 4 levels shown
    const button = screen.getByRole('button');
    await user.click(button);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('All Categories');
    expect(options[1]).toHaveTextContent('Food');
    expect(options[2]).toHaveTextContent('Groceries');
    expect(options[3]).toHaveTextContent('Meats');
  });

  it('handles navigating through all levels', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const { category } = useAnalyticsNavigation();
      return (
        <div>
          <CategoryBreadcrumb locale="en" />
          <span data-testid="level">{category.level}</span>
          <span data-testid="category">{category.category || 'none'}</span>
          <span data-testid="group">{category.group || 'none'}</span>
          <span data-testid="subcategory">{category.subcategory || 'none'}</span>
        </div>
      );
    }

    renderWithProvider(<TestComponent />, subcategoryState);

    // Start at subcategory
    expect(screen.getByTestId('level')).toHaveTextContent('subcategory');

    // Navigate to group
    let button = screen.getByRole('button');
    await user.click(button);
    let options = screen.getAllByRole('option');
    await user.click(options[2]); // Groceries

    expect(screen.getByTestId('level')).toHaveTextContent('group');
    expect(screen.getByTestId('group')).toHaveTextContent('Groceries');
    expect(screen.getByTestId('subcategory')).toHaveTextContent('none');

    // Navigate to category
    button = screen.getByRole('button');
    await user.click(button);
    options = screen.getAllByRole('option');
    await user.click(options[1]); // Food

    expect(screen.getByTestId('level')).toHaveTextContent('category');
    expect(screen.getByTestId('category')).toHaveTextContent('Food');
    expect(screen.getByTestId('group')).toHaveTextContent('none');

    // Navigate to all
    button = screen.getByRole('button');
    await user.click(button);
    options = screen.getAllByRole('option');
    await user.click(options[0]); // All Categories

    expect(screen.getByTestId('level')).toHaveTextContent('all');
    expect(screen.getByTestId('category')).toHaveTextContent('none');
  });
});
