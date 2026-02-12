# Tech Debt Story 15-TD-21: Test Coverage for TD-16 Extracted Helpers

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-12) on story 15-TD-16
> **Priority:** HIGH
> **Estimated Effort:** 3 pts

## Story

As a **developer**,
I want **unit tests for the 6 pure helper modules extracted in TD-16**,
So that **1,568 lines of computation logic have regression protection during future refactoring**.

## Background

15-TD-16 extracted 10 files from TrendsView.tsx and DashboardView.tsx. The 4 component files are rendering wrappers (low test value), but the 6 helper files contain pure computation functions that are trivially testable and high-value. These helpers compute chart data, navigation payloads, period comparisons, and category aggregations — all critical for data accuracy.

## Acceptance Criteria

- [ ] **AC1:** `periodComparisonHelpers.test.ts` covers `computePreviousPeriodTotals` and `computeDailySparkline` (273 lines)
- [ ] **AC2:** `navigationHelpers.test.ts` covers all 5 exported functions (310 lines)
- [ ] **AC3:** `categoryDataHelpers.test.ts` covers all 4 `compute*Data` functions (292 lines)
- [ ] **AC4:** `chartDataHelpers.test.ts` covers `computeRadarChartData` and `computeBumpChartData` (462 lines)
- [ ] **AC5:** `periodNavigationHelpers.test.ts` covers 4 period state functions (146 lines)
- [ ] **AC6:** `drillDownHelpers.test.ts` covers `resolveDrillDownCategories` (86 lines)
- [ ] **AC7:** All tests pass with `npm run test:quick`

## Tasks

- [ ] **Task 1:** Write TrendsView helper tests
  - [ ] `tests/unit/views/TrendsView/periodComparisonHelpers.test.ts`
  - [ ] `tests/unit/views/TrendsView/navigationHelpers.test.ts`
  - [ ] `tests/unit/views/TrendsView/drillDownHelpers.test.ts`
  - [ ] `tests/unit/views/TrendsView/periodNavigationHelpers.test.ts`
- [ ] **Task 2:** Write DashboardView helper tests
  - [ ] `tests/unit/views/DashboardView/categoryDataHelpers.test.ts`
  - [ ] `tests/unit/views/DashboardView/chartDataHelpers.test.ts`

## Dev Notes

- Source story: [15-TD-16](./15-TD-16-mega-view-decomposition-5c.md)
- Review finding: #1 (HIGH — 1,568 lines of pure computation with zero test coverage)
- All functions are pure — no React or Firebase mocking needed, use table-driven tests
- `aggregationHelpers.ts` is partially tested by TD-4 tests; the new +95 lines for `computeItemGroupsData` should be included
- Pre-existing bug noted in `periodComparisonHelpers.ts:135-136,155-156`: `String.includes()` used where intent is array membership check on `STORE_CATEGORY_GROUPS` / `ITEM_CATEGORY_GROUPS` values — works by accident because category names aren't substrings of group names. Tests should document current behavior and a future fix story can correct the logic.

## File Specification

| File | Action | Purpose |
|------|--------|---------|
| `tests/unit/views/TrendsView/periodComparisonHelpers.test.ts` | CREATE | Period comparison function tests |
| `tests/unit/views/TrendsView/navigationHelpers.test.ts` | CREATE | Navigation payload builder tests |
| `tests/unit/views/TrendsView/drillDownHelpers.test.ts` | CREATE | Drill-down resolution tests |
| `tests/unit/views/TrendsView/periodNavigationHelpers.test.ts` | CREATE | Period state navigation tests |
| `tests/unit/views/DashboardView/categoryDataHelpers.test.ts` | CREATE | Category aggregation tests |
| `tests/unit/views/DashboardView/chartDataHelpers.test.ts` | CREATE | Radar + bump chart computation tests |
