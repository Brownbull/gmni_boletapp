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
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { migrateCreatedAt } from './utils/migrateCreatedAt';
import { useRecentScans } from './hooks/useRecentScans';
import { usePaginatedTransactions } from './hooks/usePaginatedTransactions';
import { CategoriesFeature } from '@features/categories';
import { useToast } from '@/shared/hooks';
import { Toast } from '@/shared/ui';
import {
    useSettingsStore,
    useLang,
    useCurrency,
    useDateFormat,
    useCurrentView,
    useSettingsSubview,
    usePendingHistoryFilters,
    usePendingDistributionView,
    useAnalyticsInitialState,
    useNavigationActions,
    useCurrentInsight,
    useShowInsightCard,
    useShowSessionComplete,
    useSessionContext,
    useShowBatchSummary,
    useInsightActions,
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
// App-level handler hooks
import { useTransactionHandlers, useScanHandlers, useDialogHandlers } from './hooks/app';
import { AppProviders } from '@app/AppProviders';
import { JoinGroupDialog } from './components/SharedGroups/JoinGroupDialog';
import type { SharedGroup } from './types/sharedGroup';
import { getFirestore } from 'firebase/firestore';
import { useBatchProcessing } from './hooks/useBatchProcessing';
import { DIALOG_TYPES } from './types/scanStateMachine';
import { LoginScreen } from './views/LoginScreen';
import { DashboardView } from './views/DashboardView';
import { TrendsView } from './views/TrendsView';
import { HistoryView } from './views/HistoryView';
import { ItemsView } from './views/ItemsView';
import { BatchCaptureView } from './views/BatchCaptureView';
import { SettingsView } from './views/SettingsView';
import { TransactionEditorView } from './views/TransactionEditorView';
import { Nav, ScanStatus } from './components/Nav';
import { TopHeader } from './components/TopHeader';
import { type SessionContext, type SessionAction } from './components/session';
import { BatchUploadPreview } from './components/scan';
import { NavigationBlocker } from './components/NavigationBlocker';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { useScanOverlayState } from './hooks/useScanOverlayState';
import { PROCESSING_TIMEOUT_MS } from './hooks/useScanState';
import { BatchProcessingOverlay } from './components/scan';
import { hasActiveTransactionConflict as hasActiveTransactionConflictUtil } from '@features/scan';
import type { TrustPromptEligibility } from './types/trust';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import {
    useScanStore,
    useScanActions,
    useIsProcessing,
    useScanMode,
    useSkipScanCompleteModal,
    useIsRescanning,
} from '@features/scan/store';
import {
    useCurrentTransaction,
    useNavigationList,
    useIsReadOnly,
    useCreditUsedInSession,
    useIsSaving,
    useAnimateItems,
    useEditorMode,
    useTransactionEditorActions,
} from '@features/transaction-editor';
import { getQuarterFromMonth } from './utils/analyticsHelpers';
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
import { Transaction } from './types/transaction';
import { Insight } from './types/insight';
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
import { useModalActions } from './managers/ModalManager';
import { processScan as processScanHandler, useScanInitiation } from '@features/scan';
import type { ScanInitiationProps } from '@features/scan';
import {
    BatchReviewFeature,
    batchReviewActions,
    useBatchReviewHandlers,
} from '@features/batch-review';
import type { BatchReviewHandlersProps } from '@features/batch-review';
import { createBatchReceiptsFromResults } from './hooks/useBatchReview';
// Story 14e-21: FeatureOrchestrator - centralized feature composition
import { FeatureOrchestrator } from '@app/FeatureOrchestrator';
// Story 14e-41: reconcileItemsTotal moved to entity (single source of truth)
import { reconcileItemsTotal } from '@entities/transaction';

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

    // HistoryView gets pagination via useHistoryViewData hook internally
    const { transactions: paginatedTransactions } = usePaginatedTransactions(user, services);

    // Merge recentScans into paginatedTransactions for RecentScansView
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
    const { mappings } = useCategoryMappings(user, services);
    const { findMatch: findMerchantMatch } = useMerchantMappings(user, services);
    useSubcategoryMappings(user, services);
    const { findMatch: findItemNameMatch } = useItemNameMappings(user, services);

    // User preferences (currency, location, profile settings)
    const { preferences: userPreferences } = useUserPreferences(user, services);

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
    const { groups: userSharedGroups, isLoading: sharedGroupsLoading } = useUserSharedGroups(db, user?.uid);
    const [showViewModeSwitcher, setShowViewModeSwitcher] = useState(false);

    // Stub for shared group transactions (feature disabled - see Epic 14d-v2)
    const sharedGroupRawTransactions: any[] = [];

    // Scan state from Zustand store
    const scanState = useScanStore();
    const scanMode = useScanMode();
    const isContextProcessing = useIsProcessing();

    // Scan actions from Zustand store
    const {
        startSingle: startScanContext,
        startBatch: startBatchScanContext,
        startStatement: startStatementScanContext,
        batchItemStart: dispatchBatchItemStart,
        batchItemSuccess: dispatchBatchItemSuccess,
        batchItemError: dispatchBatchItemError,
        batchComplete: dispatchBatchComplete,
        setBatchEditingIndex: setBatchEditingIndexContext,
        showDialog: showScanDialogZustand,
        dismissDialog: dismissScanDialog,
        setImages: setScanContextImages,
        processStart: dispatchProcessStart,
        processSuccess: dispatchProcessSuccess,
        processError: dispatchProcessError,
        reset: resetScanContext,
        restoreState: restoreScanState,
        setSkipScanCompleteModal,
        setIsRescanning,
    } = useScanActions();

    // Wrapper to maintain old showDialog(type, data) signature
    const showScanDialog = useCallback((type: string, data?: unknown) => {
        showScanDialogZustand({ type, data } as any);
    }, [showScanDialogZustand]);

    // Computed values derived from Zustand state
    const isBatchModeFromContext = scanMode === 'batch';

    // Wrapper functions for setStoreType and setCurrency (use restoreState)
    const setScanContextStoreType = useCallback((storeType: ReceiptType) => {
        restoreScanState({ storeType });
    }, [restoreScanState]);

    const setScanContextCurrency = useCallback((currency: string) => {
        restoreScanState({ currency });
    }, [restoreScanState]);

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

    // Story 14e-38: UI flag for scan complete modal suppression - from Zustand store
    const skipScanCompleteModal = useSkipScanCompleteModal();

    // ==========================================================================
    // UI State
    // ==========================================================================

    // Navigation state from Zustand store
    const view = useCurrentView();
    const settingsSubview = useSettingsSubview();
    const pendingHistoryFilters = usePendingHistoryFilters();
    const pendingDistributionView = usePendingDistributionView();
    const analyticsInitialState = useAnalyticsInitialState();
    const {
        setView,
        setSettingsSubview,
        saveScrollPosition,
        setPendingHistoryFilters,
        setPendingDistributionView,
        setAnalyticsInitialState,
        clearAnalyticsInitialState,
    } = useNavigationActions();
    const isRescanning = useIsRescanning();

    // Transaction editor state from Zustand store
    const currentTransaction = useCurrentTransaction();
    const transactionNavigationList = useNavigationList();
    const isViewingReadOnly = useIsReadOnly();
    const creditUsedInSession = useCreditUsedInSession();
    const isTransactionSaving = useIsSaving();
    const animateEditViewItems = useAnimateItems();
    const transactionEditorMode = useEditorMode();
    const {
        setTransaction: setCurrentTransaction,
        setNavigationList: setTransactionNavigationList,
        setReadOnly: setIsViewingReadOnly,
        setCreditUsed: setCreditUsedInSession,
        setAnimateItems: setAnimateEditViewItems,
        setMode: setTransactionEditorMode,
    } = useTransactionEditorActions();

    // Insight and session UI state from Zustand store
    const currentInsight = useCurrentInsight();
    const showInsightCard = useShowInsightCard();
    const showSessionComplete = useShowSessionComplete();
    const sessionContext = useSessionContext();
    const showBatchSummary = useShowBatchSummary();
    const {
        showInsight: storeShowInsight,
        hideInsight,
        showSessionCompleteOverlay,
        hideSessionCompleteOverlay,
        showBatchSummaryOverlay,
        hideBatchSummaryOverlay,
    } = useInsightActions();

    // Wrapper functions to bridge old useState setters to store actions
    const setCurrentInsight = useCallback((insight: Insight | null) => {
        if (insight) {
            storeShowInsight(insight);
        }
    }, [storeShowInsight]);

    const setShowInsightCard = useCallback((show: boolean) => {
        if (!show) {
            hideInsight();
        }
    }, [hideInsight]);

    const setShowBatchSummary = useCallback((show: boolean) => {
        if (show) {
            showBatchSummaryOverlay();
        } else {
            hideBatchSummaryOverlay();
        }
    }, [showBatchSummaryOverlay, hideBatchSummaryOverlay]);

    const setSessionContext = useCallback((ctx: SessionContext | null) => {
        if (ctx) {
            showSessionCompleteOverlay(ctx);
        } else {
            hideSessionCompleteOverlay();
        }
    }, [showSessionCompleteOverlay, hideSessionCompleteOverlay]);

    // Batch upload and processing state
    const [showBatchPreview, setShowBatchPreview] = useState(false);
    const [isQuickSaving, setIsQuickSaving] = useState(false);
    const batchProcessing = useBatchProcessing(3);

    // Refs for CreditFeature actions (enables cross-component communication)
    const trustActionsRef = useRef<{
        showTrustPromptAction: (data: TrustPromptEligibility) => void;
        hideTrustPrompt: () => void;
    } | null>(null);
    const creditActionsRef = useRef<{
        triggerCreditCheck: () => void;
    } | null>(null);

    const scanOverlay = useScanOverlayState();
    const prefersReducedMotion = useReducedMotion();

    // ==========================================================================
    // Settings State (from Zustand store)
    // ==========================================================================
    const lang = useLang();
    const currency = useCurrency();
    const dateFormat = useDateFormat();
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
    const [exporting, _setExporting] = useState(false);
    const { toastMessage, showToast, dismissToast } = useToast();
    const setToastMessage = useCallback((msg: { text: string; type: 'success' | 'info' } | null) => {
        if (msg) {
            showToast(msg.text, msg.type);
        } else {
            dismissToast();
        }
    }, [showToast, dismissToast]);

    // File input ref (owned by ScanFeature, received via callback)
    const [fileInputRef, setFileInputRef] = useState<React.RefObject<HTMLInputElement>>({ current: null });
    const handleFileInputReady = useCallback((ref: React.RefObject<HTMLInputElement>) => {
        setFileInputRef(ref);
    }, []);
    const mainRef = useRef<HTMLDivElement>(null);
    const t = (k: string) => (TRANSLATIONS[lang] as any)[k] || k;

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
        // Story 14e-34b: discardBatchReceipt removed - now using atomicBatchActions internally
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

    // Dialog handlers (conflict dialog uses Modal Manager)
    useDialogHandlers({
        scanState,
        setCurrentTransaction,
        resetScanState: resetScanContext,
        clearBatchImages: useCallback(() => setScanContextImages([]), [setScanContextImages]),
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
        // Story 14e-39: Trust prompt - wrapper functions that call CreditFeature actions via ref
        setTrustPromptData: (data: TrustPromptEligibility | null) => {
            if (data) {
                trustActionsRef.current?.showTrustPromptAction(data);
            }
        },
        setShowTrustPrompt: (show: boolean) => {
            if (!show) {
                trustActionsRef.current?.hideTrustPrompt();
            }
            // When show=true, the data is set via setTrustPromptData which calls showTrustPromptAction
        },
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
                // Story 14e-34a: setBatchImages removed - images already restored via restoreScanState
                if (storedState.mode === 'batch') {
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

    // Story 14e-40: Wrapper for extracted conflict detection utility
    // Check if there's an active transaction that would conflict with a new action
    const hasActiveTransactionConflict = useCallback(() => {
        return hasActiveTransactionConflictUtil(scanState, view);
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
     /**
     * processScan - Wrapper that calls the extracted processScan handler.
     * Story 14e-8c: Extract processScan Handler
     * Story 14e-43: Simplified - UI callbacks now use Zustand stores directly
     *
     * Collects all dependencies from App.tsx scope and passes them to the
     * extracted handler in src/features/scan/handlers/processScan/processScan.ts.
     *
     * The handler now accesses these stores directly (no callback injection needed):
     * - scanActions: processStart/Success/Error, showDialog, setImages, setSkipScanCompleteModal
     * - transactionEditorActions: setTransaction, setAnimateItems, setCreditUsed
     * - navigationActions: setView
     * - insightActions: showInsight, showBatchSummaryOverlay
     *
     * @param imagesToProcess - Optional images to process (avoids stale closure)
     */
    const processScan = useCallback(async (imagesToProcess?: string[]) => {
        // Collect images (parameter takes precedence to avoid stale closure)
        const images = imagesToProcess ?? scanImages;

        // Story 14e-43: Simplified call - most UI callbacks removed (now use stores directly)
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
                findItemNameMatch, // Story 14e-42: Pure utility uses DI
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
            // Story 14e-43: Only setToastMessage required - other callbacks now use stores directly
            ui: {
                setToastMessage,
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
                // Story 14e-43: onShowInsight/onShowBatchSummary removed - now use insightActions directly
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
        // Story 14e-43: UI callback dependencies removed - stores are accessed directly
        setToastMessage,
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
        // Story 14e-34a: setBatchImages removed - now uses useScanStore.setImages directly
        batchProcessing,
        resetScanContext,
        showScanDialog,
        dismissScanDialog,
        // Mapping functions
        mappings,
        applyCategoryMappings,
        findMerchantMatch,
        findItemNameMatch, // Story 14e-42: Pure utility uses DI
        // Credit check (handled by CreditFeature - optional props)
        userCredits,
        // Processing handler dependencies
        setShowBatchPreview,
        // Story 14e-39 (code review fix): Use ref-based wrapper instead of useState setter
        setShouldTriggerCreditCheck: () => {
            creditActionsRef.current?.triggerCreditCheck();
        },
        // Story 14e-34a: batchImages removed - now uses useScanStore.images directly
        scanCurrency,
        scanStoreType,
        viewMode,
        activeGroup: activeGroup ?? null,
        batchProcessingExtended: batchProcessing,
        setScanImages,
        // Story 14e-39: Trust prompt clearing via CreditFeature actions ref
        clearTrustPrompt: () => {
            trustActionsRef.current?.hideTrustPrompt();
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
        setShowBatchPreview,
        // Story 14e-39 (code review fix): setShouldTriggerCreditCheck removed - uses creditActionsRef
        // Story 14e-34a: batchImages removed - now uses useScanStore.images
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
        // Story 14e-34a: setBatchImages removed - now uses useScanStore.setImages directly
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
        // Story 14e-34a: setBatchImages removed
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

    // Story 14e-39: Trust prompt handlers moved to CreditFeature
    // Callback for CreditFeature - called when user accepts trust
    const handleCreditFeatureAcceptTrust = useCallback(async (merchantName: string) => {
        await acceptTrust(merchantName);
        setToastMessage({ text: t('trustMerchantConfirm'), type: 'success' });
    }, [acceptTrust, setToastMessage, t]);

    // Callback for CreditFeature - called when user declines trust
    const handleCreditFeatureDeclineTrust = useCallback(async (merchantName: string) => {
        await declinePrompt(merchantName);
    }, [declinePrompt]);

    // Callback for CreditFeature - stores trust actions ref for useScanHandlers
    const handleTrustActionsReady = useCallback((actions: { showTrustPromptAction: (data: TrustPromptEligibility) => void; hideTrustPrompt: () => void }) => {
        trustActionsRef.current = actions;
    }, []);

    // Story 14e-39 (code review fix): Callback for CreditFeature - stores credit actions ref for useBatchReviewHandlers
    const handleCreditActionsReady = useCallback((actions: { triggerCreditCheck: () => void }) => {
        creditActionsRef.current = actions;
    }, []);

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

    // When in group mode, use shared group transactions; otherwise use personal transactions
    const isGroupMode = viewMode === 'group' && !!activeGroup;
    const safeSharedGroupRawTransactions = Array.isArray(sharedGroupRawTransactions)
        ? sharedGroupRawTransactions
        : [];
    const activeTransactions = isGroupMode ? safeSharedGroupRawTransactions : transactions;

    // ==========================================================================
    // View Props Composition (views own data via internal hooks)
    // ==========================================================================

    // TransactionEditorView _testOverrides provides App-level state coordination
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
        // Story 14e-36c: Editor state/actions now from store, only external deps needed
        user,
        db,
        transactions,
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
        transactions,
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
                // Story 14e-37: Using store selectors
                showInsightCard={showInsightCard}
                currentInsight={currentInsight}
                onInsightDismiss={() => {
                    // Story 14e-37: Using store actions directly
                    hideInsight();
                    // Note: sessionContext remains in store, show session complete if context exists
                    if (sessionContext) {
                        showSessionCompleteOverlay(sessionContext);
                    }
                }}
                // Session complete props
                // Story 14e-37: Using store selectors
                showSessionComplete={showSessionComplete}
                sessionContext={sessionContext}
                onSessionCompleteDismiss={() => {
                    // Story 14e-37: Using store action (clears both flag and context)
                    hideSessionCompleteOverlay();
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
                    // Story 14e-37: Using store action
                    hideBatchSummaryOverlay();
                    clearBatch();
                    setView('dashboard');
                }}
                // Story 14e-39: Trust merchant prompt props REMOVED - now managed by CreditFeature
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
                    // Story 14e-39 (code review fix): triggerCreditCheck prop REMOVED
                    // Credit check now triggered via onCreditActionsReady callback pattern
                    // Story 14e-29d: Using batchHandlers from useBatchReviewHandlers hook
                    onCreditCheckComplete: batchHandlers.handleCreditCheckComplete,
                    onBatchConfirmed: batchHandlers.handleProcessingStart,
                    onReduceBatch: batchHandlers.handleReduceBatch,
                    // Story 14e-34a: Use scan store (single source of truth)
                    batchImageCount: scanState.images.length,
                    theme: theme as 'light' | 'dark',
                    t,
                    // Story 14e-39: Trust prompt callbacks
                    onAcceptTrust: handleCreditFeatureAcceptTrust,
                    onDeclineTrust: handleCreditFeatureDeclineTrust,
                    onTrustActionsReady: handleTrustActionsReady,
                    // Story 14e-39 (code review fix): Credit actions callback
                    onCreditActionsReady: handleCreditActionsReady,
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
                  * Story 14e-45: NavigationProvider removed - navigation via useNavigationStore.
                  * Includes ThemeProvider, AppStateProvider, NotificationProvider.
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
                            // Story 14e-34a: Only use scan store (single source of truth)
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
                            // Story 14e-34a: Use scan store (single source of truth)
                            setScanContextImages([]); // Clear images when switching to individual
                            handleNewTransaction(false);
                        }}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        // Pass credits for header display and credit usage section
                        superCreditsAvailable={userCredits.superRemaining}
                        normalCreditsAvailable={userCredits.remaining}
                        // Story 14e-4: onCreditInfoClick removed - Nav uses Modal Manager directly
                        // Story 14e-34a: Use scan store (single source of truth)
                        imageDataUrls={scanState.images}
                        onImagesChange={(dataUrls) => setScanContextImages(dataUrls)}
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
                            // Story 14e-34a: setBatchImages removed - now uses useScanStore.setImages directly
                            batchProcessing,
                            resetScanContext,
                            showScanDialog,
                            dismissScanDialog,
                            // Mapping functions
                            mappings,
                            applyCategoryMappings,
                            findMerchantMatch,
                            findItemNameMatch, // Story 14e-42: Pure utility uses DI
                            // Credit check functions (optional - handled by CreditFeature)
                            userCredits,
                            // checkCreditSufficiency, setCreditCheckResult, setShowCreditWarning
                            // are managed by CreditFeature - not passed here (Story 14e-29c)
                            // Processing handler dependencies (from Story 14e-29b)
                            setShowBatchPreview,
                            // Story 14e-39 (code review fix): Use ref-based wrapper instead of useState setter
                            setShouldTriggerCreditCheck: () => {
                                creditActionsRef.current?.triggerCreditCheck();
                            },
                            // Story 14e-34a: batchImages removed - now uses useScanStore.images directly
                            scanCurrency,
                            scanStoreType,
                            viewMode,
                            activeGroup: activeGroup ?? null,
                            batchProcessingExtended: batchProcessing,
                            setScanImages,
                            // Story 14e-39: Trust prompt clearing via CreditFeature actions ref
                            clearTrustPrompt: () => {
                                trustActionsRef.current?.hideTrustPrompt();
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
                    // Story 14e-34a: Use scan store (single source of truth)
                    else if (scanState.images.length > 0) {
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
                    // Story 14e-34a: Use scan store (single source of truth)
                    } else if (scanState.images.length > 0) {
                        // Batch images captured but not processed - return to capture
                        if (!isBatchModeFromContext && user?.uid) {
                            startBatchScanContext(user.uid);
                        }
                        navigateToView('batch-capture');
                    } else {
                        // No active batch - start new batch capture
                        // Story 14e-33 AC2: Clear previous batch session to prevent stale data
                        clearBatch();
                        // Story 14e-39: Clear any pending trust prompts via CreditFeature
                        trustActionsRef.current?.hideTrustPrompt();
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
                    {/* Story 14e-34a: BatchUploadPreview now reads images from useScanStore directly */}
                    <BatchUploadPreview
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
                // Story 14e-35: lang prop removed - JoinGroupDialog's lang prop is deprecated and unused
            />
            </AppLayout>
        </>
    );
}

export default App;
