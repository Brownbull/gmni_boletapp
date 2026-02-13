/**
 * useHistoryFiltersStore Tests
 *
 * Story 15-TD-3: Tests for the Zustand store that replaced HistoryFiltersContext.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryFiltersStore, getDefaultFilterState, historyFiltersActions } from '../../../src/shared/stores/useHistoryFiltersStore';

describe('useHistoryFiltersStore', () => {
    beforeEach(() => {
        // Reset store to default state before each test
        useHistoryFiltersStore.setState({
            ...getDefaultFilterState(),
        });
    });

    describe('getDefaultFilterState', () => {
        it('returns current month as default temporal filter', () => {
            const state = getDefaultFilterState();
            const now = new Date();
            const expectedYear = String(now.getFullYear());
            const expectedMonth = `${expectedYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            expect(state.temporal.level).toBe('month');
            expect(state.temporal.year).toBe(expectedYear);
            expect(state.temporal.month).toBe(expectedMonth);
        });

        it('returns category filter at "all" level', () => {
            const state = getDefaultFilterState();
            expect(state.category).toEqual({ level: 'all' });
        });

        it('returns empty location filter', () => {
            const state = getDefaultFilterState();
            expect(state.location).toEqual({});
        });
    });

    describe('dispatch - SET actions', () => {
        it('SET_TEMPORAL_FILTER updates only temporal state', () => {
            const newTemporal = { level: 'year' as const, year: '2025' };

            useHistoryFiltersStore.getState().dispatch({
                type: 'SET_TEMPORAL_FILTER',
                payload: newTemporal,
            });

            const state = useHistoryFiltersStore.getState();
            expect(state.temporal).toEqual(newTemporal);
            // Other filters unchanged
            expect(state.category).toEqual({ level: 'all' });
            expect(state.location).toEqual({});
        });

        it('SET_CATEGORY_FILTER updates only category state', () => {
            const newCategory = { level: 'category' as const, category: 'food' };

            useHistoryFiltersStore.getState().dispatch({
                type: 'SET_CATEGORY_FILTER',
                payload: newCategory,
            });

            const state = useHistoryFiltersStore.getState();
            expect(state.category).toEqual(newCategory);
            // Temporal unchanged
            expect(state.temporal.level).toBe('month');
        });

        it('SET_LOCATION_FILTER updates only location state', () => {
            const newLocation = { merchant: 'Store A' };

            useHistoryFiltersStore.getState().dispatch({
                type: 'SET_LOCATION_FILTER',
                payload: newLocation,
            });

            const state = useHistoryFiltersStore.getState();
            expect(state.location).toEqual(newLocation);
        });
    });

    describe('dispatch - CLEAR actions', () => {
        it('CLEAR_TEMPORAL resets temporal to "all" without affecting others', () => {
            // Set a non-default category first
            useHistoryFiltersStore.getState().dispatch({
                type: 'SET_CATEGORY_FILTER',
                payload: { level: 'category' as const, category: 'food' },
            });

            useHistoryFiltersStore.getState().dispatch({ type: 'CLEAR_TEMPORAL' });

            const state = useHistoryFiltersStore.getState();
            expect(state.temporal).toEqual({ level: 'all' });
            // Category should be preserved (AC #5: filters are independent)
            expect(state.category).toEqual({ level: 'category', category: 'food' });
        });

        it('CLEAR_CATEGORY resets category to "all"', () => {
            useHistoryFiltersStore.getState().dispatch({
                type: 'SET_CATEGORY_FILTER',
                payload: { level: 'category' as const, category: 'food' },
            });

            useHistoryFiltersStore.getState().dispatch({ type: 'CLEAR_CATEGORY' });

            expect(useHistoryFiltersStore.getState().category).toEqual({ level: 'all' });
        });

        it('CLEAR_LOCATION resets location to empty object', () => {
            useHistoryFiltersStore.getState().dispatch({
                type: 'SET_LOCATION_FILTER',
                payload: { merchant: 'Store A' },
            });

            useHistoryFiltersStore.getState().dispatch({ type: 'CLEAR_LOCATION' });

            expect(useHistoryFiltersStore.getState().location).toEqual({});
        });

        it('CLEAR_ALL_FILTERS resets entire state to defaults', () => {
            // Set all filters to non-default
            const { dispatch } = useHistoryFiltersStore.getState();
            dispatch({ type: 'SET_TEMPORAL_FILTER', payload: { level: 'year' as const, year: '2025' } });
            dispatch({ type: 'SET_CATEGORY_FILTER', payload: { level: 'category' as const, category: 'food' } });
            dispatch({ type: 'SET_LOCATION_FILTER', payload: { merchant: 'X' } });

            dispatch({ type: 'CLEAR_ALL_FILTERS' });

            const state = useHistoryFiltersStore.getState();
            const defaults = getDefaultFilterState();
            expect(state.temporal).toEqual(defaults.temporal);
            expect(state.category).toEqual(defaults.category);
            expect(state.location).toEqual(defaults.location);
        });
    });

    describe('initializeFilters', () => {
        it('overwrites current state with provided state', () => {
            const customState = {
                temporal: { level: 'year' as const, year: '2024' },
                category: { level: 'subcategory' as const, category: 'food', subcategory: 'fast-food' },
                location: { merchant: 'McDonalds' },
            };

            useHistoryFiltersStore.getState().initializeFilters(customState);

            const state = useHistoryFiltersStore.getState();
            expect(state.temporal).toEqual(customState.temporal);
            expect(state.category).toEqual(customState.category);
            expect(state.location).toEqual(customState.location);
        });
    });

    describe('historyFiltersActions (imperative)', () => {
        it('dispatch works outside React', () => {
            historyFiltersActions.dispatch({
                type: 'SET_TEMPORAL_FILTER',
                payload: { level: 'all' as const },
            });

            expect(useHistoryFiltersStore.getState().temporal).toEqual({ level: 'all' });
        });

        it('getState returns filter state without store methods', () => {
            const state = historyFiltersActions.getState();

            expect(state).toHaveProperty('temporal');
            expect(state).toHaveProperty('category');
            expect(state).toHaveProperty('location');
            expect(state).not.toHaveProperty('dispatch');
            expect(state).not.toHaveProperty('initializeFilters');
        });

        it('initializeFilters works outside React', () => {
            const customState = {
                temporal: { level: 'all' as const },
                category: { level: 'all' as const },
                location: {},
            };

            historyFiltersActions.initializeFilters(customState);

            const state = useHistoryFiltersStore.getState();
            expect(state.temporal).toEqual({ level: 'all' });
        });
    });

    describe('unknown action', () => {
        it('returns state unchanged for unknown action type', () => {
            const stateBefore = {
                temporal: useHistoryFiltersStore.getState().temporal,
                category: useHistoryFiltersStore.getState().category,
                location: useHistoryFiltersStore.getState().location,
            };

            useHistoryFiltersStore.getState().dispatch({
                type: 'UNKNOWN_ACTION' as never,
            } as never);

            const stateAfter = useHistoryFiltersStore.getState();
            expect(stateAfter.temporal).toEqual(stateBefore.temporal);
            expect(stateAfter.category).toEqual(stateBefore.category);
            expect(stateAfter.location).toEqual(stateBefore.location);
        });
    });
});
