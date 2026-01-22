/**
 * Firebase Cloud Functions for boletapp
 *
 * Entry point for all Cloud Functions deployed to Firebase.
 *
 * Functions are organized by category:
 * - CRITICAL: Core features that break the app if removed
 * - FEATURE: User-facing features that enhance the app
 * - MAINTENANCE: Background jobs that keep the system healthy
 * - ADMIN: Debugging utilities (not secured for production)
 *
 * @see docs/architecture/cloud-functions.md for full documentation
 */

// =============================================================================
// CRITICAL: Core Receipt Processing
// These functions are essential for the app's primary functionality
// =============================================================================

/**
 * analyzeReceipt - HTTPS Callable (CRITICAL)
 *
 * Analyzes receipt images using Google Gemini 2.0 Flash AI.
 * Extracts merchant, date, total, items, and categories.
 *
 * - Authentication: Required (Firebase Auth)
 * - Rate Limit: 10 requests/minute/user
 * - Image Validation: Max 5 images, 10MB each
 * - Model: gemini-2.0-flash (GA)
 *
 * Dependencies: imageProcessing.ts, storageService.ts, prompts/
 */
export { analyzeReceipt } from './analyzeReceipt'

/**
 * onTransactionDeleted - Firestore Trigger (CRITICAL)
 *
 * Cascade deletes receipt images from Firebase Storage when a
 * transaction document is deleted. Prevents orphaned files.
 *
 * - Trigger Path: artifacts/{appId}/users/{userId}/transactions/{transactionId}
 * - Error Handling: Logs failures but doesn't throw (transaction already deleted)
 *
 * Dependencies: storageService.ts
 */
export { onTransactionDeleted } from './deleteTransactionImages'

// =============================================================================
// MAINTENANCE: Background Token Cleanup
// Scheduled and on-demand cleanup to prevent token accumulation
// =============================================================================

/**
 * cleanupStaleFcmTokens - Scheduled Function (MAINTENANCE)
 *
 * Deletes FCM tokens unused for 60+ days to prevent accumulation
 * from uninstalled apps and expired browser sessions.
 *
 * - Schedule: Daily at 3:00 AM UTC
 * - Also cleans up: Legacy tokens without lastUsedAt, old rate limit docs
 */
export { cleanupStaleFcmTokens } from './cleanupStaleFcmTokens'

/**
 * cleanupCrossUserFcmToken - HTTPS Callable (FEATURE)
 *
 * Removes an FCM token from all users except the calling user.
 * Solves shared device problem where tokens get registered to
 * multiple user accounts.
 *
 * - Authentication: Required (Firebase Auth)
 * - Called from: fcmTokenService.ts saveFCMTokenWithTracking()
 */
export { cleanupCrossUserFcmToken } from './cleanupCrossUserFcmToken'

/**
 * adminCleanupUserTokens - HTTP Endpoint (ADMIN)
 *
 * Manually clean up all FCM tokens for a specific user except
 * the most recent one. Also removes cross-user contamination.
 *
 * - Authentication: Simple secret query param (NOT production secure)
 * - Usage: POST /adminCleanupUserTokens?userId=xxx&secret=fcm-cleanup-2026
 */
export { adminCleanupUserTokens } from './cleanupCrossUserFcmToken'

/**
 * adminSendTestNotification - HTTP Endpoint (ADMIN)
 *
 * Send a test FCM push notification to a user for debugging.
 *
 * - Authentication: Simple secret query param (NOT production secure)
 * - Usage: GET /adminSendTestNotification?userId=xxx&secret=fcm-cleanup-2026
 */
export { adminSendTestNotification } from './cleanupCrossUserFcmToken'

// =============================================================================
// FEATURE: Web Push (VAPID) Notifications
// Alternative notification delivery using web-push library
// =============================================================================

/**
 * saveWebPushSubscription - HTTPS Callable (FEATURE)
 *
 * Saves a VAPID web push subscription for the authenticated user.
 * Implements single-device policy: deletes all existing subscriptions
 * for the user before saving new one.
 *
 * - Authentication: Required (Firebase Auth)
 * - Cross-user cleanup: Removes same endpoint from other users
 */
export { saveWebPushSubscription } from './webPushService'

/**
 * deleteWebPushSubscription - HTTPS Callable (FEATURE)
 *
 * Deletes all web push subscriptions for the authenticated user.
 * Called during logout to clean up push subscriptions.
 *
 * - Authentication: Required (Firebase Auth)
 */
export { deleteWebPushSubscription } from './webPushService'

/**
 * adminTestWebPush - HTTP Endpoint (ADMIN)
 *
 * Send a test web push notification to a user for debugging.
 *
 * - Authentication: Simple secret query param (NOT production secure)
 * - Usage: GET /adminTestWebPush?userId=xxx&secret=fcm-cleanup-2026
 */
export { adminTestWebPush } from './webPushService'

/**
 * getVapidPublicKey - HTTP Endpoint (FEATURE)
 *
 * Returns the VAPID public key for client-side subscription setup.
 * Public endpoint - no authentication required.
 *
 * - Authentication: None (public key is safe to expose)
 */
export { getVapidPublicKey } from './webPushService'
