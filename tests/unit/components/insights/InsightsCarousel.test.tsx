/**
 * InsightsCarousel Unit Tests
 *
 * Story 14.33b: View Switcher & Carousel Mode
 * @see docs/sprint-artifacts/epic14/stories/story-14.33b-view-switcher-carousel.md
 *
 * Tests AC3: Carousel view for highlighted insights
 * Tests AC5: Carousel navigation with swipe and dots
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import {
  InsightsCarousel,
  selectHighlightedInsights,
} from '../../../../src/components/insights/InsightsCarousel';
import { InsightRecord, InsightCategory } from '../../../../src/types/insight';

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
    swipeForMore: 'Desliza para ver más',
    slide: 'Diapositiva',
    of: 'de',
    carouselSlides: 'Diapositivas',
    noHighlightedInsights: 'Sin ideas destacadas',
    scanMoreForHighlights: 'Escanea más boletas',
    observation: 'Observación',
    celebrationLabel: 'Celebración',
    opportunity: 'Oportunidad',
    comparison: 'Comparación',
    trendLabel: 'Tendencia',
  };
  return translations[key] || key;
};

// Helper to create mock insights
function createMockInsight(
  id: string,
  category: InsightCategory,
  daysAgo: number = 0
): InsightRecord {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return {
    insightId: id,
    category,
    title: `${id} title`,
    message: `${id} message`,
    shownAt: Timestamp.fromDate(date),
    transactionId: `txn-${id}`,
    icon: 'Lightbulb',
  };
}

describe('InsightsCarousel', () => {
  const defaultProps = {
    insights: [],
    theme: 'light',
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('selectHighlightedInsights', () => {
    it('returns empty array for empty input', () => {
      expect(selectHighlightedInsights([])).toEqual([]);
    });

    it('prioritizes CELEBRATORY insights', () => {
      const insights = [
        createMockInsight('action1', 'ACTIONABLE', 0),
        createMockInsight('celeb1', 'CELEBRATORY', 1),
        createMockInsight('quirky1', 'QUIRKY_FIRST', 2),
      ];

      const selected = selectHighlightedInsights(insights);
      expect(selected[0].insightId).toBe('celeb1');
    });

    it('prioritizes QUIRKY_FIRST after CELEBRATORY', () => {
      const insights = [
        createMockInsight('action1', 'ACTIONABLE', 0),
        createMockInsight('quirky1', 'QUIRKY_FIRST', 1),
      ];

      const selected = selectHighlightedInsights(insights);
      expect(selected[0].insightId).toBe('quirky1');
    });

    it('returns at most 3 insights', () => {
      const insights = [
        createMockInsight('celeb1', 'CELEBRATORY', 0),
        createMockInsight('celeb2', 'CELEBRATORY', 1),
        createMockInsight('celeb3', 'CELEBRATORY', 2),
        createMockInsight('celeb4', 'CELEBRATORY', 3),
        createMockInsight('celeb5', 'CELEBRATORY', 4),
      ];

      const selected = selectHighlightedInsights(insights);
      expect(selected.length).toBe(3);
    });

    it('sorts within same category by most recent first', () => {
      const insights = [
        createMockInsight('celeb-old', 'CELEBRATORY', 5),
        createMockInsight('celeb-new', 'CELEBRATORY', 0),
        createMockInsight('celeb-mid', 'CELEBRATORY', 2),
      ];

      const selected = selectHighlightedInsights(insights);
      expect(selected[0].insightId).toBe('celeb-new');
      expect(selected[1].insightId).toBe('celeb-mid');
      expect(selected[2].insightId).toBe('celeb-old');
    });
  });

  describe('Rendering', () => {
    it('renders empty state when no insights', () => {
      render(<InsightsCarousel {...defaultProps} insights={[]} />);

      expect(screen.getByText('Sin ideas destacadas')).toBeInTheDocument();
      expect(screen.getByText('Escanea más boletas')).toBeInTheDocument();
    });

    it('renders carousel with insights', () => {
      const insights = [
        createMockInsight('test1', 'CELEBRATORY', 0),
        createMockInsight('test2', 'QUIRKY_FIRST', 1),
      ];

      render(<InsightsCarousel {...defaultProps} insights={insights} />);

      expect(screen.getByText('test1 title')).toBeInTheDocument();
    });

    it('renders dot indicators for multiple insights', () => {
      const insights = [
        createMockInsight('test1', 'CELEBRATORY', 0),
        createMockInsight('test2', 'QUIRKY_FIRST', 1),
        createMockInsight('test3', 'ACTIONABLE', 2),
      ];

      render(<InsightsCarousel {...defaultProps} insights={insights} />);

      const dots = screen.getAllByRole('tab');
      expect(dots.length).toBe(3);
    });

    it('does not render dots for single insight', () => {
      const insights = [createMockInsight('test1', 'CELEBRATORY', 0)];

      render(<InsightsCarousel {...defaultProps} insights={insights} />);

      const dots = screen.queryAllByRole('tab');
      expect(dots.length).toBe(0);
    });

    it('renders swipe hint for multiple insights', () => {
      const insights = [
        createMockInsight('test1', 'CELEBRATORY', 0),
        createMockInsight('test2', 'QUIRKY_FIRST', 1),
      ];

      render(<InsightsCarousel {...defaultProps} insights={insights} />);

      expect(screen.getByText('Desliza para ver más')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to slide when clicking dot indicator', () => {
      const insights = [
        createMockInsight('test1', 'CELEBRATORY', 0),
        createMockInsight('test2', 'QUIRKY_FIRST', 1),
        createMockInsight('test3', 'ACTIONABLE', 2),
      ];

      render(<InsightsCarousel {...defaultProps} insights={insights} />);

      const dots = screen.getAllByRole('tab');

      // First dot should be active initially
      expect(dots[0]).toHaveAttribute('aria-selected', 'true');
      expect(dots[1]).toHaveAttribute('aria-selected', 'false');

      // Click second dot
      fireEvent.click(dots[1]);

      // Second dot should now be active
      expect(dots[0]).toHaveAttribute('aria-selected', 'false');
      expect(dots[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('active dot has wider width (24px)', () => {
      const insights = [
        createMockInsight('test1', 'CELEBRATORY', 0),
        createMockInsight('test2', 'QUIRKY_FIRST', 1),
      ];

      render(<InsightsCarousel {...defaultProps} insights={insights} />);

      // The visual dot indicator is inside the button (for 44px touch target)
      const dots = screen.getAllByRole('tab');
      const activeDot = dots[0].querySelector('span');
      const inactiveDot = dots[1].querySelector('span');
      expect(activeDot).toHaveStyle({ width: '24px' });
      expect(inactiveDot).toHaveStyle({ width: '8px' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on dot indicators', () => {
      const insights = [
        createMockInsight('test1', 'CELEBRATORY', 0),
        createMockInsight('test2', 'QUIRKY_FIRST', 1),
      ];

      render(<InsightsCarousel {...defaultProps} insights={insights} />);

      const dots = screen.getAllByRole('tab');
      expect(dots[0]).toHaveAttribute('aria-label', 'Diapositiva 1 de 2');
      expect(dots[1]).toHaveAttribute('aria-label', 'Diapositiva 2 de 2');
    });
  });
});
