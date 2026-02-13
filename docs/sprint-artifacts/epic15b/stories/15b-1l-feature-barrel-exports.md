# Story 15b-1l: Feature Barrel Exports + Depcruise Cycle Check

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

Ensure all feature modules have clean `index.ts` barrel exports and run depcruise to verify no new circular dependencies were introduced during Phase 1 consolidation.

## Acceptance Criteria

- [ ] **AC1:** Every feature module has a complete `index.ts` barrel with all public exports
- [ ] **AC2:** No new circular dependencies introduced (compare against Phase 0 baseline)
- [ ] **AC3:** Feature adoption >80% (files in features / total files)
- [ ] **AC4:** Depcruise metrics stable or improved vs Phase 0 baseline
- [ ] **AC5:** `npm run test:story` passes (full integration tests — Phase 1 exit gate)

## Tasks

- [ ] **Task 1:** Audit each feature's `index.ts` barrel
  - [ ] `features/analytics/index.ts`
  - [ ] `features/batch-review/index.ts`
  - [ ] `features/dashboard/index.ts`
  - [ ] `features/history/index.ts`
  - [ ] `features/insights/index.ts`
  - [ ] `features/items/index.ts`
  - [ ] `features/reports/index.ts`
  - [ ] `features/scan/index.ts`
  - [ ] `features/settings/index.ts`
  - [ ] `features/transaction-editor/index.ts`
- [ ] **Task 2:** Run depcruise and compare against Phase 0 baseline
  - [ ] Circular dependencies: must be 0
  - [ ] Layer violations: must be 0
  - [ ] No new orphaned modules
- [ ] **Task 3:** Calculate feature adoption metrics
  - [ ] Count files in `src/features/` vs total `src/` files
  - [ ] Target: >80%
- [ ] **Task 4:** Run `npm run test:story` (Phase 1 exit gate)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/*/index.ts` | VERIFY/MODIFY | Ensure complete barrel exports |
| `dependency-diagrams/` | UPDATE | Phase 1 metrics comparison |

## Dev Notes

- This is the Phase 1 exit gate story — must pass before Phase 2 decomposition begins
- If new cycles were introduced during consolidation, fix them in this story
- Feature barrel exports should re-export only the public API — not internal implementation files
- Pattern: `export { FooView } from './views/FooView'` not `export * from './views/'`
