/**
 * User Preferences Service
 * Story 9.8: Handles user preferences storage in Firestore
 *
 * Firestore path: artifacts/{appId}/users/{userId}/preferences/settings
 */

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

/**
 * Supported currencies for the application
 * Matches SUPPORTED_CURRENCIES from functions/src/prompts/input-hints.ts
 */
export type SupportedCurrency = 'CLP' | 'USD' | 'EUR';

/**
 * Supported font families for the application
 * Story 14.22: Typography selection - persisted to Firestore
 */
export type SupportedFontFamily = 'outfit' | 'space';

/**
 * Foreign location display format preference
 * Story 14.35b: How to display foreign country indicators
 * - 'code': Two-letter country code (e.g., "US Orlando")
 * - 'flag': Flag emoji (e.g., "🇺🇸 Orlando")
 */
export type ForeignLocationDisplayFormat = 'code' | 'flag';

/**
 * User preferences stored in Firestore
 * Story 14.22: Extended to include location settings for cloud persistence
 */
export interface UserPreferences {
  /** Default currency for receipt scanning */
  defaultCurrency: SupportedCurrency;
  /** Default country for scan location (Story 14.22) */
  defaultCountry?: string;
  /** Default city for scan location (Story 14.22) */
  defaultCity?: string;
  /** User display name (Story 14.22: Profile sub-view) */
  displayName?: string;
  /** User phone number (Story 14.22: Profile sub-view) */
  phoneNumber?: string;
  /** User birth date (Story 14.22: Profile sub-view) */
  birthDate?: string;
  /** Font family preference (Story 14.22: Typography selection) */
  fontFamily?: SupportedFontFamily;
  /** Story 14.35b: Foreign location display format ('code' or 'flag') */
  foreignLocationFormat?: ForeignLocationDisplayFormat;
  /** Timestamp when preferences were last updated */
  updatedAt?: any;
}

/**
 * Default preferences for new users
 * Story 14.22: Added fontFamily default to 'outfit'
 * Story 14.35b: Added foreignLocationFormat default to 'code'
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  defaultCurrency: 'CLP',
  fontFamily: 'outfit',
  foreignLocationFormat: 'code',
};

/**
 * Get the Firestore document reference for user preferences
 */
function getPreferencesDocRef(db: Firestore, appId: string, userId: string) {
  return doc(db, 'artifacts', appId, 'users', userId, 'preferences', 'settings');
}

/**
 * Get user preferences from Firestore
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @returns User preferences or default values if not found
 */
export async function getUserPreferences(
  db: Firestore,
  userId: string,
  appId: string
): Promise<UserPreferences> {
  try {
    const docRef = getPreferencesDocRef(db, appId, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        defaultCurrency: data.defaultCurrency || DEFAULT_PREFERENCES.defaultCurrency,
        // Story 14.22: Include location and profile fields
        defaultCountry: data.defaultCountry || '',
        defaultCity: data.defaultCity || '',
        displayName: data.displayName || '',
        phoneNumber: data.phoneNumber || '',
        birthDate: data.birthDate || '',
        // Story 14.22: Font family preference (defaults to 'outfit')
        fontFamily: data.fontFamily || DEFAULT_PREFERENCES.fontFamily,
        // Story 14.35b: Foreign location display format (defaults to 'code')
        foreignLocationFormat: data.foreignLocationFormat || DEFAULT_PREFERENCES.foreignLocationFormat,
        updatedAt: data.updatedAt,
      };
    }

    // Return defaults if no preferences exist
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    // Return defaults on error
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save user preferences to Firestore
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @param preferences - Partial preferences to save (merged with existing)
 */
export async function saveUserPreferences(
  db: Firestore,
  userId: string,
  appId: string,
  preferences: Partial<Omit<UserPreferences, 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = getPreferencesDocRef(db, appId, userId);

    await setDoc(
      docRef,
      {
        ...preferences,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }
}

/**
 * Currency information for display purposes
 * Matches CURRENCY_INFO from functions/src/prompts/input-hints.ts
 */
export const CURRENCY_INFO: Record<SupportedCurrency, { name: string; nameEs: string; symbol: string }> = {
  CLP: { name: 'Chilean Peso', nameEs: 'Peso Chileno', symbol: '$' },
  USD: { name: 'US Dollar', nameEs: 'Dólar Estadounidense', symbol: '$' },
  EUR: { name: 'Euro', nameEs: 'Euro', symbol: '€' },
};

/**
 * List of supported currencies for dropdown options
 */
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['CLP', 'USD', 'EUR'];

// ============================================================================
// User Shared Groups Preferences (Story 14d-v2-1-6e)
// ============================================================================

import type {
  UserSharedGroupsPreferences,
  UserGroupPreference,
} from '@/types/sharedGroup';
import { DEFAULT_GROUP_PREFERENCE } from '@/types/sharedGroup';

// Re-export for convenience
export type { UserSharedGroupsPreferences, UserGroupPreference };

/**
 * Get the Firestore document reference for user shared groups preferences.
 *
 * Story 14d-v2-1-6e AC#2: User group preferences document location.
 * Path: artifacts/{appId}/users/{userId}/preferences/sharedGroups
 */
function getSharedGroupsPreferencesDocRef(db: Firestore, appId: string, userId: string) {
  return doc(db, 'artifacts', appId, 'users', userId, 'preferences', 'sharedGroups');
}

/**
 * Get user's shared groups preferences.
 *
 * Story 14d-v2-1-6e: Retrieve user's per-group settings.
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @returns User's shared groups preferences or empty object if none exist
 */
export async function getUserSharedGroupsPreferences(
  db: Firestore,
  userId: string,
  appId: string
): Promise<UserSharedGroupsPreferences> {
  try {
    const docRef = getSharedGroupsPreferencesDocRef(db, appId, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        groupPreferences: data.groupPreferences || {},
      };
    }

    // Return empty preferences if none exist
    return { groupPreferences: {} };
  } catch (error) {
    console.error('Error fetching user shared groups preferences:', error);
    return { groupPreferences: {} };
  }
}

/**
 * Create or update a user's preference for a specific group.
 *
 * Story 14d-v2-1-6e AC#2, AC#3:
 * - Called when user accepts a group invitation
 * - Sets shareMyTransactions based on opt-in choice
 * - Initializes toggle tracking fields
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @param groupId - The group ID to set preferences for
 * @param shareMyTransactions - Whether user opts to share their transactions
 */
export async function setGroupPreference(
  db: Firestore,
  userId: string,
  appId: string,
  groupId: string,
  shareMyTransactions: boolean
): Promise<void> {
  try {
    const docRef = getSharedGroupsPreferencesDocRef(db, appId, userId);

    // Create the preference with initialized toggle tracking
    const preference: UserGroupPreference = {
      shareMyTransactions,
      ...DEFAULT_GROUP_PREFERENCE,
    };

    // Use setDoc with merge to create or update
    // This uses dot notation to set only the specific group's preferences
    await setDoc(
      docRef,
      {
        [`groupPreferences.${groupId}`]: preference,
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error setting group preference:', error);
    throw error;
  }
}

/**
 * Get a user's preference for a specific group.
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @param groupId - The group ID to get preferences for
 * @returns The user's preference for this group, or null if not set
 */
export async function getGroupPreference(
  db: Firestore,
  userId: string,
  appId: string,
  groupId: string
): Promise<UserGroupPreference | null> {
  try {
    const prefs = await getUserSharedGroupsPreferences(db, userId, appId);
    return prefs.groupPreferences[groupId] || null;
  } catch (error) {
    console.error('Error getting group preference:', error);
    return null;
  }
}

/**
 * Remove a user's preference for a specific group.
 *
 * Called when user leaves a group.
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @param groupId - The group ID to remove preferences for
 */
export async function removeGroupPreference(
  db: Firestore,
  userId: string,
  appId: string,
  groupId: string
): Promise<void> {
  try {
    const docRef = getSharedGroupsPreferencesDocRef(db, appId, userId);
    const { deleteField } = await import('firebase/firestore');

    await setDoc(
      docRef,
      {
        [`groupPreferences.${groupId}`]: deleteField(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error removing group preference:', error);
    throw error;
  }
}
