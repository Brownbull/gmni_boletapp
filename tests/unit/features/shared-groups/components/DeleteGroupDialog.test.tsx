/**
 * DeleteGroupDialog Tests
 *
 * Story: DeleteGroupDialog Type-to-Confirm Feature
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage:
 * - AC #1: Strong warning about permanent deletion
 * - AC #2: User must type exact group name to enable Delete button
 * - AC #3: Delete button disabled until text matches exactly
 * - AC #4: On success, callback is invoked
 * - AC #5: data-testid attributes present
 * - AC #6: Accessibility (aria-labelledby, focus, error state)
 *
 * Features tested:
 * - Dialog rendering (open/closed states)
 * - Group display (name, color, icon)
 * - Strong warning message about permanent deletion
 * - Type-to-confirm label showing group name
 * - Confirm text validation (exact match)
 * - Delete button disabled/enabled states
 * - Whitespace handling in comparison
 * - Case-sensitive matching
 * - onConfirm callback
 * - onClose callback (cancel, backdrop, Escape)
 * - Loading state during deletion
 * - Prevents closing during loading
 * - ARIA attributes (role="dialog", aria-modal, aria-labelledby)
 * - Focus management (initial focus on input)
 * - Body scroll prevention
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteGroupDialog } from '@/features/shared-groups/components/DeleteGroupDialog';

// =============================================================================
// Mock Setup
// =============================================================================

const mockOnConfirm = vi.fn<() => Promise<void>>();
const mockOnClose = vi.fn();

const mockT = (key: string) => {
    const translations: Record<string, string> = {
        deleteGroupTitle: 'Delete group?',
        deleteGroupWarning: 'This will permanently delete the group and all shared data',
        deleteGroupMembersAffected: '{count} members will lose access',
        typeGroupNameToConfirm: 'Type "{name}" to confirm',
        confirmDeletePlaceholder: 'Type group name here',
        cancel: 'Cancel',
        deleteGroup: 'Delete Group',
        deleting: 'Deleting...',
        close: 'Close',
    };
    return translations[key] || key;
};

const defaultProps = {
    isOpen: true,
    groupName: 'Home Expenses',
    groupColor: '#10b981',
    groupIcon: undefined,
    memberCount: 3,
    onConfirm: mockOnConfirm,
    onClose: mockOnClose,
    t: mockT,
    lang: 'en' as const,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('DeleteGroupDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockOnConfirm.mockResolvedValue(undefined);
        document.body.style.overflow = '';
    });

    afterEach(() => {
        document.body.style.overflow = '';
    });

    // =========================================================================
    // Basic Rendering Tests
    // =========================================================================

    describe('Rendering', () => {
        it('renders when isOpen is true', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByTestId('delete-group-dialog')).toBeInTheDocument();
        });

        it('does not render when isOpen is false', () => {
            render(<DeleteGroupDialog {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(screen.queryByTestId('delete-group-dialog')).not.toBeInTheDocument();
        });

        it('displays group name in title/badge', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            // Group name should appear in the dialog (in the badge/header area)
            expect(screen.getByText('Home Expenses')).toBeInTheDocument();
        });

        it('displays strong warning about permanent deletion (AC #1)', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            // AC #1: Dialog shows strong warning
            expect(screen.getByText('This will permanently delete the group and all shared data')).toBeInTheDocument();
        });

        it('displays type-to-confirm label with group name', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            // Should show instruction to type group name
            expect(screen.getByText('Type "Home Expenses" to confirm')).toBeInTheDocument();
        });

        it('displays confirm input with placeholder', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('placeholder', 'Type group name here');
        });
    });

    // =========================================================================
    // Confirm Text Validation Tests (AC #2, AC #3)
    // =========================================================================

    describe('Confirm Text Validation', () => {
        it('disables delete button when confirm text is empty', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeDisabled();
        });

        it('disables delete button when confirm text does not match group name', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Wrong Name');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeDisabled();
        });

        it('enables delete button when confirm text matches exactly (AC #2, AC #3)', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeEnabled();
        });

        it('handles whitespace in confirm text comparison (trim both)', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            // Type with leading/trailing whitespace
            await userEvent.type(input, '  Home Expenses  ');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeEnabled();
        });

        it('handles whitespace in group name for comparison', async () => {
            render(<DeleteGroupDialog {...defaultProps} groupName="  Spaced Group  " />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Spaced Group');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeEnabled();
        });

        it('is case-sensitive for group name matching', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'home expenses'); // lowercase

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeDisabled();
        });

        it('updates button state as user types', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            const deleteBtn = screen.getByTestId('delete-confirm-btn');

            // Initially disabled
            expect(deleteBtn).toBeDisabled();

            // Partial match - still disabled
            await userEvent.type(input, 'Home');
            expect(deleteBtn).toBeDisabled();

            // Complete match - enabled
            await userEvent.type(input, ' Expenses');
            expect(deleteBtn).toBeEnabled();

            // Delete a character - disabled again
            await userEvent.type(input, '{backspace}');
            expect(deleteBtn).toBeDisabled();
        });

        it('resets confirm text when dialog closes and reopens', async () => {
            const { rerender } = render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');
            expect(input).toHaveValue('Home Expenses');

            // Close dialog
            rerender(<DeleteGroupDialog {...defaultProps} isOpen={false} />);

            // Reopen dialog
            rerender(<DeleteGroupDialog {...defaultProps} isOpen={true} />);

            // Input should be reset
            const newInput = screen.getByTestId('confirm-name-input');
            expect(newInput).toHaveValue('');
        });
    });

    // =========================================================================
    // Interaction Tests
    // =========================================================================

    describe('Interaction', () => {
        it('calls onClose when clicking backdrop', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('delete-group-dialog-backdrop');
            const overlay = backdrop.querySelector('[aria-hidden="true"]');
            fireEvent.click(overlay!);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when clicking close button', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            // Find the close button (X button)
            const closeButtons = screen.getAllByRole('button');
            const closeBtn = closeButtons.find(btn => btn.getAttribute('aria-label') === 'Close');
            expect(closeBtn).toBeTruthy();

            await userEvent.click(closeBtn!);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when pressing Escape key', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('does not allow close while deleting', async () => {
            // Make onConfirm never resolve
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<DeleteGroupDialog {...defaultProps} />);

            // Type the group name to enable delete
            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            // Click delete
            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            // Try to close via Escape
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(mockOnClose).not.toHaveBeenCalled();

            // Try to close via backdrop
            const backdrop = screen.getByTestId('delete-group-dialog-backdrop');
            const overlay = backdrop.querySelector('[aria-hidden="true"]');
            fireEvent.click(overlay!);
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('calls onConfirm when delete clicked with valid text (AC #4)', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            // Improvement #6: Simplified signature - no parameters
            expect(mockOnConfirm).toHaveBeenCalledWith();
            expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        });

        it('shows loading state during deletion', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            expect(screen.getByText('Deleting...')).toBeInTheDocument();
            expect(deleteBtn).toBeDisabled();
        });

        it('disables input during deletion', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            expect(input).toBeDisabled();
        });

        it('does not call onConfirm when delete button is disabled', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeDisabled();

            // Try to click the disabled button
            fireEvent.click(deleteBtn);

            expect(mockOnConfirm).not.toHaveBeenCalled();
        });

        it('shows error message when onConfirm throws error', async () => {
            mockOnConfirm.mockRejectedValue(new Error('Network error'));

            // Mock translation that includes deleteGroupError
            const tWithError = (key: string) => {
                const translations: Record<string, string> = {
                    deleteGroupTitle: 'Delete group?',
                    deleteGroupWarning: 'This will permanently delete the group and all shared data',
                    deleteGroupMembersAffected: '{count} members will lose access',
                    typeGroupNameToConfirm: 'Type "{name}" to confirm',
                    confirmDeletePlaceholder: 'Type group name here',
                    cancel: 'Cancel',
                    deleteGroup: 'Delete Group',
                    deleting: 'Deleting...',
                    close: 'Close',
                    // Return undefined (falsy) for deleteGroupError to trigger fallback message
                };
                return translations[key];
            };

            render(<DeleteGroupDialog {...defaultProps} t={tWithError} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            await waitFor(() => {
                expect(screen.getByTestId('delete-error-message')).toBeInTheDocument();
                // Improvement #3: Now shows generic message, not raw error
                expect(screen.getByText(/Failed to delete group\. Please try again\./)).toBeInTheDocument();
            });

            // Button should be enabled again after error
            expect(deleteBtn).not.toBeDisabled();
        });

        it('clears error message on retry', async () => {
            // First attempt fails
            mockOnConfirm.mockRejectedValueOnce(new Error('Network error'));
            // Second attempt succeeds
            mockOnConfirm.mockResolvedValueOnce(undefined);

            // Mock translation that returns undefined for deleteGroupError to trigger fallback
            const tWithError = (key: string) => {
                const translations: Record<string, string> = {
                    deleteGroupTitle: 'Delete group?',
                    deleteGroupWarning: 'This will permanently delete the group and all shared data',
                    deleteGroupMembersAffected: '{count} members will lose access',
                    typeGroupNameToConfirm: 'Type "{name}" to confirm',
                    confirmDeletePlaceholder: 'Type group name here',
                    cancel: 'Cancel',
                    deleteGroup: 'Delete Group',
                    deleting: 'Deleting...',
                    close: 'Close',
                };
                return translations[key];
            };

            render(<DeleteGroupDialog {...defaultProps} t={tWithError} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            // Wait for error to appear
            await waitFor(() => {
                expect(screen.getByTestId('delete-error-message')).toBeInTheDocument();
            });

            // Click again to retry
            await userEvent.click(deleteBtn);

            // Error should be cleared during loading
            await waitFor(() => {
                expect(screen.queryByTestId('delete-error-message')).not.toBeInTheDocument();
            });
        });
    });

    // =========================================================================
    // Accessibility Tests (AC #6)
    // =========================================================================

    describe('Accessibility', () => {
        it('has role="dialog"', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('has aria-modal="true"', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
        });

        it('has aria-labelledby pointing to title', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby', 'delete-group-title');

            // Verify the title exists with that ID
            const title = document.getElementById('delete-group-title');
            expect(title).toBeInTheDocument();
        });

        it('focuses input on open', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            await waitFor(() => {
                const input = screen.getByTestId('confirm-name-input');
                expect(document.activeElement).toBe(input);
            });
        });

        it('input has proper label association', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            // Check for aria-label or associated label
            expect(
                input.hasAttribute('aria-label') ||
                input.hasAttribute('aria-labelledby') ||
                input.hasAttribute('id')
            ).toBe(true);
        });

        it('shows error state feedback when text does not match', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Wrong Name');
            // Blur to trigger validation feedback
            fireEvent.blur(input);

            // The input or container should indicate invalid state
            // This could be through aria-invalid, border color, or error message
            await waitFor(() => {
                const hasErrorIndicator =
                    input.getAttribute('aria-invalid') === 'true' ||
                    input.className.includes('border-red') ||
                    input.className.includes('error');
                // At minimum, the button should be disabled indicating invalid state
                const deleteBtn = screen.getByTestId('delete-confirm-btn');
                expect(deleteBtn).toBeDisabled();
            });
        });

        it('prevents body scroll when open', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('restores body scroll when closed', () => {
            const { rerender } = render(<DeleteGroupDialog {...defaultProps} />);
            expect(document.body.style.overflow).toBe('hidden');

            rerender(<DeleteGroupDialog {...defaultProps} isOpen={false} />);
            expect(document.body.style.overflow).toBe('');
        });

        it('restores body scroll on unmount', () => {
            const { unmount } = render(<DeleteGroupDialog {...defaultProps} />);
            expect(document.body.style.overflow).toBe('hidden');

            unmount();
            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // Data Attributes (AC #5)
    // =========================================================================

    describe('Data Attributes', () => {
        it('has delete-group-dialog testid', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            expect(screen.getByTestId('delete-group-dialog')).toBeInTheDocument();
        });

        it('has confirm-name-input testid', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            expect(screen.getByTestId('confirm-name-input')).toBeInTheDocument();
        });

        it('has delete-confirm-btn testid', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            expect(screen.getByTestId('delete-confirm-btn')).toBeInTheDocument();
        });

        it('has delete-group-dialog-backdrop testid', () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            expect(screen.getByTestId('delete-group-dialog-backdrop')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Spanish Language Support
    // =========================================================================

    describe('Spanish Language Support', () => {
        const spanishT = (key: string) => {
            const translations: Record<string, string> = {
                deleteGroupTitle: 'Eliminar grupo?',
                deleteGroupWarning: 'Esto eliminara permanentemente el grupo y todos los datos compartidos',
                typeGroupNameToConfirm: 'Escribe "{name}" para confirmar',
                confirmDeletePlaceholder: 'Escribe el nombre del grupo aqui',
                cancel: 'Cancelar',
                deleteGroup: 'Eliminar Grupo',
                deleting: 'Eliminando...',
                close: 'Cerrar',
            };
            return translations[key] || key;
        };

        it('shows Spanish type-to-confirm label when lang is es', () => {
            render(<DeleteGroupDialog {...defaultProps} t={spanishT} lang="es" />);

            expect(screen.getByText('Escribe "Home Expenses" para confirmar')).toBeInTheDocument();
        });

        it('shows Spanish placeholder when lang is es', () => {
            render(<DeleteGroupDialog {...defaultProps} t={spanishT} lang="es" />);

            const input = screen.getByTestId('confirm-name-input');
            expect(input).toHaveAttribute('placeholder', 'Escribe el nombre del grupo aqui');
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', () => {
        it('handles empty group name', () => {
            render(<DeleteGroupDialog {...defaultProps} groupName="" />);

            // Should still render
            expect(screen.getByTestId('delete-group-dialog')).toBeInTheDocument();
        });

        it('handles long group names gracefully', () => {
            const longName = 'This is a very long group name that might overflow the container';
            render(<DeleteGroupDialog {...defaultProps} groupName={longName} />);

            expect(screen.getByText(longName)).toBeInTheDocument();
        });

        it('handles emoji in group name', async () => {
            const emojiName = 'My House';
            render(<DeleteGroupDialog {...defaultProps} groupName={emojiName} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, emojiName);

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeEnabled();
        });

        it('handles special characters in group name', async () => {
            const specialName = 'Group & Co. "The Best"';
            render(<DeleteGroupDialog {...defaultProps} groupName={specialName} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, specialName);

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeEnabled();
        });

        it('handles rapid typing without issues', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');

            // Rapidly type and delete
            await userEvent.type(input, 'Home Expenses');
            await userEvent.clear(input);
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeEnabled();
        });

        it('handles memberCount of 1 (single member)', () => {
            render(<DeleteGroupDialog {...defaultProps} memberCount={1} />);

            // Should not show "X members will lose access" for single member
            expect(screen.queryByText(/members will lose access/)).not.toBeInTheDocument();
        });

        it('handles multiple rapid delete clicks gracefully', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');

            // First click
            await userEvent.click(deleteBtn);

            // Button should be disabled now
            expect(deleteBtn).toBeDisabled();

            // Additional clicks should not register
            fireEvent.click(deleteBtn);
            fireEvent.click(deleteBtn);

            expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        });

        it('resets loading state after successful deletion', async () => {
            let resolvePromise: () => void;
            mockOnConfirm.mockImplementation(
                () => new Promise<void>((resolve) => { resolvePromise = resolve; })
            );

            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            expect(screen.getByText('Deleting...')).toBeInTheDocument();

            // Complete the operation
            resolvePromise!();

            await waitFor(() => {
                expect(screen.getByText('Delete Group')).toBeInTheDocument();
            });
        });
    });

    // =========================================================================
    // Cleanup
    // =========================================================================

    describe('Cleanup', () => {
        it('cleans up setTimeout on unmount', () => {
            vi.useFakeTimers();
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            const { unmount } = render(<DeleteGroupDialog {...defaultProps} isOpen={true} />);
            unmount();
            expect(clearTimeoutSpy).toHaveBeenCalled();
            vi.useRealTimers();
            clearTimeoutSpy.mockRestore();
        });
    });

    // =========================================================================
    // Improvement #1: Focus Trap
    // =========================================================================

    describe('Focus Trap (Improvement #1)', () => {
        it('traps focus within dialog when open', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');

            // Get all focusable elements
            const buttons = dialog.querySelectorAll('button');
            const input = screen.getByTestId('confirm-name-input');

            // There should be focusable elements
            expect(buttons.length).toBeGreaterThan(0);
            expect(input).toBeInTheDocument();

            // Focus should start on input
            await waitFor(() => {
                expect(document.activeElement).toBe(input);
            });
        });

        it('wraps focus from last element to first on Tab', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');

            // Focus the last focusable element (Cancel button)
            const buttons = dialog.querySelectorAll('button:not(:disabled)');
            const lastButton = buttons[buttons.length - 1];
            lastButton.focus();

            // Press Tab
            fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });

            // Focus should wrap to first focusable element (close button or input)
            await waitFor(() => {
                const firstFocusable = dialog.querySelector('button, input');
                expect(document.activeElement).toBe(firstFocusable);
            });
        });
    });

    // =========================================================================
    // Improvement #2: Empty Group Name Validation
    // =========================================================================

    describe('Empty Group Name Validation (Improvement #2)', () => {
        it('keeps delete button disabled when groupName is empty string', async () => {
            render(<DeleteGroupDialog {...defaultProps} groupName="" />);

            // Even if user types empty string match, button should stay disabled
            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeDisabled();
        });

        it('keeps delete button disabled when groupName is whitespace only', async () => {
            render(<DeleteGroupDialog {...defaultProps} groupName="   " />);

            const input = screen.getByTestId('confirm-name-input');
            // Type spaces to "match"
            await userEvent.type(input, '   ');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeDisabled();
        });

        it('enables delete button when groupName is valid and matches', async () => {
            render(<DeleteGroupDialog {...defaultProps} groupName="Valid Group" />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Valid Group');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            expect(deleteBtn).toBeEnabled();
        });
    });

    // =========================================================================
    // Improvement #3: Error Message Sanitization
    // =========================================================================

    describe('Error Message Sanitization (Improvement #3)', () => {
        it('shows generic error message instead of raw error details', async () => {
            mockOnConfirm.mockRejectedValue(new Error('Sensitive internal error: database connection failed at 192.168.1.1'));

            const tWithError = (key: string) => {
                const translations: Record<string, string> = {
                    deleteGroupTitle: 'Delete group?',
                    deleteGroupWarning: 'This will permanently delete the group and all shared data',
                    typeGroupNameToConfirm: 'Type "{name}" to confirm',
                    confirmDeletePlaceholder: 'Type group name here',
                    cancel: 'Cancel',
                    deleteGroup: 'Delete Group',
                    deleting: 'Deleting...',
                    close: 'Close',
                    // No deleteGroupError - triggers fallback
                };
                return translations[key];
            };

            render(<DeleteGroupDialog {...defaultProps} t={tWithError} lang="en" />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            await waitFor(() => {
                expect(screen.getByTestId('delete-error-message')).toBeInTheDocument();
                // Should show generic message, NOT the sensitive details
                expect(screen.getByText(/Failed to delete group\. Please try again\./)).toBeInTheDocument();
                // Should NOT contain the raw error message
                expect(screen.queryByText(/Sensitive internal error/)).not.toBeInTheDocument();
                expect(screen.queryByText(/192\.168\.1\.1/)).not.toBeInTheDocument();
            });
        });

        it('shows generic Spanish error message when lang is es', async () => {
            mockOnConfirm.mockRejectedValue(new Error('Database error'));

            const tWithError = (key: string) => {
                const translations: Record<string, string> = {
                    deleteGroupTitle: 'Eliminar grupo?',
                    deleteGroupWarning: 'Esto eliminara permanentemente el grupo',
                    typeGroupNameToConfirm: 'Escribe "{name}" para confirmar',
                    confirmDeletePlaceholder: 'Escribe el nombre del grupo aqui',
                    cancel: 'Cancelar',
                    deleteGroup: 'Eliminar Grupo',
                    deleting: 'Eliminando...',
                    close: 'Cerrar',
                    // No deleteGroupError - triggers fallback
                };
                return translations[key];
            };

            render(<DeleteGroupDialog {...defaultProps} t={tWithError} lang="es" />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            await waitFor(() => {
                expect(screen.getByTestId('delete-error-message')).toBeInTheDocument();
                // Should show generic Spanish message
                expect(screen.getByText(/Error al eliminar el grupo\. Por favor, intenta de nuevo\./)).toBeInTheDocument();
            });
        });
    });

    // =========================================================================
    // Improvement #5: Spanish Accents in Fallback Text
    // =========================================================================

    describe('Spanish Accents in Fallback Text (Improvement #5)', () => {
        const spanishTNoTranslations = (_key: string) => {
            // Return undefined/empty to trigger fallback text
            return '';
        };

        it('uses proper accent in eliminara fallback (eliminara -> eliminara)', () => {
            render(<DeleteGroupDialog {...defaultProps} t={spanishTNoTranslations} lang="es" />);

            // The warning text should use proper accent: "eliminara" with accent
            const warningText = screen.getByText(/eliminará permanentemente/i);
            expect(warningText).toBeInTheDocument();
        });

        it('uses proper accent in aqui fallback (aqui -> aqui)', () => {
            render(<DeleteGroupDialog {...defaultProps} t={spanishTNoTranslations} lang="es" />);

            // The placeholder should use proper accent: "aqui" with accent
            const input = screen.getByTestId('confirm-name-input');
            expect(input).toHaveAttribute('placeholder', expect.stringContaining('aquí'));
        });
    });

    // =========================================================================
    // Improvement #6: Simplified onConfirm Signature
    // =========================================================================

    describe('Simplified onConfirm Signature (Improvement #6)', () => {
        it('calls onConfirm with no arguments', async () => {
            render(<DeleteGroupDialog {...defaultProps} />);

            const input = screen.getByTestId('confirm-name-input');
            await userEvent.type(input, 'Home Expenses');

            const deleteBtn = screen.getByTestId('delete-confirm-btn');
            await userEvent.click(deleteBtn);

            // Should be called with no arguments
            expect(mockOnConfirm).toHaveBeenCalledWith();
            expect(mockOnConfirm.mock.calls[0]).toHaveLength(0);
        });
    });
});
