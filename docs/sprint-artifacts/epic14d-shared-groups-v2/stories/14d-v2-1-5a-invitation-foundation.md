# Story 14d-v2.1.5a: Invitation Foundation (Types & Utils)

Status: done

> **Split from:** Story 14d-v2.1.5 (Invite Members to Group)
> **Split reason:** Original story exceeded sizing limits (8 tasks, 42 subtasks, 9 files)
> **Split strategy:** by_layer - Foundation → Backend → UI
> **Related stories:** 14d-v2-1-5b (Backend), 14d-v2-1-5c (UI)

## Story

As a **developer**,
I want **foundational types and utilities for the invitation system**,
So that **the backend and UI layers have a solid foundation to build upon**.

## Acceptance Criteria

### From Original Story

1. **Given** the invitation system is being built
   **When** types are defined
   **Then** `PendingInvitation` interface exists in `src/types/sharedGroup.ts`
   **And** all required fields are documented with JSDoc

2. **Given** a share code is needed
   **When** `generateShareCode()` is called
   **Then** it returns a cryptographically random, URL-safe alphanumeric string
   **And** the code is 16+ characters long

3. **Given** an email is provided
   **When** `validateEmail()` is called
   **Then** it correctly identifies valid/invalid email formats

## Tasks / Subtasks

- [x] **Task 1: Create Invitation Data Model** (AC: #1)
  - [x] 1.1: Define `PendingInvitation` interface in `src/types/sharedGroup.ts`
  - [x] 1.2: Add fields: `id`, `groupId`, `groupName`, `shareCode`, `invitedBy`, `createdAt`, `expiresAt`, `status`
  - [x] 1.3: Add `invitedEmail` optional field for email invitations
  - [x] 1.4: Set expiration to 7 days from creation (documented in type)
  - [x] 1.5: Add JSDoc comments explaining each field

- [x] **Task 2: Create Share Code Generator** (AC: #2)
  - [x] 2.1: Create `src/utils/shareCodeUtils.ts`
  - [x] 2.2: Implement `generateShareCode(): string` using crypto.randomUUID or similar
  - [x] 2.3: Ensure URL-safe alphanumeric output (no special chars)
  - [x] 2.4: Ensure 16+ character length
  - [x] 2.5: Add unit tests for uniqueness and format validation

- [x] **Task 3: Email Validation Utility** (AC: #3)
  - [x] 3.1: Create `validateEmail(email: string): boolean` in `src/utils/validationUtils.ts`
  - [x] 3.2: Use standard email regex pattern
  - [x] 3.3: Add unit tests for valid/invalid email formats

## Dev Notes

### Data Model: PendingInvitation (Actual Implementation)

```typescript
// /pendingInvitations/{invitationId}
export interface PendingInvitation {
  id?: string;                     // Firestore document ID (optional before creation)
  groupId: string;                 // Reference to shared group
  groupName: string;               // Display name for UI
  groupColor: string;              // Group color (denormalized for display)
  groupIcon?: string;              // Group icon (denormalized for display)
  invitedEmail: string;            // Email address of invited user (lowercase)
  invitedByUserId: string;         // User ID of person who sent invite
  invitedByName: string;           // Display name of inviter (denormalized)
  createdAt: Timestamp;
  expiresAt: Timestamp;            // createdAt + 7 days
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}
```

**Note:** Implementation uses flat fields (`invitedByUserId`, `invitedByName`) instead of nested `invitedBy` object for simpler Firestore queries.

### Share Code Generation (Actual Implementation)

```typescript
import { nanoid } from 'nanoid';

// Uses nanoid for cryptographically secure, URL-safe codes
function generateShareCode(): string {
  return nanoid(16); // 16-char URL-safe string (A-Za-z0-9_-)
}
```

**Note:** Uses nanoid library instead of manual crypto implementation for better security and simplicity.

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/sharedGroup.ts` | Modify | Add `PendingInvitation` interface |
| `src/utils/shareCodeUtils.ts` | **NEW** | Share code generation |
| `src/utils/validationUtils.ts` | Modify | Add email validation |
| `tests/unit/utils/shareCodeUtils.test.ts` | **NEW** | Share code tests |

### Testing Standards

- **Unit tests:** 10+ tests covering utils
- **Coverage target:** 80%+ for new code

### References

- [Original Story: 14d-v2-1-5-invite-members.md](./14d-v2-1-5-invite-members.md)
- [Epic 14d-v2 Requirements: ../epics.md#story-15-invite-members-to-group]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. **Task 1 (PendingInvitation):** Interface already existed in `src/types/sharedGroup.ts` with all required fields and JSDoc documentation. Added 19 unit tests for `isInvitationExpired()` and `getInvitationTimeRemaining()` utility functions.

2. **Task 2 (shareCodeUtils):** Created new `src/utils/shareCodeUtils.ts` with:
   - `generateShareCode()`: Uses nanoid(16) for cryptographically secure, URL-safe codes
   - `isValidShareCode()`: Validates format (16 chars, URL-safe alphabet)
   - 15 unit tests covering uniqueness, format, and edge cases

3. **Task 3 (validationUtils):** Created new `src/utils/validationUtils.ts` with:
   - `validateEmail()`: RFC 5322-based email validation
   - `normalizeEmail()`: Lowercase + trim normalization helper
   - 36 unit tests covering valid formats, invalid formats, and edge cases

4. **Total new tests:** 70 tests added (19 + 15 + 36)
5. **Full test suite:** 6521 tests passing, no regressions

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/types/sharedGroup.ts` | Modified | Added PendingInvitation interface, isInvitationExpired(), getInvitationTimeRemaining() |
| `src/utils/shareCodeUtils.ts` | **NEW** | Share code generation + validation |
| `src/utils/validationUtils.ts` | **NEW** | Email validation utilities |
| `tests/unit/utils/shareCodeUtils.test.ts` | **NEW** | 15 tests for share code utils |
| `tests/unit/utils/validationUtils.test.ts` | **NEW** | 36 tests for email validation |
| `tests/unit/types/sharedGroup.invitation.test.ts` | **NEW** | 19 tests for PendingInvitation utilities |
| `docs/sprint-artifacts/sprint-status.yaml` | Modified | Story status: ready-for-dev → in-progress → review |
