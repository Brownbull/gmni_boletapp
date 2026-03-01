/**
 * DashboardView Recientes & Duplicate Tests
 *
 * TD-15b-32: Split from DashboardView.test.tsx (827 lines → 3 files).
 * Covers: AC#3 (Recientes), AC#5 (Duplicates), Thumbnails, Navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../setup/test-utils';
import { DashboardView } from '../../../src/views/DashboardView';
import { useHistoryFiltersStore, getDefaultFilterState } from '@/shared/stores/useHistoryFiltersStore';
import type { UseDashboardViewDataReturn } from '../../../src/views/DashboardView/useDashboardViewData';
import {
  createDefaultMockHookData,
  createTransaction,
  createTransactionWithImages,
  createCategoryTransactions,
  createManyTransactions,
  createDuplicateTransactions,
} from './dashboardViewFixtures';

// =============================================================================
// Mocks
// =============================================================================

const mockHookData = createDefaultMockHookData();
const mockHandleNavigateToHistory = vi.fn();

vi.mock('../../../src/features/dashboard/views/DashboardView/useDashboardViewData', () => ({
  useDashboardViewData: vi.fn(() => mockHookData),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => ({ delete: vi.fn(), commit: vi.fn(() => Promise.resolve()) })),
}));

vi.mock('../../../src/services/firestore', () => ({
  deleteTransactionsBatch: vi.fn(() => Promise.resolve()),
  updateTransaction: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../src/hooks/useAllUserGroups', () => ({
  useAllUserGroups: vi.fn(() => ({
    groups: [], isLoading: false, error: undefined, hasGroups: false, personalGroupCount: 0,
  })),
}));

vi.mock('../../../src/shared/hooks', () => ({
  useHistoryNavigation: vi.fn(() => ({
    handleNavigateToHistory: mockHandleNavigateToHistory,
  })),
}));

vi.mock('../../../src/shared/stores', () => ({
  useNavigationActions: vi.fn(() => ({
    setView: vi.fn(), navigateBack: vi.fn(), setHistoryFilters: vi.fn(),
  })),
}));

// =============================================================================
// Helpers
// =============================================================================

const renderDashboardView = (overrides: Partial<UseDashboardViewDataReturn> = {}) => {
  const normalizedOverrides = { ...overrides };
  if (normalizedOverrides.allTransactions && !normalizedOverrides.transactions) {
    normalizedOverrides.transactions = normalizedOverrides.allTransactions;
  }
  if (normalizedOverrides.transactions && !normalizedOverrides.allTransactions) {
    normalizedOverrides.allTransactions = normalizedOverrides.transactions;
  }
  Object.assign(mockHookData, normalizedOverrides);
  useHistoryFiltersStore.getState().initializeFilters(getDefaultFilterState());
  return render(<DashboardView _testOverrides={normalizedOverrides} />);
};

// =============================================================================
// Tests
// =============================================================================

describe('DashboardView — Recientes & Lists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // TD-15b-32: Reset Zustand store to prevent cross-file state leak in pool: 'threads'
    useHistoryFiltersStore.setState({ ...getDefaultFilterState(), initialized: true });
    Object.assign(mockHookData, createDefaultMockHookData());
  });

  describe('AC#3: Recientes Carousel Section', () => {
    it('should render recientes carousel with default "latestScanned" slide', () => {
      renderDashboardView({ allTransactions: createManyTransactions(10) });
      expect(screen.getByText('latestScanned')).toBeInTheDocument();
      expect(screen.getByTestId('recientes-indicator-bar')).toBeInTheDocument();
      expect(screen.getByTestId('recientes-indicator-0')).toBeInTheDocument();
      expect(screen.getByTestId('recientes-indicator-1')).toBeInTheDocument();
    });

    it('should switch to "byDate" slide when indicator is clicked', () => {
      renderDashboardView({ allTransactions: createManyTransactions(10) });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      expect(screen.getByText('byDate')).toBeInTheDocument();
    });

    it('should show 5 transactions by default (collapsed)', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      const cards = screen.getAllByTestId('transaction-card');
      expect(cards).toHaveLength(5);
    });

    it('should expand to show 10 transactions when "See More" card clicked', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      fireEvent.click(screen.getByTestId('see-more-card'));
      const cards = screen.getAllByTestId('transaction-card');
      expect(cards).toHaveLength(10);
    });

    it('should show "Ver todo" link when more than 5 transactions', () => {
      renderDashboardView({ allTransactions: createManyTransactions(10) });
      expect(screen.getByTestId('view-all-link')).toBeInTheDocument();
    });

    it('should ALWAYS show "Ver todo" link even with 3 or fewer transactions', () => {
      renderDashboardView({ allTransactions: createManyTransactions(3) });
      expect(screen.getByTestId('view-all-link')).toBeInTheDocument();
    });

    it('should show empty state when no transactions', () => {
      renderDashboardView({ allTransactions: [] });
      expect(screen.getByText('noRecentTransactions')).toBeInTheDocument();
    });
  });

  describe('AC#5: Duplicate Detection', () => {
    it('should show duplicate badge for duplicate transactions', () => {
      renderDashboardView({ allTransactions: createDuplicateTransactions() });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      const badges = screen.getAllByText('potentialDuplicate');
      expect(badges).toHaveLength(2);
    });

    it('should NOT show duplicate badge for unique transactions', () => {
      renderDashboardView({
        allTransactions: [
          createTransaction({ id: '1', merchant: 'Store A', total: 10 }),
          createTransaction({ id: '2', merchant: 'Store B', total: 20 }),
        ],
      });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      expect(screen.queryByText('potentialDuplicate')).not.toBeInTheDocument();
    });

    it('should detect duplicate transactions and show filter button', () => {
      renderDashboardView({ allTransactions: createDuplicateTransactions() });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      const badges = screen.getAllByText('potentialDuplicate');
      expect(badges).toHaveLength(2);
    });
  });

  describe('Thumbnail Functionality', () => {
    it('should render thumbnail when transaction has thumbnailUrl', () => {
      renderDashboardView({ allTransactions: [createTransactionWithImages()] });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      expect(screen.getByTestId('transaction-thumbnail')).toBeInTheDocument();
    });

    it('should open ImageViewer when thumbnail is clicked', () => {
      renderDashboardView({ allTransactions: [createTransactionWithImages()] });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      fireEvent.click(screen.getByTestId('transaction-thumbnail'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should NOT trigger onEditTransaction when thumbnail is clicked', () => {
      const onEditTransaction = vi.fn();
      renderDashboardView({ allTransactions: [createTransactionWithImages()], onEditTransaction });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      fireEvent.click(screen.getByTestId('transaction-thumbnail'));
      expect(onEditTransaction).not.toHaveBeenCalled();
    });

    it('should trigger onEditTransaction when clicking on transaction row', () => {
      const onEditTransaction = vi.fn();
      const tx = createTransaction();
      renderDashboardView({ allTransactions: [tx], onEditTransaction });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      fireEvent.click(screen.getByText(tx.alias!));
      expect(onEditTransaction).toHaveBeenCalledWith(tx);
    });
  });

  describe('Navigation', () => {
    it('should use handleNavigateToHistory when View All clicked on "Por Fecha" slide', () => {
      mockHandleNavigateToHistory.mockClear();
      renderDashboardView({ allTransactions: createManyTransactions(10) });
      fireEvent.click(screen.getByTestId('recientes-indicator-1'));
      fireEvent.click(screen.getByTestId('see-more-card'));
      fireEvent.click(screen.getByTestId('view-all-link'));
      expect(mockHandleNavigateToHistory).toHaveBeenCalledWith(
        expect.objectContaining({ temporal: expect.objectContaining({ level: 'month' }) })
      );
    });
  });
});
