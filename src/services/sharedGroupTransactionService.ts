/**
 * Shared Group Transaction Service
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Multi-member query and caching service for shared group transactions.
 *
 * Architecture (Updated 2026-01-17):
 * - PRIMARY: Cloud Function with server-side membership validation
 * - FALLBACK: Per-member queries (used in emulator or if CF fails)
 *
 * Security:
 * - Cloud Function validates user is member of group before querying
 * - Eliminates UUID-obscurity vulnerability in collection group queries
 * - See: functions/src/getSharedGroupTransactions.ts
 *
 * @example
 * ```typescript
 * // Fetch all shared group transactions (uses Cloud Function)
 * const transactions = await fetchSharedGroupTransactions(
 *   db,
 *   appId,
 *   groupId,
 *   ['user1', 'user2', 'user3'],
 *   { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31') }
 * );
 * ```
 */

import {
    collection,
    collectionGroup,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Firestore,
    Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';
import type { Transaction } from '../types/transaction';

// ============================================================================
// Cloud Function Client
// ============================================================================

// Initialize Firebase Functions
const functions = getFunctions(app);

// Connect to Functions emulator in development mode
// NOTE: Disabled due to CORS issues with onCall functions in emulator
// To test with emulator, uncomment the line below
// if (import.meta.env.DEV) {
//     connectFunctionsEmulator(functions, 'localhost', 5001);
// }

/**
 * Request type for getSharedGroupTransactions Cloud Function
 */
interface GetSharedGroupTransactionsRequest {
    groupId: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}

/**
 * Whether to use Cloud Function for queries.
 * Set to false to use direct Firestore queries (legacy behavior).
 */
const USE_CLOUD_FUNCTION = true;

// ============================================================================
// Types
// ============================================================================

/**
 * Options for fetching shared group transactions.
 */
export interface FetchSharedGroupTransactionsOptions {
    /** Start date for date range filter (inclusive) */
    startDate?: Date;
    /** End date for date range filter (inclusive) */
    endDate?: Date;
    /** Maximum transactions per member (default: 100) */
    limitPerMember?: number;
}

/**
 * Extended transaction with owner info for shared group display.
 * The _ownerId field is added client-side to track which member owns each transaction.
 */
export interface SharedGroupTransaction extends Transaction {
    /** User ID of the transaction owner (added by client during merge) */
    _ownerId: string;
}

/**
 * Options for delta sync fetching.
 */
export interface FetchDeltaOptions {
    /** Timestamp to fetch updates after */
    since: Date;
    /** Member IDs with changes since last sync */
    changedMembers: string[];
}

/**
 * Result of a delta sync fetch.
 */
export interface DeltaFetchResult {
    /** Updated/new transactions */
    transactions: SharedGroupTransaction[];
    /** Deleted transaction IDs (soft-deleted) */
    deletedIds: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Default limit per member query */
const DEFAULT_LIMIT_PER_MEMBER = 100;

/** Maximum date range in months */
const MAX_DATE_RANGE_MONTHS = 12;

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetch shared group transactions using Cloud Function (primary) or fallback.
 *
 * PRIMARY: Uses Cloud Function for secure server-side membership validation.
 * FALLBACK: Per-member queries when Cloud Function unavailable.
 *
 * AC1: Query All Shared Transactions
 * - Cloud Function validates membership server-side
 * - Returns transactions from all members in the group
 * - Eliminates UUID-obscurity security vulnerability
 *
 * AC2: Merge and Sort Results
 * - Results already combined and sorted by Cloud Function
 * - _ownerId extracted from document path
 *
 * @param db Firestore instance (used for fallback only)
 * @param appId App ID (e.g., 'boletapp') - used for fallback only
 * @param groupId Shared group document ID
 * @param members Array of member user IDs - used for fallback only
 * @param options Query options (date range, limit)
 * @returns Merged and sorted array of transactions from all group members
 */
export async function fetchSharedGroupTransactions(
    db: Firestore,
    appId: string,
    groupId: string,
    members: string[],
    options: FetchSharedGroupTransactionsOptions = {}
): Promise<SharedGroupTransaction[]> {
    // Validate inputs
    if (!groupId || members.length === 0) {
        return [];
    }

    // Calculate limit
    const maxResults = options.limitPerMember
        ? options.limitPerMember * members.length
        : DEFAULT_LIMIT_PER_MEMBER * members.length;

    // Try Cloud Function first (primary, secure method)
    if (USE_CLOUD_FUNCTION) {
        try {
            return await fetchViaCloudFunction(groupId, options, maxResults);
        } catch (error) {
            // Log and fall back to direct Firestore queries
            if (import.meta.env.DEV) {
                console.warn('[sharedGroupTransactionService] Cloud Function failed, using fallback:', error);
            }
            // Fall through to fallback
        }
    }

    // Fallback: Per-member queries (used in emulator or if CF fails)
    return fetchSharedGroupTransactionsFallback(db, appId, groupId, members, options);
}

/**
 * Fetch transactions via Cloud Function (secure, server-validated).
 *
 * The Cloud Function:
 * 1. Validates the user is authenticated
 * 2. Validates the user is a member of the group
 * 3. Executes the collectionGroup query with admin SDK
 * 4. Returns transactions with _ownerId populated
 */
async function fetchViaCloudFunction(
    groupId: string,
    options: FetchSharedGroupTransactionsOptions,
    maxResults: number
): Promise<SharedGroupTransaction[]> {
    const getSharedGroupTransactionsFn = httpsCallable<
        GetSharedGroupTransactionsRequest,
        SharedGroupTransaction[]
    >(functions, 'getSharedGroupTransactions');

    const request: GetSharedGroupTransactionsRequest = {
        groupId,
        limit: maxResults,
    };

    // Add date filters if provided
    if (options.startDate) {
        request.startDate = formatDateForQuery(options.startDate);
    }
    if (options.endDate) {
        request.endDate = formatDateForQuery(options.endDate);
    }

    const result = await getSharedGroupTransactionsFn(request);

    // Cloud Function already returns sorted, deduplicated results
    return result.data;
}

/**
 * LEGACY: Fetch using collection group query (insecure).
 *
 * @deprecated This method relies on UUID obscurity for security.
 * Use Cloud Function via fetchSharedGroupTransactions() instead.
 *
 * Kept for reference and potential emulator use where CF may not be available.
 */
// @ts-expect-error Intentionally kept for reference/fallback, not currently used
async function _fetchViaCollectionGroup(
    db: Firestore,
    groupId: string,
    options: FetchSharedGroupTransactionsOptions,
    maxResults: number
): Promise<SharedGroupTransaction[]> {
    // Use collectionGroup to query ALL transactions collections
    const transactionsRef = collectionGroup(db, 'transactions');

    // Build query constraints
    const constraints: Parameters<typeof query>[1][] = [
        where('sharedGroupIds', 'array-contains', groupId),
        orderBy('date', 'desc'),
        limit(maxResults),
    ];

    // Add date range filters if provided
    if (options.startDate) {
        constraints.push(where('date', '>=', formatDateForQuery(options.startDate)));
    }
    if (options.endDate) {
        constraints.push(where('date', '<=', formatDateForQuery(options.endDate)));
    }

    const q = query(transactionsRef, ...constraints);
    const snapshot = await getDocs(q);

    // Map results and extract owner ID from document path
    // Path format: artifacts/{appId}/users/{userId}/transactions/{transactionId}
    const transactions: SharedGroupTransaction[] = snapshot.docs.map(doc => {
        const pathParts = doc.ref.path.split('/');
        // Find 'users' in path and get the next segment as userId
        const usersIndex = pathParts.indexOf('users');
        const ownerId = usersIndex !== -1 ? pathParts[usersIndex + 1] : 'unknown';

        return {
            id: doc.id,
            ...doc.data(),
            _ownerId: ownerId,
        } as SharedGroupTransaction;
    });

    // Remove duplicates by ID (defensive)
    const uniqueTransactions = deduplicateById(transactions);

    // Sort by date descending (already sorted by query, but defensive)
    return sortByDateDescending(uniqueTransactions);
}

/**
 * Fallback: Fetch shared group transactions using per-member queries.
 * Used if collection group query fails (e.g., missing index).
 */
async function fetchSharedGroupTransactionsFallback(
    db: Firestore,
    appId: string,
    groupId: string,
    members: string[],
    options: FetchSharedGroupTransactionsOptions
): Promise<SharedGroupTransaction[]> {
    const limitPerMember = options.limitPerMember || DEFAULT_LIMIT_PER_MEMBER;

    // Execute queries in parallel for each member
    const queries = members.map(memberId =>
        fetchMemberTransactions(db, appId, memberId, groupId, options, limitPerMember)
    );

    const results = await Promise.all(queries);

    // Flatten results and add owner info
    const allTransactions = results.flatMap((memberTxns, idx) =>
        memberTxns.map(txn => ({
            ...txn,
            _ownerId: members[idx],
        }))
    );

    // Remove duplicates by ID (defensive)
    const uniqueTransactions = deduplicateById(allTransactions);

    // Sort by date descending
    return sortByDateDescending(uniqueTransactions);
}

/**
 * Fetch transactions for a single member with shared group filter.
 *
 * @param db Firestore instance
 * @param appId App ID
 * @param userId Member user ID
 * @param groupId Shared group ID to filter by
 * @param options Query options
 * @param limitCount Maximum transactions to fetch
 * @returns Array of transactions for this member
 */
async function fetchMemberTransactions(
    db: Firestore,
    appId: string,
    userId: string,
    groupId: string,
    options: FetchSharedGroupTransactionsOptions,
    limitCount: number
): Promise<Transaction[]> {
    const transactionsRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/transactions`
    );

    // Build query constraints
    const constraints = [
        where('sharedGroupIds', 'array-contains', groupId),
        orderBy('date', 'desc'),
        limit(limitCount),
    ];

    // Add date range filters if provided
    if (options.startDate) {
        constraints.push(where('date', '>=', formatDateForQuery(options.startDate)));
    }
    if (options.endDate) {
        constraints.push(where('date', '<=', formatDateForQuery(options.endDate)));
    }

    const q = query(transactionsRef, ...constraints);

    try {
        const snapshot = await getDocs(q);

        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Transaction[];

        return transactions;
    } catch (error) {
        // Log error but don't fail the entire batch - return empty for this member
        if (import.meta.env.DEV) {
            console.warn(`[sharedGroupTransactionService] Error fetching member ${userId}:`, error);
        }
        return [];
    }
}

/**
 * Fetch delta updates for members who have changes since last sync.
 *
 * AC4: Delta Sync with memberUpdates
 * - Only fetches transactions with updatedAt > lastSyncTimestamp
 * - Includes soft-deleted transactions for proper cache update
 *
 * @param db Firestore instance
 * @param appId App ID
 * @param groupId Shared group ID
 * @param options Delta sync options with since timestamp and changed members
 * @returns Delta fetch result with updated transactions and deleted IDs
 */
export async function fetchDeltaUpdates(
    db: Firestore,
    appId: string,
    groupId: string,
    options: FetchDeltaOptions
): Promise<DeltaFetchResult> {
    const { since, changedMembers } = options;

    if (changedMembers.length === 0) {
        return { transactions: [], deletedIds: [] };
    }

    const sinceTimestamp = Timestamp.fromDate(since);

    // Fetch updates from changed members in parallel
    const queries = changedMembers.map(memberId =>
        fetchMemberDeltaUpdates(db, appId, memberId, groupId, sinceTimestamp)
    );

    const results = await Promise.all(queries);

    // Separate updated transactions from deleted ones
    const transactions: SharedGroupTransaction[] = [];
    const deletedIds: string[] = [];

    results.forEach((memberResult, idx) => {
        memberResult.forEach(txn => {
            if (txn.deletedAt) {
                // Transaction was soft-deleted - add to deleted list
                if (txn.id) {
                    deletedIds.push(txn.id);
                }
            } else {
                // Active transaction - add with owner info
                transactions.push({
                    ...txn,
                    _ownerId: changedMembers[idx],
                });
            }
        });
    });

    return {
        transactions: sortByDateDescending(deduplicateById(transactions)),
        deletedIds,
    };
}

/**
 * Fetch delta updates for a single member.
 */
async function fetchMemberDeltaUpdates(
    db: Firestore,
    appId: string,
    userId: string,
    groupId: string,
    sinceTimestamp: Timestamp
): Promise<Transaction[]> {
    const transactionsRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/transactions`
    );

    // Query for transactions updated since lastSync
    // Note: This requires a composite index on [sharedGroupIds, updatedAt]
    const q = query(
        transactionsRef,
        where('sharedGroupIds', 'array-contains', groupId),
        where('updatedAt', '>', sinceTimestamp),
        orderBy('updatedAt', 'desc'),
        limit(500) // Higher limit for delta sync
    );

    try {
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Transaction[];
    } catch (error) {
        console.error(`[sharedGroupTransactionService] Delta fetch error for ${userId}:`, error);
        return [];
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a Date for Firestore date string comparison.
 * Transactions use YYYY-MM-DD format for the date field.
 */
function formatDateForQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Remove duplicates from transactions by ID.
 * Keeps the first occurrence (which should be the most recent in sorted order).
 */
function deduplicateById<T extends { id?: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
        if (!item.id) return true; // Keep items without ID
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}

/**
 * Sort transactions by date descending (most recent first).
 * Handles both string dates (YYYY-MM-DD) and Timestamp objects.
 */
function sortByDateDescending<T extends { date: string | Timestamp | unknown }>(
    items: T[]
): T[] {
    return [...items].sort((a, b) => {
        const dateA = extractDateMillis(a.date);
        const dateB = extractDateMillis(b.date);
        return dateB - dateA; // Descending
    });
}

/**
 * Extract milliseconds from various date formats.
 */
function extractDateMillis(date: unknown): number {
    if (!date) return 0;

    // String date (YYYY-MM-DD)
    if (typeof date === 'string') {
        return new Date(date).getTime();
    }

    // Firestore Timestamp
    if (typeof date === 'object' && 'toDate' in date && typeof (date as { toDate: () => Date }).toDate === 'function') {
        return (date as { toDate: () => Date }).toDate().getTime();
    }

    // Already a Date
    if (date instanceof Date) {
        return date.getTime();
    }

    return 0;
}

// ============================================================================
// Date Range Utilities
// ============================================================================

/**
 * Get the default date range (current month).
 *
 * AC8: Default is current month
 */
export function getDefaultDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
    return { startDate, endDate };
}

/**
 * Validate and enforce maximum date range.
 *
 * AC8: Maximum range is 12 months
 *
 * @param startDate Start of range
 * @param endDate End of range
 * @returns Adjusted dates if range exceeds maximum, or original dates
 */
export function enforceMaxDateRange(
    startDate: Date,
    endDate: Date
): { startDate: Date; endDate: Date; wasAdjusted: boolean } {
    const diffMonths = getMonthsDifference(startDate, endDate);

    if (diffMonths > MAX_DATE_RANGE_MONTHS) {
        // Adjust start date to be MAX_DATE_RANGE_MONTHS before end date
        const adjustedStart = new Date(endDate);
        adjustedStart.setMonth(adjustedStart.getMonth() - MAX_DATE_RANGE_MONTHS);
        return {
            startDate: adjustedStart,
            endDate,
            wasAdjusted: true,
        };
    }

    return { startDate, endDate, wasAdjusted: false };
}

/**
 * Calculate the difference in months between two dates.
 */
function getMonthsDifference(start: Date, end: Date): number {
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    return yearDiff * 12 + monthDiff;
}

// ============================================================================
// Changed Members Detection
// ============================================================================

/**
 * Identify members who have changes since last sync.
 *
 * AC4: Use group.memberUpdates[userId] to detect changes per member
 *
 * @param memberUpdates The group's memberUpdates map
 * @param lastSyncTimestamp Last sync timestamp
 * @returns Array of member IDs who have changes
 */
export function getChangedMembers(
    memberUpdates: Record<string, { lastSyncAt?: Timestamp }>,
    lastSyncTimestamp: Date
): string[] {
    const changedMembers: string[] = [];

    for (const [memberId, update] of Object.entries(memberUpdates)) {
        if (!update.lastSyncAt) continue;

        const memberLastUpdate = update.lastSyncAt.toDate?.() || new Date(0);
        if (memberLastUpdate > lastSyncTimestamp) {
            changedMembers.push(memberId);
        }
    }

    return changedMembers;
}

// ============================================================================
// Total Calculation
// ============================================================================

/**
 * Calculate the total spending for a set of transactions.
 *
 * AC6: Combined total spending
 * - Aggregates all members' tagged transactions
 *
 * @param transactions Array of transactions
 * @returns Total amount
 */
export function calculateTotalSpending(transactions: Transaction[]): number {
    return transactions.reduce((sum, txn) => sum + (txn.total || 0), 0);
}

/**
 * Calculate total spending per member.
 *
 * @param transactions Array of shared group transactions with _ownerId
 * @returns Map of memberId to total spending
 */
export function calculateSpendingByMember(
    transactions: SharedGroupTransaction[]
): Map<string, number> {
    const byMember = new Map<string, number>();

    for (const txn of transactions) {
        const current = byMember.get(txn._ownerId) || 0;
        byMember.set(txn._ownerId, current + (txn.total || 0));
    }

    return byMember;
}
