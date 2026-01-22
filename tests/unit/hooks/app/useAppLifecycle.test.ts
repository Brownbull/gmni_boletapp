/**
 * Unit tests for useAppLifecycle hook
 *
 * Story 14c-refactor.10: App Decomposition - Extract app-level hooks
 *
 * Tests the app lifecycle management hook:
 * - Visibility state tracking
 * - Focus state tracking
 * - beforeunload guard registration
 * - Lifecycle callbacks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppLifecycle } from '../../../../src/hooks/app/useAppLifecycle';

describe('useAppLifecycle', () => {
    let visibilityListeners: Array<() => void> = [];
    let focusListeners: Array<() => void> = [];
    let blurListeners: Array<() => void> = [];
    let beforeUnloadListeners: Array<(e: BeforeUnloadEvent) => void> = [];
    let pageHideListeners: Array<() => void> = [];
    let mockVisibilityState = 'visible';

    beforeEach(() => {
        // Clear listener arrays
        visibilityListeners = [];
        focusListeners = [];
        blurListeners = [];
        beforeUnloadListeners = [];
        pageHideListeners = [];
        mockVisibilityState = 'visible';

        // Mock document.visibilityState
        Object.defineProperty(document, 'visibilityState', {
            get: () => mockVisibilityState,
            configurable: true,
        });

        // Mock document.hasFocus
        vi.spyOn(document, 'hasFocus').mockReturnValue(true);

        // Mock document event listeners
        vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
            if (event === 'visibilitychange' && typeof handler === 'function') {
                visibilityListeners.push(handler as () => void);
            }
        });

        vi.spyOn(document, 'removeEventListener').mockImplementation((event, handler) => {
            if (event === 'visibilitychange' && typeof handler === 'function') {
                visibilityListeners = visibilityListeners.filter(h => h !== handler);
            }
        });

        // Mock window event listeners
        vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
            if (event === 'focus' && typeof handler === 'function') {
                focusListeners.push(handler as () => void);
            }
            if (event === 'blur' && typeof handler === 'function') {
                blurListeners.push(handler as () => void);
            }
            if (event === 'beforeunload' && typeof handler === 'function') {
                beforeUnloadListeners.push(handler as (e: BeforeUnloadEvent) => void);
            }
            if (event === 'pagehide' && typeof handler === 'function') {
                pageHideListeners.push(handler as () => void);
            }
        });

        vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
            if (event === 'focus' && typeof handler === 'function') {
                focusListeners = focusListeners.filter(h => h !== handler);
            }
            if (event === 'blur' && typeof handler === 'function') {
                blurListeners = blurListeners.filter(h => h !== handler);
            }
            if (event === 'beforeunload' && typeof handler === 'function') {
                beforeUnloadListeners = beforeUnloadListeners.filter(h => h !== handler);
            }
            if (event === 'pagehide' && typeof handler === 'function') {
                pageHideListeners = pageHideListeners.filter(h => h !== handler);
            }
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('initial state', () => {
        it('should return foreground state from document.visibilityState', () => {
            const { result } = renderHook(() => useAppLifecycle());

            expect(result.current.isInForeground).toBe(true);
        });

        it('should return background state when document is hidden', () => {
            mockVisibilityState = 'hidden';

            const { result } = renderHook(() => useAppLifecycle());

            expect(result.current.isInForeground).toBe(false);
        });

        it('should return focus state from document.hasFocus', () => {
            const { result } = renderHook(() => useAppLifecycle());

            expect(result.current.hasFocus).toBe(true);
        });
    });

    describe('visibility changes', () => {
        it('should update isInForeground when visibility changes to hidden', () => {
            const { result } = renderHook(() => useAppLifecycle());

            expect(result.current.isInForeground).toBe(true);

            act(() => {
                mockVisibilityState = 'hidden';
                visibilityListeners.forEach(handler => handler());
            });

            expect(result.current.isInForeground).toBe(false);
        });

        it('should update isInForeground when visibility changes to visible', () => {
            mockVisibilityState = 'hidden';

            const { result } = renderHook(() => useAppLifecycle());

            expect(result.current.isInForeground).toBe(false);

            act(() => {
                mockVisibilityState = 'visible';
                visibilityListeners.forEach(handler => handler());
            });

            expect(result.current.isInForeground).toBe(true);
        });

        it('should call onForeground when becoming visible', () => {
            mockVisibilityState = 'hidden';
            const onForeground = vi.fn();

            renderHook(() => useAppLifecycle({ onForeground }));

            act(() => {
                mockVisibilityState = 'visible';
                visibilityListeners.forEach(handler => handler());
            });

            expect(onForeground).toHaveBeenCalledTimes(1);
        });

        it('should call onBackground when becoming hidden', () => {
            const onBackground = vi.fn();

            renderHook(() => useAppLifecycle({ onBackground }));

            act(() => {
                mockVisibilityState = 'hidden';
                visibilityListeners.forEach(handler => handler());
            });

            expect(onBackground).toHaveBeenCalledTimes(1);
        });
    });

    describe('focus changes', () => {
        it('should update hasFocus on focus event', () => {
            vi.spyOn(document, 'hasFocus').mockReturnValue(false);

            const { result } = renderHook(() => useAppLifecycle());

            expect(result.current.hasFocus).toBe(false);

            act(() => {
                focusListeners.forEach(handler => handler());
            });

            expect(result.current.hasFocus).toBe(true);
        });

        it('should update hasFocus on blur event', () => {
            const { result } = renderHook(() => useAppLifecycle());

            expect(result.current.hasFocus).toBe(true);

            act(() => {
                blurListeners.forEach(handler => handler());
            });

            expect(result.current.hasFocus).toBe(false);
        });

        it('should call onFocusChange with true on focus', () => {
            const onFocusChange = vi.fn();

            renderHook(() => useAppLifecycle({ onFocusChange }));

            act(() => {
                focusListeners.forEach(handler => handler());
            });

            expect(onFocusChange).toHaveBeenCalledWith(true);
        });

        it('should call onFocusChange with false on blur', () => {
            const onFocusChange = vi.fn();

            renderHook(() => useAppLifecycle({ onFocusChange }));

            act(() => {
                blurListeners.forEach(handler => handler());
            });

            expect(onFocusChange).toHaveBeenCalledWith(false);
        });
    });

    describe('beforeunload guard', () => {
        it('should register a beforeunload guard', () => {
            const { result } = renderHook(() => useAppLifecycle());

            act(() => {
                result.current.registerBeforeUnloadGuard(() => true);
            });

            // Simulate beforeunload event
            const event = new Event('beforeunload') as BeforeUnloadEvent;
            Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
            Object.defineProperty(event, 'returnValue', { value: '', writable: true });

            beforeUnloadListeners.forEach(handler => handler(event));

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should not block navigation when guard returns false', () => {
            const { result } = renderHook(() => useAppLifecycle());

            act(() => {
                result.current.registerBeforeUnloadGuard(() => false);
            });

            const event = new Event('beforeunload') as BeforeUnloadEvent;
            Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
            Object.defineProperty(event, 'returnValue', { value: '', writable: true });

            beforeUnloadListeners.forEach(handler => handler(event));

            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should unregister beforeunload guard', () => {
            const { result } = renderHook(() => useAppLifecycle());

            act(() => {
                result.current.registerBeforeUnloadGuard(() => true);
            });

            act(() => {
                result.current.unregisterBeforeUnloadGuard();
            });

            const event = new Event('beforeunload') as BeforeUnloadEvent;
            Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
            Object.defineProperty(event, 'returnValue', { value: '', writable: true });

            beforeUnloadListeners.forEach(handler => handler(event));

            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('should allow dynamic guard conditions', () => {
            const { result } = renderHook(() => useAppLifecycle());

            let hasUnsavedChanges = false;

            act(() => {
                result.current.registerBeforeUnloadGuard(() => hasUnsavedChanges);
            });

            // First check - no unsaved changes
            const event1 = new Event('beforeunload') as BeforeUnloadEvent;
            Object.defineProperty(event1, 'preventDefault', { value: vi.fn() });
            Object.defineProperty(event1, 'returnValue', { value: '', writable: true });

            beforeUnloadListeners.forEach(handler => handler(event1));
            expect(event1.preventDefault).not.toHaveBeenCalled();

            // Now with unsaved changes
            hasUnsavedChanges = true;

            const event2 = new Event('beforeunload') as BeforeUnloadEvent;
            Object.defineProperty(event2, 'preventDefault', { value: vi.fn() });
            Object.defineProperty(event2, 'returnValue', { value: '', writable: true });

            beforeUnloadListeners.forEach(handler => handler(event2));
            expect(event2.preventDefault).toHaveBeenCalled();
        });
    });

    describe('pagehide', () => {
        it('should call onBackground on pagehide event', () => {
            const onBackground = vi.fn();

            renderHook(() => useAppLifecycle({ onBackground }));

            act(() => {
                pageHideListeners.forEach(handler => handler());
            });

            expect(onBackground).toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should remove all event listeners on unmount', () => {
            const { unmount } = renderHook(() => useAppLifecycle());

            const initialVisibility = visibilityListeners.length;
            const initialFocus = focusListeners.length;
            const initialBlur = blurListeners.length;
            const initialBeforeUnload = beforeUnloadListeners.length;
            const initialPageHide = pageHideListeners.length;

            unmount();

            expect(visibilityListeners.length).toBeLessThan(initialVisibility);
            expect(focusListeners.length).toBeLessThan(initialFocus);
            expect(blurListeners.length).toBeLessThan(initialBlur);
            expect(beforeUnloadListeners.length).toBeLessThan(initialBeforeUnload);
            expect(pageHideListeners.length).toBeLessThan(initialPageHide);
        });
    });
});
