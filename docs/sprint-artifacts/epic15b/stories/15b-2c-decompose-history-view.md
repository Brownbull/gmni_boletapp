# Story 15b-2c: Decompose HistoryView

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 2
**Priority:** HIGH
**Status:** done

## Overview

Decompose `src/features/history/views/HistoryView.tsx` (1,169 lines, 28 unique import sources, 15+ hooks) into smaller focused sub-files. This is a PURE DECOMPOSITION -- no new features, no behavior changes. Target: main file under 800 lines, each extracted file under 400 lines.

The file was consolidated into `src/features/history/views/` in story 15b-1d. It contains a large sticky header section, two empty-state variants, a paginated transaction list, pagination controls, and significant sorting/filtering pure logic. All of these are extractable without changing behavior.

### Extraction Strategy

1. **Constants and pure helpers** to `historyViewConstants.ts` (~90 lines)
2. **Collapsible header hook** to `useCollapsibleHeader.ts` (~60 lines)
3. **Header UI** to `HistoryHeader.tsx` (~200 lines)
4. **Pagination UI** to `HistoryPagination.tsx` (~100 lines)
5. **Empty states** to `HistoryEmptyStates.tsx` (~70 lines)

After extraction, HistoryView.tsx will be ~500-550 lines (state setup, memo chains, handlers, content area with transaction list).

## Functional Acceptance Criteria

- [x] **AC1:** HistoryView.tsx reduced to <800 lines
- [x] **AC2:** Each extracted file is <400 lines
- [x] **AC3:** Behavior snapshot: all existing tests pass before AND after extraction
- [x] **AC4:** No new functionality added -- pure decomposition
- [x] **AC5:** Fan-out of HistoryView.tsx decreased (from 28 to ~18 unique import sources)
- [x] **AC6:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** Constants at `src/features/history/views/historyViewConstants.ts`
- [x] **AC-ARCH-LOC-2:** Hook at `src/features/history/views/useCollapsibleHeader.ts`
- [x] **AC-ARCH-LOC-3:** Header component at `src/features/history/components/HistoryHeader.tsx`
- [x] **AC-ARCH-LOC-4:** Pagination component at `src/features/history/components/HistoryPagination.tsx`
- [x] **AC-ARCH-LOC-5:** Empty states at `src/features/history/components/HistoryEmptyStates.tsx`
- [x] **AC-ARCH-LOC-6:** Constants test at `tests/unit/features/history/views/historyViewConstants.test.ts`
- [x] **AC-ARCH-LOC-7:** Hook test at `tests/unit/features/history/views/useCollapsibleHeader.test.ts`

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD compliance -- extracted views-layer files in `features/history/views/`, extracted presentation components in `features/history/components/`
- [x] **AC-ARCH-PATTERN-2:** All extracted files use `@/` or `@features/` aliases for external imports -- zero `../../` relative imports
- [x] **AC-ARCH-PATTERN-3:** Internal sibling imports use `./` relative paths (e.g., `./historyViewConstants`)
- [x] **AC-ARCH-PATTERN-4:** Extracted components accept props interfaces (not global state) -- data flows down from HistoryView
- [x] **AC-ARCH-PATTERN-5:** `sortTransactionsWithinGroups` is a named export, testable in isolation
- [x] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/history/views/` and `tests/unit/features/history/components/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency -- HistoryView must NOT import from the history feature barrel (`@features/history`); must use deep paths (`@features/history/components/*`)
- [x] **AC-ARCH-NO-2:** No `../../` relative imports in any extracted or modified file (only `./` siblings allowed)
- [x] **AC-ARCH-NO-3:** No behavior changes -- zero function signature, prop, or return type modifications in existing public APIs
- [x] **AC-ARCH-NO-4:** No new external dependencies added -- extracted files only re-use existing imports
- [x] **AC-ARCH-NO-5:** No hook extraction from HistoryViewInner that changes the hook call order (React rules of hooks)
- [x] **AC-ARCH-NO-6:** Extracted sub-components must NOT call hooks themselves (except `useCollapsibleHeader` which is a new hook file called in the parent). Sub-components receive data via props.

## File Specification

### Modified Files

| File | Exact Path | Action | Description |
|------|------------|--------|-------------|
| HistoryView.tsx | `src/features/history/views/HistoryView.tsx` | MODIFY | Reduce from 1,169 to ~500-550 lines; import from extracted files |
| Components barrel | `src/features/history/components/index.ts` | MODIFY | Add exports for HistoryHeader, HistoryPagination, HistoryEmptyStates |

### New Files

| File | Exact Path | Action | Description |
|------|------------|--------|-------------|
| Constants/helpers | `src/features/history/views/historyViewConstants.ts` | CREATE | `PAGE_SIZE_OPTIONS`, `HISTORY_SORT_OPTIONS`, `sortTransactionsWithinGroups()`, `HistorySortKey`, `PageSizeOption`, `DEFAULT_*` constants (~90 lines) |
| Collapsible hook | `src/features/history/views/useCollapsibleHeader.ts` | CREATE | `useCollapsibleHeader()` hook -- scroll detection, collapse/expand state, refs (~60 lines) |
| Header component | `src/features/history/components/HistoryHeader.tsx` | CREATE | Sticky header bar (back, title, profile, icon filter) + collapsible section (search, breadcrumb, sort/export, filter chips, duplicate chip) (~200 lines) |
| Pagination component | `src/features/history/components/HistoryPagination.tsx` | CREATE | Page navigation buttons, page indicator, page size selector, load-more button, end-of-history indicator (~100 lines) |
| Empty states | `src/features/history/components/HistoryEmptyStates.tsx` | CREATE | Two empty-state variants: no-transactions (scan prompt) and no-matching-filters (~70 lines) |
| Constants test | `tests/unit/features/history/views/historyViewConstants.test.ts` | CREATE | Tests for `sortTransactionsWithinGroups()` -- date sort, total sort, merchant sort, ascending/descending (~80 lines) |
| Hook test | `tests/unit/features/history/views/useCollapsibleHeader.test.ts` | CREATE | Tests for collapse/expand behavior on scroll (~60 lines) |

### Files That Do NOT Change

| File | Reason |
|------|--------|
| `src/features/history/views/useHistoryViewData.ts` | Data hook -- no changes needed |
| `src/features/history/views/index.ts` | Views barrel -- no new view-level public exports needed (constants and hook are internal to the view) |
| `src/features/history/index.ts` | Feature barrel -- no changes needed |
| `tests/unit/components/HistoryViewThumbnails.test.tsx` | External consumer test -- resolves via shims, unaffected by internal decomposition |
| `tests/unit/features/history/views/useHistoryViewData.test.ts` | Data hook test -- unaffected |

## Extraction Detail: What Moves Where

### historyViewConstants.ts (from HistoryView.tsx lines 63-150)

```
PAGE_SIZE_OPTIONS, PageSizeOption, DEFAULT_PAGE_SIZE
HistorySortKey, HISTORY_SORT_OPTIONS, DEFAULT_HISTORY_SORT_KEY, DEFAULT_HISTORY_SORT_DIRECTION
sortTransactionsWithinGroups()
```

Imports needed: `import type { Transaction } from '@/types/transaction'` and `import type { SortOption } from '@features/history/components/SortControl'`

### useCollapsibleHeader.ts (from HistoryView.tsx lines 260-341)

```
isHeaderCollapsed state
containerRef, scrollContainerRef refs
lastScrollY ref, lastCollapseTime ref
scrollThreshold, scrollDeltaThreshold constants
Scroll detection useEffect (findScrollParent + handleScroll)
```

Returns: `{ isHeaderCollapsed, containerRef, scrollContainerRef }`

### HistoryHeader.tsx (from HistoryView.tsx lines 605-813)

The entire `<div className="sticky px-4" ...>` block including:
- Fixed header row (back button, title, icon filter bar, profile avatar/dropdown)
- Collapsible section (search bar, temporal breadcrumb, filter count + sort control + export button, filter chips, duplicate filter chip)

### HistoryPagination.tsx (from HistoryView.tsx lines 1044-1141)

The entire pagination `<div className="flex flex-col items-center gap-3 mt-6">` block including:
- Page navigation arrows + page indicator
- Page size selector (15/30/60)
- Load more button
- End of history indicator

### HistoryEmptyStates.tsx (from HistoryView.tsx lines 874-938)

Both empty-state `<TransitionChild>` blocks:
- No transactions at all (with scan prompt button)
- No matching filters / no duplicates

## Tasks / Subtasks

### Task 1: Establish test baseline (1 subtask)

- [x]1.1 Run `npm run test:quick` and record pass count. Run `npx vitest run tests/unit/components/HistoryViewThumbnails.test.tsx` specifically. Save output as baseline reference.

### Task 2: Extract constants and pure helpers (5 subtasks)

- [x]2.1 Create `src/features/history/views/historyViewConstants.ts` with: `PAGE_SIZE_OPTIONS`, `PageSizeOption`, `DEFAULT_PAGE_SIZE`, `HistorySortKey`, `HISTORY_SORT_OPTIONS`, `DEFAULT_HISTORY_SORT_KEY`, `DEFAULT_HISTORY_SORT_DIRECTION`, `sortTransactionsWithinGroups()`
- [x]2.2 Add `import type { Transaction } from '@/types/transaction'` and `import type { SortOption } from '@features/history/components/SortControl'` to the constants file
- [x]2.3 Update HistoryView.tsx: remove inline constants/function, add `import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, HISTORY_SORT_OPTIONS, DEFAULT_HISTORY_SORT_KEY, DEFAULT_HISTORY_SORT_DIRECTION, sortTransactionsWithinGroups } from './historyViewConstants'` and `import type { HistorySortKey, PageSizeOption } from './historyViewConstants'`
- [x]2.4 Create `tests/unit/features/history/views/historyViewConstants.test.ts` -- test `sortTransactionsWithinGroups` with date/total/merchant keys, asc/desc directions
- [x]2.5 Run `npx tsc --noEmit` -- verify no type errors

### Task 3: Extract useCollapsibleHeader hook (4 subtasks)

- [x]3.1 Create `src/features/history/views/useCollapsibleHeader.ts` -- extract the scroll detection `useEffect`, `lastScrollY` ref, `lastCollapseTime` ref, `scrollThreshold`/`scrollDeltaThreshold` constants, `isHeaderCollapsed` state, `containerRef`, and `scrollContainerRef` into a hook returning `{ isHeaderCollapsed, containerRef, scrollContainerRef }`
- [x]3.2 Update HistoryView.tsx: remove inline scroll logic, replace with `const { isHeaderCollapsed, containerRef, scrollContainerRef } = useCollapsibleHeader()`
- [x]3.3 Create `tests/unit/features/history/views/useCollapsibleHeader.test.ts` -- test that hook returns initial state (not collapsed) and returns refs
- [x]3.4 Run `npx tsc --noEmit` -- verify no type errors

### Task 4: Extract UI sub-components (6 subtasks)

- [x]4.1 Create `src/features/history/components/HistoryEmptyStates.tsx` -- extract the two empty-state JSX blocks. Define `HistoryEmptyStatesProps` interface with: `hasActiveFilters`, `showDuplicatesOnly`, `transactionsToDisplayLength`, `lang`, `t`
- [x]4.2 Create `src/features/history/components/HistoryPagination.tsx` -- extract pagination controls JSX. Define `HistoryPaginationProps` interface with: `currentPage`, `totalFilteredPages`, `pageSize`, `goToPage`, `setPageSize`, `lang`, `t`, `isAtListenerLimit`, `hasMore`, `isLoadingMore`, `onLoadMoreTransactions`, `pageSizeOptions`
- [x]4.3 Create `src/features/history/components/HistoryHeader.tsx` -- extract sticky header JSX (title bar + collapsible section). Define `HistoryHeaderProps` interface grouping related props
- [x]4.4 Update HistoryView.tsx: replace extracted JSX blocks with `<HistoryHeader ... />`, `<HistoryEmptyStates ... />`, `<HistoryPagination ... />`
- [x]4.5 Update `src/features/history/components/index.ts` -- add exports for `HistoryHeader`, `HistoryPagination`, `HistoryEmptyStates`
- [x]4.6 Run `npx tsc --noEmit` -- verify no type errors

### Task 5: Verification and cleanup (5 subtasks)

- [x]5.1 Run `npm run test:quick` -- all tests pass, compare with Task 1 baseline
- [x]5.2 Run `npx vitest run tests/unit/components/HistoryViewThumbnails.test.tsx` -- existing tests still pass
- [x]5.3 Count lines: `wc -l src/features/history/views/HistoryView.tsx` must be < 800; verify each new file < 400
- [x]5.4 Count imports: `grep -c '^import' src/features/history/views/HistoryView.tsx` should show decreased unique sources (target ~18, down from 28)
- [x]5.5 Run `npx madge --circular src/features/history/` -- verify 0 circular dependencies

## Dev Notes

### Architecture Guidance

**Extraction order matters.** Follow this sequence to minimize risk:
1. **Constants/helpers first** (Task 2) -- pure functions, zero risk, easy to verify
2. **Hook second** (Task 3) -- self-contained side effect, moderate risk (hook call order)
3. **UI components last** (Task 4) -- JSX extraction, highest surface area but no logic change

**Props vs hooks in sub-components.** Extracted sub-components (`HistoryHeader`, `HistoryPagination`, `HistoryEmptyStates`) must receive ALL data via props. They must NOT call hooks directly. This keeps them as pure presentation components and avoids hook-order issues. The only exception is `useCollapsibleHeader`, which is a new hook extracted FROM the parent and called IN the parent.

**Component boundary decisions:**
- `HistoryHeader` is the largest extraction (~200 lines). It includes the collapsible section because that section's visibility is controlled by `isHeaderCollapsed`, which comes from the parent.
- `HistoryPagination` is a clean extraction -- all pagination UI is contiguous in the JSX.
- `HistoryEmptyStates` bundles two related blocks that are mutually exclusive.

**What stays in HistoryView.** The filtering/pagination memo chain stays in HistoryView because it drives the transaction list rendering, which is the component's core purpose.

### Critical Pitfalls

1. **Hook call order.** When extracting `useCollapsibleHeader`, ensure it is called at the same position in the component body (before any conditional returns). React enforces stable hook call order.

2. **Ref forwarding.** `containerRef` is used both by the scroll detection hook AND as the `ref` on the container `<div>`. The hook must return the ref so the parent can attach it. Do NOT create a second ref.

3. **`scrollContainerRef` sharing.** The `scrollContainerRef` is used by the scroll detection hook AND by `scrollToTop`/`goToPage`/the load-more-complete effect. The hook must return this ref so HistoryView can use it in those callbacks.

4. **Import of `SortOption` type.** The `HISTORY_SORT_OPTIONS` array has type `SortOption[]`, imported from `@features/history/components/SortControl`. Use `import type` in the constants file.

5. **`console.error` calls** in catch blocks are allowed by the pre-edit hook. Do not change them.

6. **The `as any` casts** scattered throughout are pre-existing tech debt. Do NOT fix them in this story.

7. **`TransitionChild` import in HistoryEmptyStates.** The empty states use `TransitionChild` wrappers. Have the empty states component import it directly from `@/components/animation/TransitionChild`.

8. **Lucide icon imports will split.** Each extracted file should import only the icons it uses -- do not leave all icons in HistoryView.tsx.

## ECC Analysis Summary

- **Risk Level:** LOW -- pure structural decomposition, no behavior changes
- **Complexity:** Moderate -- 5 new files, 2 modified files, JSX extraction requires careful prop threading
- **Sizing:** 5 tasks / 21 subtasks / 9 files (within 6-task / 25-subtask / 10-file limits)
- **Agents consulted:** Architect
- **Dependencies:** Story 15b-1d (consolidate-history) must be DONE (completed 2026-02-14)
- **Pattern reference:** 15b-2a (decompose-edit-view) -- same approach, similar scope

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft |
| 2026-02-23 | Complete rewrite. Full architecture discovery: analyzed 1,169-line source, identified 5 extraction targets (constants, hook, 3 sub-components), specified 9 files, 21 subtasks. Replaces minimal draft. |
| 2026-02-24 | ECC Code Review: APPROVE 9/10. Fixed: HistoryHeader.tsx sibling imports (AC-ARCH-PATTERN-3). Pre-existing LOW: searchQuery sanitization, duplicateCount validation (not introduced by this story). Agents: code-reviewer, security-reviewer. |
