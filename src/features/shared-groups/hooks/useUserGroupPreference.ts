/**
 * useUserGroupPreference Hook
 *
 * Story 14d-v2-1-12c: User Transaction Sharing Preference - UI Layer
 *
 * Provides access to user's per-group sharing preferences with real-time
 * Firestore subscription and cooldown/rate-limit checking.
 *
 * Features:
 * - Real-time Firestore subscription for multi-device sync (AC #8)
 * - Integrated cooldown checking via canToggleUserSharingPreference
 * - Clean abstraction for component consumption
 *
 * @example
 * ```tsx
 * const { preference, isLoading, updatePreference, canToggle } = useUserGroupPreference(
 *   user,
 *   services,
 *   groupId
 * );
 *
 * if (canToggle.allowed) {
 *   await updatePreference(!preference?.shareMyTransactions);
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { UserGroupPreference } from '@/types/sharedGroup';
import {
  subscribeToUserGroupPreference,
  updateShareMyTransactions,
} from '@/services/userPreferencesService';
import {
  canToggleUserSharingPreference,
  UserToggleCooldownResult,
} from '@/utils/userSharingCooldown';

// =============================================================================
// Types
// =============================================================================

/**
 * Services required by the hook.
 *
 * Story 14d-v2-1-12c ECC Review #2: Added JSDoc for service properties.
 */
export interface UserGroupPreferenceServices {
  /**
   * Firestore database instance used for real-time subscriptions
   * and preference updates.
   */
  db: Firestore;

  /**
   * Application identifier for multi-tenant data isolation.
   * Used in Firestore path: artifacts/{appId}/users/{userId}/preferences/sharedGroups
   */
  appId: string;
}

/**
 * Return type for useUserGroupPreference hook.
 */
export interface UseUserGroupPreferenceResult {
  /** Current user preference (null if loading or not set) */
  preference: UserGroupPreference | null;
  /** Whether the preference is loading */
  isLoading: boolean;
  /** Function to update the shareMyTransactions preference */
  updatePreference: (enabled: boolean) => Promise<void>;
  /** Result of cooldown check - whether toggling is allowed */
  canToggle: UserToggleCooldownResult;
  /** Error from subscription failure (null if no error) */
  error: Error | null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for accessing and managing user's per-group sharing preferences.
 *
 * @param user - Current authenticated user (null if not logged in)
 * @param services - Services object containing db and appId
 * @param groupId - ID of the group (null if not selected)
 * @returns UseUserGroupPreferenceResult with preference state and actions
 */
export function useUserGroupPreference(
  user: User | null,
  services: UserGroupPreferenceServices | null,
  groupId: string | null
): UseUserGroupPreferenceResult {
  const [preference, setPreference] = useState<UserGroupPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to preference updates
  // Story 14d-v2-1-12c ECC Review #2: Added isMounted guard to prevent state updates
  // on unmounted component (race condition protection)
  useEffect(() => {
    // Guard: require all params
    if (!user || !services || !groupId) {
      setPreference(null);
      setIsLoading(false);
      return;
    }

    // Track mount state to prevent updates after unmount
    let isMounted = true;

    setIsLoading(true);

    const unsubscribe = subscribeToUserGroupPreference(
      services.db,
      user.uid,
      services.appId,
      groupId,
      (pref) => {
        // Guard against state updates on unmounted component
        if (!isMounted) return;

        setPreference(pref);
        setIsLoading(false);
        // Clear error on successful update (Story 14d-v2-1-12c Action Item)
        if (pref !== null) {
          setError(null);
        }
      },
      // onError callback (Story 14d-v2-1-12c Action Item)
      (err) => {
        // Guard against state updates on unmounted component
        if (!isMounted) return;

        setError(err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user, services, groupId]);

  // Calculate canToggle based on current preference
  const canToggle = useMemo<UserToggleCooldownResult>(() => {
    if (!preference) {
      // Default: allowed when no preference exists
      return { allowed: true };
    }
    return canToggleUserSharingPreference(preference);
  }, [preference]);

  // Update preference function
  const updatePreference = useCallback(
    async (enabled: boolean): Promise<void> => {
      // Specific error messages (Story 14d-v2-1-12c Action Item)
      if (!user) {
        throw new Error('user is not authenticated');
      }
      if (!services) {
        throw new Error('services not available');
      }
      if (!groupId) {
        throw new Error('no group selected');
      }

      await updateShareMyTransactions(
        services.db,
        user.uid,
        services.appId,
        groupId,
        enabled
      );
    },
    [user, services, groupId]
  );

  return {
    preference,
    isLoading,
    updatePreference,
    canToggle,
    error,
  };
}
