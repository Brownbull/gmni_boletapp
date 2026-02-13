/**
 * mappingServiceBase.deleteMapping Transaction Tests
 *
 * Story 15-TD-15: Verify deleteMapping uses runTransaction for TOCTOU safety.
 * This base function is used by 4 mapping services (merchant, category,
 * subcategory, itemName).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-doc-ref'),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    increment: vi.fn(),
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
    runTransaction: vi.fn((_db, fn) => fn(mockTransaction)),
}));

vi.mock('../../../src/services/firestore', () => ({
    LISTENER_LIMITS: { MAPPINGS: 500 },
}));

import { runTransaction, deleteDoc, type Firestore } from 'firebase/firestore';
import { deleteMapping, type MappingConfig } from '../../../src/services/mappingServiceBase';

const mockRunTransaction = vi.mocked(runTransaction);
const mockDeleteDoc = vi.mocked(deleteDoc);

// --- Test helpers ---

function mockExistingDoc() {
    mockTransaction.get.mockResolvedValueOnce({
        exists: () => true,
        id: 'mapping-123',
        data: () => ({ normalizedKey: 'foo', targetValue: 'bar' }),
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
const config: MappingConfig = {
    collectionPath: () => 'test/mappings/path',
    serviceName: 'testMappingService',
    primaryKeyField: 'normalizedKey',
    targetField: 'targetValue',
};

beforeEach(() => {
    vi.resetAllMocks();
    mockRunTransaction.mockImplementation((_db, fn) => fn(mockTransaction));
});

// --- Tests ---

describe('deleteMapping - TOCTOU transaction safety', () => {
    it('should use runTransaction instead of standalone deleteDoc', async () => {
        mockExistingDoc();

        await deleteMapping(mockDb, userId, appId, 'mapping-123', config);

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-doc-ref');
        expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('should call transaction.delete inside the transaction', async () => {
        mockExistingDoc();

        await deleteMapping(mockDb, userId, appId, 'mapping-123', config);

        expect(mockTransaction.delete).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('should throw if mapping doc does not exist', async () => {
        mockMissingDoc();

        await expect(
            deleteMapping(mockDb, userId, appId, 'nonexistent', config)
        ).rejects.toThrow('Mapping not found: nonexistent');
    });

    it('should include mappingId in error message for debugging', async () => {
        mockMissingDoc();

        await expect(
            deleteMapping(mockDb, userId, appId, 'custom-id-456', config)
        ).rejects.toThrow('custom-id-456');
    });

    it('should not call transaction.delete when doc is missing', async () => {
        mockMissingDoc();

        try {
            await deleteMapping(mockDb, userId, appId, 'nonexistent', config);
        } catch {
            // expected
        }

        expect(mockTransaction.delete).not.toHaveBeenCalled();
    });
});
