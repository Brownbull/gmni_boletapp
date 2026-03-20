/// <reference types="@testing-library/jest-dom" />
/**
 * Story TD-18-15 AC-8: Verify deriveItemsPrices is called in save path
 *
 * Tests that handleFinalSave calls deriveItemsPrices on transaction items.
 * @see docs/sprint-artifacts/epic18/stories/TD-18-15-item-editor-qty-test-coverage.md
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { TransactionEditorViewProps } from '@features/transaction-editor/views/TransactionEditorViewInternal';
import type { Transaction } from '@/types/transaction';

// =============================================================================
// Capture onFinalSave from useEditorLearningPrompts
// =============================================================================

let capturedOnFinalSave: (() => Promise<void>) | null = null;

// =============================================================================
// Mocks — minimal stubs for all dependencies
// =============================================================================

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('@/hooks/useStaggeredReveal', () => ({
  useStaggeredReveal: () => ({ visibleItems: [], isComplete: true }),
}));

vi.mock('@managers/ModalManager', () => ({
  useModalActions: () => ({ openModal: vi.fn(), closeModal: vi.fn() }),
}));

vi.mock('@/shared/hooks', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/utils/transactionValidation', () => ({
  hasItemWithPrice: () => true,
}));

vi.mock('@/utils/sanitize', () => ({
  sanitizeMerchantName: (v: string) => v,
  sanitizeItemName: (v: string) => v,
  sanitizeLocation: (v: string) => v,
  sanitizeSubcategory: (v: string) => v,
}));

vi.mock('@/utils/categoryNormalizer', () => ({
  normalizeItemCategory: (cat: string) => cat,
}));

vi.mock('@/config/categoryColors', () => ({
  getItemCategoryGroup: (cat: string) => cat,
}));

vi.mock('@/components/ImageViewer', () => ({
  ImageViewer: () => null,
}));

vi.mock('@features/transaction-editor/views/TransactionEditorView/EditorConfirmationDialogs', () => ({
  EditorConfirmationDialogs: () => null,
}));

vi.mock('@features/transaction-editor/views/TransactionEditorView/EditorHeaderBar', () => ({
  EditorHeaderBar: () => null,
}));

vi.mock('@features/transaction-editor/views/TransactionEditorScanStatus', () => ({
  TransactionEditorScanStatus: () => null,
}));

vi.mock('@features/transaction-editor/views/TransactionEditorForm', () => ({
  TransactionEditorForm: () => <div data-testid="mock-form" />,
}));

vi.mock('@features/transaction-editor/views/TransactionEditorView/useCrossStoreSuggestions', () => ({
  useCrossStoreSuggestions: () => ({ itemSuggestions: {}, handleShowSuggestion: vi.fn() }),
}));

vi.mock('@features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures', () => ({
  useEditorSwipeGestures: () => ({
    swipeOffset: 0, swipeTouchStart: null, fadeInKey: 'k',
    handleSwipeTouchStart: vi.fn(), handleSwipeTouchMove: vi.fn(), handleSwipeTouchEnd: vi.fn(),
  }),
}));

vi.mock('@features/transaction-editor/views/TransactionEditorView/useEditorLearningPrompts', () => ({
  useEditorLearningPrompts: (opts: { onFinalSave: () => Promise<void> }) => {
    capturedOnFinalSave = opts.onFinalSave;
    return { handleSaveWithLearning: vi.fn() };
  },
}));

// Spy on deriveItemsPrices — mirrors real logic: unitPrice = Math.round(totalPrice / qty)
const deriveItemsPricesSpy = vi.fn(
  (items: Array<Record<string, unknown>>) =>
    items.map(item => {
      const qty = typeof item.qty === 'number' && item.qty > 0 ? item.qty : 1;
      return {
        ...item,
        qty,
        unitPrice: Math.round((item.totalPrice as number) / qty),
      };
    }),
);
vi.mock('@entities/transaction/utils/itemPriceDerivation', () => ({
  deriveItemsPrices: (...args: unknown[]) => deriveItemsPricesSpy(...args),
}));

// =============================================================================
// Test helpers
// =============================================================================

const mockTransaction: Transaction = {
  id: 'tx-ac8',
  merchant: 'Test Store',
  alias: '',
  total: 15,
  currency: 'CLP',
  date: '2026-01-01',
  time: '10:00',
  items: [
    { name: 'Apple', totalPrice: 5, category: 'Produce', subcategory: '' },
    { name: 'Steak', totalPrice: 10, category: 'Meat', subcategory: '' },
  ],
  category: 'grocery',
  city: '',
  country: '',
};

function buildProps(overrides: Partial<TransactionEditorViewProps> = {}): TransactionEditorViewProps {
  return {
    transaction: mockTransaction,
    mode: 'existing',
    scanButtonState: 'idle',
    isProcessing: false,
    onUpdateTransaction: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    onPhotoSelect: vi.fn(),
    onProcessScan: vi.fn(),
    onRetry: vi.fn(),
    theme: 'light',
    t: (key: string) => key,
    formatCurrency: (amount: number, _currency?: string) => `$${amount}`,
    currency: 'CLP',
    lang: 'es',
    credits: { remaining: 5, used: 0, superRemaining: 0 },
    storeCategories: ['grocery'],
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('TransactionEditorView — handleFinalSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnFinalSave = null;
  });

  // AC-8: deriveItemsPrices is called in save path
  it('calls deriveItemsPrices with transaction items when handleFinalSave runs', async () => {
    const props = buildProps();
    const { TransactionEditorView } = await import('@features/transaction-editor/views/TransactionEditorViewInternal');
    render(React.createElement(TransactionEditorView, props));

    expect(capturedOnFinalSave).not.toBeNull();
    await capturedOnFinalSave!();

    expect(deriveItemsPricesSpy).toHaveBeenCalledOnce();
    expect(deriveItemsPricesSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Apple' }),
        expect.objectContaining({ name: 'Steak' }),
      ]),
    );
    expect(props.onSave).toHaveBeenCalledOnce();
    expect(props.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ name: 'Apple', unitPrice: 5, qty: 1 }),
          expect.objectContaining({ name: 'Steak', unitPrice: 10, qty: 1 }),
        ]),
      }),
    );
  });
});
