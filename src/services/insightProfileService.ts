/**
 * Insight Profile Service
 *
 * Story 10.2: Phase Detection & User Profile
 * Architecture: architecture-epic10-insight-engine.md
 * Pattern: Functional module matching existing firestore.ts pattern
 *
 * Key ADRs:
 * - ADR-015: Client-Side Engine
 * - ADR-016: Hybrid Storage (Firestore for durable profile data)
 * - ADR-017: Phase-Based Priority System
 *
 * Firestore Document Path:
 * artifacts/{appId}/users/{userId}/insightProfile/profile
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Firestore,
  Timestamp,
  increment,
  FieldValue,
} from 'firebase/firestore';
import { UserInsightProfile, InsightRecord, MAX_RECENT_INSIGHTS } from '../types/insight';

const PROFILE_DOC_ID = 'profile';

// ============================================================================
// Profile CRUD Operations
// ============================================================================

/**
 * Gets the user's insight profile, creating one if it doesn't exist.
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 * @returns The user's insight profile
 */
export async function getOrCreateInsightProfile(
  db: Firestore,
  userId: string,
  appId: string
): Promise<UserInsightProfile> {
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    return snapshot.data() as UserInsightProfile;
  }

  // Create new profile with null firstTransactionDate
  // (will be set on first transaction save)
  const newProfile: UserInsightProfile = {
    schemaVersion: 1,
    firstTransactionDate: null as unknown as Timestamp,
    totalTransactions: 0,
    recentInsights: [],
  };

  await setDoc(profileRef, newProfile);
  return newProfile;
}

/**
 * Gets the user's insight profile if it exists.
 * Returns null if profile doesn't exist (unlike getOrCreate which creates one).
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 * @returns The user's insight profile or null
 */
export async function getInsightProfile(
  db: Firestore,
  userId: string,
  appId: string
): Promise<UserInsightProfile | null> {
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    return snapshot.data() as UserInsightProfile;
  }

  return null;
}

// ============================================================================
// Transaction Tracking
// ============================================================================

/**
 * Updates the first transaction date if this is the user's first transaction.
 * Also increments the total transaction count.
 *
 * This function should be called after a transaction is saved.
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 * @param transactionDate - Date of the transaction being saved
 */
export async function trackTransactionForProfile(
  db: Firestore,
  userId: string,
  appId: string,
  transactionDate: Date
): Promise<void> {
  const profile = await getOrCreateInsightProfile(db, userId, appId);
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  // Build update object
  const updateData: Record<string, FieldValue | Timestamp> = {
    totalTransactions: increment(1),
  };

  // Set firstTransactionDate only if it's not already set
  if (!profile.firstTransactionDate) {
    updateData.firstTransactionDate = Timestamp.fromDate(transactionDate);
  }

  await updateDoc(profileRef, updateData);
}

/**
 * Sets the first transaction date explicitly.
 * Used when loading existing transactions to establish profile baseline.
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 * @param firstDate - The date of the user's first transaction
 */
export async function setFirstTransactionDate(
  db: Firestore,
  userId: string,
  appId: string,
  firstDate: Date
): Promise<void> {
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  // Ensure profile exists
  await getOrCreateInsightProfile(db, userId, appId);

  await updateDoc(profileRef, {
    firstTransactionDate: Timestamp.fromDate(firstDate),
  });
}

// ============================================================================
// Insight Recording
// ============================================================================

/**
 * Records that an insight was shown to the user.
 * Maintains a maximum of MAX_RECENT_INSIGHTS (50) entries for cooldown checking and history display.
 *
 * Story 10a.5: Stores full insight content for history display.
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 * @param insightId - The insight identifier that was shown
 * @param transactionId - Optional: The transaction that triggered this insight
 * @param fullInsight - Optional: Full insight content for history display
 *   - title: Short insight title (e.g., "Visita frecuente")
 *   - message: Detailed message (e.g., "3ra vez en Jumbo este mes")
 *   - icon: Lucide icon name (e.g., "Repeat")
 *   - category: InsightCategory for styling (QUIRKY_FIRST | CELEBRATORY | ACTIONABLE)
 */
export async function recordInsightShown(
  db: Firestore,
  userId: string,
  appId: string,
  insightId: string,
  transactionId?: string,
  fullInsight?: { title?: string; message?: string; icon?: string; category?: string }
): Promise<void> {
  const profile = await getOrCreateInsightProfile(db, userId, appId);
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  // Create new insight record with full content (Story 10a.5)
  const newRecord: InsightRecord = {
    insightId,
    shownAt: Timestamp.now(),
    ...(transactionId && { transactionId }),
    ...(fullInsight?.title && { title: fullInsight.title }),
    ...(fullInsight?.message && { message: fullInsight.message }),
    ...(fullInsight?.icon && { icon: fullInsight.icon }),
    ...(fullInsight?.category && { category: fullInsight.category as InsightRecord['category'] }),
  };

  // Add new record and trim to MAX_RECENT_INSIGHTS
  const updatedInsights = [...profile.recentInsights, newRecord].slice(-MAX_RECENT_INSIGHTS);

  await updateDoc(profileRef, {
    recentInsights: updatedInsights,
  });
}

/**
 * Deletes a specific insight from the user's recent insights.
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 * @param insightId - The insight identifier to delete
 * @param shownAtSeconds - The shownAt timestamp seconds to uniquely identify the insight
 */
export async function deleteInsight(
  db: Firestore,
  userId: string,
  appId: string,
  insightId: string,
  shownAtSeconds: number
): Promise<void> {
  const profile = await getOrCreateInsightProfile(db, userId, appId);
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  // Filter out the insight matching both insightId and shownAt timestamp
  const updatedInsights = profile.recentInsights.filter(
    (insight) =>
      !(insight.insightId === insightId && insight.shownAt.seconds === shownAtSeconds)
  );

  await updateDoc(profileRef, {
    recentInsights: updatedInsights,
  });
}

/**
 * Deletes multiple insights from the user's recent insights.
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 * @param insightsToDelete - Array of {insightId, shownAtSeconds} to delete
 */
export async function deleteInsights(
  db: Firestore,
  userId: string,
  appId: string,
  insightsToDelete: Array<{ insightId: string; shownAtSeconds: number }>
): Promise<void> {
  const profile = await getOrCreateInsightProfile(db, userId, appId);
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  // Create a Set for fast lookup
  const deleteSet = new Set(
    insightsToDelete.map((i) => `${i.insightId}:${i.shownAtSeconds}`)
  );

  // Filter out all matching insights
  const updatedInsights = profile.recentInsights.filter(
    (insight) => !deleteSet.has(`${insight.insightId}:${insight.shownAt.seconds}`)
  );

  await updateDoc(profileRef, {
    recentInsights: updatedInsights,
  });
}

/**
 * Clears all recent insights from the profile.
 * Useful for testing or resetting user experience.
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 */
export async function clearRecentInsights(
  db: Firestore,
  userId: string,
  appId: string
): Promise<void> {
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  // Ensure profile exists
  await getOrCreateInsightProfile(db, userId, appId);

  await updateDoc(profileRef, {
    recentInsights: [],
  });
}

// ============================================================================
// Profile Reset
// ============================================================================

/**
 * Resets the insight profile to initial state.
 * Preserves firstTransactionDate but clears insights and resets count.
 *
 * @param db - Firestore instance
 * @param userId - User's auth UID
 * @param appId - Application ID
 */
export async function resetInsightProfile(
  db: Firestore,
  userId: string,
  appId: string
): Promise<void> {
  const profileRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'insightProfile',
    PROFILE_DOC_ID
  );

  // Ensure profile exists and get current firstTransactionDate
  const profile = await getOrCreateInsightProfile(db, userId, appId);

  await updateDoc(profileRef, {
    totalTransactions: 0,
    recentInsights: [],
    // Keep firstTransactionDate unchanged
    firstTransactionDate: profile.firstTransactionDate,
  });
}
