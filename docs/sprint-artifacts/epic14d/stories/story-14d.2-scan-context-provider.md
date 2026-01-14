# Story 14d.2: Create ScanContext Provider

**Epic:** 14d - Scan Architecture Refactor
**Points:** 3
**Priority:** HIGH
**Status:** Done
**Depends On:** Story 14d.1
**Completed:** 2026-01-09

## Description

Create an app-wide ScanContext provider that wraps the state machine hook and exposes scan functionality to all components. This enables any component to access scan state and dispatch actions without prop drilling.

## Background

The context must be app-wide because:
1. Navigation guards need global awareness
2. FAB needs to show scan state from any view
3. Multiple views interact with scan state (dashboard, editor, batch views)

## Deliverables

### Files to Create/Update

```
src/
├── contexts/
│   └── ScanContext.tsx           # Context provider
├── App.tsx                        # Add provider wrapper
└── tests/unit/contexts/
    └── ScanContext.test.tsx
```

## Technical Specification

### Context Implementation

```typescript
// src/contexts/ScanContext.tsx

import React, { createContext, useContext, useCallback } from 'react';
import { useScanStateMachine } from '../hooks/useScanStateMachine';
import type {
  ScanState,
  ScanAction,
  ScanMode,
  DialogType,
} from '../types/scanStateMachine';

interface ScanContextValue {
  // State
  state: ScanState;

  // Computed values
  isBlocking: boolean;
  canNavigate: boolean;
  isProcessing: boolean;
  isIdle: boolean;
  hasError: boolean;
  currentView: string;

  // Actions (wrapped for convenience)
  startSingleScan: () => void;
  startBatchScan: () => void;
  startStatementScan: () => void;
  addImage: (base64: string) => void;
  removeImage: (index: number) => void;
  process: () => void;
  showDialog: (type: DialogType, data?: unknown) => void;
  resolveDialog: (type: DialogType, result: unknown) => void;
  cancel: () => void;
  reset: () => void;

  // Raw dispatch for advanced usage
  dispatch: React.Dispatch<ScanAction>;
}

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const {
    state,
    dispatch,
    isBlocking,
    canNavigate,
    isProcessing,
    isIdle,
    hasError,
    currentView,
  } = useScanStateMachine();

  // Convenience action wrappers
  const startSingleScan = useCallback(() => {
    dispatch({ type: 'START_SINGLE_SCAN' });
  }, [dispatch]);

  const startBatchScan = useCallback(() => {
    dispatch({ type: 'START_BATCH_SCAN' });
  }, [dispatch]);

  const startStatementScan = useCallback(() => {
    dispatch({ type: 'START_STATEMENT_SCAN' });
  }, [dispatch]);

  const addImage = useCallback((base64: string) => {
    dispatch({ type: 'ADD_IMAGE', payload: base64 });
  }, [dispatch]);

  const removeImage = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: index });
  }, [dispatch]);

  const process = useCallback(() => {
    dispatch({ type: 'PROCESS' });
  }, [dispatch]);

  const showDialog = useCallback((type: DialogType, data?: unknown) => {
    dispatch({ type: 'SHOW_DIALOG', payload: { type, data } });
  }, [dispatch]);

  const resolveDialog = useCallback((type: DialogType, result: unknown) => {
    dispatch({ type: 'RESOLVE_DIALOG', payload: { type, result } });
  }, [dispatch]);

  const cancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const value: ScanContextValue = {
    state,
    isBlocking,
    canNavigate,
    isProcessing,
    isIdle,
    hasError,
    currentView,
    startSingleScan,
    startBatchScan,
    startStatementScan,
    addImage,
    removeImage,
    process,
    showDialog,
    resolveDialog,
    cancel,
    reset,
    dispatch,
  };

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan(): ScanContextValue {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
}

// Optional: export a hook that returns null instead of throwing
export function useScanOptional(): ScanContextValue | null {
  return useContext(ScanContext);
}
```

### App.tsx Integration

```typescript
// src/App.tsx - Add provider wrapper

import { ScanProvider } from './contexts/ScanContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScanProvider>
          {/* ... existing app content ... */}
        </ScanProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

## Acceptance Criteria

### Provider Setup

- [x] **AC1:** ScanContext created with proper TypeScript types
- [x] **AC2:** ScanProvider wraps useScanStateMachine hook
- [x] **AC3:** Provider added to App.tsx at correct level (inside Auth, outside views)
- [x] **AC4:** `useScan()` hook throws if used outside provider
- [x] **AC5:** `useScanOptional()` hook returns null outside provider

### Action Wrappers

- [x] **AC6:** All convenience actions wrapped with useCallback
- [x] **AC7:** `startSingleScan()` dispatches START_SINGLE (action name matches actual implementation)
- [x] **AC8:** `startBatchScan()` dispatches START_BATCH (action name matches actual implementation)
- [x] **AC9:** `showDialog()` dispatches SHOW_DIALOG with type and data
- [x] **AC10:** `resolveDialog()` dispatches RESOLVE_DIALOG with type and result

### Context Value

- [x] **AC11:** All computed values from hook exposed
- [x] **AC12:** Raw dispatch exposed for advanced usage
- [x] **AC13:** Types exported for consumers

### Testing

- [x] **AC14:** Unit tests for provider rendering
- [x] **AC15:** Unit tests for useScan hook
- [x] **AC16:** Test that useScan throws outside provider
- [x] **AC17:** Integration test showing state updates propagate

## Test Cases

```typescript
describe('ScanContext', () => {
  describe('ScanProvider', () => {
    it('should provide scan state to children');
    it('should provide action methods');
    it('should update state when actions dispatched');
  });

  describe('useScan', () => {
    it('should throw when used outside provider');
    it('should return context value when inside provider');
    it('should have stable action references (useCallback)');
  });

  describe('useScanOptional', () => {
    it('should return null when outside provider');
    it('should return context value when inside provider');
  });

  describe('integration', () => {
    it('should propagate state changes to all consumers');
    it('should handle rapid action dispatches');
  });
});
```

## Dependencies

- Story 14d.1: useScanStateMachine hook

## Blocks

- Story 14d.3: Navigation Blocking
- Story 14d.4: Single Scan Refactor
- Story 14d.5: Batch Scan Refactor

## Notes

- Keep context value stable using useMemo if needed
- Action wrappers use useCallback for referential stability
- This is a thin wrapper - business logic stays in state machine

---

## Dev Agent Record

### Implementation Plan
- Created `src/contexts/ScanContext.tsx` following existing context patterns (AnalyticsContext, HistoryFiltersContext)
- Wrapped `useScanStateMachine` hook with memoized action wrappers using `useCallback`
- Added `ScanProvider` to App.tsx wrapping all authenticated content
- Created comprehensive test suite with 22 tests covering all acceptance criteria

### Completion Notes
- **Files Created:**
  - `src/contexts/ScanContext.tsx` - Context provider with types, hooks, and action wrappers
  - `tests/unit/contexts/ScanContext.test.tsx` - 22 unit and integration tests

- **Files Modified:**
  - `src/App.tsx` - Added ScanProvider import and wrapper around authenticated content

- **Test Results:** 22 tests passing (96 total including useScanStateMachine tests)

- **Key Implementation Decisions:**
  1. Used `useMemo` for context value to optimize re-renders
  2. All action wrappers use `useCallback` for referential stability
  3. Actions require userId as parameter (not pulled from auth context) for flexibility
  4. Extended interface to include ALL 27 action wrappers from state machine:
     - Start actions: `startSingleScan`, `startBatchScan`, `startStatementScan`
     - Image actions: `addImage`, `removeImage`, `setImages`
     - Pre-scan options: `setStoreType`, `setCurrency`
     - Process actions: `processStart`, `processSuccess`, `processError`
     - Dialog actions: `showDialog`, `resolveDialog`, `dismissDialog`
     - Result actions: `updateResult`, `setActiveResult`
     - Save actions: `saveStart`, `saveSuccess`, `saveError`
     - Batch actions: `batchItemStart`, `batchItemSuccess`, `batchItemError`, `batchComplete`
     - Control actions: `cancel`, `reset`, `restoreState`, `refundCredit`
  5. Added `dismissDialog()` convenience method in addition to `resolveDialog()`

- **Atlas Patterns Applied:**
  - React Context pattern matching existing contexts in project
  - Test structure following useScanStateMachine.test.ts patterns
  - TypeScript types properly exported for consumers

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2026-01-09 | Initial implementation complete | Dev Agent |
| 2026-01-09 | Code review passed - fixed JSDoc example, added dismissDialog test (23 tests now), updated docs with full action list | Atlas Code Review |

---

*Story created by Atlas - Project Intelligence Guardian*
