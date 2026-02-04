/**
 * Group Service
 *
 * Story 14d-v2-1-4b: Service & Hook Layer
 * Epic 14d-v2: Shared Groups v2
 *
 * Service functions for creating and managing shared groups.
 * Implements the foundation for group CRUD operations.
 *
 * Moved to src/features/shared-groups/services/ for FSD compliance.
 *
 * @example
 * ```typescript
 * // Create a new group
 * const group = await createGroup(db, userId, appId, {
 *   name: '🏠 Gastos del Hogar',
 *   transactionSharingEnabled: true,
 * });
 *
 * // Get user's groups
 * const groups = await getUserGroups(db, userId);
 *
 * // Check BC-1 limit
 * const count = await getGroupCount(db, userId);
 * if (count >= SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS) {
 *   throw new Error('Maximum group limit reached');
 * }
 * ```
 */

import {
    Firestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    getCountFromServer,
    query,
    where,
    serverTimestamp,
    Timestamp,
    runTransaction,
    arrayUnion,
    arrayRemove,
    writeBatch,
} from 'firebase/firestore';
import type {
    SharedGroup,
    CreateSharedGroupInput,
    UpdateSharedGroupInput,
    MemberProfile,
} from '@/types/sharedGroup';
import { SHARED_GROUP_LIMITS } from '@/types/sharedGroup';
import { generateShareCode } from '@/services/sharedGroupService';
import { sanitizeInput } from '@/utils/sanitize';
import { validateAppId } from '@/utils/validationUtils';

// =============================================================================
// Constants
// =============================================================================

/**
 * Firestore collection name for shared groups.
 * Top-level collection for cross-user access.
 */
const GROUPS_COLLECTION = 'sharedGroups';

/**
 * Default group color (emerald green).
 * ECC Review #2: Exported for use in UI components
 */
export const DEFAULT_GROUP_COLOR = '#10b981';

/**
 * Default timezone fallback when Intl.DateTimeFormat fails.
 */
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Subcollection name for changelog entries.
 * Story 14d-v2-1-7b: Deletion Service Logic
 */
const CHANGELOG_SUBCOLLECTION = 'changelog';

/**
 * Subcollection name for analytics data.
 * Story 14d-v2-1-7b: Deletion Service Logic
 */
const ANALYTICS_SUBCOLLECTION = 'analytics';

/**
 * Top-level collection for pending invitations.
 * Story 14d-v2-1-7b: Deletion Service Logic
 */
const INVITATIONS_COLLECTION = 'pendingInvitations';

/**
 * Maximum batch size for Firestore operations.
 * Firestore has a limit of 500 operations per batch.
 * @see https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes
 * Story 14d-v2-1-7b: Deletion Service Logic
 */
const BATCH_SIZE = 500;

/**
 * Whitelist of valid group colors (hex codes).
 * Story 14d-v2-1-7g: Edit Group Settings
 *
 * These colors match the ColorPicker component's COLOR_OPTIONS.
 * @see src/features/shared-groups/components/ColorPicker.tsx
 */
export const GROUP_COLORS: readonly string[] = [
    // Greens
    '#10b981', // Emerald (default)
    '#22c55e', // Green
    '#84cc16', // Lime
    '#14b8a6', // Teal
    // Blues
    '#3b82f6', // Blue
    '#0ea5e9', // Sky
    '#06b6d4', // Cyan
    '#6366f1', // Indigo
    // Purples & Pinks
    '#8b5cf6', // Violet
    '#a855f7', // Purple
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
    // Warm colors
    '#f43f5e', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    // Yellows & Neutrals
    '#eab308', // Yellow
    '#78716c', // Stone
    '#64748b', // Slate
    '#71717a', // Zinc
] as const;

/**
 * Whitelist of valid group icons (emojis).
 * Story 14d-v2-1-7g: Edit Group Settings
 *
 * These emojis match the EmojiPicker component's EMOJI_CATEGORIES.
 * @see src/features/shared-groups/components/EmojiPicker.tsx
 */
export const GROUP_ICONS: readonly string[] = [
    // Home & Family
    '🏠', '🏡', '🏢', '👨‍👩‍👧‍👦', '👨‍👩‍👧', '👪', '🏘', '🛋', '🛏', '🚿', '🧹', '🪴',
    // Travel
    '✈', '🚗', '🚌', '🚃', '⛽', '🏖', '🗺', '🧳', '🚀', '🚲', '🛵', '⛵',
    // Food & Drinks
    '🍽', '🍔', '🍕', '☕', '🍺', '🛒', '🧑‍🍳', '🥗', '🍰', '🍜', '🥤', '🍷',
    // Entertainment
    '🎬', '🎮', '🎵', '🎭', '🎪', '📺', '🎤', '🎸', '🎨', '📷', '🎲', '🎯',
    // Work & Office
    '💼', '💻', '📊', '📈', '🏛', '📋', '✏', '📁', '🖨', '📞', '🗂', '📝',
    // Health & Sports
    '🏥', '💊', '🏃', '⚽', '🏋', '🧘', '🚴', '🏊', '🎾', '⛳', '🥊', '🏀',
    // Shopping
    '🛍', '👗', '👟', '💄', '🎁', '💎', '🏬', '👜', '⌚', '👔', '🧥',
    // Special Events
    '🎄', '🎂', '🎉', '💒', '🎓', '🏆', '🎊', '✨', '🎈', '🎇', '🎆',
    // Nature & Pets
    '🐕', '🐈', '🌳', '🌸', '🌊', '⛰', '🌺', '🦋', '🐠', '🦜', '🌻', '🍀',
    // Symbols
    '⭐', '❤', '💰', '🔑', '🏷', '📌', '🔔', '💡', '💳', '📍', '🔒',
    // Default
    '👥',
] as const;

// =============================================================================
// Timezone Utility
// =============================================================================

/**
 * Get the device's current timezone in IANA format.
 *
 * Uses Intl.DateTimeFormat API with a fallback to UTC for environments
 * where this API might not be available or fail.
 *
 * @returns IANA timezone string (e.g., "America/Santiago", "Europe/London")
 *
 * @example
 * ```typescript
 * const tz = getDeviceTimezone();
 * // Returns: "America/Santiago" (or "UTC" as fallback)
 * ```
 */
export function getDeviceTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        // Fallback for environments where Intl.DateTimeFormat might fail
        if (import.meta.env.DEV) {
            console.warn('[groupService] Intl.DateTimeFormat failed, using UTC fallback');
        }
        return DEFAULT_TIMEZONE;
    }
}

// =============================================================================
// Group Service Functions
// =============================================================================

/**
 * Create a new shared group.
 *
 * Creates a group document with the creator as owner and initial member.
 * Uses server timestamp for createdAt/updatedAt and device timezone.
 *
 * @param db - Firestore instance
 * @param userId - ID of the user creating the group
 * @param appId - Application ID (e.g., 'boletapp')
 * @param input - Group creation parameters
 * @param ownerProfile - Optional profile info for the owner
 * @returns The created SharedGroup with generated ID
 *
 * @throws Error if user has reached MAX_MEMBER_OF_GROUPS limit (BC-1)
 * @throws Error if Firestore write fails
 *
 * @example
 * ```typescript
 * const group = await createGroup(db, 'user-123', 'boletapp', {
 *   name: '🏠 Gastos del Hogar',
 *   transactionSharingEnabled: true,
 * });
 * ```
 */
export async function createGroup(
    db: Firestore,
    userId: string,
    appId: string,
    input: CreateSharedGroupInput,
    ownerProfile?: MemberProfile
): Promise<SharedGroup> {
    // Story 14d-v2-1-4c-2: Defense in depth - verify BC-1 limit server-side
    // This check prevents creating groups even if client-side validation is bypassed
    const currentCount = await getGroupCount(db, userId);
    if (currentCount >= SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS) {
        throw new Error(
            `Cannot create group: user has reached the maximum limit of ${SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS} groups`
        );
    }

    const now = serverTimestamp();
    const shareCode = generateShareCode();

    // Calculate share code expiry (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + SHARED_GROUP_LIMITS.SHARE_CODE_EXPIRY_DAYS);
    const shareCodeExpiresAt = Timestamp.fromDate(expiryDate);

    // Sanitize the group name (XSS protection per Atlas Section 4)
    const sanitizedName = sanitizeInput(input.name, { maxLength: 50 });

    // Build the group document
    // Note: Firestore doesn't allow undefined values, so we conditionally include fields
    const groupData: Omit<SharedGroup, 'id'> = {
        ownerId: userId,
        appId,
        name: sanitizedName,
        color: input.color || DEFAULT_GROUP_COLOR,
        // Only include icon if provided (Firestore rejects undefined values)
        ...(input.icon !== undefined && { icon: input.icon }),
        shareCode,
        shareCodeExpiresAt,
        members: [userId],
        memberUpdates: {},
        // Only include memberProfiles if provided
        ...(ownerProfile && { memberProfiles: { [userId]: ownerProfile } }),
        createdAt: now as unknown as Timestamp,
        updatedAt: now as unknown as Timestamp,
        timezone: getDeviceTimezone(),
        transactionSharingEnabled: input.transactionSharingEnabled,
        transactionSharingLastToggleAt: null,
        transactionSharingToggleCountToday: 0,
    };

    // Create the document in Firestore
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const docRef = await addDoc(groupsRef, groupData);

    // Return the complete group with ID
    return {
        id: docRef.id,
        ...groupData,
    };
}

/**
 * Get all shared groups the user is a member of.
 *
 * Queries groups where the user is in the members array.
 * Returns groups the user owns OR is a member of.
 *
 * @param db - Firestore instance
 * @param userId - ID of the user to get groups for
 * @returns Array of SharedGroup objects (may be empty)
 *
 * @example
 * ```typescript
 * const groups = await getUserGroups(db, 'user-123');
 * console.log(`User belongs to ${groups.length} groups`);
 * ```
 */
export async function getUserGroups(
    db: Firestore,
    userId: string
): Promise<SharedGroup[]> {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(
        groupsRef,
        where('members', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as SharedGroup));
}

/**
 * Get the count of groups the user is a member of.
 *
 * Used for enforcing BC-1 limit (max groups per user).
 * More efficient than fetching all groups when only count is needed.
 *
 * @param db - Firestore instance
 * @param userId - ID of the user to count groups for
 * @returns Number of groups the user belongs to
 *
 * @example
 * ```typescript
 * const count = await getGroupCount(db, 'user-123');
 * if (count >= SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS) {
 *   showError('You have reached the maximum number of groups');
 * }
 * ```
 */
export async function getGroupCount(
    db: Firestore,
    userId: string
): Promise<number> {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(
        groupsRef,
        where('members', 'array-contains', userId)
    );

    // Use getCountFromServer for efficient counting without fetching documents
    const countSnapshot = await getCountFromServer(q);
    return countSnapshot.data().count;
}

/**
 * Check if user can create a new group (BC-1 enforcement).
 *
 * Note: This checks against MAX_MEMBER_OF_GROUPS (10), which is the total
 * number of groups a user can belong to. This includes groups they own
 * plus groups they've joined.
 *
 * @param db - Firestore instance
 * @param userId - ID of the user to check
 * @returns true if user can create more groups, false if at limit
 *
 * @example
 * ```typescript
 * if (await canCreateGroup(db, userId)) {
 *   showCreateGroupDialog();
 * } else {
 *   showLimitReachedMessage();
 * }
 * ```
 */
export async function canCreateGroup(
    db: Firestore,
    userId: string
): Promise<boolean> {
    const count = await getGroupCount(db, userId);
    return count < SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS;
}

/**
 * Get a shared group by its share code.
 *
 * Used for joining groups via share code (manual entry or deep link).
 * Returns the group if found and the share code hasn't expired.
 *
 * @param db - Firestore instance
 * @param shareCode - The 16-character share code
 * @returns The SharedGroup if found, null otherwise
 *
 * @example
 * ```typescript
 * const group = await getGroupByShareCode(db, 'Ab3dEf7hIj9kLm0p');
 * if (group) {
 *   console.log(`Found group: ${group.name}`);
 * }
 * ```
 */
export async function getGroupByShareCode(
    db: Firestore,
    shareCode: string
): Promise<SharedGroup | null> {
    if (!shareCode) {
        return null;
    }

    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(
        groupsRef,
        where('shareCode', '==', shareCode)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const docSnap = snapshot.docs[0];
    return {
        id: docSnap.id,
        ...docSnap.data(),
    } as SharedGroup;
}

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
 * @returns The joined group
 *
 * @throws Error if group not found, user already member, or group full
 *
 * @example
 * ```typescript
 * const group = await joinGroupDirectly(db, 'group-123', 'user-xyz', {
 *   displayName: 'Juan García',
 *   email: 'juan@example.com',
 * });
 * ```
 */
export async function joinGroupDirectly(
    db: Firestore,
    groupId: string,
    userId: string,
    userProfile?: MemberProfile
): Promise<SharedGroup> {
    if (!groupId || !userId) {
        throw new Error('Group ID and user ID are required');
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
 *
 * @example
 * ```typescript
 * await leaveGroup(db, 'user-123', 'group-456');
 * ```
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
 *
 * @example
 * ```typescript
 * await transferOwnership(db, 'current-owner', 'new-owner', 'group-456');
 * ```
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
// Deletion Helper Functions (Story 14d-v2-1-7b)
// =============================================================================

/**
 * Process documents in batches using Firestore writeBatch.
 *
 * Story 14d-v2-1-7b: ECC Review - DRY batch processing
 *
 * Handles Firestore's 500 operation limit per batch by committing
 * when the limit is reached and creating a new batch.
 *
 * @param db - Firestore instance
 * @param docs - Array of document snapshots to process
 * @param operation - Type of batch operation ('update' or 'delete')
 * @param updateData - Data to use for update operations (required if operation is 'update')
 * @returns {Promise<void>}
 *
 * @internal
 */
async function processBatchedOperation(
    db: Firestore,
    docs: Array<{ ref: unknown }>,
    operation: 'update' | 'delete',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateData?: Record<string, any>
): Promise<void> {
    if (docs.length === 0) {
        return;
    }

    let batch = writeBatch(db);
    let operationCount = 0;

    for (const docSnap of docs) {
        if (operation === 'delete') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            batch.delete(docSnap.ref as any);
        } else if (operation === 'update' && updateData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            batch.update(docSnap.ref as any, updateData);
        }
        operationCount++;

        // Commit batch when reaching BATCH_SIZE (500)
        if (operationCount >= BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
        }
    }

    // Commit remaining operations
    if (operationCount > 0) {
        await batch.commit();
    }
}

/**
 * Clear sharedGroupId on all transactions tagged with a specific group.
 *
 * Story 14d-v2-1-7b: Deletion Service Logic
 *
 * Queries all transactions in the user's collection that have sharedGroupId == groupId
 * and sets sharedGroupId to null. Uses batched writes for efficiency.
 *
 * @param db - Firestore instance
 * @param groupId - Group ID to clear from transactions
 * @param memberIds - Array of member user IDs whose transactions should be cleared
 * @param appId - Application ID (e.g., 'boletapp')
 * @returns {Promise<void>}
 *
 * @internal
 */
async function clearTransactionsSharedGroupId(
    db: Firestore,
    groupId: string,
    memberIds: string[],
    appId: string
): Promise<void> {
    for (const memberId of memberIds) {
        // Query transactions for this member with this sharedGroupId
        const transactionsRef = collection(
            db,
            'artifacts',
            appId,
            'users',
            memberId,
            'transactions'
        );
        const q = query(transactionsRef, where('sharedGroupId', '==', groupId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            await processBatchedOperation(db, snapshot.docs, 'update', { sharedGroupId: null });
        }
    }
}

/**
 * Delete all documents in a group's subcollection.
 *
 * Story 14d-v2-1-7b: Deletion Service Logic
 *
 * @param db - Firestore instance
 * @param groupId - Group ID
 * @param subcollectionName - Name of the subcollection to delete
 * @returns {Promise<void>}
 *
 * @internal
 */
async function deleteSubcollection(
    db: Firestore,
    groupId: string,
    subcollectionName: string
): Promise<void> {
    const subcollectionRef = collection(
        db,
        GROUPS_COLLECTION,
        groupId,
        subcollectionName
    );
    const snapshot = await getDocs(subcollectionRef);

    if (!snapshot.empty) {
        await processBatchedOperation(db, snapshot.docs, 'delete');
    }
}

/**
 * Delete all pending invitations for a specific group.
 *
 * Story 14d-v2-1-7b: Deletion Service Logic
 *
 * @param db - Firestore instance
 * @param groupId - Group ID
 * @returns {Promise<void>}
 *
 * @internal
 */
async function deletePendingInvitationsForGroup(
    db: Firestore,
    groupId: string
): Promise<void> {
    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const q = query(invitationsRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        await processBatchedOperation(db, snapshot.docs, 'delete');
    }
}

// =============================================================================
// Group Deletion Functions (Story 14d-v2-1-7b)
// =============================================================================

/**
 * Delete a shared group as the last remaining member.
 *
 * Story 14d-v2-1-7b: Deletion Service Logic (AC #1, #3)
 * ECC Review: TOCTOU fix, appId validation, cascade error handling, audit logging
 *
 * This function is used when a user is the ONLY member of a group and wants to
 * delete it. It performs cascade deletion in the following order:
 * 1. Clear sharedGroupId on user's transactions
 * 2. Delete changelog subcollection (may fail with client SDK - security rules)
 * 3. Delete analytics subcollection
 * 4. Delete pending invitations
 * 5. Delete group document (atomic with membership check via transaction)
 *
 * Validations:
 * - User must be a member of the group
 * - Group must have exactly 1 member (the user)
 * - appId must be in allowlist (prevents path traversal)
 *
 * @param db - Firestore instance
 * @param userId - ID of the user deleting the group (must be last member)
 * @param groupId - ID of the group to delete
 * @param appId - Application ID (defaults to 'boletapp')
 * @returns {Promise<void>}
 *
 * @throws Error if user ID or group ID is empty
 * @throws Error if appId is invalid
 * @throws Error if group not found
 * @throws Error if user is not a member of the group
 * @throws Error if group has multiple members
 *
 * @example
 * ```typescript
 * // User is the only member left, can delete the group
 * await deleteGroupAsLastMember(db, 'user-123', 'group-456');
 * ```
 */
export async function deleteGroupAsLastMember(
    db: Firestore,
    userId: string,
    groupId: string,
    appId: string = 'boletapp'
): Promise<void> {
    // Input validation
    if (!userId || !groupId) {
        throw new Error('User ID and group ID are required');
    }

    // ECC Review: HIGH severity fix - validate appId to prevent path traversal
    if (!validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

    // Audit log: Deletion initiated
    if (import.meta.env.DEV) {
        console.log('[groupService] deleteGroupAsLastMember initiated', {
            userId,
            groupId,
            appId,
            timestamp: new Date().toISOString(),
        });
    }

    // Get the group document for validation and cascade operations
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
        throw new Error('Group not found');
    }

    const group = groupSnap.data() as SharedGroup;

    // Verify user is a member
    if (!group.members?.includes(userId)) {
        throw new Error('You are not a member of this group');
    }

    // Verify user is the ONLY member (AC #1)
    if (group.members.length > 1) {
        throw new Error('Cannot delete group with other members');
    }

    // Execute cascade cleanup (idempotent operations - safe outside transaction)
    // ARCHITECTURAL NOTE: Cascade operations run outside the final transaction because:
    // 1. Firestore transactions have a 500 operation limit - cascade may exceed this
    // 2. Operations are idempotent - re-running is safe if transaction fails
    // 3. Final transaction re-validates membership atomically before delete
    // Trade-off: If transaction fails after cascade, data may be inconsistent until retry
    try {
        // 1. Clear sharedGroupId on all user's transactions
        await clearTransactionsSharedGroupId(db, groupId, [userId], appId);

        // 2. Delete changelog subcollection (may fail with client SDK due to security rules)
        // ECC Review: HIGH severity fix - handle expected security rule failure
        try {
            await deleteSubcollection(db, groupId, CHANGELOG_SUBCOLLECTION);
        } catch (changelogError) {
            // Changelog deletion fails with client SDK because security rules forbid it
            // (allow delete: if false). TTL cleanup (30 days) handles orphaned entries.
            if (import.meta.env.DEV) {
                console.warn('[groupService] Changelog deletion failed (expected with client SDK):', changelogError);
            }
            // Continue - not a blocker
        }

        // 3. Delete analytics subcollection (may fail with client SDK due to security rules)
        try {
            await deleteSubcollection(db, groupId, ANALYTICS_SUBCOLLECTION);
        } catch (analyticsError) {
            // Analytics deletion may fail if security rules don't allow access
            // Continue - not a blocker (subcollection may not exist or rules block access)
            if (import.meta.env.DEV) {
                console.warn('[groupService] Analytics deletion failed (may be expected):', analyticsError);
            }
        }

        // 4. Delete pending invitations for the group
        await deletePendingInvitationsForGroup(db, groupId);
    } catch (cascadeError) {
        // ECC Review: MEDIUM severity fix - structured logging for cascade failures
        if (import.meta.env.DEV) {
            console.error('[groupService] Cascade cleanup partial failure:', {
                groupId,
                error: cascadeError,
            });
        }
        // Re-throw to prevent orphaned group document
        throw cascadeError;
    }

    // 5. Delete group document with atomic membership check
    // ECC Review: CRITICAL fix - wrap auth check + delete in transaction to prevent TOCTOU
    await runTransaction(db, async (transaction) => {
        const groupSnapInTx = await transaction.get(groupRef);

        if (!groupSnapInTx.exists()) {
            throw new Error('Group not found');
        }

        const groupInTx = groupSnapInTx.data() as SharedGroup;

        // Re-verify user is still the only member (atomic with delete)
        if (!groupInTx.members?.includes(userId)) {
            throw new Error('You are not a member of this group');
        }

        if (groupInTx.members.length > 1) {
            throw new Error('Cannot delete group with other members');
        }

        transaction.delete(groupRef);
    });

    // Audit log: Deletion completed
    if (import.meta.env.DEV) {
        console.log('[groupService] deleteGroupAsLastMember completed', {
            userId,
            groupId,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Delete a shared group as the owner (force delete).
 *
 * Story 14d-v2-1-7b: Deletion Service Logic (AC #2, #3, #4)
 * ECC Review: TOCTOU fix, appId validation, cascade error handling, audit logging
 *
 * This function allows the group owner to delete the group regardless of
 * how many members it has. It performs cascade deletion in the following order:
 * 1. Clear sharedGroupId on ALL members' transactions
 * 2. Delete changelog subcollection (may fail with client SDK - security rules)
 * 3. Delete analytics subcollection
 * 4. Delete pending invitations
 * 5. Delete group document (atomic with ownership check via transaction)
 *
 * AC #4: Only the owner can call this function.
 *
 * @param db - Firestore instance
 * @param ownerId - ID of the user deleting the group (must be owner)
 * @param groupId - ID of the group to delete
 * @param appId - Application ID (defaults to 'boletapp')
 * @returns {Promise<void>}
 *
 * @throws Error if owner ID or group ID is empty
 * @throws Error if appId is invalid
 * @throws Error if group not found
 * @throws Error if user is not the owner (AC #4)
 *
 * @example
 * ```typescript
 * // Owner deletes the group, affecting all members
 * await deleteGroupAsOwner(db, 'owner-123', 'group-456');
 * ```
 */
export async function deleteGroupAsOwner(
    db: Firestore,
    ownerId: string,
    groupId: string,
    appId: string = 'boletapp'
): Promise<void> {
    // Input validation
    if (!ownerId || !groupId) {
        throw new Error('Owner ID and group ID are required');
    }

    // ECC Review: HIGH severity fix - validate appId to prevent path traversal
    if (!validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

    // Audit log: Deletion initiated
    if (import.meta.env.DEV) {
        console.log('[groupService] deleteGroupAsOwner initiated', {
            ownerId,
            groupId,
            appId,
            timestamp: new Date().toISOString(),
        });
    }

    // Get the group document for validation and cascade operations
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
        throw new Error('Group not found');
    }

    const group = groupSnap.data() as SharedGroup;

    // ECC Review 2026-02-02: HIGH severity fix - validate ownership BEFORE cascade operations
    // This prevents unauthorized users from triggering transaction updates on other members' data
    // even though the final delete would fail in the transaction
    if (group.ownerId !== ownerId) {
        throw new Error('Only the group owner can delete the group');
    }

    const memberIds = group.members || [];

    // Execute cascade cleanup (idempotent operations - safe outside transaction)
    // ARCHITECTURAL NOTE: Cascade operations run outside the final transaction because:
    // 1. Firestore transactions have a 500 operation limit - cascade may exceed this
    // 2. Operations are idempotent - re-running is safe if transaction fails
    // 3. Final transaction re-validates ownership atomically before delete
    // Trade-off: If transaction fails after cascade, data may be inconsistent until retry
    try {
        // 1. Clear sharedGroupId on ALL members' transactions
        await clearTransactionsSharedGroupId(db, groupId, memberIds, appId);

        // 2. Delete changelog subcollection (may fail with client SDK due to security rules)
        // ECC Review: HIGH severity fix - handle expected security rule failure
        try {
            await deleteSubcollection(db, groupId, CHANGELOG_SUBCOLLECTION);
        } catch (changelogError) {
            // Changelog deletion fails with client SDK because security rules forbid it
            // (allow delete: if false). TTL cleanup (30 days) handles orphaned entries.
            if (import.meta.env.DEV) {
                console.warn('[groupService] Changelog deletion failed (expected with client SDK):', changelogError);
            }
            // Continue - not a blocker
        }

        // 3. Delete analytics subcollection (may fail with client SDK due to security rules)
        try {
            await deleteSubcollection(db, groupId, ANALYTICS_SUBCOLLECTION);
        } catch (analyticsError) {
            // Analytics deletion may fail if security rules don't allow access
            // Continue - not a blocker (subcollection may not exist or rules block access)
            if (import.meta.env.DEV) {
                console.warn('[groupService] Analytics deletion failed (may be expected):', analyticsError);
            }
        }

        // 4. Delete pending invitations for the group
        await deletePendingInvitationsForGroup(db, groupId);
    } catch (cascadeError) {
        // ECC Review: MEDIUM severity fix - structured logging for cascade failures
        if (import.meta.env.DEV) {
            console.error('[groupService] Cascade cleanup partial failure:', {
                groupId,
                error: cascadeError,
            });
        }
        // Re-throw to prevent orphaned group document
        throw cascadeError;
    }

    // 5. Delete group document with atomic ownership check
    // ECC Review: CRITICAL fix - wrap auth check + delete in transaction to prevent TOCTOU
    await runTransaction(db, async (transaction) => {
        const groupSnapInTx = await transaction.get(groupRef);

        if (!groupSnapInTx.exists()) {
            throw new Error('Group not found');
        }

        const groupInTx = groupSnapInTx.data() as SharedGroup;

        // AC #4: Verify user is the owner (atomic with delete)
        if (groupInTx.ownerId !== ownerId) {
            throw new Error('Only the group owner can delete the group');
        }

        transaction.delete(groupRef);
    });

    // Audit log: Deletion completed
    if (import.meta.env.DEV) {
        console.log('[groupService] deleteGroupAsOwner completed', {
            ownerId,
            groupId,
            membersAffected: memberIds.length,
            timestamp: new Date().toISOString(),
        });
    }
}

// =============================================================================
// Update Group Function (Story 14d-v2-1-7g)
// =============================================================================

/**
 * Update shared group settings (name, icon, color).
 *
 * Story 14d-v2-1-7g: Edit Group Settings
 *
 * Allows the group owner to update the group's display properties.
 * Validates:
 * - User is the group owner
 * - Name is 2-50 characters (sanitized for XSS)
 * - Icon is in the allowed whitelist
 * - Color is in the allowed whitelist
 *
 * @param db - Firestore instance
 * @param groupId - ID of the group to update
 * @param userId - ID of the user attempting the update (must be owner)
 * @param updates - Fields to update (name, icon, color)
 *
 * @throws Error if group not found
 * @throws Error if user is not the owner
 * @throws Error if name validation fails
 * @throws Error if icon/color not in whitelist
 * @throws Error if no valid updates provided
 *
 * @example
 * ```typescript
 * await updateGroup(db, 'group-123', 'owner-uid', {
 *   name: 'Updated Name',
 *   icon: '🚗',
 *   color: '#3b82f6',
 * });
 * ```
 */
export async function updateGroup(
    db: Firestore,
    groupId: string,
    userId: string,
    updates: UpdateSharedGroupInput
): Promise<void> {
    // Input validation
    if (!groupId || !userId) {
        throw new Error('Group ID and user ID are required');
    }

    // Build the update object with validation BEFORE transaction
    // (validation doesn't require database state)
    const updateData: Record<string, unknown> = {};

    // Validate and sanitize name if provided
    if (updates.name !== undefined) {
        const sanitizedName = sanitizeInput(updates.name, { maxLength: 50 });
        if (sanitizedName.length < 2 || sanitizedName.length > 50) {
            throw new Error('Group name must be between 2 and 50 characters');
        }
        updateData.name = sanitizedName;
    }

    // Validate icon against whitelist if provided
    if (updates.icon !== undefined) {
        if (!GROUP_ICONS.includes(updates.icon)) {
            throw new Error('Invalid icon: not in allowed icon list');
        }
        updateData.icon = updates.icon;
    }

    // Validate color against whitelist if provided
    if (updates.color !== undefined) {
        if (!GROUP_COLORS.includes(updates.color)) {
            throw new Error('Invalid color: not in allowed color palette');
        }
        updateData.color = updates.color;
    }

    // Check if there are any valid updates
    if (Object.keys(updateData).length === 0) {
        throw new Error('No updates provided');
    }

    // Add updatedAt timestamp
    updateData.updatedAt = serverTimestamp();

    // ECC Review Fix: Use transaction to prevent TOCTOU vulnerability
    // Ownership check and update are now atomic
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);

    await runTransaction(db, async (transaction) => {
        const groupSnap = await transaction.get(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const group = groupSnap.data() as SharedGroup;

        // Verify user is the owner (atomic with update)
        if (group.ownerId !== userId) {
            throw new Error('Only the group owner can update group settings');
        }

        transaction.update(groupRef, updateData);
    });

    // Audit log in development
    if (import.meta.env.DEV) {
        console.log('[groupService] updateGroup completed', {
            groupId,
            userId,
            fieldsUpdated: Object.keys(updateData).filter(k => k !== 'updatedAt'),
            timestamp: new Date().toISOString(),
        });
    }
}
