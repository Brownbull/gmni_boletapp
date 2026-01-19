/**
 * webPushService Unit Tests
 *
 * Story 14c.13: Web Push notifications for shared group events
 *
 * Tests for the client-side Web Push service that handles
 * VAPID-based push notification subscriptions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Firebase Functions
const mockHttpsCallable = vi.fn()
vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(() => ({})),
    httpsCallable: () => mockHttpsCallable,
}))

// Mock service worker and Push API
const mockPushManagerSubscribe = vi.fn()
const mockPushManagerGetSubscription = vi.fn()
const mockSubscriptionUnsubscribe = vi.fn()
const mockSubscriptionToJSON = vi.fn()

// Create mock subscription
const createMockSubscription = (endpoint = 'https://push.example.com/123') => ({
    endpoint,
    getKey: vi.fn().mockReturnValue(new ArrayBuffer(8)),
    toJSON: () => ({
        endpoint,
        keys: {
            p256dh: 'mock-p256dh-key',
            auth: 'mock-auth-key',
        },
    }),
    unsubscribe: mockSubscriptionUnsubscribe.mockResolvedValue(true),
})

// Mock localStorage
let mockStorage: Record<string, string> = {}
const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
    }),
    clear: vi.fn(() => {
        mockStorage = {}
    }),
    length: 0,
    key: vi.fn(() => null),
}

Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
})

// Mock navigator
const mockPushManager = {
    subscribe: mockPushManagerSubscribe,
    getSubscription: mockPushManagerGetSubscription,
}

const mockServiceWorkerReady = Promise.resolve({
    pushManager: mockPushManager,
})

Object.defineProperty(global, 'navigator', {
    value: {
        serviceWorker: {
            ready: mockServiceWorkerReady,
        },
        userAgent: 'Test Browser',
    },
    writable: true,
})

// Mock window
Object.defineProperty(global, 'window', {
    value: {
        atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
        Notification: {
            permission: 'default',
            requestPermission: vi.fn().mockResolvedValue('granted'),
        },
        PushManager: {},
    },
    writable: true,
})

// Mock Notification
Object.defineProperty(global, 'Notification', {
    value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
    },
    writable: true,
})

// ============================================================================
// Import after mocks
// ============================================================================

import {
    isWebPushSupported,
    getNotificationPermission,
    requestNotificationPermission,
    subscribeToWebPush,
    unsubscribeFromWebPush,
    saveSubscriptionToServer,
    deleteSubscriptionFromServer,
    enableWebPushNotifications,
    disableWebPushNotifications,
    isWebPushEnabledLocal,
    WEB_PUSH_CONSTANTS,
} from '../../../src/services/webPushService'

// ============================================================================
// Tests
// ============================================================================

describe('webPushService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStorage = {}
        mockPushManagerGetSubscription.mockResolvedValue(null)
        mockPushManagerSubscribe.mockResolvedValue(createMockSubscription())
        mockSubscriptionUnsubscribe.mockResolvedValue(true)
        mockHttpsCallable.mockResolvedValue({ data: { success: true } })

        // Reset Notification permission
        Object.defineProperty(Notification, 'permission', {
            value: 'default',
            writable: true,
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('isWebPushSupported', () => {
        it('should return true when all APIs are available', () => {
            expect(isWebPushSupported()).toBe(true)
        })

        it('should return false when serviceWorker is not available', () => {
            const originalNavigator = global.navigator
            Object.defineProperty(global, 'navigator', {
                value: {},
                writable: true,
            })

            expect(isWebPushSupported()).toBe(false)

            Object.defineProperty(global, 'navigator', {
                value: originalNavigator,
                writable: true,
            })
        })
    })

    describe('getNotificationPermission', () => {
        it('should return current permission status', () => {
            Object.defineProperty(Notification, 'permission', {
                value: 'granted',
                writable: true,
            })

            expect(getNotificationPermission()).toBe('granted')
        })

        it('should return denied when Notification not available', () => {
            const originalWindow = global.window
            Object.defineProperty(global, 'window', {
                value: { ...originalWindow, Notification: undefined },
                writable: true,
            })

            // Re-import or test with the mock
            // Since we can't easily re-import, we test the edge case
            Object.defineProperty(global, 'Notification', {
                value: undefined,
                writable: true,
            })

            expect(getNotificationPermission()).toBe('denied')

            Object.defineProperty(global, 'Notification', {
                value: {
                    permission: 'default',
                    requestPermission: vi.fn().mockResolvedValue('granted'),
                },
                writable: true,
            })
        })
    })

    describe('requestNotificationPermission', () => {
        it('should request permission and return result', async () => {
            const result = await requestNotificationPermission()

            expect(result).toBe('granted')
            expect(Notification.requestPermission).toHaveBeenCalled()
        })

        it('should return denied on error', async () => {
            vi.spyOn(Notification, 'requestPermission').mockRejectedValueOnce(
                new Error('Permission error')
            )

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            const result = await requestNotificationPermission()

            expect(result).toBe('denied')
            consoleSpy.mockRestore()
        })
    })

    describe('subscribeToWebPush', () => {
        it('should create new subscription when none exists', async () => {
            mockPushManagerGetSubscription.mockResolvedValueOnce(null)

            const subscription = await subscribeToWebPush()

            expect(subscription).not.toBeNull()
            expect(mockPushManagerSubscribe).toHaveBeenCalledWith({
                userVisibleOnly: true,
                applicationServerKey: expect.any(Uint8Array),
            })
        })

        it('should return existing subscription if already subscribed', async () => {
            const existingSubscription = createMockSubscription()
            mockPushManagerGetSubscription.mockResolvedValueOnce(existingSubscription)

            const subscription = await subscribeToWebPush()

            expect(subscription).toBe(existingSubscription)
            expect(mockPushManagerSubscribe).not.toHaveBeenCalled()
        })

        it('should return null on error', async () => {
            mockPushManagerSubscribe.mockRejectedValueOnce(new Error('Subscription failed'))
            mockPushManagerGetSubscription.mockResolvedValueOnce(null)

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            const subscription = await subscribeToWebPush()

            expect(subscription).toBeNull()
            consoleSpy.mockRestore()
        })
    })

    describe('unsubscribeFromWebPush', () => {
        it('should unsubscribe existing subscription', async () => {
            const existingSubscription = createMockSubscription()
            mockPushManagerGetSubscription.mockResolvedValueOnce(existingSubscription)

            const result = await unsubscribeFromWebPush()

            expect(result).toBe(true)
            expect(mockSubscriptionUnsubscribe).toHaveBeenCalled()
        })

        it('should return true when no subscription exists', async () => {
            mockPushManagerGetSubscription.mockResolvedValueOnce(null)

            const result = await unsubscribeFromWebPush()

            expect(result).toBe(true)
        })

        it('should return false on error', async () => {
            mockPushManagerGetSubscription.mockRejectedValueOnce(new Error('Error'))

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            const result = await unsubscribeFromWebPush()

            expect(result).toBe(false)
            consoleSpy.mockRestore()
        })
    })

    describe('saveSubscriptionToServer', () => {
        it('should call cloud function with subscription data', async () => {
            mockHttpsCallable.mockResolvedValueOnce({ data: { success: true } })
            const subscription = createMockSubscription()

            const result = await saveSubscriptionToServer(subscription as any)

            expect(result).toBe(true)
            expect(mockHttpsCallable).toHaveBeenCalled()
        })

        it('should return false when keys are missing', async () => {
            const subscription = {
                endpoint: 'https://push.example.com/123',
                toJSON: () => ({ endpoint: 'https://push.example.com/123', keys: null }),
            }

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            const result = await saveSubscriptionToServer(subscription as any)

            expect(result).toBe(false)
            consoleSpy.mockRestore()
        })

        it('should return false on cloud function error', async () => {
            mockHttpsCallable.mockRejectedValueOnce(new Error('Server error'))
            const subscription = createMockSubscription()

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            const result = await saveSubscriptionToServer(subscription as any)

            expect(result).toBe(false)
            consoleSpy.mockRestore()
        })
    })

    describe('deleteSubscriptionFromServer', () => {
        it('should call cloud function to delete subscription', async () => {
            mockHttpsCallable.mockResolvedValueOnce({
                data: { success: true, deletedCount: 1 },
            })

            const result = await deleteSubscriptionFromServer()

            expect(result).toBe(true)
        })

        it('should return false on error', async () => {
            mockHttpsCallable.mockRejectedValueOnce(new Error('Server error'))

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            const result = await deleteSubscriptionFromServer()

            expect(result).toBe(false)
            consoleSpy.mockRestore()
        })
    })

    describe('enableWebPushNotifications', () => {
        beforeEach(() => {
            vi.spyOn(Notification, 'requestPermission').mockResolvedValue('granted')
            mockPushManagerGetSubscription.mockResolvedValue(null)
            mockPushManagerSubscribe.mockResolvedValue(createMockSubscription())
            mockHttpsCallable.mockResolvedValue({ data: { success: true } })
        })

        it('should complete full enable flow successfully', async () => {
            const result = await enableWebPushNotifications()

            expect(result.success).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it('should store enabled state in localStorage', async () => {
            await enableWebPushNotifications()

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                WEB_PUSH_CONSTANTS.LOCAL_STORAGE_KEY,
                'true'
            )
        })

        it('should return error when permission denied', async () => {
            vi.spyOn(Notification, 'requestPermission').mockResolvedValue('denied')

            const result = await enableWebPushNotifications()

            expect(result.success).toBe(false)
            expect(result.error).toContain('denied')
        })

        it('should return error when subscription fails', async () => {
            mockPushManagerSubscribe.mockResolvedValueOnce(null)
            mockPushManagerGetSubscription.mockResolvedValueOnce(null)

            const result = await enableWebPushNotifications()

            expect(result.success).toBe(false)
            expect(result.error).toContain('Failed to create')
        })

        it('should return error when server save fails', async () => {
            mockHttpsCallable.mockResolvedValueOnce({ data: { success: false } })

            const result = await enableWebPushNotifications()

            expect(result.success).toBe(false)
            expect(result.error).toContain('Failed to save')
        })
    })

    describe('disableWebPushNotifications', () => {
        it('should complete full disable flow successfully', async () => {
            const existingSubscription = createMockSubscription()
            mockPushManagerGetSubscription.mockResolvedValueOnce(existingSubscription)
            mockHttpsCallable.mockResolvedValueOnce({
                data: { success: true, deletedCount: 1 },
            })

            const result = await disableWebPushNotifications()

            expect(result.success).toBe(true)
        })

        it('should clear localStorage', async () => {
            mockPushManagerGetSubscription.mockResolvedValueOnce(null)
            mockHttpsCallable.mockResolvedValueOnce({
                data: { success: true, deletedCount: 0 },
            })

            await disableWebPushNotifications()

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                WEB_PUSH_CONSTANTS.LOCAL_STORAGE_KEY
            )
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                WEB_PUSH_CONSTANTS.LOCAL_STORAGE_ENDPOINT_KEY
            )
        })
    })

    describe('isWebPushEnabledLocal', () => {
        it('should return true when localStorage has enabled flag', () => {
            mockStorage[WEB_PUSH_CONSTANTS.LOCAL_STORAGE_KEY] = 'true'

            expect(isWebPushEnabledLocal()).toBe(true)
        })

        it('should return false when localStorage flag is missing', () => {
            expect(isWebPushEnabledLocal()).toBe(false)
        })

        it('should return false when localStorage flag is not "true"', () => {
            mockStorage[WEB_PUSH_CONSTANTS.LOCAL_STORAGE_KEY] = 'false'

            expect(isWebPushEnabledLocal()).toBe(false)
        })
    })

    describe('WEB_PUSH_CONSTANTS', () => {
        it('should export expected constants', () => {
            expect(WEB_PUSH_CONSTANTS.LOCAL_STORAGE_KEY).toBe('web_push_enabled')
            expect(WEB_PUSH_CONSTANTS.LOCAL_STORAGE_ENDPOINT_KEY).toBe('web_push_endpoint')
        })
    })
})
