# Story 14e-6b: Scan Zustand Store Complete - Dialog/Save/Batch Actions

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Status:** ready-for-dev
**Created:** 2026-01-24
**Author:** Atlas Story Sizing Workflow
**Split From:** Story 14e-6 (exceeded sizing limits: 5 tasks, 47 subtasks)

---

## User Story

As a **developer**,
I want **the remaining Zustand store actions for dialogs, saves, batches, and control operations**,
So that **the scan store has complete feature parity with the existing useReducer state machine**.

---

## Context

### Split Rationale

The original Story 14e-6 had 47 subtasks. This story implements the second phase:
- **14e-6a**: Foundation + Core Actions (START_*, IMAGE_*, PROCESS_*) - COMPLETE
- **14e-6b** (this story): Remaining Actions (DIALOG_*, SAVE_*, BATCH_*, CONTROL)
- **14e-6c**: Selectors & Module Exports
- **14e-6d**: Comprehensive Tests & Verification

### Actions to Implement

From the existing `scanReducer`, this story implements:
- **DIALOG_***: SHOW_DIALOG, RESOLVE_DIALOG, DISMISS_DIALOG
- **RESULT_***: UPDATE_RESULT, SET_ACTIVE_RESULT
- **SAVE_***: SAVE_START, SAVE_SUCCESS, SAVE_ERROR
- **BATCH_***: BATCH_ITEM_START, BATCH_ITEM_SUCCESS, BATCH_ITEM_ERROR, BATCH_COMPLETE, SET_BATCH_RECEIPTS, UPDATE_BATCH_RECEIPT, DISCARD_BATCH_RECEIPT, CLEAR_BATCH_RECEIPTS, SET_BATCH_EDITING_INDEX
- **CONTROL**: CANCEL, RESET, RESTORE_STATE, REFUND_CREDIT

---

## Acceptance Criteria

### AC1: DIALOG_* Actions Implemented

**Given** the existing SHOW_DIALOG, RESOLVE_DIALOG, DISMISS_DIALOG handlers
**When** this story is completed
**Then:**
- [ ] `showDialog(dialog: DialogState)` action implemented
- [ ] `resolveDialog(value: unknown)` action implemented
- [ ] `dismissDialog()` action implemented
- [ ] Dialogs can be shown from any phase
- [ ] Actions use Zustand `set()` with action names for DevTools

### AC2: RESULT_* Actions Implemented with Guards

**Given** the existing UPDATE_RESULT, SET_ACTIVE_RESULT handlers
**When** this story is completed
**Then:**
- [ ] `updateResult(index: number, updates: Partial<Transaction>)` action implemented
- [ ] `setActiveResult(index: number | null)` action implemented
- [ ] UPDATE_RESULT blocked when `phase !== 'reviewing'`
- [ ] Actions preserve existing behavior from scanReducer

### AC3: SAVE_* Actions Implemented with Guards

**Given** the existing SAVE_START, SAVE_SUCCESS, SAVE_ERROR handlers
**When** this story is completed
**Then:**
- [ ] `saveStart()` action implemented
- [ ] `saveSuccess()` action implemented
- [ ] `saveError(error: string)` action implemented
- [ ] `saveStart()` blocked when `phase !== 'reviewing'`
- [ ] `saveSuccess/Error` blocked when `phase !== 'saving'`
- [ ] `saveSuccess` transitions to 'idle'
- [ ] `saveError` transitions back to 'reviewing'

### AC4: BATCH_* Actions Implemented with Guards

**Given** the existing batch processing action handlers
**When** this story is completed
**Then:**
- [ ] `batchItemStart(index: number)` action implemented
- [ ] `batchItemSuccess(index: number, result: Transaction)` action implemented
- [ ] `batchItemError(index: number, error: string)` action implemented
- [ ] `batchComplete()` action implemented
- [ ] `setBatchReceipts(receipts: BatchReceipt[])` action implemented
- [ ] `updateBatchReceipt(index: number, updates: Partial<BatchReceipt>)` action implemented
- [ ] `discardBatchReceipt(index: number)` action implemented
- [ ] `clearBatchReceipts()` action implemented
- [ ] `setBatchEditingIndex(index: number | null)` action implemented
- [ ] `batchComplete()` blocked when `phase !== 'scanning'` OR `mode !== 'batch'`

### AC5: Control Actions Implemented

**Given** the existing CANCEL, RESET, RESTORE_STATE, REFUND_CREDIT handlers
**When** this story is completed
**Then:**
- [ ] `cancel()` action implemented - blocked during 'saving' phase
- [ ] `reset()` action implemented - always allowed
- [ ] `restoreState(state: Partial<ScanState>)` action implemented
- [ ] `refundCredit()` action implemented
- [ ] `cancel()` blocked when `phase === 'saving'` (warning logged in DEV)
- [ ] `reset()` returns to `initialScanState`

---

## Tasks / Subtasks

- [ ] **Task 1: Implement DIALOG_* Actions**
  - [ ] Implement `showDialog()` action
  - [ ] Implement `resolveDialog()` action
  - [ ] Implement `dismissDialog()` action
  - [ ] Add action names for DevTools

- [ ] **Task 2: Implement RESULT_* and SAVE_* Actions**
  - [ ] Implement `updateResult()` with phase guard
  - [ ] Implement `setActiveResult()` action
  - [ ] Implement `saveStart()` with phase guard
  - [ ] Implement `saveSuccess()` with phase guard
  - [ ] Implement `saveError()` with phase guard

- [ ] **Task 3: Implement BATCH_* Actions**
  - [ ] Implement `batchItemStart()` action
  - [ ] Implement `batchItemSuccess()` action
  - [ ] Implement `batchItemError()` action
  - [ ] Implement `batchComplete()` with phase/mode guard
  - [ ] Implement `setBatchReceipts()` action
  - [ ] Implement `updateBatchReceipt()` action
  - [ ] Implement `discardBatchReceipt()` action
  - [ ] Implement `clearBatchReceipts()` action
  - [ ] Implement `setBatchEditingIndex()` action

- [ ] **Task 4: Implement Control Actions**
  - [ ] Implement `cancel()` with saving-phase guard
  - [ ] Implement `reset()` action
  - [ ] Implement `restoreState()` action
  - [ ] Implement `refundCredit()` action
  - [ ] Verify all action names in DevTools

---

## Dev Notes

### Phase Transition Matrix Reference

| Current | Action | Expected Result |
|---------|--------|-----------------|
| reviewing | saveStart | → saving |
| reviewing | cancel | → idle |
| saving | saveSuccess | → idle |
| saving | saveError | → reviewing |
| saving | cancel | BLOCKED |
| scanning (batch) | batchComplete | → reviewing |
| scanning (single) | batchComplete | BLOCKED |

### Credit Lifecycle

The `refundCredit()` action handles the credit refund when a scan is cancelled:
- Sets `creditStatus` to `'refunded'`
- Does NOT reset the entire state (use `cancel()` or `reset()` for that)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/features/scan/store/useScanStore.ts` | Add remaining actions |

---

## Definition of Done

- [ ] All DIALOG_* actions implemented (3 actions)
- [ ] All RESULT_* actions implemented (2 actions)
- [ ] All SAVE_* actions implemented (3 actions)
- [ ] All BATCH_* actions implemented (9 actions)
- [ ] All Control actions implemented (4 actions)
- [ ] Phase guards match existing reducer behavior
- [ ] Action names visible in Redux DevTools
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

---

## Dependencies

- **Depends on:** Story 14e-6a (Store Foundation) - must be complete
- **Blocks:** Story 14e-6c (Selectors), Story 14e-6d (Tests)

---

## References

- [Story 14e-6a](./14e-6a-scan-zustand-store-foundation.md) - Prerequisite
- [Original Story 14e-6](./14e-6-scan-zustand-store-definition.md) - Split source
- [Source: src/hooks/useScanStateMachine.ts] - Current reducer implementation
