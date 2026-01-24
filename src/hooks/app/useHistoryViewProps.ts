/**
 * Story 14c-refactor.26: useHistoryViewProps Hook
 *
 * Composes all data props needed for HistoryView from App.tsx state.
 * This hook receives ALL data as options and does NOT call other hooks internally.
 *
 * Architecture:
 * - Handlers come from ViewHandlersContext (story 14c-refactor.25)
 * - Data props are composed by this hook
 * - HistoryView receives both: spread props + useViewHandlers()
 *
 * Note: HistoryView is wrapped in HistoryFiltersProvider by renderHistoryView
 * in viewRenderers.tsx. This hook only composes props.
 *
 * @example
 * ```tsx
 * function App() {
 *   const historyProps = useHistoryViewProps({
 *     transactions: paginatedTransactions,
 *     theme,
 *     currency,
 *     // ... all other data
 *   });
 *
 *   return <HistoryView {...historyProps} />;
 * }
 * ```
 */

import { useMemo } from 'react';
import type { Transaction } from '../../types/transaction';
import type { Language } from '../../utils/translations';
import type { HistoryFilterState } from '../../contexts/HistoryFiltersContext';

// =============================================================================
// Types
// =============================================================================

/**
 * User info for header display
 */
export interface UserInfoForHistoryProps {
    displayName: string | null;
    email: string | null;
    uid: string | null;
}

/**
 * Pagination state for infinite scroll
 */
export interface PaginationState {
    /** Whether more items can be loaded */
    hasMore: boolean;
    /** Whether loading is in progress */
    isLoading: boolean;
}

/**
 * Props passed to useHistoryViewProps hook.
 * All data comes from App.tsx state - no internal hook calls.
 *
 * Story 14c-refactor.30b: Expanded to include ALL props needed by HistoryView
 */
export interface UseHistoryViewPropsOptions {
    // Core data
    /** Transactions to display (paginated) */
    transactions: Transaction[];
    /** Recent scans for display (also used as allTransactions for duplicate detection) */
    transactionsWithRecentScans: Transaction[];

    // User info
    /** User info for header */
    user: UserInfoForHistoryProps;
    /** App ID for groups support */
    appId: string;

    // UI settings
    /** Theme for styling */
    theme: 'light' | 'dark';
    /** Color theme for unified category colors (Story 14.21) */
    colorTheme: 'normal' | 'professional' | 'mono';
    /** Default currency */
    currency: string;
    /** Date format string */
    dateFormat: string;
    /** Language */
    lang: Language;
    /** Translation function */
    t: (key: string) => string;
    /** Currency formatting function */
    formatCurrency: (amount: number, currency: string) => string;
    /** Date formatting function */
    formatDate: (date: string, format: string) => string;
    /** Font color mode for category text colors (Story 14.13) */
    fontColorMode: 'colorful' | 'plain';
    /** Foreign location display format (Story 14.35b) */
    foreignLocationFormat: 'code' | 'flag';

    // Location defaults
    /** User's default city for legacy transactions */
    defaultCity: string;
    /** User's default country for legacy transactions */
    defaultCountry: string;

    // Group-related
    /** Active shared group (if in group mode) */
    activeGroup?: {
        id: string;
        memberProfiles?: Record<string, { displayName?: string; photoURL?: string }>;
    };
    /** Whether viewing shared group transactions */
    isGroupMode: boolean;
    /** Whether at listener limit (100 transactions) - indicates pagination available */
    isAtListenerLimit: boolean;

    // Filter state
    /**
     * Pending filters from analytics navigation.
     * NOTE: This is accepted for interface consistency but NOT used in composed props.
     * Filtering is handled by HistoryFiltersProvider wrapper in viewRenderers.tsx
     * which reads pendingFilters from App.tsx state directly.
     */
    pendingFilters: HistoryFilterState | null;

    // Pagination
    /** Pagination state for infinite scroll */
    pagination: PaginationState;
    /** Callback to load more transactions from Firestore */
    loadMoreTransactions: () => void;

    // Callbacks
    /** Callback to edit a transaction */
    onEditTransaction: (tx: Transaction) => void;
    /** Callback when transactions are deleted */
    onTransactionsDeleted?: (deletedIds: string[]) => void;
}

/**
 * Data props returned by useHistoryViewProps.
 * Includes both data props and callbacks (handlers from ViewHandlersContext are separate).
 *
 * Story 14c-refactor.30b: Expanded to include ALL props needed by HistoryView
 * Story 14c-refactor.30c: Added deprecated handlers for interface compatibility
 */
export interface HistoryViewDataProps {
    // Core data
    transactions: Transaction[];
    /** All transactions for duplicate detection (mapped from transactionsWithRecentScans) */
    allTransactions: Transaction[];

    // User info
    userName: string;
    userEmail: string;
    userId: string;
    appId: string;

    // UI settings
    theme: 'light' | 'dark';
    /** Color theme for unified category colors */
    colorTheme: 'normal' | 'professional' | 'mono';
    currency: string;
    /** Date format string */
    dateFormat: string;
    lang: Language;
    t: (key: string) => string;
    /** Currency formatting function */
    formatCurrency: (amount: number, currency: string) => string;
    /** Date formatting function */
    formatDate: (date: string, format: string) => string;
    /** Font color mode for category text colors */
    fontColorMode: 'colorful' | 'plain';
    /** Foreign location display format */
    foreignLocationFormat: 'code' | 'flag';

    // Location defaults
    /** User's default city for legacy transactions */
    defaultCity: string;
    /** User's default country for legacy transactions */
    defaultCountry: string;

    // Group-related
    /** Active shared group (if in group mode) */
    activeGroup?: {
        id: string;
        memberProfiles?: Record<string, { displayName?: string; photoURL?: string }>;
    };
    /** Whether at listener limit (conditional based on isGroupMode) */
    isAtListenerLimit: boolean;

    // Pagination (legacy - HistoryView handles internally now)
    historyPage: number;
    totalHistoryPages: number;

    // Infinite scroll
    hasMore: boolean;
    isLoadingMore: boolean;
    /** Callback to load more transactions (conditional based on isGroupMode) */
    onLoadMoreTransactions: () => void;

    // Callbacks
    /** Callback to edit a transaction */
    onEditTransaction: (tx: Transaction) => void;
    /** Callback when transactions are deleted */
    onTransactionsDeleted?: (deletedIds: string[]) => void;

    // Deprecated handlers (Story 14c-refactor.30c)
    // These are required by HistoryViewProps interface but marked @deprecated
    // View uses useViewHandlers() internally instead
    /**
     * @deprecated View uses useViewHandlers().navigation.navigateBack instead.
     * Returns no-op for interface compatibility.
     */
    onBack: () => void;
    /**
     * @deprecated Pagination is now handled internally by HistoryView.
     * Returns no-op for interface compatibility.
     */
    onSetHistoryPage: (page: number | ((prev: number) => number)) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useHistoryViewProps - Composes data props for HistoryView.
 *
 * CRITICAL: This hook does NOT call other hooks internally.
 * All data comes from the options parameter.
 *
 * @param options - All data needed to compose props
 * @returns HistoryViewDataProps - Data props for the view
 */
export function useHistoryViewProps(
    options: UseHistoryViewPropsOptions
): HistoryViewDataProps {
    const {
        transactions,
        transactionsWithRecentScans,
        user,
        appId,
        theme,
        colorTheme,
        currency,
        dateFormat,
        lang,
        t,
        formatCurrency,
        formatDate,
        fontColorMode,
        foreignLocationFormat,
        defaultCity,
        defaultCountry,
        activeGroup,
        isGroupMode,
        isAtListenerLimit,
        pagination,
        loadMoreTransactions,
        onEditTransaction,
        onTransactionsDeleted,
    } = options;

    return useMemo<HistoryViewDataProps>(
        () => ({
            // Core data
            transactions,
            allTransactions: transactionsWithRecentScans,

            // User info
            userName: user.displayName || '',
            userEmail: user.email || '',
            userId: user.uid || '',
            appId,

            // UI settings
            theme,
            colorTheme,
            currency,
            dateFormat,
            lang,
            t,
            formatCurrency,
            formatDate,
            fontColorMode,
            foreignLocationFormat,

            // Location defaults
            defaultCity,
            defaultCountry,

            // Group-related (conditional logic for isGroupMode)
            activeGroup,
            isAtListenerLimit: isGroupMode ? false : isAtListenerLimit,

            // Pagination (legacy - values passed but view handles internally)
            historyPage: 1,
            totalHistoryPages: 1,

            // Infinite scroll (conditional logic for isGroupMode)
            hasMore: pagination.hasMore,
            isLoadingMore: pagination.isLoading,
            onLoadMoreTransactions: isGroupMode ? () => {} : loadMoreTransactions,

            // Callbacks
            onEditTransaction,
            onTransactionsDeleted,

            // Deprecated handlers (Story 14c-refactor.30c)
            // No-ops for interface compatibility - view uses useViewHandlers() internally
            onBack: () => {},
            onSetHistoryPage: () => {},
        }),
        [
            // Core data
            transactions,
            transactionsWithRecentScans,

            // User info
            user.displayName,
            user.email,
            user.uid,
            appId,

            // UI settings
            theme,
            colorTheme,
            currency,
            dateFormat,
            lang,
            t,
            formatCurrency,
            formatDate,
            fontColorMode,
            foreignLocationFormat,

            // Location defaults
            defaultCity,
            defaultCountry,

            // Group-related
            activeGroup,
            isGroupMode,
            isAtListenerLimit,

            // Pagination
            pagination.hasMore,
            pagination.isLoading,
            loadMoreTransactions,

            // Callbacks
            onEditTransaction,
            onTransactionsDeleted,
        ]
    );
}
