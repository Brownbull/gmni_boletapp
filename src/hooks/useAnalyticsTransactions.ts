/**
 * useAnalyticsTransactions Hook
 *
 * Epic 14d-v2: Shared Groups v2 (Household Sharing)
 *
 * Unified data source for analytics components that automatically provides
 * either personal transactions or shared group transactions based on the
 * current view mode state (useViewModeStore Zustand store).
 *
 * Architecture:
 * - In personal mode: Returns user's personal transactions
 * - In group mode: Returns shared group transactions from all members
 * - Provides isGroupMode flag for UI adjustments
 * - Includes member data for contribution breakdowns
 *
 * This hook abstracts away the data source switching logic, allowing analytics
 * components to receive transactions without knowing whether they're viewing
 * personal or group data.
 *
 * @example
 * ```tsx
 * function AnalyticsChart() {
 *   const {
 *     transactions,
 *     isGroupMode,
 *     groupName,
 *     members,
 *     spendingByMember,
 *   } = useAnalyticsTransactions();
 *
 *   return (
 *     <div>
 *       <h2>{isGroupMode ? groupName : 'Your Spending'}</h2>
 *       <Chart data={transactions} />
 *       {isGroupMode && <MemberBreakdown members={members} />}
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
// Story 14d-v2-0: ViewMode migrated from Context to Zustand store
import { useViewMode } from '@/shared/stores/useViewModeStore';
import type { Transaction } from '../types/transaction';

// ============================================================================
// Local Types
// ============================================================================

/**
 * Member data structure for analytics contribution calculations.
 * Combines member ID with profile information.
 */
export interface AnalyticsMember {
    /** Member's user ID */
    uid: string;
    /** Member's display name */
    displayName?: string;
    /** Member's email */
    email?: string;
    /** Member's avatar color */
    avatarColor?: string;
    /** Join timestamp */
    joinedAt?: number;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the useAnalyticsTransactions hook
 */
export interface UseAnalyticsTransactionsOptions {
    /**
     * Personal transactions (from parent/App.tsx).
     * Used when in personal mode.
     */
    personalTransactions: Transaction[];

    /**
     * Shared group transactions (from useSharedGroupTransactions).
     * Used when in group mode.
     */
    groupTransactions: Transaction[];

    /**
     * Loading state for group transactions
     */
    isGroupLoading?: boolean;

    /**
     * Spending breakdown by member ID (from useSharedGroupTransactions)
     */
    spendingByMember?: Map<string, number>;
}

/**
 * Result from the useAnalyticsTransactions hook
 */
export interface UseAnalyticsTransactionsResult {
    /**
     * The active transactions (either personal or group based on view mode)
     */
    transactions: Transaction[];

    /**
     * Whether currently viewing group data
     */
    isGroupMode: boolean;

    /**
     * Loading state (only true for group mode initial load)
     */
    isLoading: boolean;

    /**
     * Group name (if in group mode)
     */
    groupName?: string;

    /**
     * Group ID (if in group mode)
     */
    groupId?: string;

    /**
     * Group member IDs (if in group mode)
     */
    memberIds?: string[];

    /**
     * Spending breakdown by member ID (if in group mode)
     */
    spendingByMember?: Map<string, number>;

    /**
     * Context label for analytics UI (e.g., "Your Analytics" or "Family Group")
     */
    contextLabel: string;

    /**
     * Group icon (if in group mode)
     */
    groupIcon?: string;

    /**
     * Group color (if in group mode)
     */
    groupColor?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Empty array constant to avoid creating new references */
const EMPTY_TRANSACTIONS: Transaction[] = [];
const EMPTY_MEMBER_IDS: string[] = [];
const EMPTY_SPENDING_MAP = new Map<string, number>();

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook that provides a unified transaction source for analytics.
 * Automatically switches between personal and group transactions
 * based on ViewModeContext.
 *
 * @param options Configuration with personal and group transaction sources
 * @returns Unified analytics data with mode indicators
 */
export function useAnalyticsTransactions(
    options: UseAnalyticsTransactionsOptions
): UseAnalyticsTransactionsResult {
    const {
        personalTransactions,
        groupTransactions,
        isGroupLoading = false,
        spendingByMember,
    } = options;

    // Get view mode context
    const { groupId, group, isGroupMode } = useViewMode();

    // Memoize the result to avoid unnecessary re-renders
    const result = useMemo<UseAnalyticsTransactionsResult>(() => {
        if (isGroupMode && groupId) {
            // Group mode: use shared group transactions
            return {
                transactions: groupTransactions || EMPTY_TRANSACTIONS,
                isGroupMode: true,
                isLoading: isGroupLoading,
                groupName: group?.name,
                groupId,
                memberIds: group?.members ?? EMPTY_MEMBER_IDS,
                spendingByMember: spendingByMember ?? EMPTY_SPENDING_MAP,
                contextLabel: group?.name || 'Shared Group',
                groupIcon: group?.icon,
                groupColor: group?.color,
            };
        }

        // Personal mode: use personal transactions
        return {
            transactions: personalTransactions || EMPTY_TRANSACTIONS,
            isGroupMode: false,
            isLoading: false,
            groupName: undefined,
            groupId: undefined,
            memberIds: undefined,
            spendingByMember: undefined,
            contextLabel: 'personal', // Translation key
            groupIcon: undefined,
            groupColor: undefined,
        };
    }, [
        isGroupMode,
        groupId,
        group?.name,
        group?.members,
        group?.icon,
        group?.color,
        groupTransactions,
        personalTransactions,
        isGroupLoading,
        spendingByMember,
    ]);

    return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate member contribution statistics from transactions.
 * Useful for MemberContributionChart and analytics breakdowns.
 *
 * @param transactions Array of transactions with _ownerId set
 * @param members Array of group members
 * @returns Array of member contributions sorted by total (highest first)
 */
export interface MemberContribution {
    /** Member's user ID */
    memberId: string;
    /** Member's display name */
    memberName: string;
    /** Member's avatar color */
    avatarColor: string;
    /** Total spending amount */
    total: number;
    /** Percentage of group total */
    percentage: number;
    /** Number of transactions */
    transactionCount: number;
}

export function calculateMemberContributions(
    transactions: Transaction[],
    members: AnalyticsMember[]
): MemberContribution[] {
    // Group transactions by owner
    const byMember = new Map<string, { total: number; count: number }>();

    for (const tx of transactions) {
        const ownerId = tx._ownerId || 'unknown';
        const existing = byMember.get(ownerId) || { total: 0, count: 0 };
        byMember.set(ownerId, {
            total: existing.total + (tx.total || 0),
            count: existing.count + 1,
        });
    }

    // Calculate grand total
    const grandTotal = Array.from(byMember.values()).reduce(
        (sum, { total }) => sum + total,
        0
    );

    // Build contribution array
    const contributions: MemberContribution[] = members.map((member) => {
        const stats = byMember.get(member.uid) || { total: 0, count: 0 };
        return {
            memberId: member.uid,
            memberName: member.displayName || member.email?.split('@')[0] || 'Member',
            avatarColor: member.avatarColor || '#6B7280',
            total: stats.total,
            percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0,
            transactionCount: stats.count,
        };
    });

    // Sort by total spending (highest first)
    return contributions.sort((a, b) => b.total - a.total);
}

/**
 * Aggregate category data including per-member breakdown.
 * Extends standard category aggregation with member attribution.
 *
 * @param transactions Array of transactions
 * @returns Map of category to { total, count, byMember }
 */
export interface CategoryWithMemberBreakdown {
    /** Category name */
    category: string;
    /** Total spending in this category */
    total: number;
    /** Transaction count */
    count: number;
    /** Breakdown by member ID */
    byMember: Map<string, { total: number; count: number }>;
}

export function aggregateCategoriesWithMembers(
    transactions: Transaction[]
): Map<string, CategoryWithMemberBreakdown> {
    const categories = new Map<string, CategoryWithMemberBreakdown>();

    for (const tx of transactions) {
        const category = tx.category || 'Other';
        const ownerId = tx._ownerId || 'unknown';

        let catData = categories.get(category);
        if (!catData) {
            catData = {
                category,
                total: 0,
                count: 0,
                byMember: new Map(),
            };
            categories.set(category, catData);
        }

        // Update category totals
        catData.total += tx.total || 0;
        catData.count += 1;

        // Update member breakdown within category
        const memberStats = catData.byMember.get(ownerId) || { total: 0, count: 0 };
        catData.byMember.set(ownerId, {
            total: memberStats.total + (tx.total || 0),
            count: memberStats.count + 1,
        });
    }

    return categories;
}
