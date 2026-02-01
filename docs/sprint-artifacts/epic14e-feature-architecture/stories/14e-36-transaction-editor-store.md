# Story 14e-36: Create useTransactionEditorStore

## Story Info

| Field | Value |
|-------|-------|
| Epic | 14e - Feature Architecture |
| Story ID | 14e-36 |
| Story Name | Create useTransactionEditorStore |
| Priority | High |
| Points | 5 |
| Status | **split** |
| Created | 2026-01-29 |
| Source | Pre-dev epic review - state consolidation |
| Split Date | 2026-01-29 |
| Split Reason | 6 tasks + 29 subtasks exceeded sizing limits (max: 4 tasks, 15 subtasks) |

---

## Split Stories

This story was split into 3 smaller stories:

| Story | Name | Points | Focus |
|-------|------|--------|-------|
| [14e-36a](14e-36a-transaction-editor-store-foundation.md) | Store Foundation | 2 | Store structure + 9 actions |
| [14e-36b](14e-36b-transaction-editor-store-selectors.md) | Selectors + Tests | 2 | 10 selectors + 30+ tests |
| [14e-36c](14e-36c-transaction-editor-store-migration.md) | App.tsx Migration | 2 | Remove 7 useState + verification |

**Total: 6 pts** (was 5 pts - split revealed additional complexity)

**Dependency Chain:** 14e-36a → 14e-36b → 14e-36c

---

## Original Background (preserved for reference)

---

## Background

### Problem Statement

7 related useState calls for transaction editing are scattered in App.tsx. These are tightly coupled and should be managed together.

**Current state (App.tsx):**
```typescript
const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);     // line 521
const [transactionNavigationList, setTransactionNavigationList] = useState<string[] | null>(null); // line 523
const [isViewingReadOnly, setIsViewingReadOnly] = useState(false);                           // line 525
const [creditUsedInSession, setCreditUsedInSession] = useState(false);                       // line 527
const [transactionEditorMode, setTransactionEditorMode] = useState<'new' | 'existing'>('new'); // line 543
const [isTransactionSaving, setIsTransactionSaving] = useState(false);                       // line 541
const [animateEditViewItems, setAnimateEditViewItems] = useState(false);                     // line 542
```

### Impact

- State scattered across App.tsx
- No single source of truth for editor state
- Difficult to manage editor lifecycle
- ~100 lines of App.tsx could be removed

---

## Acceptance Criteria

### AC1: Store Structure

**Given** transaction editor state needs
**When** creating the store
**Then:**
- [ ] All 7 state variables consolidated
- [ ] Follows existing Zustand patterns (useScanStore, useBatchReviewStore)
- [ ] DevTools integration with action names

### AC2: Actions and Transitions

**Given** the store
**When** managing editor state
**Then:**
- [ ] `setTransaction(tx)` updates currentTransaction
- [ ] `setMode('new' | 'existing')` updates mode
- [ ] `setReadOnly(boolean)` updates viewing mode
- [ ] `setNavigationList(ids)` for multi-transaction browse
- [ ] `setSaving(boolean)` for save in progress
- [ ] `reset()` clears all state

### AC3: Typed Selectors

**Given** the store
**When** components need state
**Then:**
- [ ] `useCurrentTransaction()` selector
- [ ] `useEditorMode()` selector
- [ ] `useIsReadOnly()` selector
- [ ] `useTransactionEditorActions()` combined actions hook

### AC4: App.tsx Migration

**Given** the store exists
**When** App.tsx uses editor state
**Then:**
- [ ] useState calls removed
- [ ] Uses store selectors
- [ ] ~100 lines reduced

### AC5: Tests Pass

**Given** the migration
**When** running tests
**Then:**
- [ ] Store has comprehensive unit tests
- [ ] All existing tests pass
- [ ] Editor flows work correctly

---

## Tasks

### Task 1: Create Store Foundation (AC: 1)

- [ ] **1.1** Create `src/features/transaction-editor/store/` directory
- [ ] **1.2** Create `types.ts` with state and action interfaces
- [ ] **1.3** Create `useTransactionEditorStore.ts` with initial state
- [ ] **1.4** Add devtools middleware

### Task 2: Implement Actions (AC: 2)

- [ ] **2.1** Implement `setTransaction` action
- [ ] **2.2** Implement `clearTransaction` action
- [ ] **2.3** Implement `setMode` action
- [ ] **2.4** Implement `setReadOnly` action
- [ ] **2.5** Implement `setCreditUsed` action
- [ ] **2.6** Implement `setAnimateItems` action
- [ ] **2.7** Implement `setNavigationList` action
- [ ] **2.8** Implement `setSaving` action
- [ ] **2.9** Implement `reset` action

### Task 3: Create Selectors (AC: 3)

- [ ] **3.1** Create `selectors.ts`
- [ ] **3.2** Implement individual selectors
- [ ] **3.3** Implement combined `useTransactionEditorActions` hook
- [ ] **3.4** Export from index.ts

### Task 4: Write Tests (AC: 5)

- [ ] **4.1** Test initial state
- [ ] **4.2** Test each action
- [ ] **4.3** Test selectors
- [ ] **4.4** Test reset behavior

### Task 5: Migrate App.tsx (AC: 4)

- [ ] **5.1** Replace useState with store selectors
- [ ] **5.2** Replace setters with store actions
- [ ] **5.3** Update useTransactionEditorHandlers to use store
- [ ] **5.4** Remove old state variables

### Task 6: Verification (AC: 5)

- [ ] **6.1** Run full test suite
- [ ] **6.2** Manual test: create new transaction
- [ ] **6.3** Manual test: edit existing transaction
- [ ] **6.4** Manual test: batch editing flow

---

## Technical Notes

### Store Design

```typescript
// src/features/transaction-editor/store/types.ts
export interface TransactionEditorState {
  currentTransaction: Transaction | null;
  navigationList: string[] | null;
  mode: 'new' | 'existing';
  isReadOnly: boolean;
  creditUsedInSession: boolean;
  animateItems: boolean;
  isSaving: boolean;
}

export interface TransactionEditorActions {
  setTransaction: (tx: Transaction | null) => void;
  clearTransaction: () => void;
  setNavigationList: (ids: string[] | null) => void;
  setMode: (mode: 'new' | 'existing') => void;
  setReadOnly: (readOnly: boolean) => void;
  setCreditUsed: (used: boolean) => void;
  setAnimateItems: (animate: boolean) => void;
  setSaving: (saving: boolean) => void;
  reset: () => void;
}
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/transaction-editor/store/types.ts` | Type definitions |
| `src/features/transaction-editor/store/useTransactionEditorStore.ts` | Store implementation |
| `src/features/transaction-editor/store/selectors.ts` | Typed selectors |
| `src/features/transaction-editor/store/index.ts` | Exports |
| `tests/unit/features/transaction-editor/store/` | Tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Remove 7 useState, use store |
| `src/views/TransactionEditorView/` | Use store selectors |
| `src/hooks/app/useTransactionHandlers.ts` | Use store actions |

---

## Definition of Done

- [ ] AC1: Store structure complete
- [ ] AC2: All actions implemented
- [ ] AC3: Typed selectors working
- [ ] AC4: App.tsx migration complete
- [ ] AC5: All tests pass
- [ ] Code reviewed and approved
- [ ] Manual smoke test passed
