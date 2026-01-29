/**
 * Story 14e-28: useTransactionEditorHandlers Hook
 *
 * Extracts all TransactionEditorView handlers from App.tsx.
 * This hook encapsulates business logic for:
 * - Save/Cancel operations with batch mode routing
 * - Scan processing (photo select, process, retry, rescan)
 * - Batch/List navigation (prev/next)
 * - Group membership changes
 * - Read-only to edit mode conversion
 *
 * Architecture:
 * - Uses Zustand stores directly: ScanStore, NavigationStore, BatchReviewStore
 * - Accesses services via props (user, services)
 * - Returns handlers and computed navigation state
 *
 * Dependencies:
 * - @features/scan/store - ScanStore for scan state and actions
 * - @features/batch-review - BatchReviewStore for batch actions
 * - @/shared/stores - NavigationStore for view navigation
 * - @managers/ModalManager - Modal actions
 *
 * @example
 * ```tsx
 * function TransactionEditorView(props) {
 *   const handlers = useTransactionEditorHandlers({
 *     user,
 *     services,
 *     currentTransaction,
 *     setCurrentTransaction,
 *     transactionNavigationList,
 *     transactions,
 *     // ... other required props
 *   });
 *
 *   return (
 *     <button onClick={handlers.handleSave}>Save</button>
 *   );
 * }
 * ```
 */

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Transaction } from '@/types/transaction';

// Store imports
import {
    useScanStore,
    useScanActions,
} from '@features/scan/store';
import { batchReviewActions } from '@features/batch-review';
import { useNavigationActions } from '@/shared/stores';

// Service imports
import { updateMemberTimestampsForTransaction } from '@/services/sharedGroupService';

// =============================================================================
// Types
// =============================================================================

/**
 * Props for useTransactionEditorHandlers hook.
 * These come from App.tsx state that needs coordination.
 */
export interface UseTransactionEditorHandlersProps {
    // User and auth
    user: User | null;
    db: Firestore;

    // Transaction state (App.tsx managed)
    currentTransaction: Transaction | null;
    setCurrentTransaction: (tx: Transaction | null) => void;
    transactionEditorMode: 'new' | 'existing';
    setTransactionEditorMode: (mode: 'new' | 'existing') => void;
    setIsViewingReadOnly: (value: boolean) => void;

    // Transaction data for list navigation
    transactions: Transaction[];
    transactionNavigationList: string[] | null;
    setTransactionNavigationList: (list: string[] | null) => void;

    // UI state
    isTransactionSaving: boolean;
    setIsTransactionSaving: (value: boolean) => void;
    setAnimateEditViewItems: (value: boolean) => void;
    setCreditUsedInSession: (value: boolean) => void;

    // Transaction handlers from useTransactionHandlers
    saveTransaction: (tx: Transaction) => Promise<string | void>;
    deleteTransaction: (id: string) => void;

    // Scan handlers from useScanHandlers
    processScan: (images?: string[]) => void;
    handleRescan: () => Promise<void>;

    // Conflict detection
    hasActiveTransactionConflict: () => { hasConflict: boolean; reason?: string };
}

/**
 * Return type for useTransactionEditorHandlers hook.
 */
export interface UseTransactionEditorHandlersReturn {
    // Core transaction operations
    handleUpdateTransaction: (transaction: Transaction) => void;
    handleSave: (transaction: Transaction) => Promise<void>;
    handleCancel: () => void;
    handleDelete: ((id: string) => void) | undefined;

    // Scan operations
    handlePhotoSelect: (file: File) => void;
    handleProcessScan: () => void;
    handleRetry: () => void;
    handleRescan: (() => Promise<void>) | undefined;

    // Batch/List navigation
    handleBatchPrevious: (() => void) | undefined;
    handleBatchNext: (() => void) | undefined;
    handleBatchModeClick: () => void;

    // Group operations
    handleGroupsChange: (groupIds: string[]) => Promise<void>;

    // Read-only mode
    handleRequestEdit: () => void;

    // Navigation context (computed values)
    canNavigatePrevious: boolean;
    canNavigateNext: boolean;
    navigationLabel: string | null;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useTransactionEditorHandlers - Extracts all TransactionEditorView handlers.
 *
 * CRITICAL: This hook contains business logic previously in App.tsx.
 * All handlers coordinate with:
 * - ScanStore (Zustand) for scan state
 * - BatchReviewStore (Zustand) for batch operations
 * - NavigationStore (Zustand) for view changes
 * - Props for App-level state that needs coordination
 *
 * @param props - Handler dependencies from App.tsx
 * @returns UseTransactionEditorHandlersReturn - All handlers and computed state
 */
export function useTransactionEditorHandlers(
    props: UseTransactionEditorHandlersProps
): UseTransactionEditorHandlersReturn {
    const {
        user,
        db,
        currentTransaction,
        setCurrentTransaction,
        transactionEditorMode,
        setTransactionEditorMode,
        setIsViewingReadOnly,
        transactions,
        transactionNavigationList,
        setTransactionNavigationList,
        isTransactionSaving,
        setIsTransactionSaving,
        setAnimateEditViewItems,
        setCreditUsedInSession,
        saveTransaction,
        deleteTransaction,
        processScan,
        handleRescan,
        hasActiveTransactionConflict,
    } = props;

    const queryClient = useQueryClient();

    // ==========================================================================
    // Store Access
    // ==========================================================================

    const scanState = useScanStore();
    const {
        setImages: setScanContextImages,
        setBatchEditingIndex: setBatchEditingIndexContext,
        updateBatchReceipt: updateBatchReceiptContext,
        processError: dispatchProcessError,
        reset: resetScanContext,
        startBatch: startBatchScanContext,
    } = useScanActions();

    const { setView, navigateBack, navigateToView } = useNavigationActions();

    // ==========================================================================
    // Scan Image Wrapper (mirrors App.tsx pattern)
    // ==========================================================================

    const setScanImages = useCallback((newImages: string[] | ((prev: string[]) => string[])) => {
        const imagesToSet = typeof newImages === 'function'
            ? newImages(scanState.images)
            : newImages;

        if (scanState.phase === 'idle' && imagesToSet.length > 0 && user?.uid) {
            // This case is handled by startSingle in the caller
            setScanContextImages(imagesToSet);
        } else if (imagesToSet.length === 0) {
            resetScanContext();
        } else {
            setScanContextImages(imagesToSet);
        }
    }, [scanState.images, scanState.phase, user?.uid, setScanContextImages, resetScanContext]);

    const setScanError = useCallback((error: string | null) => {
        if (error) {
            dispatchProcessError(error);
        }
    }, [dispatchProcessError]);

    // ==========================================================================
    // Batch Navigation Handlers (internal)
    // ==========================================================================

    const handleBatchPreviousInternal = useCallback(() => {
        if (scanState.batchEditingIndex === null || !scanState.batchReceipts) return;
        if (scanState.batchEditingIndex > 0) {
            const newIndex = scanState.batchEditingIndex - 1;
            setBatchEditingIndexContext(newIndex);
            const prevReceipt = scanState.batchReceipts[newIndex];
            if (prevReceipt?.transaction) {
                setCurrentTransaction(prevReceipt.transaction);
            }
        }
    }, [scanState.batchEditingIndex, scanState.batchReceipts, setBatchEditingIndexContext, setCurrentTransaction]);

    const handleBatchNextInternal = useCallback(() => {
        if (scanState.batchEditingIndex === null || !scanState.batchReceipts) return;
        if (scanState.batchEditingIndex < scanState.batchReceipts.length - 1) {
            const newIndex = scanState.batchEditingIndex + 1;
            setBatchEditingIndexContext(newIndex);
            const nextReceipt = scanState.batchReceipts[newIndex];
            if (nextReceipt?.transaction) {
                setCurrentTransaction(nextReceipt.transaction);
            }
        }
    }, [scanState.batchEditingIndex, scanState.batchReceipts, setBatchEditingIndexContext, setCurrentTransaction]);

    // ==========================================================================
    // Transaction List Navigation Handlers (internal)
    // ==========================================================================

    const handleTransactionListPrevious = useCallback(() => {
        if (!transactionNavigationList || !currentTransaction?.id) return;
        const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
        if (currentIndex <= 0) return;
        const prevId = transactionNavigationList[currentIndex - 1];
        const prevTx = transactions.find(t => t.id === prevId);
        if (prevTx) {
            setCurrentTransaction(prevTx);
        }
    }, [transactionNavigationList, currentTransaction?.id, transactions, setCurrentTransaction]);

    const handleTransactionListNext = useCallback(() => {
        if (!transactionNavigationList || !currentTransaction?.id) return;
        const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
        if (currentIndex < 0 || currentIndex >= transactionNavigationList.length - 1) return;
        const nextId = transactionNavigationList[currentIndex + 1];
        const nextTx = transactions.find(t => t.id === nextId);
        if (nextTx) {
            setCurrentTransaction(nextTx);
        }
    }, [transactionNavigationList, currentTransaction?.id, transactions, setCurrentTransaction]);

    // ==========================================================================
    // Core Transaction Handlers
    // ==========================================================================

    /**
     * Handle transaction update from editor (for UI state + batch context sync)
     */
    const handleUpdateTransaction = useCallback((trans: Transaction) => {
        setCurrentTransaction(trans);
        // Sync with batch context if editing a batch receipt
        if (scanState.batchEditingIndex !== null && scanState.batchReceipts) {
            const receiptId = scanState.batchReceipts[scanState.batchEditingIndex]?.id;
            if (receiptId) {
                updateBatchReceiptContext(receiptId, { transaction: trans });
            }
        }
    }, [scanState.batchEditingIndex, scanState.batchReceipts, updateBatchReceiptContext, setCurrentTransaction]);

    /**
     * Handle save from editor
     */
    const handleSave = useCallback(async (trans: Transaction) => {
        if (isTransactionSaving) return;
        setIsTransactionSaving(true);
        // Capture batch editing state BEFORE saveTransaction clears it
        const wasInBatchEditingMode = scanState.batchEditingIndex !== null;
        try {
            await saveTransaction(trans);
            // Bug fix: Only clear scan images when NOT in batch editing mode.
            // saveTransaction already handles navigation back to batch-review.
            // Clearing images here would trigger resetScanContext() and wipe all batch receipts.
            if (!wasInBatchEditingMode) {
                setScanImages([]);
            }
            setScanError(null);
            setCurrentTransaction(null);
            setIsViewingReadOnly(false);
            setCreditUsedInSession(false);
            setTransactionNavigationList(null);
        } finally {
            setIsTransactionSaving(false);
        }
    }, [
        isTransactionSaving,
        saveTransaction,
        setScanImages,
        setScanError,
        scanState.batchEditingIndex,
        setIsTransactionSaving,
        setCurrentTransaction,
        setIsViewingReadOnly,
        setCreditUsedInSession,
        setTransactionNavigationList,
    ]);

    /**
     * Handle cancel from editor
     */
    const handleCancel = useCallback(() => {
        // Bug fix: Only clear scan images when NOT in batch editing mode.
        // Clearing images triggers resetScanContext() which would wipe all batch receipts.
        if (scanState.batchEditingIndex === null) {
            setScanImages([]);
        }
        setScanError(null);
        setCurrentTransaction(null);
        setAnimateEditViewItems(false);
        setIsViewingReadOnly(false);
        setCreditUsedInSession(false);
        setTransactionNavigationList(null);
        if (scanState.batchEditingIndex !== null) {
            setBatchEditingIndexContext(null);
            // Transition from editing → reviewing when canceling edit
            batchReviewActions.finishEditing();
            setView('batch-review');
        } else {
            navigateBack();
        }
    }, [
        setScanImages,
        setScanError,
        scanState.batchEditingIndex,
        setBatchEditingIndexContext,
        navigateBack,
        setView,
        setCurrentTransaction,
        setAnimateEditViewItems,
        setIsViewingReadOnly,
        setCreditUsedInSession,
        setTransactionNavigationList,
    ]);

    /**
     * Handle delete (existing transactions only)
     */
    const handleDelete = useMemo(() => {
        return transactionEditorMode === 'existing' ? deleteTransaction : undefined;
    }, [transactionEditorMode, deleteTransaction]);

    // ==========================================================================
    // Scan Handlers
    // ==========================================================================

    /**
     * Handle photo select from editor
     */
    const handlePhotoSelect = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setScanImages([base64]);
        };
        reader.readAsDataURL(file);
    }, [setScanImages]);

    /**
     * Handle process scan from editor
     */
    const handleProcessScan = useCallback(() => {
        processScan();
    }, [processScan]);

    /**
     * Handle retry from editor
     */
    const handleRetry = useCallback(() => {
        setScanError(null);
        processScan();
    }, [setScanError, processScan]);

    /**
     * Handle rescan from editor (existing transactions only)
     */
    const handleRescanCallback = useMemo(() => {
        return transactionEditorMode === 'existing' ? async () => {
            await handleRescan();
        } : undefined;
    }, [transactionEditorMode, handleRescan]);

    // ==========================================================================
    // Batch/List Navigation Handlers
    // ==========================================================================

    /**
     * Handle batch previous (conditional on batch vs list context)
     */
    const handleBatchPrevious = useMemo(() => {
        if (scanState.batchEditingIndex !== null) {
            return handleBatchPreviousInternal;
        }
        if (transactionNavigationList) {
            return handleTransactionListPrevious;
        }
        return undefined;
    }, [scanState.batchEditingIndex, transactionNavigationList, handleBatchPreviousInternal, handleTransactionListPrevious]);

    /**
     * Handle batch next (conditional on batch vs list context)
     */
    const handleBatchNext = useMemo(() => {
        if (scanState.batchEditingIndex !== null) {
            return handleBatchNextInternal;
        }
        if (transactionNavigationList) {
            return handleTransactionListNext;
        }
        return undefined;
    }, [scanState.batchEditingIndex, transactionNavigationList, handleBatchNextInternal, handleTransactionListNext]);

    /**
     * Handle batch mode click from editor
     */
    const handleBatchModeClick = useCallback(() => {
        if (user?.uid) {
            startBatchScanContext(user.uid);
        }
        navigateToView('batch-capture');
    }, [user?.uid, startBatchScanContext, navigateToView]);

    // ==========================================================================
    // Group Operations
    // ==========================================================================

    /**
     * Handle groups change from editor (complex cache update logic)
     */
    const handleGroupsChange = useCallback(async (groupIds: string[]) => {
        if (!user?.uid || !currentTransaction) return;

        const previousGroupIds = currentTransaction.sharedGroupIds || [];

        if (import.meta.env.DEV) {
            console.log('[TransactionEditor] onGroupsChange:', {
                transactionId: currentTransaction.id,
                previousGroupIds,
                newGroupIds: groupIds,
            });
        }

        // Fire and forget - don't block the UI
        updateMemberTimestampsForTransaction(
            db,
            user.uid,
            groupIds,
            previousGroupIds
        ).catch(err => {
            console.warn('[TransactionEditor] Failed to update memberUpdates:', err);
        });

        // Groups the transaction was REMOVED from
        const removedFromGroups = previousGroupIds.filter(id => !groupIds.includes(id));
        // Groups the transaction was ADDED to
        const addedToGroups = groupIds.filter(id => !previousGroupIds.includes(id));

        // Optimistic cache update for affected groups
        const affectedGroupIds = new Set([...previousGroupIds, ...groupIds]);

        if (import.meta.env.DEV) {
            console.log('[TransactionEditor] Clearing cache for groups:', Array.from(affectedGroupIds));
        }

        const updateCachesForGroup = (groupId: string) => {
            queryClient.setQueriesData(
                { queryKey: ['sharedGroupTransactions', groupId], exact: false },
                (oldData: Transaction[] | undefined) => {
                    if (!oldData || !currentTransaction.id) return oldData;

                    if (removedFromGroups.includes(groupId)) {
                        const filtered = oldData.filter(tx => tx.id !== currentTransaction.id);
                        if (import.meta.env.DEV) {
                            console.log(`[TransactionEditor] Optimistic update: removed txn from group ${groupId}`, {
                                before: oldData.length,
                                after: filtered.length,
                            });
                        }
                        return filtered;
                    }

                    if (addedToGroups.includes(groupId)) {
                        const updatedTxn = {
                            ...currentTransaction,
                            sharedGroupIds: groupIds,
                            _ownerId: user.uid,
                        };
                        const exists = oldData.some(tx => tx.id === currentTransaction.id);
                        if (exists) {
                            return oldData.map(tx =>
                                tx.id === currentTransaction.id ? updatedTxn : tx
                            );
                        }
                        if (import.meta.env.DEV) {
                            console.log(`[TransactionEditor] Optimistic update: added txn to group ${groupId}`);
                        }
                        return [updatedTxn, ...oldData];
                    }

                    // Transaction stayed in group, just update the sharedGroupIds
                    return oldData.map(tx =>
                        tx.id === currentTransaction.id
                            ? { ...tx, sharedGroupIds: groupIds }
                            : tx
                    );
                }
            );
        };

        // Process all groups
        affectedGroupIds.forEach(updateCachesForGroup);
    }, [user?.uid, currentTransaction, db, queryClient]);

    // ==========================================================================
    // Read-Only Mode Handler
    // ==========================================================================

    /**
     * Handle edit request from read-only view (performs conflict check)
     * If scan is active, auto-navigate to scan view instead of showing dialog
     */
    const handleRequestEdit = useCallback(() => {
        const conflictCheck = hasActiveTransactionConflict();

        if (conflictCheck.hasConflict) {
            // Auto-navigate to the active scan view - no dialog
            if (scanState.mode === 'batch') {
                navigateToView('batch-review');
            } else {
                if (scanState.results.length > 0) {
                    setCurrentTransaction(scanState.results[0]);
                }
                setTransactionEditorMode('new');
                navigateToView('transaction-editor');
            }
        } else {
            setIsViewingReadOnly(false);
        }
    }, [
        hasActiveTransactionConflict,
        scanState.mode,
        scanState.results,
        navigateToView,
        setCurrentTransaction,
        setTransactionEditorMode,
        setIsViewingReadOnly,
    ]);

    // ==========================================================================
    // Navigation Context (Computed Values)
    // ==========================================================================

    const canNavigatePrevious = useMemo(() => {
        if (scanState.batchEditingIndex !== null && scanState.batchReceipts) {
            return scanState.batchEditingIndex > 0;
        }
        if (transactionNavigationList && currentTransaction?.id) {
            const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
            return currentIndex > 0;
        }
        return false;
    }, [scanState.batchEditingIndex, scanState.batchReceipts, transactionNavigationList, currentTransaction?.id]);

    const canNavigateNext = useMemo(() => {
        if (scanState.batchEditingIndex !== null && scanState.batchReceipts) {
            return scanState.batchEditingIndex < scanState.batchReceipts.length - 1;
        }
        if (transactionNavigationList && currentTransaction?.id) {
            const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
            return currentIndex >= 0 && currentIndex < transactionNavigationList.length - 1;
        }
        return false;
    }, [scanState.batchEditingIndex, scanState.batchReceipts, transactionNavigationList, currentTransaction?.id]);

    const navigationLabel = useMemo(() => {
        if (scanState.batchEditingIndex !== null && scanState.batchReceipts) {
            return `${scanState.batchEditingIndex + 1} de ${scanState.batchReceipts.length}`;
        }
        if (transactionNavigationList && currentTransaction?.id) {
            const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
            if (currentIndex >= 0) {
                return `${currentIndex + 1} de ${transactionNavigationList.length}`;
            }
        }
        return null;
    }, [scanState.batchEditingIndex, scanState.batchReceipts, transactionNavigationList, currentTransaction?.id]);

    // ==========================================================================
    // Return
    // ==========================================================================

    return {
        // Core transaction operations
        handleUpdateTransaction,
        handleSave,
        handleCancel,
        handleDelete,

        // Scan operations
        handlePhotoSelect,
        handleProcessScan,
        handleRetry,
        handleRescan: handleRescanCallback,

        // Batch/List navigation
        handleBatchPrevious,
        handleBatchNext,
        handleBatchModeClick,

        // Group operations
        handleGroupsChange,

        // Read-only mode
        handleRequestEdit,

        // Navigation context
        canNavigatePrevious,
        canNavigateNext,
        navigationLabel,
    };
}
