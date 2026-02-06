# Tech Debt Story TD-14d-6: Rate Limiting for Destructive Operations

Status: backlog

> **Source:** ECC Code Review #5 (2026-02-03) on story 14d-v2-1-7e
> **Priority:** LOW (enhancement, not blocking)
> **Estimated Effort:** 8-12 hours
> **Risk:** MEDIUM (Cloud Function infrastructure change)

## Story

As a **system administrator**,
I want **rate limiting on destructive group operations**,
So that **malicious or runaway clients cannot exhaust Firestore resources**.

## Problem Statement

The `deleteGroupAsOwner` function performs multiple Firestore operations without rate limiting:

```typescript
// src/features/shared-groups/services/groupService.ts
export async function deleteGroupAsOwner(...) {
  // 1. Clear sharedGroupId on ALL members' transactions (N queries + N*M writes)
  // 2. Delete changelog subcollection (N deletes)
  // 3. Delete analytics subcollection (N deletes)
  // 4. Delete pending invitations (N deletes)
  // 5. Delete group document (1 delete)
}
```

**Current mitigations:**
- Type-to-confirm UI pattern (requires exact group name match)
- Ownership validation before cascade operations
- Transaction-based atomic final delete

**Gap:** No server-side rate limiting for rapid repeated calls.

## Acceptance Criteria

1. **Given** a user making rapid delete requests
   **When** rate limit is exceeded
   **Then** requests are rejected with 429 Too Many Requests

2. **Given** a Cloud Function for group deletion
   **When** called with valid ownership
   **Then** all cascade operations execute atomically

3. **Given** existing client code
   **When** migrated to Cloud Function
   **Then** error handling and UI feedback remain consistent

4. **Given** the rate limit configuration
   **When** defined
   **Then** it allows legitimate use (e.g., 5 deletes per hour per user)

## Proposed Solution

### Option A: Cloud Function (Recommended)

```typescript
// functions/src/triggers/groupDeletion.ts
import * as functions from 'firebase-functions';

export const deleteGroup = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    // Rate limiting via callable function quotas
    // Atomic execution with Admin SDK
    // Audit logging
  });
```

**Pros:**
- Server-side rate limiting via Cloud Functions quotas
- Admin SDK bypasses security rules for cleanup
- Centralized audit logging
- Atomic operations (no client-side TOCTOU concerns)

**Cons:**
- Infrastructure change (new Cloud Function)
- Cold start latency
- Additional Firebase Functions billing

### Option B: Client-Side Cooldown

```typescript
// Add to useGroupDialogs store
lastDeleteAttemptAt: number | null,
canAttemptDelete: () => boolean,
```

**Pros:**
- No infrastructure change
- Immediate implementation
- No billing impact

**Cons:**
- Bypassable by malicious clients
- Only UX protection, not server-side

## Tasks / Subtasks

### Option A Tasks (Cloud Function)

- [ ] **Task 1: Create Cloud Function** (AC: #1, #2)
  - [ ] 1.1: Create `functions/src/triggers/groupDeletion.ts`
  - [ ] 1.2: Implement callable function with rate limit check
  - [ ] 1.3: Port deletion logic from `groupService.ts`
  - [ ] 1.4: Add audit logging to Cloud Logging

- [ ] **Task 2: Update Client** (AC: #3)
  - [ ] 2.1: Create `src/services/groupDeletionService.ts` (callable wrapper)
  - [ ] 2.2: Update `GruposView.tsx` to use callable
  - [ ] 2.3: Handle rate limit errors (429) with user feedback

- [ ] **Task 3: Testing** (AC: #4)
  - [ ] 3.1: Unit tests for Cloud Function
  - [ ] 3.2: Integration tests with emulator
  - [ ] 3.3: E2E test for rate limit behavior

- [ ] **Task 4: Deployment**
  - [ ] 4.1: Deploy Cloud Function to staging
  - [ ] 4.2: Test in staging environment
  - [ ] 4.3: Deploy to production

## Dev Notes

### Rate Limit Configuration

```typescript
const RATE_LIMITS = {
  DELETE_GROUP_PER_HOUR: 5,
  DELETE_GROUP_PER_DAY: 20,
};
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Security** | ✅ Server-side protection | ❌ Client-side only |
| **Complexity** | ❌ New infrastructure | ✅ No change |
| **Cost** | ❌ Cloud Function invocations | ✅ No additional cost |
| **Current risk** | Low (type-to-confirm friction) | Low |
| **Audit compliance** | ✅ Centralized logging | ❌ DEV-only logging |

**Recommendation:** Defer to post-Epic or Beta phase. Current UI friction (type-to-confirm) provides acceptable protection for Alpha/MVP. Cloud Function approach is more appropriate when:
- Scaling to many users
- Enterprise compliance requirements
- Need for centralized audit trail

### Dependencies

- Requires: Firebase Functions setup (already configured)
- Before: Public Beta launch

### References

- [14d-v2-1-7e](./14d-v2-1-7e-delete-ui-security-rules.md) - Source of this tech debt item (ECC Review #5)
- [groupService.ts](../../../../src/features/shared-groups/services/groupService.ts) - Current client-side implementation
- [Firebase Callable Functions](https://firebase.google.com/docs/functions/callable)
