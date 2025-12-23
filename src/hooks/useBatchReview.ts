/**
 * useBatchReview Hook
 *
 * Story 12.3: Batch Review Queue
 * React hook for managing batch review state, including editing,
 * discarding, and saving all receipts.
 *
 * @see docs/sprint-artifacts/epic12/story-12.3-batch-review-queue.md
 */

import { useState, useCallback, useMemo } from 'react';
import { Transaction } from '../types/transaction';
import { ImageProcessingState, ProcessingResult } from '../services/batchProcessingService';
import { calculateConfidence, QUICK_SAVE_CONFIDENCE_THRESHOLD } from '../utils/confidenceCheck';

/**
 * Status of a receipt in the batch review queue.
 * - ready: High confidence, no action needed
 * - review: Low confidence, user should review
 * - edited: User made changes
 * - error: Processing failed
 */
export type BatchReceiptStatus = 'ready' | 'review' | 'edited' | 'error';

/**
 * A receipt in the batch review queue.
 */
export interface BatchReceipt {
  /** Unique identifier for this receipt */
  id: string;
  /** Original index in the batch */
  index: number;
  /** Image data URL (for display) */
  imageUrl?: string;
  /** Extracted transaction data */
  transaction: Transaction;
  /** Current status */
  status: BatchReceiptStatus;
  /** Confidence score (0-1) */
  confidence: number;
  /** Error message (if status is 'error') */
  error?: string;
}

/**
 * Return type for the useBatchReview hook.
 */
export interface UseBatchReviewReturn {
  /** All receipts in the review queue */
  receipts: BatchReceipt[];
  /** Total amount across all valid receipts */
  totalAmount: number;
  /** Count of valid (non-error) receipts */
  validCount: number;
  /** Count of receipts needing review */
  reviewCount: number;
  /** Count of error receipts */
  errorCount: number;
  /** Whether save all is in progress */
  isSaving: boolean;
  /** Current save progress (0 to total) */
  saveProgress: number;
  /** Update a receipt's transaction data (marks as edited) */
  updateReceipt: (id: string, transaction: Transaction) => void;
  /** Discard a receipt from the batch */
  discardReceipt: (id: string) => void;
  /** Save all valid receipts to Firestore */
  saveAll: (
    saveTransaction: (transaction: Transaction) => Promise<string>
  ) => Promise<{ saved: string[]; failed: string[] }>;
  /** Get a receipt by ID for editing */
  getReceipt: (id: string) => BatchReceipt | undefined;
  /** Check if batch is empty (all discarded) */
  isEmpty: boolean;
}

/**
 * Determine receipt status based on processing result and confidence.
 */
function determineReceiptStatus(
  result: ProcessingResult | ImageProcessingState
): BatchReceiptStatus {
  // Error state
  if ('success' in result && !result.success) {
    return 'error';
  }
  if ('status' in result && result.status === 'error') {
    return 'error';
  }

  // Get transaction for confidence check
  const transaction = 'result' in result ? result.result : undefined;
  if (!transaction) {
    return 'error';
  }

  // Calculate confidence
  const confidence = calculateConfidence(transaction);
  return confidence >= QUICK_SAVE_CONFIDENCE_THRESHOLD ? 'ready' : 'review';
}

/**
 * Hook for managing batch review state.
 *
 * @param processingResults - Results from parallel processing (Story 12.2)
 * @param imageDataUrls - Original image data URLs for display
 * @returns Batch review state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   receipts,
 *   totalAmount,
 *   updateReceipt,
 *   discardReceipt,
 *   saveAll
 * } = useBatchReview(processingResults, imageDataUrls);
 * ```
 */
export function useBatchReview(
  processingResults: ProcessingResult[],
  imageDataUrls: string[] = []
): UseBatchReviewReturn {
  // Initialize receipts from processing results
  const initialReceipts = useMemo<BatchReceipt[]>(() => {
    return processingResults.map((result) => {
      const transaction = result.result || {
        merchant: '',
        date: new Date().toISOString().split('T')[0],
        total: 0,
        category: 'Other' as const,
        items: [],
      };

      const status = determineReceiptStatus(result);
      const confidence = result.success && result.result
        ? calculateConfidence(result.result)
        : 0;

      return {
        id: result.id,
        index: result.index,
        imageUrl: imageDataUrls[result.index],
        transaction,
        status,
        confidence,
        error: result.error,
      };
    });
  }, [processingResults, imageDataUrls]);

  // State
  const [receipts, setReceipts] = useState<BatchReceipt[]>(initialReceipts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  /**
   * Update a receipt's transaction data.
   * Marks the receipt as 'edited' and recalculates confidence.
   */
  const updateReceipt = useCallback((id: string, transaction: Transaction) => {
    setReceipts((prev) =>
      prev.map((receipt) => {
        if (receipt.id !== id) return receipt;

        const confidence = calculateConfidence(transaction);
        return {
          ...receipt,
          transaction,
          status: 'edited' as const,
          confidence,
        };
      })
    );
  }, []);

  /**
   * Discard a receipt from the batch.
   */
  const discardReceipt = useCallback((id: string) => {
    setReceipts((prev) => prev.filter((receipt) => receipt.id !== id));
  }, []);

  /**
   * Get a receipt by ID for editing.
   */
  const getReceipt = useCallback(
    (id: string): BatchReceipt | undefined => {
      return receipts.find((r) => r.id === id);
    },
    [receipts]
  );

  /**
   * Save all valid receipts to Firestore.
   */
  const saveAll = useCallback(
    async (
      saveTransaction: (transaction: Transaction) => Promise<string>
    ): Promise<{ saved: string[]; failed: string[] }> => {
      // Get valid receipts (non-error)
      const validReceipts = receipts.filter((r) => r.status !== 'error');

      if (validReceipts.length === 0) {
        return { saved: [], failed: [] };
      }

      setIsSaving(true);
      setSaveProgress(0);

      const saved: string[] = [];
      const failed: string[] = [];

      // Save each receipt sequentially
      for (let i = 0; i < validReceipts.length; i++) {
        const receipt = validReceipts[i];

        try {
          const transactionId = await saveTransaction(receipt.transaction);
          saved.push(transactionId);
        } catch (error) {
          console.error(`Failed to save receipt ${receipt.id}:`, error);
          failed.push(receipt.id);
        }

        setSaveProgress(i + 1);
      }

      setIsSaving(false);
      return { saved, failed };
    },
    [receipts]
  );

  // Computed values
  const validReceipts = useMemo(
    () => receipts.filter((r) => r.status !== 'error'),
    [receipts]
  );

  const totalAmount = useMemo(
    () => validReceipts.reduce((sum, r) => sum + (r.transaction.total || 0), 0),
    [validReceipts]
  );

  const validCount = validReceipts.length;

  const reviewCount = useMemo(
    () => receipts.filter((r) => r.status === 'review').length,
    [receipts]
  );

  const errorCount = useMemo(
    () => receipts.filter((r) => r.status === 'error').length,
    [receipts]
  );

  const isEmpty = receipts.length === 0;

  return {
    receipts,
    totalAmount,
    validCount,
    reviewCount,
    errorCount,
    isSaving,
    saveProgress,
    updateReceipt,
    discardReceipt,
    saveAll,
    getReceipt,
    isEmpty,
  };
}

export default useBatchReview;
