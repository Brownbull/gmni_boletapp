# Story 14e.25b: TrendsView + DashboardView Migration

Status: split

> **SPLIT 2026-01-27:** This story was split into two sub-stories during pre-dev review (Archie).
> - **14e-25b.1**: [TrendsView Migration](./14e-25b1-trendsview-migration.md) - 3 pts
> - **14e-25b.2**: [DashboardView Migration](./14e-25b2-dashboardview-migration.md) - 3 pts
>
> **Reasons:**
> - 28 subtasks exceeded sizing guidelines (≤15)
> - TrendsView (analytics drill-down) and DashboardView (summary cards) have different risk profiles
> - Split ensures independent shippability and smaller rollback scope
>
> **Review Issues Addressed:**
> - V1: Added `useShallow` pattern for multiple Zustand selectors (performance)
> - V2: Clarified test mocking strategy with `__testData` prop pattern

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 6 (split: 3 + 3)
**Created:** 2026-01-27
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-25a.2 (HistoryView Data Migration)
**Blocks:** 14e-25c, 14e-25d

---

## Story

As a **developer**,
I want **TrendsView and DashboardView migrated to own their data**,
So that **the two most complex analytical views follow the view-owned data pattern**.

---

## Context

### Parent Story

This is part 2 of 4 for Story 14e-25 "App.tsx Architectural Completion":

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| 14e-25a | Navigation store + HistoryView | 6 | Split → 25a.1 + 25a.2 |
| **14e-25b** | TrendsView + DashboardView | 6 | Split → 25b.1 + 25b.2 |
| 14e-25c | SettingsView + remaining views | 3 | Blocked by 25b.2 |
| 14e-25d | ViewHandlersContext deletion + cleanup | 3 | Blocked by 25c |

### This Story's Sub-Stories

| Sub-Story | Focus | Points | Depends | Status |
|-----------|-------|--------|---------|--------|
| **14e-25b.1** | TrendsView migration | 3 | 14e-25a.2 | drafted |
| **14e-25b.2** | DashboardView migration | 3 | 14e-25b.1 | drafted |

### Why These Views Together? (Original Rationale)

TrendsView and DashboardView share significant data dependencies:
- Both need `transactions` for analytics
- Both use `HistoryFiltersProvider` wrapper
- Both use `AnalyticsProvider` for drill-down state
- Migrating together ensures consistent patterns

### Current Prop Drilling

TrendsView currently receives 20+ props from App.tsx:
- `transactions`, `userPreferences`, `lang`, `currency`, `theme`, `colorTheme`
- Navigation callbacks, filter state, analytics state
- Handler functions for drill-down and navigation

DashboardView receives 15+ props from App.tsx.

---

## Acceptance Criteria

### AC1: TrendsView Owns Its Data

**Given** TrendsView needs transaction and analytics data
**When** TrendsView renders
**Then:**
- [ ] TrendsView calls `useTransactions()` internally
- [ ] TrendsView calls `useUserPreferences()` for currency/location
- [ ] TrendsView uses `useNavigation()` for navigation callbacks
- [ ] TrendsView uses `useSettingsStore()` for theme settings
- [ ] TrendsView receives NO props from App.tsx

### AC2: useTrendsViewData() Composition Hook

**Given** TrendsView has complex data needs
**When** organizing the data fetching
**Then:**
- [ ] `src/views/TrendsView/useTrendsViewData.ts` encapsulates all data hooks
- [ ] Returns: `transactions`, `userPreferences`, `lang`, `currency`, theme settings
- [ ] Handles analytics initial state from navigation store
- [ ] Proper memoization applied

### AC3: DashboardView Owns Its Data

**Given** DashboardView needs summary data
**When** DashboardView renders
**Then:**
- [ ] DashboardView calls `useTransactions()` internally
- [ ] DashboardView calls `useRecentScans()` internally
- [ ] DashboardView calls `useUserCredits()` for credit display
- [ ] DashboardView uses `useNavigation()` for navigation
- [ ] DashboardView receives NO props from App.tsx

### AC4: useDashboardViewData() Composition Hook

**Given** DashboardView has multiple data needs
**When** organizing the data fetching
**Then:**
- [ ] `src/views/DashboardView/useDashboardViewData.ts` encapsulates all data hooks
- [ ] Returns: `transactions`, `recentScans`, `userCredits`, `userPreferences`
- [ ] Handles "This Month" card navigation state
- [ ] Proper memoization applied

### AC5: App.tsx Reduced

**Given** both views migrated
**When** measuring App.tsx
**Then:**
- [ ] TrendsView props composition removed (~60 lines)
- [ ] DashboardView props composition removed (~50 lines)
- [ ] Related useMemo/useCallback removed
- [ ] Net reduction: ~150-180 lines

### AC6: Tests Updated

**Given** the refactored code
**When** running tests
**Then:**
- [ ] TrendsView tests mock `useTrendsViewData()` instead of receiving props
- [ ] DashboardView tests mock `useDashboardViewData()` instead of receiving props
- [ ] All existing view tests pass
- [ ] Analytics drill-down navigation works correctly

---

## Tasks / Subtasks

### Task 1: Create useTrendsViewData() Hook (AC: 2)

- [ ] **1.1** Create `src/views/TrendsView/useTrendsViewData.ts`
- [ ] **1.2** Call `useAuth()` for user/services
- [ ] **1.3** Call `useTransactions(user, services)`
- [ ] **1.4** Call `useUserPreferences(user, services)`
- [ ] **1.5** Get theme settings from `useSettingsStore()`
- [ ] **1.6** Get `analyticsInitialState` from `useNavigationStore()`
- [ ] **1.7** Return all data needed by TrendsView
- [ ] **1.8** Write unit tests for hook

### Task 2: Migrate TrendsView to Own Data (AC: 1, 5)

- [ ] **2.1** Import and call `useTrendsViewData()` in TrendsView
- [ ] **2.2** Import and call `useNavigation()` for navigation callbacks
- [ ] **2.3** Remove props interface (or make optional for testing)
- [ ] **2.4** Remove TrendsView props from App.tsx
- [ ] **2.5** Remove `useTrendsViewProps()` call from App.tsx
- [ ] **2.6** Verify analytics navigation works
- [ ] **2.7** Verify drill-down to HistoryView works

### Task 3: Create useDashboardViewData() Hook (AC: 4)

- [ ] **3.1** Create `src/views/DashboardView/useDashboardViewData.ts`
- [ ] **3.2** Call `useAuth()` for user/services
- [ ] **3.3** Call `useTransactions(user, services)`
- [ ] **3.4** Call `useRecentScans(user, services)`
- [ ] **3.5** Call `useUserCredits(user, services)`
- [ ] **3.6** Call `useUserPreferences(user, services)`
- [ ] **3.7** Return all data needed by DashboardView
- [ ] **3.8** Write unit tests for hook

### Task 4: Migrate DashboardView to Own Data (AC: 3, 5)

- [ ] **4.1** Import and call `useDashboardViewData()` in DashboardView
- [ ] **4.2** Import and call `useNavigation()` for navigation callbacks
- [ ] **4.3** Remove props interface (or make optional for testing)
- [ ] **4.4** Remove DashboardView props from App.tsx
- [ ] **4.5** Remove `useDashboardViewProps()` call from App.tsx
- [ ] **4.6** Verify "This Month" card navigation works
- [ ] **4.7** Verify quick actions work

### Task 5: Update Tests (AC: 6)

- [ ] **5.1** Update TrendsView tests to mock internal hooks
- [ ] **5.2** Update DashboardView tests to mock internal hooks
- [ ] **5.3** Write tests for new composition hooks
- [ ] **5.4** Run full test suite and fix failures
- [ ] **5.5** Verify analytics drill-down workflow

---

## Dev Notes

### TrendsView Data Dependencies (Current)

```typescript
// Currently receives from App.tsx via useTrendsViewProps:
interface TrendsViewProps {
    transactions: Transaction[];
    userPreferences: UserPreferences;
    lang: Language;
    currency: Currency;
    theme: Theme;
    colorTheme: ColorTheme;
    fontColorMode: FontColorMode;
    fontSize: FontSize;
    // Navigation
    navigateToView: (view: View) => void;
    handleNavigateToHistory: (filters: HistoryFilterState) => void;
    // Analytics state
    analyticsInitialState: AnalyticsNavigationState | null;
    setAnalyticsInitialState: (state: AnalyticsNavigationState | null) => void;
    // ... more props
}
```

### TrendsView Migration Pattern

```typescript
// AFTER: src/views/TrendsView/useTrendsViewData.ts
export function useTrendsViewData() {
    const { user, services } = useAuth();
    const transactions = useTransactions(user, services);
    const { preferences } = useUserPreferences(user, services);

    // Theme from Zustand store
    const theme = useSettingsStore((s) => s.theme);
    const colorTheme = useSettingsStore((s) => s.colorTheme);
    const fontColorMode = useSettingsStore((s) => s.fontColorMode);
    const fontSize = useSettingsStore((s) => s.fontSize);

    // Analytics state from navigation store
    const analyticsInitialState = useNavigationStore((s) => s.analyticsInitialState);

    return {
        transactions,
        userPreferences: preferences,
        lang: preferences.language || 'es',
        currency: preferences.defaultCurrency || 'CLP',
        theme,
        colorTheme,
        fontColorMode,
        fontSize,
        analyticsInitialState,
    };
}

// AFTER: src/views/TrendsView.tsx
export function TrendsView() {
    const data = useTrendsViewData();
    const { navigateToView } = useNavigation();

    // Use data and navigation directly
    // ...
}
```

### What Gets Removed from App.tsx

```typescript
// REMOVE: useTrendsViewProps call and related setup (~40 lines)
const trendsViewProps = useTrendsViewProps({
    transactions,
    userPreferences,
    lang,
    currency,
    theme,
    colorTheme,
    // ... many more
});

// REMOVE: useDashboardViewProps call and related setup (~35 lines)
const dashboardViewProps = useDashboardViewProps({
    transactions,
    recentScans,
    userCredits,
    // ... many more
});

// REMOVE: Related handler bundles that are only used by these views
```

### Estimated Line Reduction

| Section | Lines Removed |
|---------|---------------|
| useTrendsViewProps call | ~40 |
| useDashboardViewProps call | ~35 |
| Related data prep/memoization | ~30 |
| Unused imports after cleanup | ~20 |
| **Total** | **~125** |

After this story: App.tsx ~2,895 lines (from ~3,020)

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 5 | ≤4 | ACCEPTABLE |
| Subtasks | 28 | ≤15 | LARGE |
| Files Changed | ~6 | ≤8 | OK |

---

## References

- [Parent: 14e-25 App.tsx Architectural Completion](./14e-25-app-tsx-architectural-completion.md)
- [Prerequisite: 14e-25a.2 HistoryView Data Migration](./14e-25a2-historyview-data-migration.md)
- [Sub-Story: 14e-25b.1 TrendsView Migration](./14e-25b1-trendsview-migration.md)
- [Sub-Story: 14e-25b.2 DashboardView Migration](./14e-25b2-dashboardview-migration.md)
- [Architecture Decision](../architecture-decision.md)
