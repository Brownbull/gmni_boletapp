/**
 * FCM Token Service
 *
 * Story 9.18: Initial FCM token storage
 * Story 14c.13: FCM Push Notifications for Shared Groups
 *
 * Manages FCM token storage in Firestore.
 * Stores tokens in user's subcollection for sending push notifications.
 *
 * Collection: artifacts/{appId}/users/{userId}/fcmTokens/{tokenId}
 */

import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
  limit,
  updateDoc,
} from 'firebase/firestore';

/**
 * Device type for FCM token.
 * Currently 'web' only; Android/iOS for native apps.
 */
export type FcmDeviceType = 'web' | 'android' | 'ios';

/**
 * FCM Token document stored in Firestore
 *
 * Story 14c.13: Extended with deviceType and lastUsedAt for token management
 */
export interface FCMTokenDoc {
  /** Firestore document ID */
  id?: string;
  /** The FCM registration token string */
  token: string;
  /** Timestamp when token was first created */
  createdAt: Timestamp;
  /** Timestamp when token was last updated */
  updatedAt: Timestamp;
  /** Timestamp when token was last used (updated on app startup) */
  lastUsedAt?: Timestamp;
  /** Browser/device user agent */
  userAgent: string;
  /** Device platform */
  platform: FcmDeviceType;
}

/**
 * Constants for FCM token management
 * Story 14c.13: Token staleness threshold for cleanup
 */
export const FCM_TOKEN_CONSTANTS = {
  /** LocalStorage key for notification enabled state */
  LOCAL_STORAGE_KEY: 'fcm_notifications_enabled',
  /** LocalStorage key for current token (for comparison) */
  LOCAL_STORAGE_TOKEN_KEY: 'fcm_current_token',
  /** Token staleness threshold in days (cleanup tokens older than this) */
  STALE_TOKEN_DAYS: 60,
  /** Rate limit for notifications (ms) - 1 notification per minute per group per user */
  RATE_LIMIT_MS: 60 * 1000,
} as const;

/**
 * Get the collection path for FCM tokens
 */
function getTokensCollectionPath(appId: string, userId: string): string {
  return `artifacts/${appId}/users/${userId}/fcmTokens`;
}

/**
 * Save or update an FCM token for a user
 * Uses token as document ID to prevent duplicates
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param token FCM token to save
 */
export async function saveFCMToken(
  db: Firestore,
  userId: string,
  appId: string,
  token: string
): Promise<void> {
  const collectionPath = getTokensCollectionPath(appId, userId);
  const tokenDocRef = doc(db, collectionPath, hashToken(token));

  await setDoc(tokenDocRef, {
    token,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    userAgent: navigator.userAgent,
    platform: 'web'
  }, { merge: true });
}

/**
 * Delete an FCM token (e.g., on sign-out)
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param token FCM token to delete
 */
export async function deleteFCMToken(
  db: Firestore,
  userId: string,
  appId: string,
  token: string
): Promise<void> {
  const collectionPath = getTokensCollectionPath(appId, userId);
  const tokenDocRef = doc(db, collectionPath, hashToken(token));

  await deleteDoc(tokenDocRef);
}

/**
 * Delete all FCM tokens for a user (e.g., on sign-out from all devices)
 * Story 14.26: Uses writeBatch for atomic, cost-efficient deletion
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 */
export async function deleteAllFCMTokens(
  db: Firestore,
  userId: string,
  appId: string
): Promise<void> {
  const collectionPath = getTokensCollectionPath(appId, userId);
  const tokensRef = collection(db, collectionPath);
  const snapshot = await getDocs(tokensRef);

  if (snapshot.empty) return;

  // Story 14.26: Use writeBatch with chunking for atomic deletion
  // Firestore batch limit is 500 operations (users typically have <10 tokens)
  const BATCH_SIZE = 500;
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

/**
 * Check if a token already exists for this user
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param token FCM token to check
 */
export async function tokenExists(
  db: Firestore,
  userId: string,
  appId: string,
  token: string
): Promise<boolean> {
  const collectionPath = getTokensCollectionPath(appId, userId);
  const tokensRef = collection(db, collectionPath);
  // Story 14.26: Add limit(1) to reduce reads - we only need to know if it exists
  const q = query(tokensRef, where('token', '==', token), limit(1));
  const snapshot = await getDocs(q);

  return !snapshot.empty;
}

/**
 * Hash a token to create a safe document ID
 * Uses a simple hash function - tokens are already random strings
 */
function hashToken(token: string): string {
  // Use first 20 chars + last 10 chars to create a unique but shorter ID
  // FCM tokens are typically 150+ chars, so this creates a manageable doc ID
  if (token.length <= 30) return token;
  return `${token.slice(0, 20)}_${token.slice(-10)}`;
}

// ============================================================================
// Story 14c.13: Additional FCM Token Management Functions
// ============================================================================

/**
 * Update the lastUsedAt timestamp for a token.
 *
 * Task 1.6: Update lastUsedAt on app startup if token exists
 *
 * Should be called on app startup to keep tokens fresh and
 * allow the cleanup function to identify stale tokens.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param token FCM token string to update
 */
export async function updateTokenLastUsed(
  db: Firestore,
  userId: string,
  appId: string,
  token: string
): Promise<void> {
  const collectionPath = getTokensCollectionPath(appId, userId);
  const tokenDocRef = doc(db, collectionPath, hashToken(token));

  try {
    await updateDoc(tokenDocRef, {
      lastUsedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (import.meta.env.DEV) {
      console.log('[fcmTokenService] Updated token lastUsedAt on startup');
    }
  } catch (error) {
    // Token may not exist yet, which is fine
    if (import.meta.env.DEV) {
      console.log('[fcmTokenService] Token not found for lastUsedAt update (may be new device)');
    }
  }
}

/**
 * Get all FCM tokens for a user.
 * Used for debugging and token management UI.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @returns Array of FCM token documents
 */
export async function getUserFCMTokens(
  db: Firestore,
  userId: string,
  appId: string
): Promise<FCMTokenDoc[]> {
  const collectionPath = getTokensCollectionPath(appId, userId);
  const tokensRef = collection(db, collectionPath);
  const snapshot = await getDocs(tokensRef);

  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  } as FCMTokenDoc));
}

/**
 * Save FCM token with localStorage tracking.
 *
 * IMPORTANT: This function implements a "single device per user" policy:
 * - First deletes ALL existing FCM tokens for this user
 * - Then saves the new token for the current device
 *
 * This ensures that notifications are only delivered to the device
 * where the user most recently logged in or enabled notifications.
 *
 * Why single device policy:
 * - FCM tokens are device-specific but get registered to user accounts
 * - If user logs into multiple devices, all devices would get notifications
 * - When users share devices (account switching), old tokens linger
 * - Single device ensures predictable notification delivery
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param token FCM token to save
 */
export async function saveFCMTokenWithTracking(
  db: Firestore,
  userId: string,
  appId: string,
  token: string
): Promise<void> {
  // STEP 1: Delete ALL existing tokens for this user
  // This ensures only the current device receives notifications
  try {
    await deleteAllFCMTokens(db, userId, appId);
    if (import.meta.env.DEV) {
      console.log('[fcmTokenService] Deleted all existing tokens for user');
    }
  } catch (error) {
    // Log but continue - saving new token is more important
    console.warn('[fcmTokenService] Failed to delete existing tokens:', error);
  }

  // STEP 2: Save the new token for this device
  const collectionPath = getTokensCollectionPath(appId, userId);
  const tokenDocRef = doc(db, collectionPath, hashToken(token));

  await setDoc(tokenDocRef, {
    token,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastUsedAt: serverTimestamp(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    platform: 'web' as FcmDeviceType,
  }, { merge: true });

  // Store token in localStorage for comparison
  try {
    localStorage.setItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_TOKEN_KEY, token);
    localStorage.setItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_KEY, 'true');
  } catch {
    // Ignore localStorage errors (e.g., private browsing)
  }

  if (import.meta.env.DEV) {
    console.log('[fcmTokenService] Saved FCM token (single device policy)');
  }
}

/**
 * Delete all FCM tokens for a user and clear localStorage.
 *
 * Extended version that also clears localStorage flags.
 * Used when user disables notifications.
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 */
export async function deleteAllFCMTokensWithTracking(
  db: Firestore,
  userId: string,
  appId: string
): Promise<void> {
  // Delete from Firestore
  await deleteAllFCMTokens(db, userId, appId);

  // Clear localStorage
  try {
    localStorage.removeItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_TOKEN_KEY);
    localStorage.removeItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }

  if (import.meta.env.DEV) {
    console.log('[fcmTokenService] Deleted all FCM tokens and cleared localStorage');
  }
}

/**
 * Check if notifications are enabled in localStorage.
 * Used for quick UI state without Firestore query.
 *
 * @returns true if notifications were previously enabled
 */
export function isNotificationsEnabledLocal(): boolean {
  try {
    return localStorage.getItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Get the stored FCM token from localStorage.
 * Used for quick comparison without Firestore query.
 *
 * @returns The stored token or null
 */
export function getStoredFCMToken(): string | null {
  try {
    return localStorage.getItem(FCM_TOKEN_CONSTANTS.LOCAL_STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}
