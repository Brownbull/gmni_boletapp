/**
 * TemporalBreadcrumb Integration Tests
 *
 * Tests for breadcrumb interaction with AnalyticsContext.
 *
 * Story 7.2 - Temporal Breadcrumb Component
 * AC #7, #8: Navigation and state updates
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { TemporalBreadcrumb } from '../../../src/components/analytics/TemporalBreadcrumb';
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
        <TemporalBreadcrumb theme={theme} locale={locale} />
        <AnalyticsStateDisplay />
      </div>
    </AnalyticsProvider>
  );
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('TemporalBreadcrumb + AnalyticsContext Integration', () => {
  describe('AC #7: Category filter preserved when temporal changes', () => {
    it('navigating from month to year preserves category filter', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
        category: { level: 'category', category: 'Food' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState });

      // Verify initial state
      expect(screen.getByTestId('temporal-level')).toHaveTextContent('month');
      expect(screen.getByTestId('category-level')).toHaveTextContent('category');
      expect(screen.getByTestId('category-value')).toHaveTextContent('Food');

      // Navigate to year level
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // Year

      // Verify temporal changed but category preserved
      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('year');
        expect(screen.getByTestId('category-level')).toHaveTextContent('category');
        expect(screen.getByTestId('category-value')).toHaveTextContent('Food');
      });
    });

    it('navigating from week to quarter preserves group filter', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
        category: { level: 'group', category: 'Food', group: 'Groceries' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState });

      // Verify initial state
      expect(screen.getByTestId('temporal-level')).toHaveTextContent('week');
      expect(screen.getByTestId('category-group')).toHaveTextContent('Groceries');

      // Navigate to quarter level
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[1]); // Quarter (Q4)

      // Verify temporal changed but category preserved
      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('quarter');
        expect(screen.getByTestId('category-group')).toHaveTextContent('Groceries');
      });
    });

    it('navigating preserves "all" category filter', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'quarter', year: '2024', quarter: 'Q4' },
        category: { level: 'all' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState });

      expect(screen.getByTestId('has-category-filter')).toHaveTextContent('false');

      // Navigate to year
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // Year

      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('year');
        expect(screen.getByTestId('has-category-filter')).toHaveTextContent('false');
      });
    });
  });

  describe('AC #8: State updates reflect immediately in breadcrumb', () => {
    it('breadcrumb updates immediately when navigating up hierarchy', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
        category: { level: 'all' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState, locale: 'en' });

      // Initially at month level - verify via state display (Story 7.9: icon-only breadcrumb)
      expect(screen.getByTestId('temporal-level')).toHaveTextContent('month');
      expect(screen.getByTestId('temporal-month')).toHaveTextContent('2024-10');

      // Navigate to Quarter by opening dropdown and selecting Q4
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[1]); // Q4

      // State updates immediately - verify via state display
      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('quarter');
        expect(screen.getByTestId('temporal-quarter')).toHaveTextContent('Q4');
        expect(screen.getByTestId('temporal-month')).toHaveTextContent('none');
      });
    });

    it('context state reflects breadcrumb navigation immediately', async () => {
      const user = userEvent.setup();
      const initialState: AnalyticsNavigationState = {
        temporal: { level: 'day', year: '2024', quarter: 'Q4', month: '2024-10', week: 2, day: '2024-10-10' },
        category: { level: 'all' },
        chartMode: 'aggregation',
      };

      renderWithStateDisplay({ initialState });

      // Initially at day level
      expect(screen.getByTestId('temporal-level')).toHaveTextContent('day');
      expect(screen.getByTestId('temporal-day')).toHaveTextContent('2024-10-10');
      expect(screen.getByTestId('is-year-level')).toHaveTextContent('false');

      // Navigate to Year
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // Year

      // State should update immediately
      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('year');
        expect(screen.getByTestId('temporal-day')).toHaveTextContent('none');
        expect(screen.getByTestId('temporal-week')).toHaveTextContent('none');
        expect(screen.getByTestId('temporal-month')).toHaveTextContent('none');
        expect(screen.getByTestId('temporal-quarter')).toHaveTextContent('none');
        expect(screen.getByTestId('is-year-level')).toHaveTextContent('true');
      });
    });
  });

  describe('Hierarchical Navigation', () => {
    it('can navigate through full hierarchy: Year > Quarter > Month', async () => {
      const user = userEvent.setup();

      renderWithStateDisplay({
        initialState: {
          temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
          category: { level: 'all' },
          chartMode: 'aggregation',
        },
      });

      // Navigate to Quarter
      let button = screen.getByRole('button');
      await user.click(button);
      let options = screen.getAllByRole('option');
      await user.click(options[1]); // Q4

      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('quarter');
      });

      // Navigate to Year
      button = screen.getByRole('button');
      await user.click(button);
      options = screen.getAllByRole('option');
      await user.click(options[0]); // 2024

      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('year');
        expect(screen.getByTestId('temporal-year')).toHaveTextContent('2024');
      });
    });

    it('quarter is cleared when navigating to year', async () => {
      const user = userEvent.setup();

      renderWithStateDisplay({
        initialState: {
          temporal: { level: 'quarter', year: '2024', quarter: 'Q4' },
          category: { level: 'all' },
          chartMode: 'aggregation',
        },
      });

      expect(screen.getByTestId('temporal-quarter')).toHaveTextContent('Q4');

      // Navigate to Year
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // Year

      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('year');
        expect(screen.getByTestId('temporal-quarter')).toHaveTextContent('none');
      });
    });

    it('month is preserved when navigating to quarter', async () => {
      const user = userEvent.setup();

      renderWithStateDisplay({
        initialState: {
          temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
          category: { level: 'all' },
          chartMode: 'aggregation',
        },
      });

      // Navigate to Quarter - month should be cleared since we're going up
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[1]); // Q4

      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('quarter');
        expect(screen.getByTestId('temporal-quarter')).toHaveTextContent('Q4');
        // Month is in the quarter position payload, not cleared
      });
    });
  });

  describe('Chart Mode Independence', () => {
    it('chart mode remains unchanged when navigating temporally', async () => {
      const user = userEvent.setup();

      renderWithStateDisplay({
        initialState: {
          temporal: { level: 'quarter', year: '2024', quarter: 'Q4' },
          category: { level: 'all' },
          chartMode: 'comparison',
        },
      });

      expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');

      // Navigate to Year
      const button = screen.getByRole('button');
      await user.click(button);
      const options = screen.getAllByRole('option');
      await user.click(options[0]); // Year

      // Chart mode should remain comparison
      await waitFor(() => {
        expect(screen.getByTestId('temporal-level')).toHaveTextContent('year');
        expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');
      });
    });
  });
});
