/**
 * Unit tests for useAppPushNotifications hook
 *
 * Story 14c-refactor.10: App Decomposition - Extract app-level hooks
 *
 * Tests the push notifications coordination hook:
 * - Wrapping usePushNotifications
 * - Toast message integration
 * - Notification click tracking
 * - isPushEnabled derivation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppPushNotifications } from '../../../../src/hooks/app/useAppPushNotifications';

// Mock usePushNotifications
const mockPushNotifications = {
    isSupported: true,
    permission: 'granted' as NotificationPermission,
    token: 'test-token',
    isLoading: false,
    error: null,
    enableNotifications: vi.fn(),
    disableNotifications: vi.fn(),
};

let capturedOnNotificationReceived: ((title: string, body: string) => void) | undefined;
let capturedOnNotificationClick: ((data: any) => void) | undefined;

vi.mock('../../../../src/hooks/usePushNotifications', () => ({
    usePushNotifications: vi.fn((options: any) => {
        capturedOnNotificationReceived = options.onNotificationReceived;
        capturedOnNotificationClick = options.onNotificationClick;
        return mockPushNotifications;
    }),
}));

describe('useAppPushNotifications', () => {
    const defaultOptions = {
        db: {} as any,
        userId: 'user-123',
        appId: 'test-app',
        setToastMessage: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        capturedOnNotificationReceived = undefined;
        capturedOnNotificationClick = undefined;

        // Reset mock state
        mockPushNotifications.isSupported = true;
        mockPushNotifications.permission = 'granted';
        mockPushNotifications.token = 'test-token';
        mockPushNotifications.isLoading = false;
        mockPushNotifications.error = null;
    });

    describe('initial state', () => {
        it('should return push notification state', () => {
            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            expect(result.current.pushNotifications).toBe(mockPushNotifications);
            expect(result.current.lastNotificationClick).toBeNull();
        });

        it('should derive isPushEnabled correctly when enabled', () => {
            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            expect(result.current.isPushEnabled).toBe(true);
        });
    });

    describe('isPushEnabled derivation', () => {
        it('should be false when not supported', () => {
            mockPushNotifications.isSupported = false;

            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            expect(result.current.isPushEnabled).toBe(false);
        });

        it('should be false when permission is not granted', () => {
            mockPushNotifications.permission = 'denied';

            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            expect(result.current.isPushEnabled).toBe(false);
        });

        it('should be false when permission is default', () => {
            mockPushNotifications.permission = 'default';

            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            expect(result.current.isPushEnabled).toBe(false);
        });

        it('should be false when token is null', () => {
            mockPushNotifications.token = null;

            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            expect(result.current.isPushEnabled).toBe(false);
        });

        it('should be true when supported, granted, and has token', () => {
            mockPushNotifications.isSupported = true;
            mockPushNotifications.permission = 'granted';
            mockPushNotifications.token = 'test-token';

            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            expect(result.current.isPushEnabled).toBe(true);
        });
    });

    describe('notification received handling', () => {
        it('should call setToastMessage when notification received', () => {
            const setToastMessage = vi.fn();
            renderHook(() => useAppPushNotifications({ ...defaultOptions, setToastMessage }));

            // Trigger the captured callback
            act(() => {
                capturedOnNotificationReceived?.('Test Title', 'Test Body');
            });

            expect(setToastMessage).toHaveBeenCalledWith({
                text: 'Test Title: Test Body',
                type: 'info',
            });
        });

        it('should not throw when setToastMessage is not provided', () => {
            renderHook(() => useAppPushNotifications({ ...defaultOptions, setToastMessage: undefined }));

            // Should not throw
            expect(() => {
                act(() => {
                    capturedOnNotificationReceived?.('Test Title', 'Test Body');
                });
            }).not.toThrow();
        });
    });

    describe('notification click handling', () => {
        it('should track last notification click', () => {
            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            expect(result.current.lastNotificationClick).toBeNull();

            const clickData = { groupId: 'group-123', transactionId: 'tx-456' };
            act(() => {
                capturedOnNotificationClick?.(clickData);
            });

            expect(result.current.lastNotificationClick).toEqual(clickData);
        });

        it('should call custom onNotificationClick handler', () => {
            const onNotificationClick = vi.fn();
            renderHook(() => useAppPushNotifications({ ...defaultOptions, onNotificationClick }));

            const clickData = { groupId: 'group-123' };
            act(() => {
                capturedOnNotificationClick?.(clickData);
            });

            expect(onNotificationClick).toHaveBeenCalledWith(clickData);
        });

        it('should clear last notification click', () => {
            const { result } = renderHook(() => useAppPushNotifications(defaultOptions));

            // Set a click
            act(() => {
                capturedOnNotificationClick?.({ groupId: 'group-123' });
            });

            expect(result.current.lastNotificationClick).not.toBeNull();

            // Clear it
            act(() => {
                result.current.clearLastNotificationClick();
            });

            expect(result.current.lastNotificationClick).toBeNull();
        });
    });

    describe('null parameters', () => {
        it('should handle null db gracefully', () => {
            const optionsWithNullDb = {
                ...defaultOptions,
                db: null,
            };

            const { result } = renderHook(() => useAppPushNotifications(optionsWithNullDb));

            expect(result.current.pushNotifications).toBeDefined();
        });

        it('should handle null userId gracefully', () => {
            const optionsWithNullUser = {
                ...defaultOptions,
                userId: null,
            };

            const { result } = renderHook(() => useAppPushNotifications(optionsWithNullUser));

            expect(result.current.pushNotifications).toBeDefined();
        });

        it('should handle null appId gracefully', () => {
            const optionsWithNullAppId = {
                ...defaultOptions,
                appId: null,
            };

            const { result } = renderHook(() => useAppPushNotifications(optionsWithNullAppId));

            expect(result.current.pushNotifications).toBeDefined();
        });
    });
});
