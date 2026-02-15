# Story 15b-1g: Consolidate features/insights/

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 1 - Feature Consolidation
**Points:** 2
**Priority:** MEDIUM
**Status:** done

## Overview

Move InsightsView.tsx (755 lines) from `src/views/` into `src/features/insights/views/` and mirror all 22 insight-related test files from flat `tests/unit/{components,hooks,services,utils,views}/` directories into `tests/unit/features/insights/`. Add re-export shim at old location for backward compatibility. Update CI config paths.

**Key context:** The insights feature already has 30 source files (components, hooks, services, utils) inside `src/features/insights/`. Only InsightsView.tsx remains in flat `src/views/`. Test files for all insight source files are still in flat test directories — this story mirrors them into the feature test structure.

**Pattern reference:** Follows 15b-1a (analytics consolidation) exactly.

## Functional Acceptance Criteria

- [x] **AC1:** InsightsView.tsx moved to `src/features/insights/views/InsightsView.tsx`
- [x] **AC2:** All 22 insight-related test files moved into `tests/unit/features/insights/` mirroring source structure
- [x] **AC3:** Relative imports in InsightsView.tsx converted to `@/` path aliases (6 relative → aliased)
- [x] **AC4:** Re-export shim at `src/views/InsightsView.tsx` for backward compatibility (viewRenderers.tsx)
- [x] **AC5:** Feature barrel `src/features/insights/index.ts` updated to export views
- [x] **AC6:** CI config files updated to reference new test paths (6 configs)
- [x] **AC7:** `npm run test:quick` passes with 0 failures (281 files, 6884 tests)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** InsightsView.tsx located at `src/features/insights/views/InsightsView.tsx`
- [x] **AC-ARCH-LOC-2:** Views barrel at `src/features/insights/views/index.ts`
- [x] **AC-ARCH-LOC-3:** Re-export shim at `src/views/InsightsView.tsx`
- [x] **AC-ARCH-LOC-4:** 17 component tests under `tests/unit/features/insights/components/`
- [x] **AC-ARCH-LOC-5:** InsightsView test at `tests/unit/features/insights/views/InsightsView.test.tsx`
- [x] **AC-ARCH-LOC-6:** Hook test at `tests/unit/features/insights/hooks/useInsightProfile.test.ts`
- [x] **AC-ARCH-LOC-7:** Service tests at `tests/unit/features/insights/services/` (3 files total — existing TD-20 + moved CRUD + moved engine)
- [x] **AC-ARCH-LOC-8:** Util tests at `tests/unit/features/insights/utils/` (2 files)

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** FSD barrel pattern — `src/features/insights/index.ts` re-exports views via `export * from './views'`
- [x] **AC-ARCH-PATTERN-2:** Re-export shim at old location (2 external consumers: viewRenderers.tsx source + test)
- [x] **AC-ARCH-PATTERN-3:** InsightsView.tsx uses `@/` aliases for all external imports — zero `../` relative imports remain
- [x] **AC-ARCH-PATTERN-4:** Test directory mirrors source: `tests/unit/features/insights/{components,hooks,services,utils,views}/`
- [x] **AC-ARCH-PATTERN-5:** Moved test files update import paths to canonical `@features/insights/` paths

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular dependency — InsightsView must NOT import from insights barrel (`@features/insights`); must use deep paths (`@features/insights/components/X`)
- [x] **AC-ARCH-NO-2:** No stale mock paths — `grep -r '@/views/InsightsView' tests/unit/features/insights/` returns 0
- [x] **AC-ARCH-NO-3:** No relative `../` imports in moved InsightsView.tsx — `grep -rE "from '\\.\\./" src/features/insights/views/InsightsView.tsx` returns 0
- [x] **AC-ARCH-NO-4:** Shim file contains ONLY export/re-export statements — no business logic
- [x] **AC-ARCH-NO-5:** `useInsightStore` must NOT move from `src/shared/stores/` — it manages App-level overlay state used by App.tsx

## File Specification

### New Files (2)

| File/Component | Exact Path | Pattern |
|----------------|------------|---------|
| Views barrel | `src/features/insights/views/index.ts` | FSD barrel |
| Re-export shim | `src/views/InsightsView.tsx` | Backward compat (replaces moved file) |

### Moved Source Files (1)

| File | From | To |
|------|------|----|
| InsightsView.tsx | `src/views/InsightsView.tsx` | `src/features/insights/views/InsightsView.tsx` |

### Moved Test Files (22)

| Category | Files | From | To |
|----------|-------|------|----|
| View test | InsightsView.test.tsx | `tests/unit/views/` | `tests/unit/features/insights/views/` |
| Component tests (17) | AirlockGenerateButton, AirlockHistoryCard, AirlockHistoryList, AirlockSequence, AirlockTemporalFilter, BadgeUnlock, BatchSummary, CelebrationCard, CelebrationView, InsightCard, InsightCardLarge, InsightDetailModal, InsightHistoryCard, InsightsCarousel, InsightsTemporalFilter, InsightsViewSwitcher, IntentionalPrompt | `tests/unit/components/insights/` | `tests/unit/features/insights/components/` |
| Hook test | useInsightProfile.test.ts | `tests/unit/hooks/` | `tests/unit/features/insights/hooks/` |
| Service test (CRUD) | insightProfileService.test.ts | `tests/unit/services/` | `tests/unit/features/insights/services/` (rename to `insightProfileService.crud.test.ts` to avoid collision) |
| Service test (engine) | insightEngineService.test.ts | `tests/unit/services/` | `tests/unit/features/insights/services/` |
| Util test (generators) | insightGenerators.test.ts | `tests/unit/utils/` | `tests/unit/features/insights/utils/` |
| Util test (config) | insightTypeConfig.test.ts | `tests/unit/utils/` | `tests/unit/features/insights/utils/` |

### Modified Files (~8)

| File | Exact Path | Change |
|------|------------|--------|
| Insights barrel | `src/features/insights/index.ts` | Add `export * from './views'` |
| CI group config | `tests/config/vitest.config.ci.group-components-insights.ts` | Update glob to `tests/unit/features/insights/components/**` |
| CI heavy config | `tests/config/vitest.config.heavy.ts` | Update 2 paths to feature locations |
| CI base config | `tests/config/vitest.config.ci.base.ts` | Update 2 exclusion paths |
| CI heavy-3 | `tests/config/vitest.config.ci.heavy-3.ts` | Update insightEngineService path |
| CI heavy-4 | `tests/config/vitest.config.ci.heavy-4.ts` | Update insightGenerators path |
| CI main config | `tests/config/vitest.config.ci.ts` | Update 2 exclusion paths |

### Files Unchanged (shim handles backward compat)

| File | Why No Change |
|------|---------------|
| `src/components/App/viewRenderers.tsx` | `../../views/InsightsView` resolves to shim |
| `tests/unit/components/App/viewRenderers.test.tsx` | Mock targets `../../../../src/views/InsightsView` resolves to shim |
| `src/shared/stores/useInsightStore.ts` | Stays in shared — App-level overlay state |
| `src/types/insight.ts` | Stays in types — cross-feature type |
| `src/repositories/insightProfileRepository.ts` | Stays in repositories — DAL infrastructure |

### Pre-existing Test File (no move needed)

| File | Why No Move |
|------|-------------|
| `tests/unit/features/insights/services/insightProfileService.test.ts` | Already at correct location (TD-20 transaction tests) |
| `tests/unit/shared/stores/useInsightStore.test.ts` | Mirrors shared source location |

## Tasks / Subtasks

### Task 1: Move InsightsView.tsx and fix imports (1 source file)

- [x] 1.1 Create target directory `src/features/insights/views/`
- [x] 1.2 `git mv src/views/InsightsView.tsx src/features/insights/views/InsightsView.tsx`
- [x] 1.3 Fix relative imports in InsightsView.tsx:
  - `../types/insight` → `@/types/insight`
  - `../hooks/useAuth` → `@/hooks/useAuth`
  - `../utils/date` → `@/utils/date`
  - `../components/ProfileDropdown` → `@/components/ProfileDropdown`
  - `../shared/stores/useNavigationStore` → `@shared/stores/useNavigationStore`
  - `../app/types` → `@app/types`
  - (All `@features/insights/*` and `@/utils/*` imports already use aliases — no change)
- [x] 1.4 Create views barrel at `src/features/insights/views/index.ts`
- [x] 1.5 Update feature barrel `src/features/insights/index.ts` — add `export * from './views'`
- [x] 1.6 Create re-export shim at `src/views/InsightsView.tsx` (export InsightsView + InsightsViewProps)
- [x] 1.7 Run `npx tsc --noEmit` — fix any errors

### Task 2: Move test files (22 test files)

- [x] 2.1 Create target directories:
  - `tests/unit/features/insights/views/`
  - `tests/unit/features/insights/components/`
  - `tests/unit/features/insights/hooks/`
  - `tests/unit/features/insights/utils/`
  (services/ already exists)
- [x] 2.2 `git mv tests/unit/views/InsightsView.test.tsx tests/unit/features/insights/views/`
- [x] 2.3 `git mv tests/unit/components/insights/*.test.tsx tests/unit/features/insights/components/`
- [x] 2.4 `git mv tests/unit/hooks/useInsightProfile.test.ts tests/unit/features/insights/hooks/`
- [x] 2.5 Rename then move CRUD service test: `git mv tests/unit/services/insightProfileService.test.ts tests/unit/features/insights/services/insightProfileService.crud.test.ts`
- [x] 2.6 `git mv tests/unit/services/insightEngineService.test.ts tests/unit/features/insights/services/`
- [x] 2.7 `git mv tests/unit/utils/insightGenerators.test.ts tests/unit/features/insights/utils/`
- [x] 2.8 `git mv tests/unit/utils/insightTypeConfig.test.ts tests/unit/features/insights/utils/`
- [x] 2.9 Fix relative import paths in moved test files (update `../../helpers`, `../../../src/` to match new depth)
- [x] 2.10 Run `npx vitest run tests/unit/features/insights/ --bail` — 24 files pass, 635 tests

### Task 3: Update CI config paths (~6 files)

- [x] 3.1 Update `tests/config/vitest.config.ci.group-components-insights.ts` glob to `tests/unit/features/insights/components/**/*.test.{ts,tsx}`
- [x] 3.2 Update `tests/config/vitest.config.heavy.ts` paths
- [x] 3.3 Update `tests/config/vitest.config.ci.base.ts` exclusion paths
- [x] 3.4 Update `tests/config/vitest.config.ci.heavy-3.ts` path
- [x] 3.5 Update `tests/config/vitest.config.ci.heavy-4.ts` path
- [x] 3.6 Update `tests/config/vitest.config.ci.ts` exclusion paths

### Task 4: Verification and cleanup

- [x] 4.1 Grep verification: `grep -rE "from '\\.\\./" src/features/insights/views/InsightsView.tsx` returns 0
- [x] 4.2 Grep verification: `grep -r '@/views/InsightsView' tests/unit/features/insights/` returns 0
- [x] 4.3 Verify shim resolves: viewRenderers.tsx import still works (tsc --noEmit clean)
- [x] 4.4 Run `npm run test:quick` — 281 files pass, 6884 tests, 0 failures
- [x] 4.5 Verify no new circular dependencies (InsightsView uses deep paths only)
- [x] 4.6 Remove empty `tests/unit/components/insights/` directory

## Dev Notes

### Architecture Guidance

**Import rewiring strategy:** InsightsView.tsx already uses `@features/insights/*` deep paths for all insight component/hook/service imports. Only 3 relative imports need conversion (`../types/insight`, `../hooks/useAuth`, `../utils/date`) to `@/` aliases.

**Re-export shim justification:** 2 external consumers import from `src/views/InsightsView`: viewRenderers.tsx (source) and its test (mock). Shim is 1 trivial file.

**useInsightStore stays in shared:** The store manages App-level overlay state (currentInsight, showInsightCard, showSessionComplete, sessionContext, showBatchSummary) used by App.tsx orchestration, SessionComplete component, and other non-insights consumers. It is correctly placed in `shared/stores/`.

**Duplicate insightProfileService test files:** `tests/unit/services/insightProfileService.test.ts` (CRUD tests, Story 10.2) and `tests/unit/features/insights/services/insightProfileService.test.ts` (transaction safety tests, Story TD-20) are **complementary**, not duplicates. The CRUD file is renamed to `insightProfileService.crud.test.ts` before moving to avoid filename collision.

**CI config paths:** 6 vitest config files reference flat insight test paths for heavy test exclusions and group configurations. All must update to feature-relative paths.

### Critical Pitfalls

1. **Test file naming collision:** Two `insightProfileService.test.ts` files would coexist in the same directory. Rename the moved (CRUD) file to `insightProfileService.crud.test.ts` before moving.

2. **Helper import depth change:** Test files reference `../../helpers` or `../../../setup/test-utils`. After moving deeper into feature dirs, these paths change. Verify and update all relative path imports in moved test files.

3. **Empty test directories:** After moving all files out of `tests/unit/components/insights/`, the empty directory should be removed.

4. **InsightsView imports are mostly aliased already:** Unlike TrendsView (15b-1a) which had many `../../` imports, InsightsView.tsx already uses `@features/insights/*` for insight imports. Only 3 relative imports need fixing.

### E2E Testing

E2E coverage recommended — run `/ecc-e2e 15b-1g` after implementation.

## Senior Developer Review (ECC)

- **Review date:** 2026-02-15
- **Classification:** SIMPLE
- **ECC agents:** code-reviewer (sonnet), tdd-guide (haiku)
- **Outcome:** APPROVE 9.5/10
- **Findings:** 1 LOW (InsightsView.test.tsx import via shim instead of canonical path — fixed)
- **Quick fixes applied:** 1 (import path updated to `@features/insights/views/InsightsView`)
- **TD stories created:** 0
- **Architectural ACs:** 13/13 PASS
- **Tests:** 281 files, 6884 tests, 0 failures
- **Session cost:** $8.15

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Simple (1 source move + 22 test mirrors + CI config updates)
- **Classification:** SIMPLE
- **Sizing:** SMALL (4 tasks, ~25 subtasks, ~32 files touched — within consolidation limits)
- **Agents consulted:** Planner (sonnet)
- **Dependencies:** None (insights feature module fully established, InsightsView already uses deep paths)
