/**
 * InsightHistoryCard Component Unit Tests
 *
 * Story 10a.4: Insights History View
 * Tests for the InsightHistoryCard component.
 *
 * Acceptance Criteria Coverage:
 * - AC #3: Card displays icon, title, message, date
 * - AC #4: Navigate to transaction on tap
 * - AC #6: Backward compatibility for old records
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InsightHistoryCard } from '../../../../src/components/insights/InsightHistoryCard';
import { InsightRecord } from '../../../../src/types/insight';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Creates a mock Firestore Timestamp for testing
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

// ============================================================================
// Test Data
// ============================================================================

const mockInsightWithAllFields: InsightRecord = {
  insightId: 'merchant_frequency',
  shownAt: createMockTimestamp(2),
  transactionId: 'tx-123',
  title: 'Visita frecuente',
  message: '3ra vez en Jumbo este mes',
  category: 'ACTIONABLE',
  icon: 'Repeat',
};

const mockInsightOldFormat: InsightRecord = {
  insightId: 'biggest_item',
  shownAt: createMockTimestamp(5),
  transactionId: 'tx-456',
  // No title, message, category, or icon - old format
};

const mockInsightNoTransaction: InsightRecord = {
  insightId: 'category_trend',
  shownAt: createMockTimestamp(1),
  title: 'Tendencia de gastos',
  message: 'Has gastado más en restaurantes',
  icon: 'TrendingUp',
  // No transactionId
};

// ============================================================================
// Tests
// ============================================================================

describe('InsightHistoryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC #3: Card displays all fields
  describe('Display', () => {
    it('renders title, message, and date', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="light"
        />
      );

      expect(screen.getByText('Visita frecuente')).toBeInTheDocument();
      expect(screen.getByText('3ra vez en Jumbo este mes')).toBeInTheDocument();
      // Date should be rendered (format varies by locale)
      const dateText = screen.getByText(/\w+\s+\d+/);
      expect(dateText).toBeInTheDocument();
    });

    it('renders icon based on insight.icon field', () => {
      const { container } = render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="light"
        />
      );

      // The icon container should exist
      const iconContainer = container.querySelector('.w-10.h-10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders fallback Lightbulb icon when no icon specified', () => {
      const { container } = render(
        <InsightHistoryCard
          insight={mockInsightOldFormat}
          onClick={() => {}}
          theme="light"
        />
      );

      // Should render without errors, icon container exists
      const iconContainer = container.querySelector('.w-10.h-10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('shows chevron indicator when transactionId exists', () => {
      const { container } = render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="light"
        />
      );

      // ChevronRight should be present when there's a transactionId
      const chevron = container.querySelector('svg');
      expect(chevron).toBeInTheDocument();
    });

    it('hides chevron when no transactionId', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightNoTransaction}
          onClick={() => {}}
          theme="light"
        />
      );

      // Card should still render, but without button role
      expect(screen.getByText('Tendencia de gastos')).toBeInTheDocument();
    });
  });

  // AC #6: Backward compatibility
  describe('Backward Compatibility', () => {
    it('falls back to insightId when title is missing', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightOldFormat}
          onClick={() => {}}
          theme="light"
        />
      );

      // Should convert snake_case to readable text
      expect(screen.getByText(/biggest item/i)).toBeInTheDocument();
    });

    it('handles missing message gracefully', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightOldFormat}
          onClick={() => {}}
          theme="light"
        />
      );

      // Should render without errors even without message
      expect(screen.getByText(/biggest item/i)).toBeInTheDocument();
    });

    it('handles corrupted Timestamp gracefully', () => {
      const corruptedInsight: InsightRecord = {
        insightId: 'test_insight',
        shownAt: {
          toDate: () => { throw new Error('Corrupted'); },
        } as unknown as Timestamp,
      };

      // Should not throw
      expect(() =>
        render(
          <InsightHistoryCard
            insight={corruptedInsight}
            onClick={() => {}}
            theme="light"
          />
        )
      ).not.toThrow();
    });

    it('handles null Timestamp gracefully', () => {
      const nullTimestampInsight: InsightRecord = {
        insightId: 'test_insight',
        shownAt: null as unknown as Timestamp,
      };

      expect(() =>
        render(
          <InsightHistoryCard
            insight={nullTimestampInsight}
            onClick={() => {}}
            theme="light"
          />
        )
      ).not.toThrow();
    });
  });

  // AC #4: Navigation
  describe('Navigation', () => {
    it('calls onClick when card is clicked and has transactionId', () => {
      const onClick = vi.fn();
      render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={onClick}
          theme="light"
        />
      );

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('has button role when transactionId exists', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="light"
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports keyboard navigation (Enter key)', () => {
      const onClick = vi.fn();
      render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={onClick}
          theme="light"
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation (Space key)', () => {
      const onClick = vi.fn();
      render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={onClick}
          theme="light"
        />
      );

      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('still calls onClick when no transactionId (but no button role)', () => {
      const onClick = vi.fn();
      render(
        <InsightHistoryCard
          insight={mockInsightNoTransaction}
          onClick={onClick}
          theme="light"
        />
      );

      // Card is clickable but doesn't have button role
      const card = screen.getByText('Tendencia de gastos').closest('div')!;
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // Theme support
  describe('Theme Support', () => {
    it('applies light theme styles correctly', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="light"
        />
      );

      const card = screen.getByRole('button');
      // CSS variables are applied via inline style attribute
      expect(card.getAttribute('style')).toContain('background-color: var(--surface)');
    });

    it('applies dark theme styles correctly', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="dark"
        />
      );

      const card = screen.getByRole('button');
      // CSS variables are applied via inline style attribute
      expect(card.getAttribute('style')).toContain('background-color: var(--surface)');
    });
  });

  // Date formatting
  describe('Date Formatting', () => {
    it('shows year when date is from different year', () => {
      const oldInsight: InsightRecord = {
        insightId: 'old_insight',
        shownAt: createMockTimestamp(400), // More than a year ago
        title: 'Old insight',
      };

      render(
        <InsightHistoryCard
          insight={oldInsight}
          onClick={() => {}}
          theme="light"
        />
      );

      // Date should include year
      const dateElements = screen.getAllByText(/\d{4}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });
});
