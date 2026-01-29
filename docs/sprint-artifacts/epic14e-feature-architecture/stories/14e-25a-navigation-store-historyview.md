# Story 14e.25a: Navigation Store + HistoryView Migration

Status: split

> **SPLIT 2026-01-27:** This story was split into two sub-stories during pre-dev review.
> - **14e-25a.1**: [Navigation Store Foundation](./14e-25a1-navigation-store-foundation.md) - 3 pts
> - **14e-25a.2**: [HistoryView Data Migration](./14e-25a2-historyview-data-migration.md) - 3 pts
>
> **Reason:** 35 subtasks exceeded sizing guidelines (≤15). Split ensures independent shippability.

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 5
**Created:** 2026-01-27
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-23 (App.tsx Final Cleanup)
**Blocks:** 14e-25b, 14e-25c, 14e-25d

---

## Story

As a **developer**,
I want **navigation state moved to a Zustand store and HistoryView migrated to own its data**,
So that **the foundation is laid for all views to follow the view-owned data pattern**.

---

## Context

### Parent Story

This is part 1 of 4 for Story 14e-25 "App.tsx Architectural Completion":

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| **14e-25a** | Navigation store + HistoryView | 5 | THIS STORY |
| 14e-25b | TrendsView + DashboardView | 5 | Blocked by 25a |
| 14e-25c | SettingsView + remaining views | 3 | Blocked by 25b |
| 14e-25d | ViewHandlersContext deletion + cleanup | 3 | Blocked by 25c |

### Why Navigation First?

All views need navigation. By creating `useNavigation()` first:
1. All subsequent view migrations can use it immediately
2. We establish the Zustand store pattern for global UI state
3. No temporary prop-drilling needed during migration

### Why HistoryView?

HistoryView is the most data-heavy view and demonstrates the pattern clearly:
- Currently receives: transactions, hasMore, loadMore, filters, handlers, etc.
- After migration: calls its own hooks, receives nothing from App.tsx

---

## Acceptance Criteria

### AC1: Navigation Zustand Store

**Given** the need for global navigation state
**When** this story is complete
**Then:**
- [ ] `src/shared/stores/useNavigationStore.ts` exists with Zustand store
- [ ] Store contains: `view`, `previousView`, `settingsSubview`, `analyticsInitialState`
- [ ] Store provides actions: `setView`, `navigateToView`, `navigateBack`
- [ ] Store supports scroll position preservation per view
- [ ] DevTools integration enabled (`devtools` middleware)

### AC2: useNavigation() Hook

**Given** the navigation store exists
**When** components need navigation
**Then:**
- [ ] `src/shared/hooks/useNavigation.ts` exports `useNavigation()` hook
- [ ] Hook provides typed selectors for view state
- [ ] Hook provides navigation actions
- [ ] Hook is used by App.tsx for view routing (replaces local state)

### AC3: HistoryView Owns Its Data

**Given** HistoryView needs transaction data
**When** HistoryView renders
**Then:**
- [ ] HistoryView calls `usePaginatedTransactions()` internally
- [ ] HistoryView calls `useHistoryFilters()` internally (already wrapped in provider)
- [ ] HistoryView uses `useNavigation()` for navigation callbacks
- [ ] HistoryView receives NO props from App.tsx (except optional test overrides)
- [ ] HistoryView accesses `useAuth()` for user/services

### AC4: useHistoryViewData() Composition Hook

**Given** HistoryView has multiple data needs
**When** organizing the data fetching
**Then:**
- [ ] `src/views/HistoryView/useHistoryViewData.ts` encapsulates all data hooks
- [ ] Returns: `transactions`, `hasMore`, `loadMore`, `loading`, `filters`, `user`, `services`
- [ ] Handles merge of `recentScans` into `paginatedTransactions` (moved from App.tsx)
- [ ] Memoization applied where appropriate

### AC5: App.tsx Reduced

**Given** navigation and HistoryView migrated
**When** measuring App.tsx
**Then:**
- [ ] Navigation state removed from App.tsx (~50 lines)
- [ ] HistoryView props composition removed from App.tsx (~80 lines)
- [ ] `useNavigationHandlers` hook call removed from App.tsx
- [ ] Net reduction: ~150-200 lines

### AC6: Tests Updated

**Given** the refactored code
**When** running tests
**Then:**
- [ ] Navigation store has unit tests (state transitions, actions)
- [ ] `useNavigation()` hook has unit tests
- [ ] HistoryView tests mock internal hooks instead of receiving props
- [ ] All existing HistoryView tests pass
- [ ] Integration tests verify navigation between views

---

## Tasks / Subtasks

### Task 1: Create Navigation Zustand Store (AC: 1)

- [ ] **1.1** Create `src/shared/stores/useNavigationStore.ts`
- [ ] **1.2** Define state interface: `view`, `previousView`, `settingsSubview`, `scrollPositions`, `analyticsInitialState`, `pendingHistoryFilters`, `pendingDistributionView`
- [ ] **1.3** Implement `setView(view)` action with scroll preservation
- [ ] **1.4** Implement `navigateToView(view, options?)` action
- [ ] **1.5** Implement `navigateBack()` action
- [ ] **1.6** Add devtools middleware for debugging
- [ ] **1.7** Export from `src/shared/stores/index.ts`

### Task 2: Create useNavigation() Hook (AC: 2)

- [ ] **2.1** Create `src/shared/hooks/useNavigation.ts`
- [ ] **2.2** Export typed selectors: `useCurrentView()`, `usePreviousView()`, etc.
- [ ] **2.3** Export actions from store
- [ ] **2.4** Add to `src/shared/hooks/index.ts` barrel export
- [ ] **2.5** Write unit tests for hook

### Task 3: Migrate App.tsx to Navigation Store (AC: 2, 5)

- [ ] **3.1** Replace `useState<View>('dashboard')` with `useNavigationStore`
- [ ] **3.2** Replace `previousView` state with store
- [ ] **3.3** Replace `settingsSubview` state with store
- [ ] **3.4** Replace `analyticsInitialState` state with store
- [ ] **3.5** Remove `useNavigationHandlers` hook call
- [ ] **3.6** Remove navigation-related handler bundles
- [ ] **3.7** Verify view routing still works

### Task 4: Create useHistoryViewData() Hook (AC: 4)

- [ ] **4.1** Create `src/views/HistoryView/useHistoryViewData.ts`
- [ ] **4.2** Call `useAuth()` for user/services
- [ ] **4.3** Call `usePaginatedTransactions(user, services)`
- [ ] **4.4** Call `useRecentScans(user, services)` (for merge)
- [ ] **4.5** Implement `transactionsWithRecentScans` merge logic (moved from App.tsx)
- [ ] **4.6** Return all data needed by HistoryView
- [ ] **4.7** Write unit tests for hook

### Task 5: Migrate HistoryView to Own Data (AC: 3, 5)

- [ ] **5.1** Import and call `useHistoryViewData()` in HistoryView
- [ ] **5.2** Import and call `useNavigation()` for navigation callbacks
- [ ] **5.3** Remove props interface (or make optional for testing)
- [ ] **5.4** Remove HistoryView props from App.tsx view routing
- [ ] **5.5** Remove `useHistoryViewProps()` call from App.tsx
- [ ] **5.6** Verify HistoryView renders correctly
- [ ] **5.7** Test filter functionality
- [ ] **5.8** Test pagination ("Load more")

### Task 6: Update Tests (AC: 6)

- [ ] **6.1** Write navigation store unit tests (15+ tests)
- [ ] **6.2** Write useNavigation hook tests
- [ ] **6.3** Update HistoryView tests to mock `useHistoryViewData()`
- [ ] **6.4** Update HistoryView tests to mock `useNavigation()`
- [ ] **6.5** Run full test suite and fix failures
- [ ] **6.6** Verify no regressions in navigation between views

---

## Dev Notes

### Navigation Store Structure

```typescript
// src/shared/stores/useNavigationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { View } from '@/components/App';
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
            view: 'dashboard',
            previousView: 'dashboard',
            settingsSubview: 'main',
            scrollPositions: {},
            analyticsInitialState: null,
            pendingHistoryFilters: null,
            pendingDistributionView: null,

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

// Typed selectors
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

### HistoryView Migration Pattern

```typescript
// BEFORE: src/views/HistoryView.tsx (receives 15+ props)
interface HistoryViewProps {
    transactions: Transaction[];
    hasMore: boolean;
    loadMore: () => void;
    loadingMore: boolean;
    // ... 10+ more props
}

export function HistoryView(props: HistoryViewProps) {
    // Uses props for everything
}

// AFTER: src/views/HistoryView.tsx (owns its data)
export function HistoryView() {
    // View owns its data
    const {
        transactions,
        hasMore,
        loadMore,
        loadingMore,
    } = useHistoryViewData();

    // View owns its navigation
    const { navigateToView } = useNavigation();

    // Rest of component unchanged
}
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

// REMOVE: HistoryView props composition (~40 lines)
const historyViewProps = useHistoryViewProps({...});

// REMOVE: transactionsWithRecentScans computation (~15 lines)
const transactionsWithRecentScans = useMemo(() => {...}, [...]);
```

### Estimated Line Reduction

| Section | Lines Removed |
|---------|---------------|
| Navigation state declarations | ~30 |
| useNavigationHandlers call | ~20 |
| Navigation handler bundle | ~10 |
| useHistoryViewProps call | ~40 |
| transactionsWithRecentScans merge | ~15 |
| Related useMemo/useCallback | ~30 |
| **Total** | **~145** |

After this story: App.tsx ~3,020 lines (from 3,163)

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 6 | ≤4 | ACCEPTABLE |
| Subtasks | 35 | ≤15 | LARGE |
| Files Changed | ~8 | ≤8 | OK |

**Note:** Story is at the upper limit of complexity. Could split navigation store (Tasks 1-3) from HistoryView migration (Tasks 4-6) if needed.

---

## References

- [Parent: 14e-25 App.tsx Architectural Completion](./14e-25-app-tsx-architectural-completion.md)
- [Architecture Decision: 500-800 line target](../architecture-decision.md)
- [FSD Architecture Standards](_bmad/_memory/react-opinionated-architect-sidecar/knowledge/architecture.md)
- [Zustand State Management Standards](_bmad/_memory/react-opinionated-architect-sidecar/knowledge/state-management.md)
