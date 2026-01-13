/**
 * useUserPreferences Hook
 *
 * Story 9.8: React hook for managing user preferences
 * Story 14.28: Migrated to React Query for app-level caching
 *
 * Provides access to user preferences with automatic loading, saving, and caching.
 * When called at App level, warms the React Query cache so subsequent Settings
 * visits show instantly (no loading spinner).
 */

import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from 'firebase/auth';
import { useFirestoreQuery } from './useFirestoreQuery';
import { QUERY_KEYS } from '../lib/queryKeys';
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
  SupportedCurrency,
  SupportedFontFamily,
  ForeignLocationDisplayFormat,
} from '../services/userPreferencesService';

interface UseUserPreferencesResult {
  /** Current user preferences */
  preferences: UserPreferences;
  /** Loading state */
  loading: boolean;
  /** Update default currency */
  setDefaultCurrency: (currency: SupportedCurrency) => Promise<void>;
  /** Story 14.22: Update default country */
  setDefaultCountry: (country: string) => Promise<void>;
  /** Story 14.22: Update default city */
  setDefaultCity: (city: string) => Promise<void>;
  /** Story 14.22: Update display name */
  setDisplayName: (name: string) => Promise<void>;
  /** Story 14.22: Update phone number */
  setPhoneNumber: (phone: string) => Promise<void>;
  /** Story 14.22: Update birth date */
  setBirthDate: (date: string) => Promise<void>;
  /** Story 14.22: Update font family */
  setFontFamily: (fontFamily: SupportedFontFamily) => Promise<void>;
  /** Story 14.35b: Update foreign location display format */
  setForeignLocationFormat: (format: ForeignLocationDisplayFormat) => Promise<void>;
}

interface FirebaseServices {
  db: any;
  appId: string;
}

/** Default preferences used when no preferences exist */
const DEFAULT_PREFERENCES: UserPreferences = {
  defaultCurrency: 'CLP',
  defaultCountry: '',
  defaultCity: '',
  displayName: '',
  phoneNumber: '',
  birthDate: '',
  fontFamily: 'outfit',
  foreignLocationFormat: 'code',
};

/**
 * Hook for managing user preferences with React Query caching.
 *
 * Story 14.28: This hook now uses React Query for caching. When called
 * at the App level (on login), it warms the cache so that subsequent
 * Settings visits display instantly without a loading spinner.
 *
 * @param user - Firebase Auth user
 * @param services - Firebase services (db, appId)
 * @returns User preferences and update functions
 */
export function useUserPreferences(
  user: User | null,
  services: FirebaseServices | null
): UseUserPreferencesResult {
  const queryClient = useQueryClient();
  const enabled = !!user && !!services;

  // Create stable query key
  const queryKey = useMemo(
    () => enabled
      ? QUERY_KEYS.userPreferences(user!.uid, services!.appId)
      : ['userPreferences', '', ''],
    [enabled, user?.uid, services?.appId]
  );

  // Use React Query for cached preferences fetch
  const { data: preferences = DEFAULT_PREFERENCES, isLoading } = useFirestoreQuery(
    queryKey,
    () => getUserPreferences(services!.db, user!.uid, services!.appId),
    { enabled }
  );

  /**
   * Helper function for optimistic updates
   * Updates cache immediately, then persists to Firestore
   * Reverts on error by refetching
   */
  const updatePreference = useCallback(
    async <K extends keyof Omit<UserPreferences, 'updatedAt'>>(
      key: K,
      value: UserPreferences[K]
    ) => {
      if (!user || !services) return;

      // Get current preferences from cache
      const currentPrefs = queryClient.getQueryData<UserPreferences>(queryKey) ?? DEFAULT_PREFERENCES;

      // Optimistic update - immediately update cache
      queryClient.setQueryData<UserPreferences>(queryKey, {
        ...currentPrefs,
        [key]: value,
      });

      try {
        // Persist to Firestore
        await saveUserPreferences(services.db, user.uid, services.appId, {
          [key]: value,
        });
      } catch (error) {
        console.error(`Failed to save ${key}:`, error);
        // Revert by refetching from Firestore
        queryClient.invalidateQueries({ queryKey });
      }
    },
    [user, services, queryClient, queryKey]
  );

  // Update functions using the helper
  const setDefaultCurrency = useCallback(
    (currency: SupportedCurrency) => updatePreference('defaultCurrency', currency),
    [updatePreference]
  );

  const setDefaultCountry = useCallback(
    (country: string) => updatePreference('defaultCountry', country),
    [updatePreference]
  );

  const setDefaultCity = useCallback(
    (city: string) => updatePreference('defaultCity', city),
    [updatePreference]
  );

  const setDisplayName = useCallback(
    (name: string) => updatePreference('displayName', name),
    [updatePreference]
  );

  const setPhoneNumber = useCallback(
    (phone: string) => updatePreference('phoneNumber', phone),
    [updatePreference]
  );

  const setBirthDate = useCallback(
    (date: string) => updatePreference('birthDate', date),
    [updatePreference]
  );

  const setFontFamily = useCallback(
    (fontFamily: SupportedFontFamily) => updatePreference('fontFamily', fontFamily),
    [updatePreference]
  );

  const setForeignLocationFormat = useCallback(
    (format: ForeignLocationDisplayFormat) => updatePreference('foreignLocationFormat', format),
    [updatePreference]
  );

  return useMemo(
    () => ({
      preferences,
      loading: isLoading,
      setDefaultCurrency,
      setDefaultCountry,
      setDefaultCity,
      setDisplayName,
      setPhoneNumber,
      setBirthDate,
      setFontFamily,
      setForeignLocationFormat,
    }),
    [
      preferences,
      isLoading,
      setDefaultCurrency,
      setDefaultCountry,
      setDefaultCity,
      setDisplayName,
      setPhoneNumber,
      setBirthDate,
      setFontFamily,
      setForeignLocationFormat,
    ]
  );
}
