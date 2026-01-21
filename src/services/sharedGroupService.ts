/**
 * Shared Group Service - STUBBED
 *
 * Story 14c-refactor.2: Stub Services
 * Epic 14c-refactor: Codebase Cleanup
 *
 * This is a STUB implementation. All functions return placeholder responses
 * without making any network calls. Shared group features are temporarily
 * disabled until Epic 14d (Shared Groups v2).
 *
 * PRESERVED UTILITIES (no network calls):
 * - generateShareCode()
 * - getShareLink()
 * - isShareCodeExpired()
 */

import { nanoid } from 'nanoid';
import { Timestamp, Firestore, Unsubscribe } from 'firebase/firestore';
import type {
    SharedGroup,
    CreateSharedGroupInput,
    UpdateSharedGroupInput,
    SharedGroupPreview,
} from '../types/sharedGroup';
import { SHARED_GROUP_LIMITS } from '../types/sharedGroup';

// ============================================================================
// Constants
// ============================================================================

/** Base URL for share links */
const SHARE_LINK_BASE_URL = 'https://boletapp-d609f.web.app/join';

/** Error message for temporarily unavailable features */
const FEATURE_UNAVAILABLE_ERROR = 'Feature temporarily unavailable';

// ============================================================================
// Share Code Utilities (PRESERVED - no network calls)
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
// Type Exports (PRESERVED for backwards compatibility)
// ============================================================================

/**
 * Error types for join operations.
 */
export type JoinError =
    | 'CODE_NOT_FOUND'
    | 'CODE_EXPIRED'
    | 'GROUP_FULL'
    | 'ALREADY_MEMBER';

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
 * Error types for leave/manage group operations.
 */
export type LeaveGroupError =
    | 'GROUP_NOT_FOUND'
    | 'NOT_A_MEMBER'
    | 'OWNER_CANNOT_LEAVE'
    | 'NOT_OWNER'
    | 'CANNOT_TRANSFER_TO_SELF'
    | 'TARGET_NOT_MEMBER';

// ============================================================================
// STUBBED CRUD Operations
// ============================================================================

/**
 * STUB: Create a new shared group.
 * @throws Error "Feature temporarily unavailable"
 */
export async function createSharedGroup(
    _db: Firestore,
    _userId: string,
    _appId: string,
    _input: CreateSharedGroupInput,
    _ownerProfile?: { displayName?: string; email?: string; photoURL?: string }
): Promise<SharedGroup> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Get a shared group by ID.
 * @returns null (no groups available)
 */
export async function getSharedGroup(
    _db: Firestore,
    _groupId: string
): Promise<SharedGroup | null> {
    return null;
}

/**
 * STUB: Get a shared group by share code.
 * @returns null (no groups available)
 */
export async function getSharedGroupByShareCode(
    _db: Firestore,
    _shareCode: string
): Promise<SharedGroup | null> {
    return null;
}

/**
 * STUB: Get preview info for a shared group.
 * @returns null (no groups available)
 */
export async function getSharedGroupPreview(
    _db: Firestore,
    _shareCode: string
): Promise<SharedGroupPreview | null> {
    return null;
}

/**
 * STUB: Join a shared group using a share code.
 * @throws Error "Feature temporarily unavailable"
 */
export async function joinByShareCode(
    _db: Firestore,
    _userId: string,
    _appId: string,
    _shareCode: string,
    _userProfile?: { displayName?: string; email?: string; photoURL?: string }
): Promise<{ groupName: string; groupId: string }> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Get all shared groups a user is a member of.
 * @returns [] (empty array - no groups)
 */
export async function getSharedGroupsForUser(
    _db: Firestore,
    _userId: string
): Promise<SharedGroup[]> {
    return [];
}

/**
 * STUB: Subscribe to real-time updates of shared groups.
 * @returns No-op unsubscribe function (immediately calls callback with empty array)
 */
export function subscribeToSharedGroups(
    _db: Firestore,
    _userId: string,
    onUpdate: (groups: SharedGroup[]) => void,
    _onError?: (error: Error) => void
): Unsubscribe {
    // Immediately call with empty array
    onUpdate([]);
    // Return no-op unsubscribe
    return () => {};
}

/**
 * STUB: Subscribe to a single shared group's updates.
 * @returns No-op unsubscribe function (immediately calls callback with null)
 */
export function subscribeToSharedGroup(
    _db: Firestore,
    _groupId: string,
    onUpdate: (group: SharedGroup | null) => void,
    _onError?: (error: Error) => void
): Unsubscribe {
    // Immediately call with null
    onUpdate(null);
    // Return no-op unsubscribe
    return () => {};
}

/**
 * STUB: Update a shared group's metadata.
 * @throws Error "Feature temporarily unavailable"
 */
export async function updateSharedGroup(
    _db: Firestore,
    _groupId: string,
    _updates: UpdateSharedGroupInput
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Regenerate a shared group's share code.
 * @throws Error "Feature temporarily unavailable"
 */
export async function regenerateShareCode(
    _db: Firestore,
    _groupId: string
): Promise<string> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Delete a shared group.
 * @throws Error "Feature temporarily unavailable"
 */
export async function deleteSharedGroup(
    _db: Firestore,
    _groupId: string
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

// ============================================================================
// STUBBED Member Management
// ============================================================================

/**
 * STUB: Add a member to a shared group.
 * @throws Error "Feature temporarily unavailable"
 */
export async function addMemberToGroup(
    _db: Firestore,
    _groupId: string,
    _userId: string
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Remove a member from a shared group.
 * @throws Error "Feature temporarily unavailable"
 */
export async function removeMemberFromGroup(
    _db: Firestore,
    _groupId: string,
    _userId: string
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

// ============================================================================
// STUBBED Invitation Operations
// ============================================================================

/**
 * STUB: Accept a pending invitation.
 * @throws Error "Feature temporarily unavailable"
 */
export async function acceptInvitation(
    _db: Firestore,
    _userId: string,
    _appId: string,
    _invitationId: string
): Promise<{ groupName: string }> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Decline a pending invitation.
 * @throws Error "Feature temporarily unavailable"
 */
export async function declineInvitation(
    _db: Firestore,
    _invitationId: string
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Create a pending invitation.
 * @throws Error "Feature temporarily unavailable"
 */
export async function createPendingInvitation(
    _db: Firestore,
    _group: SharedGroup,
    _invitedEmail: string,
    _invitedByUserId: string,
    _invitedByName: string
): Promise<string> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

// ============================================================================
// STUBBED Leave/Manage Group
// ============================================================================

/**
 * STUB: Leave a shared group with soft leave mode.
 * @throws Error "Feature temporarily unavailable"
 */
export async function leaveGroupSoft(
    _db: Firestore,
    _userId: string,
    _appId: string,
    _groupId: string
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Leave a shared group with hard leave mode.
 * @throws Error "Feature temporarily unavailable"
 */
export async function leaveGroupHard(
    _db: Firestore,
    _userId: string,
    _appId: string,
    _groupId: string
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Transfer ownership of a shared group.
 * @throws Error "Feature temporarily unavailable"
 */
export async function transferOwnership(
    _db: Firestore,
    _currentOwnerId: string,
    _newOwnerId: string,
    _groupId: string
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Remove a member from a shared group (owner only).
 * @throws Error "Feature temporarily unavailable"
 */
export async function removeMember(
    _db: Firestore,
    _ownerId: string,
    _memberId: string,
    _appId: string,
    _groupId: string
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

/**
 * STUB: Delete a shared group with cleanup.
 * @throws Error "Feature temporarily unavailable"
 */
export async function deleteSharedGroupWithCleanup(
    _db: Firestore,
    _ownerId: string,
    _appId: string,
    _groupId: string,
    _removeTransactionTags?: boolean
): Promise<void> {
    throw new Error(FEATURE_UNAVAILABLE_ERROR);
}

// ============================================================================
// STUBBED Transaction Tagging
// ============================================================================

/**
 * STUB: Update memberUpdates timestamps for affected shared groups.
 * No-op since shared groups are disabled.
 */
export async function updateMemberTimestampsForTransaction(
    _db: Firestore,
    _userId: string,
    _newGroupIds: string[],
    _previousGroupIds: string[]
): Promise<void> {
    // No-op - shared groups disabled
    return;
}
