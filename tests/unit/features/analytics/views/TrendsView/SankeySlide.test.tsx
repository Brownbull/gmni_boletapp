/**
 * SankeySlide - Unit tests
 *
 * Story 15b-2m: Extracted sankey slide component from TrendsView.tsx
 * Props-only component — no store/context access. Pure render + callback tests.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SankeySlide, type SankeySlideProps } from '@features/analytics/views/TrendsView/SankeySlide';
import type { SankeySelectionData } from '@features/analytics/components/SankeyChart';

// Mock SankeyChart (heavy ECharts component)
vi.mock('@features/analytics/components/SankeyChart', () => ({
    SankeyChart: ({ mode, selectedNode, locale }: { mode: string; selectedNode: string | null; locale: string }) => (
        <div data-testid="sankey-chart" data-mode={mode} data-selected={selectedNode} data-locale={locale}>
            SankeyChart
        </div>
    ),
}));

const mockSelectionData: SankeySelectionData = {
    nodeName: 'Food',
    displayName: 'Alimentos',
    emoji: '🍔',
    color: '#ff6b6b',
    amountK: '$150K',
    percent: '45%',
    isLink: false,
};

const mockLinkSelectionData: SankeySelectionData = {
    nodeName: 'Food->Drinks',
    displayName: 'Food to Drinks',
    emoji: '🍔',
    color: '#ff6b6b',
    amountK: '$50K',
    percent: '15%',
    isLink: true,
    sourceEmoji: '🍔',
    sourceName: 'Food',
    targetEmoji: '🥤',
    targetName: 'Drinks',
};

function makeProps(overrides: Partial<SankeySlideProps> = {}): SankeySlideProps {
    return {
        sankeySelectionData: null,
        locale: 'es',
        sankeyAnimationKey: 0,
        sankeyContentWidth: 500,
        sankeyVisible: true,
        sankeyScrollableRef: { current: null },
        prefersReducedMotion: false,
        filteredTransactions: [],
        currency: 'CLP',
        sankeyMode: '3-level-groups',
        theme: 'normal',
        colorMode: 'light',
        sankeySelectedNode: null,
        handleSankeySelectionChange: vi.fn(),
        ...overrides,
    };
}

describe('SankeySlide', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders sankey view container', () => {
        render(<SankeySlide {...makeProps()} />);
        expect(screen.getByTestId('sankey-view')).toBeInTheDocument();
    });

    it('renders SankeyChart with correct props', () => {
        render(<SankeySlide {...makeProps({ sankeyMode: '3-level-groups' })} />);
        const chart = screen.getByTestId('sankey-chart');
        expect(chart).toHaveAttribute('data-mode', '3-level-groups');
    });

    it('shows placeholder text when no selection (Spanish)', () => {
        render(<SankeySlide {...makeProps({ locale: 'es', sankeySelectionData: null })} />);
        expect(screen.getByText('Toca una categoría para ver detalles')).toBeInTheDocument();
    });

    it('shows placeholder text when no selection (English)', () => {
        render(<SankeySlide {...makeProps({ locale: 'en', sankeySelectionData: null })} />);
        expect(screen.getByText('Tap a category to see details')).toBeInTheDocument();
    });

    it('shows node selection data with emoji and name', () => {
        render(<SankeySlide {...makeProps({ sankeySelectionData: mockSelectionData })} />);
        expect(screen.getByText('🍔')).toBeInTheDocument();
        expect(screen.getByText('Alimentos')).toBeInTheDocument();
        expect(screen.getByText('$150K (45%)')).toBeInTheDocument();
    });

    it('shows link selection data with source > target', () => {
        render(<SankeySlide {...makeProps({ sankeySelectionData: mockLinkSelectionData })} />);
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText('Drinks')).toBeInTheDocument();
        expect(screen.getByText('$50K (15%)')).toBeInTheDocument();
    });

    it('renders title area with fixed height', () => {
        render(<SankeySlide {...makeProps()} />);
        const titleArea = screen.getByTestId('sankey-title-area');
        expect(titleArea).toHaveStyle({ height: '60px' });
    });

    it('applies reduced motion when prefersReducedMotion is true', () => {
        render(<SankeySlide {...makeProps({ prefersReducedMotion: true })} />);
        const animContainer = screen.getByTestId('sankey-animation-container');
        expect(animContainer).toHaveStyle({ transition: 'none' });
    });

    it('falls back to es locale for invalid locale values', () => {
        render(<SankeySlide {...makeProps({ locale: 'fr', sankeySelectionData: null })} />);
        // Invalid locale should fall back to 'es', showing Spanish hint text
        expect(screen.getByText('Toca una categoría para ver detalles')).toBeInTheDocument();
    });

    it('passes safe locale to SankeyChart for invalid locale', () => {
        render(<SankeySlide {...makeProps({ locale: 'xyz' })} />);
        expect(screen.getByTestId('sankey-chart')).toHaveAttribute('data-locale', 'es');
    });

    describe('CSS color validation', () => {
        it('renders selection with valid hex color', () => {
            render(<SankeySlide {...makeProps({ sankeySelectionData: mockSelectionData })} />);
            const amountText = screen.getByText('$150K (45%)');
            // Valid hex color should be applied
            expect(amountText).toHaveStyle({ color: '#ff6b6b' });
        });

        it('falls back to default color for invalid color value', () => {
            const badColorData: SankeySelectionData = {
                ...mockSelectionData,
                color: 'javascript:alert(1)',
            };
            render(<SankeySlide {...makeProps({ sankeySelectionData: badColorData })} />);
            const amountText = screen.getByText('$150K (45%)');
            // Invalid color should fall back to default
            expect(amountText).toHaveStyle({ color: '#10b981' });
        });
    });
});
