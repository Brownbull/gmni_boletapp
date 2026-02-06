/**
 * useGroupDialogs Hook Tests
 *
 * TDD Test Suite for the useGroupDialogs hook that consolidates
 * 17 useState calls from GruposView into a single hook.
 *
 * Following RED-GREEN-REFACTOR methodology.
 */

import { renderHook, act } from '@testing-library/react';
import { useGroupDialogs } from '@/hooks/useGroupDialogs';
import { useGroupDialogsStore, initialGroupDialogsState } from '@/features/shared-groups';
import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';
import type { Timestamp } from 'firebase/firestore';

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockTimestamp = (date: Date = new Date()): Timestamp => ({
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    isEqual: () => false,
    valueOf: () => '',
} as Timestamp);

const mockSharedGroup: SharedGroup = {
    id: 'group-123',
    ownerId: 'user-owner',
    appId: 'boletapp',
    name: 'Test Group',
    color: '#10b981',
    icon: '🏠',
    shareCode: 'ABC123DEF456GHI7',
    shareCodeExpiresAt: createMockTimestamp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    members: ['user-owner', 'user-member'],
    memberUpdates: {},
    createdAt: createMockTimestamp(),
    updatedAt: createMockTimestamp(),
    timezone: 'America/Santiago',
    transactionSharingEnabled: true,
    transactionSharingLastToggleAt: null,
    transactionSharingToggleCountToday: 0,
};

const mockSharedGroup2: SharedGroup = {
    ...mockSharedGroup,
    id: 'group-456',
    name: 'Another Group',
    color: '#3b82f6',
    icon: '🎉',
};

const mockPendingInvitation: PendingInvitation = {
    id: 'invite-123',
    groupId: 'group-123',
    groupName: 'Test Group',
    groupColor: '#10b981',
    groupIcon: '🏠',
    shareCode: 'XYZ789ABC123DEF4',
    invitedEmail: 'invited@example.com',
    invitedByUserId: 'user-owner',
    invitedByName: 'Owner Name',
    createdAt: createMockTimestamp(),
    expiresAt: createMockTimestamp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    status: 'pending',
};

const mockPendingInvitation2: PendingInvitation = {
    ...mockPendingInvitation,
    id: 'invite-456',
    groupId: 'group-456',
    groupName: 'Another Group',
};

// =============================================================================
// Test Suite
// =============================================================================

describe('useGroupDialogs', () => {
    // TD-14d-1: Reset Zustand store between tests to ensure isolation
    beforeEach(() => {
        useGroupDialogsStore.setState(initialGroupDialogsState);
    });

    // =========================================================================
    // 1. Initial State Tests
    // =========================================================================
    describe('initial state', () => {
        it('should have all dialogs closed by default', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.isCreateDialogOpen).toBe(false);
            expect(result.current.dialogs.isInviteDialogOpen).toBe(false);
            expect(result.current.dialogs.isAcceptDialogOpen).toBe(false);
            expect(result.current.dialogs.isLeaveDialogOpen).toBe(false);
            expect(result.current.dialogs.isOwnerWarningOpen).toBe(false);
            expect(result.current.dialogs.isMemberSelectorOpen).toBe(false);
            expect(result.current.dialogs.isTransferDialogOpen).toBe(false);
            expect(result.current.dialogs.isDeleteDialogOpen).toBe(false);
        });

        it('should have all selections null by default', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.selectedGroup).toBeNull();
            expect(result.current.dialogs.selectedInvitation).toBeNull();
            expect(result.current.dialogs.selectedGroupForAction).toBeNull();
            expect(result.current.dialogs.selectedMemberForTransfer).toBeNull();
        });

        it('should have all loading states false by default', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.isAccepting).toBe(false);
            expect(result.current.dialogs.isLeaving).toBe(false);
            expect(result.current.dialogs.isTransferring).toBe(false);
            expect(result.current.dialogs.isDeleting).toBe(false);
        });

        it('should have error null by default', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.createError).toBeNull();
        });

        it('should have selectedMemberName as empty string by default', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.selectedMemberName).toBe('');
        });
    });

    // =========================================================================
    // 2. Create Dialog Tests
    // =========================================================================
    describe('create dialog actions', () => {
        it('should set isCreateDialogOpen to true when openCreateDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openCreateDialog();
            });

            expect(result.current.dialogs.isCreateDialogOpen).toBe(true);
        });

        it('should set isCreateDialogOpen to false AND clear createError when closeCreateDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Set up initial state with dialog open and error
            act(() => {
                result.current.actions.openCreateDialog();
                result.current.actions.setCreateError('Some error');
            });

            expect(result.current.dialogs.isCreateDialogOpen).toBe(true);
            expect(result.current.dialogs.createError).toBe('Some error');

            // Close dialog
            act(() => {
                result.current.actions.closeCreateDialog();
            });

            expect(result.current.dialogs.isCreateDialogOpen).toBe(false);
            expect(result.current.dialogs.createError).toBeNull();
        });

        it('should set createError to the provided string when setCreateError is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.setCreateError('Network error occurred');
            });

            expect(result.current.dialogs.createError).toBe('Network error occurred');
        });

        it('should allow setting createError to null', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.setCreateError('Some error');
            });

            expect(result.current.dialogs.createError).toBe('Some error');

            act(() => {
                result.current.actions.setCreateError(null);
            });

            expect(result.current.dialogs.createError).toBeNull();
        });

        it('should clear createError to null when resetCreateError is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.setCreateError('Some error');
            });

            expect(result.current.dialogs.createError).toBe('Some error');

            act(() => {
                result.current.actions.resetCreateError();
            });

            expect(result.current.dialogs.createError).toBeNull();
        });
    });

    // =========================================================================
    // 3. Invite Dialog Tests
    // =========================================================================
    describe('invite dialog actions', () => {
        it('should set isInviteDialogOpen to true AND selectedGroup when openInviteDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openInviteDialog(mockSharedGroup);
            });

            expect(result.current.dialogs.isInviteDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedGroup).toEqual(mockSharedGroup);
        });

        it('should set isInviteDialogOpen to false AND clear selectedGroup when closeInviteDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Open first
            act(() => {
                result.current.actions.openInviteDialog(mockSharedGroup);
            });

            expect(result.current.dialogs.isInviteDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedGroup).toEqual(mockSharedGroup);

            // Close
            act(() => {
                result.current.actions.closeInviteDialog();
            });

            expect(result.current.dialogs.isInviteDialogOpen).toBe(false);
            expect(result.current.dialogs.selectedGroup).toBeNull();
        });

        it('should update selectedGroup when opening with a different group', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openInviteDialog(mockSharedGroup);
            });

            expect(result.current.dialogs.selectedGroup).toEqual(mockSharedGroup);

            act(() => {
                result.current.actions.openInviteDialog(mockSharedGroup2);
            });

            expect(result.current.dialogs.selectedGroup).toEqual(mockSharedGroup2);
        });
    });

    // =========================================================================
    // 4. Accept Invitation Dialog Tests
    // =========================================================================
    describe('accept invitation dialog actions', () => {
        it('should set isAcceptDialogOpen to true AND selectedInvitation when openAcceptDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openAcceptDialog(mockPendingInvitation);
            });

            expect(result.current.dialogs.isAcceptDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedInvitation).toEqual(mockPendingInvitation);
        });

        it('should set isAcceptDialogOpen to false AND clear selectedInvitation when closeAcceptDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Open first
            act(() => {
                result.current.actions.openAcceptDialog(mockPendingInvitation);
            });

            expect(result.current.dialogs.isAcceptDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedInvitation).toEqual(mockPendingInvitation);

            // Close
            act(() => {
                result.current.actions.closeAcceptDialog();
            });

            expect(result.current.dialogs.isAcceptDialogOpen).toBe(false);
            expect(result.current.dialogs.selectedInvitation).toBeNull();
        });

        it('should update isAccepting flag when setIsAccepting is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.isAccepting).toBe(false);

            act(() => {
                result.current.actions.setIsAccepting(true);
            });

            expect(result.current.dialogs.isAccepting).toBe(true);

            act(() => {
                result.current.actions.setIsAccepting(false);
            });

            expect(result.current.dialogs.isAccepting).toBe(false);
        });

        it('should update selectedInvitation when opening with a different invitation', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openAcceptDialog(mockPendingInvitation);
            });

            expect(result.current.dialogs.selectedInvitation).toEqual(mockPendingInvitation);

            act(() => {
                result.current.actions.openAcceptDialog(mockPendingInvitation2);
            });

            expect(result.current.dialogs.selectedInvitation).toEqual(mockPendingInvitation2);
        });
    });

    // =========================================================================
    // 5. Leave Dialog Tests
    // =========================================================================
    describe('leave dialog actions', () => {
        it('should set isLeaveDialogOpen to true AND selectedGroupForAction when openLeaveDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openLeaveDialog(mockSharedGroup);
            });

            expect(result.current.dialogs.isLeaveDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);
        });

        it('should set isLeaveDialogOpen to false AND clear selectedGroupForAction when closeLeaveDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Open first
            act(() => {
                result.current.actions.openLeaveDialog(mockSharedGroup);
            });

            expect(result.current.dialogs.isLeaveDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);

            // Close
            act(() => {
                result.current.actions.closeLeaveDialog();
            });

            expect(result.current.dialogs.isLeaveDialogOpen).toBe(false);
            expect(result.current.dialogs.selectedGroupForAction).toBeNull();
        });

        it('should update isLeaving flag when setIsLeaving is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.isLeaving).toBe(false);

            act(() => {
                result.current.actions.setIsLeaving(true);
            });

            expect(result.current.dialogs.isLeaving).toBe(true);

            act(() => {
                result.current.actions.setIsLeaving(false);
            });

            expect(result.current.dialogs.isLeaving).toBe(false);
        });
    });

    // =========================================================================
    // 6. Owner Warning Dialog Tests
    // =========================================================================
    describe('owner warning dialog actions', () => {
        it('should set isOwnerWarningOpen to true AND selectedGroupForAction when openOwnerWarning is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openOwnerWarning(mockSharedGroup);
            });

            expect(result.current.dialogs.isOwnerWarningOpen).toBe(true);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);
        });

        it('should set isOwnerWarningOpen to false AND clear selectedGroupForAction when closeOwnerWarning is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Open first
            act(() => {
                result.current.actions.openOwnerWarning(mockSharedGroup);
            });

            expect(result.current.dialogs.isOwnerWarningOpen).toBe(true);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);

            // Close
            act(() => {
                result.current.actions.closeOwnerWarning();
            });

            expect(result.current.dialogs.isOwnerWarningOpen).toBe(false);
            expect(result.current.dialogs.selectedGroupForAction).toBeNull();
        });
    });

    // =========================================================================
    // 7. Member Selector Dialog Tests
    // =========================================================================
    describe('member selector dialog actions', () => {
        it('should set isMemberSelectorOpen to true AND selectedGroupForAction when openMemberSelector is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openMemberSelector(mockSharedGroup);
            });

            expect(result.current.dialogs.isMemberSelectorOpen).toBe(true);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);
        });

        it('should set isMemberSelectorOpen to false but KEEP selectedGroupForAction when closeMemberSelector is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Open first
            act(() => {
                result.current.actions.openMemberSelector(mockSharedGroup);
            });

            expect(result.current.dialogs.isMemberSelectorOpen).toBe(true);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);

            // Close - should keep selectedGroupForAction for transfer flow
            act(() => {
                result.current.actions.closeMemberSelector();
            });

            expect(result.current.dialogs.isMemberSelectorOpen).toBe(false);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);
        });
    });

    // =========================================================================
    // 8. Delete Dialog Tests
    // =========================================================================
    describe('delete dialog actions', () => {
        it('should have isDeleteDialogOpen as false by default', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.isDeleteDialogOpen).toBe(false);
        });

        it('should have isDeleting as false by default', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.isDeleting).toBe(false);
        });

        it('should set isDeleteDialogOpen to true AND selectedGroupForAction when openDeleteDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openDeleteDialog(mockSharedGroup);
            });

            expect(result.current.dialogs.isDeleteDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);
        });

        it('should set isDeleteDialogOpen to false AND clear selectedGroupForAction when closeDeleteDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Open first
            act(() => {
                result.current.actions.openDeleteDialog(mockSharedGroup);
            });

            expect(result.current.dialogs.isDeleteDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);

            // Close
            act(() => {
                result.current.actions.closeDeleteDialog();
            });

            expect(result.current.dialogs.isDeleteDialogOpen).toBe(false);
            expect(result.current.dialogs.selectedGroupForAction).toBeNull();
        });

        it('should update isDeleting flag when setIsDeleting is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.isDeleting).toBe(false);

            act(() => {
                result.current.actions.setIsDeleting(true);
            });

            expect(result.current.dialogs.isDeleting).toBe(true);

            act(() => {
                result.current.actions.setIsDeleting(false);
            });

            expect(result.current.dialogs.isDeleting).toBe(false);
        });

        it('should preserve isDeleting state when closeDeleteDialog is called', () => {
            // This tests that we can safely close while in loading state
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openDeleteDialog(mockSharedGroup);
                result.current.actions.setIsDeleting(true);
            });

            expect(result.current.dialogs.isDeleting).toBe(true);

            // Close dialog - isDeleting should be independent
            act(() => {
                result.current.actions.closeDeleteDialog();
            });

            // isDeleting is NOT automatically reset by closeDeleteDialog
            // (consumer should manage this based on their async operation)
            expect(result.current.dialogs.isDeleting).toBe(true);
        });
    });

    // =========================================================================
    // 9. Transfer Dialog Tests
    // =========================================================================
    describe('transfer dialog actions', () => {
        it('should close member selector, open transfer dialog, and set member info when openTransferDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // First open member selector (simulating the real flow)
            act(() => {
                result.current.actions.openMemberSelector(mockSharedGroup);
            });

            expect(result.current.dialogs.isMemberSelectorOpen).toBe(true);

            // Then open transfer dialog with selected member
            act(() => {
                result.current.actions.openTransferDialog('member-456', 'John Doe');
            });

            expect(result.current.dialogs.isMemberSelectorOpen).toBe(false);
            expect(result.current.dialogs.isTransferDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedMemberForTransfer).toBe('member-456');
            expect(result.current.dialogs.selectedMemberName).toBe('John Doe');
        });

        it('should close all transfer-related state when closeTransferDialog is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Set up state as if we came through the full flow
            act(() => {
                result.current.actions.openMemberSelector(mockSharedGroup);
            });
            act(() => {
                result.current.actions.openTransferDialog('member-456', 'John Doe');
            });

            expect(result.current.dialogs.isTransferDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedMemberForTransfer).toBe('member-456');
            expect(result.current.dialogs.selectedMemberName).toBe('John Doe');
            expect(result.current.dialogs.selectedGroupForAction).toEqual(mockSharedGroup);

            // Close transfer dialog
            act(() => {
                result.current.actions.closeTransferDialog();
            });

            expect(result.current.dialogs.isTransferDialogOpen).toBe(false);
            expect(result.current.dialogs.selectedMemberForTransfer).toBeNull();
            expect(result.current.dialogs.selectedMemberName).toBe('');
            expect(result.current.dialogs.selectedGroupForAction).toBeNull();
        });

        it('should update isTransferring flag when setIsTransferring is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            expect(result.current.dialogs.isTransferring).toBe(false);

            act(() => {
                result.current.actions.setIsTransferring(true);
            });

            expect(result.current.dialogs.isTransferring).toBe(true);

            act(() => {
                result.current.actions.setIsTransferring(false);
            });

            expect(result.current.dialogs.isTransferring).toBe(false);
        });
    });

    // =========================================================================
    // 9. Reset All Tests
    // =========================================================================
    describe('resetAll action', () => {
        it('should return all state to initial values when resetAll is called', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Set up various state
            act(() => {
                result.current.actions.openCreateDialog();
                result.current.actions.setCreateError('Some error');
                result.current.actions.setIsAccepting(true);
                result.current.actions.setIsLeaving(true);
                result.current.actions.setIsTransferring(true);
                result.current.actions.setIsDeleting(true);
            });

            // Open some dialogs with data
            act(() => {
                result.current.actions.openInviteDialog(mockSharedGroup);
            });

            // Verify state is set
            expect(result.current.dialogs.isCreateDialogOpen).toBe(true);
            expect(result.current.dialogs.createError).toBe('Some error');
            expect(result.current.dialogs.isInviteDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedGroup).toEqual(mockSharedGroup);
            expect(result.current.dialogs.isAccepting).toBe(true);
            expect(result.current.dialogs.isLeaving).toBe(true);
            expect(result.current.dialogs.isTransferring).toBe(true);
            expect(result.current.dialogs.isDeleting).toBe(true);

            // Reset all
            act(() => {
                result.current.actions.resetAll();
            });

            // Verify all state is back to initial
            expect(result.current.dialogs.isCreateDialogOpen).toBe(false);
            expect(result.current.dialogs.createError).toBeNull();
            expect(result.current.dialogs.isInviteDialogOpen).toBe(false);
            expect(result.current.dialogs.selectedGroup).toBeNull();
            expect(result.current.dialogs.isAcceptDialogOpen).toBe(false);
            expect(result.current.dialogs.selectedInvitation).toBeNull();
            expect(result.current.dialogs.isAccepting).toBe(false);
            expect(result.current.dialogs.isLeaveDialogOpen).toBe(false);
            expect(result.current.dialogs.isLeaving).toBe(false);
            expect(result.current.dialogs.isOwnerWarningOpen).toBe(false);
            expect(result.current.dialogs.isMemberSelectorOpen).toBe(false);
            expect(result.current.dialogs.isTransferDialogOpen).toBe(false);
            expect(result.current.dialogs.isTransferring).toBe(false);
            expect(result.current.dialogs.isDeleteDialogOpen).toBe(false);
            expect(result.current.dialogs.isDeleting).toBe(false);
            expect(result.current.dialogs.selectedGroupForAction).toBeNull();
            expect(result.current.dialogs.selectedMemberForTransfer).toBeNull();
            expect(result.current.dialogs.selectedMemberName).toBe('');
        });

        it('should work correctly when called multiple times', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // First cycle
            act(() => {
                result.current.actions.openCreateDialog();
            });
            act(() => {
                result.current.actions.resetAll();
            });

            expect(result.current.dialogs.isCreateDialogOpen).toBe(false);

            // Second cycle
            act(() => {
                result.current.actions.openInviteDialog(mockSharedGroup);
            });
            act(() => {
                result.current.actions.resetAll();
            });

            expect(result.current.dialogs.isInviteDialogOpen).toBe(false);
            expect(result.current.dialogs.selectedGroup).toBeNull();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================
    describe('edge cases', () => {
        it('should handle rapid open/close cycles', () => {
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openCreateDialog();
                result.current.actions.closeCreateDialog();
                result.current.actions.openCreateDialog();
                result.current.actions.closeCreateDialog();
            });

            expect(result.current.dialogs.isCreateDialogOpen).toBe(false);
        });

        it('should maintain independence between different dialogs', () => {
            const { result } = renderHook(() => useGroupDialogs());

            // Open multiple dialogs
            act(() => {
                result.current.actions.openCreateDialog();
            });
            act(() => {
                result.current.actions.openInviteDialog(mockSharedGroup);
            });

            expect(result.current.dialogs.isCreateDialogOpen).toBe(true);
            expect(result.current.dialogs.isInviteDialogOpen).toBe(true);

            // Close one should not affect the other
            act(() => {
                result.current.actions.closeCreateDialog();
            });

            expect(result.current.dialogs.isCreateDialogOpen).toBe(false);
            expect(result.current.dialogs.isInviteDialogOpen).toBe(true);
            expect(result.current.dialogs.selectedGroup).toEqual(mockSharedGroup);
        });

        it('should preserve isLeaving state when closeLeaveDialog is called', () => {
            // This tests that we can safely close while in loading state
            const { result } = renderHook(() => useGroupDialogs());

            act(() => {
                result.current.actions.openLeaveDialog(mockSharedGroup);
                result.current.actions.setIsLeaving(true);
            });

            expect(result.current.dialogs.isLeaving).toBe(true);

            // Close dialog - isLeaving should be independent
            act(() => {
                result.current.actions.closeLeaveDialog();
            });

            // isLeaving is NOT automatically reset by closeLeaveDialog
            // (consumer should manage this based on their async operation)
            expect(result.current.dialogs.isLeaving).toBe(true);
        });

        it('should handle actions being stable across renders', () => {
            const { result, rerender } = renderHook(() => useGroupDialogs());

            const initialOpenCreateDialog = result.current.actions.openCreateDialog;

            rerender();

            // Actions should be memoized
            expect(result.current.actions.openCreateDialog).toBe(initialOpenCreateDialog);
        });
    });
});
