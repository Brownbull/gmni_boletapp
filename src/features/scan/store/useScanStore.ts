/**
 * Story 14e-6a + 14e-6b: Scan Zustand Store
 *
 * Zustand-based state management for the scan flow.
 * This store manages all scan-related state transitions with explicit phase guards.
 *
 * 14e-6a: Foundation + Core Actions (START_*, IMAGE_*, PROCESS_*)
 * 14e-6b: Complete Actions (DIALOG_*, RESULT_*, SAVE_*, BATCH_*, CONTROL)
 *
 * Architecture Reference:
 * - docs/sprint-artifacts/epic14d/scan-request-lifecycle.md
 * - docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md (ADR-018)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ScanState,
  ScanPhase,
  CreditType,
  DialogState,
  ScanDialogType,
} from '@/types/scanStateMachine';
import { generateRequestId } from '@/types/scanStateMachine';
import type { Transaction } from '@/types/transaction';
import type { BatchReceipt } from '@/types/batchReceipt';

// =============================================================================
// Initial State (matches useScanStateMachine.ts exactly)
// =============================================================================

/**
 * Initial idle state for the scan store.
 * Matches initialScanState from useScanStateMachine.ts exactly.
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
  batchReceipts: null,
  batchEditingIndex: null,

  // Pre-scan options
  storeType: null,
  currency: null,
};

// =============================================================================
// Action Types (Stories 14e-6a + 14e-6b)
// =============================================================================

interface ScanStoreActions {
  // START actions (14e-6a)
  startSingle: (userId: string) => void;
  startBatch: (userId: string) => void;
  startStatement: (userId: string) => void;

  // IMAGE actions (14e-6a)
  addImage: (image: string) => void;
  removeImage: (index: number) => void;
  setImages: (images: string[]) => void;

  // PROCESS actions (14e-6a)
  processStart: (creditType: CreditType, creditsCount: number) => void;
  processSuccess: (results: Transaction[]) => void;
  processError: (error: string) => void;

  // DIALOG actions (14e-6b)
  showDialog: (dialog: DialogState) => void;
  resolveDialog: (type: ScanDialogType, result: unknown) => void;
  dismissDialog: () => void;

  // RESULT actions (14e-6b)
  updateResult: (index: number, updates: Partial<Transaction>) => void;
  setActiveResult: (index: number) => void;

  // SAVE actions (14e-6b)
  saveStart: () => void;
  saveSuccess: () => void;
  saveError: (error: string) => void;

  // BATCH actions (14e-6b)
  batchItemStart: (index: number) => void;
  batchItemSuccess: (index: number, result: Transaction) => void;
  batchItemError: (index: number, error: string) => void;
  batchComplete: (batchReceipts?: BatchReceipt[]) => void;
  setBatchReceipts: (receipts: BatchReceipt[]) => void;
  updateBatchReceipt: (id: string, updates: Partial<BatchReceipt>) => void;
  discardBatchReceipt: (id: string) => void;
  clearBatchReceipts: () => void;
  setBatchEditingIndex: (index: number | null) => void;

  // CONTROL actions (14e-6b)
  cancel: () => void;
  reset: () => void;
  restoreState: (state: Partial<ScanState>) => void;
  refundCredit: () => void;

  // Internal helper
  _guardPhase: (expected: ScanPhase | ScanPhase[], actionName: string) => boolean;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useScanStore = create<ScanState & ScanStoreActions>()(
  devtools(
    (set, get) => ({
      ...initialScanState,

      // =========================================================================
      // Internal Phase Guard Helper
      // =========================================================================

      /**
       * Check if current phase matches expected phase(s).
       * Logs warning in DEV mode when blocked.
       * @returns true if action can proceed, false if blocked
       */
      _guardPhase: (expected: ScanPhase | ScanPhase[], actionName: string): boolean => {
        const state = get();
        const allowed = Array.isArray(expected) ? expected : [expected];

        if (!allowed.includes(state.phase)) {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] ${actionName} blocked: phase is '${state.phase}', expected '${allowed.join('|')}'`
            );
          }
          return false;
        }
        return true;
      },

      // =========================================================================
      // START Actions - Begin a new scan request
      // =========================================================================

      startSingle: (userId: string) => {
        const { _guardPhase } = get();

        // Only allow starting from idle (Request Precedence rule)
        if (!_guardPhase('idle', 'startSingle')) {
          return;
        }

        set(
          {
            ...initialScanState,
            phase: 'capturing',
            mode: 'single',
            requestId: generateRequestId(),
            userId,
            startedAt: Date.now(),
          },
          false,
          'scan/startSingle'
        );
      },

      startBatch: (userId: string) => {
        const { _guardPhase } = get();

        if (!_guardPhase('idle', 'startBatch')) {
          return;
        }

        set(
          {
            ...initialScanState,
            phase: 'capturing',
            mode: 'batch',
            requestId: generateRequestId(),
            userId,
            startedAt: Date.now(),
            batchProgress: {
              current: 0,
              total: 0,
              completed: [],
              failed: [],
            },
          },
          false,
          'scan/startBatch'
        );
      },

      startStatement: (userId: string) => {
        const { _guardPhase } = get();

        if (!_guardPhase('idle', 'startStatement')) {
          return;
        }

        set(
          {
            ...initialScanState,
            phase: 'capturing',
            mode: 'statement',
            requestId: generateRequestId(),
            userId,
            startedAt: Date.now(),
          },
          false,
          'scan/startStatement'
        );
      },

      // =========================================================================
      // IMAGE Actions - Manage images during capturing phase
      // =========================================================================

      addImage: (image: string) => {
        const state = get();

        if (state.phase !== 'capturing') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] addImage blocked: phase is '${state.phase}', expected 'capturing'`
            );
          }
          return;
        }

        const newImages = [...state.images, image];

        // Update batch progress total if in batch mode
        let batchProgress = state.batchProgress;
        if (state.mode === 'batch' && batchProgress) {
          batchProgress = {
            ...batchProgress,
            total: newImages.length,
          };
        }

        set(
          {
            images: newImages,
            batchProgress,
          },
          false,
          'scan/addImage'
        );
      },

      removeImage: (index: number) => {
        const state = get();

        if (state.phase !== 'capturing') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] removeImage blocked: phase is '${state.phase}', expected 'capturing'`
            );
          }
          return;
        }

        const filteredImages = state.images.filter((_, i) => i !== index);

        // Update batch progress total if in batch mode
        let batchProgress = state.batchProgress;
        if (state.mode === 'batch' && batchProgress) {
          batchProgress = {
            ...batchProgress,
            total: filteredImages.length,
          };
        }

        set(
          {
            images: filteredImages,
            batchProgress,
          },
          false,
          'scan/removeImage'
        );
      },

      setImages: (images: string[]) => {
        const state = get();

        if (state.phase !== 'capturing') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] setImages blocked: phase is '${state.phase}', expected 'capturing'`
            );
          }
          return;
        }

        // Update batch progress total if in batch mode
        let batchProgress = state.batchProgress;
        if (state.mode === 'batch' && batchProgress) {
          batchProgress = {
            ...batchProgress,
            total: images.length,
          };
        }

        set(
          {
            images,
            batchProgress,
          },
          false,
          'scan/setImages'
        );
      },

      // =========================================================================
      // PROCESS Actions - Handle API processing
      // =========================================================================

      processStart: (creditType: CreditType, creditsCount: number) => {
        const state = get();

        // Must be in capturing phase
        if (state.phase !== 'capturing') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] processStart blocked: phase is '${state.phase}', expected 'capturing'`
            );
          }
          return;
        }

        // Must have at least one image
        if (state.images.length === 0) {
          if (import.meta.env.DEV) {
            console.warn('[ScanStore] processStart blocked: no images in state');
          }
          return;
        }

        set(
          {
            phase: 'scanning',
            creditStatus: 'reserved',
            creditType,
            creditsCount,
            error: null,
          },
          false,
          'scan/processStart'
        );
      },

      processSuccess: (results: Transaction[]) => {
        const state = get();

        if (state.phase !== 'scanning') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] processSuccess blocked: phase is '${state.phase}', expected 'scanning'`
            );
          }
          return;
        }

        set(
          {
            phase: 'reviewing',
            creditStatus: 'confirmed',
            results,
            activeResultIndex: 0,
            error: null,
          },
          false,
          'scan/processSuccess'
        );
      },

      processError: (error: string) => {
        const state = get();

        if (state.phase !== 'scanning') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] processError blocked: phase is '${state.phase}', expected 'scanning'`
            );
          }
          return;
        }

        set(
          {
            phase: 'error',
            creditStatus: 'refunded', // Credit is refunded on API failure
            error,
          },
          false,
          'scan/processError'
        );
      },

      // =========================================================================
      // DIALOG Actions - Story 14e-6b
      // =========================================================================

      showDialog: (dialog: DialogState) => {
        // Dialogs can be shown from any phase
        set(
          {
            activeDialog: dialog,
          },
          false,
          'scan/showDialog'
        );
      },

      resolveDialog: (type: ScanDialogType, _result: unknown) => {
        const state = get();

        // Validate dialog type match
        // Note: _result is passed for API consistency but not stored in state
        // (matches original reducer behavior - result handled by caller, not state machine)
        if (!state.activeDialog || state.activeDialog.type !== type) {
          if (import.meta.env.DEV) {
            console.warn('[ScanStore] Cannot resolve dialog - type mismatch');
          }
          return;
        }

        set(
          {
            activeDialog: null,
          },
          false,
          'scan/resolveDialog'
        );
      },

      dismissDialog: () => {
        set(
          {
            activeDialog: null,
          },
          false,
          'scan/dismissDialog'
        );
      },

      // =========================================================================
      // RESULT Actions - Story 14e-6b
      // =========================================================================

      updateResult: (index: number, updates: Partial<Transaction>) => {
        const state = get();

        if (state.phase !== 'reviewing') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] updateResult blocked: phase is '${state.phase}', expected 'reviewing'`
            );
          }
          return;
        }

        if (index < 0 || index >= state.results.length) {
          if (import.meta.env.DEV) {
            console.warn('[ScanStore] Invalid result index');
          }
          return;
        }

        const newResults = [...state.results];
        newResults[index] = { ...newResults[index], ...updates };

        set(
          {
            results: newResults,
          },
          false,
          'scan/updateResult'
        );
      },

      setActiveResult: (index: number) => {
        const state = get();

        if (state.phase !== 'reviewing') {
          return;
        }

        if (index < 0 || index >= state.results.length) {
          return;
        }

        set(
          {
            activeResultIndex: index,
          },
          false,
          'scan/setActiveResult'
        );
      },

      // =========================================================================
      // SAVE Actions - Story 14e-6b
      // =========================================================================

      saveStart: () => {
        const state = get();

        if (state.phase !== 'reviewing') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] saveStart blocked: phase is '${state.phase}', expected 'reviewing'`
            );
          }
          return;
        }

        set(
          {
            phase: 'saving',
          },
          false,
          'scan/saveStart'
        );
      },

      saveSuccess: () => {
        const state = get();

        if (state.phase !== 'saving') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] saveSuccess blocked: phase is '${state.phase}', expected 'saving'`
            );
          }
          return;
        }

        // Reset to idle after successful save
        set({ ...initialScanState }, false, 'scan/saveSuccess');
      },

      saveError: (error: string) => {
        const state = get();

        if (state.phase !== 'saving') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] saveError blocked: phase is '${state.phase}', expected 'saving'`
            );
          }
          return;
        }

        // Go back to reviewing so user can retry
        set(
          {
            phase: 'reviewing',
            error,
          },
          false,
          'scan/saveError'
        );
      },

      // =========================================================================
      // BATCH Actions - Story 14e-6b
      // =========================================================================

      batchItemStart: (index: number) => {
        const state = get();

        if (state.phase !== 'scanning' || state.mode !== 'batch') {
          return;
        }

        if (!state.batchProgress) {
          return;
        }

        set(
          {
            batchProgress: {
              ...state.batchProgress,
              current: index,
            },
          },
          false,
          'scan/batchItemStart'
        );
      },

      batchItemSuccess: (index: number, result: Transaction) => {
        const state = get();

        if (state.phase !== 'scanning' || state.mode !== 'batch') {
          return;
        }

        if (!state.batchProgress) {
          return;
        }

        set(
          {
            batchProgress: {
              ...state.batchProgress,
              completed: [...state.batchProgress.completed, result],
            },
          },
          false,
          `scan/batchItemSuccess/${index}`
        );
      },

      batchItemError: (index: number, error: string) => {
        const state = get();

        if (state.phase !== 'scanning' || state.mode !== 'batch') {
          return;
        }

        if (!state.batchProgress) {
          return;
        }

        set(
          {
            batchProgress: {
              ...state.batchProgress,
              failed: [...state.batchProgress.failed, { index, error }],
            },
          },
          false,
          `scan/batchItemError/${index}`
        );
      },

      batchComplete: (batchReceipts?: BatchReceipt[]) => {
        const state = get();

        if (state.phase !== 'scanning' || state.mode !== 'batch') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] batchComplete blocked: phase is '${state.phase}', mode is '${state.mode}', expected 'scanning' and 'batch'`
            );
          }
          return;
        }

        if (!state.batchProgress) {
          if (import.meta.env.DEV) {
            console.warn('[ScanStore] batchComplete blocked - no batchProgress');
          }
          return;
        }

        // Move to reviewing with all completed results
        // Story 14d.5: Accept optional batchReceipts payload to set atomically with phase transition
        set(
          {
            phase: 'reviewing',
            creditStatus: 'confirmed',
            results: state.batchProgress.completed,
            error: null,
            // If batchReceipts payload provided, set it atomically with phase transition
            batchReceipts: batchReceipts ?? state.batchReceipts,
          },
          false,
          'scan/batchComplete'
        );
      },

      setBatchReceipts: (receipts: BatchReceipt[]) => {
        const state = get();

        if (state.phase !== 'reviewing' || state.mode !== 'batch') {
          if (import.meta.env.DEV) {
            console.warn(
              '[ScanStore] setBatchReceipts blocked - not in batch reviewing phase'
            );
          }
          return;
        }

        set(
          {
            batchReceipts: receipts,
          },
          false,
          'scan/setBatchReceipts'
        );
      },

      updateBatchReceipt: (id: string, updates: Partial<BatchReceipt>) => {
        const state = get();

        if (state.phase !== 'reviewing' || state.mode !== 'batch') {
          if (import.meta.env.DEV) {
            console.warn(
              '[ScanStore] updateBatchReceipt blocked - not in batch reviewing phase'
            );
          }
          return;
        }

        if (!state.batchReceipts) {
          return;
        }

        const receiptIndex = state.batchReceipts.findIndex((r) => r.id === id);
        if (receiptIndex === -1) {
          if (import.meta.env.DEV) {
            console.warn(
              '[ScanStore] Cannot update batch receipt - receipt not found:',
              id
            );
          }
          return;
        }

        const newReceipts = [...state.batchReceipts];
        newReceipts[receiptIndex] = { ...newReceipts[receiptIndex], ...updates };

        set(
          {
            batchReceipts: newReceipts,
          },
          false,
          'scan/updateBatchReceipt'
        );
      },

      discardBatchReceipt: (id: string) => {
        const state = get();

        if (state.phase !== 'reviewing' || state.mode !== 'batch') {
          return;
        }

        if (!state.batchReceipts) {
          return;
        }

        const newReceipts = state.batchReceipts.filter((r) => r.id !== id);

        set(
          {
            batchReceipts: newReceipts,
          },
          false,
          'scan/discardBatchReceipt'
        );
      },

      clearBatchReceipts: () => {
        set(
          {
            batchReceipts: null,
          },
          false,
          'scan/clearBatchReceipts'
        );
      },

      setBatchEditingIndex: (index: number | null) => {
        const state = get();

        // Setting to null is always allowed (clear editing state)
        if (index === null) {
          set(
            {
              batchEditingIndex: null,
            },
            false,
            'scan/setBatchEditingIndex'
          );
          return;
        }

        // Setting a non-null index requires batch reviewing phase
        if (state.phase !== 'reviewing' || state.mode !== 'batch') {
          if (import.meta.env.DEV) {
            console.warn(
              `[ScanStore] setBatchEditingIndex blocked: phase is '${state.phase}', mode is '${state.mode}', expected 'reviewing' and 'batch'`
            );
          }
          return;
        }

        // Validate index is within bounds
        if (
          !state.batchReceipts ||
          index < 0 ||
          index >= state.batchReceipts.length
        ) {
          if (import.meta.env.DEV) {
            console.warn('[ScanStore] Invalid batch editing index:', index);
          }
          return;
        }

        set(
          {
            batchEditingIndex: index,
          },
          false,
          'scan/setBatchEditingIndex'
        );
      },

      // =========================================================================
      // CONTROL Actions - Story 14e-6b
      // =========================================================================

      cancel: () => {
        const state = get();

        // Can cancel from any phase except saving
        if (state.phase === 'saving') {
          if (import.meta.env.DEV) {
            console.warn('[ScanStore] Cannot cancel during save');
          }
          return;
        }

        // Note: The caller should show a warning dialog if creditStatus === 'confirmed'
        // before calling cancel(). This store doesn't handle that UX.
        set({ ...initialScanState }, false, 'scan/cancel');
      },

      reset: () => {
        // Reset is always allowed
        set({ ...initialScanState }, false, 'scan/reset');
      },

      restoreState: (restoredState: Partial<ScanState>) => {
        // Restore state from persistence (Story 14d.10)
        // If restored state was in 'scanning' phase, it was interrupted
        // Transition to error with refunded credit per lifecycle spec
        if (restoredState.phase === 'scanning') {
          set(
            {
              ...initialScanState,
              ...restoredState,
              phase: 'error',
              creditStatus: 'refunded',
              error: 'Escaneo interrumpido. Intenta de nuevo.',
            },
            false,
            'scan/restoreState'
          );
          return;
        }

        set(
          {
            ...initialScanState,
            ...restoredState,
          },
          false,
          'scan/restoreState'
        );
      },

      refundCredit: () => {
        const state = get();

        // Can only refund if credit is currently reserved
        if (state.creditStatus !== 'reserved') {
          return;
        }

        set(
          {
            creditStatus: 'refunded',
          },
          false,
          'scan/refundCredit'
        );
      },
    }),
    {
      name: 'scan-store',
      enabled: import.meta.env.DEV,
    }
  )
);
