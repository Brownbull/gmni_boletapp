# Tech Debt Story 15-TD-25: Extract Shared Test Fixtures for Mega-View Helpers

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-13) on story 15-TD-21
> **Priority:** MEDIUM
> **Estimated Effort:** 2 pts

## Story

As a **developer**,
I want **shared test fixture factories extracted from the 6 TD-21 helper test files**,
So that **test files comply with the 300-line limit and DRY violations are eliminated**.

## Background

The 6 test files created in 15-TD-21 duplicate `makeTx`, `makeCategoryData`, and `categoryColors` mocks across 4-5 files each. Extracting these into shared fixtures at `tests/unit/views/__fixtures__/` would bring 3-4 of the 5 oversized files under the 300-line unit test limit.

## Acceptance Criteria

- [ ] **AC1:** `tests/unit/views/__fixtures__/transactionFactory.ts` exports `makeTx` helper (used in 4+ test files)
- [ ] **AC2:** `tests/unit/views/__fixtures__/categoryDataFactory.ts` exports `makeCategoryData` helper (used in 2 test files)
- [ ] **AC3:** `tests/unit/views/__fixtures__/categoryColorsMock.ts` exports shared `categoryColors` mock (used in 5 test files)
- [ ] **AC4:** All 6 TD-21 test files updated to import from shared fixtures instead of inline definitions
- [ ] **AC5:** At least 4 of 6 test files are under 300 lines after extraction
- [ ] **AC6:** All 190 tests continue to pass with `npm run test:quick`

## Tasks

- [ ] **Task 1:** Create shared fixture files
  - [ ] `tests/unit/views/__fixtures__/transactionFactory.ts` — `makeTx` with same interface
  - [ ] `tests/unit/views/__fixtures__/categoryDataFactory.ts` — `makeCategoryData`
  - [ ] `tests/unit/views/__fixtures__/categoryColorsMock.ts` — `categoryColors` map
- [ ] **Task 2:** Update test files to use shared fixtures
  - [ ] `periodComparisonHelpers.test.ts` — remove inline `makeTx`, import from shared
  - [ ] `navigationHelpers.test.ts` — remove inline `makeCategoryData`, import from shared
  - [ ] `drillDownHelpers.test.ts` — remove inline `makeTx` + `makeCategoryData`, import from shared
  - [ ] `categoryDataHelpers.test.ts` — remove inline `makeTx` + `categoryColors`, import from shared
  - [ ] `chartDataHelpers.test.ts` — remove inline `makeTx` + `categoryColors`, import from shared
  - [ ] `periodNavigationHelpers.test.ts` — remove inline `categoryColors` if present, import from shared

## Dev Notes

- Source story: [15-TD-21](./15-TD-21-mega-view-helper-tests.md)
- Review findings: #1-8 (5x HIGH file size + 3x MEDIUM DRY)
- Files affected: 6 existing test files + 3 new shared fixture files
- This is a mechanical refactor — no test logic changes needed
- `makeTx` signatures vary slightly across files; unify to the most complete version
