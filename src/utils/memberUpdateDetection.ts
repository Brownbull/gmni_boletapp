/**
 * Member Update Detection Utility
 *
 * Story 14c.12: Real-Time Sync - Complete the Circuit
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Utility functions for detecting when other members in shared groups
 * have modified their transactions, enabling cross-user cache invalidation.
 *
 * @example
 * ```typescript
 * const { groupsWithChanges, shouldInvalidate } = detectMemberUpdates(
 *   currentGroups,
 *   previousUpdatesMap,
 *   currentUserId
 * );
 *
 * if (shouldInvalidate) {
 *   groupsWithChanges.forEach(groupId => {
 *     clearGroupCache(groupId);
 *     queryClient.invalidateQueries(['sharedGroupTransactions', groupId]);
 *   });
 * }
 * ```
 */

import type { SharedGroup } from '../types/sharedGroup';

/**
 * Member update timestamp structure from Firestore
 */
export interface MemberUpdateEntry {
    lastSyncAt?: {
        seconds: number;
        nanoseconds?: number;
    };
}

/**
 * Map of userId to their memberUpdates entry
 */
export type MemberUpdatesMap = Record<string, MemberUpdateEntry>;

/**
 * Result of member update detection
 */
export interface MemberUpdateDetectionResult {
    /** Group IDs that have changes from other members */
    groupsWithChanges: string[];
    /** Whether any changes were detected */
    shouldInvalidate: boolean;
    /** Updated map to store for next comparison */
    updatedPreviousMap: Map<string, MemberUpdatesMap>;
    /** Details about which member changed in which group (for logging) */
    changeDetails: Array<{
        groupId: string;
        memberId: string;
        previousTimestamp: number;
        currentTimestamp: number;
    }>;
}

/**
 * Detect if any OTHER members (not the current user) have updated their
 * memberUpdates timestamps, indicating they modified transactions.
 *
 * This is the core logic for cross-user sync detection.
 *
 * @param groups - Current shared groups from Firestore subscription
 * @param previousUpdatesMap - Previous memberUpdates state (from useRef)
 * @param currentUserId - Current authenticated user's ID
 * @returns Detection result with groups needing cache invalidation
 */
export function detectMemberUpdates(
    groups: SharedGroup[],
    previousUpdatesMap: Map<string, MemberUpdatesMap>,
    currentUserId: string
): MemberUpdateDetectionResult {
    const groupsWithChanges: string[] = [];
    const updatedPreviousMap = new Map<string, MemberUpdatesMap>();
    const changeDetails: MemberUpdateDetectionResult['changeDetails'] = [];

    for (const group of groups) {
        if (!group.id || !group.memberUpdates) {
            // Skip groups without memberUpdates (no sync data yet)
            continue;
        }

        const prevUpdates = previousUpdatesMap.get(group.id);
        const currentUpdates = group.memberUpdates as MemberUpdatesMap;

        let otherMemberChanged = false;

        for (const [memberId, memberData] of Object.entries(currentUpdates)) {
            // Skip self - we don't need to refetch our own changes
            if (memberId === currentUserId) {
                continue;
            }

            const prevMemberData = prevUpdates?.[memberId];
            const prevTimestamp = prevMemberData?.lastSyncAt?.seconds ?? 0;
            const currentTimestamp = memberData?.lastSyncAt?.seconds ?? 0;

            if (currentTimestamp > prevTimestamp) {
                otherMemberChanged = true;
                changeDetails.push({
                    groupId: group.id,
                    memberId,
                    previousTimestamp: prevTimestamp,
                    currentTimestamp,
                });
                break; // One change is enough to trigger invalidation
            }
        }

        if (otherMemberChanged) {
            groupsWithChanges.push(group.id);
        }

        // Always update the map with current state for next comparison
        updatedPreviousMap.set(group.id, { ...currentUpdates });
    }

    return {
        groupsWithChanges,
        shouldInvalidate: groupsWithChanges.length > 0,
        updatedPreviousMap,
        changeDetails,
    };
}

/**
 * Check if a specific member's timestamp has changed.
 *
 * @param currentUpdates - Current memberUpdates for a group
 * @param prevUpdates - Previous memberUpdates for the same group
 * @param memberId - Member ID to check
 * @param excludeUserId - User ID to exclude (typically current user)
 * @returns true if the member's timestamp increased
 */
export function hasMemberTimestampChanged(
    currentUpdates: MemberUpdatesMap | undefined,
    prevUpdates: MemberUpdatesMap | undefined,
    memberId: string,
    excludeUserId?: string
): boolean {
    if (memberId === excludeUserId) {
        return false;
    }

    const prevTimestamp = prevUpdates?.[memberId]?.lastSyncAt?.seconds ?? 0;
    const currentTimestamp = currentUpdates?.[memberId]?.lastSyncAt?.seconds ?? 0;

    return currentTimestamp > prevTimestamp;
}

/**
 * Get the latest sync timestamp for a specific member in a group.
 *
 * @param memberUpdates - Group's memberUpdates map
 * @param memberId - Member ID to get timestamp for
 * @returns Timestamp in seconds, or 0 if not found
 */
export function getMemberSyncTimestamp(
    memberUpdates: MemberUpdatesMap | undefined,
    memberId: string
): number {
    return memberUpdates?.[memberId]?.lastSyncAt?.seconds ?? 0;
}
