/**
 * Unit tests for useOnlineStatus hook
 *
 * Story 14c-refactor.10: App Decomposition - Extract app-level hooks
 *
 * Tests the online status monitoring hook:
 * - Initial online status detection
 * - Online/offline event handling
 * - Callback invocation on state changes
 * - wasOffline tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../../../../src/hooks/app/useOnlineStatus';

describe('useOnlineStatus', () => {
    let originalNavigator: typeof navigator.onLine;
    let onlineListeners: Array<() => void> = [];
    let offlineListeners: Array<() => void> = [];

    beforeEach(() => {
        // Store original
        originalNavigator = navigator.onLine;

        // Clear listener arrays
        onlineListeners = [];
        offlineListeners = [];

        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            configurable: true,
            writable: true,
        });

        // Mock window event listeners
        vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
            if (event === 'online' && typeof handler === 'function') {
                onlineListeners.push(handler);
            }
            if (event === 'offline' && typeof handler === 'function') {
                offlineListeners.push(handler);
            }
        });

        vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
            if (event === 'online' && typeof handler === 'function') {
                onlineListeners = onlineListeners.filter(h => h !== handler);
            }
            if (event === 'offline' && typeof handler === 'function') {
                offlineListeners = offlineListeners.filter(h => h !== handler);
            }
        });
    });

    afterEach(() => {
        // Restore navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            value: originalNavigator,
            configurable: true,
            writable: true,
        });

        vi.restoreAllMocks();
    });

    describe('initial state', () => {
        it('should return online status from navigator.onLine', () => {
            const { result } = renderHook(() => useOnlineStatus());

            expect(result.current.isOnline).toBe(true);
            expect(result.current.wasOffline).toBe(false);
        });

        it('should return offline when navigator.onLine is false', () => {
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true,
            });

            const { result } = renderHook(() => useOnlineStatus());

            expect(result.current.isOnline).toBe(false);
        });
    });

    describe('event handling', () => {
        it('should update isOnline to false on offline event', () => {
            const { result } = renderHook(() => useOnlineStatus());

            expect(result.current.isOnline).toBe(true);

            // Simulate offline event
            act(() => {
                Object.defineProperty(navigator, 'onLine', {
                    value: false,
                    configurable: true,
                });
                offlineListeners.forEach(handler => handler());
            });

            expect(result.current.isOnline).toBe(false);
            expect(result.current.wasOffline).toBe(true);
        });

        it('should update isOnline to true on online event', () => {
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true,
            });

            const { result } = renderHook(() => useOnlineStatus());

            expect(result.current.isOnline).toBe(false);

            // Simulate online event
            act(() => {
                Object.defineProperty(navigator, 'onLine', {
                    value: true,
                    configurable: true,
                });
                onlineListeners.forEach(handler => handler());
            });

            expect(result.current.isOnline).toBe(true);
        });

        it('should track wasOffline across transitions', () => {
            const { result } = renderHook(() => useOnlineStatus());

            expect(result.current.wasOffline).toBe(false);

            // Go offline
            act(() => {
                offlineListeners.forEach(handler => handler());
            });

            expect(result.current.wasOffline).toBe(true);

            // Come back online
            act(() => {
                onlineListeners.forEach(handler => handler());
            });

            // wasOffline should remain true
            expect(result.current.wasOffline).toBe(true);
        });
    });

    describe('callbacks', () => {
        it('should call onOffline callback when going offline', () => {
            const onOffline = vi.fn();

            renderHook(() => useOnlineStatus({ onOffline }));

            // Simulate offline event
            act(() => {
                offlineListeners.forEach(handler => handler());
            });

            expect(onOffline).toHaveBeenCalledTimes(1);
        });

        it('should call onOnline callback when coming back online', () => {
            const onOnline = vi.fn();

            renderHook(() => useOnlineStatus({ onOnline }));

            // Simulate online event
            act(() => {
                onlineListeners.forEach(handler => handler());
            });

            expect(onOnline).toHaveBeenCalledTimes(1);
        });

        it('should not call callbacks when callback props change', () => {
            const onOnline1 = vi.fn();
            const onOnline2 = vi.fn();

            const { rerender } = renderHook(
                ({ onOnline }) => useOnlineStatus({ onOnline }),
                { initialProps: { onOnline: onOnline1 } }
            );

            // Rerender with new callback
            rerender({ onOnline: onOnline2 });

            // Trigger online event
            act(() => {
                onlineListeners.forEach(handler => handler());
            });

            // Only the new callback should be called
            expect(onOnline1).not.toHaveBeenCalled();
            expect(onOnline2).toHaveBeenCalledTimes(1);
        });
    });

    describe('refreshStatus', () => {
        it('should update status from navigator.onLine', () => {
            const { result } = renderHook(() => useOnlineStatus());

            expect(result.current.isOnline).toBe(true);

            // Change navigator.onLine without triggering event
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true,
            });

            // Manually refresh
            act(() => {
                result.current.refreshStatus();
            });

            expect(result.current.isOnline).toBe(false);
        });

        it('should set wasOffline when refreshStatus detects offline', () => {
            const { result } = renderHook(() => useOnlineStatus());

            expect(result.current.wasOffline).toBe(false);

            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true,
            });

            act(() => {
                result.current.refreshStatus();
            });

            expect(result.current.wasOffline).toBe(true);
        });
    });

    describe('cleanup', () => {
        it('should remove event listeners on unmount', () => {
            const { unmount } = renderHook(() => useOnlineStatus());

            const initialOnlineListeners = onlineListeners.length;
            const initialOfflineListeners = offlineListeners.length;

            unmount();

            // Listeners should be removed
            expect(onlineListeners.length).toBeLessThan(initialOnlineListeners);
            expect(offlineListeners.length).toBeLessThan(initialOfflineListeners);
        });
    });
});
