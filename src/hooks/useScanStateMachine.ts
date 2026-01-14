/**
 * Story 14d.1: Scan State Machine Hook
 *
 * Core state machine hook using useReducer pattern that manages all scan-related
 * state transitions. This is the foundation for the Epic 14d refactor.
 *
 * Architecture Reference: docs/sprint-artifacts/epic14d/scan-request-lifecycle.md
 *
 * Key Features:
 * - Single source of truth for all scan state
 * - Explicit state transitions (no invalid states possible)
 * - Credit lifecycle tracking (none → reserved → confirmed/refunded)
 * - Batch mode support with progress tracking
 * - Persistence-ready state shape
 *
 * Usage:
 *   const { state, dispatch, hasActiveRequest, canSave, ... } = useScanStateMachine();
 *
 * Note: This hook is PURE - no side effects. Side effects (API calls, persistence)
 * are handled in ScanContext (Story 14d.2).
 */

import { useReducer, useMemo } from 'react';
import type {
  ScanState,
  ScanAction,
  ScanComputedValues,
  ScanCurrentView,
  UseScanStateMachineReturn,
} from '../types/scanStateMachine';
import { generateRequestId, canSaveTransaction } from '../types/scanStateMachine';

// =============================================================================
// Initial State
// =============================================================================

/**
 * Initial idle state for the scan state machine.
 */
export const initialScanState: ScanState = {
  // Core state
  phase: 'idle',
  mode: 'single',

  // Request identity
  requestId: null,
  userId: null,
  startedAt: null,

  // Image data
  images: [],

  // Results
  results: [],
  activeResultIndex: 0,

  // Credit tracking
  creditStatus: 'none',
  creditType: null,
  creditsCount: 0,

  // Dialog state
  activeDialog: null,

  // Error state
  error: null,

  // Batch mode
  batchProgress: null,
  batchReceipts: null, // Story 14d.5c
  batchEditingIndex: null, // Story 14d.5d

  // Pre-scan options
  storeType: null,
  currency: null,
};

// =============================================================================
// Reducer
// =============================================================================

/**
 * Pure reducer function for scan state machine.
 * All state transitions are explicit and validated.
 */
export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    // =========================================================================
    // Start Actions - Begin a new scan request
    // =========================================================================

    case 'START_SINGLE': {
      // Only allow starting from idle (Request Precedence rule)
      if (state.phase !== 'idle') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot start new scan - request in progress');
        }
        return state;
      }
      return {
        ...initialScanState,
        phase: 'capturing',
        mode: 'single',
        requestId: generateRequestId(),
        userId: action.payload.userId,
        startedAt: Date.now(),
      };
    }

    case 'START_BATCH': {
      if (state.phase !== 'idle') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot start new scan - request in progress');
        }
        return state;
      }
      return {
        ...initialScanState,
        phase: 'capturing',
        mode: 'batch',
        requestId: generateRequestId(),
        userId: action.payload.userId,
        startedAt: Date.now(),
        batchProgress: {
          current: 0,
          total: 0,
          completed: [],
          failed: [],
        },
      };
    }

    case 'START_STATEMENT': {
      if (state.phase !== 'idle') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot start new scan - request in progress');
        }
        return state;
      }
      return {
        ...initialScanState,
        phase: 'capturing',
        mode: 'statement',
        requestId: generateRequestId(),
        userId: action.payload.userId,
        startedAt: Date.now(),
      };
    }

    // =========================================================================
    // Image Actions - Manage images during capturing phase
    // =========================================================================

    case 'ADD_IMAGE': {
      if (state.phase !== 'capturing') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot add image - not in capturing phase');
        }
        return state;
      }
      const newImages = [...state.images, action.payload.image];

      // Update batch progress total if in batch mode
      let batchProgress = state.batchProgress;
      if (state.mode === 'batch' && batchProgress) {
        batchProgress = {
          ...batchProgress,
          total: newImages.length,
        };
      }

      return {
        ...state,
        images: newImages,
        batchProgress,
      };
    }

    case 'REMOVE_IMAGE': {
      if (state.phase !== 'capturing') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot remove image - not in capturing phase');
        }
        return state;
      }
      const filteredImages = state.images.filter((_, i) => i !== action.payload.index);

      // Update batch progress total if in batch mode
      let batchProgress = state.batchProgress;
      if (state.mode === 'batch' && batchProgress) {
        batchProgress = {
          ...batchProgress,
          total: filteredImages.length,
        };
      }

      return {
        ...state,
        images: filteredImages,
        batchProgress,
      };
    }

    case 'SET_IMAGES': {
      if (state.phase !== 'capturing') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] SET_IMAGES ignored - phase:', state.phase, 'mode:', state.mode, '(expected: capturing)');
        }
        return state;
      }

      // Update batch progress total if in batch mode
      let batchProgress = state.batchProgress;
      if (state.mode === 'batch' && batchProgress) {
        batchProgress = {
          ...batchProgress,
          total: action.payload.images.length,
        };
      }

      return {
        ...state,
        images: action.payload.images,
        batchProgress,
      };
    }

    // =========================================================================
    // Pre-scan Options
    // =========================================================================

    case 'SET_STORE_TYPE': {
      if (state.phase !== 'capturing') {
        return state;
      }
      return {
        ...state,
        storeType: action.payload.storeType,
      };
    }

    case 'SET_CURRENCY': {
      if (state.phase !== 'capturing') {
        return state;
      }
      return {
        ...state,
        currency: action.payload.currency,
      };
    }

    // =========================================================================
    // Process Actions - Handle API processing
    // =========================================================================

    case 'PROCESS_START': {
      if (state.phase !== 'capturing') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] PROCESS_START ignored - phase:', state.phase, 'mode:', state.mode, '(expected: capturing)');
        }
        return state;
      }
      if (state.images.length === 0) {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] PROCESS_START ignored - no images in state');
        }
        return state;
      }
      return {
        ...state,
        phase: 'scanning',
        creditStatus: 'reserved',
        creditType: action.payload.creditType,
        creditsCount: action.payload.creditsCount,
        error: null,
      };
    }

    case 'PROCESS_SUCCESS': {
      if (state.phase !== 'scanning') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot complete processing - not in scanning phase');
        }
        return state;
      }
      return {
        ...state,
        phase: 'reviewing',
        creditStatus: 'confirmed',
        results: action.payload.results,
        activeResultIndex: 0,
        error: null,
      };
    }

    case 'PROCESS_ERROR': {
      if (state.phase !== 'scanning') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot set error - not in scanning phase');
        }
        return state;
      }
      return {
        ...state,
        phase: 'error',
        creditStatus: 'refunded', // Credit is refunded on API failure
        error: action.payload.error,
      };
    }

    // =========================================================================
    // Dialog Actions
    // =========================================================================

    case 'SHOW_DIALOG': {
      return {
        ...state,
        activeDialog: {
          type: action.payload.type,
          data: action.payload.data,
        },
      };
    }

    case 'RESOLVE_DIALOG': {
      if (!state.activeDialog || state.activeDialog.type !== action.payload.type) {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot resolve dialog - type mismatch');
        }
        return state;
      }
      return {
        ...state,
        activeDialog: null,
      };
    }

    case 'DISMISS_DIALOG': {
      return {
        ...state,
        activeDialog: null,
      };
    }

    // =========================================================================
    // Result Actions
    // =========================================================================

    case 'UPDATE_RESULT': {
      if (state.phase !== 'reviewing') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot update result - not in reviewing phase');
        }
        return state;
      }
      const { index, updates } = action.payload;
      if (index < 0 || index >= state.results.length) {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Invalid result index');
        }
        return state;
      }
      const newResults = [...state.results];
      newResults[index] = { ...newResults[index], ...updates };
      return {
        ...state,
        results: newResults,
      };
    }

    case 'SET_ACTIVE_RESULT': {
      if (state.phase !== 'reviewing') {
        return state;
      }
      const { index } = action.payload;
      if (index < 0 || index >= state.results.length) {
        return state;
      }
      return {
        ...state,
        activeResultIndex: index,
      };
    }

    // =========================================================================
    // Save Actions
    // =========================================================================

    case 'SAVE_START': {
      if (state.phase !== 'reviewing') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot save - not in reviewing phase');
        }
        return state;
      }
      return {
        ...state,
        phase: 'saving',
      };
    }

    case 'SAVE_SUCCESS': {
      if (state.phase !== 'saving') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot complete save - not in saving phase');
        }
        return state;
      }
      // Reset to idle after successful save
      return { ...initialScanState };
    }

    case 'SAVE_ERROR': {
      if (state.phase !== 'saving') {
        return state;
      }
      // Go back to reviewing so user can retry
      return {
        ...state,
        phase: 'reviewing',
        error: action.payload.error,
      };
    }

    // =========================================================================
    // Batch Actions
    // =========================================================================

    case 'BATCH_ITEM_START': {
      if (state.phase !== 'scanning' || state.mode !== 'batch') {
        return state;
      }
      if (!state.batchProgress) {
        return state;
      }
      return {
        ...state,
        batchProgress: {
          ...state.batchProgress,
          current: action.payload.index,
        },
      };
    }

    case 'BATCH_ITEM_SUCCESS': {
      if (state.phase !== 'scanning' || state.mode !== 'batch') {
        return state;
      }
      if (!state.batchProgress) {
        return state;
      }
      return {
        ...state,
        batchProgress: {
          ...state.batchProgress,
          completed: [...state.batchProgress.completed, action.payload.result],
        },
      };
    }

    case 'BATCH_ITEM_ERROR': {
      if (state.phase !== 'scanning' || state.mode !== 'batch') {
        return state;
      }
      if (!state.batchProgress) {
        return state;
      }
      return {
        ...state,
        batchProgress: {
          ...state.batchProgress,
          failed: [
            ...state.batchProgress.failed,
            { index: action.payload.index, error: action.payload.error },
          ],
        },
      };
    }

    case 'BATCH_COMPLETE': {
      if (state.phase !== 'scanning' || state.mode !== 'batch') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] BATCH_COMPLETE ignored - phase:', state.phase, 'mode:', state.mode, '(expected: scanning, batch)');
        }
        return state;
      }
      if (!state.batchProgress) {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] BATCH_COMPLETE ignored - no batchProgress');
        }
        return state;
      }
      // Move to reviewing with all completed results
      // Story 14d.5: Accept optional batchReceipts payload to set atomically with phase transition
      // This fixes race condition where re-render happened before setBatchReceipts was called
      return {
        ...state,
        phase: 'reviewing',
        creditStatus: 'confirmed',
        results: state.batchProgress.completed,
        error: null,
        // If batchReceipts payload provided, set it atomically with phase transition
        batchReceipts: action.payload?.batchReceipts ?? state.batchReceipts,
      };
    }

    // =========================================================================
    // Story 14d.5c: Batch Receipt Actions
    // =========================================================================

    case 'SET_BATCH_RECEIPTS': {
      if (state.phase !== 'reviewing' || state.mode !== 'batch') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot set batch receipts - not in batch reviewing phase');
        }
        return state;
      }
      return {
        ...state,
        batchReceipts: action.payload.receipts,
      };
    }

    case 'UPDATE_BATCH_RECEIPT': {
      if (state.phase !== 'reviewing' || state.mode !== 'batch') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot update batch receipt - not in batch reviewing phase');
        }
        return state;
      }
      if (!state.batchReceipts) {
        return state;
      }
      const { id, updates } = action.payload;
      const receiptIndex = state.batchReceipts.findIndex((r) => r.id === id);
      if (receiptIndex === -1) {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot update batch receipt - receipt not found:', id);
        }
        return state;
      }
      const newReceipts = [...state.batchReceipts];
      newReceipts[receiptIndex] = { ...newReceipts[receiptIndex], ...updates };
      return {
        ...state,
        batchReceipts: newReceipts,
      };
    }

    case 'DISCARD_BATCH_RECEIPT': {
      if (state.phase !== 'reviewing' || state.mode !== 'batch') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot discard batch receipt - not in batch reviewing phase');
        }
        return state;
      }
      if (!state.batchReceipts) {
        return state;
      }
      return {
        ...state,
        batchReceipts: state.batchReceipts.filter((r) => r.id !== action.payload.id),
      };
    }

    case 'CLEAR_BATCH_RECEIPTS': {
      return {
        ...state,
        batchReceipts: null,
      };
    }

    // =========================================================================
    // Story 14d.5d: Batch Editing Actions
    // =========================================================================

    case 'SET_BATCH_EDITING_INDEX': {
      // Can set editing index when in batch reviewing phase
      // Also allow setting to null to clear editing state from any phase
      if (action.payload.index === null) {
        return {
          ...state,
          batchEditingIndex: null,
        };
      }
      // Setting a non-null index requires batch reviewing phase
      if (state.phase !== 'reviewing' || state.mode !== 'batch') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] SET_BATCH_EDITING_INDEX ignored - phase:', state.phase, 'mode:', state.mode, '(expected: reviewing, batch)');
        }
        return state;
      }
      // Validate index is within bounds
      if (!state.batchReceipts || action.payload.index < 0 || action.payload.index >= state.batchReceipts.length) {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Invalid batch editing index:', action.payload.index);
        }
        return state;
      }
      return {
        ...state,
        batchEditingIndex: action.payload.index,
      };
    }

    // =========================================================================
    // Control Actions
    // =========================================================================

    case 'CANCEL': {
      // Can cancel from any phase except saving
      if (state.phase === 'saving') {
        if (import.meta.env.DEV) {
          console.warn('[ScanStateMachine] Cannot cancel during save');
        }
        return state;
      }
      // Note: The caller should show a warning dialog if creditStatus === 'confirmed'
      // before dispatching CANCEL. This reducer doesn't handle that UX.
      return { ...initialScanState };
    }

    case 'RESET': {
      return { ...initialScanState };
    }

    // =========================================================================
    // Recovery Actions
    // =========================================================================

    case 'RESTORE_STATE': {
      // Restore state from persistence (Story 14d.10)
      // Validate the restored state
      const restored = action.payload.state;

      // If restored state was in 'scanning' phase, it was interrupted
      // Transition to error with refunded credit per lifecycle spec
      if (restored.phase === 'scanning') {
        return {
          ...initialScanState,
          ...restored,
          phase: 'error',
          creditStatus: 'refunded',
          error: 'Escaneo interrumpido. Intenta de nuevo.',
        };
      }

      return {
        ...initialScanState,
        ...restored,
      };
    }

    case 'REFUND_CREDIT': {
      // Manually trigger credit refund (e.g., on offline detection)
      if (state.creditStatus !== 'reserved') {
        return state;
      }
      return {
        ...state,
        creditStatus: 'refunded',
      };
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = action;
      if (import.meta.env.DEV) {
        console.warn('[ScanStateMachine] Unknown action:', _exhaustive);
      }
      return state;
    }
  }
}

// =============================================================================
// Computed Values
// =============================================================================

/**
 * Derive the current view from state.
 */
function deriveCurrentView(state: ScanState): ScanCurrentView {
  if (state.phase === 'idle') {
    return 'none';
  }

  if (state.phase === 'error') {
    return 'error';
  }

  if (state.phase === 'scanning' || state.phase === 'saving') {
    return 'processing';
  }

  if (state.phase === 'capturing') {
    switch (state.mode) {
      case 'single':
        return 'single-capture';
      case 'batch':
        return 'batch-capture';
      case 'statement':
        return 'statement-capture';
    }
  }

  if (state.phase === 'reviewing') {
    return state.mode === 'batch' ? 'batch-review' : 'single-review';
  }

  return 'none';
}

/**
 * Compute all derived values from state.
 */
function computeValues(state: ScanState): ScanComputedValues {
  const hasActiveRequest = state.phase !== 'idle';
  const isProcessing = state.phase === 'scanning' || state.phase === 'saving';
  const isIdle = state.phase === 'idle';
  const hasError = state.phase === 'error';
  const hasDialog = state.activeDialog !== null;
  const creditSpent = state.creditStatus === 'confirmed';

  // isBlocking: True when there's an active request AND a dialog is showing
  // This indicates the user cannot proceed without resolving the dialog
  const isBlocking = hasActiveRequest && hasDialog;

  // User can navigate freely if:
  // - No active request, OR
  // - No dialog is blocking, AND not currently processing
  const canNavigateFreely = isIdle || (!hasDialog && !isProcessing);

  // Can save if:
  // - In reviewing phase
  // - Has at least one valid result
  // - No dialog is blocking
  const canSave =
    state.phase === 'reviewing' &&
    state.results.length > 0 &&
    state.results.some(canSaveTransaction) &&
    !hasDialog;

  const currentView = deriveCurrentView(state);
  const imageCount = state.images.length;
  const resultCount = state.results.length;

  return {
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
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Scan state machine hook.
 *
 * Returns the current state, dispatch function, and computed values.
 * This hook is pure - all side effects should be handled in ScanContext.
 *
 * @example
 * ```tsx
 * const { state, dispatch, hasActiveRequest, canSave } = useScanStateMachine();
 *
 * // Start a single scan
 * dispatch({ type: 'START_SINGLE', payload: { userId: user.uid } });
 *
 * // Add an image
 * dispatch({ type: 'ADD_IMAGE', payload: { image: base64Data } });
 *
 * // Start processing
 * dispatch({ type: 'PROCESS_START', payload: { creditType: 'normal', creditsCount: 1 } });
 * ```
 */
export function useScanStateMachine(): UseScanStateMachineReturn {
  const [state, dispatch] = useReducer(scanReducer, initialScanState);

  // Memoize computed values
  const computed = useMemo(() => computeValues(state), [state]);

  return {
    state,
    dispatch,
    ...computed,
  };
}

// =============================================================================
// Action Creators (Convenience Functions)
// =============================================================================

/**
 * Create action creators bound to a dispatch function.
 * These provide a cleaner API for common operations.
 */
export function createScanActions(dispatch: React.Dispatch<ScanAction>) {
  return {
    startSingle: (userId: string) => dispatch({ type: 'START_SINGLE', payload: { userId } }),

    startBatch: (userId: string) => dispatch({ type: 'START_BATCH', payload: { userId } }),

    startStatement: (userId: string) => dispatch({ type: 'START_STATEMENT', payload: { userId } }),

    addImage: (image: string) => dispatch({ type: 'ADD_IMAGE', payload: { image } }),

    removeImage: (index: number) => dispatch({ type: 'REMOVE_IMAGE', payload: { index } }),

    setImages: (images: string[]) => dispatch({ type: 'SET_IMAGES', payload: { images } }),

    setStoreType: (storeType: string) =>
      dispatch({ type: 'SET_STORE_TYPE', payload: { storeType } }),

    setCurrency: (currency: string) => dispatch({ type: 'SET_CURRENCY', payload: { currency } }),

    processStart: (creditType: 'normal' | 'super', creditsCount: number) =>
      dispatch({ type: 'PROCESS_START', payload: { creditType, creditsCount } }),

    processSuccess: (results: import('../types/transaction').Transaction[]) =>
      dispatch({ type: 'PROCESS_SUCCESS', payload: { results } }),

    processError: (error: string) => dispatch({ type: 'PROCESS_ERROR', payload: { error } }),

    showDialog: (type: import('../types/scanStateMachine').ScanDialogType, data?: unknown) =>
      dispatch({ type: 'SHOW_DIALOG', payload: { type, data } }),

    resolveDialog: (type: import('../types/scanStateMachine').ScanDialogType, result: unknown) =>
      dispatch({ type: 'RESOLVE_DIALOG', payload: { type, result } }),

    dismissDialog: () => dispatch({ type: 'DISMISS_DIALOG' }),

    updateResult: (index: number, updates: Partial<import('../types/transaction').Transaction>) =>
      dispatch({ type: 'UPDATE_RESULT', payload: { index, updates } }),

    setActiveResult: (index: number) =>
      dispatch({ type: 'SET_ACTIVE_RESULT', payload: { index } }),

    saveStart: () => dispatch({ type: 'SAVE_START' }),

    saveSuccess: () => dispatch({ type: 'SAVE_SUCCESS' }),

    saveError: (error: string) => dispatch({ type: 'SAVE_ERROR', payload: { error } }),

    batchItemStart: (index: number) =>
      dispatch({ type: 'BATCH_ITEM_START', payload: { index } }),

    batchItemSuccess: (index: number, result: import('../types/transaction').Transaction) =>
      dispatch({ type: 'BATCH_ITEM_SUCCESS', payload: { index, result } }),

    batchItemError: (index: number, error: string) =>
      dispatch({ type: 'BATCH_ITEM_ERROR', payload: { index, error } }),

    batchComplete: () => dispatch({ type: 'BATCH_COMPLETE' }),

    // Story 14d.5c: Batch receipt action creators
    setBatchReceipts: (receipts: import('../types/batchReceipt').BatchReceipt[]) =>
      dispatch({ type: 'SET_BATCH_RECEIPTS', payload: { receipts } }),

    updateBatchReceipt: (
      id: string,
      updates: Partial<import('../types/batchReceipt').BatchReceipt>
    ) => dispatch({ type: 'UPDATE_BATCH_RECEIPT', payload: { id, updates } }),

    discardBatchReceipt: (id: string) =>
      dispatch({ type: 'DISCARD_BATCH_RECEIPT', payload: { id } }),

    clearBatchReceipts: () => dispatch({ type: 'CLEAR_BATCH_RECEIPTS' }),

    // Story 14d.5d: Batch editing action creator
    setBatchEditingIndex: (index: number | null) =>
      dispatch({ type: 'SET_BATCH_EDITING_INDEX', payload: { index } }),

    cancel: () => dispatch({ type: 'CANCEL' }),

    reset: () => dispatch({ type: 'RESET' }),

    restoreState: (state: Partial<ScanState>) =>
      dispatch({ type: 'RESTORE_STATE', payload: { state } }),

    refundCredit: () => dispatch({ type: 'REFUND_CREDIT' }),
  };
}

// Export the type for the action creators
export type ScanActions = ReturnType<typeof createScanActions>;
