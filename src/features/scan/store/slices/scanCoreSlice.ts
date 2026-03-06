/**
 * Story 16-1: Core scan slice
 *
 * Phase machine, image management, process lifecycle, save/result actions, control actions.
 * Cross-slice writes: sets credit state (processStart/Success/Error), batch state (image actions).
 */

import type { StateCreator } from 'zustand';
import type { ScanPhase, CreditType, CreditStatus } from '@/types/scanStateMachine';
import { generateRequestId } from '@/types/scanStateMachine';
import type { Transaction } from '@/types/transaction';
import type { ScanState } from '@/types/scanStateMachine';
import type { ScanFullStoreInternal, ScanCoreSliceInternal } from './types';
import { initialScanState } from './initialState';
import { logGuardViolation } from './guardLog';

// Runtime validation sets for restoreState (AC-1)
const VALID_PHASES: ReadonlySet<string> = new Set<ScanPhase>(['idle', 'capturing', 'scanning', 'reviewing', 'saving', 'error']);
const VALID_CREDIT_STATUSES: ReadonlySet<string> = new Set<CreditStatus>(['none', 'reserved', 'confirmed', 'refunded']);

export const createScanCoreSlice: StateCreator<
  ScanFullStoreInternal,
  [['zustand/devtools', never]],
  [],
  ScanCoreSliceInternal
> = (set, get) => ({
  // State
  phase: initialScanState.phase,
  mode: initialScanState.mode,
  requestId: initialScanState.requestId,
  userId: initialScanState.userId,
  startedAt: initialScanState.startedAt,
  images: initialScanState.images,
  results: initialScanState.results,
  activeResultIndex: initialScanState.activeResultIndex,
  error: initialScanState.error,
  storeType: initialScanState.storeType,
  currency: initialScanState.currency,

  _guardPhase: (expected: ScanPhase | ScanPhase[], actionName: string): boolean => {
    const state = get();
    const allowed = Array.isArray(expected) ? expected : [expected];
    if (!allowed.includes(state.phase)) {
      logGuardViolation({
        action: actionName,
        currentPhase: state.phase,
        expectedPhase: allowed.join('|'),
      });
      return false;
    }
    return true;
  },

  // START Actions

  startSingle: (userId: string) => {
    if (!get()._guardPhase('idle', 'startSingle')) return;
    set(
      { ...initialScanState, phase: 'capturing', mode: 'single', requestId: generateRequestId(), userId, startedAt: Date.now() },
      undefined, 'scan/startSingle'
    );
  },

  startBatch: (userId: string) => {
    if (!get()._guardPhase('idle', 'startBatch')) return;
    set(
      { ...initialScanState, phase: 'capturing', mode: 'batch', requestId: generateRequestId(), userId, startedAt: Date.now(),
        batchProgress: { current: 0, total: 0, completed: [], failed: [] } },
      undefined, 'scan/startBatch'
    );
  },

  startStatement: (userId: string) => {
    if (!get()._guardPhase('idle', 'startStatement')) return;
    set(
      { ...initialScanState, phase: 'capturing', mode: 'statement', requestId: generateRequestId(), userId, startedAt: Date.now() },
      undefined, 'scan/startStatement'
    );
  },

  // IMAGE Actions

  addImage: (image: string) => {
    if (!get()._guardPhase('capturing', 'addImage')) return;
    const state = get();
    const newImages = [...state.images, image];
    let batchProgress = state.batchProgress;
    if (state.mode === 'batch' && batchProgress) {
      batchProgress = { ...batchProgress, total: newImages.length };
    }
    set({ images: newImages, batchProgress }, undefined, 'scan/addImage');
  },

  removeImage: (index: number) => {
    if (!get()._guardPhase('capturing', 'removeImage')) return;
    const state = get();
    const filteredImages = state.images.filter((_, i) => i !== index);
    let batchProgress = state.batchProgress;
    if (state.mode === 'batch' && batchProgress) {
      batchProgress = { ...batchProgress, total: filteredImages.length };
    }
    set({ images: filteredImages, batchProgress }, undefined, 'scan/removeImage');
  },

  setImages: (images: string[]) => {
    if (!get()._guardPhase('capturing', 'setImages')) return;
    const state = get();
    let batchProgress = state.batchProgress;
    if (state.mode === 'batch' && batchProgress) {
      batchProgress = { ...batchProgress, total: images.length };
    }
    set({ images, batchProgress }, undefined, 'scan/setImages');
  },

  // PROCESS Actions

  processStart: (creditType: CreditType, creditsCount: number) => {
    if (!get()._guardPhase('capturing', 'processStart')) return;
    if (get().images.length === 0) {
      logGuardViolation({
        action: 'processStart',
        currentPhase: get().phase,
        expectedPhase: 'capturing',
        detail: 'no images in state',
      });
      return;
    }
    set(
      // Cross-slice write: sets creditSlice state (creditStatus, creditType, creditsCount)
      { phase: 'scanning', creditStatus: 'reserved', creditType, creditsCount, error: null },
      undefined, 'scan/processStart'
    );
  },

  processSuccess: (results: Transaction[]) => {
    if (!get()._guardPhase('scanning', 'processSuccess')) return;
    set(
      // Cross-slice write: sets creditSlice state (creditStatus)
      { phase: 'reviewing', creditStatus: 'confirmed', results, activeResultIndex: 0, error: null },
      undefined, 'scan/processSuccess'
    );
  },

  processError: (error: string) => {
    if (!get()._guardPhase('scanning', 'processError')) return;
    // Cross-slice write: sets creditSlice state (creditStatus)
    set({ phase: 'error', creditStatus: 'refunded', error }, undefined, 'scan/processError');
  },

  // RESULT Actions

  updateResult: (index: number, updates: Partial<Transaction>) => {
    if (!get()._guardPhase('reviewing', 'updateResult')) return;
    const state = get();
    if (index < 0 || index >= state.results.length) {
      logGuardViolation({
        action: 'updateResult',
        currentPhase: state.phase,
        expectedPhase: 'reviewing',
        detail: `invalid result index: ${index}`,
      });
      return;
    }
    const newResults = [...state.results];
    newResults[index] = { ...newResults[index], ...updates };
    set({ results: newResults }, undefined, 'scan/updateResult');
  },

  setActiveResult: (index: number) => {
    const state = get();
    if (state.phase !== 'reviewing') return;
    if (index < 0 || index >= state.results.length) return;
    set({ activeResultIndex: index }, undefined, 'scan/setActiveResult');
  },

  // SAVE Actions

  saveStart: () => {
    if (!get()._guardPhase('reviewing', 'saveStart')) return;
    set({ phase: 'saving' }, undefined, 'scan/saveStart');
  },

  saveSuccess: () => {
    if (!get()._guardPhase('saving', 'saveSuccess')) return;
    set({ ...initialScanState }, undefined, 'scan/saveSuccess');
  },

  saveError: (error: string) => {
    if (!get()._guardPhase('saving', 'saveError')) return;
    set({ phase: 'reviewing', error }, undefined, 'scan/saveError');
  },

  // CONTROL Actions

  cancel: () => {
    if (get().phase === 'saving') {
      logGuardViolation({
        action: 'cancel',
        currentPhase: 'saving',
        expectedPhase: 'idle|capturing|scanning|reviewing|error',
        detail: 'cannot cancel during save',
      });
      return;
    }
    set({ ...initialScanState }, undefined, 'scan/cancel');
  },

  reset: () => {
    set({ ...initialScanState }, undefined, 'scan/reset');
  },

  restoreState: (restoredState: Partial<ScanState>) => {
    // Runtime shape validation
    if (!restoredState || typeof restoredState !== 'object') {
      logGuardViolation({
        action: 'restoreState',
        currentPhase: get().phase,
        expectedPhase: 'any',
        detail: 'invalid restoreState input: not an object',
      });
      return;
    }

    const knownKeys = new Set(Object.keys(initialScanState));
    const unknownKeys = Object.keys(restoredState).filter((k) => !knownKeys.has(k));
    if (unknownKeys.length > 0) {
      logGuardViolation({
        action: 'restoreState',
        currentPhase: get().phase,
        expectedPhase: 'any',
        detail: `unknown keys: ${unknownKeys.join(', ')}`,
      });
    }

    // Filter to only known keys before applying
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(restoredState)) {
      if (knownKeys.has(key)) {
        filtered[key] = (restoredState as Record<string, unknown>)[key];
      }
    }

    // AC-1: Runtime value-type validation for critical fields
    if ('phase' in filtered && (typeof filtered.phase !== 'string' || !VALID_PHASES.has(filtered.phase))) {
      logGuardViolation({
        action: 'restoreState',
        currentPhase: get().phase,
        expectedPhase: 'any',
        detail: `invalid phase: ${String(filtered.phase)}`,
      });
      filtered.phase = initialScanState.phase;
    }

    if ('images' in filtered && !Array.isArray(filtered.images)) {
      logGuardViolation({
        action: 'restoreState',
        currentPhase: get().phase,
        expectedPhase: 'any',
        detail: `invalid images: expected array, got ${typeof filtered.images}`,
      });
      filtered.images = initialScanState.images;
    }

    if ('creditStatus' in filtered && (typeof filtered.creditStatus !== 'string' || !VALID_CREDIT_STATUSES.has(filtered.creditStatus))) {
      logGuardViolation({
        action: 'restoreState',
        currentPhase: get().phase,
        expectedPhase: 'any',
        detail: `invalid creditStatus: ${String(filtered.creditStatus)}`,
      });
      filtered.creditStatus = initialScanState.creditStatus;
    }

    if ((filtered as Partial<ScanState>).phase === 'scanning') {
      set(
        { ...initialScanState, ...filtered, phase: 'error', creditStatus: 'refunded',
          error: 'Escaneo interrumpido. Intenta de nuevo.' } as Partial<ScanState>,
        undefined, 'scan/restoreState'
      );
      return;
    }
    set({ ...initialScanState, ...filtered } as Partial<ScanState>, undefined, 'scan/restoreState');
  },
});
