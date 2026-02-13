# Story 15-TD-3: Foundation Infrastructure Tests

**Epic:** 15 - Codebase Refactoring
**Points:** 5
**Priority:** HIGH
**Status:** done

## Description

Write comprehensive unit tests for the 5 shared infrastructure modules created in Phase 1 and Phase 7 that currently have zero test coverage. These are security-critical and widely-consumed utilities.

## Background

Phase 1 created 4 shared utilities (`firestoreBatch`, `firestorePaths`, `mappingServiceBase`, `duplicateGrouping`) and Phase 7 created `useHistoryFiltersStore`. All are consumed by multiple services/hooks but have zero dedicated unit tests. The TDD Guide scored test coverage at 45/100 during code review specifically due to these gaps.

## Source Tech Debt Items

- **TD-15:** 4 Phase 1 utilities missing unit tests: `firestoreBatch`, `firestorePaths`, `mappingServiceBase`, `duplicateGrouping`
- **TD-16:** `useHistoryFiltersStore` missing unit tests (7 action types, date-dependent state)

## Acceptance Criteria

- [x] **AC1:** `firestoreBatch.test.ts` covers: chunking at 500 ops, empty array, single item, exact 500, 501 items, error propagation (12 tests, created in TD-2)
- [x] **AC2:** `firestorePaths.test.ts` covers: all 14 path builders return correct paths, segment builders return arrays (16 tests)
- [x] **AC3:** `mappingServiceBase.test.ts` covers: `normalizeForMapping` (9 tests), `saveMapping` create + update + sanitize (5 tests, created in TD-1)
- [x] **AC4:** `duplicateGrouping.test.ts` covers: `buildDuplicateGroups` (Union-Find transitive merge), `filterAndGroupDuplicates` pipeline, empty input (12 tests)
- [x] **AC5:** `useHistoryFiltersStore.test.ts` covers: all 7 action types, `getDefaultFilterState`, selectors, imperative actions (15 tests)
- [x] **AC6:** All 6,409 tests pass in `npm run test:quick`

## Tasks

- [x] **Task 1:** `tests/unit/lib/firestoreBatch.test.ts` (12 tests — created in TD-2)
- [x] **Task 2:** `tests/unit/lib/firestorePaths.test.ts` (16 tests)
- [x] **Task 3:** `tests/unit/services/mappingServiceBase.normalizeForMapping.test.ts` (9 tests) + `mappingServiceBase.saveMapping.test.ts` (5 tests, TD-1)
- [x] **Task 4:** `tests/unit/utils/duplicateGrouping.test.ts` (12 tests)
- [x] **Task 5:** `tests/unit/stores/useHistoryFiltersStore.test.ts` (15 tests)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `tests/unit/lib/firestoreBatch.test.ts` | CREATE | Batch chunking + error tests |
| `tests/unit/lib/firestorePaths.test.ts` | CREATE | Path builder correctness tests |
| `tests/unit/services/mappingServiceBase.test.ts` | CREATE | CRUD + normalization tests |
| `tests/unit/utils/duplicateGrouping.test.ts` | CREATE | Union-Find + pipeline tests |
| `tests/unit/shared/stores/useHistoryFiltersStore.test.ts` | CREATE | Zustand store reducer tests |

## Dev Notes

- `firestoreBatch.ts` and `firestorePaths.ts` are pure functions — no React rendering needed
- `duplicateGrouping.ts` is pure — excellent for table-driven tests
- `mappingServiceBase.ts` requires Firestore mocks (same pattern as existing service tests)
- `useHistoryFiltersStore.ts` uses Zustand — test via `act()` + `useStore.getState()` pattern (see `useSettingsStore.test.ts` for reference)
- Use `vi.useFakeTimers()` for `getDefaultFilterState()` to control `new Date()`
