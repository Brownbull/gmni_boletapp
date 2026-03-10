# Tech Debt Story TD-17-3: Report i18n — Remaining Call Sites

Status: done

> **Source:** KDBP Code Review (2026-03-10) on story TD-17-2
> **Priority:** LOW | **Estimated Effort:** 5 points

## Story
As a **developer**, I want **all report utility call sites to pass the user's locale to `formatCategoryName`**, so that **English users see English category names in insights, generation, and year reports (AC-2 full coverage)**.

## Background

TD-17-2 review found 14+ call sites in `reportGeneration.ts`, `reportInsights.ts`, and `reportYearGeneration.ts` that still call `formatCategoryName` without a `lang` argument — defaulting to `'es'`. Additionally, `reportInsights.ts:218` has a residual hardcoded `'compras'` string that bypasses `translations.ts`.

Current behavior is correct for Spanish-primary users (the default). English users would see Spanish category names in insight text and generated report labels.

## Acceptance Criteria

- **AC-1:** All `formatCategoryName` call sites in `reportGeneration.ts` pass explicit `lang` parameter
- **AC-2:** All `formatCategoryName` call sites in `reportInsights.ts` pass explicit `lang` parameter
- **AC-3:** All `formatCategoryName` call sites in `reportYearGeneration.ts` pass explicit `lang` parameter
- **AC-4:** Hardcoded `'compras'` in `reportInsights.ts:218` replaced with translated string
- **AC-5:** Tests added for English output from at least one generation and one insights function
- **AC-6:** No regressions (`test:quick` passes)

## Tasks

### Task 1: Thread `lang` through report generation (3 subtasks)
- [x] 1.1: Add `lang` parameter or read `getSettingsState().lang` in `reportGeneration.ts` generation functions
- [x] 1.2: Update all `formatCategoryName` calls in `reportGeneration.ts` to pass `lang`
- [x] 1.3: Update all `formatCategoryName` calls in `reportYearGeneration.ts` to pass `lang`

### Task 2: Thread `lang` through report insights (2 subtasks)
- [x] 2.1: Update all `formatCategoryName` calls in `reportInsights.ts` to pass `lang`
- [x] 2.2: Replace hardcoded `'compras'` at line 218 with `t.reportPurchasePlural`

### Task 3: Test coverage (2 subtasks)
- [x] 3.1: Add test for English output from a `reportGeneration.ts` function
- [x] 3.2: Add test for English output from a `reportInsights.ts` function

## Dev Notes
- Source story: [TD-17-2](./TD-17-2-report-grouping-i18n.md)
- Review findings: #1, #5, #8, #9
- Files affected: `src/features/reports/utils/reportGeneration.ts`, `src/features/reports/utils/reportInsights.ts`, `src/features/reports/utils/reportYearGeneration.ts`
- Design decision: Either accept `lang` as a parameter (cleaner) or use `getSettingsState().lang` (matches TD-17-2 pattern). Prefer parameter injection if signatures allow.
- Architectural notes from TD-17-2 review (not actionable here):
  - `getSettingsState().lang` in pure functions couples them to Zustand singleton (#3)
  - `ITEM_COUNT_LABELS` inline map is a second source of locale strings (#4)
  - No compile-time narrowing for `lang` key in TRANSLATIONS access (#6)

## Review Deferred Items

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-17-4 | Hardcoded Spanish strings + quarterly/yearly i18n test gaps | LOW | CREATED |

## Senior Developer Review (KDBP)
- **Date:** 2026-03-10
- **Classification:** SIMPLE
- **Agents:** code-reviewer (8/10), tdd-guide (4/10 → improved)
- **Overall:** APPROVE 6.75/10 → improved after 6 quick fixes
- **Quick fixes:** 6 (vi.resetModules, comment clarity, 2 new AC tests)
- **TD stories:** 1 (TD-17-4: hardcoded strings + test gaps)
- **Tests:** 7383 pass, 0 failures

<!-- CITED: none -->
