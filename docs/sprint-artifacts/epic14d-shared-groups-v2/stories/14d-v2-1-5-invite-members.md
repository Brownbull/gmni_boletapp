# Story 14d-v2.1.5: Invite Members to Group

Status: ready-for-dev

## Story

As a **group owner**,
I want **to invite others to my shared group by email or link**,
So that **they can join and see shared transactions**.

## Acceptance Criteria

### Core Requirements (from Epic)

1. **Given** I am a group owner
   **When** I tap "Invite" on my group
   **Then** I can:
   - Enter an email address to send invitation
   - Copy a shareable invite link
   **And** the invitation is stored with pending status

2. **Given** I am a group owner
   **When** I invite someone
   **Then** business constraint BC-2 is enforced (max 10 contributors)
   **And** business constraint BC-3 is enforced (max 200 viewers)

3. **Given** I invite someone by email
   **When** they receive the invitation
   **Then** they see the group name and my name as inviter

4. **Given** I copy the share link
   **When** I paste it elsewhere
   **Then** the link is a valid URL in format `/join/{shareCode}`
   **And** the share code is valid for the invitation

### Atlas-Suggested Additional Criteria

5. **Given** an invitation is created
   **When** the share code is generated
   **Then** it must be cryptographically random (16+ chars, URL-safe alphanumeric)
   **And** the code must be unique across all invitations

6. **Given** an invitation is created
   **When** it is stored
   **Then** it includes `invitedBy` user info (userId, displayName, email)
   **And** Story 1.6 can use this info for accept/decline UI

7. **Given** I try to invite and the group is at max contributors (10)
   **When** the invitation fails
   **Then** I see a clear error message: "This group has reached the maximum number of contributors (10)"
   **And** I am NOT left wondering what happened

8. **Given** I create a share link invitation
   **When** someone accesses the link
   **Then** the invitation must have a valid TTL/expiration (recommend: 7 days)
   **And** expired invitations show: "This invitation has expired"

9. **Given** I enter an email address
   **When** I tap "Send Invite"
   **Then** basic email format validation is applied
   **And** invalid emails show: "Please enter a valid email address"

10. **Given** the invited user already has a pending invitation for this group
    **When** I try to invite them again
    **Then** I see: "This person already has a pending invitation"
    **And** no duplicate invitation is created

## Tasks / Subtasks

- [ ] **Task 1: Create Invitation Data Model** (AC: #1, #5, #6, #8)
  - [ ] 1.1: Define `PendingInvitation` interface in `src/types/sharedGroup.ts`
  - [ ] 1.2: Add fields: `id`, `groupId`, `groupName`, `shareCode`, `invitedBy`, `createdAt`, `expiresAt`, `status`
  - [ ] 1.3: Add `invitedEmail` optional field for email invitations
  - [ ] 1.4: Set expiration to 7 days from creation
  - [ ] 1.5: Add JSDoc comments explaining each field

- [ ] **Task 2: Create Share Code Generator** (AC: #5)
  - [ ] 2.1: Create `src/utils/shareCodeUtils.ts`
  - [ ] 2.2: Implement `generateShareCode(): string` using crypto.randomUUID or similar
  - [ ] 2.3: Ensure URL-safe alphanumeric output (no special chars)
  - [ ] 2.4: Ensure 16+ character length
  - [ ] 2.5: Add unit tests for uniqueness and format validation

- [ ] **Task 3: Create Invitation Service** (AC: #1, #3, #10)
  - [ ] 3.1: Create `src/services/invitationService.ts`
  - [ ] 3.2: Implement `createInvitation(groupId, groupName, invitedBy, invitedEmail?): Promise<PendingInvitation>`
  - [ ] 3.3: Implement `getInvitationByShareCode(shareCode): Promise<PendingInvitation | null>`
  - [ ] 3.4: Implement `checkDuplicateInvitation(groupId, email): Promise<boolean>`
  - [ ] 3.5: Store invitations in Firestore at `/pendingInvitations/{invitationId}`
  - [ ] 3.6: Add secondary index on `shareCode` for quick lookup
  - [ ] 3.7: Add unit tests for service functions

- [ ] **Task 4: Add Business Constraint Validation** (AC: #2, #7)
  - [ ] 4.1: Create `validateGroupCapacity(groupId): Promise<{ canAddContributor: boolean, canAddViewer: boolean, reason?: string }>`
  - [ ] 4.2: Check current member count against BC-2 (10 contributors)
  - [ ] 4.3: Check current member count against BC-3 (200 viewers)
  - [ ] 4.4: Return clear error messages for each limit
  - [ ] 4.5: Add unit tests for boundary conditions (9, 10, 11 members)

- [ ] **Task 5: Create Invite UI Components** (AC: #1, #3, #4, #9)
  - [ ] 5.1: Create `src/components/SharedGroups/InviteMembersDialog.tsx`
  - [ ] 5.2: Add email input field with validation
  - [ ] 5.3: Add "Copy Link" button that copies `/join/{shareCode}` to clipboard
  - [ ] 5.4: Add "Send Invite" button for email invitations
  - [ ] 5.5: Show success toast on invite creation
  - [ ] 5.6: Show error messages for validation failures
  - [ ] 5.7: Add loading states during API calls

- [ ] **Task 6: Add Firestore Security Rules** (AC: #1, #5)
  - [ ] 6.1: Add rules for `/pendingInvitations/{invitationId}`
  - [ ] 6.2: Allow create only by authenticated group owners
  - [ ] 6.3: Allow read by invitation recipient (by email match or authenticated user)
  - [ ] 6.4: Deny update/delete except by group owner (for cancellation)
  - [ ] 6.5: Add security rules tests

- [ ] **Task 7: Email Validation Utility** (AC: #9)
  - [ ] 7.1: Create `validateEmail(email: string): boolean` in `src/utils/validationUtils.ts`
  - [ ] 7.2: Use standard email regex pattern
  - [ ] 7.3: Add unit tests for valid/invalid email formats

- [ ] **Task 8: Integration Tests** (AC: all)
  - [ ] 8.1: Test full invitation flow from UI to Firestore
  - [ ] 8.2: Test business constraint enforcement
  - [ ] 8.3: Test duplicate invitation prevention
  - [ ] 8.4: Test share code generation uniqueness
  - [ ] 8.5: Test invitation expiration handling

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **BC-2** | Max 10 contributors | Sync complexity, write frequency |
| **BC-3** | Max 200 viewers | Read scaling |
| **FR-26** | Invalid share codes display error | User-friendly error handling |

### Data Model: PendingInvitation

```typescript
// /pendingInvitations/{invitationId}
export interface PendingInvitation {
  id: string;                      // Auto-generated Firestore ID
  groupId: string;                 // Reference to shared group
  groupName: string;               // Display name for UI
  shareCode: string;               // 16+ char URL-safe code
  invitedBy: {
    userId: string;
    displayName: string;
    email: string | null;
  };
  invitedEmail?: string;           // Optional: for email invitations
  createdAt: Timestamp;
  expiresAt: Timestamp;            // createdAt + 7 days
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}
```

### Share Code Generation

```typescript
// Cryptographically secure, URL-safe
function generateShareCode(): string {
  const array = new Uint8Array(12); // 12 bytes = 16 base64 chars
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '0')  // Make URL-safe
    .replace(/\//g, '1')
    .replace(/=/g, '');   // Remove padding
}
```

### Invite Link Format

```
https://gastify.app/join/{shareCode}
Example: https://gastify.app/join/aB3dEfGhIjKlMnOp
```

### Firestore Security Rules

```javascript
match /pendingInvitations/{invitationId} {
  // Allow group owners to create invitations
  allow create: if request.auth != null
    && exists(/databases/$(database)/documents/sharedGroups/$(request.resource.data.groupId))
    && get(/databases/$(database)/documents/sharedGroups/$(request.resource.data.groupId)).data.ownerId == request.auth.uid;

  // Allow read by invited email or authenticated user
  allow read: if request.auth != null;

  // Allow delete by group owner (cancellation)
  allow delete: if request.auth != null
    && get(/databases/$(database)/documents/sharedGroups/$(resource.data.groupId)).data.ownerId == request.auth.uid;

  // Deny updates (invitations are immutable)
  allow update: if false;
}
```

### Business Constraint Validation

| Constraint | Limit | Error Message |
|------------|-------|---------------|
| BC-2 | 10 contributors | "This group has reached the maximum number of contributors (10)" |
| BC-3 | 200 viewers | "This group has reached the maximum number of viewers (200)" |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/sharedGroup.ts` | Modify | Add `PendingInvitation` interface |
| `src/utils/shareCodeUtils.ts` | **NEW** | Share code generation |
| `src/utils/validationUtils.ts` | Modify | Add email validation |
| `src/services/invitationService.ts` | **NEW** | Invitation CRUD operations |
| `src/components/SharedGroups/InviteMembersDialog.tsx` | **NEW** | Invite UI |
| `firestore.rules` | Modify | Add pendingInvitations rules |
| `tests/unit/utils/shareCodeUtils.test.ts` | **NEW** | Share code tests |
| `tests/unit/services/invitationService.test.ts` | **NEW** | Service tests |
| `tests/unit/components/SharedGroups/InviteMembersDialog.test.tsx` | **NEW** | Component tests |

### UI Mockup Reference

The invite dialog should include:
1. **Email Input Section**
   - Text field with email validation
   - "Send Invite" button
   - Validation error display

2. **Share Link Section**
   - Read-only link display
   - "Copy Link" button with success feedback
   - Expiration notice: "Link expires in 7 days"

3. **Capacity Display** (optional enhancement)
   - Show current member count: "3 of 10 contributors"

### Testing Standards

- **Unit tests:** 25+ tests covering service, utils, and component
- **Security rules tests:** 10+ tests for all permission scenarios
- **Coverage target:** 80%+ for new code

### Project Structure Notes

- Services: `src/services/` directory pattern
- Types: `src/types/` for interfaces
- Utils: `src/utils/` for pure functions
- Components: `src/components/SharedGroups/` for shared group UI

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-15-invite-members-to-group]
- [Business Constraints: BC-2, BC-3 in epics.md]
- [Requirements Document: docs/architecture/epic-14d-requirements-and-concerns.md]
- [FR-26 Invalid Share Codes: epics.md#story-16-acceptdecline-group-invitation]

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **Auth Critical Path** | Invitation creation requires authenticated user with group owner permissions |
| **Deep Link Flow** | Share links create `/join/{shareCode}` routes that need handling (Story 1.6) |
| **Push Notification Flow** | Future Epic 4 will send notifications for invitation events |
| **Security Rules** | New `/pendingInvitations` collection requires permission configuration |

### Downstream Effects to Consider

- **Story 1.6 (Accept/Decline)** - Directly consumes invitation data created here
- **Story 1.14 (Join Flow Opt-In)** - Depends on invitation acceptance flow
- **Epic 4 (Notifications)** - Will build notification triggers on invitation events
- **Security Rules** - Must validate group ownership before allowing invitation creation

### Testing Implications

- **Existing tests to verify:** Auth flow tests, Firestore security rules tests
- **New scenarios to add:**
  - Invitation creation happy path
  - Business constraint enforcement (10 contributors, 200 viewers)
  - Share code uniqueness and format
  - Email validation
  - Duplicate invitation prevention
  - Invitation expiration

### Workflow Chain Visualization

```
[Create Shared Group (1.4)] → [THIS STORY: Invite Members] → [Accept/Decline (1.6)]
                                       ↓
                         [Join Flow Opt-In (1.14)]
                                       ↓
                         [Transaction Sharing Toggle (1.11, 1.12)]
```

### Dependency Graph

```
UPSTREAM (must be complete):
- Story 1.4: Create Shared Group (provides groupId, groupName, ownerId)
- Story 14c-refactor.7: Security Rules Simplification (clean rules baseline)

DOWNSTREAM (depends on this):
- Story 1.6: Accept/Decline Group Invitation
- Story 1.14: Join Flow Transaction Sharing Opt-In
- Epic 4.1: Push Notification Infrastructure
```

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
