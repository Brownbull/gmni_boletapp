# Story 15b-2e: Decompose reportUtils.ts

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 3
**Priority:** HIGH
**Status:** done

## Overview

Decompose `reportUtils.ts` (2,401 lines) -- the largest utility file in the codebase at 3x the 800-line limit. The file contains 4 distinct function domains: date/period utilities (19 functions), category grouping and formatting (6 functions + 1 private helper), core report generation (11 functions + 1 interface), and year-based report generation with insight helpers (14 functions). There are only 3 direct source consumers (`ReportsView.tsx`, `ReportDetailOverlay.tsx`, `index.ts` barrel) plus 1 test file, making import rewiring straightforward. The `reportUtils.ts` file will be replaced with a re-export barrel to maintain backward compatibility for all consumers.

## Functional Acceptance Criteria

- [x] **AC1:** `reportUtils.ts` reduced to a re-export barrel of <50 lines
- [x] **AC2:** Each extracted file is <800 lines
- [x] **AC3:** All existing tests pass before AND after extraction (including `tests/unit/features/reports/utils/reportUtils.test.ts`)
- [x] **AC4:** No new functionality added -- pure decomposition
- [x] **AC5:** All 3 source consumers (`ReportsView.tsx`, `ReportDetailOverlay.tsx`, `index.ts`) import correctly without changes (re-export barrel preserves all paths)
- [x] **AC6:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** Date and period utilities at `src/features/reports/utils/reportDateUtils.ts`
- [x] **AC-ARCH-LOC-2:** Category grouping and formatting at `src/features/reports/utils/reportCategoryGrouping.ts`
- [x] **AC-ARCH-LOC-3:** Core report generation at `src/features/reports/utils/reportGeneration.ts`
- [x] **AC-ARCH-LOC-4:** Year-based report generation and insights at `src/features/reports/utils/reportYearGeneration.ts`
- [x] **AC-ARCH-LOC-5:** Re-export barrel at `src/features/reports/utils/reportUtils.ts` (existing path preserved)
- [x] **AC-ARCH-LOC-6:** Existing test file at `tests/unit/features/reports/utils/reportUtils.test.ts` updated to import from new file paths (or kept importing from barrel -- either is valid)

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** All extracted files use `@/` or `@features/` path aliases for external imports -- zero `../../` relative imports
- [x] **AC-ARCH-PATTERN-2:** Extracted files import from each other via relative `./` paths (same directory)
- [x] **AC-ARCH-PATTERN-3:** `reportDateUtils.ts` contains ONLY pure functions with zero external imports beyond `@/types/transaction` (for the `Transaction` type used by filter functions)
- [x] **AC-ARCH-PATTERN-4:** `reportCategoryGrouping.ts` imports date utilities from `./reportDateUtils` if needed, and type imports from `@/types/*`
- [x] **AC-ARCH-PATTERN-5:** `reportGeneration.ts` imports from `./reportDateUtils` and `./reportCategoryGrouping` -- dependency flows one direction (date -> grouping -> generation)
- [x] **AC-ARCH-PATTERN-6:** `reportYearGeneration.ts` imports from all three upstream files -- sits at the top of the dependency chain
- [x] **AC-ARCH-PATTERN-7:** `reportUtils.ts` re-exports EVERYTHING from all 4 extracted files using `export * from './...'` syntax
- [x] **AC-ARCH-PATTERN-8:** `ReportRowData` interface and `ItemBreakdown` interface are co-located with the functions that produce them (in `reportGeneration.ts` and `reportCategoryGrouping.ts` respectively)

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependencies -- extracted files must NOT import from `reportUtils.ts` (the barrel) or from downstream files (generation must not import from yearGeneration)
- [x] **AC-ARCH-NO-2:** No new `console.log` statements in extracted files
- [x] **AC-ARCH-NO-3:** No `: any` types in extracted files
- [x] **AC-ARCH-NO-4:** No feature barrel modification -- `src/features/reports/index.ts` continues to `export * from './utils'` unchanged
- [x] **AC-ARCH-NO-5:** No consumer import changes required -- `ReportsView.tsx`, `ReportDetailOverlay.tsx`, and the test file continue to work with existing import paths because the re-export barrel preserves the public API

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| reportUtils.ts | `src/features/reports/utils/reportUtils.ts` | Replace 2,401 lines with ~30-line re-export barrel |
| reportUtils.test.ts | `tests/unit/features/reports/utils/reportUtils.test.ts` | Update imports to point to new file paths (optional -- barrel re-exports work too) |

### New Files

| File | Exact Path | Domain | Est. Lines |
|------|------------|--------|------------|
| reportDateUtils.ts | `src/features/reports/utils/reportDateUtils.ts` | Date utilities + period range/filter functions | ~250 |
| reportCategoryGrouping.ts | `src/features/reports/utils/reportCategoryGrouping.ts` | Category breakdown, store/item grouping, formatCategoryName | ~450 |
| reportGeneration.ts | `src/features/reports/utils/reportGeneration.ts` | Core summary generators, report cards, ReportRowData, getAvailableReports, getTimeFilterLabel | ~530 |
| reportInsights.ts | `src/features/reports/utils/reportInsights.ts` | Insight/highlight helpers (internal, not re-exported via barrel) | ~436 |
| reportYearGeneration.ts | `src/features/reports/utils/reportYearGeneration.ts` | Year-based generation, getAvailableReportsForYear, getMaxReportsForYear | ~522 |

### Unchanged Files

| File | Exact Path | Reason |
|------|------------|--------|
| index.ts | `src/features/reports/utils/index.ts` | Already does `export * from './reportUtils'` -- barrel re-exports propagate |
| printUtils.ts | `src/features/reports/utils/printUtils.ts` | Does not import from reportUtils |
| ReportsView.tsx | `src/features/reports/views/ReportsView.tsx` | Imports from `@features/reports/utils/reportUtils` -- barrel preserves path |
| ReportDetailOverlay.tsx | `src/features/reports/components/ReportDetailOverlay.tsx` | Imports `formatCategoryName` from `../utils/reportUtils` -- barrel preserves path |

## Tasks / Subtasks

### Task 1: Establish baseline

- [x] 1.1 Run `npm run test:quick` and record total pass count
- [x] 1.2 Run `npx vitest run tests/unit/features/reports/utils/reportUtils.test.ts` and confirm all tests pass
- [x] 1.3 Count current lines: `wc -l src/features/reports/utils/reportUtils.ts` (expect 2,401)
- [x] 1.4 Verify consumer imports: `grep -rn "from.*reportUtils" src/ tests/ --include="*.ts" --include="*.tsx"` (expect 4 files)

### Task 2: Extract reportDateUtils.ts (date utilities + period filters)

- [x] 2.1 Create `src/features/reports/utils/reportDateUtils.ts`
- [x] 2.2 Move week utility functions (lines ~66-123): `getWeekStart`, `getWeekEnd`, `getISOWeekNumber`, `parseDate`, `isDateInWeek`, `getWeekRange`
- [x] 2.3 Move `filterTransactionsByWeek` and `calculateTotal` functions
- [x] 2.4 Move month utility functions: `getMonthStart`, `getMonthEnd`, `getMonthRange`, `isDateInMonth`, `filterTransactionsByMonth`
- [x] 2.5 Move quarter utility functions: `getQuarterStart`, `getQuarterEnd`, `getQuarterNumber`, `getQuarterRange`, `isDateInQuarter`, `filterTransactionsByQuarter`
- [x] 2.6 Move year utility functions: `getYearStart`, `getYearEnd`, `getYearRange`, `isDateInYear`, `filterTransactionsByYear`
- [x] 2.7 Add import: `import type { Transaction } from '@/types/transaction';`
- [x] 2.8 Run `npx tsc --noEmit` -- fix any type errors

### Task 3: Extract reportCategoryGrouping.ts (category breakdown + grouping + formatting)

- [x] 3.1 Create `src/features/reports/utils/reportCategoryGrouping.ts`
- [x] 3.2 Move `NEUTRAL_THRESHOLD` constant
- [x] 3.3 Move `getCategoryBreakdown` function
- [x] 3.4 Move `groupCategoriesByStoreGroup` and `sortGroupsAlphabetically` functions
- [x] 3.5 Move `ItemBreakdown` interface and `getItemBreakdown` private function
- [x] 3.6 Move `groupItemsByItemCategory` function
- [x] 3.7 Move `formatCategoryName` function
- [x] 3.8 Add type and utility imports: `Transaction`, `StoreCategory` from `@/types/transaction`; report types from `@/types/report`; `getCategoryEmoji` from `@/utils/categoryEmoji`; category config from `@/config/categoryColors`; `translateItemGroup` from `@/utils/categoryTranslations`
- [x] 3.9 Run `npx tsc --noEmit` -- fix any type errors

### Task 4: Extract reportGeneration.ts (core summary + card generators)

- [x] 4.1 Create `src/features/reports/utils/reportGeneration.ts`
- [x] 4.2 Move `MIN_TRANSACTIONS_FOR_REPORT` and `MAX_CATEGORY_CARDS` constants
- [x] 4.3 Move `ReportRowData` interface; add import for `ReportPeriodType` from `@/types/report`
- [x] 4.4 Move `generateWeeklySummary` function
- [x] 4.5 Move `generateReportCards` and `generateEmptyStateCard` functions
- [x] 4.6 Move `generateMonthlySummary`, `generateQuarterlySummary`, `generateYearlySummary`
- [x] 4.7 Move `generateWeeklyReportRow`, `getAvailableReports`, `getTimeFilterLabel`
- [x] 4.8 Add imports from `./reportDateUtils`: all date/filter functions used by generators
- [x] 4.9 Add imports from `./reportCategoryGrouping`: `getCategoryBreakdown`, `groupCategoriesByStoreGroup`, `sortGroupsAlphabetically`, `groupItemsByItemCategory`, `formatCategoryName`, `NEUTRAL_THRESHOLD`
- [x] 4.10 Add type imports from `@/types/transaction` and `@/types/report`
- [x] 4.11 Run `npx tsc --noEmit` -- fix any type errors

### Task 5: Extract reportYearGeneration.ts (insights + year-based generation)

- [x] 5.1 Create `src/features/reports/utils/reportYearGeneration.ts`
- [x] 5.2 Move `HOLIDAY_MONTHS` constant and all private insight/highlight helpers: `generateMonthlyPersonaInsight`, `formatWeekDateRange`, `generateMonthlyHighlights`, `generateQuarterlyHighlights`, `generateQuarterlyPersonaInsight`, `generateYearlyHighlights`, `generateYearlyPersonaInsight`
- [x] 5.3 Move `filterTransactionsBySpecificYear` private function
- [x] 5.4 Move year-based generation functions: `generateWeeklyReportsForYear`, `generateMonthlyReportsForYear`, `generateQuarterlyReportsForYear`, `generateYearlyReportForYear`
- [x] 5.5 Move exported `getAvailableReportsForYear` and `getMaxReportsForYear`
- [x] 5.6 Add imports from `./reportDateUtils`, `./reportCategoryGrouping`, `./reportGeneration` as needed
- [x] 5.7 Add type imports from `@/types/transaction` and `@/types/report`
- [x] 5.8 Verify line count: `wc -l src/features/reports/utils/reportYearGeneration.ts` -- if >800, split insight helpers into `reportInsights.ts`
- [x] 5.9 Run `npx tsc --noEmit` -- fix any type errors

### Task 6: Convert reportUtils.ts to re-export barrel and verify

- [x] 6.1 Replace `reportUtils.ts` content with re-export barrel:
  ```typescript
  /**
   * Report Utilities - Re-export Barrel
   * All functions decomposed into domain-specific files.
   * This barrel preserves backward compatibility for existing consumers.
   */
  export * from './reportDateUtils';
  export * from './reportCategoryGrouping';
  export * from './reportGeneration';
  export * from './reportYearGeneration';
  ```
- [x] 6.2 Verify `wc -l src/features/reports/utils/reportUtils.ts` shows <50 lines
- [x] 6.3 Verify all 4 extracted files are <800 lines
- [x] 6.4 Verify no circular deps: `npx madge --circular src/features/reports/utils/`
- [x] 6.5 Run `npx vitest run tests/unit/features/reports/utils/reportUtils.test.ts` -- all tests pass
- [x] 6.6 Run `npm run test:quick` -- all tests pass with same count as baseline
- [x] 6.7 Verify no consumer changes needed: `grep -rn "from.*reportUtils" src/ tests/ --include="*.ts" --include="*.tsx"` shows same 4 files as baseline

## Dev Notes

### Architecture Guidance

**Dependency flow is strictly one-directional:**
```
reportDateUtils.ts          (no internal deps -- leaf node)
       |
reportCategoryGrouping.ts   (zero deps on other report files)
       |
reportGeneration.ts         (imports from dateUtils + categoryGrouping)
       |
reportYearGeneration.ts     (imports from all three upstream files)
```

**Re-export barrel strategy:** Since there are only 3 source consumers and they all import from the `reportUtils` path, converting `reportUtils.ts` into a re-export barrel means ZERO consumer changes are required. The `export * from './reportUtils'` in `index.ts` continues to work, and all direct imports from `@features/reports/utils/reportUtils` continue to resolve.

**Constants placement:**
- `NEUTRAL_THRESHOLD` lives in `reportCategoryGrouping.ts` (primary consumer is `getCategoryBreakdown`). Downstream files import it from `./reportCategoryGrouping`.
- `MIN_TRANSACTIONS_FOR_REPORT` and `MAX_CATEGORY_CARDS` live in `reportGeneration.ts` (only used there).
- `HOLIDAY_MONTHS` lives in `reportYearGeneration.ts` (only used by insight helpers).

### Critical Pitfalls

1. **Mid-file import statement:** There is an `import type { ReportPeriodType }` in the middle of the file (line ~959), not at the top. This must be moved to the top of whichever file receives `ReportRowData`. Place it at the top of `reportGeneration.ts`.

2. **Unused import suppressions:** Lines 42-43 have `void _formatDateRange;` and `void _getWeeksInMonth;` to suppress unused import warnings. These are aliased imports that were only needed to avoid lint errors. The re-export barrel does NOT need these -- drop them entirely during extraction.

3. **Private functions stay co-located with their consumers:** `getItemBreakdown` (private) is used only by `groupItemsByItemCategory` -- both go in `reportCategoryGrouping.ts`. All insight/highlight helpers (private) are used only by year-based generation -- all go in `reportYearGeneration.ts`. `filterTransactionsBySpecificYear` (private) is used only by year-based generation -- goes in `reportYearGeneration.ts`.

4. **NEUTRAL_THRESHOLD cross-file usage:** This constant is used in `getCategoryBreakdown`, `generateWeeklySummary`, and multiple year-based generators. Export it from `reportCategoryGrouping.ts` and import it in downstream files.

5. **reportYearGeneration.ts line count risk:** This file consolidates insight helpers (~410 lines) + year-based generators (~630 lines) = ~780 lines estimated. This is tight against the 800-line limit. If it exceeds 800 during extraction (due to import blocks and spacing), split the insight helpers into a separate `reportInsights.ts` file. Attempt single file first.

6. **Test file only imports 12 functions:** The existing test file (`reportUtils.test.ts`) only tests date utility and core generation functions. Since `reportUtils.ts` becomes a re-export barrel, no test imports need to change. Optionally update test imports to point directly to new files for clarity.

## ECC Analysis Summary

- **Risk Level:** LOW (pure decomposition, only 3 source consumers, re-export barrel eliminates import rewiring)
- **Complexity:** Low-Moderate -- 4 extractions into domain files, straightforward function clustering, no React components involved
- **Sizing:** 6 tasks / 24 subtasks / 7 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- all extraction is internal to `src/features/reports/utils/`

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (skeleton with estimated line counts) |
| 2026-02-23 | Full rewrite from architecture discovery. Analyzed all 2,401 lines: 37 exports (35 functions + 1 interface + 1 type), 9 private helpers, 3 constants. 4-file domain split: reportDateUtils (~250L), reportCategoryGrouping (~450L), reportGeneration (~530L), reportYearGeneration (~780L). Re-export barrel strategy eliminates all consumer changes. 3 source consumers confirmed. 18 architectural ACs, 6 tasks, 24 subtasks, 7 files. |
| 2026-02-24 | Implementation complete. 5 modules (not 4) due to pitfall #5: reportYearGeneration exceeded 800 lines, so insight helpers split into reportInsights.ts (436L). Final line counts: dateUtils 284, categoryGrouping 476, generation 602, insights 436, yearGeneration 522, barrel 16. Total 2,336 lines (65 lines dead code removed). All 38 tests pass, 6,851 full suite tests pass. Code review: APPROVED. |
| 2026-02-24 | ECC Code Review: STANDARD classification (code-reviewer + security-reviewer). Score 9/10. 2 quick fixes applied (parseDate consistency, maxReports cap). 2 pre-existing items deferred to TD-15b-14. |

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-02-24 |
| Classification | STANDARD |
| Agents | code-reviewer (9/10), security-reviewer (9/10) |
| Overall Score | 9/10 |
| Outcome | APPROVED |
| Quick Fixes | 2 (filterTransactionsBySpecificYear parseDate consistency, getAvailableReports maxReports cap) |
| Deferred Items | 2 → TD-15b-14 (parseDate validation, trendPercent overflow guard) |

### Deferred Item Tracking

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-14 | parseDate silent failure + trendPercent overflow (pre-existing) | LOW | CREATED |
