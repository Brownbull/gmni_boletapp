/**
 * Invitation Service Tests
 *
 * Story 14d-v2-1-5b-1: Core Invitation Service
 * Story 14d-v2-1-5b-2: Invitation Validation & Security
 * Story 14d-v2-1-6a: Deep Link & Pending Invitations
 * Story 14d-v2-1-6b: Accept/Decline Invitation Logic
 *
 * Tests for invitation service functions:
 * - createInvitation, getInvitationByShareCode, checkDuplicateInvitation
 * - getInvitationsForEmail, getPendingInvitationsForUser
 * - validateGroupCapacity, validateInvitationByShareCode
 * - acceptInvitation, declineInvitation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore before importing the module
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
    return {
        ...actual,
        collection: vi.fn(),
        addDoc: vi.fn(),
        getDocs: vi.fn(),
        getDoc: vi.fn(),
        doc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        limit: vi.fn(),
        orderBy: vi.fn(),
        serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
        runTransaction: vi.fn(),
        updateDoc: vi.fn(),
        arrayUnion: vi.fn((value) => ({ _arrayUnion: value })),
    };
});

// Mock shareCodeUtils
vi.mock('../../../src/utils/shareCodeUtils', () => ({
    generateShareCode: vi.fn(() => 'MockShareCode12345'),
    isValidShareCode: vi.fn((code: string) => {
        // Default: valid if 16 chars alphanumeric
        if (!code || typeof code !== 'string') return false;
        if (code.length !== 16) return false;
        return /^[A-Za-z0-9_-]+$/.test(code);
    }),
}));

// Mock validationUtils
vi.mock('../../../src/utils/validationUtils', () => ({
    normalizeEmail: vi.fn((email: string) => {
        if (!email || typeof email !== 'string') return '';
        const trimmed = email.trim();
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return '';
        return trimmed.toLowerCase();
    }),
    validateEmail: vi.fn((email: string) => {
        if (!email || typeof email !== 'string') return false;
        const trimmed = email.trim();
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
    }),
    // Story 14d-v2-1-13+14: ECC Security Review fix
    validateAppId: vi.fn((appId: string) => appId === 'boletapp'),
}));

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    limit,
    orderBy,
    runTransaction,
    updateDoc,
    arrayUnion,
} from 'firebase/firestore';
import {
    createInvitation,
    getInvitationByShareCode,
    checkDuplicateInvitation,
    getInvitationsForEmail,
    getPendingInvitationsForUser,
    validateGroupCapacity,
    validateInvitationByShareCode,
    acceptInvitation,
    declineInvitation,
    ShareCodeValidationError,
    SHARE_CODE_ERROR_MESSAGES,
    type CreateInvitationInput,
    type GroupCapacityResult,
    type ShareCodeValidationResult,
} from '../../../src/services/invitationService';
import { generateShareCode, isValidShareCode } from '../../../src/utils/shareCodeUtils';
import { normalizeEmail } from '../../../src/utils/validationUtils';
import { SHARED_GROUP_LIMITS } from '../../../src/types/sharedGroup';
import type { PendingInvitation, SharedGroup } from '../../../src/types/sharedGroup';

const mockCollection = vi.mocked(collection);
const mockAddDoc = vi.mocked(addDoc);
const mockGetDocs = vi.mocked(getDocs);
const mockGetDoc = vi.mocked(getDoc);
const mockDoc = vi.mocked(doc);
const mockQuery = vi.mocked(query);
const mockWhere = vi.mocked(where);
const mockLimit = vi.mocked(limit);
const mockOrderBy = vi.mocked(orderBy);
const mockRunTransaction = vi.mocked(runTransaction);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockArrayUnion = vi.mocked(arrayUnion);
const mockGenerateShareCode = vi.mocked(generateShareCode);
const mockIsValidShareCode = vi.mocked(isValidShareCode);
const mockNormalizeEmail = vi.mocked(normalizeEmail);

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
function createMockDoc(id: string, data: Partial<PendingInvitation>) {
    return {
        id,
        data: () => data,
        ref: { id },
    };
}

/**
 * Helper to create mock Timestamp
 */
function createMockTimestamp(daysFromNow: number = 0): Timestamp {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;
}

/**
 * Standard test input for creating invitations
 */
function createTestInput(overrides?: Partial<CreateInvitationInput>): CreateInvitationInput {
    return {
        groupId: 'group-123',
        groupName: '🏠 Gastos del Hogar',
        groupColor: '#10b981',
        invitedEmail: 'friend@example.com',
        invitedByUserId: 'user-xyz',
        invitedByName: 'Juan García',
        ...overrides,
    };
}

/**
 * Helper to create mock group document snapshot
 * Story 14d-v2-1-5b-2: Tests for validateGroupCapacity
 */
function createMockGroupSnapshot(exists: boolean, members: string[] = []) {
    return {
        exists: () => exists,
        data: () => (exists ? { members } : undefined),
        id: 'group-123',
    };
}

/**
 * Helper to generate array of member IDs
 */
function generateMemberIds(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `user-${i + 1}`);
}

// =============================================================================
// Tests
// =============================================================================

describe('invitationService', () => {
    const mockDb = createMockDb();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        mockCollection.mockReturnValue({} as any);
        mockQuery.mockReturnValue({} as any);
        mockWhere.mockReturnValue({} as any);
        mockLimit.mockReturnValue({} as any);
        mockGenerateShareCode.mockReturnValue('MockShareCode12345');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // createInvitation Tests (AC #1)
    // =========================================================================
    describe('createInvitation', () => {
        beforeEach(() => {
            mockAddDoc.mockResolvedValue({
                id: 'new-invitation-id',
            } as any);
        });

        it('creates invitation document in pendingInvitations collection (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput());

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'pendingInvitations');
        });

        it('sets groupId from input (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput({ groupId: 'test-group' }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.groupId).toBe('test-group');
        });

        it('sets groupName from input (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput({ groupName: 'Family Budget' }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.groupName).toBe('Family Budget');
        });

        it('sets groupColor from input (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput({ groupColor: '#ff0000' }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.groupColor).toBe('#ff0000');
        });

        it('includes groupIcon when provided (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput({ groupIcon: '🏠' }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.groupIcon).toBe('🏠');
        });

        it('excludes groupIcon when not provided (AC #1)', async () => {
            const input = createTestInput();
            delete input.groupIcon;

            await createInvitation(mockDb, input);

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData).not.toHaveProperty('groupIcon');
        });

        it('generates unique shareCode (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput());

            expect(mockGenerateShareCode).toHaveBeenCalled();

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.shareCode).toBe('MockShareCode12345');
        });

        it('normalizes invitedEmail to lowercase (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput({ invitedEmail: 'FRIEND@EXAMPLE.COM' }));

            expect(mockNormalizeEmail).toHaveBeenCalledWith('FRIEND@EXAMPLE.COM');

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.invitedEmail).toBe('friend@example.com');
        });

        it('stores invitedByUserId from input (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput({ invitedByUserId: 'owner-123' }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.invitedByUserId).toBe('owner-123');
        });

        it('stores invitedByName from input (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput({ invitedByName: 'John Doe' }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.invitedByName).toBe('John Doe');
        });

        it('uses serverTimestamp for createdAt (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput());

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as any;

            expect(invitationData.createdAt).toEqual({ _serverTimestamp: true });
        });

        it('sets expiresAt to 7 days from now (AC #1)', async () => {
            const beforeCreate = new Date();

            await createInvitation(mockDb, createTestInput());

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            // expiresAt should be a Timestamp roughly 7 days from now
            const expiryDate = (invitationData.expiresAt as Timestamp).toDate();
            const expectedDate = new Date(beforeCreate);
            expectedDate.setDate(expectedDate.getDate() + SHARED_GROUP_LIMITS.SHARE_CODE_EXPIRY_DAYS);

            // Allow 1 second tolerance
            const diff = Math.abs(expiryDate.getTime() - expectedDate.getTime());
            expect(diff).toBeLessThan(1000);
        });

        it('sets status to pending (AC #1)', async () => {
            await createInvitation(mockDb, createTestInput());

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.status).toBe('pending');
        });

        it('returns invitation with generated ID (AC #1)', async () => {
            mockAddDoc.mockResolvedValue({
                id: 'generated-doc-id',
            } as any);

            const result = await createInvitation(mockDb, createTestInput());

            expect(result.id).toBe('generated-doc-id');
            expect(result.groupId).toBe('group-123');
            expect(result.shareCode).toBe('MockShareCode12345');
            expect(result.status).toBe('pending');
        });

        it('throws error when Firestore write fails', async () => {
            mockAddDoc.mockRejectedValue(new Error('Firestore error'));

            await expect(createInvitation(mockDb, createTestInput())).rejects.toThrow('Firestore error');
        });
    });

    // =========================================================================
    // getInvitationByShareCode Tests (AC #1)
    // =========================================================================
    describe('getInvitationByShareCode', () => {
        it('queries pendingInvitations collection', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await getInvitationByShareCode(mockDb, 'Ab3dEf7hIj9kLm0p');

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'pendingInvitations');
        });

        it('filters by shareCode (AC #1)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await getInvitationByShareCode(mockDb, 'Ab3dEf7hIj9kLm0p');

            expect(mockWhere).toHaveBeenCalledWith('shareCode', '==', 'Ab3dEf7hIj9kLm0p');
        });

        it('filters by status pending (AC #1)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await getInvitationByShareCode(mockDb, 'Ab3dEf7hIj9kLm0p');

            expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
        });

        it('limits result to 1 document', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await getInvitationByShareCode(mockDb, 'Ab3dEf7hIj9kLm0p');

            expect(mockLimit).toHaveBeenCalledWith(1);
        });

        it('returns invitation when found (AC #1)', async () => {
            const mockInvitationData: Partial<PendingInvitation> = {
                groupId: 'group-123',
                groupName: 'Family Budget',
                groupColor: '#10b981',
                shareCode: 'Ab3dEf7hIj9kLm0p',
                invitedEmail: 'friend@example.com',
                invitedByUserId: 'user-xyz',
                invitedByName: 'Juan García',
                status: 'pending',
            };

            const mockDocs = [createMockDoc('invitation-123', mockInvitationData)];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                empty: false,
            } as any);

            const result = await getInvitationByShareCode(mockDb, 'Ab3dEf7hIj9kLm0p');

            expect(result).not.toBeNull();
            expect(result!.id).toBe('invitation-123');
            expect(result!.groupId).toBe('group-123');
            expect(result!.shareCode).toBe('Ab3dEf7hIj9kLm0p');
        });

        it('returns null when no invitation found (AC #1)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            const result = await getInvitationByShareCode(mockDb, 'InvalidCode123');

            expect(result).toBeNull();
        });

        it('returns null for empty shareCode', async () => {
            const result = await getInvitationByShareCode(mockDb, '');

            expect(result).toBeNull();
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('returns null for null shareCode', async () => {
            const result = await getInvitationByShareCode(mockDb, null as any);

            expect(result).toBeNull();
            expect(mockGetDocs).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // checkDuplicateInvitation Tests (AC #2)
    // =========================================================================
    describe('checkDuplicateInvitation', () => {
        it('queries pendingInvitations collection (AC #2)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await checkDuplicateInvitation(mockDb, 'group-123', 'friend@example.com');

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'pendingInvitations');
        });

        it('filters by groupId (AC #2)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await checkDuplicateInvitation(mockDb, 'group-123', 'friend@example.com');

            expect(mockWhere).toHaveBeenCalledWith('groupId', '==', 'group-123');
        });

        it('filters by normalized invitedEmail (AC #2)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await checkDuplicateInvitation(mockDb, 'group-123', 'FRIEND@EXAMPLE.COM');

            expect(mockNormalizeEmail).toHaveBeenCalledWith('FRIEND@EXAMPLE.COM');
            expect(mockWhere).toHaveBeenCalledWith('invitedEmail', '==', 'friend@example.com');
        });

        it('filters by status pending (AC #2)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await checkDuplicateInvitation(mockDb, 'group-123', 'friend@example.com');

            expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
        });

        it('limits result to 1 document', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            await checkDuplicateInvitation(mockDb, 'group-123', 'friend@example.com');

            expect(mockLimit).toHaveBeenCalledWith(1);
        });

        it('returns true when duplicate exists (AC #2)', async () => {
            const mockDocs = [createMockDoc('existing-invitation', {
                groupId: 'group-123',
                invitedEmail: 'friend@example.com',
                status: 'pending',
            })];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                empty: false,
            } as any);

            const result = await checkDuplicateInvitation(mockDb, 'group-123', 'friend@example.com');

            expect(result).toBe(true);
        });

        it('returns false when no duplicate exists (AC #2)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
            } as any);

            const result = await checkDuplicateInvitation(mockDb, 'group-123', 'new@example.com');

            expect(result).toBe(false);
        });

        it('returns false for empty groupId', async () => {
            const result = await checkDuplicateInvitation(mockDb, '', 'friend@example.com');

            expect(result).toBe(false);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('returns false for empty email', async () => {
            const result = await checkDuplicateInvitation(mockDb, 'group-123', '');

            expect(result).toBe(false);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('returns false for invalid email', async () => {
            const result = await checkDuplicateInvitation(mockDb, 'group-123', 'invalid-email');

            expect(result).toBe(false);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // getInvitationsForEmail Tests
    // =========================================================================
    describe('getInvitationsForEmail', () => {
        it('queries pendingInvitations collection', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            await getInvitationsForEmail(mockDb, 'user@example.com');

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'pendingInvitations');
        });

        it('filters by normalized invitedEmail', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            await getInvitationsForEmail(mockDb, 'USER@EXAMPLE.COM');

            expect(mockNormalizeEmail).toHaveBeenCalledWith('USER@EXAMPLE.COM');
            expect(mockWhere).toHaveBeenCalledWith('invitedEmail', '==', 'user@example.com');
        });

        it('filters by status pending', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            await getInvitationsForEmail(mockDb, 'user@example.com');

            expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
        });

        it('returns array of invitations when found', async () => {
            const mockDocs = [
                createMockDoc('invitation-1', {
                    groupId: 'group-1',
                    groupName: 'Group 1',
                    invitedEmail: 'user@example.com',
                    status: 'pending',
                }),
                createMockDoc('invitation-2', {
                    groupId: 'group-2',
                    groupName: 'Group 2',
                    invitedEmail: 'user@example.com',
                    status: 'pending',
                }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                empty: false,
                size: 2,
            } as any);

            const result = await getInvitationsForEmail(mockDb, 'user@example.com');

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('invitation-1');
            expect(result[0].groupName).toBe('Group 1');
            expect(result[1].id).toBe('invitation-2');
            expect(result[1].groupName).toBe('Group 2');
        });

        it('returns empty array when no invitations found', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            const result = await getInvitationsForEmail(mockDb, 'user@example.com');

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('returns empty array for empty email', async () => {
            const result = await getInvitationsForEmail(mockDb, '');

            expect(result).toEqual([]);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('returns empty array for invalid email', async () => {
            const result = await getInvitationsForEmail(mockDb, 'invalid');

            expect(result).toEqual([]);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Integration Scenarios
    // =========================================================================
    describe('integration scenarios', () => {
        it('createInvitation followed by getInvitationByShareCode returns the invitation', async () => {
            const newInvitationId = 'new-invitation-id';

            // Mock createInvitation
            mockAddDoc.mockResolvedValue({ id: newInvitationId } as any);

            const createdInvitation = await createInvitation(mockDb, createTestInput());

            expect(createdInvitation.id).toBe(newInvitationId);
            expect(createdInvitation.shareCode).toBe('MockShareCode12345');

            // Mock getInvitationByShareCode to return the created invitation
            mockGetDocs.mockResolvedValue({
                docs: [createMockDoc(newInvitationId, {
                    groupId: 'group-123',
                    groupName: '🏠 Gastos del Hogar',
                    shareCode: 'MockShareCode12345',
                    invitedEmail: 'friend@example.com',
                    status: 'pending',
                })],
                empty: false,
            } as any);

            const foundInvitation = await getInvitationByShareCode(mockDb, 'MockShareCode12345');

            expect(foundInvitation).not.toBeNull();
            expect(foundInvitation!.id).toBe(newInvitationId);
        });

        it('checkDuplicateInvitation returns true after createInvitation', async () => {
            // First create an invitation
            mockAddDoc.mockResolvedValue({ id: 'invitation-123' } as any);

            await createInvitation(mockDb, createTestInput({
                groupId: 'group-abc',
                invitedEmail: 'test@example.com',
            }));

            // Mock checkDuplicateInvitation to find the existing invitation
            mockGetDocs.mockResolvedValue({
                docs: [createMockDoc('invitation-123', {
                    groupId: 'group-abc',
                    invitedEmail: 'test@example.com',
                    status: 'pending',
                })],
                empty: false,
            } as any);

            const isDuplicate = await checkDuplicateInvitation(mockDb, 'group-abc', 'test@example.com');

            expect(isDuplicate).toBe(true);
        });

        it('getInvitationsForEmail returns multiple invitations for same user', async () => {
            // Mock multiple invitations for the same email
            mockGetDocs.mockResolvedValue({
                docs: [
                    createMockDoc('inv-1', {
                        groupId: 'group-a',
                        groupName: 'Family',
                        invitedEmail: 'user@test.com',
                        status: 'pending',
                    }),
                    createMockDoc('inv-2', {
                        groupId: 'group-b',
                        groupName: 'Friends',
                        invitedEmail: 'user@test.com',
                        status: 'pending',
                    }),
                    createMockDoc('inv-3', {
                        groupId: 'group-c',
                        groupName: 'Work',
                        invitedEmail: 'user@test.com',
                        status: 'pending',
                    }),
                ],
                empty: false,
                size: 3,
            } as any);

            const invitations = await getInvitationsForEmail(mockDb, 'user@test.com');

            expect(invitations).toHaveLength(3);
            expect(invitations.map(i => i.groupName)).toEqual(['Family', 'Friends', 'Work']);
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================
    describe('edge cases', () => {
        it('handles email with mixed case correctly', async () => {
            mockAddDoc.mockResolvedValue({ id: 'inv-1' } as any);

            await createInvitation(mockDb, createTestInput({
                invitedEmail: 'UsEr@ExAmPlE.CoM',
            }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.invitedEmail).toBe('user@example.com');
        });

        it('handles email with leading/trailing whitespace', async () => {
            mockAddDoc.mockResolvedValue({ id: 'inv-1' } as any);

            await createInvitation(mockDb, createTestInput({
                invitedEmail: '  friend@example.com  ',
            }));

            expect(mockNormalizeEmail).toHaveBeenCalledWith('  friend@example.com  ');
        });

        it('handles very long group names by truncating to maxLength', async () => {
            mockAddDoc.mockResolvedValue({ id: 'inv-1' } as any);

            const longName = 'A'.repeat(200);
            await createInvitation(mockDb, createTestInput({
                groupName: longName,
            }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            // sanitizeInput truncates to maxLength (100 chars for group names)
            expect(invitationData.groupName).toBe('A'.repeat(100));
        });

        it('handles special characters in inviter name', async () => {
            mockAddDoc.mockResolvedValue({ id: 'inv-1' } as any);

            await createInvitation(mockDb, createTestInput({
                invitedByName: 'José García López 🎉',
            }));

            const addDocCall = mockAddDoc.mock.calls[0];
            const invitationData = addDocCall[1] as Partial<PendingInvitation>;

            expect(invitationData.invitedByName).toBe('José García López 🎉');
        });
    });

    // =========================================================================
    // validateGroupCapacity Tests (Story 14d-v2-1-5b-2: AC #1, #2)
    // =========================================================================
    describe('validateGroupCapacity', () => {
        beforeEach(() => {
            mockDoc.mockReturnValue({} as any);
        });

        // ---------------------------------------------------------------------
        // Input Validation
        // ---------------------------------------------------------------------
        describe('input validation', () => {
            it('returns error result for empty groupId', async () => {
                const result = await validateGroupCapacity(mockDb, '');

                expect(result.canAddContributor).toBe(false);
                expect(result.canAddViewer).toBe(false);
                expect(result.reason).toBe('Group ID is required');
                expect(mockGetDoc).not.toHaveBeenCalled();
            });

            it('returns error result for null groupId', async () => {
                const result = await validateGroupCapacity(mockDb, null as any);

                expect(result.canAddContributor).toBe(false);
                expect(result.canAddViewer).toBe(false);
                expect(result.reason).toBe('Group ID is required');
            });

            it('returns error result for undefined groupId', async () => {
                const result = await validateGroupCapacity(mockDb, undefined as any);

                expect(result.canAddContributor).toBe(false);
                expect(result.canAddViewer).toBe(false);
                expect(result.reason).toBe('Group ID is required');
            });
        });

        // ---------------------------------------------------------------------
        // Group Not Found
        // ---------------------------------------------------------------------
        describe('group not found', () => {
            it('returns error when group does not exist', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(false) as any);

                const result = await validateGroupCapacity(mockDb, 'nonexistent-group');

                expect(result.canAddContributor).toBe(false);
                expect(result.canAddViewer).toBe(false);
                expect(result.reason).toBe('Group not found');
            });

            it('calls doc with correct collection and groupId', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(false) as any);

                await validateGroupCapacity(mockDb, 'test-group-id');

                expect(mockDoc).toHaveBeenCalledWith(mockDb, 'sharedGroups', 'test-group-id');
            });
        });

        // ---------------------------------------------------------------------
        // Contributor Limit (BC-2: max 10)
        // ---------------------------------------------------------------------
        describe('contributor limit (BC-2: max 10)', () => {
            it('allows adding contributor when group has 0 members', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, []) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(true);
                expect(result.canAddViewer).toBe(true);
                expect(result.reason).toBeUndefined();
            });

            it('allows adding contributor when group has 1 member', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(1)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(true);
                expect(result.reason).toBeUndefined();
            });

            it('allows adding contributor when group has 5 members', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(5)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(true);
                expect(result.reason).toBeUndefined();
            });

            it('allows adding contributor when group has 9 members (boundary: below limit)', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(9)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(true);
                expect(result.canAddViewer).toBe(true);
                expect(result.reason).toBeUndefined();
            });

            it('denies adding contributor when group has 10 members (boundary: at limit) (AC #1)', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(10)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(false);
                expect(result.reason).toBe('This group has reached the maximum number of contributors (10)');
            });

            it('denies adding contributor when group has 11 members (boundary: above limit)', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(11)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(false);
                expect(result.reason).toContain('contributors');
            });

            it('returns correct error message for max contributors (AC #2)', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(10)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.reason).toBe('This group has reached the maximum number of contributors (10)');
            });
        });

        // ---------------------------------------------------------------------
        // Viewer Limit (BC-3: max 200)
        // ---------------------------------------------------------------------
        describe('viewer limit (BC-3: max 200)', () => {
            it('allows adding viewer when group has 10 members (contributor limit reached)', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(10)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(false);
                expect(result.canAddViewer).toBe(true);
            });

            it('allows adding viewer when group has 100 members', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(100)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddViewer).toBe(true);
            });

            it('allows adding viewer when group has 199 members (boundary: below limit)', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(199)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddViewer).toBe(true);
            });

            it('denies adding viewer when group has 200 members (boundary: at limit) (AC #1)', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(200)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddViewer).toBe(false);
                expect(result.reason).toBe('This group has reached the maximum number of viewers (200)');
            });

            it('denies adding viewer when group has 201 members (boundary: above limit)', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(201)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddViewer).toBe(false);
                expect(result.reason).toContain('viewers');
            });
        });

        // ---------------------------------------------------------------------
        // Edge Cases
        // ---------------------------------------------------------------------
        describe('edge cases', () => {
            it('handles group with undefined members array', async () => {
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => ({ members: undefined }),
                } as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(true);
                expect(result.canAddViewer).toBe(true);
            });

            it('handles group with null members array', async () => {
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => ({ members: null }),
                } as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(true);
                expect(result.canAddViewer).toBe(true);
            });

            it('handles group with missing members field', async () => {
                mockGetDoc.mockResolvedValue({
                    exists: () => true,
                    data: () => ({}),
                } as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.canAddContributor).toBe(true);
                expect(result.canAddViewer).toBe(true);
            });

            it('handles Firestore read error', async () => {
                mockGetDoc.mockRejectedValue(new Error('Firestore error'));

                await expect(validateGroupCapacity(mockDb, 'group-123')).rejects.toThrow('Firestore error');
            });
        });

        // ---------------------------------------------------------------------
        // Return Type Verification
        // ---------------------------------------------------------------------
        describe('return type verification', () => {
            it('returns GroupCapacityResult with all expected fields', async () => {
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(5)) as any);

                const result: GroupCapacityResult = await validateGroupCapacity(mockDb, 'group-123');

                expect(result).toHaveProperty('canAddContributor');
                expect(result).toHaveProperty('canAddViewer');
                expect(typeof result.canAddContributor).toBe('boolean');
                expect(typeof result.canAddViewer).toBe('boolean');
            });

            it('returns reason only when a limit is reached', async () => {
                // Below limits
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(5)) as any);
                let result = await validateGroupCapacity(mockDb, 'group-123');
                expect(result.reason).toBeUndefined();

                // At contributor limit
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(10)) as any);
                result = await validateGroupCapacity(mockDb, 'group-123');
                expect(result.reason).toBeDefined();
            });

            it('prioritizes viewer limit message when viewer limit is reached', async () => {
                // When viewer limit (200) is reached, show viewer message (not contributor)
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(200)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.reason).toContain('viewers');
                expect(result.reason).not.toContain('contributors');
            });

            it('shows contributor limit message when only contributor limit is reached', async () => {
                // When only contributor limit (10) is reached (not viewer), show contributor message
                mockGetDoc.mockResolvedValue(createMockGroupSnapshot(true, generateMemberIds(10)) as any);

                const result = await validateGroupCapacity(mockDb, 'group-123');

                expect(result.reason).toContain('contributors');
            });
        });
    });

    // =========================================================================
    // getPendingInvitationsForUser Tests (Story 14d-v2-1-6a: AC #4)
    // =========================================================================
    describe('getPendingInvitationsForUser', () => {
        beforeEach(() => {
            mockOrderBy.mockReturnValue({} as any);
        });

        it('queries pendingInvitations collection', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            await getPendingInvitationsForUser(mockDb, 'user@example.com');

            expect(mockCollection).toHaveBeenCalledWith(mockDb, 'pendingInvitations');
        });

        it('filters by normalized invitedEmail (AC #4)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            await getPendingInvitationsForUser(mockDb, 'USER@EXAMPLE.COM');

            expect(mockNormalizeEmail).toHaveBeenCalledWith('USER@EXAMPLE.COM');
            expect(mockWhere).toHaveBeenCalledWith('invitedEmail', '==', 'user@example.com');
        });

        it('filters by status pending (AC #4)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            await getPendingInvitationsForUser(mockDb, 'user@example.com');

            expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending');
        });

        it('sorts by createdAt descending (newest first) (AC #4)', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            await getPendingInvitationsForUser(mockDb, 'user@example.com');

            expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
        });

        it('returns array of invitations when found (AC #4)', async () => {
            const mockDocs = [
                createMockDoc('invitation-1', {
                    groupId: 'group-1',
                    groupName: 'Group 1',
                    invitedEmail: 'user@example.com',
                    invitedByName: 'Juan García',
                    createdAt: createMockTimestamp(-1),
                    status: 'pending',
                }),
                createMockDoc('invitation-2', {
                    groupId: 'group-2',
                    groupName: 'Group 2',
                    invitedEmail: 'user@example.com',
                    invitedByName: 'María López',
                    createdAt: createMockTimestamp(-2),
                    status: 'pending',
                }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                empty: false,
                size: 2,
            } as any);

            const result = await getPendingInvitationsForUser(mockDb, 'user@example.com');

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('invitation-1');
            expect(result[0].groupName).toBe('Group 1');
            expect(result[1].id).toBe('invitation-2');
            expect(result[1].groupName).toBe('Group 2');
        });

        it('includes group name, inviter, and invitation date in results (AC #4)', async () => {
            const mockTimestamp = createMockTimestamp(-1);
            const mockDocs = [
                createMockDoc('invitation-1', {
                    groupId: 'group-1',
                    groupName: '🏠 Gastos del Hogar',
                    groupColor: '#10b981',
                    invitedEmail: 'user@example.com',
                    invitedByUserId: 'owner-123',
                    invitedByName: 'Juan García',
                    createdAt: mockTimestamp,
                    expiresAt: createMockTimestamp(6),
                    status: 'pending',
                }),
            ];

            mockGetDocs.mockResolvedValue({
                docs: mockDocs,
                empty: false,
                size: 1,
            } as any);

            const result = await getPendingInvitationsForUser(mockDb, 'user@example.com');

            expect(result).toHaveLength(1);
            // AC #4: each includes group name, inviter, and invitation date
            expect(result[0].groupName).toBe('🏠 Gastos del Hogar');
            expect(result[0].invitedByName).toBe('Juan García');
            expect(result[0].createdAt).toBeDefined();
        });

        it('returns empty array when no invitations found', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            const result = await getPendingInvitationsForUser(mockDb, 'user@example.com');

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('returns empty array for empty email', async () => {
            const result = await getPendingInvitationsForUser(mockDb, '');

            expect(result).toEqual([]);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('returns empty array for invalid email', async () => {
            const result = await getPendingInvitationsForUser(mockDb, 'invalid');

            expect(result).toEqual([]);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('returns empty array for null email', async () => {
            const result = await getPendingInvitationsForUser(mockDb, null as any);

            expect(result).toEqual([]);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('returns empty array for undefined email', async () => {
            const result = await getPendingInvitationsForUser(mockDb, undefined as any);

            expect(result).toEqual([]);
            expect(mockGetDocs).not.toHaveBeenCalled();
        });

        it('calls query with correct arguments', async () => {
            mockGetDocs.mockResolvedValue({
                docs: [],
                empty: true,
                size: 0,
            } as any);

            await getPendingInvitationsForUser(mockDb, 'user@example.com');

            expect(mockQuery).toHaveBeenCalled();
            // Verify all query constraints were used
            expect(mockWhere).toHaveBeenCalledTimes(2); // email + status
            expect(mockOrderBy).toHaveBeenCalledTimes(1); // createdAt desc
        });

        it('handles Firestore errors', async () => {
            mockGetDocs.mockRejectedValue(new Error('Firestore error'));

            await expect(getPendingInvitationsForUser(mockDb, 'user@example.com'))
                .rejects.toThrow('Firestore error');
        });
    });

    // =========================================================================
    // validateInvitationByShareCode Tests (Story 14d-v2-1-6b: Task 5)
    // =========================================================================
    describe('validateInvitationByShareCode', () => {
        const validShareCode = 'Ab3dEf7hIj9kLm0p'; // 16 chars

        beforeEach(() => {
            mockIsValidShareCode.mockImplementation((code: string) => {
                if (!code || typeof code !== 'string') return false;
                if (code.length !== 16) return false;
                return /^[A-Za-z0-9_-]+$/.test(code);
            });
        });

        // -----------------------------------------------------------------
        // Format Validation (AC #3)
        // -----------------------------------------------------------------
        describe('format validation (AC #3)', () => {
            it('returns INVALID_FORMAT for empty share code', async () => {
                const result = await validateInvitationByShareCode(mockDb, '');

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.INVALID_FORMAT);
                }
                expect(mockGetDocs).not.toHaveBeenCalled();
            });

            it('returns INVALID_FORMAT for null share code', async () => {
                const result = await validateInvitationByShareCode(mockDb, null as any);

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.INVALID_FORMAT);
                }
            });

            it('returns INVALID_FORMAT for short share code (less than 16 chars)', async () => {
                const result = await validateInvitationByShareCode(mockDb, 'abc123');

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.INVALID_FORMAT);
                }
            });

            it('returns INVALID_FORMAT for share code with invalid characters', async () => {
                mockIsValidShareCode.mockReturnValue(false);

                const result = await validateInvitationByShareCode(mockDb, 'invalid!@#$%^&*(');

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.INVALID_FORMAT);
                }
            });
        });

        // -----------------------------------------------------------------
        // Not Found (AC #3)
        // -----------------------------------------------------------------
        describe('not found (AC #3)', () => {
            it('returns NOT_FOUND when no invitation exists', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [],
                    empty: true,
                } as any);

                const result = await validateInvitationByShareCode(mockDb, validShareCode);

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.NOT_FOUND);
                }
            });
        });

        // -----------------------------------------------------------------
        // Already Processed
        // -----------------------------------------------------------------
        describe('already processed', () => {
            it('returns ALREADY_PROCESSED for accepted invitation', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [createMockDoc('inv-1', {
                        shareCode: validShareCode,
                        status: 'accepted',
                        expiresAt: createMockTimestamp(7),
                    })],
                    empty: false,
                } as any);

                const result = await validateInvitationByShareCode(mockDb, validShareCode);

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.ALREADY_PROCESSED);
                }
            });

            it('returns ALREADY_PROCESSED for declined invitation', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [createMockDoc('inv-1', {
                        shareCode: validShareCode,
                        status: 'declined',
                        expiresAt: createMockTimestamp(7),
                    })],
                    empty: false,
                } as any);

                const result = await validateInvitationByShareCode(mockDb, validShareCode);

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.ALREADY_PROCESSED);
                }
            });
        });

        // -----------------------------------------------------------------
        // Expired (AC #5)
        // -----------------------------------------------------------------
        describe('expired (AC #5)', () => {
            it('returns EXPIRED for invitation with past expiresAt', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [createMockDoc('inv-1', {
                        shareCode: validShareCode,
                        status: 'pending',
                        expiresAt: createMockTimestamp(-1), // 1 day ago
                    })],
                    empty: false,
                } as any);

                const result = await validateInvitationByShareCode(mockDb, validShareCode);

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.EXPIRED);
                }
            });

            it('returns EXPIRED for invitation expired 7+ days ago', async () => {
                mockGetDocs.mockResolvedValue({
                    docs: [createMockDoc('inv-1', {
                        shareCode: validShareCode,
                        status: 'pending',
                        expiresAt: createMockTimestamp(-7), // 7 days ago
                    })],
                    empty: false,
                } as any);

                const result = await validateInvitationByShareCode(mockDb, validShareCode);

                expect(result.valid).toBe(false);
                if (!result.valid) {
                    expect(result.error).toBe(ShareCodeValidationError.EXPIRED);
                }
            });
        });

        // -----------------------------------------------------------------
        // Valid Invitation
        // -----------------------------------------------------------------
        describe('valid invitation', () => {
            it('returns valid result with invitation for valid pending invitation', async () => {
                const mockInvitationData = {
                    groupId: 'group-123',
                    groupName: 'Family Budget',
                    groupColor: '#10b981',
                    shareCode: validShareCode,
                    invitedEmail: 'friend@example.com',
                    invitedByUserId: 'user-xyz',
                    invitedByName: 'Juan García',
                    status: 'pending',
                    expiresAt: createMockTimestamp(6), // 6 days from now
                    createdAt: createMockTimestamp(-1), // 1 day ago
                };

                mockGetDocs.mockResolvedValue({
                    docs: [createMockDoc('inv-123', mockInvitationData)],
                    empty: false,
                } as any);

                const result = await validateInvitationByShareCode(mockDb, validShareCode);

                expect(result.valid).toBe(true);
                if (result.valid) {
                    expect(result.invitation.id).toBe('inv-123');
                    expect(result.invitation.groupName).toBe('Family Budget');
                    expect(result.invitation.status).toBe('pending');
                }
            });

            it('returns invitation with all fields', async () => {
                const mockInvitationData = {
                    groupId: 'group-abc',
                    groupName: '🏠 Gastos del Hogar',
                    groupColor: '#10b981',
                    groupIcon: '🏠',
                    shareCode: validShareCode,
                    invitedEmail: 'test@example.com',
                    invitedByUserId: 'owner-123',
                    invitedByName: 'María López',
                    status: 'pending',
                    expiresAt: createMockTimestamp(5),
                    createdAt: createMockTimestamp(-2),
                };

                mockGetDocs.mockResolvedValue({
                    docs: [createMockDoc('inv-456', mockInvitationData)],
                    empty: false,
                } as any);

                const result = await validateInvitationByShareCode(mockDb, validShareCode);

                expect(result.valid).toBe(true);
                if (result.valid) {
                    expect(result.invitation.groupId).toBe('group-abc');
                    expect(result.invitation.groupIcon).toBe('🏠');
                    expect(result.invitation.invitedByName).toBe('María López');
                }
            });
        });

        // -----------------------------------------------------------------
        // Error Messages
        // -----------------------------------------------------------------
        describe('error messages', () => {
            it('provides correct error message for INVALID_FORMAT', () => {
                expect(SHARE_CODE_ERROR_MESSAGES[ShareCodeValidationError.INVALID_FORMAT])
                    .toBe('This invite link is invalid or expired');
            });

            it('provides correct error message for NOT_FOUND', () => {
                expect(SHARE_CODE_ERROR_MESSAGES[ShareCodeValidationError.NOT_FOUND])
                    .toBe('This invite link is invalid or expired');
            });

            it('provides correct error message for EXPIRED (AC #5)', () => {
                expect(SHARE_CODE_ERROR_MESSAGES[ShareCodeValidationError.EXPIRED])
                    .toBe('This invitation has expired. Please ask for a new invite.');
            });

            it('provides correct error message for ALREADY_PROCESSED', () => {
                expect(SHARE_CODE_ERROR_MESSAGES[ShareCodeValidationError.ALREADY_PROCESSED])
                    .toBe('This invitation was already used');
            });
        });
    });

    // =========================================================================
    // acceptInvitation Tests (Story 14d-v2-1-6b: Task 3, AC #1, #4)
    // =========================================================================
    describe('acceptInvitation', () => {
        const validInvitationId = 'invitation-123';
        const validUserId = 'user-xyz';
        const validGroupId = 'group-abc';

        /**
         * Helper to create mock transaction
         */
        function createMockTransaction() {
            const updates: any[] = [];
            return {
                get: vi.fn(),
                update: vi.fn((ref, data) => updates.push({ ref, data })),
                set: vi.fn(),
                delete: vi.fn(),
                _updates: updates,
            };
        }

        /**
         * Helper to create mock invitation snapshot for transaction
         */
        function createMockInvitationSnapshot(exists: boolean, data?: Partial<PendingInvitation>) {
            return {
                exists: () => exists,
                id: validInvitationId,
                data: () => exists ? data : undefined,
            };
        }

        /**
         * Helper to create mock group snapshot for transaction
         */
        function createMockGroupSnapshotForTx(exists: boolean, data?: Partial<SharedGroup>) {
            return {
                exists: () => exists,
                id: validGroupId,
                data: () => exists ? data : undefined,
            };
        }

        beforeEach(() => {
            mockDoc.mockReturnValue({ id: 'mock-doc-ref' } as any);
        });

        // -----------------------------------------------------------------
        // Input Validation
        // -----------------------------------------------------------------
        describe('input validation', () => {
            it('throws error for empty invitationId', async () => {
                await expect(acceptInvitation(mockDb, '', validUserId))
                    .rejects.toThrow('Invitation ID and user ID are required');
            });

            it('throws error for empty userId', async () => {
                await expect(acceptInvitation(mockDb, validInvitationId, ''))
                    .rejects.toThrow('Invitation ID and user ID are required');
            });

            it('throws error for null invitationId', async () => {
                await expect(acceptInvitation(mockDb, null as any, validUserId))
                    .rejects.toThrow('Invitation ID and user ID are required');
            });

            it('throws error for null userId', async () => {
                await expect(acceptInvitation(mockDb, validInvitationId, null as any))
                    .rejects.toThrow('Invitation ID and user ID are required');
            });
        });

        // -----------------------------------------------------------------
        // Invitation Not Found
        // -----------------------------------------------------------------
        describe('invitation not found', () => {
            it('throws error when invitation does not exist', async () => {
                const mockTx = createMockTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshot(false));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(acceptInvitation(mockDb, validInvitationId, validUserId))
                    .rejects.toThrow('Invitation not found');
            });
        });

        // -----------------------------------------------------------------
        // Already Processed
        // -----------------------------------------------------------------
        describe('already processed', () => {
            it('throws error for already accepted invitation', async () => {
                const mockTx = createMockTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshot(true, {
                    groupId: validGroupId,
                    status: 'accepted',
                    expiresAt: createMockTimestamp(7),
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(acceptInvitation(mockDb, validInvitationId, validUserId))
                    .rejects.toThrow('Invitation has already been processed');
            });

            it('throws error for already declined invitation', async () => {
                const mockTx = createMockTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshot(true, {
                    groupId: validGroupId,
                    status: 'declined',
                    expiresAt: createMockTimestamp(7),
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(acceptInvitation(mockDb, validInvitationId, validUserId))
                    .rejects.toThrow('Invitation has already been processed');
            });
        });

        // -----------------------------------------------------------------
        // Expired Invitation
        // -----------------------------------------------------------------
        describe('expired invitation', () => {
            it('throws error for expired invitation (AC #5)', async () => {
                const mockTx = createMockTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshot(true, {
                    groupId: validGroupId,
                    status: 'pending',
                    expiresAt: createMockTimestamp(-1), // Expired
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(acceptInvitation(mockDb, validInvitationId, validUserId))
                    .rejects.toThrow('Invitation has expired');
            });
        });

        // -----------------------------------------------------------------
        // Group Not Found
        // -----------------------------------------------------------------
        describe('group not found', () => {
            it('throws error when group does not exist', async () => {
                const mockTx = createMockTransaction();
                mockTx.get
                    .mockResolvedValueOnce(createMockInvitationSnapshot(true, {
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }))
                    .mockResolvedValueOnce(createMockGroupSnapshotForTx(false));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(acceptInvitation(mockDb, validInvitationId, validUserId))
                    .rejects.toThrow('Group not found');
            });
        });

        // -----------------------------------------------------------------
        // Already Member
        // -----------------------------------------------------------------
        describe('already member', () => {
            it('throws error if user is already a member', async () => {
                const mockTx = createMockTransaction();
                mockTx.get
                    .mockResolvedValueOnce(createMockInvitationSnapshot(true, {
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }))
                    .mockResolvedValueOnce(createMockGroupSnapshotForTx(true, {
                        ownerId: 'owner-123',
                        members: [validUserId], // User already a member
                    }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(acceptInvitation(mockDb, validInvitationId, validUserId))
                    .rejects.toThrow('User is already a member of this group');
            });
        });

        // -----------------------------------------------------------------
        // Group Capacity
        // -----------------------------------------------------------------
        describe('group capacity', () => {
            it('throws error if group has reached max members (BC-2)', async () => {
                const mockTx = createMockTransaction();
                mockTx.get
                    .mockResolvedValueOnce(createMockInvitationSnapshot(true, {
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }))
                    .mockResolvedValueOnce(createMockGroupSnapshotForTx(true, {
                        ownerId: 'owner-123',
                        members: generateMemberIds(10), // At max capacity
                    }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(acceptInvitation(mockDb, validInvitationId, validUserId))
                    .rejects.toThrow('Group has reached maximum number of members');
            });
        });

        // -----------------------------------------------------------------
        // Successful Accept (AC #1)
        // -----------------------------------------------------------------
        describe('successful accept (AC #1)', () => {
            it('adds user to group members array', async () => {
                const mockTx = createMockTransaction();
                mockTx.get
                    .mockResolvedValueOnce(createMockInvitationSnapshot(true, {
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }))
                    .mockResolvedValueOnce(createMockGroupSnapshotForTx(true, {
                        ownerId: 'owner-123',
                        members: ['owner-123'],
                    }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await acceptInvitation(mockDb, validInvitationId, validUserId);

                // Verify transaction.update was called for group
                expect(mockTx.update).toHaveBeenCalled();
                const groupUpdateCall = mockTx.update.mock.calls.find(
                    (call: any[]) => call[1].members !== undefined
                );
                expect(groupUpdateCall).toBeDefined();
                expect(mockArrayUnion).toHaveBeenCalledWith(validUserId);
            });

            it('updates invitation status to accepted', async () => {
                const mockTx = createMockTransaction();
                mockTx.get
                    .mockResolvedValueOnce(createMockInvitationSnapshot(true, {
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }))
                    .mockResolvedValueOnce(createMockGroupSnapshotForTx(true, {
                        ownerId: 'owner-123',
                        members: ['owner-123'],
                    }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await acceptInvitation(mockDb, validInvitationId, validUserId);

                // Verify invitation status was updated
                const invitationUpdateCall = mockTx.update.mock.calls.find(
                    (call: any[]) => call[1].status === 'accepted'
                );
                expect(invitationUpdateCall).toBeDefined();
            });

            it('uses atomic transaction for all operations', async () => {
                const mockTx = createMockTransaction();
                mockTx.get
                    .mockResolvedValueOnce(createMockInvitationSnapshot(true, {
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }))
                    .mockResolvedValueOnce(createMockGroupSnapshotForTx(true, {
                        ownerId: 'owner-123',
                        members: ['owner-123'],
                    }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await acceptInvitation(mockDb, validInvitationId, validUserId);

                expect(mockRunTransaction).toHaveBeenCalledWith(mockDb, expect.any(Function));
            });

            it('includes user profile in memberProfiles when provided (AC #4)', async () => {
                const mockTx = createMockTransaction();
                mockTx.get
                    .mockResolvedValueOnce(createMockInvitationSnapshot(true, {
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }))
                    .mockResolvedValueOnce(createMockGroupSnapshotForTx(true, {
                        ownerId: 'owner-123',
                        members: ['owner-123'],
                    }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                const userProfile = {
                    displayName: 'Juan García',
                    email: 'juan@example.com',
                    photoURL: 'https://example.com/photo.jpg',
                };

                await acceptInvitation(mockDb, validInvitationId, validUserId, userProfile);

                // Verify member profile was added
                const groupUpdateCall = mockTx.update.mock.calls.find(
                    (call: any[]) => call[1][`memberProfiles.${validUserId}`] !== undefined
                );
                expect(groupUpdateCall).toBeDefined();
                if (groupUpdateCall) {
                    const profileData = groupUpdateCall[1][`memberProfiles.${validUserId}`];
                    expect(profileData.displayName).toBe('Juan García');
                    expect(profileData.email).toBe('juan@example.com');
                    expect(profileData.photoURL).toBe('https://example.com/photo.jpg');
                }
            });

            it('works without user profile', async () => {
                const mockTx = createMockTransaction();
                mockTx.get
                    .mockResolvedValueOnce(createMockInvitationSnapshot(true, {
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }))
                    .mockResolvedValueOnce(createMockGroupSnapshotForTx(true, {
                        ownerId: 'owner-123',
                        members: ['owner-123'],
                    }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                // Should not throw without userProfile
                await expect(acceptInvitation(mockDb, validInvitationId, validUserId))
                    .resolves.toBeUndefined();
            });
        });
    });

    // =========================================================================
    // acceptInvitation - User Group Preference Tests (Story 14d-v2-1-13+14, AC15)
    // =========================================================================
    describe('acceptInvitation - user group preference (Story 14d-v2-1-13+14)', () => {
        const validInvitationId = 'invitation-123';
        const validUserId = 'user-xyz';
        const validGroupId = 'group-abc';
        const validAppId = 'boletapp';

        /**
         * Helper to create mock transaction for preference tests
         */
        function createMockPrefTransaction() {
            const updates: any[] = [];
            const sets: any[] = [];
            return {
                get: vi.fn(),
                update: vi.fn((ref, data) => updates.push({ ref, data })),
                set: vi.fn((ref, data, options) => sets.push({ ref, data, options })),
                delete: vi.fn(),
                _updates: updates,
                _sets: sets,
            };
        }

        /**
         * Helper to setup a valid accept flow with invitation + group snapshots
         */
        function setupValidAcceptFlow(mockTx: ReturnType<typeof createMockPrefTransaction>) {
            mockTx.get
                .mockResolvedValueOnce({
                    exists: () => true,
                    id: validInvitationId,
                    data: () => ({
                        groupId: validGroupId,
                        status: 'pending',
                        expiresAt: createMockTimestamp(7),
                    }),
                })
                .mockResolvedValueOnce({
                    exists: () => true,
                    id: validGroupId,
                    data: () => ({
                        ownerId: 'owner-123',
                        members: ['owner-123'],
                    }),
                });
        }

        beforeEach(() => {
            mockDoc.mockReturnValue({ id: 'mock-doc-ref' } as any);
        });

        it('should write user group preference atomically when appId provided', async () => {
            const mockTx = createMockPrefTransaction();
            setupValidAcceptFlow(mockTx);

            mockRunTransaction.mockImplementation(async (db, callback) => {
                return callback(mockTx as any);
            });

            await acceptInvitation(mockDb, validInvitationId, validUserId, undefined, validAppId);

            // transaction.set should have been called for the preference write
            expect(mockTx.set).toHaveBeenCalledTimes(1);
            expect(mockTx.set).toHaveBeenCalledWith(
                expect.anything(), // prefsDocRef
                {
                    groupPreferences: {
                        [validGroupId]: {
                            shareMyTransactions: false,
                            lastToggleAt: null,
                            toggleCountToday: 0,
                            toggleCountResetAt: null,
                        },
                    },
                },
                { merge: true }
            );
        });

        it('should create preference with shareMyTransactions=true when opted in', async () => {
            const mockTx = createMockPrefTransaction();
            setupValidAcceptFlow(mockTx);

            mockRunTransaction.mockImplementation(async (db, callback) => {
                return callback(mockTx as any);
            });

            await acceptInvitation(mockDb, validInvitationId, validUserId, undefined, validAppId, true);

            expect(mockTx.set).toHaveBeenCalledTimes(1);
            expect(mockTx.set).toHaveBeenCalledWith(
                expect.anything(),
                {
                    groupPreferences: {
                        [validGroupId]: expect.objectContaining({
                            shareMyTransactions: true,
                        }),
                    },
                },
                { merge: true }
            );
        });

        it('should create preference with shareMyTransactions=false by default', async () => {
            const mockTx = createMockPrefTransaction();
            setupValidAcceptFlow(mockTx);

            mockRunTransaction.mockImplementation(async (db, callback) => {
                return callback(mockTx as any);
            });

            // Call with appId but without shareMyTransactions
            await acceptInvitation(mockDb, validInvitationId, validUserId, undefined, validAppId);

            expect(mockTx.set).toHaveBeenCalledWith(
                expect.anything(),
                {
                    groupPreferences: {
                        [validGroupId]: expect.objectContaining({
                            shareMyTransactions: false,
                        }),
                    },
                },
                { merge: true }
            );
        });

        it('should skip preference write when appId not provided', async () => {
            const mockTx = createMockPrefTransaction();
            setupValidAcceptFlow(mockTx);

            mockRunTransaction.mockImplementation(async (db, callback) => {
                return callback(mockTx as any);
            });

            // Call without appId
            await acceptInvitation(mockDb, validInvitationId, validUserId);

            // transaction.set should NOT have been called
            expect(mockTx.set).not.toHaveBeenCalled();
        });

        it('should build correct Firestore path for preference document', async () => {
            const mockTx = createMockPrefTransaction();
            setupValidAcceptFlow(mockTx);

            mockRunTransaction.mockImplementation(async (db, callback) => {
                return callback(mockTx as any);
            });

            await acceptInvitation(mockDb, validInvitationId, validUserId, undefined, validAppId);

            // Verify doc() was called with the correct path segments for the preference
            expect(mockDoc).toHaveBeenCalledWith(
                mockDb,
                'artifacts', validAppId, 'users', validUserId, 'preferences', 'sharedGroups'
            );
        });

        // ECC Security Review fix: appId validation
        it('should reject invalid appId', async () => {
            await expect(
                acceptInvitation(mockDb, validInvitationId, validUserId, undefined, 'invalid-app-id!', false)
            ).rejects.toThrow('Invalid application ID');
        });
    });

    // =========================================================================
    // declineInvitation Tests (Story 14d-v2-1-6b: Task 4, AC #2)
    // ECC Review: Updated to use transaction mocks after declineInvitation
    // was changed to use runTransaction for consistency with acceptInvitation
    // =========================================================================
    describe('declineInvitation', () => {
        const validInvitationId = 'invitation-123';

        /**
         * Helper to create mock transaction for declineInvitation tests
         */
        function createMockDeclineTransaction() {
            const updates: any[] = [];
            return {
                get: vi.fn(),
                update: vi.fn((ref, data) => updates.push({ ref, data })),
                set: vi.fn(),
                delete: vi.fn(),
                _updates: updates,
            };
        }

        /**
         * Helper to create mock invitation snapshot for transaction
         */
        function createMockInvitationSnapshotForDecline(exists: boolean, data?: Partial<PendingInvitation>) {
            return {
                exists: () => exists,
                id: validInvitationId,
                data: () => exists ? data : undefined,
            };
        }

        beforeEach(() => {
            mockDoc.mockReturnValue({ id: 'mock-doc-ref' } as any);
        });

        // -----------------------------------------------------------------
        // Input Validation
        // -----------------------------------------------------------------
        describe('input validation', () => {
            it('throws error for empty invitationId', async () => {
                await expect(declineInvitation(mockDb, ''))
                    .rejects.toThrow('Invitation ID is required');
            });

            it('throws error for null invitationId', async () => {
                await expect(declineInvitation(mockDb, null as any))
                    .rejects.toThrow('Invitation ID is required');
            });

            it('throws error for undefined invitationId', async () => {
                await expect(declineInvitation(mockDb, undefined as any))
                    .rejects.toThrow('Invitation ID is required');
            });
        });

        // -----------------------------------------------------------------
        // Invitation Not Found
        // -----------------------------------------------------------------
        describe('invitation not found', () => {
            it('throws error when invitation does not exist', async () => {
                const mockTx = createMockDeclineTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshotForDecline(false));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(declineInvitation(mockDb, validInvitationId))
                    .rejects.toThrow('Invitation not found');
            });
        });

        // -----------------------------------------------------------------
        // Already Processed
        // -----------------------------------------------------------------
        describe('already processed', () => {
            it('throws error for already accepted invitation', async () => {
                const mockTx = createMockDeclineTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshotForDecline(true, {
                    status: 'accepted',
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(declineInvitation(mockDb, validInvitationId))
                    .rejects.toThrow('Invitation has already been processed');
            });

            it('throws error for already declined invitation', async () => {
                const mockTx = createMockDeclineTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshotForDecline(true, {
                    status: 'declined',
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(declineInvitation(mockDb, validInvitationId))
                    .rejects.toThrow('Invitation has already been processed');
            });

            it('throws error for expired invitation (status)', async () => {
                const mockTx = createMockDeclineTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshotForDecline(true, {
                    status: 'expired',
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(declineInvitation(mockDb, validInvitationId))
                    .rejects.toThrow('Invitation has already been processed');
            });
        });

        // -----------------------------------------------------------------
        // Successful Decline (AC #2)
        // -----------------------------------------------------------------
        describe('successful decline (AC #2)', () => {
            it('updates invitation status to declined', async () => {
                const mockTx = createMockDeclineTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshotForDecline(true, {
                    groupId: 'group-123',
                    status: 'pending',
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await declineInvitation(mockDb, validInvitationId);

                // Verify transaction.update was called with status: 'declined'
                expect(mockTx.update).toHaveBeenCalledWith(
                    expect.anything(),
                    { status: 'declined' }
                );
            });

            it('does NOT add user to any group (AC #2)', async () => {
                const mockTx = createMockDeclineTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshotForDecline(true, {
                    groupId: 'group-123',
                    status: 'pending',
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await declineInvitation(mockDb, validInvitationId);

                // Verify no group-related operations
                // arrayUnion should not have been called (no group member updates)
                expect(mockArrayUnion).not.toHaveBeenCalled();
                // Transaction should only update the invitation (1 call), not the group
                expect(mockTx.update).toHaveBeenCalledTimes(1);
            });

            it('removes invitation from pending (via status change)', async () => {
                const mockTx = createMockDeclineTransaction();
                mockTx.get.mockResolvedValue(createMockInvitationSnapshotForDecline(true, {
                    groupId: 'group-123',
                    status: 'pending',
                    invitedEmail: 'user@example.com',
                }));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await declineInvitation(mockDb, validInvitationId);

                // The invitation is "removed from pending" by changing status to 'declined'
                expect(mockTx.update).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({ status: 'declined' })
                );
            });
        });

        // -----------------------------------------------------------------
        // Error Handling
        // -----------------------------------------------------------------
        describe('error handling', () => {
            it('propagates Firestore errors on transaction.get', async () => {
                const mockTx = createMockDeclineTransaction();
                mockTx.get.mockRejectedValue(new Error('Firestore read error'));

                mockRunTransaction.mockImplementation(async (db, callback) => {
                    return callback(mockTx as any);
                });

                await expect(declineInvitation(mockDb, validInvitationId))
                    .rejects.toThrow('Firestore read error');
            });

            it('propagates Firestore errors on runTransaction failure', async () => {
                // Simulate transaction failure
                mockRunTransaction.mockRejectedValue(new Error('Firestore transaction error'));

                await expect(declineInvitation(mockDb, validInvitationId))
                    .rejects.toThrow('Firestore transaction error');
            });
        });
    });
});
