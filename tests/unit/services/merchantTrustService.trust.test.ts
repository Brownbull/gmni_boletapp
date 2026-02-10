/**
 * merchantTrustService trust/decline/revoke Transaction Tests
 *
 * Story 15-TD-11: Verify trustMerchant, declineTrust, revokeTrust use
 * runTransaction for TOCTOU safety (matching TD-1 recordScan pattern)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    runTransaction: vi.fn((_db, fn) => fn(mockTransaction)),
}));

vi.mock('@/utils/sanitize', () => ({
    sanitizeMerchantName: vi.fn((name: string) => name),
}));

vi.mock('@/lib/firestorePaths', () => ({
    trustedMerchantsPath: vi.fn(() => 'test/path'),
}));

import { runTransaction, updateDoc, type Firestore } from 'firebase/firestore';
import {
    trustMerchant,
    declineTrust,
    revokeTrust,
} from '../../../src/services/merchantTrustService';

const mockRunTransaction = vi.mocked(runTransaction);
const mockUpdateDoc = vi.mocked(updateDoc);

// --- Test helpers ---

function createMockMerchantData(overrides: Record<string, unknown> = {}) {
    return {
        trusted: false,
        declined: false,
        merchantName: 'Jumbo',
        normalizedName: 'jumbo',
        scanCount: 5,
        editCount: 0,
        editRate: 0,
        ...overrides,
    };
}

function mockExistingDoc(overrides: Record<string, unknown> = {}) {
    mockTransaction.get.mockResolvedValueOnce({
        exists: () => true,
        id: 'jumbo',
        data: () => createMockMerchantData(overrides),
    });
}

function mockMissingDoc() {
    mockTransaction.get.mockResolvedValueOnce({
        exists: () => false,
        id: 'nonexistent',
    });
}

// --- Shared setup ---

const mockDb = {} as Firestore;
const userId = 'test-user';
const appId = 'test-app';

beforeEach(() => {
    vi.resetAllMocks();
    mockRunTransaction.mockImplementation((_db, fn) => fn(mockTransaction));
});

// --- Tests ---

describe('trustMerchant - TOCTOU transaction safety', () => {
    it('should use runTransaction instead of standalone updateDoc', async () => {
        mockExistingDoc();

        await trustMerchant(mockDb, userId, appId, 'Jumbo');

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-doc-ref');
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should set trusted=true and declined=false inside transaction', async () => {
        mockExistingDoc();

        await trustMerchant(mockDb, userId, appId, 'Jumbo');

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                trusted: true,
                declined: false,
                trustedAt: 'mock-server-timestamp',
                promptShownAt: 'mock-server-timestamp',
                updatedAt: 'mock-server-timestamp',
            })
        );
    });

    it('should throw if merchant doc does not exist', async () => {
        mockMissingDoc();

        await expect(
            trustMerchant(mockDb, userId, appId, 'NonExistent')
        ).rejects.toThrow('Merchant trust record not found');
    });

    it('should skip update if merchant is already trusted', async () => {
        mockExistingDoc({ trusted: true });

        await trustMerchant(mockDb, userId, appId, 'Jumbo');

        expect(mockTransaction.update).not.toHaveBeenCalled();
    });
});

describe('declineTrust - TOCTOU transaction safety', () => {
    it('should use runTransaction instead of standalone updateDoc', async () => {
        mockExistingDoc();

        await declineTrust(mockDb, userId, appId, 'Jumbo');

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-doc-ref');
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should set declined=true inside transaction', async () => {
        mockExistingDoc();

        await declineTrust(mockDb, userId, appId, 'Jumbo');

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                declined: true,
                promptShownAt: 'mock-server-timestamp',
                updatedAt: 'mock-server-timestamp',
            })
        );
    });

    it('should throw if merchant doc does not exist', async () => {
        mockMissingDoc();

        await expect(
            declineTrust(mockDb, userId, appId, 'NonExistent')
        ).rejects.toThrow('Merchant trust record not found');
    });

    it('should skip update if already declined', async () => {
        mockExistingDoc({ declined: true });

        await declineTrust(mockDb, userId, appId, 'Jumbo');

        expect(mockTransaction.update).not.toHaveBeenCalled();
    });

    it('should skip update if merchant is already trusted (prevents contradictory state)', async () => {
        mockExistingDoc({ trusted: true });

        await declineTrust(mockDb, userId, appId, 'Jumbo');

        expect(mockTransaction.update).not.toHaveBeenCalled();
    });
});

describe('revokeTrust - TOCTOU transaction safety', () => {
    it('should use runTransaction instead of standalone updateDoc', async () => {
        mockExistingDoc({ trusted: true });

        await revokeTrust(mockDb, userId, appId, 'Jumbo');

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-doc-ref');
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should set trusted=false and trustedAt=null inside transaction', async () => {
        mockExistingDoc({ trusted: true });

        await revokeTrust(mockDb, userId, appId, 'Jumbo');

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                trusted: false,
                trustedAt: null,
                updatedAt: 'mock-server-timestamp',
            })
        );
    });

    it('should throw if merchant doc does not exist', async () => {
        mockMissingDoc();

        await expect(
            revokeTrust(mockDb, userId, appId, 'NonExistent')
        ).rejects.toThrow('Merchant trust record not found');
    });

    it('should skip update if merchant is not currently trusted', async () => {
        mockExistingDoc();

        await revokeTrust(mockDb, userId, appId, 'Jumbo');

        expect(mockTransaction.update).not.toHaveBeenCalled();
    });
});
