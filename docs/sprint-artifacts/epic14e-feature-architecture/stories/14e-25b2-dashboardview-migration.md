# Story 14e.25b.2: DashboardView Data Migration

Status: review

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 3
**Created:** 2026-01-27
**Enhanced:** 2026-01-28 (Atlas workflow review)
**Completed:** 2026-01-28
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-25b.1 (TrendsView Migration)
**Blocks:** 14e-25c, 14e-25d

---

## Story

As a **developer**,
I want **DashboardView migrated to own its data via internal hooks**,
So that **the home dashboard view follows the view-owned data pattern and App.tsx is further reduced**.

---

## Context

### Parent Story Split

This is part 2 of 2 for Story 14e-25b "TrendsView + DashboardView Migration":

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| 14e-25b.1 | TrendsView owns its data | 3 | Prerequisite |
| **14e-25b.2** | DashboardView owns its data | 3 | THIS STORY |

### Why DashboardView Second?

DashboardView has simpler navigation patterns than TrendsView:
- Currently receives 15+ props from App.tsx
- Navigation to TrendsView via "This Month" card
- Uses `useRecentScans` and `useUserCredits` for summary data
- Lower risk - validates pattern established by TrendsView

### Pattern Established

This story follows the exact same pattern validated in 14e-25b.1:
- `useXxxViewData()` composition hook with `useShallow`
- `__testData` prop for testing
- Navigation via `useNavigation()` hook

---

## Acceptance Criteria

### AC1: DashboardView Owns Its Data

**Given** DashboardView needs summary data
**When** DashboardView renders
**Then:**
- [x] DashboardView calls `useDashboardViewData()` internally
- [x] DashboardView uses `useViewHandlers()` for navigation callbacks
- [x] DashboardView receives NO props from App.tsx (except optional `_testOverrides`)
- [x] "This Month" card navigation to TrendsView works correctly

### AC2: useDashboardViewData() Composition Hook

**Given** DashboardView has multiple data needs
**When** organizing the data fetching
**Then:**
- [x] `src/views/DashboardView/useDashboardViewData.ts` encapsulates all data hooks
- [x] Returns: `transactions`, `recentScans`, `userCredits`, `userPreferences`
- [x] Uses `useShallow` for multiple Zustand selectors (performance) *(deviation: uses useTheme instead)*
- [x] Proper memoization applied

### AC3: App.tsx Reduced

**Given** DashboardView migrated
**When** measuring App.tsx
**Then:**
- [x] DashboardView props composition removed (~50 lines)
- [x] `useDashboardViewProps()` call removed
- [x] Related useMemo/useCallback removed
- [x] Net reduction: ~60-70 lines *(exceeded: ~100+ lines removed including orphaned vars)*

### AC4: Tests Updated

**Given** the refactored code
**When** running tests
**Then:**
- [x] `useDashboardViewData()` has unit tests (8+ tests)
- [x] DashboardView tests use `_testOverrides` prop for mocking
- [x] All existing DashboardView tests pass
- [x] "This Month" card navigation integration test passes

### AC5: Code Review Pattern (from HistoryView)

**Given** callbacks need production override
**When** `_testOverrides` not provided for callbacks
**Then:**
- [x] DEV-only `console.warn` logs helpful message (like HistoryView pattern)
- [x] Callbacks have no-op stub implementation as default
- [x] No runtime errors when callbacks aren't overridden

---

## Tasks / Subtasks

### Task 1: Create useDashboardViewData() Hook (AC: 2)

- [x] **1.1** Create `src/views/DashboardView/useDashboardViewData.ts`
- [x] **1.2** Call `useAuth()` for user/services
- [x] **1.3** Call `useTransactions(user, services)`
- [x] **1.4** Call `useRecentScans(user, services)`
- [x] **1.5** Call `useUserCredits(user, services)`
- [x] **1.6** Call `useUserPreferences(user, services)`
- [x] **1.7** Get theme settings from `useTheme()` (deviation: uses ThemeContext instead of useSettingsStore for consistency)
- [x] **1.8** Return all data needed by DashboardView
- [x] **1.9** Write unit tests for hook (8+ tests)

### Task 2: Migrate DashboardView to Own Data (AC: 1, 3, 5)

- [x] **2.1** Create `src/views/DashboardView/index.ts` (re-export barrel file)
- [x] **2.2** Import and call `useDashboardViewData()` in DashboardView
- [x] **2.3** Add `_testOverrides` optional prop (following HistoryView pattern)
- [x] **2.4** Merge hook data with `_testOverrides`: `{ ...hookData, ..._testOverrides }`
- [x] **2.5** Import and call `useViewHandlers()` for navigation callbacks
- [x] **2.6** Remove DashboardView props from App.tsx view routing
- [x] **2.7** Remove `useDashboardViewProps()` call from App.tsx
- [x] **2.8** Delete `src/hooks/app/useDashboardViewProps.ts` (no longer needed)
- [x] **2.9** Verify "This Month" card navigation works
- [x] **2.10** Verify quick actions (scan, etc.) work

### Task 3: Update Tests (AC: 4, 5)

- [x] **3.1** Create `tests/unit/views/DashboardView/useDashboardViewData.test.ts`
- [x] **3.2** Write 8+ unit tests for hook (transactions, scans, settings, formatters)
- [x] **3.3** Update DashboardView tests to use `_testOverrides` prop
- [x] **3.4** Add test for DEV warning when callbacks not overridden
- [x] **3.5** Run full test suite and fix failures
- [x] **3.6** Verify navigation workflows end-to-end

### Review Follow-ups (Archie) - 2026-01-28

> Added by post-dev feature review. Build blocked by unused variables.
> **Resolved: 2026-01-28** - All unused variables removed from App.tsx

- [x] **[Archie-Review][HIGH]** Remove unused type imports in App.tsx line 150: `Theme`, `ColorTheme`, `FontColorMode`, `FontSize` [src/App.tsx:150]
- [x] **[Archie-Review][HIGH]** Remove unused merchant mapping vars in App.tsx: `merchantMappingsLoading`, `updateMerchantMapping` [src/App.tsx:283-287]
- [x] **[Archie-Review][HIGH]** Remove unused item mapping vars in App.tsx: `itemNameMappingsLoading`, `updateItemNameMapping` [src/App.tsx:297-300]
- [x] **[Archie-Review][HIGH]** Remove unused preference setters in App.tsx: `setDefaultScanCurrencyPref`, `setDefaultCountryPref`, `setDefaultCityPref`, `setDisplayNamePref`, `setPhoneNumberPref`, `setBirthDatePref`, `setFontFamilyPref`, `setForeignLocationFormatPref` [src/App.tsx:309-316]
- [x] **[Archie-Review][HIGH]** Remove unused `trustedMerchantsLoading` in App.tsx [src/App.tsx:353]
- [x] **[Archie-Review][HIGH]** Remove unused theme setters in App.tsx: `setLang`, `setCurrency`, `setDateFormat`, `setTheme`, `setColorTheme`, `setFontColorMode`, `setFontSize` [src/App.tsx:597-610]
- [x] **[Archie-Review][HIGH]** Remove unused `activeRecentTransactions` in App.tsx [src/App.tsx:2207]
- [x] **[Archie-Review][HIGH]** Remove unused `handleClearAllLearnedData` in App.tsx [src/App.tsx:2320]

**Note:** Also removed cascading orphans: `recentlyAddedTransactions`, `deleteMapping`, `merchantMappings`, `deleteMerchantMapping`, `subcategoryMappings`, `deleteSubcategoryMapping`, `deleteItemNameMapping`, `removeTrust`, `trustedMerchants`.

### Review Follow-ups (Atlas Code Review) - 2026-01-28

> Added by atlas-code-review workflow. Git staging and documentation issues.
> **Resolved: 2026-01-28** - All staging and documentation issues addressed

- [x] **[AI-Review][CRITICAL]** Stage all untracked files: `git add src/views/DashboardView/ tests/unit/views/DashboardView/`
- [x] **[AI-Review][CRITICAL]** Stage all unstaged changes: `git add src/views/DashboardView.tsx src/hooks/app/useDashboardViewProps.ts tests/unit/hooks/app/useDashboardViewProps.test.ts tests/unit/views/DashboardView.test.tsx`
- [x] **[AI-Review][HIGH]** Mark completed task checkboxes `[x]` for Tasks 1, 2, 3 (implementation is complete)
- [x] **[AI-Review][MEDIUM]** Update story Files section: `index.tsx` → `index.ts` (re-export file, not component)
- [x] **[AI-Review][MEDIUM]** Update story Files section: `DashboardView.tsx` NOT deleted, was modified in place
- [x] **[AI-Review][MEDIUM]** Task 1.7 deviation: Implementation uses `useTheme()` not `useSettingsStore()` - update task or add note
- [x] **[AI-Review][LOW]** Story claims `DashboardView.test.tsx` created but file doesn't exist (only hook test exists)
- [x] **[AI-Review][LOW]** Add Dev Agent Record section (File List, Change Log) before marking done

**Git Status Summary (post-fix):**
```
M  src/App.tsx
D  src/hooks/app/useDashboardViewProps.ts
M  src/views/DashboardView.tsx
A  src/views/DashboardView/index.ts
A  src/views/DashboardView/useDashboardViewData.ts
D  tests/unit/hooks/app/useDashboardViewProps.test.ts
M  tests/unit/views/DashboardView.test.tsx
A  tests/unit/views/DashboardView/useDashboardViewData.test.ts
```

**Tests:** All tests pass ✅ | **Type-check:** Passes ✅

---

## Dev Notes

### DashboardView Data Dependencies (Current - 25+ Props!)

```typescript
// Currently receives from App.tsx via useDashboardViewProps:
// Source: src/views/DashboardView.tsx lines 128-179
interface DashboardViewProps {
    // === Core Data ===
    transactions: Transaction[];           // From useTransactions
    allTransactions?: Transaction[];       // For full paginated list
    recentScans?: Transaction[];           // From useRecentScans

    // === Formatters ===
    t: (key: string) => string;            // Translation function
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;
    getSafeDate: (val: any) => string;

    // === Settings ===
    currency: string;                      // Default currency
    dateFormat: string;                    // Date format preference
    theme: string;                         // 'light' | 'dark'
    colorTheme?: ThemeName;                // Category color theme
    fontColorMode?: 'colorful' | 'plain';  // Font color mode
    lang?: Language;                       // 'en' | 'es'

    // === User Info ===
    userId?: string | null;                // For group operations
    appId?: string;                        // For Firestore path
    defaultCountry?: string;               // For foreign location detection
    foreignLocationFormat?: 'code' | 'flag';

    // === Navigation Callbacks ===
    onCreateNew: () => void;               // Trigger new transaction
    onViewTrends: (month: string | null) => void;  // Navigate to trends
    onEditTransaction: (transaction: Transaction) => void;
    onTriggerScan?: () => void;            // Trigger scan action
    onViewHistory?: () => void;            // Navigate to history
    onNavigateToHistory?: (payload: HistoryNavigationPayload) => void;  // @deprecated
    onViewRecentScans?: () => void;        // Navigate to recent scans
    onTransactionsDeleted?: (deletedIds: string[]) => void;

    // === Group Data ===
    sharedGroups?: Array<{ id: string; color: string }>;
}
```

### Props That Move INTO useDashboardViewData()

These props will be fetched INTERNALLY by the hook instead of passed from App.tsx:

| Prop | Hook Source |
|------|-------------|
| `transactions` | `usePaginatedTransactions(user, services)` |
| `allTransactions` | Same as transactions (merged) |
| `recentScans` | `useRecentScans(user, services)` |
| `t` | Inline via `TRANSLATIONS[lang]` |
| `formatCurrency` | `formatCurrencyUtil` from utils |
| `formatDate` | `formatDateUtil` from utils |
| `theme` | `useTheme()` |
| `colorTheme` | `useTheme()` |
| `fontColorMode` | `useTheme()` |
| `lang` | `useTheme()` |
| `currency` | `useTheme()` |
| `dateFormat` | `useTheme()` |
| `userId` | `useAuth().user.uid` |
| `appId` | `useAuth().services.appId` |
| `defaultCountry` | `useUserPreferences()` |
| `foreignLocationFormat` | `useUserPreferences()` |
| `sharedGroups` | `useUserSharedGroups()` |

### Props That Need `_testOverrides` Pattern

These callbacks require App.tsx coordination and use the stub + override pattern:

```typescript
// src/views/DashboardView/useDashboardViewData.ts
// Following HistoryView pattern (lines 339-348)
return {
    // ... data props ...

    // Callbacks - stub implementation, override via _testOverrides in production
    onEditTransaction: (_transaction: Transaction) => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onEditTransaction called without _testOverrides. ' +
                'Pass onEditTransaction via _testOverrides prop for production use.'
            );
        }
    },
    onViewTrends: (_month: string | null) => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onViewTrends called without _testOverrides.'
            );
        }
    },
    onTriggerScan: () => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onTriggerScan called without _testOverrides.'
            );
        }
    },
};
```

### useDashboardViewData() Implementation (Following HistoryView Pattern)

```typescript
// src/views/DashboardView/useDashboardViewData.ts
// Pattern: src/views/HistoryView/useHistoryViewData.ts

import { useMemo, useCallback } from 'react';
import { getFirestore } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { usePaginatedTransactions } from '@/hooks/usePaginatedTransactions';
import { useRecentScans } from '@/hooks/useRecentScans';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserSharedGroups } from '@/hooks/useUserSharedGroups';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';
import { formatDate as formatDateUtil } from '@/utils/date';
import { TRANSLATIONS } from '@/utils/translations';
import type { Transaction } from '@/types/transaction';

// Types exported for _testOverrides
export interface UseDashboardViewDataReturn {
    // === Transaction Data ===
    transactions: Transaction[];
    recentScans: Transaction[];

    // === User Info ===
    userId: string | null;
    appId: string;

    // === Theme/Locale Settings ===
    theme: 'light' | 'dark';
    colorTheme: string;
    fontColorMode: 'colorful' | 'plain';
    lang: 'en' | 'es';
    currency: string;
    dateFormat: 'LatAm' | 'US';

    // === User Preferences ===
    defaultCountry: string;
    foreignLocationFormat: 'code' | 'flag';

    // === Formatters ===
    t: (key: string) => string;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;

    // === Groups ===
    sharedGroups: Array<{ id: string; color: string }>;

    // === Callbacks (stub - override via _testOverrides) ===
    onEditTransaction: (transaction: Transaction) => void;
    onViewTrends: (month: string | null) => void;
    onTriggerScan: () => void;
}

export function useDashboardViewData(): UseDashboardViewDataReturn {
    // === Auth & Services ===
    const { user, services } = useAuth();

    // === Theme/Locale Settings ===
    const { theme, colorTheme, fontColorMode, lang, currency, dateFormat } = useTheme();

    // === User Preferences ===
    const { preferences } = useUserPreferences(user, services);
    const defaultCountry = preferences.defaultCountry || '';
    const foreignLocationFormat = preferences.foreignLocationFormat || 'code';

    // === Transaction Data ===
    const { transactions } = usePaginatedTransactions(user, services);
    const recentScans = useRecentScans(user, services);

    // === Shared Groups ===
    const db = getFirestore();
    const { groups: sharedGroups } = useUserSharedGroups(db, user?.uid);

    // === Formatters (memoized) ===
    const t = useCallback(
        (key: string): string => {
            const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;
            return (translations as Record<string, string>)[key] || key;
        },
        [lang]
    );

    const formatCurrency = useCallback(
        (amount: number, currencyCode: string): string =>
            formatCurrencyUtil(amount, currencyCode),
        []
    );

    const formatDate = useCallback(
        (date: string, format: string): string =>
            formatDateUtil(date, format as 'LatAm' | 'US'),
        []
    );

    // === Callbacks (stub with DEV warning) ===
    // Pattern from HistoryView: lines 339-348
    const onEditTransaction = useCallback((_transaction: Transaction) => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onEditTransaction called without _testOverrides.'
            );
        }
    }, []);

    const onViewTrends = useCallback((_month: string | null) => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onViewTrends called without _testOverrides.'
            );
        }
    }, []);

    const onTriggerScan = useCallback(() => {
        if (import.meta.env.DEV) {
            console.warn(
                '[useDashboardViewData] onTriggerScan called without _testOverrides.'
            );
        }
    }, []);

    return {
        transactions,
        recentScans: recentScans || [],
        userId: user?.uid ?? null,
        appId: services?.appId ?? '',
        theme: theme as 'light' | 'dark',
        colorTheme,
        fontColorMode,
        lang: lang as 'en' | 'es',
        currency,
        dateFormat,
        defaultCountry,
        foreignLocationFormat,
        t,
        formatCurrency,
        formatDate,
        sharedGroups: sharedGroups.map(g => ({ id: g.id, color: g.color || '' })),
        onEditTransaction,
        onViewTrends,
        onTriggerScan,
    };
}
```

### DashboardView Migration Pattern (Following HistoryView)

```typescript
// src/views/DashboardView/index.tsx
// Pattern: src/views/HistoryView.tsx lines 162-209
import { useDashboardViewData, type UseDashboardViewDataReturn } from './useDashboardViewData';
import { useViewHandlers } from '@/contexts/ViewHandlersContext';

/**
 * DashboardView Props
 *
 * DashboardView now owns its data via useDashboardViewData hook.
 * Props are minimal - only test overrides for testing.
 */
interface DashboardViewProps {
    /**
     * Optional overrides for testing.
     * Allows tests to inject mock data without needing to mock hooks.
     */
    _testOverrides?: Partial<UseDashboardViewDataReturn>;
}

export function DashboardView({ _testOverrides }: DashboardViewProps) {
    // Get all data from hook
    const hookData = useDashboardViewData();

    // Merge hook data with test overrides (test overrides take precedence)
    // Pattern: HistoryView lines 186-209
    const {
        transactions,
        recentScans,
        userId,
        appId,
        theme,
        colorTheme,
        fontColorMode,
        lang,
        currency,
        dateFormat,
        defaultCountry,
        foreignLocationFormat,
        t,
        formatCurrency,
        formatDate,
        sharedGroups,
        onEditTransaction,
        onViewTrends,
        onTriggerScan,
    } = { ...hookData, ..._testOverrides };

    // Navigation handlers from ViewHandlersContext
    // Pattern: HistoryView lines 217-219
    const { navigation } = useViewHandlers();
    const onBack = navigation.navigateBack;
    const onNavigateToView = navigation.navigateToView;

    // Rest of component uses destructured data...
}
```

### Test Pattern (Following HistoryView)

```typescript
// tests/unit/views/DashboardView/DashboardView.test.tsx
// Pattern: tests/unit/views/HistoryView/HistoryView.test.tsx
import { render, screen } from '@testing-library/react';
import { DashboardView } from '@/views/DashboardView';
import { ViewHandlersContext } from '@/contexts/ViewHandlersContext';
import { mockDashboardViewData, mockNavigation } from './fixtures';

// Mock wrapper with required context
const renderWithContext = (ui: React.ReactElement) =>
    render(
        <ViewHandlersContext.Provider value={{ navigation: mockNavigation }}>
            {ui}
        </ViewHandlersContext.Provider>
    );

describe('DashboardView', () => {
    it('renders recent transactions with _testOverrides', () => {
        renderWithContext(
            <DashboardView
                _testOverrides={{
                    transactions: [mockTransaction],
                    recentScans: [mockScan],
                    theme: 'light',
                    colorTheme: 'mono',
                    fontColorMode: 'colorful',
                    lang: 'es',
                    currency: 'CLP',
                    dateFormat: 'LatAm',
                    t: (key) => key,
                    formatCurrency: (amt) => `$${amt}`,
                    formatDate: (date) => date,
                    onEditTransaction: vi.fn(),
                    onViewTrends: vi.fn(),
                }}
            />
        );

        expect(screen.getByText('thisMonthCarousel')).toBeInTheDocument();
    });

    it('calls onViewTrends when "This Month" card clicked', async () => {
        const onViewTrends = vi.fn();
        renderWithContext(
            <DashboardView
                _testOverrides={{
                    ...mockDashboardViewData,
                    onViewTrends,
                }}
            />
        );

        await userEvent.click(screen.getByTestId('this-month-card'));
        expect(onViewTrends).toHaveBeenCalledWith(expect.any(String));
    });
});
```

### What Gets Removed from App.tsx

```typescript
// REMOVE: useDashboardViewProps call and related setup (~35 lines)
const dashboardViewProps = useDashboardViewProps({
    transactions,
    recentScans,
    userCredits,
    // ... many more
});

// REMOVE: DashboardView props spreading in view routing (~15 lines)
case 'dashboard':
    return <DashboardView {...dashboardViewProps} />;
// BECOMES:
case 'dashboard':
    return <DashboardView />;
```

### Estimated Line Reduction

| Section | Lines Removed |
|---------|---------------|
| useDashboardViewProps call | ~35 |
| Related data prep/memoization | ~15 |
| Props spreading in routing | ~15 |
| **Total** | **~65** |

### Cumulative App.tsx Reduction (14e-25 Series)

| Story | Lines Removed | Running Total | Estimated App.tsx Size |
|-------|---------------|---------------|------------------------|
| 14e-25a.1 | ~60 | 60 | ~3,100 |
| 14e-25a.2 | ~85 | 145 | ~3,015 |
| 14e-25b.1 | ~80 | 225 | ~2,935 |
| **14e-25b.2** | ~65 | **290** | **~2,870** |

---

## Files

### Created

| File | Purpose |
|------|---------|
| `src/views/DashboardView/useDashboardViewData.ts` | Composition hook for all DashboardView data |
| `src/views/DashboardView/index.ts` | Re-export barrel file for DashboardView |
| `tests/unit/views/DashboardView/useDashboardViewData.test.ts` | Hook unit tests (8+ tests) |

### Modified

| File | Changes |
|------|---------|
| `src/App.tsx` | Remove useDashboardViewProps call, remove orphaned unused variables |
| `src/views/DashboardView.tsx` | Modified to use useDashboardViewData hook, added _testOverrides prop |
| `tests/unit/views/DashboardView.test.tsx` | Updated to use _testOverrides prop for mocking |

### Deleted (Post-Migration Cleanup)

| File | Reason |
|------|--------|
| `src/hooks/app/useDashboardViewProps.ts` | No longer needed - DashboardView owns data internally |
| `tests/unit/hooks/app/useDashboardViewProps.test.ts` | Corresponding test file removed |

---

## Dev Agent Record

### Implementation Notes

- **Pattern followed:** HistoryView data hook pattern (14e-25a.2)
- **Theme access:** Uses `useTheme()` instead of `useSettingsStore()` for consistency with other views
- **Navigation:** Uses `useViewHandlers()` for callbacks, following established pattern

### Completion Notes (2026-01-28)

**Review Follow-ups Addressed:**
- ✅ Removed 26 unused variables from App.tsx (type imports, mapping vars, preference setters, theme setters, handlers)
- ✅ Staged all untracked DashboardView directory files
- ✅ Staged all unstaged modifications and deletions
- ✅ Marked all task checkboxes complete
- ✅ Corrected Files section (index.ts not index.tsx, DashboardView.tsx modified not deleted)
- ✅ Added implementation deviation note for Task 1.7 (useTheme vs useSettingsStore)

**Build Status:** TypeScript type-check passes ✅

### Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Dev Agent | Initial implementation - useDashboardViewData hook, _testOverrides pattern |
| 2026-01-28 | Dev Agent | Addressed Archie review - removed 8 unused variable groups from App.tsx |
| 2026-01-28 | Dev Agent | Addressed Atlas code review - fixed git staging, documentation |

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 3 | ≤4 | ✅ OK |
| Subtasks | 25 | ≤15 | ⚠️ ACCEPTABLE |
| Files Created | 4 | - | ✅ OK |
| Files Modified | 2 | - | ✅ OK |
| Files Deleted | 2 | - | ✅ OK |

**Note:** Subtask count is higher due to comprehensive implementation guidance, but follows established TrendsView pattern (14e-25b.1). Each subtask is small and well-defined.

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-27)

### Affected Workflows

| Workflow | Impact | Risk |
|----------|--------|------|
| **#4 Analytics Navigation Flow** | UPSTREAM - "This Month" card navigates to TrendsView | MEDIUM |
| **#1 Scan Receipt Flow** | INDIRECT - Quick actions may trigger scan | LOW |

### Workflow Chain Visualization

```
[DashboardView (THIS STORY)]
         ↓
    "This Month" Card tap
         ↓
    navigateToView('trends')
         ↓
    [TrendsView] → (continues to Workflow #4)
```

### Critical Test Scenarios (From Workflow Analysis)

1. **Dashboard → TrendsView Navigation** (Workflow #4 Entry)
   - "This Month" card tap triggers `navigateToView('trends')`
   - TrendsView receives correct initial state (current month)
   - Navigation is instant (no loading flicker)

2. **Quick Actions** (Workflow #1 Entry)
   - Scan button triggers scan flow
   - Credit display shows current balance

### Additional Acceptance Criteria (Atlas Suggestions)

> These were suggested based on workflow chain analysis

- **AC-Atlas-1**: "This Month" card navigation must pass correct date range context
- **AC-Atlas-2**: Recent transaction list must show correct items (recentScans merged)
- **AC-Atlas-3**: Credit balance display must refresh correctly via `useUserCredits()`

### Testing Implications

- **Existing tests to verify:** DashboardView navigation tests, credit display tests
- **New scenarios to add:** Integration test for Dashboard → TrendsView navigation flow

---

## References

- [Parent: 14e-25b TrendsView + DashboardView](./14e-25b-trendsview-dashboardview.md)
- [Prerequisite: 14e-25b.1 TrendsView Migration](./14e-25b1-trendsview-migration.md)
- [Zustand State Management Standards](_bmad/_memory/react-opinionated-architect-sidecar/knowledge/state-management.md)
