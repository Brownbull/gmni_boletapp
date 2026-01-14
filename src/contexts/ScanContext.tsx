/**
 * Story 14d.2: Scan Context Provider
 *
 * App-wide context provider that wraps the useScanStateMachine hook and exposes
 * scan functionality to all components. This enables any component to access
 * scan state and dispatch actions without prop drilling.
 *
 * Why App-Wide:
 * 1. Navigation guards need global awareness of scan state
 * 2. FAB needs to show scan state from any view
 * 3. Multiple views interact with scan state (dashboard, editor, batch views)
 *
 * Architecture Reference: docs/sprint-artifacts/epic14d/scan-request-lifecycle.md
 *
 * @example
 * ```tsx
 * // In any component
 * const { state, startSingleScan, isProcessing, canNavigateFreely } = useScan();
 *
 * // Start a scan (requires userId)
 * startSingleScan(user.uid);
 *
 * // Check if navigating away is safe
 * if (!canNavigateFreely) {
 *   showWarning();
 * }
 * ```
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useScanStateMachine } from '../hooks/useScanStateMachine';
import type {
  ScanState,
  ScanAction,
  ScanDialogType,
  ScanComputedValues,
  BatchReceipt,
} from '../types/scanStateMachine';
import type { Transaction } from '../types/transaction';

// =============================================================================
// Context Types
// =============================================================================

/**
 * Context value provided to consumers.
 *
 * Includes:
 * - state: Full state machine state
 * - Computed values from the hook
 * - Convenience action wrappers (memoized with useCallback)
 * - Raw dispatch for advanced usage
 */
export interface ScanContextValue extends ScanComputedValues {
  // State
  state: ScanState;

  // =========================================================================
  // Story 14d.5: Batch-specific computed values
  // =========================================================================

  /** True if in batch mode (mode === 'batch') */
  isBatchMode: boolean;

  /** True if batch is in capture phase */
  isBatchCapturing: boolean;

  /** True if batch is processing (scanning phase in batch mode) */
  isBatchProcessing: boolean;

  /** True if batch is in review phase */
  isBatchReviewing: boolean;

  /** Batch progress info (null if not in batch mode) */
  batchProgress: {
    current: number;
    total: number;
    completed: number;
    failed: number;
  } | null;

  // Convenience action wrappers
  /** Start a single receipt scan (requires userId) */
  startSingleScan: (userId: string) => void;

  /** Start a batch receipt scan (requires userId) */
  startBatchScan: (userId: string) => void;

  /** Start a statement scan (requires userId) - placeholder for future */
  startStatementScan: (userId: string) => void;

  /** Add an image to the current scan */
  addImage: (base64: string) => void;

  /** Remove an image by index */
  removeImage: (index: number) => void;

  /** Set all images at once */
  setImages: (images: string[]) => void;

  /** Set pre-scan store type option */
  setStoreType: (storeType: string) => void;

  /** Set pre-scan currency option */
  setCurrency: (currency: string) => void;

  /** Start processing images (reserve credits) */
  processStart: (creditType: 'normal' | 'super', creditsCount: number) => void;

  /** Mark processing as successful with results */
  processSuccess: (results: Transaction[]) => void;

  /** Mark processing as failed with error */
  processError: (error: string) => void;

  /** Show a dialog (pauses state machine) */
  showDialog: (type: ScanDialogType, data?: unknown) => void;

  /** Resolve a dialog with result */
  resolveDialog: (type: ScanDialogType, result: unknown) => void;

  /** Dismiss the current dialog without result */
  dismissDialog: () => void;

  /** Update a result at index */
  updateResult: (index: number, updates: Partial<Transaction>) => void;

  /** Set the active result index (for batch navigation) */
  setActiveResult: (index: number) => void;

  /** Start saving to Firestore */
  saveStart: () => void;

  /** Mark save as successful (resets state machine) */
  saveSuccess: () => void;

  /** Mark save as failed (returns to reviewing) */
  saveError: (error: string) => void;

  /** Mark batch item processing started */
  batchItemStart: (index: number) => void;

  /** Mark batch item as successfully processed */
  batchItemSuccess: (index: number, result: Transaction) => void;

  /** Mark batch item as failed */
  batchItemError: (index: number, error: string) => void;

  /** Complete batch processing (move to review)
   * Story 14d.5: Optionally accepts batchReceipts to set atomically with phase transition
   */
  batchComplete: (batchReceipts?: BatchReceipt[]) => void;

  // =========================================================================
  // Story 14d.5c: Batch Receipt Methods
  // =========================================================================

  /** Set all batch receipts after processing completes */
  setBatchReceipts: (receipts: BatchReceipt[]) => void;

  /** Update a single batch receipt (after editing) */
  updateBatchReceipt: (id: string, updates: Partial<BatchReceipt>) => void;

  /** Discard a batch receipt from the review queue */
  discardBatchReceipt: (id: string) => void;

  /** Clear all batch receipts (after save or cancel) */
  clearBatchReceipts: () => void;

  // =========================================================================
  // Story 14d.5d: Batch Editing Methods
  // =========================================================================

  /** Set the batch editing index (index of receipt being edited in TransactionEditorView) */
  setBatchEditingIndex: (index: number | null) => void;

  /** Cancel the current scan (loses data if credit spent) */
  cancel: () => void;

  /** Reset to initial state */
  reset: () => void;

  /** Restore state from persistence (for crash recovery) */
  restoreState: (state: Partial<ScanState>) => void;

  /** Manually refund credit (e.g., on offline detection) */
  refundCredit: () => void;

  // Raw dispatch for advanced usage
  dispatch: React.Dispatch<ScanAction>;
}

// =============================================================================
// Context Creation
// =============================================================================

/**
 * Scan Context - provides scan state and actions.
 *
 * IMPORTANT: Do not use useContext(ScanContext) directly.
 * Use the useScan() hook instead for proper error handling.
 */
const ScanContext = createContext<ScanContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface ScanProviderProps {
  children: React.ReactNode;
}

/**
 * Scan Context Provider.
 *
 * Wrap your app with this provider to enable scan functionality everywhere.
 * Should be placed inside AuthProvider but outside view components.
 *
 * @example
 * ```tsx
 * <QueryClientProvider>
 *   <AuthProvider>
 *     <ScanProvider>
 *       <App />
 *     </ScanProvider>
 *   </AuthProvider>
 * </QueryClientProvider>
 * ```
 */
export function ScanProvider({ children }: ScanProviderProps) {
  const {
    state,
    dispatch,
    // Computed values from hook
    hasActiveRequest,
    isProcessing,
    isIdle,
    hasError,
    hasDialog,
    isBlocking,
    creditSpent,
    canNavigateFreely,
    canSave,
    currentView,
    imageCount,
    resultCount,
  } = useScanStateMachine();

  // =========================================================================
  // Memoized Action Wrappers
  // =========================================================================

  const startSingleScan = useCallback(
    (userId: string) => {
      dispatch({ type: 'START_SINGLE', payload: { userId } });
    },
    [dispatch]
  );

  const startBatchScan = useCallback(
    (userId: string) => {
      dispatch({ type: 'START_BATCH', payload: { userId } });
    },
    [dispatch]
  );

  const startStatementScan = useCallback(
    (userId: string) => {
      dispatch({ type: 'START_STATEMENT', payload: { userId } });
    },
    [dispatch]
  );

  const addImage = useCallback(
    (base64: string) => {
      dispatch({ type: 'ADD_IMAGE', payload: { image: base64 } });
    },
    [dispatch]
  );

  const removeImage = useCallback(
    (index: number) => {
      dispatch({ type: 'REMOVE_IMAGE', payload: { index } });
    },
    [dispatch]
  );

  const setImages = useCallback(
    (images: string[]) => {
      dispatch({ type: 'SET_IMAGES', payload: { images } });
    },
    [dispatch]
  );

  const setStoreType = useCallback(
    (storeType: string) => {
      dispatch({ type: 'SET_STORE_TYPE', payload: { storeType } });
    },
    [dispatch]
  );

  const setCurrency = useCallback(
    (currency: string) => {
      dispatch({ type: 'SET_CURRENCY', payload: { currency } });
    },
    [dispatch]
  );

  const processStart = useCallback(
    (creditType: 'normal' | 'super', creditsCount: number) => {
      dispatch({ type: 'PROCESS_START', payload: { creditType, creditsCount } });
    },
    [dispatch]
  );

  const processSuccess = useCallback(
    (results: Transaction[]) => {
      dispatch({ type: 'PROCESS_SUCCESS', payload: { results } });
    },
    [dispatch]
  );

  const processError = useCallback(
    (error: string) => {
      dispatch({ type: 'PROCESS_ERROR', payload: { error } });
    },
    [dispatch]
  );

  const showDialog = useCallback(
    (type: ScanDialogType, data?: unknown) => {
      dispatch({ type: 'SHOW_DIALOG', payload: { type, data } });
    },
    [dispatch]
  );

  const resolveDialog = useCallback(
    (type: ScanDialogType, result: unknown) => {
      dispatch({ type: 'RESOLVE_DIALOG', payload: { type, result } });
    },
    [dispatch]
  );

  const dismissDialog = useCallback(() => {
    dispatch({ type: 'DISMISS_DIALOG' });
  }, [dispatch]);

  const updateResult = useCallback(
    (index: number, updates: Partial<Transaction>) => {
      dispatch({ type: 'UPDATE_RESULT', payload: { index, updates } });
    },
    [dispatch]
  );

  const setActiveResult = useCallback(
    (index: number) => {
      dispatch({ type: 'SET_ACTIVE_RESULT', payload: { index } });
    },
    [dispatch]
  );

  const saveStart = useCallback(() => {
    dispatch({ type: 'SAVE_START' });
  }, [dispatch]);

  const saveSuccess = useCallback(() => {
    dispatch({ type: 'SAVE_SUCCESS' });
  }, [dispatch]);

  const saveError = useCallback(
    (error: string) => {
      dispatch({ type: 'SAVE_ERROR', payload: { error } });
    },
    [dispatch]
  );

  const batchItemStart = useCallback(
    (index: number) => {
      dispatch({ type: 'BATCH_ITEM_START', payload: { index } });
    },
    [dispatch]
  );

  const batchItemSuccess = useCallback(
    (index: number, result: Transaction) => {
      dispatch({ type: 'BATCH_ITEM_SUCCESS', payload: { index, result } });
    },
    [dispatch]
  );

  const batchItemError = useCallback(
    (index: number, error: string) => {
      dispatch({ type: 'BATCH_ITEM_ERROR', payload: { index, error } });
    },
    [dispatch]
  );

  // Story 14d.5: Updated to accept optional batchReceipts for atomic state update
  const batchComplete = useCallback(
    (batchReceipts?: BatchReceipt[]) => {
      dispatch({
        type: 'BATCH_COMPLETE',
        payload: batchReceipts ? { batchReceipts } : undefined,
      });
    },
    [dispatch]
  );

  // =========================================================================
  // Story 14d.5c: Batch Receipt Action Wrappers
  // =========================================================================

  const setBatchReceipts = useCallback(
    (receipts: BatchReceipt[]) => {
      dispatch({ type: 'SET_BATCH_RECEIPTS', payload: { receipts } });
    },
    [dispatch]
  );

  const updateBatchReceipt = useCallback(
    (id: string, updates: Partial<BatchReceipt>) => {
      dispatch({ type: 'UPDATE_BATCH_RECEIPT', payload: { id, updates } });
    },
    [dispatch]
  );

  const discardBatchReceipt = useCallback(
    (id: string) => {
      dispatch({ type: 'DISCARD_BATCH_RECEIPT', payload: { id } });
    },
    [dispatch]
  );

  const clearBatchReceipts = useCallback(() => {
    dispatch({ type: 'CLEAR_BATCH_RECEIPTS' });
  }, [dispatch]);

  // =========================================================================
  // Story 14d.5d: Batch Editing Action Wrapper
  // =========================================================================

  const setBatchEditingIndex = useCallback(
    (index: number | null) => {
      dispatch({ type: 'SET_BATCH_EDITING_INDEX', payload: { index } });
    },
    [dispatch]
  );

  const cancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const restoreState = useCallback(
    (restoredState: Partial<ScanState>) => {
      dispatch({ type: 'RESTORE_STATE', payload: { state: restoredState } });
    },
    [dispatch]
  );

  const refundCredit = useCallback(() => {
    dispatch({ type: 'REFUND_CREDIT' });
  }, [dispatch]);

  // =========================================================================
  // Story 14d.5: Batch-specific computed values
  // =========================================================================

  const isBatchMode = state.mode === 'batch';
  const isBatchCapturing = isBatchMode && state.phase === 'capturing';
  const isBatchProcessing = isBatchMode && state.phase === 'scanning';
  const isBatchReviewing = isBatchMode && state.phase === 'reviewing';

  const batchProgress = useMemo(() => {
    if (!state.batchProgress) return null;
    return {
      current: state.batchProgress.current,
      total: state.batchProgress.total,
      completed: state.batchProgress.completed.length,
      failed: state.batchProgress.failed.length,
    };
  }, [state.batchProgress]);

  // =========================================================================
  // Memoized Context Value
  // =========================================================================

  const value = useMemo<ScanContextValue>(
    () => ({
      // State
      state,

      // Story 14d.5: Batch computed values
      isBatchMode,
      isBatchCapturing,
      isBatchProcessing,
      isBatchReviewing,
      batchProgress,

      // Computed values
      hasActiveRequest,
      isProcessing,
      isIdle,
      hasError,
      hasDialog,
      isBlocking,
      creditSpent,
      canNavigateFreely,
      canSave,
      currentView,
      imageCount,
      resultCount,

      // Action wrappers
      startSingleScan,
      startBatchScan,
      startStatementScan,
      addImage,
      removeImage,
      setImages,
      setStoreType,
      setCurrency,
      processStart,
      processSuccess,
      processError,
      showDialog,
      resolveDialog,
      dismissDialog,
      updateResult,
      setActiveResult,
      saveStart,
      saveSuccess,
      saveError,
      batchItemStart,
      batchItemSuccess,
      batchItemError,
      batchComplete,
      // Story 14d.5c: Batch receipt methods
      setBatchReceipts,
      updateBatchReceipt,
      discardBatchReceipt,
      clearBatchReceipts,
      // Story 14d.5d: Batch editing method
      setBatchEditingIndex,
      cancel,
      reset,
      restoreState,
      refundCredit,

      // Raw dispatch
      dispatch,
    }),
    [
      state,
      // Story 14d.5: Batch computed values
      isBatchMode,
      isBatchCapturing,
      isBatchProcessing,
      isBatchReviewing,
      batchProgress,
      // Standard computed values
      hasActiveRequest,
      isProcessing,
      isIdle,
      hasError,
      hasDialog,
      isBlocking,
      creditSpent,
      canNavigateFreely,
      canSave,
      currentView,
      imageCount,
      resultCount,
      startSingleScan,
      startBatchScan,
      startStatementScan,
      addImage,
      removeImage,
      setImages,
      setStoreType,
      setCurrency,
      processStart,
      processSuccess,
      processError,
      showDialog,
      resolveDialog,
      dismissDialog,
      updateResult,
      setActiveResult,
      saveStart,
      saveSuccess,
      saveError,
      batchItemStart,
      batchItemSuccess,
      batchItemError,
      batchComplete,
      // Story 14d.5c: Batch receipt methods
      setBatchReceipts,
      updateBatchReceipt,
      discardBatchReceipt,
      clearBatchReceipts,
      // Story 14d.5d: Batch editing method
      setBatchEditingIndex,
      cancel,
      reset,
      restoreState,
      refundCredit,
      dispatch,
    ]
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

// =============================================================================
// Consumer Hooks
// =============================================================================

/**
 * Access scan context - throws if outside provider.
 *
 * Use this hook in components that REQUIRE scan functionality.
 *
 * @throws Error if used outside ScanProvider
 *
 * @example
 * ```tsx
 * function ScanButton() {
 *   const { startSingleScan, isProcessing } = useScan();
 *
 *   return (
 *     <button onClick={() => startSingleScan('user123')} disabled={isProcessing}>
 *       Scan
 *     </button>
 *   );
 * }
 * ```
 */
export function useScan(): ScanContextValue {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
}

/**
 * Access scan context - returns null if outside provider.
 *
 * Use this hook in components that OPTIONALLY use scan functionality,
 * such as layout components that may be rendered before auth.
 *
 * @example
 * ```tsx
 * function NavBar() {
 *   const scan = useScanOptional();
 *
 *   // Only show scan status if context is available
 *   if (scan?.isProcessing) {
 *     return <LoadingIndicator />;
 *   }
 *
 *   return <Nav />;
 * }
 * ```
 */
export function useScanOptional(): ScanContextValue | null {
  return useContext(ScanContext);
}

// =============================================================================
// Re-exports
// =============================================================================

// Re-export types that consumers might need
export type { ScanState, ScanAction, ScanDialogType } from '../types/scanStateMachine';
