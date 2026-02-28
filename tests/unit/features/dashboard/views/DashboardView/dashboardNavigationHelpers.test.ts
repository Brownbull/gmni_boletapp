import { describe, it, expect, vi } from 'vitest';
import { buildTreemapCellNavigationPayload } from '@features/dashboard/views/DashboardView/dashboardNavigationHelpers';
import type { CategoryDataEntry } from '@features/dashboard/views/DashboardView/categoryDataHelpers';

vi.mock('@/config/categoryColors', () => ({
    expandStoreCategoryGroup: vi.fn((group: string) => {
        if (group === 'Food & Dining') return ['Supermercado', 'Restaurante', 'Panadería'];
        return [group];
    }),
    expandItemCategoryGroup: vi.fn((group: string) => {
        if (group === 'Fresh Food') return ['Carnes', 'Lácteos', 'Verduras'];
        return [group];
    }),
}));

function makeCategoryEntry(name: string): CategoryDataEntry {
    return {
        name,
        amount: 1000,
        count: 5,
        itemCount: 10,
        bgColor: '#ff0000',
        fgColor: '#ffffff',
        percent: 10,
    };
}

const baseParams = {
    selectedMonth: { year: 2026, month: 1 },
    selectedMonthString: '2026-02',
    countMode: 'transactions' as const,
    storeCategoriesOtro: [] as CategoryDataEntry[],
    storeGroupsOtro: [] as CategoryDataEntry[],
    itemCategoriesOtro: [] as CategoryDataEntry[],
    itemGroupsOtro: [] as CategoryDataEntry[],
};

describe('buildTreemapCellNavigationPayload', () => {
    describe('store-groups view mode', () => {
        it('sets storeGroup for regular category', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Food & Dining',
                treemapViewMode: 'store-groups',
            });
            expect(result.storeGroup).toBe('Food & Dining');
            expect(result.drillDownPath).toEqual({ storeGroup: 'Food & Dining' });
        });

        it('expands "Más" aggregated group to constituent categories', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Más',
                treemapViewMode: 'store-groups',
                storeGroupsOtro: [
                    makeCategoryEntry('Food & Dining'),
                    makeCategoryEntry('Entertainment'),
                ],
            });
            expect(result.category).toBe('Supermercado,Restaurante,Panadería,Entertainment');
            expect(result.drillDownPath).toBeUndefined();
        });
    });

    describe('store-categories view mode', () => {
        it('sets category for regular category', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Supermercado',
                treemapViewMode: 'store-categories',
            });
            expect(result.category).toBe('Supermercado');
            expect(result.drillDownPath).toEqual({ storeCategory: 'Supermercado' });
        });

        it('joins "Más" categories with comma', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Más',
                treemapViewMode: 'store-categories',
                storeCategoriesOtro: [
                    makeCategoryEntry('Panadería'),
                    makeCategoryEntry('Ferretería'),
                ],
            });
            expect(result.category).toBe('Panadería,Ferretería');
        });
    });

    describe('item-groups view mode', () => {
        it('sets itemGroup for regular category', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Fresh Food',
                treemapViewMode: 'item-groups',
            });
            expect(result.itemGroup).toBe('Fresh Food');
            expect(result.drillDownPath).toEqual({ itemGroup: 'Fresh Food' });
        });

        it('expands "Más" to constituent item categories', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'More',
                treemapViewMode: 'item-groups',
                itemGroupsOtro: [makeCategoryEntry('Fresh Food')],
            });
            expect(result.itemCategory).toBe('Carnes,Lácteos,Verduras');
        });
    });

    describe('item-categories view mode', () => {
        it('sets itemCategory for regular category', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Carnes',
                treemapViewMode: 'item-categories',
            });
            expect(result.itemCategory).toBe('Carnes');
            expect(result.drillDownPath).toEqual({ itemCategory: 'Carnes' });
        });

        it('joins "Más" item categories with comma', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Más',
                treemapViewMode: 'item-categories',
                itemCategoriesOtro: [
                    makeCategoryEntry('Bebidas'),
                    makeCategoryEntry('Snacks'),
                ],
            });
            expect(result.itemCategory).toBe('Bebidas,Snacks');
        });
    });

    describe('temporal filter', () => {
        it('includes month-level temporal filter', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Supermercado',
                treemapViewMode: 'store-categories',
            });
            expect(result.temporal).toEqual({
                level: 'month',
                year: '2026',
                month: '2026-02',
            });
        });
    });

    describe('countMode toggle', () => {
        it('targets history view for transactions mode', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Supermercado',
                treemapViewMode: 'store-categories',
                countMode: 'transactions',
            });
            expect(result.targetView).toBe('history');
        });

        it('targets items view for items mode', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Supermercado',
                treemapViewMode: 'store-categories',
                countMode: 'items',
            });
            expect(result.targetView).toBe('items');
        });
    });

    describe('sourceDistributionView', () => {
        it('always sets sourceDistributionView to treemap', () => {
            const result = buildTreemapCellNavigationPayload({
                ...baseParams,
                categoryName: 'Supermercado',
                treemapViewMode: 'store-categories',
            });
            expect(result.sourceDistributionView).toBe('treemap');
        });
    });
});
