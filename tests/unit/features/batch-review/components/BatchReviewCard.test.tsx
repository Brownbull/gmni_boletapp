/**
 * Story 14e-15: BatchReviewCard Tests
 *
 * Tests for the BatchReviewCard component (migrated from BatchSummaryCard).
 * Includes AC5 compliance: Store integration for discardItem action.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchReviewCard } from '@features/batch-review/components/BatchReviewCard';
import { useBatchReviewStore } from '@features/batch-review/store';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { Transaction } from '@/types/transaction';

// Mock Zustand store with controllable discardItem mock
const mockDiscardItem = vi.fn();
vi.mock('@features/batch-review/store', () => ({
  useBatchReviewStore: vi.fn((selector) => {
    const state = { discardItem: mockDiscardItem };
    return selector(state);
  }),
}));

describe('BatchReviewCard', () => {
  // Note: Amounts are stored in cents for USD/GBP (usesCents currencies)
  // $100.00 = 10000 cents, $50.00 = 5000 cents
  const mockTransaction: Transaction = {
    id: 'tx-1',
    merchant: 'Test Store',
    total: 10000, // $100.00 in cents
    currency: 'USD',
    date: '2026-01-26',
    items: [
      { name: 'Item 1', price: 5000 }, // $50.00
      { name: 'Item 2', price: 5000 }, // $50.00
    ],
    storeCategory: 'grocery',
    category: 'groceries',
    city: 'Santiago',
    time: '14:30',
  };

  const mockReceipt: BatchReceipt = {
    id: 'receipt-1',
    transaction: mockTransaction,
    status: 'ready',
    confidence: 0.9,
    imageUrl: 'https://example.com/receipt.jpg',
  };

  const defaultProps = {
    receipt: mockReceipt,
    theme: 'light' as const,
    currency: 'CLP' as const,
    t: (key: string) => key,
    onEdit: vi.fn(),
    // Note: onDiscard is optional as of Story 14e-15 AC5
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDiscardItem.mockClear();
  });

  it('should render receipt card with merchant name and total', () => {
    render(<BatchReviewCard {...defaultProps} />);

    expect(screen.getByText('Test Store')).toBeInTheDocument();
    // Currency formatting uses Intl.NumberFormat which may include currency symbol prefix
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
  });

  it('should render receipt thumbnail when imageUrl is provided', () => {
    render(<BatchReviewCard {...defaultProps} />);

    const img = screen.getByAltText('Receipt from Test Store');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/receipt.jpg');
  });

  it('should render placeholder when no imageUrl', () => {
    const receiptNoImage: BatchReceipt = {
      ...mockReceipt,
      imageUrl: undefined,
    };

    render(<BatchReviewCard {...defaultProps} receipt={receiptNoImage} />);

    // Should not find the image
    expect(screen.queryByAltText('Receipt from Test Store')).not.toBeInTheDocument();
  });

  it('should render meta pills for date, time, location', () => {
    render(<BatchReviewCard {...defaultProps} />);

    // Should show city
    expect(screen.getByText('Santiago')).toBeInTheDocument();
    // Should show item count
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render status badge for ready status', () => {
    render(<BatchReviewCard {...defaultProps} />);

    expect(screen.getByText('batchItemReady')).toBeInTheDocument();
  });

  it('should render status badge for review status', () => {
    const reviewReceipt: BatchReceipt = {
      ...mockReceipt,
      status: 'review',
    };

    render(<BatchReviewCard {...defaultProps} receipt={reviewReceipt} />);

    expect(screen.getByText('batchReviewNeeded')).toBeInTheDocument();
  });

  it('should render status badge for error status with error message', () => {
    const errorReceipt: BatchReceipt = {
      ...mockReceipt,
      status: 'error',
      error: 'OCR failed',
    };

    render(<BatchReviewCard {...defaultProps} receipt={errorReceipt} />);

    expect(screen.getByText('batchReviewError')).toBeInTheDocument();
    expect(screen.getByText('OCR failed')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<BatchReviewCard {...defaultProps} onEdit={onEdit} />);

    fireEvent.click(screen.getByLabelText('batchReviewEdit'));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDiscard prop when provided (backwards compatibility)', () => {
    const onDiscard = vi.fn();
    render(<BatchReviewCard {...defaultProps} onDiscard={onDiscard} />);

    fireEvent.click(screen.getByLabelText('batchReviewDiscard'));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    // Store action should NOT be called when prop is provided
    expect(mockDiscardItem).not.toHaveBeenCalled();
  });

  // Story 14e-15 AC5: Store integration for discardItem
  it('should call store discardItem with receipt.id when onDiscard prop not provided (AC5)', () => {
    // Render without onDiscard prop
    render(<BatchReviewCard {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('batchReviewDiscard'));

    // Store action should be called with receipt ID
    expect(mockDiscardItem).toHaveBeenCalledTimes(1);
    expect(mockDiscardItem).toHaveBeenCalledWith('receipt-1');
  });

  it('should expand items section when chevron is clicked', () => {
    render(<BatchReviewCard {...defaultProps} />);

    // Items section should be collapsed initially
    const expandButton = screen.getByLabelText('expand');
    fireEvent.click(expandButton);

    // Should show item names after expansion
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<BatchReviewCard {...defaultProps} onSave={onSave} />);

    fireEvent.click(screen.getByLabelText('save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  it('should show retry button for error receipts with onRetry handler', () => {
    const errorReceipt: BatchReceipt = {
      ...mockReceipt,
      status: 'error',
    };
    const onRetry = vi.fn();

    render(<BatchReviewCard {...defaultProps} receipt={errorReceipt} onRetry={onRetry} />);

    const retryButton = screen.getByLabelText('batchRetry');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show save button for error receipts', () => {
    const errorReceipt: BatchReceipt = {
      ...mockReceipt,
      status: 'error',
    };

    render(<BatchReviewCard {...defaultProps} receipt={errorReceipt} onSave={vi.fn()} />);

    expect(screen.queryByLabelText('save')).not.toBeInTheDocument();
  });

  it('should disable buttons while saving', async () => {
    const onSave = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<BatchReviewCard {...defaultProps} onSave={onSave} />);

    fireEvent.click(screen.getByLabelText('save'));

    // Buttons should be disabled
    await waitFor(() => {
      expect(screen.getByLabelText('batchReviewEdit')).toBeDisabled();
      expect(screen.getByLabelText('batchReviewDiscard')).toBeDisabled();
    });
  });

  it('should use transaction currency when available', () => {
    const gbpReceipt: BatchReceipt = {
      ...mockReceipt,
      transaction: { ...mockTransaction, currency: 'GBP', total: 10000 }, // £100.00 in pence
    };

    render(<BatchReviewCard {...defaultProps} receipt={gbpReceipt} />);

    // Should display in GBP format
    expect(screen.getByText(/£100\.00/)).toBeInTheDocument();
  });

  it('should show remaining items count when more than 5 items', () => {
    const manyItemsReceipt: BatchReceipt = {
      ...mockReceipt,
      transaction: {
        ...mockTransaction,
        items: [
          { name: 'Item 1', price: 10 },
          { name: 'Item 2', price: 10 },
          { name: 'Item 3', price: 10 },
          { name: 'Item 4', price: 10 },
          { name: 'Item 5', price: 10 },
          { name: 'Item 6', price: 10 },
          { name: 'Item 7', price: 10 },
        ],
      },
    };

    render(<BatchReviewCard {...defaultProps} receipt={manyItemsReceipt} />);

    // Expand items
    fireEvent.click(screen.getByLabelText('expand'));

    // Should show "+2 more"
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });
});
