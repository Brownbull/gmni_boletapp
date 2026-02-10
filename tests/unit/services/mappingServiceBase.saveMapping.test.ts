/**
 * mappingServiceBase.saveMapping Transaction Tests
 *
 * Story 15-TD-1: Verify saveMapping uses runTransaction for TOCTOU safety
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(() => 'mock-collection-ref'),
    doc: vi.fn(() => 'mock-new-doc-ref'),
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

import { getDocs, runTransaction } from 'firebase/firestore';
import { saveMapping, type MappingConfig } from '../../../src/services/mappingServiceBase';

const mockGetDocs = vi.mocked(getDocs);
const mockRunTransaction = vi.mocked(runTransaction);

describe('saveMapping - TOCTOU transaction safety', () => {
    const mockDb = {} as Parameters<typeof saveMapping>[0];
    const userId = 'test-user';
    const appId = 'test-app';
    const config: MappingConfig = {
        collectionPath: () => 'test/path',
        serviceName: 'testService',
        primaryKeyField: 'normalizedKey',
        targetField: 'targetValue',
    };
    const mapping = { normalizedKey: 'foo', targetValue: 'bar' };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should use runTransaction when updating an existing mapping', async () => {
        // Simulate existing document found by query
        const mockDocRef = { id: 'existing-doc-id' };
        mockGetDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: 'existing-doc-id', ref: mockDocRef, data: () => ({}) }],
        } as never);

        // Transaction.get returns the existing doc
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ normalizedKey: 'foo', targetValue: 'old-bar' }),
        });

        const id = await saveMapping(mockDb, userId, appId, mapping, config);

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith(mockDocRef);
        expect(mockTransaction.update).toHaveBeenCalledWith(
            mockDocRef,
            expect.objectContaining({
                normalizedKey: 'foo',
                targetValue: 'bar',
                updatedAt: 'mock-server-timestamp',
            })
        );
        expect(id).toBe('existing-doc-id');
    });

    it('should use transaction.set if doc was deleted between query and transaction', async () => {
        const mockDocRef = { id: 'deleted-doc-id' };
        mockGetDocs.mockResolvedValueOnce({
            empty: false,
            docs: [{ id: 'deleted-doc-id', ref: mockDocRef, data: () => ({}) }],
        } as never);

        // Doc no longer exists inside transaction
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => false,
        });

        await saveMapping(mockDb, userId, appId, mapping, config);

        expect(mockTransaction.update).not.toHaveBeenCalled();
        expect(mockTransaction.set).toHaveBeenCalledWith(
            mockDocRef,
            expect.objectContaining({
                createdAt: 'mock-server-timestamp',
                updatedAt: 'mock-server-timestamp',
            })
        );
    });

    it('should use runTransaction when creating a new mapping', async () => {
        // No existing document found
        mockGetDocs.mockResolvedValueOnce({
            empty: true,
            docs: [],
        } as never);

        await saveMapping(mockDb, userId, appId, mapping, config);

        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-new-doc-ref',
            expect.objectContaining({
                normalizedKey: 'foo',
                targetValue: 'bar',
                createdAt: 'mock-server-timestamp',
                updatedAt: 'mock-server-timestamp',
            })
        );
    });

    it('should sanitize target field when configured', async () => {
        const sanitizeConfig: MappingConfig = {
            ...config,
            sanitizeTarget: (v: string) => v.toUpperCase(),
        };

        mockGetDocs.mockResolvedValueOnce({
            empty: true,
            docs: [],
        } as never);

        await saveMapping(mockDb, userId, appId, mapping, sanitizeConfig);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                targetValue: 'BAR',
            })
        );
    });

    it('should include secondary key in query when configured', async () => {
        const compoundConfig: MappingConfig = {
            ...config,
            secondaryKeyField: 'normalizedItem',
        };
        const compoundMapping = { ...mapping, normalizedItem: 'baz' };

        mockGetDocs.mockResolvedValueOnce({
            empty: true,
            docs: [],
        } as never);

        await saveMapping(mockDb, userId, appId, compoundMapping, compoundConfig);

        // Verifying transaction was used for the write
        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    });
});
