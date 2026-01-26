/**
 * Story 14e-15: State Components Tests
 *
 * Tests for ProcessingState, ReviewingState, and EmptyState components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessingState } from '@features/batch-review/components/states/ProcessingState';
import { ReviewingState } from '@features/batch-review/components/states/ReviewingState';
import { EmptyState } from '@features/batch-review/components/states/EmptyState';
import type { ImageProcessingState } from '@features/batch-review/components/BatchProgressIndicator';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { Transaction } from '@/types/transaction';

// Mock Zustand store with selector pattern
const mockDiscardItem = vi.fn();
vi.mock('@features/batch-review/store', () => ({
  useBatchProgress: vi.fn(() => ({ current: 2, total: 5 })),
  useBatchReviewStore: vi.fn((selector) => {
    const state = { discardItem: mockDiscardItem };
    return selector(state);
  }),
}));

describe('ProcessingState', () => {
  const mockStates: ImageProcessingState[] = [
    { id: '1', status: 'ready', result: { merchant: 'Store A', total: 100 } },
    { id: '2', status: 'processing' },
    { id: '3', status: 'pending' },
  ];

  const defaultProps = {
    t: (key: string) => key,
    theme: 'light' as const,
    states: mockStates,
    formatCurrency: (amt: number) => `$${amt}`,
    currency: 'USD',
    progress: { current: 1, total: 3 },
  };

  it('should render BatchProgressIndicator with states', () => {
    render(<ProcessingState {...defaultProps} />);

    expect(screen.getByText('batchProcessing (1/3)')).toBeInTheDocument();
    expect(screen.getByText('receipt 1')).toBeInTheDocument();
    expect(screen.getByText('receipt 2')).toBeInTheDocument();
    expect(screen.getByText('receipt 3')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ProcessingState {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ReviewingState', () => {
  const mockTransaction: Transaction = {
    id: 'tx-1',
    merchant: 'Test Store',
    total: 100,
    currency: 'USD',
    date: '2026-01-26',
    items: [],
    storeCategory: 'grocery',
    category: 'groceries',
  };

  const mockReceipts: BatchReceipt[] = [
    {
      id: 'receipt-1',
      transaction: { ...mockTransaction, id: 'tx-1', merchant: 'Store A' },
      status: 'ready',
      confidence: 0.9,
    },
    {
      id: 'receipt-2',
      transaction: { ...mockTransaction, id: 'tx-2', merchant: 'Store B' },
      status: 'review',
      confidence: 0.7,
    },
  ];

  const defaultProps = {
    receipts: mockReceipts,
    theme: 'light' as const,
    currency: 'CLP' as const,
    t: (key: string) => key,
    onEditReceipt: vi.fn(),
    onDiscardReceipt: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all receipt cards', () => {
    render(<ReviewingState {...defaultProps} />);

    expect(screen.getByText('Store A')).toBeInTheDocument();
    expect(screen.getByText('Store B')).toBeInTheDocument();
  });

  it('should render list with correct aria label', () => {
    render(<ReviewingState {...defaultProps} />);

    expect(screen.getByRole('list', { name: 'batchReviewList' })).toBeInTheDocument();
  });

  it('should call onEditReceipt when edit button is clicked', () => {
    const onEditReceipt = vi.fn();
    render(<ReviewingState {...defaultProps} onEditReceipt={onEditReceipt} />);

    // Click first edit button
    const editButtons = screen.getAllByLabelText('batchReviewEdit');
    fireEvent.click(editButtons[0]);

    expect(onEditReceipt).toHaveBeenCalledWith(mockReceipts[0]);
  });

  it('should call onDiscardReceipt when discard button is clicked', () => {
    const onDiscardReceipt = vi.fn();
    render(<ReviewingState {...defaultProps} onDiscardReceipt={onDiscardReceipt} />);

    // Click first discard button
    const discardButtons = screen.getAllByLabelText('batchReviewDiscard');
    fireEvent.click(discardButtons[0]);

    expect(onDiscardReceipt).toHaveBeenCalledWith(mockReceipts[0]);
  });

  it('should call onSaveReceipt when save button is clicked', async () => {
    const onSaveReceipt = vi.fn().mockResolvedValue(undefined);
    render(<ReviewingState {...defaultProps} onSaveReceipt={onSaveReceipt} />);

    // Click first save button
    const saveButtons = screen.getAllByLabelText('save');
    fireEvent.click(saveButtons[0]);

    // Wait for async state update to complete (fixes act() warning)
    await waitFor(() => {
      expect(onSaveReceipt).toHaveBeenCalledWith('receipt-1');
    });
  });

  it('should call onRetryReceipt for error receipts', () => {
    const errorReceipt: BatchReceipt = {
      id: 'receipt-error',
      transaction: { ...mockTransaction, id: 'tx-error' },
      status: 'error',
      confidence: 0,
      error: 'OCR failed',
    };

    const onRetryReceipt = vi.fn();
    render(
      <ReviewingState
        {...defaultProps}
        receipts={[errorReceipt]}
        onRetryReceipt={onRetryReceipt}
      />
    );

    const retryButton = screen.getByLabelText('batchRetry');
    fireEvent.click(retryButton);

    expect(onRetryReceipt).toHaveBeenCalledWith(errorReceipt);
  });
});

describe('EmptyState', () => {
  const defaultProps = {
    t: (key: string) => key,
    theme: 'light' as const,
  };

  it('should render empty message', () => {
    render(<EmptyState {...defaultProps} />);

    expect(screen.getByText('batchReviewEmpty')).toBeInTheDocument();
  });

  it('should have status role for accessibility', () => {
    render(<EmptyState {...defaultProps} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render with dark theme', () => {
    render(<EmptyState {...defaultProps} theme="dark" />);

    expect(screen.getByText('batchReviewEmpty')).toBeInTheDocument();
  });
});
