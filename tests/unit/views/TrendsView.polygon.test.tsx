/**
 * TrendsView "Explora" Tests
 *
 * Story 14.13: Analytics Explorer Redesign
 * Epic 14: Core Implementation
 *
 * Tests for the redesigned "Explora" analytics view:
 * - Header with "Explora" title and filter icons
 * - Time period pills (Semana/Mes/Trimestre/Año)
 * - Period navigator (< Diciembre 2025 >)
 * - Analytics carousel with Distribution and Tendencia slides
 * - Treemap grid and trend list
 * - View toggle button
 * - PageTransition and TransitionChild animations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
// Test Data
// ============================================================================

// Use dynamic dates to match the current period (component starts at current date)
const getCurrentMonthDate = (day: number) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
};

const mockTransactionsWithCategories: Transaction[] = [
  {
    id: 't1',
    date: getCurrentMonthDate(5),
    merchant: 'Supermarket A',
    category: 'Supermarket',
    total: 50000,
    items: [{ name: 'Groceries', price: 50000, category: 'Fresh Food', subcategory: 'Produce' }],
  },
  {
    id: 't2',
    date: getCurrentMonthDate(10),
    merchant: 'Restaurant B',
    category: 'Restaurant',
    total: 30000,
    items: [{ name: 'Dinner', price: 30000, category: 'Food', subcategory: 'Meals' }],
  },
  {
    id: 't3',
    date: getCurrentMonthDate(15),
    merchant: 'Pharmacy C',
    category: 'Pharmacy',
    total: 20000,
    items: [{ name: 'Medicine', price: 20000, category: 'Health', subcategory: 'OTC' }],
  },
];

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    noData: 'No data',
    downloadStatistics: 'Download statistics',
    downloadTransactions: 'Download transactions',
    upgradeRequired: 'Upgrade required',
    totalSpent: 'Total Spent',
    transactions: 'Transactions',
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
  theme: 'light' as const,
  currency: 'CLP',
  locale: 'en',
  t: mockT,
  onEditTransaction: vi.fn(),
  exporting: false,
  onExporting: vi.fn(),
  onUpgradeRequired: vi.fn(),
};

const initialState = {
  temporal: { level: 'year' as const, year: '2024' },
  category: { level: 'all' as const },
  chartMode: 'aggregation' as const,
  drillDownMode: 'temporal' as const,
};

function renderTrendsView(transactions: Transaction[], props = {}, state = initialState) {
  return render(
    <HistoryFiltersProvider>
      <AnalyticsProvider initialState={state}>
        <TrendsView
          {...defaultProps}
          {...props}
          transactions={transactions}
        />
      </AnalyticsProvider>
    </HistoryFiltersProvider>
  );
}

// ============================================================================
// Header Tests (AC #1)
// ============================================================================

describe('TrendsView Explora - AC #1: Header Redesign', () => {
  it('displays "Explora" title in header', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByRole('heading', { name: 'Explora' })).toBeInTheDocument();
  });

  it('shows filter icon buttons via IconFilterBar (Time, Category)', () => {
    renderTrendsView(mockTransactionsWithCategories);

    // Story 14.14b: Filter icons are now provided by IconFilterBar component
    // which uses translation keys for aria-labels
    expect(screen.getByRole('button', { name: 'Time filter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Category filter' })).toBeInTheDocument();
  });

  it('filter buttons have proper aria-labels via IconFilterBar', () => {
    renderTrendsView(mockTransactionsWithCategories);

    // Story 14.14b: IconFilterBar provides temporal and category filter buttons
    expect(screen.getByRole('button', { name: 'Time filter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Category filter' })).toBeInTheDocument();
  });
});

// ============================================================================
// Time Period Pills Tests (AC #2)
// ============================================================================

describe('TrendsView Explora - AC #2: Time Period Pills', () => {
  it('displays time period pills (Week, Month, Quarter, Year)', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('time-pill-week')).toBeInTheDocument();
    expect(screen.getByTestId('time-pill-month')).toBeInTheDocument();
    expect(screen.getByTestId('time-pill-quarter')).toBeInTheDocument();
    expect(screen.getByTestId('time-pill-year')).toBeInTheDocument();
  });

  it('Month pill is active by default', () => {
    renderTrendsView(mockTransactionsWithCategories);

    const monthPill = screen.getByTestId('time-pill-month');
    expect(monthPill).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking a pill changes active state', async () => {
    const user = userEvent.setup();
    renderTrendsView(mockTransactionsWithCategories);

    const quarterPill = screen.getByTestId('time-pill-quarter');
    await user.click(quarterPill);

    expect(quarterPill).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('time-pill-month')).toHaveAttribute('aria-pressed', 'false');
  });
});

// ============================================================================
// Period Navigator Tests (AC #3)
// ============================================================================

describe('TrendsView Explora - AC #3: Period Navigator', () => {
  it('displays previous and next navigation buttons', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('period-nav-prev')).toBeInTheDocument();
    expect(screen.getByTestId('period-nav-next')).toBeInTheDocument();
  });

  it('displays period label', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('period-label')).toBeInTheDocument();
  });

  it('navigation buttons have proper aria-labels', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByRole('button', { name: 'Previous period' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next period' })).toBeInTheDocument();
  });
});

// ============================================================================
// Analytics Card Tests (AC #4)
// ============================================================================

describe('TrendsView Explora - AC #4: Analytics Card with Carousel', () => {
  it('renders analytics card container', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('analytics-card')).toBeInTheDocument();
  });

  it('displays view mode pills on Distribution slide', () => {
    renderTrendsView(mockTransactionsWithCategories);

    // Story 14.14b Session 5: Distribution slide shows view mode pills instead of title
    expect(screen.getByTestId('viewmode-pills-container')).toBeInTheDocument();
  });

  it('displays carousel navigation arrows', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('carousel-prev')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-next')).toBeInTheDocument();
  });

  it('displays indicator bar', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('carousel-indicator')).toBeInTheDocument();
  });

  it('clicking next slide changes carousel', async () => {
    const user = userEvent.setup();
    renderTrendsView(mockTransactionsWithCategories);

    const nextBtn = screen.getByTestId('carousel-next');
    await user.click(nextBtn);

    // Story 14.14b Session 5: Tendencia slide also shows view mode pills (no title)
    expect(screen.getByTestId('viewmode-pills-container')).toBeInTheDocument();
    expect(screen.getByTestId('trend-list')).toBeInTheDocument();
  });
});

// ============================================================================
// Treemap Distribution Tests (AC #5)
// ============================================================================

describe('TrendsView Explora - AC #5: Treemap Distribution', () => {
  it('renders treemap grid on Distribution slide', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('treemap-grid')).toBeInTheDocument();
  });

  it('shows category cards in treemap', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('treemap-cell-supermarket')).toBeInTheDocument();
    expect(screen.getByTestId('treemap-cell-restaurant')).toBeInTheDocument();
    expect(screen.getByTestId('treemap-cell-pharmacy')).toBeInTheDocument();
  });

  it('treemap cells are clickable', async () => {
    const onNavigateToHistory = vi.fn();
    const user = userEvent.setup();
    renderTrendsView(mockTransactionsWithCategories, { onNavigateToHistory });

    const supermarketCell = screen.getByTestId('treemap-cell-supermarket');
    await user.click(supermarketCell);

    expect(onNavigateToHistory).toHaveBeenCalledWith({ category: 'Supermarket' });
  });
});

// ============================================================================
// Trend List Tests (AC #6)
// ============================================================================

describe('TrendsView Explora - AC #6: Trend List', () => {
  it('renders trend list on Tendencia slide', async () => {
    const user = userEvent.setup();
    renderTrendsView(mockTransactionsWithCategories);

    // Navigate to Tendencia slide
    const nextBtn = screen.getByTestId('carousel-next');
    await user.click(nextBtn);

    expect(screen.getByTestId('trend-list')).toBeInTheDocument();
  });

  it('shows trend items with category info', async () => {
    const user = userEvent.setup();
    renderTrendsView(mockTransactionsWithCategories);

    // Navigate to Tendencia slide
    const nextBtn = screen.getByTestId('carousel-next');
    await user.click(nextBtn);

    expect(screen.getByTestId('trend-item-supermarket')).toBeInTheDocument();
    expect(screen.getByTestId('trend-item-restaurant')).toBeInTheDocument();
    expect(screen.getByTestId('trend-item-pharmacy')).toBeInTheDocument();
  });
});

// ============================================================================
// View Toggle Tests (AC #7)
// ============================================================================

describe('TrendsView Explora - AC #7: View Toggle', () => {
  it('renders view toggle button', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
  });

  it('toggle button has proper aria-label', () => {
    renderTrendsView(mockTransactionsWithCategories);

    expect(screen.getByRole('button', { name: 'Toggle view' })).toBeInTheDocument();
  });

  it('clicking toggle switches from treemap to donut', async () => {
    const user = userEvent.setup();
    renderTrendsView(mockTransactionsWithCategories);

    const toggleBtn = screen.getByTestId('view-toggle');
    await user.click(toggleBtn);

    expect(screen.getByTestId('donut-view')).toBeInTheDocument();
    expect(screen.queryByTestId('treemap-grid')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Page Transition Tests
// ============================================================================

describe('TrendsView Explora - Screen Transitions', () => {
  it('wraps content in PageTransition', () => {
    renderTrendsView(mockTransactionsWithCategories);

    const pageTransition = document.querySelector('.page-transition');
    expect(pageTransition).toBeInTheDocument();
    expect(pageTransition).toHaveAttribute('data-view', 'trends');
  });

  it('uses TransitionChild for staggered entry', () => {
    renderTrendsView(mockTransactionsWithCategories);

    const transitionChildren = document.querySelectorAll('.transition-child');
    expect(transitionChildren.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Empty State Tests
// ============================================================================

describe('TrendsView Explora - Empty States', () => {
  it('shows no data message when empty transactions', () => {
    renderTrendsView([]);

    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('does not crash with single category', () => {
    const singleCategory: Transaction[] = [{
      id: 't1',
      date: getCurrentMonthDate(5),
      merchant: 'Store',
      category: 'Supermarket',
      total: 100,
      items: [{ name: 'Item', price: 100, category: 'Food', subcategory: 'Food' }],
    }];

    expect(() => renderTrendsView(singleCategory)).not.toThrow();
  });
});
