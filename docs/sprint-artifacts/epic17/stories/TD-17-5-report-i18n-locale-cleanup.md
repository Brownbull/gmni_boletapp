# Tech Debt Story TD-17-5: Report i18n — Locale Cleanup & Minor Gaps

Status: ready-for-dev

> **Source:** KDBP Code Review (2026-03-10) on story TD-17-4
> **Priority:** LOW | **Estimated Effort:** 2 points

## Story
As a **developer**, I want **remaining locale hardcoding and minor i18n gaps in report generation cleaned up**, so that **English-mode users see fully consistent translated output without mixed-language artifacts**.

## Background

TD-17-4 review found 3 deferred items plus 1 pre-existing deferral:
1. `toLocaleDateString('es-CL', { month: 'long' })` is hardcoded in 4 locations — English users see Spanish month names inside English labels (e.g., "Highest month · Abril · $15,000")
2. `reportFirstWeekly` key serves dual purpose (secondaryValue + firstLabel) — implicit coupling
3. `item.category` defaults to `'Other'` string literal (untranslated) in `reportCategoryGrouping.ts`
4. `translations.ts` is a growing data file (800+ lines) — eventual split deferred from TD-17-4

## Acceptance Criteria

- **AC-1:** `toLocaleDateString` calls in `reportInsights.ts` and `reportYearGeneration.ts` use dynamic locale based on `lang` (e.g., `'en-US'` for en, `'es-CL'` for es)
- **AC-2:** `reportFirstWeekly` split into `reportFirstWeeklySecondary` and `reportFirstWeeklyLabel` (or documented why dual-use is intentional)
- **AC-3:** `'Other'` fallback in `reportCategoryGrouping.ts` uses a translation key
- **AC-4:** No regressions (`test:quick` passes)

## Tasks

### Task 1: Dynamic locale for month names (2 subtasks)
- [ ] 1.1: Add locale mapping (`Language → locale string`) and use in `reportInsights.ts:260-261,392-393`
- [ ] 1.2: Use same mapping in `reportYearGeneration.ts:161,287`

### Task 2: Minor i18n gaps (2 subtasks)
- [ ] 2.1: Split or document `reportFirstWeekly` dual-purpose key
- [ ] 2.2: Replace `'Other'` fallback with translation key in `reportCategoryGrouping.ts`

## Dev Notes
- Source story: [TD-17-4](./TD-17-4-report-i18n-hardcoded-strings.md)
- Review findings: #3, #5, #6
- Files affected: `src/features/reports/utils/reportInsights.ts`, `src/features/reports/utils/reportYearGeneration.ts`, `src/features/reports/utils/reportCategoryGrouping.ts`, `src/utils/translations.ts`
- translations.ts split deferred to separate epic (file is data, not logic — excluded from size hooks)
