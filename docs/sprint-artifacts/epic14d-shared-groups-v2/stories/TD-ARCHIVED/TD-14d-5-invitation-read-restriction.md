# Tech Debt Story TD-14d-5: Restrict pendingInvitations Read Access

Status: ready-for-dev

> **Source:** ECC Code Review #5 (2026-02-03) on story 14d-v2-1-7e
> **Priority:** MEDIUM (privacy enhancement, security hardening)
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (security rule change, backward compatible)

## Story

As a **user**,
I want **only my own pending invitations to be readable**,
So that **my email address and invitation status are not exposed to other users**.

## Problem Statement

Current Firestore security rules allow **any authenticated user** to read **all** pending invitations:

```javascript
// firestore.rules:189
// Read: Any authenticated user can read invitations (AC #3)
// This allows users to see invitations sent to their email
allow read: if request.auth != null;
```

This exposes:
- Email addresses of invited users
- Group names and IDs
- Invitation statuses
- Invitation timestamps

**Risk:** Authenticated users can enumerate all pending invitations in the system.

## Acceptance Criteria

1. **Given** a user querying pendingInvitations
   **When** they try to read invitations for other users' emails
   **Then** the query is denied

2. **Given** a user querying pendingInvitations
   **When** they query for their own email
   **Then** the query succeeds

3. **Given** a group owner
   **When** they query invitations for their groups
   **Then** the query succeeds (for managing invitations)

4. **Given** existing client code
   **When** security rules change
   **Then** no client code changes are needed (queries already filter)

## Proposed Security Rule

```javascript
// firestore.rules - pendingInvitations collection
match /pendingInvitations/{invitationId} {
  // ... existing helpers ...

  // Read: Only user's own invitations OR group owner's invitations
  allow read: if request.auth != null && (
    // User can read invitations sent to their email
    resource.data.invitedEmail == request.auth.token.email ||
    // Group owner can read invitations for their groups
    isGroupOwnerForInvitation(resource.data.groupId)
  );

  // ... rest of rules unchanged ...
}
```

## Tasks / Subtasks

- [ ] **Task 1: Update Security Rules** (AC: #1, #2, #3)
  - [ ] 1.1: Update `allow read` rule in `firestore.rules`
  - [ ] 1.2: Add email comparison for invited user
  - [ ] 1.3: Keep group owner access via `isGroupOwnerForInvitation`

- [ ] **Task 2: Update Tests** (AC: #4)
  - [ ] 2.1: Add test: user can read own invitations
  - [ ] 2.2: Add test: user cannot read other users' invitations
  - [ ] 2.3: Add test: owner can read invitations for owned groups
  - [ ] 2.4: Add test: non-owner cannot read invitations for other groups

- [ ] **Task 3: Verify Client Compatibility** (AC: #4)
  - [ ] 3.1: Audit existing queries in `invitationService.ts`
  - [ ] 3.2: Verify queries use `where('invitedEmail', '==', userEmail)` filter
  - [ ] 3.3: Manual test invitation flows

## Dev Notes

### Client Query Pattern

Existing client code already uses filtered queries:

```typescript
// src/services/invitationService.ts
const q = query(
  collection(db, 'pendingInvitations'),
  where('invitedEmail', '==', userEmail),
  where('status', '==', 'pending')
);
```

This means the security rule change is **backward compatible** - the queries already filter, the rule just enforces it server-side.

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Privacy** | ✅ Protected immediately | ❌ Exposure continues |
| **Merge conflicts** | ❌ firestore.rules touched by multiple stories | ✅ Less conflict risk later |
| **Testing** | ✅ Add to existing rules tests | ✅ Same |
| **Client changes** | ✅ None needed | ✅ Same |
| **Security audit** | ✅ Closes gap for audit | ❌ Open finding |

**Recommendation:** Do now if no other stories are actively modifying `firestore.rules`. Otherwise, defer to end of sprint.

### Index Requirements

The new rule may require a compound index if queries combine email + groupId filters. Check Firestore console for index suggestions.

### Dependencies

- Conflicts with: Any story modifying `firestore.rules` concurrently
- Testing: Use existing `firestore-rules.test.ts` test file

### References

- [14d-v2-1-7e](./14d-v2-1-7e-delete-ui-security-rules.md) - Source of this tech debt item (ECC Review #5)
- [firestore.rules](../../../../firestore.rules) - Current implementation
- [invitationService.ts](../../../../src/services/invitationService.ts) - Client queries
