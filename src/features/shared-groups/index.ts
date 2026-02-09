/**
 * Feature: Shared Groups
 *
 * Share transactions with family members or roommates.
 * Implements Epic 14d-v2: Shared Groups V2.
 *
 * Story 14d-v2-0: Architecture Alignment (CURRENT)
 * - Created feature directory structure
 * - Migrated ViewMode to Zustand store
 *
 * Architecture:
 * - Store: useViewModeStore (Zustand, follows ADR-018)
 * - Sync: Changelog-driven (Sub-Epic 2)
 * - Analytics: Server-side (Sub-Epic 3)
 */

// =============================================================================
// Store (Story 14d-v2-0, TD-14d-1)
// =============================================================================

export {
  // ViewMode store (Story 14d-v2-0)
  useViewModeStore,
  useViewMode,
  selectIsGroupMode,
  selectCurrentGroupId,
  selectCurrentGroup,
  // GroupDialogs store (TD-14d-1: Zustand Migration)
  useGroupDialogsStore,
  initialGroupDialogsState,
  getGroupDialogsState,
  groupDialogsActions,
} from './store';

export type {
  // ViewMode types
  ViewMode,
  ViewModeState,
  ViewModeActions,
  ViewModeStore,
  // GroupDialogs types (TD-14d-1)
  GroupDialogsState,
  GroupDialogsActions,
  GroupDialogsStore,
} from './store';

// =============================================================================
// Types (Story 14d-v2-0)
// =============================================================================

export type {
  SharedGroup,
  SharedGroupMember,
  MemberProfile,
  MemberUpdate,
  PendingInvitation,
  CreateSharedGroupInput,
  UpdateSharedGroupInput,
  SharedGroupPreview,
} from './types';

export {
  isSharedGroupOwner,
  isSharedGroupMember,
  isShareCodeExpired,
  canAddMember,
  isInvitationExpired,
  getInvitationTimeRemaining,
  extractGroupEmoji,
  extractGroupLabel,
  SHARED_GROUP_LIMITS,
} from './types';

// =============================================================================
// Handlers (Sub-Epic 2)
// =============================================================================

// export { ... } from './handlers';  // Story 14d-v2-2-*

// =============================================================================
// Services (Story 14d-v2-1-4b, 14d-v2-1-7a, 14d-v2-1-7b, 14d-v2-1-7d)
// =============================================================================

export {
  createGroup,
  getUserGroups,
  getGroupCount,
  canCreateGroup,
  getDeviceTimezone,
  getGroupByShareCode,
  joinGroupDirectly,
  leaveGroup,
  transferOwnership,
  deleteGroupAsLastMember,
  deleteGroupAsOwner,
  // Story 14d-v2-1-7d: Invitation Handler Services
  handleAcceptInvitationService,
  handleDeclineInvitationService,
  isSyntheticInvitation,
  // ECC Review #2: Default group color constant
  DEFAULT_GROUP_COLOR,
  // Story 14d-v2-1-7g: Edit Group Settings
  updateGroup,
  GROUP_COLORS,
  GROUP_ICONS,
  // Story 14d-v2-1-11c: Transaction Sharing Toggle
  updateTransactionSharingEnabled,
  // Story 14d-v2-1-12d: Leave Group with Cleanup
  leaveGroupWithCleanup,
  transferAndLeaveWithCleanup,
} from './services';

// =============================================================================
// Hooks (Story 14d-v2-1-4b, 14d-v2-1-7d)
// =============================================================================

export {
  useGroups,
  useGroupCount,
  useCreateGroup,
  useCanCreateGroup,
  // Story 14d-v2-1-7d: Leave/Transfer Flow Hook
  useLeaveTransferFlow,
  // Story 14d-v2-1-7d (TD-7d-1): Dialog State Management Hook
  useGroupDialogs,
  // Story 14d-v2-1-7g: Edit Group Settings
  useUpdateGroup,
  // Story 14d-v2-1-12c: User Group Preference Hook
  useUserGroupPreference,
  // Story TD-CONSOLIDATED-12: Group Mutation Hooks
  useDeleteGroup,
  useLeaveGroup,
  useTransferOwnership,
  useAcceptInvitation,
  useDeclineInvitation,
  useToggleTransactionSharing,
} from './hooks';

export type {
  CreateGroupInput,
  UseGroupsResult,
  UseGroupCountResult,
  UseCreateGroupResult,
  // Story 14d-v2-1-7d: Leave/Transfer Flow Hook Types
  LeaveMode,
  UseLeaveTransferFlowOptions,
  UseLeaveTransferFlowReturn,
  // Story 14d-v2-1-7d (TD-7d-1): Dialog State Management Types
  // NOTE: GroupDialogsState/Actions now exported from ./store (TD-14d-1)
  UseGroupDialogsReturn,
  // Story 14d-v2-1-7g: Edit Group Settings
  UpdateGroupInput,
  UseUpdateGroupResult,
  // Story 14d-v2-1-12c: User Group Preference Hook Types
  UseUserGroupPreferenceResult,
  UserGroupPreferenceServices,
} from './hooks';

// =============================================================================
// Components (TD-14d-2: Moved from src/components/SharedGroups/)
// =============================================================================

// Re-export all components from the components barrel
export * from './components';
