/**
 * Tests for ReportCard component
 *
 * Story 14.16: Weekly Report Story Format
 * Epic 14: Core Implementation
 *
 * AC #1: ReportCard component with full-screen card styling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportCard } from '@features/reports/components/ReportCard';
import type { ReportCard as ReportCardType } from '../../../../src/types/report';

// Mock useReducedMotion hook
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('ReportCard', () => {
  const mockSummaryCard: ReportCardType = {
    id: 'summary-1',
    type: 'summary',
    title: 'Esta Semana',
    primaryValue: '$45.200',
    secondaryValue: 'vs semana pasada',
    trend: 'up',
    trendPercent: 8,
  };

  const mockCategoryCard: ReportCardType = {
    id: 'category-1',
    type: 'category',
    title: 'Supermercado',
    primaryValue: '$22.500',
    secondaryValue: '50% del total',
    category: 'Supermarket',
    categoryIcon: '🛒',
    trend: 'down',
    trendPercent: 5,
  };

  describe('Rendering', () => {
    it('should render summary card with title and primary value', () => {
      render(<ReportCard card={mockSummaryCard} />);

      expect(screen.getByText('Esta Semana')).toBeInTheDocument();
      expect(screen.getByText('$45.200')).toBeInTheDocument();
    });

    it('should render secondary value when provided', () => {
      render(<ReportCard card={mockSummaryCard} />);

      expect(screen.getByText('vs semana pasada')).toBeInTheDocument();
    });

    it('should render category icon for category cards', () => {
      render(<ReportCard card={mockCategoryCard} />);

      expect(screen.getByText('🛒')).toBeInTheDocument();
    });

    it('should apply full-screen card styling', () => {
      render(<ReportCard card={mockSummaryCard} />);

      const card = screen.getByTestId('report-card');
      expect(card).toHaveClass('flex');
      expect(card).toHaveClass('items-center');
      expect(card).toHaveClass('justify-center');
    });

    it('should render large typography for key numbers', () => {
      render(<ReportCard card={mockSummaryCard} />);

      const primaryValue = screen.getByText('$45.200');
      expect(primaryValue).toHaveClass('text-4xl');
    });
  });

  describe('Card types', () => {
    it('should render summary card with gradient background', () => {
      render(<ReportCard card={mockSummaryCard} />);

      const card = screen.getByTestId('report-card');
      expect(card).toHaveAttribute('data-card-type', 'summary');
    });

    it('should render category card with category-specific styling', () => {
      render(<ReportCard card={mockCategoryCard} />);

      const card = screen.getByTestId('report-card');
      expect(card).toHaveAttribute('data-card-type', 'category');
    });
  });

  describe('Trend indicators', () => {
    it('should show up arrow for increasing trend', () => {
      render(<ReportCard card={mockSummaryCard} />);

      expect(screen.getByTestId('trend-arrow')).toBeInTheDocument();
      expect(screen.getByText(/8%/)).toBeInTheDocument();
    });

    it('should show down arrow for decreasing trend', () => {
      render(<ReportCard card={mockCategoryCard} />);

      expect(screen.getByTestId('trend-arrow')).toBeInTheDocument();
      expect(screen.getByText(/5%/)).toBeInTheDocument();
    });

    it('should not show trend arrow when trend is neutral', () => {
      const neutralCard: ReportCardType = {
        ...mockSummaryCard,
        trend: 'neutral',
        trendPercent: 0,
      };

      render(<ReportCard card={neutralCard} />);

      // Should show neutral indicator
      expect(screen.getByTestId('trend-indicator')).toBeInTheDocument();
    });

    it('should not show trend indicator when no trend provided', () => {
      const noTrendCard: ReportCardType = {
        id: 'first-week',
        type: 'summary',
        title: 'Esta Semana',
        primaryValue: '$45.200',
        description: 'Tu primera semana',
      };

      render(<ReportCard card={noTrendCard} />);

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Rosa-friendly format', () => {
    it('should display description when provided', () => {
      const cardWithDescription: ReportCardType = {
        ...mockSummaryCard,
        description: 'Subió harto',
      };

      render(<ReportCard card={cardWithDescription} />);

      expect(screen.getByText('Subió harto')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA attributes', () => {
      render(<ReportCard card={mockSummaryCard} />);

      const card = screen.getByTestId('report-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label');
    });

    it('should announce trend direction for screen readers', () => {
      render(<ReportCard card={mockSummaryCard} />);

      const trendElement = screen.getByTestId('trend-indicator');
      expect(trendElement).toHaveAttribute('aria-label');
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

      const { ReportCard: ReportCardWithReducedMotion } = await import(
        '@features/reports/components/ReportCard'
      );

      render(<ReportCardWithReducedMotion card={mockSummaryCard} />);

      expect(screen.getByTestId('report-card')).toBeInTheDocument();
    });
  });
});
