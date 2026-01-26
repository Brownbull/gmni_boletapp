/**
 * Story 14e-16: BatchReviewFeature Orchestrator Component
 *
 * Orchestrates all batch review rendering based on Zustand store phase.
 * This is the single entry point for batch review functionality in App.tsx.
 *
 * Phase → Component Mapping:
 * - idle: returns null (not visible)
 * - loading: ProcessingState (loading progress)
 * - reviewing: Full review UI (header, summary, cards, save all)
 * - editing: Full review UI (edit mode active)
 * - saving: Full review UI (save-in-progress indicator)
 * - complete: CompleteState (success message with auto-transition)
 * - error: ErrorState (error display with retry option)
 *
 * Layout matches production BatchReviewView:
 * - Header with back button, title "Resultado", batch icon, credit badges, X close
 * - Summary card showing receipt count and total
 * - Scrollable list of BatchReviewCard components
 * - Fixed "Guardar Todo" button at bottom
 * - Discard confirmation via ModalManager (AC6 compliant)
 *
 * @see docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-16-batch-review-feature-orchestrator.md
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Loader2,
  ChevronLeft,
  X,
  Layers,
  Zap,
  Camera,
  Info,
  Save,
} from 'lucide-react';
import { formatCreditsDisplay } from '@/services/userCreditsService';

// ModalManager integration (AC6)
import { useModalActions } from '@managers/ModalManager';

// Store selectors and actions (AC3)
import {
  useBatchReviewPhase,
  useBatchItems,
  useBatchProgress,
  useIsBatchEmpty,
  useBatchTotalAmount,
  useValidBatchCount,
  useBatchReviewActions,
  useHadItems,
} from './store';

// State components (AC1, AC5) - extracted to states/ folder (Story 14e-16)
import {
  ProcessingState,
  ReviewingState,
  EmptyState,
  LoadingState,
  CompleteState,
  ErrorState,
} from './components/states';

// Types
import type { Currency } from '@/types/settings';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { ImageProcessingState } from './components';

// =============================================================================
// Types
// =============================================================================

/** Credit information for header display */
export interface BatchReviewCredits {
  /** Remaining normal scan credits */
  remaining: number;
  /** Remaining super credits */
  superRemaining: number;
}

/**
 * Props for BatchReviewFeature orchestrator.
 */
export interface BatchReviewFeatureProps {
  /** Translation function */
  t: (key: string) => string;
  /** Current theme */
  theme: 'light' | 'dark';
  /** Display currency */
  currency: Currency;
  /** Format currency function */
  formatCurrency: (amount: number, currency: string) => string;

  // ==========================================================================
  // Header props
  // ==========================================================================
  /** Credit information for header display */
  credits?: BatchReviewCredits;
  /** Called when credit badges are clicked */
  onCreditInfoClick?: () => void;

  // ==========================================================================
  // Optional: Processing state for 'loading' phase (AC5)
  // ==========================================================================
  /** Processing states for progress indicator (optional - for loading phase) */
  processingStates?: ImageProcessingState[];
  /** Processing progress override (optional - for loading phase) */
  processingProgress?: { current: number; total: number };
  /** Cancel processing callback (optional) */
  onCancelProcessing?: () => void;

  // ==========================================================================
  // Callbacks (AC4 - from handlers module)
  // ==========================================================================
  /** Called when user wants to edit a receipt */
  onEditReceipt: (receipt: BatchReceipt) => void;
  /** Called when save operation needs to be performed on a single receipt */
  onSaveReceipt?: (receiptId: string) => Promise<void>;
  /** Called to save all valid receipts */
  onSaveAll?: () => Promise<void>;
  /** Called when all receipts are saved and batch is complete */
  onSaveComplete?: () => void;
  /** Called when user wants to go back/cancel */
  onBack?: () => void;
  /** Called when user wants to retry a failed receipt */
  onRetryReceipt?: (receipt: BatchReceipt) => void;
  /** Called when user discards a receipt - used to sync scan store */
  onDiscardReceipt?: (receiptId: string) => void;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * BatchReviewFeature Orchestrator Component
 *
 * Reads phase from Zustand batch review store and renders appropriate UI.
 * This is the single entry point for all batch review rendering.
 */
export function BatchReviewFeature({
  t,
  theme,
  currency,
  formatCurrency,
  credits,
  onCreditInfoClick,
  processingStates,
  processingProgress,
  onCancelProcessing,
  onEditReceipt,
  onSaveReceipt,
  onSaveAll,
  onSaveComplete,
  onBack,
  onRetryReceipt,
  onDiscardReceipt,
}: BatchReviewFeatureProps): React.ReactElement | null {
  // ==========================================================================
  // Store selectors (AC3)
  // ==========================================================================
  const phase = useBatchReviewPhase();
  const items = useBatchItems();
  const progress = useBatchProgress();
  const isEmpty = useIsBatchEmpty();
  const totalAmount = useBatchTotalAmount();
  const validCount = useValidBatchCount();
  const { reset, discardItem } = useBatchReviewActions();
  const hadItems = useHadItems();

  // ==========================================================================
  // Modal Manager (AC6)
  // ==========================================================================
  const { openModal, closeModal } = useModalActions();

  // ==========================================================================
  // Local State
  // ==========================================================================
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  // Track pending discard for confirmation callback
  const pendingDiscardIdRef = useRef<string | null>(null);

  // ==========================================================================
  // Effects
  // ==========================================================================

  /**
   * Story 14e-16: Auto-complete when batch becomes empty after saves.
   * When all items are saved (from menu or edit mode), automatically
   * trigger completion instead of showing empty state.
   * Uses store's hadItems flag which persists across component remounts.
   */
  useEffect(() => {
    // If we're in reviewing phase, had items before, and now empty -> auto-complete
    if (phase === 'reviewing' && hadItems && isEmpty && onSaveComplete) {
      onSaveComplete();
    }
  }, [phase, isEmpty, hadItems, onSaveComplete]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  /**
   * Handle discard receipt click (AC6: ModalManager integration).
   * Shows confirmation for high confidence receipts using ModalManager.
   */
  const handleDiscardReceipt = useCallback(
    (receipt: BatchReceipt) => {
      // High confidence receipts need confirmation via ModalManager
      if (receipt.confidence >= 0.85 && receipt.status !== 'error') {
        pendingDiscardIdRef.current = receipt.id;
        openModal('batchDiscard', {
          receiptId: receipt.id,
          onConfirm: () => {
            const receiptId = pendingDiscardIdRef.current;
            if (receiptId) {
              discardItem(receiptId);
              onDiscardReceipt?.(receiptId);
              pendingDiscardIdRef.current = null;
            }
            closeModal();
          },
          onCancel: () => {
            pendingDiscardIdRef.current = null;
            closeModal();
          },
          t,
          theme,
        });
      } else {
        // Low confidence or error receipts can be discarded directly
        discardItem(receipt.id);
        // Sync with scan store
        onDiscardReceipt?.(receipt.id);
      }
    },
    [discardItem, onDiscardReceipt, openModal, closeModal, t, theme]
  );

  /**
   * Handle back button click (chevron left).
   */
  const handleBackClick = useCallback(() => {
    onBack?.();
  }, [onBack]);

  /**
   * Handle close button click (X) (AC6: ModalManager integration).
   * Shows cancel confirmation if there are unsaved receipts using ModalManager.
   */
  const handleCloseClick = useCallback(() => {
    if (items.length > 0) {
      openModal('batchDiscard', {
        unsavedCount: items.length,
        onConfirm: () => {
          closeModal();
          reset();
          onBack?.();
        },
        onCancel: closeModal,
        t,
        theme,
      });
    } else {
      reset();
      onBack?.();
    }
  }, [items.length, reset, onBack, openModal, closeModal, t, theme]);

  /**
   * Handle Save All button click.
   */
  const handleSaveAll = useCallback(async () => {
    if (!onSaveAll || isSaving) return;
    setIsSaving(true);
    setSaveProgress(0);
    try {
      await onSaveAll();
    } finally {
      setIsSaving(false);
    }
  }, [onSaveAll, isSaving]);

  /**
   * Handle save complete - reset store and notify parent.
   */
  const handleSaveComplete = useCallback(() => {
    reset();
    onSaveComplete?.();
  }, [reset, onSaveComplete]);

  /**
   * Handle retry all after error.
   */
  const handleRetryAll = useCallback(() => {
    reset();
  }, [reset]);

  /**
   * Handle back/dismiss from error state.
   */
  const handleErrorDismiss = useCallback(() => {
    reset();
    onBack?.();
  }, [reset, onBack]);

  // Format total for display
  const formattedTotal = formatCurrency(totalAmount, currency);

  // ==========================================================================
  // Phase-based rendering (AC1, AC7)
  // ==========================================================================

  switch (phase) {
    // -------------------------------------------------------------------------
    // IDLE: No active batch review (AC7)
    // -------------------------------------------------------------------------
    case 'idle':
      return null;

    // -------------------------------------------------------------------------
    // LOADING: Preparing batch receipts (AC5)
    // -------------------------------------------------------------------------
    case 'loading':
      // If we have processing states, show the ProcessingState component
      if (processingStates && processingStates.length > 0) {
        return (
          <ProcessingState
            t={t}
            theme={theme}
            states={processingStates}
            formatCurrency={formatCurrency}
            currency={currency}
            onCancel={onCancelProcessing}
            progress={processingProgress}
          />
        );
      }
      // Otherwise show simple loading state
      return <LoadingState t={t} theme={theme} />;

    // -------------------------------------------------------------------------
    // REVIEWING / EDITING / SAVING: Main review UI (AC1, AC3)
    // -------------------------------------------------------------------------
    case 'reviewing':
    case 'editing':
    case 'saving':
      return (
        <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg)' }}>
          {/* Header - Matches BatchReviewView */}
          <div
            className="sticky px-4"
            style={{
              top: 0,
              zIndex: 50,
              backgroundColor: 'var(--bg)',
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                height: '72px',
                paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
              }}
            >
              {/* Left side: Back button + Title + Batch icon */}
              <div className="flex items-center gap-0">
                <button
                  onClick={handleBackClick}
                  className="min-w-10 min-h-10 flex items-center justify-center -ml-1"
                  aria-label={t('back')}
                  style={{ color: 'var(--text-primary)' }}
                  disabled={isSaving}
                >
                  <ChevronLeft size={28} strokeWidth={2.5} />
                </button>
                <h1
                  className="font-semibold whitespace-nowrap"
                  style={{
                    fontFamily: 'var(--font-family)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '20px',
                  }}
                >
                  {t('batchResult')}
                </h1>
                {/* Batch mode indicator icon */}
                <Layers
                  size={20}
                  strokeWidth={2}
                  className="ml-2 flex-shrink-0"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>

              {/* Right side: Credit badges + Close button */}
              <div className="flex items-center gap-2">
                {/* Credit badges */}
                {credits && (
                  <button
                    onClick={onCreditInfoClick}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all active:scale-95"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                    }}
                    aria-label={t('creditInfo')}
                  >
                    <div
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                    >
                      <Zap size={10} strokeWidth={2.5} />
                      <span>{formatCreditsDisplay(credits.superRemaining)}</span>
                    </div>
                    <div
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
                    >
                      <Camera size={10} strokeWidth={2.5} />
                      <span>{formatCreditsDisplay(credits.remaining)}</span>
                    </div>
                    <Info size={12} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                )}
                {/* Close button - triggers cancel confirmation */}
                <button
                  onClick={handleCloseClick}
                  className="min-w-10 min-h-10 flex items-center justify-center"
                  aria-label={t('cancel')}
                  style={{ color: 'var(--text-primary)' }}
                  disabled={isSaving}
                >
                  <X size={24} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {/* Main content area with padding for save button */}
          <div className="flex-1 overflow-y-auto px-3 pb-32">
            {/* Summary card */}
            <div
              className="rounded-2xl p-4 mb-3"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--border-light)',
              }}
            >
              <div className="flex items-center justify-between">
                {/* Left: Receipt count */}
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                    {validCount} {t(validCount === 1 ? 'receipt' : 'receipts')}
                  </span>
                </div>
                {/* Right: Total */}
                <div className="text-right">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t('total')}
                  </span>
                  <span
                    className="ml-2 text-base font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formattedTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt cards list */}
            {isEmpty ? (
              <EmptyState t={t} theme={theme} />
            ) : (
              <ReviewingState
                receipts={items}
                theme={theme}
                currency={currency}
                t={t}
                onSaveReceipt={onSaveReceipt}
                onEditReceipt={onEditReceipt}
                onDiscardReceipt={handleDiscardReceipt}
                onRetryReceipt={onRetryReceipt}
              />
            )}
          </div>

          {/* Save All button - fixed at bottom */}
          {!isEmpty && (
            <div
              className="px-4 py-4"
              style={{
                backgroundColor: 'var(--bg)',
                paddingBottom: 'calc(80px + var(--safe-bottom, 0px))',
              }}
            >
              <button
                onClick={handleSaveAll}
                disabled={isSaving || validCount === 0}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--primary)',
                  cursor: isSaving || validCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: isSaving || validCount === 0 ? 0.7 : 1,
                }}
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
            </div>
          )}

          {/* AC6: Discard confirmations now handled by ModalManager */}
        </div>
      );

    // -------------------------------------------------------------------------
    // COMPLETE: All receipts saved (auto-dismiss)
    // -------------------------------------------------------------------------
    case 'complete':
      return (
        <CompleteState
          t={t}
          theme={theme}
          savedCount={progress.saved}
          failedCount={progress.failed}
          onDismiss={handleSaveComplete}
        />
      );

    // -------------------------------------------------------------------------
    // ERROR: Fatal error during batch review
    // -------------------------------------------------------------------------
    case 'error':
      return (
        <ErrorState
          t={t}
          theme={theme}
          onRetry={handleRetryAll}
          onDismiss={handleErrorDismiss}
        />
      );

    // -------------------------------------------------------------------------
    // Default: Unknown phase - render nothing
    // -------------------------------------------------------------------------
    default:
      return null;
  }
}

export default BatchReviewFeature;
