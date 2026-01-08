/**
 * useFirestoreMutation Hook
 *
 * Story 14.29: React Query Migration
 * Epic 14: Core Implementation
 *
 * React Query mutation hook with optimistic update support.
 * Use for Firestore write operations (add, update, delete).
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Cache invalidation after mutation
 * - Loading and error states
 *
 * @example
 * ```tsx
 * const { mutate: deleteTransaction } = useFirestoreMutation(
 *     (id: string) => firestoreDeleteTransaction(db, userId, appId, id),
 *     {
 *         queryKey: QUERY_KEYS.transactions(userId, appId),
 *         optimisticUpdate: (oldData, id) =>
 *             oldData?.filter(tx => tx.id !== id) ?? [],
 *     }
 * );
 *
 * // Usage
 * deleteTransaction('tx-123');
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface OptimisticConfig<TData, TVariables> {
    /** Query key for the data to optimistically update */
    queryKey: readonly unknown[];
    /**
     * Function to compute the optimistic update.
     * Receives current cached data and mutation variables.
     * Return the new data shape to display immediately.
     */
    optimisticUpdate: (oldData: TData | undefined, variables: TVariables) => TData;
}

/**
 * React Query mutation with optimistic updates and automatic cache management.
 *
 * @param mutationFn - Async function that performs the Firestore operation
 * @param optimistic - Optional config for optimistic updates
 * @returns React Query mutation result with mutate, isLoading, error, etc.
 */
export function useFirestoreMutation<TData, TVariables, TError = Error>(
    mutationFn: (variables: TVariables) => Promise<void>,
    optimistic?: OptimisticConfig<TData, TVariables>
) {
    const queryClient = useQueryClient();

    return useMutation<void, TError, TVariables, { previous: TData | undefined }>({
        mutationFn,

        onMutate: async (variables) => {
            if (!optimistic) {
                return { previous: undefined };
            }

            // Cancel any in-flight queries to prevent race conditions
            await queryClient.cancelQueries({ queryKey: optimistic.queryKey });

            // Snapshot the previous value for rollback
            const previous = queryClient.getQueryData<TData>(optimistic.queryKey);

            // Optimistically update the cache
            queryClient.setQueryData<TData>(
                optimistic.queryKey,
                (oldData) => optimistic.optimisticUpdate(oldData, variables)
            );

            // Return context for potential rollback
            return { previous };
        },

        onError: (_error, _variables, context) => {
            // Rollback to previous value on error
            if (optimistic && context?.previous !== undefined) {
                queryClient.setQueryData(optimistic.queryKey, context.previous);
            }
        },

        onSettled: () => {
            // Invalidate queries to refetch fresh data
            // This ensures eventual consistency with server state
            if (optimistic) {
                queryClient.invalidateQueries({ queryKey: optimistic.queryKey });
            }
        },
    });
}

/**
 * Simplified mutation hook without optimistic updates.
 * Use when optimistic updates aren't needed or are too complex.
 *
 * @param mutationFn - Async function that performs the operation
 * @param invalidateQueryKey - Query key to invalidate after success
 * @returns React Query mutation result
 */
export function useSimpleMutation<TVariables, TResult = void, TError = Error>(
    mutationFn: (variables: TVariables) => Promise<TResult>,
    invalidateQueryKey?: readonly unknown[]
) {
    const queryClient = useQueryClient();

    return useMutation<TResult, TError, TVariables>({
        mutationFn,
        onSuccess: () => {
            if (invalidateQueryKey) {
                queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
            }
        },
    });
}
