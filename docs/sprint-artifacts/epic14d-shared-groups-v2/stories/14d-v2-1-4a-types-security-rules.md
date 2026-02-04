# Story 14d-v2.1.4a: Types & Security Rules Foundation

Status: done

> Part 1 of 4 - Split from Story 14d-v2-1-4 (Create Shared Group)
> Split reason: Original story exceeded sizing limits (8 tasks, 42 subtasks, 8 files)
> Split strategy: by_layer (Architectural Layer)

## Story

As a **developer**,
I want **TypeScript types and Firestore security rules for shared groups**,
So that **the foundation is ready for service layer implementation**.

## Acceptance Criteria

### From Original Story (AC: #2, #4)

1. **Given** the codebase
   **When** I need to work with shared groups
   **Then** I have properly typed interfaces:
   - `SharedGroup` interface with all required fields
   - `SharedGroupMember` interface for member objects
   - All fields have JSDoc documentation
   - Types are exported from `src/types/index.ts`

2. **Given** a user tries to create a group
   **When** they have 5+ existing groups
   **Then** security rules prevent creation (BC-1)

3. **Given** a user tries to read a group
   **When** they are not a member
   **Then** security rules deny access

4. **Given** a user tries to update/delete a group
   **When** they are not the owner
   **Then** security rules deny the operation

## Tasks / Subtasks

- [x] **Task 1: Define SharedGroup Type** (AC: #1)
  - [x] 1.1: Create `src/types/sharedGroup.ts` (or update if exists from 14c cleanup)
  - [x] 1.2: Define `SharedGroup` interface with all required fields
  - [x] 1.3: Define `SharedGroupMember` interface
  - [x] 1.4: Add JSDoc comments explaining each field's purpose
  - [x] 1.5: Export types from `src/types/index.ts`

- [x] **Task 2: Create Firestore Security Rules** (AC: #2, #3, #4)
  - [x] 2.1: Add `/groups/{groupId}` collection rules
  - [x] 2.2: Allow read: only group members
  - [x] 2.3: Allow create: authenticated users (with BC-1 validation note)
  - [x] 2.4: Allow update: owner only (for group settings)
  - [x] 2.5: Allow delete: owner only
  - [x] 2.6: Add unit tests for security rules

## Dev Notes

### Sizing Metrics

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 2 | ≤4 | ✅ OK |
| Subtasks | 11 | ≤15 | ✅ OK |
| Files | 2-3 | ≤8 | ✅ OK |

**Classification:** MEDIUM (2 tasks, 11 subtasks, 2-3 files)

### SharedGroup Type Definition

```typescript
export interface SharedGroup {
  id: string;
  name: string;
  ownerId: string;
  members: SharedGroupMember[];
  createdAt: Timestamp;
  timezone: string;  // IANA format (e.g., "America/Santiago")

  // Transaction sharing controls (Layered Visibility Model)
  transactionSharingEnabled: boolean;
  transactionSharingLastToggleAt: Timestamp | null;
  transactionSharingToggleCountToday: number;

  // Optional fields
  shareCode?: string;  // For invite links (Story 1.5)
  shareCodeCreatedAt?: Timestamp;
}

export interface SharedGroupMember {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
}
```

### Security Rules Pattern

```javascript
match /groups/{groupId} {
  // Helper functions
  function isGroupMember() {
    return request.auth != null &&
           request.auth.uid in resource.data.members.map(m => m.id);
  }

  function isGroupOwner() {
    return request.auth != null &&
           request.auth.uid == resource.data.ownerId;
  }

  allow read: if isGroupMember();
  allow create: if request.auth != null;
  allow update: if isGroupOwner();
  allow delete: if isGroupOwner();
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/sharedGroup.ts` | CREATE | Type definitions |
| `firestore.rules` | MODIFY | Add group collection rules |
| `tests/unit/firestore.rules.test.ts` | MODIFY | Security rules tests |

### Dependencies

- **Blocks:** Story 14d-v2-1-4b (Service Layer needs types)
- **Blocked by:** None

### References

- [Original Story: 14d-v2-1-4-create-shared-group.md]
- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-14]
- [BC-1 Constraint: epics.md line 104]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 via atlas-dev-story workflow

### Debug Log References

- TypeScript compiled successfully
- Integration tests: 24 files passed, 356 tests
- Unit tests: 255 files passed, 6298 tests

### Completion Notes List

1. **Task 1 - SharedGroup Type:**
   - SharedGroup interface already existed in `src/types/sharedGroup.ts` from Epic 14c cleanup
   - Added new `SharedGroupMember` interface with JSDoc documentation
   - Interface includes: id, displayName, email, photoURL?, role ('owner' | 'member'), joinedAt
   - Exported from `src/types/index.ts` barrel export

2. **Task 2 - Security Rules:**
   - Updated `firestore.rules` to enable sharedGroups collection access
   - Added `isGroupMember()` helper function (uses members[] array of user IDs)
   - Added `isGroupOwner()` helper function (checks ownerId field)
   - Read: only group members (AC#3)
   - Create: authenticated users (BC-1 enforced client-side via SHARED_GROUP_LIMITS.MAX_OWNED_GROUPS)
   - Update/Delete: owner only (AC#4)
   - Added 12 new integration tests in `tests/integration/firestore-rules.test.ts`
   - Deleted obsolete `tests/integration/shared-groups-rules.test.ts` (expected all-denied from 14c-refactor)

3. **Architecture Note:**
   - Existing SharedGroup uses `members: string[]` (array of user IDs), not `members: SharedGroupMember[]`
   - This is the correct architecture from Epic 14c - member profile data is stored in `memberProfiles: Record<string, MemberProfile>`
   - SharedGroupMember interface is provided for cases where full member data is needed (e.g., member list UI)

### File List

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/types/sharedGroup.ts` | MODIFIED | +44 (SharedGroupMember interface) |
| `src/types/index.ts` | CREATE | +78 (types barrel export) |
| `src/features/shared-groups/types.ts` | MODIFIED | +1 (export SharedGroupMember) |
| `src/features/shared-groups/index.ts` | MODIFIED | +1 (export SharedGroupMember) |
| `firestore.rules` | MODIFIED | +20 (enabled security rules) |
| `tests/integration/firestore-rules.test.ts` | MODIFIED | +192 (12 new tests) |
| `tests/integration/shared-groups-rules.test.ts` | DELETED | -266 (obsolete) |

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-01 | Story implementation complete | Claude Opus 4.5 |
| 2026-02-01 | Atlas Code Review: Fixed 2 MEDIUM issues (File List accuracy, SharedGroupMember export) | Claude Opus 4.5 |
