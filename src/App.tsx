/**
 * App.tsx - Main Application Component
 *
 * Root component that orchestrates the entire application:
 * - View routing and navigation state management
 * - User authentication and session handling
 * - Transaction and scan workflow coordination
 * - Theme, language, and user preferences
 * - Context providers (Auth, Scan, Analytics, HistoryFilters)
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
// Story 14e-23: Trash2, ArrowLeft removed - now used by BatchDiscardDialog in ScanFeature
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { migrateCreatedAt } from './utils/migrateCreatedAt';
import { useRecentScans } from './hooks/useRecentScans';
import { usePaginatedTransactions } from './hooks/usePaginatedTransactions';
// Story 14e-17: Categories feature module
// Story 14e-17b: CategoriesFeature provides context for views to access category state
import { CategoriesFeature } from '@features/categories';
// Story 14e-18c: CreditFeature now rendered via FeatureOrchestrator (Story 14e-21)
// Story 14e-20a: Toast hook extraction
import { useToast } from '@/shared/hooks';
// Story 14e-23: Toast UI component
import { Toast } from '@/shared/ui';
// Story 14e-20b: Settings Zustand store
// Story 14e-25a.1: Navigation Zustand store
// Story 14e-25a.1 (V1/V3 fix): Using useNavigationActions for all navigation state and actions
import {
    useSettingsStore,
    useCurrentView,
    // Story 14e-28: usePreviousView removed - accessed via useTransactionEditorHandlers hook
    useSettingsSubview,
    usePendingHistoryFilters,
    usePendingDistributionView,
    useAnalyticsInitialState,
    useNavigationActions,
} from '@/shared/stores';
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
// Story 14e-25a.1 (V1 fix): useNavigationHandlers removed - navigation logic now in local wrappers
import {
    useTransactionHandlers,
    useScanHandlers,
    useDialogHandlers,
    // Story 14e-25a.2b: useHistoryViewProps REMOVED - HistoryView now owns its data
    // Story 14e-25b.1: useTrendsViewProps REMOVED - TrendsView now owns its data
    // Story 14e-16: useBatchReviewViewProps removed - BatchReviewFeature uses store selectors
    // Story 14e-28b: useTransactionEditorViewProps REMOVED - TransactionEditorView now owns its data
    // Story 14e-25b.2: useDashboardViewProps REMOVED - DashboardView now owns its data via useDashboardViewData
    // Story 14e-25c.1: useSettingsViewProps removed - SettingsView owns data via useSettingsViewData
    // Story 14e-31: useItemsViewProps REMOVED - ItemsView now owns its data via useItemsViewData
} from './hooks/app';
// Story 14e-28b: useTransactionEditorHandlers now called internally by TransactionEditorView
// Story 14e-22: AppProviders consolidates ViewHandlersProvider and other app-level providers
import { AppProviders } from '@app/AppProviders';
import { JoinGroupDialog } from './components/SharedGroups/JoinGroupDialog';
import type { SharedGroup } from './types/sharedGroup';
import { getFirestore } from 'firebase/firestore';
// Story 14e-28: useQueryClient and updateMemberTimestampsForTransaction moved to useTransactionEditorHandlers
// Story 14e-28b: GroupWithMeta now used internally by TransactionEditorView
import { useBatchProcessing } from './hooks/useBatchProcessing';
// Story 14e-16: BatchReceipt type and createBatchReceiptsFromResults now imported with BatchReviewFeature
// Story 14e-29c: BatchReceipt import removed - no longer used in App.tsx after handlers moved to hook
// Dialog types for scan state machine
// Story 14e-14d: BatchCompleteDialogData moved to extracted handlers
import { DIALOG_TYPES } from './types/scanStateMachine';
import { LoginScreen } from './views/LoginScreen';
import { DashboardView } from './views/DashboardView';
import { TrendsView } from './views/TrendsView';
import { HistoryView } from './views/HistoryView';
// Story 14e-31: ItemsView now owns data via useItemsViewData, uses _testOverrides for handlers
import { ItemsView } from './views/ItemsView';
import { BatchCaptureView } from './views/BatchCaptureView';
// Story 14e-16: BatchReviewView replaced by BatchReviewFeature from @features/batch-review
import { SettingsView } from './views/SettingsView';
import { TransactionEditorView } from './views/TransactionEditorView';
import { Nav, ScanStatus } from './components/Nav';
import { TopHeader } from './components/TopHeader';
import { type SessionContext, type SessionAction } from './components/session';
import { BatchUploadPreview } from './components/scan';
// Story 14e-23b: App shell components moved from AppOverlays
import { NavigationBlocker } from './components/NavigationBlocker';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { useScanOverlayState } from './hooks/useScanOverlayState';
import { PROCESSING_TIMEOUT_MS } from './hooks/useScanState';
import { BatchProcessingOverlay } from './components/scan';
// Story 14e-18c: checkCreditSufficiency and CreditCheckResult moved to CreditFeature
import type { ConflictingTransaction, ConflictReason } from './components/dialogs/TransactionConflictDialog';
import type { TrustPromptEligibility } from './types/trust';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
// Story 14e-11: Migrated from useScan (ScanContext) to Zustand store
import {
    useScanStore,
    useScanActions,
    useIsProcessing,
    useScanMode,
    useScanPhase,
    useBatchProgress,
} from '@features/scan/store';
import { getQuarterFromMonth } from './utils/analyticsHelpers';
// Note: AnalyticsNavigationState and HistoryFilterState types now handled by navigation store
// Story 14e-25a.1 (V1 fix): Added types for handleNavigateToHistory
import { HistoryFiltersProvider, type HistoryFilterState, type TemporalFilterState } from './contexts/HistoryFiltersContext';
import type { HistoryNavigationPayload } from './utils/analyticsToHistoryFilters';
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
import { Transaction, TransactionItem } from './types/transaction';
import { Insight } from './types/insight';
import { Language, Currency } from './types/settings';
import { loadLanguage, loadCurrency, loadDateFormat } from './contexts/ThemeContext';
import {
    loadPersistedScanState,
    savePersistedScanState,
    clearPersistedScanState,
    clearLegacyBatchStorage,
} from './services/pendingScanStorage';
import { formatCurrency } from './utils/currency';
import { formatDate } from './utils/date';
import { getSafeDate } from './utils/validation';
import { TRANSLATIONS } from './utils/translations';
// Story 14e-28b: STORE_CATEGORIES no longer needed - TransactionEditorView gets it internally
// Story 14e-25a.1 (V1 fix): Category expansion helpers for handleNavigateToHistory
import {
    expandStoreCategoryGroup,
    expandItemCategoryGroup,
    type StoreCategoryGroup,
    type ItemCategoryGroup,
} from './config/categoryColors';
import { applyCategoryMappings } from './utils/categoryMatcher';
import { incrementMappingUsage } from './services/categoryMappingService';
import { incrementMerchantMappingUsage } from './services/merchantMappingService';
import { incrementItemNameMappingUsage } from './services/itemNameMappingService';
import { getCitiesForCountry } from './data/locations';
// Modal Manager - useModalActions for opening modals (Story 14e-4)
// ModalManager component now rendered via FeatureOrchestrator (Story 14e-21)
import { useModalActions } from './managers/ModalManager';
// ProcessScan handler (Story 14e-8c)
// ScanFeature now rendered via FeatureOrchestrator (Story 14e-21)
// Story 14e-30: useScanInitiation for scan initiation handlers
import { processScan as processScanHandler, useScanInitiation } from '@features/scan';
import type { ScanInitiationProps } from '@features/scan';
// Story 14e-14d: Batch review handlers extracted from App.tsx
// Story 14e-28: navigateToPreviousReceipt, navigateToNextReceipt moved to useTransactionEditorHandlers
// Story 14e-29c: editBatchReceipt, saveBatchTransaction, handleSaveComplete, handleReviewBack
// moved to useBatchReviewHandlers hook - BatchReviewFeature owns handlers internally
// Story 14e-29d: confirmDiscard/cancelDiscard removed - now in useBatchReviewHandlers hook
// Story 14e-16: BatchReviewFeature orchestrator + store actions
// Story 14e-29d: useBatchReviewHandlers for centralized batch handlers
import {
    BatchReviewFeature,
    batchReviewActions,
    useBatchReviewHandlers,
} from '@features/batch-review';
import type { BatchReviewHandlersProps } from '@features/batch-review';
import { createBatchReceiptsFromResults } from './hooks/useBatchReview';
// Story 14e-21: FeatureOrchestrator - centralized feature composition
import { FeatureOrchestrator } from '@app/FeatureOrchestrator';

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

    // Story 14e-25a.2b: Pagination variables (hasMore, loadMore, etc.) removed from destructuring
    // HistoryView now gets pagination via useHistoryViewData hook internally
    const { transactions: paginatedTransactions } = usePaginatedTransactions(user, services);

    // Merge recentScans into paginatedTransactions for RecentScansView.
    // Note: HistoryView now does its own merge via useHistoryViewData hook.
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
    // Story 14e-17b: mappingsLoading and updateCategoryMapping now accessed via CategoriesContext
    // Story 14e-25b.2: delete mappings removed - now handled by SettingsView directly
    // Story 14e-28b: save* functions now accessed internally by TransactionEditorView
    const { mappings } = useCategoryMappings(user, services);
    const { findMatch: findMerchantMatch } = useMerchantMappings(user, services);
    // Story 14e-17b: subcategoryMappingsLoading and updateSubcategoryMapping now accessed via CategoriesContext
    // Story 14e-28b: saveMapping now accessed internally by TransactionEditorView
    useSubcategoryMappings(user, services);
    const { findMatch: findItemNameMatch } = useItemNameMappings(user, services);

    // User preferences (currency, location, profile settings)
    // Story 14e-25b.2: Setters removed - now handled by SettingsView directly
    const {
        preferences: userPreferences,
        loading: _preferencesLoading,
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
    // Story 14e-25b.2: removeTrust and trustedMerchants removed - now handled by SettingsView directly
    const {
        recordMerchantScan,
        checkTrusted,
        acceptTrust,
        declinePrompt,
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
    // Story 14e-28: queryClient moved to useTransactionEditorHandlers hook
    const { groups: userSharedGroups, isLoading: sharedGroupsLoading } = useUserSharedGroups(db, user?.uid);
    const [showViewModeSwitcher, setShowViewModeSwitcher] = useState(false);

    // Story 14e-28b: availableGroupsForSelector now computed internally by TransactionEditorView
    // View mode is in-memory only (defaults to personal mode)

    // Stub values for shared group transactions (feature temporarily disabled)
    // Story 14e-25a.2b: _sharedGroupTransactions removed (was unused)
    // Story 14e-25b.1: _sharedGroupSpendingByMember removed - TrendsView now owns its data
    const _sharedGroupRawTransactions: any[] = [];
    void _sharedGroupRawTransactions; // Suppress unused warning until shared groups v2

    // Story 14e-11: Scan state from Zustand store (migrated from ScanContext)
    const scanState = useScanStore();
    const scanPhase = useScanPhase();
    const scanMode = useScanMode();
    const isContextProcessing = useIsProcessing();
    const batchProgressFromContext = useBatchProgress();
    // Story 14e-11: hasActiveRequest available via useHasActiveRequest() if needed in future

    // Story 14e-11: Scan actions from Zustand store
    const {
        startSingle: startScanContext,
        startBatch: startBatchScanContext,
        startStatement: startStatementScanContext,
        batchItemStart: dispatchBatchItemStart,
        batchItemSuccess: dispatchBatchItemSuccess,
        batchItemError: dispatchBatchItemError,
        batchComplete: dispatchBatchComplete,
        setBatchEditingIndex: setBatchEditingIndexContext,
        // Story 14e-28: updateBatchReceipt moved to useTransactionEditorHandlers
        discardBatchReceipt: discardBatchReceiptContext,
        showDialog: showScanDialogZustand,
        dismissDialog: dismissScanDialog,
        setImages: setScanContextImages,
        processStart: dispatchProcessStart,
        processSuccess: dispatchProcessSuccess,
        processError: dispatchProcessError,
        reset: resetScanContext,
        restoreState: restoreScanState,
    } = useScanActions();

    // Story 14e-11: Wrapper to maintain old showDialog(type, data) signature
    const showScanDialog = useCallback((type: string, data?: unknown) => {
        showScanDialogZustand({ type, data } as any);
    }, [showScanDialogZustand]);

    // Story 14e-11: Computed values derived from Zustand state
    const isBatchModeFromContext = scanMode === 'batch';
    const isBatchProcessingFromContext = scanPhase === 'scanning' && scanMode === 'batch';
    // isBatchReviewing can be derived as: scanPhase === 'reviewing' && scanMode === 'batch'

    // Story 14e-11: Wrapper functions for setStoreType and setCurrency (use restoreState)
    const setScanContextStoreType = useCallback((storeType: ReceiptType) => {
        restoreScanState({ storeType });
    }, [restoreScanState]);

    const setScanContextCurrency = useCallback((currency: string) => {
        restoreScanState({ currency });
    }, [restoreScanState]);

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

    // Story 14e-28b: scanError now accessed internally by TransactionEditorView via Zustand store
    const setScanError = useCallback((error: string | null) => {
        if (error) {
            dispatchProcessError(error);
        }
    }, [dispatchProcessError]);

    // isAnalyzing - derived from state machine phase (Story 14e-25d: setter removed - no-op)
    const isAnalyzing = isContextProcessing;

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

    // Story 14e-25a.1: Navigation state from Zustand store
    // Story 14e-25a.1 (V1/V3/V4 fix): Using useNavigationActions for all navigation actions
    // Story 14e-28: previousView removed - now accessed via useTransactionEditorHandlers hook
    const view = useCurrentView();
    const settingsSubview = useSettingsSubview();
    const pendingHistoryFilters = usePendingHistoryFilters();
    const pendingDistributionView = usePendingDistributionView();
    const analyticsInitialState = useAnalyticsInitialState();
    const {
        setView,
        setSettingsSubview,
        saveScrollPosition,
        // Story 14e-28: getScrollPosition removed - now in useTransactionEditorHandlers hook
        setPendingHistoryFilters,
        setPendingDistributionView,
        setAnalyticsInitialState,
        clearAnalyticsInitialState,
    } = useNavigationActions();
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
    // Story 14e-18c: Credit warning state moved to CreditFeature
    const [shouldTriggerCreditCheck, setShouldTriggerCreditCheck] = useState(false);
    const batchProcessing = useBatchProcessing(3);

    const scanOverlay = useScanOverlayState();
    const prefersReducedMotion = useReducedMotion();

    // ==========================================================================
    // Settings State
    // ==========================================================================

    // Story 14e-25b.2: Setters removed - now handled by SettingsView directly
    // FIX: Read from localStorage instead of hardcoded values, with sync on changes
    const [lang, setLang] = useState<Language>(loadLanguage);
    const [currency, setCurrency] = useState<Currency>(loadCurrency);
    const [dateFormat, setDateFormat] = useState<'LatAm' | 'US'>(loadDateFormat);

    // Sync locale settings when changed (from SettingsView via ThemeContext)
    useEffect(() => {
        // Handle storage events from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'lang' && e.newValue) {
                const newLang = e.newValue as Language;
                if (newLang === 'es' || newLang === 'en') setLang(newLang);
            }
            if (e.key === 'currency' && e.newValue) {
                const newCurrency = e.newValue as Currency;
                if (newCurrency === 'CLP' || newCurrency === 'USD' || newCurrency === 'EUR') setCurrency(newCurrency);
            }
            if (e.key === 'dateFormat' && e.newValue) {
                const newFormat = e.newValue as 'LatAm' | 'US';
                if (newFormat === 'LatAm' || newFormat === 'US') setDateFormat(newFormat);
            }
        };

        // Handle custom events from same window (ThemeContext dispatches these)
        const handleLocaleChange = (e: Event) => {
            const { type, value } = (e as CustomEvent).detail;
            if (type === 'lang') setLang(value as Language);
            if (type === 'currency') setCurrency(value as Currency);
            if (type === 'dateFormat') setDateFormat(value as 'LatAm' | 'US');
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('locale-change', handleLocaleChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('locale-change', handleLocaleChange);
        };
    }, []);

    // Story 14e-20b: Settings managed by Zustand store with localStorage persistence
    // Theme, colorTheme, fontSize are now stored in useSettingsStore
    // Story 14e-25b.2: Setters removed - now handled by SettingsView directly
    // Note: fontColorMode is managed by SettingsView directly (not needed in App.tsx)
    const theme = useSettingsStore((state) => state.theme);
    const colorTheme = useSettingsStore((state) => state.colorTheme);
    const fontSize = useSettingsStore((state) => state.fontSize);

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
    // Story 14e-25b.1: setExporting now unused after TrendsView migration, keep exporting for SettingsView
    const [exporting, _setExporting] = useState(false);
    // Story 14e-20a: Toast state extracted to shared hook
    const { toastMessage, showToast, dismissToast } = useToast();
    // Compatibility wrapper for existing code that uses setToastMessage pattern
    const setToastMessage = useCallback((msg: { text: string; type: 'success' | 'info' } | null) => {
        if (msg) {
            showToast(msg.text, msg.type);
        } else {
            dismissToast();
        }
    }, [showToast, dismissToast]);

    // Story 14e-25a.1 (V3 fix): scrollPositionsRef removed - using navigation store's saveScrollPosition/getScrollPosition
    // Story 14e-30: fileInputRef now owned by ScanFeature, received via callback
    const [fileInputRef, setFileInputRef] = useState<React.RefObject<HTMLInputElement>>({ current: null });
    const handleFileInputReady = useCallback((ref: React.RefObject<HTMLInputElement>) => {
        setFileInputRef(ref);
    }, []);
    const mainRef = useRef<HTMLDivElement>(null);
    const t = (k: string) => (TRANSLATIONS[lang] as any)[k] || k;

    // Story 14e-28b: distinctAliases now computed internally by TransactionEditorView

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
        // Batch editing context (for returning to batch-review after save)
        batchEditingIndex: scanState.batchEditingIndex,
        clearBatchEditingIndex: () => setBatchEditingIndexContext(null),
        // Batch receipts (for discarding after save)
        batchReceipts: scanState.batchReceipts,
        discardBatchReceipt: discardBatchReceiptContext,
        // Translation
        t,
    });

    // ==========================================================================
    // Story 14e-25a.1 (V1 fix): Navigation handlers moved from useNavigationHandlers to local wrappers
    // These use the navigation store actions + scroll/dialog handling
    // ==========================================================================

    // Filter clearing effects (from useNavigationHandlers)
    // Story 14.13: Clear filters when navigating away from history/insights/transaction-editor views
    useEffect(() => {
        if (
            view !== 'insights' &&
            view !== 'history' &&
            view !== 'items' &&
            view !== 'transaction-editor' &&
            pendingHistoryFilters
        ) {
            setPendingHistoryFilters(null);
        }
    }, [view, pendingHistoryFilters, setPendingHistoryFilters]);

    // Story 10a.2: Clear analytics initial state when navigating AWAY from trends view
    useEffect(() => {
        if (view !== 'trends' && analyticsInitialState) {
            clearAnalyticsInitialState();
        }
    }, [view, analyticsInitialState, clearAnalyticsInitialState]);

    // Story 14.13 Session 7: Clear pending distribution view when navigating AWAY from trends
    useEffect(() => {
        if (
            view !== 'trends' &&
            view !== 'history' &&
            view !== 'items' &&
            view !== 'transaction-editor' &&
            pendingDistributionView
        ) {
            setPendingDistributionView(null);
        }
    }, [view, pendingDistributionView, setPendingDistributionView]);

    /**
     * Navigate to a view with scroll position management and filter clearing.
     * Story 14e-25a.1 (V1/V3 fix): Uses navigation store + mainRef for scrolling
     */
    const navigateToView = useCallback((targetView: View) => {
        // Save current scroll position using store (V3 fix)
        if (mainRef.current) {
            saveScrollPosition(view, mainRef.current.scrollTop);
        }

        // Story 14.13b: Clear filters when navigating to history/items from outside
        const isFromRelatedView =
            view === 'history' ||
            view === 'items' ||
            view === 'transaction-editor' ||
            view === 'trends' ||
            view === 'insights' ||
            view === 'dashboard';
        const isToHistoryOrItems = targetView === 'history' || targetView === 'items';
        if (isToHistoryOrItems && !isFromRelatedView) {
            setPendingHistoryFilters(null);
        }

        // Navigate using store (tracks previousView automatically)
        setView(targetView);

        // Story 14.24: Hide QuickSaveCard when navigating to a different view
        if (targetView !== 'transaction-editor' && targetView !== 'scan-result') {
            if (scanState.activeDialog?.type === DIALOG_TYPES.QUICKSAVE) {
                dismissScanDialog();
            }
        }

        // Reset scroll to top for the new view
        setTimeout(() => {
            if (mainRef.current) {
                mainRef.current.scrollTo(0, 0);
            }
        }, 0);
    }, [
        view,
        setView,
        mainRef,
        saveScrollPosition,
        setPendingHistoryFilters,
        scanState.activeDialog,
        dismissScanDialog,
    ]);

    // Story 14e-28: navigateBack removed - now in useTransactionEditorHandlers hook (uses navigation store)

    /**
     * Navigate from Analytics to History/Items with pre-applied filters.
     * Story 14e-25a.1 (V1 fix): Moved from useNavigationHandlers
     */
    const handleNavigateToHistory = useCallback((payload: HistoryNavigationPayload) => {
        // Build category filter based on payload
        let categoryFilter: HistoryFilterState['category'] = { level: 'all' };
        if (payload.category) {
            categoryFilter = { level: 'category', category: payload.category };
        } else if (payload.storeGroup) {
            const storeCategories = expandStoreCategoryGroup(payload.storeGroup as StoreCategoryGroup);
            categoryFilter = { level: 'category', category: storeCategories.join(',') };
        } else if (payload.itemGroup) {
            const itemCategories = expandItemCategoryGroup(payload.itemGroup as ItemCategoryGroup);
            categoryFilter = { level: 'group', group: itemCategories.join(',') };
        } else if (payload.itemCategory) {
            categoryFilter = { level: 'group', group: payload.itemCategory };
        }

        // Story 14.13a: Include drillDownPath for multi-dimension filtering
        if (payload.drillDownPath) {
            categoryFilter.drillDownPath = payload.drillDownPath;
        }

        const filterState: HistoryFilterState = {
            temporal: payload.temporal
                ? { ...payload.temporal, level: payload.temporal.level as TemporalFilterState['level'] }
                : { level: 'all' },
            category: categoryFilter,
            location: {},
            group: {},
        };

        // Store filters and navigate
        setPendingHistoryFilters(filterState);
        if (payload.sourceDistributionView) {
            setPendingDistributionView(payload.sourceDistributionView);
        }

        const targetView = payload.targetView || 'history';
        navigateToView(targetView);
    }, [navigateToView, setPendingHistoryFilters, setPendingDistributionView]);

    // Dialog handlers (Story 14e-5: Conflict dialog now uses Modal Manager)
    // Note: toast state is managed locally in App.tsx, not from this hook
    // Story 14e-25d: openConflictDialog was used by dialogHandlers bundle (removed)
    const { openConflictDialog: _openConflictDialog } = useDialogHandlers({
        scanState,
        setCurrentTransaction,
        resetScanState: resetScanContext,
        clearBatchImages: useCallback(() => setBatchImages([]), []),
        createDefaultTransaction,
        setTransactionEditorMode,
        navigateToView,
        t,
        lang,
        formatCurrency,
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
        // Story 14e-25d: These were used by scanHandlers bundle (removed)
        applyItemNameMappings: _hookApplyItemNameMappings,
        reconcileItemsTotal: _hookReconcileItemsTotal,
        continueScanWithTransaction: _continueScanWithTransaction,
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

    // Story 14e-20a: Toast auto-dismiss is now handled by useToast hook

    // Story 14e-25d: Handler bundles removed - views now use direct hooks:
    // - Navigation: useNavigationActions() from @/shared/stores
    // - Toast: useToast() from @/shared/hooks
    // - Modals: useModalActions() from @/managers/ModalManager
    // - History navigation: useHistoryNavigation() from @/shared/hooks

    // Check for personal records after transactions change
    useEffect(() => {
        if (transactions.length > 0 && user?.uid) {
            checkForRecords(transactions);
        }
    }, [transactions, user?.uid, checkForRecords]);

    // Story 14e-20b: Settings persistence moved to useSettingsStore (Zustand persist middleware)

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

    // Story 14e-30: handleNewTransaction moved to useScanInitiation hook
    // Now available as scanInitiationHandlers.handleNewTransaction

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
    // If scan is active, auto-navigate to scan view instead of showing dialog
    const navigateToTransactionEditor = (mode: 'new' | 'existing', transaction?: Transaction | null) => {
        const conflictCheck = hasActiveTransactionConflict();
        const isEditingSameTransaction = mode === 'existing' && transaction?.id &&
            scanState.results.length > 0 && scanState.results[0]?.id === transaction.id;

        if (conflictCheck.hasConflict && !isEditingSameTransaction) {
            // Auto-navigate to the active scan view - no dialog
            // Batch mode: go to batch-review
            // Single scan: go to transaction-editor (with the scanned transaction)
            if (scanState.mode === 'batch') {
                navigateToView('batch-review');
            } else {
                // Single scan - navigate to the scanned transaction
                if (scanState.results.length > 0) {
                    setCurrentTransaction(scanState.results[0]);
                }
                setTransactionEditorMode('new');
                navigateToView('transaction-editor');
            }
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
    // If scan is active, auto-navigate to scan view instead
    const navigateToTransactionDetail = (transaction: Transaction, allTransactionIds?: string[]) => {
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
            return;
        }

        // No conflict, proceed with read-only view
        setIsViewingReadOnly(true);
        setCreditUsedInSession(false);
        setTransactionEditorMode('existing');
        setCurrentTransaction(transaction);
        setTransactionNavigationList(allTransactionIds && allTransactionIds.length > 1 ? allTransactionIds : null);
        navigateToView('transaction-editor');
    };

    // Story 14e-28: handleRequestEditFromReadOnly removed - now in useTransactionEditorHandlers hook

    // Story 14e-30: handleFileSelect moved to useScanInitiation hook

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

    /**
     * processScan - Wrapper that calls the extracted processScan handler.
     * Story 14e-8c: Extract processScan Handler
     *
     * Collects all dependencies from App.tsx scope and passes them to the
     * extracted handler in src/features/scan/handlers/processScan/processScan.ts.
     *
     * @param imagesToProcess - Optional images to process (avoids stale closure)
     */
    const processScan = useCallback(async (imagesToProcess?: string[]) => {
        // Collect images (parameter takes precedence to avoid stale closure)
        const images = imagesToProcess ?? scanImages;

        // Call the extracted handler with all dependencies
        await processScanHandler({
            scan: {
                images,
                currency: scanCurrency,
                storeType: scanStoreType,
                defaultCountry,
                defaultCity,
            },
            user: {
                userId: user?.uid || '',
                creditsRemaining: userCredits.remaining,
                defaultCurrency: userPreferences.defaultCurrency || 'CLP',
                transactions,
            },
            mapping: {
                mappings,
                applyCategoryMappings,
                findMerchantMatch,
                applyItemNameMappings,
                incrementMappingUsage: (mappingId: string) => {
                    if (user && services) {
                        incrementMappingUsage(services.db, user.uid, services.appId, mappingId)
                            .catch(err => console.error('Failed to increment mapping usage:', err));
                    }
                },
                incrementMerchantMappingUsage: (mappingId: string) => {
                    if (user && services) {
                        incrementMerchantMappingUsage(services.db, user.uid, services.appId, mappingId)
                            .catch(err => console.error('Failed to increment merchant mapping usage:', err));
                    }
                },
                incrementItemNameMappingUsage: (mappingId: string) => {
                    if (user && services) {
                        incrementItemNameMappingUsage(services.db, user.uid, services.appId, mappingId)
                            .catch(err => console.error('Failed to increment item name mapping usage:', err));
                    }
                },
            },
            ui: {
                setScanError,
                setCurrentTransaction,
                setView,
                showScanDialog,
                dismissScanDialog,
                dispatchProcessStart,
                dispatchProcessSuccess,
                dispatchProcessError,
                setToastMessage,
                // Story 14e-25d: setIsAnalyzing removed (no-op, state managed by state machine)
                setScanImages,
                setAnimateEditViewItems,
                setSkipScanCompleteModal,
                setCreditUsedInSession,
            },
            scanOverlay,
            services: {
                analyzeReceipt,
                deductUserCredits,
                addUserCredits,
                getCitiesForCountry,
            },
            t,
            lang,
            viewMode,
            activeGroupId: activeGroup?.id,
            trustedAutoSave: {
                checkTrusted,
                saveTransaction: async (transaction: Transaction) => {
                    if (!services || !user) throw new Error('Services not available');
                    return firestoreAddTransaction(services.db, user.uid, services.appId, transaction);
                },
                generateInsight: async (transaction, history, profile, cache) => {
                    return generateInsightForTransaction(transaction, history, profile, cache);
                },
                addToBatch,
                recordMerchantScan,
                insightProfile: insightProfile || null,
                insightCache,
                isInsightsSilenced,
                batchSession,
                onShowInsight: (insight) => {
                    setCurrentInsight(insight);
                    setShowInsightCard(true);
                },
                onShowBatchSummary: () => {
                    setShowBatchSummary(true);
                },
            },
            prefersReducedMotion,
            processingTimeoutMs: PROCESSING_TIMEOUT_MS,
        });
    }, [
        scanImages,
        scanCurrency,
        scanStoreType,
        defaultCountry,
        defaultCity,
        user,
        services,
        userCredits.remaining,
        userPreferences.defaultCurrency,
        transactions,
        mappings,
        findMerchantMatch,
        applyItemNameMappings,
        setScanError,
        setCurrentTransaction,
        setView,
        showScanDialog,
        dismissScanDialog,
        dispatchProcessStart,
        dispatchProcessSuccess,
        dispatchProcessError,
        setToastMessage,
        setScanImages,
        setAnimateEditViewItems,
        setSkipScanCompleteModal,
        setCreditUsedInSession,
        scanOverlay,
        deductUserCredits,
        addUserCredits,
        t,
        lang,
        viewMode,
        activeGroup?.id,
        checkTrusted,
        addToBatch,
        recordMerchantScan,
        insightProfile,
        insightCache,
        batchSession,
        setCurrentInsight,
        setShowInsightCard,
        setShowBatchSummary,
        prefersReducedMotion,
    ]);

    // Story 14e-30: handleRescan moved to useScanInitiation hook

    // ==========================================================================
    // Story 14e-29d: Batch Review Handlers Hook
    // ==========================================================================
    // Centralized batch handlers - used by BatchUploadPreview, CreditFeature, ScanFeature
    const batchHandlersConfig: BatchReviewHandlersProps = useMemo(() => ({
        // Core dependencies
        user,
        services,
        scanState,
        // State setters
        setBatchEditingIndexContext,
        setCurrentTransaction,
        setTransactionEditorMode,
        navigateToView,
        setView,
        setBatchImages,
        batchProcessing,
        resetScanContext,
        showScanDialog,
        dismissScanDialog,
        // Mapping functions
        mappings,
        applyCategoryMappings,
        findMerchantMatch,
        applyItemNameMappings,
        // Credit check (handled by CreditFeature - optional props)
        userCredits,
        // Processing handler dependencies
        setShowBatchPreview,
        setShouldTriggerCreditCheck,
        batchImages,
        scanCurrency,
        scanStoreType,
        viewMode,
        activeGroup: activeGroup ?? null,
        batchProcessingExtended: batchProcessing,
        setScanImages,
        // Story 14e-33: Trust prompt clearing when navigating away from batch review
        clearTrustPrompt: () => {
            setShowTrustPrompt(false);
            setTrustPromptData(null);
        },
    }), [
        user,
        services,
        scanState,
        setBatchEditingIndexContext,
        setCurrentTransaction,
        setTransactionEditorMode,
        navigateToView,
        setView,
        setBatchImages,
        batchProcessing,
        resetScanContext,
        showScanDialog,
        dismissScanDialog,
        mappings,
        applyCategoryMappings,
        findMerchantMatch,
        applyItemNameMappings,
        userCredits,
        setShowBatchPreview,
        setShouldTriggerCreditCheck,
        batchImages,
        scanCurrency,
        scanStoreType,
        viewMode,
        activeGroup,
        setScanImages,
    ]);

    const batchHandlers = useBatchReviewHandlers(batchHandlersConfig);

    // Story 14e-28b: TransactionEditorView now calls useTransactionEditorHandlers internally
    // Handler dependencies are passed via _testOverrides

    // Story 14e-29d: Batch handlers removed from App.tsx - now provided by useBatchReviewHandlers hook:
    // - handleCancelPreview, handleConfirmWithCreditCheck, handleProcessingStart
    // - handleCreditCheckComplete, handleReduceBatch
    // - handleDiscardConfirm, handleDiscardCancel, handleRemoveImage

    // ==========================================================================
    // Story 14e-30: Scan Initiation Handlers Hook
    // ==========================================================================
    const scanInitiationConfig: ScanInitiationProps = useMemo(() => ({
        // Core state
        scanState,
        hasBatchReceipts,
        scanImages,
        // Transaction state
        currentTransaction,
        createDefaultTransaction,
        // User preferences
        defaultCurrency: userPreferences.defaultCurrency || 'CLP',
        userCredits,
        lang: lang as 'en' | 'es',
        // Actions
        setTransactionEditorMode,
        setCurrentTransaction,
        setScanImages,
        setScanError,
        setScanStoreType,
        setScanCurrency,
        setBatchImages,
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
        // Refs
        fileInputRef,
    }), [
        scanState,
        hasBatchReceipts,
        scanImages,
        currentTransaction,
        createDefaultTransaction,
        userPreferences.defaultCurrency,
        userCredits,
        lang,
        setTransactionEditorMode,
        setCurrentTransaction,
        setScanImages,
        setScanError,
        setScanStoreType,
        setScanCurrency,
        setBatchImages,
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
    ]);

    const scanInitiationHandlers = useScanInitiation(scanInitiationConfig);

    // Story 14e-30: Destructure handlers from scanInitiationHandlers for use in component
    const {
        handleNewTransaction,
        triggerScan,
        handleFileSelect,
        handleRescan
    } = scanInitiationHandlers;

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

    // Story 14e-25b.2: recentlyAddedTransactions removed - DashboardView now owns its data via useDashboardViewData

    // When in group mode, use shared group transactions; otherwise use personal transactions
    const isGroupMode = viewMode === 'group' && !!activeGroup;
    // sharedGroupTransactions is date-filtered (current month), rawTransactions has all data
    // Use Array.isArray check to handle any non-array value (undefined, null, or unexpected type)
    // Story 14e-25a.2b: Using underscore-prefixed stubs until group mode is re-enabled
    const safeSharedGroupRawTransactions = Array.isArray(_sharedGroupRawTransactions)
        ? _sharedGroupRawTransactions
        : [];
    const activeTransactions = isGroupMode ? safeSharedGroupRawTransactions : transactions;
    // Story 14e-25b.2: activeRecentTransactions removed - no longer used after view migrations

    // ==========================================================================
    // View Props Composition Hooks (data props - views own handlers via direct hooks)
    // Story 14e-25d: ViewHandlersContext deleted - views use useToast(), useModalActions(), etc.
    // ==========================================================================

    // Story 14e-25a.2b: historyViewDataProps REMOVED - HistoryView now owns its data via useHistoryViewData hook
    // Story 14e-25b.1: trendsViewDataProps REMOVED - TrendsView now owns its data via useTrendsViewData hook

    // Story 14e-16: useBatchReviewViewProps removed - BatchReviewFeature uses store selectors instead
    // Props are now passed directly to BatchReviewFeature in the render section

    // Story 14e-28b: TransactionEditorView now owns its data via internal hooks
    // _testOverrides provides App-level state coordination (data overrides + handler dependencies)
    const transactionEditorOverrides = useMemo(() => ({
        // Data overrides (for useTransactionEditorData)
        currentTransaction,
        transactionEditorMode,
        isViewingReadOnly,
        transactionNavigationList,
        skipScanCompleteModal,
        isRescanning,
        isSaving: isTransactionSaving,
        animateItems: animateEditViewItems,
        creditUsedInSession,

        // Handler dependencies (for useTransactionEditorHandlers)
        user,
        db,
        setCurrentTransaction,
        setTransactionEditorMode,
        setIsViewingReadOnly,
        transactions,
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
    }), [
        currentTransaction,
        transactionEditorMode,
        isViewingReadOnly,
        transactionNavigationList,
        skipScanCompleteModal,
        isRescanning,
        isTransactionSaving,
        animateEditViewItems,
        creditUsedInSession,
        user,
        db,
        setCurrentTransaction,
        setTransactionEditorMode,
        setIsViewingReadOnly,
        transactions,
        setTransactionNavigationList,
        setIsTransactionSaving,
        setAnimateEditViewItems,
        setCreditUsedInSession,
        saveTransaction,
        deleteTransaction,
        processScan,
        handleRescan,
        hasActiveTransactionConflict,
    ]);

    // Story 14e-25b.2: DashboardView callbacks that need App-level state coordination
    // Data is now provided by useDashboardViewData hook inside DashboardView
    const dashboardCallbacks = useMemo(() => ({
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
    }), [navigateToTransactionDetail, setView]);

    // Story 14e-25b.2: handleClearAllLearnedData removed - now handled by SettingsView directly

    // Story 14e-25c.1: useSettingsViewProps removed - SettingsView owns data via useSettingsViewData
    // Account action callbacks passed via _testOverrides for App-level state coordination

    // Story 14e-31: useItemsViewProps removed - ItemsView owns data via useItemsViewData
    // onEditTransaction callback passed via _testOverrides for App-level state coordination
    const handleItemsEditTransaction = useCallback((transactionId: string, allTransactionIds?: string[]) => {
        const tx = activeTransactions.find(t => t.id === transactionId);
        if (tx) {
            navigateToTransactionDetail(tx as Transaction, allTransactionIds);
        }
    }, [activeTransactions, navigateToTransactionDetail]);

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
            {/* Story 14e-23b: App shell components - highest priority (z-60) */}
            <NavigationBlocker currentView={view} />
            <PWAUpdatePrompt language={lang} />

            {/* Non-scan overlays (insights, session, trust, batch summary, records)
              * Story 14e-23a: Scan overlays moved to ScanFeature (via FeatureOrchestrator)
              * Story 14e-23b: NavigationBlocker and PWAUpdatePrompt moved to App.tsx
              */}
            <AppOverlays
                // Core dependencies
                // Story 14e-23b: currentView and lang moved above (for NavigationBlocker/PWAUpdatePrompt)
                theme={theme as 'light' | 'dark'}
                t={t}
                // Story 14e-23a: Scan-related props removed (now in ScanFeature via FeatureOrchestrator)
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
                // Utility functions
                getLastWeekTotal={getLastWeekTotal}
                isInsightsSilenced={isInsightsSilenced}
            />
            {/* Story 14e-21: FeatureOrchestrator - centralized feature composition
              * Story 14e-23a: ScanFeature now handles all scan-related overlays
              * Composes ScanFeature, CreditFeature, and ModalManager.
              * Each feature handles its own visibility via internal Zustand store state.
              * BatchReviewFeature is rendered separately in view routing section (needs view context).
              */}
            <FeatureOrchestrator
                scanFeatureProps={{
                    // Core props
                    t,
                    theme: theme as 'light' | 'dark',
                    lang,
                    // Story 14e-23a fix: Pass current view for scan overlay visibility
                    // Single scan overlay should only show on scan-related views (matching batch mode)
                    currentView: view,
                    // Scan overlay handlers
                    onCancelProcessing: handleScanOverlayCancel,
                    onErrorDismiss: handleScanOverlayDismiss,
                    onRetry: handleScanOverlayRetry,
                    // Story 14e-23a: ScanOverlay props (migrated from AppOverlays)
                    scanOverlay,
                    isAnalyzing,
                    scanImages,
                    onScanOverlayCancel: handleScanOverlayCancel,
                    onScanOverlayRetry: handleScanOverlayRetry,
                    onScanOverlayDismiss: handleScanOverlayDismiss,
                    // Story 14e-23a: QuickSaveCard props (migrated from AppOverlays)
                    onQuickSave: handleQuickSave,
                    onQuickSaveEdit: handleQuickSaveEdit,
                    onQuickSaveCancel: handleQuickSaveCancel,
                    onQuickSaveComplete: handleQuickSaveComplete,
                    isQuickSaving,
                    currency,
                    formatCurrency,
                    userDefaultCountry: defaultCountry,
                    activeGroupForQuickSave: viewMode === 'group' && activeGroup ? {
                        id: activeGroup.id!,
                        name: activeGroup.name,
                        color: activeGroup.color,
                        icon: activeGroup.icon || undefined,
                    } : null,
                    // Story 14e-23a: Currency/Total mismatch dialog props (migrated from AppOverlays)
                    userCurrency: userPreferences.defaultCurrency || 'CLP',
                    onCurrencyUseDetected: handleCurrencyUseDetected,
                    onCurrencyUseDefault: handleCurrencyUseDefault,
                    onCurrencyMismatchCancel: handleCurrencyMismatchCancel,
                    onTotalUseItemsSum: handleTotalUseItemsSum,
                    onTotalKeepOriginal: handleTotalKeepOriginal,
                    onTotalMismatchCancel: handleTotalMismatchCancel,
                    // Story 14e-23a: BatchCompleteModal props (migrated from AppOverlays)
                    userCreditsRemaining: userCredits.superRemaining ?? 0,
                    onBatchCompleteDismiss: dismissScanDialog,
                    onBatchCompleteNavigateToHistory: (payload) => {
                        dismissScanDialog();
                        handleNavigateToHistory(payload);
                    },
                    onBatchCompleteGoHome: () => {
                        dismissScanDialog();
                        setView('dashboard');
                    },
                    // Story 14e-23: BatchDiscardDialog props
                    // Story 14e-29d: Using batchHandlers from useBatchReviewHandlers hook
                    onBatchDiscardConfirm: batchHandlers.handleDiscardConfirm,
                    onBatchDiscardCancel: batchHandlers.handleDiscardCancel,
                    // Story 14e-30: File input props
                    onFileSelect: handleFileSelect,
                    onFileInputReady: handleFileInputReady,
                }}
                creditFeatureProps={{
                    user,
                    services,
                    triggerCreditCheck: shouldTriggerCreditCheck,
                    // Story 14e-29d: Using batchHandlers from useBatchReviewHandlers hook
                    onCreditCheckComplete: batchHandlers.handleCreditCheckComplete,
                    onBatchConfirmed: batchHandlers.handleProcessingStart,
                    onReduceBatch: batchHandlers.handleReduceBatch,
                    batchImageCount: batchImages.length,
                    theme: theme as 'light' | 'dark',
                    t,
                }}
            />

            {/* AppLayout provides app shell with theme classes */}
            <AppLayout theme={theme} colorTheme={colorTheme}>
            {/* Story 14e-30: File input moved to ScanFeature */}

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
                {/* Story 14e-17b: CategoriesFeature provides category context to views.
                  * Views can use useCategoriesContext() to access category state.
                  */}
                <CategoriesFeature user={user} services={services}>
                {/* Story 14e-22: AppProviders consolidates app-level providers.
                  * Story 14e-25d: ViewHandlersProvider removed - views use direct hooks.
                  * Includes ThemeProvider, NavigationProvider, AppStateProvider, NotificationProvider.
                  */}
                <AppProviders
                    fontFamily={userPreferences?.fontFamily}
                    db={services?.db}
                    userId={user?.uid}
                    appId={services?.appId}
                >
                {view === 'dashboard' && (
                    <HistoryFiltersProvider>
                        {/* Story 14e-25b.2: DashboardView now owns its data via useDashboardViewData hook */}
                        <DashboardView _testOverrides={dashboardCallbacks} />
                    </HistoryFiltersProvider>
                )}

                {/* TransactionEditorView - Unified transaction editor */}
                {/* Story 14e-28b: TransactionEditorView now owns data via internal hooks */}
                {view === 'transaction-editor' && (
                    <TransactionEditorView
                        key={scanState.batchEditingIndex !== null ? `batch-${scanState.batchEditingIndex}` : 'single'}
                        _testOverrides={transactionEditorOverrides}
                    />
                )}

                {/* TrendsView with filters and analytics providers */}
                {/* Story 14e-25b.1: TrendsView now owns its data via useTrendsViewData hook */}
                {view === 'trends' && (
                    <HistoryFiltersProvider>
                        <AnalyticsProvider
                            key={analyticsInitialState ? JSON.stringify(analyticsInitialState.temporal) : 'default'}
                            initialState={analyticsInitialState ?? undefined}
                        >
                            <TrendsView />
                        </AnalyticsProvider>
                    </HistoryFiltersProvider>
                )}

                {/* InsightsView - insight history with inline header */}
                {/* Story 14e-25c.2: Minimal props - navigation via useNavigation() hook */}
                {view === 'insights' && renderInsightsView({
                    onEditTransaction: (transactionId: string) => {
                        const tx = transactions.find(t => t.id === transactionId);
                        if (tx) {
                            navigateToTransactionEditor('existing', tx);
                        }
                    },
                    theme,
                    t,
                })}

                {/* BatchCaptureView - batch mode from ScanContext */}
                {/* Story 14e-25c.2: Minimal props - navigation via useNavigation() hook */}
                {view === 'batch-capture' && (
                    <BatchCaptureView
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
                                            // Story 14e-16: Load into both scan store (for legacy) and batch review store (for orchestrator)
                                            dispatchBatchComplete(receipts);
                                            batchReviewActions.loadBatch(receipts);
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

                {/* Story 14e-16: BatchReviewFeature orchestrator - phase-based rendering from Zustand store
                  * Story 14e-29c: Updated to use handlersConfig - feature owns handlers internally */}
                {view === 'batch-review' && (
                    <BatchReviewFeature
                        t={t}
                        theme={theme as 'light' | 'dark'}
                        currency={currency}
                        formatCurrency={formatCurrency}
                        credits={{
                            remaining: userCredits.remaining,
                            superRemaining: userCredits.superRemaining ?? 0,
                        }}
                        onCreditInfoClick={() => openModalAction('creditInfo', {
                            normalCredits: userCredits.remaining,
                            superCredits: userCredits.superRemaining ?? 0,
                            onClose: closeModalAction,
                        })}
                        processingStates={batchProcessing.states}
                        processingProgress={batchProcessing.progress}
                        onCancelProcessing={batchProcessing.cancel}
                        batchSession={batchSession ?? undefined}
                        handlersConfig={{
                            // Core dependencies
                            user,
                            services,
                            scanState,
                            // State setters
                            setBatchEditingIndexContext,
                            setCurrentTransaction,
                            setTransactionEditorMode,
                            navigateToView,
                            setView,
                            setBatchImages,
                            batchProcessing,
                            resetScanContext,
                            showScanDialog,
                            dismissScanDialog,
                            // Mapping functions
                            mappings,
                            applyCategoryMappings,
                            findMerchantMatch,
                            applyItemNameMappings,
                            // Credit check functions (optional - handled by CreditFeature)
                            userCredits,
                            // checkCreditSufficiency, setCreditCheckResult, setShowCreditWarning
                            // are managed by CreditFeature - not passed here (Story 14e-29c)
                            // Processing handler dependencies (from Story 14e-29b)
                            setShowBatchPreview,
                            setShouldTriggerCreditCheck,
                            batchImages,
                            scanCurrency,
                            scanStoreType,
                            viewMode,
                            activeGroup: activeGroup ?? null,
                            batchProcessingExtended: batchProcessing,
                            setScanImages,
                            // Story 14e-33: Trust prompt clearing when navigating away from batch review
                            clearTrustPrompt: () => {
                                setShowTrustPrompt(false);
                                setTrustPromptData(null);
                            },
                        }}
                        onRetryReceipt={(_receipt) => {
                            // Retry a failed receipt by re-processing
                            setToastMessage({ text: t('retryNotImplemented') || 'Retry not implemented', type: 'info' });
                        }}
                    />
                )}

                {/* Story 14e-25c.1: SettingsView now owns data via useSettingsViewData */}
                {view === 'settings' && (
                    <SettingsView
                        _testOverrides={{
                            onWipeDB: wipeDB,
                            onExportAll: handleExportData,
                            onSignOut: signOut,
                            wiping,
                            exporting,
                        }}
                    />
                )}
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

                {/* Transaction History View - Story 14e-25a.2b: HistoryView now owns its data */}
                {view === 'history' && (
                    <HistoryFiltersProvider
                        initialState={pendingHistoryFilters || undefined}
                        onStateChange={setPendingHistoryFilters}
                    >
                        <HistoryView
                            _testOverrides={{
                                onEditTransaction: (tx) => navigateToTransactionDetail(tx as Transaction),
                            }}
                        />
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
                {/* Story 14e-31: ItemsView owns data via useItemsViewData, handler via _testOverrides */}
                {view === 'items' && (
                    <HistoryFiltersProvider
                        initialState={pendingHistoryFilters || undefined}
                        onStateChange={setPendingHistoryFilters}
                    >
                        <ItemsView
                            _testOverrides={{
                                onEditTransaction: handleItemsEditTransaction,
                            }}
                        />
                    </HistoryFiltersProvider>
                )}

                {/* Weekly Reports View */}
                {/* Story 14e-25c.2: Minimal props - transactions via internal hooks, navigation via useNavigation() */}
                {view === 'reports' && renderReportsView({
                    theme,
                    t,
                })}
                </AppProviders>
                </CategoriesFeature>
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
                        // Story 14e-33 AC2: Clear previous batch session to prevent stale data
                        clearBatch();
                        // Story 14e-33: Clear any pending trust prompts from previous sessions
                        setShowTrustPrompt(false);
                        setTrustPromptData(null);
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

            {/* Story 14e-23: Toast component (extracted from inline JSX) */}
            <Toast message={toastMessage} />

            {/* Story 14e-4: Credit Info Modal now rendered by ModalManager */}

            {/* Batch upload preview for multi-image selection with safe area padding */}
            {showBatchPreview && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                    style={{ padding: 'calc(1rem + var(--safe-top, 0px)) calc(1rem + var(--safe-right, 0px)) calc(1rem + var(--safe-bottom, 0px)) calc(1rem + var(--safe-left, 0px))' }}
                >
                    {/* Story 14e-29d: Using batchHandlers from useBatchReviewHandlers hook */}
                    <BatchUploadPreview
                        images={batchImages}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        onConfirm={batchHandlers.handleConfirmWithCreditCheck}
                        onCancel={batchHandlers.handleCancelPreview}
                        onRemoveImage={batchHandlers.handleRemoveImage}
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

            {/* Story 14e-23: BatchDiscardDialog now rendered by ScanFeature via FeatureOrchestrator */}

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
