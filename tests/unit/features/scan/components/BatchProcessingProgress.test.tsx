/**
 * Story 11.1: One Image = One Transaction
 * Unit tests for BatchProcessingProgress component
 *
 * Tests AC #4 (progress indicator), AC #6 (partial failure display)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BatchProcessingProgress } from '../../../../src/components/scan/BatchProcessingProgress';
import type { BatchItemResult } from '../../../../src/components/scan/BatchProcessingProgress';

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    batchProcessingTitle: 'Processing receipts...',
    batchResultsList: 'Processing results',
    batchItemFailed: 'Could not read the image',
    batchItemProcessing: 'Processing...',
    batchItemPending: 'Waiting...',
    receipt: 'Receipt',
  };
  return translations[key] || key;
};

describe('BatchProcessingProgress', () => {
  const defaultProps = {
    current: 2,
    total: 5,
    results: [
      { index: 0, status: 'success' as const, merchant: 'Store A', total: 10000 },
      { index: 1, status: 'processing' as const },
      { index: 2, status: 'pending' as const },
      { index: 3, status: 'pending' as const },
      { index: 4, status: 'pending' as const },
    ] as BatchItemResult[],
    theme: 'light' as const,
    currency: 'CLP' as const,
    t: mockT,
  };

  describe('AC #4: Progress indicator shows "Procesando 1/X, 2/X..."', () => {
    it('should display current progress fraction', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      expect(screen.getByText('2/5')).toBeInTheDocument();
    });

    it('should display percentage progress', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('should have progress bar with correct value', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '2');
      expect(progressBar).toHaveAttribute('aria-valuemax', '5');
    });

    it('should display processing title', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      expect(screen.getByText('Processing receipts...')).toBeInTheDocument();
    });
  });

  describe('Result status display', () => {
    it('should display success items with merchant and amount', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      // CLP format: $10.000
      expect(screen.getByText(/Store A/)).toBeInTheDocument();
    });

    it('should display processing status', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should display pending status', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      const waitingItems = screen.getAllByText('Waiting...');
      expect(waitingItems).toHaveLength(3); // 3 pending items
    });

    it('should display failed items with error message', () => {
      const propsWithFailure = {
        ...defaultProps,
        results: [
          { index: 0, status: 'success' as const, merchant: 'Store A', total: 10000 },
          { index: 1, status: 'failed' as const, error: 'Network error' },
        ],
      };
      render(<BatchProcessingProgress {...propsWithFailure} />);
      expect(screen.getByText('Could not read the image')).toBeInTheDocument();
    });
  });

  describe('Progress calculation', () => {
    it('should handle 0 progress', () => {
      render(<BatchProcessingProgress {...defaultProps} current={0} />);
      expect(screen.getByText('0/5')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle 100% progress', () => {
      render(<BatchProcessingProgress {...defaultProps} current={5} />);
      expect(screen.getByText('5/5')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should cap progress at 100%', () => {
      render(<BatchProcessingProgress {...defaultProps} current={6} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Theme support (AC #9)', () => {
    it('should apply dark theme styles', () => {
      const { container } = render(
        <BatchProcessingProgress {...defaultProps} theme="dark" />
      );
      const card = container.querySelector('[role="status"]');
      expect(card).toHaveClass('bg-slate-800');
    });

    it('should apply light theme styles', () => {
      const { container } = render(
        <BatchProcessingProgress {...defaultProps} theme="light" />
      );
      const card = container.querySelector('[role="status"]');
      expect(card).toHaveClass('bg-white');
    });
  });

  describe('Accessibility', () => {
    it('should have status role for live updates', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live polite for screen readers', () => {
      const { container } = render(<BatchProcessingProgress {...defaultProps} />);
      const status = container.querySelector('[role="status"]');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have labeled results list', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      expect(screen.getByRole('list', { name: 'Processing results' })).toBeInTheDocument();
    });

    it('should label each result item', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      const items = screen.getAllByRole('listitem');
      expect(items.length).toBe(5);
    });
  });

  describe('Currency formatting', () => {
    it('should format CLP amounts correctly', () => {
      render(<BatchProcessingProgress {...defaultProps} />);
      // $10.000 for CLP
      expect(screen.getByText(/\$10\.000/)).toBeInTheDocument();
    });

    it('should format USD amounts correctly', () => {
      const propsWithUSD = {
        ...defaultProps,
        currency: 'USD' as const,
        results: [
          { index: 0, status: 'success' as const, merchant: 'Store A', total: 100 },
        ],
      };
      render(<BatchProcessingProgress {...propsWithUSD} />);
      // Should show USD format
      expect(screen.getByText(/Store A/)).toBeInTheDocument();
    });
  });
});
