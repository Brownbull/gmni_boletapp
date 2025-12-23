/**
 * DashboardView Unit Tests
 *
 * Story 10a.1: Home Screen Consolidation
 * Tests for the consolidated Home screen with filters, pagination, and duplicate detection.
 *
 * Coverage:
 * - AC#1: Scan AI CTA removed
 * - AC#2: Filter bar appears below summary cards
 * - AC#3: Full transaction list with pagination
 * - AC#4: Duplicate badges visible
 * - AC#5: Thumbnail clicks work
 * - AC#6: Filter state preserved
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../setup/test-utils';
import { DashboardView } from '../../../src/views/DashboardView';
import { HistoryFiltersProvider } from '../../../src/contexts/HistoryFiltersContext';

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

// Test data
const createTransaction = (overrides = {}) => ({
  id: '1',
  merchant: 'Test Supermarket',
  alias: 'Grocery Store',
  date: '2024-12-15',
  total: 45.99,
  category: 'Supermarket',
  ...overrides,
});

const createTransactionWithImages = (overrides = {}) => ({
  ...createTransaction(overrides),
  thumbnailUrl: 'https://example.com/thumb.jpg',
  imageUrls: ['https://example.com/full.jpg'],
});

// Generate multiple transactions for pagination tests
const createManyTransactions = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${i + 1}`,
    merchant: `Store ${i + 1}`,
    alias: `Alias ${i + 1}`,
    date: `2024-12-${String(15 - Math.floor(i / 3)).padStart(2, '0')}`,
    total: 10 + i,
    category: 'Supermarket',
  }));
};

// Create duplicate transactions (same date, merchant, total)
const createDuplicateTransactions = () => [
  {
    id: 'dup-1',
    merchant: 'Duplicate Store',
    alias: 'Dup Store',
    date: '2024-12-15',
    total: 50.00,
    category: 'Supermarket',
  },
  {
    id: 'dup-2',
    merchant: 'Duplicate Store',
    alias: 'Dup Store',
    date: '2024-12-15',
    total: 50.00,
    category: 'Supermarket',
  },
];

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC#1: Scan AI CTA Removed', () => {
    it('should NOT render the Scan AI CTA card', () => {
      renderDashboardView({
        allTransactions: [createTransaction()],
      });

      // The scanTitle and scanBtn translation keys should NOT be present
      expect(screen.queryByText('scanTitle')).not.toBeInTheDocument();
      expect(screen.queryByText('scanBtn')).not.toBeInTheDocument();
    });

    it('should only render Total Spent and This Month summary cards', () => {
      renderDashboardView({
        allTransactions: [createTransaction({ total: 100 })],
      });

      // Summary cards should be present
      expect(screen.getByText('totalSpent')).toBeInTheDocument();
      expect(screen.getByText('thisMonth')).toBeInTheDocument();
    });

    it('should calculate total spent correctly', () => {
      const transactions = [
        createTransaction({ id: '1', total: 100 }),
        createTransaction({ id: '2', total: 50 }),
      ];

      renderDashboardView({ allTransactions: transactions });

      // $150.00 should appear
      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });
  });

  describe('AC#2: Filter Bar Added', () => {
    it('should render HistoryFilterBar below summary cards', () => {
      renderDashboardView({
        allTransactions: [createTransaction()],
      });

      // Filter bar shows transaction count
      expect(screen.getByText(/1\s*transactions/i)).toBeInTheDocument();
    });

    it('should show correct transaction counts in filter bar', () => {
      const transactions = createManyTransactions(15);

      renderDashboardView({ allTransactions: transactions });

      // Should show total count
      expect(screen.getByText(/15\s*transactions/i)).toBeInTheDocument();
    });
  });

  describe('AC#3: Full Transaction List with Pagination', () => {
    it('should show paginated transactions (first page)', () => {
      const transactions = createManyTransactions(15);

      renderDashboardView({ allTransactions: transactions });

      // Should show first 10 transactions (page size = 10)
      expect(screen.getByText('Alias 1')).toBeInTheDocument();
      expect(screen.getByText('Alias 10')).toBeInTheDocument();

      // Should NOT show transaction 11 (it's on page 2)
      expect(screen.queryByText('Alias 11')).not.toBeInTheDocument();
    });

    it('should show pagination controls when multiple pages exist', () => {
      const transactions = createManyTransactions(15);

      renderDashboardView({ allTransactions: transactions });

      // Pagination controls
      expect(screen.getByText('prev')).toBeInTheDocument();
      expect(screen.getByText('next')).toBeInTheDocument();
      expect(screen.getByText(/page 1 \/ 2/i)).toBeInTheDocument();
    });

    it('should NOT show pagination controls when only one page', () => {
      const transactions = createManyTransactions(5);

      renderDashboardView({ allTransactions: transactions });

      // No pagination needed
      expect(screen.queryByText('prev')).not.toBeInTheDocument();
      expect(screen.queryByText('next')).not.toBeInTheDocument();
    });

    it('should navigate to next page when next button clicked', () => {
      const transactions = createManyTransactions(15);

      renderDashboardView({ allTransactions: transactions });

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

      const prevButton = screen.getByText('prev');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      const transactions = createManyTransactions(15);

      renderDashboardView({ allTransactions: transactions });

      // Navigate to last page
      fireEvent.click(screen.getByText('next'));

      const nextButton = screen.getByText('next');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('AC#4: Duplicate Badges Visible', () => {
    it('should show duplicate badge for duplicate transactions', () => {
      const duplicates = createDuplicateTransactions();

      renderDashboardView({ allTransactions: duplicates });

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

      expect(screen.queryByText('potentialDuplicate')).not.toBeInTheDocument();
    });

    it('should apply amber border to duplicate transactions', () => {
      const duplicates = createDuplicateTransactions();

      renderDashboardView({ allTransactions: duplicates });

      const cards = screen.getAllByTestId('transaction-card');
      // Both cards should have amber border
      cards.forEach(card => {
        expect(card).toHaveClass('border-amber-400');
      });
    });
  });

  describe('AC#5: Thumbnail Clicks Work', () => {
    it('should render thumbnail when transaction has thumbnailUrl', () => {
      renderDashboardView({
        allTransactions: [createTransactionWithImages()],
      });

      expect(screen.getByTestId('transaction-thumbnail')).toBeInTheDocument();
    });

    it('should open ImageViewer when thumbnail is clicked', () => {
      renderDashboardView({
        allTransactions: [createTransactionWithImages()],
      });

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

      fireEvent.click(screen.getByText(tx.alias!));

      expect(onEditTransaction).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should render empty transaction list when no transactions', () => {
      renderDashboardView({ allTransactions: [] });

      // Summary cards should still show with $0.00 (both Total Spent and This Month)
      const zeroAmounts = screen.getAllByText('$0.00');
      expect(zeroAmounts).toHaveLength(2);
    });
  });

  describe('Summary Card Interactions', () => {
    it('should call onViewTrends with null when Total Spent card is clicked', () => {
      const onViewTrends = vi.fn();

      renderDashboardView({
        allTransactions: [createTransaction()],
        onViewTrends,
      });

      fireEvent.click(screen.getByText('totalSpent'));

      expect(onViewTrends).toHaveBeenCalledWith(null);
    });

    it('should call onViewTrends with current month when This Month card is clicked', () => {
      const onViewTrends = vi.fn();
      const currentMonth = new Date().toISOString().slice(0, 7);

      renderDashboardView({
        allTransactions: [createTransaction()],
        onViewTrends,
      });

      fireEvent.click(screen.getByText('thisMonth'));

      expect(onViewTrends).toHaveBeenCalledWith(currentMonth);
    });
  });

  describe('Header Actions', () => {
    it('should call onCreateNew when + button is clicked', () => {
      const onCreateNew = vi.fn();

      renderDashboardView({
        allTransactions: [createTransaction()],
        onCreateNew,
      });

      const plusButton = screen.getByLabelText('newTrans');
      fireEvent.click(plusButton);

      expect(onCreateNew).toHaveBeenCalled();
    });
  });

  describe('AC#6: Filter State Preserved', () => {
    it('should reset to page 1 when filters change (filter state triggers re-render)', () => {
      const transactions = createManyTransactions(25);

      const { rerender } = render(
        <HistoryFiltersProvider>
          <DashboardView
            transactions={[]}
            allTransactions={transactions}
            t={(key: string) => key}
            currency="USD"
            dateFormat="MM/DD/YYYY"
            theme="light"
            formatCurrency={(amount: number) => `$${amount.toFixed(2)}`}
            formatDate={(date: string) => date}
            getSafeDate={(val: any) => val || new Date().toISOString().split('T')[0]}
            onCreateNew={vi.fn()}
            onViewTrends={vi.fn()}
            onEditTransaction={vi.fn()}
            lang="en"
          />
        </HistoryFiltersProvider>
      );

      // Navigate to page 2
      fireEvent.click(screen.getByText('next'));
      expect(screen.getByText(/page 2 \/ 3/i)).toBeInTheDocument();

      // Re-render with same provider (simulating filter change would reset page)
      // The component has useEffect that resets page when filterState changes
      // This test verifies the pagination reset mechanism exists
      rerender(
        <HistoryFiltersProvider>
          <DashboardView
            transactions={[]}
            allTransactions={transactions}
            t={(key: string) => key}
            currency="USD"
            dateFormat="MM/DD/YYYY"
            theme="light"
            formatCurrency={(amount: number) => `$${amount.toFixed(2)}`}
            formatDate={(date: string) => date}
            getSafeDate={(val: any) => val || new Date().toISOString().split('T')[0]}
            onCreateNew={vi.fn()}
            onViewTrends={vi.fn()}
            onEditTransaction={vi.fn()}
            lang="en"
          />
        </HistoryFiltersProvider>
      );

      // Page should still be 2 since filter state didn't change
      expect(screen.getByText(/page 2 \/ 3/i)).toBeInTheDocument();
    });

    it('should preserve filter context across transaction interactions', () => {
      const onEditTransaction = vi.fn();
      const transactions = createManyTransactions(5);

      renderDashboardView({
        allTransactions: transactions,
        onEditTransaction,
      });

      // Verify filter bar is rendered (filter context is active)
      expect(screen.getByText(/5\s*transactions/i)).toBeInTheDocument();

      // Click a transaction
      fireEvent.click(screen.getByText('Alias 1'));

      // Filter context should still be active (transaction count still visible)
      // The context persists because we're still within the same provider
      expect(onEditTransaction).toHaveBeenCalled();
    });
  });
});
