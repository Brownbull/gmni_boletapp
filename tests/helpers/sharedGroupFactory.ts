/**
 * Shared Test Factory Functions
 *
 * TD-CONSOLIDATED-3: Extract duplicate factory functions from test files.
 *
 * Provides createMockGroup and createMockInvitation for consistent
 * test fixture creation across unit tests.
 */

import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';
import { createMockTimestamp, createMockTimestampDaysFromNow } from './firestore';

export function createMockGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
    return {
        id: 'group-123',
        name: 'Test Group',
        ownerId: 'user-123',
        appId: 'boletapp',
        color: '#10b981',
        icon: '🏠',
        shareCode: 'MockShareCode12345',
        shareCodeExpiresAt: createMockTimestamp(),
        members: ['user-123'],
        memberUpdates: {},
        createdAt: createMockTimestamp(),
        updatedAt: createMockTimestamp(),
        timezone: 'America/Santiago',
        transactionSharingEnabled: true,
        transactionSharingLastToggleAt: null,
        transactionSharingToggleCountToday: 0,
        transactionSharingToggleCountResetAt: null,
        ...overrides,
    };
}

export function createMockInvitation(overrides: Partial<PendingInvitation> = {}): PendingInvitation {
    return {
        id: 'invitation-123',
        groupId: 'group-abc123',
        groupName: 'Test Group',
        groupColor: '#10b981',
        shareCode: 'InviteCode12345678',
        invitedEmail: 'test@example.com',
        invitedByUserId: 'owner-xyz',
        invitedByName: 'Owner User',
        createdAt: createMockTimestamp(),
        expiresAt: createMockTimestampDaysFromNow(7),
        status: 'pending',
        ...overrides,
    };
}
