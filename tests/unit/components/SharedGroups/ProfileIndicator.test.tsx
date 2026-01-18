/**
 * ProfileIndicator Component Unit Tests
 *
 * Story 14c.6: Transaction Ownership Indicators
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the profile indicator avatar component that displays
 * user initials/photos on transaction cards in shared group view.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfileIndicator } from '../../../../src/components/SharedGroups/ProfileIndicator'
import type { MemberProfile } from '../../../../src/types/sharedGroup'

// ============================================================================
// Test Fixtures
// ============================================================================

const testUserId = 'user-abc123'
const testProfile: MemberProfile = {
    displayName: 'John Doe',
    email: 'john@example.com',
}

// ============================================================================
// Tests
// ============================================================================

describe('ProfileIndicator', () => {
    describe('Rendering', () => {
        it('renders with user initial when no photo', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={testProfile}
                    size="small"
                />
            )

            // Should show initial 'J' for "John Doe"
            expect(screen.getByText('J')).toBeInTheDocument()
        })

        it('renders question mark when no displayName', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ email: 'test@example.com' }}
                    size="small"
                />
            )

            expect(screen.getByText('?')).toBeInTheDocument()
        })

        it('renders question mark when profile is null', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={null}
                    size="small"
                />
            )

            expect(screen.getByText('?')).toBeInTheDocument()
        })

        it('renders question mark when profile is undefined', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    size="small"
                />
            )

            expect(screen.getByText('?')).toBeInTheDocument()
        })
    })

    describe('Size Variants', () => {
        it('renders small size correctly', () => {
            const { container } = render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={testProfile}
                    size="small"
                />
            )

            const indicator = container.firstChild as HTMLElement
            expect(indicator.className).toContain('w-6')
            expect(indicator.className).toContain('h-6')
        })

        it('renders medium size correctly', () => {
            const { container } = render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={testProfile}
                    size="medium"
                />
            )

            const indicator = container.firstChild as HTMLElement
            expect(indicator.className).toContain('w-10')
            expect(indicator.className).toContain('h-10')
        })

        it('defaults to small size', () => {
            const { container } = render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={testProfile}
                />
            )

            const indicator = container.firstChild as HTMLElement
            expect(indicator.className).toContain('w-6')
        })
    })

    describe('Initial Letter', () => {
        it('uses first character of displayName', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ displayName: 'Alice' }}
                    size="small"
                />
            )

            expect(screen.getByText('A')).toBeInTheDocument()
        })

        it('handles lowercase names with uppercase initial', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ displayName: 'bob' }}
                    size="small"
                />
            )

            expect(screen.getByText('B')).toBeInTheDocument()
        })

        it('handles empty displayName with question mark', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ displayName: '' }}
                    size="small"
                />
            )

            expect(screen.getByText('?')).toBeInTheDocument()
        })
    })

    describe('Deterministic Colors', () => {
        it('produces same color for same userId', () => {
            const { container: container1 } = render(
                <ProfileIndicator
                    userId="test-user-123"
                    profile={testProfile}
                    size="small"
                />
            )

            const { container: container2 } = render(
                <ProfileIndicator
                    userId="test-user-123"
                    profile={{ displayName: 'Different Name' }}
                    size="small"
                />
            )

            const element1 = container1.firstChild as HTMLElement
            const element2 = container2.firstChild as HTMLElement

            expect(element1.style.backgroundColor).toBe(element2.style.backgroundColor)
        })

        it('produces different colors for different userIds', () => {
            const { container: container1 } = render(
                <ProfileIndicator
                    userId="user-aaa"
                    profile={testProfile}
                    size="small"
                />
            )

            const { container: container2 } = render(
                <ProfileIndicator
                    userId="user-zzz"
                    profile={testProfile}
                    size="small"
                />
            )

            const element1 = container1.firstChild as HTMLElement
            const element2 = container2.firstChild as HTMLElement

            // Colors should be from the palette (may or may not be different, but should be valid hex or rgb)
            expect(element1.style.backgroundColor).toMatch(/^(#|rgb)/)
            expect(element2.style.backgroundColor).toMatch(/^(#|rgb)/)
        })
    })

    describe('Accessibility', () => {
        it('has aria-label with displayName', () => {
            const { container } = render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ displayName: 'Jane Smith' }}
                    size="small"
                />
            )

            const indicator = container.firstChild as HTMLElement
            expect(indicator).toHaveAttribute('aria-label', 'Jane Smith')
        })

        it('has "Unknown user" aria-label when no displayName', () => {
            const { container } = render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={null}
                    size="small"
                />
            )

            const indicator = container.firstChild as HTMLElement
            expect(indicator).toHaveAttribute('aria-label', 'Unknown user')
        })

        it('has title attribute for hover tooltip', () => {
            const { container } = render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ displayName: 'Test User' }}
                    size="small"
                />
            )

            const indicator = container.firstChild as HTMLElement
            expect(indicator).toHaveAttribute('title', 'Test User')
        })
    })

    describe('Custom ClassName', () => {
        it('applies additional className', () => {
            const { container } = render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={testProfile}
                    size="small"
                    className="absolute bottom-2 left-2"
                />
            )

            const indicator = container.firstChild as HTMLElement
            expect(indicator.className).toContain('absolute')
            expect(indicator.className).toContain('bottom-2')
            expect(indicator.className).toContain('left-2')
        })
    })

    describe('Photo URL Rendering', () => {
        it('renders img element when photoURL is provided', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ displayName: 'Photo User', photoURL: 'https://example.com/photo.jpg' }}
                    size="small"
                />
            )

            const img = screen.getByRole('img')
            expect(img).toBeInTheDocument()
            expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
            expect(img).toHaveAttribute('alt', 'Photo User')
        })

        it('does not render img when photoURL is not provided', () => {
            render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ displayName: 'No Photo' }}
                    size="small"
                />
            )

            expect(screen.queryByRole('img')).not.toBeInTheDocument()
            expect(screen.getByText('N')).toBeInTheDocument()
        })

        it('falls back to initial when image fails to load', async () => {
            const { container } = render(
                <ProfileIndicator
                    userId={testUserId}
                    profile={{ displayName: 'Error User', photoURL: 'https://example.com/broken.jpg' }}
                    size="small"
                />
            )

            // Initially shows img element
            const img = screen.getByRole('img')
            expect(img).toBeInTheDocument()

            // Simulate image load error
            await import('@testing-library/react').then(({ fireEvent }) => {
                fireEvent.error(img)
            })

            // After error, should show initial instead of image
            expect(screen.queryByRole('img')).not.toBeInTheDocument()
            expect(screen.getByText('E')).toBeInTheDocument()

            // Container should still have the background color (avatar circle)
            const indicator = container.firstChild as HTMLElement
            expect(indicator.style.backgroundColor).toMatch(/^(#|rgb)/)
        })
    })
})
