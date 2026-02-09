/**
 * useGroupMutations Hook Tests
 *
 * Story TD-CONSOLIDATED-12: React Query Cache Staleness
 *
 * Tests for 6 mutation hooks with optimistic updates, rollback, and invalidation:
 * - useDeleteGroup
 * - useLeaveGroup
 * - useTransferOwnership
 * - useAcceptInvitation
 * - useDeclineInvitation
 * - useToggleTransactionSharing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import { QUERY_KEYS } from '../../../src/lib/queryKeys';
import { createMockGroup, createMockInvitation } from '@helpers/sharedGroupFactory';

// =============================================================================
// Mocks
// =============================================================================

const mockDeleteGroupAsOwner = vi.fn();
const mockLeaveGroup = vi.fn();
const mockTransferOwnership = vi.fn();
const mockHandleAcceptInvitationService = vi.fn();
const mockHandleDeclineInvitationService = vi.fn();
const mockUpdateTransactionSharingEnabled = vi.fn();

vi.mock('../../../src/features/shared-groups/services/groupDeletionService', () => ({
    deleteGroupAsOwner: (...args: unknown[]) => mockDeleteGroupAsOwner(...args),
}));

vi.mock('../../../src/features/shared-groups/services/groupMemberService', () => ({
    leaveGroup: (...args: unknown[]) => mockLeaveGroup(...args),
    transferOwnership: (...args: unknown[]) => mockTransferOwnership(...args),
}));

vi.mock('../../../src/features/shared-groups/services/invitationHandlers', () => ({
    handleAcceptInvitationService: (...args: unknown[]) => mockHandleAcceptInvitationService(...args),
    handleDeclineInvitationService: (...args: unknown[]) => mockHandleDeclineInvitationService(...args),
}));

vi.mock('../../../src/features/shared-groups/services/groupService', () => ({
    updateTransactionSharingEnabled: (...args: unknown[]) => mockUpdateTransactionSharingEnabled(...args),
}));

vi.mock('../../../src/config/constants', () => ({
    APP_ID: 'boletapp',
}));

// Import after mocking
import {
    useDeleteGroup,
    useLeaveGroup,
    useTransferOwnership,
    useAcceptInvitation,
    useDeclineInvitation,
    useToggleTransactionSharing,
} from '../../../src/features/shared-groups/hooks/useGroupMutations';

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
        db: {} as ReturnType<typeof vi.fn>,
        appId: 'boletapp',
        auth: {} as ReturnType<typeof vi.fn>,
        storage: {} as ReturnType<typeof vi.fn>,
        functions: {} as ReturnType<typeof vi.fn>,
    };
}

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
}

function createWrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
        );
    };
}

// =============================================================================
// Shared Setup
// =============================================================================

const mockUser = createMockUser();
const mockServices = createMockServices();

const mockGroups = [
    createMockGroup({ id: 'group-1', name: 'Family', ownerId: 'user-123', transactionSharingEnabled: true }),
    createMockGroup({ id: 'group-2', name: 'Work', ownerId: 'user-456', transactionSharingEnabled: false }),
    createMockGroup({ id: 'group-3', name: 'Friends', ownerId: 'user-123', transactionSharingEnabled: true }),
];

const mockInvitations = [
    createMockInvitation({ id: 'inv-1', groupName: 'New Group 1' }),
    createMockInvitation({ id: 'inv-2', groupName: 'New Group 2' }),
];

beforeEach(() => {
    vi.resetAllMocks();
    mockDeleteGroupAsOwner.mockResolvedValue(undefined);
    mockLeaveGroup.mockResolvedValue(undefined);
    mockTransferOwnership.mockResolvedValue(undefined);
    mockHandleAcceptInvitationService.mockResolvedValue(undefined);
    mockHandleDeclineInvitationService.mockResolvedValue(undefined);
    mockUpdateTransactionSharingEnabled.mockResolvedValue(undefined);
});

// =============================================================================
// useDeleteGroup
// =============================================================================

describe('useDeleteGroup', () => {
    it('optimistically removes group from list and decrements count', async () => {
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(QUERY_KEYS.groups.list('user-123'), [...mockGroups]);
        queryClient.setQueryData(QUERY_KEYS.groups.count('user-123'), 3);

        const { result } = renderHook(
            () => useDeleteGroup(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ groupId: 'group-1' });
        });

        await waitFor(() => {
            const groups = queryClient.getQueryData<typeof mockGroups>(
                QUERY_KEYS.groups.list('user-123')
            );
            expect(groups).toHaveLength(2);
            expect(groups?.find(g => g.id === 'group-1')).toBeUndefined();
        });

        const count = queryClient.getQueryData<number>(QUERY_KEYS.groups.count('user-123'));
        expect(count).toBe(2);
    });

    it('rolls back on error', async () => {
        mockDeleteGroupAsOwner.mockRejectedValueOnce(new Error('Delete failed'));
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(QUERY_KEYS.groups.list('user-123'), [...mockGroups]);
        queryClient.setQueryData(QUERY_KEYS.groups.count('user-123'), 3);

        const { result } = renderHook(
            () => useDeleteGroup(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ groupId: 'group-1' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        const groups = queryClient.getQueryData<typeof mockGroups>(
            QUERY_KEYS.groups.list('user-123')
        );
        expect(groups).toHaveLength(3);

        const count = queryClient.getQueryData<number>(QUERY_KEYS.groups.count('user-123'));
        expect(count).toBe(3);
    });

    it('calls deleteGroupAsOwner with correct arguments', async () => {
        const queryClient = createTestQueryClient();
        const { result } = renderHook(
            () => useDeleteGroup(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            await result.current.mutateAsync({ groupId: 'group-1' });
        });

        expect(mockDeleteGroupAsOwner).toHaveBeenCalledWith(
            mockServices.db, 'user-123', 'group-1', 'boletapp'
        );
    });
});

// =============================================================================
// useLeaveGroup
// =============================================================================

describe('useLeaveGroup', () => {
    it('optimistically removes group from list and decrements count', async () => {
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(QUERY_KEYS.groups.list('user-123'), [...mockGroups]);
        queryClient.setQueryData(QUERY_KEYS.groups.count('user-123'), 3);

        const { result } = renderHook(
            () => useLeaveGroup(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ groupId: 'group-2' });
        });

        await waitFor(() => {
            const groups = queryClient.getQueryData<typeof mockGroups>(
                QUERY_KEYS.groups.list('user-123')
            );
            expect(groups).toHaveLength(2);
            expect(groups?.find(g => g.id === 'group-2')).toBeUndefined();
        });

        const count = queryClient.getQueryData<number>(QUERY_KEYS.groups.count('user-123'));
        expect(count).toBe(2);
    });

    it('rolls back on error', async () => {
        mockLeaveGroup.mockRejectedValueOnce(new Error('Leave failed'));
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(QUERY_KEYS.groups.list('user-123'), [...mockGroups]);
        queryClient.setQueryData(QUERY_KEYS.groups.count('user-123'), 3);

        const { result } = renderHook(
            () => useLeaveGroup(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ groupId: 'group-2' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        const groups = queryClient.getQueryData<typeof mockGroups>(
            QUERY_KEYS.groups.list('user-123')
        );
        expect(groups).toHaveLength(3);
    });

    it('calls leaveGroup with correct arguments', async () => {
        const queryClient = createTestQueryClient();
        const { result } = renderHook(
            () => useLeaveGroup(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            await result.current.mutateAsync({ groupId: 'group-2' });
        });

        expect(mockLeaveGroup).toHaveBeenCalledWith(
            mockServices.db, 'user-123', 'group-2'
        );
    });
});

// =============================================================================
// useTransferOwnership
// =============================================================================

describe('useTransferOwnership', () => {
    it('optimistically updates ownerId', async () => {
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(QUERY_KEYS.groups.list('user-123'), [...mockGroups]);

        const { result } = renderHook(
            () => useTransferOwnership(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ groupId: 'group-1', newOwnerId: 'user-789' });
        });

        await waitFor(() => {
            const groups = queryClient.getQueryData<typeof mockGroups>(
                QUERY_KEYS.groups.list('user-123')
            );
            const updated = groups?.find(g => g.id === 'group-1');
            expect(updated?.ownerId).toBe('user-789');
        });
    });

    it('rolls back on error', async () => {
        mockTransferOwnership.mockRejectedValueOnce(new Error('Transfer failed'));
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(QUERY_KEYS.groups.list('user-123'), [...mockGroups]);

        const { result } = renderHook(
            () => useTransferOwnership(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ groupId: 'group-1', newOwnerId: 'user-789' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        const groups = queryClient.getQueryData<typeof mockGroups>(
            QUERY_KEYS.groups.list('user-123')
        );
        const group = groups?.find(g => g.id === 'group-1');
        expect(group?.ownerId).toBe('user-123');
    });

    it('calls transferOwnership with correct arguments', async () => {
        const queryClient = createTestQueryClient();
        const { result } = renderHook(
            () => useTransferOwnership(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            await result.current.mutateAsync({ groupId: 'group-1', newOwnerId: 'user-789' });
        });

        expect(mockTransferOwnership).toHaveBeenCalledWith(
            mockServices.db, 'user-123', 'user-789', 'group-1'
        );
    });
});

// =============================================================================
// useAcceptInvitation
// =============================================================================

describe('useAcceptInvitation', () => {
    it('invalidates groups and invitations on settle', async () => {
        const queryClient = createTestQueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(
            () => useAcceptInvitation(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            await result.current.mutateAsync({
                invitation: mockInvitations[0],
                shareMyTransactions: true,
            });
        });

        expect(invalidateSpy).toHaveBeenCalledWith(
            expect.objectContaining({ queryKey: QUERY_KEYS.groups.all() })
        );
        expect(invalidateSpy).toHaveBeenCalledWith(
            expect.objectContaining({ queryKey: QUERY_KEYS.pendingInvitations.all() })
        );
    });

    it('rolls back invitations on error', async () => {
        mockHandleAcceptInvitationService.mockRejectedValueOnce(new Error('Accept failed'));
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(
            QUERY_KEYS.pendingInvitations.byEmail('test@example.com'),
            [...mockInvitations]
        );

        const { result } = renderHook(
            () => useAcceptInvitation(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ invitation: mockInvitations[0] });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        const invitations = queryClient.getQueryData(
            QUERY_KEYS.pendingInvitations.byEmail('test@example.com')
        );
        expect(invitations).toHaveLength(2);
    });

    it('passes shareMyTransactions to service', async () => {
        const queryClient = createTestQueryClient();
        const { result } = renderHook(
            () => useAcceptInvitation(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            await result.current.mutateAsync({
                invitation: mockInvitations[0],
                shareMyTransactions: true,
            });
        });

        expect(mockHandleAcceptInvitationService).toHaveBeenCalledWith(
            mockServices.db,
            mockInvitations[0],
            'user-123',
            expect.objectContaining({ email: 'test@example.com' }),
            'boletapp',
            true
        );
    });
});

// =============================================================================
// useDeclineInvitation
// =============================================================================

describe('useDeclineInvitation', () => {
    it('optimistically removes invitation from list', async () => {
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(
            QUERY_KEYS.pendingInvitations.byEmail('test@example.com'),
            [...mockInvitations]
        );

        const { result } = renderHook(
            () => useDeclineInvitation(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ invitation: mockInvitations[0] });
        });

        await waitFor(() => {
            const invitations = queryClient.getQueryData<typeof mockInvitations>(
                QUERY_KEYS.pendingInvitations.byEmail('test@example.com')
            );
            expect(invitations).toHaveLength(1);
            expect(invitations?.find(inv => inv.id === 'inv-1')).toBeUndefined();
        });
    });

    it('rolls back on error', async () => {
        mockHandleDeclineInvitationService.mockRejectedValueOnce(new Error('Decline failed'));
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(
            QUERY_KEYS.pendingInvitations.byEmail('test@example.com'),
            [...mockInvitations]
        );

        const { result } = renderHook(
            () => useDeclineInvitation(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ invitation: mockInvitations[0] });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        const invitations = queryClient.getQueryData<typeof mockInvitations>(
            QUERY_KEYS.pendingInvitations.byEmail('test@example.com')
        );
        expect(invitations).toHaveLength(2);
    });

    it('invalidates pendingInvitations on settle', async () => {
        const queryClient = createTestQueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(
            () => useDeclineInvitation(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            await result.current.mutateAsync({ invitation: mockInvitations[0] });
        });

        expect(invalidateSpy).toHaveBeenCalledWith(
            expect.objectContaining({ queryKey: QUERY_KEYS.pendingInvitations.all() })
        );
    });
});

// =============================================================================
// useToggleTransactionSharing
// =============================================================================

describe('useToggleTransactionSharing', () => {
    it('optimistically toggles sharing state', async () => {
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(QUERY_KEYS.groups.list('user-123'), [...mockGroups]);

        const { result } = renderHook(
            () => useToggleTransactionSharing(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ groupId: 'group-1', enabled: false });
        });

        await waitFor(() => {
            const groups = queryClient.getQueryData<typeof mockGroups>(
                QUERY_KEYS.groups.list('user-123')
            );
            const updated = groups?.find(g => g.id === 'group-1');
            expect(updated?.transactionSharingEnabled).toBe(false);
        });
    });

    it('rolls back on error', async () => {
        mockUpdateTransactionSharingEnabled.mockRejectedValueOnce(new Error('Toggle failed'));
        const queryClient = createTestQueryClient();
        queryClient.setQueryData(QUERY_KEYS.groups.list('user-123'), [...mockGroups]);

        const { result } = renderHook(
            () => useToggleTransactionSharing(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            result.current.mutate({ groupId: 'group-1', enabled: false });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        const groups = queryClient.getQueryData<typeof mockGroups>(
            QUERY_KEYS.groups.list('user-123')
        );
        const group = groups?.find(g => g.id === 'group-1');
        expect(group?.transactionSharingEnabled).toBe(true);
    });

    it('calls updateTransactionSharingEnabled with correct arguments', async () => {
        const queryClient = createTestQueryClient();
        const { result } = renderHook(
            () => useToggleTransactionSharing(mockUser, mockServices),
            { wrapper: createWrapper(queryClient) }
        );

        await act(async () => {
            await result.current.mutateAsync({ groupId: 'group-1', enabled: false });
        });

        expect(mockUpdateTransactionSharingEnabled).toHaveBeenCalledWith(
            mockServices.db, 'group-1', 'user-123', false
        );
    });
});
