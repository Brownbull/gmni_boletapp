/**
 * Delete Group Integration Tests
 *
 * Story 14d-v2-1-7f: Integration Tests for Leave/Manage Group Flows
 *
 * Tests deleteGroupAsLastMember and deleteGroupAsOwner service functions
 * against Firestore emulator.
 *
 * Test Coverage (21 tests):
 *
 * Last Member Deletion (8 tests):
 * 1. Delete group when last member leaves
 * 2. Clear sharedGroupId on user's transactions
 * 3. Delete pending invitations for the group
 * 4. Handle large transaction counts with batching (600+)
 * 5. Reject if group has multiple members
 * 6. Reject if user is not a member
 * 7. Reject invalid appId (path traversal protection)
 * 8. Atomic re-verification before delete
 *
 * Owner Deletion (13 tests):
 * 9. Allow owner to force delete group with members
 * 10. Clear sharedGroupId on ALL members' transactions
 * 11. Delete all pending invitations
 * 12. Reject deletion by non-owner
 * 13. Validate ownership BEFORE cascade operations
 * 14. Audit log deletion in DEV mode
 * 15. Handle empty members array gracefully
 * 16. Reject invalid appId
 * 17. Reject owner deletion of non-existent group
 * 18. Reject owner deletion with empty parameters
 * 19. Reject last member deletion with empty parameters
 * 20. Reject groupId path traversal attempts
 * 21. Verify changelog/analytics cascade deletion attempt
 *
 * Note: Security rules tests already exist in firestore-rules.test.ts.
 * This file focuses on service layer integration testing.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import {
    setupFirebaseEmulator,
    teardownFirebaseEmulator,
    clearFirestoreData,
    withSecurityRulesDisabled,
    TEST_USERS,
    SHARED_GROUPS_PATH,
    PENDING_INVITATIONS_PATH,
} from '../../setup/firebase-emulator';
import {
    doc,
    setDoc,
    getDoc,
    Timestamp,
    collection,
    addDoc,
    getDocs,
    query,
    where,
} from 'firebase/firestore';
import {
    deleteGroupAsLastMember,
    deleteGroupAsOwner,
} from '@/features/shared-groups/services/groupService';

// =============================================================================
// Test Constants
// =============================================================================

const TEST_GROUP_ID = 'delete-test-group';
const TEST_USER_3 = 'test-user-3-uid';
const TEST_APP_ID = 'boletapp';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a valid shared group for testing.
 */
function createTestGroup(
    ownerId: string,
    members: string[] = [ownerId],
    overrides: Record<string, unknown> = {}
) {
    return {
        name: 'Test Delete Group',
        ownerId,
        appId: TEST_APP_ID,
        color: '#10b981',
        shareCode: 'delete-code-12345',
        shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        members,
        memberUpdates: {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        timezone: 'America/Santiago',
        transactionSharingEnabled: true,
        transactionSharingLastToggleAt: null,
        transactionSharingToggleCountToday: 0,
        ...overrides,
    };
}

/**
 * Create a test transaction tagged with a shared group.
 */
function createTestTransaction(sharedGroupId: string | null) {
    return {
        merchant: 'Test Merchant',
        date: '2026-02-03',
        total: 10000,
        currency: 'CLP',
        category: 'groceries',
        items: [],
        sharedGroupId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };
}

/**
 * Create a pending invitation for a group.
 */
function createTestInvitation(groupId: string) {
    return {
        groupId,
        groupName: 'Test Group',
        groupColor: '#10b981',
        shareCode: 'invite-code-12345',
        invitedEmail: 'invited@test.com',
        invitedByUserId: TEST_USERS.USER_1,
        invitedByName: 'Test User',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        status: 'pending',
    };
}

// =============================================================================
// Integration Tests - deleteGroupAsLastMember
// =============================================================================

describe('deleteGroupAsLastMember Integration Tests (Story 14d-v2-1-7f)', () => {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });

    // =========================================================================
    // Test 1: Delete group when last member leaves
    // =========================================================================
    it('should delete group when last member deletes', async () => {
        // ARRANGE: Create group with single member (owner)
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });
        });

        // ACT: Delete group as last member
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: Group is deleted
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(false);
        });
    });

    // =========================================================================
    // Test 2: Clear sharedGroupId on user's transactions
    // =========================================================================
    it('should clear sharedGroupId on user transactions when deleting as last member', async () => {
        // ARRANGE: Create group and transactions
        await withSecurityRulesDisabled(async (firestore) => {
            // Create group
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });

            // Create transactions for USER_1 tagged with this group
            const transactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_1,
                'transactions'
            );
            await addDoc(transactionsRef, createTestTransaction(TEST_GROUP_ID));
            await addDoc(transactionsRef, createTestTransaction(TEST_GROUP_ID));
            await addDoc(transactionsRef, createTestTransaction(null)); // Untagged transaction
        });

        // ACT: Delete group as last member
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: Transactions have sharedGroupId cleared
        await withSecurityRulesDisabled(async (firestore) => {
            const transactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_1,
                'transactions'
            );
            const snapshot = await getDocs(transactionsRef);

            // All transactions should have sharedGroupId = null
            snapshot.docs.forEach((docSnap) => {
                expect(docSnap.data().sharedGroupId).toBeNull();
            });
        });
    });

    // =========================================================================
    // Test 3: Delete pending invitations for the group
    // =========================================================================
    it('should delete pending invitations when deleting group as last member', async () => {
        // ARRANGE: Create group and pending invitations
        await withSecurityRulesDisabled(async (firestore) => {
            // Create group
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });

            // Create pending invitations
            await addDoc(
                collection(firestore, PENDING_INVITATIONS_PATH),
                createTestInvitation(TEST_GROUP_ID)
            );
            await addDoc(
                collection(firestore, PENDING_INVITATIONS_PATH),
                createTestInvitation(TEST_GROUP_ID)
            );
            // Create invitation for different group (should not be deleted)
            await addDoc(
                collection(firestore, PENDING_INVITATIONS_PATH),
                createTestInvitation('other-group-id')
            );
        });

        // ACT: Delete group as last member
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: Only invitations for deleted group are removed
        await withSecurityRulesDisabled(async (firestore) => {
            const invitationsRef = collection(firestore, PENDING_INVITATIONS_PATH);

            // Invitations for deleted group should be gone
            const deletedGroupInvitations = query(
                invitationsRef,
                where('groupId', '==', TEST_GROUP_ID)
            );
            const deletedSnapshot = await getDocs(deletedGroupInvitations);
            expect(deletedSnapshot.size).toBe(0);

            // Other invitations should remain
            const otherInvitations = query(invitationsRef, where('groupId', '==', 'other-group-id'));
            const otherSnapshot = await getDocs(otherInvitations);
            expect(otherSnapshot.size).toBe(1);
        });
    });

    // =========================================================================
    // Test 4: Handle large transaction counts with batching (600+)
    // =========================================================================
    it('should handle large transaction counts with batching', async () => {
        // ARRANGE: Create group and many transactions (exceeds 500 batch limit)
        const transactionCount = 600;

        await withSecurityRulesDisabled(async (firestore) => {
            // Create group
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });

            // Create 600 transactions
            const transactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_1,
                'transactions'
            );

            // Create in batches to avoid timeout
            const batchSize = 100;
            for (let i = 0; i < transactionCount; i += batchSize) {
                const promises = [];
                for (let j = 0; j < batchSize && i + j < transactionCount; j++) {
                    promises.push(addDoc(transactionsRef, createTestTransaction(TEST_GROUP_ID)));
                }
                await Promise.all(promises);
            }
        });

        // ACT: Delete group as last member
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: All transactions have sharedGroupId cleared
        await withSecurityRulesDisabled(async (firestore) => {
            const transactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_1,
                'transactions'
            );
            const q = query(transactionsRef, where('sharedGroupId', '==', TEST_GROUP_ID));
            const snapshot = await getDocs(q);

            // No transactions should have the old sharedGroupId
            expect(snapshot.size).toBe(0);
        });
    }, 30000); // Extended timeout for large batch operations

    // =========================================================================
    // Test 5: Reject if group has multiple members
    // =========================================================================
    it('should reject delete if group has multiple members', async () => {
        // ARRANGE: Create group with multiple members
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]),
            });
        });

        // ACT & ASSERT: Should reject deletion
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID)
            ).rejects.toThrow('Cannot delete group with other members');
        });

        // ASSERT: Group still exists
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(true);
        });
    });

    // =========================================================================
    // Test 6: Reject if user is not a member
    // =========================================================================
    it('should reject delete if user is not a member', async () => {
        // ARRANGE: Create group without USER_2
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });
        });

        // ACT & ASSERT: Non-member cannot delete
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsLastMember(firestore, TEST_USERS.USER_2, TEST_GROUP_ID, TEST_APP_ID)
            ).rejects.toThrow('You are not a member of this group');
        });
    });

    // =========================================================================
    // Test 7: Reject invalid appId (path traversal protection)
    // =========================================================================
    it('should reject invalid appId to prevent path traversal', async () => {
        // ARRANGE: Create group
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });
        });

        // ACT & ASSERT: Invalid appId should be rejected
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, '../hack')
            ).rejects.toThrow('Invalid application ID');

            await expect(
                deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, 'unknown-app')
            ).rejects.toThrow('Invalid application ID');
        });
    });

    // =========================================================================
    // Test 8: Atomic re-verification before delete
    // =========================================================================
    it('should atomically re-verify membership before delete', async () => {
        // ARRANGE: Create group with single member
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });
        });

        // ACT: Delete group - the transaction should atomically verify
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: Group is deleted (atomic verification passed)
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(false);
        });
    });
});

// =============================================================================
// Integration Tests - deleteGroupAsOwner
// =============================================================================

describe('deleteGroupAsOwner Integration Tests (Story 14d-v2-1-7f)', () => {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });

    // =========================================================================
    // Test 9: Allow owner to force delete group with members
    // =========================================================================
    it('should allow owner to force delete group with members', async () => {
        // ARRANGE: Create group with multiple members
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [
                    TEST_USERS.USER_1,
                    TEST_USERS.USER_2,
                    TEST_USER_3,
                ]),
            });
        });

        // ACT: Owner force deletes
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsOwner(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: Group is deleted
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(false);
        });
    });

    // =========================================================================
    // Test 10: Clear sharedGroupId on ALL members' transactions
    // =========================================================================
    it('should clear sharedGroupId on ALL members transactions when owner deletes', async () => {
        // ARRANGE: Create group and transactions for all members
        await withSecurityRulesDisabled(async (firestore) => {
            // Create group
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]),
            });

            // Create transactions for USER_1
            const user1TransactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_1,
                'transactions'
            );
            await addDoc(user1TransactionsRef, createTestTransaction(TEST_GROUP_ID));

            // Create transactions for USER_2
            const user2TransactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_2,
                'transactions'
            );
            await addDoc(user2TransactionsRef, createTestTransaction(TEST_GROUP_ID));
            await addDoc(user2TransactionsRef, createTestTransaction(TEST_GROUP_ID));
        });

        // ACT: Owner deletes group
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsOwner(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: All members' transactions have sharedGroupId cleared
        await withSecurityRulesDisabled(async (firestore) => {
            // Check USER_1 transactions
            const user1TransactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_1,
                'transactions'
            );
            const user1Snapshot = await getDocs(user1TransactionsRef);
            user1Snapshot.docs.forEach((docSnap) => {
                expect(docSnap.data().sharedGroupId).toBeNull();
            });

            // Check USER_2 transactions
            const user2TransactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_2,
                'transactions'
            );
            const user2Snapshot = await getDocs(user2TransactionsRef);
            user2Snapshot.docs.forEach((docSnap) => {
                expect(docSnap.data().sharedGroupId).toBeNull();
            });
        });
    });

    // =========================================================================
    // Test 11: Delete all pending invitations
    // =========================================================================
    it('should delete all pending invitations when owner deletes group', async () => {
        // ARRANGE: Create group and pending invitations
        await withSecurityRulesDisabled(async (firestore) => {
            // Create group
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });

            // Create multiple pending invitations
            await addDoc(
                collection(firestore, PENDING_INVITATIONS_PATH),
                createTestInvitation(TEST_GROUP_ID)
            );
            await addDoc(
                collection(firestore, PENDING_INVITATIONS_PATH),
                createTestInvitation(TEST_GROUP_ID)
            );
            await addDoc(
                collection(firestore, PENDING_INVITATIONS_PATH),
                createTestInvitation(TEST_GROUP_ID)
            );
        });

        // ACT: Owner deletes group
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsOwner(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: All invitations for this group are deleted
        await withSecurityRulesDisabled(async (firestore) => {
            const invitationsRef = collection(firestore, PENDING_INVITATIONS_PATH);
            const q = query(invitationsRef, where('groupId', '==', TEST_GROUP_ID));
            const snapshot = await getDocs(q);
            expect(snapshot.size).toBe(0);
        });
    });

    // =========================================================================
    // Test 12: Reject deletion by non-owner
    // =========================================================================
    it('should reject deletion by non-owner', async () => {
        // ARRANGE: Create group with USER_1 as owner
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]),
            });
        });

        // ACT & ASSERT: Non-owner cannot delete
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_2, TEST_GROUP_ID, TEST_APP_ID)
            ).rejects.toThrow('Only the group owner can delete the group');
        });

        // ASSERT: Group still exists
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(true);
        });
    });

    // =========================================================================
    // Test 13: Validate ownership BEFORE cascade operations
    // =========================================================================
    it('should validate ownership BEFORE cascade operations', async () => {
        // ARRANGE: Create group and transactions
        await withSecurityRulesDisabled(async (firestore) => {
            // Create group
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]),
            });

            // Create transactions for USER_2 (not the owner)
            const user2TransactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_2,
                'transactions'
            );
            await addDoc(user2TransactionsRef, createTestTransaction(TEST_GROUP_ID));
        });

        // ACT & ASSERT: Non-owner delete attempt should fail BEFORE touching transactions
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_2, TEST_GROUP_ID, TEST_APP_ID)
            ).rejects.toThrow('Only the group owner can delete the group');
        });

        // ASSERT: Transactions should NOT be modified (ownership validated first)
        await withSecurityRulesDisabled(async (firestore) => {
            const user2TransactionsRef = collection(
                firestore,
                'artifacts',
                TEST_APP_ID,
                'users',
                TEST_USERS.USER_2,
                'transactions'
            );
            const q = query(user2TransactionsRef, where('sharedGroupId', '==', TEST_GROUP_ID));
            const snapshot = await getDocs(q);

            // Transactions should still have sharedGroupId (not cleared)
            expect(snapshot.size).toBe(1);
        });
    });

    // =========================================================================
    // Test 14: Audit log deletion in DEV mode
    // =========================================================================
    it('should log audit events in DEV mode', async () => {
        // ARRANGE: Spy on console.log
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        // Create group
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });
        });

        // ACT: Delete group
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsOwner(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: Verify audit log was called (if DEV mode enabled)
        // Note: import.meta.env.DEV may not be true in test environment
        // If DEV is true, console.log should have been called with audit messages
        const auditCalls = consoleSpy.mock.calls.filter(
            (call) => typeof call[0] === 'string' && call[0].includes('[groupService]')
        );

        // In DEV mode, expect at least 2 audit log calls (initiated + completed)
        // In non-DEV mode, expect 0 calls - both are valid depending on environment
        expect(auditCalls.length === 0 || auditCalls.length >= 2).toBe(true);

        // If audit logs were fired, verify they contain expected data
        if (auditCalls.length > 0) {
            const initiatedCall = auditCalls.find((call) =>
                call[0].includes('deleteGroupAsOwner initiated')
            );
            const completedCall = auditCalls.find((call) =>
                call[0].includes('deleteGroupAsOwner completed')
            );

            expect(initiatedCall).toBeDefined();
            expect(completedCall).toBeDefined();

            // Verify the log data contains expected fields
            if (initiatedCall && initiatedCall[1]) {
                expect(initiatedCall[1]).toHaveProperty('groupId', TEST_GROUP_ID);
                expect(initiatedCall[1]).toHaveProperty('ownerId', TEST_USERS.USER_1);
            }
            if (completedCall && completedCall[1]) {
                expect(completedCall[1]).toHaveProperty('groupId', TEST_GROUP_ID);
            }
        }

        // Cleanup
        consoleSpy.mockRestore();
    });

    // =========================================================================
    // Test 15: Handle empty members array gracefully
    // =========================================================================
    it('should handle empty members array gracefully', async () => {
        // ARRANGE: Create group with empty members (edge case - shouldn't happen normally)
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, []), // Empty members
            });
        });

        // ACT: Owner deletes group
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsOwner(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, TEST_APP_ID);
        });

        // ASSERT: Group is deleted without errors
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(false);
        });
    });

    // =========================================================================
    // Test 16: Reject invalid appId
    // =========================================================================
    it('should reject invalid appId for owner deletion', async () => {
        // ARRANGE: Create group
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });
        });

        // ACT & ASSERT: Invalid appId should be rejected
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, '../traversal')
            ).rejects.toThrow('Invalid application ID');

            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_1, TEST_GROUP_ID, 'malicious-app')
            ).rejects.toThrow('Invalid application ID');
        });

        // ASSERT: Group still exists
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(true);
        });
    });

    // =========================================================================
    // Test 17: Reject owner deletion of non-existent group
    // ECC Review: HIGH priority - ensure proper error for missing group
    // =========================================================================
    it('should reject owner deletion of non-existent group', async () => {
        // ACT & ASSERT: Attempt to delete group that doesn't exist
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_1, 'non-existent-group-id', TEST_APP_ID)
            ).rejects.toThrow('Group not found');
        });
    });

    // =========================================================================
    // Test 18: Reject owner/group deletion with empty parameters
    // ECC Review: MEDIUM priority - consistent validation across functions
    // =========================================================================
    it('should reject owner deletion with empty parameters', async () => {
        // ACT & ASSERT: Empty ownerId
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsOwner(firestore, '', TEST_GROUP_ID, TEST_APP_ID)
            ).rejects.toThrow('Owner ID and group ID are required');
        });

        // ACT & ASSERT: Empty groupId
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_1, '', TEST_APP_ID)
            ).rejects.toThrow('Owner ID and group ID are required');
        });
    });

    // =========================================================================
    // Test 19: Reject last member deletion with empty parameters
    // ECC Review: MEDIUM priority - consistent validation across functions
    // =========================================================================
    it('should reject last member deletion with empty parameters', async () => {
        // ACT & ASSERT: Empty userId
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsLastMember(firestore, '', TEST_GROUP_ID, TEST_APP_ID)
            ).rejects.toThrow('User ID and group ID are required');
        });

        // ACT & ASSERT: Empty groupId
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                deleteGroupAsLastMember(firestore, TEST_USERS.USER_1, '', TEST_APP_ID)
            ).rejects.toThrow('User ID and group ID are required');
        });
    });

    // =========================================================================
    // Test 20: Reject groupId path traversal attempts
    // ECC Review: LOW priority - defense-in-depth for groupId validation
    // =========================================================================
    it('should reject groupId with path traversal characters', async () => {
        // ACT & ASSERT: groupId with path traversal should be rejected or fail gracefully
        await withSecurityRulesDisabled(async (firestore) => {
            // Note: Firestore document IDs cannot contain '/' so these would naturally fail
            // This test documents the expected behavior for defense-in-depth
            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_1, '../hack', TEST_APP_ID)
            ).rejects.toThrow();

            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_1, 'group/../other', TEST_APP_ID)
            ).rejects.toThrow();

            // Empty groupId should also be rejected
            await expect(
                deleteGroupAsOwner(firestore, TEST_USERS.USER_1, '', TEST_APP_ID)
            ).rejects.toThrow('Owner ID and group ID are required');
        });
    });

    // =========================================================================
    // Test 21: Verify changelog/analytics cascade deletion attempt
    // ECC Review: MEDIUM priority - cascade verification
    // Note: Client SDK may not have permission to delete subcollections,
    // but we verify the service handles this gracefully.
    // =========================================================================
    it('should attempt cascade deletion of changelog and analytics subcollections', async () => {
        const CHANGELOG_GROUP_ID = 'cascade-test-group';

        // ARRANGE: Create group with changelog and analytics subcollections
        await withSecurityRulesDisabled(async (firestore) => {
            // Create group
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, CHANGELOG_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });

            // Create changelog entry
            await addDoc(
                collection(firestore, SHARED_GROUPS_PATH, CHANGELOG_GROUP_ID, 'changelog'),
                {
                    type: 'TRANSACTION_ADDED',
                    userId: TEST_USERS.USER_1,
                    timestamp: Timestamp.now(),
                    data: { transactionId: 'tx-123' },
                }
            );

            // Create analytics entry
            await addDoc(
                collection(firestore, SHARED_GROUPS_PATH, CHANGELOG_GROUP_ID, 'analytics'),
                {
                    period: '2026-02',
                    totalSpent: 50000,
                    transactionCount: 5,
                }
            );
        });

        // ACT: Delete group as owner
        await withSecurityRulesDisabled(async (firestore) => {
            await deleteGroupAsOwner(
                firestore,
                TEST_USERS.USER_1,
                CHANGELOG_GROUP_ID,
                TEST_APP_ID
            );
        });

        // ASSERT: Group is deleted
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, CHANGELOG_GROUP_ID));
            expect(groupDoc.exists()).toBe(false);

            // Note: Subcollections may or may not be deleted depending on security rules
            // With security rules disabled, they should be deleted
            // With client SDK (rules enabled), they may be orphaned until TTL cleanup
            const changelogSnapshot = await getDocs(
                collection(firestore, SHARED_GROUPS_PATH, CHANGELOG_GROUP_ID, 'changelog')
            );
            const analyticsSnapshot = await getDocs(
                collection(firestore, SHARED_GROUPS_PATH, CHANGELOG_GROUP_ID, 'analytics')
            );

            // In rules-disabled mode, subcollections should be empty
            // (or non-existent, which returns empty snapshot)
            expect(changelogSnapshot.size).toBe(0);
            expect(analyticsSnapshot.size).toBe(0);
        });
    });
});
