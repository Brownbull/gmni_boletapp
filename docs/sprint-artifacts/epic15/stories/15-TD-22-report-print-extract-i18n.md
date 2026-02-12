# Tech Debt Story TD-15-TD-22: Extract Print Helpers + i18n Migration

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-12) on story 15-TD-17
> **Priority:** LOW
> **Estimated Effort:** 2 points

## Story

As a **developer**,
I want **the print/PDF export logic extracted from ReportDetailOverlay into a dedicated `printUtils.ts` module with i18n-compliant strings**,
So that **ReportDetailOverlay stays under the 800-line limit and the print feature supports future localization**.

## Background

After 15-TD-17 (innerHTML sanitization), `ReportDetailOverlay.tsx` is at 835 lines — slightly over the 800-line project max. The `handlePrintReport` (115 lines) and `generatePdfFilename` (27 lines) functions are pure DOM/utility logic with no React dependencies, making them ideal extraction candidates. Additionally, the print function contains hardcoded `es-CL` locale and Spanish strings that should use the project's `translations.ts` i18n system.

## Acceptance Criteria

- [ ] **AC1:** `handlePrintReport()` and `generatePdfFilename()` extracted to `src/features/reports/utils/printUtils.ts`
- [ ] **AC2:** `ReportDetailOverlay.tsx` is under 800 lines after extraction
- [ ] **AC3:** Hardcoded `es-CL` locale in `toLocaleDateString`/`toLocaleTimeString` replaced with locale constant or `translations.ts` mechanism
- [ ] **AC4:** Hardcoded Spanish strings (`'Reporte generado automáticamente por Gastify'`, `'Este reporte es solo para uso personal.'`, `'transacción'`/`'transacciones'`, `'gastify.cl'`) replaced with `t()` calls
- [ ] **AC5:** Existing print tests (`ReportDetailOverlay.print.test.ts`) updated to import from new module path
- [ ] **AC6:** All tests pass

## Tasks

- [ ] **Task 1:** Extract print utilities to `src/features/reports/utils/printUtils.ts`
  - [ ] Move `handlePrintReport()` and `generatePdfFilename()` to new file
  - [ ] Move `MONTH_ABBR` constant
  - [ ] Update imports in `ReportDetailOverlay.tsx`
  - [ ] Add re-export from feature barrel if needed
- [ ] **Task 2:** Migrate hardcoded strings to i18n
  - [ ] Add translation keys to `src/utils/translations.ts` for print-specific strings
  - [ ] Replace hardcoded `es-CL` with locale from translations system
  - [ ] Replace all hardcoded Spanish strings with `t()` calls
- [ ] **Task 3:** Update tests
  - [ ] Update test imports to new module path
  - [ ] Verify all 11 print tests pass with new structure

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/reports/utils/printUtils.ts` | CREATE | Extracted print helper functions |
| `src/features/reports/components/ReportDetailOverlay.tsx` | MODIFY | Remove print functions, import from printUtils |
| `src/utils/translations.ts` | MODIFY | Add print-specific translation keys |
| `tests/unit/features/reports/components/ReportDetailOverlay.print.test.ts` | MODIFY | Update imports |

## Dev Notes

- Source story: [15-TD-17](./15-TD-17-report-innerhtml-sanitization.md)
- Review findings: #1 (file size), #2 (hardcoded locale), #3 (hardcoded strings)
- All 3 findings are pre-existing, not introduced by 15-TD-17
- `handlePrintReport` has zero React dependencies — pure DOM API extraction is clean
- The `testHandlePrintReport` export pattern can be simplified after extraction (direct export from utils)
