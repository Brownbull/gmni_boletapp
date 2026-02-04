# Story 14d-v2-1.11b: Transaction Sharing Toggle - Service Layer & Security

Status: ready-for-dev

> **Split from Story 14d-v2-1.11:** 2026-02-01 via Atlas Story Sizing workflow
> Original story exceeded all sizing limits (6 tasks, 28 subtasks, 12 files).
> Split strategy: by_layer (foundation → service → UI)
> **DEPENDS ON:** 14d-v2-1-11a (types and cooldown utility)
> Related stories: 14d-v2-1-11a (foundation), 14d-v2-1-11c (UI)

## Story

As a **group owner**,
I want **a secure service function to update the transaction sharing toggle**,
so that **only I can change this setting and changes are persisted atomically**.

## Background

This story implements the **service layer and security rules** for the transaction sharing toggle.
It depends on Story 1.11a for type definitions and cooldown logic.

## Acceptance Criteria

### Firestore Update Service (from original AC: 2, 7, 8)

**AC1:** `updateTransactionSharingEnabled(groupId, enabled): Promise<void>` service function exists
**AC2:** Service updates atomically: `transactionSharingEnabled`, `transactionSharingLastToggleAt`, `transactionSharingToggleCountToday`
**AC3:** Service calls `canToggleTransactionSharing()` and throws if not allowed
**AC4:** Ownership transfer preserves toggle state (no mutations to these fields)
**AC5:** Service function has 6+ unit tests

### Security Rules (from original AC: 2, 8)

**AC6:** Firestore rules allow owner write to `transactionSharingEnabled`
**AC7:** Firestore rules allow owner write to `transactionSharingLastToggleAt`
**AC8:** Firestore rules allow owner write to `transactionSharingToggleCountToday`
**AC9:** Firestore rules deny non-owner write to these fields
**AC10:** Security rules have 4+ tests

## Tasks / Subtasks

### Task 1: Firestore Update Service (AC: 1-5)

- [ ] 1.1 Create `updateTransactionSharingEnabled(groupId, enabled): Promise<void>` in shared group service
- [ ] 1.2 Implement atomic update with all related fields (enabled, lastToggleAt, toggleCount)
- [ ] 1.3 Add cooldown validation check before update (throw if not allowed)
- [ ] 1.4 Ensure ownership transfer preserves toggle state (no mutations)
- [ ] 1.5 Write 6+ unit tests for service function:
  - Successful toggle on
  - Successful toggle off
  - Blocked by cooldown (throws)
  - Blocked by daily limit (throws)
  - Network error handling
  - Atomic field update verification

### Task 2: Security Rules Update (AC: 6-10)

- [ ] 2.1 Add Firestore security rules for `transactionSharingEnabled`: write allowed only by `ownerId`
- [ ] 2.2 Add Firestore security rules for `transactionSharingLastToggleAt`: write allowed only by `ownerId`
- [ ] 2.3 Add Firestore security rules for `transactionSharingToggleCountToday`: write allowed only by `ownerId`
- [ ] 2.4 Write security rules tests:
  - Owner can update toggle fields
  - Non-owner member cannot update toggle fields
  - Unauthenticated user cannot update toggle fields
  - Read access for all members

## Dev Notes

### Architecture Patterns

- **Atomic Updates:** All toggle-related fields updated in single Firestore write
- **Cooldown Validation:** Service validates cooldown before attempting write
- **Security by Default:** Rules deny unless explicitly allowed

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| Service function | `src/services/sharedGroupService.ts` | Extend stub |
| Service tests | `tests/unit/services/sharedGroupService.test.ts` | Extend |
| Security rules | `firestore.rules` | Update |
| Security rules tests | `tests/rules/sharedGroup.rules.test.ts` | Extend |

### Testing Standards

- Minimum 80% coverage for new code
- Test cooldown integration with service
- Test security rules for all user types
- Test atomic update verification

### Constraints from Architecture

- **FR-19:** Group owner controls transaction sharing toggle
- **FR-21:** 15 min cooldown, 3×/day limit (enforced by cooldown utility from 1.11a)

### Dependencies

- **14d-v2-1-11a:** Types and cooldown utility (must be complete first)

### Downstream Stories

- **14d-v2-1-11c:** Uses service function for Firestore persistence

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.11]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Layered Visibility Model]

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
