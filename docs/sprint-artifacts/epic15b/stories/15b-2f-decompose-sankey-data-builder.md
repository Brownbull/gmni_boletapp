# Story 15b-2f: Decompose sankeyDataBuilder.ts

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Overview

Decompose `sankeyDataBuilder.ts` (1,038 lines) inside `src/features/analytics/utils/`. The file builds Sankey diagram data from transactions across four hierarchy modes (2-level, 3-level-groups, 3-level-categories, 4-level). The dominant pattern is four large private mode-builder functions (~650 lines combined) that all depend on two cohesive helper clusters: transaction aggregation (~111 lines) and threshold filtering (~120 lines). Extract these two helper clusters into dedicated files, reducing the main file to ~800 lines. This is a PURE DECOMPOSITION -- no new features, no behavior changes.

## Functional Acceptance Criteria

- [ ] **AC1:** `sankeyDataBuilder.ts` reduced to <800 lines (from 1,038)
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** All existing tests pass before AND after extraction (`tests/unit/utils/sankeyDataBuilder.test.ts`)
- [ ] **AC4:** No new functionality added -- pure decomposition
- [ ] **AC5:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Aggregation module at `src/features/analytics/utils/sankeyAggregation.ts`
- [ ] **AC-ARCH-LOC-2:** Threshold module at `src/features/analytics/utils/sankeyThreshold.ts`
- [ ] **AC-ARCH-LOC-3:** Aggregation tests at `tests/unit/features/analytics/utils/sankeyAggregation.test.ts`
- [ ] **AC-ARCH-LOC-4:** Threshold tests at `tests/unit/features/analytics/utils/sankeyThreshold.test.ts`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** `sankeyAggregation.ts` contains ONLY the `FlowAggregates` interface and `aggregateTransactions()` function -- no React imports, no Sankey node/link logic
- [ ] **AC-ARCH-PATTERN-2:** `sankeyThreshold.ts` contains ONLY the `CategoryAggregate` interface, `THRESHOLD_PERCENT` constant, `MIN_VISIBLE_CATEGORIES` constant, and `applyThreshold()` function -- no React imports, no transaction dependencies
- [ ] **AC-ARCH-PATTERN-3:** Extracted files use `@/` path aliases for external imports (e.g., `@/types/transaction`, `@/utils/comparators`, `@/config/categoryColors`)
- [ ] **AC-ARCH-PATTERN-4:** `sankeyDataBuilder.ts` imports from extracted files via relative `./` paths (`./sankeyAggregation`, `./sankeyThreshold`)
- [ ] **AC-ARCH-PATTERN-5:** Test directory mirrors source: `tests/unit/features/analytics/utils/`
- [ ] **AC-ARCH-PATTERN-6:** All types/interfaces that were private in the original file and become exported in the new files are documented with JSDoc `@internal` tags

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No circular dependency -- extracted files must NOT import from `sankeyDataBuilder.ts` or from each other
- [ ] **AC-ARCH-NO-2:** No barrel modification -- `src/features/analytics/utils/index.ts` must NOT add exports for `sankeyAggregation` or `sankeyThreshold` (they are internal implementation details)
- [ ] **AC-ARCH-NO-3:** No new `console.log` statements in extracted files
- [ ] **AC-ARCH-NO-4:** No `: any` types in extracted files
- [ ] **AC-ARCH-NO-5:** No public API change -- all currently exported types and functions from `sankeyDataBuilder.ts` remain exported from `sankeyDataBuilder.ts` with identical signatures

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| sankeyDataBuilder.ts | `src/features/analytics/utils/sankeyDataBuilder.ts` | Remove aggregation + threshold code; add imports from new files; reduce from 1,038 to ~800 lines |

### New Files

| File | Exact Path | Pattern | Est. Lines |
|------|------------|---------|------------|
| sankeyAggregation.ts | `src/features/analytics/utils/sankeyAggregation.ts` | Pure TS module -- types + aggregation function | ~120 |
| sankeyThreshold.ts | `src/features/analytics/utils/sankeyThreshold.ts` | Pure TS module -- types + threshold function | ~125 |
| sankeyAggregation.test.ts | `tests/unit/features/analytics/utils/sankeyAggregation.test.ts` | Unit test | ~100 |
| sankeyThreshold.test.ts | `tests/unit/features/analytics/utils/sankeyThreshold.test.ts` | Unit test | ~120 |

### Unchanged Files (verify only)

| File | Exact Path | Why Unchanged |
|------|------------|---------------|
| SankeyChart.tsx | `src/features/analytics/components/SankeyChart.tsx` | Imports from `sankeyDataBuilder` -- public API unchanged |
| TrendsView.tsx | `src/features/analytics/views/TrendsView/TrendsView.tsx` | Imports `SankeyMode` type only -- unchanged |
| TrendsCardHeader.tsx | `src/features/analytics/views/TrendsView/TrendsCardHeader.tsx` | Imports `SankeyMode` type only -- unchanged |
| utils barrel | `src/features/analytics/utils/index.ts` | Must NOT be modified |
| Existing test | `tests/unit/utils/sankeyDataBuilder.test.ts` | Existing tests remain, import path unchanged |

## Tasks / Subtasks

### Task 1: Establish baseline

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 Run `npx vitest run tests/unit/utils/sankeyDataBuilder.test.ts` and confirm all tests pass
- [ ] 1.3 Count current lines: `wc -l src/features/analytics/utils/sankeyDataBuilder.ts` (expect 1,038)
- [ ] 1.4 Verify no existing circular deps: `npx madge --circular src/features/analytics/utils/`

### Task 2: Extract sankeyAggregation.ts

- [ ] 2.1 Create `src/features/analytics/utils/sankeyAggregation.ts`
- [ ] 2.2 Move `FlowAggregates` interface (lines ~210-220) to new file; export it; add `@internal` JSDoc tag
- [ ] 2.3 Move `aggregateTransactions()` function (lines ~225-316) to new file; export it
- [ ] 2.4 Add required imports to sankeyAggregation.ts: `Transaction` from `@/types/transaction`, `STORE_CATEGORY_GROUPS`, `ITEM_CATEGORY_GROUPS`, `ITEM_CATEGORY_TO_KEY` from `@/config/categoryColors`, `StoreCategory`, `ItemCategory` from `@/types/transaction`, and group type imports
- [ ] 2.5 In `sankeyDataBuilder.ts`: replace removed code with `import { aggregateTransactions, type FlowAggregates } from './sankeyAggregation'`
- [ ] 2.6 Remove now-unused imports from `sankeyDataBuilder.ts` (verify each is unused first -- `StoreCategory`/`ItemCategory` may still be needed by builder type annotations)
- [ ] 2.7 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 2.8 Run `npx vitest run tests/unit/utils/sankeyDataBuilder.test.ts` -- all existing tests still pass

### Task 3: Extract sankeyThreshold.ts

- [ ] 3.1 Create `src/features/analytics/utils/sankeyThreshold.ts`
- [ ] 3.2 Move `CategoryAggregate` interface (lines ~85-91) to new file; export it; add `@internal` JSDoc tag
- [ ] 3.3 Move `THRESHOLD_PERCENT` and `MIN_VISIBLE_CATEGORIES` constants to new file; export them
- [ ] 3.4 Move `applyThreshold()` function (lines ~151-204) to new file; export it
- [ ] 3.5 Add required imports to sankeyThreshold.ts: `byNumberDesc` from `@/utils/comparators`
- [ ] 3.6 In `sankeyDataBuilder.ts`: replace removed code with `import { applyThreshold, type CategoryAggregate } from './sankeyThreshold'`
- [ ] 3.7 Remove now-unused `byNumberDesc` import from `sankeyDataBuilder.ts`
- [ ] 3.8 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 3.9 Run `npx vitest run tests/unit/utils/sankeyDataBuilder.test.ts` -- all existing tests still pass

### Task 4: Write unit tests for extracted modules

- [ ] 4.1 Create directory: `mkdir -p tests/unit/features/analytics/utils/`
- [ ] 4.2 Create `tests/unit/features/analytics/utils/sankeyAggregation.test.ts`
- [ ] 4.3 Test `aggregateTransactions` with empty array (returns all empty maps)
- [ ] 4.4 Test `aggregateTransactions` with single transaction containing 1 item (verify all 8 maps populated correctly)
- [ ] 4.5 Test `aggregateTransactions` skips transactions without items, without category, and items with zero/negative price
- [ ] 4.6 Create `tests/unit/features/analytics/utils/sankeyThreshold.test.ts`
- [ ] 4.7 Test `applyThreshold` with empty array (returns empty visible, hidden, null masNode)
- [ ] 4.8 Test `applyThreshold` with all categories above 10% threshold (all visible, no masNode)
- [ ] 4.9 Test `applyThreshold` with categories below threshold (verify "Mas" aggregation values and counts)
- [ ] 4.10 Test `applyThreshold` expansion parameter reveals hidden categories
- [ ] 4.11 Test `MIN_VISIBLE_CATEGORIES` guarantees at least 2 categories shown even when all are below threshold
- [ ] 4.12 Run `npx vitest run tests/unit/features/analytics/utils/` -- all new tests pass

### Task 5: Verify extraction and final validation

- [ ] 5.1 Count final `sankeyDataBuilder.ts` lines: `wc -l src/features/analytics/utils/sankeyDataBuilder.ts` (target: <800)
- [ ] 5.2 Verify `sankeyAggregation.ts` is <400 lines: `wc -l src/features/analytics/utils/sankeyAggregation.ts`
- [ ] 5.3 Verify `sankeyThreshold.ts` is <400 lines: `wc -l src/features/analytics/utils/sankeyThreshold.ts`
- [ ] 5.4 Verify no circular deps: `npx madge --circular src/features/analytics/utils/`
- [ ] 5.5 Verify barrel unchanged: `git diff src/features/analytics/utils/index.ts` (expect no changes)
- [ ] 5.6 Verify consumer imports unchanged: `grep -r "from.*sankeyDataBuilder" src/ --include="*.ts" --include="*.tsx"` (same files as before)
- [ ] 5.7 Run `npm run test:quick` -- all tests pass, pass count matches or exceeds baseline from Task 1.1

## Dev Notes

### Architecture Guidance

**Why extract aggregation + threshold, not mode builders:** The four `buildXLevelSankey` functions are all private and tightly coupled to each other's shared dependencies: `nodeName()`, `SankeyNode`, `SankeyLink`, `getCategoryColor`, theme types, and the `FlowAggregates`/`CategoryAggregate` types. Extracting any single builder would require exporting internal types and creating cross-file dependencies between siblings. In contrast, `aggregateTransactions` and `applyThreshold` are **leaf dependencies** -- consumed by the builders but importing nothing from them. This makes them clean extraction candidates with zero risk of circular imports.

**Two files, not three:** The original draft proposed `sankeyNodes.ts` and `sankeyLinks.ts` but the node and link creation logic is inextricably woven into each mode builder (they share `nodes`/`links` arrays and `visibleXxx` sets within each function). Splitting nodes from links would require breaking apart individual functions, which is not safe for a pure decomposition story.

**Line budget:** Extracting `FlowAggregates` + `aggregateTransactions` (~111 lines) and `CategoryAggregate` + constants + `applyThreshold` (~120 lines) removes ~231 lines from the 1,038-line file. With the added import statements (+2 lines), the result is ~809 lines. If this is slightly over 800, move `DEFAULT_EXPANSION` + `getDefaultExpansion()` to `sankeyThreshold.ts` for another ~9 lines saved.

### Critical Pitfalls

1. **`StoreCategory` and `ItemCategory` imports may remain needed in sankeyDataBuilder.ts.** The mode builders use these types in variable annotations. Before removing them from `sankeyDataBuilder.ts` in subtask 2.6, run `npx tsc --noEmit` to verify. If the TypeScript compiler still requires them (explicit type annotations vs inferred), keep them.

2. **`applyThreshold` mutates the `percent` field in-place.** The function sorts a spread-copy (`[...categories].sort()`) but the objects inside are NOT cloned -- the caller's `CategoryAggregate` objects get their `percent` field mutated. This is existing behavior. Do NOT add defensive cloning during extraction.

3. **Private-to-exported visibility change.** `aggregateTransactions`, `applyThreshold`, `FlowAggregates`, and `CategoryAggregate` were all private (module-scoped, not exported). After extraction they become exported. The `@internal` JSDoc tag and AC-ARCH-NO-2 (no barrel re-export) constraint together ensure they remain implementation details.

4. **Existing test file location.** The existing tests live at `tests/unit/utils/sankeyDataBuilder.test.ts` (a legacy path, not under `tests/unit/features/analytics/`). Do NOT move this test file -- it is out of scope for this story. New tests for extracted modules go to the correct FSD path: `tests/unit/features/analytics/utils/`.

5. **The `byNumberDesc` import.** After extracting `applyThreshold`, the `byNumberDesc` import in `sankeyDataBuilder.ts` becomes unused. Remove it in subtask 3.7. Verify it is truly unused -- none of the four mode builders use it directly.

6. **Edge case: exact 800-line boundary.** If the final line count lands at 805-810, move `DEFAULT_EXPANSION` + `getDefaultExpansion()` to `sankeyThreshold.ts` for another ~9 lines saved. `DEFAULT_EXPANSION` is semantically related to threshold logic.

## ECC Analysis Summary

- **Risk Level:** LOW (pure extraction of leaf dependencies, no behavior change, existing test coverage)
- **Complexity:** Low-moderate -- 2 extractions from a single file, both are self-contained functions with clear boundaries
- **Sizing:** 5 tasks / 22 subtasks / 7 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- sankeyDataBuilder.ts is internal to the analytics feature

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft |
| 2026-02-23 | Full rewrite from architecture discovery. Source analysis of sankeyDataBuilder.ts (1,038 lines). Identified 2 extraction targets: sankeyAggregation.ts (~120L, FlowAggregates + aggregateTransactions) and sankeyThreshold.ts (~125L, CategoryAggregate + applyThreshold + constants). Rejected mode-builder extraction due to tight coupling. Target residual: ~800 lines. 14 architectural ACs, 5 tasks, 22 subtasks, 7 files. |
