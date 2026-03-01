/**
 * DashboardView Full List & Pagination Tests
 *
 * TD-15b-32: Split from DashboardView.test.tsx (827 lines → 3 files).
 * Covers: AC#6 (Full List View with filters and pagination)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '../../setup/test-utils';
import { DashboardView } from '../../../src/views/DashboardView';
import { useHistoryFiltersStore, getDefaultFilterState } from '@/shared/stores/useHistoryFiltersStore';
import type { UseDashboardViewDataReturn } from '../../../src/views/DashboardView/useDashboardViewData';
import { createDefaultMockHookData, createManyTransactions } from './dashboardViewFixtures';

// =============================================================================
// Mocks
// =============================================================================

const mockHookData = createDefaultMockHookData();

// Track whether navigation should be disabled (for inline full list view tests)
let navigationDisabled = false;

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
    handleNavigateToHistory: navigationDisabled ? undefined : vi.fn(),
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

/** Navigate to the full list view within DashboardView */
const navigateToFullList = () => {
  fireEvent.click(screen.getByTestId('recientes-indicator-1'));
  fireEvent.click(screen.getByTestId('see-more-card'));
  fireEvent.click(screen.getByTestId('view-all-link'));
};

// =============================================================================
// Tests
// =============================================================================

describe('DashboardView — Full List View', () => {
  // Full list tests require navigation disabled so inline view renders
  beforeEach(() => {
    vi.clearAllMocks();
    // TD-15b-32: Reset Zustand store to prevent cross-file state leak in pool: 'threads'
    useHistoryFiltersStore.setState({ ...getDefaultFilterState(), initialized: true });
    Object.assign(mockHookData, createDefaultMockHookData());
    navigationDisabled = true;
  });

  afterEach(() => {
    navigationDisabled = false;
  });

  describe('AC#6: Filter Bar in Full List', () => {
    it.skip('should show filter bar in full list view', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      navigateToFullList();
      expect(screen.getByText('transactions')).toBeInTheDocument();
    });

    it('should show back button in full list view', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      navigateToFullList();
      expect(screen.getByText('backToDashboard')).toBeInTheDocument();
    });

    it('should return to dashboard when back button is clicked', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      navigateToFullList();
      fireEvent.click(screen.getByText('backToDashboard'));
      expect(screen.getByTestId('carousel-card')).toBeInTheDocument();
    });
  });

  describe('Pagination in Full List', () => {
    it('should show paginated transactions (first page)', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      navigateToFullList();
      expect(screen.getByText('Alias 1')).toBeInTheDocument();
      expect(screen.getByText('Alias 10')).toBeInTheDocument();
      expect(screen.queryByText('Alias 11')).not.toBeInTheDocument();
    });

    it('should show pagination controls when multiple pages exist', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      navigateToFullList();
      expect(screen.getByText('prev')).toBeInTheDocument();
      expect(screen.getByText('next')).toBeInTheDocument();
      expect(screen.getByText(/page 1 \/ 2/i)).toBeInTheDocument();
    });

    it('should navigate to next page when next button clicked', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      navigateToFullList();
      fireEvent.click(screen.getByText('next'));
      expect(screen.getByText('Alias 11')).toBeInTheDocument();
      expect(screen.getByText('Alias 15')).toBeInTheDocument();
      expect(screen.queryByText('Alias 1')).not.toBeInTheDocument();
      expect(screen.getByText(/page 2 \/ 2/i)).toBeInTheDocument();
    });

    it('should disable prev button on first page', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      navigateToFullList();
      expect(screen.getByText('prev')).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      renderDashboardView({ allTransactions: createManyTransactions(15) });
      navigateToFullList();
      fireEvent.click(screen.getByText('next'));
      expect(screen.getByText('next')).toBeDisabled();
    });
  });
});
