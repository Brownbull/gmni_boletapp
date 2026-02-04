/**
 * CreateGroupDialog Tests
 *
 * Story 14d-v2-1-4c-1: Core Dialog & Entry Point
 * Story 14d-v2-1-4c-2: Enhanced Features & BC-1 Limits
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage:
 * - AC #1: Dialog renders with name input and toggle
 * - AC #2: Validation errors (short name, long name)
 * - AC #3: Loading state displayed during creation
 * - Dialog closes on cancel
 * - Accessibility (keyboard navigation, ARIA)
 * - Story 14d-v2-1-4c-2:
 *   - BC-1 limit enforcement (disables button, shows warning)
 *   - Discard confirmation when closing with unsaved changes
 *   - Error display with retry option
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateGroupDialog } from '@/features/shared-groups/components/CreateGroupDialog';

// =============================================================================
// Mock Setup
// =============================================================================

const mockOnCreate = vi.fn();
const mockOnClose = vi.fn();
const mockOnResetError = vi.fn();

const mockT = (key: string) => {
    const translations: Record<string, string> = {
        createGroup: 'Create Group',
        groupName: 'Group Name',
        groupNamePlaceholder: 'e.g., 🏠 Home Expenses',
        transactionSharing: 'Transaction Sharing',
        transactionSharingDescription: 'When enabled, members can choose to share their individual transaction details with the group.',
        cancel: 'Cancel',
        create: 'Create',
        creating: 'Creating...',
        close: 'Close',
        nameMinLength: 'Name must be at least 2 characters',
        nameMaxLength: 'Name must be 50 characters or less',
        // Story 14d-v2-1-4c-2 translations
        discardGroupCreation: 'Discard group creation?',
        discardGroupBody: 'You have unsaved changes. Are you sure you want to discard?',
        keepEditing: 'Keep Editing',
        discard: 'Discard',
        groupLimitReached: "You've reached the maximum of 10 groups",
        groupLimitTooltip: 'Limit of 10 groups reached. Leave a group to create a new one.',
        createGroupError: 'Error creating group',
        retry: 'Retry',
    };
    return translations[key] || key;
};

const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onCreate: mockOnCreate,
    t: mockT,
    isPending: false,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('CreateGroupDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockOnResetError.mockClear();
    });

    // =========================================================================
    // AC #1: Dialog renders with name input and toggle
    // =========================================================================

    describe('AC #1: Basic Rendering', () => {
        it('renders the dialog when open is true', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByTestId('create-group-dialog')).toBeInTheDocument();
        });

        it('does not render when open is false', () => {
            render(<CreateGroupDialog {...defaultProps} open={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders group name input field', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            expect(nameInput).toBeInTheDocument();
            expect(nameInput).toHaveAttribute('placeholder', 'e.g., 🏠 Home Expenses');
        });

        it('renders transaction sharing toggle', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            expect(screen.getByTestId('transaction-sharing-toggle')).toBeInTheDocument();
            expect(screen.getByText('Transaction Sharing')).toBeInTheDocument();
        });

        it('renders transaction sharing helper text', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            expect(screen.getByText(/When enabled, members can choose/)).toBeInTheDocument();
        });

        it('renders cancel and create buttons', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
            expect(screen.getByTestId('create-btn')).toBeInTheDocument();
        });

        it('defaults transaction sharing toggle to enabled', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            expect(toggle).toBeChecked();
        });
    });

    // =========================================================================
    // AC #2: Validation
    // =========================================================================

    describe('AC #2: Name Validation', () => {
        it('shows error for names shorter than 2 characters', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'A');

            expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
        });

        it('shows error for names longer than 50 characters', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            const longName = 'A'.repeat(51);
            await userEvent.type(nameInput, longName);

            expect(screen.getByText('Name must be 50 characters or less')).toBeInTheDocument();
        });

        it('does not show error for valid names (2-50 chars)', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Home Expenses');

            expect(screen.queryByText('Name must be at least 2 characters')).not.toBeInTheDocument();
            expect(screen.queryByText('Name must be 50 characters or less')).not.toBeInTheDocument();
        });

        it('validates trimmed name (whitespace only is invalid)', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, '   ');

            expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
        });

        it('shows character counter', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Test');

            expect(screen.getByTestId('char-counter')).toHaveTextContent('4/50');
        });

        it('disables create button when name is invalid', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const createBtn = screen.getByTestId('create-btn');
            expect(createBtn).toBeDisabled(); // Empty name is invalid

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'A');

            expect(createBtn).toBeDisabled(); // Still invalid (1 char)
        });

        it('enables create button when name is valid', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'AB');

            const createBtn = screen.getByTestId('create-btn');
            expect(createBtn).not.toBeDisabled();
        });
    });

    // =========================================================================
    // AC #3: Loading State
    // =========================================================================

    describe('AC #3: Loading State', () => {
        it('shows loading indicator when isPending is true', async () => {
            render(<CreateGroupDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
            expect(screen.getByText('Creating...')).toBeInTheDocument();
        });

        it('disables buttons during loading', () => {
            render(<CreateGroupDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('create-btn')).toBeDisabled();
            expect(screen.getByTestId('cancel-btn')).toBeDisabled();
        });

        it('disables name input during loading', () => {
            render(<CreateGroupDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('group-name-input')).toBeDisabled();
        });

        it('disables toggle during loading', () => {
            render(<CreateGroupDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('transaction-sharing-toggle')).toBeDisabled();
        });

        it('prevents closing via backdrop click during loading', () => {
            render(<CreateGroupDialog {...defaultProps} isPending={true} />);

            const backdrop = screen.getByTestId('create-group-dialog-backdrop');
            fireEvent.click(backdrop);

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('prevents closing via Escape key during loading', () => {
            render(<CreateGroupDialog {...defaultProps} isPending={true} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Interaction Tests
    // =========================================================================

    describe('Interactions', () => {
        it('calls onCreate with trimmed name and sharing enabled', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, '  Home Expenses  ');

            const createBtn = screen.getByTestId('create-btn');
            await userEvent.click(createBtn);

            expect(mockOnCreate).toHaveBeenCalledWith({
                name: 'Home Expenses',
                transactionSharingEnabled: true,
            });
        });

        it('calls onCreate with sharing disabled when toggle is off', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Home Expenses');

            const toggle = screen.getByTestId('transaction-sharing-toggle');
            await userEvent.click(toggle); // Turn off

            const createBtn = screen.getByTestId('create-btn');
            await userEvent.click(createBtn);

            expect(mockOnCreate).toHaveBeenCalledWith({
                name: 'Home Expenses',
                transactionSharingEnabled: false,
            });
        });

        it('calls onClose when cancel button is clicked', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when backdrop is clicked', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when Escape key is pressed', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('toggles transaction sharing state', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const toggle = screen.getByTestId('transaction-sharing-toggle');

            // Initially enabled
            expect(toggle).toBeChecked();

            // Click to disable
            await userEvent.click(toggle);
            expect(toggle).not.toBeChecked();

            // Click to enable again
            await userEvent.click(toggle);
            expect(toggle).toBeChecked();
        });

        it('resets state when dialog reopens', async () => {
            const { rerender } = render(<CreateGroupDialog {...defaultProps} />);

            // Enter some data
            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Test Group');

            // Close dialog
            rerender(<CreateGroupDialog {...defaultProps} open={false} />);

            // Reopen dialog
            rerender(<CreateGroupDialog {...defaultProps} open={true} />);

            // State should be reset
            const newNameInput = screen.getByTestId('group-name-input');
            expect(newNameInput).toHaveValue('');
        });
    });

    // =========================================================================
    // Accessibility Tests
    // =========================================================================

    describe('Accessibility', () => {
        it('has correct ARIA attributes', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby');
        });

        it('focuses the close button on open', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            await waitFor(() => {
                expect(document.activeElement).toBe(screen.getByLabelText('Close'));
            });
        });

        it('prevents body scroll when open', () => {
            render(<CreateGroupDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('restores body scroll when closed', () => {
            const { unmount } = render(<CreateGroupDialog {...defaultProps} />);
            unmount();

            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // Story 14d-v2-1-4c-2: BC-1 Limit Enforcement (AC #1)
    // =========================================================================

    describe('BC-1 Limit Enforcement', () => {
        it('shows limit warning when canCreate is false', () => {
            render(<CreateGroupDialog {...defaultProps} canCreate={false} maxGroups={10} />);

            expect(screen.getByTestId('limit-warning')).toBeInTheDocument();
            expect(screen.getByText("You've reached the maximum of 10 groups")).toBeInTheDocument();
        });

        it('shows tooltip text explaining the limit', () => {
            render(<CreateGroupDialog {...defaultProps} canCreate={false} maxGroups={10} />);

            expect(screen.getByText(/Limit of 10 groups reached/)).toBeInTheDocument();
        });

        it('disables create button when canCreate is false', async () => {
            render(<CreateGroupDialog {...defaultProps} canCreate={false} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Valid Name');

            const createBtn = screen.getByTestId('create-btn');
            expect(createBtn).toBeDisabled();
        });

        it('adds title attribute to button when canCreate is false', async () => {
            render(<CreateGroupDialog {...defaultProps} canCreate={false} maxGroups={10} />);

            const createBtn = screen.getByTestId('create-btn');
            expect(createBtn).toHaveAttribute('title');
        });

        it('does not show limit warning when canCreate is true', () => {
            render(<CreateGroupDialog {...defaultProps} canCreate={true} />);

            expect(screen.queryByTestId('limit-warning')).not.toBeInTheDocument();
        });

        it('prevents form submission when limit is reached', async () => {
            render(<CreateGroupDialog {...defaultProps} canCreate={false} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Valid Name');

            const createBtn = screen.getByTestId('create-btn');
            await userEvent.click(createBtn);

            expect(mockOnCreate).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Story 14d-v2-1-4c-2: Discard Confirmation (AC #4)
    // =========================================================================

    describe('Discard Confirmation', () => {
        it('shows discard confirmation when closing with unsaved changes', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            // Enter some text (creates unsaved changes)
            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Home Expenses');

            // Try to close via cancel button
            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            // Should show discard confirmation
            expect(screen.getByTestId('discard-confirm-dialog')).toBeInTheDocument();
            expect(screen.getByText('Discard group creation?')).toBeInTheDocument();
            expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
        });

        it('shows discard confirmation when clicking backdrop with changes', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Home');

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(screen.getByTestId('discard-confirm-dialog')).toBeInTheDocument();
        });

        it('shows discard confirmation when pressing Escape with changes', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Home');

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(screen.getByTestId('discard-confirm-dialog')).toBeInTheDocument();
        });

        it('does not show discard confirmation when closing without changes', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            expect(screen.queryByTestId('discard-confirm-dialog')).not.toBeInTheDocument();
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('keeps dialog open when clicking "Keep Editing"', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Home');

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            // Click Keep Editing
            const keepEditingBtn = screen.getByTestId('keep-editing-btn');
            await userEvent.click(keepEditingBtn);

            // Discard dialog should be gone
            expect(screen.queryByTestId('discard-confirm-dialog')).not.toBeInTheDocument();
            // Main dialog should still be visible
            expect(screen.getByTestId('create-group-dialog')).toBeInTheDocument();
            // Input should still have the value
            expect(screen.getByTestId('group-name-input')).toHaveValue('Home');
            // onClose should NOT have been called
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('closes dialog and clears input when clicking "Discard"', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Home');

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            // Click Discard
            const discardBtn = screen.getByTestId('discard-btn');
            await userEvent.click(discardBtn);

            // onClose should have been called
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('closes discard dialog when clicking its backdrop', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Home');

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            // Click discard dialog backdrop (same as Keep Editing)
            const discardBackdrop = screen.getByTestId('discard-confirm-backdrop');
            fireEvent.click(discardBackdrop.querySelector('[aria-hidden="true"]')!);

            // Discard dialog should be gone
            expect(screen.queryByTestId('discard-confirm-dialog')).not.toBeInTheDocument();
            // onClose should NOT have been called
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('considers whitespace-only input as no changes', async () => {
            render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, '   ');

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            // Should NOT show discard confirmation (whitespace = no real changes)
            expect(screen.queryByTestId('discard-confirm-dialog')).not.toBeInTheDocument();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Story 14d-v2-1-4c-2: Error Display (AC #3)
    // =========================================================================

    describe('Error Display', () => {
        it('shows error display when hasError is true', () => {
            render(
                <CreateGroupDialog
                    {...defaultProps}
                    hasError={true}
                    errorMessage="Network error occurred"
                />
            );

            expect(screen.getByTestId('error-display')).toBeInTheDocument();
            expect(screen.getByText('Error creating group')).toBeInTheDocument();
            expect(screen.getByText('Network error occurred')).toBeInTheDocument();
        });

        it('shows error title without message when errorMessage is empty', () => {
            render(<CreateGroupDialog {...defaultProps} hasError={true} />);

            expect(screen.getByTestId('error-display')).toBeInTheDocument();
            expect(screen.getByText('Error creating group')).toBeInTheDocument();
        });

        it('does not show error display when hasError is false', () => {
            render(<CreateGroupDialog {...defaultProps} hasError={false} />);

            expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
        });

        it('calls onResetError when form is submitted', async () => {
            render(
                <CreateGroupDialog
                    {...defaultProps}
                    hasError={true}
                    errorMessage="Previous error"
                    onResetError={mockOnResetError}
                />
            );

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'Valid Name');

            const createBtn = screen.getByTestId('create-btn');
            await userEvent.click(createBtn);

            expect(mockOnResetError).toHaveBeenCalled();
            expect(mockOnCreate).toHaveBeenCalled();
        });

        it('preserves input when showing error (for retry)', async () => {
            const { rerender } = render(<CreateGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.type(nameInput, 'My Group');

            // Simulate error state after failed creation
            rerender(
                <CreateGroupDialog
                    {...defaultProps}
                    hasError={true}
                    errorMessage="Failed to create"
                />
            );

            // Input should still have the value
            expect(screen.getByTestId('group-name-input')).toHaveValue('My Group');
        });
    });
});
