/**
 * ProcessScan Main Handler
 *
 * Main orchestration function for receipt scanning workflow.
 * Coordinates: validation -> mappings -> currency -> success routing.
 *
 * Story 14e-8c: Main handler integration
 *
 * @module features/scan/handlers/processScan/processScan
 */

import type {
  ProcessScanParams,
  ProcessScanResult,
  ScanResult,
  Transaction,
  TransactionItem,
  StoreCategory,
} from './types';

import {
  getSafeDate,
  parseStrictNumber,
  parseLocationResult,
  buildInitialTransaction,
} from './utils';

import {
  validateScanResult,
  applyAllMappings,
  handleCurrencyDetection,
  handleScanSuccess,
  reconcileItemsTotal,
} from './subhandlers';

import { calculateConfidence } from '@/utils/confidenceCheck';

// =============================================================================
// Constants
// =============================================================================

/** Default processing timeout in milliseconds */
const DEFAULT_PROCESSING_TIMEOUT_MS = 120000;

// =============================================================================
// Main Handler
// =============================================================================

/**
 * Process scanned receipt image(s) through OCR and validation pipeline.
 *
 * This is the main orchestration function that:
 * 1. Validates input (images, credits)
 * 2. Calls Gemini OCR via Cloud Function
 * 3. Builds initial transaction from scan result
 * 4. Validates total (shows dialog if large discrepancy)
 * 5. Applies learned mappings (category, merchant, item names)
 * 6. Handles currency detection (shows dialog if mismatch)
 * 7. Routes to success handler (quicksave, trusted auto-save, or edit view)
 *
 * @param params - All dependencies grouped by category
 * @returns ProcessScanResult with success status and routing decision
 *
 * @example
 * ```typescript
 * const result = await processScan({
 *   scan: { images, currency, storeType, defaultCountry, defaultCity },
 *   user: { userId, creditsRemaining, defaultCurrency, transactions },
 *   mapping: { mappings, applyCategoryMappings, ... },
 *   ui: { setScanError, setCurrentTransaction, ... },
 *   services: { analyzeReceipt, deductUserCredits, ... },
 *   scanOverlay,
 *   t,
 *   lang: 'es',
 *   viewMode: 'personal',
 * });
 *
 * if (result.success && result.route === 'edit-view') {
 *   // Navigate to edit view
 * }
 * ```
 */
export async function processScan(params: ProcessScanParams): Promise<ProcessScanResult> {
  const {
    scan,
    user,
    mapping,
    ui,
    scanOverlay,
    services,
    t,
    lang,
    viewMode,
    activeGroupId,
    trustedAutoSave,
    prefersReducedMotion = false,
    processingTimeoutMs = DEFAULT_PROCESSING_TIMEOUT_MS,
  } = params;

  // ==========================================================================
  // Step 1: Validate Images
  // ==========================================================================

  if (!scan.images || scan.images.length === 0) {
    console.error('processScan called with no images');
    ui.setScanError(t('noImagesToScan') || 'No images to scan');
    return { success: false, error: 'No images to scan' };
  }

  // ==========================================================================
  // Step 2: Check Credits
  // ==========================================================================

  if (user.creditsRemaining <= 0) {
    ui.setScanError(t('noCreditsMessage'));
    ui.setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
    return { success: false, error: 'No credits' };
  }

  // ==========================================================================
  // Step 3: Deduct Credit
  // ==========================================================================

  const deducted = await services.deductUserCredits(1);
  if (!deducted) {
    ui.setScanError(t('noCreditsMessage'));
    ui.setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
    return { success: false, error: 'Credit deduction failed' };
  }

  ui.setCreditUsedInSession(true);
  ui.dispatchProcessStart('normal', 1);
  scanOverlay.startUpload();
  scanOverlay.setProgress(100);
  scanOverlay.startProcessing();

  try {
    // ========================================================================
    // Step 4: Call Gemini OCR
    // ========================================================================

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Request timed out. Please check your connection and try again.')),
        processingTimeoutMs
      );
    });

    const result: ScanResult = await Promise.race([
      services.analyzeReceipt(
        scan.images,
        scan.currency,
        scan.storeType !== 'auto' ? (scan.storeType as any) : undefined
      ),
      timeoutPromise,
    ]);

    // ========================================================================
    // Step 5: Parse and Validate Basic Fields
    // ========================================================================

    // Parse date with year validation
    let date = getSafeDate(result.date);
    if (new Date(date).getFullYear() > new Date().getFullYear()) {
      date = new Date().toISOString().split('T')[0];
    }

    const merchant = result.merchant || 'Unknown';
    const finalTotal = parseStrictNumber(result.total);

    // Parse location with validation
    const location = parseLocationResult(
      { country: result.country, city: result.city },
      { defaultCountry: scan.defaultCountry, defaultCity: scan.defaultCity },
      services.getCitiesForCountry
    );

    // Normalize items (map 'quantity' to 'qty', parse prices)
    const parsedItems: TransactionItem[] = (result.items || []).map((item) => ({
      ...item,
      price: parseStrictNumber(item.price),
      qty: item.quantity ?? item.qty ?? 1,
    }));

    // ========================================================================
    // Step 6: Validate Total (May Show Dialog)
    // ========================================================================

    // Build temporary transaction for validation
    const tempTransaction: Transaction = {
      merchant,
      date,
      total: finalTotal,
      category: (result.category || 'Other') as StoreCategory,
      alias: merchant,
      items: parsedItems,
      imageUrls: result.imageUrls,
      thumbnailUrl: result.thumbnailUrl,
      time: result.time,
      country: location.country,
      city: location.city,
      currency: result.currency,
      receiptType: result.receiptType,
      promptVersion: result.promptVersion,
      merchantSource: result.merchantSource,
    };

    const validationResult = validateScanResult(tempTransaction, parsedItems, {
      showScanDialog: ui.showScanDialog,
      // Story 14e-25d: setIsAnalyzing removed - state managed by state machine
      scanOverlay,
      reconcileItemsTotal,
      lang,
    });

    if (!validationResult.shouldContinue) {
      // Dialog shown, wait for user action
      return { success: false, error: 'Total validation dialog shown' };
    }

    // ========================================================================
    // Step 7: Build Initial Transaction
    // ========================================================================

    const reconciledItems = validationResult.reconciledItems || parsedItems;
    const hasDiscrepancy = validationResult.hasDiscrepancy || false;

    const initialTransaction = buildInitialTransaction(
      result,
      reconciledItems,
      location,
      finalTotal,
      date,
      { viewMode, activeGroupId, language: lang }
    );

    // ========================================================================
    // Step 8: Apply All Mappings
    // ========================================================================

    const mappingResult = applyAllMappings(initialTransaction, {
      mapping,
      userId: user.userId,
    });

    let finalTransaction = mappingResult.transaction;

    // ========================================================================
    // Step 9: Handle Currency Detection (May Show Dialog)
    // ========================================================================

    const currencyResult = handleCurrencyDetection(
      finalTransaction.currency,
      user.defaultCurrency,
      finalTransaction,
      hasDiscrepancy,
      {
        showScanDialog: ui.showScanDialog,
        // Story 14e-25d: setIsAnalyzing removed - state managed by state machine
        scanOverlay,
      }
    );

    if (!currencyResult.shouldContinue) {
      // Dialog shown, wait for user choice
      return { success: false, error: 'Currency mismatch dialog shown' };
    }

    // Apply final currency if determined
    if (currencyResult.finalCurrency && currencyResult.finalCurrency !== finalTransaction.currency) {
      finalTransaction = {
        ...finalTransaction,
        currency: currencyResult.finalCurrency,
      };
    }

    // ========================================================================
    // Step 10: Set Current Transaction
    // ========================================================================

    ui.setCurrentTransaction(finalTransaction);

    // ========================================================================
    // Step 11: Determine Success Route
    // ========================================================================

    // If trustedAutoSave dependencies provided, check trusted status
    let routeResult: { route: 'quicksave' | 'trusted-autosave' | 'edit-view'; confidence?: number; isTrusted?: boolean };

    if (trustedAutoSave) {
      routeResult = await handleScanSuccess(finalTransaction, {
        checkTrusted: trustedAutoSave.checkTrusted,
        showScanDialog: ui.showScanDialog,
        setSkipScanCompleteModal: ui.setSkipScanCompleteModal,
        setAnimateEditViewItems: ui.setAnimateEditViewItems,
      });
    } else {
      // No trusted check - default to edit view
      const confidence = calculateConfidence(finalTransaction);
      ui.setAnimateEditViewItems(true);
      routeResult = { route: 'edit-view', confidence, isTrusted: false };
    }

    // ========================================================================
    // Step 12: Dispatch Success
    // ========================================================================

    ui.dispatchProcessSuccess([finalTransaction]);
    scanOverlay.setReady();

    // Haptic feedback on scan success (only when motion enabled)
    if (!prefersReducedMotion && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Show warning if items total didn't match receipt total
    if (hasDiscrepancy) {
      ui.setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
    }

    // ========================================================================
    // Step 13: Handle Trusted Merchant Auto-Save (if applicable)
    // ========================================================================

    if (routeResult.route === 'trusted-autosave' && trustedAutoSave) {
      const merchantAlias = finalTransaction.alias || finalTransaction.merchant;

      try {
        // Save transaction
        const transactionId = await trustedAutoSave.saveTransaction(finalTransaction);
        const txWithId = { ...finalTransaction, id: transactionId };

        // Generate insight
        const insight = await trustedAutoSave.generateInsight(
          txWithId,
          user.transactions,
          trustedAutoSave.insightProfile || {
            schemaVersion: 1,
            firstTransactionDate: null as unknown as Date,
            totalTransactions: 0,
            recentInsights: [],
          },
          trustedAutoSave.insightCache
        );

        // Add to batch
        trustedAutoSave.addToBatch(txWithId, insight);

        // Record merchant scan (not edited since it was auto-saved)
        await trustedAutoSave.recordMerchantScan(merchantAlias, false).catch((err) =>
          console.warn('Failed to record merchant scan:', err)
        );

        // Clean up scan state
        ui.setScanImages([]);
        ui.setCurrentTransaction(null);
        ui.setToastMessage({ text: t('autoSaved'), type: 'success' });
        ui.setView('dashboard');

        // Show insight or batch summary
        const silenced = trustedAutoSave.isInsightsSilenced(trustedAutoSave.insightCache);
        if (!silenced && insight) {
          const willBeBatchMode = (trustedAutoSave.batchSession?.receipts.length ?? 0) + 1 >= 3;
          if (willBeBatchMode && trustedAutoSave.onShowBatchSummary) {
            trustedAutoSave.onShowBatchSummary();
          } else if (trustedAutoSave.onShowInsight) {
            trustedAutoSave.onShowInsight(insight);
          }
        }

        return {
          success: true,
          transaction: txWithId,
          route: 'trusted-autosave',
          hasDiscrepancy,
          isTrusted: true,
          confidence: routeResult.confidence,
        };
      } catch (autoSaveErr) {
        console.error('Auto-save failed:', autoSaveErr);
        // Fall back to Quick Save Card on error
        const confidence = calculateConfidence(finalTransaction);
        ui.showScanDialog('quicksave', {
          transaction: finalTransaction,
          confidence,
        });

        return {
          success: true,
          transaction: finalTransaction,
          route: 'quicksave',
          hasDiscrepancy,
          isTrusted: true, // Was trusted, but auto-save failed
          confidence,
        };
      }
    }

    // ========================================================================
    // Return Result
    // ========================================================================

    return {
      success: true,
      transaction: finalTransaction,
      route: routeResult.route,
      hasDiscrepancy,
      isTrusted: routeResult.isTrusted,
      confidence: routeResult.confidence,
    };
  } catch (e: unknown) {
    // ========================================================================
    // Error Handling + Credit Refund
    // ========================================================================

    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const fullErrorMessage = 'Failed: ' + errorMessage;

    ui.dispatchProcessError(fullErrorMessage);

    const isTimeout = errorMessage?.includes('timed out');
    scanOverlay.setError(isTimeout ? 'timeout' : 'api', fullErrorMessage);

    // Restore credit on API error
    await services.addUserCredits(1);
    ui.setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });

    return {
      success: false,
      error: fullErrorMessage,
    };
  }
}
