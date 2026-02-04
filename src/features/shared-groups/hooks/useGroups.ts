/**
 * useGroups Hook
 *
 * Story 14d-v2-1-4b: Service & Hook Layer
 * Epic 14d-v2: Shared Groups v2
 *
 * React Query hooks for shared group operations:
 * - useGroups: Fetch user's groups
 * - useGroupCount: Get group count for BC-1 limit check
 * - useCreateGroup: Mutation to create a new group with optimistic updates
 *
 * Features:
 * - Automatic caching and background refresh
 * - Optimistic updates for immediate UI feedback with rollback on error
 * - Cache invalidation on mutations
 * - Type-safe interfaces
 *
 * Moved to src/features/shared-groups/hooks/ for FSD compliance.
 *
 * @example
 * ```tsx
 * // Fetch user's groups
 * const { data: groups, isLoading } = useGroups(user, services);
 *
 * // Check if user can create more groups
 * const { canCreate } = useCanCreateGroup(user, services);
 *
 * // Create a new group (with optimistic updates)
 * const { mutate: createGroup, isPending } = useCreateGroup(user, services);
 * createGroup({ name: '🏠 Home', transactionSharingEnabled: true });
 * ```
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import type { Services } from '@/hooks/useAuth';
import type { SharedGroup, CreateSharedGroupInput, MemberProfile } from '@/types/sharedGroup';
import { SHARED_GROUP_LIMITS } from '@/types/sharedGroup';
import { QUERY_KEYS } from '@/lib/queryKeys';
import {
    createGroup as createGroupService,
    getUserGroups,
    getGroupCount,
    getDeviceTimezone,
    updateGroup as updateGroupService,
} from '../services/groupService';

// =============================================================================
// Types
// =============================================================================

/**
 * Input for creating a new group via useCreateGroup mutation.
 */
export interface CreateGroupInput {
    /** Group name (may include emoji prefix) */
    name: string;
    /** Whether transaction sharing is enabled */
    transactionSharingEnabled: boolean;
    /** Optional group color (hex code) */
    color?: string;
    /** Optional emoji icon */
    icon?: string;
}

/**
 * Return type for useGroups hook.
 */
export interface UseGroupsResult {
    /** Array of groups the user belongs to */
    data: SharedGroup[] | undefined;
    /** Whether the query is loading */
    isLoading: boolean;
    /** Whether the query is fetching (includes background refetch) */
    isFetching: boolean;
    /** Error if the query failed */
    error: Error | null;
    /** Refetch the groups */
    refetch: () => void;
}

/**
 * Return type for useGroupCount hook.
 */
export interface UseGroupCountResult {
    /** Number of groups the user belongs to */
    data: number | undefined;
    /** Whether the query is loading */
    isLoading: boolean;
    /** Error if the query failed */
    error: Error | null;
}

/**
 * Return type for useCreateGroup mutation.
 */
export interface UseCreateGroupResult {
    /** Function to trigger the mutation */
    mutate: (input: CreateGroupInput) => void;
    /** Async function to trigger the mutation and await result */
    mutateAsync: (input: CreateGroupInput) => Promise<SharedGroup>;
    /** Whether the mutation is in progress */
    isPending: boolean;
    /** Error if the mutation failed */
    error: Error | null;
    /** Whether the mutation was successful */
    isSuccess: boolean;
    /** The created group (available after success) */
    data: SharedGroup | undefined;
    /** Reset the mutation state */
    reset: () => void;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch user's shared groups with React Query caching.
 *
 * Queries all groups where the user is a member (includes owned groups).
 * Results are cached and automatically refreshed in the background.
 *
 * @param user - Authenticated Firebase user (null if not logged in)
 * @param services - Firebase services containing db instance
 * @returns Query result with groups data, loading state, and error
 *
 * @example
 * ```tsx
 * function GroupList() {
 *   const { data: groups, isLoading, error } = useGroups(user, services);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   if (!groups?.length) return <EmptyState />;
 *
 *   return groups.map(g => <GroupCard key={g.id} group={g} />);
 * }
 * ```
 */
export function useGroups(
    user: User | null,
    services: Services | null
): UseGroupsResult {
    const enabled = !!user && !!services;

    const queryKey = useMemo(
        () => (enabled ? QUERY_KEYS.groups.list(user!.uid) : ['groups', 'list', '']),
        [enabled, user?.uid]
    );

    const query = useQuery({
        queryKey,
        queryFn: () => getUserGroups(services!.db, user!.uid),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Get the count of groups the user belongs to.
 *
 * Useful for BC-1 limit checking without fetching full group data.
 *
 * @param user - Authenticated Firebase user (null if not logged in)
 * @param services - Firebase services containing db instance
 * @returns Query result with group count
 *
 * @example
 * ```tsx
 * function CreateGroupButton() {
 *   const { data: count } = useGroupCount(user, services);
 *   const canCreate = (count ?? 0) < SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS;
 *
 *   return (
 *     <Button disabled={!canCreate} onClick={showCreateDialog}>
 *       Create Group
 *     </Button>
 *   );
 * }
 * ```
 */
export function useGroupCount(
    user: User | null,
    services: Services | null
): UseGroupCountResult {
    const enabled = !!user && !!services;

    const queryKey = useMemo(
        () => (enabled ? QUERY_KEYS.groups.count(user!.uid) : ['groups', 'count', '']),
        [enabled, user?.uid]
    );

    const query = useQuery({
        queryKey,
        queryFn: () => getGroupCount(services!.db, user!.uid),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error,
    };
}

/**
 * Create a new shared group with optimistic updates.
 *
 * Mutation hook that:
 * - Optimistically adds the new group to cache immediately
 * - Rolls back on error
 * - Invalidates group queries on success for fresh data
 *
 * @param user - Authenticated Firebase user (required for creation)
 * @param services - Firebase services containing db and appId
 * @returns Mutation result with mutate function and state
 *
 * @example
 * ```tsx
 * function CreateGroupDialog() {
 *   const { mutate: createGroup, isPending, error } = useCreateGroup(user, services);
 *
 *   const handleSubmit = (name: string, sharingEnabled: boolean) => {
 *     createGroup({
 *       name,
 *       transactionSharingEnabled: sharingEnabled,
 *     });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Input name="name" />
 *       <Toggle name="sharing" />
 *       <Button loading={isPending}>Create</Button>
 *       {error && <Error message={error.message} />}
 *     </Form>
 *   );
 * }
 * ```
 */
export function useCreateGroup(
    user: User | null,
    services: Services | null
): UseCreateGroupResult {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (input: CreateGroupInput): Promise<SharedGroup> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to create a group');
            }

            // Build owner profile from user data
            // Only include properties with actual values - Firestore rejects undefined
            const profileData: Partial<MemberProfile> = {};
            if (user.displayName) profileData.displayName = user.displayName;
            if (user.email) profileData.email = user.email;
            if (user.photoURL) profileData.photoURL = user.photoURL;

            // Only pass profile if it has at least one property
            const ownerProfile: MemberProfile | undefined =
                Object.keys(profileData).length > 0
                    ? (profileData as MemberProfile)
                    : undefined;

            // Map input to service input format
            const serviceInput: CreateSharedGroupInput = {
                name: input.name,
                transactionSharingEnabled: input.transactionSharingEnabled,
                color: input.color,
                icon: input.icon,
            };

            return createGroupService(
                services.db,
                user.uid,
                services.appId,
                serviceInput,
                ownerProfile
            );
        },

        // Optimistic update: Add the new group to cache immediately
        onMutate: async (input: CreateGroupInput) => {
            if (!user) return { previousGroups: undefined, previousCount: undefined };

            // Cancel any outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.all() });

            // Snapshot the previous values for rollback
            const previousGroups = queryClient.getQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid)
            );
            const previousCount = queryClient.getQueryData<number>(
                QUERY_KEYS.groups.count(user.uid)
            );

            // Create optimistic group (with temporary ID)
            const optimisticGroup: SharedGroup = {
                id: `temp-${Date.now()}`,
                ownerId: user.uid,
                appId: services?.appId || 'boletapp',
                name: input.name,
                color: input.color || '#10b981',
                icon: input.icon,
                shareCode: 'PENDING...',
                shareCodeExpiresAt: { toDate: () => new Date() } as any,
                members: [user.uid],
                memberUpdates: {},
                memberProfiles: user.displayName || user.email
                    ? {
                        [user.uid]: {
                            displayName: user.displayName || undefined,
                            email: user.email || undefined,
                            photoURL: user.photoURL || undefined,
                        },
                    }
                    : undefined,
                createdAt: { toDate: () => new Date() } as any,
                updatedAt: { toDate: () => new Date() } as any,
                timezone: getDeviceTimezone(),
                transactionSharingEnabled: input.transactionSharingEnabled,
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
            };

            // Optimistically update the groups list
            queryClient.setQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid),
                (old) => [...(old || []), optimisticGroup]
            );

            // Optimistically update the count
            queryClient.setQueryData<number>(
                QUERY_KEYS.groups.count(user.uid),
                (old) => (old ?? 0) + 1
            );

            // Return context for rollback
            return { previousGroups, previousCount };
        },

        // Rollback on error
        onError: (_error, _input, context) => {
            if (!user || !context) return;

            // Restore previous groups list
            if (context.previousGroups !== undefined) {
                queryClient.setQueryData(
                    QUERY_KEYS.groups.list(user.uid),
                    context.previousGroups
                );
            }

            // Restore previous count
            if (context.previousCount !== undefined) {
                queryClient.setQueryData(
                    QUERY_KEYS.groups.count(user.uid),
                    context.previousCount
                );
            }
        },

        // Always refetch after success or error to ensure data is in sync
        onSettled: () => {
            // Invalidate all group queries to ensure UI updates with real data
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.groups.all(),
            });
        },
    });

    return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
        data: mutation.data,
        reset: mutation.reset,
    };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Check if user can create a new group (BC-1 limit check).
 *
 * Convenience hook that combines useGroupCount with limit checking.
 * Uses SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS (10) as the limit.
 *
 * Note: This checks total membership (groups owned + groups joined).
 * A user can be a member of up to 10 groups total.
 *
 * @param user - Authenticated Firebase user
 * @param services - Firebase services
 * @returns Object with canCreate boolean and loading state
 *
 * @example
 * ```tsx
 * const { canCreate, isLoading } = useCanCreateGroup(user, services);
 *
 * if (!canCreate) {
 *   showToast('You have reached the maximum number of groups');
 * }
 * ```
 */
export function useCanCreateGroup(
    user: User | null,
    services: Services | null
): { canCreate: boolean; isLoading: boolean } {
    const { data: count, isLoading } = useGroupCount(user, services);

    return {
        canCreate: count !== undefined ? count < SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS : false,
        isLoading,
    };
}

// =============================================================================
// Update Group Hook (Story 14d-v2-1-7g)
// =============================================================================

/**
 * Input for updating a group via useUpdateGroup mutation.
 * Story 14d-v2-1-7g: Edit Group Settings
 */
export interface UpdateGroupInput {
    /** ID of the group to update */
    groupId: string;
    /** New group name (optional) */
    name?: string;
    /** New group icon (optional) */
    icon?: string;
    /** New group color (optional) */
    color?: string;
}

/**
 * Return type for useUpdateGroup mutation.
 * Story 14d-v2-1-7g: Edit Group Settings
 */
export interface UseUpdateGroupResult {
    /** Function to trigger the mutation */
    mutate: (input: UpdateGroupInput) => void;
    /** Async function to trigger the mutation and await result */
    mutateAsync: (input: UpdateGroupInput) => Promise<void>;
    /** Whether the mutation is in progress */
    isPending: boolean;
    /** Error if the mutation failed */
    error: Error | null;
    /** Whether the mutation was successful */
    isSuccess: boolean;
    /** Reset the mutation state */
    reset: () => void;
}

/**
 * Update a shared group's settings with optimistic updates.
 *
 * Story 14d-v2-1-7g: Edit Group Settings
 *
 * Mutation hook that:
 * - Optimistically updates the group in cache immediately
 * - Rolls back on error
 * - Invalidates group queries on success for fresh data
 *
 * @param user - Authenticated Firebase user (required for update)
 * @param services - Firebase services containing db instance
 * @returns Mutation result with mutate function and state
 *
 * @example
 * ```tsx
 * function EditGroupDialog() {
 *   const { mutate: updateGroup, isPending, error } = useUpdateGroup(user, services);
 *
 *   const handleSave = (name: string, icon: string, color: string) => {
 *     updateGroup({
 *       groupId: 'group-123',
 *       name,
 *       icon,
 *       color,
 *     });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSave}>
 *       <Input name="name" />
 *       <ColorPicker name="color" />
 *       <EmojiPicker name="icon" />
 *       <Button loading={isPending}>Save</Button>
 *       {error && <Error message={error.message} />}
 *     </Form>
 *   );
 * }
 * ```
 */
export function useUpdateGroup(
    user: User | null,
    services: Services | null
): UseUpdateGroupResult {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (input: UpdateGroupInput): Promise<void> => {
            if (!user || !services) {
                throw new Error('User must be authenticated to update a group');
            }

            // Build update object with only defined fields
            const updates: { name?: string; icon?: string; color?: string } = {};
            if (input.name !== undefined) updates.name = input.name;
            if (input.icon !== undefined) updates.icon = input.icon;
            if (input.color !== undefined) updates.color = input.color;

            await updateGroupService(
                services.db,
                input.groupId,
                user.uid,
                updates
            );
        },

        // Optimistic update: Update the group in cache immediately
        onMutate: async (input: UpdateGroupInput) => {
            if (!user) return { previousGroups: undefined };

            // Cancel any outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.all() });

            // Snapshot the previous values for rollback
            const previousGroups = queryClient.getQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid)
            );

            // Optimistically update the groups list
            queryClient.setQueryData<SharedGroup[]>(
                QUERY_KEYS.groups.list(user.uid),
                (old) => {
                    if (!old) return old;
                    return old.map(group => {
                        if (group.id === input.groupId) {
                            return {
                                ...group,
                                ...(input.name !== undefined && { name: input.name }),
                                ...(input.icon !== undefined && { icon: input.icon }),
                                ...(input.color !== undefined && { color: input.color }),
                            };
                        }
                        return group;
                    });
                }
            );

            // Return context for rollback
            return { previousGroups };
        },

        // Rollback on error
        onError: (_error, _input, context) => {
            if (!user || !context) return;

            // Restore previous groups list
            if (context.previousGroups !== undefined) {
                queryClient.setQueryData(
                    QUERY_KEYS.groups.list(user.uid),
                    context.previousGroups
                );
            }
        },

        // Always refetch after success or error to ensure data is in sync
        onSettled: () => {
            // Invalidate all group queries to ensure UI updates with real data
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.groups.all(),
            });
        },
    });

    return {
        mutate: mutation.mutate,
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
        reset: mutation.reset,
    };
}
