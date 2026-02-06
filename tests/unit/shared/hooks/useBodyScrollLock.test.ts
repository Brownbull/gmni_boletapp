/**
 * useBodyScrollLock Hook Tests
 *
 * Tests for the hook that prevents body scroll when a modal is open.
 * This is a shared utility hook used by dialog components.
 *
 * Test coverage:
 * - Body overflow is set to 'hidden' when locked
 * - Body overflow is restored on unlock
 * - No effect when isLocked is false
 * - Cleanup on unmount
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

describe('useBodyScrollLock', () => {
    const originalOverflow = document.body.style.overflow;

    beforeEach(() => {
        // Reset body overflow before each test
        document.body.style.overflow = '';
    });

    afterEach(() => {
        // Ensure cleanup after each test
        document.body.style.overflow = originalOverflow;
    });

    // =========================================================================
    // Basic Locking Behavior
    // =========================================================================

    describe('Basic Locking Behavior', () => {
        it('sets body overflow to hidden when isLocked is true', () => {
            renderHook(() => useBodyScrollLock(true));

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('does not change body overflow when isLocked is false', () => {
            document.body.style.overflow = 'auto';

            renderHook(() => useBodyScrollLock(false));

            expect(document.body.style.overflow).toBe('auto');
        });

        it('preserves empty overflow when isLocked is false', () => {
            document.body.style.overflow = '';

            renderHook(() => useBodyScrollLock(false));

            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // State Transitions
    // =========================================================================

    describe('State Transitions', () => {
        it('restores body overflow when isLocked changes from true to false', () => {
            const { rerender } = renderHook(
                ({ isLocked }) => useBodyScrollLock(isLocked),
                { initialProps: { isLocked: true } }
            );

            expect(document.body.style.overflow).toBe('hidden');

            rerender({ isLocked: false });

            expect(document.body.style.overflow).toBe('');
        });

        it('sets body overflow when isLocked changes from false to true', () => {
            const { rerender } = renderHook(
                ({ isLocked }) => useBodyScrollLock(isLocked),
                { initialProps: { isLocked: false } }
            );

            expect(document.body.style.overflow).toBe('');

            rerender({ isLocked: true });

            expect(document.body.style.overflow).toBe('hidden');
        });

        it('handles multiple state transitions correctly', () => {
            const { rerender } = renderHook(
                ({ isLocked }) => useBodyScrollLock(isLocked),
                { initialProps: { isLocked: false } }
            );

            // Start unlocked
            expect(document.body.style.overflow).toBe('');

            // Lock
            rerender({ isLocked: true });
            expect(document.body.style.overflow).toBe('hidden');

            // Unlock
            rerender({ isLocked: false });
            expect(document.body.style.overflow).toBe('');

            // Lock again
            rerender({ isLocked: true });
            expect(document.body.style.overflow).toBe('hidden');

            // Unlock again
            rerender({ isLocked: false });
            expect(document.body.style.overflow).toBe('');
        });
    });

    // =========================================================================
    // Cleanup on Unmount
    // =========================================================================

    describe('Cleanup on Unmount', () => {
        it('restores body overflow when component unmounts while locked', () => {
            const { unmount } = renderHook(() => useBodyScrollLock(true));

            expect(document.body.style.overflow).toBe('hidden');

            unmount();

            expect(document.body.style.overflow).toBe('');
        });

        it('does not affect body overflow when unmounting while unlocked', () => {
            document.body.style.overflow = 'scroll';

            const { unmount } = renderHook(() => useBodyScrollLock(false));

            // Overflow should remain unchanged
            expect(document.body.style.overflow).toBe('scroll');

            unmount();

            // Overflow should still be unchanged after unmount
            expect(document.body.style.overflow).toBe('scroll');
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', () => {
        it('handles rapid lock/unlock cycles', () => {
            const { rerender } = renderHook(
                ({ isLocked }) => useBodyScrollLock(isLocked),
                { initialProps: { isLocked: false } }
            );

            // Rapid state changes
            for (let i = 0; i < 10; i++) {
                rerender({ isLocked: true });
                rerender({ isLocked: false });
            }

            expect(document.body.style.overflow).toBe('');
        });

        it('handles multiple instances - each restores its own captured state', () => {
            // First dialog opens (captures overflow = '')
            const { unmount: unmount1 } = renderHook(() => useBodyScrollLock(true));
            expect(document.body.style.overflow).toBe('hidden');

            // Second dialog opens (captures overflow = 'hidden')
            const { unmount: unmount2 } = renderHook(() => useBodyScrollLock(true));
            expect(document.body.style.overflow).toBe('hidden');

            // First dialog closes - restores its captured value ('')
            unmount1();
            // Note: This simple implementation doesn't use ref counting,
            // so the first unmount restores to '' even though second dialog is still open
            expect(document.body.style.overflow).toBe('');

            // Second dialog closes - restores its captured value ('hidden')
            unmount2();
            // This restores to 'hidden' which was the state when second hook mounted
            // For production use, consider a ref count approach to properly handle nested modals
            expect(document.body.style.overflow).toBe('hidden');

            // Clean up for this test
            document.body.style.overflow = '';
        });
    });
});
