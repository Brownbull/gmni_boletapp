# Story 14d-v2-1.12d: Integration + Cleanup

Status: ready-for-dev

> **Split from Story 14d-v2-1.12** (2026-02-01)
> Original story exceeded sizing limits (8 tasks, 34 subtasks, 8 files)
> Split strategy: by_layer (Foundation → Service → UI → Integration)
> Part 4 of 4

## Story

As a **group member**,
I want **to access my sharing preferences in Group Settings and have them cleaned up when I leave**,
so that **I have a clear place to manage my privacy settings and no orphaned data remains**.

## Background

This story completes the user-level transaction sharing preference by:
1. Integrating the toggle component into Group Settings
2. Adding cleanup logic when a user leaves a group

## Acceptance Criteria

### Integration into Group Settings (from original AC1, AC2, AC14, AC15)

**AC1:** Given I go to Group Settings > My Sharing Preferences, Then I see the `UserTransactionSharingToggle` component for the selected group

**AC2:** Given I view group statistics (byMember breakdown), When my `shareMyTransactions` is false, Then:
- My spending total STILL appears in byMember breakdown (statistics always on per LV-1/FR-22)
- Only individual transaction details are hidden

**AC3:** Given I toggle `shareMyTransactions` to false, When the helper text appears, Then it explains eventual consistency: "Other members will stop seeing your transactions on their next sync."

**AC4:** Given I view My Sharing Preferences, Then I see an info tooltip explaining the double-gate model (group toggle + user toggle)

### Group Leave Cleanup (from original AC13)

**AC5:** Given I leave a group (or am removed), When the leave is processed, Then my preference entry for that group is deleted from the preferences document

**AC6:** Given I am the owner and transfer ownership before leaving, When I leave, Then my preference is still cleaned up

**AC7:** Given the cleanup fails (network error), When I retry leaving, Then the cleanup is retried

## Tasks / Subtasks

### Task 1: Integration into Group Settings (AC: 1, 2, 3, 4)

- [ ] 1.1 Add "My Sharing Preferences" section to Group Settings UI (following Epic 14.22 hierarchical patterns)
- [ ] 1.2 Import and render `UserTransactionSharingToggle` component for selected group
- [ ] 1.3 Add info tooltip explaining the double-gate model (group owner toggle + user toggle)
- [ ] 1.4 Add eventual consistency explanation text below toggle
- [ ] 1.5 Ensure byMember statistics still show user's total when sharing is off (statistics always on)
- [ ] 1.6 Write integration tests for full Settings flow

### Task 2: Group Leave Cleanup Hook (AC: 5, 6, 7)

- [ ] 2.1 Create `deleteGroupPreference(userId, groupId)` function in service (from 1.12b)
- [ ] 2.2 Update `leaveGroup()` service to call `deleteGroupPreference(userId, groupId)` after successful leave
- [ ] 2.3 Handle cleanup in ownership transfer scenarios (clean up after transfer completes)
- [ ] 2.4 Handle cleanup errors gracefully (log but don't block leave operation)
- [ ] 2.5 Write 4+ unit tests for cleanup scenarios:
  - Normal leave triggers cleanup
  - Ownership transfer + leave triggers cleanup
  - Cleanup error doesn't block leave
  - Already-deleted preference doesn't cause error

## Dev Notes

### Architecture Patterns

- **Hierarchical Settings:** Follows Epic 14.22 Settings patterns (sub-views)
- **Eventual Consistency (LV-5):** Clear UX communication about sync timing
- **Cleanup on Leave:** Preferences are user-owned, cleaned up with user's group membership

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| Settings integration | `src/views/SettingsView.tsx` or extracted view | Integrate |
| Leave group service | `src/services/sharedGroupService.ts` | Extend |
| Integration tests | `tests/integration/sharedGroups/userPreferences.test.ts` | New |

### UI Patterns

- Settings section follows existing hierarchical navigation patterns
- Info tooltip uses existing tooltip component
- Helper text follows BoletApp voice (non-judgmental, informative)

### Testing Standards

- Integration tests for full Settings → Toggle → Firestore flow
- Unit tests for cleanup scenarios
- Verify statistics still show user's total when sharing off

### Dependencies

- **Story 1.12a:** Types (DEPENDS)
- **Story 1.12b:** Service functions (DEPENDS)
- **Story 1.12c:** Toggle component and hook (DEPENDS)
- **Story 1.7 (Leave/Manage Group):** Leave flow calls cleanup from this story

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-12-user-transaction-sharing-preference.md - Original story]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - LV-1 (statistics always on), LV-5 (eventual consistency), FR-22]
- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-7-leave-manage-group.md - Leave flow reference]

---

## Atlas Workflow Analysis

> Carried forward from original story

### Affected Workflows

| Workflow | Impact Description |
|----------|-------------------|
| **Settings Flow** | New "My Sharing Preferences" section - nested under each group in Group Settings UI |
| **Leave Group Flow** | Cleanup hook called during leave to delete user's group preference |

### Downstream Effects

| Story | Effect |
|-------|--------|
| **1.7 (Leave/Manage Group)** | Must call cleanup function from this story |
| **2.2 (View Group Transactions)** | Reads preference to determine visibility |
| **2.12 (Sharing Disabled Empty State)** | Shows UX when user has opted out |

---

## Dev Agent Record

### Agent Model Used

(To be filled during development)

### Debug Log References

(To be filled during development)

### Completion Notes List

(To be filled during development)

### File List

(To be filled during development)
