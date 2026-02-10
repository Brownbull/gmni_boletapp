/**
 * useAirlocks Hook - React Query integration for airlock data
 *
 * Story 14.33c.1: Airlock Generation & Persistence
 * @see docs/sprint-artifacts/epic14/stories/story-14.33c.1-airlock-generation-persistence.md
 *
 * Provides:
 * - Query for fetching user's airlocks
 * - Mutation for generating new airlocks
 * - Mutation for marking airlocks as viewed
 * - Credit balance checking
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { QUERY_KEYS } from '../lib/queryKeys';
import {
  getUserAirlocks,
  generateAirlock,
  markAirlockViewed,
  hasEnoughCredits,
  deleteAirlock,
  deleteAirlocks,
} from '@features/insights/services/airlockService';
import { deductAndSaveSuperCredits } from '../services/userCreditsService';
import { AirlockRecord, AirlockTransaction, AIRLOCK_CREDIT_COST } from '../types/airlock';
import type { UserCredits } from '../types/scan';

interface UseAirlocksOptions {
  /** Current authenticated user */
  user: User | null;
  /** Firebase services */
  services: { db: Firestore; appId: string } | null;
  /** User's current super credit balance */
  credits: number;
  /** Callback to update credits after transactional deduction (TD-13) */
  onCreditsDeducted?: (updatedCredits: UserCredits) => void;
}

interface UseAirlocksResult {
  /** List of user's airlocks */
  airlocks: AirlockRecord[];
  /** Whether the query is loading */
  isLoading: boolean;
  /** Query error (if any) */
  error: Error | null;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Whether deletion is in progress */
  isDeleting: boolean;
  /** Generate a new airlock (costs 1 super credit) */
  generateNewAirlock: (transactions?: AirlockTransaction[]) => Promise<AirlockRecord | null>;
  /** Mark an airlock as viewed */
  markAsViewed: (airlockId: string) => Promise<void>;
  /** Delete a single airlock */
  removeAirlock: (airlockId: string) => Promise<void>;
  /** Delete multiple airlocks */
  removeAirlocks: (airlockIds: string[]) => Promise<void>;
  /** Check if user can generate (has enough credits) */
  canGenerate: boolean;
  /** Number of unviewed airlocks */
  unviewedCount: number;
  /** Refetch airlocks */
  refetch: () => void;
}

/**
 * Hook for managing airlock data with React Query.
 *
 * Usage:
 * ```tsx
 * const { airlocks, isGenerating, generateNewAirlock, canGenerate } = useAirlocks({
 *   user,
 *   services,
 *   credits: userCredits,
 *   onCreditsDeducted: setUserCredits,
 * });
 * ```
 */
export function useAirlocks({
  user,
  services,
  credits,
  onCreditsDeducted,
}: UseAirlocksOptions): UseAirlocksResult {
  const queryClient = useQueryClient();

  // Query for fetching airlocks
  const {
    data: airlocks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: user && services ? QUERY_KEYS.airlocks(user.uid, services.appId) : ['airlocks'],
    queryFn: async () => {
      if (!user || !services) return [];
      return getUserAirlocks(services.db, user.uid, services.appId);
    },
    enabled: !!user && !!services,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for generating new airlock
  const generateMutation = useMutation({
    mutationFn: async (transactions: AirlockTransaction[] = []) => {
      if (!user || !services) {
        throw new Error('User not authenticated');
      }
      if (!hasEnoughCredits(credits, AIRLOCK_CREDIT_COST)) {
        throw new Error('Insufficient credits');
      }
      return generateAirlock(services.db, user.uid, services.appId, transactions);
    },
    onSuccess: async () => {
      // Deduct super credits transactionally on success (TD-13: prevents TOCTOU)
      // Always deduct from Firestore regardless of callback — prevents free airlocks
      if (user && services) {
        try {
          // _currentCredits param is deprecated and ignored by transaction (reads fresh data)
          const _deprecatedCredits = { remaining: 0, used: 0, superRemaining: 0, superUsed: 0 };
          const updatedCredits = await deductAndSaveSuperCredits(
            services.db, user.uid, services.appId, _deprecatedCredits, AIRLOCK_CREDIT_COST
          );
          onCreditsDeducted?.(updatedCredits);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to deduct credits after airlock generation:', error);
          }
        }
      }
      // Invalidate airlocks query to refetch
      if (user && services) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.airlocks(user.uid, services.appId),
        });
      }
    },
  });

  // Mutation for marking airlock as viewed
  const markViewedMutation = useMutation({
    mutationFn: async (airlockId: string) => {
      if (!user || !services) {
        throw new Error('User not authenticated');
      }
      return markAirlockViewed(services.db, user.uid, services.appId, airlockId);
    },
    onSuccess: () => {
      // Invalidate to refetch updated viewedAt
      if (user && services) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.airlocks(user.uid, services.appId),
        });
      }
    },
  });

  // Mutation for deleting a single airlock
  const deleteMutation = useMutation({
    mutationFn: async (airlockId: string) => {
      if (!user || !services) {
        throw new Error('User not authenticated');
      }
      return deleteAirlock(services.db, user.uid, services.appId, airlockId);
    },
    onSuccess: () => {
      if (user && services) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.airlocks(user.uid, services.appId),
        });
      }
    },
  });

  // Mutation for batch deleting airlocks
  const batchDeleteMutation = useMutation({
    mutationFn: async (airlockIds: string[]) => {
      if (!user || !services) {
        throw new Error('User not authenticated');
      }
      return deleteAirlocks(services.db, user.uid, services.appId, airlockIds);
    },
    onSuccess: () => {
      if (user && services) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.airlocks(user.uid, services.appId),
        });
      }
    },
  });

  // Wrapper function for generating
  const generateNewAirlock = async (
    transactions?: AirlockTransaction[]
  ): Promise<AirlockRecord | null> => {
    try {
      return await generateMutation.mutateAsync(transactions || []);
    } catch (err) {
      // DEV-gate per Atlas Section 6 lessons
      if (import.meta.env.DEV) {
        console.error('Failed to generate airlock:', err);
      }
      return null;
    }
  };

  // Wrapper function for marking as viewed
  const markAsViewed = async (airlockId: string): Promise<void> => {
    try {
      await markViewedMutation.mutateAsync(airlockId);
    } catch (err) {
      // DEV-gate per Atlas Section 6 lessons
      if (import.meta.env.DEV) {
        console.error('Failed to mark airlock as viewed:', err);
      }
    }
  };

  // Wrapper function for deleting a single airlock
  const removeAirlock = async (airlockId: string): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(airlockId);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete airlock:', err);
      }
    }
  };

  // Wrapper function for batch deleting airlocks
  const removeAirlocks = async (airlockIds: string[]): Promise<void> => {
    try {
      await batchDeleteMutation.mutateAsync(airlockIds);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete airlocks:', err);
      }
    }
  };

  // Calculate unviewed count
  const unviewedCount = airlocks.filter((a) => !a.viewedAt).length;

  // Check if user can generate (has enough credits)
  const canGenerate = hasEnoughCredits(credits, AIRLOCK_CREDIT_COST);

  return {
    airlocks,
    isLoading,
    error: error as Error | null,
    isGenerating: generateMutation.isPending,
    isDeleting: deleteMutation.isPending || batchDeleteMutation.isPending,
    generateNewAirlock,
    markAsViewed,
    removeAirlock,
    removeAirlocks,
    canGenerate,
    unviewedCount,
    refetch: () => refetch(),
  };
}
