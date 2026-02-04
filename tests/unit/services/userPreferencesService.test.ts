/**
 * User Preferences Service Tests
 *
 * Story 14d-v2-1-6e: Security Rules, Preferences & Integration Tests
 *
 * Tests for user shared groups preferences functions:
 * - getUserSharedGroupsPreferences (AC #2)
 * - setGroupPreference (AC #2, AC #3)
 * - getGroupPreference
 * - removeGroupPreference
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore before importing the module
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
    return {
        ...actual,
        doc: vi.fn(),
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        deleteField: vi.fn(() => ({ _deleteField: true })),
        serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
    };
});

import {
    doc,
    getDoc,
    setDoc,
} from 'firebase/firestore';
import {
    getUserSharedGroupsPreferences,
    setGroupPreference,
    getGroupPreference,
    removeGroupPreference,
} from '../../../src/services/userPreferencesService';
import type { UserGroupPreference } from '../../../src/types/sharedGroup';

const mockDoc = vi.mocked(doc);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Helper to create a mock Firestore instance
 */
function createMockDb() {
    return {} as any;
}

/**
 * Helper to create a mock document snapshot (exists)
 */
function createMockDocSnapshot(data: Record<string, any>) {
    return {
        exists: () => true,
        data: () => data,
    };
}

/**
 * Helper to create a mock document snapshot (does not exist)
 */
function createMockDocSnapshotNotExists() {
    return {
        exists: () => false,
        data: () => null,
    };
}

/**
 * Helper to create a mock Timestamp
 */
function createMockTimestamp(daysAgo: number = 0): Timestamp {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;
}

// =============================================================================
// Tests: getUserSharedGroupsPreferences
// =============================================================================

describe('getUserSharedGroupsPreferences', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'sharedGroups' } as any);
    });

    it('should return empty preferences if document does not exist', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshotNotExists() as any);

        const result = await getUserSharedGroupsPreferences(mockDb, TEST_USER_ID, TEST_APP_ID);

        expect(result).toEqual({ groupPreferences: {} });
        expect(mockDoc).toHaveBeenCalledWith(
            mockDb,
            'artifacts',
            TEST_APP_ID,
            'users',
            TEST_USER_ID,
            'preferences',
            'sharedGroups'
        );
    });

    it('should return existing preferences if document exists', async () => {
        const existingPrefs = {
            groupPreferences: {
                'group-1': {
                    shareMyTransactions: true,
                    lastToggleAt: null,
                    toggleCountToday: 0,
                },
                'group-2': {
                    shareMyTransactions: false,
                    lastToggleAt: createMockTimestamp(),
                    toggleCountToday: 2,
                },
            },
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(existingPrefs) as any);

        const result = await getUserSharedGroupsPreferences(mockDb, TEST_USER_ID, TEST_APP_ID);

        expect(result.groupPreferences).toEqual(existingPrefs.groupPreferences);
    });

    it('should return empty preferences on error', async () => {
        mockGetDoc.mockRejectedValue(new Error('Network error'));

        const result = await getUserSharedGroupsPreferences(mockDb, TEST_USER_ID, TEST_APP_ID);

        expect(result).toEqual({ groupPreferences: {} });
    });

    it('should handle document with no groupPreferences field', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({}) as any);

        const result = await getUserSharedGroupsPreferences(mockDb, TEST_USER_ID, TEST_APP_ID);

        expect(result).toEqual({ groupPreferences: {} });
    });
});

// =============================================================================
// Tests: setGroupPreference
// =============================================================================

describe('setGroupPreference', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';
    const TEST_GROUP_ID = 'test-group-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'sharedGroups' } as any);
        mockSetDoc.mockResolvedValue(undefined);
    });

    it('should create preference with shareMyTransactions=true (Story 14d-v2-1-6e AC #2)', async () => {
        await setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            {
                [`groupPreferences.${TEST_GROUP_ID}`]: {
                    shareMyTransactions: true,
                    lastToggleAt: null,
                    toggleCountToday: 0,
                },
            },
            { merge: true }
        );
    });

    it('should create preference with shareMyTransactions=false', async () => {
        await setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, false);

        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            {
                [`groupPreferences.${TEST_GROUP_ID}`]: {
                    shareMyTransactions: false,
                    lastToggleAt: null,
                    toggleCountToday: 0,
                },
            },
            { merge: true }
        );
    });

    it('should initialize toggle tracking fields (Story 14d-v2-1-6e AC #3)', async () => {
        await setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        const calledWith = mockSetDoc.mock.calls[0][1];
        const preference = calledWith[`groupPreferences.${TEST_GROUP_ID}`];

        expect(preference.lastToggleAt).toBeNull();
        expect(preference.toggleCountToday).toBe(0);
    });

    it('should throw error on Firestore failure', async () => {
        mockSetDoc.mockRejectedValue(new Error('Permission denied'));

        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true)
        ).rejects.toThrow('Permission denied');
    });

    it('should use correct document path', async () => {
        await setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        expect(mockDoc).toHaveBeenCalledWith(
            mockDb,
            'artifacts',
            TEST_APP_ID,
            'users',
            TEST_USER_ID,
            'preferences',
            'sharedGroups'
        );
    });
});

// =============================================================================
// Tests: getGroupPreference
// =============================================================================

describe('getGroupPreference', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';
    const TEST_GROUP_ID = 'test-group-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'sharedGroups' } as any);
    });

    it('should return preference for existing group', async () => {
        const existingPrefs = {
            groupPreferences: {
                [TEST_GROUP_ID]: {
                    shareMyTransactions: true,
                    lastToggleAt: createMockTimestamp(),
                    toggleCountToday: 1,
                },
            },
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(existingPrefs) as any);

        const result = await getGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID);

        expect(result).toEqual(existingPrefs.groupPreferences[TEST_GROUP_ID]);
    });

    it('should return null for non-existent group', async () => {
        const existingPrefs = {
            groupPreferences: {
                'other-group': {
                    shareMyTransactions: true,
                    lastToggleAt: null,
                    toggleCountToday: 0,
                },
            },
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot(existingPrefs) as any);

        const result = await getGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID);

        expect(result).toBeNull();
    });

    it('should return null if document does not exist', async () => {
        mockGetDoc.mockResolvedValue(createMockDocSnapshotNotExists() as any);

        const result = await getGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID);

        expect(result).toBeNull();
    });

    it('should return null on error', async () => {
        mockGetDoc.mockRejectedValue(new Error('Network error'));

        const result = await getGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID);

        expect(result).toBeNull();
    });
});

// =============================================================================
// Tests: removeGroupPreference
// =============================================================================

describe('removeGroupPreference', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';
    const TEST_GROUP_ID = 'test-group-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'sharedGroups' } as any);
        mockSetDoc.mockResolvedValue(undefined);
    });

    it('should remove group preference using deleteField', async () => {
        await removeGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID);

        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${TEST_GROUP_ID}`]: expect.anything(),
            }),
            { merge: true }
        );
    });

    it('should throw error on Firestore failure', async () => {
        mockSetDoc.mockRejectedValue(new Error('Permission denied'));

        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID)
        ).rejects.toThrow('Permission denied');
    });

    it('should use correct document path', async () => {
        await removeGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID);

        expect(mockDoc).toHaveBeenCalledWith(
            mockDb,
            'artifacts',
            TEST_APP_ID,
            'users',
            TEST_USER_ID,
            'preferences',
            'sharedGroups'
        );
    });
});
