/**
 * Story 14c-refactor.17: NavigationContext Tests
 *
 * Tests for the NavigationContext that manages view navigation state.
 *
 * Features tested:
 * - Initial view state (dashboard)
 * - View navigation (setView, navigateWithHistory)
 * - Back navigation (goBack)
 * - Settings subview management
 * - Previous view tracking
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import React from 'react';
import {
    NavigationProvider,
    useNavigation,
    useNavigationOptional,
    type View,
    type SettingsSubview,
} from '../../../src/contexts/NavigationContext';

// =============================================================================
// Test Setup
// =============================================================================

function createWrapper(initialView: View = 'dashboard') {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <NavigationProvider initialView={initialView}>
                {children}
            </NavigationProvider>
        );
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('NavigationContext (Story 14c-refactor.9)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ===========================================================================
    // Initial State Tests
    // ===========================================================================

    describe('Initial State', () => {
        it('should start with dashboard view by default', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            expect(result.current.view).toBe('dashboard');
            expect(result.current.previousView).toBe('dashboard');
            expect(result.current.settingsSubview).toBe('main');
        });

        it('should start with custom initial view when provided', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('trends'),
            });

            expect(result.current.view).toBe('trends');
        });

        it('should provide all navigation functions', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            expect(typeof result.current.setView).toBe('function');
            expect(typeof result.current.goBack).toBe('function');
            expect(typeof result.current.setSettingsSubview).toBe('function');
            expect(typeof result.current.navigateWithHistory).toBe('function');
        });
    });

    // ===========================================================================
    // setView Tests
    // ===========================================================================

    describe('setView', () => {
        it('should navigate to specified view', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setView('trends');
            });

            expect(result.current.view).toBe('trends');
        });

        it('should not update previousView when using setView', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            const previousBefore = result.current.previousView;

            act(() => {
                result.current.setView('trends');
            });

            // previousView should remain unchanged
            expect(result.current.previousView).toBe(previousBefore);
        });

        it('should handle all view types', () => {
            const views: View[] = [
                'dashboard',
                'scan',
                'scan-result',
                'edit',
                'transaction-editor',
                'trends',
                'insights',
                'settings',
                'alerts',
                'batch-capture',
                'batch-review',
                'history',
                'reports',
                'items',
                'statement-scan',
                'recent-scans',
            ];

            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            for (const targetView of views) {
                act(() => {
                    result.current.setView(targetView);
                });
                expect(result.current.view).toBe(targetView);
            }
        });
    });

    // ===========================================================================
    // navigateWithHistory Tests
    // ===========================================================================

    describe('navigateWithHistory', () => {
        it('should navigate to view and track previous view', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            expect(result.current.view).toBe('dashboard');

            act(() => {
                result.current.navigateWithHistory('trends');
            });

            expect(result.current.view).toBe('trends');
            expect(result.current.previousView).toBe('dashboard');
        });

        it('should update previousView on subsequent navigation', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.navigateWithHistory('trends');
            });

            act(() => {
                result.current.navigateWithHistory('history');
            });

            expect(result.current.view).toBe('history');
            expect(result.current.previousView).toBe('trends');
        });
    });

    // ===========================================================================
    // goBack Tests
    // ===========================================================================

    describe('goBack', () => {
        it('should navigate to previous view', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.navigateWithHistory('trends');
            });

            act(() => {
                result.current.goBack();
            });

            expect(result.current.view).toBe('dashboard');
        });

        it('should fallback to dashboard when previousView is same as current', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            // At dashboard with previousView = dashboard
            act(() => {
                result.current.goBack();
            });

            expect(result.current.view).toBe('dashboard');
        });

        it('should fallback to dashboard when previousView is dashboard', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('trends'),
            });

            // previousView is dashboard by default
            act(() => {
                result.current.goBack();
            });

            expect(result.current.view).toBe('dashboard');
        });
    });

    // ===========================================================================
    // Settings Subview Tests
    // ===========================================================================

    describe('Settings Subview', () => {
        it('should start with main subview', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            expect(result.current.settingsSubview).toBe('main');
        });

        it('should update settings subview', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setSettingsSubview('perfil');
            });

            expect(result.current.settingsSubview).toBe('perfil');
        });

        it('should handle all settings subview types', () => {
            const subviews: SettingsSubview[] = [
                'main',
                'limites',
                'perfil',
                'preferencias',
                'escaneo',
                'suscripcion',
                'datos',
                'grupos',
                'app',
                'cuenta',
            ];

            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper(),
            });

            for (const subview of subviews) {
                act(() => {
                    result.current.setSettingsSubview(subview);
                });
                expect(result.current.settingsSubview).toBe(subview);
            }
        });
    });

    // ===========================================================================
    // Error Handling Tests
    // ===========================================================================

    describe('Error Handling', () => {
        it('should throw error when useNavigation is used outside provider', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useNavigation());
            }).toThrow('useNavigation must be used within a NavigationProvider');

            consoleSpy.mockRestore();
        });

        it('should return null when useNavigationOptional is used outside provider', () => {
            const { result } = renderHook(() => useNavigationOptional());

            expect(result.current).toBeNull();
        });
    });

    // ===========================================================================
    // Component Integration Tests
    // ===========================================================================

    describe('Component Integration', () => {
        it('should provide context to child components', () => {
            function TestChild() {
                const { view } = useNavigation();
                return <div data-testid="view">{view}</div>;
            }

            render(
                <NavigationProvider>
                    <TestChild />
                </NavigationProvider>
            );

            expect(screen.getByTestId('view')).toHaveTextContent('dashboard');
        });

        it('should update child components when view changes', () => {
            function TestChild() {
                const { view, setView } = useNavigation();
                return (
                    <div>
                        <div data-testid="view">{view}</div>
                        <button onClick={() => setView('trends')}>Go to Trends</button>
                    </div>
                );
            }

            render(
                <NavigationProvider>
                    <TestChild />
                </NavigationProvider>
            );

            expect(screen.getByTestId('view')).toHaveTextContent('dashboard');

            act(() => {
                screen.getByText('Go to Trends').click();
            });

            expect(screen.getByTestId('view')).toHaveTextContent('trends');
        });
    });
});
