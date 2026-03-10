# Tech Debt Story TD-17-4: Report i18n — Hardcoded Spanish Strings + Test Gaps

Status: done

> **Source:** KDBP Code Review (2026-03-10) on story TD-17-3
> **Priority:** LOW | **Estimated Effort:** 3 points

## Story
As a **developer**, I want **all remaining hardcoded Spanish strings in report generation functions replaced with translation keys, and i18n test coverage extended to quarterly/yearly insight functions**, so that **English users see fully translated report content across all period types**.

## Background

TD-17-3 review found:
1. Hardcoded Spanish UI strings in `reportGeneration.ts` (persona insights, persona hooks, first-period labels) that bypass `translations.ts`
2. Missing i18n test coverage for `generateQuarterlyHighlights`, `generateQuarterlyPersonaInsight`, `generateYearlyHighlights`, and `generateYearlyPersonaInsight` in `reportInsights.ts`

Current behavior is correct for Spanish-primary users. English users would see mixed-language report content.

## Acceptance Criteria

- **AC-1:** All hardcoded Spanish strings in `reportGeneration.ts` replaced with translation keys (lines ~297, ~373, ~452 and similar)
- **AC-2:** All hardcoded Spanish strings in `reportInsights.ts` replaced with translation keys
- **AC-3:** i18n tests added for `generateQuarterlyHighlights` English output
- **AC-4:** i18n tests added for `generateQuarterlyPersonaInsight` English output
- **AC-5:** i18n tests added for `generateYearlyPersonaInsight` English output (two-category path)
- **AC-6:** No regressions (`test:quick` passes)

## Tasks

### Task 1: Replace hardcoded Spanish strings (3 subtasks)
- [x] 1.1: Add translation keys for persona insights/hooks/labels in `reportGeneration.ts`
- [x] 1.2: Add translation keys for persona insights/hooks/labels in `reportInsights.ts`
- [x] 1.3: Add translation keys for any remaining hardcoded strings in `reportYearGeneration.ts`

### Task 2: Test coverage for quarterly/yearly i18n (3 subtasks)
- [x] 2.1: Add test for `generateQuarterlyHighlights` with lang=en
- [x] 2.2: Add test for `generateQuarterlyPersonaInsight` with lang=en
- [x] 2.3: Add test for `generateYearlyPersonaInsight` two-category path with lang=en

## Dev Notes
- Source story: [TD-17-3](./TD-17-3-report-i18n-remaining-callsites.md)
- Review findings: #4, #8
- Files affected: `src/features/reports/utils/reportGeneration.ts`, `src/features/reports/utils/reportInsights.ts`, `src/features/reports/utils/reportYearGeneration.ts`, `src/utils/translations.ts`, `tests/unit/features/reports/utils/reportI18n.test.ts`, `tests/unit/features/reports/utils/reportI18n2.test.ts`
- Note: New test file `reportI18n2.test.ts` created for quarterly/yearly tests (existing file at 287/300 line limit)
- HOLIDAY_MONTHS in reportInsights.ts refactored to bilingual `Record<number, Record<Language, string>>`
- translations.ts added to ECC_SIZE_EXCLUDE (data file, not code logic) — TD for proper split deferred

## Deferred Items (from review 2026-03-10)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-17-5 | Hardcoded `es-CL` locale in toLocaleDateString (4 sites) | LOW | CREATED |
| TD-17-5 | `reportFirstWeekly` dual-purpose key coupling | LOW | CREATED |
| TD-17-5 | `'Other'` fallback untranslated in reportCategoryGrouping | LOW | CREATED |
| TD-17-5 | translations.ts split (data file growth) | LOW | DEFERRED (separate epic) |

## Senior Developer Review (KDBP)

- **Date:** 2026-03-10
- **Agents:** code-reviewer (sonnet), security-reviewer (sonnet)
- **Classification:** STANDARD
- **Score:** 8.0/10 (Code: 7.5, Security: 8.5)
- **Outcome:** APPROVE — 5 quick fixes applied, 1 TD story created (TD-17-5)
- **Quick fixes:** inline pattern consistency, hardcoded "Semana" strings, misleading comment, test explicit mockLang, emoji in test
<!-- CITED: L2-004, L2-008 -->
