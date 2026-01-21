# Story 14c.21: Notification Bulk Actions

**Status**: done
**Points**: 2
**Priority**: Low
**Dependencies**: 14c.13 (push notifications), 14c.15 (notification tech debt)

---

## Story

As a user with shared group notifications,
I want to quickly mark all notifications as read or dismiss all notifications,
So that I can efficiently manage my notification inbox without having to interact with each notification individually.

---

## Background

The current NotificationsView (Alertas) displays notifications with:
- Individual swipe-to-delete for each notification
- Long-press selection mode with bulk delete capability
- Mark as read on notification click

However, users must either:
1. Tap each notification individually to mark as read, OR
2. Enter selection mode → select all → delete

This story adds a dedicated section at the bottom of the notifications list with two action buttons for quick bulk operations.

---

## Acceptance Criteria

### AC1: Bulk Actions Section Placement
- Given the NotificationsView displays notifications
- When there are one or more notifications visible
- Then a bulk actions section appears **below** the notifications list
- And the section has appropriate spacing from the last notification

### AC2: Mark All as Read Button
- Given the bulk actions section is visible
- When there are unread notifications
- Then a "Mark all as read" button appears on the left
- And clicking it marks all notifications as read
- And the button is disabled (or hidden) when all notifications are already read

### AC3: Dismiss All Button
- Given the bulk actions section is visible
- When there are notifications present
- Then a "Dismiss all" or "Delete all" button appears on the right
- And clicking it shows a confirmation dialog
- And confirming deletes all notifications
- And the button is disabled when there are no notifications

### AC4: Confirmation Dialog for Delete All
- Given the user clicks "Dismiss all"
- When the confirmation dialog appears
- Then it shows the count of notifications to be deleted
- And provides "Cancel" and "Delete" options
- And only deletes if "Delete" is confirmed

### AC5: Visual Feedback
- Given the user performs a bulk action
- When the action completes
- Then a toast message confirms the action (e.g., "5 notifications marked as read")
- And the UI updates immediately

### AC6: Empty State Handling
- Given all notifications have been dismissed
- When the list becomes empty
- Then the bulk actions section is hidden
- And the empty state message is displayed

---

## Tasks / Subtasks

### Task 1: Create Bulk Actions Component

- [x] 1.1 Create `NotificationBulkActions.tsx` component in `src/components/SharedGroups/`
- [x] 1.2 Implement two-button layout (left: Mark all read, right: Dismiss all)
- [x] 1.3 Style buttons as subtle inline row (like compact notification item)
- [x] 1.4 Add disabled states based on notification count/read status

### Task 2: Integrate into NotificationsView

- [x] 2.1 Add bulk actions section below NotificationsList
- [x] 2.2 Pass notification stats (total count, unread count) to component
- [x] 2.3 Connect button handlers to existing `markAllNotificationsAsRead` and `deleteAllInAppNotifications`

### Task 3: Confirmation Dialog

- [x] 3.1 Create confirmation dialog for delete all action
- [x] 3.2 Show notification count in dialog message
- [x] 3.3 Implement cancel/confirm flow with loading state

### Task 4: Toast Feedback

- [x] 4.1 Add toast messages for bulk actions
- [x] 4.2 Include counts in toast messages (e.g., "Marked 5 notifications as read")

### Task 5: Tests

- [x] 5.1 Unit tests for NotificationBulkActions component (22 tests)
- [x] 5.2 Test disabled states and edge cases
- [x] 5.3 Test confirmation dialog flow and accessibility

---

## Technical Design

### Component Structure

```
NotificationsView
├── Header (existing)
├── PendingInvitationsSection (existing)
├── NotificationsList (existing)
├── NotificationBulkActions (NEW)
│   ├── Mark All Read Button
│   └── Dismiss All Button
└── Empty State (existing)
```

### Props Interface

```typescript
interface NotificationBulkActionsProps {
  totalCount: number;
  unreadCount: number;
  onMarkAllRead: () => Promise<void>;
  onDismissAll: () => Promise<void>;
  t: (key: string) => string;
  lang: 'en' | 'es';
}
```

### Button Styles

- **Mark All Read**: Secondary/outline style, left-aligned
- **Dismiss All**: Destructive/red outline style, right-aligned
- Both buttons should be compact but touch-friendly (min-height 44px)

---

## UI Mockup (Text)

```
┌─────────────────────────────────────┐
│  [Header: Alertas]                  │
├─────────────────────────────────────┤
│  [Notification 1]                   │
│  [Notification 2]                   │
│  [Notification 3]                   │
├─────────────────────────────────────┤
│                                     │
│  [Mark all read]    [Dismiss all]   │
│                                     │
└─────────────────────────────────────┘
```

---

## i18n Keys Required

```typescript
// English
markAllRead: "Mark all read"
dismissAll: "Dismiss all"
deleteAllNotifications: "Delete all notifications"
confirmDeleteNotifications: "Delete {count} notifications?"
notificationsMarkedRead: "{count} notifications marked as read"
notificationsDeleted: "{count} notifications deleted"

// Spanish
markAllRead: "Marcar todo leído"
dismissAll: "Descartar todo"
deleteAllNotifications: "Eliminar todas las notificaciones"
confirmDeleteNotifications: "¿Eliminar {count} notificaciones?"
notificationsMarkedRead: "{count} notificaciones marcadas como leídas"
notificationsDeleted: "{count} notificaciones eliminadas"
```

---

## Definition of Done

- [x] Bulk actions row appears as subtle inline section below notifications
- [x] Mark all read button works and shows feedback
- [x] Dismiss all button shows confirmation and works
- [x] Buttons disabled when appropriate
- [x] Toast messages confirm actions
- [x] Section hidden when no notifications
- [x] Unit tests added (22 tests)
- [x] i18n keys added for both languages
- [ ] Code review approved

---

## File List

| File | Change |
|------|--------|
| `src/components/SharedGroups/NotificationBulkActions.tsx` | **NEW** - Bulk actions component with confirmation dialog |
| `src/components/SharedGroups/index.ts` | Export new component |
| `src/views/NotificationsView.tsx` | Add bulk actions section |
| `src/utils/translations.ts` | Add i18n keys (en + es) |
| `tests/unit/components/SharedGroups/NotificationBulkActions.test.tsx` | **NEW** - 22 unit tests |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | User + Claude |
| 2026-01-20 | Implementation complete - subtle inline row design | Claude |
