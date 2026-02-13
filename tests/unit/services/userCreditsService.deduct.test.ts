/**
 * userCreditsService Deduction Transaction Tests
 *
 * Story 15-TD-1: Verify deductAndSaveCredits uses runTransaction
 * to prevent overdraft from concurrent deductions (TOCTOU fix)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => 'mock-credits-ref'),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
    runTransaction: vi.fn((_db, fn) => fn(mockTransaction)),
}));

vi.mock('@/lib/firestorePaths', () => ({
    creditsDocSegments: vi.fn(() => ['test', 'path']),
}));

import { runTransaction, type Firestore } from 'firebase/firestore';
import {
    deductAndSaveCredits,
    deductAndSaveSuperCredits,
} from '../../../src/services/userCreditsService';
const mockRunTransaction = vi.mocked(runTransaction);

describe('deductAndSaveCredits - TOCTOU transaction safety', () => {
    const mockDb = {} as Firestore;
    const userId = 'test-user';
    const appId = 'test-app';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should use runTransaction for atomic credit deduction', async () => {
        // Fresh balance from transaction read
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 10,
                used: 0,
                superRemaining: 5,
                superUsed: 0,
            }),
        });

        await deductAndSaveCredits(mockDb, userId, appId, 1);

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-credits-ref');
    });

    it('should deduct from fresh balance read inside transaction', async () => {
        // Fresh read shows 3 remaining (concurrent deductions happened)
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 3,
                used: 7,
                superRemaining: 5,
                superUsed: 0,
            }),
        });

        const result = await deductAndSaveCredits(mockDb, userId, appId, 1);

        // Should deduct from 3 (fresh balance from transaction read)
        expect(result.remaining).toBe(2);
        expect(result.used).toBe(8);
        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-credits-ref',
            expect.objectContaining({
                remaining: 2,
                used: 8,
            }),
            { merge: true }
        );
    });

    it('should throw insufficient credits based on fresh balance', async () => {
        // Stale parameter shows 10 remaining, but fresh read shows 0
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 0,
                used: 10,
                superRemaining: 5,
                superUsed: 0,
            }),
        });

        await expect(
            deductAndSaveCredits(mockDb, userId, appId, 1)
        ).rejects.toThrow('Insufficient credits');
    });

    it('should use DEFAULT_CREDITS when doc does not exist', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => false,
        });

        const result = await deductAndSaveCredits(mockDb, userId, appId, 1);

        // DEFAULT_CREDITS has remaining: 1200
        expect(result.remaining).toBe(1199);
        expect(result.used).toBe(1);
    });

    it('should persist with serverTimestamp via transaction.set', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 5,
                used: 5,
                superRemaining: 3,
                superUsed: 2,
            }),
        });

        await deductAndSaveCredits(mockDb, userId, appId, 2);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-credits-ref',
            expect.objectContaining({
                remaining: 3,
                used: 7,
                superRemaining: 3,
                superUsed: 2,
                updatedAt: 'mock-server-timestamp',
            }),
            { merge: true }
        );
    });
});

describe('deductAndSaveSuperCredits - TOCTOU transaction safety', () => {
    const mockDb = {} as Firestore;
    const userId = 'test-user';
    const appId = 'test-app';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should use runTransaction for atomic super credit deduction', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 10,
                used: 0,
                superRemaining: 5,
                superUsed: 0,
            }),
        });

        await deductAndSaveSuperCredits(mockDb, userId, appId, 1);

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-credits-ref');
    });

    it('should deduct super credits from fresh balance', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 10,
                used: 0,
                superRemaining: 2,
                superUsed: 3,
            }),
        });

        const result = await deductAndSaveSuperCredits(mockDb, userId, appId, 1);

        expect(result.superRemaining).toBe(1);
        expect(result.superUsed).toBe(4);
        // Normal credits unchanged
        expect(result.remaining).toBe(10);
    });

    it('should throw insufficient super credits based on fresh balance', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 10,
                used: 0,
                superRemaining: 0,
                superUsed: 5,
            }),
        });

        await expect(
            deductAndSaveSuperCredits(mockDb, userId, appId, 1)
        ).rejects.toThrow('Insufficient super credits');
    });
});
