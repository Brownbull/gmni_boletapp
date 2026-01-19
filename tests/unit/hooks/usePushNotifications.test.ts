/**
 * usePushNotifications Hook Unit Tests
 *
 * Story 14c.13: Web Push notifications for shared group events
 *
 * Tests for the React hook that manages Web Push notification
 * subscriptions using VAPID authentication.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock the web push service
const mockSubscribeToWebPush = vi.fn()
const mockSaveSubscriptionToServer = vi.fn()
const mockDisableWebPushNotifications = vi.fn()
const mockIsWebPushSupported = vi.fn()
const mockGetNotificationPermission = vi.fn()
const mockRequestNotificationPermission = vi.fn()
const mockIsWebPushEnabledLocal = vi.fn()

vi.mock('../../../src/services/webPushService', () => ({
    isWebPushSupported: () => mockIsWebPushSupported(),
    getNotificationPermission: () => mockGetNotificationPermission(),
    requestNotificationPermission: () => mockRequestNotificationPermission(),
    subscribeToWebPush: () => mockSubscribeToWebPush(),
    saveSubscriptionToServer: (sub: unknown) => mockSaveSubscriptionToServer(sub),
    disableWebPushNotifications: () => mockDisableWebPushNotifications(),
    isWebPushEnabledLocal: () => mockIsWebPushEnabledLocal(),
    WEB_PUSH_CONSTANTS: {
        LOCAL_STORAGE_KEY: 'web_push_enabled',
        LOCAL_STORAGE_ENDPOINT_KEY: 'web_push_endpoint',
    },
}))

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

// Mock navigator.serviceWorker
const mockServiceWorkerAddEventListener = vi.fn()
const mockServiceWorkerRemoveEventListener = vi.fn()

Object.defineProperty(global, 'navigator', {
    value: {
        serviceWorker: {
            addEventListener: mockServiceWorkerAddEventListener,
            removeEventListener: mockServiceWorkerRemoveEventListener,
            ready: Promise.resolve({
                pushManager: {
                    getSubscription: vi.fn().mockResolvedValue(null),
                    subscribe: vi.fn().mockResolvedValue({
                        endpoint: 'https://push.example.com/123',
                        getKey: vi.fn().mockReturnValue(new ArrayBuffer(8)),
                    }),
                },
            }),
        },
    },
    writable: true,
})

Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
})

import { usePushNotifications } from '../../../src/hooks/usePushNotifications'

// ============================================================================
// Tests
// ============================================================================

describe('usePushNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStorage = {}
        mockIsWebPushSupported.mockReturnValue(true)
        mockGetNotificationPermission.mockReturnValue('default')
        mockIsWebPushEnabledLocal.mockReturnValue(false)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('Initialization', () => {
        it('should check web push support on mount', () => {
            renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(mockIsWebPushSupported).toHaveBeenCalled()
        })

        it('should return isSupported=false when web push not supported', () => {
            mockIsWebPushSupported.mockReturnValue(false)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.isSupported).toBe(false)
        })

        it('should return isSupported=true when web push supported', () => {
            mockIsWebPushSupported.mockReturnValue(true)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.isSupported).toBe(true)
        })

        it('should check current notification permission', () => {
            mockGetNotificationPermission.mockReturnValue('granted')

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.permission).toBe('granted')
        })

        it('should set token when permission granted and locally enabled', () => {
            mockGetNotificationPermission.mockReturnValue('granted')
            mockIsWebPushEnabledLocal.mockReturnValue(true)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.token).toBe('web-push-enabled')
        })

        it('should not set token when permission denied', () => {
            mockGetNotificationPermission.mockReturnValue('denied')

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.token).toBeNull()
        })
    })

    describe('Service Worker Message Listener', () => {
        it('should add message listener when onNotificationReceived provided', () => {
            const onNotificationReceived = vi.fn()

            renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                    onNotificationReceived,
                })
            )

            expect(mockServiceWorkerAddEventListener).toHaveBeenCalledWith(
                'message',
                expect.any(Function)
            )
        })

        it('should add message listener when onNotificationClick provided', () => {
            const onNotificationClick = vi.fn()

            renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                    onNotificationClick,
                })
            )

            expect(mockServiceWorkerAddEventListener).toHaveBeenCalledWith(
                'message',
                expect.any(Function)
            )
        })

        it('should remove message listener on unmount', () => {
            const onNotificationClick = vi.fn()

            const { unmount } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                    onNotificationClick,
                })
            )

            unmount()

            expect(mockServiceWorkerRemoveEventListener).toHaveBeenCalledWith(
                'message',
                expect.any(Function)
            )
        })

        it('should not add listener when no callbacks provided', () => {
            renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(mockServiceWorkerAddEventListener).not.toHaveBeenCalled()
        })
    })

    describe('enableNotifications', () => {
        it('should return false when web push not supported', async () => {
            mockIsWebPushSupported.mockReturnValue(false)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            let success: boolean = false
            await act(async () => {
                success = await result.current.enableNotifications()
            })

            expect(success).toBe(false)
            expect(result.current.error).toContain('not supported')
        })

        it('should request notification permission', async () => {
            mockRequestNotificationPermission.mockResolvedValue('granted')
            mockSubscribeToWebPush.mockResolvedValue({
                endpoint: 'https://push.example.com/123',
            })
            mockSaveSubscriptionToServer.mockResolvedValue(true)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            await act(async () => {
                await result.current.enableNotifications()
            })

            expect(mockRequestNotificationPermission).toHaveBeenCalled()
        })

        it('should return false when permission denied', async () => {
            mockRequestNotificationPermission.mockResolvedValue('denied')

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            let success: boolean = false
            await act(async () => {
                success = await result.current.enableNotifications()
            })

            expect(success).toBe(false)
            expect(result.current.permission).toBe('denied')
            expect(result.current.error).toContain('denied')
        })

        it('should subscribe to web push when permission granted', async () => {
            mockRequestNotificationPermission.mockResolvedValue('granted')
            mockSubscribeToWebPush.mockResolvedValue({
                endpoint: 'https://push.example.com/123',
            })
            mockSaveSubscriptionToServer.mockResolvedValue(true)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            await act(async () => {
                await result.current.enableNotifications()
            })

            expect(mockSubscribeToWebPush).toHaveBeenCalled()
        })

        it('should save subscription to server', async () => {
            const mockSubscription = { endpoint: 'https://push.example.com/123' }
            mockRequestNotificationPermission.mockResolvedValue('granted')
            mockSubscribeToWebPush.mockResolvedValue(mockSubscription)
            mockSaveSubscriptionToServer.mockResolvedValue(true)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            await act(async () => {
                await result.current.enableNotifications()
            })

            expect(mockSaveSubscriptionToServer).toHaveBeenCalledWith(mockSubscription)
        })

        it('should return false when subscription fails', async () => {
            mockRequestNotificationPermission.mockResolvedValue('granted')
            mockSubscribeToWebPush.mockResolvedValue(null)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            let success: boolean = false
            await act(async () => {
                success = await result.current.enableNotifications()
            })

            expect(success).toBe(false)
            expect(result.current.error).toContain('Failed to create')
        })

        it('should return false when server save fails', async () => {
            mockRequestNotificationPermission.mockResolvedValue('granted')
            mockSubscribeToWebPush.mockResolvedValue({
                endpoint: 'https://push.example.com/123',
            })
            mockSaveSubscriptionToServer.mockResolvedValue(false)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            let success: boolean = false
            await act(async () => {
                success = await result.current.enableNotifications()
            })

            expect(success).toBe(false)
            expect(result.current.error).toContain('Failed to save')
        })

        it('should update token on success', async () => {
            mockRequestNotificationPermission.mockResolvedValue('granted')
            mockSubscribeToWebPush.mockResolvedValue({
                endpoint: 'https://push.example.com/123',
            })
            mockSaveSubscriptionToServer.mockResolvedValue(true)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            await act(async () => {
                await result.current.enableNotifications()
            })

            expect(result.current.token).toBe('web-push-enabled')
        })

        it('should set isLoading during operation', async () => {
            mockRequestNotificationPermission.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve('granted'), 50))
            )
            mockSubscribeToWebPush.mockResolvedValue({
                endpoint: 'https://push.example.com/123',
            })
            mockSaveSubscriptionToServer.mockResolvedValue(true)

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.isLoading).toBe(false)

            let enablePromise: Promise<boolean>
            act(() => {
                enablePromise = result.current.enableNotifications()
            })

            expect(result.current.isLoading).toBe(true)

            await act(async () => {
                await enablePromise
            })

            expect(result.current.isLoading).toBe(false)
        })
    })

    describe('disableNotifications', () => {
        it('should call disableWebPushNotifications', async () => {
            mockDisableWebPushNotifications.mockResolvedValue({ success: true })

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            await act(async () => {
                await result.current.disableNotifications()
            })

            expect(mockDisableWebPushNotifications).toHaveBeenCalled()
        })

        it('should clear token on success', async () => {
            mockGetNotificationPermission.mockReturnValue('granted')
            mockIsWebPushEnabledLocal.mockReturnValue(true)
            mockDisableWebPushNotifications.mockResolvedValue({ success: true })

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.token).toBe('web-push-enabled')

            await act(async () => {
                await result.current.disableNotifications()
            })

            expect(result.current.token).toBeNull()
        })

        it('should set isLoading during operation', async () => {
            mockDisableWebPushNotifications.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50))
            )

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.isLoading).toBe(false)

            let disablePromise: Promise<void>
            act(() => {
                disablePromise = result.current.disableNotifications()
            })

            expect(result.current.isLoading).toBe(true)

            await act(async () => {
                await disablePromise
            })

            expect(result.current.isLoading).toBe(false)
        })

        it('should handle errors gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            mockDisableWebPushNotifications.mockRejectedValue(new Error('Network error'))

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            await act(async () => {
                await result.current.disableNotifications()
            })

            expect(result.current.error).toContain('Failed to disable')
            consoleSpy.mockRestore()
        })
    })

    describe('Return Value', () => {
        it('should return all expected properties', () => {
            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current).toHaveProperty('isSupported')
            expect(result.current).toHaveProperty('permission')
            expect(result.current).toHaveProperty('token')
            expect(result.current).toHaveProperty('isLoading')
            expect(result.current).toHaveProperty('error')
            expect(result.current).toHaveProperty('enableNotifications')
            expect(result.current).toHaveProperty('disableNotifications')
        })

        it('should have correct initial values', () => {
            mockIsWebPushSupported.mockReturnValue(true)
            mockGetNotificationPermission.mockReturnValue('default')

            const { result } = renderHook(() =>
                usePushNotifications({
                    db: {} as any,
                    userId: 'user-123',
                    appId: 'test-app',
                })
            )

            expect(result.current.isSupported).toBe(true)
            expect(result.current.permission).toBe('default')
            expect(result.current.token).toBeNull()
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBeNull()
        })
    })
})
