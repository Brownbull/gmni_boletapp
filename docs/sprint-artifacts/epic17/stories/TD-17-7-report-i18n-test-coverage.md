# Tech Debt Story TD-17-7: Report i18n — Test Coverage Gaps

Status: done

> **Source:** KDBP Code Review (2026-03-10) on story TD-17-5
> **Priority:** LOW | **Estimated Effort:** 2 points

## Story
As a **developer**, I want **locale-switching test coverage for all report generation functions changed in TD-17-5**, so that **regressions in dynamic locale behavior are caught by automated tests**.

## Acceptance Criteria

- **AC-1:** `formatWeekDateRange` has en/es locale tests (e.g., "Apr" vs "Abr" for month abbreviations)
- **AC-2:** `generateMonthlyReportsForYear` locale test via `getAvailableReportsForYear('monthly')` — asserts `report.title` is English vs Spanish month name
- **AC-3:** `groupItemsByItemCategory` test with `item.category: undefined` — confirms items bucket under 'Other' fallback (not silently dropped)
- **AC-4:** No regressions (`test:quick` passes)

## Tasks

### Task 1: Locale tests for report generation (3 subtasks)
- [x] 1.1: Add `formatWeekDateRange` locale test (en/es) — 4 tests (same-month + cross-month, en + es)
- [x] 1.2: Add `getAvailableReportsForYear('monthly')` locale test (en/es) — 3 tests (title en/es + comparisonLabel)
- [x] 1.3: Add `groupItemsByItemCategory` test with undefined category — 2 tests (mixed items + solo undefined)

## Dev Notes
- Source story: [TD-17-5](./TD-17-5-report-i18n-locale-cleanup.md)
- Review findings: #7, #8
- New file created: `tests/unit/features/reports/utils/reportI18n3.test.ts` (reportI18n2 was at 404 lines, over 300-line unit test limit)
- 10 tests total, all passing (9 original + 1 added in review)

## Senior Developer Review (KDBP)
- **Date:** 2026-03-10
- **Agents:** code-reviewer (TRIVIAL classification)
- **Outcome:** APPROVE 7.5/10, 2 quick fixes applied, 0 TD stories
- **Quick fixes:** Added exact format assertion for Spanish same-month test, added Spanish comparisonLabel mirror test
<!-- CITED: none -->
