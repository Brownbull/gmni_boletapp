/**
 * Unit tests for useNavigationHandlers hook
 *
 * Story 14c-refactor.21: Unit tests for extracted navigation handlers
 *
 * Tests navigation handlers:
 * - navigateToView (view switching with scroll/filter management)
 * - navigateBack (back navigation with scroll restoration)
 * - handleNavigateToHistory (analytics drill-down to history)
 * - Filter clearing useEffects (Story 14.13b logic)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { RefObject } from 'react';
import type { View } from '../../../../src/components/App';
import type { HistoryFilterState } from '../../../../src/contexts/HistoryFiltersContext';
import type { ScanState } from '../../../../src/types/scanStateMachine';
import type { UseNavigationHandlersProps } from '../../../../src/hooks/app/useNavigationHandlers';
import { useNavigationHandlers } from '../../../../src/hooks/app/useNavigationHandlers';
import { DIALOG_TYPES } from '../../../../src/types/scanStateMachine';

describe('useNavigationHandlers', () => {
    // Mock refs
    const createMockRef = <T>(current: T): RefObject<T> => ({ current });
    const createMockMainRef = () => createMockRef({
        scrollTop: 100,
        scrollTo: vi.fn(),
    } as unknown as HTMLDivElement);
    const createMockScrollPositionsRef = () => createMockRef<Record<string, number>>({});

    // Mock scan state
    const createMockScanState = (overrides: Partial<ScanState> = {}): ScanState => ({
        phase: 'idle',
        mode: null,
        images: [],
        results: [],
        activeDialog: null,
        creditStatus: 'none',
        errorMessage: null,
        batchReceipts: [],
        savedInBatch: [],
        ...overrides,
    });

    // Default props factory
    const createDefaultProps = (overrides: Partial<UseNavigationHandlersProps> = {}): UseNavigationHandlersProps => ({
        view: 'dashboard',
        setView: vi.fn(),
        previousView: 'dashboard',
        setPreviousView: vi.fn(),
        mainRef: createMockMainRef(),
        scrollPositionsRef: createMockScrollPositionsRef(),
        pendingHistoryFilters: null,
        setPendingHistoryFilters: vi.fn(),
        pendingDistributionView: null,
        setPendingDistributionView: vi.fn(),
        analyticsInitialState: null,
        setAnalyticsInitialState: vi.fn(),
        scanState: createMockScanState(),
        dismissScanDialog: vi.fn(),
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // =========================================================================
    // navigateToView Tests
    // =========================================================================

    describe('navigateToView', () => {
        it('should save current scroll position before navigating', () => {
            const mainRef = createMockMainRef();
            const scrollPositionsRef = createMockScrollPositionsRef();
            mainRef.current!.scrollTop = 250;

            const props = createDefaultProps({
                view: 'history',
                mainRef,
                scrollPositionsRef,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('settings');
            });

            expect(scrollPositionsRef.current!['history']).toBe(250);
        });

        it('should set previous view to current view', () => {
            const setPreviousView = vi.fn();
            const props = createDefaultProps({
                view: 'history',
                setPreviousView,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('dashboard');
            });

            expect(setPreviousView).toHaveBeenCalledWith('history');
        });

        it('should call setView with target view', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('settings');
            });

            expect(setView).toHaveBeenCalledWith('settings');
        });

        it('should reset scroll to top after navigation', () => {
            const mainRef = createMockMainRef();
            const props = createDefaultProps({ mainRef });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('settings');
            });

            // Advance timers to trigger setTimeout
            act(() => {
                vi.runAllTimers();
            });

            expect(mainRef.current!.scrollTo).toHaveBeenCalledWith(0, 0);
        });

        it('should dismiss QuickSave dialog when navigating away from transaction views', () => {
            const dismissScanDialog = vi.fn();
            const scanState = createMockScanState({
                activeDialog: { type: DIALOG_TYPES.QUICKSAVE },
            });
            const props = createDefaultProps({
                view: 'scan-result',
                scanState,
                dismissScanDialog,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('dashboard');
            });

            expect(dismissScanDialog).toHaveBeenCalled();
        });

        it('should NOT dismiss QuickSave dialog when navigating to transaction-editor', () => {
            const dismissScanDialog = vi.fn();
            const scanState = createMockScanState({
                activeDialog: { type: DIALOG_TYPES.QUICKSAVE },
            });
            const props = createDefaultProps({
                scanState,
                dismissScanDialog,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('transaction-editor');
            });

            expect(dismissScanDialog).not.toHaveBeenCalled();
        });

        it('should NOT dismiss dialog when it is not QuickSave', () => {
            const dismissScanDialog = vi.fn();
            const scanState = createMockScanState({
                activeDialog: { type: DIALOG_TYPES.CURRENCY_MISMATCH },
            });
            const props = createDefaultProps({
                scanState,
                dismissScanDialog,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('dashboard');
            });

            expect(dismissScanDialog).not.toHaveBeenCalled();
        });

        // Story 14.13b: Filter clearing logic
        it('should clear filters when navigating to history from settings (unrelated view)', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({
                view: 'settings',
                setPendingHistoryFilters,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('history');
            });

            expect(setPendingHistoryFilters).toHaveBeenCalledWith(null);
        });

        it('should NOT clear filters when navigating to history from trends (related view)', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({
                view: 'trends',
                setPendingHistoryFilters,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('history');
            });

            expect(setPendingHistoryFilters).not.toHaveBeenCalledWith(null);
        });

        it('should NOT clear filters when navigating to history from dashboard (related view)', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({
                view: 'dashboard',
                setPendingHistoryFilters,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('history');
            });

            expect(setPendingHistoryFilters).not.toHaveBeenCalledWith(null);
        });

        it('should NOT clear filters when navigating to items from transaction-editor', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({
                view: 'transaction-editor',
                setPendingHistoryFilters,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('items');
            });

            expect(setPendingHistoryFilters).not.toHaveBeenCalledWith(null);
        });

        it('should NOT clear filters when navigating to non-history view', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({
                view: 'settings',
                setPendingHistoryFilters,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateToView('dashboard');
            });

            expect(setPendingHistoryFilters).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // navigateBack Tests
    // =========================================================================

    describe('navigateBack', () => {
        it('should navigate to previousView when different from current', () => {
            const setView = vi.fn();
            const props = createDefaultProps({
                view: 'settings',
                previousView: 'history',
                setView,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateBack();
            });

            expect(setView).toHaveBeenCalledWith('history');
        });

        it('should fallback to dashboard when previousView is same as current', () => {
            const setView = vi.fn();
            const props = createDefaultProps({
                view: 'settings',
                previousView: 'settings',
                setView,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateBack();
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });

        it('should fallback to dashboard when previousView is falsy', () => {
            const setView = vi.fn();
            const props = createDefaultProps({
                view: 'settings',
                previousView: '' as View,
                setView,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateBack();
            });

            expect(setView).toHaveBeenCalledWith('dashboard');
        });

        it('should restore saved scroll position for target view', () => {
            const mainRef = createMockMainRef();
            const scrollPositionsRef = createMockScrollPositionsRef();
            scrollPositionsRef.current!['history'] = 500;

            const props = createDefaultProps({
                view: 'settings',
                previousView: 'history',
                mainRef,
                scrollPositionsRef,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateBack();
            });

            // Advance timers to trigger setTimeout
            act(() => {
                vi.runAllTimers();
            });

            expect(mainRef.current!.scrollTo).toHaveBeenCalledWith(0, 500);
        });

        it('should default to scroll position 0 when no saved position', () => {
            const mainRef = createMockMainRef();
            const scrollPositionsRef = createMockScrollPositionsRef();
            // No saved position for 'history'

            const props = createDefaultProps({
                view: 'settings',
                previousView: 'history',
                mainRef,
                scrollPositionsRef,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.navigateBack();
            });

            act(() => {
                vi.runAllTimers();
            });

            expect(mainRef.current!.scrollTo).toHaveBeenCalledWith(0, 0);
        });
    });

    // =========================================================================
    // handleNavigateToHistory Tests
    // =========================================================================

    describe('handleNavigateToHistory', () => {
        it('should set pending history filters from payload', () => {
            const setPendingHistoryFilters = vi.fn();
            const setView = vi.fn();
            const props = createDefaultProps({
                setPendingHistoryFilters,
                setView,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.handleNavigateToHistory({
                    category: 'Supermarket',
                    temporal: { level: 'month', year: 2026, month: 1 },
                });
            });

            expect(setPendingHistoryFilters).toHaveBeenCalledWith(expect.objectContaining({
                category: expect.objectContaining({
                    level: 'category',
                    category: 'Supermarket',
                }),
                temporal: expect.objectContaining({
                    level: 'month',
                    year: 2026,
                    month: 1,
                }),
            }));
        });

        it('should navigate to history view by default', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.handleNavigateToHistory({});
            });

            expect(setView).toHaveBeenCalledWith('history');
        });

        it('should navigate to items view when targetView is items', () => {
            const setView = vi.fn();
            const props = createDefaultProps({ setView });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.handleNavigateToHistory({ targetView: 'items' });
            });

            expect(setView).toHaveBeenCalledWith('items');
        });

        it('should set pending distribution view when sourceDistributionView provided', () => {
            const setPendingDistributionView = vi.fn();
            const props = createDefaultProps({ setPendingDistributionView });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.handleNavigateToHistory({
                    sourceDistributionView: 'donut',
                });
            });

            expect(setPendingDistributionView).toHaveBeenCalledWith('donut');
        });

        it('should include drillDownPath in category filter', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({ setPendingHistoryFilters });
            const { result } = renderHook(() => useNavigationHandlers(props));

            const drillDownPath = {
                storeCategory: 'Supermarket',
                itemGroup: 'food-fresh',
            };

            act(() => {
                result.current.handleNavigateToHistory({
                    drillDownPath,
                });
            });

            expect(setPendingHistoryFilters).toHaveBeenCalledWith(expect.objectContaining({
                category: expect.objectContaining({
                    drillDownPath,
                }),
            }));
        });

        it('should expand storeGroup to category filter', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({ setPendingHistoryFilters });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.handleNavigateToHistory({
                    storeGroup: 'food-dining',
                });
            });

            expect(setPendingHistoryFilters).toHaveBeenCalledWith(expect.objectContaining({
                category: expect.objectContaining({
                    level: 'category',
                    category: expect.any(String), // Expanded categories
                }),
            }));
        });

        it('should expand itemGroup to group filter', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({ setPendingHistoryFilters });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.handleNavigateToHistory({
                    itemGroup: 'food-fresh',
                });
            });

            expect(setPendingHistoryFilters).toHaveBeenCalledWith(expect.objectContaining({
                category: expect.objectContaining({
                    level: 'group',
                    group: expect.any(String), // Expanded item categories
                }),
            }));
        });

        it('should use itemCategory directly as group filter', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({ setPendingHistoryFilters });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.handleNavigateToHistory({
                    itemCategory: 'Bakery',
                });
            });

            expect(setPendingHistoryFilters).toHaveBeenCalledWith(expect.objectContaining({
                category: expect.objectContaining({
                    level: 'group',
                    group: 'Bakery',
                }),
            }));
        });

        it('should default to "all" level when no filters provided', () => {
            const setPendingHistoryFilters = vi.fn();
            const props = createDefaultProps({ setPendingHistoryFilters });
            const { result } = renderHook(() => useNavigationHandlers(props));

            act(() => {
                result.current.handleNavigateToHistory({});
            });

            expect(setPendingHistoryFilters).toHaveBeenCalledWith(expect.objectContaining({
                temporal: { level: 'all' },
                category: { level: 'all' },
            }));
        });
    });

    // =========================================================================
    // Filter Clearing Effects Tests (Story 14.13b)
    // =========================================================================

    describe('filter clearing effects', () => {
        it('should clear pendingHistoryFilters when navigating away from related views', () => {
            const setPendingHistoryFilters = vi.fn();
            const pendingFilters: HistoryFilterState = {
                temporal: { level: 'month', year: 2026, month: 1 },
                category: { level: 'category', category: 'Supermarket' },
                location: {},
                group: {},
            };
            const props = createDefaultProps({
                view: 'history',
                pendingHistoryFilters: pendingFilters,
                setPendingHistoryFilters,
            });

            // Render with history view (filters should persist)
            const { rerender } = renderHook(() => useNavigationHandlers(props));

            // Change to settings view
            rerender();
            const newProps = createDefaultProps({
                view: 'settings',
                pendingHistoryFilters: pendingFilters,
                setPendingHistoryFilters,
            });
            renderHook(() => useNavigationHandlers(newProps));

            expect(setPendingHistoryFilters).toHaveBeenCalledWith(null);
        });

        it('should NOT clear pendingHistoryFilters when on history view', () => {
            const setPendingHistoryFilters = vi.fn();
            const pendingFilters: HistoryFilterState = {
                temporal: { level: 'month', year: 2026, month: 1 },
                category: { level: 'category', category: 'Supermarket' },
                location: {},
                group: {},
            };
            const props = createDefaultProps({
                view: 'history',
                pendingHistoryFilters: pendingFilters,
                setPendingHistoryFilters,
            });

            renderHook(() => useNavigationHandlers(props));

            expect(setPendingHistoryFilters).not.toHaveBeenCalledWith(null);
        });

        it('should NOT clear pendingHistoryFilters when on items view', () => {
            const setPendingHistoryFilters = vi.fn();
            const pendingFilters: HistoryFilterState = {
                temporal: { level: 'all' },
                category: { level: 'all' },
                location: {},
                group: {},
            };
            const props = createDefaultProps({
                view: 'items',
                pendingHistoryFilters: pendingFilters,
                setPendingHistoryFilters,
            });

            renderHook(() => useNavigationHandlers(props));

            expect(setPendingHistoryFilters).not.toHaveBeenCalledWith(null);
        });

        it('should clear analyticsInitialState when navigating away from trends', () => {
            const setAnalyticsInitialState = vi.fn();
            const props = createDefaultProps({
                view: 'dashboard',
                analyticsInitialState: { level: 'month', month: 1, year: 2026 },
                setAnalyticsInitialState,
            });

            renderHook(() => useNavigationHandlers(props));

            expect(setAnalyticsInitialState).toHaveBeenCalledWith(null);
        });

        it('should NOT clear analyticsInitialState when on trends view', () => {
            const setAnalyticsInitialState = vi.fn();
            const props = createDefaultProps({
                view: 'trends',
                analyticsInitialState: { level: 'month', month: 1, year: 2026 },
                setAnalyticsInitialState,
            });

            renderHook(() => useNavigationHandlers(props));

            expect(setAnalyticsInitialState).not.toHaveBeenCalledWith(null);
        });

        it('should clear pendingDistributionView when navigating away from related views', () => {
            const setPendingDistributionView = vi.fn();
            const props = createDefaultProps({
                view: 'settings',
                pendingDistributionView: 'donut',
                setPendingDistributionView,
            });

            renderHook(() => useNavigationHandlers(props));

            expect(setPendingDistributionView).toHaveBeenCalledWith(null);
        });

        it('should NOT clear pendingDistributionView when on trends view', () => {
            const setPendingDistributionView = vi.fn();
            const props = createDefaultProps({
                view: 'trends',
                pendingDistributionView: 'donut',
                setPendingDistributionView,
            });

            renderHook(() => useNavigationHandlers(props));

            expect(setPendingDistributionView).not.toHaveBeenCalledWith(null);
        });
    });

    // =========================================================================
    // Hook Stability Tests
    // =========================================================================

    describe('hook stability', () => {
        it('should return stable handler references with same props', () => {
            const props = createDefaultProps();
            const { result, rerender } = renderHook(() => useNavigationHandlers(props));

            const firstRender = {
                navigateToView: result.current.navigateToView,
                navigateBack: result.current.navigateBack,
                handleNavigateToHistory: result.current.handleNavigateToHistory,
            };

            rerender();

            expect(result.current.navigateToView).toBe(firstRender.navigateToView);
            expect(result.current.navigateBack).toBe(firstRender.navigateBack);
            expect(result.current.handleNavigateToHistory).toBe(firstRender.handleNavigateToHistory);
        });

        it('should update navigateToView when view prop changes', () => {
            const props = createDefaultProps({ view: 'dashboard' });
            const { result, rerender } = renderHook(
                (currentProps) => useNavigationHandlers(currentProps),
                { initialProps: props }
            );

            const firstNavigateToView = result.current.navigateToView;

            rerender({ ...props, view: 'history' });

            expect(result.current.navigateToView).not.toBe(firstNavigateToView);
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('edge cases', () => {
        it('should handle null mainRef gracefully', () => {
            const mainRef = { current: null } as RefObject<HTMLDivElement>;
            const props = createDefaultProps({ mainRef });
            const { result } = renderHook(() => useNavigationHandlers(props));

            expect(() => {
                act(() => {
                    result.current.navigateToView('settings');
                });
            }).not.toThrow();
        });

        it('should handle null scrollPositionsRef gracefully', () => {
            const scrollPositionsRef = { current: null } as RefObject<Record<string, number>>;
            const props = createDefaultProps({ scrollPositionsRef });
            const { result } = renderHook(() => useNavigationHandlers(props));

            expect(() => {
                act(() => {
                    result.current.navigateToView('settings');
                });
            }).not.toThrow();
        });

        it('should handle undefined activeDialog gracefully', () => {
            const dismissScanDialog = vi.fn();
            const scanState = createMockScanState({ activeDialog: undefined as any });
            const props = createDefaultProps({
                scanState,
                dismissScanDialog,
            });
            const { result } = renderHook(() => useNavigationHandlers(props));

            expect(() => {
                act(() => {
                    result.current.navigateToView('dashboard');
                });
            }).not.toThrow();

            expect(dismissScanDialog).not.toHaveBeenCalled();
        });
    });
});
