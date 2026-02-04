# Story 14d-v2.1.5b-2: Invitation Validation & Security Rules

Status: done

> **Split from:** Story 14d-v2.1.5b (Invitation Backend - Service & Security)
> **Split reason:** Original story exceeded subtask limit (18 > 15)
> **Split strategy:** by_feature - Core Service → Validation & Security
> **Related stories:** 14d-v2-1-5b-1 (Core Invitation Service)
> **Depends on:** 14d-v2-1-5b-1 (service must exist), 14d-v2-1-5a (types must exist)

## Story

As a **group owner**,
I want **business constraints validated and proper security rules**,
So that **invitations are secure and groups don't exceed their limits**.

## Acceptance Criteria

### From Original Story

1. **Given** I invite someone
   **When** the invitation is created
   **Then** business constraint BC-2 is enforced (max 10 contributors)
   **And** business constraint BC-3 is enforced (max 200 viewers)

2. **Given** I try to invite and the group is at max contributors (10)
   **When** the validation fails
   **Then** a clear error message is returned: "This group has reached the maximum number of contributors (10)"

3. **Given** an invitation is created
   **When** it is stored in Firestore
   **Then** only authenticated group owners can create invitations
   **And** invitations are readable by authenticated users
   **And** only group owners can delete invitations (cancellation)

## Tasks / Subtasks

- [x] **Task 1: Add Business Constraint Validation** (AC: #1, #2)
  - [x] 1.1: Create `validateGroupCapacity(groupId): Promise<{ canAddContributor: boolean, canAddViewer: boolean, reason?: string }>`
  - [x] 1.2: Check current member count against BC-2 (10 contributors)
  - [x] 1.3: Check current member count against BC-3 (200 viewers)
  - [x] 1.4: Return clear error messages for each limit
  - [x] 1.5: Add unit tests for boundary conditions (9, 10, 11 members)

- [x] **Task 2: Add Firestore Security Rules** (AC: #3)
  - [x] 2.1: Add rules for `/pendingInvitations/{invitationId}`
  - [x] 2.2: Allow create only by authenticated group owners
  - [x] 2.3: Allow read by authenticated users
  - [x] 2.4: Deny update (invitations are immutable)
  - [x] 2.5: Allow delete by group owner (for cancellation)
  - [x] 2.6: Add security rules tests

## Dev Notes

### Business Constraint Validation

| Constraint | Limit | Error Message |
|------------|-------|---------------|
| BC-2 | 10 contributors | "This group has reached the maximum number of contributors (10)" |
| BC-3 | 200 viewers | "This group has reached the maximum number of viewers (200)" |

### Validation Function Signature

```typescript
// Add to src/services/invitationService.ts

export async function validateGroupCapacity(
  groupId: string
): Promise<{
  canAddContributor: boolean;
  canAddViewer: boolean;
  reason?: string;
}>;
```

### Firestore Security Rules

```javascript
match /pendingInvitations/{invitationId} {
  // Allow group owners to create invitations
  allow create: if request.auth != null
    && exists(/databases/$(database)/documents/sharedGroups/$(request.resource.data.groupId))
    && get(/databases/$(database)/documents/sharedGroups/$(request.resource.data.groupId)).data.ownerId == request.auth.uid;

  // Allow read by authenticated user
  allow read: if request.auth != null;

  // Allow delete by group owner (cancellation)
  allow delete: if request.auth != null
    && get(/databases/$(database)/documents/sharedGroups/$(resource.data.groupId)).data.ownerId == request.auth.uid;

  // Deny updates (invitations are immutable)
  allow update: if false;
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/invitationService.ts` | Modify | Add validateGroupCapacity function |
| `firestore.rules` | Modify | Add pendingInvitations rules |
| `tests/unit/services/invitationService.test.ts` | Modify | Add validation tests |
| `tests/integration/firestore-rules.test.ts` | Modify | Add pendingInvitations security rules tests |

### Testing Standards

- **Unit tests:** 10+ tests for validation (boundary conditions)
- **Security rules tests:** 10+ tests for all permission scenarios
- **Coverage target:** 80%+ for new code

### References

- [Original Story: 14d-v2-1-5b-invitation-backend.md](./14d-v2-1-5b-invitation-backend.md)
- [Core Service Story: 14d-v2-1-5b-1-core-invitation-service.md](./14d-v2-1-5b-1-core-invitation-service.md)
- [Business Constraints: BC-2, BC-3 in epics.md](../epics.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- **Task 1 - Business Constraint Validation**
  - Added `MAX_CONTRIBUTORS_PER_GROUP: 10` and `MAX_VIEWERS_PER_GROUP: 200` constants to `SHARED_GROUP_LIMITS` in sharedGroup.ts
  - Implemented `validateGroupCapacity()` function in invitationService.ts
  - Function fetches group document and checks member count against both limits
  - Returns `{ canAddContributor: boolean, canAddViewer: boolean, reason?: string }`
  - Viewer limit message prioritized when that limit is hit (higher constraint)
  - Added 25+ unit tests covering all boundary conditions (0, 1, 5, 9, 10, 11, 100, 199, 200, 201 members)
  - Tests include edge cases: empty groupId, group not found, undefined/null members array

- **Task 2 - Firestore Security Rules**
  - Replaced stub pendingInvitations rules with proper security rules
  - Create: Requires authentication + group exists + user is group owner
  - Read: Any authenticated user can read (for viewing invitations sent to their email)
  - Update: Always denied (invitations are immutable)
  - Delete: Only group owner can delete (for cancellation)
  - Added helper function `isGroupOwnerForInvitation()` for DRY rule logic
  - Added 12 security rules integration tests covering all permission scenarios

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/types/sharedGroup.ts` | Modified | Added MAX_CONTRIBUTORS_PER_GROUP (10) and MAX_VIEWERS_PER_GROUP (200) constants |
| `src/services/invitationService.ts` | Modified | Added validateGroupCapacity function and GroupCapacityResult type |
| `firestore.rules` | Modified | Added pendingInvitations security rules (create/read/update/delete) |
| `tests/unit/services/invitationService.test.ts` | Modified | Added 25+ unit tests for validateGroupCapacity |
| `tests/integration/firestore-rules.test.ts` | Modified | Added 12 security rules tests for pendingInvitations |
| `tests/setup/firebase-emulator.ts` | Modified | Added PENDING_INVITATIONS_PATH constant |

### Test Results

- **Unit tests:** 25+ tests for validateGroupCapacity (all passing)
- **Integration tests:** 12 tests for pendingInvitations security rules (all passing)
- **Note:** Pre-existing failing test in Shared Group rules (unrelated to this story) - sharedGroups read rules were changed in story 14d-v2-1-4d to support aggregation queries, but test expects old behavior
