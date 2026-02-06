# Story 14e.12b: Batch Review Store Save/Edit Actions & Tests

Status: done

## Story

As a **developer**,
I want **save actions, edit actions, phase guards, and comprehensive tests for the batch review store**,
So that **the batch review Zustand store is fully functional with proper state machine semantics**.

## Context

This is Part 2 of 2 for the Batch Review Zustand Store (split from 14e-12 due to sizing).

**Part 1 (14e-12a):** Store structure, types, lifecycle actions, item actions
**Part 2 (this story):** Save actions, edit actions, phase guards, comprehensive tests

### Prerequisites

Story 14e-12a must be completed first - this story extends that store with:
- Save operation actions (saveStart, saveItemSuccess, saveItemFailure, saveComplete)
- Edit mode actions (startEditing, finishEditing)
- Phase guards on all actions that require them
- Comprehensive test coverage including transition matrix

## Acceptance Criteria

### AC1: Save Actions
**Given** the batch review store from 14e-12a
**When** this story is completed
**Then** the store includes save actions:
- `saveStart()` - Transitions reviewing → saving
- `saveItemSuccess(id: string)` - Increments savedCount
- `saveItemFailure(id: string, error: string)` - Increments failedCount
- `saveComplete()` - Transitions saving → complete (if all saved) or stays in saving (if items remain)

### AC2: Edit Actions
**Given** the need to edit individual receipts
**When** reviewing the store actions
**Then:**
- `startEditing(id: string)` - Sets editingReceiptId and transitions reviewing → editing
- `finishEditing()` - Clears editingReceiptId and transitions editing → reviewing

### AC3: Phase Guards on Save Actions
**Given** the need to prevent invalid state transitions
**When** `saveStart()` is called from a phase other than `reviewing`
**Then:**
- Action returns early without state modification
- Console warns: `[BatchReviewStore] Cannot saveStart - invalid phase: {currentPhase}`

### AC4: Phase Guards on Edit Actions
**Given** the need for valid editing transitions
**When** `startEditing()` is called from a phase other than `reviewing`
**Then:**
- Action returns early without state modification
- Console warns: `[BatchReviewStore] Cannot startEditing - invalid phase: {currentPhase}`

**When** `finishEditing()` is called from a phase other than `editing`
**Then:**
- Action returns early without state modification
- Console warns: `[BatchReviewStore] Cannot finishEditing - invalid phase: {currentPhase}`

### AC5: Phase Guard on Discard During Save
**Given** the need to prevent modifications during save
**When** `discardItem()` is called while phase is `saving`
**Then:**
- Action returns early without state modification
- Console warns: `[BatchReviewStore] Cannot discardItem - save in progress`

### AC6: Comprehensive Test Coverage
**Given** the need for robust test coverage
**When** running the test suite
**Then** tests cover:

**Phase Transition Matrix:**
| Current Phase | Action | Expected Result |
|---------------|--------|-----------------|
| idle | loadBatch(receipts) | → reviewing |
| idle | saveStart() | BLOCKED |
| idle | startEditing(id) | BLOCKED |
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
| saving | saveItemFailure(id, err) | failedCount++ |
| saving | saveComplete() | → complete or error |
| saving | discardItem(id) | BLOCKED |
| complete | reset() | → idle |
| error | reset() | → idle |

**Edge Cases:**
- Empty batch handling
- Single item batch
- Rapid consecutive action calls
- Save complete with mixed success/failure

## Tasks / Subtasks

- [x] **Task 1: Implement save actions** (AC: 1)
  - [x] 1.1 Add `saveStart()` action with phase guard
  - [x] 1.2 Add `saveItemSuccess(id)` action
  - [x] 1.3 Add `saveItemFailure(id, error)` action
  - [x] 1.4 Add `saveComplete()` action with transition logic

- [x] **Task 2: Implement edit actions** (AC: 2)
  - [x] 2.1 Add `startEditing(id)` action with phase guard
  - [x] 2.2 Add `finishEditing()` action with phase guard

- [x] **Task 3: Add remaining phase guards** (AC: 3, 4, 5)
  - [x] 3.1 Add phase guard to `loadBatch()` - only from idle (already in 14e-12a)
  - [x] 3.2 Add phase guard to `discardItem()` - blocked during saving with specific message
  - [x] 3.3 Verify all guards log warnings with action name and current phase

- [x] **Task 4: Write comprehensive tests** (AC: 6)
  - [x] 4.1 Test all valid phase transitions from matrix
  - [x] 4.2 Test all BLOCKED transitions with warning verification
  - [x] 4.3 Test edge cases: empty batch, single item, rapid calls
  - [x] 4.4 Test save completion scenarios (all success, mixed, all fail)

## Dev Notes

### Save Action Implementation

```typescript
saveStart: () => {
  if (get().phase !== 'reviewing') {
    console.warn(`[BatchReviewStore] Cannot saveStart - invalid phase: ${get().phase}`);
    return;
  }
  set({ phase: 'saving' });
},

saveItemSuccess: (id) => {
  set((state) => ({ savedCount: state.savedCount + 1 }));
},

saveItemFailure: (id, error) => {
  set((state) => ({ failedCount: state.failedCount + 1 }));
},

saveComplete: () => {
  const { savedCount, failedCount, items } = get();
  const total = items.length;

  if (failedCount === total) {
    // All failed
    set({ phase: 'error', error: 'All items failed to save' });
  } else {
    // Some or all succeeded
    set({ phase: 'complete' });
  }
},
```

### Edit Action Implementation

```typescript
startEditing: (id) => {
  if (get().phase !== 'reviewing') {
    console.warn(`[BatchReviewStore] Cannot startEditing - invalid phase: ${get().phase}`);
    return;
  }
  set({ phase: 'editing', editingReceiptId: id });
},

finishEditing: () => {
  if (get().phase !== 'editing') {
    console.warn(`[BatchReviewStore] Cannot finishEditing - invalid phase: ${get().phase}`);
    return;
  }
  set({ phase: 'reviewing', editingReceiptId: null });
},
```

### Test Pattern for Phase Guards

```typescript
it('blocks saveStart when not in reviewing phase', () => {
  const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  // Store starts in idle
  useBatchReviewStore.getState().saveStart();

  expect(useBatchReviewStore.getState().phase).toBe('idle');
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('Cannot saveStart - invalid phase: idle')
  );

  consoleSpy.mockRestore();
});
```

### Dependencies

- **Depends on:** Story 14e-12a (store foundation must exist)
- **Blocks:** Story 14e-13 (selectors need complete store)
- **Blocks:** Story 14e-14 (handlers need complete store)

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-12a-batch-review-store-foundation.md]
- [Source: src/hooks/useBatchReview.ts - saveAll/saveOne logic to port]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - clean implementation

### Completion Notes List

- Implemented 6 new store actions: `saveStart`, `saveItemSuccess`, `saveItemFailure`, `saveComplete`, `startEditing`, `finishEditing`
- Added phase guards following Atlas-documented Zustand patterns with DEV-only console warnings
- Enhanced `discardItem` phase guard to show specific "save in progress" message (AC5)
- Added `startEditing` validation to verify receipt exists before transitioning
- Added 57 new tests covering: save actions, edit actions, phase transition matrix, edge cases
- Total store tests: 78 (21 from 14e-12a + 57 new)
- Full test suite passes: 5,517 tests (225 test files)
- All 6 Acceptance Criteria satisfied

### File List

**Modified:**
- `src/features/batch-review/store/types.ts` - Added save/edit action types to BatchReviewActions interface
- `src/features/batch-review/store/useBatchReviewStore.ts` - Implemented save/edit actions with phase guards
- `tests/unit/features/batch-review/store/useBatchReviewStore.test.ts` - Added 57 comprehensive tests
- `docs/sprint-artifacts/sprint-status.yaml` - Status updated to in-progress → review
