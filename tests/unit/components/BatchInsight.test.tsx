/**
 * Story 12.5: Batch Save & Insights - BatchInsight Component Tests
 *
 * Tests for the batch insight dialog shown after batch save.
 *
 * @see docs/sprint-artifacts/epic12/story-12.5-batch-save-insights.md
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchInsight, type BatchSaveResult } from '../../../src/components/BatchInsight';
import type { Transaction } from '../../../src/types/transaction';

// Mock confetti
vi.mock('../../../src/utils/confetti', () => ({
  celebrateBig: vi.fn(),
}));

// Mock useReducedMotion
vi.mock('../../../src/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { celebrateBig } from '../../../src/utils/confetti';
import { useReducedMotion } from '../../../src/hooks/useReducedMotion';

describe('BatchInsight', () => {
  // Mock translation function
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      total: 'Total',
      batchInsightTitle: '{count} receipts saved!',
      batchInsightTopCategory: 'Top category',
      batchInsightTip: 'Check your weekly summary to see trends.',
      batchInsightContinue: 'Continue',
      batchInsightViewReceipts: 'View saved receipts',
      batchInsightFailed: '{count} receipt(s) failed to save',
      Supermarket: 'Supermarket',
      Restaurant: 'Restaurant',
    };
    return translations[key] || key;
  };

  // Create mock transactions
  const createMockTransactions = (count: number): Transaction[] => {
    const categories = ['Supermarket', 'Restaurant', 'Pharmacy', 'GasStation'] as const;
    return Array.from({ length: count }, (_, i) => ({
      merchant: `Store ${i + 1}`,
      total: (i + 1) * 1000,
      date: '2024-01-01',
      category: categories[i % categories.length],
      items: [],
    }));
  };

  const createDefaultProps = (overrides?: Partial<BatchSaveResult>) => {
    const transactions = createMockTransactions(3);
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.total, 0);
    return {
      saveResult: {
        transactions,
        totalAmount,
        failedCount: 0,
        ...overrides,
      },
      theme: 'light' as const,
      currency: 'CLP' as const,
      t: mockT,
      onContinue: vi.fn(),
      onViewReceipts: vi.fn(),
    };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering (AC #3, AC #4)', () => {
    it('should display receipt count in title', () => {
      const props = createDefaultProps();
      render(<BatchInsight {...props} />);

      // Title shows "{count} receipts saved!"
      expect(screen.getByText('3 receipts saved!')).toBeInTheDocument();
    });

    it('should display total amount', () => {
      const props = createDefaultProps();
      render(<BatchInsight {...props} />);

      // Total label
      expect(screen.getByText('Total')).toBeInTheDocument();
      // Total amount (6000 = 1000 + 2000 + 3000)
      expect(screen.getByText('$6.000')).toBeInTheDocument();
    });

    it('should display top category with percentage', () => {
      const props = createDefaultProps();
      render(<BatchInsight {...props} />);

      // Top category section
      expect(screen.getByText('Top category')).toBeInTheDocument();
      // Supermarket is top with 1000 + 5000 = 6000? No wait, it's 3 items:
      // Store 1 (i=0): 1000, Supermarket
      // Store 2 (i=1): 2000, Restaurant
      // Store 3 (i=2): 3000, Pharmacy
      // Pharmacy has highest at 3000 (50%)
      // Let's check what the component actually shows - it uses the category name
      expect(screen.getByText('Pharmacy')).toBeInTheDocument();
    });

    it('should display tip message', () => {
      const props = createDefaultProps();
      render(<BatchInsight {...props} />);

      expect(
        screen.getByText('Check your weekly summary to see trends.')
      ).toBeInTheDocument();
    });

    it('should show failed count warning when there are failures', () => {
      const props = createDefaultProps({ failedCount: 2 });
      render(<BatchInsight {...props} />);

      expect(screen.getByText('2 receipt(s) failed to save')).toBeInTheDocument();
    });

    it('should not show failed warning when no failures', () => {
      const props = createDefaultProps({ failedCount: 0 });
      render(<BatchInsight {...props} />);

      expect(screen.queryByText(/failed to save/)).not.toBeInTheDocument();
    });
  });

  describe('navigation actions (AC #6, AC #8)', () => {
    it('should call onContinue when Continue button is clicked', () => {
      const props = createDefaultProps();
      render(<BatchInsight {...props} />);

      fireEvent.click(screen.getByText('Continue'));

      expect(props.onContinue).toHaveBeenCalledTimes(1);
    });

    it('should call onViewReceipts when View Receipts button is clicked', () => {
      const props = createDefaultProps();
      render(<BatchInsight {...props} />);

      fireEvent.click(screen.getByText('View saved receipts'));

      expect(props.onViewReceipts).toHaveBeenCalledTimes(1);
    });
  });

  describe('celebration animation (AC #7)', () => {
    it('should fire confetti for 5+ receipts', () => {
      const transactions = createMockTransactions(5);
      const props = createDefaultProps({
        transactions,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.total, 0),
      });

      render(<BatchInsight {...props} />);

      // Wait for the 200ms delay
      vi.advanceTimersByTime(250);

      expect(celebrateBig).toHaveBeenCalledTimes(1);
    });

    it('should not fire confetti for less than 5 receipts', () => {
      const props = createDefaultProps(); // 3 receipts
      render(<BatchInsight {...props} />);

      vi.advanceTimersByTime(250);

      expect(celebrateBig).not.toHaveBeenCalled();
    });

    it('should not fire confetti when reduced motion is preferred', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const transactions = createMockTransactions(5);
      const props = createDefaultProps({
        transactions,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.total, 0),
      });

      render(<BatchInsight {...props} />);

      vi.advanceTimersByTime(250);

      expect(celebrateBig).not.toHaveBeenCalled();
    });
  });

  describe('theming', () => {
    it('should apply light theme styles', () => {
      const props = createDefaultProps();
      const { container } = render(<BatchInsight {...props} theme="light" />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog?.querySelector('.bg-white')).toBeInTheDocument();
    });

    it('should apply dark theme styles', () => {
      const props = createDefaultProps();
      const { container } = render(<BatchInsight {...props} theme="dark" />);

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog?.querySelector('.bg-slate-900')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have dialog role with aria-modal', () => {
      const props = createDefaultProps();
      render(<BatchInsight {...props} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible title', () => {
      const props = createDefaultProps();
      render(<BatchInsight {...props} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'batch-insight-title');

      // Title element should exist
      expect(document.getElementById('batch-insight-title')).toBeInTheDocument();
    });
  });

  describe('category breakdown calculation', () => {
    it('should identify top category by amount', () => {
      // Create transactions with clear winner
      const transactions: Transaction[] = [
        { merchant: 'Store 1', total: 1000, date: '2024-01-01', category: 'Supermarket', items: [] },
        { merchant: 'Store 2', total: 5000, date: '2024-01-01', category: 'Restaurant', items: [] },
        { merchant: 'Store 3', total: 2000, date: '2024-01-01', category: 'Supermarket', items: [] },
      ];
      const props = createDefaultProps({
        transactions,
        totalAmount: 8000,
      });

      render(<BatchInsight {...props} />);

      // Supermarket total: 3000 (37.5%), Restaurant: 5000 (62.5%)
      // Restaurant should be top
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });

    it('should calculate correct percentage for top category', () => {
      const transactions: Transaction[] = [
        { merchant: 'Store 1', total: 2000, date: '2024-01-01', category: 'Supermarket', items: [] },
        { merchant: 'Store 2', total: 8000, date: '2024-01-01', category: 'Restaurant', items: [] },
      ];
      const props = createDefaultProps({
        transactions,
        totalAmount: 10000,
      });

      render(<BatchInsight {...props} />);

      // Restaurant is 80%
      expect(screen.getByText(/80%/)).toBeInTheDocument();
    });
  });
});
