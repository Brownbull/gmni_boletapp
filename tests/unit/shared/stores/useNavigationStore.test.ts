/**
 * Story 14e-25a.1: Navigation Store Unit Tests
 *
 * Tests for the navigation Zustand store covering:
 * - Initial state
 * - View navigation (setView, navigateToView, navigateBack)
 * - Settings subview management
 * - Scroll position management
 * - Filter persistence behavior (AC5: preserves/clears appropriately)
 * - Analytics state transfer (AC6)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
    useNavigationStore,
    useCurrentView,
    usePreviousView,
    useSettingsSubview,
    usePendingHistoryFilters,
    usePendingDistributionView,
    useAnalyticsInitialState,
    useNavigationActions,
    getNavigationState,
    navigationActions,
    type SettingsSubview,
} from '@shared/stores/useNavigationStore';
import type { HistoryFilterState } from '@/types/historyFilters';
import type { AnalyticsNavigationState } from '@/types/analytics';

// =============================================================================
// Test Helpers
// =============================================================================

const initialState = {
    view: 'dashboard' as const,
    previousView: 'dashboard' as const,
    settingsSubview: 'main' as const,
    scrollPositions: {},
    pendingHistoryFilters: null,
    pendingDistributionView: null,
    analyticsInitialState: null,
};

/**
 * Reset store to initial state before each test.
 * Zustand setState is synchronous, no act() needed.
 */
function resetStore() {
    useNavigationStore.setState(initialState);
}

/**
 * Get state-only object for assertions (without action functions).
 */
function getStateOnly() {
    const state = useNavigationStore.getState();
    return {
        view: state.view,
        previousView: state.previousView,
        settingsSubview: state.settingsSubview,
        scrollPositions: state.scrollPositions,
        pendingHistoryFilters: state.pendingHistoryFilters,
        pendingDistributionView: state.pendingDistributionView,
        analyticsInitialState: state.analyticsInitialState,
    };
}

// Reset store state before each test
beforeEach(() => {
    resetStore();
});

// =============================================================================
// Tests
// =============================================================================

describe('useNavigationStore', () => {
    describe('initial state', () => {
        it('starts with dashboard view', () => {
            expect(getNavigationState().view).toBe('dashboard');
        });

        it('starts with dashboard as previous view', () => {
            expect(getNavigationState().previousView).toBe('dashboard');
        });

        it('starts with main settings subview', () => {
            expect(getNavigationState().settingsSubview).toBe('main');
        });

        it('has null pending filters', () => {
            expect(getNavigationState().pendingHistoryFilters).toBeNull();
        });

        it('has null pending distribution view', () => {
            expect(getNavigationState().pendingDistributionView).toBeNull();
        });

        it('has null analytics initial state', () => {
            expect(getNavigationState().analyticsInitialState).toBeNull();
        });

        it('has empty scroll positions', () => {
            expect(getNavigationState().scrollPositions).toEqual({});
        });
    });

    describe('setView', () => {
        it('updates current view', () => {
            const { setView } = useNavigationStore.getState();
            setView('history');
            expect(getNavigationState().view).toBe('history');
        });

        it('stores previous view', () => {
            const { setView } = useNavigationStore.getState();
            setView('history');
            expect(getNavigationState().previousView).toBe('dashboard');
        });

        it('chains correctly through multiple navigations', () => {
            const { setView } = useNavigationStore.getState();
            setView('history');
            setView('trends');
            expect(getNavigationState().view).toBe('trends');
            expect(getNavigationState().previousView).toBe('history');
        });
    });

    describe('navigateToView', () => {
        it('navigates with history filters', () => {
            const filters: HistoryFilterState = {
                temporal: { level: 'month', year: '2026', month: '2026-01' },
                category: { level: 'all' },
                location: {},
            };
            const { navigateToView } = useNavigationStore.getState();
            navigateToView('history', { historyFilters: filters });

            expect(getNavigationState().view).toBe('history');
            expect(getNavigationState().pendingHistoryFilters).toEqual(filters);
        });

        it('navigates with analytics state', () => {
            const analyticsState: AnalyticsNavigationState = {
                temporal: { level: 'month', year: '2026', month: '2026-01' },
                category: { level: 'all' },
                chartMode: 'aggregation',
                drillDownMode: 'temporal',
            };
            const { navigateToView } = useNavigationStore.getState();
            navigateToView('trends', { analyticsState });

            expect(getNavigationState().view).toBe('trends');
            expect(getNavigationState().analyticsInitialState).toEqual(analyticsState);
        });

        it('navigates with distribution view', () => {
            const { navigateToView } = useNavigationStore.getState();
            navigateToView('trends', { distributionView: 'treemap' });
            expect(getNavigationState().pendingDistributionView).toBe('treemap');
        });

        it('preserves existing state when options not provided', () => {
            const { setPendingHistoryFilters, navigateToView } = useNavigationStore.getState();
            setPendingHistoryFilters({
                temporal: { level: 'all' },
                category: { level: 'all' },
                location: {},
            });

            navigateToView('history'); // No historyFilters option

            expect(getNavigationState().pendingHistoryFilters).not.toBeNull();
        });
    });

    describe('navigateBack', () => {
        it('swaps view and previousView', () => {
            const { setView, navigateBack } = useNavigationStore.getState();
            setView('history');
            navigateBack();

            expect(getNavigationState().view).toBe('dashboard');
            expect(getNavigationState().previousView).toBe('history');
        });

        it('handles repeated back navigation (toggle behavior)', () => {
            const { setView, navigateBack } = useNavigationStore.getState();
            // Initial: view=dashboard, previousView=dashboard
            setView('history');
            // After setView: view=history, previousView=dashboard
            navigateBack();
            // After first back: view=dashboard, previousView=history
            navigateBack();
            // After second back: view=history (toggles back), previousView=dashboard

            // Toggle behavior: back navigation swaps view and previousView
            expect(getNavigationState().view).toBe('history');
        });

        it('falls back to dashboard when previousView equals view', () => {
            const { navigateBack } = useNavigationStore.getState();
            navigateBack();
            expect(getNavigationState().view).toBe('dashboard');
        });
    });

    describe('setSettingsSubview', () => {
        it('updates settings subview', () => {
            const { setSettingsSubview } = useNavigationStore.getState();
            setSettingsSubview('perfil');
            expect(getNavigationState().settingsSubview).toBe('perfil');
        });

        it('supports all subview types', () => {
            const { setSettingsSubview } = useNavigationStore.getState();
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

            for (const subview of subviews) {
                setSettingsSubview(subview);
                expect(getNavigationState().settingsSubview).toBe(subview);
            }
        });
    });

    describe('scroll position', () => {
        it('saves scroll position per view', () => {
            const { saveScrollPosition } = useNavigationStore.getState();
            saveScrollPosition('history', 500);
            expect(getNavigationState().scrollPositions['history']).toBe(500);
        });

        it('retrieves scroll position', () => {
            const { saveScrollPosition, getScrollPosition } = useNavigationStore.getState();
            saveScrollPosition('history', 500);
            expect(getScrollPosition('history')).toBe(500);
        });

        it('returns 0 for unset scroll positions', () => {
            const { getScrollPosition } = useNavigationStore.getState();
            expect(getScrollPosition('trends')).toBe(0);
        });

        it('maintains separate positions per view', () => {
            const { saveScrollPosition, getScrollPosition } = useNavigationStore.getState();
            saveScrollPosition('history', 500);
            saveScrollPosition('trends', 1000);
            expect(getScrollPosition('history')).toBe(500);
            expect(getScrollPosition('trends')).toBe(1000);
        });
    });

    describe('clearPendingFilters', () => {
        it('clears history filters', () => {
            const { setPendingHistoryFilters, clearPendingFilters } = useNavigationStore.getState();
            setPendingHistoryFilters({
                temporal: { level: 'month', year: '2026', month: '2026-01' },
                category: { level: 'all' },
                location: {},
            });
            clearPendingFilters();
            expect(getNavigationState().pendingHistoryFilters).toBeNull();
        });

        it('clears distribution view', () => {
            const { setPendingDistributionView, clearPendingFilters } = useNavigationStore.getState();
            setPendingDistributionView('donut');
            clearPendingFilters();
            expect(getNavigationState().pendingDistributionView).toBeNull();
        });

        it('does not clear analytics initial state', () => {
            const { setAnalyticsInitialState, clearPendingFilters } = useNavigationStore.getState();
            const analyticsState: AnalyticsNavigationState = {
                temporal: { level: 'month', year: '2026' },
                category: { level: 'all' },
                chartMode: 'aggregation',
                drillDownMode: 'temporal',
            };
            setAnalyticsInitialState(analyticsState);
            clearPendingFilters();
            // analyticsInitialState is separate from pending filters
            expect(getNavigationState().analyticsInitialState).toEqual(analyticsState);
        });
    });

    describe('clearAnalyticsInitialState', () => {
        it('clears analytics initial state', () => {
            const { setAnalyticsInitialState, clearAnalyticsInitialState } =
                useNavigationStore.getState();
            const analyticsState: AnalyticsNavigationState = {
                temporal: { level: 'month', year: '2026' },
                category: { level: 'all' },
                chartMode: 'aggregation',
                drillDownMode: 'temporal',
            };
            setAnalyticsInitialState(analyticsState);
            clearAnalyticsInitialState();
            expect(getNavigationState().analyticsInitialState).toBeNull();
        });
    });

    describe('typed selectors', () => {
        it('useCurrentView returns view', () => {
            const { result } = renderHook(() => useCurrentView());
            expect(result.current).toBe('dashboard');
        });

        it('usePreviousView returns previousView', () => {
            const { result } = renderHook(() => usePreviousView());
            expect(result.current).toBe('dashboard');
        });

        it('useSettingsSubview returns settingsSubview', () => {
            const { result } = renderHook(() => useSettingsSubview());
            expect(result.current).toBe('main');
        });

        it('usePendingHistoryFilters returns pendingHistoryFilters', () => {
            const { result } = renderHook(() => usePendingHistoryFilters());
            expect(result.current).toBeNull();
        });

        it('usePendingDistributionView returns pendingDistributionView', () => {
            const { result } = renderHook(() => usePendingDistributionView());
            expect(result.current).toBeNull();
        });

        it('useAnalyticsInitialState returns analyticsInitialState', () => {
            const { result } = renderHook(() => useAnalyticsInitialState());
            expect(result.current).toBeNull();
        });

        it('useNavigationActions returns all actions', () => {
            const { result } = renderHook(() => useNavigationActions());

            expect(result.current).toHaveProperty('setView');
            expect(result.current).toHaveProperty('navigateToView');
            expect(result.current).toHaveProperty('navigateBack');
            expect(result.current).toHaveProperty('setSettingsSubview');
            expect(result.current).toHaveProperty('saveScrollPosition');
            expect(result.current).toHaveProperty('getScrollPosition');
            expect(result.current).toHaveProperty('clearPendingFilters');
            expect(result.current).toHaveProperty('clearAnalyticsInitialState');
            expect(result.current).toHaveProperty('setPendingHistoryFilters');
            expect(result.current).toHaveProperty('setPendingDistributionView');
            expect(result.current).toHaveProperty('setAnalyticsInitialState');
        });
    });

    describe('direct access (non-React)', () => {
        it('getNavigationState returns current state', () => {
            useNavigationStore.getState().setView('history');
            const state = getNavigationState();
            expect(state.view).toBe('history');
        });

        it('navigationActions.setView works', () => {
            navigationActions.setView('trends');
            expect(getNavigationState().view).toBe('trends');
        });

        it('navigationActions.navigateToView works with options', () => {
            const filters: HistoryFilterState = {
                temporal: { level: 'all' },
                category: { level: 'all' },
                location: {},
            };
            navigationActions.navigateToView('history', { historyFilters: filters });
            expect(getNavigationState().view).toBe('history');
            expect(getNavigationState().pendingHistoryFilters).toEqual(filters);
        });

        it('navigationActions.navigateBack works', () => {
            navigationActions.setView('history');
            navigationActions.navigateBack();
            expect(getNavigationState().view).toBe('dashboard');
        });
    });

    // AC5: Filter Persistence Preserved
    describe('AC5: filter persistence behavior', () => {
        it('supports setting and clearing history filters', () => {
            const { setPendingHistoryFilters } = useNavigationStore.getState();
            const filters: HistoryFilterState = {
                temporal: { level: 'month', year: '2026', month: '2026-01' },
                category: { level: 'all' },
                location: {},
            };
            setPendingHistoryFilters(filters);
            expect(getNavigationState().pendingHistoryFilters).toEqual(filters);

            setPendingHistoryFilters(null);
            expect(getNavigationState().pendingHistoryFilters).toBeNull();
        });

        it('navigateToView preserves existing filters when not overridden', () => {
            const { setPendingHistoryFilters, navigateToView } = useNavigationStore.getState();
            const filters: HistoryFilterState = {
                temporal: { level: 'month', year: '2026', month: '2026-01' },
                category: { level: 'all' },
                location: {},
            };
            setPendingHistoryFilters(filters);
            navigateToView('items'); // No historyFilters option
            expect(getNavigationState().pendingHistoryFilters).toEqual(filters);
        });
    });

    // AC6: Analytics State Transfer
    describe('AC6: analytics state transfer', () => {
        it('passes analyticsInitialState to TrendsView navigation', () => {
            const { navigateToView } = useNavigationStore.getState();
            const analyticsState: AnalyticsNavigationState = {
                temporal: { level: 'month', year: '2026', month: '2026-01' },
                category: { level: 'all' },
                chartMode: 'aggregation',
                drillDownMode: 'temporal',
            };
            navigateToView('trends', { analyticsState });
            expect(getNavigationState().analyticsInitialState).toEqual(analyticsState);
        });

        it('clearAnalyticsInitialState clears after consumption', () => {
            const { setAnalyticsInitialState, clearAnalyticsInitialState } =
                useNavigationStore.getState();
            const analyticsState: AnalyticsNavigationState = {
                temporal: { level: 'month', year: '2026' },
                category: { level: 'all' },
                chartMode: 'aggregation',
                drillDownMode: 'temporal',
            };
            setAnalyticsInitialState(analyticsState);
            expect(getNavigationState().analyticsInitialState).not.toBeNull();

            clearAnalyticsInitialState();
            expect(getNavigationState().analyticsInitialState).toBeNull();
        });
    });
});
