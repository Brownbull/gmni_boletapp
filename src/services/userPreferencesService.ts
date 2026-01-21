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
  deleteField,
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
 * View mode preference for shared groups
 * Story 14c.18: Persisted preference for personal vs group mode
 */
export interface ViewModePreference {
  /** Current mode: personal or group */
  mode: 'personal' | 'group';
  /** Group ID when mode is 'group' */
  groupId?: string;
  /** Timestamp of last update (for sync conflict resolution) */
  updatedAt?: any;
}

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
  /** Story 14c.18: View mode preference (personal vs group) */
  viewModePreference?: ViewModePreference;
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
        // Story 14c.18: View mode preference (personal vs group)
        viewModePreference: data.viewModePreference,
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

// =============================================================================
// Story 14c.18: View Mode Preference Functions
// =============================================================================

/** localStorage key for offline fallback */
export const VIEW_MODE_PREFERENCE_KEY = 'boletapp_view_mode_preference';

/**
 * Save view mode preference to Firestore with offline fallback to localStorage
 * Story 14c.18: AC1, AC6, AC7
 *
 * @param db - Firestore instance
 * @param userId - User ID from Firebase Auth
 * @param appId - Application ID
 * @param preference - View mode preference to save
 */
export async function saveViewModePreference(
  db: Firestore,
  userId: string,
  appId: string,
  preference: Omit<ViewModePreference, 'updatedAt'>
): Promise<void> {
  // Always save to localStorage first (offline support - AC7)
  try {
    localStorage.setItem(VIEW_MODE_PREFERENCE_KEY, JSON.stringify(preference));
  } catch (error) {
    // localStorage might be disabled or full
    if (import.meta.env.DEV) {
      console.warn('[ViewModePreference] Failed to save to localStorage:', error);
    }
  }

  // Save to Firestore
  // Story 14c.20 bug fix: Firestore doesn't accept undefined values
  // Use deleteField() to remove groupId when switching to personal mode
  try {
    const docRef = getPreferencesDocRef(db, appId, userId);
    // Story 14c.23 Fix: Firestore doesn't accept undefined values
    // Use deleteField() for undefined groupId when in personal mode
    const viewModeData: Record<string, unknown> = {
      mode: preference.mode,
      updatedAt: serverTimestamp(),
    };
    // Only include groupId if it's defined (group mode)
    // Use deleteField() to remove the field when switching to personal mode
    if (preference.groupId !== undefined) {
      viewModeData.groupId = preference.groupId;
    } else {
      viewModeData.groupId = deleteField();
    }
    await setDoc(
      docRef,
      {
        viewModePreference: viewModeData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[ViewModePreference] Error saving to Firestore:', error);
    // Don't throw - localStorage fallback is available
  }
}

/**
 * Load view mode preference from localStorage (for offline/quick access)
 * Story 14c.18: AC7
 *
 * @returns View mode preference or undefined if not found
 */
export function loadLocalViewModePreference(): ViewModePreference | undefined {
  try {
    const stored = localStorage.getItem(VIEW_MODE_PREFERENCE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ViewModePreference;
      // Validate structure
      if (parsed.mode === 'personal' || parsed.mode === 'group') {
        return parsed;
      }
    }
  } catch {
    // Invalid JSON or other error
  }
  return undefined;
}

/**
 * Clear local view mode preference (for logout)
 */
export function clearLocalViewModePreference(): void {
  try {
    localStorage.removeItem(VIEW_MODE_PREFERENCE_KEY);
  } catch {
    // Ignore errors
  }
}
