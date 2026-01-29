/**
 * Story 14e-25d: useHistoryNavigation Hook Tests
 *
 * Tests for the hook that provides handleNavigateToHistory functionality.
 * This hook replaces the function previously provided via ViewHandlersContext.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the navigation store
const mockSetView = vi.fn();
const mockSetPendingHistoryFilters = vi.fn();
const mockSetPendingDistributionView = vi.fn();

vi.mock('@/shared/stores', () => ({
    useNavigationActions: () => ({
        setView: mockSetView,
        setPendingHistoryFilters: mockSetPendingHistoryFilters,
        setPendingDistributionView: mockSetPendingDistributionView,
    }),
}));

// Mock categoryColors
vi.mock('@/config/categoryColors', () => ({
    expandStoreCategoryGroup: vi.fn((group: string) => {
        const groups: Record<string, string[]> = {
            'Supermercado': ['Supermercado', 'Supermercado Premium'],
            'Combustible': ['Combustible'],
        };
        return groups[group] || [group];
    }),
    expandItemCategoryGroup: vi.fn((group: string) => {
        const groups: Record<string, string[]> = {
            'Alimentos': ['Frutas', 'Verduras', 'Carnes'],
            'Hogar': ['Limpieza', 'Decoracion'],
        };
        return groups[group] || [group];
    }),
}));

// Import after mocks are set up
import { useHistoryNavigation } from '../../../../src/shared/hooks/useHistoryNavigation';

describe('useHistoryNavigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('handleNavigateToHistory', () => {
        it('should return handleNavigateToHistory function', () => {
            const { result } = renderHook(() => useHistoryNavigation());
            expect(result.current.handleNavigateToHistory).toBeDefined();
            expect(typeof result.current.handleNavigateToHistory).toBe('function');
        });

        it('should navigate to history with default view', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({});
            });

            expect(mockSetPendingHistoryFilters).toHaveBeenCalledWith({
                temporal: { level: 'all' },
                category: { level: 'all' },
                location: {},
                group: {},
            });
            expect(mockSetView).toHaveBeenCalledWith('history');
        });

        it('should navigate to specified target view', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({ targetView: 'items' });
            });

            expect(mockSetView).toHaveBeenCalledWith('items');
        });

        it('should set category filter from category payload', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({ category: 'Supermercado' });
            });

            expect(mockSetPendingHistoryFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: { level: 'category', category: 'Supermercado' },
                })
            );
        });

        it('should expand store group and set category filter', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({ storeGroup: 'Supermercado' });
            });

            expect(mockSetPendingHistoryFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: { level: 'category', category: 'Supermercado,Supermercado Premium' },
                })
            );
        });

        it('should expand item group and set group filter', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({ itemGroup: 'Alimentos' });
            });

            expect(mockSetPendingHistoryFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: { level: 'group', group: 'Frutas,Verduras,Carnes' },
                })
            );
        });

        it('should set item category as group filter', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({ itemCategory: 'Frutas' });
            });

            expect(mockSetPendingHistoryFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: { level: 'group', group: 'Frutas' },
                })
            );
        });

        it('should set temporal filter', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({
                    temporal: { level: 'month', year: 2026, month: 1 },
                });
            });

            expect(mockSetPendingHistoryFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    temporal: { level: 'month', year: 2026, month: 1 },
                })
            );
        });

        it('should set pending distribution view when provided', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({
                    sourceDistributionView: 'stores',
                });
            });

            expect(mockSetPendingDistributionView).toHaveBeenCalledWith('stores');
        });

        it('should include drillDownPath when provided', () => {
            const { result } = renderHook(() => useHistoryNavigation());

            act(() => {
                result.current.handleNavigateToHistory({
                    category: 'Supermercado',
                    drillDownPath: [{ dimension: 'store', value: 'Supermercado' }],
                });
            });

            expect(mockSetPendingHistoryFilters).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: {
                        level: 'category',
                        category: 'Supermercado',
                        drillDownPath: [{ dimension: 'store', value: 'Supermercado' }],
                    },
                })
            );
        });
    });
});
