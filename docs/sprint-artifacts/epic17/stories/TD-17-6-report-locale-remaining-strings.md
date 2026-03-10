# Tech Debt Story TD-17-6: Report i18n — Remaining Hardcoded Locale Strings

Status: done

> **Source:** KDBP Code Review (2026-03-10) on story TD-17-5
> **Priority:** LOW | **Estimated Effort:** 1 point

## Story
As a **developer**, I want **remaining hardcoded locale strings in report generation replaced with dynamic locale-aware values**, so that **English-mode users see consistent abbreviations (e.g., "W1" not "S1", "Dec" not "Dic")**.

## Acceptance Criteria

- **AC-1:** `comparisonLabel` week prefix uses locale-aware abbreviation (`S` for es, `W` for en) in `reportYearGeneration.ts`
- **AC-2:** `comparisonLabel` December abbreviation `"Dic"` uses `toLocaleDateString(locale, { month: 'short' })` instead of hardcoded string
- **AC-3:** No regressions (`test:quick` passes)

## Tasks

### Task 1: Locale-aware week and month abbreviations (2 subtasks)
- [x] 1.1: Replace `S` prefix in `reportYearGeneration.ts:144,147` with translation key or locale-derived abbreviation
- [x] 1.2: Replace hardcoded `"Dic"` in `reportYearGeneration.ts:284` with `toLocaleDateString(locale, { month: 'short' })` for December of previous year

## Senior Developer Review (KDBP)

- **Date:** 2026-03-10
- **Classification:** TRIVIAL
- **Agents:** code-reviewer (sonnet)
- **Score:** 8.5/10 → APPROVE
- **Quick fixes:** Quarterly loop `lang`/`t` hoisting (#1), cross-year test assertion strengthening (#4). Finding #3 (es-CL trailing period) dismissed as false positive — all short months have periods in es-CL locale.
- **TD stories:** 0 (deferred items #2 DRY capitalize and #5 LANG_LOCALE coupling are pre-existing, not regressions)

<!-- CITED: L2-004 (DRY), L2-008 (i18n completeness) -->

## Dev Notes
- Source story: [TD-17-5](./TD-17-5-report-i18n-locale-cleanup.md)
- Review findings: #4, pre-existing TODO
- Files affected: `src/features/reports/utils/reportYearGeneration.ts`
