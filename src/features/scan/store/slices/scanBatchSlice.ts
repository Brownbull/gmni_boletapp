/**
 * Story 16-1: Batch scan slice
 *
 * Batch progress, receipts, and editing index.
 * Cross-slice reads: checks phase/mode from core slice via get().
 * Cross-slice writes: batchComplete sets phase, creditStatus, results, error.
 */

import type { StateCreator } from 'zustand';
import type { Transaction } from '@/types/transaction';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { ScanFullStoreInternal, ScanBatchSlice } from './types';
import { initialScanState } from './initialState';
import { logGuardViolation } from './guardLog';

export const createScanBatchSlice: StateCreator<
  ScanFullStoreInternal,
  [['zustand/devtools', never]],
  [],
  ScanBatchSlice
> = (set, get) => ({
  // State
  batchProgress: initialScanState.batchProgress,
  batchReceipts: initialScanState.batchReceipts,
  batchEditingIndex: initialScanState.batchEditingIndex,

  // =========================================================================
  // BATCH Actions
  // =========================================================================

  batchItemStart: (index: number) => {
    const state = get();
    if (state.phase !== 'scanning' || state.mode !== 'batch') return;
    if (!state.batchProgress) return;

    set(
      { batchProgress: { ...state.batchProgress, current: index } },
      undefined,
      'scan/batchItemStart'
    );
  },

  batchItemSuccess: (index: number, result: Transaction) => {
    const state = get();
    if (state.phase !== 'scanning' || state.mode !== 'batch') return;
    if (!state.batchProgress) return;

    set(
      {
        batchProgress: {
          ...state.batchProgress,
          completed: [...state.batchProgress.completed, result],
        },
      },
      undefined,
      `scan/batchItemSuccess/${index}`
    );
  },

  batchItemError: (index: number, error: string) => {
    const state = get();
    if (state.phase !== 'scanning' || state.mode !== 'batch') return;
    if (!state.batchProgress) return;

    set(
      {
        batchProgress: {
          ...state.batchProgress,
          failed: [...state.batchProgress.failed, { index, error }],
        },
      },
      undefined,
      `scan/batchItemError/${index}`
    );
  },

  batchComplete: (batchReceipts?: BatchReceipt[]) => {
    const state = get();
    if (state.phase !== 'scanning' || state.mode !== 'batch') {
      logGuardViolation({
        action: 'batchComplete',
        currentPhase: state.phase,
        expectedPhase: 'scanning',
        currentMode: state.mode,
        expectedMode: 'batch',
      });
      return;
    }
    if (!state.batchProgress) {
      logGuardViolation({
        action: 'batchComplete',
        currentPhase: state.phase,
        expectedPhase: 'scanning',
        detail: 'no batchProgress',
      });
      return;
    }

    // Cross-slice write: sets coreSlice (phase, error) and creditSlice (creditStatus) state
    set(
      {
        phase: 'reviewing',
        creditStatus: 'confirmed',
        results: state.batchProgress.completed,
        error: null,
        batchReceipts: batchReceipts ?? state.batchReceipts,
      },
      undefined,
      'scan/batchComplete'
    );
  },

  setBatchReceipts: (receipts: BatchReceipt[]) => {
    const state = get();
    if (state.phase !== 'reviewing' || state.mode !== 'batch') {
      logGuardViolation({
        action: 'setBatchReceipts',
        currentPhase: state.phase,
        expectedPhase: 'reviewing',
        currentMode: state.mode,
        expectedMode: 'batch',
      });
      return;
    }

    set({ batchReceipts: receipts }, undefined, 'scan/setBatchReceipts');
  },

  updateBatchReceipt: (id: string, updates: Partial<BatchReceipt>) => {
    const state = get();
    if (state.phase !== 'reviewing' || state.mode !== 'batch') {
      logGuardViolation({
        action: 'updateBatchReceipt',
        currentPhase: state.phase,
        expectedPhase: 'reviewing',
        currentMode: state.mode,
        expectedMode: 'batch',
      });
      return;
    }
    if (!state.batchReceipts) return;

    const receiptIndex = state.batchReceipts.findIndex((r) => r.id === id);
    if (receiptIndex === -1) {
      logGuardViolation({
        action: 'updateBatchReceipt',
        currentPhase: state.phase,
        expectedPhase: 'reviewing',
        detail: `receipt not found: ${id}`,
      });
      return;
    }

    const newReceipts = [...state.batchReceipts];
    newReceipts[receiptIndex] = { ...newReceipts[receiptIndex], ...updates };
    set({ batchReceipts: newReceipts }, undefined, 'scan/updateBatchReceipt');
  },

  discardBatchReceipt: (id: string) => {
    const state = get();
    if (state.phase !== 'reviewing' || state.mode !== 'batch') return;
    if (!state.batchReceipts) return;

    const newReceipts = state.batchReceipts.filter((r) => r.id !== id);
    set({ batchReceipts: newReceipts }, undefined, 'scan/discardBatchReceipt');
  },

  clearBatchReceipts: () => {
    set({ batchReceipts: null }, undefined, 'scan/clearBatchReceipts');
  },

  setBatchEditingIndex: (index: number | null) => {
    const state = get();

    if (index === null) {
      set({ batchEditingIndex: null }, undefined, 'scan/setBatchEditingIndex');
      return;
    }

    if (state.phase !== 'reviewing' || state.mode !== 'batch') {
      logGuardViolation({
        action: 'setBatchEditingIndex',
        currentPhase: state.phase,
        expectedPhase: 'reviewing',
        currentMode: state.mode,
        expectedMode: 'batch',
      });
      return;
    }

    if (!state.batchReceipts || index < 0 || index >= state.batchReceipts.length) {
      logGuardViolation({
        action: 'setBatchEditingIndex',
        currentPhase: state.phase,
        expectedPhase: 'reviewing',
        detail: `invalid index: ${index}`,
      });
      return;
    }

    set({ batchEditingIndex: index }, undefined, 'scan/setBatchEditingIndex');
  },
});
