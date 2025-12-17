/**
 * useLearningPhases Hook Tests
 *
 * Story 10.0: Foundation Sprint - Unit tests for learning phases hook
 * @see docs/sprint-artifacts/epic10/story-10.0-foundation-sprint.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useLearningPhases,
  shouldShowLearningPrompt,
  type LearningPhasesConfig,
  type ItemState,
} from '../../../src/hooks/useLearningPhases';

// ============================================================================
// Test Helpers
// ============================================================================

function createConfig(overrides: Partial<LearningPhasesConfig> = {}): LearningPhasesConfig {
  return {
    transactionKey: 'tx-123',
    merchant: 'Test Store',
    alias: '',
    items: [
      { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
      { name: 'Milk', category: 'Dairy', subcategory: 'Milk' },
    ],
    onSave: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createItems(overrides: Partial<ItemState>[] = []): ItemState[] {
  const base = [
    { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
    { name: 'Milk', category: 'Dairy', subcategory: 'Milk' },
  ];
  return base.map((item, i) => ({ ...item, ...overrides[i] }));
}

// ============================================================================
// useLearningPhases Tests
// ============================================================================

describe('useLearningPhases', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnSaveCategoryMapping: ReturnType<typeof vi.fn>;
  let mockOnSaveSubcategoryMapping: ReturnType<typeof vi.fn>;
  let mockOnSaveMerchantMapping: ReturnType<typeof vi.fn>;
  let mockOnShowToast: ReturnType<typeof vi.fn>;
  let mockOnCelebrate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSave = vi.fn().mockResolvedValue(undefined);
    mockOnSaveCategoryMapping = vi.fn().mockResolvedValue(undefined);
    mockOnSaveSubcategoryMapping = vi.fn().mockResolvedValue(undefined);
    mockOnSaveMerchantMapping = vi.fn().mockResolvedValue(undefined);
    mockOnShowToast = vi.fn();
    mockOnCelebrate = vi.fn();
  });

  describe('initial state', () => {
    it('should initialize with all prompts hidden', () => {
      const { result } = renderHook(() =>
        useLearningPhases(createConfig())
      );

      expect(result.current.state.showCategoryPrompt).toBe(false);
      expect(result.current.state.showSubcategoryPrompt).toBe(false);
      expect(result.current.state.showMerchantPrompt).toBe(false);
      expect(result.current.state.isSaving).toBe(false);
    });

    it('should initialize with empty change arrays', () => {
      const { result } = renderHook(() =>
        useLearningPhases(createConfig())
      );

      expect(result.current.state.categoryChanges).toEqual([]);
      expect(result.current.state.subcategoryChanges).toEqual([]);
    });
  });

  describe('hasLearningOpportunities', () => {
    it('should return false when no mapping callbacks provided', () => {
      const { result } = renderHook(() =>
        useLearningPhases(createConfig())
      );

      // hasLearningOpportunities is false/falsy when no callbacks provided
      expect(result.current.hasLearningOpportunities).toBeFalsy();
    });

    it('should return false when no changes detected', () => {
      const { result } = renderHook(() =>
        useLearningPhases(createConfig({
          onSaveCategoryMapping: mockOnSaveCategoryMapping,
          onSaveSubcategoryMapping: mockOnSaveSubcategoryMapping,
          onSaveMerchantMapping: mockOnSaveMerchantMapping,
        }))
      );

      expect(result.current.hasLearningOpportunities).toBe(false);
    });
  });

  describe('hasMerchantChange', () => {
    it('should return false when no merchant', () => {
      const { result } = renderHook(() =>
        useLearningPhases(createConfig({ merchant: '' }))
      );

      expect(result.current.hasMerchantChange).toBe(false);
    });

    it('should return false when alias unchanged', () => {
      const { result } = renderHook(() =>
        useLearningPhases(createConfig({
          merchant: 'Store',
          alias: '',
        }))
      );

      expect(result.current.hasMerchantChange).toBe(false);
    });
  });

  describe('startLearningFlow - no changes', () => {
    it('should save directly when no learning opportunities', async () => {
      const { result } = renderHook(() =>
        useLearningPhases(createConfig({
          onSave: mockOnSave,
        }))
      );

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(result.current.state.showCategoryPrompt).toBe(false);
      expect(result.current.state.showSubcategoryPrompt).toBe(false);
      expect(result.current.state.showMerchantPrompt).toBe(false);
    });
  });

  describe('category learning flow', () => {
    it('should show category prompt when category changed', async () => {
      const initialItems = createItems();

      const { result, rerender } = renderHook(
        ({ items }) =>
          useLearningPhases(createConfig({
            items,
            onSaveCategoryMapping: mockOnSaveCategoryMapping,
          })),
        { initialProps: { items: initialItems } }
      );

      // Change category
      const changedItems = createItems([{ category: 'Bakery' }]);
      rerender({ items: changedItems });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      expect(result.current.state.showCategoryPrompt).toBe(true);
      expect(result.current.state.categoryChanges).toHaveLength(1);
      expect(result.current.state.categoryChanges[0].itemName).toBe('Apple');
      expect(result.current.state.categoryChanges[0].newValue).toBe('Bakery');
    });

    it('should save mapping and proceed when confirmed', async () => {
      const initialItems = createItems();

      const { result, rerender } = renderHook(
        ({ items }) =>
          useLearningPhases(createConfig({
            items,
            onSaveCategoryMapping: mockOnSaveCategoryMapping,
            onSave: mockOnSave,
          })),
        { initialProps: { items: initialItems } }
      );

      // Change category
      rerender({ items: createItems([{ category: 'Bakery' }]) });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      expect(result.current.state.showCategoryPrompt).toBe(true);

      await act(async () => {
        await result.current.actions.confirmCategoryLearning();
      });

      expect(mockOnSaveCategoryMapping).toHaveBeenCalledWith('Apple', 'Bakery');
      expect(result.current.state.showCategoryPrompt).toBe(false);
    });

    it('should skip mapping and proceed when dismissed', async () => {
      const initialItems = createItems();

      const { result, rerender } = renderHook(
        ({ items }) =>
          useLearningPhases(createConfig({
            items,
            onSaveCategoryMapping: mockOnSaveCategoryMapping,
            onSave: mockOnSave,
          })),
        { initialProps: { items: initialItems } }
      );

      // Change category
      rerender({ items: createItems([{ category: 'Bakery' }]) });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      await act(async () => {
        await result.current.actions.skipCategoryLearning();
      });

      expect(mockOnSaveCategoryMapping).not.toHaveBeenCalled();
      expect(result.current.state.showCategoryPrompt).toBe(false);
    });
  });

  describe('subcategory learning flow', () => {
    it('should show subcategory prompt when subcategory changed', async () => {
      const initialItems = createItems();

      const { result, rerender } = renderHook(
        ({ items }) =>
          useLearningPhases(createConfig({
            items,
            onSaveSubcategoryMapping: mockOnSaveSubcategoryMapping,
          })),
        { initialProps: { items: initialItems } }
      );

      // Change subcategory
      rerender({ items: createItems([{ subcategory: 'Vegetables' }]) });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      expect(result.current.state.showSubcategoryPrompt).toBe(true);
      expect(result.current.state.subcategoryChanges).toHaveLength(1);
      expect(result.current.state.subcategoryChanges[0].newValue).toBe('Vegetables');
    });

    it('should save mapping when confirmed', async () => {
      const initialItems = createItems();

      const { result, rerender } = renderHook(
        ({ items }) =>
          useLearningPhases(createConfig({
            items,
            onSaveSubcategoryMapping: mockOnSaveSubcategoryMapping,
            onSave: mockOnSave,
          })),
        { initialProps: { items: initialItems } }
      );

      rerender({ items: createItems([{ subcategory: 'Vegetables' }]) });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      await act(async () => {
        await result.current.actions.confirmSubcategoryLearning();
      });

      expect(mockOnSaveSubcategoryMapping).toHaveBeenCalledWith('Apple', 'Vegetables');
    });
  });

  describe('merchant learning flow', () => {
    it('should show merchant prompt when alias changed', async () => {
      const { result, rerender } = renderHook(
        ({ alias }) =>
          useLearningPhases(createConfig({
            merchant: 'Original Store',
            alias,
            onSaveMerchantMapping: mockOnSaveMerchantMapping,
          })),
        { initialProps: { alias: '' } }
      );

      // Change alias
      rerender({ alias: 'Friendly Store' });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      expect(result.current.state.showMerchantPrompt).toBe(true);
    });

    it('should save mapping and celebrate when confirmed', async () => {
      const { result, rerender } = renderHook(
        ({ alias }) =>
          useLearningPhases(createConfig({
            merchant: 'Original Store',
            alias,
            onSaveMerchantMapping: mockOnSaveMerchantMapping,
            onSave: mockOnSave,
            onCelebrate: mockOnCelebrate,
          })),
        { initialProps: { alias: '' } }
      );

      rerender({ alias: 'Friendly Store' });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      await act(async () => {
        await result.current.actions.confirmMerchantLearning();
      });

      expect(mockOnSaveMerchantMapping).toHaveBeenCalledWith('Original Store', 'Friendly Store');
      expect(mockOnCelebrate).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should save without mapping when skipped', async () => {
      const { result, rerender } = renderHook(
        ({ alias }) =>
          useLearningPhases(createConfig({
            merchant: 'Original Store',
            alias,
            onSaveMerchantMapping: mockOnSaveMerchantMapping,
            onSave: mockOnSave,
          })),
        { initialProps: { alias: '' } }
      );

      rerender({ alias: 'Friendly Store' });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      await act(async () => {
        await result.current.actions.skipMerchantLearning();
      });

      expect(mockOnSaveMerchantMapping).not.toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const initialItems = createItems();

      const { result, rerender } = renderHook(
        ({ items }) =>
          useLearningPhases(createConfig({
            items,
            onSaveCategoryMapping: mockOnSaveCategoryMapping,
          })),
        { initialProps: { items: initialItems } }
      );

      rerender({ items: createItems([{ category: 'Bakery' }]) });

      await act(async () => {
        await result.current.actions.startLearningFlow();
      });

      expect(result.current.state.showCategoryPrompt).toBe(true);

      act(() => {
        result.current.actions.reset();
      });

      expect(result.current.state.showCategoryPrompt).toBe(false);
      expect(result.current.state.categoryChanges).toEqual([]);
    });
  });
});

// ============================================================================
// shouldShowLearningPrompt Tests
// ============================================================================

describe('shouldShowLearningPrompt', () => {
  it('should return all false when no changes', () => {
    const items = createItems();
    const result = shouldShowLearningPrompt(
      items,
      items,
      '',
      '',
      'Store'
    );

    expect(result.category).toBe(false);
    expect(result.subcategory).toBe(false);
    expect(result.merchant).toBe(false);
  });

  it('should detect category changes', () => {
    const original = createItems();
    const current = createItems([{ category: 'Bakery' }]);

    const result = shouldShowLearningPrompt(
      current,
      original,
      '',
      '',
      'Store'
    );

    expect(result.category).toBe(true);
    expect(result.subcategory).toBe(false);
  });

  it('should detect subcategory changes', () => {
    const original = createItems();
    const current = createItems([{ subcategory: 'Vegetables' }]);

    const result = shouldShowLearningPrompt(
      current,
      original,
      '',
      '',
      'Store'
    );

    expect(result.subcategory).toBe(true);
    expect(result.category).toBe(false);
  });

  it('should detect merchant alias changes', () => {
    const items = createItems();

    const result = shouldShowLearningPrompt(
      items,
      items,
      'New Alias',
      '',
      'Store'
    );

    expect(result.merchant).toBe(true);
  });

  it('should not detect merchant change when no merchant', () => {
    const items = createItems();

    const result = shouldShowLearningPrompt(
      items,
      items,
      'New Alias',
      '',
      '' // No merchant
    );

    expect(result.merchant).toBe(false);
  });

  it('should not detect merchant change when alias is empty', () => {
    const items = createItems();

    const result = shouldShowLearningPrompt(
      items,
      items,
      '', // Empty alias
      'Old Alias',
      'Store'
    );

    expect(result.merchant).toBe(false);
  });
});
