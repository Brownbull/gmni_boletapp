/**
 * merchantTrustService.recordScan Transaction Tests
 *
 * Story 15-TD-1: Verify recordScan uses runTransaction for TOCTOU safety
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
    assertValidDocumentId: vi.fn(),
}));

import { runTransaction, type Firestore } from 'firebase/firestore';
import { sanitizeMerchantName } from '@/utils/sanitize';
import { recordScan } from '../../../src/services/merchantTrustService';

const mockRunTransaction = vi.mocked(runTransaction);
const mockSanitize = vi.mocked(sanitizeMerchantName);

describe('recordScan - TOCTOU transaction safety', () => {
    const mockDb = {} as Firestore;
    const userId = 'test-user';
    const appId = 'test-app';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should use runTransaction for atomic read-then-write', async () => {
        // New merchant — doc doesn't exist
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => false,
        });

        await recordScan(mockDb, userId, appId, 'Jumbo', false);

        expect(mockSanitize).toHaveBeenCalledWith('Jumbo');
        expect(mockRunTransaction).toHaveBeenCalledTimes(1);
        expect(mockTransaction.get).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('should create new merchant record inside transaction when doc does not exist', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => false,
        });

        const result = await recordScan(mockDb, userId, appId, 'Jumbo', false);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                merchantName: 'Jumbo',
                scanCount: 1,
                editCount: 0,
                editRate: 0,
                trusted: false,
            })
        );
        expect(result.shouldShowPrompt).toBe(false);
        expect(result.reason).toBe('insufficient_scans');
    });

    it('should update existing merchant record inside transaction', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            id: 'jumbo',
            data: () => ({
                merchantName: 'Jumbo',
                normalizedName: 'jumbo',
                scanCount: 2,
                editCount: 0,
                editRate: 0,
                trusted: false,
            }),
        });

        const result = await recordScan(mockDb, userId, appId, 'Jumbo', false);

        // Should use transaction.update, not standalone updateDoc
        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                scanCount: 3,
                editCount: 0,
                editRate: 0,
                lastScanAt: 'mock-server-timestamp',
                updatedAt: 'mock-server-timestamp',
            })
        );
        // 3 scans, 0 edits → eligible
        expect(result.shouldShowPrompt).toBe(true);
        expect(result.reason).toBe('eligible');
    });

    it('should increment edit count when wasEdited is true', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => true,
            id: 'jumbo',
            data: () => ({
                merchantName: 'Jumbo',
                normalizedName: 'jumbo',
                scanCount: 4,
                editCount: 0,
                editRate: 0,
                trusted: false,
            }),
        });

        await recordScan(mockDb, userId, appId, 'Jumbo', true);

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                scanCount: 5,
                editCount: 1,
                editRate: 0.2, // 1/5
            })
        );
    });

    it('should create new record with edit count 1 when first scan is edited', async () => {
        mockTransaction.get.mockResolvedValueOnce({
            exists: () => false,
        });

        await recordScan(mockDb, userId, appId, 'NewMerchant', true);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-doc-ref',
            expect.objectContaining({
                scanCount: 1,
                editCount: 1,
                editRate: 1,
            })
        );
    });
});
