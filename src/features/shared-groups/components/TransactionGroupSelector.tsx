/**
 * Story 14c-refactor.5: TransactionGroupSelector - STUBBED (Feature Disabled)
 *
 * STUB: Shared Groups feature is temporarily unavailable.
 *
 * This component returns null - no group selection UI is rendered.
 * The component signature is preserved for backwards compatibility.
 *
 * Original functionality will be restored in Epic 14d (Shared Groups v2).
 */

import React from 'react';
// Note: SHARED_GROUP_LIMITS still imported for type compatibility
import { SHARED_GROUP_LIMITS } from '@/types/sharedGroup';

// =============================================================================
// Types (preserved for backwards compatibility)
// =============================================================================

/**
 * Unified group representation for TransactionGroupSelector.
 * Combines personal TransactionGroups and SharedGroups into a single interface.
 */
export interface GroupWithMeta {
  /** Firestore document ID */
  id: string;
  /** Group display name (may include emoji prefix) */
  name: string;
  /** Group color (hex code, e.g., "#10b981") */
  color: string;
  /** Optional emoji icon */
  icon?: string;
  /** True for SharedGroups, false for personal TransactionGroups */
  isShared: boolean;
  /** Number of members (only for shared groups) */
  memberCount?: number;
}

export interface TransactionGroupSelectorProps {
  /** Available groups to select from */
  groups: GroupWithMeta[];
  /** Currently selected group IDs */
  selectedIds: string[];
  /** Callback when selection is confirmed */
  onSelect: (groupIds: string[]) => void;
  /** Callback to close the modal */
  onClose: () => void;
  /** Translation function */
  t: (key: string) => string;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Whether groups are still loading */
  isLoading?: boolean;
  /** Read-only mode - view assigned groups without ability to modify */
  readOnly?: boolean;
}

// =============================================================================
// Component - STUBBED
// =============================================================================

/**
 * STUB: TransactionGroupSelector - renders nothing.
 *
 * Shared Groups feature is temporarily disabled.
 * This component preserves the interface for backwards compatibility
 * but does not render any UI.
 */
export function TransactionGroupSelector(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: TransactionGroupSelectorProps
): React.ReactElement | null {
  // Feature disabled - render nothing
  // Log that this component was rendered (for debugging during refactor)
  if (process.env.NODE_ENV === 'development') {
    console.log('[TransactionGroupSelector] STUB: Component rendered but feature disabled');
  }
  return null;
}

// Export the max groups limit for any code that might reference it
export const MAX_GROUPS_PER_TRANSACTION = SHARED_GROUP_LIMITS.MAX_GROUPS_PER_TRANSACTION;
