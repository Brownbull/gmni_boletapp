/**
 * App.tsx - Main Application Component
 *
 * Root component that orchestrates the entire application:
 * - View routing and navigation state management
 * - User authentication and session handling
 * - Transaction and scan workflow coordination
 * - Theme, language, and user preferences
 * - Context providers (Auth, Scan, Analytics, HistoryFilters, ViewHandlers)
 *
 * View rendering is delegated to composition hooks (useXxxViewProps) and
 * render functions (viewRenderers.tsx). Handler logic is extracted to
 * app-level hooks (useTransactionHandlers, useScanHandlers, etc.).
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// App architecture components and view renderers
import {
    AppLayout,
    AppOverlays,
    shouldShowTopHeader,
    type View,
    renderStatementScanView,
    renderReportsView,
    renderRecentScansView,
    renderInsightsView,
    renderAlertsView,
} from './components/App';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { migrateCreatedAt } from './utils/migrateCreatedAt';
import { useRecentScans } from './hooks/useRecentScans';
import { usePaginatedTransactions } from './hooks/usePaginatedTransactions';
import { useCategoryMappings } from './hooks/useCategoryMappings';
import { useMerchantMappings } from './hooks/useMerchantMappings';
import { useSubcategoryMappings } from './hooks/useSubcategoryMappings';
import { useItemNameMappings } from './hooks/useItemNameMappings';
import { useTrustedMerchants } from './hooks/useTrustedMerchants';
import { useUserPreferences } from './hooks/useUserPreferences';
import { useUserCredits } from './hooks/useUserCredits';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useInsightProfile } from './hooks/useInsightProfile';
import { useBatchSession } from './hooks/useBatchSession';
import { usePersonalRecords } from './hooks/usePersonalRecords';
import { usePendingInvitations } from './hooks/usePendingInvitations';
import { useInAppNotifications } from './hooks/useInAppNotifications';
import { useViewMode } from './contexts/ViewModeContext';
import { useUserSharedGroups } from './hooks/useUserSharedGroups';
import { ViewModeSwitcher } from './components/SharedGroups/ViewModeSwitcher';
import { useJoinLinkHandler } from './hooks/useJoinLinkHandler';
// App-level handler and composition hooks
import {
    useTransactionHandlers,
    useScanHandlers,
    useNavigationHandlers,
    useDialogHandlers,
    useHistoryViewProps,
    useTrendsViewProps,
    useBatchReviewViewProps,
    useTransactionEditorViewProps,
    useDashboardViewProps,
    useSettingsViewProps,
    useItemsViewProps,
} from './hooks/app';
import { ViewHandlersProvider } from './contexts';
import { JoinGroupDialog } from './components/SharedGroups/JoinGroupDialog';
import type { SharedGroup } from './types/sharedGroup';
import { getFirestore } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { updateMemberTimestampsForTransaction } from './services/sharedGroupService';
import type { GroupWithMeta } from './components/SharedGroups';
import { useBatchProcessing } from './hooks/useBatchProcessing';
import type { BatchReceipt } from './hooks/useBatchReview';
import { createBatchReceiptsFromResults } from './hooks/useBatchReview';
// Dialog types for scan state machine
import type {
    BatchCompleteDialogData,
    CurrencyMismatchDialogData,
    TotalMismatchDialogData,
    QuickSaveDialogData,
} from './types/scanStateMachine';
import { DIALOG_TYPES } from './types/scanStateMachine';
import { LoginScreen } from './views/LoginScreen';
import { DashboardView } from './views/DashboardView';
import { TrendsView } from './views/TrendsView';
import { HistoryView } from './views/HistoryView';
import { ItemsView } from './views/ItemsView';
import { BatchCaptureView } from './views/BatchCaptureView';
import { BatchReviewView } from './views/BatchReviewView';
import { SettingsView } from './views/SettingsView';
import { TransactionEditorView } from './views/TransactionEditorView';
import { Nav, ScanStatus } from './components/Nav';
import { TopHeader } from './components/TopHeader';
import { type SessionContext, type SessionAction } from './components/session';
import { BatchUploadPreview, MAX_BATCH_IMAGES } from './components/scan';
import { useScanOverlayState } from './hooks/useScanOverlayState';
import { PROCESSING_TIMEOUT_MS } from './hooks/useScanState';
import { shouldShowQuickSave, calculateConfidence } from './utils/confidenceCheck';
import { validateTotal } from './utils/totalValidation';
import { BatchProcessingOverlay } from './components/scan';
import { checkCreditSufficiency, type CreditCheckResult } from './services/creditService';
import type { ConflictingTransaction, ConflictReason } from './components/dialogs/TransactionConflictDialog';
import type { TrustPromptEligibility } from './types/trust';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { useScan } from './contexts/ScanContext';
import { getQuarterFromMonth } from './utils/analyticsHelpers';
import type { AnalyticsNavigationState } from './types/analytics';
import { HistoryFiltersProvider, type HistoryFilterState } from './contexts/HistoryFiltersContext';
import { analyzeReceipt, ReceiptType } from './services/gemini';
import { SupportedCurrency } from './services/userPreferencesService';
import { addTransaction as firestoreAddTransaction } from './services/firestore';
import {
    generateInsightForTransaction,
    silenceInsights,
    clearSilence,
    isInsightsSilenced,
    getLastWeekTotal,
    setLocalCache,
} from './services/insightEngineService';
import { Transaction, StoreCategory, TransactionItem } from './types/transaction';
import { Insight } from './types/insight';
import { Language, Currency, Theme, ColorTheme, FontColorMode, FontSize } from './types/settings';
import {
    loadPersistedScanState,
    savePersistedScanState,
    clearPersistedScanState,
    clearLegacyBatchStorage,
} from './services/pendingScanStorage';
import { formatCurrency } from './utils/currency';
import { formatDate } from './utils/date';
import { getSafeDate, parseStrictNumber } from './utils/validation';
import { TRANSLATIONS } from './utils/translations';
import { STORE_CATEGORIES } from './config/constants';
import { applyCategoryMappings } from './utils/categoryMatcher';
import { incrementMappingUsage } from './services/categoryMappingService';
import { incrementMerchantMappingUsage } from './services/merchantMappingService';
import { incrementItemNameMappingUsage } from './services/itemNameMappingService';
import { getCitiesForCountry } from './data/locations';
// Modal Manager - centralized modal rendering (Story 14e-4)
import { ModalManager, useModalActions } from './managers/ModalManager';

/**
 * Reconcile transaction total with sum of items.
 * If there's a discrepancy, adds a surplus or discount item to balance.
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
    // price is total for line item, qty is informational only
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
    // Recent scans sorted by createdAt (for "Últimos Escaneados" - ensures recently scanned
    // receipts appear even if their transaction date is outside the top 100 by date)
    const recentScans = useRecentScans(user, services);

    // DEV: Expose migration function to browser console for fixing createdAt
    useEffect(() => {
        if (import.meta.env.DEV && services?.db && user?.uid) {
            (window as any).runCreatedAtMigration = async (dryRun = true) => {
                return migrateCreatedAt(services.db, user.uid, services.appId, dryRun);
            };
        }
    }, [services, user]);

    const {
        transactions: paginatedTransactions,
        hasMore: hasMoreTransactions,
        loadMore: loadMoreTransactions,
        loadingMore: loadingMoreTransactions,
        isAtListenerLimit,
    } = usePaginatedTransactions(user, services);

    // Merge recentScans into paginatedTransactions for HistoryView.
    // Ensures recently scanned receipts with old transaction dates appear when
    // sorting by "Ingresado" (scan date). Deduplicated by transaction ID.
    const transactionsWithRecentScans = useMemo(() => {
        const txMap = new Map<string, Transaction>();
        for (const tx of paginatedTransactions) {
            if (tx.id) txMap.set(tx.id, tx);
        }
        for (const tx of recentScans) {
            if (tx.id && !txMap.has(tx.id)) {
                txMap.set(tx.id, tx);
            }
        }
        return Array.from(txMap.values());
    }, [paginatedTransactions, recentScans]);

    // Category, merchant, subcategory, and item name mappings for learning system
    const { mappings, loading: mappingsLoading, saveMapping, deleteMapping, updateMapping: updateCategoryMapping } = useCategoryMappings(user, services);
    const {
        mappings: merchantMappings,
        loading: merchantMappingsLoading,
        findMatch: findMerchantMatch,
        saveMapping: saveMerchantMapping,
        deleteMapping: deleteMerchantMapping,
        updateMapping: updateMerchantMapping
    } = useMerchantMappings(user, services);
    const {
        mappings: subcategoryMappings,
        loading: subcategoryMappingsLoading,
        saveMapping: saveSubcategoryMapping,
        deleteMapping: deleteSubcategoryMapping,
        updateMappingTarget: updateSubcategoryMapping
    } = useSubcategoryMappings(user, services);
    const {
        mappings: itemNameMappings,
        loading: itemNameMappingsLoading,
        saveMapping: saveItemNameMapping,
        deleteMapping: deleteItemNameMapping,
        updateMapping: updateItemNameMapping,
        findMatch: findItemNameMatch,
        findMatchesForMerchant: _findItemNameMatchesForMerchant
    } = useItemNameMappings(user, services);

    // User preferences (currency, location, profile settings)
    const {
        preferences: userPreferences,
        loading: _preferencesLoading,
        setDefaultCurrency: setDefaultScanCurrencyPref,
        setDefaultCountry: setDefaultCountryPref,
        setDefaultCity: setDefaultCityPref,
        setDisplayName: setDisplayNamePref,
        setPhoneNumber: setPhoneNumberPref,
        setBirthDate: setBirthDatePref,
        setFontFamily: setFontFamilyPref,
        setForeignLocationFormat: setForeignLocationFormatPref,
    } = useUserPreferences(user, services);

    // Scan credits (deducted immediately on scan start to prevent exploits)
    // Only restored via addCredits if API returns an error (server-side failure).
    const {
        credits: userCredits,
        deductCredits: deductUserCredits,
        deductSuperCredits: deductUserSuperCredits,
        addCredits: addUserCredits,
        addSuperCredits: addUserSuperCredits,
    } = useUserCredits(user, services);

    // Insight profile for generating contextual insights after transactions
    const {
        profile: insightProfile,
        cache: insightCache,
        recordShown: recordInsightShown,
        trackTransaction: trackTransactionForInsight,
        incrementCounter: incrementInsightCounter,
    } = useInsightProfile(user, services);

    // Batch session tracking for multi-receipt scanning
    const {
        session: batchSession,
        addToBatch,
        clearBatch,
    } = useBatchSession();

    // Trusted merchants for auto-save functionality
    const {
        recordMerchantScan,
        checkTrusted,
        acceptTrust,
        declinePrompt,
        removeTrust,
        trustedMerchants,
        loading: trustedMerchantsLoading,
    } = useTrustedMerchants(user, services);

    // Personal records detection and celebration
    const {
        recordToCelebrate,
        showRecordBanner,
        checkForRecords,
        dismissRecord,
    } = usePersonalRecords({
        db: services?.db ?? null,
        userId: user?.uid ?? null,
        appId: services?.appId ?? null,
    });

    const { pendingInvitations, pendingCount: pendingInvitationsCount } = usePendingInvitations(user?.email);
    const { mode: viewMode, group: activeGroup, setGroupMode } = useViewMode();
    const db = getFirestore();

    const {
        state: joinLinkState,
        shareCode: _joinShareCode,
        groupPreview: joinGroupPreview,
        error: joinError,
        joinedGroupId,
        confirmJoin,
        cancelJoin,
        dismissError: dismissJoinError,
    } = useJoinLinkHandler({
        db,
        userId: user?.uid ?? null,
        isAuthenticated: !!user,
        userProfile: user ? { displayName: user.displayName ?? undefined, email: user.email ?? undefined, photoURL: user.photoURL ?? undefined } : null,
        appId: services?.appId,
    });

    // Auto-switch to newly joined group
    useEffect(() => {
        if (joinLinkState === 'success' && joinedGroupId && joinGroupPreview) {
            setGroupMode(joinedGroupId, joinGroupPreview as unknown as SharedGroup);
            setView('dashboard');
        }
    }, [joinLinkState, joinedGroupId, joinGroupPreview, setGroupMode]);

    const {
        notifications: inAppNotifications,
        unreadCount: inAppNotificationsUnreadCount,
        markAsRead: markNotificationAsRead,
        markAllAsRead: markAllNotificationsAsRead,
        deleteNotification: deleteInAppNotification,
        deleteAllNotifications: deleteAllInAppNotifications,
    } = useInAppNotifications(db, user?.uid || null, services?.appId || null);
    const queryClient = useQueryClient();
    const { groups: userSharedGroups, isLoading: sharedGroupsLoading } = useUserSharedGroups(db, user?.uid);
    const [showViewModeSwitcher, setShowViewModeSwitcher] = useState(false);

    // View mode is in-memory only (defaults to personal mode)
    const availableGroupsForSelector: GroupWithMeta[] = useMemo(() => {
        return userSharedGroups.map(group => ({
            id: group.id || '',
            name: group.name,
            color: group.color,
            icon: group.icon,
            isShared: true,
            memberCount: group.members?.length || 0,
        }));
    }, [userSharedGroups]);

    // Stub values for shared group transactions (feature temporarily disabled)
    const sharedGroupTransactions: any[] = [];
    const sharedGroupRawTransactions: any[] = [];
    const sharedGroupSpendingByMember = new Map<string, number>();

    // Scan context - manages scan state machine (single, batch, statement modes)
    const {
        state: scanState,
        startSingleScan: startScanContext,
        startBatchScan: startBatchScanContext,
        startStatementScan: startStatementScanContext,
        batchItemStart: dispatchBatchItemStart,
        batchItemSuccess: dispatchBatchItemSuccess,
        batchItemError: dispatchBatchItemError,
        batchComplete: dispatchBatchComplete,
        isBatchMode: isBatchModeFromContext,
        isBatchProcessing: isBatchProcessingFromContext,
        isBatchReviewing: _isBatchReviewingFromContext,
        batchProgress: batchProgressFromContext,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setBatchReceipts: _setBatchReceiptsContext,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        clearBatchReceipts: _clearBatchReceiptsContext,
        setBatchEditingIndex: setBatchEditingIndexContext,
        updateBatchReceipt: updateBatchReceiptContext,
        showDialog: showScanDialog,
        dismissDialog: dismissScanDialog,
        setImages: setScanContextImages,
        setStoreType: setScanContextStoreType,
        setCurrency: setScanContextCurrency,
        processStart: dispatchProcessStart,
        processSuccess: dispatchProcessSuccess,
        processError: dispatchProcessError,
        reset: resetScanContext,
        isProcessing: isContextProcessing,
        restoreState: restoreScanState,
        hasActiveRequest: _hasScanActiveRequest,
    } = useScan();

    // Reserved for future batch processing checks
    void isBatchProcessingFromContext;
    void batchProgressFromContext;

    // Helper for batch receipts existence check
    const hasBatchReceipts = (scanState.batchReceipts?.length ?? 0) > 0;

    // ==========================================================================
    // State Variable Migrations - ScanContext wrappers for backward compatibility
    // ==========================================================================

    // scanImages wrapper - auto-transitions to 'capturing' phase when setting images
    const scanImages = scanState.images;
    const setScanImages = useCallback((newImages: string[] | ((prev: string[]) => string[])) => {
        const imagesToSet = typeof newImages === 'function'
            ? newImages(scanState.images)
            : newImages;

        // Auto-transition to 'capturing' phase if needed
        if (scanState.phase === 'idle' && imagesToSet.length > 0 && user?.uid) {
            startScanContext(user.uid);
            // setTimeout(0) defers to next tick to allow state transition
            setTimeout(() => setScanContextImages(imagesToSet), 0);
        } else if (imagesToSet.length === 0) {
            // Clearing images resets to idle state
            resetScanContext();
        } else {
            setScanContextImages(imagesToSet);
        }
    }, [scanState.images, scanState.phase, user?.uid, startScanContext, setScanContextImages, resetScanContext]);

    // scanError wrapper - error is cleared by resetScanContext() and dispatchProcessStart()
    const scanError = scanState.error;
    const setScanError = useCallback((error: string | null) => {
        if (error) {
            dispatchProcessError(error);
        }
    }, [dispatchProcessError]);

    // isAnalyzing wrapper - derived from state machine phase
    const isAnalyzing = isContextProcessing;
    const setIsAnalyzing = useCallback((analyzing: boolean) => {
        if (import.meta.env.DEV && analyzing !== isContextProcessing) {
            console.debug('[ScanContext] setIsAnalyzing called (managed by state machine):', analyzing);
        }
    }, [isContextProcessing]);

    // scanStoreType wrapper
    const scanStoreType = (scanState.storeType || 'auto') as ReceiptType;
    const setScanStoreType = useCallback((storeType: ReceiptType) => {
        setScanContextStoreType(storeType);
    }, [setScanContextStoreType]);

    // scanCurrency wrapper
    const scanCurrency = (scanState.currency || 'CLP') as SupportedCurrency;
    const setScanCurrency = useCallback((currency: SupportedCurrency) => {
        setScanContextCurrency(currency);
    }, [setScanContextCurrency]);

    // UI-specific flag for scan complete modal suppression
    const [skipScanCompleteModal, setSkipScanCompleteModal] = useState(false);

    // ==========================================================================
    // UI State
    // ==========================================================================

    const [view, setView] = useState<View>('dashboard');
    const [previousView, setPreviousView] = useState<View>('dashboard');
    const [settingsSubview, setSettingsSubview] = useState<'main' | 'limites' | 'perfil' | 'preferencias' | 'escaneo' | 'suscripcion' | 'datos' | 'grupos' | 'app' | 'cuenta'>('main');
    const [isRescanning, setIsRescanning] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
    // Multi-transaction navigation from ItemsView (enables "1 de 3" header)
    const [transactionNavigationList, setTransactionNavigationList] = useState<string[] | null>(null);
    // Read-only mode for viewing transactions from History
    const [isViewingReadOnly, setIsViewingReadOnly] = useState(false);
    // Track if a credit was used in current editing session
    const [creditUsedInSession, setCreditUsedInSession] = useState(false);
    const [_editingItemIndex, _setEditingItemIndex] = useState<number | null>(null);

    // Insight and session UI state
    const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
    const [showInsightCard, setShowInsightCard] = useState(false);
    const [showSessionComplete, setShowSessionComplete] = useState(false);
    const [sessionContext, setSessionContext] = useState<SessionContext | null>(null);
    const [showBatchSummary, setShowBatchSummary] = useState(false);

    // Batch upload and processing state
    const [batchImages, setBatchImages] = useState<string[]>([]);
    const [showBatchPreview, setShowBatchPreview] = useState(false);
    const [isQuickSaving, setIsQuickSaving] = useState(false);
    const [isTransactionSaving, setIsTransactionSaving] = useState(false);
    const [animateEditViewItems, setAnimateEditViewItems] = useState(false);
    const [transactionEditorMode, setTransactionEditorMode] = useState<'new' | 'existing'>('new');
    const [showTrustPrompt, setShowTrustPrompt] = useState(false);
    const [trustPromptData, setTrustPromptData] = useState<TrustPromptEligibility | null>(null);
    const [showCreditWarning, setShowCreditWarning] = useState(false);
    const [creditCheckResult, setCreditCheckResult] = useState<CreditCheckResult | null>(null);
    const batchProcessing = useBatchProcessing(3);

    const scanOverlay = useScanOverlayState();
    const prefersReducedMotion = useReducedMotion();

    // ==========================================================================
    // Settings State
    // ==========================================================================

    const [lang, setLang] = useState<Language>('es');
    const [currency, setCurrency] = useState<Currency>('CLP');
    const [theme, setTheme] = useState<Theme>('light');
    const [dateFormat, setDateFormat] = useState<'LatAm' | 'US'>('LatAm');

    // Color theme (defaults to 'mono', with migration from legacy values)
    const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
        const saved = localStorage.getItem('colorTheme');
        if (saved === 'ghibli') return 'normal';
        if (saved === 'default') return 'professional';
        if (saved === 'normal' || saved === 'professional' || saved === 'mono') return saved;
        return 'mono';
    });

    // Font color mode for category text ('colorful' uses category palette colors)
    const [fontColorMode, setFontColorMode] = useState<FontColorMode>(() => {
        const saved = localStorage.getItem('fontColorMode');
        if (saved === 'colorful' || saved === 'plain') return saved;
        return 'colorful';
    });

    // Font size scaling ('small' is default for backwards compatibility)
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        const saved = localStorage.getItem('fontSize');
        if (saved === 'small' || saved === 'normal') return saved;
        return 'small';
    });

    // Font family from Firestore preferences
    const fontFamily = userPreferences.fontFamily || 'outfit';

    // Default location settings (from Firestore preferences)
    const defaultCountry = userPreferences.defaultCountry || '';
    const defaultCity = userPreferences.defaultCity || '';

    /**
     * When in shared group mode, automatically includes the active group ID.
     * This ensures ALL new transactions (single scan, batch scan, manual creation)
     * are initialized consistently with the shared group when applicable.
     */
    const createDefaultTransaction = useCallback((): Transaction => {
        const baseTransaction: Transaction = {
            merchant: '',
            date: getSafeDate(null),
            total: 0,
            category: 'Supermarket',
            items: [],
            country: defaultCountry,
            city: defaultCity,
            currency: userPreferences.defaultCurrency || 'CLP',
        };

        // Auto-assign shared group when in group view mode
        if (viewMode === 'group' && activeGroup?.id) {
            return {
                ...baseTransaction,
                sharedGroupIds: [activeGroup.id],
            };
        }

        return baseTransaction;
    }, [defaultCountry, defaultCity, userPreferences.defaultCurrency, viewMode, activeGroup]);

    // UI loading states
    const [wiping, _setWiping] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

    // Navigation filter state - passed to HistoryFiltersProvider as initialState
    const [pendingHistoryFilters, setPendingHistoryFilters] = useState<HistoryFilterState | null>(null);
    // Distribution view state for back navigation (preserves donut/treemap selection)
    const [pendingDistributionView, setPendingDistributionView] = useState<'treemap' | 'donut' | null>(null);
    // Analytics navigation state for "This Month" card clicks
    const [analyticsInitialState, setAnalyticsInitialState] = useState<AnalyticsNavigationState | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const scrollPositionsRef = useRef<Record<string, number>>({});
    const t = (k: string) => (TRANSLATIONS[lang] as any)[k] || k;

    // Extract distinct aliases from transactions
    const distinctAliases = useMemo(() => {
        const aliases = new Set<string>();
        transactions.forEach(d => {
            if (d.alias) aliases.add(d.alias);
        });
        return Array.from(aliases).sort();
    }, [transactions]);

    // Transaction handlers (save, delete, wipe, export)
    const {
        saveTransaction,
        deleteTransaction,
        wipeDB,
        handleExportData,
    } = useTransactionHandlers({
        user,
        services,
        viewMode,
        activeGroup: activeGroup ?? null,  // Convert undefined to null for type safety
        userPreferences,
        transactions,
        currency,
        // Insight generation
        insightProfile,
        insightCache,
        recordInsightShown,
        trackTransactionForInsight,
        incrementInsightCounter,
        // Batch session - adapt type (hook only uses receipts.length for batch mode detection)
        batchSession: batchSession ? { receipts: batchSession.receipts as any } : null,
        addToBatch,  // Both hook and useBatchSession use (tx, insight) signature
        // UI callbacks
        setToastMessage,
        setCurrentTransaction,
        setView,
        setCurrentInsight,
        setShowInsightCard,
        setShowBatchSummary,
        setSessionContext,
        // ScanContext integration
        setScanImages,
        // Translation
        t,
    });

    // Navigation handlers (view transitions, back navigation, filter state)
    const {
        navigateToView,
        navigateBack,
        handleNavigateToHistory,
    } = useNavigationHandlers({
        view,
        setView,
        previousView,
        setPreviousView,
        mainRef,
        scrollPositionsRef,
        pendingHistoryFilters,
        setPendingHistoryFilters,
        pendingDistributionView,
        setPendingDistributionView,
        analyticsInitialState,
        setAnalyticsInitialState,
        scanState,
        dismissScanDialog,
    });

    // Dialog handlers (conflict dialog - credit info modal now uses Modal Manager)
    const {
        showConflictDialog,
        setShowConflictDialog,
        conflictDialogData,
        setConflictDialogData,
        handleConflictClose,
        handleConflictViewCurrent,
        handleConflictDiscard,
    } = useDialogHandlers({
        scanState,
        setCurrentTransaction,
        setScanImages,
        createDefaultTransaction,
        setTransactionEditorMode,
        navigateToView,
    });

    // Story 14e-4: Modal Manager actions for credit info modal
    const { openModal: openModalAction, closeModal: closeModalAction } = useModalActions();

    // Scan handlers (overlay, quick save, currency/total mismatch)
    const {
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
        applyItemNameMappings: hookApplyItemNameMappings,
        reconcileItemsTotal: hookReconcileItemsTotal,
        continueScanWithTransaction,
    } = useScanHandlers({
        user,
        services,
        userPreferences,
        transactions,
        currency,
        lang,
        currentTransaction,
        // Insight generation
        insightProfile,
        insightCache,
        recordInsightShown,
        trackTransactionForInsight,
        incrementInsightCounter,
        // Batch session
        batchSession,
        addToBatch,
        // Trusted merchants
        checkTrusted,
        recordMerchantScan,
        // Item name mapping
        findItemNameMatch,
        categoryMappings: mappings,
        findMerchantMatch,
        applyCategoryMappings,
        incrementMappingUsage,
        incrementMerchantMappingUsage,
        incrementItemNameMappingUsage,
        // ScanContext actions
        showScanDialog,
        dismissScanDialog,
        dispatchProcessSuccess,
        resetScanContext,
        setScanImages,
        // Scan overlay
        scanOverlay,
        // UI callbacks
        setToastMessage,
        setCurrentTransaction,
        setView,
        navigateToView,
        setCurrentInsight,
        setShowInsightCard,
        setShowBatchSummary,
        setSessionContext,
        setAnimateEditViewItems,
        setSkipScanCompleteModal,
        setTransactionEditorMode,
        setIsQuickSaving,
        isQuickSaving,
        // Trust prompt
        setTrustPromptData,
        setShowTrustPrompt,
        // Translation
        t,
    });

    // Toast auto-dismiss
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Handler bundles for ViewHandlersContext (eliminates prop drilling to views)
    const transactionHandlers = useMemo(() => ({
        saveTransaction,
        deleteTransaction,
        wipeDB,
        handleExportData,
        createDefaultTransaction,
    }), [saveTransaction, deleteTransaction, wipeDB, handleExportData, createDefaultTransaction]);

    const navigationHandlers = useMemo(() => ({
        navigateToView,
        navigateBack,
        handleNavigateToHistory,
    }), [navigateToView, navigateBack, handleNavigateToHistory]);

    // Dialog handlers include both hook-provided handlers and local toast state
    // Toast is kept local due to hook dependency order (useTransactionHandlers needs setToastMessage)
    // Story 14e-4: Credit info modal now uses Modal Manager
    const dialogHandlers = useMemo(() => ({
        // Toast
        toastMessage,
        setToastMessage,
        showToast: (text: string, type: 'success' | 'info') => setToastMessage({ text, type }),
        // Credit Info Modal - Story 14e-4: Uses Modal Manager instead of local state
        openCreditInfoModal: () => openModalAction('creditInfo', {
            normalCredits: userCredits.remaining,
            superCredits: userCredits.superRemaining ?? 0,
            onClose: closeModalAction,
        }),
        closeCreditInfoModal: closeModalAction,
        // Conflict Dialog
        showConflictDialog,
        setShowConflictDialog,
        conflictDialogData,
        setConflictDialogData,
        handleConflictClose,
        handleConflictViewCurrent,
        handleConflictDiscard,
        openConflictDialog: (
            conflictingTransaction: any,
            conflictReason: any,
            pendingAction: any
        ) => {
            setConflictDialogData({ conflictingTransaction, conflictReason, pendingAction });
            setShowConflictDialog(true);
        },
    }), [
        toastMessage, setToastMessage,
        openModalAction, closeModalAction, userCredits.remaining, userCredits.superRemaining,
        showConflictDialog, setShowConflictDialog,
        conflictDialogData, setConflictDialogData,
        handleConflictClose, handleConflictViewCurrent, handleConflictDiscard,
    ]);

    const scanHandlers = useMemo(() => ({
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
        // Utilities for ViewHandlersContext
        applyItemNameMappings: hookApplyItemNameMappings,
        reconcileItemsTotal: hookReconcileItemsTotal,
        continueScanWithTransaction,
    }), [
        handleScanOverlayCancel, handleScanOverlayRetry, handleScanOverlayDismiss,
        handleQuickSaveComplete, handleQuickSave, handleQuickSaveEdit, handleQuickSaveCancel,
        handleCurrencyUseDetected, handleCurrencyUseDefault, handleCurrencyMismatchCancel,
        handleTotalUseItemsSum, handleTotalKeepOriginal, handleTotalMismatchCancel,
        hookApplyItemNameMappings, hookReconcileItemsTotal, continueScanWithTransaction,
    ]);

    // Check for personal records after transactions change
    useEffect(() => {
        if (transactions.length > 0 && user?.uid) {
            checkForRecords(transactions);
        }
    }, [transactions, user?.uid, checkForRecords]);

    // Persist appearance settings to localStorage
    useEffect(() => {
        localStorage.setItem('colorTheme', colorTheme);
    }, [colorTheme]);

    useEffect(() => {
        localStorage.setItem('fontColorMode', fontColorMode);
    }, [fontColorMode]);

    useEffect(() => {
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    // Load persisted scan state on user login (handles both single and batch modes)
    useEffect(() => {
        if (user?.uid) {
            const storedState = loadPersistedScanState(user.uid);
            if (storedState) {
                // Interrupted scans can't be recovered - show toast and clear storage
                if (storedState.phase === 'scanning') {
                    const message = storedState.mode === 'batch'
                        ? 'Procesamiento de lote interrumpido. Los créditos ya se usaron.'
                        : 'Escaneo interrumpido. Intenta de nuevo.';
                    setToastMessage({ text: message, type: 'info' });
                    clearPersistedScanState(user.uid);
                    return;
                }

                // Error state with no content - just show toast and clear
                if (storedState.phase === 'error' && storedState.images.length === 0 && storedState.results.length === 0) {
                    if (storedState.error) {
                        setToastMessage({ text: storedState.error, type: 'info' });
                    }
                    clearPersistedScanState(user.uid);
                    return;
                }

                restoreScanState(storedState);

                // Batch mode restoration
                if (storedState.mode === 'batch') {
                    setBatchImages(storedState.images);
                    if (storedState.phase === 'reviewing' && (storedState.results.length > 0 || storedState.batchReceipts)) {
                        setView('batch-review');
                    } else if (storedState.phase === 'capturing' && storedState.images.length > 0) {
                        setView('batch-capture');
                    }
                    return;
                }

                // Single mode restoration
                if (storedState.results.length > 0) {
                    setCurrentTransaction(storedState.results[0]);
                }

                // Navigate to appropriate view based on restored phase
                if (storedState.phase === 'reviewing' && storedState.results.length > 0) {
                    setView('scan-result');
                } else if (storedState.phase === 'capturing' && storedState.images.length > 0) {
                    setView('scan');
                } else if (storedState.phase === 'error' && (storedState.images.length > 0 || storedState.results.length > 0)) {
                    setView('scan');
                }
            }
        }
    }, [user?.uid, restoreScanState]);

    // Persist scan state to storage (primary persistence mechanism)
    const scanStateInitializedRef = useRef(false);
    useEffect(() => {
        if (!user?.uid) return;

        // Skip first run to let load effect run first
        if (!scanStateInitializedRef.current) {
            scanStateInitializedRef.current = true;
            return;
        }

        const hasContent = scanState.phase !== 'idle' &&
            (scanState.images.length > 0 || scanState.results.length > 0 || scanState.batchReceipts !== null);

        if (hasContent) {
            savePersistedScanState(user.uid, scanState);
            clearLegacyBatchStorage(user.uid);
        } else if (scanState.phase === 'idle') {
            clearPersistedScanState(user.uid);
            clearLegacyBatchStorage(user.uid);
        }
    }, [user?.uid, scanState]);

    // Navigation guard - warn before closing with active transaction
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const hasActiveContent = scanState.phase !== 'idle' && (
                scanState.phase === 'scanning' ||
                scanState.results.length > 0 ||
                scanState.images.length > 0 ||
                scanState.batchReceipts !== null
            );

            if (hasActiveContent) {
                // Standard way to trigger browser's "Leave site?" dialog
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [scanState]);

    // Sync scanCurrency with user's default preference when it loads
    useEffect(() => {
        if (userPreferences.defaultCurrency) {
            setScanCurrency(userPreferences.defaultCurrency);
        }
    }, [userPreferences.defaultCurrency]);

    // Handle starting a new transaction (from camera button or + button)
    const handleNewTransaction = (autoOpenFilePicker: boolean) => {
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
        setScanCurrency(userPreferences.defaultCurrency || 'CLP');
        setCurrentTransaction(createDefaultTransaction());

        // Camera button opens file picker, manual "+" goes directly to editor
        if (autoOpenFilePicker) {
            navigateToTransactionEditor('new');
            setTimeout(() => fileInputRef.current?.click(), 200);
        } else {
            navigateToTransactionEditor('new');
        }
    };

    // Check if there's an active transaction that would conflict with a new action
    const hasActiveTransactionConflict = useCallback((): {
        hasConflict: boolean;
        conflictInfo?: { transaction: ConflictingTransaction; reason: ConflictReason };
    } => {
        if (scanState.phase === 'idle') {
            return { hasConflict: false };
        }

        // Already on transaction-editor = no conflict (editing same transaction)
        if (view === 'transaction-editor') {
            return { hasConflict: false };
        }

        const hasAnalyzedTransaction = scanState.results.length > 0;
        const hasImages = scanState.images.length > 0;
        const isScanning = scanState.phase === 'scanning';

        // Scanning in progress is a conflict
        if (isScanning) {
            const transaction = scanState.results[0];
            return {
                hasConflict: true,
                conflictInfo: {
                    transaction: {
                        merchant: transaction?.merchant,
                        total: transaction?.total,
                        currency: transaction?.currency,
                        creditUsed: true,
                        hasChanges: false,
                        isScanning: true,
                        source: 'new_scan',
                    },
                    reason: 'scan_in_progress',
                },
            };
        }

        // Analyzed transaction (credit was used) is a conflict
        if (hasAnalyzedTransaction && scanState.phase === 'reviewing') {
            const transaction = scanState.results[0];
            return {
                hasConflict: true,
                conflictInfo: {
                    transaction: {
                        merchant: transaction?.merchant,
                        total: transaction?.total,
                        currency: transaction?.currency,
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
    }, [scanState, view]);

    // Navigate to transaction editor with conflict detection
    const navigateToTransactionEditor = (mode: 'new' | 'existing', transaction?: Transaction | null) => {
        const conflictCheck = hasActiveTransactionConflict();
        const isEditingSameTransaction = mode === 'existing' && transaction?.id &&
            scanState.results.length > 0 && scanState.results[0]?.id === transaction.id;

        if (conflictCheck.hasConflict && conflictCheck.conflictInfo && !isEditingSameTransaction) {
            setConflictDialogData({
                conflictingTransaction: conflictCheck.conflictInfo.transaction,
                conflictReason: conflictCheck.conflictInfo.reason,
                pendingAction: { mode, transaction },
            });
            setShowConflictDialog(true);
            return;
        }

        // No conflict, proceed with navigation
        setIsViewingReadOnly(false);
        setCreditUsedInSession(false);
        setTransactionEditorMode(mode);
        if (transaction) {
            setCurrentTransaction(transaction as any);
        } else if (mode === 'new') {
            setCurrentTransaction(createDefaultTransaction());
        }
        navigateToView('transaction-editor');
    };

    // Navigate to read-only transaction view (from HistoryView clicks)
    // Optional allTransactionIds enables multi-transaction navigation from ItemsView
    const navigateToTransactionDetail = (transaction: Transaction, allTransactionIds?: string[]) => {
        setIsViewingReadOnly(true);
        setCreditUsedInSession(false);
        setTransactionEditorMode('existing');
        setCurrentTransaction(transaction);
        setTransactionNavigationList(allTransactionIds && allTransactionIds.length > 1 ? allTransactionIds : null);
        navigateToView('transaction-editor');
    };

    // Handle edit request from read-only view (performs conflict check)
    const handleRequestEditFromReadOnly = () => {
        const conflictCheck = hasActiveTransactionConflict();

        if (conflictCheck.hasConflict && conflictCheck.conflictInfo) {
            setConflictDialogData({
                conflictingTransaction: conflictCheck.conflictInfo.transaction,
                conflictReason: conflictCheck.conflictInfo.reason,
                pendingAction: { mode: 'existing', transaction: currentTransaction! },
            });
            setShowConflictDialog(true);
        } else {
            setIsViewingReadOnly(false);
        }
    };

    // Legacy scan handler for backward compatibility
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

        // Multi-image upload - show batch preview
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
    };

    /**
     * v9.7.0: Apply learned item name mappings to transaction items
     * Only applies when there's a merchant match (item mappings are scoped per-store).
     *
     * @param transaction - The transaction with items to process
     * @param normalizedMerchant - The normalized merchant name from the merchant mapping
     * @returns Object with updated transaction and list of applied mapping IDs
     */
    const applyItemNameMappings = useCallback((
        transaction: Transaction,
        normalizedMerchant: string
    ): { transaction: Transaction; appliedIds: string[] } => {
        const appliedIds: string[] = [];

        // Create new items array with learned names applied
        const updatedItems = transaction.items.map((item: TransactionItem): TransactionItem => {
            // Try to find a mapping for this item name at this merchant
            const match = findItemNameMatch(normalizedMerchant, item.name);

            // Only apply if confidence is high enough (matching merchant mapping threshold)
            if (match && match.confidence > 0.7) {
                // Track applied mapping ID for usage increment
                if (match.mapping.id) {
                    appliedIds.push(match.mapping.id);
                }

                // Return updated item with learned name (and optionally category)
                return {
                    ...item,
                    name: match.mapping.targetItemName,
                    // Apply learned category if mapping has one
                    ...(match.mapping.targetCategory && { category: match.mapping.targetCategory }),
                    // Mark as learned (consistent with merchantSource pattern)
                    categorySource: match.mapping.targetCategory ? 'learned' as const : item.categorySource
                };
            }

            // No match - return item unchanged
            return item;
        });

        return {
            transaction: {
                ...transaction,
                items: updatedItems
            },
            appliedIds
        };
    }, [findItemNameMatch]);

    const processScan = async (imagesToProcess?: string[]) => {
        // Fix: Accept images as parameter to avoid stale closure when called immediately after setState
        const images = imagesToProcess ?? scanImages;

        // Validate images before proceeding
        if (!images || images.length === 0) {
            console.error('processScan called with no images');
            setScanError(t('noImagesToScan') || 'No images to scan');
            return;
        }

        // Check if user has credits
        if (userCredits.remaining <= 0) {
            setScanError(t('noCreditsMessage'));
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        // Deduct credit immediately to prevent exploits (only restored on API error)
        const deducted = await deductUserCredits(1);
        if (!deducted) {
            setScanError(t('noCreditsMessage'));
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        setCreditUsedInSession(true);
        dispatchProcessStart('normal', 1);
        scanOverlay.startUpload();
        scanOverlay.setProgress(100);
        scanOverlay.startProcessing();

        try {
            // Timeout handling for network requests
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), PROCESSING_TIMEOUT_MS);
            });
            const result = await Promise.race([
                analyzeReceipt(
                    images,
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

            // Determine country and city - validate against our list, fall back to defaults
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

            // Map 'quantity' from AI to 'qty' field, default to 1
            const parsedItems = (result.items || []).map(i => ({
                ...i,
                price: parseStrictNumber(i.price),
                qty: (i as any).quantity ?? i.qty ?? 1,
            }));

            // Total validation: Check if extracted total matches items sum (>40% discrepancy)
            const tempTransaction: Transaction = {
                merchant: merchant,
                date: d,
                total: finalTotal,
                category: result.category || 'Other',
                items: parsedItems,
            };
            const totalValidation = validateTotal(tempTransaction);

            if (!totalValidation.isValid) {
                const dialogData: TotalMismatchDialogData = {
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
                };
                showScanDialog(DIALOG_TYPES.TOTAL_MISMATCH, dialogData);
                setIsAnalyzing(false);
                scanOverlay.setReady();
                return;
            }

            // Reconcile items total with receipt total (add adjustment item if needed)
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
                time: result.time,
                country: finalCountry,
                city: finalCity,
                currency: result.currency,
                receiptType: result.receiptType,
                promptVersion: result.promptVersion,
                merchantSource: result.merchantSource,
                ...(viewMode === 'group' && activeGroup?.id ? { sharedGroupIds: [activeGroup.id] } : {}),
            };

            // Apply learned category mappings (confidence > 0.7)
            const { transaction: categorizedTransaction, appliedMappingIds } =
                applyCategoryMappings(initialTransaction, mappings);

            // Increment usage count for applied mappings (fire-and-forget)
            if (appliedMappingIds.length > 0 && user && services) {
                appliedMappingIds.forEach(mappingId => {
                    incrementMappingUsage(services.db, user.uid, services.appId, mappingId)
                        .catch(err => console.error('Failed to increment mapping usage:', err));
                });
            }

            // Apply learned merchant→alias mapping (merchant = raw, alias = preferred display name)
            let finalTransaction = categorizedTransaction;
            const merchantMatch = findMerchantMatch(categorizedTransaction.merchant);
            if (merchantMatch && merchantMatch.confidence > 0.7) {
                finalTransaction = {
                    ...finalTransaction,
                    alias: merchantMatch.mapping.targetMerchant,
                    ...(merchantMatch.mapping.storeCategory && { category: merchantMatch.mapping.storeCategory }),
                    merchantSource: 'learned' as const
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

            // Currency auto-detection - show dialog if different from user's default
            const detectedCurrency = finalTransaction.currency;
            const userDefaultCurrency = userPreferences.defaultCurrency;

            if (detectedCurrency && userDefaultCurrency && detectedCurrency !== userDefaultCurrency) {
                const dialogData: CurrencyMismatchDialogData = {
                    detectedCurrency,
                    pendingTransaction: finalTransaction,
                    hasDiscrepancy: scanHasDiscrepancy,
                };
                showScanDialog(DIALOG_TYPES.CURRENCY_MISMATCH, dialogData);
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

            // No need for redundant injection here - transaction already has the group

            setCurrentTransaction(finalTransaction);

            // Check QuickSaveCard eligibility before state transition (prevents race condition)
            const merchantAlias = finalTransaction.alias || finalTransaction.merchant;
            const isTrusted = merchantAlias ? await checkTrusted(merchantAlias) : false;
            const willShowQuickSave = !isTrusted && shouldShowQuickSave(finalTransaction);

            if (willShowQuickSave || isTrusted) {
                setSkipScanCompleteModal(true);
            }

            dispatchProcessSuccess([finalTransaction]);
            scanOverlay.setReady();

            // Haptic feedback on scan success (only when motion enabled)
            if (!prefersReducedMotion && navigator.vibrate) {
                navigator.vibrate(50);
            }

            // Show warning if items total didn't match receipt total
            if (scanHasDiscrepancy) {
                setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
            }

            // Auto-save for trusted merchants
            if (isTrusted && services && user) {
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

                    setScanImages([]);
                    setCurrentTransaction(null);
                    setToastMessage({ text: t('autoSaved'), type: 'success' });
                    setView('dashboard');

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
                    const dialogData: QuickSaveDialogData = {
                        transaction: finalTransaction,
                        confidence: calculateConfidence(finalTransaction),
                    };
                    showScanDialog(DIALOG_TYPES.QUICKSAVE, dialogData);
                }
            } else if (willShowQuickSave) {
                // High confidence - Show Quick Save Card
                const dialogData: QuickSaveDialogData = {
                    transaction: finalTransaction,
                    confidence: calculateConfidence(finalTransaction),
                };
                showScanDialog(DIALOG_TYPES.QUICKSAVE, dialogData);
            } else {
                // Low confidence - stay on editor for manual review
                setAnimateEditViewItems(true);
            }
        } catch (e: any) {
            const errorMessage = 'Failed: ' + e.message;
            dispatchProcessError(errorMessage);
            const isTimeout = e.message?.includes('timed out');
            scanOverlay.setError(isTimeout ? 'timeout' : 'api', errorMessage);
            // Restore credit on API error only
            await addUserCredits(1);
            setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
        }
    };

    // Re-scan existing transaction with stored imageUrls
    const handleRescan = async () => {
        if (!currentTransaction?.id || !currentTransaction.imageUrls?.length) {
            console.error('Cannot rescan: no transaction or images');
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
    };

    const handleCancelBatchPreview = () => {
        setShowBatchPreview(false);
        setBatchImages([]);
    };

    // Credit warning dialog handlers (batch uses 1 super credit regardless of image count)
    const handleBatchConfirmWithCreditCheck = () => {
        const result = checkCreditSufficiency(userCredits, 1, true);
        setCreditCheckResult(result);
        setShowCreditWarning(true);
    };

    // Batch processing with parallel execution
    const handleCreditWarningConfirm = async () => {
        setShowCreditWarning(false);
        setCreditCheckResult(null);
        setShowBatchPreview(false);

        // Navigate to batch-review immediately to show processing progress
        setView('batch-review');
        dispatchProcessStart('super', 1);

        await batchProcessing.startProcessing(
            batchImages,
            scanCurrency,
            scanStoreType !== 'auto' ? scanStoreType : undefined,
            {
                onItemStart: dispatchBatchItemStart,
                onItemSuccess: dispatchBatchItemSuccess,
                onItemError: dispatchBatchItemError,
                onComplete: (processingResults, imageUrls) => {
                    // Add sharedGroupIds to each successful result if in group mode
                    let taggedResults = processingResults;
                    if (viewMode === 'group' && activeGroup?.id) {
                        taggedResults = processingResults.map(result => {
                            if (result.success && result.result) {
                                return {
                                    ...result,
                                    result: {
                                        ...result.result,
                                        sharedGroupIds: [activeGroup.id!],
                                    },
                                };
                            }
                            return result;
                        });
                    }
                    const receipts = createBatchReceiptsFromResults(taggedResults, imageUrls);
                    dispatchBatchComplete(receipts);
                },
            }
        );

    };

    const handleCreditWarningCancel = () => {
        setShowCreditWarning(false);
        setCreditCheckResult(null);
    };

    const handleReduceBatch = () => {
        if (!creditCheckResult) return;
        const maxProcessable = creditCheckResult.maxProcessable;
        setBatchImages(prev => prev.slice(0, maxProcessable));
        setShowCreditWarning(false);
        const newResult = checkCreditSufficiency(userCredits, 1, true);
        setCreditCheckResult(newResult);
        setShowCreditWarning(true);
    };

    // Batch review handlers
    const handleBatchEditReceipt = (receipt: BatchReceipt, batchIndex: number, _batchTotal: number, _allReceipts: BatchReceipt[]) => {
        setBatchEditingIndexContext(batchIndex - 1);
        const transactionWithThumbnail = receipt.imageUrl
            ? { ...receipt.transaction, thumbnailUrl: receipt.imageUrl }
            : receipt.transaction;
        setCurrentTransaction(transactionWithThumbnail);
        setTransactionEditorMode('existing');
        navigateToView('transaction-editor');
    };

    const handleBatchPrevious = () => {
        const batchReceipts = scanState.batchReceipts;
        const currentIndex = scanState.batchEditingIndex;
        if (!batchReceipts || currentIndex === null || currentIndex <= 0) return;
        const prevIndex = currentIndex - 1;
        const prevReceipt = batchReceipts[prevIndex];
        if (prevReceipt) {
            setBatchEditingIndexContext(prevIndex);
            const transactionWithThumbnail = prevReceipt.imageUrl
                ? { ...prevReceipt.transaction, thumbnailUrl: prevReceipt.imageUrl }
                : prevReceipt.transaction;
            setCurrentTransaction(transactionWithThumbnail);
        }
    };

    const handleBatchNext = () => {
        const batchReceipts = scanState.batchReceipts;
        const currentIndex = scanState.batchEditingIndex;
        if (!batchReceipts || currentIndex === null || currentIndex >= batchReceipts.length - 1) return;
        const nextIndex = currentIndex + 1;
        const nextReceipt = batchReceipts[nextIndex];
        if (nextReceipt) {
            setBatchEditingIndexContext(nextIndex);
            const transactionWithThumbnail = nextReceipt.imageUrl
                ? { ...nextReceipt.transaction, thumbnailUrl: nextReceipt.imageUrl }
                : nextReceipt.transaction;
            setCurrentTransaction(transactionWithThumbnail);
        }
    };

    // Transaction list navigation (from ItemsView aggregated item)
    const handleTransactionListPrevious = () => {
        if (!transactionNavigationList || !currentTransaction?.id) return;
        const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
        if (currentIndex <= 0) return;
        const prevId = transactionNavigationList[currentIndex - 1];
        const prevTx = transactions.find(t => t.id === prevId);
        if (prevTx) {
            setCurrentTransaction(prevTx);
        }
    };

    const handleTransactionListNext = () => {
        if (!transactionNavigationList || !currentTransaction?.id) return;
        const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
        if (currentIndex < 0 || currentIndex >= transactionNavigationList.length - 1) return;
        const nextId = transactionNavigationList[currentIndex + 1];
        const nextTx = transactions.find(t => t.id === nextId);
        if (nextTx) {
            setCurrentTransaction(nextTx);
        }
    };

    // ==========================================================================
    // TransactionEditorView callback handlers
    // ==========================================================================

    // Handle transaction update from editor (for UI state + batch context sync)
    const handleEditorUpdateTransaction = useCallback((trans: Transaction) => {
        setCurrentTransaction(trans as any);
        // Sync with batch context if editing a batch receipt
        if (scanState.batchEditingIndex !== null && scanState.batchReceipts) {
            const receiptId = scanState.batchReceipts[scanState.batchEditingIndex]?.id;
            if (receiptId) {
                updateBatchReceiptContext(receiptId, { transaction: trans as any });
            }
        }
    }, [scanState.batchEditingIndex, scanState.batchReceipts, updateBatchReceiptContext]);

    // Handle save from editor
    const handleEditorSave = useCallback(async (trans: Transaction) => {
        if (isTransactionSaving) return;
        setIsTransactionSaving(true);
        try {
            await saveTransaction(trans);
            setScanImages([]);
            setScanError(null);
            setCurrentTransaction(null);
            setIsViewingReadOnly(false);
            setCreditUsedInSession(false);
            setTransactionNavigationList(null);
        } finally {
            setIsTransactionSaving(false);
        }
    }, [isTransactionSaving, saveTransaction, setScanImages, setScanError]);

    // Handle cancel from editor
    const handleEditorCancel = useCallback(() => {
        setScanImages([]);
        setScanError(null);
        setCurrentTransaction(null);
        setAnimateEditViewItems(false);
        setIsViewingReadOnly(false);
        setCreditUsedInSession(false);
        setTransactionNavigationList(null);
        if (scanState.batchEditingIndex !== null) {
            setBatchEditingIndexContext(null);
            setView('batch-review');
        } else {
            navigateBack();
        }
    }, [setScanImages, setScanError, scanState.batchEditingIndex, setBatchEditingIndexContext, navigateBack]);

    // Handle photo select from editor
    const handleEditorPhotoSelect = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setScanImages([base64]);
        };
        reader.readAsDataURL(file);
    }, [setScanImages]);

    // Handle process scan from editor
    const handleEditorProcessScan = useCallback(() => {
        processScan();
    }, [processScan]);

    // Handle retry from editor
    const handleEditorRetry = useCallback(() => {
        setScanError(null);
        processScan();
    }, [setScanError, processScan]);

    // Handle rescan from editor (existing transactions only)
    const handleEditorRescan = useMemo(() => {
        return transactionEditorMode === 'existing' ? async () => {
            await handleRescan();
        } : undefined;
    }, [transactionEditorMode, handleRescan]);

    // Handle delete from editor (existing transactions only)
    const handleEditorDelete = useMemo(() => {
        return transactionEditorMode === 'existing' ? deleteTransaction : undefined;
    }, [transactionEditorMode, deleteTransaction]);

    // Handle batch previous from editor (conditional)
    const handleEditorBatchPrevious = useMemo(() => {
        if (scanState.batchEditingIndex !== null) {
            return handleBatchPrevious;
        }
        if (transactionNavigationList) {
            return handleTransactionListPrevious;
        }
        return undefined;
    }, [scanState.batchEditingIndex, transactionNavigationList, handleBatchPrevious, handleTransactionListPrevious]);

    // Handle batch next from editor (conditional)
    const handleEditorBatchNext = useMemo(() => {
        if (scanState.batchEditingIndex !== null) {
            return handleBatchNext;
        }
        if (transactionNavigationList) {
            return handleTransactionListNext;
        }
        return undefined;
    }, [scanState.batchEditingIndex, transactionNavigationList, handleBatchNext, handleTransactionListNext]);

    // Handle batch mode click from editor
    const handleEditorBatchModeClick = useCallback(() => {
        if (user?.uid) {
            startBatchScanContext(user.uid);
        }
        navigateToView('batch-capture');
    }, [user?.uid, startBatchScanContext, navigateToView]);

    // Handle groups change from editor (complex cache update logic)
    const handleEditorGroupsChange = useCallback(async (groupIds: string[]) => {
        if (!user?.uid || !currentTransaction) return;

        const previousGroupIds = currentTransaction.sharedGroupIds || [];

        if (import.meta.env.DEV) {
            console.log('[App] onGroupsChange:', {
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
            console.warn('[App] Failed to update memberUpdates:', err);
        });

        // Groups the transaction was REMOVED from
        const removedFromGroups = previousGroupIds.filter(id => !groupIds.includes(id));
        // Groups the transaction was ADDED to
        const addedToGroups = groupIds.filter(id => !previousGroupIds.includes(id));

        // Optimistic cache update for affected groups
        const affectedGroupIds = new Set([...previousGroupIds, ...groupIds]);

        if (import.meta.env.DEV) {
            console.log('[App] Clearing cache for groups:', Array.from(affectedGroupIds));
        }

        const updateCachesForGroup = (groupId: string) => {
            queryClient.setQueriesData(
                { queryKey: ['sharedGroupTransactions', groupId], exact: false },
                (oldData: Transaction[] | undefined) => {
                    if (!oldData || !currentTransaction.id) return oldData;

                    if (removedFromGroups.includes(groupId)) {
                        const filtered = oldData.filter(tx => tx.id !== currentTransaction.id);
                        if (import.meta.env.DEV) {
                            console.log(`[App] Optimistic update: removed txn from group ${groupId}`, {
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
                            console.log(`[App] Optimistic update: added txn to group ${groupId}`);
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
    // Batch review handlers
    // ==========================================================================

    // Back from batch review - show confirmation if results exist (credit spent)
    const handleBatchReviewBack = () => {
        if (hasBatchReceipts) {
            showScanDialog(DIALOG_TYPES.BATCH_DISCARD, {});
            return;
        }
        setBatchImages([]);
        batchProcessing.reset();
        resetScanContext();
        setView('dashboard');
    };

    // Confirm discard batch results
    const handleBatchDiscardConfirm = () => {
        dismissScanDialog();
        setBatchImages([]);
        batchProcessing.reset();
        resetScanContext();
        setView('dashboard');
    };

    const handleBatchDiscardCancel = () => {
        dismissScanDialog();
    };

    // Save all complete - show batch complete modal if transactions were saved
    const handleBatchSaveComplete = async (_savedTransactionIds: string[], savedTransactions: Transaction[]) => {
        setBatchImages([]);
        batchProcessing.reset();
        resetScanContext();

        if (savedTransactions.length > 0) {
            const dialogData: BatchCompleteDialogData = {
                transactions: savedTransactions,
                creditsUsed: 1, // Batch uses 1 super credit regardless of transaction count
            };
            showScanDialog(DIALOG_TYPES.BATCH_COMPLETE, dialogData);
        }
        setView('dashboard');
    };

    // Handle save transaction for batch review
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
        // v9.6.1: Also apply learned store category if present
        let finalTx = categorizedTx;
        const merchantMatch = findMerchantMatch(categorizedTx.merchant);
        if (merchantMatch && merchantMatch.confidence > 0.7) {
            finalTx = {
                ...finalTx,
                alias: merchantMatch.mapping.targetMerchant,
                // v9.6.1: Apply learned store category
                ...(merchantMatch.mapping.storeCategory && { category: merchantMatch.mapping.storeCategory }),
                merchantSource: 'learned' as const
            };
            if (merchantMatch.mapping.id) {
                incrementMerchantMappingUsage(db, user.uid, appId, merchantMatch.mapping.id)
                    .catch(err => console.error('Failed to increment merchant mapping usage:', err));
            }

            // v9.7.0: Apply learned item name mappings (scoped to this merchant)
            const { transaction: txWithItemNames, appliedIds: itemNameMappingIds } = applyItemNameMappings(
                finalTx,
                merchantMatch.mapping.normalizedMerchant
            );
            finalTx = txWithItemNames;

            // Increment item name mapping usage counts (fire-and-forget)
            if (itemNameMappingIds.length > 0) {
                itemNameMappingIds.forEach(id => {
                    incrementItemNameMappingUsage(db, user.uid, appId, id)
                        .catch(err => console.error('Failed to increment item name mapping usage:', err));
                });
            }
        }

        // Save transaction
        const transactionId = await firestoreAddTransaction(db, user.uid, appId, finalTx);

        // Fire-and-forget to not block batch save performance
        if (finalTx.sharedGroupIds && finalTx.sharedGroupIds.length > 0) {
            updateMemberTimestampsForTransaction(
                db,
                user.uid,
                finalTx.sharedGroupIds,
                [] // No previous groups for new transactions
            ).catch(err => {
                console.warn('[App] Failed to update memberUpdates for batch save:', err);
            });
        }

        return transactionId;
    };

    // Remove image from batch (if 1 left, switch to single image flow)
    const handleRemoveBatchImage = (index: number) => {
        setBatchImages(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (updated.length === 1) {
                setShowBatchPreview(false);
                setScanImages(updated);
                setTransactionEditorMode('new');
                navigateToView('transaction-editor');
                return [];
            }
            return updated;
        });
    };

    // Trust prompt handlers
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

    // isDark needed for modal inline styles
    const isDark = theme === 'dark';

    // Scan status for Nav icon indicator ('processing' | 'ready' | 'idle')
    const scanStatus: ScanStatus = batchProcessing.isProcessing
        ? 'processing'
        : scanState.phase === 'scanning'
            ? 'processing'
            : hasBatchReceipts
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
        if (colorTheme !== 'normal') {
            html.setAttribute('data-theme', colorTheme);
        } else {
            html.removeAttribute('data-theme');
        }
        html.setAttribute('data-font', fontFamily);
        if (fontSize === 'normal') {
            html.setAttribute('data-font-size', fontSize);
        } else {
            html.removeAttribute('data-font-size');
        }
    }

    // ==========================================================================
    // Computed values and composition hooks (MUST be before early returns for hooks)
    // ==========================================================================

    // Recently added transactions for dashboard (sorted by createdAt)
    // Bug Fix: Use recentScans (sorted by createdAt from Firestore) instead of transactions
    // The recentScans query is specifically ordered by createdAt desc and includes receipts
    // with old transaction dates that wouldn't appear in the top 100 by date
    const recentlyAddedTransactions = recentScans.slice(0, 5);

    // When in group mode, use shared group transactions; otherwise use personal transactions
    const isGroupMode = viewMode === 'group' && !!activeGroup;
    // sharedGroupTransactions is date-filtered (current month), rawTransactions has all data
    // Use Array.isArray check to handle any non-array value (undefined, null, or unexpected type)
    const safeSharedGroupRawTransactions = Array.isArray(sharedGroupRawTransactions)
        ? sharedGroupRawTransactions
        : [];
    const activeTransactions = isGroupMode ? safeSharedGroupRawTransactions : transactions;
    // This ensures recently scanned receipts appear first (consistent with personal mode behavior)
    const activeRecentTransactions = isGroupMode
        ? [...safeSharedGroupRawTransactions]
            .sort((a, b) => {
                // Sort by createdAt descending (most recently scanned first)
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
            .slice(0, 5)
        : recentlyAddedTransactions;           // Personal mode: use createdAt-sorted

    // ==========================================================================
    // View Props Composition Hooks (data props - handlers come from ViewHandlersContext)
    // ==========================================================================

    const historyViewDataProps = useHistoryViewProps({
        // Core data
        transactions: isGroupMode ? sharedGroupTransactions : transactionsWithRecentScans,
        transactionsWithRecentScans: isGroupMode ? safeSharedGroupRawTransactions : transactionsWithRecentScans,
        // User info
        user: {
            displayName: user?.displayName || null,
            email: user?.email || null,
            uid: user?.uid || null,
        },
        appId: services?.appId || '',
        // UI settings
        theme: theme as 'light' | 'dark',
        colorTheme,
        currency,
        dateFormat,
        lang,
        t,
        formatCurrency,
        formatDate: formatDate as (date: string, format: string) => string,
        fontColorMode,
        foreignLocationFormat: userPreferences.foreignLocationFormat || 'flag',
        // Location defaults
        defaultCity,
        defaultCountry,
        // Group-related
        activeGroup: activeGroup ? {
            id: activeGroup.id ?? '',
            memberProfiles: activeGroup.memberProfiles,
        } : undefined,
        isGroupMode,
        isAtListenerLimit,
        // Filter state
        pendingFilters: pendingHistoryFilters,
        // Pagination
        pagination: {
            hasMore: isGroupMode ? false : hasMoreTransactions,
            isLoading: isGroupMode ? false : loadingMoreTransactions,
        },
        loadMoreTransactions,
        // Callbacks
        onEditTransaction: (tx) => navigateToTransactionDetail(tx as Transaction),
        onTransactionsDeleted: undefined, // HistoryView handles internally via Firestore
    });

    const trendsViewDataProps = useTrendsViewProps({
        transactions: activeTransactions,
        user: {
            displayName: user?.displayName || null,
            email: user?.email || null,
            uid: user?.uid || null,
        },
        appId: services?.appId || '',
        theme: theme as 'light' | 'dark',
        colorTheme,
        currency,
        locale: lang,
        t,
        fontColorMode,
        exporting,
        initialDistributionView: pendingDistributionView || undefined,
        isGroupMode,
        groupName: activeGroup?.name,
        groupMembers: activeGroup?.memberProfiles
            ? Object.entries(activeGroup.memberProfiles).map(([uid, profile]) => ({
                uid,
                displayName: profile.displayName,
                email: profile.email,
            }))
            : [],
        spendingByMember: Object.fromEntries(sharedGroupSpendingByMember),
        onEditTransaction: (transaction) => navigateToTransactionEditor('existing', transaction),
        onExporting: setExporting,
        onUpgradeRequired: () => setToastMessage({ text: t('upgradeRequired'), type: 'info' }),
    });

    const batchReviewViewDataProps = useBatchReviewViewProps({
        processingResults: batchProcessing.results,
        imageDataUrls: batchImages,
        theme: theme as 'light' | 'dark',
        currency,
        t,
        processingState: batchProcessing.isProcessing ? {
            isProcessing: true,
            progress: batchProcessing.progress,
            states: batchProcessing.states,
            onCancelProcessing: batchProcessing.cancel,
        } : undefined,
        credits: userCredits ? {
            remaining: userCredits.remaining,
            superRemaining: userCredits.superRemaining,
        } : undefined,
        onEditReceipt: handleBatchEditReceipt,
        onCancel: handleBatchReviewBack,
        onSaveComplete: handleBatchSaveComplete,
        saveTransaction: handleBatchSaveTransaction,
    });

    const transactionEditorViewProps = useTransactionEditorViewProps({
        user,
        currentTransaction,
        transactionEditorMode,
        isViewingReadOnly,
        transactionNavigationList,
        scanState: {
            phase: scanState.phase,
            images: scanState.images,
            batchEditingIndex: scanState.batchEditingIndex,
            batchReceipts: scanState.batchReceipts,
        },
        isAnalyzing,
        scanError,
        skipScanCompleteModal,
        isRescanning,
        activeGroup: activeGroup ? {
            memberProfiles: activeGroup.memberProfiles,
        } : null,
        availableGroups: availableGroupsForSelector,
        groupsLoading: sharedGroupsLoading,
        userCredits,
        userPreferences: {
            defaultCity,
            defaultCountry,
        },
        distinctAliases,
        itemNameMappings,
        theme: theme as 'light' | 'dark',
        t,
        formatCurrency,
        currency,
        lang,
        storeCategories: STORE_CATEGORIES as unknown as string[],
        isSaving: isTransactionSaving,
        animateItems: animateEditViewItems,
        creditUsedInSession,
        onUpdateTransaction: handleEditorUpdateTransaction,
        onSave: handleEditorSave,
        onCancel: handleEditorCancel,
        onPhotoSelect: handleEditorPhotoSelect,
        onProcessScan: handleEditorProcessScan,
        onRetry: handleEditorRetry,
        onRescan: handleEditorRescan,
        onDelete: handleEditorDelete,
        onSaveMapping: saveMapping,
        onSaveMerchantMapping: saveMerchantMapping,
        onSaveSubcategoryMapping: saveSubcategoryMapping,
        onSaveItemNameMapping: saveItemNameMapping,
        onBatchPrevious: handleEditorBatchPrevious,
        onBatchNext: handleEditorBatchNext,
        onBatchModeClick: handleEditorBatchModeClick,
        onGroupsChange: handleEditorGroupsChange,
        onRequestEdit: handleRequestEditFromReadOnly,
    });

    const dashboardViewProps = useDashboardViewProps({
        // Core data
        transactions: activeRecentTransactions as any,
        allTransactions: activeTransactions as any,
        recentScans: activeRecentTransactions as any,
        // User info
        userId: user?.uid || null,
        appId: services?.appId || '',
        // UI settings
        theme,
        colorTheme,
        currency,
        dateFormat,
        lang,
        t,
        formatCurrency,
        formatDate: formatDate as (date: string, format: string) => string,
        getSafeDate,
        fontColorMode,
        // Location defaults
        defaultCountry,
        foreignLocationFormat: userPreferences.foreignLocationFormat || 'flag',
        // Callbacks
        onCreateNew: () => handleNewTransaction(false),
        onViewTrends: (month: string | null) => {
            if (month) {
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
                setAnalyticsInitialState(null);
            }
            setView('trends');
        },
        onEditTransaction: (transaction: any) => {
            navigateToTransactionDetail(transaction as Transaction);
        },
        onTriggerScan: triggerScan,
        onViewRecentScans: () => setView('recent-scans'),
    });

    // Clear all learned data handler
    const handleClearAllLearnedData = useCallback(async () => {
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

        // Phase 5: Delete all item name mappings
        for (const mapping of itemNameMappings) {
            if (mapping.id) {
                deletePromises.push(deleteItemNameMapping(mapping.id));
            }
        }

        await Promise.all(deletePromises);
        setToastMessage({ text: t('clearAllLearnedDataSuccess') || 'All learned data cleared', type: 'success' });
    }, [
        mappings, deleteMapping,
        merchantMappings, deleteMerchantMapping,
        subcategoryMappings, deleteSubcategoryMapping,
        trustedMerchants, removeTrust,
        itemNameMappings, deleteItemNameMapping,
        setToastMessage, t
    ]);

    const settingsViewProps = useSettingsViewProps({
        // Core settings
        lang,
        currency,
        dateFormat,
        theme,
        wiping,
        exporting,
        t,
        onSetLang: (l: string) => setLang(l as Language),
        onSetCurrency: (c: string) => setCurrency(c as Currency),
        onSetDateFormat: (f: string) => setDateFormat(f as 'LatAm' | 'US'),
        onSetTheme: (th: string) => setTheme(th as Theme),
        onExportAll: handleExportData,
        onWipeDB: wipeDB,
        onSignOut: signOut,
        // Category mappings
        mappings,
        mappingsLoading,
        onDeleteMapping: deleteMapping,
        onEditMapping: (id, cat) => updateCategoryMapping(id, cat as StoreCategory),
        // Color theme
        colorTheme,
        onSetColorTheme: (ct: string) => setColorTheme(ct as ColorTheme),
        // Font color mode
        fontColorMode,
        onSetFontColorMode: (mode: string) => setFontColorMode(mode as FontColorMode),
        // Font family
        fontFamily,
        onSetFontFamily: (ff: string) => setFontFamilyPref(ff as 'outfit' | 'space'),
        // Font size
        fontSize,
        onSetFontSize: (fs: string) => setFontSize(fs as FontSize),
        // Default location
        defaultCountry,
        defaultCity,
        onSetDefaultCountry: setDefaultCountryPref,
        onSetDefaultCity: setDefaultCityPref,
        // Merchant mappings
        merchantMappings,
        merchantMappingsLoading,
        onDeleteMerchantMapping: deleteMerchantMapping,
        onEditMerchantMapping: updateMerchantMapping,
        // Default scan currency
        defaultScanCurrency: userPreferences.defaultCurrency,
        onSetDefaultScanCurrency: setDefaultScanCurrencyPref,
        // Foreign location format
        foreignLocationFormat: userPreferences.foreignLocationFormat || 'flag',
        onSetForeignLocationFormat: setForeignLocationFormatPref,
        // Subcategory mappings
        subcategoryMappings,
        subcategoryMappingsLoading,
        onDeleteSubcategoryMapping: deleteSubcategoryMapping,
        onUpdateSubcategoryMapping: updateSubcategoryMapping,
        // Firebase context
        db: services?.db || null,
        userId: user?.uid || null,
        appId: services?.appId || null,
        // Trusted merchants
        trustedMerchants,
        trustedMerchantsLoading,
        onRevokeTrust: removeTrust,
        // Item name mappings
        itemNameMappings,
        itemNameMappingsLoading,
        onDeleteItemNameMapping: deleteItemNameMapping,
        onUpdateItemNameMapping: updateItemNameMapping,
        // Clear all learned data
        onClearAllLearnedData: handleClearAllLearnedData,
        // Profile editing
        userEmail: user?.email || '',
        displayName: userPreferences.displayName || user?.displayName || '',
        phoneNumber: userPreferences.phoneNumber || '',
        birthDate: userPreferences.birthDate || '',
        onSetDisplayName: setDisplayNamePref,
        onSetPhoneNumber: setPhoneNumberPref,
        onSetBirthDate: setBirthDatePref,
        // Subscription info
        plan: 'freemium',
        creditsRemaining: userCredits.remaining,
        superCreditsRemaining: userCredits.superRemaining,
        // Controlled subview state
        currentSubview: settingsSubview,
        onSubviewChange: setSettingsSubview,
    });

    // ItemsView data props composition
    const itemsViewProps = useItemsViewProps({
        // Core data
        transactions: activeTransactions as any,
        // User info
        userId: user?.uid || null,
        appId: services?.appId || '',
        userName: user?.displayName || '',
        userEmail: user?.email || '',
        // UI settings
        theme,
        colorTheme,
        currency,
        dateFormat,
        lang,
        t,
        formatCurrency,
        formatDate: formatDate as any,
        fontColorMode,
        // Location defaults
        defaultCountry,
        onEditTransaction: (transactionId, allTransactionIds) => {
            const tx = activeTransactions.find(t => t.id === transactionId);
            if (tx) {
                navigateToTransactionDetail(tx as Transaction, allTransactionIds);
            }
        },
    });

    // =========================================================================
    // Early returns for loading/error states
    // These come AFTER hooks to satisfy React's rules of hooks
    // =========================================================================

    if (initError) {
        return <div className="p-10 text-center text-red-500 font-bold">Error: {initError}</div>;
    }

    if (!user) {
        return <LoginScreen onSignIn={signIn} onTestSignIn={() => signInWithTestCredentials()} t={t} />;
    }

    return (
        // ScanProvider is in main.tsx - App uses useScan() directly
        <>
            {/* All overlays (scan, quick-save, insights, session, dialogs) */}
            <AppOverlays
                // Core dependencies
                currentView={view}
                lang={lang}
                theme={theme as 'light' | 'dark'}
                t={t}
                // ScanContext state
                scanState={scanState}
                scanOverlay={scanOverlay}
                isAnalyzing={isAnalyzing}
                scanImages={scanImages}
                // Scan overlay handlers
                onScanOverlayCancel={handleScanOverlayCancel}
                onScanOverlayRetry={handleScanOverlayRetry}
                onScanOverlayDismiss={handleScanOverlayDismiss}
                // QuickSaveCard props
                onQuickSave={handleQuickSave}
                onQuickSaveEdit={handleQuickSaveEdit}
                onQuickSaveCancel={handleQuickSaveCancel}
                onQuickSaveComplete={handleQuickSaveComplete}
                isQuickSaving={isQuickSaving}
                currency={currency}
                formatCurrency={formatCurrency}
                userDefaultCountry={defaultCountry}
                activeGroupForQuickSave={viewMode === 'group' && activeGroup ? {
                    id: activeGroup.id!,
                    name: activeGroup.name,
                    color: activeGroup.color,
                    icon: activeGroup.icon || undefined,
                } : null}
                // Insight card props
                showInsightCard={showInsightCard}
                currentInsight={currentInsight}
                onInsightDismiss={() => {
                    setShowInsightCard(false);
                    if (sessionContext) {
                        setShowSessionComplete(true);
                    }
                }}
                // Session complete props
                showSessionComplete={showSessionComplete}
                sessionContext={sessionContext}
                onSessionCompleteDismiss={() => {
                    setShowSessionComplete(false);
                    setSessionContext(null);
                }}
                onSessionCompleteAction={(action: SessionAction) => {
                    switch (action) {
                        case 'analytics':
                            setView('trends');
                            break;
                        case 'scan':
                            setView('dashboard');
                            break;
                        case 'history': {
                            const now = new Date();
                            const year = String(now.getFullYear());
                            const month = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                            handleNavigateToHistory({
                                temporal: {
                                    level: 'month',
                                    year,
                                    month,
                                },
                            });
                            break;
                        }
                    }
                }}
                // Personal record banner props
                showRecordBanner={showRecordBanner}
                recordToCelebrate={recordToCelebrate}
                onRecordDismiss={dismissRecord}
                // Credit warning dialog props
                showCreditWarning={showCreditWarning}
                creditCheckResult={creditCheckResult}
                batchImageCount={batchImages.length}
                onCreditWarningConfirm={handleCreditWarningConfirm}
                onCreditWarningCancel={handleCreditWarningCancel}
                onReduceBatch={handleReduceBatch}
                // Batch summary props
                showBatchSummary={showBatchSummary}
                batchSession={batchSession}
                transactions={transactions}
                insightCache={insightCache}
                onBatchSummarySilence={() => {
                    const newCache = isInsightsSilenced(insightCache)
                        ? clearSilence(insightCache)
                        : silenceInsights(insightCache, 4);
                    setLocalCache(newCache);
                }}
                onBatchSummaryDismiss={() => {
                    setShowBatchSummary(false);
                    clearBatch();
                    setView('dashboard');
                }}
                // Trust merchant prompt props
                showTrustPrompt={showTrustPrompt}
                trustPromptData={trustPromptData}
                onAcceptTrust={handleAcceptTrust}
                onDeclineTrust={handleDeclineTrust}
                // Currency/Total mismatch dialog props
                userCurrency={userPreferences.defaultCurrency || 'CLP'}
                onCurrencyUseDetected={handleCurrencyUseDetected}
                onCurrencyUseDefault={handleCurrencyUseDefault}
                onCurrencyMismatchCancel={handleCurrencyMismatchCancel}
                onTotalUseItemsSum={handleTotalUseItemsSum}
                onTotalKeepOriginal={handleTotalKeepOriginal}
                onTotalMismatchCancel={handleTotalMismatchCancel}
                // Transaction conflict dialog props
                showConflictDialog={showConflictDialog}
                conflictDialogData={conflictDialogData}
                onConflictClose={handleConflictClose}
                onConflictViewCurrent={handleConflictViewCurrent}
                onConflictDiscard={handleConflictDiscard}
                // Batch complete modal props
                userCreditsRemaining={userCredits.superRemaining ?? 0}
                onBatchCompleteDismiss={dismissScanDialog}
                onBatchCompleteNavigateToHistory={(payload) => {
                    dismissScanDialog();
                    handleNavigateToHistory(payload);
                }}
                onBatchCompleteGoHome={() => {
                    dismissScanDialog();
                    setView('dashboard');
                }}
                // Utility functions
                getLastWeekTotal={getLastWeekTotal}
                isInsightsSilenced={isInsightsSilenced}
            />
            {/* Story 14e-4: Centralized modal rendering via ModalManager */}
            <ModalManager />
            {/* AppLayout provides app shell with theme classes */}
            <AppLayout theme={theme} colorTheme={colorTheme}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
            />

            {/* Views that manage their own headers are excluded via shouldShowTopHeader() */}
            {shouldShowTopHeader(view) && (
                <TopHeader
                    variant={
                        view === 'settings' ? 'settings' :
                        'home'
                    }
                    viewTitle={
                        view === 'dashboard' ? 'gastify' :
                        undefined
                    }
                    title={undefined}
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
                        undefined
                    }
                    onMenuClick={() => setView('settings')}
                    onNavigateToView={(targetView) => navigateToView(targetView as View)}
                    userName={user?.displayName || ''}
                    userEmail={user?.email || ''}
                    theme={theme}
                    t={t}
                    onLogoClick={() => setShowViewModeSwitcher(true)}
                    viewMode={viewMode}
                    activeGroup={activeGroup ? {
                        id: activeGroup.id!,
                        name: activeGroup.name,
                        icon: activeGroup.icon || undefined,
                        color: activeGroup.color,
                        members: activeGroup.members,
                    } : undefined}
                />
            )}

            {view !== 'settings' && (
                <div className="fixed top-0 left-4 z-[60]" style={{ marginTop: 'calc(72px + max(env(safe-area-inset-top, 0px), 8px))' }}>
                    <ViewModeSwitcher
                        isOpen={showViewModeSwitcher}
                        onClose={() => setShowViewModeSwitcher(false)}
                        groups={userSharedGroups}
                        isLoading={sharedGroupsLoading}
                        t={t}
                    />
                </div>
            )}

            {/* Main content area:
              * - Full-screen views (history, trends, reports, etc.) manage their own headers/padding
              * - Other views get default padding (p-3) with nav bar allowance (pb-24)
              * - ref enables scroll position management
              */}
            <main
                ref={mainRef}
                className={`flex-1 overflow-y-auto ${(view === 'reports' || view === 'history' || view === 'items' || view === 'trends' || view === 'scan-result' || view === 'edit' || view === 'transaction-editor' || view === 'batch-capture' || view === 'batch-review' || view === 'statement-scan' || view === 'recent-scans' || view === 'insights' || view === 'alerts') ? '' : 'p-3'}`}
                style={{
                    paddingBottom: (view === 'reports' || view === 'history' || view === 'items' || view === 'trends' || view === 'scan-result' || view === 'edit' || view === 'transaction-editor' || view === 'batch-capture' || view === 'batch-review' || view === 'statement-scan' || view === 'recent-scans' || view === 'insights' || view === 'alerts') ? '0' : 'calc(6rem + var(--safe-bottom, 0px))',
                    paddingTop: (view === 'history' || view === 'items' || view === 'reports' || view === 'trends' || view === 'scan-result' || view === 'edit' || view === 'transaction-editor' || view === 'batch-capture' || view === 'batch-review' || view === 'statement-scan' || view === 'recent-scans' || view === 'insights' || view === 'alerts')
                        ? '0'
                        : 'calc(5rem + env(safe-area-inset-top, 0px))'
                }}
            >
                {/* ViewHandlersProvider provides handler bundles via context.
                  * Views use useViewHandlers() to access handlers directly.
                  */}
                <ViewHandlersProvider
                    transaction={transactionHandlers}
                    scan={scanHandlers}
                    navigation={navigationHandlers}
                    dialog={dialogHandlers}
                >
                {view === 'dashboard' && (
                    <HistoryFiltersProvider>
                        <DashboardView {...dashboardViewProps} />
                    </HistoryFiltersProvider>
                )}

                {/* TransactionEditorView - Unified transaction editor */}
                {view === 'transaction-editor' && (
                    <TransactionEditorView
                        key={scanState.batchEditingIndex !== null ? `batch-${scanState.batchEditingIndex}` : 'single'}
                        {...transactionEditorViewProps}
                    />
                )}

                {/* TrendsView with filters and analytics providers */}
                {view === 'trends' && (
                    <HistoryFiltersProvider>
                        <AnalyticsProvider
                            key={analyticsInitialState ? JSON.stringify(analyticsInitialState.temporal) : 'default'}
                            initialState={analyticsInitialState ?? undefined}
                        >
                            <TrendsView
                                {...trendsViewDataProps}
                                spendingByMember={new Map(Object.entries(trendsViewDataProps.spendingByMember))}
                            />
                        </AnalyticsProvider>
                    </HistoryFiltersProvider>
                )}

                {/* InsightsView - insight history with inline header */}
                {view === 'insights' && renderInsightsView({
                    onBack: () => setView('dashboard'),
                    onEditTransaction: (transactionId: string) => {
                        const tx = transactions.find(t => t.id === transactionId);
                        if (tx) {
                            navigateToTransactionEditor('existing', tx);
                        }
                    },
                    onNavigateToView: (targetView) => navigateToView(targetView as View),
                    onMenuClick: () => setView('settings'),
                    theme,
                    t,
                    userName: user?.displayName || '',
                    userEmail: user?.email || '',
                })}

                {/* BatchCaptureView - batch mode from ScanContext */}
                {view === 'batch-capture' && (
                    <BatchCaptureView
                        isBatchMode={isBatchModeFromContext}
                        onToggleMode={(batchMode) => {
                            // Toggle via context - controls batch/individual mode
                            if (batchMode && user?.uid) {
                                startBatchScanContext(user.uid);
                            } else if (!batchMode) {
                                // Switch to individual mode - reset context and go to edit view
                                resetScanContext();
                                handleNewTransaction(false);
                            }
                        }}
                        onProcessBatch={async (images) => {
                            // Direct batch processing - no intermediate confirmation
                            setBatchImages(images);
                            setScanContextImages(images);

                            // Deduct super credit IMMEDIATELY to prevent exploits
                            // Credit is only restored if ALL API calls fail.
                            const deducted = await deductUserSuperCredits(1);
                            if (!deducted) {
                                setToastMessage({ text: t('noSuperCreditsMessage') || t('noCreditsMessage'), type: 'info' });
                                return;
                            }

                            // Navigate to batch-review to show processing progress
                            // Users can navigate away and return to see progress
                            setView('batch-review');

                            // Transition state machine to 'scanning' phase
                            dispatchProcessStart('super', 1);

                            // Start parallel processing with state machine callbacks
                            try {
                                const results = await batchProcessing.startProcessing(
                                    images,
                                    scanCurrency,
                                    scanStoreType !== 'auto' ? scanStoreType : undefined,
                                    {
                                        onItemStart: dispatchBatchItemStart,
                                        onItemSuccess: dispatchBatchItemSuccess,
                                        onItemError: dispatchBatchItemError,
                                        // Atomic state update with phase transition
                                        onComplete: (processingResults, imageUrls) => {
                                            // Add sharedGroupIds to each successful result if in group mode
                                            let taggedResults = processingResults;
                                            if (viewMode === 'group' && activeGroup?.id) {
                                                taggedResults = processingResults.map(result => {
                                                    if (result.success && result.result) {
                                                        return {
                                                            ...result,
                                                            result: {
                                                                ...result.result,
                                                                sharedGroupIds: [activeGroup.id!],
                                                            },
                                                        };
                                                    }
                                                    return result;
                                                });
                                            }
                                            const receipts = createBatchReceiptsFromResults(taggedResults, imageUrls);
                                            dispatchBatchComplete(receipts);
                                        },
                                    }
                                );

                                // Restore credit only if ALL API calls failed
                                const allFailed = results.every(r => !r.success);
                                if (allFailed) {
                                    await addUserSuperCredits(1);
                                    setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
                                }

                                // batchReceipts set atomically in onComplete callback
                                // Persistence handled automatically via scanState save effect
                            } catch (e) {
                                // Restore credit on complete batch failure
                                console.error('Batch processing failed:', e);
                                await addUserSuperCredits(1);
                                setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
                            }
                        }}
                        onSwitchToIndividual={() => {
                            // Reset context clears batch mode and persistence
                            resetScanContext();
                            setBatchImages([]); // Clear images when switching to individual
                            handleNewTransaction(false);
                        }}
                        onBack={() => {
                            // Clear batch state on cancel - resets context and persistence
                            resetScanContext();
                            setBatchImages([]);
                            setView('dashboard');
                        }}
                        isProcessing={batchProcessing.isProcessing}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        // Pass credits for header display and credit usage section
                        superCreditsAvailable={userCredits.superRemaining}
                        normalCreditsAvailable={userCredits.remaining}
                        // Story 14e-4: onCreditInfoClick removed - Nav uses Modal Manager directly
                        imageDataUrls={batchImages}
                        onImagesChange={(dataUrls) => setBatchImages(dataUrls)}
                    />
                )}

                {/* BatchReviewView - review processed receipts before saving */}
                {view === 'batch-review' && <BatchReviewView {...batchReviewViewDataProps} />}

                {/* SettingsView */}
                {view === 'settings' && <SettingsView {...settingsViewProps} />}
                {view === 'alerts' && renderAlertsView({
                    user,
                    navigateToView: (v: string) => navigateToView(v as View),
                    setView: (v: string) => setView(v as View),
                    t,
                    theme,
                    pendingInvitations,
                    services,
                    lang: lang as 'en' | 'es',
                    setToastMessage: (msg) => setToastMessage({ text: msg.text, type: msg.type as 'success' | 'info' }),
                    inAppNotifications,
                    userSharedGroups,
                    setGroupMode,
                    markNotificationAsRead,
                    markAllNotificationsAsRead,
                    deleteInAppNotification,
                    deleteAllInAppNotifications,
                })}

                {/* Statement Scan Placeholder View */}
                {view === 'statement-scan' && renderStatementScanView({
                    theme,
                    t,
                    onBack: () => navigateToView('dashboard'),
                })}

                {/* Transaction History View - uses composition hook with infinite scroll */}
                {view === 'history' && (
                    <HistoryFiltersProvider
                        initialState={pendingHistoryFilters || undefined}
                        onStateChange={setPendingHistoryFilters}
                    >
                        <HistoryView {...historyViewDataProps as any} />
                    </HistoryFiltersProvider>
                )}

                {/* Recent Scans View - latest scans sorted by scan date */}
                {view === 'recent-scans' && renderRecentScansView({
                    transactions: transactionsWithRecentScans as any,
                    theme,
                    currency,
                    dateFormat,
                    t,
                    formatCurrency,
                    formatDate: formatDate as any,
                    onBack: () => setView('dashboard'),
                    onEditTransaction: (tx) => navigateToTransactionDetail(tx as Transaction),
                    lang,
                    defaultCountry,
                    foreignLocationFormat: userPreferences.foreignLocationFormat,
                    userId: user?.uid,
                })}

                {/* Items History View - filtered navigation from analytics */}
                {view === 'items' && (
                    <HistoryFiltersProvider
                        initialState={pendingHistoryFilters || undefined}
                        onStateChange={setPendingHistoryFilters}
                    >
                        <ItemsView {...itemsViewProps as any} />
                    </HistoryFiltersProvider>
                )}

                {/* Weekly Reports View */}
                {view === 'reports' && renderReportsView({
                    transactions: transactions as Transaction[],
                    theme,
                    userName: user?.displayName || '',
                    userEmail: user?.email || '',
                    t,
                    onBack: navigateBack,
                    onNavigateToView: (targetView) => navigateToView(targetView as View),
                    onSetPendingHistoryFilters: setPendingHistoryFilters,
                })}
                </ViewHandlersProvider>
            </main>

            <Nav
                view={view}
                setView={(v: string) => navigateToView(v as View)}
                onScanClick={() => {
                    // If in statement mode, return to statement view
                    if (scanState.mode === 'statement') {
                        navigateToView('statement-scan');
                        return;
                    }
                    // Check batch state first (in order of priority)
                    // 1. Batch processing in progress or results pending review
                    if (batchProcessing.isProcessing || hasBatchReceipts) {
                        navigateToView('batch-review');
                    }
                    // 2. Batch images captured but not yet processed - return to capture
                    else if (batchImages.length > 0) {
                        if (!isBatchModeFromContext && user?.uid) {
                            startBatchScanContext(user.uid);
                        }
                        navigateToView('batch-capture');
                    }
                    // 3. Single-image scan in progress or complete - show transaction editor
                    else if (scanState.phase === 'scanning' || scanState.results.length > 0) {
                        navigateToView('transaction-editor');
                    }
                    // 4. No active scan - trigger new scan
                    else {
                        triggerScan();
                    }
                }}
                // Long-press on camera FAB - batch mode tracked via ScanContext
                onBatchClick={() => {
                    if (batchProcessing.isProcessing || hasBatchReceipts) {
                        // Batch processing or results pending - go to review
                        navigateToView('batch-review');
                    } else if (batchImages.length > 0) {
                        // Batch images captured but not processed - return to capture
                        if (!isBatchModeFromContext && user?.uid) {
                            startBatchScanContext(user.uid);
                        }
                        navigateToView('batch-capture');
                    } else {
                        // No active batch - start new batch capture
                        if (user?.uid) {
                            startBatchScanContext(user.uid);
                        }
                        navigateToView('batch-capture');
                    }
                }}
                onTrendsClick={() => {
                    // Navigation state is now managed by AnalyticsContext
                    // Context resets to year level when mounted
                }}
                // Statement scan placeholder navigation
                onStatementClick={() => {
                    // Start statement scan in context and navigate to placeholder view
                    if (user?.uid) {
                        startStatementScanContext(user.uid);
                    }
                    navigateToView('statement-scan');
                }}
                theme={theme}
                t={t}
                scanStatus={scanStatus}
                // Display remaining scan credits on camera FAB
                scanCredits={userCredits.remaining}
                // Display super credits (tier 2) on camera FAB
                superCredits={userCredits.superRemaining}
                // Story 14e-4: onCreditInfoClick removed - Nav uses Modal Manager directly
                // Batch mode from ScanContext - tracks all phases (capturing, processing, reviewing)
                isBatchMode={isBatchModeFromContext || hasBatchReceipts}
                alertsBadgeCount={pendingInvitationsCount + inAppNotificationsUnreadCount}
                activeGroupColor={viewMode === 'group' && activeGroup ? activeGroup.color : undefined}
            />

            {/* Toast notification for feedback - theme-aware styling */}
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

            {/* Story 14e-4: Credit Info Modal now rendered by ModalManager */}

            {/* Batch upload preview for multi-image selection with safe area padding */}
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

            {/* Batch Processing Overlay - matches single scan UX */}
            <BatchProcessingOverlay
                visible={batchProcessing.isProcessing && (view === 'batch-capture' || view === 'batch-review')}
                theme={theme as 'light' | 'dark'}
                t={t}
                progress={batchProcessing.progress}
            />

            {/* Batch discard confirmation dialog - uses ScanContext activeDialog */}
            {scanState.activeDialog?.type === DIALOG_TYPES.BATCH_DISCARD && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={handleBatchDiscardCancel}
                >
                    <div
                        className="rounded-2xl p-6 max-w-sm w-full shadow-xl"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-light)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        role="alertdialog"
                        aria-labelledby="discard-dialog-title"
                        aria-describedby="discard-dialog-desc"
                    >
                        <h3
                            id="discard-dialog-title"
                            className="text-lg font-bold mb-3"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {t('batchDiscardConfirmTitle')}
                        </h3>
                        <p
                            id="discard-dialog-desc"
                            className="text-sm mb-6"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {t('batchDiscardConfirmMessage')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleBatchDiscardConfirm}
                                className="flex-1 py-3 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2"
                                style={{ backgroundColor: '#ef4444' }}
                            >
                                <Trash2 size={18} />
                                {t('batchDiscardConfirmYes')}
                            </button>
                            <button
                                onClick={handleBatchDiscardCancel}
                                className="flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-light)',
                                }}
                            >
                                <ArrowLeft size={18} />
                                {t('batchDiscardConfirmNo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <JoinGroupDialog
                isOpen={joinLinkState !== 'idle' && joinLinkState !== 'pending_auth' && joinLinkState !== 'success'}
                state={joinLinkState}
                groupPreview={joinGroupPreview}
                error={joinError}
                onConfirm={confirmJoin}
                onCancel={cancelJoin}
                onDismissError={dismissJoinError}
                t={t}
                lang={lang}
            />
            </AppLayout>
        </>
    );
}

export default App;
