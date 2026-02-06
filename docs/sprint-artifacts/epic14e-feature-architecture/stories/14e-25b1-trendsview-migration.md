# Story 14e.25b.1: TrendsView Data Migration

Status: done

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 3
**Created:** 2026-01-27
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-25a.2 (HistoryView Data Migration)
**Blocks:** 14e-25b.2, 14e-25c, 14e-25d

---

## Story

As a **developer**,
I want **TrendsView migrated to own its data via internal hooks**,
So that **the most complex analytical view follows the view-owned data pattern and App.tsx is reduced**.

---

## Context

### Parent Story Split

This is part 1 of 2 for Story 14e-25b "TrendsView + DashboardView Migration":

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| **14e-25b.1** | TrendsView owns its data | 3 | THIS STORY |
| 14e-25b.2 | DashboardView owns its data | 3 | Blocked by 25b.1 |

### Why TrendsView First?

TrendsView is the most complex analytical view with analytics drill-down navigation:
- Currently receives 20+ props from App.tsx
- Has cross-view navigation to HistoryView with filters
- Uses `AnalyticsProvider` for drill-down state
- Higher risk profile - better to validate pattern in isolation

### Current Prop Drilling

TrendsView currently receives from App.tsx via `useTrendsViewProps`:
- `transactions`, `userPreferences`, `lang`, `currency`, `theme`, `colorTheme`
- Navigation callbacks, filter state, analytics state
- Handler functions for drill-down and navigation

---

## Acceptance Criteria

### AC1: TrendsView Owns Its Data

**Given** TrendsView needs transaction and analytics data
**When** TrendsView renders
**Then:**
- [x] TrendsView calls `useTrendsViewData()` internally
- [x] TrendsView uses `useNavigation()` for navigation callbacks
- [x] TrendsView receives NO props from App.tsx (except optional `__testData`)
- [x] Analytics drill-down to HistoryView works correctly

### AC2: useTrendsViewData() Composition Hook

**Given** TrendsView has complex data needs
**When** organizing the data fetching
**Then:**
- [x] `src/views/TrendsView/useTrendsViewData.ts` encapsulates all data hooks
- [x] Returns: `transactions`, `userPreferences`, `lang`, `currency`, theme settings
- [x] Uses `useTheme()` context for theme/locale settings (ThemeContext)
- [x] Handles `analyticsInitialState` from navigation store
- [x] Proper memoization applied

### AC3: App.tsx Reduced

**Given** TrendsView migrated
**When** measuring App.tsx
**Then:**
- [x] TrendsView props composition removed (~60 lines)
- [x] `useTrendsViewProps()` call removed
- [x] Related useMemo/useCallback removed
- [x] Net reduction: ~80-100 lines

### AC4: Tests Updated

**Given** the refactored code
**When** running tests
**Then:**
- [x] `useTrendsViewData()` has unit tests (8+ tests) - 24 tests
- [x] TrendsView tests use `__testData` prop for mocking
- [x] All existing TrendsView tests pass - 6882 tests passing
- [x] Analytics drill-down navigation integration test passes

---

## Tasks / Subtasks

### Task 1: Create useTrendsViewData() Hook (AC: 2)

- [x] **1.1** Create `src/views/TrendsView/useTrendsViewData.ts`
- [x] **1.2** Call `useAuth()` for user/services
- [x] **1.3** Call `useTransactions(user, services)`
- [x] **1.4** Call `useUserPreferences(user, services)`
- [x] **1.5** Get theme settings from `useTheme()` (via ThemeContext)
- [x] **1.6** Get `analyticsInitialState` from `useNavigationStore()`
- [x] **1.7** Return all data needed by TrendsView
- [x] **1.8** Write unit tests for hook (24 tests)

### Task 2: Migrate TrendsView to Own Data (AC: 1, 3)

- [x] **2.1** Keep TrendsView.tsx (added internal hook call)
- [x] **2.2** Import and call `useTrendsViewData()` in TrendsView
- [x] **2.3** Navigation callbacks via ViewHandlersContext (existing pattern)
- [x] **2.4** Add `__testData` optional prop for testing
- [x] **2.5** Remove TrendsView props from App.tsx view routing
- [x] **2.6** Remove `useTrendsViewProps()` call from App.tsx
- [x] **2.7** Verify analytics navigation works
- [x] **2.8** Verify drill-down to HistoryView works with filters

### Task 3: Update Tests (AC: 4)

- [x] **3.1** Update TrendsView tests to use mock hook pattern
- [x] **3.2** Write tests for `useTrendsViewData()` hook (24 tests)
- [x] **3.3** Run full test suite and fix failures (6882 tests passing)
- [x] **3.4** Verify analytics drill-down workflow end-to-end

### Review Follow-ups (Archie) - 2026-01-28

- [x] [Archie-Review][MEDIUM] Delete dead code `src/hooks/app/useTrendsViewProps.ts` - file no longer used after migration [src/hooks/app/useTrendsViewProps.ts]
- [x] [Archie-Review][MEDIUM] Remove `useTrendsViewProps` exports from `src/hooks/app/index.ts` [src/hooks/app/index.ts:125-131]

### Review Follow-ups (Atlas Code Review) - 2026-01-28

- [x] [Atlas-Review][HIGH] Stage untracked files before commit: `git add src/views/TrendsView/ tests/unit/views/TrendsView/ src/views/TrendsView.tsx` - files show `??` and ` M` in git status
- [x] [Atlas-Review][MEDIUM] Update JSDoc in useTrendsViewData.ts:16 - claims "useShallow for Zustand selectors" but implementation uses useTheme() context instead
- [x] [Atlas-Review][LOW] Align Dev Notes code example with actual implementation (uses useTheme not useSettingsStore)

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

### useTrendsViewData() Implementation (ThemeContext)

```typescript
// src/views/TrendsView/useTrendsViewData.ts
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnalyticsInitialState } from '@/shared/stores/useNavigationStore';

export function useTrendsViewData() {
    const { user, services } = useAuth();
    const transactions = useTransactions(user, services);
    const { preferences } = useUserPreferences(user, services);

    // Theme settings from ThemeContext
    const { theme, colorTheme, fontColorMode, lang, currency } = useTheme();

    // Navigation state from Zustand store
    const analyticsInitialState = useAnalyticsInitialState();

    return {
        transactions,
        userPreferences: preferences,
        lang,
        currency: preferences?.defaultCurrency ?? currency,
        theme,
        colorTheme,
        fontColorMode,
        analyticsInitialState,
    };
}

// Type for external use (tests, etc.)
export type TrendsViewData = ReturnType<typeof useTrendsViewData>;
```

### TrendsView Migration Pattern (V2 FIX: Test Mocking)

```typescript
// src/views/TrendsView/index.tsx
import { useTrendsViewData, type TrendsViewData } from './useTrendsViewData';
import { useNavigation } from '@/shared/hooks';

// ✅ V2 FIX: Optional __testData prop for testing
interface TrendsViewProps {
    __testData?: TrendsViewData;
}

export function TrendsView({ __testData }: TrendsViewProps = {}) {
    // Use test data if provided, otherwise fetch from hooks
    const data = __testData ?? useTrendsViewData();
    const { navigateToView } = useNavigation();

    // Rest of component uses data.transactions, data.theme, etc.
    // ...
}
```

### Test Pattern

```typescript
// tests/unit/views/TrendsView.test.tsx
import { render, screen } from '@testing-library/react';
import { TrendsView } from '@/views/TrendsView';
import { mockTrendsViewData } from './fixtures';

describe('TrendsView', () => {
    it('renders transaction analytics', () => {
        render(
            <TrendsView
                __testData={{
                    transactions: [mockTransaction],
                    theme: 'light',
                    colorTheme: 'mono',
                    fontColorMode: 'colorful',
                    fontSize: 'small',
                    lang: 'es',
                    currency: 'CLP',
                    userPreferences: mockPreferences,
                    analyticsInitialState: null,
                }}
            />
        );

        expect(screen.getByText('Explora')).toBeInTheDocument();
    });
});
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

// REMOVE: TrendsView props spreading in view routing (~20 lines)
case 'trends':
    return <TrendsView {...trendsViewProps} />;
// BECOMES:
case 'trends':
    return <TrendsView />;
```

### Estimated Line Reduction

| Section | Lines Removed |
|---------|---------------|
| useTrendsViewProps call | ~40 |
| Related data prep/memoization | ~20 |
| Props spreading in routing | ~20 |
| **Total** | **~80** |

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 3 | ≤4 | ✅ OK |
| Subtasks | 16 | ≤15 | ⚠️ ACCEPTABLE |
| Files Changed | ~4 | ≤8 | ✅ OK |

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-27)

### Affected Workflows

| Workflow | Impact | Risk |
|----------|--------|------|
| **#4 Analytics Navigation Flow** | DIRECT - TrendsView is the entry point | HIGH |
| **#6 History Filter Flow** | DOWNSTREAM - TrendsView navigates to History with filters | MEDIUM |

### Workflow Chain Visualization

```
[DashboardView] → "This Month" → [TrendsView (THIS STORY)]
                                         ↓
                               Temporal Level → Category Level → Chart View
                                         ↓
                               DrillDown Card → deeper OR Transaction Count
                                         ↓
                               handleNavigateToHistory(filters)
                                         ↓
                               [HistoryView with pendingHistoryFilters]
```

### Critical Test Scenarios (From Workflow Analysis)

1. **Analytics Drill-Down Path** (Workflow #4)
   - TrendsView renders analytics charts correctly
   - Temporal level selection (week/month/quarter) works
   - Category drill-down updates charts
   - DrillDown Card tap navigates to filtered HistoryView

2. **Filter Passthrough** (Workflow #6)
   - `handleNavigateToHistory(filters)` sets `pendingHistoryFilters` in navigation store
   - HistoryView consumes filters via `useHistoryViewData()` (Story 14e-25a.2a)
   - No flash of unfiltered data

### Additional Acceptance Criteria (Atlas Suggestions)

> These were suggested based on workflow chain analysis

- **AC-Atlas-1**: Drill-down navigation from TrendsView to HistoryView must preserve all filter state
- **AC-Atlas-2**: `analyticsInitialState` from navigation store must be consumed correctly (for returning to previous drill-down state)
- **AC-Atlas-3**: Memoization must not cause stale closures in navigation callbacks

### Testing Implications

- **Existing tests to verify:** TrendsView analytics navigation tests, filter passthrough tests
- **New scenarios to add:** Integration test for full TrendsView → HistoryView drill-down flow

---

## Dev Agent Record

### Implementation Notes

- TrendsView now owns its data via `useTrendsViewData()` hook
- Theme settings come from `useTheme()` context (ThemeContext), not Zustand store
- Analytics initial state comes from navigation store via `useAnalyticsInitialState()`
- 24 unit tests for `useTrendsViewData()` hook
- `__testData` prop pattern used for testing

### Completion Notes

- All tasks completed (2026-01-28)
- Code review follow-ups addressed: deleted dead code, staged files, updated documentation

---

## File List

### New Files

- `src/views/TrendsView/index.ts` - Barrel export
- `src/views/TrendsView/useTrendsViewData.ts` - Data composition hook
- `tests/unit/views/TrendsView/useTrendsViewData.test.ts` - Hook unit tests (24 tests)

### Modified Files

- `src/views/TrendsView.tsx` - Calls useTrendsViewData() internally
- `src/App.tsx` - Removed useTrendsViewProps call (~80 lines)
- `src/hooks/app/index.ts` - Removed useTrendsViewProps exports

### Deleted Files

- `src/hooks/app/useTrendsViewProps.ts` - Dead code after migration
- `tests/unit/hooks/app/useTrendsViewProps.test.ts` - Tests for deleted hook

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-28 | Initial implementation complete | Atlas Dev |
| 2026-01-28 | Code review follow-ups: deleted dead code, staged files, updated docs | Atlas Dev |

---

## References

- [Parent: 14e-25b TrendsView + DashboardView](./14e-25b-trendsview-dashboardview.md)
- [Prerequisite: 14e-25a.2 HistoryView Data Migration](./14e-25a2-historyview-data-migration.md)
- [Zustand State Management Standards](_bmad/_memory/react-opinionated-architect-sidecar/knowledge/state-management.md)
