/**
 * DashboardView Carousel Tests
 *
 * TD-15b-32: Split from DashboardView.test.tsx (827 lines → 3 files).
 * Covers: AC#1 (Carousel Views), AC#1a-c (Treemap/Radar/Bump), AC#2 (Month Navigation)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '../../setup/test-utils';
import { useHistoryFiltersStore, getDefaultFilterState } from '@/shared/stores/useHistoryFiltersStore';
import {
  createDefaultMockHookData,
  createCategoryTransactions,
  createRenderDashboardView,
  formatShortMonth,
} from './dashboardViewFixtures';

// =============================================================================
// Mocks
// =============================================================================

const mockHookData = createDefaultMockHookData();

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
  useHistoryNavigation: vi.fn(() => ({ handleNavigateToHistory: vi.fn() })),
}));

vi.mock('../../../src/shared/stores', () => ({
  useNavigationActions: vi.fn(() => ({
    setView: vi.fn(), navigateBack: vi.fn(), setHistoryFilters: vi.fn(),
  })),
}));

// =============================================================================
// Helpers
// =============================================================================

const renderDashboardView = createRenderDashboardView(mockHookData);

// =============================================================================
// Tests
// =============================================================================

describe('DashboardView — Carousel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // TD-15b-32: Reset Zustand store to prevent cross-file state leak in pool: 'threads'
    useHistoryFiltersStore.setState({ ...getDefaultFilterState(), initialized: true });
    Object.assign(mockHookData, createDefaultMockHookData());
  });

  describe('AC#1: Carousel with 3 Views', () => {
    it('should render carousel card', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      expect(screen.getByTestId('carousel-card')).toBeInTheDocument();
    });

    it('should show carousel title with current slide name', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      const now = new Date();
      expect(screen.getByTestId('carousel-title')).toHaveTextContent(
        formatShortMonth(now.getMonth(), now.getFullYear())
      );
    });

    it('should navigate to slide when indicator is clicked (slide 1)', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      fireEvent.click(screen.getByTestId('carousel-indicator-1'));
      const now = new Date();
      expect(screen.getByTestId('carousel-title')).toHaveTextContent(
        formatShortMonth(now.getMonth(), now.getFullYear())
      );
    });

    it('should navigate back to slide 0 when indicator is clicked', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      fireEvent.click(screen.getByTestId('carousel-indicator-1'));
      fireEvent.click(screen.getByTestId('carousel-indicator-0'));
      const now = new Date();
      expect(screen.getByTestId('carousel-title')).toHaveTextContent(
        formatShortMonth(now.getMonth(), now.getFullYear())
      );
    });

    it('should show carousel indicator bar with 3 segments', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      expect(screen.getByTestId('carousel-indicator-0')).toBeInTheDocument();
      expect(screen.getByTestId('carousel-indicator-1')).toBeInTheDocument();
      expect(screen.getByTestId('carousel-indicator-2')).toBeInTheDocument();
    });

    it('should navigate to slide when indicator is clicked', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      fireEvent.click(screen.getByTestId('carousel-indicator-2'));
      const now = new Date();
      expect(screen.getByTestId('carousel-title')).toHaveTextContent(
        formatShortMonth(now.getMonth(), now.getFullYear())
      );
    });

    it('should render swipeable month title container', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      const title = screen.getByTestId('carousel-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('cursor-pointer');
      const now = new Date();
      expect(title).toHaveTextContent(formatShortMonth(now.getMonth(), now.getFullYear()));
    });

    it('should always show carousel content', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      expect(screen.getByTestId('carousel-content')).toBeInTheDocument();
    });
  });

  describe('AC#1a: Treemap View (Slide 0)', () => {
    it('should display top categories in treemap grid', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      expect(screen.getByText('Supermercado')).toBeInTheDocument();
      expect(screen.getByText('Restaurante')).toBeInTheDocument();
    });

    it.skip('should navigate to filtered transactions when treemap cell is clicked', () => {
      const onNavigateToHistory = vi.fn();
      renderDashboardView({ allTransactions: createCategoryTransactions(), onNavigateToHistory });
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
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      expect(screen.getByText('Total del mes')).toBeInTheDocument();
    });
  });

  describe('AC#1b: Radar Chart View (Slide 1)', () => {
    it('should show radar view when navigating to slide 1', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      fireEvent.click(screen.getByTestId('carousel-indicator-1'));
      expect(screen.getByTestId('radar-view')).toBeInTheDocument();
    });

    it('should show fallback message when fewer than 3 categories', () => {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      renderDashboardView({
        allTransactions: [{ id: 'tx-1', merchant: 'Store', alias: 'S', date: `${currentMonth}-15`, total: 100, category: 'Supermercado' }],
      });
      fireEvent.click(screen.getByTestId('carousel-indicator-1'));
      expect(screen.getByText('needMoreCategories')).toBeInTheDocument();
    });
  });

  describe('AC#1c: Bump Chart View (Slide 2)', () => {
    it('should show bump chart view when navigating to slide 2', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      fireEvent.click(screen.getByTestId('carousel-indicator-2'));
      expect(screen.getByTestId('bump-chart-view')).toBeInTheDocument();
    });
  });

  describe('AC#2: Month Navigation', () => {
    it('should display month name in title', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      const now = new Date();
      expect(screen.getByTestId('carousel-title')).toHaveTextContent(
        formatShortMonth(now.getMonth(), now.getFullYear())
      );
    });

    it('should navigate to previous month on swipe right', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      const now = new Date();
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const title = screen.getByTestId('carousel-title');
      fireEvent.touchStart(title, { targetTouches: [{ clientX: 100 }] });
      fireEvent.touchMove(title, { targetTouches: [{ clientX: 200 }] });
      fireEvent.touchEnd(title);
      expect(screen.getByTestId('carousel-title')).toHaveTextContent(formatShortMonth(prevMonth, prevYear));
    });

    it('should not navigate past current month on swipe left', () => {
      renderDashboardView({ allTransactions: createCategoryTransactions() });
      const now = new Date();
      const currentTitle = formatShortMonth(now.getMonth(), now.getFullYear());
      const title = screen.getByTestId('carousel-title');
      fireEvent.touchStart(title, { targetTouches: [{ clientX: 200 }] });
      fireEvent.touchMove(title, { targetTouches: [{ clientX: 100 }] });
      fireEvent.touchEnd(title);
      expect(screen.getByTestId('carousel-title')).toHaveTextContent(currentTitle);
    });
  });
});
