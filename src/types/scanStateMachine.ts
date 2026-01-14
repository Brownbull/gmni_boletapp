/**
 * Story 14d.1: Scan State Machine Types
 *
 * Type definitions for the unified scan state machine that manages all scan-related
 * state transitions. This replaces the 31 scattered state variables in App.tsx with
 * a single, predictable state machine.
 *
 * Architecture Reference: docs/sprint-artifacts/epic14d/scan-request-lifecycle.md
 *
 * Key Design Decisions:
 * 1. Request Precedence: Active request blocks ALL new requests
 * 2. Request Persistence: No expiration, survives logout/app close
 * 3. Credit Handling: Reserved on API call, confirmed on success, refunded on failure
 * 4. Offline Handling: Error immediately, refund credit
 */

import type { Transaction } from './transaction';
// Story 14d.5c: Import from types file to avoid circular dependency with useBatchReview
import type { BatchReceipt, BatchReceiptStatus } from './batchReceipt';

// Re-export BatchReceipt types for consumers
export type { BatchReceipt, BatchReceiptStatus };

// =============================================================================
// Core State Types
// =============================================================================

/**
 * Scan lifecycle phases.
 *
 * State Flow (from scan-request-lifecycle.md):
 * IDLE → CAPTURING → SCANNING → REVIEWING → SAVED/CANCELLED
 *        (no credit)  (reserved)  (spent)
 */
export type ScanPhase =
  | 'idle' // No scan in progress - mode selector available
  | 'capturing' // Adding images - no credit spent yet
  | 'scanning' // API call in progress - credit reserved
  | 'reviewing' // Results ready for editing - credit confirmed (spent)
  | 'saving' // Saving to Firestore
  | 'error'; // Error state - credit refunded if was reserved

/**
 * Scan modes available from the mode selector.
 */
export type ScanMode =
  | 'single' // Single receipt scan (1 normal credit)
  | 'batch' // Multiple receipts (1 super credit per image)
  | 'statement'; // Credit card statement (future - placeholder)

/**
 * Dialog types that can be shown during scan flow.
 * Dialogs pause the state machine until resolved.
 */
export type ScanDialogType =
  | 'currency_mismatch' // AI detected different currency than user setting
  | 'total_mismatch' // Calculated total doesn't match receipt total
  | 'quicksave' // High-confidence scan - offer quick save
  | 'scan_complete' // Scan finished - "Save now or Edit?"
  | 'cancel_warning' // User trying to cancel after credit spent
  | 'batch_cancel_warning' // User trying to cancel batch after credits spent
  | 'discard_warning' // User trying to discard unsaved changes
  // Story 14d.5d: Additional batch dialog types
  | 'batch_discard' // User trying to discard batch review results (credit already spent)
  | 'batch_complete'; // Batch save completed - show summary modal with transaction data

/**
 * Story 14d.4b: Dialog type constants for type-safe comparisons.
 * Use these instead of string literals to avoid typos and enable refactoring.
 *
 * @example
 * ```tsx
 * import { DIALOG_TYPES } from '../types/scanStateMachine';
 *
 * if (state.activeDialog?.type === DIALOG_TYPES.CURRENCY_MISMATCH) {
 *   // handle currency mismatch
 * }
 * ```
 */
export const DIALOG_TYPES = {
  CURRENCY_MISMATCH: 'currency_mismatch',
  TOTAL_MISMATCH: 'total_mismatch',
  QUICKSAVE: 'quicksave',
  SCAN_COMPLETE: 'scan_complete',
  CANCEL_WARNING: 'cancel_warning',
  BATCH_CANCEL_WARNING: 'batch_cancel_warning',
  DISCARD_WARNING: 'discard_warning',
  // Story 14d.5d: Additional batch dialog types
  BATCH_DISCARD: 'batch_discard',
  BATCH_COMPLETE: 'batch_complete',
} as const satisfies Record<string, ScanDialogType>;

/**
 * Credit status for the current scan request.
 * Tracks the credit lifecycle: none → reserved → confirmed/refunded
 */
export type CreditStatus =
  | 'none' // No credit interaction yet (IDLE, CAPTURING)
  | 'reserved' // Credit deducted from UI, pending API result (SCANNING)
  | 'confirmed' // Credit permanently spent (REVIEWING, SAVED)
  | 'refunded'; // Credit returned after failure (ERROR)

/**
 * Credit type used for the scan.
 */
export type CreditType = 'normal' | 'super';

// =============================================================================
// State Structure
// =============================================================================

/**
 * Batch processing progress for batch mode scans.
 */
export interface BatchProgress {
  /** Current image being processed (0-indexed) */
  current: number;
  /** Total number of images in batch */
  total: number;
  /** Successfully processed transactions */
  completed: Transaction[];
  /** Indices of failed images with error messages */
  failed: Array<{ index: number; error: string }>;
}

/**
 * Dialog state when a dialog is active.
 */
export interface DialogState<T = unknown> {
  /** Type of dialog currently shown */
  type: ScanDialogType;
  /** Data needed to render the dialog */
  data: T;
}

/**
 * Story 14d.5d: Data payload for batch_complete dialog.
 * Contains summary information for the completion modal.
 */
export interface BatchCompleteDialogData {
  /** Successfully saved transactions */
  transactions: Transaction[];
  /** Number of super credits used */
  creditsUsed: number;
}

// =============================================================================
// Story 14d.6: Dialog Data Types for Unified Dialog Handling
// =============================================================================

/**
 * Data payload for currency_mismatch dialog.
 * Shown when AI-detected currency differs from user's default currency.
 */
export interface CurrencyMismatchDialogData {
  /** AI-detected currency code (e.g., "GBP", "EUR") */
  detectedCurrency: string;
  /** The pending transaction that triggered the dialog */
  pendingTransaction: Transaction;
  /** Whether there's also a total discrepancy */
  hasDiscrepancy?: boolean;
}

/**
 * Data payload for total_mismatch dialog.
 * Shown when extracted total doesn't match sum of item prices.
 */
export interface TotalMismatchDialogData {
  /** Validation result from totalValidation utility */
  validationResult: {
    isValid: boolean;
    extractedTotal: number;
    itemsSum: number;
    discrepancy: number;
    discrepancyPercent: number;
    suggestedTotal: number | null;
    errorType: 'none' | 'missing_digit' | 'extra_digit' | 'unknown';
  };
  /** The pending transaction that triggered the dialog */
  pendingTransaction: Transaction;
  /** Parsed items from the transaction */
  parsedItems?: Transaction['items'];
}

/**
 * Data payload for quicksave dialog.
 * Shown when AI has high confidence in extracted data.
 */
export interface QuickSaveDialogData {
  /** The transaction ready for quick save */
  transaction: Transaction;
  /** AI extraction confidence score (0-1) */
  confidence: number;
}

/**
 * Data payload for scan_complete dialog.
 * Shown after successful scan to offer Save/Edit choice.
 */
export interface ScanCompleteDialogData {
  /** The completed transaction */
  transaction: Transaction;
  /** Whether to skip the complete modal (go straight to editor) */
  skipComplete?: boolean;
}

/**
 * Data payload for cancel_warning dialog.
 * Shown when user tries to cancel after credit has been spent.
 */
export interface CancelWarningDialogData {
  /** Type of credit that was spent */
  creditType: CreditType;
  /** Number of credits spent */
  creditsSpent: number;
}

/**
 * Union type for all dialog data payloads.
 * Use this for type-safe access to dialog data.
 */
export type DialogDataPayload =
  | { type: 'currency_mismatch'; data: CurrencyMismatchDialogData }
  | { type: 'total_mismatch'; data: TotalMismatchDialogData }
  | { type: 'quicksave'; data: QuickSaveDialogData }
  | { type: 'scan_complete'; data: ScanCompleteDialogData }
  | { type: 'cancel_warning'; data: CancelWarningDialogData }
  | { type: 'batch_cancel_warning'; data: CancelWarningDialogData }
  | { type: 'discard_warning'; data: null }
  | { type: 'batch_discard'; data: null }
  | { type: 'batch_complete'; data: BatchCompleteDialogData };

/**
 * Complete scan state machine state.
 *
 * This single object replaces 31 state variables from App.tsx.
 * See epic-14d-scan-architecture-refactor.md for the full list of replaced variables.
 */
export interface ScanState {
  // === Core State ===
  /** Current phase in the scan lifecycle */
  phase: ScanPhase;
  /** Selected scan mode (single, batch, statement) */
  mode: ScanMode;

  // === Request Identity ===
  /** Unique ID for this scan request (for persistence/debugging) */
  requestId: string | null;
  /** User ID who owns this request */
  userId: string | null;
  /** Timestamp when request was created */
  startedAt: number | null;

  // === Image Data ===
  /** Raw images (base64 data URLs) */
  images: string[];

  // === Results ===
  /** Parsed transaction(s) from scan */
  results: Transaction[];
  /** Index of currently selected result (for batch review) */
  activeResultIndex: number;

  // === Credit Tracking ===
  /** Current credit status */
  creditStatus: CreditStatus;
  /** Type of credit used (normal or super) */
  creditType: CreditType | null;
  /** Number of credits reserved/spent (for batch mode) */
  creditsCount: number;

  // === Dialog State ===
  /** Currently active dialog (null if no dialog) */
  activeDialog: DialogState | null;

  // === Error State ===
  /** Error message if phase is 'error' */
  error: string | null;

  // === Batch Mode ===
  /** Progress tracker for batch processing */
  batchProgress: BatchProgress | null;

  /**
   * Story 14d.5c: Batch receipts for review.
   * Stores receipts with status and confidence after processing completes.
   * Used by BatchReviewView instead of passing through props.
   */
  batchReceipts: BatchReceipt[] | null;

  /**
   * Story 14d.5d: Index of receipt currently being edited in TransactionEditorView.
   * null = not editing any batch receipt (viewing batch review or not in batch mode)
   * 0-indexed to match batchReceipts array
   */
  batchEditingIndex: number | null;

  // === Pre-scan Options ===
  /** User-selected store type before scan */
  storeType: string | null;
  /** User-selected currency before scan */
  currency: string | null;
}

// =============================================================================
// Action Types
// =============================================================================

/**
 * All actions that can be dispatched to the scan state machine.
 *
 * Actions are categorized by:
 * - START_*: Begin a new scan request
 * - IMAGE_*: Manage images in capturing phase
 * - PROCESS_*: Handle API processing
 * - DIALOG_*: Manage dialog interactions
 * - RESULT_*: Modify scan results
 * - SAVE_*: Handle persistence
 * - BATCH_*: Batch-specific actions
 * - Control: CANCEL, RESET
 */
export type ScanAction =
  // === Start Actions ===
  | { type: 'START_SINGLE'; payload: { userId: string } }
  | { type: 'START_BATCH'; payload: { userId: string } }
  | { type: 'START_STATEMENT'; payload: { userId: string } }

  // === Image Actions ===
  | { type: 'ADD_IMAGE'; payload: { image: string } }
  | { type: 'REMOVE_IMAGE'; payload: { index: number } }
  | { type: 'SET_IMAGES'; payload: { images: string[] } }

  // === Pre-scan Options ===
  | { type: 'SET_STORE_TYPE'; payload: { storeType: string } }
  | { type: 'SET_CURRENCY'; payload: { currency: string } }

  // === Process Actions ===
  | { type: 'PROCESS_START'; payload: { creditType: CreditType; creditsCount: number } }
  | { type: 'PROCESS_SUCCESS'; payload: { results: Transaction[] } }
  | { type: 'PROCESS_ERROR'; payload: { error: string } }

  // === Dialog Actions ===
  | { type: 'SHOW_DIALOG'; payload: DialogState }
  | { type: 'RESOLVE_DIALOG'; payload: { type: ScanDialogType; result: unknown } }
  | { type: 'DISMISS_DIALOG' }

  // === Result Actions ===
  | { type: 'UPDATE_RESULT'; payload: { index: number; updates: Partial<Transaction> } }
  | { type: 'SET_ACTIVE_RESULT'; payload: { index: number } }

  // === Save Actions ===
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; payload: { error: string } }

  // === Batch Actions ===
  | { type: 'BATCH_ITEM_START'; payload: { index: number } }
  | { type: 'BATCH_ITEM_SUCCESS'; payload: { index: number; result: Transaction } }
  | { type: 'BATCH_ITEM_ERROR'; payload: { index: number; error: string } }
  // Story 14d.5: Added optional batchReceipts payload to set receipts atomically with phase transition
  // This fixes race condition where re-render happened before setBatchReceipts was called
  | { type: 'BATCH_COMPLETE'; payload?: { batchReceipts: BatchReceipt[] } }

  // === Story 14d.5c: Batch Receipt Actions ===
  /** Set all batch receipts after processing completes */
  | { type: 'SET_BATCH_RECEIPTS'; payload: { receipts: BatchReceipt[] } }
  /** Update a single batch receipt (after editing) */
  | { type: 'UPDATE_BATCH_RECEIPT'; payload: { id: string; updates: Partial<BatchReceipt> } }
  /** Discard a batch receipt from the review queue */
  | { type: 'DISCARD_BATCH_RECEIPT'; payload: { id: string } }
  /** Clear all batch receipts (after save or cancel) */
  | { type: 'CLEAR_BATCH_RECEIPTS' }

  // === Story 14d.5d: Batch Editing Actions ===
  /** Set the index of the batch receipt currently being edited (null to clear) */
  | { type: 'SET_BATCH_EDITING_INDEX'; payload: { index: number | null } }

  // === Control Actions ===
  | { type: 'CANCEL' }
  | { type: 'RESET' }

  // === Recovery Actions ===
  | { type: 'RESTORE_STATE'; payload: { state: Partial<ScanState> } }
  | { type: 'REFUND_CREDIT' };

// =============================================================================
// Computed Values Interface
// =============================================================================

/**
 * Computed values derived from state.
 * These are memoized in the hook for performance.
 */
export interface ScanComputedValues {
  /** True if state machine is not idle (blocks new requests per precedence rule) */
  hasActiveRequest: boolean;

  /** True if currently in a phase that should show processing UI */
  isProcessing: boolean;

  /** True if in idle phase */
  isIdle: boolean;

  /** True if an error occurred */
  hasError: boolean;

  /** True if there's an active dialog */
  hasDialog: boolean;

  /** True when active request AND dialog showing - user must resolve dialog to proceed (AC6) */
  isBlocking: boolean;

  /** True if credit has been spent (can't cancel without warning) */
  creditSpent: boolean;

  /** True if user can navigate away without losing data */
  canNavigateFreely: boolean;

  /** True if save button should be enabled */
  canSave: boolean;

  /** Derived view name for routing */
  currentView: ScanCurrentView;

  /** Number of images currently captured */
  imageCount: number;

  /** Number of successfully processed results */
  resultCount: number;
}

/**
 * Possible view states derived from scan state.
 */
export type ScanCurrentView =
  | 'none' // No scan view (idle)
  | 'single-capture' // Single mode capture
  | 'batch-capture' // Batch mode capture
  | 'statement-capture' // Statement mode capture
  | 'processing' // API processing in progress
  | 'single-review' // Single scan result review
  | 'batch-review' // Batch results review
  | 'error'; // Error display

// =============================================================================
// Hook Return Type
// =============================================================================

/**
 * Return type of useScanStateMachine hook.
 */
export interface UseScanStateMachineReturn extends ScanComputedValues {
  /** Current state */
  state: ScanState;

  /** Dispatch function for actions */
  dispatch: React.Dispatch<ScanAction>;
}

// =============================================================================
// Persistence Types
// =============================================================================

/**
 * Serializable version of ScanState for localStorage persistence.
 * Excludes non-serializable fields and adds persistence metadata.
 */
export interface PersistedScanState {
  /** The state to restore */
  state: ScanState;

  /** Version for migration support */
  version: number;

  /** When this was persisted */
  persistedAt: number;
}

/**
 * Current persistence schema version.
 * Increment when making breaking changes to PersistedScanState.
 */
export const SCAN_STATE_VERSION = 1;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique request ID.
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a transaction result is valid for saving.
 * Per scan-request-lifecycle.md Rule 6.
 */
export function canSaveTransaction(transaction: Transaction | null): boolean {
  if (!transaction) return false;

  // Must have at least one item
  if (!transaction.items?.length) return false;

  // At least one item must have non-zero price
  const hasValidItem = transaction.items.some((item) => item.price > 0);
  if (!hasValidItem) return false;

  // Transaction total must be non-zero
  if (transaction.total <= 0) return false;

  return true;
}

/**
 * Get credit type for a scan mode.
 */
export function getCreditTypeForMode(mode: ScanMode): CreditType {
  switch (mode) {
    case 'single':
      return 'normal';
    case 'batch':
      return 'super';
    case 'statement':
      return 'super'; // Future: may have different credit type
    default:
      return 'normal';
  }
}
