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

        logger.info(`[sendSharedGroupNotification] newGroupIds:`, newGroupIds, `oldGroupIds:`, oldGroupIds, `addedGroups:`, addedGroups);

        // No new groups tagged - no notification
        if (addedGroups.length === 0) {
            logger.info(`[sendSharedGroupNotification] Skipping: no new groups tagged`);
            return;
        }

        logger.info(`[sendSharedGroupNotification] Transaction ${transactionId} tagged to groups:`, addedGroups);

        // Task 5.3 & 5.4: Process each new group
        for (const groupId of addedGroups) {
            try {
                await processGroupNotification(
                    groupId,
                    userId,
                    transactionId,
                    after
                );
            } catch (error) {
                logger.error(`[sendSharedGroupNotification] Error processing group ${groupId}:`, error);
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
    transaction: TransactionData
): Promise<void> {
    // Fetch group document
    const groupDoc = await db.doc(`sharedGroups/${groupId}`).get();

    if (!groupDoc.exists) {
        logger.warn(`[sendSharedGroupNotification] Group ${groupId} not found`);
        return;
    }

    const groupData = groupDoc.data() as SharedGroupData;
    const members = groupData.members || [];

    // Get other members (exclude the transaction owner)
    const otherMembers = members.filter(memberId => memberId !== ownerId);

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
        tokens.push(...memberTokens);
    }

    if (tokens.length === 0) {
        logger.info(`[sendSharedGroupNotification] No valid FCM tokens for group ${groupId}`);
        return;
    }

    // Build notification content
    const { title, body } = buildNotificationContent(groupData, transaction, ownerId);

    // Task 5.4: Send FCM notification
    await sendNotification(tokens, {
        title,
        body,
        groupId,
        transactionId,
        groupIcon: groupData.icon || '',
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
 * - Body: "Partner added Walmart - $45.00"
 */
function buildNotificationContent(
    group: SharedGroupData,
    transaction: TransactionData,
    ownerId: string
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

    // Build body
    const merchant = transaction.merchant || 'a transaction';
    const body = `${ownerName} added ${merchant} - ${formattedAmount}`;

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
    }
): Promise<void> {
    // Send data-only message (service worker will display notification)
    const message: admin.messaging.MulticastMessage = {
        tokens,
        data: {
            type: 'TRANSACTION_ADDED',
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

        // Log failures for debugging
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    logger.warn(
                        `[sendSharedGroupNotification] Failed to send to token ${idx}:`,
                        resp.error?.code,
                        resp.error?.message
                    );
                }
            });
        }
    } catch (error) {
        logger.error('[sendSharedGroupNotification] FCM send error:', error);
        throw error;
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
