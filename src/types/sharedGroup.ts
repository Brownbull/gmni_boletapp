/**
 * Shared Group Types
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Shared groups allow users to share transactions with family/friends.
 * Unlike personal TransactionGroups (stored in user's subcollection),
 * SharedGroups are stored at top-level: sharedGroups/{groupId}
 *
 * Architecture: Option 4 - Hybrid Model
 * - SharedGroup document at top-level for cross-user access
 * - Transactions stay in user's subcollection with sharedGroupIds[] reference
 * - Security rules use members[] array for read access control
 *
 * @example
 * ```typescript
 * const sharedGroup: SharedGroup = {
 *   id: 'abc123',
 *   ownerId: 'user-xyz',
 *   appId: 'boletapp',
 *   name: '🏠 Gastos del Hogar',
 *   color: '#10b981',
 *   icon: '🏠',
 *   shareCode: 'Ab3dEf7hIj9kLm0p',
 *   shareCodeExpiresAt: Timestamp.fromDate(new Date('2026-01-22')),
 *   members: ['user-xyz'],
 *   memberUpdates: {},
 *   createdAt: Timestamp.now(),
 *   updatedAt: Timestamp.now(),
 * };
 * ```
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Limits for shared groups feature.
 */
export const SHARED_GROUP_LIMITS = {
    /** Maximum number of shared groups a user can own */
    MAX_OWNED_GROUPS: 5,
    /** Maximum number of shared groups a user can be a member of */
    MAX_MEMBER_OF_GROUPS: 10,
    /** Maximum members per shared group */
    MAX_MEMBERS_PER_GROUP: 10,
    /** Maximum number of shared groups a transaction can belong to */
    MAX_GROUPS_PER_TRANSACTION: 5,
    /** Share code length (nanoid default) */
    SHARE_CODE_LENGTH: 16,
    /** Share code expiry in days */
    SHARE_CODE_EXPIRY_DAYS: 7,
} as const;

/**
 * Status of a member's last sync with group data.
 * Used for delta sync optimization.
 */
export interface MemberUpdate {
    /** Last time this member viewed/synced group data */
    lastSyncAt: Timestamp;
    /** Number of unread/new transactions since last sync */
    unreadCount?: number;
}

/**
 * Public profile info for a group member.
 * Stored in SharedGroup.memberProfiles for display purposes.
 */
export interface MemberProfile {
    /** Display name from Firebase Auth or user preferences */
    displayName?: string;
    /** Email address (for identification) */
    email?: string;
    /** Profile photo URL */
    photoURL?: string;
}

/**
 * A shared group that allows multiple users to see each other's transactions.
 *
 * Stored at top-level: sharedGroups/{groupId}
 * Members can be 2-10 users with symmetric visibility.
 */
export interface SharedGroup {
    /** Firestore document ID */
    id?: string;

    /** User ID of the group owner (creator) */
    ownerId: string;

    /** App ID (e.g., 'boletapp') - required for cross-collection security rules */
    appId: string;

    /** Group name (may include emoji prefix) */
    name: string;

    /** Group color for visual identification (hex code, e.g., "#10b981") */
    color: string;

    /** Optional emoji icon (extracted from name or set separately) */
    icon?: string;

    /** 16-character share code for inviting members */
    shareCode: string;

    /** When the share code expires (7 days from generation) */
    shareCodeExpiresAt: Timestamp;

    /** Array of member user IDs (includes owner) */
    members: string[];

    /** Per-member sync status for delta sync optimization */
    memberUpdates: Record<string, MemberUpdate>;

    /** Public profile info for each member (userId -> MemberProfile) */
    memberProfiles?: Record<string, MemberProfile>;

    /** Timestamp when the group was created */
    createdAt: Timestamp;

    /** Timestamp when the group was last modified */
    updatedAt: Timestamp;
}

/**
 * Data required to create a new shared group.
 * Typically created from an existing TransactionGroup.
 */
export interface CreateSharedGroupInput {
    /** Group name */
    name: string;
    /** Group color (hex code) */
    color?: string;
    /** Optional emoji icon */
    icon?: string;
}

/**
 * Data that can be updated on an existing shared group.
 * Only owner can update.
 */
export type UpdateSharedGroupInput = Partial<Pick<SharedGroup, 'name' | 'color' | 'icon'>>;

/**
 * Public info about a shared group for the join flow.
 * Excludes sensitive member data.
 */
export interface SharedGroupPreview {
    /** Group ID */
    id: string;
    /** Group name */
    name: string;
    /** Group color */
    color: string;
    /** Optional icon */
    icon?: string;
    /** Number of current members */
    memberCount: number;
    /** Whether the share code is expired */
    isExpired: boolean;
}

/**
 * Type guard to check if a user is the owner of a shared group
 */
export function isSharedGroupOwner(group: SharedGroup, userId: string): boolean {
    return group.ownerId === userId;
}

/**
 * Type guard to check if a user is a member of a shared group
 */
export function isSharedGroupMember(group: SharedGroup, userId: string): boolean {
    return group.members.includes(userId);
}

/**
 * Check if a shared group's share code has expired.
 *
 * @param group - SharedGroup object with shareCodeExpiresAt field
 * @returns true if expired or no expiry date
 *
 * Note: For checking expiry from a Timestamp directly (without full group),
 * use `isShareCodeExpired(timestamp)` from sharedGroupService.ts instead.
 * This overload exists for convenience when you already have a SharedGroup object.
 */
export function isShareCodeExpired(group: SharedGroup): boolean {
    if (!group.shareCodeExpiresAt) return true;
    const expiryDate = group.shareCodeExpiresAt.toDate();
    return new Date() > expiryDate;
}

/**
 * Check if a shared group can accept more members
 */
export function canAddMember(group: SharedGroup): boolean {
    return group.members.length < SHARED_GROUP_LIMITS.MAX_MEMBERS_PER_GROUP;
}

/**
 * User profile extension for shared groups membership.
 *
 * This field is stored on user preferences document and used by
 * security rules for cross-user transaction reads.
 *
 * Path: artifacts/{appId}/users/{userId}/preferences/settings
 */
export interface UserSharedGroupMembership {
    /** Array of shared group IDs the user is a member of */
    memberOfSharedGroups: string[];
}

// ============================================================================
// ============================================================================

/**
 * Pending invitation status.
 */
export type PendingInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

/**
 * A pending invitation to join a shared group.
 *
 * Stored at top-level: pendingInvitations/{invitationId}
 *
 * When a user is invited to a shared group by email, a PendingInvitation
 * document is created. The invited user can then accept or decline.
 */
export interface PendingInvitation {
    /** Firestore document ID */
    id?: string;

    /** The shared group being invited to */
    groupId: string;

    /** Group name (denormalized for display) */
    groupName: string;

    /** Group color (denormalized for display) */
    groupColor: string;

    /** Group icon (denormalized for display) */
    groupIcon?: string;

    /** Email address of the invited user (lowercase) */
    invitedEmail: string;

    /** User ID of the person who sent the invite */
    invitedByUserId: string;

    /** Display name of the inviter (denormalized) */
    invitedByName: string;

    /** When the invitation was created */
    createdAt: Timestamp;

    /** When the invitation expires (7 days from creation) */
    expiresAt: Timestamp;

    /** Current status of the invitation */
    status: PendingInvitationStatus;
}

/**
 * Check if a pending invitation has expired.
 */
export function isInvitationExpired(invitation: PendingInvitation): boolean {
    if (!invitation.expiresAt) return true;
    const expiryDate = invitation.expiresAt.toDate();
    return new Date() > expiryDate;
}

/**
 * Get time remaining until invitation expires.
 * @returns Object with days, hours remaining, or null if expired
 */
export function getInvitationTimeRemaining(invitation: PendingInvitation): { days: number; hours: number } | null {
    if (!invitation.expiresAt) return null;
    const expiryDate = invitation.expiresAt.toDate();
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days, hours };
}

// ============================================================================
// Group Name Utility Functions
// (Moved from transactionGroup.ts during Story 14.15 removal)
// ============================================================================

/**
 * Extract emoji from group name if present at the start.
 * Returns empty string if no emoji found.
 *
 * @example
 * extractGroupEmoji('🎄 Navidad 2024') // '🎄'
 * extractGroupEmoji('Gastos del Hogar') // ''
 */
export function extractGroupEmoji(name: string): string {
    // Match emoji at the start of the string
    // This regex matches most common emoji patterns
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    const match = name.match(emojiRegex);
    return match ? match[0] : '';
}

/**
 * Extract group name without emoji prefix.
 *
 * @example
 * extractGroupLabel('🎄 Navidad 2024') // 'Navidad 2024'
 * extractGroupLabel('Gastos del Hogar') // 'Gastos del Hogar'
 */
export function extractGroupLabel(name: string): string {
    const emoji = extractGroupEmoji(name);
    if (emoji) {
        // Remove emoji and any leading whitespace
        return name.slice(emoji.length).trimStart();
    }
    return name;
}
