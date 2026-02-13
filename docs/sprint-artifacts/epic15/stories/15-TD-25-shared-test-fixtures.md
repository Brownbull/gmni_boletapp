# Tech Debt Story 15-TD-25: Extract Shared Test Fixtures for Mega-View Helpers

Status: done

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

- [x] **AC1:** `tests/unit/views/__fixtures__/transactionFactory.ts` exports `makeTx` helper (used in 4+ test files)
- [x] **AC2:** `tests/unit/views/__fixtures__/categoryDataFactory.ts` exports `makeCategoryData` helper (used in 2 test files)
- [x] **AC3:** `tests/unit/views/__fixtures__/categoryColorsMock.ts` exports shared `categoryColors` mock (used in 3 test files via async vi.mock)
- [x] **AC4:** All 6 TD-21 test files updated to import from shared fixtures instead of inline definitions
- [ ] **AC5:** At least 4 of 6 test files are under 300 lines after extraction — **NOT MET** (see Dev Notes)
- [x] **AC6:** All 190 tests continue to pass with `npm run test:quick`

## Tasks

- [x] **Task 1:** Create shared fixture files
  - [x] `tests/unit/views/__fixtures__/transactionFactory.ts` — `makeTx` with same interface
  - [x] `tests/unit/views/__fixtures__/categoryDataFactory.ts` — `makeCategoryData` (unified with default `percent = 50`)
  - [x] `tests/unit/views/__fixtures__/categoryColorsMock.ts` — `categoryColors` data constants
- [x] **Task 2:** Update test files to use shared fixtures
  - [x] `periodComparisonHelpers.test.ts` — remove inline `makeTx` + categoryColors data, import from shared
  - [x] `navigationHelpers.test.ts` — remove inline `makeCategoryData`, import from shared
  - [x] `drillDownHelpers.test.ts` — remove inline `makeTx` + `makeCategoryData`, import from shared
  - [x] `categoryDataHelpers.test.ts` — remove inline `makeTx` + categoryColors data, import from shared
  - [x] `chartDataHelpers.test.ts` — remove inline `makeTx` + categoryColors data, import from shared
  - [x] `periodNavigationHelpers.test.ts` — no shared fixtures used (no changes needed)

## File List

| File | Action | Lines |
|------|--------|-------|
| `tests/unit/views/__fixtures__/transactionFactory.ts` | CREATE | 16 |
| `tests/unit/views/__fixtures__/categoryDataFactory.ts` | CREATE | 19 |
| `tests/unit/views/__fixtures__/categoryColorsMock.ts` | CREATE | 45 |
| `tests/unit/views/TrendsView/periodComparisonHelpers.test.ts` | MODIFY | 352 |
| `tests/unit/views/TrendsView/navigationHelpers.test.ts` | MODIFY | 390 |
| `tests/unit/views/TrendsView/drillDownHelpers.test.ts` | MODIFY | 176 |
| `tests/unit/views/DashboardView/categoryDataHelpers.test.ts` | MODIFY | 446 |
| `tests/unit/views/DashboardView/chartDataHelpers.test.ts` | MODIFY | 488 |

## Dev Notes

- Source story: [15-TD-21](./15-TD-21-mega-view-helper-tests.md)
- Review findings: #1-8 (5x HIGH file size + 3x MEDIUM DRY)
- Files affected: 5 existing test files modified + 3 new shared fixture files
- `makeTx` was identical across all 4 files — direct extraction
- `makeCategoryData` unified: navigationHelpers had explicit `percent` param, drillDownHelpers hardcoded 50 → unified with `percent = 50` default
- `categoryColorsMock` shared via `async vi.mock` factory with `await import()` (Vitest hoisting requires async dynamic import pattern)
- `drillDownHelpers.test.ts` keeps inline STORE_CATEGORY_GROUPS (3-entry subset) — intentionally different from shared 4-entry fixture
- `periodNavigationHelpers.test.ts` — no changes needed (doesn't use makeTx, makeCategoryData, or categoryColors)

### AC5 Analysis (NOT MET)

Line reduction per file: -23 to -45 lines (total: -143 lines across 6 files). Only 1 of 6 files is under 300 lines (drillDownHelpers at 176). The original estimate that fixture extraction would bring 3-4 files under 300 was overly optimistic — the files are large because of many test cases (test body), not because of duplicated fixtures (~8-45 lines per file). Reaching 300 lines would require splitting test suites into multiple files, which is a different scope.

### ECC Review Summary (2026-02-13)

- **Code Review:** 8/10 APPROVE — clean extraction, correct async vi.mock pattern, smart makeCategoryData unification
- **TDD Guide:** 9/10 APPROVE — TEA 91/100 (GOOD), all 190 tests pass, proper isolation and determinism
- **Classification:** SIMPLE (code-reviewer + tdd-guide)
- **Quick fixes applied:** 0
- **Deferred items:** 1 TD story created

### Tech Debt Stories Created

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-28](./15-TD-28-remaining-fixture-consolidation.md) | Consolidate inline makeTx/makeCategoryData in helpers.test.ts + DonutChart.test.tsx | LOW | CREATED |
| AC5 (300-line limit) | Test files large from test bodies, not fixtures — splitting is different scope | LOW | DOCUMENTED (no story needed) |
