/**
 * useGroupDialogsStore Tests
 *
 * Story TD-14d-1: Zustand Migration for useGroupDialogs
 *
 * Tests the Zustand store directly (without the hook wrapper).
 * Verifies all 18 state fields and 24 actions work correctly.
 */

import { act } from '@testing-library/react';
import {
  useGroupDialogsStore,
  initialGroupDialogsState,
  getGroupDialogsState,
  groupDialogsActions,
} from '@/features/shared-groups/store/useGroupDialogsStore';
import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';
import { createMockTimestamp, createMockTimestampDaysFromNow } from '@helpers/firestore';

// =============================================================================
// Test Fixtures
// =============================================================================

const mockSharedGroup: SharedGroup = {
  id: 'group-123',
  ownerId: 'user-owner',
  appId: 'boletapp',
  name: 'Test Group',
  color: '#10b981',
  icon: '🏠',
  shareCode: 'ABC123DEF456GHI7',
  shareCodeExpiresAt: createMockTimestampDaysFromNow(7),
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
  expiresAt: createMockTimestampDaysFromNow(7),
  status: 'pending',
};

// =============================================================================
// Test Suite
// =============================================================================

describe('useGroupDialogsStore', () => {
  // Reset store before each test
  beforeEach(() => {
    act(() => {
      useGroupDialogsStore.setState(initialGroupDialogsState);
    });
  });

  // =========================================================================
  // Initial State Tests
  // =========================================================================
  describe('initial state', () => {
    it('should have correct initial state with 21 fields', () => {
      const state = getGroupDialogsState();

      // Dialogs closed
      expect(state.isCreateDialogOpen).toBe(false);
      expect(state.isInviteDialogOpen).toBe(false);
      expect(state.isAcceptDialogOpen).toBe(false);
      expect(state.isLeaveDialogOpen).toBe(false);
      expect(state.isDeleteDialogOpen).toBe(false);
      expect(state.isOwnerWarningOpen).toBe(false);
      expect(state.isMemberSelectorOpen).toBe(false);
      expect(state.isTransferDialogOpen).toBe(false);
      // Story 14d-v2-1-7g: Edit dialog
      expect(state.isEditDialogOpen).toBe(false);

      // Loading states
      expect(state.isAccepting).toBe(false);
      expect(state.isLeaving).toBe(false);
      expect(state.isDeleting).toBe(false);
      expect(state.isTransferring).toBe(false);
      // Story 14d-v2-1-7g: Edit updating state
      expect(state.isUpdating).toBe(false);

      // Selections
      expect(state.selectedGroup).toBeNull();
      expect(state.selectedInvitation).toBeNull();
      expect(state.selectedGroupForAction).toBeNull();
      expect(state.selectedMemberForTransfer).toBeNull();
      expect(state.selectedMemberName).toBe('');
      // Story 14d-v2-1-7g: Editing group selection
      expect(state.editingGroup).toBeNull();

      // Error
      expect(state.createError).toBeNull();
    });
  });

  // =========================================================================
  // Create Dialog Tests
  // =========================================================================
  describe('create dialog actions', () => {
    it('should open create dialog', () => {
      act(() => {
        groupDialogsActions.openCreateDialog();
      });

      expect(getGroupDialogsState().isCreateDialogOpen).toBe(true);
    });

    it('should close create dialog and clear error', () => {
      act(() => {
        groupDialogsActions.openCreateDialog();
        groupDialogsActions.setCreateError('Test error');
      });

      expect(getGroupDialogsState().isCreateDialogOpen).toBe(true);
      expect(getGroupDialogsState().createError).toBe('Test error');

      act(() => {
        groupDialogsActions.closeCreateDialog();
      });

      expect(getGroupDialogsState().isCreateDialogOpen).toBe(false);
      expect(getGroupDialogsState().createError).toBeNull();
    });

    it('should set and reset create error', () => {
      act(() => {
        groupDialogsActions.setCreateError('Network error');
      });

      expect(getGroupDialogsState().createError).toBe('Network error');

      act(() => {
        groupDialogsActions.resetCreateError();
      });

      expect(getGroupDialogsState().createError).toBeNull();
    });
  });

  // =========================================================================
  // Invite Dialog Tests
  // =========================================================================
  describe('invite dialog actions', () => {
    it('should open invite dialog with group', () => {
      act(() => {
        groupDialogsActions.openInviteDialog(mockSharedGroup);
      });

      const state = getGroupDialogsState();
      expect(state.isInviteDialogOpen).toBe(true);
      expect(state.selectedGroup).toEqual(mockSharedGroup);
    });

    it('should close invite dialog and clear selection', () => {
      act(() => {
        groupDialogsActions.openInviteDialog(mockSharedGroup);
      });

      act(() => {
        groupDialogsActions.closeInviteDialog();
      });

      const state = getGroupDialogsState();
      expect(state.isInviteDialogOpen).toBe(false);
      expect(state.selectedGroup).toBeNull();
    });
  });

  // =========================================================================
  // Accept Dialog Tests
  // =========================================================================
  describe('accept dialog actions', () => {
    it('should open accept dialog with invitation', () => {
      act(() => {
        groupDialogsActions.openAcceptDialog(mockPendingInvitation);
      });

      const state = getGroupDialogsState();
      expect(state.isAcceptDialogOpen).toBe(true);
      expect(state.selectedInvitation).toEqual(mockPendingInvitation);
    });

    it('should close accept dialog and clear selection', () => {
      act(() => {
        groupDialogsActions.openAcceptDialog(mockPendingInvitation);
        groupDialogsActions.closeAcceptDialog();
      });

      const state = getGroupDialogsState();
      expect(state.isAcceptDialogOpen).toBe(false);
      expect(state.selectedInvitation).toBeNull();
    });

    it('should set isAccepting flag', () => {
      act(() => {
        groupDialogsActions.setIsAccepting(true);
      });

      expect(getGroupDialogsState().isAccepting).toBe(true);

      act(() => {
        groupDialogsActions.setIsAccepting(false);
      });

      expect(getGroupDialogsState().isAccepting).toBe(false);
    });
  });

  // =========================================================================
  // Leave Dialog Tests
  // =========================================================================
  describe('leave dialog actions', () => {
    it('should open leave dialog with group', () => {
      act(() => {
        groupDialogsActions.openLeaveDialog(mockSharedGroup);
      });

      const state = getGroupDialogsState();
      expect(state.isLeaveDialogOpen).toBe(true);
      expect(state.selectedGroupForAction).toEqual(mockSharedGroup);
    });

    it('should close leave dialog and clear selection', () => {
      act(() => {
        groupDialogsActions.openLeaveDialog(mockSharedGroup);
        groupDialogsActions.closeLeaveDialog();
      });

      const state = getGroupDialogsState();
      expect(state.isLeaveDialogOpen).toBe(false);
      expect(state.selectedGroupForAction).toBeNull();
    });

    it('should set isLeaving flag', () => {
      act(() => {
        groupDialogsActions.setIsLeaving(true);
      });

      expect(getGroupDialogsState().isLeaving).toBe(true);
    });
  });

  // =========================================================================
  // Delete Dialog Tests
  // =========================================================================
  describe('delete dialog actions', () => {
    it('should open delete dialog with group', () => {
      act(() => {
        groupDialogsActions.openDeleteDialog(mockSharedGroup);
      });

      const state = getGroupDialogsState();
      expect(state.isDeleteDialogOpen).toBe(true);
      expect(state.selectedGroupForAction).toEqual(mockSharedGroup);
    });

    it('should close delete dialog and clear selection', () => {
      act(() => {
        groupDialogsActions.openDeleteDialog(mockSharedGroup);
        groupDialogsActions.closeDeleteDialog();
      });

      const state = getGroupDialogsState();
      expect(state.isDeleteDialogOpen).toBe(false);
      expect(state.selectedGroupForAction).toBeNull();
    });

    it('should set isDeleting flag', () => {
      act(() => {
        groupDialogsActions.setIsDeleting(true);
      });

      expect(getGroupDialogsState().isDeleting).toBe(true);
    });
  });

  // =========================================================================
  // Owner Warning Dialog Tests
  // =========================================================================
  describe('owner warning dialog actions', () => {
    it('should open owner warning with group', () => {
      act(() => {
        groupDialogsActions.openOwnerWarning(mockSharedGroup);
      });

      const state = getGroupDialogsState();
      expect(state.isOwnerWarningOpen).toBe(true);
      expect(state.selectedGroupForAction).toEqual(mockSharedGroup);
    });

    it('should close owner warning and clear selection', () => {
      act(() => {
        groupDialogsActions.openOwnerWarning(mockSharedGroup);
        groupDialogsActions.closeOwnerWarning();
      });

      const state = getGroupDialogsState();
      expect(state.isOwnerWarningOpen).toBe(false);
      expect(state.selectedGroupForAction).toBeNull();
    });
  });

  // =========================================================================
  // Member Selector Dialog Tests
  // =========================================================================
  describe('member selector dialog actions', () => {
    it('should open member selector with group', () => {
      act(() => {
        groupDialogsActions.openMemberSelector(mockSharedGroup);
      });

      const state = getGroupDialogsState();
      expect(state.isMemberSelectorOpen).toBe(true);
      expect(state.selectedGroupForAction).toEqual(mockSharedGroup);
    });

    it('should close member selector but KEEP selectedGroupForAction for transfer flow', () => {
      act(() => {
        groupDialogsActions.openMemberSelector(mockSharedGroup);
        groupDialogsActions.closeMemberSelector();
      });

      const state = getGroupDialogsState();
      expect(state.isMemberSelectorOpen).toBe(false);
      // IMPORTANT: selectedGroupForAction is preserved for transfer flow
      expect(state.selectedGroupForAction).toEqual(mockSharedGroup);
    });
  });

  // =========================================================================
  // Transfer Dialog Tests
  // =========================================================================
  describe('transfer dialog actions', () => {
    it('should open transfer dialog with member info and close member selector', () => {
      // Simulate full flow: open member selector first
      act(() => {
        groupDialogsActions.openMemberSelector(mockSharedGroup);
      });

      expect(getGroupDialogsState().isMemberSelectorOpen).toBe(true);

      act(() => {
        groupDialogsActions.openTransferDialog('member-456', 'John Doe');
      });

      const state = getGroupDialogsState();
      expect(state.isMemberSelectorOpen).toBe(false);
      expect(state.isTransferDialogOpen).toBe(true);
      expect(state.selectedMemberForTransfer).toBe('member-456');
      expect(state.selectedMemberName).toBe('John Doe');
    });

    it('should close transfer dialog and clear all related state', () => {
      act(() => {
        groupDialogsActions.openMemberSelector(mockSharedGroup);
        groupDialogsActions.openTransferDialog('member-456', 'John Doe');
        groupDialogsActions.closeTransferDialog();
      });

      const state = getGroupDialogsState();
      expect(state.isTransferDialogOpen).toBe(false);
      expect(state.selectedMemberForTransfer).toBeNull();
      expect(state.selectedMemberName).toBe('');
      expect(state.selectedGroupForAction).toBeNull();
    });

    it('should set isTransferring flag', () => {
      act(() => {
        groupDialogsActions.setIsTransferring(true);
      });

      expect(getGroupDialogsState().isTransferring).toBe(true);
    });
  });

  // =========================================================================
  // Edit Dialog Tests (Story 14d-v2-1-7g)
  // =========================================================================
  describe('edit dialog actions', () => {
    it('should open edit dialog with group', () => {
      act(() => {
        groupDialogsActions.openEditDialog(mockSharedGroup);
      });

      const state = getGroupDialogsState();
      expect(state.isEditDialogOpen).toBe(true);
      expect(state.editingGroup).toEqual(mockSharedGroup);
    });

    it('should close edit dialog and clear selection', () => {
      act(() => {
        groupDialogsActions.openEditDialog(mockSharedGroup);
        groupDialogsActions.closeEditDialog();
      });

      const state = getGroupDialogsState();
      expect(state.isEditDialogOpen).toBe(false);
      expect(state.editingGroup).toBeNull();
    });

    it('should set isUpdating flag', () => {
      act(() => {
        groupDialogsActions.setIsUpdating(true);
      });

      expect(getGroupDialogsState().isUpdating).toBe(true);

      act(() => {
        groupDialogsActions.setIsUpdating(false);
      });

      expect(getGroupDialogsState().isUpdating).toBe(false);
    });
  });

  // =========================================================================
  // Reset All Tests
  // =========================================================================
  describe('resetAll action', () => {
    it('should reset all state to initial values', () => {
      // Set up various state
      act(() => {
        groupDialogsActions.openCreateDialog();
        groupDialogsActions.setCreateError('Error');
        groupDialogsActions.openInviteDialog(mockSharedGroup);
        groupDialogsActions.setIsAccepting(true);
        groupDialogsActions.setIsLeaving(true);
        groupDialogsActions.setIsDeleting(true);
        groupDialogsActions.setIsTransferring(true);
        // Story 14d-v2-1-7g: Edit dialog state
        groupDialogsActions.openEditDialog(mockSharedGroup);
        groupDialogsActions.setIsUpdating(true);
      });

      // Verify state is set
      let state = getGroupDialogsState();
      expect(state.isCreateDialogOpen).toBe(true);
      expect(state.createError).toBe('Error');
      expect(state.isInviteDialogOpen).toBe(true);
      // Story 14d-v2-1-7g: Edit dialog should be set
      expect(state.isEditDialogOpen).toBe(true);
      expect(state.editingGroup).toEqual(mockSharedGroup);
      expect(state.isUpdating).toBe(true);

      // Reset all
      act(() => {
        groupDialogsActions.resetAll();
      });

      // Verify all state fields reset (compare state fields, not actions)
      state = getGroupDialogsState();
      expect(state.isCreateDialogOpen).toBe(initialGroupDialogsState.isCreateDialogOpen);
      expect(state.createError).toBe(initialGroupDialogsState.createError);
      expect(state.isInviteDialogOpen).toBe(initialGroupDialogsState.isInviteDialogOpen);
      expect(state.selectedGroup).toBe(initialGroupDialogsState.selectedGroup);
      expect(state.isAcceptDialogOpen).toBe(initialGroupDialogsState.isAcceptDialogOpen);
      expect(state.selectedInvitation).toBe(initialGroupDialogsState.selectedInvitation);
      expect(state.isAccepting).toBe(initialGroupDialogsState.isAccepting);
      expect(state.isLeaveDialogOpen).toBe(initialGroupDialogsState.isLeaveDialogOpen);
      expect(state.isLeaving).toBe(initialGroupDialogsState.isLeaving);
      expect(state.isDeleteDialogOpen).toBe(initialGroupDialogsState.isDeleteDialogOpen);
      expect(state.isDeleting).toBe(initialGroupDialogsState.isDeleting);
      expect(state.isOwnerWarningOpen).toBe(initialGroupDialogsState.isOwnerWarningOpen);
      expect(state.isMemberSelectorOpen).toBe(initialGroupDialogsState.isMemberSelectorOpen);
      expect(state.isTransferDialogOpen).toBe(initialGroupDialogsState.isTransferDialogOpen);
      expect(state.isTransferring).toBe(initialGroupDialogsState.isTransferring);
      expect(state.selectedGroupForAction).toBe(initialGroupDialogsState.selectedGroupForAction);
      expect(state.selectedMemberForTransfer).toBe(initialGroupDialogsState.selectedMemberForTransfer);
      expect(state.selectedMemberName).toBe(initialGroupDialogsState.selectedMemberName);
      // Story 14d-v2-1-7g: Edit dialog should be reset
      expect(state.isEditDialogOpen).toBe(initialGroupDialogsState.isEditDialogOpen);
      expect(state.editingGroup).toBe(initialGroupDialogsState.editingGroup);
      expect(state.isUpdating).toBe(initialGroupDialogsState.isUpdating);
    });
  });

  // =========================================================================
  // Direct Store Access Tests
  // =========================================================================
  describe('direct store access', () => {
    it('should provide getState function', () => {
      const state = useGroupDialogsStore.getState();
      expect(state.isCreateDialogOpen).toBe(false);
    });

    it('should provide setState function', () => {
      act(() => {
        useGroupDialogsStore.setState({ isCreateDialogOpen: true });
      });

      expect(getGroupDialogsState().isCreateDialogOpen).toBe(true);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================
  describe('edge cases', () => {
    it('should handle rapid state changes', () => {
      act(() => {
        groupDialogsActions.openCreateDialog();
        groupDialogsActions.closeCreateDialog();
        groupDialogsActions.openCreateDialog();
        groupDialogsActions.closeCreateDialog();
      });

      expect(getGroupDialogsState().isCreateDialogOpen).toBe(false);
    });

    it('should handle updating selected group with different group', () => {
      act(() => {
        groupDialogsActions.openInviteDialog(mockSharedGroup);
      });

      expect(getGroupDialogsState().selectedGroup).toEqual(mockSharedGroup);

      act(() => {
        groupDialogsActions.openInviteDialog(mockSharedGroup2);
      });

      expect(getGroupDialogsState().selectedGroup).toEqual(mockSharedGroup2);
    });
  });
});
