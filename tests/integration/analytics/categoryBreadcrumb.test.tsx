/**
 * CategoryBreadcrumb Integration Tests
 *
 * Tests for breadcrumb interaction with AnalyticsContext.
 *
 * Story 7.3 - Category Breadcrumb Component
 * AC #7, #8, #11: Navigation preserves temporal, state updates immediately
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { CategoryBreadcrumb } from '../../../src/components/analytics/CategoryBreadcrumb';
import { useAnalyticsNavigation } from '../../../src/hooks/useAnalyticsNavigation';
import type { AnalyticsNavigationState } from '../../../src/types/analytics';

// ============================================================================
// Test Component for Observing State
// ============================================================================

/**
 * Component that displays the full analytics state for testing.
 * Shows temporal level, category filter, and chart mode.
 */
function AnalyticsStateDisplay() {
  const {
    temporal,
    category,
    chartMode,
    temporalLevel,
    categoryLevel,
    isYearLevel,
    hasCategoryFilter,
  } = useAnalyticsNavigation();

  return (
    <div data-testid="state-display">
      <span data-testid="temporal-level">{temporalLevel}</span>
      <span data-testid="temporal-year">{temporal.year}</span>
      <span data-testid="temporal-quarter">{temporal.quarter || 'none'}</span>
      <span data-testid="temporal-month">{temporal.month || 'none'}</span>
      <span data-testid="temporal-week">{temporal.week !== undefined ? temporal.week : 'none'}</span>
      <span data-testid="temporal-day">{temporal.day || 'none'}</span>
      <span data-testid="category-level">{categoryLevel}</span>
      <span data-testid="category-value">{category.category || 'none'}</span>
      <span data-testid="category-group">{category.group || 'none'}</span>
      <span data-testid="category-subcategory">{category.subcategory || 'none'}</span>
      <span data-testid="chart-mode">{chartMode}</span>
      <span data-testid="is-year-level">{isYearLevel.toString()}</span>
      <span data-testid="has-category-filter">{hasCategoryFilter.toString()}</span>
    </div>
  );
}

// ============================================================================
// Test Helper
// ============================================================================

interface TestSetupProps {
  initialState?: AnalyticsNavigationState;
  theme?: string;
  locale?: string;
}

function renderWithStateDisplay({
  initialState,
  theme = 'light',
  locale = 'en',
}: TestSetupProps = {}) {
  return render(
    <AnalyticsProvider initialState={initialState}>
      <div>
        <CategoryBreadcrumb theme={theme} locale={locale} />
        <AnalyticsStateDisplay />
      </div>
    </AnalyticsProvider>
  );
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('CategoryBreadcrumb + AnalyticsContext Integration', () => {
  describe('AC #7 & #8: Temporal filter preserved when category changes', () => {
    it('navigating from subcategory to "All" preserves temporal filter', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
        category: { level: 'subcategory', category: 'Food', group: 'Groceries', subcategory: 'Meats' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState, locale: 'en' });

      // Verify initial state
      expect(screen.getByTestId('temporal-level')).toHaveTextContent('month');
      expect(screen.getByTestId('temporal-month')).toHaveTextContent('2024-10');
      expect(screen.getByTestId('category-level')).toHaveTextContent('subcategory');
      expect(screen.getByTestId('category-subcategory')).toHaveTextContent('Meats');

      // Navigate to "All Categories"
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // All Categories

      // Verify category changed but temporal preserved (dual-axis independence)
      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('month');
        expect(screen.getByTestId('temporal-month')).toHaveTextContent('2024-10');
        expect(screen.getByTestId('category-level')).toHaveTextContent('all');
        expect(screen.getByTestId('category-value')).toHaveTextContent('none');
      });
    });

    it('navigating from group to category preserves week temporal level', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
        category: { level: 'group', category: 'Food', group: 'Groceries' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState });

      // Verify initial state
      expect(screen.getByTestId('temporal-level')).toHaveTextContent('week');
      expect(screen.getByTestId('temporal-week')).toHaveTextContent('2');
      expect(screen.getByTestId('category-group')).toHaveTextContent('Groceries');

      // Navigate to category level
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[1]); // Food (category level)

      // Verify temporal preserved but category changed
      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('week');
        expect(screen.getByTestId('temporal-week')).toHaveTextContent('2');
        expect(screen.getByTestId('category-level')).toHaveTextContent('category');
        expect(screen.getByTestId('category-value')).toHaveTextContent('Food');
        expect(screen.getByTestId('category-group')).toHaveTextContent('none');
      });
    });

    it('clearing category filter preserves day temporal level', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'day', year: '2024', quarter: 'Q4', month: '2024-10', week: 2, day: '2024-10-10' },
        category: { level: 'category', category: 'Food' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState, locale: 'en' });

      expect(screen.getByTestId('temporal-level')).toHaveTextContent('day');
      expect(screen.getByTestId('temporal-day')).toHaveTextContent('2024-10-10');
      expect(screen.getByTestId('has-category-filter')).toHaveTextContent('true');

      // Clear category filter
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // All Categories

      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('day');
        expect(screen.getByTestId('temporal-day')).toHaveTextContent('2024-10-10');
        expect(screen.getByTestId('has-category-filter')).toHaveTextContent('false');
      });
    });
  });

  describe('AC #11: State updates reflect immediately in breadcrumb', () => {
    it('breadcrumb updates immediately when navigating up category hierarchy', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'year', year: '2024' },
        category: { level: 'subcategory', category: 'Food', group: 'Groceries', subcategory: 'Meats' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState, locale: 'en' });

      // Initially at subcategory level - verify via state display (Story 7.9: icon-only breadcrumb)
      expect(screen.getByTestId('category-level')).toHaveTextContent('subcategory');
      expect(screen.getByTestId('category-subcategory')).toHaveTextContent('Meats');

      // Navigate to Group (Groceries) by opening dropdown and selecting
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[2]); // Groceries

      // State updates immediately - verify via state display
      await waitFor(() => {
        expect(screen.getByTestId('category-level')).toHaveTextContent('group');
        expect(screen.getByTestId('category-group')).toHaveTextContent('Groceries');
        expect(screen.getByTestId('category-subcategory')).toHaveTextContent('none');
      });
    });

    it('context state reflects breadcrumb navigation immediately', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'year', year: '2024' },
        category: { level: 'subcategory', category: 'Food', group: 'Groceries', subcategory: 'Meats' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState, locale: 'en' });

      // Initially at subcategory level
      expect(screen.getByTestId('category-level')).toHaveTextContent('subcategory');
      expect(screen.getByTestId('category-subcategory')).toHaveTextContent('Meats');
      expect(screen.getByTestId('has-category-filter')).toHaveTextContent('true');

      // Navigate to All Categories
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // All Categories

      // State should update immediately
      await waitFor(() => {
        expect(screen.getByTestId('category-level')).toHaveTextContent('all');
        expect(screen.getByTestId('category-value')).toHaveTextContent('none');
        expect(screen.getByTestId('category-group')).toHaveTextContent('none');
        expect(screen.getByTestId('category-subcategory')).toHaveTextContent('none');
        expect(screen.getByTestId('has-category-filter')).toHaveTextContent('false');
      });
    });
  });

  describe('Hierarchical Navigation', () => {
    it('can navigate through full category hierarchy: All > Category > Group > Subcategory', async () => {
      const user = userEvent.setup();

      // Start at subcategory and navigate up through all levels
      renderWithStateDisplay({
        initialState: {
          temporal: { level: 'year', year: '2024' },
          category: { level: 'subcategory', category: 'Food', group: 'Groceries', subcategory: 'Meats' },
          chartMode: 'aggregation',
        },
        locale: 'en',
      });

      // Navigate to Group
      let button = screen.getByRole('button');
      await user.click(button);
      let options = screen.getAllByRole('option');
      await user.click(options[2]); // Groceries

      await waitFor(() => {
        expect(screen.getByTestId('category-level')).toHaveTextContent('group');
      });

      // Navigate to Category
      button = screen.getByRole('button');
      await user.click(button);
      options = screen.getAllByRole('option');
      await user.click(options[1]); // Food

      await waitFor(() => {
        expect(screen.getByTestId('category-level')).toHaveTextContent('category');
      });

      // Navigate to All
      button = screen.getByRole('button');
      await user.click(button);
      options = screen.getAllByRole('option');
      await user.click(options[0]); // All Categories

      await waitFor(() => {
        expect(screen.getByTestId('category-level')).toHaveTextContent('all');
        expect(screen.getByTestId('has-category-filter')).toHaveTextContent('false');
      });
    });

    it('child levels are cleared when navigating to parent', async () => {
      const user = userEvent.setup();

      renderWithStateDisplay({
        initialState: {
          temporal: { level: 'year', year: '2024' },
          category: { level: 'subcategory', category: 'Food', group: 'Groceries', subcategory: 'Meats' },
          chartMode: 'aggregation',
        },
      });

      // Full state initially
      expect(screen.getByTestId('category-value')).toHaveTextContent('Food');
      expect(screen.getByTestId('category-group')).toHaveTextContent('Groceries');
      expect(screen.getByTestId('category-subcategory')).toHaveTextContent('Meats');

      // Navigate to Category level (should clear group and subcategory)
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[1]); // Food

      await waitFor(() => {
        expect(screen.getByTestId('category-level')).toHaveTextContent('category');
        expect(screen.getByTestId('category-value')).toHaveTextContent('Food');
        expect(screen.getByTestId('category-group')).toHaveTextContent('none');
        expect(screen.getByTestId('category-subcategory')).toHaveTextContent('none');
      });
    });
  });

  describe('Chart Mode Independence', () => {
    it('chart mode remains unchanged when navigating categories', async () => {
      const user = userEvent.setup();

      renderWithStateDisplay({
        initialState: {
          temporal: { level: 'year', year: '2024' },
          category: { level: 'category', category: 'Food' },
          chartMode: 'comparison',
        },
        locale: 'en',
      });

      expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');

      // Navigate to All Categories
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // All Categories

      // Chart mode should remain comparison
      await waitFor(() => {
        expect(screen.getByTestId('category-level')).toHaveTextContent('all');
        expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');
      });
    });
  });

  describe('Dual-Axis Independence (cross-axis)', () => {
    it('category and temporal are fully independent', async () => {
      const user = userEvent.setup();

      renderWithStateDisplay({
        initialState: {
          temporal: { level: 'quarter', year: '2024', quarter: 'Q4' },
          category: { level: 'group', category: 'Transport', group: 'Fuel' },
          chartMode: 'aggregation',
        },
      });

      // Verify both axes have non-default values
      expect(screen.getByTestId('temporal-level')).toHaveTextContent('quarter');
      expect(screen.getByTestId('temporal-quarter')).toHaveTextContent('Q4');
      expect(screen.getByTestId('category-level')).toHaveTextContent('group');
      expect(screen.getByTestId('category-value')).toHaveTextContent('Transport');
      expect(screen.getByTestId('category-group')).toHaveTextContent('Fuel');

      // Clear category filter
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // All Categories

      // Temporal should be completely unaffected
      await waitFor(() => {
        expect(screen.getByTestId('category-level')).toHaveTextContent('all');
        // Temporal unchanged
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('quarter');
        expect(screen.getByTestId('temporal-quarter')).toHaveTextContent('Q4');
        expect(screen.getByTestId('temporal-year')).toHaveTextContent('2024');
      });
    });
  });
});
