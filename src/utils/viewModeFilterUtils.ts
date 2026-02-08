/**
 * View Mode Filtering Utilities
 *
 * Story 14d-v2-1-10d: View Mode Filtering
 *
 * Client-side filtering for view mode (Personal vs Group).
 * Follows the soft-delete pattern: filter after normalization.
 *
 * Architecture Pattern (from 04-architecture.md):
 * This utility provides a pure filtering function that operates on
 * normalized transaction arrays, similar to how isDeleted() filters
 * soft-deleted transactions in firestore.ts.
 */

import type { Transaction } from '../types/transaction';
import type { ViewMode } from '@/shared/stores/useViewModeStore';

export type { ViewMode };

/**
 * Check if a sharedGroupId represents a "falsy" or empty group assignment.
 * A transaction is considered personal if sharedGroupId is:
 * - null
 * - undefined
 * - empty string
 *
 * @param sharedGroupId - The group ID to check
 * @returns true if the sharedGroupId is falsy/empty
 */
function isPersonalTransaction(sharedGroupId: string | null | undefined): boolean {
    return !sharedGroupId;
}

/**
 * Filter transactions based on view mode.
 *
 * Personal mode: Include transactions without sharedGroupId (personal transactions)
 * Group mode: Include only transactions with matching sharedGroupId
 *
 * This function follows the client-side filtering pattern used throughout
 * the codebase (e.g., soft-delete filtering in firestore.ts).
 *
 * @param transactions - All transactions to filter
 * @param mode - Current view mode ('personal' | 'group')
 * @param groupId - Selected group ID (only used in group mode)
 * @returns Filtered transactions for the current view mode
 *
 * @example
 * ```typescript
 * // Personal mode: Get transactions without a group
 * const personal = filterTransactionsByViewMode(transactions, 'personal', null);
 *
 * // Group mode: Get transactions for a specific group
 * const grouped = filterTransactionsByViewMode(transactions, 'group', 'group-123');
 * ```
 */
export function filterTransactionsByViewMode(
    transactions: Transaction[],
    mode: ViewMode,
    groupId: string | null
): Transaction[] {
    if (mode === 'personal') {
        // Personal mode: include transactions without sharedGroupId
        return transactions.filter(tx => isPersonalTransaction(tx.sharedGroupId));
    }

    // Group mode: include only transactions matching the specified groupId
    // If groupId is null or empty, return empty array (no valid group selected)
    if (!groupId) {
        return [];
    }

    return transactions.filter(tx => tx.sharedGroupId === groupId);
}
