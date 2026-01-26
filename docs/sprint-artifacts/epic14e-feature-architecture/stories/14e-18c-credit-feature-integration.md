# Story 14e-18c: Credit Feature Orchestrator & App.tsx Integration

Status: ready-for-dev

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

- [ ] **Task 1: Create CreditFeature Orchestrator** (AC: #1)
  - [ ] 1.1: Create `src/features/credit/CreditFeature.tsx`
  - [ ] 1.2: Add local state: `showCreditWarning`, `creditCheckResult`
  - [ ] 1.3: Use `useCreditState` hook for credit data
  - [ ] 1.4: Wire up handlers from `creditHandlers.ts`
  - [ ] 1.5: Render `CreditWarningDialog` when `showCreditWarning` is true
  - [ ] 1.6: Export CreditFeatureContext for consumers
  - [ ] 1.7: Export from feature index.ts

- [ ] **Task 2: App.tsx Integration** (AC: #2, #3)
  - [ ] 2.1: Replace `useUserCredits` call with `useCreditState` from feature
  - [ ] 2.2: Add `<CreditFeature />` in appropriate location
  - [ ] 2.3: Remove credit warning state from App.tsx:
    - `showCreditWarning` (line 501)
    - `creditCheckResult` (line 502)
  - [ ] 2.4: Update BatchCaptureView to use CreditFeature handlers
  - [ ] 2.5: Evaluate `creditUsedInSession` - document decision
  - [ ] 2.6: Verify line count reduction (~50-80 lines)

- [ ] **Task 3: Workflow Regression Testing** (AC: #4, #5, #6, #7)
  - [ ] 3.1: Test Nav credit badges - verify display correct
  - [ ] 3.2: Test batch credit warning - dialog appears and works
  - [ ] 3.3: Test credit reserve pattern - start scan works
  - [ ] 3.4: Test credit confirm/refund - scan complete/fail works
  - [ ] 3.5: Test conflict detection - `creditUsedInSession` works if kept
  - [ ] 3.6: Run full test suite - all tests pass

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
    deductSuperCredits: creditState.deductSuperCredits,
    setShowCreditWarning,
    setCreditCheckResult,
    onBatchConfirmed,
  }), [creditState.credits, creditState.deductSuperCredits, onBatchConfirmed]);

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

<!-- Filled by dev agent -->

### Debug Log References

<!-- Filled by dev agent -->

### Completion Notes List

<!-- Filled by dev agent -->

### File List

<!-- Filled by dev agent -->
