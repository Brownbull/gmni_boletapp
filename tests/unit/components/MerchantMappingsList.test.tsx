/**
 * MerchantMappingsList Component Unit Tests
 *
 * Tests for the merchant mappings management component in Settings.
 * Displays user's learned merchant mappings with edit and delete functionality.
 *
 * Story 9.7 - Merchant Mappings Management UI
 * Story 14.22 - Updated to match redesigned component
 * AC #1-#7: Complete acceptance criteria coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MerchantMappingsList } from '../../../src/components/MerchantMappingsList'
import { MerchantMapping } from '../../../src/types/merchantMapping'
import { Timestamp } from 'firebase/firestore'

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
    const translations: Record<string, string> = {
        learnedMerchants: 'Learned Merchants',
        learnedMerchantsEmpty: 'No learned merchants yet',
        learnedMerchantsHint: 'Edit a merchant name and choose to remember it',
        deleteMapping: 'Delete',
        editMerchantMapping: 'Edit',
        deleteMerchantMappingConfirm: 'Remove this learned merchant?',
        editMerchantTarget: 'Edit display name',
        usedTimes: 'Used {count} times',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        close: 'Close',
        displayName: 'Display name',
    }
    return translations[key] || key
}

const createMockMapping = (overrides: Partial<MerchantMapping> = {}): MerchantMapping => ({
    id: 'mapping-1',
    originalMerchant: 'SUPERMERC JUMBO #123',
    normalizedMerchant: 'supermerc jumbo 123',
    targetMerchant: 'Jumbo Supermarket',
    confidence: 1.0,
    source: 'user',
    usageCount: 5,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
})

const defaultProps = {
    mappings: [createMockMapping()],
    loading: false,
    onDeleteMapping: vi.fn().mockResolvedValue(undefined),
    onEditMapping: vi.fn().mockResolvedValue(undefined),
    t: mockT,
    theme: 'light' as const,
}

// ============================================================================
// Tests
// ============================================================================

describe('MerchantMappingsList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        // Restore body overflow after each test
        document.body.style.overflow = ''
    })

    describe('Rendering (AC #1, #2, #7)', () => {
        it('renders the list of mappings (AC #2)', () => {
            render(<MerchantMappingsList {...defaultProps} />)

            // Component shows target merchant in quotes and original as tag
            expect(screen.getByText('"Jumbo Supermarket"')).toBeInTheDocument()
            // Original merchant is shown truncated as a badge
            expect(screen.getByText(/SUPERMERC JU\.\.\./)).toBeInTheDocument()
        })

        it('renders multiple mappings correctly', () => {
            const mappings = [
                createMockMapping({ id: '1', originalMerchant: 'STORE A', targetMerchant: 'Store A' }),
                createMockMapping({ id: '2', originalMerchant: 'STORE B', targetMerchant: 'Store B' }),
                createMockMapping({ id: '3', originalMerchant: 'STORE C', targetMerchant: 'Store C' }),
            ]

            render(<MerchantMappingsList {...defaultProps} mappings={mappings} />)

            // Component shows target merchants in quotes
            expect(screen.getByText('"Store A"')).toBeInTheDocument()
            expect(screen.getByText('"Store B"')).toBeInTheDocument()
            expect(screen.getByText('"Store C"')).toBeInTheDocument()
        })

        it('follows CategoryMappingsList pattern with similar structure (AC #7)', () => {
            render(<MerchantMappingsList {...defaultProps} />)

            // Generic MappingsList uses role="list" for the list container
            expect(screen.getByRole('list')).toBeInTheDocument()
        })
    })

    describe('Usage Count Display (AC #3)', () => {
        it('displays usage count for each mapping', () => {
            render(<MerchantMappingsList {...defaultProps} />)

            // Component displays count as "Nx" format
            expect(screen.getByText('5x')).toBeInTheDocument()
        })

        it('shows correct usage count for different values', () => {
            const mappings = [
                createMockMapping({ id: '1', usageCount: 0, targetMerchant: 'Target 1' }),
                createMockMapping({ id: '2', usageCount: 1, originalMerchant: 'OTHER', targetMerchant: 'Target 2' }),
                createMockMapping({ id: '3', usageCount: 100, originalMerchant: 'THIRD', targetMerchant: 'Target 3' }),
            ]

            render(<MerchantMappingsList {...defaultProps} mappings={mappings} />)

            // Component displays count as "Nx" format
            expect(screen.getByText('0x')).toBeInTheDocument()
            expect(screen.getByText('1x')).toBeInTheDocument()
            expect(screen.getByText('100x')).toBeInTheDocument()
        })
    })

    describe('Delete Functionality (AC #4)', () => {
        it('shows delete button on each mapping', () => {
            render(<MerchantMappingsList {...defaultProps} />)

            // Component uses target merchant in aria-label
            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')
            expect(deleteButton).toBeInTheDocument()
        })

        it('opens confirmation dialog when delete button is clicked', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')
            await userEvent.click(deleteButton)

            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
            expect(screen.getByText('Remove this learned merchant?')).toBeInTheDocument()
        })

        it('shows the mapping details in the confirmation dialog', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')
            await userEvent.click(deleteButton)

            // Shows both original and target in the confirmation
            expect(screen.getByText(/"SUPERMERC JUMBO #123 → Jumbo Supermarket"/)).toBeInTheDocument()
        })

        it('calls onDeleteMapping when delete is confirmed', async () => {
            const onDeleteMapping = vi.fn().mockResolvedValue(undefined)
            render(<MerchantMappingsList {...defaultProps} onDeleteMapping={onDeleteMapping} />)

            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')
            await userEvent.click(deleteButton)

            const confirmButton = screen.getByText('Confirm')
            await userEvent.click(confirmButton)

            expect(onDeleteMapping).toHaveBeenCalledWith('mapping-1')
        })

        it('closes confirmation dialog when cancel is clicked', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')
            await userEvent.click(deleteButton)

            const cancelButton = screen.getByText('Cancel')
            await userEvent.click(cancelButton)

            expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument()
        })

        it('closes confirmation dialog when Escape is pressed', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')
            await userEvent.click(deleteButton)

            expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()

            await userEvent.keyboard('{Escape}')

            expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument()
        })
    })

    describe('Edit Functionality (AC #5)', () => {
        it('shows edit button on each mapping', () => {
            render(<MerchantMappingsList {...defaultProps} />)

            // Component uses target merchant in aria-label
            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            expect(editButton).toBeInTheDocument()
        })

        it('opens edit dialog when edit button is clicked', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            await userEvent.click(editButton)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
            expect(screen.getByText('Edit display name')).toBeInTheDocument()
        })

        it('shows the original merchant name in edit dialog', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            await userEvent.click(editButton)

            // The dialog contains the original merchant name in a descriptive paragraph
            const dialog = screen.getByRole('dialog')
            expect(dialog).toBeInTheDocument()
            // Original is shown in dialog description
            expect(screen.getByText('SUPERMERC JUMBO #123')).toBeInTheDocument()
        })

        it('pre-fills input with current target merchant', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            await userEvent.click(editButton)

            // Use getByRole to be more specific - get the input within the dialog
            const dialog = screen.getByRole('dialog')
            const input = dialog.querySelector('input')
            expect(input).toHaveValue('Jumbo Supermarket')
        })

        it('calls onEditMapping with new value when saved', async () => {
            const onEditMapping = vi.fn().mockResolvedValue(undefined)
            render(<MerchantMappingsList {...defaultProps} onEditMapping={onEditMapping} />)

            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            await userEvent.click(editButton)

            // Use getByRole to be more specific - get the input within the dialog
            const dialog = screen.getByRole('dialog')
            const input = dialog.querySelector('input') as HTMLInputElement
            await userEvent.clear(input)
            await userEvent.type(input, 'New Name')

            const saveButton = screen.getByText('Save')
            await userEvent.click(saveButton)

            expect(onEditMapping).toHaveBeenCalledWith('mapping-1', 'New Name')
        })

        it('closes edit dialog without saving when cancel is clicked', async () => {
            const onEditMapping = vi.fn()
            render(<MerchantMappingsList {...defaultProps} onEditMapping={onEditMapping} />)

            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            await userEvent.click(editButton)

            const cancelButton = screen.getByText('Cancel')
            await userEvent.click(cancelButton)

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
            expect(onEditMapping).not.toHaveBeenCalled()
        })

        it('closes edit dialog when Escape is pressed', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            await userEvent.click(editButton)

            expect(screen.getByRole('dialog')).toBeInTheDocument()

            await userEvent.keyboard('{Escape}')

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        it('saves when Enter is pressed in input', async () => {
            const onEditMapping = vi.fn().mockResolvedValue(undefined)
            render(<MerchantMappingsList {...defaultProps} onEditMapping={onEditMapping} />)

            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            await userEvent.click(editButton)

            const dialog = screen.getByRole('dialog')
            const input = dialog.querySelector('input') as HTMLInputElement
            await userEvent.clear(input)
            await userEvent.type(input, 'Enter Test{Enter}')

            expect(onEditMapping).toHaveBeenCalledWith('mapping-1', 'Enter Test')
        })

        it('disables save button when input is empty', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            await userEvent.click(editButton)

            const dialog = screen.getByRole('dialog')
            const input = dialog.querySelector('input') as HTMLInputElement
            await userEvent.clear(input)

            const saveButton = screen.getByText('Save')
            expect(saveButton).toBeDisabled()
        })
    })

    describe('Empty State (AC #6)', () => {
        it('shows empty state when no mappings exist', () => {
            render(<MerchantMappingsList {...defaultProps} mappings={[]} />)

            expect(screen.getByText('No learned merchants yet')).toBeInTheDocument()
        })

        it('has proper accessibility for empty state', () => {
            render(<MerchantMappingsList {...defaultProps} mappings={[]} />)

            // Empty state is rendered as text content
            const emptyText = screen.getByText('No learned merchants yet')
            expect(emptyText).toBeInTheDocument()
        })
    })

    describe('Loading State', () => {
        it('shows loading skeleton when loading', () => {
            const { container } = render(<MerchantMappingsList {...defaultProps} loading={true} />)

            // Check for loading skeleton
            expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
        })

        it('does not show mappings while loading', () => {
            render(<MerchantMappingsList {...defaultProps} loading={true} />)

            expect(screen.queryByText('"Jumbo Supermarket"')).not.toBeInTheDocument()
        })
    })

    describe('Theme Support', () => {
        it('renders correctly in light theme', () => {
            render(<MerchantMappingsList {...defaultProps} theme="light" />)

            // Component renders with list structure
            expect(screen.getByRole('list')).toBeInTheDocument()
            expect(screen.getByText('"Jumbo Supermarket"')).toBeInTheDocument()
        })

        it('renders correctly in dark theme', () => {
            render(<MerchantMappingsList {...defaultProps} theme="dark" />)

            // Component renders with list structure
            expect(screen.getByRole('list')).toBeInTheDocument()
            expect(screen.getByText('"Jumbo Supermarket"')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('has proper ARIA labels for action buttons', () => {
            render(<MerchantMappingsList {...defaultProps} />)

            // Component uses target merchant in aria-labels
            expect(screen.getByLabelText('Edit "Jumbo Supermarket"')).toBeInTheDocument()
            expect(screen.getByLabelText('Delete "Jumbo Supermarket"')).toBeInTheDocument()
        })

        it('has keyboard-navigable list items', () => {
            render(<MerchantMappingsList {...defaultProps} />)

            // Buttons are focusable
            const editButton = screen.getByLabelText('Edit "Jumbo Supermarket"')
            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')

            expect(editButton).not.toBeDisabled()
            expect(deleteButton).not.toBeDisabled()
        })
    })

    describe('Modal Behavior', () => {
        it('prevents body scroll when delete modal is open', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')
            await userEvent.click(deleteButton)

            expect(document.body.style.overflow).toBe('hidden')
        })

        it('restores body scroll when modal closes', async () => {
            render(<MerchantMappingsList {...defaultProps} />)

            const deleteButton = screen.getByLabelText('Delete "Jumbo Supermarket"')
            await userEvent.click(deleteButton)

            const cancelButton = screen.getByText('Cancel')
            await userEvent.click(cancelButton)

            await waitFor(() => {
                expect(document.body.style.overflow).toBe('')
            })
        })
    })

    describe('Edge Cases', () => {
        it('handles very long merchant names', () => {
            const longName = 'A'.repeat(100)
            const mappings = [createMockMapping({ targetMerchant: longName })]

            render(<MerchantMappingsList {...defaultProps} mappings={mappings} />)

            // Should show the target in quotes (may be truncated by CSS)
            expect(screen.getByText(`"${longName}"`)).toBeInTheDocument()
        })

        it('handles special characters in merchant names', () => {
            const specialName = 'Café & Co. (Test) "Quotes"'
            const mappings = [createMockMapping({ targetMerchant: specialName })]

            render(<MerchantMappingsList {...defaultProps} mappings={mappings} />)

            expect(screen.getByText(`"${specialName}"`)).toBeInTheDocument()
        })

        it('handles mapping without id gracefully', () => {
            const mappings = [createMockMapping({ id: undefined as unknown as string })]

            // Should not throw
            expect(() => {
                render(<MerchantMappingsList {...defaultProps} mappings={mappings} />)
            }).not.toThrow()
        })

        it('handles zero usage count', () => {
            const mappings = [createMockMapping({ usageCount: 0 })]

            render(<MerchantMappingsList {...defaultProps} mappings={mappings} />)

            // Component displays count as "Nx" format
            expect(screen.getByText('0x')).toBeInTheDocument()
        })
    })
})
