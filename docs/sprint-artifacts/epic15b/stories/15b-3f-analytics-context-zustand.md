# Story 15b-3f: State: AnalyticsContext -> Zustand

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Migrate AnalyticsContext (temporal/category position state) to a Zustand store. This removes one of 3 remaining non-Auth React Contexts in the app.

## Acceptance Criteria

- [ ] **AC1:** New `useAnalyticsStore` Zustand store created with same state shape
- [ ] **AC2:** All AnalyticsContext consumers migrated to useAnalyticsStore
- [ ] **AC3:** AnalyticsContext provider removed from component tree
- [ ] **AC4:** AnalyticsContext files deleted
- [ ] **AC5:** Initial state matches old Context defaults (state hydration test)
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Read AnalyticsContext to understand state shape and default values
- [ ] **Task 2:** Create `useAnalyticsStore` Zustand store with identical state
- [ ] **Task 3:** Grep for all AnalyticsContext consumers
- [ ] **Task 4:** Migrate consumers one-by-one to useAnalyticsStore
  - [ ] Run tests after each migration
- [ ] **Task 5:** Remove AnalyticsContext provider from component tree
- [ ] **Task 6:** Delete AnalyticsContext files
  - [ ] Verify 0 remaining references

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/analytics/stores/useAnalyticsStore.ts` | CREATE | New Zustand store |
| `src/contexts/AnalyticsContext.tsx` | DELETE | After all consumers migrated |
| Consumer files | MODIFY | Replace context hook with store hook |
| `src/App.tsx` or provider wrapper | MODIFY | Remove AnalyticsContext.Provider |

## Dev Notes

- Follow the same pattern as `useHistoryFiltersStore` (migrated in Epic 15 Phase 7a)
- Key difference: Zustand stores don't need providers — just import and use
- State hydration test: verify `useAnalyticsStore.getState()` matches old Context default
- Check for `useContext(AnalyticsContext)` patterns — replace with `useAnalyticsStore(selector)`
