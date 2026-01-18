/**
 * useAllUserGroups Hook Unit Tests
 *
 * Story 14c.7: Tag Transactions to Groups
 * Story 14c.8: Group Consolidation - shared groups only
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests for the hook that provides all user groups (shared groups only).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAllUserGroups } from '../../../src/hooks/useAllUserGroups'
import type { SharedGroup } from '../../../src/types/sharedGroup'

// ============================================================================
// Mocks
// ============================================================================

// Mock the useSharedGroups hook
vi.mock('../../../src/hooks/useSharedGroups', () => ({
    useSharedGroups: vi.fn(),
}))

import { useSharedGroups } from '../../../src/hooks/useSharedGroups'

const mockUseSharedGroups = vi.mocked(useSharedGroups)

// ============================================================================
// Test Fixtures
// ============================================================================

const mockSharedGroups: SharedGroup[] = [
    {
        id: 'group-1',
        ownerId: 'user-1',
        appId: 'boletapp',
        name: 'Family Expenses',
        color: '#10b981',
        icon: '👨‍👩‍👧',
        members: ['user-1', 'user-2', 'user-3'],
        memberUpdates: {},
        memberProfiles: {},
        createdAt: null,
        updatedAt: null,
    },
    {
        id: 'group-2',
        ownerId: 'user-1',
        appId: 'boletapp',
        name: 'Roommates',
        color: '#3b82f6',
        icon: '🏠',
        members: ['user-1', 'user-4'],
        memberUpdates: {},
        memberProfiles: {},
        createdAt: null,
        updatedAt: null,
    },
]

// ============================================================================
// Tests
// ============================================================================

describe('useAllUserGroups', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Loading State', () => {
        it('returns loading state while fetching', () => {
            mockUseSharedGroups.mockReturnValue({
                sharedGroups: [],
                loading: true,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups('user-1')
            )

            expect(result.current.isLoading).toBe(true)
            expect(result.current.groups).toEqual([])
        })
    })

    describe('Successful Fetch', () => {
        it('transforms shared groups to GroupWithMeta format', () => {
            mockUseSharedGroups.mockReturnValue({
                sharedGroups: mockSharedGroups,
                loading: false,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups('user-1')
            )

            expect(result.current.isLoading).toBe(false)
            expect(result.current.groups).toHaveLength(2)

            // Check transformation (sorted alphabetically)
            const familyGroup = result.current.groups.find(g => g.id === 'group-1')
            expect(familyGroup).toBeDefined()
            expect(familyGroup?.name).toBe('Family Expenses')
            expect(familyGroup?.color).toBe('#10b981')
            expect(familyGroup?.icon).toBe('👨‍👩‍👧')
            expect(familyGroup?.isShared).toBe(true)
            expect(familyGroup?.memberCount).toBe(3)
        })

        it('sets hasGroups to true when groups exist', () => {
            mockUseSharedGroups.mockReturnValue({
                sharedGroups: mockSharedGroups,
                loading: false,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups('user-1')
            )

            expect(result.current.hasGroups).toBe(true)
            expect(result.current.groupCount).toBe(2)
        })
    })

    describe('Empty State', () => {
        it('returns empty groups when user has no shared groups', () => {
            mockUseSharedGroups.mockReturnValue({
                sharedGroups: [],
                loading: false,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups('user-1')
            )

            expect(result.current.groups).toEqual([])
            expect(result.current.hasGroups).toBe(false)
            expect(result.current.groupCount).toBe(0)
        })
    })

    describe('Error State', () => {
        it('returns error when subscription fails', () => {
            mockUseSharedGroups.mockReturnValue({
                sharedGroups: [],
                loading: false,
                error: 'Failed to fetch',
            })

            const { result } = renderHook(() =>
                useAllUserGroups('user-1')
            )

            expect(result.current.error).toBeDefined()
            expect(result.current.error?.message).toBe('Failed to fetch')
            expect(result.current.groups).toEqual([])
        })
    })

    describe('Sorting', () => {
        it('sorts groups alphabetically by name', () => {
            const unsortedGroups: SharedGroup[] = [
                { ...mockSharedGroups[0], id: 'z', name: 'Zebra Group' },
                { ...mockSharedGroups[0], id: 'a', name: 'Apple Group' },
                { ...mockSharedGroups[0], id: 'm', name: 'Mango Group' },
            ]

            mockUseSharedGroups.mockReturnValue({
                sharedGroups: unsortedGroups,
                loading: false,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups('user-1')
            )

            expect(result.current.groups[0].name).toBe('Apple Group')
            expect(result.current.groups[1].name).toBe('Mango Group')
            expect(result.current.groups[2].name).toBe('Zebra Group')
        })
    })

    describe('No User', () => {
        it('returns empty state when userId is undefined', () => {
            mockUseSharedGroups.mockReturnValue({
                sharedGroups: [],
                loading: false,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups(undefined)
            )

            expect(result.current.groups).toEqual([])
            expect(result.current.hasGroups).toBe(false)
        })

        it('returns empty state when userId is null', () => {
            mockUseSharedGroups.mockReturnValue({
                sharedGroups: [],
                loading: false,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups(null)
            )

            expect(result.current.groups).toEqual([])
            expect(result.current.hasGroups).toBe(false)
        })
    })

    describe('Member Count Calculation', () => {
        it('calculates memberCount from members array', () => {
            mockUseSharedGroups.mockReturnValue({
                sharedGroups: mockSharedGroups,
                loading: false,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups('user-1')
            )

            // Groups are sorted: Family Expenses (3), Roommates (2)
            const familyGroup = result.current.groups.find(g => g.id === 'group-1')
            const roommatesGroup = result.current.groups.find(g => g.id === 'group-2')
            expect(familyGroup?.memberCount).toBe(3)
            expect(roommatesGroup?.memberCount).toBe(2)
        })

        it('returns 0 memberCount when members array is undefined', () => {
            const groupWithoutMembers: SharedGroup[] = [
                {
                    id: 'group-x',
                    ownerId: 'user-1',
                    appId: 'boletapp',
                    name: 'Empty Group',
                    color: '#000',
                    members: undefined as any, // Simulating missing members
                    memberUpdates: {},
                    memberProfiles: {},
                    createdAt: null,
                    updatedAt: null,
                },
            ]

            mockUseSharedGroups.mockReturnValue({
                sharedGroups: groupWithoutMembers,
                loading: false,
                error: null,
            })

            const { result } = renderHook(() =>
                useAllUserGroups('user-1')
            )

            expect(result.current.groups[0].memberCount).toBe(0)
        })
    })
})
