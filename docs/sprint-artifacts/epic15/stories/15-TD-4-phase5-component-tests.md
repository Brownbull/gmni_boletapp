# Story 15-TD-4: Phase 5 Component & Helper Tests

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** ready-for-dev

## Description

Write unit tests for the pure computation helpers extracted in Phase 5 and basic render tests for key extracted components. Priority is on `TrendsView/helpers.ts` (12 pure functions, 510 lines) as it has the highest test value.

## Background

Phase 5 extracted ~4,670 lines from mega-views into sub-components and helpers, but created zero test files for the extracted code. The helpers file contains 12 pure computation functions that are trivially testable and high-value. Component tests are lower priority since they're primarily rendering logic.

## Source Tech Debt Items

- **TD-3:** Missing component isolation tests: DonutChart, TrendListItem, AnimatedTreemapCell
- **TD-26:** Phase 5 extracted components/helpers missing tests: `TrendsView/helpers.ts`, DonutChart, IconCategoryFilter

## Acceptance Criteria

- [ ] **AC1:** `TrendsView/helpers.test.ts` covers all 12 exported functions with at least happy path + edge cases
- [ ] **AC2:** `categoryAggregation.test.ts` expanded to cover `buildProductKey` edge cases (empty strings, unicode)
- [ ] **AC3:** Basic render tests for DonutChart (renders without crash, handles empty data)
- [ ] **AC4:** Basic render tests for IconCategoryFilter (renders filter chips, handles selection)
- [ ] **AC5:** All new tests pass in `npm run test:quick`

## Tasks

- [ ] **Task 1:** Write `tests/unit/views/TrendsView/helpers.test.ts` (PRIORITY)
  - [ ] Test `getPeriodLabel` for all period types
  - [ ] Test `filterByPeriod` with various date ranges
  - [ ] Test `computeAllCategoryData` with mock transactions
  - [ ] Test `computeTreemapCategories` threshold grouping
  - [ ] Test `computeTrendCategories` with sparkline data
  - [ ] Test `formatShortCurrency` all formatting cases
  - [ ] Test remaining helper functions
- [ ] **Task 2:** Expand `tests/unit/utils/categoryAggregation.test.ts`
  - [ ] Add `buildProductKey` edge cases (empty name, empty merchant, unicode, whitespace)
- [ ] **Task 3:** Write basic component tests
  - [ ] `tests/unit/views/TrendsView/DonutChart.test.tsx` — renders with data, renders empty state
  - [ ] `tests/unit/features/history/components/IconCategoryFilter.test.tsx` — renders chips, handles click

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `tests/unit/views/TrendsView/helpers.test.ts` | CREATE | 12 pure function tests |
| `tests/unit/utils/categoryAggregation.test.ts` | MODIFY | Add buildProductKey edge cases |
| `tests/unit/views/TrendsView/DonutChart.test.tsx` | CREATE | Basic render tests |
| `tests/unit/features/history/components/IconCategoryFilter.test.tsx` | CREATE | Basic render tests |

## Dev Notes

- `helpers.ts` functions are pure — no mocking needed, use table-driven tests
- `formatShortCurrency` currently hardcodes `$` symbol (noted in TD findings but not blocking)
- DonutChart is 1,086 lines with 30+ props — test only basic rendering, not drill-down logic
- Use existing `tests/unit/utils/categoryAggregation.test.ts` (25 existing tests) as the base for expansion
