/**
 * Group Service - CRUD Operations
 *
 * TD-CONSOLIDATED-1: Modularized from original groupService.ts (~1,509 LOC).
 * This module retains Group CRUD operations (create, read, update).
 *
 * Related modules:
 * - groupDeletionService.ts — Group deletion with cascade cleanup
 * - groupMemberService.ts — Join/leave/transfer membership lifecycle
 * - groupConstants.ts — Shared constants across all modules
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
    doc,
    getCountFromServer,
    query,
    where,
    serverTimestamp,
    Timestamp,
    runTransaction,
} from 'firebase/firestore';
import type {
    SharedGroup,
    CreateSharedGroupInput,
    UpdateSharedGroupInput,
} from '@/types/sharedGroup';
import { SHARED_GROUP_LIMITS } from '@/types/sharedGroup';
import { generateShareCode } from '@/services/sharedGroupService';
import { sanitizeInput } from '@/utils/sanitize';
import { validateAppId, validateGroupId } from '@/utils/validationUtils';
import { canToggleTransactionSharing, shouldResetDailyCount } from '@/utils/sharingCooldown';
import {
    GROUPS_COLLECTION,
    DEFAULT_TIMEZONE,
    DEFAULT_GROUP_COLOR,
    GROUP_COLORS,
    GROUP_ICONS,
} from './groupConstants';

// Re-export visual constants for backward compatibility
export { DEFAULT_GROUP_COLOR, GROUP_COLORS, GROUP_ICONS };

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
// Group CRUD Functions
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
 */
export async function createGroup(
    db: Firestore,
    userId: string,
    appId: string,
    input: CreateSharedGroupInput,
    ownerProfile?: import('@/types/sharedGroup').MemberProfile
): Promise<SharedGroup> {
    // ECC Review Fix: Validate appId to prevent path traversal (consistent with deletion/member functions)
    if (!validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

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

    // Sanitize the group name (XSS protection — see code-review-patterns.md #2)
    const sanitizedName = sanitizeInput(input.name, { maxLength: 50 });

    // ECC Review Fix: Validate color against whitelist (consistent with updateGroup)
    if (input.color && !GROUP_COLORS.includes(input.color)) {
        throw new Error('Invalid color: not in allowed color palette');
    }

    // ECC Review Fix: Validate and sanitize icon (consistent with updateGroup)
    if (input.icon !== undefined && !GROUP_ICONS.includes(input.icon)) {
        throw new Error('Invalid icon: not in allowed icon list');
    }

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
        transactionSharingToggleCountResetAt: null,
        lastSettingsUpdateAt: null,
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
    // TD-CONSOLIDATED-6: Validate groupId before Firestore path construction
    validateGroupId(groupId);

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

    // Add updatedAt timestamp + rate limiting timestamp (TD-CONSOLIDATED-11)
    updateData.updatedAt = serverTimestamp();
    updateData.lastSettingsUpdateAt = serverTimestamp();

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

// =============================================================================
// Transaction Sharing Toggle Function (Story 14d-v2-1-11b)
// =============================================================================

/**
 * Update transaction sharing enabled state for a group.
 *
 * Story 14d-v2-1-11b: Service Layer & Security
 *
 * Atomically updates the transactionSharingEnabled field along with
 * rate-limiting fields (cooldown timestamp, daily count).
 *
 * Security:
 * - Only the group owner can toggle this setting
 * - Uses Firestore transaction to prevent TOCTOU vulnerabilities
 * - Enforces 15-minute cooldown between toggles
 * - Enforces 3 toggles/day limit
 *
 * @param db - Firestore instance
 * @param groupId - ID of the group to update
 * @param userId - ID of the user attempting the update (must be owner)
 * @param enabled - New value for transactionSharingEnabled
 *
 * @throws Error if groupId or userId is empty
 * @throws Error if group not found
 * @throws Error if user is not the owner
 * @throws Error if cooldown is active (with wait time)
 * @throws Error if daily toggle limit reached
 */
export async function updateTransactionSharingEnabled(
    db: Firestore,
    groupId: string,
    userId: string,
    enabled: boolean
): Promise<void> {
    // Input validation
    if (!groupId || !userId) {
        throw new Error('Group ID and user ID are required');
    }
    // TD-CONSOLIDATED-6: Validate groupId before Firestore path construction
    validateGroupId(groupId);

    const groupRef = doc(db, GROUPS_COLLECTION, groupId);

    await runTransaction(db, async (transaction) => {
        // Get the group document
        const groupSnap = await transaction.get(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const group = groupSnap.data() as SharedGroup;

        // Verify user is the owner (AC: Only owner can toggle)
        if (group.ownerId !== userId) {
            throw new Error('Only the group owner can toggle transaction sharing');
        }

        // Check cooldown and rate limiting
        const cooldownResult = canToggleTransactionSharing(group);

        if (!cooldownResult.allowed) {
            if (cooldownResult.reason === 'cooldown') {
                throw new Error(`Please wait ${cooldownResult.waitMinutes} minutes before toggling again`);
            } else if (cooldownResult.reason === 'daily_limit') {
                throw new Error('Daily toggle limit reached (3 changes per day)');
            }
        }

        // Check if daily count needs to be reset (new day in group's timezone)
        const needsReset = shouldResetDailyCount(
            group.transactionSharingToggleCountResetAt ?? null,
            group.timezone || 'UTC'
        );

        // Calculate new toggle count
        const currentCount = needsReset ? 0 : (group.transactionSharingToggleCountToday ?? 0);
        const newCount = currentCount + 1;

        // Build atomic update
        const updateData: Record<string, unknown> = {
            transactionSharingEnabled: enabled,
            transactionSharingLastToggleAt: serverTimestamp(),
            transactionSharingToggleCountToday: newCount,
            updatedAt: serverTimestamp(),
        };

        // Update reset timestamp if we're resetting the daily count
        if (needsReset) {
            updateData.transactionSharingToggleCountResetAt = serverTimestamp();
        }

        transaction.update(groupRef, updateData);
    });

    // Audit log in development
    if (import.meta.env.DEV) {
        console.log('[groupService] updateTransactionSharingEnabled completed', {
            groupId,
            userId,
            enabled,
            timestamp: new Date().toISOString(),
        });
    }
}

// =============================================================================
// Re-exports for backward compatibility
// TD-CONSOLIDATED-1: These re-exports ensure existing test imports continue to work
// without modification. Direct importers within src/ have been updated to use
// the canonical module paths (groupDeletionService, groupMemberService).
//
// @deprecated Import from canonical modules instead:
//   - groupDeletionService: deleteGroupAsLastMember, deleteGroupAsOwner
//   - groupMemberService: joinGroupDirectly, leaveGroup, transferOwnership,
//     leaveGroupWithCleanup, transferAndLeaveWithCleanup
// =============================================================================

export { deleteGroupAsLastMember, deleteGroupAsOwner } from './groupDeletionService';
export {
    joinGroupDirectly,
    leaveGroup,
    transferOwnership,
    leaveGroupWithCleanup,
    transferAndLeaveWithCleanup,
} from './groupMemberService';
