/**
 * Story 14e-29a: Batch Review Handlers Hook
 *
 * Consolidated hook for all batch review handlers.
 * Replaces the dependency injection pattern from handlers/ directory
 * with direct store access.
 *
 * This hook provides all handlers needed for batch review operations:
 * - Navigation (previous/next)
 * - Editing (edit receipt)
 * - Save/Discard operations
 * - Credit check operations
 *
 * Architecture Reference:
 * - docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md (ADR-018)
 * - src/features/scan/handlers/processScan/ (pattern reference)
 */

import { useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { Services } from '@/contexts/AuthContext';
import type { Transaction } from '@/types/transaction';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { View } from '@/components/App';
import type { CategoryMapping } from '@/types/categoryMapping';
import type { UserCredits } from '@/types/scan';
import type { ScanDialogType, BatchCompleteDialogData, ScanState } from '@/types/scanStateMachine';
import { DIALOG_TYPES } from '@/types/scanStateMachine';

// Store imports
import { batchReviewActions, useBatchReviewStore } from '../store';
// Cross-feature import: batch-review needs scan store for shared images state
// This is intentional - batchImages was eliminated (Story 14e-34a) and replaced
// with useScanStore.images as the single source of truth for batch image data.
// The alternative would be duplicating state, which causes race conditions.
import { useScanStore } from '@/features/scan/store';

// Batch processing utilities
import { createBatchReceiptsFromResults } from '@/hooks/useBatchReview';

// Existing handler utilities (pure functions to preserve)
import { buildTransactionWithThumbnail } from '../handlers/utils';

// Firestore and mapping services (used by save handler)
import { addTransaction as firestoreAddTransaction } from '@/services/firestore';
import { incrementMappingUsage } from '@/services/categoryMappingService';
import { incrementMerchantMappingUsage } from '@/services/merchantMappingService';
import { incrementItemNameMappingUsage } from '@/services/itemNameMappingService';
// Story 14e-42: Import pure utility and type from @features/categories
import { applyItemNameMappings, type FindItemNameMatchFn } from '@/features/categories';

// Types from existing handlers
// Story 14e-42: ItemNameMappingResult removed - now using pure utility from @features/categories
import type {
  CategoryMappingResult,
  MerchantMatchResult,
  BatchProcessingController,
} from '../handlers/types';
import type { ReceiptType } from '@/services/gemini';
import type { ProcessingResult } from '@/services/batchProcessingService';

// =============================================================================
// Extended Batch Processing Interface (Story 14e-29b)
// =============================================================================

/**
 * Callbacks for batch processing progress.
 * Story 14e-29b: Used by handleProcessingStart to wire up scan store dispatchers.
 */
export interface BatchProcessingCallbacks {
  onItemStart?: (index: number) => void;
  onItemSuccess?: (index: number, result: Transaction) => void;
  onItemError?: (index: number, error: string) => void;
  onComplete?: (results: ProcessingResult[], images: string[]) => void;
}

/**
 * Extended batch processing controller.
 * Story 14e-29b: Includes startProcessing method for handleProcessingStart.
 */
export interface ExtendedBatchProcessingController {
  /** Reset the batch processing state */
  reset: () => void;
  /** Start batch processing with callbacks */
  startProcessing: (
    images: string[],
    currency: string,
    receiptType?: ReceiptType,
    callbacks?: BatchProcessingCallbacks
  ) => Promise<ProcessingResult[]>;
}

// =============================================================================
// Props Interface (AC2)
// =============================================================================

/**
 * Props for the useBatchReviewHandlers hook.
 * Contains external dependencies needed by handlers.
 */
export interface BatchReviewHandlersProps {
  /** Current authenticated user */
  user: User | null;
  /** Firebase services (Auth, Firestore, appId) */
  services: Services | null;

  // Store state accessed via props (from App.tsx or parent)
  /** Current scan state containing batch receipts and editing index */
  scanState: ScanState;

  // Setters from parent (until fully migrated to stores)
  /** Function to update the batch editing index in scan context */
  setBatchEditingIndexContext: (index: number | null) => void;
  /** Function to set the current transaction for editing */
  setCurrentTransaction: (tx: Transaction | null) => void;
  /** Function to set the transaction editor mode */
  setTransactionEditorMode: (mode: 'new' | 'existing') => void;
  /** Function to navigate to a specific view */
  navigateToView: (view: View) => void;
  /** Function to set the current view */
  setView: (view: View) => void;
  // Story 14e-34a: setBatchImages removed - now uses useScanStore.setImages directly
  /** Batch processing controller with reset capability */
  batchProcessing: BatchProcessingController;
  /** Function to reset the scan context to idle state */
  resetScanContext: () => void;
  /** Function to show a scan dialog */
  showScanDialog: (type: ScanDialogType, data: object | BatchCompleteDialogData) => void;
  /** Function to dismiss the current scan dialog */
  dismissScanDialog: () => void;

  // Mapping functions (from App.tsx mapping hooks)
  /** Category mappings from user's learned preferences */
  mappings: CategoryMapping[];
  /** Apply category mappings to a transaction */
  applyCategoryMappings: (
    transaction: Transaction,
    mappings: CategoryMapping[]
  ) => CategoryMappingResult;
  /** Find a merchant match for the given merchant name */
  findMerchantMatch: (merchant: string) => MerchantMatchResult | null;
  /**
   * Find item name match for a merchant and item (Story 14e-42).
   * Used with applyItemNameMappings utility from @features/categories.
   */
  findItemNameMatch: FindItemNameMatchFn;

  // Credit check functions (optional - only needed for handleCreditCheckComplete)
  /** Current user credit balance */
  userCredits: UserCredits;
  /** Function to check if user has sufficient credits (optional - for batch preview credit check) */
  checkCreditSufficiency?: (
    userCredits: {
      remaining: number;
      used: number;
      superRemaining: number;
      superUsed: number;
    },
    requiredCredits: number,
    isSuper: boolean
  ) => {
    sufficient: boolean;
    available: number;
    required: number;
    remaining: number;
    shortage: number;
    maxProcessable: number;
    creditType: 'normal' | 'super';
  };
  /** Function to store the credit check result for dialog display (optional) */
  setCreditCheckResult?: (
    result: {
      sufficient: boolean;
      available: number;
      required: number;
      remaining: number;
      shortage: number;
      maxProcessable: number;
      creditType: 'normal' | 'super';
    } | null
  ) => void;
  /** Function to show/hide the credit warning dialog (optional) */
  setShowCreditWarning?: (show: boolean) => void;

  // ==========================================================================
  // Story 14e-29b: Processing handler dependencies
  // ==========================================================================

  /** Function to show/hide the batch preview modal */
  setShowBatchPreview: (show: boolean) => void;
  /** Function to trigger the credit check flow via CreditFeature */
  setShouldTriggerCreditCheck: (trigger: boolean) => void;
  // Story 14e-34a: batchImages removed - now uses useScanStore.images directly
  /** Currency for scan processing */
  scanCurrency: string;
  /** Store type for scan processing ('auto' or specific type) */
  scanStoreType: string;
  /** Active group for tagging transactions (legacy - unused) */
  activeGroup?: { id?: string } | null;
  /** Extended batch processing controller with startProcessing */
  batchProcessingExtended: ExtendedBatchProcessingController;
  /** Function to set images in scan context (for single mode switch) */
  setScanImages: (images: string[]) => void;

  // ==========================================================================
  // Story 14e-33: Trust prompt clearing (optional)
  // ==========================================================================
  /** Function to clear trust prompt state when navigating away from batch review */
  clearTrustPrompt?: () => void;
}

// =============================================================================
// Return Type Interface (AC2)
// =============================================================================

/** Merchant match confidence threshold for applying learned mappings */
const MERCHANT_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Return type for the useBatchReviewHandlers hook.
 * Contains all handlers needed for batch review operations.
 */
export interface BatchReviewHandlers {
  // ==========================================================================
  // Navigation handlers (from navigation.ts)
  // ==========================================================================
  /** Navigate to previous receipt in batch */
  handlePrevious: () => void;
  /** Navigate to next receipt in batch */
  handleNext: () => void;

  // ==========================================================================
  // Edit handler (from editReceipt.ts)
  // ==========================================================================
  /** Edit a specific receipt during batch review */
  handleEditReceipt: (receipt: BatchReceipt, index: number) => void;

  // ==========================================================================
  // Save handlers (from save.ts)
  // ==========================================================================
  /** Save a single transaction during batch review */
  handleSaveTransaction: (transaction: Transaction) => Promise<string>;
  /** Handle completion of batch save */
  handleSaveComplete: (savedTransactions: Transaction[]) => void;

  // ==========================================================================
  // Discard handlers (from discard.ts)
  // ==========================================================================
  /** Handle back navigation from batch review */
  handleBack: () => void;
  /** Confirm discarding batch results */
  handleDiscardConfirm: () => void;
  /** Cancel the discard operation */
  handleDiscardCancel: () => void;

  // ==========================================================================
  // Credit check handler (from creditCheck.ts)
  // ==========================================================================
  /** Check credit sufficiency before batch processing */
  handleCreditCheckComplete: () => void;

  // ==========================================================================
  // Story 14e-29b: Processing & Navigation handlers
  // ==========================================================================
  /** Cancel batch preview and clear images */
  handleCancelPreview: () => void;
  /** Trigger credit check flow via CreditFeature */
  handleConfirmWithCreditCheck: () => void;
  /** Start batch processing after credit confirmation */
  handleProcessingStart: () => Promise<void>;
  /** Remove image from batch (switches to single mode if 1 left) */
  handleRemoveImage: (index: number) => void;

  // ==========================================================================
  // Reduce batch handler (placeholder)
  // ==========================================================================
  /** Reduce batch size when insufficient credits (placeholder - not implemented) */
  handleReduceBatch: (maxProcessable: number) => void;
}

// =============================================================================
// Hook Implementation (AC3)
// =============================================================================

/**
 * Hook that provides all batch review handlers.
 *
 * Consolidates handler logic from:
 * - handlers/navigation.ts
 * - handlers/editReceipt.ts
 * - handlers/save.ts
 * - handlers/discard.ts
 * - handlers/creditCheck.ts
 *
 * @param props - External dependencies needed by handlers
 * @returns Object containing all batch review handlers
 */
export function useBatchReviewHandlers(props: BatchReviewHandlersProps): BatchReviewHandlers {
  const {
    user,
    services,
    scanState,
    setBatchEditingIndexContext,
    setCurrentTransaction,
    setTransactionEditorMode,
    navigateToView,
    setView,
    // Story 14e-34a: setBatchImages removed - now uses useScanStore.setImages
    batchProcessing,
    resetScanContext,
    showScanDialog,
    dismissScanDialog,
    mappings,
    applyCategoryMappings,
    findMerchantMatch,
    findItemNameMatch, // Story 14e-42: Pure utility uses DI
    userCredits,
    checkCreditSufficiency,
    setCreditCheckResult,
    setShowCreditWarning,
    // Story 14e-29b: Processing handler dependencies
    setShowBatchPreview,
    setShouldTriggerCreditCheck,
    // Story 14e-34a: batchImages removed - now uses useScanStore.images
    scanCurrency,
    scanStoreType,
    activeGroup,
    batchProcessingExtended,
    setScanImages,
    // Story 14e-33: Trust prompt clearing
    clearTrustPrompt,
  } = props;

  // ==========================================================================
  // Story 14e-29b: Access scan store for dispatch actions
  // Story 14e-34a: Added images and setImages (replaces batchImages/setBatchImages props)
  // ==========================================================================
  const scanStoreState = useScanStore();
  const {
    processStart: dispatchProcessStart,
    batchItemStart: dispatchBatchItemStart,
    batchItemSuccess: dispatchBatchItemSuccess,
    batchItemError: dispatchBatchItemError,
    batchComplete: dispatchBatchComplete,
    // Story 14e-34a: Single source of truth for batch images
    images: batchImages,
    setImages: setBatchImages,
  } = scanStoreState;

  // ==========================================================================
  // Navigation handlers (consolidated from handlers/navigation.ts)
  // ==========================================================================

  /**
   * Navigate to the previous receipt in the batch.
   * Bounds check: Returns early if at the first receipt (index 0) or no batch exists.
   */
  const handlePrevious = useCallback(() => {
    const batchReceipts = scanState.batchReceipts;
    const currentIndex = scanState.batchEditingIndex;

    // Bounds check: return early if at start or no batch
    if (!batchReceipts || currentIndex === null || currentIndex <= 0) {
      return;
    }

    const prevIndex = currentIndex - 1;
    const prevReceipt = batchReceipts[prevIndex];

    if (prevReceipt) {
      setBatchEditingIndexContext(prevIndex);
      setCurrentTransaction(buildTransactionWithThumbnail(prevReceipt));
    }
  }, [scanState, setBatchEditingIndexContext, setCurrentTransaction]);

  /**
   * Navigate to the next receipt in the batch.
   * Bounds check: Returns early if at the last receipt or no batch exists.
   */
  const handleNext = useCallback(() => {
    const batchReceipts = scanState.batchReceipts;
    const currentIndex = scanState.batchEditingIndex;

    // Bounds check: return early if at end or no batch
    if (!batchReceipts || currentIndex === null || currentIndex >= batchReceipts.length - 1) {
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextReceipt = batchReceipts[nextIndex];

    if (nextReceipt) {
      setBatchEditingIndexContext(nextIndex);
      setCurrentTransaction(buildTransactionWithThumbnail(nextReceipt));
    }
  }, [scanState, setBatchEditingIndexContext, setCurrentTransaction]);

  // ==========================================================================
  // Edit handler (consolidated from handlers/editReceipt.ts)
  // ==========================================================================

  /**
   * Edit a batch receipt during batch review.
   * Opens the transaction editor with the selected receipt's data.
   *
   * @param receipt - The batch receipt to edit
   * @param batchIndex - 1-based index from UI (will be converted to 0-based)
   */
  const handleEditReceipt = useCallback(
    (receipt: BatchReceipt, batchIndex: number) => {
      // Sync batch review store phase to 'editing'
      batchReviewActions.startEditing(receipt.id);

      // Convert 1-based UI index to 0-based internal index
      const zeroBasedIndex = batchIndex - 1;
      setBatchEditingIndexContext(zeroBasedIndex);

      // Set transaction with thumbnail if available
      const transactionWithThumbnail = buildTransactionWithThumbnail(receipt);
      setCurrentTransaction(transactionWithThumbnail);

      // Set editor mode and navigate
      setTransactionEditorMode('existing');
      navigateToView('transaction-editor');
    },
    [setBatchEditingIndexContext, setCurrentTransaction, setTransactionEditorMode, navigateToView]
  );

  // ==========================================================================
  // Save handlers (consolidated from handlers/save.ts)
  // ==========================================================================

  /**
   * Save a single transaction during batch review.
   * Applies category, merchant, and item name mappings before saving to Firestore.
   *
   * @param transaction - The transaction to save
   * @returns The saved transaction ID
   * @throws Error if not authenticated
   */
  const handleSaveTransaction = useCallback(
    async (transaction: Transaction): Promise<string> => {
      // Auth check
      if (!services || !user) {
        throw new Error('Not authenticated');
      }

      const { db, appId } = services;

      // Apply category mappings
      const { transaction: categorizedTx, appliedMappingIds } = applyCategoryMappings(
        transaction,
        mappings
      );

      // Increment mapping usage (fire-and-forget)
      if (appliedMappingIds.length > 0) {
        appliedMappingIds.forEach((mappingId) => {
          incrementMappingUsage(db, user.uid, appId, mappingId).catch((err) =>
            console.error('Failed to increment mapping usage:', err)
          );
        });
      }

      // Apply merchant mappings
      let finalTx = categorizedTx;
      const merchantMatch = findMerchantMatch(categorizedTx.merchant);

      if (merchantMatch && merchantMatch.confidence > MERCHANT_CONFIDENCE_THRESHOLD) {
        finalTx = {
          ...finalTx,
          alias: merchantMatch.mapping.targetMerchant,
          ...(merchantMatch.mapping.storeCategory && {
            category: merchantMatch.mapping.storeCategory,
          }),
          merchantSource: 'learned' as const,
        };

        // Increment merchant mapping usage (fire-and-forget)
        if (merchantMatch.mapping.id) {
          incrementMerchantMappingUsage(db, user.uid, appId, merchantMatch.mapping.id).catch(
            (err) => console.error('Failed to increment merchant mapping usage:', err)
          );
        }

        // Apply learned item name mappings (scoped to this merchant)
        // Story 14e-42: Uses pure utility from @features/categories with findItemNameMatch DI
        const { transaction: txWithItemNames, appliedIds: itemNameMappingIds } =
          applyItemNameMappings(finalTx, merchantMatch.mapping.normalizedMerchant, findItemNameMatch);
        finalTx = txWithItemNames;

        // Increment item name mapping usage counts (fire-and-forget)
        if (itemNameMappingIds.length > 0) {
          itemNameMappingIds.forEach((id) => {
            incrementItemNameMappingUsage(db, user.uid, appId, id).catch((err) =>
              console.error('Failed to increment item name mapping usage:', err)
            );
          });
        }
      }

      // Save transaction to Firestore
      const transactionId = await firestoreAddTransaction(db, user.uid, appId, finalTx);

      return transactionId;
    },
    [user, services, mappings, applyCategoryMappings, findMerchantMatch, findItemNameMatch]
  );

  /**
   * Handle completion of batch save.
   * Resets state and shows the batch complete modal if transactions were saved.
   *
   * @param savedTransactions - Array of successfully saved transactions
   */
  const handleSaveComplete = useCallback(
    (savedTransactions: Transaction[]) => {
      // Reset batch state
      setBatchImages([]);
      batchProcessing.reset();
      resetScanContext();

      // Show results modal if transactions were saved
      if (savedTransactions.length > 0) {
        const dialogData: BatchCompleteDialogData = {
          transactions: savedTransactions,
          creditsUsed: 1, // Batch uses 1 super credit regardless of transaction count
        };
        showScanDialog(DIALOG_TYPES.BATCH_COMPLETE, dialogData);
      }

      // Navigate to dashboard
      setView('dashboard');
    },
    [setBatchImages, batchProcessing, resetScanContext, showScanDialog, setView]
  );

  // ==========================================================================
  // Discard handlers (consolidated from handlers/discard.ts)
  // ==========================================================================

  /**
   * Handle back navigation from batch review.
   * Shows confirmation dialog if there are receipts to potentially discard.
   * Story 14e-33: Check Zustand store (source of truth) instead of scanState.batchReceipts
   * to avoid showing spurious dialogs when items were already discarded from store.
   */
  const handleBack = useCallback(() => {
    // Story 14e-33: Check Zustand store items (source of truth) instead of scanState.batchReceipts
    // When auto-complete triggers handleBack after discarding all items, scanState.batchReceipts
    // may be out of sync (still has items). The Zustand store is the actual source of truth.
    const storeItems = useBatchReviewStore.getState().items;
    const hasItemsInStore = storeItems.length > 0;

    // Show confirmation if items still exist in the store (credit was spent)
    if (hasItemsInStore) {
      showScanDialog(DIALOG_TYPES.BATCH_DISCARD, {});
      return;
    }

    // No results to lose - navigate directly
    setBatchImages([]);
    batchProcessing.reset();
    resetScanContext();
    batchReviewActions.reset();
    // Story 14e-33: Clear any pending trust prompts when navigating away
    clearTrustPrompt?.();
    setView('dashboard');
  }, [showScanDialog, setBatchImages, batchProcessing, resetScanContext, setView, clearTrustPrompt]);

  /**
   * Confirm discarding batch results.
   * Dismisses dialog, clears all batch state, and navigates to dashboard.
   */
  const handleDiscardConfirm = useCallback(() => {
    dismissScanDialog();
    setBatchImages([]);
    batchProcessing.reset();
    resetScanContext();
    batchReviewActions.reset();
    // Story 14e-33: Clear any pending trust prompts when discarding batch
    clearTrustPrompt?.();
    setView('dashboard');
  }, [dismissScanDialog, setBatchImages, batchProcessing, resetScanContext, setView, clearTrustPrompt]);

  /**
   * Cancel the discard operation.
   * Dismisses the confirmation dialog without discarding anything.
   */
  const handleDiscardCancel = useCallback(() => {
    dismissScanDialog();
  }, [dismissScanDialog]);

  // ==========================================================================
  // Credit check handler (consolidated from handlers/creditCheck.ts)
  // ==========================================================================

  /**
   * Check credit sufficiency and show warning dialog before batch processing.
   * Batch processing uses 1 super credit regardless of image count.
   * Story 14e-29c: Made optional - only functional if credit check functions provided.
   */
  const handleCreditCheckComplete = useCallback(() => {
    // Guard: Credit check functions are optional (handled by CreditFeature)
    if (!checkCreditSufficiency || !setCreditCheckResult || !setShowCreditWarning) {
      console.warn('[useBatchReviewHandlers] Credit check functions not provided - skipping');
      return;
    }
    // Batch uses 1 super credit regardless of image count
    const result = checkCreditSufficiency(userCredits, 1, true);
    setCreditCheckResult(result);
    setShowCreditWarning(true);
  }, [userCredits, checkCreditSufficiency, setCreditCheckResult, setShowCreditWarning]);

  // ==========================================================================
  // Story 14e-29b: Processing Handlers
  // ==========================================================================

  /**
   * Cancel batch preview.
   * Story 14e-29b: Closes the preview modal and clears batch images.
   */
  const handleCancelPreview = useCallback(() => {
    setShowBatchPreview(false);
    setBatchImages([]);
  }, [setShowBatchPreview, setBatchImages]);

  /**
   * Confirm with credit check.
   * Story 14e-29b: Triggers the credit check flow via CreditFeature.
   * The CreditFeature will call handleProcessingStart after credit confirmation.
   */
  const handleConfirmWithCreditCheck = useCallback(() => {
    setShouldTriggerCreditCheck(true);
  }, [setShouldTriggerCreditCheck]);

  /**
   * Start batch processing.
   * Story 14e-29b: Called after credit confirmation to begin processing.
   * Orchestrates the batch processing workflow:
   * 1. Hide preview modal
   * 2. Navigate to batch-review to show progress
   * 3. Dispatch processStart to scan store
   * 4. Start parallel processing with progress callbacks
   * 5. Tag results with group ID if in group mode
   * 6. Create batch receipts and dispatch completion
   *
   * Story 14e-29b (Archie Review): Added try/catch for error resilience.
   */
  const handleProcessingStart = useCallback(async () => {
    // Hide preview modal
    setShowBatchPreview(false);

    // Navigate to batch-review immediately to show processing progress
    setView('batch-review');
    dispatchProcessStart('super', 1);

    try {
      await batchProcessingExtended.startProcessing(
        batchImages,
        scanCurrency,
        scanStoreType !== 'auto' ? (scanStoreType as ReceiptType) : undefined,
        {
          onItemStart: dispatchBatchItemStart,
          onItemSuccess: dispatchBatchItemSuccess,
          onItemError: dispatchBatchItemError,
          onComplete: (processingResults, imageUrls) => {
            const receipts = createBatchReceiptsFromResults(processingResults, imageUrls);
            dispatchBatchComplete(receipts);
            batchReviewActions.loadBatch(receipts);
          },
        }
      );
    } catch (error) {
      // Log error and reset to safe state so user isn't stuck on a frozen screen
      console.error('[useBatchReviewHandlers] Batch processing failed:', error);
      // Reset batch state and navigate to dashboard to allow user to retry
      batchProcessing.reset();
      resetScanContext();
      batchReviewActions.reset();
      setView('dashboard');
    }
  }, [
    setShowBatchPreview,
    setView,
    dispatchProcessStart,
    batchProcessingExtended,
    batchImages,
    scanCurrency,
    scanStoreType,
    dispatchBatchItemStart,
    dispatchBatchItemSuccess,
    dispatchBatchItemError,
    dispatchBatchComplete,
    activeGroup,
    batchProcessing,
    resetScanContext,
  ]);

  // ==========================================================================
  // Story 14e-29b: Navigation Handlers - handleRemoveImage
  // ==========================================================================

  /**
   * Remove an image from the batch.
   * Story 14e-29b: Handles image removal during batch preview.
   * If only one image remains after removal, switches to single scan mode.
   */
  const handleRemoveImage = useCallback((index: number) => {
    const updated = batchImages.filter((_, i) => i !== index);
    setBatchImages(updated);

    // If only one image left, switch to single scan mode
    if (updated.length === 1) {
      setShowBatchPreview(false);
      setScanImages(updated);
      setTransactionEditorMode('new');
      navigateToView('transaction-editor');
    }
  }, [batchImages, setBatchImages, setShowBatchPreview, setScanImages, setTransactionEditorMode, navigateToView]);

  // ==========================================================================
  // Reduce batch handler (placeholder - not currently used in production)
  // ==========================================================================

  /**
   * Reduce batch size when insufficient credits.
   * NOTE: This handler is intentionally a no-op placeholder.
   * The "reduce batch" UX flow was deprioritized during Epic 14e implementation.
   * When insufficient credits are detected, users must either:
   * - Wait for credit refresh, OR
   * - Cancel and try with fewer images
   * If reduce-batch UX is needed later, implement the logic here.
   */
  const handleReduceBatch = useCallback((_maxProcessable: number) => {
    // Placeholder: reduce-batch UX not implemented - see comment above
  }, []);

  // ==========================================================================
  // Return all handlers
  // ==========================================================================

  return {
    // Navigation handlers
    handlePrevious,
    handleNext,

    // Edit handler
    handleEditReceipt,

    // Save handlers
    handleSaveTransaction,
    handleSaveComplete,

    // Discard handlers
    handleBack,
    handleDiscardConfirm,
    handleDiscardCancel,

    // Credit check handler
    handleCreditCheckComplete,

    // Processing & navigation handlers (Story 14e-29b)
    handleCancelPreview,
    handleConfirmWithCreditCheck,
    handleProcessingStart,
    handleRemoveImage,

    // Reduce batch handler (placeholder)
    handleReduceBatch,
  };
}
