# Story 15b-1a: Consolidate features/analytics/

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 1 - Feature Consolidation
**Points:** 3
**Priority:** MEDIUM
**Status:** done

## Overview

Move TrendsView directory (20 source files) and 7 corresponding test files into `features/analytics/views/`. Add re-export shims at the old location for backward compatibility. Update barrel exports and fix import paths in moved files.

**Key correction from ECC analysis:** No analytics-specific hooks or utils exist in `src/hooks/` or `src/utils/` — they are all cross-feature shared. Only TrendsView source files and their tests move.

## Functional Acceptance Criteria

- [x] **AC1:** All 20 TrendsView source files moved into `src/features/analytics/views/TrendsView/`
- [x] **AC2:** All 7 TrendsView unit tests moved to `tests/unit/features/analytics/views/TrendsView/`
- [x] **AC3:** All `../../` relative imports in moved source files converted to `@/` path aliases
- [x] **AC4:** All `@/views/TrendsView/*` imports in moved test files converted to `@features/analytics/views/TrendsView/*`
- [x] **AC5:** Re-export shims at `src/views/TrendsView/` (barrel + useTrendsViewData) for backward compatibility
- [x] **AC6:** `npm run test:quick` passes with 0 failures
- [x] **AC7:** Feature barrel `src/features/analytics/index.ts` updated to export views
- [x] **AC8:** `categoryDataFactory.ts` fixture import updated to new canonical path

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** All 19 TrendsView source modules located under `src/features/analytics/views/TrendsView/`
- [x] **AC-ARCH-LOC-2:** TrendsView barrel at `src/features/analytics/views/TrendsView/index.ts`
- [x] **AC-ARCH-LOC-3:** Views sub-barrel at `src/features/analytics/views/index.ts`
- [x] **AC-ARCH-LOC-4:** Barrel re-export shim at `src/views/TrendsView/index.ts`
- [x] **AC-ARCH-LOC-5:** Deep re-export shim at `src/views/TrendsView/useTrendsViewData.ts` (3 external test mocks depend on it)
- [x] **AC-ARCH-LOC-6:** All 7 unit tests under `tests/unit/features/analytics/views/TrendsView/`
- [x] **AC-ARCH-LOC-7:** No TrendsView source files remain at old location except the 2 shim files

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD barrel pattern — `src/features/analytics/index.ts` re-exports views via `export * from './views'`
- [x] **AC-ARCH-PATTERN-2:** Re-export shims at old locations (>5 external consumers verified: 4 source + 6 test files)
- [x] **AC-ARCH-PATTERN-3:** All moved source files use `@/` aliases for external imports — zero `../../` relative imports remain
- [x] **AC-ARCH-PATTERN-4:** All moved test files use `@features/analytics/views/TrendsView/*` for imports and mocks
- [x] **AC-ARCH-PATTERN-5:** Internal `./` imports within TrendsView preserved (directory moves as unit)
- [x] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/analytics/views/TrendsView/`

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency — TrendsView must NOT import from analytics barrel (`@features/analytics`); must use deep paths (`@features/analytics/components/X`)
- [x] **AC-ARCH-NO-2:** No stale mock paths — `grep -r '@/views/TrendsView' tests/unit/features/analytics/` returns 0 matches
- [x] **AC-ARCH-NO-3:** No relative `../../` imports in moved source files — `grep -rE "from '\.\./\.\." src/features/analytics/views/TrendsView/` returns 0
- [x] **AC-ARCH-NO-4:** Shim files contain ONLY export/re-export statements — no business logic
- [x] **AC-ARCH-NO-5:** No duplicate type definitions — `types.ts` exists only at new location

## File Specification

### New Files (3)

| File/Component | Exact Path | Pattern |
|----------------|------------|---------|
| Views barrel | `src/features/analytics/views/index.ts` | FSD barrel |
| Barrel re-export shim | `src/views/TrendsView/index.ts` | Backward compat |
| Deep re-export shim | `src/views/TrendsView/useTrendsViewData.ts` | Backward compat |

### Moved Source Files (20)

| File | From | To |
|------|------|----|
| TrendsView.tsx | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| index.ts | `src/views/TrendsView/` | Replaced by new barrel at target |
| types.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| useTrendsViewData.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| useDonutDrillDown.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| helpers.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| periodHelpers.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| aggregationHelpers.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| treemapHelpers.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| drillDownHelpers.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| navigationHelpers.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| periodNavigationHelpers.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| periodComparisonHelpers.ts | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| DonutChart.tsx | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| DonutLegend.tsx | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| AnimatedTreemapCell.tsx | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| TrendsCardHeader.tsx | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| TrendListItem.tsx | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| ExpandCollapseButtons.tsx | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |
| animationComponents.tsx | `src/views/TrendsView/` | `src/features/analytics/views/TrendsView/` |

### Moved Test Files (7)

| File | From | To |
|------|------|----|
| helpers.test.ts | `tests/unit/views/TrendsView/` | `tests/unit/features/analytics/views/TrendsView/` |
| drillDownHelpers.test.ts | `tests/unit/views/TrendsView/` | `tests/unit/features/analytics/views/TrendsView/` |
| navigationHelpers.test.ts | `tests/unit/views/TrendsView/` | `tests/unit/features/analytics/views/TrendsView/` |
| periodNavigationHelpers.test.ts | `tests/unit/views/TrendsView/` | `tests/unit/features/analytics/views/TrendsView/` |
| periodComparisonHelpers.test.ts | `tests/unit/views/TrendsView/` | `tests/unit/features/analytics/views/TrendsView/` |
| useTrendsViewData.test.ts | `tests/unit/views/TrendsView/` | `tests/unit/features/analytics/views/TrendsView/` |
| DonutChart.test.tsx | `tests/unit/views/TrendsView/` | `tests/unit/features/analytics/views/TrendsView/` |

### Modified Files (2)

| File | Exact Path | Change |
|------|------------|--------|
| Analytics barrel | `src/features/analytics/index.ts` | Add `export * from './views'` |
| Category data factory | `tests/unit/views/__fixtures__/categoryDataFactory.ts` | Update type import path |

### Files Unchanged (shim handles backward compat)

| File | Why No Change |
|------|---------------|
| `src/App.tsx` | `'./views/TrendsView'` resolves to shim |
| `src/components/App/viewRenderers.tsx` | `'../../views/TrendsView'` resolves to shim |
| `src/hooks/app/useNavigationHandlers.ts` | Resolves to shim (15b-0d will fix canonically) |
| `src/features/scan/ScanFeature.tsx` | Resolves to shim (15b-0d will fix canonically) |
| `tests/unit/views/TrendsView.polygon.test.tsx` | Resolves to shim + deep shim |
| `tests/unit/components/App/viewRenderers.test.tsx` | Mock targets shim |
| `tests/integration/analytics/trendsViewIntegration.test.tsx` | Resolves to shim + deep shim |
| `tests/integration/analytics-workflows.test.tsx` | Resolves to shim + deep shim |
| `tests/integration/trends-export.test.tsx` | Resolves to shim |

## Tasks / Subtasks

### Task 1: Move TrendsView source files and fix imports (20 files)

- [x] 1.1 Create target directory `src/features/analytics/views/TrendsView/`
- [x] 1.2 `git mv` all 20 source files from `src/views/TrendsView/` to target
- [x] 1.3 Convert all `../../` relative imports to `@/` path aliases in moved files:
  - `../../config/categoryColors` → `@/config/categoryColors`
  - `../../utils/currency` → `@/utils/currency`
  - `../../utils/categoryNormalizer` → `@/utils/categoryNormalizer`
  - `../../utils/categoryAggregation` → `@/utils/categoryAggregation`
  - `../../utils/categoryTranslations` → `@/utils/categoryTranslations`
  - `../../utils/categoryEmoji` → `@/utils/categoryEmoji`
  - `../../utils/treemapLayout` → `@/utils/treemapLayout`
  - `../../hooks/useCountUp` → `@/hooks/useCountUp`
  - `../../hooks/useSwipeNavigation` → `@/hooks/useSwipeNavigation`
  - `../../hooks/useReducedMotion` → `@/hooks/useReducedMotion`
  - `../../types/transaction` → `@/types/transaction`
  - `../../types/navigation` → `@/types/navigation`
  - `../../components/animation/*` → `@/components/animation/*`
  - `../../components/ProfileDropdown` → `@/components/ProfileDropdown`
- [x] 1.4 Preserve all internal `./` imports within TrendsView directory (no changes needed)
- [x] 1.5 Run `npx tsc --noEmit` — fix any errors before proceeding

### Task 2: Create re-export shims and update barrels (5 files)

- [x] 2.1 Create views sub-barrel at `src/features/analytics/views/index.ts`
- [x] 2.2 Write TrendsView barrel at new location (`src/features/analytics/views/TrendsView/index.ts`)
- [x] 2.3 Create barrel re-export shim at `src/views/TrendsView/index.ts` (exports TrendsView, TrendsViewProps, DrillDownPath, HistoryNavigationPayload, useTrendsViewData, TrendsViewData, UseTrendsViewDataReturn)
- [x] 2.4 Create deep re-export shim at `src/views/TrendsView/useTrendsViewData.ts` (3 external test mocks depend on this)
- [x] 2.5 Update `src/features/analytics/index.ts` — add `export * from './views'`
- [x] 2.6 Run `npx tsc --noEmit` — verify shims resolve correctly

### Task 3: Move test files and fix mock paths (7 files)

- [x] 3.1 Create target directory `tests/unit/features/analytics/views/TrendsView/`
- [x] 3.2 `git mv` all 7 test files from `tests/unit/views/TrendsView/` to target
- [x] 3.3 Update all `@/views/TrendsView/*` imports to `@features/analytics/views/TrendsView/*` in moved tests
- [x] 3.4 Update all `vi.mock('@/views/TrendsView/...')` paths in moved tests
- [x] 3.5 Convert DonutChart.test.tsx relative paths (`../../../../src/views/TrendsView/...`) to `@features/analytics/views/TrendsView/...` aliases
- [x] 3.6 Update fixture relative paths (moved tests now reference `../../../../views/__fixtures__/` instead of `../__fixtures__/`)
- [x] 3.7 Run `npx vitest run tests/unit/features/analytics/views/TrendsView/` — fix any failures atomically

### Task 4: Update external references (1 file)

- [x] 4.1 Update `tests/unit/views/__fixtures__/categoryDataFactory.ts`: change `@/views/TrendsView/types` to `@features/analytics/views/TrendsView/types`
- [x] 4.2 Run `npx vitest run tests/unit/views/__fixtures__/` (or dependent tests) to verify

### Task 5: Verification and cleanup

- [x] 5.1 Grep verification: `grep -r '@/views/TrendsView' tests/unit/features/analytics/` returns 0
- [x] 5.2 Grep verification: `grep -rE "from '\.\./\.\." src/features/analytics/views/TrendsView/` returns 0
- [x] 5.3 Run `npm run test:quick` — all tests pass
- [x] 5.4 Verify no new circular dependencies (`npx madge --circular src/features/analytics/`)

## Dev Notes

### Architecture Guidance

**Import rewiring strategy:** Convert all `../../` relative imports in moved files to `@/` path aliases. This makes files location-independent and prevents future breakage. Internal `./` imports stay as-is since the directory moves as a unit.

**Re-export shim justification:** 4 source consumers + 6 external test files = 10 total consumers through `src/views/TrendsView`. Shims cost 2 trivial files and prevent breaking 10 consumers. `useTrendsViewData.ts` shim specifically needed because 3 integration/unit tests mock it by deep path — `vi.mock()` does NOT follow barrel re-exports.

**Barrel chain:** `features/analytics/index.ts → views/index.ts → TrendsView/index.ts`. TrendsView.tsx imports from `@features/analytics/components/X` using deep paths (NOT the barrel), avoiding circular imports.

### Critical Pitfalls

1. **Circular import via analytics barrel:** TrendsView.tsx already imports from `@features/analytics/components/CategoryStatisticsPopup` and `@features/analytics/hooks/useCategoryStatistics` via deep paths. After adding `export * from './views'` to analytics barrel, ensure TrendsView does NOT import via `@features/analytics` (the barrel) — this would create a cycle. All existing imports use deep paths, so this is safe.

2. **DonutChart.test.tsx uses relative paths:** `../../../../src/views/TrendsView/DonutChart` — convert to `@features/analytics/views/TrendsView/DonutChart` during the move to avoid fragile depth calculations.

3. **Fixture path depth change:** Test files import from `../__fixtures__/categoryDataFactory`. After moving tests 2 levels deeper, this becomes `../../../../views/__fixtures__/categoryDataFactory`. Update in all 7 test files.

4. **test-utils import depth:** Tests import from `../../../setup/test-utils`. After moving, path becomes `../../../../../setup/test-utils`. Verify and update.

5. **Story 15b-0d dependency:** If 15b-0d (layer violation cleanup) completes first, `useNavigationHandlers.ts` and `ScanFeature.tsx` will already import `HistoryNavigationPayload` from `@/types/navigation` directly. The shim re-export of that type becomes unused but harmless.

### Files that do NOT move (ECC Planner verified)

No analytics-specific hooks exist in `src/hooks/` — `useCountUp` (5 consumers), `useSwipeNavigation` (4 consumers), `useReducedMotion` (35+ consumers) are all cross-feature shared. No analytics-specific utils exist in `src/utils/` — `treemapLayout`, `categoryAggregation`, `categoryNormalizer`, `categoryTranslations`, `categoryEmoji` are all used by 2-20+ consumers across features.

## ECC Analysis Summary

- **Risk Level:** MEDIUM
- **Complexity:** Moderate (mechanical moves, but high file count and mock path management)
- **Sizing:** MEDIUM (5 tasks, 22 subtasks, ~32 files touched — within consolidation limits)
- **Agents consulted:** Planner, Architect
- **Dependencies:** DEPENDS 15b-0d (layer violation cleanup) — optional, shim handles either order

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft from ecc-create-epics-and-stories |
| 2026-02-13 | ECC create-story refinement: Planner + Architect analysis. Corrected file count 17→20, eliminated Tasks 2/3 (no analytics hooks/utils in flat dirs), added architectural ACs, exact file specification, re-export shim design, 5 critical pitfalls |
| 2026-02-14 | Implementation complete. Story correction: 3 external test files (polygon, analytics-workflows, trendsViewIntegration) required mock path updates to canonical `@features/analytics/views/TrendsView/useTrendsViewData` — vi.mock() does NOT follow shim re-exports. All 6,884 tests pass. Build passes. |
| 2026-02-14 | ECC Code Review: APPROVE 10/10. 4 agents (code, security, architect, TDD). All 17 architectural ACs validated. Zero findings. |

## Senior Developer Review (ECC)

- **Date:** 2026-02-14
- **Agents:** code-reviewer (sonnet), security-reviewer (sonnet), architect (sonnet), tdd-guide (haiku)
- **Classification:** COMPLEX (32 files, architecture-sensitive barrels)
- **Outcome:** APPROVE 10/10 — zero findings
- **Scores:** Code 10/10, Security 10/10, Architecture 10/10, Testing 10/10
- **Action items:** 0 quick fixes, 0 TD stories
- **Key validations:** All 17 architectural ACs pass, zero circular deps, zero stale mocks, zero `../../` imports, dual shim strategy correct