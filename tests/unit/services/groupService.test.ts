/**
 * Group Service Tests
 *
 * Story 14d-v2-1-4b: Service & Hook Layer
 * Story 14d-v2-1-7a: Leave + Transfer Service Layer
 * Story 14d-v2-1-7b: Deletion Service Logic
 *
 * Tests for group service functions:
 * - createGroup (AC #1)
 * - getUserGroups (AC #2)
 * - getGroupCount (AC #3)
 * - canCreateGroup (helper)
 * - getDeviceTimezone (utility)
 * - leaveGroup (Story 7a)
 * - transferOwnership (Story 7a)
 * - deleteGroupAsLastMember (Story 7b)
 * - deleteGroupAsOwner (Story 7b)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockTimestampDaysAgo, createMockTimestampDaysFromNow } from '../../helpers';

// Mock Firestore before importing the module
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
    return {
        ...actual,
        collection: vi.fn(),
        addDoc: vi.fn(),
        getDocs: vi.fn(),
        getDoc: vi.fn(),
        getCountFromServer: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
        doc: vi.fn(),
        runTransaction: vi.fn(),
        arrayRemove: vi.fn((value) => ({ _arrayRemove: value })),
        writeBatch: vi.fn(),
        deleteDoc: vi.fn(),
        updateDoc: vi.fn(),
    };
});

// Mock sharedGroupService (for generateShareCode)
vi.mock('../../../src/services/sharedGroupService', () => ({
    generateShareCode: vi.fn(() => 'MockShareCode12345'),
}));

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    getCountFromServer,
    query,
    where,
    doc,
    runTransaction,
    arrayRemove,
    writeBatch,
    deleteDoc,
    updateDoc,
} from 'firebase/firestore';
import {
    createGroup,
    getUserGroups,
    getGroupCount,
    canCreateGroup,
    getDeviceTimezone,
    leaveGroup,
    transferOwnership,
    deleteGroupAsLastMember,
    deleteGroupAsOwner,
} from '../../../src/features/shared-groups/services/groupService';
import { generateShareCode } from '../../../src/services/sharedGroupService';
import { SHARED_GROUP_LIMITS } from '../../../src/types/sharedGroup';
import type { SharedGroup } from '../../../src/types/sharedGroup';

const mockCollection = vi.mocked(collection);
const mockAddDoc = vi.mocked(addDoc);
const mockGetDocs = vi.mocked(getDocs);
const mockGetDoc = vi.mocked(getDoc);
const mockGetCountFromServer = vi.mocked(getCountFromServer);
const mockQuery = vi.mocked(query);
const mockWhere = vi.mocked(where);
const mockGenerateShareCode = vi.mocked(generateShareCode);
const mockDoc = vi.mocked(doc);
const mockRunTransaction = vi.mocked(runTransaction);
const mockArrayRemove = vi.mocked(arrayRemove);
const mockWriteBatch = vi.mocked(writeBatch);
const mockDeleteDoc = vi.mocked(deleteDoc);
const mockUpdateDoc = vi.mocked(updateDoc);

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
 * Helper to create mock document snapshots
 */
function createMockDoc(id: string, data: Partial<SharedGroup>) {
    return {
        id,
        data: () => data,
        ref: { id },
    };
}


// =============================================================================
// Tests
// =============================================================================

describe('groupService', () => {
    const mockDb = createMockDb();
    const userId = 'user-123';
    const appId = 'boletapp';

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        mockCollection.mockReturnValue({} as any);
        mockQuery.mockReturnValue({} as any);
        mockWhere.mockReturnValue({} as any);
        mockGenerateShareCode.mockReturnValue('MockShareCode12345');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // getDeviceTimezone Tests (AC #1: Device timezone)
    // =========================================================================
    describe('getDeviceTimezone', () => {
        it('returns IANA timezone string', () => {
            const timezone = getDeviceTimezone();

            // Should be a string containing '/' (IANA format)
            expect(typeof timezone).toBe('string');
            expect(timezone.length).toBeGreaterThan(0);
        });

        it('uses Intl.DateTimeFormat API', () => {
            // The function should use the browser's Intl API
            const expected = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const result = getDeviceTimezone();

            expect(result).toBe(expected);
        });

        it('returns UTC as fallback when Intl.DateTimeFormat fails', () => {
            // Mock Intl.DateTimeFormat to throw an error
            const originalDateTimeFormat = Intl.DateTimeFormat;
            vi.stubGlobal('Intl', {
                ...Intl,
                DateTimeFormat: () => {
                    throw new Error('Intl not supported');
                },
            });

            const result = getDeviceTimezone();

            // Should return UTC fallback
            expect(result).toBe('UTC');

            // Restore original
            vi.stubGlobal('Intl', { ...Intl, DateTimeFormat: originalDateTimeFormat });
        });
    });

    // =========================================================================
    // createGroup Tests (AC #1)
    // =========================================================================
    describe('createGroup', () => {
        beforeEach(() => {
            mockAddDoc.mockResolvedValue({
                id: 'new-group-id',
            } as any);
            // Story 14d-v2-1-4c-2: createGroup now calls getGroupCount for defense-in-depth
            // Mock it to return under-limit by default
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            } as any);
        });

        it('creates group document in sharedGroups collection (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'sharedGroups');
        });

        it('sets ownerId to current user (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.ownerId).toBe(userId);
        });

        it('sets appId correctly (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.appId).toBe(appId);
        });

        it('sets name from input (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: '🏠 Gastos del Hogar',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.name).toBe('🏠 Gastos del Hogar');
        });

        it('initializes members array with owner (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.members).toEqual([userId]);
        });

        it('uses serverTimestamp for createdAt and updatedAt (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as any;

            expect(groupData.createdAt).toEqual({ _serverTimestamp: true });
            expect(groupData.updatedAt).toEqual({ _serverTimestamp: true });
        });

        it('sets device timezone in IANA format (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.timezone).toBe(getDeviceTimezone());
        });

        it('sets transactionSharingEnabled from input (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.transactionSharingEnabled).toBe(true);
        });

        it('sets transactionSharingEnabled to false when specified', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: false,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.transactionSharingEnabled).toBe(false);
        });

        it('initializes transaction sharing toggle fields (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.transactionSharingLastToggleAt).toBeNull();
            expect(groupData.transactionSharingToggleCountToday).toBe(0);
        });

        it('generates share code using sharedGroupService (AC #1)', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            expect(mockGenerateShareCode).toHaveBeenCalled();

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.shareCode).toBe('MockShareCode12345');
        });

        it('sets shareCodeExpiresAt to 7 days from now (AC #1)', async () => {
            const beforeCreate = new Date();

            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            // shareCodeExpiresAt should be a Timestamp roughly 7 days from now
            const expiryDate = (groupData.shareCodeExpiresAt as Timestamp).toDate();
            const expectedDate = new Date(beforeCreate);
            expectedDate.setDate(expectedDate.getDate() + SHARED_GROUP_LIMITS.SHARE_CODE_EXPIRY_DAYS);

            // Allow 1 second tolerance
            const diff = Math.abs(expiryDate.getTime() - expectedDate.getTime());
            expect(diff).toBeLessThan(1000);
        });

        it('uses default color when not provided', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.color).toBe('#10b981'); // DEFAULT_GROUP_COLOR
        });

        it('uses provided color when specified', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
                color: '#3b82f6',
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.color).toBe('#3b82f6');
        });

        it('includes icon when provided', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
                icon: '🏠',
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.icon).toBe('🏠');
        });

        it('stores owner profile when provided', async () => {
            const ownerProfile = {
                displayName: 'John Doe',
                email: 'john@example.com',
                photoURL: 'https://example.com/photo.jpg',
            };

            await createGroup(
                mockDb,
                userId,
                appId,
                {
                    name: 'Test Group',
                    transactionSharingEnabled: true,
                },
                ownerProfile
            );

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.memberProfiles).toEqual({
                [userId]: ownerProfile,
            });
        });

        it('returns SharedGroup with generated ID (AC #1)', async () => {
            mockAddDoc.mockResolvedValue({
                id: 'generated-doc-id',
            } as any);

            const result = await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            expect(result.id).toBe('generated-doc-id');
            expect(result.name).toBe('Test Group');
            expect(result.ownerId).toBe(userId);
        });

        it('initializes memberUpdates as empty object', async () => {
            await createGroup(mockDb, userId, appId, {
                name: 'Test Group',
                transactionSharingEnabled: true,
            });

            const addDocCall = mockAddDoc.mock.calls[0];
            const groupData = addDocCall[1] as Partial<SharedGroup>;

            expect(groupData.memberUpdates).toEqual({});
        });

        it('throws error when Firestore write fails', async () => {
            mockAddDoc.mockRejectedValue(new Error('Firestore error'));

            await expect(
                createGroup(mockDb, userId, appId, {
                    name: 'Test Group',
                    transactionSharingEnabled: true,
                })
            ).rejects.toThrow('Firestore error');
        });

        // Story 14d-v2-1-4c-2: Defense in depth - BC-1 limit check
        describe('BC-1 defense in depth (Story 14d-v2-1-4c-2)', () => {
            it('throws error when user is at MAX_MEMBER_OF_GROUPS limit', async () => {
                mockGetCountFromServer.mockResolvedValue({
                    data: () => ({ count: SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS }),
                } as any);

                await expect(
                    createGroup(mockDb, userId, appId, {
                        name: 'Test Group',
                        transactionSharingEnabled: true,
                    })
                ).rejects.toThrow(`Cannot create group: user has reached the maximum limit of ${SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS} groups`);
            });

            it('throws error when user exceeds MAX_MEMBER_OF_GROUPS limit', async () => {
                mockGetCountFromServer.mockResolvedValue({
                    data: () => ({ count: SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS + 5 }),
                } as any);

                await expect(
                    createGroup(mockDb, userId, appId, {
                        name: 'Test Group',
                        transactionSharingEnabled: true,
                    })
                ).rejects.toThrow('Cannot create group');
            });

            it('does not call addDoc when user is at limit', async () => {
                mockGetCountFromServer.mockResolvedValue({
                    data: () => ({ count: SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS }),
                } as any);

                try {
                    await createGroup(mockDb, userId, appId, {
                        name: 'Test Group',
                        transactionSharingEnabled: true,
                    });
                } catch {
                    // Expected to throw
                }

                expect(mockAddDoc).not.toHaveBeenCalled();
            });

            it('calls addDoc when user is under limit', async () => {
                mockGetCountFromServer.mockResolvedValue({
                    data: () => ({ count: SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS - 1 }),
                } as any);

                await createGroup(mockDb, userId, appId, {
                    name: 'Test Group',
                    transactionSharingEnabled: true,
                });

                expect(mockAddDoc).toHaveBeenCalled();
            });

            it('checks count before proceeding with creation', async () => {
                mockGetCountFromServer.mockResolvedValue({
                    data: () => ({ count: 0 }),
                } as any);

                await createGroup(mockDb, userId, appId, {
                    name: 'Test Group',
                    transactionSharingEnabled: true,
                });

                // getCountFromServer should be called before addDoc
                expect(mockGetCountFromServer).toHaveBeenCalled();
                const countCallOrder = mockGetCountFromServer.mock.invocationCallOrder[0];
                const addDocCallOrder = mockAddDoc.mock.invocationCallOrder[0];
                expect(countCallOrder).toBeLessThan(addDocCallOrder);
            });
        });
    });

    // =========================================================================
    // getUserGroups Tests (AC #2)
    // =========================================================================
    describe('getUserGroups', () => {
        it('queries sharedGroups collection (AC #2)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getUserGroups(mockDb, userId);

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'sharedGroups');
        });

        it('filters by members array containing userId (AC #2)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            await getUserGroups(mockDb, userId);

            expect(mockWhere).toHaveBeenCalledWith('members', 'array-contains', userId);
        });

        it('returns array of SharedGroup objects (AC #2)', async () => {
            const mockDocs = [
                createMockDoc('group-1', {
                    name: 'Group 1',
                    ownerId: userId,
                    members: [userId],
                }),
                createMockDoc('group-2', {
                    name: 'Group 2',
                    ownerId: 'other-user',
                    members: [userId, 'other-user'],
                }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 2,
            } as any);

            const result = await getUserGroups(mockDb, userId);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('group-1');
            expect(result[0].name).toBe('Group 1');
            expect(result[1].id).toBe('group-2');
            expect(result[1].name).toBe('Group 2');
        });

        it('returns empty array when user has no groups (AC #2)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                size: 0,
            } as any);

            const result = await getUserGroups(mockDb, userId);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('maps document data correctly with ID', async () => {
            const mockGroupData = {
                name: 'Test Group',
                ownerId: userId,
                appId: 'boletapp',
                color: '#10b981',
                members: [userId],
                timezone: 'America/Santiago',
                transactionSharingEnabled: true,
            };

            const mockDocs = [createMockDoc('test-id', mockGroupData)];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 1,
            } as any);

            const result = await getUserGroups(mockDb, userId);

            expect(result[0].id).toBe('test-id');
            expect(result[0].name).toBe('Test Group');
            expect(result[0].ownerId).toBe(userId);
            expect(result[0].transactionSharingEnabled).toBe(true);
        });
    });

    // =========================================================================
    // getGroupCount Tests (AC #3)
    // =========================================================================
    describe('getGroupCount', () => {
        it('queries sharedGroups collection (AC #3)', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            } as any);

            await getGroupCount(mockDb, userId);

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'sharedGroups');
        });

        it('filters by members array containing userId (AC #3)', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            } as any);

            await getGroupCount(mockDb, userId);

            expect(mockWhere).toHaveBeenCalledWith('members', 'array-contains', userId);
        });

        it('returns count of groups (AC #3)', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 3 }),
            } as any);

            const result = await getGroupCount(mockDb, userId);

            expect(result).toBe(3);
        });

        it('returns 0 when user has no groups (AC #3)', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            } as any);

            const result = await getGroupCount(mockDb, userId);

            expect(result).toBe(0);
        });

        it('returns correct count at BC-1 limit', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: SHARED_GROUP_LIMITS.MAX_OWNED_GROUPS }),
            } as any);

            const result = await getGroupCount(mockDb, userId);

            expect(result).toBe(SHARED_GROUP_LIMITS.MAX_OWNED_GROUPS);
        });

        it('uses getCountFromServer for efficient counting', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 5 }),
            } as any);

            await getGroupCount(mockDb, userId);

            expect(mockGetCountFromServer).toHaveBeenCalled();
            expect(mockGetDocs).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // canCreateGroup Tests (BC-1 helper)
    // =========================================================================
    describe('canCreateGroup', () => {
        it('returns true when user has no groups', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            } as any);

            const result = await canCreateGroup(mockDb, userId);

            expect(result).toBe(true);
        });

        it('returns true when user is under MAX_MEMBER_OF_GROUPS limit', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS - 1 }),
            } as any);

            const result = await canCreateGroup(mockDb, userId);

            expect(result).toBe(true);
        });

        it('returns false when user is at MAX_MEMBER_OF_GROUPS limit', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS }),
            } as any);

            const result = await canCreateGroup(mockDb, userId);

            expect(result).toBe(false);
        });

        it('returns false when user exceeds MAX_MEMBER_OF_GROUPS limit', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS + 1 }),
            } as any);

            const result = await canCreateGroup(mockDb, userId);

            expect(result).toBe(false);
        });

        it('uses getGroupCount internally', async () => {
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            } as any);

            await canCreateGroup(mockDb, userId);

            // Should have called the same Firestore query as getGroupCount
            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'sharedGroups');
            expect(mockWhere).toHaveBeenCalledWith('members', 'array-contains', userId);
        });
    });

    // =========================================================================
    // Integration Scenarios
    // =========================================================================
    describe('integration scenarios', () => {
        it('createGroup followed by getUserGroups returns the new group', async () => {
            const newGroupId = 'newly-created-group';

            // Story 14d-v2-1-4c-2: Mock getCountFromServer for defense-in-depth check
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 0 }),
            } as any);

            // Mock createGroup
            mockAddDoc.mockResolvedValue({ id: newGroupId } as any);

            const createdGroup = await createGroup(mockDb, userId, appId, {
                name: 'New Group',
                transactionSharingEnabled: true,
            });

            expect(createdGroup.id).toBe(newGroupId);
            expect(createdGroup.name).toBe('New Group');

            // Mock getUserGroups to return the created group
            mockGetDocs.mockResolvedValue({
                docs: [
                    createMockDoc(newGroupId, {
                        name: 'New Group',
                        ownerId: userId,
                        members: [userId],
                        transactionSharingEnabled: true,
                    }),
                ],
                size: 1,
            } as any);

            const groups = await getUserGroups(mockDb, userId);

            expect(groups).toHaveLength(1);
            expect(groups[0].id).toBe(newGroupId);
        });

        it('getGroupCount matches getUserGroups length', async () => {
            const mockDocs = [
                createMockDoc('group-1', { name: 'Group 1' }),
                createMockDoc('group-2', { name: 'Group 2' }),
                createMockDoc('group-3', { name: 'Group 3' }),
            ];

            // Mock getDocs for getUserGroups
            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                size: 3,
            } as any);

            // Mock getCountFromServer for getGroupCount
            mockGetCountFromServer.mockResolvedValue({
                data: () => ({ count: 3 }),
            } as any);

            const groups = await getUserGroups(mockDb, userId);
            const count = await getGroupCount(mockDb, userId);

            expect(groups.length).toBe(count);
            expect(count).toBe(3);
        });
    });

    // =========================================================================
    // leaveGroup Tests (Story 14d-v2-1-7a: AC #1, #2, #6)
    // =========================================================================
    describe('leaveGroup', () => {
        const groupId = 'test-group-id';
        const ownerId = 'owner-user';
        const memberId = 'member-user';

        /**
         * Helper to create a mock group with members
         */
        function createMockGroup(overrides: Partial<SharedGroup> = {}) {
            return {
                id: groupId,
                ownerId,
                appId: 'boletapp',
                name: 'Test Group',
                color: '#10b981',
                shareCode: 'testcode123',
                shareCodeExpiresAt: createMockTimestampDaysFromNow(7),
                members: [ownerId, memberId],
                memberUpdates: {},
                createdAt: createMockTimestampDaysAgo(30),
                updatedAt: createMockTimestampDaysAgo(1),
                timezone: 'America/Santiago',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
                ...overrides,
            };
        }

        beforeEach(() => {
            mockDoc.mockReturnValue({ id: groupId } as any);
            mockArrayRemove.mockImplementation((value) => ({ _arrayRemove: value }));
        });

        // AC #1: Member can leave group
        it('removes member from group members array (AC #1)', async () => {
            const mockGroup = createMockGroup();
            let updatedData: any = null;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn((ref, data) => {
                        updatedData = data;
                    }),
                };
                await updateFn(mockTransaction);
            });

            await leaveGroup(mockDb, memberId, groupId);

            expect(updatedData).toBeDefined();
            expect(updatedData.members).toEqual({ _arrayRemove: memberId });
        });

        it('updates updatedAt timestamp on leave (AC #1)', async () => {
            const mockGroup = createMockGroup();
            let updatedData: any = null;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn((ref, data) => {
                        updatedData = data;
                    }),
                };
                await updateFn(mockTransaction);
            });

            await leaveGroup(mockDb, memberId, groupId);

            expect(updatedData.updatedAt).toEqual({ _serverTimestamp: true });
        });

        it('preserves transactions in group (does not delete sharedGroupId) (AC #1)', async () => {
            const mockGroup = createMockGroup();
            let transactionCallCount = 0;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                transactionCallCount++;
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await leaveGroup(mockDb, memberId, groupId);

            // Only one transaction (group update), no transaction removal
            expect(transactionCallCount).toBe(1);
        });

        // AC #2: Owner cannot leave without transferring ownership
        it('throws error when owner tries to leave without transferring (AC #2)', async () => {
            const mockGroup = createMockGroup();

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await expect(leaveGroup(mockDb, ownerId, groupId)).rejects.toThrow(
                'You must transfer ownership before leaving'
            );
        });

        // AC #6: Cannot leave group you're not a member of
        it('throws error when non-member tries to leave (AC #6)', async () => {
            const mockGroup = createMockGroup();
            const nonMember = 'non-member-user';

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await expect(leaveGroup(mockDb, nonMember, groupId)).rejects.toThrow(
                'You are not a member of this group'
            );
        });

        it('throws error when group does not exist', async () => {
            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => false,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await expect(leaveGroup(mockDb, memberId, groupId)).rejects.toThrow(
                'Group not found'
            );
        });

        it('uses sharedGroups collection', async () => {
            const mockGroup = createMockGroup();

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await leaveGroup(mockDb, memberId, groupId);

            expect(mockDoc).toHaveBeenCalledWith(mockDb, 'sharedGroups', groupId);
        });

        it('uses Firestore transaction for atomic update', async () => {
            const mockGroup = createMockGroup();

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await leaveGroup(mockDb, memberId, groupId);

            expect(mockRunTransaction).toHaveBeenCalled();
        });

        // ECC Review: Input validation tests
        describe('input validation (ECC Review)', () => {
            it('throws error when userId is empty', async () => {
                await expect(leaveGroup(mockDb, '', groupId)).rejects.toThrow(
                    'User ID and group ID are required'
                );
            });

            it('throws error when groupId is empty', async () => {
                await expect(leaveGroup(mockDb, memberId, '')).rejects.toThrow(
                    'User ID and group ID are required'
                );
            });

            it('throws error when both userId and groupId are empty', async () => {
                await expect(leaveGroup(mockDb, '', '')).rejects.toThrow(
                    'User ID and group ID are required'
                );
            });

            it('does not call runTransaction when validation fails', async () => {
                try {
                    await leaveGroup(mockDb, '', groupId);
                } catch {
                    // Expected to throw
                }

                expect(mockRunTransaction).not.toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // transferOwnership Tests (Story 14d-v2-1-7a: AC #3, #4, #5)
    // =========================================================================
    describe('transferOwnership', () => {
        const groupId = 'test-group-id';
        const currentOwnerId = 'current-owner';
        const newOwnerId = 'new-owner';
        const otherMember = 'other-member';

        /**
         * Helper to create a mock group with toggle state
         */
        function createMockGroup(overrides: Partial<SharedGroup> = {}) {
            return {
                id: groupId,
                ownerId: currentOwnerId,
                appId: 'boletapp',
                name: 'Test Group',
                color: '#10b981',
                shareCode: 'testcode123',
                shareCodeExpiresAt: createMockTimestampDaysFromNow(7),
                members: [currentOwnerId, newOwnerId, otherMember],
                memberUpdates: {},
                createdAt: createMockTimestampDaysAgo(30),
                updatedAt: createMockTimestampDaysAgo(1),
                timezone: 'America/Santiago',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: createMockTimestampDaysAgo(2),
                transactionSharingToggleCountToday: 2,
                ...overrides,
            };
        }

        beforeEach(() => {
            mockDoc.mockReturnValue({ id: groupId } as any);
        });

        // AC #3: Transfer ownerId to new owner
        it('transfers ownerId to new owner (AC #3)', async () => {
            const mockGroup = createMockGroup();
            let updatedData: any = null;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn((ref, data) => {
                        updatedData = data;
                    }),
                };
                await updateFn(mockTransaction);
            });

            await transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId);

            expect(updatedData.ownerId).toBe(newOwnerId);
        });

        // AC #3: Preserve toggle state fields - NO reset on transfer
        it('preserves transactionSharingToggleCountToday (NO reset) (AC #3)', async () => {
            const mockGroup = createMockGroup({
                transactionSharingToggleCountToday: 2,
            });
            let updatedData: any = null;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn((ref, data) => {
                        updatedData = data;
                    }),
                };
                await updateFn(mockTransaction);
            });

            await transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId);

            // Should NOT include toggle count reset
            expect(updatedData.transactionSharingToggleCountToday).toBeUndefined();
        });

        it('preserves transactionSharingLastToggleAt (NO reset) (AC #3)', async () => {
            const mockGroup = createMockGroup();
            let updatedData: any = null;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn((ref, data) => {
                        updatedData = data;
                    }),
                };
                await updateFn(mockTransaction);
            });

            await transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId);

            // Should NOT include last toggle at reset
            expect(updatedData.transactionSharingLastToggleAt).toBeUndefined();
        });

        it('preserves transactionSharingToggleCountResetAt (NO reset) (AC #3)', async () => {
            const mockGroup = createMockGroup();
            let updatedData: any = null;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn((ref, data) => {
                        updatedData = data;
                    }),
                };
                await updateFn(mockTransaction);
            });

            await transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId);

            // Should NOT include toggle count reset at field
            expect(updatedData.transactionSharingToggleCountResetAt).toBeUndefined();
        });

        // AC #4: Update updatedAt timestamp
        it('updates updatedAt timestamp on transfer (AC #4)', async () => {
            const mockGroup = createMockGroup();
            let updatedData: any = null;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn((ref, data) => {
                        updatedData = data;
                    }),
                };
                await updateFn(mockTransaction);
            });

            await transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId);

            expect(updatedData.updatedAt).toEqual({ _serverTimestamp: true });
        });

        // AC #5: Cannot transfer to non-member
        it('throws error when transferring to non-member (AC #5)', async () => {
            const mockGroup = createMockGroup({
                members: [currentOwnerId, otherMember], // newOwnerId is NOT in members
            });

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await expect(
                transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId)
            ).rejects.toThrow('Selected user is not a member of this group');
        });

        it('throws error when non-owner tries to transfer', async () => {
            const mockGroup = createMockGroup();

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await expect(
                transferOwnership(mockDb, newOwnerId, otherMember, groupId) // newOwnerId is not the owner
            ).rejects.toThrow('Only the group owner can transfer ownership');
        });

        it('throws error when group does not exist', async () => {
            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => false,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await expect(
                transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId)
            ).rejects.toThrow('Group not found');
        });

        it('uses sharedGroups collection', async () => {
            const mockGroup = createMockGroup();

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId);

            expect(mockDoc).toHaveBeenCalledWith(mockDb, 'sharedGroups', groupId);
        });

        it('uses Firestore transaction for atomic update', async () => {
            const mockGroup = createMockGroup();

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn(),
                };
                await updateFn(mockTransaction);
            });

            await transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId);

            expect(mockRunTransaction).toHaveBeenCalled();
        });

        it('only updates ownerId and updatedAt (minimal update) (AC #4)', async () => {
            const mockGroup = createMockGroup();
            let updatedData: any = null;

            mockRunTransaction.mockImplementation(async (_db, updateFn) => {
                const mockTransaction = {
                    get: vi.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    }),
                    update: vi.fn((ref, data) => {
                        updatedData = data;
                    }),
                };
                await updateFn(mockTransaction);
            });

            await transferOwnership(mockDb, currentOwnerId, newOwnerId, groupId);

            // Only these two fields should be updated
            const keys = Object.keys(updatedData);
            expect(keys).toContain('ownerId');
            expect(keys).toContain('updatedAt');
            expect(keys.length).toBe(2);
        });

        // ECC Review: Input validation tests
        describe('input validation (ECC Review)', () => {
            it('throws error when currentOwnerId is empty', async () => {
                await expect(
                    transferOwnership(mockDb, '', newOwnerId, groupId)
                ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
            });

            it('throws error when newOwnerId is empty', async () => {
                await expect(
                    transferOwnership(mockDb, currentOwnerId, '', groupId)
                ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
            });

            it('throws error when groupId is empty', async () => {
                await expect(
                    transferOwnership(mockDb, currentOwnerId, newOwnerId, '')
                ).rejects.toThrow('Current owner ID, new owner ID, and group ID are required');
            });

            it('does not call runTransaction when validation fails', async () => {
                try {
                    await transferOwnership(mockDb, '', newOwnerId, groupId);
                } catch {
                    // Expected to throw
                }

                expect(mockRunTransaction).not.toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // deleteGroupAsLastMember Tests (Story 14d-v2-1-7b: AC #1, #3)
    // =========================================================================
    describe('deleteGroupAsLastMember', () => {
        const groupId = 'test-group-id';
        const userId = 'last-member-user';
        const appId = 'boletapp';

        /**
         * Helper to create a mock group with a single member (last member scenario)
         */
        function createMockGroup(overrides: Partial<SharedGroup> = {}) {
            return {
                id: groupId,
                ownerId: userId,
                appId: 'boletapp',
                name: 'Test Group',
                color: '#10b981',
                shareCode: 'testcode123',
                shareCodeExpiresAt: createMockTimestampDaysFromNow(7),
                members: [userId], // Single member - last member
                memberUpdates: {},
                createdAt: createMockTimestampDaysAgo(30),
                updatedAt: createMockTimestampDaysAgo(1),
                timezone: 'America/Santiago',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
                ...overrides,
            };
        }

        /**
         * Helper to create mock batch
         */
        function createMockBatch() {
            return {
                update: vi.fn(),
                delete: vi.fn(),
                commit: vi.fn().mockResolvedValue(undefined),
            };
        }

        beforeEach(() => {
            mockDoc.mockReturnValue({ id: groupId } as any);
            mockCollection.mockReturnValue({} as any);
            mockQuery.mockReturnValue({} as any);
            mockWhere.mockReturnValue({} as any);
        });

        // Input Validation Tests
        describe('input validation', () => {
            it('throws error when userId is empty', async () => {
                await expect(
                    deleteGroupAsLastMember(mockDb, '', groupId)
                ).rejects.toThrow('User ID and group ID are required');
            });

            it('throws error when groupId is empty', async () => {
                await expect(
                    deleteGroupAsLastMember(mockDb, userId, '')
                ).rejects.toThrow('User ID and group ID are required');
            });

            it('does not call getDoc when validation fails', async () => {
                try {
                    await deleteGroupAsLastMember(mockDb, '', groupId);
                } catch {
                    // Expected to throw
                }

                expect(mockGetDoc).not.toHaveBeenCalled();
            });
        });

        // Group Validation Tests
        describe('group validation', () => {
            it('throws error when group not found', async () => {
                mockGetDoc.mockResolvedValue({
                    exists: () => false,
                } as any);

                await expect(
                    deleteGroupAsLastMember(mockDb, userId, groupId)
                ).rejects.toThrow('Group not found');
            });

            it('throws error when user is not a member', async () => {
                const mockGroup = createMockGroup({
                    members: ['other-user'], // userId is not a member
                });

                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                await expect(
                    deleteGroupAsLastMember(mockDb, userId, groupId)
                ).rejects.toThrow('You are not a member of this group');
            });

            it('throws error when group has multiple members (AC #1)', async () => {
                const mockGroup = createMockGroup({
                    members: [userId, 'other-user'], // Multiple members
                });

                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                await expect(
                    deleteGroupAsLastMember(mockDb, userId, groupId)
                ).rejects.toThrow('Cannot delete group with other members');
            });
        });

        // Cascade Deletion Tests (AC #3)
        describe('cascade deletion (AC #3)', () => {
            let mockTransactionDelete: ReturnType<typeof vi.fn>;

            beforeEach(() => {
                const mockGroup = createMockGroup();
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                // Default: empty subcollections and no transactions
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    empty: true,
                    size: 0,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                // ECC Review: TOCTOU fix - deletion now uses runTransaction
                mockTransactionDelete = vi.fn();
                mockRunTransaction.mockImplementation(async (_db, callback) => {
                    const mockTransaction = {
                        get: vi.fn().mockResolvedValue({
                            exists: () => true,
                            data: () => createMockGroup(),
                            id: groupId,
                        }),
                        delete: mockTransactionDelete,
                    };
                    await callback(mockTransaction);
                });
            });

            it('clears sharedGroupId on all user transactions', async () => {
                const mockTransactionDocs = [
                    { ref: { id: 'tx-1' } },
                    { ref: { id: 'tx-2' } },
                ];

                // First getDocs call returns transactions, rest are empty
                mockGetDocs
                    .mockResolvedValueOnce({
                        docs: mockTransactionDocs,
                        empty: false,
                        size: 2,
                    } as any)
                    .mockResolvedValue({
                        docs: [],
                        empty: true,
                        size: 0,
                    } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                // Should have called batch.update for each transaction
                expect(mockBatch.update).toHaveBeenCalledTimes(2);
                expect(mockBatch.update).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({ sharedGroupId: null })
                );
            });

            it('deletes changelog subcollection', async () => {
                const mockChangelogDocs = [
                    { ref: { id: 'changelog-1' } },
                    { ref: { id: 'changelog-2' } },
                ];

                // First call: no transactions, second call: changelog docs
                mockGetDocs
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // transactions
                    .mockResolvedValueOnce({ docs: mockChangelogDocs, empty: false, size: 2 } as any) // changelog
                    .mockResolvedValue({ docs: [], empty: true, size: 0 } as any); // analytics, invitations

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                // Should delete changelog docs via batch
                expect(mockBatch.delete).toHaveBeenCalledTimes(2);
            });

            it('deletes analytics subcollection', async () => {
                const mockAnalyticsDocs = [
                    { ref: { id: 'analytics-1' } },
                ];

                mockGetDocs
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // transactions
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // changelog
                    .mockResolvedValueOnce({ docs: mockAnalyticsDocs, empty: false, size: 1 } as any) // analytics
                    .mockResolvedValue({ docs: [], empty: true, size: 0 } as any); // invitations

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                expect(mockBatch.delete).toHaveBeenCalled();
            });

            it('deletes pending invitations for the group', async () => {
                const mockInvitationDocs = [
                    { ref: { id: 'invitation-1' } },
                    { ref: { id: 'invitation-2' } },
                ];

                mockGetDocs
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // transactions
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // changelog
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // analytics
                    .mockResolvedValueOnce({ docs: mockInvitationDocs, empty: false, size: 2 } as any); // invitations

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                expect(mockBatch.delete).toHaveBeenCalledTimes(2);
            });

            it('deletes group document via transaction (TOCTOU fix)', async () => {
                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                // Group document should be deleted via transaction (not deleteDoc)
                expect(mockRunTransaction).toHaveBeenCalled();
                expect(mockTransactionDelete).toHaveBeenCalled();
            });

            it('works with empty subcollections', async () => {
                // All subcollections empty
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    empty: true,
                    size: 0,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                // Should not throw
                await expect(
                    deleteGroupAsLastMember(mockDb, userId, groupId, appId)
                ).resolves.not.toThrow();

                // Group document should still be deleted via transaction
                expect(mockRunTransaction).toHaveBeenCalled();
            });

            it('handles batching for >500 transactions', async () => {
                // Create 600 mock transactions (exceeds BATCH_SIZE of 500)
                const mockTransactionDocs = Array.from({ length: 600 }, (_, i) => ({
                    ref: { id: `tx-${i}` },
                }));

                mockGetDocs
                    .mockResolvedValueOnce({
                        docs: mockTransactionDocs,
                        empty: false,
                        size: 600,
                    } as any)
                    .mockResolvedValue({
                        docs: [],
                        empty: true,
                        size: 0,
                    } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                // Should have committed multiple batches (600 items / 500 = 2 batches)
                expect(mockBatch.commit).toHaveBeenCalledTimes(2);
            });
        });

        // Uses correct Firestore collections
        describe('collection usage', () => {
            beforeEach(() => {
                const mockGroup = createMockGroup();
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                mockGetDocs.mockResolvedValue({
                    docs: [],
                    empty: true,
                    size: 0,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                // TOCTOU fix: deletion now uses runTransaction
                mockRunTransaction.mockImplementation(async (_db, callback) => {
                    const mockTransaction = {
                        get: vi.fn().mockResolvedValue({
                            exists: () => true,
                            data: () => createMockGroup(),
                            id: groupId,
                        }),
                        delete: vi.fn(),
                    };
                    await callback(mockTransaction);
                });
            });

            it('uses sharedGroups collection for group document', async () => {
                await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                expect(mockDoc).toHaveBeenCalledWith(mockDb, 'sharedGroups', groupId);
            });
        });

        // ECC Review Fix Tests (Story 14d-v2-1-7b)
        describe('ECC Review fixes', () => {
            beforeEach(() => {
                const mockGroup = createMockGroup();
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                mockGetDocs.mockResolvedValue({
                    docs: [],
                    empty: true,
                    size: 0,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);
            });

            describe('appId validation (HIGH severity)', () => {
                it('throws error when appId is invalid', async () => {
                    await expect(
                        deleteGroupAsLastMember(mockDb, userId, groupId, '../hack')
                    ).rejects.toThrow('Invalid application ID');
                });

                it('throws error when appId is empty', async () => {
                    await expect(
                        deleteGroupAsLastMember(mockDb, userId, groupId, '')
                    ).rejects.toThrow('Invalid application ID');
                });

                it('throws error for unknown appId', async () => {
                    await expect(
                        deleteGroupAsLastMember(mockDb, userId, groupId, 'otherapp')
                    ).rejects.toThrow('Invalid application ID');
                });

                it('does not call getDoc when appId validation fails', async () => {
                    try {
                        await deleteGroupAsLastMember(mockDb, userId, groupId, '../hack');
                    } catch {
                        // Expected to throw
                    }

                    expect(mockGetDoc).not.toHaveBeenCalled();
                });
            });

            describe('TOCTOU fix (CRITICAL severity)', () => {
                it('uses runTransaction for atomic membership check + delete', async () => {
                    const mockGroup = createMockGroup();

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => mockGroup,
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                    expect(mockRunTransaction).toHaveBeenCalled();
                });

                it('re-validates membership inside transaction', async () => {
                    // Outside transaction: user is member
                    const mockGroupBefore = createMockGroup({ members: [userId] });

                    // Inside transaction: user is no longer a member (race condition)
                    const mockGroupInTx = createMockGroup({ members: ['other-user'] });

                    mockGetDoc.mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroupBefore,
                        id: groupId,
                    } as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => mockGroupInTx,
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await expect(
                        deleteGroupAsLastMember(mockDb, userId, groupId, appId)
                    ).rejects.toThrow('You are not a member of this group');
                });

                it('re-validates single member inside transaction', async () => {
                    // Outside transaction: user is only member
                    const mockGroupBefore = createMockGroup({ members: [userId] });

                    // Inside transaction: another member joined (race condition)
                    const mockGroupInTx = createMockGroup({ members: [userId, 'new-member'] });

                    mockGetDoc.mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroupBefore,
                        id: groupId,
                    } as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => mockGroupInTx,
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await expect(
                        deleteGroupAsLastMember(mockDb, userId, groupId, appId)
                    ).rejects.toThrow('Cannot delete group with other members');
                });
            });

            describe('cascade error handling (MEDIUM severity)', () => {
                it('re-throws cascade errors to prevent orphaned group', async () => {
                    // First getDocs (transactions) throws error
                    mockGetDocs.mockRejectedValueOnce(new Error('Cascade failure'));

                    await expect(
                        deleteGroupAsLastMember(mockDb, userId, groupId, appId)
                    ).rejects.toThrow('Cascade failure');
                });

                it('continues despite changelog deletion failure (expected with client SDK)', async () => {
                    // transactions: empty, changelog: throws, analytics: empty, invitations: empty
                    mockGetDocs
                        .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any)
                        .mockRejectedValueOnce(new Error('Permission denied')) // changelog fails
                        .mockResolvedValue({ docs: [], empty: true, size: 0 } as any);

                    const mockBatch = createMockBatch();
                    mockWriteBatch.mockReturnValue(mockBatch as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => createMockGroup(),
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    // Should not throw - changelog failure is expected
                    await expect(
                        deleteGroupAsLastMember(mockDb, userId, groupId, appId)
                    ).resolves.not.toThrow();
                });
            });

            describe('>500 documents batching (MEDIUM severity)', () => {
                it('handles >500 documents in subcollection deletion', async () => {
                    const mockChangelogDocs = Array.from({ length: 600 }, (_, i) => ({
                        ref: { id: `changelog-${i}` },
                    }));

                    mockGetDocs
                        .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // transactions
                        .mockResolvedValueOnce({ docs: mockChangelogDocs, empty: false, size: 600 } as any) // changelog
                        .mockResolvedValue({ docs: [], empty: true, size: 0 } as any); // rest

                    const mockBatch = createMockBatch();
                    mockWriteBatch.mockReturnValue(mockBatch as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => createMockGroup(),
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await deleteGroupAsLastMember(mockDb, userId, groupId, appId);

                    // 600 docs / 500 batch size = 2 batches for changelog
                    expect(mockBatch.commit).toHaveBeenCalledTimes(2);
                });
            });

            describe('edge cases (MEDIUM severity)', () => {
                it('handles batch.commit() failure', async () => {
                    const mockTransactionDocs = [{ ref: { id: 'tx-1' } }];
                    mockGetDocs
                        .mockResolvedValueOnce({ docs: mockTransactionDocs, empty: false, size: 1 } as any)
                        .mockResolvedValue({ docs: [], empty: true, size: 0 } as any);

                    const mockBatch = {
                        update: vi.fn(),
                        delete: vi.fn(),
                        commit: vi.fn().mockRejectedValue(new Error('Batch commit failed')),
                    };
                    mockWriteBatch.mockReturnValue(mockBatch as any);

                    await expect(
                        deleteGroupAsLastMember(mockDb, userId, groupId, appId)
                    ).rejects.toThrow('Batch commit failed');
                });
            });
        });
    });

    // =========================================================================
    // deleteGroupAsOwner Tests (Story 14d-v2-1-7b: AC #2, #3, #4)
    // =========================================================================
    describe('deleteGroupAsOwner', () => {
        const groupId = 'test-group-id';
        const ownerId = 'owner-user';
        const memberId = 'member-user';
        const appId = 'boletapp';

        /**
         * Helper to create a mock group with multiple members
         */
        function createMockGroup(overrides: Partial<SharedGroup> = {}) {
            return {
                id: groupId,
                ownerId,
                appId: 'boletapp',
                name: 'Test Group',
                color: '#10b981',
                shareCode: 'testcode123',
                shareCodeExpiresAt: createMockTimestampDaysFromNow(7),
                members: [ownerId, memberId],
                memberUpdates: {},
                createdAt: createMockTimestampDaysAgo(30),
                updatedAt: createMockTimestampDaysAgo(1),
                timezone: 'America/Santiago',
                transactionSharingEnabled: true,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
                ...overrides,
            };
        }

        /**
         * Helper to create mock batch
         */
        function createMockBatch() {
            return {
                update: vi.fn(),
                delete: vi.fn(),
                commit: vi.fn().mockResolvedValue(undefined),
            };
        }

        beforeEach(() => {
            mockDoc.mockReturnValue({ id: groupId } as any);
            mockCollection.mockReturnValue({} as any);
            mockQuery.mockReturnValue({} as any);
            mockWhere.mockReturnValue({} as any);
        });

        // Input Validation Tests
        describe('input validation', () => {
            it('throws error when ownerId is empty', async () => {
                await expect(
                    deleteGroupAsOwner(mockDb, '', groupId)
                ).rejects.toThrow('Owner ID and group ID are required');
            });

            it('throws error when groupId is empty', async () => {
                await expect(
                    deleteGroupAsOwner(mockDb, ownerId, '')
                ).rejects.toThrow('Owner ID and group ID are required');
            });

            it('does not call getDoc when validation fails', async () => {
                try {
                    await deleteGroupAsOwner(mockDb, '', groupId);
                } catch {
                    // Expected to throw
                }

                expect(mockGetDoc).not.toHaveBeenCalled();
            });
        });

        // Group Validation Tests
        describe('group validation', () => {
            it('throws error when group not found', async () => {
                mockGetDoc.mockResolvedValue({
                    exists: () => false,
                } as any);

                await expect(
                    deleteGroupAsOwner(mockDb, ownerId, groupId)
                ).rejects.toThrow('Group not found');
            });

            it('throws error when user is not the owner (AC #4)', async () => {
                const mockGroup = createMockGroup();

                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                // memberId is not the owner
                await expect(
                    deleteGroupAsOwner(mockDb, memberId, groupId)
                ).rejects.toThrow('Only the group owner can delete the group');
            });

            it('does NOT run cascade operations when ownership check fails (ECC review fix)', async () => {
                // ECC Review 2026-02-02: HIGH severity fix
                // Ownership must be validated BEFORE cascade operations to prevent
                // unauthorized users from triggering transaction updates on other members' data
                const mockGroup = createMockGroup();

                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                // Reset getDocs mock to track cascade calls
                mockGetDocs.mockClear();

                // memberId is not the owner - should fail immediately
                await expect(
                    deleteGroupAsOwner(mockDb, memberId, groupId)
                ).rejects.toThrow('Only the group owner can delete the group');

                // Verify cascade operations were NOT called (getDocs would be called for transaction queries)
                expect(mockGetDocs).not.toHaveBeenCalled();
                // Verify transaction delete was NOT called
                expect(mockRunTransaction).not.toHaveBeenCalled();
            });
        });

        // Cascade Deletion Tests (AC #2, #3)
        describe('cascade deletion (AC #2, #3)', () => {
            let mockTransactionDelete: ReturnType<typeof vi.fn>;

            beforeEach(() => {
                const mockGroup = createMockGroup();
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                mockGetDocs.mockResolvedValue({
                    docs: [],
                    empty: true,
                    size: 0,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                // ECC Review: TOCTOU fix - deletion now uses runTransaction
                mockTransactionDelete = vi.fn();
                mockRunTransaction.mockImplementation(async (_db, callback) => {
                    const mockTransaction = {
                        get: vi.fn().mockResolvedValue({
                            exists: () => true,
                            data: () => createMockGroup(),
                            id: groupId,
                        }),
                        delete: mockTransactionDelete,
                    };
                    await callback(mockTransaction);
                });
            });

            it('clears sharedGroupId on ALL members transactions (AC #2)', async () => {
                // Transactions from both members
                const ownerTransactions = [
                    { ref: { id: 'owner-tx-1' } },
                    { ref: { id: 'owner-tx-2' } },
                ];
                const memberTransactions = [
                    { ref: { id: 'member-tx-1' } },
                ];

                // First call: owner transactions, second call: member transactions
                mockGetDocs
                    .mockResolvedValueOnce({ docs: ownerTransactions, empty: false, size: 2 } as any)
                    .mockResolvedValueOnce({ docs: memberTransactions, empty: false, size: 1 } as any)
                    .mockResolvedValue({ docs: [], empty: true, size: 0 } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                // Should update 3 transactions total (2 owner + 1 member)
                expect(mockBatch.update).toHaveBeenCalledTimes(3);
            });

            it('deletes changelog subcollection', async () => {
                // Setup: no transactions, but has changelog
                const mockChangelogDocs = [
                    { ref: { id: 'changelog-1' } },
                ];

                mockGetDocs
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // owner transactions
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // member transactions
                    .mockResolvedValueOnce({ docs: mockChangelogDocs, empty: false, size: 1 } as any) // changelog
                    .mockResolvedValue({ docs: [], empty: true, size: 0 } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                expect(mockBatch.delete).toHaveBeenCalled();
            });

            it('deletes analytics subcollection', async () => {
                const mockAnalyticsDocs = [
                    { ref: { id: 'analytics-1' } },
                ];

                mockGetDocs
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // owner transactions
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // member transactions
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // changelog
                    .mockResolvedValueOnce({ docs: mockAnalyticsDocs, empty: false, size: 1 } as any) // analytics
                    .mockResolvedValue({ docs: [], empty: true, size: 0 } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                expect(mockBatch.delete).toHaveBeenCalled();
            });

            it('deletes pending invitations for the group', async () => {
                const mockInvitationDocs = [
                    { ref: { id: 'invitation-1' } },
                ];

                mockGetDocs
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // owner transactions
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // member transactions
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // changelog
                    .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // analytics
                    .mockResolvedValueOnce({ docs: mockInvitationDocs, empty: false, size: 1 } as any); // invitations

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                expect(mockBatch.delete).toHaveBeenCalled();
            });

            it('deletes group document via transaction (TOCTOU fix)', async () => {
                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                // Group document should be deleted via transaction (not deleteDoc)
                expect(mockRunTransaction).toHaveBeenCalled();
                expect(mockTransactionDelete).toHaveBeenCalled();
            });

            it('works with single member (owner only)', async () => {
                const mockGroup = createMockGroup({
                    members: [ownerId], // Only owner
                });

                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await expect(
                    deleteGroupAsOwner(mockDb, ownerId, groupId, appId)
                ).resolves.not.toThrow();

                expect(mockRunTransaction).toHaveBeenCalled();
            });

            it('works with multiple members', async () => {
                const mockGroup = createMockGroup({
                    members: [ownerId, memberId, 'third-member'],
                });

                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                await expect(
                    deleteGroupAsOwner(mockDb, ownerId, groupId, appId)
                ).resolves.not.toThrow();

                expect(mockRunTransaction).toHaveBeenCalled();
            });
        });

        // Uses correct Firestore collections
        describe('collection usage', () => {
            beforeEach(() => {
                const mockGroup = createMockGroup();
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                mockGetDocs.mockResolvedValue({
                    docs: [],
                    empty: true,
                    size: 0,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);

                // TOCTOU fix: deletion now uses runTransaction
                mockRunTransaction.mockImplementation(async (_db, callback) => {
                    const mockTransaction = {
                        get: vi.fn().mockResolvedValue({
                            exists: () => true,
                            data: () => createMockGroup(),
                            id: groupId,
                        }),
                        delete: vi.fn(),
                    };
                    await callback(mockTransaction);
                });
            });

            it('uses sharedGroups collection for group document', async () => {
                await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                expect(mockDoc).toHaveBeenCalledWith(mockDb, 'sharedGroups', groupId);
            });

            it('queries pendingInvitations collection', async () => {
                await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                expect(mockCollection).toHaveBeenCalledWith(mockDb, 'pendingInvitations');
            });
        });

        // ECC Review Fix Tests (Story 14d-v2-1-7b)
        describe('ECC Review fixes', () => {
            beforeEach(() => {
                const mockGroup = createMockGroup();
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => mockGroup,
                    id: groupId,
                } as any);

                mockGetDocs.mockResolvedValue({
                    docs: [],
                    empty: true,
                    size: 0,
                } as any);

                const mockBatch = createMockBatch();
                mockWriteBatch.mockReturnValue(mockBatch as any);
            });

            describe('appId validation (HIGH severity)', () => {
                it('throws error when appId is invalid', async () => {
                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, '../hack')
                    ).rejects.toThrow('Invalid application ID');
                });

                it('throws error when appId is empty', async () => {
                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, '')
                    ).rejects.toThrow('Invalid application ID');
                });

                it('throws error for path traversal attempt', async () => {
                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, '../../etc/passwd')
                    ).rejects.toThrow('Invalid application ID');
                });

                it('does not call getDoc when appId validation fails', async () => {
                    try {
                        await deleteGroupAsOwner(mockDb, ownerId, groupId, '../hack');
                    } catch {
                        // Expected to throw
                    }

                    expect(mockGetDoc).not.toHaveBeenCalled();
                });
            });

            describe('TOCTOU fix (CRITICAL severity)', () => {
                it('uses runTransaction for atomic ownership check + delete', async () => {
                    const mockGroup = createMockGroup();

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => mockGroup,
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                    expect(mockRunTransaction).toHaveBeenCalled();
                });

                it('re-validates ownership inside transaction', async () => {
                    // Outside transaction: user is owner
                    const mockGroupBefore = createMockGroup({ ownerId });

                    // Inside transaction: ownership transferred (race condition)
                    const mockGroupInTx = createMockGroup({ ownerId: 'different-owner' });

                    mockGetDoc.mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroupBefore,
                        id: groupId,
                    } as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => mockGroupInTx,
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, appId)
                    ).rejects.toThrow('Only the group owner can delete the group');
                });

                it('handles group deleted between check and transaction', async () => {
                    const mockGroupBefore = createMockGroup();

                    mockGetDoc.mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroupBefore,
                        id: groupId,
                    } as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => false,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, appId)
                    ).rejects.toThrow('Group not found');
                });
            });

            describe('cascade error handling (MEDIUM severity)', () => {
                it('re-throws cascade errors to prevent orphaned group', async () => {
                    mockGetDocs.mockRejectedValueOnce(new Error('Cascade failure'));

                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, appId)
                    ).rejects.toThrow('Cascade failure');
                });

                it('continues despite changelog deletion failure', async () => {
                    // transactions: empty for both members, changelog: throws
                    mockGetDocs
                        .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // owner tx
                        .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as any) // member tx
                        .mockRejectedValueOnce(new Error('Permission denied')) // changelog
                        .mockResolvedValue({ docs: [], empty: true, size: 0 } as any);

                    const mockBatch = createMockBatch();
                    mockWriteBatch.mockReturnValue(mockBatch as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => createMockGroup(),
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, appId)
                    ).resolves.not.toThrow();
                });
            });

            describe('>500 documents batching (MEDIUM severity)', () => {
                it('handles >500 transactions across multiple members', async () => {
                    // 300 transactions each for 2 members = 600 total
                    const ownerTransactions = Array.from({ length: 300 }, (_, i) => ({
                        ref: { id: `owner-tx-${i}` },
                    }));
                    const memberTransactions = Array.from({ length: 300 }, (_, i) => ({
                        ref: { id: `member-tx-${i}` },
                    }));

                    mockGetDocs
                        .mockResolvedValueOnce({ docs: ownerTransactions, empty: false, size: 300 } as any)
                        .mockResolvedValueOnce({ docs: memberTransactions, empty: false, size: 300 } as any)
                        .mockResolvedValue({ docs: [], empty: true, size: 0 } as any);

                    const mockBatch = createMockBatch();
                    mockWriteBatch.mockReturnValue(mockBatch as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => createMockGroup(),
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    await deleteGroupAsOwner(mockDb, ownerId, groupId, appId);

                    // 300 + 300 = 600 updates, each in its own commit (300 < 500)
                    // so 1 commit per member = 2 commits
                    expect(mockBatch.commit).toHaveBeenCalledTimes(2);
                });
            });

            describe('edge cases (MEDIUM severity)', () => {
                it('handles empty members array gracefully', async () => {
                    const mockGroup = createMockGroup({ members: [] });

                    mockGetDoc.mockResolvedValue({
                        exists: () => true,
                        data: () => mockGroup,
                        id: groupId,
                    } as any);

                    const mockBatch = createMockBatch();
                    mockWriteBatch.mockReturnValue(mockBatch as any);

                    mockRunTransaction.mockImplementation(async (_db, callback) => {
                        const mockTransaction = {
                            get: vi.fn().mockResolvedValue({
                                exists: () => true,
                                data: () => mockGroup,
                                id: groupId,
                            }),
                            delete: vi.fn(),
                        };
                        await callback(mockTransaction);
                    });

                    // Empty members means owner check fails (owner not in members)
                    // But our implementation checks ownerId field, not members array
                    // So this should still work
                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, appId)
                    ).resolves.not.toThrow();
                });

                it('handles batch.commit() failure', async () => {
                    const mockTransactionDocs = [{ ref: { id: 'tx-1' } }];
                    mockGetDocs
                        .mockResolvedValueOnce({ docs: mockTransactionDocs, empty: false, size: 1 } as any)
                        .mockResolvedValue({ docs: [], empty: true, size: 0 } as any);

                    const mockBatch = {
                        update: vi.fn(),
                        delete: vi.fn(),
                        commit: vi.fn().mockRejectedValue(new Error('Batch commit failed')),
                    };
                    mockWriteBatch.mockReturnValue(mockBatch as any);

                    await expect(
                        deleteGroupAsOwner(mockDb, ownerId, groupId, appId)
                    ).rejects.toThrow('Batch commit failed');
                });
            });
        });
    });
});
