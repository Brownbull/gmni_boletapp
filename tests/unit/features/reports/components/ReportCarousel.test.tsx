/**
 * Tests for ReportCarousel component
 *
 * Story 14.16: Weekly Report Story Format
 * Epic 14: Core Implementation
 *
 * AC #2: Swipeable carousel with horizontal navigation between cards
 * AC #7: Progress dots showing current position
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportCarousel } from '@features/reports/components/ReportCarousel';
import type { ReportCard as ReportCardType } from '../../../../src/types/report';

// Mock useReducedMotion hook
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Mock useSwipeNavigation hook
vi.mock('../../../../src/hooks/useSwipeNavigation', () => ({
  useSwipeNavigation: ({ onSwipeLeft, onSwipeRight }: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
  }) => ({
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
    isSwiping: false,
    swipeDirection: null,
    swipeProgress: 0,
    // Expose callbacks for testing
    _testSwipeLeft: onSwipeLeft,
    _testSwipeRight: onSwipeRight,
  }),
}));

describe('ReportCarousel', () => {
  const mockCards: ReportCardType[] = [
    {
      id: 'summary',
      type: 'summary',
      title: 'Esta Semana',
      primaryValue: '$45.200',
      trend: 'up',
      trendPercent: 8,
    },
    {
      id: 'cat-1',
      type: 'category',
      title: 'Supermercado',
      primaryValue: '$22.500',
      categoryIcon: '🛒',
      trend: 'down',
      trendPercent: 5,
    },
    {
      id: 'cat-2',
      type: 'category',
      title: 'Restaurantes',
      primaryValue: '$12.800',
      categoryIcon: '🍔',
      trend: 'up',
      trendPercent: 12,
    },
  ];

  describe('Rendering', () => {
    it('should render the carousel container', () => {
      render(<ReportCarousel cards={mockCards} />);

      expect(screen.getByTestId('report-carousel')).toBeInTheDocument();
    });

    it('should render the first card by default', () => {
      render(<ReportCarousel cards={mockCards} />);

      expect(screen.getByText('Esta Semana')).toBeInTheDocument();
      expect(screen.getByText('$45.200')).toBeInTheDocument();
    });

    it('should render at specified initial index', () => {
      render(<ReportCarousel cards={mockCards} initialIndex={1} />);

      expect(screen.getByText('Supermercado')).toBeInTheDocument();
    });

    it('should render empty state when no cards provided', () => {
      render(<ReportCarousel cards={[]} />);

      expect(screen.getByText(/no hay datos/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next card on left arrow key', () => {
      render(<ReportCarousel cards={mockCards} />);

      const carousel = screen.getByTestId('report-carousel');
      fireEvent.keyDown(carousel, { key: 'ArrowRight' });

      expect(screen.getByText('Supermercado')).toBeInTheDocument();
    });

    it('should navigate to previous card on right arrow key', () => {
      render(<ReportCarousel cards={mockCards} initialIndex={1} />);

      const carousel = screen.getByTestId('report-carousel');
      fireEvent.keyDown(carousel, { key: 'ArrowLeft' });

      expect(screen.getByText('Esta Semana')).toBeInTheDocument();
    });

    it('should not navigate past first card', () => {
      render(<ReportCarousel cards={mockCards} />);

      const carousel = screen.getByTestId('report-carousel');
      fireEvent.keyDown(carousel, { key: 'ArrowLeft' });

      // Should still show first card
      expect(screen.getByText('Esta Semana')).toBeInTheDocument();
    });

    it('should not navigate past last card', () => {
      render(<ReportCarousel cards={mockCards} initialIndex={2} />);

      const carousel = screen.getByTestId('report-carousel');
      fireEvent.keyDown(carousel, { key: 'ArrowRight' });

      // Should still show last card
      expect(screen.getByText('Restaurantes')).toBeInTheDocument();
    });

    it('should call onCardChange when card changes', () => {
      const onCardChange = vi.fn();
      render(<ReportCarousel cards={mockCards} onCardChange={onCardChange} />);

      const carousel = screen.getByTestId('report-carousel');
      fireEvent.keyDown(carousel, { key: 'ArrowRight' });

      expect(onCardChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Progress dots (AC #7)', () => {
    it('should render progress dots for each card', () => {
      render(<ReportCarousel cards={mockCards} />);

      const dots = screen.getAllByTestId('progress-dot');
      expect(dots).toHaveLength(3);
    });

    it('should highlight active dot', () => {
      render(<ReportCarousel cards={mockCards} />);

      const dots = screen.getAllByTestId('progress-dot');
      expect(dots[0]).toHaveClass('bg-primary');
      expect(dots[1]).not.toHaveClass('bg-primary');
    });

    it('should navigate to card when dot is clicked', () => {
      render(<ReportCarousel cards={mockCards} />);

      const dots = screen.getAllByTestId('progress-dot');
      fireEvent.click(dots[2]);

      expect(screen.getByText('Restaurantes')).toBeInTheDocument();
    });

    it('should position dots at bottom of carousel', () => {
      render(<ReportCarousel cards={mockCards} />);

      const dotsContainer = screen.getByTestId('progress-dots-container');
      expect(dotsContainer).toHaveClass('absolute');
      expect(dotsContainer).toHaveClass('bottom-4');
    });
  });

  describe('Swipe navigation (AC #2)', () => {
    it('should have touch event handlers attached', () => {
      render(<ReportCarousel cards={mockCards} />);

      const carousel = screen.getByTestId('report-carousel');
      expect(carousel).toHaveAttribute('data-swipe-enabled', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA attributes', () => {
      render(<ReportCarousel cards={mockCards} />);

      const carousel = screen.getByTestId('report-carousel');
      expect(carousel).toHaveAttribute('role', 'region');
      expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    });

    it('should announce current card position', () => {
      render(<ReportCarousel cards={mockCards} />);

      expect(screen.getByText('1 de 3')).toBeInTheDocument();
    });

    it('should have focusable carousel for keyboard navigation', () => {
      render(<ReportCarousel cards={mockCards} />);

      const carousel = screen.getByTestId('report-carousel');
      expect(carousel).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Reduced motion', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should work without animations when reduced motion is preferred', async () => {
      vi.doMock('../../../../src/hooks/useReducedMotion', () => ({
        useReducedMotion: () => true,
      }));

      const { ReportCarousel: ReportCarouselWithReducedMotion } = await import(
        '@features/reports/components/ReportCarousel'
      );

      render(<ReportCarouselWithReducedMotion cards={mockCards} />);

      expect(screen.getByTestId('report-carousel')).toBeInTheDocument();
    });
  });
});
