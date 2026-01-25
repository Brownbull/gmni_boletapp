# Story 14e.12: Batch Review Zustand Store Definition

Status: split

> **SPLIT 2026-01-25:** Exceeded sizing limits (7 tasks, 27 subtasks)
> Split into:
> - [14e-12a: Store Foundation](./14e-12a-batch-review-store-foundation.md) (2 pts)
> - [14e-12b: Actions & Tests](./14e-12b-batch-review-store-actions-tests.md) (2 pts)
>
> **Original estimate:** 3 pts → **Split total:** 4 pts

## Story

As a **developer**,
I want **a Zustand store defining the batch review flow**,
So that **batch review has centralized, predictable state management consistent with the scan store pattern**.

## Context

### Current Implementation Analysis

The batch review functionality is currently spread across:
- `src/hooks/useBatchReview.ts` (~430 lines) - Manages local state with optional ScanContext integration
- `src/contexts/ScanContext.tsx` - Owns `batchReceipts` state
- `src/types/batchReceipt.ts` - Type definitions

Key characteristics of current implementation:
- Dual-mode support (standalone for tests, context mode for production)
- Receipt statuses: `ready`, `review`, `edited`, `error`
- Computed values: `totalAmount`, `validCount`, `reviewCount`, `errorCount`
- Actions: `updateReceipt`, `discardReceipt`, `saveAll`, `saveOne`, `getReceipt`

### Migration Strategy

Per ADR-018 (Zustand-only state management), this store will:
1. Port existing hook logic to Zustand store actions
2. Add phase-based state machine semantics (same pattern as scan store)
3. Enable global access via store selectors
4. Maintain backwards compatibility during migration

## Acceptance Criteria

### AC1: Store Creation
**Given** the Zustand dependency installed (Story 14e-1)
**When** this story is completed
**Then** `src/features/batch-review/store/useBatchReviewStore.ts` is created with:
- TypeScript strict types for all state and actions
- DevTools middleware enabled (`{ name: 'batch-review-store' }`)
- Export from `src/features/batch-review/store/index.ts`

### AC2: Phase Definition
**Given** the need for explicit state machine semantics
**When** reviewing the store definition
**Then** the store defines typed phases:
```typescript
type BatchReviewPhase =
  | 'idle'       // No batch review active
  | 'loading'    // Transforming processing results to BatchReceipts
  | 'reviewing'  // User reviewing receipts (main phase)
  | 'editing'    // User editing a specific receipt
  | 'saving'     // Save operation in progress
  | 'complete'   // All receipts saved successfully
  | 'error';     // Fatal error (e.g., save failed for all)
```

### AC3: State Shape
**Given** the existing `useBatchReview` hook's state needs
**When** reviewing the store state
**Then** the store includes:
```typescript
interface BatchReviewState {
  // Phase tracking
  phase: BatchReviewPhase;

  // Receipt data
  items: BatchReceipt[];
  currentIndex: number;

  // Progress tracking
  savedCount: number;
  failedCount: number;

  // Error state
  error: string | null;

  // Editing context
  editingReceiptId: string | null;
}
```

### AC4: Actions Definition
**Given** the existing `useBatchReview` hook's actions
**When** reviewing the store actions
**Then** the store includes actions matching existing functionality:

**Lifecycle Actions:**
- `loadBatch(receipts: BatchReceipt[])` - Transition from idle → loading → reviewing
- `reset()` - Transition any → idle, clear all state

**Item Actions:**
- `selectItem(index: number)` - Set currentIndex
- `updateItem(id: string, updates: Partial<BatchReceipt>)` - Update receipt data
- `discardItem(id: string)` - Remove receipt from batch

**Save Actions:**
- `saveStart()` - Transition reviewing → saving
- `saveItemSuccess(id: string)` - Increment savedCount
- `saveItemFailure(id: string, error: string)` - Increment failedCount
- `saveComplete()` - Transition saving → complete (if all saved) or error (if some failed)

**Edit Actions:**
- `startEditing(id: string)` - Transition reviewing → editing
- `finishEditing()` - Transition editing → reviewing

### AC5: Phase Guards
**Given** the need to prevent invalid state transitions
**When** an action is called from an invalid phase
**Then** the action:
- Returns early without state modification
- Logs a warning: `[BatchReviewStore] Cannot {action} - invalid phase: {currentPhase}`

### AC6: Computed Getters
**Given** the need for derived state
**When** reviewing the store
**Then** computed values are calculated inline or via selector hooks:
- `validItems` - items.filter(i => i.status !== 'error')
- `totalAmount` - Sum of valid item totals
- `detectedCurrency` - Common currency if all same
- `isEmpty` - items.length === 0

### AC7: Unit Tests
**Given** the need for comprehensive test coverage
**When** running the test suite
**Then** tests cover:
1. **Initial state:** Store initializes in `idle` phase with empty items
2. **Valid transitions:** All valid phase transitions documented in matrix below
3. **Invalid transitions:** All invalid transitions blocked with warning
4. **Actions:** Each action modifies state correctly
5. **Edge cases:** Empty batch, single item, concurrent operations

**Phase Transition Matrix (minimum test coverage):**

| Current Phase | Action | Expected Result |
|---------------|--------|-----------------|
| idle | loadBatch(receipts) | → loading → reviewing |
| idle | saveStart() | BLOCKED |
| loading | (auto) | → reviewing |
| reviewing | selectItem(i) | currentIndex = i |
| reviewing | updateItem(id, data) | item updated |
| reviewing | discardItem(id) | item removed |
| reviewing | startEditing(id) | → editing |
| reviewing | saveStart() | → saving |
| reviewing | reset() | → idle |
| editing | finishEditing() | → reviewing |
| editing | updateItem(id, data) | item updated |
| editing | saveStart() | BLOCKED |
| saving | saveItemSuccess(id) | savedCount++ |
| saving | saveItemFailure(id) | failedCount++ |
| saving | saveComplete() | → complete or error |
| saving | discardItem(id) | BLOCKED |
| complete | reset() | → idle |
| error | reset() | → idle |

## Tasks / Subtasks

- [ ] **Task 1: Create store directory structure** (AC: 1)
  - [ ] 1.1 Create `src/features/batch-review/store/` directory
  - [ ] 1.2 Create `src/features/batch-review/store/types.ts` with phase and state types
  - [ ] 1.3 Create `src/features/batch-review/store/index.ts` barrel export

- [ ] **Task 2: Implement core store** (AC: 1, 2, 3, 4)
  - [ ] 2.1 Create `useBatchReviewStore.ts` with Zustand create()
  - [ ] 2.2 Add devtools middleware
  - [ ] 2.3 Define initial state (idle phase, empty items)
  - [ ] 2.4 Implement `loadBatch()` action
  - [ ] 2.5 Implement `reset()` action

- [ ] **Task 3: Implement item actions** (AC: 4)
  - [ ] 3.1 Implement `selectItem(index)` action
  - [ ] 3.2 Implement `updateItem(id, updates)` action
  - [ ] 3.3 Implement `discardItem(id)` action with phase guard

- [ ] **Task 4: Implement save actions** (AC: 4, 5)
  - [ ] 4.1 Implement `saveStart()` action with phase guard
  - [ ] 4.2 Implement `saveItemSuccess(id)` action
  - [ ] 4.3 Implement `saveItemFailure(id, error)` action
  - [ ] 4.4 Implement `saveComplete()` transition logic

- [ ] **Task 5: Implement edit actions** (AC: 4, 5)
  - [ ] 5.1 Implement `startEditing(id)` action with phase guard
  - [ ] 5.2 Implement `finishEditing()` action

- [ ] **Task 6: Add phase guards** (AC: 5)
  - [ ] 6.1 Add guard to `loadBatch()` - only from idle
  - [ ] 6.2 Add guard to `saveStart()` - only from reviewing
  - [ ] 6.3 Add guard to `startEditing()` - only from reviewing
  - [ ] 6.4 Add guard to `finishEditing()` - only from editing
  - [ ] 6.5 Add guard to `discardItem()` - not during saving

- [ ] **Task 7: Write unit tests** (AC: 7)
  - [ ] 7.1 Create `useBatchReviewStore.test.ts`
  - [ ] 7.2 Test initial state
  - [ ] 7.3 Test all valid phase transitions (matrix rows marked →)
  - [ ] 7.4 Test all invalid phase transitions (matrix rows marked BLOCKED)
  - [ ] 7.5 Test edge cases: empty batch, single item, rapid consecutive calls

## Dev Notes

### Architecture Pattern

Follow the same pattern established in Story 14e-6 for the scan store:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BatchReceipt } from '@/types/batchReceipt';

export const useBatchReviewStore = create<BatchReviewState & BatchReviewActions>()(
  devtools(
    (set, get) => ({
      // State
      phase: 'idle',
      items: [],
      currentIndex: 0,
      savedCount: 0,
      failedCount: 0,
      error: null,
      editingReceiptId: null,

      // Actions with phase guards
      loadBatch: (receipts) => {
        if (get().phase !== 'idle') {
          console.warn('[BatchReviewStore] Cannot loadBatch - not in idle phase');
          return;
        }
        set({ phase: 'loading', items: [] });
        // Transform and transition to reviewing
        set({
          phase: 'reviewing',
          items: receipts,
          currentIndex: 0,
          savedCount: 0,
          failedCount: 0,
          error: null,
        });
      },

      // ... other actions
    }),
    { name: 'batch-review-store' }
  )
);
```

### Integration Notes

This store will eventually replace the ScanContext's batch state:
- `ScanContext.state.batchReceipts` → `useBatchReviewStore.items`
- `ScanContext.updateBatchReceipt` → `useBatchReviewStore.updateItem`
- `ScanContext.discardBatchReceipt` → `useBatchReviewStore.discardItem`

Migration will happen in Story 14e-16 (Batch Review Feature Orchestrator).

### Existing Hook Compatibility

The existing `useBatchReview` hook (~45 tests) will continue to work:
- Story 14e-14 will extract handlers that use this store
- Story 14e-16 will wire everything together

### Project Structure Notes

- Path: `src/features/batch-review/store/useBatchReviewStore.ts`
- Exports from: `src/features/batch-review/store/index.ts`
- Path aliases: Use `@features/batch-review/store` after 14e-1 setup

### Atlas Workflow Chain Context

**Affected Workflows:**
- Workflow #3 (Batch Processing Flow) - Direct impact
- Workflow #9 (Scan Request Lifecycle) - Batch review is sub-phase
- Workflow #1 (Scan Receipt Flow) - Batch mode feeds into review

**Phase Alignment with Scan Lifecycle:**
| Scan Phase | Batch Review Phase |
|------------|-------------------|
| BATCH_REVIEWING | reviewing |
| BATCH_REVIEWING | editing |
| (handled by scan) | saving |

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#Zustand-Store-Pattern]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e.12]
- [Source: src/hooks/useBatchReview.ts - Current implementation]
- [Source: src/types/batchReceipt.ts - Type definitions]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md#Workflow-3]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
