/**
 * ChartModeToggle Integration Tests
 *
 * Tests for ChartModeToggle component integration with AnalyticsContext.
 * Verifies mode changes, state persistence, and Day level behavior.
 *
 * Story 7.4 - Chart Mode Toggle & Registry
 * AC #10, #11: Mode changes and persistence tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { ChartModeToggle } from '@features/analytics/components/ChartModeToggle';
import { useAnalyticsNavigation } from '@features/analytics/hooks/useAnalyticsNavigation';
import type { AnalyticsNavigationState, TemporalPosition } from '../../../src/types/analytics';

// ============================================================================
// Test Helpers
// ============================================================================

function renderWithProvider(
  ui: React.ReactElement,
  initialState?: AnalyticsNavigationState
) {
  return render(
    <AnalyticsProvider initialState={initialState}>
      {ui}
    </AnalyticsProvider>
  );
}

// State display component for testing
function StateDisplay() {
  const { chartMode, temporalLevel } = useAnalyticsNavigation();
  return (
    <div data-testid="state-display">
      <span data-testid="chart-mode">{chartMode}</span>
      <span data-testid="temporal-level">{temporalLevel}</span>
    </div>
  );
}

// Navigation component that can change temporal level
function TemporalNavigator() {
  const { dispatch, temporalLevel } = useAnalyticsNavigation();

  const goToDay = () => {
    dispatch({
      type: 'SET_TEMPORAL_LEVEL',
      payload: {
        level: 'day',
        year: '2024',
        quarter: 'Q4',
        month: '2024-10',
        week: 2,
        day: '2024-10-10',
      },
    });
  };

  const goToMonth = () => {
    dispatch({
      type: 'SET_TEMPORAL_LEVEL',
      payload: {
        level: 'month',
        year: '2024',
        quarter: 'Q4',
        month: '2024-10',
      },
    });
  };

  return (
    <div>
      <button onClick={goToDay} data-testid="go-to-day">Go to Day</button>
      <button onClick={goToMonth} data-testid="go-to-month">Go to Month</button>
      <span data-testid="current-level">{temporalLevel}</span>
    </div>
  );
}

// Default states
const yearState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'all' },
  chartMode: 'aggregation',
};

const comparisonState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'all' },
  chartMode: 'comparison',
};

const monthState: AnalyticsNavigationState = {
  temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
  category: { level: 'all' },
  chartMode: 'aggregation',
};

// ============================================================================
// AC #10: Mode changes dispatch action
// ============================================================================

describe('ChartModeToggle + Context Integration - AC #10', () => {
  it('clicking Comparison dispatches TOGGLE_CHART_MODE and updates context', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <StateDisplay />
      </>,
      yearState
    );

    // Initially aggregation
    expect(screen.getByTestId('chart-mode')).toHaveTextContent('aggregation');

    // Click comparison
    const comparisonButton = screen.getByTestId('chart-mode-comparison');
    await user.click(comparisonButton);

    // Context should now show comparison
    await waitFor(() => {
      expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');
    });
  });

  it('clicking Aggregation when in comparison mode updates context', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <StateDisplay />
      </>,
      comparisonState
    );

    // Initially comparison
    expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');

    // Click aggregation
    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    await user.click(aggregationButton);

    // Context should now show aggregation
    await waitFor(() => {
      expect(screen.getByTestId('chart-mode')).toHaveTextContent('aggregation');
    });
  });
});

// ============================================================================
// AC #11: Mode persists across temporal navigation
// ============================================================================

describe('ChartModeToggle + Context Integration - AC #11: Persistence', () => {
  it('mode persists when navigating temporal levels', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <TemporalNavigator />
        <StateDisplay />
      </>,
      yearState
    );

    // Switch to comparison mode
    const comparisonButton = screen.getByTestId('chart-mode-comparison');
    await user.click(comparisonButton);

    await waitFor(() => {
      expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');
    });

    // Navigate to month level
    const goToMonth = screen.getByTestId('go-to-month');
    await user.click(goToMonth);

    // Mode should still be comparison
    await waitFor(() => {
      expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');
      expect(screen.getByTestId('current-level')).toHaveTextContent('month');
    });
  });
});

// ============================================================================
// Day level toggle hiding and auto-switch
// ============================================================================

describe('ChartModeToggle + Context Integration - Day level behavior', () => {
  it('toggle disappears when navigating to Day level', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <TemporalNavigator />
      </>,
      monthState
    );

    // Toggle should be visible at month level
    expect(screen.getByRole('tablist')).toBeInTheDocument();

    // Navigate to day
    const goToDay = screen.getByTestId('go-to-day');
    await user.click(goToDay);

    // Toggle should disappear
    await waitFor(() => {
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });

  it('toggle reappears when navigating away from Day level', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <TemporalNavigator />
      </>,
      yearState
    );

    // Navigate to day
    await user.click(screen.getByTestId('go-to-day'));
    await waitFor(() => {
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    // Navigate back to month
    await user.click(screen.getByTestId('go-to-month'));
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  it('auto-switches to aggregation when navigating to Day while in comparison mode', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <TemporalNavigator />
        <StateDisplay />
      </>,
      comparisonState
    );

    // Verify we're in comparison mode
    expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');

    // Navigate to day
    await user.click(screen.getByTestId('go-to-day'));

    // Mode should auto-switch to aggregation
    await waitFor(() => {
      expect(screen.getByTestId('chart-mode')).toHaveTextContent('aggregation');
    });
  });
});

// ============================================================================
// Multiple toggle interactions
// ============================================================================

describe('ChartModeToggle + Context Integration - Multiple interactions', () => {
  it('handles rapid toggle clicks correctly', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <StateDisplay />
      </>,
      yearState
    );

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    const comparisonButton = screen.getByTestId('chart-mode-comparison');

    // Rapidly toggle
    await user.click(comparisonButton);
    await user.click(aggregationButton);
    await user.click(comparisonButton);

    // Final state should be comparison
    await waitFor(() => {
      expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');
    });
  });

  it('clicking same mode multiple times does not cause issues', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <StateDisplay />
      </>,
      yearState
    );

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');

    // Click same button multiple times
    await user.click(aggregationButton);
    await user.click(aggregationButton);
    await user.click(aggregationButton);

    // Should still be aggregation
    expect(screen.getByTestId('chart-mode')).toHaveTextContent('aggregation');
  });
});

// ============================================================================
// Keyboard interaction with context
// ============================================================================

describe('ChartModeToggle + Context Integration - Keyboard', () => {
  it('Enter key toggle updates context', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <StateDisplay />
      </>,
      yearState
    );

    // Focus comparison button
    const comparisonButton = screen.getByTestId('chart-mode-comparison');
    comparisonButton.focus();

    // Press Enter
    await user.keyboard('{Enter}');

    // Context should update
    await waitFor(() => {
      expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');
    });
  });

  it('Arrow key toggle updates context', async () => {
    const user = userEvent.setup();

    renderWithProvider(
      <>
        <ChartModeToggle />
        <StateDisplay />
      </>,
      yearState
    );

    // Focus aggregation button
    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    aggregationButton.focus();

    // Press ArrowRight to toggle
    await user.keyboard('{ArrowRight}');

    // Context should update
    await waitFor(() => {
      expect(screen.getByTestId('chart-mode')).toHaveTextContent('comparison');
    });
  });
});
