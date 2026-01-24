# Story 14c-refactor.30b: Expand useHistoryViewProps Hook

Status: done

> **Split from:** [14c-refactor-30-historyview-props-alignment.md](14c-refactor-30-historyview-props-alignment.md)
> **Split strategy:** by_phase (interface → hook → integration)
> **Split date:** 2026-01-23

## Story

As a **developer maintaining App.tsx**,
I want **useHistoryViewProps hook to return ALL props needed by HistoryView**,
So that **App.tsx can use direct spreading without any inline props**.

## Background

This is Phase 2 of the HistoryView props alignment work. After 30a renamed the interface props, this story expands the hook to include all missing props.

### Missing Props (from Story 30 analysis)

The hook currently doesn't include:
- `formatCurrency`, `formatDate`, `dateFormat`
- `colorTheme`, `fontColorMode`
- `foreignLocationFormat`, `defaultCity`, `defaultCountry`
- `activeGroup`, `isAtListenerLimit`
- `onEditTransaction`, `onLoadMoreTransactions`, `onTransactionsDeleted`

### Conditional Logic

App.tsx currently has inline conditional logic:
```tsx
onLoadMoreTransactions={isGroupMode ? () => {} : loadMoreTransactions}
isAtListenerLimit={isGroupMode ? false : isAtListenerLimit}
```

This logic should move into the hook.

## Acceptance Criteria

1. **Given** useHistoryViewProps is missing UI setting props
   **When** this story is completed
   **Then:**
   - Hook includes: `colorTheme`, `dateFormat`, `formatCurrency`, `formatDate`
   - Hook includes: `fontColorMode`, `foreignLocationFormat`, `defaultCity`, `defaultCountry`

2. **Given** useHistoryViewProps is missing group-related props
   **When** this story is completed
   **Then:**
   - Hook includes: `activeGroup`, `isAtListenerLimit`
   - Hook receives `isGroupMode` as option

3. **Given** useHistoryViewProps is missing callback props
   **When** this story is completed
   **Then:**
   - Hook includes: `onEditTransaction`, `onLoadMoreTransactions`, `onTransactionsDeleted`

4. **Given** conditional logic exists in App.tsx for group mode
   **When** this story is completed
   **Then:**
   - `isGroupMode` check moved into hook
   - Conditional callbacks handled internally

## Tasks / Subtasks

### Task 1: Expand Hook Options Interface

- [x] 1.1 Open `src/hooks/app/useHistoryViewProps.ts`
- [x] 1.2 Add UI settings to options interface:
  ```tsx
  colorTheme: 'normal' | 'professional' | 'mono';
  dateFormat: string;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string, format: string) => string;
  fontColorMode: 'colorful' | 'plain';
  foreignLocationFormat: 'code' | 'flag';
  defaultCity: string;
  defaultCountry: string;
  ```
- [x] 1.3 Add group-related options:
  ```tsx
  activeGroup: { id: string; memberProfiles?: Record<string, any> } | undefined;
  isGroupMode: boolean;
  isAtListenerLimit: boolean;
  ```
- [x] 1.4 Add callback options:
  ```tsx
  loadMoreTransactions: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onTransactionsDeleted?: (ids: string[]) => void;
  ```

### Task 2: Update Hook Return Type

- [x] 2.1 Add all new props to return type
- [x] 2.2 Add conditional logic for `isGroupMode`:
  ```tsx
  onLoadMoreTransactions: options.isGroupMode ? () => {} : options.loadMoreTransactions,
  isAtListenerLimit: options.isGroupMode ? false : options.isAtListenerLimit,
  ```
- [x] 2.3 Pass through all UI settings
- [x] 2.4 Pass through group and callback props

### Task 3: Update Hook Tests

- [x] 3.1 Update `useHistoryViewProps.test.ts` for new options
- [x] 3.2 Add test cases for conditional isGroupMode logic
- [x] 3.3 Verify all props are returned correctly
- [x] 3.4 Run test suite

## Dev Agent Record

### Implementation Plan

Expanded useHistoryViewProps hook to include ALL props needed by HistoryView:
1. Added 12 new options to UseHistoryViewPropsOptions interface
2. Added 12 new props to HistoryViewDataProps return type
3. Implemented conditional logic for isGroupMode (isAtListenerLimit, onLoadMoreTransactions)
4. Renamed output prop `transactionsWithRecentScans` to `allTransactions` to match HistoryView interface
5. Updated App.tsx to pass all new required options
6. Expanded test suite from 6 to 26 tests covering all new functionality

### Completion Notes

✅ **AC1 - UI Settings:** Hook includes colorTheme, dateFormat, formatCurrency, formatDate, fontColorMode, foreignLocationFormat, defaultCity, defaultCountry
✅ **AC2 - Group Props:** Hook includes activeGroup, isAtListenerLimit; receives isGroupMode as option
✅ **AC3 - Callbacks:** Hook includes onEditTransaction, onLoadMoreTransactions, onTransactionsDeleted
✅ **AC4 - Conditional Logic:** isGroupMode check moved into hook; conditional callbacks handled internally

**Tests:** 26 passing (expanded from 6)
**Pre-existing failures:** 6 DashboardView tests (tracked by story 14c-refactor-36)

## Dev Notes

### Estimation

- **Points:** 2 pts (was part of 5 pt story)
- **Risk:** LOW - Expanding existing hook

### Dependencies

- **Requires:** Story 30a (interface renamed) - Must be done first
- **Blocks:** Story 30c (integration)

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
}
```

### Cross-References

- **Parent story:** [14c-refactor-30](14c-refactor-30-historyview-props-alignment.md)
- **Prev:** [14c-refactor-30a](14c-refactor-30a-historyview-interface-rename.md) (interface rename)
- **Next:** [14c-refactor-30c](14c-refactor-30c-integration-verification.md) (integration)

## File List

**Modified:**
- `src/hooks/app/useHistoryViewProps.ts` - Expanded options interface (+12 options), return type (+12 props), conditional isGroupMode logic
- `src/App.tsx` - Updated useHistoryViewProps call with all new options, fixed allTransactions prop reference
- `tests/unit/hooks/app/useHistoryViewProps.test.ts` - Expanded from 6 to 26 tests covering all new functionality

## Code Review Fixes

### CRITICAL: Hooks Order Violation (Fixed)

**Issue:** Adding composition hooks AFTER early returns (`if (!user) return`) in App.tsx caused React hooks order violation error: "Rendered more hooks than during the previous render."

**Root Cause:**
- First render: `user=null` → early return → hooks NOT called
- Second render: `user` exists → no early return → hooks ARE called
- React sees different hook count → ERROR

**Fix:** Moved composition hooks AND their computed dependencies (`isGroupMode`, `activeTransactions`, etc.) to BEFORE the early returns. Added comments explaining the ordering requirement.

**Files Modified:**
- `src/App.tsx` - Reordered code: hooks before early returns

**Lesson Added to Atlas:** "Hooks before early returns" pattern in 06-lessons.md

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Story implementation complete - all ACs satisfied | Dev Agent |
| 2026-01-23 | CRITICAL BUG FIX: Moved composition hooks before early returns to fix hooks order violation | Code Review |
