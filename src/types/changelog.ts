/**
 * Changelog Types for Shared Groups
 *
 * Epic 14d-v2: Shared Groups v2 Changelog Infrastructure
 *
 * Changelogs track transaction changes within shared groups, enabling
 * changelog-driven sync between group members. Each entry embeds the
 * FULL transaction data for single-read sync (AD-3).
 *
 * Architecture Decisions:
 * - AD-3: Full transaction data in changelog (50% cost reduction)
 * - AD-9: 30-day TTL on changelog entries (auto-cleanup)
 *
 * Storage Path: sharedGroups/{groupId}/changelog/{entryId}
 *
 * @example
 * ```typescript
 * const entry: ChangelogEntry = {
 *   id: 'entry-abc123',
 *   type: 'TRANSACTION_ADDED',
 *   transactionId: 'tx-xyz789',
 *   timestamp: Timestamp.now(),
 *   actorId: 'user-123',
 *   groupId: 'group-456',
 *   data: { ...fullTransaction },
 *   summary: {
 *     amount: 15000,
 *     currency: 'CLP',
 *     description: 'Supermercado Jumbo',
 *     category: 'Supermarket',
 *   },
 *   _ttl: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
 * };
 * ```
 */

import type { Timestamp } from 'firebase/firestore';
import type { Transaction } from './transaction';

/**
 * Type of change recorded in the changelog.
 *
 * - `TRANSACTION_ADDED`: A new transaction was tagged to the group
 * - `TRANSACTION_MODIFIED`: An existing transaction was updated
 * - `TRANSACTION_REMOVED`: A transaction was untagged or soft-deleted from the group
 */
export type ChangelogEntryType =
    | 'TRANSACTION_ADDED'
    | 'TRANSACTION_MODIFIED'
    | 'TRANSACTION_REMOVED';

/**
 * Summary data for notification display and quick sync previews.
 *
 * Contains only the essential fields needed to show a notification
 * about a transaction change without loading the full transaction.
 */
export interface ChangelogSummary {
    /**
     * Transaction amount for notification display.
     * Uses the transaction's total field.
     */
    amount: number;

    /**
     * ISO 4217 currency code (e.g., "CLP", "USD", "EUR").
     * Enables proper currency formatting in notifications.
     */
    currency: string;

    /**
     * Short description for notification display.
     * Typically the merchant name or first item name.
     */
    description: string;

    /**
     * Store category for context in notifications.
     * May be null if category is not assigned.
     */
    category: string | null;
}

/**
 * A changelog entry recording a transaction change within a shared group.
 *
 * Each entry contains the FULL transaction data (AD-3) to enable
 * single-read sync - members can reconstruct transaction state
 * without additional queries to the transactions collection.
 *
 * Changelog entries auto-expire after 30 days (AD-9) via Firestore TTL.
 */
export interface ChangelogEntry {
    /**
     * Firestore document ID.
     * Auto-generated when creating the entry.
     */
    id: string;

    /**
     * Type of change (added, modified, removed).
     */
    type: ChangelogEntryType;

    /**
     * ID of the affected transaction.
     * Required for all entry types.
     */
    transactionId: string;

    /**
     * When the change occurred.
     * Server timestamp set by Cloud Function.
     */
    timestamp: Timestamp;

    /**
     * User ID who made the change.
     * Required for audit trail and attribution.
     */
    actorId: string;

    /**
     * Group ID this changelog belongs to.
     * Denormalized from document path for efficient queries.
     */
    groupId: string;

    /**
     * Full transaction data at the time of the change.
     *
     * AD-3: Embedding full data enables single-read sync and
     * reduces Firestore read costs by ~50%.
     *
     * - For TRANSACTION_ADDED: Contains the new transaction
     * - For TRANSACTION_MODIFIED: Contains the updated transaction
     * - For TRANSACTION_REMOVED: null (transaction was deleted/untagged)
     */
    data: Transaction | null;

    /**
     * Summary data for notifications and quick previews.
     * Extracted from the transaction for display without parsing full data.
     */
    summary: ChangelogSummary;

    /**
     * Firestore TTL field for automatic document deletion.
     *
     * AD-9: Set to timestamp + 30 days.
     * Firestore automatically deletes documents when _ttl < now.
     *
     * Field name uses underscore prefix to follow Firestore TTL convention.
     */
    _ttl: Timestamp;
}

/**
 * Input data for creating a new changelog entry.
 * Used by the Cloud Function that writes changelog entries.
 *
 * Omits auto-generated fields (id, timestamp, _ttl).
 */
export type CreateChangelogEntryInput = Omit<ChangelogEntry, 'id' | 'timestamp' | '_ttl'>;

/**
 * TTL duration for changelog entries in milliseconds.
 * AD-9: 30 days = 30 * 24 * 60 * 60 * 1000
 */
export const CHANGELOG_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * TTL duration for changelog entries in days.
 */
export const CHANGELOG_TTL_DAYS = 30;

/**
 * Creates a summary object from a transaction.
 * Used when creating changelog entries.
 *
 * @param transaction - The transaction to summarize
 * @returns A ChangelogSummary suitable for notifications
 */
export function createChangelogSummary(transaction: Transaction): ChangelogSummary {
    return {
        amount: transaction.total,
        currency: transaction.currency ?? 'CLP',
        description: transaction.merchant || transaction.items?.[0]?.name || 'Transaction',
        category: transaction.category ?? null,
    };
}

/**
 * Type guard to check if a changelog entry represents a deletion.
 *
 * @param entry - The changelog entry to check
 * @returns true if the entry is a TRANSACTION_REMOVED type
 */
export function isChangelogRemoval(entry: ChangelogEntry): boolean {
    return entry.type === 'TRANSACTION_REMOVED';
}

/**
 * Type guard to check if a changelog entry has valid transaction data.
 * Removal entries may have null data.
 *
 * @param entry - The changelog entry to check
 * @returns true if data is not null
 */
export function hasChangelogData(entry: ChangelogEntry): entry is ChangelogEntry & { data: Transaction } {
    return entry.data !== null;
}
