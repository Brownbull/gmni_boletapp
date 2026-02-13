/**
 * Tests for useToast hook
 *
 * Story 14e.20a: Toast Hook Extraction
 * Epic 14e: Feature-Based Architecture
 *
 * Tests toast notification state management and auto-dismiss behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../../../../src/shared/hooks/useToast';

describe('useToast', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('initial state', () => {
        it('should return null toast message initially', () => {
            const { result } = renderHook(() => useToast());
            expect(result.current.toastMessage).toBeNull();
        });

        it('should return showToast function', () => {
            const { result } = renderHook(() => useToast());
            expect(typeof result.current.showToast).toBe('function');
        });

        it('should return dismissToast function', () => {
            const { result } = renderHook(() => useToast());
            expect(typeof result.current.dismissToast).toBe('function');
        });
    });

    describe('showToast', () => {
        it('should set toast message with text and type', () => {
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('Test message', 'success');
            });

            expect(result.current.toastMessage).toEqual({
                text: 'Test message',
                type: 'success',
            });
        });

        it('should default to info type when not specified', () => {
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('Info message');
            });

            expect(result.current.toastMessage).toEqual({
                text: 'Info message',
                type: 'info',
            });
        });

        it('should replace previous toast when called again', () => {
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('First message', 'info');
            });
            expect(result.current.toastMessage?.text).toBe('First message');

            act(() => {
                result.current.showToast('Second message', 'success');
            });
            expect(result.current.toastMessage).toEqual({
                text: 'Second message',
                type: 'success',
            });
        });
    });

    describe('dismissToast', () => {
        it('should clear toast message immediately', () => {
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('Test message', 'success');
            });
            expect(result.current.toastMessage).not.toBeNull();

            act(() => {
                result.current.dismissToast();
            });
            expect(result.current.toastMessage).toBeNull();
        });

        it('should do nothing when no toast is shown', () => {
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.dismissToast();
            });
            expect(result.current.toastMessage).toBeNull();
        });
    });

    describe('auto-dismiss', () => {
        it('should auto-dismiss after default 3000ms', () => {
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('Auto-dismiss test', 'info');
            });
            expect(result.current.toastMessage).not.toBeNull();

            // Advance time but not enough
            act(() => {
                vi.advanceTimersByTime(2999);
            });
            expect(result.current.toastMessage).not.toBeNull();

            // Advance past the timeout
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(result.current.toastMessage).toBeNull();
        });

        it('should use custom auto-dismiss timeout', () => {
            const { result } = renderHook(() => useToast(5000));

            act(() => {
                result.current.showToast('Custom timeout', 'success');
            });
            expect(result.current.toastMessage).not.toBeNull();

            // Default timeout should not dismiss
            act(() => {
                vi.advanceTimersByTime(3000);
            });
            expect(result.current.toastMessage).not.toBeNull();

            // Custom timeout should dismiss
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            expect(result.current.toastMessage).toBeNull();
        });

        it('should auto-dismiss error type after double duration (6000ms)', () => {
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('Error toast', 'error');
            });
            expect(result.current.toastMessage).not.toBeNull();

            // Should NOT dismiss at normal timeout
            act(() => {
                vi.advanceTimersByTime(3000);
            });
            expect(result.current.toastMessage).not.toBeNull();

            // Should NOT dismiss just before double timeout
            act(() => {
                vi.advanceTimersByTime(2999);
            });
            expect(result.current.toastMessage).not.toBeNull();

            // Should dismiss at exactly 2x timeout
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(result.current.toastMessage).toBeNull();
        });

        it('should auto-dismiss warning type at normal duration', () => {
            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('Warning toast', 'warning');
            });
            expect(result.current.toastMessage).not.toBeNull();

            act(() => {
                vi.advanceTimersByTime(3000);
            });
            expect(result.current.toastMessage).toBeNull();
        });

        it('should reset timer when new toast is shown', () => {
            const { result } = renderHook(() => useToast(3000));

            act(() => {
                result.current.showToast('First toast', 'info');
            });

            // Advance 2 seconds
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            expect(result.current.toastMessage?.text).toBe('First toast');

            // Show new toast (should reset timer)
            act(() => {
                result.current.showToast('Second toast', 'success');
            });

            // Advance 2 more seconds (total 4 from first, but only 2 from second)
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            expect(result.current.toastMessage?.text).toBe('Second toast');

            // Now advance another second to hit the new 3 second mark
            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(result.current.toastMessage).toBeNull();
        });
    });

    describe('cleanup', () => {
        it('should clear timer on unmount', () => {
            const { result, unmount } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('Will unmount', 'info');
            });
            expect(result.current.toastMessage).not.toBeNull();

            unmount();

            // Advancing time should not cause issues after unmount
            act(() => {
                vi.advanceTimersByTime(5000);
            });
            // No error means cleanup worked correctly
        });

        it('should clear timer when manually dismissed before timeout', () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

            const { result } = renderHook(() => useToast());

            act(() => {
                result.current.showToast('Manual dismiss', 'info');
            });

            act(() => {
                result.current.dismissToast();
            });

            // The effect cleanup should have been called
            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
        });
    });

    describe('function stability', () => {
        it('should return stable showToast reference', () => {
            const { result, rerender } = renderHook(() => useToast());
            const firstShowToast = result.current.showToast;

            rerender();
            expect(result.current.showToast).toBe(firstShowToast);
        });

        it('should return stable dismissToast reference', () => {
            const { result, rerender } = renderHook(() => useToast());
            const firstDismissToast = result.current.dismissToast;

            rerender();
            expect(result.current.dismissToast).toBe(firstDismissToast);
        });
    });
});
