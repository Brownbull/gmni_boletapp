# Story 15-TD-7: Context Cleanup & Dead Code Removal

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** ready-for-dev

## Description

Complete the Context→Zustand migration by removing deprecated contexts, extracting their types to standalone modules, deleting confirmed dead code, and unifying the toast mechanism.

## Background

Phase 7 migrated `HistoryFiltersContext`, `ThemeContext`, and `AppStateContext` to Zustand stores but left the context files with `@deprecated` markers and type exports still consumed by 15+ files. `useLearningPhases.ts` (477 lines) has zero consumers. Two toast mechanisms coexist.

## Source Tech Debt Items

- **TD-10:** `useLearningPhases.ts` (477 lines) has zero consumers — candidate for deletion
- **TD-12:** Toast convergence: `useToast` vs legacy `AppStateContext.toastMessage` paths — unify into single toast store
- **TD-19:** Deprecated contexts (HistoryFilters, Theme, AppState) — extract types to `src/types/`, plan removal
- **TD-21:** `HistoryFiltersProvider` calls `getState()` during render — move to `useLayoutEffect`

## Acceptance Criteria

- [ ] **AC1:** `useLearningPhases.ts` deleted (confirmed zero consumers via grep)
- [ ] **AC2:** History filter types extracted to `src/types/historyFilters.ts`, all 15+ importers updated
- [ ] **AC3:** `HistoryFiltersContext.tsx` reduced to thin Provider wrapper only (no type exports)
- [ ] **AC4:** `ThemeContext.tsx` deleted (zero functional consumers after Phase 7)
- [ ] **AC5:** `AppStateContext.tsx` deleted (zero functional consumers after Phase 7)
- [ ] **AC6:** `HistoryFiltersProvider` initialization moved from render to `useLayoutEffect`
- [ ] **AC7:** Toast mechanism unified: single `useToast` hook backed by Zustand (no AppStateContext path)
- [ ] **AC8:** All tests pass; deprecated context test files updated or removed

## Tasks

- [ ] **Task 1:** Delete confirmed dead code
  - [ ] Grep for `useLearningPhases` consumers — confirm zero, then delete file
  - [ ] Delete associated test file if exists
- [ ] **Task 2:** Extract History filter types
  - [ ] Create `src/types/historyFilters.ts` with all filter types
  - [ ] Update all 15+ importers from `@/contexts/HistoryFiltersContext` → `@/types/historyFilters`
  - [ ] Remove type exports from `HistoryFiltersContext.tsx`
- [ ] **Task 3:** Remove deprecated contexts
  - [ ] Delete `src/contexts/ThemeContext.tsx` (verify zero imports remain)
  - [ ] Delete `src/contexts/AppStateContext.tsx` (verify zero imports remain)
  - [ ] Update `src/contexts/index.ts` barrel
  - [ ] Update/remove test files: `AppStateContext.test.tsx`, `ThemeContext.test.tsx`
- [ ] **Task 4:** Fix HistoryFiltersProvider render-time side effect
  - [ ] Move `getState().initializeFilters()` from render phase to `useLayoutEffect`
- [ ] **Task 5:** Unify toast mechanism
  - [ ] Ensure all toast calls go through `useToast` hook
  - [ ] Remove any remaining `AppStateContext.toastMessage` references
  - [ ] Update `AppProviders.tsx` if needed
- [ ] **Task 6:** Remove deprecated pending scan API functions
  - [ ] Delete `savePendingScan()`, `loadPendingScan()`, `clearPendingScan()` from `pendingScanStorage.ts` (lines 637-686)
  - [ ] Grep for consumers first — TODO at line 631 says "confirm no other usages"
  - [ ] Remove associated exports from barrel files if any

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useLearningPhases.ts` | DELETE | Dead code — zero consumers |
| `src/types/historyFilters.ts` | CREATE | Extracted filter types |
| `src/contexts/ThemeContext.tsx` | DELETE | Deprecated, replaced by useSettingsStore |
| `src/contexts/AppStateContext.tsx` | DELETE | Deprecated, replaced by useToast |
| `src/contexts/HistoryFiltersContext.tsx` | MODIFY | Remove type exports, keep thin Provider |
| `src/contexts/index.ts` | MODIFY | Remove deleted context exports |
| `tests/unit/contexts/AppStateContext.test.tsx` | DELETE | Context removed |
| `tests/unit/contexts/ThemeContext.test.tsx` | DELETE | Context removed |
| `src/services/pendingScanStorage.ts` | MODIFY | Remove deprecated scan API functions (Task 6) |

## Dev Notes

- Before deleting any file, grep for ALL imports/references across `src/` and `tests/`
- `HistoryFiltersContext` types are imported by `useHistoryFiltersStore.ts` itself — break this circular dependency first
- Toast unification: `useToast` is already the primary mechanism. Search for any remaining `setToastMessage` or `toastMessage` references in AppStateContext consumers
- `useLearningPhases.ts` at 477 lines — deletion removes significant dead code
- Run tests after each deletion step (`.claude/rules/testing.md` refactoring rule)
