/**
 * Story 14c-refactor.34a: useDashboardViewProps Hook
 *
 * Composes all data props needed for DashboardView from App.tsx state.
 * This hook receives ALL data as options and does NOT call other hooks internally.
 *
 * Architecture:
 * - Handlers come from ViewHandlersContext (story 14c-refactor.25)
 * - Data props are composed by this hook
 * - DashboardView receives both: spread props + useViewHandlers()
 *
 * Note: DashboardView is wrapped in HistoryFiltersProvider by App.tsx
 * (Story 10a.1). This hook only composes props.
 *
 * @example
 * ```tsx
 * function App() {
 *   const dashboardProps = useDashboardViewProps({
 *     transactions: activeRecentTransactions,
 *     theme,
 *     currency,
 *     // ... all other data
 *   });
 *
 *   return (
 *     <HistoryFiltersProvider>
 *       <DashboardView {...dashboardProps} />
 *     </HistoryFiltersProvider>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import type { Language } from '../../utils/translations';
import type { ThemeName } from '../../config/categoryColors';

// =============================================================================
// Types
// =============================================================================

/**
 * Transaction interface for DashboardView
 * Matches the internal Transaction type in DashboardView.tsx
 */
export interface DashboardTransaction {
    id: string;
    merchant: string;
    alias?: string;
    date: string;
    total: number;
    category: string;
    imageUrls?: string[];
    thumbnailUrl?: string;
    items?: Array<{
        name: string;
        price: number;
        category?: string;
        subcategory?: string;
    }>;
    time?: string;
    city?: string;
    country?: string;
    currency?: string;
    createdAt?: any;
    sharedGroupIds?: string[];
}

/**
 * Shared group info for dynamic color lookup
 */
export interface SharedGroupForDashboard {
    id: string;
    color: string;
}

/**
 * Props passed to useDashboardViewProps hook.
 * All data comes from App.tsx state - no internal hook calls.
 */
export interface UseDashboardViewPropsOptions {
    // Core data
    /** Transactions to display (recent/paginated) */
    transactions: DashboardTransaction[];
    /** All transactions for display (for full paginated list) */
    allTransactions: DashboardTransaction[];
    /** Recent scans for "Últimos Escaneados" carousel */
    recentScans: DashboardTransaction[];

    // User info
    /** User ID for group operations */
    userId: string | null;
    /** App ID for Firestore path */
    appId: string;

    // UI settings
    /** Theme for styling */
    theme: string;
    /** Color theme for unified category colors (Story 14.21) */
    colorTheme: ThemeName;
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
    /** Safe date extraction function */
    getSafeDate: (val: any) => string;
    /** Font color mode for category text colors (Story 14.13) */
    fontColorMode: 'colorful' | 'plain';

    // Location defaults
    /** User's default country for foreign location detection (Story 14.35b) */
    defaultCountry: string;
    /** Foreign location display format (Story 14.35b) */
    foreignLocationFormat: 'code' | 'flag';

    // Group-related
    /** Shared groups for dynamic group color lookup */
    sharedGroups?: SharedGroupForDashboard[];

    // Callbacks
    /** Create new transaction handler */
    onCreateNew: () => void;
    /** View trends handler */
    onViewTrends: (month: string | null) => void;
    /** Edit transaction handler */
    onEditTransaction: (transaction: DashboardTransaction) => void;
    /** Trigger scan handler */
    onTriggerScan: () => void;
    /** View recent scans handler (Story 14.31) */
    onViewRecentScans: () => void;
    /** Callback when transactions are deleted */
    onTransactionsDeleted?: (deletedIds: string[]) => void;
}

/**
 * Data props returned by useDashboardViewProps.
 * Matches DashboardViewProps interface from DashboardView.tsx
 */
export interface DashboardViewDataProps {
    // Core data
    transactions: DashboardTransaction[];
    allTransactions: DashboardTransaction[];
    recentScans: DashboardTransaction[];

    // UI settings
    t: (key: string) => string;
    currency: string;
    dateFormat: string;
    theme: string;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;
    getSafeDate: (val: any) => string;
    lang: Language;
    colorTheme: ThemeName;
    fontColorMode: 'colorful' | 'plain';

    // User info
    userId: string | null;
    appId: string;

    // Location defaults
    defaultCountry: string;
    foreignLocationFormat: 'code' | 'flag';

    // Group-related
    sharedGroups?: SharedGroupForDashboard[];

    // Callbacks
    onCreateNew: () => void;
    onViewTrends: (month: string | null) => void;
    onEditTransaction: (transaction: DashboardTransaction) => void;
    onTriggerScan: () => void;
    onViewRecentScans: () => void;
    onTransactionsDeleted?: (deletedIds: string[]) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useDashboardViewProps - Composes data props for DashboardView.
 *
 * CRITICAL: This hook does NOT call other hooks internally.
 * All data comes from the options parameter.
 *
 * @param options - All data needed to compose props
 * @returns DashboardViewDataProps - Data props for the view
 */
export function useDashboardViewProps(
    options: UseDashboardViewPropsOptions
): DashboardViewDataProps {
    const {
        transactions,
        allTransactions,
        recentScans,
        userId,
        appId,
        theme,
        colorTheme,
        currency,
        dateFormat,
        lang,
        t,
        formatCurrency,
        formatDate,
        getSafeDate,
        fontColorMode,
        defaultCountry,
        foreignLocationFormat,
        sharedGroups,
        onCreateNew,
        onViewTrends,
        onEditTransaction,
        onTriggerScan,
        onViewRecentScans,
        onTransactionsDeleted,
    } = options;

    return useMemo<DashboardViewDataProps>(
        () => ({
            // Core data
            transactions,
            allTransactions,
            recentScans,

            // UI settings
            t,
            currency,
            dateFormat,
            theme,
            formatCurrency,
            formatDate,
            getSafeDate,
            lang,
            colorTheme,
            fontColorMode,

            // User info
            userId,
            appId,

            // Location defaults
            defaultCountry,
            foreignLocationFormat,

            // Group-related
            sharedGroups,

            // Callbacks
            onCreateNew,
            onViewTrends,
            onEditTransaction,
            onTriggerScan,
            onViewRecentScans,
            onTransactionsDeleted,
        }),
        [
            // Core data
            transactions,
            allTransactions,
            recentScans,

            // UI settings
            t,
            currency,
            dateFormat,
            theme,
            formatCurrency,
            formatDate,
            getSafeDate,
            lang,
            colorTheme,
            fontColorMode,

            // User info
            userId,
            appId,

            // Location defaults
            defaultCountry,
            foreignLocationFormat,

            // Group-related
            sharedGroups,

            // Callbacks
            onCreateNew,
            onViewTrends,
            onEditTransaction,
            onTriggerScan,
            onViewRecentScans,
            onTransactionsDeleted,
        ]
    );
}
