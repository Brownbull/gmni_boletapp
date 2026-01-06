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
    // Story 14.22: Initialize new fields
    defaultCountry: '',
    defaultCity: '',
    displayName: '',
    phoneNumber: '',
    birthDate: '',
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

  // Story 14.22: Update default country
  const setDefaultCountry = useCallback(
    async (country: string) => {
      if (!user || !services) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, defaultCountry: country }));

      try {
        await saveUserPreferences(services.db, user.uid, services.appId, {
          defaultCountry: country,
        });
      } catch (error) {
        console.error('Failed to save default country:', error);
        const prefs = await getUserPreferences(services.db, user.uid, services.appId);
        setPreferences(prefs);
      }
    },
    [user, services]
  );

  // Story 14.22: Update default city
  const setDefaultCity = useCallback(
    async (city: string) => {
      if (!user || !services) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, defaultCity: city }));

      try {
        await saveUserPreferences(services.db, user.uid, services.appId, {
          defaultCity: city,
        });
      } catch (error) {
        console.error('Failed to save default city:', error);
        const prefs = await getUserPreferences(services.db, user.uid, services.appId);
        setPreferences(prefs);
      }
    },
    [user, services]
  );

  // Story 14.22: Update display name
  const setDisplayName = useCallback(
    async (name: string) => {
      if (!user || !services) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, displayName: name }));

      try {
        await saveUserPreferences(services.db, user.uid, services.appId, {
          displayName: name,
        });
      } catch (error) {
        console.error('Failed to save display name:', error);
        const prefs = await getUserPreferences(services.db, user.uid, services.appId);
        setPreferences(prefs);
      }
    },
    [user, services]
  );

  // Story 14.22: Update phone number
  const setPhoneNumber = useCallback(
    async (phone: string) => {
      if (!user || !services) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, phoneNumber: phone }));

      try {
        await saveUserPreferences(services.db, user.uid, services.appId, {
          phoneNumber: phone,
        });
      } catch (error) {
        console.error('Failed to save phone number:', error);
        const prefs = await getUserPreferences(services.db, user.uid, services.appId);
        setPreferences(prefs);
      }
    },
    [user, services]
  );

  // Story 14.22: Update birth date
  const setBirthDate = useCallback(
    async (date: string) => {
      if (!user || !services) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, birthDate: date }));

      try {
        await saveUserPreferences(services.db, user.uid, services.appId, {
          birthDate: date,
        });
      } catch (error) {
        console.error('Failed to save birth date:', error);
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
    setDefaultCountry,
    setDefaultCity,
    setDisplayName,
    setPhoneNumber,
    setBirthDate,
  };
}
