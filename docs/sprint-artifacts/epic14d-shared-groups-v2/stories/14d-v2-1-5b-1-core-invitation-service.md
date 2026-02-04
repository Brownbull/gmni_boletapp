# Story 14d-v2.1.5b-1: Core Invitation Service

Status: done

> **Split from:** Story 14d-v2.1.5b (Invitation Backend - Service & Security)
> **Split reason:** Original story exceeded subtask limit (18 > 15)
> **Split strategy:** by_feature - Core Service → Validation & Security
> **Related stories:** 14d-v2-1-5b-2 (Validation & Security)
> **Depends on:** 14d-v2-1-5a (types and utils must exist)

## Story

As a **group owner**,
I want **a service to create and manage invitations**,
So that **I can invite others to my shared group**.

## Acceptance Criteria

### From Original Story

1. **Given** I am a group owner
   **When** I create an invitation
   **Then** the invitation is stored with pending status
   **And** it includes `invitedBy` user info

2. **Given** the invited user already has a pending invitation for this group
   **When** I try to invite them again
   **Then** I receive: "This person already has a pending invitation"
   **And** no duplicate invitation is created

## Tasks / Subtasks

- [x] **Task 1: Create Invitation Service** (AC: #1, #2)
  - [x] 1.1: Create `src/services/invitationService.ts`
  - [x] 1.2: Implement `createInvitation(groupId, groupName, invitedBy, invitedEmail?): Promise<PendingInvitation>`
  - [x] 1.3: Implement `getInvitationByShareCode(shareCode): Promise<PendingInvitation | null>`
  - [x] 1.4: Implement `checkDuplicateInvitation(groupId, email): Promise<boolean>`
  - [x] 1.5: Store invitations in Firestore at `/pendingInvitations/{invitationId}`
  - [x] 1.6: Add secondary index on `shareCode` for quick lookup
  - [x] 1.7: Add unit tests for service functions

## Dev Notes

### Service Function Signatures

```typescript
// src/services/invitationService.ts

import { PendingInvitation, InvitedBy } from '@/features/shared-groups/types';

export async function createInvitation(
  groupId: string,
  groupName: string,
  invitedBy: InvitedBy,
  invitedEmail?: string
): Promise<PendingInvitation>;

export async function getInvitationByShareCode(
  shareCode: string
): Promise<PendingInvitation | null>;

export async function checkDuplicateInvitation(
  groupId: string,
  email: string
): Promise<boolean>;
```

### Firestore Document Structure

```typescript
// /pendingInvitations/{invitationId}
{
  id: string;
  groupId: string;
  groupName: string;
  shareCode: string;  // URL-safe nanoid
  invitedBy: {
    uid: string;
    displayName: string;
    email?: string;
  };
  invitedEmail?: string;  // Optional - for email-based invites
  status: 'pending';
  createdAt: Timestamp;
  expiresAt: Timestamp;  // 7 days from creation
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/invitationService.ts` | **NEW** | Invitation CRUD operations |
| `tests/unit/services/invitationService.test.ts` | **NEW** | Service tests |

### Testing Standards

- **Unit tests:** 15+ tests covering service functions
- **Coverage target:** 80%+ for new code
- **Test scenarios:** create success, duplicate check, shareCode lookup, error handling

### References

- [Original Story: 14d-v2-1-5b-invitation-backend.md](./14d-v2-1-5b-invitation-backend.md)
- [Foundation Story: 14d-v2-1-5a-invitation-foundation.md](./14d-v2-1-5a-invitation-foundation.md)
- [Split Story: 14d-v2-1-5b-2-validation-security.md](./14d-v2-1-5b-2-validation-security.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. **Task 1.1 (invitationService.ts):** Created new `src/services/invitationService.ts` with 4 exported functions:
   - `createInvitation()`: Creates invitation with auto-generated shareCode, 7-day expiry
   - `getInvitationByShareCode()`: Deep link support for invitation lookup
   - `checkDuplicateInvitation()`: Prevents duplicate pending invitations
   - `getInvitationsForEmail()`: Bonus function to get all pending invitations for a user

2. **Task 1.2-1.5 (Implementation):**
   - Uses `CreateInvitationInput` interface for typed parameters
   - Emails normalized via `normalizeEmail()` for consistent lookups
   - ShareCode generated using `generateShareCode()` from shareCodeUtils
   - Invitations stored at `/pendingInvitations/{invitationId}` collection
   - Server timestamp for createdAt, calculated Timestamp for expiresAt

3. **Task 1.6 (Firestore Indexes):** Added 3 composite indexes in `firestore.indexes.json`:
   - `shareCode + status` (for getInvitationByShareCode)
   - `groupId + invitedEmail + status` (for checkDuplicateInvitation)
   - `invitedEmail + status` (for getInvitationsForEmail)

4. **Task 1.7 (Unit Tests):** Created `tests/unit/services/invitationService.test.ts` with 47 tests:
   - createInvitation: 18 tests (AC #1)
   - getInvitationByShareCode: 9 tests (AC #1)
   - checkDuplicateInvitation: 10 tests (AC #2)
   - getInvitationsForEmail: 6 tests
   - Integration scenarios: 3 tests
   - Edge cases: 4 tests

5. **Type Update:** Added required `shareCode` field to `PendingInvitation` interface in `src/types/sharedGroup.ts` (needed for deep link support)

6. **Full test suite:** 6569 tests passing, no regressions

### Code Review Fixes (Atlas-Enhanced Review 2026-02-02)

**Reviewer:** Claude Opus 4.5 (atlas-code-review workflow)

**Issues Found & Fixed:**

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | CRITICAL | `invitationService.ts` was UNTRACKED | Staged with `git add` |
| 2 | CRITICAL | Test file was UNTRACKED | Staged with `git add` |
| 3 | CRITICAL | Story file was UNTRACKED | Staged with `git add` |
| 4 | MEDIUM | Missing input sanitization for `groupName`, `invitedByName`, `groupIcon` | Added `sanitizeInput()` calls per Atlas Section 6 pattern |
| 5 | LOW | Suspicious double type cast `as unknown as Timestamp` | Simplified to `as Timestamp` with clarifying comment |

**Test Updates:**
- Updated edge case test "handles very long group names" to expect truncated result (100 chars max)
- All 47 tests passing after fixes

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/services/invitationService.ts` | **NEW** | Core invitation service with CRUD functions |
| `src/types/sharedGroup.ts` | Modified | Added `shareCode` field to PendingInvitation interface |
| `firestore.indexes.json` | Modified | Added 3 composite indexes for pendingInvitations |
| `tests/unit/services/invitationService.test.ts` | **NEW** | 47 unit tests for invitation service |
| `tests/unit/types/sharedGroup.invitation.test.ts` | Modified | Added shareCode to mock + 1 new test |
