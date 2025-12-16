# Story 10.6: Push Notification Integration

**Epic:** Epic 10 - Foundation + Engagement & Insight Engine
**Status:** Draft
**Story Points:** 3
**Dependencies:** Stories 10.2, 10.3, 10.4, Epic 9 (PWA push notification infrastructure)

---

## User Story

As a **user**,
I want **to receive push notifications for completed scans and new reports**,
So that **I stay informed about my expenses even when the app is backgrounded**.

---

## Acceptance Criteria

- [ ] **AC #1:** Users can opt-in/out of push notifications in Settings
- [ ] **AC #2:** Push notification sent when scan processing completes (if app backgrounded)
- [ ] **AC #3:** Push notification sent when weekly digest is ready (Friday 7pm)
- [ ] **AC #4:** Push notification sent when monthly summary is ready (end of month)
- [ ] **AC #5:** Notifications deep-link to relevant app view
- [ ] **AC #6:** No financial data in notification payloads (only triggers)
- [ ] **AC #7:** System respects device notification settings
- [ ] **AC #8:** Notification delivery within 30 seconds of trigger event

---

## Tasks / Subtasks

### Task 1: Create Notification Settings UI (0.5h)
- [ ] Add notification settings section to SettingsView
- [ ] Toggle options:
  - Master toggle: Enable/disable all notifications
  - Scan complete notifications
  - Weekly digest notifications
  - Monthly summary notifications
- [ ] Save preferences to user document in Firestore
- [ ] Sync with service worker registration

### Task 2: Integrate with Existing PWA Push Infrastructure (1h)
- [ ] Reference Epic 9 push notification setup
- [ ] Verify service worker registration
- [ ] Verify FCM token storage in user document
- [ ] Create notification permission request flow (if not already done)
- [ ] Handle permission denied gracefully

### Task 3: Implement Scan Complete Notification (0.5h)
- [ ] Trigger notification from Cloud Function when scan completes
- [ ] Check if app is backgrounded (not foreground)
- [ ] Check user notification preferences
- [ ] Notification content:
  ```
  Title: "Boleta guardada"
  Body: "Tu boleta de {merchant} ha sido procesada"
  Data: { type: 'scan_complete', transactionId: '...' }
  ```
- [ ] NO financial amounts in payload (privacy)

### Task 4: Implement Weekly Digest Notification (0.5h)
- [ ] Create scheduled Cloud Function (Friday 7pm CLT)
- [ ] For each active user with notifications enabled:
  - Check if has transactions this week
  - Send notification if yes
- [ ] Notification content:
  ```
  Title: "Tu resumen semanal está listo"
  Body: "Revisa cómo te fue esta semana 📊"
  Data: { type: 'weekly_digest', weekStart: '2025-12-09' }
  ```

### Task 5: Implement Monthly Summary Notification (0.5h)
- [ ] Create scheduled Cloud Function (last day of month, 6pm CLT)
- [ ] For each active user with notifications enabled:
  - Check if has transactions this month
  - Send notification if yes
- [ ] Notification content:
  ```
  Title: "¡Mes completo!"
  Body: "Tu resumen de {month} está listo 🎉"
  Data: { type: 'monthly_summary', month: 'Noviembre', year: 2025 }
  ```

### Task 6: Implement Deep Linking (0.5h)
- [ ] Handle notification click in service worker
- [ ] Parse notification data
- [ ] Navigate to appropriate view:
  - `scan_complete` → Transaction detail (EditView)
  - `weekly_digest` → WeeklySummaryView
  - `monthly_summary` → MonthlySummaryView
- [ ] Handle app already open vs cold start

### Task 7: Security & Privacy Review (0.25h)
- [ ] Verify no financial data in notification payloads
- [ ] Verify FCM tokens stored securely
- [ ] Verify notification preferences respected
- [ ] Verify device settings respected

### Task 8: Testing (0.25h)
- [ ] Test notification opt-in/out flow
- [ ] Test scan complete notification (manual trigger)
- [ ] Test deep linking from notification
- [ ] Test scheduled function execution (emulator)
- [ ] Test permission denied handling

---

## Technical Summary

This story connects the Insight Engine outputs (scan complete, weekly/monthly summaries) to the PWA push notification infrastructure built in Epic 9. The focus is on meaningful notifications that respect user preferences and privacy.

**Notification Strategy (from PRD):**
- ✅ New reports available (weekly/monthly summaries)
- ✅ Scan/batch scan completed
- ❌ NO generic engagement notifications
- ❌ NO "we miss you" spam
- ❌ NO financial amounts in payloads

**Notification Timing:**
| Event | Timing | Condition |
|-------|--------|-----------|
| Scan Complete | Immediate | App backgrounded |
| Weekly Digest | Friday 7pm CLT | Has week transactions |
| Monthly Summary | Last day 6pm CLT | Has month transactions |

---

## Project Structure Notes

- **Files to create:**
  - `functions/src/notifications/scanComplete.ts`
  - `functions/src/notifications/weeklyDigest.ts`
  - `functions/src/notifications/monthlySummary.ts`

- **Files to modify:**
  - `src/views/SettingsView.tsx` - Add notification settings
  - `public/service-worker.js` - Handle notification clicks
  - `src/utils/translations.ts` - Add notification strings

- **Expected test locations:**
  - `functions/test/notifications/`

- **Estimated effort:** 3 story points (~5 hours)
- **Prerequisites:** Stories 10.2, 10.3, 10.4, Epic 9 PWA setup

---

## Key Code References

**Epic 9 PWA Infrastructure (to reference):**
```typescript
// Existing service worker setup from Epic 9
// firebase-messaging-sw.js
// FCM token storage in user document
```

**Cloud Function for Scan Complete:**
```typescript
// functions/src/notifications/scanComplete.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const notifyScanComplete = functions.firestore
  .document('users/{userId}/transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const { userId, transactionId } = context.params;
    const transaction = snap.data();

    // Check user preferences
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const prefs = userDoc.data()?.notificationPrefs;

    if (!prefs?.scanComplete) return;
    if (!userDoc.data()?.fcmToken) return;

    await admin.messaging().send({
      token: userDoc.data()!.fcmToken,
      notification: {
        title: 'Boleta guardada',
        body: `Tu boleta de ${transaction.merchant || 'comercio'} ha sido procesada`
      },
      data: {
        type: 'scan_complete',
        transactionId
      }
    });
  });
```

**Scheduled Function for Weekly Digest:**
```typescript
// functions/src/notifications/weeklyDigest.ts
export const sendWeeklyDigests = functions.pubsub
  .schedule('0 19 * * 5') // Friday 7pm (adjust for timezone)
  .timeZone('America/Santiago')
  .onRun(async () => {
    // Get all users with weekly notifications enabled
    // Check each has transactions this week
    // Send batch notifications
  });
```

**Deep Link Handling:**
```typescript
// public/service-worker.js
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
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

## User Settings Interface

**Notification Settings Section:**
```
┌─────────────────────────────────────────┐
│  🔔 Notificaciones                      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Notificaciones habilitadas   [ON] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Escaneo completado          [ON]  │  │
│  │ Cuando tu boleta está lista       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Resumen semanal            [ON]   │  │
│  │ Viernes a las 7pm                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Resumen mensual            [ON]   │  │
│  │ Último día del mes                │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Context References

**Tech-Spec:** [tech-spec.md](../../tech-spec.md)
**PRD:** [epic-10-prd.md](../../planning/epic-10-prd.md) - FR33-FR38
**Epic 9:** PWA push notification infrastructure

---

## Definition of Done

- [ ] All 8 acceptance criteria verified
- [ ] Notification settings UI complete
- [ ] Scan complete notification working
- [ ] Weekly digest notification scheduled
- [ ] Monthly summary notification scheduled
- [ ] Deep linking working
- [ ] Privacy requirements met (no financial data in payloads)
- [ ] Tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 10 PRD |
