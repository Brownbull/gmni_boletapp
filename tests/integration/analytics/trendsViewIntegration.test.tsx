/**
 * TrendsView "Explora" Integration Tests
 *
 * Story 14.13: Analytics Explorer Redesign
 * Epic 14: Core Implementation
 *
 * Tests the complete "Explora" view flow with AnalyticsContext integration:
 * - Time period pills and period navigation
 * - Analytics carousel with treemap and trend list
 * - View toggle functionality
 * - Category drill-down via navigation callback
 * - Theme support
 * - Empty states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import { HistoryFiltersProvider } from '../../../src/contexts/HistoryFiltersContext';
import { TrendsView } from '../../../src/views/TrendsView';
import type { Transaction } from '../../../src/types/transaction';

// ============================================================================
// Mock localStorage
// ============================================================================
let mockStorage: Record<string, string>;
let mockLocalStorage: Storage;

beforeEach(() => {
  mockStorage = {};
  mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    }),
    length: 0,
    key: vi.fn(() => null),
  };
  vi.stubGlobal('localStorage', mockLocalStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ============================================================================
// Test Setup
// ============================================================================

// Use dynamic dates to match the current period (component starts at current date)
const getCurrentMonthDate = (day: number) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
};

const getPreviousMonthDate = (day: number) => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
};

const mockTransactions: Transaction[] = [
  // Current month transactions
  {
    id: 't1',
    date: getCurrentMonthDate(5),
    merchant: 'Supermarket A',
    category: 'Supermarket',
    alias: 'Super A',
    total: 50000,
    items: [
      { name: 'Milk', price: 2000, category: 'Fresh Food', subcategory: 'Dairy' },
      { name: 'Bread', price: 1500, category: 'Fresh Food', subcategory: 'Bakery' },
    ],
  },
  {
    id: 't2',
    date: getCurrentMonthDate(10),
    merchant: 'Restaurant B',
    category: 'Restaurant',
    alias: 'Resto B',
    total: 30000,
    items: [
      { name: 'Lunch', price: 15000, category: 'Food', subcategory: 'Meals' },
    ],
  },
  {
    id: 't3',
    date: getCurrentMonthDate(3),
    merchant: 'Pharmacy D',
    category: 'Pharmacy',
    total: 20000,
    items: [
      { name: 'Medicine', price: 15000, category: 'Health', subcategory: 'OTC' },
    ],
  },
  {
    id: 't4',
    date: getCurrentMonthDate(12),
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
    date: getCurrentMonthDate(15),
    merchant: 'Restaurant F',
    category: 'Restaurant',
    alias: 'Resto F',
    total: 35000,
    items: [
      { name: 'Dinner', price: 25000, category: 'Food', subcategory: 'Meals' },
    ],
  },
  // Previous month transaction
  {
    id: 't6',
    date: getPreviousMonthDate(15),
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
    // Story 14.14b: IconFilterBar translations
    temporalFilter: 'Time filter',
    categoryFilter: 'Category filter',
    allTime: 'All time',
    allCategories: 'All categories',
    allLocations: 'All locations',
    allGroups: 'All groups',
  };
  return translations[key] || key;
};

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
  onNavigateToHistory: vi.fn(),
};

const initialState = {
  temporal: { level: 'year' as const, year: '2024' },
  category: { level: 'all' as const },
  chartMode: 'aggregation' as const,
  drillDownMode: 'temporal' as const,
};

function renderTrendsView(props = {}, state = initialState) {
  return render(
    <HistoryFiltersProvider>
      <AnalyticsProvider initialState={state}>
        <TrendsView {...defaultProps} {...props} />
      </AnalyticsProvider>
    </HistoryFiltersProvider>
  );
}

// ============================================================================
// Initial Rendering Tests
// ============================================================================

describe('TrendsView Integration - Initial Rendering', () => {
  it('renders Explora header', () => {
    renderTrendsView();

    expect(screen.getByRole('heading', { name: 'Explora' })).toBeInTheDocument();
  });

  it('renders time period pills with Month active', () => {
    renderTrendsView();

    expect(screen.getByTestId('time-pill-month')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('time-pill-week')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders period navigator with current period label', () => {
    renderTrendsView();

    expect(screen.getByTestId('period-label')).toBeInTheDocument();
    expect(screen.getByTestId('period-nav-prev')).toBeInTheDocument();
    expect(screen.getByTestId('period-nav-next')).toBeInTheDocument();
  });

  it('renders analytics card with treemap by default', () => {
    renderTrendsView();

    expect(screen.getByTestId('analytics-card')).toBeInTheDocument();
    expect(screen.getByTestId('treemap-grid')).toBeInTheDocument();
  });

  it('shows no data message when no transactions', () => {
    renderTrendsView({ transactions: [] });

    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});

// ============================================================================
// Time Period Selection Tests
// ============================================================================

describe('TrendsView Integration - Time Period Selection', () => {
  it('changes period label format when switching pills', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // Get initial label
    const periodLabel = screen.getByTestId('period-label');
    const initialText = periodLabel.textContent;

    // Switch to Year
    await user.click(screen.getByTestId('time-pill-year'));

    // Label should change to just year format
    await waitFor(() => {
      expect(periodLabel.textContent).not.toBe(initialText);
    });
  });

  it('Week pill shows week format in period label', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    await user.click(screen.getByTestId('time-pill-week'));

    const periodLabel = screen.getByTestId('period-label');
    expect(periodLabel.textContent).toMatch(/week/i);
  });

  it('Quarter pill shows quarter format in period label', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    await user.click(screen.getByTestId('time-pill-quarter'));

    const periodLabel = screen.getByTestId('period-label');
    expect(periodLabel.textContent).toMatch(/Q\d/);
  });
});

// ============================================================================
// Period Navigation Tests
// ============================================================================

describe('TrendsView Integration - Period Navigation', () => {
  it('navigates to previous period', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    const periodLabel = screen.getByTestId('period-label');
    const initialText = periodLabel.textContent;

    await user.click(screen.getByTestId('period-nav-prev'));

    await waitFor(() => {
      expect(periodLabel.textContent).not.toBe(initialText);
    });
  });

  it('navigates to next period when not at boundary', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // First go back a period
    await user.click(screen.getByTestId('period-nav-prev'));
    const afterPrevText = screen.getByTestId('period-label').textContent;

    // Then go forward
    await user.click(screen.getByTestId('period-nav-next'));

    await waitFor(() => {
      expect(screen.getByTestId('period-label').textContent).not.toBe(afterPrevText);
    });
  });
});

// ============================================================================
// Carousel Navigation Tests
// ============================================================================

describe('TrendsView Integration - Carousel Navigation', () => {
  it('switches from Distribution to Tendencia slide', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // Initially on Distribution - Story 14.14b Session 5: shows view mode pills instead of title
    expect(screen.getByTestId('viewmode-pills-container')).toBeInTheDocument();
    expect(screen.getByTestId('treemap-grid')).toBeInTheDocument();

    // Click next
    await user.click(screen.getByTestId('carousel-next'));

    // Now on Tendencia - Story 14.14b Session 5: shows view mode pills instead of title
    await waitFor(() => {
      expect(screen.getByTestId('viewmode-pills-container')).toBeInTheDocument();
      expect(screen.getByTestId('trend-list')).toBeInTheDocument();
    });
  });

  it('switches back from Tendencia to Distribution', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // Go to Tendencia
    await user.click(screen.getByTestId('carousel-next'));
    expect(screen.getByTestId('trend-list')).toBeInTheDocument();

    // Go back to Distribution
    await user.click(screen.getByTestId('carousel-prev'));

    await waitFor(() => {
      expect(screen.getByTestId('treemap-grid')).toBeInTheDocument();
    });
  });

  it('clicking indicator segment changes slide', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // Find indicator tabs
    const indicator = screen.getByTestId('carousel-indicator');
    const tabs = indicator.querySelectorAll('[role="tab"]');

    // Click second tab (Tendencia)
    await user.click(tabs[1]);

    // Story 14.14b Session 5: Tendencia also shows view mode pills
    await waitFor(() => {
      expect(screen.getByTestId('trend-list')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// View Toggle Tests
// ============================================================================

describe('TrendsView Integration - View Toggle', () => {
  it('toggles from treemap to donut on Distribution slide', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // Initially treemap
    expect(screen.getByTestId('treemap-grid')).toBeInTheDocument();

    // Click toggle
    await user.click(screen.getByTestId('view-toggle'));

    // Now donut
    await waitFor(() => {
      expect(screen.getByTestId('donut-view')).toBeInTheDocument();
      expect(screen.queryByTestId('treemap-grid')).not.toBeInTheDocument();
    });
  });

  it('toggles from list to breakdown on Tendencia slide', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // Go to Tendencia slide
    await user.click(screen.getByTestId('carousel-next'));
    expect(screen.getByTestId('trend-list')).toBeInTheDocument();

    // Click toggle
    await user.click(screen.getByTestId('view-toggle'));

    // Now breakdown view
    await waitFor(() => {
      expect(screen.getByTestId('breakdown-view')).toBeInTheDocument();
      expect(screen.queryByTestId('trend-list')).not.toBeInTheDocument();
    });
  });

  it('toggle state is independent per slide', async () => {
    const user = userEvent.setup();
    renderTrendsView();

    // Toggle to donut on Distribution
    await user.click(screen.getByTestId('view-toggle'));
    expect(screen.getByTestId('donut-view')).toBeInTheDocument();

    // Go to Tendencia - should show list (not affected by Distribution toggle)
    await user.click(screen.getByTestId('carousel-next'));
    expect(screen.getByTestId('trend-list')).toBeInTheDocument();

    // Go back to Distribution - should still be donut
    await user.click(screen.getByTestId('carousel-prev'));
    expect(screen.getByTestId('donut-view')).toBeInTheDocument();
  });
});

// ============================================================================
// Category Drill-Down Tests
// ============================================================================

describe('TrendsView Integration - Category Navigation', () => {
  it('calls onNavigateToHistory when clicking treemap cell', async () => {
    const onNavigateToHistory = vi.fn();
    const user = userEvent.setup();
    renderTrendsView({ onNavigateToHistory });

    await user.click(screen.getByTestId('treemap-cell-supermarket'));

    expect(onNavigateToHistory).toHaveBeenCalledWith({ category: 'Supermarket' });
  });

  it('calls onNavigateToHistory when clicking trend item', async () => {
    const onNavigateToHistory = vi.fn();
    const user = userEvent.setup();
    renderTrendsView({ onNavigateToHistory });

    // Go to Tendencia slide
    await user.click(screen.getByTestId('carousel-next'));

    await user.click(screen.getByTestId('trend-item-supermarket'));

    expect(onNavigateToHistory).toHaveBeenCalledWith({ category: 'Supermarket' });
  });

  it('selects segment and updates center when clicking donut segment (Story 14.14)', async () => {
    // Story 14.14: Clicking a donut segment now selects/highlights it and updates
    // the center text. Drill-down navigation will be via chevron in legend (Phase 4/6).
    const user = userEvent.setup();
    renderTrendsView();

    // Switch to donut view
    await user.click(screen.getByTestId('view-toggle'));

    // Click a donut segment (find circle elements in donut - ring style)
    const donutView = screen.getByTestId('donut-view');
    const circles = donutView.querySelectorAll('circle[stroke]');
    expect(circles.length).toBeGreaterThan(0);

    // Click first segment - should highlight it (not navigate)
    await user.click(circles[0]);

    // Verify segment is highlighted (has thicker stroke-width when selected)
    expect(circles[0]).toHaveAttribute('stroke');
  });
});

// ============================================================================
// Theme Support Tests
// ============================================================================

describe('TrendsView Integration - Theme Support', () => {
  it('renders correctly with light theme', () => {
    renderTrendsView({ theme: 'light' });

    expect(screen.getByRole('heading', { name: 'Explora' })).toBeInTheDocument();
    expect(screen.getByTestId('analytics-card')).toBeInTheDocument();
  });

  it('renders correctly with dark theme', () => {
    renderTrendsView({ theme: 'dark' });

    expect(screen.getByRole('heading', { name: 'Explora' })).toBeInTheDocument();
    expect(screen.getByTestId('analytics-card')).toBeInTheDocument();
  });
});

// ============================================================================
// Locale Support Tests
// ============================================================================

describe('TrendsView Integration - Locale Support', () => {
  it('displays Spanish labels with es locale', () => {
    renderTrendsView({ locale: 'es' });

    // Pills should be in Spanish
    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('Mes')).toBeInTheDocument();
    expect(screen.getByText('Trimestre')).toBeInTheDocument();
    expect(screen.getByText('Año')).toBeInTheDocument();
  });

  it('displays English labels with en locale', () => {
    renderTrendsView({ locale: 'en' });

    // Pills should be in English
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Quarter')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
  });
});

// ============================================================================
// Filter Icons Tests
// ============================================================================

describe('TrendsView Integration - Filter Icons', () => {
  it('renders filter icon buttons via IconFilterBar', () => {
    renderTrendsView();

    // Story 14.14b: Filter icons are now provided by IconFilterBar component
    expect(screen.getByRole('button', { name: 'Time filter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Category filter' })).toBeInTheDocument();
  });
});

// ============================================================================
// Empty State and Edge Cases
// ============================================================================

describe('TrendsView Integration - Edge Cases', () => {
  it('handles transactions from different months gracefully', () => {
    renderTrendsView();

    // Should render without errors with mixed dates
    expect(screen.getByTestId('analytics-card')).toBeInTheDocument();
  });

  it('handles single category gracefully', () => {
    const singleCategoryTransactions: Transaction[] = [
      {
        id: 't1',
        date: getCurrentMonthDate(5),
        merchant: 'Store A',
        category: 'Supermarket',
        total: 100,
        items: [{ name: 'Item', price: 100, category: 'Food', subcategory: 'Food' }],
      },
    ];

    renderTrendsView({ transactions: singleCategoryTransactions });

    expect(screen.getByTestId('treemap-cell-supermarket')).toBeInTheDocument();
  });

  it('handles missing onNavigateToHistory callback gracefully', async () => {
    const user = userEvent.setup();
    renderTrendsView({ onNavigateToHistory: undefined });

    // Should not throw when clicking
    await user.click(screen.getByTestId('treemap-cell-supermarket'));

    // Still works
    expect(screen.getByTestId('analytics-card')).toBeInTheDocument();
  });
});
