/**
 * useGroupDialogsStore - Zustand Store for Group Dialogs State
 *
 * Story TD-14d-1: Zustand Migration for useGroupDialogs
 *
 * This store manages state for all group-related dialogs:
 * - Create, Invite, Accept, Leave, Delete dialogs
 * - Owner warning, Member selector, Transfer dialogs
 * - Selection state for groups, invitations, and members
 * - Loading states for async operations
 *
 * Architecture:
 * - Follows Epic 14e Zustand-only pattern (ADR-018)
 * - DevTools integration with action naming
 * - Exported initialState for test reset
 *
 * @example
 * ```typescript
 * // Use the store directly
 * const isOpen = useGroupDialogsStore((s) => s.isCreateDialogOpen);
 * const openCreate = useGroupDialogsStore((s) => s.openCreateDialog);
 *
 * // Or use the hook wrapper (backward compatible)
 * const { dialogs, actions } = useGroupDialogs();
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

/**
 * State for all group-related dialogs.
 */
export interface GroupDialogsState {
  // Create dialog
  isCreateDialogOpen: boolean;
  createError: string | null;

  // Invite dialog
  isInviteDialogOpen: boolean;
  selectedGroup: SharedGroup | null;

  // Accept invitation dialog
  isAcceptDialogOpen: boolean;
  selectedInvitation: PendingInvitation | null;
  isAccepting: boolean;

  // Leave dialog
  isLeaveDialogOpen: boolean;
  isLeaving: boolean;

  // Delete dialog
  isDeleteDialogOpen: boolean;
  isDeleting: boolean;

  // Owner warning dialog
  isOwnerWarningOpen: boolean;

  // Member selector dialog
  isMemberSelectorOpen: boolean;

  // Transfer dialog
  isTransferDialogOpen: boolean;
  isTransferring: boolean;

  // Story 14d-v2-1-7g: Edit dialog
  isEditDialogOpen: boolean;
  isUpdating: boolean;
  editingGroup: SharedGroup | null;

  // Shared selection state
  selectedGroupForAction: SharedGroup | null;
  selectedMemberForTransfer: string | null;
  selectedMemberName: string;
}

/**
 * Actions to manage dialog state.
 */
export interface GroupDialogsActions {
  // Create dialog
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  setCreateError: (error: string | null) => void;
  resetCreateError: () => void;

  // Invite dialog
  openInviteDialog: (group: SharedGroup) => void;
  closeInviteDialog: () => void;

  // Accept invitation dialog
  openAcceptDialog: (invitation: PendingInvitation) => void;
  closeAcceptDialog: () => void;
  setIsAccepting: (value: boolean) => void;

  // Leave dialog
  openLeaveDialog: (group: SharedGroup) => void;
  closeLeaveDialog: () => void;
  setIsLeaving: (value: boolean) => void;

  // Delete dialog
  openDeleteDialog: (group: SharedGroup) => void;
  closeDeleteDialog: () => void;
  setIsDeleting: (value: boolean) => void;

  // Owner warning dialog
  openOwnerWarning: (group: SharedGroup) => void;
  closeOwnerWarning: () => void;

  // Member selector dialog
  openMemberSelector: (group: SharedGroup) => void;
  closeMemberSelector: () => void;

  // Transfer dialog
  openTransferDialog: (memberId: string, memberName: string) => void;
  closeTransferDialog: () => void;
  setIsTransferring: (value: boolean) => void;

  // Story 14d-v2-1-7g: Edit dialog
  openEditDialog: (group: SharedGroup) => void;
  closeEditDialog: () => void;
  setIsUpdating: (value: boolean) => void;

  // Utility
  resetAll: () => void;
}

/**
 * Combined store type.
 */
export type GroupDialogsStore = GroupDialogsState & GroupDialogsActions;

// =============================================================================
// Initial State
// =============================================================================

/**
 * Initial state for all group dialogs.
 * Exported for test reset functionality.
 */
export const initialGroupDialogsState: GroupDialogsState = {
  // Create dialog
  isCreateDialogOpen: false,
  createError: null,

  // Invite dialog
  isInviteDialogOpen: false,
  selectedGroup: null,

  // Accept invitation dialog
  isAcceptDialogOpen: false,
  selectedInvitation: null,
  isAccepting: false,

  // Leave dialog
  isLeaveDialogOpen: false,
  isLeaving: false,

  // Delete dialog
  isDeleteDialogOpen: false,
  isDeleting: false,

  // Owner warning dialog
  isOwnerWarningOpen: false,

  // Member selector dialog
  isMemberSelectorOpen: false,

  // Transfer dialog
  isTransferDialogOpen: false,
  isTransferring: false,

  // Story 14d-v2-1-7g: Edit dialog
  isEditDialogOpen: false,
  isUpdating: false,
  editingGroup: null,

  // Shared selection state
  selectedGroupForAction: null,
  selectedMemberForTransfer: null,
  selectedMemberName: '',
};

// =============================================================================
// Store Definition
// =============================================================================

export const useGroupDialogsStore = create<GroupDialogsStore>()(
  devtools(
    (set) => ({
      // Initial state spread
      ...initialGroupDialogsState,

      // =========================================================================
      // Create Dialog Actions
      // =========================================================================
      openCreateDialog: () =>
        set({ isCreateDialogOpen: true }, false, 'dialogs/openCreate'),

      closeCreateDialog: () =>
        set(
          { isCreateDialogOpen: false, createError: null },
          false,
          'dialogs/closeCreate'
        ),

      setCreateError: (error) =>
        set({ createError: error }, false, 'dialogs/setCreateError'),

      resetCreateError: () =>
        set({ createError: null }, false, 'dialogs/resetCreateError'),

      // =========================================================================
      // Invite Dialog Actions
      // =========================================================================
      openInviteDialog: (group) =>
        set(
          { selectedGroup: group, isInviteDialogOpen: true },
          false,
          'dialogs/openInvite'
        ),

      closeInviteDialog: () =>
        set(
          { isInviteDialogOpen: false, selectedGroup: null },
          false,
          'dialogs/closeInvite'
        ),

      // =========================================================================
      // Accept Dialog Actions
      // =========================================================================
      openAcceptDialog: (invitation) =>
        set(
          { selectedInvitation: invitation, isAcceptDialogOpen: true },
          false,
          'dialogs/openAccept'
        ),

      closeAcceptDialog: () =>
        set(
          { isAcceptDialogOpen: false, selectedInvitation: null },
          false,
          'dialogs/closeAccept'
        ),

      setIsAccepting: (value) =>
        set({ isAccepting: value }, false, 'dialogs/setIsAccepting'),

      // =========================================================================
      // Leave Dialog Actions
      // =========================================================================
      openLeaveDialog: (group) =>
        set(
          { selectedGroupForAction: group, isLeaveDialogOpen: true },
          false,
          'dialogs/openLeave'
        ),

      closeLeaveDialog: () =>
        set(
          { isLeaveDialogOpen: false, selectedGroupForAction: null },
          false,
          'dialogs/closeLeave'
        ),

      setIsLeaving: (value) =>
        set({ isLeaving: value }, false, 'dialogs/setIsLeaving'),

      // =========================================================================
      // Delete Dialog Actions
      // =========================================================================
      openDeleteDialog: (group) =>
        set(
          { selectedGroupForAction: group, isDeleteDialogOpen: true },
          false,
          'dialogs/openDelete'
        ),

      closeDeleteDialog: () =>
        set(
          { isDeleteDialogOpen: false, selectedGroupForAction: null },
          false,
          'dialogs/closeDelete'
        ),

      setIsDeleting: (value) =>
        set({ isDeleting: value }, false, 'dialogs/setIsDeleting'),

      // =========================================================================
      // Owner Warning Dialog Actions
      // =========================================================================
      openOwnerWarning: (group) =>
        set(
          { selectedGroupForAction: group, isOwnerWarningOpen: true },
          false,
          'dialogs/openOwnerWarning'
        ),

      closeOwnerWarning: () =>
        set(
          { isOwnerWarningOpen: false, selectedGroupForAction: null },
          false,
          'dialogs/closeOwnerWarning'
        ),

      // =========================================================================
      // Member Selector Dialog Actions
      // =========================================================================
      openMemberSelector: (group) =>
        set(
          { selectedGroupForAction: group, isMemberSelectorOpen: true },
          false,
          'dialogs/openMemberSelector'
        ),

      closeMemberSelector: () =>
        // NOTE: Keep selectedGroupForAction for transfer flow
        set({ isMemberSelectorOpen: false }, false, 'dialogs/closeMemberSelector'),

      // =========================================================================
      // Transfer Dialog Actions
      // =========================================================================
      openTransferDialog: (memberId, memberName) =>
        set(
          {
            isMemberSelectorOpen: false,
            selectedMemberForTransfer: memberId,
            selectedMemberName: memberName,
            isTransferDialogOpen: true,
          },
          false,
          'dialogs/openTransfer'
        ),

      closeTransferDialog: () =>
        set(
          {
            isTransferDialogOpen: false,
            selectedMemberForTransfer: null,
            selectedMemberName: '',
            selectedGroupForAction: null,
          },
          false,
          'dialogs/closeTransfer'
        ),

      setIsTransferring: (value) =>
        set({ isTransferring: value }, false, 'dialogs/setIsTransferring'),

      // =========================================================================
      // Story 14d-v2-1-7g: Edit Dialog Actions
      // =========================================================================
      openEditDialog: (group) =>
        set(
          { editingGroup: group, isEditDialogOpen: true },
          false,
          'dialogs/openEdit'
        ),

      closeEditDialog: () =>
        set(
          { isEditDialogOpen: false, editingGroup: null },
          false,
          'dialogs/closeEdit'
        ),

      setIsUpdating: (value) =>
        set({ isUpdating: value }, false, 'dialogs/setIsUpdating'),

      // =========================================================================
      // Reset All Action
      // =========================================================================
      resetAll: () => set(initialGroupDialogsState, false, 'dialogs/resetAll'),
    }),
    { name: 'group-dialogs-store', enabled: import.meta.env.DEV }
  )
);

// =============================================================================
// Direct Access (for non-React code)
// =============================================================================

/**
 * Get current dialog state directly (non-reactive).
 * Use only in services or other non-React contexts.
 */
export const getGroupDialogsState = () => useGroupDialogsStore.getState();

/**
 * Dialog actions for non-React code.
 */
export const groupDialogsActions = {
  openCreateDialog: () => useGroupDialogsStore.getState().openCreateDialog(),
  closeCreateDialog: () => useGroupDialogsStore.getState().closeCreateDialog(),
  setCreateError: (error: string | null) =>
    useGroupDialogsStore.getState().setCreateError(error),
  resetCreateError: () => useGroupDialogsStore.getState().resetCreateError(),

  openInviteDialog: (group: SharedGroup) =>
    useGroupDialogsStore.getState().openInviteDialog(group),
  closeInviteDialog: () => useGroupDialogsStore.getState().closeInviteDialog(),

  openAcceptDialog: (invitation: PendingInvitation) =>
    useGroupDialogsStore.getState().openAcceptDialog(invitation),
  closeAcceptDialog: () => useGroupDialogsStore.getState().closeAcceptDialog(),
  setIsAccepting: (value: boolean) =>
    useGroupDialogsStore.getState().setIsAccepting(value),

  openLeaveDialog: (group: SharedGroup) =>
    useGroupDialogsStore.getState().openLeaveDialog(group),
  closeLeaveDialog: () => useGroupDialogsStore.getState().closeLeaveDialog(),
  setIsLeaving: (value: boolean) =>
    useGroupDialogsStore.getState().setIsLeaving(value),

  openDeleteDialog: (group: SharedGroup) =>
    useGroupDialogsStore.getState().openDeleteDialog(group),
  closeDeleteDialog: () => useGroupDialogsStore.getState().closeDeleteDialog(),
  setIsDeleting: (value: boolean) =>
    useGroupDialogsStore.getState().setIsDeleting(value),

  openOwnerWarning: (group: SharedGroup) =>
    useGroupDialogsStore.getState().openOwnerWarning(group),
  closeOwnerWarning: () => useGroupDialogsStore.getState().closeOwnerWarning(),

  openMemberSelector: (group: SharedGroup) =>
    useGroupDialogsStore.getState().openMemberSelector(group),
  closeMemberSelector: () => useGroupDialogsStore.getState().closeMemberSelector(),

  openTransferDialog: (memberId: string, memberName: string) =>
    useGroupDialogsStore.getState().openTransferDialog(memberId, memberName),
  closeTransferDialog: () => useGroupDialogsStore.getState().closeTransferDialog(),
  setIsTransferring: (value: boolean) =>
    useGroupDialogsStore.getState().setIsTransferring(value),

  // Story 14d-v2-1-7g: Edit dialog
  openEditDialog: (group: SharedGroup) =>
    useGroupDialogsStore.getState().openEditDialog(group),
  closeEditDialog: () => useGroupDialogsStore.getState().closeEditDialog(),
  setIsUpdating: (value: boolean) =>
    useGroupDialogsStore.getState().setIsUpdating(value),

  resetAll: () => useGroupDialogsStore.getState().resetAll(),
};
