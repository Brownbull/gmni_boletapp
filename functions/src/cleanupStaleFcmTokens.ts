/**
 * Cloud Function: cleanupStaleFcmTokens
 *
 * Story 14c.13: FCM Push Notifications for Shared Groups
 * Epic 14c: Household Sharing
 *
 * Scheduled function that runs daily to clean up stale FCM tokens.
 * Tokens that haven't been used in 60 days are deleted.
 *
 * Task 7: Scheduled function for token cleanup
 *
 * Schedule: Runs daily at 3:00 AM UTC
 *
 * Logic:
 * 1. Query all users in artifacts/{appId}/users collection
 * 2. For each user, query their fcmTokens subcollection
 * 3. Delete tokens where lastUsedAt < (now - 60 days)
 * 4. Log summary of cleanup
 *
 * This prevents accumulation of invalid tokens from:
 * - Users who uninstalled the app
 * - Expired browser tokens
 * - Users who disabled notifications but didn't clean up
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// Constants
// ============================================================================

/** App ID for Firestore paths - matches firebaseConfig.projectId used in client */
const APP_ID = 'boletapp-d609f';

/** Token staleness threshold in days */
const STALE_TOKEN_DAYS = 60;

/** Batch size for Firestore operations */
const BATCH_SIZE = 500;

// ============================================================================
// Main Function
// ============================================================================

/**
 * Scheduled function that cleans up stale FCM tokens.
 *
 * Task 7.1 & 7.2: Query and delete stale tokens
 *
 * Runs daily at 3:00 AM UTC to minimize impact on production traffic.
 */
export const cleanupStaleFcmTokens = functions.pubsub
    .schedule('0 3 * * *') // Daily at 3:00 AM UTC
    .timeZone('UTC')
    .onRun(async () => {
        console.log('[cleanupStaleFcmTokens] Starting cleanup...');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - STALE_TOKEN_DAYS);
        const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

        let totalDeleted = 0;
        let totalProcessed = 0;
        let usersProcessed = 0;

        try {
            // Get all users
            const usersRef = db.collection(`artifacts/${APP_ID}/users`);
            const usersSnapshot = await usersRef.get();

            console.log(`[cleanupStaleFcmTokens] Processing ${usersSnapshot.size} users...`);

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;

                // Get stale tokens for this user
                const tokensRef = db.collection(
                    `artifacts/${APP_ID}/users/${userId}/fcmTokens`
                );

                // Query tokens where lastUsedAt < cutoffTimestamp
                // Note: Tokens without lastUsedAt are also considered stale
                const staleTokensQuery = tokensRef.where(
                    'lastUsedAt',
                    '<',
                    cutoffTimestamp
                );

                const staleTokensSnapshot = await staleTokensQuery.get();

                if (!staleTokensSnapshot.empty) {
                    // Delete stale tokens in batches
                    const tokensToDelete = staleTokensSnapshot.docs;
                    totalProcessed += tokensToDelete.length;

                    for (let i = 0; i < tokensToDelete.length; i += BATCH_SIZE) {
                        const chunk = tokensToDelete.slice(i, i + BATCH_SIZE);
                        const batch = db.batch();

                        chunk.forEach(tokenDoc => {
                            batch.delete(tokenDoc.ref);
                        });

                        await batch.commit();
                        totalDeleted += chunk.length;
                    }
                }

                usersProcessed++;
            }

            // Also clean up tokens without lastUsedAt (legacy tokens)
            const legacyDeleted = await cleanupLegacyTokens(cutoffTimestamp);
            totalDeleted += legacyDeleted;

            // Clean up old rate limit documents
            const rateLimitsDeleted = await cleanupRateLimits();

            console.log(
                `[cleanupStaleFcmTokens] Cleanup complete. ` +
                `Users: ${usersProcessed}, ` +
                `Tokens deleted: ${totalDeleted}, ` +
                `Rate limits deleted: ${rateLimitsDeleted}`
            );

            return {
                success: true,
                usersProcessed,
                tokensDeleted: totalDeleted,
                rateLimitsDeleted,
            };
        } catch (error) {
            console.error('[cleanupStaleFcmTokens] Error:', error);
            throw error;
        }
    });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clean up tokens that don't have a lastUsedAt field (legacy tokens).
 *
 * These are tokens created before Story 14c.13 that don't track usage.
 * We consider them stale if createdAt < cutoff.
 */
async function cleanupLegacyTokens(
    cutoffTimestamp: admin.firestore.Timestamp
): Promise<number> {
    let deleted = 0;

    // Use collection group query to find all fcmTokens across all users
    const allTokensQuery = db
        .collectionGroup('fcmTokens')
        .where('createdAt', '<', cutoffTimestamp);

    const snapshot = await allTokensQuery.get();

    if (snapshot.empty) {
        return 0;
    }

    // Filter to only include tokens without lastUsedAt
    const legacyTokens = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.lastUsedAt;
    });

    if (legacyTokens.length === 0) {
        return 0;
    }

    // Delete in batches
    for (let i = 0; i < legacyTokens.length; i += BATCH_SIZE) {
        const chunk = legacyTokens.slice(i, i + BATCH_SIZE);
        const batch = db.batch();

        chunk.forEach(tokenDoc => {
            batch.delete(tokenDoc.ref);
        });

        await batch.commit();
        deleted += chunk.length;
    }

    console.log(`[cleanupStaleFcmTokens] Deleted ${deleted} legacy tokens`);
    return deleted;
}

/**
 * Clean up old rate limit documents.
 *
 * Rate limit docs older than 24 hours can be deleted to prevent
 * collection bloat.
 */
async function cleanupRateLimits(): Promise<number> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(oneDayAgo);

    const rateLimitsRef = db.collection('notificationRateLimits');
    const oldRateLimitsQuery = rateLimitsRef.where(
        'lastSentAt',
        '<',
        cutoffTimestamp
    );

    const snapshot = await oldRateLimitsQuery.get();

    if (snapshot.empty) {
        return 0;
    }

    let deleted = 0;

    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
        const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
        const batch = db.batch();

        chunk.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        deleted += chunk.length;
    }

    return deleted;
}
