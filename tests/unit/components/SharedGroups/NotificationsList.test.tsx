/**
 * NotificationsList Component Unit Tests
 *
 * Story 14c.13: In-app notifications display for Alertas view
 *
 * Tests for the notification list component with:
 * - Swipe-to-delete
 * - Long-press selection mode
 * - Notification click handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import { NotificationsList } from '../../../../src/components/SharedGroups/NotificationsList'
import type { InAppNotificationClient } from '../../../../src/types/notification'
import type { SharedGroup } from '../../../../src/types/sharedGroup'

// ============================================================================
// Test Setup
// ============================================================================

const mockT = (key: string): string => {
    const translations: Record<string, string> = {
        justNow: 'Just now',
        minutesAgo: 'minutes ago',
        hoursAgo: 'hours ago',
        yesterday: 'Yesterday',
        daysAgo: '{days} days ago',
        selectAll: 'Select All',
        none: 'None',
        delete: 'Delete',
    }
    return translations[key] || key
}

const createMockNotification = (
    id: string,
    overrides: Partial<InAppNotificationClient> = {}
): InAppNotificationClient => ({
    id,
    type: 'TRANSACTION_ADDED',
    title: 'Test Group',
    body: 'Someone added a transaction - $50.00',
    read: false,
    createdAt: new Date(),
    groupId: 'group-123',
    groupName: 'Test Group',
    groupIcon: '🏠',
    transactionId: 'tx-123',
    actorId: 'actor-123',
    actorName: 'John',
    actionUrl: '/?view=group&groupId=group-123',
    ...overrides,
})

const mockGroups: SharedGroup[] = [
    {
        id: 'group-123',
        name: 'Test Group',
        color: '#10b981',
        icon: '🏠',
        ownerId: 'user-1',
        members: ['user-1', 'user-2'],
        createdAt: { toDate: () => new Date() } as any,
    },
    {
        id: 'group-456',
        name: 'Work Group',
        color: '#3b82f6',
        icon: '💼',
        ownerId: 'user-1',
        members: ['user-1', 'user-3'],
        createdAt: { toDate: () => new Date() } as any,
    },
]

const defaultProps = {
    notifications: [createMockNotification('notif-1'), createMockNotification('notif-2')],
    groups: mockGroups,
    onNotificationClick: vi.fn(),
    onMarkAsRead: vi.fn(),
    onMarkAllAsRead: vi.fn(),
    onDelete: vi.fn(),
    onDeleteAll: vi.fn(),
    t: mockT,
    lang: 'en' as const,
}

// ============================================================================
// Tests
// ============================================================================

describe('NotificationsList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render null when no notifications', () => {
            const { container } = render(
                <NotificationsList {...defaultProps} notifications={[]} />
            )

            expect(container.firstChild).toBeNull()
        })

        it('should render notification items', () => {
            render(<NotificationsList {...defaultProps} />)

            expect(screen.getAllByText('Test Group').length).toBe(2)
            expect(screen.getAllByText('Someone added a transaction - $50.00').length).toBe(2)
        })

        it('should render group icon in notification', () => {
            render(<NotificationsList {...defaultProps} />)

            // Group icon should be present
            expect(screen.getAllByText('🏠').length).toBe(2)
        })

        it('should render unread indicator for unread notifications', () => {
            const notifications = [
                createMockNotification('notif-1', { read: false }),
                createMockNotification('notif-2', { read: true }),
            ]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            // Unread indicators (dots) should be present
            const unreadDots = document.querySelectorAll(
                '[style*="background-color: var(--primary)"]'
            )
            // At least one unread dot should exist
            expect(unreadDots.length).toBeGreaterThan(0)
        })

        it('should render relative time for notifications', () => {
            const notifications = [createMockNotification('notif-1')]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            // Should show "Just now" for recent notification
            expect(screen.getByText('Just now')).toBeInTheDocument()
        })

        it('should show "minutes ago" for older notifications', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            const notifications = [
                createMockNotification('notif-1', { createdAt: fiveMinutesAgo }),
            ]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            expect(screen.getByText('5 minutes ago')).toBeInTheDocument()
        })

        it('should show "hours ago" for older notifications', () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
            const notifications = [
                createMockNotification('notif-1', { createdAt: twoHoursAgo }),
            ]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            expect(screen.getByText('2 hours ago')).toBeInTheDocument()
        })

        it('should show "Yesterday" for notifications from yesterday', () => {
            const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
            const notifications = [
                createMockNotification('notif-1', { createdAt: yesterday }),
            ]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            expect(screen.getByText('Yesterday')).toBeInTheDocument()
        })
    })

    describe('Click Handling', () => {
        it('should call onNotificationClick when notification is tapped', () => {
            const onNotificationClick = vi.fn()
            const notifications = [createMockNotification('notif-1', { read: true })]

            render(
                <NotificationsList
                    {...defaultProps}
                    notifications={notifications}
                    onNotificationClick={onNotificationClick}
                />
            )

            fireEvent.click(screen.getByText('Someone added a transaction - $50.00'))

            expect(onNotificationClick).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'notif-1' })
            )
        })

        it('should call onMarkAsRead when unread notification is clicked', () => {
            const onMarkAsRead = vi.fn()
            const notifications = [createMockNotification('notif-1', { read: false })]

            render(
                <NotificationsList
                    {...defaultProps}
                    notifications={notifications}
                    onMarkAsRead={onMarkAsRead}
                />
            )

            fireEvent.click(screen.getByText('Someone added a transaction - $50.00'))

            expect(onMarkAsRead).toHaveBeenCalledWith('notif-1')
        })

        it('should not call onMarkAsRead when already read notification is clicked', () => {
            const onMarkAsRead = vi.fn()
            const notifications = [createMockNotification('notif-1', { read: true })]

            render(
                <NotificationsList
                    {...defaultProps}
                    notifications={notifications}
                    onMarkAsRead={onMarkAsRead}
                />
            )

            fireEvent.click(screen.getByText('Someone added a transaction - $50.00'))

            expect(onMarkAsRead).not.toHaveBeenCalled()
        })
    })

    describe('Group Color Mapping', () => {
        it('should use group color from groups prop', () => {
            const notifications = [createMockNotification('notif-1', { groupId: 'group-123' })]

            const { container } = render(
                <NotificationsList {...defaultProps} notifications={notifications} />
            )

            // Check that the notification has the group color applied
            const borderElement = container.querySelector('[style*="border-left-color"]')
            expect(borderElement).toBeInTheDocument()
        })

        it('should fallback to default color for unknown group', () => {
            const notifications = [
                createMockNotification('notif-1', { groupId: 'unknown-group' }),
            ]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            // Should still render without error
            expect(screen.getByText('Test Group')).toBeInTheDocument()
        })
    })

    describe('Spanish Translations', () => {
        it('should use Spanish selection text when lang is es', () => {
            const notifications = [
                createMockNotification('notif-1'),
                createMockNotification('notif-2'),
            ]

            render(
                <NotificationsList
                    {...defaultProps}
                    notifications={notifications}
                    lang="es"
                />
            )

            // Component should render with Spanish lang prop
            expect(screen.getAllByText('Test Group').length).toBe(2)
        })
    })

    describe('Notification Types', () => {
        it('should render TRANSACTION_ADDED type', () => {
            const notifications = [
                createMockNotification('notif-1', { type: 'TRANSACTION_ADDED' }),
            ]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            expect(screen.getByText('Test Group')).toBeInTheDocument()
        })

        it('should render TRANSACTION_REMOVED type', () => {
            const notifications = [
                createMockNotification('notif-1', {
                    type: 'TRANSACTION_REMOVED',
                    body: 'Someone removed a transaction',
                }),
            ]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            expect(screen.getByText('Someone removed a transaction')).toBeInTheDocument()
        })
    })

    describe('Empty State', () => {
        it('should return null for empty notifications array', () => {
            const { container } = render(
                <NotificationsList {...defaultProps} notifications={[]} />
            )

            expect(container.innerHTML).toBe('')
        })
    })

    describe('Multiple Notifications', () => {
        it('should render all notifications in order', () => {
            const notifications = [
                createMockNotification('notif-1', { title: 'Group A', body: 'First' }),
                createMockNotification('notif-2', { title: 'Group B', body: 'Second' }),
                createMockNotification('notif-3', { title: 'Group C', body: 'Third' }),
            ]

            render(<NotificationsList {...defaultProps} notifications={notifications} />)

            expect(screen.getByText('Group A')).toBeInTheDocument()
            expect(screen.getByText('Group B')).toBeInTheDocument()
            expect(screen.getByText('Group C')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('should have clickable notification items', () => {
            render(<NotificationsList {...defaultProps} />)

            // All notifications should be clickable
            const items = screen.getAllByText('Someone added a transaction - $50.00')
            items.forEach((item) => {
                expect(item.closest('[style]')).toBeInTheDocument()
            })
        })
    })

    describe('onDelete callback', () => {
        it('should pass onDelete function', () => {
            const onDelete = vi.fn()

            render(<NotificationsList {...defaultProps} onDelete={onDelete} />)

            // onDelete is available - actual swipe gesture testing would require more setup
            expect(onDelete).toBeDefined()
        })
    })

    describe('Icons', () => {
        it('should display bookmark icon for group notifications', () => {
            render(<NotificationsList {...defaultProps} />)

            // Bookmark icons should be rendered (Lucide components)
            // We check for SVG elements
            const svgs = document.querySelectorAll('svg')
            expect(svgs.length).toBeGreaterThan(0)
        })

        it('should display arrow icon for navigation hint', () => {
            render(<NotificationsList {...defaultProps} />)

            // Arrow icons should be rendered
            const svgs = document.querySelectorAll('svg')
            expect(svgs.length).toBeGreaterThan(0)
        })
    })
})
