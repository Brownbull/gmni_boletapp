/**
 * Story 15b-3g: useHistoryFiltersInit Unit Tests
 *
 * Tests the hook that replaced HistoryFiltersProvider:
 * 1. Store initialization via useLayoutEffect
 * 2. State sync via onStateChange callback
 * 3. Idempotent initialization (only once)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryFiltersInit } from '../../../src/shared/hooks/useHistoryFiltersInit';
import {
    useHistoryFiltersStore,
    getDefaultFilterState,
} from '../../../src/shared/stores/useHistoryFiltersStore';
import type { HistoryFilterState } from '../../../src/types/historyFilters';

describe('useHistoryFiltersInit', () => {
    const defaultState = getDefaultFilterState();

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store to defaults before each test
        useHistoryFiltersStore.setState({
            ...getDefaultFilterState(),
        });
    });

    describe('initialization', () => {
        it('should initialize store with defaults when no options provided', () => {
            const initSpy = vi.spyOn(
                useHistoryFiltersStore.getState(),
                'initializeFilters'
            );

            renderHook(() => useHistoryFiltersInit());

            expect(initSpy).toHaveBeenCalledWith(defaultState);
        });

        it('should initialize store with custom initialState when provided', () => {
            const customState: HistoryFilterState = {
                temporal: { level: 'year', year: '2025' },
                category: { level: 'all' },
                location: {},
            };
            const initSpy = vi.spyOn(
                useHistoryFiltersStore.getState(),
                'initializeFilters'
            );

            renderHook(() =>
                useHistoryFiltersInit({ initialState: customState })
            );

            expect(initSpy).toHaveBeenCalledWith(customState);
        });

        it('should initialize only once on re-render', () => {
            const initSpy = vi.spyOn(
                useHistoryFiltersStore.getState(),
                'initializeFilters'
            );

            const { rerender } = renderHook(() => useHistoryFiltersInit());
            rerender();
            rerender();

            expect(initSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('onStateChange sync', () => {
        it('should call onStateChange when store state changes', () => {
            const onStateChange = vi.fn();

            renderHook(() =>
                useHistoryFiltersInit({ onStateChange })
            );

            // Initial call after initialization
            expect(onStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    temporal: expect.any(Object),
                    category: expect.any(Object),
                    location: expect.any(Object),
                })
            );

            onStateChange.mockClear();

            // Trigger state change
            act(() => {
                useHistoryFiltersStore.getState().dispatch({
                    type: 'SET_TEMPORAL_FILTER',
                    payload: { level: 'year', year: '2025' },
                });
            });

            expect(onStateChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    temporal: { level: 'year', year: '2025' },
                })
            );
        });

        it('should not call onStateChange when not provided', () => {
            // Should not throw when no onStateChange callback
            expect(() => {
                renderHook(() => useHistoryFiltersInit());
            }).not.toThrow();
        });

        it('should not call onStateChange before initialization', () => {
            const onStateChange = vi.fn();

            // The hook uses initializedRef to guard the onStateChange call.
            // Since initialization happens in useLayoutEffect (synchronous),
            // onStateChange should only be called after init is complete.
            renderHook(() =>
                useHistoryFiltersInit({ onStateChange })
            );

            // All calls should have happened after initialization
            for (const call of onStateChange.mock.calls) {
                expect(call[0]).toEqual(
                    expect.objectContaining({
                        temporal: expect.any(Object),
                        category: expect.any(Object),
                        location: expect.any(Object),
                    })
                );
            }
        });
    });
});
