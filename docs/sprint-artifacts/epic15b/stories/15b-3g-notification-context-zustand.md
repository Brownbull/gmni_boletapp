# Story 15b-3g: State: NotificationContext -> Zustand + HistoryFiltersContext Removal

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 2
**Priority:** MEDIUM
**Status:** ready-for-dev

## Overview

NotificationContext (`src/contexts/NotificationContext.tsx`) is dead code: it defines `useNotifications()` and `useNotificationsOptional()` hooks, but zero components in the app call either hook. Instead, `App.tsx` calls `useInAppNotifications()` directly and prop-drills notification state to `NotificationsView` and `Nav`. The `NotificationProvider` wraps everything in `AppProviders.tsx` but the Context value it provides is never consumed. No Zustand migration is needed -- this is a straight deletion.

HistoryFiltersContext (`src/contexts/HistoryFiltersContext.tsx`) is NOT a dead wrapper. It is a thin Zustand initialization boundary used in 8 locations across `viewRenderers.tsx` and `App.tsx`. It accepts `initialState` and `onStateChange` props that sync bidirectionally with the navigation store's `pendingHistoryFilters`. The `HistoryFiltersProvider` component must be replaced with direct Zustand store initialization calls via a new `useHistoryFiltersInit` hook.

After this story, `src/contexts/` contains only `AuthContext.tsx` and `index.ts`. Feature-scoped contexts (AnimationContext, CreditFeatureContext, CategoriesContext) are acceptable and out of scope.

## Functional Acceptance Criteria

- [ ] **AC1:** `NotificationProvider` removed from `AppProviders.tsx` -- AppProviders becomes a passthrough (or is itself deleted)
- [ ] **AC2:** `NotificationContext.tsx` deleted, 0 remaining references in `src/` or `tests/`
- [ ] **AC3:** `HistoryFiltersContext.tsx` deleted from `src/contexts/`
- [ ] **AC4:** All 8 `HistoryFiltersProvider` usages in `viewRenderers.tsx` and `App.tsx` replaced with direct `useHistoryFiltersInit` calls
- [ ] **AC5:** `onStateChange` bidirectional sync preserved -- history/items views still persist filter state to navigation store
- [ ] **AC6:** `src/contexts/index.ts` exports only AuthContext symbols
- [ ] **AC7:** Only `AuthContext.tsx` remains in `src/contexts/` as a React Context (feature-scoped contexts elsewhere are acceptable)
- [ ] **AC8:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Initialization helper at `src/shared/hooks/useHistoryFiltersInit.ts`
- [ ] **AC-ARCH-LOC-2:** No new files in `src/contexts/` beyond AuthContext

### Pattern Requirements

- [ ] **AC-ARCH-PAT-1:** History filter initialization uses `useHistoryFiltersStore.getState().initializeFilters()` directly (no Context wrapper)
- [ ] **AC-ARCH-PAT-2:** `onStateChange` sync uses `useEffect` + Zustand subscription or `useHistoryFiltersStore` selector in each view wrapper
- [ ] **AC-ARCH-PAT-3:** Follow existing Zustand store patterns from `useNavigationStore.ts`, `useSettingsStore.ts`

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No new `React.createContext` calls in `src/contexts/`
- [ ] **AC-ARCH-NO-2:** After deletion, NO `NotificationContext` or `HistoryFiltersContext` string references remain in source or tests (comments referencing history are acceptable in ADRs/docs only)
- [ ] **AC-ARCH-NO-3:** No breaking the `initialState`/`onStateChange` contract -- history and items views MUST still receive pending filters from navigation store

## File Specification

### New Files

| File | Exact Path | Pattern | Est. Lines |
|------|------------|---------|------------|
| useHistoryFiltersInit.ts | `src/shared/hooks/useHistoryFiltersInit.ts` | Custom hook (Zustand init + sync) | ~40 |

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| AppProviders.tsx | `src/app/AppProviders.tsx` | Remove `NotificationProvider` import/usage; becomes passthrough or deleted |
| viewRenderers.tsx | `src/components/App/viewRenderers.tsx` | Replace 4 `HistoryFiltersProvider` wraps with `useHistoryFiltersInit` calls |
| App.tsx | `src/App.tsx` | Replace 4 `HistoryFiltersProvider` wraps with `useHistoryFiltersInit` calls; remove `HistoryFiltersContext` import |
| contexts/index.ts | `src/contexts/index.ts` | Remove NotificationContext and HistoryFiltersContext exports |
| AppProviders.test.tsx | `tests/unit/app/AppProviders.test.tsx` | Update to reflect removed NotificationProvider |
| viewRenderers.test.tsx | `tests/unit/components/App/viewRenderers.test.tsx` | Remove `HistoryFiltersProvider` mock; update wrapper assertions |
| 6 filter test files | See Dev Notes | Replace `HistoryFiltersProvider` wrapper with `initializeFilters()` in `beforeEach` |

### Deleted Files

| File | Exact Path | Reason |
|------|------------|--------|
| NotificationContext.tsx | `src/contexts/NotificationContext.tsx` | Dead code -- zero consumers for useNotifications/useNotificationsOptional |
| HistoryFiltersContext.tsx | `src/contexts/HistoryFiltersContext.tsx` | Replaced by direct Zustand store initialization via useHistoryFiltersInit |
| NotificationContext.test.tsx | `tests/unit/contexts/NotificationContext.test.tsx` | Context deleted |

## Tasks / Subtasks

### Task 1: Establish baseline and audit both Contexts

- [ ] 1.1 Run `npm run test:quick` and record pass count
- [ ] 1.2 `grep -rn "useNotifications\b\|useNotificationsOptional" src/ --include="*.ts" --include="*.tsx"` -- confirm 0 consumer calls outside NotificationContext.tsx itself
- [ ] 1.3 `grep -rn "HistoryFiltersProvider" src/ tests/ --include="*.ts" --include="*.tsx"` -- record all 8+ usages (4 in viewRenderers.tsx, 4 in App.tsx, plus test files)
- [ ] 1.4 Document `HistoryFiltersProvider` initialization contract: `initialState`, `onStateChange`, `useLayoutEffect` + `initializeFilters`

### Task 2: Remove NotificationContext and NotificationProvider

- [ ] 2.1 In `src/app/AppProviders.tsx`: remove `NotificationProvider` wrapping -- children render directly; remove `db`/`userId`/`appId` prop usage for notifications
- [ ] 2.2 In `src/contexts/index.ts`: remove `NotificationProvider`, `useNotifications`, `useNotificationsOptional`, `NotificationContextValue` exports
- [ ] 2.3 Delete `src/contexts/NotificationContext.tsx`
- [ ] 2.4 Delete `tests/unit/contexts/NotificationContext.test.tsx`
- [ ] 2.5 Run `npx tsc --noEmit` -- fix any type errors; `grep -rn "NotificationContext\|NotificationProvider\|useNotifications\b" src/ tests/` -- must return 0 source hits

### Task 3: Create useHistoryFiltersInit hook to replace HistoryFiltersProvider

- [ ] 3.1 Create `src/shared/hooks/useHistoryFiltersInit.ts` -- custom hook that replicates HistoryFiltersProvider logic: `useLayoutEffect` to call `initializeFilters(initialState)` on mount, `useEffect` to call `onStateChange(state)` on state changes
- [ ] 3.2 Hook signature: `useHistoryFiltersInit(options?: { initialState?: HistoryFilterState; onStateChange?: (state: HistoryFilterState) => void }): void`
- [ ] 3.3 Export from `src/shared/hooks/index.ts` barrel
- [ ] 3.4 Run `npx tsc --noEmit` -- confirm compiles

### Task 4: Replace HistoryFiltersProvider in viewRenderers.tsx and App.tsx

- [ ] 4.1 In `src/components/App/viewRenderers.tsx`: replace 4 `<HistoryFiltersProvider>` wraps with `useHistoryFiltersInit()` calls inside the render functions (renderDashboardView, renderTrendsView, renderHistoryView, renderItemsView)
- [ ] 4.2 In `src/App.tsx`: replace 4 inline `<HistoryFiltersProvider>` wraps with `useHistoryFiltersInit()` calls — use `grep -n "HistoryFiltersProvider" src/App.tsx` to find current locations (line numbers shift if 15b-3f ran first and removed AnalyticsProvider wrappers; the pre-15b-3f baseline is: dashboard ~L1682, trends ~L1700, history ~L1907, items ~L1939)
- [ ] 4.3 In `src/contexts/index.ts`: remove `HistoryFiltersProvider` and `getDefaultFilterState` exports
- [ ] 4.4 Delete `src/contexts/HistoryFiltersContext.tsx`
- [ ] 4.5 Run `npx tsc --noEmit` -- fix any type errors; `grep -rn "HistoryFiltersContext\|HistoryFiltersProvider" src/` -- must return 0 (except acceptable doc/comment references)

### Task 5: Update tests and verify

- [ ] 5.1 Update `tests/unit/app/AppProviders.test.tsx` -- remove NotificationProvider mock and assertions; test that AppProviders renders children
- [ ] 5.2 Update `tests/unit/components/App/viewRenderers.test.tsx` -- remove `HistoryFiltersProvider` mock; update wrapper assertions to reflect new pattern. **Note:** If 15b-3f ran first, `AnalyticsProvider` mock references will already be removed from this file. Read the current file state before editing — only remove `HistoryFiltersProvider` references; do not re-add AnalyticsProvider assertions.
- [ ] 5.3 Update 6 test files that use `HistoryFiltersProvider` as a wrapper: `HistoryViewThumbnails.test.tsx`, `FilterChips.test.tsx`, `DashboardView.test.tsx`, `TrendsView.polygon.test.tsx`, `trendsViewIntegration.test.tsx`, `analytics-workflows.test.tsx` -- replace with direct `useHistoryFiltersStore.getState().initializeFilters()` calls in `beforeEach`
- [ ] 5.4 Verify final state: `grep -rn "createContext" src/contexts/` -- must show only `AuthContext.tsx`
- [ ] 5.5 Run `npm run test:quick` -- all pass with 0 failures

## Dev Notes

### NotificationContext Status: DEAD CODE

NotificationContext has **zero consumers**. The `useNotifications()` and `useNotificationsOptional()` hooks exported from the Context file are never called by any component. The actual notification data flow is:

```
App.tsx --> useInAppNotifications(db, userId, appId)  [DIRECT hook call]
        --> destructures: inAppNotifications, unreadCount, markAsRead, etc.
        --> prop-drills to NotificationsView (alerts view) and Nav (badge count)
```

The `NotificationProvider` in `AppProviders.tsx` wraps all children and calls the same `useInAppNotifications` hook internally, but the Context value is never consumed. **No Zustand store is needed** -- the existing `useInAppNotifications` hook in `App.tsx` already works correctly without any Context. Simply deleting the Context and removing the Provider from AppProviders is the correct action.

### HistoryFiltersContext Status: THIN INITIALIZATION BOUNDARY (NOT dead)

HistoryFiltersContext exports `HistoryFiltersProvider`, which is used in **8 locations**:

**In `src/components/App/viewRenderers.tsx` (4 locations):**
1. `renderDashboardView` -- wraps DashboardView (no props)
2. `renderTrendsView` -- wraps TrendsView + AnalyticsProvider (no props)
3. `renderHistoryView` -- wraps HistoryView (`initialState` + `onStateChange` props)
4. `renderItemsView` -- wraps ItemsView (`initialState` + `onStateChange` props)

**In `src/App.tsx` (4 locations, parallel to viewRenderers):**
1. Dashboard view (L1682, no props)
2. Trends view (L1700, no props)
3. History view (L1907, `initialState={pendingHistoryFilters}`, `onStateChange={setPendingHistoryFilters}`)
4. Items view (L1939, `initialState={pendingHistoryFilters}`, `onStateChange={setPendingHistoryFilters}`)

The Provider does two things:
1. **Initialization:** Calls `useHistoryFiltersStore.getState().initializeFilters(initialState)` in `useLayoutEffect` on mount
2. **Sync:** Subscribes to Zustand state changes and calls `onStateChange(state)` to persist filter state to the navigation store's `pendingHistoryFilters`

The replacement `useHistoryFiltersInit` hook must replicate both behaviors.

### Render Function Pattern Pitfall

`viewRenderers.tsx` uses plain functions, not components. React hooks cannot be called inside plain functions. The render functions may need to become small wrapper components (e.g., `DashboardViewWithFilters`), or the init logic must be pushed into the view components themselves. The cleanest approach is to call `useHistoryFiltersInit` inside each view component's top level, passing the `initialState` and `onStateChange` down as props that can be `undefined` for views that don't need filter sync.

### Critical Pitfalls

1. **HistoryFiltersProvider is NOT dead** -- the original story stub speculated it might have zero consumers. It has 8. The `initialState` / `onStateChange` bidirectional sync is critical for filter persistence across view navigation (history and items views).
2. **useLayoutEffect timing:** The existing Provider uses `useLayoutEffect` for initialization to prevent visual flash. The replacement hook must preserve this timing -- using `useEffect` instead would cause a brief flash of default filter state before the correct state applies.
3. **AppProviders after NotificationProvider removal:** AppProviders becomes a thin wrapper that only syncs `fontFamily` to Zustand. Consider whether to keep AppProviders (for future provider additions) or inline the `useEffect` into App.tsx.
4. **6 test files wrap with HistoryFiltersProvider:** Each test that uses `<HistoryFiltersProvider initialState={...}>` must be migrated to call `useHistoryFiltersStore.getState().initializeFilters(initialState)` in `beforeEach` instead.

### Other createContext Calls in the Codebase (NOT in scope)

These feature-scoped contexts are acceptable and NOT targeted for removal:
- `src/components/animation/AnimationContext.tsx` -- AnimationContext
- `src/features/credit/CreditFeature.tsx` -- CreditFeatureContext
- `src/features/categories/CategoriesFeature.tsx` -- CategoriesContext

## ECC Analysis Summary

- **Risk Level:** MEDIUM (HistoryFiltersProvider has 8 source usages + 6 test usages; bidirectional sync must be preserved)
- **Complexity:** Moderate -- NotificationContext is a simple deletion, but HistoryFiltersProvider replacement requires careful handling of initialization timing and onStateChange sync
- **Sizing:** 5 tasks / 23 subtasks / 10 files (3 deleted, 7 modified/created)
- **Agents consulted:** Architect
- **Dependencies:** 15b-3f (AnalyticsContext -> Zustand) can run in parallel; this story is the Phase 3 exit gate confirming `src/contexts/` contains only AuthContext

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (story stub) |
| 2026-02-23 | Full rewrite with codebase research. Key finding: NotificationContext has 0 consumers (dead code, no Zustand migration needed). HistoryFiltersContext is NOT dead -- 8 usages as Zustand initialization boundary. Replaced "create useNotificationStore" task with straight deletion. Added useHistoryFiltersInit hook as HistoryFiltersProvider replacement. Identified render function pattern pitfall (hooks in plain functions). |
| 2026-02-27 | ECC re-creation validation: `NotificationContext.test.tsx` does not exist (Task 2.4 is no-op). Status: ready-for-dev. |
