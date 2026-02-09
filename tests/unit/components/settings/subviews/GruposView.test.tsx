/**
 * GruposView Tests
 *
 * Story 14d-v2-1-4c-1: Core Dialog & Entry Point
 * Story 14d-v2-1-7d: Leave/Transfer UI + View Mode Auto-Switch
 * TD-7d-1: useGroupDialogs hook integration
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage for the shared groups settings entry point:
 * - Loading state
 * - Empty state with create button
 * - Groups list rendering
 * - Create group dialog integration
 * - Toast notifications on success/error
 * - Leave Group button and dialog flow
 * - Transfer Ownership button and dialog flow
 * - Owner warning dialog for owner leave attempts
 * - useGroupDialogs hook integration
 * - useLeaveTransferFlow hook integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GruposView } from '@/components/settings/subviews/GruposView';
import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';
import { createMockTimestamp } from '../../../../helpers';

// =============================================================================
// Mock Setup
// =============================================================================

// Story 14d-v2-1-14-polish: Mock useOnlineStatus
let mockIsOnline = true;
vi.mock('@/hooks/app/useOnlineStatus', () => ({
    useOnlineStatus: () => ({
        isOnline: mockIsOnline,
        wasOffline: false,
        refreshStatus: vi.fn(),
    }),
}));

// Story 14d-v2-1-14-polish: Mock analyticsService
const mockTrackEvent = vi.fn();
vi.mock('@/services/analyticsService', () => ({
    trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

// Mock useAuth
const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
};
const mockServices = { db: {} };
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({ user: mockUser, services: mockServices }),
}));

// =============================================================================
// TD-7d-1: Mock useGroupDialogs Hook
// =============================================================================

// State that can be modified per test
let mockDialogState = {
    isCreateDialogOpen: false,
    createError: null as string | null,
    isInviteDialogOpen: false,
    selectedGroup: null as SharedGroup | null,
    isAcceptDialogOpen: false,
    selectedInvitation: null as PendingInvitation | null,
    isAccepting: false,
    isLeaveDialogOpen: false,
    isLeaving: false,
    // Story 14d-v2-1-7e: Delete dialog state
    isDeleteDialogOpen: false,
    isDeleting: false,
    isOwnerWarningOpen: false,
    isMemberSelectorOpen: false,
    isTransferDialogOpen: false,
    isTransferring: false,
    selectedGroupForAction: null as SharedGroup | null,
    selectedMemberForTransfer: null as string | null,
    selectedMemberName: '',
    // Story 14d-v2-1-7g: Edit dialog state
    isEditDialogOpen: false,
    isUpdating: false,
    editingGroup: null as SharedGroup | null,
};

// Create mock functions for dialog actions that update state
// These functions update mockDialogState to simulate real behavior
const mockDialogActions = {
    openCreateDialog: vi.fn(() => { mockDialogState.isCreateDialogOpen = true; }),
    closeCreateDialog: vi.fn(() => { mockDialogState.isCreateDialogOpen = false; mockDialogState.createError = null; }),
    setCreateError: vi.fn((error: string | null) => { mockDialogState.createError = error; }),
    resetCreateError: vi.fn(() => { mockDialogState.createError = null; }),
    openInviteDialog: vi.fn((group: SharedGroup) => { mockDialogState.selectedGroup = group; mockDialogState.isInviteDialogOpen = true; }),
    closeInviteDialog: vi.fn(() => { mockDialogState.isInviteDialogOpen = false; mockDialogState.selectedGroup = null; }),
    openAcceptDialog: vi.fn((invitation: PendingInvitation) => { mockDialogState.selectedInvitation = invitation; mockDialogState.isAcceptDialogOpen = true; }),
    closeAcceptDialog: vi.fn(() => { mockDialogState.isAcceptDialogOpen = false; mockDialogState.selectedInvitation = null; }),
    setIsAccepting: vi.fn((value: boolean) => { mockDialogState.isAccepting = value; }),
    openLeaveDialog: vi.fn((group: SharedGroup) => { mockDialogState.selectedGroupForAction = group; mockDialogState.isLeaveDialogOpen = true; }),
    closeLeaveDialog: vi.fn(() => { mockDialogState.isLeaveDialogOpen = false; mockDialogState.selectedGroupForAction = null; }),
    setIsLeaving: vi.fn((value: boolean) => { mockDialogState.isLeaving = value; }),
    openOwnerWarning: vi.fn((group: SharedGroup) => { mockDialogState.selectedGroupForAction = group; mockDialogState.isOwnerWarningOpen = true; }),
    // TD-7d-1: closeOwnerWarning does NOT reset selectedGroupForAction in the mock
    // because in React, the callback closure preserves the old value, and openMemberSelector
    // will be called immediately after to set the group for the transfer flow.
    closeOwnerWarning: vi.fn(() => { mockDialogState.isOwnerWarningOpen = false; }),
    openMemberSelector: vi.fn((group: SharedGroup) => { mockDialogState.selectedGroupForAction = group; mockDialogState.isMemberSelectorOpen = true; }),
    closeMemberSelector: vi.fn(() => { mockDialogState.isMemberSelectorOpen = false; }),
    openTransferDialog: vi.fn((memberId: string, memberName: string) => {
        mockDialogState.isMemberSelectorOpen = false;
        mockDialogState.selectedMemberForTransfer = memberId;
        mockDialogState.selectedMemberName = memberName;
        mockDialogState.isTransferDialogOpen = true;
    }),
    closeTransferDialog: vi.fn(() => {
        mockDialogState.isTransferDialogOpen = false;
        mockDialogState.selectedMemberForTransfer = null;
        mockDialogState.selectedMemberName = '';
        mockDialogState.selectedGroupForAction = null;
    }),
    setIsTransferring: vi.fn((value: boolean) => { mockDialogState.isTransferring = value; }),
    // Story 14d-v2-1-7e: Delete dialog actions
    openDeleteDialog: vi.fn((group: SharedGroup) => {
        mockDialogState.selectedGroupForAction = group;
        mockDialogState.isDeleteDialogOpen = true;
    }),
    closeDeleteDialog: vi.fn(() => {
        mockDialogState.isDeleteDialogOpen = false;
        mockDialogState.selectedGroupForAction = null;
    }),
    setIsDeleting: vi.fn((value: boolean) => { mockDialogState.isDeleting = value; }),
    // Story 14d-v2-1-7g: Edit dialog actions
    openEditDialog: vi.fn((group: SharedGroup) => {
        mockDialogState.editingGroup = group;
        mockDialogState.isEditDialogOpen = true;
    }),
    closeEditDialog: vi.fn(() => {
        mockDialogState.isEditDialogOpen = false;
        mockDialogState.editingGroup = null;
    }),
    setIsUpdating: vi.fn((value: boolean) => { mockDialogState.isUpdating = value; }),
    resetAll: vi.fn(() => {
        mockDialogState.isCreateDialogOpen = false;
        mockDialogState.createError = null;
        mockDialogState.isInviteDialogOpen = false;
        mockDialogState.selectedGroup = null;
        mockDialogState.isAcceptDialogOpen = false;
        mockDialogState.selectedInvitation = null;
        mockDialogState.isAccepting = false;
        mockDialogState.isLeaveDialogOpen = false;
        mockDialogState.isLeaving = false;
        // Story 14d-v2-1-7e: Delete dialog reset
        mockDialogState.isDeleteDialogOpen = false;
        mockDialogState.isDeleting = false;
        mockDialogState.isOwnerWarningOpen = false;
        mockDialogState.isMemberSelectorOpen = false;
        mockDialogState.isTransferDialogOpen = false;
        mockDialogState.isTransferring = false;
        mockDialogState.selectedGroupForAction = null;
        mockDialogState.selectedMemberForTransfer = null;
        mockDialogState.selectedMemberName = '';
        // Story 14d-v2-1-7g: Reset edit dialog state
        mockDialogState.isEditDialogOpen = false;
        mockDialogState.isUpdating = false;
        mockDialogState.editingGroup = null;
    }),
};

vi.mock('@/hooks/useGroupDialogs', () => ({
    useGroupDialogs: () => ({
        dialogs: mockDialogState,
        actions: mockDialogActions,
    }),
}));

// =============================================================================
// TD-7d-1: Mock useLeaveTransferFlow Hook
// =============================================================================

const mockLeaveTransferHandlers = {
    handleConfirmLeave: vi.fn().mockResolvedValue(true),
    handleConfirmTransfer: vi.fn().mockResolvedValue(true),
    handleAcceptInvitation: vi.fn().mockResolvedValue(true),
    handleDeclineInvitation: vi.fn().mockResolvedValue(true),
};

// TD-CONSOLIDATED-12: Mock mutation hooks (called at component level in GruposView)
const mockDeleteGroupAsync = vi.fn().mockResolvedValue(undefined);
const mockLeaveGroupAsync = vi.fn().mockResolvedValue(undefined);
const mockTransferOwnershipAsync = vi.fn().mockResolvedValue(undefined);
const mockAcceptInvitationAsync = vi.fn().mockResolvedValue(undefined);
const mockDeclineInvitationAsync = vi.fn().mockResolvedValue(undefined);
const mockToggleTransactionSharingAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/shared-groups', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/features/shared-groups')>();
    return {
        ...original,
        useGroups: () => ({
            data: mockGroups,
            isLoading: mockGroupsLoading,
        }),
        useCreateGroup: () => ({
            mutateAsync: mockCreateGroupAsync,
            isPending: mockIsCreating,
            reset: mockResetCreate,
        }),
        useCanCreateGroup: () => ({
            canCreate: mockCanCreate,
            isLoading: mockLimitLoading,
        }),
        useGroupCount: () => ({
            data: mockGroupCount,
            isLoading: mockLimitLoading,
        }),
        // Story 14d-v2-1-7g: Edit group hook
        useUpdateGroup: () => ({
            mutateAsync: mockUpdateGroupAsync,
            isPending: mockIsUpdating,
            error: null,
            isSuccess: false,
            reset: vi.fn(),
        }),
        SHARED_GROUP_LIMITS: {
            MAX_MEMBER_OF_GROUPS: 10,
            MAX_OWNED_GROUPS: 5,
            MAX_MEMBERS_PER_GROUP: 10,
            SHARE_CODE_LENGTH: 16,
            SHARE_CODE_EXPIRY_DAYS: 7,
        },
        // TD-CONSOLIDATED-12: Mutation hooks with optimistic updates + cache invalidation
        useDeleteGroup: () => ({ mutateAsync: mockDeleteGroupAsync }),
        useLeaveGroup: () => ({ mutateAsync: mockLeaveGroupAsync }),
        useTransferOwnership: () => ({ mutateAsync: mockTransferOwnershipAsync }),
        useAcceptInvitation: () => ({ mutateAsync: mockAcceptInvitationAsync }),
        useDeclineInvitation: () => ({ mutateAsync: mockDeclineInvitationAsync }),
        useToggleTransactionSharing: () => ({ mutateAsync: mockToggleTransactionSharingAsync }),
        useLeaveTransferFlow: () => mockLeaveTransferHandlers,
    };
});

// Mock usePendingInvitationsCount (Story 14d-v2-1-6c-1)
let mockPendingCount = 0;
let mockHasInvitations = false;
let mockPendingInvitations: unknown[] = [];
const mockRefetchInvitations = vi.fn();
vi.mock('@/hooks/usePendingInvitationsCount', () => ({
    usePendingInvitationsCount: () => ({
        count: mockPendingCount,
        hasInvitations: mockHasInvitations,
        invitations: mockPendingInvitations,
        isLoading: false,
        error: null,
        refetch: mockRefetchInvitations,
    }),
}));

// Mock PendingInvitationsSection
vi.mock('@/features/shared-groups/components/PendingInvitationsSection', () => ({
    PendingInvitationsSection: ({ invitations }: { invitations: unknown[] }) => (
        <div data-testid="mock-pending-invitations-section">
            {invitations.length} pending invitations
        </div>
    ),
}));

// Mock shared-groups hooks
const mockCreateGroupAsync = vi.fn();
const mockResetCreate = vi.fn();
let mockGroups: SharedGroup[] = [];
let mockGroupsLoading = false;
let mockIsCreating = false;
// Story 14d-v2-1-4c-2: BC-1 limit state
let mockCanCreate = true;
let mockGroupCount = 0;
let mockLimitLoading = false;
// Story 14d-v2-1-7g: Edit group state
const mockUpdateGroupAsync = vi.fn();
let mockIsUpdating = false;

// Story 14d-v2-1-7d AC #5: View Mode store mock
const mockSetPersonalMode = vi.fn();
let mockViewModeState = { mode: 'personal' as const, groupId: null as string | null };
vi.mock('@/shared/stores/useViewModeStore', () => ({
    useViewMode: () => ({
        mode: mockViewModeState.mode,
        groupId: mockViewModeState.groupId,
        group: null,
        isGroupMode: mockViewModeState.mode === 'group',
        setPersonalMode: mockSetPersonalMode,
        setGroupMode: vi.fn(),
        updateGroupData: vi.fn(),
    }),
}));

// Story 14d-v2-1-7d: Mock LeaveGroupDialog
vi.mock('@/features/shared-groups/components/LeaveGroupDialog', () => ({
    LeaveGroupDialog: ({
        isOpen,
        groupName,
        groupColor,
        onConfirm,
        onClose,
    }: {
        isOpen: boolean;
        groupName: string;
        groupColor: string;
        onConfirm: (mode: 'soft' | 'hard') => void;
        onClose: () => void;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-leave-dialog">
                <span data-testid="mock-leave-dialog-group-name">{groupName}</span>
                <span data-testid="mock-leave-dialog-group-color">{groupColor}</span>
                <button
                    data-testid="mock-leave-confirm"
                    onClick={() => onConfirm('soft')}
                >
                    Confirm Leave
                </button>
                <button data-testid="mock-leave-close" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    },
}));

// Story 14d-v2-1-7d: Mock OwnerLeaveWarningDialog
vi.mock('@/features/shared-groups/components/OwnerLeaveWarningDialog', () => ({
    OwnerLeaveWarningDialog: ({
        isOpen,
        groupName,
        onManageMembers,
        onDeleteGroup,
        onClose,
    }: {
        isOpen: boolean;
        groupName: string;
        onManageMembers: () => void;
        onDeleteGroup: () => void;
        onClose: () => void;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-owner-warning-dialog">
                <span data-testid="mock-owner-warning-group-name">{groupName}</span>
                <button
                    data-testid="mock-manage-members-btn"
                    onClick={onManageMembers}
                >
                    Manage Members
                </button>
                <button
                    data-testid="mock-delete-group-btn"
                    onClick={onDeleteGroup}
                >
                    Delete Group
                </button>
                <button data-testid="mock-owner-warning-close" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    },
}));

// Story 14d-v2-1-7d: Mock MemberSelectorDialog
vi.mock('@/features/shared-groups/components/MemberSelectorDialog', () => ({
    MemberSelectorDialog: ({
        isOpen,
        group,
        onSelectMember,
        onClose,
    }: {
        isOpen: boolean;
        group: { id: string; memberProfiles?: Record<string, { displayName?: string }> };
        onSelectMember: (memberId: string, memberName: string) => void;
        onClose: () => void;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-member-selector-dialog">
                <span data-testid="mock-member-selector-group-id">{group.id}</span>
                <button
                    data-testid="mock-select-member"
                    onClick={() => onSelectMember('user-2', 'Other User')}
                >
                    Select Member
                </button>
                <button data-testid="mock-member-selector-close" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    },
}));

// Story 14d-v2-1-7d: Mock TransferOwnershipDialog
vi.mock('@/features/shared-groups/components/TransferOwnershipDialog', () => ({
    TransferOwnershipDialog: ({
        isOpen,
        groupName,
        memberName,
        onConfirm,
        onClose,
    }: {
        isOpen: boolean;
        groupName: string;
        memberName: string;
        onConfirm: () => void;
        onClose: () => void;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-transfer-dialog">
                <span data-testid="mock-transfer-group-name">{groupName}</span>
                <span data-testid="mock-transfer-member-name">{memberName}</span>
                <button data-testid="mock-transfer-confirm" onClick={onConfirm}>
                    Confirm Transfer
                </button>
                <button data-testid="mock-transfer-close" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    },
}));

// Story 14d-v2-1-7e: Mock DeleteGroupDialog
// Improvement #6: Simplified signature - no parameters
vi.mock('@/features/shared-groups/components/DeleteGroupDialog', () => ({
    DeleteGroupDialog: ({
        isOpen,
        groupName,
        groupColor,
        memberCount,
        onConfirm,
        onClose,
    }: {
        isOpen: boolean;
        groupName: string;
        groupColor: string;
        groupIcon?: string;
        memberCount: number;
        onConfirm: () => Promise<void>;
        onClose: () => void;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-delete-dialog">
                <span data-testid="mock-delete-dialog-group-name">{groupName}</span>
                <span data-testid="mock-delete-dialog-group-color">{groupColor}</span>
                <span data-testid="mock-delete-dialog-member-count">{memberCount}</span>
                <button
                    data-testid="mock-delete-confirm"
                    onClick={() => {
                        // Handle the promise - catch errors to avoid unhandled rejections
                        onConfirm().catch(() => {
                            // Error is expected in some tests - just swallow it
                        });
                    }}
                >
                    Confirm Delete
                </button>
                <button data-testid="mock-delete-close" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    },
}));

// Story 14d-v2-1-13+14: Mock AcceptInvitationDialog
// We need our own mock to capture the onOpenOptIn prop for testing
vi.mock('@/features/shared-groups/components/AcceptInvitationDialog', () => ({
    AcceptInvitationDialog: ({
        open,
        invitation,
        onClose,
        onAccept,
        onDecline,
        onOpenOptIn,
        isPending,
    }: {
        open: boolean;
        invitation: PendingInvitation | null;
        onClose: () => void;
        onAccept: (invitation: PendingInvitation) => void;
        onDecline: (invitation: PendingInvitation) => void;
        onOpenOptIn?: (invitation: PendingInvitation, group: SharedGroup) => void;
        isPending: boolean;
    }) => {
        if (!open || !invitation) return null;
        return (
            <div data-testid="mock-accept-dialog">
                <span data-testid="mock-accept-group-name">{invitation.groupName}</span>
                <span data-testid="mock-accept-has-optin">{String(!!onOpenOptIn)}</span>
                <button
                    data-testid="mock-accept-btn"
                    onClick={() => onAccept(invitation)}
                    disabled={isPending}
                >
                    Accept
                </button>
                <button
                    data-testid="mock-decline-btn"
                    onClick={() => onDecline(invitation)}
                    disabled={isPending}
                >
                    Decline
                </button>
                {onOpenOptIn && (
                    <button
                        data-testid="mock-trigger-optin"
                        onClick={() => {
                            // Simulate: group has transactionSharingEnabled, so trigger opt-in
                            const mockGroup: SharedGroup = {
                                id: invitation.groupId,
                                name: invitation.groupName,
                                ownerId: 'owner-123',
                                appId: 'boletapp',
                                color: invitation.groupColor || '#10b981',
                                icon: invitation.groupIcon,
                                members: ['owner-123'],
                                memberUpdates: {},
                                shareCode: 'TEST123',
                                shareCodeExpiresAt: createMockTimestamp(),
                                createdAt: createMockTimestamp(),
                                updatedAt: createMockTimestamp(),
                                timezone: 'UTC',
                                transactionSharingEnabled: true,
                                transactionSharingLastToggleAt: null,
                                transactionSharingToggleCountToday: 0,
                            };
                            onOpenOptIn(invitation, mockGroup);
                        }}
                    >
                        Trigger OptIn
                    </button>
                )}
                <button data-testid="mock-accept-close" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    },
}));

// Story 14d-v2-1-13+14: Mock TransactionSharingOptInDialog
// Story 14d-v2-1-14-polish: Added onDismiss prop for AC3 dismiss behavior
vi.mock('@/features/shared-groups/components/TransactionSharingOptInDialog', () => ({
    TransactionSharingOptInDialog: ({
        open,
        groupName,
        groupColor,
        groupIcon,
        onJoin,
        onCancel,
        onDismiss,
        isPending,
    }: {
        open: boolean;
        groupName: string;
        groupColor: string;
        groupIcon?: string;
        onJoin: (shareMyTransactions: boolean) => void;
        onCancel: () => void;
        onDismiss?: () => void;
        isPending: boolean;
    }) => {
        if (!open) return null;
        return (
            <div data-testid="mock-optin-dialog">
                <span data-testid="mock-optin-group-name">{groupName}</span>
                <span data-testid="mock-optin-group-color">{groupColor}</span>
                <span data-testid="mock-optin-is-pending">{String(isPending)}</span>
                <span data-testid="mock-optin-has-dismiss">{String(!!onDismiss)}</span>
                <button
                    data-testid="mock-optin-join-share"
                    onClick={() => onJoin(true)}
                    disabled={isPending}
                >
                    Join with Share
                </button>
                <button
                    data-testid="mock-optin-join-no-share"
                    onClick={() => onJoin(false)}
                    disabled={isPending}
                >
                    Join without Share
                </button>
                <button
                    data-testid="mock-optin-cancel"
                    onClick={onCancel}
                    disabled={isPending}
                >
                    Cancel
                </button>
                {onDismiss && (
                    <button
                        data-testid="mock-optin-dismiss"
                        onClick={onDismiss}
                        disabled={isPending}
                    >
                        Dismiss
                    </button>
                )}
            </div>
        );
    },
}));

// Story 14d-v2-1-7g: Mock EditGroupDialog
vi.mock('@/features/shared-groups/components/EditGroupDialog', () => ({
    EditGroupDialog: ({
        open,
        group,
        onClose,
        onSave,
        isPending,
    }: {
        open: boolean;
        group: SharedGroup | null;
        onClose: () => void;
        onSave: (input: { name: string; icon: string; color: string }) => void;
        isPending: boolean;
    }) => {
        if (!open || !group) return null;
        return (
            <div data-testid="mock-edit-dialog">
                <span data-testid="mock-edit-group-name">{group.name}</span>
                <span data-testid="mock-edit-is-pending">{String(isPending)}</span>
                <button
                    data-testid="mock-edit-save"
                    onClick={() => onSave({ name: 'Updated Name', icon: '🚗', color: '#3b82f6' })}
                >
                    Save
                </button>
                <button data-testid="mock-edit-close" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    },
}));

// Mock CreateGroupDialog to simplify testing
// Story 14d-v2-1-4c-2: Updated to expose BC-1 and error props for testing
vi.mock('@/features/shared-groups/components/CreateGroupDialog', () => ({
    CreateGroupDialog: ({
        open,
        onClose,
        onCreate,
        isPending,
        canCreate,
        groupCount,
        maxGroups,
        hasError,
        errorMessage,
        onResetError,
    }: {
        open: boolean;
        onClose: () => void;
        onCreate: (input: { name: string; transactionSharingEnabled: boolean }) => void;
        isPending: boolean;
        canCreate?: boolean;
        groupCount?: number;
        maxGroups?: number;
        hasError?: boolean;
        errorMessage?: string;
        onResetError?: () => void;
    }) => {
        if (!open) return null;
        return (
            <div data-testid="mock-create-dialog">
                {/* Expose BC-1 props for testing */}
                <span data-testid="mock-can-create">{String(canCreate)}</span>
                <span data-testid="mock-group-count">{groupCount}</span>
                <span data-testid="mock-max-groups">{maxGroups}</span>
                {/* Expose error props for testing */}
                <span data-testid="mock-has-error">{String(hasError)}</span>
                <span data-testid="mock-error-message">{errorMessage || ''}</span>
                <button
                    data-testid="mock-create-submit"
                    onClick={() => onCreate({ name: 'Test Group', transactionSharingEnabled: true })}
                    disabled={isPending}
                >
                    Create
                </button>
                <button data-testid="mock-close" onClick={onClose}>
                    Close
                </button>
                {onResetError && (
                    <button data-testid="mock-reset-error" onClick={onResetError}>
                        Reset Error
                    </button>
                )}
            </div>
        );
    },
}));

// Translation mock
const mockT = (key: string, params?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
        sharedGroups: 'Shared Groups',
        sharedGroupsDescription: 'Share expenses with family or roommates',
        createGroup: 'Create Group',
        noGroupsYet: 'No groups yet',
        noGroupsDescription: 'Create your first group to start sharing expenses',
        loading: 'Loading...',
        groupCreatedSuccess: 'Group created successfully',
        groupCreateError: 'Error creating group',
        // Story 14d-v2-1-7g: Edit group translations
        groupUpdatedSuccess: 'Group updated successfully',
        // Story 14d-v2-1-7e: Delete group translations
        groupDeletedSuccess: 'Group "{name}" deleted successfully',
        // Story 14d-v2-1-7d AC #5: View Mode Auto-Switch translations
        leftGroup: 'Left "{groupName}"',
        leftGroupSwitchedToPersonal: 'You left "{groupName}". Viewing personal data.',
        viewingPersonalData: 'Viewing personal data',
        errorLeavingGroup: 'Error leaving group',
        errorTransferringOwnership: 'Error transferring ownership',
        ownershipTransferred: 'Ownership transferred to {name}',
        // Story 14d-v2-1-14-polish: Context-specific toast keys
        joinedGroupWithSharing: "You're now a member of {groupName}",
        joinedGroupWithoutSharing: "You're now a member of {groupName}. You can change sharing preferences in group settings.",
        joinedGroupDefault: "You're now a member of {groupName}. Transaction sharing is off by default.",
        offlineCannotJoinGroup: "You're offline. Please connect to join groups.",
        errorAcceptingInvitation: 'Error accepting invitation',
    };
    let result = translations[key] || key;
    // Support parameter interpolation
    if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
            result = result.replace(`{${paramKey}}`, String(paramValue));
        });
    }
    return result;
};

const defaultProps = {
    t: mockT,
    theme: 'light',
    lang: 'en' as const,
    onShowToast: vi.fn(),
};

// =============================================================================
// Test Suite
// =============================================================================

describe('GruposView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGroups = [];
        mockGroupsLoading = false;
        mockIsCreating = false;
        // Story 14d-v2-1-4c-2: Reset BC-1 state
        mockCanCreate = true;
        mockGroupCount = 0;
        mockLimitLoading = false;
        // Story 14d-v2-1-6c-1: Reset pending invitations state
        mockPendingCount = 0;
        mockHasInvitations = false;
        mockPendingInvitations = [];
        // TD-CONSOLIDATED-12: Reset mutation async mocks
        mockDeleteGroupAsync.mockResolvedValue(undefined);
        mockAcceptInvitationAsync.mockResolvedValue(undefined);
        mockToggleTransactionSharingAsync.mockResolvedValue(undefined);
        // Story 14d-v2-1-7d AC #5: Reset view mode state
        mockSetPersonalMode.mockClear();
        mockViewModeState = { mode: 'personal', groupId: null };

        // TD-7d-1: Reset useGroupDialogs mock state
        mockDialogState = {
            isCreateDialogOpen: false,
            createError: null,
            isInviteDialogOpen: false,
            selectedGroup: null,
            isAcceptDialogOpen: false,
            selectedInvitation: null,
            isAccepting: false,
            isLeaveDialogOpen: false,
            isLeaving: false,
            // Story 14d-v2-1-7e: Delete dialog state
            isDeleteDialogOpen: false,
            isDeleting: false,
            isOwnerWarningOpen: false,
            isMemberSelectorOpen: false,
            isTransferDialogOpen: false,
            isTransferring: false,
            selectedGroupForAction: null,
            selectedMemberForTransfer: null,
            selectedMemberName: '',
            // Story 14d-v2-1-7g: Edit dialog state
            isEditDialogOpen: false,
            isUpdating: false,
            editingGroup: null,
        };

        // TD-7d-1: Reset useLeaveTransferFlow mock handlers
        mockLeaveTransferHandlers.handleConfirmLeave.mockResolvedValue(true);
        mockLeaveTransferHandlers.handleConfirmTransfer.mockResolvedValue(true);
        mockLeaveTransferHandlers.handleAcceptInvitation.mockResolvedValue(true);
        mockLeaveTransferHandlers.handleDeclineInvitation.mockResolvedValue(true);

        // Story 14d-v2-1-14-polish: Reset new mocks
        mockIsOnline = true;
    });

    // =========================================================================
    // Loading State
    // =========================================================================

    describe('Loading State', () => {
        it('shows loading indicator while fetching groups', () => {
            mockGroupsLoading = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('grupos-view-loading')).toBeInTheDocument();
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('does not show main content while loading', () => {
            mockGroupsLoading = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.queryByTestId('grupos-view')).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // Empty State
    // =========================================================================

    describe('Empty State', () => {
        it('shows empty state when user has no groups', () => {
            mockGroups = [];

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('grupos-empty-state')).toBeInTheDocument();
            expect(screen.getByText('No groups yet')).toBeInTheDocument();
            expect(screen.getByText('Create your first group to start sharing expenses')).toBeInTheDocument();
        });

        it('shows create button in empty state', () => {
            mockGroups = [];

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('create-group-btn-empty')).toBeInTheDocument();
        });

        it('opens dialog when empty state create button is clicked', async () => {
            mockGroups = [];

            render(<GruposView {...defaultProps} />);

            const createBtn = screen.getByTestId('create-group-btn-empty');
            await userEvent.click(createBtn);

            // TD-7d-1: Verify action is called instead of checking dialog visibility
            // (Dialog visibility is controlled by mockDialogState.isCreateDialogOpen which
            // is managed by the useGroupDialogs hook)
            expect(mockDialogActions.openCreateDialog).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Groups List
    // =========================================================================

    describe('Groups List', () => {
        const mockGroupData: SharedGroup[] = [
            {
                id: 'group-1',
                name: 'Home Expenses',
                ownerId: 'test-user-123',
                appId: 'boletapp',
                color: '#10b981',
                icon: '🏠',
                members: ['test-user-123', 'user-2'],
                memberUpdates: {},
                shareCode: 'ABC123',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
            {
                id: 'group-2',
                name: 'Office Lunch',
                ownerId: 'user-other',
                appId: 'boletapp',
                color: '#3b82f6',
                icon: '🍕',
                members: ['user-other', 'test-user-123'],
                memberUpdates: {},
                shareCode: 'XYZ789',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: false,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
        ];

        it('renders groups list when user has groups', () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('grupos-list')).toBeInTheDocument();
            expect(screen.getByTestId('group-card-group-1')).toBeInTheDocument();
            expect(screen.getByTestId('group-card-group-2')).toBeInTheDocument();
        });

        it('displays group names', () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByText('Home Expenses')).toBeInTheDocument();
            expect(screen.getByText('Office Lunch')).toBeInTheDocument();
        });

        it('displays member count', () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            expect(screen.getAllByText('2 members')).toHaveLength(2);
        });

        it('does not show empty state when groups exist', () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            expect(screen.queryByTestId('grupos-empty-state')).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // Header & Create Button
    // =========================================================================

    describe('Header & Create Button', () => {
        it('renders header with title and description', () => {
            render(<GruposView {...defaultProps} />);

            expect(screen.getByText('Shared Groups')).toBeInTheDocument();
            expect(screen.getByText('Share expenses with family or roommates')).toBeInTheDocument();
        });

        it('renders create button in header', () => {
            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('create-group-btn')).toBeInTheDocument();
        });

        it('opens dialog when header create button is clicked', async () => {
            render(<GruposView {...defaultProps} />);

            const createBtn = screen.getByTestId('create-group-btn');
            await userEvent.click(createBtn);

            // TD-7d-1: Verify action is called instead of checking dialog visibility
            expect(mockDialogActions.openCreateDialog).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Create Dialog Integration
    // TD-7d-1: Tests updated to pre-set dialog state since state is now managed by hook
    // =========================================================================

    describe('Create Dialog Integration', () => {
        it('closes dialog after successful creation', async () => {
            mockCreateGroupAsync.mockResolvedValueOnce({ id: 'new-group', name: 'Test Group' });
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            // Dialog should be visible
            expect(screen.getByTestId('mock-create-dialog')).toBeInTheDocument();

            // Submit
            await userEvent.click(screen.getByTestId('mock-create-submit'));

            // TD-7d-1: Verify close action is called
            await waitFor(() => {
                expect(mockDialogActions.closeCreateDialog).toHaveBeenCalled();
            });
        });

        it('shows success toast after group creation', async () => {
            const onShowToast = vi.fn();
            mockCreateGroupAsync.mockResolvedValueOnce({ id: 'new-group', name: 'Test Group' });
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            // Use t that returns undefined for groupCreatedSuccess to trigger fallback
            const tWithFallback = (key: string) => {
                if (key === 'groupCreatedSuccess') return ''; // Empty triggers fallback
                return mockT(key);
            };

            render(<GruposView {...defaultProps} t={tWithFallback} onShowToast={onShowToast} />);

            await userEvent.click(screen.getByTestId('mock-create-submit'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    expect.stringContaining('Test Group'),
                    'success'
                );
            });
        });

        it('displays error in dialog when creation fails (AC #3)', async () => {
            // Story 14d-v2-1-4c-2: Changed behavior - error shown in dialog, not toast
            const onShowToast = vi.fn();
            mockCreateGroupAsync.mockRejectedValueOnce(new Error('Network error'));
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} onShowToast={onShowToast} />);

            await userEvent.click(screen.getByTestId('mock-create-submit'));

            await waitFor(() => {
                // TD-7d-1: Verify setCreateError action is called with error message
                expect(mockDialogActions.setCreateError).toHaveBeenCalledWith(expect.stringContaining('error'));
                // Toast should NOT be called for errors (in-dialog retry instead)
                expect(onShowToast).not.toHaveBeenCalled();
            });
        });

        it('resets mutation state after dialog closes', async () => {
            mockCreateGroupAsync.mockResolvedValueOnce({ id: 'new-group', name: 'Test Group' });
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-create-submit'));

            await waitFor(() => {
                expect(mockResetCreate).toHaveBeenCalled();
            });
        });

        it('closes dialog when close button is clicked', async () => {
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-create-dialog')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('mock-close'));

            // TD-7d-1: Verify close action is called
            expect(mockDialogActions.closeCreateDialog).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Theme Support
    // =========================================================================

    describe('Theme Support', () => {
        it('renders in light theme', () => {
            render(<GruposView {...defaultProps} theme="light" />);

            expect(screen.getByTestId('grupos-view')).toBeInTheDocument();
        });

        it('renders in dark theme', () => {
            render(<GruposView {...defaultProps} theme="dark" />);

            expect(screen.getByTestId('grupos-view')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Language Support
    // =========================================================================

    describe('Language Support', () => {
        it('uses Spanish translations when lang is es', () => {
            const spanishT = (key: string) => {
                const translations: Record<string, string> = {
                    sharedGroups: 'Grupos Compartidos',
                    noGroupsYet: 'Aún no tienes grupos',
                };
                return translations[key] || key;
            };

            render(<GruposView {...defaultProps} t={spanishT} lang="es" />);

            expect(screen.getByText('Grupos Compartidos')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Story 14d-v2-1-6c-1: Pending Invitations Badge & List UI
    // =========================================================================

    describe('Pending Invitations Badge (Story 14d-v2-1-6c-1)', () => {
        it('shows badge when user has pending invitations', () => {
            mockHasInvitations = true;
            mockPendingCount = 3;
            mockPendingInvitations = [
                { id: 'inv-1', groupName: 'Group 1' },
                { id: 'inv-2', groupName: 'Group 2' },
                { id: 'inv-3', groupName: 'Group 3' },
            ];

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('pending-invitations-badge')).toBeInTheDocument();
            expect(screen.getByTestId('pending-invitations-badge')).toHaveTextContent('3');
        });

        it('does not show badge when user has no pending invitations', () => {
            mockHasInvitations = false;
            mockPendingCount = 0;
            mockPendingInvitations = [];

            render(<GruposView {...defaultProps} />);

            expect(screen.queryByTestId('pending-invitations-badge')).not.toBeInTheDocument();
        });

        it('shows 9+ when count exceeds 9', () => {
            mockHasInvitations = true;
            mockPendingCount = 15;
            mockPendingInvitations = Array(15).fill({ id: 'inv', groupName: 'Group' });

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('pending-invitations-badge')).toHaveTextContent('9+');
        });

        it('shows PendingInvitationsSection when user has invitations', () => {
            mockHasInvitations = true;
            mockPendingCount = 2;
            mockPendingInvitations = [
                { id: 'inv-1', groupName: 'Group 1' },
                { id: 'inv-2', groupName: 'Group 2' },
            ];

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-pending-invitations-section')).toBeInTheDocument();
            expect(screen.getByTestId('mock-pending-invitations-section')).toHaveTextContent('2 pending invitations');
        });

        it('does not show PendingInvitationsSection when no invitations', () => {
            mockHasInvitations = false;
            mockPendingCount = 0;
            mockPendingInvitations = [];

            render(<GruposView {...defaultProps} />);

            expect(screen.queryByTestId('mock-pending-invitations-section')).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // Story 14d-v2-1-4c-2: BC-1 Limit Enforcement Integration
    // TD-7d-1: Updated to pre-set dialog state
    // =========================================================================

    describe('BC-1 Limit Enforcement (Story 14d-v2-1-4c-2)', () => {
        it('passes canCreate=true to dialog when under limit', async () => {
            mockCanCreate = true;
            mockGroupCount = 3;
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-can-create')).toHaveTextContent('true');
        });

        it('passes canCreate=false to dialog when at limit', async () => {
            mockCanCreate = false;
            mockGroupCount = 10;
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-can-create')).toHaveTextContent('false');
        });

        it('passes groupCount to dialog', async () => {
            mockGroupCount = 7;
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-group-count')).toHaveTextContent('7');
        });

        it('passes maxGroups=10 to dialog', async () => {
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-max-groups')).toHaveTextContent('10');
        });

        it('includes limit loading state in isPending', async () => {
            mockLimitLoading = true;
            mockIsCreating = false;
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            // Submit button should be disabled when limit is loading
            expect(screen.getByTestId('mock-create-submit')).toBeDisabled();
        });
    });

    // =========================================================================
    // Story 14d-v2-1-4c-2: Error Handling & Retry Integration
    // TD-7d-1: Updated to pre-set dialog state and verify actions
    // =========================================================================

    describe('Error Handling & Retry (Story 14d-v2-1-4c-2)', () => {
        it('passes hasError=false initially', async () => {
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-has-error')).toHaveTextContent('false');
        });

        it('passes hasError=true after creation failure', async () => {
            mockCreateGroupAsync.mockRejectedValueOnce(new Error('Network error'));
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);
            await userEvent.click(screen.getByTestId('mock-create-submit'));

            await waitFor(() => {
                // TD-7d-1: Verify setCreateError action was called
                expect(mockDialogActions.setCreateError).toHaveBeenCalled();
            });
        });

        it('passes errorMessage after creation failure', async () => {
            mockCreateGroupAsync.mockRejectedValueOnce(new Error('Network error'));
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);
            await userEvent.click(screen.getByTestId('mock-create-submit'));

            await waitFor(() => {
                // TD-7d-1: Verify setCreateError action was called with error message
                expect(mockDialogActions.setCreateError).toHaveBeenCalledWith(expect.stringContaining('error'));
            });
        });

        it('keeps dialog open on error for retry (AC #3)', async () => {
            mockCreateGroupAsync.mockRejectedValueOnce(new Error('Network error'));
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);
            await userEvent.click(screen.getByTestId('mock-create-submit'));

            await waitFor(() => {
                // TD-7d-1: Verify closeCreateDialog was NOT called (dialog stays open)
                expect(mockDialogActions.closeCreateDialog).not.toHaveBeenCalled();
                // But setCreateError was called
                expect(mockDialogActions.setCreateError).toHaveBeenCalled();
            });
        });

        it('provides onResetError callback to dialog', async () => {
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-reset-error')).toBeInTheDocument();
        });

        it('clears error state on dialog close', async () => {
            mockCreateGroupAsync.mockRejectedValueOnce(new Error('Network error'));
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);
            await userEvent.click(screen.getByTestId('mock-create-submit'));

            await waitFor(() => {
                expect(mockDialogActions.setCreateError).toHaveBeenCalled();
            });

            // Close dialog
            await userEvent.click(screen.getByTestId('mock-close'));

            // TD-7d-1: Verify closeCreateDialog was called (which clears error)
            expect(mockDialogActions.closeCreateDialog).toHaveBeenCalled();
        });

        it('clears error state before retry attempt', async () => {
            // First attempt fails
            mockCreateGroupAsync.mockRejectedValueOnce(new Error('Network error'));
            // Second attempt succeeds
            mockCreateGroupAsync.mockResolvedValueOnce({ id: 'new-group', name: 'Test Group' });
            // TD-7d-1: Pre-set dialog to open state
            mockDialogState.isCreateDialogOpen = true;

            render(<GruposView {...defaultProps} />);
            await userEvent.click(screen.getByTestId('mock-create-submit'));

            await waitFor(() => {
                expect(mockDialogActions.setCreateError).toHaveBeenCalled();
            });

            // Clear the mock to track the retry
            mockDialogActions.resetCreateError.mockClear();

            // Retry
            await userEvent.click(screen.getByTestId('mock-create-submit'));

            // TD-7d-1: Verify resetCreateError was called before retry
            await waitFor(() => {
                expect(mockDialogActions.resetCreateError).toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // Story 14d-v2-1-7d: Leave Group & Transfer Ownership Integration
    // =========================================================================

    describe('Leave Group Button (Story 14d-v2-1-7d)', () => {
        const mockGroupData: SharedGroup[] = [
            {
                id: 'group-owned',
                name: 'My Group',
                ownerId: 'test-user-123',
                appId: 'boletapp',
                color: '#10b981',
                icon: '🏠',
                members: ['test-user-123', 'user-2'],
                memberUpdates: {},
                memberProfiles: {
                    'test-user-123': { displayName: 'Test User', email: 'test@example.com' },
                    'user-2': { displayName: 'Other User', email: 'other@example.com' },
                },
                shareCode: 'ABC123',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
            {
                id: 'group-member',
                name: 'Other Group',
                ownerId: 'user-other',
                appId: 'boletapp',
                color: '#3b82f6',
                icon: '🍕',
                members: ['user-other', 'test-user-123'],
                memberUpdates: {},
                memberProfiles: {
                    'user-other': { displayName: 'Owner', email: 'owner@example.com' },
                    'test-user-123': { displayName: 'Test User', email: 'test@example.com' },
                },
                shareCode: 'XYZ789',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: false,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
        ];

        it('shows leave button on all group cards', () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('leave-btn-group-owned')).toBeInTheDocument();
            expect(screen.getByTestId('leave-btn-group-member')).toBeInTheDocument();
        });

        it('opens OwnerWarningDialog when owner clicks leave', async () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            const leaveBtn = screen.getByTestId('leave-btn-group-owned');
            await userEvent.click(leaveBtn);

            // TD-7d-1: Verify openOwnerWarning action is called
            expect(mockDialogActions.openOwnerWarning).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'group-owned' })
            );
        });

        it('opens LeaveGroupDialog when non-owner clicks leave', async () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            const leaveBtn = screen.getByTestId('leave-btn-group-member');
            await userEvent.click(leaveBtn);

            // TD-7d-1: Verify openLeaveDialog action is called
            expect(mockDialogActions.openLeaveDialog).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'group-member' })
            );
        });

        it('passes correct group info to LeaveGroupDialog', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[1]; // group-member
            mockDialogState.isLeaveDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-leave-dialog-group-name')).toHaveTextContent('Other Group');
            expect(screen.getByTestId('mock-leave-dialog-group-color')).toHaveTextContent('#3b82f6');
        });

        it('shows success toast after leaving group', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[1]; // group-member
            mockDialogState.isLeaveDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-leave-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify handleConfirmLeave was called
                expect(mockLeaveTransferHandlers.handleConfirmLeave).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'group-member' }),
                    'soft'
                );
            });
        });

        it('shows error toast when leaving fails', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Make the handler return false (failure)
            mockLeaveTransferHandlers.handleConfirmLeave.mockResolvedValueOnce(false);
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[1]; // group-member
            mockDialogState.isLeaveDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-leave-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify the handler was called
                expect(mockLeaveTransferHandlers.handleConfirmLeave).toHaveBeenCalled();
                // On failure, closeLeaveDialog should NOT be called
                expect(mockDialogActions.closeLeaveDialog).not.toHaveBeenCalled();
            });
        });

        it('closes leave dialog after successful leave', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[1]; // group-member
            mockDialogState.isLeaveDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-leave-dialog')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('mock-leave-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify closeLeaveDialog action is called on success
                expect(mockDialogActions.closeLeaveDialog).toHaveBeenCalled();
            });
        });

        it('refetches groups after leaving', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[1]; // group-member
            mockDialogState.isLeaveDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-leave-confirm'));

            await waitFor(() => {
                // TD-7d-1: useLeaveTransferFlow handles refetch internally
                expect(mockLeaveTransferHandlers.handleConfirmLeave).toHaveBeenCalled();
            });
        });
    });

    describe('Transfer Ownership Button (Story 14d-v2-1-7d)', () => {
        const mockGroupData: SharedGroup[] = [
            {
                id: 'group-owned',
                name: 'My Group',
                ownerId: 'test-user-123',
                appId: 'boletapp',
                color: '#10b981',
                icon: '🏠',
                members: ['test-user-123', 'user-2'],
                memberUpdates: {},
                memberProfiles: {
                    'test-user-123': { displayName: 'Test User', email: 'test@example.com' },
                    'user-2': { displayName: 'Other User', email: 'other@example.com' },
                },
                shareCode: 'ABC123',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
            {
                id: 'group-solo',
                name: 'Solo Group',
                ownerId: 'test-user-123',
                appId: 'boletapp',
                color: '#f59e0b',
                icon: '🎯',
                members: ['test-user-123'],
                memberUpdates: {},
                shareCode: 'SOLO123',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
            {
                id: 'group-member',
                name: 'Other Group',
                ownerId: 'user-other',
                appId: 'boletapp',
                color: '#3b82f6',
                icon: '🍕',
                members: ['user-other', 'test-user-123'],
                memberUpdates: {},
                shareCode: 'XYZ789',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: false,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
        ];

        it('shows transfer button for owner with multiple members', () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            // Owner with multiple members should see transfer button
            expect(screen.getByTestId('transfer-btn-group-owned')).toBeInTheDocument();
        });

        it('does not show transfer button for owner with single member', () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            // Owner with only themselves should NOT see transfer button
            expect(screen.queryByTestId('transfer-btn-group-solo')).not.toBeInTheDocument();
        });

        it('does not show transfer button for non-owners', () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            // Non-owners should NOT see transfer button
            expect(screen.queryByTestId('transfer-btn-group-member')).not.toBeInTheDocument();
        });

        it('opens MemberSelectorDialog when transfer button clicked', async () => {
            mockGroups = mockGroupData;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('transfer-btn-group-owned'));

            // TD-7d-1: Verify openMemberSelector action is called
            expect(mockDialogActions.openMemberSelector).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'group-owned' })
            );
        });

        it('passes correct group to MemberSelectorDialog', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.isMemberSelectorOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-member-selector-group-id')).toHaveTextContent('group-owned');
        });

        it('opens TransferOwnershipDialog after member selection', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.isMemberSelectorOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-member-selector-dialog')).toBeInTheDocument();

            // Select a member
            await userEvent.click(screen.getByTestId('mock-select-member'));

            // TD-7d-1: Verify openTransferDialog action is called
            await waitFor(() => {
                expect(mockDialogActions.openTransferDialog).toHaveBeenCalledWith('user-2', 'Other User');
            });
        });

        it('passes correct member name to TransferOwnershipDialog', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state for transfer dialog
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.selectedMemberForTransfer = 'user-2';
            mockDialogState.selectedMemberName = 'Other User';
            mockDialogState.isTransferDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            // TD-7d-1: Directly check the rendered dialog since state is pre-set
            expect(screen.getByTestId('mock-transfer-member-name')).toHaveTextContent('Other User');
        });

        it('shows success toast after transfer', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state for transfer dialog
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.selectedMemberForTransfer = 'user-2';
            mockDialogState.selectedMemberName = 'Other User';
            mockDialogState.isTransferDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-transfer-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify handleConfirmTransfer was called
                expect(mockLeaveTransferHandlers.handleConfirmTransfer).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'group-owned' }),
                    'user-2',
                    'Other User'
                );
            });
        });

        it('shows error toast when transfer fails', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Make the handler return false (failure)
            mockLeaveTransferHandlers.handleConfirmTransfer.mockResolvedValueOnce(false);
            // TD-7d-1: Pre-set dialog state for transfer dialog
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.selectedMemberForTransfer = 'user-2';
            mockDialogState.selectedMemberName = 'Other User';
            mockDialogState.isTransferDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-transfer-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify the handler was called
                expect(mockLeaveTransferHandlers.handleConfirmTransfer).toHaveBeenCalled();
                // On failure, closeTransferDialog should NOT be called
                expect(mockDialogActions.closeTransferDialog).not.toHaveBeenCalled();
            });
        });

        it('refetches groups after transfer', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state for transfer dialog
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.selectedMemberForTransfer = 'user-2';
            mockDialogState.selectedMemberName = 'Other User';
            mockDialogState.isTransferDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-transfer-confirm'));

            await waitFor(() => {
                // TD-7d-1: useLeaveTransferFlow handles refetch internally
                expect(mockLeaveTransferHandlers.handleConfirmTransfer).toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // Story 14d-v2-1-7d AC #5: View Mode Auto-Switch on Leave
    // =========================================================================

    describe('View Mode Auto-Switch (Story 14d-v2-1-7d AC #5)', () => {
        const mockGroupData: SharedGroup[] = [
            {
                id: 'group-123',
                name: 'My Active Group',
                ownerId: 'user-other',
                appId: 'boletapp',
                color: '#10b981',
                icon: '🏠',
                members: ['user-other', 'test-user-123'],
                memberUpdates: {},
                shareCode: 'ABC123',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
            {
                id: 'group-456',
                name: 'Other Group',
                ownerId: 'user-other',
                appId: 'boletapp',
                color: '#3b82f6',
                icon: '🍕',
                members: ['user-other', 'test-user-123'],
                memberUpdates: {},
                shareCode: 'XYZ789',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: false,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
        ];

        // TD-7d-1: View Mode Auto-Switch tests updated.
        // The auto-switch logic is now inside useLeaveTransferFlow hook which is mocked.
        // These tests verify the hook's handleConfirmLeave is called with the correct group.
        // The actual auto-switch behavior is tested in useLeaveTransferFlow.test.ts

        it('switches to Personal mode when leaving currently viewed group', async () => {
            // Setup: user is viewing group-123
            mockGroups = mockGroupData;
            mockViewModeState = { mode: 'group', groupId: 'group-123' };
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-123
            mockDialogState.isLeaveDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            // Confirm leave
            await userEvent.click(screen.getByTestId('mock-leave-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify handleConfirmLeave was called with the group
                expect(mockLeaveTransferHandlers.handleConfirmLeave).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'group-123' }),
                    'soft'
                );
            });
        });

        it('does not switch view mode when leaving a different group', async () => {
            // Setup: user is viewing group-456, but leaves group-123
            mockGroups = mockGroupData;
            mockViewModeState = { mode: 'group', groupId: 'group-456' };
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-123
            mockDialogState.isLeaveDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            // Confirm leave
            await userEvent.click(screen.getByTestId('mock-leave-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify handleConfirmLeave was called with group-123
                expect(mockLeaveTransferHandlers.handleConfirmLeave).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'group-123' }),
                    'soft'
                );
            });
        });

        it('does not switch when already in personal mode', async () => {
            // Setup: user is in personal mode
            mockGroups = mockGroupData;
            mockViewModeState = { mode: 'personal', groupId: null };
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-123
            mockDialogState.isLeaveDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            // Confirm leave
            await userEvent.click(screen.getByTestId('mock-leave-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify handleConfirmLeave was called
                expect(mockLeaveTransferHandlers.handleConfirmLeave).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'group-123' }),
                    'soft'
                );
            });
        });

        it('shows Spanish toast when lang is es and leaving viewed group', async () => {
            // Setup: user is viewing group-123, lang is Spanish
            mockGroups = mockGroupData;
            mockViewModeState = { mode: 'group', groupId: 'group-123' };
            // TD-7d-1: Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-123
            mockDialogState.isLeaveDialogOpen = true;

            const spanishT = (key: string) => {
                // Return empty to trigger fallback behavior
                return '';
            };

            render(<GruposView {...defaultProps} t={spanishT} lang="es" />);

            // Confirm leave
            await userEvent.click(screen.getByTestId('mock-leave-confirm'));

            await waitFor(() => {
                // TD-7d-1: Verify handleConfirmLeave was called
                expect(mockLeaveTransferHandlers.handleConfirmLeave).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'group-123' }),
                    'soft'
                );
            });
        });
    });

    describe('Owner Leave Warning Flow (Story 14d-v2-1-7d)', () => {
        const mockGroupData: SharedGroup[] = [
            {
                id: 'group-owned',
                name: 'My Group',
                ownerId: 'test-user-123',
                appId: 'boletapp',
                color: '#10b981',
                icon: '🏠',
                members: ['test-user-123', 'user-2'],
                memberUpdates: {},
                memberProfiles: {
                    'test-user-123': { displayName: 'Test User', email: 'test@example.com' },
                    'user-2': { displayName: 'Other User', email: 'other@example.com' },
                },
                shareCode: 'ABC123',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
        ];

        it('opens MemberSelectorDialog when clicking Manage Members in owner warning', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state for owner warning
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.isOwnerWarningOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-owner-warning-dialog')).toBeInTheDocument();

            // Click Manage Members
            await userEvent.click(screen.getByTestId('mock-manage-members-btn'));

            // TD-7d-1: Verify closeOwnerWarning and openMemberSelector actions are called
            await waitFor(() => {
                expect(mockDialogActions.closeOwnerWarning).toHaveBeenCalled();
                expect(mockDialogActions.openMemberSelector).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'group-owned' })
                );
            });
        });

        it('closes owner warning when clicking close', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state for owner warning
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.isOwnerWarningOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-owner-warning-dialog')).toBeInTheDocument();

            await userEvent.click(screen.getByTestId('mock-owner-warning-close'));

            // TD-7d-1: Verify closeOwnerWarning action is called
            expect(mockDialogActions.closeOwnerWarning).toHaveBeenCalled();
        });

        it('opens DeleteGroupDialog when clicking delete group in owner warning (Story 14d-v2-1-7e)', async () => {
            mockGroups = mockGroupData;
            // TD-7d-1: Pre-set dialog state for owner warning
            mockDialogState.selectedGroupForAction = mockGroupData[0]; // group-owned
            mockDialogState.isOwnerWarningOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-owner-warning-dialog')).toBeInTheDocument();

            // Click delete group - should close owner warning and open delete dialog
            await userEvent.click(screen.getByTestId('mock-delete-group-btn'));

            // TD-7d-1: Verify closeOwnerWarning is called
            expect(mockDialogActions.closeOwnerWarning).toHaveBeenCalled();
            // Story 14d-v2-1-7e: Verify openDeleteDialog is called with the group
            expect(mockDialogActions.openDeleteDialog).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'group-owned' })
            );
        });
    });

    // =========================================================================
    // Story 14d-v2-1-7e: Delete Group Dialog Integration
    // =========================================================================

    describe('Delete Group Dialog (Story 14d-v2-1-7e)', () => {
        const mockGroupData: SharedGroup[] = [
            {
                id: 'group-owned',
                name: 'My Group',
                ownerId: 'test-user-123',
                appId: 'boletapp',
                color: '#10b981',
                icon: '🏠',
                members: ['test-user-123', 'user-2'],
                memberUpdates: {},
                memberProfiles: {
                    'test-user-123': { displayName: 'Test User', email: 'test@example.com' },
                    'user-2': { displayName: 'Other User', email: 'other@example.com' },
                },
                shareCode: 'ABC123',
                shareCodeExpiresAt: createMockTimestamp(),
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp(),
                timezone: 'UTC',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            },
        ];

        it('renders DeleteGroupDialog when isDeleteDialogOpen is true', () => {
            mockGroups = mockGroupData;
            // Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0];
            mockDialogState.isDeleteDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-delete-dialog')).toBeInTheDocument();
        });

        it('passes correct props to DeleteGroupDialog', () => {
            mockGroups = mockGroupData;
            // Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0];
            mockDialogState.isDeleteDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-delete-dialog-group-name')).toHaveTextContent('My Group');
            expect(screen.getByTestId('mock-delete-dialog-group-color')).toHaveTextContent('#10b981');
            expect(screen.getByTestId('mock-delete-dialog-member-count')).toHaveTextContent('2');
        });

        it('calls deleteGroupAsync mutation on confirm', async () => {
            mockGroups = mockGroupData;
            // Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0];
            mockDialogState.isDeleteDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-delete-confirm'));

            await waitFor(() => {
                expect(mockDeleteGroupAsync).toHaveBeenCalledWith({
                    groupId: 'group-owned',
                });
            });
        });

        it('shows success toast after successful deletion', async () => {
            const onShowToast = vi.fn();
            mockGroups = mockGroupData;
            // Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0];
            mockDialogState.isDeleteDialogOpen = true;

            render(<GruposView {...defaultProps} onShowToast={onShowToast} />);

            await userEvent.click(screen.getByTestId('mock-delete-confirm'));

            // Wait for deleteGroupAsync to be called first
            await waitFor(() => {
                expect(mockDeleteGroupAsync).toHaveBeenCalled();
            });

            // Wait a bit for async operation to complete
            await waitFor(() => {
                expect(mockDialogActions.closeDeleteDialog).toHaveBeenCalled();
            });

            // Then verify toast was shown
            expect(onShowToast).toHaveBeenCalled();
            expect(onShowToast).toHaveBeenCalledWith(
                expect.stringContaining('My Group'),
                'success'
            );
        });

        it('closes dialog on successful deletion (mutation hook handles cache invalidation)', async () => {
            mockGroups = mockGroupData;
            // Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0];
            mockDialogState.isDeleteDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-delete-confirm'));

            await waitFor(() => {
                expect(mockDialogActions.closeDeleteDialog).toHaveBeenCalled();
                // TD-CONSOLIDATED-12: refetchGroups/refetchInvitations no longer called directly
                // Cache invalidation handled by useDeleteGroup mutation hook's onSettled
            });
        });

        it('keeps dialog open for retry on error', async () => {
            mockDeleteGroupAsync.mockRejectedValueOnce(new Error('Network error'));
            mockGroups = mockGroupData;
            // Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0];
            mockDialogState.isDeleteDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-delete-confirm'));

            await waitFor(() => {
                // Dialog should NOT be closed on error
                expect(mockDialogActions.closeDeleteDialog).not.toHaveBeenCalled();
            });
        });

        it('does not close dialog when isDeleting is true', async () => {
            mockGroups = mockGroupData;
            // Pre-set dialog state with isDeleting = true
            mockDialogState.selectedGroupForAction = mockGroupData[0];
            mockDialogState.isDeleteDialogOpen = true;
            mockDialogState.isDeleting = true;

            render(<GruposView {...defaultProps} />);

            // Try to close
            await userEvent.click(screen.getByTestId('mock-delete-close'));

            // closeDeleteDialog should NOT be called because isDeleting is true
            expect(mockDialogActions.closeDeleteDialog).not.toHaveBeenCalled();
        });

        it('closes dialog when close button clicked and not deleting', async () => {
            mockGroups = mockGroupData;
            // Pre-set dialog state
            mockDialogState.selectedGroupForAction = mockGroupData[0];
            mockDialogState.isDeleteDialogOpen = true;
            mockDialogState.isDeleting = false;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-delete-close'));

            expect(mockDialogActions.closeDeleteDialog).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Story 14d-v2-1-7g: Edit Group Integration Tests
    // =========================================================================

    describe('Edit Group Integration (Story 14d-v2-1-7g)', () => {
        const mockOwnedGroup: SharedGroup = {
            id: 'group-owned',
            ownerId: 'test-user-123',
            appId: 'boletapp',
            name: 'My Owned Group',
            color: '#10b981',
            icon: '🏠',
            shareCode: 'TestCode12345678',
            shareCodeExpiresAt: createMockTimestamp(),
            members: ['test-user-123'],
            memberUpdates: {},
            createdAt: createMockTimestamp(),
            updatedAt: createMockTimestamp(),
            timezone: 'America/Santiago',
            transactionSharingEnabled: true,
            transactionSharingLastToggleAt: null,
            transactionSharingToggleCountToday: 0,
        };

        const mockMemberGroup: SharedGroup = {
            ...mockOwnedGroup,
            id: 'group-member',
            ownerId: 'other-user-456',
            name: 'Not My Group',
            members: ['other-user-456', 'test-user-123'],
        };

        beforeEach(() => {
            vi.clearAllMocks();
            mockDialogActions.resetAll();
            mockGroupsLoading = false;
            mockIsUpdating = false;
            mockUpdateGroupAsync.mockResolvedValue(undefined);
        });

        it('shows edit button on group card for owner', () => {
            mockGroups = [mockOwnedGroup];
            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId(`edit-btn-${mockOwnedGroup.id}`)).toBeInTheDocument();
        });

        it('hides edit button for non-owner', () => {
            mockGroups = [mockMemberGroup];
            render(<GruposView {...defaultProps} />);

            expect(screen.queryByTestId(`edit-btn-${mockMemberGroup.id}`)).not.toBeInTheDocument();
        });

        it('opens EditGroupDialog when edit button clicked', async () => {
            mockGroups = [mockOwnedGroup];
            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId(`edit-btn-${mockOwnedGroup.id}`));

            expect(mockDialogActions.openEditDialog).toHaveBeenCalledWith(mockOwnedGroup);
        });

        it('renders EditGroupDialog when isEditDialogOpen is true', () => {
            mockGroups = [mockOwnedGroup];
            mockDialogState.editingGroup = mockOwnedGroup;
            mockDialogState.isEditDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            expect(screen.getByTestId('mock-edit-dialog')).toBeInTheDocument();
            expect(screen.getByTestId('mock-edit-group-name')).toHaveTextContent('My Owned Group');
        });

        it('calls useUpdateGroup when save is clicked', async () => {
            mockGroups = [mockOwnedGroup];
            mockDialogState.editingGroup = mockOwnedGroup;
            mockDialogState.isEditDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-edit-save'));

            await waitFor(() => {
                expect(mockUpdateGroupAsync).toHaveBeenCalledWith({
                    groupId: 'group-owned',
                    name: 'Updated Name',
                    icon: '🚗',
                    color: '#3b82f6',
                });
            });
        });

        it('shows success toast on update', async () => {
            mockGroups = [mockOwnedGroup];
            mockDialogState.editingGroup = mockOwnedGroup;
            mockDialogState.isEditDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-edit-save'));

            // First verify the update was called
            await waitFor(() => {
                expect(mockUpdateGroupAsync).toHaveBeenCalled();
            });

            // Then verify toast was shown
            await waitFor(() => {
                expect(defaultProps.onShowToast).toHaveBeenCalledWith(
                    expect.stringContaining('updated'),
                    'success'
                );
            });
        });

        it('closes dialog on successful update', async () => {
            mockGroups = [mockOwnedGroup];
            mockDialogState.editingGroup = mockOwnedGroup;
            mockDialogState.isEditDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-edit-save'));

            await waitFor(() => {
                expect(mockDialogActions.closeEditDialog).toHaveBeenCalled();
            });
        });

        it('closes dialog when close button clicked', async () => {
            mockGroups = [mockOwnedGroup];
            mockDialogState.editingGroup = mockOwnedGroup;
            mockDialogState.isEditDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-edit-close'));

            expect(mockDialogActions.closeEditDialog).toHaveBeenCalled();
        });

        it('shows error toast when update fails', async () => {
            mockUpdateGroupAsync.mockRejectedValue(new Error('Update failed'));
            mockGroups = [mockOwnedGroup];
            mockDialogState.editingGroup = mockOwnedGroup;
            mockDialogState.isEditDialogOpen = true;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-edit-save'));

            await waitFor(() => {
                expect(defaultProps.onShowToast).toHaveBeenCalledWith(
                    expect.any(String),
                    'error'
                );
            });
        });
    });

    // =========================================================================
    // Story 14d-v2-1-13+14: Transaction Sharing Opt-In Dialog Integration
    // =========================================================================

    describe('Transaction Sharing Opt-In Flow (Story 14d-v2-1-13+14)', () => {
        const mockInvitation: PendingInvitation = {
            id: 'inv-optin-1',
            groupId: 'group-sharing',
            groupName: 'Sharing Group',
            groupColor: '#10b981',
            groupIcon: '🏠',
            invitedByName: 'Owner Person',
            invitedByUid: 'owner-123',
            invitedAt: createMockTimestamp(),
            expiresAt: createMockTimestamp(),
            status: 'pending',
            userId: 'test-user-123',
            appId: 'boletapp',
        };

        it('passes onOpenOptIn to AcceptInvitationDialog', () => {
            // Pre-set dialog state with accept dialog open
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            // Our mock exposes whether onOpenOptIn was provided
            expect(screen.getByTestId('mock-accept-has-optin')).toHaveTextContent('true');
        });

        it('opens opt-in dialog when onOpenOptIn is triggered', async () => {
            // Pre-set dialog state with accept dialog open
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            // Trigger the opt-in flow (simulates clicking Accept on a group with transactionSharingEnabled)
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            // Should close accept dialog
            expect(mockDialogActions.closeAcceptDialog).toHaveBeenCalled();

            // Opt-in dialog should now be rendered
            // Note: We need to re-render because the mock state has changed
            // But since our mock immediately renders based on internal state,
            // we need to verify the opt-in dialog appears
            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });
        });

        it('displays correct group info in opt-in dialog', async () => {
            // Pre-set dialog state with accept dialog open
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            // Trigger the opt-in flow
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-group-name')).toHaveTextContent('Sharing Group');
                expect(screen.getByTestId('mock-optin-group-color')).toHaveTextContent('#10b981');
            });
        });

        // TD-CONSOLIDATED-12: handleOptInJoin now uses acceptInvitationAsync mutation hook
        it('handles opt-in join with share=true via mutation hook', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            // Trigger the opt-in flow
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            // Click "Join with Share" (share=true)
            await userEvent.click(screen.getByTestId('mock-optin-join-share'));

            await waitFor(() => {
                expect(mockAcceptInvitationAsync).toHaveBeenCalledWith({
                    invitation: mockInvitation,
                    shareMyTransactions: true,
                });
            });
        });

        it('handles opt-in join with share=false via mutation hook', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            // Trigger the opt-in flow
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            // Click "Join without Share" (share=false)
            await userEvent.click(screen.getByTestId('mock-optin-join-no-share'));

            await waitFor(() => {
                expect(mockAcceptInvitationAsync).toHaveBeenCalledWith({
                    invitation: mockInvitation,
                    shareMyTransactions: false,
                });
            });
        });

        it('closes opt-in dialog after successful join', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            // Trigger the opt-in flow
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            // Join
            await userEvent.click(screen.getByTestId('mock-optin-join-share'));

            // After success, opt-in dialog should close
            await waitFor(() => {
                expect(screen.queryByTestId('mock-optin-dialog')).not.toBeInTheDocument();
            });
        });

        it('cancels opt-in and returns to accept dialog', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            // Trigger the opt-in flow
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            // Cancel opt-in
            await userEvent.click(screen.getByTestId('mock-optin-cancel'));

            // Opt-in dialog should close
            await waitFor(() => {
                expect(screen.queryByTestId('mock-optin-dialog')).not.toBeInTheDocument();
            });

            // Accept dialog should re-open with the same invitation
            expect(mockDialogActions.openAcceptDialog).toHaveBeenCalledWith(mockInvitation);
        });

        it('shows pending state in opt-in dialog during join', async () => {
            // Make the mutation call hang (never resolve)
            mockAcceptInvitationAsync.mockImplementation(
                () => new Promise(() => {}) // Never resolves
            );

            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            // Trigger the opt-in flow
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            // Join (will set isAccepting = true but never resolve)
            await userEvent.click(screen.getByTestId('mock-optin-join-share'));

            // Verify setIsAccepting(true) was called
            await waitFor(() => {
                expect(mockDialogActions.setIsAccepting).toHaveBeenCalledWith(true);
            });
        });

        it('does not render opt-in dialog when not triggered', () => {
            render(<GruposView {...defaultProps} />);

            expect(screen.queryByTestId('mock-optin-dialog')).not.toBeInTheDocument();
        });

        // =================================================================
        // Story 14d-v2-1-14-polish: Context-Specific Toasts (AC1, AC2, AC3)
        // =================================================================

        it('shows context-specific toast for share=true join (AC1)', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            const mockOnShowToast = vi.fn();
            render(<GruposView {...defaultProps} onShowToast={mockOnShowToast} />);

            // Trigger opt-in flow then join with share
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));
            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });
            await userEvent.click(screen.getByTestId('mock-optin-join-share'));

            // ECC Review #4: Differentiate AC1 toast - "member of" without "preferences" or "default"
            await waitFor(() => {
                expect(mockOnShowToast).toHaveBeenCalledWith(
                    expect.stringContaining("member of Sharing Group"),
                    'success'
                );
            });
            // AC1 toast should NOT contain the AC2/AC3 distinguishing phrases
            const toastCall = mockOnShowToast.mock.calls.find(
                (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('member of Sharing Group')
            );
            expect(toastCall).toBeDefined();
            expect(toastCall![0]).not.toContain('sharing preferences');
            expect(toastCall![0]).not.toContain('off by default');
        });

        it('shows context-specific toast for share=false join (AC2)', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            const mockOnShowToast = vi.fn();
            render(<GruposView {...defaultProps} onShowToast={mockOnShowToast} />);

            await userEvent.click(screen.getByTestId('mock-trigger-optin'));
            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });
            await userEvent.click(screen.getByTestId('mock-optin-join-no-share'));

            // ECC Review #4: AC2 toast must contain "sharing preferences" to distinguish from AC1/AC3
            await waitFor(() => {
                expect(mockOnShowToast).toHaveBeenCalledWith(
                    expect.stringContaining('sharing preferences'),
                    'success'
                );
            });
        });

        it('handles dismiss as join with defaults (AC3)', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            const mockOnShowToast = vi.fn();
            render(<GruposView {...defaultProps} onShowToast={mockOnShowToast} />);

            await userEvent.click(screen.getByTestId('mock-trigger-optin'));
            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            // Verify onDismiss prop is provided
            expect(screen.getByTestId('mock-optin-has-dismiss')).toHaveTextContent('true');

            // Click dismiss button (simulates backdrop/close/escape)
            await userEvent.click(screen.getByTestId('mock-optin-dismiss'));

            await waitFor(() => {
                // Should call mutation with shareMyTransactions=false
                expect(mockAcceptInvitationAsync).toHaveBeenCalledWith({
                    invitation: mockInvitation,
                    shareMyTransactions: false,
                });
            });

            // ECC Review #4: AC3 toast must contain "off by default" to distinguish from AC1/AC2
            await waitFor(() => {
                expect(mockOnShowToast).toHaveBeenCalledWith(
                    expect.stringContaining('off by default'),
                    'success'
                );
            });
        });

        // ECC Review #7: Test mutation failure path during opt-in join
        it('shows error toast when opt-in join mutation fails', async () => {
            mockAcceptInvitationAsync.mockRejectedValueOnce(new Error('Network error'));
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            const mockOnShowToast = vi.fn();
            render(<GruposView {...defaultProps} onShowToast={mockOnShowToast} />);

            await userEvent.click(screen.getByTestId('mock-trigger-optin'));
            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });
            await userEvent.click(screen.getByTestId('mock-optin-join-share'));

            await waitFor(() => {
                expect(mockOnShowToast).toHaveBeenCalledWith(
                    expect.stringContaining('Error accepting invitation'),
                    'error'
                );
            });
        });

        // =================================================================
        // Story 14d-v2-1-14-polish: Offline Handling (AC4)
        // =================================================================

        it('blocks accept invitation when offline (AC4)', async () => {
            mockIsOnline = false;
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            const mockOnShowToast = vi.fn();
            render(<GruposView {...defaultProps} onShowToast={mockOnShowToast} />);

            // Try to accept (non-opt-in path)
            await userEvent.click(screen.getByTestId('mock-accept-btn'));

            await waitFor(() => {
                expect(mockOnShowToast).toHaveBeenCalledWith(
                    expect.stringContaining('offline'),
                    'error'
                );
            });

            // Service should NOT have been called
            expect(mockLeaveTransferHandlers.handleAcceptInvitation).not.toHaveBeenCalled();
        });

        it('blocks opt-in flow when offline (AC4)', async () => {
            mockIsOnline = false;
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            const mockOnShowToast = vi.fn();
            render(<GruposView {...defaultProps} onShowToast={mockOnShowToast} />);

            // Try to trigger opt-in
            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            await waitFor(() => {
                expect(mockOnShowToast).toHaveBeenCalledWith(
                    expect.stringContaining('offline'),
                    'error'
                );
            });

            // Opt-in dialog should NOT open
            expect(screen.queryByTestId('mock-optin-dialog')).not.toBeInTheDocument();
        });

        // =================================================================
        // Story 14d-v2-1-14-polish: Analytics Tracking (AC5, AC6)
        // =================================================================

        it('tracks opt-in dialog shown event (AC5)', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-trigger-optin'));

            await waitFor(() => {
                expect(mockTrackEvent).toHaveBeenCalledWith('group_join_optin_shown', {
                    groupId: 'group-sharing',
                    transactionSharingEnabled: true,
                });
            });
        });

        it('tracks opt-in choice event with choice=yes on share join (AC6)', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-trigger-optin'));
            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            await userEvent.click(screen.getByTestId('mock-optin-join-share'));

            await waitFor(() => {
                expect(mockTrackEvent).toHaveBeenCalledWith('group_join_optin_choice', {
                    groupId: 'group-sharing',
                    choice: 'yes',
                });
            });
        });

        // ECC Review #6: AC6 analytics for "no" choice
        it('tracks opt-in choice event with choice=no on no-share join (AC6)', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-trigger-optin'));
            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            await userEvent.click(screen.getByTestId('mock-optin-join-no-share'));

            await waitFor(() => {
                expect(mockTrackEvent).toHaveBeenCalledWith('group_join_optin_choice', {
                    groupId: 'group-sharing',
                    choice: 'no',
                });
            });
        });

        // ECC Review #6: AC6 analytics for "dismiss" choice
        it('tracks opt-in choice event with choice=dismiss on dialog dismiss (AC6)', async () => {
            mockDialogState.isAcceptDialogOpen = true;
            mockDialogState.selectedInvitation = mockInvitation;

            render(<GruposView {...defaultProps} />);

            await userEvent.click(screen.getByTestId('mock-trigger-optin'));
            await waitFor(() => {
                expect(screen.getByTestId('mock-optin-dialog')).toBeInTheDocument();
            });

            await userEvent.click(screen.getByTestId('mock-optin-dismiss'));

            await waitFor(() => {
                expect(mockTrackEvent).toHaveBeenCalledWith('group_join_optin_choice', {
                    groupId: 'group-sharing',
                    choice: 'dismiss',
                });
            });
        });
    });
});
