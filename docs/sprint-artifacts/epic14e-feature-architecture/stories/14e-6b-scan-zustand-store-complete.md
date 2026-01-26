# Story 14e-6b: Scan Zustand Store Complete - Dialog/Save/Batch Actions

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Status:** done
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
- [x] `showDialog(dialog: DialogState)` action implemented
- [x] `resolveDialog(type: ScanDialogType, result: unknown)` action implemented
- [x] `dismissDialog()` action implemented
- [x] Dialogs can be shown from any phase
- [x] Actions use Zustand `set()` with action names for DevTools

### AC2: RESULT_* Actions Implemented with Guards

**Given** the existing UPDATE_RESULT, SET_ACTIVE_RESULT handlers
**When** this story is completed
**Then:**
- [x] `updateResult(index: number, updates: Partial<Transaction>)` action implemented
- [x] `setActiveResult(index: number)` action implemented
- [x] UPDATE_RESULT blocked when `phase !== 'reviewing'`
- [x] Actions preserve existing behavior from scanReducer

### AC3: SAVE_* Actions Implemented with Guards

**Given** the existing SAVE_START, SAVE_SUCCESS, SAVE_ERROR handlers
**When** this story is completed
**Then:**
- [x] `saveStart()` action implemented
- [x] `saveSuccess()` action implemented
- [x] `saveError(error: string)` action implemented
- [x] `saveStart()` blocked when `phase !== 'reviewing'`
- [x] `saveSuccess/Error` blocked when `phase !== 'saving'`
- [x] `saveSuccess` transitions to 'idle'
- [x] `saveError` transitions back to 'reviewing'

### AC4: BATCH_* Actions Implemented with Guards

**Given** the existing batch processing action handlers
**When** this story is completed
**Then:**
- [x] `batchItemStart(index: number)` action implemented
- [x] `batchItemSuccess(index: number, result: Transaction)` action implemented
- [x] `batchItemError(index: number, error: string)` action implemented
- [x] `batchComplete()` action implemented
- [x] `setBatchReceipts(receipts: BatchReceipt[])` action implemented
- [x] `updateBatchReceipt(index: number, updates: Partial<BatchReceipt>)` action implemented
- [x] `discardBatchReceipt(index: number)` action implemented
- [x] `clearBatchReceipts()` action implemented
- [x] `setBatchEditingIndex(index: number | null)` action implemented
- [x] `batchComplete()` blocked when `phase !== 'scanning'` OR `mode !== 'batch'`

### AC5: Control Actions Implemented

**Given** the existing CANCEL, RESET, RESTORE_STATE, REFUND_CREDIT handlers
**When** this story is completed
**Then:**
- [x] `cancel()` action implemented - blocked during 'saving' phase
- [x] `reset()` action implemented - always allowed
- [x] `restoreState(state: Partial<ScanState>)` action implemented
- [x] `refundCredit()` action implemented
- [x] `cancel()` blocked when `phase === 'saving'` (warning logged in DEV)
- [x] `reset()` returns to `initialScanState`

---

## Tasks / Subtasks

- [x] **Task 1: Implement DIALOG_* Actions**
  - [x] Implement `showDialog()` action
  - [x] Implement `resolveDialog()` action
  - [x] Implement `dismissDialog()` action
  - [x] Add action names for DevTools

- [x] **Task 2: Implement RESULT_* and SAVE_* Actions**
  - [x] Implement `updateResult()` with phase guard
  - [x] Implement `setActiveResult()` action
  - [x] Implement `saveStart()` with phase guard
  - [x] Implement `saveSuccess()` with phase guard
  - [x] Implement `saveError()` with phase guard

- [x] **Task 3: Implement BATCH_* Actions**
  - [x] Implement `batchItemStart()` action
  - [x] Implement `batchItemSuccess()` action
  - [x] Implement `batchItemError()` action
  - [x] Implement `batchComplete()` with phase/mode guard
  - [x] Implement `setBatchReceipts()` action
  - [x] Implement `updateBatchReceipt()` action
  - [x] Implement `discardBatchReceipt()` action
  - [x] Implement `clearBatchReceipts()` action
  - [x] Implement `setBatchEditingIndex()` action

- [x] **Task 4: Implement Control Actions**
  - [x] Implement `cancel()` with saving-phase guard
  - [x] Implement `reset()` action
  - [x] Implement `restoreState()` action
  - [x] Implement `refundCredit()` action
  - [x] Verify all action names in DevTools

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

- [x] All DIALOG_* actions implemented (3 actions)
- [x] All RESULT_* actions implemented (2 actions)
- [x] All SAVE_* actions implemented (3 actions)
- [x] All BATCH_* actions implemented (9 actions)
- [x] All Control actions implemented (4 actions)
- [x] Phase guards match existing reducer behavior
- [x] Action names visible in Redux DevTools
- [x] `npm run build` succeeds
- [ ] `npm run lint` passes (no lint script in project)

---

## Dependencies

- **Depends on:** Story 14e-6a (Store Foundation) - must be complete
- **Blocks:** Story 14e-6c (Selectors), Story 14e-6d (Tests)

---

## References

- [Story 14e-6a](./14e-6a-scan-zustand-store-foundation.md) - Prerequisite
- [Original Story 14e-6](./14e-6-scan-zustand-store-definition.md) - Split source
- [Source: src/hooks/useScanStateMachine.ts] - Current reducer implementation

---

## Dev Agent Record

### Implementation Plan

Implemented all remaining actions from the `scanReducer` in `useScanStateMachine.ts` as Zustand actions:

1. **DIALOG_* Actions** - 3 actions for dialog management
2. **RESULT_* Actions** - 2 actions for result manipulation with phase guards
3. **SAVE_* Actions** - 3 actions for save flow with phase guards
4. **BATCH_* Actions** - 9 actions for batch processing with phase/mode guards
5. **CONTROL Actions** - 4 actions for state control

### Completion Notes

- All 21 actions implemented matching existing reducer behavior exactly
- Phase guards implemented using the existing `_guardPhase` helper
- Action names follow `scan/{actionName}` convention for DevTools visibility
- `updateBatchReceipt` uses `id` parameter (string) to match existing reducer
- `discardBatchReceipt` uses `id` parameter (string) to match existing reducer
- `restoreState` includes special handling for interrupted 'scanning' phase
- Build passes with no TypeScript errors
- No lint script available in project (marked as N/A in DoD)

### File List

| File | Status | Notes |
|------|--------|-------|
| `src/features/scan/store/useScanStore.ts` | Modified | Added 21 new actions (~350 lines) |
| `docs/sprint-artifacts/sprint-status.yaml` | Modified | Story status: in-progress → review |

### Review Follow-ups (Archie)

- [ ] [Archie-Review][INHERITED] SET_STORE_TYPE and SET_CURRENCY actions missing from Zustand store - present in original reducer (useScanStateMachine.ts:232-250) but not in scope for 14e-6b. Should be tracked for 14e-6c selectors story or separate story.

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-24 | Atlas Story Sizing | Story created from split of 14e-6 |
| 2026-01-25 | Dev Agent (Opus 4.5) | Implemented all 21 actions, build passes |
| 2026-01-25 | Atlas Code Review | APPROVED - Fixed AC signatures (resolveDialog, setActiveResult). INHERITED issue tracked for 14e-6c |
