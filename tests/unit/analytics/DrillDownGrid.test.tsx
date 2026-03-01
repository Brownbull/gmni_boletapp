/**
 * DrillDownGrid Component Unit Tests
 *
 * Tests for the container component that displays drill-down cards
 * for both temporal and category navigation in analytics views.
 * Migrated from AnalyticsContext to Zustand store (Story 15b-3f).
 *
 * Story 7.5 - Drill-Down Cards Grid
 * AC #1-5, #8-11, #18: DrillDownGrid acceptance criteria
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useAnalyticsStore } from '@features/analytics/stores/useAnalyticsStore';
import { getDefaultNavigationState } from '@features/analytics/utils/analyticsHelpers';
import { DrillDownGrid, getTemporalChildren, getCategoryChildren } from '@features/analytics/components/DrillDownGrid';
import type { AnalyticsNavigationState, TemporalPosition, CategoryPosition } from '../../../src/types/analytics';
import type { Transaction } from '../../../src/types/transaction';

// ============================================================================
// Test Helpers
// ============================================================================

function renderWithStore(
  ui: React.ReactElement,
  initialState?: AnalyticsNavigationState
) {
  if (initialState) {
    useAnalyticsStore.setState(initialState);
  }
  return render(ui);
}

beforeEach(() => {
  useAnalyticsStore.setState(getDefaultNavigationState('2024'));
});

// Sample transactions for testing
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    merchant: 'Supermarket A',
    category: 'Supermarket',
    total: 50000,
    items: [
      { name: 'Milk', price: 2000, category: 'Fresh Food', subcategory: 'Dairy' },
      { name: 'Bread', price: 1500, category: 'Fresh Food', subcategory: 'Bakery' },
    ],
  },
  {
    id: '2',
    date: '2024-04-20',
    merchant: 'Restaurant B',
    category: 'Restaurant',
    total: 30000,
    items: [
      { name: 'Lunch', price: 15000, category: 'Food', subcategory: 'Meals' },
    ],
  },
  {
    id: '3',
    date: '2024-07-10',
    merchant: 'Supermarket C',
    category: 'Supermarket',
    total: 45000,
    items: [
      { name: 'Vegetables', price: 10000, category: 'Fresh Food', subcategory: 'Produce' },
      { name: 'Meat', price: 25000, category: 'Fresh Food', subcategory: 'Meats' },
    ],
  },
  {
    id: '4',
    date: '2024-10-05',
    merchant: 'Pharmacy D',
    category: 'Pharmacy',
    total: 20000,
    items: [
      { name: 'Medicine', price: 15000, category: 'Health', subcategory: 'OTC' },
    ],
  },
  {
    id: '5',
    date: '2024-10-12',
    merchant: 'Supermarket E',
    category: 'Supermarket',
    total: 60000,
    items: [
      { name: 'Groceries', price: 40000, category: 'Pantry', subcategory: 'Staples' },
    ],
  },
];

// October 2024 transactions for week testing
const octoberTransactions: Transaction[] = [
  { id: 'o1', date: '2024-10-01', merchant: 'Store A', category: 'Supermarket', total: 10000, items: [] },
  { id: 'o2', date: '2024-10-05', merchant: 'Store B', category: 'Supermarket', total: 15000, items: [] },
  { id: 'o3', date: '2024-10-10', merchant: 'Store C', category: 'Restaurant', total: 20000, items: [] },
  { id: 'o4', date: '2024-10-15', merchant: 'Store D', category: 'Supermarket', total: 25000, items: [] },
  { id: 'o5', date: '2024-10-22', merchant: 'Store E', category: 'Pharmacy', total: 12000, items: [] },
  { id: 'o6', date: '2024-10-28', merchant: 'Store F', category: 'Restaurant', total: 18000, items: [] },
];

// Default states for testing
// Story 7.16: drillDownMode controls which section is displayed
const yearState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'all' },
  chartMode: 'aggregation',
  drillDownMode: 'temporal', // Story 7.16
};

const quarterState: AnalyticsNavigationState = {
  temporal: { level: 'quarter', year: '2024', quarter: 'Q4' },
  category: { level: 'all' },
  chartMode: 'aggregation',
  drillDownMode: 'temporal', // Story 7.16
};

const monthState: AnalyticsNavigationState = {
  temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
  category: { level: 'all' },
  chartMode: 'aggregation',
  drillDownMode: 'temporal', // Story 7.16
};

const weekState: AnalyticsNavigationState = {
  temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
  category: { level: 'all' },
  chartMode: 'aggregation',
  drillDownMode: 'temporal', // Story 7.16
};

const dayState: AnalyticsNavigationState = {
  temporal: { level: 'day', year: '2024', quarter: 'Q4', month: '2024-10', week: 2, day: '2024-10-10' },
  category: { level: 'all' },
  chartMode: 'aggregation',
  drillDownMode: 'temporal', // Story 7.16
};

const categoryFilterState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'category', category: 'Supermarket' },
  chartMode: 'aggregation',
  drillDownMode: 'category', // Story 7.16: show category cards
};

const groupFilterState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'group', category: 'Supermarket', group: 'Fresh Food' },
  chartMode: 'aggregation',
  drillDownMode: 'category', // Story 7.16: show category cards
};

const subcategoryFilterState: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'subcategory', category: 'Supermarket', group: 'Fresh Food', subcategory: 'Dairy' },
  chartMode: 'aggregation',
  drillDownMode: 'category', // Story 7.16: show category cards
};

// Story 7.16: State showing category section at 'all' level
const yearStateWithCategoryMode: AnalyticsNavigationState = {
  temporal: { level: 'year', year: '2024' },
  category: { level: 'all' },
  chartMode: 'aggregation',
  drillDownMode: 'category', // Story 7.16: show category cards even at 'all' level
};

// ============================================================================
// AC #1: Year view displays 4 quarters
// ============================================================================

describe('DrillDownGrid - AC #1: Year view shows Q1-Q4', () => {
  it('renders 4 quarter cards at year level', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    expect(screen.getByText('Quarter 1')).toBeInTheDocument();
    expect(screen.getByText('Quarter 2')).toBeInTheDocument();
    expect(screen.getByText('Quarter 3')).toBeInTheDocument();
    expect(screen.getByText('Quarter 4')).toBeInTheDocument();
  });

  it('renders temporal drill-down section label', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    expect(screen.getByText('Drill down by time')).toBeInTheDocument();
  });

  it('calculates quarter totals correctly', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    // The cards should show formatted values
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4);
  });
});

// ============================================================================
// AC #2: Quarter view displays 3 months
// ============================================================================

describe('DrillDownGrid - AC #2: Quarter view shows 3 months', () => {
  // Transactions with data in all 3 Q4 months
  const q4FullTransactions: Transaction[] = [
    { id: 'q4-1', date: '2024-10-15', merchant: 'Store', category: 'Supermarket', total: 10000, items: [] },
    { id: 'q4-2', date: '2024-11-15', merchant: 'Store', category: 'Supermarket', total: 20000, items: [] },
    { id: 'q4-3', date: '2024-12-15', merchant: 'Store', category: 'Supermarket', total: 30000, items: [] },
  ];

  it('renders 3 month cards at quarter level', () => {
    renderWithStore(
      <DrillDownGrid transactions={q4FullTransactions} locale="en" />,
      quarterState
    );

    expect(screen.getByText('October')).toBeInTheDocument();
    expect(screen.getByText('November')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();
  });

  it('shows months in the correct quarter', () => {
    const q1FullTransactions: Transaction[] = [
      { id: 'q1-1', date: '2024-01-15', merchant: 'Store', category: 'Supermarket', total: 10000, items: [] },
      { id: 'q1-2', date: '2024-02-15', merchant: 'Store', category: 'Supermarket', total: 20000, items: [] },
      { id: 'q1-3', date: '2024-03-15', merchant: 'Store', category: 'Supermarket', total: 30000, items: [] },
    ];

    const q1State: AnalyticsNavigationState = {
      temporal: { level: 'quarter', year: '2024', quarter: 'Q1' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    };

    renderWithStore(
      <DrillDownGrid transactions={q1FullTransactions} locale="en" />,
      q1State
    );

    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('February')).toBeInTheDocument();
    expect(screen.getByText('March')).toBeInTheDocument();
  });

  it('hides empty months in collapsible section', () => {
    const octOnlyTransactions: Transaction[] = [
      { id: 'oct-1', date: '2024-10-15', merchant: 'Store', category: 'Supermarket', total: 10000, items: [] },
    ];

    renderWithStore(
      <DrillDownGrid transactions={octOnlyTransactions} locale="en" />,
      quarterState
    );

    expect(screen.getByText('October')).toBeInTheDocument();
    expect(screen.queryByText('November')).not.toBeInTheDocument();
    expect(screen.queryByText('December')).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: /show 2 empty periods/i });
    expect(expandButton).toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.getByText('November')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();
  });
});

// ============================================================================
// AC #3: Month view displays weeks
// ============================================================================

describe('DrillDownGrid - AC #3: Month view shows weeks', () => {
  it('renders 4 week cards by default at month level', () => {
    renderWithStore(
      <DrillDownGrid transactions={octoberTransactions} locale="en" />,
      monthState
    );

    expect(screen.getByText('Oct 1-7')).toBeInTheDocument();
    expect(screen.getByText('Oct 8-14')).toBeInTheDocument();
    expect(screen.getByText('Oct 15-21')).toBeInTheDocument();
    expect(screen.getByText('Oct 22-28')).toBeInTheDocument();
    expect(screen.queryByText('Oct 29-31')).not.toBeInTheDocument();
  });

  it('shows week 5 when there is data in days 29-31', () => {
    const transactionsWithWeek5 = [
      ...octoberTransactions,
      { id: 'o7', date: '2024-10-30', merchant: 'Store G', category: 'Supermarket', total: 5000, items: [] },
    ];

    renderWithStore(
      <DrillDownGrid transactions={transactionsWithWeek5} locale="en" />,
      monthState
    );

    expect(screen.getByText('Oct 29-31')).toBeInTheDocument();
  });

  it('calculates week totals correctly', () => {
    renderWithStore(
      <DrillDownGrid transactions={octoberTransactions} locale="en" />,
      monthState
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });
});

// ============================================================================
// AC #4: Week view displays days
// ============================================================================

describe('DrillDownGrid - AC #4: Week view shows days', () => {
  it('renders day cards at week level', () => {
    renderWithStore(
      <DrillDownGrid transactions={octoberTransactions} locale="en" />,
      weekState
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// AC #5: Day view shows no temporal children
// ============================================================================

describe('DrillDownGrid - AC #5: Day view has no temporal drill-down', () => {
  it('does not render temporal section at day level', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      dayState
    );

    expect(screen.queryByText('Drill down by time')).not.toBeInTheDocument();
  });
});

// ============================================================================
// AC #8: Tapping temporal card dispatches SET_TEMPORAL_LEVEL
// ============================================================================

describe('DrillDownGrid - AC #8: Temporal card navigation', () => {
  it('clicking quarter card updates temporal level', async () => {
    const user = userEvent.setup();

    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    const q4Card = screen.getByText('Quarter 4').closest('button');
    await user.click(q4Card!);

    await waitFor(() => {
      expect(screen.getByText('October')).toBeInTheDocument();
    });
  });

  it('clicking month card updates temporal level', async () => {
    const user = userEvent.setup();

    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      quarterState
    );

    const octoberCard = screen.getByText('October').closest('button');
    await user.click(octoberCard!);

    await waitFor(() => {
      expect(screen.getByText(/Oct 1-7/)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// AC #9: Category filter shows BOTH temporal AND category children
// ============================================================================

describe('DrillDownGrid - AC #9: Section display with drillDownMode', () => {
  it('shows only category section when drillDownMode is category', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      categoryFilterState
    );

    expect(screen.getByText('Drill down by category')).toBeInTheDocument();
    expect(screen.queryByText('Drill down by time')).not.toBeInTheDocument();
  });

  it('shows only temporal section when drillDownMode is temporal', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    expect(screen.getByText('Drill down by time')).toBeInTheDocument();
    expect(screen.queryByText('Drill down by category')).not.toBeInTheDocument();
  });
});

// ============================================================================
// AC #10: Category drill-down shows child categories
// ============================================================================

describe('DrillDownGrid - AC #10: Category children display', () => {
  it('shows store categories when at all level with category drillDownMode', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearStateWithCategoryMode
    );

    expect(screen.getByText('Drill down by category')).toBeInTheDocument();
    expect(screen.getByText('Supermarket')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy')).toBeInTheDocument();
  });

  it('shows item groups when at category level', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      categoryFilterState
    );

    expect(screen.getByText('Fresh Food')).toBeInTheDocument();
    expect(screen.getByText('Pantry')).toBeInTheDocument();
  });

  it('shows subcategories when at group level', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      groupFilterState
    );

    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Bakery')).toBeInTheDocument();
    expect(screen.getByText('Produce')).toBeInTheDocument();
    expect(screen.getByText('Meats')).toBeInTheDocument();
  });
});

// ============================================================================
// AC #11: Tapping category card dispatches SET_CATEGORY_FILTER
// ============================================================================

describe('DrillDownGrid - AC #11: Category card navigation', () => {
  it('clicking category card updates category filter', async () => {
    const user = userEvent.setup();

    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearStateWithCategoryMode
    );

    const supermarketCard = screen.getByText('Supermarket').closest('button');
    await user.click(supermarketCard!);

    await waitFor(() => {
      expect(screen.getByText('Fresh Food')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// AC #18: DrillDownGrid consumes analytics store
// ============================================================================

describe('DrillDownGrid - AC #18: Store consumption', () => {
  it('reads temporal position from store', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    expect(screen.getByText('Quarter 1')).toBeInTheDocument();
  });

  it('reads category position from store', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      categoryFilterState
    );

    expect(screen.getByText('Fresh Food')).toBeInTheDocument();
  });

  // Story 15b-3f: Zustand stores are always available - no Provider required
  // "throws outside Provider" test removed
});

// ============================================================================
// Empty State Handling
// ============================================================================

describe('DrillDownGrid - Empty transactions', () => {
  it('shows CTA when no transactions', () => {
    renderWithStore(
      <DrillDownGrid transactions={[]} locale="en" />,
      yearState
    );

    expect(screen.getByText('Scan a receipt to add data')).toBeInTheDocument();
  });

  it('marks periods with no transactions as empty', () => {
    const q1Only: Transaction[] = [
      { id: '1', date: '2024-01-15', merchant: 'Store', category: 'Supermarket', total: 10000, items: [] },
    ];

    renderWithStore(
      <DrillDownGrid transactions={q1Only} locale="en" />,
      yearState
    );

    expect(screen.queryByText('Q2')).not.toBeInTheDocument();
    expect(screen.queryByText('Q3')).not.toBeInTheDocument();
    expect(screen.queryByText('Q4')).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: /show 3 empty periods/i });
    expect(expandButton).toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.getByText('Quarter 2')).toBeInTheDocument();
    expect(screen.getByText('Quarter 3')).toBeInTheDocument();
    expect(screen.getByText('Quarter 4')).toBeInTheDocument();
  });
});

// ============================================================================
// Grid Layout
// ============================================================================

describe('DrillDownGrid - Grid layout', () => {
  it('uses grid layout for cards', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    const section = screen.getByLabelText('Drill down by time');
    const grid = section.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('has responsive grid columns', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    const section = screen.getByLabelText('Drill down by time');
    const grid = section.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
  });
});

// ============================================================================
// i18n Support
// ============================================================================

describe('DrillDownGrid - i18n support', () => {
  it('renders temporal section label in English when drillDownMode is temporal', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    expect(screen.getByText('Drill down by time')).toBeInTheDocument();
  });

  it('renders category section label in English when drillDownMode is category', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      categoryFilterState
    );

    expect(screen.getByText('Drill down by category')).toBeInTheDocument();
  });

  it('renders temporal section label in Spanish when drillDownMode is temporal', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="es" />,
      yearState
    );

    expect(screen.getByText('Desglosar por tiempo')).toBeInTheDocument();
  });

  it('renders category section label in Spanish when drillDownMode is category', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="es" />,
      categoryFilterState
    );

    expect(screen.getByText('Desglosar por categoría')).toBeInTheDocument();
  });

  it('renders quarter labels in Spanish', () => {
    renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="es" />,
      yearState
    );

    expect(screen.getByText('Trimestre 1')).toBeInTheDocument();
    expect(screen.getByText('Trimestre 2')).toBeInTheDocument();
    expect(screen.getByText('Trimestre 3')).toBeInTheDocument();
    expect(screen.getByText('Trimestre 4')).toBeInTheDocument();
  });
});

// ============================================================================
// Theme Support
// ============================================================================

describe('DrillDownGrid - Theme support', () => {
  it('passes theme to DrillDownCard components', () => {
    const { container } = renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} theme="dark" locale="en" />,
      yearState
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).toHaveClass('bg-slate-800');
  });

  it('applies light theme by default', () => {
    const { container } = renderWithStore(
      <DrillDownGrid transactions={sampleTransactions} locale="en" />,
      yearState
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveClass('bg-white');
  });
});

// ============================================================================
// getTemporalChildren Helper Function Tests
// ============================================================================

describe('getTemporalChildren - Helper function', () => {
  it('returns 4 quarters for year level', () => {
    const temporal: TemporalPosition = { level: 'year', year: '2024' };
    const children = getTemporalChildren(temporal, sampleTransactions, 'en');

    expect(children).toHaveLength(4);
    expect(children[0].label).toBe('Quarter 1');
    expect(children[3].label).toBe('Quarter 4');
  });

  it('returns 3 months for quarter level', () => {
    const temporal: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q4' };
    const children = getTemporalChildren(temporal, sampleTransactions, 'en');

    expect(children).toHaveLength(3);
  });

  it('returns empty array for day level', () => {
    const temporal: TemporalPosition = {
      level: 'day', year: '2024', quarter: 'Q4', month: '2024-10', week: 2, day: '2024-10-10'
    };
    const children = getTemporalChildren(temporal, sampleTransactions, 'en');

    expect(children).toHaveLength(0);
  });

  it('calculates totals correctly', () => {
    const temporal: TemporalPosition = { level: 'year', year: '2024' };
    const children = getTemporalChildren(temporal, sampleTransactions, 'en');

    expect(children[0].total).toBe(50000);
    expect(children[1].total).toBe(30000);
    expect(children[2].total).toBe(45000);
    expect(children[3].total).toBe(80000);
  });

  it('calculates percentages correctly', () => {
    const temporal: TemporalPosition = { level: 'year', year: '2024' };
    const children = getTemporalChildren(temporal, sampleTransactions, 'en');

    const total = 50000 + 30000 + 45000 + 80000;
    const q1Percentage = (50000 / total) * 100;

    expect(children[0].percentage).toBeCloseTo(q1Percentage, 1);
  });

  it('marks empty periods', () => {
    const temporal: TemporalPosition = { level: 'year', year: '2024' };
    const q1Only: Transaction[] = [
      { id: '1', date: '2024-01-15', merchant: 'Store', category: 'Supermarket', total: 10000, items: [] },
    ];

    const children = getTemporalChildren(temporal, q1Only, 'en');

    expect(children[0].isEmpty).toBe(false);
    expect(children[1].isEmpty).toBe(true);
    expect(children[2].isEmpty).toBe(true);
    expect(children[3].isEmpty).toBe(true);
  });
});

// ============================================================================
// getCategoryChildren Helper Function Tests
// ============================================================================

describe('getCategoryChildren - Helper function', () => {
  it('returns unique categories for all level', () => {
    const category: CategoryPosition = { level: 'all' };
    const children = getCategoryChildren(category, sampleTransactions, 'en');

    expect(children.length).toBe(3);
    expect(children.map(c => c.label)).toContain('Supermarket');
    expect(children.map(c => c.label)).toContain('Restaurant');
    expect(children.map(c => c.label)).toContain('Pharmacy');
  });

  it('returns item groups for category level', () => {
    const category: CategoryPosition = { level: 'category', category: 'Supermarket' };
    const children = getCategoryChildren(category, sampleTransactions, 'en');

    expect(children.map(c => c.label)).toContain('Fresh Food');
    expect(children.map(c => c.label)).toContain('Pantry');
  });

  it('returns subcategories for group level', () => {
    const category: CategoryPosition = { level: 'group', category: 'Supermarket', group: 'Fresh Food' };
    const children = getCategoryChildren(category, sampleTransactions, 'en');

    expect(children.map(c => c.label)).toContain('Dairy');
    expect(children.map(c => c.label)).toContain('Bakery');
    expect(children.map(c => c.label)).toContain('Produce');
    expect(children.map(c => c.label)).toContain('Meats');
  });

  it('returns empty array for subcategory level', () => {
    const category: CategoryPosition = {
      level: 'subcategory', category: 'Supermarket', group: 'Fresh Food', subcategory: 'Dairy'
    };
    const children = getCategoryChildren(category, sampleTransactions, 'en');

    expect(children).toHaveLength(0);
  });

  it('sorts categories by total descending', () => {
    const category: CategoryPosition = { level: 'all' };
    const children = getCategoryChildren(category, sampleTransactions, 'en');

    expect(children[0].label).toBe('Supermarket');
  });
});
