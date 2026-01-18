/**
 * Web Push Service using VAPID
 *
 * Story 14c.13: Alternative notification delivery using web-push library
 *
 * Uses the web-push npm library with VAPID keys for reliable
 * cross-browser push notification delivery, especially on Android Chrome.
 *
 * Benefits over FCM data-only messages:
 * - Works when PWA is closed (browser handles push directly)
 * - No service worker required for initial notification display
 * - More reliable on Chrome Android
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import webpush from 'web-push';

// Initialize admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const logger = functions.logger;

// VAPID keys - generated for this project
// In production, move these to environment variables
const VAPID_PUBLIC_KEY = 'BASuONCHNOt_Vzw6Pm5ab8WdcP59y7EmDCGkvjaG4HmCrD38Ls0iEi5UTnQR8_y3pjXIQ_lYHnxjv45whnPjou8';
const VAPID_PRIVATE_KEY = 'ZuJXbXCU_sZIm1YegbUL4dS5Pqtyy4XOA7Id3z9JgWc';
const VAPID_SUBJECT = 'mailto:notifications@boletapp.com';

// Configure web-push with VAPID details
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/**
 * Push subscription object as stored in Firestore
 */
interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt?: admin.firestore.Timestamp;
    updatedAt?: admin.firestore.Timestamp;
    userAgent?: string;
}

/**
 * Notification payload
 */
interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    data?: Record<string, unknown>;
}

/**
 * Save a web push subscription for a user
 * Callable function for client-side subscription saving
 */
export const saveWebPushSubscription = functions.https.onCall(
    async (data: { subscription: PushSubscription }, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = context.auth.uid;
        const { subscription } = data;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid subscription object'
            );
        }

        const appId = 'boletapp-d609f';
        const subscriptionId = hashEndpoint(subscription.endpoint);

        logger.info(`[WebPush] Saving subscription for user ${userId}`);

        try {
            // Step 1: Delete all existing subscriptions for this user (single device policy)
            const userSubsRef = db.collection(`artifacts/${appId}/users/${userId}/pushSubscriptions`);
            const existingSubs = await userSubsRef.get();

            if (!existingSubs.empty) {
                const batch = db.batch();
                existingSubs.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                logger.info(`[WebPush] Deleted ${existingSubs.size} existing subscriptions for user`);
            }

            // Step 2: Delete this endpoint from OTHER users (cross-user cleanup)
            const allSubsWithEndpoint = await db
                .collectionGroup('pushSubscriptions')
                .where('endpoint', '==', subscription.endpoint)
                .get();

            if (!allSubsWithEndpoint.empty) {
                const crossUserBatch = db.batch();
                let crossUserCount = 0;
                allSubsWithEndpoint.docs.forEach(doc => {
                    const pathParts = doc.ref.path.split('/');
                    const tokenOwnerId = pathParts[3];
                    if (tokenOwnerId !== userId) {
                        crossUserBatch.delete(doc.ref);
                        crossUserCount++;
                    }
                });

                if (crossUserCount > 0) {
                    await crossUserBatch.commit();
                    logger.info(`[WebPush] Deleted ${crossUserCount} cross-user subscriptions`);
                }
            }

            // Step 3: Save the new subscription
            await db.doc(`artifacts/${appId}/users/${userId}/pushSubscriptions/${subscriptionId}`).set({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                userAgent: data.subscription.userAgent || 'unknown',
            });

            return { success: true };
        } catch (error) {
            logger.error('[WebPush] Error saving subscription:', error);
            throw new functions.https.HttpsError('internal', 'Failed to save subscription');
        }
    }
);

/**
 * Delete a web push subscription
 * Callable function for logout cleanup
 */
export const deleteWebPushSubscription = functions.https.onCall(
    async (data: { endpoint?: string }, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = context.auth.uid;
        const appId = 'boletapp-d609f';

        logger.info(`[WebPush] Deleting subscriptions for user ${userId}`);

        try {
            const userSubsRef = db.collection(`artifacts/${appId}/users/${userId}/pushSubscriptions`);
            const snapshot = await userSubsRef.get();

            if (snapshot.empty) {
                return { success: true, deletedCount: 0 };
            }

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            return { success: true, deletedCount: snapshot.size };
        } catch (error) {
            logger.error('[WebPush] Error deleting subscriptions:', error);
            throw new functions.https.HttpsError('internal', 'Failed to delete subscriptions');
        }
    }
);

/**
 * Send web push notification to a user
 *
 * @param userId Target user ID
 * @param notification Notification payload
 * @returns Number of successful sends
 */
export async function sendWebPushToUser(
    userId: string,
    notification: NotificationPayload
): Promise<{ sent: number; total: number; errors: string[] }> {
    const appId = 'boletapp-d609f';

    const subsRef = db.collection(`artifacts/${appId}/users/${userId}/pushSubscriptions`);
    const snapshot = await subsRef.get();

    if (snapshot.empty) {
        logger.info(`[WebPush] No subscriptions for user ${userId}`);
        return { sent: 0, total: 0, errors: [] };
    }

    logger.info(`[WebPush] Sending to ${snapshot.size} subscription(s) for user ${userId}`);

    const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/pwa-192x192.png',
        badge: notification.badge || '/badge-72.png',
        url: notification.url || '/',
        tag: notification.tag,
        data: notification.data,
    });

    let sent = 0;
    const errors: string[] = [];

    for (const doc of snapshot.docs) {
        const sub = doc.data() as PushSubscription;

        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys.p256dh,
                        auth: sub.keys.auth,
                    },
                },
                payload,
                {
                    TTL: 86400, // 24 hours
                    urgency: 'high',
                }
            );
            sent++;
            logger.info(`[WebPush] Sent to ${sub.endpoint.substring(0, 50)}...`);
        } catch (error: unknown) {
            const webPushError = error as { statusCode?: number; body?: string };

            // Handle expired/invalid subscriptions (410 Gone)
            if (webPushError.statusCode === 410) {
                logger.info('[WebPush] Subscription expired, removing');
                await doc.ref.delete();
                errors.push('Subscription expired (removed)');
            } else if (webPushError.statusCode === 404) {
                logger.info('[WebPush] Subscription not found, removing');
                await doc.ref.delete();
                errors.push('Subscription not found (removed)');
            } else {
                logger.error('[WebPush] Send failed:', webPushError);
                errors.push(`Status ${webPushError.statusCode}: ${webPushError.body || 'Unknown error'}`);
            }
        }
    }

    logger.info(`[WebPush] Sent ${sent}/${snapshot.size} notifications to user ${userId}`);
    return { sent, total: snapshot.size, errors };
}

/**
 * Admin test endpoint for web push notifications
 * Usage: GET /adminTestWebPush?userId=xxx&secret=yyy
 */
export const adminTestWebPush = functions.https.onRequest(
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

        try {
            const result = await sendWebPushToUser(userId, {
                title: 'Test Web Push',
                body: `Direct test at ${new Date().toLocaleTimeString()}`,
                icon: '/pwa-192x192.png',
                tag: `web-push-test-${Date.now()}`,
                url: '/',
            });

            res.json({
                success: true,
                ...result,
                message: result.sent > 0
                    ? `Sent ${result.sent} notification(s)`
                    : 'No subscriptions found - user needs to enable notifications with web push'
            });
        } catch (error) {
            logger.error('[adminTestWebPush] Error:', error);
            res.status(500).json({ error: 'Internal error', details: String(error) });
        }
    }
);

/**
 * Get VAPID public key for client-side subscription
 */
export const getVapidPublicKey = functions.https.onRequest(
    async (_req, res) => {
        res.json({ publicKey: VAPID_PUBLIC_KEY });
    }
);

/**
 * Hash an endpoint URL to create a document ID
 */
function hashEndpoint(endpoint: string): string {
    // Use base64 of last 40 chars of endpoint for unique but manageable ID
    const suffix = endpoint.slice(-40);
    return Buffer.from(suffix).toString('base64').replace(/[/+=]/g, '_').slice(0, 30);
}
