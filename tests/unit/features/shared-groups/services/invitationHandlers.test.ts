/**
 * Invitation Handler Services Tests
 *
 * Story 14d-v2-1-7d: Tech Debt - Services pattern extraction
 *
 * Tests for pure service functions that handle invitations:
 * - handleAcceptInvitationService
 * - handleDeclineInvitationService
 * - isSyntheticInvitation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import type { PendingInvitation, MemberProfile } from '@/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Mocks
// =============================================================================

// Mock invitationService
const mockAcceptInvitation = vi.fn();
const mockDeclineInvitation = vi.fn();

vi.mock('@/services/invitationService', () => ({
    acceptInvitation: (...args: unknown[]) => mockAcceptInvitation(...args),
    declineInvitation: (...args: unknown[]) => mockDeclineInvitation(...args),
}));

// Mock groupService
const mockJoinGroupDirectly = vi.fn();

vi.mock('@/features/shared-groups/services/groupService', () => ({
    joinGroupDirectly: (...args: unknown[]) => mockJoinGroupDirectly(...args),
}));

// Import after mocking
import {
    handleAcceptInvitationService,
    handleDeclineInvitationService,
    isSyntheticInvitation,
} from '@/features/shared-groups/services/invitationHandlers';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDb(): Firestore {
    return {} as Firestore;
}

function createMockInvitation(overrides: Partial<PendingInvitation> = {}): PendingInvitation {
    return {
        id: 'invitation-123',
        groupId: 'group-abc123',
        groupName: 'Test Group',
        groupColor: '#10b981',
        shareCode: 'InviteCode12345678',
        invitedEmail: 'test@example.com',
        invitedByUserId: 'owner-xyz',
        invitedByName: 'Owner User',
        createdAt: Timestamp.fromDate(new Date()),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        status: 'pending',
        ...overrides,
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('invitationHandlers', () => {
    const mockDb = createMockDb();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // isSyntheticInvitation Tests
    // =========================================================================
    describe('isSyntheticInvitation', () => {
        it('returns true for invitation with id starting with "group-"', () => {
            const syntheticInvitation = createMockInvitation({ id: 'group-abc123' });
            expect(isSyntheticInvitation(syntheticInvitation)).toBe(true);
        });

        it('returns false for real invitation with regular id', () => {
            const realInvitation = createMockInvitation({ id: 'invitation-xyz789' });
            expect(isSyntheticInvitation(realInvitation)).toBe(false);
        });

        it('returns false for invitation with undefined id', () => {
            const noIdInvitation = createMockInvitation({ id: undefined });
            expect(isSyntheticInvitation(noIdInvitation)).toBe(false);
        });

        it('returns false for invitation with id that contains but does not start with "group-"', () => {
            const invitation = createMockInvitation({ id: 'real-group-abc' });
            expect(isSyntheticInvitation(invitation)).toBe(false);
        });
    });

    // =========================================================================
    // handleAcceptInvitationService Tests
    // =========================================================================
    describe('handleAcceptInvitationService', () => {
        it('calls acceptInvitation for real invitations', async () => {
            mockAcceptInvitation.mockResolvedValue(undefined);

            const invitation = createMockInvitation({ id: 'real-invitation-123' });
            const userId = 'user-xyz';
            const userProfile: MemberProfile = {
                displayName: 'Test User',
                email: 'test@example.com',
            };

            await handleAcceptInvitationService(mockDb, invitation, userId, userProfile);

            expect(mockAcceptInvitation).toHaveBeenCalledWith(
                mockDb,
                invitation.id,
                userId,
                userProfile,
                undefined, // appId
                undefined  // shareMyTransactions
            );
            expect(mockJoinGroupDirectly).not.toHaveBeenCalled();
        });

        it('calls joinGroupDirectly for synthetic invitations', async () => {
            mockJoinGroupDirectly.mockResolvedValue({ id: 'group-abc123', name: 'Test Group' });

            const invitation = createMockInvitation({
                id: 'group-abc123',
                groupId: 'abc123',
            });
            const userId = 'user-xyz';
            const userProfile: MemberProfile = {
                displayName: 'Test User',
                email: 'test@example.com',
            };

            await handleAcceptInvitationService(mockDb, invitation, userId, userProfile);

            expect(mockJoinGroupDirectly).toHaveBeenCalledWith(
                mockDb,
                invitation.groupId,
                userId,
                userProfile,
                undefined, // appId
                undefined  // shareMyTransactions
            );
            expect(mockAcceptInvitation).not.toHaveBeenCalled();
        });

        it('works without userProfile (undefined)', async () => {
            mockAcceptInvitation.mockResolvedValue(undefined);

            const invitation = createMockInvitation();
            const userId = 'user-xyz';

            await handleAcceptInvitationService(mockDb, invitation, userId);

            expect(mockAcceptInvitation).toHaveBeenCalledWith(
                mockDb,
                invitation.id,
                userId,
                undefined,
                undefined, // appId
                undefined  // shareMyTransactions
            );
        });

        it('propagates errors from acceptInvitation', async () => {
            mockAcceptInvitation.mockRejectedValue(new Error('Invitation expired'));

            const invitation = createMockInvitation();
            const userId = 'user-xyz';

            await expect(
                handleAcceptInvitationService(mockDb, invitation, userId)
            ).rejects.toThrow('Invitation expired');
        });

        it('propagates errors from joinGroupDirectly', async () => {
            mockJoinGroupDirectly.mockRejectedValue(new Error('Group full'));

            const invitation = createMockInvitation({ id: 'group-abc123' });
            const userId = 'user-xyz';

            await expect(
                handleAcceptInvitationService(mockDb, invitation, userId)
            ).rejects.toThrow('Group full');
        });

        // ---------------------------------------------------------------------
        // Story 14d-v2-1-13+14: appId and shareMyTransactions passthrough
        // ---------------------------------------------------------------------
        describe('user group preference passthrough (Story 14d-v2-1-13+14)', () => {
            it('passes appId and shareMyTransactions to acceptInvitation for real invitations', async () => {
                mockAcceptInvitation.mockResolvedValue(undefined);

                const invitation = createMockInvitation({ id: 'real-invitation-123' });
                const userId = 'user-xyz';
                const userProfile: MemberProfile = {
                    displayName: 'Test User',
                    email: 'test@example.com',
                };

                await handleAcceptInvitationService(
                    mockDb, invitation, userId, userProfile, 'boletapp', true
                );

                expect(mockAcceptInvitation).toHaveBeenCalledWith(
                    mockDb,
                    invitation.id,
                    userId,
                    userProfile,
                    'boletapp',
                    true
                );
            });

            it('passes appId and shareMyTransactions to joinGroupDirectly for synthetic invitations', async () => {
                mockJoinGroupDirectly.mockResolvedValue({ id: 'group-abc123' });

                const invitation = createMockInvitation({
                    id: 'group-abc123',
                    groupId: 'abc123',
                });
                const userId = 'user-xyz';
                const userProfile: MemberProfile = {
                    displayName: 'Test User',
                };

                await handleAcceptInvitationService(
                    mockDb, invitation, userId, userProfile, 'boletapp', false
                );

                expect(mockJoinGroupDirectly).toHaveBeenCalledWith(
                    mockDb,
                    invitation.groupId,
                    userId,
                    userProfile,
                    'boletapp',
                    false
                );
            });

            it('passes undefined appId when not provided (backward compatible)', async () => {
                mockAcceptInvitation.mockResolvedValue(undefined);

                const invitation = createMockInvitation();
                const userId = 'user-xyz';

                await handleAcceptInvitationService(mockDb, invitation, userId);

                expect(mockAcceptInvitation).toHaveBeenCalledWith(
                    mockDb,
                    invitation.id,
                    userId,
                    undefined,
                    undefined,
                    undefined
                );
            });
        });
    });

    // =========================================================================
    // handleDeclineInvitationService Tests
    // =========================================================================
    describe('handleDeclineInvitationService', () => {
        it('calls declineInvitation for real invitations', async () => {
            mockDeclineInvitation.mockResolvedValue(undefined);

            const invitation = createMockInvitation({ id: 'real-invitation-123' });

            await handleDeclineInvitationService(mockDb, invitation);

            expect(mockDeclineInvitation).toHaveBeenCalledWith(mockDb, invitation.id);
        });

        it('does NOT call declineInvitation for synthetic invitations (no-op)', async () => {
            const invitation = createMockInvitation({ id: 'group-abc123' });

            await handleDeclineInvitationService(mockDb, invitation);

            expect(mockDeclineInvitation).not.toHaveBeenCalled();
        });

        it('propagates errors from declineInvitation', async () => {
            mockDeclineInvitation.mockRejectedValue(new Error('Invitation not found'));

            const invitation = createMockInvitation();

            await expect(
                handleDeclineInvitationService(mockDb, invitation)
            ).rejects.toThrow('Invitation not found');
        });

        it('does not throw for synthetic invitations even if declineInvitation would throw', async () => {
            // Set up declineInvitation to throw - but it should never be called
            mockDeclineInvitation.mockRejectedValue(new Error('Should not be called'));

            const invitation = createMockInvitation({ id: 'group-abc123' });

            // Should NOT throw because synthetic invitations skip the Firestore call
            await expect(
                handleDeclineInvitationService(mockDb, invitation)
            ).resolves.toBeUndefined();

            expect(mockDeclineInvitation).not.toHaveBeenCalled();
        });
    });
});
