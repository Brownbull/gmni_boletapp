/**
 * useSharedGroupTransactions Hook Unit Tests
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the React Query hook that manages shared group transactions
 * with IndexedDB caching support.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock Firebase
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore')
    return {
        ...actual,
        collection: vi.fn(() => ({ path: 'mock-collection' })),
        query: vi.fn((...args) => ({ constraints: args })),
        where: vi.fn((...args) => ({ type: 'where', args })),
        orderBy: vi.fn((...args) => ({ type: 'orderBy', args })),
        limit: vi.fn((n) => ({ type: 'limit', n })),
        getDocs: vi.fn().mockResolvedValue({ docs: [] }),
        Timestamp: {
            fromDate: (date: Date) => ({
                toDate: () => date,
                seconds: Math.floor(date.getTime() / 1000),
                nanoseconds: (date.getTime() % 1000) * 1000000,
            }),
        },
    }
})

// Mock IndexedDB cache
vi.mock('../../../src/lib/sharedGroupCache', () => ({
    isIndexedDBAvailable: vi.fn().mockReturnValue(true),
    openSharedGroupDB: vi.fn().mockResolvedValue({}),
    readFromCache: vi.fn().mockResolvedValue([]),
    writeToCache: vi.fn().mockResolvedValue(undefined),
    removeFromCache: vi.fn().mockResolvedValue(undefined),
    getSyncMetadata: vi.fn().mockResolvedValue(null),
    updateSyncMetadata: vi.fn().mockResolvedValue(undefined),
    CACHE_CONFIG: { MAX_RECORDS: 50000, EVICTION_BATCH: 5000 },
}))

// Mock transaction service
vi.mock('../../../src/services/sharedGroupTransactionService', () => ({
    fetchSharedGroupTransactions: vi.fn().mockResolvedValue([]),
    fetchDeltaUpdates: vi.fn().mockResolvedValue({ transactions: [], deletedIds: [] }),
    getChangedMembers: vi.fn().mockReturnValue([]),
    calculateTotalSpending: vi.fn().mockImplementation((txs) => txs.reduce((sum: number, tx: any) => sum + (tx.total || 0), 0)),
    calculateSpendingByMember: vi.fn().mockReturnValue(new Map()),
    getDefaultDateRange: vi.fn().mockReturnValue({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
    }),
    enforceMaxDateRange: vi.fn().mockImplementation((start, end) => ({ startDate: start, endDate: end, wasAdjusted: false })),
}))

import { useSharedGroupTransactions, useStorageStrategy } from '../../../src/hooks/useSharedGroupTransactions'
import type { SharedGroup } from '../../../src/types/sharedGroup'

// ============================================================================
// Test Setup
// ============================================================================

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    })
}

function createWrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }
}

const mockGroup: SharedGroup = {
    id: 'group-123',
    name: 'Test Group',
    color: '#10b981',
    ownerId: 'user-1',
    members: ['user-1', 'user-2'],
    createdAt: { toDate: () => new Date() } as any,
}

const mockServices = {
    db: {} as any,
    appId: 'test-app',
    user: { uid: 'user-1' } as any,
}

// ============================================================================
// Tests: useSharedGroupTransactions
// ============================================================================

describe('useSharedGroupTransactions', () => {
    let queryClient: QueryClient

    beforeEach(() => {
        queryClient = createTestQueryClient()
        vi.clearAllMocks()
    })

    afterEach(() => {
        queryClient.clear()
    })

    describe('Initialization', () => {
        it('should return initial state when disabled', () => {
            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: null,
                    enabled: false,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            expect(result.current.transactions).toEqual([])
            expect(result.current.total).toBe(0)
            expect(result.current.isLoading).toBe(false)
        })

        it('should start loading when enabled with group', async () => {
            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                    enabled: true,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            // Initially loading
            expect(result.current.isLoading).toBe(true)

            // Wait for query to complete
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })
        })
    })

    describe('Date Range Management', () => {
        it('should initialize with default date range (current month)', () => {
            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            expect(result.current.dateRange.startDate).toBeInstanceOf(Date)
            expect(result.current.dateRange.endDate).toBeInstanceOf(Date)
        })

        it('should update date range when setDateRange is called', async () => {
            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            const newStartDate = new Date('2025-06-01')
            const newEndDate = new Date('2025-06-30')

            act(() => {
                result.current.setDateRange(newStartDate, newEndDate)
            })

            expect(result.current.dateRange.startDate).toEqual(newStartDate)
            expect(result.current.dateRange.endDate).toEqual(newEndDate)
        })
    })

    describe('Member Filtering', () => {
        it('should initialize with no members selected (show all)', () => {
            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            expect(result.current.selectedMembers).toEqual([])
        })

        it('should toggle member selection', async () => {
            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            // Select a member
            act(() => {
                result.current.toggleMember('user-1')
            })

            expect(result.current.selectedMembers).toContain('user-1')

            // Deselect the member
            act(() => {
                result.current.toggleMember('user-1')
            })

            expect(result.current.selectedMembers).not.toContain('user-1')
        })

        it('should select all members (clear filter)', async () => {
            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            // First select some members
            act(() => {
                result.current.toggleMember('user-1')
                result.current.toggleMember('user-2')
            })

            expect(result.current.selectedMembers.length).toBe(2)

            // Select all (clears filter)
            act(() => {
                result.current.selectAllMembers()
            })

            expect(result.current.selectedMembers).toEqual([])
        })
    })

    describe('Filtered Transactions', () => {
        it('should return all transactions when no member filter', async () => {
            const { fetchSharedGroupTransactions } = await import('../../../src/services/sharedGroupTransactionService')
            const mockTransactions = [
                { id: 'tx-1', total: 100, _ownerId: 'user-1', date: '2026-01-01', merchant: 'A', category: 'Other', items: [] },
                { id: 'tx-2', total: 200, _ownerId: 'user-2', date: '2026-01-02', merchant: 'B', category: 'Other', items: [] },
            ]
            ;(fetchSharedGroupTransactions as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransactions)

            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // No filter = all transactions
            expect(result.current.transactions.length).toBe(2)
        })
    })

    describe('Total Calculation', () => {
        it('should calculate total from all transactions', async () => {
            const { fetchSharedGroupTransactions, calculateTotalSpending } = await import('../../../src/services/sharedGroupTransactionService')
            const mockTransactions = [
                { id: 'tx-1', total: 100, _ownerId: 'user-1', date: '2026-01-01', merchant: 'A', category: 'Other', items: [] },
                { id: 'tx-2', total: 200, _ownerId: 'user-2', date: '2026-01-02', merchant: 'B', category: 'Other', items: [] },
            ]
            ;(fetchSharedGroupTransactions as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransactions)
            ;(calculateTotalSpending as ReturnType<typeof vi.fn>).mockReturnValue(300)

            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.total).toBe(300)
        })
    })

    describe('Refresh', () => {
        it('should provide refresh function', async () => {
            const { result } = renderHook(
                () => useSharedGroupTransactions({
                    services: mockServices,
                    group: mockGroup,
                }),
                { wrapper: createWrapper(queryClient) }
            )

            // Wait for initial load to complete
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // refresh should be available after query is ready
            expect(result.current.refresh).toBeDefined()
            expect(typeof result.current.refresh).toBe('function')
        })
    })
})

// ============================================================================
// Tests: useStorageStrategy
// ============================================================================

describe('useStorageStrategy', () => {
    let queryClient: QueryClient

    beforeEach(() => {
        queryClient = createTestQueryClient()
        vi.clearAllMocks()
    })

    it('should return initial checking state', () => {
        const { result } = renderHook(
            () => useStorageStrategy(),
            { wrapper: createWrapper(queryClient) }
        )

        // Initially checking
        expect(result.current.isChecking).toBe(true)
    })

    it('should detect IndexedDB availability', async () => {
        const { isIndexedDBAvailable } = await import('../../../src/lib/sharedGroupCache')
        ;(isIndexedDBAvailable as ReturnType<typeof vi.fn>).mockReturnValue(true)

        const { result } = renderHook(
            () => useStorageStrategy(),
            { wrapper: createWrapper(queryClient) }
        )

        await waitFor(() => {
            expect(result.current.isChecking).toBe(false)
        })

        expect(result.current.usingIndexedDB).toBe(true)
        expect(result.current.showOfflineWarning).toBe(false)
    })

    it('should show warning when IndexedDB unavailable', async () => {
        const { isIndexedDBAvailable } = await import('../../../src/lib/sharedGroupCache')
        ;(isIndexedDBAvailable as ReturnType<typeof vi.fn>).mockReturnValue(false)

        const { result } = renderHook(
            () => useStorageStrategy(),
            { wrapper: createWrapper(queryClient) }
        )

        await waitFor(() => {
            expect(result.current.isChecking).toBe(false)
        })

        expect(result.current.usingIndexedDB).toBe(false)
        expect(result.current.showOfflineWarning).toBe(true)
    })
})
