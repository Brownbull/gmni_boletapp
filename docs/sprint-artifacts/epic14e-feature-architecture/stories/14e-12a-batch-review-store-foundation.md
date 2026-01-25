# Story 14e.12a: Batch Review Zustand Store Foundation

Status: ready-for-dev

## Story

As a **developer**,
I want **the Zustand store foundation for batch review with lifecycle and item actions**,
So that **batch review has centralized state management ready for save/edit actions in 14e-12b**.

## Context

This is Part 1 of 2 for the Batch Review Zustand Store (split from 14e-12 due to sizing).

**Part 1 (this story):** Store structure, types, lifecycle actions (loadBatch, reset), item actions
**Part 2 (14e-12b):** Save actions, edit actions, phase guards, comprehensive tests

### Current Implementation

The batch review functionality currently lives in:
- `src/hooks/useBatchReview.ts` (~430 lines)
- `src/types/batchReceipt.ts` - Type definitions

Per ADR-018, this will be migrated to a Zustand store following the same pattern as the scan store (Story 14e-6).

## Acceptance Criteria

### AC1: Store Directory Structure
**Given** Story 14e-1 completed (Zustand installed, directory structure exists)
**When** this story is completed
**Then:**
- `src/features/batch-review/store/` directory exists
- `src/features/batch-review/store/types.ts` contains phase and state type definitions
- `src/features/batch-review/store/useBatchReviewStore.ts` contains the Zustand store
- `src/features/batch-review/store/index.ts` exports store and types

### AC2: Phase Type Definition
**Given** the need for explicit state machine semantics
**When** reviewing `types.ts`
**Then** it defines:
```typescript
export type BatchReviewPhase =
  | 'idle'       // No batch review active
  | 'loading'    // Transforming processing results to BatchReceipts
  | 'reviewing'  // User reviewing receipts (main phase)
  | 'editing'    // User editing a specific receipt
  | 'saving'     // Save operation in progress
  | 'complete'   // All receipts saved successfully
  | 'error';     // Fatal error (e.g., save failed for all)
```

### AC3: State Interface
**Given** the existing `useBatchReview` hook's state needs
**When** reviewing `types.ts`
**Then** it defines:
```typescript
export interface BatchReviewState {
  phase: BatchReviewPhase;
  items: BatchReceipt[];
  currentIndex: number;
  savedCount: number;
  failedCount: number;
  error: string | null;
  editingReceiptId: string | null;
}
```

### AC4: Store Creation with DevTools
**Given** the Zustand dependency
**When** reviewing `useBatchReviewStore.ts`
**Then:**
- Store created with `create<BatchReviewState & BatchReviewActions>()`
- DevTools middleware enabled: `devtools(..., { name: 'batch-review-store' })`
- Initial state: `phase: 'idle'`, `items: []`, `currentIndex: 0`, counters at 0

### AC5: Lifecycle Actions
**Given** the need to start and reset batch review
**When** reviewing the store actions
**Then:**
- `loadBatch(receipts: BatchReceipt[])` - Sets items and transitions idle → reviewing
- `reset()` - Clears all state and returns to idle phase

### AC6: Item Actions
**Given** the need to navigate and modify receipts
**When** reviewing the store actions
**Then:**
- `selectItem(index: number)` - Sets currentIndex
- `updateItem(id: string, updates: Partial<BatchReceipt>)` - Updates receipt by ID
- `discardItem(id: string)` - Removes receipt from items array

### AC7: Basic Tests
**Given** the need to verify store functionality
**When** running tests
**Then** basic tests pass for:
- Initial state verification
- `loadBatch()` transitions to reviewing
- `reset()` returns to idle
- Item actions modify state correctly

## Tasks / Subtasks

- [ ] **Task 1: Create store directory and types** (AC: 1, 2, 3)
  - [ ] 1.1 Create `src/features/batch-review/store/` directory
  - [ ] 1.2 Create `types.ts` with `BatchReviewPhase` type
  - [ ] 1.3 Add `BatchReviewState` interface to `types.ts`
  - [ ] 1.4 Add `BatchReviewActions` interface to `types.ts` (lifecycle + item actions only)
  - [ ] 1.5 Create `index.ts` barrel export

- [ ] **Task 2: Implement Zustand store** (AC: 4, 5)
  - [ ] 2.1 Create `useBatchReviewStore.ts` with Zustand `create()`
  - [ ] 2.2 Add `devtools` middleware with name `'batch-review-store'`
  - [ ] 2.3 Define initial state (phase: 'idle', empty items, zero counters)
  - [ ] 2.4 Implement `loadBatch(receipts)` action
  - [ ] 2.5 Implement `reset()` action

- [ ] **Task 3: Implement item actions** (AC: 6)
  - [ ] 3.1 Implement `selectItem(index)` action
  - [ ] 3.2 Implement `updateItem(id, updates)` action
  - [ ] 3.3 Implement `discardItem(id)` action

- [ ] **Task 4: Write basic tests** (AC: 7)
  - [ ] 4.1 Create `useBatchReviewStore.test.ts`
  - [ ] 4.2 Test initial state
  - [ ] 4.3 Test `loadBatch()` and `reset()` lifecycle
  - [ ] 4.4 Test item actions (select, update, discard)

## Dev Notes

### Store Pattern (from ADR-018)

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { BatchReviewState, BatchReviewActions } from './types';

const initialState: BatchReviewState = {
  phase: 'idle',
  items: [],
  currentIndex: 0,
  savedCount: 0,
  failedCount: 0,
  error: null,
  editingReceiptId: null,
};

export const useBatchReviewStore = create<BatchReviewState & BatchReviewActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadBatch: (receipts) => {
        set({
          phase: 'reviewing',
          items: receipts,
          currentIndex: 0,
          savedCount: 0,
          failedCount: 0,
          error: null,
          editingReceiptId: null,
        });
      },

      reset: () => set(initialState),

      selectItem: (index) => set({ currentIndex: index }),

      updateItem: (id, updates) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      })),

      discardItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),

      // Save and edit actions will be added in 14e-12b
    }),
    { name: 'batch-review-store' }
  )
);
```

### Dependencies

- **Depends on:** Story 14e-1 (Zustand installed, directory structure)
- **Blocks:** Story 14e-12b (adds save/edit actions and tests)
- **Blocks:** Story 14e-13 (selectors depend on this store)

### Project Structure

```
src/features/batch-review/
  store/
    types.ts           # Phase, State, Actions interfaces
    useBatchReviewStore.ts  # Zustand store
    index.ts           # Barrel export
```

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018]
- [Source: src/hooks/useBatchReview.ts - Current implementation to migrate]
- [Source: src/types/batchReceipt.ts - BatchReceipt type definition]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
