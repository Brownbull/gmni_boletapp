/**
 * Group Deletion Service
 *
 * TD-CONSOLIDATED-1: Extracted from groupService.ts during modularization.
 * Story 14d-v2-1-7b: Deletion Service Logic
 *
 * Service functions for deleting shared groups with cascade cleanup.
 * Handles last-member deletion and owner force-deletion with:
 * - Transaction clearing on member documents
 * - Subcollection cleanup (changelog, analytics)
 * - Pending invitation removal
 * - TOCTOU-safe atomic group document deletion
 */

import {
    Firestore,
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    runTransaction,
    writeBatch,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { SharedGroup } from '@/types/sharedGroup';
import { validateAppId, validateGroupId } from '@/utils/validationUtils';
import {
    GROUPS_COLLECTION,
    CHANGELOG_SUBCOLLECTION,
    ANALYTICS_SUBCOLLECTION,
    INVITATIONS_COLLECTION,
    BATCH_SIZE,
} from './groupConstants';

// =============================================================================
// Deletion Helper Functions
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
    docs: QueryDocumentSnapshot<DocumentData>[],
    operation: 'update' | 'delete',
    updateData?: Record<string, unknown>
): Promise<void> {
    if (docs.length === 0) {
        return;
    }

    let batch = writeBatch(db);
    let operationCount = 0;

    for (const docSnap of docs) {
        if (operation === 'delete') {
            batch.delete(docSnap.ref);
        } else if (operation === 'update' && updateData) {
            batch.update(docSnap.ref, updateData);
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
 * TD-CONSOLIDATED-5: Must filter by invitedByUserId to comply with list security rules
 *
 * @param db - Firestore instance
 * @param groupId - Group ID
 * @param userId - User ID of the inviter (group owner) - required for security rules
 * @returns {Promise<void>}
 *
 * @internal
 */
async function deletePendingInvitationsForGroup(
    db: Firestore,
    groupId: string,
    userId: string
): Promise<void> {
    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    // TD-CONSOLIDATED-5: Security rules require list queries to filter by invitedByUserId
    const q = query(
        invitationsRef,
        where('groupId', '==', groupId),
        where('invitedByUserId', '==', userId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        await processBatchedOperation(db, snapshot.docs, 'delete');
    }
}

// =============================================================================
// Group Deletion Functions
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
    // TD-CONSOLIDATED-6: Validate groupId before Firestore path construction
    validateGroupId(groupId);

    // ECC Review: HIGH severity fix - validate appId to prevent path traversal
    if (!validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

    // Audit log: Deletion initiated
    if (import.meta.env.DEV) {
        console.log('[groupDeletionService] deleteGroupAsLastMember initiated', {
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
                console.warn('[groupDeletionService] Changelog deletion failed (expected with client SDK):', changelogError);
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
                console.warn('[groupDeletionService] Analytics deletion failed (may be expected):', analyticsError);
            }
        }

        // 4. Delete pending invitations for the group
        // TD-CONSOLIDATED-5: Pass userId for security rule compliance.
        // Note: Only deletes invitations created by this userId. If ownership was
        // transferred, invitations from previous owners remain but expire via 7-day TTL.
        await deletePendingInvitationsForGroup(db, groupId, userId);
    } catch (cascadeError) {
        // ECC Review: MEDIUM severity fix - structured logging for cascade failures
        if (import.meta.env.DEV) {
            console.error('[groupDeletionService] Cascade cleanup partial failure:', {
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
        console.log('[groupDeletionService] deleteGroupAsLastMember completed', {
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
    // TD-CONSOLIDATED-6: Validate groupId before Firestore path construction
    validateGroupId(groupId);

    // ECC Review: HIGH severity fix - validate appId to prevent path traversal
    if (!validateAppId(appId)) {
        throw new Error('Invalid application ID');
    }

    // Audit log: Deletion initiated
    if (import.meta.env.DEV) {
        console.log('[groupDeletionService] deleteGroupAsOwner initiated', {
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
                console.warn('[groupDeletionService] Changelog deletion failed (expected with client SDK):', changelogError);
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
                console.warn('[groupDeletionService] Analytics deletion failed (may be expected):', analyticsError);
            }
        }

        // 4. Delete pending invitations for the group
        // TD-CONSOLIDATED-5: Pass ownerId for security rule compliance.
        // Note: Only deletes invitations created by this ownerId. Invitations from
        // previous owners (if ownership was transferred) expire via 7-day TTL.
        await deletePendingInvitationsForGroup(db, groupId, ownerId);
    } catch (cascadeError) {
        // ECC Review: MEDIUM severity fix - structured logging for cascade failures
        if (import.meta.env.DEV) {
            console.error('[groupDeletionService] Cascade cleanup partial failure:', {
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
        console.log('[groupDeletionService] deleteGroupAsOwner completed', {
            ownerId,
            groupId,
            membersAffected: memberIds.length,
            timestamp: new Date().toISOString(),
        });
    }
}
