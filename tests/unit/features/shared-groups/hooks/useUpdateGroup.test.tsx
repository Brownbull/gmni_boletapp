/**
 * useUpdateGroup Hook Tests
 *
 * Story 14d-v2-1-7g: Edit Group Settings
 * Epic 14d-v2: Shared Groups v2
 *
 * Tests for the useUpdateGroup React Query mutation hook:
 * - Calls updateGroup service with correct parameters
 * - Optimistic cache updates
 * - Rollback on error
 * - Query invalidation on success
 * - Returns isPending during mutation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { User } from 'firebase/auth';
import type { Services } from '@/hooks/useAuth';
import type { SharedGroup } from '@/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';
import { QUERY_KEYS } from '@/lib/queryKeys';

// =============================================================================
// Mocks
// =============================================================================

const mockUpdateGroup = vi.fn();

vi.mock('@/features/shared-groups/services/groupService', () => ({
    updateGroup: (...args: unknown[]) => mockUpdateGroup(...args),
    getUserGroups: vi.fn(),
    getGroupCount: vi.fn(),
    createGroup: vi.fn(),
    getDeviceTimezone: vi.fn(() => 'America/Santiago'),
    DEFAULT_GROUP_COLOR: '#10b981',
    GROUP_COLORS: ['#10b981', '#3b82f6'],
    GROUP_ICONS: ['🏠', '🚗'],
}));

// Import after mocks
import { useUpdateGroup } from '@/features/shared-groups/hooks/useGroups';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockUser(overrides: Partial<User> = {}): User {
    return {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        ...overrides,
    } as User;
}

function createMockServices(): Services {
    return {
        db: {} as any,
        appId: 'boletapp',
    };
}

function createMockGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
    return {
        id: 'group-123',
        ownerId: 'user-123',
        appId: 'boletapp',
        name: 'Test Group',
        color: '#10b981',
        icon: '🏠',
        shareCode: 'TestShareCode1234',
        shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        members: ['user-123'],
        memberUpdates: {},
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        timezone: 'America/Santiago',
        transactionSharingEnabled: true,
        transactionSharingLastToggleAt: null,
        transactionSharingToggleCountToday: 0,
        ...overrides,
    };
}

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

function createWrapperWithQueryClient(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useUpdateGroup (Story 14d-v2-1-7g)', () => {
    const mockUser = createMockUser();
    const mockServices = createMockServices();
    const mockGroup = createMockGroup();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // Service Call Tests
    // =========================================================================

    describe('service calls', () => {
        it('calls updateGroup service with correct params', async () => {
            mockUpdateGroup.mockResolvedValue(undefined);
            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await act(async () => {
                await result.current.mutateAsync({
                    groupId: 'group-123',
                    name: 'New Name',
                    icon: '🚗',
                    color: '#3b82f6',
                });
            });

            expect(mockUpdateGroup).toHaveBeenCalledWith(
                mockServices.db,
                'group-123',
                mockUser.uid,
                { name: 'New Name', icon: '🚗', color: '#3b82f6' }
            );
        });

        it('calls updateGroup with only provided fields', async () => {
            mockUpdateGroup.mockResolvedValue(undefined);
            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await act(async () => {
                await result.current.mutateAsync({
                    groupId: 'group-123',
                    name: 'Only Name',
                });
            });

            expect(mockUpdateGroup).toHaveBeenCalledWith(
                mockServices.db,
                'group-123',
                mockUser.uid,
                { name: 'Only Name' }
            );
        });

        it('throws error when user is not authenticated', async () => {
            const { result } = renderHook(
                () => useUpdateGroup(null, mockServices),
                { wrapper: createWrapper() }
            );

            await act(async () => {
                await expect(
                    result.current.mutateAsync({
                        groupId: 'group-123',
                        name: 'New Name',
                    })
                ).rejects.toThrow('User must be authenticated');
            });
        });
    });

    // =========================================================================
    // Optimistic Update Tests
    // =========================================================================

    describe('optimistic updates', () => {
        it('optimistically updates group in cache', async () => {
            const queryClient = new QueryClient({
                defaultOptions: {
                    queries: { retry: false },
                    mutations: { retry: false },
                },
            });

            // Pre-populate cache with group data
            queryClient.setQueryData(
                QUERY_KEYS.groups.list(mockUser.uid),
                [mockGroup]
            );

            mockUpdateGroup.mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 100))
            );

            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapperWithQueryClient(queryClient) }
            );

            // Start the mutation (don't await)
            act(() => {
                result.current.mutate({
                    groupId: 'group-123',
                    name: 'Optimistic Name',
                });
            });

            // Check that cache was updated optimistically
            await waitFor(() => {
                const cachedGroups = queryClient.getQueryData<SharedGroup[]>(
                    QUERY_KEYS.groups.list(mockUser.uid)
                );
                expect(cachedGroups?.[0]?.name).toBe('Optimistic Name');
            });
        });
    });

    // =========================================================================
    // Rollback Tests
    // =========================================================================

    describe('rollback on error', () => {
        it('rolls back cache on error', async () => {
            const queryClient = new QueryClient({
                defaultOptions: {
                    queries: { retry: false },
                    mutations: { retry: false },
                },
            });

            // Pre-populate cache with group data
            queryClient.setQueryData(
                QUERY_KEYS.groups.list(mockUser.uid),
                [mockGroup]
            );

            mockUpdateGroup.mockRejectedValue(new Error('Update failed'));

            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapperWithQueryClient(queryClient) }
            );

            await act(async () => {
                try {
                    await result.current.mutateAsync({
                        groupId: 'group-123',
                        name: 'Failed Update',
                    });
                } catch {
                    // Expected to throw
                }
            });

            // Check that cache was rolled back
            const cachedGroups = queryClient.getQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(mockUser.uid)
            );
            expect(cachedGroups?.[0]?.name).toBe('Test Group');
        });
    });

    // =========================================================================
    // Query Invalidation Tests
    // =========================================================================

    describe('query invalidation', () => {
        it('invalidates queries on success', async () => {
            const queryClient = new QueryClient({
                defaultOptions: {
                    queries: { retry: false },
                    mutations: { retry: false },
                },
            });

            const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

            mockUpdateGroup.mockResolvedValue(undefined);

            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapperWithQueryClient(queryClient) }
            );

            await act(async () => {
                await result.current.mutateAsync({
                    groupId: 'group-123',
                    name: 'New Name',
                });
            });

            expect(invalidateQueriesSpy).toHaveBeenCalledWith({
                queryKey: QUERY_KEYS.groups.all(),
            });
        });
    });

    // =========================================================================
    // State Tests
    // =========================================================================

    describe('mutation state', () => {
        it('returns isPending during mutation', async () => {
            mockUpdateGroup.mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 100))
            );

            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.isPending).toBe(false);

            act(() => {
                result.current.mutate({
                    groupId: 'group-123',
                    name: 'New Name',
                });
            });

            await waitFor(() => {
                expect(result.current.isPending).toBe(true);
            });

            await waitFor(() => {
                expect(result.current.isPending).toBe(false);
            });
        });

        it('returns error on failure', async () => {
            mockUpdateGroup.mockRejectedValue(new Error('Update failed'));

            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            act(() => {
                result.current.mutate({
                    groupId: 'group-123',
                    name: 'New Name',
                });
            });

            await waitFor(() => {
                expect(result.current.error?.message).toBe('Update failed');
            });
        });

        it('returns isSuccess on successful mutation', async () => {
            mockUpdateGroup.mockResolvedValue(undefined);

            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            act(() => {
                result.current.mutate({
                    groupId: 'group-123',
                    name: 'New Name',
                });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });

        it('provides reset function to clear mutation state', async () => {
            mockUpdateGroup.mockResolvedValue(undefined);

            const { result } = renderHook(
                () => useUpdateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            act(() => {
                result.current.mutate({
                    groupId: 'group-123',
                    name: 'New Name',
                });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            act(() => {
                result.current.reset();
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(false);
            });
        });
    });
});
