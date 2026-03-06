/**
 * Story 16-1: Shared initial state for all scan store slices
 *
 * Single source of truth for initial/reset state.
 * Used by each slice for default values and by reset/cancel actions.
 */

import type { ScanState } from '@/types/scanStateMachine';
import type { ScanFullStore } from './types';

interface ScanUIState {
  skipScanCompleteModal: boolean;
  isRescanning: boolean;
}

export const initialScanState: ScanState & ScanUIState = {
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

  // UI flags
  skipScanCompleteModal: false,
  isRescanning: false,
};

// Compile-time check: ensure initialScanState covers all state keys.
// If a new slice adds state without updating initialState, this will error.
// _StateKeys extracts non-function keys from ScanFullStore; the `satisfies`
// assertion forces a type error when a key is missing from initialScanState.
type _StateKeys = Exclude<{ [K in keyof ScanFullStore]: ScanFullStore[K] extends (...args: never[]) => unknown ? never : K }[keyof ScanFullStore], never>;
void (initialScanState satisfies Record<_StateKeys, unknown>);
