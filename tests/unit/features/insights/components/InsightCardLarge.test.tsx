/**
 * InsightCardLarge Unit Tests
 *
 * Story 14.33b: View Switcher & Carousel Mode
 * @see docs/sprint-artifacts/epic14/stories/story-14.33b-view-switcher-carousel.md
 *
 * Tests AC4: Large format insight cards for carousel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { InsightCardLarge } from '@features/insights/components/InsightCardLarge';
import { InsightRecord, InsightCategory } from '../../../../../src/types/insight';

// Mock Firebase Timestamp
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    Timestamp: {
      fromDate: (date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      }),
    },
  };
});

// Simple translation mock
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    close: 'Cerrar',
    observation: 'Observación',
    celebrationLabel: 'Celebración',
    opportunity: 'Oportunidad',
    comparison: 'Comparación',
    trendLabel: 'Tendencia',
    insight: 'Idea',
  };
  return translations[key] || key;
};

// Helper to create mock insight
function createMockInsight(
  overrides: Partial<InsightRecord> = {}
): InsightRecord {
  return {
    insightId: 'test_insight',
    category: 'ACTIONABLE',
    title: 'Test Insight Title',
    message: 'Test insight message content.',
    shownAt: Timestamp.fromDate(new Date()),
    transactionId: 'txn-123',
    icon: 'Lightbulb',
    ...overrides,
  };
}

describe('InsightCardLarge', () => {
  const defaultProps = {
    insight: createMockInsight(),
    theme: 'light',
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders insight title', () => {
      render(<InsightCardLarge {...defaultProps} />);

      expect(screen.getByText('Test Insight Title')).toBeInTheDocument();
    });

    it('renders insight message', () => {
      render(<InsightCardLarge {...defaultProps} />);

      expect(screen.getByText('Test insight message content.')).toBeInTheDocument();
    });

    it('renders type label based on visual type', () => {
      render(
        <InsightCardLarge
          {...defaultProps}
          insight={createMockInsight({ category: 'ACTIONABLE' })}
        />
      );

      // ACTIONABLE maps to 'opportunity'
      expect(screen.getByText('Oportunidad')).toBeInTheDocument();
    });

    it('renders type label for CELEBRATORY insights', () => {
      render(
        <InsightCardLarge
          {...defaultProps}
          insight={createMockInsight({ category: 'CELEBRATORY' })}
        />
      );

      expect(screen.getByText('Celebración')).toBeInTheDocument();
    });

    it('renders type label for QUIRKY_FIRST insights', () => {
      render(
        <InsightCardLarge
          {...defaultProps}
          insight={createMockInsight({ category: 'QUIRKY_FIRST' })}
        />
      );

      expect(screen.getByText('Observación')).toBeInTheDocument();
    });

    it('falls back to insightId for title when title is missing', () => {
      render(
        <InsightCardLarge
          {...defaultProps}
          insight={createMockInsight({ title: undefined, insightId: 'merchant_frequency' })}
        />
      );

      // snake_case to Title Case
      expect(screen.getByText('Merchant Frequency')).toBeInTheDocument();
    });

    it('uses fallback message when message is missing', () => {
      render(
        <InsightCardLarge
          {...defaultProps}
          insight={createMockInsight({
            message: undefined,
            insightId: 'merchant_frequency',
          })}
        />
      );

      // Fallback message from insightTypeConfig
      expect(screen.getByText(/visited.*merchant/i)).toBeInTheDocument();
    });
  });

  describe('Close button', () => {
    it('renders close button when onClose is provided', () => {
      const onClose = vi.fn();
      render(<InsightCardLarge {...defaultProps} onClose={onClose} />);

      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<InsightCardLarge {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render close button when onClose is not provided', () => {
      render(<InsightCardLarge {...defaultProps} onClose={undefined} />);

      expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument();
    });
  });

  describe('Theming', () => {
    it('renders correctly in light theme', () => {
      const { container } = render(<InsightCardLarge {...defaultProps} theme="light" />);

      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });

    it('renders correctly in dark theme', () => {
      const { container } = render(<InsightCardLarge {...defaultProps} theme="dark" />);

      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Visual types', () => {
    it('renders trend insights with correct label', () => {
      render(
        <InsightCardLarge
          {...defaultProps}
          insight={createMockInsight({
            insightId: 'day_pattern',
            category: 'QUIRKY_FIRST',
          })}
        />
      );

      // day_pattern maps to 'trend' visual type
      expect(screen.getByText('Tendencia')).toBeInTheDocument();
    });

    it('renders tradeoff insights with correct label', () => {
      render(
        <InsightCardLarge
          {...defaultProps}
          insight={createMockInsight({
            insightId: 'category_variety',
            category: 'QUIRKY_FIRST',
          })}
        />
      );

      // category_variety maps to 'tradeoff' visual type
      expect(screen.getByText('Comparación')).toBeInTheDocument();
    });
  });
});
