/**
 * Changelog Service for Shared Groups
 *
 * Epic 14d-v2: Shared Groups v2 - Story 1.3c
 *
 * Provides query functions for the changelog subcollection within shared groups.
 * The changelog tracks transaction changes and enables changelog-driven sync
 * between group members (AD-2).
 *
 * Architecture Decisions:
 * - AD-2: Changelog as PRIMARY sync source (not transactions)
 * - AD-3: Full transaction data embedded in changelog entries
 * - AD-9: 30-day TTL on changelog entries
 *
 * Storage Path: sharedGroups/{groupId}/changelog/{entryId}
 *
 * @example
 * ```typescript
 * import { getChangelogSince } from '@/services/changelogService';
 *
 * // Get all changes since last sync
 * const entries = await getChangelogSince(db, 'group-123', lastSyncTimestamp);
 *
 * // With pagination
 * const batch = await getChangelogSince(db, 'group-123', lastSyncTimestamp, 100);
 * ```
 */

import {
    collection,
    query,
    where,
    orderBy,
    limit as firestoreLimit,
    getDocs,
    Firestore,
    Timestamp,
} from 'firebase/firestore';
import type { ChangelogEntry } from '../types/changelog';

/**
 * Default limit for changelog queries (safety limit).
 * Prevents excessive reads in a single query.
 */
export const DEFAULT_CHANGELOG_LIMIT = 1000;

/**
 * Maximum limit for changelog queries (hard cap).
 * Even if caller requests more, this is the absolute maximum.
 */
export const MAX_CHANGELOG_LIMIT = 10000;

/**
 * Error thrown when changelog query fails.
 */
export class ChangelogQueryError extends Error {
    constructor(
        message: string,
        public readonly code: 'INVALID_GROUP_ID' | 'ACCESS_DENIED' | 'QUERY_FAILED',
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = 'ChangelogQueryError';
    }
}

/**
 * Query changelog entries since a given timestamp.
 *
 * Retrieves changelog entries for a shared group that occurred after
 * the specified timestamp. Results are ordered by timestamp ascending
 * (oldest first) to support incremental sync.
 *
 * AC #1: Service function to query changelog by timestamp
 * - Query: changelog WHERE timestamp > sinceTimestamp ORDER BY timestamp ASC LIMIT limit
 * - Default limit: 1000 entries (safety cap)
 * - Max limit: 10000 entries (hard cap)
 *
 * @param db - Firestore database instance
 * @param groupId - The shared group ID to query changelog from
 * @param sinceTimestamp - Only return entries with timestamp > this value
 * @param limitCount - Maximum entries to return (default: 1000, max: 10000)
 * @returns Array of changelog entries ordered by timestamp ascending
 * @throws {ChangelogQueryError} If groupId is invalid or query fails
 *
 * @example
 * ```typescript
 * // Basic usage - get all changes since last sync
 * const entries = await getChangelogSince(db, groupId, lastSyncTimestamp);
 *
 * // With custom limit for pagination
 * const batch = await getChangelogSince(db, groupId, lastSyncTimestamp, 100);
 * ```
 */
export async function getChangelogSince(
    db: Firestore,
    groupId: string,
    sinceTimestamp: Timestamp,
    limitCount: number = DEFAULT_CHANGELOG_LIMIT
): Promise<ChangelogEntry[]> {
    // AC #2: Invalid groupId handling
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
        throw new ChangelogQueryError(
            'Invalid groupId: must be a non-empty string',
            'INVALID_GROUP_ID'
        );
    }

    // AC #1: Enforce safety limit (max 10000)
    const safeLimit = Math.min(Math.max(1, limitCount), MAX_CHANGELOG_LIMIT);

    try {
        // Build the changelog collection reference
        // Path: sharedGroups/{groupId}/changelog
        const changelogRef = collection(db, 'sharedGroups', groupId, 'changelog');

        // AC #1: Query with timestamp filter, order by timestamp ascending, apply limit
        const q = query(
            changelogRef,
            where('timestamp', '>', sinceTimestamp),
            orderBy('timestamp', 'asc'),
            firestoreLimit(safeLimit)
        );

        const snapshot = await getDocs(q);

        // Map documents to ChangelogEntry with id
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as ChangelogEntry));
    } catch (error) {
        // AC #2: Handle access denied errors
        if (error instanceof Error) {
            // Firestore permission-denied errors
            if (
                error.message.includes('permission-denied') ||
                error.message.includes('Missing or insufficient permissions')
            ) {
                throw new ChangelogQueryError(
                    `Access denied to changelog for group: ${groupId}`,
                    'ACCESS_DENIED',
                    error
                );
            }
        }

        // Re-throw as ChangelogQueryError for other failures
        throw new ChangelogQueryError(
            `Failed to query changelog for group: ${groupId}`,
            'QUERY_FAILED',
            error
        );
    }
}
