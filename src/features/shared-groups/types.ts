/**
 * Feature: Shared Groups
 *
 * Type definitions for the shared groups feature.
 * Created in Story 14d-v2-0: Architecture Alignment
 *
 * NOTE: This is a placeholder. Types will be expanded in Story 14d-v2-1.2
 * when the transaction type migration occurs.
 */

// Re-export from shared types for convenience
export type {
  SharedGroup,
  SharedGroupMember,
  MemberProfile,
  MemberUpdate,
  PendingInvitation,
  CreateSharedGroupInput,
  UpdateSharedGroupInput,
  SharedGroupPreview,
} from '@/types/sharedGroup';

// Re-export type guards and utilities
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
} from '@/types/sharedGroup';

// ============================================================================
// Leave Mode Type
// ============================================================================

/**
 * Mode for leaving a group.
 * - 'soft': Keep transactions shared (others can still see)
 * - 'hard': Remove transactions from group (become private) - TD-7d-5: Deferred to Cloud Function
 */
export type LeaveMode = 'soft' | 'hard';
