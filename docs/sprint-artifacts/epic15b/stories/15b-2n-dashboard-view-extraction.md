# Story 15b-2n: DashboardView Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Overview

DashboardView.tsx is currently 1,485 lines with 31 import dependencies. Epic 15 already extracted 10 sub-files (types, data hook, chart helpers, category helpers, radar slide, bump slide, treemap card, full list view, recientes section, barrel index), reducing it from approximately 2,800 lines. The remaining 1,485 lines contain month navigation state/handlers, carousel swipe logic, treemap-cell-click navigation payload construction, and the carousel header JSX -- all of which are extractable without behavior change. Target: reduce DashboardView.tsx to under 1,200 lines.

## Functional Acceptance Criteria

- [ ] **AC1:** DashboardView.tsx reduced to <1,200 lines (from 1,485)
- [ ] **AC2:** Each extracted file is <400 lines
- [ ] **AC3:** All existing tests pass before AND after extraction (including `tests/unit/views/DashboardView.test.tsx`)
- [ ] **AC4:** No new functionality added -- pure decomposition
- [ ] **AC5:** Fan-out of DashboardView.tsx decreased from 31
- [ ] **AC6:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Month navigation hook at `src/features/dashboard/views/DashboardView/useDashboardMonthNavigation.ts`
- [ ] **AC-ARCH-LOC-2:** Navigation payload builder at `src/features/dashboard/views/DashboardView/dashboardNavigationHelpers.ts`
- [ ] **AC-ARCH-LOC-3:** Carousel header component at `src/features/dashboard/views/DashboardView/DashboardCarouselHeader.tsx`
- [ ] **AC-ARCH-LOC-4:** Hook tests at `tests/unit/features/dashboard/views/DashboardView/useDashboardMonthNavigation.test.ts`
- [ ] **AC-ARCH-LOC-5:** Navigation helper tests at `tests/unit/features/dashboard/views/DashboardView/dashboardNavigationHelpers.test.ts`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** All extracted files use `@/` or `@features/` path aliases for external imports -- zero `../../` relative imports
- [ ] **AC-ARCH-PATTERN-2:** DashboardView.tsx imports extracted modules via relative `./` paths (same directory)
- [ ] **AC-ARCH-PATTERN-3:** `dashboardNavigationHelpers.ts` contains ONLY pure functions and type definitions -- no React imports, no hooks, no side effects
- [ ] **AC-ARCH-PATTERN-4:** `useDashboardMonthNavigation.ts` follows React custom hook pattern (function name starts with `use`, returns object with state values and handlers)
- [ ] **AC-ARCH-PATTERN-5:** `DashboardCarouselHeader` accepts props -- no direct store access or context consumption
- [ ] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/dashboard/views/DashboardView/`

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No circular dependency -- extracted files must NOT import from `@features/dashboard` barrel or `@features/dashboard/views/DashboardView` barrel (index.ts)
- [ ] **AC-ARCH-NO-2:** No new `console.log` statements in extracted files
- [ ] **AC-ARCH-NO-3:** No `: any` types in extracted files -- use proper TypeScript types from `./types`
- [ ] **AC-ARCH-NO-4:** No state lifting -- only month-navigation-specific state moves to the hook; animation/tooltip state stays in DashboardView
- [ ] **AC-ARCH-NO-5:** No feature barrel modification -- `src/features/dashboard/views/DashboardView/index.ts` continues to export only `DashboardView` and `useDashboardViewData`

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| DashboardView.tsx | `src/features/dashboard/views/DashboardView/DashboardView.tsx` | Reduce from 1,485 to ~1,150 lines; import from extracted files |

### New Files

| File/Component | Exact Path | Pattern | Est. Lines |
|----------------|------------|---------|------------|
| useDashboardMonthNavigation.ts | `src/features/dashboard/views/DashboardView/useDashboardMonthNavigation.ts` | Custom hook | ~130 |
| dashboardNavigationHelpers.ts | `src/features/dashboard/views/DashboardView/dashboardNavigationHelpers.ts` | Pure functions | ~100 |
| DashboardCarouselHeader.tsx | `src/features/dashboard/views/DashboardView/DashboardCarouselHeader.tsx` | React FC sub-component | ~110 |
| useDashboardMonthNavigation.test.ts | `tests/unit/features/dashboard/views/DashboardView/useDashboardMonthNavigation.test.ts` | Hook test (renderHook) | ~120 |
| dashboardNavigationHelpers.test.ts | `tests/unit/features/dashboard/views/DashboardView/dashboardNavigationHelpers.test.ts` | Unit test | ~100 |

### Unchanged Files (verified no modification needed)

| File | Exact Path | Reason |
|------|------------|--------|
| index.ts | `src/features/dashboard/views/DashboardView/index.ts` | Sub-files are internal; barrel stays unchanged |
| DashboardView.test.tsx | `tests/unit/views/DashboardView.test.tsx` | Tests interact via DashboardView public API; no change needed |
| All 10 existing sub-files | `src/features/dashboard/views/DashboardView/*.ts(x)` | Already extracted in Epic 15; no changes |

## Tasks / Subtasks

### Task 1: Establish baseline

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 Run `npx vitest run tests/unit/views/DashboardView.test.tsx` and confirm all pass
- [ ] 1.3 Count current DashboardView.tsx lines: `wc -l src/features/dashboard/views/DashboardView/DashboardView.tsx` (expect 1,485)
- [ ] 1.4 Record current fan-out: count import lines in DashboardView.tsx (expect ~31 import statements)

### Task 2: Extract month navigation hook into useDashboardMonthNavigation.ts

- [ ] 2.1 Create `src/features/dashboard/views/DashboardView/useDashboardMonthNavigation.ts`
- [ ] 2.2 Define `UseDashboardMonthNavigationProps` interface: `lang: string`, `t: (key: string) => string`, `formatCurrency: (amount: number, currency: string) => string`, `currency: string`, `resetSlideState: () => void`
- [ ] 2.3 Move `selectedMonth` + `setSelectedMonth` useState to the hook
- [ ] 2.4 Move `selectedMonthString` useMemo to the hook
- [ ] 2.5 Move `goToPrevMonth`, `goToNextMonth`, `goToCurrentMonth` useCallback handlers to the hook; these call `resetSlideState()` prop instead of directly accessing animation/tooltip setters
- [ ] 2.6 Move `isViewingCurrentMonth`, `canGoToNextMonth` useMemo computations to the hook
- [ ] 2.7 Move `formatMonth`, `formattedMonthName`, `prevMonthName`, `nextMonthName` computations to the hook
- [ ] 2.8 Move `formatCompactAmount` useCallback to the hook
- [ ] 2.9 Move month swipe state (`monthTouchStart`, `monthSwipeOffset`) and handlers (`onMonthTouchStart`, `onMonthTouchMove`, `onMonthTouchEnd`) to the hook
- [ ] 2.10 Return all state values and handlers; export the hook and its types
- [ ] 2.11 Update DashboardView.tsx: provide `resetSlideState` callback that resets `animationKey`, `selectedRadarCategory`, `bumpTooltip`; call `useDashboardMonthNavigation()` and destructure returned values
- [ ] 2.12 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 2.13 Create `tests/unit/features/dashboard/views/DashboardView/useDashboardMonthNavigation.test.ts` with renderHook tests for prev/next/current navigation, boundary checks, and formatMonth output

### Task 3: Extract treemap-cell-click navigation builder into dashboardNavigationHelpers.ts

- [ ] 3.1 Create `src/features/dashboard/views/DashboardView/dashboardNavigationHelpers.ts`
- [ ] 3.2 Extract `buildTreemapCellNavigationPayload` pure function from the `handleTreemapCellClick` useCallback body. Params: `categoryName: string`, `treemapViewMode: TreemapViewMode`, `selectedMonth: { year: number; month: number }`, `selectedMonthString: string`, `countMode`, and the four "Otro" category arrays. Returns `HistoryNavigationPayload`.
- [ ] 3.3 Import types from analytics navigation helpers and from `@/config/categoryColors`
- [ ] 3.4 Update DashboardView.tsx `handleTreemapCellClick` useCallback: replace inline body with a call to `buildTreemapCellNavigationPayload()` from `./dashboardNavigationHelpers`
- [ ] 3.5 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 3.6 Create `tests/unit/features/dashboard/views/DashboardView/dashboardNavigationHelpers.test.ts` with tests for all 4 view modes and the "Mas" aggregated group expansion

### Task 4: Extract DashboardCarouselHeader component

- [ ] 4.1 Create `src/features/dashboard/views/DashboardView/DashboardCarouselHeader.tsx`
- [ ] 4.2 Define `DashboardCarouselHeaderProps` interface: month navigation props (formattedMonthName, prevMonthName, nextMonthName, isViewingCurrentMonth, canGoToNextMonth, goToCurrentMonth, monthSwipeOffset, monthTouchStart, onMonthTouchStart, onMonthTouchMove, onMonthTouchEnd), view mode props (treemapViewMode, onViewModeChange, lang), count mode props (countMode, toggleCountMode)
- [ ] 4.3 Extract the carousel header JSX (the `<div>` block containing month swipe area, view mode pills, and count toggle button) into the component
- [ ] 4.4 Move `VIEW_MODE_CONFIG` rendering logic and relevant icon imports into the new component (import `VIEW_MODE_CONFIG` from `./types`)
- [ ] 4.5 Note: `onViewModeChange` callback should call both `setTreemapViewMode` AND `setAnimationKey(prev => prev + 1)` in DashboardView -- do NOT pass `setAnimationKey` directly
- [ ] 4.6 Update DashboardView.tsx: replace inline header JSX with `<DashboardCarouselHeader ... />`
- [ ] 4.7 Run `npx tsc --noEmit` -- fix any type errors

### Task 5: Verify extraction and run full test suite

- [ ] 5.1 Count final DashboardView.tsx lines: `wc -l src/features/dashboard/views/DashboardView/DashboardView.tsx` (target: <1,200)
- [ ] 5.2 Verify all extracted files are <400 lines each
- [ ] 5.3 Verify no `../../` imports: `grep -rE "from '\.\./\.\." src/features/dashboard/views/DashboardView/useDashboardMonthNavigation.ts src/features/dashboard/views/DashboardView/dashboardNavigationHelpers.ts src/features/dashboard/views/DashboardView/DashboardCarouselHeader.tsx` returns 0
- [ ] 5.4 Verify no circular deps: `npx madge --circular src/features/dashboard/views/DashboardView/`
- [ ] 5.5 Run `npm run test:quick` -- all tests pass
- [ ] 5.6 Run `npx vitest run tests/unit/views/DashboardView.test.tsx` -- all tests pass
- [ ] 5.7 Record final import count in DashboardView.tsx -- must be lower than 31

## Dev Notes

### Architecture Guidance

**Extraction 1 -- useDashboardMonthNavigation hook:** This hook encapsulates all month-related state (selectedMonth, selectedMonthString, monthTouchStart, monthSwipeOffset) and derived values. The tricky part is that `goToPrevMonth`, `goToNextMonth`, and `goToCurrentMonth` also call `setAnimationKey(prev => prev + 1)`, `setSelectedRadarCategory(null)`, and `setBumpTooltip(null)`. Rather than moving those unrelated state setters into the hook, pass a `resetSlideState: () => void` callback. The hook calls it inside each navigation handler. This keeps animation/tooltip state in DashboardView while keeping month navigation self-contained.

**Extraction 2 -- dashboardNavigationHelpers.ts:** The `handleTreemapCellClick` callback is 88 lines of pure payload construction logic. The `useCallback` wrapper in DashboardView becomes a thin shell: `const handleTreemapCellClick = useCallback((name: string) => { if (!onNavigateToHistory) return; onNavigateToHistory(buildTreemapCellNavigationPayload(...)); }, [...]);`

**Extraction 3 -- DashboardCarouselHeader component:** Lines forming the carousel card header are self-contained presentation with no internal state mutation beyond what is passed as callbacks. Import fan-out reduction: after extraction, DashboardView no longer needs `ChevronLeft`, `ChevronRight`, `Receipt`, `Package` from lucide-react or the category expansion helpers -- those move into the sub-files.

### Critical Pitfalls

1. **resetSlideState callback pattern:** The month navigation hook must NOT own `animationKey`, `selectedRadarCategory`, or `bumpTooltip` state. Pass a `resetSlideState` callback from DashboardView that resets those values. This avoids circular state dependencies.

2. **Month swipe offset is used in JSX:** The `monthSwipeOffset` and `monthTouchStart` values are used in the carousel header JSX for transform and transition styling. The hook must return these so `DashboardCarouselHeader` can read them.

3. **VIEW_MODE_CONFIG location:** `DashboardCarouselHeader` imports `VIEW_MODE_CONFIG` from `./types` (same directory). This is a sibling relative import.

4. **handleTreemapCellClick dependencies on "Otro" arrays:** The extracted `buildTreemapCellNavigationPayload` function needs the four "Otro" category arrays that come from category data useMemos remaining in DashboardView. Pass them as function parameters.

5. **Test file location:** The main DashboardView test is at `tests/unit/views/DashboardView.test.tsx` (legacy location). New tests go in `tests/unit/features/dashboard/views/DashboardView/`. Do NOT move the main test file.

6. **setAnimationKey in DashboardCarouselHeader:** View mode pill buttons call `setAnimationKey`. Pass an `onViewModeChange` callback that triggers both `setTreemapViewMode` and `setAnimationKey` in DashboardView, rather than passing `setAnimationKey` directly.

## ECC Analysis Summary

- **Risk Level:** LOW (plateaued view, 10 prior extractions, pure decomposition)
- **Complexity:** Moderate -- 3 extractions (1 hook, 1 pure functions file, 1 sub-component), 2 new test files
- **Sizing:** 5 tasks / 20 subtasks / 8 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- DashboardView is self-contained; all 10 existing sub-files remain unchanged

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft |
| 2026-02-23 | Full rewrite. Source analysis of DashboardView.tsx (1,485 lines, 31 imports, 10 existing sub-files from Epic 15). 3 extraction targets: useDashboardMonthNavigation.ts (~130L hook), dashboardNavigationHelpers.ts (~100L pure functions), DashboardCarouselHeader.tsx (~110L sub-component). Target residual: ~1,150 lines. 11 architectural ACs, 5 tasks, 20 subtasks, 8 files. |
