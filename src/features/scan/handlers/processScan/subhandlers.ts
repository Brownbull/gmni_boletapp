/**
 * ProcessScan Sub-Handlers
 *
 * Modular sub-handlers extracted from the processScan function.
 * Each handler is focused on a specific responsibility:
 * - validateScanResult: Total validation + dialog trigger
 * - applyAllMappings: Category + merchant + item name mappings
 * - handleCurrencyDetection: Currency check + dialog trigger
 * - handleScanSuccess: QuickSave/Trusted/EditView routing
 *
 * Story 14e-8b: Sub-handlers extraction
 *
 * @module features/scan/handlers/processScan/subhandlers
 */

import type {
  Transaction,
  TransactionItem,
  MappingDependencies,
  UIDependencies,
  TotalMismatchDialogData,
  CurrencyMismatchDialogData,
  QuickSaveDialogData,
  ValidateScanResultOutput,
  CurrencyDetectionResult,
  ScanSuccessResult,
  ScanOverlayController,
} from './types';

import { validateTotal, type TotalValidationResult } from '@/utils/totalValidation';
import { shouldShowQuickSave, calculateConfidence } from '@/utils/confidenceCheck';
import { TRANSLATIONS } from '@/utils/translations';

// =============================================================================
// Constants
// =============================================================================

/**
 * Minimum confidence score required for a merchant match to be applied.
 * Matches below this threshold are ignored to avoid false positives.
 */
const MERCHANT_MATCH_CONFIDENCE_THRESHOLD = 0.7;

// =============================================================================
// validateScanResult
// =============================================================================

/**
 * Dependencies for validateScanResult sub-handler.
 */
export interface ValidateScanResultDeps {
  /** Show scan dialog (for total mismatch) */
  showScanDialog: UIDependencies['showScanDialog'];
  /**
   * Set analyzing state
   * @deprecated Story 14e-25d: No-op - state managed by state machine
   */
  setIsAnalyzing?: UIDependencies['setIsAnalyzing'];
  /** Scan overlay controller */
  scanOverlay: ScanOverlayController;
  /** Reconcile items total function */
  reconcileItemsTotal: (
    items: TransactionItem[],
    total: number,
    lang: 'en' | 'es'
  ) => { items: TransactionItem[]; hasDiscrepancy: boolean; discrepancyAmount: number };
  /** Language code */
  lang: 'en' | 'es';
}

/**
 * Validate scan result total against items sum.
 *
 * If discrepancy > 40%, shows TotalMismatchDialog and returns shouldContinue: false.
 * Otherwise, reconciles items (adds adjustment item if needed) and continues.
 *
 * @param transaction - Temporary transaction built from scan result
 * @param parsedItems - Parsed items from scan result
 * @param deps - Dependencies for validation
 * @returns Validation result with continue/abort signal
 *
 * @example
 * ```typescript
 * const result = validateScanResult(tempTransaction, parsedItems, {
 *   showScanDialog,
 *   scanOverlay,
 *   reconcileItemsTotal,
 *   lang: 'es',
 * });
 *
 * if (!result.shouldContinue) {
 *   return; // Dialog shown, wait for user action
 * }
 *
 * // Continue with result.reconciledItems
 * ```
 */
export function validateScanResult(
  transaction: Transaction,
  parsedItems: TransactionItem[],
  deps: ValidateScanResultDeps
): ValidateScanResultOutput {
  const { showScanDialog, scanOverlay, reconcileItemsTotal, lang } = deps;

  // Validate total using centralized utility
  const totalValidation: TotalValidationResult = validateTotal(transaction);

  if (!totalValidation.isValid) {
    // Build dialog data for TotalMismatchDialog
    const dialogData: TotalMismatchDialogData = {
      validationResult: totalValidation,
      pendingTransaction: transaction,
      parsedItems,
    };

    showScanDialog('total_mismatch', dialogData);
    // Story 14e-25d: setIsAnalyzing removed - state managed by state machine
    scanOverlay.setReady();

    return {
      isValid: false,
      shouldContinue: false,
    };
  }

  // Reconcile items total with receipt total (add adjustment item if needed)
  const { items: reconciledItems, hasDiscrepancy } = reconcileItemsTotal(
    parsedItems,
    transaction.total,
    lang
  );

  return {
    isValid: true,
    shouldContinue: true,
    reconciledItems,
    hasDiscrepancy,
  };
}

// =============================================================================
// applyAllMappings
// =============================================================================

/**
 * Dependencies for applyAllMappings sub-handler.
 */
export interface ApplyAllMappingsDeps {
  /** Mapping dependencies */
  mapping: MappingDependencies;
  /** Firebase user ID (for fire-and-forget updates) */
  userId?: string;
}

/**
 * Result of applying all mappings.
 */
export interface ApplyAllMappingsResult {
  /** Transaction with all mappings applied */
  transaction: Transaction;
  /** IDs of category mappings applied */
  appliedCategoryMappingIds: string[];
  /** ID of merchant mapping applied (if any) */
  appliedMerchantMappingId?: string;
  /** IDs of item name mappings applied */
  appliedItemNameMappingIds: string[];
  /** The normalized merchant name (if merchant was matched) */
  normalizedMerchant?: string;
}

/**
 * Apply all learned mappings to a transaction.
 *
 * Applies mappings in order:
 * 1. Category mappings (item categories based on learned preferences)
 * 2. Merchant mapping (alias, store category)
 * 3. Item name mappings (scoped to matched merchant)
 *
 * Also increments usage counters for applied mappings (fire-and-forget).
 *
 * @param transaction - Initial transaction to apply mappings to
 * @param deps - Mapping dependencies
 * @returns Transaction with all mappings applied and lists of applied mapping IDs
 *
 * @example
 * ```typescript
 * const result = applyAllMappings(initialTransaction, {
 *   mapping: mappingDeps,
 *   userId: user.uid,
 * });
 *
 * // result.transaction has all mappings applied
 * // result.appliedCategoryMappingIds, appliedMerchantMappingId, appliedItemNameMappingIds
 * ```
 */
export function applyAllMappings(
  transaction: Transaction,
  deps: ApplyAllMappingsDeps
): ApplyAllMappingsResult {
  const { mapping, userId } = deps;
  const {
    mappings,
    applyCategoryMappings,
    findMerchantMatch,
    applyItemNameMappings,
    incrementMappingUsage,
    incrementMerchantMappingUsage,
    incrementItemNameMappingUsage,
  } = mapping;

  const appliedCategoryMappingIds: string[] = [];
  const appliedItemNameMappingIds: string[] = [];
  let appliedMerchantMappingId: string | undefined;
  let normalizedMerchant: string | undefined;

  // Step 1: Apply category mappings
  const { transaction: categorizedTransaction, appliedMappingIds } = applyCategoryMappings(
    transaction,
    mappings
  );

  appliedCategoryMappingIds.push(...appliedMappingIds);

  // Increment usage for category mappings (fire-and-forget)
  if (appliedMappingIds.length > 0 && userId) {
    appliedMappingIds.forEach((mappingId) => {
      incrementMappingUsage(mappingId);
    });
  }

  // Step 2: Apply merchant mapping
  let finalTransaction = categorizedTransaction;
  const merchantMatch = findMerchantMatch(categorizedTransaction.merchant);

  if (merchantMatch && merchantMatch.confidence > MERCHANT_MATCH_CONFIDENCE_THRESHOLD) {
    finalTransaction = {
      ...finalTransaction,
      alias: merchantMatch.mapping.targetMerchant,
      ...(merchantMatch.mapping.storeCategory && {
        category: merchantMatch.mapping.storeCategory as Transaction['category'],
      }),
      merchantSource: 'learned' as const,
    };

    appliedMerchantMappingId = merchantMatch.mapping.id;
    normalizedMerchant = merchantMatch.mapping.normalizedMerchant;

    // Increment usage for merchant mapping (fire-and-forget)
    if (merchantMatch.mapping.id && userId) {
      incrementMerchantMappingUsage(merchantMatch.mapping.id);
    }

    // Step 3: Apply item name mappings (scoped to matched merchant)
    const { transaction: txWithItemNames, appliedIds: itemNameMappingIds } = applyItemNameMappings(
      finalTransaction,
      merchantMatch.mapping.normalizedMerchant
    );

    finalTransaction = txWithItemNames;
    appliedItemNameMappingIds.push(...itemNameMappingIds);

    // Increment usage for item name mappings (fire-and-forget)
    if (itemNameMappingIds.length > 0 && userId) {
      itemNameMappingIds.forEach((id) => {
        incrementItemNameMappingUsage(id);
      });
    }
  }

  return {
    transaction: finalTransaction,
    appliedCategoryMappingIds,
    appliedMerchantMappingId,
    appliedItemNameMappingIds,
    normalizedMerchant,
  };
}

// =============================================================================
// handleCurrencyDetection
// =============================================================================

/**
 * Dependencies for handleCurrencyDetection sub-handler.
 */
export interface HandleCurrencyDetectionDeps {
  /** Show scan dialog (for currency mismatch) */
  showScanDialog: UIDependencies['showScanDialog'];
  /**
   * Set analyzing state
   * @deprecated Story 14e-25d: No-op - state managed by state machine
   */
  setIsAnalyzing?: UIDependencies['setIsAnalyzing'];
  /** Scan overlay controller */
  scanOverlay: ScanOverlayController;
}

/**
 * Handle currency detection logic.
 *
 * Compares detected currency against user's default currency.
 * If different, shows CurrencyMismatchDialog and returns shouldContinue: false.
 * If no currency detected, uses user's default.
 *
 * @param detectedCurrency - Currency detected from scan (may be undefined)
 * @param userDefaultCurrency - User's configured default currency
 * @param transaction - Transaction to check/update
 * @param hasDiscrepancy - Whether there was an item total discrepancy
 * @param deps - Dependencies
 * @returns Currency detection result with continue signal
 *
 * @example
 * ```typescript
 * const result = handleCurrencyDetection(
 *   transaction.currency,
 *   userPreferences.defaultCurrency,
 *   transaction,
 *   hasDiscrepancy,
 *   { showScanDialog, scanOverlay }
 * );
 *
 * if (!result.shouldContinue) {
 *   return; // Dialog shown, wait for user choice
 * }
 *
 * // Use result.finalCurrency
 * ```
 */
export function handleCurrencyDetection(
  detectedCurrency: string | undefined,
  userDefaultCurrency: string | undefined,
  transaction: Transaction,
  hasDiscrepancy: boolean,
  deps: HandleCurrencyDetectionDeps
): CurrencyDetectionResult {
  const { showScanDialog, scanOverlay } = deps;

  // Check for currency mismatch
  if (detectedCurrency && userDefaultCurrency && detectedCurrency !== userDefaultCurrency) {
    const dialogData: CurrencyMismatchDialogData = {
      detectedCurrency,
      pendingTransaction: transaction,
      hasDiscrepancy,
    };

    showScanDialog('currency_mismatch', dialogData);
    // Story 14e-25d: setIsAnalyzing removed - state managed by state machine
    scanOverlay.setReady();

    return {
      shouldContinue: false,
    };
  }

  // If no currency detected, use user's default
  const finalCurrency = detectedCurrency || userDefaultCurrency || undefined;

  return {
    shouldContinue: true,
    finalCurrency,
  };
}

// =============================================================================
// handleScanSuccess
// =============================================================================

/**
 * Dependencies for handleScanSuccess sub-handler.
 */
export interface HandleScanSuccessDeps {
  /** Check if merchant is trusted (async) */
  checkTrusted: (merchantAlias: string) => Promise<boolean>;
  /** Show scan dialog (for quick save) */
  showScanDialog: UIDependencies['showScanDialog'];
  /** Set skip scan complete modal flag */
  setSkipScanCompleteModal: UIDependencies['setSkipScanCompleteModal'];
  /** Set animate edit view items flag */
  setAnimateEditViewItems: UIDependencies['setAnimateEditViewItems'];
}

/**
 * Handle scan success routing logic.
 *
 * Determines the appropriate route after successful scan:
 * 1. Trusted merchant → Auto-save path
 * 2. High confidence (≥85%) → QuickSave card
 * 3. Low confidence → EditView for manual review
 *
 * @param transaction - Final transaction after all processing
 * @param deps - Dependencies for routing decision
 * @returns Routing decision (quicksave, trusted-autosave, or edit-view)
 * @throws If `checkTrusted` rejects (e.g., network error during Firestore lookup)
 *
 * @example
 * ```typescript
 * const result = await handleScanSuccess(finalTransaction, {
 *   checkTrusted,
 *   showScanDialog,
 *   setSkipScanCompleteModal,
 *   setAnimateEditViewItems,
 * });
 *
 * switch (result.route) {
 *   case 'trusted-autosave':
 *     // Auto-save the transaction
 *     break;
 *   case 'quicksave':
 *     // QuickSave dialog already shown
 *     break;
 *   case 'edit-view':
 *     // Navigate to edit view
 *     break;
 * }
 * ```
 */
export async function handleScanSuccess(
  transaction: Transaction,
  deps: HandleScanSuccessDeps
): Promise<ScanSuccessResult> {
  const { checkTrusted, showScanDialog, setSkipScanCompleteModal, setAnimateEditViewItems } = deps;

  const merchantAlias = transaction.alias || transaction.merchant;
  const confidence = calculateConfidence(transaction);

  // Check trusted merchant status
  const isTrusted = merchantAlias ? await checkTrusted(merchantAlias) : false;
  const willShowQuickSave = !isTrusted && shouldShowQuickSave(transaction);

  // Set modal skip flag if we're showing QuickSave or doing auto-save
  if (willShowQuickSave || isTrusted) {
    setSkipScanCompleteModal(true);
  }

  if (isTrusted) {
    // Trusted merchant - auto-save path
    return {
      route: 'trusted-autosave',
      confidence,
      isTrusted: true,
    };
  }

  if (willShowQuickSave) {
    // High confidence - show QuickSave card
    const dialogData: QuickSaveDialogData = {
      transaction,
      confidence,
    };
    showScanDialog('quicksave', dialogData);

    return {
      route: 'quicksave',
      confidence,
      isTrusted: false,
    };
  }

  // Low confidence - stay on editor for manual review
  setAnimateEditViewItems(true);

  return {
    route: 'edit-view',
    confidence,
    isTrusted: false,
  };
}

// =============================================================================
// Utility: reconcileItemsTotal
// =============================================================================

/**
 * Reconcile items total with receipt total.
 *
 * If there's a discrepancy between items sum and receipt total,
 * adds an adjustment item to make them match:
 * - Positive difference (receipt > items): "Unitemized charge" / "Cargo sin detallar"
 * - Negative difference (items > receipt): "Discount/Adjustment" / "Descuento/Ajuste"
 *
 * This is a pure function extracted for testability.
 *
 * @param items - Original items from scan
 * @param receiptTotal - Total from receipt
 * @param lang - Language for adjustment item name
 * @returns Reconciled items and discrepancy info
 */
export function reconcileItemsTotal(
  items: TransactionItem[],
  receiptTotal: number,
  lang: 'en' | 'es'
): { items: TransactionItem[]; hasDiscrepancy: boolean; discrepancyAmount: number } {
  // Calculate items sum (price is already line total, not unit price)
  const itemsSum = items.reduce((sum, item) => {
    const price = typeof item.price === 'number' ? item.price : 0;
    return sum + price;
  }, 0);

  // Round to avoid floating point issues
  const roundedItemsSum = Math.round(itemsSum * 100) / 100;
  const roundedReceiptTotal = Math.round(receiptTotal * 100) / 100;
  const difference = Math.round((roundedReceiptTotal - roundedItemsSum) * 100) / 100;

  // Allow small discrepancies (< $1)
  if (Math.abs(difference) < 1) {
    return { items, hasDiscrepancy: false, discrepancyAmount: 0 };
  }

  // Get adjustment item name based on direction
  const translations = TRANSLATIONS[lang];
  const adjustmentName = difference > 0 ? translations.surplusItem : translations.discountItem;

  // Add adjustment item
  const adjustmentItem: TransactionItem = {
    name: adjustmentName,
    price: difference,
    qty: 1,
    category: 'Other',
  };

  return {
    items: [...items, adjustmentItem],
    hasDiscrepancy: true,
    discrepancyAmount: difference,
  };
}
