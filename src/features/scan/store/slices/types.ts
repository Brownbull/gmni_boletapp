/**
 * Story 16-1: Shared types for scan store slices
 *
 * Defines all slice interfaces and the combined ScanFullStore type.
 * Each slice creator imports from here to avoid circular dependencies.
 */

import type {
  ScanState,
  ScanPhase,
  CreditType,
  DialogState,
  ScanDialogType,
} from '@/types/scanStateMachine';
import type { Transaction } from '@/types/transaction';
import type { BatchReceipt } from '@/types/batchReceipt';

// =============================================================================
// Core Slice
// =============================================================================

export interface ScanCoreSlice {
  // State
  phase: ScanState['phase'];
  mode: ScanState['mode'];
  requestId: ScanState['requestId'];
  userId: ScanState['userId'];
  startedAt: ScanState['startedAt'];
  images: ScanState['images'];
  results: ScanState['results'];
  activeResultIndex: ScanState['activeResultIndex'];
  error: ScanState['error'];
  storeType: ScanState['storeType'];
  currency: ScanState['currency'];

  // Actions
  startSingle: (userId: string) => void;
  startBatch: (userId: string) => void;
  startStatement: (userId: string) => void;
  addImage: (image: string) => void;
  removeImage: (index: number) => void;
  setImages: (images: string[]) => void;
  processStart: (creditType: CreditType, creditsCount: number) => void;
  processSuccess: (results: Transaction[]) => void;
  processError: (error: string) => void;
  updateResult: (index: number, updates: Partial<Transaction>) => void;
  setActiveResult: (index: number) => void;
  saveStart: () => void;
  saveSuccess: () => void;
  saveError: (error: string) => void;
  cancel: () => void;
  reset: () => void;
  restoreState: (state: Partial<ScanState>) => void;
}

// Internal-only type — not exported to consumers
export interface ScanCoreSliceInternal extends ScanCoreSlice {
  _guardPhase: (expected: ScanPhase | ScanPhase[], actionName: string) => boolean;
}

// =============================================================================
// Batch Slice
// =============================================================================

export interface ScanBatchSlice {
  // State
  batchProgress: ScanState['batchProgress'];
  batchReceipts: ScanState['batchReceipts'];
  batchEditingIndex: ScanState['batchEditingIndex'];

  // Actions
  batchItemStart: (index: number) => void;
  batchItemSuccess: (index: number, result: Transaction) => void;
  batchItemError: (index: number, error: string) => void;
  batchComplete: (batchReceipts?: BatchReceipt[]) => void;
  setBatchReceipts: (receipts: BatchReceipt[]) => void;
  updateBatchReceipt: (id: string, updates: Partial<BatchReceipt>) => void;
  discardBatchReceipt: (id: string) => void;
  clearBatchReceipts: () => void;
  setBatchEditingIndex: (index: number | null) => void;
}

// =============================================================================
// Credit Slice
// =============================================================================

export interface ScanCreditSlice {
  // State
  creditStatus: ScanState['creditStatus'];
  creditType: ScanState['creditType'];
  creditsCount: ScanState['creditsCount'];

  // Actions
  refundCredit: () => void;
}

// =============================================================================
// Dialog Slice
// =============================================================================

export interface ScanDialogSlice {
  // State
  activeDialog: ScanState['activeDialog'];

  // Actions
  showDialog: (dialog: DialogState) => void;
  resolveDialog: (type: ScanDialogType, result: unknown) => void;
  dismissDialog: () => void;
}

// =============================================================================
// UI Slice
// =============================================================================

export interface ScanUISlice {
  // State
  skipScanCompleteModal: boolean;
  isRescanning: boolean;

  // Actions
  setSkipScanCompleteModal: (value: boolean) => void;
  setIsRescanning: (value: boolean) => void;
}

// =============================================================================
// Combined Store Type
// =============================================================================

// Internal store type includes _guardPhase (used by slice creators)
export type ScanFullStoreInternal = ScanCoreSliceInternal &
  ScanBatchSlice &
  ScanCreditSlice &
  ScanDialogSlice &
  ScanUISlice;

// Public store type hides _guardPhase from consumers
export type ScanFullStore = ScanCoreSlice &
  ScanBatchSlice &
  ScanCreditSlice &
  ScanDialogSlice &
  ScanUISlice;
