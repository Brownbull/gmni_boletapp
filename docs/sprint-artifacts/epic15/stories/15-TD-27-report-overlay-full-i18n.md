# Tech Debt Story TD-15-TD-27: ReportDetailOverlay Full i18n Migration

Status: done

> **Source:** ECC Code Review (2026-02-13) on story 15-TD-22
> **Priority:** LOW
> **Estimated Effort:** 2 points

## Story

As a **developer**,
I want **all hardcoded Spanish strings in ReportDetailOverlay.tsx migrated to `t()` calls**,
So that **the entire report detail overlay supports future localization consistently**.

## Background

After 15-TD-22 (print extraction + i18n), the print-specific strings are fully i18n-compliant. However, the remaining overlay JSX still contains hardcoded Spanish strings in aria-labels and helper sub-components (HeroCard, InsightCard, HighlightsCard, CategoryBreakdownCard). These are pre-existing and were outside the scope of TD-22's print-focused i18n migration.

## Acceptance Criteria

- [x] **AC1:** `aria-label="Descargar como PDF"` replaced with `t()` call
- [x] **AC2:** `aria-label={...transacciones, ver en historial...}` replaced with `t()` call
- [x] **AC3:** All hardcoded Spanish strings in HeroCard helper (`'de la semana'`, `'del mes'`, etc.) replaced with `t()` calls
- [x] **AC4:** All hardcoded Spanish strings in InsightCard helper (`'Insight personalizado'`) replaced with `t()` calls
- [x] **AC5:** All hardcoded Spanish strings in HighlightsCard helper replaced with `t()` calls
- [x] **AC6:** All hardcoded Spanish strings in CategoryBreakdownCard helper (`'Desglose por categoria'`, `'compra'`/`'compras'`) replaced with `t()` calls
- [x] **AC7:** Translation keys added to `src/utils/translations.ts` for all migrated strings
- [x] **AC8:** All tests pass

## Tasks

- [x] **Task 1:** Audit all hardcoded strings in ReportDetailOverlay.tsx
  - [x] Grep for quoted Spanish strings in JSX
  - [x] Catalog aria-labels, helper component text, and conditional strings
- [x] **Task 2:** Add translation keys to translations.ts
  - [x] Add keys for aria-labels (report download, transaction count)
  - [x] Add keys for all helper sub-component strings
- [x] **Task 3:** Replace hardcoded strings with t() calls
  - [x] Update aria-labels
  - [x] Update HeroCard strings
  - [x] Update InsightCard strings
  - [x] Update HighlightsCard strings
  - [x] Update CategoryBreakdownCard strings
- [x] **Task 4:** Update/add tests for i18n coverage

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/reports/components/ReportDetailOverlay.tsx` | MODIFY | Replace all remaining hardcoded Spanish strings with t() calls |
| `src/utils/translations.ts` | MODIFY | Add report-detail translation keys |
| `tests/unit/features/reports/components/ReportDetailOverlay.i18n.test.ts` | CREATE | 46 tests for translation key completeness and correctness |

## Dev Notes

- Source story: [15-TD-22](./15-TD-22-report-print-extract-i18n.md)
- Review findings: #1 (aria-labels), #2 (helper component strings)
- The `t` variable is already available in the component (added during TD-22 review)
- All strings are pre-existing, not introduced by TD-22
- Week number approximation in printUtils.ts:25-28 noted as known limitation (filename-only, not user-facing)
- Also migrated TransactionGroupsCard and ItemGroupsCard strings (not in original ACs but discovered during audit)
- Helper components receive `t` as prop from parent (avoids adding useLang() to each helper)
- 21 new translation keys added in `report*` namespace for both `en` and `es`
- Caught and fixed "Total Total..." rendering bug during self-review (periodLabel already includes "Total")

## Senior Developer Review (ECC)

- **Date:** 2026-02-13
- **Agents:** code-reviewer, tdd-guide (SIMPLE classification)
- **Outcome:** APPROVE 9/10
- **Findings:** 3 LOW (all pre-existing, 1 test improvement applied)
- **Quick fix:** Expanded `mustDiffer` test to cover all 21 keys instead of 9-key subset
- **TD stories created:** 0
