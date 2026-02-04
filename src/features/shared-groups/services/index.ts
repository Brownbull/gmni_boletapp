/**
 * Services barrel export for shared-groups feature
 *
 * Story 14d-v2-1-4b: Service & Hook Layer
 * Story 14d-v2-1-7d: Invitation Handler Services
 * Moved from src/services/groupService.ts for FSD compliance
 */

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
  // ECC Review #2: Default group color constant
  DEFAULT_GROUP_COLOR,
  // Story 14d-v2-1-7g: Edit Group Settings
  updateGroup,
  GROUP_COLORS,
  GROUP_ICONS,
} from './groupService';

// Story 14d-v2-1-7d: Invitation Handler Services
export {
  handleAcceptInvitationService,
  handleDeclineInvitationService,
  isSyntheticInvitation,
} from './invitationHandlers';
