/**
 * CategoriesFeature Orchestrator Tests
 *
 * Story 14e-17: Categories Feature Extraction
 *
 * Tests for the CategoriesFeature context provider component covering:
 * - Context provision to children
 * - useCategoriesContext hook usage
 * - useCategoriesContextOptional hook usage
 * - Error handling when used outside provider
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { User } from 'firebase/auth';
import {
    CategoriesFeature,
    useCategoriesContext,
    useCategoriesContextOptional,
} from '@features/categories/CategoriesFeature';

// =============================================================================
// Mocks
// =============================================================================

// Mock useCategoriesState
const mockCategoriesState = {
    categoryMappings: [],
    subcategoryMappings: [],
    isLoading: false,
    categoryLoading: false,
    subcategoryLoading: false,
    categoryError: null,
    subcategoryError: null,
    saveCategoryMapping: vi.fn(),
    deleteCategoryMapping: vi.fn(),
    updateCategoryMapping: vi.fn(),
    findCategoryMatch: vi.fn(),
    saveSubcategoryMapping: vi.fn(),
    deleteSubcategoryMapping: vi.fn(),
    updateSubcategoryMapping: vi.fn(),
    findSubcategoryMatch: vi.fn(),
    categoryHook: {} as any,
    subcategoryHook: {} as any,
};

vi.mock('@features/categories/state', () => ({
    useCategoriesState: () => mockCategoriesState,
}));

// =============================================================================
// Test Helpers
// =============================================================================

const mockUser = { uid: 'test-user-123' } as User;
const mockServices = { db: {}, appId: 'test-app' } as any;

function resetMocks() {
    mockCategoriesState.categoryMappings = [];
    mockCategoriesState.subcategoryMappings = [];
    mockCategoriesState.isLoading = false;
    mockCategoriesState.categoryLoading = false;
    mockCategoriesState.subcategoryLoading = false;
    mockCategoriesState.categoryError = null;
    mockCategoriesState.subcategoryError = null;
    mockCategoriesState.saveCategoryMapping.mockReset();
    mockCategoriesState.deleteCategoryMapping.mockReset();
    mockCategoriesState.updateCategoryMapping.mockReset();
    mockCategoriesState.findCategoryMatch.mockReset();
    mockCategoriesState.saveSubcategoryMapping.mockReset();
    mockCategoriesState.deleteSubcategoryMapping.mockReset();
    mockCategoriesState.updateSubcategoryMapping.mockReset();
    mockCategoriesState.findSubcategoryMatch.mockReset();
}

// Test component that consumes the context
function TestConsumer() {
    const { categoryMappings, isLoading } = useCategoriesContext();
    return (
        <div data-testid="test-consumer">
            <span data-testid="mappings-count">{categoryMappings.length}</span>
            <span data-testid="loading-state">{isLoading ? 'loading' : 'loaded'}</span>
        </div>
    );
}

// Test component that uses optional hook
function TestOptionalConsumer() {
    const context = useCategoriesContextOptional();
    return (
        <div data-testid="test-optional-consumer">
            {context ? (
                <span data-testid="has-context">true</span>
            ) : (
                <span data-testid="no-context">false</span>
            )}
        </div>
    );
}

// =============================================================================
// Tests
// =============================================================================

describe('CategoriesFeature', () => {
    beforeEach(() => {
        resetMocks();
    });

    // -------------------------------------------------------------------------
    // Basic Rendering
    // -------------------------------------------------------------------------

    describe('basic rendering', () => {
        it('should render children', () => {
            render(
                <CategoriesFeature user={mockUser} services={mockServices}>
                    <div data-testid="child">Child content</div>
                </CategoriesFeature>
            );

            expect(screen.getByTestId('child')).toBeInTheDocument();
            expect(screen.getByText('Child content')).toBeInTheDocument();
        });

        it('should render multiple children', () => {
            render(
                <CategoriesFeature user={mockUser} services={mockServices}>
                    <div data-testid="child-1">First</div>
                    <div data-testid="child-2">Second</div>
                </CategoriesFeature>
            );

            expect(screen.getByTestId('child-1')).toBeInTheDocument();
            expect(screen.getByTestId('child-2')).toBeInTheDocument();
        });

        it('should render with null user', () => {
            render(
                <CategoriesFeature user={null} services={mockServices}>
                    <div data-testid="child">Child content</div>
                </CategoriesFeature>
            );

            expect(screen.getByTestId('child')).toBeInTheDocument();
        });

        it('should render with null services', () => {
            render(
                <CategoriesFeature user={mockUser} services={null}>
                    <div data-testid="child">Child content</div>
                </CategoriesFeature>
            );

            expect(screen.getByTestId('child')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------------------------
    // Context Provision
    // -------------------------------------------------------------------------

    describe('context provision', () => {
        it('should provide categories state to child components', () => {
            render(
                <CategoriesFeature user={mockUser} services={mockServices}>
                    <TestConsumer />
                </CategoriesFeature>
            );

            expect(screen.getByTestId('test-consumer')).toBeInTheDocument();
            expect(screen.getByTestId('mappings-count')).toHaveTextContent('0');
            expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
        });

        it('should provide loading state when hook is loading', () => {
            mockCategoriesState.isLoading = true;

            render(
                <CategoriesFeature user={mockUser} services={mockServices}>
                    <TestConsumer />
                </CategoriesFeature>
            );

            expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
        });

        it('should provide mappings array to consumers', () => {
            mockCategoriesState.categoryMappings = [
                { id: 'cat-1' } as any,
                { id: 'cat-2' } as any,
            ];

            render(
                <CategoriesFeature user={mockUser} services={mockServices}>
                    <TestConsumer />
                </CategoriesFeature>
            );

            expect(screen.getByTestId('mappings-count')).toHaveTextContent('2');
        });
    });

    // -------------------------------------------------------------------------
    // useCategoriesContext Hook
    // -------------------------------------------------------------------------

    describe('useCategoriesContext', () => {
        it('should return context when inside provider', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <CategoriesFeature user={mockUser} services={mockServices}>
                    {children}
                </CategoriesFeature>
            );

            const { result } = renderHook(() => useCategoriesContext(), { wrapper });

            expect(result.current).toBe(mockCategoriesState);
            expect(result.current.categoryMappings).toEqual([]);
            expect(result.current.saveCategoryMapping).toBeDefined();
        });

        it('should throw error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useCategoriesContext());
            }).toThrow('useCategoriesContext must be used within a CategoriesFeature provider');

            consoleSpy.mockRestore();
        });

        it('should provide all category operations', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <CategoriesFeature user={mockUser} services={mockServices}>
                    {children}
                </CategoriesFeature>
            );

            const { result } = renderHook(() => useCategoriesContext(), { wrapper });

            // Category operations
            expect(result.current.saveCategoryMapping).toBeDefined();
            expect(result.current.deleteCategoryMapping).toBeDefined();
            expect(result.current.updateCategoryMapping).toBeDefined();
            expect(result.current.findCategoryMatch).toBeDefined();

            // Subcategory operations
            expect(result.current.saveSubcategoryMapping).toBeDefined();
            expect(result.current.deleteSubcategoryMapping).toBeDefined();
            expect(result.current.updateSubcategoryMapping).toBeDefined();
            expect(result.current.findSubcategoryMatch).toBeDefined();
        });
    });

    // -------------------------------------------------------------------------
    // useCategoriesContextOptional Hook
    // -------------------------------------------------------------------------

    describe('useCategoriesContextOptional', () => {
        it('should return context when inside provider', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <CategoriesFeature user={mockUser} services={mockServices}>
                    {children}
                </CategoriesFeature>
            );

            const { result } = renderHook(() => useCategoriesContextOptional(), { wrapper });

            expect(result.current).toBe(mockCategoriesState);
        });

        it('should return undefined when outside provider', () => {
            const { result } = renderHook(() => useCategoriesContextOptional());

            expect(result.current).toBeUndefined();
        });

        it('should not throw when used outside provider', () => {
            render(<TestOptionalConsumer />);

            expect(screen.getByTestId('no-context')).toHaveTextContent('false');
        });

        it('should render correctly when inside provider', () => {
            render(
                <CategoriesFeature user={mockUser} services={mockServices}>
                    <TestOptionalConsumer />
                </CategoriesFeature>
            );

            expect(screen.getByTestId('has-context')).toHaveTextContent('true');
        });
    });

    // -------------------------------------------------------------------------
    // Nested Providers
    // -------------------------------------------------------------------------

    describe('nested providers', () => {
        it('should use nearest provider context', () => {
            // Inner mock state with different values
            const innerMockState = {
                ...mockCategoriesState,
                categoryMappings: [{ id: 'inner-cat' } as any],
            };

            // Temporarily change mock for inner render
            const originalMappings = mockCategoriesState.categoryMappings;
            mockCategoriesState.categoryMappings = innerMockState.categoryMappings;

            render(
                <CategoriesFeature user={mockUser} services={mockServices}>
                    <TestConsumer />
                </CategoriesFeature>
            );

            expect(screen.getByTestId('mappings-count')).toHaveTextContent('1');

            // Restore
            mockCategoriesState.categoryMappings = originalMappings;
        });
    });
});
