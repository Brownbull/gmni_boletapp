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
 * User preferences stored in Firestore
 */
export interface UserPreferences {
  /** Default currency for receipt scanning */
  defaultCurrency: SupportedCurrency;
  /** Timestamp when preferences were last updated */
  updatedAt?: any;
}

/**
 * Default preferences for new users
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  defaultCurrency: 'CLP',
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
