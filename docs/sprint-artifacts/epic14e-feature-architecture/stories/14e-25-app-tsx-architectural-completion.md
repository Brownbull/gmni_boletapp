# Story 14e.25: App.tsx Architectural Completion

Status: split

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 16 (Split into 4 sub-stories: 5+5+3+3)
**Created:** 2026-01-27
**Split:** 2026-01-27
**Author:** Archie (React Opinionated Architect)
**Depends:** 14e-23 (App.tsx Final Cleanup - must be complete)

---

## Split Notice

This story has been **SPLIT** into 4 sub-stories for incremental delivery:

| Sub-Story | Focus | Points | File |
|-----------|-------|--------|------|
| **14e-25a** | Navigation store + HistoryView | 5 | [14e-25a-navigation-store-historyview.md](./14e-25a-navigation-store-historyview.md) |
| **14e-25b** | TrendsView + DashboardView | 5 | [14e-25b-trendsview-dashboardview.md](./14e-25b-trendsview-dashboardview.md) |
| **14e-25c** | SettingsView + remaining views | 3 | [14e-25c-settingsview-remaining.md](./14e-25c-settingsview-remaining.md) |
| **14e-25d** | ViewHandlersContext deletion + cleanup | 3 | [14e-25d-viewhandlers-deletion-cleanup.md](./14e-25d-viewhandlers-deletion-cleanup.md) |

**Execution Order:** 25a → 25b → 25c → 25d (sequential dependencies)

**See individual sub-story files for detailed acceptance criteria and tasks.**

---

## Story

As a **developer**,
I want **App.tsx reduced to the 500-800 line target specified in the architecture decision**,
So that **the codebase follows Feature-Sliced Design principles where views own their data fetching**.

---

## Context

### Why This Story Exists

Story 14e-23 "App.tsx Final Cleanup" was marked complete at **3,163 lines** with a "revised target" rationalization. However, the architecture decision document ([architecture-decision.md](../architecture-decision.md)) clearly states:

> **Target: App.tsx ~500-800 lines**

The "irreducible minimum" argument accepted in 14e-23 is a **structural constraint, not a physical law**. The constraint exists because views currently receive their props from App.tsx rather than fetching their own data.

### The FSD Violation

Per Feature-Sliced Design principles (from `_bmad/_memory/react-opinionated-architect-sidecar/knowledge/architecture.md`):

> **Pages layer**: Compose widgets and features. Pages should NOT contain business logic.

Currently App.tsx contains:
- **20+ data hook calls** (transactions, mappings, preferences, credits, insights, etc.)
- **Handler hook setups** with 30+ parameters each
- **State wrappers** for backward compatibility
- **View props composition** that should be inside views

### Current vs Target

| Metric | Current | Story 14e-23 "Revised Target" | Architecture Decision Target |
|--------|---------|-------------------------------|------------------------------|
| App.tsx Lines | 3,163 | 3,150-3,200 | **500-800** |
| Data hooks in App | 20+ | 20+ | **0-2** (auth, services) |
| Handler hooks in App | 4 | 4 | **0** |
| Props drilled to views | 30+ per view | 30+ per view | **0** (views use context/stores) |

### Root Cause Analysis

The file can't shrink because views are designed as "dumb components" receiving all props from App.tsx:

```typescript
// CURRENT ANTI-PATTERN (lines 650-875 in App.tsx)
const {
    saveTransaction,
    deleteTransaction,
    wipeDB,
    handleExportData,
} = useTransactionHandlers({
    user,                           // From useAuth
    services,                       // From useAuth
    viewMode,                       // From useViewMode
    activeGroup,                    // From useViewMode
    userPreferences,                // From useUserPreferences
    transactions,                   // From useTransactions
    currency,                       // Local state
    insightProfile,                 // From useInsightProfile
    insightCache,                   // From useInsightProfile
    recordInsightShown,             // From useInsightProfile
    trackTransactionForInsight,     // From useInsightProfile
    incrementInsightCounter,        // From useInsightProfile
    batchSession,                   // From useBatchSession
    addToBatch,                     // From useBatchSession
    setToastMessage,                // Local state
    setCurrentTransaction,          // Local state
    setView,                        // Local state
    // ... 10 more props
});
```

This pattern forces ALL data fetching to happen at the App level.

### The Architectural Solution

**Views should call their own hooks:**

```typescript
// TARGET PATTERN
function HistoryView() {
    // View owns its data
    const { user, services } = useAuth();
    const transactions = useTransactions(user, services);
    const { navigateToView } = useNavigation();

    // Handler uses view-local data
    const handleDelete = useCallback((id: string) => {
        deleteTransaction(services, id);
        showToast('Deleted');
    }, [services]);

    return <TransactionList transactions={transactions} onDelete={handleDelete} />;
}
```

This is the standard React pattern and aligns with FSD principles.

---

## Acceptance Criteria

### AC1: App.tsx Reduced to Target Size

**Given** the architectural change is complete
**When** measuring App.tsx
**Then:**
- [ ] App.tsx is **500-800 lines** (architecture decision target)
- [ ] Line count verified: `wc -l src/App.tsx` ≤ 800
- [ ] No data hooks except `useAuth()` in App.tsx
- [ ] No handler hooks in App.tsx

### AC2: Views Own Their Data

**Given** the refactored architecture
**When** reviewing view components
**Then:**
- [ ] HistoryView calls `useTransactions`, `usePaginatedTransactions`, `useHistoryFilters` internally
- [ ] TrendsView calls `useTransactions`, `useAnalyticsState` internally
- [ ] DashboardView calls `useTransactions`, `useRecentScans` internally
- [ ] SettingsView calls `useUserPreferences`, `useUserCredits` internally
- [ ] Views receive ONLY navigation callbacks (if any) as props
- [ ] Views access shared state via Zustand stores or contexts

### AC3: Handler Hooks Relocated

**Given** the view-owned data pattern
**When** reviewing handler hooks
**Then:**
- [ ] `useTransactionHandlers` is called INSIDE TransactionEditorView, not App.tsx
- [ ] `useScanHandlers` is called INSIDE ScanFeature, not App.tsx
- [ ] `useNavigationHandlers` is replaced by a `useNavigation()` hook available to all views
- [ ] `useDialogHandlers` is absorbed into ModalManager or individual features

### AC4: ViewHandlersContext Eliminated

**Given** views own their handlers
**When** reviewing the codebase
**Then:**
- [ ] `ViewHandlersContext` is deleted
- [ ] `ViewHandlersProvider` is deleted
- [ ] Views no longer call `useViewHandlers()` for handler access
- [ ] Handler bundles (`transactionHandlers`, `navigationHandlers`, etc.) removed from App.tsx

### AC5: State Wrappers Removed

**Given** Zustand stores are the source of truth
**When** reviewing App.tsx
**Then:**
- [ ] No backward-compatibility wrappers (lines 470-520 removed)
- [ ] No `setScanImages` wrapper function
- [ ] No `setScanError` wrapper function
- [ ] No `setIsAnalyzing` wrapper function
- [ ] Direct store usage via selectors/actions

### AC6: All Tests Pass

**Given** the refactored architecture
**When** running the test suite
**Then:**
- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm run test`
- [ ] TypeScript clean: `tsc --noEmit`
- [ ] View tests updated to mock hooks they now call directly

### AC7: No Functional Regressions

**Given** the refactored architecture
**When** testing all user workflows
**Then:**
- [ ] All 9 workflow chains function correctly
- [ ] Navigation between views works
- [ ] Transaction CRUD operations work
- [ ] Scan/batch flows work
- [ ] Filter persistence works across view transitions

---

## Tasks / Subtasks

### Task 1: Create useNavigation() Global Hook (AC: 3, 4)

- [ ] **1.1** Create `src/shared/hooks/useNavigation.ts` with view/setView, navigateToView, navigateBack
- [ ] **1.2** Move navigation state to Zustand store (`useNavigationStore`)
- [ ] **1.3** Delete `useNavigationHandlers` hook (logic absorbed into store)
- [ ] **1.4** Update all views to use `useNavigation()` instead of props
- [ ] **1.5** Write tests for navigation store

### Task 2: Migrate HistoryView to Own Data (AC: 2, 6)

- [ ] **2.1** Move `useTransactions`, `usePaginatedTransactions` calls into HistoryView
- [ ] **2.2** Move `useHistoryFilters` call into HistoryView (already wrapped)
- [ ] **2.3** Create `useHistoryViewData()` hook encapsulating all HistoryView data needs
- [ ] **2.4** Remove HistoryView props from App.tsx
- [ ] **2.5** Update HistoryView tests to mock internal hooks
- [ ] **2.6** Verify HistoryView renders correctly with internal data

### Task 3: Migrate TrendsView to Own Data (AC: 2, 6)

- [ ] **3.1** Move `useTransactions` call into TrendsView
- [ ] **3.2** Create `useTrendsViewData()` hook encapsulating TrendsView data needs
- [ ] **3.3** Remove TrendsView props from App.tsx
- [ ] **3.4** Update TrendsView tests
- [ ] **3.5** Verify TrendsView renders correctly

### Task 4: Migrate DashboardView to Own Data (AC: 2, 6)

- [ ] **4.1** Move `useTransactions`, `useRecentScans` calls into DashboardView
- [ ] **4.2** Create `useDashboardViewData()` hook
- [ ] **4.3** Remove DashboardView props from App.tsx
- [ ] **4.4** Update DashboardView tests
- [ ] **4.5** Verify DashboardView renders correctly

### Task 5: Migrate SettingsView to Own Data (AC: 2, 6)

- [ ] **5.1** Move `useUserPreferences`, `useUserCredits` calls into SettingsView
- [ ] **5.2** Create `useSettingsViewData()` hook
- [ ] **5.3** Remove SettingsView props from App.tsx
- [ ] **5.4** Update SettingsView tests
- [ ] **5.5** Verify SettingsView renders correctly

### Task 6: Migrate TransactionEditorView (AC: 2, 3, 6)

- [ ] **6.1** Move `useTransactionHandlers` call into TransactionEditorView
- [ ] **6.2** TransactionEditorView accesses mappings, preferences via hooks/stores
- [ ] **6.3** Remove TransactionEditorView props from App.tsx
- [ ] **6.4** Update tests
- [ ] **6.5** Verify save/delete workflows work

### Task 7: Migrate Remaining Views (AC: 2, 6)

- [ ] **7.1** Migrate ItemsView to own data
- [ ] **7.2** Migrate InsightsView to own data
- [ ] **7.3** Migrate ReportsView to own data
- [ ] **7.4** Migrate BatchCaptureView to own data (likely minimal - uses ScanStore)
- [ ] **7.5** Update all remaining view tests

### Task 8: Delete ViewHandlersContext (AC: 4)

- [ ] **8.1** Remove `ViewHandlersContext.tsx`
- [ ] **8.2** Remove `ViewHandlersProvider` from AppProviders
- [ ] **8.3** Remove all `useViewHandlers()` calls from views
- [ ] **8.4** Delete handler bundle definitions from App.tsx
- [ ] **8.5** Verify no regressions

### Task 9: Clean App.tsx State Wrappers (AC: 5)

- [ ] **9.1** Delete scan state wrapper functions (setScanImages, setScanError, etc.)
- [ ] **9.2** Views use store selectors/actions directly
- [ ] **9.3** Remove backward-compatibility code
- [ ] **9.4** Verify all scan flows work with direct store access

### Task 10: Final App.tsx Cleanup (AC: 1, 6, 7)

- [ ] **10.1** Remove unused imports (should be dramatic reduction)
- [ ] **10.2** Remove unused state declarations
- [ ] **10.3** Verify App.tsx is 500-800 lines
- [ ] **10.4** Run full test suite
- [ ] **10.5** Execute E2E smoke tests
- [ ] **10.6** Document final architecture

---

## Dev Notes

### Target App.tsx Structure (500-800 lines)

```typescript
// src/App.tsx - Final Target
import React from 'react';
import { AppProviders } from '@app/AppProviders';
import { FeatureOrchestrator } from '@app/FeatureOrchestrator';
import { AppLayout } from './components/App';
import { TopHeader } from './components/TopHeader';
import { Nav } from './components/Nav';
import { LoginScreen } from './views/LoginScreen';
import { useAuth } from './hooks/useAuth';
import { useNavigation } from '@/shared/hooks';

// Lazy-load views for code splitting
const DashboardView = React.lazy(() => import('./views/DashboardView'));
const HistoryView = React.lazy(() => import('./views/HistoryView'));
const TrendsView = React.lazy(() => import('./views/TrendsView'));
const SettingsView = React.lazy(() => import('./views/SettingsView'));
// ... other views

function App() {
    // ONLY auth at App level
    const { user, services, initError, signIn, signOut } = useAuth();

    // Global navigation (Zustand store)
    const { view } = useNavigation();

    // Early returns
    if (initError) return <ErrorScreen error={initError} />;
    if (!user) return <LoginScreen onSignIn={signIn} />;

    return (
        <AppProviders user={user} services={services}>
            <AppLayout>
                <TopHeader />

                <FeatureOrchestrator />

                <main>
                    <React.Suspense fallback={<ViewSkeleton />}>
                        {view === 'dashboard' && <DashboardView />}
                        {view === 'history' && <HistoryView />}
                        {view === 'trends' && <TrendsView />}
                        {view === 'settings' && <SettingsView />}
                        {/* ... other views */}
                    </React.Suspense>
                </main>

                <Nav />
            </AppLayout>
        </AppProviders>
    );
}

export default App;
```

### Pattern: View-Owned Data

```typescript
// src/views/HistoryView.tsx - Target Pattern
function HistoryView() {
    // View owns its data hooks
    const { user, services } = useAuth();
    const {
        transactions,
        hasMore,
        loadMore,
        loading
    } = usePaginatedTransactions(user, services);

    // View owns its handlers
    const { deleteTransaction } = useTransactionActions(services);
    const { showToast } = useToast();
    const { navigateToView } = useNavigation();

    // View owns its filters
    const filters = useHistoryFilters();

    const handleDelete = useCallback(async (id: string) => {
        await deleteTransaction(id);
        showToast('Transaction deleted', 'success');
    }, [deleteTransaction, showToast]);

    const handleEdit = useCallback((tx: Transaction) => {
        navigateToView('edit', { transaction: tx });
    }, [navigateToView]);

    return (
        <TransactionList
            transactions={filteredTransactions}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onLoadMore={loadMore}
            hasMore={hasMore}
        />
    );
}
```

### Migration Strategy

1. **Create navigation store first** - All views need this
2. **Migrate one view at a time** - Start with simplest (SettingsView)
3. **Test each migration thoroughly** - No big-bang refactor
4. **Delete old code after each migration** - Don't leave dead code

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Migrate one view at a time, test after each |
| Hook duplication | Create shared data hooks (`useTransactionData`, etc.) |
| Test refactoring overhead | Update tests in same PR as component migration |
| Performance regression | Views already wrapped in providers; no new renders |

### What Gets Deleted from App.tsx

| Section | Lines | Reason for Deletion |
|---------|-------|---------------------|
| Data hook calls (useTransactions, useCategoryMappings, etc.) | ~200 | Views call these directly |
| Handler hook setups (useTransactionHandlers, useScanHandlers) | ~300 | Views/features call these directly |
| Handler bundle definitions (transactionHandlers, etc.) | ~100 | ViewHandlersContext eliminated |
| State wrappers (setScanImages wrapper, etc.) | ~100 | Direct store usage |
| View props composition | ~400 | Views compose their own props |
| Unused imports | ~80 | Automatic after above deletions |

**Expected reduction: ~1,180 lines from these sections alone.**

---

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 10 | ≤4 | OVERSIZED |
| Subtasks | 48 | ≤15 | OVERSIZED |
| Points | 13 | - | COMPLEX |

**Note:** This story is intentionally large (13 points) because it represents a fundamental architectural change. Consider splitting into:

- **14e-25a**: Navigation store + HistoryView migration (5 pts)
- **14e-25b**: TrendsView + DashboardView migration (5 pts)
- **14e-25c**: SettingsView + remaining views migration (3 pts)
- **14e-25d**: ViewHandlersContext deletion + final cleanup (3 pts)

---

## References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md - Target 500-800 lines]
- [Source: _bmad/_memory/react-opinionated-architect-sidecar/knowledge/architecture.md - FSD principles]
- [Story 14e-23: App.tsx Final Cleanup - Context for "revised target" rationale]
- [ADR-018: Zustand-only state management]

---

## Archie's Assessment

🚒 **Fire Assessment:** The current App.tsx is **4x larger** than the architectural target. Story 14e-23 declared victory at a "revised target" that was never approved in the architecture decision document.

**The architectural violation is clear:**
- FSD says pages compose widgets and features, not fetch data
- App.tsx currently fetches ALL data and drills props 3-4 levels deep
- This is the anti-pattern that makes the file impossible to shrink

**The path forward requires:**
- Moving data hooks INTO views (standard React pattern)
- Views use Zustand stores and contexts for shared state
- App.tsx becomes a thin shell: auth + routing + feature orchestration

This isn't optional polish - it's completing the architectural vision that Epic 14e was supposed to deliver.
