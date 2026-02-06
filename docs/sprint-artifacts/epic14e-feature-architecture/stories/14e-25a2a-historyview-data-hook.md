# Story 14e.25a.2a: useHistoryViewData Hook Creation

Status: done

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 2
**Created:** 2026-01-27
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-25a.1 (Navigation Store Foundation)
**Blocks:** 14e-25a.2b (HistoryView Migration)

---

## Story

As a **developer**,
I want **a useHistoryViewData() composition hook that encapsulates all HistoryView data needs**,
So that **HistoryView can own its data without prop drilling from App.tsx**.

---

## Context

### Parent Story Split

This is part 1 of 2 for Story 14e-25a.2 "HistoryView Data Migration":

| Sub-Story | Focus | Points | Status |
|-----------|-------|--------|--------|
| **14e-25a.2a** | useHistoryViewData hook + tests | 2 | THIS STORY |
| 14e-25a.2b | HistoryView migration + App.tsx cleanup | 2 | Blocked by 25a.2a |

### Why Split?

Original story had 19 subtasks (4 over guideline). Splitting ensures:
1. Hook can be developed and tested independently
2. Risk contained - hook validation before view migration
3. Each story is within context window capacity

---

## Acceptance Criteria

### AC1: useHistoryViewData() Composition Hook

**Given** HistoryView has multiple data needs
**When** organizing the data fetching
**Then:**
- [x] `src/views/HistoryView/useHistoryViewData.ts` encapsulates all data hooks
- [x] Returns: `transactions`, `hasMore`, `loadMore`, `isLoadingMore`, `pendingFilters`, `user`, `appId`
- [x] Handles merge of `recentScans` into `paginatedTransactions` (moved from App.tsx)
- [x] Memoization applied where appropriate

### AC2: Filter State Integration (Atlas)

> 🗺️ Added via Atlas workflow chain analysis

**Given** navigation from TrendsView with drill-down filters
**When** the hook is called
**Then:**
- [x] `useHistoryViewData()` consumes `pendingHistoryFilters` from navigation store
- [x] Filters applied before returning data (no flash of unfiltered data)
- [x] `clearPendingFilters()` called after consumption

### AC3: Recent Scans Merge Preserved (Atlas)

> 🗺️ Added via Atlas workflow chain analysis

**Given** user has recent scans in scan context
**When** the hook returns transactions
**Then:**
- [x] Recent scans appear at top of list
- [x] Duplicate transactions deduplicated (by ID)
- [x] Same ordering behavior as current App.tsx implementation

### AC4: Hook Fully Tested

**Given** the hook is created
**When** running tests
**Then:**
- [x] `useHistoryViewData()` has unit tests (15+ tests) - 19 tests implemented
- [x] All edge cases covered (null user, empty transactions, no recent scans)

---

## Tasks / Subtasks

### Task 1: Create useHistoryViewData() Hook (AC: 1, 2, 3)

- [x] **1.1** Create `src/views/HistoryView/useHistoryViewData.ts`
- [x] **1.2** Call `useAuth()` for user/services
- [x] **1.3** Call `usePaginatedTransactions(user, services)`
- [x] **1.4** Call `useRecentScans(user, services)` (for merge)
- [x] **1.5** Implement `transactionsWithRecentScans` merge logic (moved from App.tsx)
- [x] **1.6** Consume `pendingHistoryFilters` from navigation store (AC2)
- [x] **1.7** Return all data needed by HistoryView

### Task 2: Write Hook Unit Tests (AC: 4)

- [x] **2.1** Create `tests/unit/views/HistoryView/useHistoryViewData.test.ts`
- [x] **2.2** Test transactions merge (3 tests)
- [x] **2.3** Test pagination (4 tests)
- [x] **2.4** Test user data (3 tests)
- [x] **2.5** Test filter consumption from navigation store (3 tests - AC2)
- [x] **2.6** Test recent scans merge behavior (3 tests - AC3)
- [x] **2.7** Test edge cases (3 tests)

### Review Follow-ups (Archie) - 2026-01-27

- [x] [Archie-Review][MEDIUM] Merge logic ordering differs from Dev Notes pattern - ✅ Fixed: Now uses `[...recentScans, ...filteredPaginated]` pattern per AC3 requirement.
- [x] [Archie-Review][LOW] Dual useEffect pattern for filter consumption - ✅ Fixed: Consolidated into single useEffect, removed unnecessary ref tracking.

### Review Follow-ups (AI Code Review) - 2026-01-27

- [x] [AI-Review][CRITICAL] **Stage files for commit** - ✅ Done: Files staged with `git add`.
- [x] [AI-Review][HIGH] **Add Dev Agent Record section** - ✅ Done: Added below.
- [x] [AI-Review][MEDIUM] **Update AC1 return type** - ✅ Done: Updated AC1 to say `appId` (not full services).
- [x] [AI-Review][LOW] **Update AC1 naming** - ✅ Done: Updated AC1 to use actual names `isLoadingMore`, `pendingFilters`.

---

## Dev Notes

### useHistoryViewData() Hook Structure

```typescript
// src/views/HistoryView/useHistoryViewData.ts
import { useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePaginatedTransactions } from '@/hooks/usePaginatedTransactions';
import { useRecentScans } from '@/hooks/useRecentScans';
import { useNavigationStore } from '@/shared/stores/useNavigationStore';
import type { Transaction } from '@/types/transaction';

export function useHistoryViewData(): UseHistoryViewDataReturn {
    const { user, services } = useAuth();

    // Navigation store for pending filters
    const pendingHistoryFilters = useNavigationStore((s) => s.pendingHistoryFilters);
    const clearPendingFilters = useNavigationStore((s) => s.clearPendingFilters);

    // Consume pending filters on mount
    useEffect(() => {
        if (pendingHistoryFilters) {
            // Apply filters (via HistoryFiltersContext)
            clearPendingFilters();
        }
    }, [pendingHistoryFilters, clearPendingFilters]);

    // Paginated transactions from Firestore
    const {
        transactions: paginatedTransactions,
        hasMore,
        loadMore,
        isLoading: isLoadingMore,
        isAtLimit: isAtListenerLimit,
    } = usePaginatedTransactions(user?.uid ?? null, services);

    // Recent scans for merge
    const { recentScans } = useRecentScans(user?.uid ?? null, services);

    // Merge recent scans with paginated transactions (AC3)
    const transactionsWithRecentScans = useMemo(() => {
        if (!recentScans?.length) return paginatedTransactions;

        const recentIds = new Set(recentScans.map(s => s.id));
        const filteredPaginated = paginatedTransactions.filter(
            tx => !recentIds.has(tx.id)
        );

        return [...recentScans, ...filteredPaginated];
    }, [recentScans, paginatedTransactions]);

    return {
        transactions: transactionsWithRecentScans,
        allTransactions: transactionsWithRecentScans,
        hasMore,
        loadMore,
        isLoadingMore,
        isAtListenerLimit,
        user: {
            uid: user?.uid ?? null,
            displayName: user?.displayName ?? null,
            email: user?.email ?? null,
        },
        // ... formatters from user preferences
    };
}
```

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 2 | ≤4 | ✅ OK |
| Subtasks | 13 | ≤15 | ✅ OK |
| Files Changed | 2 | ≤8 | ✅ OK |

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

    // Atlas AC2: Filter State Integration
    describe('filter consumption', () => {
        it('consumes pendingHistoryFilters from navigation store');
        it('applies filters before first render');
        it('calls clearPendingFilters after consumption');
    });

    // Atlas AC3: Recent Scans Merge
    describe('recent scans merge', () => {
        it('places recent scans at top of list');
        it('deduplicates by transaction ID');
        it('preserves ordering within each group');
    });
});
```

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-27)

### Affected Workflows

| Workflow | Impact | Risk |
|----------|--------|------|
| **#6 History Filter Flow** | DIRECT - Hook provides data for this flow | MEDIUM |

### Workflow Chain Visualization

```
[Navigation Store (25a.1)] → pendingHistoryFilters → [THIS STORY: useHistoryViewData hook]
                                                              ↓
                                                     [HistoryView (25a.2b)]
```

---

## Dev Agent Record

### Implementation Plan

1. Created useHistoryViewData() composition hook with all required data fetching
2. Implemented recent scans merge with deduplication (recent scans at top per AC3)
3. Integrated pendingHistoryFilters from navigation store (AC2)
4. Created comprehensive test suite with 19 tests

### Completion Notes

- **2026-01-27**: Initial implementation complete with 19 tests
- **2026-01-27 (Review Follow-up)**: Fixed merge logic to place recent scans at TOP of list per AC3 requirement. Updated tests to verify ordering and precedence (recent scans win on duplicates).
- **2026-01-27 (Review Follow-up)**: Consolidated dual useEffect into single effect. Removed unnecessary ref tracking for cleaner code.

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/views/HistoryView/useHistoryViewData.ts` | NEW | Composition hook for HistoryView data |
| `tests/unit/views/HistoryView/useHistoryViewData.test.ts` | NEW | 19 unit tests for hook |

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-27 | Initial implementation | Dev Agent |
| 2026-01-27 | Fixed merge ordering (Archie review) | Dev Agent |
| 2026-01-27 | Updated AC1 naming to match implementation | Dev Agent |
| 2026-01-27 | Staged files for commit | Dev Agent |
| 2026-01-27 | Consolidated dual useEffect into single effect | Dev Agent |

---

## References

- [Parent: 14e-25a.2 HistoryView Data Migration](./14e-25a2-historyview-data-migration.md)
- [Dependency: 14e-25a.1 Navigation Store Foundation](./14e-25a1-navigation-store-foundation.md)
- [Blocks: 14e-25a.2b HistoryView Migration](./14e-25a2b-historyview-migration.md)
