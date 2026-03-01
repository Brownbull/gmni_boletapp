/**
 * useTrendsViewSync - Hook tests
 *
 * Story 15b-2m: Tests for bidirectional sync hook extracted from TrendsView.tsx.
 * Tests cascade logic, localStorage persistence, and context dispatch.
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTrendsViewSync } from '@features/analytics/views/TrendsView/useTrendsViewSync';
import type { HistoryFilterState } from '@/types/historyFilters';

// Mock storage utils
vi.mock('@/utils/storage', () => ({
    getStorageString: vi.fn().mockReturnValue('month'),
    setStorageString: vi.fn(),
    getStorageJSON: vi.fn().mockReturnValue(null),
    setStorageJSON: vi.fn(),
}));

// Mock historyFilterUtils
vi.mock('@shared/utils/historyFilterUtils', () => ({
    buildYearFilter: vi.fn((year: string) => ({ level: 'year', year })),
    buildQuarterFilter: vi.fn((year: string, quarter: string) => ({ level: 'quarter', year, quarter })),
    buildMonthFilter: vi.fn((year: string, month: string) => ({ level: 'month', year, month })),
    buildWeekFilter: vi.fn((year: string, month: string, week: number) => ({ level: 'week', year, month, week })),
}));

const { getStorageString, setStorageString, setStorageJSON } = await import('@/utils/storage');

function makeFilterState(overrides: Partial<HistoryFilterState> = {}): HistoryFilterState {
    return {
        temporal: { level: 'all' },
        category: { type: 'all' },
        location: { type: 'all' },
        ...overrides,
    };
}

describe('useTrendsViewSync', () => {
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(getStorageString).mockReturnValue('month');
    });

    it('returns default state values', () => {
        const { result } = renderHook(() =>
            useTrendsViewSync({
                filterState: makeFilterState(),
                filterDispatch: mockDispatch,
            })
        );

        expect(result.current.timePeriod).toBe('month');
        expect(result.current.currentPeriod).toHaveProperty('year');
        expect(result.current.currentPeriod).toHaveProperty('month');
        expect(result.current.currentPeriod).toHaveProperty('quarter');
        expect(result.current.currentPeriod).toHaveProperty('week');
        expect(result.current.carouselSlide).toBe(0);
    });

    it('restores timePeriod from localStorage', () => {
        vi.mocked(getStorageString).mockImplementation((key: string, def: string) => {
            if (key === 'boletapp-analytics-timeperiod') return 'quarter';
            return def;
        });

        const { result } = renderHook(() =>
            useTrendsViewSync({
                filterState: makeFilterState(),
                filterDispatch: mockDispatch,
            })
        );

        expect(result.current.timePeriod).toBe('quarter');
    });

    it('persists timePeriod to localStorage on change', () => {
        const { result } = renderHook(() =>
            useTrendsViewSync({
                filterState: makeFilterState(),
                filterDispatch: mockDispatch,
            })
        );

        act(() => {
            result.current.setTimePeriod('year');
        });

        expect(result.current.timePeriod).toBe('year');
        expect(setStorageString).toHaveBeenCalledWith('boletapp-analytics-timeperiod', 'year');
    });

    it('persists currentPeriod to localStorage on change', () => {
        const { result } = renderHook(() =>
            useTrendsViewSync({
                filterState: makeFilterState(),
                filterDispatch: mockDispatch,
            })
        );

        act(() => {
            result.current.setCurrentPeriod({ year: 2025, month: 6, quarter: 2, week: 1 });
        });

        expect(result.current.currentPeriod.year).toBe(2025);
        expect(result.current.currentPeriod.month).toBe(6);
        expect(setStorageJSON).toHaveBeenCalledWith(
            'boletapp-analytics-currentperiod',
            expect.objectContaining({ year: 2025, month: 6 })
        );
    });

    it('persists carouselSlide to localStorage on change', () => {
        const { result } = renderHook(() =>
            useTrendsViewSync({
                filterState: makeFilterState(),
                filterDispatch: mockDispatch,
            })
        );

        act(() => {
            result.current.setCarouselSlide(1);
        });

        expect(result.current.carouselSlide).toBe(1);
        expect(setStorageString).toHaveBeenCalledWith('boletapp-analytics-carousel', '1');
    });

    it('dispatches filter on timePeriod change', () => {
        const { result } = renderHook(() =>
            useTrendsViewSync({
                filterState: makeFilterState(),
                filterDispatch: mockDispatch,
            })
        );

        act(() => {
            result.current.setTimePeriod('year');
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'SET_TEMPORAL_FILTER' })
        );
    });

    describe('cascade logic', () => {
        it('cascades from year to quarter with current year values', () => {
            vi.mocked(getStorageString).mockImplementation((key: string, def: string) => {
                if (key === 'boletapp-analytics-timeperiod') return 'year';
                return def;
            });

            const { result } = renderHook(() =>
                useTrendsViewSync({
                    filterState: makeFilterState(),
                    filterDispatch: mockDispatch,
                })
            );

            // Set currentPeriod to current year first
            const thisYear = new Date().getFullYear();
            act(() => {
                result.current.setCurrentPeriod({ year: thisYear, month: 1, quarter: 1, week: 1 });
            });

            act(() => {
                result.current.setTimePeriod('quarter');
            });

            expect(result.current.timePeriod).toBe('quarter');
            // Should have cascaded to current quarter
            expect(result.current.currentPeriod.week).toBe(1);
        });

        it('cascades from year to quarter with historical year defaults to Q4', () => {
            vi.mocked(getStorageString).mockImplementation((key: string, def: string) => {
                if (key === 'boletapp-analytics-timeperiod') return 'year';
                return def;
            });

            const { result } = renderHook(() =>
                useTrendsViewSync({
                    filterState: makeFilterState(),
                    filterDispatch: mockDispatch,
                })
            );

            // Set to a historical year
            act(() => {
                result.current.setCurrentPeriod({ year: 2020, month: 1, quarter: 1, week: 1 });
            });

            act(() => {
                result.current.setTimePeriod('quarter');
            });

            expect(result.current.timePeriod).toBe('quarter');
            expect(result.current.currentPeriod.quarter).toBe(4);
            expect(result.current.currentPeriod.month).toBe(12);
        });

        it('cascades from quarter to month: first month of quarter', () => {
            vi.mocked(getStorageString).mockImplementation((key: string, def: string) => {
                if (key === 'boletapp-analytics-timeperiod') return 'quarter';
                return def;
            });

            const { result } = renderHook(() =>
                useTrendsViewSync({
                    filterState: makeFilterState(),
                    filterDispatch: mockDispatch,
                })
            );

            // Set to Q3
            act(() => {
                result.current.setCurrentPeriod({ year: 2025, month: 7, quarter: 3, week: 1 });
            });

            act(() => {
                result.current.setTimePeriod('month');
            });

            expect(result.current.timePeriod).toBe('month');
            // Q3 first month = July (7)
            expect(result.current.currentPeriod.month).toBe(7);
            expect(result.current.currentPeriod.week).toBe(1);
        });

        it('cascades from month to week: week 1', () => {
            const { result } = renderHook(() =>
                useTrendsViewSync({
                    filterState: makeFilterState(),
                    filterDispatch: mockDispatch,
                })
            );

            act(() => {
                result.current.setTimePeriod('week');
            });

            expect(result.current.timePeriod).toBe('week');
            expect(result.current.currentPeriod.week).toBe(1);
        });
    });

    describe('context → local sync', () => {
        it('syncs timePeriod from context temporal filter', () => {
            const filterState = makeFilterState({
                temporal: { level: 'all' },
            });
            const { result, rerender } = renderHook(
                ({ fs }) => useTrendsViewSync({ filterState: fs, filterDispatch: mockDispatch }),
                { initialProps: { fs: filterState } }
            );

            expect(result.current.timePeriod).toBe('month');

            // Simulate IconFilterBar changing temporal to year
            rerender({
                fs: makeFilterState({
                    temporal: { level: 'year', year: '2025' },
                }),
            });

            expect(result.current.timePeriod).toBe('year');
        });

        it('syncs currentPeriod month from context temporal filter', () => {
            const filterState = makeFilterState({
                temporal: { level: 'all' },
            });
            const { result, rerender } = renderHook(
                ({ fs }) => useTrendsViewSync({ filterState: fs, filterDispatch: mockDispatch }),
                { initialProps: { fs: filterState } }
            );

            rerender({
                fs: makeFilterState({
                    temporal: { level: 'month', year: '2025', month: '2025-06' },
                }),
            });

            expect(result.current.timePeriod).toBe('month');
            expect(result.current.currentPeriod.month).toBe(6);
            expect(result.current.currentPeriod.year).toBe(2025);
        });
    });

    describe('cascade logic - additional branches', () => {
        it('cascades from year to month with current year values', () => {
            vi.mocked(getStorageString).mockImplementation((key: string, def: string) => {
                if (key === 'boletapp-analytics-timeperiod') return 'year';
                return def;
            });

            const { result } = renderHook(() =>
                useTrendsViewSync({
                    filterState: makeFilterState(),
                    filterDispatch: mockDispatch,
                })
            );

            const thisYear = new Date().getFullYear();
            act(() => {
                result.current.setCurrentPeriod({ year: thisYear, month: 1, quarter: 1, week: 1 });
            });

            act(() => {
                result.current.setTimePeriod('month');
            });

            expect(result.current.timePeriod).toBe('month');
            expect(result.current.currentPeriod.week).toBe(1);
        });

        it('cascades from year to week with historical year defaults', () => {
            vi.mocked(getStorageString).mockImplementation((key: string, def: string) => {
                if (key === 'boletapp-analytics-timeperiod') return 'year';
                return def;
            });

            const { result } = renderHook(() =>
                useTrendsViewSync({
                    filterState: makeFilterState(),
                    filterDispatch: mockDispatch,
                })
            );

            act(() => {
                result.current.setCurrentPeriod({ year: 2020, month: 1, quarter: 1, week: 1 });
            });

            act(() => {
                result.current.setTimePeriod('week');
            });

            expect(result.current.timePeriod).toBe('week');
            expect(result.current.currentPeriod.month).toBe(12);
            expect(result.current.currentPeriod.quarter).toBe(4);
            expect(result.current.currentPeriod.week).toBe(4);
        });
    });

    it('accepts functional updater for setCurrentPeriod', () => {
        const { result } = renderHook(() =>
            useTrendsViewSync({
                filterState: makeFilterState(),
                filterDispatch: mockDispatch,
            })
        );

        act(() => {
            result.current.setCurrentPeriod(prev => ({
                ...prev,
                month: prev.month === 12 ? 1 : prev.month + 1,
            }));
        });

        // Should have updated month
        expect(setStorageJSON).toHaveBeenCalledWith(
            'boletapp-analytics-currentperiod',
            expect.any(Object)
        );
    });

    it('accepts functional updater for setCarouselSlide', () => {
        const { result } = renderHook(() =>
            useTrendsViewSync({
                filterState: makeFilterState(),
                filterDispatch: mockDispatch,
            })
        );

        act(() => {
            result.current.setCarouselSlide(prev => (prev === 0 ? 1 : 0));
        });

        expect(result.current.carouselSlide).toBe(1);
    });
});
