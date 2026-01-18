/**
 * SharedGroupTransactionService Unit Tests
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for multi-member transaction queries, delta sync,
 * and utility functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    fetchSharedGroupTransactions,
    fetchDeltaUpdates,
    getChangedMembers,
    calculateTotalSpending,
    calculateSpendingByMember,
    getDefaultDateRange,
    enforceMaxDateRange,
    type SharedGroupTransaction,
} from '../../../src/services/sharedGroupTransactionService'
import type { Transaction } from '../../../src/types/transaction'

// ============================================================================
// Mocks
// ============================================================================

vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore')
    return {
        ...actual,
        collection: vi.fn(() => ({ path: 'mock-collection' })),
        query: vi.fn((...args) => ({ constraints: args })),
        where: vi.fn((...args) => ({ type: 'where', args })),
        orderBy: vi.fn((...args) => ({ type: 'orderBy', args })),
        limit: vi.fn((n) => ({ type: 'limit', n })),
        getDocs: vi.fn(),
        Timestamp: {
            fromDate: (date: Date) => ({
                toDate: () => date,
                seconds: Math.floor(date.getTime() / 1000),
                nanoseconds: (date.getTime() % 1000) * 1000000,
            }),
        },
    }
})

// ============================================================================
// Test Data
// ============================================================================

const createMockTransaction = (id: string, total: number, date: string): Transaction => ({
    id,
    date,
    merchant: 'Test Store',
    category: 'Supermarket',
    total,
    items: [],
})

const mockDb = {} as any

// ============================================================================
// Tests: getDefaultDateRange
// ============================================================================

describe('getDefaultDateRange', () => {
    it('should return current month range', () => {
        const now = new Date()
        const { startDate, endDate } = getDefaultDateRange()

        // Start should be first day of current month
        expect(startDate.getDate()).toBe(1)
        expect(startDate.getMonth()).toBe(now.getMonth())
        expect(startDate.getFullYear()).toBe(now.getFullYear())

        // End should be last day of current month
        expect(endDate.getMonth()).toBe(now.getMonth())
        expect(endDate.getFullYear()).toBe(now.getFullYear())
        // Last day varies by month, so just check it's > 27
        expect(endDate.getDate()).toBeGreaterThan(27)
    })
})

// ============================================================================
// Tests: enforceMaxDateRange
// ============================================================================

describe('enforceMaxDateRange', () => {
    it('should not adjust range within 12 months', () => {
        const startDate = new Date('2026-01-01')
        const endDate = new Date('2026-06-30')

        const result = enforceMaxDateRange(startDate, endDate)

        expect(result.wasAdjusted).toBe(false)
        expect(result.startDate).toEqual(startDate)
        expect(result.endDate).toEqual(endDate)
    })

    it('should adjust range exceeding 12 months', () => {
        const startDate = new Date('2024-01-01')
        const endDate = new Date('2026-06-30')

        const result = enforceMaxDateRange(startDate, endDate)

        expect(result.wasAdjusted).toBe(true)
        expect(result.endDate).toEqual(endDate)
        // Start should be 12 months before end
        expect(result.startDate.getFullYear()).toBe(2025)
        expect(result.startDate.getMonth()).toBe(5) // June (0-indexed)
    })
})

// ============================================================================
// Tests: calculateTotalSpending
// ============================================================================

describe('calculateTotalSpending', () => {
    it('should sum all transaction totals', () => {
        const transactions: Transaction[] = [
            createMockTransaction('1', 100, '2026-01-01'),
            createMockTransaction('2', 250, '2026-01-02'),
            createMockTransaction('3', 75.50, '2026-01-03'),
        ]

        const total = calculateTotalSpending(transactions)

        expect(total).toBe(425.50)
    })

    it('should return 0 for empty array', () => {
        const total = calculateTotalSpending([])
        expect(total).toBe(0)
    })

    it('should handle undefined totals gracefully', () => {
        const transactions = [
            { id: '1', date: '2026-01-01', merchant: 'X', category: 'Other', total: undefined, items: [] },
        ] as unknown as Transaction[]

        const total = calculateTotalSpending(transactions)

        expect(total).toBe(0)
    })
})

// ============================================================================
// Tests: calculateSpendingByMember
// ============================================================================

describe('calculateSpendingByMember', () => {
    it('should group spending by _ownerId', () => {
        const transactions: SharedGroupTransaction[] = [
            { ...createMockTransaction('1', 100, '2026-01-01'), _ownerId: 'user-1' },
            { ...createMockTransaction('2', 200, '2026-01-02'), _ownerId: 'user-2' },
            { ...createMockTransaction('3', 150, '2026-01-03'), _ownerId: 'user-1' },
        ]

        const byMember = calculateSpendingByMember(transactions)

        expect(byMember.get('user-1')).toBe(250)
        expect(byMember.get('user-2')).toBe(200)
        expect(byMember.size).toBe(2)
    })

    it('should return empty map for empty array', () => {
        const byMember = calculateSpendingByMember([])
        expect(byMember.size).toBe(0)
    })
})

// ============================================================================
// Tests: getChangedMembers
// ============================================================================

describe('getChangedMembers', () => {
    it('should identify members with updates after lastSync', () => {
        const lastSync = new Date('2026-01-15T10:00:00Z')

        const memberUpdates = {
            'user-1': { lastSyncAt: { toDate: () => new Date('2026-01-15T12:00:00Z') } as any },
            'user-2': { lastSyncAt: { toDate: () => new Date('2026-01-14T12:00:00Z') } as any },
            'user-3': { lastSyncAt: { toDate: () => new Date('2026-01-16T08:00:00Z') } as any },
        }

        const changed = getChangedMembers(memberUpdates, lastSync)

        expect(changed).toContain('user-1')
        expect(changed).toContain('user-3')
        expect(changed).not.toContain('user-2')
        expect(changed).toHaveLength(2)
    })

    it('should return empty array when no updates', () => {
        const lastSync = new Date('2026-01-15T10:00:00Z')
        const memberUpdates = {}

        const changed = getChangedMembers(memberUpdates, lastSync)

        expect(changed).toHaveLength(0)
    })

    it('should skip members without lastSyncAt', () => {
        const lastSync = new Date('2026-01-15T10:00:00Z')

        const memberUpdates = {
            'user-1': {} as any,
            'user-2': { lastSyncAt: { toDate: () => new Date('2026-01-16T12:00:00Z') } as any },
        }

        const changed = getChangedMembers(memberUpdates, lastSync)

        expect(changed).toHaveLength(1)
        expect(changed).toContain('user-2')
    })
})

// ============================================================================
// Tests: fetchSharedGroupTransactions
// ============================================================================

describe('fetchSharedGroupTransactions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return empty array for empty members list', async () => {
        const result = await fetchSharedGroupTransactions(mockDb, 'app', 'group', [], {})

        expect(result).toEqual([])
    })

    it('should return empty array for empty groupId', async () => {
        const result = await fetchSharedGroupTransactions(mockDb, 'app', '', ['user-1'], {})

        expect(result).toEqual([])
    })

    it('should fetch and merge transactions from multiple members', async () => {
        const { getDocs } = await import('firebase/firestore')

        // Mock responses for each member query
        ;(getDocs as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                docs: [
                    { id: 'tx-1', data: () => ({ date: '2026-01-02', merchant: 'A', total: 100, items: [] }) },
                ],
            })
            .mockResolvedValueOnce({
                docs: [
                    { id: 'tx-2', data: () => ({ date: '2026-01-01', merchant: 'B', total: 200, items: [] }) },
                ],
            })

        const result = await fetchSharedGroupTransactions(mockDb, 'app', 'group-1', ['user-1', 'user-2'], {})

        expect(result).toHaveLength(2)
        // Should be sorted by date descending
        expect(result[0].id).toBe('tx-1') // 2026-01-02
        expect(result[1].id).toBe('tx-2') // 2026-01-01
        // Should have _ownerId added
        expect(result[0]._ownerId).toBe('user-1')
        expect(result[1]._ownerId).toBe('user-2')
    })

    it('should handle query errors gracefully', async () => {
        const { getDocs } = await import('firebase/firestore')

        // First query succeeds, second fails
        ;(getDocs as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                docs: [
                    { id: 'tx-1', data: () => ({ date: '2026-01-01', merchant: 'A', total: 100, items: [] }) },
                ],
            })
            .mockRejectedValueOnce(new Error('Permission denied'))

        const result = await fetchSharedGroupTransactions(mockDb, 'app', 'group-1', ['user-1', 'user-2'], {})

        // Should still return successful results
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('tx-1')
    })
})

// ============================================================================
// Tests: fetchDeltaUpdates
// ============================================================================

describe('fetchDeltaUpdates', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return empty result for empty changedMembers', async () => {
        const result = await fetchDeltaUpdates(mockDb, 'app', 'group', {
            since: new Date(),
            changedMembers: [],
        })

        expect(result.transactions).toHaveLength(0)
        expect(result.deletedIds).toHaveLength(0)
    })

    it('should separate updated transactions from deleted ones', async () => {
        const { getDocs } = await import('firebase/firestore')

        ;(getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({
            docs: [
                { id: 'tx-1', data: () => ({ date: '2026-01-01', merchant: 'A', total: 100, items: [], deletedAt: null }) },
                { id: 'tx-2', data: () => ({ date: '2026-01-02', merchant: 'B', total: 200, items: [], deletedAt: { toDate: () => new Date() } }) },
            ],
        })

        const result = await fetchDeltaUpdates(mockDb, 'app', 'group', {
            since: new Date('2026-01-01'),
            changedMembers: ['user-1'],
        })

        expect(result.transactions).toHaveLength(1)
        expect(result.transactions[0].id).toBe('tx-1')
        expect(result.deletedIds).toHaveLength(1)
        expect(result.deletedIds[0]).toBe('tx-2')
    })
})
