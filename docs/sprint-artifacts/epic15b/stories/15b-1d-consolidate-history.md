# Story 15b-1d: Consolidate features/history/

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Move HistoryView.tsx (1,168 lines, flat file) and useHistoryViewData.ts (308 lines, in subdirectory) from `src/views/` into `src/features/history/views/`. Create re-export shims at old locations for backward compatibility. Move test file alongside source. Update feature barrel. Follows the shim-based pattern from 15b-1a, 15b-1b, and 15b-1c.

**Key correction from ECC analysis:** The original draft incorrectly included `useHistoryFilters.ts` and `historyFilterUtils.ts` as files to move. These are CROSS-FEATURE shared utilities used by 4+ features (history, dashboard, analytics, items) with 15+ consumers — they MUST remain in `@shared/`. Only HistoryView source files and the data hook move.

## Functional Acceptance Criteria

- [x] **AC1:** HistoryView.tsx moved to `src/features/history/views/HistoryView.tsx`
- [x] **AC2:** useHistoryViewData.ts moved to `src/features/history/views/useHistoryViewData.ts`
- [x] **AC3:** All 12 `../` relative imports in HistoryView.tsx converted to `@/` path aliases
- [x] **AC4:** Internal import updated: `./HistoryView/useHistoryViewData` → `./useHistoryViewData`
- [x] **AC5:** Re-export shims at old locations (`src/views/HistoryView.tsx` + `src/views/HistoryView/useHistoryViewData.ts`)
- [x] **AC6:** Test file moved to `tests/unit/features/history/views/useHistoryViewData.test.ts`
- [x] **AC7:** Feature barrel `src/features/history/index.ts` updated with views export
- [x] **AC8:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** HistoryView.tsx at `src/features/history/views/HistoryView.tsx`
- [x] **AC-ARCH-LOC-2:** useHistoryViewData.ts at `src/features/history/views/useHistoryViewData.ts`
- [x] **AC-ARCH-LOC-3:** Views sub-barrel at `src/features/history/views/index.ts`
- [x] **AC-ARCH-LOC-4:** Barrel re-export shim at `src/views/HistoryView.tsx`
- [x] **AC-ARCH-LOC-5:** Deep re-export shim at `src/views/HistoryView/useHistoryViewData.ts`
- [x] **AC-ARCH-LOC-6:** Test at `tests/unit/features/history/views/useHistoryViewData.test.ts`
- [x] **AC-ARCH-LOC-7:** No HistoryView source files remain at old locations except the 2 shim files

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD barrel chain — `features/history/index.ts` → `views/index.ts` → `HistoryView.tsx` + `useHistoryViewData.ts`
- [x] **AC-ARCH-PATTERN-2:** Re-export shims at old locations — 4 external consumers resolved without modification
- [x] **AC-ARCH-PATTERN-3:** All moved source files use `@/` aliases for external imports — zero `../` relative imports remain
- [x] **AC-ARCH-PATTERN-4:** Internal `./useHistoryViewData` import from HistoryView preserved (same directory after move)
- [x] **AC-ARCH-PATTERN-5:** Test directory mirrors source: `tests/unit/features/history/views/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency — HistoryView must NOT import from history barrel (`@features/history`); must use deep paths (`@features/history/components/*`)
- [x] **AC-ARCH-NO-2:** No stale mock paths — `grep -r '@/views/HistoryView' tests/unit/features/history/` returns 0
- [x] **AC-ARCH-NO-3:** No `../` relative imports in moved source files (only internal `./` allowed)
- [x] **AC-ARCH-NO-4:** Shim files contain ONLY re-export statements — no business logic
- [x] **AC-ARCH-NO-5:** No behavior changes — pure structural refactoring; zero function/prop/return type changes
- [x] **AC-ARCH-NO-6:** Cross-feature shared modules (`useHistoryFilters`, `historyFilterUtils`, `useHistoryFiltersStore`) must NOT be moved

## File Specification

### Target Directory Structure

```
src/features/history/
  index.ts                    # MODIFY: add './views' export
  components/
    index.ts + 16 components  # UNCHANGED
  views/                      # NEW directory
    HistoryView.tsx            # MOVED + MODIFIED (12 import conversions)
    useHistoryViewData.ts      # MOVED (no import changes needed)
    index.ts                   # NEW: views barrel

src/views/
  HistoryView.tsx              # REPLACED: re-export shim (was 1,168-line source)
  HistoryView/
    useHistoryViewData.ts      # REPLACED: re-export shim (was 308-line source)

tests/unit/features/history/views/  # NEW directory
  useHistoryViewData.test.ts        # MOVED + import path updated
```

### File Action Table

| File/Component | Exact Path | Action | AC Reference |
|----------------|------------|--------|--------------|
| HistoryView.tsx | `src/features/history/views/HistoryView.tsx` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| useHistoryViewData.ts | `src/features/history/views/useHistoryViewData.ts` | MOVE | AC-ARCH-LOC-2 |
| Views sub-barrel | `src/features/history/views/index.ts` | CREATE | AC-ARCH-LOC-3 |
| Barrel shim | `src/views/HistoryView.tsx` | REPLACE (shim) | AC-ARCH-LOC-4 |
| Deep shim | `src/views/HistoryView/useHistoryViewData.ts` | REPLACE (shim) | AC-ARCH-LOC-5 |
| Hook test | `tests/unit/features/history/views/useHistoryViewData.test.ts` | MOVE + MODIFY | AC-ARCH-LOC-6 |
| Feature barrel | `src/features/history/index.ts` | MODIFY | AC7 |

### External Consumers (resolved by shims — NO changes needed)

| Consumer | Import Path | Shim |
|----------|-------------|------|
| `src/App.tsx` line 74 | `'./views/HistoryView'` | Barrel shim |
| `src/components/App/viewRenderers.tsx` line 36 | `'../../views/HistoryView'` | Barrel shim |
| `tests/unit/components/App/viewRenderers.test.tsx` line 38 | `vi.mock('../../../../src/views/HistoryView')` | Barrel shim |
| `tests/unit/components/HistoryViewThumbnails.test.tsx` lines 17,53,88-89 | Type + mock + value imports for both files | Barrel shim + Deep shim |

### Files That Do NOT Move

| File | Reason |
|------|--------|
| `src/shared/hooks/useHistoryFilters.ts` | Cross-feature: 8+ consumers across 4 features |
| `src/shared/utils/historyFilterUtils.ts` | Cross-feature: 15+ consumers across 4+ features |
| `src/shared/stores/useHistoryFiltersStore.ts` | Cross-feature: shared Zustand store |
| `tests/unit/components/HistoryViewThumbnails.test.tsx` | External consumer test — resolves via shims, no benefit to moving |
| `tests/unit/utils/historyFilterUtils.*.test.ts` | Tests for shared utility that stays in @shared/ |

## Tasks / Subtasks

### Task 1: Move source files and fix imports (2 files)

- [x] 1.1 Create target directory `src/features/history/views/`
- [x] 1.2 `git mv src/views/HistoryView/useHistoryViewData.ts src/features/history/views/useHistoryViewData.ts`
- [x] 1.3 Remove empty directory `rmdir src/views/HistoryView/` (will be recreated for shim)
- [x] 1.4 `git mv src/views/HistoryView.tsx src/features/history/views/HistoryView.tsx`
- [x] 1.5 Convert 12 `../` imports to `@/` aliases in HistoryView.tsx (see import table below)
- [x] 1.6 Update internal import: `./HistoryView/useHistoryViewData` → `./useHistoryViewData`
- [x] 1.7 Run `npx tsc --noEmit` — fix any type errors before proceeding

### Task 2: Create re-export shims and update barrels (4 files)

- [x] 2.1 Create views sub-barrel at `src/features/history/views/index.ts`
- [x] 2.2 Update `src/features/history/index.ts` — add `export * from './views'`
- [x] 2.3 Create barrel shim at `src/views/HistoryView.tsx` (re-exports `HistoryView` from `@features/history/views/HistoryView`)
- [x] 2.4 Create directory `src/views/HistoryView/` and deep shim at `src/views/HistoryView/useHistoryViewData.ts` (re-exports hook + types)
- [x] 2.5 Run `npx tsc --noEmit` — verify shims resolve correctly

### Task 3: Move test file and fix import path (1 file)

- [x] 3.1 Create target directory `tests/unit/features/history/views/`
- [x] 3.2 `git mv tests/unit/views/HistoryView/useHistoryViewData.test.ts tests/unit/features/history/views/useHistoryViewData.test.ts`
- [x] 3.3 Remove empty directory `rmdir tests/unit/views/HistoryView/`
- [x] 3.4 Update import: `@/views/HistoryView/useHistoryViewData` → `@features/history/views/useHistoryViewData`
- [x] 3.5 Run `npx vitest run tests/unit/features/history/views/useHistoryViewData.test.ts` — fix any failures

### Task 4: Verification and cleanup

- [x] 4.1 Grep: `grep -rE "from '\.\./\.\." src/features/history/views/` returns 0 matches
- [x] 4.2 Grep: `grep -r '@/views/HistoryView' tests/unit/features/history/` returns 0 matches
- [x] 4.3 Verify external consumer: `npx vitest run tests/unit/components/HistoryViewThumbnails.test.tsx`
- [x] 4.4 Verify external consumer: `npx vitest run tests/unit/components/App/viewRenderers.test.tsx`
- [x] 4.5 Run `npm run test:quick` — all tests pass
- [x] 4.6 Verify no circular deps: `npx madge --circular src/features/history/`

## HistoryView.tsx Import Conversion Table

| Line | Current Import | New Import |
|------|---------------|------------|
| 21 | `'../components/ProfileDropdown'` | `'@/components/ProfileDropdown'` |
| 22 | `'../components/ImageViewer'` | `'@/components/ImageViewer'` |
| 27 | `'../components/transactions'` | `'@/components/transactions'` |
| 37 | `'../components/animation/PageTransition'` | `'@/components/animation/PageTransition'` |
| 38 | `'../components/animation/TransitionChild'` | `'@/components/animation/TransitionChild'` |
| 40 | `'../services/duplicateDetectionService'` | `'@/services/duplicateDetectionService'` |
| 41 | `'../utils/transactionNormalizer'` | `'@/utils/transactionNormalizer'` |
| 47 | `'../hooks/useSwipeNavigation'` | `'@/hooks/useSwipeNavigation'` |
| 48 | `'../hooks/useReducedMotion'` | `'@/hooks/useReducedMotion'` |
| 49 | `'../hooks/useSelectionMode'` | `'@/hooks/useSelectionMode'` |
| 51 | `'../services/firestore'` | `'@/services/firestore'` |
| 55 | `'../utils/csvExport'` | `'@/utils/csvExport'` |
| 61 | `'./HistoryView/useHistoryViewData'` | `'./useHistoryViewData'` |

## Dev Notes

### Scope Clarification

This story moves ONLY 3 files (HistoryView.tsx, useHistoryViewData.ts, and the hook's test). `historyFilterUtils.ts`, `useHistoryFilters.ts`, and `useHistoryFiltersStore.ts` are cross-feature shared (used by DashboardView, TrendsView, ItemsView, ReportsView) and MUST remain in `@shared/`.

### Hybrid File/Directory Layout

Unlike sibling stories (15b-1a/1b/1c) where views are entire directories, HistoryView has a **hybrid layout**: a flat `.tsx` file AND a subdirectory of the same name. Move sequence matters:
1. Move `useHistoryViewData.ts` out of subdirectory first
2. Remove empty `src/views/HistoryView/` directory
3. Move `HistoryView.tsx` flat file
4. Recreate `src/views/HistoryView/` for the deep shim

### Circular Dependency Safety

HistoryView.tsx imports from `@features/history/components/*` using 8 deep paths (never the barrel). useHistoryViewData.ts imports zero `@features/history` modules. Adding both to the feature barrel creates NO circular dependency. Verify with `npx madge --circular src/features/history/`.

### Re-Export Shim Design

**Barrel shim** (`src/views/HistoryView.tsx`): Re-exports `HistoryView` — serves App.tsx, viewRenderers.tsx, and 2 tests.

**Deep shim** (`src/views/HistoryView/useHistoryViewData.ts`): Re-exports `useHistoryViewData`, `UseHistoryViewDataReturn`, `UserInfo` — serves HistoryViewThumbnails.test.tsx (which uses `vi.mock()` on this deep path).

### Tests That Stay Put

`HistoryViewThumbnails.test.tsx` resolves all imports/mocks via shims — moving it would require updating 6 import/mock paths for zero benefit. `historyFilterUtils.*.test.ts` files test a shared utility that stays in `@shared/`.

### E2E Testing

No E2E testing needed — pure structural refactoring with zero behavior changes.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Simple (3 files move, 12 import conversions, 2 shims)
- **Sizing:** SMALL (4 tasks, 16 subtasks, 9 file operations — within 2-point budget)
- **Agents consulted:** Planner, Architect
- **Pattern reference:** 15b-1a (consolidate-analytics), 15b-1b (consolidate-dashboard) — identical approach, smaller scope
- **Dependencies:** Story 15b-2c (decompose-history-view) depends on THIS story completing first

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft from ecc-create-epics-and-stories |
| 2026-02-14 | ECC create-story refinement: Planner + Architect analysis. Corrected scope — removed historyFilterUtils.ts and useHistoryFilters.ts (cross-feature shared, 15+ consumers across 4 features). Reduced to 3 files moved. Added architectural ACs, exact file specification, import conversion table, hybrid layout handling, 2 re-export shim designs |
| 2026-02-14 | ECC code review: APPROVE 10/10 — 18/18 architectural ACs pass, 0 quick fixes, 1 LOW pre-existing deferred to 15b-2c |

## Senior Developer Review (ECC)

- **Review date:** 2026-02-14
- **Classification:** STANDARD (2 agents)
- **ECC agents:** code-reviewer, security-reviewer
- **Outcome:** APPROVE 10/10
- **Architectural ACs:** 18/18 PASS (7 location + 5 pattern + 6 anti-pattern)
- **Findings:** 1 LOW pre-existing (searchQuery sanitization — display-only, deferred to 15b-2c)
- **Quick fixes applied:** 0
- **TD stories created:** 0
- **Session cost:** $6.75
