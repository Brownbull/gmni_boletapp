/**
 * userCreditsService Addition Transaction Tests
 *
 * Story 15-TD-13: Verify addAndSaveCredits/addAndSaveSuperCredits use
 * runTransaction to prevent lost updates from concurrent additions (TOCTOU fix)
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
    addAndSaveCredits,
    addAndSaveSuperCredits,
} from '../../../src/services/userCreditsService';
import type { UserCredits } from '../../../src/types/scan';

const mockRunTransaction = vi.mocked(runTransaction);

describe('addAndSaveCredits - TOCTOU transaction safety', () => {
    const mockDb = {} as Firestore;
    const userId = 'test-user';
    const appId = 'test-app';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should use runTransaction for atomic credit addition', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 10,
                used: 5,
                superRemaining: 3,
                superUsed: 2,
            }),
        });

        await addAndSaveCredits(mockDb, userId, appId, 5);

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-credits-ref');
    });

    it('should add to fresh balance from transaction read', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 3,
                used: 7,
                superRemaining: 5,
                superUsed: 0,
            }),
        });

        const result = await addAndSaveCredits(mockDb, userId, appId, 5);

        expect(result.remaining).toBe(8);
        expect(result.used).toBe(7); // used doesn't change on addition
        expect(result.superRemaining).toBe(5); // super unchanged
        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-credits-ref',
            expect.objectContaining({
                remaining: 8,
                used: 7,
                updatedAt: 'mock-server-timestamp',
            }),
            { merge: true }
        );
    });

    it('should use DEFAULT_CREDITS when doc does not exist', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => false,
        });

        const result = await addAndSaveCredits(mockDb, userId, appId, 5);

        // DEFAULT_CREDITS has remaining: 1200
        expect(result.remaining).toBe(1205);
    });

    it('should throw on non-positive amount', async () => {
        await expect(addAndSaveCredits(mockDb, userId, appId, 0)).rejects.toThrow(
            'Amount must be a positive integer'
        );
        await expect(addAndSaveCredits(mockDb, userId, appId, -1)).rejects.toThrow(
            'Amount must be a positive integer'
        );
    });

    it('should throw on non-integer amount', async () => {
        await expect(addAndSaveCredits(mockDb, userId, appId, 1.5)).rejects.toThrow(
            'Amount must be a positive integer'
        );
    });

    it('should throw on NaN/Infinity', async () => {
        await expect(addAndSaveCredits(mockDb, userId, appId, NaN)).rejects.toThrow(
            'Amount must be a positive integer'
        );
        await expect(addAndSaveCredits(mockDb, userId, appId, Infinity)).rejects.toThrow(
            'Amount must be a positive integer'
        );
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

        await addAndSaveCredits(mockDb, userId, appId, 10);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-credits-ref',
            expect.objectContaining({
                remaining: 15,
                used: 5,
                superRemaining: 3,
                superUsed: 2,
                updatedAt: 'mock-server-timestamp',
            }),
            { merge: true }
        );
    });
});

describe('addAndSaveSuperCredits - TOCTOU transaction safety', () => {
    const mockDb = {} as Firestore;
    const userId = 'test-user';
    const appId = 'test-app';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should use runTransaction for atomic super credit addition', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 10,
                used: 0,
                superRemaining: 5,
                superUsed: 0,
            }),
        });

        await addAndSaveSuperCredits(mockDb, userId, appId, 3);

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-credits-ref');
    });

    it('should add super credits from fresh balance', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 10,
                used: 0,
                superRemaining: 2,
                superUsed: 3,
            }),
        });

        const result = await addAndSaveSuperCredits(mockDb, userId, appId, 5);

        expect(result.superRemaining).toBe(7);
        expect(result.superUsed).toBe(3); // superUsed doesn't change on addition
        expect(result.remaining).toBe(10); // normal credits unchanged
    });

    it('should throw on non-positive amount', async () => {
        await expect(addAndSaveSuperCredits(mockDb, userId, appId, 0)).rejects.toThrow(
            'Amount must be a positive integer'
        );
        await expect(addAndSaveSuperCredits(mockDb, userId, appId, -1)).rejects.toThrow(
            'Amount must be a positive integer'
        );
    });

    it('should persist super credits with serverTimestamp', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                remaining: 10,
                used: 0,
                superRemaining: 1,
                superUsed: 4,
            }),
        });

        await addAndSaveSuperCredits(mockDb, userId, appId, 2);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-credits-ref',
            expect.objectContaining({
                remaining: 10,
                used: 0,
                superRemaining: 3,
                superUsed: 4,
                updatedAt: 'mock-server-timestamp',
            }),
            { merge: true }
        );
    });
});
