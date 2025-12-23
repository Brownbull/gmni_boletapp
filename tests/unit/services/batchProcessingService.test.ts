/**
 * Story 12.2: Parallel Processing Service - Unit Tests
 *
 * Tests for the batch processing service that handles parallel
 * image processing with concurrency limiting.
 *
 * @see docs/sprint-artifacts/epic12/story-12.2-parallel-processing-service.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  processImagesInParallel,
  retryImage,
  getBatchSummary,
  isBatchComplete,
  getSuccessfulTransactions,
  getFailedStates,
  calculateTotalProcessingTime,
  ImageProcessingState,
  BatchProcessingOptions,
} from '../../../src/services/batchProcessingService';
import * as geminiService from '../../../src/services/gemini';
import type { Transaction } from '../../../src/types/transaction';

// Mock the gemini service
vi.mock('../../../src/services/gemini', () => ({
  analyzeReceipt: vi.fn(),
}));

describe('batchProcessingService', () => {
  const mockAnalyzeReceipt = vi.mocked(geminiService.analyzeReceipt);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Create a mock transaction result
  const createMockTransaction = (merchant: string, total: number): Transaction => ({
    merchant,
    total,
    date: '2024-12-22',
    category: 'Supermarket',
    items: [],
  });

  describe('processImagesInParallel', () => {
    const testImages = ['data:image/jpeg;base64,abc', 'data:image/jpeg;base64,def'];
    const defaultOptions: BatchProcessingOptions = {
      currency: 'CLP',
      concurrencyLimit: 3,
    };

    it('should process all images successfully', async () => {
      const tx1 = createMockTransaction('Store 1', 1000);
      const tx2 = createMockTransaction('Store 2', 2000);

      mockAnalyzeReceipt
        .mockResolvedValueOnce(tx1)
        .mockResolvedValueOnce(tx2);

      const results = await processImagesInParallel(testImages, defaultOptions);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toEqual(tx1);
      expect(results[1].success).toBe(true);
      expect(results[1].result).toEqual(tx2);
    });

    it('should handle individual errors without blocking others (AC #4)', async () => {
      const tx2 = createMockTransaction('Store 2', 2000);

      mockAnalyzeReceipt
        .mockRejectedValueOnce(new Error('Failed to process'))
        .mockResolvedValueOnce(tx2);

      const results = await processImagesInParallel(testImages, defaultOptions);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Failed to process');
      expect(results[1].success).toBe(true);
      expect(results[1].result).toEqual(tx2);
    });

    it('should respect concurrency limit (AC #1)', async () => {
      const images = Array(5).fill('data:image/jpeg;base64,test');
      let activeCount = 0;
      let maxActive = 0;

      mockAnalyzeReceipt.mockImplementation(async () => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
        await new Promise((r) => setTimeout(r, 10)); // Simulate processing time
        activeCount--;
        return createMockTransaction('Store', 1000);
      });

      await processImagesInParallel(images, { ...defaultOptions, concurrencyLimit: 3 });

      expect(maxActive).toBeLessThanOrEqual(3);
    });

    it('should call status callback with state updates (AC #2)', async () => {
      const statusCallback = vi.fn();
      const tx1 = createMockTransaction('Store 1', 1000);

      mockAnalyzeReceipt.mockResolvedValue(tx1);

      await processImagesInParallel(
        ['data:image/jpeg;base64,test'],
        defaultOptions,
        statusCallback
      );

      // Should be called multiple times (initial, processing, ready)
      expect(statusCallback).toHaveBeenCalled();

      // Get the final state
      const lastCall = statusCallback.mock.calls[statusCallback.mock.calls.length - 1];
      const finalStates = lastCall[0];
      expect(finalStates[0].status).toBe('ready');
    });

    it('should call progress callback (AC #3)', async () => {
      const progressCallback = vi.fn();
      const tx = createMockTransaction('Store', 1000);

      mockAnalyzeReceipt.mockResolvedValue(tx);

      await processImagesInParallel(
        testImages,
        defaultOptions,
        undefined,
        progressCallback
      );

      // Should be called with initial (0), and after each completion
      expect(progressCallback).toHaveBeenCalledWith(0, 2);
      expect(progressCallback).toHaveBeenCalledWith(1, 2);
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });

    it('should handle cancellation (AC #5)', async () => {
      const images = Array(5).fill('data:image/jpeg;base64,test');
      const abortController = new AbortController();
      let processedCount = 0;

      mockAnalyzeReceipt.mockImplementation(async () => {
        processedCount++;
        if (processedCount === 2) {
          // Cancel after 2 images start
          abortController.abort();
        }
        await new Promise((r) => setTimeout(r, 10));
        return createMockTransaction('Store', 1000);
      });

      const results = await processImagesInParallel(
        images,
        { ...defaultOptions, concurrencyLimit: 1 }, // Limit to 1 for predictable ordering
        undefined,
        undefined,
        abortController.signal
      );

      // Some images should have been processed
      expect(results.length).toBeLessThan(5);
    });

    it('should pass receiptType to analyzeReceipt when not auto', async () => {
      const tx = createMockTransaction('Store', 1000);
      mockAnalyzeReceipt.mockResolvedValue(tx);

      const options: BatchProcessingOptions = {
        currency: 'CLP',
        receiptType: 'supermarket',
      };

      await processImagesInParallel(['data:image/jpeg;base64,test'], options);

      expect(mockAnalyzeReceipt).toHaveBeenCalledWith(
        ['data:image/jpeg;base64,test'],
        'CLP',
        'supermarket'
      );
    });

    it('should not pass receiptType when set to auto', async () => {
      const tx = createMockTransaction('Store', 1000);
      mockAnalyzeReceipt.mockResolvedValue(tx);

      const options: BatchProcessingOptions = {
        currency: 'CLP',
        receiptType: 'auto',
      };

      await processImagesInParallel(['data:image/jpeg;base64,test'], options);

      expect(mockAnalyzeReceipt).toHaveBeenCalledWith(
        ['data:image/jpeg;base64,test'],
        'CLP',
        undefined
      );
    });
  });

  describe('retryImage', () => {
    it('should retry and return success', async () => {
      const tx = createMockTransaction('Retry Store', 3000);
      mockAnalyzeReceipt.mockResolvedValue(tx);

      const result = await retryImage('data:image/jpeg;base64,test', {
        currency: 'CLP',
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual(tx);
    });

    it('should retry and return error on failure', async () => {
      mockAnalyzeReceipt.mockRejectedValue(new Error('Retry failed'));

      const result = await retryImage('data:image/jpeg;base64,test', {
        currency: 'CLP',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Retry failed');
    });
  });

  describe('getBatchSummary', () => {
    it('should calculate summary correctly', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'ready', progress: 100 },
        { id: '2', index: 1, status: 'ready', progress: 100 },
        { id: '3', index: 2, status: 'error', progress: 0, error: 'Failed' },
        { id: '4', index: 3, status: 'processing', progress: 50 },
        { id: '5', index: 4, status: 'pending', progress: 0 },
      ];

      const summary = getBatchSummary(states);

      expect(summary.total).toBe(5);
      expect(summary.ready).toBe(2);
      expect(summary.error).toBe(1);
      expect(summary.processing).toBe(1);
      expect(summary.pending).toBe(1);
      expect(summary.percentComplete).toBe(60); // 3/5 = 60%
    });

    it('should return 0% for empty states', () => {
      const summary = getBatchSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.percentComplete).toBe(0);
    });

    it('should count uploading as pending', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'uploading', progress: 30 },
      ];

      const summary = getBatchSummary(states);

      expect(summary.pending).toBe(1);
      expect(summary.processing).toBe(0);
    });
  });

  describe('isBatchComplete', () => {
    it('should return true when all images are in terminal state', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'ready', progress: 100 },
        { id: '2', index: 1, status: 'error', progress: 0 },
      ];

      expect(isBatchComplete(states)).toBe(true);
    });

    it('should return false when some images are still processing', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'ready', progress: 100 },
        { id: '2', index: 1, status: 'processing', progress: 50 },
      ];

      expect(isBatchComplete(states)).toBe(false);
    });

    it('should return false when some images are pending', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'ready', progress: 100 },
        { id: '2', index: 1, status: 'pending', progress: 0 },
      ];

      expect(isBatchComplete(states)).toBe(false);
    });
  });

  describe('getSuccessfulTransactions', () => {
    it('should return only ready transactions with results', () => {
      const tx1 = createMockTransaction('Store 1', 1000);
      const tx2 = createMockTransaction('Store 2', 2000);

      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'ready', progress: 100, result: tx1 },
        { id: '2', index: 1, status: 'error', progress: 0, error: 'Failed' },
        { id: '3', index: 2, status: 'ready', progress: 100, result: tx2 },
      ];

      const transactions = getSuccessfulTransactions(states);

      expect(transactions).toHaveLength(2);
      expect(transactions[0]).toEqual(tx1);
      expect(transactions[1]).toEqual(tx2);
    });

    it('should return empty array when no successful transactions', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'error', progress: 0, error: 'Failed' },
        { id: '2', index: 1, status: 'processing', progress: 50 },
      ];

      const transactions = getSuccessfulTransactions(states);

      expect(transactions).toHaveLength(0);
    });
  });

  describe('getFailedStates', () => {
    it('should return only error states', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'ready', progress: 100 },
        { id: '2', index: 1, status: 'error', progress: 0, error: 'Failed 1' },
        { id: '3', index: 2, status: 'error', progress: 0, error: 'Failed 2' },
      ];

      const failed = getFailedStates(states);

      expect(failed).toHaveLength(2);
      expect(failed[0].error).toBe('Failed 1');
      expect(failed[1].error).toBe('Failed 2');
    });

    it('should return empty array when no failures', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'ready', progress: 100 },
        { id: '2', index: 1, status: 'processing', progress: 50 },
      ];

      const failed = getFailedStates(states);

      expect(failed).toHaveLength(0);
    });
  });

  describe('calculateTotalProcessingTime', () => {
    it('should calculate total time for completed items', () => {
      const now = new Date();
      const oneSecondAgo = new Date(now.getTime() - 1000);
      const twoSecondsAgo = new Date(now.getTime() - 2000);
      const threeSecondsAgo = new Date(now.getTime() - 3000);

      const states: ImageProcessingState[] = [
        {
          id: '1',
          index: 0,
          status: 'ready',
          progress: 100,
          startedAt: twoSecondsAgo,
          completedAt: oneSecondAgo,
        },
        {
          id: '2',
          index: 1,
          status: 'ready',
          progress: 100,
          startedAt: threeSecondsAgo,
          completedAt: now,
        },
      ];

      const totalTime = calculateTotalProcessingTime(states);

      // First: 1000ms, Second: 3000ms = 4000ms
      expect(totalTime).toBe(4000);
    });

    it('should ignore items without timing', () => {
      const states: ImageProcessingState[] = [
        { id: '1', index: 0, status: 'pending', progress: 0 },
        { id: '2', index: 1, status: 'processing', progress: 50 },
      ];

      const totalTime = calculateTotalProcessingTime(states);

      expect(totalTime).toBe(0);
    });
  });
});
