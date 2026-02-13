# Story 15b-3g: State: NotificationContext -> Zustand + HistoryFiltersContext Removal

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Migrate NotificationContext to Zustand and remove the legacy HistoryFiltersContext wrapper. After this story, the only React Context should be AuthContext (which is correct for Firebase Auth).

## Background

- `NotificationContext` manages in-app notification state — candidate for Zustand
- `HistoryFiltersContext` is a legacy wrapper around the Zustand `useHistoryFiltersStore` (created in Epic 15 Phase 7a) — may have zero consumers, needs verification before deletion

## Acceptance Criteria

- [ ] **AC1:** New `useNotificationStore` Zustand store created
- [ ] **AC2:** All NotificationContext consumers migrated
- [ ] **AC3:** NotificationContext provider and files deleted
- [ ] **AC4:** HistoryFiltersContext verified as zero consumers and deleted (or consumers migrated if any remain)
- [ ] **AC5:** Only AuthContext remains as a React Context
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Audit HistoryFiltersContext — grep for all consumers
  - [ ] If 0 consumers: delete immediately
  - [ ] If consumers remain: migrate to useHistoryFiltersStore
- [ ] **Task 2:** Read NotificationContext — understand state shape
- [ ] **Task 3:** Create `useNotificationStore` Zustand store
- [ ] **Task 4:** Migrate NotificationContext consumers one-by-one
- [ ] **Task 5:** Remove both Context providers from component tree
- [ ] **Task 6:** Delete Context files, verify 0 references
  - [ ] Confirm only AuthContext remains

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/shared/stores/useNotificationStore.ts` | CREATE | New Zustand store |
| `src/contexts/NotificationContext.tsx` | DELETE | After migration |
| `src/contexts/HistoryFiltersContext.tsx` | DELETE | After verification |
| Consumer files | MODIFY | Replace context hooks with store hooks |
| Provider wrapper | MODIFY | Remove both Context.Providers |

## Dev Notes

- This is the Phase 3 exit gate story — after this, 0 non-Auth Contexts should remain
- HistoryFiltersContext might be completely dead (the Zustand store exists since Phase 7a)
- NotificationContext likely wraps in-app notification toast/badge state
- Follow same migration pattern as 15b-3f (AnalyticsContext)
