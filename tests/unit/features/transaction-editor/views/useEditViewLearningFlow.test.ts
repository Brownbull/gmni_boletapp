/**
 * Story 15b-2a: Tests for useEditViewLearningFlow custom hook.
 * Tests the 3-stage learning prompt chain (category -> subcategory -> merchant -> save).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditViewLearningFlow } from '@features/transaction-editor/views/useEditViewLearningFlow';
import type { Transaction } from '@features/transaction-editor/views/editViewHelpers';

// Mock confetti
vi.mock('@/utils/confetti', () => ({
  celebrateSuccess: vi.fn(),
}));

const baseOriginalItems = [
  { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
  { name: 'Bread', category: 'Bakery', subcategory: 'Loaves' },
];

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    merchant: 'TestMerchant', alias: '', date: '2026-01-01',
    total: 1000, category: 'Groceries',
    items: [
      { name: 'Apple', price: 500, category: 'Produce', subcategory: 'Fruits' },
      { name: 'Bread', price: 500, category: 'Bakery', subcategory: 'Loaves' },
    ],
    ...overrides,
  };
}

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    onSave: vi.fn().mockResolvedValue(undefined),
    onSaveMapping: vi.fn().mockResolvedValue('ok'),
    onSaveMerchantMapping: vi.fn().mockResolvedValue('ok'),
    onSaveSubcategoryMapping: vi.fn().mockResolvedValue('ok'),
    onShowToast: vi.fn(),
    t: vi.fn((key: string) => key),
    currentTransaction: makeTx(),
    originalItemGroupsRef: { current: { items: baseOriginalItems, capturedForTransactionKey: 'new' } },
    originalAliasRef: { current: '' },
    ...overrides,
  };
}

// Fixture factories
const changedCategoryProps = () => makeProps({
  currentTransaction: makeTx({
    items: [
      { name: 'Apple', price: 500, category: 'Snacks', subcategory: 'Fruits' },
      { name: 'Bread', price: 500, category: 'Bakery', subcategory: 'Loaves' },
    ],
  }),
});

const changedAliasProps = () => makeProps({
  currentTransaction: makeTx({ alias: 'NewAlias', items: [{ name: 'Apple', price: 500, category: 'Produce', subcategory: 'Fruits' }] }),
  originalAliasRef: { current: 'OldAlias' },
});

const changedSubcategoryProps = () => makeProps({
  currentTransaction: makeTx({ items: [{ name: 'Apple', price: 500, category: 'Produce', subcategory: 'Organic' }] }),
  originalItemGroupsRef: { current: { items: [{ name: 'Apple', category: 'Produce', subcategory: 'Fruits' }], capturedForTransactionKey: 'new' } },
});

describe('useEditViewLearningFlow', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  describe('handleSaveWithLearning', () => {
    it('calls onSave directly when no items changed', async () => {
      const props = makeProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      expect(props.onSave).toHaveBeenCalledTimes(1);
      expect(result.current.showLearningPrompt).toBe(false);
      expect(result.current.showSubcategoryLearningPrompt).toBe(false);
      expect(result.current.showMerchantLearningPrompt).toBe(false);
    });

    it('shows learning prompt when item group changed and onSaveMapping provided', async () => {
      const props = changedCategoryProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      expect(result.current.showLearningPrompt).toBe(true);
      expect(result.current.itemsToLearn).toEqual([{ itemName: 'Apple', newGroup: 'Snacks' }]);
      expect(props.onSave).not.toHaveBeenCalled();
    });
  });

  describe('handleLearnConfirm', () => {
    it('calls onSaveMapping for each changed item and chains to onSave', async () => {
      const props = changedCategoryProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      await act(async () => { await result.current.handleLearnConfirm(); });
      expect(props.onSaveMapping).toHaveBeenCalledWith('Apple', 'Snacks', 'user');
      expect(props.onShowToast).toHaveBeenCalledWith('learnCategorySuccess');
      expect(result.current.showLearningPrompt).toBe(false);
      expect(props.onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleLearnDismiss', () => {
    it('hides prompt, skips mapping, chains to onSave', async () => {
      const props = changedCategoryProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      await act(async () => { await result.current.handleLearnDismiss(); });
      expect(result.current.showLearningPrompt).toBe(false);
      expect(props.onSaveMapping).not.toHaveBeenCalled();
      expect(props.onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('merchant learning', () => {
    it('shows merchant learning prompt when alias changed', async () => {
      const props = changedAliasProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      expect(result.current.showMerchantLearningPrompt).toBe(true);
      expect(props.onSave).not.toHaveBeenCalled();
    });

    it('handleLearnMerchantConfirm calls onSaveMerchantMapping, celebrateSuccess, and onSave', async () => {
      const { celebrateSuccess } = await import('@/utils/confetti');
      const props = changedAliasProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      await act(async () => { await result.current.handleLearnMerchantConfirm(); });
      expect(props.onSaveMerchantMapping).toHaveBeenCalledWith('TestMerchant', 'NewAlias');
      expect(celebrateSuccess).toHaveBeenCalled();
      expect(props.onShowToast).toHaveBeenCalledWith('learnMerchantSuccess');
      expect(props.onSave).toHaveBeenCalledTimes(1);
      expect(result.current.showMerchantLearningPrompt).toBe(false);
    });

    it('handleLearnMerchantDismiss hides prompt and calls onSave without mapping', async () => {
      const props = changedAliasProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      await act(async () => { await result.current.handleLearnMerchantDismiss(); });
      expect(result.current.showMerchantLearningPrompt).toBe(false);
      expect(props.onSaveMerchantMapping).not.toHaveBeenCalled();
      expect(props.onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('subcategory learning', () => {
    it('shows subcategory learning prompt when subcategory changed', async () => {
      const props = changedSubcategoryProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      expect(result.current.showSubcategoryLearningPrompt).toBe(true);
      expect(result.current.subcategoriesToLearn).toEqual([{ itemName: 'Apple', newSubcategory: 'Organic' }]);
    });

    it('handleSubcategoryLearnConfirm calls onSaveSubcategoryMapping and chains to onSave', async () => {
      const props = changedSubcategoryProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      await act(async () => { await result.current.handleSubcategoryLearnConfirm(); });
      expect(props.onSaveSubcategoryMapping).toHaveBeenCalledWith('Apple', 'Organic', 'user');
      expect(props.onShowToast).toHaveBeenCalledWith('learnSubcategorySuccess');
      expect(props.onSave).toHaveBeenCalledTimes(1);
    });

    it('handleSubcategoryLearnDismiss hides prompt and chains to onSave without mapping', async () => {
      const props = changedSubcategoryProps();
      const { result } = renderHook(() => useEditViewLearningFlow(props));
      await act(async () => { await result.current.handleSaveWithLearning(); });
      await act(async () => { await result.current.handleSubcategoryLearnDismiss(); });
      expect(result.current.showSubcategoryLearningPrompt).toBe(false);
      expect(props.onSaveSubcategoryMapping).not.toHaveBeenCalled();
      expect(props.onSave).toHaveBeenCalledTimes(1);
    });
  });
});
