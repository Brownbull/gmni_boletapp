/**
 * Story 14c-refactor.20: useScanHandlers Hook
 *
 * Extracts scan-related event handlers from App.tsx into a reusable hook.
 * Handles scan overlay, quick save, currency/total mismatch dialogs, and
 * provides helper functions for scan flow management.
 *
 * Note: The core `processScan` function remains in App.tsx due to its deep
 * integration with multiple state variables and complex async flows.
 * This hook extracts the dialog handlers and utility functions that are
 * more easily modularized.
 *
 * Features:
 * - Scan overlay state handlers (cancel, retry, dismiss)
 * - Quick save handlers (save, edit, cancel, complete)
 * - Currency mismatch dialog handlers
 * - Total mismatch dialog handlers
 * - Conflict dialog handlers
 * - Item name mapping applier utility
 *
 * Architecture Reference: Epic 14c-refactor - App.tsx Handler Extraction
 * Dependencies:
 * - ScanContext (state machine, dialogs)
 * - useUserCredits (credit operations)
 * - useTrustedMerchants (auto-save eligibility)
 * - useItemNameMappings (learned name application)
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     handleScanOverlayCancel,
 *     handleQuickSave,
 *     handleCurrencyUseDetected,
 *   } = useScanHandlers({ ... });
 *
 *   return <ScanOverlay onCancel={handleScanOverlayCancel} />;
 * }
 * ```
 */

import { useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Transaction, TransactionItem } from '../../types/transaction';
import type { UserPreferences } from '../../services/userPreferencesService';
import type { Insight, UserInsightProfile, LocalInsightCache } from '../../types/insight';
import type { View } from '../../components/App';
import type { TrustPromptEligibility } from '../../types/trust';
import type {
    CurrencyMismatchDialogData,
    TotalMismatchDialogData,
    QuickSaveDialogData,
} from '../../types/scanStateMachine';
import { DIALOG_TYPES } from '../../types/scanStateMachine';
import {
    addTransaction as firestoreAddTransaction,
} from '../../services/firestore';
import {
    generateInsightForTransaction,
    isInsightsSilenced,
    getDefaultCache,
} from '../../services/insightEngineService';
import { shouldShowQuickSave, calculateConfidence } from '../../utils/confidenceCheck';
import { parseStrictNumber } from '../../utils/validation';
import { TRANSLATIONS } from '../../utils/translations';

// =============================================================================
// Types
// =============================================================================

/**
 * Toast message configuration
 */
interface ToastMessage {
    text: string;
    type: 'success' | 'info';
}

/**
 * Batch session interface for tracking multi-receipt scans
 * Using permissive type to avoid import issues - actual type is from useBatchSession
 */
interface BatchSession {
    receipts: Array<{ transaction?: Transaction; insight?: Insight | null } | Transaction>;
}

/**
 * Item name mapping for learned item names
 * Using permissive type - actual type is from types/itemNameMapping
 */
interface ItemNameMapping {
    id?: string;
    sourceItemName?: string;
    targetItemName: string;
    targetCategory?: string;
    normalizedMerchant?: string;
}

/**
 * Item name match result from findItemNameMatch
 */
interface ItemNameMatchResult {
    mapping: ItemNameMapping;
    confidence: number;
}

/**
 * Session context for insight display
 */
interface SessionContextData {
    transactionsSaved: number;
    consecutiveDays: number;
    isFirstOfWeek: boolean;
    isPersonalRecord: boolean;
    totalAmount: number;
    currency: string;
    categoriesTouched: string[];
}

/**
 * Scan overlay state interface
 */
interface ScanOverlayState {
    reset: () => void;
    retry: () => void;
}

/**
 * Props for useScanHandlers hook
 */
export interface UseScanHandlersProps {
    /** Authenticated user (null if not signed in) */
    user: User | null;
    /** Firebase services (db, appId) */
    services: { db: Firestore; appId: string } | null;
    /** User preferences for defaults */
    userPreferences: UserPreferences;
    /** All transactions for insight generation context */
    transactions: Transaction[];
    /** Current currency code */
    currency: string;
    /** Current language */
    lang: 'en' | 'es';

    // Current scan state
    /** Current transaction being edited */
    currentTransaction: Transaction | null;

    // Insight generation dependencies
    /** User insight profile for contextual insights */
    insightProfile: UserInsightProfile | null;
    /** Insight cache for silence and history */
    insightCache: LocalInsightCache | null;
    /** Record insight shown in history */
    recordInsightShown: (
        insightId: string,
        transactionId: string,
        content: { title: string; message: string; icon: string; category: string }
    ) => Promise<void>;
    /** Track transaction for profile stats */
    trackTransactionForInsight: (date: Date) => Promise<void>;
    /** Increment insight counter for sprinkle distribution */
    incrementInsightCounter: () => void;

    // Batch session for multi-receipt flow
    /** Current batch session state */
    batchSession: BatchSession | null;
    /** Add transaction to batch session */
    addToBatch: (tx: Transaction, insight: Insight | null) => void;

    // Trusted merchants
    /** Check if merchant is trusted for auto-save */
    checkTrusted: (merchantName: string) => Promise<boolean>;
    /** Record merchant scan for trust tracking */
    recordMerchantScan: (merchantName: string, wasEdited: boolean) => Promise<any>;

    // Item name mapping
    /** Find item name match for a merchant and item */
    findItemNameMatch: (normalizedMerchant: string, itemName: string, threshold?: number) => ItemNameMatchResult | null;

    // Category/Merchant mappings (Story 14c-refactor.22a)
    // Required for continueScanWithTransaction to apply mappings for total mismatch flow
    // Using permissive types to avoid complex type alignment issues
    /** Category mappings array */
    categoryMappings: unknown[];
    /** Find merchant match for alias lookup */
    findMerchantMatch: (merchantName: string) => {
        confidence: number;
        mapping: {
            id?: string;
            targetMerchant: string;
            normalizedMerchant: string;
            storeCategory?: string;
        };
    } | null;
    /** Apply category mappings to transaction */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyCategoryMappings: (transaction: Transaction, mappings: any) => { transaction: Transaction; appliedMappingIds: string[] };
    /** Increment category mapping usage */
    incrementMappingUsage: (db: Firestore, userId: string, appId: string, mappingId: string) => Promise<void>;
    /** Increment merchant mapping usage */
    incrementMerchantMappingUsage: (db: Firestore, userId: string, appId: string, mappingId: string) => Promise<void>;
    /** Increment item name mapping usage */
    incrementItemNameMappingUsage: (db: Firestore, userId: string, appId: string, mappingId: string) => Promise<void>;

    // ScanContext actions
    /** Show dialog via ScanContext */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    showScanDialog: (type: any, data?: any) => void;
    /** Dismiss dialog via ScanContext */
    dismissScanDialog: () => void;
    /** Dispatch process success */
    dispatchProcessSuccess: (results: Transaction[]) => void;
    /** Reset scan context */
    resetScanContext: () => void;
    /** Set scan images */
    setScanImages: (images: string[]) => void;

    // Scan overlay state
    /** Scan overlay state machine */
    scanOverlay: ScanOverlayState;

    // UI callbacks
    /** Show toast notification */
    setToastMessage: (msg: ToastMessage | null) => void;
    /** Set current transaction for editing */
    setCurrentTransaction: (tx: Transaction | null) => void;
    /** Navigate to view */
    setView: (view: View) => void;
    /** Navigate to specific view (with history) */
    navigateToView: (view: View) => void;
    /** Set insight for display */
    setCurrentInsight: (insight: Insight | null) => void;
    /** Show/hide insight card */
    setShowInsightCard: (show: boolean) => void;
    /** Show/hide batch summary */
    setShowBatchSummary: (show: boolean) => void;
    /** Set session context for completion messaging */
    setSessionContext: (ctx: SessionContextData | null) => void;
    /** Set animate edit view items flag */
    setAnimateEditViewItems: (animate: boolean) => void;
    /** Set skip scan complete modal flag */
    setSkipScanCompleteModal: (skip: boolean) => void;
    /** Set transaction editor mode */
    setTransactionEditorMode: (mode: 'new' | 'existing') => void;
    /** Set quick saving state */
    setIsQuickSaving: (saving: boolean) => void;
    /** Check if quick saving */
    isQuickSaving: boolean;

    // Trust prompt (Story 14c-refactor.22a)
    /** Set trust prompt data */
    setTrustPromptData: (data: TrustPromptEligibility | null) => void;
    /** Show/hide trust prompt */
    setShowTrustPrompt: (show: boolean) => void;

    /** Translation function */
    t: (key: string) => string;
}

/**
 * Result returned by useScanHandlers hook
 */
export interface UseScanHandlersResult {
    // Scan overlay handlers
    /** Handle cancel from scan overlay - return to dashboard */
    handleScanOverlayCancel: () => void;
    /** Handle retry from scan overlay - re-run processScan */
    handleScanOverlayRetry: () => void;
    /** Handle dismiss from scan overlay ready state */
    handleScanOverlayDismiss: () => void;

    // Quick save handlers
    /** Handle quick save completion callback */
    handleQuickSaveComplete: () => void;
    /** Handle quick save button click */
    handleQuickSave: (dialogData?: QuickSaveDialogData) => Promise<void>;
    /** Handle edit from quick save card */
    handleQuickSaveEdit: (dialogData?: QuickSaveDialogData) => void;
    /** Handle cancel from quick save card */
    handleQuickSaveCancel: (dialogData?: QuickSaveDialogData) => void;

    // Currency mismatch handlers
    /** Handle use detected currency */
    handleCurrencyUseDetected: (dialogData?: CurrencyMismatchDialogData) => Promise<void>;
    /** Handle use default currency */
    handleCurrencyUseDefault: (dialogData?: CurrencyMismatchDialogData) => Promise<void>;
    /** Handle cancel currency selection */
    handleCurrencyMismatchCancel: (dialogData?: CurrencyMismatchDialogData) => void;

    // Total mismatch handlers
    /** Handle use items sum as total */
    handleTotalUseItemsSum: (dialogData?: TotalMismatchDialogData) => void;
    /** Handle keep original total */
    handleTotalKeepOriginal: (dialogData?: TotalMismatchDialogData) => void;
    /** Handle cancel total selection */
    handleTotalMismatchCancel: (dialogData?: TotalMismatchDialogData) => void;

    // Utility functions
    /** Apply learned item name mappings to transaction */
    applyItemNameMappings: (
        transaction: Transaction,
        normalizedMerchant: string
    ) => { transaction: Transaction; appliedIds: string[] };

    /** Reconcile items total with receipt total */
    reconcileItemsTotal: (
        items: Array<{ name: string; price: number; category?: string; qty?: number; subcategory?: string }>,
        receiptTotal: number
    ) => { items: typeof items; hasDiscrepancy: boolean; discrepancyAmount: number };

    /** Continue scan flow with transaction after mismatch resolution */
    continueScanWithTransaction: (transaction: Transaction) => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook to manage scan-related event handlers.
 *
 * Extracts dialog and utility handlers from App.tsx while keeping
 * the core processScan function in place (due to deep integration).
 *
 * @param props - Dependencies for scan handlers
 * @returns Scan handlers and utilities
 */
export function useScanHandlers(
    props: UseScanHandlersProps
): UseScanHandlersResult {
    const {
        user,
        services,
        userPreferences,
        transactions,
        // Reserved for future use
        currency: _currency,
        lang,
        // Reserved for future use
        currentTransaction: _currentTransaction,
        insightProfile,
        insightCache,
        recordInsightShown,
        trackTransactionForInsight,
        incrementInsightCounter,
        batchSession,
        addToBatch,
        checkTrusted,
        recordMerchantScan,
        findItemNameMatch,
        // Mapping props (Story 14c-refactor.22a)
        categoryMappings,
        findMerchantMatch,
        applyCategoryMappings,
        incrementMappingUsage,
        incrementMerchantMappingUsage,
        incrementItemNameMappingUsage,
        showScanDialog,
        dismissScanDialog,
        dispatchProcessSuccess,
        // Reserved for future use
        resetScanContext: _resetScanContext,
        setScanImages,
        scanOverlay,
        setToastMessage,
        setCurrentTransaction,
        setView,
        navigateToView,
        setCurrentInsight,
        setShowInsightCard,
        setShowBatchSummary,
        // Reserved for future use
        setSessionContext: _setSessionContext,
        setAnimateEditViewItems,
        setSkipScanCompleteModal,
        setTransactionEditorMode,
        setIsQuickSaving,
        isQuickSaving,
        setTrustPromptData,
        setShowTrustPrompt,
        t,
    } = props;
    // Silence unused variable warnings - these are reserved for future integration
    void _currency;
    void _currentTransaction;
    void _resetScanContext;
    void _setSessionContext;

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /**
     * Apply learned item name mappings to transaction items.
     * Only applies when there's a merchant match (item mappings are scoped per-store).
     */
    const applyItemNameMappings = useCallback((
        transaction: Transaction,
        normalizedMerchant: string
    ): { transaction: Transaction; appliedIds: string[] } => {
        const appliedIds: string[] = [];

        const updatedItems = transaction.items.map((item: TransactionItem): TransactionItem => {
            const match = findItemNameMatch(normalizedMerchant, item.name);

            if (match && match.confidence > 0.7) {
                if (match.mapping.id) {
                    appliedIds.push(match.mapping.id);
                }

                return {
                    ...item,
                    name: match.mapping.targetItemName,
                    ...(match.mapping.targetCategory && { category: match.mapping.targetCategory }),
                    categorySource: match.mapping.targetCategory ? 'learned' as const : item.categorySource,
                };
            }

            return item;
        });

        return {
            transaction: {
                ...transaction,
                items: updatedItems,
            },
            appliedIds,
        };
    }, [findItemNameMatch]);

    /**
     * Reconcile transaction total with sum of items.
     * If there's a discrepancy, adds a surplus or discount item to balance.
     */
    const reconcileItemsTotal = useCallback((
        items: Array<{ name: string; price: number; category?: string; qty?: number; subcategory?: string }>,
        receiptTotal: number
    ): { items: typeof items; hasDiscrepancy: boolean; discrepancyAmount: number } => {
        const itemsSum = items.reduce((sum, item) => sum + item.price, 0);

        const roundedItemsSum = Math.round(itemsSum * 100) / 100;
        const roundedReceiptTotal = Math.round(receiptTotal * 100) / 100;
        const difference = Math.round((roundedReceiptTotal - roundedItemsSum) * 100) / 100;

        if (Math.abs(difference) < 1) {
            return { items, hasDiscrepancy: false, discrepancyAmount: 0 };
        }

        const translations = TRANSLATIONS[lang];
        const adjustmentItem = {
            name: difference > 0 ? translations.surplusItem : translations.discountItem,
            price: difference,
            category: 'Other' as const,
            qty: 1,
        };

        return {
            items: [...items, adjustmentItem],
            hasDiscrepancy: true,
            discrepancyAmount: difference,
        };
    }, [lang]);

    // =========================================================================
    // Scan Overlay Handlers
    // =========================================================================

    /**
     * Handle cancel from scan overlay.
     * Returns to dashboard and resets scan state.
     */
    const handleScanOverlayCancel = useCallback(() => {
        scanOverlay.reset();
        setScanImages([]);
        setCurrentTransaction(null);
        setView('dashboard');
    }, [scanOverlay, setScanImages, setCurrentTransaction, setView]);

    /**
     * Handle retry from scan overlay error state.
     * Re-runs processScan with existing images.
     */
    const handleScanOverlayRetry = useCallback(() => {
        scanOverlay.retry();
        // processScan will be called again from EditView
    }, [scanOverlay]);

    /**
     * Handle dismiss from scan overlay ready state.
     */
    const handleScanOverlayDismiss = useCallback(() => {
        scanOverlay.reset();
    }, [scanOverlay]);

    // =========================================================================
    // Quick Save Handlers
    // =========================================================================

    /**
     * Handle quick save completion (called after success animation).
     */
    const handleQuickSaveComplete = useCallback(() => {
        setScanImages([]);
        setView('dashboard');
    }, [setScanImages, setView]);

    /**
     * Handle quick save button click.
     * Validates transaction, saves to Firestore, generates insight.
     */
    const handleQuickSave = useCallback(async (dialogData?: QuickSaveDialogData) => {
        const transaction = dialogData?.transaction;
        if (!services || !user || !transaction || isQuickSaving) return;

        // Validate transaction has at least one item
        const hasValidItem = transaction.items?.some(
            item => item.name && item.name.trim().length > 0 && typeof item.price === 'number' && item.price >= 0
        );
        if (!hasValidItem) {
            setCurrentTransaction(transaction);
            setToastMessage({ text: t('itemsRequired') || 'Add at least one item', type: 'info' });
            navigateToView('transaction-editor');
            return;
        }

        const { db, appId } = services;
        setIsQuickSaving(true);

        const tDoc = {
            ...transaction,
            total: parseStrictNumber(transaction.total),
        };

        try {
            incrementInsightCounter();

            const profile = insightProfile || {
                schemaVersion: 1 as const,
                firstTransactionDate: null as any,
                totalTransactions: 0,
                recentInsights: [],
            };

            const cacheOrDefault = insightCache || getDefaultCache();
            const silenced = isInsightsSilenced(cacheOrDefault);

            const transactionId = await firestoreAddTransaction(db, user.uid, appId, tDoc);
            const txWithId = { ...tDoc, id: transactionId } as Transaction;

            const insight = await generateInsightForTransaction(
                txWithId,
                transactions,
                profile,
                cacheOrDefault
            );

            addToBatch(txWithId, insight);

            // Show insight card (unless silenced or in batch mode)
            if (!silenced) {
                const willBeBatchMode = (batchSession?.receipts.length ?? 0) + 1 >= 3;
                if (willBeBatchMode) {
                    setShowBatchSummary(true);
                } else {
                    setCurrentInsight(insight);
                    setShowInsightCard(true);
                }
            }

            // Record insight shown (if applicable)
            if (insight && insight.id !== 'building_profile') {
                recordInsightShown(insight.id, transactionId, {
                    title: insight.title,
                    message: insight.message,
                    icon: insight.icon || '',
                    category: insight.category as string,
                }).catch(err => console.warn('Failed to record insight:', err));
            }

            // Track transaction for profile stats
            const txDate = tDoc.date ? new Date(tDoc.date) : new Date();
            trackTransactionForInsight(txDate)
                .catch(err => console.warn('Failed to track transaction:', err));

            // Record scan for trust tracking
            // Story 14c-refactor.22a: Integrated trust prompt handling
            const merchantAlias = tDoc.alias || tDoc.merchant;
            if (merchantAlias) {
                try {
                    const eligibility = await recordMerchantScan(merchantAlias, false);
                    // AC #3: Show trust prompt if eligible
                    if (eligibility.shouldShowPrompt) {
                        setTrustPromptData(eligibility);
                        setShowTrustPrompt(true);
                    }
                } catch (err) {
                    console.warn('Failed to record merchant scan:', err);
                }
            }

        } catch (error) {
            console.error('Quick save failed:', error);
            setToastMessage({ text: t('scanFailed'), type: 'info' });
            dismissScanDialog();
        } finally {
            setIsQuickSaving(false);
        }
    }, [
        services,
        user,
        isQuickSaving,
        transactions,
        insightProfile,
        insightCache,
        batchSession,
        incrementInsightCounter,
        addToBatch,
        recordInsightShown,
        trackTransactionForInsight,
        recordMerchantScan,
        setIsQuickSaving,
        setCurrentTransaction,
        setToastMessage,
        navigateToView,
        setCurrentInsight,
        setShowInsightCard,
        setShowBatchSummary,
        dismissScanDialog,
        setTrustPromptData,
        setShowTrustPrompt,
        t,
    ]);

    /**
     * Handle edit from quick save card.
     * Navigates to transaction editor view.
     */
    const handleQuickSaveEdit = useCallback((dialogData?: QuickSaveDialogData) => {
        const transaction = dialogData?.transaction;
        if (transaction) {
            setCurrentTransaction(transaction);
        }
        setTransactionEditorMode('new');
        setSkipScanCompleteModal(true);
        setView('transaction-editor');
    }, [setCurrentTransaction, setTransactionEditorMode, setSkipScanCompleteModal, setView]);

    /**
     * Handle cancel from quick save card.
     * Returns to dashboard.
     */
    const handleQuickSaveCancel = useCallback((_dialogData?: QuickSaveDialogData) => {
        setCurrentTransaction(null);
        setScanImages([]);
        setView('dashboard');
    }, [setCurrentTransaction, setScanImages, setView]);

    // =========================================================================
    // Currency Mismatch Handlers
    // =========================================================================

    /**
     * Helper to continue scan flow after currency/total resolution.
     * Story 14c-refactor.22a: Now applies category/merchant/item mappings
     * and checks for currency mismatch (matches inline App.tsx behavior).
     */
    const continueScanWithTransaction = useCallback(async (transaction: Transaction) => {
        // Story 6.4: Apply learned category mappings (AC#1-4)
        const { transaction: categorizedTransaction, appliedMappingIds } =
            applyCategoryMappings(transaction, categoryMappings);

        // Story 6.4 AC#5: Increment usage count for applied mappings (fire-and-forget)
        if (appliedMappingIds.length > 0 && user && services) {
            appliedMappingIds.forEach(mappingId => {
                incrementMappingUsage(services.db, user.uid, services.appId, mappingId)
                    .catch(err => console.error('Failed to increment mapping usage:', err));
            });
        }

        // Story 9.5: Apply learned merchant→alias mapping
        let finalTransaction = categorizedTransaction;
        const merchantMatch = findMerchantMatch(categorizedTransaction.merchant);
        if (merchantMatch && merchantMatch.confidence > 0.7) {
            finalTransaction = {
                ...finalTransaction,
                alias: merchantMatch.mapping.targetMerchant,
                ...(merchantMatch.mapping.storeCategory && { category: merchantMatch.mapping.storeCategory as Transaction['category'] }),
                merchantSource: 'learned' as const,
            };
            if (merchantMatch.mapping.id && user && services) {
                incrementMerchantMappingUsage(services.db, user.uid, services.appId, merchantMatch.mapping.id)
                    .catch(err => console.error('Failed to increment merchant mapping usage:', err));
            }

            // v9.7.0: Apply learned item name mappings (scoped to this merchant)
            const { transaction: txWithItemNames, appliedIds: itemNameMappingIds } = applyItemNameMappings(
                finalTransaction,
                merchantMatch.mapping.normalizedMerchant
            );
            finalTransaction = txWithItemNames;

            // Increment item name mapping usage counts (fire-and-forget)
            if (itemNameMappingIds.length > 0 && user && services) {
                itemNameMappingIds.forEach(id => {
                    incrementItemNameMappingUsage(services.db, user.uid, services.appId, id)
                        .catch(err => console.error('Failed to increment item name mapping usage:', err));
                });
            }
        }

        // Currency handling: if no currency, use default
        if (!finalTransaction.currency && userPreferences.defaultCurrency) {
            finalTransaction = {
                ...finalTransaction,
                currency: userPreferences.defaultCurrency,
            };
        }

        // Check for currency mismatch
        const detectedCurrency = finalTransaction.currency;
        const userDefaultCurrency = userPreferences.defaultCurrency;
        if (detectedCurrency && userDefaultCurrency && detectedCurrency !== userDefaultCurrency) {
            const dialogData: CurrencyMismatchDialogData = {
                detectedCurrency,
                pendingTransaction: finalTransaction,
                hasDiscrepancy: false,
            };
            showScanDialog(DIALOG_TYPES.CURRENCY_MISMATCH, dialogData);
            return;
        }

        // Set as current transaction and continue
        setCurrentTransaction(finalTransaction);

        // Check trusted merchant and determine flow
        const merchantAlias = finalTransaction.alias || finalTransaction.merchant;
        const isTrusted = merchantAlias ? await checkTrusted(merchantAlias) : false;
        const willShowQuickSave = !isTrusted && shouldShowQuickSave(finalTransaction);

        setSkipScanCompleteModal(true);
        dispatchProcessSuccess([finalTransaction]);

        if (isTrusted && services && user) {
            // Auto-save for trusted merchants
            try {
                await firestoreAddTransaction(services.db, user.uid, services.appId, finalTransaction);
                setCurrentTransaction(null);
                setToastMessage({ text: t('autoSaved'), type: 'success' });
                setView('dashboard');
            } catch (err) {
                console.error('Auto-save failed:', err);
                if (shouldShowQuickSave(finalTransaction)) {
                    const qsDialogData: QuickSaveDialogData = {
                        transaction: finalTransaction,
                        confidence: calculateConfidence(finalTransaction),
                    };
                    showScanDialog(DIALOG_TYPES.QUICKSAVE, qsDialogData);
                }
            }
        } else if (willShowQuickSave) {
            const qsDialogData: QuickSaveDialogData = {
                transaction: finalTransaction,
                confidence: calculateConfidence(finalTransaction),
            };
            showScanDialog(DIALOG_TYPES.QUICKSAVE, qsDialogData);
        } else {
            // Low confidence: Stay on editor for manual review
            setAnimateEditViewItems(true);
        }
    }, [
        services,
        user,
        userPreferences.defaultCurrency,
        categoryMappings,
        applyCategoryMappings,
        findMerchantMatch,
        applyItemNameMappings,
        incrementMappingUsage,
        incrementMerchantMappingUsage,
        incrementItemNameMappingUsage,
        checkTrusted,
        dispatchProcessSuccess,
        showScanDialog,
        setCurrentTransaction,
        setToastMessage,
        setView,
        setSkipScanCompleteModal,
        setAnimateEditViewItems,
        t,
    ]);

    /**
     * Helper to proceed with scan flow after currency has been resolved.
     * Used by currency mismatch handlers. Skips mapping application (already done)
     * and currency check (already resolved).
     */
    const proceedAfterCurrencyResolved = useCallback(async (transaction: Transaction) => {
        const merchantAlias = transaction.alias || transaction.merchant;
        const isTrusted = merchantAlias ? await checkTrusted(merchantAlias) : false;
        const willShowQuickSave = !isTrusted && shouldShowQuickSave(transaction);

        setSkipScanCompleteModal(true);
        dispatchProcessSuccess([transaction]);
        setCurrentTransaction(transaction);

        if (isTrusted && services && user) {
            // Auto-save for trusted merchants
            try {
                await firestoreAddTransaction(services.db, user.uid, services.appId, transaction);
                setCurrentTransaction(null);
                setToastMessage({ text: t('autoSaved'), type: 'success' });
                setView('dashboard');
            } catch (err) {
                console.error('Auto-save failed:', err);
                if (shouldShowQuickSave(transaction)) {
                    const qsDialogData: QuickSaveDialogData = {
                        transaction: transaction,
                        confidence: calculateConfidence(transaction),
                    };
                    showScanDialog(DIALOG_TYPES.QUICKSAVE, qsDialogData);
                }
            }
        } else if (willShowQuickSave) {
            const qsDialogData: QuickSaveDialogData = {
                transaction: transaction,
                confidence: calculateConfidence(transaction),
            };
            showScanDialog(DIALOG_TYPES.QUICKSAVE, qsDialogData);
        } else {
            // Low confidence: Stay on editor for manual review
            setAnimateEditViewItems(true);
        }
    }, [
        services,
        user,
        checkTrusted,
        dispatchProcessSuccess,
        showScanDialog,
        setCurrentTransaction,
        setToastMessage,
        setView,
        setSkipScanCompleteModal,
        setAnimateEditViewItems,
        t,
    ]);

    /**
     * Handle use detected currency from mismatch dialog.
     */
    const handleCurrencyUseDetected = useCallback(async (dialogData?: CurrencyMismatchDialogData) => {
        if (!dialogData) return;
        const transaction = dialogData.pendingTransaction as Transaction;
        const hasDiscrepancy = dialogData.hasDiscrepancy;

        dismissScanDialog();

        if (hasDiscrepancy) {
            setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
        }

        // Use proceedAfterCurrencyResolved instead of continueScanWithTransaction
        // because mappings are already applied before currency dialog is shown
        await proceedAfterCurrencyResolved(transaction);
    }, [dismissScanDialog, proceedAfterCurrencyResolved, setToastMessage, t]);

    /**
     * Handle use default currency from mismatch dialog.
     */
    const handleCurrencyUseDefault = useCallback(async (dialogData?: CurrencyMismatchDialogData) => {
        if (!dialogData) return;
        const transaction = {
            ...dialogData.pendingTransaction,
            currency: userPreferences.defaultCurrency,
        };
        const hasDiscrepancy = dialogData.hasDiscrepancy;

        dismissScanDialog();

        if (hasDiscrepancy) {
            setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
        }

        // Use proceedAfterCurrencyResolved instead of continueScanWithTransaction
        // because mappings are already applied before currency dialog is shown
        await proceedAfterCurrencyResolved(transaction as Transaction);
    }, [userPreferences.defaultCurrency, dismissScanDialog, proceedAfterCurrencyResolved, setToastMessage, t]);

    /**
     * Handle cancel from currency mismatch dialog.
     */
    const handleCurrencyMismatchCancel = useCallback((_dialogData?: CurrencyMismatchDialogData) => {
        dismissScanDialog();
        setCurrentTransaction(null);
        setScanImages([]);
        setView('dashboard');
    }, [dismissScanDialog, setCurrentTransaction, setScanImages, setView]);

    // =========================================================================
    // Total Mismatch Handlers
    // =========================================================================

    /**
     * Handle use items sum as total from mismatch dialog.
     */
    const handleTotalUseItemsSum = useCallback((dialogData?: TotalMismatchDialogData) => {
        if (!dialogData) return;
        const { validationResult, pendingTransaction, parsedItems } = dialogData;

        const correctedTransaction: Transaction = {
            ...pendingTransaction as Transaction,
            total: validationResult.itemsSum,
            items: parsedItems as Transaction['items'],
        };

        dismissScanDialog();
        continueScanWithTransaction(correctedTransaction);
        setToastMessage({ text: t('totalCorrected') || 'Total corregido', type: 'success' });
    }, [dismissScanDialog, continueScanWithTransaction, setToastMessage, t]);

    /**
     * Handle keep original total from mismatch dialog.
     */
    const handleTotalKeepOriginal = useCallback((dialogData?: TotalMismatchDialogData) => {
        if (!dialogData) return;
        const { pendingTransaction, parsedItems } = dialogData;

        const { items: reconciledItems } = reconcileItemsTotal(
            parsedItems as Transaction['items'],
            (pendingTransaction as Transaction).total
        );

        const transaction: Transaction = {
            ...pendingTransaction as Transaction,
            items: reconciledItems,
        };

        dismissScanDialog();
        continueScanWithTransaction(transaction);
    }, [reconcileItemsTotal, dismissScanDialog, continueScanWithTransaction]);

    /**
     * Handle cancel from total mismatch dialog.
     */
    const handleTotalMismatchCancel = useCallback((_dialogData?: TotalMismatchDialogData) => {
        dismissScanDialog();
        setCurrentTransaction(null);
        setScanImages([]);
        setView('dashboard');
    }, [dismissScanDialog, setCurrentTransaction, setScanImages, setView]);

    // =========================================================================
    // Return
    // =========================================================================

    return useMemo<UseScanHandlersResult>(
        () => ({
            // Scan overlay handlers
            handleScanOverlayCancel,
            handleScanOverlayRetry,
            handleScanOverlayDismiss,

            // Quick save handlers
            handleQuickSaveComplete,
            handleQuickSave,
            handleQuickSaveEdit,
            handleQuickSaveCancel,

            // Currency mismatch handlers
            handleCurrencyUseDetected,
            handleCurrencyUseDefault,
            handleCurrencyMismatchCancel,

            // Total mismatch handlers
            handleTotalUseItemsSum,
            handleTotalKeepOriginal,
            handleTotalMismatchCancel,

            // Utilities
            applyItemNameMappings,
            reconcileItemsTotal,
            continueScanWithTransaction,
        }),
        [
            handleScanOverlayCancel,
            handleScanOverlayRetry,
            handleScanOverlayDismiss,
            handleQuickSaveComplete,
            handleQuickSave,
            handleQuickSaveEdit,
            handleQuickSaveCancel,
            handleCurrencyUseDetected,
            handleCurrencyUseDefault,
            handleCurrencyMismatchCancel,
            handleTotalUseItemsSum,
            handleTotalKeepOriginal,
            handleTotalMismatchCancel,
            applyItemNameMappings,
            reconcileItemsTotal,
            continueScanWithTransaction,
        ]
    );
}

export default useScanHandlers;
