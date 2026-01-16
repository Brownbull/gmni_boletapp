/**
 * SharedGroupService Leave/Manage Functions Unit Tests
 *
 * Story 14c.3: Leave/Manage Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the leave group, ownership transfer, member removal,
 * and delete group service functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    leaveGroupSoft,
    leaveGroupHard,
    transferOwnership,
    removeMember,
    deleteSharedGroupWithCleanup,
    getSharedGroup,
} from '../../../src/services/sharedGroupService'
import {
    writeBatch,
    doc,
    updateDoc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    arrayRemove,
    deleteField,
    serverTimestamp,
    Firestore,
} from 'firebase/firestore'

// ============================================================================
// Mocks
// ============================================================================

vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore')
    return {
        ...actual,
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        updateDoc: vi.fn(),
        writeBatch: vi.fn(),
        doc: vi.fn(),
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        arrayRemove: vi.fn((val) => ({ type: 'arrayRemove', value: val })),
        deleteField: vi.fn(() => ({ type: 'deleteField' })),
        serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })),
    }
})

// ============================================================================
// Test Data
// ============================================================================

const mockGroup = {
    id: 'group-123',
    name: '🏠 Family Expenses',
    color: '#10b981',
    icon: '🏠',
    ownerId: 'owner-user-id',
    members: ['owner-user-id', 'member-1', 'member-2'],
    shareCode: 'ABC123',
    shareCodeExpiresAt: null,
    appId: 'boletapp',
    createdAt: { toDate: () => new Date() },
    updatedAt: { toDate: () => new Date() },
    memberUpdates: {
        'owner-user-id': { toDate: () => new Date() },
        'member-1': { toDate: () => new Date() },
        'member-2': { toDate: () => new Date() },
    },
}

const mockDb = {} as Firestore

const mockBatch = {
    update: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
}

// ============================================================================
// Tests
// ============================================================================

describe('sharedGroupService - Leave/Manage Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(writeBatch as ReturnType<typeof vi.fn>).mockReturnValue(mockBatch)
        ;(doc as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'mock-doc' })
        ;(collection as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'mock-collection' })
        ;(query as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'mock-query' })
        ;(where as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'mock-where' })
    })

    describe('leaveGroupSoft (AC #2)', () => {
        beforeEach(() => {
            ;(getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => mockGroup,
                id: mockGroup.id,
            })
        })

        it('throws GROUP_NOT_FOUND when group does not exist', async () => {
            ;(getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => false,
            })

            await expect(
                leaveGroupSoft(mockDb, 'member-1', 'boletapp', 'nonexistent')
            ).rejects.toThrow('GROUP_NOT_FOUND')
        })

        it('throws NOT_A_MEMBER when user is not in the group', async () => {
            await expect(
                leaveGroupSoft(mockDb, 'not-a-member', 'boletapp', 'group-123')
            ).rejects.toThrow('NOT_A_MEMBER')
        })

        it('throws OWNER_CANNOT_LEAVE when owner tries to leave', async () => {
            await expect(
                leaveGroupSoft(mockDb, 'owner-user-id', 'boletapp', 'group-123')
            ).rejects.toThrow('OWNER_CANNOT_LEAVE')
        })

        it('removes member from group and updates profile', async () => {
            await leaveGroupSoft(mockDb, 'member-1', 'boletapp', 'group-123')

            expect(writeBatch).toHaveBeenCalledWith(mockDb)
            expect(mockBatch.update).toHaveBeenCalled()
            expect(mockBatch.set).toHaveBeenCalled()
            expect(mockBatch.commit).toHaveBeenCalled()
        })
    })

    describe('leaveGroupHard (AC #3)', () => {
        beforeEach(() => {
            ;(getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => mockGroup,
                id: mockGroup.id,
            })
            ;(getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({
                empty: true,
                docs: [],
                size: 0,
            })
        })

        it('throws GROUP_NOT_FOUND when group does not exist', async () => {
            ;(getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => false,
            })

            await expect(
                leaveGroupHard(mockDb, 'member-1', 'boletapp', 'nonexistent')
            ).rejects.toThrow('GROUP_NOT_FOUND')
        })

        it('throws OWNER_CANNOT_LEAVE when owner tries to leave', async () => {
            await expect(
                leaveGroupHard(mockDb, 'owner-user-id', 'boletapp', 'group-123')
            ).rejects.toThrow('OWNER_CANNOT_LEAVE')
        })

        it('untags transactions and removes member', async () => {
            await leaveGroupHard(mockDb, 'member-1', 'boletapp', 'group-123')

            // Should query for transactions
            expect(getDocs).toHaveBeenCalled()
            // Should commit batch for group/profile updates
            expect(mockBatch.commit).toHaveBeenCalled()
        })
    })

    describe('transferOwnership (AC #5)', () => {
        beforeEach(() => {
            ;(getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => mockGroup,
                id: mockGroup.id,
            })
            ;(updateDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
        })

        it('throws GROUP_NOT_FOUND when group does not exist', async () => {
            ;(getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => false,
            })

            await expect(
                transferOwnership(mockDb, 'owner-user-id', 'member-1', 'nonexistent')
            ).rejects.toThrow('GROUP_NOT_FOUND')
        })

        it('throws NOT_OWNER when non-owner tries to transfer', async () => {
            await expect(
                transferOwnership(mockDb, 'member-1', 'member-2', 'group-123')
            ).rejects.toThrow('NOT_OWNER')
        })

        it('throws CANNOT_TRANSFER_TO_SELF when trying to transfer to self', async () => {
            await expect(
                transferOwnership(mockDb, 'owner-user-id', 'owner-user-id', 'group-123')
            ).rejects.toThrow('CANNOT_TRANSFER_TO_SELF')
        })

        it('throws TARGET_NOT_MEMBER when new owner is not a member', async () => {
            await expect(
                transferOwnership(mockDb, 'owner-user-id', 'not-a-member', 'group-123')
            ).rejects.toThrow('TARGET_NOT_MEMBER')
        })

        it('updates ownerId when valid transfer', async () => {
            await transferOwnership(mockDb, 'owner-user-id', 'member-1', 'group-123')

            expect(updateDoc).toHaveBeenCalled()
        })
    })

    describe('removeMember (AC #6)', () => {
        beforeEach(() => {
            ;(getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => mockGroup,
                id: mockGroup.id,
            })
        })

        it('throws NOT_OWNER when non-owner tries to remove', async () => {
            await expect(
                removeMember(mockDb, 'member-1', 'member-2', 'boletapp', 'group-123')
            ).rejects.toThrow('NOT_OWNER')
        })

        it('throws OWNER_CANNOT_LEAVE when owner tries to remove self', async () => {
            await expect(
                removeMember(mockDb, 'owner-user-id', 'owner-user-id', 'boletapp', 'group-123')
            ).rejects.toThrow('OWNER_CANNOT_LEAVE')
        })

        it('throws NOT_A_MEMBER when target is not in group', async () => {
            await expect(
                removeMember(mockDb, 'owner-user-id', 'not-a-member', 'boletapp', 'group-123')
            ).rejects.toThrow('NOT_A_MEMBER')
        })

        it('removes member when owner requests valid removal', async () => {
            await removeMember(mockDb, 'owner-user-id', 'member-1', 'boletapp', 'group-123')

            // removeMember uses updateDoc directly (single document update)
            // not writeBatch since we only update the group document
            expect(updateDoc).toHaveBeenCalled()
        })
    })

    describe('deleteSharedGroupWithCleanup (AC #4)', () => {
        beforeEach(() => {
            ;(getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
                exists: () => true,
                data: () => mockGroup,
                id: mockGroup.id,
            })
            ;(getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({
                empty: true,
                docs: [],
                size: 0,
            })
        })

        it('throws NOT_OWNER when non-owner tries to delete', async () => {
            await expect(
                deleteSharedGroupWithCleanup(mockDb, 'member-1', 'boletapp', 'group-123', false)
            ).rejects.toThrow('NOT_OWNER')
        })

        it('deletes group and updates all member profiles', async () => {
            await deleteSharedGroupWithCleanup(mockDb, 'owner-user-id', 'boletapp', 'group-123', false)

            expect(writeBatch).toHaveBeenCalledWith(mockDb)
            // Should call set for each member's profile
            expect(mockBatch.set).toHaveBeenCalledTimes(mockGroup.members.length)
            // Should delete the group document
            expect(mockBatch.delete).toHaveBeenCalled()
            expect(mockBatch.commit).toHaveBeenCalled()
        })

        it('untags all transactions when removeTransactionTags is true', async () => {
            await deleteSharedGroupWithCleanup(mockDb, 'owner-user-id', 'boletapp', 'group-123', true)

            // Should query transactions for each member
            expect(getDocs).toHaveBeenCalledTimes(mockGroup.members.length)
        })

        it('skips transaction untagging when removeTransactionTags is false', async () => {
            await deleteSharedGroupWithCleanup(mockDb, 'owner-user-id', 'boletapp', 'group-123', false)

            // Should not query for transactions
            expect(getDocs).not.toHaveBeenCalled()
        })
    })
})
