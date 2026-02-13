/**
 * Insight Profile Service Transaction Tests
 *
 * Story 15-TD-20: Verify all 5 read-then-write functions use
 * runTransaction for TOCTOU safety.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(() => 'mock-profile-ref'),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    runTransaction: vi.fn((_db: unknown, fn: (t: typeof mockTransaction) => unknown) =>
        fn(mockTransaction)
    ),
    Timestamp: {
        now: vi.fn(() => ({ seconds: 1000, nanoseconds: 0 })),
        fromDate: vi.fn((d: Date) => ({
            seconds: Math.floor(d.getTime() / 1000),
            nanoseconds: 0,
        })),
    },
    increment: vi.fn((n: number) => `increment(${n})`),
}));

vi.mock('@/lib/firestorePaths', () => ({
    insightProfileDocSegments: vi.fn(() => [
        'artifacts',
        'test-app',
        'users',
        'test-user',
        'insightProfile',
        'profile',
    ]),
}));

import {
    runTransaction,
    getDoc,
    setDoc,
    updateDoc,
    type Firestore,
} from 'firebase/firestore';
import {
    getOrCreateInsightProfile,
    recordInsightShown,
    deleteInsight,
    deleteInsights,
    recordIntentionalResponse,
} from '@features/insights/services/insightProfileService';

const mockRunTransaction = vi.mocked(runTransaction);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);
const mockUpdateDoc = vi.mocked(updateDoc);

// --- Test helpers ---

const mockDb = {} as Firestore;
const userId = 'test-user';
const appId = 'test-app';

function mockExistingProfile(overrides: Record<string, unknown> = {}) {
    mockTransaction.get.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
            schemaVersion: 1,
            firstTransactionDate: { seconds: 900, nanoseconds: 0 },
            totalTransactions: 5,
            recentInsights: [],
            ...overrides,
        }),
    });
}

function mockProfileWithInsights(
    insights: Array<{
        insightId: string;
        shownAt: { seconds: number; nanoseconds: number };
        [key: string]: unknown;
    }>
) {
    mockTransaction.get.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
            schemaVersion: 1,
            firstTransactionDate: { seconds: 900, nanoseconds: 0 },
            totalTransactions: 5,
            recentInsights: insights,
        }),
    });
}

function mockMissingProfile() {
    mockTransaction.get.mockResolvedValueOnce({
        exists: () => false,
    });
}

// --- Tests ---

beforeEach(() => {
    vi.resetAllMocks();
    mockRunTransaction.mockImplementation((_db, fn) => fn(mockTransaction));
});

describe('getOrCreateInsightProfile', () => {
    it('should use runTransaction instead of standalone getDoc/setDoc', async () => {
        mockExistingProfile();

        await getOrCreateInsightProfile(mockDb, userId, appId);

        expect(mockRunTransaction).toHaveBeenCalledWith(mockDb, expect.any(Function));
        expect(mockGetDoc).not.toHaveBeenCalled();
        expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should return existing profile when doc exists', async () => {
        mockExistingProfile({ totalTransactions: 10 });

        const result = await getOrCreateInsightProfile(mockDb, userId, appId);

        expect(result).toEqual(
            expect.objectContaining({
                schemaVersion: 1,
                totalTransactions: 10,
                recentInsights: [],
            })
        );
        expect(mockTransaction.set).not.toHaveBeenCalled();
    });

    it('should create new profile when doc does not exist', async () => {
        mockMissingProfile();

        await getOrCreateInsightProfile(mockDb, userId, appId);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-profile-ref',
            expect.objectContaining({
                schemaVersion: 1,
                totalTransactions: 0,
                recentInsights: [],
            })
        );
    });

    it('should return the newly created profile when doc does not exist', async () => {
        mockMissingProfile();

        const result = await getOrCreateInsightProfile(mockDb, userId, appId);

        expect(result).toEqual(
            expect.objectContaining({
                schemaVersion: 1,
                totalTransactions: 0,
                recentInsights: [],
            })
        );
    });
});

describe('recordInsightShown', () => {
    it('should use runTransaction instead of standalone updateDoc', async () => {
        mockExistingProfile();

        await recordInsightShown(mockDb, userId, appId, 'test-insight');

        expect(mockRunTransaction).toHaveBeenCalledWith(mockDb, expect.any(Function));
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should append insight record via transaction.update', async () => {
        mockExistingProfile();

        await recordInsightShown(mockDb, userId, appId, 'test-insight', 'tx-123');

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-profile-ref',
            expect.objectContaining({
                recentInsights: expect.arrayContaining([
                    expect.objectContaining({
                        insightId: 'test-insight',
                        transactionId: 'tx-123',
                    }),
                ]),
            })
        );
    });

    it('should create profile if not exists then update', async () => {
        mockMissingProfile();

        await recordInsightShown(mockDb, userId, appId, 'test-insight');

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-profile-ref',
            expect.objectContaining({ schemaVersion: 1 })
        );
        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-profile-ref',
            expect.objectContaining({
                recentInsights: expect.arrayContaining([
                    expect.objectContaining({ insightId: 'test-insight' }),
                ]),
            })
        );
    });

    it('should include optional fields when fullInsight provided', async () => {
        mockExistingProfile();

        await recordInsightShown(mockDb, userId, appId, 'test-insight', undefined, {
            title: 'Test Title',
            message: 'Test Message',
            icon: 'Repeat',
            category: 'QUIRKY_FIRST',
        });

        expect(mockTransaction.update).toHaveBeenCalledWith(
            'mock-profile-ref',
            expect.objectContaining({
                recentInsights: expect.arrayContaining([
                    expect.objectContaining({
                        insightId: 'test-insight',
                        title: 'Test Title',
                        message: 'Test Message',
                        icon: 'Repeat',
                        category: 'QUIRKY_FIRST',
                    }),
                ]),
            })
        );
    });

    it('should trim recentInsights to MAX_RECENT_INSIGHTS', async () => {
        const existingInsights = Array.from({ length: 50 }, (_, i) => ({
            insightId: `insight-${i}`,
            shownAt: { seconds: 100 + i, nanoseconds: 0 },
        }));
        mockProfileWithInsights(existingInsights);

        await recordInsightShown(mockDb, userId, appId, 'new-insight');

        const updateCall = mockTransaction.update.mock.calls[0];
        const updatedInsights = updateCall[1].recentInsights;
        expect(updatedInsights).toHaveLength(50);
        // First insight should be insight-1 (insight-0 dropped)
        expect(updatedInsights[0].insightId).toBe('insight-1');
        // Last insight should be the new one
        expect(updatedInsights[49].insightId).toBe('new-insight');
    });
});

describe('deleteInsight', () => {
    it('should use runTransaction instead of standalone updateDoc', async () => {
        mockExistingProfile();

        await deleteInsight(mockDb, userId, appId, 'test-insight', 500);

        expect(mockRunTransaction).toHaveBeenCalledWith(mockDb, expect.any(Function));
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should filter out matching insight by insightId and shownAtSeconds', async () => {
        mockProfileWithInsights([
            { insightId: 'keep-this', shownAt: { seconds: 500, nanoseconds: 0 } },
            { insightId: 'remove-this', shownAt: { seconds: 600, nanoseconds: 0 } },
        ]);

        await deleteInsight(mockDb, userId, appId, 'remove-this', 600);

        const updateCall = mockTransaction.update.mock.calls[0];
        const updatedInsights = updateCall[1].recentInsights;
        expect(updatedInsights).toHaveLength(1);
        expect(updatedInsights[0].insightId).toBe('keep-this');
    });

    it('should create profile if not exists then update', async () => {
        mockMissingProfile();

        await deleteInsight(mockDb, userId, appId, 'test-insight', 500);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-profile-ref',
            expect.objectContaining({ schemaVersion: 1 })
        );
        expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should keep all insights when no match found', async () => {
        mockProfileWithInsights([
            { insightId: 'a', shownAt: { seconds: 100, nanoseconds: 0 } },
            { insightId: 'b', shownAt: { seconds: 200, nanoseconds: 0 } },
        ]);

        await deleteInsight(mockDb, userId, appId, 'nonexistent', 999);

        const updateCall = mockTransaction.update.mock.calls[0];
        expect(updateCall[1].recentInsights).toHaveLength(2);
    });
});

describe('deleteInsights', () => {
    it('should use runTransaction instead of standalone updateDoc', async () => {
        mockExistingProfile();

        await deleteInsights(mockDb, userId, appId, []);

        expect(mockRunTransaction).toHaveBeenCalledWith(mockDb, expect.any(Function));
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should filter out all matching insights', async () => {
        mockProfileWithInsights([
            { insightId: 'a', shownAt: { seconds: 100, nanoseconds: 0 } },
            { insightId: 'b', shownAt: { seconds: 200, nanoseconds: 0 } },
            { insightId: 'c', shownAt: { seconds: 300, nanoseconds: 0 } },
        ]);

        await deleteInsights(mockDb, userId, appId, [
            { insightId: 'a', shownAtSeconds: 100 },
            { insightId: 'c', shownAtSeconds: 300 },
        ]);

        const updateCall = mockTransaction.update.mock.calls[0];
        const updatedInsights = updateCall[1].recentInsights;
        expect(updatedInsights).toHaveLength(1);
        expect(updatedInsights[0].insightId).toBe('b');
    });

    it('should create profile if not exists then update', async () => {
        mockMissingProfile();

        await deleteInsights(mockDb, userId, appId, [
            { insightId: 'x', shownAtSeconds: 100 },
        ]);

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-profile-ref',
            expect.objectContaining({ schemaVersion: 1 })
        );
        expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should handle empty delete list (no-op update)', async () => {
        mockProfileWithInsights([
            { insightId: 'a', shownAt: { seconds: 100, nanoseconds: 0 } },
        ]);

        await deleteInsights(mockDb, userId, appId, []);

        const updateCall = mockTransaction.update.mock.calls[0];
        expect(updateCall[1].recentInsights).toHaveLength(1);
    });
});

describe('recordIntentionalResponse', () => {
    it('should use runTransaction instead of standalone updateDoc', async () => {
        mockExistingProfile();

        await recordIntentionalResponse(
            mockDb, userId, appId, 'test-insight', 500, 'intentional'
        );

        expect(mockRunTransaction).toHaveBeenCalledWith(mockDb, expect.any(Function));
        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should update matching insight with intentional response', async () => {
        mockProfileWithInsights([
            { insightId: 'target', shownAt: { seconds: 500, nanoseconds: 0 } },
        ]);

        await recordIntentionalResponse(
            mockDb, userId, appId, 'target', 500, 'intentional'
        );

        const updateCall = mockTransaction.update.mock.calls[0];
        const updatedInsights = updateCall[1].recentInsights;
        expect(updatedInsights[0]).toEqual(
            expect.objectContaining({
                insightId: 'target',
                intentionalResponse: 'intentional',
                intentionalResponseAt: expect.objectContaining({ seconds: 1000 }),
            })
        );
    });

    it('should not modify non-matching insights', async () => {
        mockProfileWithInsights([
            { insightId: 'other', shownAt: { seconds: 100, nanoseconds: 0 } },
            { insightId: 'target', shownAt: { seconds: 500, nanoseconds: 0 } },
        ]);

        await recordIntentionalResponse(
            mockDb, userId, appId, 'target', 500, 'unintentional'
        );

        const updateCall = mockTransaction.update.mock.calls[0];
        const updatedInsights = updateCall[1].recentInsights;
        expect(updatedInsights[0]).toEqual(
            expect.objectContaining({ insightId: 'other' })
        );
        expect(updatedInsights[0]).not.toHaveProperty('intentionalResponse');
    });

    it('should create profile if not exists then update', async () => {
        mockMissingProfile();

        await recordIntentionalResponse(
            mockDb, userId, appId, 'test-insight', 500, 'intentional'
        );

        expect(mockTransaction.set).toHaveBeenCalledWith(
            'mock-profile-ref',
            expect.objectContaining({ schemaVersion: 1 })
        );
        expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('should handle null response (dismissed)', async () => {
        mockProfileWithInsights([
            { insightId: 'target', shownAt: { seconds: 500, nanoseconds: 0 } },
        ]);

        await recordIntentionalResponse(
            mockDb, userId, appId, 'target', 500, null
        );

        const updateCall = mockTransaction.update.mock.calls[0];
        const updatedInsights = updateCall[1].recentInsights;
        expect(updatedInsights[0].intentionalResponse).toBeNull();
    });
});
