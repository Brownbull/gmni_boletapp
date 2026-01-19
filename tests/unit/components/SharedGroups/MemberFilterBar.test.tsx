/**
 * MemberFilterBar Component Tests
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the member filter toggle component.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemberFilterBar, MemberFilterBarSkeleton } from '../../../../src/components/SharedGroups/MemberFilterBar'

// ============================================================================
// Tests: MemberFilterBar
// ============================================================================

describe('MemberFilterBar', () => {
    const defaultProps = {
        members: ['user-1', 'user-2', 'user-3'],
        memberProfiles: {
            'user-1': { displayName: 'John Doe', email: 'john@example.com' },
            'user-2': { displayName: 'Jane Smith', email: 'jane@example.com' },
            'user-3': { displayName: 'Bob Wilson', email: 'bob@example.com' },
        },
        selectedMembers: [] as string[],
        onToggleMember: vi.fn(),
        onSelectAll: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render "All" button', () => {
        render(<MemberFilterBar {...defaultProps} />)

        expect(screen.getByLabelText('Todos')).toBeInTheDocument()
    })

    it('should render member buttons', () => {
        render(<MemberFilterBar {...defaultProps} />)

        // Should show first names (use getAllByLabelText since ProfileIndicator also has aria-label)
        expect(screen.getAllByLabelText('John Doe').length).toBeGreaterThan(0)
        expect(screen.getAllByLabelText('Jane Smith').length).toBeGreaterThan(0)
        expect(screen.getAllByLabelText('Bob Wilson').length).toBeGreaterThan(0)
    })

    it('should show "All" as pressed when no members selected', () => {
        render(<MemberFilterBar {...defaultProps} selectedMembers={[]} />)

        const allButton = screen.getByLabelText('Todos')
        expect(allButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should call onSelectAll when "All" button clicked', () => {
        render(<MemberFilterBar {...defaultProps} selectedMembers={['user-1']} />)

        fireEvent.click(screen.getByLabelText('Todos'))

        expect(defaultProps.onSelectAll).toHaveBeenCalledTimes(1)
    })

    it('should call onToggleMember when member button clicked', () => {
        render(<MemberFilterBar {...defaultProps} />)

        // Get the button (not the inner ProfileIndicator) by role
        const buttons = screen.getAllByRole('button')
        const johnButton = buttons.find(btn => btn.getAttribute('aria-label') === 'John Doe')
        expect(johnButton).toBeDefined()
        fireEvent.click(johnButton!)

        expect(defaultProps.onToggleMember).toHaveBeenCalledWith('user-1')
    })

    it('should show member as pressed when selected', () => {
        render(<MemberFilterBar {...defaultProps} selectedMembers={['user-1']} />)

        const buttons = screen.getAllByRole('button')
        const johnButton = buttons.find(btn => btn.getAttribute('aria-label') === 'John Doe')
        expect(johnButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should show member as not pressed when not selected', () => {
        render(<MemberFilterBar {...defaultProps} selectedMembers={['user-1']} />)

        const buttons = screen.getAllByRole('button')
        const janeButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Jane Smith')
        expect(janeButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('should display spending amounts when provided', () => {
        const spendingByMember = new Map([
            ['user-1', 15000],
            ['user-2', 8500],
            ['user-3', 3200],
        ])

        render(<MemberFilterBar {...defaultProps} spendingByMember={spendingByMember} />)

        // Should show compact spending (15.0k, 8.5k, 3.2k)
        expect(screen.getByText('15.0k')).toBeInTheDocument()
        expect(screen.getByText('8.5k')).toBeInTheDocument()
        expect(screen.getByText('3.2k')).toBeInTheDocument()
    })

    it('should use "Usuario" for members without profile', () => {
        render(<MemberFilterBar {...defaultProps} memberProfiles={{}} />)

        // All three should show "Usuario"
        const usuarioButtons = screen.getAllByText('Usuario')
        expect(usuarioButtons).toHaveLength(3)
    })

    it('should show only first name for members', () => {
        render(<MemberFilterBar {...defaultProps} />)

        // Should show "John", "Jane", "Bob" not full names
        expect(screen.getByText('John')).toBeInTheDocument()
        expect(screen.getByText('Jane')).toBeInTheDocument()
        expect(screen.getByText('Bob')).toBeInTheDocument()
    })
})

// ============================================================================
// Tests: MemberFilterBarSkeleton
// ============================================================================

describe('MemberFilterBarSkeleton', () => {
    it('should render loading skeleton with default count', () => {
        const { container } = render(<MemberFilterBarSkeleton />)

        // Default is 4 member skeletons + 1 "All" skeleton = 5 total
        const skeletons = container.querySelectorAll('.animate-pulse')
        expect(skeletons.length).toBe(5)
    })

    it('should render specified number of member skeletons', () => {
        const { container } = render(<MemberFilterBarSkeleton count={2} />)

        // 2 member skeletons + 1 "All" skeleton = 3 total
        const skeletons = container.querySelectorAll('.animate-pulse')
        expect(skeletons.length).toBe(3)
    })
})
