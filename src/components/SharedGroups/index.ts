/**
 * Shared Groups Components
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Barrel export for shared group related components.
 */

// Story 14c.1: Create Shared Group
export { ShareCodeDisplay } from './ShareCodeDisplay';
export type { ShareCodeDisplayProps } from './ShareCodeDisplay';

// Story 14c.10: Empty States & Loading
export { TransactionCardSkeleton } from './TransactionCardSkeleton';
export type { TransactionCardSkeletonProps } from './TransactionCardSkeleton';

export { SharedGroupSkeleton } from './SharedGroupSkeleton';
export type { SharedGroupSkeletonProps } from './SharedGroupSkeleton';

export { SharedGroupEmptyState } from './SharedGroupEmptyState';
export type { SharedGroupEmptyStateProps } from './SharedGroupEmptyState';

export { InviteMembersPrompt } from './InviteMembersPrompt';
export type { InviteMembersPromptProps } from './InviteMembersPrompt';

// Story 14c.4: View Mode Switcher
export { ViewModeSwitcher } from './ViewModeSwitcher';
export type { ViewModeSwitcherProps } from './ViewModeSwitcher';

// Story 14c.2: Pending Invitations
export { PendingInvitationsSection } from './PendingInvitationsSection';

// Story 14c.3: Leave/Manage Group
export { GroupMembersManager } from './GroupMembersManager';
export { LeaveGroupDialog } from './LeaveGroupDialog';
export type { LeaveGroupDialogProps, LeaveMode } from './LeaveGroupDialog';
export { DeleteGroupDialog } from './DeleteGroupDialog';
export type { DeleteGroupDialogProps } from './DeleteGroupDialog';
export { TransferOwnershipDialog } from './TransferOwnershipDialog';
export { OwnerLeaveWarningDialog } from './OwnerLeaveWarningDialog';
export { RemoveMemberDialog } from './RemoveMemberDialog';

// Story 14c.6: Transaction Ownership Indicators
export { ProfileIndicator } from './ProfileIndicator';
export type { ProfileIndicatorProps } from './ProfileIndicator';

// Story 14c.5: Shared Group Transactions View
export { SharedGroupTotalCard, SharedGroupTotalCardSkeleton } from './SharedGroupTotalCard';
export type { SharedGroupTotalCardProps } from './SharedGroupTotalCard';

export { MemberFilterBar, MemberFilterBarSkeleton } from './MemberFilterBar';
export type { MemberFilterBarProps } from './MemberFilterBar';

export { DateRangeSelector, DateRangeDisplay } from './DateRangeSelector';
export type { DateRangeSelectorProps } from './DateRangeSelector';

// Story 14c.7: Tag Transactions to Groups
export { TransactionGroupSelector } from './TransactionGroupSelector';
export type { TransactionGroupSelectorProps, GroupWithMeta } from './TransactionGroupSelector';

// Story 14c.8: Auto-Tag on Scan
export { AutoTagIndicator } from './AutoTagIndicator';
export type { AutoTagIndicatorProps } from './AutoTagIndicator';

// Story 14c.8: Icon/Color Pickers for Group Creation
export { EmojiPicker } from './EmojiPicker';
export type { EmojiPickerProps } from './EmojiPicker';

export { ColorPicker } from './ColorPicker';
export type { ColorPickerProps } from './ColorPicker';

// Story 14c.9: Shared Group Analytics
export { MemberContributionChart, MemberContributionChartSkeleton } from './MemberContributionChart';
export type { MemberContributionChartProps, MemberContributionChartSkeletonProps } from './MemberContributionChart';

// Story 14c.11: Error Handling
export { SharedGroupError } from './SharedGroupError';
export type { SharedGroupErrorProps } from './SharedGroupError';

export { SharedGroupErrorBoundary } from './SharedGroupErrorBoundary';
export type { SharedGroupErrorBoundaryProps } from './SharedGroupErrorBoundary';
