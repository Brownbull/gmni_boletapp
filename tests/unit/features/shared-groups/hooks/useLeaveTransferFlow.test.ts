/**
 * useLeaveTransferFlow Hook Tests
 *
 * Story 14d-v2-1-7d: Tech Debt - Extract Firestore operations
 * Story TD-CONSOLIDATED-12: React Query Cache Staleness
 *
 * Tests for the hook that provides leave/transfer/invitation handlers
 * using injected mutation async functions from React Query mutation hooks.
 *
 * Test Cases:
 * 1. handleConfirmLeave - success path
 * 2. handleConfirmLeave - error path
 * 3. handleConfirmLeave - auto-switch view mode when leaving current viewed group
 * 4. handleConfirmLeave - no auto-switch when viewing different group
 * 5. handleConfirmTransfer - success path
 * 6. handleConfirmTransfer - error path
 * 7. handleAcceptInvitation - success path
 * 8. handleAcceptInvitation - with shareMyTransactions=true
 * 9. handleAcceptInvitation - error path
 * 10. handleDeclineInvitation - success path
 * 11. handleDeclineInvitation - error path
 * 12. Edge cases (null user, missing id, Spanish locale, optional callbacks)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';
import { createMockGroup as createMockGroupBase, createMockInvitation } from '@helpers/sharedGroupFactory';

// =============================================================================
// Mocks
// =============================================================================

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

// Wrap shared factory with leave/transfer-specific defaults
function createMockGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
    return createMockGroupBase({
        id: 'group-abc123',
        ownerId: 'owner-xyz',
        members: ['owner-xyz', 'user-123'],
        ...overrides,
    });
}

function createMockTranslation() {
    return (key: string, _params?: Record<string, string | number>) => key;
}

// =============================================================================
// Mutation Async Mock Factories
// =============================================================================

function createMockMutationFunctions() {
    return {
        leaveGroupAsync: vi.fn().mockResolvedValue(undefined),
        transferOwnershipAsync: vi.fn().mockResolvedValue(undefined),
        acceptInvitationAsync: vi.fn().mockResolvedValue(undefined),
        declineInvitationAsync: vi.fn().mockResolvedValue(undefined),
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useLeaveTransferFlow', () => {
    const mockUser = createMockUser();
    const mockT = createMockTranslation();
    const mockShowToast = vi.fn();

    let mocks: ReturnType<typeof createMockMutationFunctions>;

    beforeEach(() => {
        vi.clearAllMocks();
        mocks = createMockMutationFunctions();
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
        it('success path - calls leaveGroupAsync and shows success toast', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(success).toBe(true);
            expect(mocks.leaveGroupAsync).toHaveBeenCalledWith({ groupId: group.id });
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('leftGroup'),
                'success'
            );
        });

        it('error path - returns false and shows error toast', async () => {
            mocks.leaveGroupAsync.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
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
        });

        it('auto-switches view mode when leaving current viewed group', async () => {
            // Set view mode to the group being left
            mockViewModeState.mode = 'group';
            mockViewModeState.groupId = 'group-abc123';

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
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
            // Set view mode to a different group
            mockViewModeState.mode = 'group';
            mockViewModeState.groupId = 'different-group-id';

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
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
                    user: null,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(success).toBe(false);
            expect(mocks.leaveGroupAsync).not.toHaveBeenCalled();
        });

        it('returns false when group has no id', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const group = createMockGroup({ id: undefined });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            expect(success).toBe(false);
            expect(mocks.leaveGroupAsync).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // handleConfirmTransfer Tests
    // =========================================================================
    describe('handleConfirmTransfer', () => {
        it('success path - calls transferOwnershipAsync and shows success toast', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmTransfer(group, 'new-owner-id', 'New Owner');
            });

            expect(success).toBe(true);
            expect(mocks.transferOwnershipAsync).toHaveBeenCalledWith({
                groupId: group.id,
                newOwnerId: 'new-owner-id',
            });
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('ownershipTransferred'),
                'success'
            );
        });

        it('error path - returns false and shows error toast', async () => {
            mocks.transferOwnershipAsync.mockRejectedValue(new Error('Not the owner'));

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
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
        });

        it('returns false when user is null', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: null,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmTransfer(group, 'new-owner-id', 'New Owner');
            });

            expect(success).toBe(false);
            expect(mocks.transferOwnershipAsync).not.toHaveBeenCalled();
        });

        it('returns false when group has no id', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const group = createMockGroup({ id: undefined });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmTransfer(group, 'new-owner-id', 'New Owner');
            });

            expect(success).toBe(false);
            expect(mocks.transferOwnershipAsync).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // handleAcceptInvitation Tests
    // =========================================================================
    describe('handleAcceptInvitation', () => {
        it('success path - calls acceptInvitationAsync and shows toast', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const invitation = createMockInvitation({ id: 'real-invitation-123' });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleAcceptInvitation(invitation);
            });

            expect(success).toBe(true);
            expect(mocks.acceptInvitationAsync).toHaveBeenCalledWith({
                invitation,
                shareMyTransactions: undefined,
            });
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('acceptInvitationSuccess'),
                'success'
            );
        });

        it('passes shareMyTransactions=true to acceptInvitationAsync', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const invitation = createMockInvitation({ id: 'real-invitation-123' });

            await act(async () => {
                await result.current.handleAcceptInvitation(invitation, true);
            });

            expect(mocks.acceptInvitationAsync).toHaveBeenCalledWith({
                invitation,
                shareMyTransactions: true,
            });
        });

        it('passes shareMyTransactions=false to acceptInvitationAsync', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const invitation = createMockInvitation({ id: 'real-invitation-123' });

            await act(async () => {
                await result.current.handleAcceptInvitation(invitation, false);
            });

            expect(mocks.acceptInvitationAsync).toHaveBeenCalledWith({
                invitation,
                shareMyTransactions: false,
            });
        });

        it('calls acceptInvitationAsync for synthetic invitation (routing handled by mutation hook)', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
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
            // Mutation hook handles real vs synthetic routing internally
            expect(mocks.acceptInvitationAsync).toHaveBeenCalledWith({
                invitation,
                shareMyTransactions: undefined,
            });
        });

        it('error path - returns false and shows error toast', async () => {
            mocks.acceptInvitationAsync.mockRejectedValue(new Error('Invitation expired'));

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
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
        });

        it('returns false when user is null', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: null,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const invitation = createMockInvitation();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleAcceptInvitation(invitation);
            });

            expect(success).toBe(false);
            expect(mocks.acceptInvitationAsync).not.toHaveBeenCalled();
        });

        it('returns false when invitation has no id', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const invitation = createMockInvitation({ id: undefined });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleAcceptInvitation(invitation);
            });

            expect(success).toBe(false);
            expect(mocks.acceptInvitationAsync).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // handleDeclineInvitation Tests
    // =========================================================================
    describe('handleDeclineInvitation', () => {
        it('success path - calls declineInvitationAsync and shows toast', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const invitation = createMockInvitation({ id: 'real-invitation-123' });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleDeclineInvitation(invitation);
            });

            expect(success).toBe(true);
            expect(mocks.declineInvitationAsync).toHaveBeenCalledWith({ invitation });
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('declineInvitationSuccess'),
                'success'
            );
        });

        it('calls declineInvitationAsync for synthetic invitation (routing handled internally)', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            // Synthetic invitations have ids starting with 'group-'
            const invitation = createMockInvitation({ id: 'group-abc123' });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleDeclineInvitation(invitation);
            });

            expect(success).toBe(true);
            // Mutation hook handles synthetic vs real routing internally
            expect(mocks.declineInvitationAsync).toHaveBeenCalledWith({ invitation });
            expect(mockShowToast).toHaveBeenCalledWith(
                expect.stringContaining('declineInvitationSuccess'),
                'success'
            );
        });

        it('error path - returns false and shows error toast', async () => {
            mocks.declineInvitationAsync.mockRejectedValue(new Error('Invitation not found'));

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
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
        });

        it('returns false when invitation has no id', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                })
            );

            const invitation = createMockInvitation({ id: undefined });

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleDeclineInvitation(invitation);
            });

            expect(success).toBe(false);
            expect(mocks.declineInvitationAsync).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Edge Cases and Integration
    // =========================================================================
    describe('edge cases', () => {
        it('uses Spanish messages when lang is es', async () => {
            const spanishT = (key: string) => {
                const translations: Record<string, string> = {
                    leftGroup: 'Saliste del grupo',
                };
                return translations[key] || key;
            };

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: spanishT,
                    lang: 'es',
                    ...mocks,
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

        it('works without optional onShowToast callback', async () => {
            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
                    // onShowToast is optional
                })
            );

            const group = createMockGroup();

            let success: boolean | undefined;
            await act(async () => {
                success = await result.current.handleConfirmLeave(group, 'soft');
            });

            // Should succeed even without toast callback
            expect(success).toBe(true);
            expect(mocks.leaveGroupAsync).toHaveBeenCalledWith({ groupId: group.id });
        });

        it('handles both soft and hard leave modes (captures mode for future use)', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            // Set DEV mode for console.log to work
            const originalDev = import.meta.env.DEV;
            (import.meta.env as { DEV: boolean }).DEV = true;

            const { result } = renderHook(() =>
                useLeaveTransferFlow({
                    user: mockUser,
                    onShowToast: mockShowToast,
                    t: mockT,
                    lang: 'en',
                    ...mocks,
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

            // Both should call leaveGroupAsync (hard mode Cloud Function not yet implemented)
            expect(mocks.leaveGroupAsync).toHaveBeenCalledTimes(2);

            // Restore
            (import.meta.env as { DEV: boolean }).DEV = originalDev;
            consoleSpy.mockRestore();
        });
    });
});
