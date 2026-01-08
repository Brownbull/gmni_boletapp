import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Story 14.15 Session 10: Icons for credit info modal
import { Camera, Zap, X, ShoppingCart } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
// Story 14.27: Paginated transactions for HistoryView infinite scroll
import { usePaginatedTransactions } from './hooks/usePaginatedTransactions';
import { useCategoryMappings } from './hooks/useCategoryMappings';
import { useMerchantMappings } from './hooks/useMerchantMappings';
import { useSubcategoryMappings } from './hooks/useSubcategoryMappings';
// Story 11.4: Trusted merchants for auto-save
import { useTrustedMerchants } from './hooks/useTrustedMerchants';
import { useUserPreferences } from './hooks/useUserPreferences';
// Persistent scan credits
import { useUserCredits } from './hooks/useUserCredits';
// Story 14.15 AC #5: Reduced motion check for haptic feedback
import { useReducedMotion } from './hooks/useReducedMotion';
// Story 10.6: Insight profile hook for insight generation
import { useInsightProfile } from './hooks/useInsightProfile';
// Story 10.7: Batch session tracking for multi-receipt scanning
import { useBatchSession } from './hooks/useBatchSession';
// Story 12.2: Parallel batch processing hook
import { useBatchProcessing } from './hooks/useBatchProcessing';
// Story 12.3: Batch review type for edit flow
import type { BatchReceipt } from './hooks/useBatchReview';
import { LoginScreen } from './views/LoginScreen';
import { DashboardView } from './views/DashboardView';
// Story 9.9: ScanView is deprecated - scan functionality is now in EditView
// import { ScanView } from './views/ScanView';
// Story 14.23: DEPRECATED - EditView replaced by TransactionEditorView
// Keeping import commented for potential rollback
// import { EditView } from './views/EditView';
import { TrendsView } from './views/TrendsView';
// Story 10a.4: Insights History View (replaces HistoryView in insights tab)
import { InsightsView } from './views/InsightsView';
// Story 14.14: Transaction List View (accessible via profile menu)
import { HistoryView } from './views/HistoryView';
// Story 12.1: Batch Capture UI - dedicated view for batch mode scanning
import { BatchCaptureView } from './views/BatchCaptureView';
// Story 12.3: Batch Review Queue - review processed receipts before saving
import { BatchReviewView } from './views/BatchReviewView';
import { SettingsView } from './views/SettingsView';
// Story 14.16: Weekly Report Story Format - Instagram-style swipeable report cards
import { ReportsView } from './views/ReportsView';
// Story 14.15: New scan result view matching scan-overlay.html mockup
// Story 14.23: DEPRECATED - ScanResultView replaced by TransactionEditorView
// Keeping import commented for potential rollback
// import { ScanResultView } from './views/ScanResultView';
// Story 14.23: Unified transaction editor (replaces ScanResultView + EditView)
// Story 14.24: Also handles read-only mode via readOnly prop
import { TransactionEditorView, type ScanButtonState } from './views/TransactionEditorView';
import { Nav, ScanStatus } from './components/Nav';
// Story 14.10: Top Header Bar component
import { TopHeader } from './components/TopHeader';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
// Story 10.6: Insight card components
import { InsightCard } from './components/insights/InsightCard';
import { BuildingProfileCard } from './components/insights/BuildingProfileCard';
// Story 10.7: Batch summary component
import { BatchSummary } from './components/insights/BatchSummary';
// Story 11.1: Batch upload components for multi-image processing
// Story 11.2: Quick Save Card for high-confidence scans
// Story 14.15: ScanOverlay for non-blocking scan flow, BatchCompleteModal for batch success
// Story 14.15b: CurrencyMismatchDialog for currency auto-detection
// TotalMismatchDialog for detecting OCR total errors (missing digits)
import { BatchUploadPreview, BatchProcessingProgress, MAX_BATCH_IMAGES, QuickSaveCard, ScanOverlay, BatchCompleteModal, CurrencyMismatchDialog, TotalMismatchDialog } from './components/scan';
import type { BatchItemResult } from './components/scan';
// Story 14.15: Scan overlay state machine hook
import { useScanOverlayState } from './hooks/useScanOverlayState';
// Story 14.15 AC #4: Timeout constant for network timeout handling
import { PROCESSING_TIMEOUT_MS } from './hooks/useScanState';
// Story 11.2: Confidence check for Quick Save eligibility
import { shouldShowQuickSave, calculateConfidence } from './utils/confidenceCheck';
// Total validation for detecting OCR errors (missing digits)
import { validateTotal, TotalValidationResult } from './utils/totalValidation';
// Story 11.4: Trust Merchant Prompt component
import { TrustMerchantPrompt } from './components/TrustMerchantPrompt';
// Story 12.4: Credit Warning System
import { CreditWarningDialog } from './components/batch';
import { checkCreditSufficiency, type CreditCheckResult } from './services/creditService';
// Story 14.24: Transaction conflict dialog for single active transaction paradigm
import { TransactionConflictDialog, type ConflictingTransaction, type ConflictReason } from './components/dialogs/TransactionConflictDialog';
import type { TrustPromptEligibility } from './types/trust';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
// Story 10a.2: Import for building analytics initial state
import { getQuarterFromMonth } from './utils/analyticsHelpers';
import type { AnalyticsNavigationState } from './types/analytics';
import { HistoryFiltersProvider, type HistoryFilterState, type TemporalFilterState } from './contexts/HistoryFiltersContext';
import type { HistoryNavigationPayload } from './views/TrendsView';
// Story 14.22: Import group expansion functions for navigation filters
import { expandStoreCategoryGroup, expandItemCategoryGroup, type StoreCategoryGroup, type ItemCategoryGroup } from './config/categoryColors';
import { analyzeReceipt, ReceiptType } from './services/gemini';
import { SupportedCurrency } from './services/userPreferencesService';
import {
    addTransaction as firestoreAddTransaction,
    updateTransaction as firestoreUpdateTransaction,
    deleteTransaction as firestoreDeleteTransaction,
    wipeAllTransactions
} from './services/firestore';
// Story 10.6: Insight generation service
// Story 10.7: Added silence and historical comparison functions
import {
    generateInsightForTransaction,
    silenceInsights,
    clearSilence,
    isInsightsSilenced,
    getLastWeekTotal,
    setLocalCache,
} from './services/insightEngineService';
import { Transaction, StoreCategory } from './types/transaction';
// Story 10.6: Insight types
import { Insight } from './types/insight';
import { Language, Currency, Theme, ColorTheme, FontColorMode } from './types/settings';
// Story 9.10: Persistent scan state management
import { PendingScan, createPendingScan } from './types/scan';
// Story 14.24: Persistent pending scan storage (survives refresh/logout)
import { savePendingScan, loadPendingScan, clearPendingScan } from './services/pendingScanStorage';
import { formatCurrency } from './utils/currency';
import { formatDate } from './utils/date';
import { getSafeDate, parseStrictNumber } from './utils/validation';
import { downloadBasicData } from './utils/csvExport';
import { TRANSLATIONS } from './utils/translations';
// Story 10a.4: ITEMS_PER_PAGE removed - no longer used after HistoryView replaced
import { STORE_CATEGORIES } from './config/constants';
import { applyCategoryMappings } from './utils/categoryMatcher';
import { incrementMappingUsage } from './services/categoryMappingService';
import { incrementMerchantMappingUsage } from './services/merchantMappingService';
import { getCitiesForCountry } from './data/locations';

// Story 10a.3: Changed 'list' to 'insights' (InsightsView will be added in 10a.4)
// Story 12.1: Added 'batch-capture' view for batch mode scanning
// Story 12.3: Added 'batch-review' view for reviewing processed receipts before saving
// Story 14.11: Added 'alerts' view for nav bar redesign (settings still accessible via header menu)
// Story 14.14: Added 'history' view for transaction list (accessible via profile menu)
// Story 14.16: Added 'reports' view for weekly report cards (accessible via profile menu)
// Story 14.15: Added 'scan-result' view for new scan flow UI (mockup-compliant layout)
// Story 14.23: Added 'transaction-editor' view for unified transaction editor (replaces scan-result + edit)
// Story 14.24: Read-only viewing uses transaction-editor with readOnly prop (no separate view type needed)
type View = 'dashboard' | 'scan' | 'scan-result' | 'edit' | 'transaction-editor' | 'trends' | 'insights' | 'settings' | 'alerts' | 'batch-capture' | 'batch-review' | 'history' | 'reports';

/**
 * Story 14.15b: Reconcile transaction total with sum of items
 * If there's a discrepancy, adds a surplus or discount item to balance
 * @param items - Array of transaction items
 * @param receiptTotal - Total from the receipt
 * @param language - Language for item names
 * @returns Object with reconciled items and whether a discrepancy was found
 */
function reconcileItemsTotal(
    items: Array<{ name: string; price: number; category?: string; qty?: number; subcategory?: string }>,
    receiptTotal: number,
    language: 'en' | 'es'
): { items: typeof items; hasDiscrepancy: boolean; discrepancyAmount: number } {
    // Story 14.24: price is total for line item, qty is informational only
    const itemsSum = items.reduce((sum, item) => sum + item.price, 0);

    // Round to 2 decimal places for comparison (avoid floating point issues)
    const roundedItemsSum = Math.round(itemsSum * 100) / 100;
    const roundedReceiptTotal = Math.round(receiptTotal * 100) / 100;
    const difference = Math.round((roundedReceiptTotal - roundedItemsSum) * 100) / 100;

    // If difference is negligible (less than 1 unit of currency), no adjustment needed
    if (Math.abs(difference) < 1) {
        return { items, hasDiscrepancy: false, discrepancyAmount: 0 };
    }

    // Create adjustment item
    const translations = TRANSLATIONS[language];
    const adjustmentItem = {
        name: difference > 0 ? translations.surplusItem : translations.discountItem,
        price: difference, // Positive for surplus, negative for discount
        category: 'Other' as const,
        qty: 1,
    };

    return {
        items: [...items, adjustmentItem],
        hasDiscrepancy: true,
        discrepancyAmount: difference,
    };
}

function App() {
    const { user, services, initError, signIn, signInWithTestCredentials, signOut } = useAuth();
    const transactions = useTransactions(user, services);
    // Story 14.27: Paginated transactions for HistoryView (includes loadMore for older transactions)
    const {
        transactions: paginatedTransactions,
        hasMore: hasMoreTransactions,
        loadMore: loadMoreTransactions,
        loadingMore: loadingMoreTransactions,
        isAtListenerLimit,
    } = usePaginatedTransactions(user, services);
    // Story 9.7 enhancement: Also expose updateMapping for edit functionality
    const { mappings, loading: mappingsLoading, saveMapping, deleteMapping, updateMapping: updateCategoryMapping } = useCategoryMappings(user, services);
    // Story 9.5: Merchant mappings for fuzzy matching
    // Story 9.6: Also expose saveMapping for learning prompt
    // Story 9.7: Expose mappings, deleteMapping, updateMapping for Settings management UI
    const {
        mappings: merchantMappings,
        loading: merchantMappingsLoading,
        findMatch: findMerchantMatch,
        saveMapping: saveMerchantMapping,
        deleteMapping: deleteMerchantMapping,
        updateMapping: updateMerchantMapping
    } = useMerchantMappings(user, services);
    // Story 9.15: Subcategory mappings for learning and management
    const {
        mappings: subcategoryMappings,
        loading: subcategoryMappingsLoading,
        saveMapping: saveSubcategoryMapping,
        deleteMapping: deleteSubcategoryMapping,
        updateMappingTarget: updateSubcategoryMapping
    } = useSubcategoryMappings(user, services);
    // Story 9.8: User preferences for default scan currency
    // Story 14.22: Extended to include location settings from Firestore
    const {
        preferences: userPreferences,
        setDefaultCurrency: setDefaultScanCurrencyPref,
        setDefaultCountry: setDefaultCountryPref,
        setDefaultCity: setDefaultCityPref,
        // Story 14.22: These will be used in Profile sub-view (Task 6)
        setDisplayName: _setDisplayNamePref,
        setPhoneNumber: _setPhoneNumberPref,
        setBirthDate: _setBirthDatePref,
        // Story 14.22: Font family preference (persisted to Firestore)
        setFontFamily: setFontFamilyPref,
    } = useUserPreferences(user, services);
    // Persistent scan credits from Firestore
    // Story 14.24: Added reserve/confirm/refund pattern for credit management
    const {
        credits: userCredits,
        deductCredits: deductUserCredits,
        hasReservedCredits: _hasReservedCredits, // TODO: Use for Task 2.4 credit display
        reserveCredits,
        confirmReservedCredits,
        refundReservedCredits,
    } = useUserCredits(user, services);
    // Story 10.6: Insight profile for insight generation
    const {
        profile: insightProfile,
        cache: insightCache,
        recordShown: recordInsightShown,
        trackTransaction: trackTransactionForInsight,
        incrementCounter: incrementInsightCounter,
    } = useInsightProfile(user, services);
    // Story 10.7: Batch session tracking for multi-receipt scanning
    const {
        session: batchSession,
        addToBatch,
        clearBatch,
        // isBatchMode is exposed by hook but we calculate it inline in JSX
    } = useBatchSession();
    // Story 11.4: Trusted merchants for auto-save (AC #1-8)
    const {
        recordMerchantScan,
        checkTrusted,
        acceptTrust,
        declinePrompt,
        removeTrust,
        trustedMerchants,
        loading: trustedMerchantsLoading,
    } = useTrustedMerchants(user, services);

    // UI State
    const [view, setView] = useState<View>('dashboard');
    // Story 14.15b: Track previous view for proper back navigation
    const [previousView, setPreviousView] = useState<View>('dashboard');
    // Story 14.22: Settings subview state for breadcrumb navigation
    const [settingsSubview, setSettingsSubview] = useState<'main' | 'limites' | 'perfil' | 'preferencias' | 'escaneo' | 'suscripcion' | 'datos' | 'app' | 'cuenta'>('main');
    const [scanImages, setScanImages] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    // Story 14.15b: Re-scan loading state
    const [isRescanning, setIsRescanning] = useState(false);
    // Story 9.8: Scan options state
    const [scanStoreType, setScanStoreType] = useState<ReceiptType>('auto');
    const [scanCurrency, setScanCurrency] = useState<SupportedCurrency>('CLP');
    const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
    // Story 14.24: Read-only mode for viewing transactions from History
    // When true, TransactionEditorView shows Edit button instead of Save
    const [isViewingReadOnly, setIsViewingReadOnly] = useState(false);
    // Story 14.24: Track if a credit was actually used in current editing session
    // This is true only when processScan or handleRescan is called (not just opening an existing transaction)
    const [creditUsedInSession, setCreditUsedInSession] = useState(false);
    // Story 14.23: editingItemIndex was used by EditView, kept for potential rollback
    const [_editingItemIndex, _setEditingItemIndex] = useState<number | null>(null);
    // Story 9.10: Persistent scan state - maintains scan across navigation
    const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
    // Note: userCredits now managed by useUserCredits hook (line ~157)
    // Story 10.6: Insight card state (AC #1, #4)
    const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
    const [showInsightCard, setShowInsightCard] = useState(false);
    // Story 10.7: Batch summary state (AC #1, #2)
    const [showBatchSummary, setShowBatchSummary] = useState(false);
    // Story 11.1: Batch upload state for multi-image processing (AC #1-9)
    const [batchImages, setBatchImages] = useState<string[]>([]);
    const [showBatchPreview, setShowBatchPreview] = useState(false);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
    const [batchResults, setBatchResults] = useState<BatchItemResult[]>([]);
    // Story 11.1: Cancel batch processing state (state for future UI use, ref for loop)
    const [_batchCancelRequested, setBatchCancelRequested] = useState(false);
    const [showBatchCancelConfirm, setShowBatchCancelConfirm] = useState(false);
    const batchCancelRef = useRef(false); // Ref for immediate access in loop
    // Story 11.2: Quick Save Card state (AC #1, #5, #6)
    const [showQuickSaveCard, setShowQuickSaveCard] = useState(false);
    const [quickSaveTransaction, setQuickSaveTransaction] = useState<Transaction | null>(null);
    const [quickSaveConfidence, setQuickSaveConfidence] = useState(0);
    const [isQuickSaving, setIsQuickSaving] = useState(false);
    // Story 11.3: Track when EditView should animate items (fresh scan result)
    const [animateEditViewItems, setAnimateEditViewItems] = useState(false);
    // Story 14.23: Scan button state for TransactionEditorView
    const [scanButtonState, setScanButtonState] = useState<ScanButtonState>('idle');
    // Story 14.23: Transaction editor mode ('new' for new transactions, 'existing' for editing)
    const [transactionEditorMode, setTransactionEditorMode] = useState<'new' | 'existing'>('new');
    // Story 11.4: Trust Merchant Prompt state (AC #2, #3, #4)
    const [showTrustPrompt, setShowTrustPrompt] = useState(false);
    const [trustPromptData, setTrustPromptData] = useState<TrustPromptEligibility | null>(null);
    // Story 12.4: Credit Warning Dialog state (AC #1, #5, #7)
    const [showCreditWarning, setShowCreditWarning] = useState(false);
    const [creditCheckResult, setCreditCheckResult] = useState<CreditCheckResult | null>(null);
    // Story 14.15 Session 10: Credit Info Modal state (tappable from Nav credit badges)
    const [showCreditInfoModal, setShowCreditInfoModal] = useState(false);
    // Story 12.1: Batch Capture Mode state (AC #1)
    const [isBatchCaptureMode, setIsBatchCaptureMode] = useState(false);
    // Story 12.2 & 12.3: Batch processing and review state
    const batchProcessing = useBatchProcessing(3); // Max 3 concurrent API calls
    const [batchReviewResults, setBatchReviewResults] = useState<typeof batchProcessing.results>([]);
    const [batchEditingReceipt, setBatchEditingReceipt] = useState<{ receipt: BatchReceipt; index: number; total: number } | null>(null);
    // Story 14.15: Batch complete modal state
    const [showBatchCompleteModal, setShowBatchCompleteModal] = useState(false);
    const [batchCompletedTransactions, setBatchCompletedTransactions] = useState<Transaction[]>([]);
    const [batchCreditsUsed, setBatchCreditsUsed] = useState(0);
    // Story 14.15b: Currency mismatch dialog state (AC #2)
    const [showCurrencyMismatch, setShowCurrencyMismatch] = useState(false);
    const [currencyMismatchData, setCurrencyMismatchData] = useState<{
        detectedCurrency: string;
        pendingTransaction: Transaction;
        hasDiscrepancy?: boolean; // Story 14.15b: Track if items total didn't match receipt
    } | null>(null);
    // Total mismatch dialog state (for detecting OCR errors like missing digits)
    const [showTotalMismatch, setShowTotalMismatch] = useState(false);
    const [totalMismatchData, setTotalMismatchData] = useState<{
        validationResult: TotalValidationResult;
        pendingTransaction: Transaction;
        parsedItems: Array<{ name: string; price: number; category?: string; qty?: number; subcategory?: string }>;
    } | null>(null);
    // Story 14.24: Conflict dialog for single active transaction paradigm
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [conflictDialogData, setConflictDialogData] = useState<{
        conflictingTransaction: ConflictingTransaction;
        conflictReason: ConflictReason;
        pendingAction: { mode: 'new' | 'existing'; transaction?: Transaction | null };
    } | null>(null);

    // Story 14.15: Scan overlay state machine for non-blocking scan flow (AC #1, #4)
    const scanOverlay = useScanOverlayState();
    // Story 14.15 AC #5: Check reduced motion preference for haptic feedback
    const prefersReducedMotion = useReducedMotion();

    // Story 14.15: Scan overlay state machine for non-blocking scan flow (AC #1, #4)
    const scanOverlay = useScanOverlayState();
    // Story 14.15 AC #5: Check reduced motion preference for haptic feedback
    const prefersReducedMotion = useReducedMotion();

    // Settings
    const [lang, setLang] = useState<Language>('es');
    const [currency, setCurrency] = useState<Currency>('CLP');
    const [theme, setTheme] = useState<Theme>('light');
    const [dateFormat, setDateFormat] = useState<'LatAm' | 'US'>('LatAm');
    // Story 7.12 AC#11: Color theme selector
    // Story 14.12: Added 'mono' as new default, migrated from 'normal' default
    const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
        const saved = localStorage.getItem('colorTheme');
        // Migration: treat old 'ghibli' as 'normal', old 'default' as 'professional'
        if (saved === 'ghibli') return 'normal';
        if (saved === 'default') return 'professional';
        // Keep explicit preferences
        if (saved === 'normal' || saved === 'professional' || saved === 'mono') return saved;
        return 'mono'; // Default to 'mono' (monochrome minimal)
    });
    // Story 14.21: Font color mode for category text
    // 'colorful' = use fg colors from category palette (default)
    // 'plain' = use standard text colors (black/white based on mode)
    const [fontColorMode, setFontColorMode] = useState<FontColorMode>(() => {
        const saved = localStorage.getItem('fontColorMode');
        if (saved === 'colorful' || saved === 'plain') return saved;
        return 'colorful'; // Default to colorful
    });
    // Story 14.22: Font family selection - now persisted to Firestore via useUserPreferences
    // Derive from userPreferences for convenience (defaults to 'outfit')
    const fontFamily = userPreferences.fontFamily || 'outfit';

    // Story 9.3: Default location settings (used when scan doesn't detect location)
    // Story 14.22: Now using Firestore-backed preferences instead of localStorage
    // These derived values are for convenience - actual data comes from userPreferences
    const defaultCountry = userPreferences.defaultCountry || '';
    const defaultCity = userPreferences.defaultCity || '';
    const [wiping, setWiping] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

    // Story 10a.4: historyPage state removed - HistoryView no longer used in insights tab
    // distinctAliases is now computed via useMemo, not state (see below)

    // Story 9.20: Pending filters for navigation from Analytics to History
    // When user clicks a badge in Analytics, we store the filters here,
    // then pass them as initialState to HistoryFiltersProvider
    const [pendingHistoryFilters, setPendingHistoryFilters] = useState<HistoryFilterState | null>(null);

    // Story 10a.2: Initial analytics state for "This Month" navigation
    // When user clicks "This Month" card, store the month to initialize TrendsView at month level
    const [analyticsInitialState, setAnalyticsInitialState] = useState<AnalyticsNavigationState | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    // Story 14.22: Main content scroll container ref for scroll position management
    const mainRef = useRef<HTMLDivElement>(null);
    // Story 14.22: Track scroll positions per view for back navigation
    const scrollPositionsRef = useRef<Record<string, number>>({});
    // Story 14.24: Track if pendingScan save effect has been initialized (skip first run)
    const pendingScanInitializedRef = useRef(false);
    const t = (k: string) => (TRANSLATIONS[lang] as any)[k] || k;

    // Extract distinct aliases from transactions (computed, not state)
    const distinctAliases = useMemo(() => {
        const aliases = new Set<string>();
        transactions.forEach(d => {
            if (d.alias) aliases.add(d.alias);
        });
        return Array.from(aliases).sort();
    }, [transactions]);

    // Auto-dismiss toast after 3 seconds
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Story 7.12 AC#11: Persist color theme to localStorage
    useEffect(() => {
        localStorage.setItem('colorTheme', colorTheme);
    }, [colorTheme]);

    // Story 14.21: Persist font color mode to localStorage
    useEffect(() => {
        localStorage.setItem('fontColorMode', fontColorMode);
    }, [fontColorMode]);

    // Story 14.24: Load pending scan from persistent storage on user login
    useEffect(() => {
        if (user?.uid) {
            const storedScan = loadPendingScan(user.uid);
            if (storedScan) {
                setPendingScan(storedScan);
                // Also restore scanImages and currentTransaction for immediate use
                if (storedScan.images.length > 0) {
                    setScanImages(storedScan.images);
                }
                if (storedScan.analyzedTransaction) {
                    setCurrentTransaction(storedScan.analyzedTransaction);
                }
            }
        }
    }, [user?.uid]);

    // Story 14.24: Save/clear pending scan to persistent storage whenever it changes
    // Skip on initial mount to avoid clearing storage before load effect runs
    useEffect(() => {
        if (!user?.uid) return;

        // Skip the first run - let the load effect run first
        if (!pendingScanInitializedRef.current) {
            pendingScanInitializedRef.current = true;
            return;
        }

        if (pendingScan === null) {
            // Clear storage when pendingScan is explicitly set to null
            clearPendingScan(user.uid);
        } else {
            // Only save if there's meaningful content
            const hasContent = pendingScan.images.length > 0 || pendingScan.analyzedTransaction !== null;
            if (hasContent) {
                savePendingScan(user.uid, pendingScan);
            } else {
                // Clear storage if pending scan has no content
                clearPendingScan(user.uid);
            }
        }
    }, [user?.uid, pendingScan]);

    // Story 14.24 Phase 6.2: Navigation guard - warn before closing/refreshing with active transaction
    // This prevents accidental loss of scanned data and credits
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Check if there's an active transaction that would be lost
            const hasActiveTransaction = pendingScan && (
                pendingScan.status === 'analyzing' ||  // Scan in progress
                pendingScan.analyzedTransaction !== null ||  // Analyzed but not saved
                pendingScan.images.length > 0  // Images selected but not analyzed
            );

            if (hasActiveTransaction) {
                // Standard way to trigger browser's "Leave site?" dialog
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [pendingScan]);

    // Story 14.22: Font family persistence REMOVED from localStorage
    // Now stored in Firestore via useUserPreferences.setFontFamily

    // Story 9.3: Default location persistence
    // Story 14.22: REMOVED localStorage persistence - now stored in Firestore via useUserPreferences
    // The setDefaultCountryPref and setDefaultCityPref functions handle saving to Firestore

    // Story 9.8: Sync scanCurrency with user's default preference when it loads
    useEffect(() => {
        if (userPreferences.defaultCurrency) {
            setScanCurrency(userPreferences.defaultCurrency);
        }
    }, [userPreferences.defaultCurrency]);

    // Story 9.20: Clear pending history filters when navigating AWAY from insights view
    // Story 10a.3: Renamed 'list' to 'insights'
    // Story 14.22: Clear pending filters when navigating away from history/insights views
    // This ensures filters are applied when entering these views, but cleared when leaving
    // so that returning normally shows unfiltered transactions
    useEffect(() => {
        // Clear filters when navigating away from history or insights view (not when entering them)
        if (view !== 'insights' && view !== 'history' && pendingHistoryFilters) {
            setPendingHistoryFilters(null);
        }
    }, [view]); // Only depend on view, not pendingHistoryFilters

    // Story 10a.2: Clear analytics initial state when navigating AWAY from trends view
    // This ensures initial state is applied when entering trends, but cleared when leaving
    // so that returning to trends normally shows year-level view
    useEffect(() => {
        if (view !== 'trends' && analyticsInitialState) {
            setAnalyticsInitialState(null);
        }
    }, [view]); // Only depend on view, not analyticsInitialState

    // Note: Theme is applied synchronously during render (before JSX return)
    // to ensure CSS variables are available when children compute memoized data

    // Story 14.15b: Navigate to a view while tracking the previous view for back navigation
    // Story 14.22: Also saves scroll position before navigating
    const navigateToView = useCallback((targetView: View) => {
        // Save current scroll position before navigating
        if (mainRef.current) {
            scrollPositionsRef.current[view] = mainRef.current.scrollTop;
        }
        setPreviousView(view);
        setView(targetView);
        // Story 14.24: Hide QuickSaveCard when navigating to a different view
        // This prevents the modal from floating over other views
        if (targetView !== 'transaction-editor' && targetView !== 'scan-result') {
            setShowQuickSaveCard(false);
        }
        // Reset scroll to top for the new view
        setTimeout(() => {
            if (mainRef.current) {
                mainRef.current.scrollTo(0, 0);
            }
        }, 0);
    }, [view]);

    // Story 14.15b: Navigate back to the previous view (fallback to dashboard)
    // Story 14.16b: If previousView is same as current or invalid, always fallback to dashboard
    // Story 14.22: Also restores scroll position when navigating back
    const navigateBack = useCallback(() => {
        // Always go to dashboard if:
        // 1. previousView is the same as current view (would be a no-op)
        // 2. previousView is undefined/falsy
        // 3. previousView is 'dashboard' (already the home screen)
        const targetView = (previousView && previousView !== view) ? previousView : 'dashboard';
        setView(targetView);
        // Restore scroll position for the target view
        setTimeout(() => {
            if (mainRef.current) {
                const savedPosition = scrollPositionsRef.current[targetView] || 0;
                mainRef.current.scrollTo(0, savedPosition);
            }
        }, 0);
    }, [previousView, view]);

    // Story 9.9: Unified new transaction handler
    // Story 9.10: Now checks for existing pending scan and restores it (AC #2)
    // Both "+" button and camera button now go to EditView
    // Camera button also auto-opens the file picker
    const handleNewTransaction = (autoOpenFilePicker: boolean) => {
        // Story 12.3: If batch review is active, show that instead of new transaction
        if (batchReviewResults.length > 0) {
            setView('batch-review');
            return;
        }

        // Story 9.10 AC#2: Check for existing pending scan WITH meaningful content
        // Story 14.15: Only restore if there are images or analyzed transaction
        // Don't restore empty pending scans (e.g., from cancelled file picker)
        if (pendingScan && (pendingScan.images.length > 0 || pendingScan.analyzedTransaction)) {
            // Story 14.24: Clear QuickSaveCard when restoring pending transaction
            // QuickSaveCard should only appear after a fresh scan, not when returning to draft
            setShowQuickSaveCard(false);
            setQuickSaveTransaction(null);

            // Restore pending scan state
            setScanImages(pendingScan.images);
            setScanError(pendingScan.error || null);
            if (pendingScan.analyzedTransaction) {
                setCurrentTransaction(pendingScan.analyzedTransaction);
            } else {
                // Story 14.24: Include default location and currency in new transactions
                setCurrentTransaction({
                    merchant: '',
                    date: getSafeDate(null),
                    total: 0,
                    category: 'Supermarket',
                    items: [],
                    country: defaultCountry,
                    city: defaultCity,
                    currency: userPreferences.defaultCurrency || 'CLP',
                });
            }
            // Story 14.23: Restore to unified TransactionEditorView
            // Determine scan button state based on pending scan status
            setTransactionEditorMode('new');
            // Story 14.24: Only show 'complete' state if an actual scan happened (has images stored)
            // If user just edited without scanning, keep idle state
            if (pendingScan.status === 'analyzing') {
                // Scan is in progress - show scanning state
                setScanButtonState('scanning');
            } else if (pendingScan.status === 'analyzed' && pendingScan.images.length > 0) {
                // Scan completed WITH images - show complete state
                setScanButtonState('complete');
            } else if (pendingScan.images.length > 0) {
                // Has images but not processed - show pending state
                setScanButtonState('pending');
            } else {
                // No images (just draft edits) - show idle state
                setScanButtonState('idle');
            }
            navigateToView('transaction-editor');
            // Don't auto-open file picker when returning to pending scan
            return;
        }

        // Clear any empty/stale pending scan
        setPendingScan(null);

        // No pending scan - create fresh session
        setScanImages([]);
        setScanError(null);
        // Story 9.8: Reset scan options to defaults
        setScanStoreType('auto');
        setScanCurrency(userPreferences.defaultCurrency || 'CLP');
        // Story 14.24: Include default location and currency in new transactions
        setCurrentTransaction({
            merchant: '',
            date: getSafeDate(null),
            total: 0,
            category: 'Supermarket',
            items: [],
            country: defaultCountry,
            city: defaultCity,
            currency: userPreferences.defaultCurrency || 'CLP',
        });
        // Story 9.10 AC#1, AC#3: Create new pending scan session
        setPendingScan(createPendingScan());
        // Story 14.23: Use unified TransactionEditorView for new transactions
        // Camera button opens file picker, manual "+" goes directly to editor for manual entry
        if (autoOpenFilePicker) {
            navigateToTransactionEditor('new');
            setTimeout(() => fileInputRef.current?.click(), 200);
        } else {
            // Manual "+" button - go to transaction editor for manual entry
            navigateToTransactionEditor('new');
        }
    };

    // Story 9.9: Handler to remove a photo from scan images
    // Story 9.10: Also update pending scan state
    // Story 14.23: DEPRECATED - was used by EditView/ScanResultView, kept for potential rollback
    const _handleRemovePhoto = (index: number) => {
        setScanImages(prev => {
            const updatedImages = prev.filter((_, i) => i !== index);
            // Story 9.10: Update pending scan with removed image
            if (pendingScan) {
                setPendingScan({
                    ...pendingScan,
                    images: updatedImages
                });
            }
            return updatedImages;
        });
    };
    void _handleRemovePhoto; // Suppress unused warning

    // Story 9.9: Cancel handler for new transactions
    // Story 9.10 AC#4: Clear pending scan on cancel
    // Story 14.23: DEPRECATED - was used by EditView/ScanResultView, kept for potential rollback
    const _handleCancelNewTransaction = () => {
        setScanImages([]);
        setScanError(null);
        setCurrentTransaction(null);
        // Story 9.10 AC#4: Clear pending scan state on cancel
        setPendingScan(null);
        // Story 14.23: Reset scan button state
        setScanButtonState('idle');
        setView('dashboard');
    };
    void _handleCancelNewTransaction; // Suppress unused warning

    // Story 14.24: Check if there's an active transaction that would conflict
    const hasActiveTransactionConflict = useCallback((): {
        hasConflict: boolean;
        conflictInfo?: { transaction: ConflictingTransaction; reason: ConflictReason };
    } => {
        // Check if there's a pending scan with content
        if (!pendingScan) {
            return { hasConflict: false };
        }

        // If we're already on transaction-editor, no conflict (editing same transaction)
        if (view === 'transaction-editor') {
            return { hasConflict: false };
        }

        // Check various conflict scenarios
        const hasAnalyzedTransaction = !!pendingScan.analyzedTransaction;
        const hasImages = pendingScan.images.length > 0;
        const isScanning = pendingScan.status === 'analyzing';

        // If scanning in progress, that's a conflict
        if (isScanning) {
            return {
                hasConflict: true,
                conflictInfo: {
                    transaction: {
                        merchant: pendingScan.analyzedTransaction?.merchant,
                        total: pendingScan.analyzedTransaction?.total,
                        currency: pendingScan.analyzedTransaction?.currency,
                        creditUsed: true, // Credit reserved during scan
                        hasChanges: false,
                        isScanning: true,
                        source: 'new_scan',
                    },
                    reason: 'scan_in_progress',
                },
            };
        }

        // If we have analyzed transaction (credit was used), that's a conflict
        if (hasAnalyzedTransaction && pendingScan.status === 'analyzed') {
            return {
                hasConflict: true,
                conflictInfo: {
                    transaction: {
                        merchant: pendingScan.analyzedTransaction?.merchant,
                        total: pendingScan.analyzedTransaction?.total,
                        currency: pendingScan.analyzedTransaction?.currency,
                        creditUsed: true,
                        hasChanges: true,
                        isScanning: false,
                        source: 'new_scan',
                    },
                    reason: 'credit_used',
                },
            };
        }

        // If we have images but no analysis yet, that's unsaved content
        if (hasImages && !hasAnalyzedTransaction) {
            return {
                hasConflict: true,
                conflictInfo: {
                    transaction: {
                        creditUsed: false,
                        hasChanges: true,
                        isScanning: false,
                        source: 'new_scan',
                    },
                    reason: 'has_unsaved_changes',
                },
            };
        }

        return { hasConflict: false };
    }, [pendingScan, view]);

    // Story 14.23: Navigate to unified transaction editor
    // Story 14.24: Enhanced with conflict detection
    // mode: 'new' for new transactions, 'existing' for editing
    const navigateToTransactionEditor = (mode: 'new' | 'existing', transaction?: Transaction | null) => {
        // Story 14.24: Check for conflicts with existing pending scan
        const conflictCheck = hasActiveTransactionConflict();

        // For 'existing' mode, also check if we're editing the same transaction
        const isEditingSameTransaction = mode === 'existing' && transaction?.id &&
            pendingScan?.analyzedTransaction?.id === transaction.id;

        if (conflictCheck.hasConflict && conflictCheck.conflictInfo && !isEditingSameTransaction) {
            // Show conflict dialog instead of navigating
            setConflictDialogData({
                conflictingTransaction: conflictCheck.conflictInfo.transaction,
                conflictReason: conflictCheck.conflictInfo.reason,
                pendingAction: { mode, transaction },
            });
            setShowConflictDialog(true);
            return;
        }

        // No conflict, proceed with navigation
        // Story 14.24: Reset read-only mode and creditUsedInSession when navigating to editor normally
        setIsViewingReadOnly(false);
        setCreditUsedInSession(false);
        setTransactionEditorMode(mode);
        setScanButtonState(mode === 'new' ? 'idle' : (transaction?.thumbnailUrl ? 'complete' : 'idle'));
        if (transaction) {
            setCurrentTransaction(transaction as any);
        } else if (mode === 'new') {
            // Story 14.24: Include default location and currency in new transactions
            setCurrentTransaction({
                merchant: '',
                date: getSafeDate(null),
                total: 0,
                category: 'Supermarket',
                items: [],
                country: defaultCountry,
                city: defaultCity,
                currency: userPreferences.defaultCurrency || 'CLP',
            });
        }
        navigateToView('transaction-editor');
    };

    // Story 14.24: Navigate to read-only transaction view
    // Used when clicking a transaction in HistoryView - uses TransactionEditorView in readOnly mode
    // User clicks "Edit" button to enter edit mode (with conflict check)
    const navigateToTransactionDetail = (transaction: Transaction) => {
        setIsViewingReadOnly(true);
        setCreditUsedInSession(false); // No credit used yet - this is just viewing
        setTransactionEditorMode('existing');
        setCurrentTransaction(transaction);
        setScanButtonState(transaction.thumbnailUrl ? 'complete' : 'idle');
        navigateToView('transaction-editor');
    };

    // Story 14.24: Handle edit request from read-only view
    // This is called when user clicks "Edit" button in the TransactionEditorView (readOnly mode)
    // Performs conflict check before enabling edit mode
    const handleRequestEditFromReadOnly = () => {
        // Check for conflicts before allowing edit
        const conflictCheck = hasActiveTransactionConflict();

        if (conflictCheck.hasConflict && conflictCheck.conflictInfo) {
            // Show conflict dialog
            setConflictDialogData({
                conflictingTransaction: conflictCheck.conflictInfo.transaction,
                conflictReason: conflictCheck.conflictInfo.reason,
                pendingAction: { mode: 'existing', transaction: currentTransaction! },
            });
            setShowConflictDialog(true);
        } else {
            // No conflict, enable edit mode
            setIsViewingReadOnly(false);
        }
    };

    // Story 14.24: DEPRECATED - TransactionDetailView removed, using TransactionEditorView with readOnly instead
    // handleEditFromDetailView and handleShowConflictFromDetailView removed

    // Legacy scan handler (for backward compatibility during transition)
    const triggerScan = () => {
        handleNewTransaction(true);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);
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

        // Story 11.1: Detect multi-image upload (AC #2, #7)
        if (newImages.length > 1) {
            // Check max limit (AC #7)
            if (newImages.length > MAX_BATCH_IMAGES) {
                setToastMessage({ text: t('batchMaxLimitError'), type: 'info' });
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            // Show batch preview (AC #2)
            setBatchImages(newImages);
            setShowBatchPreview(true);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Single image - Story 14.15: Go to scan-result view with pending image (NOT auto-process)
        const updatedImages = [...scanImages, ...newImages];
        setScanImages(updatedImages);
        // Story 9.10 AC#3: Update pending scan with new images
        if (pendingScan) {
            setPendingScan({
                ...pendingScan,
                images: updatedImages,
                status: 'images_added'
            });
        }
        // Story 14.15: Navigate to scan-result view - user must click to process
        // Don't auto-process - wait for user to click the scan button
        setView('scan-result');
        if (fileInputRef.current) fileInputRef.current.value = '';
        // Auto-trigger scan processing after a brief delay for state to settle
        setTimeout(() => {
            processScan();
        }, 100);
    };

    const processScan = async () => {
        // Story 9.10 AC#7: Check if user has credits before scanning
        if (userCredits.remaining <= 0) {
            setScanError(t('noCreditsMessage'));
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        // Story 14.24: Reserve credit before scan (UI shows deducted, not persisted yet)
        // Credit will be confirmed on success or refunded on error
        const reserved = reserveCredits(1, 'normal');
        if (!reserved) {
            setScanError(t('noCreditsMessage'));
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        // Story 14.24: Mark that a credit was used in this session (for cancel warning)
        setCreditUsedInSession(true);

        setIsAnalyzing(true);
        setScanError(null);
        // Story 14.15: Start scan overlay flow (AC #1)
        scanOverlay.startUpload();
        // Simulate upload progress (images are already local base64)
        scanOverlay.setProgress(100);
        scanOverlay.startProcessing();

        // Story 9.10: Update pending scan status to 'analyzing'
        if (pendingScan) {
            setPendingScan({ ...pendingScan, status: 'analyzing' });
        }
        try {
            // Story 14.24: Credit already reserved locally - will be confirmed on success
            // Removed: await deductUserCredits(1); - now using reserve/confirm pattern

            // Story 9.8: Pass scan options (currency and store type) to analyzeReceipt
            // Story 14.15 AC #4: Add timeout handling for network requests
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), PROCESSING_TIMEOUT_MS);
            });
            const result = await Promise.race([
                analyzeReceipt(
                    scanImages,
                    scanCurrency,
                    scanStoreType !== 'auto' ? scanStoreType : undefined
                ),
                timeoutPromise
            ]);
            let d = getSafeDate(result.date);
            if (new Date(d).getFullYear() > new Date().getFullYear())
                d = new Date().toISOString().split('T')[0];
            const merchant = result.merchant || 'Unknown';
            const finalTotal = parseStrictNumber(result.total);

            // Story 9.3: Determine country and city
            // 1. If scan detected country/city, validate city exists in our list (case-insensitive)
            // 2. If scan didn't detect, fall back to user's default location
            let finalCountry = result.country || '';
            let finalCity = result.city || '';

            if (finalCountry && finalCity) {
                // Validate scanned city exists in our list for that country (case-insensitive match)
                const availableCities = getCitiesForCountry(finalCountry);
                const scannedCityLower = finalCity.toLowerCase();
                const matchedCity = availableCities.find(c => c.toLowerCase() === scannedCityLower);
                // Use the properly-cased version from our list, or clear if not found
                finalCity = matchedCity || '';
            }

            // If no location detected from scan, use defaults
            if (!finalCountry && defaultCountry) {
                finalCountry = defaultCountry;
                finalCity = defaultCity; // Use default city if no country was detected
            } else if (finalCountry && !finalCity && defaultCountry === finalCountry && defaultCity) {
                // Same country detected but no city, use default city
                finalCity = defaultCity;
            }

            // Story 14.15b: Map 'quantity' from AI to 'qty' field, default to 1
            const parsedItems = (result.items || []).map(i => ({
                ...i,
                price: parseStrictNumber(i.price),
                qty: (i as any).quantity ?? i.qty ?? 1,
            }));

            // Total validation: Check if extracted total matches items sum (>40% discrepancy)
            // Build temporary transaction for validation
            const tempTransaction: Transaction = {
                merchant: merchant,
                date: d,
                total: finalTotal,
                category: result.category || 'Other',
                items: parsedItems,
            };
            const totalValidation = validateTotal(tempTransaction);

            // If significant discrepancy detected, show dialog for user to choose
            if (!totalValidation.isValid) {
                // Story 14.24: Confirm credit - AI returned valid result, just needs user decision
                await confirmReservedCredits();
                // Store pending data and show total mismatch dialog
                setTotalMismatchData({
                    validationResult: totalValidation,
                    pendingTransaction: {
                        ...tempTransaction,
                        alias: merchant,
                        imageUrls: result.imageUrls,
                        thumbnailUrl: result.thumbnailUrl,
                        time: result.time,
                        country: finalCountry,
                        city: finalCity,
                        currency: result.currency,
                        receiptType: result.receiptType,
                        promptVersion: result.promptVersion,
                        merchantSource: result.merchantSource
                    },
                    parsedItems,
                });
                setShowTotalMismatch(true);
                setIsAnalyzing(false);
                scanOverlay.setReady();
                return;
            }

            // Story 14.15b: Reconcile items total with receipt total
            // If sum of items doesn't match receipt total, add an adjustment item
            const { items: reconciledItems, hasDiscrepancy: scanHasDiscrepancy } = reconcileItemsTotal(
                parsedItems,
                finalTotal,
                lang
            );

            // Build initial transaction from Gemini response
            const initialTransaction: Transaction = {
                merchant: merchant,
                date: d,
                total: finalTotal,
                category: result.category || 'Other',
                alias: merchant,
                items: reconciledItems,
                // Include image URLs from Cloud Function response
                imageUrls: result.imageUrls,
                thumbnailUrl: result.thumbnailUrl,
                // Story 9.1: v2.6.0 fields from AI extraction
                time: result.time,
                country: finalCountry,
                city: finalCity,
                currency: result.currency,
                receiptType: result.receiptType,
                promptVersion: result.promptVersion,
                merchantSource: result.merchantSource
            };

            // Story 6.4: Apply learned category mappings (AC#1-4)
            // Only matches with confidence > 0.7 are applied
            const { transaction: categorizedTransaction, appliedMappingIds } =
                applyCategoryMappings(initialTransaction, mappings);

            // Story 6.4 AC#5: Increment usage count for applied mappings (fire-and-forget)
            if (appliedMappingIds.length > 0 && user && services) {
                appliedMappingIds.forEach(mappingId => {
                    incrementMappingUsage(services.db, user.uid, services.appId, mappingId)
                        .catch(err => console.error('Failed to increment mapping usage:', err));
                });
            }

            // Story 9.5: Apply learned merchant→alias mapping (AC#4, #5, #6)
            // Merchant name = raw from receipt (stays as-is)
            // Alias = user's preferred display name (what we learn and auto-fill)
            let finalTransaction = categorizedTransaction;
            const merchantMatch = findMerchantMatch(categorizedTransaction.merchant);
            if (merchantMatch && merchantMatch.confidence > 0.7) {
                // AC#5: Apply matched alias (targetMerchant stores the preferred alias)
                finalTransaction = {
                    ...finalTransaction,
                    alias: merchantMatch.mapping.targetMerchant,
                    // AC#6: Mark as learned
                    merchantSource: 'learned' as const
                };

                // AC#7: Increment mapping usage count (fire-and-forget)
                if (merchantMatch.mapping.id && user && services) {
                    incrementMerchantMappingUsage(services.db, user.uid, services.appId, merchantMatch.mapping.id)
                        .catch(err => console.error('Failed to increment merchant mapping usage:', err));
                }
            }

            // Story 14.15b AC #2: Currency auto-detection handling
            // Compare AI-detected currency with user's default currency
            const detectedCurrency = finalTransaction.currency;
            const userDefaultCurrency = userPreferences.defaultCurrency;

            // If AI detected a currency different from user's default, show dialog
            if (detectedCurrency && userDefaultCurrency && detectedCurrency !== userDefaultCurrency) {
                // Story 14.24: Confirm credit - AI returned valid result, just needs user decision
                await confirmReservedCredits();
                // Store pending transaction and show currency mismatch dialog
                setCurrencyMismatchData({
                    detectedCurrency,
                    pendingTransaction: finalTransaction,
                    hasDiscrepancy: scanHasDiscrepancy, // Story 14.15b: Pass discrepancy flag
                });
                setShowCurrencyMismatch(true);
                // Don't proceed with normal flow - wait for user's choice
                setIsAnalyzing(false);
                scanOverlay.setReady();
                return;
            }

            // If AI returned null/undefined, use user's default currency
            if (!detectedCurrency && userDefaultCurrency) {
                finalTransaction = {
                    ...finalTransaction,
                    currency: userDefaultCurrency,
                };
            }

            setCurrentTransaction(finalTransaction);
            // Story 9.10: Update pending scan with analyzed transaction (status = 'analyzed')
            // Keep images for reference, but mark as analyzed
            if (pendingScan) {
                setPendingScan({
                    ...pendingScan,
                    analyzedTransaction: finalTransaction,
                    status: 'analyzed'
                });
            }
            // Story 14.23: Update scan button state to complete for TransactionEditorView
            setScanButtonState('complete');
            // Clear local scan images since they're now stored in transaction
            setScanImages([]);

            // Story 14.24: Confirm the reserved credit (persist to Firestore)
            // This is the success path - credit is now officially charged
            await confirmReservedCredits();

            // Story 14.15: Mark scan as ready (AC #1)
            scanOverlay.setReady();
            // Story 14.15 AC #5: Haptic feedback on scan success (only when motion enabled)
            if (!prefersReducedMotion && navigator.vibrate) {
                navigator.vibrate(50); // Brief success haptic
            }

            // Story 14.15b: Show warning if items total didn't match receipt total
            if (scanHasDiscrepancy) {
                setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
            }

            // Story 11.4: Check if merchant is trusted for auto-save (AC #5)
            const merchantAlias = finalTransaction.alias || finalTransaction.merchant;
            const isTrusted = merchantAlias ? await checkTrusted(merchantAlias) : false;

            if (isTrusted && services && user) {
                // Story 11.4 AC #5: Auto-save for trusted merchants
                // Skip Quick Save Card entirely
                try {
                    const transactionId = await firestoreAddTransaction(services.db, user.uid, services.appId, finalTransaction);
                    const txWithId = { ...finalTransaction, id: transactionId } as Transaction;

                    // Generate insight
                    const insight = await generateInsightForTransaction(
                        txWithId,
                        transactions,
                        insightProfile || { schemaVersion: 1, firstTransactionDate: null as any, totalTransactions: 0, recentInsights: [] },
                        insightCache
                    );

                    addToBatch(txWithId, insight);

                    // Record scan (not edited since it was auto-saved)
                    await recordMerchantScan(merchantAlias, false).catch(err =>
                        console.warn('Failed to record merchant scan:', err)
                    );

                    // Clear pending scan and show toast
                    setPendingScan(null);
                    setCurrentTransaction(null);
                    setToastMessage({ text: t('autoSaved'), type: 'success' });
                    setView('dashboard');

                    // Show insight or batch summary
                    const silenced = isInsightsSilenced(insightCache);
                    if (!silenced) {
                        const willBeBatchMode = (batchSession?.receipts.length ?? 0) + 1 >= 3;
                        if (willBeBatchMode) {
                            setShowBatchSummary(true);
                        } else {
                            setCurrentInsight(insight);
                            setShowInsightCard(true);
                        }
                    }
                } catch (autoSaveErr) {
                    console.error('Auto-save failed:', autoSaveErr);
                    // Fall back to Quick Save Card on error
                    setQuickSaveTransaction(finalTransaction);
                    setQuickSaveConfidence(calculateConfidence(finalTransaction));
                    setShowQuickSaveCard(true);
                }
            } else {
                // Story 11.2: Check confidence for Quick Save eligibility (AC #5, #6)
                const confidence = calculateConfidence(finalTransaction);
                if (shouldShowQuickSave(finalTransaction)) {
                    // High confidence: Show Quick Save Card (AC #1)
                    setQuickSaveTransaction(finalTransaction);
                    setQuickSaveConfidence(confidence);
                    setShowQuickSaveCard(true);
                } else {
                    // Low confidence: Stay on TransactionEditorView for editing
                    // Story 14.23: View is already 'transaction-editor', ScanCompleteModal will show
                    // Story 11.3: Enable item animation for fresh scan results
                    setAnimateEditViewItems(true);
                    // Note: No setView call needed - view is already 'transaction-editor'
                    // and ScanCompleteModal shows automatically via useEffect
                }
            }
        } catch (e: any) {
            const errorMessage = 'Failed: ' + e.message;
            setScanError(errorMessage);
            // Story 14.15 AC #4: Detect timeout vs other errors and show in overlay
            const isTimeout = e.message?.includes('timed out');
            scanOverlay.setError(isTimeout ? 'timeout' : 'api', errorMessage);
            // Story 14.23: Update scan button state to error for TransactionEditorView
            setScanButtonState('error');
            // Story 9.10: Update pending scan with error status
            if (pendingScan) {
                setPendingScan({
                    ...pendingScan,
                    status: 'error',
                    error: errorMessage
                });
            }
            // Story 14.24: Refund the reserved credit (scan failed, credit not charged)
            refundReservedCredits();
            // Story 14.24 AC #4: Show toast that credit was not used
            setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Story 14.15b: Re-scan existing transaction with stored imageUrls
    const handleRescan = async () => {
        if (!currentTransaction?.id || !currentTransaction.imageUrls?.length) {
            console.error('Cannot rescan: no transaction or images');
            return;
        }
        if (userCredits.remaining <= 0) {
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        // Story 14.24: Reserve credit for re-scan
        const reserved = reserveCredits(1, 'normal');
        if (!reserved) {
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        // Story 14.24: Mark that a credit was used in this session (for cancel warning)
        setCreditUsedInSession(true);

        setIsRescanning(true);
        try {
            // Story 14.24: Credit already reserved - will be confirmed on success

            // Call analyzeReceipt with stored images (using imageUrls directly)
            // V3 prompt auto-detects currency, but we still pass empty string (required param)
            // Story 14.15b: Pass isRescan=true so Cloud Function fetches from URLs
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

            // Story 14.15b: Map 'quantity' from AI to 'qty' field
            const parsedItems = (result.items || []).map(i => ({
                ...i,
                price: parseStrictNumber(i.price),
                qty: (i as any).quantity ?? i.qty ?? 1,
            }));

            // Story 14.15b: Reconcile items total with receipt total
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

            // Story 14.24: Confirm the reserved credit (persist to Firestore)
            await confirmReservedCredits();

            // Show appropriate toast message
            if (hasDiscrepancy) {
                setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
            } else {
                setToastMessage({ text: t('rescanSuccess'), type: 'success' });
            }
        } catch (e: any) {
            console.error('Re-scan failed:', e);
            // Story 14.24: Refund the reserved credit (re-scan failed)
            refundReservedCredits();
            setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
        } finally {
            setIsRescanning(false);
        }
    };

    // Story 11.1: Batch image processing (AC #3, #4, #5, #6)
    // Story 12.2/12.3: DEPRECATED - replaced by useBatchProcessing hook + BatchReviewView
    // Kept for reference during transition; will be removed in future cleanup
    // @ts-expect-error - Deprecated function kept for reference
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _processBatchImages_DEPRECATED = async () => {
        if (!services || !user) return;
        if (userCredits.remaining < batchImages.length) {
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        setShowBatchPreview(false);
        setIsBatchProcessing(true);
        setBatchProgress({ current: 0, total: batchImages.length });
        // Reset cancel state
        setBatchCancelRequested(false);
        setShowBatchCancelConfirm(false);
        batchCancelRef.current = false;

        // Initialize results with pending status
        const initialResults: BatchItemResult[] = batchImages.map((_, index) => ({
            index,
            status: 'pending' as const,
        }));
        setBatchResults(initialResults);

        const results: BatchItemResult[] = [...initialResults];
        const { db, appId } = services;

        // Process each image sequentially (AC #3)
        for (let i = 0; i < batchImages.length; i++) {
            // Check for cancel request before processing next image
            if (batchCancelRef.current) {
                // Mark remaining items as cancelled (not processed)
                for (let j = i; j < batchImages.length; j++) {
                    results[j] = { ...results[j], status: 'pending' };
                }
                setBatchResults([...results]);
                break;
            }

            // Update current item to processing
            results[i] = { ...results[i], status: 'processing' };
            setBatchResults([...results]);
            setBatchProgress({ current: i + 1, total: batchImages.length });

            try {
                // Process single image (credit deducted after successful save)
                const result = await analyzeReceipt(
                    [batchImages[i]],
                    scanCurrency,
                    scanStoreType !== 'auto' ? scanStoreType : undefined
                );

                let d = getSafeDate(result.date);
                if (new Date(d).getFullYear() > new Date().getFullYear())
                    d = new Date().toISOString().split('T')[0];
                const merchant = result.merchant || 'Unknown';
                const finalTotal = parseStrictNumber(result.total);

                // Apply location logic
                const finalCountry = result.country || defaultCountry || '';
                let finalCity = result.city || '';
                if (finalCountry && finalCity) {
                    const availableCities = getCitiesForCountry(finalCountry);
                    const matchedCity = availableCities.find(c => c.toLowerCase() === finalCity.toLowerCase());
                    finalCity = matchedCity || '';
                }
                if (!finalCity && defaultCountry === finalCountry && defaultCity) {
                    finalCity = defaultCity;
                }

                // Build transaction
                const transaction: Transaction = {
                    merchant: merchant,
                    date: d,
                    total: finalTotal,
                    category: result.category || 'Other',
                    alias: merchant,
                    // Story 14.15b: Map 'quantity' from AI to 'qty' field, default to 1
                    items: (result.items || []).map(item => ({
                        ...item,
                        price: parseStrictNumber(item.price),
                        qty: (item as any).quantity ?? item.qty ?? 1,
                    })),
                    imageUrls: result.imageUrls,
                    thumbnailUrl: result.thumbnailUrl,
                    time: result.time,
                    country: finalCountry,
                    city: finalCity,
                    currency: result.currency,
                    receiptType: result.receiptType,
                    promptVersion: result.promptVersion,
                    merchantSource: result.merchantSource
                };

                // Apply category mappings
                const { transaction: categorizedTx, appliedMappingIds } =
                    applyCategoryMappings(transaction, mappings);

                // Increment mapping usage (fire-and-forget)
                if (appliedMappingIds.length > 0) {
                    appliedMappingIds.forEach(mappingId => {
                        incrementMappingUsage(db, user.uid, appId, mappingId)
                            .catch(err => console.error('Failed to increment mapping usage:', err));
                    });
                }

                // Apply merchant mappings
                let finalTx = categorizedTx;
                const merchantMatch = findMerchantMatch(categorizedTx.merchant);
                if (merchantMatch && merchantMatch.confidence > 0.7) {
                    finalTx = {
                        ...finalTx,
                        alias: merchantMatch.mapping.targetMerchant,
                        merchantSource: 'learned' as const
                    };
                    if (merchantMatch.mapping.id) {
                        incrementMerchantMappingUsage(db, user.uid, appId, merchantMatch.mapping.id)
                            .catch(err => console.error('Failed to increment merchant mapping usage:', err));
                    }
                }

                // Save transaction (AC #8)
                const transactionId = await firestoreAddTransaction(db, user.uid, appId, finalTx);
                const txWithId = { ...finalTx, id: transactionId };

                // Deduct credit AFTER successful save (prevents credit loss on API failure, persisted to Firestore)
                await deductUserCredits(1);

                // Add to batch session for summary
                const insight = await generateInsightForTransaction(
                    txWithId,
                    transactions,
                    insightProfile || { schemaVersion: 1, firstTransactionDate: null as any, totalTransactions: 0, recentInsights: [] },
                    insightCache
                );
                addToBatch(txWithId, insight);

                // Update result to success
                results[i] = {
                    index: i,
                    status: 'success',
                    merchant: finalTx.alias || finalTx.merchant,
                    total: finalTx.total,
                };
                setBatchResults([...results]);

            } catch (error: any) {
                // AC #6: Continue with remaining images on failure
                console.error(`Batch image ${i + 1} failed:`, error);
                results[i] = {
                    index: i,
                    status: 'failed',
                    error: error.message || 'Unknown error',
                };
                setBatchResults([...results]);
            }
        }

        // Processing complete
        setIsBatchProcessing(false);

        // Count successes
        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'failed').length;

        // AC #5: Show batch summary after all processed
        if (successCount > 0) {
            // Short delay to show completion state (matches READY_DISPLAY_MS from useScanState)
            const BATCH_COMPLETE_DELAY_MS = 500;
            setTimeout(() => {
                setShowBatchSummary(true);
                setBatchImages([]);
                setBatchResults([]);
            }, BATCH_COMPLETE_DELAY_MS);
        } else {
            // All failed - show error
            setToastMessage({ text: t('scanFailed'), type: 'info' });
            setBatchImages([]);
            setBatchResults([]);
        }

        // Show partial failure warning (AC #6)
        if (failCount > 0 && successCount > 0) {
            setToastMessage({
                text: t('batchPartialWarning').replace('{count}', String(failCount)),
                type: 'info'
            });
        }
    };

    // Story 11.1: Cancel batch preview
    const handleCancelBatchPreview = () => {
        setShowBatchPreview(false);
        setBatchImages([]);
    };

    // Story 11.1: Handle cancel request during batch processing
    const handleBatchCancelRequest = () => {
        // Show confirmation dialog
        setShowBatchCancelConfirm(true);
    };

    // Story 11.1: Confirm batch cancellation
    const handleBatchCancelConfirm = () => {
        batchCancelRef.current = true;
        setBatchCancelRequested(true);
        setShowBatchCancelConfirm(false);
    };

    // Story 11.1: Dismiss cancel confirmation (continue processing)
    const handleBatchCancelDismiss = () => {
        setShowBatchCancelConfirm(false);
    };

    // Story 12.4: Credit Warning System handlers (AC #1, #5, #7)
    // Called when user clicks "Procesar todas" in BatchUploadPreview
    const handleBatchConfirmWithCreditCheck = () => {
        // AC #1: Pre-batch warning shows credit cost before processing
        // Story 14.15 Session 10: Use super credits for batch mode
        const result = checkCreditSufficiency(userCredits, batchImages.length, true);
        setCreditCheckResult(result);
        setShowCreditWarning(true);
    };

    // Called when user confirms credit warning dialog
    // Story 12.2 & 12.3: Now uses parallel processing and navigates to batch review
    const handleCreditWarningConfirm = async () => {
        // AC #5: "Continuar" → begin processing
        setShowCreditWarning(false);
        setCreditCheckResult(null);
        setShowBatchPreview(false);

        // Story 12.3: Navigate to batch-review IMMEDIATELY to show processing progress
        // Users can navigate away and return to see progress
        setView('batch-review');

        // Story 12.2: Use parallel processing instead of sequential
        const results = await batchProcessing.startProcessing(
            batchImages,
            scanCurrency,
            scanStoreType !== 'auto' ? scanStoreType : undefined
        );

        // Story 12.3: Store results for review after processing completes
        setBatchReviewResults(results);
    };

    // Called when user cancels credit warning dialog
    const handleCreditWarningCancel = () => {
        // AC #5: "Cancelar" → return to batch capture
        setShowCreditWarning(false);
        setCreditCheckResult(null);
    };

    // Called when user wants to reduce batch to available credits
    const handleReduceBatch = () => {
        if (!creditCheckResult) return;
        // Reduce batch to maxProcessable images
        const maxProcessable = creditCheckResult.maxProcessable;
        setBatchImages(prev => prev.slice(0, maxProcessable));
        setShowCreditWarning(false);
        // Re-check credits with reduced batch
        // Story 14.15 Session 10: Use super credits for batch mode
        const newResult = checkCreditSufficiency(userCredits, maxProcessable, true);
        setCreditCheckResult(newResult);
        setShowCreditWarning(true);
    };

    // Story 12.3: Batch Review handlers (AC #4, #6, #7)
    // Handle edit receipt from batch review
    // Story 14.23: Updated to use TransactionEditorView
    const handleBatchEditReceipt = (receipt: BatchReceipt, batchIndex: number, batchTotal: number) => {
        setBatchEditingReceipt({ receipt, index: batchIndex, total: batchTotal });
        // Set up transaction editor with the receipt's transaction
        setCurrentTransaction(receipt.transaction);
        setScanImages(receipt.imageUrl ? [receipt.imageUrl] : []);
        // Story 14.23: Use unified TransactionEditorView for batch editing
        setTransactionEditorMode('existing'); // Treat as existing since it's already processed
        setScanButtonState(receipt.imageUrl ? 'complete' : 'idle');
        navigateToView('transaction-editor');
    };

    // Handle back from batch review (return to dashboard, discard batch)
    const handleBatchReviewBack = () => {
        setBatchReviewResults([]);
        setBatchImages([]);
        batchProcessing.reset();
        setView('dashboard');
    };

    // Handle save all complete from batch review
    // Story 14.15: Now receives saved transactions for batch complete modal
    const handleBatchSaveComplete = async (savedTransactionIds: string[], savedTransactions: Transaction[]) => {
        const creditsUsed = savedTransactionIds.length;

        // Deduct credits for saved transactions (persisted to Firestore)
        await deductUserCredits(creditsUsed);

        // Clear batch state
        setBatchReviewResults([]);
        setBatchImages([]);
        batchProcessing.reset();

        // Story 14.15: Show batch complete modal instead of toast
        setBatchCompletedTransactions(savedTransactions);
        setBatchCreditsUsed(creditsUsed);
        setShowBatchCompleteModal(true);
        setView('dashboard');
    };

    // Handle save transaction for batch review (AC #6)
    const handleBatchSaveTransaction = async (transaction: Transaction): Promise<string> => {
        if (!services || !user) throw new Error('Not authenticated');
        const { db, appId } = services;

        // Apply category mappings
        const { transaction: categorizedTx, appliedMappingIds } = applyCategoryMappings(transaction, mappings);

        // Increment mapping usage (fire-and-forget)
        if (appliedMappingIds.length > 0) {
            appliedMappingIds.forEach(mappingId => {
                incrementMappingUsage(db, user.uid, appId, mappingId)
                    .catch(err => console.error('Failed to increment mapping usage:', err));
            });
        }

        // Apply merchant mappings
        let finalTx = categorizedTx;
        const merchantMatch = findMerchantMatch(categorizedTx.merchant);
        if (merchantMatch && merchantMatch.confidence > 0.7) {
            finalTx = {
                ...finalTx,
                alias: merchantMatch.mapping.targetMerchant,
                merchantSource: 'learned' as const
            };
            if (merchantMatch.mapping.id) {
                incrementMerchantMappingUsage(db, user.uid, appId, merchantMatch.mapping.id)
                    .catch(err => console.error('Failed to increment merchant mapping usage:', err));
            }
        }

        // Save transaction
        const transactionId = await firestoreAddTransaction(db, user.uid, appId, finalTx);
        return transactionId;
    };

    // Story 11.1: Remove image from batch
    // Story 14.23: Updated to use TransactionEditorView
    const handleRemoveBatchImage = (index: number) => {
        setBatchImages(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // If only 1 image left, switch to single image flow
            if (updated.length === 1) {
                setShowBatchPreview(false);
                setScanImages(updated);
                // Initialize pending scan for single image
                if (!pendingScan) {
                    setPendingScan(createPendingScan());
                }
                setPendingScan(prev => prev ? { ...prev, images: updated, status: 'images_added' } : null);
                // Story 14.23: Use unified TransactionEditorView
                setTransactionEditorMode('new');
                setScanButtonState('pending'); // Has image but not processed
                navigateToView('transaction-editor');
                return [];
            }
            return updated;
        });
    };

    // Story 14.15: Scan overlay handlers (AC #4)
    // Handle cancel from overlay - return to dashboard
    const handleScanOverlayCancel = useCallback(() => {
        scanOverlay.reset();
        setIsAnalyzing(false);
        setScanError(null);
        setScanImages([]);
        setPendingScan(null);
        setCurrentTransaction(null);
        setView('dashboard');
    }, [scanOverlay]);

    // Handle retry from overlay error state - re-run processScan
    const handleScanOverlayRetry = useCallback(() => {
        scanOverlay.retry();
        setScanError(null);
        // processScan will be called again from EditView
    }, [scanOverlay]);

    // Handle dismiss from overlay ready state
    const handleScanOverlayDismiss = useCallback(() => {
        scanOverlay.reset();
    }, [scanOverlay]);

    // Story 11.2: Quick Save Card handlers (AC #3, #4, #7)
    // Story 14.4: Quick Save completion handler (called after success animation)
    // This is the callback that fires AFTER the success animation completes
    const handleQuickSaveComplete = useCallback(() => {
        // Story 14.4 AC #5: Close card and show Trust Merchant if eligible
        setShowQuickSaveCard(false);
        setQuickSaveTransaction(null);
        setPendingScan(null);
        setView('dashboard');
    }, []);

    const handleQuickSave = async () => {
        if (!services || !user || !quickSaveTransaction || isQuickSaving) return;

        // Story 14.24: Validate transaction has at least one item before saving
        // This is a safety net - shouldShowQuickSave should already prevent this case
        const hasValidItem = quickSaveTransaction.items?.some(
            item => item.name && item.name.trim().length > 0 && typeof item.price === 'number' && item.price >= 0
        );
        if (!hasValidItem) {
            // Redirect to editor instead of saving invalid transaction
            setCurrentTransaction(quickSaveTransaction);
            setShowQuickSaveCard(false);
            setQuickSaveTransaction(null);
            setToastMessage({ text: t('itemsRequired') || 'Add at least one item', type: 'info' });
            navigateToView('transaction-editor');
            return;
        }

        const { db, appId } = services;

        setIsQuickSaving(true);

        const tDoc = {
            ...quickSaveTransaction,
            total: parseStrictNumber(quickSaveTransaction.total)
        };

        try {
            // Story 10.6: Async side-effect pattern for insight generation
            incrementInsightCounter();

            const profile = insightProfile || {
                schemaVersion: 1 as const,
                firstTransactionDate: null as any,
                totalTransactions: 0,
                recentInsights: [],
            };

            const silenced = isInsightsSilenced(insightCache);

            // Save transaction and generate insight
            const transactionId = await firestoreAddTransaction(db, user.uid, appId, tDoc);
            const txWithId = { ...tDoc, id: transactionId } as Transaction;

            const insight = await generateInsightForTransaction(
                txWithId,
                transactions,
                profile,
                insightCache
            );

            // Add to batch session
            addToBatch(txWithId, insight);

            // Story 14.4: DON'T close card here - let success animation play first
            // The QuickSaveCard will call onSaveComplete after animation

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
                    icon: insight.icon,
                    category: insight.category,
                }).catch(err => console.warn('Failed to record insight:', err));
            }

            // Track transaction for profile stats
            const txDate = tDoc.date ? new Date(tDoc.date) : new Date();
            trackTransactionForInsight(txDate)
                .catch(err => console.warn('Failed to track transaction:', err));

            // Story 11.4: Record scan for trust tracking (AC #1, #2)
            // Quick Save = not edited, so wasEdited = false
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
            // On error, close the card immediately
            setShowQuickSaveCard(false);
            setQuickSaveTransaction(null);
        } finally {
            setIsQuickSaving(false);
        }
    };

    // Story 11.2: Handle "Editar" from Quick Save Card (AC #4)
    // Story 14.23: Navigate to TransactionEditorView instead of deprecated scan-result view
    const handleQuickSaveEdit = () => {
        if (quickSaveTransaction) {
            setCurrentTransaction(quickSaveTransaction);
        }
        setShowQuickSaveCard(false);
        setQuickSaveTransaction(null);
        // Story 14.24: Navigate to unified TransactionEditorView
        setTransactionEditorMode('new');
        setScanButtonState('complete'); // Show completed scan state
        setView('transaction-editor');
    };

    // Story 11.2: Handle "Cancelar" from Quick Save Card (AC #7)
    const handleQuickSaveCancel = () => {
        setShowQuickSaveCard(false);
        setQuickSaveTransaction(null);
        setCurrentTransaction(null);
        setPendingScan(null);
        setView('dashboard');
    };

    // Story 11.4: Trust Prompt handlers (AC #4)
    const handleAcceptTrust = async () => {
        if (!trustPromptData?.merchant) return;
        const merchantName = trustPromptData.merchant.merchantName;
        try {
            await acceptTrust(merchantName);
            setToastMessage({ text: t('trustMerchantConfirm'), type: 'success' });
        } catch (err) {
            console.warn('Failed to accept trust:', err);
        } finally {
            setShowTrustPrompt(false);
            setTrustPromptData(null);
        }
    };

    const handleDeclineTrust = async () => {
        if (!trustPromptData?.merchant) return;
        const merchantName = trustPromptData.merchant.merchantName;
        try {
            await declinePrompt(merchantName);
        } catch (err) {
            console.warn('Failed to decline trust:', err);
        } finally {
            setShowTrustPrompt(false);
            setTrustPromptData(null);
        }
    };

    // Story 14.15b: Currency mismatch dialog handlers (AC #2)
    const handleCurrencyUseDetected = () => {
        if (!currencyMismatchData) return;
        // Use detected currency (already in transaction)
        const transaction = currencyMismatchData.pendingTransaction;
        const hasDiscrepancy = currencyMismatchData.hasDiscrepancy;
        setCurrentTransaction(transaction);
        if (pendingScan) {
            setPendingScan({
                ...pendingScan,
                analyzedTransaction: transaction,
                status: 'analyzed'
            });
        }
        setScanImages([]);
        setShowCurrencyMismatch(false);
        setCurrencyMismatchData(null);
        // Story 14.15b: Show warning if items total didn't match receipt total
        if (hasDiscrepancy) {
            setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
        }
    };

    const handleCurrencyUseDefault = () => {
        if (!currencyMismatchData) return;
        // Override with user's default currency
        const transaction = {
            ...currencyMismatchData.pendingTransaction,
            currency: userPreferences.defaultCurrency,
        };
        const hasDiscrepancy = currencyMismatchData.hasDiscrepancy;
        setCurrentTransaction(transaction);
        if (pendingScan) {
            setPendingScan({
                ...pendingScan,
                analyzedTransaction: transaction,
                status: 'analyzed'
            });
        }
        setScanImages([]);
        setShowCurrencyMismatch(false);
        setCurrencyMismatchData(null);
        // Story 14.15b: Show warning if items total didn't match receipt total
        if (hasDiscrepancy) {
            setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
        }
    };

    const handleCurrencyMismatchCancel = () => {
        // Cancel scan entirely
        setShowCurrencyMismatch(false);
        setCurrencyMismatchData(null);
        setCurrentTransaction(null);
        setPendingScan(null);
        setView('dashboard');
    };

    // Total mismatch dialog handlers (for OCR errors like missing digits)
    const handleTotalUseItemsSum = () => {
        if (!totalMismatchData) return;
        const { validationResult, pendingTransaction, parsedItems } = totalMismatchData;

        // Use items sum as the new total (no reconciliation needed since they match)
        const correctedTransaction: Transaction = {
            ...pendingTransaction,
            total: validationResult.itemsSum,
            items: parsedItems, // Use original items without adjustment
        };

        // Continue with the rest of the scan flow
        continueScanWithTransaction(correctedTransaction);
        setShowTotalMismatch(false);
        setTotalMismatchData(null);
        setToastMessage({ text: t('totalCorrected') || 'Total corregido', type: 'success' });
    };

    const handleTotalKeepOriginal = () => {
        if (!totalMismatchData) return;
        const { pendingTransaction, parsedItems } = totalMismatchData;

        // Keep original total, reconcile items to match
        const { items: reconciledItems } = reconcileItemsTotal(
            parsedItems,
            pendingTransaction.total,
            lang
        );

        const transaction: Transaction = {
            ...pendingTransaction,
            items: reconciledItems,
        };

        continueScanWithTransaction(transaction);
        setShowTotalMismatch(false);
        setTotalMismatchData(null);
    };

    const handleTotalMismatchCancel = () => {
        // Cancel scan entirely
        setShowTotalMismatch(false);
        setTotalMismatchData(null);
        setCurrentTransaction(null);
        setPendingScan(null);
        setView('dashboard');
    };

    // Story 14.24: Conflict dialog handlers
    const handleConflictClose = () => {
        // Close dialog without doing anything (stay on current view)
        setShowConflictDialog(false);
        setConflictDialogData(null);
    };

    const handleConflictViewCurrent = () => {
        // Navigate to the conflicting transaction (in transaction-editor)
        setShowConflictDialog(false);
        setConflictDialogData(null);
        // The pending scan is still active, just navigate to it
        if (pendingScan?.analyzedTransaction) {
            setCurrentTransaction(pendingScan.analyzedTransaction);
        }
        setTransactionEditorMode('new');
        setScanButtonState(pendingScan?.status === 'analyzed' ? 'complete' : 'pending');
        navigateToView('transaction-editor');
    };

    const handleConflictDiscard = () => {
        // Discard the conflicting transaction and proceed with the pending action
        setShowConflictDialog(false);

        // Clear the conflicting pending scan
        setPendingScan(null);
        setCurrentTransaction(null);
        setScanButtonState('idle');
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
            setScanButtonState(mode === 'new' ? 'idle' : (transaction?.thumbnailUrl ? 'complete' : 'idle'));
            if (transaction) {
                setCurrentTransaction(transaction as any);
            } else if (mode === 'new') {
                setCurrentTransaction({
                    merchant: '',
                    date: getSafeDate(null),
                    total: 0,
                    category: 'Supermarket',
                    items: [],
                    country: defaultCountry,
                    city: defaultCity,
                    currency: userPreferences.defaultCurrency || 'CLP',
                });
            }
            navigateToView('transaction-editor');
        } else {
            setConflictDialogData(null);
        }
    };

    // Helper: Continue scan flow with a transaction (after total mismatch resolution)
    const continueScanWithTransaction = async (transaction: Transaction) => {
        // Apply category mappings
        const { transaction: categorizedTransaction, appliedMappingIds } =
            applyCategoryMappings(transaction, mappings);

        // Increment mapping usage (fire-and-forget)
        if (appliedMappingIds.length > 0 && user && services) {
            appliedMappingIds.forEach(mappingId => {
                incrementMappingUsage(services.db, user.uid, services.appId, mappingId)
                    .catch(err => console.error('Failed to increment mapping usage:', err));
            });
        }

        // Apply merchant alias mapping
        let finalTransaction = categorizedTransaction;
        const merchantMatch = findMerchantMatch(categorizedTransaction.merchant);
        if (merchantMatch && merchantMatch.confidence > 0.7) {
            finalTransaction = {
                ...finalTransaction,
                alias: merchantMatch.mapping.targetMerchant,
                merchantSource: 'learned' as const
            };
            if (merchantMatch.mapping.id && user && services) {
                incrementMerchantMappingUsage(services.db, user.uid, services.appId, merchantMatch.mapping.id)
                    .catch(err => console.error('Failed to increment merchant mapping usage:', err));
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
            setCurrencyMismatchData({
                detectedCurrency,
                pendingTransaction: finalTransaction,
                hasDiscrepancy: false,
            });
            setShowCurrencyMismatch(true);
            return;
        }

        // Set as current transaction and continue
        setCurrentTransaction(finalTransaction);
        if (pendingScan) {
            setPendingScan({
                ...pendingScan,
                analyzedTransaction: finalTransaction,
                status: 'analyzed'
            });
        }
        setScanButtonState('complete');
        setScanImages([]);
    };

    // Transaction Handlers
    // Note: We use fire-and-forget pattern because Firestore's offline persistence
    // means addDoc/updateDoc/deleteDoc may not resolve until server confirms,
    // but local cache updates immediately. Navigate optimistically.
    // Story 14.15b: Accept optional transaction parameter to avoid React state timing issues
    const saveTransaction = async (transactionOverride?: Transaction) => {
        const transactionToSave = transactionOverride || currentTransaction;
        if (!services || !user || !transactionToSave) return;
        const { db, appId } = services;

        const tDoc = {
            ...transactionToSave,
            total: parseStrictNumber(transactionToSave.total)
        };

        // Navigate immediately (optimistic UI) - AC #4: Card appears AFTER save confirmation
        setView('dashboard');
        setCurrentTransaction(null);
        // Story 9.10 AC#4: Clear pending scan on successful save
        setPendingScan(null);

        // Fire the Firestore operation and chain insight generation for new transactions
        if (transactionToSave.id) {
            // Update existing transaction - no insight generation
            firestoreUpdateTransaction(db, user.uid, appId, transactionToSave.id, tDoc)
                .catch(e => console.error('Update failed:', e));
        } else {
            // Story 10.6: Async side-effect pattern for insight generation (AC #2)
            // Story 10.7: Extended for batch mode tracking and silence support
            // Story 10a.4: Chain operations to capture real transaction ID for insight history

            // Increment scan counter for sprinkle distribution
            incrementInsightCounter();

            // Get profile or use default if not loaded yet
            const profile = insightProfile || {
                schemaVersion: 1 as const,
                firstTransactionDate: null as any,
                totalTransactions: 0,
                recentInsights: [],
            };

            // Story 10.7 AC#7: Check if insights are silenced
            const silenced = isInsightsSilenced(insightCache);

            // Fire and forget chain: add transaction → generate insight → record with real ID
            firestoreAddTransaction(db, user.uid, appId, tDoc)
                .then(async (transactionId) => {
                    // Generate insight with real transaction ID
                    const txWithId = { ...tDoc, id: transactionId } as Transaction;
                    const insight = await generateInsightForTransaction(
                        txWithId,
                        transactions,
                        profile,
                        insightCache
                    );

                    // Story 10.7: Add transaction and insight to batch session
                    addToBatch(txWithId, insight);

                    // Story 10.7 AC#7: If silenced, skip showing individual insight
                    if (silenced) {
                        // Still track transaction for stats but don't show card
                        const txDate = tDoc.date ? new Date(tDoc.date) : new Date();
                        trackTransactionForInsight(txDate)
                            .catch(err => console.warn('Failed to track transaction:', err));
                        return;
                    }

                    // Story 10.7 AC#1: Show batch summary when 3+ receipts (after adding current)
                    // Check updated batch session (addToBatch is async state update, so check count + 1)
                    const willBeBatchMode = (batchSession?.receipts.length ?? 0) + 1 >= 3;
                    if (willBeBatchMode) {
                        setShowBatchSummary(true);
                        // Don't show individual insight card in batch mode
                    } else {
                        // Standard insight card flow
                        setCurrentInsight(insight);
                        setShowInsightCard(true);
                    }

                    // AC #9: Record insight shown in UserInsightProfile (if not fallback)
                    // Story 10a.4: Pass real transaction ID and full insight content for history
                    if (insight && insight.id !== 'building_profile') {
                        recordInsightShown(insight.id, transactionId, {
                            title: insight.title,
                            message: insight.message,
                            icon: insight.icon,
                            category: insight.category,
                        }).catch(err => console.warn('Failed to record insight:', err));
                    }

                    // Track transaction for profile stats (fire-and-forget)
                    const txDate = tDoc.date ? new Date(tDoc.date) : new Date();
                    trackTransactionForInsight(txDate)
                        .catch(err => console.warn('Failed to track transaction:', err));
                })
                .catch(err => {
                    console.warn('Transaction save or insight generation failed:', err);
                    // Story 10.7: Still add to batch even if insight generation failed
                    const txWithTemp = { ...tDoc, id: 'temp' } as Transaction;
                    addToBatch(txWithTemp, null);

                    // Story 10.7: Show batch summary if in batch mode, otherwise fallback card
                    if (!silenced) {
                        const willBeBatchMode = (batchSession?.receipts.length ?? 0) + 1 >= 3;
                        if (willBeBatchMode) {
                            setShowBatchSummary(true);
                        } else {
                            // Show fallback on error - never show nothing (AC #3)
                            setCurrentInsight(null);
                            setShowInsightCard(true);
                        }
                    }
                });
        }
    };

    // Story 14.24: Removed window.confirm - caller shows styled confirmation dialog
    const deleteTransaction = async (id: string) => {
        if (!services || !user) return;

        // Fire the delete (don't await)
        firestoreDeleteTransaction(services.db, user.uid, services.appId, id)
            .catch(e => console.error('Delete failed:', e));

        // Navigate immediately
        setView('dashboard');
    };

    const wipeDB = async () => {
        if (!window.confirm(t('wipeConfirm'))) return;
        if (!services || !user) return;
        setWiping(true);
        try {
            await wipeAllTransactions(services.db, user.uid, services.appId);
            alert(t('cleaned'));
        } catch (e) {
            alert('Failed to wipe');
        }
        setWiping(false);
    };

    // Export Data Handler (Story 5.2)
    const handleExportData = async () => {
        // AC#7: Empty state handling - check if no transactions
        if (transactions.length === 0) {
            setToastMessage({ text: t('noTransactionsToExport'), type: 'info' });
            return;
        }

        setExporting(true);
        try {
            // AC#4: Use requestAnimationFrame for non-blocking UI
            await new Promise(resolve => requestAnimationFrame(resolve));
            // AC#8: Use downloadBasicData from csvExport.ts (Story 5.1)
            downloadBasicData(transactions);
            // AC#6: Success feedback
            setToastMessage({ text: t('exportSuccess'), type: 'success' });
        } finally {
            setExporting(false);
        }
    };

    // Story 9.20: Handler for navigating from Analytics to History with pre-applied filters (AC #4)
    // Story 14.22: Navigate to History view with pre-applied filters
    // This is called when user clicks a transaction count badge on analytics views
    const handleNavigateToHistory = useCallback((payload: HistoryNavigationPayload) => {
        // Create a complete filter state from the navigation payload
        // Default to 'all' level if temporal/category not provided

        // Build category filter based on what's in the payload
        // Priority: category > storeGroup > itemGroup > itemCategory
        let categoryFilter: HistoryFilterState['category'] = { level: 'all' };
        if (payload.category) {
            // Store category filter (e.g., "Supermarket")
            categoryFilter = { level: 'category', category: payload.category };
        } else if (payload.storeGroup) {
            // Store group filter (e.g., "food-dining") - expand to all categories in the group
            const storeCategories = expandStoreCategoryGroup(payload.storeGroup as StoreCategoryGroup);
            categoryFilter = { level: 'category', category: storeCategories.join(',') };
        } else if (payload.itemGroup) {
            // Item group filter (e.g., "food-fresh") - expand to all item categories in the group
            const itemCategories = expandItemCategoryGroup(payload.itemGroup as ItemCategoryGroup);
            categoryFilter = { level: 'group', group: itemCategories.join(',') };
        } else if (payload.itemCategory) {
            // Item category filter (e.g., "Bakery") - filter by item.category field directly
            categoryFilter = { level: 'group', group: payload.itemCategory };
        }

        const filterState: HistoryFilterState = {
            temporal: payload.temporal
                ? { ...payload.temporal, level: payload.temporal.level as TemporalFilterState['level'] }
                : { level: 'all' },
            category: categoryFilter,
            location: {}, // Location filter not set from analytics navigation
            group: {}, // Story 14.15b: Group filter not set from analytics navigation
        };

        // Store the filters to be applied when History view loads
        setPendingHistoryFilters(filterState);

        // Navigate to History view using navigateToView to track previous view for back navigation
        navigateToView('history');
    }, [navigateToView]);

    // Story 7.12: Theme setup using CSS custom properties (AC #6, #7, #11)
    // Story 7.17: Renamed themes - 'normal' (warm), 'professional' (cool)
    // Story 14.12: Added 'mono' (monochrome) as new default
    // The 'dark' class activates CSS variable overrides defined in index.html
    // The data-theme attribute activates color theme variations
    const isDark = theme === 'dark';
    const themeClass = isDark ? 'dark' : '';
    // 'normal' is base CSS, 'professional' and 'mono' are overrides
    const dataTheme = colorTheme !== 'normal' ? colorTheme : undefined;

    // Story 12.3: Compute scan status for Nav icon indicator (AC #3)
    // - 'processing': batch or single scan processing is in progress
    // - 'ready': batch review results are available
    // - 'idle': default state
    // Note: Also includes single scan 'analyzing' state for consistent UX
    const scanStatus: ScanStatus = batchProcessing.isProcessing
        ? 'processing'
        : pendingScan?.status === 'analyzing'
            ? 'processing'
            : batchReviewResults.length > 0
                ? 'ready'
                : 'idle';

    // Synchronously update document.documentElement during render
    // This ensures CSS variables are available before children read them
    // Note: This is intentionally NOT in useEffect to avoid timing issues with useMemo
    if (typeof document !== 'undefined') {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        // 'normal' theme (warm colors) is base CSS, 'professional' and 'mono' are overrides
        if (colorTheme !== 'normal') {
            html.setAttribute('data-theme', colorTheme);
        } else {
            html.removeAttribute('data-theme');
        }
        // Story 14.22: Font family selection - 'outfit' is default in CSS
        html.setAttribute('data-font', fontFamily);
    }

    if (initError) {
        return <div className="p-10 text-center text-red-500 font-bold">Error: {initError}</div>;
    }

    if (!user) {
        return <LoginScreen onSignIn={signIn} onTestSignIn={() => signInWithTestCredentials()} t={t} />;
    }

    // Story 10a.4: History pagination removed - HistoryView replaced with InsightsView

    // Story 9.11: Compute recently added transactions for dashboard
    // Sort by createdAt (descending) to show last 5 ADDED transactions
    // This is different from transactions (sorted by date) - shows recency of entry
    const recentlyAddedTransactions = [...transactions]
        .sort((a, b) => {
            // Handle createdAt as Firestore Timestamp or Date
            const getTime = (tx: Transaction): number => {
                if (!tx.createdAt) return 0;
                // Firestore Timestamp has toDate() method
                if (typeof tx.createdAt.toDate === 'function') {
                    return tx.createdAt.toDate().getTime();
                }
                // Fallback to Date parsing
                return new Date(tx.createdAt).getTime();
            };
            return getTime(b) - getTime(a);
        })
        .slice(0, 5);

    return (
        // Story 11.6: Use dvh (dynamic viewport height) for proper PWA sizing (AC #1, #2)
        // h-screen provides fallback for Safari < 15.4 and older browsers without dvh support
        <div
            className={`h-screen h-[100dvh] max-w-md mx-auto shadow-xl border-x flex flex-col overflow-hidden ${themeClass}`}
            data-theme={dataTheme}
            style={{
                backgroundColor: 'var(--bg)',
                color: 'var(--primary)',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
            }}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
            />

            {/* Story 14.10: Top Header Bar (AC #1-5) */}
            {/* Story 14.13: Hide TopHeader on TrendsView - Explora has its own header */}
            {/* Story 14.14: Hide TopHeader on HistoryView - has its own header */}
            {/* Story 14.16: Hide TopHeader on ReportsView - has its own header with year selector */}
            {/* Determine header variant and title based on current view */}
            {/* Story 14.15: scan-result has its own header, so exclude it */}
            {/* Story 14.15b: edit view has its own header with credits display */}
            {/* Story 14.23: transaction-editor has its own header */}
            {view !== 'trends' && view !== 'history' && view !== 'reports' && view !== 'scan-result' && view !== 'edit' && view !== 'transaction-editor' && (
                <TopHeader
                    variant={
                        view === 'settings' ? 'settings' :
                        view === 'batch-review' ? 'detail' :
                        'home'
                    }
                    viewTitle={
                        view === 'dashboard' ? 'gastify' :
                        view === 'insights' ? 'insights' :
                        view === 'alerts' ? 'alerts' :
                        view === 'batch-capture' ? 'gastify' :
                        undefined
                    }
                    title={
                        view === 'batch-review' ? t('batchReview') :
                        undefined
                    }
                    settingsSubview={
                        view === 'settings' && settingsSubview !== 'main'
                            ? t(`settings${settingsSubview.charAt(0).toUpperCase() + settingsSubview.slice(1)}Short`)
                            : undefined
                    }
                    onBack={
                        view === 'settings' ? () => {
                            if (settingsSubview !== 'main') {
                                setSettingsSubview('main');
                            } else {
                                setView('dashboard');
                            }
                        } :
                        view === 'batch-review' ? handleBatchReviewBack :
                        undefined
                    }
                    onMenuClick={() => setView('settings')}
                    onNavigateToView={(targetView) => setView(targetView as any)}
                    userName={user?.displayName || ''}
                    userEmail={user?.email || ''}
                    theme={theme}
                    t={t}
                />
            )}

            {/* Story 11.6: Main content area with flex-1 and overflow (AC #2, #4, #5) */}
            {/* Story 14.10: Added pt-12 (48px) to account for fixed header (AC #5) */}
            {/* Story 14.12: Increased top padding for larger header (72px) + gap for mobile visibility */}
            {/* Story 14.14b: TrendsView now has its own sticky header like HistoryView, so no padding needed */}
            {/* Story 14.14: HistoryView has its own sticky header, so no top padding needed */}
            {/* Story 14.16: ReportsView has its own fixed header and padding, so no main padding needed */}
            {/* Story 14.15: ScanResultView has its own header, so no padding needed */}
            {/* Story 14.15b: EditView now has its own header matching ScanResultView */}
            {/* pb-24 (96px) accounts for nav bar (~70px) + safe area bottom */}
            {/* Story 14.22: Added ref for scroll position management */}
            <main
                ref={mainRef}
                className={`flex-1 overflow-y-auto ${(view === 'reports' || view === 'history' || view === 'trends' || view === 'scan-result' || view === 'edit' || view === 'transaction-editor') ? '' : 'p-3'}`}
                style={{
                    paddingBottom: (view === 'reports' || view === 'history' || view === 'trends' || view === 'scan-result' || view === 'edit' || view === 'transaction-editor') ? '0' : 'calc(6rem + var(--safe-bottom, 0px))',
                    paddingTop: (view === 'history' || view === 'reports' || view === 'trends' || view === 'scan-result' || view === 'edit' || view === 'transaction-editor')
                        ? '0'
                        : 'calc(5rem + env(safe-area-inset-top, 0px))'
                }}
            >
                {/* Story 10a.1: Wrap DashboardView with HistoryFiltersProvider for filter context (AC #2, #6) */}
                {view === 'dashboard' && (
                    <HistoryFiltersProvider>
                        <DashboardView
                            transactions={recentlyAddedTransactions as any}
                            t={t}
                            currency={currency}
                            dateFormat={dateFormat}
                            theme={theme}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate as any}
                            getSafeDate={getSafeDate}
                            onCreateNew={() => handleNewTransaction(false)}
                            onViewTrends={(month: string | null) => {
                                // Story 10a.2: Build initial analytics state when month is provided (AC #1, #2)
                                if (month) {
                                    // month format is "YYYY-MM" (e.g., "2024-12")
                                    const year = month.substring(0, 4);
                                    const quarter = getQuarterFromMonth(month);
                                    setAnalyticsInitialState({
                                        temporal: {
                                            level: 'month',
                                            year,
                                            quarter,
                                            month,
                                        },
                                        category: { level: 'all' },
                                        chartMode: 'aggregation',
                                        drillDownMode: 'temporal',
                                    });
                                } else {
                                    // Total Spent - default to year view
                                    setAnalyticsInitialState(null);
                                }
                                setView('trends');
                            }}
                            onEditTransaction={(transaction: any) => {
                                // Story 14.23: Use unified TransactionEditorView for existing transactions
                                navigateToTransactionEditor('existing', transaction);
                            }}
                            onTriggerScan={triggerScan}
                            // Story 10a.1: Pass all transactions for full paginated list (AC #3)
                            allTransactions={transactions as any}
                            // Story 9.12: Language for category translations
                            lang={lang}
                            // Story 14.14: Color theme for unified TransactionCard display
                            colorTheme={colorTheme}
                            // Story 14.15b: Selection mode props for group/delete operations
                            userId={user?.uid}
                            appId={services?.appId}
                        />
                    </HistoryFiltersProvider>
                )}

                {/* Story 9.9: ScanView is deprecated - scan functionality is now in EditView
                {view === 'scan' && (
                    <ScanView
                        scanImages={scanImages}
                        isAnalyzing={isAnalyzing}
                        scanError={scanError}
                        theme={theme}
                        t={t}
                        onBack={() => setView('dashboard')}
                        onAddPhoto={() => fileInputRef.current?.click()}
                        onProcessScan={processScan}
                    />
                )}
                */}

                {/* Story 14.23: DEPRECATED - ScanResultView replaced by TransactionEditorView
                 * This rendering block is commented out as part of the migration.
                 * All new transaction flows now use TransactionEditorView.
                 * Remove this commented block after verifying TransactionEditorView works correctly.
                {view === 'scan-result' && (
                    <ScanResultView ... />
                )}
                */}

                {/* Story 14.23: DEPRECATED - EditView replaced by TransactionEditorView
                 * This rendering block is commented out as part of the migration.
                 * All edit transaction flows now use TransactionEditorView.
                 * Remove this commented block after verifying TransactionEditorView works correctly.
                {view === 'edit' && currentTransaction && (
                    <EditView ... />
                )}
                */}

                {/* Story 14.23: TransactionEditorView - Unified transaction editor */}
                {view === 'transaction-editor' && (
                    <TransactionEditorView
                        transaction={currentTransaction}
                        mode={transactionEditorMode}
                        // Story 14.24: Read-only mode for viewing transactions from History
                        readOnly={isViewingReadOnly}
                        onRequestEdit={handleRequestEditFromReadOnly}
                        scanButtonState={scanButtonState}
                        isProcessing={isAnalyzing}
                        processingEta={null}
                        scanError={scanError}
                        thumbnailUrl={currentTransaction?.thumbnailUrl || (scanButtonState === 'complete' && scanImages.length > 0 ? scanImages[0] : undefined)}
                        pendingImageUrl={scanButtonState === 'pending' && scanImages.length > 0 ? scanImages[0] : undefined}
                        onUpdateTransaction={(trans) => {
                            // Story 14.24: Update both currentTransaction and pendingScan for persistence
                            setCurrentTransaction(trans as any);
                            // Sync to pendingScan so changes persist across navigation
                            if (pendingScan && transactionEditorMode === 'new') {
                                setPendingScan({
                                    ...pendingScan,
                                    analyzedTransaction: trans as any,
                                });
                            }
                        }}
                        onSave={async (trans) => {
                            await saveTransaction(trans);
                            // Story 14.24: Reset all scan state after successful save
                            setScanButtonState('idle');
                            setScanImages([]);
                            setScanError(null);
                            setPendingScan(null);
                            setCurrentTransaction(null);
                            setIsViewingReadOnly(false);
                            setCreditUsedInSession(false);
                        }}
                        onCancel={() => {
                            // Story 14.23: Reset scan state and navigate back
                            // Story 14.24: Clear pendingScan on explicit discard, reset read-only mode
                            setScanButtonState('idle');
                            setScanImages([]);
                            setScanError(null);
                            setPendingScan(null);
                            setCurrentTransaction(null);
                            setAnimateEditViewItems(false);
                            setIsViewingReadOnly(false);
                            setCreditUsedInSession(false);
                            if (batchEditingReceipt) {
                                setBatchEditingReceipt(null);
                                setView('batch-review');
                            } else {
                                navigateBack();
                            }
                        }}
                        onPhotoSelect={(file) => {
                            // Convert file to base64 and update scan state
                            const reader = new FileReader();
                            reader.onload = () => {
                                const base64 = reader.result as string;
                                setScanImages([base64]);
                                setScanButtonState('pending');
                                // Story 14.24: Sync to pendingScan for persistence across navigation
                                if (pendingScan) {
                                    setPendingScan({
                                        ...pendingScan,
                                        images: [base64],
                                        status: 'images_added',
                                    });
                                }
                            };
                            reader.readAsDataURL(file);
                        }}
                        onProcessScan={() => {
                            // Transition to scanning state and process
                            setScanButtonState('scanning');
                            processScan();
                        }}
                        onRetry={() => {
                            // Clear error and retry
                            setScanError(null);
                            setScanButtonState('scanning');
                            processScan();
                        }}
                        onRescan={transactionEditorMode === 'existing' ? async () => {
                            // Re-scan existing transaction
                            setScanButtonState('scanning');
                            await handleRescan();
                        } : undefined}
                        isRescanning={isRescanning}
                        onDelete={transactionEditorMode === 'existing' ? deleteTransaction : undefined}
                        onSaveMapping={saveMapping}
                        onSaveMerchantMapping={saveMerchantMapping}
                        onSaveSubcategoryMapping={saveSubcategoryMapping}
                        onShowToast={(text) => setToastMessage({ text, type: 'success' })}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        formatCurrency={formatCurrency}
                        currency={currency}
                        lang={lang}
                        credits={userCredits}
                        storeCategories={STORE_CATEGORIES as unknown as string[]}
                        distinctAliases={distinctAliases}
                        batchContext={batchEditingReceipt ? { index: batchEditingReceipt.index, total: batchEditingReceipt.total } : null}
                        defaultCity={defaultCity}
                        defaultCountry={defaultCountry}
                        onCreditInfoClick={() => setShowCreditInfoModal(true)}
                        isSaving={false}
                        animateItems={animateEditViewItems}
                        // Story 14.24: Only show credit warning if a credit was actually used in this session
                        // (not just because an existing transaction has a thumbnail)
                        creditUsed={creditUsedInSession}
                    />
                )}

                {view === 'trends' && (
                    // Story 10a.2: Pass initial state to navigate to specific month (AC #1, #2)
                    // Key forces remount when initial state changes to apply new initial value
                    // Story 14.14b: Wrap with HistoryFiltersProvider for IconFilterBar support
                    <HistoryFiltersProvider>
                        <AnalyticsProvider
                            key={analyticsInitialState ? JSON.stringify(analyticsInitialState.temporal) : 'default'}
                            initialState={analyticsInitialState ?? undefined}
                        >
                            <TrendsView
                                transactions={transactions}
                                theme={theme as 'light' | 'dark'}
                                colorTheme={colorTheme}
                                currency={currency}
                                locale={lang}
                                t={t}
                                onEditTransaction={(transaction) => {
                                    // Story 14.23: Use unified TransactionEditorView for existing transactions
                                    navigateToTransactionEditor('existing', transaction);
                                }}
                                exporting={exporting}
                                onExporting={setExporting}
                                onUpgradeRequired={() => {
                                    setToastMessage({ text: t('upgradeRequired'), type: 'info' });
                                }}
                                // Story 9.20: Navigation from analytics badge to filtered History (AC #3)
                                onNavigateToHistory={handleNavigateToHistory}
                                // Story 14.14b: Header consistency props
                                onBack={() => setView('dashboard')}
                                userName={user?.displayName || ''}
                                userEmail={user?.email || ''}
                                onNavigateToView={(viewName) => {
                                    if (viewName === 'settings') {
                                        setView('settings');
                                    } else if (viewName === 'history') {
                                        setView('history');
                                    } else if (viewName === 'reports') {
                                        setView('reports');
                                    }
                                }}
                                // Story 14.14b: Groups support for IconFilterBar
                                userId={user?.uid || ''}
                                appId={services?.appId || ''}
                            />
                        </AnalyticsProvider>
                    </HistoryFiltersProvider>
                )}

                {/* Story 10a.4: InsightsView - Insight History (AC #1-6) */}
                {view === 'insights' && (
                    <InsightsView
                        onBack={() => setView('dashboard')}
                        onEditTransaction={(transactionId: string) => {
                            // AC4: Navigate to transaction by finding it in the list
                            // Story 14.23: Use unified TransactionEditorView for existing transactions
                            const tx = transactions.find(t => t.id === transactionId);
                            if (tx) {
                                navigateToTransactionEditor('existing', tx);
                            }
                        }}
                        theme={theme}
                        t={t}
                    />
                )}

                {/* Story 12.1: Batch Capture UI - dedicated batch mode view (AC #1-9) */}
                {view === 'batch-capture' && (
                    <BatchCaptureView
                        isBatchMode={isBatchCaptureMode}
                        onToggleMode={(batchMode) => {
                            setIsBatchCaptureMode(batchMode);
                            if (!batchMode) {
                                // Switch to individual mode - go to edit view
                                handleNewTransaction(false);
                            }
                        }}
                        onProcessBatch={(images) => {
                            // Set batch images and show batch preview (reuse existing 11.1 flow)
                            setBatchImages(images);
                            setShowBatchPreview(true);
                            setView('dashboard');
                        }}
                        onSwitchToIndividual={() => {
                            setIsBatchCaptureMode(false);
                            handleNewTransaction(false);
                        }}
                        onBack={() => {
                            setIsBatchCaptureMode(false);
                            setView('dashboard');
                        }}
                        isProcessing={isBatchProcessing}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                    />
                )}

                {/* Story 12.3: Batch Review Queue - review processed receipts before saving (AC #1-8) */}
                {/* Also shows processing progress when navigating back during batch processing */}
                {view === 'batch-review' && (
                    <BatchReviewView
                        processingResults={batchReviewResults}
                        imageDataUrls={batchImages}
                        theme={theme as 'light' | 'dark'}
                        currency={currency}
                        t={t}
                        onEditReceipt={handleBatchEditReceipt}
                        onBack={handleBatchReviewBack}
                        onSaveComplete={handleBatchSaveComplete}
                        saveTransaction={handleBatchSaveTransaction}
                        // Story 12.3: Pass processing state for inline progress display
                        processingState={batchProcessing.isProcessing ? {
                            isProcessing: true,
                            progress: batchProcessing.progress,
                            states: batchProcessing.states,
                            onCancelProcessing: batchProcessing.cancel,
                        } : undefined}
                    />
                )}

                {view === 'settings' && (
                    <SettingsView
                        lang={lang}
                        currency={currency}
                        theme={theme}
                        dateFormat={dateFormat}
                        wiping={wiping}
                        exporting={exporting}
                        t={t}
                        onSetLang={(l: string) => setLang(l as Language)}
                        onSetCurrency={(c: string) => setCurrency(c as Currency)}
                        onSetTheme={(th: string) => setTheme(th as Theme)}
                        onSetDateFormat={(f: string) => setDateFormat(f as 'LatAm' | 'US')}
                        onExportAll={handleExportData}
                        onWipeDB={wipeDB}
                        onSignOut={signOut}
                        // Story 6.5: Category mappings management
                        // Story 9.7 enhancement: Edit functionality added
                        mappings={mappings}
                        mappingsLoading={mappingsLoading}
                        onDeleteMapping={deleteMapping}
                        onEditMapping={(id, cat) => updateCategoryMapping(id, cat as StoreCategory)}
                        // Story 7.12 AC#11: Color theme selector
                        colorTheme={colorTheme}
                        onSetColorTheme={(ct: string) => setColorTheme(ct as ColorTheme)}
                        // Story 14.21: Font color mode setting
                        fontColorMode={fontColorMode}
                        onSetFontColorMode={(mode: string) => setFontColorMode(mode as FontColorMode)}
                        // Story 14.22: Font family setting (persisted to Firestore)
                        fontFamily={fontFamily}
                        onSetFontFamily={(ff: string) => setFontFamilyPref(ff as 'outfit' | 'space')}
                        // Story 9.3: Default location settings
                        // Story 14.22: Now using Firestore-backed preferences
                        defaultCountry={defaultCountry}
                        defaultCity={defaultCity}
                        onSetDefaultCountry={setDefaultCountryPref}
                        onSetDefaultCity={setDefaultCityPref}
                        // Story 9.7: Merchant mappings management
                        merchantMappings={merchantMappings}
                        merchantMappingsLoading={merchantMappingsLoading}
                        onDeleteMerchantMapping={deleteMerchantMapping}
                        onEditMerchantMapping={updateMerchantMapping}
                        // Story 9.8: Default scan currency setting
                        defaultScanCurrency={userPreferences.defaultCurrency}
                        onSetDefaultScanCurrency={setDefaultScanCurrencyPref}
                        // Story 9.15: Subcategory mappings management
                        subcategoryMappings={subcategoryMappings}
                        subcategoryMappingsLoading={subcategoryMappingsLoading}
                        onDeleteSubcategoryMapping={deleteSubcategoryMapping}
                        onUpdateSubcategoryMapping={updateSubcategoryMapping}
                        // Story 9.18: Push notifications settings
                        db={services?.db || null}
                        userId={user?.uid || null}
                        appId={services?.appId || null}
                        onShowToast={(text: string) => setToastMessage({ text, type: 'success' })}
                        // Story 11.4: Trusted merchants management (AC #6, #7)
                        trustedMerchants={trustedMerchants}
                        trustedMerchantsLoading={trustedMerchantsLoading}
                        onRevokeTrust={removeTrust}
                        // Story 14.22: Clear all learned data action
                        onClearAllLearnedData={async () => {
                            // Delete all learned mappings in parallel
                            const deletePromises: Promise<void>[] = [];

                            // Delete all category mappings
                            for (const mapping of mappings) {
                                if (mapping.id) {
                                    deletePromises.push(deleteMapping(mapping.id));
                                }
                            }

                            // Delete all merchant mappings
                            for (const mapping of merchantMappings) {
                                if (mapping.id) {
                                    deletePromises.push(deleteMerchantMapping(mapping.id));
                                }
                            }

                            // Delete all subcategory mappings
                            for (const mapping of subcategoryMappings) {
                                if (mapping.id) {
                                    deletePromises.push(deleteSubcategoryMapping(mapping.id));
                                }
                            }

                            // Revoke all trusted merchants
                            for (const merchant of trustedMerchants) {
                                deletePromises.push(removeTrust(merchant.merchantName));
                            }

                            await Promise.all(deletePromises);
                            setToastMessage({ text: t('clearAllLearnedDataSuccess') || 'All learned data cleared', type: 'success' });
                        }}
                        // Story 14.22: Profile editing (from Firestore preferences)
                        userEmail={user?.email || ''}
                        displayName={userPreferences.displayName || user?.displayName || ''}
                        phoneNumber={userPreferences.phoneNumber || ''}
                        birthDate={userPreferences.birthDate || ''}
                        onSetDisplayName={_setDisplayNamePref}
                        onSetPhoneNumber={_setPhoneNumberPref}
                        onSetBirthDate={_setBirthDatePref}
                        // Story 14.22: Subscription info (MVP placeholder)
                        plan="freemium"
                        creditsRemaining={userCredits.remaining}
                        superCreditsRemaining={userCredits.superRemaining}
                        // Story 14.22: Controlled subview state for breadcrumb
                        currentSubview={settingsSubview}
                        onSubviewChange={setSettingsSubview}
                    />
                )}

                {/* Story 14.11: Alerts View - placeholder for future alerts/notifications feature */}
                {view === 'alerts' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'var(--bg-tertiary, #f1f5f9)' }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: 'var(--text-secondary, #64748b)' }}
                            >
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <h2
                            className="text-lg font-semibold mb-2"
                            style={{ color: 'var(--text-primary, #0f172a)' }}
                        >
                            {t('alerts')}
                        </h2>
                        <p
                            className="text-sm"
                            style={{ color: 'var(--text-secondary, #64748b)' }}
                        >
                            {t('comingSoon')}
                        </p>
                    </div>
                )}

                {/* Story 14.14: Transaction History View (accessible via profile menu) */}
                {/* Story 14.21: Added colorTheme prop for unified category colors */}
                {/* Story 14.27: Uses paginatedTransactions with loadMore for infinite scroll */}
                {view === 'history' && (
                    <HistoryFiltersProvider initialState={pendingHistoryFilters || undefined}>
                        <HistoryView
                            historyTrans={paginatedTransactions as any}
                            historyPage={1}
                            totalHistoryPages={1}
                            theme={theme}
                            colorTheme={colorTheme}
                            currency={currency}
                            dateFormat={dateFormat}
                            t={t}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate as any}
                            onBack={navigateBack}
                            onSetHistoryPage={() => {}}
                            onEditTransaction={(tx) => {
                                // Story 14.24: Navigate to read-only detail view first
                                // User clicks "Edit" button in detail view to enter edit mode (with conflict check)
                                navigateToTransactionDetail(tx as Transaction);
                            }}
                            allTransactions={paginatedTransactions as any}
                            defaultCity={defaultCity}
                            defaultCountry={defaultCountry}
                            lang={lang}
                            userId={user?.uid}
                            appId={services?.appId}
                            userName={user?.displayName || ''}
                            userEmail={user?.email || ''}
                            onNavigateToView={(targetView) => setView(targetView as View)}
                            hasMoreTransactions={hasMoreTransactions}
                            onLoadMoreTransactions={loadMoreTransactions}
                            loadingMoreTransactions={loadingMoreTransactions}
                            isAtListenerLimit={isAtListenerLimit}
                        />
                    </HistoryFiltersProvider>
                )}

                {/* Story 14.16: Weekly Reports View (accessible via profile menu) */}
                {view === 'reports' && (
                    <ReportsView
                        transactions={transactions as Transaction[]}
                        t={t}
                        theme={theme}
                        userName={user?.displayName || ''}
                        userEmail={user?.email || ''}
                        onBack={navigateBack}
                        onNavigateToView={(targetView) => navigateToView(targetView as View)}
                        onSetPendingHistoryFilters={setPendingHistoryFilters}
                    />
                )}
            </main>

            <Nav
                view={view}
                setView={(v: string) => {
                    // Story 14.24: Use navigateToView to ensure QuickSaveCard is cleared
                    navigateToView(v as View);
                }}
                onScanClick={() => {
                    // Story 12.3: If processing, go to batch-review to show progress
                    // If ready, go to batch-review to show results
                    if (scanStatus === 'processing' || scanStatus === 'ready') {
                        navigateToView('batch-review');
                    } else {
                        triggerScan();
                    }
                }}
                // Story 12.1: Long-press on camera FAB opens batch capture mode (AC #1)
                onBatchClick={() => {
                    setIsBatchCaptureMode(true);
                    navigateToView('batch-capture');
                }}
                onTrendsClick={() => {
                    // Navigation state is now managed by AnalyticsContext
                    // Context resets to year level when mounted
                }}
                theme={theme}
                t={t}
                // Story 12.3: Pass scan status for NAV icon indicator (AC #3)
                scanStatus={scanStatus}
                // Display remaining scan credits on camera FAB
                scanCredits={userCredits.remaining}
                // Display super credits (tier 2) on camera FAB
                superCredits={userCredits.superRemaining}
                // Story 14.15 Session 10: Show credit info modal when badges tapped
                onCreditInfoClick={() => setShowCreditInfoModal(true)}
            />

            {/* Toast notification for feedback (AC#6, AC#7) - Story 14.22: Theme-aware styling */}
            {toastMessage && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-lg z-50 animate-fade-in flex items-center gap-2"
                    style={{
                        backgroundColor: toastMessage.type === 'success' ? 'var(--primary)' : 'var(--accent)',
                        color: '#ffffff',
                        fontFamily: 'var(--font-family)',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                >
                    {toastMessage.type === 'success' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    )}
                    {toastMessage.text}
                </div>
            )}

            {/* Story 9.14: PWA update notification */}
            <PWAUpdatePrompt />

            {/* Story 14.15 Session 10: Credit Info Modal (triggered by Nav credit badges) */}
            {showCreditInfoModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowCreditInfoModal(false)}
                    />
                    {/* Modal */}
                    <div
                        className="relative w-[calc(100%-32px)] max-w-sm rounded-2xl shadow-xl overflow-hidden"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            animation: 'modalFadeIn 0.2s ease-out',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex justify-between items-center px-5 py-4"
                            style={{ borderBottom: '1px solid var(--border-light)' }}
                        >
                            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                                {t('creditInfoTitle') || 'Tus Créditos'}
                            </span>
                            <button
                                onClick={() => setShowCreditInfoModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                aria-label={t('close') || 'Cerrar'}
                            >
                                <X size={18} style={{ color: 'var(--text-primary)' }} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Normal Credits */}
                            <div
                                className="flex items-start gap-3 p-3 rounded-xl"
                                style={{ backgroundColor: 'var(--primary-light)' }}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: 'var(--primary)' }}
                                >
                                    <Camera size={20} className="text-white" strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {t('normalCredits') || 'Créditos Normales'}
                                        </span>
                                        <span className="font-bold text-lg" style={{ color: 'var(--primary)' }}>
                                            {userCredits.remaining.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {t('normalCreditsDesc') || '1 crédito = 1 foto individual escaneada'}
                                    </p>
                                </div>
                            </div>

                            {/* Super Credits */}
                            <div
                                className="flex items-start gap-3 p-3 rounded-xl"
                                style={{ backgroundColor: '#fef3c7' }}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: '#f59e0b' }}
                                >
                                    <Zap size={20} className="text-white" strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {t('superCredits') || 'Super Créditos'}
                                        </span>
                                        <span className="font-bold text-lg" style={{ color: '#d97706' }}>
                                            {userCredits.superRemaining.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {t('superCreditsDesc') || '1 crédito = escaneo en lote de hasta 10 fotos'}
                                    </p>
                                </div>
                            </div>

                            {/* Usage stats */}
                            <div
                                className="text-xs text-center pt-2"
                                style={{
                                    color: 'var(--text-tertiary)',
                                    borderTop: '1px solid var(--border-light)',
                                }}
                            >
                                {t('creditsUsed') || 'Usados'}: {userCredits.used} {t('normal') || 'normales'}, {userCredits.superUsed} {t('super') || 'super'}
                            </div>

                            {/* Buy more credits button */}
                            <button
                                onClick={() => {
                                    setShowCreditInfoModal(false);
                                    setView('settings');
                                    setSettingsSubview('suscripcion');
                                }}
                                className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                }}
                            >
                                <ShoppingCart size={18} strokeWidth={2} />
                                {t('buyMoreCredits') || 'Comprar más créditos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Story 14.15: Scan Overlay for non-blocking scan flow (AC #1, #4) */}
            {/* Only show overlay when on scan-related views so user can navigate away */}
            <ScanOverlay
                state={scanOverlay.state}
                progress={scanOverlay.progress}
                eta={scanOverlay.eta}
                error={scanOverlay.error}
                onCancel={handleScanOverlayCancel}
                onRetry={handleScanOverlayRetry}
                onDismiss={handleScanOverlayDismiss}
                theme={theme as 'light' | 'dark'}
                t={t}
                visible={(isAnalyzing || scanOverlay.state === 'error') && (view === 'scan' || view === 'edit')}
                capturedImageUrl={scanImages[0]}
            />

            {/* Story 10.6: Insight card after transaction save (AC #1, #3, #4) */}
            {showInsightCard && (
                currentInsight && currentInsight.id !== 'building_profile'
                    ? <InsightCard
                        insight={currentInsight}
                        onDismiss={() => setShowInsightCard(false)}
                        theme={theme as 'light' | 'dark'}
                      />
                    : <BuildingProfileCard
                        onDismiss={() => setShowInsightCard(false)}
                        theme={theme as 'light' | 'dark'}
                      />
            )}

            {/* Story 11.2: Quick Save Card for high-confidence scans (AC #1-9) */}
            {/* Story 14.15: Added lang prop for proper category translation */}
            {showQuickSaveCard && quickSaveTransaction && (
                <QuickSaveCard
                    transaction={quickSaveTransaction}
                    confidence={quickSaveConfidence}
                    onSave={handleQuickSave}
                    onEdit={handleQuickSaveEdit}
                    onCancel={handleQuickSaveCancel}
                    onSaveComplete={handleQuickSaveComplete}
                    theme={theme as 'light' | 'dark'}
                    t={t}
                    formatCurrency={formatCurrency}
                    currency={currency}
                    isSaving={isQuickSaving}
                    lang={lang}
                />
            )}

            {/* Story 11.1: Batch upload preview for multi-image selection (AC #2) */}
            {/* Story 11.6: Modal with safe area padding (AC #3) */}
            {showBatchPreview && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                    style={{ padding: 'calc(1rem + var(--safe-top, 0px)) calc(1rem + var(--safe-right, 0px)) calc(1rem + var(--safe-bottom, 0px)) calc(1rem + var(--safe-left, 0px))' }}
                >
                    <BatchUploadPreview
                        images={batchImages}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        onConfirm={handleBatchConfirmWithCreditCheck}
                        onCancel={handleCancelBatchPreview}
                        onRemoveImage={handleRemoveBatchImage}
                        credits={userCredits}
                        usesSuperCredits={true}
                    />
                </div>
            )}

            {/* Story 12.4: Credit Warning Dialog (AC #1, #2, #5, #7) */}
            {showCreditWarning && creditCheckResult && (
                <CreditWarningDialog
                    creditCheck={creditCheckResult}
                    receiptCount={batchImages.length}
                    theme={theme as 'light' | 'dark'}
                    t={t}
                    onConfirm={handleCreditWarningConfirm}
                    onCancel={handleCreditWarningCancel}
                    onReduceBatch={creditCheckResult.maxProcessable > 0 ? handleReduceBatch : undefined}
                />
            )}

            {/* Story 11.1: Batch processing progress (AC #4) - Legacy sequential processing only */}
            {/* Story 11.6: Modal with safe area padding (AC #3) */}
            {/* Story 12.3: Parallel processing (batchProcessing) now shows inline in BatchReviewView */}
            {/* This modal is only for legacy isBatchProcessing (sequential) which is deprecated */}
            {isBatchProcessing && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                    style={{ padding: 'calc(1rem + var(--safe-top, 0px)) calc(1rem + var(--safe-right, 0px)) calc(1rem + var(--safe-bottom, 0px)) calc(1rem + var(--safe-left, 0px))' }}
                >
                    <BatchProcessingProgress
                        current={batchProgress.current}
                        total={batchProgress.total}
                        results={batchResults}
                        theme={theme as 'light' | 'dark'}
                        currency={currency}
                        t={t}
                        onCancel={handleBatchCancelRequest}
                    />
                </div>
            )}

            {/* Story 11.1: Batch cancel confirmation dialog */}
            {/* Story 11.6: Modal with safe area padding (AC #3) */}
            {showBatchCancelConfirm && (
                <div
                    className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center"
                    style={{ padding: 'calc(1rem + var(--safe-top, 0px)) calc(1rem + var(--safe-right, 0px)) calc(1rem + var(--safe-bottom, 0px)) calc(1rem + var(--safe-left, 0px))' }}
                >
                    <div
                        className="rounded-xl p-6 max-w-sm w-full shadow-xl"
                        style={{
                            backgroundColor: 'var(--surface)',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        }}
                        role="alertdialog"
                        aria-labelledby="cancel-dialog-title"
                        aria-describedby="cancel-dialog-desc"
                    >
                        <h3
                            id="cancel-dialog-title"
                            className="text-lg font-bold mb-2"
                            style={{ color: 'var(--primary)' }}
                        >
                            {t('batchCancelConfirmTitle')}
                        </h3>
                        <p
                            id="cancel-dialog-desc"
                            className="text-sm mb-6"
                            style={{ color: 'var(--secondary)' }}
                        >
                            {t('batchCancelConfirmMessage').replace(
                                '{count}',
                                String(batchResults.filter(r => r.status === 'success').length)
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleBatchCancelConfirm}
                                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors"
                                style={{ backgroundColor: '#ef4444' }}
                            >
                                {t('batchCancelConfirmYes')}
                            </button>
                            <button
                                onClick={handleBatchCancelDismiss}
                                className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors"
                                style={{
                                    backgroundColor: isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                                    color: 'var(--secondary)',
                                }}
                            >
                                {t('batchCancelConfirmNo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Story 10.7: Batch summary for multi-receipt sessions (AC #1, #2, #3, #4, #6) */}
            {showBatchSummary && batchSession && (
                <BatchSummary
                    receipts={batchSession.receipts}
                    insights={batchSession.insights}
                    totalAmount={batchSession.totalAmount}
                    lastWeekTotal={getLastWeekTotal(transactions)}
                    onSilence={() => {
                        // AC #6: Toggle silence - silence for 4 hours or clear if already silenced
                        const newCache = isInsightsSilenced(insightCache)
                            ? clearSilence(insightCache)
                            : silenceInsights(insightCache, 4);
                        setLocalCache(newCache);
                    }}
                    onDismiss={() => {
                        setShowBatchSummary(false);
                        clearBatch();
                        // Story 11.1: Redirect to Home after batch processing completes
                        setView('dashboard');
                    }}
                    isSilenced={isInsightsSilenced(insightCache)}
                    theme={theme as 'light' | 'dark'}
                />
            )}

            {/* Story 11.4: Trust Merchant Prompt (AC #2, #3, #4) */}
            {showTrustPrompt && trustPromptData?.merchant && (
                <TrustMerchantPrompt
                    merchantName={trustPromptData.merchant.merchantName}
                    scanCount={trustPromptData.merchant.scanCount}
                    onAccept={handleAcceptTrust}
                    onDecline={handleDeclineTrust}
                    theme={theme as 'light' | 'dark'}
                    t={t}
                />
            )}

            {/* Story 14.15: Batch Complete Success Modal (State 3.a from scan-overlay.html mockup) */}
            {showBatchCompleteModal && batchCompletedTransactions.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    style={{ paddingTop: 'calc(1rem + var(--safe-top, 0px))', paddingBottom: 'calc(1rem + var(--safe-bottom, 0px))' }}
                >
                    <BatchCompleteModal
                        transactions={batchCompletedTransactions}
                        creditsUsed={batchCreditsUsed}
                        creditsRemaining={userCredits.superRemaining ?? 0}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        onDismiss={() => {
                            setShowBatchCompleteModal(false);
                            setBatchCompletedTransactions([]);
                        }}
                        onViewHistory={() => {
                            setShowBatchCompleteModal(false);
                            setBatchCompletedTransactions([]);
                            setView('history');
                        }}
                        onGoHome={() => {
                            setShowBatchCompleteModal(false);
                            setBatchCompletedTransactions([]);
                            setView('dashboard');
                        }}
                        formatCurrency={formatCurrency}
                    />
                </div>
            )}

            {/* Story 14.15b: Currency Mismatch Dialog (AC #2) */}
            <CurrencyMismatchDialog
                isOpen={showCurrencyMismatch}
                detectedCurrency={currencyMismatchData?.detectedCurrency || ''}
                userCurrency={userPreferences.defaultCurrency || 'CLP'}
                onUseDetected={handleCurrencyUseDetected}
                onUseDefault={handleCurrencyUseDefault}
                onCancel={handleCurrencyMismatchCancel}
                theme={theme as 'light' | 'dark'}
                t={t}
            />

            {/* Total Mismatch Dialog (OCR error detection) */}
            <TotalMismatchDialog
                isOpen={showTotalMismatch}
                validationResult={totalMismatchData?.validationResult || {
                    isValid: true,
                    extractedTotal: 0,
                    itemsSum: 0,
                    discrepancy: 0,
                    discrepancyPercent: 0,
                    suggestedTotal: null,
                    errorType: 'none',
                }}
                currency={totalMismatchData?.pendingTransaction?.currency || userPreferences.defaultCurrency || 'CLP'}
                onUseItemsSum={handleTotalUseItemsSum}
                onKeepOriginal={handleTotalKeepOriginal}
                onCancel={handleTotalMismatchCancel}
                theme={theme as 'light' | 'dark'}
                t={t}
            />

            {/* Story 14.24: Transaction Conflict Dialog */}
            <TransactionConflictDialog
                isOpen={showConflictDialog}
                conflictingTransaction={conflictDialogData?.conflictingTransaction || null}
                conflictReason={conflictDialogData?.conflictReason || null}
                onContinueCurrent={handleConflictClose}
                onViewConflicting={handleConflictViewCurrent}
                onDiscardConflicting={handleConflictDiscard}
                onClose={handleConflictClose}
                t={t}
                lang={lang}
                formatCurrency={(amount, curr) => formatCurrency(amount, curr)}
            />
        </div>
    );
}

export default App;
