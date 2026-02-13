# Story 15b-0a: Dead Module Audit

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** ready-for-dev

## Description

Verify 5 suspect entry points identified by dependency analysis (modules with 0 incoming dependencies) and delete confirmed dead code. This establishes a clean baseline before file consolidation begins.

Note: `views/EditView.tsx` and `views/ScanResultView.tsx` also appear as entry points but are loaded via dynamic import in `viewRenderers.tsx` — they are NOT dead.

## ECC Pre-Analysis Results

| Module | Status | Lines | Reason |
|--------|--------|-------|--------|
| `hooks/useAirlocks.ts` | **DEAD** | 262 | 0 consumers — confirmed by TD-13 ("0 consumers and 0 tests") |
| `hooks/useDialogResolution.ts` | **DEAD** | 281 | Replaced by Zustand store in Story 14e-11 |
| `utils/semanticColors.ts` | **DEAD** | 234 | 0 src/ references — only a test file exists |
| `components/charts/SimplePieChart.tsx` | **DEAD** | 307 | Replaced by DonutChart in TrendsView redesign |
| `components/charts/GroupedBarChart.tsx` | **DEAD** | 343 | Replaced by SankeyChart in TrendsView redesign |
| `settings/.../DatosAprendidosView.tsx` | **ALIVE** | 6 | Re-export wrapper used by SettingsView.tsx line 19 |

**Total deletion:** 5 source files (1,427 lines) + 3 test files (~150 lines) = **8 files, ~1,577 lines**

## Functional Acceptance Criteria

- [ ] **AC1:** All 5 suspect modules verified via grep for static imports, dynamic imports, barrel re-exports, and string references
- [ ] **AC2:** 5 confirmed dead source files deleted + 3 orphaned test files deleted
- [ ] **AC3:** DatosAprendidosView.tsx confirmed ALIVE and kept (used by SettingsView)
- [ ] **AC4:** `npm run test:quick` passes after all deletions
- [ ] **AC5:** 0 orphaned modules in depcruise output

## Architectural Acceptance Criteria (MANDATORY)

### File Location Requirements
- **AC-ARCH-LOC-1:** No orphaned modules remain after cleanup (depcruise verification)
- **AC-ARCH-LOC-2:** If `src/components/charts/` becomes empty after chart deletion, directory is removed

### Pattern Requirements
- **AC-ARCH-PATTERN-1:** Dead code verification uses comprehensive search: static imports + dynamic imports + barrel re-exports + string references
- **AC-ARCH-PATTERN-2:** Test files deleted atomically with source files (same commit) to prevent CI failures

### Anti-Pattern Requirements (Must NOT Happen)
- **AC-ARCH-NO-1:** Must NOT delete dynamically imported modules (EditView.tsx, ScanResultView.tsx are loaded via viewRenderers.tsx)
- **AC-ARCH-NO-2:** Must NOT delete modules with active backward compatibility wrappers (DatosAprendidosView)

## File Specification

| File | Exact Path | Action | Description |
|------|------------|--------|-------------|
| `useAirlocks` hook | `src/hooks/useAirlocks.ts` | DELETE | Dead hook (262 lines) — 0 consumers |
| `useDialogResolution` hook | `src/hooks/useDialogResolution.ts` | DELETE | Dead hook (281 lines) — replaced by Zustand |
| `semanticColors` utility | `src/utils/semanticColors.ts` | DELETE | Dead utility (234 lines) — 0 src/ refs |
| `semanticColors` test | `tests/unit/utils/semanticColors.test.ts` | DELETE | Test for deleted module |
| `SimplePieChart` component | `src/components/charts/SimplePieChart.tsx` | DELETE | Legacy chart (307 lines) — replaced by DonutChart |
| `SimplePieChart` test | `tests/unit/components/charts/SimplePieChart.test.tsx` | DELETE | Test for deleted component |
| `GroupedBarChart` component | `src/components/charts/GroupedBarChart.tsx` | DELETE | Legacy chart (343 lines) — replaced by SankeyChart |
| `StackedBarChart` test | `tests/unit/components/charts/StackedBarChart.test.tsx` | DELETE | Test imports GroupedBarChart |
| `DatosAprendidosView` | `src/features/settings/components/subviews/DatosAprendidosView.tsx` | KEEP | Backward compat re-export, used by SettingsView |

## Tasks

- [ ] **Task 1:** Verify all 5 suspects (confirm ECC pre-analysis)
  - [ ] Run grep for each suspect: static imports, dynamic imports, barrel re-exports
  - [ ] Confirm `DatosAprendidosView` is alive (imported by SettingsView)
  - [ ] Confirm 2 chart files replaced by DonutChart/SankeyChart
- [ ] **Task 2:** Delete confirmed dead modules (3 rounds, atomic)
  - [ ] Round 1: Delete hooks (`useAirlocks.ts`, `useDialogResolution.ts`)
  - [ ] Round 2: Delete `semanticColors.ts` + test file
  - [ ] Round 3: Delete chart files + test files; remove empty `charts/` dir if applicable
- [ ] **Task 3:** Validate
  - [ ] Run `npx tsc --noEmit` — 0 errors
  - [ ] Run `npm run test:quick` — all pass
  - [ ] Run depcruise — 0 orphaned modules

## Dev Notes

### Architecture Guidance
- No barrel exports reference the dead modules (hooks/, utils/, components/charts/ have no index.ts barrels)
- Chart replacements: SimplePieChart → DonutChart (features/analytics), GroupedBarChart → SankeyChart (features/analytics)
- Zustand replacement: useDialogResolution → useScanActiveDialog + useScanActions (features/scan/store)
- useAirlocks was identified as dead in TD-13 with note "0 consumers and 0 tests"

### Technical Notes
- No specialized technical review required (no database or auth concerns)
- Test-only usage does NOT prevent deletion — if a module has 0 src/ consumers but has tests, both the module and its tests are deleted

### Implementation Order
1. Hooks (no tests to delete): `useAirlocks.ts`, `useDialogResolution.ts`
2. Utils + test: `semanticColors.ts` + `semanticColors.test.ts`
3. Charts + tests: `SimplePieChart.tsx`, `GroupedBarChart.tsx` + test files

## ECC Analysis Summary
- Risk Level: LOW
- Complexity: Simple
- Sizing: SMALL (1 pt) — 3 tasks, ~8 files affected
- Agents consulted: Planner, Architect
