/**
 * Cloud Function: sendSharedGroupNotification
 *
 * Story 14c.13: FCM Push Notifications for Shared Groups
 * Story 14c.13-WP: Migrated to Web Push (VAPID) for better Android support
 * Epic 14c: Household Sharing
 *
 * Firestore trigger that sends push notifications when a transaction
 * is tagged to a shared group. Notifies other group members.
 *
 * Trigger: onWrite for /artifacts/{appId}/users/{userId}/transactions/{transactionId}
 *
 * Logic:
 * 1. Check if transaction has sharedGroupIds (new or updated)
 * 2. For each shared group, fetch group members
 * 3. Get push subscriptions for each member (excluding the transaction owner)
 * 4. Send notification with group name and transaction details via web-push
 *
 * Rate Limiting (AC8):
 * - Tracks last notification timestamp per group per user
 * - Only sends if > 1 minute since last notification
 * - Prevents notification spam when batch-tagging transactions
 *
 * Notification Collapsing:
 * - Uses group ID as notification tag
 * - Same-group notifications replace previous ones
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import webpush from 'web-push';

// Use functions.logger for better Cloud Logging visibility
const logger = functions.logger;

// Initialize admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// VAPID Configuration (Web Push)
// ============================================================================

const VAPID_PUBLIC_KEY = 'BASuONCHNOt_Vzw6Pm5ab8WdcP59y7EmDCGkvjaG4HmCrD38Ls0iEi5UTnQR8_y3pjXIQ_lYHnxjv45whnPjou8';
const VAPID_PRIVATE_KEY = 'ZuJXbXCU_sZIm1YegbUL4dS5Pqtyy4XOA7Id3z9JgWc';
const VAPID_SUBJECT = 'mailto:notifications@boletapp.com';

// Configure web-push with VAPID details
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// ============================================================================
// Types
// ============================================================================

interface TransactionData {
    merchant?: string;
    total?: number;
    date?: string;
    sharedGroupIds?: string[];
    currency?: string;
}

/** Type of notification to send */
type NotificationType = 'TRANSACTION_ADDED' | 'TRANSACTION_REMOVED';

interface SharedGroupData {
    name: string;
    icon?: string;
    color?: string;
    members: string[];
    memberProfiles?: Record<string, { displayName?: string; email?: string }>;
}

/** Push subscription stored in Firestore */
interface PushSubscriptionDoc {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt?: admin.firestore.Timestamp;
    updatedAt?: admin.firestore.Timestamp;
}

// ============================================================================
// Constants
// ============================================================================

/** Rate limit in milliseconds (1 minute) - AC8 */
const RATE_LIMIT_MS = 60 * 1000;

/** App ID for Firestore paths - matches firebaseConfig.projectId used in client */
const APP_ID = 'boletapp-d609f';

/** Firestore collection for rate limit tracking */
const RATE_LIMIT_COLLECTION = 'notificationRateLimits';

// ============================================================================
// Main Function
// ============================================================================

/**
 * Firestore trigger that sends FCM notifications when transactions
 * are tagged to shared groups.
 *
 * Task 5.1: Firestore trigger on transaction writes
 */
export const sendSharedGroupNotification = functions.firestore
    .document('artifacts/{appId}/users/{userId}/transactions/{transactionId}')
    .onWrite(async (change, context) => {
        const { appId, userId, transactionId } = context.params;

        logger.info(`[sendSharedGroupNotification] Trigger fired: appId=${appId}, userId=${userId}, txnId=${transactionId}`);

        // Only process boletapp transactions
        if (appId !== APP_ID) {
            logger.info(`[sendSharedGroupNotification] Skipping: appId ${appId} !== expected ${APP_ID}`);
            return;
        }

        // Get before and after data
        const before = change.before.exists ? (change.before.data() as TransactionData) : null;
        const after = change.after.exists ? (change.after.data() as TransactionData) : null;

        logger.info(`[sendSharedGroupNotification] before sharedGroupIds:`, before?.sharedGroupIds);
        logger.info(`[sendSharedGroupNotification] after sharedGroupIds:`, after?.sharedGroupIds);

        // Deletion - no notification needed
        if (!after) {
            logger.info(`[sendSharedGroupNotification] Skipping: transaction deleted`);
            return;
        }

        // Task 5.2: Check if transaction has sharedGroupIds
        const newGroupIds = after.sharedGroupIds || [];
        const oldGroupIds = before?.sharedGroupIds || [];

        // Find newly added groups (groups not in before but in after)
        const addedGroups = newGroupIds.filter(gid => !oldGroupIds.includes(gid));
        // Find removed groups (groups in before but not in after)
        const removedGroups = oldGroupIds.filter(gid => !newGroupIds.includes(gid));

        logger.info(`[sendSharedGroupNotification] newGroupIds:`, newGroupIds, `oldGroupIds:`, oldGroupIds, `addedGroups:`, addedGroups, `removedGroups:`, removedGroups);

        // No changes to groups - no notification
        if (addedGroups.length === 0 && removedGroups.length === 0) {
            logger.info(`[sendSharedGroupNotification] Skipping: no group changes`);
            return;
        }

        // Task 5.3 & 5.4: Process each added group
        for (const groupId of addedGroups) {
            try {
                logger.info(`[sendSharedGroupNotification] Transaction ${transactionId} added to group:`, groupId);
                await processGroupNotification(
                    groupId,
                    userId,
                    transactionId,
                    after,
                    'TRANSACTION_ADDED'
                );
            } catch (error) {
                logger.error(`[sendSharedGroupNotification] Error processing added group ${groupId}:`, error);
                // Continue with other groups even if one fails
            }
        }

        // Process each removed group - notify members that transaction was removed
        for (const groupId of removedGroups) {
            try {
                logger.info(`[sendSharedGroupNotification] Transaction ${transactionId} removed from group:`, groupId);
                // Use before data since after no longer has the group context
                await processGroupNotification(
                    groupId,
                    userId,
                    transactionId,
                    before!,
                    'TRANSACTION_REMOVED'
                );
            } catch (error) {
                logger.error(`[sendSharedGroupNotification] Error processing removed group ${groupId}:`, error);
                // Continue with other groups even if one fails
            }
        }
    });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Process notification for a single group.
 *
 * Task 5.3: Fetch group members and member push subscriptions
 * Task 5.4: Send web push notification
 */
async function processGroupNotification(
    groupId: string,
    ownerId: string,
    transactionId: string,
    transaction: TransactionData,
    notificationType: NotificationType
): Promise<void> {
    // Fetch group document
    const groupDoc = await db.doc(`sharedGroups/${groupId}`).get();

    if (!groupDoc.exists) {
        logger.warn(`[sendSharedGroupNotification] Group ${groupId} not found`);
        return;
    }

    const groupData = groupDoc.data() as SharedGroupData;
    const members = groupData.members || [];

    // Log member filtering details for debugging
    logger.info(`[sendSharedGroupNotification] Group ${groupId} members:`, members);
    logger.info(`[sendSharedGroupNotification] Transaction owner (excluded):`, ownerId);

    // Get other members (exclude the transaction owner)
    const otherMembers = members.filter(memberId => memberId !== ownerId);

    logger.info(`[sendSharedGroupNotification] Recipients (other members):`, otherMembers);

    if (otherMembers.length === 0) {
        logger.info(`[sendSharedGroupNotification] No other members in group ${groupId}`);
        return;
    }

    // Task 5.3: Fetch push subscriptions for each member
    const subscriptions: PushSubscriptionDoc[] = [];

    for (const memberId of otherMembers) {
        // Check rate limit for this member + group combination
        const shouldSend = await checkRateLimit(memberId, groupId);
        if (!shouldSend) {
            logger.info(`[sendSharedGroupNotification] Rate limited for member ${memberId} in group ${groupId}`);
            continue;
        }

        // Get member's push subscriptions
        const memberSubs = await getMemberSubscriptions(memberId);
        logger.info(`[sendSharedGroupNotification] Subscriptions for member ${memberId}:`, memberSubs.length);
        subscriptions.push(...memberSubs);
    }

    logger.info(`[sendSharedGroupNotification] Total subscriptions collected:`, subscriptions.length);

    if (subscriptions.length === 0) {
        logger.info(`[sendSharedGroupNotification] No valid push subscriptions for group ${groupId}`);
        return;
    }

    // Build notification content
    const { title, body } = buildNotificationContent(groupData, transaction, ownerId, notificationType);

    // Task 5.4: Send web push notification
    await sendNotification(subscriptions, {
        title,
        body,
        groupId,
        transactionId,
        groupIcon: groupData.icon || '',
        notificationType,
    });

    // Update rate limit timestamps
    for (const memberId of otherMembers) {
        await updateRateLimit(memberId, groupId);
    }
}

/**
 * Get push subscriptions for a user.
 * Returns array of subscription objects for web-push library.
 */
async function getMemberSubscriptions(userId: string): Promise<PushSubscriptionDoc[]> {
    const subsRef = db.collection(`artifacts/${APP_ID}/users/${userId}/pushSubscriptions`);
    const snapshot = await subsRef.get();

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs
        .map(doc => doc.data() as PushSubscriptionDoc)
        .filter(sub => sub.endpoint && sub.keys?.p256dh && sub.keys?.auth);
}

/**
 * Build notification title and body.
 *
 * Format:
 * - Title: Group name with icon (e.g., "🏠 Casa")
 * - Body (added): "Partner added Walmart - $45.00"
 * - Body (removed): "Partner removed Walmart - $45.00"
 */
function buildNotificationContent(
    group: SharedGroupData,
    transaction: TransactionData,
    ownerId: string,
    notificationType: NotificationType
): { title: string; body: string } {
    // Get owner's display name from group member profiles
    const ownerProfile = group.memberProfiles?.[ownerId];
    const ownerName = ownerProfile?.displayName || 'Someone';

    // Format amount
    const amount = transaction.total || 0;
    const currency = transaction.currency || '$';
    const formattedAmount = `${currency}${amount.toFixed(2)}`;

    // Build title with group icon
    const title = group.icon
        ? `${group.icon} ${group.name.replace(/^[^\s]+\s/, '')}` // Remove emoji from name if present, use icon
        : group.name;

    // Build body based on notification type
    const merchant = transaction.merchant || 'a transaction';
    const action = notificationType === 'TRANSACTION_ADDED' ? 'added' : 'removed';
    const body = `${ownerName} ${action} ${merchant} - ${formattedAmount}`;

    return { title, body };
}

/**
 * Send web push notification to multiple subscriptions.
 *
 * Uses web-push library with VAPID for reliable delivery.
 */
async function sendNotification(
    subscriptions: PushSubscriptionDoc[],
    data: {
        title: string;
        body: string;
        groupId: string;
        transactionId: string;
        groupIcon: string;
        notificationType: NotificationType;
    }
): Promise<void> {
    const payload = JSON.stringify({
        title: data.title,
        body: data.body,
        icon: '/pwa-192x192.png',
        badge: '/badge-72.png',
        url: data.groupId ? `/?view=group&groupId=${data.groupId}` : '/',
        tag: data.groupId ? `shared-group-${data.groupId}` : 'gastify-notification',
        data: {
            type: data.notificationType,
            groupId: data.groupId,
            transactionId: data.transactionId,
        },
    });

    let successCount = 0;
    let failureCount = 0;
    const subscriptionsToDelete: string[] = [];

    for (const sub of subscriptions) {
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
            successCount++;
        } catch (error: unknown) {
            failureCount++;
            const webPushError = error as { statusCode?: number; body?: string };

            logger.warn(
                `[sendSharedGroupNotification] Failed to send:`,
                webPushError.statusCode,
                webPushError.body
            );

            // Collect expired/invalid subscriptions for deletion
            if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
                subscriptionsToDelete.push(sub.endpoint);
            }
        }
    }

    logger.info(
        `[sendSharedGroupNotification] Sent ${successCount}/${subscriptions.length} notifications`
    );

    // Delete invalid subscriptions asynchronously
    if (subscriptionsToDelete.length > 0) {
        deleteInvalidSubscriptions(subscriptionsToDelete).catch(err => {
            logger.error('[sendSharedGroupNotification] Error deleting invalid subscriptions:', err);
        });
    }
}

/**
 * Delete invalid push subscriptions from Firestore.
 * Uses collection group query to find and delete subscriptions across all users.
 */
async function deleteInvalidSubscriptions(endpoints: string[]): Promise<void> {
    logger.info(`[sendSharedGroupNotification] Deleting ${endpoints.length} invalid subscriptions...`);

    for (const endpoint of endpoints) {
        try {
            // Query all users for this endpoint using collection group query
            const snapshot = await db.collectionGroup('pushSubscriptions')
                .where('endpoint', '==', endpoint)
                .get();

            if (!snapshot.empty) {
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                logger.info(`[sendSharedGroupNotification] Deleted invalid subscription (found in ${snapshot.size} docs)`);
            }
        } catch (error) {
            logger.error(`[sendSharedGroupNotification] Error deleting subscription:`, error);
        }
    }
}

/**
 * Check rate limit for a member + group combination.
 * AC8: Only send if > 1 minute since last notification.
 */
async function checkRateLimit(memberId: string, groupId: string): Promise<boolean> {
    const docRef = db.doc(`${RATE_LIMIT_COLLECTION}/${memberId}_${groupId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
        return true; // No previous notification - allow
    }

    const data = doc.data();
    const lastSentAt = data?.lastSentAt as admin.firestore.Timestamp | undefined;

    if (!lastSentAt) {
        return true;
    }

    const now = Date.now();
    const lastSentMs = lastSentAt.toMillis();

    return now - lastSentMs > RATE_LIMIT_MS;
}

/**
 * Update rate limit timestamp for a member + group combination.
 */
async function updateRateLimit(memberId: string, groupId: string): Promise<void> {
    const docRef = db.doc(`${RATE_LIMIT_COLLECTION}/${memberId}_${groupId}`);

    await docRef.set({
        memberId,
        groupId,
        lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
