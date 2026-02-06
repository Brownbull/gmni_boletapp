# Story 14e-36a: Transaction Editor Store Foundation

## Story Info

| Field | Value |
|-------|-------|
| Epic | 14e - Feature Architecture |
| Story ID | 14e-36a |
| Story Name | Transaction Editor Store Foundation |
| Priority | High |
| Points | 2 |
| Status | review |
| Created | 2026-01-29 |
| Source | Split from 14e-36 (29 subtasks exceeded 15 limit) |
| Depends On | 14e-1 (directory structure) |
| Enables | 14e-36b, 14e-36c |

---

## Background

### Problem Statement

7 related useState calls for transaction editing are scattered in App.tsx. This story creates the Zustand store foundation and implements all actions.

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

### Pattern Reference

Follows established Zustand store pattern from:
- `useScanStore` (Story 14e-6a) - Store foundation
- `useBatchReviewStore` (Story 14e-12a) - Store foundation

---

## Acceptance Criteria

### AC1: Directory Structure

**Given** the transaction-editor feature directory
**When** creating the store
**Then:**
- [x] `src/features/transaction-editor/store/` directory created
- [x] Follows feature directory convention from 14e-1

### AC2: Type Definitions

**Given** the 7 state variables
**When** defining store types
**Then:**
- [x] `TransactionEditorState` interface matches all 7 variables
- [x] `TransactionEditorActions` interface defines all actions
- [x] Types exported from `types.ts`

### AC3: Store Implementation

**Given** the type definitions
**When** implementing the store
**Then:**
- [x] `useTransactionEditorStore` created with Zustand
- [x] Initial state matches current defaults
- [x] DevTools middleware with `transaction-editor` name
- [x] `enabled: import.meta.env.DEV` for DevTools

### AC4: Actions Implemented

**Given** the store
**When** managing editor state
**Then:**
- [x] `setTransaction(tx | null)` - sets currentTransaction
- [x] `clearTransaction()` - clears to null
- [x] `setMode('new' | 'existing')` - sets editor mode
- [x] `setReadOnly(boolean)` - sets viewing mode
- [x] `setCreditUsed(boolean)` - tracks credit usage in session
- [x] `setAnimateItems(boolean)` - controls item animation
- [x] `setNavigationList(ids | null)` - sets multi-transaction browse list
- [x] `setSaving(boolean)` - tracks save in progress
- [x] `reset()` - clears all state to initial

### AC5: Module Exports

**Given** the store implementation
**When** exporting
**Then:**
- [x] `store/index.ts` exports store, types, and actions
- [x] Feature `index.ts` re-exports store module

---

## Tasks

### Task 1: Create Store Structure (AC: 1, 2)

- [x] **1.1** Create `src/features/transaction-editor/store/` directory
- [x] **1.2** Create `types.ts` with `TransactionEditorState` interface
- [x] **1.3** Add `TransactionEditorActions` interface to types.ts
- [x] **1.4** Export types from `types.ts`

### Task 2: Implement Store and Actions (AC: 3, 4, 5)

- [x] **2.1** Create `useTransactionEditorStore.ts` with initial state
- [x] **2.2** Add devtools middleware (`transaction-editor`, DEV-only)
- [x] **2.3** Implement `setTransaction` action
- [x] **2.4** Implement `clearTransaction` action
- [x] **2.5** Implement `setMode` action
- [x] **2.6** Implement `setReadOnly` action
- [x] **2.7** Implement `setCreditUsed` action
- [x] **2.8** Implement `setAnimateItems` action
- [x] **2.9** Implement `setNavigationList` action
- [x] **2.10** Implement `setSaving` action
- [x] **2.11** Implement `reset` action
- [x] **2.12** Create `store/index.ts` with exports
- [x] **2.13** Update feature `index.ts` to re-export store

---

## Technical Notes

### Store Design

```typescript
// src/features/transaction-editor/store/types.ts
import type { Transaction } from '@/types';

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

### Initial State

```typescript
const initialState: TransactionEditorState = {
  currentTransaction: null,
  navigationList: null,
  mode: 'new',
  isReadOnly: false,
  creditUsedInSession: false,
  animateItems: false,
  isSaving: false,
};
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/transaction-editor/store/types.ts` | Type definitions |
| `src/features/transaction-editor/store/useTransactionEditorStore.ts` | Store implementation |
| `src/features/transaction-editor/store/index.ts` | Store barrel exports |

### Files to Modify

| File | Change |
|------|--------|
| `src/features/transaction-editor/index.ts` | Re-export store module |

---

## Definition of Done

- [x] AC1: Directory structure complete
- [x] AC2: Type definitions exported
- [x] AC3: Store with devtools working
- [x] AC4: All 9 actions implemented
- [x] AC5: Module exports working
- [x] TypeScript compiles without errors
- [x] Ready for 14e-36b (selectors + tests)

---

## Dev Agent Record

### Implementation Plan

1. Created `src/features/transaction-editor/store/` directory following established pattern
2. Implemented `types.ts` with `TransactionEditorState` and `TransactionEditorActions` interfaces
3. Created `useTransactionEditorStore.ts` with Zustand and devtools middleware
4. Implemented all 9 actions: `setTransaction`, `clearTransaction`, `setMode`, `setReadOnly`, `setCreditUsed`, `setAnimateItems`, `setNavigationList`, `setSaving`, `reset`
5. Created barrel exports in `store/index.ts` and feature `index.ts`

### Completion Notes

Story implemented following the established Zustand store pattern from `useBatchReviewStore` (Story 14e-12a). All 9 actions implemented with DevTools middleware enabled only in DEV mode. TypeScript compiles without errors. Test suite passes (5995 tests, 33 skipped).

### Code Review Notes (atlas-code-review 2026-01-29)

**Issues Found & Fixed:**
- 🔴 CRITICAL: Implementation files were untracked (`??` status) - fixed via `git add`
- 🟡 MEDIUM: Story file was untracked - fixed via `git add`
- 🟡 MEDIUM: Test count was outdated (347 → 5995) - updated above

**Atlas Validation:** ✅ PASSED
- Architecture compliance: Follows Zustand store pattern from 14e-6a/14e-12a
- Pattern compliance: DevTools DEV-only, action naming correct
- No workflow chain impacts

---

## File List

### Files Created

| File | Purpose |
|------|---------|
| `src/features/transaction-editor/store/types.ts` | Type definitions for state and actions |
| `src/features/transaction-editor/store/useTransactionEditorStore.ts` | Zustand store implementation |
| `src/features/transaction-editor/store/index.ts` | Store barrel exports |
| `src/features/transaction-editor/index.ts` | Feature barrel exports |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-29 | Story 14e-36a implementation complete - Transaction Editor Store Foundation |
