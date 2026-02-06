# Story 14d-v2-1.14c: Polish & Edge Cases

Status: ready-for-dev

> **Split from:** Story 14d-v2-1.14 (Join Flow Transaction Sharing Opt-In)
> **Part:** 3 of 4 (Polish & Edge Cases)
> **Related stories:** 14d-v2-1-14a, 14d-v2-1-14b, 14d-v2-1-14d
> **Depends on:** 14d-v2-1-14b (Service Layer & Flow Integration)

## Story

As a **user joining a group**,
I want **clear confirmation messages and proper handling of edge cases**,
so that **I have a polished experience regardless of my network state or choices**.

## Background

This story adds the polish layer to the join flow opt-in: confirmation toasts, offline handling, and analytics tracking. It builds on the foundation and service integration from stories 14a and 14b.

## Acceptance Criteria

### Confirmation Messages

**AC1:** Given I tap "Yes, share my transactions", When the join completes, Then I see toast: "You're now a member of [Group Name]"

**AC2:** Given I tap "No, just statistics", When the join completes, Then I see toast: "You're now a member of [Group Name]. You can change sharing preferences in group settings."

**AC3:** Given I dismiss the dialog without choosing, When the join completes, Then I see toast: "You're now a member of [Group Name]. Transaction sharing is off by default."

### Offline Handling

**AC4:** Given I am offline, When I try to accept an invitation, Then I see error: "You're offline. Please connect to join groups." BEFORE any dialog appears

### Analytics

**AC5:** Opt-in dialog impressions are tracked
**AC6:** User choice (yes/no/dismiss) is tracked for product insights

### Testing Requirements

**AC7:** 3 unit tests for toast message variants
**AC8:** 2 unit tests for offline scenarios

## Tasks / Subtasks

### Task 1: Confirmation Messages (AC: 1, 2, 3, 7)

- [ ] 1.1 Create confirmation toast variants:
  - Opted in: "You're now a member of [Group Name]"
  - Opted out: "You're now a member of [Group Name]. You can change sharing preferences in group settings."
  - Dismissed: "You're now a member of [Group Name]. Transaction sharing is off by default."
- [ ] 1.2 Use existing toast system (useToast hook)
- [ ] 1.3 Write 3 unit tests for toast messages

### Task 2: Offline Handling (AC: 4, 8)

- [ ] 2.1 Check network status before showing opt-in dialog
- [ ] 2.2 If offline, show error: "You're offline. Please connect to join groups."
- [ ] 2.3 Use existing `useOnlineStatus` hook
- [ ] 2.4 Write 2 unit tests for offline scenarios

### Task 3: Analytics Event Tracking (AC: 5, 6)

- [ ] 3.1 Track opt-in dialog impressions
- [ ] 3.2 Track user choice (yes/no/dismiss)
- [ ] 3.3 Calculate opt-in rate for product insights
- [ ] 3.4 Use existing analytics service pattern

## Dev Notes

### Toast Message Templates

```typescript
const TOAST_MESSAGES = {
  joinedWithSharing: (groupName: string) =>
    `You're now a member of ${groupName}`,
  joinedWithoutSharing: (groupName: string) =>
    `You're now a member of ${groupName}. You can change sharing preferences in group settings.`,
  joinedDismissed: (groupName: string) =>
    `You're now a member of ${groupName}. Transaction sharing is off by default.`,
};
```

### Analytics Events

| Event | Properties | Description |
|-------|------------|-------------|
| `group_join_optin_shown` | `groupId`, `transactionSharingEnabled` | Dialog displayed |
| `group_join_optin_choice` | `groupId`, `choice: 'yes' \| 'no' \| 'dismiss'` | User decision |

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/SharedGroups/AcceptInvitationDialog.tsx` | MODIFY | Add toast + offline handling (existing) |
| `src/services/analyticsService.ts` | MODIFY | Add opt-in events |
| `tests/unit/components/SharedGroups/AcceptInvitationDialog.test.tsx` | MODIFY | Add edge case tests (existing) |

> **Architecture Note:** These SharedGroups files are in the legacy location. Per 14d-v2-ui-conventions.md, they should be in `src/features/shared-groups/components/`. This migration is tracked in tech debt story [TD-14d-2-fsd-component-location](./TD-14d-2-fsd-component-location.md). For now, modify files in their current location until TD-14d-2 is complete.

### Dependency Graph

```
UPSTREAM (must be complete):
+-- Story 14d-v2-1-14a: Dialog component
+-- Story 14d-v2-1-14b: Service integration

DOWNSTREAM (depends on this):
+-- Story 14d-v2-1-14d: Integration tests (tests the full flow including polish)
```

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.14]
- [Source: Story 14d-v2-1-14 (parent story)]

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
