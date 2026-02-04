# Story 14d-v2-1.12a: Foundation (Types + Cooldown Utility)

Status: ready-for-dev

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

- [ ] 1.1 Create `UserGroupPreference` interface in `src/types/userPreferences.ts`:
  ```typescript
  interface UserGroupPreference {
    shareMyTransactions: boolean;
    lastToggleAt: Timestamp | null;
    toggleCountToday: number;
    toggleCountResetAt: Timestamp | null;
  }
  ```
- [ ] 1.2 Create `UserGroupPreferencesDocument` interface with `groupPreferences` record
- [ ] 1.3 Add default values factory function `createDefaultGroupPreference()`
- [ ] 1.4 Export types from `src/types/index.ts`
- [ ] 1.5 Write 4+ unit tests for type utilities (default factory, type guards if needed)

### Task 2: Toggle Cooldown Logic (AC: 4, 5, 6, 7)

- [ ] 2.1 Create `src/utils/userSharingCooldown.ts` with `canToggleUserSharingPreference(preference)` function
- [ ] 2.2 Implement 5-minute cooldown check using `lastToggleAt` comparison
- [ ] 2.3 Implement 3x daily limit check using `toggleCountToday`
- [ ] 2.4 Implement midnight reset logic using device local timezone (compare `toggleCountResetAt` with current date)
- [ ] 2.5 Handle missing fields gracefully (migration scenario - default to 0/null)
- [ ] 2.6 Return type: `{ allowed: boolean; waitMinutes?: number; reason?: 'cooldown' | 'daily_limit' }`
- [ ] 2.7 Write 12+ unit tests for cooldown scenarios:
  - Cooldown active (4:59, 5:00, 5:01 minutes)
  - Daily limit (0, 1, 2, 3, 4 toggles)
  - Midnight reset (same day, next day, timezone edge cases)
  - Missing fields (null/undefined handling)

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

(To be filled during development)

### Debug Log References

(To be filled during development)

### Completion Notes List

(To be filled during development)

### File List

(To be filled during development)
