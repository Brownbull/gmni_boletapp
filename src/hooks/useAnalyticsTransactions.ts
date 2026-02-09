/**
 * useAnalyticsTransactions Hook
 *
 * Unified data source for analytics components.
 * Returns personal transactions for analytics views.
 *
 * @example
 * ```tsx
 * function AnalyticsChart() {
 *   const { transactions } = useAnalyticsTransactions();
 *   return <Chart data={transactions} />;
 * }
 * ```
 */

import { useMemo } from 'react';
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
     */
    personalTransactions: Transaction[];

    /**
     * Shared group transactions (legacy - unused).
     */
    groupTransactions: Transaction[];

    /**
     * Loading state for group transactions
     */
    isGroupLoading?: boolean;

    /**
     * Spending breakdown by member ID (legacy - unused)
     */
    spendingByMember?: Map<string, number>;
}

/**
 * Result from the useAnalyticsTransactions hook
 */
export interface UseAnalyticsTransactionsResult {
    /**
     * The active transactions
     */
    transactions: Transaction[];

    /**
     * Whether currently viewing group data (always false)
     */
    isGroupMode: boolean;

    /**
     * Loading state
     */
    isLoading: boolean;

    /**
     * Group name (always undefined)
     */
    groupName?: string;

    /**
     * Group ID (always undefined)
     */
    groupId?: string;

    /**
     * Group member IDs (always undefined)
     */
    memberIds?: string[];

    /**
     * Spending breakdown by member ID (always undefined)
     */
    spendingByMember?: Map<string, number>;

    /**
     * Context label for analytics UI
     */
    contextLabel: string;

    /**
     * Group icon (always undefined)
     */
    groupIcon?: string;

    /**
     * Group color (always undefined)
     */
    groupColor?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Empty array constant to avoid creating new references */
const EMPTY_TRANSACTIONS: Transaction[] = [];

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook that provides a unified transaction source for analytics.
 * Returns personal transactions.
 *
 * @param options Configuration with personal transaction source
 * @returns Unified analytics data
 */
export function useAnalyticsTransactions(
    options: UseAnalyticsTransactionsOptions
): UseAnalyticsTransactionsResult {
    const {
        personalTransactions,
    } = options;

    // Memoize the result to avoid unnecessary re-renders
    const result = useMemo<UseAnalyticsTransactionsResult>(() => {
        return {
            transactions: personalTransactions || EMPTY_TRANSACTIONS,
            isGroupMode: false,
            isLoading: false,
            groupName: undefined,
            groupId: undefined,
            memberIds: undefined,
            spendingByMember: undefined,
            contextLabel: 'personal',
            groupIcon: undefined,
            groupColor: undefined,
        };
    }, [
        personalTransactions,
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
