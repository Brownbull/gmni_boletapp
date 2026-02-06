# Story 14e-18c: Credit Feature Orchestrator & App.tsx Integration

Status: done

<!-- Created by atlas-create-story workflow 2026-01-25 -->
<!-- Split from 14e-18: Part 3 of 3 -->
<!-- DEPENDS: 14e-18a, 14e-18b -->

## Story

As a **developer**,
I want **a CreditFeature orchestrator component and App.tsx integration completed**,
So that **credit logic is fully extracted and App.tsx is simplified by ~50-80 lines**.

## Acceptance Criteria

### Core Integration

1. **AC1**: `CreditFeature.tsx` orchestrator component created:
   - Uses `useCreditState` hook internally
   - Manages local state: `showCreditWarning`, `creditCheckResult`
   - Uses extracted handlers from creditHandlers.ts
   - Renders `CreditWarningDialog` when needed
   - Headless component (no visible UI except dialog)

2. **AC2**: App.tsx integration complete:
   - Imports and uses `useCreditState` from feature
   - Renders `<CreditFeature />` in provider area
   - Credit warning state variables removed from App.tsx
   - ~50-80 lines removed from App.tsx

3. **AC3**: All existing credit functionality works identically

### Atlas Workflow Protection

4. **AC4**: Nav component credit display unchanged - badges show remaining/super credits
5. **AC5**: Batch processing credit warning flow unchanged
6. **AC6**: Credit reserve/confirm/refund pattern in scan flow unchanged
7. **AC7**: `creditUsedInSession` tracking continues (may stay in App.tsx if needed)

## Tasks / Subtasks

- [x] **Task 1: Create CreditFeature Orchestrator** (AC: #1)
  - [x] 1.1: Create `src/features/credit/CreditFeature.tsx`
  - [x] 1.2: Add local state: `showCreditWarning`, `creditCheckResult`
  - [x] 1.3: Use `useCreditState` hook for credit data
  - [x] 1.4: Wire up handlers from `creditHandlers.ts`
  - [x] 1.5: Render `CreditWarningDialog` when `showCreditWarning` is true
  - [x] 1.6: Export CreditFeatureContext for consumers
  - [x] 1.7: Export from feature index.ts

- [x] **Task 2: App.tsx Integration** (AC: #2, #3)
  - [x] 2.1: Use trigger-based pattern for CreditFeature integration
  - [x] 2.2: Add `<CreditFeature />` in appropriate location
  - [x] 2.3: Remove credit warning state from App.tsx:
    - `showCreditWarning` - removed
    - `creditCheckResult` - removed
  - [x] 2.4: Update handlers to use CreditFeature callbacks
  - [x] 2.5: Evaluate `creditUsedInSession` - kept in App.tsx (conflict detection)
  - [x] 2.6: Verify line count reduction (~70 lines removed)

- [x] **Task 3: Workflow Regression Testing** (AC: #4, #5, #6, #7)
  - [x] 3.1: Nav credit badges - verified via test suite
  - [x] 3.2: Batch credit warning - tested via CreditFeature tests (36 tests)
  - [x] 3.3: Credit reserve pattern - verified via test suite
  - [x] 3.4: Credit confirm/refund - verified via test suite
  - [x] 3.5: Conflict detection - `creditUsedInSession` kept in App.tsx
  - [x] 3.6: Run full test suite - 5836 tests pass

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Stage untracked files: `git add src/features/credit/CreditFeature.tsx tests/unit/features/credit/CreditFeature.test.tsx` - Core deliverables not staged for commit
- [x] [AI-Review][MEDIUM] Stage modified files: `git add src/components/App/AppOverlays.tsx tests/unit/components/App/AppOverlays.test.tsx` - Changes not staged
- [x] [Archie-Review][MEDIUM] Update Dev Notes code example: Remove `deductSuperCredits` from `CreditHandlerContext` example (lines 116-122) to match actual implementation - handlers don't use it [story:Dev Notes]

## Dev Notes

### CreditFeature Component Pattern

```typescript
// src/features/credit/CreditFeature.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useCreditState, UseCreditStateResult } from './state/useCreditState';
import {
  CreditHandlerContext,
  createBatchConfirmWithCreditCheck,
  createCreditWarningConfirm,
  createCreditWarningCancel,
} from './handlers/creditHandlers';
import { CreditCheckResult } from '../../services/creditService';
import { CreditWarningDialog } from '../../components/batch/CreditWarningDialog';

interface CreditFeatureContextValue extends UseCreditStateResult {
  showCreditWarning: boolean;
  creditCheckResult: CreditCheckResult | null;
  handleBatchConfirmWithCreditCheck: () => void;
  handleCreditWarningConfirm: () => void;
  handleCreditWarningCancel: () => void;
}

const CreditFeatureContext = createContext<CreditFeatureContextValue | null>(null);

export function useCreditFeature() {
  const ctx = useContext(CreditFeatureContext);
  if (!ctx) throw new Error('useCreditFeature must be used within CreditFeature');
  return ctx;
}

interface CreditFeatureProps {
  user: User | null;
  services: { db: any; appId: string } | null;
  onBatchConfirmed?: () => void;
  children?: React.ReactNode;
}

export function CreditFeature({ user, services, onBatchConfirmed, children }: CreditFeatureProps) {
  const creditState = useCreditState(user, services);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [creditCheckResult, setCreditCheckResult] = useState<CreditCheckResult | null>(null);

  const handlerContext: CreditHandlerContext = useMemo(() => ({
    credits: creditState.credits,
    setShowCreditWarning,
    setCreditCheckResult,
    onBatchConfirmed: wrappedOnBatchConfirmed,
  }), [creditState.credits, wrappedOnBatchConfirmed]);

  const handlers = useMemo(() => ({
    handleBatchConfirmWithCreditCheck: createBatchConfirmWithCreditCheck(handlerContext),
    handleCreditWarningConfirm: createCreditWarningConfirm(handlerContext),
    handleCreditWarningCancel: createCreditWarningCancel(handlerContext),
  }), [handlerContext]);

  const value: CreditFeatureContextValue = useMemo(() => ({
    ...creditState,
    showCreditWarning,
    creditCheckResult,
    ...handlers,
  }), [creditState, showCreditWarning, creditCheckResult, handlers]);

  return (
    <CreditFeatureContext.Provider value={value}>
      {children}
      {showCreditWarning && creditCheckResult && (
        <CreditWarningDialog
          isOpen={showCreditWarning}
          creditCheckResult={creditCheckResult}
          onConfirm={handlers.handleCreditWarningConfirm}
          onCancel={handlers.handleCreditWarningCancel}
        />
      )}
    </CreditFeatureContext.Provider>
  );
}
```

### creditUsedInSession Decision

The `creditUsedInSession` state is used for transaction conflict detection in EditView. Options:

1. **Keep in App.tsx** - Simpler, less refactoring, used only for conflict detection
2. **Move to CreditFeature** - More cohesive, but requires passing through context

**Recommendation:** Keep in App.tsx initially. It's used for conflict detection which spans scan and edit flows. Document this decision in completion notes.

### Files to Create

- `src/features/credit/CreditFeature.tsx`

### Files to Modify

- `src/features/credit/index.ts` (add CreditFeature export)
- `src/App.tsx` (~50-80 lines removed)

### Dependencies

- Story 14e-18a MUST be complete (useCreditState)
- Story 14e-18b MUST be complete (creditHandlers)

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e.18]
- [Source: src/components/batch/CreditWarningDialog.tsx]
- [Pattern: Epic 14e-3 - Modal Manager orchestrator pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug issues encountered

### Completion Notes List

1. **CreditFeature Orchestrator Created** - Component manages credit warning dialog state internally, uses `useCreditState` hook, and renders `CreditWarningDialog` when triggered. Supports external triggering via `triggerCreditCheck` prop.

2. **App.tsx Integration Complete** - Added trigger-based pattern for credit check flow:
   - `shouldTriggerCreditCheck` state triggers the credit check
   - `handleBatchProcessingStart` callback passed to CreditFeature for batch processing
   - `handleCreditCheckComplete` callback resets trigger state
   - ~70 lines of credit-related code removed from App.tsx

3. **creditUsedInSession Decision** - Kept in App.tsx as recommended. This state is used for transaction conflict detection which spans scan and edit flows. Moving it to CreditFeature would require additional complexity without clear benefit.

4. **AppOverlays Updated** - Removed credit warning dialog props and rendering. Dialog now renders from CreditFeature component.

5. **Test Coverage** - 36 new tests added for CreditFeature component covering:
   - Context provider functionality
   - Dialog state management
   - External trigger mechanism (triggerCreditCheck prop)
   - Handler integration (confirm, cancel, reduce batch)

6. **Code Review Follow-ups Resolved** (2026-01-27):
   - Staged untracked CreditFeature.tsx and test files
   - Staged modified AppOverlays.tsx and test files
   - Updated Dev Notes to remove `deductSuperCredits` from `CreditHandlerContext` example (aligns with actual implementation)
   - All 5836 tests pass

### File List

**Created:**
- `src/features/credit/CreditFeature.tsx` - Credit feature orchestrator component
- `tests/unit/features/credit/CreditFeature.test.tsx` - Unit tests for CreditFeature

**Modified:**
- `src/features/credit/index.ts` - Added CreditFeature exports
- `src/App.tsx` - Integrated CreditFeature, removed credit warning state/handlers
- `src/components/App/AppOverlays.tsx` - Removed credit warning dialog props and rendering
- `tests/unit/components/App/AppOverlays.test.tsx` - Removed credit warning dialog tests
