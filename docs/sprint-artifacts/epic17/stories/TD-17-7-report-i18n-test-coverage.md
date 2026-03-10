# Tech Debt Story TD-17-7: Report i18n — Test Coverage Gaps

Status: ready-for-dev

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
- [ ] 1.1: Add `formatWeekDateRange` locale test (en/es) to `reportI18n2.test.ts`
- [ ] 1.2: Add `getAvailableReportsForYear('monthly')` locale test (en/es) — assert `report.title` and `comparisonLabel` use correct language
- [ ] 1.3: Add `groupItemsByItemCategory` test with undefined category — assert item appears in result under 'Other' group

## Dev Notes
- Source story: [TD-17-5](./TD-17-5-report-i18n-locale-cleanup.md)
- Review findings: #7, #8
- Files affected: `tests/unit/features/reports/utils/reportI18n2.test.ts` (or new test file if size limit reached)
