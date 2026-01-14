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
      // Story 14.30.8: Use pending promise instead of setTimeout to avoid real delay in CI
      // The test verifies that a second call returns [] while first is still processing
      let resolveProcessing: (value: batchProcessingService.ProcessingResult[]) => void;
      mockProcessImagesInParallel.mockImplementation(
        () => new Promise((resolve) => { resolveProcessing = resolve; })
      );

      const { result } = renderHook(() => useBatchProcessing());

      // Start first processing (will be pending)
      act(() => {
        result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      // Try to start second processing while first is still running
      let secondResult: batchProcessingService.ProcessingResult[] = [];
      await act(async () => {
        secondResult = await result.current.startProcessing(
          ['data:image/jpeg;base64,test2'],
          'CLP'
        );
      });

      // Second call should return empty (blocked by isProcessing guard)
      expect(secondResult).toEqual([]);
      // Should only have been called once
      expect(mockProcessImagesInParallel).toHaveBeenCalledTimes(1);

      // Cleanup: resolve the pending promise to avoid hanging test
      await act(async () => {
        resolveProcessing([]);
      });
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
      // Story 14.30.8: Use pending promise instead of setTimeout to avoid delay in CI
      let abortSignal: AbortSignal | undefined;
      let resolveProcessing: () => void;

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus, onProgress, signal) => {
        abortSignal = signal;
        // Create a promise that we control - no real delay needed
        await new Promise<void>((resolve) => { resolveProcessing = resolve; });
        return [];
      });

      const { result } = renderHook(() => useBatchProcessing());

      act(() => {
        result.current.startProcessing(['data:image/jpeg;base64,test'], 'CLP');
      });

      // Cancel should set aborted immediately (synchronous)
      act(() => {
        result.current.cancel();
      });

      // The abort signal should be set immediately after cancel()
      expect(abortSignal?.aborted).toBe(true);

      // Cleanup: resolve the pending promise
      await act(async () => {
        resolveProcessing();
      });
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

  /**
   * Story 14d.5b: Callback integration tests for ScanContext integration.
   * These test that the callbacks are called correctly during processing.
   */
  describe('callbacks (Story 14d.5b)', () => {
    it('should call onItemStart when processing begins for an item', async () => {
      const tx = createMockTransaction('Store', 1000);
      const onItemStart = vi.fn();

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        // Simulate item starting
        onStatus?.([
          { id: 'test-1', index: 0, status: 'processing', progress: 0 },
          { id: 'test-2', index: 1, status: 'pending', progress: 0 },
        ]);
        // Simulate item completing
        onStatus?.([
          { id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx },
          { id: 'test-2', index: 1, status: 'processing', progress: 0 },
        ]);
        return [
          { id: 'test-1', index: 0, success: true, result: tx },
          { id: 'test-2', index: 1, success: true, result: tx },
        ];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
          'CLP',
          undefined,
          { onItemStart }
        );
      });

      // Should be called once for each item when it starts processing
      expect(onItemStart).toHaveBeenCalledWith(0);
      expect(onItemStart).toHaveBeenCalledWith(1);
    });

    it('should call onItemSuccess when processing succeeds for an item', async () => {
      const tx1 = createMockTransaction('Store 1', 1000);
      const tx2 = createMockTransaction('Store 2', 2000);
      const onItemSuccess = vi.fn();

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([
          { id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx1 },
          { id: 'test-2', index: 1, status: 'ready', progress: 100, result: tx2 },
        ]);
        return [
          { id: 'test-1', index: 0, success: true, result: tx1 },
          { id: 'test-2', index: 1, success: true, result: tx2 },
        ];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
          'CLP',
          undefined,
          { onItemSuccess }
        );
      });

      expect(onItemSuccess).toHaveBeenCalledWith(0, tx1);
      expect(onItemSuccess).toHaveBeenCalledWith(1, tx2);
    });

    it('should call onItemError when processing fails for an item', async () => {
      const tx = createMockTransaction('Store', 1000);
      const onItemError = vi.fn();

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([
          { id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx },
          { id: 'test-2', index: 1, status: 'error', progress: 0, error: 'API Error' },
        ]);
        return [
          { id: 'test-1', index: 0, success: true, result: tx },
          { id: 'test-2', index: 1, success: false, error: 'API Error' },
        ];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
          'CLP',
          undefined,
          { onItemError }
        );
      });

      expect(onItemError).toHaveBeenCalledWith(1, 'API Error');
      expect(onItemError).not.toHaveBeenCalledWith(0, expect.anything());
    });

    it('should call onComplete with results and images when all processing finishes', async () => {
      const tx = createMockTransaction('Store', 1000);
      const onComplete = vi.fn();
      const testImage = 'data:image/jpeg;base64,test';

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([
          { id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx },
        ]);
        return [{ id: 'test-1', index: 0, success: true, result: tx }];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          [testImage],
          'CLP',
          undefined,
          { onComplete }
        );
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      // Story 14d.5: onComplete now receives (results, images) for atomic batchReceipts creation
      expect(onComplete).toHaveBeenCalledWith(
        [{ id: 'test-1', index: 0, success: true, result: tx }],
        [testImage]
      );
    });

    it('should only call each callback once per item (deduplication)', async () => {
      const tx = createMockTransaction('Store', 1000);
      const onItemStart = vi.fn();
      const onItemSuccess = vi.fn();

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        // Simulate multiple state updates for the same item
        onStatus?.([{ id: 'test-1', index: 0, status: 'processing', progress: 0 }]);
        onStatus?.([{ id: 'test-1', index: 0, status: 'processing', progress: 50 }]);
        onStatus?.([{ id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx }]);
        onStatus?.([{ id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx }]); // Duplicate
        return [{ id: 'test-1', index: 0, success: true, result: tx }];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          ['data:image/jpeg;base64,test'],
          'CLP',
          undefined,
          { onItemStart, onItemSuccess }
        );
      });

      // Should only be called once per item despite multiple status updates
      expect(onItemStart).toHaveBeenCalledTimes(1);
      expect(onItemSuccess).toHaveBeenCalledTimes(1);
    });

    it('should work with all callbacks provided', async () => {
      const tx = createMockTransaction('Store', 1000);
      const onItemStart = vi.fn();
      const onItemSuccess = vi.fn();
      const onItemError = vi.fn();
      const onComplete = vi.fn();

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([
          { id: 'test-1', index: 0, status: 'processing', progress: 0 },
          { id: 'test-2', index: 1, status: 'pending', progress: 0 },
        ]);
        onStatus?.([
          { id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx },
          { id: 'test-2', index: 1, status: 'error', progress: 0, error: 'Failed' },
        ]);
        return [
          { id: 'test-1', index: 0, success: true, result: tx },
          { id: 'test-2', index: 1, success: false, error: 'Failed' },
        ];
      });

      const { result } = renderHook(() => useBatchProcessing());

      await act(async () => {
        await result.current.startProcessing(
          ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
          'CLP',
          undefined,
          { onItemStart, onItemSuccess, onItemError, onComplete }
        );
      });

      expect(onItemStart).toHaveBeenCalledWith(0);
      expect(onItemSuccess).toHaveBeenCalledWith(0, tx);
      expect(onItemError).toHaveBeenCalledWith(1, 'Failed');
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should work without callbacks (backward compatibility)', async () => {
      const tx = createMockTransaction('Store', 1000);

      mockProcessImagesInParallel.mockImplementation(async (images, options, onStatus) => {
        onStatus?.([{ id: 'test-1', index: 0, status: 'ready', progress: 100, result: tx }]);
        return [{ id: 'test-1', index: 0, success: true, result: tx }];
      });

      const { result } = renderHook(() => useBatchProcessing());

      // Should not throw when no callbacks provided
      await act(async () => {
        const results = await result.current.startProcessing(
          ['data:image/jpeg;base64,test'],
          'CLP'
        );
        expect(results).toHaveLength(1);
      });
    });
  });
});
