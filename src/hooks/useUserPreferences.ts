/**
 * useUserPreferences Hook
 * Story 9.8: React hook for managing user preferences
 *
 * Provides access to user preferences with automatic loading and saving.
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
  SupportedCurrency,
} from '../services/userPreferencesService';

interface UseUserPreferencesResult {
  /** Current user preferences */
  preferences: UserPreferences;
  /** Loading state */
  loading: boolean;
  /** Update default currency */
  setDefaultCurrency: (currency: SupportedCurrency) => Promise<void>;
}

interface FirebaseServices {
  db: any;
  appId: string;
}

/**
 * Hook for managing user preferences
 *
 * @param user - Firebase Auth user
 * @param services - Firebase services (db, appId)
 * @returns User preferences and update functions
 */
export function useUserPreferences(
  user: User | null,
  services: FirebaseServices | null
): UseUserPreferencesResult {
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultCurrency: 'CLP',
  });
  const [loading, setLoading] = useState(true);

  // Load preferences on mount or when user/services change
  useEffect(() => {
    if (!user || !services) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      setLoading(true);
      try {
        const prefs = await getUserPreferences(services.db, user.uid, services.appId);
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user, services]);

  // Update default currency
  const setDefaultCurrency = useCallback(
    async (currency: SupportedCurrency) => {
      if (!user || !services) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, defaultCurrency: currency }));

      try {
        await saveUserPreferences(services.db, user.uid, services.appId, {
          defaultCurrency: currency,
        });
      } catch (error) {
        console.error('Failed to save default currency:', error);
        // Revert on error (could reload from server, but this is simpler)
        const prefs = await getUserPreferences(services.db, user.uid, services.appId);
        setPreferences(prefs);
      }
    },
    [user, services]
  );

  return {
    preferences,
    loading,
    setDefaultCurrency,
  };
}
