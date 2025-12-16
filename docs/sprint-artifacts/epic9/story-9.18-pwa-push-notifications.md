# Story 9.18: PWA Push Notifications

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** Drafted
**Story Points:** 5
**Dependencies:** None (Firebase already integrated)

---

## User Story

As a **user**,
I want **to receive push notifications from the Gastify PWA**,
So that **I can stay informed about spending alerts, budgets, or reminders even when the app is not open**.

---

## Problem Description

The Gastify PWA currently has:
- A manifest.webmanifest with PWA configuration
- A service worker (sw.js) for caching/offline support via Workbox
- Firebase SDK installed (v10.14.1)

However, the app does NOT currently have:
- Service worker registration in main.tsx
- Firebase Cloud Messaging (FCM) integration
- Push notification permission request flow
- Notification settings UI in SettingsView

This story adds push notification infrastructure using Firebase Cloud Messaging.

---

## Acceptance Criteria

- [ ] **AC #1:** Service worker is properly registered in main.tsx with update handling
- [ ] **AC #2:** vite-plugin-pwa installed and configured for PWA build
- [ ] **AC #3:** Firebase Cloud Messaging (FCM) initialized in the app
- [ ] **AC #4:** Push notification permission request shown to users (non-intrusive)
- [ ] **AC #5:** Users can enable/disable notifications in Settings
- [ ] **AC #6:** firebase-messaging-sw.js service worker handles background messages
- [ ] **AC #7:** In-app notification toast when push received while app is open
- [ ] **AC #8:** FCM token stored in Firestore for each user
- [ ] **AC #9:** Translations added for notification-related UI (EN + ES)
- [ ] **AC #10:** Existing tests pass

---

## Tasks / Subtasks

### PWA Infrastructure
- [ ] Install `vite-plugin-pwa` dev dependency
- [ ] Configure vite.config.ts with VitePWA plugin
- [ ] Update manifest settings in VitePWA config
- [ ] Create service worker registration utility

### Firebase Cloud Messaging Setup
- [ ] Add FCM web push certificate (VAPID key) to Firebase project
- [ ] Create `src/services/pushNotifications.ts` service
  - [ ] Initialize Firebase Messaging
  - [ ] Request notification permission
  - [ ] Get FCM token
  - [ ] Handle foreground messages
- [ ] Create `public/firebase-messaging-sw.js` for background messages
- [ ] Update Firebase config to include messaging

### User Settings UI
- [ ] Create `src/components/NotificationSettings.tsx`
  - [ ] Permission status indicator (granted/denied/default)
  - [ ] Enable/disable toggle
  - [ ] Test notification button (dev mode)
- [ ] Add notification section to SettingsView
- [ ] Add notification permission prompt component (non-intrusive banner)

### Token Storage
- [ ] Add `fcmTokens` collection to Firestore
- [ ] Store token with userId, timestamp, device info
- [ ] Update token on app initialization if changed
- [ ] Clean up old tokens on sign-out

### Translations
- [ ] Add EN translations: notifications, enableNotifications, notificationPermission, etc.
- [ ] Add ES translations for same keys

---

## Technical Summary

**Dependencies to add:**
```json
{
  "devDependencies": {
    "vite-plugin-pwa": "^0.20.0"
  }
}
```

**Files to create:**
1. `src/services/pushNotifications.ts` - FCM initialization and handling
2. `src/components/NotificationSettings.tsx` - Settings UI component
3. `public/firebase-messaging-sw.js` - Background message handler

**Files to modify:**
1. `vite.config.ts` - Add VitePWA plugin
2. `src/main.tsx` - Register service worker
3. `src/views/SettingsView.tsx` - Add notifications section
4. `src/utils/translations.ts` - Add notification translations
5. `src/App.tsx` - Initialize push notification service

**Firebase Configuration:**
```typescript
// src/services/pushNotifications.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

const messaging = getMessaging(app);

export async function requestNotificationPermission(): Promise<boolean> {
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function getFCMToken(vapidKey: string): Promise<string | null> {
  try {
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  return onMessage(messaging, callback);
}
```

**Service Worker Pattern:**
```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  // Firebase config from environment
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/pwa-192x192.png',
  });
});
```

---

## Future Notification Use Cases

Once infrastructure is in place, these notifications can be triggered:
1. **Budget alerts** - "You've spent 80% of your monthly budget"
2. **Weekly spending summary** - "Your spending this week: $X"
3. **Reminder to scan** - "Don't forget to scan today's receipts"
4. **Category insights** - "You spent more on Food this month than last"

Note: Trigger logic for these is outside this story's scope.

---

## Security Considerations

1. **VAPID Key:** Store in environment variable, not hardcoded
2. **Token Security:** FCM tokens are sensitive - store securely in Firestore
3. **Permission UX:** Don't immediately prompt - wait for user to visit settings
4. **Background Worker:** Limit what the SW can access

---

## Key Code References

**Existing Firebase Setup:** `src/services/firebase.ts`
**Current PWA Files:** `dist/manifest.webmanifest`, `dist/sw.js`
**Settings Pattern:** `src/views/SettingsView.tsx`

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md)
**PWA Docs:** https://vite-pwa-org.netlify.app/
**FCM Docs:** https://firebase.google.com/docs/cloud-messaging/js/client

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted - PWA Push Notifications with Firebase Cloud Messaging |
