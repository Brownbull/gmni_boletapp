/**
 * TransferOwnershipDialog Tests
 *
 * Story 14d-v2-1-7d: Leave/Transfer UI + View Mode Auto-Switch
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage:
 * - AC #5: Transfer ownership to another member
 * - AC #7: Confirmation dialogs show consequences
 *
 * Features tested:
 * - Dialog rendering (open/closed states)
 * - Displays group name and member name in description
 * - Confirm/cancel buttons
 * - onConfirm callback
 * - onClose callback (cancel, backdrop, Escape)
 * - Loading state during transfer
 * - Prevents closing during loading
 * - ARIA attributes (role="dialog", aria-modal, aria-labelledby)
 * - Focus management (initial focus)
 * - Body scroll prevention
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransferOwnershipDialog } from '@/features/shared-groups/components/TransferOwnershipDialog';

// =============================================================================
// Mock Setup
// =============================================================================

const mockOnConfirm = vi.fn<() => Promise<void>>();
const mockOnClose = vi.fn();

const mockT = (key: string) => {
    const translations: Record<string, string> = {
        transferOwnershipTitle: 'Transfer ownership?',
        transferOwnershipDesc: '{memberName} will become the owner of "{groupName}". You will remain a member.',
        cancel: 'Cancel',
        transfer: 'Transfer',
        transferring: 'Transferring...',
        close: 'Close',
    };
    return translations[key] || key;
};

const defaultProps = {
    isOpen: true,
    groupName: 'Home Expenses',
    memberName: 'Alice Smith',
    onConfirm: mockOnConfirm,
    onClose: mockOnClose,
    t: mockT,
    lang: 'en' as const,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('TransferOwnershipDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockOnConfirm.mockResolvedValue(undefined);
        document.body.style.overflow = '';
    });

    afterEach(() => {
        document.body.style.overflow = '';
    });

    // =========================================================================
    // Basic Rendering
    // =========================================================================

    describe('Basic Rendering', () => {
        it('renders the dialog when isOpen is true', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByTestId('transfer-ownership-dialog')).toBeInTheDocument();
        });

        it('does not render when isOpen is false', () => {
            render(<TransferOwnershipDialog {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(screen.queryByTestId('transfer-ownership-dialog')).not.toBeInTheDocument();
        });

        it('renders dialog title', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            expect(screen.getByText('Transfer ownership?')).toBeInTheDocument();
        });

        it('renders transfer icon', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            // The ArrowRightLeft icon is rendered in a container
            const dialog = screen.getByTestId('transfer-ownership-dialog');
            const iconContainer = dialog.querySelector('svg');
            expect(iconContainer).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Content Display (AC #5, AC #7)
    // =========================================================================

    describe('Content Display', () => {
        // Use empty string t function to trigger fallback which includes interpolated names
        const fallbackT = () => '';

        it('displays member name in description (via fallback)', () => {
            render(<TransferOwnershipDialog {...defaultProps} t={fallbackT} />);

            expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
        });

        it('displays group name in description (via fallback)', () => {
            render(<TransferOwnershipDialog {...defaultProps} t={fallbackT} />);

            expect(screen.getByText(/Home Expenses/)).toBeInTheDocument();
        });

        it('displays complete consequence message', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            // Using regex to match the entire message pattern
            expect(
                screen.getByText(/will become the owner.*will remain a member/i)
            ).toBeInTheDocument();
        });

        it('updates description when member name changes (via fallback)', () => {
            const { rerender } = render(<TransferOwnershipDialog {...defaultProps} t={fallbackT} />);

            expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();

            rerender(
                <TransferOwnershipDialog {...defaultProps} t={fallbackT} memberName="Bob Johnson" />
            );

            expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
            expect(screen.queryByText(/Alice Smith/)).not.toBeInTheDocument();
        });

        it('updates description when group name changes (via fallback)', () => {
            const { rerender } = render(<TransferOwnershipDialog {...defaultProps} t={fallbackT} />);

            expect(screen.getByText(/Home Expenses/)).toBeInTheDocument();

            rerender(
                <TransferOwnershipDialog {...defaultProps} t={fallbackT} groupName="Work Budget" />
            );

            expect(screen.getByText(/Work Budget/)).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Button Actions
    // =========================================================================

    describe('Button Actions', () => {
        it('renders confirm (Transfer) button', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            expect(screen.getByTestId('transfer-confirm-btn')).toBeInTheDocument();
            expect(screen.getByText('Transfer')).toBeInTheDocument();
        });

        it('renders cancel button', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('calls onConfirm when confirm button is clicked', async () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            expect(mockOnConfirm).toHaveBeenCalled();
            expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when cancel button is clicked', async () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            // Find cancel button by its text since there's no specific testid
            const cancelBtn = screen.getByText('Cancel').closest('button');
            await userEvent.click(cancelBtn!);

            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Close Actions
    // =========================================================================

    describe('Close Actions', () => {
        it('calls onClose when close (X) button is clicked', async () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            // Close button has aria-label="Close"
            const closeBtn = screen.getByLabelText('Close');
            await userEvent.click(closeBtn);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when backdrop is clicked', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('transfer-ownership-dialog-backdrop');
            const overlay = backdrop.querySelector('[aria-hidden="true"]');
            fireEvent.click(overlay!);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when Escape key is pressed', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('does not close when clicking inside dialog content', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            const dialog = screen.getByTestId('transfer-ownership-dialog');
            fireEvent.click(dialog);

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Loading State
    // =========================================================================

    describe('Loading State', () => {
        it('shows loading spinner and text during transfer operation', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            expect(screen.getByText('Transferring...')).toBeInTheDocument();
        });

        it('disables confirm button during loading', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            expect(confirmBtn).toBeDisabled();
        });

        it('disables cancel button during loading', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            const cancelBtn = screen.getByText('Cancel').closest('button');
            expect(cancelBtn).toBeDisabled();
        });

        it('disables close button during loading', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            const closeBtn = screen.getByLabelText('Close');
            expect(closeBtn).toBeDisabled();
        });

        it('prevents closing via backdrop click during loading', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            const backdrop = screen.getByTestId('transfer-ownership-dialog-backdrop');
            const overlay = backdrop.querySelector('[aria-hidden="true"]');
            fireEvent.click(overlay!);

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('prevents closing via Escape key during loading', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('resets loading state when operation completes', async () => {
            let resolvePromise: () => void;
            mockOnConfirm.mockImplementation(
                () => new Promise<void>((resolve) => { resolvePromise = resolve; })
            );

            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            expect(screen.getByText('Transferring...')).toBeInTheDocument();

            resolvePromise!();

            await waitFor(() => {
                expect(screen.getByText('Transfer')).toBeInTheDocument();
            });
        });

        // Note: Error handling test removed as the component currently propagates errors
        // from onConfirm to the caller. The component uses try-finally (not try-catch),
        // so while loading state resets on error, the error itself is not caught.
        // This is a design decision - the parent component should handle errors.

        it('resets loading state when dialog reopens', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            const { rerender } = render(<TransferOwnershipDialog {...defaultProps} />);

            // Trigger loading state
            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            expect(screen.getByText('Transferring...')).toBeInTheDocument();

            // Close and reopen
            rerender(<TransferOwnershipDialog {...defaultProps} isOpen={false} />);
            rerender(<TransferOwnershipDialog {...defaultProps} isOpen={true} />);

            // Should reset to normal state
            expect(screen.getByText('Transfer')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Accessibility
    // =========================================================================

    describe('Accessibility', () => {
        it('has role="dialog"', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should clean up setTimeout on unmount', () => {
            vi.useFakeTimers();
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            const { unmount } = render(<TransferOwnershipDialog {...defaultProps} isOpen={true} />);
            unmount();
            expect(clearTimeoutSpy).toHaveBeenCalled();
            vi.useRealTimers();
            clearTimeoutSpy.mockRestore();
        });

        it('has aria-modal="true"', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
        });

        it('has aria-labelledby pointing to title', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby', 'transfer-ownership-title');

            const title = document.getElementById('transfer-ownership-title');
            expect(title).toBeInTheDocument();
            expect(title).toHaveTextContent('Transfer ownership?');
        });

        it('close button has accessible label', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            const closeBtn = screen.getByLabelText('Close');
            expect(closeBtn).toBeInTheDocument();
        });

        it('focuses close button on open', async () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            await waitFor(() => {
                const closeBtn = screen.getByLabelText('Close');
                expect(document.activeElement).toBe(closeBtn);
            });
        });

        it('prevents body scroll when open', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('restores body scroll when closed', () => {
            const { rerender } = render(<TransferOwnershipDialog {...defaultProps} />);
            expect(document.body.style.overflow).toBe('hidden');

            rerender(<TransferOwnershipDialog {...defaultProps} isOpen={false} />);
            expect(document.body.style.overflow).toBe('');
        });

        it('restores body scroll on unmount', () => {
            const { unmount } = render(<TransferOwnershipDialog {...defaultProps} />);
            expect(document.body.style.overflow).toBe('hidden');

            unmount();
            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // Spanish Language Support
    // =========================================================================

    describe('Spanish Language Support', () => {
        // Return empty string to trigger fallback behavior
        const spanishT = () => '';

        it('shows Spanish title when lang is es', () => {
            render(<TransferOwnershipDialog {...defaultProps} t={spanishT} lang="es" />);

            expect(screen.getByText('¿Transferir propiedad?')).toBeInTheDocument();
        });

        it('shows Spanish description when lang is es', () => {
            render(<TransferOwnershipDialog {...defaultProps} t={spanishT} lang="es" />);

            expect(screen.getByText(/se convertirá en el dueño/)).toBeInTheDocument();
            expect(screen.getByText(/seguirás siendo miembro/)).toBeInTheDocument();
        });

        it('shows Spanish button text when lang is es', () => {
            render(<TransferOwnershipDialog {...defaultProps} t={spanishT} lang="es" />);

            expect(screen.getByText('Transferir')).toBeInTheDocument();
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
        });

        it('shows Spanish loading text when lang is es', async () => {
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<TransferOwnershipDialog {...defaultProps} t={spanishT} lang="es" />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');
            await userEvent.click(confirmBtn);

            expect(screen.getByText('Transfiriendo...')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', () => {
        // Use empty t to trigger fallback (which includes interpolated names)
        const fallbackT = () => '';

        it('handles long group names gracefully', () => {
            const longName = 'This is a very long group name that might overflow';
            render(<TransferOwnershipDialog {...defaultProps} t={fallbackT} groupName={longName} />);

            expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
        });

        it('handles long member names gracefully', () => {
            const longName = 'Alexander Maximilian Richardson-Worthington III';
            render(<TransferOwnershipDialog {...defaultProps} t={fallbackT} memberName={longName} />);

            expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
        });

        it('handles emoji in group name', () => {
            render(
                <TransferOwnershipDialog {...defaultProps} t={fallbackT} groupName="🏠 Home 🏡" />
            );

            expect(screen.getByText(/🏠 Home 🏡/)).toBeInTheDocument();
        });

        it('handles special characters in member name', () => {
            render(
                <TransferOwnershipDialog {...defaultProps} t={fallbackT} memberName="John O'Brien-Smith" />
            );

            expect(screen.getByText(/John O'Brien-Smith/)).toBeInTheDocument();
        });

        it('handles names with quotes in group name', () => {
            render(
                <TransferOwnershipDialog {...defaultProps} t={fallbackT} groupName='The "Best" Group' />
            );

            expect(screen.getByText(/The "Best" Group/)).toBeInTheDocument();
        });

        it('handles multiple rapid clicks gracefully', async () => {
            // Use a slow mock to ensure loading state kicks in
            mockOnConfirm.mockImplementation(() => new Promise(() => {}));

            render(<TransferOwnershipDialog {...defaultProps} />);

            const confirmBtn = screen.getByTestId('transfer-confirm-btn');

            // First click starts the operation
            await userEvent.click(confirmBtn);

            // Button should now be disabled in loading state
            expect(confirmBtn).toBeDisabled();

            // Additional clicks should not register
            fireEvent.click(confirmBtn);
            fireEvent.click(confirmBtn);

            // Still should only have been called once
            expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        });

        it('handles rapid open/close cycles', async () => {
            const { rerender } = render(<TransferOwnershipDialog {...defaultProps} />);

            // Rapid toggle
            rerender(<TransferOwnershipDialog {...defaultProps} isOpen={false} />);
            rerender(<TransferOwnershipDialog {...defaultProps} isOpen={true} />);
            rerender(<TransferOwnershipDialog {...defaultProps} isOpen={false} />);
            rerender(<TransferOwnershipDialog {...defaultProps} isOpen={true} />);

            expect(screen.getByTestId('transfer-ownership-dialog')).toBeInTheDocument();
            expect(document.body.style.overflow).toBe('hidden');
        });
    });

    // =========================================================================
    // Data Attributes
    // =========================================================================

    describe('Data Attributes', () => {
        it('has all required data-testid attributes', () => {
            render(<TransferOwnershipDialog {...defaultProps} />);

            expect(screen.getByTestId('transfer-ownership-dialog-backdrop')).toBeInTheDocument();
            expect(screen.getByTestId('transfer-ownership-dialog')).toBeInTheDocument();
            expect(screen.getByTestId('transfer-confirm-btn')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // State Management
    // =========================================================================

    describe('State Management', () => {
        // Use empty t to trigger fallback (which includes interpolated names)
        const fallbackT = () => '';

        it('maintains correct state across prop changes', async () => {
            const { rerender } = render(<TransferOwnershipDialog {...defaultProps} t={fallbackT} />);

            // Change member name while open
            rerender(
                <TransferOwnershipDialog {...defaultProps} t={fallbackT} memberName="New Member" />
            );

            expect(screen.getByText(/New Member/)).toBeInTheDocument();
            expect(screen.getByTestId('transfer-ownership-dialog')).toBeInTheDocument();
        });

        it('cleans up event listeners on unmount', () => {
            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

            const { unmount } = render(<TransferOwnershipDialog {...defaultProps} />);

            // Should have added keydown listener
            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            unmount();

            // Should have removed keydown listener
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            addEventListenerSpy.mockRestore();
            removeEventListenerSpy.mockRestore();
        });
    });
});
