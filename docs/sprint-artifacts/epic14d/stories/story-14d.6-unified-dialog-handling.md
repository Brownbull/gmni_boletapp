# Story 14d.6: Unify Dialog Handling

**Epic:** 14d - Scan Architecture Refactor
**Points:** 5
**Priority:** MEDIUM
**Status:** Complete
**Depends On:** Story 14d.4
**Completed:** 2026-01-11

## Description

Consolidate all scan-related dialog state (currency mismatch, total mismatch, quick save, scan complete) into the state machine's dialog system. Dialogs are triggered via SHOW_DIALOG and resolved via RESOLVE_DIALOG actions.

## Background

Currently dialogs have their own state variables:
- `showCurrencyMismatch`, `currencyMismatchData`
- `showTotalMismatch`, `totalMismatchData`
- `showQuickSaveCard`, `quickSaveTransaction`, `quickSaveConfidence`

This creates race conditions and makes it hard to track which dialog is active. The state machine ensures only one dialog is active at a time.

## Deliverables

### Files to Update

```
src/
├── App.tsx                              # Remove dialog state
├── components/scan/
│   ├── CurrencyMismatchDialog.tsx       # Use ScanContext
│   ├── TotalMismatchDialog.tsx          # Use ScanContext
│   ├── QuickSaveCard.tsx                # Use ScanContext
│   └── ScanCompleteModal.tsx            # Use ScanContext
└── contexts/
    └── ScanContext.tsx                  # Dialog helpers
```

## Technical Specification

### Dialog State in State Machine

```typescript
// Already in state machine from 14d.1
interface ScanState {
  // ...
  activeDialog: DialogType | null;
  dialogData: unknown | null;
}

type DialogType =
  | 'currency'
  | 'total'
  | 'quicksave'
  | 'complete'
  | 'batchComplete'
  | 'batchCancel'
  | 'batchDiscard'
  | 'creditWarning';
```

### Dialog Data Types

```typescript
// src/types/scanStateMachine.ts

export interface CurrencyDialogData {
  detected: string;
  expected: string;
  transaction: Transaction;
}

export interface TotalDialogData {
  expectedTotal: number;
  calculatedTotal: number;
  transaction: Transaction;
}

export interface QuickSaveDialogData {
  transaction: Transaction;
  confidence: number;
}

export interface CompleteDialogData {
  transaction: Transaction;
  skipComplete?: boolean;
}

// Type guard for dialog data
export type DialogData =
  | { type: 'currency'; data: CurrencyDialogData }
  | { type: 'total'; data: TotalDialogData }
  | { type: 'quicksave'; data: QuickSaveDialogData }
  | { type: 'complete'; data: CompleteDialogData };
```

### Dialog Component Pattern

```typescript
// src/components/scan/CurrencyMismatchDialog.tsx

import { useScan } from '../../contexts/ScanContext';
import type { CurrencyDialogData } from '../../types/scanStateMachine';

export function CurrencyMismatchDialog() {
  const { state, resolveDialog } = useScan();

  // Only render if this dialog is active
  if (state.activeDialog !== 'currency') {
    return null;
  }

  const data = state.dialogData as CurrencyDialogData;

  const handleUseDetected = () => {
    resolveDialog('currency', { useDetected: true });
  };

  const handleUseExpected = () => {
    resolveDialog('currency', { useDetected: false });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <h2>Moneda Diferente Detectada</h2>
        <p>Detectamos {data.detected} pero tu moneda es {data.expected}</p>
        <div className="flex gap-4 mt-4">
          <button onClick={handleUseDetected}>
            Usar {data.detected}
          </button>
          <button onClick={handleUseExpected}>
            Usar {data.expected}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### ScanContext Dialog Handling

```typescript
// src/contexts/ScanContext.tsx

// Handle dialog resolution in reducer
case 'RESOLVE_DIALOG': {
  const { type, result } = action.payload;

  // Only process if this is the active dialog
  if (state.activeDialog !== type) {
    return state;
  }

  // Handle based on dialog type
  switch (type) {
    case 'currency': {
      const { useDetected } = result as { useDetected: boolean };
      const data = state.dialogData as CurrencyDialogData;
      const updatedTransaction = {
        ...data.transaction,
        currency: useDetected ? data.detected : data.expected,
      };
      return {
        ...state,
        activeDialog: null,
        dialogData: null,
        results: [updatedTransaction],
        // Continue to next dialog or editor
      };
    }

    case 'quicksave': {
      const { action: userAction } = result as { action: 'save' | 'edit' };
      if (userAction === 'save') {
        return { ...state, phase: 'saving', activeDialog: null, dialogData: null };
      } else {
        return { ...state, phase: 'reviewing', activeDialog: null, dialogData: null };
      }
    }

    // ... other dialog types
  }
}
```

## Acceptance Criteria

### State Migration

- [x] **AC1:** Remove `showCurrencyMismatch` from App.tsx
- [x] **AC2:** Remove `currencyMismatchData` from App.tsx
- [x] **AC3:** Remove `showTotalMismatch` from App.tsx
- [x] **AC4:** Remove `totalMismatchData` from App.tsx
- [x] **AC5:** Remove `showQuickSaveCard` from App.tsx
- [x] **AC6:** Remove `quickSaveTransaction` from App.tsx
- [x] **AC7:** Remove `quickSaveConfidence` from App.tsx

### Dialog Behavior

- [x] **AC8:** Only one dialog active at a time (enforced by state machine)
- [x] **AC9:** Dialog shown via SHOW_DIALOG action (showScanDialog)
- [x] **AC10:** Dialog resolved via RESOLVE_DIALOG action (dismissScanDialog/resolveDialog)
- [x] **AC11:** Dialog data typed correctly per dialog type
- [x] **AC12:** Resolution triggers correct next state

### Component Updates

- [x] **AC13:** CurrencyMismatchDialog uses ScanContext
- [x] **AC14:** TotalMismatchDialog uses ScanContext
- [x] **AC15:** QuickSaveCard uses ScanContext
- [x] **AC16:** ScanCompleteModal uses ScanContext
- [x] **AC17:** All dialogs render only when active

### Testing

- [x] **AC18:** Unit tests for dialog state transitions (103 tests pass)
- [x] **AC19:** Unit tests for dialog resolution (19 integration tests pass)
- [x] **AC20:** Integration test for dialog flow (DialogScanContextIntegration.test.tsx)

## Test Cases

```typescript
describe('Unified Dialog Handling', () => {
  describe('dialog state', () => {
    it('should show currency dialog via SHOW_DIALOG');
    it('should have only one active dialog at a time');
    it('should clear dialog on RESOLVE_DIALOG');
  });

  describe('currency dialog', () => {
    it('should update transaction with detected currency');
    it('should update transaction with expected currency');
    it('should proceed to next step after resolution');
  });

  describe('quicksave dialog', () => {
    it('should proceed to save on accept');
    it('should proceed to editor on edit');
  });

  describe('dialog components', () => {
    it('should render only when active');
    it('should call resolveDialog on user action');
    it('should pass correct data from state');
  });
});
```

## Edge Cases

1. **Dialog dismissed externally** - Should not happen (controlled by state machine)
2. **Rapid dialog switching** - State machine ensures sequential handling
3. **Dialog during navigation** - Handled by navigation blocking (14d.3)

## Dependencies

- Story 14d.4: Single Scan Refactor (dialogs used in single flow)

## Blocks

- Story 14d.11: App.tsx Cleanup (needs dialog state removed)

## Notes

- z-index pattern (z-[100]) should be preserved
- Backdrop click behavior per UX decisions (no dismiss on backdrop)
- All dialogs are modal and require user action

---

## Implementation Notes (2026-01-11)

### Changes Made

**App.tsx:**
- Removed local state variables: `showQuickSaveCard`, `quickSaveTransaction`, `quickSaveConfidence`, `showCurrencyMismatch`, `currencyMismatchData`, `showTotalMismatch`, `totalMismatchData`
- Updated all handlers to receive dialog data from callback parameters instead of local state
- Replaced `setShow*` calls with `showScanDialog`/`dismissScanDialog` context methods
- Updated JSX to render dialogs unconditionally (components handle their own visibility via ScanContext)

**Dialog Components (already migrated in 14d.4b):**
- `CurrencyMismatchDialog`: Reads from `scanState.activeDialog` when type is 'currency_mismatch'
- `TotalMismatchDialog`: Reads from `scanState.activeDialog` when type is 'total_mismatch'
- `QuickSaveCard`: Reads from `scanState.activeDialog` when type is 'quicksave'
- `ScanCompleteModal`: Reads from `scanState.activeDialog` when type is 'scan_complete'

**Key Pattern:**
- Components use `useScanOptional()` to read dialog state from context
- Fall back to props for backward compatibility (allows incremental migration)
- Handlers receive typed dialog data via callback parameters
- Resolution calls `resolveDialog(type, result)` which clears the dialog

### Test Coverage
- 103 tests in `useScanStateMachine.test.ts` (dialog actions included)
- 19 tests in `DialogScanContextIntegration.test.tsx` (component-context integration)
- 25 tests in `ScanOverlay.test.tsx` (related scan UI)

---

*Story created by Atlas - Project Intelligence Guardian*
