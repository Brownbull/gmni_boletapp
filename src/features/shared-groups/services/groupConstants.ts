/**
 * Shared Constants for Group Services
 *
 * TD-CONSOLIDATED-1: Extracted from groupService.ts during modularization.
 * Constants used by multiple service modules (groupService, groupDeletionService, groupMemberService).
 */

/**
 * Firestore collection name for shared groups.
 * Top-level collection for cross-user access.
 */
export const GROUPS_COLLECTION = 'sharedGroups';

/**
 * Default timezone fallback when Intl.DateTimeFormat fails.
 */
export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Subcollection name for changelog entries.
 * Story 14d-v2-1-7b: Deletion Service Logic
 */
export const CHANGELOG_SUBCOLLECTION = 'changelog';

/**
 * Subcollection name for analytics data.
 * Story 14d-v2-1-7b: Deletion Service Logic
 */
export const ANALYTICS_SUBCOLLECTION = 'analytics';

/**
 * Top-level collection for pending invitations.
 * Story 14d-v2-1-7b: Deletion Service Logic
 */
export const INVITATIONS_COLLECTION = 'pendingInvitations';

/**
 * Maximum batch size for Firestore operations.
 * Firestore has a limit of 500 operations per batch.
 * @see https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes
 * Story 14d-v2-1-7b: Deletion Service Logic
 */
export const BATCH_SIZE = 500;

/**
 * Default group color (emerald green).
 * ECC Review #2: Exported for use in UI components
 */
export const DEFAULT_GROUP_COLOR = '#10b981';

/**
 * Whitelist of valid group colors (hex codes).
 * Story 14d-v2-1-7g: Edit Group Settings
 * These colors match the ColorPicker component's COLOR_OPTIONS.
 * @see src/features/shared-groups/components/ColorPicker.tsx
 */
export const GROUP_COLORS: readonly string[] = [
    '#10b981', '#22c55e', '#84cc16', '#14b8a6',
    '#3b82f6', '#0ea5e9', '#06b6d4', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
    '#eab308', '#78716c', '#64748b', '#71717a',
];

/**
 * Whitelist of valid group icons (emojis).
 * Story 14d-v2-1-7g: Edit Group Settings
 * These emojis match the EmojiPicker component's EMOJI_CATEGORIES.
 * @see src/features/shared-groups/components/EmojiPicker.tsx
 */
export const GROUP_ICONS: readonly string[] = [
    '🏠', '🏡', '🏢', '👨‍👩‍👧‍👦', '👨‍👩‍👧', '👪', '🏘', '🛋', '🛏', '🚿', '🧹', '🪴',
    '✈', '🚗', '🚌', '🚃', '⛽', '🏖', '🗺', '🧳', '🚀', '🚲', '🛵', '⛵',
    '🍽', '🍔', '🍕', '☕', '🍺', '🛒', '🧑‍🍳', '🥗', '🍰', '🍜', '🥤', '🍷',
    '🎬', '🎮', '🎵', '🎭', '🎪', '📺', '🎤', '🎸', '🎨', '📷', '🎲', '🎯',
    '💼', '💻', '📊', '📈', '🏛', '📋', '✏', '📁', '🖨', '📞', '🗂', '📝',
    '🏥', '💊', '🏃', '⚽', '🏋', '🧘', '🚴', '🏊', '🎾', '⛳', '🥊', '🏀',
    '🛍', '👗', '👟', '💄', '🎁', '💎', '🏬', '👜', '⌚', '👔', '🧥',
    '🎄', '🎂', '🎉', '💒', '🎓', '🏆', '🎊', '✨', '🎈', '🎇', '🎆',
    '🐕', '🐈', '🌳', '🌸', '🌊', '⛰', '🌺', '🦋', '🐠', '🦜', '🌻', '🍀',
    '⭐', '❤', '💰', '🔑', '🏷', '📌', '🔔', '💡', '💳', '📍', '🔒',
    '👥',
];
