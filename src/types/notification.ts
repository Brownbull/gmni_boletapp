/**
 * In-App Notification Types
 *
 * Story 14c.13: In-app notification history for shared group events
 *
 * Notifications are stored in Firestore per-user and displayed in the Alertas view.
 * Push notifications also create in-app notifications for history persistence.
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Type of notification
 */
export type NotificationType =
    | 'TRANSACTION_ADDED'      // Transaction added to shared group
    | 'TRANSACTION_REMOVED'    // Transaction removed from shared group
    | 'GROUP_INVITATION'       // Invited to join a shared group
    | 'GROUP_MEMBER_JOINED'    // New member joined the group
    | 'GROUP_MEMBER_LEFT';     // Member left the group

/**
 * In-app notification stored in Firestore
 * Path: artifacts/{appId}/users/{userId}/notifications/{notificationId}
 */
export interface InAppNotification {
    /** Firestore document ID */
    id?: string;
    /** Type of notification */
    type: NotificationType;
    /** Notification title */
    title: string;
    /** Notification body/message */
    body: string;
    /** Whether the notification has been read */
    read: boolean;
    /** When the notification was created */
    createdAt: Timestamp;
    /** Related group ID (for shared group notifications) */
    groupId?: string;
    /** Related group name (denormalized for display) */
    groupName?: string;
    /** Related group icon (denormalized for display) */
    groupIcon?: string;
    /** Related transaction ID (for transaction notifications) */
    transactionId?: string;
    /** User who triggered the notification (e.g., who added the transaction) */
    actorId?: string;
    /** Actor's display name (denormalized) */
    actorName?: string;
    /** URL to navigate to when clicked */
    actionUrl?: string;
}

/**
 * Notification with client-side Date conversion
 */
export interface InAppNotificationClient extends Omit<InAppNotification, 'createdAt'> {
    id: string;
    createdAt: Date;
}
