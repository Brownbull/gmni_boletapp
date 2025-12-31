/**
 * Story 12.2: Parallel Processing Service - useBatchProcessing Hook Tests
 *
 * Tests for the React hook that manages batch processing state.
 *
 * @see docs/sprint-artifacts/epic12/story-12.2-parallel-processing-service.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBatchProcessing } from '../../../src/hooks/useBatchProcessing';
import * as batchProcessingService from '../../../src/services/batchProcessingService';
import type { Transaction } from '../../../src/types/transaction';

// Mock the batch processing service
vi.mock('../../../src/services/batchProcessingService', async () => {
  const actual = await vi.importActual<typeof batchProcessingService>(
    '../../../src/services/batchProcessingService'
  );
  return {
    ...actual,
    processImagesInParallel: vi.fn(),
    retryImage: vi.fn(),
  };
});

describe('useBatchProcessing', () => {
  const mockProcessImagesInParallel = vi.mocked(
    batchProcessingService.processImagesInParallel
  );
  const mockRetryImage = vi.mocked(batchProcessingService.retryImage);

  // Create a mock transaction
  const createMockTransaction = (merchant: string, total: number): Transaction => ({
    merchant,
    total,
    date: '2024-12-22',
    category: 'Supermarket',
    items: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useBatchProcessing());

      expect(result.current.states).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toEqual({ current: 0, total: 0 });
      expect(result.current.results).toEqual([]);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.summary).toEqual({
        total: 0,
        pending: 0,
        processing: 0,
        ready: 0,
        error: 0,
        percentComplete: 0,
      });
    });
  });

  describe('startProcessing', () => {
    it('should start processing and update state', async () => {
      const tx = createMockTransaction('Store', 1000);
      const mockResults: batchProcessingService.ProcessingResult[] = [
        { id: 'test-1', index: 0, success: true, result: tx },
      ];

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus, onProgress) => {
        // Simulate status updates
        onStatus?.([{ id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx }]);
        onProgress?.(1, 1);
        return mockResults;
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        const results = await result.current.startProcessing(
          ['data:image/jpeg;base64,test'],
          'CLP'
        );
        expect(results).toEqual(mockResults);
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.results).toEqual(mockResults);
    });

    it('should not start if already processing', async () => {
      // Create a long-running mock
      mockProcessImagesInParallel.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
      );

      const { result } = renderHook(() => useBatchProcessing());

      // Start first processing
      act(() => {
        result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      // Try to start second processing
      let secondResult: batchProcessingService.ProcessingResult[] = [];
      await act(async () => {
        secondResult = await result.current.startProcessing(
          ['data:image/jpeg;base64,test2'],
          'CLP'
        );
      });

      // Second call should return empty
      expect(secondResult).toEqual([]);
      // Should only have been called once
      expect(mockProcessImagesInParallel).toHaveBeenCalledTimes(1);
    });

    it('should pass receiptType to service', async () => {
      mockProcessImagesInParallel.mockResolvedValue([]);

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          ['data:image/jpeg;base64,test'],
          'CLP',
          'supermarket'
        );
      });

      expect(mockProcessImagesInParallel).toHaveBeenCalledWith(
        ['data:image/jpeg;base64,test'],
        expect.objectContaining({
          currency: 'CLP',
          receiptType: 'supermarket',
        }),
        expect.any(Function),
        expect.any(Function),
        expect.any(Object) // AbortSignal
      );
    });
  });

  describe('cancel', () => {
    it('should abort processing when cancel is called', async () => {
      let abortSignal: AbortSignal | undefined;

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus, onProgress, signal) => {
        abortSignal = signal;
        // Simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [];
      });

      const { result } = renderHook(() => useBatchProcessing());

      act(() => {
        result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      act(() => {
        result.current.cancel();
      });

      // Wait a bit for the abort to be processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(abortSignal?.aborted).toBe(true);
    });
  });

  describe('retry', () => {
    it('should retry a failed image and update state', async () => {
      const tx = createMockTransaction('Store', 1000);
      const failedState: batchProcessingService.ImageProcessingState = {
        id: 'failed-1',
        index: 0,
        status: 'error',
        progress: 0,
        error: 'Failed',
      };

      // First call fails
      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([failedState]);
        return [{ id: 'failed-1', index: 0, success: false, error: 'Failed' }];
      });

      // Retry succeeds
      mockRetryImage.mockResolvedValue({
        id: 'retry-1',
        index: 0,
        success: true,
        result: tx,
      });

      const { result } = renderHook(() => useBatchProcessing());

      // Start processing (which will fail)
      await act(async () => {
        await result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      // Should have failed state
      expect(result.current.states[0].status).toBe('error');

      // Retry the failed image
      await act(async () => {
        const retryResult = await result.current.retry(
          'failed-1',
          'data:image/jpeg;base64,test'
        );
        expect(retryResult.success).toBe(true);
      });

      // State should be updated to ready
      expect(result.current.states[0].status).toBe('ready');
    });

    it('should throw error if image ID not found', async () => {
      const { result } = renderHook(() => useBatchProcessing());

      await expect(
        act(async () => {
          await result.current.retry('non-existent-id', 'data:image/jpeg;base64,test');
        })
      ).rejects.toThrow('Image with ID non-existent-id not found');
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const tx = createMockTransaction('Store', 1000);
      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([{ id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx }]);
        return [{ id: 'test-1', index: 0, success: true, result: tx }];
      });

      const { result } = renderHook(() => useBatchProcessing());

      // Process something
      await act(async () => {
        await result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      // Verify state has data
      expect(result.current.states.length).toBeGreaterThan(0);
      expect(result.current.results.length).toBeGreaterThan(0);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify state is cleared
      expect(result.current.states).toEqual([]);
      expect(result.current.results).toEqual([]);
      expect(result.current.progress).toEqual({ current: 0, total: 0 });
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('computed values', () => {
    it('should compute summary correctly', async () => {
      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([
          { id: '1', index: 0, status: 'ready', progress: 100 },
          { id: '2', index: 1, status: 'error', progress: 0 },
        ]);
        return [
          { id: '1', index: 0, success: true },
          { id: '2', index: 1, success: false, error: 'Failed' },
        ];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
          'CLP'
        );
      });

      expect(result.current.summary.total).toBe(2);
      expect(result.current.summary.ready).toBe(1);
      expect(result.current.summary.error).toBe(1);
    });

    it('should compute isComplete correctly', async () => {
      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([{ id: '1', index: 0, status: 'ready', progress: 100 }]);
        return [{ id: '1', index: 0, success: true }];
      });

      const { result } = renderHook(() => useBatchProcessing());

      // Initially not complete
      expect(result.current.isComplete).toBe(false);

      await act(async () => {
        await result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      // After processing completes
      expect(result.current.isComplete).toBe(true);
    });

    it('should compute successfulTransactions correctly', async () => {
      const tx1 = createMockTransaction('Store 1', 1000);
      const tx2 = createMockTransaction('Store 2', 2000);

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([
          { id: '1', index: 0, status: 'ready', progress: 100, result: tx1 },
          { id: '2', index: 1, status: 'error', progress: 0, error: 'Failed' },
          { id: '3', index: 2, status: 'ready', progress: 100, result: tx2 },
        ]);
        return [
          { id: '1', index: 0, success: true, result: tx1 },
          { id: '2', index: 1, success: false, error: 'Failed' },
          { id: '3', index: 2, success: true, result: tx2 },
        ];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          [
            'data:image/jpeg;base64,test1',
            'data:image/jpeg;base64,test2',
            'data:image/jpeg;base64,test3',
          ],
          'CLP'
        );
      });

      expect(result.current.successfulTransactions).toHaveLength(2);
      expect(result.current.successfulTransactions[0]).toEqual(tx1);
      expect(result.current.successfulTransactions[1]).toEqual(tx2);
    });

    it('should compute failedStates correctly', async () => {
      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([
          { id: '1', index: 0, status: 'ready', progress: 100 },
          { id: '2', index: 1, status: 'error', progress: 0, error: 'Error 1' },
          { id: '3', index: 2, status: 'error', progress: 0, error: 'Error 2' },
        ]);
        return [
          { id: '1', index: 0, success: true },
          { id: '2', index: 1, success: false, error: 'Error 1' },
          { id: '3', index: 2, success: false, error: 'Error 2' },
        ];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          [
            'data:image/jpeg;base64,test1',
            'data:image/jpeg;base64,test2',
            'data:image/jpeg;base64,test3',
          ],
          'CLP'
        );
      });

      expect(result.current.failedStates).toHaveLength(2);
      expect(result.current.failedStates[0].error).toBe('Error 1');
      expect(result.current.failedStates[1].error).toBe('Error 2');
    });
  });

  describe('concurrency limit', () => {
    it('should use custom concurrency limit', async () => {
      mockProcessImagesInParallel.mockResolvedValue([]);

      const { result } = renderHook(() => useBatchProcessing(5));

      await act(async () => {
        await result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      expect(mockProcessImagesInParallel).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ concurrencyLimit: 5 }),
        expect.any(Function),
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should default to 3 concurrent workers', async () => {
      mockProcessImagesInParallel.mockResolvedValue([]);

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      expect(mockProcessImagesInParallel).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ concurrencyLimit: 3 }),
        expect.any(Function),
        expect.any(Function),
        expect.any(Object)
      );
    });
  });
});
