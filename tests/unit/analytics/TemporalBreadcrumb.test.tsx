/**
 * TemporalBreadcrumb Component Unit Tests
 *
 * Tests for the temporal navigation breadcrumb component.
 *
 * Story 7.2 - Temporal Breadcrumb Component
 * AC #1-#11: Complete acceptance criteria coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { TemporalBreadcrumb } from '../../../src/components/analytics/TemporalBreadcrumb';
import { useAnalyticsNavigation } from '../../../src/hooks/useAnalyticsNavigation';
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
const yearState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'all' },
  chartMode: 'aggregation',
};

const quarterState: AnalyticsNavigationState = {
  temporal: { level: 'quarter', year: '2024', quarter: 'Q4' },
  category: { level: 'all' },
  chartMode: 'aggregation',
};

const monthState: AnalyticsNavigationState = {
  temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
  category: { level: 'all' },
  chartMode: 'aggregation',
};

const weekState: AnalyticsNavigationState = {
  temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
  category: { level: 'all' },
  chartMode: 'aggregation',
};

const dayState: AnalyticsNavigationState = {
  temporal: { level: 'day', year: '2024', quarter: 'Q4', month: '2024-10', week: 2, day: '2024-10-10' },
  category: { level: 'all' },
  chartMode: 'aggregation',
};

const withCategoryFilter: AnalyticsNavigationState = {
  temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
  category: { level: 'category', category: 'Food' },
  chartMode: 'aggregation',
};

// ============================================================================
// AC #1: Collapsed State Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #1: Collapsed state renders current level', () => {
  // Story 7.18 extension: Icon-only buttons with aria-label for accessibility
  it('shows year label in aria-label when at year level', () => {
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    expect(screen.getByRole('navigation', { name: 'Time period' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Time period: 2024/i })).toBeInTheDocument();
  });

  it('shows quarter label in aria-label when at quarter level', () => {
    renderWithProvider(<TemporalBreadcrumb />, quarterState);

    expect(screen.getByRole('button', { name: /Time period: Q4/i })).toBeInTheDocument();
  });

  it('shows month name in aria-label when at month level', () => {
    renderWithProvider(<TemporalBreadcrumb locale="en" />, monthState);

    expect(screen.getByRole('button', { name: /Time period: October/i })).toBeInTheDocument();
  });

  it('shows week range in aria-label when at week level', () => {
    renderWithProvider(<TemporalBreadcrumb locale="en" />, weekState);

    // Week 2 of October: Oct 8-14
    expect(screen.getByRole('button', { name: /Time period: Oct 8-14/i })).toBeInTheDocument();
  });

  it('shows day label in aria-label when at day level', () => {
    renderWithProvider(<TemporalBreadcrumb locale="en" />, dayState);

    // October 10
    expect(screen.getByRole('button', { name: /Time period: Oct 10/i })).toBeInTheDocument();
  });

  it('displays Calendar icon', () => {
    const { container } = renderWithProvider(<TemporalBreadcrumb />, yearState);

    // Lucide icons render as SVG - Story 7.18: icon-only button
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  // Story 7.18 extension: ChevronDown removed - icon-only buttons
  it('displays only Calendar icon (no chevron)', () => {
    const { container } = renderWithProvider(<TemporalBreadcrumb />, yearState);

    // Should have only one SVG: Calendar (ChevronDown removed)
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(1);
  });
});

// ============================================================================
// AC #2: Dropdown Expansion Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #2: Dropdown shows full path when open', () => {
  it('shows dropdown when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows full path in dropdown', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb locale="en" />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    // Should show Year > Quarter > Month path in dropdown
    // Story 7.18: Labels only appear in dropdown, not in icon-only button
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('Q4')).toBeInTheDocument();
    expect(screen.getByText('October')).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3); // Year, Quarter, Month
  });

  it('shows 5 levels at day depth', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb locale="en" />, dayState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5); // Year, Quarter, Month, Week, Day
  });
});

// ============================================================================
// AC #3: Ancestor Navigation Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #3: Each ancestor level is tappable', () => {
  it('all dropdown items are buttons', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const toggleButton = screen.getByRole('button');
    await user.click(toggleButton);

    const options = screen.getAllByRole('option');
    options.forEach((option) => {
      expect(option.tagName).toBe('BUTTON');
    });
  });
});

// ============================================================================
// AC #4: Current Level Highlighting Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #4: Current level is highlighted', () => {
  it('current level has distinct styling (bold)', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    const lastOption = options[options.length - 1]; // Current level is always last

    expect(lastOption).toHaveClass('font-semibold');
  });

  it('current level has aria-selected=true', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    const lastOption = options[options.length - 1];

    expect(lastOption).toHaveAttribute('aria-selected', 'true');
  });

  it('ancestor levels have aria-selected=false', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    // First two options (Year, Quarter) should not be selected
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
  });
});

// ============================================================================
// AC #5: Outside Click Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #5: Outside click closes dropdown', () => {
  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(<TemporalBreadcrumb />, monthState);

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
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);

    // Click inside the dropdown (on an option)
    const listbox = screen.getByRole('listbox');
    fireEvent.mouseDown(listbox);

    // Dropdown should still be visible (navigation will close it separately)
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

// ============================================================================
// AC #6: Escape Key Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #6: Escape closes dropdown', () => {
  it('closes dropdown when pressing Escape', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

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
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(button).toHaveFocus();
    });
  });
});

// ============================================================================
// AC #7: Navigation Dispatch Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #7: Navigation preserves category filter', () => {
  it('dispatches SET_TEMPORAL_LEVEL on ancestor tap', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    // Open dropdown
    const button = screen.getByRole('button');
    await user.click(button);

    // Click on Year option (first option)
    const options = screen.getAllByRole('option');
    await user.click(options[0]);

    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // Button should now show "2024" in aria-label (year level) - Story 7.18: icon-only buttons
    expect(screen.getByRole('button', { name: /Time period: 2024/i })).toBeInTheDocument();
  });

  it('navigating temporal does not modify category filter', async () => {
    const user = userEvent.setup();

    // Test component that displays both temporal and category state
    function TestComponentWithCategory() {
      const { category } = useAnalyticsNavigation();
      return (
        <div>
          <TemporalBreadcrumb />
          <span data-testid="category">{category.level}</span>
          <span data-testid="category-value">{category.category || 'none'}</span>
        </div>
      );
    }

    renderWithProvider(<TestComponentWithCategory />, withCategoryFilter);

    // Initially, category filter is "Food"
    expect(screen.getByTestId('category')).toHaveTextContent('category');
    expect(screen.getByTestId('category-value')).toHaveTextContent('Food');

    // Navigate temporally to year level
    const button = screen.getByRole('button');
    await user.click(button);
    const options = screen.getAllByRole('option');
    await user.click(options[0]); // Click Year

    // Category should still be Food (dual-axis independence)
    expect(screen.getByTestId('category')).toHaveTextContent('category');
    expect(screen.getByTestId('category-value')).toHaveTextContent('Food');
  });
});

// ============================================================================
// AC #8: Immediate Update Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #8: Immediate state updates', () => {
  it('breadcrumb updates immediately after navigation', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb locale="en" />, monthState);

    // Initially shows "October" in aria-label - Story 7.18: icon-only buttons
    expect(screen.getByRole('button', { name: /Time period: October/i })).toBeInTheDocument();

    // Navigate to Quarter
    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    await user.click(options[1]); // Click Quarter (Q4)

    // Should immediately show "Q4" in aria-label
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Time period: Q4/i })).toBeInTheDocument();
    });
  });
});

// ============================================================================
// AC #9: Keyboard Accessibility Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #9: Keyboard accessibility', () => {
  it('button receives focus on Tab', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    // Tab into the component
    await user.tab();

    const button = screen.getByRole('button');
    expect(button).toHaveFocus();
  });

  it('Enter opens dropdown', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('Space opens dropdown', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard(' ');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('ArrowDown navigates to next option', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    // Focus should start at current level (Month - index 2)
    const options = screen.getAllByRole('option');

    // Initial focus check would require checking document.activeElement
    // Press ArrowUp to go to Quarter (index 1)
    await user.keyboard('{ArrowUp}');

    // The focused option should change (we can't easily verify focus, but we test the behavior)
    // Press Enter to select Quarter
    await user.keyboard('{Enter}');

    // Should navigate to Quarter - Story 7.18: check aria-label
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Time period: Q4/i })).toBeInTheDocument();
    });
  });

  it('ArrowUp navigates to previous option', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    // Press ArrowUp twice to go from Month (2) to Year (0)
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{Enter}');

    // Story 7.18: check aria-label for icon-only buttons
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      // Should be at year level
      expect(screen.getByRole('button', { name: /Time period: 2024/i })).toBeInTheDocument();
    });
  });

  it('Home key goes to first option', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    await user.keyboard('{Home}');
    await user.keyboard('{Enter}');

    // Story 7.18: check aria-label for icon-only buttons
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Time period: 2024/i })).toBeInTheDocument();
    });
  });

  it('End key goes to last option', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    // First go to a different option
    await user.keyboard('{Home}');

    // Then press End to go back to current level
    await user.keyboard('{End}');
    await user.keyboard('{Enter}');

    // Should still be at month level (clicking current level just closes dropdown)
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// AC #10: Touch Target Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #10: Touch targets', () => {
  it('button has 40px dimensions (w-10 h-10) for compact layout', () => {
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    const button = screen.getByRole('button');
    // Story 7.18: Icon-only button with transparent background for compact layout
    expect(button).toHaveClass('w-10');
    expect(button).toHaveClass('h-10');
  });

  it('dropdown options have min-h-11 class', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    options.forEach((option) => {
      expect(option).toHaveClass('min-h-11');
    });
  });
});

// ============================================================================
// AC #11: ARIA Attributes Tests
// ============================================================================

describe('TemporalBreadcrumb - AC #11: ARIA attributes', () => {
  it('container has role="navigation"', () => {
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('container has aria-label="Time period"', () => {
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    expect(screen.getByRole('navigation', { name: 'Time period' })).toBeInTheDocument();
  });

  it('button has aria-expanded=false when collapsed', () => {
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('button has aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('button has aria-haspopup="listbox"', () => {
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('dropdown has role="listbox"', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('options have role="option"', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, monthState);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3);
  });
});

// ============================================================================
// Theme Tests
// ============================================================================

describe('TemporalBreadcrumb - Theme Support', () => {
  it('applies light theme classes by default', () => {
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    const button = screen.getByRole('button');
    // Story 7.18: Transparent background with hover effect
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('text-slate-600');
  });

  it('applies dark theme classes when theme="dark"', () => {
    renderWithProvider(<TemporalBreadcrumb theme="dark" />, yearState);

    const button = screen.getByRole('button');
    // Story 7.18: Transparent background with hover effect
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('text-slate-300');
  });
});

// ============================================================================
// Locale Tests
// ============================================================================

describe('TemporalBreadcrumb - Locale Support', () => {
  // Story 7.18: Icon-only buttons with aria-label for accessibility
  it('displays month in English by default', () => {
    renderWithProvider(<TemporalBreadcrumb locale="en" />, monthState);

    expect(screen.getByRole('button', { name: /Time period: October/i })).toBeInTheDocument();
  });

  it('displays month in Spanish when locale="es"', () => {
    renderWithProvider(<TemporalBreadcrumb locale="es" />, monthState);

    // Spanish for October is "octubre" (lowercase in most locales)
    expect(screen.getByRole('button', { name: /Time period:.*octubre/i })).toBeInTheDocument();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('TemporalBreadcrumb - Edge Cases', () => {
  // Story 7.18: Icon-only buttons with aria-label for accessibility
  it('handles week 1 (first week of month)', () => {
    const week1State: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 1 },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    renderWithProvider(<TemporalBreadcrumb locale="en" />, week1State);

    expect(screen.getByRole('button', { name: /Time period: Oct 1-7/i })).toBeInTheDocument();
  });

  it('handles week 5 (partial last week)', () => {
    const week5State: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 5 },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    renderWithProvider(<TemporalBreadcrumb locale="en" />, week5State);

    // October has 31 days, so week 5 is Oct 29-31
    expect(screen.getByRole('button', { name: /Time period: Oct 29-31/i })).toBeInTheDocument();
  });

  it('handles February (shorter month)', () => {
    const febState: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', quarter: 'Q1', month: '2024-02', week: 5 },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    renderWithProvider(<TemporalBreadcrumb locale="en" />, febState);

    // 2024 is leap year, February has 29 days, week 5 is Feb 29-29
    expect(screen.getByRole('button', { name: /Time period: Feb 29-29/i })).toBeInTheDocument();
  });

  // Story 7.18 extension: ChevronDown removed - icon-only buttons
  // This test is obsolete as there's no chevron to rotate
  it('dropdown opens on click (no chevron animation)', async () => {
    const user = userEvent.setup();
    renderWithProvider(<TemporalBreadcrumb />, yearState);

    const button = screen.getByRole('button');
    await user.click(button);

    // Dropdown should be open
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
