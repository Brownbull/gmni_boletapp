/**
 * Story 16-1: Dialog scan slice
 *
 * Active dialog state management.
 * Dialogs can be shown from any phase.
 */

import type { StateCreator } from 'zustand';
import type { DialogState } from '../../types/scanStateMachine';
import type { ScanFullStoreInternal, ScanDialogSlice } from './types';
import { initialScanState } from './initialState';
import { logGuardViolation } from './guardLog';

export const createScanDialogSlice: StateCreator<
  ScanFullStoreInternal,
  [['zustand/devtools', never]],
  [],
  ScanDialogSlice
> = (set, get) => ({
  // State
  activeDialog: initialScanState.activeDialog,

  // Actions
  showDialog: (dialog: DialogState) => {
    set({ activeDialog: dialog }, undefined, 'scan/showDialog');
  },

  resolveDialog: (type, _result) => {
    const state = get();
    if (!state.activeDialog || state.activeDialog.type !== type) {
      logGuardViolation({
        action: 'resolveDialog',
        currentPhase: state.phase,
        expectedPhase: state.phase,
        detail: `dialog type mismatch: expected '${type}', active is '${state.activeDialog?.type ?? 'none'}'`,
      });
      return;
    }

    set({ activeDialog: null }, undefined, 'scan/resolveDialog');
  },

  dismissDialog: () => {
    set({ activeDialog: null }, undefined, 'scan/dismissDialog');
  },
});
