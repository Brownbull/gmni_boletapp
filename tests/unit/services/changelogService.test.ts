/**
 * Changelog Service Tests
 *
 * Story 14d-v2-1-3c: Changelog Service & Tests
 *
 * Tests for the changelog query service function.
 * Verifies AC #1 (query function), AC #2 (unit tests for edge cases).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockTimestamp, createMockTimestampDaysAgo, createMockTimestampDaysFromNow } from '../../helpers';

// Mock Firestore before importing the module
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        getDocs: vi.fn(),
    };
});

import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
} from 'firebase/firestore';
import {
    getChangelogSince,
    ChangelogQueryError,
    DEFAULT_CHANGELOG_LIMIT,
    MAX_CHANGELOG_LIMIT,
} from '../../../src/services/changelogService';
import type { ChangelogEntry } from '../../../src/types/changelog';
import type { Transaction } from '../../../src/types/transaction';

const mockCollection = vi.mocked(collection);
const mockQuery = vi.mocked(query);
const mockWhere = vi.mocked(where);
const mockOrderBy = vi.mocked(orderBy);
const mockLimit = vi.mocked(limit);
const mockGetDocs = vi.mocked(getDocs);


// Helper to create mock changelog entry data
function createMockChangelogData(overrides?: Partial<ChangelogEntry>): Omit<ChangelogEntry, 'id'> {
    const mockTransaction: Transaction = {
        id: 'tx-123',
        date: '2026-02-01',
        merchant: 'Test Store',
        category: 'Supermarket',
        total: 15000,
        items: [{ name: 'Groceries', price: 15000 }],
        currency: 'CLP',
    };

    return {
        type: 'TRANSACTION_ADDED',
        transactionId: 'tx-123',
        timestamp: createMockTimestamp(),
        actorId: 'user-456',
        groupId: 'group-789',
        data: mockTransaction,
        summary: {
            amount: 15000,
            currency: 'CLP',
            description: 'Test Store',
            category: 'Supermarket',
        },
        _ttl: createMockTimestampDaysFromNow(30), // 30 days in the future
        ...overrides,
    };
}

// Helper to create mock document snapshots
function createMockDoc(id: string, data: Omit<ChangelogEntry, 'id'>) {
    return {
        id,
        data: () => data,
        ref: { id },
    };
}

describe('changelogService', () => {
    const mockDb = {} as any;
    const groupId = 'test-group-123';
    const sinceTimestamp = createMockTimestampDaysAgo(7); // 7 days ago

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations that chain properly
        mockCollection.mockReturnValue({} as any);
        mockQuery.mockReturnValue({} as any);
        mockWhere.mockReturnValue({} as any);
        mockOrderBy.mockReturnValue({} as any);
        mockLimit.mockReturnValue({} as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // Constants Tests
    // =========================================================================
    describe('constants', () => {
        it('exports DEFAULT_CHANGELOG_LIMIT as 1000 (AC #1)', () => {
            expect(DEFAULT_CHANGELOG_LIMIT).toBe(1000);
        });

        it('exports MAX_CHANGELOG_LIMIT as 10000 (AC #1 safety cap)', () => {
            expect(MAX_CHANGELOG_LIMIT).toBe(10000);
        });
    });

    // =========================================================================
    // AC #1: Basic Query Tests
    // =========================================================================
    describe('getChangelogSince - basic query', () => {
        it('queries correct collection path: sharedGroups/{groupId}/changelog', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getChangelogSince(mockDb, groupId, sinceTimestamp);

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'sharedGroups', groupId, 'changelog');
        });

        it('applies timestamp filter with > operator (AC #1)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getChangelogSince(mockDb, groupId, sinceTimestamp);

            expect(mockWhere).toHaveBeenCalledWith('timestamp', '>', sinceTimestamp);
        });

        it('orders results by timestamp ascending (AC #1)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getChangelogSince(mockDb, groupId, sinceTimestamp);

            expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'asc');
        });

        it('applies default limit of 1000 when not specified (AC #1)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getChangelogSince(mockDb, groupId, sinceTimestamp);

            expect(mockLimit).toHaveBeenCalledWith(DEFAULT_CHANGELOG_LIMIT);
        });

        it('applies custom limit when specified', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getChangelogSince(mockDb, groupId, sinceTimestamp, 100);

            expect(mockLimit).toHaveBeenCalledWith(100);
        });

        it('returns typed ChangelogEntry[] array (AC #1)', async () => {
            const mockData = createMockChangelogData();
            const mockDocs = [
                createMockDoc('entry-1', mockData),
                createMockDoc('entry-2', createMockChangelogData({ type: 'TRANSACTION_MODIFIED' })),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 2,
            } as any);

            const result = await getChangelogSince(mockDb, groupId, sinceTimestamp);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('entry-1');
            expect(result[0].type).toBe('TRANSACTION_ADDED');
            expect(result[1].id).toBe('entry-2');
            expect(result[1].type).toBe('TRANSACTION_MODIFIED');
        });
    });

    // =========================================================================
    // AC #2: Edge Cases Tests
    // =========================================================================
    describe('getChangelogSince - edge cases', () => {
        describe('empty results', () => {
            it('returns empty array when no changes since timestamp (AC #2)', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    size: 0,
                } as any);

                const result = await getChangelogSince(mockDb, groupId, sinceTimestamp);

                expect(result).toEqual([]);
                expect(result).toHaveLength(0);
            });
        });

        describe('max limit enforcement', () => {
            it('caps limit at MAX_CHANGELOG_LIMIT when exceeding (AC #2)', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    size: 0,
                } as any);

                // Request more than max
                await getChangelogSince(mockDb, groupId, sinceTimestamp, 50000);

                expect(mockLimit).toHaveBeenCalledWith(MAX_CHANGELOG_LIMIT);
            });

            it('accepts limit equal to MAX_CHANGELOG_LIMIT', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    size: 0,
                } as any);

                await getChangelogSince(mockDb, groupId, sinceTimestamp, MAX_CHANGELOG_LIMIT);

                expect(mockLimit).toHaveBeenCalledWith(MAX_CHANGELOG_LIMIT);
            });

            it('handles limit of 1 (minimum)', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    size: 0,
                } as any);

                await getChangelogSince(mockDb, groupId, sinceTimestamp, 1);

                expect(mockLimit).toHaveBeenCalledWith(1);
            });

            it('coerces negative limit to 1', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    size: 0,
                } as any);

                await getChangelogSince(mockDb, groupId, sinceTimestamp, -10);

                expect(mockLimit).toHaveBeenCalledWith(1);
            });

            it('coerces zero limit to 1', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    size: 0,
                } as any);

                await getChangelogSince(mockDb, groupId, sinceTimestamp, 0);

                expect(mockLimit).toHaveBeenCalledWith(1);
            });
        });

        describe('invalid groupId handling', () => {
            it('throws INVALID_GROUP_ID for empty string (AC #2)', async () => {
                await expect(getChangelogSince(mockDb, '', sinceTimestamp)).rejects.toThrow(
                    ChangelogQueryError
                );

                try {
                    await getChangelogSince(mockDb, '', sinceTimestamp);
                } catch (error) {
                    expect(error).toBeInstanceOf(ChangelogQueryError);
                    expect((error as ChangelogQueryError).code).toBe('INVALID_GROUP_ID');
                }
            });

            it('throws INVALID_GROUP_ID for whitespace-only string (AC #2)', async () => {
                await expect(getChangelogSince(mockDb, '   ', sinceTimestamp)).rejects.toThrow(
                    ChangelogQueryError
                );

                try {
                    await getChangelogSince(mockDb, '   ', sinceTimestamp);
                } catch (error) {
                    expect(error).toBeInstanceOf(ChangelogQueryError);
                    expect((error as ChangelogQueryError).code).toBe('INVALID_GROUP_ID');
                }
            });

            it('throws INVALID_GROUP_ID for null/undefined groupId (AC #2)', async () => {
                await expect(
                    getChangelogSince(mockDb, null as any, sinceTimestamp)
                ).rejects.toThrow(ChangelogQueryError);

                await expect(
                    getChangelogSince(mockDb, undefined as any, sinceTimestamp)
                ).rejects.toThrow(ChangelogQueryError);
            });
        });

        describe('access denied scenarios', () => {
            it('throws ACCESS_DENIED for permission errors (AC #2)', async () => {
                const permissionError = new Error('Missing or insufficient permissions');
                mockGetDocs.mockRejectedValue(permissionError);

                try {
                    await getChangelogSince(mockDb, groupId, sinceTimestamp);
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(ChangelogQueryError);
                    expect((error as ChangelogQueryError).code).toBe('ACCESS_DENIED');
                    expect((error as ChangelogQueryError).cause).toBe(permissionError);
                }
            });

            it('throws ACCESS_DENIED for permission-denied message', async () => {
                const permissionError = new Error('permission-denied');
                mockGetDocs.mockRejectedValue(permissionError);

                try {
                    await getChangelogSince(mockDb, groupId, sinceTimestamp);
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(ChangelogQueryError);
                    expect((error as ChangelogQueryError).code).toBe('ACCESS_DENIED');
                }
            });
        });

        describe('query failure handling', () => {
            it('throws QUERY_FAILED for other errors (AC #2)', async () => {
                const networkError = new Error('Network error');
                mockGetDocs.mockRejectedValue(networkError);

                try {
                    await getChangelogSince(mockDb, groupId, sinceTimestamp);
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(ChangelogQueryError);
                    expect((error as ChangelogQueryError).code).toBe('QUERY_FAILED');
                    expect((error as ChangelogQueryError).cause).toBe(networkError);
                }
            });

            it('includes groupId in error message', async () => {
                mockGetDocs.mockRejectedValue(new Error('Some error'));

                try {
                    await getChangelogSince(mockDb, 'my-group-id', sinceTimestamp);
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect((error as Error).message).toContain('my-group-id');
                }
            });
        });
    });

    // =========================================================================
    // Data Mapping Tests
    // =========================================================================
    describe('getChangelogSince - data mapping', () => {
        it('maps document id correctly', async () => {
            const mockDocs = [createMockDoc('unique-entry-id', createMockChangelogData())];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 1,
            } as any);

            const result = await getChangelogSince(mockDb, groupId, sinceTimestamp);

            expect(result[0].id).toBe('unique-entry-id');
        });

        it('maps all ChangelogEntry fields correctly', async () => {
            const mockData = createMockChangelogData({
                type: 'TRANSACTION_MODIFIED',
                transactionId: 'tx-specific',
                actorId: 'user-specific',
                groupId: 'group-specific',
            });
            const mockDocs = [createMockDoc('entry-id', mockData)];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 1,
            } as any);

            const result = await getChangelogSince(mockDb, groupId, sinceTimestamp);
            const entry = result[0];

            expect(entry.type).toBe('TRANSACTION_MODIFIED');
            expect(entry.transactionId).toBe('tx-specific');
            expect(entry.actorId).toBe('user-specific');
            expect(entry.groupId).toBe('group-specific');
            expect(entry.data).toBeDefined();
            expect(entry.summary).toBeDefined();
            expect(entry._ttl).toBeDefined();
        });

        it('handles TRANSACTION_REMOVED with null data', async () => {
            const mockData = createMockChangelogData({
                type: 'TRANSACTION_REMOVED',
                data: null,
            });
            const mockDocs = [createMockDoc('removal-entry', mockData)];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 1,
            } as any);

            const result = await getChangelogSince(mockDb, groupId, sinceTimestamp);

            expect(result[0].type).toBe('TRANSACTION_REMOVED');
            expect(result[0].data).toBeNull();
        });

        it('preserves summary data for notifications', async () => {
            const mockData = createMockChangelogData({
                summary: {
                    amount: 25000,
                    currency: 'USD',
                    description: 'Coffee Shop',
                    category: 'Cafe',
                },
            });
            const mockDocs = [createMockDoc('entry-1', mockData)];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 1,
            } as any);

            const result = await getChangelogSince(mockDb, groupId, sinceTimestamp);

            expect(result[0].summary.amount).toBe(25000);
            expect(result[0].summary.currency).toBe('USD');
            expect(result[0].summary.description).toBe('Coffee Shop');
            expect(result[0].summary.category).toBe('Cafe');
        });
    });

    // =========================================================================
    // ChangelogQueryError Tests
    // =========================================================================
    describe('ChangelogQueryError', () => {
        it('has correct name property', () => {
            const error = new ChangelogQueryError('test', 'INVALID_GROUP_ID');
            expect(error.name).toBe('ChangelogQueryError');
        });

        it('stores error code', () => {
            const error = new ChangelogQueryError('test', 'ACCESS_DENIED');
            expect(error.code).toBe('ACCESS_DENIED');
        });

        it('stores cause when provided', () => {
            const cause = new Error('original');
            const error = new ChangelogQueryError('test', 'QUERY_FAILED', cause);
            expect(error.cause).toBe(cause);
        });

        it('inherits from Error', () => {
            const error = new ChangelogQueryError('test', 'INVALID_GROUP_ID');
            expect(error).toBeInstanceOf(Error);
        });
    });
});
