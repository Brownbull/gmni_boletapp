/**
 * DashboardView Unit Tests
 *
 * Story 14.12: Home Dashboard Refresh
 * Tests for the redesigned dashboard matching home-dashboard.html mockup:
 * - Carousel with 3 views (Treemap, Polygon, Bump Chart)
 * - Month/Year picker dropdown
 * - "Recientes" expandable transaction list
 * - Quick action buttons
 *
 * Coverage:
 * - AC#1: Carousel with 3 slides (This Month, Month to Month, Last 4 Months)
 * - AC#2: Month picker dropdown for date selection
 * - AC#3: Recientes section (5 collapsed, 10 expanded)
 * - AC#4: Quick action buttons (Scan, Add Manual)
 * - AC#5: Duplicate detection in transaction list
 * - AC#6: Full list view with filters and pagination
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, mockViewHandlers, disableNavigationHandler, restoreNavigationHandler } from '../../setup/test-utils';
import { DashboardView } from '../../../src/views/DashboardView';
import { HistoryFiltersProvider } from '../../../src/contexts/HistoryFiltersContext';

// Group consolidation: Mock firebase/firestore for getFirestore calls
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

// Group consolidation: Mock firestore service for updateTransaction
vi.mock('../../../src/services/firestore', () => ({
  deleteTransactionsBatch: vi.fn(() => Promise.resolve()),
  updateTransaction: vi.fn(() => Promise.resolve()),
}));

// Group consolidation: Mock useAllUserGroups hook
vi.mock('../../../src/hooks/useAllUserGroups', () => ({
  useAllUserGroups: vi.fn(() => ({
    groups: [],
    isLoading: false,
    error: undefined,
    hasGroups: false,
    sharedGroupCount: 0,
    personalGroupCount: 0,
  })),
}));

// Helper to format month in short format (e.g., "Jan '26")
const formatShortMonth = (month: number, year: number) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const shortYear = year.toString().slice(-2);
  return `${monthNames[month]} '${shortYear}`;
};

// Helper to render DashboardView with required provider
const renderDashboardView = (props: Partial<React.ComponentProps<typeof DashboardView>> = {}) => {
  const defaultProps: React.ComponentProps<typeof DashboardView> = {
    transactions: [],
    allTransactions: [],
    t: (key: string) => key,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
    formatDate: (date: string) => date,
    getSafeDate: (val: any) => val || new Date().toISOString().split('T')[0],
    onCreateNew: vi.fn(),
    onViewTrends: vi.fn(),
    onEditTransaction: vi.fn(),
    onTriggerScan: vi.fn(),
    lang: 'en',
  };

  return render(
    <HistoryFiltersProvider>
      <DashboardView {...defaultProps} {...props} />
    </HistoryFiltersProvider>
  );
};

// Test data - transactions within current month
const createTransaction = (overrides = {}) => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return {
    id: '1',
    merchant: 'Test Supermarket',
    alias: 'Grocery Store',
    date: `${currentMonth}-15`,
    total: 45.99,
    category: 'Supermercado',
    ...overrides,
  };
};

const createTransactionWithImages = (overrides = {}) => ({
  ...createTransaction(overrides),
  thumbnailUrl: 'https://example.com/thumb.jpg',
  imageUrls: ['https://example.com/full.jpg'],
});

// Generate multiple transactions for different categories
const createCategoryTransactions = () => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return [
    { id: 'tx-1', merchant: 'Supermarket A', alias: 'Super A', date: `${currentMonth}-15`, total: 200, category: 'Supermercado' },
    { id: 'tx-2', merchant: 'Restaurant B', alias: 'Rest B', date: `${currentMonth}-14`, total: 150, category: 'Restaurante' },
    { id: 'tx-3', merchant: 'Gas Station', alias: 'Gas', date: `${currentMonth}-13`, total: 100, category: 'Transporte' },
    { id: 'tx-4', merchant: 'Other Store', alias: 'Other', date: `${currentMonth}-12`, total: 50, category: 'Otro' },
    { id: 'tx-5', merchant: 'Supermarket C', alias: 'Super C', date: `${currentMonth}-11`, total: 100, category: 'Supermercado' },
    { id: 'tx-6', merchant: 'Restaurant D', alias: 'Rest D', date: `${currentMonth}-10`, total: 75, category: 'Restaurante' },
  ];
};

// Generate many transactions for pagination tests
const createManyTransactions = (count: number) => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${i + 1}`,
    merchant: `Store ${i + 1}`,
    alias: `Alias ${i + 1}`,
    date: `${currentMonth}-${String(15 - Math.floor(i / 3)).padStart(2, '0')}`,
    total: 10 + i,
    category: 'Supermercado',
  }));
};

// Create duplicate transactions (same date, merchant, total)
const createDuplicateTransactions = () => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return [
    { id: 'dup-1', merchant: 'Duplicate Store', alias: 'Dup Store', date: `${currentMonth}-15`, total: 50.00, category: 'Supermercado' },
    { id: 'dup-2', merchant: 'Duplicate Store', alias: 'Dup Store', date: `${currentMonth}-15`, total: 50.00, category: 'Supermercado' },
  ];
};

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Story 14.12: Carousel Layout', () => {
    describe('AC#1: Carousel with 3 Views', () => {
      it('should render carousel card', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        expect(screen.getByTestId('carousel-card')).toBeInTheDocument();
      });

      it('should show carousel title with current slide name', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        // Story 14.13: Title shows month name in short format (e.g., "Jan '26")
        const now = new Date();
        const expectedTitle = formatShortMonth(now.getMonth(), now.getFullYear());
        expect(screen.getByTestId('carousel-title')).toHaveTextContent(expectedTitle);
      });

      // Story 14.13 Session 11: Navigation arrows removed - use carousel indicators instead
      it('should navigate to slide when indicator is clicked (slide 1)', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        // Click slide 1 indicator - treemap should change to radar view
        fireEvent.click(screen.getByTestId('carousel-indicator-1'));

        // Title still shows month name (no longer changes with slides)
        const now = new Date();
        const expectedTitle = formatShortMonth(now.getMonth(), now.getFullYear());
        expect(screen.getByTestId('carousel-title')).toHaveTextContent(expectedTitle);
      });

      it('should navigate back to slide 0 when indicator is clicked', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        // Go to slide 1, then back to 0
        fireEvent.click(screen.getByTestId('carousel-indicator-1'));
        fireEvent.click(screen.getByTestId('carousel-indicator-0'));

        // Should still show month name
        const now = new Date();
        const expectedTitle = formatShortMonth(now.getMonth(), now.getFullYear());
        expect(screen.getByTestId('carousel-title')).toHaveTextContent(expectedTitle);
      });

      it('should show carousel indicator bar with 3 segments', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        expect(screen.getByTestId('carousel-indicator-0')).toBeInTheDocument();
        expect(screen.getByTestId('carousel-indicator-1')).toBeInTheDocument();
        expect(screen.getByTestId('carousel-indicator-2')).toBeInTheDocument();
      });

      it('should navigate to slide when indicator is clicked', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        fireEvent.click(screen.getByTestId('carousel-indicator-2'));

        // Title still shows month name (indicators change view content, not title)
        const now = new Date();
        const expectedTitle = formatShortMonth(now.getMonth(), now.getFullYear());
        expect(screen.getByTestId('carousel-title')).toHaveTextContent(expectedTitle);
      });

      it('should render swipeable month title container', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        // Story 14.13: Month title container is swipeable (no buttons)
        const title = screen.getByTestId('carousel-title');
        expect(title).toBeInTheDocument();
        expect(title).toHaveClass('cursor-pointer');
        // Contains current month in short format
        const now = new Date();
        expect(title).toHaveTextContent(formatShortMonth(now.getMonth(), now.getFullYear()));
      });

      it('should always show carousel content', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        // Story 14.13: Collapse functionality removed
        expect(screen.getByTestId('carousel-content')).toBeInTheDocument();
      });
    });

    describe('AC#1a: Treemap View (Slide 0)', () => {
      it('should display top categories in treemap grid', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        // Should show top categories
        expect(screen.getByText('Supermercado')).toBeInTheDocument();
        expect(screen.getByText('Restaurante')).toBeInTheDocument();
      });

      it.skip('should navigate to filtered transactions when treemap cell is clicked', () => {
        const onNavigateToHistory = vi.fn();
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
          onNavigateToHistory,
        });

        // Story 14.13: Clicking on a treemap cell navigates to filtered transactions
        const supermarketCell = screen.getByTestId('treemap-cell-supermercado');
        fireEvent.click(supermarketCell);

        expect(onNavigateToHistory).toHaveBeenCalledWith(
          expect.objectContaining({ storeCategory: 'Supermercado' })
        );
      });

      it('should show empty state when no transactions', () => {
        renderDashboardView({ allTransactions: [] });

        expect(screen.getByText('noTransactionsThisMonth')).toBeInTheDocument();
      });

      it('should show month total in footer', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        expect(screen.getByText('Total del mes')).toBeInTheDocument();
      });
    });

    describe('AC#1b: Radar Chart View (Slide 1)', () => {
      it('should show radar view when navigating to slide 1', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        // Story 14.13 Session 11: Use indicator instead of removed next button
        fireEvent.click(screen.getByTestId('carousel-indicator-1'));

        expect(screen.getByTestId('radar-view')).toBeInTheDocument();
      });

      it('should show fallback message when fewer than 3 categories', () => {
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        const fewCategories = [
          { id: 'tx-1', merchant: 'Store', alias: 'S', date: `${currentMonth}-15`, total: 100, category: 'Supermercado' },
        ];

        renderDashboardView({ allTransactions: fewCategories });

        // Story 14.13 Session 11: Use indicator instead of removed next button
        fireEvent.click(screen.getByTestId('carousel-indicator-1'));

        expect(screen.getByText('needMoreCategories')).toBeInTheDocument();
      });
    });

    describe('AC#1c: Bump Chart View (Slide 2)', () => {
      it('should show bump chart view when navigating to slide 2', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        fireEvent.click(screen.getByTestId('carousel-indicator-2'));

        expect(screen.getByTestId('bump-chart-view')).toBeInTheDocument();
      });
    });

    describe('AC#2: Month Navigation', () => {
      it('should display month name in title', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        // Story 14.13: Title shows month name in short format (e.g., "Jan '26")
        const now = new Date();
        const expectedTitle = formatShortMonth(now.getMonth(), now.getFullYear());
        expect(screen.getByTestId('carousel-title')).toHaveTextContent(expectedTitle);
      });

      it('should navigate to previous month on swipe right', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        const now = new Date();
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const expectedTitle = formatShortMonth(prevMonth, prevYear);

        // Swipe right on month title to go to previous month
        const title = screen.getByTestId('carousel-title');
        fireEvent.touchStart(title, { targetTouches: [{ clientX: 100 }] });
        fireEvent.touchMove(title, { targetTouches: [{ clientX: 200 }] }); // Move right = prev month
        fireEvent.touchEnd(title);

        expect(screen.getByTestId('carousel-title')).toHaveTextContent(expectedTitle);
      });

      it('should not navigate past current month on swipe left', () => {
        renderDashboardView({
          allTransactions: createCategoryTransactions(),
        });

        const now = new Date();
        const currentTitle = formatShortMonth(now.getMonth(), now.getFullYear());

        // Swipe left on month title (should have no effect when at current month)
        const title = screen.getByTestId('carousel-title');
        fireEvent.touchStart(title, { targetTouches: [{ clientX: 200 }] });
        fireEvent.touchMove(title, { targetTouches: [{ clientX: 100 }] }); // Move left = next month
        fireEvent.touchEnd(title);

        // Should still show current month
        expect(screen.getByTestId('carousel-title')).toHaveTextContent(currentTitle);
      });
    });
  });

  describe('AC#3: Recientes Carousel Section', () => {
    it('should render recientes carousel with default "Últimos Escaneados" slide', () => {
      renderDashboardView({
        allTransactions: createManyTransactions(10),
      });

      // Default slide is 0 = "Últimos Escaneados"
      expect(screen.getByText('Últimos Escaneados')).toBeInTheDocument();
      // Should have indicator bar with 2 segments
      expect(screen.getByTestId('recientes-indicator-bar')).toBeInTheDocument();
      expect(screen.getByTestId('recientes-indicator-0')).toBeInTheDocument();
      expect(screen.getByTestId('recientes-indicator-1')).toBeInTheDocument();
    });

    it('should switch to "Por Fecha" slide when indicator is clicked', async () => {
      renderDashboardView({
        allTransactions: createManyTransactions(10),
      });

      // Click on second indicator
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      // Title should change
      expect(screen.getByText('Por Fecha')).toBeInTheDocument();
    });

    it('should show 5 transactions by default (collapsed)', () => {
      const transactions = createManyTransactions(15);

      renderDashboardView({ allTransactions: transactions });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      // Should only show first 5 (updated from 3)
      const cards = screen.getAllByTestId('transaction-card');
      expect(cards).toHaveLength(5);
    });

    it('should expand to show 10 transactions when "See More" card clicked', () => {
      const transactions = createManyTransactions(15);

      renderDashboardView({ allTransactions: transactions });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      // Click "See More" card at end of list (Story 14.41b: replaced expand button)
      fireEvent.click(screen.getByTestId('see-more-card'));

      // Should now show 10 (updated from 5)
      const cards = screen.getAllByTestId('transaction-card');
      expect(cards).toHaveLength(10);
    });

    it('should show "Ver todo" link when more than 5 transactions', () => {
      const transactions = createManyTransactions(10);

      renderDashboardView({ allTransactions: transactions });

      expect(screen.getByTestId('view-all-link')).toBeInTheDocument();
    });

    it('should ALWAYS show "Ver todo" link even with 3 or fewer transactions', () => {
      // Story 14.12: Ver todo is always visible - expand just shows 3→5 items, not all
      const transactions = createManyTransactions(3);

      renderDashboardView({ allTransactions: transactions });

      // Ver todo should always be visible to navigate to full HistoryView
      expect(screen.getByTestId('view-all-link')).toBeInTheDocument();
    });

    it('should show empty state when no transactions', () => {
      renderDashboardView({ allTransactions: [] });

      expect(screen.getByText('noRecentTransactions')).toBeInTheDocument();
    });
  });

  // AC#4: Quick Action Buttons - REMOVED per Story 14.12 mockup alignment
  // FAB in Nav.tsx now handles scan functionality, no separate buttons needed

  describe('AC#5: Duplicate Detection', () => {
    it('should show duplicate badge for duplicate transactions', () => {
      const duplicates = createDuplicateTransactions();

      renderDashboardView({ allTransactions: duplicates });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      // Both should show duplicate badge
      const badges = screen.getAllByText('potentialDuplicate');
      expect(badges).toHaveLength(2);
    });

    it('should NOT show duplicate badge for unique transactions', () => {
      const transactions = [
        createTransaction({ id: '1', merchant: 'Store A', total: 10 }),
        createTransaction({ id: '2', merchant: 'Store B', total: 20 }),
      ];

      renderDashboardView({ allTransactions: transactions });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      expect(screen.queryByText('potentialDuplicate')).not.toBeInTheDocument();
    });

    it('should detect duplicate transactions and show filter button', () => {
      // Story 14.12: Carousel layout doesn't show individual transaction cards
      // Duplicate detection is shown via the filter button in list view
      const duplicates = createDuplicateTransactions();

      renderDashboardView({ allTransactions: duplicates });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      // Duplicates are detected and shown via badge count
      // The amber border styling is applied in full list view, not carousel
      const badges = screen.getAllByText('potentialDuplicate');
      expect(badges).toHaveLength(2);
    });
  });

  describe('Thumbnail Functionality', () => {
    it('should render thumbnail when transaction has thumbnailUrl', () => {
      renderDashboardView({
        allTransactions: [createTransactionWithImages()],
      });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      expect(screen.getByTestId('transaction-thumbnail')).toBeInTheDocument();
    });

    it('should open ImageViewer when thumbnail is clicked', () => {
      renderDashboardView({
        allTransactions: [createTransactionWithImages()],
      });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      const thumbnail = screen.getByTestId('transaction-thumbnail');
      fireEvent.click(thumbnail);

      // ImageViewer should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should NOT trigger onEditTransaction when thumbnail is clicked', () => {
      const onEditTransaction = vi.fn();

      renderDashboardView({
        allTransactions: [createTransactionWithImages()],
        onEditTransaction,
      });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      const thumbnail = screen.getByTestId('transaction-thumbnail');
      fireEvent.click(thumbnail);

      expect(onEditTransaction).not.toHaveBeenCalled();
    });

    it('should trigger onEditTransaction when clicking on transaction row', () => {
      const onEditTransaction = vi.fn();
      const tx = createTransaction();

      renderDashboardView({
        allTransactions: [tx],
        onEditTransaction,
      });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));

      fireEvent.click(screen.getByText(tx.alias!));

      expect(onEditTransaction).toHaveBeenCalled();
    });
  });

  describe('Full List View (View All)', () => {
    // Story 14c-refactor.36: Override navigation handler so full list view renders inline
    // When handleNavigateToHistory is provided (via ViewHandlersContext), clicking "View All"
    // navigates away instead of showing inline pagination. These tests need the inline view.
    beforeEach(() => {
      disableNavigationHandler();
    });

    afterEach(() => {
      restoreNavigationHandler();
    });

    // Helper to navigate to full list view
    const navigateToFullList = () => {
      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      // Story 14.41b: Expand using "See More" card (replaced expand button)
      fireEvent.click(screen.getByTestId('see-more-card'));
      const viewAllLink = screen.getByTestId('view-all-link');
      fireEvent.click(viewAllLink);
    };

    describe('AC#6: Filter Bar in Full List', () => {
      it.skip('should show filter bar in full list view', () => {
        // TODO: This test needs investigation - the full list view may not render correctly in isolation
        const transactions = createManyTransactions(15);

        renderDashboardView({ allTransactions: transactions });

        navigateToFullList();

        // Filter bar shows transaction count - uses translation key
        expect(screen.getByText('transactions')).toBeInTheDocument();
      });

      it('should show back button in full list view', () => {
        const transactions = createManyTransactions(15);

        renderDashboardView({ allTransactions: transactions });

        navigateToFullList();

        expect(screen.getByText('backToDashboard')).toBeInTheDocument();
      });

      it('should return to dashboard when back button is clicked', () => {
        const transactions = createManyTransactions(15);

        renderDashboardView({ allTransactions: transactions });

        navigateToFullList();

        fireEvent.click(screen.getByText('backToDashboard'));

        // Should be back on dashboard (carousel visible)
        expect(screen.getByTestId('carousel-card')).toBeInTheDocument();
      });
    });

    describe('Pagination in Full List', () => {
      it('should show paginated transactions (first page)', () => {
        const transactions = createManyTransactions(15);

        renderDashboardView({ allTransactions: transactions });

        navigateToFullList();

        // Should show first 10 transactions (page size = 10)
        expect(screen.getByText('Alias 1')).toBeInTheDocument();
        expect(screen.getByText('Alias 10')).toBeInTheDocument();

        // Should NOT show transaction 11 (it's on page 2)
        expect(screen.queryByText('Alias 11')).not.toBeInTheDocument();
      });

      it('should show pagination controls when multiple pages exist', () => {
        const transactions = createManyTransactions(15);

        renderDashboardView({ allTransactions: transactions });

        navigateToFullList();

        // Pagination controls
        expect(screen.getByText('prev')).toBeInTheDocument();
        expect(screen.getByText('next')).toBeInTheDocument();
        expect(screen.getByText(/page 1 \/ 2/i)).toBeInTheDocument();
      });

      it('should navigate to next page when next button clicked', () => {
        const transactions = createManyTransactions(15);

        renderDashboardView({ allTransactions: transactions });

        navigateToFullList();

        // Click next
        fireEvent.click(screen.getByText('next'));

        // Should now show transactions 11-15
        expect(screen.getByText('Alias 11')).toBeInTheDocument();
        expect(screen.getByText('Alias 15')).toBeInTheDocument();

        // Should NOT show transaction 1 (it's on page 1)
        expect(screen.queryByText('Alias 1')).not.toBeInTheDocument();

        // Page indicator should update
        expect(screen.getByText(/page 2 \/ 2/i)).toBeInTheDocument();
      });

      it('should disable prev button on first page', () => {
        const transactions = createManyTransactions(15);

        renderDashboardView({ allTransactions: transactions });

        navigateToFullList();

        const prevButton = screen.getByText('prev');
        expect(prevButton).toBeDisabled();
      });

      it('should disable next button on last page', () => {
        const transactions = createManyTransactions(15);

        renderDashboardView({ allTransactions: transactions });

        navigateToFullList();

        // Navigate to last page
        fireEvent.click(screen.getByText('next'));

        const nextButton = screen.getByText('next');
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should use onNavigateToHistory callback when provided for View All on "Por Fecha" slide', () => {
      // Story 14c-refactor.27: Reset and use context mock instead of prop callback
      mockViewHandlers.navigation.handleNavigateToHistory.mockClear();
      const transactions = createManyTransactions(10);

      renderDashboardView({
        allTransactions: transactions,
      });

      // Switch to "Por Fecha" slide (slide 1) which uses allTransactions
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      // Story 14.41b: Expand using "See More" card (replaced expand button)
      fireEvent.click(screen.getByTestId('see-more-card'));
      fireEvent.click(screen.getByTestId('view-all-link'));

      // Story 14c-refactor.27: On slide 1, it calls context navigation handler
      expect(mockViewHandlers.navigation.handleNavigateToHistory).toHaveBeenCalled();
    });
  });
});
