# Story 14e-6a: Scan Zustand Store Foundation & Core Actions

**Epic:** 14e - Feature-Based Architecture
**Points:** 3
**Status:** ready-for-dev
**Created:** 2026-01-24
**Author:** Atlas Story Sizing Workflow
**Split From:** Story 14e-6 (exceeded sizing limits: 5 tasks, 47 subtasks)

---

## User Story

As a **developer**,
I want **the foundational Zustand store for scan flow with core start/image/process actions**,
So that **the scan state migration from useReducer to Zustand can begin incrementally**.

---

## Context

### Split Rationale

The original Story 14e-6 had:
- **5 tasks** (exceeds 4-task limit)
- **47 subtasks** (3.1× the 15-subtask limit)
- **High context window exhaustion risk**

Per Atlas sizing patterns (Story 14c-refactor.22a lesson), this story was split by_phase:
- **14e-6a** (this story): Foundation + Core Actions (START_*, IMAGE_*, PROCESS_*)
- **14e-6b**: Remaining Actions (DIALOG_*, SAVE_*, BATCH_*, CONTROL)
- **14e-6c**: Selectors & Module Exports
- **14e-6d**: Comprehensive Tests & Verification

### Current State

The scan flow is currently managed by:
- `src/hooks/useScanStateMachine.ts` - useReducer-based state machine (898 lines)
- `src/types/scanStateMachine.ts` - Type definitions (530 lines)
- `src/contexts/ScanContext.tsx` - React Context wrapper for state machine

### Target State

A Zustand store foundation with:
1. File structure created
2. Initial state matching existing `ScanState` interface
3. Core actions: START_*, IMAGE_*, PROCESS_* with phase guards
4. DevTools middleware configured

---

## Acceptance Criteria

### AC1: File Structure Created

**Given** the Epic 14e feature architecture plan
**When** this story is completed
**Then:**
- [ ] `src/features/scan/store/` directory created
- [ ] `src/features/scan/store/useScanStore.ts` created
- [ ] `src/features/scan/store/index.ts` created (partial exports)
- [ ] `src/features/scan/index.ts` updated to export store module

### AC2: Initial State Matches Existing Shape

**Given** the existing `ScanState` interface and `initialScanState`
**When** this story is completed
**Then:**
- [ ] Store state matches existing `ScanState` interface exactly
- [ ] Initial state matches existing `initialScanState` from useScanStateMachine.ts
- [ ] Store uses existing types from `src/types/scanStateMachine.ts` (no duplication)

### AC3: START_* Actions Implemented with Guards

**Given** the existing START_SINGLE, START_BATCH, START_STATEMENT action handlers
**When** this story is completed
**Then:**
- [ ] `startSingle(userId: string)` action implemented
- [ ] `startBatch(userId: string)` action implemented
- [ ] `startStatement(userId: string)` action implemented
- [ ] All START actions blocked when `phase !== 'idle'`
- [ ] Phase guard logs warning in DEV mode when blocked
- [ ] Actions use Zustand `set()` with action names for DevTools

### AC4: IMAGE_* Actions Implemented with Guards

**Given** the existing ADD_IMAGE, REMOVE_IMAGE, SET_IMAGES action handlers
**When** this story is completed
**Then:**
- [ ] `addImage(image: string)` action implemented
- [ ] `removeImage(index: number)` action implemented
- [ ] `setImages(images: string[])` action implemented
- [ ] All IMAGE actions blocked when `phase !== 'capturing'`
- [ ] Actions preserve existing behavior from scanReducer

### AC5: PROCESS_* Actions Implemented with Guards

**Given** the existing PROCESS_START, PROCESS_SUCCESS, PROCESS_ERROR action handlers
**When** this story is completed
**Then:**
- [ ] `processStart()` action implemented
- [ ] `processSuccess(results)` action implemented
- [ ] `processError(error)` action implemented
- [ ] `processStart()` blocked when `phase !== 'capturing'` OR `images.length === 0`
- [ ] `processSuccess/Error` blocked when `phase !== 'scanning'`

### AC6: DevTools Middleware Configured

**Given** Zustand devtools middleware
**When** this story is completed
**Then:**
- [ ] Store wrapped with `devtools()` middleware
- [ ] Store name set to `'scan-store'`
- [ ] Actions have descriptive names (e.g., `scan/startSingle`, `scan/addImage`)

---

## Tasks / Subtasks

- [ ] **Task 1: Create Directory Structure**
  - [ ] Create `src/features/scan/store/` directory
  - [ ] Create empty `useScanStore.ts` file
  - [ ] Create `index.ts` with placeholder exports
  - [ ] Update `src/features/scan/index.ts` to re-export store

- [ ] **Task 2: Implement Store Foundation**
  - [ ] Copy `initialScanState` from `useScanStateMachine.ts`
  - [ ] Import types from `src/types/scanStateMachine.ts`
  - [ ] Set up Zustand store with devtools middleware
  - [ ] Configure store name as `'scan-store'`

- [ ] **Task 3: Implement Core Actions**
  - [ ] Implement `startSingle()` with phase guard
  - [ ] Implement `startBatch()` with phase guard
  - [ ] Implement `startStatement()` with phase guard
  - [ ] Implement `addImage()` with phase guard
  - [ ] Implement `removeImage()` with phase guard
  - [ ] Implement `setImages()` with phase guard
  - [ ] Implement `processStart()` with phase guard
  - [ ] Implement `processSuccess()` with phase guard
  - [ ] Implement `processError()` with phase guard
  - [ ] Add DEV-mode warning logs for blocked transitions
  - [ ] Verify action names appear in Redux DevTools

---

## Dev Notes

### Store Implementation Pattern

```typescript
// src/features/scan/store/useScanStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ScanState } from '@/types/scanStateMachine';
import { generateRequestId, initialScanState } from '@/types/scanStateMachine';

interface ScanActions {
  // START actions
  startSingle: (userId: string) => void;
  startBatch: (userId: string) => void;
  startStatement: (userId: string) => void;

  // IMAGE actions
  addImage: (image: string) => void;
  removeImage: (index: number) => void;
  setImages: (images: string[]) => void;

  // PROCESS actions
  processStart: () => void;
  processSuccess: (results: Transaction[]) => void;
  processError: (error: string) => void;
}

export const useScanStore = create<ScanState & ScanActions>()(
  devtools(
    (set, get) => ({
      ...initialScanState,

      startSingle: (userId: string) => {
        const state = get();
        if (state.phase !== 'idle') {
          if (import.meta.env.DEV) {
            console.warn('[ScanStore] Cannot start - request in progress');
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

      // ... implement remaining actions
    }),
    { name: 'scan-store' }
  )
);
```

### Phase Guard Pattern

```typescript
// Standard guard pattern for all actions
const guardPhase = (expected: ScanPhase | ScanPhase[], actionName: string): boolean => {
  const state = get();
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(state.phase)) {
    if (import.meta.env.DEV) {
      console.warn(`[ScanStore] ${actionName} blocked: phase is ${state.phase}, expected ${allowed.join('|')}`);
    }
    return false;
  }
  return true;
};
```

---

## Files to Create

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/features/scan/store/useScanStore.ts` | Zustand store (partial) | ~200 |
| `src/features/scan/store/index.ts` | Module exports (partial) | ~15 |

## Files to Modify

| File | Change |
|------|--------|
| `src/features/scan/index.ts` | Add store re-exports |

---

## Definition of Done

- [ ] File structure created under `src/features/scan/store/`
- [ ] Store matches `ScanState` interface exactly
- [ ] 9 core actions implemented (3 START + 3 IMAGE + 3 PROCESS)
- [ ] All actions have phase guards matching existing reducer
- [ ] DevTools middleware configured with action names
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

---

## Dependencies

- **Depends on:** Story 14e-1 (Directory Structure & Zustand Setup) - must be complete
- **Blocks:** Story 14e-6b (Store Complete), Story 14e-6c (Selectors), Story 14e-6d (Tests)

---

## References

- [Original Story 14e-6](./14e-6-scan-zustand-store-definition.md) - Split source
- [Architecture Decision](../architecture-decision.md) - ADR-018: Zustand-only state management
- [Source: src/hooks/useScanStateMachine.ts] - Current reducer implementation
- [Source: src/types/scanStateMachine.ts] - Type definitions
