/**
 * useCategoriesState Hook Tests
 *
 * Story 14e-17: Categories Feature Extraction
 *
 * Tests for the unified categories state hook covering:
 * - Data passthrough from underlying hooks
 * - Combined loading state
 * - Error passthrough
 * - Operation passthrough (save, delete, update, find)
 * - Memoization stability
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { User } from 'firebase/auth';
import { useCategoriesState } from '@features/categories/state/useCategoriesState';
import { CategoryMapping, MatchResult } from '@/types/categoryMapping';
import { SubcategoryMapping, SubcategoryMatchResult } from '@/types/subcategoryMapping';
import { StoreCategory } from '@/types/transaction';
import { createMockTimestamp } from '../../../../helpers';

// =============================================================================
// Mocks
// =============================================================================

// Mock useCategoryMappings
const mockCategoryHook = {
    mappings: [] as CategoryMapping[],
    loading: false,
    error: null as Error | null,
    saveMapping: vi.fn(),
    deleteMapping: vi.fn(),
    updateMapping: vi.fn(),
    findMatch: vi.fn(),
};

vi.mock('@/hooks/useCategoryMappings', () => ({
    useCategoryMappings: () => mockCategoryHook,
}));

// Mock useSubcategoryMappings
const mockSubcategoryHook = {
    mappings: [] as SubcategoryMapping[],
    loading: false,
    error: null as Error | null,
    saveMapping: vi.fn(),
    deleteMapping: vi.fn(),
    updateMappingTarget: vi.fn(),
    findMatch: vi.fn(),
};

vi.mock('@/hooks/useSubcategoryMappings', () => ({
    useSubcategoryMappings: () => mockSubcategoryHook,
}));

// =============================================================================
// Test Helpers
// =============================================================================

const mockUser = { uid: 'test-user-123' } as User;
const mockServices = { db: {}, appId: 'test-app' } as any;

function createMockCategoryMapping(overrides: Partial<CategoryMapping> = {}): CategoryMapping {
    return {
        id: 'cat-mapping-1',
        originalItem: 'UBER EATS',
        normalizedItem: 'uber eats',
        targetCategory: 'Food & Drink' as StoreCategory,
        confidence: 1.0,
        source: 'user',
        createdAt: createMockTimestamp(),
        updatedAt: createMockTimestamp(),
        usageCount: 5,
        ...overrides,
    };
}

function createMockSubcategoryMapping(overrides: Partial<SubcategoryMapping> = {}): SubcategoryMapping {
    return {
        id: 'subcat-mapping-1',
        originalItem: 'LECHE ENTERA',
        normalizedItem: 'leche entera',
        targetSubcategory: 'Dairy',
        confidence: 1.0,
        source: 'user',
        createdAt: createMockTimestamp(),
        updatedAt: createMockTimestamp(),
        usageCount: 3,
        ...overrides,
    };
}

function resetMocks() {
    mockCategoryHook.mappings = [];
    mockCategoryHook.loading = false;
    mockCategoryHook.error = null;
    mockCategoryHook.saveMapping.mockReset();
    mockCategoryHook.deleteMapping.mockReset();
    mockCategoryHook.updateMapping.mockReset();
    mockCategoryHook.findMatch.mockReset();

    mockSubcategoryHook.mappings = [];
    mockSubcategoryHook.loading = false;
    mockSubcategoryHook.error = null;
    mockSubcategoryHook.saveMapping.mockReset();
    mockSubcategoryHook.deleteMapping.mockReset();
    mockSubcategoryHook.updateMappingTarget.mockReset();
    mockSubcategoryHook.findMatch.mockReset();
}

// =============================================================================
// Tests
// =============================================================================

describe('useCategoriesState', () => {
    beforeEach(() => {
        resetMocks();
    });

    // -------------------------------------------------------------------------
    // Data Passthrough
    // -------------------------------------------------------------------------

    describe('data passthrough', () => {
        it('should return empty arrays when no mappings exist', () => {
            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.categoryMappings).toEqual([]);
            expect(result.current.subcategoryMappings).toEqual([]);
        });

        it('should pass through category mappings from underlying hook', () => {
            const mockMappings = [
                createMockCategoryMapping({ id: 'cat-1' }),
                createMockCategoryMapping({ id: 'cat-2', originalItem: 'DOORDASH' }),
            ];
            mockCategoryHook.mappings = mockMappings;

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.categoryMappings).toBe(mockMappings);
            expect(result.current.categoryMappings).toHaveLength(2);
        });

        it('should pass through subcategory mappings from underlying hook', () => {
            const mockMappings = [
                createMockSubcategoryMapping({ id: 'subcat-1' }),
                createMockSubcategoryMapping({ id: 'subcat-2', originalItem: 'QUESO' }),
            ];
            mockSubcategoryHook.mappings = mockMappings;

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.subcategoryMappings).toBe(mockMappings);
            expect(result.current.subcategoryMappings).toHaveLength(2);
        });
    });

    // -------------------------------------------------------------------------
    // Loading State
    // -------------------------------------------------------------------------

    describe('loading state', () => {
        it('should return isLoading=false when both hooks are not loading', () => {
            mockCategoryHook.loading = false;
            mockSubcategoryHook.loading = false;

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.isLoading).toBe(false);
            expect(result.current.categoryLoading).toBe(false);
            expect(result.current.subcategoryLoading).toBe(false);
        });

        it('should return isLoading=true when category hook is loading', () => {
            mockCategoryHook.loading = true;
            mockSubcategoryHook.loading = false;

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.isLoading).toBe(true);
            expect(result.current.categoryLoading).toBe(true);
            expect(result.current.subcategoryLoading).toBe(false);
        });

        it('should return isLoading=true when subcategory hook is loading', () => {
            mockCategoryHook.loading = false;
            mockSubcategoryHook.loading = true;

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.isLoading).toBe(true);
            expect(result.current.categoryLoading).toBe(false);
            expect(result.current.subcategoryLoading).toBe(true);
        });

        it('should return isLoading=true when both hooks are loading', () => {
            mockCategoryHook.loading = true;
            mockSubcategoryHook.loading = true;

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.isLoading).toBe(true);
            expect(result.current.categoryLoading).toBe(true);
            expect(result.current.subcategoryLoading).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // Error State
    // -------------------------------------------------------------------------

    describe('error state', () => {
        it('should return null errors when no errors exist', () => {
            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.categoryError).toBeNull();
            expect(result.current.subcategoryError).toBeNull();
        });

        it('should pass through category error', () => {
            const error = new Error('Category fetch failed');
            mockCategoryHook.error = error;

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.categoryError).toBe(error);
            expect(result.current.subcategoryError).toBeNull();
        });

        it('should pass through subcategory error', () => {
            const error = new Error('Subcategory fetch failed');
            mockSubcategoryHook.error = error;

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.categoryError).toBeNull();
            expect(result.current.subcategoryError).toBe(error);
        });
    });

    // -------------------------------------------------------------------------
    // Category Operations
    // -------------------------------------------------------------------------

    describe('category operations', () => {
        it('should pass through saveCategoryMapping to underlying hook', async () => {
            mockCategoryHook.saveMapping.mockResolvedValue('new-mapping-id');

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            await act(async () => {
                const id = await result.current.saveCategoryMapping('UBER EATS', 'Food & Drink' as StoreCategory);
                expect(id).toBe('new-mapping-id');
            });

            expect(mockCategoryHook.saveMapping).toHaveBeenCalledWith('UBER EATS', 'Food & Drink');
        });

        it('should pass through saveCategoryMapping with source parameter', async () => {
            mockCategoryHook.saveMapping.mockResolvedValue('ai-mapping-id');

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            await act(async () => {
                await result.current.saveCategoryMapping('CHIPOTLE', 'Food & Drink' as StoreCategory, 'ai');
            });

            expect(mockCategoryHook.saveMapping).toHaveBeenCalledWith('CHIPOTLE', 'Food & Drink', 'ai');
        });

        it('should pass through deleteCategoryMapping to underlying hook', async () => {
            mockCategoryHook.deleteMapping.mockResolvedValue(undefined);

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            await act(async () => {
                await result.current.deleteCategoryMapping('cat-mapping-1');
            });

            expect(mockCategoryHook.deleteMapping).toHaveBeenCalledWith('cat-mapping-1');
        });

        it('should pass through updateCategoryMapping to underlying hook', async () => {
            mockCategoryHook.updateMapping.mockResolvedValue(undefined);

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            await act(async () => {
                await result.current.updateCategoryMapping('cat-mapping-1', 'Transportation' as StoreCategory);
            });

            expect(mockCategoryHook.updateMapping).toHaveBeenCalledWith('cat-mapping-1', 'Transportation');
        });

        it('should pass through findCategoryMatch to underlying hook', () => {
            const mockResult: MatchResult = {
                mapping: createMockCategoryMapping(),
                score: 0,
                confidence: 1.0,
            };
            mockCategoryHook.findMatch.mockReturnValue(mockResult);

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));
            const match = result.current.findCategoryMatch('UBER EATS', 'Uber');

            expect(mockCategoryHook.findMatch).toHaveBeenCalledWith('UBER EATS', 'Uber');
            expect(match).toBe(mockResult);
        });

        it('should return null when no category match found', () => {
            mockCategoryHook.findMatch.mockReturnValue(null);

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));
            const match = result.current.findCategoryMatch('UNKNOWN ITEM');

            expect(match).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // Subcategory Operations
    // -------------------------------------------------------------------------

    describe('subcategory operations', () => {
        it('should pass through saveSubcategoryMapping to underlying hook', async () => {
            mockSubcategoryHook.saveMapping.mockResolvedValue('new-subcat-id');

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            await act(async () => {
                const id = await result.current.saveSubcategoryMapping('LECHE ENTERA', 'Dairy');
                expect(id).toBe('new-subcat-id');
            });

            expect(mockSubcategoryHook.saveMapping).toHaveBeenCalledWith('LECHE ENTERA', 'Dairy');
        });

        it('should pass through saveSubcategoryMapping with source parameter', async () => {
            mockSubcategoryHook.saveMapping.mockResolvedValue('ai-subcat-id');

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            await act(async () => {
                await result.current.saveSubcategoryMapping('QUESO', 'Dairy', 'ai');
            });

            expect(mockSubcategoryHook.saveMapping).toHaveBeenCalledWith('QUESO', 'Dairy', 'ai');
        });

        it('should pass through deleteSubcategoryMapping to underlying hook', async () => {
            mockSubcategoryHook.deleteMapping.mockResolvedValue(undefined);

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            await act(async () => {
                await result.current.deleteSubcategoryMapping('subcat-mapping-1');
            });

            expect(mockSubcategoryHook.deleteMapping).toHaveBeenCalledWith('subcat-mapping-1');
        });

        it('should pass through updateSubcategoryMapping to underlying hook', async () => {
            mockSubcategoryHook.updateMappingTarget.mockResolvedValue(undefined);

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            await act(async () => {
                await result.current.updateSubcategoryMapping('subcat-mapping-1', 'Cheese');
            });

            expect(mockSubcategoryHook.updateMappingTarget).toHaveBeenCalledWith('subcat-mapping-1', 'Cheese');
        });

        it('should pass through findSubcategoryMatch to underlying hook', () => {
            const mockResult: SubcategoryMatchResult = {
                mapping: createMockSubcategoryMapping(),
                score: 0,
                confidence: 1.0,
            };
            mockSubcategoryHook.findMatch.mockReturnValue(mockResult);

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));
            const match = result.current.findSubcategoryMatch('LECHE ENTERA');

            expect(mockSubcategoryHook.findMatch).toHaveBeenCalledWith('LECHE ENTERA');
            expect(match).toBe(mockResult);
        });

        it('should return null when no subcategory match found', () => {
            mockSubcategoryHook.findMatch.mockReturnValue(null);

            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));
            const match = result.current.findSubcategoryMatch('UNKNOWN ITEM');

            expect(match).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // Raw Hook Access
    // -------------------------------------------------------------------------

    describe('raw hook access', () => {
        it('should expose categoryHook for backward compatibility', () => {
            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.categoryHook).toBe(mockCategoryHook);
            expect(result.current.categoryHook.saveMapping).toBe(mockCategoryHook.saveMapping);
        });

        it('should expose subcategoryHook for backward compatibility', () => {
            const { result } = renderHook(() => useCategoriesState(mockUser, mockServices));

            expect(result.current.subcategoryHook).toBe(mockSubcategoryHook);
            expect(result.current.subcategoryHook.saveMapping).toBe(mockSubcategoryHook.saveMapping);
        });
    });

    // -------------------------------------------------------------------------
    // Edge Cases
    // -------------------------------------------------------------------------

    describe('edge cases', () => {
        it('should work with null user', () => {
            const { result } = renderHook(() => useCategoriesState(null, mockServices));

            // Hook should still return valid structure
            expect(result.current.categoryMappings).toEqual([]);
            expect(result.current.subcategoryMappings).toEqual([]);
            expect(result.current.isLoading).toBe(false);
        });

        it('should work with null services', () => {
            const { result } = renderHook(() => useCategoriesState(mockUser, null));

            // Hook should still return valid structure
            expect(result.current.categoryMappings).toEqual([]);
            expect(result.current.subcategoryMappings).toEqual([]);
            expect(result.current.isLoading).toBe(false);
        });

        it('should work with both null user and services', () => {
            const { result } = renderHook(() => useCategoriesState(null, null));

            // Hook should still return valid structure
            expect(result.current.categoryMappings).toEqual([]);
            expect(result.current.subcategoryMappings).toEqual([]);
            expect(result.current.isLoading).toBe(false);
        });
    });
});
