# Story 14c-refactor.30: HistoryView Props Interface Alignment

Status: split

> **SPLIT 2026-01-23:** This story was split into 3 sub-stories due to sizing analysis.
> See [atlas-story-sizing](/_bmad/bmm/workflows/4-implementation/atlas-story-sizing/workflow.yaml) workflow.
>
> **Sub-stories:**
> - [14c-refactor-30a](14c-refactor-30a-historyview-interface-rename.md) - Interface rename (2 pts)
> - [14c-refactor-30b](14c-refactor-30b-hook-expansion.md) - Hook expansion (2 pts)
> - [14c-refactor-30c](14c-refactor-30c-integration-verification.md) - Integration + verification (2 pts)
>
> **Split reason:** 5 tasks, 24 subtasks exceeded sizing guidelines (max 4 tasks, 15 subtasks)

## Story

As a **developer maintaining App.tsx**,
I want **HistoryView's props interface to match useHistoryViewProps hook output names**,
So that **App.tsx can use direct spreading `<HistoryView {...historyViewProps} />` and reduce ~35 lines of inline props**.

## Background

### The Problem (from Story 29 FR)

Story 29 integrated composition hooks into App.tsx, but the **naming mismatch** prevents direct spreading:

| Hook Returns | View Expects | Forces Manual Mapping |
|--------------|--------------|----------------------|
| `transactions` | `historyTrans` | `historyTrans={...transactions as any}` |
| `hasMore` | `hasMoreTransactions` | `hasMoreTransactions={...hasMore}` |
| `isLoadingMore` | `loadingMoreTransactions` | `loadingMoreTransactions={...isLoadingMore}` |

Additionally, the hook **doesn't include all props**:
- Missing: `formatCurrency`, `formatDate`, `dateFormat`, `colorTheme`, `fontColorMode`
- Missing: `foreignLocationFormat`, `defaultCity`, `defaultCountry`, `activeGroup`
- Missing: `onEditTransaction`, `onLoadMoreTransactions`, `onTransactionsDeleted`, `isAtListenerLimit`

### Current State (App.tsx lines 3695-3738)

```tsx
{view === 'history' && (
    <HistoryFiltersProvider ...>
        <HistoryView
            // From composition hook (with prop name mapping)
            historyTrans={historyViewDataProps.transactions as any}
            allTransactions={historyViewDataProps.transactionsWithRecentScans as any}
            historyPage={historyViewDataProps.historyPage}
            totalHistoryPages={historyViewDataProps.totalHistoryPages}
            theme={historyViewDataProps.theme}
            currency={historyViewDataProps.currency}
            lang={historyViewDataProps.lang}
            t={historyViewDataProps.t}
            userName={historyViewDataProps.userName}
            userEmail={historyViewDataProps.userEmail}
            userId={historyViewDataProps.userId}
            appId={historyViewDataProps.appId}
            hasMoreTransactions={historyViewDataProps.hasMore}
            loadingMoreTransactions={historyViewDataProps.isLoadingMore}
            // Deprecated handlers (view uses useViewHandlers() internally)
            onBack={() => {}}
            // Remaining inline props (not in composition hook)
            colorTheme={colorTheme}
            dateFormat={dateFormat}
            formatCurrency={formatCurrency}
            formatDate={formatDate as any}
            onSetHistoryPage={() => {}}
            onEditTransaction={(tx) => navigateToTransactionDetail(tx as Transaction)}
            onLoadMoreTransactions={isGroupMode ? () => {} : loadMoreTransactions}
            isAtListenerLimit={isGroupMode ? false : isAtListenerLimit}
            fontColorMode={fontColorMode}
            foreignLocationFormat={userPreferences.foreignLocationFormat}
            defaultCity={defaultCity}
            defaultCountry={defaultCountry}
            activeGroup={activeGroup ? {...} : undefined}
        />
    </HistoryFiltersProvider>
)}
```

### Target State

```tsx
{view === 'history' && (
    <HistoryFiltersProvider ...>
        <HistoryView {...historyViewProps} />
    </HistoryFiltersProvider>
)}
```

## Acceptance Criteria

1. **Given** HistoryView expects `historyTrans` prop
   **When** this story is completed
   **Then:**
   - Prop renamed to `transactions` in HistoryViewProps interface
   - All internal usages updated to use `transactions`
   - No runtime errors

2. **Given** HistoryView expects `hasMoreTransactions` and `loadingMoreTransactions`
   **When** this story is completed
   **Then:**
   - Props renamed to `hasMore` and `isLoadingMore`
   - Hook output matches view input

3. **Given** useHistoryViewProps is missing props
   **When** this story is completed
   **Then:**
   - Hook includes: `colorTheme`, `dateFormat`, `formatCurrency`, `formatDate`
   - Hook includes: `fontColorMode`, `foreignLocationFormat`, `defaultCity`, `defaultCountry`
   - Hook includes: `activeGroup`, `isAtListenerLimit`
   - Hook includes: `onEditTransaction`, `onLoadMoreTransactions`, `onTransactionsDeleted`

4. **Given** conditional logic exists in App.tsx for group mode
   **When** this story is completed
   **Then:**
   - `isGroupMode` check moved into hook
   - Hook receives `isGroupMode` as option
   - Conditional callbacks handled internally

5. **Given** App.tsx has ~43 lines for HistoryView rendering
   **When** this story is completed
   **Then:**
   - HistoryView renders with single spread: `{...historyViewProps}`
   - App.tsx reduced by ~35 lines
   - Tests pass

## Tasks / Subtasks

### Task 1: Update HistoryViewProps Interface

- [ ] 1.1 Open `src/views/HistoryView.tsx`
- [ ] 1.2 Rename `historyTrans` to `transactions` in interface
- [ ] 1.3 Rename `hasMoreTransactions` to `hasMore`
- [ ] 1.4 Rename `loadingMoreTransactions` to `isLoadingMore`
- [ ] 1.5 Update all internal usages of renamed props
- [ ] 1.6 Verify TypeScript compiles

### Task 2: Expand useHistoryViewProps Hook

- [ ] 2.1 Open `src/hooks/app/useHistoryViewProps.ts`
- [ ] 2.2 Add options interface for missing props:
  ```tsx
  colorTheme: 'normal' | 'professional' | 'mono';
  dateFormat: string;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string, format: string) => string;
  fontColorMode: 'colorful' | 'plain';
  foreignLocationFormat: 'code' | 'flag';
  defaultCity: string;
  defaultCountry: string;
  activeGroup: { id: string; memberProfiles?: Record<...> } | undefined;
  isAtListenerLimit: boolean;
  isGroupMode: boolean;
  loadMoreTransactions: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onTransactionsDeleted?: (ids: string[]) => void;
  ```
- [ ] 2.3 Update return type to include all props
- [ ] 2.4 Add conditional logic for `isGroupMode`:
  ```tsx
  onLoadMoreTransactions: options.isGroupMode ? () => {} : options.loadMoreTransactions,
  isAtListenerLimit: options.isGroupMode ? false : options.isAtListenerLimit,
  ```
- [ ] 2.5 Pass through all new props in return

### Task 3: Update App.tsx Integration

- [ ] 3.1 Update hook call to pass new options
- [ ] 3.2 Replace 43-line HistoryView with: `<HistoryView {...historyViewProps} />`
- [ ] 3.3 Remove all inline prop mapping
- [ ] 3.4 Verify HistoryFiltersProvider wrapper remains

### Task 4: Update Tests

- [ ] 4.1 Update `useHistoryViewProps.test.ts` for new options/outputs
- [ ] 4.2 Update any HistoryView tests using old prop names
- [ ] 4.3 Run full test suite
- [ ] 4.4 Verify no regressions

### Task 5: Verification

- [ ] 5.1 Manual smoke test: Navigate to History view
- [ ] 5.2 Verify filters work
- [ ] 5.3 Verify infinite scroll loads more
- [ ] 5.4 Verify edit transaction navigation
- [ ] 5.5 Count line reduction: `wc -l src/App.tsx`

## Dev Notes

### Estimation

- **Points:** 5 pts
- **Risk:** MEDIUM - Interface changes affect multiple consumers

### Dependencies

- **Requires:** Story 29 (hooks integrated) - DONE
- **Blocks:** Story 35 (final line count target)

### Breaking Change Mitigation

The prop renames are breaking changes. Since HistoryView is only used in App.tsx, this is safe. However, the old prop names should be completely removed (not kept as aliases) to avoid confusion.

### Hook Options Pattern

```tsx
export interface UseHistoryViewPropsOptions {
    // Core data
    transactions: Transaction[];
    transactionsWithRecentScans: Transaction[];

    // User info
    user: UserInfoForHistoryProps;
    appId: string;

    // UI settings
    theme: 'light' | 'dark';
    colorTheme: 'normal' | 'professional' | 'mono';
    currency: string;
    dateFormat: string;
    lang: Language;
    t: (key: string) => string;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;
    fontColorMode: 'colorful' | 'plain';
    foreignLocationFormat: 'code' | 'flag';

    // Location defaults
    defaultCity: string;
    defaultCountry: string;

    // Groups
    activeGroup?: { id: string; memberProfiles?: Record<string, any> };
    isGroupMode: boolean;

    // Pagination
    pagination: PaginationState;
    isAtListenerLimit: boolean;
    loadMoreTransactions: () => void;

    // Callbacks
    onEditTransaction: (tx: Transaction) => void;
    onTransactionsDeleted?: (ids: string[]) => void;

    // Filter state (for provider)
    pendingFilters: HistoryFilterState | null;
}
```

## References

- [Story 29 Feature Review](14c-refactor-29-app-prop-composition-integration.md) - Identified this work
- [Source: src/views/HistoryView.tsx] - View props interface
- [Source: src/hooks/app/useHistoryViewProps.ts] - Composition hook
- [Source: src/App.tsx:3695-3738] - Current rendering code

## File List

**Modified:**
- `src/views/HistoryView.tsx` - Rename props in interface + internal usages
- `src/hooks/app/useHistoryViewProps.ts` - Expand options and return type
- `src/App.tsx` - Replace inline props with spread
- `tests/unit/hooks/app/useHistoryViewProps.test.ts` - Update for new interface
