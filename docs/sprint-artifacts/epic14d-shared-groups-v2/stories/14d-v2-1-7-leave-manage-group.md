# Story 14d-v2.1.7: Leave/Manage Group

Status: split

> **SPLIT 2026-02-01**: This story exceeded sizing guidelines (11 tasks, 69 subtasks, 12+ files)
> **Split strategy:** by_feature
> **Sub-stories:**
> - [14d-v2-1-7a](14d-v2-1-7a-leave-transfer-service.md) - Leave + Transfer Service (2 pts)
> - [14d-v2-1-7b](14d-v2-1-7b-deletion-service.md) - Deletion Service Logic (2 pts)
> - [14d-v2-1-7c](14d-v2-1-7c-cloud-function-member-leave.md) - Cloud Function Trigger (2 pts)
> - [14d-v2-1-7d](14d-v2-1-7d-leave-transfer-ui.md) - Leave/Transfer UI + View Mode (3 pts)
> - [14d-v2-1-7e](14d-v2-1-7e-delete-ui-security-rules.md) - Delete UI + Security Rules (2 pts)
> - [14d-v2-1-7f](14d-v2-1-7f-integration-tests.md) - Integration Tests (2 pts)
> - [14d-v2-1-7g](14d-v2-1-7g-edit-group-settings.md) - Edit Group Settings (3 pts) **ADDED 2026-02-02**
> **Total:** 16 pts (was 3 pts estimated)

## Story

As a **group member**,
I want **to leave a group or manage membership**,
So that **I can control my group participation**.

## Acceptance Criteria

### Core Requirements (from Epic)

1. **Given** I am a group member (not owner)
   **When** I tap "Leave Group"
   **Then** I am removed from the group
   **And** my transactions remain in the group (tagged with `sharedGroupId`)
   **And** other members still see my past transactions

2. **Given** I am a group owner
   **When** I want to leave
   **Then** I must first transfer ownership to another member
   **And** after transfer, I can leave as a regular member

3. **Given** I am the only member of a group
   **When** I leave
   **Then** the group is deleted
   **And** all transactions have `sharedGroupId` set to null (constraint DM-6)

4. **Given** ownership is transferred to another member
   **When** the transfer completes
   **Then** the new owner inherits the group's current toggle state:
   - `transactionSharingToggleCountToday` is NOT reset
   - `transactionSharingLastToggleAt` is preserved
   - Cooldown continues from where it was (no reset on transfer)

5. **Given** I am a group owner
   **When** I tap "Delete Group"
   **Then** all members are removed
   **And** all transactions have `sharedGroupId` set to null
   **And** the group is deleted

6. **Given** a member leaves the group (self or removed by owner)
   **When** the Cloud Function processes the membership change
   **Then** `TRANSACTION_REMOVED` changelog entries are created for all of that member's transactions
   **And** other members' next sync will remove those transactions from their cache
   **And** the leaving member's transactions remain tagged with `sharedGroupId` but are inaccessible to the group

### Atlas-Suggested Additional Criteria

7. **Given** a user leaves a group while viewing that group's data
   **When** the leave is processed
   **Then** the app automatically switches to "Personal" view mode
   **And** a toast confirms: "You left [Group Name]. Viewing personal data."

8. **Given** a user leaves a group
   **When** the Cloud Function processes the leave
   **Then** remaining members' next sync will show the leaving member's transactions removed from their cache
   **And** the changelog contains `TRANSACTION_REMOVED` entries for each transaction

9. **Given** the last member tries to leave
   **When** they confirm deletion
   **Then** a confirmation dialog warns: "This will permanently delete the group and all shared data"
   **And** all analytics documents are also deleted

10. **Given** ownership transfer happens
    **When** the transfer completes
    **Then** the new owner receives a push notification: "You are now the owner of [Group Name]"
    **And** other members are NOT notified of the ownership change

11. **Given** a non-owner member is removed by the owner
    **When** the removal is processed
    **Then** the removed member receives a push notification: "You have been removed from [Group Name]"
    **And** their transactions are handled the same as if they left voluntarily

12. **Given** I try to leave a group I'm not a member of
    **When** the request is processed
    **Then** a 403 Forbidden error is returned
    **And** no changes are made

## Tasks / Subtasks

- [ ] **Task 1: Update Group Service for Leave Operations** (AC: #1, #6, #8)
  - [ ] 1.1: Create `leaveGroup(userId, groupId): Promise<void>` in `sharedGroupService.ts`
  - [ ] 1.2: Implement member removal from `memberIds` array
  - [ ] 1.3: Verify user is member before allowing leave
  - [ ] 1.4: Verify user is NOT owner (must transfer first)
  - [ ] 1.5: Update `updatedAt` timestamp on group document
  - [ ] 1.6: Add unit tests for leave scenarios

- [ ] **Task 2: Implement Ownership Transfer** (AC: #2, #4, #10)
  - [ ] 2.1: Create `transferOwnership(currentOwnerId, newOwnerId, groupId): Promise<void>`
  - [ ] 2.2: Verify `currentOwnerId` is current owner
  - [ ] 2.3: Verify `newOwnerId` is a member of the group
  - [ ] 2.4: Transfer `ownerId` field to new owner
  - [ ] 2.5: Preserve ALL toggle state fields (NO reset on transfer):
    - `transactionSharingToggleCountToday`
    - `transactionSharingLastToggleAt`
    - `transactionSharingToggleCountResetAt`
  - [ ] 2.6: Update `updatedAt` timestamp
  - [ ] 2.7: Add unit tests for ownership transfer

- [ ] **Task 3: Implement Last Member Deletion** (AC: #3, #9)
  - [ ] 3.1: Create `deleteGroupAsLastMember(userId, groupId): Promise<void>`
  - [ ] 3.2: Verify user is only member
  - [ ] 3.3: Set `sharedGroupId = null` on all transactions in the group
  - [ ] 3.4: Delete all `/groups/{groupId}/changelog/*` documents
  - [ ] 3.5: Delete all `/groups/{groupId}/analytics/*` documents
  - [ ] 3.6: Delete the group document itself
  - [ ] 3.7: Add unit tests for cascade deletion

- [ ] **Task 4: Implement Owner Group Deletion** (AC: #5)
  - [ ] 4.1: Create `deleteGroupAsOwner(ownerId, groupId): Promise<void>`
  - [ ] 4.2: Verify user is owner
  - [ ] 4.3: Set `sharedGroupId = null` on ALL transactions in the group (all members)
  - [ ] 4.4: Delete changelog and analytics subcollections
  - [ ] 4.5: Delete all pending invitations for this group
  - [ ] 4.6: Delete the group document
  - [ ] 4.7: Add unit tests for owner deletion

- [ ] **Task 5: Cloud Function - Member Leave Handler** (AC: #6, #8)
  - [ ] 5.1: Create `onMemberRemoved` Firestore trigger on `/sharedGroups/{groupId}`
  - [ ] 5.2: Detect when `memberIds` array shrinks
  - [ ] 5.3: Query all transactions owned by the leaving member with `sharedGroupId == groupId`
  - [ ] 5.4: Write `TRANSACTION_REMOVED` changelog entry for each transaction
  - [ ] 5.5: Ensure idempotency (check if entries already exist)
  - [ ] 5.6: Add Cloud Function unit tests

- [ ] **Task 6: UI Components - Leave Group** (AC: #1, #7)
  - [ ] 6.1: Create `LeaveGroupDialog.tsx` confirmation dialog
  - [ ] 6.2: Show warning: "Your transactions will remain visible to group members"
  - [ ] 6.3: Add "Leave Group" button in group settings
  - [ ] 6.4: On success, switch view mode to "Personal" automatically
  - [ ] 6.5: Show toast: "You left [Group Name]. Viewing personal data."
  - [ ] 6.6: Add component unit tests

- [ ] **Task 7: UI Components - Transfer Ownership** (AC: #2, #4)
  - [ ] 7.1: Create `TransferOwnershipDialog.tsx`
  - [ ] 7.2: Show list of current members (exclude self)
  - [ ] 7.3: Require confirmation: "Transfer ownership to [Name]?"
  - [ ] 7.4: On success, show toast: "Ownership transferred to [Name]"
  - [ ] 7.5: Update UI to reflect new owner status
  - [ ] 7.6: Add component unit tests

- [ ] **Task 8: UI Components - Delete Group** (AC: #5, #9)
  - [ ] 8.1: Create `DeleteGroupDialog.tsx` with strong warning
  - [ ] 8.2: Show warning: "This will permanently delete the group and all shared data"
  - [ ] 8.3: Require typing group name to confirm (dangerous action protection)
  - [ ] 8.4: On success, navigate to Settings view
  - [ ] 8.5: Show toast: "[Group Name] has been deleted"
  - [ ] 8.6: Add component unit tests

- [ ] **Task 9: Firestore Security Rules** (AC: #1, #2, #5, #12)
  - [ ] 9.1: Allow member to remove self from `memberIds` array
  - [ ] 9.2: Allow owner to remove any member from `memberIds`
  - [ ] 9.3: Allow owner to transfer `ownerId` to existing member
  - [ ] 9.4: Allow owner to delete group document
  - [ ] 9.5: Deny non-member access to group operations
  - [ ] 9.6: Add security rules tests

- [ ] **Task 10: View Mode Auto-Switch** (AC: #7)
  - [ ] 10.1: In `useViewModeContext`, detect when current group is left
  - [ ] 10.2: Subscribe to group membership changes for current user
  - [ ] 10.3: When user leaves current viewed group, auto-switch to "Personal"
  - [ ] 10.4: Show toast notification for context
  - [ ] 10.5: Add hook unit tests

- [ ] **Task 11: Integration Tests** (AC: all)
  - [ ] 11.1: Test member leave flow end-to-end
  - [ ] 11.2: Test ownership transfer preserves cooldown state
  - [ ] 11.3: Test last member deletion cascade
  - [ ] 11.4: Test owner deletion cascade
  - [ ] 11.5: Test Cloud Function changelog generation
  - [ ] 11.6: Test view mode auto-switch on leave
  - [ ] 11.7: Test security rules for all scenarios

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **DM-1** | Transaction owner = creator | Only creator can modify |
| **DM-2** | Ownership is permanent | Cannot transfer except group owner role |
| **DM-6** | No remaining users = group deleted | Cleanup orphaned groups |
| **Toggle Cooldown Preservation** | New owner inherits cooldown | Prevents gaming via transfer |

### Data Model Implications

```typescript
// When member leaves, their transactions:
// - KEEP sharedGroupId set (audit trail)
// - BUT Cloud Function writes TRANSACTION_REMOVED to changelog
// - Other members' cache will clear on next sync

// Group document update on leave:
{
  memberIds: arrayRemove(leavingUserId),  // Remove from array
  updatedAt: serverTimestamp()
}

// Ownership transfer update:
{
  ownerId: newOwnerId,
  updatedAt: serverTimestamp()
  // NOTE: Do NOT reset toggle fields!
}
```

### Changelog Entries on Member Leave

```typescript
// Cloud Function writes for EACH transaction owned by leaving member
{
  type: 'TRANSACTION_REMOVED',
  transactionId: 'tx-123',
  timestamp: serverTimestamp(),
  actorId: leavingUserId,
  summary: { reason: 'member_left', memberName: 'Alice' }
  // NOTE: No `data` field for removals
}
```

### Cascade Deletion Order (Last Member or Owner Delete)

```
1. Set sharedGroupId = null on ALL transactions (batched writes)
2. Delete /groups/{groupId}/changelog/* (subcollection)
3. Delete /groups/{groupId}/analytics/* (subcollection)
4. Delete /pendingInvitations where groupId == groupId
5. Delete /sharedGroups/{groupId} (main document)
```

### Firestore Security Rules

```javascript
match /sharedGroups/{groupId} {
  // Allow member to leave (remove self from memberIds)
  allow update: if request.auth != null
    && request.auth.uid in resource.data.memberIds
    && request.resource.data.memberIds.size() == resource.data.memberIds.size() - 1
    && !(request.auth.uid in request.resource.data.memberIds);

  // Allow owner to transfer ownership
  allow update: if request.auth != null
    && request.auth.uid == resource.data.ownerId
    && request.resource.data.ownerId in resource.data.memberIds;

  // Allow owner to delete group
  allow delete: if request.auth != null
    && request.auth.uid == resource.data.ownerId;

  // Deny all for non-members
  allow read, write: if request.auth != null
    && request.auth.uid in resource.data.memberIds;
}
```

### Error Handling

| Scenario | Error Message |
|----------|---------------|
| Leave when owner | "You must transfer ownership before leaving" |
| Transfer to non-member | "Selected user is not a member of this group" |
| Delete when not owner | "Only the group owner can delete the group" |
| Leave when not member | "You are not a member of this group" |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/sharedGroupService.ts` | Modify | Add leave, transfer, delete functions |
| `src/components/SharedGroups/LeaveGroupDialog.tsx` | **NEW** | Leave confirmation UI |
| `src/components/SharedGroups/TransferOwnershipDialog.tsx` | **NEW** | Transfer ownership UI |
| `src/components/SharedGroups/DeleteGroupDialog.tsx` | **NEW** | Delete group UI |
| `functions/src/triggers/onMemberRemoved.ts` | **NEW** | Cloud Function for changelog |
| `firestore.rules` | Modify | Add leave/transfer/delete rules |
| `src/contexts/ViewModeContext.tsx` | Modify | Auto-switch on leave |
| `tests/unit/services/sharedGroupService.test.ts` | Modify | Add tests |
| `tests/unit/components/SharedGroups/LeaveGroupDialog.test.tsx` | **NEW** | Component tests |
| `tests/unit/components/SharedGroups/TransferOwnershipDialog.test.tsx` | **NEW** | Component tests |
| `tests/unit/components/SharedGroups/DeleteGroupDialog.test.tsx` | **NEW** | Component tests |
| `tests/unit/functions/onMemberRemoved.test.ts` | **NEW** | Cloud Function tests |

### Testing Standards

- **Unit tests:** 60+ tests covering service, Cloud Function, and components
- **Security rules tests:** 20+ tests for all permission scenarios
- **Coverage target:** 80%+ for new code

### Project Structure Notes

- Services: `src/services/` directory pattern
- Components: `src/components/SharedGroups/` for shared group UI
- Cloud Functions: `functions/src/triggers/` for Firestore triggers
- Follow existing patterns from Story 14c-refactor for service stubbing

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-17-leavemanage-group]
- [Data Model Constraints: DM-1 through DM-6 in epics.md]
- [Requirements Document: docs/architecture/epic-14d-requirements-and-concerns.md#5-data-model-constraints]
- [Toggle Cooldown Rules: docs/architecture/epic-14d-requirements-and-concerns.md#51-layered-visibility-model]
- [Story 1.8 Changelog Writer: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-18-cloud-function---changelog-writer]

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **Auth → Scan → Save Critical Path** | Leaving group must NOT affect personal transactions or scan flow |
| **View Mode Switcher** | Must auto-switch to Personal when leaving currently-viewed group |
| **Shared Group Sync** | Leaving member's transactions become invisible via changelog `TRANSACTION_REMOVED` |
| **Analytics Navigation Flow (#4)** | byMember breakdown must show "(Left)" indicator for former members |
| **Security Rules** | Must enforce membership checks on all group operations |
| **Scan Receipt Flow (#1)** | No impact - scans are personal-first |

### Downstream Effects to Consider

- **Story 3.7 (Analytics UI - By Member)** - Must render "(Left)" indicator for former members in byMember breakdown
- **Story 2.3 (90-Day Changelog Sync)** - Will process `TRANSACTION_REMOVED` entries from member leave
- **Story 1.8 (Cloud Function - Changelog Writer)** - Must handle member leave as a trigger
- **Epic 4 (Notifications)** - Should notify on ownership transfer and member removal

### Testing Implications

- **Existing tests to verify:** View mode persistence, security rules, ScanContext isolation
- **New scenarios to add:**
  - Leave flow with transactions present
  - Ownership transfer preserves cooldown (critical!)
  - Last member deletion cascade (analytics, changelog, invitations)
  - View mode auto-switch on leave
  - Cloud Function idempotency
  - Security rules for non-member access denial

### Workflow Chain Visualization

```
UPSTREAM:
[Create Shared Group (1.4)] → [Invite Members (1.5)] → [Accept/Decline (1.6)]
                                                             ↓
CURRENT STORY:                                    [THIS STORY: Leave/Manage (1.7)]
                                                             ↓
DOWNSTREAM:
                                         ┌─────────────────────────────────────────┐
                                         ↓                                         ↓
                           [Cloud Function Changelog (1.8)]              [Analytics by Member (3.7)]
                                         ↓                                         ↓
                           [Changelog Sync (2.3)]                        ["(Left)" indicator display]
```

### Dependency Graph

```
UPSTREAM (must be complete):
- Story 1.4: Create Shared Group (provides group structure)
- Story 1.5: Invite Members (members exist to leave)
- Story 1.6: Accept/Decline (join flow complete)
- Story 14c-refactor.7: Security Rules Simplification (clean rules baseline)

DOWNSTREAM (depends on this):
- Story 1.8: Cloud Function - Changelog Writer (listens to member changes)
- Story 3.7: Analytics UI - By Member (shows "(Left)" indicator)
- Story 2.3: 90-Day Changelog Sync (processes TRANSACTION_REMOVED)
- Epic 4: Notifications (ownership transfer, removal notifications)
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
