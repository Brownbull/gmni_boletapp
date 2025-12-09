/**
 * DrillDownModeToggle Component Unit Tests
 *
 * Tests for the toggle component that switches between Temporal and Category
 * drill-down modes in the analytics view.
 *
 * Story 7.16 - Drill-Down Section Toggle
 * AC #1-3, #6-8: DrillDownModeToggle acceptance criteria
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { DrillDownModeToggle } from '../../../src/components/analytics/DrillDownModeToggle';
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
const temporalModeState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'all' },
  chartMode: 'aggregation',
  drillDownMode: 'temporal',
};

const categoryModeState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'all' },
  chartMode: 'aggregation',
  drillDownMode: 'category',
};

// ============================================================================
// AC #1: Toggle placed above drill-down cards (tested in integration)
// AC #2: Two options - Temporal and Category
// ============================================================================

describe('DrillDownModeToggle - AC #2: Toggle options', () => {
  it('renders two toggle options', () => {
    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    expect(screen.getByTestId('drilldown-mode-temporal')).toBeInTheDocument();
    expect(screen.getByTestId('drilldown-mode-category')).toBeInTheDocument();
  });

  it('displays Temporal and Category labels in English', () => {
    renderWithProvider(<DrillDownModeToggle locale="en" />, temporalModeState);

    expect(screen.getByText('Temporal')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('displays Temporal and Categoría labels in Spanish', () => {
    renderWithProvider(<DrillDownModeToggle locale="es" />, temporalModeState);

    expect(screen.getByText('Temporal')).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
  });
});

// ============================================================================
// AC #3: Same styling as ChartModeToggle
// ============================================================================

describe('DrillDownModeToggle - AC #3: Styling', () => {
  it('has tablist role for accessibility', () => {
    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
  });

  it('buttons have tab role', () => {
    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
  });

  it('active button has aria-selected=true', () => {
    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const temporalTab = screen.getByTestId('drilldown-mode-temporal');
    const categoryTab = screen.getByTestId('drilldown-mode-category');

    expect(temporalTab).toHaveAttribute('aria-selected', 'true');
    expect(categoryTab).toHaveAttribute('aria-selected', 'false');
  });

  it('applies dark theme styles', () => {
    renderWithProvider(<DrillDownModeToggle theme="dark" />, temporalModeState);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveClass('bg-slate-800');
  });

  it('applies light theme styles by default', () => {
    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveClass('bg-white');
  });
});

// ============================================================================
// AC #6: Default to Temporal mode
// ============================================================================

describe('DrillDownModeToggle - AC #6: Default state', () => {
  it('shows Temporal as selected when drillDownMode is temporal', () => {
    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const temporalTab = screen.getByTestId('drilldown-mode-temporal');
    expect(temporalTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows Category as selected when drillDownMode is category', () => {
    renderWithProvider(<DrillDownModeToggle />, categoryModeState);

    const categoryTab = screen.getByTestId('drilldown-mode-category');
    expect(categoryTab).toHaveAttribute('aria-selected', 'true');
  });
});

// ============================================================================
// AC #7: Toggle independent from chart mode
// (This is implicit - the component only dispatches TOGGLE_DRILLDOWN_MODE)
// ============================================================================

describe('DrillDownModeToggle - Toggle behavior', () => {
  it('clicking inactive option toggles the mode', async () => {
    const user = userEvent.setup();

    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const categoryTab = screen.getByTestId('drilldown-mode-category');
    await user.click(categoryTab);

    // After click, category should be selected
    expect(categoryTab).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking active option does nothing', async () => {
    const user = userEvent.setup();

    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const temporalTab = screen.getByTestId('drilldown-mode-temporal');
    await user.click(temporalTab);

    // Should still be selected (no toggle)
    expect(temporalTab).toHaveAttribute('aria-selected', 'true');
  });

  it('supports keyboard navigation with Enter', async () => {
    const user = userEvent.setup();

    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const categoryTab = screen.getByTestId('drilldown-mode-category');
    categoryTab.focus();
    await user.keyboard('{Enter}');

    // After Enter, category should be selected
    expect(categoryTab).toHaveAttribute('aria-selected', 'true');
  });

  it('supports keyboard navigation with Space', async () => {
    const user = userEvent.setup();

    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const categoryTab = screen.getByTestId('drilldown-mode-category');
    categoryTab.focus();
    await user.keyboard(' ');

    // After Space, category should be selected
    expect(categoryTab).toHaveAttribute('aria-selected', 'true');
  });

  it('supports keyboard navigation with arrow keys', async () => {
    const user = userEvent.setup();

    renderWithProvider(<DrillDownModeToggle />, temporalModeState);

    const temporalTab = screen.getByTestId('drilldown-mode-temporal');
    temporalTab.focus();
    await user.keyboard('{ArrowRight}');

    // After arrow right, category should be selected
    const categoryTab = screen.getByTestId('drilldown-mode-category');
    expect(categoryTab).toHaveAttribute('aria-selected', 'true');
  });
});

// ============================================================================
// AC #8: Translations (covered in AC #2 tests above)
// ============================================================================
