/**
 * Story 14c-refactor.26: useBatchReviewViewProps Tests
 * Story 14c-refactor.32b: Expanded tests for all BatchReviewView props
 *
 * Tests for the BatchReviewView props composition hook.
 * Verifies memoization stability and correct prop composition.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    useBatchReviewViewProps,
    type UseBatchReviewViewPropsOptions,
} from '../../../../src/hooks/app/useBatchReviewViewProps';
import { formatCurrency } from '../../../../src/utils/currency';

// =============================================================================
// Test Fixtures
// =============================================================================

function createDefaultOptions(): UseBatchReviewViewPropsOptions {
    return {
        // Core data
        processingResults: [
            { success: true, data: { merchant: 'Store 1', total: 1000 } },
        ] as any[],
        imageDataUrls: ['data:image/jpeg;base64,abc123'],
        // UI settings
        theme: 'light',
        currency: 'CLP',
        t: vi.fn((key: string) => key),
        // Optional
        processingState: undefined,
        credits: undefined,
        // Required callbacks - Story 14c-refactor.32b
        onEditReceipt: vi.fn(),
        onSaveComplete: vi.fn(),
        saveTransaction: vi.fn().mockResolvedValue('tx-123'),
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useBatchReviewViewProps', () => {
    describe('Memoization Stability', () => {
        it('returns same reference when dependencies unchanged', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(() =>
                useBatchReviewViewProps(options)
            );

            const firstResult = result.current;
            rerender();

            expect(result.current).toBe(firstResult);
        });

        it('returns new reference when dependency changes', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(
                (opts: UseBatchReviewViewPropsOptions) => useBatchReviewViewProps(opts),
                { initialProps: options }
            );

            const firstResult = result.current;
            rerender({ ...options, theme: 'dark' });

            expect(result.current).not.toBe(firstResult);
            expect(result.current.theme).toBe('dark');
        });

        it('maintains stable callback references when callbacks unchanged', () => {
            const options = createDefaultOptions();
            const { result, rerender } = renderHook(() =>
                useBatchReviewViewProps(options)
            );

            const firstOnEditReceipt = result.current.onEditReceipt;
            const firstOnSaveComplete = result.current.onSaveComplete;
            const firstSaveTransaction = result.current.saveTransaction;
            rerender();

            expect(result.current.onEditReceipt).toBe(firstOnEditReceipt);
            expect(result.current.onSaveComplete).toBe(firstOnSaveComplete);
            expect(result.current.saveTransaction).toBe(firstSaveTransaction);
        });
    });

    describe('Prop Composition', () => {
        it('passes through basic props correctly', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.theme).toBe('light');
            expect(result.current.currency).toBe('CLP');
            expect(result.current.processingResults).toHaveLength(1);
            expect(result.current.imageDataUrls).toHaveLength(1);
        });

        it('handles undefined processing state', () => {
            const options = createDefaultOptions();
            options.processingState = undefined;

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.processingState).toBeUndefined();
        });

        it('passes through processing state correctly', () => {
            const options = createDefaultOptions();
            options.processingState = {
                isProcessing: true,
                progress: { current: 2, total: 5 },
                states: [],
            };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.processingState).toEqual({
                isProcessing: true,
                progress: { current: 2, total: 5 },
                states: [],
                onCancelProcessing: undefined,
            });
        });

        it('passes through processing state with onCancelProcessing callback', () => {
            const options = createDefaultOptions();
            const onCancelProcessing = vi.fn();
            options.processingState = {
                isProcessing: true,
                progress: { current: 1, total: 3 },
                states: [],
                onCancelProcessing,
            };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.processingState?.onCancelProcessing).toBe(onCancelProcessing);
        });

        it('handles undefined credits', () => {
            const options = createDefaultOptions();
            options.credits = undefined;

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.credits).toBeUndefined();
        });

        it('passes through credits correctly', () => {
            const options = createDefaultOptions();
            options.credits = { remaining: 10, superRemaining: 3 };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.credits).toEqual({
                remaining: 10,
                superRemaining: 3,
            });
        });
    });

    describe('formatCurrencyFn (Story 14c-refactor.32b)', () => {
        it('defaults to formatCurrency from utils when not provided', () => {
            const options = createDefaultOptions();
            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.formatCurrencyFn).toBe(formatCurrency);
        });

        it('uses custom formatCurrencyFn when provided', () => {
            const options = createDefaultOptions();
            const customFormatCurrency = vi.fn((amount: number) => `$${amount}`);
            options.formatCurrencyFn = customFormatCurrency;

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.formatCurrencyFn).toBe(customFormatCurrency);
        });
    });

    describe('Callbacks (Story 14c-refactor.32b)', () => {
        it('passes through onEditReceipt callback', () => {
            const onEditReceipt = vi.fn();
            const options = { ...createDefaultOptions(), onEditReceipt };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            const mockReceipt = { id: 'r1', status: 'valid' } as any;
            const mockAllReceipts = [mockReceipt];
            result.current.onEditReceipt(mockReceipt, 1, 1, mockAllReceipts);

            expect(onEditReceipt).toHaveBeenCalledWith(mockReceipt, 1, 1, mockAllReceipts);
        });

        it('passes through onSaveComplete callback', () => {
            const onSaveComplete = vi.fn();
            const options = { ...createDefaultOptions(), onSaveComplete };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            const mockIds = ['tx-1', 'tx-2'];
            const mockTransactions = [{ id: 'tx-1' }, { id: 'tx-2' }] as any[];
            result.current.onSaveComplete(mockIds, mockTransactions);

            expect(onSaveComplete).toHaveBeenCalledWith(mockIds, mockTransactions);
        });

        it('passes through saveTransaction callback', async () => {
            const saveTransaction = vi.fn().mockResolvedValue('saved-tx-id');
            const options = { ...createDefaultOptions(), saveTransaction };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            const mockTransaction = { id: 'tx-1', merchant: 'Test' } as any;
            const savedId = await result.current.saveTransaction(mockTransaction);

            expect(saveTransaction).toHaveBeenCalledWith(mockTransaction);
            expect(savedId).toBe('saved-tx-id');
        });

        it('passes through optional onCancel callback', () => {
            const onCancel = vi.fn();
            const options = { ...createDefaultOptions(), onCancel };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.onCancel).toBeDefined();
            result.current.onCancel?.();
            expect(onCancel).toHaveBeenCalled();
        });

        it('handles undefined onCancel callback', () => {
            const options = createDefaultOptions();
            // onCancel not provided

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.onCancel).toBeUndefined();
        });

        it('passes through optional onReceiptUpdated callback', () => {
            const onReceiptUpdated = vi.fn();
            const options = { ...createDefaultOptions(), onReceiptUpdated };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.onReceiptUpdated).toBeDefined();
            const mockTransaction = { id: 'tx-1' } as any;
            result.current.onReceiptUpdated?.('receipt-1', mockTransaction);
            expect(onReceiptUpdated).toHaveBeenCalledWith('receipt-1', mockTransaction);
        });

        it('handles undefined onReceiptUpdated callback', () => {
            const options = createDefaultOptions();
            // onReceiptUpdated not provided

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.onReceiptUpdated).toBeUndefined();
        });

        it('passes through optional onRetryReceipt callback', () => {
            const onRetryReceipt = vi.fn();
            const options = { ...createDefaultOptions(), onRetryReceipt };

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.onRetryReceipt).toBeDefined();
            const mockReceipt = { id: 'r1', status: 'error' } as any;
            result.current.onRetryReceipt?.(mockReceipt);
            expect(onRetryReceipt).toHaveBeenCalledWith(mockReceipt);
        });

        it('handles undefined onRetryReceipt callback', () => {
            const options = createDefaultOptions();
            // onRetryReceipt not provided

            const { result } = renderHook(() => useBatchReviewViewProps(options));

            expect(result.current.onRetryReceipt).toBeUndefined();
        });
    });
});
