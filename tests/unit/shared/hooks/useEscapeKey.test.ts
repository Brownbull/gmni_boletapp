/**
 * useEscapeKey Hook Tests
 *
 * Tests for the hook that calls a callback when Escape key is pressed.
 * This is a shared utility hook used by dialog components.
 *
 * Test coverage:
 * - Callback is called on Escape key press
 * - Callback is NOT called when disabled
 * - Callback is NOT called when blocked (isPending)
 * - Other keys do not trigger callback
 * - Event listener cleanup on unmount
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEscapeKey } from '@/shared/hooks/useEscapeKey';

describe('useEscapeKey', () => {
    let mockCallback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockCallback = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // Helper to simulate key press
    const pressKey = (key: string) => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true });
        document.dispatchEvent(event);
    };

    // =========================================================================
    // Basic Functionality
    // =========================================================================

    describe('Basic Functionality', () => {
        it('calls callback when Escape key is pressed', () => {
            renderHook(() => useEscapeKey(mockCallback));

            pressKey('Escape');

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('calls callback multiple times for multiple Escape presses', () => {
            renderHook(() => useEscapeKey(mockCallback));

            pressKey('Escape');
            pressKey('Escape');
            pressKey('Escape');

            expect(mockCallback).toHaveBeenCalledTimes(3);
        });

        it('does not call callback for other keys', () => {
            renderHook(() => useEscapeKey(mockCallback));

            pressKey('Enter');
            pressKey('Tab');
            pressKey('Space');
            pressKey('ArrowUp');
            pressKey('a');

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('does not call callback for Esc (short form)', () => {
            // Note: Modern browsers use 'Escape', but older ones might use 'Esc'
            // This test documents that we only handle 'Escape'
            renderHook(() => useEscapeKey(mockCallback));

            pressKey('Esc');

            // Our implementation uses 'Escape' which is the standard
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // isEnabled Parameter
    // =========================================================================

    describe('isEnabled Parameter', () => {
        it('calls callback when isEnabled is true (default)', () => {
            renderHook(() => useEscapeKey(mockCallback, true));

            pressKey('Escape');

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('does not call callback when isEnabled is false', () => {
            renderHook(() => useEscapeKey(mockCallback, false));

            pressKey('Escape');

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('defaults isEnabled to true when not provided', () => {
            renderHook(() => useEscapeKey(mockCallback));

            pressKey('Escape');

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('responds to isEnabled changes', () => {
            const { rerender } = renderHook(
                ({ isEnabled }) => useEscapeKey(mockCallback, isEnabled),
                { initialProps: { isEnabled: true } }
            );

            // Enabled - should fire
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(1);

            // Disable
            rerender({ isEnabled: false });
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1

            // Re-enable
            rerender({ isEnabled: true });
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(2);
        });
    });

    // =========================================================================
    // isBlocked Parameter (e.g., isPending)
    // =========================================================================

    describe('isBlocked Parameter', () => {
        it('calls callback when isBlocked is false (default)', () => {
            renderHook(() => useEscapeKey(mockCallback, true, false));

            pressKey('Escape');

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('does not call callback when isBlocked is true', () => {
            renderHook(() => useEscapeKey(mockCallback, true, true));

            pressKey('Escape');

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('defaults isBlocked to false when not provided', () => {
            renderHook(() => useEscapeKey(mockCallback, true));

            pressKey('Escape');

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('responds to isBlocked changes', () => {
            const { rerender } = renderHook(
                ({ isBlocked }) => useEscapeKey(mockCallback, true, isBlocked),
                { initialProps: { isBlocked: false } }
            );

            // Not blocked - should fire
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(1);

            // Block
            rerender({ isBlocked: true });
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1

            // Unblock
            rerender({ isBlocked: false });
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(2);
        });
    });

    // =========================================================================
    // Combined isEnabled and isBlocked
    // =========================================================================

    describe('Combined isEnabled and isBlocked', () => {
        it('does not call callback when disabled even if not blocked', () => {
            renderHook(() => useEscapeKey(mockCallback, false, false));

            pressKey('Escape');

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('does not call callback when blocked even if enabled', () => {
            renderHook(() => useEscapeKey(mockCallback, true, true));

            pressKey('Escape');

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('does not call callback when both disabled and blocked', () => {
            renderHook(() => useEscapeKey(mockCallback, false, true));

            pressKey('Escape');

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('only calls callback when enabled and not blocked', () => {
            renderHook(() => useEscapeKey(mockCallback, true, false));

            pressKey('Escape');

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // Cleanup on Unmount
    // =========================================================================

    describe('Cleanup on Unmount', () => {
        it('removes event listener on unmount', () => {
            const { unmount } = renderHook(() => useEscapeKey(mockCallback));

            // Verify listener is active
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(1);

            // Unmount
            unmount();

            // Listener should be removed
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1
        });

        it('removes event listener on unmount when disabled', () => {
            const { unmount } = renderHook(() => useEscapeKey(mockCallback, false));

            unmount();

            // Pressing Escape should not cause errors or call callback
            pressKey('Escape');
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Callback Reference Updates
    // =========================================================================

    describe('Callback Reference Updates', () => {
        it('uses the latest callback reference', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            const { rerender } = renderHook(
                ({ callback }) => useEscapeKey(callback),
                { initialProps: { callback: callback1 } }
            );

            pressKey('Escape');
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).not.toHaveBeenCalled();

            // Update callback
            rerender({ callback: callback2 });

            pressKey('Escape');
            expect(callback1).toHaveBeenCalledTimes(1); // Still 1
            expect(callback2).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', () => {
        it('handles undefined callback gracefully', () => {
            // Should not throw when callback is undefined
            expect(() => {
                renderHook(() => useEscapeKey(undefined as unknown as () => void));
                pressKey('Escape');
            }).not.toThrow();
        });

        it('handles rapid enable/disable toggling', () => {
            const { rerender } = renderHook(
                ({ isEnabled }) => useEscapeKey(mockCallback, isEnabled),
                { initialProps: { isEnabled: true } }
            );

            // Rapid toggling
            for (let i = 0; i < 10; i++) {
                rerender({ isEnabled: false });
                rerender({ isEnabled: true });
            }

            // Should still work after rapid toggling
            pressKey('Escape');
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('handles multiple hook instances independently', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            renderHook(() => useEscapeKey(callback1));
            renderHook(() => useEscapeKey(callback2));

            pressKey('Escape');

            // Both callbacks should be called
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });
    });
});
