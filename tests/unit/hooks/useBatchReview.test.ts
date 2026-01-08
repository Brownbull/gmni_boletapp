/**
 * Story 12.3: Batch Review Queue - useBatchReview Hook Tests
 *
 * Tests for the React hook that manages batch review state.
 *
 * @see docs/sprint-artifacts/epic12/story-12.3-batch-review-queue.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchReview, BatchReceipt } from '../../../src/hooks/useBatchReview';
import type { ProcessingResult } from '../../../src/services/batchProcessingService';
import type { Transaction } from '../../../src/types/transaction';

describe('useBatchReview', () => {
  // Create a mock transaction
  const createMockTransaction = (
    merchant: string,
    total: number,
    category: Transaction['category'] = 'Supermarket'
  ): Transaction => ({
    merchant,
    alias: merchant,
    total,
    date: '2024-12-22',
    category,
    items: [{ name: 'Item 1', price: total }],
  });

  // Create mock processing results
  const createMockResults = (): ProcessingResult[] => [
    {
      id: 'result-1',
      index: 0,
      success: true,
      result: createMockTransaction('Store A', 15000),
    },
    {
      id: 'result-2',
      index: 1,
      success: true,
      result: createMockTransaction('Store B', 25000),
    },
    {
      id: 'result-3',
      index: 2,
      success: false,
      error: 'Failed to process image',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize receipts from processing results', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      expect(result.current.receipts).toHaveLength(3);
      expect(result.current.receipts[0].id).toBe('result-1');
      expect(result.current.receipts[1].id).toBe('result-2');
      expect(result.current.receipts[2].id).toBe('result-3');
    });

    it('should mark successful high-confidence receipts as ready', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      // High confidence receipts should be "ready"
      expect(result.current.receipts[0].status).toBe('ready');
      expect(result.current.receipts[0].confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should mark failed receipts as error', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      expect(result.current.receipts[2].status).toBe('error');
      expect(result.current.receipts[2].error).toBe('Failed to process image');
    });

    it('should mark low-confidence receipts as review', () => {
      // Create a low-confidence transaction (missing fields)
      const lowConfidenceTx: Transaction = {
        merchant: 'Unknown Store',
        total: 0, // Missing total
        date: '',
        category: 'Other',
        items: [],
      };

      const results: ProcessingResult[] = [
        {
          id: 'low-conf',
          index: 0,
          success: true,
          result: lowConfidenceTx,
        },
      ];

      const { result } = renderHook(() => useBatchReview(results));

      expect(result.current.receipts[0].status).toBe('review');
      expect(result.current.receipts[0].confidence).toBeLessThan(0.85);
    });

    it('should calculate initial computed values', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      expect(result.current.validCount).toBe(2);
      expect(result.current.errorCount).toBe(1);
      expect(result.current.totalAmount).toBe(40000); // 15000 + 25000
      expect(result.current.isEmpty).toBe(false);
    });
  });

  describe('updateReceipt', () => {
    it('should update a receipt transaction and mark as edited', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      const updatedTx = createMockTransaction('Updated Store', 20000);

      act(() => {
        result.current.updateReceipt('result-1', updatedTx);
      });

      expect(result.current.receipts[0].transaction.merchant).toBe('Updated Store');
      expect(result.current.receipts[0].transaction.total).toBe(20000);
      expect(result.current.receipts[0].status).toBe('edited');
    });

    it('should recalculate confidence after update', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      const originalConfidence = result.current.receipts[0].confidence;

      // Update with low-confidence data
      const lowConfTx: Transaction = {
        merchant: '',
        total: 0,
        date: '',
        category: 'Other',
        items: [],
      };

      act(() => {
        result.current.updateReceipt('result-1', lowConfTx);
      });

      expect(result.current.receipts[0].confidence).toBeLessThan(originalConfidence);
    });

    it('should not affect other receipts', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      const originalReceipt2 = { ...result.current.receipts[1] };

      act(() => {
        result.current.updateReceipt('result-1', createMockTransaction('Updated', 30000));
      });

      expect(result.current.receipts[1].transaction.merchant).toBe(originalReceipt2.transaction.merchant);
      expect(result.current.receipts[1].status).toBe(originalReceipt2.status);
    });
  });

  describe('discardReceipt', () => {
    it('should remove a receipt from the list', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      expect(result.current.receipts).toHaveLength(3);

      act(() => {
        result.current.discardReceipt('result-1');
      });

      expect(result.current.receipts).toHaveLength(2);
      expect(result.current.receipts.find((r) => r.id === 'result-1')).toBeUndefined();
    });

    it('should update computed values after discard', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      expect(result.current.totalAmount).toBe(40000);

      act(() => {
        result.current.discardReceipt('result-1'); // Discard 15000
      });

      expect(result.current.totalAmount).toBe(25000);
      expect(result.current.validCount).toBe(1);
    });

    it('should set isEmpty when all receipts discarded', () => {
      const results: ProcessingResult[] = [
        {
          id: 'single',
          index: 0,
          success: true,
          result: createMockTransaction('Store', 10000),
        },
      ];

      const { result } = renderHook(() => useBatchReview(results));

      expect(result.current.isEmpty).toBe(false);

      act(() => {
        result.current.discardReceipt('single');
      });

      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe('getReceipt', () => {
    it('should return a receipt by ID', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      const receipt = result.current.getReceipt('result-2');

      expect(receipt).toBeDefined();
      expect(receipt?.id).toBe('result-2');
      expect(receipt?.transaction.merchant).toBe('Store B');
    });

    it('should return undefined for non-existent ID', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      const receipt = result.current.getReceipt('non-existent');

      expect(receipt).toBeUndefined();
    });
  });

  describe('saveAll', () => {
    it('should save all valid receipts', async () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      const mockSaveTransaction = vi.fn()
        .mockResolvedValueOnce('tx-id-1')
        .mockResolvedValueOnce('tx-id-2');

      let saveResult: { saved: string[]; failed: string[] } | undefined;

      await act(async () => {
        saveResult = await result.current.saveAll(mockSaveTransaction);
      });

      // Should only save valid receipts (not error)
      expect(mockSaveTransaction).toHaveBeenCalledTimes(2);
      expect(saveResult?.saved).toEqual(['tx-id-1', 'tx-id-2']);
      expect(saveResult?.failed).toEqual([]);
    });

    it('should track failed saves', async () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      const mockSaveTransaction = vi.fn()
        .mockResolvedValueOnce('tx-id-1')
        .mockRejectedValueOnce(new Error('Save failed'));

      let saveResult: { saved: string[]; failed: string[] } | undefined;

      await act(async () => {
        saveResult = await result.current.saveAll(mockSaveTransaction);
      });

      expect(saveResult?.saved).toEqual(['tx-id-1']);
      expect(saveResult?.failed).toEqual(['result-2']);
    });

    it('should update saving state and progress', async () => {
      const results: ProcessingResult[] = [
        { id: 'r1', index: 0, success: true, result: createMockTransaction('A', 1000) },
        { id: 'r2', index: 1, success: true, result: createMockTransaction('B', 2000) },
      ];

      const { result } = renderHook(() => useBatchReview(results));

      // Track state during save
      const progressValues: number[] = [];
      const savingValues: boolean[] = [];

      const mockSaveTransaction = vi.fn().mockImplementation(async () => {
        // Record state at each save
        progressValues.push(result.current.saveProgress);
        savingValues.push(result.current.isSaving);
        return 'tx-id';
      });

      await act(async () => {
        await result.current.saveAll(mockSaveTransaction);
      });

      // After save complete
      expect(result.current.isSaving).toBe(false);
    });

    it('should return empty arrays when no valid receipts', async () => {
      const results: ProcessingResult[] = [
        { id: 'error-1', index: 0, success: false, error: 'Failed' },
      ];

      const { result } = renderHook(() => useBatchReview(results));

      const mockSaveTransaction = vi.fn();

      let saveResult: { saved: string[]; failed: string[]; savedTransactions: unknown[] } | undefined;

      await act(async () => {
        saveResult = await result.current.saveAll(mockSaveTransaction);
      });

      expect(mockSaveTransaction).not.toHaveBeenCalled();
      // Hook returns savedTransactions array for batch complete modal (Story 14.15)
      expect(saveResult).toEqual({ saved: [], failed: [], savedTransactions: [] });
    });
  });

  describe('with imageDataUrls', () => {
    it('should attach image URLs to receipts', () => {
      const results = createMockResults();
      const imageUrls = [
        'data:image/jpeg;base64,image1',
        'data:image/jpeg;base64,image2',
        'data:image/jpeg;base64,image3',
      ];

      const { result } = renderHook(() => useBatchReview(results, imageUrls));

      expect(result.current.receipts[0].imageUrl).toBe(imageUrls[0]);
      expect(result.current.receipts[1].imageUrl).toBe(imageUrls[1]);
      expect(result.current.receipts[2].imageUrl).toBe(imageUrls[2]);
    });
  });

  describe('computed values', () => {
    it('should compute reviewCount correctly', () => {
      // Mix of high and low confidence
      const results: ProcessingResult[] = [
        { id: 'high', index: 0, success: true, result: createMockTransaction('A', 1000) },
        {
          id: 'low',
          index: 1,
          success: true,
          result: {
            merchant: '',
            total: 0,
            date: '',
            category: 'Other',
            items: [],
          },
        },
      ];

      const { result } = renderHook(() => useBatchReview(results));

      expect(result.current.reviewCount).toBe(1);
    });

    it('should recalculate after updates', () => {
      const results = createMockResults();
      const { result } = renderHook(() => useBatchReview(results));

      const initialTotal = result.current.totalAmount;

      act(() => {
        result.current.updateReceipt('result-1', createMockTransaction('Updated', 50000));
      });

      expect(result.current.totalAmount).toBe(initialTotal - 15000 + 50000);
    });
  });
});
