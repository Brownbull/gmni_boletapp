# Story 14e.25a.2: HistoryView Data Migration

Status: split

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 3 (split into 2+2)
**Created:** 2026-01-27
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-25a.1 (Navigation Store Foundation)
**Blocks:** 14e-25b (TrendsView + DashboardView)

---

## Split Notice

> This story was split into two sub-stories on 2026-01-27 to reduce risk and ensure context window fit.

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| [14e-25a.2a](./14e-25a2a-historyview-data-hook.md) | useHistoryViewData hook + tests | 2 | ready-for-dev |
| [14e-25a.2b](./14e-25a2b-historyview-migration.md) | HistoryView migration + App.tsx cleanup | 2 | ready-for-dev |

**Implementation order:** 14e-25a.2a → 14e-25a.2b

---

## Original Story (Archived)

---

## Story

As a **developer**,
I want **HistoryView to own its data by calling hooks internally**,
So that **App.tsx no longer needs to compose and pass props to HistoryView**.

---

## Context

### Parent Story Split

This is part 2 of 2 for Story 14e-25a "Navigation Store + HistoryView Migration":

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| 14e-25a.1 | Navigation store + App.tsx migration | 3 | Blocks this story |
| **14e-25a.2** | HistoryView owns its data + tests | 3 | THIS STORY |

### Why HistoryView First?

HistoryView is the most data-heavy view and demonstrates the pattern clearly:
- Currently receives: transactions, hasMore, loadMore, filters, handlers, etc.
- After migration: calls its own hooks, receives nothing from App.tsx

This establishes the pattern for all subsequent view migrations (TrendsView, DashboardView, SettingsView).

### Architecture Pattern: View-Owned Data

```
BEFORE (Current):
┌─────────────────────────────────────────────────┐
│ App.tsx                                         │
│ - calls usePaginatedTransactions()              │
│ - calls useHistoryViewProps()                   │
│ - passes 30+ props to HistoryView               │
└─────────────────────────────────────────────────┘
                    ↓ props
┌─────────────────────────────────────────────────┐
│ HistoryView                                     │
│ - receives props                                │
│ - renders UI                                    │
└─────────────────────────────────────────────────┘

AFTER (This Story):
┌─────────────────────────────────────────────────┐
│ App.tsx                                         │
│ - renders <HistoryView /> (no props)            │
└─────────────────────────────────────────────────┘
                    ↓ nothing
┌─────────────────────────────────────────────────┐
│ HistoryView                                     │
│ - calls useHistoryViewData()                    │
│ - calls useNavigation()                         │
│ - renders UI                                    │
└─────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### AC1: useHistoryViewData() Composition Hook

**Given** HistoryView has multiple data needs
**When** organizing the data fetching
**Then:**
- [ ] `src/views/HistoryView/useHistoryViewData.ts` encapsulates all data hooks
- [ ] Returns: `transactions`, `hasMore`, `loadMore`, `loading`, `filters`, `user`, `services`
- [ ] Handles merge of `recentScans` into `paginatedTransactions` (moved from App.tsx)
- [ ] Memoization applied where appropriate

### AC2: HistoryView Owns Its Data

**Given** HistoryView needs transaction data
**When** HistoryView renders
**Then:**
- [ ] HistoryView calls `useHistoryViewData()` internally
- [ ] HistoryView calls `useHistoryFilters()` internally (already wrapped in provider)
- [ ] HistoryView uses `useNavigation()` for navigation callbacks
- [ ] HistoryView receives NO props from App.tsx (except optional test overrides)
- [ ] HistoryView accesses `useAuth()` for user/services

### AC3: App.tsx Reduced

**Given** HistoryView migrated to own data
**When** measuring App.tsx
**Then:**
- [ ] HistoryView props composition removed from App.tsx (~80 lines)
- [ ] `useHistoryViewProps` hook call removed from App.tsx
- [ ] `transactionsWithRecentScans` computation removed from App.tsx (~15 lines)
- [ ] Net reduction: ~95-100 lines

### AC4: Tests Updated

**Given** the refactored code
**When** running tests
**Then:**
- [ ] `useHistoryViewData()` hook has unit tests (10+ tests)
- [ ] HistoryView tests mock internal hooks instead of receiving props
- [ ] All existing HistoryView tests pass
- [ ] Integration tests verify navigation between views

### AC5: Filter State Integration (Atlas)

> 🗺️ Added via Atlas workflow chain analysis

**Given** navigation from TrendsView with drill-down filters
**When** HistoryView renders
**Then:**
- [ ] `useHistoryViewData()` consumes `pendingHistoryFilters` from navigation store
- [ ] Filters applied before first render (no flash of unfiltered data)
- [ ] `clearPendingFilters()` called after consumption

### AC6: Recent Scans Merge Preserved (Atlas)

> 🗺️ Added via Atlas workflow chain analysis

**Given** user has recent scans in scan context
**When** HistoryView displays transactions
**Then:**
- [ ] Recent scans appear at top of list
- [ ] Duplicate transactions deduplicated (by ID)
- [ ] Same ordering behavior as current App.tsx implementation

---

## Tasks / Subtasks

### Task 1: Create useHistoryViewData() Hook (AC: 1)

- [ ] **1.1** Create `src/views/HistoryView/useHistoryViewData.ts`
- [ ] **1.2** Call `useAuth()` for user/services
- [ ] **1.3** Call `usePaginatedTransactions(user, services)`
- [ ] **1.4** Call `useRecentScans(user, services)` (for merge)
- [ ] **1.5** Implement `transactionsWithRecentScans` merge logic (moved from App.tsx)
- [ ] **1.6** Return all data needed by HistoryView
- [ ] **1.7** Write unit tests for hook (10+ tests)

### Task 2: Migrate HistoryView to Own Data (AC: 2, 3)

- [ ] **2.1** Import and call `useHistoryViewData()` in HistoryView
- [ ] **2.2** Import and call `useNavigation()` for navigation callbacks
- [ ] **2.3** Remove props interface (or make optional for testing)
- [ ] **2.4** Remove HistoryView props from App.tsx view routing
- [ ] **2.5** Remove `useHistoryViewProps()` call from App.tsx
- [ ] **2.6** Remove `transactionsWithRecentScans` computation from App.tsx
- [ ] **2.7** Verify HistoryView renders correctly
- [ ] **2.8** Test filter functionality
- [ ] **2.9** Test pagination ("Load more")

### Task 3: Update Tests (AC: 4, 5, 6)

- [ ] **3.1** Write useHistoryViewData hook tests (10+ tests)
- [ ] **3.2** Update HistoryView tests to mock `useHistoryViewData()`
- [ ] **3.3** Update HistoryView tests to mock `useNavigation()`
- [ ] **3.4** Add tests for filter consumption from navigation store (AC5)
- [ ] **3.5** Add tests for recent scans merge behavior (AC6)
- [ ] **3.6** Run full test suite and fix failures
- [ ] **3.7** Verify no regressions in navigation between views

---

## Dev Notes

### useHistoryViewData() Hook Structure

```typescript
// src/views/HistoryView/useHistoryViewData.ts
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaginatedTransactions } from '@/hooks/usePaginatedTransactions';
import { useRecentScans } from '@/hooks/useRecentScans';
import type { Transaction } from '@/types/transaction';

interface UseHistoryViewDataReturn {
    transactions: Transaction[];
    allTransactions: Transaction[]; // For duplicate detection
    hasMore: boolean;
    loadMore: () => void;
    isLoadingMore: boolean;
    isAtListenerLimit: boolean;
    user: {
        uid: string | null;
        displayName: string | null;
        email: string | null;
    };
    // UI settings from user preferences
    theme: 'light' | 'dark';
    currency: string;
    dateFormat: string;
    lang: 'en' | 'es';
    // Formatters
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;
    t: (key: string) => string;
}

export function useHistoryViewData(): UseHistoryViewDataReturn {
    const { user, services } = useAuth();

    // Paginated transactions from Firestore
    const {
        transactions: paginatedTransactions,
        hasMore,
        loadMore,
        isLoading: isLoadingMore,
        isAtLimit: isAtListenerLimit,
    } = usePaginatedTransactions(user?.uid ?? null, services);

    // Recent scans for merge (these appear at top)
    const { recentScans } = useRecentScans(user?.uid ?? null, services);

    // Merge recent scans with paginated transactions
    // Recent scans appear first, then paginated (deduplicated)
    const transactionsWithRecentScans = useMemo(() => {
        if (!recentScans?.length) return paginatedTransactions;

        const recentIds = new Set(recentScans.map(s => s.id));
        const filteredPaginated = paginatedTransactions.filter(
            tx => !recentIds.has(tx.id)
        );

        return [...recentScans, ...filteredPaginated];
    }, [recentScans, paginatedTransactions]);

    // User preferences (from useUserPreferences or context)
    // ... theme, currency, dateFormat, lang, formatters

    return {
        transactions: transactionsWithRecentScans,
        allTransactions: transactionsWithRecentScans, // Same for now
        hasMore,
        loadMore,
        isLoadingMore,
        isAtListenerLimit,
        user: {
            uid: user?.uid ?? null,
            displayName: user?.displayName ?? null,
            email: user?.email ?? null,
        },
        // ... other fields
    };
}
```

### HistoryView Migration Pattern

```typescript
// BEFORE: src/views/HistoryView.tsx (receives 30+ props)
interface HistoryViewProps {
    transactions: Transaction[];
    hasMore: boolean;
    loadMore: () => void;
    loadingMore: boolean;
    // ... 25+ more props
}

export function HistoryView(props: HistoryViewProps) {
    // Uses props for everything
}

// AFTER: src/views/HistoryView.tsx (owns its data)
interface HistoryViewProps {
    // Optional overrides for testing only
    _testOverrides?: Partial<UseHistoryViewDataReturn>;
}

export function HistoryView({ _testOverrides }: HistoryViewProps = {}) {
    // View owns its data
    const data = useHistoryViewData();
    const {
        transactions,
        hasMore,
        loadMore,
        isLoadingMore,
        ...rest
    } = _testOverrides ? { ...data, ..._testOverrides } : data;

    // View owns its navigation
    const { navigateToView, navigateBack } = useNavigation();

    // Rest of component unchanged
}
```

### What Gets Removed from App.tsx

```typescript
// REMOVE: useHistoryViewProps call (~40 lines)
const historyViewProps = useHistoryViewProps({
    transactions: paginatedTransactions,
    transactionsWithRecentScans,
    user: { displayName, email, uid },
    // ... 15+ more fields
});

// REMOVE: transactionsWithRecentScans computation (~15 lines)
const transactionsWithRecentScans = useMemo(() => {
    if (!recentScans?.length) return paginatedTransactions;
    // ... merge logic
}, [recentScans, paginatedTransactions]);

// REMOVE: HistoryView props spreading in renderViewSwitch (~5 lines)
case 'history':
    return <HistoryView {...historyViewProps} />;
// BECOMES:
case 'history':
    return <HistoryView />;
```

### Estimated Line Reduction

| Section | Lines Removed |
|---------|---------------|
| useHistoryViewProps call | ~40 |
| transactionsWithRecentScans merge | ~15 |
| HistoryView props spreading | ~5 |
| Related useMemo deps | ~10 |
| Unused imports | ~5 |
| **Total** | **~75-85** |

Combined with 14e-25a.1 (~60 lines): **~135-145 lines total**

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 3 | ≤4 | ✅ OK |
| Subtasks | 19 | ≤15 | ⚠️ AT LIMIT |
| Files Changed | ~5 | ≤8 | ✅ OK |

> **Note:** Subtask count slightly exceeds guideline due to Atlas-suggested ACs (AC5, AC6) which add testing requirements. Story remains implementable in single session.

---

## Test Requirements

### useHistoryViewData Tests (15+ tests)

```typescript
// tests/unit/views/HistoryView/useHistoryViewData.test.ts
describe('useHistoryViewData', () => {
    describe('transactions merge', () => {
        it('returns paginated transactions when no recent scans');
        it('merges recent scans at beginning');
        it('deduplicates overlapping transactions');
    });

    describe('pagination', () => {
        it('exposes hasMore from paginated hook');
        it('exposes loadMore callback');
        it('exposes loading state');
    });

    describe('user data', () => {
        it('returns user info from auth context');
        it('handles null user gracefully');
    });

    describe('formatters', () => {
        it('provides currency formatter');
        it('provides date formatter');
        it('provides translation function');
    });

    // Atlas AC5: Filter State Integration
    describe('filter consumption', () => {
        it('consumes pendingHistoryFilters from navigation store');
        it('applies filters before first render');
        it('calls clearPendingFilters after consumption');
    });

    // Atlas AC6: Recent Scans Merge
    describe('recent scans merge', () => {
        it('places recent scans at top of list');
        it('deduplicates by transaction ID');
        it('preserves ordering within each group');
    });
});
```

### HistoryView Test Updates

```typescript
// tests/unit/views/HistoryView.test.tsx
// BEFORE: Pass props
render(<HistoryView transactions={mockTx} hasMore={true} ... />);

// AFTER: Mock internal hooks
vi.mock('../useHistoryViewData', () => ({
    useHistoryViewData: () => ({
        transactions: mockTx,
        hasMore: true,
        // ... other fields
    }),
}));

vi.mock('@/shared/hooks/useNavigation', () => ({
    useNavigation: () => ({
        navigateToView: vi.fn(),
        navigateBack: vi.fn(),
    }),
}));

render(<HistoryView />);
```

---

## Risk Mitigation

### Testing Risk

HistoryView has extensive tests (~50+ test cases). Migrating from props to internal hooks requires updating test setup:

**Mitigation:**
1. Create test utilities for mocking `useHistoryViewData`
2. Maintain `_testOverrides` prop for gradual migration
3. Run tests frequently during migration

### Regression Risk

HistoryView is used heavily - filters, pagination, selection mode all depend on correct data flow.

**Mitigation:**
1. Manual smoke test after each subtask
2. Keep old props interface temporarily (optional)
3. Test each feature: filters, pagination, selection, export

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-27)

### Affected Workflows

| Workflow | Impact | Risk |
|----------|--------|------|
| **#6 History Filter Flow** | DIRECT - HistoryView is the center of this workflow | MEDIUM |
| **#4 Analytics Navigation Flow** | INDIRECT - TrendsView drill-down passes filters | LOW |

### Downstream Effects

- Views using `handleNavigateToHistory()` will consume filters from navigation store
- Filter persistence behavior must be preserved (architecture.md:186-189)
- Recent scans merge logic moves from App.tsx to `useHistoryViewData()`

### Workflow Chain Visualization

```
[TrendsView drill-down] → pendingHistoryFilters → [Navigation Store (25a.1)] → [THIS STORY: HistoryView]
                                                                                      ↓
                                                                              useHistoryViewData()
                                                                                      ↓
                                                                              [Filtered Transactions → EditView]
```

### Testing Implications

- **Existing tests to verify:** HistoryView.test.tsx (~50+ tests), useHistoryFilters tests
- **New scenarios:** Filter consumption timing, recent scans merge behavior

---

## References

- [Parent: 14e-25a Navigation Store + HistoryView](./14e-25a-navigation-store-historyview.md)
- [Dependency: 14e-25a.1 Navigation Store Foundation](./14e-25a1-navigation-store-foundation.md)
- [Architecture Decision: 500-800 line target](../architecture-decision.md)
- [Current HistoryView implementation](src/views/HistoryView.tsx)
