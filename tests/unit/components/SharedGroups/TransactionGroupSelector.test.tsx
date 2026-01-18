/**
 * TransactionGroupSelector Component Unit Tests
 *
 * Story 14c.7: Tag Transactions to Groups
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the multi-select modal component that allows users to tag
 * transactions to shared groups.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { TransactionGroupSelector, type GroupWithMeta } from '../../../../src/components/SharedGroups/TransactionGroupSelector'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockGroups: GroupWithMeta[] = [
    {
        id: 'group-1',
        name: 'Family Expenses',
        color: '#10b981',
        icon: '👨‍👩‍👧',
        isShared: true,
        memberCount: 3,
    },
    {
        id: 'group-2',
        name: 'Roommates',
        color: '#3b82f6',
        icon: '🏠',
        isShared: true,
        memberCount: 2,
    },
    {
        id: 'group-3',
        name: 'Work Team',
        color: '#8b5cf6',
        icon: '💼',
        isShared: true,
        memberCount: 5,
    },
]

const mockTranslations: Record<string, string> = {
    selectGroups: 'Select Groups',
    sharedGroups: 'Shared Groups',
    personalGroups: 'Personal Groups',
    shared: 'Shared',
    members: 'members',
    personal: 'Personal',
    of: 'of',
    done: 'Done',
    close: 'Close',
    noGroupsAvailable: 'No groups available',
}

const mockT = (key: string) => mockTranslations[key] || key

// ============================================================================
// Tests
// ============================================================================

describe('TransactionGroupSelector', () => {
    const defaultProps = {
        groups: mockGroups,
        selectedIds: [] as string[],
        onSelect: vi.fn(),
        onClose: vi.fn(),
        t: mockT,
        theme: 'light' as const,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('renders the modal with title', () => {
            render(<TransactionGroupSelector {...defaultProps} />)

            expect(screen.getByText('Select Groups')).toBeInTheDocument()
        })

        it('renders all shared groups', () => {
            render(<TransactionGroupSelector {...defaultProps} />)

            expect(screen.getByText('Family Expenses')).toBeInTheDocument()
            expect(screen.getByText('Roommates')).toBeInTheDocument()
            expect(screen.getByText('Work Team')).toBeInTheDocument()
        })

        it('shows member count for shared groups', () => {
            render(<TransactionGroupSelector {...defaultProps} />)

            expect(screen.getByText('3 members')).toBeInTheDocument()
            expect(screen.getByText('2 members')).toBeInTheDocument()
            expect(screen.getByText('5 members')).toBeInTheDocument()
        })

        it('displays group icons', () => {
            render(<TransactionGroupSelector {...defaultProps} />)

            expect(screen.getByText('👨‍👩‍👧')).toBeInTheDocument()
            expect(screen.getByText('🏠')).toBeInTheDocument()
            expect(screen.getByText('💼')).toBeInTheDocument()
        })

        it('shows selection count', () => {
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    selectedIds={['group-1', 'group-2']}
                />
            )

            // Should show "2 of 5" in the title
            expect(screen.getByText('(2 of 5)')).toBeInTheDocument()
        })
    })

    describe('Selection Behavior', () => {
        it('marks selected groups with checkmark', () => {
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    selectedIds={['group-1']}
                />
            )

            // The first group should have aria-pressed="true"
            const familyButton = screen.getByRole('button', { name: /Family Expenses/i })
            expect(familyButton).toHaveAttribute('aria-pressed', 'true')

            // Other groups should have aria-pressed="false"
            const roommatesButton = screen.getByRole('button', { name: /Roommates/i })
            expect(roommatesButton).toHaveAttribute('aria-pressed', 'false')
        })

        it('allows selecting a group', () => {
            const onSelect = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    onSelect={onSelect}
                />
            )

            // Click on "Roommates" group
            fireEvent.click(screen.getByText('Roommates'))

            // Click done
            fireEvent.click(screen.getByText('Done'))

            expect(onSelect).toHaveBeenCalledWith(['group-2'])
        })

        it('allows deselecting a group', () => {
            const onSelect = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    selectedIds={['group-1', 'group-2']}
                    onSelect={onSelect}
                />
            )

            // Click on "Family Expenses" to deselect it
            fireEvent.click(screen.getByText('Family Expenses'))

            // Click done
            fireEvent.click(screen.getByText('Done'))

            // Should only have group-2 selected now
            expect(onSelect).toHaveBeenCalledWith(['group-2'])
        })

        it('allows multiple selections', () => {
            const onSelect = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    onSelect={onSelect}
                />
            )

            // Click multiple groups
            fireEvent.click(screen.getByText('Family Expenses'))
            fireEvent.click(screen.getByText('Work Team'))

            // Click done
            fireEvent.click(screen.getByText('Done'))

            expect(onSelect).toHaveBeenCalledWith(['group-1', 'group-3'])
        })
    })

    describe('Max Selection Limit', () => {
        it('disables unselected groups when max reached (5)', () => {
            // Create 6 groups
            const manyGroups: GroupWithMeta[] = [
                ...mockGroups,
                { id: 'g4', name: 'Group 4', color: '#000', isShared: true, memberCount: 1 },
                { id: 'g5', name: 'Group 5', color: '#111', isShared: true, memberCount: 1 },
                { id: 'g6', name: 'Group 6', color: '#222', isShared: true, memberCount: 1 },
            ]

            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    groups={manyGroups}
                    selectedIds={['group-1', 'group-2', 'group-3', 'g4', 'g5']}
                />
            )

            // Group 6 should be disabled since max (5) is reached
            const group6Button = screen.getByRole('button', { name: /Group 6/i })
            expect(group6Button).toBeDisabled()
        })

        it('allows deselecting when at max', () => {
            const manyGroups: GroupWithMeta[] = [
                ...mockGroups,
                { id: 'g4', name: 'Group 4', color: '#000', isShared: true, memberCount: 1 },
                { id: 'g5', name: 'Group 5', color: '#111', isShared: true, memberCount: 1 },
            ]

            const onSelect = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    groups={manyGroups}
                    selectedIds={['group-1', 'group-2', 'group-3', 'g4', 'g5']}
                    onSelect={onSelect}
                />
            )

            // Should still be able to deselect
            const familyButton = screen.getByText('Family Expenses')
            expect(familyButton).not.toBeDisabled()

            fireEvent.click(familyButton)
            fireEvent.click(screen.getByText('Done'))

            // Should have 4 groups now
            expect(onSelect).toHaveBeenCalledWith(['group-2', 'group-3', 'g4', 'g5'])
        })
    })

    describe('Modal Behavior', () => {
        it('calls onClose when clicking the backdrop', () => {
            const onClose = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    onClose={onClose}
                />
            )

            // The dialog element is the backdrop itself (has onClick={onClose})
            const dialog = screen.getByRole('dialog')
            fireEvent.click(dialog)

            expect(onClose).toHaveBeenCalled()
        })

        it('calls onClose when clicking close button', () => {
            const onClose = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    onClose={onClose}
                />
            )

            fireEvent.click(screen.getByLabelText('Close'))

            expect(onClose).toHaveBeenCalled()
        })

        it('calls onSelect and onClose when clicking Done', () => {
            const onSelect = vi.fn()
            const onClose = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    onSelect={onSelect}
                    onClose={onClose}
                    selectedIds={['group-1']}
                />
            )

            fireEvent.click(screen.getByText('Done'))

            expect(onSelect).toHaveBeenCalledWith(['group-1'])
            expect(onClose).toHaveBeenCalled()
        })

        it('does not call onClose when clicking inside the modal content', () => {
            const onClose = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    onClose={onClose}
                />
            )

            // Click on a group item inside the modal (not Done which closes it)
            fireEvent.click(screen.getByText('Family Expenses'))

            // onClose should NOT be called when clicking on groups
            expect(onClose).not.toHaveBeenCalled()
        })
    })

    describe('Empty State', () => {
        it('shows empty state when no groups available', () => {
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    groups={[]}
                />
            )

            expect(screen.getByText('No groups available')).toBeInTheDocument()
        })
    })

    describe('Loading State', () => {
        it('shows skeletons when loading', () => {
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    isLoading={true}
                />
            )

            // Should show animated placeholders (using document.body since portal renders there)
            const skeletons = document.body.querySelectorAll('.animate-pulse')
            expect(skeletons.length).toBeGreaterThan(0)
        })

        it('hides groups while loading', () => {
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    isLoading={true}
                />
            )

            // Groups should not be visible while loading
            expect(screen.queryByText('Family Expenses')).not.toBeInTheDocument()
        })
    })

    describe('Theme Support', () => {
        it('renders correctly in dark mode', () => {
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    theme="dark"
                />
            )

            // Component should render without errors (portal renders to document.body)
            // Check for the dialog which proves it rendered
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('has correct ARIA attributes', () => {
            render(<TransactionGroupSelector {...defaultProps} />)

            // Modal should have dialog role
            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')

            // Title should be labeled
            expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'group-selector-title')
        })

        it('group buttons have aria-pressed state', () => {
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    selectedIds={['group-1']}
                />
            )

            const buttons = screen.getAllByRole('button', { name: /Family Expenses|Roommates|Work Team/i })

            // At least one should be pressed
            const pressedButtons = buttons.filter(b => b.getAttribute('aria-pressed') === 'true')
            expect(pressedButtons).toHaveLength(1)
        })
    })

    describe('Local State Management', () => {
        it('does not call onSelect until Done is clicked', () => {
            const onSelect = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    onSelect={onSelect}
                />
            )

            // Click a group
            fireEvent.click(screen.getByText('Roommates'))

            // onSelect should not have been called yet
            expect(onSelect).not.toHaveBeenCalled()
        })

        it('reverts to initial selection on close without Done', () => {
            const onSelect = vi.fn()
            const onClose = vi.fn()
            render(
                <TransactionGroupSelector
                    {...defaultProps}
                    selectedIds={['group-1']}
                    onSelect={onSelect}
                    onClose={onClose}
                />
            )

            // Make changes
            fireEvent.click(screen.getByText('Roommates'))

            // Click close without Done
            fireEvent.click(screen.getByLabelText('Close'))

            // onSelect should not have been called
            expect(onSelect).not.toHaveBeenCalled()
        })
    })
})
