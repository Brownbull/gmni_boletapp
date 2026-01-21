import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Story 14.15 Session 10: Icons for credit info modal
import { Camera, Zap, X, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
// Story 14.31: Migration utility for createdAt field
import { migrateCreatedAt } from './utils/migrateCreatedAt';
// v9.7.0: Recent scans for "Últimos Escaneados" (ordered by createdAt, not date)
import { useRecentScans } from './hooks/useRecentScans';
// Story 14.27: Paginated transactions for HistoryView infinite scroll
import { usePaginatedTransactions } from './hooks/usePaginatedTransactions';
import { useCategoryMappings } from './hooks/useCategoryMappings';
import { useMerchantMappings } from './hooks/useMerchantMappings';
import { useSubcategoryMappings } from './hooks/useSubcategoryMappings';
// v9.7.0: Per-Store Item Name Learning
import { useItemNameMappings } from './hooks/useItemNameMappings';
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
// Story 14.19: Personal records detection and celebration
import { usePersonalRecords } from './hooks/usePersonalRecords';
// Story 14c.2: Pending invitations for shared groups
import { usePendingInvitations } from './hooks/usePendingInvitations';
// Story 14c.13: In-app notifications for shared groups
import { useInAppNotifications } from './hooks/useInAppNotifications';
// Story 14c.4: View Mode Switcher for personal/group views
import { useViewMode } from './contexts/ViewModeContext';
import { useUserSharedGroups } from './hooks/useUserSharedGroups';
import { ViewModeSwitcher } from './components/SharedGroups/ViewModeSwitcher';
// Story 14c.18: View mode preference persistence (Firestore sync)
import { useViewModePreferencePersistence } from './hooks/useViewModePreferencePersistence';
// Story 14c.17: Share Link Deep Linking - join shared groups via URL
import { useJoinLinkHandler } from './hooks/useJoinLinkHandler';
import { JoinGroupDialog } from './components/SharedGroups/JoinGroupDialog';
// Story 14c.5: Shared group transactions hook for group mode
// Story 14c.13: Delta fetch on notification click (Option C)
import { useSharedGroupTransactions, useNotificationDeltaFetch } from './hooks/useSharedGroupTransactions';
import type { SharedGroup } from './types/sharedGroup';
import { getFirestore } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
// Story 14c.7: Tag transactions to groups
import { updateMemberTimestampsForTransaction } from './services/sharedGroupService';
import type { GroupWithMeta } from './components/SharedGroups';
// Story 14c.5 Bug Fix: Clear IndexedDB cache when group assignments change
import { clearGroupCacheById } from './lib/sharedGroupCache';
// Story 14c.12: Member update detection for cross-user sync
import { detectMemberUpdates, type MemberUpdatesMap } from './utils/memberUpdateDetection';
// Story 12.2: Parallel batch processing hook
import { useBatchProcessing } from './hooks/useBatchProcessing';
// Story 12.3: Batch review type for edit flow
// Story 14d.5c: Import createBatchReceiptsFromResults for context integration
import type { BatchReceipt } from './hooks/useBatchReview';
import { createBatchReceiptsFromResults } from './hooks/useBatchReview';
// Story 14d.5d: Import dialog data types for batch complete modal
import type {
    BatchCompleteDialogData,
    CurrencyMismatchDialogData,
    TotalMismatchDialogData,
    QuickSaveDialogData,
} from './types/scanStateMachine';
import { DIALOG_TYPES } from './types/scanStateMachine';
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
// Story 14c.13: Notifications view with ProfileDropdown
import { NotificationsView } from './views/NotificationsView';
// Story 14.14: Transaction List View (accessible via profile menu)
import { HistoryView } from './views/HistoryView';
// Story 14.31: Items History View (accessible via profile menu or item category clicks)
import { ItemsView } from './views/ItemsView';
// Story 12.1: Batch Capture UI - dedicated view for batch mode scanning
import { BatchCaptureView } from './views/BatchCaptureView';
// Story 12.3: Batch Review Queue - review processed receipts before saving
import { BatchReviewView } from './views/BatchReviewView';
// Story 14d.9: Statement Scan Placeholder View
import { StatementScanView } from './views/StatementScanView';
import { SettingsView } from './views/SettingsView';
// Story 14.16: Weekly Report Story Format - Instagram-style swipeable report cards
import { ReportsView } from './views/ReportsView';
// Story 14.31: Recent Scans view - dedicated view for latest scans sorted by scan date
import { RecentScansView } from './views/RecentScansView';
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
// Story 14d.3: Navigation blocker for browser back button
import { NavigationBlocker } from './components/NavigationBlocker';
// Story 10.6: Insight card components
import { InsightCard } from './components/insights/InsightCard';
import { BuildingProfileCard } from './components/insights/BuildingProfileCard';
// Story 10.7: Batch summary component
import { BatchSummary } from './components/insights/BatchSummary';
// Story 14.19: Personal record celebration banner
import { PersonalRecordBanner } from './components/celebrations';
// Story 14.20: Session completion messaging
import { SessionComplete, type SessionContext, type SessionAction } from './components/session';
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
// Story 14d.6: TotalValidationResult moved to scanStateMachine.ts types
import { validateTotal } from './utils/totalValidation';
// Story 11.4: Trust Merchant Prompt component
import { TrustMerchantPrompt } from './components/TrustMerchantPrompt';
// Story 12.4: Credit Warning System
import { CreditWarningDialog } from './components/batch';
// Story 12.1 v9.7.0: Batch Processing Overlay
import { BatchProcessingOverlay } from './components/scan';
import { checkCreditSufficiency, type CreditCheckResult } from './services/creditService';
// Story 14.24: Transaction conflict dialog for single active transaction paradigm
import { TransactionConflictDialog, type ConflictingTransaction, type ConflictReason } from './components/dialogs/TransactionConflictDialog';
import type { TrustPromptEligibility } from './types/trust';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
// Story 14d.4c: ScanProvider moved to main.tsx, now using useScan() directly
import { useScan } from './contexts/ScanContext';
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
import { Transaction, StoreCategory, TransactionItem } from './types/transaction';
// Story 10.6: Insight types
import { Insight } from './types/insight';
import { Language, Currency, Theme, ColorTheme, FontColorMode, FontSize } from './types/settings';
// Story 9.10: Persistent scan state management
// Story 14d.4e: PendingScan removed - now using ScanContext (scanState) exclusively
// import { PendingScan, createPendingScan } from './types/scan'; // REMOVED in 14d.4e
// Story 14d.4d: Persistent scan state storage (survives refresh/logout)
// Uses new ScanState format with backwards compatibility for old PendingScan format
// Story 14d.5e: Now handles both single and batch mode (unified persistence)
import {
    loadPersistedScanState,
    savePersistedScanState,
    clearPersistedScanState,
    clearLegacyBatchStorage,  // Story 14d.5e: Clear old batch storage during migration
    // Story 14d.4e: Legacy API removed - migration complete
    // savePendingScan, loadPendingScan, clearPendingScan - REMOVED in 14d.4e
} from './services/pendingScanStorage';
// Story 12.1 v9.7.0: Persistent pending batch storage (survives refresh/logout)
// Story 14d.5e: DEPRECATED - batch persistence now unified in pendingScanStorage.ts
// Import removed: savePendingBatch, loadPendingBatch, clearPendingBatch, PendingBatch, createPendingBatch
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
// v9.7.0: Per-Store Item Name Learning
import { incrementItemNameMappingUsage } from './services/itemNameMappingService';
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
// Story 14.31: Added 'items' view for item history (accessible via profile menu or item category clicks)
// Story 14d.9: Added 'statement-scan' view for statement scanning placeholder
// Story 14.31: Added 'recent-scans' view for viewing all recent scans sorted by scan date
type View = 'dashboard' | 'scan' | 'scan-result' | 'edit' | 'transaction-editor' | 'trends' | 'insights' | 'settings' | 'alerts' | 'batch-capture' | 'batch-review' | 'history' | 'reports' | 'items' | 'statement-scan' | 'recent-scans';

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
    // v9.7.0: Recent scans for "Últimos Escaneados" (ordered by createdAt, not date)
    // This separate query ensures recently scanned receipts appear even if their
    // transaction date is outside the top 100 by date
    const recentScans = useRecentScans(user, services);

    // Story 14.31: Expose migration function to browser console for fixing createdAt
    useEffect(() => {
        if (import.meta.env.DEV && services?.db && user?.uid) {
            (window as any).runCreatedAtMigration = async (dryRun = true) => {
                return migrateCreatedAt(services.db, user.uid, services.appId, dryRun);
            };
            // Story 14c.5 Bug Fix: Expose cache clearing function for debugging
            (window as any).clearAllGroupCaches = async () => {
                const { clearAllGroupCaches } = await import('./lib/sharedGroupCache');
                await clearAllGroupCaches();
                console.log('[App] All group caches cleared. Refresh to fetch fresh data.');
            };
        }
    }, [services, user]);
    // Story 14.27: Paginated transactions for HistoryView (includes loadMore for older transactions)
    const {
        transactions: paginatedTransactions,
        hasMore: hasMoreTransactions,
        loadMore: loadMoreTransactions,
        loadingMore: loadingMoreTransactions,
        isAtListenerLimit,
    } = usePaginatedTransactions(user, services);

    // Story 14.31: Merge recentScans into paginatedTransactions for HistoryView
    // This ensures recently scanned receipts with old transaction dates appear when
    // sorting by "Ingresado" (scan date). Deduplicated by transaction ID.
    const transactionsWithRecentScans = useMemo(() => {
        const txMap = new Map<string, Transaction>();
        // Add paginated transactions first
        for (const tx of paginatedTransactions) {
            if (tx.id) txMap.set(tx.id, tx);
        }
        // Merge in recent scans (these may have old dates but recent createdAt)
        for (const tx of recentScans) {
            if (tx.id && !txMap.has(tx.id)) {
                txMap.set(tx.id, tx);
            }
        }
        // Return as array (sorting handled by HistoryView)
        return Array.from(txMap.values());
    }, [paginatedTransactions, recentScans]);
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
    // v9.7.0: Per-Store Item Name Learning - mappings scoped by merchant
    // Phase 4: itemNameMappings now used for cross-store suggestions
    // Phase 5: Added settings UI for item name mappings management
    const {
        mappings: itemNameMappings, // Used for cross-store suggestions in TransactionEditorView
        loading: itemNameMappingsLoading, // Phase 5: Used for settings UI loading state
        saveMapping: saveItemNameMapping,
        deleteMapping: deleteItemNameMapping, // Phase 5: Used for settings UI delete
        updateMapping: updateItemNameMapping, // Phase 5: Used for settings UI edit
        findMatch: findItemNameMatch,
        findMatchesForMerchant: _findItemNameMatchesForMerchant // Available for bulk operations (future)
    } = useItemNameMappings(user, services);
    // Story 9.8: User preferences for default scan currency
    // Story 14.22: Extended to include location settings from Firestore
    // Story 14c.18: Added view mode preference for group persistence
    const {
        preferences: userPreferences,
        loading: preferencesLoading,
        setDefaultCurrency: setDefaultScanCurrencyPref,
        setDefaultCountry: setDefaultCountryPref,
        setDefaultCity: setDefaultCityPref,
        // Story 14.22: These will be used in Profile sub-view (Task 6)
        setDisplayName: _setDisplayNamePref,
        setPhoneNumber: _setPhoneNumberPref,
        setBirthDate: _setBirthDatePref,
        // Story 14.22: Font family preference (persisted to Firestore)
        setFontFamily: setFontFamilyPref,
        // Story 14.35b: Foreign location display format preference
        setForeignLocationFormat: setForeignLocationFormatPref,
        // Story 14c.18: View mode preference (debounced Firestore save)
        saveViewModePreference,
    } = useUserPreferences(user, services);
    // Persistent scan credits from Firestore
    // Story 14d.4e: Changed from reserve/confirm/refund to immediate deduct pattern
    // Credits are deducted to Firestore immediately on scan start to prevent exploits.
    // Only restored via addCredits if API returns an error (server-side failure).
    const {
        credits: userCredits,
        deductCredits: deductUserCredits,
        deductSuperCredits: deductUserSuperCredits,
        addCredits: addUserCredits,
        addSuperCredits: addUserSuperCredits,
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
    // Story 14.19: Personal records detection and celebration
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

    // Story 14c.2: Pending invitations for notification badge on Alerts
    const { pendingInvitations, pendingCount: pendingInvitationsCount } = usePendingInvitations(user?.email);

    // Story 14c.4: View Mode Switcher - context and shared groups
    const { mode: viewMode, group: activeGroup, setGroupMode } = useViewMode();
    const db = getFirestore();

    // Story 14c.17: Share Link Deep Linking - handle join URLs
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

    // Story 14c.17: Handle successful join - switch to group mode
    useEffect(() => {
        if (joinLinkState === 'success' && joinedGroupId && joinGroupPreview) {
            // Switch to the newly joined group
            setGroupMode(joinedGroupId, joinGroupPreview as unknown as SharedGroup);
            setView('dashboard');
        }
    }, [joinLinkState, joinedGroupId, joinGroupPreview, setGroupMode]);

    // Story 14c.13: In-app notifications for shared groups (must be after db is defined)
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

    // Story 14c.18: Connect view mode to Firestore persistence and group validation
    // This handles: AC3 (load on auth), AC4 (validate group), AC5 (fallback), AC6 (sync on change)
    useViewModePreferencePersistence({
        groups: userSharedGroups,
        groupsLoading: sharedGroupsLoading,
        firestorePreference: userPreferences.viewModePreference,
        preferencesLoading,
        savePreference: saveViewModePreference,
    });

    // Story 14c.7: Convert shared groups to GroupWithMeta format for TransactionGroupSelector
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

    // Story 14c.5: Shared group transactions for group mode
    // Only fetches when viewMode === 'group' and activeGroup exists
    // Group consolidation: These will be wired up when shared group view is fully integrated
    const {
        transactions: sharedGroupTransactions,
        allTransactions: _sharedGroupAllTransactions,
        rawTransactions: sharedGroupRawTransactions,
        isLoading: _sharedGroupTransactionsLoading,
        total: _sharedGroupTotal,
        spendingByMember: sharedGroupSpendingByMember,
        dateRange: _sharedGroupDateRange,
        setDateRange: _setSharedGroupDateRange,
        selectedMembers: _sharedGroupSelectedMembers,
        toggleMember: _toggleSharedGroupMember,
        selectAllMembers: _selectAllSharedGroupMembers,
        refresh: _refreshSharedGroupTransactions,
    } = useSharedGroupTransactions({
        services,
        group: activeGroup ?? null,
        enabled: viewMode === 'group' && !!activeGroup,
    });

    // Story 14c.5 Bug Fix: Real-time sync when other members tag/untag transactions
    // Story 14c.12: Refactored to use testable utility function
    // Track previous memberUpdates to detect changes from OTHER users
    const prevMemberUpdatesRef = useRef<Map<string, MemberUpdatesMap>>(new Map());

    useEffect(() => {
        if (!user?.uid || userSharedGroups.length === 0) {
            prevMemberUpdatesRef.current.clear();
            return;
        }

        // Use extracted utility function for testability
        const result = detectMemberUpdates(
            userSharedGroups,
            prevMemberUpdatesRef.current,
            user.uid
        );

        // Log changes in dev mode
        if (import.meta.env.DEV && result.changeDetails.length > 0) {
            for (const detail of result.changeDetails) {
                console.log(`[App] Member ${detail.memberId} updated in group ${detail.groupId}`, {
                    prev: detail.previousTimestamp,
                    current: detail.currentTimestamp,
                });
            }
        }

        // Invalidate caches for groups with changes
        if (result.shouldInvalidate) {
            for (const groupId of result.groupsWithChanges) {
                if (import.meta.env.DEV) {
                    console.log(`[App] Invalidating transaction cache for group ${groupId} due to member update`);
                }

                // Clear IndexedDB cache for this group
                clearGroupCacheById(groupId).catch(err => {
                    console.warn('[App] Failed to clear group cache:', err);
                });

                // Invalidate React Query cache (partial match on groupId)
                queryClient.invalidateQueries({
                    queryKey: ['sharedGroupTransactions', groupId],
                });
            }
        }

        // Update ref with new state for next comparison
        prevMemberUpdatesRef.current = result.updatedPreviousMap;
    }, [userSharedGroups, user?.uid, queryClient]);

    // Story 14d.4c: Access ScanContext for scan state management
    // ScanProvider is now in main.tsx, allowing direct useScan() access
    // Story 14d.4d: Added restoreState for persistence recovery
    const {
        state: scanState,
        startSingleScan: startScanContext,
        // Story 14d.5: Batch scan context methods
        startBatchScan: startBatchScanContext,
        // Story 14d.9: Statement scan context method (placeholder)
        startStatementScan: startStatementScanContext,
        batchItemStart: dispatchBatchItemStart,
        batchItemSuccess: dispatchBatchItemSuccess,
        batchItemError: dispatchBatchItemError,
        batchComplete: dispatchBatchComplete,
        isBatchMode: isBatchModeFromContext,
        isBatchProcessing: isBatchProcessingFromContext,
        // Story 14d.5c: isBatchReviewing used via BatchReviewView internally (useContextMode)
        isBatchReviewing: _isBatchReviewingFromContext,
        batchProgress: batchProgressFromContext,
        // Story 14d.5c: Batch receipt context methods
        // Story 14d.5: setBatchReceipts no longer called separately - batchReceipts passed through batchComplete()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setBatchReceipts: _setBatchReceiptsContext,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        clearBatchReceipts: _clearBatchReceiptsContext, // Available for explicit clear, but resetScanContext also clears
        // Story 14d.5d: Batch editing context methods
        setBatchEditingIndex: setBatchEditingIndexContext,
        // Story 14c.8: Update batch receipt when editing in batch mode
        updateBatchReceipt: updateBatchReceiptContext,
        // Story 14d.5d: Dialog context methods for batch dialogs
        showDialog: showScanDialog,
        dismissDialog: dismissScanDialog,
        // Single scan methods
        setImages: setScanContextImages,
        setStoreType: setScanContextStoreType,
        setCurrency: setScanContextCurrency,
        processStart: dispatchProcessStart,
        processSuccess: dispatchProcessSuccess,
        processError: dispatchProcessError,
        reset: resetScanContext,
        isProcessing: isContextProcessing,
        // Story 14d.4d: For persistence recovery
        restoreState: restoreScanState,
        hasActiveRequest: _hasScanActiveRequest, // Available for future blocking checks
    } = useScan();

    // Story 14d.5b: Batch dispatch methods now used for ScanContext integration
    // dispatchBatchItemStart, dispatchBatchItemSuccess, dispatchBatchItemError, dispatchBatchComplete
    // are passed to useBatchProcessing callbacks - no longer need silencing

    // Story 14d.5a-phase2: isBatchModeFromContext now used (AC8: mode checks)
    // Story 14d.5b: isBatchProcessingFromContext + batchProgressFromContext now used via BatchReviewView
    // Story 14d.5c AC5: These are now actively used for batch review flow
    void isBatchProcessingFromContext; // Reserved for future batch processing checks
    void batchProgressFromContext; // Reserved for future batch progress display

    // Story 14d.5c AC5: Computed helper for batch receipts existence check
    // Replaces batchReviewResults.length > 0 checks throughout the component
    const hasBatchReceipts = (scanState.batchReceipts?.length ?? 0) > 0;

    // ==========================================================================
    // Story 14d.4c: State Variable Migrations (AC1-7, AC9-12)
    // Local useState replaced with ScanContext state + compatibility wrappers
    // ==========================================================================

    // AC1: scanImages → state.images (read) + setImages (write)
    const scanImages = scanState.images;
    const setScanImages = useCallback((newImages: string[] | ((prev: string[]) => string[])) => {
        const imagesToSet = typeof newImages === 'function'
            ? newImages(scanState.images)
            : newImages;

        // Story 14d.4c FIX: Auto-transition to 'capturing' phase if needed
        // The state machine requires 'capturing' phase before images can be set
        if (scanState.phase === 'idle' && imagesToSet.length > 0 && user?.uid) {
            // Start a single scan to transition idle → capturing
            startScanContext(user.uid);
            // Story 14d.4c Code Review: setTimeout(0) defers to next tick to allow React state update
            // This is necessary because startScanContext triggers async state transition before images can be set
            // Alternative: Modify state machine to auto-set images on START_SINGLE_SCAN (future story)
            setTimeout(() => setScanContextImages(imagesToSet), 0);
        } else if (imagesToSet.length === 0) {
            // Clearing images - always reset to idle state
            // This handles: cancel during capturing, cancel after reviewing, navigation away
            resetScanContext();
        } else {
            setScanContextImages(imagesToSet);
        }
    }, [scanState.images, scanState.phase, user?.uid, startScanContext, setScanContextImages, resetScanContext]);

    // AC2: scanError → state.error (read) + processError (write)
    const scanError = scanState.error;
    const setScanError = useCallback((error: string | null) => {
        if (error) {
            dispatchProcessError(error);
        }
        // Story 14d.4c Code Review: Clearing error (null) is a no-op here because:
        // - resetScanContext() clears error when setScanImages([]) is called
        // - dispatchProcessStart() clears error when processScan() starts
        // The explicit setScanError(null) calls are kept for readability but are redundant
    }, [dispatchProcessError]);

    // AC3: isAnalyzing → isProcessing from context
    const isAnalyzing = isContextProcessing;
    const setIsAnalyzing = useCallback((analyzing: boolean) => {
        // No-op: isAnalyzing is derived from state machine phase
        // PROCESS_START sets phase to 'scanning' (isProcessing=true)
        // PROCESS_SUCCESS/ERROR transitions out (isProcessing=false)
        if (import.meta.env.DEV && analyzing !== isContextProcessing) {
            console.debug('[14d.4c] setIsAnalyzing called (managed by state machine):', analyzing);
        }
    }, [isContextProcessing]);

    // AC4: scanStoreType → state.storeType (read) + setStoreType (write)
    const scanStoreType = (scanState.storeType || 'auto') as ReceiptType;
    const setScanStoreType = useCallback((storeType: ReceiptType) => {
        setScanContextStoreType(storeType);
    }, [setScanContextStoreType]);

    // AC5: scanCurrency → state.currency (read) + setCurrency (write)
    const scanCurrency = (scanState.currency || 'CLP') as SupportedCurrency;
    const setScanCurrency = useCallback((currency: SupportedCurrency) => {
        setScanContextCurrency(currency);
    }, [setScanContextCurrency]);

    // AC6: scanButtonState → derived from state.phase
    // Story 14d.4c Code Review: Removed no-op setScanButtonState wrapper - all call sites removed
    const scanButtonState = useMemo((): ScanButtonState => {
        switch (scanState.phase) {
            case 'idle': return 'idle';
            case 'capturing': return 'pending';
            case 'scanning': return 'scanning';
            case 'reviewing': return 'complete';
            case 'saving': return 'scanning';
            case 'error': return 'error';
            default: return 'idle';
        }
    }, [scanState.phase]);

    // AC7: skipScanCompleteModal → managed via dialog state
    // Note: This is a UI-specific flag, keeping as local state for now
    // Future: Could be managed via ScanContext dialog state
    const [skipScanCompleteModal, setSkipScanCompleteModal] = useState(false);

    // ==========================================================================
    // End Story 14d.4c Migrations
    // ==========================================================================

    // UI State
    const [view, setView] = useState<View>('dashboard');
    // Story 14.15b: Track previous view for proper back navigation
    const [previousView, setPreviousView] = useState<View>('dashboard');
    // Story 14.22: Settings subview state for breadcrumb navigation
    const [settingsSubview, setSettingsSubview] = useState<'main' | 'limites' | 'perfil' | 'preferencias' | 'escaneo' | 'suscripcion' | 'datos' | 'grupos' | 'app' | 'cuenta'>('main');
    // Story 14d.4c: scanImages, isAnalyzing, scanError, scanStoreType, scanCurrency moved to ScanContext
    // See migration section above (AC1-5)
    // Story 14.15b: Re-scan loading state (AC8: kept as local - not core scan flow)
    const [isRescanning, setIsRescanning] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
    // Story 14.13 Session 6: Multi-transaction navigation from ItemsView
    // When viewing a transaction from an aggregated item, store all related transaction IDs
    // This enables "1 de 3" navigation header in TransactionEditorView
    const [transactionNavigationList, setTransactionNavigationList] = useState<string[] | null>(null);
    // Story 14.24: Read-only mode for viewing transactions from History
    // When true, TransactionEditorView shows Edit button instead of Save
    const [isViewingReadOnly, setIsViewingReadOnly] = useState(false);
    // Story 14.24: Track if a credit was actually used in current editing session
    // This is true only when processScan or handleRescan is called (not just opening an existing transaction)
    const [creditUsedInSession, setCreditUsedInSession] = useState(false);
    // Story 14.23: editingItemIndex was used by EditView, kept for potential rollback
    const [_editingItemIndex, _setEditingItemIndex] = useState<number | null>(null);
    // Story 9.10: Persistent scan state - maintains scan across navigation
    // Story 14d.4e: pendingScan REMOVED - now using ScanContext (scanState) exclusively
    // All reads use scanState.phase, scanState.images, scanState.results[0], scanState.error
    // All writes use ScanContext actions (via AC1-5 wrapper functions defined above)
    // Story 12.1 v9.7.0: Persistent batch state - maintains batch across refresh/logout
    // Story 14d.5e: pendingBatch REMOVED - batch persistence now unified in ScanContext
    // Batch state is persisted via scanState (includes mode, images, results, batchReceipts)
    // Note: userCredits now managed by useUserCredits hook (line ~157)
    // Story 10.6: Insight card state (AC #1, #4)
    const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
    const [showInsightCard, setShowInsightCard] = useState(false);
    // Story 14.20: Session completion messaging state (AC #1)
    const [showSessionComplete, setShowSessionComplete] = useState(false);
    const [sessionContext, setSessionContext] = useState<SessionContext | null>(null);
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
    // Story 14d.6: Quick Save state migrated to ScanContext
    // showQuickSaveCard, quickSaveTransaction, quickSaveConfidence REMOVED
    // Now using scanState.activeDialog for dialog visibility and data
    const [isQuickSaving, setIsQuickSaving] = useState(false);
    // Story 14d.5: Track saving state for TransactionEditorView to prevent double-click
    const [isTransactionSaving, setIsTransactionSaving] = useState(false);
    // Story 11.3: Track when EditView should animate items (fresh scan result)
    const [animateEditViewItems, setAnimateEditViewItems] = useState(false);
    // Story 14d.4c: scanButtonState and skipScanCompleteModal defined in migration section above (AC6, AC7)
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
    // Story 14d.5a-phase2e: REMOVED - batch mode now solely tracked by ScanContext
    // Read: isBatchModeFromContext (from ScanContext)
    // Write: startBatchScanContext() / resetScanContext()
    // Story 12.2 & 12.3: Batch processing and review state
    const batchProcessing = useBatchProcessing(3); // Max 3 concurrent API calls
    // Story 14d.5c AC5: batchReviewResults REMOVED - now using scanState.batchReceipts exclusively
    // Use hasBatchReceipts helper for length checks, context is source of truth
    // Story 14d.5d AC1: batchEditingReceipt REMOVED - now using scanState.batchEditingIndex
    // Story 14d.5d AC8, AC11, AC12: Batch complete modal state REMOVED - now using scanState.activeDialog
    // Story 14d.5d AC7: showBatchDiscardConfirm REMOVED - now using scanState.activeDialog
    // Story 14d.6: Currency and Total mismatch dialog state REMOVED
    // showCurrencyMismatch, currencyMismatchData REMOVED - now using scanState.activeDialog
    // showTotalMismatch, totalMismatchData REMOVED - now using scanState.activeDialog
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
    // Story 14.37: Font size scaling
    // 'small' = current app sizes (default for backwards compatibility)
    // 'normal' = larger sizes for better readability
    const [fontSize, setFontSize] = useState<FontSize>(() => {
        const saved = localStorage.getItem('fontSize');
        if (saved === 'small' || saved === 'normal') return saved;
        return 'small'; // Default to small (current sizes) for backwards compatibility
    });
    // Story 14.22: Font family selection - now persisted to Firestore via useUserPreferences
    // Derive from userPreferences for convenience (defaults to 'outfit')
    const fontFamily = userPreferences.fontFamily || 'outfit';

    // Story 9.3: Default location settings (used when scan doesn't detect location)
    // Story 14.22: Now using Firestore-backed preferences instead of localStorage
    // These derived values are for convenience - actual data comes from userPreferences
    const defaultCountry = userPreferences.defaultCountry || '';
    const defaultCity = userPreferences.defaultCity || '';

    /**
     * Story 14c.8: Create a default new transaction with standard fields.
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

    const [wiping, setWiping] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

    // Story 10a.4: historyPage state removed - HistoryView no longer used in insights tab
    // distinctAliases is now computed via useMemo, not state (see below)

    // Story 9.20: Pending filters for navigation from Analytics to History
    // When user clicks a badge in Analytics, we store the filters here,
    // then pass them as initialState to HistoryFiltersProvider
    const [pendingHistoryFilters, setPendingHistoryFilters] = useState<HistoryFilterState | null>(null);

    // Story 14.13 Session 7: Pending distribution view for back navigation to donut chart
    // When user navigates from donut chart to history/items, store 'donut' to restore on back
    const [pendingDistributionView, setPendingDistributionView] = useState<'treemap' | 'donut' | null>(null);

    // Story 10a.2: Initial analytics state for "This Month" navigation
    // When user clicks "This Month" card, store the month to initialize TrendsView at month level
    const [analyticsInitialState, setAnalyticsInitialState] = useState<AnalyticsNavigationState | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    // Story 14.22: Main content scroll container ref for scroll position management
    const mainRef = useRef<HTMLDivElement>(null);
    // Story 14.22: Track scroll positions per view for back navigation
    const scrollPositionsRef = useRef<Record<string, number>>({});
    // Story 14.24: pendingScanInitializedRef REMOVED in 14d.4e - legacy effect removed
    // Story 14d.4e: ScanContext now handles persistence via scanState save effect
    // Story 14d.5e: pendingBatchInitializedRef REMOVED - batch persistence unified in scanState
    const t = (k: string) => (TRANSLATIONS[lang] as any)[k] || k;

    // Story 14d.4c: Bridge hook REMOVED - App.tsx now uses useScan() directly
    // Dialog state syncing is handled through ScanContext actions (showDialog, resolveDialog)

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

    // Story 14.19: Check for personal records after transactions change
    // Uses fire-and-forget pattern matching insight generation - never blocks UI
    useEffect(() => {
        if (transactions.length > 0 && user?.uid) {
            checkForRecords(transactions);
        }
    }, [transactions, user?.uid, checkForRecords]);

    // Story 7.12 AC#11: Persist color theme to localStorage
    useEffect(() => {
        localStorage.setItem('colorTheme', colorTheme);
    }, [colorTheme]);

    // Story 14.21: Persist font color mode to localStorage
    useEffect(() => {
        localStorage.setItem('fontColorMode', fontColorMode);
    }, [fontColorMode]);

    // Story 14.37: Persist font size to localStorage
    useEffect(() => {
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    // Story 14d.4d: Load persisted scan state from localStorage on user login
    // Uses new ScanState format with automatic migration from old PendingScan format
    // Story 14d.5e: Now also handles batch mode restoration (unified persistence)
    useEffect(() => {
        if (user?.uid) {
            const storedState = loadPersistedScanState(user.uid);
            if (storedState) {
                // Story 14d.4d: Handle interrupted scans (scanning phase)
                // These can't be recovered - show toast and clear storage
                if (storedState.phase === 'scanning') {
                    // Story 14d.5e: Different messages for batch vs single
                    const message = storedState.mode === 'batch'
                        ? 'Procesamiento de lote interrumpido. Los créditos ya se usaron.'
                        : 'Escaneo interrumpido. Intenta de nuevo.';
                    setToastMessage({ text: message, type: 'info' });
                    clearPersistedScanState(user.uid);
                    return; // Don't restore - nothing meaningful to recover
                }

                // Story 14d.4d: Handle error phase from migration (old 'analyzing' status)
                if (storedState.phase === 'error' && storedState.images.length === 0 && storedState.results.length === 0) {
                    // Error state with no content - just show toast and clear
                    if (storedState.error) {
                        setToastMessage({ text: storedState.error, type: 'info' });
                    }
                    clearPersistedScanState(user.uid);
                    return;
                }

                // Restore state to ScanContext via restoreState action
                restoreScanState(storedState);

                // Story 14d.5e: Handle batch mode restoration
                if (storedState.mode === 'batch') {
                    // Restore batchImages for BatchCaptureView/BatchReviewView
                    setBatchImages(storedState.images);

                    // Story 14d.5e: Navigate to appropriate batch view
                    if (storedState.phase === 'reviewing' && (storedState.results.length > 0 || storedState.batchReceipts)) {
                        // Has processed results - go to batch review
                        setView('batch-review');
                    } else if (storedState.phase === 'capturing' && storedState.images.length > 0) {
                        // Has captured images but not processed - go to batch capture
                        setView('batch-capture');
                    }
                    // For other phases, stay on dashboard
                    return;
                }

                // Single mode handling (existing logic)
                // Also restore currentTransaction for immediate use (backwards compat)
                // ScanState stores transactions in results array
                if (storedState.results.length > 0) {
                    setCurrentTransaction(storedState.results[0]);
                }

                // Story 14d.4e: Legacy pendingScan code REMOVED - all consumers now use scanState

                // Story 14d.4d: Navigate to appropriate view based on restored phase
                // This ensures user sees the recovered scan state
                if (storedState.phase === 'reviewing' && storedState.results.length > 0) {
                    // Has analyzed transaction - go to scan-result view
                    setView('scan-result');
                } else if (storedState.phase === 'capturing' && storedState.images.length > 0) {
                    // Has images but not yet analyzed - go to scan view
                    setView('scan');
                } else if (storedState.phase === 'error' && (storedState.images.length > 0 || storedState.results.length > 0)) {
                    // Error state with content - go to scan view to show retry option
                    setView('scan');
                }
                // For 'idle' or 'saving' phases, don't navigate - stay on dashboard
            }
        }
    }, [user?.uid, restoreScanState]);

    // Story 14d.4d: Save ScanContext state to persistent storage whenever it changes
    // This is the PRIMARY persistence mechanism - uses new ScanState format
    // Story 14d.5e: This now handles BOTH single and batch mode (unified persistence)
    const scanStateInitializedRef = useRef(false);
    useEffect(() => {
        if (!user?.uid) return;

        // Skip the first run - let the load effect run first
        if (!scanStateInitializedRef.current) {
            scanStateInitializedRef.current = true;
            return;
        }

        // Only persist if there's meaningful content in the scan state
        // Story 14d.5e: Also check for batch-specific content (batchReceipts)
        const hasContent = scanState.phase !== 'idle' &&
            (scanState.images.length > 0 || scanState.results.length > 0 || scanState.batchReceipts !== null);

        if (hasContent) {
            savePersistedScanState(user.uid, scanState);
            // Story 14d.5e: Clear legacy batch storage when saving new unified state
            // This ensures old storage doesn't conflict with new system
            clearLegacyBatchStorage(user.uid);
        } else if (scanState.phase === 'idle') {
            // Clear storage when state is reset to idle
            clearPersistedScanState(user.uid);
            // Story 14d.5e: Also clear legacy batch storage
            clearLegacyBatchStorage(user.uid);
        }
    }, [user?.uid, scanState]);

    // Story 14d.4e: Legacy pendingScan save effect REMOVED
    // Story 14d.5e: Legacy pendingBatch load/sync/save effects REMOVED
    // All persistence is now handled by the unified ScanContext save effect above
    // (saves scanState to localStorage as PersistedScanState format - works for both single and batch)

    // Story 14.24 Phase 6.2: Navigation guard - warn before closing/refreshing with active transaction
    // Story 14d.5e: Uses unified scanState for both single and batch modes
    // This prevents accidental loss of scanned data and credits
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Check if there's an active transaction that would be lost
            // Story 14d.5e: scanState now includes both single and batch mode
            const hasActiveContent = scanState.phase !== 'idle' && (
                scanState.phase === 'scanning' ||  // Scan in progress
                scanState.results.length > 0 ||  // Analyzed but not saved
                scanState.images.length > 0 ||  // Images selected but not analyzed
                scanState.batchReceipts !== null  // Story 14d.5e: Batch receipts in review
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
    // Story 14.13: Also preserve filters when drilling into transaction-editor from history
    // so that going back from transaction detail returns to the filtered list
    useEffect(() => {
        // Clear filters when navigating away from history/insights/transaction-editor views
        // transaction-editor is included because users drill into it from filtered history
        // and should return to the same filtered view when pressing back
        // Story 14.13 Session 5: 'items' added for filtered navigation from analytics count mode
        if (view !== 'insights' && view !== 'history' && view !== 'items' && view !== 'transaction-editor' && pendingHistoryFilters) {
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

    // Story 14.13 Session 7: Clear pending distribution view when navigating AWAY from trends
    // This ensures the distribution view is restored when returning to trends from history/items,
    // but cleared when leaving so subsequent visits start fresh
    useEffect(() => {
        if (view !== 'trends' && view !== 'history' && view !== 'items' && view !== 'transaction-editor' && pendingDistributionView) {
            setPendingDistributionView(null);
        }
    }, [view]); // Only depend on view, not pendingDistributionView

    // Story 14c.13: Delta fetch on notification click (Option C - cost efficient)
    // Triggers delta fetch and navigation when user taps a push notification
    // Must be after setView and setGroupMode are available
    useNotificationDeltaFetch(
        db,
        services?.appId || '',
        userSharedGroups,
        queryClient,
        useCallback((group: SharedGroup) => {
            // Switch to group mode and navigate to dashboard
            setGroupMode(group.id!, group);
            setView('dashboard');
        }, [setGroupMode])
    );

    // Note: Theme is applied synchronously during render (before JSX return)
    // to ensure CSS variables are available when children compute memoized data

    // Story 14.15b: Navigate to a view while tracking the previous view for back navigation
    // Story 14.22: Also saves scroll position before navigating
    // Story 14.13b: Clear filters when navigating to history/items from outside (fresh start)
    const navigateToView = useCallback((targetView: View) => {
        // Save current scroll position before navigating
        if (mainRef.current) {
            scrollPositionsRef.current[view] = mainRef.current.scrollTop;
        }
        setPreviousView(view);

        // Story 14.13b: Clear filters when navigating to history/items from outside
        // This gives a "fresh start" when selecting from Profile menu while on Dashboard, Settings, etc.
        // Filters persist when: navigating within history/items or viewing transaction detail and coming back
        // Story 14.13: Also preserve filters when navigating from trends/insights (analytics drill-down)
        // Story 14.13 Session 11: Also preserve filters when navigating from dashboard (treemap clicks)
        const isFromRelatedView = view === 'history' || view === 'items' || view === 'transaction-editor' || view === 'trends' || view === 'insights' || view === 'dashboard';
        const isToHistoryOrItems = targetView === 'history' || targetView === 'items';
        if (isToHistoryOrItems && !isFromRelatedView) {
            setPendingHistoryFilters(null);
        }

        setView(targetView);
        // Story 14.24: Hide QuickSaveCard when navigating to a different view
        // This prevents the modal from floating over other views
        // Story 14d.6: Dismiss QuickSave dialog via context (local state removed)
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
        // Story 14d.5c AC5: Use hasBatchReceipts (context) instead of batchReviewResults
        if (hasBatchReceipts) {
            setView('batch-review');
            return;
        }

        // v9.7.0: Clear batch editing state when starting fresh single scan
        // This ensures batch navigation UI doesn't show in single scan mode
        // Story 14d.5d AC5: Now using ScanContext batchEditingIndex
        if (scanState.batchEditingIndex !== null) {
            setBatchEditingIndexContext(null);
        }

        // Story 9.10 AC#2: Check for existing pending scan WITH meaningful content
        // Story 14.15: Only restore if there are images or analyzed transaction
        // Story 14d.4e: Now using scanState instead of pendingScan
        // Don't restore empty pending scans (e.g., from cancelled file picker)
        const hasExistingContent = scanState.phase !== 'idle' &&
            (scanState.images.length > 0 || scanState.results.length > 0);
        if (hasExistingContent) {
            // Story 14.24: Clear QuickSaveCard when restoring pending transaction
            // QuickSaveCard should only appear after a fresh scan, not when returning to draft
            // Story 14d.6: Dismiss QuickSave dialog via context (local state removed)
            if (scanState.activeDialog?.type === DIALOG_TYPES.QUICKSAVE) {
                dismissScanDialog();
            }

            // Story 14d.4e: scanState already has the images and results, no need to "restore"
            // setScanImages is not needed as scanState.images is already available
            // setScanError is not needed as scanState.error is already available
            if (scanState.results.length > 0) {
                setCurrentTransaction(scanState.results[0]);
            } else {
                // Story 14.24: Include default location and currency in new transactions
                // Story 14c.8: Use helper to include shared group when in group mode
                setCurrentTransaction(createDefaultTransaction());
            }
            // Story 14.23: Restore to unified TransactionEditorView
            // Determine scan button state based on pending scan status
            setTransactionEditorMode('new');
            // Story 14d.4c: scanButtonState is now derived from scanState.phase
            navigateToView('transaction-editor');
            // Don't auto-open file picker when returning to pending scan
            return;
        }

        // Story 14d.4e: No need to clear pendingScan - resetScanContext handles this
        // resetScanContext is called via setScanImages([]) wrapper when clearing

        // No pending scan - create fresh session
        setScanImages([]);
        setScanError(null);
        // Story 9.8: Reset scan options to defaults
        setScanStoreType('auto');
        setScanCurrency(userPreferences.defaultCurrency || 'CLP');
        // Story 14.24: Include default location and currency in new transactions
        // Story 14c.8: Use helper to include shared group when in group mode
        setCurrentTransaction(createDefaultTransaction());
        // Story 9.10 AC#1, AC#3: Create new pending scan session
        // Story 14d.4e: No longer need to create pendingScan - ScanContext manages state
        // The setScanImages([]) call above triggers startScanContext when images are added
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
    // Story 14d.4e: Updated to use ScanContext - setScanImages wrapper handles state machine
    const _handleRemovePhoto = (index: number) => {
        setScanImages(prev => {
            const updatedImages = prev.filter((_, i) => i !== index);
            // Story 14d.4e: setScanImages wrapper handles state machine updates
            // No need to manually update pendingScan
            return updatedImages;
        });
    };
    void _handleRemovePhoto; // Suppress unused warning

    // Story 9.9: Cancel handler for new transactions
    // Story 9.10 AC#4: Clear pending scan on cancel
    // Story 14.23: DEPRECATED - was used by EditView/ScanResultView, kept for potential rollback
    // Story 14d.4e: Updated to use ScanContext
    const _handleCancelNewTransaction = () => {
        // Story 14d.4c: setScanImages([]) resets state machine to idle (derived scanButtonState)
        setScanImages([]);
        setScanError(null);
        setCurrentTransaction(null);
        // Story 14d.4e: setScanImages([]) resets state machine - no need to clear pendingScan
        setView('dashboard');
    };
    void _handleCancelNewTransaction; // Suppress unused warning

    // Story 14.24: Check if there's an active transaction that would conflict
    // Story 14d.4e: Now using scanState instead of pendingScan
    const hasActiveTransactionConflict = useCallback((): {
        hasConflict: boolean;
        conflictInfo?: { transaction: ConflictingTransaction; reason: ConflictReason };
    } => {
        // Check if there's a pending scan with content
        // Story 14d.4e: Check scanState.phase instead of pendingScan
        if (scanState.phase === 'idle') {
            return { hasConflict: false };
        }

        // If we're already on transaction-editor, no conflict (editing same transaction)
        if (view === 'transaction-editor') {
            return { hasConflict: false };
        }

        // Check various conflict scenarios
        // Story 14d.4e: Use scanState.results[0] instead of pendingScan.analyzedTransaction
        const hasAnalyzedTransaction = scanState.results.length > 0;
        const hasImages = scanState.images.length > 0;
        const isScanning = scanState.phase === 'scanning';

        // If scanning in progress, that's a conflict
        if (isScanning) {
            const transaction = scanState.results[0];
            return {
                hasConflict: true,
                conflictInfo: {
                    transaction: {
                        merchant: transaction?.merchant,
                        total: transaction?.total,
                        currency: transaction?.currency,
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
        // Story 14d.4e: 'reviewing' phase is equivalent to old 'analyzed' status
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

    // Story 14.23: Navigate to unified transaction editor
    // Story 14.24: Enhanced with conflict detection
    // mode: 'new' for new transactions, 'existing' for editing
    const navigateToTransactionEditor = (mode: 'new' | 'existing', transaction?: Transaction | null) => {
        // Story 14.24: Check for conflicts with existing pending scan
        const conflictCheck = hasActiveTransactionConflict();

        // For 'existing' mode, also check if we're editing the same transaction
        // Story 14d.4e: Use scanState.results[0] instead of pendingScan.analyzedTransaction
        const isEditingSameTransaction = mode === 'existing' && transaction?.id &&
            scanState.results.length > 0 && scanState.results[0]?.id === transaction.id;

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
        // Story 14d.4c: scanButtonState derived from phase - no need to set explicitly
        if (transaction) {
            setCurrentTransaction(transaction as any);
        } else if (mode === 'new') {
            // Story 14.24: Include default location and currency in new transactions
            // Story 14c.8: Use helper to include shared group when in group mode
            setCurrentTransaction(createDefaultTransaction());
        }
        navigateToView('transaction-editor');
    };

    // Story 14.24: Navigate to read-only transaction view
    // Used when clicking a transaction in HistoryView - uses TransactionEditorView in readOnly mode
    // User clicks "Edit" button to enter edit mode (with conflict check)
    // Story 14.13 Session 6: Optional allTransactionIds for multi-transaction navigation from ItemsView
    const navigateToTransactionDetail = (transaction: Transaction, allTransactionIds?: string[]) => {
        setIsViewingReadOnly(true);
        setCreditUsedInSession(false); // No credit used yet - this is just viewing
        setTransactionEditorMode('existing');
        setCurrentTransaction(transaction);
        // Story 14d.4c: scanButtonState derived from phase - existing transaction shows image if available
        // Story 14.13 Session 6: Store navigation list for multi-transaction browsing
        setTransactionNavigationList(allTransactionIds && allTransactionIds.length > 1 ? allTransactionIds : null);
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
        // Story 14d.4e: setScanImages wrapper handles state machine updates
        // No need to manually update pendingScan
        // Story 14.23: Navigate to transaction-editor view (scan-result is deprecated)
        // The processScan call happens automatically after navigation
        setView('transaction-editor');
        setTransactionEditorMode('new');
        // Story 14d.4c: dispatchProcessStart will set phase to 'scanning', deriving correct button state
        setSkipScanCompleteModal(false); // v9.7.0: Reset skip flag for fresh scan
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

        // Story 9.10 AC#7: Check if user has credits before scanning
        if (userCredits.remaining <= 0) {
            setScanError(t('noCreditsMessage'));
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        // Story 14d.4e: Deduct credit IMMEDIATELY to Firestore to prevent exploits
        // Credit is only restored if API returns an error (server-side failure).
        // User cancellation, page refresh, or any other action does NOT restore credit.
        const deducted = await deductUserCredits(1);
        if (!deducted) {
            setScanError(t('noCreditsMessage'));
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        // Story 14.24: Mark that a credit was used in this session (for cancel warning)
        setCreditUsedInSession(true);

        // Story 14d.4c AC9: Dispatch PROCESS_START to transition state machine to 'scanning' phase
        // This replaces setIsAnalyzing(true) and implicitly clears error
        dispatchProcessStart('normal', 1);
        // Story 14.15: Start scan overlay flow (AC #1)
        scanOverlay.startUpload();
        // Simulate upload progress (images are already local base64)
        scanOverlay.setProgress(100);
        scanOverlay.startProcessing();

        // Story 9.10: Update pending scan status to 'analyzing'
        // Story 14d.4e: dispatchProcessStart already transitions to 'scanning' phase
        // No need to manually update pendingScan
        try {
            // Story 14d.4e: Credit already deducted to Firestore - no action needed here

            // Story 9.8: Pass scan options (currency and store type) to analyzeReceipt
            // Story 14.15 AC #4: Add timeout handling for network requests
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
                // Story 14d.6: Credit already deducted - use showScanDialog for unified dialog handling
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

            // Story 14.15b: Reconcile items total with receipt total
            // If sum of items doesn't match receipt total, add an adjustment item
            const { items: reconciledItems, hasDiscrepancy: scanHasDiscrepancy } = reconcileItemsTotal(
                parsedItems,
                finalTotal,
                lang
            );

            // Build initial transaction from Gemini response
            // Story 14c.8: Include sharedGroupIds when in group view mode
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
                merchantSource: result.merchantSource,
                // Story 14c.8: Auto-tag to active group when in group view mode
                ...(viewMode === 'group' && activeGroup?.id ? { sharedGroupIds: [activeGroup.id] } : {}),
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
            // v9.6.1: Also apply learned store category if present
            let finalTransaction = categorizedTransaction;
            const merchantMatch = findMerchantMatch(categorizedTransaction.merchant);
            if (merchantMatch && merchantMatch.confidence > 0.7) {
                // AC#5: Apply matched alias (targetMerchant stores the preferred alias)
                // v9.6.1: Also apply storeCategory if learned
                finalTransaction = {
                    ...finalTransaction,
                    alias: merchantMatch.mapping.targetMerchant,
                    // v9.6.1: Apply learned store category (only if it exists in the mapping)
                    ...(merchantMatch.mapping.storeCategory && { category: merchantMatch.mapping.storeCategory }),
                    // AC#6: Mark as learned
                    merchantSource: 'learned' as const
                };

                // AC#7: Increment mapping usage count (fire-and-forget)
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

            // Story 14.15b AC #2: Currency auto-detection handling
            // Compare AI-detected currency with user's default currency
            const detectedCurrency = finalTransaction.currency;
            const userDefaultCurrency = userPreferences.defaultCurrency;

            // If AI detected a currency different from user's default, show dialog
            if (detectedCurrency && userDefaultCurrency && detectedCurrency !== userDefaultCurrency) {
                // Story 14d.6: Credit already deducted - use showScanDialog for unified dialog handling
                const dialogData: CurrencyMismatchDialogData = {
                    detectedCurrency,
                    pendingTransaction: finalTransaction,
                    hasDiscrepancy: scanHasDiscrepancy, // Story 14.15b: Pass discrepancy flag
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

            // Story 14c.8: sharedGroupIds is now set in initialTransaction above
            // No need for redundant injection here - transaction already has the group

            setCurrentTransaction(finalTransaction);
            // Story 9.10: Update pending scan with analyzed transaction (status = 'analyzed')
            // Story 14d.4e: dispatchProcessSuccess stores the transaction in scanState.results
            // and transitions to 'reviewing' phase - no need to manually update pendingScan

            // Story 14d.4b FIX: Check QuickSaveCard eligibility BEFORE setting scanButtonState
            // to prevent race condition where ScanCompleteModal shows before skipScanCompleteModal is set.
            // We need to determine early if QuickSaveCard will show so we can set skipScanCompleteModal first.
            const merchantAlias = finalTransaction.alias || finalTransaction.merchant;
            const isTrusted = merchantAlias ? await checkTrusted(merchantAlias) : false;
            const willShowQuickSave = !isTrusted && shouldShowQuickSave(finalTransaction);

            // Story 14d.4b: Set skipScanCompleteModal BEFORE scanButtonState to prevent race condition
            // TransactionEditorView's useEffect triggers on scanButtonState change and checks skipScanCompleteModal
            if (willShowQuickSave || isTrusted) {
                setSkipScanCompleteModal(true);
            }

            // Story 14d.4c AC10: Dispatch PROCESS_SUCCESS to transition state machine to 'reviewing' phase
            // This replaces setScanButtonState('complete') and stores the result in context
            dispatchProcessSuccess([finalTransaction]);
            // Story 14d.4c: Don't clear images here - they're needed for thumbnail fallback
            // Images will be cleared when user navigates away or starts a new scan

            // Story 14d.4e: Credit already deducted to Firestore at scan start - no confirmation needed

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
                    // Story 14d.4e: setScanImages([]) resets state machine - no need for setPendingScan(null)
                    setScanImages([]);
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
                    // Story 14d.6: Fall back to Quick Save Card on error - use showScanDialog
                    // Note: skipScanCompleteModal already set above for trusted merchants
                    const dialogData: QuickSaveDialogData = {
                        transaction: finalTransaction,
                        confidence: calculateConfidence(finalTransaction),
                    };
                    showScanDialog(DIALOG_TYPES.QUICKSAVE, dialogData);
                }
            } else if (willShowQuickSave) {
                // Story 14d.6: High confidence - Show Quick Save Card via showScanDialog
                // Note: skipScanCompleteModal already set above
                const dialogData: QuickSaveDialogData = {
                    transaction: finalTransaction,
                    confidence: calculateConfidence(finalTransaction),
                };
                showScanDialog(DIALOG_TYPES.QUICKSAVE, dialogData);
            } else {
                // Low confidence: Stay on TransactionEditorView for editing
                // Story 14.23: View is already 'transaction-editor', ScanCompleteModal will show
                // Story 11.3: Enable item animation for fresh scan results
                setAnimateEditViewItems(true);
                // Note: No setView call needed - view is already 'transaction-editor'
                // and ScanCompleteModal shows automatically via useEffect
            }
        } catch (e: any) {
            const errorMessage = 'Failed: ' + e.message;
            // Story 14d.4c AC11: Dispatch PROCESS_ERROR to transition state machine to 'error' phase
            // This replaces setScanError() and setScanButtonState('error')
            dispatchProcessError(errorMessage);
            // Story 14.15 AC #4: Detect timeout vs other errors and show in overlay
            const isTimeout = e.message?.includes('timed out');
            scanOverlay.setError(isTimeout ? 'timeout' : 'api', errorMessage);
            // Story 9.10: Update pending scan with error status
            // Story 14d.4e: dispatchProcessError transitions to 'error' phase
            // and stores the error message in scanState.error - no need for pendingScan
            // Story 14d.4e: Restore credit on API error - this is the ONLY case where credits are restored
            // Credits were deducted to Firestore at scan start, now we add them back due to server failure.
            await addUserCredits(1);
            // Story 14.24 AC #4: Show toast that credit was not used
            setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
        }
        // Story 14d.4c: No finally block needed - isAnalyzing is now derived from state machine phase
        // The state machine automatically transitions out of 'scanning' on success or error
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

        // Story 14d.4e: Deduct credit IMMEDIATELY to Firestore to prevent exploits
        const deducted = await deductUserCredits(1);
        if (!deducted) {
            setToastMessage({ text: t('noCreditsMessage'), type: 'info' });
            return;
        }

        // Story 14.24: Mark that a credit was used in this session (for cancel warning)
        setCreditUsedInSession(true);

        setIsRescanning(true);
        try {
            // Story 14d.4e: Credit already deducted to Firestore - no action needed here

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

            // Story 14d.4e: Credit already deducted to Firestore at scan start - no confirmation needed

            // Show appropriate toast message
            if (hasDiscrepancy) {
                setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
            } else {
                setToastMessage({ text: t('rescanSuccess'), type: 'success' });
            }
        } catch (e: any) {
            console.error('Re-scan failed:', e);
            // Story 14d.4e: Restore credit on API error - this is the ONLY case where credits are restored
            await addUserCredits(1);
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
        // Batch scanning uses 1 super credit total regardless of image count (up to 10)
        const result = checkCreditSufficiency(userCredits, 1, true);
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

        // Story 14d.5b: Transition state machine to 'scanning' phase
        // This is required before BATCH_ITEM_* actions can be dispatched
        dispatchProcessStart('super', 1);

        // Story 12.2: Use parallel processing instead of sequential
        // Story 14d.5b: Pass ScanContext callbacks for state machine integration
        await batchProcessing.startProcessing(
            batchImages,
            scanCurrency,
            scanStoreType !== 'auto' ? scanStoreType : undefined,
            {
                onItemStart: dispatchBatchItemStart,
                onItemSuccess: dispatchBatchItemSuccess,
                onItemError: dispatchBatchItemError,
                // Story 14d.5: Fixed race condition - create batchReceipts and pass
                // to dispatchBatchComplete for atomic state update with phase transition
                // Story 14c.8: Auto-tag batch transactions when in group view mode (AC#3)
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

        // Story 14d.5: batchReceipts now set atomically in onComplete callback above
        // Story 14d.5e: Persistence handled automatically via scanState save effect
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
        // Batch scanning uses 1 super credit total regardless of image count
        const newResult = checkCreditSufficiency(userCredits, 1, true);
        setCreditCheckResult(newResult);
        setShowCreditWarning(true);
    };

    // Story 12.3: Batch Review handlers (AC #4, #6, #7)
    // Handle edit receipt from batch review
    // Story 14.23: Updated to use TransactionEditorView
    // Story 12.1 v9.7.0: Added allReceipts for batch navigation
    // Story 14d.5d: Now uses ScanContext batchEditingIndex instead of local state
    const handleBatchEditReceipt = (receipt: BatchReceipt, batchIndex: number, _batchTotal: number, _allReceipts: BatchReceipt[]) => {
        // Story 14d.5d AC2: Track editing index in context (0-based, so batchIndex - 1)
        setBatchEditingIndexContext(batchIndex - 1);
        // Set up transaction editor with the receipt's transaction
        // Story 14d.5: Set thumbnailUrl directly on transaction instead of using setScanImages
        // (setScanImages requires 'capturing' phase, but we're in 'reviewing' phase during batch edit)
        const transactionWithThumbnail = receipt.imageUrl
            ? { ...receipt.transaction, thumbnailUrl: receipt.imageUrl }
            : receipt.transaction;
        setCurrentTransaction(transactionWithThumbnail);
        // Story 14.23: Use unified TransactionEditorView for batch editing
        setTransactionEditorMode('existing'); // Treat as existing since it's already processed
        navigateToView('transaction-editor');
    };

    // Story 12.1 v9.7.0: Navigate to previous receipt in batch
    // Story 14d.5d AC4: Now uses ScanContext batchEditingIndex + batchReceipts
    const handleBatchPrevious = () => {
        const batchReceipts = scanState.batchReceipts;
        const currentIndex = scanState.batchEditingIndex;
        if (!batchReceipts || currentIndex === null || currentIndex <= 0) return;
        const prevIndex = currentIndex - 1;
        const prevReceipt = batchReceipts[prevIndex];
        if (prevReceipt) {
            setBatchEditingIndexContext(prevIndex);
            // Story 14d.5: Set thumbnailUrl directly instead of using setScanImages
            const transactionWithThumbnail = prevReceipt.imageUrl
                ? { ...prevReceipt.transaction, thumbnailUrl: prevReceipt.imageUrl }
                : prevReceipt.transaction;
            setCurrentTransaction(transactionWithThumbnail);
        }
    };

    // Story 12.1 v9.7.0: Navigate to next receipt in batch
    // Story 14d.5d AC4: Now uses ScanContext batchEditingIndex + batchReceipts
    const handleBatchNext = () => {
        const batchReceipts = scanState.batchReceipts;
        const currentIndex = scanState.batchEditingIndex;
        if (!batchReceipts || currentIndex === null || currentIndex >= batchReceipts.length - 1) return;
        const nextIndex = currentIndex + 1;
        const nextReceipt = batchReceipts[nextIndex];
        if (nextReceipt) {
            setBatchEditingIndexContext(nextIndex);
            // Story 14d.5: Set thumbnailUrl directly instead of using setScanImages
            const transactionWithThumbnail = nextReceipt.imageUrl
                ? { ...nextReceipt.transaction, thumbnailUrl: nextReceipt.imageUrl }
                : nextReceipt.transaction;
            setCurrentTransaction(transactionWithThumbnail);
        }
    };

    // Story 14.13 Session 6: Navigate to previous transaction in list (from ItemsView aggregated item)
    const handleTransactionListPrevious = () => {
        if (!transactionNavigationList || !currentTransaction?.id) return;
        const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
        if (currentIndex <= 0) return;
        const prevId = transactionNavigationList[currentIndex - 1];
        const prevTx = transactions.find(t => t.id === prevId);
        if (prevTx) {
            setCurrentTransaction(prevTx);
            // Story 14d.4c: scanButtonState derived from phase
        }
    };

    // Story 14.13 Session 6: Navigate to next transaction in list (from ItemsView aggregated item)
    const handleTransactionListNext = () => {
        if (!transactionNavigationList || !currentTransaction?.id) return;
        const currentIndex = transactionNavigationList.indexOf(currentTransaction.id);
        if (currentIndex < 0 || currentIndex >= transactionNavigationList.length - 1) return;
        const nextId = transactionNavigationList[currentIndex + 1];
        const nextTx = transactions.find(t => t.id === nextId);
        if (nextTx) {
            setCurrentTransaction(nextTx);
            // Story 14d.4c: scanButtonState derived from phase
        }
    };

    // Handle back from batch review (return to dashboard, discard batch)
    // Story 12.1 v9.7.0: Show confirmation if there are results (credit already spent)
    // Story 14d.5a-phase2d: Use resetScanContext() to clear batch mode in context
    // Story 14d.5d AC9: Now uses SHOW_DIALOG for batch_discard
    const handleBatchReviewBack = () => {
        // If there are results to review, show confirmation that credit was spent
        // Story 14d.5c AC5: Use hasBatchReceipts (context) instead of batchReviewResults
        if (hasBatchReceipts) {
            showScanDialog(DIALOG_TYPES.BATCH_DISCARD, {});
            return;
        }
        // No results (cancelled during processing), just go back
        // Story 14d.5c AC5: resetScanContext clears batchReceipts in context
        // Story 14d.5e: resetScanContext() triggers persistence clear automatically
        setBatchImages([]);
        batchProcessing.reset();
        resetScanContext(); // Clears batch mode + triggers storage clear via save effect
        setView('dashboard');
    };

    // Confirm discard batch results (credit already spent)
    // Story 14d.5a-phase2d: Use resetScanContext() to clear batch mode in context
    // Story 14d.5d AC9: Now uses DISMISS_DIALOG
    const handleBatchDiscardConfirm = () => {
        dismissScanDialog();
        // Story 14d.5c AC5: resetScanContext clears batchReceipts in context
        // Story 14d.5e: resetScanContext() triggers persistence clear automatically
        setBatchImages([]);
        batchProcessing.reset();
        resetScanContext(); // Clears batch mode + triggers storage clear via save effect
        setView('dashboard');
    };

    // Cancel discard - stay on batch review
    // Story 14d.5d AC9: Now uses DISMISS_DIALOG
    const handleBatchDiscardCancel = () => {
        dismissScanDialog();
    };

    // Handle save all complete from batch review
    // Story 14.15: Now receives saved transactions for batch complete modal
    // Story 12.1 v9.7.0: Credit is deducted when processing completes, not when saving
    // Story 14d.5a-phase2d: Use resetScanContext() to clear batch mode in context
    // Story 14d.5d AC10: Now uses SHOW_DIALOG for batch_complete with data
    const handleBatchSaveComplete = async (_savedTransactionIds: string[], savedTransactions: Transaction[]) => {
        // Note: Super credit was already deducted when batch processing completed
        // No additional credit deduction needed here

        // Clear batch state
        // Story 14d.5c AC5: resetScanContext clears batchReceipts in context
        // Story 14d.5e: resetScanContext() triggers persistence clear automatically
        setBatchImages([]);
        batchProcessing.reset();
        resetScanContext(); // Clears batch mode + triggers storage clear via save effect

        // Story 14.15: Show batch complete modal only if transactions were saved
        // Story 12.1 v9.7.0: If empty arrays, batch was completed via individual saves/discards
        // Story 14d.5d AC10: Pass data through dialog for batch_complete
        if (savedTransactions.length > 0) {
            const dialogData: BatchCompleteDialogData = {
                transactions: savedTransactions,
                creditsUsed: 1, // Batch uses 1 super credit regardless of transaction count
            };
            showScanDialog(DIALOG_TYPES.BATCH_COMPLETE, dialogData);
        }
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

        // Story 14c.12: Update memberUpdates timestamps for shared groups
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

    // Story 11.1: Remove image from batch
    // Story 14.23: Updated to use TransactionEditorView
    // Story 14d.4e: Updated to use ScanContext
    const handleRemoveBatchImage = (index: number) => {
        setBatchImages(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // If only 1 image left, switch to single image flow
            if (updated.length === 1) {
                setShowBatchPreview(false);
                // Story 14d.4e: setScanImages wrapper handles state machine (transitions to capturing)
                setScanImages(updated);
                // Story 14.23: Use unified TransactionEditorView
                setTransactionEditorMode('new');
                // Story 14d.4c: scanButtonState derived from phase (capturing → pending)
                navigateToView('transaction-editor');
                return [];
            }
            return updated;
        });
    };

    // Story 14.15: Scan overlay handlers (AC #4)
    // Handle cancel from overlay - return to dashboard
    // Story 14d.4e: Updated to use ScanContext
    // Story 14d.4e: Cancel only available in error state (cancel button removed during processing)
    // Credit was already restored in processScan catch block before showing error state,
    // so no credit action needed here.
    const handleScanOverlayCancel = useCallback(() => {
        scanOverlay.reset();
        setIsAnalyzing(false);
        setScanError(null);
        // Story 14d.4e: setScanImages([]) resets the state machine to idle
        setScanImages([]);
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
    // Story 14d.6: Updated to use ScanContext exclusively (local state removed)
    const handleQuickSaveComplete = useCallback(() => {
        // Story 14.4 AC #5: Close card and show Trust Merchant if eligible
        // Story 14d.6: Dialog is already dismissed by resolveDialog in QuickSaveCard
        // Story 14d.4e: setScanImages([]) resets the state machine to idle
        setScanImages([]);
        setView('dashboard');
    }, [setScanImages]);

    // Story 14d.6: Updated to receive dialog data from callback parameter
    const handleQuickSave = async (dialogData?: QuickSaveDialogData) => {
        // Story 14d.6: Get transaction from dialog data (local state removed)
        const transaction = dialogData?.transaction;
        if (!services || !user || !transaction || isQuickSaving) return;

        // Story 14.24: Validate transaction has at least one item before saving
        // This is a safety net - shouldShowQuickSave should already prevent this case
        const hasValidItem = transaction.items?.some(
            item => item.name && item.name.trim().length > 0 && typeof item.price === 'number' && item.price >= 0
        );
        if (!hasValidItem) {
            // Redirect to editor instead of saving invalid transaction
            setCurrentTransaction(transaction);
            // Story 14d.6: Dialog already dismissed by resolveDialog in QuickSaveCard
            setToastMessage({ text: t('itemsRequired') || 'Add at least one item', type: 'info' });
            navigateToView('transaction-editor');
            return;
        }

        const { db, appId } = services;

        setIsQuickSaving(true);

        const tDoc = {
            ...transaction,
            total: parseStrictNumber(transaction.total)
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
            // Story 14d.6: On error, dismiss dialog via context (local state removed)
            dismissScanDialog();
        } finally {
            setIsQuickSaving(false);
        }
    };

    // Story 11.2: Handle "Editar" from Quick Save Card (AC #4)
    // Story 14.23: Navigate to TransactionEditorView instead of deprecated scan-result view
    // Story 14d.6: Updated to receive dialog data from callback parameter
    const handleQuickSaveEdit = (dialogData?: QuickSaveDialogData) => {
        // Story 14d.6: Get transaction from dialog data (local state removed)
        const transaction = dialogData?.transaction;
        if (transaction) {
            setCurrentTransaction(transaction);
        }
        // Story 14d.6: Dialog already dismissed by resolveDialog in QuickSaveCard
        // Story 14.24: Navigate to unified TransactionEditorView
        setTransactionEditorMode('new');
        // Story 14d.4c: scanButtonState derived from phase (reviewing → complete)
        // v9.7.0: Skip the ScanCompleteModal since user already saw QuickSaveCard
        setSkipScanCompleteModal(true);
        setView('transaction-editor');
    };

    // Story 11.2: Handle "Cancelar" from Quick Save Card (AC #7)
    // Story 14d.6: Updated to use ScanContext exclusively (local state removed)
    const handleQuickSaveCancel = (dialogData?: QuickSaveDialogData) => {
        void dialogData; // Unused but keeps signature consistent
        // Story 14d.6: Dialog already dismissed by dismissDialog in QuickSaveCard
        setCurrentTransaction(null);
        // Story 14d.4e: setScanImages([]) resets state machine - no need for setPendingScan(null)
        setScanImages([]);
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

    // Story 14d.6: Currency mismatch dialog handlers - updated to accept data from callback
    const handleCurrencyUseDetected = async (dialogData?: CurrencyMismatchDialogData) => {
        // Story 14d.6: Data comes from dialog callback parameter (local state removed)
        const data = dialogData;
        if (!data) return;
        // Use detected currency (already in transaction)
        const transaction = data.pendingTransaction as Transaction;
        const hasDiscrepancy = data.hasDiscrepancy;
        setCurrentTransaction(transaction);

        // Story 14d.4b FIX: Check QuickSaveCard eligibility BEFORE transitioning state
        const merchantAlias = transaction.alias || transaction.merchant;
        const isTrusted = merchantAlias ? await checkTrusted(merchantAlias) : false;
        const willShowQuickSave = !isTrusted && shouldShowQuickSave(transaction);

        // Story 14d.6 FIX: ALWAYS skip ScanCompleteModal when coming from currency dialog
        // The user already went through the currency selection flow, so they'll either see:
        // - QuickSaveCard (high confidence)
        // - Auto-save (trusted merchant)
        // - TransactionEditorView (low confidence)
        // In all cases, we don't want the redundant ScanCompleteModal
        setSkipScanCompleteModal(true);

        // Story 14d.6 FIX: Transition state machine from 'scanning' to 'reviewing' phase
        // IMPORTANT: This must be called AFTER setSkipScanCompleteModal to prevent race condition
        // The currency dialog is shown mid-scan, so dispatchProcessSuccess was never called.
        // This ensures isProcessing becomes false and ScanOverlay hides.
        dispatchProcessSuccess([transaction]);

        // Story 14d.6: Clear dialog state via context dismissal (local state removed)
        dismissScanDialog();
        // Note: Do NOT clear scanImages here - they're needed for thumbnail display
        // Images will be cleared when transaction is saved or scan is cancelled
        // Story 14.15b: Show warning if items total didn't match receipt total
        if (hasDiscrepancy) {
            setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
        }

        if (isTrusted && services && user) {
            // Auto-save for trusted merchants
            try {
                await firestoreAddTransaction(services.db, user.uid, services.appId, transaction);
                setCurrentTransaction(null);
                setToastMessage({ text: t('autoSaved'), type: 'success' });
                setView('dashboard');
            } catch (err) {
                console.error('Auto-save failed:', err);
                // Story 14d.6: Fall back to Quick Save - use showScanDialog
                if (shouldShowQuickSave(transaction)) {
                    const qsDialogData: QuickSaveDialogData = {
                        transaction: transaction,
                        confidence: calculateConfidence(transaction),
                    };
                    showScanDialog(DIALOG_TYPES.QUICKSAVE, qsDialogData);
                }
            }
        } else if (willShowQuickSave) {
            // Story 14d.6: High confidence - Show Quick Save Card via showScanDialog
            const qsDialogData: QuickSaveDialogData = {
                transaction: transaction,
                confidence: calculateConfidence(transaction),
            };
            showScanDialog(DIALOG_TYPES.QUICKSAVE, qsDialogData);
        } else {
            // Low confidence: Stay on editor for manual review
            setAnimateEditViewItems(true);
        }
    };

    // Story 14d.6: Updated handler to accept data from dialog callback
    const handleCurrencyUseDefault = async (dialogData?: CurrencyMismatchDialogData) => {
        // Story 14d.6: Data comes from dialog callback parameter (local state removed)
        const data = dialogData;
        if (!data) return;
        // Override with user's default currency
        const transaction = {
            ...data.pendingTransaction,
            currency: userPreferences.defaultCurrency,
        };
        const hasDiscrepancy = data.hasDiscrepancy;
        setCurrentTransaction(transaction);

        // Story 14d.4b FIX: Check QuickSaveCard eligibility BEFORE transitioning state
        const merchantAlias = transaction.alias || transaction.merchant;
        const isTrusted = merchantAlias ? await checkTrusted(merchantAlias) : false;
        const willShowQuickSave = !isTrusted && shouldShowQuickSave(transaction);

        // Story 14d.6 FIX: ALWAYS skip ScanCompleteModal when coming from currency dialog
        // The user already went through the currency selection flow, so they'll either see:
        // - QuickSaveCard (high confidence)
        // - Auto-save (trusted merchant)
        // - TransactionEditorView (low confidence)
        // In all cases, we don't want the redundant ScanCompleteModal
        setSkipScanCompleteModal(true);

        // Story 14d.6 FIX: Transition state machine from 'scanning' to 'reviewing' phase
        // IMPORTANT: This must be called AFTER setSkipScanCompleteModal to prevent race condition
        // The currency dialog is shown mid-scan, so dispatchProcessSuccess was never called.
        // This ensures isProcessing becomes false and ScanOverlay hides.
        dispatchProcessSuccess([transaction as Transaction]);

        // Story 14d.6: Clear dialog state via context dismissal (local state removed)
        dismissScanDialog();
        // Note: Do NOT clear scanImages here - they're needed for thumbnail display
        // Images will be cleared when transaction is saved or scan is cancelled
        // Story 14.15b: Show warning if items total didn't match receipt total
        if (hasDiscrepancy) {
            setToastMessage({ text: t('discrepancyWarning'), type: 'info' });
        }

        if (isTrusted && services && user) {
            // Auto-save for trusted merchants
            try {
                await firestoreAddTransaction(services.db, user.uid, services.appId, transaction);
                setCurrentTransaction(null);
                setToastMessage({ text: t('autoSaved'), type: 'success' });
                setView('dashboard');
            } catch (err) {
                console.error('Auto-save failed:', err);
                // Story 14d.6: Fall back to Quick Save - use showScanDialog
                if (shouldShowQuickSave(transaction)) {
                    const qsDialogData: QuickSaveDialogData = {
                        transaction: transaction as Transaction,
                        confidence: calculateConfidence(transaction),
                    };
                    showScanDialog(DIALOG_TYPES.QUICKSAVE, qsDialogData);
                }
            }
        } else if (willShowQuickSave) {
            // Story 14d.6: High confidence - Show Quick Save Card via showScanDialog
            const qsDialogData: QuickSaveDialogData = {
                transaction: transaction as Transaction,
                confidence: calculateConfidence(transaction),
            };
            showScanDialog(DIALOG_TYPES.QUICKSAVE, qsDialogData);
        } else {
            // Low confidence: Stay on editor for manual review
            setAnimateEditViewItems(true);
        }
    };

    // Story 14d.6: Updated handler to accept data from dialog callback
    const handleCurrencyMismatchCancel = (dialogData?: CurrencyMismatchDialogData) => {
        // Use data from callback parameter (unused but keeps signature consistent)
        void dialogData;
        // Story 14d.6: Cancel scan entirely - dismiss context dialog (local state removed)
        dismissScanDialog();
        setCurrentTransaction(null);
        setScanImages([]);
        setView('dashboard');
    };

    // Story 14d.6: Total mismatch dialog handlers - updated to accept data from callback
    const handleTotalUseItemsSum = (dialogData?: TotalMismatchDialogData) => {
        // Story 14d.6: Data comes from dialog callback parameter (local state removed)
        const data = dialogData;
        if (!data) return;
        const { validationResult, pendingTransaction, parsedItems } = data;

        // Use items sum as the new total (no reconciliation needed since they match)
        const correctedTransaction: Transaction = {
            ...pendingTransaction as Transaction,
            total: validationResult.itemsSum,
            items: parsedItems as Transaction['items'], // Use original items without adjustment
        };

        // Story 14d.6: Close dialog via context dismissal (local state removed)
        dismissScanDialog();

        // Continue with the rest of the scan flow
        continueScanWithTransaction(correctedTransaction);
        setToastMessage({ text: t('totalCorrected') || 'Total corregido', type: 'success' });
    };

    const handleTotalKeepOriginal = (dialogData?: TotalMismatchDialogData) => {
        // Story 14d.6: Data comes from dialog callback parameter (local state removed)
        const data = dialogData;
        if (!data) return;
        const { pendingTransaction, parsedItems } = data;

        // Keep original total, reconcile items to match
        const { items: reconciledItems } = reconcileItemsTotal(
            parsedItems as Transaction['items'],
            (pendingTransaction as Transaction).total,
            lang
        );

        const transaction: Transaction = {
            ...pendingTransaction as Transaction,
            items: reconciledItems,
        };

        // Story 14d.6: Close dialog via context dismissal (local state removed)
        dismissScanDialog();

        continueScanWithTransaction(transaction);
    };

    // Story 14d.6: Updated handler to accept data from dialog callback
    const handleTotalMismatchCancel = (dialogData?: TotalMismatchDialogData) => {
        // Use data from callback parameter (unused but keeps signature consistent)
        void dialogData;
        // Story 14d.6: Cancel scan entirely - dismiss context dialog (local state removed)
        dismissScanDialog();
        setCurrentTransaction(null);
        setScanImages([]);
        setView('dashboard');
    };

    // Story 14.24: Conflict dialog handlers
    const handleConflictClose = () => {
        // Close dialog without doing anything (stay on current view)
        setShowConflictDialog(false);
        setConflictDialogData(null);
    };

    // Story 14d.4e: Updated to use ScanContext
    const handleConflictViewCurrent = () => {
        // Navigate to the conflicting transaction (in transaction-editor)
        setShowConflictDialog(false);
        setConflictDialogData(null);
        // The scan is still active, just navigate to it
        // Story 14d.4e: Use scanState.results[0] instead of pendingScan.analyzedTransaction
        if (scanState.results.length > 0) {
            setCurrentTransaction(scanState.results[0]);
        }
        setTransactionEditorMode('new');
        // Story 14d.4c: scanButtonState derived from phase - state machine preserves phase
        navigateToView('transaction-editor');
    };

    // Story 14d.4e: Updated to use ScanContext
    const handleConflictDiscard = () => {
        // Discard the conflicting transaction and proceed with the pending action
        setShowConflictDialog(false);

        // Clear the conflicting pending scan
        // Story 14d.4c: setScanImages([]) triggers reset to idle phase
        setCurrentTransaction(null);
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
            // Story 14d.4c: scanButtonState derived from phase
            if (transaction) {
                setCurrentTransaction(transaction as any);
            } else if (mode === 'new') {
                // Story 14c.8: Use helper to include shared group when in group mode
                setCurrentTransaction(createDefaultTransaction());
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
        // v9.6.1: Also apply learned store category if present
        let finalTransaction = categorizedTransaction;
        const merchantMatch = findMerchantMatch(categorizedTransaction.merchant);
        if (merchantMatch && merchantMatch.confidence > 0.7) {
            finalTransaction = {
                ...finalTransaction,
                alias: merchantMatch.mapping.targetMerchant,
                // v9.6.1: Apply learned store category
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

        // Currency handling: if no currency, use default
        if (!finalTransaction.currency && userPreferences.defaultCurrency) {
            finalTransaction = {
                ...finalTransaction,
                currency: userPreferences.defaultCurrency,
            };
        }

        // Check for currency mismatch
        // Story 14d.6: Show dialog via ScanContext instead of local state
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
        // Story 14d.4e: Transaction is stored in scanState.results via dispatchProcessSuccess
        // No need to update pendingScan
        // Story 14d.4c: scanButtonState derived from phase (dispatchProcessSuccess sets reviewing → complete)
        // Don't clear scanImages here - they're needed for thumbnail display
        // Images are cleared when transaction is saved or discarded

        // Navigate to transaction editor to review/save the transaction
        setTransactionEditorMode('new');
        navigateToView('transaction-editor');
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
        // Story 14d.4e: setScanImages([]) resets state machine - no need for setPendingScan(null)
        setScanImages([]);

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
                        // Story 14.20: Build session context for completion messaging (AC #1, #2, #3)
                        const sessionReceipts = batchSession?.receipts ?? [];
                        const transactionsSaved = sessionReceipts.length + 1; // +1 for current
                        setSessionContext({
                            transactionsSaved,
                            consecutiveDays: profile.totalTransactions > 0 ? Math.min(profile.totalTransactions, 30) : 1,
                            isFirstOfWeek: new Date().getDay() === 1 && transactionsSaved === 1, // Monday and first tx
                            isPersonalRecord: false, // Will be set by usePersonalRecords if applicable
                            totalAmount: txWithId.total,
                            currency: txWithId.currency || currency,
                            categoriesTouched: txWithId.category ? [txWithId.category] : [],
                        });
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
                            // Story 14.20: Build minimal session context for error case
                            setSessionContext({
                                transactionsSaved: 1,
                                consecutiveDays: 1,
                                isFirstOfWeek: false,
                                isPersonalRecord: false,
                                totalAmount: tDoc.total,
                                currency: tDoc.currency || currency,
                                categoriesTouched: tDoc.category ? [tDoc.category] : [],
                            });
                        }
                    }
                });
        }
    };

    // Story 14.24: Removed window.confirm - caller shows styled confirmation dialog
    // Story 14c.12: Update memberUpdates when deleting transactions from shared groups
    const deleteTransaction = async (id: string) => {
        if (!services || !user) return;

        // Story 14c.12: Update memberUpdates for shared groups before deletion
        // Use currentTransaction if available, otherwise the deletion will be caught
        // by other members on next sync (eventual consistency acceptable for delete)
        if (currentTransaction?.sharedGroupIds && currentTransaction.sharedGroupIds.length > 0) {
            updateMemberTimestampsForTransaction(
                services.db,
                user.uid,
                [], // No groups after deletion
                currentTransaction.sharedGroupIds // All previous groups
            ).catch(err => {
                console.warn('[App] Failed to update memberUpdates for delete:', err);
            });
        }

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
    // Story 14.13 Session 5: Now supports targetView to navigate to 'items' for product counts
    // Story 14.13a: Now supports drillDownPath for multi-dimension filtering
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

        // Story 14.13a: Include drillDownPath in category filter for multi-dimension filtering
        // This allows ItemsView/HistoryView to filter by multiple dimensions simultaneously
        // (e.g., items from "Supermercado" that are in "Alimentos Frescos" group)
        if (payload.drillDownPath) {
            categoryFilter.drillDownPath = payload.drillDownPath;
        }

        const filterState: HistoryFilterState = {
            temporal: payload.temporal
                ? { ...payload.temporal, level: payload.temporal.level as TemporalFilterState['level'] }
                : { level: 'all' },
            category: categoryFilter,
            location: {}, // Location filter not set from analytics navigation
            group: {}, // Story 14.15b: Group filter not set from analytics navigation
        };

        // Store the filters to be applied when History/Items view loads
        setPendingHistoryFilters(filterState);

        // Story 14.13 Session 7: Store source distribution view for back navigation
        // If user navigated from donut chart, remember to restore it on back
        if (payload.sourceDistributionView) {
            setPendingDistributionView(payload.sourceDistributionView);
        }

        // Story 14.13 Session 5: Navigate to target view based on countMode toggle
        // 'items' = Productos view, 'history' = Compras view (default)
        const targetView = payload.targetView || 'history';
        navigateToView(targetView);
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
    // Story 14d.4e: Use scanState.phase instead of pendingScan.status
    // Story 14d.5c AC5: Use hasBatchReceipts (context) instead of batchReviewResults
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
        // 'normal' theme (warm colors) is base CSS, 'professional' and 'mono' are overrides
        if (colorTheme !== 'normal') {
            html.setAttribute('data-theme', colorTheme);
        } else {
            html.removeAttribute('data-theme');
        }
        // Story 14.22: Font family selection - 'outfit' is default in CSS
        html.setAttribute('data-font', fontFamily);
        // Story 14.37: Font size scaling - 'small' is default (no attribute needed)
        if (fontSize === 'normal') {
            html.setAttribute('data-font-size', fontSize);
        } else {
            html.removeAttribute('data-font-size');
        }
    }

    if (initError) {
        return <div className="p-10 text-center text-red-500 font-bold">Error: {initError}</div>;
    }

    if (!user) {
        return <LoginScreen onSignIn={signIn} onTestSignIn={() => signInWithTestCredentials()} t={t} />;
    }

    // Story 10a.4: History pagination removed - HistoryView replaced with InsightsView

    // Story 9.11: Compute recently added transactions for dashboard
    // Bug Fix: Use recentScans (sorted by createdAt from Firestore) instead of transactions
    // The recentScans query is specifically ordered by createdAt desc and includes receipts
    // with old transaction dates that wouldn't appear in the top 100 by date
    const recentlyAddedTransactions = recentScans.slice(0, 5);

    // Story 14c.5: Data source switching for personal vs group mode
    // When in group mode, use shared group transactions; otherwise use personal transactions
    const isGroupMode = viewMode === 'group' && !!activeGroup;
    // Story 14c.16: Use rawTransactions for group mode to enable cross-year navigation
    // sharedGroupTransactions is date-filtered (current month), rawTransactions has all data
    // Story 14c.23 Fix: Defensive guard - React Query can return undefined during cache transitions
    // Use Array.isArray check to handle any non-array value (undefined, null, or unexpected type)
    const safeSharedGroupRawTransactions = Array.isArray(sharedGroupRawTransactions)
        ? sharedGroupRawTransactions
        : [];
    const activeTransactions = isGroupMode ? safeSharedGroupRawTransactions : transactions;
    // Story 14c.5 Bug Fix: Sort shared group transactions by createdAt for recent scans carousel
    // This ensures recently scanned receipts appear first (consistent with personal mode behavior)
    // Story 14c.16: Use rawTransactions for consistent data source
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

    return (
        // Story 14d.4c: ScanProvider moved to main.tsx - App now uses useScan() directly
        <>
            {/* Story 14d.3: Browser back button blocker for scan dialogs (AC #5-7) */}
            <NavigationBlocker currentView={view} />
            {/* Story 11.6: Use dvh (dynamic viewport height) for proper PWA sizing (AC #1, #2) */}
            {/* h-screen provides fallback for Safari < 15.4 and older browsers without dvh support */}
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
            {/* Story 14.31: Hide TopHeader on ItemsView - has its own header matching HistoryView */}
            {/* Determine header variant and title based on current view */}
            {/* Story 14.15: scan-result has its own header, so exclude it */}
            {/* Story 14.15b: edit view has its own header with credits display */}
            {/* Story 14.23: transaction-editor and batch-capture have their own headers */}
            {/* Story 12.1 v9.7.0: batch-review has its own header */}
            {/* Story 14d.9: statement-scan has its own header */}
            {/* Story 14.31: recent-scans has its own header */}
            {/* Story 14.33b: insights has its own header matching settings style */}
            {view !== 'trends' && view !== 'history' && view !== 'reports' && view !== 'items' && view !== 'scan-result' && view !== 'edit' && view !== 'transaction-editor' && view !== 'batch-capture' && view !== 'batch-review' && view !== 'statement-scan' && view !== 'recent-scans' && view !== 'insights' && view !== 'alerts' && (
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
                    // Story 14c.4: View Mode Switcher props
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

            {/* Story 14c.4: View Mode Switcher dropdown */}
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
            {/* Story 14d.9: Added statement-scan to full-screen views (no padding/header) */}
            {/* Story 14.31: Added recent-scans to full-screen views */}
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
                {/* Story 10a.1: Wrap DashboardView with HistoryFiltersProvider for filter context (AC #2, #6) */}
                {/* Story 14c.5: Uses activeRecentTransactions which switches between personal/group mode */}
                {view === 'dashboard' && (
                    <HistoryFiltersProvider>
                        <DashboardView
                            transactions={activeRecentTransactions as any}
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
                                // Story 14.41: Navigate to read-only detail view first (consistent with HistoryView)
                                // User clicks "Edit" button in detail view to enter edit mode
                                navigateToTransactionDetail(transaction as Transaction);
                            }}
                            onTriggerScan={triggerScan}
                            // Story 14c.5: Pass active transactions (personal or group based on view mode)
                            allTransactions={activeTransactions as any}
                            // Story 9.12: Language for category translations
                            lang={lang}
                            // Story 14.13: Navigate to history with category filter (for treemap cell clicks)
                            onNavigateToHistory={handleNavigateToHistory}
                            // Story 14.14: Color theme for unified TransactionCard display
                            colorTheme={colorTheme}
                            // Story 14.15b: Selection mode props for group/delete operations
                            userId={user?.uid}
                            appId={services?.appId}
                            // Story 14c.5: Recent scans switch based on view mode
                            // In group mode, use recent shared transactions; in personal mode, use createdAt-sorted
                            recentScans={activeRecentTransactions as any}
                            // Story 14.13: Font color mode for category text reactivity
                            fontColorMode={fontColorMode}
                            // Story 14.31: Navigate to recent scans view (Ver todo)
                            onViewRecentScans={() => setView('recent-scans')}
                            // Story 14.35b: Foreign location display settings
                            defaultCountry={defaultCountry}
                            foreignLocationFormat={userPreferences.foreignLocationFormat}
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
                        // Story 12.1 v9.7.0: Key forces re-mount when navigating between batch receipts
                        // Story 14d.5d: Now using ScanContext batchEditingIndex
                        key={scanState.batchEditingIndex !== null ? `batch-${scanState.batchEditingIndex}` : 'single'}
                        transaction={currentTransaction}
                        mode={transactionEditorMode}
                        // Story 14.24: Read-only mode for viewing transactions from History
                        readOnly={isViewingReadOnly}
                        onRequestEdit={handleRequestEditFromReadOnly}
                        // Story 14c.6: Other user's transaction (strict read-only, no edit option)
                        isOtherUserTransaction={Boolean(currentTransaction?._ownerId && currentTransaction._ownerId !== user?.uid)}
                        ownerId={currentTransaction?._ownerId}
                        ownerProfile={currentTransaction?._ownerId && activeGroup?.memberProfiles
                            ? activeGroup.memberProfiles[currentTransaction._ownerId]
                            : undefined
                        }
                        scanButtonState={scanButtonState}
                        isProcessing={isAnalyzing}
                        processingEta={null}
                        scanError={scanError}
                        // v9.7.0: Skip ScanCompleteModal when coming from QuickSaveCard edit
                        skipScanCompleteModal={skipScanCompleteModal}
                        // Story 14d.4c: Always use scanImages[0] as fallback if available
                        // This ensures thumbnail shows even if Cloud Function didn't return thumbnailUrl
                        thumbnailUrl={currentTransaction?.thumbnailUrl || (scanImages.length > 0 ? scanImages[0] : undefined)}
                        // v9.7.0: Pass pendingImageUrl during both 'pending' and 'scanning' states
                        // so the captured image shows while processing
                        pendingImageUrl={(scanButtonState === 'pending' || scanButtonState === 'scanning') && scanImages.length > 0 ? scanImages[0] : undefined}
                        onUpdateTransaction={(trans) => {
                            // Story 14.24: Update currentTransaction for UI
                            // Story 14d.4e: ScanContext persists state automatically via save effect
                            setCurrentTransaction(trans as any);

                            // Story 14c.8: Also update batch receipt when in batch editing mode
                            // This ensures sharedGroupIds and other changes are persisted when navigating
                            // between batch receipts or going back to batch-review
                            if (scanState.batchEditingIndex !== null && scanState.batchReceipts) {
                                const receiptId = scanState.batchReceipts[scanState.batchEditingIndex]?.id;
                                if (receiptId) {
                                    updateBatchReceiptContext(receiptId, { transaction: trans as any });
                                }
                            }
                        }}
                        onSave={async (trans) => {
                            // Story 14d.5: Prevent double-click by tracking saving state
                            if (isTransactionSaving) return;
                            setIsTransactionSaving(true);
                            try {
                                await saveTransaction(trans);
                                // Story 14.24: Reset all scan state after successful save
                                // Story 14.13 Session 6: Clear transaction navigation list
                                // Story 14d.4c: setScanImages([]) resets to idle phase
                                setScanImages([]);
                                setScanError(null);
                                // Story 14d.4e: setScanImages([]) resets state machine - no need for setPendingScan(null)
                                setCurrentTransaction(null);
                                setIsViewingReadOnly(false);
                                setCreditUsedInSession(false);
                                setTransactionNavigationList(null);
                            } finally {
                                setIsTransactionSaving(false);
                            }
                        }}
                        onCancel={() => {
                            // Story 14.23: Reset scan state and navigate back
                            // Story 14.24: Clear scan state on explicit discard, reset read-only mode
                            // Story 14.13 Session 6: Clear transaction navigation list
                            // Story 14d.4c: setScanImages([]) resets to idle phase
                            setScanImages([]);
                            setScanError(null);
                            // Story 14d.4e: setScanImages([]) resets state machine - no need for setPendingScan(null)
                            setCurrentTransaction(null);
                            setAnimateEditViewItems(false);
                            setIsViewingReadOnly(false);
                            setCreditUsedInSession(false);
                            setTransactionNavigationList(null);
                            // Story 14d.5d AC5: Now using ScanContext batchEditingIndex
                            if (scanState.batchEditingIndex !== null) {
                                setBatchEditingIndexContext(null);
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
                                // Story 14d.4c: setScanImages will transition to 'capturing' phase (→ pending button)
                                // Story 14d.4e: setScanImages wrapper handles state machine updates
                                setScanImages([base64]);
                            };
                            reader.readAsDataURL(file);
                        }}
                        onProcessScan={() => {
                            // Story 14d.4c: dispatchProcessStart sets phase to 'scanning'
                            processScan();
                        }}
                        onRetry={() => {
                            // Clear error and retry
                            // Story 14d.4c: dispatchProcessStart sets phase to 'scanning'
                            setScanError(null);
                            processScan();
                        }}
                        onRescan={transactionEditorMode === 'existing' ? async () => {
                            // Re-scan existing transaction
                            // Story 14d.4c: handleRescan calls dispatchProcessStart which sets phase to 'scanning'
                            await handleRescan();
                        } : undefined}
                        isRescanning={isRescanning}
                        onDelete={transactionEditorMode === 'existing' ? deleteTransaction : undefined}
                        onSaveMapping={saveMapping}
                        onSaveMerchantMapping={saveMerchantMapping}
                        onSaveSubcategoryMapping={saveSubcategoryMapping}
                        onSaveItemNameMapping={saveItemNameMapping}
                        onShowToast={(text) => setToastMessage({ text, type: 'success' })}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        formatCurrency={formatCurrency}
                        currency={currency}
                        lang={lang}
                        credits={userCredits}
                        storeCategories={STORE_CATEGORIES as unknown as string[]}
                        distinctAliases={distinctAliases}
                        // Story 14.13 Session 6: Support both batch editing context and transaction list navigation
                        // Priority: batchEditingIndex (from ScanContext) > transactionNavigationList (from ItemsView)
                        // Story 14d.5d AC3: Now using ScanContext batchEditingIndex + batchReceipts
                        batchContext={
                            scanState.batchEditingIndex !== null && scanState.batchReceipts
                                ? { index: scanState.batchEditingIndex + 1, total: scanState.batchReceipts.length }
                                : transactionNavigationList && currentTransaction?.id
                                    ? { index: transactionNavigationList.indexOf(currentTransaction.id) + 1, total: transactionNavigationList.length }
                                    : null
                        }
                        onBatchPrevious={
                            scanState.batchEditingIndex !== null
                                ? handleBatchPrevious
                                : transactionNavigationList
                                    ? handleTransactionListPrevious
                                    : undefined
                        }
                        onBatchNext={
                            scanState.batchEditingIndex !== null
                                ? handleBatchNext
                                : transactionNavigationList
                                    ? handleTransactionListNext
                                    : undefined
                        }
                        defaultCity={defaultCity}
                        defaultCountry={defaultCountry}
                        onCreditInfoClick={() => setShowCreditInfoModal(true)}
                        isSaving={isTransactionSaving}
                        animateItems={animateEditViewItems}
                        // Story 14.24: Only show credit warning if a credit was actually used in this session
                        // (not just because an existing transaction has a thumbnail)
                        creditUsed={creditUsedInSession}
                        // Phase 4: Cross-store suggestions - pass all item name mappings
                        itemNameMappings={itemNameMappings}
                        // Batch mode: Allow switching to batch scan from single scan mode
                        // Story 14d.5a-phase2: Context is now sole source of truth for batch mode
                        onBatchModeClick={() => {
                            if (user?.uid) {
                                startBatchScanContext(user.uid);
                            }
                            navigateToView('batch-capture');
                        }}
                        // Story 14c.7: Shared groups for tagging transactions
                        availableGroups={availableGroupsForSelector}
                        groupsLoading={sharedGroupsLoading}
                        onGroupsChange={async (groupIds) => {
                            // Update memberUpdates timestamps for affected groups
                            if (user?.uid && currentTransaction) {
                                const previousGroupIds = currentTransaction.sharedGroupIds || [];

                                // Debug logging for cache clearing
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

                                // Story 14c.5 Bug Fix: Clear IndexedDB cache for affected groups
                                // This ensures untagged transactions don't appear in stale cache
                                const affectedGroupIds = new Set([...previousGroupIds, ...groupIds]);

                                if (import.meta.env.DEV) {
                                    console.log('[App] Clearing cache for groups:', Array.from(affectedGroupIds));
                                }

                                // Groups the transaction was REMOVED from
                                const removedFromGroups = previousGroupIds.filter(id => !groupIds.includes(id));
                                // Groups the transaction was ADDED to
                                const addedToGroups = groupIds.filter(id => !previousGroupIds.includes(id));

                                // Optimistically update React Query cache
                                // This prevents the "double save" issue caused by refetch permission errors
                                affectedGroupIds.forEach(groupId => {
                                    // Clear IndexedDB cache (async, fire and forget)
                                    clearGroupCacheById(groupId).catch(err => {
                                        console.warn('[App] Failed to clear IndexedDB cache:', err);
                                    });

                                    // Optimistically update in-memory cache based on whether
                                    // transaction was added or removed from this group
                                    queryClient.setQueriesData(
                                        { queryKey: ['sharedGroupTransactions', groupId], exact: false },
                                        (oldData: Transaction[] | undefined) => {
                                            if (!oldData || !currentTransaction.id) return oldData;

                                            if (removedFromGroups.includes(groupId)) {
                                                // Remove transaction from this group's cache
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
                                                // Add transaction to this group's cache (with updated sharedGroupIds)
                                                const updatedTxn = {
                                                    ...currentTransaction,
                                                    sharedGroupIds: groupIds,
                                                    _ownerId: user.uid,
                                                };
                                                // Check if already exists (avoid duplicates)
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
                                });
                            }
                        }}
                    />
                )}

                {/* Story 14c.5: Uses activeTransactions which switches between personal/group mode */}
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
                                transactions={activeTransactions}
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
                                        // Navigate to history with current month filter
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
                                    } else if (viewName === 'reports') {
                                        setView('reports');
                                    }
                                }}
                                // Story 14.14b: Groups support for IconFilterBar
                                userId={user?.uid || ''}
                                appId={services?.appId || ''}
                                // Story 14.13 Session 7: Restore distribution view on back navigation
                                initialDistributionView={pendingDistributionView || undefined}
                                // Story 14.13: Font color mode for category text reactivity
                                fontColorMode={fontColorMode}
                                // Story 14c.9: Shared Group Analytics props
                                isGroupMode={isGroupMode}
                                groupName={activeGroup?.name}
                                groupMembers={activeGroup?.memberProfiles
                                    ? Object.entries(activeGroup.memberProfiles).map(([uid, profile]) => ({
                                        uid,
                                        displayName: profile.displayName,
                                        email: profile.email,
                                    }))
                                    : []
                                }
                                spendingByMember={sharedGroupSpendingByMember}
                            />
                        </AnalyticsProvider>
                    </HistoryFiltersProvider>
                )}

                {/* Story 10a.4: InsightsView - Insight History (AC #1-6) */}
                {/* Story 14.33b: InsightsView now has its own header matching Settings style */}
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
                        onNavigateToView={(targetView) => navigateToView(targetView as View)}
                        onMenuClick={() => setView('settings')}
                        theme={theme}
                        t={t}
                        userName={user?.displayName || ''}
                        userEmail={user?.email || ''}
                    />
                )}

                {/* Story 12.1: Batch Capture UI - dedicated batch mode view (AC #1-9) */}
                {/* Story 14d.5a-phase2: isBatchMode now read from ScanContext */}
                {view === 'batch-capture' && (
                    <BatchCaptureView
                        isBatchMode={isBatchModeFromContext}
                        onToggleMode={(batchMode) => {
                            // Story 14d.5a-phase2: Toggle via context instead of local state
                            if (batchMode && user?.uid) {
                                startBatchScanContext(user.uid);
                            } else if (!batchMode) {
                                // Switch to individual mode - reset context and go to edit view
                                resetScanContext();
                                handleNewTransaction(false);
                            }
                        }}
                        onProcessBatch={async (images) => {
                            // Story 12.1 v9.7.0: Direct batch processing without credit warning popup
                            // Process immediately like single scan - no intermediate confirmation
                            setBatchImages(images);

                            // Story 14d.5b: Set images in ScanContext for state machine tracking
                            setScanContextImages(images);

                            // Story 14d.4e: Deduct super credit IMMEDIATELY to Firestore to prevent exploits
                            // Credit is only restored if ALL API calls fail.
                            const deducted = await deductUserSuperCredits(1);
                            if (!deducted) {
                                setToastMessage({ text: t('noSuperCreditsMessage') || t('noCreditsMessage'), type: 'info' });
                                return;
                            }

                            // Navigate to batch-review to show processing progress
                            // Users can navigate away and return to see progress
                            setView('batch-review');

                            // Story 14d.5b: Transition state machine to 'scanning' phase
                            // This is required before BATCH_ITEM_* actions can be dispatched
                            dispatchProcessStart('super', 1);

                            // Start parallel processing directly
                            // Story 14d.5b: Pass ScanContext callbacks for state machine integration
                            try {
                                const results = await batchProcessing.startProcessing(
                                    images,
                                    scanCurrency,
                                    scanStoreType !== 'auto' ? scanStoreType : undefined,
                                    {
                                        onItemStart: dispatchBatchItemStart,
                                        onItemSuccess: dispatchBatchItemSuccess,
                                        onItemError: dispatchBatchItemError,
                                        // Story 14d.5: Fixed race condition - create batchReceipts and pass
                                        // to dispatchBatchComplete for atomic state update with phase transition
                                        // Story 14c.8: Auto-tag batch transactions when in group view mode (AC#3)
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

                                // Check if ALL results failed (complete failure)
                                const allFailed = results.every(r => !r.success);
                                if (allFailed) {
                                    // Story 14d.4e: Restore credit only if ALL API calls failed
                                    await addUserSuperCredits(1);
                                    setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
                                }

                                // Story 14d.5: batchReceipts now set atomically in onComplete callback above
                                // No need to call setBatchReceiptsContext here anymore
                                // Story 14d.5e: Persistence handled automatically via scanState save effect
                            } catch (e) {
                                // Story 14d.4e: Restore credit on complete batch failure
                                console.error('Batch processing failed:', e);
                                await addUserSuperCredits(1);
                                setToastMessage({ text: t('scanFailedCreditRefunded'), type: 'info' });
                            }
                        }}
                        onSwitchToIndividual={() => {
                            // Story 14d.5a-phase2d: Reset context to clear batch mode
                            // Story 14d.5e: resetScanContext() triggers persistence clear automatically
                            resetScanContext();
                            setBatchImages([]); // Clear images when switching to individual
                            handleNewTransaction(false);
                        }}
                        onBack={() => {
                            // Story 12.1 v9.7.0: Clear batch state on explicit cancel
                            // Story 14d.5a-phase2d: Reset context to clear batch mode
                            // Story 14d.5e: resetScanContext() triggers persistence clear automatically
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
                        // Show credit info modal when badges tapped
                        onCreditInfoClick={() => setShowCreditInfoModal(true)}
                        // Story 12.1 v9.7.0: Pass images for persistence across navigation
                        imageDataUrls={batchImages}
                        onImagesChange={(dataUrls) => setBatchImages(dataUrls)}
                    />
                )}

                {/* Story 12.3: Batch Review Queue - review processed receipts before saving (AC #1-8) */}
                {/* Also shows processing progress when navigating back during batch processing */}
                {/* Story 14d.5c AC5: processingResults still passed for type compatibility, but BatchReviewView */}
                {/* uses context mode (scanState.batchReceipts) when isBatchReviewing is true */}
                {view === 'batch-review' && (
                    <BatchReviewView
                        processingResults={batchProcessing.results}
                        imageDataUrls={batchImages}
                        theme={theme as 'light' | 'dark'}
                        currency={currency}
                        t={t}
                        onEditReceipt={handleBatchEditReceipt}
                        onBack={handleBatchReviewBack}
                        onCancel={handleBatchReviewBack}
                        onSaveComplete={handleBatchSaveComplete}
                        saveTransaction={handleBatchSaveTransaction}
                        // Story 12.3: Pass processing state for inline progress display
                        processingState={batchProcessing.isProcessing ? {
                            isProcessing: true,
                            progress: batchProcessing.progress,
                            states: batchProcessing.states,
                            onCancelProcessing: batchProcessing.cancel,
                        } : undefined}
                        // Story 12.1 v9.7.0: Credit display in header
                        credits={userCredits ? {
                            remaining: userCredits.remaining,
                            superRemaining: userCredits.superRemaining,
                        } : undefined}
                        onCreditInfoClick={() => setShowCreditInfoModal(true)}
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
                        // Story 14.37: Font size setting
                        fontSize={fontSize}
                        onSetFontSize={(fs: string) => setFontSize(fs as FontSize)}
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
                        // Story 14.35b: Foreign location display format
                        foreignLocationFormat={userPreferences.foreignLocationFormat}
                        onSetForeignLocationFormat={setForeignLocationFormatPref}
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
                        // Phase 5: Item name mappings management
                        itemNameMappings={itemNameMappings}
                        itemNameMappingsLoading={itemNameMappingsLoading}
                        onDeleteItemNameMapping={deleteItemNameMapping}
                        onUpdateItemNameMapping={updateItemNameMapping}
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

                            // Phase 5: Delete all item name mappings
                            for (const mapping of itemNameMappings) {
                                if (mapping.id) {
                                    deletePromises.push(deleteItemNameMapping(mapping.id));
                                }
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

                {/* Story 14.11: Notifications View - Story 14c.2: Shows pending invitations */}
                {/* Story 14c.13: Now also shows shared group notifications */}
                {view === 'alerts' && (
                    <NotificationsView
                        user={user}
                        navigateToView={(v: string) => navigateToView(v as View)}
                        setView={(v: string) => setView(v as View)}
                        t={t}
                        theme={theme}
                        pendingInvitations={pendingInvitations}
                        services={services}
                        lang={lang as 'en' | 'es'}
                        setToastMessage={(msg) => setToastMessage({ text: msg.text, type: msg.type as 'success' | 'info' })}
                        inAppNotifications={inAppNotifications}
                        userSharedGroups={userSharedGroups}
                        setGroupMode={setGroupMode}
                        markNotificationAsRead={markNotificationAsRead}
                        markAllNotificationsAsRead={markAllNotificationsAsRead}
                        deleteInAppNotification={deleteInAppNotification}
                        deleteAllInAppNotifications={deleteAllInAppNotifications}
                    />
                )}

                {/* Story 14d.9: Statement Scan Placeholder View */}
                {view === 'statement-scan' && (
                    <StatementScanView
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        onBack={() => navigateToView('dashboard')}
                    />
                )}

                {/* Story 14.14: Transaction History View (accessible via profile menu) */}
                {/* Story 14.21: Added colorTheme prop for unified category colors */}
                {/* Story 14.27: Uses paginatedTransactions with loadMore for infinite scroll */}
                {/* Story 14.31: Uses transactionsWithRecentScans to include recently scanned receipts */}
                {/* Story 14.13b: onStateChange syncs filter state for persistence across navigation */}
                {/* Story 14c.5: In group mode, uses sharedGroupTransactions instead */}
                {view === 'history' && (
                    <HistoryFiltersProvider
                        initialState={pendingHistoryFilters || undefined}
                        onStateChange={setPendingHistoryFilters}
                    >
                        <HistoryView
                            historyTrans={(isGroupMode ? sharedGroupTransactions : transactionsWithRecentScans) as any}
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
                            allTransactions={(isGroupMode ? safeSharedGroupRawTransactions : transactionsWithRecentScans) as any}
                            defaultCity={defaultCity}
                            defaultCountry={defaultCountry}
                            lang={lang}
                            userId={user?.uid}
                            appId={services?.appId}
                            userName={user?.displayName || ''}
                            userEmail={user?.email || ''}
                            onNavigateToView={(targetView) => navigateToView(targetView as View)}
                            hasMoreTransactions={isGroupMode ? false : hasMoreTransactions}
                            onLoadMoreTransactions={isGroupMode ? () => {} : loadMoreTransactions}
                            loadingMoreTransactions={isGroupMode ? false : loadingMoreTransactions}
                            isAtListenerLimit={isGroupMode ? false : isAtListenerLimit}
                            // Story 14.13: Font color mode for category text reactivity
                            fontColorMode={fontColorMode}
                            // Story 14.35b: Foreign location display format
                            foreignLocationFormat={userPreferences.foreignLocationFormat}
                            // Story 14c.6: Active shared group for ownership display
                            activeGroup={activeGroup ? {
                                id: activeGroup.id ?? '',
                                memberProfiles: activeGroup.memberProfiles,
                            } : undefined}
                        />
                    </HistoryFiltersProvider>
                )}

                {/* Story 14.31: Recent Scans View - dedicated view for latest scans sorted by scan date */}
                {view === 'recent-scans' && (
                    <RecentScansView
                        transactions={transactionsWithRecentScans as any}
                        theme={theme}
                        currency={currency}
                        dateFormat={dateFormat}
                        t={t}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate as any}
                        onBack={() => setView('dashboard')}
                        onEditTransaction={(tx) => {
                            navigateToTransactionDetail(tx as Transaction);
                        }}
                        lang={lang}
                        // Story 14.35b: Foreign location display settings
                        defaultCountry={defaultCountry}
                        foreignLocationFormat={userPreferences.foreignLocationFormat}
                        // Story 14c.8: User ID for group color lookup
                        userId={user?.uid}
                    />
                )}

                {/* Story 14.31: Items History View (accessible via profile menu or item category clicks) */}
                {/* Session 2: Wrapped with HistoryFiltersProvider for temporal breadcrumb navigation */}
                {/* Session 2: Added userId and appId for groups filter (Layers icon) */}
                {/* Story 14.13 Session 5: Pass pendingHistoryFilters for filtered navigation from analytics */}
                {/* Story 14.13b: onStateChange syncs filter state for persistence across navigation */}
                {/* Story 14c.5: In group mode, uses activeTransactions (switched data source) */}
                {view === 'items' && (
                    <HistoryFiltersProvider
                        initialState={pendingHistoryFilters || undefined}
                        onStateChange={setPendingHistoryFilters}
                    >
                        <ItemsView
                            transactions={activeTransactions}
                            theme={theme}
                            colorTheme={colorTheme}
                            currency={currency}
                            dateFormat={dateFormat}
                            t={t}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate as any}
                            onBack={navigateBack}
                            onEditTransaction={(transactionId, allTransactionIds) => {
                                // Find the transaction and navigate to detail view
                                // Story 14.13 Session 6: Pass all transaction IDs for multi-transaction navigation
                                const tx = activeTransactions.find(t => t.id === transactionId);
                                if (tx) {
                                    navigateToTransactionDetail(tx as Transaction, allTransactionIds);
                                }
                            }}
                            lang={lang}
                            userName={user?.displayName || ''}
                            userEmail={user?.email || ''}
                            onNavigateToView={(targetView) => navigateToView(targetView as View)}
                            userId={user?.uid}
                            appId={services?.appId}
                            // Story 14.13: Font color mode for category text reactivity
                            fontColorMode={fontColorMode}
                            // Story 14.35b: User's default country for foreign location detection
                            defaultCountry={defaultCountry}
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
                    // Story 14d.9: If in statement mode, return to statement view
                    if (scanState.mode === 'statement') {
                        navigateToView('statement-scan');
                        return;
                    }
                    // Story 12.1 v9.7.0: Check batch state first (in order of priority)
                    // 1. Batch processing in progress or results pending review
                    // Story 14d.5c AC5: Use hasBatchReceipts (context) instead of batchReviewResults
                    if (batchProcessing.isProcessing || hasBatchReceipts) {
                        navigateToView('batch-review');
                    }
                    // 2. Batch images captured but not yet processed - return to capture
                    // Story 14d.5a-phase2d: Ensure context is in batch mode
                    else if (batchImages.length > 0) {
                        if (!isBatchModeFromContext && user?.uid) {
                            startBatchScanContext(user.uid);
                        }
                        navigateToView('batch-capture');
                    }
                    // 3. Single-image scan in progress or complete - show transaction editor
                    // Story 14d.4e: Use scanState instead of pendingScan
                    else if (scanState.phase === 'scanning' || scanState.results.length > 0) {
                        navigateToView('transaction-editor');
                    }
                    // 4. No active scan - trigger new scan
                    else {
                        triggerScan();
                    }
                }}
                // Story 12.1: Long-press on camera FAB opens batch capture mode (AC #1)
                // Story 12.1 v9.7.0: If batch is active, return to appropriate view
                // Story 14d.5: Also dispatch to ScanContext for state machine tracking
                // Story 14d.5a-phase2d: Batch mode now solely tracked by context
                onBatchClick={() => {
                    // Story 14d.5c AC5: Use hasBatchReceipts (context) instead of batchReviewResults
                    if (batchProcessing.isProcessing || hasBatchReceipts) {
                        // Batch processing or results pending - go to review
                        navigateToView('batch-review');
                    } else if (batchImages.length > 0) {
                        // Batch images captured but not processed - return to capture
                        // Story 14d.5a-phase2d: Ensure context is in batch mode
                        if (!isBatchModeFromContext && user?.uid) {
                            startBatchScanContext(user.uid);
                        }
                        navigateToView('batch-capture');
                    } else {
                        // No active batch - start new batch capture
                        // Story 14d.5a-phase2: Context is sole source of truth
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
                // Story 14d.9: Statement scan placeholder navigation
                onStatementClick={() => {
                    // Start statement scan in context and navigate to placeholder view
                    if (user?.uid) {
                        startStatementScanContext(user.uid);
                    }
                    navigateToView('statement-scan');
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
                // Story 14d.5a-phase2: Batch mode now from ScanContext
                // Context tracks batch state across all phases (capturing, processing, reviewing)
                // Story 14d.5c AC5: Use hasBatchReceipts (context) instead of batchReviewResults
                isBatchMode={isBatchModeFromContext || hasBatchReceipts}
                // Story 14c.2: Badge count for alerts (pending invitations)
                alertsBadgeCount={pendingInvitationsCount + inAppNotificationsUnreadCount}
                // Story 14c.4: Pass active group color for nav bar top border
                activeGroupColor={viewMode === 'group' && activeGroup ? activeGroup.color : undefined}
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
            {/* Story 14.42: Updated to top banner with language prop */}
            <PWAUpdatePrompt language={lang} />

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
                visible={(isAnalyzing || scanOverlay.state === 'error') && (view === 'scan' || view === 'scan-result' || view === 'edit' || view === 'transaction-editor')}
                capturedImageUrl={scanImages[0]}
            />

            {/* Story 10.6: Insight card after transaction save (AC #1, #3, #4) */}
            {/* Story 14.20: onDismiss now triggers SessionComplete (AC #1) */}
            {showInsightCard && (
                currentInsight && currentInsight.id !== 'building_profile'
                    ? <InsightCard
                        insight={currentInsight}
                        onDismiss={() => {
                            setShowInsightCard(false);
                            // Story 14.20: Show session complete after insight dismisses (AC #1)
                            if (sessionContext) {
                                setShowSessionComplete(true);
                            }
                        }}
                        theme={theme as 'light' | 'dark'}
                      />
                    : <BuildingProfileCard
                        onDismiss={() => {
                            setShowInsightCard(false);
                            // Story 14.20: Show session complete after insight dismisses (AC #1)
                            if (sessionContext) {
                                setShowSessionComplete(true);
                            }
                        }}
                        theme={theme as 'light' | 'dark'}
                      />
            )}

            {/* Story 14.20: Session completion messaging (AC #1-6) */}
            {showSessionComplete && sessionContext && (
                <SessionComplete
                    context={sessionContext}
                    onDismiss={() => {
                        setShowSessionComplete(false);
                        setSessionContext(null);
                    }}
                    onAction={(action: SessionAction) => {
                        // Story 14.20 AC #4: Navigate based on suggestion
                        switch (action) {
                            case 'analytics':
                                setView('trends');
                                break;
                            case 'scan':
                                // Return to dashboard to scan another
                                setView('dashboard');
                                break;
                            case 'history': {
                                // Navigate to history with current month filter
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
                    t={t}
                    theme={theme as 'light' | 'dark'}
                />
            )}

            {/* Story 14.19: Personal record celebration banner */}
            {showRecordBanner && recordToCelebrate && (
                <PersonalRecordBanner
                    record={recordToCelebrate}
                    onDismiss={dismissRecord}
                    autoDismissMs={8000}
                    theme={theme as 'light' | 'dark'}
                />
            )}

            {/* Story 11.2: Quick Save Card for high-confidence scans (AC #1-9) */}
            {/* Story 14d.6: Now rendered unconditionally - component reads from ScanContext */}
            {/* Visibility controlled via scanState.activeDialog?.type === 'quicksave' */}
            <QuickSaveCard
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
                // Story 14.35b: User's default country for foreign location detection
                userDefaultCountry={defaultCountry}
                // Story 14c.8: Pass active group for auto-tag indicator (AC#2)
                // Note: onRemoveGroupTag intentionally not passed - QuickSaveCard is for fast saving
                // If user wants to change the group, they should use the Edit button
                activeGroup={viewMode === 'group' && activeGroup ? {
                    id: activeGroup.id!,
                    name: activeGroup.name,
                    color: activeGroup.color,
                    icon: activeGroup.icon || undefined,
                } : null}
            />

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

            {/* Story 12.1 v9.7.0: Batch Processing Overlay - matches single scan UX */}
            {/* Only show on batch-related views, allow navigation to other views */}
            <BatchProcessingOverlay
                visible={batchProcessing.isProcessing && (view === 'batch-capture' || view === 'batch-review')}
                theme={theme as 'light' | 'dark'}
                t={t}
                progress={batchProcessing.progress}
            />

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

            {/* Story 12.1 v9.7.0: Batch discard confirmation dialog (credit already spent) */}
            {/* Story 14d.5d AC9: Now uses ScanContext activeDialog */}
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
            {/* Story 14d.5d AC10: Now uses ScanContext activeDialog with typed data */}
            {scanState.activeDialog?.type === DIALOG_TYPES.BATCH_COMPLETE && (scanState.activeDialog.data as BatchCompleteDialogData)?.transactions?.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    style={{ paddingTop: 'calc(1rem + var(--safe-top, 0px))', paddingBottom: 'calc(1rem + var(--safe-bottom, 0px))' }}
                >
                    <BatchCompleteModal
                        transactions={(scanState.activeDialog.data as BatchCompleteDialogData).transactions}
                        creditsUsed={(scanState.activeDialog.data as BatchCompleteDialogData).creditsUsed}
                        creditsRemaining={userCredits.superRemaining ?? 0}
                        theme={theme as 'light' | 'dark'}
                        t={t}
                        onDismiss={() => {
                            dismissScanDialog();
                        }}
                        onNavigateToHistory={(payload) => {
                            dismissScanDialog();
                            handleNavigateToHistory(payload);
                        }}
                        onGoHome={() => {
                            dismissScanDialog();
                            setView('dashboard');
                        }}
                        formatCurrency={formatCurrency}
                    />
                </div>
            )}

            {/* Story 14.15b: Currency Mismatch Dialog (AC #2) */}
            {/* Story 14d.6: Now rendered unconditionally - component reads from ScanContext */}
            {/* Visibility controlled via scanState.activeDialog?.type === 'currency_mismatch' */}
            <CurrencyMismatchDialog
                userCurrency={userPreferences.defaultCurrency || 'CLP'}
                onUseDetected={handleCurrencyUseDetected}
                onUseDefault={handleCurrencyUseDefault}
                onCancel={handleCurrencyMismatchCancel}
                theme={theme as 'light' | 'dark'}
                t={t}
            />

            {/* Total Mismatch Dialog (OCR error detection) */}
            {/* Story 14d.6: Now rendered unconditionally - component reads from ScanContext */}
            {/* Visibility controlled via scanState.activeDialog?.type === 'total_mismatch' */}
            <TotalMismatchDialog
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

            {/* Story 14c.17: Join Group via Share Link Dialog */}
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
            </div>
        </>
    );
}

export default App;
