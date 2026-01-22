/**
 * Story 14c-refactor.17: AppStateContext Tests
 *
 * Tests for the AppStateContext that manages global app state for UI feedback.
 *
 * Features tested:
 * - Toast message display and auto-dismiss
 * - Wiping operation status
 * - Exporting operation status
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import {
    AppStateProvider,
    useAppState,
    useAppStateOptional,
    type ToastMessage,
} from '../../../src/contexts/AppStateContext';

// =============================================================================
// Test Setup
// =============================================================================

function createWrapper(toastDuration = 3000) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <AppStateProvider toastDuration={toastDuration}>
                {children}
            </AppStateProvider>
        );
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('AppStateContext (Story 14c-refactor.9)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    // ===========================================================================
    // Initial State Tests
    // ===========================================================================

    describe('Initial State', () => {
        it('should start with null toast message', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            expect(result.current.toastMessage).toBeNull();
        });

        it('should start with wiping = false', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            expect(result.current.wiping).toBe(false);
        });

        it('should start with exporting = false', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            expect(result.current.exporting).toBe(false);
        });

        it('should provide all state functions', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            expect(typeof result.current.setToastMessage).toBe('function');
            expect(typeof result.current.setWiping).toBe('function');
            expect(typeof result.current.setExporting).toBe('function');
        });
    });

    // ===========================================================================
    // Toast Message Tests
    // ===========================================================================

    describe('Toast Message', () => {
        it('should set toast message', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            const toast: ToastMessage = { text: 'Transaction saved!', type: 'success' };

            act(() => {
                result.current.setToastMessage(toast);
            });

            expect(result.current.toastMessage).toEqual(toast);
        });

        it('should clear toast message when set to null', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setToastMessage({ text: 'Test', type: 'info' });
            });

            act(() => {
                result.current.setToastMessage(null);
            });

            expect(result.current.toastMessage).toBeNull();
        });

        it('should auto-dismiss toast after default duration (3s)', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setToastMessage({ text: 'Test', type: 'info' });
            });

            expect(result.current.toastMessage).not.toBeNull();

            // Fast-forward time
            act(() => {
                vi.advanceTimersByTime(3000);
            });

            expect(result.current.toastMessage).toBeNull();
        });

        it('should auto-dismiss toast after custom duration', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(1000), // 1 second
            });

            act(() => {
                result.current.setToastMessage({ text: 'Test', type: 'info' });
            });

            expect(result.current.toastMessage).not.toBeNull();

            // Fast-forward time - should not dismiss yet
            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(result.current.toastMessage).not.toBeNull();

            // Fast-forward to complete 1 second
            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(result.current.toastMessage).toBeNull();
        });

        it('should support success toast type', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            const toast: ToastMessage = { text: 'Success!', type: 'success' };

            act(() => {
                result.current.setToastMessage(toast);
            });

            expect(result.current.toastMessage?.type).toBe('success');
        });

        it('should support info toast type', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            const toast: ToastMessage = { text: 'Info message', type: 'info' };

            act(() => {
                result.current.setToastMessage(toast);
            });

            expect(result.current.toastMessage?.type).toBe('info');
        });

        it('should reset timer when new toast is set', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(3000),
            });

            act(() => {
                result.current.setToastMessage({ text: 'First', type: 'info' });
            });

            // Advance 2 seconds
            act(() => {
                vi.advanceTimersByTime(2000);
            });

            expect(result.current.toastMessage?.text).toBe('First');

            // Set new toast (should reset timer)
            act(() => {
                result.current.setToastMessage({ text: 'Second', type: 'success' });
            });

            // Advance 2 more seconds - should still be visible
            act(() => {
                vi.advanceTimersByTime(2000);
            });

            expect(result.current.toastMessage?.text).toBe('Second');

            // Advance 1 more second to complete 3 seconds for new toast
            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.toastMessage).toBeNull();
        });
    });

    // ===========================================================================
    // Wiping Status Tests
    // ===========================================================================

    describe('Wiping Status', () => {
        it('should set wiping to true', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setWiping(true);
            });

            expect(result.current.wiping).toBe(true);
        });

        it('should set wiping to false', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setWiping(true);
            });

            act(() => {
                result.current.setWiping(false);
            });

            expect(result.current.wiping).toBe(false);
        });
    });

    // ===========================================================================
    // Exporting Status Tests
    // ===========================================================================

    describe('Exporting Status', () => {
        it('should set exporting to true', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setExporting(true);
            });

            expect(result.current.exporting).toBe(true);
        });

        it('should set exporting to false', () => {
            const { result } = renderHook(() => useAppState(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setExporting(true);
            });

            act(() => {
                result.current.setExporting(false);
            });

            expect(result.current.exporting).toBe(false);
        });
    });

    // ===========================================================================
    // Error Handling Tests
    // ===========================================================================

    describe('Error Handling', () => {
        it('should throw error when useAppState is used outside provider', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useAppState());
            }).toThrow('useAppState must be used within an AppStateProvider');

            consoleSpy.mockRestore();
        });

        it('should return null when useAppStateOptional is used outside provider', () => {
            const { result } = renderHook(() => useAppStateOptional());

            expect(result.current).toBeNull();
        });
    });

    // ===========================================================================
    // Component Integration Tests
    // ===========================================================================

    describe('Component Integration', () => {
        it('should provide context to child components', () => {
            function TestChild() {
                const { toastMessage, wiping, exporting } = useAppState();
                return (
                    <div>
                        <div data-testid="toast">{toastMessage?.text ?? 'none'}</div>
                        <div data-testid="wiping">{wiping.toString()}</div>
                        <div data-testid="exporting">{exporting.toString()}</div>
                    </div>
                );
            }

            render(
                <AppStateProvider>
                    <TestChild />
                </AppStateProvider>
            );

            expect(screen.getByTestId('toast')).toHaveTextContent('none');
            expect(screen.getByTestId('wiping')).toHaveTextContent('false');
            expect(screen.getByTestId('exporting')).toHaveTextContent('false');
        });

        it('should update child components when toast is set', () => {
            function TestChild() {
                const { toastMessage, setToastMessage } = useAppState();
                return (
                    <div>
                        <div data-testid="toast">{toastMessage?.text ?? 'none'}</div>
                        <button onClick={() => setToastMessage({ text: 'Hello!', type: 'success' })}>
                            Show Toast
                        </button>
                    </div>
                );
            }

            render(
                <AppStateProvider>
                    <TestChild />
                </AppStateProvider>
            );

            expect(screen.getByTestId('toast')).toHaveTextContent('none');

            act(() => {
                screen.getByText('Show Toast').click();
            });

            expect(screen.getByTestId('toast')).toHaveTextContent('Hello!');
        });
    });
});
