# Story 14e-18: Credit Feature Extraction

Status: split

<!-- Created by atlas-create-story workflow 2026-01-25 -->
<!-- Atlas Analysis: 4 workflow impacts detected -->
<!-- SPLIT 2026-01-25: Exceeded sizing limits (6 tasks, 36 subtasks) -->
<!-- Split into: 14e-18a, 14e-18b, 14e-18c -->

> **SPLIT NOTICE:** This story was split into 3 smaller stories due to sizing limits.
>
> | Sub-Story | Description | Points |
> |-----------|-------------|--------|
> | [14e-18a](./14e-18a-credit-state-hook.md) | Feature structure + useCreditState hook | 2 |
> | [14e-18b](./14e-18b-credit-handlers.md) | Credit handlers extraction | 2 |
> | [14e-18c](./14e-18c-credit-feature-integration.md) | CreditFeature orchestrator + App.tsx integration | 3 |
>
> **Total:** 7 points (increased from 3 due to split overhead)

## Story

As a **developer**,
I want **credit/payment functionality extracted to a feature module**,
So that **credit logic is colocated, isolated, and App.tsx is further simplified**.

## Acceptance Criteria

### Core Feature Extraction (from Epic 14e epics.md)

1. **AC1**: `src/features/credit/` directory structure complete with:
   - `CreditFeature.tsx` (orchestrator component - headless)
   - `state/useCreditState.ts` (wraps `useUserCredits` hook)
   - `handlers/creditHandlers.ts` (credit warning dialog handlers)
   - `index.ts` barrel export

2. **AC2**: `useCreditState` hook wraps existing `useUserCredits` hook:
   - Exposes: `credits`, `loading`, `hasReservedCredits`
   - Exposes: `deductCredits`, `deductSuperCredits`, `addCredits`, `addSuperCredits`
   - Exposes: `reserveCredits`, `confirmReservedCredits`, `refundReservedCredits`
   - Exposes: `refreshCredits`
   - Unified interface for feature consumers

3. **AC3**: Credit handlers extracted from App.tsx:
   - `handleBatchConfirmWithCreditCheck` (line 1646)
   - `handleCreditWarningConfirm` (line 1653)
   - `handleCreditWarningCancel` (line 1696)
   - Integration with existing `CreditWarningDialog` component

4. **AC4**: App.tsx integration simplified:
   - Imports and uses `<CreditFeature />` or `useCreditState`
   - Credit-related state variables removed from App.tsx:
     - `showCreditWarning` (line 501)
     - `creditCheckResult` (line 502)
     - `creditUsedInSession` (line 482) - NOTE: May stay if needed by transaction conflict detection
   - Passes minimal props (user, services) to feature
   - ~50-80 lines reduced from App.tsx

5. **AC5**: All existing credit tests pass without modification

### Atlas Workflow Protection (from workflow chain analysis)

6. **AC6**: Nav component credit display unchanged - credit badges on FAB continue showing remaining/super credits
7. **AC7**: Batch processing credit warning flow unchanged - `CreditWarningDialog` opens and confirms correctly
8. **AC8**: Credit reserve/confirm/refund pattern in scan flow unchanged (Story 14.24 pattern works identically)
9. **AC9**: `creditUsedInSession` tracking continues for transaction conflict detection in EditView

## Tasks / Subtasks

- [ ] **Task 1: Create Feature Directory Structure** (AC: #1)
  - [ ] 1.1: Update `src/features/credit/index.ts` (currently stub) with proper exports
  - [ ] 1.2: Create `src/features/credit/state/` directory
  - [ ] 1.3: Create `src/features/credit/handlers/` directory
  - [ ] 1.4: Verify path alias `@features/credit` works

- [ ] **Task 2: Create useCreditState Hook** (AC: #2)
  - [ ] 2.1: Analyze existing `useUserCredits` hook interface (src/hooks/useUserCredits.ts)
  - [ ] 2.2: Create `src/features/credit/state/useCreditState.ts`
  - [ ] 2.3: Wrap `useUserCredits` with unified interface exposing:
    - `credits` (UserCredits object)
    - `loading` (boolean)
    - `hasReservedCredits` (boolean)
    - All credit operations: deduct, add, reserve, confirm, refund, refresh
  - [ ] 2.4: Export from feature index.ts
  - [ ] 2.5: Add unit tests for wrapper hook (verify passthrough behavior)

- [ ] **Task 3: Extract Credit Handlers** (AC: #3)
  - [ ] 3.1: Identify handler functions in App.tsx related to credits:
    - `handleBatchConfirmWithCreditCheck` (line 1646)
    - `handleCreditWarningConfirm` (line 1653)
    - `handleCreditWarningCancel` (line 1695)
  - [ ] 3.2: Create `src/features/credit/handlers/creditHandlers.ts`
  - [ ] 3.3: Create handler context type with dependencies:
    - `credits: UserCredits`
    - `checkCreditSufficiency` (from creditService)
    - `deductSuperCredits` function
    - `setShowCreditWarning` state setter
    - `setCreditCheckResult` state setter
    - Callbacks for batch processing flow
  - [ ] 3.4: Extract handlers with props-based dependency injection pattern
  - [ ] 3.5: Add unit tests for handlers

- [ ] **Task 4: Create CreditFeature Orchestrator** (AC: #1, #4)
  - [ ] 4.1: Create `src/features/credit/CreditFeature.tsx`
  - [ ] 4.2: Component uses `useCreditState` hook internally
  - [ ] 4.3: Manages local state: `showCreditWarning`, `creditCheckResult`
  - [ ] 4.4: Exposes credit state and handlers via context or render props
  - [ ] 4.5: Renders `CreditWarningDialog` when `showCreditWarning` is true
  - [ ] 4.6: Component is headless (no visible UI except dialog)
  - [ ] 4.7: Export from feature index.ts

- [ ] **Task 5: App.tsx Integration** (AC: #4, #5)
  - [ ] 5.1: Import `CreditFeature` and `useCreditState` in App.tsx
  - [ ] 5.2: Replace direct `useUserCredits` call with feature hook
  - [ ] 5.3: Update handler references to use feature handlers
  - [ ] 5.4: Remove credit warning state variables from App.tsx:
    - `showCreditWarning`
    - `creditCheckResult`
  - [ ] 5.5: Evaluate `creditUsedInSession` - keep if needed by EditView conflict detection
  - [ ] 5.6: Render `<CreditFeature />` in appropriate location
  - [ ] 5.7: Update BatchCaptureView to use feature handlers for credit check
  - [ ] 5.8: Verify line count reduction (~50-80 lines)

- [ ] **Task 6: Workflow Regression Testing** (AC: #6, #7, #8, #9)
  - [ ] 6.1: Test Nav credit badges - verify normal and super credits display correctly
  - [ ] 6.2: Test batch credit warning - select 2+ images, verify warning dialog appears
  - [ ] 6.3: Test credit reserve pattern - start scan, verify credit reserved not deducted
  - [ ] 6.4: Test credit confirm - complete scan, verify credit persisted to Firestore
  - [ ] 6.5: Test credit refund - fail scan, verify credit restored
  - [ ] 6.6: Test conflict detection - verify `creditUsedInSession` still works for transaction conflicts
  - [ ] 6.7: Run full test suite - all ~5,800+ tests pass

## Dev Notes

### Architecture Patterns to Follow

**Feature Module Pattern** (per Epic 14e architecture):
```
src/features/credit/
├── index.ts                  # Public API exports
├── CreditFeature.tsx         # Orchestrator component (renders CreditWarningDialog)
├── state/
│   └── useCreditState.ts     # Wraps useUserCredits hook
└── handlers/
    └── creditHandlers.ts     # Credit warning dialog handlers
```

**Hook Wrapper Pattern** (per Epic 14c-refactor.27):
- New hook wraps existing hook rather than replacing it
- Use `useMemo` for stable object references
- Maintain exact same interface for backward compatibility

**Handler Extraction Pattern** (per Epic 14c-refactor.20):
- Props-based dependency injection
- `useCallback` for handler stability
- Async handlers for Firestore operations

### Credit System Overview

**Credit Types:**
- `normal` credits: Single photo scans (1 credit per scan)
- `super` credits: Batch scans (1 super credit regardless of image count)

**Reserve Pattern (Story 14.24):**
1. `reserveCredits()` - UI shows deducted, Firestore NOT updated
2. On success: `confirmReservedCredits()` - Persist to Firestore
3. On failure: `refundReservedCredits()` - Restore UI state

**Credit Warning Dialog:**
- Appears before batch processing if insufficient super credits
- Options: Confirm (proceed with available), Cancel, Reduce batch size

### Source Files to Touch

**Files to Create:**
- `src/features/credit/state/useCreditState.ts`
- `src/features/credit/handlers/creditHandlers.ts`
- `src/features/credit/CreditFeature.tsx`

**Files to Modify:**
- `src/features/credit/index.ts` (update from stub)
- `src/App.tsx` (~50-80 lines reduced)

**Files to Reference (DO NOT MODIFY unless needed):**
- `src/hooks/useUserCredits.ts` (source hook - 375 lines)
- `src/services/creditService.ts` (pure functions - 153 lines)
- `src/services/userCreditsService.ts` (Firestore persistence - 223 lines)
- `src/components/batch/CreditWarningDialog.tsx`
- `src/components/modals/CreditInfoModal.tsx` (already in ModalManager from 14e-4)

### Testing Standards

- Unit tests for `useCreditState` hook (verify wrapper behavior)
- Unit tests for extracted handlers (mock dependencies)
- Integration: All existing credit tests must pass unchanged
- Smoke tests: Scan flow credit deduction, batch credit warning, credit info modal

### Project Structure Notes

**Alignment with Epic 14e Architecture:**
- Uses `src/features/credit/` per architecture-decision.md
- Follows Feature Slicing pattern (colocated state + handlers)
- Does NOT require Zustand store (wrapper around existing hook)

**Dependencies:**
- Story 14e-1 MUST be complete (directory structure exists)
- Story 14e-4 already migrated CreditInfoModal to ModalManager
- `CreditWarningDialog` stays as-is (rendered by CreditFeature)

### Known Complexity: creditUsedInSession

The `creditUsedInSession` state variable in App.tsx is used for:
1. Transaction conflict detection in EditView
2. Determining if user loses credit when navigating away

**Recommendation:** Keep in App.tsx initially OR move to a shared UI state context if it complicates the extraction. Document decision in completion notes.

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e.18]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#Target-Structure]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md#Scan-Receipt-Flow]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md#Batch-Processing-Flow]
- [Source: src/hooks/useUserCredits.ts - Story 14.24 reserve pattern]

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

- **Workflow #1 (Scan Receipt Flow)**: Credit check before scan start, deduct immediately to prevent exploits
- **Workflow #3 (Batch Processing Flow)**: Super credit check via `checkCreditSufficiency`, warning dialog before batch
- **Workflow #9 (Scan Request Lifecycle)**: Credit reserve/confirm/refund pattern integrated with scan phases
- **Workflow #2 (Quick Save Flow)**: Indirect - uses credit state for UI display

### Downstream Effects to Consider

- Nav.tsx displays credit badges on FAB - uses `userCredits.remaining` and `userCredits.superRemaining`
- BatchCaptureView checks credits before processing - calls `handleBatchConfirmWithCreditCheck`
- TransactionEditorView uses `creditUsedInSession` for conflict detection
- ScanResultView passes credits to child components
- BatchReviewView integrates with CreditWarningDialog

### Testing Implications

- **Existing tests to verify:** Tests in `tests/unit/hooks/useUserCredits.test.ts`, `tests/unit/services/creditService.test.ts`
- **New test scenarios:** `useCreditState` wrapper behavior, `creditHandlers` with mocked dependencies

### Workflow Chain Visualization

```
[FAB Tap] → Scan Request Lifecycle → [reserveCredits] → [THIS STORY - useCreditState]
                                            ↓
                                    [Scan Success]
                                            ↓
                                  [confirmReservedCredits]
                                            ↓
                                    [Firestore Update]

[Batch Capture] → [handleBatchConfirmWithCreditCheck] → [THIS STORY - creditHandlers]
                              ↓
                    [CreditWarningDialog]
                              ↓
                    [Confirm/Cancel/Reduce]
```

## Dev Agent Record

### Agent Model Used

<!-- Filled by dev agent -->

### Debug Log References

<!-- Filled by dev agent -->

### Completion Notes List

<!-- Filled by dev agent -->

### File List

<!-- Filled by dev agent -->
