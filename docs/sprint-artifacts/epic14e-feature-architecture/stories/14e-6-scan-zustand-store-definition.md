# Story 14e-6: Scan Zustand Store Definition

**Epic:** 14e - Feature-Based Architecture
**Points:** 5 → 10 (split into 4 stories)
**Status:** split
**Created:** 2026-01-24
**Split:** 2026-01-24 via Atlas Story Sizing Workflow
**Author:** Atlas-Enhanced Create Story Workflow

---

## SPLIT NOTICE

This story was split on 2026-01-24 because it exceeded sizing guidelines:
- **5 tasks** (exceeds 4-task limit)
- **47 subtasks** (3.1× the 15-subtask limit)

### Split Stories

| Story | Focus | Points | Status |
|-------|-------|--------|--------|
| [14e-6a](./14e-6a-scan-zustand-store-foundation.md) | Store Foundation + Core Actions | 3 | ready-for-dev |
| [14e-6b](./14e-6b-scan-zustand-store-complete.md) | Remaining Actions (Dialog/Save/Batch) | 3 | ready-for-dev |
| [14e-6c](./14e-6c-scan-zustand-selectors-exports.md) | Selectors & Module Exports | 2 | ready-for-dev |
| [14e-6d](./14e-6d-scan-zustand-tests-verification.md) | Comprehensive Tests & Verification | 2 | ready-for-dev |

**Dependency Chain:** 14e-6a → 14e-6b → 14e-6c → 14e-6d

---

## Original Story (Preserved for Reference)

---

## User Story

As a **developer**,
I want **a Zustand store defining the scan flow states and actions**,
So that **the scan flow has centralized, global state management accessible from anywhere without prop drilling**.

---

## Context

### Current State

The scan flow is currently managed by:
- `src/hooks/useScanStateMachine.ts` - useReducer-based state machine (898 lines)
- `src/types/scanStateMachine.ts` - Type definitions (530 lines)
- `src/contexts/ScanContext.tsx` - React Context wrapper for state machine

**Problem:** The useReducer pattern requires React Context for global access, leading to:
1. Prop drilling through multiple component layers
2. Complex provider nesting in App.tsx
3. Difficulty opening scan dialogs from non-React code (services)
4. No DevTools support for debugging state transitions

### Target State

A Zustand store that:
1. **Maintains exact same state machine semantics** - same phases, guards, transitions
2. **Provides global access** without Context providers
3. **Enables DevTools debugging** for state transitions
4. **Allows non-React access** via `getState()` for services
5. **Prepares for Part 2** - ScanFeature extraction in Stories 14e-7 through 14e-11

### Migration Approach

**Port, don't rewrite.** The existing `scanReducer` is battle-tested (74+ tests from Story 14d.1). The migration strategy:

1. **Types:** Reuse existing `src/types/scanStateMachine.ts` - no changes needed
2. **State:** Same shape as existing `ScanState` interface
3. **Actions:** Convert reducer cases to Zustand actions (same logic)
4. **Guards:** Same phase transition guards (block invalid transitions)
5. **Computed:** Same memoized computed values as `computeValues()`

---

## Acceptance Criteria

### AC1: Zustand Store Created with Existing State Shape

**Given** the existing `ScanState` interface in `src/types/scanStateMachine.ts`
**When** this story is completed
**Then:**
- [ ] `src/features/scan/store/useScanStore.ts` created
- [ ] Store state matches existing `ScanState` interface exactly
- [ ] Initial state matches existing `initialScanState` from useScanStateMachine.ts
- [ ] Store uses existing types from `src/types/scanStateMachine.ts` (no duplication)

### AC2: All Actions Migrated from scanReducer

**Given** the existing `scanReducer` with 25+ action cases
**When** this story is completed
**Then:**
- [ ] All action types migrated to Zustand actions:
  - START_SINGLE, START_BATCH, START_STATEMENT
  - ADD_IMAGE, REMOVE_IMAGE, SET_IMAGES
  - SET_STORE_TYPE, SET_CURRENCY
  - PROCESS_START, PROCESS_SUCCESS, PROCESS_ERROR
  - SHOW_DIALOG, RESOLVE_DIALOG, DISMISS_DIALOG
  - UPDATE_RESULT, SET_ACTIVE_RESULT
  - SAVE_START, SAVE_SUCCESS, SAVE_ERROR
  - BATCH_ITEM_START, BATCH_ITEM_SUCCESS, BATCH_ITEM_ERROR, BATCH_COMPLETE
  - SET_BATCH_RECEIPTS, UPDATE_BATCH_RECEIPT, DISCARD_BATCH_RECEIPT, CLEAR_BATCH_RECEIPTS
  - SET_BATCH_EDITING_INDEX
  - CANCEL, RESET, RESTORE_STATE, REFUND_CREDIT
- [ ] Action implementations copied from existing reducer (same logic)
- [ ] All actions use Zustand `set()` with action names for DevTools

### AC3: Phase Guards Prevent Invalid Transitions

**Given** the existing phase transition guards in scanReducer
**When** this story is completed
**Then:**
- [ ] Phase guards block invalid transitions exactly as current reducer does
- [ ] Invalid transitions log warnings in DEV mode (same behavior)
- [ ] Guards return current state unchanged (immutable pattern)
- [ ] Examples:
  - `startSingle()` blocked when `phase !== 'idle'`
  - `addImage()` blocked when `phase !== 'capturing'`
  - `processStart()` blocked when `phase !== 'capturing'` OR `images.length === 0`
  - `batchComplete()` blocked when `phase !== 'scanning'` OR `mode !== 'batch'`

### AC4: DevTools Middleware Enabled

**Given** Zustand devtools middleware
**When** this story is completed
**Then:**
- [ ] Store wrapped with `devtools()` middleware
- [ ] Store name set to `'scan-store'`
- [ ] All actions have descriptive names (e.g., `scan/startSingle`, `scan/processSuccess`)
- [ ] State transitions visible in Redux DevTools browser extension

### AC5: Computed Values/Selectors Created

**Given** the existing `computeValues()` function that calculates derived state
**When** this story is completed
**Then:**
- [ ] Selector hooks created for all computed values:
  - `useScanPhase()` - current phase
  - `useScanMode()` - current mode (single/batch/statement)
  - `useHasActiveRequest()` - true if phase !== 'idle'
  - `useIsProcessing()` - true if scanning or saving
  - `useIsIdle()` - true if idle
  - `useHasError()` - true if error phase
  - `useHasDialog()` - true if activeDialog !== null
  - `useIsBlocking()` - hasActiveRequest AND hasDialog
  - `useCreditSpent()` - creditStatus === 'confirmed'
  - `useCanNavigateFreely()` - derived from phase and dialog state
  - `useCanSave()` - reviewing phase with valid results
  - `useCurrentView()` - derived view name for routing
  - `useImageCount()` - images.length
  - `useResultCount()` - results.length
- [ ] Selectors are properly memoized (no unnecessary re-renders)

### AC6: Action Creators Exported

**Given** the existing `createScanActions()` convenience function
**When** this story is completed
**Then:**
- [ ] `useScanActions()` hook returns all actions:
  - startSingle, startBatch, startStatement
  - addImage, removeImage, setImages
  - setStoreType, setCurrency
  - processStart, processSuccess, processError
  - showDialog, resolveDialog, dismissDialog
  - updateResult, setActiveResult
  - saveStart, saveSuccess, saveError
  - batchItemStart, batchItemSuccess, batchItemError, batchComplete
  - setBatchReceipts, updateBatchReceipt, discardBatchReceipt, clearBatchReceipts
  - setBatchEditingIndex
  - cancel, reset, restoreState, refundCredit
- [ ] Actions are stable references (use Zustand getState pattern)
- [ ] Direct access functions exported: `getScanState()`, `scanActions` (for non-React code)

### AC7: Comprehensive Unit Tests

**Given** the existing 74+ tests for useScanStateMachine
**When** this story is completed
**Then:**
- [ ] Unit tests at `src/features/scan/store/__tests__/useScanStore.test.ts`
- [ ] Test coverage for ALL valid phase transitions:
  - idle → capturing (via startSingle/startBatch/startStatement)
  - capturing → scanning (via processStart)
  - scanning → reviewing (via processSuccess/batchComplete)
  - scanning → error (via processError)
  - reviewing → saving (via saveStart)
  - saving → idle (via saveSuccess)
  - saving → reviewing (via saveError)
  - any → idle (via cancel/reset)
- [ ] Test coverage for ALL invalid phase transition attempts (guards block)
- [ ] Test edge cases: rapid consecutive calls, reset during operation
- [ ] Test DevTools action naming
- [ ] All tests pass

### AC8: Module Exports Configured

**Given** the store and selectors
**When** this story is completed
**Then:**
- [ ] `src/features/scan/store/index.ts` exports:
  - `useScanStore` - main store hook
  - All selector hooks
  - `useScanActions` - action creators hook
  - `getScanState` - direct state access
  - `scanActions` - direct actions for non-React code
- [ ] `src/features/scan/index.ts` re-exports store module
- [ ] Import `{ useScanStore } from '@features/scan'` works

---

## Technical Implementation

### File Structure

```
src/features/scan/
├── store/
│   ├── useScanStore.ts       # Zustand store definition
│   ├── selectors.ts          # Memoized selector hooks
│   ├── index.ts              # Store module exports
│   └── __tests__/
│       └── useScanStore.test.ts
└── index.ts                  # Feature module exports
```

### Store Implementation Pattern

```typescript
// src/features/scan/store/useScanStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ScanState,
  ScanPhase,
  ScanMode,
  ScanDialogType,
  DialogState,
  BatchReceipt,
  CreditType,
} from '@/types/scanStateMachine';
import { generateRequestId } from '@/types/scanStateMachine';
import type { Transaction } from '@/types/transaction';

// =============================================================================
// Initial State (from existing useScanStateMachine.ts)
// =============================================================================

export const initialScanState: ScanState = {
  // Core state
  phase: 'idle',
  mode: 'single',
  // ... (copy from existing initialScanState)
};

// =============================================================================
// Store Actions Interface
// =============================================================================

interface ScanActions {
  // Start actions
  startSingle: (userId: string) => void;
  startBatch: (userId: string) => void;
  startStatement: (userId: string) => void;

  // Image actions
  addImage: (image: string) => void;
  removeImage: (index: number) => void;
  setImages: (images: string[]) => void;

  // ... (all other actions)

  // Control actions
  cancel: () => void;
  reset: () => void;
}

// =============================================================================
// Store Definition
// =============================================================================

export const useScanStore = create<ScanState & ScanActions>()(
  devtools(
    (set, get) => ({
      ...initialScanState,

      startSingle: (userId: string) => {
        const state = get();
        // Phase guard - same as existing reducer
        if (state.phase !== 'idle') {
          if (import.meta.env.DEV) {
            console.warn('[ScanStore] Cannot start new scan - request in progress');
          }
          return;
        }
        set(
          {
            ...initialScanState,
            phase: 'capturing',
            mode: 'single',
            requestId: generateRequestId(),
            userId,
            startedAt: Date.now(),
          },
          false,
          'scan/startSingle'
        );
      },

      // ... (implement all other actions with same guard logic)
    }),
    { name: 'scan-store' }
  )
);
```

### Selector Pattern

```typescript
// src/features/scan/store/selectors.ts

import { useScanStore } from './useScanStore';
import { canSaveTransaction } from '@/types/scanStateMachine';

// Phase selectors
export const useScanPhase = () => useScanStore((s) => s.phase);
export const useScanMode = () => useScanStore((s) => s.mode);

// Computed boolean selectors
export const useHasActiveRequest = () => useScanStore((s) => s.phase !== 'idle');
export const useIsProcessing = () =>
  useScanStore((s) => s.phase === 'scanning' || s.phase === 'saving');
export const useIsIdle = () => useScanStore((s) => s.phase === 'idle');

// Complex computed selectors
export const useCanSave = () =>
  useScanStore((s) =>
    s.phase === 'reviewing' &&
    s.results.length > 0 &&
    s.results.some(canSaveTransaction) &&
    s.activeDialog === null
  );
```

---

## Tasks / Subtasks

- [ ] **Task 1: Create Store File Structure (AC: #1, #8)**
  - [ ] Create `src/features/scan/store/` directory
  - [ ] Create `src/features/scan/store/useScanStore.ts`
  - [ ] Create `src/features/scan/store/selectors.ts`
  - [ ] Create `src/features/scan/store/index.ts`
  - [ ] Update `src/features/scan/index.ts` to export store

- [ ] **Task 2: Implement Zustand Store (AC: #1, #2, #3, #4)**
  - [ ] Copy `initialScanState` from existing hook
  - [ ] Import types from `src/types/scanStateMachine.ts` (no duplication)
  - [ ] Implement all START_* actions with phase guards
  - [ ] Implement all IMAGE_* actions with phase guards
  - [ ] Implement all PROCESS_* actions with phase guards
  - [ ] Implement all DIALOG_* actions
  - [ ] Implement all RESULT_* actions with phase guards
  - [ ] Implement all SAVE_* actions with phase guards
  - [ ] Implement all BATCH_* actions with phase guards
  - [ ] Implement CANCEL, RESET, RESTORE_STATE, REFUND_CREDIT
  - [ ] Wrap with devtools middleware
  - [ ] Add action names for DevTools visibility

- [ ] **Task 3: Create Selector Hooks (AC: #5, #6)**
  - [ ] Create `useScanPhase()` selector
  - [ ] Create `useScanMode()` selector
  - [ ] Create `useHasActiveRequest()` computed selector
  - [ ] Create `useIsProcessing()` computed selector
  - [ ] Create `useIsIdle()` computed selector
  - [ ] Create `useHasError()` computed selector
  - [ ] Create `useHasDialog()` computed selector
  - [ ] Create `useIsBlocking()` computed selector
  - [ ] Create `useCreditSpent()` computed selector
  - [ ] Create `useCanNavigateFreely()` computed selector
  - [ ] Create `useCanSave()` computed selector
  - [ ] Create `useCurrentView()` computed selector
  - [ ] Create `useImageCount()` selector
  - [ ] Create `useResultCount()` selector
  - [ ] Create `useScanActions()` hook returning all actions
  - [ ] Create `getScanState()` for direct access
  - [ ] Create `scanActions` object for non-React code

- [ ] **Task 4: Write Comprehensive Tests (AC: #7)**
  - [ ] Create test file at `src/features/scan/store/__tests__/useScanStore.test.ts`
  - [ ] Test all valid phase transitions (matrix coverage)
  - [ ] Test all invalid phase transition guards
  - [ ] Test phase guard logging in DEV mode
  - [ ] Test edge cases (rapid calls, reset during operation)
  - [ ] Test selector return values
  - [ ] Test action names for DevTools
  - [ ] Verify all tests pass with `npm run test`

- [ ] **Task 5: Verification**
  - [ ] `npm run build` succeeds
  - [ ] `npm run test` passes (including new tests)
  - [ ] `npm run lint` passes
  - [ ] Import from `@features/scan` works
  - [ ] DevTools shows action names correctly

---

## Dev Notes

### Key Migration Decisions

1. **Reuse existing types:** Import from `src/types/scanStateMachine.ts` - don't duplicate
2. **Same guard logic:** Copy guard conditions exactly from `scanReducer`
3. **Same computed logic:** Copy from `computeValues()` function
4. **DevTools naming:** Use `scan/actionName` pattern for clarity

### Phase Transition Matrix (Test Reference)

| Current | Action | Expected Result |
|---------|--------|-----------------|
| idle | startSingle | → capturing |
| idle | startBatch | → capturing (with batchProgress) |
| idle | processStart | BLOCKED |
| capturing | addImage | → capturing (images updated) |
| capturing | processStart | → scanning |
| capturing | startSingle | BLOCKED |
| scanning | processSuccess | → reviewing |
| scanning | processError | → error |
| scanning | startBatch | BLOCKED |
| reviewing | saveStart | → saving |
| reviewing | cancel | → idle |
| saving | saveSuccess | → idle |
| saving | saveError | → reviewing |
| saving | cancel | BLOCKED |
| error | reset | → idle |

### Existing Test Reference

The existing `useScanStateMachine` has 74+ tests in:
- `src/hooks/__tests__/useScanStateMachine.test.ts`

Use these as reference for comprehensive coverage. The new Zustand store tests should cover the same scenarios.

### Integration Notes (Future Stories)

**Story 14e-7 (Selectors):** This story already creates basic selectors. Story 14e-7 may expand with more complex selectors if needed.

**Story 14e-8 (processScan):** Will use `useScanActions()` to dispatch state changes.

**Story 14e-11 (Cleanup):** Will delete `useScanStateMachine.ts` and `ScanContext.tsx` after migration verified.

---

## Atlas Workflow Analysis

### Affected Workflows

| Workflow | Impact | Risk | Details |
|----------|--------|------|---------|
| **Scan Receipt Flow (#1)** | CRITICAL | HIGH | Core scan state machine being migrated |
| **Quick Save Flow (#2)** | HIGH | MEDIUM | Uses scan state for confidence checks |
| **Batch Processing Flow (#3)** | HIGH | MEDIUM | Batch mode entirely in scan store |
| **Scan Request Lifecycle (#9)** | CRITICAL | HIGH | This IS the lifecycle being refactored |
| Trust Merchant Flow (#8) | MEDIUM | LOW | Uses scan results for prompts |

### Workflow Touchpoints

This story creates the **foundation** for all scan-related workflows. The existing workflows continue working via the current `ScanContext` until Story 14e-11 completes the migration.

**Critical Path:** Auth → Scan → Save
- Store must maintain request precedence rule (active request blocks new)
- Store must track credit lifecycle (none → reserved → confirmed/refunded)
- Store must support persistence for interrupted scans

### Risk Mitigation

1. **No breaking changes yet:** ScanContext continues to work until Story 14e-11
2. **Same semantics:** Store implements exact same behavior as current reducer
3. **Comprehensive tests:** Test matrix covers all transitions before integration
4. **Incremental rollout:** Story 14e-7-11 gradually migrate consumers

---

## Files to Create

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/features/scan/store/useScanStore.ts` | Zustand store with all actions | ~500 |
| `src/features/scan/store/selectors.ts` | Computed selector hooks | ~100 |
| `src/features/scan/store/index.ts` | Module exports | ~30 |
| `src/features/scan/store/__tests__/useScanStore.test.ts` | Comprehensive tests | ~400 |

## Files to Modify

| File | Change |
|------|--------|
| `src/features/scan/index.ts` | Add store re-exports |

---

## Definition of Done

- [ ] `src/features/scan/store/useScanStore.ts` created with all 25+ actions
- [ ] All phase guards implemented matching existing reducer behavior
- [ ] DevTools middleware enabled with descriptive action names
- [ ] 14 selector hooks created for computed values
- [ ] Comprehensive unit tests covering all transitions and guards
- [ ] All tests pass
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Import from `@features/scan` works correctly

---

## Dependencies

- **Depends on:** Story 14e-1 (Directory Structure & Zustand Setup) - must be complete
- **Blocks:** Story 14e-8 (processScan extraction)
- **Note:** Story 14e-7 (Selectors & Hooks) was consolidated into Story 14e-6c during split

---

## References

- [Architecture Decision](../architecture-decision.md) - ADR-018: Zustand-only state management
- [Epic 14e Overview](../epics.md) - Story 14e.6 definition
- [Source: src/hooks/useScanStateMachine.ts] - Current reducer implementation (898 lines)
- [Source: src/types/scanStateMachine.ts] - Type definitions (530 lines)
- [Source: docs/sprint-artifacts/epic14d/scan-request-lifecycle.md] - Scan lifecycle spec
- [Atlas: 08-workflow-chains.md] - Workflow chain analysis reference
