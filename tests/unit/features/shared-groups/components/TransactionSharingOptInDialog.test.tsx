/**
 * TransactionSharingOptInDialog Tests
 *
 * Story 14d-v2-1-6d: Transaction Sharing Opt-In & Error UI
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage:
 * - AC #1: Dialog shows group name and sharing choice
 * - AC #2: "Yes, share" sets shareMyTransactions to true
 * - AC #3: "No, just statistics" sets shareMyTransactions to false
 * - AC #5: Dismiss defaults to false (privacy-first, LV-6)
 * - Task 9.2: FR-25 compliance (group name in title)
 * - Task 9.3: Clear explanation of sharing choice
 * - Task 9.4: Two radio options
 * - Task 9.5: Privacy-first default (LV-6)
 * - Task 9.6: Unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionSharingOptInDialog } from '@/features/shared-groups/components/TransactionSharingOptInDialog';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock callbacks
const mockOnJoin = vi.fn();
const mockOnCancel = vi.fn();

// Mock translation function
const mockT = (key: string, _params?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
        groupAllowsTransactionSharing: '"{group}" allows transaction sharing',
        shareMyTransactionsDescription: 'Would you like to share your transaction details with group members?',
        statisticsAlwaysShared: 'Your spending totals will always be visible in group statistics.',
        yesShareTransactions: 'Yes, share my transactions',
        yesShareTransactionsDesc: 'Members can see your individual transactions',
        noJustStatistics: 'No, just statistics',
        noJustStatisticsDesc: 'Only your totals are shared, not the details',
        privacyNoteOptIn: 'You can change this later in group settings.',
        recommended: 'Default',
        cancel: 'Cancel',
        joinGroup: 'Join Group',
        joining: 'Joining...',
        close: 'Close',
    };
    return translations[key] || key;
};

// Default props
const defaultProps = {
    open: true,
    groupName: '🏠 Household',
    groupColor: '#10b981',
    groupIcon: '🏠',
    onJoin: mockOnJoin,
    onCancel: mockOnCancel,
    isPending: false,
    t: mockT,
    lang: 'en' as const,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('TransactionSharingOptInDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // =========================================================================
    // Basic Rendering (Task 9.1, 9.2)
    // =========================================================================

    describe('Basic Rendering', () => {
        it('renders the dialog when open is true', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByTestId('optin-dialog')).toBeInTheDocument();
        });

        it('does not render when open is false', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} open={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('displays group name in title per FR-25', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            // Title should include group name (without emoji)
            expect(screen.getByText(/"Household" allows transaction sharing/)).toBeInTheDocument();
        });

        it('renders group icon with correct color', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const groupIcon = screen.getByTestId('group-icon');
            expect(groupIcon).toBeInTheDocument();
            expect(groupIcon).toHaveStyle({ backgroundColor: '#10b981' });
        });

        it('displays sharing description', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByText(/Would you like to share your transaction details/)).toBeInTheDocument();
        });

        it('displays statistics note', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByTestId('statistics-note')).toBeInTheDocument();
            expect(screen.getByText(/spending totals will always be visible/)).toBeInTheDocument();
        });

        it('displays privacy note about changing later', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByTestId('privacy-note')).toBeInTheDocument();
            expect(screen.getByText(/change this later in group settings/)).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Radio Options (Task 9.3, 9.4)
    // =========================================================================

    describe('Radio Options', () => {
        it('renders two radio options', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByTestId('share-yes-btn')).toBeInTheDocument();
            expect(screen.getByTestId('share-no-btn')).toBeInTheDocument();
        });

        it('displays "Yes, share my transactions" option', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByText('Yes, share my transactions')).toBeInTheDocument();
            expect(screen.getByText('Members can see your individual transactions')).toBeInTheDocument();
        });

        it('displays "No, just statistics" option with default label', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByText('No, just statistics')).toBeInTheDocument();
            expect(screen.getByText('Only your totals are shared, not the details')).toBeInTheDocument();
            expect(screen.getByText('Default')).toBeInTheDocument();
        });

        it('defaults to "No" option selected (privacy-first, LV-6)', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const noRadio = screen.getByTestId('share-no-btn') as HTMLInputElement;
            const yesRadio = screen.getByTestId('share-yes-btn') as HTMLInputElement;

            expect(noRadio.checked).toBe(true);
            expect(yesRadio.checked).toBe(false);
        });

        it('allows selecting "Yes" option', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const yesLabel = screen.getByTestId('option-yes-label');
            await userEvent.click(yesLabel);

            const yesRadio = screen.getByTestId('share-yes-btn') as HTMLInputElement;
            expect(yesRadio.checked).toBe(true);
        });

        it('allows switching between options', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            // Click Yes
            const yesLabel = screen.getByTestId('option-yes-label');
            await userEvent.click(yesLabel);

            let yesRadio = screen.getByTestId('share-yes-btn') as HTMLInputElement;
            expect(yesRadio.checked).toBe(true);

            // Click No
            const noLabel = screen.getByTestId('option-no-label');
            await userEvent.click(noLabel);

            yesRadio = screen.getByTestId('share-yes-btn') as HTMLInputElement;
            const noRadio = screen.getByTestId('share-no-btn') as HTMLInputElement;
            expect(noRadio.checked).toBe(true);
            expect(yesRadio.checked).toBe(false);
        });
    });

    // =========================================================================
    // Join Button (AC #2, #3)
    // =========================================================================

    describe('Join Button', () => {
        it('renders join button', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByTestId('join-btn')).toBeInTheDocument();
            expect(screen.getByText('Join Group')).toBeInTheDocument();
        });

        it('calls onJoin with false when default "No" is selected (AC #3)', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const joinBtn = screen.getByTestId('join-btn');
            await userEvent.click(joinBtn);

            expect(mockOnJoin).toHaveBeenCalledWith(false);
        });

        it('calls onJoin with true when "Yes" is selected (AC #2)', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            // Select Yes
            const yesLabel = screen.getByTestId('option-yes-label');
            await userEvent.click(yesLabel);

            // Click Join
            const joinBtn = screen.getByTestId('join-btn');
            await userEvent.click(joinBtn);

            expect(mockOnJoin).toHaveBeenCalledWith(true);
        });

        it('does not call onJoin when isPending', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} isPending={true} />);

            const joinBtn = screen.getByTestId('join-btn');
            await userEvent.click(joinBtn);

            expect(mockOnJoin).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Cancel/Dismiss (AC #5, LV-6)
    // =========================================================================

    describe('Cancel and Dismiss', () => {
        it('renders cancel button', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('calls onCancel when cancel button clicked', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            expect(mockOnCancel).toHaveBeenCalled();
        });

        it('calls onCancel when close (X) button clicked', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const closeBtn = screen.getByTestId('close-btn');
            await userEvent.click(closeBtn);

            expect(mockOnCancel).toHaveBeenCalled();
        });

        it('calls onCancel when backdrop clicked (AC #5)', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnCancel).toHaveBeenCalled();
        });

        it('does not call onCancel when backdrop clicked during pending', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} isPending={true} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnCancel).not.toHaveBeenCalled();
        });

        it('does not call onCancel when cancel button clicked during pending', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} isPending={true} />);

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            expect(mockOnCancel).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Loading State
    // =========================================================================

    describe('Loading State', () => {
        it('shows loading indicator when isPending', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
            expect(screen.getByText('Joining...')).toBeInTheDocument();
        });

        it('disables buttons during pending', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('join-btn')).toBeDisabled();
            expect(screen.getByTestId('cancel-btn')).toBeDisabled();
            expect(screen.getByTestId('close-btn')).toBeDisabled();
        });
    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', () => {
        it('has correct ARIA attributes on dialog', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby', 'optin-dialog-title');
        });

        it('closes on Escape key press', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnCancel).toHaveBeenCalled();
        });

        it('radio inputs support keyboard navigation (AC11: native radio group)', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const yesRadio = screen.getByTestId('share-yes-btn') as HTMLInputElement;
            const noRadio = screen.getByTestId('share-no-btn') as HTMLInputElement;

            // Structural prerequisites for native keyboard nav (Tab + Arrow + Space):
            // 1. Both are type="radio"
            expect(yesRadio.type).toBe('radio');
            expect(noRadio.type).toBe('radio');

            // 2. Same name groups them for arrow-key navigation
            expect(yesRadio.name).toBe('shareMyTransactions');
            expect(noRadio.name).toBe('shareMyTransactions');

            // 3. Each radio is wrapped in a <label> for click/tap accessibility
            expect(yesRadio.closest('label')).not.toBeNull();
            expect(noRadio.closest('label')).not.toBeNull();

            // 4. Click-based selection works (keyboard Space delegates to click in browsers)
            fireEvent.click(yesRadio);
            expect(yesRadio.checked).toBe(true);
            expect(noRadio.checked).toBe(false);
        });

        it('does not close on Escape during pending', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} isPending={true} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnCancel).not.toHaveBeenCalled();
        });

        it('focuses close button on open', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            await waitFor(() => {
                expect(document.activeElement).toBe(screen.getByTestId('close-btn'));
            });
        });

        it('has radiogroup role on options fieldset', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(screen.getByRole('radiogroup')).toBeInTheDocument();
        });

        it('prevents body scroll when open', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('restores body scroll when closed', () => {
            const { unmount } = render(<TransactionSharingOptInDialog {...defaultProps} />);
            unmount();

            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // State Reset on Reopen
    // =========================================================================

    describe('State Reset', () => {
        it('resets to default "No" when dialog reopens', async () => {
            const { rerender } = render(<TransactionSharingOptInDialog {...defaultProps} />);

            // Select Yes
            const yesLabel = screen.getByTestId('option-yes-label');
            await userEvent.click(yesLabel);

            // Close dialog
            rerender(<TransactionSharingOptInDialog {...defaultProps} open={false} />);

            // Reopen dialog
            rerender(<TransactionSharingOptInDialog {...defaultProps} open={true} />);

            // Should be back to default "No"
            const noRadio = screen.getByTestId('share-no-btn') as HTMLInputElement;
            expect(noRadio.checked).toBe(true);
        });
    });

    // =========================================================================
    // Spanish Language Support
    // =========================================================================

    describe('Spanish Language Support', () => {
        it('uses Spanish fallbacks when translations not provided', () => {
            const emptyT = () => '';
            render(<TransactionSharingOptInDialog {...defaultProps} t={emptyT} lang="es" />);

            expect(screen.getByText(/permite compartir transacciones/)).toBeInTheDocument();
            expect(screen.getByText('Sí, compartir mis transacciones')).toBeInTheDocument();
            expect(screen.getByText('No, solo estadísticas')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // onDismiss Prop Behavior (Story 14d-v2-1-14-polish, ECC Review #5)
    // =========================================================================

    describe('onDismiss Prop Behavior (AC3)', () => {
        const mockOnDismiss = vi.fn();

        it('calls onDismiss (not onCancel) when close (X) button clicked and onDismiss provided', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} onDismiss={mockOnDismiss} />);

            const closeBtn = screen.getByTestId('close-btn');
            await userEvent.click(closeBtn);

            expect(mockOnDismiss).toHaveBeenCalled();
            expect(mockOnCancel).not.toHaveBeenCalled();
        });

        it('calls onDismiss (not onCancel) when backdrop clicked and onDismiss provided', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} onDismiss={mockOnDismiss} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnDismiss).toHaveBeenCalled();
            expect(mockOnCancel).not.toHaveBeenCalled();
        });

        it('calls onDismiss (not onCancel) on Escape key when onDismiss provided', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} onDismiss={mockOnDismiss} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnDismiss).toHaveBeenCalled();
            expect(mockOnCancel).not.toHaveBeenCalled();
        });

        it('falls back to onCancel when onDismiss not provided and close clicked', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} />);

            const closeBtn = screen.getByTestId('close-btn');
            await userEvent.click(closeBtn);

            expect(mockOnCancel).toHaveBeenCalled();
        });

        it('still calls onCancel from Cancel button even when onDismiss provided', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} onDismiss={mockOnDismiss} />);

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            expect(mockOnCancel).toHaveBeenCalled();
            expect(mockOnDismiss).not.toHaveBeenCalled();
        });

        it('does not call onDismiss during pending state', async () => {
            render(<TransactionSharingOptInDialog {...defaultProps} onDismiss={mockOnDismiss} isPending={true} />);

            const closeBtn = screen.getByTestId('close-btn');
            await userEvent.click(closeBtn);

            expect(mockOnDismiss).not.toHaveBeenCalled();
            expect(mockOnCancel).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', () => {
        it('handles group name without emoji', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} groupName="Work Expenses" groupIcon="" />);

            expect(screen.getByText(/"Work Expenses" allows transaction sharing/)).toBeInTheDocument();
        });

        it('uses emoji from group name when groupIcon not provided', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} groupName="🎉 Party Fund" groupIcon={undefined} />);

            const groupIcon = screen.getByTestId('group-icon');
            expect(groupIcon).toHaveTextContent('🎉');
        });

        it('uses default icon when no emoji or icon provided', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} groupName="Plain Group" groupIcon={undefined} />);

            // Should render Users icon fallback
            const groupIcon = screen.getByTestId('group-icon');
            expect(groupIcon).toBeInTheDocument();
        });

        it('applies custom group color', () => {
            render(<TransactionSharingOptInDialog {...defaultProps} groupColor="#ff6b6b" />);

            const groupIcon = screen.getByTestId('group-icon');
            expect(groupIcon).toHaveStyle({ backgroundColor: '#ff6b6b' });
        });
    });
});
