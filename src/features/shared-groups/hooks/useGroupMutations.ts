/**
 * useGroupMutations - React Query mutation hooks for group operations
 *
 * Story TD-CONSOLIDATED-12: React Query Cache Staleness
 *
 * Provides 6 mutation hooks with optimistic updates, rollback on error,
 * and proper cache invalidation. Follows the same pattern as useCreateGroup
 * and useUpdateGroup in useGroups.ts.
 *
 * Each hook implements the onMutate/onError/onSettled lifecycle:
 * - onMutate: Cancel in-flight queries, snapshot previous state, apply optimistic update
 * - onError: Restore previous state from snapshot
 * - onSettled: Invalidate queries to ensure fresh data
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import type { Services } from '@/hooks/useAuth';
import type { SharedGroup, PendingInvitation, MemberProfile } from '@/types/sharedGroup';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { deleteGroupAsOwner } from '../services/groupDeletionService';
import { leaveGroup, transferOwnership } from '../services/groupMemberService';
import {
    handleAcceptInvitationService,
    handleDeclineInvitationService,
} from '../services/invitationHandlers';
import { updateTransactionSharingEnabled } from '../services/groupService';
import { APP_ID } from '@/config/constants';

// =============================================================================
// Types
// =============================================================================

interface GroupsRollbackContext {
    previousGroups: SharedGroup[] | undefined;
    previousCount: number | undefined;
}

interface InvitationsRollbackContext {
    previousInvitations: PendingInvitation[] | undefined;
}

// =============================================================================
// useDeleteGroup
// =============================================================================

export function useDeleteGroup(user: User | null, services: Services | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { groupId: string }) => {
            if (!user || !services) throw new Error('User must be authenticated');
            await deleteGroupAsOwner(services.db, user.uid, input.groupId, APP_ID);
        },

        onMutate: async (input): Promise<GroupsRollbackContext> => {
            if (!user) return { previousGroups: undefined, previousCount: undefined };

            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.all() });

            const previousGroups = queryClient.getQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid)
            );
            const previousCount = queryClient.getQueryData<number>(
                QUERY_KEYS.groups.count(user.uid)
            );

            queryClient.setQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid),
                (old) => old ? old.filter(g => g.id !== input.groupId) : old
            );
            queryClient.setQueryData<number>(
                QUERY_KEYS.groups.count(user.uid),
                (old) => old !== undefined ? Math.max(0, old - 1) : old
            );

            return { previousGroups, previousCount };
        },

        onError: (_err, _input, context) => {
            if (!user || !context) return;
            if (context.previousGroups !== undefined) {
                queryClient.setQueryData(QUERY_KEYS.groups.list(user.uid), context.previousGroups);
            }
            if (context.previousCount !== undefined) {
                queryClient.setQueryData(QUERY_KEYS.groups.count(user.uid), context.previousCount);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all() });
        },
    });
}

// =============================================================================
// useLeaveGroup
// =============================================================================

export function useLeaveGroup(user: User | null, services: Services | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { groupId: string }) => {
            if (!user || !services) throw new Error('User must be authenticated');
            await leaveGroup(services.db, user.uid, input.groupId);
        },

        onMutate: async (input): Promise<GroupsRollbackContext> => {
            if (!user) return { previousGroups: undefined, previousCount: undefined };

            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.all() });

            const previousGroups = queryClient.getQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid)
            );
            const previousCount = queryClient.getQueryData<number>(
                QUERY_KEYS.groups.count(user.uid)
            );

            queryClient.setQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid),
                (old) => old ? old.filter(g => g.id !== input.groupId) : old
            );
            queryClient.setQueryData<number>(
                QUERY_KEYS.groups.count(user.uid),
                (old) => old !== undefined ? Math.max(0, old - 1) : old
            );

            return { previousGroups, previousCount };
        },

        onError: (_err, _input, context) => {
            if (!user || !context) return;
            if (context.previousGroups !== undefined) {
                queryClient.setQueryData(QUERY_KEYS.groups.list(user.uid), context.previousGroups);
            }
            if (context.previousCount !== undefined) {
                queryClient.setQueryData(QUERY_KEYS.groups.count(user.uid), context.previousCount);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all() });
        },
    });
}

// =============================================================================
// useTransferOwnership
// =============================================================================

export function useTransferOwnership(user: User | null, services: Services | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { groupId: string; newOwnerId: string }) => {
            if (!user || !services) throw new Error('User must be authenticated');
            await transferOwnership(services.db, user.uid, input.newOwnerId, input.groupId);
        },

        onMutate: async (input): Promise<Pick<GroupsRollbackContext, 'previousGroups'>> => {
            if (!user) return { previousGroups: undefined };

            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.all() });

            const previousGroups = queryClient.getQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid)
            );

            queryClient.setQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid),
                (old) => old?.map(g =>
                    g.id === input.groupId ? { ...g, ownerId: input.newOwnerId } : g
                )
            );

            return { previousGroups };
        },

        onError: (_err, _input, context) => {
            if (!user || !context) return;
            if (context.previousGroups !== undefined) {
                queryClient.setQueryData(QUERY_KEYS.groups.list(user.uid), context.previousGroups);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all() });
        },
    });
}

// =============================================================================
// useAcceptInvitation
// =============================================================================

export function useAcceptInvitation(user: User | null, services: Services | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            invitation: PendingInvitation;
            shareMyTransactions?: boolean;
        }) => {
            if (!user || !services) throw new Error('User must be authenticated');
            const userProfile: MemberProfile = {
                displayName: user.displayName || undefined,
                email: user.email || undefined,
                photoURL: user.photoURL || undefined,
            };
            await handleAcceptInvitationService(
                services.db, input.invitation, user.uid,
                userProfile, APP_ID, input.shareMyTransactions ?? false
            );
        },

        onMutate: async (): Promise<InvitationsRollbackContext> => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.all() });
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.pendingInvitations.all() });

            const previousInvitations = user?.email
                ? queryClient.getQueryData<PendingInvitation[]>(
                    QUERY_KEYS.pendingInvitations.byEmail(user.email)
                )
                : undefined;

            return { previousInvitations };
        },

        onError: (_err, _input, context) => {
            if (!user?.email || !context) return;
            if (context.previousInvitations !== undefined) {
                queryClient.setQueryData(
                    QUERY_KEYS.pendingInvitations.byEmail(user.email),
                    context.previousInvitations
                );
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all() });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingInvitations.all() });
        },
    });
}

// =============================================================================
// useDeclineInvitation
// =============================================================================

export function useDeclineInvitation(user: User | null, services: Services | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { invitation: PendingInvitation }) => {
            if (!user || !services) throw new Error('User must be authenticated');
            await handleDeclineInvitationService(services.db, input.invitation);
        },

        onMutate: async (input): Promise<InvitationsRollbackContext> => {
            if (!user?.email) return { previousInvitations: undefined };

            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.pendingInvitations.all() });

            const previousInvitations = queryClient.getQueryData<PendingInvitation[]>(
                QUERY_KEYS.pendingInvitations.byEmail(user.email)
            );

            queryClient.setQueryData<PendingInvitation[]>(
                QUERY_KEYS.pendingInvitations.byEmail(user.email),
                (old) => old ? old.filter(inv => inv.id !== input.invitation.id) : old
            );

            return { previousInvitations };
        },

        onError: (_err, _input, context) => {
            if (!user?.email || !context) return;
            if (context.previousInvitations !== undefined) {
                queryClient.setQueryData(
                    QUERY_KEYS.pendingInvitations.byEmail(user.email),
                    context.previousInvitations
                );
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingInvitations.all() });
        },
    });
}

// =============================================================================
// useToggleTransactionSharing
// =============================================================================

export function useToggleTransactionSharing(user: User | null, services: Services | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { groupId: string; enabled: boolean }) => {
            if (!user || !services) throw new Error('User must be authenticated');
            await updateTransactionSharingEnabled(services.db, input.groupId, user.uid, input.enabled);
        },

        onMutate: async (input): Promise<Pick<GroupsRollbackContext, 'previousGroups'>> => {
            if (!user) return { previousGroups: undefined };

            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.all() });

            const previousGroups = queryClient.getQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid)
            );

            queryClient.setQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid),
                (old) => old?.map(g =>
                    g.id === input.groupId ? { ...g, transactionSharingEnabled: input.enabled } : g
                )
            );

            return { previousGroups };
        },

        onError: (_err, _input, context) => {
            if (!user || !context) return;
            if (context.previousGroups !== undefined) {
                queryClient.setQueryData(QUERY_KEYS.groups.list(user.uid), context.previousGroups);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all() });
        },
    });
}
