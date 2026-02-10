# Story 15-TD-3: Foundation Infrastructure Tests

**Epic:** 15 - Codebase Refactoring
**Points:** 5
**Priority:** HIGH
**Status:** ready-for-dev

## Description

Write comprehensive unit tests for the 5 shared infrastructure modules created in Phase 1 and Phase 7 that currently have zero test coverage. These are security-critical and widely-consumed utilities.

## Background

Phase 1 created 4 shared utilities (`firestoreBatch`, `firestorePaths`, `mappingServiceBase`, `duplicateGrouping`) and Phase 7 created `useHistoryFiltersStore`. All are consumed by multiple services/hooks but have zero dedicated unit tests. The TDD Guide scored test coverage at 45/100 during code review specifically due to these gaps.

## Source Tech Debt Items

- **TD-15:** 4 Phase 1 utilities missing unit tests: `firestoreBatch`, `firestorePaths`, `mappingServiceBase`, `duplicateGrouping`
- **TD-16:** `useHistoryFiltersStore` missing unit tests (7 action types, date-dependent state)

## Acceptance Criteria

- [ ] **AC1:** `firestoreBatch.test.ts` covers: chunking at 500 ops, empty array, single item, exact 500, 501 items, error propagation
- [ ] **AC2:** `firestorePaths.test.ts` covers: all 11 path builders return correct paths, segment builders return arrays
- [ ] **AC3:** `mappingServiceBase.test.ts` covers: `normalizeForMapping`, `saveMapping` (create + update paths), `getMappings`, `deleteMapping`, sanitize-on-save
- [ ] **AC4:** `duplicateGrouping.test.ts` covers: `buildDuplicateGroups` (Union-Find transitive merge), `filterAndGroupDuplicates` pipeline, empty input, single item, no duplicates
- [ ] **AC5:** `useHistoryFiltersStore.test.ts` covers: all 7 action types, `getDefaultFilterState` with mocked date, selectors, imperative actions
- [ ] **AC6:** All new tests pass in `npm run test:quick`

## Tasks

- [ ] **Task 1:** Write `tests/unit/lib/firestoreBatch.test.ts`
  - [ ] Mock `writeBatch` from `firebase/firestore`
  - [ ] Test chunking boundary (499, 500, 501 items)
  - [ ] Test empty array returns immediately
  - [ ] Test error propagation from `batch.commit()`
- [ ] **Task 2:** Write `tests/unit/lib/firestorePaths.test.ts`
  - [ ] Test all 8 collection path functions return correct `artifacts/{appId}/users/{userId}/...` format
  - [ ] Test 3 document segment functions return arrays
  - [ ] Test with various appId/userId combinations
- [ ] **Task 3:** Write `tests/unit/services/mappingServiceBase.test.ts`
  - [ ] Mock Firestore operations
  - [ ] Test `normalizeForMapping` (lowercase, trim, special chars, spaces)
  - [ ] Test `saveMapping` create path (no existing doc)
  - [ ] Test `saveMapping` update path (existing doc found)
  - [ ] Test `sanitizeTarget` hook is called when configured
- [ ] **Task 4:** Write `tests/unit/utils/duplicateGrouping.test.ts`
  - [ ] Test `buildDuplicateGroups` with transitive duplicates (A=B, B=C → {A,B,C})
  - [ ] Test `filterAndGroupDuplicates` end-to-end pipeline
  - [ ] Test edge cases: empty input, single item, all unique
- [ ] **Task 5:** Write `tests/unit/shared/stores/useHistoryFiltersStore.test.ts`
  - [ ] Test all 7 reducer actions (SET_TEMPORAL, SET_CATEGORY, SET_LOCATION, RESET, etc.)
  - [ ] Test `getDefaultFilterState()` with `vi.useFakeTimers()`
  - [ ] Test selectors (`useHistoryFiltersState`, `useHistoryFiltersDispatch`)
  - [ ] Test imperative `historyFiltersActions`

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
