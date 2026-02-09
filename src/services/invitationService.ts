/**
 * Invitation Service
 *
 * Story 14d-v2-1-5b-1: Core Invitation Service
 * Epic 14d-v2: Shared Groups v2
 *
 * Service functions for creating and managing shared group invitations.
 * Invitations are stored at top-level: pendingInvitations/{invitationId}
 *
 * @example
 * ```typescript
 * // Create an invitation
 * const invitation = await createInvitation(db, {
 *   groupId: 'group-123',
 *   groupName: '🏠 Gastos del Hogar',
 *   groupColor: '#10b981',
 *   invitedEmail: 'friend@example.com',
 *   invitedByUserId: 'user-xyz',
 *   invitedByName: 'Juan García',
 * });
 *
 * // Get invitation by share code (for deep links)
 * const invitation = await getInvitationByShareCode(db, 'Ab3dEf7hIj9kLm0p');
 *
 * // Check for duplicate before creating
 * if (await checkDuplicateInvitation(db, 'group-123', 'friend@example.com')) {
 *   throw new Error('This person already has a pending invitation');
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
    query,
    where,
    limit,
    orderBy,
    serverTimestamp,
    Timestamp,
    runTransaction,
    arrayUnion,
} from 'firebase/firestore';
import type { PendingInvitation, SharedGroup } from '@/types/sharedGroup';
import { SHARED_GROUP_LIMITS, isInvitationExpired, createDefaultGroupPreference } from '@/types/sharedGroup';
import { generateShareCode, isValidShareCode } from '@/utils/shareCodeUtils';
import { normalizeEmail, validateAppId, validateGroupId } from '@/utils/validationUtils';
import { sanitizeInput } from '@/utils/sanitize';

// =============================================================================
// Constants
// =============================================================================

/**
 * Firestore collection name for pending invitations.
 * Top-level collection for cross-user access.
 */
const INVITATIONS_COLLECTION = 'pendingInvitations';

// =============================================================================
// Types
// =============================================================================

/**
 * Input parameters for creating a new invitation.
 */
export interface CreateInvitationInput {
    /** The shared group being invited to */
    groupId: string;
    /** Group name (denormalized for display) */
    groupName: string;
    /** Group color (denormalized for display) */
    groupColor: string;
    /** Group icon (denormalized for display, optional) */
    groupIcon?: string;
    /** Email address of the person being invited */
    invitedEmail: string;
    /** User ID of the person sending the invite */
    invitedByUserId: string;
    /** Display name of the person sending the invite */
    invitedByName: string;
}

// =============================================================================
// Invitation Service Functions
// =============================================================================

/**
 * Create a new pending invitation.
 *
 * Generates a unique share code for the invitation and stores it in Firestore.
 * The invitation expires after SHARE_CODE_EXPIRY_DAYS (7 days).
 *
 * @param db - Firestore instance
 * @param input - Invitation creation parameters
 * @returns The created PendingInvitation with generated ID and shareCode
 *
 * @throws Error if Firestore write fails
 *
 * @example
 * ```typescript
 * const invitation = await createInvitation(db, {
 *   groupId: 'group-123',
 *   groupName: '🏠 Gastos del Hogar',
 *   groupColor: '#10b981',
 *   invitedEmail: 'friend@example.com',
 *   invitedByUserId: 'user-xyz',
 *   invitedByName: 'Juan García',
 * });
 * console.log(`Share code: ${invitation.shareCode}`);
 * ```
 */
export async function createInvitation(
    db: Firestore,
    input: CreateInvitationInput
): Promise<PendingInvitation> {
    // TD-CONSOLIDATED-6: Validate groupId before storage (defense-in-depth)
    validateGroupId(input.groupId);

    const now = serverTimestamp();
    const shareCode = generateShareCode();

    // Calculate expiry (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + SHARED_GROUP_LIMITS.SHARE_CODE_EXPIRY_DAYS);
    const expiresAt = Timestamp.fromDate(expiryDate);

    // Normalize email to lowercase for consistent lookups
    const normalizedEmail = normalizeEmail(input.invitedEmail);

    // Sanitize user-provided strings to prevent XSS (per Atlas Section 6 pattern)
    const sanitizedGroupName = sanitizeInput(input.groupName, { maxLength: 100 });
    const sanitizedInvitedByName = sanitizeInput(input.invitedByName, { maxLength: 100 });
    const sanitizedGroupIcon = input.groupIcon ? sanitizeInput(input.groupIcon, { maxLength: 10 }) : undefined;

    // Build the invitation document
    const invitationData: Omit<PendingInvitation, 'id'> = {
        groupId: input.groupId,
        groupName: sanitizedGroupName,
        groupColor: input.groupColor,
        // Only include groupIcon if provided (Firestore rejects undefined values)
        ...(sanitizedGroupIcon !== undefined && { groupIcon: sanitizedGroupIcon }),
        shareCode,
        invitedEmail: normalizedEmail,
        invitedByUserId: input.invitedByUserId,
        invitedByName: sanitizedInvitedByName,
        // serverTimestamp() returns FieldValue, cast to Timestamp for type compatibility
        createdAt: now as Timestamp,
        expiresAt,
        status: 'pending',
    };

    // Create the document in Firestore
    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const docRef = await addDoc(invitationsRef, invitationData);

    // Return the complete invitation with ID
    return {
        id: docRef.id,
        ...invitationData,
    };
}

/**
 * Get an invitation by its share code.
 *
 * Used for deep link handling: /invite/{shareCode}
 * Only returns invitations with 'pending' status.
 *
 * TD-CONSOLIDATED-5: When userEmail is provided, the query includes an email filter
 * to comply with Firestore security rules that restrict list queries to the
 * authenticated user's own email. Without userEmail, the query will be denied
 * by security rules (but still works in Cloud Functions that bypass rules).
 *
 * @param db - Firestore instance
 * @param shareCode - The 16-character share code
 * @param userEmail - The authenticated user's email (required for client-side queries)
 * @returns The PendingInvitation if found and pending, null otherwise
 *
 * @example
 * ```typescript
 * const invitation = await getInvitationByShareCode(db, 'Ab3dEf7hIj9kLm0p', user.email);
 * if (invitation) {
 *   console.log(`Invitation to group: ${invitation.groupName}`);
 * } else {
 *   console.log('Invalid or expired invitation');
 * }
 * ```
 */
export async function getInvitationByShareCode(
    db: Firestore,
    shareCode: string,
    userEmail?: string | null
): Promise<PendingInvitation | null> {
    if (!shareCode) {
        return null;
    }

    // TD-CONSOLIDATED-5: Email filter required for client-side queries to comply with
    // security rules that restrict list queries to the user's own email.
    // Without email, unfiltered list queries are denied by Firestore rules.
    if (!userEmail) {
        return null;
    }

    const normalizedUserEmail = normalizeEmail(userEmail);
    if (!normalizedUserEmail) {
        return null;
    }

    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const q = query(
        invitationsRef,
        where('shareCode', '==', shareCode),
        where('status', '==', 'pending'),
        where('invitedEmail', '==', normalizedUserEmail),
        limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const docSnap = snapshot.docs[0];
    return {
        id: docSnap.id,
        ...docSnap.data(),
    } as PendingInvitation;
}

/**
 * Check if a duplicate pending invitation exists for a group and email.
 *
 * Used to prevent sending multiple invitations to the same person for the same group.
 * Only checks invitations with 'pending' status.
 *
 * @deprecated TD-CONSOLIDATED-5: This function queries by invitee's email which differs
 * from the calling user's email (group owner checking invitee). Client-side calls will
 * be denied by security rules unless the queried email matches request.auth.token.email.
 * Move to a Cloud Function if client-side duplicate checking is needed.
 *
 * @param db - Firestore instance
 * @param groupId - The shared group ID
 * @param email - The email address to check
 * @returns true if a pending invitation already exists, false otherwise
 *
 * @example
 * ```typescript
 * if (await checkDuplicateInvitation(db, 'group-123', 'friend@example.com')) {
 *   throw new Error('This person already has a pending invitation');
 * }
 * ```
 */
export async function checkDuplicateInvitation(
    db: Firestore,
    groupId: string,
    email: string
): Promise<boolean> {
    if (!groupId || !email) {
        return false;
    }

    // TD-CONSOLIDATED-6: Validate groupId for consistency with other service entry points
    try {
        validateGroupId(groupId);
    } catch {
        return false;
    }

    // Normalize email for consistent comparison
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return false;
    }

    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const q = query(
        invitationsRef,
        where('groupId', '==', groupId),
        where('invitedEmail', '==', normalizedEmail),
        where('status', '==', 'pending'),
        limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

/**
 * Get all pending invitations for a specific email address.
 *
 * Used to show a user their pending invitations after they sign in.
 * Only returns invitations with 'pending' status.
 *
 * @param db - Firestore instance
 * @param email - The email address to check
 * @returns Array of pending invitations (may be empty)
 *
 * @example
 * ```typescript
 * const invitations = await getInvitationsForEmail(db, 'user@example.com');
 * console.log(`You have ${invitations.length} pending invitations`);
 * ```
 */
export async function getInvitationsForEmail(
    db: Firestore,
    email: string
): Promise<PendingInvitation[]> {
    if (!email) {
        return [];
    }

    // Normalize email for consistent comparison
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return [];
    }

    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const q = query(
        invitationsRef,
        where('invitedEmail', '==', normalizedEmail),
        where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
    } as PendingInvitation));
}

/**
 * Get all pending invitations for a user, sorted by date (newest first).
 *
 * Story 14d-v2-1-6a: Deep Link & Pending Invitations Service (AC #4)
 *
 * Queries invitations where:
 * - invitedEmail matches the user's email (normalized)
 * - status is 'pending'
 * - Results sorted by createdAt descending
 *
 * Each invitation includes: group name, inviter name, invitation date (createdAt)
 *
 * @param db - Firestore instance
 * @param email - The user's email address
 * @returns Array of pending invitations sorted by date (newest first)
 *
 * @example
 * ```typescript
 * const invitations = await getPendingInvitationsForUser(db, 'user@example.com');
 * invitations.forEach(inv => {
 *   console.log(`${inv.groupName} - invited by ${inv.invitedByName} on ${inv.createdAt.toDate()}`);
 * });
 * ```
 */
export async function getPendingInvitationsForUser(
    db: Firestore,
    email: string
): Promise<PendingInvitation[]> {
    if (!email) {
        return [];
    }

    // Normalize email for consistent comparison
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return [];
    }

    const invitationsRef = collection(db, INVITATIONS_COLLECTION);

    // Query: email match + status pending + order by createdAt desc
    // AC #4: "returned sorted by date (newest first)"
    const q = query(
        invitationsRef,
        where('invitedEmail', '==', normalizedEmail),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
    } as PendingInvitation));
}

// =============================================================================
// Types - Group Capacity Validation
// =============================================================================

/**
 * Result of group capacity validation.
 * Story 14d-v2-1-5b-2: Invitation Validation & Security Rules
 */
export interface GroupCapacityResult {
    /** Whether a new contributor can be added (BC-2: max 10) */
    canAddContributor: boolean;
    /** Whether a new viewer can be added (BC-3: max 200) */
    canAddViewer: boolean;
    /** Human-readable reason if any limit is reached */
    reason?: string;
}

// =============================================================================
// Constants - Group Collections
// =============================================================================

/**
 * Firestore collection name for shared groups.
 */
const GROUPS_COLLECTION = 'sharedGroups';

// =============================================================================
// Group Capacity Validation
// =============================================================================

/**
 * Validate if a group can accept new members.
 *
 * Checks the current member count against business constraints:
 * - BC-2: Maximum 10 contributors per group
 * - BC-3: Maximum 200 viewers per group
 *
 * Story 14d-v2-1-5b-2: Invitation Validation & Security Rules
 *
 * @param db - Firestore instance
 * @param groupId - The shared group ID to validate
 * @returns Validation result with capacity flags and optional reason
 *
 * @example
 * ```typescript
 * const result = await validateGroupCapacity(db, 'group-123');
 * if (!result.canAddContributor) {
 *   showError(result.reason);
 *   return;
 * }
 * // Proceed with invitation...
 * ```
 */
export async function validateGroupCapacity(
    db: Firestore,
    groupId: string
): Promise<GroupCapacityResult> {
    // Validate input
    // TD-CONSOLIDATED-6: Validate groupId format before Firestore path construction
    try {
        validateGroupId(groupId);
    } catch {
        return {
            canAddContributor: false,
            canAddViewer: false,
            reason: 'Invalid group ID',
        };
    }

    // Get the group document
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const groupSnap = await getDoc(groupRef);

    // Check if group exists
    if (!groupSnap.exists()) {
        return {
            canAddContributor: false,
            canAddViewer: false,
            reason: 'Group not found',
        };
    }

    const group = groupSnap.data() as SharedGroup;

    // Get current member count
    // In current model, all members are contributors (no viewer role yet)
    const memberCount = group.members?.length ?? 0;

    // Check BC-2: Contributors limit (10)
    const canAddContributor = memberCount < SHARED_GROUP_LIMITS.MAX_CONTRIBUTORS_PER_GROUP;

    // Check BC-3: Viewers limit (200)
    // Currently all members count against viewer limit too
    const canAddViewer = memberCount < SHARED_GROUP_LIMITS.MAX_VIEWERS_PER_GROUP;

    // Build reason message if any limit is reached
    // Prioritize viewer limit message when that limit is hit, since it's the higher constraint
    let reason: string | undefined;

    if (!canAddViewer) {
        // Viewer limit (200) reached - this is the hard cap
        reason = `This group has reached the maximum number of viewers (${SHARED_GROUP_LIMITS.MAX_VIEWERS_PER_GROUP})`;
    } else if (!canAddContributor) {
        // Contributor limit (10) reached - but viewers can still be added
        reason = `This group has reached the maximum number of contributors (${SHARED_GROUP_LIMITS.MAX_CONTRIBUTORS_PER_GROUP})`;
    }

    return {
        canAddContributor,
        canAddViewer,
        reason,
    };
}

// =============================================================================
// Types - Invitation Validation (Story 14d-v2-1-6b)
// =============================================================================

/**
 * Error types for share code validation.
 * Story 14d-v2-1-6b: Task 5 - Invalid/Expired Share Code Handling
 *
 * @example
 * ```typescript
 * const result = await validateInvitationByShareCode(db, 'abc123');
 * if (!result.valid) {
 *   switch (result.error) {
 *     case ShareCodeValidationError.INVALID_FORMAT:
 *       showError("This invite link is invalid or expired");
 *       break;
 *     case ShareCodeValidationError.EXPIRED:
 *       showError("This invitation has expired. Please ask for a new invite.");
 *       break;
 *   }
 * }
 * ```
 */
export enum ShareCodeValidationError {
    /** Share code format is invalid (not 16-char alphanumeric) - per FR-26 */
    INVALID_FORMAT = 'INVALID_FORMAT',
    /** No invitation found with this share code - per FR-26 */
    NOT_FOUND = 'NOT_FOUND',
    /** Invitation has expired (expiresAt > 7 days) - AC #5 */
    EXPIRED = 'EXPIRED',
    /** Invitation was already accepted or declined */
    ALREADY_PROCESSED = 'ALREADY_PROCESSED',
}

/**
 * Result of share code validation.
 */
export type ShareCodeValidationResult =
    | { valid: true; invitation: PendingInvitation }
    | { valid: false; error: ShareCodeValidationError };

/**
 * User error messages for share code validation errors.
 * Story 14d-v2-1-6b: Per FR-26 and AC #3, #5
 */
export const SHARE_CODE_ERROR_MESSAGES: Record<ShareCodeValidationError, string> = {
    [ShareCodeValidationError.INVALID_FORMAT]: 'This invite link is invalid or expired',
    [ShareCodeValidationError.NOT_FOUND]: 'This invite link is invalid or expired',
    [ShareCodeValidationError.EXPIRED]: 'This invitation has expired. Please ask for a new invite.',
    [ShareCodeValidationError.ALREADY_PROCESSED]: 'This invitation was already used',
};

// =============================================================================
// Invitation Validation (Story 14d-v2-1-6b: Task 5)
// =============================================================================

/**
 * Validate a share code and return the invitation if valid.
 *
 * Story 14d-v2-1-6b: Task 5 - Invalid/Expired Share Code Handling
 *
 * @deprecated TD-CONSOLIDATED-5: This function queries by shareCode without email filter.
 * Client-side calls will be denied by security rules. Use getInvitationByShareCode()
 * with userEmail parameter instead, or move this to a Cloud Function.
 *
 * Validates:
 * - Share code format (16-char alphanumeric) - AC #3
 * - Invitation exists - AC #3
 * - Invitation not expired (expiresAt > now) - AC #5
 * - Invitation status is 'pending'
 *
 * @param db - Firestore instance
 * @param shareCode - The share code to validate
 * @returns Validation result with either the invitation or error type
 *
 * @example
 * ```typescript
 * const result = await validateInvitationByShareCode(db, 'Ab3dEf7hIj9kLm0p');
 * if (result.valid) {
 *   console.log(`Valid invitation to: ${result.invitation.groupName}`);
 * } else {
 *   console.log(`Error: ${SHARE_CODE_ERROR_MESSAGES[result.error]}`);
 * }
 * ```
 */
export async function validateInvitationByShareCode(
    db: Firestore,
    shareCode: string
): Promise<ShareCodeValidationResult> {
    // Validate format first (AC #3)
    if (!isValidShareCode(shareCode)) {
        return { valid: false, error: ShareCodeValidationError.INVALID_FORMAT };
    }

    // Query for invitation by share code (any status)
    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const q = query(
        invitationsRef,
        where('shareCode', '==', shareCode),
        limit(1)
    );

    const snapshot = await getDocs(q);

    // Check if invitation exists (AC #3)
    if (snapshot.empty) {
        return { valid: false, error: ShareCodeValidationError.NOT_FOUND };
    }

    const docSnap = snapshot.docs[0];
    const invitation: PendingInvitation = {
        id: docSnap.id,
        ...docSnap.data(),
    } as PendingInvitation;

    // Check if already processed (accepted/declined)
    if (invitation.status !== 'pending') {
        return { valid: false, error: ShareCodeValidationError.ALREADY_PROCESSED };
    }

    // Check if expired (AC #5)
    if (isInvitationExpired(invitation)) {
        return { valid: false, error: ShareCodeValidationError.EXPIRED };
    }

    return { valid: true, invitation };
}

// =============================================================================
// Accept/Decline Invitation (Story 14d-v2-1-6b: Tasks 3 & 4)
// =============================================================================

/**
 * Accept an invitation and join the shared group.
 *
 * Story 14d-v2-1-6b: Task 3 - Accept Invitation Logic (AC #1, #4)
 *
 * This function performs the following atomically using a Firestore transaction:
 * 1. Validates invitation exists and is pending
 * 2. Validates invitation has not expired
 * 3. Adds user to the group's members array
 * 4. Updates invitation status to 'accepted'
 *
 * Note: User group preferences with shareMyTransactions setting are created
 * separately in the UI layer after the accept completes, as the preferences
 * document structure may vary by implementation.
 *
 * @param db - Firestore instance
 * @param invitationId - The invitation document ID
 * @param userId - The user ID accepting the invitation
 * @param userProfile - User profile info for memberProfiles
 * @throws Error if invitation not found, expired, or already processed
 *
 * @example
 * ```typescript
 * await acceptInvitation(db, 'invitation-123', 'user-xyz', {
 *   displayName: 'Juan García',
 *   email: 'juan@example.com',
 * });
 * ```
 */
export async function acceptInvitation(
    db: Firestore,
    invitationId: string,
    userId: string,
    userProfile?: { displayName?: string; email?: string; photoURL?: string },
    appId?: string,
    shareMyTransactions?: boolean
): Promise<void> {
    if (!invitationId || !userId) {
        throw new Error('Invitation ID and user ID are required');
    }

    // Story 14d-v2-1-13+14: Validate appId if provided (ECC Security Review fix)
    if (appId && !validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

    await runTransaction(db, async (transaction) => {
        // Get the invitation document
        const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
        const invitationSnap = await transaction.get(invitationRef);

        if (!invitationSnap.exists()) {
            throw new Error('Invitation not found');
        }

        const invitation = {
            id: invitationSnap.id,
            ...invitationSnap.data(),
        } as PendingInvitation;

        // TD-CONSOLIDATED-6: Validate groupId early, before any path construction
        validateGroupId(invitation.groupId);

        // Validate invitation status
        if (invitation.status !== 'pending') {
            throw new Error('Invitation has already been processed');
        }

        // Validate not expired (AC #5)
        if (isInvitationExpired(invitation)) {
            throw new Error('Invitation has expired');
        }

        // Get the group document
        const groupRef = doc(db, GROUPS_COLLECTION, invitation.groupId);
        const groupSnap = await transaction.get(groupRef);

        if (!groupSnap.exists()) {
            throw new Error('Group not found');
        }

        const group = groupSnap.data() as SharedGroup;

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

        // Add member profile if provided (with sanitization per Atlas Section 6 pattern)
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

        // Update invitation: mark as accepted
        transaction.update(invitationRef, {
            status: 'accepted',
        });

        // Story 14d-v2-1-13+14: Write user group preference atomically (AC15)
        if (appId) {
            const prefsDocRef = doc(db, 'artifacts', appId, 'users', userId, 'preferences', 'sharedGroups');
            const preference = createDefaultGroupPreference({
                shareMyTransactions: shareMyTransactions ?? false,
            });
            // Uses nested object (not dot-notation) because transaction.set treats dot-notation keys as literal field names
            transaction.set(prefsDocRef, {
                groupPreferences: {
                    [invitation.groupId]: preference,
                },
            }, { merge: true });
        }
    });
}

/**
 * Decline an invitation without joining the group.
 *
 * Story 14d-v2-1-6b: Task 4 - Decline Invitation Logic (AC #2)
 *
 * Simply updates the invitation status to 'declined'.
 * Does NOT add the user to the group.
 *
 * @param db - Firestore instance
 * @param invitationId - The invitation document ID
 * @throws Error if invitation not found or already processed
 *
 * @example
 * ```typescript
 * await declineInvitation(db, 'invitation-123');
 * ```
 */
export async function declineInvitation(
    db: Firestore,
    invitationId: string
): Promise<void> {
    if (!invitationId) {
        throw new Error('Invitation ID is required');
    }

    // ECC Review: Use transaction for consistency with acceptInvitation
    // Prevents race conditions when accepting/declining rapidly
    await runTransaction(db, async (transaction) => {
        const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
        const invitationSnap = await transaction.get(invitationRef);

        if (!invitationSnap.exists()) {
            throw new Error('Invitation not found');
        }

        const invitation = invitationSnap.data() as PendingInvitation;

        // Validate invitation status (AC #2: can only decline pending invitations)
        if (invitation.status !== 'pending') {
            throw new Error('Invitation has already been processed');
        }

        // Update invitation status to 'declined' (AC #2)
        transaction.update(invitationRef, {
            status: 'declined',
        });
    });
}
