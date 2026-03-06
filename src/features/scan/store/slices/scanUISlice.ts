/**
 * Story 16-1: UI scan slice
 *
 * UI-specific flags: skip scan complete modal, rescan state.
 */

import type { StateCreator } from 'zustand';
import type { ScanFullStoreInternal, ScanUISlice } from './types';
import { initialScanState } from './initialState';

export const createScanUISlice: StateCreator<
  ScanFullStoreInternal,
  [['zustand/devtools', never]],
  [],
  ScanUISlice
> = (set) => ({
  // State
  skipScanCompleteModal: initialScanState.skipScanCompleteModal,
  isRescanning: initialScanState.isRescanning,

  // Actions
  setSkipScanCompleteModal: (value: boolean) => {
    set({ skipScanCompleteModal: value }, undefined, 'scan/setSkipScanCompleteModal');
  },

  setIsRescanning: (value: boolean) => {
    set({ isRescanning: value }, undefined, 'scan/setIsRescanning');
  },
});
