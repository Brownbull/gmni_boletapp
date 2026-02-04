# Story 14d-v2-1.14b: Service Layer & Flow Integration

Status: ready-for-dev

> **Split from:** Story 14d-v2-1.14 (Join Flow Transaction Sharing Opt-In)
> **Part:** 2 of 4 (Service Layer)
> **Related stories:** 14d-v2-1-14a, 14d-v2-1-14c, 14d-v2-1-14d
> **Depends on:** 14d-v2-1-14a (Dialog Component)

## Story

As a **user joining a group**,
I want **the opt-in dialog to be integrated with the accept invitation flow**,
so that **my preference is recorded when I join the group**.

## Background

This story integrates the `TransactionSharingOptInDialog` (from 14d-v2-1-14a) into the accept invitation flow and updates the service layer to handle the user's sharing preference.

## Acceptance Criteria

### Integration Requirements

**AC1:** Given I accept a group invitation, When the group has `transactionSharingEnabled: true`, Then I see the opt-in dialog before completing the join

**AC2:** Given I tap "Yes, share my transactions", When the join completes, Then `shareMyTransactions` is set to `true` for this group, And I see confirmation

**AC3:** Given I tap "No, just statistics", When the join completes, Then `shareMyTransactions` is set to `false` for this group, And I see confirmation

**AC4:** Given the group has `transactionSharingEnabled: false`, When I accept the invitation, Then I do NOT see the transaction sharing prompt, And I join directly with `shareMyTransactions: false`

### Service Requirements

**AC5:** Given the opt-in dialog is shown, When the user makes a choice, Then the preference is written to `/users/{userId}/preferences/sharedGroups` using Story 1.13 schema:
```typescript
groupPreferences[groupId] = {
  shareMyTransactions: boolean,  // based on user choice
  lastToggleAt: Timestamp,       // set to now
  toggleCountToday: 0,           // fresh join, no toggles yet
  toggleCountResetAt: null       // not yet relevant
}
```

**AC6:** Firestore transaction ensures atomicity with group membership update

**AC7:** On failure, join is rolled back and user sees error: "Failed to join group. Please try again."

### Testing Requirements

**AC8:** 8+ integration tests for the flow
**AC9:** 10+ unit tests for service function

## Tasks / Subtasks

### Task 1: Integrate Opt-In with Accept Invitation Flow (AC: 1, 4)

- [ ] 1.1 Modify `AcceptInvitationDialog.tsx` (from Story 1.6) to check `group.transactionSharingEnabled`
- [ ] 1.2 If `transactionSharingEnabled: true`: Show `TransactionSharingOptInDialog` before finalizing join
- [ ] 1.3 If `transactionSharingEnabled: false`: Skip opt-in, join with `shareMyTransactions: false`
- [ ] 1.4 Pass user's choice to `acceptInvitation()` service function
- [ ] 1.5 Write 8 integration tests for the flow

### Task 2: Update Accept Invitation Service (AC: 2, 3, 5, 6, 7)

- [ ] 2.1 Modify `acceptInvitation(invitationId, shareMyTransactions)` in `invitationService.ts`
- [ ] 2.2 Create user group preferences document on accept:
  ```typescript
  // In Firestore transaction:
  const preferencesRef = doc(db, 'users', userId, 'preferences', 'sharedGroups');
  await updateDoc(preferencesRef, {
    [`groupPreferences.${groupId}`]: {
      shareMyTransactions: shareMyTransactions,
      lastToggleAt: serverTimestamp(),
      toggleCountToday: 0,
      toggleCountResetAt: null
    }
  }, { merge: true });
  ```
- [ ] 2.3 Ensure atomicity with group membership update
- [ ] 2.4 Implement rollback on failure
- [ ] 2.5 Write 10 unit tests for service function

## Dev Notes

### Data Flow

```
User clicks "Accept" on invitation
        |
        +-- Fetch group document
        |       |
        |       +-- group.transactionSharingEnabled == true?
        |       |       |
        |       |       +-- YES --> Show TransactionSharingOptInDialog
        |       |               |
        |       |               +-- "Yes, share" --> shareMyTransactions: true
        |       |               |
        |       |               +-- "No, statistics" --> shareMyTransactions: false
        |       |               |
        |       |               +-- Dismiss/Cancel --> shareMyTransactions: false (LV-6)
        |       |
        |       +-- NO --> Skip dialog, shareMyTransactions: false
        |
        +-- Execute Firestore transaction:
            1. Add user to group.members[]
            2. Write user preferences document (Story 1.13 schema)
            3. Update invitation.status = 'accepted'
            4. Invalidate React Query cache
```

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/SharedGroups/AcceptInvitationDialog.tsx` | MODIFY | Integrate opt-in dialog (existing) |
| `src/services/invitationService.ts` | MODIFY | Add preference creation on accept |
| `tests/unit/services/invitationService.test.ts` | MODIFY | Add opt-in tests |

> **Architecture Note:** `AcceptInvitationDialog.tsx` is in the legacy location (`src/components/SharedGroups/`). Per 14d-v2-ui-conventions.md, it should be in `src/features/shared-groups/components/`. This migration is tracked in tech debt story [TD-14d-2-fsd-component-location](./TD-14d-2-fsd-component-location.md). For now, modify files in their current location until TD-14d-2 is complete.

### Dependency Graph

```
UPSTREAM (must be complete):
+-- Story 14d-v2-1-14a: TransactionSharingOptInDialog component
+-- Story 1.4: Create Shared Group (provides group with transactionSharingEnabled)
+-- Story 1.5: Invite Members (provides PendingInvitation)
+-- Story 1.6: Accept/Decline Invitation (provides AcceptInvitationDialog to extend)
+-- Story 1.13: User Group Preferences Document (provides Firestore schema)

DOWNSTREAM (depends on this):
+-- Story 14d-v2-1-14c: Confirmation messages and polish
```

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.14]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - FR-25, LV-6, LV-8]
- [Source: Story 1.6: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-6-accept-decline-invitation.md]
- [Source: Story 1.13: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-13-user-group-preferences-document.md]

---

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
