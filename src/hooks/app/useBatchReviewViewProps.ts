/**
 * Story 14c-refactor.26: useBatchReviewViewProps Hook
 * Story 14c-refactor.32b: Hook Expansion - Returns ALL props required by BatchReviewView
 *
 * Composes all data props AND callbacks needed for BatchReviewView from App.tsx state.
 * This hook receives ALL data as options and does NOT call other hooks internally.
 *
 * Architecture:
 * - Navigation/dialog handlers come from ViewHandlersContext (story 14c-refactor.25)
 * - Data props AND batch-specific callbacks are composed by this hook
 * - BatchReviewView receives: spread props + useViewHandlers() for navigation/dialog
 *
 * Note: BatchReviewView also reads from ScanContext when available.
 * This hook composes the props that come from App.tsx state.
 *
 * @example
 * ```tsx
 * function App() {
 *   const batchProps = useBatchReviewViewProps({
 *     processingResults,
 *     imageDataUrls: scanImages,
 *     theme,
 *     currency,
 *     t,
 *     onEditReceipt: handleBatchEditReceipt,
 *     onSaveComplete: handleBatchSaveComplete,
 *     saveTransaction: handleBatchSaveTransaction,
 *     // ... all other data and callbacks
 *   });
 *
 *   return <BatchReviewView {...batchProps} />;
 * }
 * ```
 */

import { useMemo, useCallback } from 'react';
import type { ProcessingResult, ImageProcessingState } from '../../services/batchProcessingService';
import type { Currency } from '../../types/settings';
import type { Transaction } from '../../types/transaction';
import type { BatchReceipt } from '../useBatchReview';
import { formatCurrency } from '../../utils/currency';

// =============================================================================
// Types
// =============================================================================

/**
 * Processing state for batch progress display.
 * Story 14c-refactor.32b: Added onCancelProcessing callback.
 */
export interface ProcessingStateForProps {
    /** Whether processing is currently active */
    isProcessing: boolean;
    /** Processing progress */
    progress: { current: number; total: number };
    /** Individual image processing states */
    states: ImageProcessingState[];
    /** Called when user cancels processing */
    onCancelProcessing?: () => void;
}

/**
 * Credit info for batch review header
 */
export interface BatchCreditsForProps {
    /** Remaining normal credits */
    remaining: number;
    /** Remaining super credits */
    superRemaining: number;
}

/**
 * Props passed to useBatchReviewViewProps hook.
 * Story 14c-refactor.32b: Expanded to include ALL props required by BatchReviewView.
 * All data comes from App.tsx state - no internal hook calls.
 */
export interface UseBatchReviewViewPropsOptions {
    // Core data
    /** Processing results from batch scan */
    processingResults: ProcessingResult[];
    /** Original image data URLs */
    imageDataUrls: string[];

    // UI settings
    /** Theme for styling */
    theme: 'light' | 'dark';
    /** Currency for display */
    currency: Currency;
    /** Translation function */
    t: (key: string) => string;
    /** Optional format currency function (defaults to formatCurrency from utils) */
    formatCurrencyFn?: typeof formatCurrency;

    // Processing state
    /** Batch processing state */
    processingState?: ProcessingStateForProps;

    // Credits
    /** User credit balance */
    credits?: BatchCreditsForProps;

    // Callbacks - Story 14c-refactor.32b
    /** Called when user wants to edit a receipt */
    onEditReceipt: (receipt: BatchReceipt, batchIndex: number, batchTotal: number, allReceipts: BatchReceipt[]) => void;
    /** Called when receipt is updated from edit view */
    onReceiptUpdated?: (receiptId: string, transaction: Transaction) => void;
    /** Called when X button is pressed to cancel/discard all (shows confirmation) */
    onCancel?: () => void;
    /** Called when all receipts are saved successfully */
    onSaveComplete: (savedTransactionIds: string[], savedTransactions: Transaction[]) => void;
    /** Function to save a transaction to Firestore */
    saveTransaction: (transaction: Transaction) => Promise<string>;
    /** Called when user wants to retry a failed receipt */
    onRetryReceipt?: (receipt: BatchReceipt) => void;
}

/**
 * Props returned by useBatchReviewViewProps.
 * Story 14c-refactor.32b: Returns ALL props required by BatchReviewView.
 * Navigation/dialog handlers come from ViewHandlersContext (onBack, onCreditInfoClick).
 */
export interface BatchReviewViewDataProps {
    // Core data
    processingResults: ProcessingResult[];
    imageDataUrls: string[];

    // UI settings
    theme: 'light' | 'dark';
    currency: Currency;
    t: (key: string) => string;
    formatCurrencyFn: typeof formatCurrency;

    // Processing state
    processingState?: {
        isProcessing: boolean;
        progress: { current: number; total: number };
        states: ImageProcessingState[];
        onCancelProcessing?: () => void;
    };

    // Credits
    credits?: {
        remaining: number;
        superRemaining: number;
    };

    // Callbacks - Story 14c-refactor.32b
    /** Called when user wants to edit a receipt */
    onEditReceipt: (receipt: BatchReceipt, batchIndex: number, batchTotal: number, allReceipts: BatchReceipt[]) => void;
    /** Called when receipt is updated from edit view */
    onReceiptUpdated?: (receiptId: string, transaction: Transaction) => void;
    /** Called when X button is pressed to cancel/discard all (shows confirmation) */
    onCancel?: () => void;
    /** Called when all receipts are saved successfully */
    onSaveComplete: (savedTransactionIds: string[], savedTransactions: Transaction[]) => void;
    /** Function to save a transaction to Firestore */
    saveTransaction: (transaction: Transaction) => Promise<string>;
    /** Called when user wants to retry a failed receipt */
    onRetryReceipt?: (receipt: BatchReceipt) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useBatchReviewViewProps - Composes ALL props for BatchReviewView.
 * Story 14c-refactor.32b: Expanded to return ALL props required by BatchReviewView.
 *
 * CRITICAL: This hook does NOT call other hooks internally.
 * All data comes from the options parameter.
 *
 * Note: BatchReviewView also reads from ScanContext internally.
 * This hook only provides the props that App.tsx passes.
 * Navigation/dialog handlers come from ViewHandlersContext (onBack, onCreditInfoClick).
 *
 * @param options - All data and callbacks needed to compose props
 * @returns BatchReviewViewDataProps - All props for the view (except ViewHandlersContext handlers)
 */
export function useBatchReviewViewProps(
    options: UseBatchReviewViewPropsOptions
): BatchReviewViewDataProps {
    const {
        processingResults,
        imageDataUrls,
        theme,
        currency,
        t,
        formatCurrencyFn: formatCurrencyFnOption,
        processingState,
        credits,
        // Callbacks - Story 14c-refactor.32b
        onEditReceipt,
        onReceiptUpdated,
        onCancel,
        onSaveComplete,
        saveTransaction,
        onRetryReceipt,
    } = options;

    // Stable callback references using useCallback
    const stableOnEditReceipt = useCallback(
        (receipt: BatchReceipt, batchIndex: number, batchTotal: number, allReceipts: BatchReceipt[]) => {
            onEditReceipt(receipt, batchIndex, batchTotal, allReceipts);
        },
        [onEditReceipt]
    );

    const stableOnSaveComplete = useCallback(
        (savedTransactionIds: string[], savedTransactions: Transaction[]) => {
            onSaveComplete(savedTransactionIds, savedTransactions);
        },
        [onSaveComplete]
    );

    const stableSaveTransaction = useCallback(
        (transaction: Transaction) => saveTransaction(transaction),
        [saveTransaction]
    );

    return useMemo<BatchReviewViewDataProps>(
        () => ({
            // Core data
            processingResults,
            imageDataUrls,

            // UI settings
            theme,
            currency,
            t,
            formatCurrencyFn: formatCurrencyFnOption ?? formatCurrency,

            // Processing state
            processingState: processingState
                ? {
                    isProcessing: processingState.isProcessing,
                    progress: processingState.progress,
                    states: processingState.states,
                    onCancelProcessing: processingState.onCancelProcessing,
                }
                : undefined,

            // Credits
            credits: credits
                ? {
                    remaining: credits.remaining,
                    superRemaining: credits.superRemaining,
                }
                : undefined,

            // Callbacks - Story 14c-refactor.32b
            onEditReceipt: stableOnEditReceipt,
            onReceiptUpdated,
            onCancel,
            onSaveComplete: stableOnSaveComplete,
            saveTransaction: stableSaveTransaction,
            onRetryReceipt,
        }),
        [
            // Core data
            processingResults,
            imageDataUrls,

            // UI settings
            theme,
            currency,
            t,
            formatCurrencyFnOption,

            // Processing state - use explicit undefined fallback for stable deps
            processingState,
            processingState?.isProcessing,
            processingState?.progress,
            processingState?.states,
            processingState?.onCancelProcessing,

            // Credits - use explicit undefined fallback for stable deps
            credits,
            credits?.remaining,
            credits?.superRemaining,

            // Callbacks - Story 14c-refactor.32b
            stableOnEditReceipt,
            onReceiptUpdated,
            onCancel,
            stableOnSaveComplete,
            stableSaveTransaction,
            onRetryReceipt,
        ]
    );
}
