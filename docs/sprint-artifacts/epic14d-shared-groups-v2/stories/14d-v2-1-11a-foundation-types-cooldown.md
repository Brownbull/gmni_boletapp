# Story 14d-v2-1.11a: Transaction Sharing Toggle - Foundation (Types & Cooldown)

Status: done

> **Split from Story 14d-v2-1.11:** 2026-02-01 via Atlas Story Sizing workflow
> Original story exceeded all sizing limits (6 tasks, 28 subtasks, 12 files).
> Split strategy: by_layer (foundation → service → UI)
> Related stories: 14d-v2-1-11b (service), 14d-v2-1-11c (UI)

## Story

As a **developer**,
I want **the TypeScript types and cooldown logic for transaction sharing toggle**,
so that **the service and UI layers can be built on a solid foundation**.

## Background

This story implements the **foundation layer** for the transaction sharing toggle feature.
It provides the type definitions and cooldown utility that will be consumed by Stories 1.11b (service) and 1.11c (UI).

The cooldown logic implements:
- 15-minute cooldown between toggle changes
- 3× daily limit
- Midnight reset based on group's timezone

## Acceptance Criteria

### Type Extensions (from original AC: 1, 2, 12)

**AC1:** SharedGroup type includes `transactionSharingEnabled: boolean` field
**AC2:** SharedGroup type includes `transactionSharingLastToggleAt: Timestamp | null` field
**AC3:** SharedGroup type includes `transactionSharingToggleCountToday: number` field
**AC4:** SharedGroup type includes `transactionSharingToggleCountResetAt: Timestamp | null` field
**AC5:** Type defaults handle migration case (missing fields default to false/0/null)

### Cooldown Logic (from original AC: 3, 4, 5)

**AC6:** `canToggleTransactionSharing(group)` returns `{ allowed: boolean, waitMinutes?: number, reason?: string }`
**AC7:** Cooldown check returns `allowed: false, waitMinutes: X` when last toggle was < 15 minutes ago
**AC8:** Daily limit check returns `allowed: false, reason: "daily limit"` when toggle count ≥ 3
**AC9:** Midnight reset logic uses group's `timezone` field (IANA format)
**AC10:** All cooldown edge cases have unit tests (12+ tests)

## Tasks / Subtasks

### Task 1: Extend SharedGroup Type (AC: 1-5)

- [x] 1.1 Add `transactionSharingEnabled: boolean` to SharedGroup type (already existed)
- [x] 1.2 Add `transactionSharingLastToggleAt: Timestamp | null` field (already existed)
- [x] 1.3 Add `transactionSharingToggleCountToday: number` field (already existed)
- [x] 1.4 Add `transactionSharingToggleCountResetAt: Timestamp | null` field (**NEW**)
- [x] 1.5 Add type documentation with migration notes for optional fields

### Task 2: Toggle Cooldown Service Logic (AC: 6-10)

- [x] 2.1 Create `canToggleTransactionSharing(group): { allowed: boolean, waitMinutes?: number, reason?: string }` utility
- [x] 2.2 Implement 15-minute cooldown check using `transactionSharingLastToggleAt`
- [x] 2.3 Implement 3× daily limit check using `transactionSharingToggleCountToday`
- [x] 2.4 Implement midnight reset logic using group's timezone (IANA format)
- [x] 2.5 Write 12+ unit tests for cooldown scenarios: (**34 tests written**)
  - Toggle allowed (no previous toggle)
  - Toggle blocked (within 15 minutes)
  - Toggle allowed (exactly 15 minutes)
  - Daily limit reached (3 toggles)
  - Midnight reset (new day)
  - Timezone edge cases (day boundary)
  - Missing fields (migration case)

## Dev Notes

### Architecture Patterns

- **Layered Visibility Model (LV-1):** Statistics ALWAYS include all members' contributions regardless of this toggle
- **Cooldown Pattern:** Same as Story 1.12 (user preferences) - 15 min group-level, 5 min user-level

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| SharedGroup type | `src/types/sharedGroup.ts` | Extend |
| Cooldown utility | `src/utils/sharingCooldown.ts` | New |
| Cooldown tests | `tests/unit/utils/sharingCooldown.test.ts` | New |

### Testing Standards

- Minimum 80% coverage for new code
- Test all cooldown edge cases (boundary conditions)
- Test timezone-aware midnight reset
- Test migration case (missing fields)

### Constraints from Architecture

- **FR-21:** 15 min cooldown, 3×/day limit
- **AD-6:** Group-level timezone (IANA format) used for midnight reset

### Dependencies

- None - this is the foundation story

### Downstream Stories

- **14d-v2-1-11b:** Uses types and cooldown utility for service functions
- **14d-v2-1-11c:** Uses cooldown utility for UI state display

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.11]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Layered Visibility Model]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 via ECC-orchestrated workflow (ecc-dev-story)

### Debug Log References

- ECC Planner: Implementation planning completed
- ECC TDD Guide: Task 1 (types) + Task 2 (cooldown utility) completed
- ECC Code Reviewer: APPROVED (0 HIGH, 2 MEDIUM, 3 LOW)
- ECC Security Reviewer: APPROVED (0 CRITICAL/HIGH/MEDIUM, 2 LOW - accepted tradeoffs)

### Completion Notes List

1. **Task 1:** AC1-3 fields already existed in SharedGroup type from Story 14d-v2-1-4b. Added AC4 field (`transactionSharingToggleCountResetAt`) + constants.
2. **Task 2:** Created comprehensive cooldown utility with 34 tests (exceeds 12+ requirement). 100% coverage on new code.
3. **TDD Approach:** Tests written first, implementation followed RED-GREEN-REFACTOR cycle.
4. **Migration Handling:** Fail-open design for corrupted/missing data - acceptable for UX, server-side rules provide security boundary.

### File List

| File | Change Type | Lines |
|------|-------------|-------|
| `src/types/sharedGroup.ts` | Modified | +15 (field + constants + JSDoc) |
| `src/utils/sharingCooldown.ts` | **New** | 142 |
| `tests/unit/utils/sharingCooldown.test.ts` | **New** | 477 |
| `src/features/shared-groups/hooks/useGroups.ts` | Modified | +1 (field init) |
| `src/features/shared-groups/services/groupService.ts` | Modified | +1 (field init) |

### ECC Review Summary (2026-02-04)

**Code Review:** ✅ APPROVED
- No HIGH severity issues
- 2 MEDIUM: Timezone validation (documented), type enum (optional improvement)
- 3 LOW: Documentation, test dates, magic numbers

**Security Review:** ✅ APPROVED (9/10)
- No CRITICAL/HIGH/MEDIUM issues
- 2 LOW (acknowledged design tradeoffs): fail-open for migration, UTC fallback
- Server-side rules (Story 11b) are the real security boundary

### Tech Debt Stories Created

| TD Story | Description | Priority |
|----------|-------------|----------|
| [TD-14d-36](./TD-14d-36-cooldown-reason-type-enum.md) | Refactor cooldown reason to const enum pattern | LOW |
| [TD-14d-37](./TD-14d-37-sharingcooldown-test-quality.md) | Test quality improvements (magic numbers, JSDoc, typed factories) | LOW |
