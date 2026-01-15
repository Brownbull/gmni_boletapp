/**
 * PendingInvitationsSection Component Tests
 *
 * Story 14c.2: Accept/Decline Invitation
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the pending invitations UI component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PendingInvitationsSection } from '../../../../src/components/SharedGroups/PendingInvitationsSection';
import type { PendingInvitation } from '../../../../src/types/sharedGroup';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
}));

// Mock sharedGroupService
vi.mock('../../../../src/services/sharedGroupService', () => ({
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
}));

// Mock transactionGroup utils
vi.mock('../../../../src/types/transactionGroup', () => ({
    extractGroupEmoji: vi.fn((name: string) => {
        const match = name.match(/^(\p{Emoji})/u);
        return match ? match[1] : null;
    }),
    extractGroupLabel: vi.fn((name: string) => {
        return name.replace(/^(\p{Emoji})\s*/u, '').trim() || name;
    }),
}));

import { acceptInvitation, declineInvitation } from '../../../../src/services/sharedGroupService';

const mockAcceptInvitation = vi.mocked(acceptInvitation);
const mockDeclineInvitation = vi.mocked(declineInvitation);

// Mock translation function
const mockT = (key: string, params?: Record<string, string | number>): string => {
    const translations: Record<string, string> = {
        pendingInvitations: 'Pending Invitations',
        pendingInvitationsDesc: 'You have been invited to join these groups',
        invitedBy: `Invited by ${params?.name || ''}`,
        expiresIn: `Expires in ${params?.days || 0} days`,
        expiresInHours: `Expires in ${params?.hours || 0} hours`,
        expired: 'Expired',
        acceptInvitation: 'Accept',
        declineInvitation: 'Decline',
        acceptInvitationSuccess: `Joined ${params?.groupName || ''}!`,
        declineInvitationSuccess: 'Invitation declined',
        groupFull: 'This group is full',
        alreadyMember: "You're already a member of this group",
        invitationExpired: 'This invitation has expired',
        groupNotFound: 'Group not found',
        invitationNotFound: 'Invitation not found',
        dismissExpired: 'Dismiss',
    };
    return translations[key] || key;
};

// Mock invitation data
const createMockInvitation = (overrides: Partial<PendingInvitation> = {}): PendingInvitation => ({
    id: 'invite-123',
    groupId: 'group-456',
    groupName: '🏠 Gastos del Hogar',
    groupColor: '#10b981',
    groupIcon: '🏠',
    invitedEmail: 'test@example.com',
    invitedByUserId: 'user-1',
    invitedByName: 'John Doe',
    createdAt: { toDate: () => new Date() } as any,
    expiresAt: { toDate: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) } as any, // 5 days from now
    status: 'pending',
    ...overrides,
});

const createExpiredInvitation = (): PendingInvitation => ({
    ...createMockInvitation(),
    id: 'invite-expired',
    expiresAt: { toDate: () => new Date(Date.now() - 1000) } as any, // Already expired
});

describe('PendingInvitationsSection', () => {
    const defaultProps = {
        invitations: [createMockInvitation()],
        userId: 'test-user-id',
        appId: 'boletapp',
        t: mockT,
        theme: 'light',
        lang: 'en' as const,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render nothing when invitations array is empty', () => {
            const { container } = render(
                <PendingInvitationsSection {...defaultProps} invitations={[]} />
            );
            expect(container.firstChild).toBeNull();
        });

        it('should render section header with correct text', () => {
            render(<PendingInvitationsSection {...defaultProps} />);

            expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
            expect(screen.getByText('You have been invited to join these groups')).toBeInTheDocument();
        });

        it('should render invitation card with group name', () => {
            render(<PendingInvitationsSection {...defaultProps} />);

            expect(screen.getByText('Gastos del Hogar')).toBeInTheDocument();
        });

        it('should render inviter name', () => {
            render(<PendingInvitationsSection {...defaultProps} />);

            expect(screen.getByText('Invited by John Doe')).toBeInTheDocument();
        });

        it('should render expiry time for non-expired invitations', () => {
            render(<PendingInvitationsSection {...defaultProps} />);

            // Should show "Expires in X days"
            expect(screen.getByText(/Expires in \d+ days/)).toBeInTheDocument();
        });

        it('should render Accept and Decline buttons for active invitations', () => {
            render(<PendingInvitationsSection {...defaultProps} />);

            expect(screen.getByText('Accept')).toBeInTheDocument();
            expect(screen.getByText('Decline')).toBeInTheDocument();
        });

        it('should render multiple invitations', () => {
            const invitations = [
                createMockInvitation({ id: 'invite-1', groupName: '🏠 Group 1' }),
                createMockInvitation({ id: 'invite-2', groupName: '🚗 Group 2' }),
            ];

            render(<PendingInvitationsSection {...defaultProps} invitations={invitations} />);

            expect(screen.getByText('Group 1')).toBeInTheDocument();
            expect(screen.getByText('Group 2')).toBeInTheDocument();
        });
    });

    describe('Expired Invitations (AC7)', () => {
        it('should show Dismiss button for expired invitations', () => {
            render(
                <PendingInvitationsSection
                    {...defaultProps}
                    invitations={[createExpiredInvitation()]}
                />
            );

            expect(screen.getByText('Dismiss')).toBeInTheDocument();
            expect(screen.queryByText('Accept')).not.toBeInTheDocument();
            expect(screen.queryByText('Decline')).not.toBeInTheDocument();
        });

        it('should show Expired label instead of time remaining', () => {
            render(
                <PendingInvitationsSection
                    {...defaultProps}
                    invitations={[createExpiredInvitation()]}
                />
            );

            expect(screen.getByText('Expired')).toBeInTheDocument();
        });

        it('should apply reduced opacity to expired invitations', () => {
            const { container } = render(
                <PendingInvitationsSection
                    {...defaultProps}
                    invitations={[createExpiredInvitation()]}
                />
            );

            const card = container.querySelector('.opacity-60');
            expect(card).toBeInTheDocument();
        });
    });

    describe('Accept Invitation (AC5)', () => {
        it('should call acceptInvitation service on Accept click', async () => {
            mockAcceptInvitation.mockResolvedValueOnce({ groupName: 'Gastos del Hogar' });

            render(<PendingInvitationsSection {...defaultProps} />);

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(mockAcceptInvitation).toHaveBeenCalledWith(
                    expect.anything(), // db
                    'test-user-id',
                    'boletapp',
                    'invite-123'
                );
            });
        });

        it('should show success toast on successful accept', async () => {
            mockAcceptInvitation.mockResolvedValueOnce({ groupName: 'Gastos del Hogar' });
            const onShowToast = vi.fn();

            render(
                <PendingInvitationsSection {...defaultProps} onShowToast={onShowToast} />
            );

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    expect.stringContaining('Joined'),
                    'success'
                );
            });
        });

        it('should call onInvitationHandled callback after accept', async () => {
            mockAcceptInvitation.mockResolvedValueOnce({ groupName: 'Gastos del Hogar' });
            const onInvitationHandled = vi.fn();

            render(
                <PendingInvitationsSection
                    {...defaultProps}
                    onInvitationHandled={onInvitationHandled}
                />
            );

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(onInvitationHandled).toHaveBeenCalled();
            });
        });

        it('should show loading spinner while processing accept', async () => {
            // Make acceptInvitation hang
            mockAcceptInvitation.mockImplementation(
                () => new Promise(() => {}) // Never resolves
            );

            render(<PendingInvitationsSection {...defaultProps} />);

            fireEvent.click(screen.getByText('Accept'));

            // Loading spinner should appear (the Loader2 icon from lucide-react)
            await waitFor(() => {
                // Look for the spinner by class (animate-spin)
                const spinner = document.querySelector('.animate-spin');
                expect(spinner).toBeInTheDocument();
            });
        });
    });

    describe('Decline Invitation (AC6)', () => {
        it('should call declineInvitation service on Decline click', async () => {
            mockDeclineInvitation.mockResolvedValueOnce(undefined);

            render(<PendingInvitationsSection {...defaultProps} />);

            fireEvent.click(screen.getByText('Decline'));

            await waitFor(() => {
                expect(mockDeclineInvitation).toHaveBeenCalledWith(
                    expect.anything(), // db
                    'invite-123'
                );
            });
        });

        it('should show success toast on successful decline', async () => {
            mockDeclineInvitation.mockResolvedValueOnce(undefined);
            const onShowToast = vi.fn();

            render(
                <PendingInvitationsSection {...defaultProps} onShowToast={onShowToast} />
            );

            fireEvent.click(screen.getByText('Decline'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    'Invitation declined',
                    'success'
                );
            });
        });
    });

    describe('Error Handling (AC8)', () => {
        it('should show GROUP_FULL error message', async () => {
            mockAcceptInvitation.mockRejectedValueOnce(new Error('GROUP_FULL'));
            const onShowToast = vi.fn();

            render(
                <PendingInvitationsSection {...defaultProps} onShowToast={onShowToast} />
            );

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    'This group is full',
                    'error'
                );
            });
        });

        it('should show ALREADY_MEMBER error message', async () => {
            mockAcceptInvitation.mockRejectedValueOnce(new Error('ALREADY_MEMBER'));
            const onShowToast = vi.fn();

            render(
                <PendingInvitationsSection {...defaultProps} onShowToast={onShowToast} />
            );

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    "You're already a member of this group",
                    'error'
                );
            });
        });

        it('should show INVITATION_EXPIRED error message', async () => {
            mockAcceptInvitation.mockRejectedValueOnce(new Error('INVITATION_EXPIRED'));
            const onShowToast = vi.fn();

            render(
                <PendingInvitationsSection {...defaultProps} onShowToast={onShowToast} />
            );

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    'This invitation has expired',
                    'error'
                );
            });
        });

        it('should show GROUP_NOT_FOUND error message', async () => {
            mockAcceptInvitation.mockRejectedValueOnce(new Error('GROUP_NOT_FOUND'));
            const onShowToast = vi.fn();

            render(
                <PendingInvitationsSection {...defaultProps} onShowToast={onShowToast} />
            );

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    'Group not found',
                    'error'
                );
            });
        });

        it('should show INVITATION_NOT_FOUND error message', async () => {
            mockAcceptInvitation.mockRejectedValueOnce(new Error('INVITATION_NOT_FOUND'));
            const onShowToast = vi.fn();

            render(
                <PendingInvitationsSection {...defaultProps} onShowToast={onShowToast} />
            );

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    'Invitation not found',
                    'error'
                );
            });
        });

        it('should show raw error message for unknown errors', async () => {
            mockAcceptInvitation.mockRejectedValueOnce(new Error('Some unknown error'));
            const onShowToast = vi.fn();

            render(
                <PendingInvitationsSection {...defaultProps} onShowToast={onShowToast} />
            );

            fireEvent.click(screen.getByText('Accept'));

            await waitFor(() => {
                expect(onShowToast).toHaveBeenCalledWith(
                    'Some unknown error',
                    'error'
                );
            });
        });
    });

    describe('Theme Support', () => {
        it('should render correctly in dark theme', () => {
            const { container } = render(
                <PendingInvitationsSection {...defaultProps} theme="dark" />
            );

            // Component should render without errors
            expect(container.firstChild).toBeInTheDocument();
        });

        it('should render correctly in light theme', () => {
            const { container } = render(
                <PendingInvitationsSection {...defaultProps} theme="light" />
            );

            // Component should render without errors
            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('Dismiss Expired', () => {
        it('should call declineInvitation when dismissing expired invitation', async () => {
            mockDeclineInvitation.mockResolvedValueOnce(undefined);

            render(
                <PendingInvitationsSection
                    {...defaultProps}
                    invitations={[createExpiredInvitation()]}
                />
            );

            fireEvent.click(screen.getByText('Dismiss'));

            await waitFor(() => {
                expect(mockDeclineInvitation).toHaveBeenCalledWith(
                    expect.anything(),
                    'invite-expired'
                );
            });
        });
    });

    describe('Time Remaining Display', () => {
        it('should show hours when less than 1 day remaining', () => {
            const invitation = createMockInvitation({
                expiresAt: { toDate: () => new Date(Date.now() + 5 * 60 * 60 * 1000) } as any, // 5 hours
            });

            render(
                <PendingInvitationsSection {...defaultProps} invitations={[invitation]} />
            );

            expect(screen.getByText(/Expires in \d+ hours/)).toBeInTheDocument();
        });
    });
});
