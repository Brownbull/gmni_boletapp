/**
 * TrendsView Integration Tests
 *
 * Tests the complete TrendsView flow with AnalyticsContext integration:
 * - Context-based navigation state
 * - Component orchestration (breadcrumbs, chart toggle, drill-down grid)
 * - Breadcrumb-based navigation (Story 7.14: removed back button)
 * - Transaction filtering
 *
 * Story 7.7 - TrendsView Integration
 * Story 7.14 - Analytics Header & Layout Fixes (removed back button)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { TrendsView } from '../../../src/views/TrendsView';
import type { Transaction } from '../../../src/types/transaction';

// ============================================================================
// Test Setup
// ============================================================================

const mockTransactions: Transaction[] = [
  // Q1 - January
  {
    id: 't1',
    date: '2024-01-15',
    merchant: 'Supermarket A',
    category: 'Supermarket',
    alias: 'Super A',
    total: 50000,
    items: [
      { name: 'Milk', price: 2000, category: 'Fresh Food', subcategory: 'Dairy' },
      { name: 'Bread', price: 1500, category: 'Fresh Food', subcategory: 'Bakery' },
    ],
  },
  // Q2 - April
  {
    id: 't2',
    date: '2024-04-20',
    merchant: 'Restaurant B',
    category: 'Restaurant',
    alias: 'Resto B',
    total: 30000,
    items: [
      { name: 'Lunch', price: 15000, category: 'Food', subcategory: 'Meals' },
    ],
  },
  // Q4 - October (multiple)
  {
    id: 't3',
    date: '2024-10-05',
    merchant: 'Pharmacy D',
    category: 'Pharmacy',
    total: 20000,
    items: [
      { name: 'Medicine', price: 15000, category: 'Health', subcategory: 'OTC' },
    ],
  },
  {
    id: 't4',
    date: '2024-10-12',
    merchant: 'Supermarket E',
    category: 'Supermarket',
    alias: 'Super E',
    total: 60000,
    items: [
      { name: 'Rice', price: 5000, category: 'Pantry', subcategory: 'Staples' },
    ],
  },
  {
    id: 't5',
    date: '2024-10-22',
    merchant: 'Restaurant F',
    category: 'Restaurant',
    alias: 'Resto F',
    total: 35000,
    items: [
      { name: 'Dinner', price: 25000, category: 'Food', subcategory: 'Meals' },
    ],
  },
  // November
  {
    id: 't6',
    date: '2024-11-15',
    merchant: 'Supermarket G',
    category: 'Supermarket',
    total: 55000,
    items: [
      { name: 'Groceries', price: 40000, category: 'Fresh Food', subcategory: 'Produce' },
    ],
  },
];

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    noData: 'No data',
    downloadStatistics: 'Download statistics',
    downloadTransactions: 'Download transactions',
    upgradeRequired: 'Upgrade required',
    totalSpent: 'Total Spent',
  };
  return translations[key] || key;
};

// Story 7.14: Removed onBackToDashboard - navigation via breadcrumbs/bottom nav
const defaultProps = {
  transactions: mockTransactions,
  theme: 'light' as const,
  currency: 'CLP',
  locale: 'en',
  t: mockT,
  onEditTransaction: vi.fn(),
  exporting: false,
  onExporting: vi.fn(),
  onUpgradeRequired: vi.fn(),
};

// Initial state for 2024 (test data year)
// Story 7.16: drillDownMode is required to show drill-down sections
const initialState2024 = {
  temporal: { level: 'year' as const, year: '2024' },
  category: { level: 'all' as const },
  chartMode: 'aggregation' as const,
  drillDownMode: 'temporal' as const, // Default to temporal mode
};

function renderTrendsView(props = {}, initialState = initialState2024) {
  return render(
    <AnalyticsProvider initialState={initialState}>
      <TrendsView {...defaultProps} {...props} />
    </AnalyticsProvider>
  );
}

// ============================================================================
// TrendsView Component Rendering Tests
// ============================================================================

describe('TrendsView Integration - Initial Rendering', () => {
  // Story 7.14: Back button removed - navigation via breadcrumbs and bottom nav
  it('renders with breadcrumbs for navigation (no back button)', () => {
    renderTrendsView();

    // Should have temporal and category breadcrumb navigation
    expect(screen.getByRole('navigation', { name: /time period/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /category filter/i })).toBeInTheDocument();
  });

  // Story 7.14: Period label replaced with "Total Spent"
  it('shows Total Spent label instead of year', () => {
    renderTrendsView();

    // Should show "Total Spent" label above the amount (Story 7.14)
    expect(screen.getByText('Total Spent')).toBeInTheDocument();
  });

  it('shows chart mode toggle at year level', () => {
    renderTrendsView();

    // ChartModeToggle should be visible (shows Aggregation/Comparison buttons)
    expect(screen.getByRole('tablist', { name: /chart display mode/i })).toBeInTheDocument();
  });

  it('shows drill-down sections', () => {
    renderTrendsView();

    // Story 7.16: DrillDownModeToggle shows either temporal OR category section, not both
    // Default mode is 'temporal', so we should see the time drill-down section
    expect(screen.getByRole('region', { name: /drill down by time/i })).toBeInTheDocument();
    // Category section should NOT be visible when in temporal mode
    expect(screen.queryByRole('region', { name: /drill down by category/i })).not.toBeInTheDocument();
  });
});

// ============================================================================
// Navigation Tests
// ============================================================================

// Story 7.14: Back button removed - users navigate via breadcrumbs or bottom nav
describe('TrendsView Integration - Breadcrumb Navigation', () => {
  it('provides navigation via breadcrumbs instead of back button', () => {
    renderTrendsView();

    // Breadcrumbs should be present for navigation
    const temporalNav = screen.getByRole('navigation', { name: /time period/i });
    const categoryNav = screen.getByRole('navigation', { name: /category filter/i });

    expect(temporalNav).toBeInTheDocument();
    expect(categoryNav).toBeInTheDocument();
  });
});

// ============================================================================
// Drill-Down Grid Integration Tests
// ============================================================================

describe('TrendsView Integration - Drill-Down Navigation', () => {
  it('displays temporal drill-down cards at year level', () => {
    renderTrendsView();

    // Should see quarters as drill-down options
    expect(screen.getByText('Quarter 1')).toBeInTheDocument();
    expect(screen.getByText('Quarter 2')).toBeInTheDocument();
    expect(screen.getByText('Quarter 4')).toBeInTheDocument();
  });

  it('displays category drill-down cards', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // Story 7.16: Need to switch to category mode to see category cards
    const categoryTab = screen.getByRole('tab', { name: /category/i });
    await user.click(categoryTab);

    // Should see store categories after switching to category mode
    await waitFor(() => {
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });
  });

  it('drills down temporally when clicking a quarter', async () => {
    const user = userEvent.setup();

    renderTrendsView();

    // Click Quarter 4 (Story 7.18: full quarter names)
    const q4Card = screen.getByText('Quarter 4').closest('button');
    if (q4Card) {
      await user.click(q4Card);
    }

    // Should now see months in Q4
    await waitFor(() => {
      expect(screen.getByText('October')).toBeInTheDocument();
      expect(screen.getByText('November')).toBeInTheDocument();
    });
  });

  it('drills down categorically when clicking a store category', async () => {
    const user = userEvent.setup();

    renderTrendsView();

    // Story 7.16: Switch to category mode first
    const categoryTab = screen.getByRole('tab', { name: /category/i });
    await user.click(categoryTab);

    // Wait for category cards to appear
    await waitFor(() => {
      expect(screen.getByText('Supermarket')).toBeInTheDocument();
    });

    // Click Supermarket category
    const supermarketCard = screen.getByText('Supermarket').closest('button');
    if (supermarketCard) {
      await user.click(supermarketCard);
    }

    // Should now see item groups within Supermarket
    await waitFor(() => {
      expect(screen.getByText('Fresh Food')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Chart Mode Toggle Integration Tests
// ============================================================================

describe('TrendsView Integration - Chart Mode Toggle', () => {
  it('toggles between aggregation and comparison modes', async () => {
    const user = userEvent.setup();

    renderTrendsView();

    // Initial mode should be aggregation
    const aggregationTab = screen.getByRole('tab', { name: /aggregation/i });
    expect(aggregationTab).toHaveAttribute('aria-selected', 'true');

    // Click comparison tab
    const comparisonTab = screen.getByRole('tab', { name: /comparison/i });
    await user.click(comparisonTab);

    // Comparison should now be selected
    await waitFor(() => {
      expect(comparisonTab).toHaveAttribute('aria-selected', 'true');
      expect(aggregationTab).toHaveAttribute('aria-selected', 'false');
    });
  });
});

// ============================================================================
// Export Functionality Tests
// ============================================================================

describe('TrendsView Integration - Export Functionality', () => {
  it('shows export button', () => {
    renderTrendsView();

    // Should have an export button
    const exportButton = screen.getByRole('button', { name: /download/i });
    expect(exportButton).toBeInTheDocument();
  });

  it('shows loading state during export', () => {
    renderTrendsView({ exporting: true });

    // Export button should be disabled and show spinner
    const exportButton = screen.getByRole('button', { name: /download/i });
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute('aria-busy', 'true');
  });
});

// ============================================================================
// Theme Support Tests
// ============================================================================

describe('TrendsView Integration - Theme Support', () => {
  it('renders with light theme', () => {
    renderTrendsView({ theme: 'light' });
    // Story 7.14: Check for chart toggle instead of removed back button
    expect(screen.getByRole('tablist', { name: /chart display mode/i })).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    renderTrendsView({ theme: 'dark' });
    // Story 7.14: Check for chart toggle instead of removed back button
    expect(screen.getByRole('tablist', { name: /chart display mode/i })).toBeInTheDocument();
  });
});

// ============================================================================
// Empty State Tests
// ============================================================================

describe('TrendsView Integration - Empty States', () => {
  it('shows no data message when no transactions', () => {
    renderTrendsView({ transactions: [] });

    // Should show no data message in chart area
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('handles empty quarters gracefully', () => {
    // Only Q4 transactions
    const q4Only = mockTransactions.filter((t) => t.date.startsWith('2024-10') || t.date.startsWith('2024-11'));

    renderTrendsView({ transactions: q4Only });

    // Q4 should be present with data - check for Quarter 4 card (Story 7.18: full quarter names)
    expect(screen.getByText('Quarter 4')).toBeInTheDocument();
  });
});

// ============================================================================
// Context Integration Tests
// ============================================================================

describe('TrendsView Integration - Context State', () => {
  it('respects initial temporal state', () => {
    const quarterState = {
      temporal: { level: 'quarter' as const, year: '2024', quarter: 'Q4' as const },
      category: { level: 'all' as const },
      chartMode: 'aggregation' as const,
      drillDownMode: 'temporal' as const, // Story 7.16: explicit drill-down mode
    };

    renderTrendsView({}, quarterState);

    // Should show months (Q4 level) - temporal drill-down mode shows temporal children
    expect(screen.getByText('October')).toBeInTheDocument();
    expect(screen.getByText('November')).toBeInTheDocument();
  });

  it('respects initial category state', () => {
    const categoryState = {
      temporal: { level: 'year' as const, year: '2024' },
      category: { level: 'category' as const, category: 'Supermarket' },
      chartMode: 'aggregation' as const,
      drillDownMode: 'category' as const, // Story 7.16: must set to category mode to see category children
    };

    renderTrendsView({}, categoryState);

    // Should show item groups for Supermarket (category mode shows category children)
    expect(screen.getByText('Fresh Food')).toBeInTheDocument();
    expect(screen.getByText('Pantry')).toBeInTheDocument();
  });
});
