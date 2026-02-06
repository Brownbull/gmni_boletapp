# Story 14d-v2-1.12a: Foundation (Types + Cooldown Utility)

Status: done

> **Split from Story 14d-v2-1.12** (2026-02-01)
> Original story exceeded sizing limits (8 tasks, 34 subtasks, 8 files)
> Split strategy: by_layer (Foundation → Service → UI → Integration)
> Part 1 of 4

## Story

As a **developer**,
I want **the user preference types and cooldown utilities defined**,
so that **subsequent stories can implement the service and UI layers with a solid foundation**.

## Background

This story implements the foundation layer for the user-level transaction sharing preference (Gate 2 of the Layered Visibility Model). It defines:
1. TypeScript types for the user preferences document schema
2. Cooldown logic utilities for the 5-minute and 3×/day rate limiting

## Acceptance Criteria

### Type Definitions (from original AC10, AC11, AC16, AC17)

**AC1:** Given the `UserGroupPreference` interface is defined, Then it includes:
- `shareMyTransactions: boolean` (default: false)
- `lastToggleAt: Timestamp | null`
- `toggleCountToday: number`
- `toggleCountResetAt: Timestamp | null`

**AC2:** Given the `UserGroupPreferencesDocument` interface is defined, Then it includes:
- `groupPreferences: Record<string, UserGroupPreference>`

**AC3:** Given a `createDefaultGroupPreference()` factory function exists, Then it returns a preference with `shareMyTransactions: false` (privacy-first default per LV-6)

### Cooldown Logic (from original AC5, AC6, AC7, AC17)

**AC4:** Given I call `canToggleUserSharingPreference(preference)`, When `lastToggleAt` is within 5 minutes, Then it returns `{ allowed: false, waitMinutes: X, reason: 'cooldown' }`

**AC5:** Given I call `canToggleUserSharingPreference(preference)`, When `toggleCountToday >= 3`, Then it returns `{ allowed: false, reason: 'daily_limit' }`

**AC6:** Given it's a new day (midnight in local timezone), When I call `canToggleUserSharingPreference(preference)`, Then the daily count is considered reset and `{ allowed: true }` is returned

**AC7:** Given the `toggleCountToday` field is missing (migration scenario), When I evaluate cooldown, Then it defaults to 0 (allowed)

## Tasks / Subtasks

### Task 1: User Preferences Type & Schema (AC: 1, 2, 3)

- [x] 1.1 Add `toggleCountResetAt: Timestamp | null` to existing `UserGroupPreference` interface in `src/types/sharedGroup.ts` (type already existed, added missing field)
- [x] 1.2 Verified `UserSharedGroupsPreferences` interface exists with `groupPreferences` record (lines 377-380)
- [x] 1.3 Created `createDefaultGroupPreference()` factory function with privacy-first default (`shareMyTransactions: false`)
- [x] 1.4 Exported `createDefaultGroupPreference` from `src/types/index.ts`
- [x] 1.5 Wrote 21 unit tests for type utilities in `tests/unit/types/sharedGroup.test.ts`

### Task 2: Toggle Cooldown Logic (AC: 4, 5, 6, 7)

- [x] 2.1 Created `src/utils/userSharingCooldown.ts` with `canToggleUserSharingPreference(preference)` function
- [x] 2.2 Implemented 5-minute cooldown check using `lastToggleAt` comparison (uses `USER_SHARING_COOLDOWN_MINUTES` constant)
- [x] 2.3 Implemented 3x daily limit check using `toggleCountToday` (uses `USER_SHARING_DAILY_LIMIT` constant)
- [x] 2.4 Implemented midnight reset logic using device local timezone via `toDateString()` comparison
- [x] 2.5 Handled missing fields gracefully (migration scenario - default to 0/null, allow toggle)
- [x] 2.6 Return type: `UserToggleCooldownResult { allowed: boolean; waitMinutes?: number; reason?: 'cooldown' | 'daily_limit' }`
- [x] 2.7 Wrote 43 unit tests for cooldown scenarios in `tests/unit/utils/userSharingCooldown.test.ts`:
  - Cooldown active (4:59, 5:00, 5:01 minutes) - all boundaries tested
  - Daily limit (0, 1, 2, 3, 4 toggles) - all boundaries tested
  - Midnight reset (same day, next day) - tested
  - Missing fields (null/undefined handling, corrupted timestamps) - 6 migration tests

## Dev Notes

### Architecture Patterns

- **Privacy-First (LV-6):** Default `shareMyTransactions: false` when joining a group
- **Cooldown Pattern:** 5 min user-level cooldown (vs 15 min group-level in Story 1.11)
- **Daily Limit:** 3 toggles per day to prevent abuse

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| User preferences types | `src/types/userPreferences.ts` | New |
| Types index export | `src/types/index.ts` | Update |
| Cooldown utility | `src/utils/userSharingCooldown.ts` | New |
| Cooldown tests | `tests/unit/utils/userSharingCooldown.test.ts` | New |

### Testing Standards

- Minimum 80% coverage for new code
- Test all cooldown boundary conditions (4:59/5:00/5:01 minutes)
- Test all daily limit boundaries (0/1/2/3/4 toggles)
- Test midnight reset across timezones
- Test missing field handling for migration scenarios

### Dependencies

- None (foundation story)

### Downstream Stories

- **Story 1.12b:** Uses types for service implementation
- **Story 1.12c:** Uses cooldown utility in UI component
- **Story 1.12d:** Uses types for integration

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-12-user-transaction-sharing-preference.md - Original story]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - FR-21 (5 min cooldown, 3×/day), LV-6 (privacy-first)]
- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-11-transaction-sharing-toggle-group.md - Cooldown pattern reference]

---

## Dev Agent Record

### Agent Model Used

- Claude Opus 4.5 (ECC-orchestrated workflow)
- ECC Agents Used: Planner, TDD Guide, Code Reviewer, Security Reviewer (parallel)

### Debug Log References

- N/A (clean implementation, no debug issues)

### Completion Notes List

1. **Architecture Decision:** Used existing `src/types/sharedGroup.ts` instead of creating new `src/types/userPreferences.ts` - types already existed there from Story 1.6e
2. **Added Missing Field:** `toggleCountResetAt: Timestamp | null` was missing from `UserGroupPreference` interface (required by AC1)
3. **Constants Added:** `USER_SHARING_COOLDOWN_MINUTES: 5` and `USER_SHARING_DAILY_LIMIT: 3` to `SHARED_GROUP_LIMITS`
4. **Updated Dependent Code:** `src/services/userPreferencesService.ts` updated to use `createDefaultGroupPreference()` factory
5. **64 New Tests:** 21 for types, 43 for cooldown utility - all passing

### File List

| File | Change Type | Lines | Tests |
|------|-------------|-------|-------|
| `src/types/sharedGroup.ts` | Modified | +25 | N/A |
| `src/types/index.ts` | Modified | +1 | N/A |
| `src/utils/userSharingCooldown.ts` | New | 144 | 43 |
| `src/services/userPreferencesService.ts` | Modified | +2 | N/A |
| `tests/unit/types/sharedGroup.test.ts` | New | 168 | 21 |
| `tests/unit/utils/userSharingCooldown.test.ts` | New | 352 | 43 |
| `tests/unit/services/userPreferencesService.test.ts` | Modified | +5 | N/A |

### ECC Review Results (2026-02-05) - Review #1

**Overall Score:** 9/10 - APPROVE WITH TD STORIES

| Category | Score | Status |
|----------|-------|--------|
| Code Quality | 8/10 | DRY concern |
| Security | 9/10 | APPROVED |
| Architecture | 9/10 | APPROVED |
| Testing | 10/10 | APPROVED |

### ECC Parallel Review Results (2026-02-05) - Review #2

**Overall Score:** 8.5/10 - APPROVE

| Category | Score | Status |
|----------|-------|--------|
| Code Quality | 8/10 | 0 HIGH, 3 MEDIUM, 4 LOW |
| Security | 7/10 | PASS WITH TD (1 HIGH tracked, 3 MEDIUM) |
| Architecture | 9/10 | 100% pattern compliance |
| Testing | 10/10 | 7/7 ACs covered, 64 tests |

**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide (parallel)

**Code Review:** APPROVE WITH SUGGESTIONS (8/10)
- 1 HIGH: DRY violation - code duplication with sharingCooldown.ts (~80% identical)
- 3 MEDIUM: Test helper duplication, date comparison inconsistency, missing JSDoc
- 3 LOW: Minor documentation improvements

**Security Review:** PASS (9/10)
- 0 CRITICAL, 0 HIGH
- 2 MEDIUM: Client-side rate limiting (accepted risk - server-side planned), migration default bypass potential
- 2 LOW: Timestamp manipulation (mitigated by serverTimestamp)
- Privacy-first defaults correctly implemented (LV-6) ✅

**Architecture Review:** APPROVED (9/10)
- File location deviation: Used `sharedGroup.ts` instead of new `userPreferences.ts` - ACCEPTABLE
- Pattern compliance: FULL
- DRY concerns: Documented for future TD story

**Testing Review:** APPROVED (10/10)
- 64 tests (21 type + 43 cooldown), 100% coverage on utility
- All 7 ACs fully covered with boundary testing

### Review Follow-ups (ECC) - Completed 2026-02-05

- [x] [ECC-Review][HIGH][Code] Create TD story for DRY refactor - **TD-14d-48-cooldown-core-extraction** added to sprint-status.yaml
- [x] [ECC-Review][MEDIUM][Code] Extract `createMockTimestamp` to shared test utilities - **TD-14d-49-mock-timestamp-test-helper** added to sprint-status.yaml
- [x] [ECC-Review][MEDIUM][Code] Add JSDoc documentation to `UserToggleCooldownResult` interface - **Added comprehensive JSDoc with example**
- [x] [ECC-Review][MEDIUM][Code] Align or document date comparison methods - **Added design decision doc in function JSDoc**
- [x] [ECC-Review][LOW][Code] Clarify comment about `toDateString()` locale behavior - **Added detailed inline comments explaining format**
- [x] [ECC-Review][LOW][Code] Use `Partial<UserGroupPreference>` instead of `as any` in migration tests - **Fixed with proper typing**

### Tech Debt Stories Created (ECC Review #2 - 2026-02-05)

| TD Story | Description | Priority |
|----------|-------------|----------|
| [TD-14d-48](./TD-14d-48-cooldown-core-extraction.md) | Extract shared cooldown logic to cooldownCore.ts | HIGH |
| [TD-14d-49](./TD-14d-49-mock-timestamp-test-helper.md) | Extract createMockTimestamp to shared test utilities | MEDIUM |
| [TD-14d-54](./TD-14d-54-barrel-export-type-completeness.md) | Add UserGroupPreference types to barrel export | LOW |
| [TD-14d-55](./TD-14d-55-groupid-validation.md) | Validate groupId before use in Firestore field paths | MEDIUM |
