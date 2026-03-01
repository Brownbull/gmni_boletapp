import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDashboardMonthNavigation } from '@features/dashboard/views/DashboardView/useDashboardMonthNavigation';

const mockResetSlideState = vi.fn();
const mockFormatCurrency = vi.fn((amount: number, _currency: string) => `$${amount}`);

function renderMonthNav(overrides = {}) {
    return renderHook(() =>
        useDashboardMonthNavigation({
            lang: 'es',
            formatCurrency: mockFormatCurrency,
            currency: 'CLP',
            resetSlideState: mockResetSlideState,
            ...overrides,
        })
    );
}

describe('useDashboardMonthNavigation', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 1, 15)); // Feb 15, 2026
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('initial state', () => {
        it('initializes to current month', () => {
            const { result } = renderMonthNav();
            expect(result.current.selectedMonth).toEqual({ year: 2026, month: 1 });
        });

        it('returns correct selectedMonthString', () => {
            const { result } = renderMonthNav();
            expect(result.current.selectedMonthString).toBe('2026-02');
        });

        it('isViewingCurrentMonth is true initially', () => {
            const { result } = renderMonthNav();
            expect(result.current.isViewingCurrentMonth).toBe(true);
        });

        it('canGoToNextMonth is false when on current month', () => {
            const { result } = renderMonthNav();
            expect(result.current.canGoToNextMonth).toBe(false);
        });
    });

    describe('goToPrevMonth', () => {
        it('navigates to previous month', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToPrevMonth());
            expect(result.current.selectedMonth).toEqual({ year: 2026, month: 0 });
            expect(result.current.selectedMonthString).toBe('2026-01');
        });

        it('wraps from January to December of previous year', () => {
            const { result } = renderMonthNav();
            // Go back twice: Feb -> Jan -> Dec 2025
            act(() => result.current.goToPrevMonth());
            act(() => result.current.goToPrevMonth());
            expect(result.current.selectedMonth).toEqual({ year: 2025, month: 11 });
        });

        it('calls resetSlideState', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToPrevMonth());
            expect(mockResetSlideState).toHaveBeenCalledTimes(1);
        });

        it('sets isViewingCurrentMonth to false', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToPrevMonth());
            expect(result.current.isViewingCurrentMonth).toBe(false);
        });

        it('enables canGoToNextMonth after going back', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToPrevMonth());
            expect(result.current.canGoToNextMonth).toBe(true);
        });
    });

    describe('goToNextMonth', () => {
        it('does not go beyond current month', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToNextMonth());
            // Should still be at current month
            expect(result.current.selectedMonth).toEqual({ year: 2026, month: 1 });
        });

        it('navigates forward after going back', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToPrevMonth());
            act(() => result.current.goToNextMonth());
            expect(result.current.selectedMonth).toEqual({ year: 2026, month: 1 });
        });

        it('wraps from December to January of next year', () => {
            // Go back far enough, then check Dec->Jan transition
            vi.setSystemTime(new Date(2026, 5, 15)); // June 2026
            const { result } = renderMonthNav();
            // Navigate back to Dec 2025
            for (let i = 0; i < 6; i++) {
                act(() => result.current.goToPrevMonth());
            }
            expect(result.current.selectedMonth).toEqual({ year: 2025, month: 11 });
            // Navigate forward
            act(() => result.current.goToNextMonth());
            expect(result.current.selectedMonth).toEqual({ year: 2026, month: 0 });
        });

        it('calls resetSlideState', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToPrevMonth());
            mockResetSlideState.mockClear();
            act(() => result.current.goToNextMonth());
            expect(mockResetSlideState).toHaveBeenCalledTimes(1);
        });
    });

    describe('goToCurrentMonth', () => {
        it('returns to current month from any past month', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToPrevMonth());
            act(() => result.current.goToPrevMonth());
            act(() => result.current.goToCurrentMonth());
            expect(result.current.selectedMonth).toEqual({ year: 2026, month: 1 });
            expect(result.current.isViewingCurrentMonth).toBe(true);
        });

        it('calls resetSlideState', () => {
            const { result } = renderMonthNav();
            act(() => result.current.goToCurrentMonth());
            expect(mockResetSlideState).toHaveBeenCalledTimes(1);
        });
    });

    describe('formatMonth', () => {
        it('formats month in Spanish', () => {
            const { result } = renderMonthNav();
            expect(result.current.formattedMonthName).toBe("Feb '26");
        });

        it('formats month in English', () => {
            const { result } = renderMonthNav({ lang: 'en' });
            expect(result.current.formattedMonthName).toBe("Feb '26");
        });

        it('formats September correctly (Sept not Sep)', () => {
            vi.setSystemTime(new Date(2026, 8, 15)); // September
            const { result } = renderMonthNav();
            expect(result.current.formattedMonthName).toBe("Sept '26");
        });
    });

    describe('prevMonthName and nextMonthName', () => {
        it('returns correct previous month name', () => {
            const { result } = renderMonthNav();
            // Current is Feb 2026, prev is Jan 2026
            expect(result.current.prevMonthName).toBe("Ene '26");
        });

        it('returns correct next month name', () => {
            const { result } = renderMonthNav();
            // Current is Feb 2026, next is Mar 2026
            expect(result.current.nextMonthName).toBe("Mar '26");
        });
    });

    describe('formatCompactAmount', () => {
        it('formats amount in thousands', () => {
            const { result } = renderMonthNav();
            const formatted = result.current.formatCompactAmount(150000);
            // mockFormatCurrency returns "$150" for Math.round(150000/1000)=150
            expect(formatted).toBe('$150k');
        });
    });

    describe('swipe state', () => {
        it('initializes with null touch start and zero offset', () => {
            const { result } = renderMonthNav();
            expect(result.current.monthTouchStart).toBeNull();
            expect(result.current.monthSwipeOffset).toBe(0);
        });
    });
});
