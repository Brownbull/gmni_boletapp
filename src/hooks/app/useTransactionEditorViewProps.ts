/**
 * Story 14c-refactor.26: useTransactionEditorViewProps Hook
 * Story 14c-refactor.33b: Hook Expansion - Added callback passthrough
 *
 * Composes all props needed for TransactionEditorView from App.tsx state.
 * This hook receives ALL data AND callbacks as options for passthrough.
 *
 * Architecture:
 * - Handlers come from ViewHandlersContext (story 14c-refactor.25) for dialog/navigation
 * - Transaction, scan, and mapping callbacks are passed through this hook
 * - Data props are composed by this hook
 * - TransactionEditorView receives: spread props + useViewHandlers()
 *
 * Key Features:
 * - scanButtonState derivation from scanState.phase
 * - pendingImageUrl computation based on scan state
 * - batchContext computation from ScanContext or navigation list
 * - All props strongly-typed via TransactionEditorDataProps
 * - 17 callback props passthrough (Story 14c-refactor.33b)
 *
 * @example
 * ```tsx
 * function App() {
 *   const editorProps = useTransactionEditorViewProps({
 *     user,
 *     scanState,
 *     currentTransaction,
 *     transactionEditorMode: mode,
 *     onSave: handleSave,
 *     onCancel: handleCancel,
 *     // ... all other data and callbacks
 *   });
 *
 *   return <TransactionEditorView {...editorProps} />;
 * }
 * ```
 */

import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { Transaction, StoreCategory, ItemCategory } from '../../types/transaction';
import type { UserCredits } from '../../types/scan';
import type { ItemNameMapping } from '../../types/itemNameMapping';
import type { Language } from '../../utils/translations';
import type { ScanButtonState } from '../../views/TransactionEditorView';
import type { GroupWithMeta } from '../../components/SharedGroups';
import type { ScanPhase } from '../../types/scanStateMachine';

// =============================================================================
// Types
// =============================================================================

/**
 * Scan state subset needed for prop composition
 * (Matches relevant fields from ScanState)
 */
export interface ScanStateForProps {
    /** Current phase of scan state machine */
    phase: ScanPhase;
    /** Images captured (base64 URLs) */
    images: string[];
    /** Currently editing receipt index in batch mode */
    batchEditingIndex: number | null;
    /** Batch receipts for navigation context */
    batchReceipts: Array<{ id: string }> | null;
}

/**
 * Active group info for owner display
 */
export interface ActiveGroupInfo {
    memberProfiles?: Record<string, { displayName?: string; photoURL?: string | null }>;
}

/**
 * User preferences subset for defaults
 */
export interface UserPreferencesForProps {
    defaultCity?: string;
    defaultCountry?: string;
}

/**
 * Props passed to useTransactionEditorViewProps hook.
 * All data comes from App.tsx state - no internal hook calls.
 */
export interface UseTransactionEditorViewPropsOptions {
    // User and auth
    /** Current authenticated user */
    user: User | null;

    // Transaction state
    /** Current transaction being edited (null for blank new) */
    currentTransaction: Transaction | null;
    /** Editor mode: 'new' or 'existing' */
    transactionEditorMode: 'new' | 'existing';
    /** Read-only mode for viewing from History */
    isViewingReadOnly: boolean;
    /** Transaction navigation list for ItemsView multi-transaction browsing */
    transactionNavigationList: string[] | null;

    // Scan state (from ScanContext via App.tsx)
    /** Scan state for deriving scanButtonState and image props */
    scanState: ScanStateForProps;
    /** Whether scan is currently analyzing */
    isAnalyzing: boolean;
    /** Scan error message */
    scanError: string | null;
    /** Skip showing ScanCompleteModal (e.g., from QuickSaveCard) */
    skipScanCompleteModal: boolean;
    /** Whether re-scan is in progress */
    isRescanning: boolean;

    // Shared groups
    /** Active group for owner profile display */
    activeGroup: ActiveGroupInfo | null;
    /** Available groups for selection */
    availableGroups: GroupWithMeta[];
    /** Whether groups are loading */
    groupsLoading: boolean;

    // User data
    /** User credits for scan */
    userCredits: UserCredits;
    /** User preferences for defaults */
    userPreferences: UserPreferencesForProps;
    /** Distinct aliases for autocomplete */
    distinctAliases: string[];
    /** Item name mappings for cross-store suggestions */
    itemNameMappings: ItemNameMapping[];

    // UI state
    /** Theme for styling */
    theme: 'light' | 'dark';
    /** Translation function */
    t: (key: string) => string;
    /** Currency format function */
    formatCurrency: (amount: number, currency: string) => string;
    /** Default currency code */
    currency: string;
    /** Language for translations */
    lang: Language;
    /** Store categories list */
    storeCategories: string[];
    /** Whether save is in progress */
    isSaving: boolean;
    /** Animate items on initial load */
    animateItems: boolean;
    /** Whether credit was used in session */
    creditUsedInSession: boolean;

    // ==========================================================================
    // Callback Props (Story 14c-refactor.33b, 33c)
    // Story 33c: Required callbacks now marked as required for single-spread pattern.
    // ==========================================================================

    // Transaction operations (required)
    /** Callback when transaction data changes (parent-managed state) */
    onUpdateTransaction: (transaction: Transaction) => void;
    /** Callback when user saves the transaction */
    onSave: (transaction: Transaction) => Promise<void>;
    /** Callback when user clicks back/cancel */
    onCancel: () => void;
    /** Callback when user deletes transaction (existing only) */
    onDelete?: (id: string) => void;

    // Scan handlers (required)
    /** Callback when user selects a photo */
    onPhotoSelect: (file: File) => void;
    /** Callback when user clicks process/scan button */
    onProcessScan: () => void;
    /** Callback to retry after error */
    onRetry: () => void;
    /** Callback for re-scan (existing transactions only) */
    onRescan?: () => Promise<void>;

    // Mapping callbacks (required)
    /** Save category mapping function */
    onSaveMapping: (item: string, category: StoreCategory, source?: 'user' | 'ai') => Promise<string>;
    /** Save merchant mapping function */
    onSaveMerchantMapping: (originalMerchant: string, targetMerchant: string, storeCategory?: StoreCategory) => Promise<string>;
    /** Save subcategory mapping function */
    onSaveSubcategoryMapping: (item: string, subcategory: string, source?: 'user' | 'ai') => Promise<string>;
    /** Save item name mapping function (per-store item name learning) */
    onSaveItemNameMapping: (normalizedMerchant: string, originalItemName: string, targetItemName: string, targetCategory?: ItemCategory) => Promise<string>;

    // Batch navigation (optional - context-dependent)
    /** Callback to navigate to previous receipt in batch */
    onBatchPrevious?: () => void;
    /** Callback to navigate to next receipt in batch */
    onBatchNext?: () => void;
    /** Callback when user clicks batch scan button */
    onBatchModeClick: () => void;

    // Group and edit callbacks
    /** Callback when sharedGroupIds changes */
    onGroupsChange: (groupIds: string[]) => void;
    /** Callback when user clicks Edit button in read-only mode */
    onRequestEdit: () => void;
}

/**
 * Data props returned by useTransactionEditorViewProps.
 * Excludes handler callbacks which come from ViewHandlersContext.
 */
export interface TransactionEditorDataProps {
    // Core
    transaction: Transaction | null;
    mode: 'new' | 'existing';
    readOnly: boolean;
    isOtherUserTransaction: boolean;
    ownerId?: string;
    ownerProfile?: { displayName?: string; photoURL?: string | null } | null;

    // Scan state
    scanButtonState: ScanButtonState;
    isProcessing: boolean;
    processingEta: number | null;
    scanError: string | null;
    skipScanCompleteModal: boolean;
    thumbnailUrl?: string;
    pendingImageUrl?: string;
    isRescanning: boolean;

    // UI
    theme: 'light' | 'dark';
    t: (key: string) => string;
    formatCurrency: (amount: number, currency: string) => string;
    currency: string;
    lang: Language;
    credits: UserCredits;
    storeCategories: string[];
    distinctAliases: string[];

    // Context
    batchContext: { index: number; total: number } | null;
    defaultCity: string;
    defaultCountry: string;
    isSaving: boolean;
    animateItems: boolean;
    creditUsed: boolean;

    // Cross-store suggestions
    itemNameMappings: ItemNameMapping[];

    // Shared groups
    availableGroups: GroupWithMeta[];
    groupsLoading: boolean;

    // ==========================================================================
    // Callback Props (Story 14c-refactor.33b, 33c)
    // Story 33c: Required callbacks now marked as required for single-spread pattern.
    // ==========================================================================

    // Transaction operations (required)
    /** Callback when transaction data changes (parent-managed state) */
    onUpdateTransaction: (transaction: Transaction) => void;
    /** Callback when user saves the transaction */
    onSave: (transaction: Transaction) => Promise<void>;
    /** Callback when user clicks back/cancel */
    onCancel: () => void;
    /** Callback when user deletes transaction (existing only) */
    onDelete?: (id: string) => void;

    // Scan handlers (required)
    /** Callback when user selects a photo */
    onPhotoSelect: (file: File) => void;
    /** Callback when user clicks process/scan button */
    onProcessScan: () => void;
    /** Callback to retry after error */
    onRetry: () => void;
    /** Callback for re-scan (existing transactions only) */
    onRescan?: () => Promise<void>;

    // Mapping callbacks (required)
    /** Save category mapping function */
    onSaveMapping: (item: string, category: StoreCategory, source?: 'user' | 'ai') => Promise<string>;
    /** Save merchant mapping function */
    onSaveMerchantMapping: (originalMerchant: string, targetMerchant: string, storeCategory?: StoreCategory) => Promise<string>;
    /** Save subcategory mapping function */
    onSaveSubcategoryMapping: (item: string, subcategory: string, source?: 'user' | 'ai') => Promise<string>;
    /** Save item name mapping function (per-store item name learning) */
    onSaveItemNameMapping: (normalizedMerchant: string, originalItemName: string, targetItemName: string, targetCategory?: ItemCategory) => Promise<string>;

    // Batch navigation (optional - context-dependent)
    /** Callback to navigate to previous receipt in batch */
    onBatchPrevious?: () => void;
    /** Callback to navigate to next receipt in batch */
    onBatchNext?: () => void;
    /** Callback when user clicks batch scan button */
    onBatchModeClick: () => void;

    // Group and edit callbacks
    /** Callback when sharedGroupIds changes */
    onGroupsChange: (groupIds: string[]) => void;
    /** Callback when user clicks Edit button in read-only mode */
    onRequestEdit: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Derives scanButtonState from scan phase.
 * CRITICAL: This logic MUST match App.tsx:510-520
 *
 * @param phase - Current scan phase from state machine
 * @returns ScanButtonState for TransactionEditorView UI
 *
 * @example
 * deriveScanButtonState('idle')      // → 'idle'
 * deriveScanButtonState('capturing') // → 'pending'
 * deriveScanButtonState('scanning')  // → 'scanning'
 * deriveScanButtonState('reviewing') // → 'complete'
 */
function deriveScanButtonState(phase: ScanPhase): ScanButtonState {
    switch (phase) {
        case 'idle': return 'idle';
        case 'capturing': return 'pending';
        case 'scanning': return 'scanning';
        case 'reviewing': return 'complete';
        case 'saving': return 'scanning';
        case 'error': return 'error';
        default: return 'idle';
    }
}

/**
 * Computes batch context from scan state or navigation list.
 */
function computeBatchContext(
    batchEditingIndex: number | null,
    batchReceipts: Array<{ id: string }> | null,
    transactionNavigationList: string[] | null,
    currentTransactionId: string | undefined
): { index: number; total: number } | null {
    // Priority 1: Batch editing from ScanContext
    if (batchEditingIndex !== null && batchReceipts) {
        return { index: batchEditingIndex + 1, total: batchReceipts.length };
    }

    // Priority 2: Transaction navigation list from ItemsView
    if (transactionNavigationList && currentTransactionId) {
        const index = transactionNavigationList.indexOf(currentTransactionId);
        if (index !== -1) {
            return { index: index + 1, total: transactionNavigationList.length };
        }
    }

    return null;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useTransactionEditorViewProps - Composes data props for TransactionEditorView.
 *
 * CRITICAL: This hook does NOT call other hooks internally.
 * All data comes from the options parameter.
 *
 * @param options - All data needed to compose props
 * @returns TransactionEditorDataProps - Data props for the view
 */
export function useTransactionEditorViewProps(
    options: UseTransactionEditorViewPropsOptions
): TransactionEditorDataProps {
    const {
        user,
        currentTransaction,
        transactionEditorMode,
        isViewingReadOnly,
        transactionNavigationList,
        scanState,
        isAnalyzing,
        scanError,
        skipScanCompleteModal,
        isRescanning,
        activeGroup,
        availableGroups,
        groupsLoading,
        userCredits,
        userPreferences,
        distinctAliases,
        itemNameMappings,
        theme,
        t,
        formatCurrency,
        currency,
        lang,
        storeCategories,
        isSaving,
        animateItems,
        creditUsedInSession,
        // Callbacks (Story 14c-refactor.33b)
        onUpdateTransaction,
        onSave,
        onCancel,
        onDelete,
        onPhotoSelect,
        onProcessScan,
        onRetry,
        onRescan,
        onSaveMapping,
        onSaveMerchantMapping,
        onSaveSubcategoryMapping,
        onSaveItemNameMapping,
        onBatchPrevious,
        onBatchNext,
        onBatchModeClick,
        onGroupsChange,
        onRequestEdit,
    } = options;

    // Derive scanButtonState from phase
    const scanButtonState = deriveScanButtonState(scanState.phase);

    // Compute pendingImageUrl - show during pending/scanning states
    const pendingImageUrl = useMemo(() => {
        const isPendingOrScanning = scanButtonState === 'pending' || scanButtonState === 'scanning';
        return isPendingOrScanning && scanState.images.length > 0 ? scanState.images[0] : undefined;
    }, [scanButtonState, scanState.images]);

    // Compute thumbnailUrl with fallback
    const thumbnailUrl = useMemo(() => {
        return currentTransaction?.thumbnailUrl ||
            (scanState.images.length > 0 ? scanState.images[0] : undefined);
    }, [currentTransaction?.thumbnailUrl, scanState.images]);

    // Compute batch context
    const batchContext = useMemo(() => {
        return computeBatchContext(
            scanState.batchEditingIndex,
            scanState.batchReceipts,
            transactionNavigationList,
            currentTransaction?.id
        );
    }, [
        scanState.batchEditingIndex,
        scanState.batchReceipts,
        transactionNavigationList,
        currentTransaction?.id,
    ]);

    // Determine if viewing another user's transaction
    const isOtherUserTransaction = useMemo(() => {
        return Boolean(
            currentTransaction?._ownerId &&
            currentTransaction._ownerId !== user?.uid
        );
    }, [currentTransaction?._ownerId, user?.uid]);

    // Get owner profile from active group
    const ownerProfile = useMemo(() => {
        if (!currentTransaction?._ownerId || !activeGroup?.memberProfiles) {
            return undefined;
        }
        return activeGroup.memberProfiles[currentTransaction._ownerId];
    }, [currentTransaction?._ownerId, activeGroup?.memberProfiles]);

    // Compose final props object
    return useMemo<TransactionEditorDataProps>(
        () => ({
            // Core
            transaction: currentTransaction,
            mode: transactionEditorMode,
            readOnly: isViewingReadOnly,
            isOtherUserTransaction,
            ownerId: currentTransaction?._ownerId,
            ownerProfile,

            // Scan state
            scanButtonState,
            isProcessing: isAnalyzing,
            processingEta: null, // Not currently tracked
            scanError,
            skipScanCompleteModal,
            thumbnailUrl,
            pendingImageUrl,
            isRescanning,

            // UI
            theme,
            t,
            formatCurrency,
            currency,
            lang,
            credits: userCredits,
            storeCategories,
            distinctAliases,

            // Context
            batchContext,
            defaultCity: userPreferences.defaultCity ?? '',
            defaultCountry: userPreferences.defaultCountry ?? '',
            isSaving,
            animateItems,
            creditUsed: creditUsedInSession,

            // Cross-store suggestions
            itemNameMappings,

            // Shared groups
            availableGroups,
            groupsLoading,

            // Callbacks (Story 14c-refactor.33b)
            onUpdateTransaction,
            onSave,
            onCancel,
            onDelete,
            onPhotoSelect,
            onProcessScan,
            onRetry,
            onRescan,
            onSaveMapping,
            onSaveMerchantMapping,
            onSaveSubcategoryMapping,
            onSaveItemNameMapping,
            onBatchPrevious,
            onBatchNext,
            onBatchModeClick,
            onGroupsChange,
            onRequestEdit,
        }),
        [
            // Core
            currentTransaction,
            transactionEditorMode,
            isViewingReadOnly,
            isOtherUserTransaction,
            ownerProfile,

            // Scan state
            scanButtonState,
            isAnalyzing,
            scanError,
            skipScanCompleteModal,
            thumbnailUrl,
            pendingImageUrl,
            isRescanning,

            // UI
            theme,
            t,
            formatCurrency,
            currency,
            lang,
            userCredits,
            storeCategories,
            distinctAliases,

            // Context
            batchContext,
            userPreferences.defaultCity,
            userPreferences.defaultCountry,
            isSaving,
            animateItems,
            creditUsedInSession,

            // Cross-store suggestions
            itemNameMappings,

            // Shared groups
            availableGroups,
            groupsLoading,

            // Callbacks (Story 14c-refactor.33b)
            onUpdateTransaction,
            onSave,
            onCancel,
            onDelete,
            onPhotoSelect,
            onProcessScan,
            onRetry,
            onRescan,
            onSaveMapping,
            onSaveMerchantMapping,
            onSaveSubcategoryMapping,
            onSaveItemNameMapping,
            onBatchPrevious,
            onBatchNext,
            onBatchModeClick,
            onGroupsChange,
            onRequestEdit,
        ]
    );
}
