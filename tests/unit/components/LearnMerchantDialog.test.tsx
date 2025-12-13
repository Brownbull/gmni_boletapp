/**
 * LearnMerchantDialog Component Unit Tests
 *
 * Tests for the merchant learning dialog component that prompts users
 * to save merchant name corrections for future use.
 *
 * Story 9.6 - Merchant Learning Prompt
 * AC #1-#6: Complete acceptance criteria coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { LearnMerchantDialog } from '../../../src/components/dialogs/LearnMerchantDialog'

// ============================================================================
// Test Helpers
// ============================================================================

const mockT = (key: string) => {
    const translations: Record<string, string> = {
        learnMerchantTitle: 'Remember this merchant?',
        learnMerchantMessage: 'Do you want to remember this merchant name correction?',
        learnMerchantOriginal: 'Original',
        learnMerchantCorrected: 'Corrected',
        learnMerchantConfirm: 'Yes, Remember',
        learnMerchantSkip: 'Just this time',
        close: 'Close',
    }
    return translations[key] || key
}

const defaultProps = {
    isOpen: true,
    originalMerchant: 'SUPERMERC JUMBO #123',
    correctedMerchant: 'Jumbo Supermarket',
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    t: mockT,
    theme: 'light' as const,
}

// ============================================================================
// Tests
// ============================================================================

describe('LearnMerchantDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        // Restore body overflow after each test
        document.body.style.overflow = ''
    })

    describe('Rendering (AC #1, #2)', () => {
        it('renders the dialog when isOpen is true', () => {
            render(<LearnMerchantDialog {...defaultProps} />)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
            expect(screen.getByText('Remember this merchant?')).toBeInTheDocument()
        })

        it('does not render when isOpen is false', () => {
            render(<LearnMerchantDialog {...defaultProps} isOpen={false} />)

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        it('does not render when originalMerchant is empty', () => {
            render(<LearnMerchantDialog {...defaultProps} originalMerchant="" />)

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        it('does not render when correctedMerchant is empty', () => {
            render(<LearnMerchantDialog {...defaultProps} correctedMerchant="" />)

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        it('displays original merchant name clearly (AC #2)', () => {
            render(<LearnMerchantDialog {...defaultProps} />)

            expect(screen.getByText('Original')).toBeInTheDocument()
            expect(screen.getByText('SUPERMERC JUMBO #123')).toBeInTheDocument()
        })

        it('displays corrected merchant name clearly (AC #2)', () => {
            render(<LearnMerchantDialog {...defaultProps} />)

            expect(screen.getByText('Corrected')).toBeInTheDocument()
            expect(screen.getByText('Jumbo Supermarket')).toBeInTheDocument()
        })
    })

    describe('Actions (AC #3, #4)', () => {
        it('calls onConfirm when "Remember" button is clicked (AC #3)', async () => {
            const onConfirm = vi.fn()
            render(<LearnMerchantDialog {...defaultProps} onConfirm={onConfirm} />)

            const confirmButton = screen.getByText('Yes, Remember')
            await userEvent.click(confirmButton)

            expect(onConfirm).toHaveBeenCalledTimes(1)
        })

        it('calls onClose when "Skip" button is clicked (AC #4)', async () => {
            const onClose = vi.fn()
            render(<LearnMerchantDialog {...defaultProps} onClose={onClose} />)

            const skipButton = screen.getByText('Just this time')
            await userEvent.click(skipButton)

            expect(onClose).toHaveBeenCalledTimes(1)
        })

        it('calls onClose when close (X) button is clicked', async () => {
            const onClose = vi.fn()
            render(<LearnMerchantDialog {...defaultProps} onClose={onClose} />)

            const closeButton = screen.getByLabelText('Close')
            await userEvent.click(closeButton)

            expect(onClose).toHaveBeenCalledTimes(1)
        })

        it('calls onClose when backdrop is clicked', async () => {
            const onClose = vi.fn()
            render(<LearnMerchantDialog {...defaultProps} onClose={onClose} />)

            // The backdrop is the outer container with role="presentation"
            const backdrop = screen.getByRole('presentation')
            await userEvent.click(backdrop)

            expect(onClose).toHaveBeenCalledTimes(1)
        })

        it('does not call onClose when clicking inside the dialog', async () => {
            const onClose = vi.fn()
            render(<LearnMerchantDialog {...defaultProps} onClose={onClose} />)

            const dialog = screen.getByRole('dialog')
            await userEvent.click(dialog)

            expect(onClose).not.toHaveBeenCalled()
        })
    })

    describe('Accessibility (AC #5)', () => {
        it('has proper ARIA attributes for accessibility', () => {
            render(<LearnMerchantDialog {...defaultProps} />)

            const dialog = screen.getByRole('dialog')
            expect(dialog).toHaveAttribute('aria-modal', 'true')
            expect(dialog).toHaveAttribute('aria-labelledby', 'learn-merchant-modal-title')
            expect(dialog).toHaveAttribute('aria-describedby', 'learn-merchant-modal-description')
        })

        it('closes when Escape key is pressed', async () => {
            const onClose = vi.fn()
            render(<LearnMerchantDialog {...defaultProps} onClose={onClose} />)

            await userEvent.keyboard('{Escape}')

            expect(onClose).toHaveBeenCalledTimes(1)
        })

        it('prevents body scroll when open', () => {
            render(<LearnMerchantDialog {...defaultProps} />)

            expect(document.body.style.overflow).toBe('hidden')
        })

        it('restores body scroll when closed', () => {
            const { rerender } = render(<LearnMerchantDialog {...defaultProps} />)
            expect(document.body.style.overflow).toBe('hidden')

            rerender(<LearnMerchantDialog {...defaultProps} isOpen={false} />)
            expect(document.body.style.overflow).toBe('')
        })
    })

    describe('Focus management (AC #5)', () => {
        it('focuses close button when dialog opens', async () => {
            render(<LearnMerchantDialog {...defaultProps} />)

            await waitFor(() => {
                const closeButton = screen.getByLabelText('Close')
                expect(closeButton).toHaveFocus()
            })
        })
    })

    describe('Theme support', () => {
        it('renders correctly in light theme', () => {
            render(<LearnMerchantDialog {...defaultProps} theme="light" />)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        it('renders correctly in dark theme', () => {
            render(<LearnMerchantDialog {...defaultProps} theme="dark" />)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })
    })

    describe('Edge cases', () => {
        it('handles very long merchant names', () => {
            const longName = 'A'.repeat(100)
            render(
                <LearnMerchantDialog
                    {...defaultProps}
                    originalMerchant={longName}
                    correctedMerchant={longName + ' Corrected'}
                />
            )

            expect(screen.getByText(longName)).toBeInTheDocument()
            expect(screen.getByText(longName + ' Corrected')).toBeInTheDocument()
        })

        it('handles special characters in merchant names', () => {
            render(
                <LearnMerchantDialog
                    {...defaultProps}
                    originalMerchant="Store #123 & Co. <test>"
                    correctedMerchant="Store 123"
                />
            )

            expect(screen.getByText('Store #123 & Co. <test>')).toBeInTheDocument()
            expect(screen.getByText('Store 123')).toBeInTheDocument()
        })
    })
})
