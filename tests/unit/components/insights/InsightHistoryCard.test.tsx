/**
 * InsightHistoryCard Component Unit Tests
 *
 * Story 10a.4: Insights History View
 * Story 14.33a: Insight Card Types & Styling
 * Story 14.33a.1: Theme-Aware Insight Type Colors
 *
 * Tests for the InsightHistoryCard component.
 *
 * Acceptance Criteria Coverage:
 * - AC #3 (10a.4): Card displays icon, title, message, date
 * - AC #4 (10a.4): Navigate to transaction on tap
 * - AC #6 (10a.4): Backward compatibility for old records
 * - AC #1 (14.33a): Insight type mapping to visual types
 * - AC #2 (14.33a): Type-specific styling with chevron
 * - AC #5 (14.33a): Backward compatibility defaults to actionable
 * - AC1-6 (14.33a.1): Theme-aware colors via CSS variables
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

// Story 14.33a: Test data for each visual type
const mockQuirkyInsight: InsightRecord = {
  insightId: 'late_night_snacker',
  shownAt: createMockTimestamp(1),
  title: 'Snacker Nocturno',
  message: '3 compras después de las 22:00',
  category: 'QUIRKY_FIRST',
};

const mockCelebrationInsight: InsightRecord = {
  insightId: 'milestone_reached',
  shownAt: createMockTimestamp(1),
  title: 'Carrito Lleno',
  message: 'Compra #100 completada',
  category: 'CELEBRATORY',
};

const mockTrendInsight: InsightRecord = {
  insightId: 'day_pattern',
  shownAt: createMockTimestamp(1),
  title: 'Día Favorito',
  message: 'Viernes es tu día top',
  category: 'ACTIONABLE', // Category is ACTIONABLE but insightId overrides to trend
};

const mockTradeoffInsight: InsightRecord = {
  insightId: 'category_variety',
  shownAt: createMockTimestamp(1),
  title: 'Compra Variada',
  message: '5 categorías diferentes',
  category: 'ACTIONABLE', // Category is ACTIONABLE but insightId overrides to tradeoff
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
    it('renders title and message', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="light"
        />
      );

      expect(screen.getByText('Visita frecuente')).toBeInTheDocument();
      expect(screen.getByText('3ra vez en Jumbo este mes')).toBeInTheDocument();
      // Story 14.33a: Date is in aria-label for accessibility, not visually displayed
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Visita frecuente'));
    });

    it('renders icon based on insight.icon field', () => {
      const { container } = render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="light"
        />
      );

      // Story 14.33a AC4: Icon container is 36x36 (w-9 h-9 in Tailwind)
      const iconContainer = container.querySelector('.w-9.h-9');
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
      const iconContainer = container.querySelector('.w-9.h-9');
      expect(iconContainer).toBeInTheDocument();
    });

    // Story 14.33a AC2: Chevron indicator always present
    it('shows chevron indicator', () => {
      const { container } = render(
        <InsightHistoryCard
          insight={mockInsightWithAllFields}
          onClick={() => {}}
          theme="light"
        />
      );

      // ChevronRight should always be present (per mockup)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(1);
    });

    it('renders correctly when no transactionId', () => {
      render(
        <InsightHistoryCard
          insight={mockInsightNoTransaction}
          onClick={() => {}}
          theme="light"
        />
      );

      // Card should still render
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

  // Date formatting (moved to aria-label in Story 14.33a)
  describe('Date Formatting', () => {
    it('includes date with year in aria-label when from different year', () => {
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

      // Story 14.33a: Date is in aria-label, includes year for old dates
      const card = screen.getByRole('button');
      // The aria-label should contain a year (4 digits)
      expect(card.getAttribute('aria-label')).toMatch(/\d{4}/);
    });
  });

  // ============================================================================
  // Story 14.33a: Visual Type Styling Tests
  // ============================================================================

  describe('Story 14.33a: Visual Type Styling', () => {
    // AC1: Insight Type Mapping
    describe('AC1: Insight Type Mapping', () => {
      it('renders quirky visual type for QUIRKY_FIRST category', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockQuirkyInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('[data-visual-type="quirky"]');
        expect(iconContainer).toBeInTheDocument();
      });

      it('renders celebration visual type for CELEBRATORY category', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockCelebrationInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('[data-visual-type="celebration"]');
        expect(iconContainer).toBeInTheDocument();
      });

      it('renders actionable visual type for ACTIONABLE category', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockInsightWithAllFields}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('[data-visual-type="actionable"]');
        expect(iconContainer).toBeInTheDocument();
      });

      it('renders trend visual type when insightId contains trend pattern', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockTrendInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('[data-visual-type="trend"]');
        expect(iconContainer).toBeInTheDocument();
      });

      it('renders tradeoff visual type when insightId contains variety pattern', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockTradeoffInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('[data-visual-type="tradeoff"]');
        expect(iconContainer).toBeInTheDocument();
      });
    });

    // AC2: InsightHistoryCard Styling Update
    describe('AC2: Type-Specific Styling', () => {
      it('icon container has background color inline style', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockQuirkyInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('.w-9.h-9');
        expect(iconContainer).toBeInTheDocument();
        // CSS variables in style attribute
        expect(iconContainer?.getAttribute('style')).toContain('background-color');
      });

      it('renders chevron on right side', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockInsightWithAllFields}
            onClick={() => {}}
            theme="light"
          />
        );

        // Find the ChevronRight SVG (it has lucide-chevron-right class)
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThanOrEqual(2); // Icon + Chevron
      });
    });

    // Story 14.33a.1: Theme-Aware CSS Variables
    describe('Story 14.33a.1: Theme-Aware CSS Variables', () => {
      it('quirky type uses CSS variables (theme handles light/dark)', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockQuirkyInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('.w-9.h-9');
        // Story 14.33a.1: Now uses CSS variables instead of hardcoded colors
        expect(iconContainer?.getAttribute('style')).toContain('var(--insight-quirky-bg)');
      });

      it('celebration type uses CSS variables', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockCelebrationInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('.w-9.h-9');
        expect(iconContainer?.getAttribute('style')).toContain('var(--insight-celebration-bg)');
      });

      it('actionable type uses CSS variables', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockInsightWithAllFields}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('.w-9.h-9');
        expect(iconContainer?.getAttribute('style')).toContain('var(--insight-actionable-bg)');
      });

      it('trend type uses CSS variables', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockTrendInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('.w-9.h-9');
        expect(iconContainer?.getAttribute('style')).toContain('var(--insight-trend-bg)');
      });

      it('tradeoff type uses CSS variables', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockTradeoffInsight}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('.w-9.h-9');
        expect(iconContainer?.getAttribute('style')).toContain('var(--insight-tradeoff-bg)');
      });

      it('same CSS variable works in dark mode (CSS handles the value)', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockQuirkyInsight}
            onClick={() => {}}
            theme="dark"
          />
        );

        const iconContainer = container.querySelector('.w-9.h-9');
        // Same CSS variable is used - the actual color is defined in CSS
        expect(iconContainer?.getAttribute('style')).toContain('var(--insight-quirky-bg)');
      });
    });

    // AC4: List Item Layout
    describe('AC4: List Item Layout', () => {
      it('card has correct padding (12px = p-3)', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockInsightWithAllFields}
            onClick={() => {}}
            theme="light"
          />
        );

        const card = container.querySelector('.p-3');
        expect(card).toBeInTheDocument();
      });

      it('card has correct border radius (rounded-[10px])', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockInsightWithAllFields}
            onClick={() => {}}
            theme="light"
          />
        );

        const card = container.querySelector('.rounded-\\[10px\\]');
        expect(card).toBeInTheDocument();
      });

      it('title has correct font size and weight (text-sm font-medium)', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockInsightWithAllFields}
            onClick={() => {}}
            theme="light"
          />
        );

        const title = container.querySelector('.text-sm.font-medium');
        expect(title).toBeInTheDocument();
        expect(title).toHaveTextContent('Visita frecuente');
      });

      it('meta text has correct font size (text-xs)', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockInsightWithAllFields}
            onClick={() => {}}
            theme="light"
          />
        );

        const meta = container.querySelector('.text-xs.mt-0\\.5');
        expect(meta).toBeInTheDocument();
        expect(meta).toHaveTextContent('3ra vez en Jumbo este mes');
      });
    });

    // AC5: Backward Compatibility
    describe('AC5: Backward Compatibility', () => {
      it('defaults to actionable styling when no category', () => {
        const { container } = render(
          <InsightHistoryCard
            insight={mockInsightOldFormat}
            onClick={() => {}}
            theme="light"
          />
        );

        const iconContainer = container.querySelector('[data-visual-type="actionable"]');
        expect(iconContainer).toBeInTheDocument();
      });

      it('old InsightRecord entries without category render correctly', () => {
        const oldRecord: InsightRecord = {
          insightId: 'some_old_insight',
          shownAt: createMockTimestamp(10),
          // No category, no title, no message
        };

        expect(() =>
          render(
            <InsightHistoryCard
              insight={oldRecord}
              onClick={() => {}}
              theme="light"
            />
          )
        ).not.toThrow();
      });
    });
  });
});
