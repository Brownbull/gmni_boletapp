/**
 * DateRangeSelector Component Tests
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the date range selector component used in shared group views.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DateRangeSelector, DateRangeDisplay } from '../../../../src/components/SharedGroups/DateRangeSelector'

// ============================================================================
// Tests: DateRangeSelector
// ============================================================================

describe('DateRangeSelector', () => {
    const defaultProps = {
        startDate: new Date(2026, 0, 1), // Jan 1, 2026 (month is 0-indexed)
        endDate: new Date(2026, 0, 31), // Jan 31, 2026
        onChange: vi.fn(),
        language: 'en' as const,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render date range display', () => {
            render(<DateRangeSelector {...defaultProps} />)

            // Should show the month label
            expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument()
        })

        it('should render previous and next month buttons', () => {
            render(<DateRangeSelector {...defaultProps} />)

            // English translation keys from translations.ts
            expect(screen.getByLabelText('Previous month')).toBeInTheDocument()
            expect(screen.getByLabelText('Next month')).toBeInTheDocument()
        })

        it('should show single month when start and end are same month', () => {
            render(<DateRangeSelector {...defaultProps} />)

            // January 2026 should be displayed
            const displayButton = screen.getByRole('button', { expanded: false })
            expect(displayButton.textContent).toMatch(/january|enero/i)
        })

        it('should show range when start and end are different months', () => {
            render(
                <DateRangeSelector
                    {...defaultProps}
                    startDate={new Date('2025-10-01')}
                    endDate={new Date('2026-01-31')}
                />
            )

            const displayButton = screen.getByRole('button', { expanded: false })
            // Should show "October 2025 - January 2026" or similar
            expect(displayButton.textContent).toMatch(/-/)
        })
    })

    describe('Navigation', () => {
        it('should call onChange with previous month when clicking previous', () => {
            render(<DateRangeSelector {...defaultProps} />)

            fireEvent.click(screen.getByLabelText('Previous month'))

            expect(defaultProps.onChange).toHaveBeenCalledTimes(1)
            const [newStart] = defaultProps.onChange.mock.calls[0]
            // Clicking previous from January goes to December
            expect(newStart.getMonth()).toBe(11) // December (0-indexed)
        })

        it('should call onChange with next month when clicking next', () => {
            // Use a past month so next button is enabled
            const onChange = vi.fn()
            const props = {
                ...defaultProps,
                onChange,
                startDate: new Date(2025, 4, 1), // May 2025 (month is 0-indexed)
                endDate: new Date(2025, 4, 31),
            }
            render(<DateRangeSelector {...props} />)

            fireEvent.click(screen.getByLabelText('Next month'))

            expect(onChange).toHaveBeenCalledTimes(1)
            const [newStart] = onChange.mock.calls[0]
            expect(newStart.getMonth()).toBe(5) // June (0-indexed, May+1)
        })

        it('should disable next button when already at current month', () => {
            const now = new Date()
            render(
                <DateRangeSelector
                    {...defaultProps}
                    startDate={new Date(now.getFullYear(), now.getMonth(), 1)}
                    endDate={new Date(now.getFullYear(), now.getMonth() + 1, 0)}
                />
            )

            const nextButton = screen.getByLabelText('Next month')
            expect(nextButton).toBeDisabled()
        })
    })

    describe('Dropdown Presets', () => {
        it('should open dropdown when clicking date display', () => {
            render(<DateRangeSelector {...defaultProps} />)

            const displayButton = screen.getByRole('button', { expanded: false })
            fireEvent.click(displayButton)

            // Should show preset options (English translations from translations.ts)
            expect(screen.getByText('This Month')).toBeInTheDocument()
            expect(screen.getByText('Last Month')).toBeInTheDocument()
            expect(screen.getByText('Last 3 Months')).toBeInTheDocument()
            expect(screen.getByText('Last 6 Months')).toBeInTheDocument()
            expect(screen.getByText('This Year')).toBeInTheDocument()
        })

        it('should call onChange when selecting preset', () => {
            render(<DateRangeSelector {...defaultProps} />)

            // Open dropdown
            const displayButton = screen.getByRole('button', { expanded: false })
            fireEvent.click(displayButton)

            // Select "Last Month"
            fireEvent.click(screen.getByText('Last Month'))

            expect(defaultProps.onChange).toHaveBeenCalledTimes(1)
        })

        it('should close dropdown after selecting preset', () => {
            render(<DateRangeSelector {...defaultProps} />)

            // Open dropdown
            const displayButton = screen.getByRole('button', { expanded: false })
            fireEvent.click(displayButton)

            // Select preset
            fireEvent.click(screen.getByText('This Month'))

            // Dropdown should be closed
            expect(screen.queryByText('Last 3 Months')).not.toBeInTheDocument()
        })
    })

    describe('Disabled State', () => {
        it('should disable all controls when disabled prop is true', () => {
            render(<DateRangeSelector {...defaultProps} disabled={true} />)

            expect(screen.getByLabelText('Previous month')).toBeDisabled()
            expect(screen.getByLabelText('Next month')).toBeDisabled()

            const displayButton = screen.getByRole('button', { expanded: false })
            expect(displayButton).toBeDisabled()
        })
    })
})

// ============================================================================
// Tests: DateRangeDisplay
// ============================================================================

describe('DateRangeDisplay', () => {
    it('should render single month for same-month range', () => {
        // Use constructor to avoid timezone issues
        render(
            <DateRangeDisplay
                startDate={new Date(2026, 0, 1)} // Jan 1, 2026
                endDate={new Date(2026, 0, 31)} // Jan 31, 2026
                language="en"
            />
        )

        const element = screen.getByText(/january/i)
        expect(element).toBeInTheDocument()
        // Same month should not have a dash
        expect(element.textContent).not.toMatch(/-/)
    })

    it('should render range for different-month range', () => {
        render(
            <DateRangeDisplay
                startDate={new Date(2025, 10, 1)} // Nov 2025
                endDate={new Date(2026, 0, 31)} // Jan 2026
                language="en"
            />
        )

        const element = screen.getByText(/-/)
        expect(element).toBeInTheDocument()
    })

    it('should have secondary text styling', () => {
        const { container } = render(
            <DateRangeDisplay
                startDate={new Date('2026-01-01')}
                endDate={new Date('2026-01-31')}
            />
        )

        const span = container.querySelector('span')
        expect(span?.className).toContain('text-xs')
    })
})
