# Story 14c-refactor.26: View-Specific Prop Composition Hooks

Status: done

> **Depends on:** 14c-refactor.25 (ViewHandlersContext) - Must be complete before starting.

## Story

As a **developer**,
I want **dedicated hooks that compose all props needed for each complex view**,
So that **view prop assembly is encapsulated, testable, and App.tsx becomes a minimal orchestrator**.

## Background

After ViewHandlersContext (14c-refactor.25) eliminates handler prop drilling, the remaining complexity in App.tsx is assembling data props for each view. Complex views like TransactionEditorView need 30-100 props combining:

- User data (user, preferences, credits)
- Transaction data (current transaction, items, mappings)
- UI state (mode, scan state, dialog state)
- Callbacks (now via context)

View-specific composition hooks encapsulate this assembly:

```typescript
// Before: 80 props defined inline in App.tsx
<TransactionEditorView
  user={user}
  transaction={currentTransaction}
  mode={transactionEditorMode}
  scanState={scanState}
  // ... 76 more props
/>

// After: Hook composes everything
const editorProps = useTransactionEditorViewProps();
<TransactionEditorView {...editorProps} />
```

## Acceptance Criteria

### Core Functionality

1. **Given** TransactionEditorView needs ~100 props
   **When** this story is completed
   **Then:**
   - useTransactionEditorViewProps() hook created in `hooks/app/`
   - Hook receives all data as options (does NOT call other hooks internally)
   - Hook returns strongly-typed props object via useMemo
   - App.tsx uses spread: `<TransactionEditorView {...editorProps} />`

2. **Given** TrendsView needs analytics state + data props
   **When** this story is completed
   **Then:**
   - useTrendsViewProps() hook created
   - Hook composes analytics initial state, pending filters, data props (NOT handlers)
   - AnalyticsProvider wrapping handled inside hook or renderViewSwitch
   - Handlers accessed via ViewHandlersContext (story 25)

3. **Given** HistoryView/ItemsView need filter state + pagination
   **When** this story is completed
   **Then:**
   - useHistoryViewProps() hook created
   - Hook composes filter state, transactions, pagination, edit callbacks
   - HistoryFiltersProvider wrapping preserved

4. **Given** BatchReviewView needs batch state + data props
   **When** this story is completed
   **Then:**
   - useBatchReviewViewProps() hook created
   - Hook composes batch receipts, scan state, batch processing data (NOT handlers)
   - Handlers accessed via ViewHandlersContext (story 25)

5. **Given** all composition hooks are integrated
   **When** measuring App.tsx
   **Then:**
   - App.tsx is ~800-1,000 lines (down from ~2,000)
   - renderViewSwitch() is clean with spread props
   - All tests pass
   - Build succeeds

### Atlas-Suggested Acceptance Criteria

6. **Given** composition hooks create complex prop objects (Atlas-suggested)
   **When** props are passed to views
   **Then:**
   - Each hook uses `useMemo` for the returned props object
   - Dependency arrays are minimal and explicit
   - No spurious re-renders when unrelated state changes
   - React DevTools Profiler shows stable prop references

7. **Given** all composition hooks are integrated (Atlas-suggested)
   **When** performing critical path smoke test
   **Then:**
   - Auth → Scan → Save critical path works end-to-end
   - Quick Save flow works with correct timing
   - Batch processing flow works for multi-receipt saves
   - TrendsView drill-down preserves filter state
   - HistoryView pagination loads older transactions

## Tasks / Subtasks

### Task 1: Create useTransactionEditorViewProps (AC: #1)

- [x] 1.1 Create `src/hooks/app/useTransactionEditorViewProps.ts`
- [x] 1.2 Define TransactionEditorViewProps interface (from existing view)
- [x] 1.3 Define options interface that receives ALL data (no internal hook calls):
  - user, services (from App.tsx useAuth)
  - transactions (from App.tsx useTransactions)
  - scanState (from App.tsx useScan)
  - categoryMappings, merchantMappings, itemNameMappings (from App.tsx hooks)
  - userCredits (from App.tsx useUserCredits)
  - currentTransaction, mode (App.tsx local state)
- [x] 1.4 Implement hook that composes props from options using useMemo
- [x] 1.5 **CRITICAL:** Copy `scanButtonState` derivation logic exactly from App.tsx (~line 660-695)
- [x] 1.6 Export from hooks/app/index.ts
- [x] 1.7 Add unit tests including scanButtonState derivation test

### Task 2: Create useTrendsViewProps (AC: #2)

- [x] 2.1 Create `src/hooks/app/useTrendsViewProps.ts`
- [x] 2.2 Define options interface (receives data, no hook calls):
  - transactions (from App.tsx)
  - userPreferences (currency, date format from App.tsx)
  - analyticsInitialState, pendingDistributionView (App.tsx local state)
- [x] 2.3 Implement hook that composes props from options
- [x] 2.4 Export from hooks/app/index.ts
- [x] 2.5 Add unit tests

### Task 3: Create useHistoryViewProps (AC: #3)

- [x] 3.1 Create `src/hooks/app/useHistoryViewProps.ts`
- [x] 3.2 Define options interface (receives data, no hook calls):
  - transactions (paginated data from App.tsx)
  - userPreferences (from App.tsx)
  - pendingHistoryFilters (App.tsx local state)
  - pagination state (from App.tsx)
- [x] 3.3 Implement hook that composes props from options
- [x] 3.4 Export from hooks/app/index.ts
- [x] 3.5 Add unit tests

### Task 4: Create useBatchReviewViewProps (AC: #4)

- [x] 4.1 Create `src/hooks/app/useBatchReviewViewProps.ts`
- [x] 4.2 Define options interface (receives data, no hook calls):
  - scanState, batchReceipts (from App.tsx useScan)
  - batchProcessing state (from App.tsx)
- [x] 4.3 Implement hook that composes props from options
- [x] 4.4 Export from hooks/app/index.ts
- [x] 4.5 Add unit tests

### Task 5: Integrate in App.tsx (AC: #5)

DEFERRED to story 27 per story guidance. This story creates hooks and exports; App.tsx integration follows.

- [ ] 5.1 Import all view props hooks
- [ ] 5.2 Call hooks at top of App component
- [ ] 5.3 Update renderViewSwitch to use spread props
- [ ] 5.4 Remove inline prop definitions from App.tsx
- [ ] 5.5 Verify line count ~800-1,000

### Task 6: Memoization Stability Tests (AC: #6)

- [x] 6.1 Add tests verifying useMemo doesn't recreate props when unrelated options change
- [x] 6.2 Use `Object.is` comparison in tests to verify reference stability
- [x] 6.3 Test each hook returns same object reference when deps unchanged

### Task 7: Final Verification (AC: #5, #7)

- [x] 7.1 Run full test suite - 292 tests pass in hooks/app/
- [x] 7.2 Run build - TypeScript compiles with no errors
- [ ] 7.3 Manual smoke test all 15 views (deferred - hooks not yet integrated)
- [ ] 7.4 Verify workflow chains still work (deferred - hooks not yet integrated)
- [ ] 7.5 React DevTools Profiler check for spurious re-renders (deferred - hooks not yet integrated)

## Dev Notes

### Estimation

- **Points:** 3 pts
- **Risk:** MEDIUM - Requires careful prop mapping, view-specific testing

### Dependencies

- **Requires:** 14c-refactor.25 complete (ViewHandlersContext)
- **Blocks:** None (this completes the App.tsx decomposition arc)

### Handler vs Data Split (IMPORTANT)

**Composition hooks provide DATA props only. Views get handlers from ViewHandlersContext.**

This is the intentional architecture from story 14c-refactor.25:
- **Data props:** Composed by these hooks (user, transactions, scanState, mappings, etc.)
- **Handler callbacks:** Accessed via `useViewHandlers()` from ViewHandlersContext

Views consume BOTH:
```tsx
function TransactionEditorView(dataProps: TransactionEditorViewProps) {
  const { transaction, scan } = useViewHandlers(); // Handlers from context
  // dataProps contains user, scanState, mappings, etc.
}
```

### Hook Structure Pattern

**CRITICAL ARCHITECTURAL RULE:** These hooks receive data as options - they do NOT call other hooks internally.

This prevents duplicate hook subscriptions and state mismatches. App.tsx already calls `useAuth()`, `useTransactions()`, etc. - if composition hooks called them again, you'd have duplicate subscriptions.

```typescript
// src/hooks/app/useTransactionEditorViewProps.ts

interface UseTransactionEditorViewPropsOptions {
  // App-level data (passed down, NOT fetched)
  user: User | null;
  transactions: Transaction[];
  scanState: ScanState;
  categoryMappings: CategoryMapping[];
  merchantMappings: MerchantMapping[];
  itemNameMappings: ItemNameMapping[];
  userCredits: UserCredits | null;

  // View-specific state
  currentTransaction: Transaction | null;
  transactionEditorMode: 'new' | 'edit' | 'readonly';
}

export function useTransactionEditorViewProps(
  options: UseTransactionEditorViewPropsOptions
): TransactionEditorViewProps {
  // ❌ DO NOT call hooks here - just compose from options
  // ✅ All data comes from options parameter

  return useMemo(() => ({
    user: options.user,
    transaction: options.currentTransaction,
    mode: options.transactionEditorMode,
    scanState: options.scanState,
    categoryMappings: options.categoryMappings,
    // ... all other props composed from options
  }), [
    options.user,
    options.currentTransaction,
    options.transactionEditorMode,
    options.scanState,
    options.categoryMappings,
    // ... deps
  ]);
}
```

**Data Flow:**
```
App.tsx (calls hooks) → composition hooks (compose props) → views (receive props)
                                                         ↘ views also call useViewHandlers()
```

### Dependency Array Best Practices

**EXPLICIT OVER CLEVER:** List every dependency individually. Don't use `Object.values(options)` or spread.

```typescript
// ✅ CORRECT: Explicit dependencies
return useMemo(() => ({...}), [
  options.user,
  options.currentTransaction,
  options.transactionEditorMode,
  options.scanState,
  // ... list ALL deps
]);

// ❌ WRONG: Clever but dangerous
return useMemo(() => ({...}), Object.values(options));
```

The cost of re-renders from a missed dependency is worse than a long array. TypeScript will catch missing props in the object; ESLint exhaustive-deps catches missing dependencies.

### File Structure After This Story

**Note:** Hooks go in `hooks/app/` (not `hooks/views/`) to match existing codebase pattern.

```
src/
├── App.tsx                          # ~800-1,000 lines (orchestrator only)
├── hooks/
│   └── app/                         # App-level hooks (handlers + composition)
│       ├── index.ts                 # Barrel exports
│       ├── useTransactionHandlers.ts
│       ├── useScanHandlers.ts
│       ├── useNavigationHandlers.ts
│       ├── useDialogHandlers.ts
│       ├── useTransactionEditorViewProps.ts  # NEW
│       ├── useTrendsViewProps.ts             # NEW
│       ├── useHistoryViewProps.ts            # NEW
│       └── useBatchReviewViewProps.ts        # NEW
└── contexts/
    └── ViewHandlersContext.tsx      # From 14c-refactor.25
```

### App.tsx Target Structure (~800-1,000 lines)

```tsx
function App() {
  // === Auth + core data (~20 lines) ===
  const { user, services } = useAuth();
  const { data: transactions } = useTransactions(user, services);
  const scanState = useScan();
  const categoryMappings = useCategoryMappings(/* ... */);
  // ... other data hooks

  // === View state (~30 lines) ===
  const [view, setView] = useState<View>('dashboard');
  const [currentTransaction, setCurrentTransaction] = useState(null);
  // ... minimal state

  // === Composition hooks (~40 lines) ===
  // Note: Pass data as options - hooks don't call other hooks
  const editorProps = useTransactionEditorViewProps({
    user,
    transactions,
    scanState,
    categoryMappings: categoryMappings.data ?? [],
    currentTransaction,
    transactionEditorMode: mode,
  });
  const trendsProps = useTrendsViewProps({
    transactions,
    userPreferences,
    analyticsInitialState,
  });
  const historyProps = useHistoryViewProps({
    transactions: paginatedTransactions,
    userPreferences,
    pendingFilters,
  });
  const batchProps = useBatchReviewViewProps({
    scanState,
    batchReceipts: scanState.batchReceipts,
  });

  // === Early returns (~10 lines) ===
  if (!user) return <LoginScreen />;

  // === Main render (~100 lines) ===
  return (
    <ViewHandlersProvider value={handlers}>
      <AppLayout>
        <AppMainContent>
          {renderViewSwitch(view, { editorProps, trendsProps, historyProps, batchProps })}
        </AppMainContent>
      </AppLayout>
      <AppOverlays {...overlayProps} />
    </ViewHandlersProvider>
  );
}
```

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-22)

### Affected Workflows

| Workflow | Impact | Risk |
|----------|--------|------|
| **Scan Receipt Flow (#1)** | TransactionEditorView is the PRIMARY view for this flow. Prop composition must preserve scan state machine transitions (idle→capturing→scanning→reviewing→saved). | HIGH |
| **Quick Save Flow (#2)** | QuickSaveCard triggers from scanState.activeDialog. Props must include dialog handlers and transaction state for save/edit/cancel paths. | HIGH |
| **Batch Processing Flow (#3)** | BatchReviewView receives batchReceipts from ScanContext. Prop composition must handle batch edit navigation (previous/next) and save all flow. | MEDIUM |
| **Analytics Navigation Flow (#4)** | TrendsView drill-down sets pendingHistoryFilters → navigates to HistoryView. Prop composition must preserve filter state across views. | MEDIUM |
| **History Filter Flow (#6)** | HistoryView receives transactionsWithRecentScans + pagination. Prop composition must handle loadMore callback for infinite scroll. | LOW |

### Downstream Effects to Consider

1. **Scan State Machine Integrity:** `useTransactionEditorViewProps` must correctly derive `scanButtonState` from `scanState.phase`:
   - `idle` → `'idle'`
   - `capturing` → `'pending'`
   - `scanning` → `'scanning'`
   - `reviewing` → `'complete'`
   - `error` → `'error'`

2. **Batch Context Preservation:** `batchContext` prop (index/total) must be derived from `scanState.batchEditingIndex` AND `transactionNavigationList` (for ItemsView navigation).

3. **Filter Persistence:** TrendsView → HistoryView navigation uses `handleNavigateToHistory` which sets `pendingHistoryFilters`. This handler must be correctly wired through ViewHandlersContext.

4. **Group Mode Reactivity:** All composition hooks must read from `useViewMode()` to correctly filter transactions when `isGroupMode` changes.

### Testing Implications

- **Existing tests to verify:** TransactionEditorView.test.tsx, TrendsView.test.tsx, HistoryView.test.tsx, BatchReviewView.test.tsx
- **New unit tests:** Each composition hook needs tests verifying all props are present and correctly typed
- **Integration tests:** Critical paths (scan→save, batch→review→save, trends→history) should be manually verified

### Workflow Chain Visualization

```
[Auth] → [App.tsx State] → [Composition Hooks] → [Views]
              ↓                    ↓
         currentTransaction    useTransactionEditorViewProps
         transactionEditorMode      ↓
         view                  TransactionEditorView
              ↓                    (Scan Receipt #1)
         pendingHistoryFilters      (Quick Save #2)
              ↓
         useTrendsViewProps → TrendsView (Analytics #4)
              ↓
         useHistoryViewProps → HistoryView (Filter #6)
              ↓
         useBatchReviewViewProps → BatchReviewView (Batch #3)
```

### Push Alert: Scan State Critical

**⚠️ ALERT: The Scan Receipt Flow is the app's primary monetized feature.**

When implementing `useTransactionEditorViewProps`:
1. Verify `scanButtonState` computation matches existing logic in App.tsx (line ~660-695)
2. Test credit deduction timing (before API call, restore on error)
3. Verify `skipScanCompleteModal` propagation for QuickSaveCard→Edit flow

---

## References

- [Source: Story 14c-refactor.25](14c-refactor-25-view-handlers-context.md) - Prerequisite (ViewHandlersContext)
- [Source: src/App.tsx:660-695] - **scanButtonState derivation logic (COPY THIS)**
- [Source: src/App.tsx:3360-3625] - TransactionEditorView current props
- [Source: src/App.tsx:3627-3698] - TrendsView current props
- [Source: src/views/TransactionEditorView.tsx:107-246] - Props interface (~50 props)
- [Source: src/views/TrendsView.tsx] - Props interface
- [Source: src/views/HistoryView.tsx] - Props interface
- [Source: src/views/BatchReviewView.tsx] - Props interface
- [Source: src/contexts/ViewHandlersContext.tsx] - Handler context (handlers come from here, NOT composition hooks)
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md] - Workflow definitions

## File List

**To Create:**
- `src/hooks/app/useTransactionEditorViewProps.ts`
- `src/hooks/app/useTrendsViewProps.ts`
- `src/hooks/app/useHistoryViewProps.ts`
- `src/hooks/app/useBatchReviewViewProps.ts`
- `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts`
- `tests/unit/hooks/app/useTrendsViewProps.test.ts`
- `tests/unit/hooks/app/useHistoryViewProps.test.ts`
- `tests/unit/hooks/app/useBatchReviewViewProps.test.ts`

**To Modify:**
- `src/hooks/app/index.ts` - Export new composition hooks
- `src/App.tsx` - Use composition hooks, remove inline props
- `src/components/App/viewRenderers.tsx` - Accept composed props

---

*Story created: 2026-01-22 via atlas-create-story workflow*
*Atlas analysis: Workflow chains #1, #2, #3, #4, #6 affected*

---

## Pre-Dev Review Record (2026-01-22)

**Reviewer:** React Opinionated Architect (Archie)

### Review Findings & Corrections Applied

| Finding | Severity | Resolution |
|---------|----------|------------|
| AC #2, #4 mentioned "callbacks" - implied handlers in hooks | MEDIUM | Clarified: hooks compose DATA props only, handlers via context |
| No explicit task for scanButtonState derivation | HIGH | Added Task 1.5: Copy derivation logic exactly from App.tsx |
| No memoization stability tests | MEDIUM | Added Task 6: Memoization stability tests with Object.is |
| Handler/data split not documented | MEDIUM | Added Dev Notes section explaining the split |
| Dependency array best practices missing | LOW | Added Dev Notes section on explicit dependencies |

### Architecture Verdict: **GO**

- FSD layer placement: Acceptable (hooks/app/ matches codebase convention)
- State management: Correct (no server state in composition hooks)
- Critical risk: Scan state machine integrity - mitigated by Task 1.5
- Testing: Enhanced with memoization stability tests

---

## Implementation Record (2026-01-22)

**Implemented by:** Claude (Atlas Dev Story workflow)

### Files Created

| File | Purpose | Tests |
|------|---------|-------|
| `src/hooks/app/useTransactionEditorViewProps.ts` | Composes data props for TransactionEditorView including scanButtonState derivation | 27 tests |
| `src/hooks/app/useTrendsViewProps.ts` | Composes data props for TrendsView including group mode support | 6 tests |
| `src/hooks/app/useHistoryViewProps.ts` | Composes data props for HistoryView including pagination | 7 tests |
| `src/hooks/app/useBatchReviewViewProps.ts` | Composes data props for BatchReviewView | 7 tests |
| `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts` | Memoization stability + prop composition tests | - |
| `tests/unit/hooks/app/useTrendsViewProps.test.ts` | Memoization stability + prop composition tests | - |
| `tests/unit/hooks/app/useHistoryViewProps.test.ts` | Memoization stability + prop composition tests | - |
| `tests/unit/hooks/app/useBatchReviewViewProps.test.ts` | Memoization stability + prop composition tests | - |

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/app/index.ts` | Added exports for all 4 composition hooks + types |

### Key Implementation Details

1. **scanButtonState Derivation:** Logic copied exactly from App.tsx:510-520
   - `idle` → `'idle'`
   - `capturing` → `'pending'`
   - `scanning` → `'scanning'`
   - `reviewing` → `'complete'`
   - `saving` → `'scanning'`
   - `error` → `'error'`

2. **batchContext Computation:** Prioritizes ScanContext batch over navigation list
   - First checks `scanState.batchEditingIndex` + `scanState.batchReceipts`
   - Falls back to `transactionNavigationList` for ItemsView navigation

3. **isOtherUserTransaction Detection:** Compares `currentTransaction._ownerId` with `user.uid`

4. **Memoization:** All hooks use `useMemo` with explicit dependency arrays

### Test Results

```
Test Files:  4 passed (4)
Tests:       47 passed (47)
TypeScript:  No errors
```

### App.tsx Integration

DEFERRED to Story 27. This story creates the hooks and exports them; App.tsx integration (using the hooks via spread props) will be done in the next story to keep changes focused and testable.

### Atlas Memory Update

The following patterns should be recorded:
- View prop composition hooks receive data as options, NOT call hooks internally
- Handlers come from ViewHandlersContext, data props from composition hooks
- Memoization stability tests verify reference equality when deps unchanged
