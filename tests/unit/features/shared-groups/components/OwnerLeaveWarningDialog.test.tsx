/**
 * OwnerLeaveWarningDialog Component Tests
 *
 * Story 14d-v2-1-7d: Leave/Transfer UI + View Mode Auto-Switch
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests for the owner leave warning dialog component:
 * - Rendering and display
 * - User interactions (manage members, delete group, close)
 * - Keyboard accessibility (Escape key)
 * - ARIA attributes
 * - Translation support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OwnerLeaveWarningDialog } from '@/features/shared-groups/components/OwnerLeaveWarningDialog';

// =============================================================================
// Test Setup
// =============================================================================

const mockT = vi.fn((key: string) => key);
const mockOnManageMembers = vi.fn();
const mockOnDeleteGroup = vi.fn();
const mockOnClose = vi.fn();

const defaultProps = {
    isOpen: true,
    groupName: 'Family Budget',
    groupColor: '#10b981',
    groupIcon: '👨‍👩‍👧',
    onManageMembers: mockOnManageMembers,
    onDeleteGroup: mockOnDeleteGroup,
    onClose: mockOnClose,
    t: mockT,
    lang: 'en' as const,
};

describe('OwnerLeaveWarningDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
        document.body.style.overflow = '';
    });

    // =========================================================================
    // Rendering Tests
    // =========================================================================

    describe('Rendering', () => {
        it('should render nothing when isOpen is false', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} isOpen={false} />);

            expect(screen.queryByTestId('owner-leave-warning-dialog')).not.toBeInTheDocument();
        });

        it('should render dialog when isOpen is true', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByTestId('owner-leave-warning-dialog')).toBeInTheDocument();
        });

        it('should display group name', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByText('Family Budget')).toBeInTheDocument();
        });

        it('should display group icon when provided', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByText('👨‍👩‍👧')).toBeInTheDocument();
        });

        it('should display default Crown icon when no groupIcon provided', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} groupIcon={undefined} />);

            // Crown icon is rendered as SVG
            expect(screen.getByTestId('owner-leave-warning-dialog')).toBeInTheDocument();
        });

        it('should apply group color to icon container', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            const iconContainer = screen.getByText('👨‍👩‍👧').closest('div');
            expect(iconContainer).toHaveStyle({ backgroundColor: '#10b981' });
        });

        it('should display manage members button', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByTestId('manage-members-btn')).toBeInTheDocument();
        });

        it('should display delete group button', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByTestId('delete-group-btn')).toBeInTheDocument();
        });

        it('should display options list', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByText('ownerLeaveWarningOption1')).toBeInTheDocument();
            expect(screen.getByText('ownerLeaveWarningOption2')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Interaction Tests
    // =========================================================================

    describe('User Interactions', () => {
        it('should call onManageMembers when manage members button is clicked', async () => {
            const user = userEvent.setup();
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            await user.click(screen.getByTestId('manage-members-btn'));

            expect(mockOnManageMembers).toHaveBeenCalledTimes(1);
        });

        it('should call onDeleteGroup when delete button is clicked', async () => {
            const user = userEvent.setup();
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            await user.click(screen.getByTestId('delete-group-btn'));

            expect(mockOnDeleteGroup).toHaveBeenCalledTimes(1);
        });

        it('should call onClose when backdrop is clicked', async () => {
            const user = userEvent.setup();
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('owner-leave-warning-backdrop').querySelector('[aria-hidden="true"]');
            await user.click(backdrop!);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should call onClose when close button is clicked', async () => {
            const user = userEvent.setup();
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            // Find close button by aria-label
            const closeButton = screen.getByLabelText('close');
            await user.click(closeButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should not close when clicking inside the modal', async () => {
            const user = userEvent.setup();
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            await user.click(screen.getByTestId('owner-leave-warning-dialog'));

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Keyboard Accessibility Tests
    // =========================================================================

    describe('Keyboard Accessibility', () => {
        it('should close dialog when Escape key is pressed', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should not respond to Escape when dialog is closed', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} isOpen={false} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('should focus close button on open', async () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            // Wait for focus to be set
            await vi.waitFor(() => {
                expect(document.activeElement).toBe(screen.getByLabelText('close'));
            });
        });
    });

    // =========================================================================
    // ARIA & Accessibility Tests
    // =========================================================================

    describe('ARIA Attributes', () => {
        it('should have role="dialog"', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should clean up setTimeout on unmount', () => {
            vi.useFakeTimers();
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            const { unmount } = render(<OwnerLeaveWarningDialog {...defaultProps} isOpen={true} />);
            unmount();
            expect(clearTimeoutSpy).toHaveBeenCalled();
            vi.useRealTimers();
            clearTimeoutSpy.mockRestore();
        });

        it('should have aria-modal="true"', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        });

        it('should have aria-labelledby pointing to title', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby', 'owner-warning-title');
            expect(screen.getByText('ownerLeaveWarningTitle')).toHaveAttribute('id', 'owner-warning-title');
        });

        it('should have aria-label on close button', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(screen.getByLabelText('close')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Body Scroll Lock Tests
    // =========================================================================

    describe('Body Scroll Lock', () => {
        it('should prevent body scroll when open', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('should restore body scroll when closed', () => {
            const { rerender } = render(<OwnerLeaveWarningDialog {...defaultProps} />);

            rerender(<OwnerLeaveWarningDialog {...defaultProps} isOpen={false} />);

            expect(document.body.style.overflow).toBe('');
        });

        it('should restore body scroll on unmount', () => {
            const { unmount } = render(<OwnerLeaveWarningDialog {...defaultProps} />);

            unmount();

            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // Translation Tests
    // =========================================================================

    describe('Translation Support', () => {
        it('should use translation function for text', () => {
            render(<OwnerLeaveWarningDialog {...defaultProps} />);

            expect(mockT).toHaveBeenCalledWith('ownerLeaveWarningTitle');
            expect(mockT).toHaveBeenCalledWith('ownerLeaveWarningDesc');
            expect(mockT).toHaveBeenCalledWith('ownerLeaveWarningOption1');
            expect(mockT).toHaveBeenCalledWith('ownerLeaveWarningOption2');
            expect(mockT).toHaveBeenCalledWith('manageMembers');
            expect(mockT).toHaveBeenCalledWith('deleteGroup');
        });

        it('should use Spanish fallback when lang is es', () => {
            const emptyT = vi.fn(() => '');
            render(<OwnerLeaveWarningDialog {...defaultProps} t={emptyT} lang="es" />);

            expect(screen.getByText('Eres el dueño de este grupo')).toBeInTheDocument();
            expect(screen.getByText('Como dueño, debes:')).toBeInTheDocument();
        });

        it('should use English fallback when lang is en', () => {
            const emptyT = vi.fn(() => '');
            render(<OwnerLeaveWarningDialog {...defaultProps} t={emptyT} lang="en" />);

            expect(screen.getByText("You're the owner of this group")).toBeInTheDocument();
            expect(screen.getByText('As owner, you must:')).toBeInTheDocument();
        });
    });
});
