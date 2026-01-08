/**
 * FCM Token Service - Story 9.18
 *
 * Manages FCM token storage in Firestore.
 * Stores tokens in user's subcollection for sending push notifications.
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
  limit
} from 'firebase/firestore';

/**
 * FCM Token document stored in Firestore
 */
export interface FCMTokenDoc {
  token: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userAgent: string;
  platform: 'web';
}

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
