/**
 * SharedGroupTotalCard Component Tests
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the combined total spending display component.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SharedGroupTotalCard, SharedGroupTotalCardSkeleton } from '../../../../src/components/SharedGroups/SharedGroupTotalCard'

// ============================================================================
// Tests: SharedGroupTotalCard
// ============================================================================

describe('SharedGroupTotalCard', () => {
    const defaultProps = {
        total: 12500,
        currency: 'CLP',
        groupName: '\ud83c\udfe0 Gastos del Hogar',
        groupColor: '#10b981',
        memberCount: 3,
    }

    it('should render the group name without emoji prefix', () => {
        render(<SharedGroupTotalCard {...defaultProps} />)

        expect(screen.getByText('Gastos del Hogar')).toBeInTheDocument()
    })

    it('should render the total amount formatted as currency', () => {
        render(<SharedGroupTotalCard {...defaultProps} />)

        // CLP should be formatted without decimals
        expect(screen.getByText(/12[\.\,]?500/)).toBeInTheDocument()
    })

    it('should render member count', () => {
        render(<SharedGroupTotalCard {...defaultProps} />)

        expect(screen.getByText('3 miembros')).toBeInTheDocument()
    })

    it('should render date range label when provided', () => {
        render(<SharedGroupTotalCard {...defaultProps} dateRangeLabel="Enero 2026" />)

        expect(screen.getByText('Enero 2026')).toBeInTheDocument()
    })

    it('should apply custom background color', () => {
        const { container } = render(<SharedGroupTotalCard {...defaultProps} />)

        const card = container.firstChild as HTMLElement
        expect(card).toHaveStyle({ backgroundColor: '#10b981' })
    })

    it('should show loading skeleton when isLoading is true', () => {
        const { container } = render(<SharedGroupTotalCard {...defaultProps} isLoading={true} />)

        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('should handle click when onClick is provided', () => {
        const handleClick = vi.fn()
        render(<SharedGroupTotalCard {...defaultProps} onClick={handleClick} />)

        const card = screen.getByRole('button')
        fireEvent.click(card)

        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle Enter key when onClick is provided', () => {
        const handleClick = vi.fn()
        render(<SharedGroupTotalCard {...defaultProps} onClick={handleClick} />)

        const card = screen.getByRole('button')
        fireEvent.keyDown(card, { key: 'Enter' })

        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not render as button when onClick is not provided', () => {
        render(<SharedGroupTotalCard {...defaultProps} />)

        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should format USD currency with decimals', () => {
        render(<SharedGroupTotalCard {...defaultProps} total={1234.56} currency="USD" />)

        // Should include decimals for USD
        expect(screen.getByText(/1[\.\,]?234/)).toBeInTheDocument()
    })

    it('should use custom membersLabel', () => {
        render(<SharedGroupTotalCard {...defaultProps} membersLabel="members" />)

        expect(screen.getByText('3 members')).toBeInTheDocument()
    })
})

// ============================================================================
// Tests: SharedGroupTotalCardSkeleton
// ============================================================================

describe('SharedGroupTotalCardSkeleton', () => {
    it('should render loading skeleton', () => {
        const { container } = render(<SharedGroupTotalCardSkeleton />)

        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('should render skeleton elements for all parts', () => {
        const { container } = render(<SharedGroupTotalCardSkeleton />)

        // Should have multiple skeleton elements
        const skeletonParts = container.querySelectorAll('.bg-gray-300')
        expect(skeletonParts.length).toBeGreaterThan(3)
    })
})
