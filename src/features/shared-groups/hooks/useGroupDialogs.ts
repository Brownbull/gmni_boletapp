/**
 * useGroupDialogs Hook
 *
 * Story TD-14d-1: Now uses Zustand store internally for DevTools visibility.
 * Maintains backward-compatible API: { dialogs, actions }
 *
 * This hook provides:
 * - State for all group-related dialogs (create, invite, accept, leave, transfer)
 * - Actions to open/close dialogs with proper state management
 * - Selection state for groups, invitations, and members
 * - Loading states for async operations
 *
 * @example
 * ```typescript
 * const { dialogs, actions } = useGroupDialogs();
 *
 * // Open create dialog
 * actions.openCreateDialog();
 *
 * // Open invite dialog for a specific group
 * actions.openInviteDialog(group);
 *
 * // Check if any dialog is open
 * if (dialogs.isCreateDialogOpen) {
 *   // render create dialog
 * }
 * ```
 */

import { useShallow } from 'zustand/react/shallow';
import {
  useGroupDialogsStore,
  type GroupDialogsState,
  type GroupDialogsActions,
} from '../store/useGroupDialogsStore';

// Re-export types for backward compatibility
export type { GroupDialogsState, GroupDialogsActions } from '../store/useGroupDialogsStore';

/**
 * Return type for useGroupDialogs hook.
 */
export interface UseGroupDialogsReturn {
  dialogs: GroupDialogsState;
  actions: GroupDialogsActions;
}

/**
 * Hook to manage all group dialog state.
 *
 * TD-14d-1: Now uses Zustand store internally.
 * API unchanged: returns { dialogs, actions }
 */
export const useGroupDialogs = (): UseGroupDialogsReturn => {
  // Select state (dialogs) - useShallow prevents unnecessary re-renders
  const dialogs = useGroupDialogsStore(
    useShallow((state) => ({
      isCreateDialogOpen: state.isCreateDialogOpen,
      createError: state.createError,
      isInviteDialogOpen: state.isInviteDialogOpen,
      selectedGroup: state.selectedGroup,
      isAcceptDialogOpen: state.isAcceptDialogOpen,
      selectedInvitation: state.selectedInvitation,
      isAccepting: state.isAccepting,
      isLeaveDialogOpen: state.isLeaveDialogOpen,
      isLeaving: state.isLeaving,
      isDeleteDialogOpen: state.isDeleteDialogOpen,
      isDeleting: state.isDeleting,
      isOwnerWarningOpen: state.isOwnerWarningOpen,
      isMemberSelectorOpen: state.isMemberSelectorOpen,
      isTransferDialogOpen: state.isTransferDialogOpen,
      isTransferring: state.isTransferring,
      selectedGroupForAction: state.selectedGroupForAction,
      selectedMemberForTransfer: state.selectedMemberForTransfer,
      selectedMemberName: state.selectedMemberName,
      // Story 14d-v2-1-7g: Edit dialog state
      isEditDialogOpen: state.isEditDialogOpen,
      isUpdating: state.isUpdating,
      editingGroup: state.editingGroup,
    }))
  );

  // Select actions - useShallow ensures stable references
  const actions = useGroupDialogsStore(
    useShallow((state) => ({
      openCreateDialog: state.openCreateDialog,
      closeCreateDialog: state.closeCreateDialog,
      setCreateError: state.setCreateError,
      resetCreateError: state.resetCreateError,
      openInviteDialog: state.openInviteDialog,
      closeInviteDialog: state.closeInviteDialog,
      openAcceptDialog: state.openAcceptDialog,
      closeAcceptDialog: state.closeAcceptDialog,
      setIsAccepting: state.setIsAccepting,
      openLeaveDialog: state.openLeaveDialog,
      closeLeaveDialog: state.closeLeaveDialog,
      setIsLeaving: state.setIsLeaving,
      openDeleteDialog: state.openDeleteDialog,
      closeDeleteDialog: state.closeDeleteDialog,
      setIsDeleting: state.setIsDeleting,
      openOwnerWarning: state.openOwnerWarning,
      closeOwnerWarning: state.closeOwnerWarning,
      openMemberSelector: state.openMemberSelector,
      closeMemberSelector: state.closeMemberSelector,
      openTransferDialog: state.openTransferDialog,
      closeTransferDialog: state.closeTransferDialog,
      setIsTransferring: state.setIsTransferring,
      // Story 14d-v2-1-7g: Edit dialog actions
      openEditDialog: state.openEditDialog,
      closeEditDialog: state.closeEditDialog,
      setIsUpdating: state.setIsUpdating,
      resetAll: state.resetAll,
    }))
  );

  return { dialogs, actions };
};

export default useGroupDialogs;
