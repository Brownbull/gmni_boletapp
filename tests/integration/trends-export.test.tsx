/**
 * Trends Export Integration Tests
 *
 * Tests for Story 5.4: Premium Transaction Export (Analytics - Month/Week/Day Views)
 * Tests for Story 5.5: Statistics Export & Upgrade Prompt
 *
 * Updated for Story 7.7 - Uses AnalyticsContext-based TrendsView
 *
 * SKIPPED: Story 14.13 redesigned TrendsView to "Explora" view which removes
 * the export button in favor of filter icons. Export functionality will be
 * re-implemented in a different location (e.g., filter dropdown or FAB on other views).
 *
 * Coverage: TrendsView export button, subscription check, csvExport integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { TrendsView } from '../../src/views/TrendsView';
import { AnalyticsProvider } from '../../src/contexts/AnalyticsContext';
import * as csvExport from '../../src/utils/csvExport';
import * as subscriptionHook from '../../src/hooks/useSubscriptionTier';
import type { Transaction } from '../../src/types/transaction';
import type { AnalyticsNavigationState } from '../../src/types/analytics';

// Mock translations
const mockTranslations: Record<string, string> = {
  back: 'Back',
  noData: 'No Data',
  downloadTransactions: 'Download transactions as CSV',
  downloadStatistics: 'Download statistics as CSV',
  downloadAnalytics: 'Download Analytics', // Story 7.11: FAB uses this label
  upgradeRequired: 'Upgrade Required',
  upgradeMessage: 'Transaction and statistics exports are available for Pro and Max subscribers.',
  upgradeCta: 'Upgrade Now',
  maybeLater: 'Maybe Later',
  close: 'Close',
};

const mockT = (key: string) => mockTranslations[key] || key;

// Sample transaction data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-12-01',
    merchant: 'Test Store',
    alias: 'Store Alias',
    category: 'Supermarket',
    total: 100.0,
    items: [
      { name: 'Milk', price: 5.0, qty: 2, category: 'Dairy', subcategory: 'Fresh' },
      { name: 'Bread', price: 3.5, qty: 1, category: 'Bakery', subcategory: 'Loaves' },
    ],
  },
  {
    id: '2',
    date: '2025-12-02',
    merchant: 'Coffee Shop',
    alias: '',
    category: 'Restaurant',
    total: 25.5,
    items: [
      { name: 'Latte', price: 5.5, qty: 1, category: 'Drinks', subcategory: 'Coffee' },
    ],
  },
];

// Default props for TrendsView (new interface)
// Story 7.14: Removed onBackToDashboard - navigation via breadcrumbs/bottom nav
const defaultProps = {
  transactions: mockTransactions,
  theme: 'light' as const,
  currency: 'USD',
  locale: 'en',
  t: mockT,
  onEditTransaction: vi.fn(),
  exporting: false,
  onExporting: vi.fn(),
  onUpgradeRequired: vi.fn(),
};

// Helper to render with AnalyticsProvider
function renderWithProvider(
  props = {},
  initialState?: AnalyticsNavigationState
) {
  const state = initialState || {
    temporal: { level: 'month' as const, year: '2025', quarter: 'Q4' as const, month: '2025-12' },
    category: { level: 'all' as const },
    chartMode: 'aggregation' as const,
  };

  return render(
    <AnalyticsProvider initialState={state}>
      <TrendsView {...defaultProps} {...props} />
    </AnalyticsProvider>
  );
}

// SKIPPED: Story 14.13 redesigned TrendsView - export button removed
describe.skip('Trends Export - Story 5.4', () => {
  let downloadMonthlyTransactionsSpy: ReturnType<typeof vi.spyOn>;
  let downloadYearlyStatisticsSpy: ReturnType<typeof vi.spyOn>;
  let useSubscriptionTierSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on csvExport functions
    downloadMonthlyTransactionsSpy = vi
      .spyOn(csvExport, 'downloadMonthlyTransactions')
      .mockImplementation(() => {});
    downloadYearlyStatisticsSpy = vi
      .spyOn(csvExport, 'downloadYearlyStatistics')
      .mockImplementation(() => {});

    // Default: mock useSubscriptionTier to allow premium access
    useSubscriptionTierSpy = vi
      .spyOn(subscriptionHook, 'useSubscriptionTier')
      .mockReturnValue({
        tier: 'max',
        canAccessPremiumExport: true,
      });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('AC#1: Subscription Check Before Download', () => {
    it('should allow download when user has premium access', async () => {
      const onExporting = vi.fn();
      renderWithProvider({ onExporting });

      // Click download button
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      // Export should be triggered
      await waitFor(() => {
        expect(downloadMonthlyTransactionsSpy).toHaveBeenCalled();
      });
    });

    it('should block download and show upgrade prompt when user is not premium', async () => {
      useSubscriptionTierSpy.mockReturnValue({
        tier: 'free',
        canAccessPremiumExport: false,
      });

      const onUpgradeRequired = vi.fn();
      renderWithProvider({ onUpgradeRequired });

      // Click download button
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      // Upgrade prompt should be shown
      await waitFor(() => {
        expect(onUpgradeRequired).toHaveBeenCalledTimes(1);
      });
      expect(downloadMonthlyTransactionsSpy).not.toHaveBeenCalled();
    });
  });

  describe('AC#2: Export Loading State', () => {
    it('should show loading state during export', () => {
      renderWithProvider({ exporting: true });

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeDisabled();
      expect(downloadButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should enable button when not exporting', () => {
      renderWithProvider({ exporting: false });

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).not.toBeDisabled();
    });
  });

  describe('AC#7: Download Icon Accessibility', () => {
    it('should have aria-label on export button', () => {
      renderWithProvider();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe('AC#8: Integration with Existing CSV Utilities', () => {
    it('should use existing downloadMonthlyTransactions function at month level', async () => {
      renderWithProvider();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(downloadMonthlyTransactionsSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Theme Support', () => {
    it('should render correctly in light theme', () => {
      renderWithProvider({ theme: 'light' });
      // Story 7.14: Check for download button instead of removed back button
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    it('should render correctly in dark theme', () => {
      renderWithProvider({ theme: 'dark' });
      // Story 7.14: Check for download button instead of removed back button
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });
});

// SKIPPED: Story 14.13 redesigned TrendsView - export button removed
describe.skip('Statistics Export & Upgrade Prompt - Story 5.5', () => {
  let downloadYearlyStatisticsSpy: ReturnType<typeof vi.spyOn>;
  let downloadMonthlyTransactionsSpy: ReturnType<typeof vi.spyOn>;
  let useSubscriptionTierSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    downloadYearlyStatisticsSpy = vi
      .spyOn(csvExport, 'downloadYearlyStatistics')
      .mockImplementation(() => {});
    downloadMonthlyTransactionsSpy = vi
      .spyOn(csvExport, 'downloadMonthlyTransactions')
      .mockImplementation(() => {});

    useSubscriptionTierSpy = vi
      .spyOn(subscriptionHook, 'useSubscriptionTier')
      .mockReturnValue({
        tier: 'max',
        canAccessPremiumExport: true,
      });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('AC#1 & AC#2: Statistics Export from Year View', () => {
    it('should call downloadYearlyStatistics when in year view', async () => {
      const yearState: AnalyticsNavigationState = {
        temporal: { level: 'year', year: '2025' },
        category: { level: 'all' },
        chartMode: 'aggregation',
      };

      renderWithProvider({}, yearState);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(downloadYearlyStatisticsSpy).toHaveBeenCalled();
      });
    });

    it('should call downloadMonthlyTransactions when month is selected', async () => {
      const monthState: AnalyticsNavigationState = {
        temporal: { level: 'month', year: '2025', quarter: 'Q4', month: '2025-12' },
        category: { level: 'all' },
        chartMode: 'aggregation',
      };

      renderWithProvider({}, monthState);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(downloadMonthlyTransactionsSpy).toHaveBeenCalled();
      });
    });
  });

  describe('AC#3: Dynamic Icon Based on Export Type', () => {
    it('should show FAB with download icon in year view', () => {
      const yearState: AnalyticsNavigationState = {
        temporal: { level: 'year', year: '2025' },
        category: { level: 'all' },
        chartMode: 'aggregation',
      };

      renderWithProvider({}, yearState);

      // Story 7.11: FAB uses "Download Analytics" label for all views
      // The icon changes based on isStatisticsExport (BarChart2 vs FileText)
      const downloadButton = screen.getByRole('button', { name: /download analytics/i });
      expect(downloadButton).toBeInTheDocument();
    });

    it('should show FAB with download icon in month view', () => {
      const monthState: AnalyticsNavigationState = {
        temporal: { level: 'month', year: '2025', quarter: 'Q4', month: '2025-12' },
        category: { level: 'all' },
        chartMode: 'aggregation',
      };

      renderWithProvider({}, monthState);

      // Story 7.11: FAB uses "Download Analytics" label for all views
      const downloadButton = screen.getByRole('button', { name: /download analytics/i });
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe('AC#4 & AC#5: Upgrade Prompt Modal', () => {
    it('should show upgrade prompt when non-premium user clicks download', async () => {
      useSubscriptionTierSpy.mockReturnValue({
        tier: 'free',
        canAccessPremiumExport: false,
      });

      const onUpgradeRequired = vi.fn();
      renderWithProvider({ onUpgradeRequired });

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(onUpgradeRequired).toHaveBeenCalled();
      });
    });

    it('should not trigger export when non-premium user clicks download', async () => {
      useSubscriptionTierSpy.mockReturnValue({
        tier: 'free',
        canAccessPremiumExport: false,
      });

      renderWithProvider();

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(downloadMonthlyTransactionsSpy).not.toHaveBeenCalled();
        expect(downloadYearlyStatisticsSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Premium User Flow', () => {
    it('should allow statistics export for premium users', async () => {
      const yearState: AnalyticsNavigationState = {
        temporal: { level: 'year', year: '2025' },
        category: { level: 'all' },
        chartMode: 'aggregation',
      };

      renderWithProvider({}, yearState);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(downloadYearlyStatisticsSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Backwards Compatibility', () => {
    it('should still call onUpgradeRequired callback when blocked', async () => {
      useSubscriptionTierSpy.mockReturnValue({
        tier: 'free',
        canAccessPremiumExport: false,
      });

      const onUpgradeRequired = vi.fn();
      renderWithProvider({ onUpgradeRequired });

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(onUpgradeRequired).toHaveBeenCalledTimes(1);
      });
    });
  });
});
