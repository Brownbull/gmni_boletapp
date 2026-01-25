/**
 * Story 14c-refactor.21: useDialogHandlers Hook
 *
 * Extracts dialog/modal handlers from App.tsx into a reusable hook.
 * Handles toast notifications and transaction conflict dialogs.
 *
 * Features:
 * - Toast notification management with auto-dismiss
 * - Transaction conflict dialog state and handlers
 * - Unified modal management pattern
 *
 * Story 14e-4: Credit info modal moved to Modal Manager.
 * Use `openModal('creditInfo', {...})` instead of this hook for credit info.
 *
 * Architecture Reference: Epic 14c-refactor - App.tsx Handler Extraction
 * Dependencies:
 * - ScanContext (for scanState access)
 * - React state management
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     // Toast
 *     toastMessage,
 *     setToastMessage,
 *     showToast,
 *     // Conflict Dialog
 *     showConflictDialog,
 *     conflictDialogData,
 *     handleConflictClose,
 *     handleConflictViewCurrent,
 *     handleConflictDiscard,
 *   } = useDialogHandlers({
 *     scanState,
 *     setCurrentTransaction,
 *     setScanImages,
 *     createDefaultTransaction,
 *     setTransactionEditorMode,
 *     navigateToView,
 *   });
 *
 *   return (
 *     <>
 *       {toastMessage && <Toast message={toastMessage} />}
 *       <TransactionConflictDialog
 *         isOpen={showConflictDialog}
 *         onClose={handleConflictClose}
 *         onViewCurrent={handleConflictViewCurrent}
 *         onDiscard={handleConflictDiscard}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Transaction } from '../../types/transaction';
import type { ScanState } from '../../types/scanStateMachine';
import type { ConflictingTransaction, ConflictReason } from '../../components/dialogs/TransactionConflictDialog';
import type { View } from '../../components/App';

// =============================================================================
// Types
// =============================================================================

/**
 * Toast message configuration
 */
export interface ToastMessage {
    text: string;
    type: 'success' | 'info';
}

/**
 * Conflict dialog data structure
 */
export interface ConflictDialogData {
    conflictingTransaction: ConflictingTransaction;
    conflictReason: ConflictReason;
    pendingAction: {
        mode: 'new' | 'existing';
        transaction?: Transaction | null;
    };
}

/**
 * Props for useDialogHandlers hook
 */
export interface UseDialogHandlersProps {
    /** Current scan state (for conflict dialog handlers) */
    scanState: ScanState;
    /** Set current transaction */
    setCurrentTransaction: (tx: Transaction | null) => void;
    /** Set scan images (used to clear scan state) */
    setScanImages: (images: string[] | ((prev: string[]) => string[])) => void;
    /** Create default transaction factory */
    createDefaultTransaction: () => Transaction;
    /** Set transaction editor mode */
    setTransactionEditorMode: (mode: 'new' | 'existing') => void;
    /** Navigate to a view */
    navigateToView: (view: View) => void;
    /** Auto-dismiss timeout for toasts (default: 3000ms) */
    toastAutoHideMs?: number;
}

/**
 * Result returned by useDialogHandlers
 */
export interface UseDialogHandlersResult {
    // ===========================================================================
    // Toast State & Handlers
    // ===========================================================================
    /** Current toast message (null if none) */
    toastMessage: ToastMessage | null;
    /** Set toast message directly */
    setToastMessage: (msg: ToastMessage | null) => void;
    /**
     * Show a toast notification.
     * @param text - Toast message text
     * @param type - Toast type ('success' or 'info')
     */
    showToast: (text: string, type: 'success' | 'info') => void;

    // ===========================================================================
    // Conflict Dialog State & Handlers
    // Story 14e-4: Credit info modal moved to Modal Manager (openModal('creditInfo', {...}))
    // ===========================================================================
    /** Whether conflict dialog is open */
    showConflictDialog: boolean;
    /** Set conflict dialog visibility */
    setShowConflictDialog: (show: boolean) => void;
    /** Conflict dialog data (conflicting transaction, reason, pending action) */
    conflictDialogData: ConflictDialogData | null;
    /** Set conflict dialog data */
    setConflictDialogData: (data: ConflictDialogData | null) => void;
    /** Close conflict dialog without action */
    handleConflictClose: () => void;
    /** Navigate to the conflicting transaction */
    handleConflictViewCurrent: () => void;
    /** Discard conflicting transaction and proceed with pending action */
    handleConflictDiscard: () => void;
    /**
     * Open conflict dialog with data.
     * @param conflictingTransaction - The transaction that conflicts
     * @param conflictReason - Why there's a conflict
     * @param pendingAction - The action the user was trying to perform
     */
    openConflictDialog: (
        conflictingTransaction: ConflictingTransaction,
        conflictReason: ConflictReason,
        pendingAction: ConflictDialogData['pendingAction']
    ) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook that provides dialog/modal handlers extracted from App.tsx.
 *
 * Handles:
 * - Toast notifications with auto-dismiss
 * - Credit info modal state
 * - Transaction conflict dialog state and actions
 */
export function useDialogHandlers(props: UseDialogHandlersProps): UseDialogHandlersResult {
    const {
        scanState,
        setCurrentTransaction,
        setScanImages,
        createDefaultTransaction,
        setTransactionEditorMode,
        navigateToView,
        toastAutoHideMs = 3000,
    } = props;

    // ===========================================================================
    // Toast State
    // ===========================================================================

    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

    // Auto-dismiss toast after timeout
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), toastAutoHideMs);
            return () => clearTimeout(timer);
        }
    }, [toastMessage, toastAutoHideMs]);

    /**
     * Show a toast notification.
     */
    const showToast = useCallback((text: string, type: 'success' | 'info') => {
        setToastMessage({ text, type });
    }, []);

    // ===========================================================================
    // Conflict Dialog State
    // Story 14e-4: Credit info modal moved to Modal Manager (openModal('creditInfo', {...}))
    // ===========================================================================

    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [conflictDialogData, setConflictDialogData] = useState<ConflictDialogData | null>(null);

    /**
     * Open conflict dialog with data.
     */
    const openConflictDialog = useCallback((
        conflictingTransaction: ConflictingTransaction,
        conflictReason: ConflictReason,
        pendingAction: ConflictDialogData['pendingAction']
    ) => {
        setConflictDialogData({
            conflictingTransaction,
            conflictReason,
            pendingAction,
        });
        setShowConflictDialog(true);
    }, []);

    /**
     * Story 14.24: Close conflict dialog without doing anything (stay on current view).
     */
    const handleConflictClose = useCallback(() => {
        setShowConflictDialog(false);
        setConflictDialogData(null);
    }, []);

    /**
     * Story 14d.4e: Navigate to the conflicting transaction (in transaction-editor).
     */
    const handleConflictViewCurrent = useCallback(() => {
        setShowConflictDialog(false);
        setConflictDialogData(null);

        // The scan is still active, just navigate to it
        // Story 14d.4e: Use scanState.results[0] instead of pendingScan.analyzedTransaction
        if (scanState.results.length > 0) {
            setCurrentTransaction(scanState.results[0]);
        }
        setTransactionEditorMode('new');
        // Story 14d.4c: scanButtonState derived from phase - state machine preserves phase
        navigateToView('transaction-editor');
    }, [scanState.results, setCurrentTransaction, setTransactionEditorMode, navigateToView]);

    /**
     * Story 14d.4e: Discard the conflicting transaction and proceed with the pending action.
     */
    const handleConflictDiscard = useCallback(() => {
        setShowConflictDialog(false);

        // Clear the conflicting pending scan
        // Story 14d.4c: setScanImages([]) triggers reset to idle phase
        setCurrentTransaction(null);
        setScanImages([]);

        // If we had reserved credits, they're lost (already confirmed to Firestore)
        // This is expected - user chose to discard knowing they'd lose the credit

        // Now execute the pending action
        if (conflictDialogData?.pendingAction) {
            const { mode, transaction } = conflictDialogData.pendingAction;
            setConflictDialogData(null);

            // Call navigateToTransactionEditor directly without conflict check
            // (we just cleared the conflict)
            setTransactionEditorMode(mode);
            // Story 14d.4c: scanButtonState derived from phase
            if (transaction) {
                setCurrentTransaction(transaction as Transaction);
            } else if (mode === 'new') {
                setCurrentTransaction(createDefaultTransaction());
            }
            navigateToView('transaction-editor');
        } else {
            setConflictDialogData(null);
        }
    }, [
        conflictDialogData,
        setCurrentTransaction,
        setScanImages,
        setTransactionEditorMode,
        createDefaultTransaction,
        navigateToView,
    ]);

    // ===========================================================================
    // Return Result
    // ===========================================================================

    // Story 14c-refactor.25: Memoize return object for ViewHandlersContext stability
    // Story 14e-4: Credit info modal removed - now uses Modal Manager
    return useMemo<UseDialogHandlersResult>(
        () => ({
            // Toast
            toastMessage,
            setToastMessage,
            showToast,
            // Conflict Dialog
            showConflictDialog,
            setShowConflictDialog,
            conflictDialogData,
            setConflictDialogData,
            handleConflictClose,
            handleConflictViewCurrent,
            handleConflictDiscard,
            openConflictDialog,
        }),
        [
            toastMessage,
            setToastMessage,
            showToast,
            showConflictDialog,
            setShowConflictDialog,
            conflictDialogData,
            setConflictDialogData,
            handleConflictClose,
            handleConflictViewCurrent,
            handleConflictDiscard,
            openConflictDialog,
        ]
    );
}
