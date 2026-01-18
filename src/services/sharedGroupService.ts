/**
 * Shared Group Service
 *
 * Story 14c.1: Create Shared Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Firestore CRUD operations for shared groups (multi-user access).
 * Shared groups are stored at top-level: sharedGroups/{groupId}
 *
 * Architecture: Option 4 - Hybrid Model
 * - SharedGroup document at top-level for cross-user access
 * - Transactions stay in user's subcollection with sharedGroupIds[] reference
 *
 * @example
 * ```typescript
 * // Create a shared group from a custom group
 * const sharedGroup = await createSharedGroup(db, userId, appId, {
 *   name: 'Gastos del Hogar',
 *   color: '#10b981',
 * });
 *
 * // Generate a shareable link
 * const shareLink = getShareLink(sharedGroup.shareCode);
 * // "https://boletapp.web.app/join/Ab3dEf7hIj9kLm0p"
 * ```
 */

import { nanoid } from 'nanoid';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    deleteField,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    query,
    where,
    orderBy,
    limit,
    Firestore,
    Unsubscribe,
    writeBatch,
    arrayUnion,
    arrayRemove,
} from 'firebase/firestore';
import type {
    SharedGroup,
    CreateSharedGroupInput,
    UpdateSharedGroupInput,
    SharedGroupPreview,
} from '../types/sharedGroup';
import { SHARED_GROUP_LIMITS } from '../types/sharedGroup';
import { LISTENER_LIMITS } from './firestore';

// ============================================================================
// Constants
// ============================================================================

/** Collection path for shared groups (top-level) */
const SHARED_GROUPS_COLLECTION = 'sharedGroups';

/** Base URL for share links */
const SHARE_LINK_BASE_URL = 'https://boletapp.web.app/join';

// ============================================================================
// Share Code Utilities
// ============================================================================

/**
 * Generate a cryptographically random share code.
 *
 * @returns 16-character nanoid string
 */
export function generateShareCode(): string {
    return nanoid(SHARED_GROUP_LIMITS.SHARE_CODE_LENGTH);
}

/**
 * Calculate share code expiry timestamp.
 *
 * @returns Timestamp 7 days from now
 */
export function getShareCodeExpiry(): Timestamp {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + SHARED_GROUP_LIMITS.SHARE_CODE_EXPIRY_DAYS);
    return Timestamp.fromDate(expiryDate);
}

/**
 * Build the full share link URL.
 *
 * @param shareCode 16-character share code
 * @returns Full URL like "https://boletapp.web.app/join/Ab3dEf7hIj9kLm0p"
 */
export function getShareLink(shareCode: string): string {
    return `${SHARE_LINK_BASE_URL}/${shareCode}`;
}

/**
 * Check if a share code has expired.
 *
 * @param expiresAt Expiry timestamp
 * @returns true if expired
 */
export function isShareCodeExpired(expiresAt: Timestamp | null): boolean {
    if (!expiresAt) return true;
    const expiryDate = expiresAt.toDate();
    return new Date() > expiryDate;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new shared group from custom group data.
 *
 * Creates a top-level document in sharedGroups/{groupId} with the owner
 * as the initial (and only) member.
 *
 * @param db Firestore instance
 * @param userId User ID (becomes owner)
 * @param appId App ID (e.g., 'boletapp')
 * @param input Group creation data (name, color, icon)
 * @returns Created SharedGroup with generated ID and share code
 */
export async function createSharedGroup(
    db: Firestore,
    userId: string,
    appId: string,
    input: CreateSharedGroupInput,
    ownerProfile?: { displayName?: string; email?: string; photoURL?: string }
): Promise<SharedGroup> {
    const collectionRef = collection(db, SHARED_GROUPS_COLLECTION);

    const shareCode = generateShareCode();
    const shareCodeExpiresAt = getShareCodeExpiry();
    const now = serverTimestamp();

    const groupData: Record<string, unknown> = {
        ownerId: userId,
        appId,
        name: input.name.trim(),
        color: input.color || '#10b981', // Default emerald color
        icon: input.icon || null,
        shareCode,
        shareCodeExpiresAt,
        members: [userId], // Owner is first member
        memberUpdates: {
            [userId]: {
                lastSyncAt: now,
                unreadCount: 0,
            },
        },
        createdAt: now,
        updatedAt: now,
    };

    // Store owner's profile if provided
    if (ownerProfile) {
        groupData.memberProfiles = {
            [userId]: {
                displayName: ownerProfile.displayName || null,
                email: ownerProfile.email || null,
                photoURL: ownerProfile.photoURL || null,
            },
        };
    }

    const docRef = await addDoc(collectionRef, groupData);

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] createSharedGroup SUCCESS:', {
            id: docRef.id,
            name: input.name,
            shareCode,
            shareLink: getShareLink(shareCode),
        });
    }

    return {
        id: docRef.id,
        ...groupData,
        // Convert serverTimestamp placeholders to actual Timestamps for return
        shareCodeExpiresAt,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    } as SharedGroup;
}

/**
 * Get a shared group by ID.
 *
 * @param db Firestore instance
 * @param groupId Shared group document ID
 * @returns SharedGroup or null if not found
 */
export async function getSharedGroup(
    db: Firestore,
    groupId: string
): Promise<SharedGroup | null> {
    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
    } as SharedGroup;
}

/**
 * Get a shared group by share code (for join flow).
 *
 * @param db Firestore instance
 * @param shareCode 16-character share code
 * @returns SharedGroup or null if not found or expired
 */
export async function getSharedGroupByShareCode(
    db: Firestore,
    shareCode: string
): Promise<SharedGroup | null> {
    const collectionRef = collection(db, SHARED_GROUPS_COLLECTION);
    const q = query(
        collectionRef,
        where('shareCode', '==', shareCode),
        limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const groupDoc = snapshot.docs[0];
    return {
        id: groupDoc.id,
        ...groupDoc.data(),
    } as SharedGroup;
}

/**
 * Get preview info for a shared group (for join confirmation).
 * Excludes sensitive member data.
 *
 * @param db Firestore instance
 * @param shareCode 16-character share code
 * @returns SharedGroupPreview or null if not found
 */
export async function getSharedGroupPreview(
    db: Firestore,
    shareCode: string
): Promise<SharedGroupPreview | null> {
    const group = await getSharedGroupByShareCode(db, shareCode);

    if (!group) {
        return null;
    }

    return {
        id: group.id!,
        name: group.name,
        color: group.color,
        icon: group.icon,
        memberCount: group.members.length,
        isExpired: isShareCodeExpired(group.shareCodeExpiresAt),
    };
}

/**
 * Error types for join operations.
 */
export type JoinError =
    | 'CODE_NOT_FOUND'
    | 'CODE_EXPIRED'
    | 'GROUP_FULL'
    | 'ALREADY_MEMBER';

/**
 * Join a shared group using a share code.
 *
 * Story 14c.4: Join by share code (alternative to link-based join)
 * Uses batch write to atomically:
 * 1. Add user to group.members[]
 * 2. Add groupId to user's memberOfSharedGroups[] profile field
 * 3. Set group.memberUpdates[userId] timestamp
 *
 * @param db Firestore instance
 * @param userId User ID of the person joining
 * @param appId App ID (e.g., 'boletapp')
 * @param shareCode 16-character share code
 * @returns The group name on success
 * @throws Error with JoinError type message
 */
export async function joinByShareCode(
    db: Firestore,
    userId: string,
    appId: string,
    shareCode: string,
    userProfile?: { displayName?: string; email?: string; photoURL?: string }
): Promise<{ groupName: string; groupId: string }> {
    // 1. Trim whitespace from share code (dashes are valid nanoid characters)
    const normalizedCode = shareCode.trim();

    // 2. Find the group by share code
    const group = await getSharedGroupByShareCode(db, normalizedCode);

    if (!group) {
        throw new Error('CODE_NOT_FOUND');
    }

    // 3. Check if code is expired
    if (isShareCodeExpired(group.shareCodeExpiresAt)) {
        throw new Error('CODE_EXPIRED');
    }

    // 4. Check if user is already a member
    if (group.members.includes(userId)) {
        throw new Error('ALREADY_MEMBER');
    }

    // 5. Check if group is full
    if (group.members.length >= SHARED_GROUP_LIMITS.MAX_MEMBERS_PER_GROUP) {
        throw new Error('GROUP_FULL');
    }

    // 6. Perform batch write
    const batch = writeBatch(db);

    // 6a. Add user to group members and store their profile
    const groupRef = doc(db, SHARED_GROUPS_COLLECTION, group.id!);
    const updateData: Record<string, unknown> = {
        members: arrayUnion(userId),
        [`memberUpdates.${userId}`]: {
            lastSyncAt: serverTimestamp(),
            unreadCount: 0,
        },
        updatedAt: serverTimestamp(),
    };

    // Store member profile if provided
    if (userProfile) {
        updateData[`memberProfiles.${userId}`] = {
            displayName: userProfile.displayName || null,
            email: userProfile.email || null,
            photoURL: userProfile.photoURL || null,
        };
    }

    batch.update(groupRef, updateData);

    // 6b. Add groupId to user's profile (memberOfSharedGroups)
    const profileRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/settings`);
    batch.set(profileRef, {
        memberOfSharedGroups: arrayUnion(group.id),
    }, { merge: true });

    await batch.commit();

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] joinByShareCode SUCCESS:', {
            userId,
            groupId: group.id,
            groupName: group.name,
        });
    }

    return { groupName: group.name, groupId: group.id! };
}

/**
 * Get all shared groups a user is a member of.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @returns Array of SharedGroups where user is a member
 */
export async function getSharedGroupsForUser(
    db: Firestore,
    userId: string
): Promise<SharedGroup[]> {
    const collectionRef = collection(db, SHARED_GROUPS_COLLECTION);
    const q = query(
        collectionRef,
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(LISTENER_LIMITS.GROUPS)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as SharedGroup[];
}

/**
 * Subscribe to real-time updates of shared groups a user is a member of.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param onUpdate Callback when groups change
 * @param onError Optional error callback
 * @returns Unsubscribe function
 */
export function subscribeToSharedGroups(
    db: Firestore,
    userId: string,
    onUpdate: (groups: SharedGroup[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const collectionRef = collection(db, SHARED_GROUPS_COLLECTION);
    const q = query(
        collectionRef,
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(LISTENER_LIMITS.GROUPS)
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const groups = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as SharedGroup[];

            // Dev-mode logging
            if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.GROUPS) {
                console.warn(
                    `[sharedGroupService] subscribeToSharedGroups: ${snapshot.size} docs at limit`
                );
            }

            onUpdate(groups);
        },
        (error) => {
            console.error('[sharedGroupService] Subscription error:', error);
            onError?.(error);
        }
    );
}

/**
 * Subscribe to a single shared group's updates.
 *
 * @param db Firestore instance
 * @param groupId Shared group document ID
 * @param onUpdate Callback when group changes
 * @param onError Optional error callback
 * @returns Unsubscribe function
 */
export function subscribeToSharedGroup(
    db: Firestore,
    groupId: string,
    onUpdate: (group: SharedGroup | null) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);

    return onSnapshot(
        docRef,
        (snapshot) => {
            if (!snapshot.exists()) {
                onUpdate(null);
                return;
            }

            onUpdate({
                id: snapshot.id,
                ...snapshot.data(),
            } as SharedGroup);
        },
        (error) => {
            console.error('[sharedGroupService] subscribeToSharedGroup error:', error);
            onError?.(error);
        }
    );
}

/**
 * Update a shared group's metadata.
 * Only the owner can perform this operation.
 *
 * @param db Firestore instance
 * @param groupId Shared group document ID
 * @param updates Fields to update (name, color, icon)
 */
export async function updateSharedGroup(
    db: Firestore,
    groupId: string,
    updates: UpdateSharedGroupInput
): Promise<void> {
    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);

    const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) {
        updateData.name = updates.name.trim();
    }
    if (updates.color !== undefined) {
        updateData.color = updates.color;
    }
    if (updates.icon !== undefined) {
        updateData.icon = updates.icon;
    }

    await updateDoc(docRef, updateData);
}

/**
 * Regenerate a shared group's share code.
 * Useful when the old code expired or was compromised.
 * Only the owner can perform this operation.
 *
 * @param db Firestore instance
 * @param groupId Shared group document ID
 * @returns New share code
 */
export async function regenerateShareCode(
    db: Firestore,
    groupId: string
): Promise<string> {
    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    const newShareCode = generateShareCode();
    const newExpiry = getShareCodeExpiry();

    await updateDoc(docRef, {
        shareCode: newShareCode,
        shareCodeExpiresAt: newExpiry,
        updatedAt: serverTimestamp(),
    });

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] regenerateShareCode SUCCESS:', {
            groupId,
            newShareCode,
            newShareLink: getShareLink(newShareCode),
        });
    }

    return newShareCode;
}

/**
 * Delete a shared group.
 * Only the owner can perform this operation.
 *
 * Note: This does NOT remove sharedGroupIds from transactions.
 * Caller should handle transaction cleanup separately.
 *
 * @param db Firestore instance
 * @param groupId Shared group document ID
 */
export async function deleteSharedGroup(
    db: Firestore,
    groupId: string
): Promise<void> {
    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    await deleteDoc(docRef);
}

// ============================================================================
// Member Management (For Story 14c.2: Join Group)
// ============================================================================

/**
 * Add a member to a shared group.
 * Used in join flow when user accepts invitation.
 *
 * @param db Firestore instance
 * @param groupId Shared group document ID
 * @param userId New member's user ID
 */
export async function addMemberToGroup(
    db: Firestore,
    groupId: string,
    userId: string
): Promise<void> {
    const group = await getSharedGroup(db, groupId);

    if (!group) {
        throw new Error('Shared group not found');
    }

    if (group.members.includes(userId)) {
        throw new Error('User is already a member of this group');
    }

    if (group.members.length >= SHARED_GROUP_LIMITS.MAX_MEMBERS_PER_GROUP) {
        throw new Error('Group has reached maximum member limit');
    }

    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, {
        members: [...group.members, userId],
        [`memberUpdates.${userId}`]: {
            lastSyncAt: serverTimestamp(),
            unreadCount: 0,
        },
        updatedAt: serverTimestamp(),
    });
}

/**
 * Remove a member from a shared group.
 * Used when a user leaves or is removed by owner.
 *
 * @param db Firestore instance
 * @param groupId Shared group document ID
 * @param userId Member's user ID to remove
 */
export async function removeMemberFromGroup(
    db: Firestore,
    groupId: string,
    userId: string
): Promise<void> {
    const group = await getSharedGroup(db, groupId);

    if (!group) {
        throw new Error('Shared group not found');
    }

    if (group.ownerId === userId) {
        throw new Error('Cannot remove owner from group. Transfer ownership first or delete the group.');
    }

    const newMembers = group.members.filter(m => m !== userId);

    // Remove member's sync data
    const newMemberUpdates = { ...group.memberUpdates };
    delete newMemberUpdates[userId];

    const docRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, {
        members: newMembers,
        memberUpdates: newMemberUpdates,
        updatedAt: serverTimestamp(),
    });
}

// ============================================================================
// Story 14c.2: Accept/Decline Invitation
// ============================================================================

/** Collection path for pending invitations */
const PENDING_INVITATIONS_COLLECTION = 'pendingInvitations';

/**
 * Error types for invitation operations.
 */
export type InvitationError =
    | 'GROUP_NOT_FOUND'
    | 'GROUP_FULL'
    | 'ALREADY_MEMBER'
    | 'INVITATION_EXPIRED'
    | 'INVITATION_NOT_FOUND';

/**
 * Accept a pending invitation to join a shared group.
 *
 * Story 14c.2 AC5: Accept invitation flow
 * Uses batch write to atomically:
 * 1. Add user to group.members[]
 * 2. Add groupId to user's memberOfSharedGroups[] profile field
 * 3. Set group.memberUpdates[userId] timestamp
 * 4. Update invitation status to 'accepted'
 *
 * @param db Firestore instance
 * @param userId User ID of the person accepting
 * @param appId App ID (e.g., 'boletapp')
 * @param invitationId Pending invitation document ID
 * @returns The group name on success
 * @throws Error with InvitationError type message
 */
export async function acceptInvitation(
    db: Firestore,
    userId: string,
    appId: string,
    invitationId: string
): Promise<{ groupName: string }> {
    // 1. Get the invitation
    const inviteRef = doc(db, PENDING_INVITATIONS_COLLECTION, invitationId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
        throw new Error('INVITATION_NOT_FOUND');
    }

    const invitation = inviteSnap.data();

    // 2. Check if invitation is expired
    if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
        throw new Error('INVITATION_EXPIRED');
    }

    // 3. Get the group
    const group = await getSharedGroup(db, invitation.groupId);

    if (!group) {
        throw new Error('GROUP_NOT_FOUND');
    }

    // 4. Check if user is already a member
    if (group.members.includes(userId)) {
        throw new Error('ALREADY_MEMBER');
    }

    // 5. Check if group is full
    if (group.members.length >= SHARED_GROUP_LIMITS.MAX_MEMBERS_PER_GROUP) {
        throw new Error('GROUP_FULL');
    }

    // 6. Perform batch write
    const batch = writeBatch(db);

    // 6a. Add user to group members
    const groupRef = doc(db, SHARED_GROUPS_COLLECTION, invitation.groupId);
    batch.update(groupRef, {
        members: arrayUnion(userId),
        [`memberUpdates.${userId}`]: {
            lastSyncAt: serverTimestamp(),
            unreadCount: 0,
        },
        updatedAt: serverTimestamp(),
    });

    // 6b. Add groupId to user's profile (memberOfSharedGroups)
    const profileRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/settings`);
    batch.set(profileRef, {
        memberOfSharedGroups: arrayUnion(invitation.groupId),
    }, { merge: true });

    // 6c. Mark invitation as accepted
    batch.update(inviteRef, {
        status: 'accepted',
    });

    await batch.commit();

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] acceptInvitation SUCCESS:', {
            userId,
            groupId: invitation.groupId,
            groupName: invitation.groupName,
        });
    }

    return { groupName: invitation.groupName };
}

/**
 * Decline a pending invitation.
 *
 * Story 14c.2 AC6: Decline invitation flow
 * Simply updates the invitation status to 'declined'.
 *
 * @param db Firestore instance
 * @param invitationId Pending invitation document ID
 */
export async function declineInvitation(
    db: Firestore,
    invitationId: string
): Promise<void> {
    const inviteRef = doc(db, PENDING_INVITATIONS_COLLECTION, invitationId);

    await updateDoc(inviteRef, {
        status: 'declined',
    });

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] declineInvitation SUCCESS:', { invitationId });
    }
}

/**
 * Create a pending invitation for a user to join a shared group.
 *
 * Story 14c.1: Create Shared Group (inviteByEmail from InviteMembersDialog)
 * Story 14c.2: Accept/Decline Invitation (this creates the invitation document)
 *
 * @param db Firestore instance
 * @param group The shared group to invite to
 * @param invitedEmail Email address of the user to invite
 * @param invitedByUserId User ID of the person sending the invite
 * @param invitedByName Display name of the inviter
 * @returns The created invitation document ID
 */
export async function createPendingInvitation(
    db: Firestore,
    group: SharedGroup,
    invitedEmail: string,
    invitedByUserId: string,
    invitedByName: string
): Promise<string> {
    const collectionRef = collection(db, PENDING_INVITATIONS_COLLECTION);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + SHARED_GROUP_LIMITS.SHARE_CODE_EXPIRY_DAYS);

    const invitationData = {
        groupId: group.id!,
        groupName: group.name,
        groupColor: group.color,
        groupIcon: group.icon || null,
        invitedEmail: invitedEmail.toLowerCase().trim(),
        invitedByUserId,
        invitedByName,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiryDate),
        status: 'pending',
    };

    const docRef = await addDoc(collectionRef, invitationData);

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] createPendingInvitation SUCCESS:', {
            id: docRef.id,
            groupName: group.name,
            invitedEmail: invitedEmail.toLowerCase(),
        });
    }

    return docRef.id;
}

// ============================================================================
// Story 14c.3: Leave Group / Manage Group
// ============================================================================

/**
 * Error types for leave/manage group operations.
 */
export type LeaveGroupError =
    | 'GROUP_NOT_FOUND'
    | 'NOT_A_MEMBER'
    | 'OWNER_CANNOT_LEAVE'
    | 'NOT_OWNER'
    | 'CANNOT_TRANSFER_TO_SELF'
    | 'TARGET_NOT_MEMBER';

/**
 * Leave a shared group with SOFT leave mode.
 *
 * Story 14c.3 AC2: Soft leave
 * - Removes user from group.members[]
 * - Removes user's memberUpdates entry
 * - Updates user's memberOfSharedGroups[] profile field
 * - Transactions remain tagged with sharedGroupIds[] (read-only to others)
 *
 * @param db Firestore instance
 * @param userId User ID of the member leaving
 * @param appId App ID (e.g., 'boletapp')
 * @param groupId Shared group document ID
 * @throws Error with LeaveGroupError type message
 */
export async function leaveGroupSoft(
    db: Firestore,
    userId: string,
    appId: string,
    groupId: string
): Promise<void> {
    // 1. Get the group
    const group = await getSharedGroup(db, groupId);

    if (!group) {
        throw new Error('GROUP_NOT_FOUND');
    }

    // 2. Check user is a member
    if (!group.members.includes(userId)) {
        throw new Error('NOT_A_MEMBER');
    }

    // 3. Owner cannot leave (must transfer ownership first)
    if (group.ownerId === userId) {
        throw new Error('OWNER_CANNOT_LEAVE');
    }

    // 4. Perform batch write
    const batch = writeBatch(db);

    // 4a. Remove user from group members and memberUpdates
    const groupRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    batch.update(groupRef, {
        members: arrayRemove(userId),
        [`memberUpdates.${userId}`]: deleteField(),
        updatedAt: serverTimestamp(),
    });

    // 4b. Remove groupId from user's profile
    const profileRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/settings`);
    batch.set(profileRef, {
        memberOfSharedGroups: arrayRemove(groupId),
    }, { merge: true });

    await batch.commit();

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] leaveGroupSoft SUCCESS:', {
            userId,
            groupId,
            groupName: group.name,
        });
    }
}

/**
 * Leave a shared group with HARD leave mode.
 *
 * Story 14c.3 AC3: Hard leave
 * - Removes user from group.members[]
 * - Removes user's memberUpdates entry
 * - Updates user's memberOfSharedGroups[] profile field
 * - Removes groupId from ALL user's transactions' sharedGroupIds[]
 *
 * @param db Firestore instance
 * @param userId User ID of the member leaving
 * @param appId App ID (e.g., 'boletapp')
 * @param groupId Shared group document ID
 * @throws Error with LeaveGroupError type message
 */
export async function leaveGroupHard(
    db: Firestore,
    userId: string,
    appId: string,
    groupId: string
): Promise<void> {
    // 1. Get the group
    const group = await getSharedGroup(db, groupId);

    if (!group) {
        throw new Error('GROUP_NOT_FOUND');
    }

    // 2. Check user is a member
    if (!group.members.includes(userId)) {
        throw new Error('NOT_A_MEMBER');
    }

    // 3. Owner cannot leave (must transfer ownership first)
    if (group.ownerId === userId) {
        throw new Error('OWNER_CANNOT_LEAVE');
    }

    // 4. First, remove the groupId from user's transactions
    await untagUserTransactions(db, userId, appId, groupId);

    // 5. Perform batch write for group and profile updates
    const batch = writeBatch(db);

    // 5a. Remove user from group members and memberUpdates
    const groupRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    batch.update(groupRef, {
        members: arrayRemove(userId),
        [`memberUpdates.${userId}`]: deleteField(),
        updatedAt: serverTimestamp(),
    });

    // 5b. Remove groupId from user's profile
    const profileRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/settings`);
    batch.set(profileRef, {
        memberOfSharedGroups: arrayRemove(groupId),
    }, { merge: true });

    await batch.commit();

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] leaveGroupHard SUCCESS:', {
            userId,
            groupId,
            groupName: group.name,
        });
    }
}

/**
 * Helper: Remove a groupId from all user's transactions' sharedGroupIds[].
 * Used for hard leave and when owner deletes group.
 *
 * Note: This may need to handle batching for users with many transactions.
 * Firestore batch limit is 500 operations.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param groupId Group ID to remove from transactions
 */
async function untagUserTransactions(
    db: Firestore,
    userId: string,
    appId: string,
    groupId: string
): Promise<void> {
    // Query all user's transactions that have this groupId in sharedGroupIds
    const transactionsRef = collection(db, `artifacts/${appId}/users/${userId}/transactions`);
    const q = query(
        transactionsRef,
        where('sharedGroupIds', 'array-contains', groupId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return; // No transactions to update
    }

    // Process in batches of 500 (Firestore batch limit)
    const BATCH_SIZE = 500;
    let batch = writeBatch(db);
    let operationCount = 0;

    for (const docSnapshot of snapshot.docs) {
        batch.update(docSnapshot.ref, {
            sharedGroupIds: arrayRemove(groupId),
        });
        operationCount++;

        // Commit batch if we hit the limit
        if (operationCount >= BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
        }
    }

    // Commit any remaining operations
    if (operationCount > 0) {
        await batch.commit();
    }

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] untagUserTransactions SUCCESS:', {
            userId,
            groupId,
            transactionsUpdated: snapshot.size,
        });
    }
}

/**
 * Transfer ownership of a shared group to another member.
 *
 * Story 14c.3 AC5: Ownership transfer
 * - Validates current user is owner
 * - Validates new owner is a member
 * - Updates ownerId to new owner
 * - Current owner becomes a regular member
 *
 * @param db Firestore instance
 * @param currentOwnerId Current owner's user ID
 * @param newOwnerId New owner's user ID
 * @param groupId Shared group document ID
 * @throws Error with LeaveGroupError type message
 */
export async function transferOwnership(
    db: Firestore,
    currentOwnerId: string,
    newOwnerId: string,
    groupId: string
): Promise<void> {
    // 1. Get the group
    const group = await getSharedGroup(db, groupId);

    if (!group) {
        throw new Error('GROUP_NOT_FOUND');
    }

    // 2. Validate current user is owner
    if (group.ownerId !== currentOwnerId) {
        throw new Error('NOT_OWNER');
    }

    // 3. Cannot transfer to self
    if (currentOwnerId === newOwnerId) {
        throw new Error('CANNOT_TRANSFER_TO_SELF');
    }

    // 4. Validate new owner is a member
    if (!group.members.includes(newOwnerId)) {
        throw new Error('TARGET_NOT_MEMBER');
    }

    // 5. Update the group document
    const groupRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
        ownerId: newOwnerId,
        updatedAt: serverTimestamp(),
    });

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] transferOwnership SUCCESS:', {
            groupId,
            groupName: group.name,
            previousOwner: currentOwnerId,
            newOwner: newOwnerId,
        });
    }
}

/**
 * Remove a member from a shared group (owner only).
 * Performs a soft leave on their behalf.
 *
 * Story 14c.3 AC6: Owner can remove members
 * - Validates requester is owner
 * - Removes member from group.members[]
 * - Updates removed member's profile
 * - Transactions stay shared (soft leave behavior)
 *
 * @param db Firestore instance
 * @param ownerId Owner's user ID (requester)
 * @param memberId Member's user ID to remove
 * @param appId App ID (e.g., 'boletapp')
 * @param groupId Shared group document ID
 * @throws Error with LeaveGroupError type message
 */
export async function removeMember(
    db: Firestore,
    ownerId: string,
    memberId: string,
    _appId: string, // Kept for API consistency; previously used for profile updates
    groupId: string
): Promise<void> {
    // 1. Get the group
    const group = await getSharedGroup(db, groupId);

    if (!group) {
        throw new Error('GROUP_NOT_FOUND');
    }

    // 2. Validate requester is owner
    if (group.ownerId !== ownerId) {
        throw new Error('NOT_OWNER');
    }

    // 3. Cannot remove self (owner) - must transfer or delete
    if (ownerId === memberId) {
        throw new Error('OWNER_CANNOT_LEAVE');
    }

    // 4. Validate member exists in group
    if (!group.members.includes(memberId)) {
        throw new Error('NOT_A_MEMBER');
    }

    // 5. Remove member from group
    // Note: We only update the sharedGroup document, NOT the removed member's profile
    // The removed member's memberOfSharedGroups will be stale but that's okay -
    // they won't see the group in queries since they're no longer in members[].
    // We can't update another user's profile due to security rules.
    const groupRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
        members: arrayRemove(memberId),
        [`memberUpdates.${memberId}`]: deleteField(),
        [`memberProfiles.${memberId}`]: deleteField(),
        updatedAt: serverTimestamp(),
    });

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] removeMember SUCCESS:', {
            groupId,
            groupName: group.name,
            removedMember: memberId,
            removedBy: ownerId,
        });
    }
}

/**
 * Delete a shared group entirely (owner only).
 *
 * Story 14c.3 AC4: Owner can delete group
 * - Validates requester is owner
 * - Removes groupId from all members' profiles
 * - Optionally untags all transactions (based on removeTransactionTags parameter)
 * - Deletes the group document
 *
 * @param db Firestore instance
 * @param ownerId Owner's user ID (requester)
 * @param appId App ID (e.g., 'boletapp')
 * @param groupId Shared group document ID
 * @param removeTransactionTags If true, removes groupId from all members' transactions
 * @throws Error with LeaveGroupError type message
 */
export async function deleteSharedGroupWithCleanup(
    db: Firestore,
    ownerId: string,
    appId: string,
    groupId: string,
    removeTransactionTags: boolean = false
): Promise<void> {
    // 1. Get the group
    const group = await getSharedGroup(db, groupId);

    if (!group) {
        throw new Error('GROUP_NOT_FOUND');
    }

    // 2. Validate requester is owner
    if (group.ownerId !== ownerId) {
        throw new Error('NOT_OWNER');
    }

    // 3. Optionally untag owner's transactions only
    // Note: We can only untag the owner's transactions due to security rules.
    // Other members' transactions will retain the groupId but the group won't exist,
    // so they'll be filtered out naturally (stale reference handling).
    if (removeTransactionTags) {
        await untagUserTransactions(db, ownerId, appId, groupId);
    }

    // 4. Remove groupId from owner's profile and delete group
    // Note: We only update the owner's profile here. Other members' profiles
    // will be cleaned up when they next access their groups (stale group references
    // are filtered out in useUserSharedGroups hook).
    // This avoids permission issues since users can only write to their own profiles.
    const batch = writeBatch(db);

    // 4a. Update owner's profile only
    const ownerProfileRef = doc(db, `artifacts/${appId}/users/${ownerId}/preferences/settings`);
    batch.set(ownerProfileRef, {
        memberOfSharedGroups: arrayRemove(groupId),
    }, { merge: true });

    // 4b. Delete the group document
    const groupRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
    batch.delete(groupRef);

    await batch.commit();

    // Log in dev mode
    if (import.meta.env.DEV) {
        console.log('[sharedGroupService] deleteSharedGroupWithCleanup SUCCESS:', {
            groupId,
            groupName: group.name,
            membersAffected: group.members.length,
            transactionsUntagged: removeTransactionTags,
        });
    }
}

// ============================================================================
// Story 14c.7: Tag Transactions to Groups - Update memberUpdates timestamp
// ============================================================================

/**
 * Update memberUpdates timestamps for affected shared groups when a transaction's
 * sharedGroupIds changes.
 *
 * This should be called after saving a transaction that has sharedGroupIds.
 * It updates the memberUpdates[userId].lastSyncAt timestamp for all groups that
 * were added to or removed from the transaction, enabling other members to detect
 * changes via delta sync.
 *
 * @param db Firestore instance
 * @param userId User ID of the transaction owner
 * @param newGroupIds New sharedGroupIds on the transaction
 * @param previousGroupIds Previous sharedGroupIds (before edit)
 */
export async function updateMemberTimestampsForTransaction(
    db: Firestore,
    userId: string,
    newGroupIds: string[],
    previousGroupIds: string[]
): Promise<void> {
    // Find all affected groups (union of new and previous)
    const allAffectedGroups = new Set([...newGroupIds, ...previousGroupIds]);

    if (allAffectedGroups.size === 0) {
        return; // No groups to update
    }

    const batch = writeBatch(db);
    const now = serverTimestamp();

    for (const groupId of allAffectedGroups) {
        const groupRef = doc(db, SHARED_GROUPS_COLLECTION, groupId);
        batch.update(groupRef, {
            [`memberUpdates.${userId}.lastSyncAt`]: now,
            updatedAt: now,
        });
    }

    try {
        await batch.commit();

        if (import.meta.env.DEV) {
            console.log('[sharedGroupService] updateMemberTimestampsForTransaction:', {
                userId,
                affectedGroups: Array.from(allAffectedGroups),
                added: newGroupIds.filter(id => !previousGroupIds.includes(id)),
                removed: previousGroupIds.filter(id => !newGroupIds.includes(id)),
            });
        }
    } catch (error) {
        // Don't fail the transaction save if timestamp update fails
        // This is a non-critical optimization for delta sync
        console.warn('[sharedGroupService] Failed to update memberUpdates timestamps:', error);
    }
}
