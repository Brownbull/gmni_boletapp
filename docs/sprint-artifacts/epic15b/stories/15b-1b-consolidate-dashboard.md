# Story 15b-1b: Consolidate features/dashboard/

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Move DashboardView directory (10 source files, ~3,400 lines) and test files (3 files, ~1,500 lines) into `features/dashboard/`. Replace the empty placeholder from Epic 15 Phase 4e with real barrel exports. Create re-export shims at old location for backward compatibility. Follows the same shim-based pattern established by story 15b-1a (consolidate-analytics).

**Key correction from draft:** No dashboard-specific hooks exist in `src/hooks/`. The only dashboard hook (`useDashboardViewData.ts`) already lives inside `src/views/DashboardView/` and moves with the directory.

## Functional Acceptance Criteria

- [x] **AC1:** DashboardView/ directory and all 10 source modules moved into `features/dashboard/views/DashboardView/`
- [x] **AC2:** All `../../` relative imports in moved source files converted to `@/` path aliases (28 occurrences across 7 files)
- [x] **AC3:** 3 helper/hook test files migrated to `tests/unit/features/dashboard/views/DashboardView/`
- [x] **AC4:** Re-export shims at `src/views/DashboardView/` (barrel + useDashboardViewData) for backward compatibility — 6 external dependents resolved without modification
- [x] **AC5:** `npm run test:quick` passes with 0 failures (281 files, 6884 tests)
- [x] **AC6:** Feature barrel `src/features/dashboard/index.ts` replaced with real exports via barrel chain

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** All 10 DashboardView source modules located under `src/features/dashboard/views/DashboardView/`
- [x] **AC-ARCH-LOC-2:** DashboardView barrel at `src/features/dashboard/views/DashboardView/index.ts` exporting `DashboardView`, `DashboardViewProps`, `useDashboardViewData`, `DashboardViewData`, `UseDashboardViewDataReturn`
- [x] **AC-ARCH-LOC-3:** Views sub-barrel at `src/features/dashboard/views/index.ts`
- [x] **AC-ARCH-LOC-4:** Feature barrel at `src/features/dashboard/index.ts` containing `export * from './views'`
- [x] **AC-ARCH-LOC-5:** Barrel re-export shim at `src/views/DashboardView/index.ts`
- [x] **AC-ARCH-LOC-6:** Deep re-export shim at `src/views/DashboardView/useDashboardViewData.ts`
- [x] **AC-ARCH-LOC-7:** All 3 helper/hook unit tests under `tests/unit/features/dashboard/views/DashboardView/`
- [x] **AC-ARCH-LOC-8:** `DashboardView.test.tsx` remains at `tests/unit/views/DashboardView.test.tsx` (mock path updated to canonical location)
- [x] **AC-ARCH-LOC-9:** No DashboardView source files remain at old location except the 2 shim files

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD barrel chain — `features/dashboard/index.ts` → `views/index.ts` → `DashboardView/index.ts` (same as `features/analytics/`)
- [x] **AC-ARCH-PATTERN-2:** Re-export shims at old locations — 2 source consumers + 4 test consumers resolved without modification (DashboardView.test.tsx mock path updated to canonical — vi.mock() doesn't follow re-exports)
- [x] **AC-ARCH-PATTERN-3:** All moved source files use `@/` aliases for external imports — zero `../../` relative imports remain
- [x] **AC-ARCH-PATTERN-4:** All moved test files use `@features/dashboard/views/DashboardView/*` for source imports — not `@/views/DashboardView/*`
- [x] **AC-ARCH-PATTERN-5:** Internal `./` imports within DashboardView directory preserved — directory moves as unit
- [x] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/dashboard/views/DashboardView/` mirrors `src/features/dashboard/views/DashboardView/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency — DashboardView must NOT import from dashboard barrel (`@features/dashboard`)
- [x] **AC-ARCH-NO-2:** No stale mock paths — `grep -r '@/views/DashboardView' tests/unit/features/dashboard/` returns 0
- [x] **AC-ARCH-NO-3:** No relative `../../` imports in moved source files — `grep -rE "from '\.\./\.\." src/features/dashboard/views/DashboardView/` returns 0
- [x] **AC-ARCH-NO-4:** Shim files contain ONLY export/re-export statements — no business logic
- [x] **AC-ARCH-NO-5:** No duplicate type definitions — `types.ts` exists only at new location
- [x] **AC-ARCH-NO-6:** No behavior changes — pure structural refactoring; zero function/prop/return type changes

## File Specification

### Target Directory Structure

```
src/features/dashboard/
  index.ts                          # REPLACE placeholder with barrel
  views/
    index.ts                        # NEW views sub-barrel
    DashboardView/
      DashboardView.tsx             # MOVED + MODIFIED (../../ imports → @/)
      useDashboardViewData.ts       # MOVED (already uses @/ aliases)
      types.ts                      # MOVED + MODIFIED
      chartDataHelpers.ts           # MOVED + MODIFIED
      categoryDataHelpers.ts        # MOVED + MODIFIED
      AnimatedTreemapCard.tsx       # MOVED + MODIFIED
      DashboardRadarSlide.tsx       # MOVED
      DashboardBumpSlide.tsx        # MOVED + MODIFIED
      DashboardRecientesSection.tsx # MOVED
      DashboardFullListView.tsx     # MOVED + MODIFIED
      index.ts                      # MOVED (same exports)

src/views/DashboardView/
  index.ts                          # REPLACED: re-export shim → @features/dashboard
  useDashboardViewData.ts           # NEW: deep re-export shim for test mocks

tests/unit/features/dashboard/views/
  DashboardView/
    categoryDataHelpers.test.ts     # MOVED + import paths updated
    chartDataHelpers.test.ts        # MOVED + import paths updated
    useDashboardViewData.test.ts    # MOVED + import paths updated
```

### File Action Table

| File/Component | Exact Path | Action | AC Reference |
|----------------|------------|--------|--------------|
| DashboardView.tsx | `src/features/dashboard/views/DashboardView/DashboardView.tsx` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| useDashboardViewData.ts | `src/features/dashboard/views/DashboardView/useDashboardViewData.ts` | MOVE | AC-ARCH-LOC-1 |
| types.ts | `src/features/dashboard/views/DashboardView/types.ts` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| chartDataHelpers.ts | `src/features/dashboard/views/DashboardView/chartDataHelpers.ts` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| categoryDataHelpers.ts | `src/features/dashboard/views/DashboardView/categoryDataHelpers.ts` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| AnimatedTreemapCard.tsx | `src/features/dashboard/views/DashboardView/AnimatedTreemapCard.tsx` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| DashboardRadarSlide.tsx | `src/features/dashboard/views/DashboardView/DashboardRadarSlide.tsx` | MOVE | AC-ARCH-LOC-1 |
| DashboardBumpSlide.tsx | `src/features/dashboard/views/DashboardView/DashboardBumpSlide.tsx` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| DashboardRecientesSection.tsx | `src/features/dashboard/views/DashboardView/DashboardRecientesSection.tsx` | MOVE | AC-ARCH-LOC-1 |
| DashboardFullListView.tsx | `src/features/dashboard/views/DashboardView/DashboardFullListView.tsx` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| DashboardView barrel | `src/features/dashboard/views/DashboardView/index.ts` | MOVE | AC-ARCH-LOC-2 |
| Views sub-barrel | `src/features/dashboard/views/index.ts` | CREATE | AC-ARCH-LOC-3 |
| Feature barrel | `src/features/dashboard/index.ts` | REPLACE | AC-ARCH-LOC-4 |
| Barrel shim | `src/views/DashboardView/index.ts` | REPLACE (shim) | AC-ARCH-LOC-5 |
| Deep shim | `src/views/DashboardView/useDashboardViewData.ts` | CREATE (shim) | AC-ARCH-LOC-6 |
| categoryDataHelpers test | `tests/unit/features/dashboard/views/DashboardView/categoryDataHelpers.test.ts` | MOVE + MODIFY | AC-ARCH-LOC-7 |
| chartDataHelpers test | `tests/unit/features/dashboard/views/DashboardView/chartDataHelpers.test.ts` | MOVE + MODIFY | AC-ARCH-LOC-7 |
| useDashboardViewData test | `tests/unit/features/dashboard/views/DashboardView/useDashboardViewData.test.ts` | MOVE + MODIFY | AC-ARCH-LOC-7 |

### Files That Do NOT Move

| File | Reason |
|------|--------|
| `tests/unit/views/DashboardView.test.tsx` | Root-level test, all imports resolve via shims, zero benefit to move |
| `src/App.tsx` | Consumer — resolves via shim at old location |
| `src/components/App/viewRenderers.tsx` | Consumer — resolves via shim at old location |
| `tests/unit/components/App/viewRenderers.test.tsx` | Consumer test — resolves via shim |
| `src/hooks/useDashboard*.ts` | Does NOT exist — no dashboard-specific hooks in `src/hooks/` |

## Tasks / Subtasks

### Task 1: Move DashboardView source files and fix imports (11 files)

- [x] 1.1 Create target directory `src/features/dashboard/views/DashboardView/`
- [x] 1.2 `git mv` all 11 files (10 source + index.ts) from `src/views/DashboardView/` to `src/features/dashboard/views/DashboardView/`
- [x] 1.3 Convert 28 `../../` relative imports to `@/` path aliases in 7 affected files:
  - DashboardView.tsx: 14 imports (imageViewer, hooks, services, components, config, utils)
  - chartDataHelpers.ts: 5 imports (categoryColors, categoryEmoji, categoryTranslations, categoryNormalizer)
  - categoryDataHelpers.ts: 4 imports (categoryColors, categoryNormalizer, useItems)
  - AnimatedTreemapCard.tsx: 3 imports (useCountUp, categoryColors, categoryEmoji)
  - DashboardBumpSlide.tsx: 1 import (categoryTranslations)
  - DashboardFullListView.tsx: 1 import (ImageViewer)
  - types.ts: 1 import (categoryColors)
- [x] 1.4 Run `npx tsc --noEmit` — fix any type errors

### Task 2: Create re-export shims and update barrels (4 files)

- [x] 2.1 Create views sub-barrel at `src/features/dashboard/views/index.ts`
- [x] 2.2 Replace `src/features/dashboard/index.ts` placeholder with real barrel (`export * from './views'`)
- [x] 2.3 Create barrel shim at `src/views/DashboardView/index.ts` (re-exports from `@features/dashboard/views/DashboardView`)
- [x] 2.4 Create deep shim at `src/views/DashboardView/useDashboardViewData.ts` (re-exports for test mock paths)
- [x] 2.5 Run `npx tsc --noEmit` — verify shims resolve correctly

### Task 3: Move test files and fix imports/mocks (3 files)

- [x] 3.1 Create target directory `tests/unit/features/dashboard/views/DashboardView/`
- [x] 3.2 `git mv` 3 test files to target directory
- [x] 3.3 Update imports in moved test files:
  - `@/views/DashboardView/*` → `@features/dashboard/views/DashboardView/*`
  - Adjust relative fixture paths (`../__fixtures__/` → `../../../../views/__fixtures__/`)
- [x] 3.4 Run `npx vitest run tests/unit/features/dashboard/` — fix failures atomically

### Task 4: Verification and cleanup

- [x] 4.1 Grep: `grep -r '@/views/DashboardView' tests/unit/features/dashboard/` returns 0
- [x] 4.2 Grep: `grep -rE "from '\.\./\.\." src/features/dashboard/views/DashboardView/` returns 0
- [x] 4.3 Verify external consumers: `npx vitest run tests/unit/components/App/viewRenderers.test.tsx`
- [x] 4.4 Verify component test: `npx vitest run tests/unit/views/DashboardView.test.tsx`
- [x] 4.5 Run `npm run test:quick` — all tests pass (281 files, 6884 tests)
- [x] 4.6 Verify no circular deps: `npx madge --circular src/features/dashboard/`

## Dev Notes

### Architecture Guidance

**Import rewiring strategy (same as 15b-1a):** Convert all 28 `../../` relative imports in 7 affected source files to `@/` path aliases. Internal `./` imports stay as-is since the directory moves as a unit.

**Re-export shim justification:** 2 source consumers (`App.tsx`, `viewRenderers.tsx`) + 4 test consumers (`DashboardView.test.tsx` ×3 paths, `viewRenderers.test.tsx` ×1) = 6 total dependents. Shims cost 2 trivial files and prevent breaking 6 consumers. The `useDashboardViewData.ts` deep shim is needed because `DashboardView.test.tsx` uses `vi.mock('../../../src/views/DashboardView/useDashboardViewData')` — `vi.mock()` does NOT follow barrel re-exports.

**DashboardView.test.tsx stays put:** Root-level test at `tests/unit/views/DashboardView.test.tsx` resolves all imports/mocks via shims. Moving it would require updating 4 import paths + 2 mock paths for zero benefit.

**Barrel chain:** `features/dashboard/index.ts` → `views/index.ts` → `DashboardView/index.ts` (matches `features/analytics/` structure).

### Critical Pitfalls

1. **Circular import via dashboard barrel:** After adding `export * from './views'` to dashboard barrel, DashboardView must NOT import via `@features/dashboard` (the barrel). Verify with `npx madge --circular src/features/dashboard/`.

2. **Test fixture path depth change:** Tests inside `tests/unit/views/DashboardView/` import from `../__fixtures__/transactionFactory` and `../__fixtures__/categoryColorsMock`. After moving to `tests/unit/features/dashboard/views/DashboardView/`, relative path becomes `../../../../views/__fixtures__/`. Update these paths.

3. **git mv order:** Move all source files first (including old index.ts), THEN create shim files at old location. If you create shims before moving, git sees conflicts.

4. **`useDashboardViewData.ts` shim vs source:** After `git mv`, the original 270-line file no longer exists at old location. The shim is a NEW file with only re-export statements. Do NOT accidentally leave the original behind.

### E2E Testing

No E2E testing needed — pure structural refactoring with zero behavior changes.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Simple (mechanical file moves + import rewiring)
- **Sizing:** MEDIUM (4 tasks, 21 subtasks, 17 files)
- **Agents consulted:** Planner, Architect
- **Pattern reference:** 15b-1a (consolidate-analytics) — identical approach

## Senior Developer Review (ECC)

- **Review date:** 2026-02-14
- **ECC agents:** code-reviewer (sonnet), security-reviewer (sonnet), architect (sonnet), tdd-guide (haiku)
- **Classification:** COMPLEX (20 files)
- **Outcome:** APPROVE 9/10 — 4 quick fixes applied, 3 pre-existing items deferred to 15b-2n
- **Quick fixes applied:**
  1. Staged untracked barrel file `src/features/dashboard/views/index.ts`
  2. Removed redundant `console.error` in DashboardView.tsx delete handler
  3. Changed `any` → `unknown` in `createGetSafeDate()` (useDashboardViewData.ts)
  4. Strengthened 2 bare `toHaveBeenCalled()` to `toHaveBeenCalledWith()` in DashboardView.test.tsx
- **Deferred items:** All 3 tracked by existing story 15b-2n-dashboard-view-extraction (backlog)
- **Session cost:** $28.32
