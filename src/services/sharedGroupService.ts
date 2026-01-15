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
    input: CreateSharedGroupInput
): Promise<SharedGroup> {
    const collectionRef = collection(db, SHARED_GROUPS_COLLECTION);

    const shareCode = generateShareCode();
    const shareCodeExpiresAt = getShareCodeExpiry();
    const now = serverTimestamp();

    const groupData = {
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
