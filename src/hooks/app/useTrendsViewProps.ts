/**
 * Story 14c-refactor.26: useTrendsViewProps Hook
 * Story 14c-refactor.31b: Expanded to include ALL props needed by TrendsView
 *
 * Composes all props needed for TrendsView from App.tsx state.
 * This hook receives ALL data and callbacks as options and does NOT call other hooks internally.
 *
 * Architecture:
 * - Navigation handlers come from ViewHandlersContext (story 14c-refactor.25/27)
 * - Data props AND view-specific callbacks are composed by this hook
 * - TrendsView receives both: spread props + useViewHandlers()
 *
 * Note: TrendsView is wrapped in AnalyticsProvider and HistoryFiltersProvider
 * by renderTrendsView in viewRenderers.tsx. This hook only composes props.
 *
 * Callback handlers (onEditTransaction, onExporting, onUpgradeRequired) are included
 * for interface compatibility even though TrendsView currently doesn't use them
 * (they're destructured with _ prefix). This enables direct spreading.
 *
 * @example
 * ```tsx
 * function App() {
 *   const trendsProps = useTrendsViewProps({
 *     transactions: activeTransactions,
 *     theme,
 *     colorTheme,
 *     onEditTransaction: (tx) => navigateToTransactionEditor('existing', tx),
 *     onExporting: setExporting,
 *     onUpgradeRequired: () => showToast('upgradeRequired'),
 *     // ... all other data
 *   });
 *
 *   return <TrendsView {...trendsProps} />;
 * }
 * ```
 */

import { useMemo } from 'react';
import type { Transaction } from '../../types/transaction';
import type { ColorTheme, FontColorMode } from '../../types/settings';
import type { Language } from '../../utils/translations';

// =============================================================================
// Types
// =============================================================================

/**
 * Group member info for shared group analytics
 */
export interface GroupMemberInfo {
    uid: string;
    displayName?: string;
    email?: string;
}

/**
 * Spending by member data for group analytics.
 *
 * Note: This is a plain object for JSON compatibility and easier composition.
 * TrendsViewProps expects Map<string, number>, so conversion happens at render:
 * `spendingByMember={new Map(Object.entries(trendsViewDataProps.spendingByMember))}`
 */
export interface SpendingByMember {
    [userId: string]: number;
}

/**
 * User info for header display
 */
export interface UserInfoForProps {
    displayName: string | null;
    email: string | null;
    uid: string | null;
}

/**
 * Props passed to useTrendsViewProps hook.
 * All data and callbacks come from App.tsx state - no internal hook calls.
 */
export interface UseTrendsViewPropsOptions {
    // Core data
    /** Transactions to analyze (already filtered for view mode) */
    transactions: Transaction[];

    // User info
    /** User info for header */
    user: UserInfoForProps;
    /** App ID for groups support */
    appId: string;

    // UI settings
    /** Theme for styling */
    theme: 'light' | 'dark';
    /** Color theme for category colors */
    colorTheme: ColorTheme;
    /** Default currency */
    currency: string;
    /** Language/locale */
    locale: Language;
    /** Translation function */
    t: (key: string) => string;
    /** Font color mode for category text */
    fontColorMode: FontColorMode;
    /** Export in progress state */
    exporting: boolean;

    // Initial state for navigation restoration
    /** Initial distribution view (treemap or donut) */
    initialDistributionView?: 'treemap' | 'donut';

    // Shared groups
    /** Whether in group mode */
    isGroupMode: boolean;
    /** Active group name */
    groupName?: string;
    /** Group members for analytics */
    groupMembers: GroupMemberInfo[];
    /** Spending breakdown by member */
    spendingByMember: SpendingByMember;

    // Story 14c-refactor.31b: Callback handlers for interface compatibility
    // These are kept for backwards compatibility even though TrendsView doesn't use them
    /** Callback to edit a transaction (currently unused by TrendsView) */
    onEditTransaction: (transaction: Transaction) => void;
    /** Callback to set exporting state (currently unused by TrendsView) */
    onExporting?: (value: boolean) => void;
    /** Callback for premium upgrade prompt (currently unused by TrendsView) */
    onUpgradeRequired?: () => void;
}

/**
 * Props returned by useTrendsViewProps.
 * Includes all data props AND callback handlers for TrendsViewProps interface compatibility.
 * Navigation handlers (onBack, onNavigateToView, onNavigateToHistory) come from ViewHandlersContext.
 */
export interface TrendsViewDataProps {
    // Core data
    transactions: Transaction[];

    // User info
    userName: string;
    userEmail: string;
    userId: string;
    appId: string;

    // UI settings
    theme: 'light' | 'dark';
    colorTheme: ColorTheme;
    currency: string;
    locale: Language;
    t: (key: string) => string;
    fontColorMode: FontColorMode;
    exporting: boolean;

    // Initial state
    initialDistributionView?: 'treemap' | 'donut';

    // Shared groups
    isGroupMode: boolean;
    groupName?: string;
    groupMembers: GroupMemberInfo[];
    spendingByMember: SpendingByMember;

    // Story 14c-refactor.31b: Callback handlers for interface compatibility
    /** Callback to edit a transaction (currently unused by TrendsView) */
    onEditTransaction: (transaction: Transaction) => void;
    /** Callback to set exporting state (currently unused by TrendsView) */
    onExporting?: (value: boolean) => void;
    /** Callback for premium upgrade prompt (currently unused by TrendsView) */
    onUpgradeRequired?: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useTrendsViewProps - Composes all props for TrendsView.
 *
 * CRITICAL: This hook does NOT call other hooks internally.
 * All data and callbacks come from the options parameter.
 *
 * @param options - All data and callbacks needed to compose props
 * @returns TrendsViewDataProps - All props for the view (data + callbacks)
 */
export function useTrendsViewProps(
    options: UseTrendsViewPropsOptions
): TrendsViewDataProps {
    const {
        transactions,
        user,
        appId,
        theme,
        colorTheme,
        currency,
        locale,
        t,
        fontColorMode,
        exporting,
        initialDistributionView,
        isGroupMode,
        groupName,
        groupMembers,
        spendingByMember,
        // Story 14c-refactor.31b: Callback handlers
        onEditTransaction,
        onExporting,
        onUpgradeRequired,
    } = options;

    return useMemo<TrendsViewDataProps>(
        () => ({
            // Core data
            transactions,

            // User info
            userName: user.displayName || '',
            userEmail: user.email || '',
            userId: user.uid || '',
            appId,

            // UI settings
            theme,
            colorTheme,
            currency,
            locale,
            t,
            fontColorMode,
            exporting,

            // Initial state
            initialDistributionView,

            // Shared groups
            isGroupMode,
            groupName,
            groupMembers,
            spendingByMember,

            // Story 14c-refactor.31b: Callback handlers
            onEditTransaction,
            onExporting,
            onUpgradeRequired,
        }),
        [
            // Core data
            transactions,

            // User info
            user.displayName,
            user.email,
            user.uid,
            appId,

            // UI settings
            theme,
            colorTheme,
            currency,
            locale,
            t,
            fontColorMode,
            exporting,

            // Initial state
            initialDistributionView,

            // Shared groups
            isGroupMode,
            groupName,
            groupMembers,
            spendingByMember,

            // Story 14c-refactor.31b: Callback handlers
            onEditTransaction,
            onExporting,
            onUpgradeRequired,
        ]
    );
}
