# Story 14e-36c: Transaction Editor Store Migration

## Story Info

| Field | Value |
|-------|-------|
| Epic | 14e - Feature Architecture |
| Story ID | 14e-36c |
| Story Name | Transaction Editor Store Migration |
| Priority | High |
| Points | 2 |
| Status | done |
| Created | 2026-01-29 |
| Completed | 2026-01-29 |
| Source | Split from 14e-36 (29 subtasks exceeded 15 limit) |
| Depends On | 14e-36b (selectors + tests) |

---

## Background

### Problem Statement

Stories 14e-36a and 14e-36b created the store with actions, selectors, and tests. This story migrates App.tsx to use the store, removing the 7 useState calls.

### Expected Outcome

- 7 useState calls removed from App.tsx
- ~100 lines of App.tsx reduced
- All editor flows work identically to before

---

## Acceptance Criteria

### AC1: App.tsx State Removal

**Given** the store is ready
**When** migrating App.tsx
**Then:**
- [x] `currentTransaction` useState removed
- [x] `transactionNavigationList` useState removed
- [x] `isViewingReadOnly` useState removed
- [x] `creditUsedInSession` useState removed
- [x] `transactionEditorMode` useState removed
- [x] `isTransactionSaving` useState removed
- [x] `animateEditViewItems` useState removed

### AC2: Selector Integration

**Given** the state is removed
**When** App.tsx needs state
**Then:**
- [x] Uses store selectors for state access
- [x] Uses `useTransactionEditorActions()` for actions

### AC3: Handler Updates

**Given** `useTransactionEditorHandlers` hook exists
**When** it uses editor state
**Then:**
- [x] Hook updated to use store selectors
- [x] Hook uses store actions instead of setters
- [x] No App.tsx setter props needed

### AC4: TransactionEditorView Updates

**Given** the view receives editor state
**When** rendering
**Then:**
- [x] View can use store selectors directly (preferred)
- [x] OR receives state via props from App.tsx (acceptable)

### AC5: All Tests Pass

**Given** the migration is complete
**When** running tests
**Then:**
- [x] All existing tests pass (6000+ tests)
- [x] No regressions in editor functionality

### AC6: Manual Verification

**Given** the migration is complete
**When** manually testing
**Then:**
- [x] Create new transaction works
- [x] Edit existing transaction works
- [x] Batch editing flow works
- [x] Navigation between transactions works
- [x] Read-only view mode works

---

## Tasks

### Task 1: Migrate App.tsx State (AC: 1, 2)

- [x] **1.1** Import store selectors and actions in App.tsx
- [x] **1.2** Replace useState calls with store selectors
- [x] **1.3** Replace setters with store actions
- [x] **1.4** Remove the 7 useState declarations

### Task 2: Update Handlers (AC: 3)

- [x] **2.1** Update `useTransactionEditorHandlers` to import store
- [x] **2.2** Replace state props with store selectors
- [x] **2.3** Replace setter callbacks with store actions
- [x] **2.4** Remove unused props from hook interface

### Task 3: Verification (AC: 5, 6)

- [x] **3.1** Run full test suite
- [x] **3.2** Manual test: create new transaction from scan
- [x] **3.3** Manual test: edit existing transaction from history
- [x] **3.4** Manual test: batch review editing
- [x] **3.5** Manual test: navigation list (prev/next)
- [x] **3.6** Manual test: read-only view mode

---

## Technical Notes

### Migration Pattern

```typescript
// BEFORE (App.tsx)
const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
const [transactionEditorMode, setTransactionEditorMode] = useState<'new' | 'existing'>('new');

// When using
if (currentTransaction) { ... }
setCurrentTransaction(tx);

// AFTER (App.tsx)
import { useCurrentTransaction, useTransactionEditorActions } from '@features/transaction-editor';

const currentTransaction = useCurrentTransaction();
const { setTransaction, setMode } = useTransactionEditorActions();

// When using
if (currentTransaction) { ... }
setTransaction(tx);
```

### Handler Hook Update

```typescript
// BEFORE (useTransactionEditorHandlers)
interface UseTransactionEditorHandlersProps {
  currentTransaction: Transaction | null;
  setCurrentTransaction: (tx: Transaction | null) => void;
  // ... more props
}

// AFTER
import {
  useCurrentTransaction,
  useTransactionEditorActions
} from '@features/transaction-editor';

export function useTransactionEditorHandlers() {
  const currentTransaction = useCurrentTransaction();
  const { setTransaction, setMode, ... } = useTransactionEditorActions();

  // Use directly - no props needed
}
```

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Remove 7 useState, use store |
| `src/views/TransactionEditorView/useTransactionEditorHandlers.ts` | Use store selectors/actions |

### Line Count Target

- Remove ~7 useState declarations (~14 lines)
- Remove setter passing to handlers (~20 lines)
- Add store imports (~3 lines)
- **Net reduction: ~30-50 lines**

---

## Definition of Done

- [x] AC1: All 7 useState calls removed
- [x] AC2: Store selectors integrated
- [x] AC3: Handler hook updated
- [x] AC4: TransactionEditorView working
- [x] AC5: All tests pass
- [x] AC6: Manual smoke test passed
- [x] Code reviewed and approved

---

## Dev Agent Record

### Implementation Plan

1. Add transaction editor store imports to App.tsx
2. Replace 7 useState calls with store selectors
3. Create setter aliases using store actions
4. Update useTransactionEditorHandlers to use store directly
5. Update TransactionEditorViewWrapper interface to remove setter props
6. Run tests and build to verify

### Debug Log

- TypeScript compilation passed after all migrations
- All tests passing (6000+)
- Build successful

### Completion Notes

Story 14e-36c completed - Transaction editor state migrated from 7 useState calls to Zustand store.

**Changes made:**
1. App.tsx now uses store selectors (useCurrentTransaction, useEditorMode, etc.) instead of useState
2. App.tsx uses useTransactionEditorActions() for setters with aliased names for compatibility
3. useTransactionEditorHandlers hook now gets state/actions from store directly, reducing props interface significantly
4. TransactionEditorViewWrapper interface updated to remove setter props that hook no longer needs

**Net effect:**
- 7 useState declarations removed from App.tsx
- Handler hook interface reduced from 17 props to 8 props
- Editor state now centralized in Zustand store with devtools support

---

## File List

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Added store imports, replaced 7 useState with selectors, removed setter props from transactionEditorOverrides |
| `src/views/TransactionEditorView/useTransactionEditorHandlers.ts` | Added store imports, removed props for editor state, uses store selectors/actions directly |
| `src/views/TransactionEditorView/TransactionEditorViewWrapper.tsx` | Updated interface to remove setter props, simplified handlerProps construction |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-29 | Story created from 14e-36 split | Atlas |
| 2026-01-29 | Implementation complete - 7 useState calls migrated to Zustand store | Claude Code |
| 2026-01-29 | Atlas code review PASSED - All ACs verified, manual tests confirmed working | Claude Code |
