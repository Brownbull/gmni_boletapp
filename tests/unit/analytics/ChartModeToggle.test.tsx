/**
 * ChartModeToggle Component Unit Tests
 *
 * Tests for the chart mode toggle component that switches between
 * Aggregation and Comparison chart modes.
 *
 * Story 7.4 - Chart Mode Toggle & Registry
 * AC #1, #8, #10-#15: Complete acceptance criteria coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { ChartModeToggle } from '@features/analytics/components/ChartModeToggle';
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

const comparisonModeState: AnalyticsNavigationState = {
  temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
  category: { level: 'all' },
  chartMode: 'comparison',
};

const dayComparisonState: AnalyticsNavigationState = {
  temporal: { level: 'day', year: '2024', quarter: 'Q4', month: '2024-10', week: 2, day: '2024-10-10' },
  category: { level: 'all' },
  chartMode: 'comparison',
};

// ============================================================================
// AC #1: Toggle visible at non-Day temporal levels
// ============================================================================

describe('ChartModeToggle - AC #1: Toggle visible on Year/Quarter/Month/Week', () => {
  it('renders toggle at year level', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    expect(screen.getByRole('tablist', { name: 'Chart display mode' })).toBeInTheDocument();
    expect(screen.getByTestId('chart-mode-aggregation')).toBeInTheDocument();
    expect(screen.getByTestId('chart-mode-comparison')).toBeInTheDocument();
  });

  it('renders toggle at quarter level', () => {
    renderWithProvider(<ChartModeToggle />, quarterState);

    expect(screen.getByRole('tablist', { name: 'Chart display mode' })).toBeInTheDocument();
  });

  it('renders toggle at month level', () => {
    renderWithProvider(<ChartModeToggle />, monthState);

    expect(screen.getByRole('tablist', { name: 'Chart display mode' })).toBeInTheDocument();
  });

  it('renders toggle at week level', () => {
    renderWithProvider(<ChartModeToggle />, weekState);

    expect(screen.getByRole('tablist', { name: 'Chart display mode' })).toBeInTheDocument();
  });
});

// ============================================================================
// AC #8: Toggle hidden at Day level
// ============================================================================

describe('ChartModeToggle - AC #8: Hidden at Day level', () => {
  it('does not render toggle at day level', () => {
    renderWithProvider(<ChartModeToggle />, dayState);

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chart-mode-aggregation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chart-mode-comparison')).not.toBeInTheDocument();
  });

  it('returns null component at day level', () => {
    const { container } = renderWithProvider(<ChartModeToggle />, dayState);

    expect(container.firstChild).toBeNull();
  });
});

// ============================================================================
// AC #2, #3: Mode changes chart display
// ============================================================================

describe('ChartModeToggle - AC #2, #3: Mode toggle functionality', () => {
  it('shows Aggregation mode options', () => {
    renderWithProvider(<ChartModeToggle locale="en" />, yearState);

    expect(screen.getByText('Aggregation')).toBeInTheDocument();
    expect(screen.getByText('Comparison')).toBeInTheDocument();
  });

  it('highlights active mode (aggregation)', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    const comparisonButton = screen.getByTestId('chart-mode-comparison');

    expect(aggregationButton).toHaveAttribute('aria-selected', 'true');
    expect(comparisonButton).toHaveAttribute('aria-selected', 'false');
  });

  it('highlights active mode (comparison)', () => {
    renderWithProvider(<ChartModeToggle />, comparisonModeState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    const comparisonButton = screen.getByTestId('chart-mode-comparison');

    expect(aggregationButton).toHaveAttribute('aria-selected', 'false');
    expect(comparisonButton).toHaveAttribute('aria-selected', 'true');
  });
});

// ============================================================================
// AC #10: Toggle switches chart within 300ms
// ============================================================================

describe('ChartModeToggle - AC #10: Dispatches TOGGLE_CHART_MODE', () => {
  it('toggles to comparison mode when clicking Comparison', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ChartModeToggle />, yearState);

    const comparisonButton = screen.getByTestId('chart-mode-comparison');
    await user.click(comparisonButton);

    // After toggle, comparison should be selected
    await waitFor(() => {
      expect(comparisonButton).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('toggles to aggregation mode when clicking Aggregation', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ChartModeToggle />, comparisonModeState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    await user.click(aggregationButton);

    await waitFor(() => {
      expect(aggregationButton).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('does not toggle when clicking already active mode', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');

    // Click already-active aggregation
    await user.click(aggregationButton);

    // Should still be aggregation
    expect(aggregationButton).toHaveAttribute('aria-selected', 'true');
  });
});

// ============================================================================
// AC #11: Mode persists across navigation
// ============================================================================

describe('ChartModeToggle - AC #11: Mode persists in session', () => {
  it('maintains comparison mode after re-render', () => {
    const { rerender } = renderWithProvider(<ChartModeToggle />, comparisonModeState);

    const comparisonButton = screen.getByTestId('chart-mode-comparison');
    expect(comparisonButton).toHaveAttribute('aria-selected', 'true');

    // Re-render with same state
    rerender(
      <AnalyticsProvider initialState={comparisonModeState}>
        <ChartModeToggle />
      </AnalyticsProvider>
    );

    expect(screen.getByTestId('chart-mode-comparison')).toHaveAttribute('aria-selected', 'true');
  });
});

// ============================================================================
// AC #12: Pill-style segmented control per UX spec
// ============================================================================

describe('ChartModeToggle - AC #12: Outlined segmented control (Story 7.9)', () => {
  it('renders as an outlined container', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const tablist = screen.getByRole('tablist');
    // Story 7.9: Changed from pill-style (rounded-full) to outlined (rounded-lg)
    expect(tablist).toHaveClass('rounded-lg');
  });

  it('buttons have rounded-md class for segmented style', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    // Story 7.9: Changed from rounded-full to rounded-md for outlined style
    expect(aggregationButton).toHaveClass('rounded-md');
  });
});

// ============================================================================
// AC #13: Touch targets (44x44px minimum)
// ============================================================================

describe('ChartModeToggle - AC #13: Touch targets', () => {
  it('buttons have min-h-11 for 44px height', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    expect(aggregationButton).toHaveClass('min-h-11');
  });
});

// ============================================================================
// AC #14: Keyboard accessibility
// ============================================================================

describe('ChartModeToggle - AC #14: Keyboard accessibility', () => {
  it('toggles receives focus on Tab', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ChartModeToggle />, yearState);

    // Tab into the toggle
    await user.tab();

    // Aggregation should be focused (it has tabIndex 0)
    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    expect(document.activeElement).toBe(aggregationButton);
  });

  it('Enter key toggles mode', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ChartModeToggle />, yearState);

    // Focus comparison button
    const comparisonButton = screen.getByTestId('chart-mode-comparison');
    comparisonButton.focus();

    // Press Enter
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(comparisonButton).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('Space key toggles mode', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ChartModeToggle />, yearState);

    // Focus comparison button
    const comparisonButton = screen.getByTestId('chart-mode-comparison');
    comparisonButton.focus();

    // Press Space
    await user.keyboard(' ');

    await waitFor(() => {
      expect(comparisonButton).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('Arrow keys toggle mode', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    aggregationButton.focus();

    // Press ArrowRight to toggle
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      const comparisonButton = screen.getByTestId('chart-mode-comparison');
      expect(comparisonButton).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('focus ring visible on keyboard focus', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    expect(aggregationButton).toHaveClass('focus-visible:ring-2');
    // Focus ring uses theme-aware offset, not hardcoded blue-500 anymore
    expect(aggregationButton).toHaveClass('focus-visible:ring-offset-2');
  });
});

// ============================================================================
// AC #15: ARIA attributes
// ============================================================================

describe('ChartModeToggle - AC #15: ARIA attributes', () => {
  it('container has role="tablist"', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('container has aria-label', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Chart display mode');
  });

  it('buttons have role="tab"', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
  });

  it('active button has aria-selected=true', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    expect(aggregationButton).toHaveAttribute('aria-selected', 'true');
  });

  it('inactive button has aria-selected=false', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const comparisonButton = screen.getByTestId('chart-mode-comparison');
    expect(comparisonButton).toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has tabindex=0, inactive has tabindex=-1', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    const comparisonButton = screen.getByTestId('chart-mode-comparison');

    expect(aggregationButton).toHaveAttribute('tabindex', '0');
    expect(comparisonButton).toHaveAttribute('tabindex', '-1');
  });
});

// ============================================================================
// Theme support
// ============================================================================

describe('ChartModeToggle - Theme support', () => {
  it('renders in light theme by default', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const tablist = screen.getByRole('tablist');
    // Story 7.9: Outlined style - light mode uses isDark conditional
    expect(tablist).toHaveClass('bg-white');
    expect(tablist).toHaveClass('border-slate-300');
  });

  it('renders in dark theme when specified', () => {
    renderWithProvider(<ChartModeToggle theme="dark" />, yearState);

    const tablist = screen.getByRole('tablist');
    // Story 7.9: Outlined style - dark mode uses isDark conditional
    expect(tablist).toHaveClass('bg-slate-800');
    expect(tablist).toHaveClass('border-slate-500');
  });
});

// ============================================================================
// Locale/i18n support
// ============================================================================

describe('ChartModeToggle - i18n support', () => {
  it('renders English labels by default', () => {
    renderWithProvider(<ChartModeToggle locale="en" />, yearState);

    expect(screen.getByText('Aggregation')).toBeInTheDocument();
    expect(screen.getByText('Comparison')).toBeInTheDocument();
  });

  it('renders Spanish labels when locale is es', () => {
    renderWithProvider(<ChartModeToggle locale="es" />, yearState);

    expect(screen.getByText('Agregado')).toBeInTheDocument();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
  });
});

// ============================================================================
// Icons
// ============================================================================

describe('ChartModeToggle - Icons', () => {
  it('renders icons in buttons', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    const comparisonButton = screen.getByTestId('chart-mode-comparison');

    // Check SVG icons are present
    expect(aggregationButton.querySelector('svg')).toBeInTheDocument();
    expect(comparisonButton.querySelector('svg')).toBeInTheDocument();
  });

  it('icons have aria-hidden=true', () => {
    renderWithProvider(<ChartModeToggle />, yearState);

    const aggregationButton = screen.getByTestId('chart-mode-aggregation');
    const icon = aggregationButton.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
