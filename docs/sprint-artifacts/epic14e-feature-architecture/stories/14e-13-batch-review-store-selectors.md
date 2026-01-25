# Story 14e.13: Batch Review Store Selectors & Hooks

**Epic:** 14e - Feature-Based Architecture
**Points:** 2
**Status:** ready-for-dev
**Created:** 2026-01-25
**Author:** Atlas-Enhanced Create Story Workflow

---

## User Story

As a **developer**,
I want **typed selectors and hooks for the batch review Zustand store**,
So that **components have ergonomic access to batch review state with proper memoization and minimal re-renders**.

---

## Context

### Dependency Chain

This story creates the selector layer for the batch review Zustand store:

- **14e-12a**: Store foundation (types, lifecycle, item actions) - PREREQUISITE
- **14e-12b**: Save/edit actions, phase guards, tests - PREREQUISITE
- **14e-13** (this story): Selectors & module exports
- **14e-14**: Handlers (will consume these selectors)
- **14e-15**: Components (will consume these selectors)

### Pattern Reference

This story follows the same pattern established in **Story 14e-6c** (Scan Store Selectors):
- Phase and boolean selectors
- Computed selectors for derived values
- Action hook with stable references
- Direct access functions for non-React code
- Proper module exports

### Selectors to Create

Based on the store state from 14e-12a/b and the existing `useBatchReview` hook patterns:

**Phase Selectors:**
- `useBatchReviewPhase()` - current phase
- `useIsBatchReviewing()` - phase === 'reviewing'
- `useIsEditing()` - phase === 'editing'
- `useIsSaving()` - phase === 'saving'
- `useIsComplete()` - phase === 'complete'
- `useHasBatchError()` - phase === 'error'

**Data Selectors:**
- `useBatchItems()` - all items in queue
- `useCurrentBatchItem()` - item at currentIndex
- `useCurrentBatchIndex()` - currentIndex value
- `useEditingReceiptId()` - ID of receipt being edited

**Computed Selectors:**
- `useBatchProgress()` - { current, total, saved, failed }
- `useBatchTotalAmount()` - sum of all valid receipt totals
- `useValidBatchCount()` - count of non-error receipts
- `useIsBatchEmpty()` - items.length === 0

**Action Hook:**
- `useBatchReviewActions()` - all store actions with stable references

---

## Acceptance Criteria

### AC1: Phase Selectors Created

**Given** the store contains `phase` state
**When** this story is completed
**Then:**
- [ ] `useBatchReviewPhase()` returns current phase
- [ ] `useIsBatchReviewing()` returns `phase === 'reviewing'`
- [ ] `useIsEditing()` returns `phase === 'editing'`
- [ ] `useIsSaving()` returns `phase === 'saving'`
- [ ] `useIsComplete()` returns `phase === 'complete'`
- [ ] `useHasBatchError()` returns `phase === 'error'`
- [ ] Selectors only trigger re-renders when their specific value changes

### AC2: Data Selectors Created

**Given** the store contains items and index state
**When** this story is completed
**Then:**
- [ ] `useBatchItems()` returns `items` array
- [ ] `useCurrentBatchItem()` returns `items[currentIndex]` or undefined
- [ ] `useCurrentBatchIndex()` returns `currentIndex`
- [ ] `useEditingReceiptId()` returns `editingReceiptId`

### AC3: Computed Selectors Created

**Given** the need for derived values
**When** this story is completed
**Then:**
- [ ] `useBatchProgress()` returns `{ current: currentIndex, total: items.length, saved: savedCount, failed: failedCount }`
- [ ] `useBatchTotalAmount()` returns sum of `items[].transaction.total` (non-error only)
- [ ] `useValidBatchCount()` returns count of items where `status !== 'error'`
- [ ] `useIsBatchEmpty()` returns `items.length === 0`

### AC4: useBatchReviewActions Hook Created

**Given** all store actions need to be accessible
**When** this story is completed
**Then:**
- [ ] `useBatchReviewActions()` returns object with all action functions
- [ ] Actions include: loadBatch, reset, selectItem, updateItem, discardItem, startEditing, finishEditing, saveStart, saveItemSuccess, saveItemFailure, saveComplete
- [ ] Actions are stable references (same reference across re-renders)

### AC5: Direct Access Functions Exported

**Given** non-React code (handlers, services) needs store access
**When** this story is completed
**Then:**
- [ ] `getBatchReviewState()` exported - returns current state snapshot
- [ ] `batchReviewActions` object exported - contains all actions for non-React code
- [ ] Both work outside React component tree

### AC6: Module Exports Configured

**Given** the store, selectors, and actions
**When** this story is completed
**Then:**
- [ ] `src/features/batch-review/store/selectors.ts` created with all selectors
- [ ] `src/features/batch-review/store/index.ts` exports all selectors
- [ ] `src/features/batch-review/store/index.ts` exports useBatchReviewStore, useBatchReviewActions
- [ ] `src/features/batch-review/store/index.ts` exports getBatchReviewState, batchReviewActions
- [ ] `src/features/batch-review/index.ts` re-exports entire store module
- [ ] Import `{ useBatchReviewStore, useBatchReviewPhase } from '@features/batch-review'` works

### AC7: Unit Tests for Selectors

**Given** the need for test coverage
**When** running tests
**Then:**
- [ ] Tests verify each selector returns correct values
- [ ] Tests verify selectors are stable (same reference when state unchanged)
- [ ] Tests verify computed selectors update when dependencies change
- [ ] All tests pass: `npm run test`

---

## Tasks / Subtasks

- [ ] **Task 1: Create Selectors File** (AC: 1, 2)
  - [ ] 1.1 Create `src/features/batch-review/store/selectors.ts`
  - [ ] 1.2 Implement `useBatchReviewPhase()` selector
  - [ ] 1.3 Implement phase boolean selectors (reviewing, editing, saving, complete, error)
  - [ ] 1.4 Implement `useBatchItems()` selector
  - [ ] 1.5 Implement `useCurrentBatchItem()` selector
  - [ ] 1.6 Implement `useCurrentBatchIndex()` selector
  - [ ] 1.7 Implement `useEditingReceiptId()` selector

- [ ] **Task 2: Implement Computed Selectors** (AC: 3)
  - [ ] 2.1 Implement `useBatchProgress()` - derived from multiple state values
  - [ ] 2.2 Implement `useBatchTotalAmount()` - sum of non-error receipt totals
  - [ ] 2.3 Implement `useValidBatchCount()` - count of valid receipts
  - [ ] 2.4 Implement `useIsBatchEmpty()` - empty check

- [ ] **Task 3: Create Action Hook & Direct Access** (AC: 4, 5)
  - [ ] 3.1 Implement `useBatchReviewActions()` hook with stable references
  - [ ] 3.2 Implement `getBatchReviewState()` function
  - [ ] 3.3 Create `batchReviewActions` object for non-React access
  - [ ] 3.4 Verify stable references in tests

- [ ] **Task 4: Configure Module Exports** (AC: 6)
  - [ ] 4.1 Update `src/features/batch-review/store/index.ts` with all exports
  - [ ] 4.2 Update `src/features/batch-review/index.ts` to re-export store
  - [ ] 4.3 Verify imports work with `@features/batch-review` alias

- [ ] **Task 5: Write Unit Tests** (AC: 7)
  - [ ] 5.1 Create `tests/unit/features/batch-review/store/selectors.test.ts`
  - [ ] 5.2 Test phase selectors
  - [ ] 5.3 Test data selectors
  - [ ] 5.4 Test computed selectors
  - [ ] 5.5 Test action hook stability

---

## Dev Notes

### Selector Pattern (from ADR-018 & Story 14e-6c)

```typescript
// src/features/batch-review/store/selectors.ts

import { useBatchReviewStore } from './useBatchReviewStore';
import type { BatchReviewPhase, BatchReviewState } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Phase Selectors
// ═══════════════════════════════════════════════════════════════════════════

export const useBatchReviewPhase = () => useBatchReviewStore((s) => s.phase);
export const useIsBatchReviewing = () => useBatchReviewStore((s) => s.phase === 'reviewing');
export const useIsEditing = () => useBatchReviewStore((s) => s.phase === 'editing');
export const useIsSaving = () => useBatchReviewStore((s) => s.phase === 'saving');
export const useIsComplete = () => useBatchReviewStore((s) => s.phase === 'complete');
export const useHasBatchError = () => useBatchReviewStore((s) => s.phase === 'error');

// ═══════════════════════════════════════════════════════════════════════════
// Data Selectors
// ═══════════════════════════════════════════════════════════════════════════

export const useBatchItems = () => useBatchReviewStore((s) => s.items);
export const useCurrentBatchIndex = () => useBatchReviewStore((s) => s.currentIndex);
export const useEditingReceiptId = () => useBatchReviewStore((s) => s.editingReceiptId);

// Derived selector - gets current item or undefined
export const useCurrentBatchItem = () =>
  useBatchReviewStore((s) => s.items[s.currentIndex]);

// ═══════════════════════════════════════════════════════════════════════════
// Computed Selectors
// ═══════════════════════════════════════════════════════════════════════════

export const useBatchProgress = () =>
  useBatchReviewStore((s) => ({
    current: s.currentIndex,
    total: s.items.length,
    saved: s.savedCount,
    failed: s.failedCount,
  }));

export const useBatchTotalAmount = () =>
  useBatchReviewStore((s) =>
    s.items
      .filter((item) => item.status !== 'error')
      .reduce((sum, item) => sum + (item.transaction.total || 0), 0)
  );

export const useValidBatchCount = () =>
  useBatchReviewStore((s) =>
    s.items.filter((item) => item.status !== 'error').length
  );

export const useIsBatchEmpty = () => useBatchReviewStore((s) => s.items.length === 0);
```

### Action Hook Pattern

```typescript
// Stable actions hook - returns same reference across renders
export const useBatchReviewActions = () => {
  return useBatchReviewStore((state) => ({
    // Lifecycle
    loadBatch: state.loadBatch,
    reset: state.reset,
    // Item actions
    selectItem: state.selectItem,
    updateItem: state.updateItem,
    discardItem: state.discardItem,
    // Edit actions
    startEditing: state.startEditing,
    finishEditing: state.finishEditing,
    // Save actions
    saveStart: state.saveStart,
    saveItemSuccess: state.saveItemSuccess,
    saveItemFailure: state.saveItemFailure,
    saveComplete: state.saveComplete,
  }));
};

// Direct access for non-React code (handlers, services)
export const getBatchReviewState = () => useBatchReviewStore.getState();

export const batchReviewActions = {
  loadBatch: (receipts: BatchReceipt[]) =>
    useBatchReviewStore.getState().loadBatch(receipts),
  reset: () => useBatchReviewStore.getState().reset(),
  selectItem: (index: number) =>
    useBatchReviewStore.getState().selectItem(index),
  updateItem: (id: string, updates: Partial<BatchReceipt>) =>
    useBatchReviewStore.getState().updateItem(id, updates),
  discardItem: (id: string) =>
    useBatchReviewStore.getState().discardItem(id),
  startEditing: (id: string) =>
    useBatchReviewStore.getState().startEditing(id),
  finishEditing: () =>
    useBatchReviewStore.getState().finishEditing(),
  saveStart: () =>
    useBatchReviewStore.getState().saveStart(),
  saveItemSuccess: (id: string) =>
    useBatchReviewStore.getState().saveItemSuccess(id),
  saveItemFailure: (id: string, error: string) =>
    useBatchReviewStore.getState().saveItemFailure(id, error),
  saveComplete: () =>
    useBatchReviewStore.getState().saveComplete(),
};
```

### Module Exports Pattern

```typescript
// src/features/batch-review/store/index.ts
export { useBatchReviewStore } from './useBatchReviewStore';
export type { BatchReviewPhase, BatchReviewState, BatchReviewActions } from './types';
export * from './selectors';

// src/features/batch-review/index.ts
export * from './store';
// Future: export { BatchReviewFeature } from './BatchReviewFeature';
```

### Dependencies

- **Depends on:** Story 14e-12a (store foundation), Story 14e-12b (actions complete)
- **Blocks:** Story 14e-14 (handlers need selectors), Story 14e-15 (components need selectors)

### Project Structure

```
src/features/batch-review/
  store/
    types.ts                    # [14e-12a] Phase, State, Actions interfaces
    useBatchReviewStore.ts      # [14e-12a/b] Zustand store
    selectors.ts                # [THIS STORY] All selectors
    index.ts                    # [THIS STORY] Barrel export
  index.ts                      # [THIS STORY] Feature barrel export
```

---

## Atlas Workflow Analysis

### Affected Workflows

| Workflow | Impact | Details |
|----------|--------|---------|
| #3 Batch Processing | DIRECT | Selectors are primary interface for batch review state |
| #9 Scan Lifecycle | INDIRECT | Batch review is sub-phase of scan |

### Downstream Effects

- Story 14e-14: Will use `getBatchReviewState()` and `batchReviewActions` in handlers
- Story 14e-15: Will use selector hooks in components
- Story 14e-16: Will use `useBatchReviewPhase()` for conditional rendering

### No Workflow Conflicts

This is an additive story creating new selectors - no existing functionality affected.

---

## References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018] - Zustand pattern
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-6c-scan-zustand-selectors-exports.md] - Selector pattern reference
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-12a-batch-review-store-foundation.md] - Store types
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-12b-batch-review-store-actions-tests.md] - Actions reference
- [Source: src/hooks/useBatchReview.ts] - Current implementation patterns
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md] - Workflow #3, #9

---

## Definition of Done

- [ ] 14 selector hooks created and functional
- [ ] `useBatchReviewActions()` returns stable action references
- [ ] `getBatchReviewState()` and `batchReviewActions` work for non-React code
- [ ] All exports configured in index.ts files
- [ ] Import from `@features/batch-review` works
- [ ] Unit tests pass (~20-30 tests)
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
