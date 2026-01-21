/**
 * Shared Group Transaction Service - STUBBED
 *
 * Story 14c-refactor.2: Stub Services
 * Epic 14c-refactor: Codebase Cleanup
 *
 * This is a STUB implementation providing only types and no-op functions.
 * All actual functionality has been removed. This file exists only to
 * satisfy imports until Story 14c-refactor.3 (Stub Hooks) completes.
 *
 * TODO: Delete this file in Story 14c-refactor.3 when hooks are stubbed.
 */

import type { Firestore } from 'firebase/firestore';
import type { Transaction } from '../types/transaction';

// ============================================================================
// Types (preserved for backwards compatibility)
// ============================================================================

/**
 * Transaction with owner ID for shared group display.
 */
export interface SharedGroupTransaction extends Transaction {
    /** User ID of the transaction owner */
    _ownerId: string;
}

/**
 * Options for delta fetch operations.
 */
export interface DeltaFetchOptions {
    since: Date;
    changedMembers: string[];
}

// ============================================================================
// Stub Functions (all return empty/default values)
// ============================================================================

/**
 * STUB: Fetch shared group transactions.
 * @returns Empty array
 */
export async function fetchSharedGroupTransactions(
    _db: Firestore,
    _appId: string,
    _groupId: string,
    _memberIds: string[],
    _options?: { startDate?: Date; endDate?: Date }
): Promise<SharedGroupTransaction[]> {
    return [];
}

/**
 * STUB: Fetch delta updates since last sync.
 * @returns Empty transactions and deletedIds
 */
export async function fetchDeltaUpdates(
    _db: Firestore,
    _appId: string,
    _groupId: string,
    _options: DeltaFetchOptions
): Promise<{
    transactions: SharedGroupTransaction[];
    deletedIds: string[];
}> {
    return { transactions: [], deletedIds: [] };
}

/**
 * STUB: Get members with updates since a given date.
 * @returns Empty array
 */
export function getChangedMembers(
    _memberUpdates: Record<string, unknown>,
    _since: Date
): string[] {
    return [];
}

/**
 * STUB: Calculate total spending from transactions.
 * @returns 0
 */
export function calculateTotalSpending(
    _transactions: SharedGroupTransaction[]
): number {
    return 0;
}

/**
 * STUB: Calculate spending breakdown by member.
 * @returns Empty map
 */
export function calculateSpendingByMember(
    _transactions: SharedGroupTransaction[]
): Map<string, number> {
    return new Map();
}

/**
 * STUB: Get default date range for queries.
 * @returns Current month range
 */
export function getDefaultDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate, endDate };
}

/**
 * STUB: Enforce maximum date range.
 * @returns Same dates passed in
 */
export function enforceMaxDateRange(
    startDate: Date,
    endDate: Date
): { startDate: Date; endDate: Date } {
    return { startDate, endDate };
}
