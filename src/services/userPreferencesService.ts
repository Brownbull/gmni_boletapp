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
  updateDoc,
  deleteField,
  serverTimestamp,
  onSnapshot,
  Firestore,
  Unsubscribe,
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
import { createDefaultGroupPreference } from '@/types/sharedGroup';
import { shouldResetUserDailyCount } from '@/utils/userSharingCooldown';

// Re-export for convenience
export type { UserSharedGroupsPreferences, UserGroupPreference };

/**
 * Regex pattern for validating groupId.
 *
 * Story 14d-v2-1-12c ECC Review #2: Enhanced validation with length limit and character whitelist.
 *
 * Rules:
 * - Only alphanumeric characters, hyphens, and underscores allowed
 * - Length must be between 1 and 128 characters
 * - Prevents Firestore path injection and ensures consistent data
 *
 * @see TD-14d-55-groupid-validation for centralized validation discussion
 */
const VALID_GROUP_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

/**
 * Validates a groupId against security and format constraints.
 *
 * @param groupId - The group ID to validate
 * @throws Error if groupId is invalid
 */
export function validateGroupId(groupId: string): void {
  if (!groupId || typeof groupId !== 'string' || !VALID_GROUP_ID_REGEX.test(groupId)) {
    throw new Error(
      'Invalid groupId: must be 1-128 characters containing only letters, numbers, hyphens, or underscores'
    );
  }
}

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
  // Validate inputs (Story 14d-v2-1-12b Task 4.2, 4.4 - input validation)
  // userId and appId must be non-empty strings
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  if (!appId || typeof appId !== 'string') {
    throw new Error('Invalid appId: must be a non-empty string');
  }
  // Story 14d-v2-1-12c ECC Review #2: Enhanced groupId validation with regex
  validateGroupId(groupId);
  // shareMyTransactions must be a boolean
  if (typeof shareMyTransactions !== 'boolean') {
    throw new Error('shareMyTransactions must be a boolean');
  }

  try {
    const docRef = getSharedGroupsPreferencesDocRef(db, appId, userId);

    // Create the preference with initialized toggle tracking using factory
    const preference = createDefaultGroupPreference({ shareMyTransactions });

    // Use setDoc with merge to create or update
    // Uses nested object (not dot-notation) because setDoc treats dot-notation keys as literal field names
    // WRONG pattern (setDoc interprets dot-notation keys as literal field names, not nested paths):
    //   setDoc(docRef, { [`groupPreferences.${groupId}.shareMyTransactions`]: true }, { merge: true })
    // CORRECT pattern (nested object preserves structure):
    await setDoc(
      docRef,
      {
        groupPreferences: {
          [groupId]: preference,
        },
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
  // Story 14d-v2-1-12c ECC Review: Added groupId validation for consistency
  validateGroupId(groupId);

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
  // Validate inputs (Story 14d-v2-1-12b Task 4.3 - userId/appId validation)
  // userId and appId must be non-empty strings
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  if (!appId || typeof appId !== 'string') {
    throw new Error('Invalid appId: must be a non-empty string');
  }
  // Story 14d-v2-1-12c ECC Review #2: Enhanced groupId validation with regex
  validateGroupId(groupId);

  try {
    const docRef = getSharedGroupsPreferencesDocRef(db, appId, userId);

    // Check document exists before updateDoc (updateDoc fails on missing docs)
    // If doc doesn't exist, preference is already absent — return early (idempotent)
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return;
    }

    // Use updateDoc (not setDoc) because:
    // 1. deleteField() sentinel only works with updateDoc
    // 2. updateDoc correctly interprets dot-notation as nested field paths
    await updateDoc(docRef, {
      [`groupPreferences.${groupId}`]: deleteField(),
    });
  } catch (error) {
    console.error('Error removing group preference:', error);
    throw error;
  }
}

/**
 * Update user's shareMyTransactions preference for a specific group.
 *
 * Story 14d-v2-1-12b AC#2: Updates preference, tracks lastToggleAt, increments
 * toggleCountToday, and uses merge behavior for partial updates.
 *
 * Story 14d-v2-1-12b AC#3: Creates document with defaults for new users.
 *
 * Features:
 * - Updates shareMyTransactions to enabled value
 * - Sets lastToggleAt to serverTimestamp
 * - Increments toggleCountToday (or resets to 1 on new day)
 * - Sets toggleCountResetAt to serverTimestamp when daily count resets
 * - Uses updateDoc for partial nested field updates (dot-notation interpreted as paths)
 * - Falls back to setDoc with nested objects if document doesn't exist yet
 *
 * **Note on Rate Limiting (Story 14d-v2-1-12b Task 3.9):**
 * Rate limiting for toggle operations is enforced **client-side only** via the
 * `userSharingCooldown.ts` utility. The toggle count tracking (`toggleCountToday`,
 * `toggleCountResetAt`) provides audit capability but does NOT prevent rapid writes.
 * For server-side rate limiting, consider implementing Firestore security rules
 * with rate limiting or Cloud Functions (see TD-14d-39-server-side-rate-limiting).
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @param groupId - The group ID to update preferences for
 * @param enabled - New value for shareMyTransactions
 *
 * @throws Error if Firestore operation fails or input validation fails
 *
 * @see {@link shouldResetUserDailyCount} for daily reset logic
 * @see TD-14d-39-server-side-rate-limiting for server-side rate limiting enhancement
 */
export async function updateShareMyTransactions(
  db: Firestore,
  userId: string,
  appId: string,
  groupId: string,
  enabled: boolean
): Promise<void> {
  // Validate inputs (Story 14d-v2-1-12b ECC Review fixes - Tasks 3.1, 3.4)
  // userId and appId must be non-empty strings
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  if (!appId || typeof appId !== 'string') {
    throw new Error('Invalid appId: must be a non-empty string');
  }
  // Story 14d-v2-1-12c ECC Review #2: Enhanced groupId validation with regex
  validateGroupId(groupId);
  if (typeof enabled !== 'boolean') {
    throw new Error('enabled must be a boolean');
  }

  try {
    const docRef = getSharedGroupsPreferencesDocRef(db, appId, userId);

    // Get current preference directly (not using getGroupPreference which swallows errors)
    // This allows us to propagate Firestore errors properly
    const docSnap = await getDoc(docRef);
    let currentPref: UserGroupPreference | null = null;

    if (docSnap.exists()) {
      const data = docSnap.data();
      currentPref = data.groupPreferences?.[groupId] || null;
    }

    // If document doesn't exist, create it with setDoc (updateDoc requires existing doc)
    // This handles the race condition where user toggles immediately after joining
    if (!docSnap.exists()) {
      const preference = createDefaultGroupPreference({ shareMyTransactions: enabled });
      // Cast serverTimestamp() through unknown because Firestore's FieldValue type
      // doesn't match the model's Timestamp|null type at write time — the server
      // replaces the sentinel with an actual Timestamp on commit.
      preference.lastToggleAt = serverTimestamp() as unknown as null;
      preference.toggleCountToday = 1;
      preference.toggleCountResetAt = serverTimestamp() as unknown as null;
      await setDoc(
        docRef,
        {
          groupPreferences: {
            [groupId]: preference,
          },
        },
        { merge: true }
      );
      return;
    }

    // Determine if daily count should reset
    const resetAt = currentPref?.toggleCountResetAt ?? null;
    const needsReset = shouldResetUserDailyCount(resetAt);

    // Calculate new toggle count
    const currentCount = currentPref?.toggleCountToday ?? 0;
    const newToggleCount = needsReset ? 1 : currentCount + 1;

    // Build update object with dot notation for nested field updates
    // Use updateDoc (not setDoc) because updateDoc correctly interprets dot-notation as nested field paths
    const updateData: Record<string, unknown> = {
      [`groupPreferences.${groupId}.shareMyTransactions`]: enabled,
      [`groupPreferences.${groupId}.lastToggleAt`]: serverTimestamp(),
      [`groupPreferences.${groupId}.toggleCountToday`]: newToggleCount,
    };

    // Only update toggleCountResetAt when resetting
    if (needsReset) {
      updateData[`groupPreferences.${groupId}.toggleCountResetAt`] = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating shareMyTransactions:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for a user's group preference.
 *
 * Story 14d-v2-1-12c AC#8: Multi-device real-time sync
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @param groupId - Group ID to watch
 * @param callback - Called with updated preference (null if not found or on error)
 * @param onError - Optional callback for error handling (called before callback(null))
 * @returns Unsubscribe function
 */
export function subscribeToUserGroupPreference(
  db: Firestore,
  userId: string,
  appId: string,
  groupId: string,
  callback: (preference: UserGroupPreference | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  // Validate inputs (Story 14d-v2-1-12c ECC Security Review - consistent validation)
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  if (!appId || typeof appId !== 'string') {
    throw new Error('Invalid appId: must be a non-empty string');
  }
  // Story 14d-v2-1-12c ECC Review #2: Enhanced groupId validation with regex
  validateGroupId(groupId);

  const docRef = getSharedGroupsPreferencesDocRef(db, appId, userId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const pref = data.groupPreferences?.[groupId] ?? null;
        callback(pref);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to user group preference:', error);
      // Call onError callback if provided (Story 14d-v2-1-12c Action Item)
      onError?.(error);
      callback(null);
    }
  );
}
