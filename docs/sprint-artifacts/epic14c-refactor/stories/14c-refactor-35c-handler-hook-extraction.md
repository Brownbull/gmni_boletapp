# Story 14c-refactor.35c: Final Cleanup - Handler Hook Extraction

Status: done

## Story

As a **developer maintaining App.tsx**,
I want **remaining handler groups extracted to dedicated hooks**,
So that **App.tsx is reduced and handlers are organized by domain**.

## Background

### Part of Story 35 Split

This story is Part C of 4 stories split from the original story 14c-refactor.35 (Final App.tsx Line Count Target). The split was performed via `atlas-story-sizing` workflow because the original story exceeded sizing guidelines.

**Split breakdown:**
- **35a:** Audit & Documentation (Task 1) - PREREQUISITE
- **35b:** View Render Functions (Task 2) - CAN PARALLEL with 35c
- **35c (this story):** Handler Hook Extraction (Task 3)
- **35d:** Dead Code & Verification (Tasks 4-5)

### Focus

After stories 20-21, several handler hooks were created (useTransactionHandlers, useScanHandlers, useNavigationHandlers, useDialogHandlers). This story evaluates extracting additional handler groups that remain in App.tsx.

## Acceptance Criteria

1. **Given** handler functions remain in App.tsx
   **When** this story is completed
   **Then:**
   - Handler groups extracted to dedicated hooks where feasible
   - Remaining handlers documented as "must stay inline" with reason

2. **Given** new hooks are created
   **When** the build runs
   **Then:**
   - TypeScript compiles without errors
   - Each hook has unit tests
   - All existing tests pass

## Tasks / Subtasks

### Task 1: Extract More Handler Hooks (if needed)

Evaluate extracting based on Story 35a audit:
- [x] 1.1 Insight-related handlers - `useInsightHandlers()` if > 50 lines total
  - **DECISION: NO EXTRACTION** - See rationale below
- [x] 1.2 Credit-related handlers - `useCreditHandlers()` if > 50 lines total
  - **DECISION: NO EXTRACTION** - See rationale below
- [x] 1.3 Session-related handlers - `useSessionHandlers()` if > 50 lines total
  - **DECISION: NO EXTRACTION** - See rationale below
- [x] 1.4 Each extraction must reduce lines without adding complexity
  - All three handler groups evaluated against criteria
  - Decision rationale documented in Dev Agent Record

## Dev Notes

### Estimation

- **Points:** 2 pts
- **Risk:** LOW - Following established patterns from Stories 20-21

### Dependencies

- **Requires:**
  - Story 35a (Audit) - MUST be done (provides handler inventory)
- **Blocks:** Story 35d (Final verification)

### Extraction Criteria

Extract to hook IF:
- Handler group is > 50 lines total
- Handlers are cohesive (same domain)
- Handlers don't require excessive props from App.tsx state

Keep inline IF:
- Handler group is < 50 lines
- Handlers are tightly coupled to App.tsx state
- Extraction would require > 10 props to be useful

### Established Patterns

Follow the patterns from existing handler hooks:
- `useTransactionHandlers` - Story 14c-refactor.20
- `useScanHandlers` - Story 14c-refactor.22a
- `useNavigationHandlers` - Story 14c-refactor.21
- `useDialogHandlers` - Story 14c-refactor.21

## References

- [Story 35a](14c-refactor-35a-audit-documentation.md) - Audit provides handler inventory
- [Story 20](14c-refactor-20-app-handler-extraction.md) - Handler extraction patterns
- [Story 21](14c-refactor-21-app-navigation-dialog-handlers.md) - Navigation/dialog patterns

## File List

**Modified:**
- None - Analysis-only story, no code changes required

**Created:**
- None - All handler groups failed extraction criteria (see Dev Agent Record)

## Dev Agent Record

### Implementation Plan

Analyzed all three handler groups against extraction criteria from Dev Notes:
1. Count handler lines
2. Assess cohesiveness
3. Count required props for extraction
4. Apply decision criteria

### Completion Notes

**Date:** 2026-01-24

**Analysis Results:**

#### 1. Insight-related handlers - NO EXTRACTION

**Lines counted:** ~20 lines (state + setters)
- `currentInsight`, `setCurrentInsight` - useState declaration
- `showInsightCard`, `setShowInsightCard` - useState declaration
- Callbacks are just the setters passed directly

**Reason:** < 50 lines threshold. These are essentially state variables and their setters, not substantial handler logic. The actual insight generation happens in `insightEngineService.ts` and is called inline during scan flows.

#### 2. Credit-related handlers - NO EXTRACTION

**Lines counted:** ~86 lines (handlers at lines 2177-2263)
- `handleBatchConfirmWithCreditCheck` (~8 lines)
- `handleCreditWarningConfirm` (~52 lines)
- `handleCreditWarningCancel` (~5 lines)
- `handleReduceBatch` (~13 lines)

**Reason:** Exceeds 50-line threshold BUT `handleCreditWarningConfirm` requires **14+ props**:
1. `setShowCreditWarning`
2. `setCreditCheckResult`
3. `setShowBatchPreview`
4. `setView`
5. `dispatchProcessStart` (ScanContext)
6. `batchImages`
7. `scanCurrency`
8. `scanStoreType`
9. `viewMode`
10. `activeGroup`
11. `dispatchBatchItemStart` (ScanContext)
12. `dispatchBatchItemSuccess` (ScanContext)
13. `dispatchBatchItemError` (ScanContext)
14. `dispatchBatchComplete` (ScanContext)
15. `batchProcessing.startProcessing`
16. `createBatchReceiptsFromResults`

This violates the ">10 props makes extraction questionable" criterion. The handler is deeply coupled to batch processing flow and App.tsx state.

#### 3. Session-related handlers - NO EXTRACTION

**Lines counted:** ~15 lines
- `showSessionComplete`, `setShowSessionComplete` - useState declaration
- `sessionContext`, `setSessionContext` - useState declaration
- Callback at line 3296: `onSessionCompleteDismiss={() => { setShowSessionComplete(false); setSessionContext(null); }}`
- Callback at line 3300: `onSessionCompleteAction` (inline handler)

**Reason:** < 50 lines threshold. These are state variables with simple inline setters. The session context is just a display state, not complex handler logic.

### Summary

All three handler groups evaluated. **No extractions performed** because:
- Insight handlers: Below 50-line threshold (state + setters only)
- Credit handlers: Would require 14+ props, violating extraction criteria
- Session handlers: Below 50-line threshold (state + setters only)

The remaining handlers in App.tsx are appropriately sized or tightly coupled to App.tsx state, making extraction impractical without significant complexity increase.

### AC Verification

✅ **AC1:** Handler groups evaluated and documented
- Insight handlers: Must stay inline (< 50 lines)
- Credit handlers: Must stay inline (> 10 props required)
- Session handlers: Must stay inline (< 50 lines)

✅ **AC2:** No new hooks created (all handler groups failed extraction criteria)
- TypeScript compiles without errors (no code changes)
- No new tests needed (no new hooks)
- All existing tests pass (no changes)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-24 | Story analysis complete - no extractions needed | Atlas Dev |
| 2026-01-24 | Code Review: Fixed File List (was claiming modifications that didn't happen), updated status to done | Atlas Code Review |
