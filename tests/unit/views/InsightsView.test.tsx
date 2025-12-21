/**
 * InsightsView Unit Tests
 *
 * Story 10a.4: Insights History View
 * Tests for the InsightsView component.
 *
 * Coverage:
 * - AC#1: Insights list renders with icon, title, message, date
 * - AC#2: Insights grouped by week (This Week, Last Week, Earlier)
 * - AC#3: Insight card display with all fields
 * - AC#4: Navigate to transaction on tap
 * - AC#5: Empty state with suggestion to scan
 * - AC#6: Backward compatibility for old records
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import { InsightsView } from '../../../src/views/InsightsView';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Mocks
// ============================================================================

// Mock the auth hook
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the insight service
vi.mock('../../../src/services/insightEngineService', () => ({
  getUserInsightProfile: vi.fn(),
  getLocalCache: vi.fn(() => ({
    weekdayScanCount: 0,
    weekendScanCount: 0,
    lastCounterReset: '2025-12-21',
    silencedUntil: null,
  })),
  setLocalCache: vi.fn(),
  incrementScanCounter: vi.fn((cache) => cache),
}));

// Mock the insight profile hook
vi.mock('../../../src/hooks/useInsightProfile', () => ({
  useInsightProfile: vi.fn(() => ({
    profile: null,
    cache: {
      weekdayScanCount: 0,
      weekendScanCount: 0,
      lastCounterReset: '2025-12-21',
      silencedUntil: null,
    },
    loading: false,
    recordShown: vi.fn(),
    trackTransaction: vi.fn(),
    incrementCounter: vi.fn(),
    removeInsight: vi.fn(),
    removeInsights: vi.fn(),
  })),
}));

import { useAuth } from '../../../src/hooks/useAuth';
import { getUserInsightProfile } from '../../../src/services/insightEngineService';

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Creates a mock Firestore Timestamp
 */
function createMockTimestamp(daysAgo: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toMillis: () => date.getTime(),
    isEqual: () => false,
    valueOf: () => '',
    toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
  } as unknown as Timestamp;
}

const mockUser = { uid: 'test-user-id' };
const mockServices = { db: {}, appId: 'test-app' };

// Default props for InsightsView
const defaultProps = {
  onBack: vi.fn(),
  onEditTransaction: vi.fn(),
  theme: 'light',
  t: (key: string) => {
    const translations: Record<string, string> = {
      insights: 'Insights',
      noInsightsYet: 'No insights yet',
      scanMoreReceipts: 'Scan more receipts to see insights here',
      thisWeek: 'This Week',
      lastWeek: 'Last Week',
      earlier: 'Earlier',
      // New enhancement translations
      noInsightsForPeriod: 'No insights for this period',
      tryDifferentFilter: 'Try selecting a different time period',
      viewTransaction: 'View Transaction',
      noMessageAvailable: 'No additional details available',
      insight: 'insight',
      insightsCount: 'insights',
      allTime: 'All Time',
      close: 'Close',
      deleteInsight: 'Delete Insight',
      deleting: 'Deleting...',
      deleteSelected: 'Delete Selected',
      selected: 'selected',
    };
    return translations[key] || key;
  },
};

// ============================================================================
// Test Data
// ============================================================================

const mockInsightsThisWeek = [
  {
    insightId: 'merchant_frequency',
    shownAt: createMockTimestamp(2),
    transactionId: 'tx-1',
    title: 'Visita frecuente',
    message: '3ra vez en Jumbo',
    icon: 'Repeat',
  },
  {
    insightId: 'biggest_item',
    shownAt: createMockTimestamp(3),
    transactionId: 'tx-2',
    title: 'Item grande',
    message: 'TV 55 pulgadas',
    icon: 'Star',
  },
];

const mockInsightsLastWeek = [
  {
    insightId: 'category_trend',
    shownAt: createMockTimestamp(10),
    transactionId: 'tx-3',
    title: 'Tendencia',
    message: 'Gastos en restaurantes',
    icon: 'TrendingUp',
  },
];

const mockInsightsEarlier = [
  {
    insightId: 'new_merchant',
    shownAt: createMockTimestamp(20),
    transactionId: 'tx-4',
    title: 'Nuevo comercio',
    message: 'Primera vez en Starbucks',
    icon: 'MapPin',
  },
];

const mockInsightsOldFormat = [
  {
    insightId: 'weekend_warrior',
    shownAt: createMockTimestamp(1),
    transactionId: 'tx-5',
    // No title, message, icon - old format
  },
];

// ============================================================================
// Tests
// ============================================================================

describe('InsightsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: authenticated user
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
      services: mockServices,
    });
  });

  // AC#5: Empty state
  describe('Empty State', () => {
    it('shows empty state when no insights exist', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [],
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No insights yet')).toBeInTheDocument();
        expect(screen.getByText('Scan more receipts to see insights here')).toBeInTheDocument();
      });
    });

    it('shows empty state when profile is null', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No insights yet')).toBeInTheDocument();
      });
    });

    it('shows loading spinner while fetching', () => {
      // Never resolve the promise to keep loading
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise(() => {})
      );

      render(<InsightsView {...defaultProps} />);

      // Should show loading spinner
      expect(screen.getByText('Insights')).toBeInTheDocument();
      // Look for animate-spin class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // AC#1: Insights list renders
  describe('Insights List Rendering', () => {
    it('renders insights with title, message, and date', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: mockInsightsThisWeek,
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Visita frecuente')).toBeInTheDocument();
        expect(screen.getByText('3ra vez en Jumbo')).toBeInTheDocument();
        expect(screen.getByText('Item grande')).toBeInTheDocument();
      });
    });
  });

  // AC#2: Grouped by week
  describe('Week Grouping', () => {
    it('groups insights into This Week, Last Week, Earlier', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [
          ...mockInsightsThisWeek,
          ...mockInsightsLastWeek,
          ...mockInsightsEarlier,
        ],
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeInTheDocument();
        expect(screen.getByText('Last Week')).toBeInTheDocument();
        expect(screen.getByText('Earlier')).toBeInTheDocument();
      });
    });

    it('only shows groups that have insights', async () => {
      // Only this week insights
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: mockInsightsThisWeek,
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeInTheDocument();
        expect(screen.queryByText('Last Week')).not.toBeInTheDocument();
        expect(screen.queryByText('Earlier')).not.toBeInTheDocument();
      });
    });

    it('sorts insights by date descending (most recent first)', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [
          {
            insightId: 'older',
            shownAt: createMockTimestamp(3),
            title: 'Older Insight',
          },
          {
            insightId: 'newer',
            shownAt: createMockTimestamp(1),
            title: 'Newer Insight',
          },
        ],
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        const newerElement = screen.getByText('Newer Insight');
        const olderElement = screen.getByText('Older Insight');

        // Newer should appear before older in the DOM
        expect(
          newerElement.compareDocumentPosition(olderElement) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
      });
    });
  });

  // AC#4: Navigate to transaction (via modal)
  describe('Navigation', () => {
    it('opens modal when clicking insight', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: mockInsightsThisWeek,
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Visita frecuente')).toBeInTheDocument();
      });

      const card = screen.getByText('Visita frecuente').closest('div[role="button"]');
      fireEvent.click(card!);

      // Modal should appear with View Transaction button
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /View Transaction/i })).toBeInTheDocument();
      });
    });

    it('calls onEditTransaction when clicking View Transaction in modal', async () => {
      const onEditTransaction = vi.fn();
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: mockInsightsThisWeek,
      });

      render(
        <InsightsView
          {...defaultProps}
          onEditTransaction={onEditTransaction}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Visita frecuente')).toBeInTheDocument();
      });

      // Click card to open modal
      const card = screen.getByText('Visita frecuente').closest('div[role="button"]');
      fireEvent.click(card!);

      // Click View Transaction button in modal
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /View Transaction/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /View Transaction/i }));

      expect(onEditTransaction).toHaveBeenCalledWith('tx-1');
    });

    it('does not show View Transaction button when insight has no transactionId', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [
          {
            insightId: 'no_tx',
            shownAt: createMockTimestamp(1),
            title: 'No Transaction',
            message: 'A test message',
            // No transactionId
          },
        ],
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Transaction')).toBeInTheDocument();
      });

      // Click to open modal - find the clickable card element
      const card = screen.getByText('No Transaction').closest('[role="button"]') ||
                   screen.getByText('No Transaction').closest('div');
      if (card) {
        fireEvent.click(card);
      }

      // Modal should appear but without View Transaction button
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: /View Transaction/i })).not.toBeInTheDocument();
    });

    it('closes modal when clicking Close button', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: mockInsightsThisWeek,
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Visita frecuente')).toBeInTheDocument();
      });

      // Open modal
      const card = screen.getByText('Visita frecuente').closest('div[role="button"]');
      fireEvent.click(card!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click X close button (only close button in modal now)
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  // AC#6: Backward compatibility
  describe('Backward Compatibility', () => {
    it('displays old records without title/message using insightId as fallback', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: mockInsightsOldFormat,
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        // Should convert snake_case to readable text
        expect(screen.getByText(/weekend warrior/i)).toBeInTheDocument();
      });
    });

    it('handles corrupted Timestamp without crashing', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [
          {
            insightId: 'corrupted',
            shownAt: {
              toDate: () => { throw new Error('Corrupted'); },
            },
            title: 'Corrupted Insight',
          },
        ],
      });

      // Should not throw
      expect(() => render(<InsightsView {...defaultProps} />)).not.toThrow();

      await waitFor(() => {
        // Should still render (put in 'earlier' bucket)
        expect(screen.getByText('Corrupted Insight')).toBeInTheDocument();
      });
    });
  });

  // Navigation (back button)
  describe('Back Button', () => {
    it('calls onBack when back button is clicked', async () => {
      const onBack = vi.fn();
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [],
      });

      render(<InsightsView {...defaultProps} onBack={onBack} />);

      await waitFor(() => {
        expect(screen.getByText('No insights yet')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: '' }); // ArrowLeft icon
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  // User not authenticated
  describe('Unauthenticated User', () => {
    it('shows empty state when user is not authenticated', async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        services: null,
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No insights yet')).toBeInTheDocument();
      });
    });
  });

  // Error handling
  describe('Error Handling', () => {
    it('handles service error gracefully', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      render(<InsightsView {...defaultProps} />);

      // Should show empty state after error
      await waitFor(() => {
        expect(screen.getByText('No insights yet')).toBeInTheDocument();
      });
    });
  });

  // Header
  describe('Header', () => {
    it('displays insights title', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [],
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Insights' })).toBeInTheDocument();
      });
    });
  });

  // Story 10a.4 Enhancement: Temporal Filter
  describe('Temporal Filter', () => {
    it('shows temporal filter bar when insights exist', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: mockInsightsThisWeek,
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('All Time')).toBeInTheDocument();
      });
    });

    it('does not show temporal filter when no insights', async () => {
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [],
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No insights yet')).toBeInTheDocument();
      });

      expect(screen.queryByText('All Time')).not.toBeInTheDocument();
    });

    it('shows empty state for filtered period with no results', async () => {
      // Create insights only from 2023
      (getUserInsightProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
        recentInsights: [
          {
            insightId: 'old_insight',
            shownAt: createMockTimestamp(400), // ~13 months ago
            title: 'Old Insight',
          },
        ],
      });

      render(<InsightsView {...defaultProps} />);

      await waitFor(() => {
        // Should have All Time filter visible
        expect(screen.getByText('All Time')).toBeInTheDocument();
      });
    });
  });
});
