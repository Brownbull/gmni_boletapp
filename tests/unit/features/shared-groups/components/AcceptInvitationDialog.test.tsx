/**
 * AcceptInvitationDialog Tests
 *
 * Story 14d-v2-1-6c-2: Accept Invitation Dialog
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage:
 * - AC #1: Dialog shows invitation details and accept/decline options
 * - AC #2: Newly joined group appears in View Mode Switcher
 * - Task 8.2: Group name, inviter name, member count displayed
 * - Task 8.3-8.4: Opt-in flow triggered when transactionSharingEnabled
 * - Task 8.5: Accept/Decline/Cancel buttons
 * - Task 8.6: Success toast integration point
 * - Task 9.5: Data-testid attributes
 * - Task 9.6: Accessibility (ARIA, Escape, focus)
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { AcceptInvitationDialog } from '@/features/shared-groups/components/AcceptInvitationDialog';
import type { PendingInvitation, SharedGroup } from '@/types/sharedGroup';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock Firestore
const mockGetDoc = vi.fn();
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
        ...actual,
        getFirestore: vi.fn(() => ({})),
        doc: vi.fn(() => ({})),
        getDoc: (...args: unknown[]) => mockGetDoc(...args),
    };
});

// Mock callbacks
const mockOnClose = vi.fn();
const mockOnAccept = vi.fn();
const mockOnDecline = vi.fn();
const mockOnOpenOptIn = vi.fn();

// Mock translation function
// Note: Component does manual interpolation via .replace('{name}', ...)
const mockT = (key: string, _params?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
        joinGroupTitle: 'Join group?',
        invitedToJoinMessage: '{name} invited you to join this group.',
        members: 'members',
        member: 'member',
        transactionSharingLabel: 'Transaction Sharing',
        enabled: 'Enabled',
        cancel: 'Cancel',
        declineInvitation: 'Decline',
        joinGroup: 'Join',
        reviewAndJoin: 'Review & Join',
        joining: 'Joining...',
        close: 'Close',
        loadingGroup: 'Loading group...',
    };
    return translations[key] || key;
};

// Create mock invitation
const createMockInvitation = (overrides?: Partial<PendingInvitation>): PendingInvitation => ({
    id: 'invitation-123',
    groupId: 'group-456',
    groupName: '🏠 Home Expenses',
    groupColor: '#10b981',
    groupIcon: '🏠',
    shareCode: 'ABC123DEF456',
    invitedEmail: 'user@example.com',
    invitedByUserId: 'inviter-789',
    invitedByName: 'Alice Smith',
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    status: 'pending',
    ...overrides,
});

// Create mock group
const createMockGroup = (overrides?: Partial<SharedGroup>): SharedGroup => ({
    id: 'group-456',
    ownerId: 'owner-123',
    appId: 'boletapp',
    name: '🏠 Home Expenses',
    color: '#10b981',
    icon: '🏠',
    shareCode: 'XYZ789',
    shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    members: ['owner-123', 'member-1', 'member-2'],
    memberUpdates: {},
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    timezone: 'America/Santiago',
    transactionSharingEnabled: false,
    transactionSharingLastToggleAt: null,
    transactionSharingToggleCountToday: 0,
    ...overrides,
});

// Default props
const defaultProps = {
    open: true,
    invitation: createMockInvitation(),
    onClose: mockOnClose,
    onAccept: mockOnAccept,
    onDecline: mockOnDecline,
    onOpenOptIn: mockOnOpenOptIn,
    isPending: false,
    t: mockT,
    lang: 'en' as const,
};

// Helper to setup successful group fetch
const setupGroupFetch = (group: SharedGroup) => {
    mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: group.id,
        data: () => group,
    });
};

// Helper to setup group not found
const setupGroupNotFound = () => {
    mockGetDoc.mockResolvedValue({
        exists: () => false,
    });
};

// Helper to setup group fetch error
const setupGroupFetchError = () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'));
};

// =============================================================================
// Test Suite
// =============================================================================

describe('AcceptInvitationDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetDoc.mockReset();
    });

    // =========================================================================
    // Basic Rendering (Task 8.1, Task 9.5)
    // =========================================================================

    describe('Basic Rendering', () => {
        it('renders the dialog when open is true', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByTestId('accept-invitation-dialog')).toBeInTheDocument();
        });

        it('does not render when open is false', () => {
            render(<AcceptInvitationDialog {...defaultProps} open={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('does not render when invitation is null', () => {
            render(<AcceptInvitationDialog {...defaultProps} invitation={null} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders group icon with correct color', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            const groupIcon = screen.getByTestId('group-icon');
            expect(groupIcon).toBeInTheDocument();
            expect(groupIcon).toHaveStyle({ backgroundColor: '#10b981' });
        });

        it('renders group name from invitation', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            // Group label without emoji
            expect(screen.getByText('Home Expenses')).toBeInTheDocument();
        });

        it('renders dialog title', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            expect(screen.getByText('Join group?')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Group Info Display (Task 8.2)
    // =========================================================================

    describe('Group Info Display', () => {
        it('displays inviter name in message', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText(/Alice Smith invited you/)).toBeInTheDocument();
            });
        });

        it('displays member count after loading', async () => {
            const group = createMockGroup({ members: ['a', 'b', 'c', 'd', 'e'] });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('member-count')).toHaveTextContent('5 members');
            });
        });

        it('shows loading state while fetching group', () => {
            // Never resolves the promise
            mockGetDoc.mockImplementation(() => new Promise(() => {}));
            render(<AcceptInvitationDialog {...defaultProps} />);

            expect(screen.getByText('Loading group...')).toBeInTheDocument();
        });

        it('shows error when group not found', async () => {
            setupGroupNotFound();
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Group no longer exists')).toBeInTheDocument();
            });
        });

        it('shows error when group fetch fails', async () => {
            setupGroupFetchError();
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Error loading group')).toBeInTheDocument();
            });
        });
    });

    // =========================================================================
    // Transaction Sharing Notice (Task 8.3, 8.4)
    // =========================================================================

    describe('Transaction Sharing Notice', () => {
        it('shows transaction sharing notice when group has sharing enabled', async () => {
            const group = createMockGroup({ transactionSharingEnabled: true });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('sharing-notice')).toBeInTheDocument();
                expect(screen.getByText(/Transaction Sharing/)).toBeInTheDocument();
                expect(screen.getByText(/Enabled/)).toBeInTheDocument();
            });
        });

        it('does not show sharing notice when group has sharing disabled', async () => {
            const group = createMockGroup({ transactionSharingEnabled: false });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('member-count')).toBeInTheDocument();
            });

            expect(screen.queryByTestId('sharing-notice')).not.toBeInTheDocument();
        });

        it('shows "Review & Join" button when sharing is enabled', async () => {
            const group = createMockGroup({ transactionSharingEnabled: true });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('accept-btn')).toHaveTextContent('Review & Join');
            });
        });

        it('shows "Join" button when sharing is disabled', async () => {
            const group = createMockGroup({ transactionSharingEnabled: false });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('accept-btn')).toHaveTextContent('Join');
            });
        });
    });

    // =========================================================================
    // Button Actions (Task 8.5, AC #1)
    // =========================================================================

    describe('Button Actions', () => {
        it('renders accept, decline, and cancel buttons', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            expect(screen.getByTestId('accept-btn')).toBeInTheDocument();
            expect(screen.getByTestId('decline-btn')).toBeInTheDocument();
            expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
        });

        it('calls onAccept when accept button is clicked (no sharing)', async () => {
            const group = createMockGroup({ transactionSharingEnabled: false });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('member-count')).toBeInTheDocument();
            });

            const acceptBtn = screen.getByTestId('accept-btn');
            await userEvent.click(acceptBtn);

            expect(mockOnAccept).toHaveBeenCalledWith(defaultProps.invitation);
        });

        it('calls onOpenOptIn when accept clicked and sharing is enabled', async () => {
            const group = createMockGroup({ transactionSharingEnabled: true });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('sharing-notice')).toBeInTheDocument();
            });

            const acceptBtn = screen.getByTestId('accept-btn');
            await userEvent.click(acceptBtn);

            expect(mockOnOpenOptIn).toHaveBeenCalledWith(defaultProps.invitation, expect.objectContaining({
                transactionSharingEnabled: true,
            }));
            expect(mockOnAccept).not.toHaveBeenCalled();
        });

        it('calls onAccept directly when sharing enabled but no onOpenOptIn handler', async () => {
            const group = createMockGroup({ transactionSharingEnabled: true });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} onOpenOptIn={undefined} />);

            await waitFor(() => {
                expect(screen.getByTestId('sharing-notice')).toBeInTheDocument();
            });

            const acceptBtn = screen.getByTestId('accept-btn');
            await userEvent.click(acceptBtn);

            expect(mockOnAccept).toHaveBeenCalledWith(defaultProps.invitation);
        });

        it('calls onDecline when decline button is clicked', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            const declineBtn = screen.getByTestId('decline-btn');
            await userEvent.click(declineBtn);

            expect(mockOnDecline).toHaveBeenCalledWith(defaultProps.invitation);
        });

        it('calls onClose when cancel button is clicked', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when close (X) button is clicked', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            const closeBtn = screen.getByTestId('close-btn');
            await userEvent.click(closeBtn);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when backdrop is clicked', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Loading State (during accept/decline)
    // =========================================================================

    describe('Loading State', () => {
        it('shows loading indicator when isPending is true', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
            expect(screen.getByText('Joining...')).toBeInTheDocument();
        });

        it('disables buttons during loading', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('accept-btn')).toBeDisabled();
            expect(screen.getByTestId('decline-btn')).toBeDisabled();
            expect(screen.getByTestId('cancel-btn')).toBeDisabled();
        });

        it('prevents backdrop click during loading', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} isPending={true} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('disables accept button while loading group', () => {
            mockGetDoc.mockImplementation(() => new Promise(() => {}));
            render(<AcceptInvitationDialog {...defaultProps} />);

            expect(screen.getByTestId('accept-btn')).toBeDisabled();
        });

        it('disables accept button when group has error', async () => {
            setupGroupNotFound();
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Group no longer exists')).toBeInTheDocument();
            });

            expect(screen.getByTestId('accept-btn')).toBeDisabled();
        });
    });

    // =========================================================================
    // Accessibility (Task 9.6)
    // =========================================================================

    describe('Accessibility', () => {
        it('has correct ARIA attributes', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby', 'accept-invitation-title');
        });

        it('closes on Escape key press', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('does not close on Escape during loading', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} isPending={true} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('focuses close button on open', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(document.activeElement).toBe(screen.getByTestId('close-btn'));
            });
        });

        it('prevents body scroll when open', () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('restores body scroll when closed', () => {
            setupGroupFetch(createMockGroup());
            const { unmount } = render(<AcceptInvitationDialog {...defaultProps} />);
            unmount();

            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // State Reset on Reopen
    // =========================================================================

    describe('State Management', () => {
        it('refetches group when dialog reopens with new invitation', async () => {
            const group1 = createMockGroup({ id: 'group-1', members: ['a', 'b'] });
            const group2 = createMockGroup({ id: 'group-2', members: ['x', 'y', 'z'] });

            setupGroupFetch(group1);
            const { rerender } = render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('member-count')).toHaveTextContent('2 members');
            });

            // Close and reopen with different invitation
            mockGetDoc.mockClear();
            setupGroupFetch(group2);

            const newInvitation = createMockInvitation({ groupId: 'group-2' });
            rerender(<AcceptInvitationDialog {...defaultProps} invitation={newInvitation} />);

            await waitFor(() => {
                expect(screen.getByTestId('member-count')).toHaveTextContent('3 members');
            });

            expect(mockGetDoc).toHaveBeenCalled();
        });

        it('resets group state when dialog closes', async () => {
            setupGroupFetch(createMockGroup());
            const { rerender } = render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('member-count')).toBeInTheDocument();
            });

            // Close dialog
            rerender(<AcceptInvitationDialog {...defaultProps} open={false} />);

            // Reopen - should show loading again
            mockGetDoc.mockClear();
            setupGroupFetch(createMockGroup());
            rerender(<AcceptInvitationDialog {...defaultProps} open={true} />);

            // Should fetch group again
            expect(mockGetDoc).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Spanish Language Support
    // =========================================================================

    describe('Spanish Language Support', () => {
        it('shows Spanish error messages when lang is es', async () => {
            setupGroupNotFound();
            render(<AcceptInvitationDialog {...defaultProps} lang="es" />);

            await waitFor(() => {
                expect(screen.getByText('El grupo ya no existe')).toBeInTheDocument();
            });
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', () => {
        it('handles invitation without group icon', async () => {
            const invitation = createMockInvitation({
                groupName: 'No Icon Group',
                groupIcon: undefined,
            });
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} invitation={invitation} />);

            expect(screen.getByTestId('group-icon')).toBeInTheDocument();
        });

        it('handles group with single member', async () => {
            const group = createMockGroup({ members: ['owner-only'] });
            setupGroupFetch(group);
            render(<AcceptInvitationDialog {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('member-count')).toHaveTextContent('1 member');
            });
        });

        it('does not call accept handler when isPending', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} isPending={true} />);

            const acceptBtn = screen.getByTestId('accept-btn');
            await userEvent.click(acceptBtn);

            expect(mockOnAccept).not.toHaveBeenCalled();
        });

        it('does not call decline handler when isPending', async () => {
            setupGroupFetch(createMockGroup());
            render(<AcceptInvitationDialog {...defaultProps} isPending={true} />);

            const declineBtn = screen.getByTestId('decline-btn');
            await userEvent.click(declineBtn);

            expect(mockOnDecline).not.toHaveBeenCalled();
        });
    });
});
