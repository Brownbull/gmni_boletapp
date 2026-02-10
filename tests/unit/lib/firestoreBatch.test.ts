/**
 * firestoreBatch Tests
 *
 * Story 15-TD-2: Tests for auto-chunking and retry/backoff behavior
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
import { batchDelete, batchWrite, FIRESTORE_BATCH_LIMIT } from '../../../src/lib/firestoreBatch';

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

            await batchDelete(mockDb, refs);

            expect(mockWriteBatch).toHaveBeenCalledTimes(1);
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
        });

        it('should chunk into multiple batches when exceeding 500 limit', async () => {
            const refs = Array.from({ length: 750 }, (_, i) => createMockRef(`ref-${i}`));

            await batchDelete(mockDb, refs);

            // 750 / 500 = 2 batches
            expect(mockWriteBatch).toHaveBeenCalledTimes(2);
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
        });

        it('should handle empty refs array', async () => {
            await batchDelete(mockDb, []);

            expect(mockWriteBatch).not.toHaveBeenCalled();
            expect(mockBatch.commit).not.toHaveBeenCalled();
        });

        it('should handle exactly 500 refs in one batch', async () => {
            const refs = Array.from({ length: 500 }, (_, i) => createMockRef(`ref-${i}`));

            await batchDelete(mockDb, refs);

            expect(mockWriteBatch).toHaveBeenCalledTimes(1);
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
        });

        it('should handle 501 refs in two batches', async () => {
            const refs = Array.from({ length: 501 }, (_, i) => createMockRef(`ref-${i}`));

            await batchDelete(mockDb, refs);

            expect(mockWriteBatch).toHaveBeenCalledTimes(2);
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
        });
    });

    describe('batchWrite', () => {
        it('should call operation for each item', async () => {
            const items = ['a', 'b', 'c'];
            const operation = vi.fn();

            await batchWrite(mockDb, items, operation);

            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should chunk items exceeding limit', async () => {
            const items = Array.from({ length: 600 }, (_, i) => `item-${i}`);
            const operation = vi.fn();

            await batchWrite(mockDb, items, operation);

            expect(mockWriteBatch).toHaveBeenCalledTimes(2);
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
            expect(operation).toHaveBeenCalledTimes(600);
        });
    });

    describe('retry/backoff', () => {
        it('should retry once on commit failure then succeed', async () => {
            mockBatch.commit
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(undefined);

            const refs = [createMockRef('1')];

            const promise = batchDelete(mockDb, refs);

            // Advance past the 1s retry delay
            await vi.advanceTimersByTimeAsync(1100);

            await promise;

            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
        });

        it('should throw after retry exhausted', async () => {
            vi.useRealTimers(); // Use real timers for rejection test to avoid unhandled rejection

            mockBatch.commit
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Still failing'));

            const refs = [createMockRef('1')];

            await expect(batchDelete(mockDb, refs)).rejects.toThrow('Still failing');
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);

            vi.useFakeTimers(); // Restore for other tests
        });

        it('should not retry on first success', async () => {
            mockBatch.commit.mockResolvedValueOnce(undefined);

            const refs = [createMockRef('1')];
            await batchDelete(mockDb, refs);

            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
        });

        it('should retry each chunk independently', async () => {
            // First chunk succeeds, second chunk needs retry
            mockBatch.commit
                .mockResolvedValueOnce(undefined)        // chunk 1 - success
                .mockRejectedValueOnce(new Error('Fail')) // chunk 2 - fail
                .mockResolvedValueOnce(undefined);        // chunk 2 retry - success

            const refs = Array.from({ length: 501 }, (_, i) => createMockRef(`ref-${i}`));

            const promise = batchDelete(mockDb, refs);
            await vi.advanceTimersByTimeAsync(1100);
            await promise;

            expect(mockBatch.commit).toHaveBeenCalledTimes(3); // 1 + 1 + 1 retry
        });
    });

    it('should export FIRESTORE_BATCH_LIMIT as 500', () => {
        expect(FIRESTORE_BATCH_LIMIT).toBe(500);
    });
});
