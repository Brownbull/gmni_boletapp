/**
 * SharedGroupError Component Tests
 *
 * Story 14c.11: Error Handling
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the unified error display component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SharedGroupError } from '../../../../src/components/SharedGroups/SharedGroupError';
import {
    SharedGroupErrorType,
    type SharedGroupError as SharedGroupErrorData,
} from '../../../../src/lib/sharedGroupErrors';

// Mock translation function with all error keys
const mockT = (key: string): string => {
    const translations: Record<string, string> = {
        // Error titles
        errorUserNotFoundTitle: 'User Not Found',
        errorInvitationExpiredTitle: 'Invitation Expired',
        errorInvitationNotFoundTitle: 'Invitation Not Found',
        errorAlreadyInvitedTitle: 'Already Invited',
        errorGroupFullTitle: 'Group is Full',
        errorAlreadyMemberTitle: 'Already a Member',
        errorNotMemberTitle: 'Not a Member',
        errorNotOwnerTitle: 'Permission Denied',
        errorCodeNotFoundTitle: 'Invalid Code',
        errorCodeExpiredTitle: 'Code Expired',
        errorNetworkTitle: 'Connection Error',
        errorStorageQuotaTitle: 'Storage Limited',
        errorPermissionDeniedTitle: 'Access Denied',
        errorUnknownTitle: 'Something Went Wrong',
        // Error messages
        errorUserNotFoundMessage: 'No user found with this email. They must sign up first.',
        errorInvitationExpiredMessage: 'This invitation has expired. Ask the group owner to send a new one.',
        errorAlreadyInvitedMessage: 'An invitation was already sent to this email.',
        errorGroupFullMessage: 'This group has reached the maximum of 10 members.',
        errorGroupNotFoundMessage: 'This group no longer exists.',
        errorNotMemberMessage: "You're not a member of this group.",
        errorNotOwnerMessage: 'Only the group owner can perform this action.',
        errorCodeNotFoundMessage: "This invite code doesn't exist.",
        errorCodeExpiredMessage: 'This invite code has expired.',
        errorNetworkMessage: 'Unable to connect. Check your internet and try again.',
        errorStorageQuotaMessage: 'Offline data may be limited.',
        errorPermissionDeniedMessage: "You don't have permission.",
        errorUnknownMessage: 'An unexpected error occurred.',
        // Labels
        tryAgain: 'Try Again',
        retrying: 'Retrying...',
        returnToHome: 'Return to Home',
        dismiss: 'Dismiss',
        connectionRestored: 'Connection restored',
        offline: "You're offline",
        invitationNotFound: 'Invitation not found',
        alreadyMember: "You're already a member",
        groupNotFound: 'Group not found',
        ownerLeaveWarningTitle: "You're the owner",
        ownerLeaveWarningDesc: 'Transfer ownership first',
        groupFull: 'Group is full',
        invitationExpired: 'Invitation expired',
    };
    return translations[key] || key;
};

// Helper to create error data
function createError(
    type: SharedGroupErrorType,
    recoverable = false
): SharedGroupErrorData {
    return {
        type,
        message: `Test message for ${type}`,
        recoverable,
    };
}

describe('SharedGroupError', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Full Error Display', () => {
        it('renders error title and message', () => {
            const error = createError(SharedGroupErrorType.USER_NOT_FOUND, true);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.getByText('User Not Found')).toBeInTheDocument();
            expect(screen.getByText('No user found with this email. They must sign up first.')).toBeInTheDocument();
        });

        it('renders correct icon for user not found error', () => {
            const error = createError(SharedGroupErrorType.USER_NOT_FOUND, true);

            render(<SharedGroupError error={error} t={mockT} />);

            // Icon should be the emoji
            expect(screen.getByText('❓')).toBeInTheDocument();
        });

        it('renders correct icon for group full error', () => {
            const error = createError(SharedGroupErrorType.GROUP_FULL, false);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.getByText('👥')).toBeInTheDocument();
        });

        it('renders correct icon for network error', () => {
            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.getByText('📡')).toBeInTheDocument();
        });

        it('renders correct icon for invitation expired error', () => {
            const error = createError(SharedGroupErrorType.INVITATION_EXPIRED, false);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.getByText('⏰')).toBeInTheDocument();
        });

        it('renders correct icon for storage quota error', () => {
            const error = createError(SharedGroupErrorType.STORAGE_QUOTA, true);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.getByText('💾')).toBeInTheDocument();
        });

        it('has role="alert" for accessibility', () => {
            const error = createError(SharedGroupErrorType.UNKNOWN, false);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.getByRole('alert')).toBeInTheDocument();
        });
    });

    describe('Retry Button', () => {
        it('shows retry button for recoverable errors', () => {
            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);
            const onRetry = vi.fn();

            render(<SharedGroupError error={error} t={mockT} onRetry={onRetry} />);

            expect(screen.getByText('Try Again')).toBeInTheDocument();
        });

        it('does not show retry button for non-recoverable errors', () => {
            const error = createError(SharedGroupErrorType.GROUP_FULL, false);
            const onRetry = vi.fn();

            render(<SharedGroupError error={error} t={mockT} onRetry={onRetry} />);

            expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
        });

        it('calls onRetry when retry button clicked', () => {
            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);
            const onRetry = vi.fn();

            render(<SharedGroupError error={error} t={mockT} onRetry={onRetry} />);

            fireEvent.click(screen.getByText('Try Again'));

            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('shows retrying state when isRetrying is true', () => {
            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);
            const onRetry = vi.fn();

            render(
                <SharedGroupError
                    error={error}
                    t={mockT}
                    onRetry={onRetry}
                    isRetrying={true}
                />
            );

            expect(screen.getByText('Retrying...')).toBeInTheDocument();
        });

        it('disables retry button when retrying', () => {
            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);
            const onRetry = vi.fn();

            render(
                <SharedGroupError
                    error={error}
                    t={mockT}
                    onRetry={onRetry}
                    isRetrying={true}
                />
            );

            const button = screen.getByText('Retrying...').closest('button');
            expect(button).toBeDisabled();
        });
    });

    describe('Navigate Home Button', () => {
        it('shows home button for non-recoverable errors when callback provided', () => {
            const error = createError(SharedGroupErrorType.GROUP_FULL, false);
            const onNavigateHome = vi.fn();

            render(
                <SharedGroupError
                    error={error}
                    t={mockT}
                    onNavigateHome={onNavigateHome}
                />
            );

            expect(screen.getByText('Return to Home')).toBeInTheDocument();
        });

        it('does not show home button without callback', () => {
            const error = createError(SharedGroupErrorType.GROUP_FULL, false);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.queryByText('Return to Home')).not.toBeInTheDocument();
        });

        it('calls onNavigateHome when clicked', () => {
            const error = createError(SharedGroupErrorType.GROUP_FULL, false);
            const onNavigateHome = vi.fn();

            render(
                <SharedGroupError
                    error={error}
                    t={mockT}
                    onNavigateHome={onNavigateHome}
                />
            );

            fireEvent.click(screen.getByText('Return to Home'));

            expect(onNavigateHome).toHaveBeenCalledTimes(1);
        });
    });

    describe('Dismiss Button', () => {
        it('shows dismiss button when onDismiss provided', () => {
            const error = createError(SharedGroupErrorType.USER_NOT_FOUND, true);
            const onDismiss = vi.fn();

            render(
                <SharedGroupError
                    error={error}
                    t={mockT}
                    onDismiss={onDismiss}
                />
            );

            expect(screen.getByText('Dismiss')).toBeInTheDocument();
        });

        it('calls onDismiss when clicked', () => {
            const error = createError(SharedGroupErrorType.USER_NOT_FOUND, true);
            const onDismiss = vi.fn();

            render(
                <SharedGroupError
                    error={error}
                    t={mockT}
                    onDismiss={onDismiss}
                />
            );

            fireEvent.click(screen.getByText('Dismiss'));

            expect(onDismiss).toHaveBeenCalledTimes(1);
        });
    });

    describe('Compact Mode', () => {
        it('renders compact version when compact prop is true', () => {
            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);

            const { container } = render(
                <SharedGroupError error={error} t={mockT} compact={true} />
            );

            // Compact mode uses flex items-center gap-3
            const alert = container.querySelector('[role="alert"]');
            expect(alert).toHaveClass('flex');
            expect(alert).toHaveClass('items-center');
        });

        it('shows retry icon button in compact mode', () => {
            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);
            const onRetry = vi.fn();

            render(
                <SharedGroupError
                    error={error}
                    t={mockT}
                    onRetry={onRetry}
                    compact={true}
                />
            );

            // In compact mode, the button has aria-label instead of text
            const retryButton = screen.getByLabelText('Try Again');
            expect(retryButton).toBeInTheDocument();
        });

        it('shows dismiss icon button in compact mode', () => {
            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);
            const onDismiss = vi.fn();

            render(
                <SharedGroupError
                    error={error}
                    t={mockT}
                    onDismiss={onDismiss}
                    compact={true}
                />
            );

            const dismissButton = screen.getByLabelText('Dismiss');
            expect(dismissButton).toBeInTheDocument();
        });
    });

    describe('Network Status Indicator', () => {
        it('shows online status for network errors when online', () => {
            // Mock navigator.onLine
            Object.defineProperty(navigator, 'onLine', {
                value: true,
                configurable: true,
            });

            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.getByText('Connection restored')).toBeInTheDocument();
        });

        it('shows offline status for network errors when offline', () => {
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true,
            });

            const error = createError(SharedGroupErrorType.NETWORK_ERROR, true);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.getByText("You're offline")).toBeInTheDocument();
        });

        it('does not show network status for non-network errors', () => {
            const error = createError(SharedGroupErrorType.GROUP_FULL, false);

            render(<SharedGroupError error={error} t={mockT} />);

            expect(screen.queryByText('Connection restored')).not.toBeInTheDocument();
            expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
        });
    });

    describe('Theme Support', () => {
        it('applies dark theme styling', () => {
            const error = createError(SharedGroupErrorType.UNKNOWN, false);

            const { container } = render(
                <SharedGroupError error={error} t={mockT} theme="dark" />
            );

            // The component should render (theme affects styling, not structure)
            expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
        });

        it('applies light theme styling by default', () => {
            const error = createError(SharedGroupErrorType.UNKNOWN, false);

            const { container } = render(
                <SharedGroupError error={error} t={mockT} />
            );

            expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
        });
    });

    describe('Error Type Specific Behavior', () => {
        const errorTypes = [
            { type: SharedGroupErrorType.USER_NOT_FOUND, recoverable: true, icon: '❓' },
            { type: SharedGroupErrorType.INVITATION_EXPIRED, recoverable: false, icon: '⏰' },
            { type: SharedGroupErrorType.GROUP_FULL, recoverable: false, icon: '👥' },
            { type: SharedGroupErrorType.NETWORK_ERROR, recoverable: true, icon: '📡' },
            { type: SharedGroupErrorType.STORAGE_QUOTA, recoverable: true, icon: '💾' },
            { type: SharedGroupErrorType.PERMISSION_DENIED, recoverable: false, icon: '🔐' },
            { type: SharedGroupErrorType.UNKNOWN, recoverable: false, icon: '⚠️' },
        ];

        errorTypes.forEach(({ type, recoverable, icon }) => {
            it(`renders correctly for ${type}`, () => {
                const error = createError(type, recoverable);
                const onRetry = vi.fn();

                render(<SharedGroupError error={error} t={mockT} onRetry={onRetry} />);

                // Check icon is present
                expect(screen.getByText(icon)).toBeInTheDocument();

                // Check retry button behavior matches recoverability
                if (recoverable) {
                    expect(screen.getByText('Try Again')).toBeInTheDocument();
                } else {
                    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
                }
            });
        });
    });
});
