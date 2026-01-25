# Story 14e-6c: Scan Zustand Selectors & Module Exports

**Epic:** 14e - Feature-Based Architecture
**Points:** 2
**Status:** ready-for-dev
**Created:** 2026-01-24
**Author:** Atlas Story Sizing Workflow
**Split From:** Story 14e-6 (exceeded sizing limits: 5 tasks, 47 subtasks)

---

## User Story

As a **developer**,
I want **memoized selector hooks and proper module exports for the scan store**,
So that **components can efficiently subscribe to only the state they need without unnecessary re-renders**.

---

## Context

### Split Rationale

The original Story 14e-6 had 47 subtasks. This story implements the third phase:
- **14e-6a**: Foundation + Core Actions - COMPLETE
- **14e-6b**: Remaining Actions - COMPLETE
- **14e-6c** (this story): Selectors & Module Exports
- **14e-6d**: Comprehensive Tests & Verification

### Selectors to Create

Based on the existing `computeValues()` function and common access patterns:
- **Phase selectors**: useScanPhase, useScanMode
- **Boolean selectors**: useHasActiveRequest, useIsProcessing, useIsIdle, useHasError, useHasDialog, useIsBlocking, useCreditSpent
- **Complex selectors**: useCanNavigateFreely, useCanSave, useCurrentView
- **Count selectors**: useImageCount, useResultCount
- **Action hook**: useScanActions

---

## Acceptance Criteria

### AC1: Phase & Mode Selectors Created

**Given** the store contains phase and mode state
**When** this story is completed
**Then:**
- [ ] `useScanPhase()` returns current phase
- [ ] `useScanMode()` returns current mode (single/batch/statement)
- [ ] Selectors only re-render when their specific value changes

### AC2: Boolean Computed Selectors Created

**Given** the existing `computeValues()` function logic
**When** this story is completed
**Then:**
- [ ] `useHasActiveRequest()` returns `phase !== 'idle'`
- [ ] `useIsProcessing()` returns `phase === 'scanning' || phase === 'saving'`
- [ ] `useIsIdle()` returns `phase === 'idle'`
- [ ] `useHasError()` returns `phase === 'error'`
- [ ] `useHasDialog()` returns `activeDialog !== null`
- [ ] `useIsBlocking()` returns `hasActiveRequest && hasDialog`
- [ ] `useCreditSpent()` returns `creditStatus === 'confirmed'`

### AC3: Complex Computed Selectors Created

**Given** the existing computed value logic
**When** this story is completed
**Then:**
- [ ] `useCanNavigateFreely()` returns derived navigation permission
- [ ] `useCanSave()` returns `reviewing && results.length > 0 && validResults && !hasDialog`
- [ ] `useCurrentView()` returns derived view name based on phase/mode

### AC4: Count Selectors Created

**Given** arrays in state
**When** this story is completed
**Then:**
- [ ] `useImageCount()` returns `images.length`
- [ ] `useResultCount()` returns `results.length`

### AC5: useScanActions Hook Created

**Given** all store actions need to be accessible
**When** this story is completed
**Then:**
- [ ] `useScanActions()` returns object with all action functions
- [ ] Actions are stable references (use Zustand getState pattern)
- [ ] Hook returns same reference on re-renders

### AC6: Direct Access Functions Exported

**Given** non-React code (services) needs store access
**When** this story is completed
**Then:**
- [ ] `getScanState()` exported - returns current state snapshot
- [ ] `scanActions` object exported - contains all actions for non-React code
- [ ] Both work outside React component tree

### AC7: Module Exports Configured

**Given** the store, selectors, and actions
**When** this story is completed
**Then:**
- [ ] `src/features/scan/store/index.ts` exports all selectors
- [ ] `src/features/scan/store/index.ts` exports useScanStore, useScanActions
- [ ] `src/features/scan/store/index.ts` exports getScanState, scanActions
- [ ] `src/features/scan/index.ts` re-exports entire store module
- [ ] Import `{ useScanStore, useScanPhase } from '@features/scan'` works

---

## Tasks / Subtasks

- [ ] **Task 1: Create Selectors File**
  - [ ] Create `src/features/scan/store/selectors.ts`
  - [ ] Implement `useScanPhase()` selector
  - [ ] Implement `useScanMode()` selector

- [ ] **Task 2: Implement Boolean Selectors**
  - [ ] Implement `useHasActiveRequest()`
  - [ ] Implement `useIsProcessing()`
  - [ ] Implement `useIsIdle()`
  - [ ] Implement `useHasError()`
  - [ ] Implement `useHasDialog()`
  - [ ] Implement `useIsBlocking()`
  - [ ] Implement `useCreditSpent()`

- [ ] **Task 3: Implement Complex Selectors**
  - [ ] Implement `useCanNavigateFreely()` - copy logic from computeValues
  - [ ] Implement `useCanSave()` - copy logic from computeValues
  - [ ] Implement `useCurrentView()` - derive from phase/mode
  - [ ] Implement `useImageCount()` and `useResultCount()`

- [ ] **Task 4: Create Action Hooks & Direct Access**
  - [ ] Implement `useScanActions()` hook with stable references
  - [ ] Implement `getScanState()` function
  - [ ] Create `scanActions` object for non-React access
  - [ ] Verify stable references in React DevTools

- [ ] **Task 5: Configure Module Exports**
  - [ ] Update `src/features/scan/store/index.ts` with all exports
  - [ ] Update `src/features/scan/index.ts` to re-export store
  - [ ] Verify imports work with `@features/scan` alias

---

## Dev Notes

### Selector Pattern

```typescript
// src/features/scan/store/selectors.ts

import { useScanStore } from './useScanStore';
import { canSaveTransaction } from '@/types/scanStateMachine';

// Simple selectors
export const useScanPhase = () => useScanStore((s) => s.phase);
export const useScanMode = () => useScanStore((s) => s.mode);

// Boolean computed selectors
export const useHasActiveRequest = () => useScanStore((s) => s.phase !== 'idle');
export const useIsProcessing = () =>
  useScanStore((s) => s.phase === 'scanning' || s.phase === 'saving');

// Complex computed selectors
export const useCanSave = () =>
  useScanStore((s) =>
    s.phase === 'reviewing' &&
    s.results.length > 0 &&
    s.results.some(canSaveTransaction) &&
    s.activeDialog === null
  );

// Count selectors
export const useImageCount = () => useScanStore((s) => s.images.length);
export const useResultCount = () => useScanStore((s) => s.results.length);
```

### useScanActions Pattern

```typescript
// Stable actions hook - actions never change
export const useScanActions = () => {
  return useScanStore((state) => ({
    startSingle: state.startSingle,
    startBatch: state.startBatch,
    // ... all actions
  }));
};

// For non-React code
export const getScanState = () => useScanStore.getState();
export const scanActions = {
  startSingle: (userId: string) => useScanStore.getState().startSingle(userId),
  // ... all actions
};
```

---

## Files to Create

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/features/scan/store/selectors.ts` | All selector hooks | ~100 |

## Files to Modify

| File | Change |
|------|--------|
| `src/features/scan/store/useScanStore.ts` | Add getScanState, scanActions |
| `src/features/scan/store/index.ts` | Export all selectors and functions |
| `src/features/scan/index.ts` | Re-export store module |

---

## Definition of Done

- [ ] 14 selector hooks created and functional
- [ ] `useScanActions()` returns stable action references
- [ ] `getScanState()` and `scanActions` work for non-React code
- [ ] All exports configured in index.ts files
- [ ] Import from `@features/scan` works
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

---

## Dependencies

- **Depends on:** Story 14e-6b (Store Complete) - must be complete
- **Blocks:** Story 14e-6d (Tests)

---

## References

- [Story 14e-6b](./14e-6b-scan-zustand-store-complete.md) - Prerequisite
- [Original Story 14e-6](./14e-6-scan-zustand-store-definition.md) - Split source
- [Source: computeValues() in useScanStateMachine.ts] - Computed logic reference
