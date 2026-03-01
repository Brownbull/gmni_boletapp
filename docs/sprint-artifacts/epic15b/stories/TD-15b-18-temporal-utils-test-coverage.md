# Tech Debt Story TD-15b-18: Temporal Utils Test Coverage

Status: done

> **Source:** ECC Code Review (2026-02-25) on story TD-15b-17
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story
As a **developer**, I want **unit tests for temporalFormatters.ts and temporalFilterBuilders.ts**, so that **refactored temporal utils have direct test coverage instead of relying solely on barrel re-exports**.

## Acceptance Criteria

- [x] AC1: `temporalFormatters.test.ts` covers all 6 branch paths of `formatTemporalRange` (all, year, quarter, month, week, day) for both locales (en, es)
- [x] AC2: `temporalFilterBuilders.test.ts` covers `buildCascadingTemporalFilter` for all 5 levels plus fallback, and all 5 convenience wrappers
- [x] AC3: All tests pass with `npm run test:quick`

## Tasks / Subtasks

### Task 1: Add temporalFormatters tests

- [x] 1.1 Create `tests/unit/shared/utils/temporalFormatters.test.ts`
- [x] 1.2 Test `formatTemporalRange` for level=all (en + es)
- [x] 1.3 Test year, quarter, month, week, day paths with both locales
- [x] 1.4 Test edge cases: missing optional fields, undefined week

### Task 2: Add temporalFilterBuilders tests

- [x] 2.1 Create `tests/unit/shared/utils/temporalFilterBuilders.test.ts`
- [x] 2.2 Test `buildCascadingTemporalFilter` for each level (year, quarter, month, week, day)
- [x] 2.3 Test cascading defaults (e.g., month level without quarter provided)
- [x] 2.4 Test convenience wrappers: buildYearFilter, buildQuarterFilter, buildMonthFilter, buildWeekFilter, buildDayFilter
- [x] 2.5 Test fallback branch (invalid level)

## Dev Notes
- Source story: [TD-15b-17](./TD-15b-17-history-filter-utils-polish.md)
- Review findings: #1 (temporalFormatters 0% coverage), #2 (temporalFilterBuilders 0% coverage)
- Files affected: `tests/unit/shared/utils/temporalFormatters.test.ts`, `tests/unit/shared/utils/temporalFilterBuilders.test.ts`
- These are pre-existing coverage gaps from story 15b-2k extraction, not regressions from TD-15b-17
- The date.ts overlap (getQuarterFromMonth etc.) is a separate, larger effort — not included here
- **Dev session 2026-02-25:** 16 tests (formatters) + 25 tests (builders) = 41 tests, all passing. Self-review APPROVE 8.3/10, fixed position-weak day assertions and added week/day clamping path tests.

## Senior Developer Review (ECC)
- **Date:** 2026-02-25
- **Classification:** SIMPLE | **Agents:** code-reviewer, tdd-guide
- **Outcome:** APPROVE 8.5/10
- **Quick fixes applied (4):** added `vi.resetAllMocks()` to both files, tightened month assertions (removed `toLowerCase()`), replaced fragile `.split().at(-1)` day assertions with full breadcrumb `toBe`, added Q3/Q4 boundary tests for convenience wrappers
- **Deferred observations (2, LOW):** `getFirstDayOfWeek` has no bounds validation for week values outside 1-5 (produces invalid dates silently); formula `(w-1)*7+1` is calendar-naive (not ISO week boundaries). Both are source-level limitations, not test gaps.
- **Final test count:** 43 tests (16 formatters + 27 builders), all passing
