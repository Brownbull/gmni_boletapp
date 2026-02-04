/**
 * Transfer Ownership Integration Tests
 *
 * Story 14d-v2-1-7f: Integration Tests for Leave/Manage Group Flows
 *
 * Tests the transferOwnership service function against Firestore emulator.
 * CRITICAL: Validates toggle cooldown preservation during ownership transfer.
 *
 * Test Coverage (11 tests):
 * 1. Transfer ownership successfully
 * 2. Preserve transactionSharingToggleCountToday on transfer (CRITICAL)
 * 3. Preserve transactionSharingLastToggleAt on transfer (CRITICAL)
 * 4. Preserve transactionSharingToggleCountResetAt on transfer (CRITICAL)
 * 5. Preserve transactionSharingEnabled on transfer
 * 6. Reject transfer to non-member
 * 7. Reject transfer by non-owner
 * 8. Allow transfer to self (no-op but valid)
 * 9. Allow new owner to leave after transfer
 * 10. Reject transfer with empty parameters
 * 11. Handle concurrent ownership transfer attempts atomically
 *
 * Note: Security rules tests already exist in firestore-rules.test.ts.
 * This file focuses on service layer integration testing.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    setupFirebaseEmulator,
    teardownFirebaseEmulator,
    clearFirestoreData,
    withSecurityRulesDisabled,
    TEST_USERS,
    SHARED_GROUPS_PATH,
} from '../../setup/firebase-emulator';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import {
    transferOwnership,
    leaveGroup,
} from '@/features/shared-groups/services/groupService';

// =============================================================================
// Test Constants
// =============================================================================

const TEST_GROUP_ID = 'transfer-test-group';
const TEST_USER_3 = 'test-user-3-uid';
const TEST_APP_ID = 'boletapp';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a valid shared group for testing with optional cooldown state.
 */
function createTestGroup(
    ownerId: string,
    members: string[] = [ownerId],
    overrides: Record<string, unknown> = {}
) {
    return {
        name: 'Test Transfer Group',
        ownerId,
        appId: TEST_APP_ID,
        color: '#10b981',
        shareCode: 'transfer-code-1234',
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

// =============================================================================
// Integration Tests
// =============================================================================

describe('transferOwnership Integration Tests (Story 14d-v2-1-7f)', () => {
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
    // Test 1: Transfer ownership successfully
    // =========================================================================
    it('should transfer ownership successfully', async () => {
        // ARRANGE: Create group with owner and member
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]),
            });
        });

        // ACT: Transfer ownership to USER_2
        await withSecurityRulesDisabled(async (firestore) => {
            await transferOwnership(
                firestore,
                TEST_USERS.USER_1,
                TEST_USERS.USER_2,
                TEST_GROUP_ID
            );
        });

        // ASSERT: Ownership transferred
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(true);
            const data = groupDoc.data();
            expect(data?.ownerId).toBe(TEST_USERS.USER_2);
            // Both users should still be members
            expect(data?.members).toContain(TEST_USERS.USER_1);
            expect(data?.members).toContain(TEST_USERS.USER_2);
        });
    });

    // =========================================================================
    // Test 2: Preserve transactionSharingToggleCountToday on transfer (CRITICAL)
    // =========================================================================
    it('should preserve transactionSharingToggleCountToday on transfer (CRITICAL)', async () => {
        // ARRANGE: Create group with cooldown state
        const toggleCount = 2;

        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2], {
                    transactionSharingToggleCountToday: toggleCount,
                }),
            });
        });

        // ACT: Transfer ownership
        await withSecurityRulesDisabled(async (firestore) => {
            await transferOwnership(
                firestore,
                TEST_USERS.USER_1,
                TEST_USERS.USER_2,
                TEST_GROUP_ID
            );
        });

        // ASSERT: Toggle count is PRESERVED (not reset)
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            const data = groupDoc.data();
            expect(data?.transactionSharingToggleCountToday).toBe(toggleCount);
        });
    });

    // =========================================================================
    // Test 3: Preserve transactionSharingLastToggleAt on transfer (CRITICAL)
    // =========================================================================
    it('should preserve transactionSharingLastToggleAt on transfer (CRITICAL)', async () => {
        // ARRANGE: Create group with last toggle timestamp
        const lastToggleTime = Timestamp.fromDate(new Date('2026-02-01T10:00:00Z'));

        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2], {
                    transactionSharingLastToggleAt: lastToggleTime,
                }),
            });
        });

        // ACT: Transfer ownership
        await withSecurityRulesDisabled(async (firestore) => {
            await transferOwnership(
                firestore,
                TEST_USERS.USER_1,
                TEST_USERS.USER_2,
                TEST_GROUP_ID
            );
        });

        // ASSERT: Last toggle timestamp is PRESERVED
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            const data = groupDoc.data();
            // Compare timestamp values
            expect(data?.transactionSharingLastToggleAt?.seconds).toBe(lastToggleTime.seconds);
        });
    });

    // =========================================================================
    // Test 4: Preserve transactionSharingToggleCountResetAt on transfer (CRITICAL)
    // Note: This field may not exist yet in the current schema but test validates preservation
    // =========================================================================
    it('should preserve custom fields on transfer (future-proof)', async () => {
        // ARRANGE: Create group with potential future field
        const resetTime = Timestamp.fromDate(new Date('2026-02-02T00:00:00Z'));

        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2], {
                    // This field might be added in future, testing preservation pattern
                    transactionSharingToggleCountResetAt: resetTime,
                    customField: 'should-be-preserved',
                }),
            });
        });

        // ACT: Transfer ownership
        await withSecurityRulesDisabled(async (firestore) => {
            await transferOwnership(
                firestore,
                TEST_USERS.USER_1,
                TEST_USERS.USER_2,
                TEST_GROUP_ID
            );
        });

        // ASSERT: All fields are PRESERVED (only ownerId and updatedAt should change)
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            const data = groupDoc.data();
            expect(data?.transactionSharingToggleCountResetAt?.seconds).toBe(resetTime.seconds);
            expect(data?.customField).toBe('should-be-preserved');
        });
    });

    // =========================================================================
    // Test 5: Preserve transactionSharingEnabled on transfer
    // =========================================================================
    it('should preserve transactionSharingEnabled on transfer', async () => {
        // ARRANGE: Create group with sharing disabled
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2], {
                    transactionSharingEnabled: false,
                }),
            });
        });

        // ACT: Transfer ownership
        await withSecurityRulesDisabled(async (firestore) => {
            await transferOwnership(
                firestore,
                TEST_USERS.USER_1,
                TEST_USERS.USER_2,
                TEST_GROUP_ID
            );
        });

        // ASSERT: Sharing state is PRESERVED
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            const data = groupDoc.data();
            expect(data?.transactionSharingEnabled).toBe(false);
        });
    });

    // =========================================================================
    // Test 6: Reject transfer to non-member
    // =========================================================================
    it('should reject transfer to non-member', async () => {
        // ARRANGE: Create group without USER_2 as member
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1]),
            });
        });

        // ACT & ASSERT: Transfer to non-member should fail
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                transferOwnership(
                    firestore,
                    TEST_USERS.USER_1,
                    TEST_USERS.USER_2,
                    TEST_GROUP_ID
                )
            ).rejects.toThrow('Selected user is not a member of this group');
        });

        // ASSERT: Ownership unchanged
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.data()?.ownerId).toBe(TEST_USERS.USER_1);
        });
    });

    // =========================================================================
    // Test 7: Reject transfer by non-owner
    // =========================================================================
    it('should reject transfer by non-owner', async () => {
        // ARRANGE: Create group with USER_1 as owner
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [
                    TEST_USERS.USER_1,
                    TEST_USERS.USER_2,
                    TEST_USER_3,
                ]),
            });
        });

        // ACT & ASSERT: Non-owner cannot transfer
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                transferOwnership(
                    firestore,
                    TEST_USERS.USER_2, // Not the owner
                    TEST_USER_3,
                    TEST_GROUP_ID
                )
            ).rejects.toThrow('Only the group owner can transfer ownership');
        });

        // ASSERT: Ownership unchanged
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.data()?.ownerId).toBe(TEST_USERS.USER_1);
        });
    });

    // =========================================================================
    // Test 8: Reject transfer to self (no change)
    // =========================================================================
    it('should allow transfer to self (no-op but valid)', async () => {
        // ARRANGE: Create group
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]),
            });
        });

        // ACT: Transfer to self - this is technically allowed by the service
        // (it's a no-op, but the validation passes because owner is also a member)
        await withSecurityRulesDisabled(async (firestore) => {
            // This should NOT throw because the owner is in the members array
            // The service doesn't explicitly reject self-transfer
            await transferOwnership(
                firestore,
                TEST_USERS.USER_1,
                TEST_USERS.USER_1,
                TEST_GROUP_ID
            );
        });

        // ASSERT: Ownership remains the same
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.data()?.ownerId).toBe(TEST_USERS.USER_1);
        });
    });

    // =========================================================================
    // Test 9: Allow new owner to leave after transfer (previous owner remains)
    // =========================================================================
    it('should allow previous owner to leave after transfer', async () => {
        // ARRANGE: Create group and transfer ownership
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]),
            });
        });

        // ACT: Transfer ownership to USER_2
        await withSecurityRulesDisabled(async (firestore) => {
            await transferOwnership(
                firestore,
                TEST_USERS.USER_1,
                TEST_USERS.USER_2,
                TEST_GROUP_ID
            );
        });

        // ACT: Previous owner (USER_1) can now leave
        await withSecurityRulesDisabled(async (firestore) => {
            await leaveGroup(firestore, TEST_USERS.USER_1, TEST_GROUP_ID);
        });

        // ASSERT: USER_1 left, USER_2 is now sole owner and member
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            const data = groupDoc.data();
            expect(data?.ownerId).toBe(TEST_USERS.USER_2);
            expect(data?.members).toEqual([TEST_USERS.USER_2]);
            expect(data?.members).not.toContain(TEST_USERS.USER_1);
        });
    });

    // =========================================================================
    // Test 10: Reject transfer with empty parameters
    // =========================================================================
    it('should reject transfer with empty parameters', async () => {
        // ARRANGE: Create group
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]),
            });
        });

        // ACT & ASSERT: Empty currentOwnerId
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                transferOwnership(firestore, '', TEST_USERS.USER_2, TEST_GROUP_ID)
            ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
        });

        // ACT & ASSERT: Empty newOwnerId
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                transferOwnership(firestore, TEST_USERS.USER_1, '', TEST_GROUP_ID)
            ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
        });

        // ACT & ASSERT: Empty groupId
        await withSecurityRulesDisabled(async (firestore) => {
            await expect(
                transferOwnership(firestore, TEST_USERS.USER_1, TEST_USERS.USER_2, '')
            ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
        });
    });

    // =========================================================================
    // Test 11: Handle concurrent ownership transfer (race condition prevention)
    // ECC Review: HIGH priority - ensure Firestore transaction prevents race conditions
    // =========================================================================
    it('should handle concurrent ownership transfer attempts atomically', async () => {
        // ARRANGE: Create group with owner and two potential new owners
        await withSecurityRulesDisabled(async (firestore) => {
            await setDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID), {
                ...createTestGroup(TEST_USERS.USER_1, [
                    TEST_USERS.USER_1,
                    TEST_USERS.USER_2,
                    TEST_USER_3,
                ]),
            });
        });

        // ACT: Two concurrent transfer attempts from the same owner
        await withSecurityRulesDisabled(async (firestore) => {
            const results = await Promise.allSettled([
                transferOwnership(firestore, TEST_USERS.USER_1, TEST_USERS.USER_2, TEST_GROUP_ID),
                transferOwnership(firestore, TEST_USERS.USER_1, TEST_USER_3, TEST_GROUP_ID),
            ]);

            // ASSERT: At least one should succeed
            const successCount = results.filter((r) => r.status === 'fulfilled').length;
            expect(successCount).toBeGreaterThanOrEqual(1);

            // The second one may fail because the first already transferred ownership
            // This is expected Firestore transaction behavior
        });

        // ASSERT: Final state should be consistent - exactly one owner
        await withSecurityRulesDisabled(async (firestore) => {
            const groupDoc = await getDoc(doc(firestore, SHARED_GROUPS_PATH, TEST_GROUP_ID));
            expect(groupDoc.exists()).toBe(true);
            const data = groupDoc.data();

            // Owner should be either USER_2 or USER_3 (whichever transfer succeeded)
            expect([TEST_USERS.USER_2, TEST_USER_3]).toContain(data?.ownerId);

            // All members should still be present
            expect(data?.members).toContain(TEST_USERS.USER_1);
            expect(data?.members).toContain(TEST_USERS.USER_2);
            expect(data?.members).toContain(TEST_USER_3);
        });
    });
});
