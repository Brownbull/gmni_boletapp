# Tech Debt Story TD-17-2: Report Grouping i18n Completion

Status: ready-for-dev

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
- [ ] 1.1: Add optional `lang` param to `formatCategoryName`, default `'es'`
- [ ] 1.2: Update all call sites to pass locale from user context

### Task 2: Replace hardcoded Spanish count strings (2 subtasks)
- [ ] 2.1: Add `'compra'/'compras'` and `'item'/'items'` keys to `translations.ts`
- [ ] 2.2: Replace hardcoded strings in `groupCategoriesByStoreGroup` and `groupItemsByItemCategory`

### Task 3: Verification (1 subtask)
- [ ] 3.1: Run `npm run test:quick` — all tests pass

## Dev Notes
- Source story: [17-4](./17-4-update-ui-labels.md)
- Review findings: #2, #3
- Files affected: `src/features/reports/utils/reportCategoryGrouping.ts`, `src/utils/translations.ts`
