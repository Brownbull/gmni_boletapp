/**
 * Story 14d.4a: Scan State Bridge Layer
 *
 * Bridge hook that synchronizes App.tsx local state with ScanContext state machine.
 * This is the foundation for incremental migration - App.tsx continues using local
 * state setters while ScanContext state is populated via the bridge.
 *
 * Architecture:
 * - App.tsx local state remains source of truth during migration
 * - Bridge reads local state and dispatches to ScanContext
 * - Components can start reading from ScanContext via useScan()
 * - After Story 14d.4b migrates consumers, we can flip the direction
 *
 * This hook is intentionally "read-only" from App.tsx perspective:
 * - It observes local state changes
 * - It dispatches to populate ScanContext
 * - It does NOT modify local state
 *
 * @example
 * ```tsx
 * // In App.tsx - pass local state to bridge
 * useScanStateBridge({
 *   images: scanImages,
 *   error: scanError,
 *   isAnalyzing,
 *   pendingScan,
 * });
 * ```
 */

import { useEffect, useRef } from 'react';
import { useScanOptional } from '../contexts/ScanContext';
import type { ScanPhase } from '../types/scanStateMachine';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape from App.tsx that the bridge observes.
 *
 * Note: Using minimal fields needed for phase derivation.
 * Additional fields can be added as migration progresses.
 */
export interface BridgeLocalState {
  /** Current images from scanImages state */
  images: string[];

  /** Error message from scanError state */
  error: string | null;

  /** isAnalyzing flag - true when API call in progress */
  isAnalyzing: boolean;

  /** pendingScan object - contains full scan state */
  pendingScan: {
    /** PendingScanStatus: 'images_added' | 'analyzing' | 'analyzed' | 'error' */
    status: 'images_added' | 'analyzing' | 'analyzed' | 'error';
    images: string[];
    analyzedTransaction: unknown | null;
    error?: string | null;
  } | null;

  // === Story 14d.4b: Dialog state syncing ===

  /** Currency mismatch dialog state */
  showCurrencyMismatch?: boolean;
  currencyMismatchData?: {
    detectedCurrency: string;
    pendingTransaction: unknown;
    hasDiscrepancy?: boolean;
  } | null;

  /** Total mismatch dialog state */
  showTotalMismatch?: boolean;
  totalMismatchData?: {
    validationResult: unknown;
    pendingTransaction: unknown;
    parsedItems?: unknown[];
  } | null;

  /** QuickSave card state */
  showQuickSaveCard?: boolean;
  quickSaveTransaction?: unknown | null;
  quickSaveConfidence?: number;

  /** ScanComplete modal state (controlled by skipScanCompleteModal) */
  /** Note: ScanCompleteModal visibility is derived from other state in TransactionEditorView */

  // === Story 14d.6: Dialog control mode ===

  /**
   * When true, dialogs are controlled via showDialog()/dismissDialog() in context.
   * The bridge will NOT sync local dialog state to context.
   * This is the target state after 14d.6 migration completes.
   */
  useContextDialogs?: boolean;

  // === Story 14d.5: Batch state syncing ===

  /** True if batch capture mode is active */
  isBatchCaptureMode?: boolean;

  /** Batch images captured (separate from single-scan images) */
  batchImages?: string[];

  /** Batch processing state from useBatchProcessing hook */
  batchProcessing?: {
    isProcessing: boolean;
    progress: { current: number; total: number };
    states: Array<{
      id: string;
      index: number;
      status: 'pending' | 'processing' | 'ready' | 'error';
      error?: string;
    }>;
  };

  /** Batch review results (processed transactions) */
  batchReviewResults?: Array<{
    id: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }>;
}

// =============================================================================
// Phase Derivation Logic
// =============================================================================

/**
 * Derive ScanContext phase from App.tsx local state.
 *
 * Phase mapping (from story spec):
 * | Local State                                          | ScanContext Phase |
 * |------------------------------------------------------|-------------------|
 * | !isAnalyzing && !scanError && scanImages.length === 0| 'idle'            |
 * | scanImages.length > 0 && !isAnalyzing                | 'capturing'       |
 * | isAnalyzing                                          | 'scanning'        |
 * | !isAnalyzing && pendingScan?.analyzedTransaction     | 'reviewing'       |
 * | scanError                                            | 'error'           |
 *
 * Story 14d.5: Batch mode extensions:
 * | isBatchCaptureMode && !batchProcessing.isProcessing  | 'capturing'       |
 * | batchProcessing.isProcessing                         | 'scanning'        |
 * | batchReviewResults.length > 0                        | 'reviewing'       |
 */
function derivePhaseFromLocal(local: BridgeLocalState): ScanPhase {
  // Error state takes precedence
  if (local.error || local.pendingScan?.error) {
    return 'error';
  }

  // Story 14d.5: Batch mode phase derivation
  if (local.isBatchCaptureMode) {
    // Batch processing = scanning phase
    if (local.batchProcessing?.isProcessing) {
      return 'scanning';
    }

    // Has batch review results = reviewing phase
    if (local.batchReviewResults && local.batchReviewResults.length > 0) {
      return 'reviewing';
    }

    // Batch capture mode active with images = capturing phase
    if (local.batchImages && local.batchImages.length > 0) {
      return 'capturing';
    }

    // Batch mode active but no images yet = still capturing (not idle)
    return 'capturing';
  }

  // Single scan mode phase derivation (original logic)

  // Analyzing = scanning phase (API call in progress)
  if (local.isAnalyzing) {
    return 'scanning';
  }

  // Has analyzed transaction = reviewing phase
  if (local.pendingScan?.analyzedTransaction) {
    return 'reviewing';
  }

  // Has images but not analyzing = capturing phase
  if (local.images.length > 0 || (local.pendingScan?.images?.length ?? 0) > 0) {
    return 'capturing';
  }

  // Default to idle
  return 'idle';
}

/**
 * Story 14d.5: Derive scan mode from local state.
 */
function deriveModeFromLocal(local: BridgeLocalState): 'single' | 'batch' | 'statement' {
  if (local.isBatchCaptureMode) {
    return 'batch';
  }
  return 'single';
}

// =============================================================================
// Bridge Hook
// =============================================================================

/**
 * Bridge hook that syncs App.tsx local state to ScanContext.
 *
 * Features:
 * - No-op when ScanContext is not available (graceful degradation)
 * - Uses refs to prevent infinite update loops
 * - Only dispatches when state actually changes
 * - Derives phase from multiple local state flags
 *
 * @param localState - Current local state from App.tsx
 */
export function useScanStateBridge(localState: BridgeLocalState): void {
  const scanContext = useScanOptional();

  // Refs for comparison to prevent infinite loops
  // We compare string versions to avoid object reference issues
  const prevImagesRef = useRef<string>('');
  const prevErrorRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<ScanPhase>('idle');
  // Story 14d.4b: Track dialog state to prevent infinite loops
  const prevDialogKeyRef = useRef<string | null>(null);
  // Story 14d.5: Track batch mode state
  const prevBatchModeRef = useRef<boolean>(false);
  const prevBatchImagesRef = useRef<string>('');
  const prevBatchProgressRef = useRef<string>('');

  useEffect(() => {
    // No-op if ScanContext is not available
    // This allows the bridge to be used safely before ScanProvider is mounted
    if (!scanContext) {
      return;
    }

    const { setImages, processError, reset, state, showDialog, dismissDialog } = scanContext;

    // Derive current phase from local state
    const derivedPhase = derivePhaseFromLocal(localState);

    // Determine which images to sync (prefer pendingScan.images if available)
    const effectiveImages = localState.pendingScan?.images ?? localState.images;
    // M1 fix: Use length + first image prefix as quick key to avoid expensive full JSON.stringify
    // on large base64 images. Full comparison only if quick key matches but content might differ.
    const imagesKey =
      effectiveImages.length === 0
        ? ''
        : `${effectiveImages.length}:${effectiveImages[0]?.substring(0, 50) ?? ''}`;

    // Determine effective error
    const effectiveError = localState.error ?? localState.pendingScan?.error ?? null;

    // === Sync Images ===
    // Only sync if images actually changed
    if (imagesKey !== prevImagesRef.current) {
      // Only dispatch SET_IMAGES if we're in a phase that allows it
      // The state machine only accepts SET_IMAGES in 'capturing' phase
      // But during bridge mode, we need to be more lenient
      if (effectiveImages.length > 0 || state.images.length > 0) {
        // Dev-mode logging for debugging
        if (import.meta.env.DEV) {
          console.debug(
            '[ScanStateBridge] Images changed:',
            effectiveImages.length,
            'context phase:',
            state.phase
          );
        }
        // Note: We only sync images during capturing phase per state machine rules
        // If phase doesn't match, the reducer will ignore the action (which is fine)
        if (state.phase === 'capturing' || state.phase === 'idle') {
          setImages(effectiveImages);
        }
      }
      prevImagesRef.current = imagesKey;
    }

    // === Sync Error ===
    // Only sync if error actually changed
    if (effectiveError !== prevErrorRef.current) {
      if (effectiveError && !state.error) {
        if (import.meta.env.DEV) {
          console.debug('[ScanStateBridge] Error changed:', effectiveError);
        }
        // Error triggers PROCESS_ERROR which requires 'scanning' phase
        // During bridge, we accept that this may be ignored
        processError(effectiveError);
      }
      prevErrorRef.current = effectiveError;
    }

    // === Phase Sync ===
    // We don't directly dispatch phase changes - the phase is derived
    // by consumers calling useScan(). However, we log for debugging.
    if (derivedPhase !== prevPhaseRef.current) {
      if (import.meta.env.DEV) {
        console.debug(
          '[ScanStateBridge] Derived phase changed:',
          prevPhaseRef.current,
          '→',
          derivedPhase,
          '| Context phase:',
          state.phase
        );
      }

      // If local state went to idle (scan completed or cancelled)
      // and context is not idle, reset it
      if (derivedPhase === 'idle' && state.phase !== 'idle') {
        reset();
      }

      prevPhaseRef.current = derivedPhase;
    }

    // === Story 14d.5: Sync Batch State ===
    const isBatchMode = !!localState.isBatchCaptureMode;
    const batchImages = localState.batchImages ?? [];
    const batchImagesKey =
      batchImages.length === 0
        ? ''
        : `${batchImages.length}:${batchImages[0]?.substring(0, 50) ?? ''}`;

    // Mode change detection (single → batch or batch → single)
    if (isBatchMode !== prevBatchModeRef.current) {
      if (import.meta.env.DEV) {
        console.debug(
          '[ScanStateBridge] Batch mode changed:',
          prevBatchModeRef.current,
          '→',
          isBatchMode
        );
      }

      // If entering batch mode, dispatch START_BATCH
      // If leaving batch mode, the reset below will handle cleanup
      // Note: We don't auto-dispatch START_BATCH here because that requires userId
      // The START_BATCH action should be dispatched explicitly by the component that initiates batch mode
      // Instead, we just track the mode change for logging

      prevBatchModeRef.current = isBatchMode;
    }

    // Sync batch images (separate from single scan images)
    if (isBatchMode && batchImagesKey !== prevBatchImagesRef.current) {
      if (import.meta.env.DEV) {
        console.debug(
          '[ScanStateBridge] Batch images changed:',
          batchImages.length,
          'context phase:',
          state.phase
        );
      }
      // Note: For batch mode, images are managed via the batch progress system
      // The state machine batch progress is updated via BATCH_ITEM_* actions
      // For now, we sync the images to state.images if in capturing phase
      if (state.phase === 'capturing' || state.phase === 'idle') {
        setImages(batchImages);
      }
      prevBatchImagesRef.current = batchImagesKey;
    }

    // Sync batch processing progress
    if (localState.batchProcessing) {
      const progressKey = `${localState.batchProcessing.progress.current}/${localState.batchProcessing.progress.total}:${localState.batchProcessing.isProcessing}`;
      if (progressKey !== prevBatchProgressRef.current) {
        if (import.meta.env.DEV) {
          console.debug(
            '[ScanStateBridge] Batch progress:',
            progressKey,
            'states:',
            localState.batchProcessing.states.length
          );
        }
        // Note: Individual BATCH_ITEM_* actions are dispatched by the processing hook
        // We just track the progress changes for debugging during bridge mode
        prevBatchProgressRef.current = progressKey;
      }
    }

    // === Story 14d.4b/14d.6: Sync Dialog State ===
    // Story 14d.6: Skip syncing when useContextDialogs is enabled
    // In that mode, App.tsx uses showDialog()/dismissDialog() directly
    if (!localState.useContextDialogs) {
      // Determine which dialog is currently active in local state
      let currentDialogKey: string | null = null;
      let dialogType: 'currency_mismatch' | 'total_mismatch' | 'quicksave' | null = null;
      let dialogData: unknown = null;

      if (localState.showCurrencyMismatch && localState.currencyMismatchData) {
        currentDialogKey = `currency_mismatch:${localState.currencyMismatchData.detectedCurrency}`;
        dialogType = 'currency_mismatch';
        dialogData = localState.currencyMismatchData;
      } else if (localState.showTotalMismatch && localState.totalMismatchData) {
        currentDialogKey = 'total_mismatch';
        dialogType = 'total_mismatch';
        dialogData = localState.totalMismatchData;
      } else if (localState.showQuickSaveCard && localState.quickSaveTransaction) {
        currentDialogKey = 'quicksave';
        dialogType = 'quicksave';
        dialogData = {
          transaction: localState.quickSaveTransaction,
          confidence: localState.quickSaveConfidence ?? 0,
        };
      }

      // Sync dialog state if changed
      if (currentDialogKey !== prevDialogKeyRef.current) {
        if (import.meta.env.DEV) {
          console.debug(
            '[ScanStateBridge] Dialog changed:',
            prevDialogKeyRef.current,
            '→',
            currentDialogKey
          );
        }

        if (dialogType && dialogData) {
          // Show the dialog in ScanContext
          showDialog(dialogType, dialogData);
        } else if (prevDialogKeyRef.current !== null && state.activeDialog) {
          // Dialog was closed in local state - dismiss in context
          dismissDialog();
        }

        prevDialogKeyRef.current = currentDialogKey;
      }
    }
    // M3: Dependencies are correct - scanContext contains memoized callbacks (useCallback)
    // and state (useMemo), so we can safely depend on the context object reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localState, scanContext]);
}

// =============================================================================
// Debug Hook (Development Only)
// =============================================================================

/**
 * Debug hook that logs state comparison between local and context.
 * Only active in development mode.
 *
 * M4: This hook is exported for optional debugging during development.
 * Call alongside useScanStateBridge when debugging state sync issues:
 *
 * @example
 * ```tsx
 * // In App.tsx during debugging (remove after investigation)
 * useScanStateBridge(bridgeState);
 * useScanStateBridgeDebug(bridgeState); // Add this line to see phase mismatches
 * ```
 *
 * @param localState - Local state from App.tsx
 */
export function useScanStateBridgeDebug(localState: BridgeLocalState): void {
  const scanContext = useScanOptional();

  useEffect(() => {
    if (!import.meta.env.DEV || !scanContext) return;

    const derivedPhase = derivePhaseFromLocal(localState);
    const contextPhase = scanContext.state.phase;

    const derivedMode = deriveModeFromLocal(localState);
    const contextMode = scanContext.state.mode;

    // Only log when there's a mismatch
    if (derivedPhase !== contextPhase || derivedMode !== contextMode) {
      console.warn(
        '[ScanStateBridge] State mismatch:',
        '\n  Local phase (derived):',
        derivedPhase,
        '\n  Context phase (actual):',
        contextPhase,
        '\n  Local mode:',
        derivedMode,
        '\n  Context mode:',
        contextMode,
        '\n  Local state:',
        {
          imagesCount: localState.images.length,
          isAnalyzing: localState.isAnalyzing,
          error: localState.error,
          pendingScanStatus: localState.pendingScan?.status,
          // Story 14d.5: Batch state debug info
          isBatchCaptureMode: localState.isBatchCaptureMode,
          batchImagesCount: localState.batchImages?.length ?? 0,
          batchIsProcessing: localState.batchProcessing?.isProcessing,
          batchResultsCount: localState.batchReviewResults?.length ?? 0,
        }
      );
    }
  }, [localState, scanContext]);
}
