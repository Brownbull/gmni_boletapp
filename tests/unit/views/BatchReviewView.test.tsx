/**
 * Story 12.3: Batch Review Queue - BatchReviewView Component Tests
 *
 * Tests for the batch review view component.
 *
 * @see docs/sprint-artifacts/epic12/story-12.3-batch-review-queue.md
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchReviewView } from '../../../src/views/BatchReviewView';
import type { ProcessingResult } from '../../../src/services/batchProcessingService';
import type { Transaction } from '../../../src/types/transaction';

// Mock the useBatchReview hook
vi.mock('../../../src/hooks/useBatchReview', () => ({
  useBatchReview: vi.fn(),
}));

import { useBatchReview } from '../../../src/hooks/useBatchReview';

describe('BatchReviewView', () => {
  // Create mock translation function
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      back: 'Back',
      batchResult: 'Batch Result',
      batchReviewTitle: 'Review Batch',
      receipts: 'receipts',
      receipt: 'receipt',
      total: 'total',
      batchNeedReview: 'need review',
      batchReviewList: 'Receipts to review',
      batchReviewEmpty: 'No receipts to review',
      batchSaveAll: 'Save All',
      batchSaving: 'Saving...',
      batchErrorExcluded: '{count} error receipt(s) excluded',
      batchDiscardConfirmTitle: 'Discard this receipt?',
      batchDiscardConfirmMessage: 'This receipt has high confidence and will not be saved.',
      batchDiscardConfirmYes: 'Discard',
      batchDiscardConfirmNo: 'Cancel',
      cancel: 'Cancel',
      items: 'items',
      batchReviewReady: 'Ready',
      batchReviewEdit: 'Edit',
      batchReviewDiscard: 'Discard',
    };
    return translations[key] || key;
  };

  // Create mock processing results
  const createMockResults = (): ProcessingResult[] => [
    {
      id: 'result-1',
      index: 0,
      success: true,
      result: {
        merchant: 'Store A',
        alias: 'Store A',
        total: 15000,
        date: '2024-12-22',
        category: 'Supermarket' as const,
        items: [{ name: 'Item 1', price: 15000 }],
      },
    },
    {
      id: 'result-2',
      index: 1,
      success: true,
      result: {
        merchant: 'Store B',
        alias: 'Store B',
        total: 25000,
        date: '2024-12-22',
        category: 'Restaurant' as const,
        items: [{ name: 'Item 2', price: 25000 }],
      },
    },
  ];

  // Create mock hook return value
  const createMockHookReturn = (overrides = {}) => ({
    receipts: [
      {
        id: 'result-1',
        index: 0,
        transaction: {
          merchant: 'Store A',
          alias: 'Store A',
          total: 15000,
          date: '2024-12-22',
          category: 'Supermarket' as const,
          items: [{ name: 'Item 1', price: 15000 }],
        },
        status: 'ready' as const,
        confidence: 0.92,
      },
      {
        id: 'result-2',
        index: 1,
        transaction: {
          merchant: 'Store B',
          alias: 'Store B',
          total: 25000,
          date: '2024-12-22',
          category: 'Restaurant' as const,
          items: [{ name: 'Item 2', price: 25000 }],
        },
        status: 'ready' as const,
        confidence: 0.88,
      },
    ],
    totalAmount: 40000,
    validCount: 2,
    reviewCount: 0,
    errorCount: 0,
    isSaving: false,
    saveProgress: 0,
    updateReceipt: vi.fn(),
    discardReceipt: vi.fn(),
    saveAll: vi.fn().mockResolvedValue({ saved: ['tx-1', 'tx-2'], failed: [] }),
    getReceipt: vi.fn(),
    isEmpty: false,
    ...overrides,
  });

  const defaultProps = {
    processingResults: createMockResults(),
    imageDataUrls: ['data:image/jpeg;base64,img1', 'data:image/jpeg;base64,img2'],
    theme: 'light' as const,
    currency: 'CLP' as const,
    t: mockT,
    onEditReceipt: vi.fn(),
    onBack: vi.fn(),
    onSaveComplete: vi.fn(),
    saveTransaction: vi.fn().mockResolvedValue('tx-id'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBatchReview).mockReturnValue(createMockHookReturn());
  });

  describe('rendering', () => {
    it('should render header with back button and title', () => {
      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      // Title changed from 'Review Batch' to 'Batch Result' in Story 12.1 v9.7.0
      expect(screen.getByText('Batch Result')).toBeInTheDocument();
    });

    it('should render summary header with count and total (AC #5)', () => {
      render(<BatchReviewView {...defaultProps} />);

      // Should show "2 receipts • $40.000 total"
      expect(screen.getByText(/2 receipts/)).toBeInTheDocument();
      expect(screen.getByText(/\$40\.000/)).toBeInTheDocument();
    });

    it('should render receipt cards (AC #1, #2)', () => {
      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByText('Store A')).toBeInTheDocument();
      expect(screen.getByText('Store B')).toBeInTheDocument();
    });

    it('should render Save All button (AC #6)', () => {
      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save all/i })).toBeInTheDocument();
    });

    it('should show review count badge when there are receipts needing review', () => {
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ reviewCount: 2 })
      );

      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByText(/2.*need review/)).toBeInTheDocument();
    });

    it('should show error excluded message when there are errors', () => {
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ errorCount: 1 })
      );

      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByText(/1 error receipt.*excluded/)).toBeInTheDocument();
    });

    it('should show empty state when no receipts', () => {
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ receipts: [], isEmpty: true, validCount: 0, totalAmount: 0 })
      );

      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByText('No receipts to review')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onBack when back button clicked', () => {
      const onBack = vi.fn();

      render(<BatchReviewView {...defaultProps} onBack={onBack} />);

      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('should call onEditReceipt when Edit button clicked (AC #4)', () => {
      const onEditReceipt = vi.fn();

      render(<BatchReviewView {...defaultProps} onEditReceipt={onEditReceipt} />);

      // Click first Edit button
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      expect(onEditReceipt).toHaveBeenCalledTimes(1);
      // Signature changed: (receipt, batchIndex, batchTotal, allReceipts)
      expect(onEditReceipt).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'result-1' }),
        1, // batchIndex (1-indexed)
        2, // batchTotal
        expect.any(Array) // allReceipts array
      );
    });

    it('should call discardReceipt when Discard clicked on low confidence receipt', () => {
      const mockDiscardReceipt = vi.fn();
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({
          receipts: [
            {
              id: 'low-conf',
              index: 0,
              transaction: {
                merchant: 'Store',
                total: 1000,
                date: '2024-12-22',
                category: 'Other' as const,
                items: [],
              },
              status: 'review' as const,
              confidence: 0.7,
            },
          ],
          discardReceipt: mockDiscardReceipt,
        })
      );

      render(<BatchReviewView {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /discard/i }));

      expect(mockDiscardReceipt).toHaveBeenCalledWith('low-conf');
    });

    it('should show confirmation dialog for high confidence discard (AC #7)', () => {
      render(<BatchReviewView {...defaultProps} />);

      // Click first Discard button (high confidence receipt)
      const discardButtons = screen.getAllByRole('button', { name: /discard/i });
      fireEvent.click(discardButtons[0]);

      // Confirmation dialog should appear
      expect(screen.getByText('Discard this receipt?')).toBeInTheDocument();
      expect(screen.getByText(/high confidence/)).toBeInTheDocument();
    });

    it('should discard after confirmation', () => {
      const mockDiscardReceipt = vi.fn();
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ discardReceipt: mockDiscardReceipt })
      );

      render(<BatchReviewView {...defaultProps} />);

      // Click Discard on high confidence receipt
      const discardButtons = screen.getAllByRole('button', { name: /discard/i });
      fireEvent.click(discardButtons[0]);

      // Confirm discard - find the button inside the dialog
      const dialog = screen.getByRole('alertdialog');
      const confirmButton = dialog.querySelector('button.bg-red-500') as HTMLElement;
      fireEvent.click(confirmButton);

      expect(mockDiscardReceipt).toHaveBeenCalledWith('result-1');
    });

    it('should cancel discard dialog', async () => {
      const mockDiscardReceipt = vi.fn();
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ discardReceipt: mockDiscardReceipt })
      );

      render(<BatchReviewView {...defaultProps} />);

      // Click Discard
      const discardButtons = screen.getAllByRole('button', { name: /discard/i });
      fireEvent.click(discardButtons[0]);

      // Verify dialog appeared
      expect(screen.getByText('Discard this receipt?')).toBeInTheDocument();

      // Find the Cancel button inside the dialog (it's the second button - first is Discard)
      const dialog = screen.getByRole('alertdialog');
      const dialogButtons = dialog.querySelectorAll('button');
      // Dialog has 2 buttons: Discard (red) and Cancel. Cancel is the second one.
      const cancelButton = dialogButtons[1] as HTMLElement;
      fireEvent.click(cancelButton);

      expect(mockDiscardReceipt).not.toHaveBeenCalled();
      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByText('Discard this receipt?')).not.toBeInTheDocument();
      });
    });
  });

  describe('save all (AC #6)', () => {
    it('should call saveAll and onSaveComplete on success', async () => {
      // Story 14.15: saveAll now returns savedTransactions array
      const mockSavedTransactions = [
        { id: 'tx-1', total: 100, date: new Date().toISOString(), items: [] },
        { id: 'tx-2', total: 200, date: new Date().toISOString(), items: [] },
      ];
      const mockSaveAll = vi.fn().mockResolvedValue({
        saved: ['tx-1', 'tx-2'],
        failed: [],
        savedTransactions: mockSavedTransactions,
      });
      const onSaveComplete = vi.fn();

      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ saveAll: mockSaveAll })
      );

      render(<BatchReviewView {...defaultProps} onSaveComplete={onSaveComplete} />);

      fireEvent.click(screen.getByRole('button', { name: /save all/i }));

      await waitFor(() => {
        expect(mockSaveAll).toHaveBeenCalledWith(defaultProps.saveTransaction);
        // Story 14.15: onSaveComplete now receives both IDs and transactions
        expect(onSaveComplete).toHaveBeenCalledWith(['tx-1', 'tx-2'], mockSavedTransactions);
      });
    });

    it('should show saving state during save', () => {
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ isSaving: true, saveProgress: 1 })
      );

      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      // Save progress shown as (current/validCount) - validCount is 2
      expect(screen.getByText(/\(1\/2\)/)).toBeInTheDocument();
    });

    it('should disable Save All button when saving', () => {
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ isSaving: true, saveProgress: 0, validCount: 2 })
      );

      render(<BatchReviewView {...defaultProps} />);

      // Button shows Saving... (0/2) when saving
      const saveButton = screen.getByText(/Saving/i).closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('should disable Save All button when no valid receipts', () => {
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ validCount: 0, totalAmount: 0 })
      );

      render(<BatchReviewView {...defaultProps} />);

      // Button shows Save All (0) when no valid receipts
      const saveButton = screen.getByRole('button', { name: /save all/i });
      expect(saveButton).toBeDisabled();
    });

    it('should not call onSaveComplete if no receipts saved', async () => {
      const mockSaveAll = vi.fn().mockResolvedValue({ saved: [], failed: ['result-1'] });
      const onSaveComplete = vi.fn();

      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ saveAll: mockSaveAll })
      );

      render(<BatchReviewView {...defaultProps} onSaveComplete={onSaveComplete} />);

      fireEvent.click(screen.getByRole('button', { name: /save all/i }));

      await waitFor(() => {
        expect(onSaveComplete).not.toHaveBeenCalled();
      });
    });
  });

  describe('theming', () => {
    it('should apply theme via CSS variable', () => {
      const { container } = render(<BatchReviewView {...defaultProps} theme="light" />);

      // Component uses CSS variable for theming instead of Tailwind classes
      // style={{ backgroundColor: 'var(--bg)' }}
      const mainContainer = container.firstChild as HTMLElement;
      // Check that style attribute contains the CSS variable
      expect(mainContainer.getAttribute('style')).toContain('background-color: var(--bg)');
    });

    it('should have flex column layout', () => {
      const { container } = render(<BatchReviewView {...defaultProps} theme="dark" />);

      // Main container has flex flex-col h-full layout
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'h-full');
    });
  });

  describe('accessibility (AC #8)', () => {
    it('should have accessible list role', () => {
      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByRole('list', { name: /receipts to review/i })).toBeInTheDocument();
    });

    it('should disable back button while saving', () => {
      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({ isSaving: true })
      );

      render(<BatchReviewView {...defaultProps} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    });
  });

  describe('retry functionality', () => {
    it('should call onRetryReceipt when retry is clicked', () => {
      const onRetryReceipt = vi.fn();

      vi.mocked(useBatchReview).mockReturnValue(
        createMockHookReturn({
          receipts: [
            {
              id: 'error-1',
              index: 0,
              transaction: {
                merchant: '',
                total: 0,
                date: '',
                category: 'Other' as const,
                items: [],
              },
              status: 'error' as const,
              confidence: 0,
              error: 'Failed',
            },
          ],
        })
      );

      render(<BatchReviewView {...defaultProps} onRetryReceipt={onRetryReceipt} />);

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(onRetryReceipt).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'error-1', status: 'error' })
      );
    });
  });
});
