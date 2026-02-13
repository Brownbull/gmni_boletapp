/**
 * useInAppNotifications Hook Unit Tests
 *
 * Story 14c.13: In-app notification history for shared group events
 *
 * Tests for the Firestore real-time subscription hook that manages
 * in-app notifications with read/unread state and delete functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { Firestore } from 'firebase/firestore'

// Define mock functions at module scope for vi.mock hoisting
const mockUnsubscribe = vi.fn()
const mockUpdateDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockBatchUpdate = vi.fn()
const mockBatchDelete = vi.fn()
const mockBatchCommit = vi.fn()
const mockWriteBatch = vi.fn()

// Store onSnapshot callback for controlled triggering
let onSnapshotCallback: ((snapshot: { docs: any[] }) => void) | null = null

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => ({ path: 'mock-collection' })),
    query: vi.fn((...args: unknown[]) => ({ constraints: args })),
    orderBy: vi.fn((...args: unknown[]) => ({ type: 'orderBy', args })),
    limit: vi.fn((n: number) => ({ type: 'limit', n })),
    doc: vi.fn((...args: unknown[]) => ({ path: args.slice(1).join('/') })),
    onSnapshot: vi.fn((query: unknown, onNext: (snapshot: { docs: any[] }) => void, onError?: (err: Error) => void) => {
        onSnapshotCallback = onNext
        // Trigger initial empty snapshot
        onNext({ docs: [] })
        return mockUnsubscribe
    }),
    updateDoc: vi.fn(() => mockUpdateDoc()),
    deleteDoc: vi.fn(() => mockDeleteDoc()),
    writeBatch: vi.fn(() => ({
        update: mockBatchUpdate,
        delete: mockBatchDelete,
        commit: mockBatchCommit,
    })),
}))

import { useInAppNotifications } from '../../../src/hooks/useInAppNotifications'
import type { InAppNotificationClient } from '../../../src/types/notification'
import { onSnapshot, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'

// ============================================================================
// Test Setup
// ============================================================================

const mockDb = {} as Firestore
const mockUserId = 'user-123'
const mockAppId = 'test-app'

const createMockNotification = (
    id: string,
    read = false,
    daysAgo = 0
): InAppNotificationClient => ({
    id,
    type: 'TRANSACTION_ADDED',
    title: 'Test Group',
    body: 'Someone added a transaction',
    read,
    createdAt: new Date(Date.now() - daysAgo * 86400000),
    groupId: 'group-123',
    groupName: 'Test Group',
    groupIcon: '🏠',
    transactionId: 'tx-123',
    actorId: 'actor-123',
    actorName: 'John',
    actionUrl: '/?view=group&groupId=group-123',
})

// ============================================================================
// Tests
// ============================================================================

describe('useInAppNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUpdateDoc.mockResolvedValue(undefined)
        mockDeleteDoc.mockResolvedValue(undefined)
        mockBatchCommit.mockResolvedValue(undefined)
        onSnapshotCallback = null
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Initialization', () => {
        it('should return empty state when db is null', () => {
            const { result } = renderHook(() =>
                useInAppNotifications(null, mockUserId, mockAppId)
            )

            expect(result.current.notifications).toEqual([])
            expect(result.current.unreadCount).toBe(0)
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBeNull()
        })

        it('should return empty state when userId is null', () => {
            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, null, mockAppId)
            )

            expect(result.current.notifications).toEqual([])
            expect(result.current.isLoading).toBe(false)
        })

        it('should return empty state when appId is null', () => {
            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, null)
            )

            expect(result.current.notifications).toEqual([])
            expect(result.current.isLoading).toBe(false)
        })

        it('should start loading when all params provided', () => {
            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            // Initial state - loading starts true then goes false after onSnapshot
            expect(result.current.notifications).toEqual([])
        })

        it('should subscribe to Firestore on mount', () => {
            renderHook(() => useInAppNotifications(mockDb, mockUserId, mockAppId))

            expect(onSnapshot).toHaveBeenCalled()
        })

        it('should unsubscribe on unmount', () => {
            const { unmount } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            unmount()

            expect(mockUnsubscribe).toHaveBeenCalled()
        })
    })

    describe('Notification Data', () => {
        it('should parse notifications from snapshot', async () => {
            const mockDocs = [
                {
                    id: 'notif-1',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group 1',
                        body: 'Test body',
                        read: false,
                        createdAt: { toDate: () => new Date() },
                        groupId: 'group-1',
                    }),
                },
                {
                    id: 'notif-2',
                    data: () => ({
                        type: 'TRANSACTION_REMOVED',
                        title: 'Group 2',
                        body: 'Test body 2',
                        read: true,
                        createdAt: { toDate: () => new Date() },
                        groupId: 'group-2',
                    }),
                },
            ]

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            // Trigger snapshot with data
            act(() => {
                if (onSnapshotCallback) {
                    onSnapshotCallback({ docs: mockDocs })
                }
            })

            await waitFor(() => {
                expect(result.current.notifications.length).toBe(2)
            })

            expect(result.current.notifications[0].id).toBe('notif-1')
            expect(result.current.notifications[1].id).toBe('notif-2')
        })

        it('should handle null createdAt gracefully', async () => {
            const mockDocs = [
                {
                    id: 'notif-1',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group 1',
                        body: 'Test body',
                        read: false,
                        createdAt: null, // Missing timestamp
                        groupId: 'group-1',
                    }),
                },
            ]

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            // Trigger snapshot with data
            act(() => {
                if (onSnapshotCallback) {
                    onSnapshotCallback({ docs: mockDocs })
                }
            })

            await waitFor(() => {
                expect(result.current.notifications.length).toBe(1)
            })

            expect(result.current.notifications[0].createdAt).toBeInstanceOf(Date)
        })
    })

    describe('Unread Count', () => {
        it('should calculate unread count correctly', async () => {
            const mockDocs = [
                {
                    id: 'notif-1',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group 1',
                        body: 'Test',
                        read: false,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
                {
                    id: 'notif-2',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group 2',
                        body: 'Test',
                        read: true,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
                {
                    id: 'notif-3',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group 3',
                        body: 'Test',
                        read: false,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
            ]

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            act(() => {
                if (onSnapshotCallback) {
                    onSnapshotCallback({ docs: mockDocs })
                }
            })

            await waitFor(() => {
                expect(result.current.unreadCount).toBe(2)
            })
        })

        it('should return 0 for all read notifications', async () => {
            const mockDocs = [
                {
                    id: 'notif-1',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group',
                        body: 'Test',
                        read: true,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
            ]

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            act(() => {
                if (onSnapshotCallback) {
                    onSnapshotCallback({ docs: mockDocs })
                }
            })

            await waitFor(() => {
                expect(result.current.unreadCount).toBe(0)
            })
        })
    })

    describe('markAsRead', () => {
        it('should call updateDoc with read: true', async () => {
            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            await act(async () => {
                await result.current.markAsRead('notif-123')
            })

            expect(updateDoc).toHaveBeenCalled()
        })

        it('should not call updateDoc when db is null', async () => {
            const { result } = renderHook(() =>
                useInAppNotifications(null, mockUserId, mockAppId)
            )

            await act(async () => {
                await result.current.markAsRead('notif-123')
            })

            expect(updateDoc).not.toHaveBeenCalled()
        })

        it('should handle errors gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            mockUpdateDoc.mockRejectedValueOnce(new Error('Network error'))

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            await act(async () => {
                await result.current.markAsRead('notif-123')
            })

            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })
    })

    describe('markAllAsRead', () => {
        it('should use batch write for multiple notifications', async () => {
            const mockDocs = [
                {
                    id: 'notif-1',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group',
                        body: 'Test',
                        read: false,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
                {
                    id: 'notif-2',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group',
                        body: 'Test',
                        read: false,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
            ]

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            act(() => {
                if (onSnapshotCallback) {
                    onSnapshotCallback({ docs: mockDocs })
                }
            })

            await waitFor(() => {
                expect(result.current.notifications.length).toBe(2)
            })

            await act(async () => {
                await result.current.markAllAsRead()
            })

            expect(writeBatch).toHaveBeenCalled()
        })

        it('should not call batch when all already read', async () => {
            const mockDocs = [
                {
                    id: 'notif-1',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group',
                        body: 'Test',
                        read: true, // Already read
                        createdAt: { toDate: () => new Date() },
                    }),
                },
            ]

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            act(() => {
                if (onSnapshotCallback) {
                    onSnapshotCallback({ docs: mockDocs })
                }
            })

            await waitFor(() => {
                expect(result.current.notifications.length).toBe(1)
            })

            vi.mocked(writeBatch).mockClear()

            await act(async () => {
                await result.current.markAllAsRead()
            })

            // writeBatch not called because no unread notifications
            expect(writeBatch).not.toHaveBeenCalled()
        })
    })

    describe('deleteNotification', () => {
        it('should call deleteDoc for single notification', async () => {
            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            await act(async () => {
                await result.current.deleteNotification('notif-123')
            })

            expect(deleteDoc).toHaveBeenCalled()
        })

        it('should not call deleteDoc when db is null', async () => {
            const { result } = renderHook(() =>
                useInAppNotifications(null, mockUserId, mockAppId)
            )

            await act(async () => {
                await result.current.deleteNotification('notif-123')
            })

            expect(deleteDoc).not.toHaveBeenCalled()
        })
    })

    describe('deleteAllNotifications', () => {
        it('should use batch delete for all notifications', async () => {
            const mockDocs = [
                {
                    id: 'notif-1',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group',
                        body: 'Test',
                        read: false,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
                {
                    id: 'notif-2',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group',
                        body: 'Test',
                        read: true,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
            ]

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            act(() => {
                if (onSnapshotCallback) {
                    onSnapshotCallback({ docs: mockDocs })
                }
            })

            await waitFor(() => {
                expect(result.current.notifications.length).toBe(2)
            })

            await act(async () => {
                await result.current.deleteAllNotifications()
            })

            expect(writeBatch).toHaveBeenCalled()
        })

        it('should not call batch when no notifications', async () => {
            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            // Initial empty snapshot already triggered
            await waitFor(() => {
                expect(result.current.notifications.length).toBe(0)
            })

            vi.mocked(writeBatch).mockClear()

            await act(async () => {
                await result.current.deleteAllNotifications()
            })

            expect(writeBatch).not.toHaveBeenCalled()
        })

        it('should return BatchResult with success counts', async () => {
            const mockDocs = [
                {
                    id: 'notif-1',
                    data: () => ({
                        type: 'TRANSACTION_ADDED',
                        title: 'Group',
                        body: 'Test',
                        read: false,
                        createdAt: { toDate: () => new Date() },
                    }),
                },
            ]

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            act(() => {
                if (onSnapshotCallback) {
                    onSnapshotCallback({ docs: mockDocs })
                }
            })

            await waitFor(() => {
                expect(result.current.notifications.length).toBe(1)
            })

            let batchResult: unknown
            await act(async () => {
                batchResult = await result.current.deleteAllNotifications()
            })

            expect(batchResult).toEqual({
                totalBatches: 1,
                succeededBatches: 1,
                failedBatches: 0,
                errors: [],
            })
        })

        it('should return undefined when no db is provided', async () => {
            const { result } = renderHook(() =>
                useInAppNotifications(null, mockUserId, mockAppId)
            )

            let batchResult: unknown = 'not-called'
            await act(async () => {
                batchResult = await result.current.deleteAllNotifications()
            })

            expect(batchResult).toBeUndefined()
        })
    })

    describe('Error Handling', () => {
        it('should set error state on subscription failure', async () => {
            // Override onSnapshot to simulate error
            const testError = new Error('Firestore connection failed')
            vi.mocked(onSnapshot).mockImplementationOnce((query: unknown, onNext: unknown, onError?: (err: Error) => void) => {
                if (onError) {
                    onError(testError)
                }
                return mockUnsubscribe
            })

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            const { result } = renderHook(() =>
                useInAppNotifications(mockDb, mockUserId, mockAppId)
            )

            await waitFor(() => {
                expect(result.current.error).not.toBeNull()
            })

            expect(result.current.isLoading).toBe(false)
            consoleSpy.mockRestore()
        })
    })
})
