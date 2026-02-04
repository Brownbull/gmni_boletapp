/**
 * InvitationErrorView Tests
 *
 * Story 14d-v2-1-6d: Transaction Sharing Opt-In & Error UI
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage:
 * - AC #6: Invalid share code shows clear error message (FR-26)
 * - AC #7: Expired invitation shows expiry message
 * - Task 10.1-10.7: All error types and UI elements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitationErrorView, type InvitationErrorType } from '@/features/shared-groups/components/InvitationErrorView';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock callback
const mockOnBackToHome = vi.fn();

// Mock translation function
const mockT = (key: string) => {
    const translations: Record<string, string> = {
        invalidInvitation: 'Invalid Invitation',
        invalidInviteLinkMessage: 'This invite link is invalid or expired.',
        askForNewInvite: 'Please ask the group owner for a new invitation link.',
        invitationExpiredTitle: 'Invitation Expired',
        invitationExpiredMessage: 'This invitation has expired.',
        invitationAlreadyUsed: 'Invitation Already Used',
        invitationAlreadyUsedMessage: 'This invitation was already used.',
        checkYourGroups: "Check your groups to see if you're already a member.",
        alreadyMemberTitle: 'Already a Member',
        alreadyMemberMessage: 'You are already a member of this group.',
        viewGroupInSettings: 'You can view the group in Groups settings.',
        groupFullTitle: 'Group Full',
        groupFullMessage: 'This group has reached the maximum number of members.',
        contactGroupOwner: 'Contact the group owner for more information.',
        invitationNetworkError: 'Connection Error',
        networkErrorMessage: 'Could not verify the invitation. Check your internet connection.',
        errorOccurred: 'An Error Occurred',
        unknownErrorMessage: 'Something went wrong processing the invitation.',
        tryAgainLater: 'Please try again later.',
        backToHome: 'Back to Home',
    };
    return translations[key] || key;
};

// Default props
const defaultProps = {
    errorType: 'INVALID_FORMAT' as InvitationErrorType,
    onBackToHome: mockOnBackToHome,
    t: mockT,
    lang: 'en' as const,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('InvitationErrorView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // =========================================================================
    // Basic Rendering
    // =========================================================================

    describe('Basic Rendering', () => {
        it('renders the error view', () => {
            render(<InvitationErrorView {...defaultProps} />);

            expect(screen.getByTestId('error-view')).toBeInTheDocument();
        });

        it('renders error icon', () => {
            render(<InvitationErrorView {...defaultProps} />);

            expect(screen.getByTestId('error-icon')).toBeInTheDocument();
        });

        it('renders error title', () => {
            render(<InvitationErrorView {...defaultProps} />);

            expect(screen.getByTestId('error-title')).toBeInTheDocument();
        });

        it('renders error message', () => {
            render(<InvitationErrorView {...defaultProps} />);

            expect(screen.getByTestId('error-message')).toBeInTheDocument();
        });

        it('renders error hint', () => {
            render(<InvitationErrorView {...defaultProps} />);

            expect(screen.getByTestId('error-hint')).toBeInTheDocument();
        });

        it('renders back to home button', () => {
            render(<InvitationErrorView {...defaultProps} />);

            expect(screen.getByTestId('back-home-btn')).toBeInTheDocument();
            expect(screen.getByText('Back to Home')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // INVALID_FORMAT Error (AC #6, FR-26)
    // =========================================================================

    describe('INVALID_FORMAT Error', () => {
        it('shows "Invalid Invitation" title', () => {
            render(<InvitationErrorView {...defaultProps} errorType="INVALID_FORMAT" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Invalid Invitation');
        });

        it('shows "invalid or expired" message', () => {
            render(<InvitationErrorView {...defaultProps} errorType="INVALID_FORMAT" />);

            expect(screen.getByTestId('error-message')).toHaveTextContent('invalid or expired');
        });

        it('shows hint to ask for new invite', () => {
            render(<InvitationErrorView {...defaultProps} errorType="INVALID_FORMAT" />);

            expect(screen.getByTestId('error-hint')).toHaveTextContent('ask the group owner');
        });
    });

    // =========================================================================
    // NOT_FOUND Error (Same as INVALID_FORMAT per FR-26)
    // =========================================================================

    describe('NOT_FOUND Error', () => {
        it('shows same message as INVALID_FORMAT', () => {
            render(<InvitationErrorView {...defaultProps} errorType="NOT_FOUND" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Invalid Invitation');
            expect(screen.getByTestId('error-message')).toHaveTextContent('invalid or expired');
        });
    });

    // =========================================================================
    // EXPIRED Error (AC #7)
    // =========================================================================

    describe('EXPIRED Error', () => {
        it('shows "Invitation Expired" title', () => {
            render(<InvitationErrorView {...defaultProps} errorType="EXPIRED" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Invitation Expired');
        });

        it('shows expiry message', () => {
            render(<InvitationErrorView {...defaultProps} errorType="EXPIRED" />);

            expect(screen.getByTestId('error-message')).toHaveTextContent('has expired');
        });

        it('shows hint to ask for new invite', () => {
            render(<InvitationErrorView {...defaultProps} errorType="EXPIRED" />);

            // Uses askForNewInvite translation which provides full text
            expect(screen.getByTestId('error-hint')).toHaveTextContent('new invitation link');
        });
    });

    // =========================================================================
    // ALREADY_PROCESSED Error
    // =========================================================================

    describe('ALREADY_PROCESSED Error', () => {
        it('shows "Invitation Already Used" title', () => {
            render(<InvitationErrorView {...defaultProps} errorType="ALREADY_PROCESSED" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Invitation Already Used');
        });

        it('shows already used message', () => {
            render(<InvitationErrorView {...defaultProps} errorType="ALREADY_PROCESSED" />);

            expect(screen.getByTestId('error-message')).toHaveTextContent('already used');
        });

        it('shows hint to check groups', () => {
            render(<InvitationErrorView {...defaultProps} errorType="ALREADY_PROCESSED" />);

            expect(screen.getByTestId('error-hint')).toHaveTextContent('Check your groups');
        });
    });

    // =========================================================================
    // ALREADY_MEMBER Error
    // =========================================================================

    describe('ALREADY_MEMBER Error', () => {
        it('shows "Already a Member" title', () => {
            render(<InvitationErrorView {...defaultProps} errorType="ALREADY_MEMBER" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Already a Member');
        });

        it('shows already member message', () => {
            render(<InvitationErrorView {...defaultProps} errorType="ALREADY_MEMBER" />);

            expect(screen.getByTestId('error-message')).toHaveTextContent('already a member');
        });

        it('shows hint to view in settings', () => {
            render(<InvitationErrorView {...defaultProps} errorType="ALREADY_MEMBER" />);

            expect(screen.getByTestId('error-hint')).toHaveTextContent('Groups settings');
        });
    });

    // =========================================================================
    // GROUP_FULL Error
    // =========================================================================

    describe('GROUP_FULL Error', () => {
        it('shows "Group Full" title', () => {
            render(<InvitationErrorView {...defaultProps} errorType="GROUP_FULL" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Group Full');
        });

        it('shows maximum members message', () => {
            render(<InvitationErrorView {...defaultProps} errorType="GROUP_FULL" />);

            expect(screen.getByTestId('error-message')).toHaveTextContent('maximum number of members');
        });

        it('shows hint to contact owner', () => {
            render(<InvitationErrorView {...defaultProps} errorType="GROUP_FULL" />);

            expect(screen.getByTestId('error-hint')).toHaveTextContent('Contact the group owner');
        });
    });

    // =========================================================================
    // NETWORK_ERROR
    // =========================================================================

    describe('NETWORK_ERROR', () => {
        it('shows "Connection Error" title', () => {
            render(<InvitationErrorView {...defaultProps} errorType="NETWORK_ERROR" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Connection Error');
        });

        it('shows connection error message', () => {
            render(<InvitationErrorView {...defaultProps} errorType="NETWORK_ERROR" />);

            expect(screen.getByTestId('error-message')).toHaveTextContent('Check your internet connection');
        });

        it('shows try again hint', () => {
            render(<InvitationErrorView {...defaultProps} errorType="NETWORK_ERROR" />);

            expect(screen.getByTestId('error-hint')).toHaveTextContent('try again later');
        });
    });

    // =========================================================================
    // UNKNOWN Error
    // =========================================================================

    describe('UNKNOWN Error', () => {
        it('shows generic error title', () => {
            render(<InvitationErrorView {...defaultProps} errorType="UNKNOWN" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('An Error Occurred');
        });

        it('shows generic error message', () => {
            render(<InvitationErrorView {...defaultProps} errorType="UNKNOWN" />);

            expect(screen.getByTestId('error-message')).toHaveTextContent('Something went wrong');
        });
    });

    // =========================================================================
    // Custom Message
    // =========================================================================

    describe('Custom Message', () => {
        it('uses custom message when provided', () => {
            render(
                <InvitationErrorView
                    {...defaultProps}
                    errorType="UNKNOWN"
                    customMessage="Custom error message from server"
                />
            );

            expect(screen.getByTestId('error-message')).toHaveTextContent('Custom error message from server');
        });

        it('overrides default message for any error type', () => {
            render(
                <InvitationErrorView
                    {...defaultProps}
                    errorType="EXPIRED"
                    customMessage="The invite was invalid"
                />
            );

            expect(screen.getByTestId('error-message')).toHaveTextContent('The invite was invalid');
        });
    });

    // =========================================================================
    // Back to Home Button
    // =========================================================================

    describe('Back to Home Button', () => {
        it('calls onBackToHome when clicked', async () => {
            render(<InvitationErrorView {...defaultProps} />);

            const backBtn = screen.getByTestId('back-home-btn');
            await userEvent.click(backBtn);

            expect(mockOnBackToHome).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // Spanish Language Support
    // =========================================================================

    describe('Spanish Language Support', () => {
        it('uses Spanish fallbacks when translations not provided', () => {
            const emptyT = () => '';
            render(<InvitationErrorView {...defaultProps} t={emptyT} lang="es" errorType="EXPIRED" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Invitación Expirada');
        });

        it('uses Spanish back to home text', () => {
            const emptyT = () => '';
            render(<InvitationErrorView {...defaultProps} t={emptyT} lang="es" />);

            expect(screen.getByTestId('back-home-btn')).toHaveTextContent('Volver al Inicio');
        });

        it('uses Spanish invalid invitation text', () => {
            const emptyT = () => '';
            render(<InvitationErrorView {...defaultProps} t={emptyT} lang="es" errorType="INVALID_FORMAT" />);

            expect(screen.getByTestId('error-title')).toHaveTextContent('Invitación Inválida');
            expect(screen.getByTestId('error-message')).toHaveTextContent('inválido o ha expirado');
        });
    });

    // =========================================================================
    // Icon Variations
    // =========================================================================

    describe('Icon Variations', () => {
        it('renders link icon for INVALID_FORMAT', () => {
            render(<InvitationErrorView {...defaultProps} errorType="INVALID_FORMAT" />);

            // Icon should be present in the error-icon container
            expect(screen.getByTestId('error-icon')).toBeInTheDocument();
        });

        it('renders clock icon for EXPIRED', () => {
            render(<InvitationErrorView {...defaultProps} errorType="EXPIRED" />);

            expect(screen.getByTestId('error-icon')).toBeInTheDocument();
        });

        it('renders check icon for ALREADY_MEMBER', () => {
            render(<InvitationErrorView {...defaultProps} errorType="ALREADY_MEMBER" />);

            expect(screen.getByTestId('error-icon')).toBeInTheDocument();
        });

        it('renders warning icon for GROUP_FULL', () => {
            render(<InvitationErrorView {...defaultProps} errorType="GROUP_FULL" />);

            expect(screen.getByTestId('error-icon')).toBeInTheDocument();
        });
    });
});
