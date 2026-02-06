# Story 14d-v2.1.5b: Invitation Backend (Service & Security)

Status: split

> **SPLIT 2026-02-01:** This story exceeded sizing limits (18 subtasks > 15 max).
> Split into:
> - [14d-v2-1-5b-1: Core Invitation Service](./14d-v2-1-5b-1-core-invitation-service.md) (1 task, 7 subtasks)
> - [14d-v2-1-5b-2: Validation & Security](./14d-v2-1-5b-2-validation-security.md) (2 tasks, 11 subtasks)

> **Split from:** Story 14d-v2.1.5 (Invite Members to Group)
> **Split reason:** Original story exceeded sizing limits (8 tasks, 42 subtasks, 9 files)
> **Split strategy:** by_layer - Foundation → Backend → UI
> **Related stories:** 14d-v2-1-5a (Foundation), 14d-v2-1-5c (UI)
> **Depends on:** 14d-v2-1-5a (types and utils must exist)

## Story

As a **group owner**,
I want **backend services to create and manage invitations**,
So that **I can invite others to my shared group securely**.

## Acceptance Criteria

### From Original Story

1. **Given** I am a group owner
   **When** I create an invitation
   **Then** the invitation is stored with pending status
   **And** it includes `invitedBy` user info

2. **Given** I invite someone
   **When** the invitation is created
   **Then** business constraint BC-2 is enforced (max 10 contributors)
   **And** business constraint BC-3 is enforced (max 200 viewers)

3. **Given** I try to invite and the group is at max contributors (10)
   **When** the validation fails
   **Then** a clear error message is returned: "This group has reached the maximum number of contributors (10)"

4. **Given** the invited user already has a pending invitation for this group
   **When** I try to invite them again
   **Then** I receive: "This person already has a pending invitation"
   **And** no duplicate invitation is created

5. **Given** an invitation is created
   **When** it is stored in Firestore
   **Then** only authenticated group owners can create invitations
   **And** invitations are readable by authenticated users
   **And** only group owners can delete invitations (cancellation)

## Tasks / Subtasks

- [ ] **Task 1: Create Invitation Service** (AC: #1, #4)
  - [ ] 1.1: Create `src/services/invitationService.ts`
  - [ ] 1.2: Implement `createInvitation(groupId, groupName, invitedBy, invitedEmail?): Promise<PendingInvitation>`
  - [ ] 1.3: Implement `getInvitationByShareCode(shareCode): Promise<PendingInvitation | null>`
  - [ ] 1.4: Implement `checkDuplicateInvitation(groupId, email): Promise<boolean>`
  - [ ] 1.5: Store invitations in Firestore at `/pendingInvitations/{invitationId}`
  - [ ] 1.6: Add secondary index on `shareCode` for quick lookup
  - [ ] 1.7: Add unit tests for service functions

- [ ] **Task 2: Add Business Constraint Validation** (AC: #2, #3)
  - [ ] 2.1: Create `validateGroupCapacity(groupId): Promise<{ canAddContributor: boolean, canAddViewer: boolean, reason?: string }>`
  - [ ] 2.2: Check current member count against BC-2 (10 contributors)
  - [ ] 2.3: Check current member count against BC-3 (200 viewers)
  - [ ] 2.4: Return clear error messages for each limit
  - [ ] 2.5: Add unit tests for boundary conditions (9, 10, 11 members)

- [ ] **Task 3: Add Firestore Security Rules** (AC: #5)
  - [ ] 3.1: Add rules for `/pendingInvitations/{invitationId}`
  - [ ] 3.2: Allow create only by authenticated group owners
  - [ ] 3.3: Allow read by authenticated users
  - [ ] 3.4: Deny update (invitations are immutable)
  - [ ] 3.5: Allow delete by group owner (for cancellation)
  - [ ] 3.6: Add security rules tests

## Dev Notes

### Business Constraint Validation

| Constraint | Limit | Error Message |
|------------|-------|---------------|
| BC-2 | 10 contributors | "This group has reached the maximum number of contributors (10)" |
| BC-3 | 200 viewers | "This group has reached the maximum number of viewers (200)" |

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
| `src/services/invitationService.ts` | **NEW** | Invitation CRUD operations |
| `firestore.rules` | Modify | Add pendingInvitations rules |
| `tests/unit/services/invitationService.test.ts` | **NEW** | Service tests |

### Testing Standards

- **Unit tests:** 15+ tests covering service functions
- **Security rules tests:** 10+ tests for all permission scenarios
- **Coverage target:** 80%+ for new code

### References

- [Original Story: 14d-v2-1-5-invite-members.md](./14d-v2-1-5-invite-members.md)
- [Foundation Story: 14d-v2-1-5a-invitation-foundation.md](./14d-v2-1-5a-invitation-foundation.md)
- [Business Constraints: BC-2, BC-3 in epics.md](../epics.md)

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
