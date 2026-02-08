/**
 * Group Member Service
 *
 * TD-CONSOLIDATED-1: Extracted from groupService.ts during modularization.
 * Stories: 14d-v2-1-6c-2 (Join), 14d-v2-1-7a (Leave/Transfer), 14d-v2-1-12d (Cleanup)
 *
 * Service functions for group membership lifecycle:
 * - Joining groups (direct join via share code)
 * - Leaving groups (with and without preference cleanup)
 * - Transferring ownership (with and without leave+cleanup)
 */

import {
    Firestore,
    doc,
    serverTimestamp,
    runTransaction,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import { removeGroupPreference, validateGroupId } from '@/services/userPreferencesService';
import type { SharedGroup, MemberProfile } from '@/types/sharedGroup';
import { SHARED_GROUP_LIMITS, createDefaultGroupPreference } from '@/types/sharedGroup';
import { sanitizeInput } from '@/utils/sanitize';
import { validateAppId } from '@/utils/validationUtils';
import { GROUPS_COLLECTION } from './groupConstants';

// =============================================================================
// Join Group Functions
// =============================================================================

/**
 * Join a group directly using the group ID.
 *
 * Story 14d-v2-1-6c-2: Accept Invitation Dialog
 *
 * Used when a user joins via share code (not a personal invitation).
 * This function:
 * 1. Validates the group exists and has available capacity
 * 2. Verifies the user is not already a member
 * 3. Adds the user to the group's members array
 * 4. Adds the user's profile to memberProfiles
 *
 * @param db - Firestore instance
 * @param groupId - The group ID to join
 * @param userId - The user ID joining the group
 * @param userProfile - Optional user profile info
 * @param appId - Optional application ID
 * @param shareMyTransactions - Optional preference for sharing transactions
 * @returns The joined group
 *
 * @throws Error if group not found, user already member, or group full
 */
export async function joinGroupDirectly(
    db: Firestore,
    groupId: string,
    userId: string,
    userProfile?: MemberProfile,
    appId?: string,
    shareMyTransactions?: boolean
): Promise<SharedGroup> {
    if (!groupId || !userId) {
        throw new Error('Group ID and user ID are required');
    }

    // Story 14d-v2-1-13+14: Validate appId if provided (ECC Security Review fix)
    if (appId && !validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

    return await runTransaction(db, async (transaction) => {
        // Get the group document
        const groupRef = doc(db, GROUPS_COLLECTION, groupId);
        const groupSnap = await transaction.get(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const group = {
            id: groupSnap.id,
            ...groupSnap.data(),
        } as SharedGroup;

        // Check if user is already a member
        if (group.members?.includes(userId)) {
            throw new Error('User is already a member of this group');
        }

        // Check group capacity (BC-2: max 10 contributors)
        if ((group.members?.length ?? 0) >= SHARED_GROUP_LIMITS.MAX_CONTRIBUTORS_PER_GROUP) {
            throw new Error('Group has reached maximum number of members');
        }

        // Update group: add user to members array and memberProfiles
        const groupUpdate: Record<string, unknown> = {
            members: arrayUnion(userId),
            updatedAt: serverTimestamp(),
        };

        // Add member profile if provided (with sanitization)
        if (userProfile) {
            const profileData: Record<string, string | undefined> = {};
            if (userProfile.displayName) profileData.displayName = sanitizeInput(userProfile.displayName, { maxLength: 100 });
            if (userProfile.email) profileData.email = sanitizeInput(userProfile.email, { maxLength: 254 });
            if (userProfile.photoURL) profileData.photoURL = sanitizeInput(userProfile.photoURL, { maxLength: 500 });

            if (Object.keys(profileData).length > 0) {
                groupUpdate[`memberProfiles.${userId}`] = profileData;
            }
        }

        transaction.update(groupRef, groupUpdate);

        // Story 14d-v2-1-13+14: Write user group preference atomically (AC15)
        if (appId) {
            // H-1 fix: Validate groupId before dot-notation field path (prevents path injection)
            validateGroupId(groupId);
            const prefsDocRef = doc(db, 'artifacts', appId, 'users', userId, 'preferences', 'sharedGroups');
            const preference = createDefaultGroupPreference({
                shareMyTransactions: shareMyTransactions ?? false,
            });
            // Uses nested object (not dot-notation) because transaction.set treats dot-notation keys as literal field names
            transaction.set(prefsDocRef, {
                groupPreferences: {
                    [groupId]: preference,
                },
            }, { merge: true });
        }

        // Return updated group (with the new member)
        return {
            ...group,
            members: [...(group.members || []), userId],
        };
    });
}

// =============================================================================
// Leave & Transfer Functions (Story 14d-v2-1-7a)
// =============================================================================

/**
 * Leave a shared group.
 *
 * Story 14d-v2-1-7a: Leave + Transfer Service Layer
 *
 * Removes the user from the group's members array.
 * Does NOT remove transactions - they remain tagged with sharedGroupId.
 *
 * Validations:
 * - User must be a member of the group
 * - User cannot be the owner (must transfer ownership first)
 *
 * @param db - Firestore instance
 * @param userId - ID of the user leaving the group
 * @param groupId - ID of the group to leave
 *
 * @throws Error if group not found
 * @throws Error if user is not a member of the group
 * @throws Error if user is the owner (must transfer ownership first)
 */
export async function leaveGroup(
    db: Firestore,
    userId: string,
    groupId: string
): Promise<void> {
    // Input validation for consistency with joinGroupDirectly
    // ECC Review: HIGH severity fix - prevent confusing Firestore errors
    if (!userId || !groupId) {
        throw new Error('User ID and group ID are required');
    }

    await runTransaction(db, async (transaction) => {
        // Get the group document
        const groupRef = doc(db, GROUPS_COLLECTION, groupId);
        const groupSnap = await transaction.get(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const group = groupSnap.data() as SharedGroup;

        // AC #6: Verify user is a member
        if (!group.members?.includes(userId)) {
            throw new Error('You are not a member of this group');
        }

        // AC #2: Verify user is not the owner
        if (group.ownerId === userId) {
            throw new Error('You must transfer ownership before leaving');
        }

        // AC #1: Remove member from array and update timestamp
        transaction.update(groupRef, {
            members: arrayRemove(userId),
            updatedAt: serverTimestamp(),
        });
    });
}

/**
 * Transfer ownership of a shared group to another member.
 *
 * Story 14d-v2-1-7a: Leave + Transfer Service Layer
 *
 * Transfers the ownerId field to a new member.
 * IMPORTANT: Toggle state fields are preserved (NOT reset on transfer).
 *
 * Validations:
 * - Current owner must be the actual owner
 * - New owner must be a member of the group
 *
 * @param db - Firestore instance
 * @param currentOwnerId - ID of the current owner (must match group.ownerId)
 * @param newOwnerId - ID of the new owner (must be a group member)
 * @param groupId - ID of the group
 *
 * @throws Error if group not found
 * @throws Error if currentOwnerId is not the group owner
 * @throws Error if newOwnerId is not a member of the group
 */
export async function transferOwnership(
    db: Firestore,
    currentOwnerId: string,
    newOwnerId: string,
    groupId: string
): Promise<void> {
    // Input validation for consistency with other service functions
    // ECC Review: HIGH severity fix - prevent confusing Firestore errors
    if (!currentOwnerId || !newOwnerId || !groupId) {
        throw new Error('Current owner ID, new owner ID, and group ID are required');
    }

    await runTransaction(db, async (transaction) => {
        // Get the group document
        const groupRef = doc(db, GROUPS_COLLECTION, groupId);
        const groupSnap = await transaction.get(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const group = groupSnap.data() as SharedGroup;

        // Verify currentOwnerId is the actual owner
        if (group.ownerId !== currentOwnerId) {
            throw new Error('Only the group owner can transfer ownership');
        }

        // AC #5: Verify newOwnerId is a member
        if (!group.members?.includes(newOwnerId)) {
            throw new Error('Selected user is not a member of this group');
        }

        // AC #3, #4: Transfer ownership with minimal update
        // IMPORTANT: Do NOT reset toggle state fields (DM: Toggle Cooldown Preservation)
        // Only update ownerId and updatedAt
        transaction.update(groupRef, {
            ownerId: newOwnerId,
            updatedAt: serverTimestamp(),
        });
    });
}

// =============================================================================
// Leave Group with Cleanup Functions (Story 14d-v2-1-12d)
// =============================================================================

/**
 * Leave group with preference cleanup.
 *
 * Story 14d-v2-1-12d: User Preferences Cleanup
 * - AC#5: Deletes user's group preference when leaving a group
 * - AC#7: Cleanup errors are logged but do NOT block leave operation
 *
 * This wrapper function:
 * 1. Calls leaveGroup (throws if fails - blocking error)
 * 2. Attempts to remove user's group preference (non-blocking, logged on failure)
 *
 * @param db - Firestore instance
 * @param userId - ID of the user leaving the group
 * @param groupId - ID of the group to leave
 * @param appId - Application ID (e.g., 'boletapp')
 *
 * @throws Error if leaveGroup fails (user not member, is owner, group not found)
 * @returns void (cleanup errors are logged but don't throw)
 */
export async function leaveGroupWithCleanup(
    db: Firestore,
    userId: string,
    groupId: string,
    appId: string
): Promise<void> {
    // ECC Review Fix: Validate appId for consistency with other functions
    if (!validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

    // First leave the group (throws if fails - this is blocking)
    await leaveGroup(db, userId, groupId);

    // Then attempt cleanup (non-blocking per AC#7)
    try {
        await removeGroupPreference(db, userId, appId, groupId);
    } catch (err) {
        // AC#7: Cleanup errors are logged but do NOT block leave operation
        if (import.meta.env.DEV) console.warn('[groupMemberService] Preference cleanup failed (non-blocking):', err);
    }
}

/**
 * Transfer ownership, leave group, and cleanup preferences.
 *
 * Story 14d-v2-1-12d: User Preferences Cleanup
 * - AC#6: Cleans up preference after ownership transfer + leave
 * - AC#7: Cleanup errors are logged but do NOT block the operation
 *
 * This wrapper function:
 * 1. Calls transferOwnership (throws if fails - blocking error)
 * 2. Calls leaveGroup (throws if fails - blocking error)
 * 3. Attempts to remove user's group preference (non-blocking, logged on failure)
 *
 * @param db - Firestore instance
 * @param currentOwnerId - ID of the current owner transferring and leaving
 * @param newOwnerId - ID of the new owner receiving ownership
 * @param groupId - ID of the group
 * @param appId - Application ID (e.g., 'boletapp')
 *
 * @throws Error if transferOwnership fails
 * @throws Error if leaveGroup fails after transfer
 * @returns void (cleanup errors are logged but don't throw)
 */
export async function transferAndLeaveWithCleanup(
    db: Firestore,
    currentOwnerId: string,
    newOwnerId: string,
    groupId: string,
    appId: string
): Promise<void> {
    // Input validation (consistent with transferOwnership)
    if (!currentOwnerId || !newOwnerId || !groupId) {
        throw new Error('Current owner ID, new owner ID, and group ID are required');
    }
    // ECC Review Fix: Validate appId for consistency with other functions
    if (!validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

    // Step 1: Transfer ownership (throws if fails - blocking)
    await transferOwnership(db, currentOwnerId, newOwnerId, groupId);

    // Step 2: Leave group (throws if fails - blocking)
    await leaveGroup(db, currentOwnerId, groupId);

    // Step 3: Cleanup preferences (non-blocking per AC#7)
    try {
        await removeGroupPreference(db, currentOwnerId, appId, groupId);
    } catch (err) {
        // AC#7: Cleanup errors are logged but do NOT block the operation
        if (import.meta.env.DEV) console.warn('[groupMemberService] Preference cleanup failed (non-blocking):', err);
    }
}
