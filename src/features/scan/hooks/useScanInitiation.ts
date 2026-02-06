/**
 * Story 14e-30: Scan Initiation Handlers Hook
 *
 * Consolidated hook for scan initiation handlers extracted from App.tsx:
 * - handleNewTransaction: Start new scan/transaction flow
 * - handleFileSelect: File input handling, batch detection
 * - handleRescan: Rescan existing transaction
 *
 * Architecture Reference:
 * - docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md (ADR-018)
 * - src/features/batch-review/hooks/useBatchReviewHandlers.ts (pattern reference)
 */

import { useCallback, type RefObject } from 'react';
import type { Transaction } from '@/types/transaction';
import type { SupportedCurrency } from '@/services/userPreferencesService';
import type { ReceiptType } from '@/services/gemini';
import type { ScanState } from '@/types/scanStateMachine';
import { DIALOG_TYPES } from '@/types/scanStateMachine';
import { MAX_BATCH_IMAGES } from '@/components/scan';
import { analyzeReceipt } from '@/services/gemini';
import { getSafeDate, parseStrictNumber } from '@/utils/validation';

// Store imports
import { useScanStore } from '../store/useScanStore';
import { useNavigationStore } from '@/shared/stores/useNavigationStore';

// =============================================================================
// Types
// =============================================================================

/**
 * Message type for toast notifications.
 * Note: Uses 'success' | 'info' to match App.tsx's toast system.
 */
export interface ToastMessage {
  text: string;
  type: 'success' | 'info';
}

/**
 * User credits state.
 */
export interface UserCredits {
  remaining: number;
  used: number;
  superRemaining: number;
  superUsed: number;
}

/**
 * Props for the useScanInitiation hook.
 * Contains external dependencies needed by handlers.
 */
export interface ScanInitiationProps {
  // =========================================================================
  // Core State (from App.tsx)
  // =========================================================================

  /** Current scan state from store (read via selector in App.tsx) */
  scanState: ScanState;

  /** Whether batch receipts exist in batch review store */
  hasBatchReceipts: boolean;

  /** Current scan images */
  scanImages: string[];

  // =========================================================================
  // Transaction State
  // =========================================================================

  /** Current transaction being edited */
  currentTransaction: Transaction | null;

  /** Function to create a default transaction */
  createDefaultTransaction: () => Transaction;

  // =========================================================================
  // User Preferences
  // =========================================================================

  /** User's default currency */
  defaultCurrency: SupportedCurrency;

  /** User credits state */
  userCredits: UserCredits;

  /** Current language */
  lang: 'en' | 'es';

  // =========================================================================
  // Actions
  // =========================================================================

  /** Set transaction editor mode */
  setTransactionEditorMode: (mode: 'new' | 'existing') => void;

  /** Set current transaction */
  setCurrentTransaction: (tx: Transaction | null) => void;

  /** Set scan images */
  setScanImages: (images: string[]) => void;

  /** Set scan error */
  setScanError: (error: string | null) => void;

  /** Set scan store type */
  setScanStoreType: (type: ReceiptType) => void;

  /** Set scan currency */
  setScanCurrency: (currency: SupportedCurrency) => void;

  // Story 14e-34a: setBatchImages removed - now uses useScanStore.setImages directly

  /** Show batch preview modal */
  setShowBatchPreview: (show: boolean) => void;

  /** Show toast message */
  setToastMessage: (message: ToastMessage) => void;

  /** Skip scan complete modal */
  setSkipScanCompleteModal: (skip: boolean) => void;

  /** Set credit used in session */
  setCreditUsedInSession: (used: boolean) => void;

  /** Set is rescanning flag */
  setIsRescanning: (rescanning: boolean) => void;

  /** Deduct user credits */
  deductUserCredits: (amount: number) => Promise<boolean>;

  /** Add user credits (for refunds) */
  addUserCredits: (amount: number) => Promise<void>;

  /** Process scan callback (calls processScan handler) */
  processScan: (images?: string[]) => Promise<void>;

  /** Reconcile items total helper */
  reconcileItemsTotal: (
    items: any[],
    total: number,
    lang: 'en' | 'es'
  ) => { items: any[]; hasDiscrepancy: boolean };

  /** Translation function */
  t: (key: string) => string;

  // =========================================================================
  // Refs
  // =========================================================================

  /** File input ref (must be set up by ScanFeature) */
  fileInputRef: RefObject<HTMLInputElement>;
}

/**
 * Return type for the useScanInitiation hook.
 */
export interface ScanInitiationHandlers {
  /** Start new transaction (from camera button or + button) */
  handleNewTransaction: (autoOpenFilePicker: boolean) => void;

  /** Handle file selection from input */
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;

  /** Rescan existing transaction with stored images */
  handleRescan: () => Promise<void>;

  /** Legacy trigger scan (backward compat) */
  triggerScan: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook that provides scan initiation handlers.
 *
 * Extracts handlers from App.tsx:
 * - handleNewTransaction (~45 lines)
 * - handleFileSelect (~63 lines)
 * - handleRescan (~87 lines)
 *
 * @param props - External dependencies needed by handlers
 * @returns Object containing all scan initiation handlers
 */
export function useScanInitiation(props: ScanInitiationProps): ScanInitiationHandlers {
  const {
    scanState,
    hasBatchReceipts,
    scanImages,
    currentTransaction,
    createDefaultTransaction,
    defaultCurrency,
    userCredits,
    lang,
    setTransactionEditorMode,
    setCurrentTransaction,
    setScanImages,
    setScanError,
    setScanStoreType,
    setScanCurrency,
    // Story 14e-34a: setBatchImages removed - now uses useScanStore.setImages
    setShowBatchPreview,
    setToastMessage,
    setSkipScanCompleteModal,
    setCreditUsedInSession,
    setIsRescanning,
    deductUserCredits,
    addUserCredits,
    processScan,
    reconcileItemsTotal,
    t,
    fileInputRef,
  } = props;

  // =========================================================================
  // Store Access
  // =========================================================================

  const {
    dismissDialog: dismissScanDialog,
    setBatchEditingIndex: setBatchEditingIndexContext,
    // Story 14e-34a: Use setImages from store (single source of truth)
    setImages: setBatchImages,
  } = useScanStore();
  const { setView, navigateToView } = useNavigationStore();

  // =========================================================================
  // handleNewTransaction
  // =========================================================================

  /**
   * Handle starting a new transaction (from camera button or + button).
   *
   * Flow:
   * 1. If batch review active, navigate to batch-review
   * 2. Clear batch editing state if needed
   * 3. Check for existing pending scan with content
   * 4. If pending scan exists, restore it to transaction-editor
   * 5. Otherwise, create fresh session and open file picker if requested
   *
   * @param autoOpenFilePicker - If true, opens file picker after navigating
   */
  const handleNewTransaction = useCallback((autoOpenFilePicker: boolean) => {
    // If batch review is active, show that instead
    if (hasBatchReceipts) {
      setView('batch-review');
      return;
    }

    // Clear batch editing state when starting fresh single scan
    if (scanState.batchEditingIndex !== null) {
      setBatchEditingIndexContext(null);
    }

    // Check for existing pending scan with content
    const hasExistingContent = scanState.phase !== 'idle' &&
      (scanState.images.length > 0 || scanState.results.length > 0);
    if (hasExistingContent) {
      // Clear QuickSaveCard when restoring pending transaction
      if (scanState.activeDialog?.type === DIALOG_TYPES.QUICKSAVE) {
        dismissScanDialog();
      }

      if (scanState.results.length > 0) {
        setCurrentTransaction(scanState.results[0]);
      } else {
        setCurrentTransaction(createDefaultTransaction());
      }
      setTransactionEditorMode('new');
      navigateToView('transaction-editor');
      return;
    }

    // No pending scan - create fresh session
    setScanImages([]);
    setScanError(null);
    setScanStoreType('auto');
    setScanCurrency(defaultCurrency || 'CLP');
    setCurrentTransaction(createDefaultTransaction());

    // Camera button opens file picker, manual "+" goes directly to editor
    if (autoOpenFilePicker) {
      navigateToView('transaction-editor');
      setTimeout(() => fileInputRef.current?.click(), 200);
    } else {
      navigateToView('transaction-editor');
    }
  }, [
    hasBatchReceipts,
    scanState,
    defaultCurrency,
    setView,
    navigateToView,
    setBatchEditingIndexContext,
    dismissScanDialog,
    setCurrentTransaction,
    setTransactionEditorMode,
    setScanImages,
    setScanError,
    setScanStoreType,
    setScanCurrency,
    createDefaultTransaction,
    fileInputRef,
  ]);

  // =========================================================================
  // handleFileSelect
  // =========================================================================

  /**
   * Handle file selection from file input.
   *
   * Flow:
   * 1. Single scan mode + multiple files: Only use first image, show toast
   * 2. Batch mode + multiple files: Show batch preview (or limit toast)
   * 3. Single file: Navigate to editor and auto-trigger processScan
   *
   * @param e - File input change event
   */
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);

    // Single scan mode: Only use first image if multiple selected
    // Show toast suggesting batch mode for multiple images
    // Don't auto-scan - let user review the image first
    const isSingleScanMode = scanState.mode !== 'batch';
    if (isSingleScanMode && files.length > 1) {
      setToastMessage({ text: t('singleScanOneImageOnly'), type: 'info' });
      // Only process the first image
      const singleFile = files[0];
      const singleImage = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(singleFile);
      });
      const updatedImages = [...scanImages, singleImage];
      setScanImages(updatedImages);
      setView('transaction-editor');
      setTransactionEditorMode('new');
      setSkipScanCompleteModal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Don't auto-trigger scan - user selected multiple images so let them review first
      return;
    }

    const newImages = await Promise.all(
      files.map(
        f =>
          new Promise<string>(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
          })
      )
    );

    // Multi-image upload in batch mode - show batch preview
    if (newImages.length > 1) {
      if (newImages.length > MAX_BATCH_IMAGES) {
        setToastMessage({ text: t('batchMaxLimitError'), type: 'info' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setBatchImages(newImages);
      setShowBatchPreview(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Single image - go to transaction editor
    const updatedImages = [...scanImages, ...newImages];
    setScanImages(updatedImages);
    setView('transaction-editor');
    setTransactionEditorMode('new');
    setSkipScanCompleteModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Auto-trigger scan processing - pass images directly to avoid stale closure
    // The setTimeout allows the view to update before processing starts
    setTimeout(() => {
      processScan(updatedImages);
    }, 100);
  }, [
    scanState.mode,
    scanImages,
    t,
    setScanImages,
    setView,
    setTransactionEditorMode,
    setSkipScanCompleteModal,
    setBatchImages,
    setShowBatchPreview,
    setToastMessage,
    processScan,
    fileInputRef,
  ]);

  // =========================================================================
  // handleRescan
  // =========================================================================

  /**
   * Re-scan existing transaction with stored imageUrls.
   *
   * Flow:
   * 1. Validate transaction has images
   * 2. Check credits
   * 3. Deduct credit before API call
   * 4. Call analyzeReceipt with isRescan=true
   * 5. Process result and update transaction
   * 6. Refund credit on API error
   */
  const handleRescan = useCallback(async () => {
    if (!currentTransaction?.id || !currentTransaction.imageUrls?.length) {
      // Early return - expected when called without valid transaction context
      return;
    }
    if (userCredits.remaining <= 0) {
      setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
      return;
    }

    // Deduct credit immediately to prevent exploits
    const deducted = await deductUserCredits(1);
    if (!deducted) {
      setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
      return;
    }

    setCreditUsedInSession(true);
    setIsRescanning(true);

    try {
      // isRescan=true so Cloud Function fetches from URLs instead of base64
      const result = await analyzeReceipt(
        currentTransaction.imageUrls,
        '', // V3 auto-detects currency, empty string skips currency hint
        undefined,  // receiptType auto-detected
        true  // isRescan - images are URLs, not base64
      );

      // Process the result similar to processScan
      let d = getSafeDate(result.date);
      if (new Date(d).getFullYear() > new Date().getFullYear())
        d = new Date().toISOString().split('T')[0];

      const receiptTotal = parseStrictNumber(result.total);

      const parsedItems = (result.items || []).map(i => ({
        ...i,
        price: parseStrictNumber(i.price),
        qty: (i as any).quantity ?? i.qty ?? 1,
      }));

      const { items: reconciledItems, hasDiscrepancy } = reconcileItemsTotal(
        parsedItems,
        receiptTotal,
        lang
      );

      // Preserve user-edited fields, update AI-extracted fields
      const updatedTransaction: Transaction = {
        ...currentTransaction,
        // AI-extracted fields (overwrite)
        merchant: result.merchant || currentTransaction.merchant,
        date: d,
        total: receiptTotal,
        category: result.category || currentTransaction.category,
        items: reconciledItems,
        // V3 fields
        time: result.time || currentTransaction.time,
        country: result.country || currentTransaction.country,
        city: result.city || currentTransaction.city,
        currency: result.currency || currentTransaction.currency,
        receiptType: result.receiptType,
        promptVersion: result.promptVersion,
        // Preserve existing imageUrls (already stored)
        imageUrls: currentTransaction.imageUrls,
        thumbnailUrl: currentTransaction.thumbnailUrl,
        // Keep the alias if user edited it
        alias: currentTransaction.alias || result.merchant,
      };

      setCurrentTransaction(updatedTransaction);

      if (hasDiscrepancy) {
        setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
      } else {
        setToastMessage({ text: t('rescanSuccess'), type: 'success' });
      }
    } catch (e: any) {
      console.error('Re-scan failed:', e);
      // Restore credit on API error only
      await addUserCredits(1);
      setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
    } finally {
      setIsRescanning(false);
    }
  }, [
    currentTransaction,
    userCredits.remaining,
    lang,
    t,
    deductUserCredits,
    addUserCredits,
    setCurrentTransaction,
    setToastMessage,
    setCreditUsedInSession,
    setIsRescanning,
    reconcileItemsTotal,
  ]);

  // =========================================================================
  // triggerScan (legacy backward compat)
  // =========================================================================

  /**
   * Legacy scan handler for backward compatibility.
   * Calls handleNewTransaction with autoOpenFilePicker=true.
   */
  const triggerScan = useCallback(() => {
    handleNewTransaction(true);
  }, [handleNewTransaction]);

  // =========================================================================
  // Return all handlers
  // =========================================================================

  return {
    handleNewTransaction,
    handleFileSelect,
    handleRescan,
    triggerScan,
  };
}