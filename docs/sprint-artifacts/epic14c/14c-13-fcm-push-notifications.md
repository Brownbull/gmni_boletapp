# Story 14c.13: FCM Push Notifications for Shared Groups

**Status**: review-ready
**Points**: 8
**Priority**: Medium
**Dependencies**: 14c.12 (real-time sync)

---

## Story

As a shared group member,
I want to receive push notifications when my partner adds expenses,
so that I stay informed even when the app is closed.

---

## Background

Real-time sync (Story 14c.12) only works when the app is open. FCM push notifications enable:
- Notifications when app is closed/backgrounded
- "Partner added $45 grocery expense" alerts
- Deep linking to open app at the right screen

**Decision Document**: [BRAINSTORM-REALTIME-SYNC-DECISION.md](./BRAINSTORM-REALTIME-SYNC-DECISION.md)

**Cost**: FCM is completely free with no limits.

---

## Acceptance Criteria

### AC1: Notification Permission - User Control
- Given I'm in the Settings view
- When I look at the Notifications section
- Then I see a toggle to enable/disable shared group notifications
- And the default is disabled (opt-in)
- And enabling triggers browser permission prompt

### AC2: Token Management - Registration
- Given I enable notifications
- When I grant browser permission
- Then my FCM token is stored in Firestore
- And the token is associated with my user ID
- And multiple devices/browsers are supported

### AC3: Trigger - New Expense Notification
- Given User A and User B are in shared group "Casa"
- When User A tags a new transaction to "Casa"
- Then User B receives a push notification
- And the notification shows: "🏠 Casa: Partner added Walmart - $45.00"

### AC4: Notification Content - Informative
- Given I receive a shared expense notification
- When I view it
- Then I see the group name/icon
- And I see the merchant name
- And I see the amount
- And I see who added it (if not obvious)

### AC5: Click Action - Deep Link
- Given I receive a shared expense notification
- When I tap/click it
- Then the app opens
- And I'm navigated to the shared group view
- And I see the new transaction

### AC6: Background Delivery - Works When Closed
- Given I have notifications enabled
- When the app is completely closed
- Then I still receive push notifications
- And tapping opens the app correctly

### AC7: Token Cleanup - Maintenance
- Given tokens can become stale over time
- When a token hasn't been used in 60 days
- Then it's automatically cleaned up
- And invalid tokens are removed on send failure

### AC8: Batching - Prevent Spam
- Given User A adds multiple transactions rapidly
- When notifications would be sent
- Then they're batched/throttled to prevent spam
- And user receives at most 1 notification per minute per group

---

## Tasks / Subtasks

### Task 1: FCM Token Management (AC: #1, #2)

- [x] 1.1 Create Firestore collection: `artifacts/{appId}/users/{userId}/fcmTokens/{tokenId}`
- [x] 1.2 Define token document schema: `{ token, deviceType, createdAt, lastUsedAt }`
- [x] 1.3 Create `saveFcmToken(userId, token)` function
- [x] 1.4 Create `deleteFcmToken(userId, tokenId)` function
- [x] 1.5 Create `getTokensForUsers(userIds[])` function for Cloud Function
- [x] 1.6 Update `lastUsedAt` on app startup if token exists

### Task 2: Service Worker Setup (AC: #6)

- [x] 2.1 Create `public/firebase-messaging-sw.js` (or merge with existing SW)
- [x] 2.2 Initialize Firebase Messaging in service worker
- [x] 2.3 Handle `onBackgroundMessage` event
- [x] 2.4 Display notification with `self.registration.showNotification()`
- [x] 2.5 Include notification data for click handling
- [x] 2.6 Test service worker registration and updates

### Task 3: Client-Side FCM Integration (AC: #1, #2)

- [x] 3.1 Add Firebase Messaging to client: `getMessaging(app)`
- [x] 3.2 Create `useFcmNotifications` hook (enhanced existing `usePushNotifications` hook)
- [x] 3.3 Implement `requestNotificationPermission()` with browser prompt
- [x] 3.4 Handle token retrieval: `getToken(messaging, { vapidKey })`
- [x] 3.5 Handle token refresh: `onMessage(messaging, callback)`
- [x] 3.6 Store permission state in localStorage for UI toggle

### Task 4: Settings UI (AC: #1)

- [x] 4.1 Add "Notifications" section to SettingsView (NotificacionesView component)
- [x] 4.2 Create toggle for "Shared group expense alerts"
- [x] 4.3 Show permission status (granted/denied/default)
- [x] 4.4 Handle "denied" state - show instructions to enable in browser settings
- [x] 4.5 Inline translations for notification settings

### Task 5: Cloud Function - Firestore Trigger (AC: #3, #4, #8)

- [x] 5.1 Create `functions/src/sendSharedGroupNotification.ts`
- [x] 5.2 Trigger on `artifacts/{appId}/users/{userId}/transactions/{txnId}` write
- [x] 5.3 Detect when `sharedGroupIds` field changes (added groups)
- [x] 5.4 For each newly added group:
  - [x] 5.4.1 Fetch group document (get members, name, icon)
  - [x] 5.4.2 Filter out the user who made the change
  - [x] 5.4.3 Fetch FCM tokens for other members
  - [x] 5.4.4 Build notification payload
- [x] 5.5 Send via `messaging.sendEachForMulticast()`
- [x] 5.6 Handle send failures - log failures (token cleanup handled by scheduled function)
- [x] 5.7 Implement rate limiting (1 notification/minute/group/user)

### Task 6: Notification Click Handling (AC: #5)

- [x] 6.1 Add `notificationclick` event listener in service worker
- [x] 6.2 Extract `groupId` from notification data
- [x] 6.3 Build deep link URL: `/?view=group&groupId={groupId}`
- [x] 6.4 Use `clients.openWindow()` to open/focus app
- [x] 6.5 Handle case where app is already open

### Task 7: Token Cleanup Function (AC: #7)

- [x] 7.1 Create `functions/src/cleanupStaleFcmTokens.ts`
- [x] 7.2 Schedule to run daily at 3:00 AM UTC: `functions.pubsub.schedule('0 3 * * *')`
- [x] 7.3 Query tokens with `lastUsedAt < 60 days ago`
- [x] 7.4 Batch delete stale tokens
- [x] 7.5 Log cleanup metrics

### Task 8: Testing (All ACs)

- [x] 8.1 Unit test: Token save/delete/get operations (tests/unit/services/fcmTokenService.test.ts)
- [x] 8.2 Unit test: NotificacionesView component (tests/unit/components/settings/NotificacionesView.test.tsx)
- [x] 8.3 TypeScript compilation passing
- [ ] 8.4 Integration test: Trigger fires on transaction change (deferred - requires emulator)
- [ ] 8.5 Manual test: Full flow - add expense → partner gets notification
- [ ] 8.6 Manual test: Click notification → app opens to correct view
- [ ] 8.7 Manual test: Background delivery with app closed

---

## Technical Design

### FCM Token Schema

```typescript
// Collection: artifacts/{appId}/users/{userId}/fcmTokens/{tokenId}
interface FcmToken {
  token: string;           // The FCM registration token
  deviceType: 'web' | 'android' | 'ios';
  userAgent?: string;      // Browser/device info
  createdAt: Timestamp;
  lastUsedAt: Timestamp;   // Updated on each app open
}
```

### Service Worker

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '...',
  projectId: 'boletapp-d609f',
  messagingSenderId: '...',
  appId: '...',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, groupId } = payload.data;

  self.registration.showNotification(title, {
    body,
    icon: icon || '/icon-192.png',
    badge: '/badge-72.png',
    data: { groupId },
    tag: `shared-group-${groupId}`, // Collapse same-group notifications
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const groupId = event.notification.data?.groupId;
  const url = groupId
    ? `/?view=group&groupId=${groupId}`
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Focus existing window if found
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});
```

### Cloud Function - Firestore Trigger

```typescript
// functions/src/onTransactionSharedGroupChange.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const messaging = admin.messaging();

// Rate limiting: track last notification time per group per user
const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute

export const onTransactionSharedGroupChange = functions.firestore
  .document('artifacts/{appId}/users/{userId}/transactions/{txnId}')
  .onWrite(async (change, context) => {
    const { appId, userId, txnId } = context.params;

    const before = change.before.data();
    const after = change.after.data();

    // Detect newly added groups
    const beforeGroups = new Set(before?.sharedGroupIds || []);
    const afterGroups = new Set(after?.sharedGroupIds || []);
    const addedGroups = [...afterGroups].filter(g => !beforeGroups.has(g));

    if (addedGroups.length === 0) return;

    for (const groupId of addedGroups) {
      await sendGroupNotification(groupId, userId, after, appId);
    }
  });

async function sendGroupNotification(
  groupId: string,
  actorUserId: string,
  transaction: any,
  appId: string
) {
  // Rate limit check
  const cacheKey = `${groupId}:${actorUserId}`;
  const lastSent = rateLimitCache.get(cacheKey) || 0;
  if (Date.now() - lastSent < RATE_LIMIT_MS) {
    console.log(`[FCM] Rate limited: ${cacheKey}`);
    return;
  }

  // Fetch group
  const groupDoc = await db.doc(`sharedGroups/${groupId}`).get();
  if (!groupDoc.exists) return;

  const group = groupDoc.data()!;
  const otherMembers = group.members.filter((m: string) => m !== actorUserId);

  if (otherMembers.length === 0) return;

  // Fetch tokens for other members
  const tokens = await getTokensForUsers(otherMembers, appId);
  if (tokens.length === 0) return;

  // Build notification
  const actorName = group.memberProfiles?.[actorUserId]?.displayName || 'Partner';
  const notification = {
    title: `${group.icon || '👥'} ${group.name}`,
    body: `${actorName} added: ${transaction.merchant} - $${transaction.total.toFixed(2)}`,
  };

  // Send
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification,
    data: {
      type: 'TRANSACTION_ADDED',
      groupId,
      transactionId: transaction.id,
      title: notification.title,
      body: notification.body,
      icon: group.icon || '',
    },
    webpush: {
      fcmOptions: {
        link: `/?view=group&groupId=${groupId}`,
      },
    },
  });

  // Handle failures - remove invalid tokens
  response.responses.forEach((resp, idx) => {
    if (resp.error?.code === 'messaging/registration-token-not-registered' ||
        resp.error?.code === 'messaging/invalid-registration-token') {
      deleteInvalidToken(tokens[idx]);
    }
  });

  // Update rate limit
  rateLimitCache.set(cacheKey, Date.now());

  console.log(`[FCM] Sent to ${response.successCount}/${tokens.length} devices for group ${groupId}`);
}

async function getTokensForUsers(userIds: string[], appId: string): Promise<string[]> {
  const tokens: string[] = [];

  for (const userId of userIds) {
    const tokensSnapshot = await db
      .collection(`artifacts/${appId}/users/${userId}/fcmTokens`)
      .get();

    tokensSnapshot.docs.forEach(doc => {
      tokens.push(doc.data().token);
    });
  }

  return tokens;
}

async function deleteInvalidToken(token: string) {
  // Query all users for this token and delete
  const snapshot = await db.collectionGroup('fcmTokens')
    .where('token', '==', token)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log(`[FCM] Deleted invalid token`);
}
```

### Client Hook

```typescript
// src/hooks/useFcmNotifications.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useFcmNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setPermissionStatus(Notification.permission);
    setIsEnabled(localStorage.getItem('fcm_enabled') === 'true');
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
          await saveFcmToken(user.uid, token);
          localStorage.setItem('fcm_enabled', 'true');
          setIsEnabled(true);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('[FCM] Permission request failed:', error);
      return false;
    }
  };

  const disableNotifications = async () => {
    // Delete token from Firestore
    await deleteUserFcmTokens(user.uid);
    localStorage.setItem('fcm_enabled', 'false');
    setIsEnabled(false);
  };

  return {
    permissionStatus,
    isEnabled,
    requestPermission,
    disableNotifications,
  };
}
```

---

## Security Considerations

1. **Token Storage**: FCM tokens stored in user-isolated Firestore collection
2. **Notification Content**: Only shows public info (group name, merchant, amount)
3. **Rate Limiting**: Prevents notification spam
4. **Token Cleanup**: Stale tokens removed to reduce attack surface

---

## Firestore Security Rules Addition

```javascript
// FCM tokens - user can only manage their own tokens
match /artifacts/{appId}/users/{userId}/fcmTokens/{tokenId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

## Definition of Done

- [ ] All acceptance criteria verified
- [ ] All tasks completed
- [ ] Unit tests passing (minimum 15 new tests)
- [ ] Manual tests successful:
  - [ ] Enable notifications in Settings
  - [ ] Partner adds expense → notification received
  - [ ] Click notification → app opens to group
  - [ ] Works with app closed
- [ ] Service worker tested across browsers (Chrome, Firefox, Edge)
- [ ] Token cleanup function deployed
- [ ] Code review approved
- [ ] Deployed to staging

---

## Browser Compatibility Notes

| Browser | FCM Support | Notes |
|---------|-------------|-------|
| Chrome | ✅ Full | Best support |
| Firefox | ✅ Full | Good support |
| Edge | ✅ Full | Good support |
| Safari | ⚠️ Limited | Requires Apple Push, different implementation |
| iOS Safari | ❌ No | Apple doesn't allow FCM on iOS web |

**MVP Scope**: Chrome, Firefox, Edge (Safari deferred to future story)

---

## References

- [Decision Document](./BRAINSTORM-REALTIME-SYNC-DECISION.md)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
