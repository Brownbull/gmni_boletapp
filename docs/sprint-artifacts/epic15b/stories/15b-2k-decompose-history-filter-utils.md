# Story 15b-2k: Decompose historyFilterUtils.ts

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Overview

Decompose `src/shared/utils/historyFilterUtils.ts` (1,076 lines) into 2 smaller extracted files. The file contains 28 exported functions spanning 7 functional domains: filter data extraction, temporal date helpers, filter predicates, the main filter orchestrator, display formatting, temporal period navigation, and cascading temporal filter builders. The extraction targets are the temporal navigation functions (~262 lines) and the cascading temporal builder functions (~136 lines), totaling ~398 lines extracted. This brings the file from 1,076 to ~678 lines (well under the 800-line limit). This is a PURE DECOMPOSITION -- no new features, no behavior changes.

**Note:** Original draft assumed file location was `src/features/history/utils/` -- the actual location is `src/shared/utils/` (this is a shared utility, not a feature-scoped one).

## Functional Acceptance Criteria

- [ ] **AC1:** historyFilterUtils.ts reduced to <800 lines (from 1,076)
- [ ] **AC2:** Each extracted file is <400 lines
- [ ] **AC3:** Behavior snapshot: all existing tests pass before AND after extraction (including `tests/unit/utils/temporalNavigation.test.ts`, `tests/unit/utils/historyFilterUtils.drillDown.test.ts`, `tests/unit/utils/historyFilterUtils.location.test.ts`)
- [ ] **AC4:** No new functionality added -- pure decomposition
- [ ] **AC5:** `npm run test:quick` passes with 0 failures
- [ ] **AC6:** All 15 source consumers and 3 test consumers resolve imports correctly after extraction

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Temporal navigation at `src/shared/utils/temporalNavigation.ts`
- [ ] **AC-ARCH-LOC-2:** Cascading temporal builders at `src/shared/utils/temporalFilterBuilders.ts`
- [ ] **AC-ARCH-LOC-3:** Residual historyFilterUtils.ts stays at `src/shared/utils/historyFilterUtils.ts` (no file move)

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** Both extracted files are pure TypeScript -- no React imports, no side effects
- [ ] **AC-ARCH-PATTERN-2:** `historyFilterUtils.ts` re-exports everything from the two extracted files via `export * from './temporalNavigation'` and `export * from './temporalFilterBuilders'` -- all existing consumer imports remain valid without modification
- [ ] **AC-ARCH-PATTERN-3:** `temporalNavigation.ts` imports `formatTemporalRange` from `./historyFilterUtils` for the `getNextPeriodLabel` and `getPrevPeriodLabel` functions
- [ ] **AC-ARCH-PATTERN-4:** `temporalFilterBuilders.ts` is fully self-contained -- its internal helpers inline the quarter calculation rather than importing `getQuarterFromMonth` (avoids circular dependency)
- [ ] **AC-ARCH-PATTERN-5:** `src/shared/utils/index.ts` barrel is NOT modified -- it already does `export * from './historyFilterUtils'` which transitively re-exports the extracted functions

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No circular dependency -- extracted files may import from `./historyFilterUtils` but `historyFilterUtils.ts` must NOT import from them (only re-exports via `export *`)
- [ ] **AC-ARCH-NO-2:** No consumer import path changes -- all 15 source files and 3 test files keep their existing `from '@shared/utils/historyFilterUtils'` imports unchanged
- [ ] **AC-ARCH-NO-3:** No new `console.log` statements
- [ ] **AC-ARCH-NO-4:** No `: any` types in extracted files
- [ ] **AC-ARCH-NO-5:** No deduplication with `src/utils/date.ts` -- function overlap is noted but out of scope (signature differences prevent safe deduplication without consumer changes)

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| historyFilterUtils.ts | `src/shared/utils/historyFilterUtils.ts` | Remove ~398 lines (temporal navigation + cascading builders); add 2 re-export lines; reduce from 1,076 to ~680 lines |

### New Files

| File | Exact Path | Pattern | Est. Lines |
|------|------------|---------|------------|
| temporalNavigation.ts | `src/shared/utils/temporalNavigation.ts` | Pure TS functions | ~270 |
| temporalFilterBuilders.ts | `src/shared/utils/temporalFilterBuilders.ts` | Pure TS functions | ~140 |

### Unchanged Files (verified, not modified)

| File | Exact Path | Reason |
|------|------------|--------|
| shared utils barrel | `src/shared/utils/index.ts` | Already re-exports via `export * from './historyFilterUtils'` -- transitive re-exports work |
| drillDown test | `tests/unit/utils/historyFilterUtils.drillDown.test.ts` | Imports `filterTransactionsByHistoryFilters` -- stays in residual file |
| location test | `tests/unit/utils/historyFilterUtils.location.test.ts` | Imports `filterTransactionsByHistoryFilters` -- stays in residual file |
| temporal nav test | `tests/unit/utils/temporalNavigation.test.ts` | Imports from `@shared/utils/historyFilterUtils` -- re-export keeps this working |
| HistoryView.tsx | `src/features/history/views/HistoryView.tsx` | Imports `extractAvailableFilters`, `filterTransactionsByHistoryFilters` -- stay in residual |
| TrendsView.tsx | `src/features/analytics/views/TrendsView/TrendsView.tsx` | Imports `buildYearFilter` etc. -- re-exported from residual |
| useHistoryFilters.ts | `src/shared/hooks/useHistoryFilters.ts` | Imports `getNextTemporalPeriod`, `getPrevTemporalPeriod` -- re-exported from residual |
| TemporalBreadcrumb.tsx | `src/features/history/components/TemporalBreadcrumb.tsx` | Imports `buildYearFilter` etc. -- re-exported from residual |
| 7 type-only consumers | Various `*FilterDropdown.tsx`, `*FilterBar.tsx`, `*FullListView.tsx` | Import only `AvailableFilters` type -- stays in residual |

## Tasks / Subtasks

### Task 1: Establish baseline

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 Run `npx vitest run tests/unit/utils/temporalNavigation.test.ts` and confirm passes
- [ ] 1.3 Run `npx vitest run tests/unit/utils/historyFilterUtils.drillDown.test.ts` and confirm passes
- [ ] 1.4 Run `npx vitest run tests/unit/utils/historyFilterUtils.location.test.ts` and confirm passes
- [ ] 1.5 Count current lines: `wc -l src/shared/utils/historyFilterUtils.ts` (expect ~1,076)

### Task 2: Extract temporal navigation functions into temporalNavigation.ts

- [ ] 2.1 Create `src/shared/utils/temporalNavigation.ts`
- [ ] 2.2 Add imports: `import type { TemporalFilterState } from '@/types/historyFilters'` and `import { formatTemporalRange } from './historyFilterUtils'`
- [ ] 2.3 Move `getNextTemporalPeriod` function (~lines 686-793, ~108 lines) from historyFilterUtils.ts
- [ ] 2.4 Move `getPrevTemporalPeriod` function (~lines 803-912, ~110 lines) from historyFilterUtils.ts
- [ ] 2.5 Move `getNextPeriodLabel` function (~lines 918-925) from historyFilterUtils.ts
- [ ] 2.6 Move `getPrevPeriodLabel` function (~lines 931-938) from historyFilterUtils.ts
- [ ] 2.7 In `historyFilterUtils.ts`, replace the removed function block with: `export * from './temporalNavigation'`
- [ ] 2.8 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 2.9 Run `npx vitest run tests/unit/utils/temporalNavigation.test.ts` -- must pass unchanged

### Task 3: Extract cascading temporal builders into temporalFilterBuilders.ts

- [ ] 3.1 Create `src/shared/utils/temporalFilterBuilders.ts`
- [ ] 3.2 Add imports: `import type { TemporalFilterState } from '@/types/historyFilters'`
- [ ] 3.3 Move `buildCascadingTemporalFilter` function (~lines 958-1032, ~75 lines) from historyFilterUtils.ts -- includes internal helper functions (getFirstMonthOfQuarter, getQuarterFromMonthStr, getFirstWeek, getFirstDayOfWeek)
- [ ] 3.4 Move `buildYearFilter`, `buildQuarterFilter`, `buildMonthFilter`, `buildWeekFilter`, `buildDayFilter` convenience functions (~lines 1038-1075) from historyFilterUtils.ts
- [ ] 3.5 Note: The builder internal helpers (`getQuarterFromMonthStr` etc.) inline quarter calculation rather than importing `getQuarterFromMonth` from historyFilterUtils -- preserve this exactly to avoid circular dependency
- [ ] 3.6 In `historyFilterUtils.ts`, replace the removed function block with: `export * from './temporalFilterBuilders'`
- [ ] 3.7 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 3.8 Run all 3 test files: `npx vitest run tests/unit/utils/temporalNavigation.test.ts tests/unit/utils/historyFilterUtils.drillDown.test.ts tests/unit/utils/historyFilterUtils.location.test.ts` -- all must pass

### Task 4: Verify residual file and re-exports

- [ ] 4.1 Count final historyFilterUtils.ts lines: `wc -l src/shared/utils/historyFilterUtils.ts` (target: <800, expect ~680)
- [ ] 4.2 Count temporalNavigation.ts lines (target: <400, expect ~270)
- [ ] 4.3 Count temporalFilterBuilders.ts lines (target: <400, expect ~140)
- [ ] 4.4 Verify re-exports present: `grep "export \* from" src/shared/utils/historyFilterUtils.ts` shows both re-export lines
- [ ] 4.5 Verify no circular deps: `npx madge --circular src/shared/utils/historyFilterUtils.ts src/shared/utils/temporalNavigation.ts src/shared/utils/temporalFilterBuilders.ts`

### Task 5: Full test suite and final verification

- [ ] 5.1 Run `npm run test:quick` -- all tests pass, same count as baseline from Task 1.1
- [ ] 5.2 Run `npx tsc --noEmit` -- zero errors
- [ ] 5.3 Verify consumer resolution: `grep -r "from.*historyFilterUtils" src/ --include="*.ts" --include="*.tsx" | wc -l` should still show 15+ consumers (all unmodified)
- [ ] 5.4 Verify no stale function definitions remain in historyFilterUtils.ts: `grep -c "getNextTemporalPeriod\|getPrevTemporalPeriod\|buildCascadingTemporalFilter\|buildYearFilter\|buildQuarterFilter\|buildMonthFilter\|buildWeekFilter\|buildDayFilter" src/shared/utils/historyFilterUtils.ts` should return 0 (only re-exports remain)

## Dev Notes

### Architecture Guidance

**Re-export strategy (zero consumer impact):** The key design decision is to add `export * from './temporalNavigation'` and `export * from './temporalFilterBuilders'` in `historyFilterUtils.ts`. This means ALL 15 source consumers and 3 test consumers keep their existing import paths unchanged. The barrel chain is: consumer imports from `@shared/utils/historyFilterUtils` -> historyFilterUtils.ts re-exports from `./temporalNavigation` and `./temporalFilterBuilders`. The `src/shared/utils/index.ts` barrel already does `export * from './historyFilterUtils'` so it transitively re-exports everything.

**Why temporal navigation + cascading builders, not filter predicates:** The filter predicates (~254 lines) are private (not exported) and tightly coupled to `filterTransactionsByHistoryFilters` -- they form the file's core logic. Extracting them would either require making them public or keeping a complex private-internal dependency pattern. Temporal navigation and cascading builders are independently testable and have narrower consumer sets.

**Dependency direction:**
- `temporalNavigation.ts` → imports `formatTemporalRange` from `./historyFilterUtils` (for label functions)
- `temporalFilterBuilders.ts` → fully self-contained, no imports from other utils files
- `historyFilterUtils.ts` → does NOT import from extracted files (only re-exports via `export *`)

### Date Utils Overlap (OUT OF SCOPE)

`src/utils/date.ts` contains `getQuarterFromMonth`, `getMonthsInQuarter`, `getQuartersInYear`, `getWeeksInMonth` which overlap with functions in historyFilterUtils.ts. The signatures differ (e.g., date.ts `getQuarterFromMonth` returns `'Q1'` string, historyFilterUtils returns a number). Deduplication requires signature harmonization across 15+ consumers. This is a separate story -- do NOT attempt it here.

### Critical Pitfalls

1. **`getNextPeriodLabel`/`getPrevPeriodLabel` depend on `formatTemporalRange`:** These two functions call `formatTemporalRange` which stays in the residual `historyFilterUtils.ts`. The extracted `temporalNavigation.ts` must import it from `./historyFilterUtils`. This is a one-directional dependency (not circular) because `historyFilterUtils.ts` only `export *`s from `temporalNavigation.ts` -- it does not import from it.

2. **`buildDayFilter` is the last function in the file:** After extracting lines ~940-1075, verify the residual file does not have a dangling section comment or trailing whitespace that would affect the line count.

3. **`export *` vs named re-exports:** Use `export *` (not named re-exports) to avoid enumerating every function. This also means any future additions to the extracted files automatically become available through the original import path.

4. **Existing temporalNavigation.test.ts:** This test file already exists and tests the temporal navigation functions. It imports from `@shared/utils/historyFilterUtils`. Since the re-export preserves that path, no test changes are needed. Do NOT create new test files.

5. **No feature barrel modification:** `src/shared/utils/index.ts` does `export * from './historyFilterUtils'`. Do NOT add separate exports for the new files.

## ECC Analysis Summary

- **Risk Level:** LOW (pure function extraction with re-export strategy -- zero consumer changes)
- **Complexity:** Low -- 2 extractions, both pure TypeScript, no React, no state, no side effects
- **Sizing:** 5 tasks / 22 subtasks / 3 files touched (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- historyFilterUtils.ts is a shared leaf utility module

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft |
| 2026-02-23 | Full rewrite from architecture discovery. Corrected file location from `src/features/history/utils/` to `src/shared/utils/`. Identified 28 exported functions across 7 domains. Selected temporal navigation (~262 lines) + cascading builders (~136 lines) as extraction targets for ~398 lines removed. Re-export strategy eliminates all consumer changes (15 source + 3 test files unchanged). Noted date.ts overlap as out-of-scope. 5 tasks, 22 subtasks, 3 files touched. 15 architectural ACs. |
