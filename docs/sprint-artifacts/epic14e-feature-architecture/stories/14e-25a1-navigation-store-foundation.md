# Story 14e.25a.1: Navigation Store Foundation

Status: done

## Completion Summary (2026-01-27)

Implementation completed via Atlas-enhanced dev-story workflow.

**Archie Review (2026-01-27):** ⚠️ APPROVED WITH NOTES → ✅ FULLY RESOLVED
- 4 follow-up items documented (1 HIGH, 2 MEDIUM, 1 LOW)
- **All items resolved (2026-01-27):**
  - V1 [HIGH]: Removed `useNavigationHandlers` - logic moved to local App.tsx wrappers
  - V2 [MEDIUM]: Accepted hook location in store file (follows Zustand patterns)
  - V3 [MEDIUM]: Integrated scroll position store - removed `scrollPositionsRef`
  - V4 [LOW]: Removed `setPreviousView` compatibility wrapper
- **Test Results:** 5986 tests passing

### Files Created
- `src/shared/stores/useNavigationStore.ts` - Navigation Zustand store with devtools middleware
- `tests/unit/shared/stores/useNavigationStore.test.ts` - 42 unit tests covering all ACs

### Files Modified
- `src/app/types.ts` - Added View type and classification utilities
- `src/app/index.ts` - Exported View type and utilities
- `src/components/App/types.ts` - Re-exports View type for backward compatibility
- `src/shared/stores/index.ts` - Exported navigation store hooks
- `src/App.tsx` - Migrated navigation state to Zustand store

### Key Deliverables
- **AC1**: View type relocated to `src/app/types.ts` ✅
- **AC2**: Navigation Zustand store with devtools ✅
- **AC3**: App.tsx migrated to store selectors ✅
- **AC4**: 42 unit tests (exceeds 15+ requirement) ✅
- **AC5**: Filter persistence preserved ✅
- **AC6**: Analytics state transfer working ✅

### Test Results
- Type check: PASS
- Quick tests: 5986 passed (42 new navigation store tests)

---

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 3
**Created:** 2026-01-27
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-23 (App.tsx Final Cleanup)
**Blocks:** 14e-25a.2, 14e-25b, 14e-25c, 14e-25d

---

## Story

As a **developer**,
I want **navigation state moved from App.tsx to a Zustand store**,
So that **all views can access navigation without prop drilling and the foundation is laid for view-owned data**.

---

## Context

### Parent Story Split

This is part 1 of 2 for Story 14e-25a "Navigation Store + HistoryView Migration":

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| **14e-25a.1** | Navigation store + App.tsx migration | 3 | THIS STORY |
| 14e-25a.2 | HistoryView owns its data + tests | 3 | Blocked by 25a.1 |

### Why Split?

Original story had 6 tasks and 35 subtasks - at upper limit of complexity. Splitting ensures:
1. Each story is independently shippable and testable
2. Navigation store provides immediate value for all subsequent migrations
3. Risk is contained - if issues arise, rollback scope is smaller

### Why Navigation Store First?

All views need navigation. By creating `useNavigation()` first:
1. All subsequent view migrations can use it immediately
2. We establish the Zustand store pattern for global UI state
3. No temporary prop-drilling needed during migration

---

## Pre-Implementation Requirements

### Type Relocation (REQUIRED before Task 1)

Before creating the navigation store, relocate `View` type to prevent bidirectional dependencies:

```typescript
// Move from src/components/App/types.ts to src/app/types.ts
export type View = 'dashboard' | 'history' | 'trends' | 'settings' | 'insights' | 'reports' | ...;
```

Update all imports across the codebase to use `@app/types`.

---

## Acceptance Criteria

### AC1: Navigation Zustand Store

**Given** the need for global navigation state
**When** this story is complete
**Then:**
- [x] `src/shared/stores/useNavigationStore.ts` exists with Zustand store
- [x] Store contains: `view`, `previousView`, `settingsSubview`, `analyticsInitialState`
- [x] Store provides actions: `setView`, `navigateToView`, `navigateBack`
- [x] Store supports scroll position preservation per view
- [x] DevTools integration enabled (`devtools` middleware)

### AC2: useNavigation() Hook

**Given** the navigation store exists
**When** components need navigation
**Then:**
- [x] `src/shared/hooks/useNavigation.ts` exports `useNavigation()` hook *(implemented in store file per V2 review)*
- [x] Hook provides typed selectors for view state
- [x] Hook provides navigation actions
- [x] Hook is exported from `src/shared/hooks/index.ts` *(via stores barrel)*

### AC3: App.tsx Migrated to Navigation Store

**Given** the navigation store and hook exist
**When** App.tsx uses them
**Then:**
- [x] `useState<View>('dashboard')` replaced with `useNavigationStore`
- [x] `previousView` state replaced with store
- [x] `settingsSubview` state replaced with store
- [x] `analyticsInitialState` state replaced with store
- [x] `useNavigationHandlers` hook call removed
- [x] View routing still works correctly

### AC4: Tests Written

**Given** the refactored code
**When** running tests
**Then:**
- [x] Navigation store has unit tests (15+ tests for state transitions, actions)
- [x] `useNavigation()` hook has unit tests
- [x] All existing navigation-related tests pass

### AC5: Filter Persistence Preserved (Atlas)

> 🗺️ Added via Atlas workflow chain analysis

**Given** the existing filter persistence behavior documented in architecture
**When** navigation occurs
**Then:**
- [x] Navigating FROM dashboard/settings/analytics TO history → filters cleared
- [x] Navigating WITHIN history/items/transaction-editor → filters persist
- [x] Default temporal filter: Current month (not "all time")

### AC6: Analytics State Transfer (Atlas)

> 🗺️ Added via Atlas workflow chain analysis

**Given** TrendsView needs initial state from navigation
**When** navigating to TrendsView with analytics state
**Then:**
- [x] `analyticsInitialState` properly passes slide/dimension/level to TrendsView
- [x] State clears after TrendsView consumes it (via `clearPendingFilters()`)

---

## Tasks / Subtasks

### Task 0: Relocate View Type (AC: Pre-req)

- [x] **0.1** Move `View` type from `src/components/App/types.ts` to `src/app/types.ts`
- [x] **0.2** Update all imports across codebase (use search-replace)
- [x] **0.3** Verify no circular dependencies

### Task 1: Create Navigation Zustand Store (AC: 1)

- [x] **1.1** Create `src/shared/stores/useNavigationStore.ts`
- [x] **1.2** Define state interface: `view`, `previousView`, `settingsSubview`, `scrollPositions`, `analyticsInitialState`, `pendingHistoryFilters`, `pendingDistributionView`
- [x] **1.3** Implement `setView(view)` action with scroll preservation
- [x] **1.4** Implement `navigateToView(view, options?)` action
- [x] **1.5** Implement `navigateBack()` action
- [x] **1.6** Add devtools middleware for debugging
- [x] **1.7** Export from `src/shared/stores/index.ts`

### Task 2: Create useNavigation() Hook (AC: 2)

- [x] **2.1** Create `src/shared/hooks/useNavigation.ts` *(implemented in store file per V2 review)*
- [x] **2.2** Export typed selectors: `useCurrentView()`, `usePreviousView()`, etc.
- [x] **2.3** Export actions from store
- [x] **2.4** Add to `src/shared/hooks/index.ts` barrel export *(via stores barrel)*
- [x] **2.5** Write unit tests for hook (8+ tests)

### Task 3: Migrate App.tsx to Navigation Store (AC: 3, 4)

- [x] **3.1** Replace `useState<View>('dashboard')` with `useNavigationStore`
- [x] **3.2** Replace `previousView` state with store
- [x] **3.3** Replace `settingsSubview` state with store
- [x] **3.4** Replace `analyticsInitialState` state with store
- [x] **3.5** Replace `pendingHistoryFilters` state with store
- [x] **3.6** Replace `pendingDistributionView` state with store
- [x] **3.7** Remove `useNavigationHandlers` hook call (handlers now come from store)
- [x] **3.8** Verify view routing still works
- [x] **3.9** Write navigation store unit tests (15+ tests)

---

## Review Follow-ups (Archie)

> 🚒 Post-dev feature review: 2026-01-27
> ✅ Review items addressed: 2026-01-27

### Outstanding Items - RESOLVED

- [x] **[Archie-Review][🔴 HIGH] V1: Remove useNavigationHandlers hook call** [App.tsx:722-741]
  - ✅ FIXED: Removed `useNavigationHandlers` import and call
  - Navigation logic now in local wrapper functions in App.tsx
  - Local wrappers use store actions + mainRef for scroll handling + scanState for dialog dismissal
  - Filter clearing useEffect hooks moved to App.tsx

- [x] **[Archie-Review][🟡 MEDIUM] V2: useNavigation hook location differs from spec** [useNavigationStore.ts:297-308]
  - ✅ ACCEPTED AS-IS: Hook location in store file is simpler and follows Zustand patterns
  - AC2 updated to reflect actual implementation (hook in store file, exported from barrel)
  - This pattern matches other Zustand stores in the codebase (scan store, batch review store)

- [x] **[Archie-Review][🟡 MEDIUM] V3: Scroll position store feature not integrated** [App.tsx:666]
  - ✅ FIXED: Removed `scrollPositionsRef`
  - App.tsx now uses `saveScrollPosition` and `getScrollPosition` from navigation store
  - Local navigation wrappers handle DOM scrolling via mainRef

- [x] **[Archie-Review][🟢 LOW] V4: Remove setPreviousView compatibility wrapper** [App.tsx:545-548]
  - ✅ FIXED: Removed the no-op `setPreviousView` callback wrapper
  - No longer needed since useNavigationHandlers is removed

### Review Verdict

**Status: ✅ FULLY RESOLVED** - All review items addressed, 5986 tests passing.

---

## Dev Notes

### Navigation Store Structure

```typescript
// src/shared/stores/useNavigationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { View } from '@app/types';
import type { HistoryFilterState } from '@/contexts/HistoryFiltersContext';
import type { AnalyticsNavigationState } from '@/types/analytics';

type SettingsSubview = 'main' | 'limites' | 'perfil' | 'preferencias' | 'escaneo' | 'suscripcion' | 'datos' | 'grupos' | 'app' | 'cuenta';

interface NavigationState {
    view: View;
    previousView: View;
    settingsSubview: SettingsSubview;
    scrollPositions: Record<View, number>;
    // Cross-view navigation state
    analyticsInitialState: AnalyticsNavigationState | null;
    pendingHistoryFilters: HistoryFilterState | null;
    pendingDistributionView: 'treemap' | 'donut' | null;
}

interface NavigationActions {
    setView: (view: View) => void;
    navigateToView: (view: View, options?: {
        historyFilters?: HistoryFilterState;
        analyticsState?: AnalyticsNavigationState;
        distributionView?: 'treemap' | 'donut';
    }) => void;
    navigateBack: () => void;
    setSettingsSubview: (subview: SettingsSubview) => void;
    saveScrollPosition: (view: View, position: number) => void;
    clearPendingFilters: () => void;
}

export const useNavigationStore = create<NavigationState & NavigationActions>()(
    devtools(
        (set, get) => ({
            // Initial state
            view: 'dashboard',
            previousView: 'dashboard',
            settingsSubview: 'main',
            scrollPositions: {},
            analyticsInitialState: null,
            pendingHistoryFilters: null,
            pendingDistributionView: null,

            // Actions
            setView: (view) => set((state) => ({
                previousView: state.view,
                view,
            })),

            navigateToView: (view, options = {}) => set((state) => ({
                previousView: state.view,
                view,
                pendingHistoryFilters: options.historyFilters ?? null,
                analyticsInitialState: options.analyticsState ?? null,
                pendingDistributionView: options.distributionView ?? null,
            })),

            navigateBack: () => set((state) => ({
                view: state.previousView,
                previousView: state.view,
            })),

            setSettingsSubview: (subview) => set({ settingsSubview: subview }),

            saveScrollPosition: (view, position) => set((state) => ({
                scrollPositions: { ...state.scrollPositions, [view]: position },
            })),

            clearPendingFilters: () => set({
                pendingHistoryFilters: null,
                pendingDistributionView: null,
            }),
        }),
        { name: 'navigation-store' }
    )
);

// Typed selectors (prevent unnecessary re-renders)
export const useCurrentView = () => useNavigationStore((s) => s.view);
export const usePreviousView = () => useNavigationStore((s) => s.previousView);
export const useSettingsSubview = () => useNavigationStore((s) => s.settingsSubview);
export const useNavigationActions = () => useNavigationStore((s) => ({
    setView: s.setView,
    navigateToView: s.navigateToView,
    navigateBack: s.navigateBack,
    setSettingsSubview: s.setSettingsSubview,
}));
```

### What Gets Removed from App.tsx

```typescript
// REMOVE: Navigation state (~30 lines)
const [view, setView] = useState<View>('dashboard');
const [previousView, setPreviousView] = useState<View>('dashboard');
const [settingsSubview, setSettingsSubview] = useState<...>('main');
const [analyticsInitialState, setAnalyticsInitialState] = useState<...>(null);
const [pendingHistoryFilters, setPendingHistoryFilters] = useState<...>(null);
const [pendingDistributionView, setPendingDistributionView] = useState<...>(null);

// REMOVE: useNavigationHandlers call (~20 lines)
const { navigateToView, navigateBack, handleNavigateToHistory } = useNavigationHandlers({...});

// REMOVE: navigationHandlers bundle (~10 lines)
const navigationHandlers = useMemo(() => ({...}), [...]);
```

### Estimated Line Reduction

| Section | Lines Removed |
|---------|---------------|
| Navigation state declarations | ~30 |
| useNavigationHandlers call | ~20 |
| Navigation handler bundle | ~10 |
| **Total** | **~60** |

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 4 | ≤4 | ✅ OK |
| Subtasks | 18 | ≤15 | ⚠️ ACCEPTABLE |
| Files Changed | ~5 | ≤8 | ✅ OK |

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-27)

### Affected Workflows

- **#4 Analytics Navigation Flow** - TrendsView state initialization via `analyticsInitialState`
- **#6 History Filter Flow** - Filter persistence via `pendingHistoryFilters` and `pendingDistributionView`

### Downstream Effects to Consider

- Views using `handleNavigateToHistory()` will transition from prop-based to store-based navigation
- Filter persistence behavior must be preserved (see architecture.md:186-189)
- Scroll position preservation is new functionality requiring validation

### Testing Implications

- **Existing tests to verify:** `tests/unit/hooks/app/useNavigationHandlers.test.ts` (38 tests)
- **New scenarios to add:**
  - Store persistence across view transitions
  - Scroll position save/restore per view
  - Filter clearing vs preservation logic

### Workflow Chain Visualization

```
[TrendsView drill-down] → pendingHistoryFilters → [THIS STORY: Navigation Store] → [HistoryView filtered]
[Any View] → analyticsInitialState → [THIS STORY: Navigation Store] → [TrendsView initialized]
```

---

## Test Requirements

### Navigation Store Tests (20+ tests)

```typescript
// tests/unit/shared/stores/useNavigationStore.test.ts
describe('useNavigationStore', () => {
    describe('initial state', () => {
        it('starts with dashboard view');
        it('has null pending filters');
    });

    describe('setView', () => {
        it('updates current view');
        it('stores previous view');
    });

    describe('navigateToView', () => {
        it('navigates with history filters');
        it('navigates with analytics state');
        it('clears options when not provided');
    });

    describe('navigateBack', () => {
        it('swaps view and previousView');
        it('handles repeated back navigation');
    });

    describe('scroll position', () => {
        it('saves scroll position per view');
        it('retrieves scroll position');
    });

    describe('clearPendingFilters', () => {
        it('clears history filters');
        it('clears distribution view');
        it('clears analytics initial state');
    });

    // Atlas AC5: Filter Persistence
    describe('filter persistence behavior', () => {
        it('clears filters when navigating from dashboard to history');
        it('clears filters when navigating from settings to history');
        it('preserves filters when navigating within history views');
        it('defaults to current month temporal filter');
    });

    // Atlas AC6: Analytics State Transfer
    describe('analytics state transfer', () => {
        it('passes analyticsInitialState to TrendsView');
        it('clears analyticsInitialState after consumption');
    });
});
```

---

## References

- [Parent: 14e-25 App.tsx Architectural Completion](./14e-25-app-tsx-architectural-completion.md)
- [Original: 14e-25a Navigation Store + HistoryView](./14e-25a-navigation-store-historyview.md)
- [Architecture Decision: 500-800 line target](../architecture-decision.md)
- [Zustand State Management Standards](_bmad/_memory/react-opinionated-architect-sidecar/knowledge/state-management.md)
