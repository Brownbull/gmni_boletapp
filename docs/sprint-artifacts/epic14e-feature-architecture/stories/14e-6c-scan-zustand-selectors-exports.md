# Story 14e-6c: Scan Zustand Selectors & Module Exports

**Epic:** 14e - Feature-Based Architecture
**Points:** 2
**Status:** done
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
- [x] `useScanPhase()` returns current phase
- [x] `useScanMode()` returns current mode (single/batch/statement)
- [x] Selectors only re-render when their specific value changes

### AC2: Boolean Computed Selectors Created

**Given** the existing `computeValues()` function logic
**When** this story is completed
**Then:**
- [x] `useHasActiveRequest()` returns `phase !== 'idle'`
- [x] `useIsProcessing()` returns `phase === 'scanning' || phase === 'saving'`
- [x] `useIsIdle()` returns `phase === 'idle'`
- [x] `useHasError()` returns `phase === 'error'`
- [x] `useHasDialog()` returns `activeDialog !== null`
- [x] `useIsBlocking()` returns `hasActiveRequest && hasDialog`
- [x] `useCreditSpent()` returns `creditStatus === 'confirmed'`

### AC3: Complex Computed Selectors Created

**Given** the existing computed value logic
**When** this story is completed
**Then:**
- [x] `useCanNavigateFreely()` returns derived navigation permission
- [x] `useCanSave()` returns `reviewing && results.length > 0 && validResults && !hasDialog`
- [x] `useCurrentView()` returns derived view name based on phase/mode

### AC4: Count Selectors Created

**Given** arrays in state
**When** this story is completed
**Then:**
- [x] `useImageCount()` returns `images.length`
- [x] `useResultCount()` returns `results.length`

### AC5: useScanActions Hook Created

**Given** all store actions need to be accessible
**When** this story is completed
**Then:**
- [x] `useScanActions()` returns object with all action functions
- [x] Actions are stable references (use Zustand useShallow pattern)
- [x] Hook returns same reference on re-renders

### AC6: Direct Access Functions Exported

**Given** non-React code (services) needs store access
**When** this story is completed
**Then:**
- [x] `getScanState()` exported - returns current state snapshot
- [x] `scanActions` object exported - contains all actions for non-React code
- [x] Both work outside React component tree

### AC7: Module Exports Configured

**Given** the store, selectors, and actions
**When** this story is completed
**Then:**
- [x] `src/features/scan/store/index.ts` exports all selectors
- [x] `src/features/scan/store/index.ts` exports useScanStore, useScanActions
- [x] `src/features/scan/store/index.ts` exports getScanState, scanActions
- [x] `src/features/scan/index.ts` re-exports entire store module
- [x] Import `{ useScanStore, useScanPhase } from '@features/scan'` works

---

## Tasks / Subtasks

- [x] **Task 1: Create Selectors File**
  - [x] Create `src/features/scan/store/selectors.ts`
  - [x] Implement `useScanPhase()` selector
  - [x] Implement `useScanMode()` selector

- [x] **Task 2: Implement Boolean Selectors**
  - [x] Implement `useHasActiveRequest()`
  - [x] Implement `useIsProcessing()`
  - [x] Implement `useIsIdle()`
  - [x] Implement `useHasError()`
  - [x] Implement `useHasDialog()`
  - [x] Implement `useIsBlocking()`
  - [x] Implement `useCreditSpent()`

- [x] **Task 3: Implement Complex Selectors**
  - [x] Implement `useCanNavigateFreely()` - copy logic from computeValues
  - [x] Implement `useCanSave()` - copy logic from computeValues
  - [x] Implement `useCurrentView()` - derive from phase/mode
  - [x] Implement `useImageCount()` and `useResultCount()`

- [x] **Task 4: Create Action Hooks & Direct Access**
  - [x] Implement `useScanActions()` hook with stable references
  - [x] Implement `getScanState()` function
  - [x] Create `scanActions` object for non-React access
  - [x] Verify stable references in React DevTools

- [x] **Task 5: Configure Module Exports**
  - [x] Update `src/features/scan/store/index.ts` with all exports
  - [x] Update `src/features/scan/index.ts` to re-export store
  - [x] Verify imports work with `@features/scan` alias

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

- [x] 14 selector hooks created and functional
- [x] `useScanActions()` returns stable action references
- [x] `getScanState()` and `scanActions` work for non-React code
- [x] All exports configured in index.ts files
- [x] Import from `@features/scan` works
- [x] `npm run build` succeeds
- [x] `npm run type-check` passes

---

## Dependencies

- **Depends on:** Story 14e-6b (Store Complete) - must be complete
- **Blocks:** Story 14e-6d (Tests)

---

## References

- [Story 14e-6b](./14e-6b-scan-zustand-store-complete.md) - Prerequisite
- [Original Story 14e-6](./14e-6-scan-zustand-store-definition.md) - Split source
- [Source: computeValues() in useScanStateMachine.ts] - Computed logic reference

---

## Dev Agent Record

### Implementation Plan
Followed story tasks in order. Created selectors.ts with all 14 selector hooks, useScanActions hook, getScanState, and scanActions object. Used Zustand useShallow for stable action references.

### Completion Notes
- Created `src/features/scan/store/selectors.ts` (232 lines)
- Updated `src/features/scan/store/index.ts` with comprehensive exports
- Updated `src/features/scan/index.ts` with usage documentation
- All selectors follow Zustand best practices for granular subscriptions
- useScanActions uses useShallow for stable object references
- scanActions provides direct access for non-React code (services)
- Build successful, type-check passes, 5,347 tests pass

### Debug Log
- No issues encountered during implementation
- Pattern followed Atlas architecture guidance for Zustand selectors

---

## File List

### Created
- `src/features/scan/store/selectors.ts` - All selectors, action hooks, and direct access

### Modified
- `src/features/scan/store/index.ts` - Complete module exports
- `src/features/scan/index.ts` - Updated documentation and re-export

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-24 | Story created from 14e-6 split | Atlas Story Sizing |
| 2026-01-25 | Implementation complete | Dev Agent |
