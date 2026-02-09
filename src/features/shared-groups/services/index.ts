/**
 * Services barrel export for shared-groups feature
 *
 * TD-CONSOLIDATED-1: Updated to import from canonical module paths.
 * Story 14d-v2-1-4b: Service & Hook Layer
 * Story 14d-v2-1-7d: Invitation Handler Services
 */

// Group CRUD (groupService.ts)
export {
  createGroup,
  getUserGroups,
  getGroupCount,
  canCreateGroup,
  getDeviceTimezone,
  getGroupByShareCode,
  updateGroup,
  updateTransactionSharingEnabled,
  DEFAULT_GROUP_COLOR,
  GROUP_COLORS,
  GROUP_ICONS,
} from './groupService';

// Group Deletion (groupDeletionService.ts)
export {
  deleteGroupAsLastMember,
  deleteGroupAsOwner,
} from './groupDeletionService';

// Group Membership (groupMemberService.ts)
export {
  joinGroupDirectly,
  leaveGroup,
  transferOwnership,
  leaveGroupWithCleanup,
  transferAndLeaveWithCleanup,
} from './groupMemberService';

// Story 14d-v2-1-7d: Invitation Handler Services
export {
  handleAcceptInvitationService,
  handleDeclineInvitationService,
  isSyntheticInvitation,
} from './invitationHandlers';
