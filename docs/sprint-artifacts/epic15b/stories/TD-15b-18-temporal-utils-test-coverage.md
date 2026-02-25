# Tech Debt Story TD-15b-18: Temporal Utils Test Coverage

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-25) on story TD-15b-17
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **unit tests for temporalFormatters.ts and temporalFilterBuilders.ts**, so that **refactored temporal utils have direct test coverage instead of relying solely on barrel re-exports**.

## Acceptance Criteria

- [ ] AC1: `temporalFormatters.test.ts` covers all 6 branch paths of `formatTemporalRange` (all, year, quarter, month, week, day) for both locales (en, es)
- [ ] AC2: `temporalFilterBuilders.test.ts` covers `buildCascadingTemporalFilter` for all 5 levels plus fallback, and all 5 convenience wrappers
- [ ] AC3: All tests pass with `npm run test:quick`

## Tasks / Subtasks

### Task 1: Add temporalFormatters tests

- [ ] 1.1 Create `tests/unit/shared/utils/temporalFormatters.test.ts`
- [ ] 1.2 Test `formatTemporalRange` for level=all (en + es)
- [ ] 1.3 Test year, quarter, month, week, day paths with both locales
- [ ] 1.4 Test edge cases: missing optional fields, undefined week

### Task 2: Add temporalFilterBuilders tests

- [ ] 2.1 Create `tests/unit/shared/utils/temporalFilterBuilders.test.ts`
- [ ] 2.2 Test `buildCascadingTemporalFilter` for each level (year, quarter, month, week, day)
- [ ] 2.3 Test cascading defaults (e.g., month level without quarter provided)
- [ ] 2.4 Test convenience wrappers: buildYearFilter, buildQuarterFilter, buildMonthFilter, buildWeekFilter, buildDayFilter
- [ ] 2.5 Test fallback branch (invalid level)

## Dev Notes
- Source story: [TD-15b-17](./TD-15b-17-history-filter-utils-polish.md)
- Review findings: #1 (temporalFormatters 0% coverage), #2 (temporalFilterBuilders 0% coverage)
- Files affected: `tests/unit/shared/utils/temporalFormatters.test.ts`, `tests/unit/shared/utils/temporalFilterBuilders.test.ts`
- These are pre-existing coverage gaps from story 15b-2k extraction, not regressions from TD-15b-17
- The date.ts overlap (getQuarterFromMonth etc.) is a separate, larger effort — not included here
