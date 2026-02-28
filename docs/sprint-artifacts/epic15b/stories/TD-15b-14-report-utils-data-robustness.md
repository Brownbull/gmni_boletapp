# Tech Debt Story TD-15b-14: Report Utilities Data Robustness

Status: done

> **Source:** ECC Code Review (2026-02-24) on story 15b-2e
> **Priority:** LOW | **Estimated Effort:** 2 points

## Story
As a **developer**, I want **report utility functions to handle malformed transaction dates and edge-case math gracefully**, so that **silent data exclusion and Infinity propagation are prevented in financial reports**.

## Acceptance Criteria

- [x] **AC1:** `parseDate` validates input format and handles malformed dates explicitly (log warning + return sentinel or throw)
- [x] **AC2:** `filterTransactionsBySpecificYear` uses `parseDate` consistently (already done in 15b-2e quick fix)
- [x] **AC3:** Trend reverse-calculation in `groupCategoriesByStoreGroup` and `groupItemsByItemCategory` guards against near-zero multiplier (clamp `trendPercent` to max 99% or skip when `multiplier < 0.01`)
- [x] **AC4:** No `Infinity` or `NaN` values propagate to UI-facing report objects
- [x] **AC5:** All existing report utils tests pass after changes

## Tasks / Subtasks

### Task 1: Harden parseDate
- [x] 1.1 Add regex guard `^\d{4}-\d{2}-\d{2}$` to `parseDate` in `reportDateUtils.ts`
- [x] 1.2 Decide on failure behavior: return `new Date(NaN)` with logged warning (chosen over throw — keeps function pure, callers naturally exclude via comparison)
- [x] 1.3 Add unit tests for malformed date inputs (5 tests: malformed, empty, partial, extra chars, valid-no-warn)

### Task 2: Fix trendPercent reverse-calculation
- [x] 2.1 In `reportCategoryGrouping.ts`, guard `groupCategoriesByStoreGroup` multiplier: skip when `< 0.01`
- [x] 2.2 In `reportCategoryGrouping.ts`, guard `groupItemsByItemCategory` multiplier: skip when `< 0.01`
- [x] 2.3 Add unit tests for edge-case trend percentages (99%, 100%, near-zero) — 5 tests in reportCategoryGrouping.test.ts

### Task 3: Verify and test
- [x] 3.1 Run `npm run test:quick` — all 150 report tests pass, tsc clean
- [x] 3.2 Verify no `Infinity`/`NaN` in report output with edge-case data (covered by tests)

## Dev Notes
- Source story: [15b-2e](./15b-2e-decompose-report-utils.md)
- Review findings: #1 (parseDate silent failure), #2 (trendPercent overflow)
- Files affected: `src/features/reports/utils/reportDateUtils.ts`, `src/features/reports/utils/reportCategoryGrouping.ts`
- Both issues are pre-existing from the original `reportUtils.ts` monolith, surfaced during decomposition review

## Senior Developer Review (ECC)
| Field | Value |
|-------|-------|
| Date | 2026-02-24 |
| Classification | SIMPLE |
| Agents | code-reviewer, tdd-guide |
| Code Quality | 8/10 APPROVE |
| Testing | 6/10 → 8/10 after fixes |
| Overall | 7/10 → APPROVE |
| Quick Fixes | 3 (boundary test multiplier=0.01, trendPercent=0 test, item multiplier skip test) |
| Deferred Items | 6 (all LOW/MEDIUM, pre-existing, accepted risk — no new TD stories) |
| Tests | 51/51 pass, tsc clean |
