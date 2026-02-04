/**
 * useGroups Hook Tests
 *
 * Story 14d-v2-1-4b: Service & Hook Layer
 *
 * Tests for React Query hooks for shared group operations:
 * - useGroups (AC #2: fetch user's groups)
 * - useGroupCount (AC #3: count for BC-1 check)
 * - useCreateGroup (AC #4: mutation with cache invalidation)
 * - useCanCreateGroup (helper hook)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import type { SharedGroup } from '../../../src/types/sharedGroup';

// =============================================================================
// Mocks
// =============================================================================

// Mock the groupService module
const mockGetUserGroups = vi.fn();
const mockGetGroupCount = vi.fn();
const mockCreateGroup = vi.fn();

vi.mock('../../../src/features/shared-groups/services/groupService', () => ({
    getUserGroups: (...args: unknown[]) => mockGetUserGroups(...args),
    getGroupCount: (...args: unknown[]) => mockGetGroupCount(...args),
    createGroup: (...args: unknown[]) => mockCreateGroup(...args),
    getDeviceTimezone: () => 'America/Santiago',
}));

// Import after mocking
import {
    useGroups,
    useGroupCount,
    useCreateGroup,
    useCanCreateGroup,
} from '../../../src/features/shared-groups/hooks/useGroups';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockUser(overrides: Partial<User> = {}): User {
    return {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: vi.fn(),
        getIdToken: vi.fn(),
        getIdTokenResult: vi.fn(),
        reload: vi.fn(),
        toJSON: vi.fn(),
        phoneNumber: null,
        providerId: 'firebase',
        ...overrides,
    } as User;
}

function createMockServices() {
    return {
        db: {} as any,
        appId: 'boletapp',
        auth: {} as any,
        storage: {} as any,
        functions: {} as any,
    };
}

function createMockGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
    return {
        id: `group-${Math.random().toString(36).slice(2, 9)}`,
        name: 'Test Group',
        ownerId: 'user-123',
        appId: 'boletapp',
        color: '#10b981',
        shareCode: 'MockShareCode12345',
        shareCodeExpiresAt: { toDate: () => new Date() } as any,
        members: ['user-123'],
        memberUpdates: {},
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
        timezone: 'America/Santiago',
        transactionSharingEnabled: true,
        transactionSharingLastToggleAt: null,
        transactionSharingToggleCountToday: 0,
        ...overrides,
    };
}

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a wrapper with QueryClientProvider for testing hooks.
 */
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
        );
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('useGroups hook', () => {
    const mockUser = createMockUser();
    const mockServices = createMockServices();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // =========================================================================
    // useGroups Tests (AC #2)
    // =========================================================================
    describe('useGroups', () => {
        it('returns loading state initially', async () => {
            mockGetUserGroups.mockResolvedValue([]);

            const { result } = renderHook(
                () => useGroups(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.isLoading).toBe(true);
            expect(result.current.data).toBeUndefined();
        });

        it('returns groups data after fetch (AC #2)', async () => {
            const mockGroups = [
                createMockGroup({ id: 'group-1', name: 'Family' }),
                createMockGroup({ id: 'group-2', name: 'Work' }),
            ];
            mockGetUserGroups.mockResolvedValue(mockGroups);

            const { result } = renderHook(
                () => useGroups(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toHaveLength(2);
            expect(result.current.data?.[0].name).toBe('Family');
            expect(result.current.data?.[1].name).toBe('Work');
        });

        it('calls getUserGroups with correct parameters', async () => {
            mockGetUserGroups.mockResolvedValue([]);

            renderHook(
                () => useGroups(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(mockGetUserGroups).toHaveBeenCalled();
            });

            expect(mockGetUserGroups).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid
            );
        });

        it('returns empty array when user has no groups (AC #2)', async () => {
            mockGetUserGroups.mockResolvedValue([]);

            const { result } = renderHook(
                () => useGroups(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual([]);
        });

        it('does not fetch when user is null', async () => {
            const { result } = renderHook(
                () => useGroups(null, mockServices),
                { wrapper: createWrapper() }
            );

            // Should not be loading since query is disabled
            expect(result.current.isLoading).toBe(false);
            expect(result.current.data).toBeUndefined();
            expect(mockGetUserGroups).not.toHaveBeenCalled();
        });

        it('does not fetch when services is null', async () => {
            const { result } = renderHook(
                () => useGroups(mockUser, null),
                { wrapper: createWrapper() }
            );

            expect(result.current.isLoading).toBe(false);
            expect(result.current.data).toBeUndefined();
            expect(mockGetUserGroups).not.toHaveBeenCalled();
        });

        it('returns error when fetch fails', async () => {
            const error = new Error('Network error');
            mockGetUserGroups.mockRejectedValue(error);

            const { result } = renderHook(
                () => useGroups(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            expect(result.current.error?.message).toBe('Network error');
        });
    });

    // =========================================================================
    // useGroupCount Tests (AC #3)
    // =========================================================================
    describe('useGroupCount', () => {
        it('returns group count (AC #3)', async () => {
            mockGetGroupCount.mockResolvedValue(3);

            const { result } = renderHook(
                () => useGroupCount(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toBe(3);
        });

        it('returns 0 when user has no groups (AC #3)', async () => {
            mockGetGroupCount.mockResolvedValue(0);

            const { result } = renderHook(
                () => useGroupCount(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toBe(0);
        });

        it('calls getGroupCount with correct parameters', async () => {
            mockGetGroupCount.mockResolvedValue(0);

            renderHook(
                () => useGroupCount(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(mockGetGroupCount).toHaveBeenCalled();
            });

            expect(mockGetGroupCount).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid
            );
        });

        it('does not fetch when user is null', async () => {
            const { result } = renderHook(
                () => useGroupCount(null, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.isLoading).toBe(false);
            expect(mockGetGroupCount).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // useCreateGroup Tests (AC #4)
    // =========================================================================
    describe('useCreateGroup', () => {
        it('creates a group when mutate is called (AC #4)', async () => {
            const createdGroup = createMockGroup({ id: 'new-group', name: 'New Family' });
            mockCreateGroup.mockResolvedValue(createdGroup);

            const { result } = renderHook(
                () => useCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await act(async () => {
                result.current.mutate({
                    name: 'New Family',
                    transactionSharingEnabled: true,
                });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.name).toBe('New Family');
        });

        it('passes correct parameters to createGroup service', async () => {
            mockCreateGroup.mockResolvedValue(createMockGroup());

            const { result } = renderHook(
                () => useCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await act(async () => {
                result.current.mutate({
                    name: 'Test Group',
                    transactionSharingEnabled: true,
                    color: '#ff0000',
                    icon: '🏠',
                });
            });

            await waitFor(() => {
                expect(mockCreateGroup).toHaveBeenCalled();
            });

            expect(mockCreateGroup).toHaveBeenCalledWith(
                mockServices.db,
                mockUser.uid,
                mockServices.appId,
                expect.objectContaining({
                    name: 'Test Group',
                    transactionSharingEnabled: true,
                    color: '#ff0000',
                    icon: '🏠',
                }),
                expect.objectContaining({
                    displayName: mockUser.displayName,
                    email: mockUser.email,
                })
            );
        });

        it('sets isPending during mutation', async () => {
            let resolveCreate: (value: SharedGroup) => void;
            const createPromise = new Promise<SharedGroup>(resolve => {
                resolveCreate = resolve;
            });
            mockCreateGroup.mockReturnValue(createPromise);

            const { result } = renderHook(
                () => useCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.isPending).toBe(false);

            act(() => {
                result.current.mutate({
                    name: 'Test',
                    transactionSharingEnabled: true,
                });
            });

            await waitFor(() => {
                expect(result.current.isPending).toBe(true);
            });

            // Resolve the promise
            act(() => {
                resolveCreate!(createMockGroup());
            });

            await waitFor(() => {
                expect(result.current.isPending).toBe(false);
            });
        });

        it('returns error when mutation fails', async () => {
            const error = new Error('Create failed');
            mockCreateGroup.mockRejectedValue(error);

            const { result } = renderHook(
                () => useCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await act(async () => {
                result.current.mutate({
                    name: 'Test',
                    transactionSharingEnabled: true,
                });
            });

            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            expect(result.current.error?.message).toBe('Create failed');
        });

        it('throws error when user is null', async () => {
            const { result } = renderHook(
                () => useCreateGroup(null, mockServices),
                { wrapper: createWrapper() }
            );

            await act(async () => {
                result.current.mutate({
                    name: 'Test',
                    transactionSharingEnabled: true,
                });
            });

            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            expect(result.current.error?.message).toContain('authenticated');
        });

        it('resets mutation state when reset is called', async () => {
            const error = new Error('Create failed');
            mockCreateGroup.mockRejectedValue(error);

            const { result } = renderHook(
                () => useCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await act(async () => {
                result.current.mutate({
                    name: 'Test',
                    transactionSharingEnabled: true,
                });
            });

            await waitFor(() => {
                expect(result.current.error).not.toBeNull();
            });

            act(() => {
                result.current.reset();
            });

            await waitFor(() => {
                expect(result.current.error).toBeNull();
            });
            expect(result.current.isSuccess).toBe(false);
        });

        // =========================================================================
        // Optimistic Updates Tests (AC #4 - Task 2.4)
        // =========================================================================
        describe('optimistic updates', () => {
            it('shows optimistic group in cache immediately before server responds', async () => {
                let resolveCreate: (value: SharedGroup) => void;
                const createPromise = new Promise<SharedGroup>(resolve => {
                    resolveCreate = resolve;
                });
                mockCreateGroup.mockReturnValue(createPromise);
                mockGetUserGroups.mockResolvedValue([]);
                mockGetGroupCount.mockResolvedValue(0);

                const queryClient = new QueryClient({
                    defaultOptions: {
                        queries: { retry: false, gcTime: 0 },
                        mutations: { retry: false },
                    },
                });

                const wrapper = ({ children }: { children: React.ReactNode }) =>
                    React.createElement(QueryClientProvider, { client: queryClient }, children);

                // Pre-populate the groups list cache
                const { result: groupsResult } = renderHook(
                    () => useGroups(mockUser, mockServices),
                    { wrapper }
                );

                await waitFor(() => {
                    expect(groupsResult.current.isLoading).toBe(false);
                });
                expect(groupsResult.current.data).toHaveLength(0);

                // Now create a group - should optimistically add to cache
                const { result: createResult } = renderHook(
                    () => useCreateGroup(mockUser, mockServices),
                    { wrapper }
                );

                act(() => {
                    createResult.current.mutate({
                        name: 'Optimistic Group',
                        transactionSharingEnabled: true,
                    });
                });

                // The optimistic group should appear in cache while mutation is pending
                await waitFor(() => {
                    expect(createResult.current.isPending).toBe(true);
                });

                // Check cache was updated optimistically
                const cachedGroups = queryClient.getQueryData<SharedGroup[]>(['groups', 'list', mockUser.uid]);
                expect(cachedGroups).toHaveLength(1);
                expect(cachedGroups?.[0].name).toBe('Optimistic Group');
                expect(cachedGroups?.[0].id).toContain('temp-'); // Temporary ID

                // Now resolve the mutation
                act(() => {
                    resolveCreate!(createMockGroup({ id: 'real-id', name: 'Optimistic Group' }));
                });

                await waitFor(() => {
                    expect(createResult.current.isPending).toBe(false);
                });
            });

            it('rolls back cache on mutation error', async () => {
                mockCreateGroup.mockRejectedValue(new Error('Create failed'));
                mockGetUserGroups.mockResolvedValue([createMockGroup({ id: 'existing', name: 'Existing Group' })]);
                mockGetGroupCount.mockResolvedValue(1);

                const queryClient = new QueryClient({
                    defaultOptions: {
                        queries: { retry: false, gcTime: 0 },
                        mutations: { retry: false },
                    },
                });

                const wrapper = ({ children }: { children: React.ReactNode }) =>
                    React.createElement(QueryClientProvider, { client: queryClient }, children);

                // Pre-populate the groups list cache
                const { result: groupsResult } = renderHook(
                    () => useGroups(mockUser, mockServices),
                    { wrapper }
                );

                await waitFor(() => {
                    expect(groupsResult.current.isLoading).toBe(false);
                });
                expect(groupsResult.current.data).toHaveLength(1);

                // Create a group that will fail
                const { result: createResult } = renderHook(
                    () => useCreateGroup(mockUser, mockServices),
                    { wrapper }
                );

                await act(async () => {
                    createResult.current.mutate({
                        name: 'Will Fail',
                        transactionSharingEnabled: true,
                    });
                });

                await waitFor(() => {
                    expect(createResult.current.error).not.toBeNull();
                });

                // After error, cache should be rolled back - invalidateQueries will refetch
                // The cache will eventually be restored via the onSettled invalidation
                expect(createResult.current.error?.message).toBe('Create failed');
            });

            it('invalidates queries after successful mutation', async () => {
                const createdGroup = createMockGroup({ id: 'new-group', name: 'New Group' });
                mockCreateGroup.mockResolvedValue(createdGroup);
                mockGetUserGroups.mockResolvedValue([]);
                mockGetGroupCount.mockResolvedValue(0);

                const queryClient = new QueryClient({
                    defaultOptions: {
                        queries: { retry: false, gcTime: 0 },
                        mutations: { retry: false },
                    },
                });

                // Spy on invalidateQueries
                const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

                const wrapper = ({ children }: { children: React.ReactNode }) =>
                    React.createElement(QueryClientProvider, { client: queryClient }, children);

                const { result } = renderHook(
                    () => useCreateGroup(mockUser, mockServices),
                    { wrapper }
                );

                await act(async () => {
                    result.current.mutate({
                        name: 'New Group',
                        transactionSharingEnabled: true,
                    });
                });

                await waitFor(() => {
                    expect(result.current.isSuccess).toBe(true);
                });

                // Verify invalidateQueries was called with the groups key
                expect(invalidateSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        queryKey: ['groups'],
                    })
                );
            });
        });
    });

    // =========================================================================
    // useCanCreateGroup Tests (BC-1 helper)
    // =========================================================================
    describe('useCanCreateGroup', () => {
        it('returns true when user has less than max groups', async () => {
            mockGetGroupCount.mockResolvedValue(5);

            const { result } = renderHook(
                () => useCanCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.canCreate).toBe(true);
        });

        it('returns false when user has reached max groups', async () => {
            mockGetGroupCount.mockResolvedValue(10); // MAX_MEMBER_OF_GROUPS

            const { result } = renderHook(
                () => useCanCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.canCreate).toBe(false);
        });

        it('returns false when user exceeds max groups', async () => {
            mockGetGroupCount.mockResolvedValue(15);

            const { result } = renderHook(
                () => useCanCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.canCreate).toBe(false);
        });

        it('returns canCreate false when count is undefined (loading)', () => {
            // Never resolve the count query
            mockGetGroupCount.mockImplementation(() => new Promise(() => {}));

            const { result } = renderHook(
                () => useCanCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            expect(result.current.canCreate).toBe(false);
            expect(result.current.isLoading).toBe(true);
        });

        it('returns canCreate true when user has 0 groups', async () => {
            mockGetGroupCount.mockResolvedValue(0);

            const { result } = renderHook(
                () => useCanCreateGroup(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.canCreate).toBe(true);
        });
    });

    // =========================================================================
    // Integration Scenarios
    // =========================================================================
    describe('integration scenarios', () => {
        it('useGroups refetches when refetch is called', async () => {
            mockGetUserGroups
                .mockResolvedValueOnce([createMockGroup({ name: 'Initial' })])
                .mockResolvedValueOnce([
                    createMockGroup({ name: 'Initial' }),
                    createMockGroup({ name: 'New' }),
                ]);

            const { result } = renderHook(
                () => useGroups(mockUser, mockServices),
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(result.current.data).toHaveLength(1);
            });

            await act(async () => {
                result.current.refetch();
            });

            await waitFor(() => {
                expect(result.current.data).toHaveLength(2);
            });
        });
    });
});
