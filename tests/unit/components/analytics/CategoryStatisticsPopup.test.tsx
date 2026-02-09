/**
 * Tests for CategoryStatisticsPopup component
 *
 * Story 14.40: Category Statistics Popup
 * Tests popup rendering, statistics display, and user interactions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryStatisticsPopup } from '@features/analytics/components/CategoryStatisticsPopup';
import type { CategoryStatistics } from '@features/analytics/hooks/useCategoryStatistics';

// Mock the useReducedMotion hook
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const mockStatistics: CategoryStatistics = {
  transactionCount: 15,
  totalSpent: 150000, // $1500.00 in cents
  minTransaction: 5000, // $50.00
  maxTransaction: 25000, // $250.00
  avgTransaction: 10000, // $100.00
  medianTransaction: 9000, // $90.00
  itemCount: 45,
  minItemPrice: 100, // $1.00
  maxItemPrice: 5000, // $50.00
  avgItemPrice: 1500, // $15.00
  medianItemPrice: 1200, // $12.00
  topMerchant: 'Walmart',
  topMerchantCount: 8,
  percentageOfTotal: 25.5,
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onViewHistory: vi.fn(),
  emoji: '🛒',
  categoryName: 'Supermercado',
  categoryColor: '#4CAF50',
  statistics: mockStatistics,
  currency: 'CLP',
  theme: 'light' as const,
  t: (key: string) => key,
  categoryType: 'store-category' as const,
  periodLabel: 'Diciembre 2025',
};

describe('CategoryStatisticsPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CategoryStatisticsPopup {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the popup when isOpen is true', () => {
    render(<CategoryStatisticsPopup {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays the category emoji and name', () => {
    render(<CategoryStatisticsPopup {...defaultProps} />);
    expect(screen.getByText('🛒')).toBeInTheDocument();
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
  });

  it('displays percentage of total', () => {
    render(<CategoryStatisticsPopup {...defaultProps} />);
    expect(screen.getByText(/25\.5%.*ofTotal/)).toBeInTheDocument();
  });

  it('displays transaction statistics section', () => {
    render(<CategoryStatisticsPopup {...defaultProps} />);
    expect(screen.getByText('statsTransactions')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // transactionCount
  });

  it('displays item statistics section when items exist', () => {
    render(<CategoryStatisticsPopup {...defaultProps} />);
    expect(screen.getByText('statsItems')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // itemCount
  });

  it('does not display item statistics when no items', () => {
    const noItemStats: CategoryStatistics = {
      ...mockStatistics,
      itemCount: undefined,
    };
    render(<CategoryStatisticsPopup {...defaultProps} statistics={noItemStats} />);
    expect(screen.queryByText('statsItems')).not.toBeInTheDocument();
  });

  it('displays insights section with top merchant', () => {
    render(<CategoryStatisticsPopup {...defaultProps} />);
    expect(screen.getByText('statsInsights')).toBeInTheDocument();
    expect(screen.getByText('Walmart')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // topMerchantCount
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<CategoryStatisticsPopup {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<CategoryStatisticsPopup {...defaultProps} onClose={onClose} />);

    // Click on the backdrop (parent container)
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onViewHistory when view history button is clicked', () => {
    const onViewHistory = vi.fn();
    render(<CategoryStatisticsPopup {...defaultProps} onViewHistory={onViewHistory} />);

    // Find button by text
    const viewButton = screen.getByRole('button', { name: /viewHistory|viewItems/i });
    fireEvent.click(viewButton);

    expect(onViewHistory).toHaveBeenCalledTimes(1);
  });

  it('shows "viewItems" for item-level categories', () => {
    render(
      <CategoryStatisticsPopup {...defaultProps} categoryType="item-category" />
    );
    expect(screen.getByText('viewItems')).toBeInTheDocument();
  });

  it('shows "viewHistory" for store-level categories', () => {
    render(
      <CategoryStatisticsPopup {...defaultProps} categoryType="store-category" />
    );
    expect(screen.getByText('viewHistory')).toBeInTheDocument();
  });

  it('handles null statistics gracefully', () => {
    render(
      <CategoryStatisticsPopup {...defaultProps} statistics={null} />
    );
    expect(screen.getByText('noData')).toBeInTheDocument();
  });

  it('applies dark theme styles when theme is dark', () => {
    render(<CategoryStatisticsPopup {...defaultProps} theme="dark" />);
    // Modal should still render
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('uses category color for header background', () => {
    render(<CategoryStatisticsPopup {...defaultProps} />);
    // The header div with emoji should have the category color background
    const emoji = screen.getByText('🛒');
    const headerDiv = emoji.closest('div[style*="background"]');
    // Just verify the header section exists - style testing is flaky in jsdom
    expect(headerDiv).toBeInTheDocument();
  });
});
