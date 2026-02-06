/**
 * Shared Group Integration Test Helpers
 *
 * Story 14d-v2-1-7f: Integration Tests for Leave/Manage Group Flows
 * ECC Review: DRY - Extract duplicated helpers to shared file
 *
 * Common test utilities used across:
 * - leaveGroup.test.ts
 * - transferOwnership.test.ts
 * - deleteGroup.test.ts
 */

import { Timestamp } from 'firebase/firestore';
import { TEST_USERS } from '../../setup/firebase-emulator';

// =============================================================================
// Test Constants
// =============================================================================

/**
 * Default test group ID used across integration tests.
 */
export const TEST_GROUP_ID = 'shared-group-test-id';

/**
 * Third test user for multi-member scenarios.
 * Note: USER_1 and USER_2 are available from firebase-emulator.ts
 */
export const TEST_USER_3 = 'test-user-3-uid';

/**
 * Default application ID for test transactions.
 */
export const TEST_APP_ID = 'boletapp';

// =============================================================================
// Test Helper Functions
// =============================================================================

/**
 * Create a valid shared group for testing.
 *
 * Provides sensible defaults for all required SharedGroup fields
 * while allowing overrides for specific test scenarios.
 *
 * @param ownerId - User ID of the group owner
 * @param members - Array of member user IDs (defaults to [ownerId])
 * @param overrides - Optional field overrides for specific test cases
 * @returns A complete SharedGroup object (without ID)
 *
 * @example
 * ```typescript
 * // Basic group with owner as sole member
 * const group = createTestGroup(TEST_USERS.USER_1);
 *
 * // Group with multiple members
 * const group = createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1, TEST_USERS.USER_2]);
 *
 * // Group with cooldown state for transfer tests
 * const group = createTestGroup(TEST_USERS.USER_1, [TEST_USERS.USER_1], {
 *   transactionSharingToggleCountToday: 2,
 * });
 * ```
 */
export function createTestGroup(
    ownerId: string,
    members: string[] = [ownerId],
    overrides: Record<string, unknown> = {}
) {
    return {
        name: 'Test Group',
        ownerId,
        appId: TEST_APP_ID,
        color: '#10b981',
        shareCode: 'test-share-code-16',
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
 *
 * Used for testing cascade operations on group deletion
 * and transaction preservation on member leave.
 *
 * @param sharedGroupId - Group ID to tag transaction with, or null for untagged
 * @returns A complete Transaction object (without ID)
 *
 * @example
 * ```typescript
 * // Tagged transaction
 * const tx = createTestTransaction('group-123');
 *
 * // Untagged transaction
 * const tx = createTestTransaction(null);
 * ```
 */
export function createTestTransaction(sharedGroupId: string | null) {
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
 *
 * Used for testing cascade deletion of invitations
 * when a group is deleted.
 *
 * @param groupId - Group ID the invitation is for
 * @returns A complete PendingInvitation object (without ID)
 *
 * @example
 * ```typescript
 * const invitation = createTestInvitation('group-123');
 * ```
 */
export function createTestInvitation(groupId: string) {
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
