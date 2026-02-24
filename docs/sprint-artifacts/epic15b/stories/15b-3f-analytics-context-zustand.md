# Story 15b-3f: State: AnalyticsContext -> Zustand

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Overview

AnalyticsContext manages dual-axis navigation state (temporal position, category filter, chart mode, drill-down mode) for the analytics/trends feature. It uses a `useReducer`-based Context with 6 action types, consumed by 5 components through a single intermediary hook (`useAnalyticsNavigation`). The migration replaces AnalyticsContext with a Zustand store (`useAnalyticsStore`) at `src/features/analytics/stores/`, rewrites `useAnalyticsNavigation` to delegate to the store, removes the Provider from `viewRenderers.tsx` and `App.tsx`, and deletes `AnalyticsContext.tsx`. The `initialState` mechanism (used for navigation restoration via `analyticsInitialState` from `useNavigationStore`) must be preserved as an imperative `initialize()` action on the store.

## Functional Acceptance Criteria

- [ ] **AC1:** `useAnalyticsStore` Zustand store created with state shape matching `AnalyticsNavigationState` (temporal, category, chartMode, drillDownMode)
- [ ] **AC2:** All 5 `useAnalyticsNavigation` consumers continue to work without changes to their call sites (hook API preserved)
- [ ] **AC3:** `AnalyticsProvider` removed from `viewRenderers.tsx` (`renderTrendsView`) and `App.tsx` (inline trends rendering)
- [ ] **AC4:** `AnalyticsContext.tsx` deleted, 0 remaining references in `src/` after deletion
- [ ] **AC5:** `useAnalyticsStore.getState()` initial values match old Context defaults: `{ temporal: { level: 'year', year: getCurrentYear() }, category: { level: 'all' }, chartMode: 'aggregation', drillDownMode: 'temporal' }` (verified by test)
- [ ] **AC6:** Navigation restoration works: `analyticsInitialState` from `useNavigationStore` can initialize the analytics store before TrendsView mounts
- [ ] **AC7:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Zustand store at `src/features/analytics/stores/useAnalyticsStore.ts`
- [ ] **AC-ARCH-LOC-2:** Store barrel at `src/features/analytics/stores/index.ts`
- [ ] **AC-ARCH-LOC-3:** Store tests at `tests/unit/features/analytics/stores/useAnalyticsStore.test.ts`
- [ ] **AC-ARCH-LOC-4:** Modified hook at `src/features/analytics/hooks/useAnalyticsNavigation.ts`
- [ ] **AC-ARCH-LOC-5:** Provider removal at `src/components/App/viewRenderers.tsx`
- [ ] **AC-ARCH-LOC-6:** Provider removal at `src/App.tsx`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** `useAnalyticsStore` follows `create<State & Actions>()(devtools(...))` pattern matching `useHistoryFiltersStore`
- [ ] **AC-ARCH-PATTERN-2:** State slices map 1:1 to `AnalyticsNavigationState` fields: `temporal`, `category`, `chartMode`, `drillDownMode`
- [ ] **AC-ARCH-PATTERN-3:** Actions replace reducer cases: `setTemporalLevel()`, `setCategoryFilter()`, `toggleChartMode()`, `toggleDrillDownMode()`, `resetToYear()`, `clearCategoryFilter()`, `initialize()`
- [ ] **AC-ARCH-PATTERN-4:** `useAnalyticsNavigation` hook preserved as the consumer API -- internally delegates to `useAnalyticsStore` instead of `useContext`
- [ ] **AC-ARCH-PATTERN-5:** `validateNavigationState()` called in every action (matching current reducer behavior)
- [ ] **AC-ARCH-PATTERN-6:** `analyticsActions` object exported from store for imperative use outside React (replaces Provider prop pattern)

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No `Context.Provider` wrapper in the new implementation
- [ ] **AC-ARCH-NO-2:** No `useReducer` pattern -- use Zustand `set()` actions directly
- [ ] **AC-ARCH-NO-3:** No global store reset on route change -- state persists until explicit `initialize()` or `resetToYear()` call
- [ ] **AC-ARCH-NO-4:** No breaking changes to `useAnalyticsNavigation` return type -- `UseAnalyticsNavigationReturn` interface preserved
- [ ] **AC-ARCH-NO-5:** No direct `useAnalyticsStore` usage in component files during this story -- all access through `useAnalyticsNavigation`

## File Specification

### New Files

| File | Exact Path | Pattern | Est. Lines |
|------|------------|---------|------------|
| useAnalyticsStore.ts | `src/features/analytics/stores/useAnalyticsStore.ts` | Zustand store with devtools | ~110 |
| stores/index.ts | `src/features/analytics/stores/index.ts` | Barrel export | ~5 |
| useAnalyticsStore.test.ts | `tests/unit/features/analytics/stores/useAnalyticsStore.test.ts` | Unit test | ~150 |

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| useAnalyticsNavigation.ts | `src/features/analytics/hooks/useAnalyticsNavigation.ts` | Replace `useContext(AnalyticsContext)` with `useAnalyticsStore()`; add dispatch adapter; remove Provider error throw |
| viewRenderers.tsx | `src/components/App/viewRenderers.tsx` | Remove `AnalyticsProvider` import and wrapper; call `analyticsActions.initialize()` instead |
| App.tsx | `src/App.tsx` | Remove `AnalyticsProvider` import and wrapper; add `useEffect` calling `analyticsActions.initialize()` on `analyticsInitialState` change |
| contexts/index.ts | `src/contexts/index.ts` | Remove `AnalyticsProvider` and `AnalyticsContext` exports |
| analytics feature barrel | `src/features/analytics/index.ts` | Add re-export of store barrel if needed |

### Deleted Files

| File | Exact Path | Reason |
|------|------------|--------|
| AnalyticsContext.tsx | `src/contexts/AnalyticsContext.tsx` | Replaced by `useAnalyticsStore` |

### Test Files Requiring Updates (16 files)

| File | Change |
|------|--------|
| `tests/unit/analytics/analyticsReducer.test.tsx` | Verify store actions directly; remove `AnalyticsProvider` wrapper |
| `tests/unit/analytics/useAnalyticsNavigation.test.tsx` | Remove `AnalyticsProvider`; remove "throws outside Provider" test; init store in `beforeEach` |
| `tests/unit/analytics/DrillDownGrid.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/unit/analytics/CategoryBreadcrumb.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/unit/analytics/TemporalBreadcrumb.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/unit/analytics/ChartModeToggle.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/unit/analytics/DrillDownModeToggle.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/integration/analytics/chartModeToggle.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/integration/analytics/drillDown.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/integration/analytics/categoryBreadcrumb.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/integration/analytics/temporalBreadcrumb.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/integration/analytics/trendsViewIntegration.test.tsx` | Replace `AnalyticsProvider` with store initialization |
| `tests/integration/trends-export.test.tsx` | Remove `AnalyticsProvider` wrapper |
| `tests/integration/analytics-workflows.test.tsx` | Remove `AnalyticsProvider` wrapper |
| `tests/unit/views/TrendsView.polygon.test.tsx` | Remove `AnalyticsProvider` references |
| `tests/unit/components/App/viewRenderers.test.tsx` | Remove `AnalyticsProvider` expectations |

## Tasks / Subtasks

### Task 1: Establish baseline and analyze state shape

- [ ] 1.1 Run `npm run test:quick` and record pass count
- [ ] 1.2 Read `src/contexts/AnalyticsContext.tsx` -- confirm state shape: `{ temporal: TemporalPosition, category: CategoryPosition, chartMode: ChartMode, drillDownMode: DrillDownMode }`
- [ ] 1.3 Read `src/features/analytics/utils/analyticsHelpers.ts` -- confirm `getDefaultNavigationState()` and `validateNavigationState()` behavior
- [ ] 1.4 `grep -rn "useAnalyticsNavigation" src/ --include="*.ts" --include="*.tsx"` -- confirm 5 component files + 1 hook file
- [ ] 1.5 `grep -rn "AnalyticsProvider|AnalyticsContext" tests/ --include="*.ts" --include="*.tsx"` -- confirm 16 test files

### Task 2: Create useAnalyticsStore Zustand store

- [ ] 2.1 Create `src/features/analytics/stores/useAnalyticsStore.ts`
- [ ] 2.2 Define state interface: `AnalyticsNavigationState & { setTemporalLevel, setCategoryFilter, toggleChartMode, toggleDrillDownMode, resetToYear, clearCategoryFilter, initialize }`
- [ ] 2.3 Implement initial state via `getDefaultNavigationState(getCurrentYear())`
- [ ] 2.4 Implement all 6 actions wrapping `validateNavigationState()` after each state change (mirrors reducer logic exactly)
- [ ] 2.5 Implement `initialize(state?: AnalyticsNavigationState)` action for navigation restoration (replaces Provider `initialState` prop)
- [ ] 2.6 Export `analyticsActions` object for imperative use outside React (matches `historyFiltersActions` pattern)
- [ ] 2.7 Create `src/features/analytics/stores/index.ts` barrel
- [ ] 2.8 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 2.9 Create `tests/unit/features/analytics/stores/useAnalyticsStore.test.ts` -- verify: initial state defaults, all 6 actions, `initialize()` overrides state, `validateNavigationState` enforced

### Task 3: Rewire useAnalyticsNavigation to use store

- [ ] 3.1 In `src/features/analytics/hooks/useAnalyticsNavigation.ts`: replace `useContext(AnalyticsContext)` with `useAnalyticsStore` selectors
- [ ] 3.2 Remove `AnalyticsContext` import
- [ ] 3.3 Preserve `UseAnalyticsNavigationReturn` interface exactly
- [ ] 3.4 Add dispatch adapter routing `NavigationAction` objects to corresponding store actions (see Dev Notes)
- [ ] 3.5 Remove the "must be within AnalyticsProvider" error throw (Zustand stores are always available)
- [ ] 3.6 Run `npx tsc --noEmit` -- fix any type errors

### Task 4: Remove AnalyticsProvider from component tree and delete Context

- [ ] 4.1 In `src/components/App/viewRenderers.tsx`: remove `AnalyticsProvider` import and wrapper; call `analyticsActions.initialize(analyticsInitialState)` before rendering TrendsView; remove `AnalyticsProviderProps`/`AnalyticsInitialState` types
- [ ] 4.2 In `src/App.tsx`: remove `AnalyticsProvider` import; remove `<AnalyticsProvider>` wrapper; add `useEffect` calling `analyticsActions.initialize(analyticsInitialState)` when `analyticsInitialState` changes
- [ ] 4.3 In `src/contexts/index.ts`: remove `AnalyticsProvider` and `AnalyticsContext` exports
- [ ] 4.4 Delete `src/contexts/AnalyticsContext.tsx`
- [ ] 4.5 `grep -rn "AnalyticsContext|AnalyticsProvider" src/ --include="*.ts" --include="*.tsx"` -- must return 0
- [ ] 4.6 Run `npx tsc --noEmit` -- fix any type errors

### Task 5: Update all 16 test files

- [ ] 5.1 Define shared test helper pattern: `beforeEach(() => useAnalyticsStore.setState({ ...getDefaultNavigationState(year) }, true))`
- [ ] 5.2 Update 7 unit test files in `tests/unit/analytics/`: remove `AnalyticsProvider` wrapper; use `useAnalyticsStore.setState()` for initial state setup
- [ ] 5.3 Update 6 integration test files in `tests/integration/analytics/`: same pattern
- [ ] 5.4 Update `tests/integration/trends-export.test.tsx` and `tests/integration/analytics-workflows.test.tsx`
- [ ] 5.5 Update `tests/unit/views/TrendsView.polygon.test.tsx` and `tests/unit/components/App/viewRenderers.test.tsx`
- [ ] 5.6 Update `tests/unit/analytics/useAnalyticsNavigation.test.tsx`: remove "throws outside Provider" test; add test verifying store defaults always available
- [ ] 5.7 Run `npm run test:quick` -- all pass
- [ ] 5.8 `grep -rn "AnalyticsProvider|from.*AnalyticsContext" tests/ --include="*.ts" --include="*.tsx"` -- must return 0

### Task 6: Final verification and cleanup

- [ ] 6.1 Run `npx tsc --noEmit` -- clean
- [ ] 6.2 Run `npm run test:quick` -- all pass, record pass count
- [ ] 6.3 `grep -rn "AnalyticsContext" src/ tests/` -- 0 results (excluding docs/)
- [ ] 6.4 Update `src/types/analytics.ts` JSDoc comments referencing `AnalyticsContext` to reference `useAnalyticsStore`

## Dev Notes

### AnalyticsContext State Shape

```typescript
interface AnalyticsNavigationState {
  temporal: TemporalPosition;      // { level, year, quarter?, month?, week?, day? }
  category: CategoryPosition;      // { level, category?, group?, subcategory? }
  chartMode: ChartMode;            // 'aggregation' | 'comparison'
  drillDownMode: DrillDownMode;    // 'temporal' | 'category'
}
// Default: { temporal: { level: 'year', year: '2026' }, category: { level: 'all' }, chartMode: 'aggregation', drillDownMode: 'temporal' }
```

### dispatch Adapter Pattern

Consumers use `dispatch({ type: 'SET_TEMPORAL_LEVEL', payload })`. The hook must provide backward-compatible dispatch:

```typescript
const dispatch = useCallback((action: NavigationAction) => {
  const store = useAnalyticsStore.getState();
  switch (action.type) {
    case 'SET_TEMPORAL_LEVEL': store.setTemporalLevel(action.payload); break;
    case 'SET_CATEGORY_FILTER': store.setCategoryFilter(action.payload); break;
    case 'TOGGLE_CHART_MODE': store.toggleChartMode(); break;
    case 'TOGGLE_DRILLDOWN_MODE': store.toggleDrillDownMode(); break;
    case 'RESET_TO_YEAR': store.resetToYear(action.payload.year); break;
    case 'CLEAR_CATEGORY_FILTER': store.clearCategoryFilter(); break;
  }
}, []);
```

### Provider initialState Replacement

Current: `<AnalyticsProvider key={JSON.stringify(state)} initialState={state}>` re-mounts on navigation.

New: `analyticsActions.initialize(state)` called imperatively before rendering TrendsView. The `key` prop remounting trick is no longer needed.

### Test Update Pattern

```typescript
// Before: each test file wraps with Provider
render(<AnalyticsProvider initialState={testState}><Component /></AnalyticsProvider>);

// After: initialize store in beforeEach, no wrapper needed
beforeEach(() => useAnalyticsStore.setState({ ...getDefaultNavigationState(year), ...testState }, true));
render(<Component />);
```

The `true` flag in `setState` replaces state completely, preventing test leakage.

### Reference Store

Follow `src/shared/stores/useHistoryFiltersStore.ts`:
- `create<StoreState>()(devtools((set, get) => ({ ...defaults, actions }), { name, enabled: import.meta.env.DEV }))`
- Typed selectors exported alongside store
- `imperativeActions` object for use outside React

### Critical Pitfalls

1. **`validateNavigationState` must be called in every action** -- The current reducer calls it after every state change. Missing this allows impossible states (e.g., week without month).

2. **Action creators in test files** -- `tests/unit/analytics/analyticsReducer.test.tsx` may import action creators directly from `AnalyticsContext.tsx`. These must be re-exported from the store module or the test updated.

3. **`key` prop remounting pattern** -- Currently `key={JSON.stringify(analyticsInitialState.temporal)}` forces full Context remount. Replace with imperative `initialize()` call. Verify TrendsView picks up new state correctly after this change.

4. **`AnalyticsContextValue.dispatch` type** -- Zustand adapter dispatch must match `React.Dispatch<NavigationAction>` type signature for TypeScript compatibility.

5. **Store state must reset between tests** -- Use `true` flag in `setState` for complete replacement: `useAnalyticsStore.setState(defaults, true)`.

6. **Points raised from 2 to 3** -- 16 test files to update makes this larger than typical Context→Zustand migrations.

## ECC Analysis Summary

- **Risk Level:** MEDIUM-HIGH (16 test files to update; dispatch adapter must preserve exact type signature; Provider `key` remounting trick needs careful replacement)
- **Complexity:** Moderate -- well-defined state shape, single intermediary hook (5 components need zero changes), but 16 test files and 2 provider locations increase scope
- **Sizing:** 6 tasks / 25 subtasks / 10 source files (+ 16 test files updated separately)
- **Agents consulted:** Architect
- **Dependencies:** None -- AnalyticsContext is independent of DAL stories

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft |
| 2026-02-23 | Full rewrite. State shape: 4 fields (temporal, category, chartMode, drillDownMode). 6 reducer actions. 5 component consumers via useAnalyticsNavigation hook. 2 Provider locations. 16 test files to update. Key insight: useAnalyticsNavigation preserved as API facade with dispatch adapter for zero consumer changes. Points raised from 2 to 3. |
