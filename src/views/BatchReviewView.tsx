/**
 * BatchReviewView Component
 *
 * Story 12.3: Batch Review Queue
 * Main view for reviewing all processed receipts before saving.
 *
 * Features:
 * - Summary header with count and total (AC #5)
 * - Cards for each receipt (AC #1, #2, #3)
 * - Edit individual receipts (AC #4)
 * - Discard receipts (AC #7)
 * - Save all button (AC #6)
 * - Scroll navigation for large batches (AC #8)
 *
 * @see docs/sprint-artifacts/epic12/story-12.3-batch-review-queue.md
 */

import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { useBatchReview, BatchReceipt } from '../hooks/useBatchReview';
import { BatchSummaryCard } from '../components/batch/BatchSummaryCard';
import { ProcessingResult, ImageProcessingState } from '../services/batchProcessingService';
import { Transaction } from '../types/transaction';
import { formatCurrency } from '../utils/currency';
import type { Currency } from '../types/settings';

/**
 * Props for processing state display.
 * When isProcessing is true, show processing progress instead of review cards.
 */
export interface ProcessingStateProps {
  /** Whether processing is currently active */
  isProcessing: boolean;
  /** Processing progress (current/total) */
  progress: { current: number; total: number };
  /** Processing states for each image */
  states: ImageProcessingState[];
  /** Called when user cancels processing */
  onCancelProcessing?: () => void;
}

export interface BatchReviewViewProps {
  /** Processing results from Story 12.2 */
  processingResults: ProcessingResult[];
  /** Original image data URLs for display */
  imageDataUrls: string[];
  /** Current theme */
  theme: 'light' | 'dark';
  /** Display currency */
  currency: Currency;
  /** Translation function */
  t: (key: string) => string;
  /** Format currency function */
  formatCurrencyFn?: typeof formatCurrency;
  /** Called when user wants to edit a receipt */
  onEditReceipt: (receipt: BatchReceipt, batchIndex: number, batchTotal: number) => void;
  /** Called when receipt is updated from edit view */
  onReceiptUpdated?: (receiptId: string, transaction: Transaction) => void;
  /** Called when user cancels and returns to batch capture */
  onBack: () => void;
  /** Called when all receipts are saved successfully. Story 14.15: Now includes saved transactions. */
  onSaveComplete: (savedTransactionIds: string[], savedTransactions: Transaction[]) => void;
  /** Function to save a transaction to Firestore */
  saveTransaction: (transaction: Transaction) => Promise<string>;
  /** Called when user wants to retry a failed receipt */
  onRetryReceipt?: (receipt: BatchReceipt) => void;
  /** Story 12.3: Processing state props for inline progress display */
  processingState?: ProcessingStateProps;
}

/**
 * BatchReviewView Component
 *
 * Displays all processed receipts for review before saving.
 * Layout:
 * - Header with back button and title
 * - Summary header: "{count} boletas • ${total} total"
 * - Scrollable list of receipt cards
 * - Fixed "Guardar todo" button at bottom
 */
export const BatchReviewView: React.FC<BatchReviewViewProps> = ({
  processingResults,
  imageDataUrls,
  theme,
  currency,
  t,
  formatCurrencyFn = formatCurrency,
  onEditReceipt,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onReceiptUpdated: _onReceiptUpdated, // Reserved for parent integration
  onBack,
  onSaveComplete,
  saveTransaction,
  onRetryReceipt,
  processingState,
}) => {
  const isDark = theme === 'dark';

  // Use batch review hook
  const {
    receipts,
    totalAmount,
    validCount,
    reviewCount,
    errorCount,
    isSaving,
    saveProgress,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateReceipt: _updateReceipt, // Exposed via hook for parent integration
    discardReceipt,
    saveAll,
    isEmpty,
  } = useBatchReview(processingResults, imageDataUrls);

  // State for discard confirmation
  const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);

  // Note: Receipt updates are handled via the updateReceipt function from the hook
  // The onReceiptUpdated callback is called by the parent component after editing

  // Handle edit click
  const handleEdit = useCallback(
    (receipt: BatchReceipt) => {
      const batchIndex = receipts.findIndex((r) => r.id === receipt.id);
      onEditReceipt(receipt, batchIndex + 1, receipts.length);
    },
    [receipts, onEditReceipt]
  );

  // Handle discard click
  const handleDiscard = useCallback((receipt: BatchReceipt) => {
    // High confidence receipts need confirmation
    if (receipt.confidence >= 0.85 && receipt.status !== 'error') {
      setConfirmDiscardId(receipt.id);
    } else {
      discardReceipt(receipt.id);
    }
  }, [discardReceipt]);

  // Confirm discard
  const handleConfirmDiscard = useCallback(() => {
    if (confirmDiscardId) {
      discardReceipt(confirmDiscardId);
      setConfirmDiscardId(null);
    }
  }, [confirmDiscardId, discardReceipt]);

  // Cancel discard
  const handleCancelDiscard = useCallback(() => {
    setConfirmDiscardId(null);
  }, []);

  // Handle save all - Story 14.15: Now passes saved transactions for batch complete modal
  const handleSaveAll = useCallback(async () => {
    const result = await saveAll(saveTransaction);
    if (result.saved.length > 0) {
      onSaveComplete(result.saved, result.savedTransactions);
    }
  }, [saveAll, saveTransaction, onSaveComplete]);

  // Handle retry
  const handleRetry = useCallback(
    (receipt: BatchReceipt) => {
      onRetryReceipt?.(receipt);
    },
    [onRetryReceipt]
  );

  // Theme-based styling
  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const headerBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';

  // Format total amount
  const formattedTotal = formatCurrencyFn(totalAmount, currency);

  return (
    <div className={`flex flex-col h-full ${bgColor}`}>
      {/* Header */}
      <header
        className={`flex items-center gap-3 px-4 py-3 ${headerBg} border-b ${borderColor}`}
      >
        <button
          onClick={onBack}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
          }`}
          aria-label={t('back')}
          disabled={isSaving}
        >
          <ArrowLeft size={20} className={textPrimary} />
        </button>
        <h1 className={`text-lg font-semibold ${textPrimary}`}>
          {t('batchReviewTitle')}
        </h1>
      </header>

      {/* Story 12.3: Show processing progress when active */}
      {processingState?.isProcessing ? (
        <>
          {/* Processing header */}
          <div className={`px-4 py-3 ${headerBg} border-b ${borderColor}`}>
            <div className="flex items-center justify-between">
              <span className={`text-base font-medium ${textPrimary}`}>
                {t('batchProcessing')} ({processingState.progress.current}/{processingState.progress.total})
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Loader2 size={12} className="animate-spin" />
                {t('processing')}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(processingState.progress.current / processingState.progress.total) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Processing states list */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            role="list"
            aria-label={t('batchProcessingList')}
          >
            {processingState.states.map((state, index) => (
              <div
                key={state.id}
                className={`rounded-lg border ${borderColor} ${isDark ? 'bg-slate-800' : 'bg-white'} p-4 flex items-center gap-3`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {state.status === 'processing' && (
                    <Loader2 size={20} className="text-amber-500 animate-spin" />
                  )}
                  {state.status === 'ready' && (
                    <Check size={20} className="text-green-500" />
                  )}
                  {state.status === 'error' && (
                    <X size={20} className="text-red-500" />
                  )}
                  {state.status === 'pending' && (
                    <div className={`w-5 h-5 rounded-full border-2 ${isDark ? 'border-slate-600' : 'border-slate-300'}`} />
                  )}
                </div>

                {/* Receipt info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${textPrimary}`}>
                    {t('receipt')} {index + 1}
                  </p>
                  {state.status === 'ready' && state.result && (
                    <p className={`text-sm ${textSecondary}`}>
                      {state.result.merchant || t('unknown')} • {formatCurrencyFn(state.result.total || 0, currency)}
                    </p>
                  )}
                  {state.status === 'error' && state.error && (
                    <p className="text-sm text-red-500">{state.error}</p>
                  )}
                  {state.status === 'processing' && (
                    <p className={`text-sm ${textSecondary}`}>{t('analyzing')}...</p>
                  )}
                  {state.status === 'pending' && (
                    <p className={`text-sm ${textSecondary}`}>{t('waiting')}...</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cancel button during processing */}
          <div
            className={`px-4 py-4 ${headerBg} border-t ${borderColor}`}
            style={{ paddingBottom: 'calc(1rem + var(--safe-bottom, 0px))' }}
          >
            <button
              onClick={processingState.onCancelProcessing}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {t('cancel')}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Summary header (AC #5) */}
          <div className={`px-4 py-3 ${headerBg} border-b ${borderColor}`}>
            <div className="flex items-center justify-between">
              <span className={`text-base font-medium ${textPrimary}`}>
                {validCount} {t(validCount === 1 ? 'receipt' : 'receipts')} • {formattedTotal}{' '}
                {t('total')}
              </span>
              {reviewCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlertCircle size={12} />
                  {reviewCount} {t('batchNeedReview')}
                </span>
              )}
            </div>
          </div>

          {/* Receipt cards (AC #1, #2, #3, #8) */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            role="list"
            aria-label={t('batchReviewList')}
          >
            {isEmpty ? (
              <div className={`text-center py-8 ${textSecondary}`}>
                <p>{t('batchReviewEmpty')}</p>
              </div>
            ) : (
              receipts.map((receipt) => (
                <BatchSummaryCard
                  key={receipt.id}
                  receipt={receipt}
                  theme={theme}
                  currency={currency}
                  t={t}
                  onEdit={() => handleEdit(receipt)}
                  onDiscard={() => handleDiscard(receipt)}
                  onRetry={
                    receipt.status === 'error' && onRetryReceipt
                      ? () => handleRetry(receipt)
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Save all button (AC #6) - only show when not processing */}
      {!isEmpty && !processingState?.isProcessing && (
        <div
          className={`px-4 py-4 ${headerBg} border-t ${borderColor}`}
          style={{ paddingBottom: 'calc(1rem + var(--safe-bottom, 0px))' }}
        >
          <button
            onClick={handleSaveAll}
            disabled={isSaving || validCount === 0}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
              isSaving || validCount === 0
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            aria-label={t('batchSaveAll')}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('batchSaving')} ({saveProgress}/{validCount})
              </>
            ) : (
              <>
                <Save size={18} />
                {t('batchSaveAll')} ({validCount})
              </>
            )}
          </button>

          {/* Error count warning */}
          {errorCount > 0 && (
            <p className="mt-2 text-center text-sm text-amber-600 dark:text-amber-400">
              {t('batchErrorExcluded').replace('{count}', String(errorCount))}
            </p>
          )}
        </div>
      )}

      {/* Discard confirmation dialog */}
      {confirmDiscardId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          role="alertdialog"
          aria-labelledby="discard-dialog-title"
          aria-describedby="discard-dialog-desc"
        >
          <div
            className={`rounded-xl p-6 max-w-sm w-full shadow-xl ${
              isDark ? 'bg-slate-800' : 'bg-white'
            }`}
          >
            <h3
              id="discard-dialog-title"
              className={`text-lg font-bold mb-2 ${textPrimary}`}
            >
              {t('batchDiscardConfirmTitle')}
            </h3>
            <p id="discard-dialog-desc" className={`text-sm mb-6 ${textSecondary}`}>
              {t('batchDiscardConfirmMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDiscard}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                {t('batchDiscardConfirmYes')}
              </button>
              <button
                onClick={handleCancelDiscard}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchReviewView;
