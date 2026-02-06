/**
 * Types Barrel Export
 *
 * Central export point for TypeScript types used in the application.
 * Import types from this file for convenience:
 *
 * @example
 * ```typescript
 * import type { Transaction, ChangelogEntry } from '@/types';
 * import { createChangelogSummary, CHANGELOG_TTL_DAYS } from '@/types';
 * ```
 *
 * Story 14d-v2-1-3a: Initial creation with changelog types.
 */

// ============================================================================
// Changelog types (Epic 14d-v2)
// ============================================================================
export type {
    ChangelogEntry,
    ChangelogEntryType,
    ChangelogSummary,
    CreateChangelogEntryInput,
} from './changelog';

export {
    CHANGELOG_TTL_MS,
    CHANGELOG_TTL_DAYS,
    createChangelogSummary,
    isChangelogRemoval,
    hasChangelogData,
} from './changelog';

// ============================================================================
// Transaction types
// ============================================================================
export type {
    Transaction,
    TransactionItem,
    TransactionPeriods,
    CategorySource,
    MerchantSource,
} from './transaction';

export {
    hasTransactionImages,
    hasTransactionThumbnail,
    isOwnTransaction,
} from './transaction';

// ============================================================================
// Shared Group types (Epic 14d-v2)
// ============================================================================
export type {
    SharedGroup,
    SharedGroupMember,
    MemberUpdate,
    MemberProfile,
    CreateSharedGroupInput,
    UpdateSharedGroupInput,
    SharedGroupPreview,
    UserSharedGroupMembership,
    PendingInvitation,
    PendingInvitationStatus,
    UserGroupPreference,
    UserSharedGroupsPreferences,
} from './sharedGroup';

export {
    SHARED_GROUP_LIMITS,
    isSharedGroupOwner,
    isSharedGroupMember,
    isShareCodeExpired,
    canAddMember,
    isInvitationExpired,
    getInvitationTimeRemaining,
    extractGroupEmoji,
    extractGroupLabel,
    createDefaultGroupPreference,
} from './sharedGroup';
