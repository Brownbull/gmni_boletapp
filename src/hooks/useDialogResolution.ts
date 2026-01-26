/**
 * Story 14d.6: Dialog Resolution Observer Hook
 *
 * Provides a way for App.tsx to react to dialog resolutions from ScanContext.
 * This enables the migration from local state to context-based dialog management.
 *
 * The hook observes the activeDialog state and calls the appropriate callback
 * when a dialog is resolved or dismissed.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * useDialogResolution({
 *   onCurrencyMismatchResolved: (result) => {
 *     if (result.choice === 'detected') handleCurrencyUseDetected();
 *     else if (result.choice === 'default') handleCurrencyUseDefault();
 *   },
 *   onCurrencyMismatchDismissed: () => handleCurrencyMismatchCancel(),
 * });
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
// Story 14e-11: Migrated from useScanOptional (ScanContext) to Zustand store
import { useScanActiveDialog, useScanActions } from '@features/scan/store';
import {
  DIALOG_TYPES,
  type ScanDialogType,
  type CurrencyMismatchDialogData,
  type TotalMismatchDialogData,
  type QuickSaveDialogData,
  type ScanCompleteDialogData,
} from '../types/scanStateMachine';

// =============================================================================
// Resolution Types
// =============================================================================

export interface CurrencyMismatchResult {
  choice: 'detected' | 'default';
}

export interface TotalMismatchResult {
  choice: 'items_sum' | 'original';
}

export interface QuickSaveResult {
  choice: 'save' | 'edit' | 'cancel';
}

export interface ScanCompleteResult {
  choice: 'save' | 'edit';
}

// =============================================================================
// Hook Options
// =============================================================================

export interface UseDialogResolutionOptions {
  /**
   * Called when currency mismatch dialog is resolved with user's choice.
   * Also receives the dialog data that was active when resolved.
   */
  onCurrencyMismatchResolved?: (
    result: CurrencyMismatchResult,
    data: CurrencyMismatchDialogData
  ) => void;

  /**
   * Called when currency mismatch dialog is dismissed without resolution.
   * Also receives the dialog data that was active when dismissed.
   */
  onCurrencyMismatchDismissed?: (data: CurrencyMismatchDialogData) => void;

  /**
   * Called when total mismatch dialog is resolved with user's choice.
   */
  onTotalMismatchResolved?: (
    result: TotalMismatchResult,
    data: TotalMismatchDialogData
  ) => void;

  /**
   * Called when total mismatch dialog is dismissed without resolution.
   */
  onTotalMismatchDismissed?: (data: TotalMismatchDialogData) => void;

  /**
   * Called when quicksave dialog is resolved with user's choice.
   */
  onQuickSaveResolved?: (result: QuickSaveResult, data: QuickSaveDialogData) => void;

  /**
   * Called when quicksave dialog is dismissed without resolution.
   */
  onQuickSaveDismissed?: (data: QuickSaveDialogData) => void;

  /**
   * Called when scan complete dialog is resolved with user's choice.
   */
  onScanCompleteResolved?: (
    result: ScanCompleteResult,
    data: ScanCompleteDialogData
  ) => void;

  /**
   * Called when scan complete dialog is dismissed without resolution.
   */
  onScanCompleteDismissed?: (data: ScanCompleteDialogData) => void;
}

// =============================================================================
// Internal State Tracking
// =============================================================================

interface DialogSnapshot {
  type: ScanDialogType;
  data: unknown;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Observer hook for dialog resolutions.
 *
 * This hook tracks the activeDialog state in ScanContext and detects when:
 * 1. A dialog transitions from active to null (resolved or dismissed)
 * 2. A new dialog replaces the current one (edge case)
 *
 * It then calls the appropriate callback based on the dialog type.
 *
 * Note: The hook doesn't know whether the dialog was "resolved" vs "dismissed"
 * from the state alone. The components call resolveDialog with a result or
 * dismissDialog without. For simplicity, we track the last resolution result
 * via a ref that components can update.
 */
export function useDialogResolution(options: UseDialogResolutionOptions): void {
  // Story 14e-11: Use Zustand selector (always available, no provider boundary)
  const activeDialog = useScanActiveDialog();

  // Track the previous dialog to detect transitions
  const prevDialogRef = useRef<DialogSnapshot | null>(null);

  // Store callbacks in ref to avoid triggering effect on callback changes
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const currentDialog = activeDialog;
    const prevDialog = prevDialogRef.current;

    // Case 1: Dialog closed (was open, now null)
    if (prevDialog && !currentDialog) {
      const { type, data } = prevDialog;

      // Determine if this was a resolution or dismissal
      // For now, we treat all closures as dismissals
      // The components will call the prop callbacks for resolutions
      // This is a bridge pattern - eventually we'll track resolution results

      switch (type) {
        case DIALOG_TYPES.CURRENCY_MISMATCH:
          optionsRef.current.onCurrencyMismatchDismissed?.(
            data as CurrencyMismatchDialogData
          );
          break;
        case DIALOG_TYPES.TOTAL_MISMATCH:
          optionsRef.current.onTotalMismatchDismissed?.(data as TotalMismatchDialogData);
          break;
        case DIALOG_TYPES.QUICKSAVE:
          optionsRef.current.onQuickSaveDismissed?.(data as QuickSaveDialogData);
          break;
        case DIALOG_TYPES.SCAN_COMPLETE:
          optionsRef.current.onScanCompleteDismissed?.(data as ScanCompleteDialogData);
          break;
      }
    }

    // Update ref to current state
    prevDialogRef.current = currentDialog
      ? { type: currentDialog.type, data: currentDialog.data }
      : null;
  }, [activeDialog]);
}

/**
 * Convenience hook to get the current dialog state with typed data.
 *
 * Returns null if no dialog is active or if outside ScanProvider.
 * Returns typed dialog data if a dialog is active.
 *
 * @example
 * ```tsx
 * const dialog = useActiveDialog();
 * if (dialog?.type === 'currency_mismatch') {
 *   const data = dialog.data; // typed as CurrencyMismatchDialogData
 * }
 * ```
 */
export function useActiveDialog():
  | { type: 'currency_mismatch'; data: CurrencyMismatchDialogData }
  | { type: 'total_mismatch'; data: TotalMismatchDialogData }
  | { type: 'quicksave'; data: QuickSaveDialogData }
  | { type: 'scan_complete'; data: ScanCompleteDialogData }
  | null {
  // Story 14e-11: Use Zustand selector (always available, no provider boundary)
  const activeDialog = useScanActiveDialog();

  if (!activeDialog) return null;

  const { type, data } = activeDialog;

  switch (type) {
    case DIALOG_TYPES.CURRENCY_MISMATCH:
      return { type: 'currency_mismatch', data: data as CurrencyMismatchDialogData };
    case DIALOG_TYPES.TOTAL_MISMATCH:
      return { type: 'total_mismatch', data: data as TotalMismatchDialogData };
    case DIALOG_TYPES.QUICKSAVE:
      return { type: 'quicksave', data: data as QuickSaveDialogData };
    case DIALOG_TYPES.SCAN_COMPLETE:
      return { type: 'scan_complete', data: data as ScanCompleteDialogData };
    default:
      return null;
  }
}

/**
 * Get showDialog action with typed data parameters.
 * This is a convenience wrapper around the Zustand store's showDialog.
 * Story 14e-11: Migrated from ScanContext to Zustand store.
 *
 * @returns Object with typed showDialog methods (always available with Zustand)
 */
export function useDialogActions() {
  // Story 14e-11: Use Zustand actions (always available, no provider boundary)
  const { showDialog, dismissDialog: dismissDialogAction } = useScanActions();

  const showCurrencyMismatchDialog = useCallback(
    (data: CurrencyMismatchDialogData) => {
      showDialog({ type: DIALOG_TYPES.CURRENCY_MISMATCH, data });
    },
    [showDialog]
  );

  const showTotalMismatchDialog = useCallback(
    (data: TotalMismatchDialogData) => {
      showDialog({ type: DIALOG_TYPES.TOTAL_MISMATCH, data });
    },
    [showDialog]
  );

  const showQuickSaveDialog = useCallback(
    (data: QuickSaveDialogData) => {
      showDialog({ type: DIALOG_TYPES.QUICKSAVE, data });
    },
    [showDialog]
  );

  const showScanCompleteDialog = useCallback(
    (data: ScanCompleteDialogData) => {
      showDialog({ type: DIALOG_TYPES.SCAN_COMPLETE, data });
    },
    [showDialog]
  );

  const dismissDialog = useCallback(() => {
    dismissDialogAction();
  }, [dismissDialogAction]);

  // Story 14e-11: Zustand store is always available, no need for null check
  return {
    showCurrencyMismatchDialog,
    showTotalMismatchDialog,
    showQuickSaveDialog,
    showScanCompleteDialog,
    dismissDialog,
  };
}
