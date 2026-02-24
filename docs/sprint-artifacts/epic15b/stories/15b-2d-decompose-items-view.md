# Story 15b-2d: Decompose ItemsView

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 2
**Priority:** HIGH
**Status:** done

## Overview

Decompose `src/features/items/views/ItemsView/ItemsView.tsx` (1,003 lines, 18 hooks) into smaller focused sub-files within the same directory. The file exceeds the 800-line hook-enforced limit. Target: main file under 500 lines with 5 extracted files each under 250 lines. This is a PURE DECOMPOSITION -- no new features, no behavior changes, no hook refactoring.

**Key insight from analysis:** Unlike other Phase 2 views (TrendsView at 1,981, DashboardView at 1,485), ItemsView is only ~200 lines over the limit. The extraction is surgical: 5 files covering constants/types, empty state, filter logic, header JSX, and pagination controls. The main file retains all hooks, state, callbacks, and the content-area glue JSX.

## Functional Acceptance Criteria

- [x] **AC1:** ItemsView.tsx reduced to <500 lines (from 1,003) — now 449 lines
- [x] **AC2:** Each extracted file is under 250 lines — max is 241 (itemsViewFilters.ts)
- [x] **AC3:** Behavior snapshot: all existing tests pass before AND after extraction — 277 files, 6833 tests
- [x] **AC4:** No new functionality added -- pure decomposition
- [x] **AC5:** `npm run test:quick` passes
- [x] **AC6:** Export surface unchanged: `ItemsView`, `ItemsViewProps` still exported from barrel

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** All extracted files located within `src/features/items/views/ItemsView/` (same directory as parent)
- [x] **AC-ARCH-LOC-2:** Constants/types file at `src/features/items/views/ItemsView/itemsViewConstants.ts`
- [x] **AC-ARCH-LOC-3:** Empty state component at `src/features/items/views/ItemsView/ItemsViewEmptyState.tsx`
- [x] **AC-ARCH-LOC-4:** Filter helpers at `src/features/items/views/ItemsView/itemsViewFilters.ts`
- [x] **AC-ARCH-LOC-5:** Header component at `src/features/items/views/ItemsView/ItemsViewHeader.tsx`
- [x] **AC-ARCH-LOC-6:** Pagination component at `src/features/items/views/ItemsView/ItemsViewPagination.tsx`
- [x] **AC-ARCH-LOC-7:** Unit tests at `tests/unit/features/items/views/ItemsView/itemsViewFilters.test.ts`
- [x] **AC-ARCH-LOC-8:** Barrel file at `src/features/items/views/ItemsView/index.ts` unchanged (still exports `ItemsView`, `useItemsViewData`, types)

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** Extracted files use `./` relative imports for intra-directory references (e.g., `./itemsViewConstants`)
- [x] **AC-ARCH-PATTERN-2:** Extracted files use `@/` or `@features/` aliases for external imports -- zero `../../` relative imports
- [x] **AC-ARCH-PATTERN-3:** Pure helper functions in `itemsViewFilters.ts` have NO React imports (pure TypeScript)
- [x] **AC-ARCH-PATTERN-4:** Extracted sub-components receive data via props, not hooks -- hooks stay in main `ItemsView.tsx`
- [x] **AC-ARCH-PATTERN-5:** Constants file exports ALL constants/types currently defined at module scope in ItemsView.tsx
- [x] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/items/views/ItemsView/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No new barrel exports -- extracted files are internal to ItemsView, NOT exported from feature barrel
- [x] **AC-ARCH-NO-2:** No hook extraction -- all 18 hooks remain in `ItemsView.tsx` (hook refactoring is separate work)
- [x] **AC-ARCH-NO-3:** No new circular dependencies -- `npx madge --circular src/features/items/` returns 0
- [x] **AC-ARCH-NO-4:** No behavior changes -- the `filteredItems` useMemo produces identical output before and after
- [x] **AC-ARCH-NO-5:** No new external dependencies -- extracted files import only from modules already imported by ItemsView.tsx

## File Specification

### New Files (6)

| File | Exact Path | Lines (est.) | Description |
|------|------------|--------------|-------------|
| Constants & types | `src/features/items/views/ItemsView/itemsViewConstants.ts` | ~55 | `PAGE_SIZE_OPTIONS`, `PageSizeOption`, `DEFAULT_PAGE_SIZE`, `ItemSortKey`, `ITEM_SORT_OPTIONS`, `DEFAULT_SORT_KEY`, `DEFAULT_SORT_DIRECTION`, `ItemsViewProps` interface |
| Empty state | `src/features/items/views/ItemsView/ItemsViewEmptyState.tsx` | ~55 | `EmptyState` component + `EmptyStateProps` interface |
| Filter helpers | `src/features/items/views/ItemsView/itemsViewFilters.ts` | ~190 | `computeTemporalDateRange()`, `applyDrillDownFilters()`, `applyLegacyCategoryFilters()`, `applyAllItemsFilters()` |
| Header component | `src/features/items/views/ItemsView/ItemsViewHeader.tsx` | ~240 | `ItemsViewHeader` sub-component (sticky header with search, breadcrumb, sort, filter chips, export) |
| Pagination controls | `src/features/items/views/ItemsView/ItemsViewPagination.tsx` | ~80 | `ItemsViewPagination` sub-component (page navigation + page size selector) |
| Filter tests | `tests/unit/features/items/views/ItemsView/itemsViewFilters.test.ts` | ~120 | Unit tests for pure filter functions |

### Modified Files (1)

| File | Exact Path | Change |
|------|------------|--------|
| ItemsView | `src/features/items/views/ItemsView/ItemsView.tsx` | Reduce from 1,003 to ~420 lines. Replace inline sections with imports from extracted files. |

### Unchanged Files

| File | Why No Change |
|------|---------------|
| `src/features/items/views/ItemsView/index.ts` | Barrel already exports `ItemsView` -- no new public exports |
| `src/features/items/views/ItemsView/useItemsViewData.ts` | Data hook untouched |
| `src/features/items/views/index.ts` | No change to feature barrel chain |
| `src/features/items/index.ts` | No change to feature barrel |
| `src/views/ItemsView/index.ts` | Re-export shim untouched |
| `tests/unit/features/items/views/ItemsView/useItemsViewData.test.ts` | Existing test untouched |
| `src/App.tsx` | Imports via shim, unaffected |
| `src/components/App/viewRenderers.tsx` | Imports via shim, unaffected |

## Tasks / Subtasks

### Task 1: Establish baseline (3 subtasks)

- [x] 1.1 Run `npm run test:quick` -- record pass count and any pre-existing failures — 276 files, 6810 tests pass
- [x] 1.2 Run `npx tsc --noEmit` -- confirm clean TypeScript compilation
- [x] 1.3 Count current lines: `wc -l src/features/items/views/ItemsView/ItemsView.tsx` — 1,003 lines

### Task 2: Extract constants, types, and EmptyState (4 subtasks)

- [x] 2.1 Create `src/features/items/views/ItemsView/itemsViewConstants.ts` (63 lines)
- [x] 2.2 Create `src/features/items/views/ItemsView/ItemsViewEmptyState.tsx` (60 lines)
- [x] 2.3 Update `ItemsView.tsx` to import from `./itemsViewConstants` and `./ItemsViewEmptyState`
- [x] 2.4 Run `npx tsc --noEmit` -- clean

### Task 3: Extract filter logic as pure functions (4 subtasks)

- [x] 3.1 Create `src/features/items/views/ItemsView/itemsViewFilters.ts` (241 lines) — 4 pure functions, no React imports
- [x] 3.2 Replace filteredItems useMemo body with `applyAllItemsFilters` call
- [x] 3.3 Create `tests/unit/features/items/views/ItemsView/itemsViewFilters.test.ts` (195 lines) — 23 tests
- [x] 3.4 Run filter tests — all 23 pass

### Task 4: Extract header and pagination sub-components (5 subtasks)

- [x] 4.1 Create `src/features/items/views/ItemsView/ItemsViewHeader.tsx` (187 lines) — ~28 props, destructured
- [x] 4.2 Create `src/features/items/views/ItemsView/ItemsViewPagination.tsx` (91 lines)
- [x] 4.3 Update `ItemsView.tsx` to import and render extracted components
- [x] 4.4 Run `npx tsc --noEmit` -- clean
- [x] 4.5 Run `npm run test:quick` -- 277 files, 6833 tests pass

### Task 5: Verification and cleanup (6 subtasks)

- [x] 5.1 Count final lines: 449 (target: <500)
- [x] 5.2 Count all extracted files: max 241 (target: <250 each)
- [x] 5.3 Verify no circular deps: `npx madge --circular` returns 0
- [x] 5.4 Verify no `../../` imports: 0 matches
- [x] 5.5 Verify barrel unchanged: no diff
- [x] 5.6 Run `npm run test:quick` -- final pass, 277 files, 6833 tests

## Dev Notes

### Architecture Guidance

**Extraction order matters:** Constants/types first (zero risk), then EmptyState (self-contained component), then filter logic (pure functions with testable behavior), then JSX sub-components (largest risk surface). Each extraction is independently verifiable with `tsc --noEmit`.

**Filter extraction is the high-value target.** The `filteredItems` useMemo body contains dense conditional logic covering 6 temporal levels and 7 category filter paths. Extracting this into pure functions with proper tests dramatically improves both readability and testability. Currently this logic has ZERO direct test coverage -- it is only tested indirectly through integration tests.

**Sub-component prop interfaces will be large.** `ItemsViewHeader` needs ~25 props because all hooks stay in the parent. This is intentional -- the alternative (moving hooks into the header) would change behavior and violate the decomposition-only constraint. The prop interface serves as documentation of the header's data needs.

**Why extracted files stay in `views/ItemsView/` (not `components/`):** These are internal sub-components of ItemsView, not reusable feature components. Placing them alongside the parent follows the co-location principle established by TrendsView. They are NOT exported from the feature barrel.

### Critical Pitfalls

1. **`console.error` in export handler:** Leave in place during decomposition -- the `handleExport` callback stays in `ItemsView.tsx`. Fixing console usage is separate work.

2. **Type widening cast:** There is a `const formatDate = formatDateHook as (date: string, format: string) => string;` cast near the hook destructuring. This stays in `ItemsView.tsx` -- do NOT move it to a helper file.

3. **`filterState` memoization dependencies:** The extracted `applyAllItemsFilters` function must accept `filterState.temporal` and `filterState.category` as separate parameters (not the whole `filterState` object) to maintain correct memoization dependencies.

4. **SortOption type import:** `ITEM_SORT_OPTIONS` uses `SortOption` from `@features/history/components/SortControl`. This import must move to `itemsViewConstants.ts`. Use `import type` to keep it a type-only dependency.

5. **ProfileAvatar ref forwarding:** The `profileButtonRef` is created in `ItemsView.tsx` (`useRef<HTMLButtonElement>(null)`) and passed to `ItemsViewHeader`. Ensure the ref type (`React.RefObject<HTMLButtonElement>`) is correctly typed in the header props interface.

### Files that do NOT move or change

- `useItemsViewData.ts` -- data hook stays as-is
- `index.ts` barrel -- no changes to public API surface
- All callbacks/effects in ItemsView.tsx -- handlers contain state setters that must stay co-located with their `useState` calls

### Line count budget

| File | Est. Lines | Content |
|------|-----------|---------|
| `itemsViewConstants.ts` | ~55 | Constants, types, sort options, props interface |
| `ItemsViewEmptyState.tsx` | ~55 | EmptyState component |
| `itemsViewFilters.ts` | ~190 | 4 pure filter functions + type imports |
| `ItemsViewHeader.tsx` | ~240 | Header JSX + props interface |
| `ItemsViewPagination.tsx` | ~80 | Pagination JSX + props interface |
| `itemsViewFilters.test.ts` | ~120 | Filter function unit tests |
| **ItemsView.tsx (after)** | **~420** | Hooks, state, callbacks, effects, content glue |

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Moderate (5 extractions, but all mechanical; filter function extraction requires careful parameter design)
- **Sizing:** 5 tasks / 22 subtasks / 8 files touched (within limits of 6/25/10)
- **Dependencies:** None -- ItemsView was consolidated into `features/items/` in 15b-1e (done)
- **Test impact:** Existing `useItemsViewData.test.ts` unaffected. New `itemsViewFilters.test.ts` adds coverage for previously untested filter logic.

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft from ecc-create-epics-and-stories |
| 2026-02-23 | Full rewrite: Architecture discovery (read 1,003-line source + all related files), added Architectural ACs (8 LOC + 6 PATTERN + 5 NO), exact file specification (6 new + 1 modified + 8 unchanged), detailed task/subtask breakdown (5 tasks, 22 subtasks), dev notes with 5 critical pitfalls, line count budget. Priority upgraded MEDIUM->HIGH (file exceeds 800-line hook-enforced limit). |
| 2026-02-24 | ECC Code Review: APPROVE 8.5/10. STANDARD classification (code-reviewer + security-reviewer). 1 quick fix (Spanish accents in Pagination). 6 pre-existing items deferred (all inherited from original 1,003-line file). No regressions, no architectural violations, all 19 ACs pass. |
