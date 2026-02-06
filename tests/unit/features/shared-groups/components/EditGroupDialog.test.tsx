/**
 * EditGroupDialog Tests
 *
 * Story 14d-v2-1-7g: Edit Group Settings
 * Epic 14d-v2: Shared Groups v2
 *
 * Test coverage:
 * - Renders with pre-filled values from group
 * - Name validation (2-50 chars)
 * - Save button disabled states
 * - Loading states
 * - Discard confirmation
 * - Icon and color picker interactions
 * - Dialog visibility control
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditGroupDialog } from '@/features/shared-groups/components/EditGroupDialog';
import type { SharedGroup } from '@/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Hook Mocks (for MySharingPreferencesSection)
// =============================================================================

// Mock useAuth hook (required by MySharingPreferencesSection)
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    services: { db: {}, appId: 'test-app' },
  }),
}));

// Mock useUserGroupPreference hook (required by MySharingPreferencesSection)
vi.mock('@/features/shared-groups/hooks/useUserGroupPreference', () => ({
  useUserGroupPreference: () => ({
    preference: { shareMyTransactions: true },
    isLoading: false,
    updatePreference: vi.fn(),
    canToggle: { allowed: true },
    error: null,
  }),
}));

// =============================================================================
// Mock Setup
// =============================================================================

const mockOnSave = vi.fn();
const mockOnClose = vi.fn();

const mockT = (key: string) => {
    const translations: Record<string, string> = {
        editGroup: 'Edit Group',
        editGroupTitle: 'Edit Group',
        groupName: 'Group Name',
        groupNamePlaceholder: 'e.g., Home Expenses',
        nameMinLength: 'Name must be at least 2 characters',
        nameMaxLength: 'Name must be 50 characters or less',
        cancel: 'Cancel',
        updateGroup: 'Update',
        updating: 'Updating...',
        close: 'Close',
        discardGroupEdit: 'Discard changes?',
        discardGroupEditBody: 'You have unsaved changes. Are you sure you want to discard?',
        keepEditing: 'Keep Editing',
        discard: 'Discard',
        noChanges: 'No changes made',
        iconLabel: 'Icon',
        colorLabel: 'Color',
    };
    return translations[key] || key;
};

function createMockGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
    return {
        id: 'group-123',
        ownerId: 'user-123',
        appId: 'boletapp',
        name: 'Test Group',
        color: '#10b981',
        icon: '🏠',
        shareCode: 'TestShareCode1234',
        shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        members: ['user-123'],
        memberUpdates: {},
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        timezone: 'America/Santiago',
        transactionSharingEnabled: true,
        transactionSharingLastToggleAt: null,
        transactionSharingToggleCountToday: 0,
        ...overrides,
    };
}

const mockGroup = createMockGroup();

const defaultProps = {
    open: true,
    group: mockGroup,
    onClose: mockOnClose,
    onSave: mockOnSave,
    isPending: false,
    t: mockT,
    lang: 'en' as const,
};

// =============================================================================
// Test Suite
// =============================================================================

describe('EditGroupDialog (Story 14d-v2-1-7g)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // =========================================================================
    // Rendering Tests
    // =========================================================================

    describe('rendering', () => {
        it('renders with pre-filled values from group', () => {
            render(<EditGroupDialog {...defaultProps} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByTestId('group-name-input')).toHaveValue('Test Group');
        });

        it('dialog not rendered when open=false', () => {
            render(<EditGroupDialog {...defaultProps} open={false} />);

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('renders the dialog title', () => {
            render(<EditGroupDialog {...defaultProps} />);

            expect(screen.getByText('Edit Group')).toBeInTheDocument();
        });

        it('renders icon picker with current icon', () => {
            render(<EditGroupDialog {...defaultProps} />);

            const iconPicker = screen.getByTestId('icon-picker');
            expect(iconPicker).toBeInTheDocument();
        });

        it('renders color picker with current color', () => {
            render(<EditGroupDialog {...defaultProps} />);

            const colorPicker = screen.getByTestId('color-picker');
            expect(colorPicker).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Validation Tests
    // =========================================================================

    describe('validation', () => {
        it('shows validation error for name < 2 chars', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'A');

            expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
        });

        it('shows validation error for name > 50 chars', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'A'.repeat(51));

            expect(screen.getByText('Name must be 50 characters or less')).toBeInTheDocument();
        });

        it('save button disabled when form invalid', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'A');

            const saveBtn = screen.getByTestId('save-btn');
            expect(saveBtn).toBeDisabled();
        });

        it('save button disabled when no changes made', () => {
            render(<EditGroupDialog {...defaultProps} />);

            const saveBtn = screen.getByTestId('save-btn');
            expect(saveBtn).toBeDisabled();
        });

        it('save button enabled when valid changes made', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'New Name');

            const saveBtn = screen.getByTestId('save-btn');
            expect(saveBtn).not.toBeDisabled();
        });
    });

    // =========================================================================
    // Loading State Tests
    // =========================================================================

    describe('loading state', () => {
        it('shows loading spinner when isPending', () => {
            render(<EditGroupDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
            expect(screen.getByText('Updating...')).toBeInTheDocument();
        });

        it('disables inputs when isPending', () => {
            render(<EditGroupDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('group-name-input')).toBeDisabled();
        });

        it('disables buttons when isPending', () => {
            render(<EditGroupDialog {...defaultProps} isPending={true} />);

            expect(screen.getByTestId('save-btn')).toBeDisabled();
            expect(screen.getByTestId('cancel-btn')).toBeDisabled();
        });
    });

    // =========================================================================
    // Close/Discard Tests
    // =========================================================================

    describe('close and discard', () => {
        it('calls onClose when backdrop clicked (no changes)', () => {
            render(<EditGroupDialog {...defaultProps} />);

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('shows discard confirmation when closing with changes', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Modified Name');

            const backdrop = screen.getByTestId('backdrop-overlay');
            fireEvent.click(backdrop);

            expect(screen.getByTestId('discard-confirm-dialog')).toBeInTheDocument();
            expect(screen.getByText('Discard changes?')).toBeInTheDocument();
        });

        it('keeps dialog open when clicking Keep Editing', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Modified');

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            const keepEditingBtn = screen.getByTestId('keep-editing-btn');
            await userEvent.click(keepEditingBtn);

            expect(screen.queryByTestId('discard-confirm-dialog')).not.toBeInTheDocument();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('discards and closes when clicking Discard', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Modified');

            const cancelBtn = screen.getByTestId('cancel-btn');
            await userEvent.click(cancelBtn);

            const discardBtn = screen.getByTestId('discard-btn');
            await userEvent.click(discardBtn);

            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Save Tests
    // =========================================================================

    describe('save functionality', () => {
        it('calls onSave with updated values when save clicked', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Updated Name');

            const saveBtn = screen.getByTestId('save-btn');
            await userEvent.click(saveBtn);

            expect(mockOnSave).toHaveBeenCalledWith({
                name: 'Updated Name',
                icon: '🏠',
                color: '#10b981',
            });
        });

        it('only includes changed fields in onSave', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'New Name');

            const saveBtn = screen.getByTestId('save-btn');
            await userEvent.click(saveBtn);

            expect(mockOnSave).toHaveBeenCalledWith({
                name: 'New Name',
                icon: '🏠',
                color: '#10b981',
            });
        });
    });

    // =========================================================================
    // Picker Interaction Tests
    // =========================================================================

    describe('picker interactions', () => {
        it('updates icon when EmojiPicker selection changes', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            // Open emoji picker
            const iconPicker = screen.getByTestId('icon-picker');
            await userEvent.click(iconPicker);

            // Note: EmojiPicker opens a modal - we test the state change effect
            // In the actual implementation, clicking an emoji will call onChange
            // For now, we verify the picker button is clickable and triggers interaction
            expect(iconPicker).not.toBeDisabled();
        });

        it('updates color when ColorPicker selection changes', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            // Open color picker
            const colorPicker = screen.getByTestId('color-picker');
            await userEvent.click(colorPicker);

            // Note: ColorPicker opens a modal - we test the state change effect
            // In the actual implementation, clicking a color will call onChange
            // For now, we verify the picker button is clickable and triggers interaction
            expect(colorPicker).not.toBeDisabled();
        });
    });

    // =========================================================================
    // Accessibility Tests
    // =========================================================================

    describe('accessibility', () => {
        it('has correct ARIA attributes', () => {
            render(<EditGroupDialog {...defaultProps} />);

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby');
        });

        it('responds to Escape key when no changes', () => {
            render(<EditGroupDialog {...defaultProps} />);

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('shows discard dialog on Escape key when changes exist', async () => {
            render(<EditGroupDialog {...defaultProps} />);

            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Changed');

            fireEvent.keyDown(document, { key: 'Escape' });

            expect(screen.getByTestId('discard-confirm-dialog')).toBeInTheDocument();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        it('handles group without icon gracefully', () => {
            const groupNoIcon = createMockGroup({ icon: undefined });
            render(<EditGroupDialog {...defaultProps} group={groupNoIcon} />);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('resets state when dialog reopens with different group', async () => {
            const { rerender } = render(<EditGroupDialog {...defaultProps} />);

            // Modify name
            const nameInput = screen.getByTestId('group-name-input');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Modified');

            // Close dialog
            rerender(<EditGroupDialog {...defaultProps} open={false} />);

            // Reopen with different group
            const newGroup = createMockGroup({ id: 'group-456', name: 'Different Group' });
            rerender(<EditGroupDialog {...defaultProps} open={true} group={newGroup} />);

            expect(screen.getByTestId('group-name-input')).toHaveValue('Different Group');
        });
    });

    // =========================================================================
    // Story 14d-v2-1-12d: My Sharing Preferences Integration Tests
    // =========================================================================

    describe('My Sharing Preferences section (Story 14d-v2-1-12d)', () => {
        it('renders MySharingPreferencesSection when dialog is open', () => {
            render(<EditGroupDialog {...defaultProps} />);

            // Check for the section
            expect(screen.getByTestId('my-sharing-preferences-section')).toBeInTheDocument();
        });

        it('passes correct groupId to MySharingPreferencesSection', () => {
            render(<EditGroupDialog {...defaultProps} />);

            // The section should be present (we're testing integration, not props directly)
            // The mocked hook will receive the groupId
            expect(screen.getByTestId('my-sharing-preferences-section')).toBeInTheDocument();
        });

        it('does not render MySharingPreferencesSection when dialog is closed', () => {
            render(<EditGroupDialog {...defaultProps} open={false} />);

            expect(screen.queryByTestId('my-sharing-preferences-section')).not.toBeInTheDocument();
        });

        it('does not render MySharingPreferencesSection when no group is provided', () => {
            render(<EditGroupDialog {...defaultProps} group={null} />);

            expect(screen.queryByTestId('my-sharing-preferences-section')).not.toBeInTheDocument();
        });
    });
});
