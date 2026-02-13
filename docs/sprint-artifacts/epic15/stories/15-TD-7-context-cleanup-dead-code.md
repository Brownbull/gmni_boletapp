# Story 15-TD-7: Context Cleanup & Dead Code Removal

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** done

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

- [x] **AC1:** `useLearningPhases.ts` deleted (confirmed zero consumers via grep)
- [x] **AC2:** History filter types extracted to `src/types/historyFilters.ts`, all 15+ importers updated
- [x] **AC3:** `HistoryFiltersContext.tsx` reduced to thin Provider wrapper only (no type exports)
- [x] **AC4:** `ThemeContext.tsx` deleted (zero functional consumers after Phase 7)
- [x] **AC5:** `AppStateContext.tsx` deleted (zero functional consumers after Phase 7)
- [x] **AC6:** `HistoryFiltersProvider` initialization moved from render to `useLayoutEffect`
- [x] **AC7:** Toast mechanism unified: single `useToast` hook backed by Zustand (no AppStateContext path)
- [x] **AC8:** All tests pass; deprecated context test files updated or removed

## Tasks

- [x] **Task 1:** Delete confirmed dead code
  - [x] Grep for `useLearningPhases` consumers — confirm zero, then delete file
  - [x] Delete associated test file if exists
- [x] **Task 2:** Extract History filter types
  - [x] Create `src/types/historyFilters.ts` with all filter types
  - [x] Update all 15+ importers from `@/contexts/HistoryFiltersContext` → `@/types/historyFilters`
  - [x] Remove type exports from `HistoryFiltersContext.tsx`
- [x] **Task 3:** Remove deprecated contexts
  - [x] Delete `src/contexts/ThemeContext.tsx` (verify zero imports remain)
  - [x] Delete `src/contexts/AppStateContext.tsx` (verify zero imports remain)
  - [x] Update `src/contexts/index.ts` barrel
  - [x] Update/remove test files: `AppStateContext.test.tsx`, `ThemeContext.test.tsx`
- [x] **Task 4:** Fix HistoryFiltersProvider render-time side effect
  - [x] Move `getState().initializeFilters()` from render phase to `useLayoutEffect`
- [x] **Task 5:** Unify toast mechanism
  - [x] Ensure all toast calls go through `useToast` hook
  - [x] Remove any remaining `AppStateContext.toastMessage` references
  - [x] Update `AppProviders.tsx` if needed (not needed — already unified)
- [x] **Task 6:** Remove deprecated pending scan API functions
  - [x] Delete `savePendingScan()`, `loadPendingScan()`, `clearPendingScan()` from `pendingScanStorage.ts`
  - [x] Grep for consumers first — confirmed zero external consumers
  - [x] Remove associated exports from barrel files if any (none needed)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useLearningPhases.ts` | DELETE | Dead code — zero consumers |
| `tests/unit/hooks/useLearningPhases.test.ts` | DELETE | Test for dead code |
| `src/types/historyFilters.ts` | CREATE | Extracted filter types + action creators |
| `src/contexts/ThemeContext.tsx` | DELETE | Deprecated, replaced by useSettingsStore |
| `src/contexts/AppStateContext.tsx` | DELETE | Deprecated, replaced by useToast |
| `src/contexts/HistoryFiltersContext.tsx` | MODIFY | Remove type exports, keep thin Provider, useLayoutEffect |
| `src/contexts/index.ts` | MODIFY | Remove deleted context exports |
| `tests/unit/contexts/AppStateContext.test.tsx` | DELETE | Context removed |
| `tests/unit/contexts/ThemeContext.test.tsx` | DELETE | Context removed |
| `src/services/pendingScanStorage.ts` | MODIFY | Remove 7 deprecated scan API functions (~180 lines) |
| `tests/unit/services/pendingScanStorage.test.ts` | MODIFY | Remove legacy API tests (~190 lines) |
| 15+ source files | MODIFY | Import path: `@/contexts/HistoryFiltersContext` → `@/types/historyFilters` |
| 8+ test files | MODIFY | Import path: type imports → `@/types/historyFilters` |

## Dev Notes

- Before deleting any file, grep for ALL imports/references across `src/` and `tests/`
- `HistoryFiltersContext` types are imported by `useHistoryFiltersStore.ts` itself — break this circular dependency first
- Toast unification: `useToast` is already the primary mechanism. Search for any remaining `setToastMessage` or `toastMessage` references in AppStateContext consumers
- `useLearningPhases.ts` at 477 lines — deletion removes significant dead code
- Run tests after each deletion step (`.claude/rules/testing.md` refactoring rule)
- **Implementation Notes (2026-02-11):**
  - Circular dependency between HistoryFiltersContext↔useHistoryFiltersStore broken by extracting types to `src/types/historyFilters.ts`
  - Toast was already unified — `AppStateContext.toastMessage` had zero consumers; deletion completed the cleanup
  - 7 deprecated functions removed from pendingScanStorage.ts: savePendingScan, loadPendingScan, clearPendingScan, hasPendingScan, updatePendingScanTransaction, updatePendingScanImages, getPendingScanStorageInfo
  - Net code removal: ~900+ lines (5 source files deleted, 2 test files deleted, ~370 lines removed from 2 files)

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-11
- **Classification:** COMPLEX (6 tasks, ~45 files, stores + security keywords)
- **ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide
- **Outcome:** APPROVE with minor fixes (8 quick fixes applied, 1 deferred)
- **Overall Score:** 9/10 | TEA Test Score: 90/100 (GOOD)

**Quick Fixes Applied (8):**
1. Corrected misleading useLayoutEffect comment timing description
2. Deleted dead action creators from `src/types/historyFilters.ts` (lines 108-138)
3. Removed deprecated `HistoryFiltersContextValue` interface + null context export
4. Restored DashboardView CircularProgress bgRingOpacity to 0.2 (visual parity)
5. Added explanation to eslint-disable-line comment
6. Fixed stale line reference in pendingScanStorage.ts comment
7. Updated stale JSDoc example in `src/contexts/index.ts`
8. Fixed bare `toHaveBeenCalled` → `toHaveBeenCalledWith()` in test

### Tech Debt Stories Created / Updated

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-17](./15-TD-17-report-innerhtml-sanitization.md) | ReportDetailOverlay innerHTML → DOM API (pre-existing XSS defense-in-depth) | LOW | CREATED |
