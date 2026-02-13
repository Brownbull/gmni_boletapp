# Tech Debt Story 15-TD-21: Test Coverage for TD-16 Extracted Helpers

Status: done

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

- [x] **AC1:** `periodComparisonHelpers.test.ts` covers `computePreviousPeriodTotals` and `computeDailySparkline` (273 lines)
- [x] **AC2:** `navigationHelpers.test.ts` covers all 5 exported functions (310 lines)
- [x] **AC3:** `categoryDataHelpers.test.ts` covers all 4 `compute*Data` functions (292 lines)
- [x] **AC4:** `chartDataHelpers.test.ts` covers `computeRadarChartData` and `computeBumpChartData` (462 lines)
- [x] **AC5:** `periodNavigationHelpers.test.ts` covers 4 period state functions (146 lines)
- [x] **AC6:** `drillDownHelpers.test.ts` covers `resolveDrillDownCategories` (86 lines)
- [x] **AC7:** All tests pass with `npm run test:quick`

## Tasks

- [x] **Task 1:** Write TrendsView helper tests
  - [x] `tests/unit/views/TrendsView/periodComparisonHelpers.test.ts`
  - [x] `tests/unit/views/TrendsView/navigationHelpers.test.ts`
  - [x] `tests/unit/views/TrendsView/drillDownHelpers.test.ts`
  - [x] `tests/unit/views/TrendsView/periodNavigationHelpers.test.ts`
- [x] **Task 2:** Write DashboardView helper tests
  - [x] `tests/unit/views/DashboardView/categoryDataHelpers.test.ts`
  - [x] `tests/unit/views/DashboardView/chartDataHelpers.test.ts`

## Dev Notes

- Source story: [15-TD-16](./15-TD-16-mega-view-decomposition-5c.md)
- Review finding: #1 (HIGH — 1,568 lines of pure computation with zero test coverage)
- All functions are pure — no React or Firebase mocking needed, use table-driven tests
- `aggregationHelpers.ts` is partially tested by TD-4 tests; the new +95 lines for `computeItemGroupsData` should be included
- Pre-existing bug noted in `periodComparisonHelpers.ts:135-136,155-156`: `String.includes()` used where intent is array membership check on `STORE_CATEGORY_GROUPS` / `ITEM_CATEGORY_GROUPS` values — works by accident because category names aren't substrings of group names. Tests should document current behavior and a future fix story can correct the logic.

## Senior Developer Review (ECC)

- **Review date:** 2026-02-13
- **Classification:** STANDARD
- **ECC agents used:** code-reviewer (7/10), security-reviewer (10/10)
- **Overall score:** 8.5/10
- **Outcome:** APPROVED with deferred items
- **Quick fixes applied:** 2 (comment clarity, conditional assertion → deterministic)
- **TD stories created:** 2 (15-TD-25 shared fixtures, 15-TD-26 includes fix)

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-25](./15-TD-25-shared-test-fixtures.md) | Extract shared test fixtures (makeTx, makeCategoryData, categoryColors) to reduce file sizes below 300-line limit | MEDIUM | CREATED |
| [15-TD-26](./15-TD-26-period-comparison-includes-fix.md) | Fix String.includes() → Array.includes() in periodComparisonHelpers (pre-existing from TD-16) | LOW | CREATED |

## File Specification

| File | Action | Purpose |
|------|--------|---------|
| `tests/unit/views/TrendsView/periodComparisonHelpers.test.ts` | CREATE | Period comparison function tests |
| `tests/unit/views/TrendsView/navigationHelpers.test.ts` | CREATE | Navigation payload builder tests |
| `tests/unit/views/TrendsView/drillDownHelpers.test.ts` | CREATE | Drill-down resolution tests |
| `tests/unit/views/TrendsView/periodNavigationHelpers.test.ts` | CREATE | Period state navigation tests |
| `tests/unit/views/DashboardView/categoryDataHelpers.test.ts` | CREATE | Category aggregation tests |
| `tests/unit/views/DashboardView/chartDataHelpers.test.ts` | CREATE | Radar + bump chart computation tests |
