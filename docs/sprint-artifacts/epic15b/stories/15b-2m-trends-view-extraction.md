# Story 15b-2m: TrendsView Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 3
**Priority:** MEDIUM
**Status:** done

## Overview

Further decompose `TrendsView.tsx` (currently 1,981 lines with 36 import dependencies) which was already reduced from 5,901 lines in Epic 15 Phase 5b. TrendsView already has 19 co-located sub-files (types, helpers, hooks, chart components) extracted during prior work. This story targets the remaining inline logic: bidirectional filter sync (~220 lines), sticky header JSX (~186 lines), treemap slide JSX (~140 lines), sankey slide JSX (~110 lines), and category statistics popup logic (~150 lines). Target: TrendsView.tsx reduced to <1,200 lines. This is a PURE DECOMPOSITION -- no new features, no behavior changes.

## Functional Acceptance Criteria

- [x] **AC1:** TrendsView.tsx reduced to <1,200 lines (from 1,981)
- [x] **AC2:** Each extracted file is <400 lines
- [x] **AC3:** All existing tests pass before AND after extraction (including `tests/unit/views/TrendsView.polygon.test.tsx` and `tests/integration/analytics-workflows.test.tsx`)
- [x] **AC4:** No new functionality added -- pure decomposition
- [x] **AC5:** Fan-out of TrendsView.tsx decreased from 36
- [x] **AC6:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** Sync hook at `src/features/analytics/views/TrendsView/useTrendsViewSync.ts`
- [x] **AC-ARCH-LOC-2:** Header component at `src/features/analytics/views/TrendsView/TrendsHeader.tsx`
- [x] **AC-ARCH-LOC-3:** Treemap slide component at `src/features/analytics/views/TrendsView/TreemapSlide.tsx`
- [x] **AC-ARCH-LOC-4:** Sankey slide component at `src/features/analytics/views/TrendsView/SankeySlide.tsx`
- [x] **AC-ARCH-LOC-5:** Stats popup hook at `src/features/analytics/views/TrendsView/useCategoryStatsPopup.ts`
- [x] **AC-ARCH-LOC-6:** Sync hook tests at `tests/unit/features/analytics/views/TrendsView/useTrendsViewSync.test.ts`

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** All extracted files use `@/` or `@features/` path aliases for external imports -- zero `../../` relative imports
- [x] **AC-ARCH-PATTERN-2:** TrendsView.tsx imports extracted modules via relative `./` paths (same directory)
- [x] **AC-ARCH-PATTERN-3:** `useTrendsViewSync.ts` follows React custom hook pattern (function name starts with `use`, returns object with state + setters)
- [x] **AC-ARCH-PATTERN-4:** `useCategoryStatsPopup.ts` follows React custom hook pattern, returns popup state + handlers
- [x] **AC-ARCH-PATTERN-5:** Sub-components (`TrendsHeader`, `TreemapSlide`, `SankeySlide`) accept props -- no direct store access or context consumption
- [x] **AC-ARCH-PATTERN-6:** Shared types (`TimePeriod`, `CurrentPeriod`, `DonutViewMode`, `CategoryData`) imported from existing `./types` -- no type duplication
- [x] **AC-ARCH-PATTERN-7:** Test directory mirrors source: `tests/unit/features/analytics/views/TrendsView/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency -- extracted files must NOT import from `@features/analytics` barrel or from `./TrendsView`
- [x] **AC-ARCH-NO-2:** No new `console.log` statements in extracted files
- [x] **AC-ARCH-NO-3:** No `: any` types in extracted files -- use proper TypeScript types from `./types`
- [x] **AC-ARCH-NO-4:** No feature barrel modification -- `src/features/analytics/views/TrendsView/index.ts` continues to export only `TrendsView`, `TrendsViewProps`, `useTrendsViewData`, and `TrendsViewData`
- [x] **AC-ARCH-NO-5:** No state lifting -- all useState calls remain where they logically belong (sync state in useTrendsViewSync, popup state in useCategoryStatsPopup, remaining UI state in TrendsView)

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| TrendsView.tsx | `src/features/analytics/views/TrendsView/TrendsView.tsx` | Reduce from 1,981 to ~1,175 lines; import from 5 new extracted files |

### New Files

| File/Component | Exact Path | Pattern | Est. Lines |
|----------------|------------|---------|------------|
| useTrendsViewSync.ts | `src/features/analytics/views/TrendsView/useTrendsViewSync.ts` | Custom hook | ~220 |
| TrendsHeader.tsx | `src/features/analytics/views/TrendsView/TrendsHeader.tsx` | React FC sub-component | ~190 |
| TreemapSlide.tsx | `src/features/analytics/views/TrendsView/TreemapSlide.tsx` | React FC sub-component | ~160 |
| SankeySlide.tsx | `src/features/analytics/views/TrendsView/SankeySlide.tsx` | React FC sub-component | ~120 |
| useCategoryStatsPopup.ts | `src/features/analytics/views/TrendsView/useCategoryStatsPopup.ts` | Custom hook | ~160 |
| useTrendsViewSync.test.ts | `tests/unit/features/analytics/views/TrendsView/useTrendsViewSync.test.ts` | Hook test (renderHook) | ~120 |

### Unchanged Files (verify stability)

| File | Exact Path | Reason |
|------|------------|--------|
| index.ts | `src/features/analytics/views/TrendsView/index.ts` | Barrel -- no changes to public API |
| types.ts | `src/features/analytics/views/TrendsView/types.ts` | Types already extracted -- no additions needed |
| 19 existing sub-files | `src/features/analytics/views/TrendsView/*.ts(x)` | Already extracted in Epic 15 Phase 5b; no changes |
| TrendsView.polygon.test.tsx | `tests/unit/views/TrendsView.polygon.test.tsx` | Must continue passing unchanged |
| analytics-workflows.test.tsx | `tests/integration/analytics-workflows.test.tsx` | Must continue passing unchanged |

## Tasks / Subtasks

### Task 1: Establish baseline

- [x] 1.1 Run `npm run test:quick` and record total pass count
- [x] 1.2 Run `npx vitest run tests/unit/views/TrendsView.polygon.test.tsx` and confirm passes
- [x] 1.3 Count current TrendsView.tsx lines: `wc -l src/features/analytics/views/TrendsView/TrendsView.tsx` (expect 1,981)
- [x] 1.4 Record current fan-out: `npx depcruise --output-type text src/features/analytics/views/TrendsView/TrendsView.tsx | head -30`

### Task 2: Extract bidirectional sync hook into useTrendsViewSync.ts

- [x] 2.1 Create `src/features/analytics/views/TrendsView/useTrendsViewSync.ts`
- [x] 2.2 Define `UseTrendsViewSyncProps` interface with params: `transactions` (Transaction[]), `filterState` (HistoryFilterState), `filterDispatch`
- [x] 2.3 Move `timePeriod` + `setTimePeriodLocal` useState (lines ~195-201) into hook
- [x] 2.4 Move `currentPeriod` + `setCurrentPeriodLocal` useState (lines ~206-220) into hook
- [x] 2.5 Move `isUpdatingFromContext` ref (line ~223) into hook -- this ref MUST stay with both the sync effect and the wrapped setters
- [x] 2.6 Move the sync FROM context TO local state useEffect (lines ~230-289) into hook
- [x] 2.7 Move the wrapped `setTimePeriod` callback with cascade logic (lines ~294-409) into hook
- [x] 2.8 Move the wrapped `setCurrentPeriod` callback (lines ~412-446) into hook
- [x] 2.9 Move `carouselSlide` + `setCarouselSlideLocal` + wrapped `setCarouselSlide` (lines ~450-465) into hook
- [x] 2.10 Return all state values and setters: `{ timePeriod, setTimePeriod, currentPeriod, setCurrentPeriod, carouselSlide, setCarouselSlide }`
- [x] 2.11 Update TrendsView.tsx: call `useTrendsViewSync()` and destructure returned values
- [x] 2.12 Run `npx tsc --noEmit` -- fix any type errors
- [x] 2.13 Create `tests/unit/features/analytics/views/TrendsView/useTrendsViewSync.test.ts` with renderHook tests for cascade logic and localStorage persistence

### Task 3: Extract sticky header into TrendsHeader.tsx

- [x] 3.1 Create `src/features/analytics/views/TrendsView/TrendsHeader.tsx`
- [x] 3.2 Define `TrendsHeaderProps` interface with: `onBack`, `locale`, `userName`, `userEmail`, `isProfileOpen`, `setIsProfileOpen`, `profileButtonRef`, `handleProfileNavigate`, `theme`, `t`, `availableFilters`, `donutViewMode`, `setDonutViewMode`, `timePeriod`, `handleTimePeriodClick`, `isViewingCurrentPeriod`, `prefersReducedMotion`, `periodLabel`, `goPrevPeriod`, `goNextPeriod`
- [x] 3.3 Move the sticky header JSX block (lines ~1302-1488) into the component -- includes back button, title, IconFilterBar, ProfileDropdown, time period pills, and period navigator
- [x] 3.4 Import `ChevronLeft`, `ChevronRight` from `lucide-react`, `ProfileDropdown`/`ProfileAvatar`/`getInitials` from `@/components/ProfileDropdown`, `IconFilterBar` from `@features/history`
- [x] 3.5 Update TrendsView.tsx: replace inline header JSX with `<TrendsHeader ... />`
- [x] 3.6 Run `npx tsc --noEmit` -- fix any type errors

### Task 4: Extract treemap and sankey slides into sub-components

- [x] 4.1 Create `src/features/analytics/views/TrendsView/TreemapSlide.tsx`
- [x] 4.2 Define `TreemapSlideProps` interface with treemap drill-down state, category data, animation key, view mode, count mode, all handlers including `handleOpenStatsPopup`
- [x] 4.3 Move the treemap slide JSX block (lines ~1539-1679) including the IIFE for layout calculation as-is into the component -- do NOT refactor the IIFE
- [x] 4.4 Create `src/features/analytics/views/TrendsView/SankeySlide.tsx`
- [x] 4.5 Define `SankeySlideProps` interface with: `sankeySelectionData`, `locale`, `sankeyAnimationKey`, `sankeyContentWidth`, `sankeyVisible`, `sankeyScrollableRef`, `prefersReducedMotion`, `filteredTransactions`, `currency`, `sankeyMode`, `sankeySelectedNode`, `handleSankeySelectionChange`
- [x] 4.6 Move the sankey slide JSX block (lines ~1792-1901) into the component
- [x] 4.7 Note: `sankeyScrollableRef` is created in TrendsView.tsx and must remain there -- pass it as a prop to SankeySlide
- [x] 4.8 Update TrendsView.tsx: replace inline treemap and sankey JSX with `<TreemapSlide ... />` and `<SankeySlide ... />`
- [x] 4.9 Run `npx tsc --noEmit` -- fix any type errors

### Task 5: Extract category stats popup logic into useCategoryStatsPopup.ts

- [x] 5.1 Create `src/features/analytics/views/TrendsView/useCategoryStatsPopup.ts`
- [x] 5.2 Define `UseCategoryStatsPopupProps` interface with: `donutViewMode`, `treemapDrillDownLevel`, `locale`, `onNavigateToHistory`, `filteredTransactions`, `total`, `timePeriod`, `currentPeriod`
- [x] 5.3 Move `statsPopupOpen` + `statsPopupCategory` useState into hook
- [x] 5.4 Move `handleOpenStatsPopup` callback (with type resolution logic) into hook
- [x] 5.5 Move `handleCloseStatsPopup` callback into hook
- [x] 5.6 Move `handleStatsPopupViewHistory` callback (with navigation payload building) into hook
- [x] 5.7 Move `categoryStatistics` useMemo into hook
- [x] 5.8 Move `getTranslatedCategoryName` callback into hook
- [x] 5.9 Return all state and handlers: `{ statsPopupOpen, statsPopupCategory, handleOpenStatsPopup, handleCloseStatsPopup, handleStatsPopupViewHistory, categoryStatistics, getTranslatedCategoryName }`
- [x] 5.10 Update TrendsView.tsx: call `useCategoryStatsPopup()` and destructure; pass `handleOpenStatsPopup` as prop to `TreemapSlide`
- [x] 5.11 Note: `<CategoryStatisticsPopup>` JSX stays in TrendsView.tsx render -- only state/handlers move to hook
- [x] 5.12 Run `npx tsc --noEmit` -- fix any type errors

### Task 6: Verify extraction and run full test suite

- [x] 6.1 Count final TrendsView.tsx lines: `wc -l src/features/analytics/views/TrendsView/TrendsView.tsx` (target: <1,200)
- [x] 6.2 Verify all extracted files are <400 lines each
- [x] 6.3 Grep verification -- no grandparent relative imports: `grep -rE "from '\.\./\.\." src/features/analytics/views/TrendsView/` returns 0
- [x] 6.4 Verify no circular deps: `npx madge --circular src/features/analytics/views/TrendsView/`
- [x] 6.5 Run `npm run test:quick` -- all tests pass
- [x] 6.6 Run `npx vitest run tests/unit/views/TrendsView.polygon.test.tsx` -- passes
- [x] 6.7 Run `npx vitest run tests/integration/analytics-workflows.test.tsx` -- passes
- [x] 6.8 Record final fan-out with depcruise -- must be lower than baseline from Task 1.4

## Dev Notes

### Architecture Guidance

**Import rewiring strategy:** All 5 new files live in `src/features/analytics/views/TrendsView/` alongside the existing 19 sub-files. They import each other and existing sub-files via relative `./` paths. External imports use `@/` or `@features/` aliases.

**Sync hook design:** The `useTrendsViewSync` hook encapsulates the complex bidirectional synchronization between TrendsView's local period state and the HistoryFiltersContext. It owns `timePeriod`, `currentPeriod`, and `carouselSlide` state plus their persistence-aware wrapped setters. The cascade logic (Year->Quarter->Month->Week transitions) is the most complex piece (~115 lines). The hook receives `filterState` and `filterDispatch` from the parent to avoid consuming context directly (preserves testability).

**Stats popup hook design:** `useCategoryStatsPopup` encapsulates all popup state and logic. It receives drill-down state and view mode as params (not owning them) because those are shared with the treemap/trend sections. Returns popup open/close state, handlers, computed statistics, and the translation helper.

**Treemap IIFE pattern:** The treemap slide contains a self-invoking function expression for layout calculation. Move this IIFE as-is into `TreemapSlide.tsx`. Do NOT refactor it into a separate useMemo -- preserving existing patterns is the goal.

### Line Budget

| Section | Lines Extracted |
|---------|----------------|
| useTrendsViewSync (sync + state + setters) | ~220 |
| TrendsHeader (sticky header JSX) | ~186 |
| TreemapSlide (treemap layout + cells) | ~140 |
| SankeySlide (sankey view + title area) | ~110 |
| useCategoryStatsPopup (popup state + handlers) | ~150 |
| **Total extracted** | **~806** |
| **Residual TrendsView.tsx** | **~1,175** |

### Critical Pitfalls

1. **setCurrentPeriod uses timePeriod in closure:** The `setCurrentPeriod` callback references `timePeriod` from its closure. When moving into `useTrendsViewSync`, ensure `timePeriod` is the hook-internal state variable, not the returned value.

2. **isUpdatingFromContext ref prevents infinite loops:** This ref MUST stay in the same hook as both the sync effect and the wrapped setters. Do NOT split them across files.

3. **sankeyScrollableRef stays in TrendsView.tsx:** The `sankeyScrollableRef` is used by both the swipe handler attachment and the SankeySlide component. Pass it as a prop to SankeySlide.

4. **TrendsHeader period label swipe:** The period navigator has inline touch handlers for swipe. Pass `goPrevPeriod`/`goNextPeriod` as props to TrendsHeader.

5. **CategoryStatisticsPopup JSX stays in TrendsView.tsx:** Only the popup STATE and HANDLERS move to `useCategoryStatsPopup`. The `<CategoryStatisticsPopup>` JSX stays in TrendsView.tsx render.

6. **handleOpenStatsPopup is shared:** Both `TreemapSlide` and the trend list in TrendsView.tsx use `handleOpenStatsPopup`. It comes from `useCategoryStatsPopup` and is passed as props to `TreemapSlide`.

7. **Existing test file paths:** Tests live at legacy locations (`tests/unit/views/TrendsView.polygon.test.tsx`). Since the barrel is unchanged, these pass without modification.

## ECC Analysis Summary

- **Risk Level:** MEDIUM (large file with 19 existing sub-files, but pure decomposition)
- **Complexity:** Moderate -- 5 extractions (2 hooks + 3 sub-components), significant prop interface design
- **Sizing:** 6 tasks / 24 subtasks / 7 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- TrendsView.tsx is self-contained within the analytics feature

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft |
| 2026-02-23 | Full rewrite. Source analysis of TrendsView.tsx (1,981 lines, 19 existing sub-files from Epic 15 Phase 5b). 5 extraction targets: useTrendsViewSync.ts (~220L), TrendsHeader.tsx (~186L), TreemapSlide.tsx (~140L), SankeySlide.tsx (~110L), useCategoryStatsPopup.ts (~150L). Target residual: ~1,175 lines. 17 architectural ACs, 6 tasks, 24 subtasks, 7 files. |
| 2026-02-25 | ECC Code Review: APPROVE 7.9/10 (COMPLEX, 4 agents). Fixed: localStorage range validation, DOM dataset→useRef, 11 new test cases. Created TD-15b-21 for line count trim + runtime guards + i18n. |

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-02-25 |
| Classification | COMPLEX |
| Agents | code-reviewer, security-reviewer, architect, tdd-guide |
| Score | 7.9/10 |
| Outcome | APPROVE |
| Fixed | 6 items (localStorage validation, useRef refactor, 4 test files enhanced with 11 new tests) |
| Deferred | 5 items → TD-15b-21 (line count, runtime guards, i18n, useEffect deps) |

### Deferred Items Tracking

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-15b-21 | TrendsView line trim + runtime locale guard + i18n "Explora" + useEffect deps audit | LOW | CREATED |
