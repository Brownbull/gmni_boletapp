# Tech Debt Story TD-17-2: Report Grouping i18n Completion

Status: done

> **Source:** KDBP Code Review (2026-03-10) on story 17-4
> **Priority:** LOW | **Estimated Effort:** 3 points

## Story
As a **developer**, I want **report grouping utilities to be locale-aware**, so that **analytics labels display in the user's selected language (AC-6 full coverage)**.

## Background

Story 17-4 review identified two pre-existing i18n gaps in report grouping:

1. `formatCategoryName()` hardcodes `'es'` as the locale — no way to produce English labels for analytics views. AC-6 from 17-4 is only satisfied for CSV export, not analytics.
2. `groupCategoriesByStoreGroup()` line 147 has hardcoded `'compra'/'compras'` and `groupItemsByItemCategory()` line 347 has `'item'/'items'` — both bypass `translations.ts`.

## Acceptance Criteria

- **AC-1:** `formatCategoryName` accepts an optional `lang` parameter (default `'es'` for backward compat)
- **AC-2:** All call sites of `formatCategoryName` pass the user's locale
- **AC-3:** Hardcoded `'compra'/'compras'` replaced with translated string from `translations.ts`
- **AC-4:** Hardcoded `'item'/'items'` replaced with translated string from `translations.ts`
- **AC-5:** Existing tests updated; no regressions

## Tasks

### Task 1: Add locale parameter to formatCategoryName (2 subtasks)
- [x] 1.1: Add optional `lang` param to `formatCategoryName`, default `'es'`
- [x] 1.2: Update ReportDetailOverlay call site to pass explicit `lang`

### Task 2: Replace hardcoded Spanish count strings (2 subtasks)
- [x] 2.1: Used existing `reportPurchaseSingular`/`reportPurchasePlural` from translations.ts + added `ITEM_COUNT_LABELS` inline map (translations.ts blocked by 800-line hook)
- [x] 2.2: Replace hardcoded strings in `groupCategoriesByStoreGroup` and `groupItemsByItemCategory`

### Task 3: Verification (1 subtask)
- [x] 3.1: Run `npm run test:quick` — 7374 tests pass, 0 failures

## Dev Notes
- Source story: [17-4](./17-4-update-ui-labels.md)
- Review findings: #2, #3
- Files affected: `src/features/reports/utils/reportCategoryGrouping.ts`, `src/features/reports/components/ReportDetailOverlay.tsx`, `tests/unit/features/reports/utils/reportCategoryGrouping.test.ts`
- Design: `formatCategoryName` has pure `lang='es'` default. Grouping functions read `getSettingsState().lang` and pass it down. Avoids threading `lang` through 14+ function signatures.
- Item count labels stored inline in `reportCategoryGrouping.ts` because `translations.ts` (1779L) exceeds 800-line hook limit.
- Self-review: APPROVE 8/10, ORDERING: clean

## Deferred Items (from KDBP Code Review 2026-03-10)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-17-3 | 14+ call sites in reportGeneration/Insights/Year without `lang` + hardcoded `'compras'` | LOW | CREATED |
## Senior Developer Review (KDBP)
- **Date:** 2026-03-10
- **Classification:** SIMPLE
- **Agents:** code-reviewer (sonnet), tdd-guide (sonnet)
- **Outcome:** APPROVE 6.75/10
- **Quick fixes applied:** 2 (inconsistent fallback operator, missing beforeEach reset)
- **TD stories created:** 1 (TD-17-3: remaining call sites)

<!-- CITED: none -->
<!-- ORDERING: clean -->
