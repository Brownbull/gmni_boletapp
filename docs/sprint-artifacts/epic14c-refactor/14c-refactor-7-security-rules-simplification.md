# Story 14c-refactor.7: Security Rules Simplification

Status: ready-for-dev

## Story

As a **developer**,
I want **Firestore security rules simplified to deny all shared group access**,
So that **the rules are clean, efficient, and accurately reflect the disabled feature state**.

## Acceptance Criteria

1. **Given** `firestore.rules` contains complex shared group access rules
   **When** this story is completed
   **Then:**
   - `sharedGroups` collection rules simplified to deny all access
   - `pendingInvitations` collection rules simplified to deny all access
   - Cross-user transaction read rules removed
   - `isGroupMemberForTransaction` helper function removed
   - Collection group query rule remains denied (already is)
   - Rules file is significantly smaller and cleaner

2. **Given** a user tries to access shared group data via Firestore SDK
   **When** the request is made
   **Then:**
   - Request is denied with permission error
   - No data is exposed
   - Error is handled gracefully by stubbed client code

3. **Given** the rules are deployed
   **When** the app runs normally
   **Then:**
   - Personal transaction access still works
   - User preferences access still works
   - No permission errors for normal operations

## Tasks / Subtasks

- [ ] Task 1: Simplify sharedGroups rules (AC: #1)
  - [ ] Replace all `sharedGroups/{groupId}` rules with:
    ```
    match /sharedGroups/{groupId} {
      // Feature disabled - deny all access
      allow read, write: if false;
    }
    ```
  - [ ] Remove helper functions: `isGroupMember()`, `isGroupOwner()`, `isValidNewGroup()`, etc.

- [ ] Task 2: Simplify pendingInvitations rules (AC: #1)
  - [ ] Replace all `pendingInvitations/{invitationId}` rules with:
    ```
    match /pendingInvitations/{invitationId} {
      // Feature disabled - deny all access
      allow read, write: if false;
    }
    ```
  - [ ] Remove helper functions: `isInvitedUser()`, `isStatusUpdateOnly()`

- [ ] Task 3: Remove cross-user transaction access (AC: #1)
  - [ ] Remove or simplify the complex transaction rules for group members
  - [ ] Remove `isGroupMemberForTransaction()` helper function
  - [ ] Keep simple owner-only rule:
    ```
    match /artifacts/{appId}/users/{userId}/transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    ```

- [ ] Task 4: Clean up comments and documentation (AC: #1)
  - [ ] Update comments to indicate feature is disabled
  - [ ] Remove or update Story references (14c.1, 14c.2, etc.)
  - [ ] Add note about Epic 14d planned re-implementation

- [ ] Task 5: Test rules locally (AC: #2, #3)
  - [ ] Run Firestore emulator with new rules
  - [ ] Test personal transaction CRUD (should work)
  - [ ] Test shared group access (should deny)
  - [ ] Test user preferences access (should work)

- [ ] Task 6: Deploy rules (AC: #3)
  - [ ] Deploy to development project first
  - [ ] Verify app works normally
  - [ ] Deploy to production
  - [ ] Monitor for permission errors

## Dev Notes

### Current Rules Size

`firestore.rules` is currently ~217 lines with complex shared group logic.

### Target Rules Structure

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ============================================================================
    // User Data - Owner-only access
    // ============================================================================

    match /artifacts/{appId}/users/{userId}/transactions/{transactionId} {
      // Owner can read and write their own transactions
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /artifacts/{appId}/users/{userId}/{document=**} {
      // User isolation: Each user can only access their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ============================================================================
    // Shared Groups - DISABLED (Epic 14c-refactor)
    // Will be re-enabled with redesigned rules in Epic 14d
    // ============================================================================

    match /sharedGroups/{groupId} {
      // Feature disabled - deny all access
      allow read, write: if false;
    }

    match /pendingInvitations/{invitationId} {
      // Feature disabled - deny all access
      allow read, write: if false;
    }

    // Collection group queries disabled for security
    match /{path=**}/transactions/{transactionId} {
      allow read: if false;
    }

    // Deny all other paths by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Rules Reduction

- Current: ~217 lines
- Target: ~50 lines
- Removed: ~167 lines of complex group/invitation logic

### Testing with Emulator

```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# In app, ensure VITE_USE_EMULATOR=true

# Test scenarios:
# 1. Create transaction (should succeed)
# 2. Read own transactions (should succeed)
# 3. Read sharedGroups (should deny)
# 4. Read other user's transactions (should deny)
```

### Deployment

```bash
# Deploy to dev first
firebase deploy --only firestore:rules --project boletapp-dev

# Verify app works, then deploy to production
firebase deploy --only firestore:rules --project boletapp-production
```

### Rollback Plan

Keep backup of current rules:
```bash
cp firestore.rules firestore.rules.backup-$(date +%Y%m%d)
```

### Testing Standards

- Test with Firestore emulator
- Verify personal transactions CRUD works
- Verify shared group access is denied
- Deploy to dev before production

### Dependencies

- **Depends on:** Story 14c-refactor.6 (Data should be cleaned first)
- **Blocks:** None

### References

- [Source: docs/sprint-artifacts/epic-14c-retro-2026-01-20.md] - Retrospective
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.7] - Story definition
- [Source: firestore.rules] - Current security rules

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **Household Sharing Flow (#10)**: All access permanently denied at rules level
- **Personal Data Flow**: Unchanged (owner-only access preserved)

### Downstream Effects to Consider

- Any remaining client code trying to access sharedGroups will get permission denied
- This is expected since all code is stubbed (Story 14c-refactor.2, 14c-refactor.3)
- Collection group queries remain denied (already were)

### Important Note

**Rules change is low risk** because:
1. Client code already stubbed (returns empty/throws)
2. Data already cleaned (Story 14c-refactor.6)
3. UI shows placeholders (Story 14c-refactor.5)

### Security Improvement

Removing complex helper functions reduces:
- Attack surface (fewer code paths)
- Rule evaluation cost (simpler rules = faster checks)
- Maintenance burden (less code to update)

### Workflow Chain Visualization

```
[BEFORE]
Client → Rules (complex member checks) → Firestore

[AFTER]
Client (stubbed) → Rules (deny all) → Firestore
```

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

(To be filled during implementation - files modified)
