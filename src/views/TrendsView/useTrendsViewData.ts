/**
 * Story 14e-25b.1: useTrendsViewData Hook
 *
 * Composition hook that encapsulates all TrendsView data needs.
 * This hook owns data fetching, allowing TrendsView to own its data
 * without prop drilling from App.tsx.
 *
 * Architecture:
 * - Calls useAuth() for user/services
 * - Calls useTransactions() for transaction data
 * - Calls useUserPreferences() for user defaults
 * - Calls useTheme() for theme/locale settings (via ThemeContext)
 * - Gets analyticsInitialState from useNavigationStore()
 * - Provides formatters (t) internally
 *
 * Note: Theme settings come from useTheme() context (ThemeContext)
 *
 * @example
 * ```tsx
 * function TrendsView() {
 *   const data = useTrendsViewData();
 *   // All data comes from hook - no props needed
 * }
 * ```
 */

import { useMemo, useCallback } from 'react';
import { getFirestore } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTheme } from '@/contexts/ThemeContext';
// Story 14d-v2-0: ViewMode migrated from Context to Zustand store
import { useViewMode } from '@/shared/stores/useViewModeStore';
import { useUserSharedGroups } from '@/hooks/useUserSharedGroups';
import { useAnalyticsInitialState, useNavigationStore } from '@/shared/stores/useNavigationStore';
import { TRANSLATIONS } from '@/utils/translations';
// Story 14d-v2-1-10d: View mode filtering utility
import { filterTransactionsByViewMode } from '@/utils/viewModeFilterUtils';
import type { Transaction } from '@/types/transaction';
import type { Language, Theme, ColorTheme, FontColorMode } from '@/types/settings';
import type { AnalyticsNavigationState } from '@/types/analytics';

// =============================================================================
// Types
// =============================================================================

/**
 * User info subset for TrendsView display
 */
export interface UserInfo {
    uid: string | null;
    displayName: string | null;
    email: string | null;
}

/**
 * Group member info for shared group analytics
 */
export interface GroupMemberInfo {
    uid: string;
    displayName?: string;
    email?: string;
    avatarColor?: string;
}

/**
 * Active group info for group mode display
 */
export interface ActiveGroupInfo {
    id: string;
    name?: string;
    memberProfiles?: Record<string, { displayName?: string; email?: string; photoURL?: string }>;
}

/**
 * Return type for useTrendsViewData hook.
 *
 * Story 14e-25b.1: Complete data for TrendsView:
 * - Transaction data
 * - User info and app ID
 * - Theme/locale settings
 * - User preferences (defaults)
 * - Translation function
 * - Group mode state
 * - Analytics initial state
 */
export interface UseTrendsViewDataReturn {
    // === Transaction Data ===
    /** All transactions for analytics */
    transactions: Transaction[];

    // === User Info ===
    /** User info for header display */
    user: UserInfo;
    /** User name for header */
    userName: string;
    /** User email for header */
    userEmail: string;
    /** User ID for groups */
    userId: string;
    /** App ID for Firestore paths */
    appId: string;

    // === Theme/Locale Settings ===
    /** Light or dark mode */
    theme: Theme;
    /** Color theme for category colors */
    colorTheme: ColorTheme;
    /** Font color mode (colorful/plain) */
    fontColorMode: FontColorMode;
    /** Current language/locale */
    lang: Language;
    /** locale alias for TrendsView compatibility */
    locale: Language;
    /** Default currency */
    currency: string;

    // === Translation ===
    /** Translation function */
    t: (key: string) => string;

    // === Export State (defaults for interface compatibility) ===
    /** Whether export is in progress (always false - managed elsewhere if needed) */
    exporting: boolean;

    // === Navigation State ===
    /** Initial distribution view for back navigation */
    initialDistributionView: 'treemap' | 'donut' | undefined;
    /** Analytics initial state for drill-down restoration */
    analyticsInitialState: AnalyticsNavigationState | null;

    // === Group Mode ===
    /** Whether viewing shared group transactions */
    isGroupMode: boolean;
    /** Active group name */
    groupName: string | undefined;
    /** Group members for analytics */
    groupMembers: GroupMemberInfo[];
    /** Spending breakdown by member */
    spendingByMember: Map<string, number>;

    // === Callbacks ===
    /**
     * Callback to edit a transaction.
     * In production, passed via __testData from App.tsx to coordinate with
     * setCurrentTransaction and navigation. Default stub just logs.
     */
    onEditTransaction: (transaction: Transaction) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useTrendsViewData - Composition hook for TrendsView data.
 *
 * Story 14e-25b.1: Provides ALL data TrendsView needs.
 * Encapsulates all data fetching, settings, and formatters that were
 * previously passed as props from App.tsx.
 *
 * Data sources:
 * 1. useAuth() - user/services
 * 2. useTransactions() - transaction data
 * 3. useTheme() - theme/locale settings
 * 4. useUserPreferences() - user defaults
 * 5. useViewMode() - group mode state
 * 6. useUserSharedGroups() - active group info
 * 7. Navigation store - analytics initial state
 *
 * @returns UseTrendsViewDataReturn - All data needed by TrendsView
 */
export function useTrendsViewData(): UseTrendsViewDataReturn {
    // === Auth & Services ===
    const { user, services } = useAuth();

    // === Transaction Data ===
    const rawTransactions = useTransactions(user, services);

    // === Theme/Locale Settings ===
    const {
        theme,
        colorTheme,
        fontColorMode,
        lang,
        currency,
    } = useTheme();

    // === User Preferences ===
    const { preferences } = useUserPreferences(user, services);

    // === Group Mode ===
    const { mode: viewMode, group: viewModeGroup } = useViewMode();
    const db = getFirestore();
    const { groups: sharedGroups } = useUserSharedGroups(db, user?.uid);
    const isGroupMode = viewMode === 'group' && !!viewModeGroup;

    // Compose active group info for group mode display
    const activeGroup: ActiveGroupInfo | null = useMemo(() => {
        if (!isGroupMode || !viewModeGroup) return null;
        // Find the group in sharedGroups to get member profiles
        const group = sharedGroups.find((g) => g.id === viewModeGroup.id);
        return {
            id: viewModeGroup.id ?? '',
            name: viewModeGroup.name,
            memberProfiles: group?.memberProfiles,
        };
    }, [isGroupMode, viewModeGroup, sharedGroups]);

    // Compose group members for TrendsView
    const groupMembers: GroupMemberInfo[] = useMemo(() => {
        if (!activeGroup?.memberProfiles) return [];
        return Object.entries(activeGroup.memberProfiles).map(([uid, profile]) => ({
            uid,
            displayName: profile.displayName,
            email: profile.email,
        }));
    }, [activeGroup?.memberProfiles]);

    // === Navigation Store ===
    const analyticsInitialState = useAnalyticsInitialState();
    const pendingDistributionView = useNavigationStore((s) => s.pendingDistributionView);

    // === User Info ===
    const userInfo: UserInfo = useMemo(
        () => ({
            uid: user?.uid ?? null,
            displayName: user?.displayName ?? null,
            email: user?.email ?? null,
        }),
        [user?.uid, user?.displayName, user?.email]
    );

    // === Translation Function ===
    const t = useCallback(
        (key: string): string => {
            const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;
            return (translations as Record<string, string>)[key] || key;
        },
        [lang]
    );

    // === Spending by Member (placeholder - computed elsewhere for real group data) ===
    // Story 14e-25b.1: Empty map as default - real implementation would compute from shared transactions
    const spendingByMember = useMemo(() => new Map<string, number>(), []);

    // Story 14d-v2-1-10d: Filter transactions by view mode (personal vs group)
    const transactions = useMemo(() => {
        return filterTransactionsByViewMode(
            rawTransactions,
            viewMode,
            viewModeGroup?.id ?? null
        );
    }, [rawTransactions, viewMode, viewModeGroup?.id]);

    // === Return Complete Data ===
    return {
        // Transaction data - Story 14d-v2-1-10d: Filtered transactions
        transactions,

        // User info
        user: userInfo,
        userName: user?.displayName ?? '',
        userEmail: user?.email ?? '',
        userId: user?.uid ?? '',
        appId: services?.appId ?? '',

        // Theme/locale settings
        theme,
        colorTheme,
        fontColorMode,
        lang,
        locale: lang, // Alias for TrendsView compatibility
        currency: preferences?.defaultCurrency ?? currency,

        // Translation
        t,

        // Export state (default)
        exporting: false,

        // Navigation state
        initialDistributionView: pendingDistributionView ?? undefined,
        analyticsInitialState,

        // Group mode
        isGroupMode,
        groupName: activeGroup?.name,
        groupMembers,
        spendingByMember,

        // Callbacks - stub implementation, override via __testData in production
        // Story 14e-25b.1: No-op stub - App.tsx passes real callback via __testData
        onEditTransaction: (_transaction: Transaction) => {
            // No-op: In production, App.tsx passes the real callback via __testData
            // to coordinate with setCurrentTransaction and navigation state
            if (import.meta.env.DEV) {
                console.warn(
                    '[useTrendsViewData] onEditTransaction called without __testData. ' +
                    'Pass onEditTransaction via __testData prop for production use.'
                );
            }
        },
    };
}

// =============================================================================
// Type Export for External Use
// =============================================================================

/**
 * Type alias for TrendsView data (for __testData prop typing)
 */
export type TrendsViewData = UseTrendsViewDataReturn;
