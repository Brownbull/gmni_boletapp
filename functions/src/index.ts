/**
 * Firebase Cloud Functions for boletapp
 * Entry point for all Cloud Functions
 */

export { analyzeReceipt } from './analyzeReceipt'
export { onTransactionDeleted } from './deleteTransactionImages'

// Story 14c.5: Secure shared group transaction queries
export { getSharedGroupTransactions } from './getSharedGroupTransactions'

// Story 14c.13: FCM push notifications for shared groups
export { sendSharedGroupNotification } from './sendSharedGroupNotification'
export { cleanupStaleFcmTokens } from './cleanupStaleFcmTokens'
export { cleanupCrossUserFcmToken, adminCleanupUserTokens, adminSendTestNotification } from './cleanupCrossUserFcmToken'

// Story 14c.13: Web Push (VAPID) notifications - alternative to FCM for better Android support
export { saveWebPushSubscription, deleteWebPushSubscription, adminTestWebPush, getVapidPublicKey } from './webPushService'
