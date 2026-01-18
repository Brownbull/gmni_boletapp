/**
 * Cloud Function: sendSharedGroupNotification
 *
 * Story 14c.13: FCM Push Notifications for Shared Groups
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
 * 3. Get FCM tokens for each member (excluding the transaction owner)
 * 4. Send notification with group name and transaction details
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

// Use functions.logger for better Cloud Logging visibility
const logger = functions.logger;

// Initialize admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

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

interface FCMTokenDoc {
    token: string;
    platform: string;
    lastUsedAt?: admin.firestore.Timestamp;
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
 * Task 5.3: Fetch group members and member FCM tokens
 * Task 5.4: Send FCM notification
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

    // Task 5.3: Fetch FCM tokens for each member
    const tokens: string[] = [];

    for (const memberId of otherMembers) {
        // Check rate limit for this member + group combination
        const shouldSend = await checkRateLimit(memberId, groupId);
        if (!shouldSend) {
            logger.info(`[sendSharedGroupNotification] Rate limited for member ${memberId} in group ${groupId}`);
            continue;
        }

        // Get member's FCM tokens
        const memberTokens = await getMemberTokens(memberId);
        logger.info(`[sendSharedGroupNotification] Tokens for member ${memberId}:`, memberTokens.length);
        tokens.push(...memberTokens);
    }

    logger.info(`[sendSharedGroupNotification] Total tokens collected:`, tokens.length);

    if (tokens.length === 0) {
        logger.info(`[sendSharedGroupNotification] No valid FCM tokens for group ${groupId}`);
        return;
    }

    // Build notification content
    const { title, body } = buildNotificationContent(groupData, transaction, ownerId, notificationType);

    // Task 5.4: Send FCM notification
    await sendNotification(tokens, {
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
 * Get FCM tokens for a user.
 */
async function getMemberTokens(userId: string): Promise<string[]> {
    const tokensRef = db.collection(`artifacts/${APP_ID}/users/${userId}/fcmTokens`);
    const snapshot = await tokensRef.get();

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs
        .map(doc => (doc.data() as FCMTokenDoc).token)
        .filter(Boolean);
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
 * Send FCM notification to multiple tokens.
 *
 * Uses data-only message for maximum compatibility with service worker.
 */
async function sendNotification(
    tokens: string[],
    data: {
        title: string;
        body: string;
        groupId: string;
        transactionId: string;
        groupIcon: string;
        notificationType: NotificationType;
    }
): Promise<void> {
    // Send data-only message (service worker will display notification)
    const message: admin.messaging.MulticastMessage = {
        tokens,
        data: {
            type: data.notificationType,
            title: data.title,
            body: data.body,
            groupId: data.groupId,
            transactionId: data.transactionId,
            icon: data.groupIcon,
        },
        // Android-specific options
        android: {
            priority: 'high',
        },
        // Web push options
        webpush: {
            headers: {
                Urgency: 'high',
            },
        },
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);

        logger.info(
            `[sendSharedGroupNotification] Sent ${response.successCount}/${tokens.length} notifications`
        );

        // Log failures and delete invalid tokens
        if (response.failureCount > 0) {
            const tokensToDelete: string[] = [];

            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    logger.warn(
                        `[sendSharedGroupNotification] Failed to send to token ${idx}:`,
                        resp.error?.code,
                        resp.error?.message
                    );

                    // Collect invalid tokens for deletion
                    if (resp.error?.code === 'messaging/registration-token-not-registered' ||
                        resp.error?.code === 'messaging/invalid-registration-token') {
                        tokensToDelete.push(tokens[idx]);
                    }
                }
            });

            // Delete invalid tokens asynchronously (don't block notification flow)
            if (tokensToDelete.length > 0) {
                deleteInvalidTokens(tokensToDelete).catch(err => {
                    logger.error('[sendSharedGroupNotification] Error deleting invalid tokens:', err);
                });
            }
        }
    } catch (error) {
        logger.error('[sendSharedGroupNotification] FCM send error:', error);
        throw error;
    }
}

/**
 * Delete invalid FCM tokens from Firestore.
 * Uses collection group query to find and delete tokens across all users.
 */
async function deleteInvalidTokens(tokens: string[]): Promise<void> {
    logger.info(`[sendSharedGroupNotification] Deleting ${tokens.length} invalid tokens...`);

    for (const token of tokens) {
        try {
            // Query all users for this token using collection group query
            const snapshot = await db.collectionGroup('fcmTokens')
                .where('token', '==', token)
                .get();

            if (!snapshot.empty) {
                const batch = db.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                logger.info(`[sendSharedGroupNotification] Deleted invalid token (found in ${snapshot.size} docs)`);
            }
        } catch (error) {
            logger.error(`[sendSharedGroupNotification] Error deleting token:`, error);
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
