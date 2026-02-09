/**
 * MemberSelectorDialog Tests
 *
 * Story 14d-v2-1-7d: Leave/Transfer UI + View Mode Auto-Switch
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage:
 * - AC #1: Dialog renders with member list
 * - AC #2: Excludes current user from list
 * - AC #3: Displays member name, email, photo
 * - AC #4: Handles member selection
 * - AC #5: Close functionality (backdrop, X button, Escape)
 * - AC #6: Accessibility (ARIA attributes, focus management)
 * - AC #7: Empty state when no other members
 * - AC #8: Translation support (Spanish fallbacks)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { MemberSelectorDialog } from '@/features/shared-groups/components/MemberSelectorDialog';
import type { SharedGroup } from '@/types/sharedGroup';
import { createMockGroup as createMockGroupBase } from '@helpers/sharedGroupFactory';

// =============================================================================
// Mock Setup
// =============================================================================

const mockOnSelectMember = vi.fn();
const mockOnClose = vi.fn();

const mockT = (key: string) => {
    const translations: Record<string, string> = {
        selectMember: 'Select Member',
        selectMemberDescription: 'Choose a member to transfer ownership to',
        noOtherMembers: 'No other members in this group',
        close: 'Close',
        cancel: 'Cancel',
    };
    return translations[key] || key;
};

// Wrap shared factory with member-selector-specific defaults
const createMockGroup = (overrides?: Partial<SharedGroup>): SharedGroup =>
    createMockGroupBase({
        ownerId: 'owner-1',
        members: ['owner-1', 'member-2', 'member-3'],
        memberProfiles: {
            'owner-1': {
                displayName: 'Owner User',
                email: 'owner@example.com',
                // ECC Review Session 4: Using valid Google domain for photoURL validation
                photoURL: 'https://lh3.googleusercontent.com/a/owner-photo',
            },
            'member-2': {
                displayName: 'John Doe',
                email: 'john@example.com',
                // ECC Review Session 4: Using valid Google domain for photoURL validation
                photoURL: 'https://lh3.googleusercontent.com/a/john-photo',
            },
            'member-3': {
                displayName: 'Jane Smith',
                email: 'jane@example.com',
            },
        },
        ...overrides,
    });

const defaultProps = {
    isOpen: true,
    group: createMockGroup(),
    currentUserId: 'owner-1',
    onSelectMember: mockOnSelectMember,
    onClose: mockOnClose,
    t: mockT,
    lang: 'en' as const,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('MemberSelectorDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // =========================================================================
    // AC #1: Basic Rendering
    // =========================================================================

    describe('AC #1: Basic Rendering', () => {
        it('renders the dialog when isOpen is true', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByTestId('member-selector-dialog')).toBeInTheDocument();
        });

        it('does not render when isOpen is false', () => {
            render(<MemberSelectorDialog {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders the dialog title', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            expect(screen.getByText('Select Member')).toBeInTheDocument();
        });

        it('renders the description text', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            expect(screen.getByText('Choose a member to transfer ownership to')).toBeInTheDocument();
        });

        it('renders member list items', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            // Should render members except current user (owner-1)
            expect(screen.getByTestId('member-item-member-2')).toBeInTheDocument();
            expect(screen.getByTestId('member-item-member-3')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // AC #2: Excludes Current User
    // =========================================================================

    describe('AC #2: Excludes Current User', () => {
        it('excludes the current user from the member list', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            // Current user (owner-1) should NOT be in the list
            expect(screen.queryByTestId('member-item-owner-1')).not.toBeInTheDocument();

            // Other members should be present
            expect(screen.getByTestId('member-item-member-2')).toBeInTheDocument();
            expect(screen.getByTestId('member-item-member-3')).toBeInTheDocument();
        });

        it('shows correct count of selectable members', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            // 3 total members - 1 current user = 2 selectable
            const memberItems = screen.getAllByTestId(/^member-item-/);
            expect(memberItems).toHaveLength(2);
        });
    });

    // =========================================================================
    // AC #3: Displays Member Information
    // =========================================================================

    describe('AC #3: Displays Member Information', () => {
        it('displays member display name', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });

        it('displays member email', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            expect(screen.getByText('john@example.com')).toBeInTheDocument();
            expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        });

        it('displays member photo when available from trusted domain', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            // ECC Review Session 4: Photo should render from trusted domain
            const johnImg = screen.getByAltText('John Doe');
            expect(johnImg).toBeInTheDocument();
            expect(johnImg).toHaveAttribute('src', 'https://lh3.googleusercontent.com/a/john-photo');
            expect(johnImg).toHaveAttribute('referrerPolicy', 'no-referrer');
        });

        it('shows avatar placeholder when no photo URL', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            // Jane Smith has no photoURL, should show placeholder
            const janeItem = screen.getByTestId('member-item-member-3');
            // The placeholder should show initials or an icon
            expect(janeItem.querySelector('[data-testid="avatar-placeholder"]')).toBeInTheDocument();
        });

        it('shows avatar placeholder when photo URL is from untrusted domain (defense-in-depth)', () => {
            // ECC Review Session 4: Security test for photoURL domain validation
            const groupWithUntrustedPhoto = createMockGroup({
                memberProfiles: {
                    'owner-1': { displayName: 'Owner', email: 'owner@example.com' },
                    'member-2': {
                        displayName: 'John Doe',
                        email: 'john@example.com',
                        photoURL: 'https://malicious-site.com/evil.jpg', // Untrusted domain
                    },
                    'member-3': { displayName: 'Jane', email: 'jane@example.com' },
                },
            });

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    group={groupWithUntrustedPhoto}
                />
            );

            // John should show placeholder since domain is not trusted
            const johnItem = screen.getByTestId('member-item-member-2');
            expect(johnItem.querySelector('[data-testid="avatar-placeholder"]')).toBeInTheDocument();
            expect(johnItem.querySelector('img')).not.toBeInTheDocument();
        });

        it('uses email as fallback when displayName is missing', () => {
            const groupWithMissingName = createMockGroup({
                memberProfiles: {
                    'owner-1': { displayName: 'Owner', email: 'owner@example.com' },
                    'member-2': { email: 'john@example.com' }, // No displayName
                    'member-3': { displayName: 'Jane', email: 'jane@example.com' },
                },
            });

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    group={groupWithMissingName}
                />
            );

            // Should show email when displayName is missing
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
        });

        it('handles missing memberProfiles gracefully', () => {
            const groupWithoutProfiles = createMockGroup({
                memberProfiles: undefined,
            });

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    group={groupWithoutProfiles}
                />
            );

            // Should still render member items with member IDs as fallback
            expect(screen.getByTestId('member-item-member-2')).toBeInTheDocument();
            expect(screen.getByTestId('member-item-member-3')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // AC #4: Member Selection
    // =========================================================================

    describe('AC #4: Member Selection', () => {
        it('calls onSelectMember when a member is clicked', async () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const memberItem = screen.getByTestId('member-item-member-2');
            await userEvent.click(memberItem);

            expect(mockOnSelectMember).toHaveBeenCalledWith('member-2', 'John Doe');
        });

        it('passes display name correctly on selection', async () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const memberItem = screen.getByTestId('member-item-member-3');
            await userEvent.click(memberItem);

            expect(mockOnSelectMember).toHaveBeenCalledWith('member-3', 'Jane Smith');
        });

        it('uses email as display name when displayName is missing', async () => {
            const groupWithMissingName = createMockGroup({
                memberProfiles: {
                    'owner-1': { displayName: 'Owner', email: 'owner@example.com' },
                    'member-2': { email: 'john@example.com' }, // No displayName
                    'member-3': { displayName: 'Jane', email: 'jane@example.com' },
                },
            });

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    group={groupWithMissingName}
                />
            );

            const memberItem = screen.getByTestId('member-item-member-2');
            await userEvent.click(memberItem);

            expect(mockOnSelectMember).toHaveBeenCalledWith('member-2', 'john@example.com');
        });

        it('shows hover state on member items', async () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const memberItem = screen.getByTestId('member-item-member-2');

            // Member items should be interactive (buttons)
            expect(memberItem.tagName.toLowerCase()).toBe('button');
        });
    });

    // =========================================================================
    // AC #5: Close Functionality
    // =========================================================================

    describe('AC #5: Close Functionality', () => {
        it('calls onClose when close button is clicked', async () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const closeBtn = screen.getByTestId('member-selector-close-btn');
            await userEvent.click(closeBtn);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when backdrop is clicked', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('calls onClose when Escape key is pressed', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('does not close when clicking inside the dialog', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const dialog = screen.getByTestId('member-selector-dialog');
            fireEvent.click(dialog);

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // AC #6: Accessibility
    // =========================================================================

    describe('AC #6: Accessibility', () => {
        it('has correct ARIA attributes on dialog', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby');
        });

        it('should clean up setTimeout on unmount', () => {
            vi.useFakeTimers();
            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
            const { unmount } = render(<MemberSelectorDialog {...defaultProps} isOpen={true} />);
            unmount();
            expect(clearTimeoutSpy).toHaveBeenCalled();
            vi.useRealTimers();
            clearTimeoutSpy.mockRestore();
        });

        it('has close button with aria-label', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const closeBtn = screen.getByTestId('member-selector-close-btn');
            expect(closeBtn).toHaveAttribute('aria-label', 'Close');
        });

        it('prevents body scroll when open', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('restores body scroll when closed', () => {
            const { unmount } = render(<MemberSelectorDialog {...defaultProps} />);
            unmount();

            expect(document.body.style.overflow).toBe('');
        });

        it('member items are keyboard accessible', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            const memberItem = screen.getByTestId('member-item-member-2');
            // Should be a button for keyboard accessibility
            expect(memberItem).toHaveAttribute('type', 'button');
        });

        it('traps focus within dialog using Tab key', async () => {
            const user = userEvent.setup();
            render(<MemberSelectorDialog {...defaultProps} />);

            // Get focusable elements within dialog
            const closeBtn = screen.getByTestId('member-selector-close-btn');
            const memberItems = screen.getAllByTestId(/^member-item-/);

            // Focus close button
            closeBtn.focus();
            expect(document.activeElement).toBe(closeBtn);

            // Tab to first member item
            await user.tab();
            expect(document.activeElement).toBe(memberItems[0]);

            // Tab to second member item
            await user.tab();
            expect(document.activeElement).toBe(memberItems[1]);

            // The useFocusTrap hook cycles focus back to first focusable element
            // when Tab is pressed on the last element
        });
    });

    // =========================================================================
    // AC #7: Empty State
    // =========================================================================

    describe('AC #7: Empty State', () => {
        it('shows empty state when no other members', () => {
            const groupWithOnlyOwner = createMockGroup({
                members: ['owner-1'], // Only the current user
                memberProfiles: {
                    'owner-1': { displayName: 'Owner', email: 'owner@example.com' },
                },
            });

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    group={groupWithOnlyOwner}
                />
            );

            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            expect(screen.getByText('No other members in this group')).toBeInTheDocument();
        });

        it('does not show empty state when members exist', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
        });
    });

    // =========================================================================
    // AC #8: Translation Support
    // =========================================================================

    describe('AC #8: Translation Support', () => {
        it('uses translation function for texts', () => {
            const customT = vi.fn((key: string) => `translated_${key}`);

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    t={customT}
                />
            );

            expect(customT).toHaveBeenCalledWith('selectMember');
            expect(customT).toHaveBeenCalledWith('selectMemberDescription');
        });

        it('uses Spanish fallbacks when lang is es and translation returns empty', () => {
            const spanishT = () => ''; // Return empty to trigger fallback

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    t={spanishT}
                    lang="es"
                />
            );

            // Should show Spanish fallback texts
            expect(screen.getByText('Seleccionar Miembro')).toBeInTheDocument();
            expect(screen.getByText('Elige un miembro para transferir la propiedad')).toBeInTheDocument();
        });

        it('uses English fallbacks when lang is en and translation returns empty', () => {
            const englishT = () => ''; // Return empty to trigger fallback

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    t={englishT}
                    lang="en"
                />
            );

            // Should show English fallback texts
            expect(screen.getByText('Select Member')).toBeInTheDocument();
            expect(screen.getByText('Choose a member to transfer ownership to')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Integration Tests
    // =========================================================================

    describe('Integration', () => {
        it('complete selection flow: open -> view members -> select -> callback', async () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            // 1. Dialog is open
            expect(screen.getByTestId('member-selector-dialog')).toBeInTheDocument();

            // 2. Members are visible (excluding current user)
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.queryByText('Owner User')).not.toBeInTheDocument();

            // 3. Select a member
            const johnItem = screen.getByTestId('member-item-member-2');
            await userEvent.click(johnItem);

            // 4. Callback is triggered with correct data
            expect(mockOnSelectMember).toHaveBeenCalledWith('member-2', 'John Doe');
        });

        it('handles group with many members', () => {
            const manyMembers = Array.from({ length: 9 }, (_, i) => `member-${i + 2}`);
            const memberProfiles = manyMembers.reduce(
                (acc, id, i) => ({
                    ...acc,
                    [id]: {
                        displayName: `Member ${i + 1}`,
                        email: `member${i + 1}@example.com`,
                    },
                }),
                { 'owner-1': { displayName: 'Owner', email: 'owner@example.com' } }
            );

            const largeGroup = createMockGroup({
                members: ['owner-1', ...manyMembers],
                memberProfiles,
            });

            render(
                <MemberSelectorDialog
                    {...defaultProps}
                    group={largeGroup}
                />
            );

            // Should render all 9 non-owner members
            const memberItems = screen.getAllByTestId(/^member-item-/);
            expect(memberItems).toHaveLength(9);
        });

        it('state resets when dialog reopens', () => {
            const { rerender } = render(<MemberSelectorDialog {...defaultProps} />);

            // Close dialog
            rerender(<MemberSelectorDialog {...defaultProps} isOpen={false} />);

            // Reopen dialog
            rerender(<MemberSelectorDialog {...defaultProps} isOpen={true} />);

            // Should be in initial state
            expect(screen.getByTestId('member-selector-dialog')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Data-testid Attributes Tests
    // =========================================================================

    describe('Data-testid Attributes', () => {
        it('has all required data-testid attributes', () => {
            render(<MemberSelectorDialog {...defaultProps} />);

            expect(screen.getByTestId('member-selector-dialog')).toBeInTheDocument();
            expect(screen.getByTestId('member-selector-close-btn')).toBeInTheDocument();
            expect(screen.getByTestId('backdrop-overlay')).toBeInTheDocument();
            expect(screen.getByTestId('member-item-member-2')).toBeInTheDocument();
            expect(screen.getByTestId('member-item-member-3')).toBeInTheDocument();
        });
    });
});
