/**
 * Unit tests for JoinGroupDialog component
 *
 * Story 14c.17: Share Link Deep Linking
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests the join group confirmation dialog:
 * - Group preview display (name, color, icon, member count)
 * - Join and Cancel button functionality
 * - Loading state during join
 * - Error state display
 * - Accessibility (WCAG 2.1 Level AA)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
    JoinGroupDialog,
    type JoinGroupDialogProps,
} from '../../../../src/components/SharedGroups/JoinGroupDialog';
import type { SharedGroupPreview } from '../../../../src/types/sharedGroup';
import type { JoinError } from '../../../../src/hooks/useJoinLinkHandler';

// Mock translations
const mockT = (key: string) => key;

// Sample group preview
const MOCK_GROUP_PREVIEW: SharedGroupPreview = {
    id: 'group-123',
    name: 'Test Family',
    color: '#10b981',
    icon: '🏠',
    memberCount: 3,
    isExpired: false,
};

describe('JoinGroupDialog', () => {
    const defaultProps: JoinGroupDialogProps = {
        isOpen: true,
        state: 'confirming',
        groupPreview: MOCK_GROUP_PREVIEW,
        error: null,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
        onDismissError: vi.fn(),
        t: mockT,
        lang: 'en',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should not render when isOpen is false', () => {
            render(<JoinGroupDialog {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should render when isOpen is true', () => {
            render(<JoinGroupDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should display group name', () => {
            render(<JoinGroupDialog {...defaultProps} />);

            expect(screen.getByText('Test Family')).toBeInTheDocument();
        });

        it('should display group icon', () => {
            render(<JoinGroupDialog {...defaultProps} />);

            expect(screen.getByText('🏠')).toBeInTheDocument();
        });

        it('should display member count', () => {
            render(<JoinGroupDialog {...defaultProps} />);

            expect(screen.getByText(/3/)).toBeInTheDocument();
        });

        it('should display Join and Cancel buttons in confirming state', () => {
            render(<JoinGroupDialog {...defaultProps} />);

            expect(screen.getByTestId('join-group-confirm-btn')).toBeInTheDocument();
            expect(screen.getByTestId('join-group-cancel-btn')).toBeInTheDocument();
        });
    });

    describe('loading state', () => {
        it('should show loading spinner when state is loading', () => {
            render(<JoinGroupDialog {...defaultProps} state="loading" groupPreview={null} />);

            expect(screen.getByTestId('join-group-loading')).toBeInTheDocument();
        });

        it('should show loading spinner when state is joining', () => {
            render(<JoinGroupDialog {...defaultProps} state="joining" />);

            expect(screen.getByTestId('join-group-joining')).toBeInTheDocument();
            expect(screen.getByTestId('join-group-confirm-btn')).toBeDisabled();
        });
    });

    describe('error state', () => {
        it('should display CODE_NOT_FOUND error', () => {
            render(
                <JoinGroupDialog
                    {...defaultProps}
                    state="error"
                    error="CODE_NOT_FOUND"
                    groupPreview={null}
                />
            );

            expect(screen.getByText(/invalid|not found/i)).toBeInTheDocument();
        });

        it('should display CODE_EXPIRED error', () => {
            render(
                <JoinGroupDialog
                    {...defaultProps}
                    state="error"
                    error="CODE_EXPIRED"
                />
            );

            // Check for the title specifically
            expect(screen.getByRole('heading', { name: /expired/i })).toBeInTheDocument();
        });

        it('should display GROUP_FULL error', () => {
            render(
                <JoinGroupDialog
                    {...defaultProps}
                    state="error"
                    error="GROUP_FULL"
                />
            );

            // Check for the title specifically
            expect(screen.getByRole('heading', { name: /full/i })).toBeInTheDocument();
        });

        it('should display ALREADY_MEMBER error', () => {
            render(
                <JoinGroupDialog
                    {...defaultProps}
                    state="error"
                    error="ALREADY_MEMBER"
                />
            );

            // Check for the title specifically
            expect(screen.getByRole('heading', { name: /already.*member/i })).toBeInTheDocument();
        });

        it('should call onDismissError when dismiss button is clicked', () => {
            const onDismissError = vi.fn();
            render(
                <JoinGroupDialog
                    {...defaultProps}
                    state="error"
                    error="CODE_NOT_FOUND"
                    groupPreview={null}
                    onDismissError={onDismissError}
                />
            );

            fireEvent.click(screen.getByTestId('join-group-dismiss-btn'));

            expect(onDismissError).toHaveBeenCalled();
        });
    });

    describe('user interactions', () => {
        it('should call onConfirm when Join button is clicked', async () => {
            const onConfirm = vi.fn();
            render(<JoinGroupDialog {...defaultProps} onConfirm={onConfirm} />);

            fireEvent.click(screen.getByTestId('join-group-confirm-btn'));

            expect(onConfirm).toHaveBeenCalled();
        });

        it('should call onCancel when Cancel button is clicked', () => {
            const onCancel = vi.fn();
            render(<JoinGroupDialog {...defaultProps} onCancel={onCancel} />);

            fireEvent.click(screen.getByTestId('join-group-cancel-btn'));

            expect(onCancel).toHaveBeenCalled();
        });

        it('should call onCancel when backdrop is clicked', () => {
            const onCancel = vi.fn();
            render(<JoinGroupDialog {...defaultProps} onCancel={onCancel} />);

            fireEvent.click(screen.getByTestId('join-group-dialog-backdrop'));

            expect(onCancel).toHaveBeenCalled();
        });

        it('should call onCancel when close button is clicked', () => {
            const onCancel = vi.fn();
            render(<JoinGroupDialog {...defaultProps} onCancel={onCancel} />);

            fireEvent.click(screen.getByTestId('join-group-close-btn'));

            expect(onCancel).toHaveBeenCalled();
        });

        it('should call onCancel when Escape key is pressed', () => {
            const onCancel = vi.fn();
            render(<JoinGroupDialog {...defaultProps} onCancel={onCancel} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onCancel).toHaveBeenCalled();
        });

        it('should not call onCancel on Escape when in joining state', () => {
            const onCancel = vi.fn();
            render(<JoinGroupDialog {...defaultProps} state="joining" onCancel={onCancel} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(onCancel).not.toHaveBeenCalled();
        });
    });

    describe('accessibility', () => {
        it('should have dialog role', () => {
            render(<JoinGroupDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should have aria-modal attribute', () => {
            render(<JoinGroupDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        });

        it('should have aria-labelledby pointing to title', () => {
            render(<JoinGroupDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby');
        });
    });

    describe('Spanish language support', () => {
        it('should render in Spanish when lang is es', () => {
            render(<JoinGroupDialog {...defaultProps} lang="es" />);

            // The component uses t() function which returns the key,
            // but we can verify the component renders without errors
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });
});
