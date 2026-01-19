/**
 * Cloud Function: cleanupCrossUserFcmToken
 *
 * Story 14c.13: FCM Push Notifications for Shared Groups
 * Epic 14c: Household Sharing
 *
 * Callable function that cleans up FCM tokens from other users
 * when a user registers a new token on a shared device.
 *
 * Problem Solved:
 * When users share devices (e.g., family tablet, shared computer),
 * the same FCM token can end up registered to multiple user accounts.
 * This causes notifications intended for User B to appear on User A's
 * device if User B previously logged in on that device.
 *
 * Solution:
 * When User A registers a token, this function deletes that same token
 * from ALL other users' accounts, ensuring the token belongs to only
 * one user at a time.
 *
 * Called from: saveFCMTokenWithTracking() in fcmTokenService.ts
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const logger = functions.logger;

/**
 * Request payload for cleanupCrossUserFcmToken
 */
interface CleanupTokenRequest {
    /** The FCM token to clean up from other users */
    token: string;
}

/**
 * Response payload for cleanupCrossUserFcmToken
 */
interface CleanupTokenResponse {
    success: boolean;
    deletedCount: number;
    error?: string;
}

/**
 * Callable Cloud Function that removes an FCM token from all users
 * except the calling user.
 *
 * This ensures that when a user logs in on a shared device,
 * their FCM token is removed from any previous user's account.
 *
 * @param data - Contains the token to clean up
 * @param context - Contains auth info (requires authenticated user)
 * @returns Count of tokens deleted from other users
 */
export const cleanupCrossUserFcmToken = functions.https.onCall(
    async (data: CleanupTokenRequest, context): Promise<CleanupTokenResponse> => {
        // Require authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated to clean up FCM tokens'
            );
        }

        const callingUserId = context.auth.uid;
        const { token } = data;

        // Validate token parameter
        if (!token || typeof token !== 'string' || token.length < 100) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'A valid FCM token is required'
            );
        }

        logger.info(
            `[cleanupCrossUserFcmToken] User ${callingUserId} cleaning up token from other users`
        );

        try {
            // Query all fcmTokens collections for this token using collection group query
            const snapshot = await db
                .collectionGroup('fcmTokens')
                .where('token', '==', token)
                .get();

            if (snapshot.empty) {
                logger.info('[cleanupCrossUserFcmToken] Token not found in any user account');
                return { success: true, deletedCount: 0 };
            }

            // Filter to find tokens belonging to OTHER users (not the calling user)
            const tokensToDelete = snapshot.docs.filter(doc => {
                // Path: artifacts/{appId}/users/{userId}/fcmTokens/{tokenId}
                const pathParts = doc.ref.path.split('/');
                // userId is at index 3 (0: artifacts, 1: appId, 2: users, 3: userId)
                const tokenOwnerId = pathParts[3];
                return tokenOwnerId !== callingUserId;
            });

            if (tokensToDelete.length === 0) {
                logger.info('[cleanupCrossUserFcmToken] Token only belongs to calling user');
                return { success: true, deletedCount: 0 };
            }

            // Delete tokens from other users
            const batch = db.batch();
            tokensToDelete.forEach(doc => {
                batch.delete(doc.ref);
                logger.info(
                    `[cleanupCrossUserFcmToken] Deleting token from user: ${doc.ref.path.split('/')[3]}`
                );
            });

            await batch.commit();

            logger.info(
                `[cleanupCrossUserFcmToken] Deleted ${tokensToDelete.length} tokens from other users`
            );

            return {
                success: true,
                deletedCount: tokensToDelete.length,
            };
        } catch (error) {
            logger.error('[cleanupCrossUserFcmToken] Error:', error);
            throw new functions.https.HttpsError(
                'internal',
                'Failed to clean up cross-user FCM tokens'
            );
        }
    }
);

/**
 * Admin HTTP function to clean up all FCM tokens for a user except the most recent.
 * Also removes any tokens from this user that are registered to other users.
 *
 * This is a one-time cleanup function to fix cross-user token contamination.
 *
 * Usage: POST /adminCleanupUserTokens?userId=xxx&secret=yyy
 */
export const adminCleanupUserTokens = functions.https.onRequest(
    async (req, res) => {
        // Simple secret check (not for production security, just to prevent accidental calls)
        const secret = req.query.secret as string;
        if (secret !== 'fcm-cleanup-2026') {
            res.status(403).json({ error: 'Invalid secret' });
            return;
        }

        const userId = req.query.userId as string;
        if (!userId) {
            res.status(400).json({ error: 'userId is required' });
            return;
        }

        const appId = 'boletapp-d609f';

        logger.info(`[adminCleanupUserTokens] Starting cleanup for user ${userId}`);

        try {
            // Step 1: Get all tokens for this user
            const userTokensRef = db.collection(`artifacts/${appId}/users/${userId}/fcmTokens`);
            const userTokensSnapshot = await userTokensRef.orderBy('updatedAt', 'desc').get();

            logger.info(`[adminCleanupUserTokens] Found ${userTokensSnapshot.size} tokens for user`);

            const results: {
                userTokensDeleted: number;
                crossUserTokensDeleted: number;
                keptToken: string | null;
                tokenDetails: Array<{ id: string; userAgent: string; action: string }>;
            } = {
                userTokensDeleted: 0,
                crossUserTokensDeleted: 0,
                keptToken: null,
                tokenDetails: [],
            };

            // Step 2: Keep only the most recent token, delete all others
            let isFirst = true;
            const batch = db.batch();

            for (const doc of userTokensSnapshot.docs) {
                const data = doc.data();
                const userAgent = data.userAgent?.substring(0, 80) || 'unknown';

                if (isFirst) {
                    // Keep the most recent token
                    results.keptToken = doc.id;
                    results.tokenDetails.push({ id: doc.id, userAgent, action: 'kept' });
                    isFirst = false;
                } else {
                    // Delete older tokens
                    batch.delete(doc.ref);
                    results.userTokensDeleted++;
                    results.tokenDetails.push({ id: doc.id, userAgent, action: 'deleted' });
                }
            }

            await batch.commit();

            // Step 3: Find and delete this user's tokens from OTHER users' collections
            // (tokens that were registered when this user logged in on another user's device)
            if (userTokensSnapshot.size > 0) {
                const keptTokenData = userTokensSnapshot.docs[0].data();
                const keptTokenValue = keptTokenData.token;

                // Query collection group for this token
                const crossUserSnapshot = await db
                    .collectionGroup('fcmTokens')
                    .where('token', '==', keptTokenValue)
                    .get();

                const crossUserBatch = db.batch();
                for (const doc of crossUserSnapshot.docs) {
                    const pathParts = doc.ref.path.split('/');
                    const tokenOwnerId = pathParts[3];

                    if (tokenOwnerId !== userId) {
                        crossUserBatch.delete(doc.ref);
                        results.crossUserTokensDeleted++;
                        logger.info(`[adminCleanupUserTokens] Deleting cross-user token from ${tokenOwnerId}`);
                    }
                }

                if (results.crossUserTokensDeleted > 0) {
                    await crossUserBatch.commit();
                }
            }

            logger.info(`[adminCleanupUserTokens] Cleanup complete:`, results);
            res.json({
                success: true,
                userId,
                ...results,
            });
        } catch (error) {
            logger.error('[adminCleanupUserTokens] Error:', error);
            res.status(500).json({ error: 'Internal error', details: String(error) });
        }
    }
);

/**
 * Admin endpoint to send a test notification to a user.
 * Usage: GET /adminSendTestNotification?userId=xxx&secret=yyy
 */
export const adminSendTestNotification = functions.https.onRequest(
    async (req, res) => {
        const secret = req.query.secret as string;
        if (secret !== 'fcm-cleanup-2026') {
            res.status(403).json({ error: 'Invalid secret' });
            return;
        }

        const userId = req.query.userId as string;
        if (!userId) {
            res.status(400).json({ error: 'userId is required' });
            return;
        }

        const appId = 'boletapp-d609f';

        try {
            // Get user's FCM tokens
            const tokensRef = db.collection(`artifacts/${appId}/users/${userId}/fcmTokens`);
            const snapshot = await tokensRef.get();

            if (snapshot.empty) {
                res.json({ success: false, error: 'No tokens found for user' });
                return;
            }

            const tokens: string[] = [];
            const tokenDetails: Array<{ id: string; token: string; userAgent: string }> = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                tokens.push(data.token);
                tokenDetails.push({
                    id: doc.id,
                    token: data.token?.substring(0, 30) + '...',
                    userAgent: data.userAgent?.substring(0, 60) || 'unknown',
                });
            });

            logger.info(`[adminSendTestNotification] Sending to ${tokens.length} tokens`);

            // Send test notification using notification field for automatic display
            // This bypasses service worker and uses browser's native notification
            const message: admin.messaging.MulticastMessage = {
                tokens,
                // Notification field - browser displays automatically
                notification: {
                    title: 'Test from Server',
                    body: `Direct test at ${new Date().toLocaleTimeString()}`,
                },
                // Web push specific - required for Chrome
                webpush: {
                    headers: {
                        Urgency: 'high',
                        TTL: '86400',
                    },
                    notification: {
                        title: 'Test from Server',
                        body: `Direct test at ${new Date().toLocaleTimeString()}`,
                        icon: '/pwa-192x192.png',
                        badge: '/badge-72.png',
                        tag: `admin-test-${Date.now()}`,
                        requireInteraction: false,
                    },
                },
                // Android specific
                android: {
                    priority: 'high',
                    ttl: 86400000,
                    notification: {
                        title: 'Test from Server',
                        body: `Direct test at ${new Date().toLocaleTimeString()}`,
                        icon: 'notification_icon',
                        tag: `admin-test-${Date.now()}`,
                    },
                },
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            const results = {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
                tokenDetails,
                responses: response.responses.map((r, i) => ({
                    success: r.success,
                    messageId: r.messageId,
                    error: r.error ? { code: r.error.code, message: r.error.message } : null,
                })),
            };

            logger.info(`[adminSendTestNotification] Results:`, results);
            res.json(results);
        } catch (error) {
            logger.error('[adminSendTestNotification] Error:', error);
            res.status(500).json({ error: 'Internal error', details: String(error) });
        }
    }
);
