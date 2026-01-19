# Story 14c.15: Notification Tech Debt Cleanup

**Status**: backlog
**Points**: 2
**Priority**: Low
**Dependencies**: 14c.13 (push notifications)

---

## Story

As a developer,
I want to consolidate duplicated notification interfaces and move configuration to environment variables,
so that the codebase is cleaner and follows best practices.

---

## Background

During the Atlas Code Review of Story 14c.13, two tech debt items were identified:

1. **M2**: `NotificationClickData` interface is duplicated in 2 files
2. **M1**: VAPID public key is hardcoded in client-side code

These are low-priority cleanup items that don't affect functionality but improve code quality.

---

## Acceptance Criteria

### AC1: Consolidate NotificationClickData Interface
- Given the interface exists in both `usePushNotifications.ts` and `useSharedGroupTransactions.ts`
- When I consolidate them
- Then there is a single source of truth in `src/types/notification.ts`
- And both files import from the shared location

### AC2: Move VAPID Public Key to Environment Variable
- Given the VAPID public key is hardcoded in `webPushService.ts`
- When I move it to an environment variable
- Then the key is read from `import.meta.env.VITE_VAPID_PUBLIC_KEY`
- And the `.env.example` file is updated with the new variable
- And the deployment documentation is updated

---

## Tasks / Subtasks

### Task 1: Consolidate NotificationClickData Interface (AC: #1)

- [ ] 1.1 Add `NotificationClickData` interface to `src/types/notification.ts`
- [ ] 1.2 Update `src/hooks/usePushNotifications.ts` to import from shared types
- [ ] 1.3 Update `src/hooks/useSharedGroupTransactions.ts` to import from shared types
- [ ] 1.4 Remove duplicate interface definitions
- [ ] 1.5 Verify TypeScript compilation

### Task 2: VAPID Public Key Environment Variable (AC: #2)

- [ ] 2.1 Add `VITE_VAPID_PUBLIC_KEY` to `.env.example`
- [ ] 2.2 Update `src/services/webPushService.ts` to use `import.meta.env.VITE_VAPID_PUBLIC_KEY`
- [ ] 2.3 Add fallback for development (optional - key can be committed since it's public)
- [ ] 2.4 Update deployment documentation if needed
- [ ] 2.5 Test subscription flow works with env var

---

## Technical Notes

### NotificationClickData Interface

Current duplicated interface:

```typescript
// Found in both usePushNotifications.ts and useSharedGroupTransactions.ts
interface NotificationClickData {
    url?: string;
    groupId?: string;
    transactionId?: string;
    type?: string;
}
```

Target location: `src/types/notification.ts`

### VAPID Public Key

Current hardcoded value in `webPushService.ts`:
```typescript
const VAPID_PUBLIC_KEY = 'BEANNj...';
```

Target:
```typescript
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
```

Note: VAPID public keys are designed to be public - they're included in every push subscription request. The private key (which IS secret) is already properly stored in Cloud Functions environment variables.

---

## Definition of Done

- [ ] NotificationClickData interface consolidated to single file
- [ ] VAPID public key read from environment variable
- [ ] TypeScript compilation passing
- [ ] Push notification subscription still works
- [ ] All existing tests pass

---

## References

- [Story 14c.13 Code Review](./14c-13-fcm-push-notifications.md#code-review) - Issues M1, M2
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292) - Public key is meant to be public
