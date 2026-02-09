/**
 * Story 14e-25b.2: useDashboardViewData Hook
 *
 * Composition hook that encapsulates all DashboardView data needs.
 * This hook owns data fetching, allowing DashboardView to own its data
 * without prop drilling from App.tsx.
 *
 * Architecture:
 * - Calls useAuth() for user/services
 * - Calls usePaginatedTransactions() for transaction data
 * - Calls useRecentScans() for recent scan merge
 * - Calls useUserPreferences() for user defaults
 * - Calls useTheme() for theme/locale settings (via ThemeContext)
 * - Calls useUserSharedGroups() for shared groups
 * - Provides formatters (t, formatCurrency, formatDate, getSafeDate) internally
 *
 * Pattern: Follows HistoryView (14e-25a.2a/b) and TrendsView (14e-25b.1)
 *
 * @example
 * ```tsx
 * function DashboardView({ _testOverrides }: DashboardViewProps) {
 *   const hookData = useDashboardViewData();
 *   const data = { ...hookData, ..._testOverrides };
 *   // All data comes from hook - no props needed
 * }
 * ```
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePaginatedTransactions } from '@/hooks/usePaginatedTransactions';
import { useRecentScans } from '@/hooks/useRecentScans';
import { mergeTransactionsWithRecentScans } from '@/utils/transactionMerge';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTheme } from '@/contexts/ThemeContext';
// Story 14e-25d: Direct navigation hooks (ViewHandlersContext deleted)
import { useNavigationActions } from '@/shared/stores';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';
import { formatDate as formatDateUtil } from '@/utils/date';
import { TRANSLATIONS } from '@/utils/translations';
import type { Transaction } from '@/types/transaction';
import type { Language, Theme, FontColorMode } from '@/types/settings';
import type { ThemeName } from '@/config/categoryColors';

// =============================================================================
// Types
// =============================================================================

/**
 * Shared group info for DashboardView (id + color for dynamic lookup)
 */
export interface SharedGroupForDashboard {
    id: string;
    color: string;
}

/**
 * Return type for useDashboardViewData hook.
 *
 * Story 14e-25b.2: Complete data for DashboardView:
 * - Transaction data (merged with recentScans)
 * - User info (userId, appId)
 * - Theme/locale settings
 * - User preferences (defaults)
 * - Formatters (t, formatCurrency, formatDate, getSafeDate)
 * - Shared groups
 * - Callbacks (stub with DEV warning)
 */
export interface UseDashboardViewDataReturn {
    // === Transaction Data ===
    /** Merged transactions (recent scans + paginated), deduplicated */
    transactions: Transaction[];
    /** All transactions alias (for interface compatibility) */
    allTransactions: Transaction[];
    /** Recent scans for "Últimos Escaneados" carousel */
    recentScans: Transaction[];

    // === User Info ===
    /** User ID for group operations */
    userId: string | null;
    /** App ID for Firestore paths */
    appId: string;

    // === Theme/Locale Settings ===
    /** Light or dark mode */
    theme: Theme;
    /** Color theme for category colors (Story 14.21) */
    colorTheme: ThemeName;
    /** Font color mode (colorful/plain) */
    fontColorMode: FontColorMode;
    /** Current language */
    lang: Language;
    /** Default currency */
    currency: string;
    /** Date format preference */
    dateFormat: 'LatAm' | 'US';

    // === User Preferences ===
    /** User's default country for foreign location detection */
    defaultCountry: string;
    /** Foreign location display format */
    foreignLocationFormat: 'code' | 'flag';

    // === Formatters ===
    /** Translation function */
    t: (key: string) => string;
    /** Currency formatting function */
    formatCurrency: (amount: number, currency: string) => string;
    /** Date formatting function (compatible with TransactionCard) */
    formatDate: (date: string, format: string) => string;
    /** Safe date extraction function (handles Firestore Timestamp) */
    getSafeDate: (val: any) => string;

    // === Shared Groups ===
    /** Shared groups for dynamic group color lookup */
    sharedGroups: SharedGroupForDashboard[];

    // === Callbacks (stub - override via _testOverrides) ===
    /** Create new transaction handler */
    onCreateNew: () => void;
    /** View trends handler */
    onViewTrends: (month: string | null) => void;
    /** Edit transaction handler */
    onEditTransaction: (transaction: Transaction) => void;
    /** Trigger scan handler */
    onTriggerScan: () => void;
    /** View recent scans handler */
    onViewRecentScans: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract safe date string from various input types.
 * Handles Firestore Timestamp, Date objects, and string dates.
 */
function createGetSafeDate(): (val: any) => string {
    return (val: any): string => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (val.toDate) {
            // Firestore Timestamp
            const date = val.toDate();
            return date.toISOString().split('T')[0];
        }
        if (val instanceof Date) {
            return val.toISOString().split('T')[0];
        }
        return String(val);
    };
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useDashboardViewData - Composition hook for DashboardView data.
 *
 * Story 14e-25b.2: Provides ALL data DashboardView needs.
 * Encapsulates all data fetching, settings, and formatters that were
 * previously passed as props from App.tsx.
 *
 * Data sources:
 * 1. useAuth() - user/services
 * 2. usePaginatedTransactions() - transaction data
 * 3. useRecentScans() - recent scan merge
 * 4. useTheme() - theme/locale settings
 * 5. useUserPreferences() - user defaults
 * 6. useUserSharedGroups() - shared groups
 *
 * @returns UseDashboardViewDataReturn - All data needed by DashboardView
 */
export function useDashboardViewData(): UseDashboardViewDataReturn {
    // === Auth & Services ===
    const { user, services } = useAuth();

    // === Theme/Locale Settings ===
    const {
        theme,
        colorTheme,
        fontColorMode,
        lang,
        currency,
        dateFormat,
    } = useTheme();

    // === User Preferences ===
    const { preferences } = useUserPreferences(user, services);
    const defaultCountry = preferences?.defaultCountry || '';
    const foreignLocationFormat = preferences?.foreignLocationFormat || 'code';

    // === Transaction Data ===
    const { transactions: paginatedTransactions } = usePaginatedTransactions(user, services);

    // Recent scans for merge
    const rawRecentScans = useRecentScans(user, services);

    // Merge recent scans with paginated transactions (deduplication)
    const transactionsWithRecentScans = useMemo(
        () => mergeTransactionsWithRecentScans(paginatedTransactions, rawRecentScans),
        [paginatedTransactions, rawRecentScans]
    );

    // Recent scans
    const recentScans = useMemo(() => {
        return rawRecentScans || [];
    }, [rawRecentScans]);

    // === Navigation Actions (Story 14e-25d) ===
    const { setView } = useNavigationActions();

    // === Formatters ===
    // Translation function - memoized to prevent unnecessary re-renders
    const t = useCallback(
        (key: string): string => {
            const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;
            return (translations as Record<string, string>)[key] || key;
        },
        [lang]
    );

    // Currency formatter - stable reference
    const formatCurrency = useCallback(
        (amount: number, currencyCode: string): string => {
            return formatCurrencyUtil(amount, currencyCode);
        },
        []
    );

    // Date formatter - stable reference (compatible with TransactionCard)
    const formatDate = useCallback(
        (date: string, format: string): string => {
            return formatDateUtil(date, format as 'LatAm' | 'US');
        },
        []
    );

    // Safe date extractor - stable reference
    const getSafeDate = useMemo(() => createGetSafeDate(), []);

    // === Callbacks (stub with DEV warning) ===
    // Pattern from HistoryView/TrendsView: No-op stub - App.tsx passes real callback via _testOverrides
    const onCreateNew = useCallback(() => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onCreateNew called without _testOverrides. ' +
                'Pass onCreateNew via _testOverrides prop for production use.'
            );
        }
    }, []);

    // Story 14e-25d: Navigate to TrendsView
    const onViewTrends = useCallback((_month: string | null) => {
        setView('trends');
    }, [setView]);

    const onEditTransaction = useCallback((_transaction: Transaction) => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onEditTransaction called without _testOverrides. ' +
                'Pass onEditTransaction via _testOverrides prop for production use.'
            );
        }
    }, []);

    const onTriggerScan = useCallback(() => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onTriggerScan called without _testOverrides. ' +
                'Pass onTriggerScan via _testOverrides prop for production use.'
            );
        }
    }, []);

    // Story 14e-25d: Navigate to RecentScansView
    const onViewRecentScans = useCallback(() => {
        setView('recent-scans');
    }, [setView]);

    // === Return Complete Data ===
    return {
        // Transaction data
        transactions: transactionsWithRecentScans,
        allTransactions: transactionsWithRecentScans,
        recentScans: recentScans,

        // User info
        userId: user?.uid ?? null,
        appId: services?.appId ?? '',

        // Theme/locale settings
        theme,
        colorTheme,
        fontColorMode,
        lang,
        currency: preferences?.defaultCurrency ?? currency,
        dateFormat,

        // User preferences
        defaultCountry,
        foreignLocationFormat,

        // Formatters
        t,
        formatCurrency,
        formatDate,
        getSafeDate,

        // Shared groups (empty - feature removed)
        sharedGroups: [],

        // Callbacks - stub implementation
        onCreateNew,
        onViewTrends,
        onEditTransaction,
        onTriggerScan,
        onViewRecentScans,
    };
}

// =============================================================================
// Type Export for External Use
// =============================================================================

/**
 * Type alias for DashboardView data (for _testOverrides prop typing)
 */
export type DashboardViewData = UseDashboardViewDataReturn;
