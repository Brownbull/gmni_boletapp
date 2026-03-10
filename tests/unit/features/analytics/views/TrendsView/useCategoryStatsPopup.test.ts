/**
 * useCategoryStatsPopup - Unit tests
 *
 * Story 15b-2m: Extracted category stats popup hook from TrendsView.tsx
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCategoryStatsPopup } from '@features/analytics/views/TrendsView/useCategoryStatsPopup';

// Mock dependencies
vi.mock('@/config/categoryColors', () => ({
    getContrastTextColor: (color: string) => color === '#000000' ? '#ffffff' : '#000000',
    ALL_ITEM_CATEGORY_GROUPS: [
        'food-fresh', 'food-packaged', 'food-prepared', 'salud-cuidado',
        'hogar', 'productos-generales', 'servicios-cargos', 'vicios', 'otros-item',
    ],
}));

vi.mock('@/utils/categoryTranslations', () => ({
    translateCategory: (name: string, _lang: string) => `cat-${name}`,
    translateStoreCategoryGroup: (name: string, _lang: string) => `sg-${name}`,
    translateItemCategoryGroup: (name: string, _lang: string) => `ig-${name}`,
}));

vi.mock('@features/analytics/hooks/useCategoryStatistics', () => ({
    useCategoryStatistics: ({ categoryName }: { categoryName: string }) => ({
        totalSpent: categoryName ? 1000 : 0,
        transactionCount: categoryName ? 5 : 0,
        averageTransaction: categoryName ? 200 : 0,
    }),
}));

const baseProps = {
    donutViewMode: 'store-categories' as const,
    treemapDrillDownLevel: 0,
    filteredTransactions: [],
    total: 5000,
    locale: 'es',
    timePeriod: 'month' as const,
    currentPeriod: { year: 2026, month: 2, quarter: 1, week: 9 },
    onNavigateToHistory: vi.fn(),
};

describe('useCategoryStatsPopup', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('starts with popup closed and no category', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));
        expect(result.current.statsPopupOpen).toBe(false);
        expect(result.current.statsPopupCategory).toBeNull();
    });

    it('opens popup with correct category type at drill level 0', () => {
        const { result } = renderHook(() => useCategoryStatsPopup({
            ...baseProps,
            donutViewMode: 'item-groups',
        }));

        act(() => {
            result.current.handleOpenStatsPopup('Fruits', '🍎', '#ff0000');
        });

        expect(result.current.statsPopupOpen).toBe(true);
        expect(result.current.statsPopupCategory).toMatchObject({
            name: 'Fruits',
            emoji: '🍎',
            color: '#ff0000',
            type: 'item-group',
        });
    });

    it('resolves correct type for store-groups at level 0', () => {
        const { result } = renderHook(() => useCategoryStatsPopup({
            ...baseProps,
            donutViewMode: 'store-groups',
        }));

        act(() => {
            result.current.handleOpenStatsPopup('Supermarket', '🛒', '#00ff00');
        });

        expect(result.current.statsPopupCategory?.type).toBe('store-group');
    });

    it('resolves correct type for store-categories at drill level 1', () => {
        const { result } = renderHook(() => useCategoryStatsPopup({
            ...baseProps,
            donutViewMode: 'store-categories',
            treemapDrillDownLevel: 1,
        }));

        act(() => {
            result.current.handleOpenStatsPopup('Sub', '📦', '#0000ff');
        });

        expect(result.current.statsPopupCategory?.type).toBe('item-group');
    });

    it('resolves correct type for store-groups at drill level 1 (store-category)', () => {
        const { result } = renderHook(() => useCategoryStatsPopup({
            ...baseProps,
            donutViewMode: 'store-groups',
            treemapDrillDownLevel: 1,
        }));

        act(() => {
            result.current.handleOpenStatsPopup('Sub', '📦', '#0000ff');
        });

        expect(result.current.statsPopupCategory?.type).toBe('store-category');
    });

    it('resolves correct type for store-groups at drill level 2 (item-group)', () => {
        const { result } = renderHook(() => useCategoryStatsPopup({
            ...baseProps,
            donutViewMode: 'store-groups',
            treemapDrillDownLevel: 2,
        }));

        act(() => {
            result.current.handleOpenStatsPopup('Sub', '📦', '#0000ff');
        });

        expect(result.current.statsPopupCategory?.type).toBe('item-group');
    });

    it('resolves correct type for item-groups at drill level 1 (item-category)', () => {
        const { result } = renderHook(() => useCategoryStatsPopup({
            ...baseProps,
            donutViewMode: 'item-groups',
            treemapDrillDownLevel: 1,
        }));

        act(() => {
            result.current.handleOpenStatsPopup('Sub', '📦', '#0000ff');
        });

        expect(result.current.statsPopupCategory?.type).toBe('item-category');
    });

    it('ignores "Más" aggregated group', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));

        act(() => {
            result.current.handleOpenStatsPopup('Más', '➕', '#999');
        });

        expect(result.current.statsPopupOpen).toBe(false);
        expect(result.current.statsPopupCategory).toBeNull();
    });

    it('ignores "More" aggregated group (English)', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));

        act(() => {
            result.current.handleOpenStatsPopup('More', '➕', '#999');
        });

        expect(result.current.statsPopupOpen).toBe(false);
        expect(result.current.statsPopupCategory).toBeNull();
    });

    it('closes popup and clears category', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));

        act(() => {
            result.current.handleOpenStatsPopup('Food', '🍔', '#ff0000');
        });
        expect(result.current.statsPopupOpen).toBe(true);

        act(() => {
            result.current.handleCloseStatsPopup();
        });
        expect(result.current.statsPopupOpen).toBe(false);
        expect(result.current.statsPopupCategory).toBeNull();
    });

    it('navigates to history with correct payload', () => {
        const onNavigateToHistory = vi.fn();
        const { result } = renderHook(() => useCategoryStatsPopup({
            ...baseProps,
            onNavigateToHistory,
            donutViewMode: 'item-categories',
        }));

        act(() => {
            result.current.handleOpenStatsPopup('Drinks', '🥤', '#0000ff');
        });

        act(() => {
            result.current.handleStatsPopupViewHistory();
        });

        expect(onNavigateToHistory).toHaveBeenCalledWith(expect.objectContaining({
            targetView: 'items',
            itemCategory: 'Drinks',
            temporal: expect.objectContaining({
                level: 'month',
                year: '2026',
            }),
        }));
        // Should close popup after navigation
        expect(result.current.statsPopupOpen).toBe(false);
    });

    it('does not navigate when no category selected', () => {
        const onNavigateToHistory = vi.fn();
        const { result } = renderHook(() => useCategoryStatsPopup({
            ...baseProps,
            onNavigateToHistory,
        }));

        act(() => {
            result.current.handleStatsPopupViewHistory();
        });

        expect(onNavigateToHistory).not.toHaveBeenCalled();
    });

    it('translates store-category names', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));
        expect(result.current.getTranslatedCategoryName('Food', 'store-category')).toBe('cat-Food');
    });

    it('translates store-group names', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));
        expect(result.current.getTranslatedCategoryName('Super', 'store-group')).toBe('sg-Super');
    });

    it('translates item-group names', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));
        expect(result.current.getTranslatedCategoryName('food-fresh', 'item-group')).toBe('ig-food-fresh');
    });

    it('returns category statistics from hook', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));

        act(() => {
            result.current.handleOpenStatsPopup('Food', '🍔', '#ff0000');
        });

        expect(result.current.categoryStatistics).toMatchObject({
            totalSpent: 1000,
            transactionCount: 5,
        });
    });

    it('returns name unchanged for invalid item-group values', () => {
        const { result } = renderHook(() => useCategoryStatsPopup(baseProps));
        // 'invalid-group' is not a valid ItemCategoryGroup — should return name unchanged
        expect(result.current.getTranslatedCategoryName('invalid-group', 'item-group')).toBe('invalid-group');
    });
});
