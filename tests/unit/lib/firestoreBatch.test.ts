/**
 * firestoreBatch Tests
 *
 * Story 15-TD-2: Tests for auto-chunking and retry/backoff behavior
 * Story 15-TD-12: Tests for BatchResult return values and partial-commit reporting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockBatch = {
    delete: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
    writeBatch: vi.fn(() => ({ ...mockBatch, commit: mockBatch.commit })),
}));

import { writeBatch, type Firestore, type DocumentReference } from 'firebase/firestore';
import { batchDelete, batchWrite, FIRESTORE_BATCH_LIMIT, type BatchResult } from '../../../src/lib/firestoreBatch';

const mockWriteBatch = vi.mocked(writeBatch);

function createMockRef(id: string): DocumentReference {
    return { id } as DocumentReference;
}

describe('firestoreBatch', () => {
    const mockDb = {} as Firestore;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockBatch.commit.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('batchDelete', () => {
        it('should delete all refs in a single batch when under limit', async () => {
            const refs = [createMockRef('1'), createMockRef('2'), createMockRef('3')];

            const result = await batchDelete(mockDb, refs);

            expect(mockWriteBatch).toHaveBeenCalledTimes(1);
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                totalBatches: 1,
                succeededBatches: 1,
                failedBatches: 0,
                errors: [],
            });
        });

        it('should chunk into multiple batches when exceeding 500 limit', async () => {
            const refs = Array.from({ length: 750 }, (_, i) => createMockRef(`ref-${i}`));

            const result = await batchDelete(mockDb, refs);

            // 750 / 500 = 2 batches
            expect(mockWriteBatch).toHaveBeenCalledTimes(2);
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
            expect(result).toEqual({
                totalBatches: 2,
                succeededBatches: 2,
                failedBatches: 0,
                errors: [],
            });
        });

        it('should handle empty refs array', async () => {
            const result = await batchDelete(mockDb, []);

            expect(mockWriteBatch).not.toHaveBeenCalled();
            expect(mockBatch.commit).not.toHaveBeenCalled();
            expect(result).toEqual({
                totalBatches: 0,
                succeededBatches: 0,
                failedBatches: 0,
                errors: [],
            });
        });

        it('should handle exactly 500 refs in one batch', async () => {
            const refs = Array.from({ length: 500 }, (_, i) => createMockRef(`ref-${i}`));

            const result = await batchDelete(mockDb, refs);

            expect(mockWriteBatch).toHaveBeenCalledTimes(1);
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
            expect(result.totalBatches).toBe(1);
            expect(result.succeededBatches).toBe(1);
        });

        it('should handle 501 refs in two batches', async () => {
            const refs = Array.from({ length: 501 }, (_, i) => createMockRef(`ref-${i}`));

            const result = await batchDelete(mockDb, refs);

            expect(mockWriteBatch).toHaveBeenCalledTimes(2);
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
            expect(result.totalBatches).toBe(2);
            expect(result.succeededBatches).toBe(2);
        });
    });

    describe('batchWrite', () => {
        it('should call operation for each item and return result', async () => {
            const items = ['a', 'b', 'c'];
            const operation = vi.fn();

            const result = await batchWrite(mockDb, items, operation);

            expect(operation).toHaveBeenCalledTimes(3);
            expect(result).toEqual({
                totalBatches: 1,
                succeededBatches: 1,
                failedBatches: 0,
                errors: [],
            });
        });

        it('should chunk items exceeding limit', async () => {
            const items = Array.from({ length: 600 }, (_, i) => `item-${i}`);
            const operation = vi.fn();

            const result = await batchWrite(mockDb, items, operation);

            expect(mockWriteBatch).toHaveBeenCalledTimes(2);
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
            expect(operation).toHaveBeenCalledTimes(600);
            expect(result.totalBatches).toBe(2);
            expect(result.succeededBatches).toBe(2);
        });
    });

    describe('retry/backoff', () => {
        function retryableError(msg: string) {
            const err = new Error(msg) as Error & { code: string };
            err.code = 'unavailable';
            return err;
        }

        it('should retry once on transient commit failure then succeed', async () => {
            mockBatch.commit
                .mockRejectedValueOnce(retryableError('Network error'))
                .mockResolvedValueOnce(undefined);

            const refs = [createMockRef('1')];

            const promise = batchDelete(mockDb, refs);

            // Advance past the 1s retry delay
            await vi.advanceTimersByTimeAsync(1100);

            const result = await promise;

            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
            expect(result.succeededBatches).toBe(1);
            expect(result.failedBatches).toBe(0);
        });

        it('should throw after retry exhausted on transient error (single chunk = total failure)', async () => {
            vi.useRealTimers();

            mockBatch.commit
                .mockRejectedValueOnce(retryableError('Network error'))
                .mockRejectedValueOnce(retryableError('Still failing'));

            const refs = [createMockRef('1')];

            await expect(batchDelete(mockDb, refs)).rejects.toThrow('Still failing');
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);

            vi.useFakeTimers();
        });

        it('should throw immediately on non-retryable error (no retry)', async () => {
            const permError = new Error('Permission denied') as Error & { code: string };
            permError.code = 'permission-denied';

            mockBatch.commit.mockRejectedValueOnce(permError);

            const refs = [createMockRef('1')];

            await expect(batchDelete(mockDb, refs)).rejects.toThrow('Permission denied');
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
        });

        it('should not retry on first success', async () => {
            mockBatch.commit.mockResolvedValueOnce(undefined);

            const refs = [createMockRef('1')];
            const result = await batchDelete(mockDb, refs);

            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
            expect(result.succeededBatches).toBe(1);
        });

        it('should retry each chunk independently', async () => {
            // First chunk succeeds, second chunk needs retry
            mockBatch.commit
                .mockResolvedValueOnce(undefined)                // chunk 1 - success
                .mockRejectedValueOnce(retryableError('Fail'))   // chunk 2 - fail
                .mockResolvedValueOnce(undefined);               // chunk 2 retry - success

            const refs = Array.from({ length: 501 }, (_, i) => createMockRef(`ref-${i}`));

            const promise = batchDelete(mockDb, refs);
            await vi.advanceTimersByTimeAsync(1100);
            const result = await promise;

            expect(mockBatch.commit).toHaveBeenCalledTimes(3);
            expect(result.totalBatches).toBe(2);
            expect(result.succeededBatches).toBe(2);
            expect(result.failedBatches).toBe(0);
        });
    });

    describe('partial-commit results', () => {
        it('should return partial result when first chunk succeeds and second fails permanently', async () => {
            const permError = new Error('Permission denied') as Error & { code: string };
            permError.code = 'permission-denied';

            mockBatch.commit
                .mockResolvedValueOnce(undefined)    // chunk 1 - success
                .mockRejectedValueOnce(permError);   // chunk 2 - permanent failure (no retry)

            const refs = Array.from({ length: 501 }, (_, i) => createMockRef(`ref-${i}`));
            const result = await batchDelete(mockDb, refs);

            expect(result.totalBatches).toBe(2);
            expect(result.succeededBatches).toBe(1);
            expect(result.failedBatches).toBe(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe('Permission denied');
        });

        it('should throw when ALL chunks fail', async () => {
            const permError = new Error('Permission denied') as Error & { code: string };
            permError.code = 'permission-denied';
            mockBatch.commit.mockRejectedValue(permError);

            const refs = Array.from({ length: 501 }, (_, i) => createMockRef(`ref-${i}`));

            await expect(batchDelete(mockDb, refs)).rejects.toThrow('Permission denied');
        });

        it('should return partial result for batchWrite with partial failure', async () => {
            const err = new Error('Quota exceeded') as Error & { code: string };
            err.code = 'resource-exhausted';

            mockBatch.commit
                .mockResolvedValueOnce(undefined)   // chunk 1 - success
                .mockRejectedValueOnce(err)         // chunk 2 - fail
                .mockRejectedValueOnce(err);        // chunk 2 retry - fail again

            const items = Array.from({ length: 600 }, (_, i) => `item-${i}`);
            const operation = vi.fn();

            const promise = batchWrite(mockDb, items, operation);
            await vi.advanceTimersByTimeAsync(1100);
            const result = await promise;

            expect(result.totalBatches).toBe(2);
            expect(result.succeededBatches).toBe(1);
            expect(result.failedBatches).toBe(1);
            expect(result.errors[0].message).toBe('Quota exceeded');
        });

        it('should attach batchResult to error when all chunks fail', async () => {
            const permError = new Error('Denied') as Error & { code: string };
            permError.code = 'permission-denied';
            mockBatch.commit.mockRejectedValue(permError);

            const refs = Array.from({ length: 501 }, (_, i) => createMockRef(`ref-${i}`));

            try {
                await batchDelete(mockDb, refs);
                expect.fail('Should have thrown');
            } catch (error) {
                const err = error as Error & { batchResult?: BatchResult };
                expect(err.batchResult).toBeDefined();
                expect(err.batchResult!.totalBatches).toBe(2);
                expect(err.batchResult!.succeededBatches).toBe(0);
                expect(err.batchResult!.failedBatches).toBe(2);
            }
        });
    });

    it('should export FIRESTORE_BATCH_LIMIT as 500', () => {
        expect(FIRESTORE_BATCH_LIMIT).toBe(500);
    });
});
