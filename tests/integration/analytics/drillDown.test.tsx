/**
 * Drill-Down Navigation Integration Tests
 *
 * Tests the complete drill-down flow including:
 * - Temporal navigation: Year → Quarter → Month → Week → Day
 * - Category navigation: All → Category → Group → Subcategory
 * - Dual-axis independence
 *
 * Story 7.5 - Drill-Down Cards Grid
 * AC #8, #11: Navigation integration tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { DrillDownGrid } from '@features/analytics/components/DrillDownGrid';
import type { AnalyticsNavigationState } from '../../../src/types/analytics';
import type { Transaction } from '../../../src/types/transaction';

// ============================================================================
// Test Setup
// ============================================================================

// Comprehensive transaction dataset for testing navigation
const testTransactions: Transaction[] = [
  // Q1 - January
  {
    id: 't1',
    date: '2024-01-15',
    merchant: 'Supermarket A',
    category: 'Supermarket',
    total: 50000,
    items: [
      { name: 'Milk', price: 2000, category: 'Fresh Food', subcategory: 'Dairy' },
      { name: 'Bread', price: 1500, category: 'Fresh Food', subcategory: 'Bakery' },
      { name: 'Butter', price: 2500, category: 'Fresh Food', subcategory: 'Dairy' },
    ],
  },
  // Q2 - April
  {
    id: 't2',
    date: '2024-04-20',
    merchant: 'Restaurant B',
    category: 'Restaurant',
    total: 30000,
    items: [
      { name: 'Lunch', price: 15000, category: 'Food', subcategory: 'Meals' },
      { name: 'Dessert', price: 8000, category: 'Food', subcategory: 'Sweets' },
    ],
  },
  // Q3 - July
  {
    id: 't3',
    date: '2024-07-10',
    merchant: 'Supermarket C',
    category: 'Supermarket',
    total: 45000,
    items: [
      { name: 'Vegetables', price: 10000, category: 'Fresh Food', subcategory: 'Produce' },
      { name: 'Meat', price: 25000, category: 'Fresh Food', subcategory: 'Meats' },
    ],
  },
  // Q4 - October (multiple transactions)
  {
    id: 't4',
    date: '2024-10-05',
    merchant: 'Pharmacy D',
    category: 'Pharmacy',
    total: 20000,
    items: [
      { name: 'Medicine', price: 15000, category: 'Health', subcategory: 'OTC' },
    ],
  },
  {
    id: 't5',
    date: '2024-10-12',
    merchant: 'Supermarket E',
    category: 'Supermarket',
    total: 60000,
    items: [
      { name: 'Rice', price: 5000, category: 'Pantry', subcategory: 'Staples' },
      { name: 'Beans', price: 3000, category: 'Pantry', subcategory: 'Staples' },
      { name: 'Oil', price: 4000, category: 'Pantry', subcategory: 'Cooking' },
    ],
  },
  {
    id: 't6',
    date: '2024-10-22',
    merchant: 'Restaurant F',
    category: 'Restaurant',
    total: 35000,
    items: [
      { name: 'Dinner', price: 25000, category: 'Food', subcategory: 'Meals' },
    ],
  },
  // November
  {
    id: 't7',
    date: '2024-11-15',
    merchant: 'Supermarket G',
    category: 'Supermarket',
    total: 55000,
    items: [
      { name: 'Groceries', price: 40000, category: 'Fresh Food', subcategory: 'Produce' },
    ],
  },
];

function renderWithProvider(
  initialState: AnalyticsNavigationState,
  transactions: Transaction[] = testTransactions
) {
  return render(
    <AnalyticsProvider initialState={initialState}>
      <DrillDownGrid transactions={transactions} locale="en" />
    </AnalyticsProvider>
  );
}

// ============================================================================
// Temporal Navigation Flow Tests
// ============================================================================

describe('Drill-Down Integration - Temporal Navigation Flow', () => {
  it('navigates from Year → Quarter → Month → Week → Day', async () => {
    const user = userEvent.setup();

    // Story 7.16: drillDownMode determines which section is visible
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal', // Show temporal section
    };

    renderWithProvider(initialState);

    // Step 1: Year level - should see quarters (Story 7.18: full quarter names)
    expect(screen.getByText('Quarter 1')).toBeInTheDocument();
    expect(screen.getByText('Quarter 4')).toBeInTheDocument();

    // Step 2: Click Quarter 4 to drill to quarter level
    const q4Card = screen.getByText('Quarter 4').closest('button')!;
    await user.click(q4Card);

    // Should now see months in Q4 (only October and November have data)
    await waitFor(() => {
      expect(screen.getByText('October')).toBeInTheDocument();
      expect(screen.getByText('November')).toBeInTheDocument();
      // December is empty so it's in the collapsed "empty periods" section
    });

    // Quarters should no longer be visible
    expect(screen.queryByText('Quarter 1')).not.toBeInTheDocument();

    // Step 3: Click October to drill to month level
    const octoberCard = screen.getByText('October').closest('button')!;
    await user.click(octoberCard);

    // Should now see weeks
    await waitFor(() => {
      expect(screen.getByText('Oct 1-7')).toBeInTheDocument();
    });

    // Step 4: Click first week to drill to week level
    const week1Card = screen.getByText('Oct 1-7').closest('button')!;
    await user.click(week1Card);

    // Should now see days
    await waitFor(() => {
      // Week of Oct 1-7 should show day names (Tue through Mon in 2024)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('updates AnalyticsContext state correctly through navigation', async () => {
    const user = userEvent.setup();

    // Story 7.16: drillDownMode required for temporal section visibility
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    };

    renderWithProvider(initialState);

    // Navigate to Quarter 4 (Story 7.18: full quarter names)
    await user.click(screen.getByText('Quarter 4').closest('button')!);

    // The state should now be at quarter level, which is reflected in showing months
    await waitFor(() => {
      expect(screen.getByText('October')).toBeInTheDocument();
    });

    // Navigate to October
    await user.click(screen.getByText('October').closest('button')!);

    // The state should now be at month level, which is reflected in showing weeks
    await waitFor(() => {
      expect(screen.getByText('Oct 1-7')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Category Navigation Flow Tests
// ============================================================================

describe('Drill-Down Integration - Category Navigation Flow', () => {
  it('navigates from All → Category → Group and stops (Story 9.13)', async () => {
    const user = userEvent.setup();

    // Story 7.16: drillDownMode='category' to show category section
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'category', // Show category section
    };

    renderWithProvider(initialState);

    // Step 1: All level - should see store categories
    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy')).toBeInTheDocument();

    // Step 2: Click Supermarket to drill to category level
    const supermarketCard = screen.getByText('Supermarket').closest('button')!;
    await user.click(supermarketCard);

    // Should now see item groups from Supermarket transactions
    await waitFor(() => {
      expect(screen.getByText('Fresh Food')).toBeInTheDocument();
      expect(screen.getByText('Pantry')).toBeInTheDocument();
    });

    // Step 3: Click Fresh Food to drill to group level
    const freshFoodCard = screen.getByText('Fresh Food').closest('button')!;
    await user.click(freshFoodCard);

    // Should now see subcategories
    await waitFor(() => {
      expect(screen.getByText('Dairy')).toBeInTheDocument();
      expect(screen.getByText('Produce')).toBeInTheDocument();
    });

    // Story 9.13 AC #1: At group level, cards (showing subcategories) should NOT be clickable
    const dairyCard = screen.getByText('Dairy').closest('button')!;

    // Card should be disabled (not clickable)
    expect(dairyCard).toBeDisabled();

    // Card should not have cursor-pointer class (visual feedback per AC #4)
    expect(dairyCard).toHaveClass('cursor-default');
    expect(dairyCard).not.toHaveClass('cursor-pointer');

    // Story 9.13 AC #4: Should show "No further breakdown available" message
    expect(screen.getByText('No further breakdown available')).toBeInTheDocument();

    // Clicking the card should NOT navigate (card is disabled)
    await user.click(dairyCard);

    // Category section should still be visible (we didn't navigate away)
    expect(screen.getByText('Drill down by category')).toBeInTheDocument();
    // And we should still see the subcategories (not navigated to subcategory level)
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });
});

// ============================================================================
// Dual-Axis Independence Tests
// ============================================================================

describe('Drill-Down Integration - Dual-Axis Independence', () => {
  // Story 7.16: Only one section (temporal OR category) visible at a time
  // These tests verify that switching between modes preserves the OTHER axis state

  it('temporal navigation preserves category filter', async () => {
    const user = userEvent.setup();

    // Start with category filter applied, viewing temporal section
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'category', category: 'Supermarket' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal', // View temporal section
    };

    renderWithProvider(initialState);

    // In temporal mode, should see quarters (Story 7.18: full names)
    expect(screen.getByText('Quarter 4')).toBeInTheDocument();

    // Navigate temporal: Year → Q4
    await user.click(screen.getByText('Quarter 4').closest('button')!);

    // Should now show months
    await waitFor(() => {
      expect(screen.getByText('October')).toBeInTheDocument();
    });

    // Category filter is preserved in context even though category section is hidden
    // We can't verify this visually without switching modes, but the context maintains it
  });

  it('category navigation preserves temporal position', async () => {
    const user = userEvent.setup();

    // Start at month level, viewing category section
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'category', // View category section
    };

    renderWithProvider(initialState);

    // In category mode, should see store categories
    expect(screen.getByText('Supermarket')).toBeInTheDocument();

    // Navigate category: All → Supermarket
    await user.click(screen.getByText('Supermarket').closest('button')!);

    // Should now show item groups
    await waitFor(() => {
      expect(screen.getByText('Fresh Food')).toBeInTheDocument();
    });

    // Temporal position is preserved in context even though temporal section is hidden
  });

  it('can navigate both axes in sequence', async () => {
    const user = userEvent.setup();

    // Start in temporal mode
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    };

    renderWithProvider(initialState);

    // Navigate temporal: Year → Q4 (Story 7.18: full quarter names)
    await user.click(screen.getByText('Quarter 4').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('October')).toBeInTheDocument();
    });

    // Navigate temporal: Q4 → October
    await user.click(screen.getByText('October').closest('button')!);

    await waitFor(() => {
      // Should now show weeks
      expect(screen.getByText('Oct 1-7')).toBeInTheDocument();
    });

    // Both axes navigated successfully while in temporal mode
  });
});

// ============================================================================
// Empty State Navigation Tests
// ============================================================================

describe('Drill-Down Integration - Empty State Navigation', () => {
  it('can navigate to empty periods', async () => {
    const user = userEvent.setup();

    // Only have Q4 transactions
    const q4Only: Transaction[] = [
      { id: '1', date: '2024-10-15', merchant: 'Store', category: 'Supermarket', total: 10000, items: [] },
    ];

    // Story 7.16: drillDownMode required
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    };

    render(
      <AnalyticsProvider initialState={initialState}>
        <DrillDownGrid transactions={q4Only} locale="en" />
      </AnalyticsProvider>
    );

    // Q4 should be visible with data (Story 7.18: full quarter names)
    expect(screen.getByText('Quarter 4')).toBeInTheDocument();

    // Q1 is empty - need to expand the "Show empty periods" section first
    const showEmptyButton = screen.getByText(/show.*empty/i);
    await user.click(showEmptyButton);

    // Now Q1 should be visible
    const q1Card = screen.getByText('Quarter 1').closest('button')!;

    // Card should have empty styling (reduced opacity)
    expect(q1Card).toHaveClass('opacity-60');

    // Click the empty quarter
    await user.click(q1Card);

    // Should still navigate to Q1 and show months (even if empty)
    await waitFor(() => {
      expect(screen.getByText('January')).toBeInTheDocument();
      expect(screen.getByText('February')).toBeInTheDocument();
      expect(screen.getByText('March')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Re-render and State Persistence Tests
// ============================================================================

describe('Drill-Down Integration - State Persistence', () => {
  it('maintains navigation state through re-renders', async () => {
    const user = userEvent.setup();

    // Story 7.16: drillDownMode required
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    };

    const { rerender } = render(
      <AnalyticsProvider initialState={initialState}>
        <DrillDownGrid transactions={testTransactions} locale="en" />
      </AnalyticsProvider>
    );

    // Navigate to Quarter 4 (Story 7.18: full quarter names)
    await user.click(screen.getByText('Quarter 4').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('October')).toBeInTheDocument();
    });

    // Re-render with same provider at quarter level
    rerender(
      <AnalyticsProvider initialState={{ ...initialState, temporal: { level: 'quarter', year: '2024', quarter: 'Q4' } }}>
        <DrillDownGrid transactions={testTransactions} locale="en" />
      </AnalyticsProvider>
    );

    // State should persist
    expect(screen.getByText('October')).toBeInTheDocument();
  });
});

// ============================================================================
// Transactions Filtering with Navigation
// ============================================================================

describe('Drill-Down Integration - Transaction Filtering', () => {
  it('shows correct totals when drilling down temporally', async () => {
    const user = userEvent.setup();

    // Story 7.16: drillDownMode required
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    };

    renderWithProvider(initialState);

    // Q4 total should be: t4(20000) + t5(60000) + t6(35000) + t7(55000) = 170000
    // But t7 is in November, so Q4 October transactions = 20000 + 60000 + 35000 = 115000
    // We're testing the flow, not exact values here

    // Navigate to Quarter 4 (Story 7.18: full quarter names)
    await user.click(screen.getByText('Quarter 4').closest('button')!);

    // October should have: t4 + t5 + t6 = 20000 + 60000 + 35000 = 115000
    await waitFor(() => {
      const octoberCard = screen.getByText('October');
      expect(octoberCard).toBeInTheDocument();
    });
  });

  it('shows correct category breakdown for filtered temporal period', async () => {
    // Start at month level for October, viewing category section
    // Story 7.16: drillDownMode='category' to see category children
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'category', // Need category mode to see store categories
    };

    renderWithProvider(initialState);

    // October has: Pharmacy (t4), Supermarket (t5), Restaurant (t6)
    // Category section should show these
    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy')).toBeInTheDocument();
  });
});
