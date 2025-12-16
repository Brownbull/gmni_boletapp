# Story 10.6 Context: Push Notification Integration

**Purpose:** This document aggregates all relevant codebase context for implementing Push Notification Integration.

---

## Target Files to Create

| File | Purpose |
|------|---------|
| `functions/src/notifications/scanComplete.ts` | Firestore trigger for scan complete |
| `functions/src/notifications/weeklyDigest.ts` | Scheduled function for weekly digest |
| `functions/src/notifications/monthlySummary.ts` | Scheduled function for monthly summary |
| `public/firebase-messaging-sw.js` | Firebase messaging service worker |

---

## Files to Modify

| File | Purpose |
|------|---------|
| `src/views/SettingsView.tsx` | Add notification settings UI |
| `src/config/firebase.ts` | Initialize Firebase Messaging |
| `functions/src/index.ts` | Export notification functions |
| `src/utils/translations.ts` | Add notification strings |
| `public/service-worker.js` | Handle notification clicks |

---

## Current Firebase Configuration

```
Location: /home/khujta/projects/bmad/boletapp/src/config/firebase.ts (44 lines)

Existing config variables:
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID (line 10) - KEY FOR PUSH
  VITE_FIREBASE_APP_ID

Note: Messaging initialization NOT yet in firebase.ts - needs to be added.
```

---

## Firebase Messaging Setup

```typescript
// src/config/firebase.ts (add to existing)

import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Initialize messaging
let messaging: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;

  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn('Firebase Messaging not supported:', error);
      return null;
    }
  }

  return messaging;
}

// Get FCM token
export async function getFCMToken(): Promise<string | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}
```

---

## Service Worker for Notifications

```javascript
// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message:', payload);

  const notificationTitle = payload.notification?.title || 'Boletapp';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  switch (data.type) {
    case 'scan_complete':
      url = `/edit/${data.transactionId}`;
      break;
    case 'weekly_digest':
      url = `/summary/weekly/${data.weekStart}`;
      break;
    case 'monthly_summary':
      url = `/summary/monthly/${data.year}/${data.month}`;
      break;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window or open new
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(c => c.navigate(url));
        }
      }
      return clients.openWindow(url);
    })
  );
});
```

---

## SettingsView Notification Section

```
Location: /home/khujta/projects/bmad/boletapp/src/views/SettingsView.tsx (19,872 bytes)

Current structure shows sections for:
  - Language (EN/ES toggle)
  - Currency selection
  - Theme settings
  - PWASettingsSection component

Add new section for notifications:

<NotificationSettings
  enabled={notificationPrefs.enabled}
  scanComplete={notificationPrefs.scanComplete}
  weeklyDigest={notificationPrefs.weeklyDigest}
  monthlySummary={notificationPrefs.monthlySummary}
  onChange={handleNotificationPrefChange}
  t={t}
  theme={theme}
/>
```

---

## Notification Settings Component

```typescript
// src/components/NotificationSettings.tsx

interface NotificationPrefs {
  enabled: boolean;
  scanComplete: boolean;
  weeklyDigest: boolean;
  monthlySummary: boolean;
}

interface NotificationSettingsProps {
  prefs: NotificationPrefs;
  onChange: (prefs: NotificationPrefs) => void;
  t: (key: string) => string;
  theme: 'light' | 'dark';
}

export function NotificationSettings({
  prefs,
  onChange,
  t,
  theme
}: NotificationSettingsProps) {
  const handleMasterToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        // Show error message
        return;
      }

      // Get and store FCM token
      const token = await getFCMToken();
      if (token) {
        await saveFCMToken(token);
      }
    }

    onChange({ ...prefs, enabled });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        🔔 {t('notifications')}
      </h3>

      {/* Master toggle */}
      <ToggleRow
        label={t('notificationsEnabled')}
        checked={prefs.enabled}
        onChange={handleMasterToggle}
      />

      {/* Individual toggles (disabled when master is off) */}
      <div className={prefs.enabled ? '' : 'opacity-50 pointer-events-none'}>
        <ToggleRow
          label={t('notifyScanComplete')}
          description={t('notifyScanCompleteDesc')}
          checked={prefs.scanComplete}
          onChange={(v) => onChange({ ...prefs, scanComplete: v })}
        />

        <ToggleRow
          label={t('notifyWeeklyDigest')}
          description={t('notifyWeeklyDigestDesc')}
          checked={prefs.weeklyDigest}
          onChange={(v) => onChange({ ...prefs, weeklyDigest: v })}
        />

        <ToggleRow
          label={t('notifyMonthlySummary')}
          description={t('notifyMonthlySummaryDesc')}
          checked={prefs.monthlySummary}
          onChange={(v) => onChange({ ...prefs, monthlySummary: v })}
        />
      </div>
    </div>
  );
}
```

---

## Cloud Functions Directory

```
Location: /home/khujta/projects/bmad/boletapp/functions/

Existing structure:
  functions/
    src/
      index.ts           - Main exports
      analyzeReceipt.ts  - Receipt analysis
      imageProcessing.ts - Image handling
    package.json
    tsconfig.json

Add new files:
  functions/
    src/
      notifications/
        index.ts           - Export all notification functions
        scanComplete.ts    - Firestore trigger
        weeklyDigest.ts    - Scheduled function
        monthlySummary.ts  - Scheduled function
        utils.ts           - Shared utilities
```

---

## Scan Complete Notification Function

```typescript
// functions/src/notifications/scanComplete.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const notifyScanComplete = functions.firestore
  .document('users/{userId}/apps/{appId}/transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const { userId, appId, transactionId } = context.params;
    const transaction = snap.data();

    // Get user document
    const userDoc = await admin.firestore()
      .doc(`users/${userId}`)
      .get();

    const userData = userDoc.data();
    if (!userData) return;

    // Check notification preferences
    const prefs = userData.notificationPrefs;
    if (!prefs?.enabled || !prefs?.scanComplete) return;

    // Check FCM token
    const fcmToken = userData.fcmToken;
    if (!fcmToken) return;

    // Send notification (NO financial data!)
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: 'Boleta guardada',
          body: `Tu boleta de ${transaction.merchant || 'comercio'} ha sido procesada`
        },
        data: {
          type: 'scan_complete',
          transactionId,
          appId
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'scan_complete'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      });

      console.log(`Notification sent to user ${userId} for transaction ${transactionId}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw - notification failure shouldn't break the flow
    }
  });
```

---

## Weekly Digest Scheduled Function

```typescript
// functions/src/notifications/weeklyDigest.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Friday 7pm CLT (UTC-3 or UTC-4 depending on DST)
// Using 22:00 UTC to approximately hit 7pm in Chile
export const sendWeeklyDigests = functions.pubsub
  .schedule('0 22 * * 5')  // Friday 10pm UTC ≈ Friday 7pm CLT
  .timeZone('America/Santiago')
  .onRun(async () => {
    const db = admin.firestore();

    // Get all users with weekly notifications enabled
    const usersSnap = await db
      .collection('users')
      .where('notificationPrefs.enabled', '==', true)
      .where('notificationPrefs.weeklyDigest', '==', true)
      .get();

    console.log(`Processing ${usersSnap.size} users for weekly digest`);

    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date();

    const batch: Promise<void>[] = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      if (!userData.fcmToken) continue;

      // Check if user has transactions this week
      const hasTransactions = await userHasTransactionsInRange(
        db,
        userDoc.id,
        weekStart,
        weekEnd
      );

      if (!hasTransactions) continue;

      batch.push(
        admin.messaging().send({
          token: userData.fcmToken,
          notification: {
            title: 'Tu resumen semanal está listo',
            body: 'Revisa cómo te fue esta semana 📊'
          },
          data: {
            type: 'weekly_digest',
            weekStart: weekStart.toISOString().split('T')[0]
          }
        }).catch(err => {
          console.error(`Failed to send to user ${userDoc.id}:`, err);
        })
      );
    }

    await Promise.all(batch);
    console.log(`Weekly digest notifications sent`);
  });

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function userHasTransactionsInRange(
  db: FirebaseFirestore.Firestore,
  userId: string,
  start: Date,
  end: Date
): Promise<boolean> {
  // Check across all apps for this user
  const appsSnap = await db.collection(`users/${userId}/apps`).get();

  for (const appDoc of appsSnap.docs) {
    const txSnap = await db
      .collection(`users/${userId}/apps/${appDoc.id}/transactions`)
      .where('date', '>=', start.toISOString().split('T')[0])
      .where('date', '<=', end.toISOString().split('T')[0])
      .limit(1)
      .get();

    if (!txSnap.empty) return true;
  }

  return false;
}
```

---

## Monthly Summary Scheduled Function

```typescript
// functions/src/notifications/monthlySummary.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Last day of month at 6pm CLT
// Run on 28-31 and check if it's actually the last day
export const sendMonthlySummaries = functions.pubsub
  .schedule('0 21 28-31 * *')  // 9pm UTC ≈ 6pm CLT, days 28-31
  .timeZone('America/Santiago')
  .onRun(async () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Only run on actual last day
    if (now.getDate() !== lastDayOfMonth) {
      console.log('Not last day of month, skipping');
      return;
    }

    const db = admin.firestore();

    const usersSnap = await db
      .collection('users')
      .where('notificationPrefs.enabled', '==', true)
      .where('notificationPrefs.monthlySummary', '==', true)
      .get();

    console.log(`Processing ${usersSnap.size} users for monthly summary`);

    const monthName = getMonthName(now.getMonth(), 'es');

    const batch: Promise<void>[] = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      if (!userData.fcmToken) continue;

      // Check if user has transactions this month
      const hasTransactions = await userHasTransactionsThisMonth(
        db,
        userDoc.id,
        now.getFullYear(),
        now.getMonth()
      );

      if (!hasTransactions) continue;

      batch.push(
        admin.messaging().send({
          token: userData.fcmToken,
          notification: {
            title: '¡Mes completo!',
            body: `Tu resumen de ${monthName} está listo 🎉`
          },
          data: {
            type: 'monthly_summary',
            month: monthName,
            year: String(now.getFullYear())
          }
        }).catch(err => {
          console.error(`Failed to send to user ${userDoc.id}:`, err);
        })
      );
    }

    await Promise.all(batch);
    console.log(`Monthly summary notifications sent`);
  });

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function getMonthName(month: number, locale: string): string {
  return monthNames[month];
}
```

---

## FCM Token Storage

```typescript
// Store FCM token in user document

interface UserDocument {
  // ... existing fields
  fcmToken?: string;
  fcmTokenUpdatedAt?: Timestamp;
  notificationPrefs?: {
    enabled: boolean;
    scanComplete: boolean;
    weeklyDigest: boolean;
    monthlySummary: boolean;
  };
}

// In client app:
async function saveFCMToken(token: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await updateDoc(doc(db, 'users', user.uid), {
    fcmToken: token,
    fcmTokenUpdatedAt: serverTimestamp()
  });
}

async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await updateDoc(doc(db, 'users', user.uid), {
    notificationPrefs: prefs
  });
}
```

---

## Translation Strings to Add

```typescript
// src/utils/translations.ts

// English
notifications: 'Notifications',
notificationsEnabled: 'Enable notifications',
notifyScanComplete: 'Scan complete',
notifyScanCompleteDesc: 'When your receipt is ready',
notifyWeeklyDigest: 'Weekly summary',
notifyWeeklyDigestDesc: 'Fridays at 7pm',
notifyMonthlySummary: 'Monthly summary',
notifyMonthlySummaryDesc: 'Last day of month',
notificationPermissionDenied: 'Notification permission denied. Enable in browser settings.',

// Spanish
notifications: 'Notificaciones',
notificationsEnabled: 'Notificaciones habilitadas',
notifyScanComplete: 'Escaneo completado',
notifyScanCompleteDesc: 'Cuando tu boleta está lista',
notifyWeeklyDigest: 'Resumen semanal',
notifyWeeklyDigestDesc: 'Viernes a las 7pm',
notifyMonthlySummary: 'Resumen mensual',
notifyMonthlySummaryDesc: 'Último día del mes',
notificationPermissionDenied: 'Permiso de notificaciones denegado. Habilitar en configuración del navegador.',
```

---

## Security & Privacy

```
CRITICAL: No financial data in notification payloads!

✅ OK to include:
  - type: 'scan_complete'
  - transactionId (for deep linking)
  - merchant name (optional)
  - weekStart date
  - month/year

❌ NEVER include:
  - Transaction amounts
  - Totals or summaries
  - Category spending
  - Any financial figures

Notifications are triggers only - user must open app to see data.
```

---

## Testing Considerations

```typescript
// Test notification opt-in/out flow
// Test scan complete notification (manual trigger in emulator)
// Test deep linking from notification
// Test scheduled function execution (emulator)
// Test permission denied handling

// Firebase emulator setup for testing:
// firebase emulators:start --only functions,firestore

// Trigger scheduled function manually in emulator:
// curl http://localhost:5001/PROJECT_ID/REGION/sendWeeklyDigests
```

---

## Environment Variables Needed

```bash
# .env (add VAPID key for web push)
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here

# Generate VAPID key in Firebase Console:
# Project Settings > Cloud Messaging > Web Push certificates
```
