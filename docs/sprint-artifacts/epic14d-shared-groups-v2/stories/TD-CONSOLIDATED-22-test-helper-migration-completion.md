# TD-CONSOLIDATED-22: Test Helper Migration Completion

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-08) on story TD-CONSOLIDATED-8
> **Tier:** 3 - Test Quality (DO WHEN TOUCHING)
> **Priority:** LOW (fix inline when working on related code)
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW
> **Dependencies:** TD-CONSOLIDATED-8

## Story

As a **developer**,
I want **the test helper migration from TD-CONSOLIDATED-8 completed across all remaining files**,
So that **test infrastructure is fully standardized with no inconsistencies**.

## Problem Statement

TD-CONSOLIDATED-8 extracted DRY helpers (useFirebaseEmulatorLifecycle, constants, barrel exports) but adoption was scoped to the 40 files touched in that story. Several integration test files and import patterns remain inconsistent.

## Acceptance Criteria

- [ ] Remaining 7 integration test files migrated to `useFirebaseEmulatorLifecycle()` where applicable (skip files with custom lifecycle needs like firestore-rules.test.ts)
- [ ] Standardize all test helper imports to use `@helpers/<module>` instead of relative `../../helpers` paths
- [ ] Adopt `SEVEN_DAYS_MS`/`ONE_DAY_MS` constants from `@helpers/constants` in integration test files that still use `7 * 24 * 60 * 60 * 1000`
- [ ] Add ESLint `no-restricted-imports` rule to prevent `@helpers` imports in production code (`src/`)
- [ ] All tests pass after changes

## Tasks / Subtasks

- [ ] **Task 1: Complete lifecycle helper adoption**
  - [ ] Audit remaining integration tests: `tests/integration/*.test.ts(x)`
  - [ ] Migrate standard-pattern files to `useFirebaseEmulatorLifecycle()`
  - [ ] Document which files have custom lifecycle needs (skip those)

- [ ] **Task 2: Standardize import paths**
  - [ ] Grep all `tests/` for `from '../../helpers'` and `from '../../../helpers'`
  - [ ] Replace with `@helpers/firestore`, `@helpers/sharedGroupFactory`, etc.
  - [ ] Verify no barrel import (`@helpers`) — must use `@helpers/<module>`

- [ ] **Task 3: Adopt time constants**
  - [ ] Grep integration tests for `7 * 24 * 60 * 60 * 1000` and similar
  - [ ] Replace with `SEVEN_DAYS_MS` from `@helpers/constants`
  - [ ] Replace `SHARED_GROUP_LIMITS` direct imports with re-export from `@helpers/constants`

- [ ] **Task 4: ESLint production import guard**
  - [ ] Add `no-restricted-imports` rule blocking `@helpers/*` in `src/**`
  - [ ] Add override allowing `@helpers/*` in `tests/**`
  - [ ] Verify rule catches test helper imports in production code

## Dev Notes

- Source story: [TD-CONSOLIDATED-8](./TD-CONSOLIDATED-8-test-infrastructure-cleanup.md)
- Review findings: #4 (partial lifecycle adoption), #5 (tsconfig import scope), #6 (inconsistent imports), #7 (unused re-exports)
- Files affected: ~15 integration tests + ESLint config
- `firestore-rules.test.ts` has 6 separate describe blocks with different contexts — likely needs custom lifecycle, skip it
