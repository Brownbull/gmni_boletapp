# Story 14e-6d: Scan Zustand Comprehensive Tests & Verification

**Epic:** 14e - Feature-Based Architecture
**Points:** 2
**Status:** ready-for-dev
**Created:** 2026-01-24
**Author:** Atlas Story Sizing Workflow
**Split From:** Story 14e-6 (exceeded sizing limits: 5 tasks, 47 subtasks)

---

## User Story

As a **developer**,
I want **comprehensive unit tests for the scan Zustand store covering all transitions and guards**,
So that **the store behavior is verified to match the existing useScanStateMachine before migration**.

---

## Context

### Split Rationale

The original Story 14e-6 had 47 subtasks. This is the final phase:
- **14e-6a**: Foundation + Core Actions - COMPLETE
- **14e-6b**: Remaining Actions - COMPLETE
- **14e-6c**: Selectors & Module Exports - COMPLETE
- **14e-6d** (this story): Comprehensive Tests & Verification

### Test Reference

The existing `useScanStateMachine` has **74+ tests** in:
- `tests/unit/hooks/useScanStateMachine.test.ts`

The new Zustand store tests should cover the same scenarios to ensure feature parity.

---

## Acceptance Criteria

### AC1: Test File Structure Created

**Given** the store is complete
**When** this story is completed
**Then:**
- [ ] Test file at `src/features/scan/store/__tests__/useScanStore.test.ts`
- [ ] Test file imports from store module correctly
- [ ] Test setup includes store reset between tests

### AC2: All Valid Phase Transitions Tested

**Given** the phase transition matrix
**When** this story is completed
**Then:**
- [ ] Test: idle → capturing (via startSingle)
- [ ] Test: idle → capturing (via startBatch, with batchProgress)
- [ ] Test: idle → capturing (via startStatement)
- [ ] Test: capturing → scanning (via processStart)
- [ ] Test: scanning → reviewing (via processSuccess)
- [ ] Test: scanning → reviewing (via batchComplete for batch mode)
- [ ] Test: scanning → error (via processError)
- [ ] Test: reviewing → saving (via saveStart)
- [ ] Test: saving → idle (via saveSuccess)
- [ ] Test: saving → reviewing (via saveError)
- [ ] Test: any → idle (via reset)
- [ ] Test: non-saving → idle (via cancel)

### AC3: All Invalid Phase Transition Guards Tested

**Given** phase guards block invalid transitions
**When** this story is completed
**Then:**
- [ ] Test: startSingle blocked when phase !== 'idle'
- [ ] Test: startBatch blocked when phase !== 'idle'
- [ ] Test: addImage blocked when phase !== 'capturing'
- [ ] Test: processStart blocked when phase !== 'capturing'
- [ ] Test: processStart blocked when images.length === 0
- [ ] Test: processSuccess blocked when phase !== 'scanning'
- [ ] Test: batchComplete blocked when phase !== 'scanning'
- [ ] Test: batchComplete blocked when mode !== 'batch'
- [ ] Test: saveStart blocked when phase !== 'reviewing'
- [ ] Test: cancel blocked when phase === 'saving'
- [ ] Test: DEV mode warning logged on blocked transitions

### AC4: Edge Cases Tested

**Given** potential edge case scenarios
**When** this story is completed
**Then:**
- [ ] Test: Rapid consecutive startSingle calls (only first succeeds)
- [ ] Test: Reset during scanning phase
- [ ] Test: Reset during saving phase
- [ ] Test: Cancel during reviewing phase
- [ ] Test: Multiple addImage calls in succession
- [ ] Test: removeImage at invalid index

### AC5: Selector Return Values Tested

**Given** the selector hooks
**When** this story is completed
**Then:**
- [ ] Test: useIsIdle returns true when phase === 'idle'
- [ ] Test: useIsProcessing returns true during scanning/saving
- [ ] Test: useCanSave returns true only in valid reviewing state
- [ ] Test: useImageCount returns correct count
- [ ] Test: useResultCount returns correct count

### AC6: DevTools Action Names Tested

**Given** actions have DevTools names
**When** this story is completed
**Then:**
- [ ] Test: Actions produce correct action names (e.g., 'scan/startSingle')
- [ ] Verify action names in test using Zustand devtools API

### AC7: Final Verification

**Given** all tests pass
**When** this story is completed
**Then:**
- [ ] `npm run test` passes (including new tests)
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] DevTools shows action names correctly (manual verification)
- [ ] Import from `@features/scan` works correctly

---

## Tasks / Subtasks

- [ ] **Task 1: Create Test File Structure**
  - [ ] Create `src/features/scan/store/__tests__/` directory
  - [ ] Create `useScanStore.test.ts` file
  - [ ] Set up test utilities (store reset, mock user data)

- [ ] **Task 2: Test Valid Phase Transitions**
  - [ ] Write tests for idle → capturing (3 start modes)
  - [ ] Write tests for capturing → scanning
  - [ ] Write tests for scanning → reviewing (single and batch)
  - [ ] Write tests for scanning → error
  - [ ] Write tests for reviewing → saving → idle
  - [ ] Write tests for saving → reviewing (on error)
  - [ ] Write tests for reset and cancel transitions

- [ ] **Task 3: Test Invalid Phase Transition Guards**
  - [ ] Write tests for blocked START actions
  - [ ] Write tests for blocked IMAGE actions
  - [ ] Write tests for blocked PROCESS actions
  - [ ] Write tests for blocked SAVE actions
  - [ ] Write tests for blocked cancel during saving
  - [ ] Write tests for DEV warning logs (mock console.warn)

- [ ] **Task 4: Test Edge Cases**
  - [ ] Write tests for rapid consecutive calls
  - [ ] Write tests for reset during operations
  - [ ] Write tests for array index edge cases

- [ ] **Task 5: Test Selectors and Final Verification**
  - [ ] Write tests for all selector hooks
  - [ ] Verify DevTools action names
  - [ ] Run full test suite
  - [ ] Verify build and lint pass

---

## Dev Notes

### Test Setup Pattern

```typescript
// src/features/scan/store/__tests__/useScanStore.test.ts

import { act, renderHook } from '@testing-library/react';
import { useScanStore, getScanState, scanActions } from '../index';
import { useScanPhase, useIsIdle, useCanSave } from '../selectors';

describe('useScanStore', () => {
  // Reset store before each test
  beforeEach(() => {
    act(() => {
      useScanStore.setState(useScanStore.getInitialState());
    });
  });

  describe('phase transitions', () => {
    it('transitions from idle to capturing on startSingle', () => {
      expect(getScanState().phase).toBe('idle');

      act(() => {
        scanActions.startSingle('test-user-id');
      });

      expect(getScanState().phase).toBe('capturing');
      expect(getScanState().mode).toBe('single');
      expect(getScanState().userId).toBe('test-user-id');
    });

    it('blocks startSingle when not idle', () => {
      // Start a scan first
      act(() => {
        scanActions.startSingle('user-1');
      });

      // Try to start another
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        scanActions.startSingle('user-2');
      });

      // Phase should still be capturing, not restarted
      expect(getScanState().phase).toBe('capturing');
      expect(getScanState().userId).toBe('user-1'); // Original user
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot start')
      );

      consoleSpy.mockRestore();
    });
  });
});
```

### Phase Transition Test Matrix

| Test | From | Action | To | Guard |
|------|------|--------|-----|-------|
| startSingle | idle | startSingle | capturing | phase === 'idle' |
| startBatch | idle | startBatch | capturing | phase === 'idle' |
| blockStart | capturing | startSingle | capturing | BLOCKED |
| addImage | capturing | addImage | capturing | phase === 'capturing' |
| processStart | capturing | processStart | scanning | phase === 'capturing' && images.length > 0 |
| processSuccess | scanning | processSuccess | reviewing | phase === 'scanning' |
| processError | scanning | processError | error | phase === 'scanning' |
| saveStart | reviewing | saveStart | saving | phase === 'reviewing' |
| saveSuccess | saving | saveSuccess | idle | phase === 'saving' |
| saveError | saving | saveError | reviewing | phase === 'saving' |
| reset | any | reset | idle | - |
| cancel | reviewing | cancel | idle | phase !== 'saving' |
| blockCancel | saving | cancel | saving | BLOCKED |

---

## Files to Create

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/features/scan/store/__tests__/useScanStore.test.ts` | Comprehensive tests | ~400 |

---

## Definition of Done

- [ ] Test file created with comprehensive coverage
- [ ] All valid phase transitions tested (12+ tests)
- [ ] All invalid phase transition guards tested (11+ tests)
- [ ] Edge cases tested (6+ tests)
- [ ] Selector tests written (5+ tests)
- [ ] DevTools action name verification
- [ ] All tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Manual DevTools verification complete

---

## Dependencies

- **Depends on:** Story 14e-6c (Selectors) - must be complete
- **Blocks:** Story 14e-8 (processScan extraction)
- **Note:** Story 14e-7 was consolidated into Story 14e-6c (selectors already complete)

---

## References

- [Story 14e-6c](./14e-6c-scan-zustand-selectors-exports.md) - Prerequisite
- [Original Story 14e-6](./14e-6-scan-zustand-store-definition.md) - Split source
- [Existing tests: tests/unit/hooks/useScanStateMachine.test.ts] - Reference for coverage
