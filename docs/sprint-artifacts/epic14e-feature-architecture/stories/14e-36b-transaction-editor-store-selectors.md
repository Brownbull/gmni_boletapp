# Story 14e-36b: Transaction Editor Store Selectors + Tests

## Story Info

| Field | Value |
|-------|-------|
| Epic | 14e - Feature Architecture |
| Story ID | 14e-36b |
| Story Name | Transaction Editor Store Selectors + Tests |
| Priority | High |
| Points | 2 |
| Status | review |
| Created | 2026-01-29 |
| Source | Split from 14e-36 (29 subtasks exceeded 15 limit) |
| Depends On | 14e-36a (store foundation) |
| Enables | 14e-36c |

---

## Background

### Problem Statement

Story 14e-36a created the store and actions. This story adds typed selectors for component consumption and comprehensive unit tests.

### Pattern Reference

Follows established selector pattern from:
- `useScanStore` selectors (Story 14e-6c) - 14 memoized selectors
- `useBatchReviewStore` selectors (Story 14e-13) - 14 memoized selectors

---

## Acceptance Criteria

### AC1: Individual Selectors

**Given** the store from 14e-36a
**When** components need specific state
**Then:**
- [x] `useCurrentTransaction()` - returns currentTransaction
- [x] `useEditorMode()` - returns mode ('new' | 'existing')
- [x] `useIsReadOnly()` - returns isReadOnly boolean
- [x] `useIsSaving()` - returns isSaving boolean
- [x] `useAnimateItems()` - returns animateItems boolean
- [x] `useCreditUsedInSession()` - returns creditUsedInSession
- [x] `useNavigationList()` - returns navigationList

### AC2: Computed Selectors

**Given** the store state
**When** components need derived values
**Then:**
- [x] `useIsEditing()` - returns `currentTransaction !== null`
- [x] `useCanNavigate()` - returns `navigationList !== null && navigationList.length > 1`
- [x] `useHasUnsavedChanges()` - returns `currentTransaction !== null && !isSaving`

### AC3: Actions Hook

**Given** the store actions
**When** components need multiple actions
**Then:**
- [x] `useTransactionEditorActions()` returns all actions
- [x] Uses `useShallow` from zustand/react/shallow for stable references

### AC4: Direct Access

**Given** non-React code needs store access
**When** services or utilities need state
**Then:**
- [x] `getTransactionEditorState()` function for direct state access
- [x] `transactionEditorActions` object for direct action access

### AC5: Comprehensive Tests

**Given** the store implementation
**When** running tests
**Then:**
- [x] Initial state tests pass
- [x] All 9 action tests pass
- [x] All selector tests pass
- [x] Direct access tests pass
- [x] Edge case tests pass (reset, multiple updates)

---

## Tasks

### Task 1: Create Selectors (AC: 1, 2, 3)

- [x] **1.1** Create `selectors.ts` file
- [x] **1.2** Implement 7 individual state selectors
- [x] **1.3** Implement 3 computed selectors
- [x] **1.4** Implement `useTransactionEditorActions` with `useShallow`
- [x] **1.5** Export selectors from `selectors.ts`

### Task 2: Add Direct Access (AC: 4)

- [x] **2.1** Add `getTransactionEditorState()` function to store
- [x] **2.2** Export `transactionEditorActions` object
- [x] **2.3** Update `store/index.ts` exports

### Task 3: Write Tests (AC: 5)

- [x] **3.1** Create test file at `tests/unit/features/transaction-editor/store/`
- [x] **3.2** Test initial state values
- [x] **3.3** Test each of the 9 actions
- [x] **3.4** Test selector hooks return correct values
- [x] **3.5** Test computed selectors derive correctly
- [x] **3.6** Test `reset()` clears all state
- [x] **3.7** Test direct access functions
- [x] **3.8** Verify all tests pass

---

## Technical Notes

### Selector Pattern (from 14e-6c)

```typescript
// src/features/transaction-editor/store/selectors.ts
import { useShallow } from 'zustand/react/shallow';
import { useTransactionEditorStore } from './useTransactionEditorStore';

// Individual selectors
export const useCurrentTransaction = () =>
  useTransactionEditorStore((state) => state.currentTransaction);

export const useEditorMode = () =>
  useTransactionEditorStore((state) => state.mode);

export const useIsReadOnly = () =>
  useTransactionEditorStore((state) => state.isReadOnly);

// Computed selectors
export const useIsEditing = () =>
  useTransactionEditorStore((state) => state.currentTransaction !== null);

export const useCanNavigate = () =>
  useTransactionEditorStore((state) =>
    state.navigationList !== null && state.navigationList.length > 1
  );

// Actions hook with stable reference
export const useTransactionEditorActions = () =>
  useTransactionEditorStore(
    useShallow((state) => ({
      setTransaction: state.setTransaction,
      clearTransaction: state.clearTransaction,
      setMode: state.setMode,
      setReadOnly: state.setReadOnly,
      setCreditUsed: state.setCreditUsed,
      setAnimateItems: state.setAnimateItems,
      setNavigationList: state.setNavigationList,
      setSaving: state.setSaving,
      reset: state.reset,
    }))
  );
```

### Direct Access Pattern (from 14e-6c)

```typescript
// In useTransactionEditorStore.ts
export const getTransactionEditorState = () => useTransactionEditorStore.getState();

export const transactionEditorActions = {
  setTransaction: (tx: Transaction | null) =>
    useTransactionEditorStore.getState().setTransaction(tx),
  // ... all actions
};
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/transaction-editor/store/selectors.ts` | Typed selectors |
| `tests/unit/features/transaction-editor/store/useTransactionEditorStore.test.ts` | Unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/features/transaction-editor/store/useTransactionEditorStore.ts` | Add direct access |
| `src/features/transaction-editor/store/index.ts` | Export selectors |

---

## Definition of Done

- [x] AC1: 7 individual selectors working
- [x] AC2: 3 computed selectors working
- [x] AC3: Actions hook with useShallow
- [x] AC4: Direct access functions exported
- [x] AC5: All tests passing (target: 30+ tests) - **79 tests passing**
- [x] TypeScript compiles without errors
- [x] Ready for 14e-36c (App.tsx migration)

---

## File List

| File | Change |
|------|--------|
| `src/features/transaction-editor/store/selectors.ts` | **CREATED** - 10 selectors + actions hook + direct access |
| `src/features/transaction-editor/store/index.ts` | Modified - Export selectors |
| `src/features/transaction-editor/index.ts` | Modified - Export selectors from feature |
| `tests/unit/features/transaction-editor/store/useTransactionEditorStore.test.ts` | **CREATED** - 79 tests |
| `docs/sprint-artifacts/sprint-status.yaml` | Modified - Status: ready-for-dev → review |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-29 | Story implementation complete - 10 selectors, 79 tests |

---

## Dev Agent Record

### Implementation Plan

1. Create selectors.ts following established pattern from useBatchReviewStore
2. Implement 7 individual state selectors for component consumption
3. Implement 3 computed selectors for derived values
4. Implement useTransactionEditorActions hook with useShallow for stable references
5. Add direct access functions (getTransactionEditorState, transactionEditorActions)
6. Update barrel exports in store/index.ts and feature/index.ts
7. Write comprehensive unit tests covering all ACs

### Completion Notes

**Selectors Created:**
- 7 individual selectors: useCurrentTransaction, useEditorMode, useIsReadOnly, useIsSaving, useAnimateItems, useCreditUsedInSession, useNavigationList
- 3 computed selectors: useIsEditing, useCanNavigate, useHasUnsavedChanges
- 1 actions hook: useTransactionEditorActions (with useShallow for stable refs)
- Direct access: getTransactionEditorState(), transactionEditorActions object

**Tests:**
- 79 tests covering initial state, actions, selectors, direct access, edge cases, and module exports
- All tests pass

**Pattern Compliance:**
- Follows established pattern from src/features/batch-review/store/selectors.ts
- Uses useShallow for action hook stability
- Proper TypeScript typing throughout
