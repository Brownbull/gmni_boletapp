/**
 * Story 12.3: Batch Review Queue - BatchSummaryCard Component Tests
 *
 * Tests for the receipt summary card component.
 *
 * @see docs/sprint-artifacts/epic12/story-12.3-batch-review-queue.md
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchSummaryCard } from '../../../../src/components/batch/BatchSummaryCard';
import type { BatchReceipt } from '../../../../src/hooks/useBatchReview';

describe('BatchSummaryCard', () => {
  // Create mock translation function
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      unknown: 'Unknown',
      items: 'items',
      item: 'item',
      receipt: 'receipt',
      batchReviewReady: 'Ready',
      batchReviewEdited: 'Edited',
      batchReviewNeeded: 'Review',
      batchReviewError: 'Error',
      batchReviewEdit: 'Edit',
      batchReviewDiscard: 'Discard',
      batchRetry: 'Retry',
    };
    return translations[key] || key;
  };

  // Create a mock receipt
  const createMockReceipt = (
    overrides: Partial<BatchReceipt> = {}
  ): BatchReceipt => ({
    id: 'test-receipt-1',
    index: 0,
    transaction: {
      merchant: 'Test Store',
      alias: 'Test Store',
      total: 15000,
      date: '2024-12-22',
      category: 'Supermarket',
      items: [
        { name: 'Item 1', price: 5000 },
        { name: 'Item 2', price: 10000 },
      ],
    },
    status: 'ready',
    confidence: 0.92,
    ...overrides,
  });

  const defaultProps = {
    receipt: createMockReceipt(),
    theme: 'light' as const,
    currency: 'CLP' as const,
    t: mockT,
    onEdit: vi.fn(),
    onDiscard: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render merchant name', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    it('should render formatted total', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      // CLP currency format
      expect(screen.getByText('$15.000')).toBeInTheDocument();
    });

    it('should render item count', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      expect(screen.getByText('2 items')).toBeInTheDocument();
    });

    it('should render singular item for single item', () => {
      const receipt = createMockReceipt({
        transaction: {
          ...createMockReceipt().transaction,
          items: [{ name: 'Item 1', price: 5000 }],
        },
      });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('should render category emoji', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      // Supermarket emoji is 🛒
      expect(screen.getByText('🛒')).toBeInTheDocument();
    });

    it('should display alias over merchant if available', () => {
      const receipt = createMockReceipt({
        transaction: {
          ...createMockReceipt().transaction,
          merchant: 'Original Merchant',
          alias: 'Display Alias',
        },
      });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.getByText('Display Alias')).toBeInTheDocument();
      expect(screen.queryByText('Original Merchant')).not.toBeInTheDocument();
    });

    it('should display "Unknown" if no merchant or alias', () => {
      const receipt = createMockReceipt({
        transaction: {
          ...createMockReceipt().transaction,
          merchant: '',
          alias: undefined,
        },
      });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('status indicators', () => {
    it('should show "Ready" status for ready receipts', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should show "Edited" status for edited receipts', () => {
      const receipt = createMockReceipt({ status: 'edited' });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.getByText('Edited')).toBeInTheDocument();
    });

    it('should show "Review" status for review receipts', () => {
      const receipt = createMockReceipt({ status: 'review', confidence: 0.75 });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('should show "Error" status for error receipts', () => {
      const receipt = createMockReceipt({
        status: 'error',
        error: 'Failed to process',
      });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should show error message for error status', () => {
      const receipt = createMockReceipt({
        status: 'error',
        error: 'Image quality too low',
      });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.getByText('Image quality too low')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should show Edit button for non-error receipts', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('should show Discard button for all receipts', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    });

    it('should NOT show Edit button for error receipts', () => {
      const receipt = createMockReceipt({ status: 'error' });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('should show Retry button for error receipts when onRetry provided', () => {
      const receipt = createMockReceipt({ status: 'error' });
      const onRetry = vi.fn();

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} onRetry={onRetry} />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should NOT show Retry button when onRetry not provided', () => {
      const receipt = createMockReceipt({ status: 'error' });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} />);

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onEdit when Edit button clicked', () => {
      const onEdit = vi.fn();

      render(<BatchSummaryCard {...defaultProps} onEdit={onEdit} />);

      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDiscard when Discard button clicked', () => {
      const onDiscard = vi.fn();

      render(<BatchSummaryCard {...defaultProps} onDiscard={onDiscard} />);

      fireEvent.click(screen.getByRole('button', { name: /discard/i }));

      expect(onDiscard).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry when Retry button clicked', () => {
      const receipt = createMockReceipt({ status: 'error' });
      const onRetry = vi.fn();

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} onRetry={onRetry} />);

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('theming', () => {
    it('should render with light theme styles', () => {
      const { container } = render(<BatchSummaryCard {...defaultProps} theme="light" />);

      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('should render with dark theme styles', () => {
      const { container } = render(<BatchSummaryCard {...defaultProps} theme="dark" />);

      expect(container.firstChild).toHaveClass('bg-slate-800');
    });
  });

  describe('accessibility', () => {
    it('should have accessible article role', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should have accessible aria-label', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-label',
        'receipt: Test Store'
      );
    });

    it('should have accessible button labels', () => {
      render(<BatchSummaryCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /edit/i })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /discard/i })).toHaveAccessibleName();
    });
  });

  describe('currency formatting', () => {
    it('should format CLP currency correctly', () => {
      render(<BatchSummaryCard {...defaultProps} currency="CLP" />);

      expect(screen.getByText('$15.000')).toBeInTheDocument();
    });

    it('should format USD currency correctly', () => {
      const receipt = createMockReceipt({
        transaction: {
          ...createMockReceipt().transaction,
          total: 150,
        },
      });

      render(<BatchSummaryCard {...defaultProps} receipt={receipt} currency="USD" />);

      // USD shows $150 (without .00 for round numbers based on formatCurrency implementation)
      expect(screen.getByText('$150')).toBeInTheDocument();
    });
  });
});
