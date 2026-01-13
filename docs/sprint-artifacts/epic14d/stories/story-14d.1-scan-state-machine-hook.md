# Story 14d.1: Create useScanStateMachine Hook

**Epic:** 14d - Scan Architecture Refactor
**Points:** 5
**Priority:** HIGH
**Status:** Done

## Description

Build the core state machine hook using useReducer pattern that will manage all scan-related state transitions. This replaces the 31 scattered state variables currently in App.tsx with a single, predictable state machine.

## Background

Current App.tsx manages scan state across 31 variables with complex interdependencies. The state machine pattern (extending ADR-020) provides:
- Explicit states and transitions
- Predictable behavior
- Easy debugging via state inspection
- Extension path for future scan types

## Deliverables

### Files to Create

```
src/
├── hooks/
│   └── useScanStateMachine.ts    # Core state machine hook
├── types/
│   └── scanStateMachine.ts       # Type definitions
└── tests/unit/hooks/
    └── useScanStateMachine.test.ts
```

## Technical Specification

### State Types

```typescript
// src/types/scanStateMachine.ts

export type ScanPhase =
  | 'idle'        // No scan in progress
  | 'capturing'   // Camera/file picker active
  | 'processing'  // Gemini API call in progress
  | 'reviewing'   // User reviewing/editing result
  | 'dialog'      // Modal dialog requiring response
  | 'saving'      // Saving to Firestore
  | 'error';      // Error state

export type ScanMode =
  | 'single'      // Single receipt scan
  | 'batch'       // Multiple receipts
  | 'statement';  // Credit card statement (future)

export type DialogType =
  | 'currency'    // CurrencyMismatchDialog
  | 'total'       // TotalMismatchDialog
  | 'quicksave'   // QuickSaveCard
  | 'complete';   // ScanCompleteModal

export interface ScanState {
  phase: ScanPhase;
  mode: ScanMode;
  images: string[];                 // Base64 images
  results: Transaction[];           // Parsed transactions
  activeDialog: DialogType | null;
  dialogData: unknown | null;       // Data for active dialog
  error: string | null;

  // Batch-specific
  batchProgress: {
    current: number;
    total: number;
    completed: Transaction[];
    failed: string[];
  } | null;

  // Metadata
  startedAt: number | null;         // Timestamp for analytics
}

export type ScanAction =
  | { type: 'START_SINGLE_SCAN' }
  | { type: 'START_BATCH_SCAN' }
  | { type: 'START_STATEMENT_SCAN' }
  | { type: 'ADD_IMAGE'; payload: string }
  | { type: 'REMOVE_IMAGE'; payload: number }
  | { type: 'PROCESS' }
  | { type: 'PROCESS_COMPLETE'; payload: Transaction[] }
  | { type: 'PROCESS_ERROR'; payload: string }
  | { type: 'SHOW_DIALOG'; payload: { type: DialogType; data?: unknown } }
  | { type: 'RESOLVE_DIALOG'; payload: { type: DialogType; result: unknown } }
  | { type: 'UPDATE_RESULT'; payload: Partial<Transaction> }
  | { type: 'SAVE' }
  | { type: 'SAVE_COMPLETE' }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'CANCEL' }
  | { type: 'RESET' }
  | { type: 'BATCH_ITEM_COMPLETE'; payload: { index: number; result: Transaction } }
  | { type: 'BATCH_ITEM_ERROR'; payload: { index: number; error: string } };
```

### Hook Implementation

```typescript
// src/hooks/useScanStateMachine.ts

import { useReducer, useMemo } from 'react';
import type { ScanState, ScanAction, ScanPhase, ScanMode } from '../types/scanStateMachine';

const initialState: ScanState = {
  phase: 'idle',
  mode: 'single',
  images: [],
  results: [],
  activeDialog: null,
  dialogData: null,
  error: null,
  batchProgress: null,
  startedAt: null,
};

function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'START_SINGLE_SCAN':
      return {
        ...initialState,
        phase: 'capturing',
        mode: 'single',
        startedAt: Date.now(),
      };

    case 'START_BATCH_SCAN':
      return {
        ...initialState,
        phase: 'capturing',
        mode: 'batch',
        startedAt: Date.now(),
      };

    case 'START_STATEMENT_SCAN':
      return {
        ...initialState,
        phase: 'capturing',
        mode: 'statement',
        startedAt: Date.now(),
      };

    // ... additional cases

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useScanStateMachine() {
  const [state, dispatch] = useReducer(scanReducer, initialState);

  // Computed values
  const computed = useMemo(() => ({
    isBlocking: state.phase !== 'idle' && state.activeDialog !== null,
    canNavigate: state.activeDialog === null || state.phase === 'idle',
    isProcessing: state.phase === 'processing',
    isIdle: state.phase === 'idle',
    hasError: state.phase === 'error',
    currentView: deriveCurrentView(state),
  }), [state]);

  return {
    state,
    dispatch,
    ...computed,
  };
}

function deriveCurrentView(state: ScanState): string {
  if (state.phase === 'idle') return 'dashboard';
  if (state.mode === 'batch' && state.phase === 'capturing') return 'batch-capture';
  if (state.mode === 'batch' && state.phase === 'reviewing') return 'batch-review';
  if (state.mode === 'statement') return 'statement-scan';
  if (state.phase === 'reviewing' || state.phase === 'dialog') return 'transaction-editor';
  return 'dashboard';
}
```

## Acceptance Criteria

### Functional Requirements

- [x] **AC1:** ScanPhase type includes 6 phases: idle, capturing, scanning, reviewing, saving, error (dialog consolidated as overlay state)
- [x] **AC2:** ScanMode type includes: single, batch, statement
- [x] **AC3:** Full action set implemented (24 actions - exceeds 15+ requirement)
- [x] **AC4:** Reducer handles all state transitions correctly
- [x] **AC5:** Invalid transitions return current state (no-op)

### Computed Values

- [x] **AC6:** `isBlocking` returns true when active request AND dialog is showing
- [x] **AC7:** `canNavigateFreely` returns false when dialog is active or processing
- [x] **AC8:** `isProcessing` returns true during scanning/saving phases
- [x] **AC9:** `currentView` derives correct view from state

### Testing

- [x] **AC10:** Unit tests for all state transitions (74 tests)
- [x] **AC11:** Unit tests for computed values (including isBlocking)
- [x] **AC12:** Edge case tests (request precedence, invalid actions)
- [x] **AC13:** TypeScript strict mode passes

## Test Cases

```typescript
describe('useScanStateMachine', () => {
  describe('state transitions', () => {
    it('should start in idle state');
    it('should transition to capturing on START_SINGLE_SCAN');
    it('should transition to capturing on START_BATCH_SCAN');
    it('should add image to array on ADD_IMAGE');
    it('should transition to processing on PROCESS');
    it('should transition to reviewing on PROCESS_COMPLETE');
    it('should transition to error on PROCESS_ERROR');
    it('should show dialog on SHOW_DIALOG');
    it('should clear dialog on RESOLVE_DIALOG');
    it('should reset to idle on CANCEL');
    it('should reset to idle on RESET');
  });

  describe('computed values', () => {
    it('should return isBlocking true when dialog active');
    it('should return canNavigate false when dialog active');
    it('should derive correct currentView for single scan');
    it('should derive correct currentView for batch scan');
  });

  describe('batch mode', () => {
    it('should track batch progress');
    it('should handle individual item completion');
    it('should handle individual item errors');
  });
});
```

## Dependencies

- None (this is the foundation)

## Blocks

- Story 14d.2: ScanContext Provider
- Story 14d.3: Navigation Blocking

## Notes

- This hook is the foundation for all scan refactoring
- Keep reducer pure - no side effects
- Side effects (API calls, persistence) will be handled in ScanContext

---

## Dev Agent Record

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useScanStateMachine.ts` | Created | Core state machine hook with useReducer pattern |
| `src/types/scanStateMachine.ts` | Created | Type definitions for all state, actions, and computed values |
| `tests/unit/hooks/useScanStateMachine.test.ts` | Created | 74 comprehensive unit tests |

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-01-08 | Initial implementation | Story 14d.1 development |
| 2026-01-08 | Code review fixes | Removed unused imports (useCallback, ScanMode, BatchProgress, CreditStatus) |
| 2026-01-08 | Code review fixes | Removed dead code (isValidTransition, VALID_TRANSITIONS) |
| 2026-01-08 | Code review fixes | Added `isBlocking` computed value per AC6 |
| 2026-01-08 | Test additions | Added 4 tests for isBlocking (74 total) |

### Implementation Notes

- **Design Decision:** `dialog` phase was consolidated into `activeDialog` overlay state rather than a separate phase. This allows dialogs to appear during any phase (capturing, reviewing, etc.) which is more flexible.
- **24 Actions Implemented:** START_SINGLE, START_BATCH, START_STATEMENT, ADD_IMAGE, REMOVE_IMAGE, SET_IMAGES, SET_STORE_TYPE, SET_CURRENCY, PROCESS_START, PROCESS_SUCCESS, PROCESS_ERROR, SHOW_DIALOG, RESOLVE_DIALOG, DISMISS_DIALOG, UPDATE_RESULT, SET_ACTIVE_RESULT, SAVE_START, SAVE_SUCCESS, SAVE_ERROR, BATCH_ITEM_START, BATCH_ITEM_SUCCESS, BATCH_ITEM_ERROR, BATCH_COMPLETE, CANCEL, RESET, RESTORE_STATE, REFUND_CREDIT
- **Credit Lifecycle:** Tracks none → reserved → confirmed/refunded per scan-request-lifecycle.md spec

---

*Story created by Atlas - Project Intelligence Guardian*
