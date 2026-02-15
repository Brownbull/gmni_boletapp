# Story 15b-1h: Consolidate features/reports/

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 1 - Feature Consolidation
**Points:** 1
**Priority:** LOW
**Status:** done

## Overview

Move ReportsView into `features/reports/views/` and relocate 3 scattered test files to mirror the feature structure. The feature module already has 14 files (9 components, 2 utils, 3 barrels) — this consolidates the last source file and corrects test locations.

**Key correction from ECC analysis:** No report components remain in `src/components/` — they were all moved in Epic 15 Phase 4 (story 15-4d). Only ReportsView (1 source file) and 3 misplaced test files need to move.

## Functional Acceptance Criteria

- [x] **AC1:** ReportsView.tsx moved into `src/features/reports/views/ReportsView.tsx`
- [x] **AC2:** All `../` relative imports in moved ReportsView converted to `@/` path aliases
- [x] **AC3:** Re-export shim at `src/views/ReportsView.tsx` for backward compatibility
- [x] **AC4:** 3 test files relocated to mirror feature structure under `tests/unit/features/reports/`
- [x] **AC5:** Feature barrel `src/features/reports/index.ts` updated to export views
- [x] **AC6:** `npm run test:quick` passes with 0 failures (281 files, 6884 tests)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** ReportsView source module located at `src/features/reports/views/ReportsView.tsx`
- [x] **AC-ARCH-LOC-2:** Views barrel at `src/features/reports/views/index.ts`
- [x] **AC-ARCH-LOC-3:** Re-export shim at `src/views/ReportsView.tsx` (backward compat for viewRenderers.tsx)
- [x] **AC-ARCH-LOC-4:** ReportCard test at `tests/unit/features/reports/components/ReportCard.test.tsx`
- [x] **AC-ARCH-LOC-5:** ReportCarousel test at `tests/unit/features/reports/components/ReportCarousel.test.tsx`
- [x] **AC-ARCH-LOC-6:** reportUtils test at `tests/unit/features/reports/utils/reportUtils.test.ts`

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD barrel chain — `features/reports/index.ts` re-exports views via `export * from './views'`
- [x] **AC-ARCH-PATTERN-2:** Re-export shim at old location for backward compatibility (2 consumers: viewRenderers.tsx + its test)
- [x] **AC-ARCH-PATTERN-3:** All moved source files use `@/` aliases for external imports — zero `../` relative imports remain
- [x] **AC-ARCH-PATTERN-4:** Shim file contains ONLY export/re-export statements — no business logic
- [x] **AC-ARCH-PATTERN-5:** Test directory mirrors source: `tests/unit/features/reports/{components,utils}/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No stale mock paths — `grep -r 'src/views/ReportsView' tests/unit/features/reports/` returns 0 matches
- [x] **AC-ARCH-NO-2:** No relative `../` imports in moved source file — `grep -E "from '\.\.\/" src/features/reports/views/ReportsView.tsx` returns 0
- [x] **AC-ARCH-NO-3:** No duplicate exports — ReportsView exported only from new location + shim (not both in barrel)
- [x] **AC-ARCH-NO-4:** No circular dependency — ReportsView must NOT import from reports barrel (`@features/reports`); must use deep paths (`@features/reports/components`, `@features/reports/utils/reportUtils`)

## File Specification

### New Files (2)

| File/Component | Exact Path | Pattern | AC Reference |
|----------------|------------|---------|--------------|
| Views barrel | `src/features/reports/views/index.ts` | FSD barrel | AC-ARCH-LOC-2 |
| Re-export shim | `src/views/ReportsView.tsx` | Backward compat | AC-ARCH-LOC-3 |

### Moved Source File (1)

| File | From | To | AC Reference |
|------|------|----|--------------|
| ReportsView.tsx | `src/views/ReportsView.tsx` | `src/features/reports/views/ReportsView.tsx` | AC-ARCH-LOC-1 |

### Moved Test Files (3)

| File | From | To | AC Reference |
|------|------|----|--------------|
| ReportCard.test.tsx | `tests/unit/components/reports/` | `tests/unit/features/reports/components/` | AC-ARCH-LOC-4 |
| ReportCarousel.test.tsx | `tests/unit/components/reports/` | `tests/unit/features/reports/components/` | AC-ARCH-LOC-5 |
| reportUtils.test.ts | `tests/unit/utils/` | `tests/unit/features/reports/utils/` | AC-ARCH-LOC-6 |

### Modified Files (1)

| File | Exact Path | Change | AC Reference |
|------|------------|--------|--------------|
| Reports barrel | `src/features/reports/index.ts` | Add `export * from './views'` | AC-ARCH-PATTERN-1 |

### Files Unchanged (shim handles backward compat)

| File | Why No Change |
|------|---------------|
| `src/components/App/viewRenderers.tsx` | `../../views/ReportsView` resolves to shim |
| `tests/unit/components/App/viewRenderers.test.tsx` | Mock targets `../../../../src/views/ReportsView` resolves to shim |

## Tasks / Subtasks

### Task 1: Move ReportsView source file and fix imports (3 files)

- [x] 1.1 Create target directory `src/features/reports/views/`
- [x] 1.2 `git mv src/views/ReportsView.tsx src/features/reports/views/ReportsView.tsx`
- [x] 1.3 Convert all `../` relative imports to `@/` path aliases in moved file (11 imports converted)
- [x] 1.4 Note: `@features/reports/components` and `@features/reports/utils/reportUtils` imports already use canonical paths — no change needed
- [x] 1.5 Note: `@/types/historyFilters` and `@/shared/stores/useHistoryFiltersStore` already use `@/` aliases — no change needed
- [x] 1.6 Zero `../` relative imports remain (verified via grep)

### Task 2: Create shim and update barrels (3 files)

- [x] 2.1 Create views barrel at `src/features/reports/views/index.ts`
- [x] 2.2 Create re-export shim at `src/views/ReportsView.tsx` (replaces the moved file)
- [x] 2.3 Update `src/features/reports/index.ts` — added `export * from './views'`
- [x] 2.4 Shim and barrel chain verified

### Task 3: Move test files and fix mock paths (3 files)

- [x] 3.1 `git mv tests/unit/components/reports/ReportCard.test.tsx tests/unit/features/reports/components/ReportCard.test.tsx`
- [x] 3.2 `git mv tests/unit/components/reports/ReportCarousel.test.tsx tests/unit/features/reports/components/ReportCarousel.test.tsx`
- [x] 3.3 `git mv tests/unit/utils/reportUtils.test.ts tests/unit/features/reports/utils/reportUtils.test.ts`
- [x] 3.4 Updated mock/import paths in ReportCard.test.tsx to `@/` aliases
- [x] 3.5 Updated mock/import paths in ReportCarousel.test.tsx to `@/` aliases
- [x] 3.6 Updated type import in reportUtils.test.ts to `@/types/transaction`
- [x] 3.7 `npx vitest run tests/unit/features/reports/` — 5 files, 140 tests pass
- [x] 3.8 Empty `tests/unit/components/reports/` directory removed
- [x] 3.9 `npm run test:quick` — 281 files, 6884 tests pass, 0 failures

## Dev Notes

### Architecture Guidance

**Import rewiring strategy:** Convert all `../` relative imports in ReportsView to `@/` path aliases. ReportsView already uses `@features/reports/components` and `@features/reports/utils/reportUtils` for intra-feature imports — these are canonical and need no change. Only cross-feature imports using `../` need conversion.

**Re-export shim justification:** 1 source consumer (`viewRenderers.tsx`) + 1 test mock (`viewRenderers.test.tsx`) = 2 total consumers through `src/views/ReportsView`. Shim costs 1 trivial file and prevents breaking both consumers. This follows the 15b-1a pattern exactly.

**Barrel chain:** `features/reports/index.ts → views/index.ts → ReportsView.tsx`. ReportsView imports from `@features/reports/components` and `@features/reports/utils/reportUtils` using deep paths (NOT the barrel), avoiding circular imports.

### Critical Pitfalls

1. **Circular import via reports barrel:** ReportsView already imports from `@features/reports/components` and `@features/reports/utils/reportUtils` via deep paths. After adding `export * from './views'` to the reports barrel, ensure ReportsView does NOT import via `@features/reports` (the barrel) — this would create a cycle. All existing imports use deep paths, so this is safe.

2. **Test mock depth changes:** Moving test files 2 levels deeper changes relative mock paths. `../../../../src/hooks/` becomes `../../../../../../src/hooks/`. Verify each mock path in all 3 moved test files.

3. **reportUtils.test.ts type import:** Uses `from '../../../src/types/transaction'` which changes to `'../../../../../src/types/transaction'` after moving 2 levels deeper.

4. **Empty directory cleanup:** After moving test files, `tests/unit/components/reports/` will be empty. Clean up the empty directory.

### Technical Notes

No specialized technical review required (SIMPLE classification).

### E2E Testing

No E2E coverage needed — pure structural move with no behavior changes.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Simple (mechanical moves following known pattern)
- **Sizing:** SMALL (3 tasks, 9 subtasks, ~7 files touched)
- **Classification:** SIMPLE
- **Agents consulted:** Planner

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft from ecc-create-epics-and-stories |
| 2026-02-14 | ECC create-story refinement: Planner analysis. Corrected scope (no components in src/components/ to move — all moved in 15-4d), added architectural ACs, exact file specification with paths, import conversion list, 4 critical pitfalls, test mock depth analysis |
| 2026-02-15 | ECC code-review: APPROVE 9.75/10 — 2 quick fixes applied (View type guard + sanitizeInput for auth display). 0 TD stories. 13 arch ACs pass |

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-15
- **Classification:** STANDARD
- **ECC Agents:** code-reviewer (10/10), security-reviewer (9.5/10)
- **Overall Score:** 9.75/10
- **Outcome:** APPROVE — 2 pre-existing quick fixes applied, 0 deferred items
- **Quick Fixes Applied:**
  1. Added `isValidView()` type guard to `src/app/types.ts` + updated ReportsView to use runtime validation instead of `as View` cast
  2. Added `sanitizeInput()` wrapping for `userName` and `userEmail` display (defense-in-depth)
- **Tests:** 281 files, 6884 tests pass (0 failures)
