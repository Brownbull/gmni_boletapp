/**
 * useLeaveTransferFlow Hook Tests
 *
 * Story 14d-v2-1-7d: Tech Debt - Extract Firestore operations
 *
 * Tests for the hook that extracts leave/transfer/invitation handlers
 * from GruposView, eliminating direct getFirestore() calls.
 *
 * Test Cases:
 * 1. handleConfirmLeave - success path
 * 2. handleConfirmLeave - error path
 * 3. handleConfirmLeave - auto-switch view mode when leaving current viewed group
 * 4. handleConfirmLeave - no auto-switch when viewing different group
 * 5. handleConfirmTransfer - success path
 * 6. handleConfirmTransfer - error path
 * 7. handleAcceptInvitation - real invitation success
 * 8. handleAcceptInvitation - synthetic invitation success
 * 9. handleAcceptInvitation - error path
 * 10. handleDeclineInvitation - real invitation success
 * 11. handleDeclineInvitation - synthetic invitation (no-op)
 * 12. handleDeclineInvitation - error path
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Mocks
// =============================================================================

// Mock groupService functions
const mockLeaveGroup = vi.fn();
const mockTransferOwnership = vi.fn();
const mockJoinGroupDirectly = vi.fn();

vi.mock('@/features/shared-groups/services/groupMemberService', () => ({
    leaveGroup: (...args: unknown[]) => mockLeaveGroup(...args),
    transferOwnership: (...args: unknown[]) => mockTransferOwnership(...args),
    joinGroupDirectly: (...args: unknown[]) => mockJoinGroupDirectly(...args),
}));

// Mock invitationService functions
const mockAcceptInvitation = vi.fn();
const mockDeclineInvitation = vi.fn();

vi.mock('@/services/invitationService', () => ({
    acceptInvitation: (...args: unknown[]) => mockAcceptInvitation(...args),
    declineInvitation: (...args: unknown[]) => mockDeclineInvitation(...args),
}));

// Mock config/constants
vi.mock('@/config/constants', () => ({
    APP_ID: 'boletapp',
}));

// Mock view mode store
const mockSetPersonalMode = vi.fn();
const mockViewModeState = {
    mode: 'personal' as const,
    groupId: null as string | null,
    setPersonalMode: mockSetPersonalMode,
};

vi.mock('@/shared/stores/useViewModeStore', () => ({
    useViewMode: () => mockViewModeState,
}));

// Import after mocking
import { useLeaveTransferFlow } from '@/features/shared-groups/hooks/useLeaveTransferFlow';
import type { LeaveMode } from '@/features/shared-groups/hooks/useLeaveTransferFlow';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockUser(overrides: Partial<User> = {}): User {
    return {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: vi.fn(),
        getIdToken: vi.fn(),
        getIdTokenResult: vi.fn(),
        reload: vi.fn(),
        toJSON: vi.fn(),
        phoneNumber: null,
        providerId: 'firebase',
        ...overrides,
    } as User;
}

function createMockGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
    return {
        id: 'group-abc123',
        name: 'Test Group',
        ownerId: 'owner-xyz',
        appId: 'boletapp',
        color: '#10b981',
        shareCode: 'MockShareCode12345',
        shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        members: ['owner-xyz', 'user-123'],
        memberUpdates: {},
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        timezone: 'America/Santiago',
        transactionSharingEnabled: true,
        transactionSharingLastToggleAt: null,
        transactionSharingToggleCountToday: 0,
        ...overrides,
    };
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

function createMockDb(): Firestore {
    return {} as Firestore;
}

function createMockTranslation() {
    return (key: string, _params?: Record<string, string | number>) => key;
}

// =============================================================================
// Tests
// =============================================================================

describe('useLeaveTransferFlow', () => {
    const mockDb = createMockDb();
    const mockUser = createMockUser();
    const mockT = createMockTranslation();
    const mockShowToast = vi.fn();
    const mockRefetchGroups = vi.fn();
    const mockRefetchInvitations = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset view mode state to default
        mockViewModeState.mode = 'personal';
        mockViewModeState.groupId = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // handleConfirmLeave Tests
    // =========================================================================
    describe('handleConfirmLeave', () => {
        it('success path - calls leaveGroup and shows success toast', async () => {
            mockLeaveGroup.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                    refetchInvitations: mockRefetchInvitations,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(success).toBe(true);
            expect(mockLeaveGroup).toHaveBeenCalledWith(mockDb, mockUser.uid, group.id);
            expect(mockRefetchGroups).toHaveBeenCalled();
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('leftGroup'),
                'success'
            );
        });

        it('error path - returns false and shows error toast', async () => {
            mockLeaveGroup.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(success).toBe(false);
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('errorLeavingGroup'),
                'error'
            );
            expect(mockRefetchGroups).not.toHaveBeenCalled();
        });

        it('auto-switches view mode when leaving current viewed group', async () => {
            mockLeaveGroup.mockResolvedValue(undefined);

            // Set view mode to the group being left
            mockViewModeState.mode = 'group';
            mockViewModeState.groupId = 'group-abc123';

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup({ id: 'group-abc123' });

            await act(async () => {
                await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(mockSetPersonalMode).toHaveBeenCalled();
            // Should show the auto-switch toast, not the regular "left group" toast
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('leftGroupSwitchedToPersonal'),
                'success'
            );
        });

        it('does not auto-switch when viewing different group', async () => {
            mockLeaveGroup.mockResolvedValue(undefined);

            // Set view mode to a different group
            mockViewModeState.mode = 'group';
            mockViewModeState.groupId = 'different-group-id';

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup({ id: 'group-abc123' });

            await act(async () => {
                await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(mockSetPersonalMode).not.toHaveBeenCalled();
            // Should show regular "left group" toast
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('leftGroup'),
                'success'
            );
        });

        it('returns false when user is null', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: null,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(success).toBe(false);
            expect(mockLeaveGroup).not.toHaveBeenCalled();
        });

        it('returns false when group has no id', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup({ id: undefined });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(success).toBe(false);
            expect(mockLeaveGroup).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // handleConfirmTransfer Tests
    // =========================================================================
    describe('handleConfirmTransfer', () => {
        it('success path - calls transferOwnership and shows success toast', async () => {
            mockTransferOwnership.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmTransfer(group, 'new-owner-id', 'New Owner');
            });

            expect(success).toBe(true);
            expect(mockTransferOwnership).toHaveBeenCalledWith(
                mockDb,
                mockUser.uid,
                'new-owner-id',
                group.id
            );
            expect(mockRefetchGroups).toHaveBeenCalled();
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('ownershipTransferred'),
                'success'
            );
        });

        it('error path - returns false and shows error toast', async () => {
            mockTransferOwnership.mockRejectedValue(new Error('Not the owner'));

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmTransfer(group, 'new-owner-id', 'New Owner');
            });

            expect(success).toBe(false);
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('errorTransferringOwnership'),
                'error'
            );
            expect(mockRefetchGroups).not.toHaveBeenCalled();
        });

        it('returns false when user is null', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: null,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmTransfer(group, 'new-owner-id', 'New Owner');
            });

            expect(success).toBe(false);
            expect(mockTransferOwnership).not.toHaveBeenCalled();
        });

        it('returns false when group has no id', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup({ id: undefined });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmTransfer(group, 'new-owner-id', 'New Owner');
            });

            expect(success).toBe(false);
            expect(mockTransferOwnership).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // handleAcceptInvitation Tests
    // =========================================================================
    describe('handleAcceptInvitation', () => {
        it('real invitation success - calls acceptInvitation', async () => {
            mockAcceptInvitation.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                    refetchInvitations: mockRefetchInvitations,
                })
            );

            const invitation = createMockInvitation({ id: 'real-invitation-123' });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleAcceptInvitation(invitation);
            });

            expect(success).toBe(true);
            expect(mockAcceptInvitation).toHaveBeenCalledWith(
                mockDb,
                invitation.id,
                mockUser.uid,
                expect.objectContaining({
                    displayName: mockUser.displayName,
                    email: mockUser.email,
                }),
                'boletapp', // APP_ID (Story 14d-v2-1-13+14)
                false       // shareMyTransactions default
            );
            expect(mockJoinGroupDirectly).not.toHaveBeenCalled();
            expect(mockRefetchGroups).toHaveBeenCalled();
            expect(mockRefetchInvitations).toHaveBeenCalled();
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('acceptInvitationSuccess'),
                'success'
            );
        });

        it('synthetic invitation success - calls joinGroupDirectly', async () => {
            mockJoinGroupDirectly.mockResolvedValue(createMockGroup());

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                    refetchInvitations: mockRefetchInvitations,
                })
            );

            // Synthetic invitations have ids starting with 'group-'
            const invitation = createMockInvitation({
                id: 'group-abc123',
                groupId: 'abc123',
            });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleAcceptInvitation(invitation);
            });

            expect(success).toBe(true);
            expect(mockJoinGroupDirectly).toHaveBeenCalledWith(
                mockDb,
                invitation.groupId,
                mockUser.uid,
                expect.objectContaining({
                    displayName: mockUser.displayName,
                    email: mockUser.email,
                }),
                'boletapp', // APP_ID (Story 14d-v2-1-13+14)
                false       // shareMyTransactions default
            );
            expect(mockAcceptInvitation).not.toHaveBeenCalled();
            expect(mockRefetchGroups).toHaveBeenCalled();
            expect(mockRefetchInvitations).toHaveBeenCalled();
        });

        it('error path - returns false and shows error toast', async () => {
            mockAcceptInvitation.mockRejectedValue(new Error('Invitation expired'));

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                    refetchInvitations: mockRefetchInvitations,
                })
            );

            const invitation = createMockInvitation();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleAcceptInvitation(invitation);
            });

            expect(success).toBe(false);
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('errorAcceptingInvitation'),
                'error'
            );
            expect(mockRefetchGroups).not.toHaveBeenCalled();
        });

        it('returns false when user is null', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: null,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const invitation = createMockInvitation();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleAcceptInvitation(invitation);
            });

            expect(success).toBe(false);
            expect(mockAcceptInvitation).not.toHaveBeenCalled();
            expect(mockJoinGroupDirectly).not.toHaveBeenCalled();
        });

        it('returns false when invitation has no id', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const invitation = createMockInvitation({ id: undefined });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleAcceptInvitation(invitation);
            });

            expect(success).toBe(false);
            expect(mockAcceptInvitation).not.toHaveBeenCalled();
        });

        // ---------------------------------------------------------------------
        // Story 14d-v2-1-13+14: shareMyTransactions passthrough
        // ---------------------------------------------------------------------
        describe('user group preference passthrough (Story 14d-v2-1-13+14)', () => {
            it('passes APP_ID and shareMyTransactions=true to acceptInvitation for real invitations', async () => {
                mockAcceptInvitation.mockResolvedValue(undefined);

                const { result } = renderHook(() =>
                    useLeaveTransferFlow({
                        db: mockDb,
                        user: mockUser,
                        onShowToast: mockShowToast,
                        t: mockT,
                        lang: 'en',
                        refetchGroups: mockRefetchGroups,
                        refetchInvitations: mockRefetchInvitations,
                    })
                );

                const invitation = createMockInvitation({ id: 'real-invitation-123' });

                let success: boolean | undefined;
                await act(async () => {
                    success = await result.current.handleAcceptInvitation(invitation, true);
                });

                expect(success).toBe(true);
                // The underlying acceptInvitation should receive APP_ID and shareMyTransactions
                expect(mockAcceptInvitation).toHaveBeenCalledWith(
                    mockDb,
                    invitation.id,
                    mockUser.uid,
                    expect.objectContaining({
                        displayName: mockUser.displayName,
                        email: mockUser.email,
                    }),
                    'boletapp', // APP_ID
                    true        // shareMyTransactions
                );
            });

            it('passes APP_ID and shareMyTransactions=false to joinGroupDirectly for synthetic invitations', async () => {
                mockJoinGroupDirectly.mockResolvedValue(createMockGroup());

                const { result } = renderHook(() =>
                    useLeaveTransferFlow({
                        db: mockDb,
                        user: mockUser,
                        onShowToast: mockShowToast,
                        t: mockT,
                        lang: 'en',
                        refetchGroups: mockRefetchGroups,
                        refetchInvitations: mockRefetchInvitations,
                    })
                );

                const invitation = createMockInvitation({
                    id: 'group-abc123',
                    groupId: 'abc123',
                });

                let success: boolean | undefined;
                await act(async () => {
                    success = await result.current.handleAcceptInvitation(invitation, false);
                });

                expect(success).toBe(true);
                expect(mockJoinGroupDirectly).toHaveBeenCalledWith(
                    mockDb,
                    invitation.groupId,
                    mockUser.uid,
                    expect.objectContaining({
                        displayName: mockUser.displayName,
                        email: mockUser.email,
                    }),
                    'boletapp', // APP_ID
                    false       // shareMyTransactions
                );
            });

            it('defaults shareMyTransactions to false when not provided', async () => {
                mockAcceptInvitation.mockResolvedValue(undefined);

                const { result } = renderHook(() =>
                    useLeaveTransferFlow({
                        db: mockDb,
                        user: mockUser,
                        onShowToast: mockShowToast,
                        t: mockT,
                        lang: 'en',
                        refetchGroups: mockRefetchGroups,
                        refetchInvitations: mockRefetchInvitations,
                    })
                );

                const invitation = createMockInvitation({ id: 'real-invitation-123' });

                await act(async () => {
                    // Call without shareMyTransactions parameter
                    await result.current.handleAcceptInvitation(invitation);
                });

                // Should default to false
                expect(mockAcceptInvitation).toHaveBeenCalledWith(
                    mockDb,
                    invitation.id,
                    mockUser.uid,
                    expect.any(Object),
                    'boletapp', // APP_ID
                    false       // shareMyTransactions defaults to false
                );
            });
        });
    });

    // =========================================================================
    // handleDeclineInvitation Tests
    // =========================================================================
    describe('handleDeclineInvitation', () => {
        it('real invitation success - calls declineInvitation', async () => {
            mockDeclineInvitation.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                    refetchInvitations: mockRefetchInvitations,
                })
            );

            const invitation = createMockInvitation({ id: 'real-invitation-123' });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleDeclineInvitation(invitation);
            });

            expect(success).toBe(true);
            expect(mockDeclineInvitation).toHaveBeenCalledWith(mockDb, invitation.id);
            expect(mockRefetchInvitations).toHaveBeenCalled();
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('declineInvitationSuccess'),
                'success'
            );
        });

        it('synthetic invitation - no-op (just closes without Firestore call)', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                    refetchInvitations: mockRefetchInvitations,
                })
            );

            // Synthetic invitations have ids starting with 'group-'
            const invitation = createMockInvitation({ id: 'group-abc123' });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleDeclineInvitation(invitation);
            });

            expect(success).toBe(true);
            expect(mockDeclineInvitation).not.toHaveBeenCalled();
            expect(mockRefetchInvitations).toHaveBeenCalled();
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('declineInvitationSuccess'),
                'success'
            );
        });

        it('error path - returns false and shows error toast', async () => {
            mockDeclineInvitation.mockRejectedValue(new Error('Invitation not found'));

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                    refetchInvitations: mockRefetchInvitations,
                })
            );

            const invitation = createMockInvitation();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleDeclineInvitation(invitation);
            });

            expect(success).toBe(false);
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('errorDecliningInvitation'),
                'error'
            );
            expect(mockRefetchInvitations).not.toHaveBeenCalled();
        });

        it('returns false when invitation has no id', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const invitation = createMockInvitation({ id: undefined });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleDeclineInvitation(invitation);
            });

            expect(success).toBe(false);
            expect(mockDeclineInvitation).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Edge Cases and Integration
    // =========================================================================
    describe('edge cases', () => {
        it('uses Spanish messages when lang is es', async () => {
            mockLeaveGroup.mockResolvedValue(undefined);

            const spanishT = (key: string) => {
                const translations: Record<string, string> = {
                    leftGroup: 'Saliste del grupo',
                };
                return translations[key] || key;
            };

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: spanishT,
                    lang: 'es',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup();

            await act(async () => {
                await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(mockShowToast).toHaveBeenCalledWith(
                'Saliste del grupo',
                'success'
            );
        });

        it('works without optional callbacks', async () => {
            mockLeaveGroup.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                    // onShowToast and refetchInvitations are optional
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            // Should succeed even without toast callback
            expect(success).toBe(true);
            expect(mockRefetchGroups).toHaveBeenCalled();
        });

        it('handles both soft and hard leave modes (captures mode for future use)', async () => {
            mockLeaveGroup.mockResolvedValue(undefined);
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Set DEV mode for console.log to work
            const originalDev = import.meta.env.DEV;
            (import.meta.env as { DEV: boolean }).DEV = true;

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    db: mockDb,
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    refetchGroups: mockRefetchGroups,
                })
            );

            const group = createMockGroup();

            // Test soft mode
            await act(async () => {
                await result.current.handleConfirmLeave(group, 'soft');
            });

            // Test hard mode
            await act(async () => {
                await result.current.handleConfirmLeave(group, 'hard');
            });

            // Both should call leaveGroup (hard mode Cloud Function not yet implemented)
            expect(mockLeaveGroup).toHaveBeenCalledTimes(2);

            // Restore
            (import.meta.env as { DEV: boolean }).DEV = originalDev;
            consoleSpy.mockRestore();
        });
    });
});
