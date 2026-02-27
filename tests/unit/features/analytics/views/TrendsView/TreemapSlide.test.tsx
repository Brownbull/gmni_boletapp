/**
 * TreemapSlide - Unit tests
 *
 * Story 15b-2m: Extracted treemap slide component from TrendsView.tsx
 * Props-only component — no store/context access. Pure render + callback tests.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreemapSlide, type TreemapSlideProps } from '@features/analytics/views/TrendsView/TreemapSlide';

// Mock dependencies
vi.mock('lucide-react', () => ({
    ChevronLeft: ({ size }: { size: number }) => <span data-testid="chevron-left">{size}</span>,
}));

vi.mock('@/utils/treemapLayout', () => ({
    categoryDataToTreemapItems: (data: unknown[]) => data,
    calculateTreemapLayout: (items: unknown[]) =>
        (items as Array<{ name: string }>).map((item, i) => ({
            x: i * 25,
            y: 0,
            width: 25,
            height: 50,
            originalItem: item,
        })),
}));

vi.mock('@/utils/categoryTranslations', () => ({
    translateCategory: (name: string, _locale: string) => `translated-${name}`,
}));

vi.mock('@features/analytics/views/TrendsView/AnimatedTreemapCell', () => ({
    AnimatedTreemapCell: ({ data, onClick, onIconClick }: {
        data: { name: string };
        onClick: () => void;
        onIconClick: (name: string, emoji: string, color: string) => void;
    }) => (
        <div data-testid={`treemap-cell-${data.name}`} onClick={onClick}>
            <button data-testid={`icon-${data.name}`} onClick={() => onIconClick(data.name, '', '')}>icon</button>
            {data.name}
        </div>
    ),
}));

vi.mock('@features/analytics/views/TrendsView/ExpandCollapseButtons', () => ({
    ExpandCollapseButtons: ({ canExpand, onExpand, onCollapse }: {
        canExpand: boolean;
        onExpand: () => void;
        onCollapse: () => void;
    }) => (
        <div data-testid="expand-collapse">
            {canExpand && <button data-testid="expand-btn" onClick={onExpand}>Expand</button>}
            <button data-testid="collapse-btn" onClick={onCollapse}>Collapse</button>
        </div>
    ),
}));

vi.mock('@features/analytics/views/TrendsView/navigationHelpers', () => ({
    getDonutViewModeAtDrillLevel: (mode: string, _level: number) => mode,
}));

const baseCategoryData = [
    { name: 'Food', value: 100, count: 5, itemCount: 10, color: '#ff0000', fgColor: '#fff', percent: 50 },
    { name: 'Transport', value: 100, count: 3, itemCount: 6, color: '#00ff00', fgColor: '#000', percent: 50 },
];

function makeProps(overrides: Partial<TreemapSlideProps> = {}): TreemapSlideProps {
    return {
        isDark: false,
        locale: 'es',
        donutViewMode: 'item-categories',
        treemapDrillDownLevel: 0,
        treemapDrillDownPath: [],
        treemapDrillDownCategorized: {
            displayCategories: [],
            otroCategories: [],
            canExpand: false,
            canCollapse: false,
        },
        categoryData: baseCategoryData,
        canExpand: false,
        canCollapse: false,
        otroCategories: [],
        expandedCategoryCount: 0,
        treemapDrillDownExpandedCount: 0,
        setTreemapDrillDownExpandedCount: vi.fn(),
        setExpandedCategoryCount: vi.fn(),
        handleTreemapBack: vi.fn(),
        handleTreemapCellDrillDown: vi.fn(),
        handleTreemapTransactionCountClick: vi.fn(),
        handleOpenStatsPopup: vi.fn(),
        currency: 'CLP',
        t: (key: string) => key,
        countMode: 'transactions',
        animationKey: 0,
        ...overrides,
    };
}

describe('TreemapSlide', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders treemap grid with cells', () => {
        render(<TreemapSlide {...makeProps()} />);
        expect(screen.getByTestId('treemap-grid')).toBeInTheDocument();
        expect(screen.getByTestId('treemap-cell-Food')).toBeInTheDocument();
        expect(screen.getByTestId('treemap-cell-Transport')).toBeInTheDocument();
    });

    it('shows Spanish base title at drill-down level 0', () => {
        render(<TreemapSlide {...makeProps({ locale: 'es', donutViewMode: 'item-categories' })} />);
        expect(screen.getByTestId('treemap-viewmode-title')).toHaveTextContent('Categorías de Productos');
    });

    it('shows English base title at drill-down level 0', () => {
        render(<TreemapSlide {...makeProps({ locale: 'en', donutViewMode: 'store-groups' })} />);
        expect(screen.getByTestId('treemap-viewmode-title')).toHaveTextContent('Purchase Groups');
    });

    it('shows translated drill-down path when drilled in', () => {
        render(<TreemapSlide {...makeProps({
            treemapDrillDownLevel: 1,
            treemapDrillDownPath: ['Food'],
            treemapDrillDownCategorized: {
                displayCategories: baseCategoryData,
                otroCategories: [],
                canExpand: false,
                canCollapse: false,
            },
        })} />);
        expect(screen.getByTestId('treemap-viewmode-title')).toHaveTextContent('translated-Food');
    });

    it('shows back button only when drilled down', () => {
        const { rerender } = render(<TreemapSlide {...makeProps({ treemapDrillDownLevel: 0 })} />);
        expect(screen.queryByTestId('treemap-back-btn')).not.toBeInTheDocument();

        rerender(<TreemapSlide {...makeProps({
            treemapDrillDownLevel: 1,
            treemapDrillDownPath: ['Food'],
            treemapDrillDownCategorized: {
                displayCategories: baseCategoryData,
                otroCategories: [],
                canExpand: false,
                canCollapse: false,
            },
        })} />);
        expect(screen.getByTestId('treemap-back-btn')).toBeInTheDocument();
    });

    it('calls handleTreemapBack when back button clicked', () => {
        const handleTreemapBack = vi.fn();
        render(<TreemapSlide {...makeProps({
            treemapDrillDownLevel: 1,
            treemapDrillDownPath: ['Food'],
            treemapDrillDownCategorized: {
                displayCategories: baseCategoryData,
                otroCategories: [],
                canExpand: false,
                canCollapse: false,
            },
            handleTreemapBack,
        })} />);
        fireEvent.click(screen.getByTestId('treemap-back-btn'));
        expect(handleTreemapBack).toHaveBeenCalledTimes(1);
    });

    it('calls handleTreemapCellDrillDown when cell clicked', () => {
        const handleTreemapCellDrillDown = vi.fn();
        render(<TreemapSlide {...makeProps({ handleTreemapCellDrillDown })} />);
        fireEvent.click(screen.getByTestId('treemap-cell-Food'));
        expect(handleTreemapCellDrillDown).toHaveBeenCalledWith('Food');
    });

    it('renders expand/collapse buttons', () => {
        render(<TreemapSlide {...makeProps({ canExpand: true })} />);
        expect(screen.getByTestId('expand-collapse')).toBeInTheDocument();
    });
});
