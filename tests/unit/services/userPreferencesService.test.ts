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
        onSnapshot: vi.fn(),
    };
});

// Mock userSharingCooldown for updateShareMyTransactions tests
vi.mock('@/utils/userSharingCooldown', () => ({
    shouldResetUserDailyCount: vi.fn(),
}));

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    onSnapshot,
} from 'firebase/firestore';
import { shouldResetUserDailyCount } from '@/utils/userSharingCooldown';
import {
    getUserSharedGroupsPreferences,
    setGroupPreference,
    getGroupPreference,
    removeGroupPreference,
    updateShareMyTransactions,
    subscribeToUserGroupPreference,
} from '../../../src/services/userPreferencesService';
import type { UserGroupPreference } from '../../../src/types/sharedGroup';

const mockDoc = vi.mocked(doc);
const mockGetDoc = vi.mocked(getDoc);
const mockSetDoc = vi.mocked(setDoc);
const mockServerTimestamp = vi.mocked(serverTimestamp);
const mockOnSnapshot = vi.mocked(onSnapshot);
const mockShouldResetUserDailyCount = vi.mocked(shouldResetUserDailyCount);

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
                    toggleCountResetAt: null,
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
                    toggleCountResetAt: null,
                },
            },
            { merge: true }
        );
    });

    it('should initialize toggle tracking fields (Story 14d-v2-1-6e AC #3, updated 14d-v2-1-12a)', async () => {
        await setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        const calledWith = mockSetDoc.mock.calls[0][1];
        const preference = calledWith[`groupPreferences.${TEST_GROUP_ID}`];

        expect(preference.lastToggleAt).toBeNull();
        expect(preference.toggleCountToday).toBe(0);
        expect(preference.toggleCountResetAt).toBeNull();
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

    // Story 14d-v2-1-12c ECC Review: Added groupId validation tests
    describe('groupId validation', () => {
        it('should throw error when groupId is empty', async () => {
            await expect(
                getGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, '')
            ).rejects.toThrow('Invalid groupId');
        });

        it('should throw error when groupId contains dots', async () => {
            await expect(
                getGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, 'group.with.dots')
            ).rejects.toThrow('Invalid groupId');
        });

        it('should throw error when groupId contains special characters', async () => {
            await expect(
                getGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, 'group@with#special')
            ).rejects.toThrow('Invalid groupId');
        });

        it('should accept valid groupId with alphanumeric characters', async () => {
            mockGetDoc.mockResolvedValue(createMockDocSnapshotNotExists() as any);
            const result = await getGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, 'valid-group_123');
            expect(result).toBeNull(); // Returns null for non-existent, but doesn't throw
        });
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

// =============================================================================
// Tests: updateShareMyTransactions (Story 14d-v2-1-12b AC#2)
// =============================================================================

describe('updateShareMyTransactions', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';
    const TEST_GROUP_ID = 'test-group-id';
    const SERVER_TIMESTAMP_MARKER = { _serverTimestamp: true };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'sharedGroups' } as any);
        mockSetDoc.mockResolvedValue(undefined);
        mockServerTimestamp.mockReturnValue(SERVER_TIMESTAMP_MARKER as any);
    });

    it('should update existing preference with enabled=true (Story 14d-v2-1-12b AC#2)', async () => {
        // Arrange: Existing preference with sharing disabled
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        // Assert
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${TEST_GROUP_ID}.shareMyTransactions`]: true,
            }),
            { merge: true }
        );
    });

    it('should update existing preference with enabled=false (Story 14d-v2-1-12b AC#2)', async () => {
        // Arrange: Existing preference with sharing enabled
        const existingPref: UserGroupPreference = {
            shareMyTransactions: true,
            lastToggleAt: createMockTimestamp(),
            toggleCountToday: 1,
            toggleCountResetAt: createMockTimestamp(),
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, false);

        // Assert
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${TEST_GROUP_ID}.shareMyTransactions`]: false,
            }),
            { merge: true }
        );
    });

    it('should increment toggleCountToday when updating (Story 14d-v2-1-12b AC#2)', async () => {
        // Arrange: Existing preference with 1 toggle already
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: createMockTimestamp(),
            toggleCountToday: 1,
            toggleCountResetAt: createMockTimestamp(),
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        // Assert: Should increment from 1 to 2
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${TEST_GROUP_ID}.toggleCountToday`]: 2,
            }),
            { merge: true }
        );
    });

    it('should reset toggleCountToday to 1 on new day (Story 14d-v2-1-12b AC#2)', async () => {
        // Arrange: Existing preference with high count from yesterday
        const existingPref: UserGroupPreference = {
            shareMyTransactions: true,
            lastToggleAt: createMockTimestamp(1), // yesterday
            toggleCountToday: 3,
            toggleCountResetAt: createMockTimestamp(1), // yesterday
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        // Mock: It IS a new day, so count should reset
        mockShouldResetUserDailyCount.mockReturnValue(true);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, false);

        // Assert: Should reset to 1 (not increment the old count)
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${TEST_GROUP_ID}.toggleCountToday`]: 1,
            }),
            { merge: true }
        );
    });

    it('should set lastToggleAt to serverTimestamp (Story 14d-v2-1-12b AC#2)', async () => {
        // Arrange
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        // Assert
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${TEST_GROUP_ID}.lastToggleAt`]: SERVER_TIMESTAMP_MARKER,
            }),
            { merge: true }
        );
    });

    it('should set toggleCountResetAt to serverTimestamp on daily reset (Story 14d-v2-1-12b AC#2)', async () => {
        // Arrange: Existing preference that needs daily reset
        const existingPref: UserGroupPreference = {
            shareMyTransactions: true,
            lastToggleAt: createMockTimestamp(1),
            toggleCountToday: 2,
            toggleCountResetAt: createMockTimestamp(1),
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        // Mock: It IS a new day
        mockShouldResetUserDailyCount.mockReturnValue(true);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, false);

        // Assert: toggleCountResetAt should be set to serverTimestamp
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${TEST_GROUP_ID}.toggleCountResetAt`]: SERVER_TIMESTAMP_MARKER,
            }),
            { merge: true }
        );
    });

    it('should NOT set toggleCountResetAt when NOT resetting (same day)', async () => {
        // Arrange: Same day, no reset needed
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: createMockTimestamp(0),
            toggleCountToday: 1,
            toggleCountResetAt: createMockTimestamp(0),
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        // Mock: It is NOT a new day
        mockShouldResetUserDailyCount.mockReturnValue(false);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        // Assert: toggleCountResetAt should NOT be in the update
        const setDocCalls = mockSetDoc.mock.calls;
        const updateData = setDocCalls[0][1] as Record<string, unknown>;
        expect(updateData).not.toHaveProperty(`groupPreferences.${TEST_GROUP_ID}.toggleCountResetAt`);
    });

    it('should create document for new user (first write) (Story 14d-v2-1-12b AC#3)', async () => {
        // Arrange: No existing preferences document
        mockGetDoc.mockResolvedValue(createMockDocSnapshotNotExists() as any);
        mockShouldResetUserDailyCount.mockReturnValue(true); // No existing resetAt means reset

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        // Assert: Should create with merge behavior
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${TEST_GROUP_ID}.shareMyTransactions`]: true,
                [`groupPreferences.${TEST_GROUP_ID}.lastToggleAt`]: SERVER_TIMESTAMP_MARKER,
                [`groupPreferences.${TEST_GROUP_ID}.toggleCountToday`]: 1,
                [`groupPreferences.${TEST_GROUP_ID}.toggleCountResetAt`]: SERVER_TIMESTAMP_MARKER,
            }),
            { merge: true }
        );
    });

    it('should use merge behavior (setDoc with merge: true) (Story 14d-v2-1-12b AC#2)', async () => {
        // Arrange
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        // Assert
        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(Object),
            { merge: true }
        );
    });

    it('should throw error on Firestore failure', async () => {
        // Arrange
        mockGetDoc.mockRejectedValue(new Error('Network error'));

        // Act & Assert
        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true)
        ).rejects.toThrow('Network error');
    });

    it('should use correct document path', async () => {
        // Arrange
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);

        // Act
        await updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true);

        // Assert
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

    // =========================================================================
    // Input Validation Tests (Story 14d-v2-1-12b ECC Review fixes)
    // =========================================================================

    it('should throw error for empty groupId', async () => {
        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, '', true)
        ).rejects.toThrow('Invalid groupId');
    });

    it('should throw error for groupId with dots (path injection prevention)', async () => {
        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, 'test.malicious.path', true)
        ).rejects.toThrow('Invalid groupId');
    });

    it('should throw error for non-boolean enabled parameter', async () => {
        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, 'true' as any)
        ).rejects.toThrow('enabled must be a boolean');
    });

    it('should throw error for null enabled parameter', async () => {
        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, null as any)
        ).rejects.toThrow('enabled must be a boolean');
    });

    // Task 3.4: userId/appId validation tests
    it('should throw error for empty userId', async () => {
        await expect(
            updateShareMyTransactions(mockDb, '', TEST_APP_ID, TEST_GROUP_ID, true)
        ).rejects.toThrow('Invalid userId: must be a non-empty string');
    });

    it('should throw error for empty appId', async () => {
        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, '', TEST_GROUP_ID, true)
        ).rejects.toThrow('Invalid appId: must be a non-empty string');
    });

    // Task 3.6: Special characters in groupId tests
    // Story 14d-v2-1-12c ECC Review #2: Enhanced validation with regex /^[a-zA-Z0-9_-]{1,128}$/
    it.each([
        ['/', 'forward slash'],
        ['$', 'dollar sign'],
        ['[', 'opening bracket'],
        [']', 'closing bracket'],
        ['#', 'hash'],
        ['@', 'at sign'],
        [' ', 'space'],
        ['!', 'exclamation'],
    ])('should reject groupId with %s (%s) - invalid character', async (char, _description) => {
        const groupIdWithChar = `group${char}id`;

        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, groupIdWithChar, true)
        ).rejects.toThrow('Invalid groupId');
    });

    it('should reject groupId exceeding 128 characters', async () => {
        const longGroupId = 'a'.repeat(129);

        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, longGroupId, true)
        ).rejects.toThrow('Invalid groupId');
    });

    it('should accept groupId with exactly 128 characters', async () => {
        const maxLengthGroupId = 'a'.repeat(128);
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [maxLengthGroupId]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);

        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, maxLengthGroupId, true)
        ).resolves.not.toThrow();
    });

    it.each([
        ['valid-group-id', 'alphanumeric with hyphen'],
        ['valid_group_id', 'alphanumeric with underscore'],
        ['ValidGroupId123', 'mixed case alphanumeric'],
        ['a', 'single character'],
        ['ABC123', 'uppercase alphanumeric'],
    ])('should accept valid groupId: %s (%s)', async (groupId, _description) => {
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [groupId]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);

        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, groupId, true)
        ).resolves.not.toThrow();
    });

    // Task 3.8: Test for setDoc failure after successful getDoc
    it('should throw error when setDoc fails after successful getDoc', async () => {
        // Arrange: getDoc succeeds but setDoc fails
        const existingPref: UserGroupPreference = {
            shareMyTransactions: false,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };
        mockGetDoc.mockResolvedValue(createMockDocSnapshot({
            groupPreferences: { [TEST_GROUP_ID]: existingPref },
        }) as any);
        mockShouldResetUserDailyCount.mockReturnValue(false);
        mockSetDoc.mockRejectedValue(new Error('Firestore write failed'));

        // Act & Assert
        await expect(
            updateShareMyTransactions(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, true)
        ).rejects.toThrow('Firestore write failed');
    });
});

// =============================================================================
// Tests: setGroupPreference Input Validation (Story 14d-v2-1-12b Task 3.1)
// =============================================================================

describe('setGroupPreference - Input Validation', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';
    const TEST_GROUP_ID = 'test-group-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'sharedGroups' } as any);
        mockSetDoc.mockResolvedValue(undefined);
    });

    it('should throw error for empty groupId', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, '', true)
        ).rejects.toThrow('Invalid groupId');
    });

    it('should throw error for groupId with dots (path injection prevention)', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, 'test.malicious.path', true)
        ).rejects.toThrow('Invalid groupId');
    });

    // Story 14d-v2-1-12c ECC Review #2: Enhanced validation with regex /^[a-zA-Z0-9_-]{1,128}$/
    it.each([
        ['/', 'forward slash'],
        ['$', 'dollar sign'],
        ['[', 'opening bracket'],
        [']', 'closing bracket'],
        ['#', 'hash'],
        ['@', 'at sign'],
        [' ', 'space'],
    ])('should reject groupId with %s (%s) - invalid character', async (char, _description) => {
        const groupIdWithChar = `group${char}id`;

        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, groupIdWithChar, true)
        ).rejects.toThrow('Invalid groupId');
    });

    it('should reject groupId exceeding 128 characters', async () => {
        const longGroupId = 'a'.repeat(129);

        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, longGroupId, true)
        ).rejects.toThrow('Invalid groupId');
    });

    it.each([
        ['valid-group-id', 'alphanumeric with hyphen'],
        ['valid_group_id', 'alphanumeric with underscore'],
        ['ValidGroupId123', 'mixed case alphanumeric'],
    ])('should accept valid groupId: %s (%s)', async (groupId, _description) => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, groupId, true)
        ).resolves.not.toThrow();

        expect(mockSetDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                [`groupPreferences.${groupId}`]: expect.any(Object),
            }),
            { merge: true }
        );
    });

    // Story 14d-v2-1-12b Task 4.2: userId/appId validation
    it('should throw error for empty userId', async () => {
        await expect(
            setGroupPreference(mockDb, '', TEST_APP_ID, TEST_GROUP_ID, true)
        ).rejects.toThrow('Invalid userId: must be a non-empty string');
    });

    it('should throw error for non-string userId', async () => {
        await expect(
            setGroupPreference(mockDb, 123 as any, TEST_APP_ID, TEST_GROUP_ID, true)
        ).rejects.toThrow('Invalid userId: must be a non-empty string');
    });

    it('should throw error for null userId', async () => {
        await expect(
            setGroupPreference(mockDb, null as any, TEST_APP_ID, TEST_GROUP_ID, true)
        ).rejects.toThrow('Invalid userId: must be a non-empty string');
    });

    it('should throw error for empty appId', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, '', TEST_GROUP_ID, true)
        ).rejects.toThrow('Invalid appId: must be a non-empty string');
    });

    it('should throw error for non-string appId', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, 456 as any, TEST_GROUP_ID, true)
        ).rejects.toThrow('Invalid appId: must be a non-empty string');
    });

    it('should throw error for null appId', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, null as any, TEST_GROUP_ID, true)
        ).rejects.toThrow('Invalid appId: must be a non-empty string');
    });

    // Story 14d-v2-1-12b Task 4.4 & 4.5: shareMyTransactions boolean validation
    it('should throw error for string shareMyTransactions', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, 'true' as any)
        ).rejects.toThrow('shareMyTransactions must be a boolean');
    });

    it('should throw error for null shareMyTransactions', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, null as any)
        ).rejects.toThrow('shareMyTransactions must be a boolean');
    });

    it('should throw error for undefined shareMyTransactions', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, undefined as any)
        ).rejects.toThrow('shareMyTransactions must be a boolean');
    });

    it('should throw error for number shareMyTransactions', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, 1 as any)
        ).rejects.toThrow('shareMyTransactions must be a boolean');
    });

    it('should throw error for object shareMyTransactions', async () => {
        await expect(
            setGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, { value: true } as any)
        ).rejects.toThrow('shareMyTransactions must be a boolean');
    });
});

// =============================================================================
// Tests: removeGroupPreference Input Validation (Story 14d-v2-1-12b Task 3.2)
// =============================================================================

describe('removeGroupPreference - Input Validation', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';
    const TEST_GROUP_ID = 'test-group-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'sharedGroups' } as any);
        mockSetDoc.mockResolvedValue(undefined);
    });

    it('should throw error for empty groupId', async () => {
        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, '')
        ).rejects.toThrow('Invalid groupId');
    });

    it('should throw error for groupId with dots (path injection prevention)', async () => {
        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, 'test.malicious.path')
        ).rejects.toThrow('Invalid groupId');
    });

    // Story 14d-v2-1-12c ECC Review #2: Enhanced validation with regex /^[a-zA-Z0-9_-]{1,128}$/
    it.each([
        ['/', 'forward slash'],
        ['$', 'dollar sign'],
        ['[', 'opening bracket'],
        [']', 'closing bracket'],
        ['#', 'hash'],
        ['@', 'at sign'],
        [' ', 'space'],
    ])('should reject groupId with %s (%s) - invalid character', async (char, _description) => {
        const groupIdWithChar = `group${char}id`;

        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, groupIdWithChar)
        ).rejects.toThrow('Invalid groupId');
    });

    it('should reject groupId exceeding 128 characters', async () => {
        const longGroupId = 'a'.repeat(129);

        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, longGroupId)
        ).rejects.toThrow('Invalid groupId');
    });

    it.each([
        ['valid-group-id', 'alphanumeric with hyphen'],
        ['valid_group_id', 'alphanumeric with underscore'],
        ['ValidGroupId123', 'mixed case alphanumeric'],
    ])('should accept valid groupId: %s (%s)', async (groupId, _description) => {
        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, groupId)
        ).resolves.not.toThrow();
    });

    // Story 14d-v2-1-12b Task 4.3: userId/appId validation
    it('should throw error for empty userId', async () => {
        await expect(
            removeGroupPreference(mockDb, '', TEST_APP_ID, TEST_GROUP_ID)
        ).rejects.toThrow('Invalid userId: must be a non-empty string');
    });

    it('should throw error for non-string userId', async () => {
        await expect(
            removeGroupPreference(mockDb, 123 as any, TEST_APP_ID, TEST_GROUP_ID)
        ).rejects.toThrow('Invalid userId: must be a non-empty string');
    });

    it('should throw error for null userId', async () => {
        await expect(
            removeGroupPreference(mockDb, null as any, TEST_APP_ID, TEST_GROUP_ID)
        ).rejects.toThrow('Invalid userId: must be a non-empty string');
    });

    it('should throw error for empty appId', async () => {
        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, '', TEST_GROUP_ID)
        ).rejects.toThrow('Invalid appId: must be a non-empty string');
    });

    it('should throw error for non-string appId', async () => {
        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, 456 as any, TEST_GROUP_ID)
        ).rejects.toThrow('Invalid appId: must be a non-empty string');
    });

    it('should throw error for null appId', async () => {
        await expect(
            removeGroupPreference(mockDb, TEST_USER_ID, null as any, TEST_GROUP_ID)
        ).rejects.toThrow('Invalid appId: must be a non-empty string');
    });
});

// =============================================================================
// Tests: subscribeToUserGroupPreference (Story 14d-v2-1-12c)
// =============================================================================

describe('subscribeToUserGroupPreference (Story 14d-v2-1-12c)', () => {
    const mockDb = createMockDb();
    const TEST_USER_ID = 'test-user-id';
    const TEST_APP_ID = 'test-app-id';
    const TEST_GROUP_ID = 'test-group-id';

    beforeEach(() => {
        vi.clearAllMocks();
        mockDoc.mockReturnValue({ id: 'sharedGroups' } as any);
    });

    it('should call onSnapshot with correct document reference', () => {
        const callback = vi.fn();
        const unsubscribe = vi.fn();
        mockOnSnapshot.mockReturnValue(unsubscribe as any);

        subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback);

        expect(mockDoc).toHaveBeenCalledWith(
            mockDb,
            'artifacts',
            TEST_APP_ID,
            'users',
            TEST_USER_ID,
            'preferences',
            'sharedGroups'
        );
        expect(mockOnSnapshot).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const unsubscribe = vi.fn();
        mockOnSnapshot.mockReturnValue(unsubscribe as any);

        const result = subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback);

        expect(result).toBe(unsubscribe);
    });

    it('should call callback with preference when document exists', () => {
        const callback = vi.fn();
        const unsubscribe = vi.fn();
        const mockPreference: UserGroupPreference = {
            shareMyTransactions: true,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };

        mockOnSnapshot.mockImplementation((_docRef: any, onNext: any, _onError: any) => {
            // Simulate snapshot callback
            onNext({
                exists: () => true,
                data: () => ({
                    groupPreferences: { [TEST_GROUP_ID]: mockPreference },
                }),
            });
            return unsubscribe;
        });

        subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback);

        expect(callback).toHaveBeenCalledWith(mockPreference);
    });

    it('should call callback with null when document does not exist', () => {
        const callback = vi.fn();
        const unsubscribe = vi.fn();

        mockOnSnapshot.mockImplementation((_docRef: any, onNext: any, _onError: any) => {
            // Simulate non-existent document
            onNext({
                exists: () => false,
            });
            return unsubscribe;
        });

        subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback);

        expect(callback).toHaveBeenCalledWith(null);
    });

    it('should call callback with null when group preference is not found', () => {
        const callback = vi.fn();
        const unsubscribe = vi.fn();

        mockOnSnapshot.mockImplementation((_docRef: any, onNext: any, _onError: any) => {
            // Simulate document exists but without the group preference
            onNext({
                exists: () => true,
                data: () => ({
                    groupPreferences: { 'other-group': { shareMyTransactions: true } },
                }),
            });
            return unsubscribe;
        });

        subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback);

        expect(callback).toHaveBeenCalledWith(null);
    });

    it('should call callback with null on error', () => {
        const callback = vi.fn();
        const unsubscribe = vi.fn();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockOnSnapshot.mockImplementation((_docRef: any, _onNext: any, onError: any) => {
            // Simulate error
            onError(new Error('Network error'));
            return unsubscribe;
        });

        subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback);

        expect(callback).toHaveBeenCalledWith(null);
        expect(consoleSpy).toHaveBeenCalledWith(
            'Error subscribing to user group preference:',
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    // =========================================================================
    // Story 14d-v2-1-12c Action Items: onError callback parameter (HIGH priority)
    // =========================================================================

    it('should call onError callback when provided and error occurs', () => {
        const callback = vi.fn();
        const onError = vi.fn();
        const unsubscribe = vi.fn();
        const testError = new Error('Network error');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockOnSnapshot.mockImplementation((_docRef: any, _onNext: any, errorHandler: any) => {
            // Simulate error
            errorHandler(testError);
            return unsubscribe;
        });

        subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback, onError);

        // onError should be called with the Error object
        expect(onError).toHaveBeenCalledWith(testError);
        // callback should still be called with null (backward compatibility)
        expect(callback).toHaveBeenCalledWith(null);

        consoleSpy.mockRestore();
    });

    it('should work without onError callback (backward compatibility)', () => {
        const callback = vi.fn();
        const unsubscribe = vi.fn();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockOnSnapshot.mockImplementation((_docRef: any, _onNext: any, errorHandler: any) => {
            // Simulate error
            errorHandler(new Error('Network error'));
            return unsubscribe;
        });

        // Call without onError parameter - should not throw
        expect(() => {
            subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback);
        }).not.toThrow();

        // callback should still be called with null
        expect(callback).toHaveBeenCalledWith(null);

        consoleSpy.mockRestore();
    });

    it('should not call onError when subscription succeeds', () => {
        const callback = vi.fn();
        const onError = vi.fn();
        const unsubscribe = vi.fn();
        const mockPreference: UserGroupPreference = {
            shareMyTransactions: true,
            lastToggleAt: null,
            toggleCountToday: 0,
            toggleCountResetAt: null,
        };

        mockOnSnapshot.mockImplementation((_docRef: any, onNext: any, _onError: any) => {
            // Simulate success
            onNext({
                exists: () => true,
                data: () => ({
                    groupPreferences: { [TEST_GROUP_ID]: mockPreference },
                }),
            });
            return unsubscribe;
        });

        subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, TEST_GROUP_ID, callback, onError);

        // onError should NOT be called on success
        expect(onError).not.toHaveBeenCalled();
        // callback should be called with preference
        expect(callback).toHaveBeenCalledWith(mockPreference);
    });

    // =========================================================================
    // Story 14d-v2-1-12c ECC Review #2: Enhanced groupId validation (MEDIUM)
    // =========================================================================

    describe('Input validation', () => {
        it('should throw error for empty groupId', () => {
            const callback = vi.fn();

            expect(() => {
                subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, '', callback);
            }).toThrow('Invalid groupId');
        });

        it('should throw error for groupId with dots', () => {
            const callback = vi.fn();

            expect(() => {
                subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, 'test.path', callback);
            }).toThrow('Invalid groupId');
        });

        it.each([
            ['/', 'forward slash'],
            ['$', 'dollar sign'],
            ['[', 'opening bracket'],
            ['#', 'hash'],
            ['@', 'at sign'],
            [' ', 'space'],
        ])('should throw error for groupId with %s (%s)', (char, _description) => {
            const callback = vi.fn();
            const groupIdWithChar = `group${char}id`;

            expect(() => {
                subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, groupIdWithChar, callback);
            }).toThrow('Invalid groupId');
        });

        it('should throw error for groupId exceeding 128 characters', () => {
            const callback = vi.fn();
            const longGroupId = 'a'.repeat(129);

            expect(() => {
                subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, longGroupId, callback);
            }).toThrow('Invalid groupId');
        });

        it.each([
            ['valid-group-id', 'alphanumeric with hyphen'],
            ['valid_group_id', 'alphanumeric with underscore'],
            ['ValidGroupId123', 'mixed case alphanumeric'],
        ])('should accept valid groupId: %s (%s)', (groupId, _description) => {
            const callback = vi.fn();
            const unsubscribe = vi.fn();
            mockOnSnapshot.mockReturnValue(unsubscribe as any);

            expect(() => {
                subscribeToUserGroupPreference(mockDb, TEST_USER_ID, TEST_APP_ID, groupId, callback);
            }).not.toThrow();
        });

        it('should throw error for empty userId', () => {
            const callback = vi.fn();

            expect(() => {
                subscribeToUserGroupPreference(mockDb, '', TEST_APP_ID, TEST_GROUP_ID, callback);
            }).toThrow('Invalid userId');
        });

        it('should throw error for empty appId', () => {
            const callback = vi.fn();

            expect(() => {
                subscribeToUserGroupPreference(mockDb, TEST_USER_ID, '', TEST_GROUP_ID, callback);
            }).toThrow('Invalid appId');
        });
    });
});
